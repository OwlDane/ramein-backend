import { Request, Response } from 'express';
import AppDataSource from '../config/database';
import slugify from 'slugify';
import { KategoriKegiatan } from '../entities/KategoriKegiatan';

export class EventCategoryController {
  // Get all categories
  static async getAllCategories(_req: Request, res: Response) {
    try {
      if (!AppDataSource.isInitialized) {
        await AppDataSource.initialize();
      }
      const categoryRepository = AppDataSource.getRepository(KategoriKegiatan);
      const categories = await categoryRepository.find({
        order: { createdAt: 'DESC' }
      });
      return res.json(categories);
    } catch (error) {
      console.error('Error fetching categories:', error);
      return res.status(500).json({ message: 'Internal server error' });
    }
  }

  // Get category by ID
  static async getCategoryById(req: Request, res: Response) {
    const { id } = req.params;
    try {
      if (!AppDataSource.isInitialized) {
        await AppDataSource.initialize();
      }
      const categoryRepository = AppDataSource.getRepository(KategoriKegiatan);
      const category = await categoryRepository.findOne({ where: { id: parseInt(id) } });
      
      if (!category) {
        return res.status(404).json({ message: 'Category not found' });
      }
      return res.json(category);
    } catch (error) {
      console.error('Error fetching category:', error);
      return res.status(500).json({ message: 'Internal server error' });
    }
  }

  // Create new category
  static async createCategory(req: Request, res: Response) {
    const { nama_kategori, kategori_logo } = req.body;
    try {
      if (!AppDataSource.isInitialized) {
        await AppDataSource.initialize();
      }
      const categoryRepository = AppDataSource.getRepository(KategoriKegiatan);
      
      const slug = slugify(nama_kategori, { lower: true });
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
    } catch (error) {
      console.error('Error creating category:', error);
      return res.status(500).json({ message: 'Internal server error' });
    }
  }

  // Update category
  static async updateCategory(req: Request, res: Response) {
    const { id } = req.params;
    const { nama_kategori, kategori_logo } = req.body;
    try {
      if (!AppDataSource.isInitialized) {
        await AppDataSource.initialize();
      }
      const categoryRepository = AppDataSource.getRepository(KategoriKegiatan);
      
      const category = await categoryRepository.findOne({ 
        where: { id: parseInt(id) } 
      });

      if (!category) {
        return res.status(404).json({ message: 'Category not found' });
      }

      category.nama_kategori = nama_kategori;
      category.slug = slugify(nama_kategori, { lower: true });
      category.kategori_logo = kategori_logo;

      const updatedCategory = await categoryRepository.save(category);
      return res.json(updatedCategory);
    } catch (error) {
      console.error('Error updating category:', error);
      return res.status(500).json({ message: 'Internal server error' });
    }
  }

  // Delete category
  static async deleteCategory(req: Request, res: Response) {
    const { id } = req.params;
    try {
      if (!AppDataSource.isInitialized) {
        await AppDataSource.initialize();
      }
      const categoryRepository = AppDataSource.getRepository(KategoriKegiatan);
      
      const category = await categoryRepository.findOne({ 
        where: { id: parseInt(id) } 
      });

      if (!category) {
        return res.status(404).json({ message: 'Category not found' });
      }

      await categoryRepository.remove(category);
      return res.json({ message: 'Category deleted successfully' });
    } catch (error) {
      console.error('Error deleting category:', error);
      return res.status(500).json({ message: 'Internal server error' });
    }
  }
}
