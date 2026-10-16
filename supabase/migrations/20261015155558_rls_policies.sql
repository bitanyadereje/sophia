-- Reviews, books, discussions, and discussion tags

-- REVIEW COMMENTS

CREATE POLICY "Review comments are publicly readable"
ON public.review_comments
FOR SELECT
TO anon, authenticated
USING (true);

CREATE POLICY "Users can create their own review comments"
ON public.review_comments
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own review comments"
ON public.review_comments
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own review comments"
ON public.review_comments
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- REVIEW LIKES

CREATE POLICY "Review likes are publicly readable"
ON public.review_likes
FOR SELECT
TO anon, authenticated
USING (true);

CREATE POLICY "Users can create their own review likes"
ON public.review_likes
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own review likes"
ON public.review_likes
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- PROFILES

CREATE POLICY "Profiles are publicly readable"
ON public.profiles
FOR SELECT
TO anon, authenticated
USING (true);

CREATE POLICY "Users can create their own profile"
ON public.profiles
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
ON public.profiles
FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);


-- BOOKS
-- Public can read verified books.
-- Creators can also access their own submissions.
-- Verification/moderation is handled by trusted backend code.

CREATE POLICY "Verified books are publicly readable"
ON public.books
FOR SELECT
TO anon, authenticated
USING (
    verification_status = 'verified'
    OR auth.uid() = created_by
);

CREATE POLICY "Authenticated users can submit books"
ON public.books
FOR INSERT
TO authenticated
WITH CHECK (
    auth.uid() = created_by
    AND verification_status = 'unverified'
);

CREATE POLICY "Creators can update their unverified books"
ON public.books
FOR UPDATE
TO authenticated
USING (
    auth.uid() = created_by
    AND verification_status = 'unverified'
)
WITH CHECK (
    auth.uid() = created_by
    AND verification_status = 'unverified'
);

CREATE POLICY "Creators can delete their unverified books"
ON public.books
FOR DELETE
TO authenticated
USING (
    auth.uid() = created_by
    AND verification_status = 'unverified'
);


-- TRADITIONS

CREATE POLICY "Traditions are publicly readable"
ON public.traditions
FOR SELECT
TO anon, authenticated
USING (true);


-- BOOK TRADITIONS

CREATE POLICY "Book traditions are publicly readable"
ON public.book_traditions
FOR SELECT
TO anon, authenticated
USING (true);


-- TAGS

CREATE POLICY "Tags are publicly readable"
ON public.tags
FOR SELECT
TO anon, authenticated
USING (true);


-- BOOK TAGS

CREATE POLICY "Book tags are publicly readable"
ON public.book_tags
FOR SELECT
TO anon, authenticated
USING (true);


-- DISCUSSION POSTS
-- Publicly readable unless moderated.
-- Soft-deleted posts remain available for thread context.

CREATE POLICY "Visible discussion posts are readable"
ON public.discussion_posts
FOR SELECT
TO anon, authenticated
USING (
    is_moderated = false
    OR auth.uid() = author_id
);

CREATE POLICY "Users can create discussion posts"
ON public.discussion_posts
FOR INSERT
TO authenticated
WITH CHECK (
    auth.uid() = author_id
    AND is_moderated = false
    AND deleted_at IS NULL
    AND (
        parent_id IS NOT NULL
        OR book_id IS NULL
    )
);


CREATE POLICY "Users can update their own discussion posts"
ON public.discussion_posts
FOR UPDATE
TO authenticated
USING (
    auth.uid() = author_id
    AND deleted_at IS NULL
    AND (
        parent_id IS NOT NULL
        OR book_id IS NULL
    )
)
WITH CHECK (
    auth.uid() = author_id
    AND is_moderated = false
    AND (
        parent_id IS NOT NULL
        OR book_id IS NULL
    )
);

CREATE OR REPLACE FUNCTION public.protect_discussion_post_fields()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    IF current_user = 'authenticated' THEN
        IF NEW.author_id IS DISTINCT FROM OLD.author_id THEN
            RAISE EXCEPTION 'Cannot change post author.';
        END IF;

        IF NEW.parent_id IS DISTINCT FROM OLD.parent_id THEN
            RAISE EXCEPTION 'Cannot change post parent.';
        END IF;

        IF NEW.book_id IS DISTINCT FROM OLD.book_id THEN
            RAISE EXCEPTION 'Cannot change linked book.';
        END IF;

        IF NEW.is_moderated IS DISTINCT FROM OLD.is_moderated THEN
            RAISE EXCEPTION 'Cannot change moderation status.';
        END IF;

        IF OLD.deleted_at IS NOT NULL
           AND NEW.deleted_at IS DISTINCT FROM OLD.deleted_at THEN
            RAISE EXCEPTION 'Cannot modify a deleted post.';
        END IF;
    END IF;

    RETURN NEW;
END;
$$;

CREATE TRIGGER protect_discussion_post_fields_trigger
BEFORE UPDATE ON public.discussion_posts
FOR EACH ROW
EXECUTE FUNCTION public.protect_discussion_post_fields();


-- Ordinary users should soft-delete posts by setting deleted_at.
-- No ordinary-user DELETE policy is provided.


-- DISCUSSION POST TAGS
-- Users can manage tags only on their own posts.

CREATE POLICY "Tags on visible discussion posts are readable"
ON public.discussion_post_tags
FOR SELECT
TO anon, authenticated
USING (
    EXISTS (
        SELECT 1
        FROM public.discussion_posts AS p
        WHERE p.id = post_id
          AND (
              p.is_moderated = false
              OR p.author_id = auth.uid()
          )
    )
);

CREATE POLICY "Users can tag their own discussion posts"
ON public.discussion_post_tags
FOR INSERT
TO authenticated
WITH CHECK (
    EXISTS (
        SELECT 1
        FROM public.discussion_posts AS p
        WHERE p.id = post_id
          AND p.author_id = auth.uid()
          AND p.is_moderated = false
          AND p.deleted_at IS NULL 
    )
);

CREATE POLICY "Users can remove tags from their own posts"
ON public.discussion_post_tags
FOR DELETE
TO authenticated
USING (
    EXISTS (
        SELECT 1
        FROM public.discussion_posts AS p
        WHERE p.id = post_id
          AND p.author_id = auth.uid()
    )
);

