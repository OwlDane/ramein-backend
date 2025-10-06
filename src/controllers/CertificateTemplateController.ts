import { Response } from 'express';
import AppDataSource from '../config/database';
import { CertificateTemplate } from '../entities/CertificateTemplate';
import { AuthRequest } from '../middlewares/auth';

const templateRepository = AppDataSource.getRepository(CertificateTemplate);

export class CertificateTemplateController {
    // Get all templates
    static async getAll(req: AuthRequest, res: Response) {
        try {
            const templates = await templateRepository.find({
                where: { isActive: true },
                order: { isDefault: 'DESC', createdAt: 'DESC' }
            });

            return res.json(templates);
        } catch (error) {
            console.error('Get templates error:', error);
            return res.status(500).json({ message: 'Terjadi kesalahan saat mengambil template' });
        }
    }

    // Get template by ID
    static async getById(req: AuthRequest, res: Response) {
        try {
            const { id } = req.params;
            const template = await templateRepository.findOne({ where: { id } });

            if (!template) {
                return res.status(404).json({ message: 'Template tidak ditemukan' });
            }

            return res.json(template);
        } catch (error) {
            console.error('Get template error:', error);
            return res.status(500).json({ message: 'Terjadi kesalahan saat mengambil template' });
        }
    }

    // Create new template
    static async create(req: AuthRequest, res: Response) {
        try {
            console.log('Create template request received');
            console.log('User:', req.user);
            console.log('Body:', req.body);

            if (!req.user) {
                console.error('No user in request');
                return res.status(401).json({ message: 'Authentication required' });
            }

            if (req.user.role !== 'ADMIN') {
                console.error('User is not admin:', req.user.role);
                return res.status(403).json({ message: 'Unauthorized' });
            }

            const { name, description, category, templateUrl, thumbnailUrl, placeholders, settings } = req.body;

            if (!name || !templateUrl) {
                console.error('Missing required fields');
                return res.status(400).json({ message: 'Name and templateUrl are required' });
            }

            const template = new CertificateTemplate();
            template.name = name;
            template.description = description || '';
            template.category = category || 'custom';
            template.templateUrl = templateUrl;
            template.thumbnailUrl = thumbnailUrl || null;
            template.placeholders = placeholders || [];
            template.settings = settings || {};
            template.createdBy = req.user.id;

            console.log('Saving template:', template);

            const savedTemplate = await templateRepository.save(template);

            console.log('Template saved successfully:', savedTemplate.id);

            return res.status(201).json({
                message: 'Template berhasil dibuat',
                template: savedTemplate
            });
        } catch (error) {
            console.error('Create template error:', error);
            console.error('Error stack:', error instanceof Error ? error.stack : 'No stack');
            return res.status(500).json({ 
                message: 'Terjadi kesalahan saat membuat template',
                error: error instanceof Error ? error.message : 'Unknown error'
            });
        }
    }

    // Update template
    static async update(req: AuthRequest, res: Response) {
        try {
            if (req.user.role !== 'ADMIN') {
                return res.status(403).json({ message: 'Unauthorized' });
            }

            const { id } = req.params;
            const { name, description, category, templateUrl, thumbnailUrl, placeholders, settings, isDefault } = req.body;

            const template = await templateRepository.findOne({ where: { id } });
            if (!template) {
                return res.status(404).json({ message: 'Template tidak ditemukan' });
            }

            if (name) template.name = name;
            if (description !== undefined) template.description = description;
            if (category) template.category = category;
            if (templateUrl) template.templateUrl = templateUrl;
            if (thumbnailUrl !== undefined) template.thumbnailUrl = thumbnailUrl;
            if (placeholders) template.placeholders = placeholders;
            if (settings) template.settings = settings;
            if (typeof isDefault === 'boolean') template.isDefault = isDefault;

            await templateRepository.save(template);

            return res.json({
                message: 'Template berhasil diupdate',
                template
            });
        } catch (error) {
            console.error('Update template error:', error);
            return res.status(500).json({ message: 'Terjadi kesalahan saat mengupdate template' });
        }
    }

    // Delete template
    static async delete(req: AuthRequest, res: Response) {
        try {
            if (req.user.role !== 'ADMIN') {
                return res.status(403).json({ message: 'Unauthorized' });
            }

            const { id } = req.params;
            const template = await templateRepository.findOne({ where: { id } });

            if (!template) {
                return res.status(404).json({ message: 'Template tidak ditemukan' });
            }

            if (template.isDefault) {
                return res.status(400).json({ message: 'Template default tidak dapat dihapus' });
            }

            // Soft delete
            template.isActive = false;
            await templateRepository.save(template);

            return res.json({ message: 'Template berhasil dihapus' });
        } catch (error) {
            console.error('Delete template error:', error);
            return res.status(500).json({ message: 'Terjadi kesalahan saat menghapus template' });
        }
    }

    // Set as default template
    static async setDefault(req: AuthRequest, res: Response) {
        try {
            if (req.user.role !== 'ADMIN') {
                return res.status(403).json({ message: 'Unauthorized' });
            }

            const { id } = req.params;
            const template = await templateRepository.findOne({ where: { id } });

            if (!template) {
                return res.status(404).json({ message: 'Template tidak ditemukan' });
            }

            // Unset all other defaults
            await templateRepository.update({ isDefault: true }, { isDefault: false });

            // Set this as default
            template.isDefault = true;
            await templateRepository.save(template);

            return res.json({
                message: 'Template berhasil diset sebagai default',
                template
            });
        } catch (error) {
            console.error('Set default template error:', error);
            return res.status(500).json({ message: 'Terjadi kesalahan saat mengset template default' });
        }
    }

    // Get default template
    static async getDefault(req: AuthRequest, res: Response) {
        try {
            const template = await templateRepository.findOne({
                where: { isDefault: true, isActive: true }
            });

            if (!template) {
                return res.status(404).json({ message: 'Template default tidak ditemukan' });
            }

            return res.json(template);
        } catch (error) {
            console.error('Get default template error:', error);
            return res.status(500).json({ message: 'Terjadi kesalahan saat mengambil template default' });
        }
    }
}
