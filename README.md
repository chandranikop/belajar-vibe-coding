# Belajar Vibe Coding

Aplikasi ini adalah contoh backend API sederhana yang dibangun menggunakan **Bun**, **ElysiaJS**, dan **Drizzle ORM** dengan database **MySQL**. Aplikasi ini menyediakan fitur dasar autentikasi pengguna seperti registrasi, login, mengambil data pengguna yang sedang login, dan logout.

## 🏗️ Struktur Folder dan Arsitektur

Proyek ini menggunakan pemisahan tanggung jawab (Separation of Concerns) dalam arsitekturnya.

```text
├── .env                  # Environment variables
├── bun.lock              # Lockfile untuk dependensi Bun
├── drizzle.config.ts     # Konfigurasi Drizzle ORM
├── package.json          # List dependensi dan script npm/bun
├── tsconfig.json         # Konfigurasi TypeScript
├── test/                 # Folder untuk unit/integration test
│   └── users.test.ts     # Test case untuk fitur user
└── src/
    ├── index.ts          # Entry point aplikasi & inisialisasi server
    ├── db/               # Inisialisasi koneksi database & skema
    │   ├── index.ts      # Koneksi database Drizzle
    │   ├── migrations/   # File hasil generate Drizzle migrations
    │   └── schema/       # Definisi skema tabel database (users, sessions)
    ├── routes/           # Layer Routing (Definisi Endpoint/API Elysia)
    │   └── users-route.ts
    ├── services/         # Layer Business Logic
    │   └── users-service.ts
    └── utils/            # Layer utilitas/fungsi bantuan (jika ada)
```

## 🚀 API yang Tersedia

Base path untuk API di bawah ini adalah `/api/users`.

| Method | Endpoint | Deskripsi | Authentication | Body Request |
|--------|----------|-----------|----------------|--------------|
| **POST** | `/` | Mendaftarkan pengguna baru (Register) | Tidak | `{ "name": "...", "email": "...", "password": "..." }` |
| **POST** | `/login` | Login pengguna dan mendapatkan token | Tidak | `{ "email": "...", "password": "..." }` |
| **GET** | `/current` | Mendapatkan data user yang sedang login | Ya (Bearer Token) | - |
| **DELETE**| `/logout` | Logout dan menghapus sesi token | Ya (Bearer Token) | - |

> **Catatan Authentication:** Untuk endpoint yang memerlukan authentication, wajib mengirimkan header `Authorization` dengan value `Bearer <TOKEN>`.

## 🗄️ Skema Database

Aplikasi ini menggunakan MySQL. Terdapat 2 tabel utama:

### Tabel `users`
- `id` (INT / Serial) - Primary Key
- `username` (VARCHAR 255)
- `email` (VARCHAR 255) - Unique
- `password` (VARCHAR 255)
- `createdAt` (TIMESTAMP)

### Tabel `sessions`
- `id` (INT / Serial) - Primary Key
- `token` (VARCHAR 255)
- `userId` (BIGINT) - Foreign Key ke `users.id`
- `createdAt` (TIMESTAMP)

## 🛠️ Technology Stack

- **Runtime:** [Bun](https://bun.sh/)
- **Bahasa:** [TypeScript](https://www.typescriptlang.org/)
- **Web Framework:** [ElysiaJS](https://elysiajs.com/)
- **ORM:** [Drizzle ORM](https://orm.drizzle.team/)
- **Database:** [MySQL](https://www.mysql.com/)

## 📦 Library yang Digunakan

- `elysia` (^1.4.28) - Core web framework untuk membuat server & router.
- `drizzle-orm` (^0.45.2) - Library ORM untuk berinteraksi dengan database secara type-safe.
- `drizzle-kit` (^0.31.10) - CLI tool dari Drizzle untuk mengelola migrasi schema database.
- `mysql2` (^3.20.0) - MySQL client / driver untuk Node.js & Bun.
- `@types/bun` - Typing support untuk Bun runtime.

## ⚙️ Cara Setup Project

1. **Clone repositori / Ekstrak source code**
2. **Install dependensi** menggunakan Bun:
   ```bash
   bun install
   ```
3. **Setup Environment Variables**:
   Duplikat atau copy file `.env.example` menjadi `.env` lalu setel URL koneksi database MySQL Anda:
   ```bash
   DATABASE_URL="mysql://username:password@localhost:3306/nama_database"
   ```
4. **Push / Generate Database Schema**:
   Untuk membuat tabel di database secara langsung berdasarkan skema:
   ```bash
   bun run db:push
   ```
   Atau jika ingin men-generate file migrasinya terlebih dahulu:
   ```bash
   bun run db:generate
   ```

## ▶️ Cara Run Aplikasi

Untuk menjalankan aplikasi di mode development (dengan watch mode / auto reload):

```bash
bun run dev
```

Secara default, aplikasi akan berjalan pada port `3000` atau sesuai dengan environment variable `PORT`.
Buka `http://localhost:3000` di browser atau API client Anda.

## 🧪 Cara Test Aplikasi

Karena project ini menggunakan test runner dari Bun secara native. Anda dapat menjalankan command berikut untuk memulai unit/integration test:

```bash
bun test
```
Ini akan otomatis menemukan dan menjalankan semua test case yang ada (seperti dalam folder `test/`).
