-- SAVED REVIEWS

CREATE TABLE public.saved_reviews (
    user_id UUID NOT NULL REFERENCES public.profiles(id),
    review_id UUID NOT NULL REFERENCES public.reviews(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    PRIMARY KEY (user_id, review_id)
);


-- SAVED POSTS

CREATE TABLE public.saved_posts (
    user_id UUID NOT NULL REFERENCES public.profiles(id),
    post_id UUID NOT NULL REFERENCES public.discussion_posts(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (user_id, post_id)
);
