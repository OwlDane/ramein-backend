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
exports.addNewAdmin = addNewAdmin;
const database_1 = __importDefault(require("../config/database"));
const bcrypt = __importStar(require("bcryptjs"));
const User_1 = require("../entities/User");
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
        await database_1.default.initialize();
        console.log("✅ Database connection initialized");
        const userRepository = database_1.default.getRepository(User_1.User);
        const existingAdmin = await userRepository.findOne({
            where: { email: NEW_ADMIN_CONFIG.email.toLowerCase() }
        });
        if (existingAdmin) {
            console.log(`❌ Admin with email ${NEW_ADMIN_CONFIG.email} already exists!`);
            console.log('💡 Please change the email in NEW_ADMIN_CONFIG and try again.\n');
            return;
        }
        console.log('🔐 Hashing password...');
        const hashedPassword = await bcrypt.hash(NEW_ADMIN_CONFIG.password, 10);
        console.log('👤 Creating admin user...');
        const newAdmin = userRepository.create({
            email: NEW_ADMIN_CONFIG.email.toLowerCase(),
            password: hashedPassword,
            name: NEW_ADMIN_CONFIG.name,
            phone: NEW_ADMIN_CONFIG.phone,
            address: NEW_ADMIN_CONFIG.address,
            education: NEW_ADMIN_CONFIG.education,
            role: User_1.UserRole.ADMIN,
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
    }
    catch (error) {
        console.error('\n❌ Error creating admin user:', error);
        if (error.code === '23505') {
            console.log('💡 This error usually means the email already exists in the database.');
        }
    }
    finally {
        console.log('\n🔚 Closing database connection...');
        await database_1.default.destroy();
        console.log('✅ Done!');
    }
}
if (require.main === module) {
    addNewAdmin().catch(console.error);
}
//# sourceMappingURL=addAdmin.js.map