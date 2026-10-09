-- READING PATHS

CREATE TABLE public.reading_paths (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    creator_id UUID NOT NULL REFERENCES public.profiles(id),

    title TEXT NOT NULL,
    description TEXT,

    topic TEXT NOT NULL,

    difficulty TEXT
        CHECK (
            difficulty IN (
                'beginner',
                'intermediate',
                'advanced'
            )
        ),

    -- moderation/review process.
    status TEXT NOT NULL DEFAULT 'pending'
        CHECK (
            status IN (
                'pending',
                'approved',
                'rejected'
            )
        ),

    reviewed_by UUID REFERENCES public.profiles(id),
    reviewed_at TIMESTAMPTZ,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);


-- READING PATH ↔ BOOK

CREATE TABLE public.reading_path_books (
    reading_path_id UUID NOT NULL REFERENCES public.reading_paths(id),
    book_id UUID NOT NULL REFERENCES public.books(id),
    position INTEGER NOT NULL CHECK (position > 0),

    note TEXT,

    PRIMARY KEY (reading_path_id, book_id),
    -- Two books cannot have the same position in one path.
    UNIQUE (reading_path_id, position)
);


-- SAVED READING PATHS

CREATE TABLE public.saved_paths (
    user_id UUID NOT NULL REFERENCES public.profiles(id),
    path_id UUID NOT NULL REFERENCES public.reading_paths(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    PRIMARY KEY (user_id, path_id)
);