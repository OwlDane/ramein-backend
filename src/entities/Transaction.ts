import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from "typeorm";
import { User } from "./User";
import { Event } from "./Event";
import { Participant } from "./Participant";

export enum PaymentStatus {
    PENDING = "pending",
    PAID = "paid",
    FAILED = "failed",
    EXPIRED = "expired",
    CANCELLED = "cancelled",
    REFUNDED = "refunded"
}

export enum PaymentMethod {
    CREDIT_CARD = "credit_card",
    BANK_TRANSFER = "bank_transfer",
    GOPAY = "gopay",
    SHOPEEPAY = "shopeepay",
    QRIS = "qris",
    OVO = "ovo",
    DANA = "dana",
    BCA_VA = "bca_va",
    BNI_VA = "bni_va",
    BRI_VA = "bri_va",
    MANDIRI_VA = "mandiri_va",
    PERMATA_VA = "permata_va",
    CIMB_VA = "cimb_va",
    FREE = "free"
}

@Entity()
export class Transaction {
    @PrimaryGeneratedColumn("uuid")
    id: string;

    @Column()
    userId: string;

    @Column()
    eventId: string;

    @Column({ nullable: true })
    participantId: string;

    @Column({ unique: true })
    orderId: string;

    @Column({ nullable: true })
    transactionId: string; // Xendit invoice ID

    @Column('decimal', { precision: 10, scale: 2 })
    amount: number;

    @Column('decimal', { precision: 10, scale: 2, default: 0 })
    adminFee: number;

    @Column('decimal', { precision: 10, scale: 2 })
    totalAmount: number;

    @Column({
        type: "enum",
        enum: PaymentStatus,
        default: PaymentStatus.PENDING
    })
    paymentStatus: PaymentStatus;

    @Column({
        type: "enum",
        enum: PaymentMethod,
        nullable: true
    })
    paymentMethod: PaymentMethod;

    @Column({ nullable: true })
    paymentType: string; // Payment type from Xendit

    @Column({ nullable: true })
    vaNumber: string; // Virtual Account Number

    @Column({ nullable: true })
    bankName: string; // Bank name for VA

    @Column("text", { nullable: true })
    snapToken: string; // Xendit Invoice ID

    @Column("text", { nullable: true })
    snapUrl: string; // Xendit invoice URL

    @Column({ nullable: true })
    paidAt: Date;

    @Column({ nullable: true })
    expiredAt: Date;

    @Column("jsonb", { nullable: true })
    midtransResponse: any; // Store full Xendit response

    @Column("text", { nullable: true })
    failureReason: string;

    @Column("text", { nullable: true })
    notes: string;

    @Column({ default: false })
    isRefunded: boolean;

    @Column({ nullable: true })
    refundedAt: Date;

    @Column("text", { nullable: true })
    refundReason: string;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;

    // Relations
    @ManyToOne(() => User, { nullable: false })
    @JoinColumn({ name: "userId" })
    user: User;

    @ManyToOne(() => Event, { nullable: false })
    @JoinColumn({ name: "eventId" })
    event: Event;

    @ManyToOne(() => Participant, { nullable: true })
    @JoinColumn({ name: "participantId" })
    participant: Participant;
}
