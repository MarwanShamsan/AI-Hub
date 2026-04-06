CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS events (
  seq            BIGSERIAL PRIMARY KEY,
  id             UUID NOT NULL UNIQUE,
  deal_id        UUID NOT NULL,
  stream_seq     BIGINT NOT NULL,
  event_type     TEXT NOT NULL,
  actor_type     TEXT NOT NULL CHECK (actor_type IN ('AGENT','USER','SYSTEM')),
  actor_id       TEXT NOT NULL,
  agent_id       SMALLINT NULL CHECK (agent_id BETWEEN 1 AND 9),
  payload        JSONB NOT NULL,
  prev_hash      TEXT NULL,
  hash           TEXT NOT NULL,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (deal_id, stream_seq)
);

CREATE INDEX IF NOT EXISTS events_deal_seq_idx ON events(deal_id, stream_seq);
CREATE INDEX IF NOT EXISTS events_deal_type_idx ON events(deal_id, event_type);

-- Engine checkpoints are allowed to UPDATE (not source of truth)
CREATE TABLE IF NOT EXISTS engine_checkpoints (
  engine_name TEXT PRIMARY KEY,
  last_seq    BIGINT NOT NULL DEFAULT 0,
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
