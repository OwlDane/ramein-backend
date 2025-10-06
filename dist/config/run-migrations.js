"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fs_1 = require("fs");
const path_1 = require("path");
const database_1 = __importDefault(require("./database"));
async function runMigrations() {
    try {
        await database_1.default.initialize();
        console.log('✅ Database connected successfully');
        const migrationPath = (0, path_1.join)(__dirname, 'migrations', '001_create_tables.sql');
        const migrationSQL = (0, fs_1.readFileSync)(migrationPath, 'utf8');
        const statements = migrationSQL
            .split(';')
            .map(stmt => stmt.trim())
            .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));
        for (const statement of statements) {
            try {
                await database_1.default.query(statement);
                console.log('✅ Executed:', statement.substring(0, 50) + '...');
            }
            catch (error) {
                console.log('⚠️  Skipped (might already exist):', statement.substring(0, 50) + '...');
            }
        }
        try {
            await database_1.default.query(`
                ALTER TABLE "event"
                ADD COLUMN IF NOT EXISTS "category" varchar,
                ADD COLUMN IF NOT EXISTS "price" numeric(10,2) DEFAULT 0 NOT NULL;
            `);
            console.log('✅ Ensured event.category and event.price columns exist');
        }
        catch (error) {
            console.log('⚠️  Skipped adding category/price columns (might already exist)');
        }
        try {
            await database_1.default.query(`
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
        }
        catch (error) {
            console.log('⚠️  Skipped creating certificate_template table (might already exist)');
        }
        try {
            await database_1.default.query(`
                CREATE INDEX IF NOT EXISTS "IDX_certificate_template_category" ON "certificate_template" ("category");
            `);
            await database_1.default.query(`
                CREATE INDEX IF NOT EXISTS "IDX_certificate_template_isDefault" ON "certificate_template" ("isDefault");
            `);
            console.log('✅ Created indexes for certificate_template');
        }
        catch (error) {
            console.log('⚠️  Skipped creating indexes (might already exist)');
        }
        console.log('✅ All migrations completed successfully');
        await database_1.default.destroy();
        console.log('✅ Database connection closed');
    }
    catch (error) {
        console.error('❌ Error running migrations:', error);
        process.exit(1);
    }
}
if (require.main === module) {
    runMigrations();
}
exports.default = runMigrations;
//# sourceMappingURL=run-migrations.js.map