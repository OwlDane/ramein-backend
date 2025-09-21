import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import AppDataSource from '../config/database';
import { User, UserRole } from '../entities/User';
import logger from '../utils/logger';

const userRepository = AppDataSource.getRepository(User);

export class AdminAuthController {
    // Admin login with stricter validation
    static async login(req: Request, res: Response): Promise<void> {
        try {
            const { email, password } = req.body;

            if (!email || !password) {
                res.status(400).json({ 
                    message: 'Email dan password harus diisi' 
                });
                return;
            }

            // Find user with ADMIN role
            const admin = await userRepository.findOne({
                where: { 
                    email: email.toLowerCase(),
                    role: UserRole.ADMIN
                }
            });

            if (!admin) {
                logger.warn(`Admin login attempt with non-admin email: ${email}`);
                res.status(401).json({ 
                    message: 'Kredensial admin tidak valid' 
                });
                return;
            }

            // Check if admin account is verified
            if (!admin.isVerified || !admin.isEmailVerified) {
                res.status(401).json({ 
                    message: 'Akun admin belum terverifikasi' 
                });
                return;
            }

            // Verify password
            const isPasswordValid = await bcrypt.compare(password, admin.password);
            if (!isPasswordValid) {
                logger.warn(`Admin login attempt with invalid password for email: ${email}`);
                res.status(401).json({ 
                    message: 'Kredensial admin tidak valid' 
                });
                return;
            }

            // Generate admin-specific JWT token
            const adminToken = jwt.sign(
                { 
                    id: admin.id, 
                    email: admin.email, 
                    role: 'ADMIN',
                    isAdmin: true,
                    loginTime: new Date().toISOString()
                },
                process.env.JWT_SECRET || 'fallback-secret',
                { 
                    expiresIn: '5m', // Admin session expires in 5 minutes
                    issuer: 'ramein-admin'
                }
            );

            // Log successful admin login
            logger.info(`Admin login successful: ${admin.email}`);

            res.json({
                message: 'Login admin berhasil',
                token: adminToken,
                admin: {
                    id: admin.id,
                    email: admin.email,
                    name: admin.name,
                    role: admin.role,
                    isAdmin: true
                }
            });

        } catch (error) {
            logger.error('Admin login error:', error);
            res.status(500).json({ 
                message: 'Terjadi kesalahan saat login admin' 
            });
        }
    }

    // Admin logout
    static async logout(req: Request, res: Response) {
        try {
            // Log admin logout
            logger.info(`Admin logout: ${req.user?.email}`);
            
            res.json({ 
                message: 'Logout admin berhasil' 
            });
        } catch (error) {
            logger.error('Admin logout error:', error);
            res.status(500).json({ 
                message: 'Terjadi kesalahan saat logout admin' 
            });
        }
    }

    // Get admin profile
    static async getProfile(req: Request, res: Response): Promise<void> {
        try {
            const admin = await userRepository.findOne({
                where: { id: req.adminUser?.id },
                select: ['id', 'email', 'name', 'role', 'isVerified', 'isEmailVerified', 'createdAt']
            });

            if (!admin) {
                res.status(404).json({ 
                    message: 'Admin tidak ditemukan' 
                });
                return;
            }

            res.json({
                admin: {
                    ...admin,
                    isAdmin: true
                }
            });
        } catch (error) {
            logger.error('Get admin profile error:', error);
            res.status(500).json({ 
                message: 'Terjadi kesalahan saat mengambil profil admin' 
            });
        }
    }

    // Verify admin session
    static async verifySession(req: Request, res: Response) {
        try {
            res.json({
                valid: true,
                admin: {
                    id: req.adminUser?.id,
                    email: req.adminUser?.email,
                    name: req.adminUser?.name,
                    role: req.adminUser?.role,
                    isAdmin: true
                }
            });
        } catch (error) {
            logger.error('Verify admin session error:', error);
            res.status(500).json({ 
                message: 'Terjadi kesalahan saat verifikasi session admin' 
            });
        }
    }
}
