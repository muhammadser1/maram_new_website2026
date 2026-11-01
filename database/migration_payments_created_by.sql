-- Track who created each payment (secretary history)
ALTER TABLE payments
  ADD COLUMN IF NOT EXISTS created_by integer REFERENCES users(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_payments_created_by ON public.payments USING btree (created_by);
