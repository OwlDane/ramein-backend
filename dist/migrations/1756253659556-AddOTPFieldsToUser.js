"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AddOTPFieldsToUser1756253659556 = void 0;
class AddOTPFieldsToUser1756253659556 {
    async up(queryRunner) {
        await queryRunner.query(`
            ALTER TABLE "user"
            ADD COLUMN IF NOT EXISTS "otp" varchar,
            ADD COLUMN IF NOT EXISTS "otp_created_at" timestamp,
            ADD COLUMN IF NOT EXISTS "is_otp_verified" boolean DEFAULT false;
        `);
        await queryRunner.query(`
            UPDATE "user" SET "is_otp_verified" = COALESCE("is_otp_verified", false);
        `);
    }
    async down(queryRunner) {
        await queryRunner.query(`
            ALTER TABLE "user"
            DROP COLUMN IF EXISTS "is_otp_verified",
            DROP COLUMN IF EXISTS "otp_created_at",
            DROP COLUMN IF EXISTS "otp";
        `);
    }
}
exports.AddOTPFieldsToUser1756253659556 = AddOTPFieldsToUser1756253659556;
//# sourceMappingURL=1756253659556-AddOTPFieldsToUser.js.map