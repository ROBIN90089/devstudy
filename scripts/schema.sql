CREATE TABLE IF NOT EXISTS study_progress (
 session_id text PRIMARY KEY CHECK (length(session_id)=64),
 data jsonb NOT NULL,
 updated_at timestamptz NOT NULL DEFAULT now()
);
