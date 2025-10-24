import { Request, Response } from 'express';
import AppDataSource from '../config/database';
import { Article } from '../entities/Article';
import { ArticleCategory } from '../entities/ArticleCategory';
import { AuthRequest } from '../middlewares/auth';
import slugify from 'slugify';

const articleRepository = AppDataSource.getRepository(Article);
const categoryRepository = AppDataSource.getRepository(ArticleCategory);

export class ArticleController {
    // Get all published articles (public)
    static async getAll(req: Request, res: Response) {
        try {
            const { category, search, limit = 20, offset = 0 } = req.query;
            
            let query = articleRepository.createQueryBuilder('article')
                .leftJoinAndSelect('article.author', 'author')
                .leftJoinAndSelect('article.categoryRelation', 'category')
                .where('article.isPublished = :isPublished', { isPublished: true });

            // Filter by category
            if (category && category !== 'all') {
                query = query.andWhere('category.slug = :categorySlug', { categorySlug: category });
            }

            // Search functionality
            if (search) {
                query = query.andWhere(
                    '(LOWER(article.title) LIKE LOWER(:search) OR LOWER(article.excerpt) LIKE LOWER(:search))',
                    { search: `%${search}%` }
                );
            }

            // Order by published date
            query = query.orderBy('article.publishedAt', 'DESC')
                .skip(Number(offset))
                .take(Number(limit));

            const [articles, total] = await query.getManyAndCount();

            // Transform response to match frontend expectations
            const transformedArticles = articles.map(article => ({
                id: article.id,
                title: article.title,
                slug: article.slug,
                excerpt: article.excerpt,
                content: article.content,
                coverImage: article.coverImage,
                category: article.categoryRelation?.name || 'Uncategorized',
                author: {
                    name: article.author.name,
                    avatar: null,
                    role: article.author.role
                },
                publishedAt: article.publishedAt,
                readTime: article.readTime,
                tags: article.tags,
                isPublished: article.isPublished,
                viewCount: article.viewCount
            }));

            return res.json({
                data: transformedArticles,
                total,
                limit: Number(limit),
                offset: Number(offset)
            });
        } catch (error) {
            console.error('Get articles error:', error);
            return res.status(500).json({ message: 'Terjadi kesalahan saat mengambil artikel' });
        }
    }

    // Get article by slug (public)
    static async getBySlug(req: Request, res: Response) {
        try {
            const { slug } = req.params;

            const article = await articleRepository.findOne({
                where: { slug, isPublished: true },
                relations: ['author', 'categoryRelation']
            });

            if (!article) {
                return res.status(404).json({ message: 'Artikel tidak ditemukan' });
            }

            // Increment view count
            article.viewCount += 1;
            await articleRepository.save(article);

            // Transform response
            const transformedArticle = {
                id: article.id,
                title: article.title,
                slug: article.slug,
                excerpt: article.excerpt,
                content: article.content,
                coverImage: article.coverImage,
                category: article.categoryRelation?.name || 'Uncategorized',
                author: {
                    name: article.author.name,
                    avatar: null,
                    role: article.author.role
                },
                publishedAt: article.publishedAt,
                readTime: article.readTime,
                tags: article.tags,
                isPublished: article.isPublished,
                viewCount: article.viewCount
            };

            return res.json(transformedArticle);
        } catch (error) {
            console.error('Get article error:', error);
            return res.status(500).json({ message: 'Terjadi kesalahan saat mengambil artikel' });
        }
    }

