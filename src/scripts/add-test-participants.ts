import AppDataSource from '../config/database';
import { Event } from '../entities/Event';
import { User, UserRole } from '../entities/User';
import { Participant } from '../entities/Participant';

/**
 * Script to add test participants to an event for certificate generation testing
 * Usage: npm run ts-node src/scripts/add-test-participants.ts
 */

async function addTestParticipants() {
    try {
        console.log('🔄 Initializing database connection...');
        await AppDataSource.initialize();
        console.log('✅ Database connected');

        const eventRepository = AppDataSource.getRepository(Event);
        const userRepository = AppDataSource.getRepository(User);
        const participantRepository = AppDataSource.getRepository(Participant);

        // Find the UI/UX Design Masterclass event
        const event = await eventRepository.findOne({
            where: { title: 'UI/UX Design Masterclass' }
        });

        if (!event) {
            console.error('❌ Event "UI/UX Design Masterclass" not found');
            console.log('Available events:');
            const allEvents = await eventRepository.find();
            allEvents.forEach(e => console.log(`  - ${e.title} (ID: ${e.id})`));
            process.exit(1);
        }

        console.log(`✅ Found event: ${event.title} (ID: ${event.id})`);

        // Get all users (or create test users if needed)
        let users = await userRepository.find({
            where: { role: UserRole.USER },
            take: 5 // Get first 5 users
        });

        if (users.length === 0) {
            console.log('⚠️  No users found. You need to have at least one user registered.');
            process.exit(1);
        }

        console.log(`✅ Found ${users.length} users`);

        // Add participants for each user
        let addedCount = 0;
        for (const user of users) {
            // Check if already participant
            const existing = await participantRepository.findOne({
                where: { userId: user.id, eventId: event.id }
            });

            if (existing) {
                console.log(`⏭️  User ${user.name} (${user.email}) already registered`);
                continue;
            }

            // Generate 10-digit token
            const tokenNumber = Math.floor(1000000000 + Math.random() * 9000000000).toString();

            // Create participant
            const participant = new Participant();
            participant.userId = user.id;
            participant.eventId = event.id;
            participant.tokenNumber = tokenNumber;
            participant.hasAttended = true; // Mark as attended for certificate generation
            participant.attendedAt = new Date();

            await participantRepository.save(participant);
            addedCount++;

            console.log(`✅ Added participant: ${user.name} (${user.email})`);
            console.log(`   Token: ${tokenNumber}`);
            console.log(`   Attended: Yes`);
        }

        console.log('\n📊 Summary:');
        console.log(`   Event: ${event.title}`);
        console.log(`   Participants added: ${addedCount}`);
        console.log(`   Total participants: ${await participantRepository.count({ where: { eventId: event.id } })}`);
        console.log('\n✅ Done! You can now generate certificates for these participants.');

        await AppDataSource.destroy();
    } catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    }
}

// Run the script
addTestParticipants();
