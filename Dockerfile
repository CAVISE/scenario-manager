FROM ghcr.io/astral-sh/uv:python3.11-bookworm-slim AS builder
ENV UV_LINK_MODE=copy
WORKDIR /app

COPY pyproject.toml uv.lock ./
RUN --mount=type=cache,target=/root/.cache/uv \
    uv sync --frozen --no-dev --extra simulation --no-install-project

FROM python:3.11-slim-bookworm

RUN apt-get update && apt-get install -y --no-install-recommends \
    libgl1 \
    libglib2.0-0 \
    libgomp1 \
    && rm -rf /var/lib/apt/lists/*

ENV PATH="/app/.venv/bin:$PATH" \
    PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1

WORKDIR /app
COPY --from=builder /app/.venv /app/.venv
COPY app ./app
COPY migrations ./migrations
COPY opencda ./opencda
COPY assets ./assets
COPY alembic.ini ./
COPY main.py ./
COPY --chmod=755 entrypoint.sh /usr/local/bin/entrypoint.sh

RUN mkdir -p evaluation_outputs logs assets/xodrs

EXPOSE 8000
ENTRYPOINT ["entrypoint.sh"]
CMD ["python", "main.py"]
