import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany } from "typeorm";
import { Participant } from "./Participant";


export enum UserRole {
    USER = "USER",
    ADMIN = "ADMIN"
}

@Entity()
export class User {
    @PrimaryGeneratedColumn("uuid")
    id: string;

    @Column({ unique: true })
    email: string;

    @Column()
    password: string;

    @Column()
    name: string;

    @Column()
    phone: string;

    @Column()
    address: string;

    @Column()
    education: string;

    @Column({ default: false })
    isVerified: boolean;

    @Column({ type: 'varchar', nullable: true })
    verificationToken: string | null;

    @Column({ type: 'timestamp', nullable: true })
    tokenExpiry: Date | null;

    @Column({ type: 'varchar', nullable: true })
    resetToken: string | null;

    @Column({ type: 'timestamp', nullable: true })
    resetTokenExpiry: Date | null;

    @Column({
        type: "enum",
        enum: UserRole,
        default: UserRole.USER
    })
    role: UserRole;

    @Column({ default: true })
    isActive: boolean;

    @Column({ nullable: true })
    lastLoginAt: Date;

    @Column({ type: "text", nullable: true })
    preferences: string; // JSON string for user preferences

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;

    @OneToMany(() => Participant, participant => participant.user)
    participants: Participant[];


}