    // Get all articles for admin (including drafts)
    static async getAllAdmin(req: AuthRequest, res: Response) {
        try {
            if (req.user.role !== 'ADMIN') {
                return res.status(403).json({ message: 'Unauthorized' });
            }

            const { status, category, search, limit = 20, offset = 0 } = req.query;
            
            let query = articleRepository.createQueryBuilder('article')
                .leftJoinAndSelect('article.author', 'author')
                .leftJoinAndSelect('article.categoryRelation', 'category');

            // Filter by status
            if (status === 'published') {
                query = query.where('article.isPublished = :isPublished', { isPublished: true });
            } else if (status === 'draft') {
                query = query.where('article.isDraft = :isDraft', { isDraft: true });
            }

            // Filter by category
            if (category && category !== 'all') {
                query = query.andWhere('category.slug = :categorySlug', { categorySlug: category });
            }

            // Search functionality
            if (search) {
                query = query.andWhere(
                    '(LOWER(article.title) LIKE LOWER(:search) OR LOWER(article.excerpt) LIKE LOWER(:search))',
                    { search: `%${search}%` }
                );
            }

            query = query.orderBy('article.createdAt', 'DESC')
                .skip(Number(offset))
                .take(Number(limit));

            const [articles, total] = await query.getManyAndCount();

            return res.json({
                data: articles,
                total,
                limit: Number(limit),
                offset: Number(offset)
            });
        } catch (error) {
            console.error('Get admin articles error:', error);
            return res.status(500).json({ message: 'Terjadi kesalahan saat mengambil artikel' });
        }
    }

    // Create article (admin only)
    static async create(req: AuthRequest, res: Response) {
        try {
            if (req.user.role !== 'ADMIN') {
                return res.status(403).json({ message: 'Unauthorized' });
            }

            const { title, authorName, excerpt, content, coverImage, categoryId, tags, isPublished, isDraft } = req.body;

            // Generate slug from title
            const slug = slugify(title, { lower: true, strict: true });

            // Check if slug already exists
            const existingArticle = await articleRepository.findOne({ where: { slug } });
            if (existingArticle) {
                return res.status(400).json({ message: 'Artikel dengan judul serupa sudah ada' });
            }

            // Calculate read time (rough estimate: 200 words per minute)
            const wordCount = content.split(/\s+/).length;
            const readTime = `${Math.ceil(wordCount / 200)} min read`;

            const article = new Article();
            article.title = title;
            article.slug = slug;
            article.excerpt = excerpt;
            article.content = content;
            article.coverImage = coverImage;
            article.categoryId = categoryId;
            article.authorId = req.user.id;
            article.authorName = authorName || req.user.name; // Use provided name or fallback to user's name
            article.tags = tags || [];
            article.readTime = readTime;
            article.isPublished = isPublished || false;
            article.isDraft = isDraft !== undefined ? isDraft : true;
            
            if (isPublished) {
                article.publishedAt = new Date();
            }

            await articleRepository.save(article);

            return res.status(201).json({
                message: 'Artikel berhasil dibuat',
                article
            });
        } catch (error) {
            console.error('Create article error:', error);
            return res.status(500).json({ message: 'Terjadi kesalahan saat membuat artikel' });
        }
    }

    // Update article (admin only)
    static async update(req: AuthRequest, res: Response) {
        try {
            if (req.user.role !== 'ADMIN') {
                return res.status(403).json({ message: 'Unauthorized' });
            }

            const { id } = req.params;
            const { title, authorName, excerpt, content, coverImage, categoryId, tags, isPublished, isDraft } = req.body;

            const article = await articleRepository.findOne({ where: { id } });
            if (!article) {
                return res.status(404).json({ message: 'Artikel tidak ditemukan' });
            }

            // Update slug if title changed
            if (title && title !== article.title) {
                const newSlug = slugify(title, { lower: true, strict: true });
                const existingArticle = await articleRepository.findOne({ 
                    where: { slug: newSlug } 
                });
                if (existingArticle && existingArticle.id !== id) {
                    return res.status(400).json({ message: 'Artikel dengan judul serupa sudah ada' });
                }
                article.slug = newSlug;
                article.title = title;
            }

            if (authorName !== undefined) article.authorName = authorName;
            if (excerpt !== undefined) article.excerpt = excerpt;
            if (content !== undefined) {
                article.content = content;
                // Recalculate read time
                const wordCount = content.split(/\s+/).length;
                article.readTime = `${Math.ceil(wordCount / 200)} min read`;
            }
            if (coverImage !== undefined) article.coverImage = coverImage;
            if (categoryId !== undefined) article.categoryId = categoryId;
            if (tags !== undefined) article.tags = tags;
            if (isDraft !== undefined) article.isDraft = isDraft;
            
            // Handle publish/unpublish
            if (isPublished !== undefined) {
                article.isPublished = isPublished;
                if (isPublished && !article.publishedAt) {
                    article.publishedAt = new Date();
                }
            }

            await articleRepository.save(article);

            return res.json({
                message: 'Artikel berhasil diupdate',
                article
            });
        } catch (error) {
            console.error('Update article error:', error);
            return res.status(500).json({ message: 'Terjadi kesalahan saat mengupdate artikel' });
        }
    }

