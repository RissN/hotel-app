# Security Note & RPC Function

To make the 'Add User' functionality work without logging out the Superadmin, you must run the following SQL command in your Supabase SQL Editor. This sets up a secure remote procedure call (RPC).

> **⚠️ Jika Anda sudah pernah membuat fungsi ini sebelumnya, jalankan perintah DROP dulu:**
> ```sql
> DROP FUNCTION IF EXISTS create_user_by_admin(TEXT, TEXT, user_role);
> ```

```sql
-- Create a secure PostgreSQL function to register non-logged-in users
CREATE OR REPLACE FUNCTION create_user_by_admin(
  email TEXT,
  password TEXT,
  assign_role user_role
) RETURNS json AS $$
DECLARE
  new_user_id UUID;
  result json;
BEGIN
  -- Security check: only Superadmins can run this
  IF NOT EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() AND role = 'Superadmin'
  ) THEN
    RAISE EXCEPTION 'Akses Ditolak: Hanya Superadmin yang dapat membuat pengguna baru.';
  END IF;

  -- Generate the new user ID
  new_user_id := gen_random_uuid();

  -- Create user in auth.users
  INSERT INTO auth.users (
    instance_id,
    id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    raw_app_meta_data,
    raw_user_meta_data,
    created_at,
    updated_at,
    confirmation_token,
    recovery_token,
    email_change_token_new,
    email_change
  )
  VALUES (
    '00000000-0000-0000-0000-000000000000',
    new_user_id,
    'authenticated',
    'authenticated',
    email,
    crypt(password, gen_salt('bf')),
    now(),
    '{"provider":"email","providers":["email"]}',
    '{}',
    now(),
    now(),
    '',
    '',
    '',
    ''
  );

  -- Create identity record in auth.identities (required by Supabase for login)
  INSERT INTO auth.identities (
    id,
    user_id,
    provider_id,
    provider,
    identity_data,
    last_sign_in_at,
    created_at,
    updated_at
  )
  VALUES (
    gen_random_uuid(),
    new_user_id,
    new_user_id::text,
    'email',
    jsonb_build_object(
      'sub', new_user_id::text,
      'email', email,
      'email_verified', true,
      'phone_verified', false
    ),
    now(),
    now(),
    now()
  );

  -- Tie the new user id to the desired hotel role
  INSERT INTO public.user_roles (user_id, role)
  VALUES (new_user_id, assign_role);

  result := json_build_object('user_id', new_user_id, 'email', email, 'role', assign_role);
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```
