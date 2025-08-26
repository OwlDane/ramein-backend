"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const database_1 = __importDefault(require("./config/database"));
const dotenv = __importStar(require("dotenv"));
dotenv.config();
async function testDatabaseConnection() {
    console.log('🔍 Testing database connection...');
    console.log('📊 Environment:', process.env.NODE_ENV || 'development');
    console.log('🔗 Database URL:', process.env.DATABASE_URL ? 'Set' : 'Not set');
    try {
        await database_1.default.initialize();
        console.log('✅ Database connection successful!');
        const result = await database_1.default.query('SELECT NOW() as current_time');
        console.log('✅ Query test successful:', result[0]);
        const tables = await database_1.default.query(`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public'
            ORDER BY table_name
        `);
        console.log('📋 Available tables:');
        tables.forEach((table) => {
            console.log(`   - ${table.table_name}`);
        });
        await database_1.default.destroy();
        console.log('✅ Connection closed successfully');
    }
    catch (error) {
        console.error('❌ Database connection failed:');
        console.error('   Error:', error.message);
        if (error.code === 'ETIMEDOUT') {
            console.error('   🔍 Diagnosis: Connection timeout');
            console.error('   💡 Solutions:');
            console.error('      1. Check your internet connection');
            console.error('      2. Verify Supabase is accessible');
            console.error('      3. Check firewall settings');
            console.error('      4. Try using connection pooler');
        }
        else if (error.code === 'ECONNREFUSED') {
            console.error('   🔍 Diagnosis: Connection refused');
            console.error('   💡 Solutions:');
            console.error('      1. Check database host and port');
            console.error('      2. Verify database is running');
            console.error('      3. Check credentials');
        }
        else if (error.code === 'ENOTFOUND') {
            console.error('   🔍 Diagnosis: Host not found');
            console.error('   💡 Solutions:');
            console.error('      1. Check database host URL');
            console.error('      2. Verify DNS resolution');
        }
        console.error('\n🔧 Troubleshooting steps:');
        console.error('   1. Copy env.example to .env');
        console.error('   2. Update DATABASE_URL in .env');
        console.error('   3. Check Supabase dashboard');
        console.error('   4. Verify network connectivity');
        process.exit(1);
    }
}
if (require.main === module) {
    testDatabaseConnection();
}
exports.default = testDatabaseConnection;
//# sourceMappingURL=test-db-connection.js.map