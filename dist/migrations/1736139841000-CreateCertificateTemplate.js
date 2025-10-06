"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CreateCertificateTemplate1736139841000 = void 0;
const typeorm_1 = require("typeorm");
class CreateCertificateTemplate1736139841000 {
    async up(queryRunner) {
        await queryRunner.createTable(new typeorm_1.Table({
            name: "certificate_template",
            columns: [
                {
                    name: "id",
                    type: "uuid",
                    isPrimary: true,
                    generationStrategy: "uuid",
                    default: "uuid_generate_v4()"
                },
                {
                    name: "name",
                    type: "varchar",
                    isNullable: false
                },
                {
                    name: "description",
                    type: "text",
                    isNullable: true
                },
                {
                    name: "category",
                    type: "varchar",
                    default: "'custom'"
                },
                {
                    name: "templateUrl",
                    type: "text",
                    isNullable: false
                },
                {
                    name: "thumbnailUrl",
                    type: "text",
                    isNullable: true
                },
                {
                    name: "isDefault",
                    type: "boolean",
                    default: false
                },
                {
                    name: "isActive",
                    type: "boolean",
                    default: true
                },
                {
                    name: "placeholders",
                    type: "jsonb",
                    isNullable: true,
                    comment: "Array of placeholder configurations with positions"
                },
                {
                    name: "settings",
                    type: "jsonb",
                    isNullable: true,
                    comment: "Template settings like fonts, colors, positions"
                },
                {
                    name: "createdBy",
                    type: "varchar",
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
        await queryRunner.query(`CREATE INDEX "IDX_certificate_template_category" ON "certificate_template" ("category")`);
        await queryRunner.query(`CREATE INDEX "IDX_certificate_template_isDefault" ON "certificate_template" ("isDefault")`);
    }
    async down(queryRunner) {
        await queryRunner.dropTable("certificate_template");
    }
}
exports.CreateCertificateTemplate1736139841000 = CreateCertificateTemplate1736139841000;
//# sourceMappingURL=1736139841000-CreateCertificateTemplate.js.map