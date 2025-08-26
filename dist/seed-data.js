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