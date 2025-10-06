"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.StatisticsController = void 0;
const statisticsService_1 = require("../services/statisticsService");
class StatisticsController {
    static async getDashboardStats(req, res) {
        try {
            const stats = await statisticsService_1.StatisticsService.getDashboardStats();
            return res.json(stats);
        }
        catch (error) {
            console.error('Error getting dashboard stats:', error);
            return res.status(500).json({
                message: 'Terjadi kesalahan saat mengambil statistik dashboard'
            });
        }
    }
    static async getMonthlyEventsStats(req, res) {
        try {
            const stats = await statisticsService_1.StatisticsService.getMonthlyEventsStats();
            return res.json(stats);
        }
        catch (error) {
            console.error('Error getting monthly events stats:', error);
            return res.status(500).json({
                message: 'Terjadi kesalahan saat mengambil statistik event bulanan'
            });
        }
    }
    static async getMonthlyParticipantsStats(req, res) {
        try {
            const stats = await statisticsService_1.StatisticsService.getMonthlyParticipantsStats();
            return res.json(stats);
        }
        catch (error) {
            console.error('Error getting monthly participants stats:', error);
            return res.status(500).json({
                message: 'Terjadi kesalahan saat mengambil statistik peserta bulanan'
            });
        }
    }
    static async getTopEvents(req, res) {
        try {
            const stats = await statisticsService_1.StatisticsService.getTopEvents();
            return res.json(stats);
        }
        catch (error) {
            console.error('Error getting top events:', error);
            return res.status(500).json({
                message: 'Terjadi kesalahan saat mengambil daftar event teratas'
            });
        }
    }
}
exports.StatisticsController = StatisticsController;
//# sourceMappingURL=StatisticsController.js.map