-- Extend quote status workflow to include production
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'quotes_status_check'
  ) THEN
    ALTER TABLE quotes DROP CONSTRAINT quotes_status_check;
  END IF;
END $$;

ALTER TABLE quotes
  ADD CONSTRAINT quotes_status_check
  CHECK (status IN ('new', 'contacted', 'quoted', 'production', 'closed'));
