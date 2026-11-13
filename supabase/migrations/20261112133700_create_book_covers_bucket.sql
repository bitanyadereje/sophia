-- Create the public bucket for book covers
insert into storage.buckets (id, name, public)
values ('book-covers', 'book-covers', true)
on conflict (id) do nothing;

-- Signed-in users can upload only into their own folder (userId/filename)
create policy "Authenticated users can upload covers"
on storage.objects for insert to authenticated
with check (
  bucket_id = 'book-covers'
  and (storage.foldername(name))[1] = auth.uid()::text
);

-- Anyone can read covers
create policy "Public can read covers"
on storage.objects for select to public
using (bucket_id = 'book-covers');

-- Uploaders can delete their own files (used to clean up if the book insert fails)
create policy "Users can delete own covers"
on storage.objects for delete to authenticated
using (
  bucket_id = 'book-covers'
  and (storage.foldername(name))[1] = auth.uid()::text
);