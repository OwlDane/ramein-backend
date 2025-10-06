import AppDataSource from '../config/database';
import { Event } from '../entities/Event';
import { Participant } from '../entities/Participant';

export class StatisticsService {
    private static eventRepository = AppDataSource.getRepository(Event);
    private static participantRepository = AppDataSource.getRepository(Participant);

    /**
     * Get monthly events statistics for the current year
     */
    static async getMonthlyEventsStats() {
        const currentYear = new Date().getFullYear();
        const startDate = new Date(currentYear, 0, 1); // January 1st
        const endDate = new Date(currentYear, 11, 31); // December 31st

        const events = await this.eventRepository
            .createQueryBuilder('event')
            .where('event.date BETWEEN :startDate AND :endDate', { startDate, endDate })
            .getMany();

        // Initialize monthly stats array (12 months)
        const monthlyStats = Array(12).fill(0);

        // Count events per month
        events.forEach(event => {
            const eventDate = new Date(event.date);
            const month = eventDate.getMonth();
            monthlyStats[month]++;
        });

        return monthlyStats;
    }

    /**
     * Get monthly participants statistics for the current year
     */
    static async getMonthlyParticipantsStats() {
        const currentYear = new Date().getFullYear();
        const startDate = new Date(currentYear, 0, 1);
        const endDate = new Date(currentYear, 11, 31);

        // Get all participants who have attended events
        const participants = await this.participantRepository
            .createQueryBuilder('participant')
            .leftJoinAndSelect('participant.event', 'event')
            .where('participant.hasAttended = :hasAttended', { hasAttended: true })
            .andWhere('event.date BETWEEN :startDate AND :endDate', { startDate, endDate })
            .getMany();

        // Initialize monthly stats array
        const monthlyStats = Array(12).fill(0);

        // Count participants per month based on event date
        participants.forEach(participant => {
            const eventDate = new Date(participant.event.date);
            const month = eventDate.getMonth();
            monthlyStats[month]++;
        });

        return monthlyStats;
    }

    /**
     * Get top 10 events by participant count
     */
    static async getTopEvents() {
        const events = await this.eventRepository
            .createQueryBuilder('event')
            .leftJoinAndSelect('event.participants', 'participants')
            .where('participants.hasAttended = :hasAttended', { hasAttended: true })
            .select(['event.id', 'event.title', 'event.date'])
            .addSelect('COUNT(participants.id)', 'participantCount')
            .groupBy('event.id')
            .orderBy('participantCount', 'DESC')
            .limit(10)
            .getRawMany();

        return events.map(event => ({
            id: event.event_id,
            title: event.event_title,
            date: event.event_date,
            participantCount: parseInt(event.participantCount)
        }));
    }

    /**
     * Get comprehensive dashboard statistics
     */
    static async getDashboardStats() {
        const [monthlyEvents, monthlyParticipants, topEvents] = await Promise.all([
            this.getMonthlyEventsStats(),
            this.getMonthlyParticipantsStats(),
            this.getTopEvents()
        ]);

        return {
            monthlyEvents,
            monthlyParticipants,
            topEvents,
            months: [
                'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
                'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
            ]
        };
    }
}