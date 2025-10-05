import { Request, Response } from 'express';
import { StatisticsService } from '../services/statisticsService';

export class StatisticsController {
    /**
     * Get all dashboard statistics
     */
    static async getDashboardStats(req: Request, res: Response) {
        try {
            const stats = await StatisticsService.getDashboardStats();
            return res.json(stats);
        } catch (error) {
            console.error('Error getting dashboard stats:', error);
            return res.status(500).json({
                message: 'Terjadi kesalahan saat mengambil statistik dashboard'
            });
        }
    }

    /**
     * Get monthly events statistics
     */
    static async getMonthlyEventsStats(req: Request, res: Response) {
        try {
            const stats = await StatisticsService.getMonthlyEventsStats();
            return res.json(stats);
        } catch (error) {
            console.error('Error getting monthly events stats:', error);
            return res.status(500).json({
                message: 'Terjadi kesalahan saat mengambil statistik event bulanan'
            });
        }
    }

    /**
     * Get monthly participants statistics
     */
    static async getMonthlyParticipantsStats(req: Request, res: Response) {
        try {
            const stats = await StatisticsService.getMonthlyParticipantsStats();
            return res.json(stats);
        } catch (error) {
            console.error('Error getting monthly participants stats:', error);
            return res.status(500).json({
                message: 'Terjadi kesalahan saat mengambil statistik peserta bulanan'
            });
        }
    }

    /**
     * Get top 10 events by participant count
     */
    static async getTopEvents(req: Request, res: Response) {
        try {
            const stats = await StatisticsService.getTopEvents();
            return res.json(stats);
        } catch (error) {
            console.error('Error getting top events:', error);
            return res.status(500).json({
                message: 'Terjadi kesalahan saat mengambil daftar event teratas'
            });
        }
    }
}