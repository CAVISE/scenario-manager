FROM ghcr.io/astral-sh/uv:python3.11-bookworm-slim AS production-builder
ENV UV_LINK_MODE=copy
WORKDIR /app

COPY pyproject.toml uv.lock ./
RUN --mount=type=cache,target=/root/.cache/uv \
    uv sync --frozen --no-dev --extra simulation --no-install-project

FROM ghcr.io/astral-sh/uv:python3.11-bookworm-slim AS test-builder
ENV UV_LINK_MODE=copy
WORKDIR /app

COPY pyproject.toml uv.lock ./
RUN --mount=type=cache,target=/root/.cache/uv \
    uv sync --frozen --group dev --no-install-project

FROM python:3.11-slim-bookworm AS runtime-base

ARG APP_UID=10001
ARG APP_GID=10001

RUN apt-get update && apt-get install -y --no-install-recommends \
    libgl1 \
    libglib2.0-0 \
    libgomp1 \
    && rm -rf /var/lib/apt/lists/* \
    && groupadd --gid "${APP_GID}" appuser \
    && useradd --uid "${APP_UID}" --gid "${APP_GID}" \
    --create-home --shell /usr/sbin/nologin appuser

ENV PATH="/app/.venv/bin:$PATH" \
    HOME="/home/appuser" \
    PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1

WORKDIR /app

FROM runtime-base AS production
COPY --from=production-builder /app/.venv /app/.venv
COPY app ./app
COPY migrations ./migrations
COPY opencda ./opencda
COPY alembic.ini ./
COPY main.py ./
COPY --chmod=755 entrypoint.sh entrypoint.sh

RUN mkdir -p evaluation_outputs logs assets/xodrs \
    && chown -R appuser:appuser evaluation_outputs logs assets

EXPOSE 8000
USER appuser
ENTRYPOINT ["./entrypoint.sh"]
CMD ["python", "main.py"]

FROM runtime-base AS test
COPY --from=test-builder /app/.venv /app/.venv
COPY app ./app
COPY migrations ./migrations
COPY opencda ./opencda
COPY alembic.ini ./
COPY main.py ./
COPY tests ./tests

RUN mkdir -p evaluation_outputs logs assets/xodrs \
    && chown -R appuser:appuser evaluation_outputs logs assets

USER appuser
CMD ["python", "-m", "pytest", "-p", "no:cacheprovider", "tests/backend"]

# `docker build .` must produce the runnable application, not the CI test image.
FROM production AS default
