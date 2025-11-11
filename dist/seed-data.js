"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const database_1 = __importDefault(require("./config/database"));
const User_1 = require("./entities/User");
const KategoriKegiatan_1 = require("./entities/KategoriKegiatan");
const Event_1 = require("./entities/Event");
const Testimonial_1 = require("./entities/Testimonial");
const bcrypt = __importStar(require("bcryptjs"));
const dotenv = __importStar(require("dotenv"));
dotenv.config();
async function seedData() {
    var _a, _b, _c, _d, _e, _f, _g, _h, _j;
    try {
        await database_1.default.initialize();
        console.log('✅ Database connected successfully');
        const adminExists = await database_1.default.getRepository(User_1.User).findOne({
            where: { email: 'admin@ramein.com' }
        });
        if (!adminExists) {
            const hashedPassword = await bcrypt.hash('Admin123#', 12);
            const adminUser = database_1.default.getRepository(User_1.User).create({
                email: 'admin@ramein.com',
                password: hashedPassword,
                name: 'Administrator',
                phone: '081234567890',
                address: 'Jl. Admin No. 1, Jakarta',
                education: 'S1 Teknik Informatika',
                isVerified: true,
                role: User_1.UserRole.ADMIN
            });
            await database_1.default.getRepository(User_1.User).save(adminUser);
            console.log('✅ Admin user created successfully');
        }
        else {
            console.log('⚠️  Admin user already exists');
        }
        const categories = [
            { nama_kategori: 'Seminar', slug: 'seminar', kategori_logo: 'seminar.png' },
            { nama_kategori: 'Workshop', slug: 'workshop', kategori_logo: 'workshop.png' },
            { nama_kategori: 'Conference', slug: 'conference', kategori_logo: 'conference.png' },
            { nama_kategori: 'Training', slug: 'training', kategori_logo: 'training.png' },
            { nama_kategori: 'Webinar', slug: 'webinar', kategori_logo: 'webinar.png' }
        ];
        for (const category of categories) {
            const existingCategory = await database_1.default.getRepository(KategoriKegiatan_1.KategoriKegiatan).findOne({
                where: { slug: category.slug }
            });
            if (!existingCategory) {
                const newCategory = database_1.default.getRepository(KategoriKegiatan_1.KategoriKegiatan).create(category);
                await database_1.default.getRepository(KategoriKegiatan_1.KategoriKegiatan).save(newCategory);
                console.log(`✅ Category '${category.nama_kategori}' created successfully`);
            }
            else {
                console.log(`⚠️  Category '${category.nama_kategori}' already exists`);
            }
        }
        const testUserExists = await database_1.default.getRepository(User_1.User).findOne({
            where: { email: 'user@test.com' }
        });
        if (!testUserExists) {
            const hashedPassword = await bcrypt.hash('User123#', 12);
            const testUser = database_1.default.getRepository(User_1.User).create({
                email: 'user@test.com',
                password: hashedPassword,
                name: 'Test User',
                phone: '081234567891',
                address: 'Jl. Test No. 1, Jakarta',
                education: 'S1 Sistem Informasi',
                isVerified: true,
                role: User_1.UserRole.USER
            });
            await database_1.default.getRepository(User_1.User).save(testUser);
            console.log('✅ Test user created successfully');
        }
        else {
            console.log('⚠️  Test user already exists');
        }
        const admin = await database_1.default.getRepository(User_1.User).findOne({ where: { email: 'admin@ramein.com' } });
        const eventRepo = database_1.default.getRepository(Event_1.Event);
        if (admin) {
            const base = new Date();
            const next = (days) => {
                const d = new Date(base);
                d.setDate(d.getDate() + days);
                return d;
            };
            const sampleEvents = [
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
                        title: ev.title,
                        description: ev.description,
                        date: ev.date,
                        time: ev.time,
                        location: ev.location,
                        flyer: ev.flyer,
                        category: ev.category,
                        price: (_a = ev.price) !== null && _a !== void 0 ? _a : 0,
                        createdBy: ev.createdBy,
                        isPublished: true
                    });
                    await eventRepo.save(newEvent);
                    console.log(`✅ Event '${ev.title}' created`);
                }
                else {
                    exists.description = (_b = ev.description) !== null && _b !== void 0 ? _b : exists.description;
                    exists.date = (_c = ev.date) !== null && _c !== void 0 ? _c : exists.date;
                    exists.time = (_d = ev.time) !== null && _d !== void 0 ? _d : exists.time;
                    exists.location = (_e = ev.location) !== null && _e !== void 0 ? _e : exists.location;
                    exists.flyer = (_f = ev.flyer) !== null && _f !== void 0 ? _f : exists.flyer;
                    exists.category = (_g = ev.category) !== null && _g !== void 0 ? _g : exists.category;
                    exists.price = (_j = (_h = ev.price) !== null && _h !== void 0 ? _h : exists.price) !== null && _j !== void 0 ? _j : 0;
                    exists.isPublished = true;
                    await eventRepo.save(exists);
                    console.log(`🔄 Event '${ev.title}' updated`);
                }
            }
        }
        else {
            console.log('⚠️  Admin user not found, skipping event seeding');
        }
        const testimonialRepo = database_1.default.getRepository(Testimonial_1.Testimonial);
        const testimonials = [
            {
                name: "Sarah Johnson",
                role: "Marketing Manager",
                company: "Tech Innovators Inc",
                content: "Ramein made organizing our company events incredibly easy! The platform is intuitive and the certificate generation feature saved us hours of work.",
                avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop",
                rating: 5,
                sortOrder: 1
            },
            {
                name: "Michael Chen",
                role: "Event Coordinator",
                company: "StartupHub",
                content: "Best event management platform I've used. The attendance tracking feature is phenomenal and participants love the automated certificates!",
                avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop",
                rating: 5,
                sortOrder: 2
            },
            {
                name: "Emily Rodriguez",
                role: "Community Lead",
                company: "DevConnect",
                content: "Ramein transformed how we handle our monthly meetups. Registration is smooth, and the analytics help us understand our audience better.",
                avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop",
                rating: 5,
                sortOrder: 3
            },
            {
                name: "David Kim",
                role: "Conference Organizer",
                company: "TechSummit",
                content: "From ticketing to certificates, everything works seamlessly. Our attendees appreciate the professional experience Ramein provides.",
                avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&h=100&fit=crop",
                rating: 5,
                sortOrder: 4
            },
            {
                name: "Lisa Anderson",
                role: "Training Manager",
                company: "LearnTech Academy",
                content: "The platform handles everything from registration to post-event certificates. It's a complete solution that just works!",
                avatar: "https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?w=100&h=100&fit=crop",
                rating: 5,
                sortOrder: 5
            },
            {
                name: "James Wilson",
                role: "Workshop Facilitator",
                company: "SkillBridge",
                content: "Ramein's user-friendly interface makes event management stress-free. The automated notifications keep everyone informed and engaged.",
                avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop",
                rating: 5,
                sortOrder: 6
            }
        ];
        for (const testimonialData of testimonials) {
            const existingTestimonial = await testimonialRepo.findOne({
                where: { name: testimonialData.name, company: testimonialData.company }
            });
            if (!existingTestimonial) {
                const testimonial = testimonialRepo.create(testimonialData);
                await testimonialRepo.save(testimonial);
                console.log(`✅ Testimonial from ${testimonialData.name} created successfully`);
            }
            else {
                console.log(`⚠️  Testimonial from ${testimonialData.name} already exists`);
            }
        }
        console.log('✅ All seed data completed successfully');
        await database_1.default.destroy();
        console.log('✅ Database connection closed');
    }
    catch (error) {
        console.error('❌ Error seeding data:', error);
        process.exit(1);
    }
}
if (require.main === module) {
    seedData();
}
exports.default = seedData;
//# sourceMappingURL=seed-data.js.map