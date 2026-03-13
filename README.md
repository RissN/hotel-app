# 🏨 PPKD Hotel — Reservation System

Sebuah aplikasi web modern (berbasis React dan Supabase) untuk manajemen registrasi tamu, autentikasi berbasis role (Admin, Superadmin, Resepsionis), dan pembuatan invoice reservasi (A4 Print-ready).

---

## 🚀 Fitur Utama

- **Sistem Autentikasi & Role-Based Access Control (RBAC):** Memisahkan hak akses antara `Resepsionis`, `Admin`, dan `Superadmin`.
- **Manajemen Pengguna (User Management):** Superadmin dapat menambah, mengedit role, dan menghapus akun staf.
- **Form Reservasi Dinamis:** Pengisian data tamu, kamar, dan periode menginap secara detail dilengkapi validasi.
- **Sistem Pembayaran Terpadu:** Kalkulasi otomatis untuk harga kamar (berdasarkan tipe kamar), PPN (11%), dan Service Charge (5%).
- **Cetak Konfirmasi (Print-Ready A4):** Halaman konfirmasi dirancang khusus dengan Tailwind CSS `@media print` agar pas persis untuk dicetak pada kertas A4 tanpa margin berlebih.
- **UI/UX Premium:** Dilengkapi dengan *animated background gradients*, transisi halus, dan komponen `CustomAlert` untuk notifikasi dan konfirmasi tindakan yang merusak (seperti hapus user).

---

## 🛠 Tech Stack

- **Frontend:** [React](https://react.dev/) + [Vite](https://vite.dev/)
- **Styling:** [Tailwind CSS v4](https://tailwindcss.com/)
- **Routing:** [React Router DOM](https://reactrouter.com/)
- **Backend & Database:** [Supabase](https://supabase.com/) (PostgreSQL & Supabase Auth)
- **Deployment:** [Vercel](https://vercel.com/) (Dianjurkan)

---

## 📋 Alur Kerja (Work Flow)

```mermaid
graph TD;
    A[Login] --> B{Role?};
    
    B -- Superadmin --> C[Dashboard Superadmin];
    C --> D[Manajemen Akun];
    C --> E[Manajemen Reservasi];

    B -- Admin --> F[Dashboard Admin];
    F --> E[Manajemen Reservasi];

    B -- Resepsionis --> G[Dashboard Resepsionis];
    G --> H[Buat Reservasi Baru];

    H[Form Registrasi] --> I[Halaman Pembayaran & Kalkulasi];
    I --> J[Halaman Konfirmasi & Cetak Invoice];
```

---

## 🚀 Cara Instalasi & Setup

### 1. Clone & Install Dependencies
```bash
git clone https://github.com/RissN/hotel-app.git
cd hotel-app
npm install
```

### 2. Setup Supabase
Aplikasi ini membutuhkan Supabase untuk Auth dan Database.

1. Buat project baru di [Supabase](https://supabase.com).
2. Dapatkan `Project URL` dan `API Key (anon/public)`.
3. Buat file `.env` di folder root project:
   ```env
   VITE_SUPABASE_URL=your_supabase_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

### 3. Setup Database (SQL Migrations)
Jalankan script SQL berikut di menu **SQL Editor** pada dashboard Supabase untuk menyiapkan tabel dan fungsi yang diperlukan:

1. **Jalankan script pembuatan tabel & trigger** yang ada di panduan Supabase Setup awal Anda (untuk `user_roles`, `identities`, dll).
2. **Jalankan Fungsi Manajemen User** (Untuk digunakan oleh Superadmin di menu Manajemen Akun):

```sql
-- Fungsi untuk menambahkan user baru dengan role
CREATE OR REPLACE FUNCTION create_user_by_admin(email text, password text, assign_role text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  new_user_id uuid;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role IN ('Admin', 'Superadmin')) THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  new_user_id := gen_random_uuid();
  -- Insert to auth (Requires elevated privileges securely handled by trigger/RPC)
  INSERT INTO auth.users (id, instance_id, aud, role, email, encrypted_password, email_confirmed_at, created_at, updated_at)
  VALUES (new_user_id, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', email, crypt(password, gen_salt('bf')), now(), now(), now());

  INSERT INTO auth.identities (id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at)
  VALUES (new_user_id, new_user_id, format('{"sub":"%s","email":"%s"}', new_user_id::text, email)::jsonb, 'email', new_user_id::text, now(), now(), now());

  INSERT INTO user_roles (user_id, role) VALUES (new_user_id, assign_role);
END;
$$;

-- Fungsi untuk mengedit role user
CREATE OR REPLACE FUNCTION update_user_role_by_admin(target_user_id uuid, new_role text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role IN ('Admin', 'Superadmin')) THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;
  UPDATE user_roles SET role = new_role WHERE user_id = target_user_id;
END;
$$;

-- Fungsi menghapus user
CREATE OR REPLACE FUNCTION delete_user_by_admin(target_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role IN ('Admin', 'Superadmin')) THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;
  DELETE FROM auth.users WHERE id = target_user_id;
END;
$$;
```

### 4. Jalankan Aplikasi
```bash
npm run dev
```
Buka `http://localhost:5173` di browser.

---

## 📖 Panduan Penggunaan Modul

### 1. Halaman Login (`/login`)
Silakan masuk menggunakan email dan password yang terdaftar di Supabase. Sistem otomatis mendeteksi role Anda (Resepsionis, Admin, atau Superadmin) dan meneruskan Anda ke dashboard yang sesuai.

### 2. Manajemen Akun (Khusus Superadmin)
Diakses melalui menu "Manajemen Akun" pada dashboard Superadmin.
- **Tambah User:** Superadmin dapat menambahkan email, password, dan memilih role.
- **Edit User:** Mengubah role staf (kecuali sesama Superadmin).
- **Hapus User:** Menghapus akun dari sistem (ditandai dengan popup konfirmasi pengamanan).

### 3. Formulir Reservasi (`/registration`)
Diakses melalui menu Dashboard (khususnya Resepsionis). Formulir mencakup:
- **Informasi Kamar:** Nomor, Jumlah, Tipe, Resepsionis.
- **Data Tamu:** Nama sesuai KTP, No. Identitas, Perusahaan.
- **Tanggal:** Arrival Date & Departure Date (otomatis menghitung per malam).

Klik **`Submit & Checkout`** untuk menuju pembayaran.

### 4. Halaman Pembayaran (`/payment`)
- Otomatis menghitung: `Harga Kamar × Total Malam × Jumlah Kamar`.
- Menambahkan **PPN 11%** dan **Service Charge 5%**.
- Terdapat metode pembayaran: tunai, transfer bank, dan kartu kredit.

Klik **`Bayar & Cetak Struk`** untuk menuju konfirmasi cetak.

### 5. Invoice & Konfirmasi (`/confirmation`)
- Halaman ini menampilkan bukti reservasi resmi.
- **Untuk Mencetak:** Klik tombol **`Print Confirmation`** warna hijau di sudut kanan.
- Pastikan pengaturan printer browser Anda berada di ukuran **A4 Portrait** (tidak perlu mengatur margin karena sistem sudah otomatis).

---

## 📌 Kebijakan Hotel PPKD

1. Waktu Check-in: **14.00 PM**
2. Waktu Check-out: **12.00 PM**
3. Reservasi **tanpa jaminan** dibatalkan otomatis pada pukul **18.00**.
4. Pembatalan reservasi **bergaransi** setelah hari kedatangan akan dikenakan biaya penalty sebesar harga **1 malam**.
