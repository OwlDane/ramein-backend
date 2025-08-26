import AppDataSource from './config/database';
import * as dotenv from 'dotenv';

dotenv.config();

async function testDatabaseConnection() {
    console.log('🔍 Testing database connection...');
    console.log('📊 Environment:', process.env.NODE_ENV || 'development');
    console.log('🔗 Database URL:', process.env.DATABASE_URL ? 'Set' : 'Not set');
    
    try {
        // Test connection
        await AppDataSource.initialize();
        console.log('✅ Database connection successful!');
        
        // Test basic query
        const result = await AppDataSource.query('SELECT NOW() as current_time');
        console.log('✅ Query test successful:', result[0]);
        
        // Test table existence
        const tables = await AppDataSource.query(`
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
        await AppDataSource.destroy();
        console.log('✅ Connection closed successfully');
        
    } catch (error: any) {
        console.error('❌ Database connection failed:');
        console.error('   Error:', error.message);
        
        if (error.code === 'ETIMEDOUT') {
            console.error('   🔍 Diagnosis: Connection timeout');
            console.error('   💡 Solutions:');
            console.error('      1. Check your internet connection');
            console.error('      2. Verify Supabase is accessible');
            console.error('      3. Check firewall settings');
            console.error('      4. Try using connection pooler');
        } else if (error.code === 'ECONNREFUSED') {
            console.error('   🔍 Diagnosis: Connection refused');
            console.error('   💡 Solutions:');
            console.error('      1. Check database host and port');
            console.error('      2. Verify database is running');
            console.error('      3. Check credentials');
        } else if (error.code === 'ENOTFOUND') {
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

// Run test if this file is executed directly
if (require.main === module) {
    testDatabaseConnection();
}

export default testDatabaseConnection;
