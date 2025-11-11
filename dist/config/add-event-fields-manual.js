"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const database_1 = __importDefault(require("./database"));
async function addEventFieldsManual() {
    var _a, _b;
    try {
        await database_1.default.initialize();
        console.log('✅ Database connected');
        console.log('\n🔧 Adding new columns to event table...\n');
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
                await database_1.default.query(statement);
                const columnName = (_b = (_a = statement.match(/"(\w+)"/g)) === null || _a === void 0 ? void 0 : _a[1]) === null || _b === void 0 ? void 0 : _b.replace(/"/g, '');
                console.log(`✅ Added column: ${columnName}`);
            }
            catch (error) {
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
                await database_1.default.query(statement);
                console.log(`✅ Created index`);
            }
            catch (error) {
                console.log(`⚠️  ${error.message}`);
            }
        }
        await database_1.default.destroy();
        console.log('\n✅ Migration completed!');
    }
    catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    }
}
addEventFieldsManual();
//# sourceMappingURL=add-event-fields-manual.js.map