    // Delete article (admin only)
    static async delete(req: AuthRequest, res: Response) {
        try {
            if (req.user.role !== 'ADMIN') {
                return res.status(403).json({ message: 'Unauthorized' });
            }

            const { id } = req.params;

            const article = await articleRepository.findOne({ where: { id } });
            if (!article) {
                return res.status(404).json({ message: 'Artikel tidak ditemukan' });
            }

            await articleRepository.remove(article);

            return res.json({ message: 'Artikel berhasil dihapus' });
        } catch (error) {
            console.error('Delete article error:', error);
            return res.status(500).json({ message: 'Terjadi kesalahan saat menghapus artikel' });
        }
    }

    // Get all categories
    static async getCategories(req: Request, res: Response) {
        try {
            const categories = await categoryRepository.find({
                order: { name: 'ASC' }
            });

            return res.json(categories);
        } catch (error) {
            console.error('Get categories error:', error);
            return res.status(500).json({ message: 'Terjadi kesalahan saat mengambil kategori' });
        }
    }

    // Create category (admin only)
    static async createCategory(req: AuthRequest, res: Response) {
        try {
            if (req.user.role !== 'ADMIN') {
                return res.status(403).json({ message: 'Unauthorized' });
            }

            const { name, description } = req.body;

            const slug = slugify(name, { lower: true, strict: true });

            // Check if category exists
            const existingCategory = await categoryRepository.findOne({ where: { slug } });
            if (existingCategory) {
                return res.status(400).json({ message: 'Kategori sudah ada' });
            }

            const category = new ArticleCategory();
            category.name = name;
            category.slug = slug;
            category.description = description;

            await categoryRepository.save(category);

            return res.status(201).json({
                message: 'Kategori berhasil dibuat',
                category
            });
        } catch (error) {
            console.error('Create category error:', error);
            return res.status(500).json({ message: 'Terjadi kesalahan saat membuat kategori' });
        }
    }

    // Update category (admin only)
    static async updateCategory(req: AuthRequest, res: Response) {
        try {
            if (req.user.role !== 'ADMIN') {
                return res.status(403).json({ message: 'Unauthorized' });
            }

            const { id } = req.params;
            const { name, description } = req.body;

            const category = await categoryRepository.findOne({ where: { id } });
            if (!category) {
                return res.status(404).json({ message: 'Kategori tidak ditemukan' });
            }

            if (name) {
                const newSlug = slugify(name, { lower: true, strict: true });
                const existingCategory = await categoryRepository.findOne({ where: { slug: newSlug } });
                if (existingCategory && existingCategory.id !== id) {
                    return res.status(400).json({ message: 'Kategori dengan nama serupa sudah ada' });
                }
                category.name = name;
                category.slug = newSlug;
            }

            if (description !== undefined) category.description = description;

            await categoryRepository.save(category);

            return res.json({
                message: 'Kategori berhasil diupdate',
                category
            });
        } catch (error) {
            console.error('Update category error:', error);
            return res.status(500).json({ message: 'Terjadi kesalahan saat mengupdate kategori' });
        }
    }

    // Delete category (admin only)
    static async deleteCategory(req: AuthRequest, res: Response) {
        try {
            if (req.user.role !== 'ADMIN') {
                return res.status(403).json({ message: 'Unauthorized' });
            }

            const { id } = req.params;

            const category = await categoryRepository.findOne({ where: { id } });
            if (!category) {
                return res.status(404).json({ message: 'Kategori tidak ditemukan' });
            }

            // Check if category has articles
            const articlesCount = await articleRepository.count({ where: { categoryId: id } });
            if (articlesCount > 0) {
                return res.status(400).json({ 
                    message: 'Tidak dapat menghapus kategori yang masih memiliki artikel' 
                });
            }

            await categoryRepository.remove(category);

            return res.json({ message: 'Kategori berhasil dihapus' });
        } catch (error) {
            console.error('Delete category error:', error);
            return res.status(500).json({ message: 'Terjadi kesalahan saat menghapus kategori' });
        }
    }
}
