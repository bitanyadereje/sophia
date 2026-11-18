-- 1. Store rejection notes on reading_paths only
alter table public.reading_paths
  add column if not exists rejection_note text;

-- 2. Allow admins to promote/demote profile roles ('admin' <-> 'reader')
create policy "Admins can update profile roles"
on public.profiles
for update
using (
  exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  )
);