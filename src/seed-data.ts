import AppDataSource from './config/database';
import { User, UserRole } from './entities/User';
import { KategoriKegiatan } from './entities/KategoriKegiatan';
import { Event } from './entities/Event';
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

        // Seed sample events (published & upcoming)
        const admin = await AppDataSource.getRepository(User).findOne({ where: { email: 'admin@ramein.com' } });
        const eventRepo = AppDataSource.getRepository(Event);

        if (admin) {
            const base = new Date();
            const next = (days: number) => {
                const d = new Date(base);
                d.setDate(d.getDate() + days);
                return d;
            };

            const sampleEvents: Array<Partial<Event> & { uniqueKey: string }> = [
                {
                    uniqueKey: 'Workshop React Advanced +5d',
                    title: 'Workshop React Advanced',
                    description: 'Pelajari teknik advanced React untuk pengembangan aplikasi modern',
                    date: next(5),
                    time: '09:00',
                    location: 'Jakarta Convention Center',
                    flyer: 'https://images.unsplash.com/photo-1517180102446-f3ece451e9d8?w=800',
                    category: 'Technology',
                    price: 150000,
                    createdBy: admin.id,
                    isPublished: true
                },
                {
                    uniqueKey: 'Digital Marketing Summit +10d',
                    title: 'Digital Marketing Summit',
                    description: 'Event terbesar untuk para digital marketer di Indonesia',
                    date: next(10),
                    time: '08:00',
                    location: 'Balai Kartini, Jakarta',
                    flyer: 'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=800',
                    category: 'Marketing',
                    price: 300000,
                    createdBy: admin.id,
                    isPublished: true
                },
                {
                    uniqueKey: 'Startup Pitch Competition +14d',
                    title: 'Startup Pitch Competition',
                    description: 'Kompetisi pitch untuk startup teknologi terbaik',
                    date: next(14),
                    time: '10:00',
                    location: 'Universitas Indonesia',
                    flyer: 'https://images.unsplash.com/photo-1556761175-b413da4baf72?w=800',
                    category: 'Business',
                    price: 0,
                    createdBy: admin.id,
                    isPublished: true
                },
                {
                    uniqueKey: 'UI/UX Design Masterclass +20d',
                    title: 'UI/UX Design Masterclass',
                    description: 'Masterclass design UI/UX dengan mentor berpengalaman',
                    date: next(20),
                    time: '13:00',
                    location: 'Design Studio, Bandung',
                    flyer: 'https://images.unsplash.com/photo-1581291518857-4e27b48ff24e?w=800',
                    category: 'Design',
                    price: 200000,
                    createdBy: admin.id,
                    isPublished: true
                },
                {
                    uniqueKey: 'Blockchain & Web3 Conference +25d',
                    title: 'Blockchain & Web3 Conference',
                    description: 'Konferensi terbesar tentang teknologi blockchain dan Web3',
                    date: next(25),
                    time: '09:00',
                    location: 'Grand Hyatt, Jakarta',
                    flyer: 'https://images.unsplash.com/photo-1639762681485-074b7f938ba0?w=800',
                    category: 'Technology',
                    price: 500000,
                    createdBy: admin.id,
                    isPublished: true
                },
                {
                    uniqueKey: 'Data Science Bootcamp +30d',
                    title: 'Data Science Bootcamp',
                    description: 'Bootcamp intensif data science untuk pemula hingga mahir',
                    date: next(30),
                    time: '09:00',
                    location: 'Telkom University, Bandung',
                    flyer: 'https://images.unsplash.com/photo-1515879218367-8466d910aaa4?w=800',
                    category: 'Technology',
                    price: 350000,
                    createdBy: admin.id,
                    isPublished: true
                },
                {
                    uniqueKey: 'Cybersecurity Essentials +33d',
                    title: 'Cybersecurity Essentials',
                    description: 'Pelatihan dasar keamanan siber untuk profesional IT',
                    date: next(33),
                    time: '13:30',
                    location: 'BINUS Anggrek, Jakarta',
                    flyer: 'https://images.unsplash.com/photo-1555949963-aa79dcee981d?w=800',
                    category: 'Technology',
                    price: 250000,
                    createdBy: admin.id,
                    isPublished: true
                },
                {
                    uniqueKey: 'AI in Healthcare +40d',
                    title: 'AI in Healthcare',
                    description: 'Konferensi penerapan AI di dunia kesehatan',
                    date: next(40),
                    time: '10:00',
                    location: 'Siloam Hospitals Convention Hall',
                    flyer: 'https://images.unsplash.com/photo-1581091870622-7f3c1cf5b1b5?w=800',
                    category: 'Technology',
                    price: 420000,
                    createdBy: admin.id,
                    isPublished: true
                },
                {
                    uniqueKey: 'Product Management Summit +45d',
                    title: 'Product Management Summit',
                    description: 'Ajang berkumpulnya para product manager di Indonesia',
                    date: next(45),
                    time: '09:30',
                    location: 'The Kasablanka Hall, Jakarta',
                    flyer: 'https://images.unsplash.com/photo-1521737604893-d14cc237f11d?w=800',
                    category: 'Business',
                    price: 275000,
                    createdBy: admin.id,
                    isPublished: true
                },
                {
                    uniqueKey: 'Cloud Native Conference +52d',
                    title: 'Cloud Native Conference',
                    description: 'Best practices Kubernetes, microservices, dan cloud-native stack',
                    date: next(52),
                    time: '08:30',
                    location: 'ICE BSD, Tangerang',
                    flyer: 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=800',
                    category: 'Technology',
                    price: 380000,
                    createdBy: admin.id,
                    isPublished: true
                },
                {
                    uniqueKey: 'Mobile Dev Fest +60d',
                    title: 'Mobile Dev Fest',
                    description: 'Festival developer mobile: Android, iOS, dan cross-platform',
                    date: next(60),
                    time: '10:00',
                    location: 'Universitas Gadjah Mada, Yogyakarta',
                    flyer: 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=800',
                    category: 'Technology',
                    price: 0,
                    createdBy: admin.id,
                    isPublished: true
                },
                {
                    uniqueKey: 'DevOps Hands-on Workshop +70d',
                    title: 'DevOps Hands-on Workshop',
                    description: 'Workshop praktik CI/CD, monitoring, dan IaC',
                    date: next(70),
                    time: '09:00',
                    location: 'Dojo Bali',
                    flyer: 'https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=800',
                    category: 'Technology',
                    price: 195000,
                    createdBy: admin.id,
                    isPublished: true
                },
                {
                    uniqueKey: 'Fintech Innovation Forum +78d',
                    title: 'Fintech Innovation Forum',
                    description: 'Forum inovasi pembayaran digital dan regulasi',
                    date: next(78),
                    time: '09:00',
                    location: 'Bank Indonesia Institute, Jakarta',
                    flyer: 'https://images.unsplash.com/photo-1559526323-cb2f2fe2591b?w=800',
                    category: 'Business',
                    price: 310000,
                    createdBy: admin.id,
                    isPublished: true
                },
                {
                    uniqueKey: 'EdTech Summit +85d',
                    title: 'EdTech Summit',
                    description: 'Masa depan teknologi pendidikan dan kurikulum digital',
                    date: next(85),
                    time: '13:00',
                    location: 'Universitas Indonesia Convention Center',
                    flyer: 'https://images.unsplash.com/photo-1496307042754-b4aa456c4a2d?w=800',
                    category: 'Business',
                    price: 0,
                    createdBy: admin.id,
                    isPublished: true
                },
                {
                    uniqueKey: 'GreenTech Expo +95d',
                    title: 'GreenTech Expo',
                    description: 'Pameran teknologi hijau dan energi terbarukan',
                    date: next(95),
                    time: '09:00',
                    location: 'JCC Senayan, Jakarta',
                    flyer: 'https://images.unsplash.com/photo-1509395176047-4a66953fd231?w=800',
                    category: 'Design',
                    price: 160000,
                    createdBy: admin.id,
                    isPublished: true
                },
                {
                    uniqueKey: 'Logistics & Supply Chain Summit +105d',
                    title: 'Logistics & Supply Chain Summit',
                    description: 'Optimasi rantai pasok dengan teknologi modern',
                    date: next(105),
                    time: '10:00',
                    location: 'Grand City, Surabaya',
                    flyer: 'https://images.unsplash.com/photo-1553413077-190dd305871c?w=800',
                    category: 'Business',
                    price: 220000,
                    createdBy: admin.id,
                    isPublished: true
                },
                {
                    uniqueKey: 'Smart City Conference +115d',
                    title: 'Smart City Conference',
                    description: 'Mewujudkan kota pintar melalui IoT dan data',
                    date: next(115),
                    time: '09:30',
                    location: 'Bandung Techno Park',
                    flyer: 'https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?w=800',
                    category: 'Technology',
                    price: 410000,
                    createdBy: admin.id,
                    isPublished: true
                },
                {
                    uniqueKey: 'Creative Coding Festival +125d',
                    title: 'Creative Coding Festival',
                    description: 'Eksplorasi seni generatif dan creative coding',
                    date: next(125),
                    time: '13:00',
                    location: 'Museum MACAN, Jakarta',
                    flyer: 'https://images.unsplash.com/photo-1518773553398-650c184e0bb3?w=800',
                    category: 'Creative',
                    price: 0,
                    createdBy: admin.id,
                    isPublished: true
                },
                {
                    uniqueKey: 'E-Commerce Growth Hack +135d',
                    title: 'E-Commerce Growth Hack',
                    description: 'Strategi pertumbuhan e-commerce berbasis data',
                    date: next(135),
                    time: '09:00',
                    location: 'Pullman Central Park, Jakarta',
                    flyer: 'https://images.unsplash.com/photo-1556742393-d75f468bfcb0?w=800',
                    category: 'Marketing',
                    price: 185000,
                    createdBy: admin.id,
                    isPublished: true
                },
                {
                    uniqueKey: 'Robotics Expo +145d',
                    title: 'Robotics Expo',
                    description: 'Pameran robotika industri dan edukasi',
                    date: next(145),
                    time: '10:00',
                    location: 'ITS, Surabaya',
                    flyer: 'https://images.unsplash.com/photo-1581091012184-7c54eca46b7e?w=800',
                    category: 'Technology',
                    price: 275000,
                    createdBy: admin.id,
                    isPublished: true
                }
            ];

            for (const ev of sampleEvents) {
                const exists = await eventRepo.findOne({ where: { title: ev.title } });
                if (!exists) {
                    const newEvent = eventRepo.create({
                        title: ev.title!,
                        description: ev.description!,
                        date: ev.date!,
                        time: ev.time!,
                        location: ev.location!,
                        flyer: ev.flyer!,
                        category: ev.category!,
                        price: ev.price ?? 0,
                        createdBy: ev.createdBy!,
                        isPublished: true
                    });
                    await eventRepo.save(newEvent);
                    console.log(`✅ Event '${ev.title}' created`);
                } else {
                    // Update essential fields to keep data fresh
                    exists.description = ev.description ?? exists.description;
                    exists.date = ev.date ?? exists.date;
                    exists.time = ev.time ?? exists.time;
                    exists.location = ev.location ?? exists.location;
                    exists.flyer = ev.flyer ?? exists.flyer;
                    exists.category = ev.category ?? exists.category;
                    exists.price = ev.price ?? (exists as any).price ?? 0;
                    exists.isPublished = true;
                    await eventRepo.save(exists);
                    console.log(`🔄 Event '${ev.title}' updated`);
                }
            }
        } else {
            console.log('⚠️  Admin user not found, skipping event seeding');
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
