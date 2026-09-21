-- Upload chunks and status polls must not consume the transient-error budget.
ALTER TABLE destinations ADD COLUMN consecutive_failures integer NOT NULL DEFAULT 0
  CHECK (consecutive_failures >= 0);
