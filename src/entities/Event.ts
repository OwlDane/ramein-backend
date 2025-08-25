import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany } from "typeorm";
import { Participant } from "./Participant";
import { EventPackage } from "./EventPackage";


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

    @Column()
    createdBy: string;

    @Column({ default: false })
    isPublished: boolean;



    @Column({ default: 0 })
    maxParticipants: number; // 0 means unlimited

    @Column({ default: 0 })
    currentParticipants: number;

    @Column({ default: true })
    allowRegistration: boolean; // Whether registration is still open

    @Column({ nullable: true })
    registrationDeadline: Date; // When registration closes

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;

    @OneToMany(() => Participant, participant => participant.event)
    participants: Participant[];

    @OneToMany(() => EventPackage, eventPackage => eventPackage.event)
    packages: EventPackage[];


}
