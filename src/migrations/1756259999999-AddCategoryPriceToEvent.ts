import { MigrationInterface, QueryRunner } from "typeorm";

export class AddCategoryPriceToEvent1756259999999 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "event"
            ADD COLUMN IF NOT EXISTS "category" varchar,
            ADD COLUMN IF NOT EXISTS "price" numeric(10,2) DEFAULT 0 NOT NULL;
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "event"
            DROP COLUMN IF EXISTS "price",
            DROP COLUMN IF EXISTS "category";
        `);
    }
}


