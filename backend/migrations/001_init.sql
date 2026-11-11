CREATE TABLE IF NOT EXISTS workflow_document (
  id integer PRIMARY KEY DEFAULT 1,
  revision bigint NOT NULL,
  document jsonb NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT workflow_document_single_row CHECK (id = 1)
);
