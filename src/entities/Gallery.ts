import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from "typeorm";

@Entity()
export class Gallery {
    @PrimaryGeneratedColumn("uuid")
    id: string;

    @Column()
    title: string;

    @Column("text")
    description: string;

    @Column()
    date: Date;

    @Column()
    location: string;

    @Column("text")
    image: string;

    @Column({ type: 'int', default: 0 })
    participants: number;

    @Column({ nullable: true })
    category: string; // References KategoriKegiatan

    @Column()
    createdBy: string;

    @Column({ default: false })
    isPublished: boolean;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}
