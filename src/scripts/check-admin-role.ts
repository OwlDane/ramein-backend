import AppDataSource from '../config/database';
import { User, UserRole } from '../entities/User';

/**
 * Script to check admin user role in database
 * Usage: npm run ts-node src/scripts/check-admin-role.ts
 */

async function checkAdminRole() {
    try {
        console.log('🔄 Initializing database connection...');
        await AppDataSource.initialize();
        console.log('✅ Database connected');

        const userRepository = AppDataSource.getRepository(User);

        // Find admin user
        const admin = await userRepository.findOne({
            where: { email: 'superadmin@ramein.com' }
        });

        if (!admin) {
            console.error('❌ Admin user not found');
            process.exit(1);
        }

        console.log('\n👤 Admin User Details:');
        console.log('   ID:', admin.id);
        console.log('   Email:', admin.email);
        console.log('   Name:', admin.name);
        console.log('   Role:', admin.role);
        console.log('   Role Type:', typeof admin.role);
        console.log('   Is ADMIN enum:', admin.role === UserRole.ADMIN);

        // Check if role needs update
        if (admin.role !== UserRole.ADMIN) {
            console.log('\n⚠️  Role is not UserRole.ADMIN, updating...');
            admin.role = UserRole.ADMIN;
            await userRepository.save(admin);
            console.log('✅ Role updated to UserRole.ADMIN');
        } else {
            console.log('\n✅ Role is correct: UserRole.ADMIN');
        }

        await AppDataSource.destroy();
    } catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    }
}

// Run the script
checkAdminRole();
