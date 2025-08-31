# 🚀 Ramein Event Management System - Backend

## 🛠️ Tech Stack

![Node.js](https://img.shields.io/badge/Node.js-18.x-339933?style=for-the-badge&logo=node.js&logoColor=white)  
![Express.js](https://img.shields.io/badge/Express.js-4.x-000000?style=for-the-badge&logo=express&logoColor=white)  
![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?style=for-the-badge&logo=typescript&logoColor=white)  
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-12+-336791?style=for-the-badge&logo=postgresql&logoColor=white)  
![TypeORM](https://img.shields.io/badge/TypeORM-0.3.x-F37626?style=for-the-badge&logo=typeorm&logoColor=white)  
![Docker](https://img.shields.io/badge/Docker-Enabled-2496ED?style=for-the-badge&logo=docker&logoColor=white)  
![JWT](https://img.shields.io/badge/JWT-Authentication-000000?style=for-the-badge&logo=jsonwebtokens&logoColor=white)  
![Nodemailer](https://img.shields.io/badge/Nodemailer-Email%20Service-0072C6?style=for-the-badge&logo=gmail&logoColor=white)  

---

## 📋 Deskripsi

🎉 **Ramein** adalah sistem manajemen kegiatan yang dirancang untuk mempermudah pengelolaan event secara digital.  
Dengan sistem ini, penyelenggara dapat mengatur event, memverifikasi peserta, mengelola sertifikat, dan menghasilkan laporan dengan cepat dan aman.

---

## ✨ Fitur Utama

### 🔐 Autentikasi & Keamanan
- 🔑 JWT Authentication (dengan refresh token)
- 👥 Role-based Access Control (USER, ADMIN)
- 📧 Email verification (OTP)
- 🔄 Password reset dengan token aman
- ⏳ Session timeout management
- 🌐 CORS protection dengan whitelist domain

### 📅 Manajemen Event
- 📝 CRUD event dengan validasi tanggal (H-3)
- 🏷️ Event categories & pricing
- 🎟️ Event packages untuk berbagai tipe peserta
- 📢 Event publishing system
- 🔍 Search & filter event (kategori, tanggal, harga)
- 🖼️ Event flyer management

### 👥 Manajemen Peserta
- 🆕 Registrasi user dengan verifikasi email
- 🎫 Pendaftaran event dengan validasi
- ✅ Attendance tracking (hadir/tidak hadir)
- 📊 Participant dashboard dengan riwayat event
- 📥 Bulk import peserta (Excel/CSV)

### 🏆 Sistem Sertifikat
- 🖨️ Generasi sertifikat otomatis
- 🔎 Verifikasi sertifikat dengan QR code
- 🧾 Metadata sertifikat untuk tracking
- 📄 PDF generation dengan template custom
- 🚫 Sistem pencabutan sertifikat

### 🧑‍💼 Admin Dashboard
- 📈 Statistik komprehensif (event, peserta, kehadiran)
- 📆 Laporan bulanan dengan grafik
- 👨‍👩‍👦 User management & role assignment
- 🔎 Event analytics & performance tracking
- 📤 Export data ke Excel/CSV/PDF

### 📊 Reporting & Analytics
- 📡 Real-time dashboard metrics
- 📝 Attendance reports per event
- 👥 Participant statistics dengan filter
- 📉 Event performance analysis
- 📂 Data export dalam berbagai format

---

## 🚀 Quick Start

### Prerequisites
- ⚡ Node.js **v18+**  
- 🐘 PostgreSQL **v12+**  
- 📦 npm atau yarn  

### Installation
```bash
# Clone repository
git clone <repository-url>
cd ramein-backend

# Install dependencies
npm install

# Setup environment
cp env.example .env
# Edit .env dengan konfigurasi database & service

# Setup database
npm run db:setup

# Jalankan development server
npm run dev
````

### Environment Variables

```env
# Database
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=your_username
DB_PASSWORD=your_password
DB_DATABASE=ramein_db

# JWT
JWT_SECRET=your_jwt_secret
JWT_REFRESH_SECRET=your_refresh_secret

# Email
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password

# Frontend
FRONTEND_URL=http://localhost:3000
```

---

## 📁 Project Structure

```
src/
├── config/        # Database & configuration
├── controllers/   # Request handlers
├── entities/      # Database models
├── middlewares/   # Custom middleware
├── migrations/    # Database migrations
├── routes/        # API endpoints
├── services/      # Business logic
├── utils/         # Helper functions
└── app.ts         # Express app setup
```

---

## 🔗 API Endpoints

### Authentication

* `POST /api/auth/register` - 🆕 Registrasi user
* `POST /api/auth/login` - 🔑 Login user
* `POST /api/auth/verify-email` - 📧 Verifikasi email
* `POST /api/auth/forgot-password` - 🔄 Reset password request
* `POST /api/auth/reset-password` - 🔒 Reset password

### Events

* `GET /api/events` - 📋 Ambil semua event
* `POST /api/events` - 🆕 Buat event baru (Admin only)
* `PUT /api/events/:id` - ✏️ Update event (Admin only)
* `DELETE /api/events/:id` - 🗑️ Hapus event (Admin only)

### Participants

* `POST /api/participants/register` - 🎟️ Daftar ke event
* `GET /api/participants/event/:eventId` - 👥 Ambil peserta event
* `PUT /api/participants/:id/attendance` - ✅ Update attendance

### Certificates

* `POST /api/certificates/generate` - 🖨️ Generate sertifikat
* `GET /api/certificates/verify/:number` - 🔎 Verifikasi sertifikat
* `GET /api/certificates/event/:eventId` - 🏆 Ambil sertifikat event

### Admin

* `GET /api/admin/dashboard` - 📊 Statistik dashboard
* `GET /api/admin/users` - 👤 User management
* `GET /api/admin/export/:type` - 📤 Export data

---

## 🧪 Testing

```bash
# Test database connection
npm run test:db

# Test services
npm run test:services

# Test repository
npm run test:repo
```

---

## 📊 Database Schema

**Core Entities**

* **User** - Akun user dengan role-based access
* **Event** - Data event dengan kategori & packages
* **Participant** - Registrasi & attendance peserta
* **Certificate** - Sertifikat & sistem verifikasi
* **EventPackage** - Pricing tiers event
* **KategoriKegiatan** - Kategori kegiatan

---

## 🚀 Deployment

### Production Build

```bash
npm run build
npm start
```

### Docker (Optional)

```bash
docker build -t ramein-backend .
docker run -p 3001:3001 ramein-backend
```

---

## 📝 API Documentation

📚 Dokumentasi API tersedia di endpoint:

* `/api/docs` (Swagger, jika diaktifkan)
* Postman collection (disediakan terpisah)

---

## 🤝 Contributing

1. 🍴 Fork repository
2. 🌱 Buat feature branch (`git checkout -b feature/AmazingFeature`)
3. 💾 Commit perubahan (`git commit -m 'Add some AmazingFeature'`)
4. 🚀 Push ke branch (`git push origin feature/AmazingFeature`)
5. 🔀 Open Pull Request

---

## 📄 License

📌 Distributed under the **ISC License**.
Lihat file `LICENSE` untuk detail lebih lanjut.

---

## 👥 Team

**Ramein Team** – 🎓 Ujikom Project

---

## 📞 Support

💬 Untuk support dan pertanyaan, silakan buat **issue** di repository atau hubungi tim development.
