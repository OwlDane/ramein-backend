import { MoreThanOrEqual } from 'typeorm';
import AppDataSource from '../config/database';
import { Event } from '../entities/Event';
import { Participant } from '../entities/Participant';
import { generateAttendanceToken, isValidTokenFormat } from '../utils/tokenGenerator';

export class AttendanceService {
    private eventRepository = AppDataSource.getRepository(Event);
    private participantRepository = AppDataSource.getRepository(Participant);

    /**
     * Generate attendance token for an event
     * @param eventId - Event ID
     * @returns Object containing token and expiration date
     */
    async generateAttendanceToken(eventId: string): Promise<{ token: string; expiresAt: Date }> {
        // Initialize database connection if not initialized
        if (!AppDataSource.isInitialized) {
            await AppDataSource.initialize();
        }

        const event = await this.eventRepository.findOne({
            where: { id: eventId },
            relations: ['participants']
        });

        if (!event) {
            throw new Error('Event not found');
        }

        // Check if event is in the future or today
        const today = new Date();
        const eventDate = new Date(event.eventDate);

        if (eventDate < today && eventDate.toDateString() !== today.toDateString()) {
            throw new Error('Cannot generate token for past events');
        }

        // Generate token that's valid for 24 hours
        const token = generateAttendanceToken(8); // Use specific attendance token generator
        const expiresAt = new Date();
        expiresAt.setHours(expiresAt.getHours() + 24);

        // Save token to event
        event.attendanceToken = token;
        event.tokenExpiresAt = expiresAt;

        await this.eventRepository.save(event);

        return { token, expiresAt };
    }

    /**
     * Validate attendance token for an event
     * @param eventId - Event ID
     * @param token - Attendance token
     * @returns Boolean indicating if token is valid
     */
    async validateAttendanceToken(eventId: string, token: string): Promise<boolean> {
        if (!token || !isValidTokenFormat(token)) {
            return false;
        }

        // Initialize database connection if not initialized
        if (!AppDataSource.isInitialized) {
            await AppDataSource.initialize();
        }

        const event = await this.eventRepository.findOne({
            where: {
                id: eventId,
                attendanceToken: token,
                tokenExpiresAt: MoreThanOrEqual(new Date())
            }
        });

        return !!event;
    }

    /**
     * Mark attendance for a participant using token
     * @param participantId - Participant ID
     * @param token - Attendance token
     * @returns Boolean indicating success
     */
    async markAttendance(participantId: string, token: string): Promise<boolean> {
        // Initialize database connection if not initialized
        if (!AppDataSource.isInitialized) {
            await AppDataSource.initialize();
        }

        const participant = await this.participantRepository.findOne({
            where: { id: participantId },
            relations: ['event']
        });

        if (!participant) {
            throw new Error('Participant not found');
        }

        // Check if already attended
        if (participant.hasAttended) {
            throw new Error('Attendance already marked for this participant');
        }

        // Check if token is valid for the event
        const isValid = await this.validateAttendanceToken(participant.event.id, token);
        if (!isValid) {
            throw new Error('Invalid or expired attendance token');
        }

        // Check if attendance is on the event day
        const today = new Date();
        const eventDate = new Date(participant.event.eventDate);

        if (today.toDateString() !== eventDate.toDateString()) {
            throw new Error('Attendance can only be marked on the event day');
        }

        // Mark attendance
        participant.hasAttended = true;
        participant.attendedAt = new Date();

        await this.participantRepository.save(participant);

        return true;
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
            this.participantRepository.count({
                where: { event: { id: eventId } }
            }),
            this.participantRepository.count({
                where: {
                    event: { id: eventId },
                    hasAttended: true
                }
            })
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
            where: { event: { id: eventId } },
            relations: ['user'],
            select: {
                id: true,
                hasAttended: true,
                attendedAt: true,
                user: {
                    id: true,
                    name: true,
                    email: true
                }
            },
            order: { hasAttended: 'DESC', attendedAt: 'ASC' }
        });

        return participants.map(participant => ({
            id: participant.id,
            user: {
                id: participant.user.id,
                name: participant.user.name,
                email: participant.user.email
            },
            hasAttended: participant.hasAttended,
            attendedAt: participant.attendedAt,
            status: participant.hasAttended ? 'Present' : 'Absent'
        }));
    }

    /**
     * Check if event token is still valid
     * @param eventId - Event ID
     * @returns Token validity info
     */
    async getTokenStatus(eventId: string) {
        // Initialize database connection if not initialized
        if (!AppDataSource.isInitialized) {
            await AppDataSource.initialize();
        }

        const event = await this.eventRepository.findOne({
            where: { id: eventId },
            select: ['id', 'title', 'attendanceToken', 'tokenExpiresAt']
        });

        if (!event) {
            throw new Error('Event not found');
        }

        const now = new Date();
        const isValid = event.tokenExpiresAt ? event.tokenExpiresAt > now : false;

        return {
            eventId: event.id,
            eventTitle: event.title,
            hasToken: !!event.attendanceToken,
            token: event.attendanceToken,
            expiresAt: event.tokenExpiresAt,
            isValid,
            timeRemaining: isValid && event.tokenExpiresAt
                ? Math.max(0, event.tokenExpiresAt.getTime() - now.getTime())
                : 0
        };
    }
}

export default new AttendanceService();