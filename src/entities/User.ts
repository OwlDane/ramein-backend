import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany } from "typeorm";
import { Participant } from "./Participant";

export enum UserRole {
    USER = "USER",
    ADMIN = "ADMIN"
}

@Entity("user")
export class User {
    @PrimaryGeneratedColumn("uuid")
    id: string;

    @Column({ unique: true })
    email: string;

    @Column({ nullable: true })
    password: string;

    @Column()
    name: string;

    @Column()
    phone: string;

    @Column()
    address: string;

    @Column()
    education: string;

    @Column({ name: "isVerified", default: false })
    isVerified: boolean;

    @Column({ name: "isEmailVerified", default: false })
    isEmailVerified: boolean;

    @Column({ name: "isOtpVerified", default: false })
    isOtpVerified: boolean;

    @Column({ name: "verificationToken", type: 'varchar', nullable: true })
    verificationToken: string | null;

    @Column({ name: "tokenExpiry", type: 'timestamp', nullable: true })
    tokenExpiry: Date | null;

    @Column({ name: "resetToken", type: 'varchar', nullable: true })
    resetToken: string | null;

    @Column({ name: "resetTokenExpiry", type: 'timestamp', nullable: true })
    resetTokenExpiry: Date | null;

    @Column({ name: "otp", type: 'varchar', nullable: true })
    otp: string | null;

    @Column({ name: "otpCreatedAt", type: 'timestamp', nullable: true })
    otpCreatedAt: Date | null;

    @Column({ type: "varchar", nullable: true, unique: true })
    googleId: string | null;

    @Column({ type: "varchar", nullable: true })
    profilePicture: string | null;

    @Column({
        type: "enum",
        enum: UserRole,
        default: UserRole.USER
    })
    role: UserRole;

    @CreateDateColumn({ name: "createdAt" })
    createdAt: Date;

    @UpdateDateColumn({ name: "updatedAt" })
    updatedAt: Date;

    @OneToMany(() => Participant, participant => participant.user)
    participants: Participant[];
}
