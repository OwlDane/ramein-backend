import { readFileSync } from 'fs';
import { join } from 'path';
import AppDataSource from './database';

async function addEventFields() {
    try {
        await AppDataSource.initialize();
        console.log('✅ Database connected');

        // Read migration file
        const migrationPath = join(__dirname, 'migrations', '003_add_event_fields.sql');
        const migrationSQL = readFileSync(migrationPath, 'utf8');

        // Split SQL by semicolon and execute each statement
        const statements = migrationSQL
            .split(';')
            .map(stmt => stmt.trim())
            .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));

        for (const statement of statements) {
            try {
                await AppDataSource.query(statement);
                console.log('✅ Executed:', statement.substring(0, 60) + '...');
            } catch (error) {
                console.log('⚠️  Skipped (might already exist):', statement.substring(0, 60) + '...');
            }
        }

        console.log('\n✅ Event fields migration completed!');
        
        await AppDataSource.destroy();
        console.log('✅ Database connection closed');
    } catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    }
}

addEventFields();
