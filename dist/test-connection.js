"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("reflect-metadata");
const database_1 = __importDefault(require("./config/database"));
async function testConnection() {
    try {
        await database_1.default.initialize();
        console.log("✅ Koneksi database berhasil dibuat!");
        const result = await database_1.default.query('SELECT NOW() as time');
        console.log("✅ Query berhasil dijalankan!");
        console.log("⏰ Waktu server database:", result[0].time);
        const categories = await database_1.default.query('SELECT * FROM kategori_kegiatan LIMIT 5');
        console.log("✅ Data kategori kegiatan:");
        console.table(categories);
        await database_1.default.destroy();
        console.log("✅ Koneksi database berhasil ditutup!");
    }
    catch (error) {
        console.error("❌ Error saat menguji koneksi database:", error);
    }
}
testConnection();
//# sourceMappingURL=test-connection.js.map