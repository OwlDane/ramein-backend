# 🎯 Ramein - Event Management System Backend

Backend API untuk sistem manajemen kegiatan/event **Ramein** yang dibangun dengan Node.js, Express, TypeScript, dan TypeORM.

## ✨ Fitur Utama

- 🔐 **Authentication & Authorization** - JWT-based auth dengan role-based access control
- 👥 **User Management** - Manajemen user (Admin & Regular User)
- 📅 **Event Management** - CRUD operasi untuk kegiatan/event
- 🎫 **Participant Registration** - Pendaftaran peserta kegiatan
- 📊 **Admin Dashboard** - Statistik dan laporan kegiatan
- 📁 **File Management** - Upload dan download flyer/sertifikat
- 📧 **Email Service** - Verifikasi email dan notifikasi
- 📈 **Data Export** - Export data ke Excel/CSV
- 🔒 **Security Features** - Password encryption, session timeout, validation

## 🛠️ Tech Stack

- **Runtime**: Node.js
- **Framework**: Express.js
- **Language**: TypeScript
- **ORM**: TypeORM
- **Database**: PostgreSQL (Supabase)
- **Authentication**: JWT
- **File Upload**: Multer
- **Email**: Nodemailer
- **Data Export**: ExcelJS, CSV

## 🚀 Quick Start

### 1. **Clone Repository**
```bash
git clone <repository-url>
cd ujikom-be
```

### 2. **Install Dependencies**
```bash
npm install
```

### 3. **Environment setup**
```bash
copy env.example .env
# Edit .env dengan konfigurasi yang sesuai
```

### 4. **Database setup**
```bash
# Pastikan database PostgreSQL sudah running
# Update konfigurasi database di .env
```

### 5. **Run development server**
```bash
npm run dev
```

Server akan berjalan di `http://localhost:3001`

## 📁 Struktur Project

```
src/
├── config/           # Database & konfigurasi
├── controllers/      # Business logic
├── entities/         # Database models
├── middlewares/      # Custom middleware
├── routes/           # API endpoints
├── services/         # Business services
├── app.ts           # Express app setup
└── index.ts         # Server entry point
```

## 🔌 API Endpoints

### Authentication
- `POST /api/auth/register` - Register user baru
- `POST /api/auth/login` - Login user
- `POST /api/auth/verify-email` - Verifikasi email
- `POST /api/auth/request-reset-password` - Request reset password
- `POST /api/auth/reset-password` - Reset password
- `POST /api/auth/create-admin` - Buat admin (Admin only)

### Events
- `GET /api/events` - Daftar event (public)
- `GET /api/events/:id` - Detail event (public)
- `POST /api/events` - Buat event (Admin only)
- `PUT /api/events/:id` - Update event (Admin only)
- `DELETE /api/events/:id` - Hapus event (Admin only)
- `GET /api/events/admin/statistics` - Statistik event (Admin only)

### Participants
- `POST /api/participants/register` - Daftar event
- `POST /api/participants/attendance` - Isi daftar hadir
- `GET /api/participants/my-events` - Event yang diikuti
- `GET /api/participants/my-certificates` - Sertifikat yang dimiliki
- `GET /api/participants/event/:eventId/participants` - Daftar peserta event (Admin only)
- `POST /api/participants/certificate/:participantId` - Upload sertifikat (Admin only)
- `GET /api/participants/export/:eventId` - Export data peserta (Admin only)

### Admin Dashboard
- `GET /api/admin/dashboard/stats` - Statistik dashboard
- `GET /api/admin/dashboard/export` - Export data dashboard
- `GET /api/admin/users` - Manajemen user
- `PUT /api/admin/users/:userId/role` - Update role user

### Files
- `GET /api/files/:filepath` - Download file (flyer/sertifikat)
- `DELETE /api/files/:filepath` - Hapus file (Admin only)

## 🔧 Environment Variables

```env
# Server
PORT=3001
NODE_ENV=development
BASE_URL=http://localhost:3001

# Database
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=password
DB_DATABASE=ramein

# JWT
JWT_SECRET=your-secret-key
JWT_EXPIRES_IN=1d

# Email
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password

# Frontend
FRONTEND_URL=http://localhost:3000
```

## 📊 Database Schema

### User Table
- `id` (UUID) - Primary key
- `email` (VARCHAR) - Email user (unique)
- `password` (VARCHAR) - Encrypted password
- `name` (VARCHAR) - Nama lengkap
- `phone` (VARCHAR) - Nomor telepon
- `address` (VARCHAR) - Alamat
- `education` (VARCHAR) - Pendidikan terakhir
- `isVerified` (BOOLEAN) - Status verifikasi email
- `role` (ENUM) - Role user (USER/ADMIN)
- `createdAt` (TIMESTAMP) - Waktu pembuatan
- `updatedAt` (TIMESTAMP) - Waktu update

### Event Table
- `id` (UUID) - Primary key
- `title` (VARCHAR) - Judul event
- `date` (TIMESTAMP) - Tanggal event
- `time` (VARCHAR) - Waktu event
- `location` (VARCHAR) - Lokasi event
- `flyer` (TEXT) - URL flyer
- `certificate` (TEXT) - URL sertifikat template
- `description` (TEXT) - Deskripsi event
- `createdBy` (VARCHAR) - ID pembuat event
- `isPublished` (BOOLEAN) - Status publikasi
- `createdAt` (TIMESTAMP) - Waktu pembuatan
- `updatedAt` (TIMESTAMP) - Waktu update

### Participant Table
- `id` (UUID) - Primary key
- `userId` (UUID) - Foreign key ke user
- `eventId` (UUID) - Foreign key ke event
- `tokenNumber` (VARCHAR) - Token unik untuk daftar hadir
- `hasAttended` (BOOLEAN) - Status kehadiran
- `attendedAt` (TIMESTAMP) - Waktu kehadiran
- `certificateUrl` (VARCHAR) - URL sertifikat
- `createdAt` (TIMESTAMP) - Waktu pendaftaran
- `updatedAt` (TIMESTAMP) - Waktu update

## 🧪 Testing

```bash
# Test database connection
npm run db:test

# Test connection pooler
npm run db:test:pooler

# Run database migrations
npm run db:migrate

# Seed initial data
npm run db:seed

# Setup complete database
npm run db:setup
```

## 📝 License

ISC License

## 👥 Team

**Ramein Team** - Event Management System Development

---

**Ramein** - Membuat setiap kegiatan menjadi lebih bermakna! 🎉
