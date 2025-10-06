import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from "typeorm";

export interface PlaceholderConfig {
    key: string; // e.g., "nama", "event", "tanggal"
    label: string; // Display label
    x: number; // X position in pixels
    y: number; // Y position in pixels
    fontSize: number;
    fontFamily: string;
    color: string;
    align: 'left' | 'center' | 'right';
    maxWidth?: number;
}

export interface TemplateSettings {
    width: number;
    height: number;
    orientation: 'landscape' | 'portrait';
    backgroundColor?: string;
    fontFamily?: string;
    defaultFontSize?: number;
    defaultColor?: string;
}

@Entity('certificate_template')
export class CertificateTemplate {
    @PrimaryGeneratedColumn("uuid")
    id: string;

    @Column()
    name: string;

    @Column({ type: 'text', nullable: true })
    description: string;

    @Column({ default: 'custom' })
    category: string;

    @Column({ type: 'text' })
    templateUrl: string;

    @Column({ type: 'text', nullable: true })
    thumbnailUrl: string;

    @Column({ default: false })
    isDefault: boolean;

    @Column({ default: true })
    isActive: boolean;

    @Column({ type: 'jsonb', nullable: true })
    placeholders: PlaceholderConfig[];

    @Column({ type: 'jsonb', nullable: true })
    settings: TemplateSettings;

    @Column({ nullable: true })
    createdBy: string;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}
