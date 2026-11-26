-- Allow an authenticated user to permanently delete their own auth.users record
CREATE OR REPLACE FUNCTION public.delete_own_account()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  current_uid uuid := auth.uid();
BEGIN
  IF current_uid IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- Clean up storage avatar objects if any exist
  DELETE FROM storage.objects
  WHERE bucket_id = 'avatars'
    AND (name LIKE current_uid::text || '-%' OR name LIKE current_uid::text || '/%');

  -- Delete the auth user (cascades to public.profiles and dependent user tables)
  DELETE FROM auth.users
  WHERE id = current_uid;
END;
$$;

REVOKE ALL ON FUNCTION public.delete_own_account() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.delete_own_account() TO authenticated;