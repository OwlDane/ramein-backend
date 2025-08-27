import AppDataSource from '../config/database';
import seedData from '../seed-data';

async function resetAndSeed() {
    try {
        await AppDataSource.initialize();
        console.log('✅ Database connected');

        // Disable constraints to simplify truncation
        await AppDataSource.query('BEGIN');
        await AppDataSource.query('SET CONSTRAINTS ALL DEFERRED');

        // Truncate in dependency order
        await AppDataSource.query('TRUNCATE TABLE participant RESTART IDENTITY CASCADE');
        await AppDataSource.query('TRUNCATE TABLE event RESTART IDENTITY CASCADE');
        await AppDataSource.query('TRUNCATE TABLE kategori_kegiatan RESTART IDENTITY CASCADE');
        await AppDataSource.query('TRUNCATE TABLE "user" RESTART IDENTITY CASCADE');

        await AppDataSource.query('COMMIT');
        console.log('🧹 Tables truncated');

        // Close before running seed to reuse the existing seeder init logic
        await AppDataSource.destroy();

        // Run existing seeder (handles admin, categories, users, events)
        await seedData();
    } catch (error) {
        try { await AppDataSource.query('ROLLBACK'); } catch {}
        console.error('❌ Reset-seed failed:', error);
        process.exit(1);
    }
}

if (require.main === module) {
    resetAndSeed();
}

export default resetAndSeed;


