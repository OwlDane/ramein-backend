"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Article = void 0;
const typeorm_1 = require("typeorm");
const User_1 = require("./User");
const ArticleCategory_1 = require("./ArticleCategory");
let Article = class Article {
};
exports.Article = Article;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)("uuid"),
    __metadata("design:type", String)
], Article.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], Article.prototype, "title", void 0);
__decorate([
    (0, typeorm_1.Column)({ unique: true }),
    __metadata("design:type", String)
], Article.prototype, "slug", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "text", nullable: true }),
    __metadata("design:type", String)
], Article.prototype, "excerpt", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "text" }),
    __metadata("design:type", String)
], Article.prototype, "content", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "text", nullable: true }),
    __metadata("design:type", String)
], Article.prototype, "coverImage", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], Article.prototype, "categoryId", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], Article.prototype, "authorId", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], Article.prototype, "authorName", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "timestamp", nullable: true }),
    __metadata("design:type", Date)
], Article.prototype, "publishedAt", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], Article.prototype, "readTime", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "text", array: true, default: '{}' }),
    __metadata("design:type", Array)
], Article.prototype, "tags", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: false }),
    __metadata("design:type", Boolean)
], Article.prototype, "isPublished", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: false }),
    __metadata("design:type", Boolean)
], Article.prototype, "isDraft", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "integer", default: 0 }),
    __metadata("design:type", Number)
], Article.prototype, "viewCount", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ name: "createdAt" }),
    __metadata("design:type", Date)
], Article.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)({ name: "updatedAt" }),
    __metadata("design:type", Date)
], Article.prototype, "updatedAt", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => User_1.User, { eager: true }),
    (0, typeorm_1.JoinColumn)({ name: "authorId" }),
    __metadata("design:type", User_1.User)
], Article.prototype, "author", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => ArticleCategory_1.ArticleCategory, category => category.articles, { eager: true }),
    (0, typeorm_1.JoinColumn)({ name: "categoryId" }),
    __metadata("design:type", ArticleCategory_1.ArticleCategory)
], Article.prototype, "categoryRelation", void 0);
exports.Article = Article = __decorate([
    (0, typeorm_1.Entity)("article")
], Article);
//# sourceMappingURL=Article.js.map