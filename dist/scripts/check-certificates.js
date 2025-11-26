"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const database_1 = __importDefault(require("../config/database"));
const Certificate_1 = require("../entities/Certificate");
async function checkCertificates() {
    try {
        console.log('🔄 Initializing database connection...');
        await database_1.default.initialize();
        console.log('✅ Database connected');
        const certificateRepository = database_1.default.getRepository(Certificate_1.Certificate);
        const certificates = await certificateRepository.find({
            relations: ['participant', 'participant.user', 'event'],
            order: { issuedAt: 'DESC' }
        });
        console.log(`\n📊 Total Certificates: ${certificates.length}\n`);
        if (certificates.length === 0) {
            console.log('⚠️  No certificates found in database');
        }
        else {
            certificates.forEach((cert, index) => {
                var _a, _b, _c, _d, _e;
                console.log(`${index + 1}. Certificate #${cert.certificateNumber}`);
                console.log(`   ID: ${cert.id}`);
                console.log(`   Participant: ${((_b = (_a = cert.participant) === null || _a === void 0 ? void 0 : _a.user) === null || _b === void 0 ? void 0 : _b.name) || 'Unknown'} (${((_d = (_c = cert.participant) === null || _c === void 0 ? void 0 : _c.user) === null || _d === void 0 ? void 0 : _d.email) || 'N/A'})`);
                console.log(`   Event: ${((_e = cert.event) === null || _e === void 0 ? void 0 : _e.title) || 'Unknown'}`);
                console.log(`   Issued At: ${cert.issuedAt}`);
                console.log(`   Certificate URL: ${cert.certificateUrl || 'N/A'}`);
                console.log(`   Participant ID: ${cert.participantId}`);
                console.log(`   Event ID: ${cert.eventId}`);
                console.log('');
            });
        }
        const duplicates = certificates.reduce((acc, cert) => {
            const key = `${cert.participantId}-${cert.eventId}`;
            if (!acc[key]) {
                acc[key] = [];
            }
            acc[key].push(cert);
            return acc;
        }, {});
        const duplicateEntries = Object.entries(duplicates).filter(([_, certs]) => certs.length > 1);
        if (duplicateEntries.length > 0) {
            console.log('⚠️  Found duplicate certificates:');
            duplicateEntries.forEach(([key, certs]) => {
                console.log(`\n   Participant-Event: ${key}`);
                certs.forEach(cert => {
                    console.log(`   - ID: ${cert.id}, Number: ${cert.certificateNumber}, Issued: ${cert.issuedAt}`);
                });
            });
        }
        else {
            console.log('✅ No duplicate certificates found');
        }
        await database_1.default.destroy();
    }
    catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    }
}
checkCertificates();
//# sourceMappingURL=check-certificates.js.map