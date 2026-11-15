import pytest
from app.auth import create_access_token, hash_password, verify_password
from app.config import get_settings
from app.models import User


def test_jwt_protects_http_routes_and_enforces_roles(
    monkeypatch, scenario_client, db_session
):
    monkeypatch.setenv("APP_ENVIRONMENT", "development")
    monkeypatch.setenv("AUTH_JWT_SECRET", "a" * 32)
    get_settings.cache_clear()

    try:
        viewer = User(
            login="viewer",
            password_hash="not-used",
            role="viewer",
        )
        db_session.add(viewer)
        db_session.commit()
        token = create_access_token(viewer)

        assert scenario_client.get("/api/status").status_code == 401
        assert (
            scenario_client.get(
                "/api/status", headers={"Authorization": f"Bearer {token}"}
            ).status_code
            == 200
        )
        assert (
            scenario_client.post(
                "/api/v1/scenarios",
                headers={"Authorization": f"Bearer {token}"},
                json={"name_of_scenario": "Viewer cannot create"},
            ).status_code
            == 403
        )
    finally:
        get_settings.cache_clear()


def test_login_sets_cookie_and_returns_current_user(
    monkeypatch, scenario_client, db_session
):
    monkeypatch.setenv("AUTH_JWT_SECRET", "a" * 32)
    get_settings.cache_clear()
    try:
        db_session.add(
            User(
                login="operator",
                password_hash=hash_password("correct-password"),
                role="operator",
            )
        )
        db_session.commit()

        response = scenario_client.post(
            "/api/auth/login",
            json={"login": "OPERATOR", "password": "correct-password"},
        )

        assert response.status_code == 200
        assert "access_token" in response.cookies
        assert scenario_client.get("/api/auth/me").json() == {
            "login": "operator",
            "role": "operator",
            "authentication_enabled": True,
        }
    finally:
        get_settings.cache_clear()


def test_new_user_requires_a_strong_password(monkeypatch, scenario_client, db_session):
    monkeypatch.setenv("AUTH_JWT_SECRET", "a" * 32)
    get_settings.cache_clear()
    try:
        admin = User(
            login="admin",
            password_hash=hash_password("correct-password"),
            role="admin",
        )
        db_session.add(admin)
        db_session.commit()
        token = create_access_token(admin)

        response = scenario_client.post(
            "/api/auth/users",
            headers={"Authorization": f"Bearer {token}"},
            json={"login": "new", "password": "too-short"},
        )

        assert response.status_code == 422
        assert "too-short" not in response.text
    finally:
        get_settings.cache_clear()


def test_admin_can_list_users(monkeypatch, scenario_client, db_session):
    monkeypatch.setenv("APP_ENVIRONMENT", "development")
    monkeypatch.setenv("AUTH_JWT_SECRET", "a" * 32)
    get_settings.cache_clear()

    try:
        admin = User(
            login="admin",
            password_hash="not-used",
            role="admin",
        )
        db_session.add(admin)
        db_session.commit()

        token = create_access_token(admin)

        response = scenario_client.get(
            "/api/auth/users",
            headers={"Authorization": f"Bearer {token}"},
        )

        assert response.status_code == 200
        assert response.json() == [
            {
                "id": admin.id,
                "login": "admin",
                "role": "admin",
                "is_active": True,
            }
        ]
    finally:
        get_settings.cache_clear()


@pytest.mark.parametrize("role", ["operator", "viewer"])
def test_non_admin_cannot_list_or_disable_users(
    role, monkeypatch, scenario_client, db_session
):
    monkeypatch.setenv("APP_ENVIRONMENT", "development")
    monkeypatch.setenv("AUTH_JWT_SECRET", "a" * 32)
    get_settings.cache_clear()

    try:
        user = User(
            login=role,
            password_hash="not-used",
            role=role,
        )
        db_session.add(user)
        db_session.commit()

        token = create_access_token(user)

        response = scenario_client.get(
            "/api/auth/users",
            headers={"Authorization": f"Bearer {token}"},
        )
        assert response.status_code == 403

        status_response = scenario_client.patch(
            f"/api/auth/users/{user.id}/status",
            headers={"Authorization": f"Bearer {token}"},
            json={"is_active": False},
        )

        assert status_response.status_code == 403
        db_session.refresh(user)
        assert user.is_active is True

        reset_response = scenario_client.post(
            f"/api/auth/users/{user.id}/reset-password",
            headers={"Authorization": f"Bearer {token}"},
            json={"new_password": "new-password-456"},
        )

        assert reset_response.status_code == 403
        db_session.refresh(user)
        assert user.password_hash == "not-used"
    finally:
        get_settings.cache_clear()


