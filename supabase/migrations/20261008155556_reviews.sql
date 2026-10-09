-- REVIEWS

CREATE TABLE public.reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id),
    book_id UUID NOT NULL REFERENCES public.books(id),
    title TEXT,
    content TEXT NOT NULL,

    rating INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
    quote TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    -- One user can review a particular book only once.
    UNIQUE (user_id, book_id)
);


-- REVIEW COMMENTS

CREATE TABLE public.review_comments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    review_id UUID NOT NULL REFERENCES public.reviews(id),
    user_id UUID NOT NULL REFERENCES public.profiles(id),
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- REVIEW LIKES

CREATE TABLE public.review_likes (
    review_id UUID NOT NULL REFERENCES public.reviews(id),
    user_id UUID NOT NULL REFERENCES public.profiles(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (review_id, user_id)
);