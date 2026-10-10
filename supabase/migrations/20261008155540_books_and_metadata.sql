CREATE TABLE public.books (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    author_name TEXT NOT NULL,
    description TEXT,
    cover_url TEXT,
    language TEXT NOT NULL DEFAULT 'en',

    page_count INTEGER CHECK (page_count >= 0),

    verification_status TEXT NOT NULL DEFAULT 'unverified'
        CHECK (
            verification_status IN (
                'unverified',
                'verified',
                'rejected'
            )
        ),

    -- Nullable because a book may come from an external
    created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);


-- TRADITIONS

CREATE TABLE public.traditions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    slug TEXT NOT NULL UNIQUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);


-- BOOK ↔ TRADITION

-- many to many relationship
CREATE TABLE public.book_traditions (
    book_id UUID NOT NULL REFERENCES public.books(id),
    tradition_id UUID NOT NULL REFERENCES public.traditions(id),

    PRIMARY KEY (book_id, tradition_id)
);


-- TAGS

CREATE TABLE public.tags (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    slug TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    category TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);


-- BOOK ↔ TAG

CREATE TABLE public.book_tags (
    book_id UUID NOT NULL REFERENCES public.books(id),
    tag_id UUID NOT NULL REFERENCES public.tags(id),

    PRIMARY KEY (book_id, tag_id)
);