def test_listing_or_disabling_users_requires_authentication(
    monkeypatch, scenario_client
):
    monkeypatch.setenv("APP_ENVIRONMENT", "development")
    monkeypatch.setenv("AUTH_JWT_SECRET", "a" * 32)
    get_settings.cache_clear()

    try:
        response = scenario_client.get("/api/auth/users")

        assert response.status_code == 401

        status_response = scenario_client.patch(
            "/api/auth/users/1/status",
            json={"is_active": False},
        )

        assert status_response.status_code == 401

        reset_response = scenario_client.post(
            "/api/auth/users/1/reset-password",
            json={"new_password": "new-password-456"},
        )

        assert reset_response.status_code == 401

        change_response = scenario_client.post(
            "/api/auth/change-password",
            json={
                "current_password": "old-password-123",
                "new_password": "new-password-456",
            },
        )

        assert change_response.status_code == 401
    finally:
        get_settings.cache_clear()


def test_cannot_disable_last_active_admin(monkeypatch, scenario_client, db_session):
    monkeypatch.setenv("APP_ENVIRONMENT", "development")
    monkeypatch.setenv("AUTH_JWT_SECRET", "a" * 32)
    get_settings.cache_clear()

    try:
        admin = User(
            login="admin",
            password_hash="not-used",
            role="admin",
        )
        db_session.add(admin)
        db_session.commit()

        response = scenario_client.patch(
            f"/api/auth/users/{admin.id}/status",
            headers={"Authorization": f"Bearer {create_access_token(admin)}"},
            json={"is_active": False},
        )

        assert response.status_code == 409
        db_session.refresh(admin)
        assert admin.is_active is True
    finally:
        get_settings.cache_clear()


@pytest.mark.parametrize("is_active", [False, True])
def test_admin_can_change_user_status(
    is_active, monkeypatch, scenario_client, db_session
):
    monkeypatch.setenv("APP_ENVIRONMENT", "development")
    monkeypatch.setenv("AUTH_JWT_SECRET", "a" * 32)
    get_settings.cache_clear()

    try:
        admin = User(
            login="admin",
            password_hash="not-used",
            role="admin",
        )
        user = User(
            login="viewer",
            password_hash="not-used",
            role="viewer",
            is_active=not is_active,
        )
        db_session.add_all([admin, user])
        db_session.commit()

        user_token = create_access_token(user)

        response = scenario_client.patch(
            f"/api/auth/users/{user.id}/status",
            headers={"Authorization": f"Bearer {create_access_token(admin)}"},
            json={"is_active": is_active},
        )

        assert response.status_code == 200
        assert response.json() == {
            "id": user.id,
            "login": "viewer",
            "role": "viewer",
            "is_active": is_active,
        }

        db_session.refresh(user)
        assert user.is_active is is_active

        access_response = scenario_client.get(
            "/api/auth/me",
            headers={"Authorization": f"Bearer {user_token}"},
        )
        assert access_response.status_code == (200 if is_active else 401)
    finally:
        get_settings.cache_clear()


def test_admin_can_reset_disabled_user_password(
    monkeypatch, scenario_client, db_session
):
    monkeypatch.setenv("APP_ENVIRONMENT", "development")
    monkeypatch.setenv("AUTH_JWT_SECRET", "a" * 32)
    get_settings.cache_clear()

    try:
        old_password = "old-password-123"
        new_password = "new-password-456"

        admin = User(
            login="admin",
            password_hash="not-used",
            role="admin",
        )
        user = User(
            login="viewer",
            password_hash=hash_password(old_password),
            role="viewer",
            is_active=False,
        )
        db_session.add_all([admin, user])
        db_session.commit()

        response = scenario_client.post(
            f"/api/auth/users/{user.id}/reset-password",
            headers={"Authorization": f"Bearer {create_access_token(admin)}"},
            json={"new_password": new_password},
        )

        assert response.status_code == 204
        assert response.content == b""

        db_session.refresh(user)
        assert user.password_hash != new_password
        assert verify_password(new_password, user.password_hash)
        assert not verify_password(old_password, user.password_hash)
        assert user.is_active is False
    finally:
        get_settings.cache_clear()


