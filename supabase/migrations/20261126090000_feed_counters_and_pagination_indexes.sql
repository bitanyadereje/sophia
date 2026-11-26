-- Feed counters remove the need to load every like/reply/comment just to render a card.
ALTER TABLE public.discussion_posts
  ADD COLUMN IF NOT EXISTS like_count integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS reply_count integer NOT NULL DEFAULT 0;

ALTER TABLE public.reviews
  ADD COLUMN IF NOT EXISTS like_count integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS comment_count integer NOT NULL DEFAULT 0;

UPDATE public.discussion_posts p
SET like_count = (SELECT count(*) FROM public.post_likes l WHERE l.post_id = p.id);

WITH RECURSIVE ancestors AS (
  SELECT id AS reply_id, parent_id AS ancestor_id FROM public.discussion_posts WHERE parent_id IS NOT NULL
  UNION ALL
  SELECT a.reply_id, p.parent_id
  FROM ancestors a
  JOIN public.discussion_posts p ON p.id = a.ancestor_id
  WHERE p.parent_id IS NOT NULL
), counts AS (
  SELECT ancestor_id, count(*) AS total FROM ancestors GROUP BY ancestor_id
)
UPDATE public.discussion_posts p SET reply_count = counts.total FROM counts WHERE p.id = counts.ancestor_id;

UPDATE public.reviews r
SET like_count = (SELECT count(*) FROM public.review_likes l WHERE l.review_id = r.id),
    comment_count = (SELECT count(*) FROM public.review_comments c WHERE c.review_id = r.id);

CREATE OR REPLACE FUNCTION public.sync_post_like_count()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  UPDATE discussion_posts SET like_count = GREATEST(0, like_count + CASE WHEN TG_OP = 'INSERT' THEN 1 ELSE -1 END)
  WHERE id = CASE WHEN TG_OP = 'INSERT' THEN NEW.post_id ELSE OLD.post_id END;
  RETURN NULL;
END;
$$;

CREATE OR REPLACE FUNCTION public.sync_review_like_count()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  UPDATE reviews SET like_count = GREATEST(0, like_count + CASE WHEN TG_OP = 'INSERT' THEN 1 ELSE -1 END)
  WHERE id = CASE WHEN TG_OP = 'INSERT' THEN NEW.review_id ELSE OLD.review_id END;
  RETURN NULL;
END;
$$;

CREATE OR REPLACE FUNCTION public.sync_discussion_reply_count()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE ancestor uuid; delta integer := CASE WHEN TG_OP = 'INSERT' THEN 1 ELSE -1 END;
BEGIN
  ancestor := CASE WHEN TG_OP = 'INSERT' THEN NEW.parent_id ELSE OLD.parent_id END;
  WHILE ancestor IS NOT NULL LOOP
    UPDATE discussion_posts SET reply_count = GREATEST(0, reply_count + delta) WHERE id = ancestor;
    SELECT parent_id INTO ancestor FROM discussion_posts WHERE id = ancestor;
  END LOOP;
  RETURN NULL;
END;
$$;

CREATE OR REPLACE FUNCTION public.sync_review_comment_count()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  UPDATE reviews SET comment_count = GREATEST(0, comment_count + CASE WHEN TG_OP = 'INSERT' THEN 1 ELSE -1 END)
  WHERE id = CASE WHEN TG_OP = 'INSERT' THEN NEW.review_id ELSE OLD.review_id END;
  RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS post_like_count_trigger ON public.post_likes;
CREATE TRIGGER post_like_count_trigger AFTER INSERT OR DELETE ON public.post_likes FOR EACH ROW EXECUTE FUNCTION public.sync_post_like_count();

DROP TRIGGER IF EXISTS review_like_count_trigger ON public.review_likes;
CREATE TRIGGER review_like_count_trigger AFTER INSERT OR DELETE ON public.review_likes FOR EACH ROW EXECUTE FUNCTION public.sync_review_like_count();

DROP TRIGGER IF EXISTS discussion_reply_count_insert_trigger ON public.discussion_posts;
CREATE TRIGGER discussion_reply_count_insert_trigger AFTER INSERT ON public.discussion_posts FOR EACH ROW WHEN (NEW.parent_id IS NOT NULL) EXECUTE FUNCTION public.sync_discussion_reply_count();

DROP TRIGGER IF EXISTS discussion_reply_count_delete_trigger ON public.discussion_posts;
CREATE TRIGGER discussion_reply_count_delete_trigger AFTER DELETE ON public.discussion_posts FOR EACH ROW WHEN (OLD.parent_id IS NOT NULL) EXECUTE FUNCTION public.sync_discussion_reply_count();

DROP TRIGGER IF EXISTS review_comment_count_trigger ON public.review_comments;
CREATE TRIGGER review_comment_count_trigger AFTER INSERT OR DELETE ON public.review_comments FOR EACH ROW EXECUTE FUNCTION public.sync_review_comment_count();

CREATE INDEX IF NOT EXISTS reviews_created_at_id_idx ON public.reviews (created_at DESC, id DESC);
CREATE INDEX IF NOT EXISTS review_comments_review_id_idx ON public.review_comments (review_id);
CREATE INDEX IF NOT EXISTS discussion_posts_root_created_at_id_idx ON public.discussion_posts (created_at DESC, id DESC) WHERE parent_id IS NULL;
CREATE INDEX IF NOT EXISTS discussion_posts_parent_id_created_at_idx ON public.discussion_posts (parent_id, created_at ASC);

CREATE OR REPLACE FUNCTION public.get_discussion_thread_replies(thread_id uuid)
RETURNS SETOF public.discussion_posts
LANGUAGE sql STABLE
AS $$
  WITH RECURSIVE thread AS (
    SELECT p.* FROM public.discussion_posts p WHERE p.parent_id = thread_id
    UNION ALL
    SELECT child.* FROM public.discussion_posts child JOIN thread parent ON child.parent_id = parent.id
  )
  SELECT * FROM thread ORDER BY created_at ASC, id ASC;
$$;