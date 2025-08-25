"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.EventCategoryController = void 0;
const database_1 = __importDefault(require("../config/database"));
const slugify_1 = __importDefault(require("slugify"));
const KategoriKegiatan_1 = require("../entities/KategoriKegiatan");
class EventCategoryController {
    static async getAllCategories(_req, res) {
        try {
            if (!database_1.default.isInitialized) {
                await database_1.default.initialize();
            }
            const categoryRepository = database_1.default.getRepository(KategoriKegiatan_1.KategoriKegiatan);
            const categories = await categoryRepository.find({
                order: { createdAt: 'DESC' }
            });
            return res.json(categories);
        }
        catch (error) {
            console.error('Error fetching categories:', error);
            return res.status(500).json({ message: 'Internal server error' });
        }
    }
    static async getCategoryById(req, res) {
        const { id } = req.params;
        try {
            if (!database_1.default.isInitialized) {
                await database_1.default.initialize();
            }
            const categoryRepository = database_1.default.getRepository(KategoriKegiatan_1.KategoriKegiatan);
            const category = await categoryRepository.findOne({ where: { id: parseInt(id) } });
            if (!category) {
                return res.status(404).json({ message: 'Category not found' });
            }
            return res.json(category);
        }
        catch (error) {
            console.error('Error fetching category:', error);
            return res.status(500).json({ message: 'Internal server error' });
        }
    }
    static async createCategory(req, res) {
        const { nama_kategori, kategori_logo } = req.body;
        try {
            if (!database_1.default.isInitialized) {
                await database_1.default.initialize();
            }
            const categoryRepository = database_1.default.getRepository(KategoriKegiatan_1.KategoriKegiatan);
            const slug = (0, slugify_1.default)(nama_kategori, { lower: true });
            const existingCategory = await categoryRepository.findOne({
                where: { nama_kategori }
            });
            if (existingCategory) {
                return res.status(400).json({ message: 'Category with this name already exists' });
            }
            const newCategory = categoryRepository.create({
                nama_kategori,
                slug,
                kategori_logo
            });
            const savedCategory = await categoryRepository.save(newCategory);
            return res.status(201).json(savedCategory);
        }
        catch (error) {
            console.error('Error creating category:', error);
            return res.status(500).json({ message: 'Internal server error' });
        }
    }
    static async updateCategory(req, res) {
        const { id } = req.params;
        const { nama_kategori, kategori_logo } = req.body;
        try {
            if (!database_1.default.isInitialized) {
                await database_1.default.initialize();
            }
            const categoryRepository = database_1.default.getRepository(KategoriKegiatan_1.KategoriKegiatan);
            const category = await categoryRepository.findOne({
                where: { id: parseInt(id) }
            });
            if (!category) {
                return res.status(404).json({ message: 'Category not found' });
            }
            category.nama_kategori = nama_kategori;
            category.slug = (0, slugify_1.default)(nama_kategori, { lower: true });
            category.kategori_logo = kategori_logo;
            const updatedCategory = await categoryRepository.save(category);
            return res.json(updatedCategory);
        }
        catch (error) {
            console.error('Error updating category:', error);
            return res.status(500).json({ message: 'Internal server error' });
        }
    }
    static async deleteCategory(req, res) {
        const { id } = req.params;
        try {
            if (!database_1.default.isInitialized) {
                await database_1.default.initialize();
            }
            const categoryRepository = database_1.default.getRepository(KategoriKegiatan_1.KategoriKegiatan);
            const category = await categoryRepository.findOne({
                where: { id: parseInt(id) }
            });
            if (!category) {
                return res.status(404).json({ message: 'Category not found' });
            }
            await categoryRepository.remove(category);
            return res.json({ message: 'Category deleted successfully' });
        }
        catch (error) {
            console.error('Error deleting category:', error);
            return res.status(500).json({ message: 'Internal server error' });
        }
    }
}
exports.EventCategoryController = EventCategoryController;
//# sourceMappingURL=EventCategoryController.js.map