"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CreateTransaction1760960281000 = void 0;
const typeorm_1 = require("typeorm");
class CreateTransaction1760960281000 {
    async up(queryRunner) {
        await queryRunner.query(`
            CREATE TYPE payment_status_enum AS ENUM (
                'pending',
                'paid',
                'failed',
                'expired',
                'cancelled',
                'refunded'
            )
        `);
        await queryRunner.query(`
            CREATE TYPE payment_method_enum AS ENUM (
                'credit_card',
                'bank_transfer',
                'gopay',
                'shopeepay',
                'qris',
                'ovo',
                'dana',
                'bca_va',
                'bni_va',
                'bri_va',
                'mandiri_va',
                'permata_va',
                'cimb_va',
                'free'
            )
        `);
        await queryRunner.createTable(new typeorm_1.Table({
            name: "transaction",
            columns: [
                {
                    name: "id",
                    type: "uuid",
                    isPrimary: true,
                    generationStrategy: "uuid",
                    default: "uuid_generate_v4()"
                },
                {
                    name: "userId",
                    type: "uuid",
                    isNullable: false
                },
                {
                    name: "eventId",
                    type: "uuid",
                    isNullable: false
                },
                {
                    name: "participantId",
                    type: "uuid",
                    isNullable: true
                },
                {
                    name: "orderId",
                    type: "varchar",
                    isUnique: true,
                    isNullable: false
                },
                {
                    name: "transactionId",
                    type: "varchar",
                    isNullable: true
                },
                {
                    name: "amount",
                    type: "decimal",
                    precision: 10,
                    scale: 2,
                    isNullable: false
                },
                {
                    name: "adminFee",
                    type: "decimal",
                    precision: 10,
                    scale: 2,
                    default: 0
                },
                {
                    name: "totalAmount",
                    type: "decimal",
                    precision: 10,
                    scale: 2,
                    isNullable: false
                },
                {
                    name: "paymentStatus",
                    type: "payment_status_enum",
                    default: "'pending'"
                },
                {
                    name: "paymentMethod",
                    type: "payment_method_enum",
                    isNullable: true
                },
                {
                    name: "paymentType",
                    type: "varchar",
                    isNullable: true
                },
                {
                    name: "vaNumber",
                    type: "varchar",
                    isNullable: true
                },
                {
                    name: "bankName",
                    type: "varchar",
                    isNullable: true
                },
                {
                    name: "snapToken",
                    type: "text",
                    isNullable: true
                },
                {
                    name: "snapUrl",
                    type: "text",
                    isNullable: true
                },
                {
                    name: "paidAt",
                    type: "timestamp",
                    isNullable: true
                },
                {
                    name: "expiredAt",
                    type: "timestamp",
                    isNullable: true
                },
                {
                    name: "midtransResponse",
                    type: "jsonb",
                    isNullable: true
                },
                {
                    name: "failureReason",
                    type: "text",
                    isNullable: true
                },
                {
                    name: "notes",
                    type: "text",
                    isNullable: true
                },
                {
                    name: "isRefunded",
                    type: "boolean",
                    default: false
                },
                {
                    name: "refundedAt",
                    type: "timestamp",
                    isNullable: true
                },
                {
                    name: "refundReason",
                    type: "text",
                    isNullable: true
                },
                {
                    name: "createdAt",
                    type: "timestamp",
                    default: "now()"
                },
                {
                    name: "updatedAt",
                    type: "timestamp",
                    default: "now()"
                }
            ]
        }), true);
        await queryRunner.createForeignKey("transaction", new typeorm_1.TableForeignKey({
            columnNames: ["userId"],
            referencedColumnNames: ["id"],
            referencedTableName: "user",
            onDelete: "CASCADE"
        }));
        await queryRunner.createForeignKey("transaction", new typeorm_1.TableForeignKey({
            columnNames: ["eventId"],
            referencedColumnNames: ["id"],
            referencedTableName: "event",
            onDelete: "CASCADE"
        }));
        await queryRunner.createForeignKey("transaction", new typeorm_1.TableForeignKey({
            columnNames: ["participantId"],
            referencedColumnNames: ["id"],
            referencedTableName: "participant",
            onDelete: "SET NULL"
        }));
        await queryRunner.query(`
            CREATE INDEX idx_transaction_user_id ON transaction(userId);
            CREATE INDEX idx_transaction_event_id ON transaction(eventId);
            CREATE INDEX idx_transaction_participant_id ON transaction(participantId);
            CREATE INDEX idx_transaction_order_id ON transaction(orderId);
            CREATE INDEX idx_transaction_transaction_id ON transaction(transactionId);
            CREATE INDEX idx_transaction_payment_status ON transaction(paymentStatus);
            CREATE INDEX idx_transaction_created_at ON transaction(createdAt);
        `);
    }
    async down(queryRunner) {
        await queryRunner.query(`
            DROP INDEX IF EXISTS idx_transaction_created_at;
            DROP INDEX IF EXISTS idx_transaction_payment_status;
            DROP INDEX IF EXISTS idx_transaction_transaction_id;
            DROP INDEX IF EXISTS idx_transaction_order_id;
            DROP INDEX IF EXISTS idx_transaction_participant_id;
            DROP INDEX IF EXISTS idx_transaction_event_id;
            DROP INDEX IF EXISTS idx_transaction_user_id;
        `);
        await queryRunner.dropTable("transaction");
        await queryRunner.query(`DROP TYPE IF EXISTS payment_method_enum`);
        await queryRunner.query(`DROP TYPE IF EXISTS payment_status_enum`);
    }
}
exports.CreateTransaction1760960281000 = CreateTransaction1760960281000;
//# sourceMappingURL=1760960281000-CreateTransaction.js.map