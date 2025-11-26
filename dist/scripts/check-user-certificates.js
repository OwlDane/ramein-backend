"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const database_1 = __importDefault(require("../config/database"));
const Certificate_1 = require("../entities/Certificate");
const User_1 = require("../entities/User");
async function checkUserCertificates() {
    try {
        const userEmail = process.argv[2] || 'zidunnoaoe@gmail.com';
        console.log('🔄 Initializing database connection...');
        await database_1.default.initialize();
        console.log('✅ Database connected');
        const userRepository = database_1.default.getRepository(User_1.User);
        const certificateRepository = database_1.default.getRepository(Certificate_1.Certificate);
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
            var _a;
            console.log(`   ${index + 1}. ${cert.certificateNumber} - ${(_a = cert.event) === null || _a === void 0 ? void 0 : _a.title}`);
        });
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
            var _a;
            console.log(`   ${index + 1}. ${cert.certificateNumber} - ${(_a = cert.event) === null || _a === void 0 ? void 0 : _a.title}`);
        });
        const rawCertificates = await database_1.default.query(`
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
        rawCertificates.forEach((cert, index) => {
            console.log(`   ${index + 1}. ${cert.certificateNumber} - ${cert.event_title}`);
            console.log(`      Participant: ${cert.participant_name} (${cert.participant_email})`);
        });
        await database_1.default.destroy();
    }
    catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    }
}
checkUserCertificates();
//# sourceMappingURL=check-user-certificates.js.map