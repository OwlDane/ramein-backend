import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from "typeorm";
import { Participant } from "./Participant";
import { Event } from "./Event";

@Entity()
export class Certificate {
    @PrimaryGeneratedColumn("uuid")
    id: string;

    @Column()
    participantId: string;

    @Column()
    eventId: string;

    @Column({ unique: true })
    certificateNumber: string;

    @Column({ type: 'text' })
    certificateUrl: string;

    @Column({ type: 'jsonb', nullable: true })
    metadata: Record<string, any>;

    @Column({ default: false })
    isVerified: boolean;

    @Column({ nullable: true })
    verifiedAt: Date;

    @Column({ nullable: true })
    verifiedBy: string;

    @Column({ nullable: true })
    verificationCode: string;

    @Column({ nullable: true })
    issuedAt: Date;

    @Column({ nullable: true })
    issuedBy: string;

    @Column({ nullable: true })
    revokedAt: Date;

    @Column({ nullable: true })
    revokedBy: string;

    @Column({ type: 'text', nullable: true })
    revocationReason: string;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;

    // Relations
    @ManyToOne(() => Participant, participant => participant.user)
    @JoinColumn({ name: 'participantId' })
    participant: Participant;

    @ManyToOne(() => Event, event => event.participants)
    @JoinColumn({ name: 'eventId' })
    event: Event;
}
