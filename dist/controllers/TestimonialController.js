"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
exports.TestimonialController = void 0;
const database_1 = __importDefault(require("../config/database"));
const Testimonial_1 = require("../entities/Testimonial");
class TestimonialController {
}
exports.TestimonialController = TestimonialController;
_a = TestimonialController;
TestimonialController.getAll = async (_req, res) => {
    try {
        const testimonialRepo = database_1.default.getRepository(Testimonial_1.Testimonial);
        const testimonials = await testimonialRepo.find({
            where: { isActive: true },
            order: { sortOrder: 'ASC', createdAt: 'DESC' }
        });
        return res.json({
            success: true,
            data: testimonials
        });
    }
    catch (error) {
        console.error('Error fetching testimonials:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to fetch testimonials'
        });
    }
};
TestimonialController.getAllAdmin = async (_req, res) => {
    try {
        const testimonialRepo = database_1.default.getRepository(Testimonial_1.Testimonial);
        const testimonials = await testimonialRepo.find({
            order: { sortOrder: 'ASC', createdAt: 'DESC' }
        });
        return res.json({
            success: true,
            data: testimonials
        });
    }
    catch (error) {
        console.error('Error fetching testimonials:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to fetch testimonials'
        });
    }
};
TestimonialController.getById = async (req, res) => {
    try {
        const { id } = req.params;
        const testimonialRepo = database_1.default.getRepository(Testimonial_1.Testimonial);
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
    }
    catch (error) {
        console.error('Error fetching testimonial:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to fetch testimonial'
        });
    }
};
TestimonialController.create = async (req, res) => {
    try {
        const { name, role, company, content, avatar, rating, isActive, sortOrder } = req.body;
        if (!name || !role || !company || !content) {
            return res.status(400).json({
                success: false,
                message: 'Name, role, company, and content are required'
            });
        }
        const testimonialRepo = database_1.default.getRepository(Testimonial_1.Testimonial);
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
    }
    catch (error) {
        console.error('Error creating testimonial:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to create testimonial'
        });
    }
};
TestimonialController.update = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, role, company, content, avatar, rating, isActive, sortOrder } = req.body;
        const testimonialRepo = database_1.default.getRepository(Testimonial_1.Testimonial);
        const testimonial = await testimonialRepo.findOne({ where: { id } });
        if (!testimonial) {
            return res.status(404).json({
                success: false,
                message: 'Testimonial not found'
            });
        }
        if (name !== undefined)
            testimonial.name = name;
        if (role !== undefined)
            testimonial.role = role;
        if (company !== undefined)
            testimonial.company = company;
        if (content !== undefined)
            testimonial.content = content;
        if (avatar !== undefined)
            testimonial.avatar = avatar;
        if (rating !== undefined)
            testimonial.rating = rating;
        if (isActive !== undefined)
            testimonial.isActive = isActive;
        if (sortOrder !== undefined)
            testimonial.sortOrder = sortOrder;
        const updatedTestimonial = await testimonialRepo.save(testimonial);
        return res.json({
            success: true,
            message: 'Testimonial updated successfully',
            data: updatedTestimonial
        });
    }
    catch (error) {
        console.error('Error updating testimonial:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to update testimonial'
        });
    }
};
TestimonialController.delete = async (req, res) => {
    try {
        const { id } = req.params;
        const testimonialRepo = database_1.default.getRepository(Testimonial_1.Testimonial);
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
    }
    catch (error) {
        console.error('Error deleting testimonial:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to delete testimonial'
        });
    }
};
TestimonialController.toggleActive = async (req, res) => {
    try {
        const { id } = req.params;
        const testimonialRepo = database_1.default.getRepository(Testimonial_1.Testimonial);
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
    }
    catch (error) {
        console.error('Error toggling testimonial status:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to toggle testimonial status'
        });
    }
};
//# sourceMappingURL=TestimonialController.js.map