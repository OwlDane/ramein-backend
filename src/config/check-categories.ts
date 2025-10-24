import AppDataSource from './database';
import { KategoriKegiatan } from '../entities/KategoriKegiatan';

async function checkCategories() {
    try {
        await AppDataSource.initialize();
        console.log('✅ Database connected');

        const categoryRepository = AppDataSource.getRepository(KategoriKegiatan);
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
                const category = new KategoriKegiatan();
                category.nama_kategori = cat.nama_kategori;
                category.kategori_logo = cat.kategori_logo;
                await categoryRepository.save(category);
                console.log(`✅ Created: ${cat.nama_kategori}`);
            }

            console.log('\n✅ Default categories created!');
        } else {
            categories.forEach((cat, index) => {
                console.log(`${index + 1}. ${cat.nama_kategori} (ID: ${cat.id})`);
            });
        }

        await AppDataSource.destroy();
        console.log('\n✅ Done!');
    } catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    }
}

checkCategories();
