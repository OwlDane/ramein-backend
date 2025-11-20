import { MigrationInterface, QueryRunner, TableColumn } from "typeorm";

export class AddGoogleAuthFields1756260000000 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        // Add googleId column
        await queryRunner.addColumn("user", new TableColumn({
            name: "googleId",
            type: "varchar",
            isNullable: true,
            isUnique: true
        }));

        // Add profilePicture column
        await queryRunner.addColumn("user", new TableColumn({
            name: "profilePicture",
            type: "varchar",
            isNullable: true
        }));

        // Make password nullable for OAuth users
        await queryRunner.changeColumn("user", "password", new TableColumn({
            name: "password",
            type: "varchar",
            isNullable: true
        }));
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.dropColumn("user", "googleId");
        await queryRunner.dropColumn("user", "profilePicture");
        
        // Revert password to not nullable
        await queryRunner.changeColumn("user", "password", new TableColumn({
            name: "password",
            type: "varchar",
            isNullable: false
        }));
    }
}
