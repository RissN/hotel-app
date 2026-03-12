-- Create an ENUM for roles
CREATE TYPE user_role AS ENUM ('Superadmin', 'Admin', 'Resepsionis');

-- Create user_roles table
CREATE TABLE public.user_roles (
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    role user_role NOT NULL DEFAULT 'Resepsionis',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Policies
-- Users can read their own role
CREATE POLICY "Users can read own role" ON public.user_roles FOR SELECT USING (auth.uid() = user_id);

-- Superadmin and Admin can read all roles
CREATE POLICY "Admins can read all roles" ON public.user_roles FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role IN ('Superadmin', 'Admin'))
);

-- Only Superadmin and Admin can insert/update roles
CREATE POLICY "Admins can update roles" ON public.user_roles FOR ALL USING (
    EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role IN ('Superadmin', 'Admin'))
);

-- Note: A function & trigger is often added to sync created users from auth.users to public.user_roles.
-- For now, if we manually insert users, we must also manually insert their roles into user_roles.
