ALTER TABLE public.review_comments
ADD COLUMN parent_id UUID REFERENCES public.review_comments(id) ON DELETE CASCADE;

CREATE INDEX review_comments_parent_id_idx
ON public.review_comments(parent_id);

CREATE TABLE public.review_comment_likes (
    comment_id UUID NOT NULL REFERENCES public.review_comments(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (comment_id, user_id)
);

ALTER TABLE public.review_comment_likes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Review comment likes are publicly readable"
ON public.review_comment_likes
FOR SELECT
TO anon, authenticated
USING (true);

CREATE POLICY "Users can create their own review comment likes"
ON public.review_comment_likes
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own review comment likes"
ON public.review_comment_likes
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);
