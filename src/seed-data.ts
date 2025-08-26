import AppDataSource from './config/database';
import { User, UserRole } from './entities/User';
import { KategoriKegiatan } from './entities/KategoriKegiatan';
import * as bcrypt from 'bcryptjs';
import * as dotenv from 'dotenv';

dotenv.config();

async function seedData() {
    try {
        // Initialize database connection
        await AppDataSource.initialize();
        console.log('✅ Database connected successfully');

        // Seed admin user
        const adminExists = await AppDataSource.getRepository(User).findOne({
            where: { email: 'admin@ramein.com' }
        });

        if (!adminExists) {
            const hashedPassword = await bcrypt.hash('Admin123#', 12);
            const adminUser = AppDataSource.getRepository(User).create({
                email: 'admin@ramein.com',
                password: hashedPassword,
                name: 'Administrator',
                phone: '081234567890',
                address: 'Jl. Admin No. 1, Jakarta',
                education: 'S1 Teknik Informatika',
                isVerified: true,
                role: UserRole.ADMIN
            });

            await AppDataSource.getRepository(User).save(adminUser);
            console.log('✅ Admin user created successfully');
        } else {
            console.log('⚠️  Admin user already exists');
        }

        // Seed event categories
        const categories = [
            { nama_kategori: 'Seminar', slug: 'seminar', kategori_logo: 'seminar.png' },
            { nama_kategori: 'Workshop', slug: 'workshop', kategori_logo: 'workshop.png' },
            { nama_kategori: 'Conference', slug: 'conference', kategori_logo: 'conference.png' },
            { nama_kategori: 'Training', slug: 'training', kategori_logo: 'training.png' },
            { nama_kategori: 'Webinar', slug: 'webinar', kategori_logo: 'webinar.png' }
        ];

        for (const category of categories) {
            const existingCategory = await AppDataSource.getRepository(KategoriKegiatan).findOne({
                where: { slug: category.slug }
            });

            if (!existingCategory) {
                const newCategory = AppDataSource.getRepository(KategoriKegiatan).create(category);
                await AppDataSource.getRepository(KategoriKegiatan).save(newCategory);
                console.log(`✅ Category '${category.nama_kategori}' created successfully`);
            } else {
                console.log(`⚠️  Category '${category.nama_kategori}' already exists`);
            }
        }

        // Seed sample user for testing
        const testUserExists = await AppDataSource.getRepository(User).findOne({
            where: { email: 'user@test.com' }
        });

        if (!testUserExists) {
            const hashedPassword = await bcrypt.hash('User123#', 12);
            const testUser = AppDataSource.getRepository(User).create({
                email: 'user@test.com',
                password: hashedPassword,
                name: 'Test User',
                phone: '081234567891',
                address: 'Jl. Test No. 1, Jakarta',
                education: 'S1 Sistem Informasi',
                isVerified: true,
                role: UserRole.USER
            });

            await AppDataSource.getRepository(User).save(testUser);
            console.log('✅ Test user created successfully');
        } else {
            console.log('⚠️  Test user already exists');
        }

        console.log('✅ All seed data completed successfully');
        
        // Close connection
        await AppDataSource.destroy();
        console.log('✅ Database connection closed');
        
    } catch (error) {
        console.error('❌ Error seeding data:', error);
        process.exit(1);
    }
}

// Run seed if this file is executed directly
if (require.main === module) {
    seedData();
}

export default seedData;
