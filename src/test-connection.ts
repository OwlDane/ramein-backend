import "reflect-metadata";
import AppDataSource from "./config/database";

async function testConnection() {
  try {
    // Mencoba menginisialisasi koneksi database
    await AppDataSource.initialize();
    console.log("✅ Koneksi database berhasil dibuat!");
    
    // Mencoba menjalankan query sederhana
    const result = await AppDataSource.query('SELECT NOW() as time');
    console.log("✅ Query berhasil dijalankan!");
    console.log("⏰ Waktu server database:", result[0].time);
    
    // Mencoba mendapatkan daftar kategori kegiatan
    const categories = await AppDataSource.query('SELECT * FROM kategori_kegiatan LIMIT 5');
    console.log("✅ Data kategori kegiatan:");
    console.table(categories);
    
    // Menutup koneksi
    await AppDataSource.destroy();
    console.log("✅ Koneksi database berhasil ditutup!");
  } catch (error) {
    console.error("❌ Error saat menguji koneksi database:", error);
  }
}

// Jalankan test
testConnection();