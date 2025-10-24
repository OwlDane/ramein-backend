-- Migration: Create article and article_category tables
-- This migration creates tables for article management system

-- Create article_category table
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

-- Create article table
CREATE TABLE IF NOT EXISTS "article" (
    "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
    "title" character varying NOT NULL,
    "slug" character varying NOT NULL,
    "excerpt" text,
    "content" text NOT NULL,
    "coverImage" text,
    "categoryId" uuid,
    "authorId" uuid NOT NULL,
    "authorName" character varying,
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

-- Add foreign key constraints
ALTER TABLE "article" 
DROP CONSTRAINT IF EXISTS "FK_article_author";

ALTER TABLE "article" 
ADD CONSTRAINT "FK_article_author" 
FOREIGN KEY ("authorId") 
REFERENCES "user"("id") 
ON DELETE CASCADE 
ON UPDATE NO ACTION;

ALTER TABLE "article" 
DROP CONSTRAINT IF EXISTS "FK_article_category";

ALTER TABLE "article" 
ADD CONSTRAINT "FK_article_category" 
FOREIGN KEY ("categoryId") 
REFERENCES "article_category"("id") 
ON DELETE SET NULL 
ON UPDATE NO ACTION;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS "IDX_article_slug" ON "article" ("slug");
CREATE INDEX IF NOT EXISTS "IDX_article_authorId" ON "article" ("authorId");
CREATE INDEX IF NOT EXISTS "IDX_article_categoryId" ON "article" ("categoryId");
CREATE INDEX IF NOT EXISTS "IDX_article_isPublished" ON "article" ("isPublished");
CREATE INDEX IF NOT EXISTS "IDX_article_publishedAt" ON "article" ("publishedAt");
CREATE INDEX IF NOT EXISTS "IDX_article_category_slug" ON "article_category" ("slug");

-- Insert default categories
INSERT INTO "article_category" ("id", "name", "slug", "description") 
SELECT 
    uuid_generate_v4(), 
    'Tips & Tricks', 
    'tips-tricks', 
    'Practical tips and tricks for event management'
WHERE NOT EXISTS (SELECT 1 FROM "article_category" WHERE slug = 'tips-tricks');

INSERT INTO "article_category" ("id", "name", "slug", "description") 
SELECT 
    uuid_generate_v4(), 
    'Industry Insights', 
    'industry-insights', 
    'Latest insights from the event industry'
WHERE NOT EXISTS (SELECT 1 FROM "article_category" WHERE slug = 'industry-insights');

INSERT INTO "article_category" ("id", "name", "slug", "description") 
SELECT 
    uuid_generate_v4(), 
    'Community', 
    'community', 
    'Community stories and experiences'
WHERE NOT EXISTS (SELECT 1 FROM "article_category" WHERE slug = 'community');

INSERT INTO "article_category" ("id", "name", "slug", "description") 
SELECT 
    uuid_generate_v4(), 
    'Technology', 
    'technology', 
    'Technology trends in event management'
WHERE NOT EXISTS (SELECT 1 FROM "article_category" WHERE slug = 'technology');

INSERT INTO "article_category" ("id", "name", "slug", "description") 
SELECT 
    uuid_generate_v4(), 
    'Event Planning', 
    'event-planning', 
    'Event planning guides and resources'
WHERE NOT EXISTS (SELECT 1 FROM "article_category" WHERE slug = 'event-planning');
