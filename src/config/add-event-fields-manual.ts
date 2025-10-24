import AppDataSource from './database';

async function addEventFieldsManual() {
    try {
        await AppDataSource.initialize();
        console.log('✅ Database connected');

        console.log('\n🔧 Adding new columns to event table...\n');

        // Add columns one by one
        const alterStatements = [
            'ALTER TABLE "event" ADD COLUMN IF NOT EXISTS "maxParticipants" integer',
            'ALTER TABLE "event" ADD COLUMN IF NOT EXISTS "registrationDeadline" timestamp',
            'ALTER TABLE "event" ADD COLUMN IF NOT EXISTS "eventType" character varying DEFAULT \'offline\'',
            'ALTER TABLE "event" ADD COLUMN IF NOT EXISTS "contactPersonName" character varying',
            'ALTER TABLE "event" ADD COLUMN IF NOT EXISTS "contactPersonPhone" character varying',
            'ALTER TABLE "event" ADD COLUMN IF NOT EXISTS "contactPersonEmail" character varying',
            'ALTER TABLE "event" ADD COLUMN IF NOT EXISTS "meetingLink" text',
            'ALTER TABLE "event" ADD COLUMN IF NOT EXISTS "requirements" text',
            'ALTER TABLE "event" ADD COLUMN IF NOT EXISTS "benefits" text',
            'ALTER TABLE "event" ADD COLUMN IF NOT EXISTS "isFeatured" boolean DEFAULT false',
            'ALTER TABLE "event" ADD COLUMN IF NOT EXISTS "tags" text'
        ];

        for (const statement of alterStatements) {
            try {
                await AppDataSource.query(statement);
                const columnName = statement.match(/"(\w+)"/g)?.[1]?.replace(/"/g, '');
                console.log(`✅ Added column: ${columnName}`);
            } catch (error: any) {
                console.log(`⚠️  ${error.message}`);
            }
        }

        console.log('\n🔧 Creating indexes...\n');

        const indexStatements = [
            'CREATE INDEX IF NOT EXISTS "IDX_event_eventType" ON "event" ("eventType")',
            'CREATE INDEX IF NOT EXISTS "IDX_event_isFeatured" ON "event" ("isFeatured")',
            'CREATE INDEX IF NOT EXISTS "IDX_event_registrationDeadline" ON "event" ("registrationDeadline")'
        ];

        for (const statement of indexStatements) {
            try {
                await AppDataSource.query(statement);
                console.log(`✅ Created index`);
            } catch (error: any) {
                console.log(`⚠️  ${error.message}`);
            }
        }

        await AppDataSource.destroy();
        console.log('\n✅ Migration completed!');
    } catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    }
}

addEventFieldsManual();
