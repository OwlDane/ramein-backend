"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const database_1 = __importDefault(require("../config/database"));
const Event_1 = require("../entities/Event");
const User_1 = require("../entities/User");
const Participant_1 = require("../entities/Participant");
async function addTestParticipants() {
    try {
        console.log('🔄 Initializing database connection...');
        await database_1.default.initialize();
        console.log('✅ Database connected');
        const eventRepository = database_1.default.getRepository(Event_1.Event);
        const userRepository = database_1.default.getRepository(User_1.User);
        const participantRepository = database_1.default.getRepository(Participant_1.Participant);
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
        let users = await userRepository.find({
            where: { role: User_1.UserRole.USER },
            take: 5
        });
        if (users.length === 0) {
            console.log('⚠️  No users found. You need to have at least one user registered.');
            process.exit(1);
        }
        console.log(`✅ Found ${users.length} users`);
        let addedCount = 0;
        for (const user of users) {
            const existing = await participantRepository.findOne({
                where: { userId: user.id, eventId: event.id }
            });
            if (existing) {
                console.log(`⏭️  User ${user.name} (${user.email}) already registered`);
                continue;
            }
            const tokenNumber = Math.floor(1000000000 + Math.random() * 9000000000).toString();
            const participant = new Participant_1.Participant();
            participant.userId = user.id;
            participant.eventId = event.id;
            participant.tokenNumber = tokenNumber;
            participant.hasAttended = true;
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
        await database_1.default.destroy();
    }
    catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    }
}
addTestParticipants();
//# sourceMappingURL=add-test-participants.js.map