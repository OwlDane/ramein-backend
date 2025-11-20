import AppDataSource from './database';
import logger from '../utils/logger';

export async function createGalleryTable() {
    try {
        // Initialize database if not already initialized
        if (!AppDataSource.isInitialized) {
            await AppDataSource.initialize();
        }

        const queryRunner = AppDataSource.createQueryRunner();
        await queryRunner.connect();

        // Check if table already exists
        const tableExists = await queryRunner.hasTable('gallery');
        
        if (tableExists) {
            logger.info('Gallery table already exists');
            await queryRunner.release();
            return;
        }

        // Create gallery table using raw SQL
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

        logger.info('Gallery table created successfully');
        await queryRunner.release();
        
        // Close database connection
        if (AppDataSource.isInitialized) {
            await AppDataSource.destroy();
        }
    } catch (error) {
        logger.error('Error creating gallery table:', error);
        // Close database connection on error
        if (AppDataSource.isInitialized) {
            await AppDataSource.destroy();
        }
        throw error;
    }
}

// Run migration
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