def test_user_can_change_own_password(monkeypatch, scenario_client, db_session):
    monkeypatch.setenv("APP_ENVIRONMENT", "development")
    monkeypatch.setenv("AUTH_JWT_SECRET", "a" * 32)
    get_settings.cache_clear()

    try:
        old_password = "old-password-123"
        new_password = "new-password-456"

        other_user = User(
            login="other",
            password_hash="not-used",
            role="viewer",
        )
        user = User(
            login="viewer",
            password_hash=hash_password(old_password),
            role="viewer",
        )
        db_session.add_all([other_user, user])
        db_session.commit()

        response = scenario_client.post(
            "/api/auth/change-password",
            headers={"Authorization": f"Bearer {create_access_token(user)}"},
            json={
                "current_password": old_password,
                "new_password": new_password,
            },
        )

        assert response.status_code == 204
        assert response.content == b""

        db_session.refresh(user)
        assert user.password_hash != new_password
        assert verify_password(new_password, user.password_hash)
        assert not verify_password(old_password, user.password_hash)

        db_session.refresh(other_user)
        assert other_user.password_hash == "not-used"
    finally:
        get_settings.cache_clear()


def test_wrong_current_password_does_not_change_password(
    monkeypatch, scenario_client, db_session
):
    monkeypatch.setenv("APP_ENVIRONMENT", "development")
    monkeypatch.setenv("AUTH_JWT_SECRET", "a" * 32)
    get_settings.cache_clear()

    try:
        original_hash = hash_password("old-password-123")
        user = User(
            login="viewer",
            password_hash=original_hash,
            role="viewer",
        )
        db_session.add(user)
        db_session.commit()

        response = scenario_client.post(
            "/api/auth/change-password",
            headers={"Authorization": f"Bearer {create_access_token(user)}"},
            json={
                "current_password": "wrong-password",
                "new_password": "new-password-456",
            },
        )

        assert response.status_code == 400
        assert response.json() == {"detail": "Incorrect current password"}

        db_session.refresh(user)
        assert user.password_hash == original_hash
    finally:
        get_settings.cache_clear()


@pytest.mark.parametrize(
    "path",
    ["/api/ws/simulation", "/api/v1/ws/runs/test-run"],
)
@pytest.mark.parametrize("broadcast", [False, True])
def test_disabled_user_loses_websocket_access(
    path, broadcast, monkeypatch, scenario_client, db_session
):
    from fastapi import WebSocketDisconnect
    from sqlalchemy.orm import sessionmaker

    from app.routers import simulation
    from app.schemas import SimulationRunResponse
    from app.services.simulation import notifications

    monkeypatch.setenv("APP_ENVIRONMENT", "development")
    monkeypatch.setenv("AUTH_JWT_SECRET", "a" * 32)
    get_settings.cache_clear()

    try:
        monkeypatch.setattr(
            notifications,
            "SessionLocal",
            sessionmaker(bind=db_session.get_bind()),
        )

        run_status = SimulationRunResponse(
            running=True,
            status="running",
            error=None,
            map="Town01",
            run_id="test-run",
        )
        monkeypatch.setattr(simulation, "_run_response", lambda run_id: run_status)

        user = User(
            login="viewer",
            password_hash="not-used",
            role="viewer",
        )
        db_session.add(user)
        db_session.commit()

        headers = {"Authorization": f"Bearer {create_access_token(user)}"}

        with scenario_client.websocket_connect(path, headers=headers) as websocket:
            assert isinstance(websocket.receive_json(), dict)

            user.is_active = False
            db_session.commit()

            if broadcast:
                simulation._broadcast_state()

            with pytest.raises(WebSocketDisconnect) as closed:
                websocket.receive_json()

            assert closed.value.code == 1008
    finally:
        simulation._notifier.clear()
        get_settings.cache_clear()
