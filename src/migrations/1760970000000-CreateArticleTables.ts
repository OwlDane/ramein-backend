import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateArticleTables1760970000000 implements MigrationInterface {
    name = 'CreateArticleTables1760970000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Create article_category table
        await queryRunner.query(`
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
            )
        `);

        // Create article table
        await queryRunner.query(`
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
            )
        `);

        // Add foreign key constraints
        await queryRunner.query(`
            ALTER TABLE "article" 
            ADD CONSTRAINT "FK_article_author" 
            FOREIGN KEY ("authorId") 
            REFERENCES "user"("id") 
            ON DELETE CASCADE 
            ON UPDATE NO ACTION
        `);

        await queryRunner.query(`
            ALTER TABLE "article" 
            ADD CONSTRAINT "FK_article_category" 
            FOREIGN KEY ("categoryId") 
            REFERENCES "article_category"("id") 
            ON DELETE SET NULL 
            ON UPDATE NO ACTION
        `);

        // Create indexes for better performance
        await queryRunner.query(`
            CREATE INDEX "IDX_article_slug" ON "article" ("slug")
        `);

        await queryRunner.query(`
            CREATE INDEX "IDX_article_authorId" ON "article" ("authorId")
        `);

        await queryRunner.query(`
            CREATE INDEX "IDX_article_categoryId" ON "article" ("categoryId")
        `);

        await queryRunner.query(`
            CREATE INDEX "IDX_article_isPublished" ON "article" ("isPublished")
        `);

        await queryRunner.query(`
            CREATE INDEX "IDX_article_publishedAt" ON "article" ("publishedAt")
        `);

        await queryRunner.query(`
            CREATE INDEX "IDX_article_category_slug" ON "article_category" ("slug")
        `);

        // Insert default categories
        await queryRunner.query(`
            INSERT INTO "article_category" ("id", "name", "slug", "description") VALUES
            (uuid_generate_v4(), 'Tips & Tricks', 'tips-tricks', 'Practical tips and tricks for event management'),
            (uuid_generate_v4(), 'Industry Insights', 'industry-insights', 'Latest insights from the event industry'),
            (uuid_generate_v4(), 'Community', 'community', 'Community stories and experiences'),
            (uuid_generate_v4(), 'Technology', 'technology', 'Technology trends in event management'),
            (uuid_generate_v4(), 'Event Planning', 'event-planning', 'Event planning guides and resources')
            ON CONFLICT DO NOTHING
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Drop foreign key constraints
        await queryRunner.query(`
            ALTER TABLE "article" DROP CONSTRAINT IF EXISTS "FK_article_category"
        `);

        await queryRunner.query(`
            ALTER TABLE "article" DROP CONSTRAINT IF EXISTS "FK_article_author"
        `);

        // Drop indexes
        await queryRunner.query(`DROP INDEX IF EXISTS "IDX_article_category_slug"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "IDX_article_publishedAt"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "IDX_article_isPublished"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "IDX_article_categoryId"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "IDX_article_authorId"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "IDX_article_slug"`);

        // Drop tables
        await queryRunner.query(`DROP TABLE IF EXISTS "article"`);
        await queryRunner.query(`DROP TABLE IF EXISTS "article_category"`);
    }
}
