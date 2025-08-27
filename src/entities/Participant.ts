import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn, OneToMany } from "typeorm";
import { User } from "./User";
import { Event } from "./Event";
import { EventPackage } from "./EventPackage";
import { Certificate } from "./Certificate";


@Entity()
export class Participant {
    @PrimaryGeneratedColumn("uuid")
    id: string;

    @Column()
    userId: string;

    @Column()
    eventId: string;

    @Column({ nullable: true })
    packageId: string; // Which package they selected

    @Column({ unique: true })
    tokenNumber: string;

    @Column({ default: false })
    hasAttended: boolean;

    @Column({ nullable: true })
    attendedAt: Date;

    @Column({ nullable: true })
    name: string;

    @Column({ nullable: true })
    email: string;

    @Column({ nullable: true })
    phone: string;

    @Column({ nullable: true })
    registrationSource: string;

    @Column({ type: 'jsonb', nullable: true })
    additionalInfo: Record<string, any>;

    @Column({ nullable: true })
    certificateUrl: string;

    @Column({ type: "text", nullable: true })
    notes: string; // Additional notes

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;

    // Relations
    @OneToMany(() => Certificate, certificate => certificate.participant)
    certificates: Certificate[];

    @ManyToOne(() => User, user => user.participants)
    @JoinColumn({ name: "userId" })
    user: User;

    @ManyToOne(() => Event, event => event.participants)
    @JoinColumn({ name: "eventId" })
    event: Event;

    @ManyToOne(() => EventPackage, eventPackage => eventPackage.participants)
    @JoinColumn({ name: "packageId" })
    package: EventPackage;


}
