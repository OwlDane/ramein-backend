import AppDataSource from "../config/database";
import bcrypt from 'bcryptjs';
import { User, UserRole } from "../entities/User";

async function setupDatabase() {
    try {
        // Initialize database connection
        await AppDataSource.initialize();
        console.log("Database connection initialized");

        // Create tables if they don't exist
        await AppDataSource.synchronize();
        console.log("Database synchronized");

        // Create admin user if it doesn't exist
        const userRepository = AppDataSource.getRepository(User);
        const adminEmail = 'admin@agendakan.com';

        let admin = await userRepository.findOne({ where: { email: adminEmail } });

        if (!admin) {
            const hashedPassword = await bcrypt.hash('admin123', 10);

            admin = userRepository.create({
                email: adminEmail,
                password: hashedPassword,
                name: 'Admin',
                phone: '081234567890',
                address: 'Admin Address',
                education: 'S1',
                role: UserRole.ADMIN,
                isVerified: true
            });

            await userRepository.save(admin);
            console.log("Admin user created successfully");
        } else {
            // Update admin user to ensure it's verified
            admin.isVerified = true;
            await userRepository.save(admin);
            console.log("Admin user updated and verified");
        }

        // Run kategori_kegiatan migrations
        await AppDataSource.query(`
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

        // Insert sample categories
        await AppDataSource.query(`
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
    } catch (error) {
        console.error("Error during setup:", error);
    } finally {
        await AppDataSource.destroy();
    }
}

setupDatabase();
