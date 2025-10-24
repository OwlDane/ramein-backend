import AppDataSource from './database';

async function addAuthorNameColumn() {
    try {
        await AppDataSource.initialize();
        console.log('✅ Database connected');

        // Add authorName column if it doesn't exist
        await AppDataSource.query(`
            ALTER TABLE "article" 
            ADD COLUMN IF NOT EXISTS "authorName" character varying;
        `);
        console.log('✅ Added authorName column to article table');

        await AppDataSource.destroy();
        console.log('✅ Done!');
    } catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    }
}

addAuthorNameColumn();
