CREATE TABLE IF NOT EXISTS scenarios (
    id               SERIAL PRIMARY KEY,
    scenario_id      TEXT UNIQUE,
    name_of_scenario TEXT        NOT NULL,
    scenario_text    TEXT,
    preview          TEXT,
    annotation       TEXT,
    file_            TEXT,
    created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_scenarios_updated_at ON scenarios;
CREATE TRIGGER trg_scenarios_updated_at
    BEFORE UPDATE ON scenarios
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TABLE IF NOT EXISTS simulation_state (
    id         INT PRIMARY KEY DEFAULT 1,
    running    BOOLEAN     NOT NULL DEFAULT FALSE,
    status     TEXT        NOT NULL DEFAULT 'idle',
    error      TEXT,
    map        TEXT,
    run_id     TEXT,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO simulation_state (id) VALUES (1) ON CONFLICT DO NOTHING;