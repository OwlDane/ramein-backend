import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany } from "typeorm";
import { Participant } from "./Participant";
import { Certificate } from "./Certificate";
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

    @Column({ nullable: true })
    category: string;

    @Column('decimal', { precision: 10, scale: 2, default: 0 })
    price: number;

    @Column()
    createdBy: string;

    @Column({ default: false })
    isPublished: boolean;



    

    

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;

    @OneToMany(() => Participant, participant => participant.event)
    participants: Participant[];

    @OneToMany(() => Certificate, certificate => certificate.event)
    certificates: Certificate[];

    @OneToMany(() => EventPackage, eventPackage => eventPackage.event)
    packages: EventPackage[];


}
