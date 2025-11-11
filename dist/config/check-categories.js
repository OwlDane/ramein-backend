"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const database_1 = __importDefault(require("./database"));
const KategoriKegiatan_1 = require("../entities/KategoriKegiatan");
async function checkCategories() {
    try {
        await database_1.default.initialize();
        console.log('✅ Database connected');
        const categoryRepository = database_1.default.getRepository(KategoriKegiatan_1.KategoriKegiatan);
        const categories = await categoryRepository.find();
        console.log('\n📦 Categories in database:');
        console.log('Total:', categories.length);
        if (categories.length === 0) {
            console.log('\n⚠️  No categories found! Creating default categories...');
            const defaultCategories = [
                { nama_kategori: 'Workshop', kategori_logo: '🎨' },
                { nama_kategori: 'Seminar', kategori_logo: '📚' },
                { nama_kategori: 'Webinar', kategori_logo: '💻' },
                { nama_kategori: 'Conference', kategori_logo: '🎤' },
                { nama_kategori: 'Training', kategori_logo: '🎓' },
            ];
            for (const cat of defaultCategories) {
                const category = new KategoriKegiatan_1.KategoriKegiatan();
                category.nama_kategori = cat.nama_kategori;
                category.kategori_logo = cat.kategori_logo;
                await categoryRepository.save(category);
                console.log(`✅ Created: ${cat.nama_kategori}`);
            }
            console.log('\n✅ Default categories created!');
        }
        else {
            categories.forEach((cat, index) => {
                console.log(`${index + 1}. ${cat.nama_kategori} (ID: ${cat.id})`);
            });
        }
        await database_1.default.destroy();
        console.log('\n✅ Done!');
    }
    catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    }
}
checkCategories();
//# sourceMappingURL=check-categories.js.map