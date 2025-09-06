"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AddCategoryPriceToEvent1756259999999 = void 0;
class AddCategoryPriceToEvent1756259999999 {
    async up(queryRunner) {
        await queryRunner.query(`
            ALTER TABLE "event"
            ADD COLUMN IF NOT EXISTS "category" varchar,
            ADD COLUMN IF NOT EXISTS "price" numeric(10,2) DEFAULT 0 NOT NULL;
        `);
    }
    async down(queryRunner) {
        await queryRunner.query(`
            ALTER TABLE "event"
            DROP COLUMN IF EXISTS "price",
            DROP COLUMN IF EXISTS "category";
        `);
    }
}
exports.AddCategoryPriceToEvent1756259999999 = AddCategoryPriceToEvent1756259999999;
//# sourceMappingURL=1756259999999-AddCategoryPriceToEvent.js.map