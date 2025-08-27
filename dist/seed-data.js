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
const bcrypt = __importStar(require("bcryptjs"));
const dotenv = __importStar(require("dotenv"));
dotenv.config();
async function seedData() {
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
                isOtpVerified: true,
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
                isOtpVerified: true,
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
            const sampleEvents = [
                {
                    uniqueKey: 'Workshop React Advanced 2025-01-15',
                    title: 'Workshop React Advanced',
                    description: 'Pelajari teknik advanced React untuk pengembangan aplikasi modern',
                    date: new Date(new Date().getFullYear(), 0, 15),
                    time: '09:00',
                    location: 'Jakarta Convention Center',
                    flyer: 'https://images.unsplash.com/photo-1517180102446-f3ece451e9d8?w=800',
                    createdBy: admin.id,
                    isPublished: true
                },
                {
                    uniqueKey: 'Digital Marketing Summit 2025-01-20',
                    title: 'Digital Marketing Summit',
                    description: 'Event terbesar untuk para digital marketer di Indonesia',
                    date: new Date(new Date().getFullYear(), 0, 20),
                    time: '08:00',
                    location: 'Balai Kartini, Jakarta',
                    flyer: 'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=800',
                    createdBy: admin.id,
                    isPublished: true
                },
                {
                    uniqueKey: 'Startup Pitch Competition 2025-01-25',
                    title: 'Startup Pitch Competition',
                    description: 'Kompetisi pitch untuk startup teknologi terbaik',
                    date: new Date(new Date().getFullYear(), 0, 25),
                    time: '10:00',
                    location: 'Universitas Indonesia',
                    flyer: 'https://images.unsplash.com/photo-1556761175-b413da4baf72?w=800',
                    createdBy: admin.id,
                    isPublished: true
                },
                {
                    uniqueKey: 'UI/UX Design Masterclass 2025-02-01',
                    title: 'UI/UX Design Masterclass',
                    description: 'Masterclass design UI/UX dengan mentor berpengalaman',
                    date: new Date(new Date().getFullYear(), 1, 1),
                    time: '13:00',
                    location: 'Design Studio, Bandung',
                    flyer: 'https://images.unsplash.com/photo-1581291518857-4e27b48ff24e?w=800',
                    createdBy: admin.id,
                    isPublished: true
                },
                {
                    uniqueKey: 'Blockchain & Web3 Conference 2025-02-10',
                    title: 'Blockchain & Web3 Conference',
                    description: 'Konferensi terbesar tentang teknologi blockchain dan Web3',
                    date: new Date(new Date().getFullYear(), 1, 10),
                    time: '09:00',
                    location: 'Grand Hyatt, Jakarta',
                    flyer: 'https://images.unsplash.com/photo-1639762681485-074b7f938ba0?w=800',
                    createdBy: admin.id,
                    isPublished: true
                }
            ];
            for (const ev of sampleEvents) {
                const exists = await eventRepo.findOne({ where: { title: ev.title, date: ev.date } });
                if (!exists) {
                    const newEvent = eventRepo.create({
                        title: ev.title,
                        description: ev.description,
                        date: ev.date,
                        time: ev.time,
                        location: ev.location,
                        flyer: ev.flyer,
                        createdBy: ev.createdBy,
                        isPublished: true
                    });
                    await eventRepo.save(newEvent);
                    console.log(`✅ Event '${ev.title}' created`);
                }
                else {
                    console.log(`⚠️  Event '${ev.title}' already exists`);
                }
            }
        }
        else {
            console.log('⚠️  Admin user not found, skipping event seeding');
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