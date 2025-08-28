import { NextFunction, Request, Response } from "express";
import AppDataSource from "../config/database";
import { User } from "../entities/User";

export const requireVerification = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        // Pastikan user sudah terauthentikasi (dari auth middleware sebelumnya)
        if (!req.user || !(req.user as any).id) {
            res.status(401).json({
                message: 'Authentication required'
            });
            return;
        }

        // Initialize database connection if not initialized
        if (!AppDataSource.isInitialized) {
            await AppDataSource.initialize();
        }
        
        const userRepository = AppDataSource.getRepository(User);
        
        // Ambil data user lengkap dari database
        const user = await userRepository.findOne({ 
            where: { id: (req.user as any).id } 
        });

        if (!user) {
            res.status(401).json({
                message: 'User not found'
            });
            return;
        }

        // Cek apakah email sudah diverifikasi
        if (!user.isEmailVerified && !user.isVerified) {
            res.status(403).json({
                message: 'Please verify your email first',
                requiresVerification: true
            });
            return;
        }

        // Jika sudah terverifikasi, lanjutkan
        next();
    } catch (error) {
        console.error('Verification middleware error:', error);
        res.status(500).json({
            message: 'Internal server error'
        });
        return;
    }
};
