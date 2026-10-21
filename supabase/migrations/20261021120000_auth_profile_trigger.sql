-- Ensure every authenticated user has a matching profile row.
-- Source of truth: auth.users.id === public.profiles.id

CREATE OR REPLACE FUNCTION public.handle_new_auth_user_profile()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  base_username TEXT;
BEGIN
  base_username := regexp_replace(lower(split_part(COALESCE(NEW.email, ''), '@', 1)), '[^a-z0-9_]+', '_', 'g');
  base_username := trim(both '_' from base_username);

  IF base_username = '' THEN
    base_username := 'reader';
  END IF;

  INSERT INTO public.profiles (id, username, name)
  VALUES (
    NEW.id,
    left(base_username, 24) || '_' || left(NEW.id::text, 8),
    COALESCE(
      NULLIF(NEW.raw_user_meta_data ->> 'name', ''),
      NULLIF(split_part(COALESCE(NEW.email, ''), '@', 1), ''),
      'Reader'
    )
  )
  ON CONFLICT (id) DO NOTHING;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created_profile ON auth.users;

CREATE TRIGGER on_auth_user_created_profile
AFTER INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION public.handle_new_auth_user_profile();

-- Backfill missing profiles for already existing auth users.
INSERT INTO public.profiles (id, username, name)
SELECT
  u.id,
  left(
    COALESCE(
      NULLIF(trim(both '_' from regexp_replace(lower(split_part(COALESCE(u.email, ''), '@', 1)), '[^a-z0-9_]+', '_', 'g')), ''),
      'reader'
    ),
    24
  ) || '_' || left(u.id::text, 8),
  COALESCE(
    NULLIF(u.raw_user_meta_data ->> 'name', ''),
    NULLIF(split_part(COALESCE(u.email, ''), '@', 1), ''),
    'Reader'
  )
FROM auth.users u
LEFT JOIN public.profiles p ON p.id = u.id
WHERE p.id IS NULL;