import AppDataSource from './database';

async function verifyEventColumns() {
    try {
        await AppDataSource.initialize();
        console.log('✅ Database connected');

        // Check what columns exist in event table
        const result = await AppDataSource.query(`
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = 'event' 
            ORDER BY ordinal_position;
        `);

        console.log('\n📋 Columns in event table:');
        result.forEach((col: any) => {
            console.log(`  - ${col.column_name} (${col.data_type})`);
        });

        console.log('\n🔍 Checking for new columns...');
        const newColumns = [
            'maxParticipants',
            'registrationDeadline',
            'eventType',
            'contactPersonName',
            'contactPersonPhone',
            'contactPersonEmail',
            'meetingLink',
            'requirements',
            'benefits',
            'isFeatured',
            'tags'
        ];

        const existingColumns = result.map((col: any) => col.column_name);
        
        newColumns.forEach(col => {
            if (existingColumns.includes(col)) {
                console.log(`  ✅ ${col} - EXISTS`);
            } else {
                console.log(`  ❌ ${col} - MISSING`);
            }
        });

        await AppDataSource.destroy();
        console.log('\n✅ Done!');
    } catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    }
}

verifyEventColumns();
