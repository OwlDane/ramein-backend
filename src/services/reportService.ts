import { Between } from 'typeorm';
import AppDataSource from '../config/database';
import { Event } from '../entities/Event';
import { Participant } from '../entities/Participant';
import { format, startOfMonth, endOfMonth, eachMonthOfInterval, subMonths } from 'date-fns';

export class ReportService {
    private eventRepository = AppDataSource.getRepository(Event);
    private participantRepository = AppDataSource.getRepository(Participant);

    /**
     * Get monthly statistics for events and participants
     * @param months - Number of months to include in the report (default: 12)
     * @returns Monthly statistics
     */
    async getMonthlyStatistics(months: number = 12) {
        if (!AppDataSource.isInitialized) {
            await AppDataSource.initialize();
        }

        const endDate = new Date();
        const startDate = subMonths(endDate, months - 1);
        
        // Get all months in the range
        const monthsInRange = eachMonthOfInterval({
            start: startOfMonth(startDate),
            end: endOfMonth(endDate)
        });

        // Get events and participants for the date range
        const [events, participants] = await Promise.all([
            this.eventRepository.find({
                where: {
                    date: Between(startOfMonth(startDate), endOfMonth(endDate))
                },
                relations: ['participants']
            }),
            this.participantRepository.find({
                where: {
                    createdAt: Between(startOfMonth(startDate), endOfMonth(endDate))
                }
            })
        ]);

        // Group data by month
        const monthlyData = monthsInRange.map(month => {
            const monthKey = format(month, 'yyyy-MM');
            const monthStart = startOfMonth(month);
            const monthEnd = endOfMonth(month);

            // Filter events and participants for this month
            const monthEvents = events.filter(event => 
                event.date >= monthStart && event.date <= monthEnd
            );

            const monthParticipants = participants.filter(participant => 
                participant.createdAt >= monthStart && participant.createdAt <= monthEnd
            );

            // Calculate statistics
            const totalEvents = monthEvents.length;
            const totalParticipants = monthParticipants.length;
            const avgParticipantsPerEvent = totalEvents > 0 
                ? Number((totalParticipants / totalEvents).toFixed(1)) 
                : 0;

            // Get top 3 events by participant count
            const topEvents = [...monthEvents]
                .sort((a, b) => b.participants.length - a.participants.length)
                .slice(0, 3)
                .map(event => ({
                    id: event.id,
                    title: event.title,
                    participants: event.participants.length,
                    date: event.date
                }));

            return {
                month: monthKey,
                totalEvents,
                totalParticipants,
                avgParticipantsPerEvent,
                topEvents
            };
        });

        // Calculate overall statistics
        const totalEvents = events.length;
        const totalParticipants = participants.length;
        const avgParticipantsPerEvent = totalEvents > 0 
            ? Number((totalParticipants / totalEvents).toFixed(1)) 
            : 0;

        // Get top 10 events overall
        const topEventsOverall = [...events]
            .sort((a, b) => b.participants.length - a.participants.length)
            .slice(0, 10)
            .map(event => ({
                id: event.id,
                title: event.title,
                participants: event.participants.length,
                date: event.date
            }));

        return {
            period: {
                start: format(startDate, 'yyyy-MM-dd'),
                end: format(endDate, 'yyyy-MM-dd'),
                months: months
            },
            monthlyData,
            summary: {
                totalEvents,
                totalParticipants,
                avgParticipantsPerEvent,
                topEvents: topEventsOverall
            }
        };
    }

    /**
     * Get top events by participant count
     * @param limit - Number of top events to return (default: 10)
     * @returns Array of events with participant counts
     */
    async getTopEventsByParticipants(limit: number = 10) {
        if (!AppDataSource.isInitialized) {
            await AppDataSource.initialize();
        }

        const events = await this.eventRepository.find({
            relations: ['participants']
        });

        return events
            .map(event => ({
                id: event.id,
                title: event.title,
                date: event.date,
                location: event.location,
                totalParticipants: event.participants.length,
                participants: event.participants.map(p => ({
                    id: p.id,
                    name: p.name,
                    email: p.email,
                    hasAttended: p.hasAttended
                }))
            }))
            .sort((a, b) => b.totalParticipants - a.totalParticipants)
            .slice(0, limit);
    }

    /**
     * Get detailed participation statistics for a specific event
     * @param eventId - ID of the event
     * @returns Detailed participation statistics
     */
    async getEventParticipationStats(eventId: string) {
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

        const totalParticipants = event.participants.length;
        const attendedParticipants = event.participants.filter(p => p.hasAttended).length;
        const attendanceRate = totalParticipants > 0 
            ? Number(((attendedParticipants / totalParticipants) * 100).toFixed(2)) 
            : 0;

        // Group by registration date
        const registrationsByDate = event.participants.reduce((acc, participant) => {
            const date = participant.createdAt.toISOString().split('T')[0];
            acc[date] = (acc[date] || 0) + 1;
            return acc;
        }, {} as Record<string, number>);

        // Prepare registration timeline
        const registrationTimeline = Object.entries(registrationsByDate)
            .map(([date, count]) => ({ date, count }))
            .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

        // Get participant demographics (example: by registration source if available)
        const demographics = event.participants.reduce((acc, participant) => {
            const source = participant.registrationSource || 'unknown';
            acc[source] = (acc[source] || 0) + 1;
            return acc;
        }, {} as Record<string, number>);

        return {
            event: {
                id: event.id,
                title: event.title,
                date: event.date,
                location: event.location
            },
            statistics: {
                totalParticipants,
                attendedParticipants,
                attendanceRate,
                pendingParticipants: totalParticipants - attendedParticipants
            },
            registrationTimeline,
            demographics
        };
    }
}

export default new ReportService();
