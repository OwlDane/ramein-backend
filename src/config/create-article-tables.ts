import AppDataSource from './database';

async function createArticleTables() {
    try {
        await AppDataSource.initialize();
        console.log('✅ Database connected');

        // Create article_category table
        await AppDataSource.query(`
            CREATE TABLE IF NOT EXISTS "article_category" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "name" character varying NOT NULL,
                "slug" character varying NOT NULL,
                "description" text,
                "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
                "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
                CONSTRAINT "UQ_article_category_name" UNIQUE ("name"),
                CONSTRAINT "UQ_article_category_slug" UNIQUE ("slug"),
                CONSTRAINT "PK_article_category" PRIMARY KEY ("id")
            );
        `);
        console.log('✅ Created article_category table');

        // Create article table
        await AppDataSource.query(`
            CREATE TABLE IF NOT EXISTS "article" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "title" character varying NOT NULL,
                "slug" character varying NOT NULL,
                "excerpt" text,
                "content" text NOT NULL,
                "coverImage" text,
                "categoryId" uuid,
                "authorId" uuid NOT NULL,
                "publishedAt" TIMESTAMP,
                "readTime" character varying,
                "tags" text[] NOT NULL DEFAULT '{}',
                "isPublished" boolean NOT NULL DEFAULT false,
                "isDraft" boolean NOT NULL DEFAULT false,
                "viewCount" integer NOT NULL DEFAULT 0,
                "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
                "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
                CONSTRAINT "UQ_article_slug" UNIQUE ("slug"),
                CONSTRAINT "PK_article" PRIMARY KEY ("id")
            );
        `);
        console.log('✅ Created article table');

        // Add foreign keys
        await AppDataSource.query(`
            ALTER TABLE "article" 
            DROP CONSTRAINT IF EXISTS "FK_article_author";
        `);

        await AppDataSource.query(`
            ALTER TABLE "article" 
            ADD CONSTRAINT "FK_article_author" 
            FOREIGN KEY ("authorId") 
            REFERENCES "user"("id") 
            ON DELETE CASCADE;
        `);
        console.log('✅ Added FK_article_author');

        await AppDataSource.query(`
            ALTER TABLE "article" 
            DROP CONSTRAINT IF EXISTS "FK_article_category";
        `);

        await AppDataSource.query(`
            ALTER TABLE "article" 
            ADD CONSTRAINT "FK_article_category" 
            FOREIGN KEY ("categoryId") 
            REFERENCES "article_category"("id") 
            ON DELETE SET NULL;
        `);
        console.log('✅ Added FK_article_category');

        // Create indexes
        await AppDataSource.query(`CREATE INDEX IF NOT EXISTS "IDX_article_slug" ON "article" ("slug");`);
        await AppDataSource.query(`CREATE INDEX IF NOT EXISTS "IDX_article_authorId" ON "article" ("authorId");`);
        await AppDataSource.query(`CREATE INDEX IF NOT EXISTS "IDX_article_categoryId" ON "article" ("categoryId");`);
        await AppDataSource.query(`CREATE INDEX IF NOT EXISTS "IDX_article_isPublished" ON "article" ("isPublished");`);
        await AppDataSource.query(`CREATE INDEX IF NOT EXISTS "IDX_article_publishedAt" ON "article" ("publishedAt");`);
        await AppDataSource.query(`CREATE INDEX IF NOT EXISTS "IDX_article_category_slug" ON "article_category" ("slug");`);
        console.log('✅ Created indexes');

        // Insert default categories
        await AppDataSource.query(`
            INSERT INTO "article_category" ("name", "slug", "description") 
            VALUES 
                ('Tips & Tricks', 'tips-tricks', 'Practical tips and tricks for event management'),
                ('Industry Insights', 'industry-insights', 'Latest insights from the event industry'),
                ('Community', 'community', 'Community stories and experiences'),
                ('Technology', 'technology', 'Technology trends in event management'),
                ('Event Planning', 'event-planning', 'Event planning guides and resources')
            ON CONFLICT (slug) DO NOTHING;
        `);
        console.log('✅ Inserted default categories');

        await AppDataSource.destroy();
        console.log('✅ Done!');
    } catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    }
}

createArticleTables();
