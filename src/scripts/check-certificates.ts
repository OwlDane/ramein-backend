import AppDataSource from '../config/database';
import { Certificate } from '../entities/Certificate';

/**
 * Script to check existing certificates in database
 * Usage: npm run ts-node src/scripts/check-certificates.ts
 */

async function checkCertificates() {
    try {
        console.log('🔄 Initializing database connection...');
        await AppDataSource.initialize();
        console.log('✅ Database connected');

        const certificateRepository = AppDataSource.getRepository(Certificate);

        // Get all certificates with relations
        const certificates = await certificateRepository.find({
            relations: ['participant', 'participant.user', 'event'],
            order: { issuedAt: 'DESC' }
        });

        console.log(`\n📊 Total Certificates: ${certificates.length}\n`);

        if (certificates.length === 0) {
            console.log('⚠️  No certificates found in database');
        } else {
            certificates.forEach((cert, index) => {
                console.log(`${index + 1}. Certificate #${cert.certificateNumber}`);
                console.log(`   ID: ${cert.id}`);
                console.log(`   Participant: ${cert.participant?.user?.name || 'Unknown'} (${cert.participant?.user?.email || 'N/A'})`);
                console.log(`   Event: ${cert.event?.title || 'Unknown'}`);
                console.log(`   Issued At: ${cert.issuedAt}`);
                console.log(`   Certificate URL: ${cert.certificateUrl || 'N/A'}`);
                console.log(`   Participant ID: ${cert.participantId}`);
                console.log(`   Event ID: ${cert.eventId}`);
                console.log('');
            });
        }

        // Check for duplicates
        const duplicates = certificates.reduce((acc, cert) => {
            const key = `${cert.participantId}-${cert.eventId}`;
            if (!acc[key]) {
                acc[key] = [];
            }
            acc[key].push(cert);
            return acc;
        }, {} as Record<string, Certificate[]>);

        const duplicateEntries = Object.entries(duplicates).filter(([_, certs]) => certs.length > 1);
        
        if (duplicateEntries.length > 0) {
            console.log('⚠️  Found duplicate certificates:');
            duplicateEntries.forEach(([key, certs]) => {
                console.log(`\n   Participant-Event: ${key}`);
                certs.forEach(cert => {
                    console.log(`   - ID: ${cert.id}, Number: ${cert.certificateNumber}, Issued: ${cert.issuedAt}`);
                });
            });
        } else {
            console.log('✅ No duplicate certificates found');
        }

        await AppDataSource.destroy();
    } catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    }
}

// Run the script
checkCertificates();
