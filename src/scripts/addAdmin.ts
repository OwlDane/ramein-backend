import AppDataSource from "../config/database";
import * as bcrypt from 'bcryptjs';
import { User, UserRole } from "../entities/User";

// 🔧 Configure your new admin credentials here
const NEW_ADMIN_CONFIG = {
    email: 'superadmin@ramein.com',
    password: 'SuperAdmin2024!',
    name: 'Super Administrator',
    phone: '08123456789',
    address: 'Jakarta, Indonesia',
    education: 'S2'
};

async function addNewAdmin() {
    try {
        console.log('🚀 Ramein - Adding New Admin User');
        console.log('==================================\n');

        // Initialize database connection
        await AppDataSource.initialize();
        console.log("✅ Database connection initialized");

        const userRepository = AppDataSource.getRepository(User);

        // Check if admin already exists
        const existingAdmin = await userRepository.findOne({
            where: { email: NEW_ADMIN_CONFIG.email.toLowerCase() }
        });

        if (existingAdmin) {
            console.log(`❌ Admin with email ${NEW_ADMIN_CONFIG.email} already exists!`);
            console.log('💡 Please change the email in NEW_ADMIN_CONFIG and try again.\n');
            return;
        }

        // Hash password
        console.log('🔐 Hashing password...');
        const hashedPassword = await bcrypt.hash(NEW_ADMIN_CONFIG.password, 10);

        // Create new admin user
        console.log('👤 Creating admin user...');
        const newAdmin = userRepository.create({
            email: NEW_ADMIN_CONFIG.email.toLowerCase(),
            password: hashedPassword,
            name: NEW_ADMIN_CONFIG.name,
            phone: NEW_ADMIN_CONFIG.phone,
            address: NEW_ADMIN_CONFIG.address,
            education: NEW_ADMIN_CONFIG.education,
            role: UserRole.ADMIN,
            isVerified: true,
            isEmailVerified: true,
            isOtpVerified: true
        });

        await userRepository.save(newAdmin);

        console.log('\n🎉 New admin user created successfully!');
        console.log('=====================================');
        console.log(`📧 Email: ${NEW_ADMIN_CONFIG.email}`);
        console.log(`🔑 Password: ${NEW_ADMIN_CONFIG.password}`);
        console.log(`👤 Name: ${NEW_ADMIN_CONFIG.name}`);
        console.log(`📱 Phone: ${NEW_ADMIN_CONFIG.phone}`);
        console.log(`🏠 Address: ${NEW_ADMIN_CONFIG.address}`);
        console.log(`🎓 Education: ${NEW_ADMIN_CONFIG.education}`);
        console.log(`🔐 Role: ADMIN`);
        console.log(`✅ Status: Fully Verified`);
        console.log('\n💡 Admin Login Details:');
        console.log(`   Email: ${NEW_ADMIN_CONFIG.email}`);
        console.log(`   Password: ${NEW_ADMIN_CONFIG.password}`);
        console.log('\n🌐 Access admin dashboard at: /admin/login');

    } catch (error) {
        console.error('\n❌ Error creating admin user:', error);

        if (error.code === '23505') {
            console.log('💡 This error usually means the email already exists in the database.');
        }
    } finally {
        console.log('\n🔚 Closing database connection...');
        await AppDataSource.destroy();
        console.log('✅ Done!');
    }
}

// Run the script
if (require.main === module) {
    addNewAdmin().catch(console.error);
}

export { addNewAdmin };
