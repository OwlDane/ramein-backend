# 🔧 Troubleshooting Guide - Ramein Backend

## 🚨 Masalah Koneksi Database

### Error: ETIMEDOUT
```
❌ Error during server initialization: AggregateError: 
    at internalConnectMultiple (node:net:1117:18)
    at afterConnectMultiple (node:1684:7) {
  code: 'ETIMEDOUT',
  [errors]: [
    Error: connect ETIMEDOUT 172.64.149.246:5432
```

### 🔍 Diagnosis
- **ETIMEDOUT**: Koneksi ke database timeout
- **ECONNREFUSED**: Koneksi ditolak oleh database
- **ENOTFOUND**: Host database tidak ditemukan

## 💡 Solusi

### 1. **Test Koneksi Database**
```bash
# Test koneksi langsung
npm run db:test

# Test koneksi dengan pooler
npm run db:test:pooler
```

### 2. **Setup Environment Variables**
```bash
# Copy file environment
copy env.example .env

# Edit file .env dengan konfigurasi yang benar
```

### 3. **Konfigurasi Database yang Benar**

#### Option A: Direct Connection (Port 5432)
```env
DATABASE_URL=postgresql://postgres:HisbBf4tBEnbTInu@db.rofxhgqffyrhencqffal.supabase.co:5432/postgres
USE_CONNECTION_URL=true
USE_POOLER=false
```

#### Option B: Connection Pooler (Port 6543) - Recommended
```env
DB_HOST=aws-1-ap-southeast-1.pooler.supabase.com
DB_PORT=6543
DB_USERNAME=postgres.rofxhgqffyrhencqffal
DB_PASSWORD=HisbBf4tBEnbTInu
DB_DATABASE=postgres
USE_POOLER=true
USE_CONNECTION_URL=false
```

### 4. **Verifikasi Supabase Dashboard**
1. Buka [Supabase Dashboard](https://supabase.com/dashboard)
2. Pilih project Anda
3. Buka tab **Database**
4. Periksa **Connection string** dan **Connection pooling**

### 5. **Test Network Connectivity**
```bash
# Test ping ke host database
ping db.rofxhgqffyrhencqffal.supabase.co

# Test port connectivity
telnet db.rofxhgqffyrhencqffal.supabase.co 5432
telnet aws-1-ap-southeast-1.pooler.supabase.com 6543
```

### 6. **Firewall & Network Issues**
- Periksa firewall Windows
- Periksa antivirus yang memblokir koneksi
- Coba koneksi dari network yang berbeda
- Periksa proxy settings

## 🚀 Setup Project Lengkap

### 1. **Install Dependencies**
```bash
npm install
```

### 2. **Setup Environment**
```bash
copy env.example .env
# Edit .env dengan konfigurasi yang sesuai
```

### 3. **Test Database Connection**
```bash
npm run db:test
# atau
npm run db:test:pooler
```

### 4. **Run Database Migrations**
```bash
npm run db:migrate
```

### 5. **Seed Initial Data**
```bash
npm run db:seed
```

### 6. **Setup Complete Database**
```bash
npm run db:setup
```

### 7. **Start Development Server**
```bash
npm run dev
```

## 📊 Status Project Backend

### ✅ **Sudah Lengkap:**
- Struktur project yang terorganisir
- Database entities (User, Event, Participant, KategoriKegiatan)
- Controllers untuk semua fitur
- Services (Email, File Upload, Export)
- Middlewares (Auth, Admin, Session Timeout)
- Routes API lengkap
- Dependencies yang diperlukan

### ❌ **Yang Perlu Dikerjakan:**
- File `.env` dengan konfigurasi yang benar
- Test koneksi database
- Run database migrations
- Seed initial data
- Unit testing
- Integration testing

## 🔗 Resources

- [Supabase Documentation](https://supabase.com/docs)
- [TypeORM Documentation](https://typeorm.io/)
- [PostgreSQL Connection Issues](https://www.postgresql.org/docs/current/runtime-config-connection.html)

## 📞 Support

Jika masih mengalami masalah, cek:
1. Log error yang lengkap
2. Status Supabase project
3. Network connectivity
4. Environment variables
