"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const database_1 = __importDefault(require("../config/database"));
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const User_1 = require("../entities/User");
async function setupDatabase() {
    try {
        await database_1.default.initialize();
        console.log("Database connection initialized");
        await database_1.default.synchronize();
        console.log("Database synchronized");
        const userRepository = database_1.default.getRepository(User_1.User);
        const adminEmail = 'admin@agendakan.com';
        let admin = await userRepository.findOne({ where: { email: adminEmail } });
        if (!admin) {
            const hashedPassword = await bcryptjs_1.default.hash('admin123', 10);
            admin = userRepository.create({
                email: adminEmail,
                password: hashedPassword,
                name: 'Admin',
                phone: '081234567890',
                address: 'Admin Address',
                education: 'S1',
                role: User_1.UserRole.ADMIN,
                isOtpVerified: true
            });
            await userRepository.save(admin);
            console.log("Admin user created successfully");
        }
        else {
            admin.isOtpVerified = true;
            await userRepository.save(admin);
            console.log("Admin user updated and verified");
        }
        await database_1.default.query(`
    CREATE TABLE IF NOT EXISTS kategori_kegiatan (
        id SERIAL PRIMARY KEY,
        nama_kategori VARCHAR(255) NOT NULL,
        slug VARCHAR(255) NOT NULL UNIQUE,
        kategori_logo VARCHAR(255),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );

      CREATE INDEX IF NOT EXISTS idx_kategori_kegiatan_slug ON kategori_kegiatan(slug);
    `);
        console.log("Kategori kegiatan table created");
        await database_1.default.query(`
      INSERT INTO kategori_kegiatan (nama_kategori, slug, kategori_logo) 
      VALUES 
          ('Seminar', 'seminar', 'seminar.png'),
          ('Workshop', 'workshop', 'workshop.png'),
          ('Conference', 'conference', 'conference.png'),
          ('Training', 'training', 'training.png'),
          ('Webinar', 'webinar', 'webinar.png')
      ON CONFLICT (slug) DO NOTHING;
    `);
        console.log("Sample categories inserted");
        console.log("Setup completed successfully!");
    }
    catch (error) {
        console.error("Error during setup:", error);
    }
    finally {
        await database_1.default.destroy();
    }
}
setupDatabase();
//# sourceMappingURL=setup.js.map