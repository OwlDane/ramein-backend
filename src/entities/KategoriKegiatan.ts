import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from "typeorm";

@Entity("kategori_kegiatan")
export class KategoriKegiatan {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    nama_kategori: string;

    @Column({ unique: true })
    slug: string;

    @Column({ nullable: true })
    kategori_logo: string;

    @CreateDateColumn({ name: 'created_at' })
    createdAt: Date;

    @UpdateDateColumn({ name: 'updated_at' })
    updatedAt: Date;
}
