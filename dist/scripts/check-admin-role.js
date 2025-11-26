"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const database_1 = __importDefault(require("../config/database"));
const User_1 = require("../entities/User");
async function checkAdminRole() {
    try {
        console.log('🔄 Initializing database connection...');
        await database_1.default.initialize();
        console.log('✅ Database connected');
        const userRepository = database_1.default.getRepository(User_1.User);
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
        console.log('   Is ADMIN enum:', admin.role === User_1.UserRole.ADMIN);
        if (admin.role !== User_1.UserRole.ADMIN) {
            console.log('\n⚠️  Role is not UserRole.ADMIN, updating...');
            admin.role = User_1.UserRole.ADMIN;
            await userRepository.save(admin);
            console.log('✅ Role updated to UserRole.ADMIN');
        }
        else {
            console.log('\n✅ Role is correct: UserRole.ADMIN');
        }
        await database_1.default.destroy();
    }
    catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    }
}
checkAdminRole();
//# sourceMappingURL=check-admin-role.js.map