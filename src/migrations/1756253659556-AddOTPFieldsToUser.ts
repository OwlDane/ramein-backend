import { MigrationInterface, QueryRunner } from "typeorm";

export class AddOTPFieldsToUser1756253659556 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "user"
            ADD COLUMN IF NOT EXISTS "otp" varchar,
            ADD COLUMN IF NOT EXISTS "otp_created_at" timestamp,
            ADD COLUMN IF NOT EXISTS "is_otp_verified" boolean DEFAULT false;
        `);
        
        // Ensure default not null behavior if needed
        await queryRunner.query(`
            UPDATE "user" SET "is_otp_verified" = COALESCE("is_otp_verified", false);
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "user"
            DROP COLUMN IF EXISTS "is_otp_verified",
            DROP COLUMN IF EXISTS "otp_created_at",
            DROP COLUMN IF EXISTS "otp";
        `);
    }

}
