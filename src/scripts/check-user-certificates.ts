import AppDataSource from '../config/database';
import { Certificate } from '../entities/Certificate';
import { User } from '../entities/User';

/**
 * Script to check certificates for a specific user
 * Usage: npm run ts-node src/scripts/check-user-certificates.ts <email>
 */

async function checkUserCertificates() {
    try {
        const userEmail = process.argv[2] || 'zidunnoaoe@gmail.com';
        
        console.log('🔄 Initializing database connection...');
        await AppDataSource.initialize();
        console.log('✅ Database connected');

        const userRepository = AppDataSource.getRepository(User);
        const certificateRepository = AppDataSource.getRepository(Certificate);

        // Find user
        const user = await userRepository.findOne({
            where: { email: userEmail }
        });

        if (!user) {
            console.error(`❌ User not found: ${userEmail}`);
            process.exit(1);
        }

        console.log(`\n👤 User: ${user.name} (${user.email})`);
        console.log(`   ID: ${user.id}`);
        console.log(`   Role: ${user.role}\n`);

        // Method 1: Direct query
        const certificates1 = await certificateRepository
            .createQueryBuilder('certificate')
            .leftJoinAndSelect('certificate.participant', 'participant')
            .leftJoinAndSelect('certificate.event', 'event')
            .leftJoinAndSelect('participant.user', 'user')
            .where('participant.userId = :userId', { userId: user.id })
            .orderBy('certificate.issuedAt', 'DESC')
            .getMany();

        console.log(`📊 Method 1 (QueryBuilder): Found ${certificates1.length} certificates`);
        certificates1.forEach((cert, index) => {
            console.log(`   ${index + 1}. ${cert.certificateNumber} - ${cert.event?.title}`);
        });

        // Method 2: Using relations
        const certificates2 = await certificateRepository.find({
            where: {
                participant: {
                    userId: user.id
                }
            },
            relations: ['participant', 'participant.user', 'event'],
            order: { issuedAt: 'DESC' }
        });

        console.log(`\n📊 Method 2 (Find with relations): Found ${certificates2.length} certificates`);
        certificates2.forEach((cert, index) => {
            console.log(`   ${index + 1}. ${cert.certificateNumber} - ${cert.event?.title}`);
        });

        // Method 3: Raw SQL
        const rawCertificates = await AppDataSource.query(`
            SELECT 
                c.id,
                c."certificateNumber",
                c."certificateUrl",
                c."issuedAt",
                u.name as participant_name,
                u.email as participant_email,
                e.title as event_title
            FROM certificate c
            JOIN participant p ON c."participantId" = p.id
            JOIN "user" u ON p."userId" = u.id
            JOIN event e ON c."eventId" = e.id
            WHERE u.id = $1
            ORDER BY c."issuedAt" DESC
        `, [user.id]);

        console.log(`\n📊 Method 3 (Raw SQL): Found ${rawCertificates.length} certificates`);
        rawCertificates.forEach((cert: any, index: number) => {
            console.log(`   ${index + 1}. ${cert.certificateNumber} - ${cert.event_title}`);
            console.log(`      Participant: ${cert.participant_name} (${cert.participant_email})`);
        });

        await AppDataSource.destroy();
    } catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    }
}

// Run the script
checkUserCertificates();
