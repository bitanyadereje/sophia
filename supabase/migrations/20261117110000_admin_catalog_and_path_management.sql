-- Give the moderation workspace the access it needs while keeping all
-- authorization decisions in Postgres/RLS (the browser is never trusted).
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  );
$$;

REVOKE ALL ON FUNCTION public.is_admin() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;

-- Books: moderators can see every submission and manage catalogue records.
CREATE POLICY "Admins can manage all books"
ON public.books
FOR ALL
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- Reading paths: replace the approval-only rule with full moderation.  The
-- normal creator policies remain in place for non-admin users.
DROP POLICY IF EXISTS "Admins can view pending reading paths" ON public.reading_paths;
DROP POLICY IF EXISTS "Admins can approve pending reading paths" ON public.reading_paths;

CREATE POLICY "Admins can manage all reading paths"
ON public.reading_paths
FOR ALL
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- A reviewer must be able to inspect and correct the itinerary too.
CREATE POLICY "Admins can manage all reading path books"
ON public.reading_path_books
FOR ALL
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());
