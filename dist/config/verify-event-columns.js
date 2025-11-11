"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const database_1 = __importDefault(require("./database"));
async function verifyEventColumns() {
    try {
        await database_1.default.initialize();
        console.log('✅ Database connected');
        const result = await database_1.default.query(`
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = 'event' 
            ORDER BY ordinal_position;
        `);
        console.log('\n📋 Columns in event table:');
        result.forEach((col) => {
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
        const existingColumns = result.map((col) => col.column_name);
        newColumns.forEach(col => {
            if (existingColumns.includes(col)) {
                console.log(`  ✅ ${col} - EXISTS`);
            }
            else {
                console.log(`  ❌ ${col} - MISSING`);
            }
        });
        await database_1.default.destroy();
        console.log('\n✅ Done!');
    }
    catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    }
}
verifyEventColumns();
//# sourceMappingURL=verify-event-columns.js.map