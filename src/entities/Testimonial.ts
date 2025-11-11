import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from "typeorm";

@Entity("testimonial")
export class Testimonial {
    @PrimaryGeneratedColumn("uuid")
    id: string;

    @Column()
    name: string;

    @Column()
    role: string;

    @Column()
    company: string;

    @Column({ type: "text" })
    content: string;

    @Column({ type: "text", nullable: true })
    avatar: string | null;

    @Column({ type: "integer", default: 5 })
    rating: number;

    @Column({ default: true })
    isActive: boolean;

    @Column({ type: "integer", default: 0 })
    sortOrder: number;

    @CreateDateColumn({ name: "createdAt" })
    createdAt: Date;

    @UpdateDateColumn({ name: "updatedAt" })
    updatedAt: Date;
}
