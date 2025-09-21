import AppDataSource from "../config/database";
import * as bcrypt from 'bcryptjs';
import { User, UserRole } from "../entities/User";
import * as readline from 'readline';

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

function promptUser(question: string): Promise<string> {
    return new Promise((resolve) => {
        rl.question(question, (answer) => {
            resolve(answer.trim());
        });
    });
}

function promptPassword(question: string): Promise<string> {
    return new Promise((resolve) => {
        const stdin = process.stdin;
        const stdout = process.stdout;

        stdout.write(question);
        stdin.setRawMode(true);
        stdin.resume();
        stdin.setEncoding('utf8');

        let password = '';
        stdin.on('data', (key: string) => {
            const char = key.toString();

            if (char === '\n' || char === '\r' || char === '\u0004') {
                // Enter key or Ctrl+D
                stdin.setRawMode(false);
                stdin.pause();
                stdout.write('\n');
                resolve(password);
                return;
            }

            if (char === '\u0003') {
                // Ctrl+C
                stdout.write('\n');
                process.exit();
            }

            if (char === '\u0008' || char === '\u007f') {
                // Backspace
                if (password.length > 0) {
                    password = password.slice(0, -1);
                    stdout.write('\b \b');
                }
            } else if (char.charCodeAt(0) >= 32) {
                // Printable characters
                password += char;
                stdout.write('*');
            }
        });
    });
}

async function isValidEmail(email: string): Promise<boolean> {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

async function isValidPassword(password: string): Promise<boolean> {
    return password.length >= 6;
}

async function createNewAdmin() {
    try {
        console.log('🚀 Ramein - Create New Admin User');
        console.log('=====================================\n');

        // Initialize database connection
        await AppDataSource.initialize();
        console.log("✅ Database connection initialized\n");

        const userRepository = AppDataSource.getRepository(User);

        // Collect admin information
        let email: string;
        let password: string;
        let confirmPassword: string;

        // Get email
        do {
            email = await promptUser('📧 Enter admin email: ');
            if (!await isValidEmail(email)) {
                console.log('❌ Please enter a valid email address\n');
                continue;
            }

            // Check if email already exists
            const existingUser = await userRepository.findOne({ where: { email: email.toLowerCase() } });
            if (existingUser) {
                console.log('❌ User with this email already exists\n');
                email = '';
                continue;
            }
            break;
        } while (true);

        // Get password
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

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create admin user
        const admin = userRepository.create({
            email: email.toLowerCase(),
            password: hashedPassword,
            name: name,
            phone: phone,
            address: address,
            education: education,
            role: UserRole.ADMIN,
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

    } catch (error) {
        console.error('\n❌ Error creating admin user:', error);
    } finally {
        rl.close();
        await AppDataSource.destroy();
        process.exit();
    }
}

// Run the script
if (require.main === module) {
    createNewAdmin().catch(console.error);
}

export { createNewAdmin };
