import { Request, Response } from 'express';
import AppDataSource from '../config/database';
import { Gallery } from '../entities/Gallery';
import logger from '../utils/logger';
import * as path from 'path';
import * as fs from 'fs';

const galleryRepository = AppDataSource.getRepository(Gallery);

export class GalleryController {
    // Get all gallery items (public)
    static async getGalleryItems(req: Request, res: Response): Promise<void> {
        try {
            const { page = 1, limit = 12, search = '', category = '' } = req.query;
            const skip = (Number(page) - 1) * Number(limit);

            let query = galleryRepository.createQueryBuilder('gallery')
                .where('gallery.isPublished = :isPublished', { isPublished: true });

            // Apply search filter
            if (search) {
                query = query.andWhere(
                    '(gallery.title ILIKE :search OR gallery.description ILIKE :search)',
                    { search: `%${search}%` }
                );
            }

            // Apply category filter
            if (category) {
                query = query.andWhere('gallery.category = :category', { category });
            }

            const [items, total] = await query
                .orderBy('gallery.createdAt', 'DESC')
                .skip(skip)
                .take(Number(limit))
                .getManyAndCount();

            res.json({
                data: items,
                pagination: {
                    page: Number(page),
                    limit: Number(limit),
                    total,
                    pages: Math.ceil(total / Number(limit))
                }
            });
        } catch (error) {
            logger.error('Get gallery items error:', error);
            res.status(500).json({ message: 'Terjadi kesalahan saat mengambil galeri' });
        }
    }

    // Get single gallery item
    static async getGalleryItem(req: Request, res: Response): Promise<void> {
        try {
            const { id } = req.params;
            const item = await galleryRepository.findOne({ where: { id } });

            if (!item) {
                res.status(404).json({ message: 'Item galeri tidak ditemukan' });
                return;
            }

            res.json(item);
        } catch (error) {
            logger.error('Get gallery item error:', error);
            res.status(500).json({ message: 'Terjadi kesalahan saat mengambil item galeri' });
        }
    }

    // Create gallery item (admin only)
    static async createGalleryItem(req: Request, res: Response): Promise<void> {
        try {
            const {
                title,
                description,
                date,
                location,
                participants,
                category,
                imageUrl
            } = req.body;

            // Validate required fields
            if (!title || !description || !date || !location) {
                res.status(400).json({ message: 'Semua field wajib diisi' });
                return;
            }

            // Handle file upload or use URL
            let imagePath = imageUrl || '';

            // Get uploaded file from multer
            const files = (req as any).files || [];
            const imageFile = files.find((f: any) => f.fieldname === 'imageFile');

            // If image file uploaded, save it
            if (imageFile) {
                const uploadDir = path.join(process.cwd(), 'uploads', 'gallery');
                if (!fs.existsSync(uploadDir)) {
                    fs.mkdirSync(uploadDir, { recursive: true });
                }
                const filename = `gallery_${Date.now()}_${Math.random().toString(36).substring(7)}${path.extname(imageFile.originalname)}`;
                const filepath = path.join(uploadDir, filename);
                fs.writeFileSync(filepath, imageFile.buffer);
                imagePath = `uploads/gallery/${filename}`;
            }

            // Create gallery item
            const galleryItem = galleryRepository.create({
                title,
                description,
                date: new Date(date),
                location,
                image: imagePath,
                participants: participants ? parseInt(participants) : 0,
                category: category || null,
                createdBy: req.adminUser?.id,
                isPublished: true
            });

            const savedItem = await galleryRepository.save(galleryItem);

            logger.info(`Admin ${req.adminUser?.email} created gallery item: ${savedItem.title}`);

            res.status(201).json({
                message: 'Item galeri berhasil dibuat',
                item: savedItem
            });
        } catch (error) {
            logger.error('Create gallery item error:', error);
            res.status(500).json({ message: 'Terjadi kesalahan saat membuat item galeri' });
        }
    }

    // Update gallery item (admin only)
    static async updateGalleryItem(req: Request, res: Response): Promise<void> {
        try {
            const { id } = req.params;
            const {
                title,
                description,
                date,
                location,
                participants,
                category,
                imageUrl
            } = req.body;

            const item = await galleryRepository.findOne({ where: { id } });

            if (!item) {
                res.status(404).json({ message: 'Item galeri tidak ditemukan' });
                return;
            }

            // Handle file upload or use URL
            let imagePath = item.image;

            // Get uploaded file from multer
            const files = (req as any).files || [];
            const imageFile = files.find((f: any) => f.fieldname === 'imageFile');

            // If image file uploaded, save it
            if (imageFile) {
                const uploadDir = path.join(process.cwd(), 'uploads', 'gallery');
                if (!fs.existsSync(uploadDir)) {
                    fs.mkdirSync(uploadDir, { recursive: true });
                }
                const filename = `gallery_${Date.now()}_${Math.random().toString(36).substring(7)}${path.extname(imageFile.originalname)}`;
                const filepath = path.join(uploadDir, filename);
                fs.writeFileSync(filepath, imageFile.buffer);
                imagePath = `uploads/gallery/${filename}`;
            } else if (imageUrl !== undefined) {
                imagePath = imageUrl;
            }

            // Update fields
            if (title) item.title = title;
            if (description) item.description = description;
            if (date) item.date = new Date(date);
            if (location) item.location = location;
            if (participants !== undefined) item.participants = parseInt(participants);
            if (category !== undefined) item.category = category;
            item.image = imagePath;

            const updatedItem = await galleryRepository.save(item);

            logger.info(`Admin ${req.adminUser?.email} updated gallery item: ${updatedItem.title}`);

            res.json({
                message: 'Item galeri berhasil diupdate',
                item: updatedItem
            });
        } catch (error) {
            logger.error('Update gallery item error:', error);
            res.status(500).json({ message: 'Terjadi kesalahan saat mengupdate item galeri' });
        }
    }

    // Delete gallery item (admin only)
    static async deleteGalleryItem(req: Request, res: Response): Promise<void> {
        try {
            const { id } = req.params;

            const item = await galleryRepository.findOne({ where: { id } });

            if (!item) {
                res.status(404).json({ message: 'Item galeri tidak ditemukan' });
                return;
            }

            // Delete file if it's a local upload
            if (item.image && item.image.startsWith('uploads/')) {
                const filePath = path.join(process.cwd(), item.image);
                if (fs.existsSync(filePath)) {
                    fs.unlinkSync(filePath);
                }
            }

            await galleryRepository.remove(item);

            logger.info(`Admin ${req.adminUser?.email} deleted gallery item: ${item.title}`);

            res.json({ message: 'Item galeri berhasil dihapus' });
        } catch (error) {
            logger.error('Delete gallery item error:', error);
            res.status(500).json({ message: 'Terjadi kesalahan saat menghapus item galeri' });
        }
    }
}
