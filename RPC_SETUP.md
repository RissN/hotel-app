# Security Note & RPC Function

To make the 'Add User' functionality work without logging out the Superadmin, you must run the following SQL command in your Supabase SQL Editor. This sets up a secure remote procedure call (RPC).

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

  -- Create user securely using the crypt extension
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
    updated_at
  )
  VALUES (
    '00000000-0000-0000-0000-000000000000',
    gen_random_uuid(),
    'authenticated',
    'authenticated',
    email,
    crypt(password, gen_salt('bf')),
    now(),
    '{"provider":"email","providers":["email"]}',
    '{}',
    now(),
    now()
  )
  RETURNING id INTO new_user_id;

  -- Tie the new user id to the desired hotel role
  INSERT INTO public.user_roles (user_id, role)
  VALUES (new_user_id, assign_role);

  result := json_build_object('user_id', new_user_id, 'email', email, 'role', assign_role);
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```
