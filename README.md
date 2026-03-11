# 🏨 PPKD Hotel — Reservation System

Aplikasi web untuk manajemen registrasi tamu dan pembuatan invoice reservasi hotel PPKD.

---

## 🚀 Menjalankan Aplikasi

```bash
npm install
npm run dev
```

Buka `http://localhost:5173` di browser.

---

## 📋 Modul Penggunaan

### Alur Kerja

```
[Form Registrasi] → [Pembayaran] → [Invoice / Konfirmasi]
       /                /payment          /confirmation
```

---

### Langkah 1 — Formulir Registrasi (`/`)

Isi data tamu melalui 4 bagian:

#### 🛏 Informasi Kamar
| Field | Wajib | Keterangan |
|---|---|---|
| Room No. | — | Nomor kamar, contoh: `0601` |
| No. of Room | — | Jumlah kamar yang dipesan |
| No. of Person | — | Jumlah tamu |
| Room Type | — | Standard / Deluxe / Suite |
| Receptionist | — | Nama resepsionis bertugas |

#### 👤 Data Tamu
| Field | Wajib | Keterangan |
|---|---|---|
| Nama / Name | ✅ | Nama lengkap sesuai KTP/Passport |
| Pekerjaan, Perusahaan | — | Opsional |
| No. KTP / Passport | — | Nomor identitas |
| Kebangsaan, Tgl Lahir | — | Opsional |
| Alamat, Telepon, Email | — | Opsional |
| No. Member | — | Kartu keanggotaan jika ada |

#### 📅 Tanggal Menginap
| Field | Wajib | Keterangan |
|---|---|---|
| Arrival Time | — | Jam kedatangan |
| Arrival Date | ✅ | Tanggal check-in |
| Departure Date | ✅ | Tanggal check-out |

> Total malam dihitung otomatis dari selisih Arrival & Departure Date.

#### 🔒 Safety Deposit Box
Isi nomor kotak, nama penerbit, dan tanggal jika diperlukan.

Klik **`Submit & Generate Invoice →`** untuk lanjut ke pembayaran.

---

### Langkah 2 — Pembayaran (`/payment`)

Halaman ini menampilkan ringkasan booking dan kalkulasi biaya secara otomatis.

#### 💰 Harga Kamar Per Malam
| Tipe | Harga |
|---|---|
| Standard | Rp 1.500.000 |
| Deluxe | Rp 2.500.000 |
| Suite | Rp 4.000.000 |

#### 🧮 Kalkulasi Biaya
- **Subtotal** = Harga/malam × Jumlah Kamar × Jumlah Malam
- **PPN** = 11% dari subtotal
- **Service Charge** = 5% dari subtotal
- **Grand Total** = Subtotal + PPN + Service Charge

#### 💳 Metode Pembayaran
| Metode | Keterangan |
|---|---|
| **Cash** | Bayar tunai saat check-in |
| **Bank Transfer** | Transfer ke rekening Mandiri PPKD Hotel, isi nomor referensi opsional |
| **Kartu Kredit** | Isi nomor kartu, nama pemegang, dan expired date |

Klik **`Konfirmasi Pembayaran →`** untuk menuju invoice.

---

### Langkah 3 — Invoice / Konfirmasi (`/confirmation`)

Dokumen konfirmasi resmi berisi:
- Data tamu & booking (nomor booking di-generate otomatis)
- Detail kamar dan tanggal menginap
- **Tabel Rincian Biaya** — subtotal, PPN, service charge, dan Grand Total
- Metode pembayaran yang dipilih
- Kebijakan pembatalan hotel
- Kolom tanda tangan *Authorized Signature*

#### 🖨 Mencetak Invoice
Klik tombol **`Print Confirmation`** (hijau, kanan atas). Gunakan:
- Ukuran kertas: **A4**, orientasi **Portrait**
- Atau pilih **"Save as PDF"** untuk menyimpan

> ⚠️ **Perhatian:** Data tidak tersimpan ke database. Jangan tutup/refresh halaman konfirmasi sebelum mencetak.

---

## 📌 Kebijakan Hotel

1. Check-in: **14.00** | Check-out: **12.00**
2. Reservasi tanpa jaminan dibatalkan otomatis pukul **18.00**
3. Reservasi bergaransi yang tidak dibatalkan sebelum hari kedatangan dikenakan biaya **1 malam**

---

## 🛠 Tech Stack

- [React](https://react.dev/) + [Vite](https://vite.dev/)
- [Tailwind CSS v4](https://tailwindcss.com/)
- [React Router DOM](https://reactrouter.com/)
- Deploy: [Vercel](https://vercel.com/)
