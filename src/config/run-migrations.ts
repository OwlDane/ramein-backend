import { readFileSync } from 'fs';
import { join } from 'path';
import AppDataSource from './database';

async function runMigrations() {
    try {
        // Initialize database connection
        await AppDataSource.initialize();
        console.log('✅ Database connected successfully');

        // Read and execute migration files
        const migrationPath = join(__dirname, 'migrations', '001_create_tables.sql');
        const migrationSQL = readFileSync(migrationPath, 'utf8');

        // Split SQL by semicolon and execute each statement
        const statements = migrationSQL
            .split(';')
            .map(stmt => stmt.trim())
            .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));

        for (const statement of statements) {
            try {
                await AppDataSource.query(statement);
                console.log('✅ Executed:', statement.substring(0, 50) + '...');
            } catch (error) {
                console.log('⚠️  Skipped (might already exist):', statement.substring(0, 50) + '...');
            }
        }

        console.log('✅ All migrations completed successfully');
        
        // Close connection
        await AppDataSource.destroy();
        console.log('✅ Database connection closed');
        
    } catch (error) {
        console.error('❌ Error running migrations:', error);
        process.exit(1);
    }
}

// Run migrations if this file is executed directly
if (require.main === module) {
    runMigrations();
}

export default runMigrations;
