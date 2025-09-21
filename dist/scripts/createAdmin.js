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
exports.createNewAdmin = createNewAdmin;
const database_1 = __importDefault(require("../config/database"));
const bcrypt = __importStar(require("bcryptjs"));
const User_1 = require("../entities/User");
const readline = __importStar(require("readline"));
const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});
function promptUser(question) {
    return new Promise((resolve) => {
        rl.question(question, (answer) => {
            resolve(answer.trim());
        });
    });
}
function promptPassword(question) {
    return new Promise((resolve) => {
        const stdin = process.stdin;
        const stdout = process.stdout;
        stdout.write(question);
        stdin.setRawMode(true);
        stdin.resume();
        stdin.setEncoding('utf8');
        let password = '';
        stdin.on('data', (key) => {
            const char = key.toString();
            if (char === '\n' || char === '\r' || char === '\u0004') {
                stdin.setRawMode(false);
                stdin.pause();
                stdout.write('\n');
                resolve(password);
                return;
            }
            if (char === '\u0003') {
                stdout.write('\n');
                process.exit();
            }
            if (char === '\u0008' || char === '\u007f') {
                if (password.length > 0) {
                    password = password.slice(0, -1);
                    stdout.write('\b \b');
                }
            }
            else if (char.charCodeAt(0) >= 32) {
                password += char;
                stdout.write('*');
            }
        });
    });
}
async function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}
async function isValidPassword(password) {
    return password.length >= 6;
}
async function createNewAdmin() {
    try {
        console.log('🚀 Ramein - Create New Admin User');
        console.log('=====================================\n');
        await database_1.default.initialize();
        console.log("✅ Database connection initialized\n");
        const userRepository = database_1.default.getRepository(User_1.User);
        let email;
        let password;
        let confirmPassword;
        do {
            email = await promptUser('📧 Enter admin email: ');
            if (!await isValidEmail(email)) {
                console.log('❌ Please enter a valid email address\n');
                continue;
            }
            const existingUser = await userRepository.findOne({ where: { email: email.toLowerCase() } });
            if (existingUser) {
                console.log('❌ User with this email already exists\n');
                email = '';
                continue;
            }
            break;
        } while (true);
        do {
            password = await promptPassword('🔐 Enter admin password (min 6 characters): ');
            if (!await isValidPassword(password)) {
                console.log('❌ Password must be at least 6 characters long\n');
                continue;
            }
            confirmPassword = await promptPassword('🔐 Confirm admin password: ');
            if (password !== confirmPassword) {
                console.log('❌ Passwords do not match\n');
                continue;
            }
            break;
        } while (true);
        const name = await promptUser('👤 Enter admin name: ');
        const phone = await promptUser('📱 Enter admin phone (optional): ') || '081234567890';
        const address = await promptUser('🏠 Enter admin address (optional): ') || 'Admin Address';
        const education = await promptUser('🎓 Enter admin education (optional): ') || 'S1';
        console.log('\n📝 Creating admin user with the following details:');
        console.log(`Email: ${email}`);
        console.log(`Name: ${name}`);
        console.log(`Phone: ${phone}`);
        console.log(`Address: ${address}`);
        console.log(`Education: ${education}`);
        const confirm = await promptUser('\n✅ Do you want to create this admin user? (y/N): ');
        if (confirm.toLowerCase() !== 'y' && confirm.toLowerCase() !== 'yes') {
            console.log('❌ Admin creation cancelled');
            return;
        }
        const hashedPassword = await bcrypt.hash(password, 10);
        const admin = userRepository.create({
            email: email.toLowerCase(),
            password: hashedPassword,
            name: name,
            phone: phone,
            address: address,
            education: education,
            role: User_1.UserRole.ADMIN,
            isVerified: true,
            isEmailVerified: true,
            isOtpVerified: true
        });
        await userRepository.save(admin);
        console.log('\n🎉 Admin user created successfully!');
        console.log('=====================================');
        console.log(`📧 Email: ${email}`);
        console.log(`👤 Name: ${name}`);
        console.log(`🔑 Role: ADMIN`);
        console.log(`✅ Status: Verified`);
        console.log('\n💡 You can now use these credentials to login to the admin dashboard');
    }
    catch (error) {
        console.error('\n❌ Error creating admin user:', error);
    }
    finally {
        rl.close();
        await database_1.default.destroy();
        process.exit();
    }
}
if (require.main === module) {
    createNewAdmin().catch(console.error);
}
//# sourceMappingURL=createAdmin.js.map