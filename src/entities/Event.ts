import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany } from "typeorm";
import { Participant } from "./Participant";

@Entity()
export class Event {
    @PrimaryGeneratedColumn("uuid")
    id: string;

    @Column()
    title: string;

    @Column()
    date: Date;

    @Column()
    time: string;

    @Column()
    location: string;

    @Column("text")
    flyer: string;

    @Column("text", { nullable: true })
    certificate: string;

    @Column("text")
    description: string;

    @Column({ nullable: true })
    category: string;

    @Column('decimal', { precision: 10, scale: 2, default: 0 })
    price: number;

    @Column()
    createdBy: string;

    @Column({ default: false })
    isPublished: boolean;

    // New fields - Priority 1
    @Column({ type: 'int', nullable: true })
    maxParticipants: number | null;

    @Column({ type: 'timestamp', nullable: true })
    registrationDeadline: Date | null;

    @Column({ type: 'varchar', default: 'offline' })
    eventType: string; // 'online' | 'offline' | 'hybrid'

    // Contact Person
    @Column({ type: 'varchar', nullable: true })
    contactPersonName: string | null;

    @Column({ type: 'varchar', nullable: true })
    contactPersonPhone: string | null;

    @Column({ type: 'varchar', nullable: true })
    contactPersonEmail: string | null;

    // Meeting Link (for online events)
    @Column({ type: 'text', nullable: true })
    meetingLink: string | null;

    // Additional Information
    @Column({ type: 'text', nullable: true })
    requirements: string | null;

    @Column({ type: 'text', nullable: true })
    benefits: string | null;

    // Featured & Tags (Priority 2)
    @Column({ default: false })
    isFeatured: boolean;

    @Column({ type: 'simple-array', nullable: true })
    tags: string[];

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;

    @OneToMany(() => Participant, participant => participant.event)
    participants: Participant[];
}
