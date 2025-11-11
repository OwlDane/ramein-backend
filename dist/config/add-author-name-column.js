"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const database_1 = __importDefault(require("./database"));
async function addAuthorNameColumn() {
    try {
        await database_1.default.initialize();
        console.log('✅ Database connected');
        await database_1.default.query(`
            ALTER TABLE "article" 
            ADD COLUMN IF NOT EXISTS "authorName" character varying;
        `);
        console.log('✅ Added authorName column to article table');
        await database_1.default.destroy();
        console.log('✅ Done!');
    }
    catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    }
}
addAuthorNameColumn();
//# sourceMappingURL=add-author-name-column.js.map