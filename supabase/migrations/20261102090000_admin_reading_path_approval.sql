ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS role TEXT NOT NULL DEFAULT 'reader';

CREATE OR REPLACE FUNCTION public.prevent_profile_role_escalation()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.role IS DISTINCT FROM OLD.role
     AND auth.uid() IS NOT NULL
     AND NOT EXISTS (
       SELECT 1
       FROM public.profiles AS actor
       WHERE actor.id = auth.uid()
         AND actor.role = 'admin'
     ) THEN
    RAISE EXCEPTION 'Only admins can change profile roles';
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER prevent_profile_role_escalation
BEFORE UPDATE OF role ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.prevent_profile_role_escalation();

DROP POLICY IF EXISTS "Admins can view pending reading paths" ON public.reading_paths;
DROP POLICY IF EXISTS "Admins can approve pending reading paths" ON public.reading_paths;

CREATE POLICY "Admins can view pending reading paths"
ON public.reading_paths
FOR SELECT
TO authenticated
USING (
  status = 'pending'
  AND EXISTS (
    SELECT 1 FROM public.profiles AS actor
    WHERE actor.id = auth.uid() AND actor.role = 'admin'
  )
);

CREATE POLICY "Admins can approve pending reading paths"
ON public.reading_paths
FOR UPDATE
TO authenticated
USING (
  status = 'pending'
  AND EXISTS (
    SELECT 1 FROM public.profiles AS actor
    WHERE actor.id = auth.uid() AND actor.role = 'admin'
  )
)
WITH CHECK (
  status = 'approved'
  AND reviewed_by = auth.uid()
  AND reviewed_at IS NOT NULL
  AND EXISTS (
    SELECT 1 FROM public.profiles AS actor
    WHERE actor.id = auth.uid() AND actor.role = 'admin'
  )
);
