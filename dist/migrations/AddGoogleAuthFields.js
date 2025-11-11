"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AddGoogleAuthFields1699999999999 = void 0;
const typeorm_1 = require("typeorm");
class AddGoogleAuthFields1699999999999 {
    async up(queryRunner) {
        await queryRunner.addColumn("user", new typeorm_1.TableColumn({
            name: "googleId",
            type: "varchar",
            isNullable: true,
            isUnique: true
        }));
        await queryRunner.addColumn("user", new typeorm_1.TableColumn({
            name: "profilePicture",
            type: "varchar",
            isNullable: true
        }));
        await queryRunner.changeColumn("user", "password", new typeorm_1.TableColumn({
            name: "password",
            type: "varchar",
            isNullable: true
        }));
    }
    async down(queryRunner) {
        await queryRunner.dropColumn("user", "googleId");
        await queryRunner.dropColumn("user", "profilePicture");
        await queryRunner.changeColumn("user", "password", new typeorm_1.TableColumn({
            name: "password",
            type: "varchar",
            isNullable: false
        }));
    }
}
exports.AddGoogleAuthFields1699999999999 = AddGoogleAuthFields1699999999999;
//# sourceMappingURL=AddGoogleAuthFields.js.map