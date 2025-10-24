import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from "typeorm";
import { User } from "./User";
import { ArticleCategory } from "./ArticleCategory";

@Entity("article")
export class Article {
    @PrimaryGeneratedColumn("uuid")
    id: string;

    @Column()
    title: string;

    @Column({ unique: true })
    slug: string;

    @Column({ type: "text", nullable: true })
    excerpt: string | null;

    @Column({ type: "text" })
    content: string;

    @Column({ type: "text", nullable: true })
    coverImage: string | null;

    @Column({ nullable: true })
    categoryId: string | null;

    @Column()
    authorId: string;

    @Column({ nullable: true })
    authorName: string | null;

    @Column({ type: "timestamp", nullable: true })
    publishedAt: Date | null;

    @Column({ nullable: true })
    readTime: string | null;

    @Column({ type: "text", array: true, default: '{}' })
    tags: string[];

    @Column({ default: false })
    isPublished: boolean;

    @Column({ default: false })
    isDraft: boolean;

    @Column({ type: "integer", default: 0 })
    viewCount: number;

    @CreateDateColumn({ name: "createdAt" })
    createdAt: Date;

    @UpdateDateColumn({ name: "updatedAt" })
    updatedAt: Date;

    // Relations
    @ManyToOne(() => User, { eager: true })
    @JoinColumn({ name: "authorId" })
    author: User;

    @ManyToOne(() => ArticleCategory, category => category.articles, { eager: true })
    @JoinColumn({ name: "categoryId" })
    categoryRelation: ArticleCategory | null;
}
