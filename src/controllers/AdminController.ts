import { Response } from 'express';
import AppDataSource from '../config/database';
import { Event } from '../entities/Event';
import { Participant } from '../entities/Participant';
import { User } from '../entities/User';
import { AuthRequest } from '../middlewares/auth';
import ExportService from '../services/exportService'; // ✅ Correct now

const eventRepository = AppDataSource.getRepository(Event);
const participantRepository = AppDataSource.getRepository(Participant);
const userRepository = AppDataSource.getRepository(User);

export class AdminController {
    // Get comprehensive dashboard statistics
    static async getDashboardStats(req: AuthRequest, res: Response) {
        try {
            // Check if user is admin
            if (req.user.role !== 'ADMIN') {
                return res.status(403).json({ message: 'Hanya admin yang dapat mengakses dashboard' });
            }

            const currentYear = new Date().getFullYear();
            const startOfYear = new Date(currentYear, 0, 1);
            const endOfYear = new Date(currentYear, 11, 31);

            // 1. Monthly event counts (Januari - Desember)
            const monthlyEvents = await eventRepository
                .createQueryBuilder('event')
                .select('EXTRACT(MONTH FROM event.date) as month')
                .addSelect('COUNT(*)', 'count')
                .where('event.date BETWEEN :start AND :end', { 
                    start: startOfYear,
                    end: endOfYear
                })
                .groupBy('month')
                .orderBy('month', 'ASC')
                .getRawMany();

            // 2. Monthly participant counts (Januari - Desember)
            const monthlyParticipants = await participantRepository
                .createQueryBuilder('participant')
                .leftJoin('participant.event', 'event')
                .select('EXTRACT(MONTH FROM event.date)', 'month')
                .addSelect('COUNT(*)', 'registrations')
                .addSelect('COUNT(CASE WHEN participant.hasAttended = true THEN 1 END)', 'attendance')
                .where('EXTRACT(YEAR FROM event.date) = :year', { year: currentYear })
                .groupBy('month')
                .orderBy('month', 'ASC')
                .getRawMany();

            // 3. Top 10 events by participant count
            const topEvents = await eventRepository
                .createQueryBuilder('event')
                .leftJoin('event.participants', 'participant')
                .select([
                    'event.id',
                    'event.title',
                    'event.date',
                    'event.time',
                    'event.location',
                    'COUNT(participant.id) as participantCount'
                ])
                .groupBy('event.id')
                .orderBy('participantCount', 'DESC')
                .limit(10)
                .getRawMany();

            // 4. Overall statistics
            const totalEvents = await eventRepository.count();
            const totalParticipants = await participantRepository.count();
            const totalUsers = await userRepository.count();
            const totalAttendance = await participantRepository.count({
                where: { hasAttended: true }
            });

            // 5. Recent activities
            const recentEvents = await eventRepository.find({
                order: { createdAt: 'DESC' },
                take: 5
            });

            const recentParticipants = await participantRepository.find({
                relations: ['user', 'event'],
                order: { createdAt: 'DESC' },
                take: 10
            });

            return res.json({
                monthlyEvents,
                monthlyParticipants,
                topEvents,
                overallStats: {
                    totalEvents,
                    totalParticipants,
                    totalUsers,
                    totalAttendance,
                    attendanceRate: totalParticipants > 0 ? (totalAttendance / totalParticipants * 100).toFixed(2) : 0
                },
                recentActivities: {
                    events: recentEvents,
                    participants: recentParticipants
                }
            });
        } catch (error) {
            console.error('Get dashboard stats error:', error);
            return res.status(500).json({ message: 'Terjadi kesalahan saat mengambil statistik dashboard' });
        }
    }

    // Export dashboard data to Excel
    static async exportDashboardData(req: AuthRequest, res: Response): Promise<void> {
        try {
            // Check if user is admin
            if (req.user.role !== 'ADMIN') {
                res.status(403).json({ message: 'Unauthorized' });
                return;
            }
    
            const { format = 'xlsx' } = req.query;
            const currentYear = new Date().getFullYear();
    
            // Get all data for export
            const events = await eventRepository.find({
                relations: ['participants'],
                order: { date: 'ASC' }
            });
    
            const participants = await participantRepository.find({
                relations: ['user', 'event'],
                order: { createdAt: 'DESC' }
            });
    
            let buffer: Buffer;
            let filename: string;
            let contentType: string;
    
            if (format === 'csv') {
                const csvData = await ExportService.exportDashboardToCSV(events, participants, currentYear);
                buffer = Buffer.from(csvData);
                filename = `dashboard_data_${currentYear}.csv`;
                contentType = 'text/csv';
            } else {
                buffer = await ExportService.exportDashboardToExcel(events, participants, currentYear);
                filename = `dashboard_data_${currentYear}.xlsx`;
                contentType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
            }
    
            res.setHeader('Content-Type', contentType);
            res.setHeader('Content-Disposition', `attachment; filename=${filename}`);
            res.send(buffer);
    
        } catch (error) {
            console.error('Export dashboard data error:', error);
            res.status(500).json({ message: 'Terjadi kesalahan saat mengexport data dashboard' });
        }
    }

    // Get user management data
    static async getUserManagement(req: AuthRequest, res: Response) {
        try {
            // Check if user is admin
            if (req.user.role !== 'ADMIN') {
                return res.status(403).json({ message: 'Unauthorized' });
            }

            const { page = 1, limit = 10, search = '', role = '' } = req.query;
            const skip = (Number(page) - 1) * Number(limit);

            let query = userRepository.createQueryBuilder('user');

            // Apply search filter
            if (search) {
                query = query.where(
                    'LOWER(user.name) LIKE LOWER(:search) OR LOWER(user.email) LIKE LOWER(:search)',
                    { search: `%${search}%` }
                );
            }

            // Apply role filter
            if (role) {
                query = query.andWhere('user.role = :role', { role });
            }

            // Get total count
            const total = await query.getCount();

            // Get paginated results
            const users = await query
                .skip(skip)
                .take(Number(limit))
                .orderBy('user.createdAt', 'DESC')
                .getMany();

            return res.json({
                users,
                pagination: {
                    page: Number(page),
                    limit: Number(limit),
                    total,
                    totalPages: Math.ceil(total / Number(limit))
                }
            });
        } catch (error) {
            console.error('Get user management error:', error);
            return res.status(500).json({ message: 'Terjadi kesalahan saat mengambil data user' });
        }
    }

    // Update user role
    static async updateUserRole(req: AuthRequest, res: Response) {
        try {
            // Check if user is admin
            if (req.user.role !== 'ADMIN') {
                return res.status(403).json({ message: 'Unauthorized' });
            }

            const { userId } = req.params;
            const { role } = req.body;

            if (!['USER', 'ADMIN'].includes(role)) {
                return res.status(400).json({ message: 'Role tidak valid' });
            }

            const user = await userRepository.findOne({
                where: { id: userId }
            });

            if (!user) {
                return res.status(404).json({ message: 'User tidak ditemukan' });
            }

            // Prevent admin from changing their own role
            if (userId === req.user.id) {
                return res.status(400).json({ message: 'Tidak dapat mengubah role sendiri' });
            }

            user.role = role;
            await userRepository.save(user);

            return res.json({
                message: 'Role user berhasil diupdate',
                user: {
                    id: user.id,
                    email: user.email,
                    name: user.name,
                    role: user.role
                }
            });
        } catch (error) {
            console.error('Update user role error:', error);
            return res.status(500).json({ message: 'Terjadi kesalahan saat mengupdate role user' });
        }
    }
}