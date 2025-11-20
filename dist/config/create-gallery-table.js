"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createGalleryTable = createGalleryTable;
const database_1 = __importDefault(require("./database"));
const logger_1 = __importDefault(require("../utils/logger"));
async function createGalleryTable() {
    try {
        if (!database_1.default.isInitialized) {
            await database_1.default.initialize();
        }
        const queryRunner = database_1.default.createQueryRunner();
        await queryRunner.connect();
        const tableExists = await queryRunner.hasTable('gallery');
        if (tableExists) {
            logger_1.default.info('Gallery table already exists');
            await queryRunner.release();
            return;
        }
        await queryRunner.query(`
            CREATE TABLE public.gallery (
                id uuid NOT NULL DEFAULT uuid_generate_v4(),
                title character varying NOT NULL,
                description text NOT NULL,
                date timestamp without time zone NOT NULL,
                location character varying NOT NULL,
                image text NOT NULL,
                participants integer NOT NULL DEFAULT 0,
                category character varying,
                "createdBy" character varying NOT NULL,
                "isPublished" boolean NOT NULL DEFAULT false,
                "createdAt" timestamp without time zone NOT NULL DEFAULT now(),
                "updatedAt" timestamp without time zone NOT NULL DEFAULT now(),
                CONSTRAINT gallery_pkey PRIMARY KEY (id)
            );
        `);
        logger_1.default.info('Gallery table created successfully');
        await queryRunner.release();
        if (database_1.default.isInitialized) {
            await database_1.default.destroy();
        }
    }
    catch (error) {
        logger_1.default.error('Error creating gallery table:', error);
        if (database_1.default.isInitialized) {
            await database_1.default.destroy();
        }
        throw error;
    }
}
if (require.main === module) {
    createGalleryTable()
        .then(() => {
        console.log('✅ Gallery table migration completed');
        process.exit(0);
    })
        .catch((error) => {
        console.error('❌ Gallery table migration failed:', error);
        process.exit(1);
    });
}
//# sourceMappingURL=create-gallery-table.js.map