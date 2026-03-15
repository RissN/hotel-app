-- ============================================================
--  SUPABASE RLS SETUP — Jalankan seluruh file ini sekaligus
--  di Supabase Dashboard → SQL Editor → New Query → Run
-- ============================================================

-- ────────────────────────────────────────────────────────────
-- 1. Helper function: get_my_role()
--    Mengembalikan role user yang sedang login.
--    Dipakai oleh semua RLS policy di bawah.
-- ────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.get_my_role()
RETURNS user_role
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role
  FROM public.user_roles
  WHERE user_id = auth.uid()
$$;


-- ────────────────────────────────────────────────────────────
-- 2. Refactor policies pada user_roles
--    Menghapus policy lama → ganti dengan yang lebih rapi
-- ────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "Users can read own role"  ON public.user_roles;
DROP POLICY IF EXISTS "Admins can read all roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can update roles"   ON public.user_roles;

-- SELECT: User bisa baca role milik sendiri
CREATE POLICY "user_roles_select_own"
  ON public.user_roles FOR SELECT
  USING (auth.uid() = user_id);

-- SELECT: Admin & Superadmin bisa baca semua roles
CREATE POLICY "user_roles_select_admin"
  ON public.user_roles FOR SELECT
  USING (public.get_my_role() IN ('Superadmin', 'Admin'));

-- INSERT/UPDATE/DELETE: Hanya Superadmin & Admin
CREATE POLICY "user_roles_modify_admin"
  ON public.user_roles FOR ALL
  USING  (public.get_my_role() IN ('Superadmin', 'Admin'))
  WITH CHECK (public.get_my_role() IN ('Superadmin', 'Admin'));


-- ────────────────────────────────────────────────────────────
-- 3. Tabel rooms — RLS Policies
--    • SELECT  → Publik (termasuk yang belum login)
--    • INSERT  → Superadmin & Admin saja
--    • UPDATE  → Superadmin & Admin saja
--    • DELETE  → Superadmin & Admin saja
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.rooms (
  id          BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  name        TEXT NOT NULL,
  type        TEXT,
  price       NUMERIC(12,2) NOT NULL DEFAULT 0,
  status      TEXT DEFAULT 'available',
  created_at  TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.rooms ENABLE ROW LEVEL SECURITY;

CREATE POLICY "rooms_select_public"
  ON public.rooms FOR SELECT
  USING (true);

CREATE POLICY "rooms_insert_admin"
  ON public.rooms FOR INSERT
  WITH CHECK (public.get_my_role() IN ('Superadmin', 'Admin'));

CREATE POLICY "rooms_update_admin"
  ON public.rooms FOR UPDATE
  USING (public.get_my_role() IN ('Superadmin', 'Admin'));

CREATE POLICY "rooms_delete_admin"
  ON public.rooms FOR DELETE
  USING (public.get_my_role() IN ('Superadmin', 'Admin'));


-- ────────────────────────────────────────────────────────────
-- 4. Tabel reservations — RLS Policies
--    • SELECT  → User melihat milik sendiri; Superadmin melihat semua
--    • INSERT  → User membuat untuk diri sendiri; Superadmin untuk siapa saja
--    • UPDATE  → Superadmin saja
--    • DELETE  → Superadmin saja
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.reservations (
  id           BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id      UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  room_id      BIGINT REFERENCES public.rooms(id),
  guest_name   TEXT NOT NULL,
  check_in     DATE NOT NULL,
  check_out    DATE NOT NULL,
  status       TEXT DEFAULT 'confirmed',
  total_price  NUMERIC(12,2),
  created_at   TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.reservations ENABLE ROW LEVEL SECURITY;

-- SELECT
CREATE POLICY "reservations_select_own"
  ON public.reservations FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "reservations_select_superadmin"
  ON public.reservations FOR SELECT
  USING (public.get_my_role() = 'Superadmin');

-- INSERT
CREATE POLICY "reservations_insert_own"
  ON public.reservations FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "reservations_insert_superadmin"
  ON public.reservations FOR INSERT
  WITH CHECK (public.get_my_role() = 'Superadmin');

-- UPDATE & DELETE (Superadmin only)
CREATE POLICY "reservations_update_superadmin"
  ON public.reservations FOR UPDATE
  USING (public.get_my_role() = 'Superadmin');

CREATE POLICY "reservations_delete_superadmin"
  ON public.reservations FOR DELETE
  USING (public.get_my_role() = 'Superadmin');


-- ============================================================
--  ✅ SELESAI — Semua RLS policy telah diterapkan.
--  
--  Ringkasan:
--  • get_my_role()   → helper function untuk cek role
--  • user_roles      → policy diperbaharui
--  • rooms           → publik bisa lihat, admin bisa kelola
--  • reservations    → user lihat milik sendiri, superadmin full
-- ============================================================
