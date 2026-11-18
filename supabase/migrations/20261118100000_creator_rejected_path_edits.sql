-- Let creators revise a rejected path's itinerary before resubmitting it.
DROP POLICY IF EXISTS "Creators can add books to their pending paths" ON public.reading_path_books;
DROP POLICY IF EXISTS "Creators can update books in their pending paths" ON public.reading_path_books;
DROP POLICY IF EXISTS "Creators can remove books from their pending paths" ON public.reading_path_books;

CREATE POLICY "Creators can add books to unapproved paths" ON public.reading_path_books
FOR INSERT TO authenticated WITH CHECK (
  EXISTS (SELECT 1 FROM public.reading_paths rp WHERE rp.id = reading_path_id AND rp.creator_id = auth.uid() AND rp.status IN ('pending', 'rejected'))
);

CREATE POLICY "Creators can update books in unapproved paths" ON public.reading_path_books
FOR UPDATE TO authenticated
USING (EXISTS (SELECT 1 FROM public.reading_paths rp WHERE rp.id = reading_path_id AND rp.creator_id = auth.uid() AND rp.status IN ('pending', 'rejected')))
WITH CHECK (EXISTS (SELECT 1 FROM public.reading_paths rp WHERE rp.id = reading_path_id AND rp.creator_id = auth.uid() AND rp.status IN ('pending', 'rejected')));

CREATE POLICY "Creators can remove books from unapproved paths" ON public.reading_path_books
FOR DELETE TO authenticated USING (
  EXISTS (SELECT 1 FROM public.reading_paths rp WHERE rp.id = reading_path_id AND rp.creator_id = auth.uid() AND rp.status IN ('pending', 'rejected'))
);
