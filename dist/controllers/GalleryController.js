"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.GalleryController = void 0;
const database_1 = __importDefault(require("../config/database"));
const Gallery_1 = require("../entities/Gallery");
const logger_1 = __importDefault(require("../utils/logger"));
const path = __importStar(require("path"));
const fs = __importStar(require("fs"));
const galleryRepository = database_1.default.getRepository(Gallery_1.Gallery);
class GalleryController {
    static async getGalleryItems(req, res) {
        try {
            const { page = 1, limit = 12, search = '', category = '' } = req.query;
            const skip = (Number(page) - 1) * Number(limit);
            let query = galleryRepository.createQueryBuilder('gallery')
                .where('gallery.isPublished = :isPublished', { isPublished: true });
            if (search) {
                query = query.andWhere('(gallery.title ILIKE :search OR gallery.description ILIKE :search)', { search: `%${search}%` });
            }
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
        }
        catch (error) {
            logger_1.default.error('Get gallery items error:', error);
            res.status(500).json({ message: 'Terjadi kesalahan saat mengambil galeri' });
        }
    }
    static async getGalleryItem(req, res) {
        try {
            const { id } = req.params;
            const item = await galleryRepository.findOne({ where: { id } });
            if (!item) {
                res.status(404).json({ message: 'Item galeri tidak ditemukan' });
                return;
            }
            res.json(item);
        }
        catch (error) {
            logger_1.default.error('Get gallery item error:', error);
            res.status(500).json({ message: 'Terjadi kesalahan saat mengambil item galeri' });
        }
    }
    static async createGalleryItem(req, res) {
        var _a, _b;
        try {
            const { title, description, date, location, participants, category, imageUrl } = req.body;
            if (!title || !description || !date || !location) {
                res.status(400).json({ message: 'Semua field wajib diisi' });
                return;
            }
            let imagePath = imageUrl || '';
            const files = req.files || [];
            const imageFile = files.find((f) => f.fieldname === 'imageFile');
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
            const galleryItem = galleryRepository.create({
                title,
                description,
                date: new Date(date),
                location,
                image: imagePath,
                participants: participants ? parseInt(participants) : 0,
                category: category || null,
                createdBy: (_a = req.adminUser) === null || _a === void 0 ? void 0 : _a.id,
                isPublished: true
            });
            const savedItem = await galleryRepository.save(galleryItem);
            logger_1.default.info(`Admin ${(_b = req.adminUser) === null || _b === void 0 ? void 0 : _b.email} created gallery item: ${savedItem.title}`);
            res.status(201).json({
                message: 'Item galeri berhasil dibuat',
                item: savedItem
            });
        }
        catch (error) {
            logger_1.default.error('Create gallery item error:', error);
            res.status(500).json({ message: 'Terjadi kesalahan saat membuat item galeri' });
        }
    }
    static async updateGalleryItem(req, res) {
        var _a;
        try {
            const { id } = req.params;
            const { title, description, date, location, participants, category, imageUrl } = req.body;
            const item = await galleryRepository.findOne({ where: { id } });
            if (!item) {
                res.status(404).json({ message: 'Item galeri tidak ditemukan' });
                return;
            }
            let imagePath = item.image;
            const files = req.files || [];
            const imageFile = files.find((f) => f.fieldname === 'imageFile');
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
            else if (imageUrl !== undefined) {
                imagePath = imageUrl;
            }
            if (title)
                item.title = title;
            if (description)
                item.description = description;
            if (date)
                item.date = new Date(date);
            if (location)
                item.location = location;
            if (participants !== undefined)
                item.participants = parseInt(participants);
            if (category !== undefined)
                item.category = category;
            item.image = imagePath;
            const updatedItem = await galleryRepository.save(item);
            logger_1.default.info(`Admin ${(_a = req.adminUser) === null || _a === void 0 ? void 0 : _a.email} updated gallery item: ${updatedItem.title}`);
            res.json({
                message: 'Item galeri berhasil diupdate',
                item: updatedItem
            });
        }
        catch (error) {
            logger_1.default.error('Update gallery item error:', error);
            res.status(500).json({ message: 'Terjadi kesalahan saat mengupdate item galeri' });
        }
    }
    static async deleteGalleryItem(req, res) {
        var _a;
        try {
            const { id } = req.params;
            const item = await galleryRepository.findOne({ where: { id } });
            if (!item) {
                res.status(404).json({ message: 'Item galeri tidak ditemukan' });
                return;
            }
            if (item.image && item.image.startsWith('uploads/')) {
                const filePath = path.join(process.cwd(), item.image);
                if (fs.existsSync(filePath)) {
                    fs.unlinkSync(filePath);
                }
            }
            await galleryRepository.remove(item);
            logger_1.default.info(`Admin ${(_a = req.adminUser) === null || _a === void 0 ? void 0 : _a.email} deleted gallery item: ${item.title}`);
            res.json({ message: 'Item galeri berhasil dihapus' });
        }
        catch (error) {
            logger_1.default.error('Delete gallery item error:', error);
            res.status(500).json({ message: 'Terjadi kesalahan saat menghapus item galeri' });
        }
    }
}
exports.GalleryController = GalleryController;
//# sourceMappingURL=GalleryController.js.map