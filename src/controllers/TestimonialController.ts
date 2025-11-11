import { Request, Response } from 'express';
import AppDataSource from '../config/database';
import { Testimonial } from '../entities/Testimonial';

export class TestimonialController {
    // Get all active testimonials (public)
    static getAll = async (_req: Request, res: Response) => {
        try {
            const testimonialRepo = AppDataSource.getRepository(Testimonial);
            
            const testimonials = await testimonialRepo.find({
                where: { isActive: true },
                order: { sortOrder: 'ASC', createdAt: 'DESC' }
            });

            return res.json({
                success: true,
                data: testimonials
            });
        } catch (error) {
            console.error('Error fetching testimonials:', error);
            return res.status(500).json({
                success: false,
                message: 'Failed to fetch testimonials'
            });
        }
    };

    // Get all testimonials (admin)
    static getAllAdmin = async (_req: Request, res: Response) => {
        try {
            const testimonialRepo = AppDataSource.getRepository(Testimonial);
            
            const testimonials = await testimonialRepo.find({
                order: { sortOrder: 'ASC', createdAt: 'DESC' }
            });

            return res.json({
                success: true,
                data: testimonials
            });
        } catch (error) {
            console.error('Error fetching testimonials:', error);
            return res.status(500).json({
                success: false,
                message: 'Failed to fetch testimonials'
            });
        }
    };

    // Get single testimonial by ID
    static getById = async (req: Request, res: Response) => {
        try {
            const { id } = req.params;
            const testimonialRepo = AppDataSource.getRepository(Testimonial);
            
            const testimonial = await testimonialRepo.findOne({ where: { id } });
            
            if (!testimonial) {
                return res.status(404).json({
                    success: false,
                    message: 'Testimonial not found'
                });
            }

            return res.json({
                success: true,
                data: testimonial
            });
        } catch (error) {
            console.error('Error fetching testimonial:', error);
            return res.status(500).json({
                success: false,
                message: 'Failed to fetch testimonial'
            });
        }
    };

    // Create testimonial (admin)
    static create = async (req: Request, res: Response) => {
        try {
            const { name, role, company, content, avatar, rating, isActive, sortOrder } = req.body;
            
            // Validation
            if (!name || !role || !company || !content) {
                return res.status(400).json({
                    success: false,
                    message: 'Name, role, company, and content are required'
                });
            }

            const testimonialRepo = AppDataSource.getRepository(Testimonial);
            
            const testimonial = testimonialRepo.create({
                name,
                role,
                company,
                content,
                avatar: avatar || null,
                rating: rating || 5,
                isActive: isActive !== undefined ? isActive : true,
                sortOrder: sortOrder || 0
            });

            const savedTestimonial = await testimonialRepo.save(testimonial);

            return res.status(201).json({
                success: true,
                message: 'Testimonial created successfully',
                data: savedTestimonial
            });
        } catch (error) {
            console.error('Error creating testimonial:', error);
            return res.status(500).json({
                success: false,
                message: 'Failed to create testimonial'
            });
        }
    };

    // Update testimonial (admin)
    static update = async (req: Request, res: Response) => {
        try {
            const { id } = req.params;
            const { name, role, company, content, avatar, rating, isActive, sortOrder } = req.body;
            
            const testimonialRepo = AppDataSource.getRepository(Testimonial);
            
            const testimonial = await testimonialRepo.findOne({ where: { id } });
            
            if (!testimonial) {
                return res.status(404).json({
                    success: false,
                    message: 'Testimonial not found'
                });
            }

            // Update fields
            if (name !== undefined) testimonial.name = name;
            if (role !== undefined) testimonial.role = role;
            if (company !== undefined) testimonial.company = company;
            if (content !== undefined) testimonial.content = content;
            if (avatar !== undefined) testimonial.avatar = avatar;
            if (rating !== undefined) testimonial.rating = rating;
            if (isActive !== undefined) testimonial.isActive = isActive;
            if (sortOrder !== undefined) testimonial.sortOrder = sortOrder;

            const updatedTestimonial = await testimonialRepo.save(testimonial);

            return res.json({
                success: true,
                message: 'Testimonial updated successfully',
                data: updatedTestimonial
            });
        } catch (error) {
            console.error('Error updating testimonial:', error);
            return res.status(500).json({
                success: false,
                message: 'Failed to update testimonial'
            });
        }
    };

    // Delete testimonial (admin)
    static delete = async (req: Request, res: Response) => {
        try {
            const { id } = req.params;
            const testimonialRepo = AppDataSource.getRepository(Testimonial);
            
            const testimonial = await testimonialRepo.findOne({ where: { id } });
            
            if (!testimonial) {
                return res.status(404).json({
                    success: false,
                    message: 'Testimonial not found'
                });
            }

            await testimonialRepo.remove(testimonial);

            return res.json({
                success: true,
                message: 'Testimonial deleted successfully'
            });
        } catch (error) {
            console.error('Error deleting testimonial:', error);
            return res.status(500).json({
                success: false,
                message: 'Failed to delete testimonial'
            });
        }
    };

    // Toggle active status (admin)
    static toggleActive = async (req: Request, res: Response) => {
        try {
            const { id } = req.params;
            const testimonialRepo = AppDataSource.getRepository(Testimonial);
            
            const testimonial = await testimonialRepo.findOne({ where: { id } });
            
            if (!testimonial) {
                return res.status(404).json({
                    success: false,
                    message: 'Testimonial not found'
                });
            }

            testimonial.isActive = !testimonial.isActive;
            const updatedTestimonial = await testimonialRepo.save(testimonial);

            return res.json({
                success: true,
                message: `Testimonial ${testimonial.isActive ? 'activated' : 'deactivated'} successfully`,
                data: updatedTestimonial
            });
        } catch (error) {
            console.error('Error toggling testimonial status:', error);
            return res.status(500).json({
                success: false,
                message: 'Failed to toggle testimonial status'
            });
        }
    };
}