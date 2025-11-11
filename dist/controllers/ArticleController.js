"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ArticleController = void 0;
const database_1 = __importDefault(require("../config/database"));
const Article_1 = require("../entities/Article");
const ArticleCategory_1 = require("../entities/ArticleCategory");
const slugify_1 = __importDefault(require("slugify"));
const articleRepository = database_1.default.getRepository(Article_1.Article);
const categoryRepository = database_1.default.getRepository(ArticleCategory_1.ArticleCategory);
class ArticleController {
    static async getAll(req, res) {
        try {
            const { category, search, limit = 20, offset = 0 } = req.query;
            let query = articleRepository.createQueryBuilder('article')
                .leftJoinAndSelect('article.author', 'author')
                .leftJoinAndSelect('article.categoryRelation', 'category')
                .where('article.isPublished = :isPublished', { isPublished: true });
            if (category && category !== 'all') {
                query = query.andWhere('category.slug = :categorySlug', { categorySlug: category });
            }
            if (search) {
                query = query.andWhere('(LOWER(article.title) LIKE LOWER(:search) OR LOWER(article.excerpt) LIKE LOWER(:search))', { search: `%${search}%` });
            }
            query = query.orderBy('article.publishedAt', 'DESC')
                .skip(Number(offset))
                .take(Number(limit));
            const [articles, total] = await query.getManyAndCount();
            const transformedArticles = articles.map(article => {
                var _a;
                return ({
                    id: article.id,
                    title: article.title,
                    slug: article.slug,
                    excerpt: article.excerpt,
                    content: article.content,
                    coverImage: article.coverImage,
                    category: ((_a = article.categoryRelation) === null || _a === void 0 ? void 0 : _a.name) || 'Uncategorized',
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
                });
            });
            return res.json({
                data: transformedArticles,
                total,
                limit: Number(limit),
                offset: Number(offset)
            });
        }
        catch (error) {
            console.error('Get articles error:', error);
            return res.status(500).json({ message: 'Terjadi kesalahan saat mengambil artikel' });
        }
    }
    static async getBySlug(req, res) {
        var _a;
        try {
            const { slug } = req.params;
            const article = await articleRepository.findOne({
                where: { slug, isPublished: true },
                relations: ['author', 'categoryRelation']
            });
            if (!article) {
                return res.status(404).json({ message: 'Artikel tidak ditemukan' });
            }
            article.viewCount += 1;
            await articleRepository.save(article);
            const transformedArticle = {
                id: article.id,
                title: article.title,
                slug: article.slug,
                excerpt: article.excerpt,
                content: article.content,
                coverImage: article.coverImage,
                category: ((_a = article.categoryRelation) === null || _a === void 0 ? void 0 : _a.name) || 'Uncategorized',
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
        }
        catch (error) {
            console.error('Get article error:', error);
            return res.status(500).json({ message: 'Terjadi kesalahan saat mengambil artikel' });
        }
    }
    static async getAllAdmin(req, res) {
        try {
            if (req.user.role !== 'ADMIN') {
                return res.status(403).json({ message: 'Unauthorized' });
            }
            const { status, category, search, limit = 20, offset = 0 } = req.query;
            let query = articleRepository.createQueryBuilder('article')
                .leftJoinAndSelect('article.author', 'author')
                .leftJoinAndSelect('article.categoryRelation', 'category');
            if (status === 'published') {
                query = query.where('article.isPublished = :isPublished', { isPublished: true });
            }
            else if (status === 'draft') {
                query = query.where('article.isDraft = :isDraft', { isDraft: true });
            }
            if (category && category !== 'all') {
                query = query.andWhere('category.slug = :categorySlug', { categorySlug: category });
            }
            if (search) {
                query = query.andWhere('(LOWER(article.title) LIKE LOWER(:search) OR LOWER(article.excerpt) LIKE LOWER(:search))', { search: `%${search}%` });
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
        }
        catch (error) {
            console.error('Get admin articles error:', error);
            return res.status(500).json({ message: 'Terjadi kesalahan saat mengambil artikel' });
        }
    }
    static async create(req, res) {
        try {
            if (req.user.role !== 'ADMIN') {
                return res.status(403).json({ message: 'Unauthorized' });
            }
            const { title, authorName, excerpt, content, coverImage, categoryId, tags, isPublished, isDraft } = req.body;
            const slug = (0, slugify_1.default)(title, { lower: true, strict: true });
            const existingArticle = await articleRepository.findOne({ where: { slug } });
            if (existingArticle) {
                return res.status(400).json({ message: 'Artikel dengan judul serupa sudah ada' });
            }
            const wordCount = content.split(/\s+/).length;
            const readTime = `${Math.ceil(wordCount / 200)} min read`;
            const article = new Article_1.Article();
            article.title = title;
            article.slug = slug;
            article.excerpt = excerpt;
            article.content = content;
            article.coverImage = coverImage;
            article.categoryId = categoryId;
            article.authorId = req.user.id;
            article.authorName = authorName || req.user.name;
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
        }
        catch (error) {
            console.error('Create article error:', error);
            return res.status(500).json({ message: 'Terjadi kesalahan saat membuat artikel' });
        }
    }
    static async update(req, res) {
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
            if (title && title !== article.title) {
                const newSlug = (0, slugify_1.default)(title, { lower: true, strict: true });
                const existingArticle = await articleRepository.findOne({
                    where: { slug: newSlug }
                });
                if (existingArticle && existingArticle.id !== id) {
                    return res.status(400).json({ message: 'Artikel dengan judul serupa sudah ada' });
                }
                article.slug = newSlug;
                article.title = title;
            }
            if (authorName !== undefined)
                article.authorName = authorName;
            if (excerpt !== undefined)
                article.excerpt = excerpt;
            if (content !== undefined) {
                article.content = content;
                const wordCount = content.split(/\s+/).length;
                article.readTime = `${Math.ceil(wordCount / 200)} min read`;
            }
            if (coverImage !== undefined)
                article.coverImage = coverImage;
            if (categoryId !== undefined)
                article.categoryId = categoryId;
            if (tags !== undefined)
                article.tags = tags;
            if (isDraft !== undefined)
                article.isDraft = isDraft;
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
        }
        catch (error) {
            console.error('Update article error:', error);
            return res.status(500).json({ message: 'Terjadi kesalahan saat mengupdate artikel' });
        }
    }
    static async delete(req, res) {
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
        }
        catch (error) {
            console.error('Delete article error:', error);
            return res.status(500).json({ message: 'Terjadi kesalahan saat menghapus artikel' });
        }
    }
    static async getCategories(_req, res) {
        try {
            const categories = await categoryRepository.find({
                order: { name: 'ASC' }
            });
            return res.json(categories);
        }
        catch (error) {
            console.error('Get categories error:', error);
            return res.status(500).json({ message: 'Terjadi kesalahan saat mengambil kategori' });
        }
    }
    static async createCategory(req, res) {
        try {
            if (req.user.role !== 'ADMIN') {
                return res.status(403).json({ message: 'Unauthorized' });
            }
            const { name, description } = req.body;
            const slug = (0, slugify_1.default)(name, { lower: true, strict: true });
            const existingCategory = await categoryRepository.findOne({ where: { slug } });
            if (existingCategory) {
                return res.status(400).json({ message: 'Kategori sudah ada' });
            }
            const category = new ArticleCategory_1.ArticleCategory();
            category.name = name;
            category.slug = slug;
            category.description = description;
            await categoryRepository.save(category);
            return res.status(201).json({
                message: 'Kategori berhasil dibuat',
                category
            });
        }
        catch (error) {
            console.error('Create category error:', error);
            return res.status(500).json({ message: 'Terjadi kesalahan saat membuat kategori' });
        }
    }
    static async updateCategory(req, res) {
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
                const newSlug = (0, slugify_1.default)(name, { lower: true, strict: true });
                const existingCategory = await categoryRepository.findOne({ where: { slug: newSlug } });
                if (existingCategory && existingCategory.id !== id) {
                    return res.status(400).json({ message: 'Kategori dengan nama serupa sudah ada' });
                }
                category.name = name;
                category.slug = newSlug;
            }
            if (description !== undefined)
                category.description = description;
            await categoryRepository.save(category);
            return res.json({
                message: 'Kategori berhasil diupdate',
                category
            });
        }
        catch (error) {
            console.error('Update category error:', error);
            return res.status(500).json({ message: 'Terjadi kesalahan saat mengupdate kategori' });
        }
    }
    static async deleteCategory(req, res) {
        try {
            if (req.user.role !== 'ADMIN') {
                return res.status(403).json({ message: 'Unauthorized' });
            }
            const { id } = req.params;
            const category = await categoryRepository.findOne({ where: { id } });
            if (!category) {
                return res.status(404).json({ message: 'Kategori tidak ditemukan' });
            }
            const articlesCount = await articleRepository.count({ where: { categoryId: id } });
            if (articlesCount > 0) {
                return res.status(400).json({
                    message: 'Tidak dapat menghapus kategori yang masih memiliki artikel'
                });
            }
            await categoryRepository.remove(category);
            return res.json({ message: 'Kategori berhasil dihapus' });
        }
        catch (error) {
            console.error('Delete category error:', error);
            return res.status(500).json({ message: 'Terjadi kesalahan saat menghapus kategori' });
        }
    }
}
exports.ArticleController = ArticleController;
//# sourceMappingURL=ArticleController.js.map