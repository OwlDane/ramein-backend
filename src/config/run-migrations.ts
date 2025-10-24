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

        // Ensure new columns exist on event table (category, price)
        try {
            await AppDataSource.query(`
                ALTER TABLE "event"
                ADD COLUMN IF NOT EXISTS "category" varchar,
                ADD COLUMN IF NOT EXISTS "price" numeric(10,2) DEFAULT 0 NOT NULL;
            `);
            console.log('✅ Ensured event.category and event.price columns exist');
        } catch (error) {
            console.log('⚠️  Skipped adding category/price columns (might already exist)');
        }

        // Create certificate_template table
        try {
            await AppDataSource.query(`
                CREATE TABLE IF NOT EXISTS "certificate_template" (
                    "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                    "name" varchar NOT NULL,
                    "description" text,
                    "category" varchar DEFAULT 'custom',
                    "templateUrl" text NOT NULL,
                    "thumbnailUrl" text,
                    "isDefault" boolean DEFAULT false,
                    "isActive" boolean DEFAULT true,
                    "placeholders" jsonb,
                    "settings" jsonb,
                    "createdBy" varchar,
                    "createdAt" timestamp NOT NULL DEFAULT now(),
                    "updatedAt" timestamp NOT NULL DEFAULT now(),
                    CONSTRAINT "certificate_template_pkey" PRIMARY KEY ("id")
                );
            `);
            console.log('✅ Created certificate_template table');
        } catch (error) {
            console.log('⚠️  Skipped creating certificate_template table (might already exist)');
        }

        // Create indexes for certificate_template
        try {
            await AppDataSource.query(`
                CREATE INDEX IF NOT EXISTS "IDX_certificate_template_category" ON "certificate_template" ("category");
            `);
            await AppDataSource.query(`
                CREATE INDEX IF NOT EXISTS "IDX_certificate_template_isDefault" ON "certificate_template" ("isDefault");
            `);
            console.log('✅ Created indexes for certificate_template');
        } catch (error) {
            console.log('⚠️  Skipped creating indexes (might already exist)');
        }

        // Run article tables migration
        try {
            const articleMigrationPath = join(__dirname, 'migrations', '002_create_article_tables.sql');
            const articleMigrationSQL = readFileSync(articleMigrationPath, 'utf8');

            // Split SQL by semicolon and execute each statement
            const articleStatements = articleMigrationSQL
                .split(';')
                .map(stmt => stmt.trim())
                .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));

            for (const statement of articleStatements) {
                try {
                    await AppDataSource.query(statement);
                    console.log('✅ Executed article migration:', statement.substring(0, 50) + '...');
                } catch (error) {
                    console.log('⚠️  Skipped article migration (might already exist):', statement.substring(0, 50) + '...');
                }
            }
            console.log('✅ Article tables migration completed');
        } catch (error) {
            console.log('⚠️  Article migration file not found or error:', error);
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
