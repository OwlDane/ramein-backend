import AppDataSourcePooler from './config/database-pooler';
import * as dotenv from 'dotenv';

dotenv.config();

async function testPoolerConnection() {
    console.log('🔍 Testing Supabase connection pooler...');
    console.log('📊 Environment:', process.env.NODE_ENV || 'development');
    console.log('🔗 Using connection pooler on port 6543');
    
    try {
        // Test connection
        await AppDataSourcePooler.initialize();
        console.log('✅ Connection pooler connection successful!');
        
        // Test basic query
        const result = await AppDataSourcePooler.query('SELECT NOW() as current_time');
        console.log('✅ Query test successful:', result[0]);
        
        // Test table existence
        const tables = await AppDataSourcePooler.query(`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public'
            ORDER BY table_name
        `);
        
        console.log('📋 Available tables:');
        tables.forEach((table: any) => {
            console.log(`   - ${table.table_name}`);
        });
        
        // Close connection
        await AppDataSourcePooler.destroy();
        console.log('✅ Connection closed successfully');
        
        console.log('\n🎉 Connection pooler is working!');
        console.log('💡 You can now use this configuration for better performance.');
        
    } catch (error: any) {
        console.error('❌ Connection pooler connection failed:');
        console.error('   Error:', error.message);
        
        if (error.code === 'ETIMEDOUT') {
            console.error('   🔍 Diagnosis: Connection timeout to pooler');
            console.error('   💡 Solutions:');
            console.error('      1. Check your internet connection');
            console.error('      2. Verify Supabase pooler is accessible');
            console.error('      3. Check firewall settings');
            console.error('      4. Try direct connection instead');
        } else if (error.code === 'ECONNREFUSED') {
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

// Run test if this file is executed directly
if (require.main === module) {
    testPoolerConnection();
}

export default testPoolerConnection;
