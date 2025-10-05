import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from "typeorm";
import { User } from "./User";
import { Event } from "./Event";

@Entity()
export class Participant {
    @PrimaryGeneratedColumn("uuid")
    id: string;

    @Column()
    userId: string;

    @Column()
    eventId: string;

    @Column({ unique: true })
    tokenNumber: string;

    @Column({ default: false })
    hasAttended: boolean;

    @Column({ nullable: true })
    attendedAt: Date;

    @Column({ nullable: true })
    certificateUrl: string;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;

    // Relations
    @ManyToOne(() => User, user => user.participants)
    @JoinColumn({ name: "userId" })
    user: User;

    @ManyToOne(() => Event, event => event.participants)
    @JoinColumn({ name: "eventId" })
    event: Event;
}
