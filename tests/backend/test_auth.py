from app.auth import create_access_token, hash_password
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
            email="viewer@example.test",
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
                email="operator@example.test",
                password_hash=hash_password("correct-password"),
                role="operator",
            )
        )
        db_session.commit()

        response = scenario_client.post(
            "/api/auth/login",
            json={"email": "OPERATOR@example.test", "password": "correct-password"},
        )

        assert response.status_code == 200
        assert "access_token" in response.cookies
        assert scenario_client.get("/api/auth/me").json() == {
            "email": "operator@example.test",
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
            email="admin@example.test",
            password_hash=hash_password("correct-password"),
            role="admin",
        )
        db_session.add(admin)
        db_session.commit()
        token = create_access_token(admin)

        response = scenario_client.post(
            "/api/auth/users",
            headers={"Authorization": f"Bearer {token}"},
            json={"email": "new@example.test", "password": "too-short"},
        )

        assert response.status_code == 422
    finally:
        get_settings.cache_clear()
