# 🎯 Kapanggih - Backend API

Backend API untuk Sistem Informasi Manajemen Kegiatan (Event) Kapanggih yang dapat mengakomodir pembuatan kegiatan oleh admin, pendaftaran publik, dan rekap data kegiatan.

## ✨ Fitur Utama

### 🔐 Authentication & Authorization
- ✅ Register user dengan validasi email
- ✅ Login dengan JWT
- ✅ Verifikasi email dengan OTP (5 menit expired)
- ✅ Reset password
- ✅ Role-based access control (Admin/User)
- ✅ Session timeout otomatis (5 menit)

### 📅 Event Management
- ✅ CRUD event (Admin only)
- ✅ Validasi H-3 untuk pembuatan event
- ✅ Publish/unpublish event
- ✅ Search dan sorting event
- ✅ Upload flyer dan sertifikat

### 👥 Participant Management
- ✅ Pendaftaran event dengan token 10 digit
- ✅ Daftar hadir dengan token verification
- ✅ Riwayat event user
- ✅ Sertifikat management
- ✅ Export data ke Excel/CSV

### 📊 Admin Dashboard
- ✅ Statistik event per bulan (Januari - Desember)
- ✅ Statistik peserta per bulan
- ✅ Top 10 event dengan peserta terbanyak
- ✅ Export dashboard data
- ✅ User management

### 📧 Email Service
- ✅ Verifikasi email
- ✅ Reset password
- ✅ Konfirmasi pendaftaran event dengan token

## 🚀 Quick Start

### Prerequisites
- Node.js (v16+)
- PostgreSQL database
- SMTP server untuk email

### Installation

1. **Clone repository**
```bash
git clone <repository-url>
cd ujikom-be
```

2. **Install dependencies**
```bash
npm install
```

3. **Environment setup**
```bash
cp .env.example .env
# Edit .env dengan konfigurasi yang sesuai
```

4. **Database setup**
```bash
# Pastikan database PostgreSQL sudah running
# Update konfigurasi database di .env
```

5. **Run development server**
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
DB_DATABASE=kapanggih

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

### Users
- `id` (UUID, Primary Key)
- `email` (String, Unique)
- `password` (String, Hashed)
- `name` (String)
- `phone` (String)
- `address` (String)
- `education` (String)
- `isVerified` (Boolean)
- `verificationToken` (String)
- `tokenExpiry` (Timestamp)
- `resetToken` (String)
- `resetTokenExpiry` (Timestamp)
- `role` (Enum: USER/ADMIN)

### Events
- `id` (UUID, Primary Key)
- `title` (String)
- `date` (Date)
- `time` (String)
- `location` (String)
- `flyer` (String, File path)
- `certificate` (String, File path)
- `description` (Text)
- `createdBy` (String, User ID)
- `isPublished` (Boolean)
- `createdAt` (Timestamp)
- `updatedAt` (Timestamp)

### Participants
- `id` (UUID, Primary Key)
- `userId` (String, Foreign Key)
- `eventId` (String, Foreign Key)
- `tokenNumber` (String, Unique)
- `hasAttended` (Boolean)
- `attendedAt` (Timestamp)
- `certificateUrl` (String)
- `createdAt` (Timestamp)
- `updatedAt` (Timestamp)

## 🛡️ Security Features

- ✅ Password hashing dengan bcrypt
- ✅ JWT authentication
- ✅ Role-based access control
- ✅ Input validation
- ✅ SQL injection protection
- ✅ CORS configuration
- ✅ Rate limiting
- ✅ Session timeout

## 📝 Scripts

```bash
# Development
npm run dev          # Start development server
npm run dev:watch    # Start with file watching

# Production
npm run build        # Build TypeScript
npm start           # Start production server

# Utilities
npm run lint        # Type checking
npm run clean       # Clean build files
```

## 🧪 Testing

```bash
# Run tests (coming soon)
npm test

# Run tests with coverage
npm run test:coverage
```

## 📈 Monitoring & Logging

- Morgan HTTP request logging
- Error logging dengan stack trace
- Performance monitoring
- Health check endpoint

## 🚀 Deployment

### Production Build
```bash
npm run build
npm start
```

### Docker (coming soon)
```bash
docker build -t kapanggih-backend .
docker run -p 3001:3001 kapanggih-backend
```

## 🤝 Contributing

1. Fork repository
2. Create feature branch
3. Commit changes
4. Push to branch
5. Create Pull Request

## 📄 License

This project is licensed under the ISC License.

## 👥 Team

- **Kapanggih Team** - UJIKOM Project

## 📞 Support

Untuk pertanyaan dan dukungan, silakan buat issue di repository ini.
