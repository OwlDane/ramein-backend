"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const database_1 = __importDefault(require("../config/database"));
const seed_data_1 = __importDefault(require("../seed-data"));
async function resetAndSeed() {
    try {
        await database_1.default.initialize();
        console.log('✅ Database connected');
        await database_1.default.query('BEGIN');
        await database_1.default.query('SET CONSTRAINTS ALL DEFERRED');
        await database_1.default.query('TRUNCATE TABLE participant RESTART IDENTITY CASCADE');
        await database_1.default.query('TRUNCATE TABLE event RESTART IDENTITY CASCADE');
        await database_1.default.query('TRUNCATE TABLE kategori_kegiatan RESTART IDENTITY CASCADE');
        await database_1.default.query('TRUNCATE TABLE "user" RESTART IDENTITY CASCADE');
        await database_1.default.query('COMMIT');
        console.log('🧹 Tables truncated');
        await database_1.default.destroy();
        await (0, seed_data_1.default)();
    }
    catch (error) {
        try {
            await database_1.default.query('ROLLBACK');
        }
        catch (_a) { }
        console.error('❌ Reset-seed failed:', error);
        process.exit(1);
    }
}
if (require.main === module) {
    resetAndSeed();
}
exports.default = resetAndSeed;
//# sourceMappingURL=reset-and-seed.js.map