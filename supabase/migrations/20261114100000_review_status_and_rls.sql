-- New reviews default to drafts until the author publishes them.
ALTER TABLE public.reviews ADD COLUMN IF NOT EXISTS status TEXT;

UPDATE public.reviews SET status = 'published' WHERE status IS NULL;

ALTER TABLE public.reviews ALTER COLUMN status SET DEFAULT 'draft';