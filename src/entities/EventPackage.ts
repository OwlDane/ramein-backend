import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn, OneToMany } from "typeorm";
import { Event } from "./Event";
import { Participant } from "./Participant";

export enum PackageType {
    BASIC = "BASIC",
    PREMIUM = "PREMIUM",
    VIP = "VIP",
    CUSTOM = "CUSTOM"
}

@Entity()
export class EventPackage {
    @PrimaryGeneratedColumn("uuid")
    id: string;

    @Column()
    eventId: string;

    @Column()
    name: string;

    @Column({
        type: "enum",
        enum: PackageType,
        default: PackageType.BASIC
    })
    type: PackageType;

    @Column("decimal", { precision: 10, scale: 2 })
    price: number;

    @Column("decimal", { precision: 10, scale: 2, default: 0 })
    originalPrice: number; // For discount calculations

    @Column("text")
    description: string;

    @Column({ default: -1 }) // -1 means unlimited
    maxParticipants: number;

    @Column({ default: 0 })
    currentParticipants: number;

    @Column({ default: true })
    isActive: boolean;

    @Column({ default: false })
    isPopular: boolean; // For highlighting popular packages

    @Column("simple-array", { nullable: true })
    features: string[]; // Array of features included

    @Column({ nullable: true })
    validFrom: Date; // When package becomes available

    @Column({ nullable: true })
    validUntil: Date; // When package expires

    @Column({ default: 0 })
    sortOrder: number; // For display ordering

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;

    // Relations
    @ManyToOne(() => Event, event => event.packages)
    @JoinColumn({ name: "eventId" })
    event: Event;

    @OneToMany(() => Participant, participant => participant.package)
    participants: Participant[];
}
