-- LIBRARY BOOKS

CREATE TABLE public.library_books (
    user_id UUID NOT NULL REFERENCES public.profiles(id),
    book_id UUID NOT NULL REFERENCES public.books(id),

    status TEXT NOT NULL DEFAULT 'to_be_read'
        CHECK (
            status IN (
                'to_be_read',
                'reading',
                'finished',
                'dnf'
            )
        ),

    pages_read INTEGER NOT NULL DEFAULT 0
        CHECK (pages_read >= 0),

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),


    PRIMARY KEY (user_id, book_id)
);


-- NOTES

CREATE TABLE public.notes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id),
    book_id UUID NOT NULL REFERENCES public.books(id),
    title TEXT,
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);