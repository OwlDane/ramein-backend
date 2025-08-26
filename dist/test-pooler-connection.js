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
const database_pooler_1 = __importDefault(require("./config/database-pooler"));
const dotenv = __importStar(require("dotenv"));
dotenv.config();
async function testPoolerConnection() {
    console.log('🔍 Testing Supabase connection pooler...');
    console.log('📊 Environment:', process.env.NODE_ENV || 'development');
    console.log('🔗 Using connection pooler on port 6543');
    try {
        await database_pooler_1.default.initialize();
        console.log('✅ Connection pooler connection successful!');
        const result = await database_pooler_1.default.query('SELECT NOW() as current_time');
        console.log('✅ Query test successful:', result[0]);
        const tables = await database_pooler_1.default.query(`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public'
            ORDER BY table_name
        `);
        console.log('📋 Available tables:');
        tables.forEach((table) => {
            console.log(`   - ${table.table_name}`);
        });
        await database_pooler_1.default.destroy();
        console.log('✅ Connection closed successfully');
        console.log('\n🎉 Connection pooler is working!');
        console.log('💡 You can now use this configuration for better performance.');
    }
    catch (error) {
        console.error('❌ Connection pooler connection failed:');
        console.error('   Error:', error.message);
        if (error.code === 'ETIMEDOUT') {
            console.error('   🔍 Diagnosis: Connection timeout to pooler');
            console.error('   💡 Solutions:');
            console.error('      1. Check your internet connection');
            console.error('      2. Verify Supabase pooler is accessible');
            console.error('      3. Check firewall settings');
            console.error('      4. Try direct connection instead');
        }
        else if (error.code === 'ECONNREFUSED') {
            console.error('   🔍 Diagnosis: Pooler connection refused');
            console.error('   💡 Solutions:');
            console.error('      1. Check pooler host and port');
            console.error('      2. Verify pooler is running');
            console.error('      3. Check credentials');
        }
        console.error('\n🔧 Next steps:');
        console.error('   1. Try direct connection: npm run db:test');
        console.error('   2. Check Supabase dashboard for pooler status');
        console.error('   3. Verify network connectivity');
        process.exit(1);
    }
}
if (require.main === module) {
    testPoolerConnection();
}
exports.default = testPoolerConnection;
//# sourceMappingURL=test-pooler-connection.js.map