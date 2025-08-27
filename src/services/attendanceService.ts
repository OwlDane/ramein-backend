import AppDataSource from '../config/database';
import type { Event } from '../entities/Event';
import { Participant } from '../entities/Participant';

export class AttendanceService {
    private participantRepository = AppDataSource.getRepository(Participant);

    /**
     * Validate attendance is allowed (only on/after start time)
     */
    private isAttendanceOpen(event: Event): boolean {
        const now = new Date();
        const eventDateTime = new Date(event.date);
        const [hh, mm] = event.time.split(':');
        eventDateTime.setHours(parseInt(hh, 10));
        eventDateTime.setMinutes(parseInt(mm, 10));
        return now >= eventDateTime;
    }

    /**
     * Generate attendance token (transient; not persisted)
     */
    async generateAttendanceToken(_eventId: string): Promise<{ token: string; expiresAt: Date }> {
        const token = Math.random().toString(36).slice(2, 10).toUpperCase();
        const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
        return { token, expiresAt };
    }

    /**
     * Mark attendance for a participant using their registration token
     */
    async markAttendanceByRegistrationToken(eventId: string, userId: string, token: string): Promise<boolean> {
        if (!AppDataSource.isInitialized) {
            await AppDataSource.initialize();
        }

        const participant = await this.participantRepository.findOne({
            where: { eventId, userId, tokenNumber: token },
            relations: ['event']
        });

        if (!participant) {
            throw new Error('Invalid token or participant not found');
        }

        if (participant.hasAttended) {
            throw new Error('Attendance already marked');
        }

        if (!this.isAttendanceOpen(participant.event)) {
            throw new Error('Attendance is not open yet');
        }

        participant.hasAttended = true;
        participant.attendedAt = new Date();
        await this.participantRepository.save(participant);
        return true;
    }

    /**
     * Compatibility wrapper to mark attendance by participantId
     */
    async markAttendance(participantId: string, token: string): Promise<boolean> {
        if (!AppDataSource.isInitialized) {
            await AppDataSource.initialize();
        }
        const participant = await this.participantRepository.findOne({ where: { id: participantId }, relations: ['event'] });
        if (!participant) {
            throw new Error('Participant not found');
        }
        return this.markAttendanceByRegistrationToken(participant.eventId, participant.userId, token);
    }

    /**
     * Get attendance statistics for an event
     * @param eventId - Event ID
     * @returns Attendance statistics
     */
    async getEventAttendanceStats(eventId: string) {
        // Initialize database connection if not initialized
        if (!AppDataSource.isInitialized) {
            await AppDataSource.initialize();
        }

        const [total, attended] = await Promise.all([
            this.participantRepository.count({ where: { eventId } }),
            this.participantRepository.count({ where: { eventId, hasAttended: true } })
        ]);

        return {
            totalParticipants: total,
            attended,
            notAttended: total - attended,
            attendanceRate: total > 0 ? Number(((attended / total) * 100).toFixed(2)) : 0
        };
    }

    /**
     * Get list of participants with attendance status
     * @param eventId - Event ID
     * @returns List of participants with attendance info
     */
    async getEventAttendanceList(eventId: string) {
        // Initialize database connection if not initialized
        if (!AppDataSource.isInitialized) {
            await AppDataSource.initialize();
        }

        const participants = await this.participantRepository.find({
            where: { eventId },
            relations: ['user'],
            select: {
                id: true,
                hasAttended: true,
                attendedAt: true,
                user: { id: true, name: true, email: true }
            },
            order: { hasAttended: 'DESC', attendedAt: 'ASC' }
        });

        return participants.map(p => ({
            id: p.id,
            user: { id: p.user.id, name: p.user.name, email: p.user.email },
            hasAttended: p.hasAttended,
            attendedAt: p.attendedAt,
            status: p.hasAttended ? 'Present' : 'Absent'
        }));
    }
}

export default new AttendanceService();