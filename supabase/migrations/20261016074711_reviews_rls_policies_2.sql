-- POST LIKES

CREATE POLICY "Post likes are publicly readable"
ON public.post_likes
FOR SELECT
TO anon, authenticated
USING (true);

CREATE POLICY "Users can create their own post likes"
ON public.post_likes
FOR INSERT
TO authenticated
WITH CHECK (
    auth.uid() = user_id
    AND EXISTS (
        SELECT 1
        FROM public.discussion_posts AS p
        WHERE p.id = post_id
          AND p.is_moderated = false -- ADDED: Don't allow likes on moderated posts.
          AND p.deleted_at IS NULL   -- ADDED: Don't allow likes on soft-deleted posts.
    )
);

CREATE POLICY "Users can delete their own post likes"
ON public.post_likes
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);


-- LIBRARY BOOKS

CREATE POLICY "Users can view their own library"
ON public.library_books
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can add books to their library"
ON public.library_books
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own library"
ON public.library_books
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can remove books from their library"
ON public.library_books
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- NOTES

CREATE POLICY "Users can view their own notes"
ON public.notes
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own notes"
ON public.notes
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own notes"
ON public.notes
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own notes"
ON public.notes
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);


-- READING PATHS

CREATE POLICY "Approved reading paths are publicly readable"
ON public.reading_paths
FOR SELECT
TO anon, authenticated
USING (
    status = 'approved'
    OR auth.uid() = creator_id
);

CREATE POLICY "Users can submit reading paths"
ON public.reading_paths
FOR INSERT
TO authenticated
WITH CHECK (
    auth.uid() = creator_id
    AND status = 'pending'
);

CREATE POLICY "Creators can edit unapproved reading paths"
ON public.reading_paths
FOR UPDATE
TO authenticated
USING (
    auth.uid() = creator_id
    AND status IN ('pending', 'rejected')
)
WITH CHECK (
    auth.uid() = creator_id
    AND status IN ('pending', 'rejected') 
);

CREATE POLICY "Creators can delete unapproved reading paths"
ON public.reading_paths
FOR DELETE
TO authenticated
USING (
    auth.uid() = creator_id
    AND status IN ('pending', 'rejected')
);


-- READING PATH BOOKS

CREATE POLICY "Books in readable paths are visible"
ON public.reading_path_books
FOR SELECT
TO anon, authenticated
USING (
    EXISTS (
        SELECT 1
        FROM public.reading_paths AS rp
        WHERE rp.id = reading_path_id
          AND (
              rp.status = 'approved'
              OR rp.creator_id = auth.uid()
          )
    )
);

CREATE POLICY "Creators can add books to their pending paths"
ON public.reading_path_books
FOR INSERT
TO authenticated
WITH CHECK (
    EXISTS (
        SELECT 1
        FROM public.reading_paths AS rp
        WHERE rp.id = reading_path_id
          AND rp.creator_id = auth.uid()
          AND rp.status = 'pending'
    )
);

CREATE POLICY "Creators can update books in their pending paths"
ON public.reading_path_books
FOR UPDATE
TO authenticated
USING (
    EXISTS (
        SELECT 1
        FROM public.reading_paths AS rp
        WHERE rp.id = reading_path_id
          AND rp.creator_id = auth.uid()
          AND rp.status = 'pending'
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1
        FROM public.reading_paths AS rp
        WHERE rp.id = reading_path_id
          AND rp.creator_id = auth.uid()
          AND rp.status = 'pending'
    )
);

CREATE POLICY "Creators can remove books from their pending paths"
ON public.reading_path_books
FOR DELETE
TO authenticated
USING (
    EXISTS (
        SELECT 1
        FROM public.reading_paths AS rp
        WHERE rp.id = reading_path_id
          AND rp.creator_id = auth.uid()
          AND rp.status = 'pending'
    )
);

-- SAVED PATHS bookmarks.

CREATE POLICY "Users can view their saved paths"
ON public.saved_paths
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can save reading paths"
ON public.saved_paths
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can unsave reading paths"
ON public.saved_paths
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);


-- SAVED REVIEWS bookmarks.

CREATE POLICY "Users can view their saved reviews"
ON public.saved_reviews
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can save reviews"
ON public.saved_reviews
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can unsave reviews"
ON public.saved_reviews
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);


-- SAVED POSTS bookmarks

CREATE POLICY "Users can view their saved posts"
ON public.saved_posts
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can save posts"
ON public.saved_posts
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can unsave posts"
ON public.saved_posts
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);
