-- DISCUSSION POSTS TABLE

CREATE TABLE public.discussion_posts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    author_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    parent_id UUID REFERENCES public.discussion_posts(id) ON DELETE CASCADE,

    book_id UUID REFERENCES public.books(id) ON DELETE RESTRICT,

    title TEXT,
    content TEXT NOT NULL,

    deleted_at TIMESTAMPTZ DEFAULT NULL,

    is_moderated BOOLEAN NOT NULL DEFAULT FALSE,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT chk_parent_not_self CHECK (parent_id <> id)
);

-- Query indexes
CREATE INDEX idx_discussion_posts_book_id
ON public.discussion_posts(book_id);

CREATE INDEX idx_discussion_posts_parent_id
ON public.discussion_posts(parent_id);

CREATE INDEX idx_discussion_posts_author_id
ON public.discussion_posts(author_id);

-- Find non-deleted posts for a book, newest first.
CREATE INDEX idx_discussion_posts_active
ON public.discussion_posts(book_id, created_at DESC)
WHERE deleted_at IS NULL;


-- DISCUSSION POST ↔ TAG JUNCTION TABLE
CREATE TABLE public.discussion_post_tags (
    post_id UUID NOT NULL
        REFERENCES public.discussion_posts(id) ON DELETE CASCADE,

    tag_id UUID NOT NULL
        REFERENCES public.tags(id) ON DELETE CASCADE,

    PRIMARY KEY (post_id, tag_id)
);

CREATE INDEX idx_discussion_post_tags_tag_id
ON public.discussion_post_tags(tag_id);


-- POST LIKES TABLE

CREATE TABLE public.post_likes (
    post_id UUID NOT NULL
        REFERENCES public.discussion_posts(id) ON DELETE CASCADE,

    user_id UUID NOT NULL
        REFERENCES public.profiles(id) ON DELETE CASCADE,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    PRIMARY KEY (post_id, user_id)
);

CREATE INDEX idx_post_likes_user_id
ON public.post_likes(user_id);


-- BOOK DISCUSSION THREAD CONSTRAINT

-- At most one root discussion per book.
CREATE UNIQUE INDEX one_book_root_discussion
ON public.discussion_posts (book_id)
WHERE book_id IS NOT NULL AND parent_id IS NULL;


-- AUTOMATIC ROOT DISCUSSION CREATION TRIGGER

CREATE OR REPLACE FUNCTION public.create_book_discussion()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
    INSERT INTO public.discussion_posts (
        author_id,
        parent_id,
        book_id,
        title,
        content
    )
    VALUES (
        NULL,
        NULL,
        NEW.id,
        'Discussion: ' || NEW.title,
        'Official discussion thread for ' || NEW.title ||
            '. Share your thoughts and reviews here!'
    );

    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS create_book_discussion_trigger
ON public.books;

CREATE TRIGGER create_book_discussion_trigger
AFTER INSERT ON public.books
FOR EACH ROW
EXECUTE FUNCTION public.create_book_discussion();