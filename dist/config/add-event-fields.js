"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fs_1 = require("fs");
const path_1 = require("path");
const database_1 = __importDefault(require("./database"));
async function addEventFields() {
    try {
        await database_1.default.initialize();
        console.log('✅ Database connected');
        const migrationPath = (0, path_1.join)(__dirname, 'migrations', '003_add_event_fields.sql');
        const migrationSQL = (0, fs_1.readFileSync)(migrationPath, 'utf8');
        const statements = migrationSQL
            .split(';')
            .map(stmt => stmt.trim())
            .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));
        for (const statement of statements) {
            try {
                await database_1.default.query(statement);
                console.log('✅ Executed:', statement.substring(0, 60) + '...');
            }
            catch (error) {
                console.log('⚠️  Skipped (might already exist):', statement.substring(0, 60) + '...');
            }
        }
        console.log('\n✅ Event fields migration completed!');
        await database_1.default.destroy();
        console.log('✅ Database connection closed');
    }
    catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    }
}
addEventFields();
//# sourceMappingURL=add-event-fields.js.map