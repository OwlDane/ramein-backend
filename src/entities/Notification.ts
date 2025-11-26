import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { User } from './User';
import { Event } from './Event';

export enum NotificationType {
    EVENT_UPDATE = 'EVENT_UPDATE',
    EVENT_REMINDER = 'EVENT_REMINDER',
    CERTIFICATE_READY = 'CERTIFICATE_READY',
    PAYMENT_SUCCESS = 'PAYMENT_SUCCESS',
    GENERAL = 'GENERAL'
}

@Entity('notifications')
export class Notification {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    userId: string;

    @ManyToOne(() => User, { nullable: false })
    @JoinColumn({ name: 'userId' })
    user: User;

    @Column({ nullable: true })
    eventId: string;

    @ManyToOne(() => Event, { nullable: true })
    @JoinColumn({ name: 'eventId' })
    event: Event;

    @Column({
        type: 'enum',
        enum: NotificationType,
        default: NotificationType.GENERAL
    })
    type: NotificationType;

    @Column()
    title: string;

    @Column('text')
    message: string;

    @Column({ type: 'jsonb', nullable: true })
    metadata: Record<string, any>;

    @Column({ default: false })
    isRead: boolean;

    @Column({ type: 'timestamp', nullable: true })
    readAt: Date;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}
