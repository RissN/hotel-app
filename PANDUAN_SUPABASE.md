# Panduan Persiapan Database di Supabase untuk Role-Based Access Control (RBAC)

Berikut adalah panduan lengkap memindahkan file schema yang sudah saya buat (`schema.sql`) dan mengeksekusinya ke dalam Supabase untuk mengaktifkan sistem Login serta manajemen Multi-Role (`Superadmin`, `Admin`, `Resepsionis`).

---

## Langkah 1: Eksekusi SQL Script
1. Buka dashboard proyek **Supabase** Anda (https://supabase.com/dashboard).
2. Dari menu di sebelah kiri, pilih **"SQL Editor"** (ikon terminal `>_`).
3. Klik tombol **"New Query"** (atau "New Snippet").
4. Salin script SQL berikut dan tempelkan ke area editor:

```sql
-- 1. Buat tipe data ENUM khusus untuk peran pengguna
CREATE TYPE user_role AS ENUM ('Superadmin', 'Admin', 'Resepsionis');

-- 2. Buat tabel user_roles untuk menyimpan peran masing-masing akun
CREATE TABLE public.user_roles (
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    role user_role NOT NULL DEFAULT 'Resepsionis',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Aktifkan Row Level Security (RLS) di tabel ini agar aman
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- 4. Tambahkan kebijakan (Policies) RLS: 
-- Pengguna hanya bisa membaca role miliknya sendiri
CREATE POLICY "Users can read own role" ON public.user_roles 
FOR SELECT USING (auth.uid() = user_id);

-- Superadmin dan Admin bisa membaca dan melihat SEMUA role pengguna lain
CREATE POLICY "Admins can read all roles" ON public.user_roles 
FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM public.user_roles 
        WHERE user_id = auth.uid() AND role IN ('Superadmin', 'Admin')
    )
);

-- Hanya Superadmin dan Admin yang boleh MENGUBAH role di sistem
CREATE POLICY "Admins can update roles" ON public.user_roles 
FOR ALL USING (
    EXISTS (
        SELECT 1 FROM public.user_roles 
        WHERE user_id = auth.uid() AND role IN ('Superadmin', 'Admin')
    )
);
```
5. Klik tombol **"Run"** (biasanya di kanan bawah) untuk mengeksekusi semua baris SQL di atas.
6. Jika berhasil, akan ada tulisan *"Success. No rows returned"*.

---

## Langkah 2: Buat Akun Superadmin (Manual) Pertama Kali

Karena pendaftaran publik dihilangkan, kita harus membuat **1 akun Superadmin awal** secara manual lewat Supabase.

1. Buka menu **"Authentication"** di sebelah kiri layar Supabase Dashboard.
2. Pastikan Anda berada di sub-menu **"Users"**.
3. Klik tombol hijau **"Add User"** -> **"Create new user"**.
4. Masukkan **Email** (bebas, misal: `superadmin@hotel.com`) dan **Password** yang aman. Centang **"Auto Confirm User"** (penting agar akun tidak butuh verifikasi email).
5. Simpan (Klik **Create user**).

---

## Langkah 3: Tetapkan Role "Superadmin" ke Akun Baru Tersebut
Setelah Superadmin dibuat di Auth, Supabase secara internal menyimpan akun tersebut dalam tabel tersembunyi (`auth.users`), namun belum di tabel `public.user_roles` milik sistem kita. Mari kita tambahkan:

1. Copy **User UID** dari akun Superadmin yang baru saja Anda buat (Anda bisa melihat User UID-nya di layar Authentication -> Users, berbentuk karakter panjang seperti `123e4567-e89b-12d3...`).
2. Masuk ke sub-menu **"Table Editor"**.
3. Anda akan melihat tabel `user_roles` yang baru saja kita bentuk lewat script di atas. Klik tabel tersebut.
4. Klik tombol **"Insert row"**.
5. Tempel / salin **User UID** yang Anda "copy" tadi pada kolom `user_id`.
6. Pada kolom `role`, ketik: `Superadmin` (sesuaikan huruf kapital).
7. Simpan (Klik **Save**).

---

## Selesai!

Sekarang coba Anda simulasikan dengan langkah ini:
1. Kembali ke proyek web hotel Anda dan jalankan aplikasinya (`npm run dev`).
2. Website akan menolak halaman utama dan langsung redirect ke `/login`.
3. Gunakan email Superadmin dan password yang sudah dibuat di langkah ke-2.
4. Anda kini dapat membuka halaman **"Manajemen Pengguna"** (`/users`) di sidebar karena Anda sudah resmi masuk sebagai Superadmin!

> **Saran Tambahan untuk Pengelolaan Staf Kedepan:** 
> Lewat halaman "Manajemen Pengguna" (tampilan website kita), Superadmin memang dijeda secara teknis untuk *Create User*, mengingat `signUp` Supabase client-side rawan mengeluarkan / auto-logut sesi admin. Untuk murni membuat resepsionis / admin baru, Anda (Superadmin) dianjurkan untuk menduplikat langkah 2 dan 3 di atas dengan email staf tersebut, untuk sementara waktu.
