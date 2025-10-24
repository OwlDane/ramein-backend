-- Migration: Add new fields to event table
-- Priority 1: Essential fields for better event management

-- Add capacity and registration fields
ALTER TABLE "event" 
ADD COLUMN IF NOT EXISTS "maxParticipants" integer,
ADD COLUMN IF NOT EXISTS "registrationDeadline" timestamp,
ADD COLUMN IF NOT EXISTS "eventType" character varying DEFAULT 'offline';

-- Add contact person fields
ALTER TABLE "event"
ADD COLUMN IF NOT EXISTS "contactPersonName" character varying,
ADD COLUMN IF NOT EXISTS "contactPersonPhone" character varying,
ADD COLUMN IF NOT EXISTS "contactPersonEmail" character varying;

-- Add meeting link for online events
ALTER TABLE "event"
ADD COLUMN IF NOT EXISTS "meetingLink" text;

-- Add additional information fields
ALTER TABLE "event"
ADD COLUMN IF NOT EXISTS "requirements" text,
ADD COLUMN IF NOT EXISTS "benefits" text;

-- Add featured and tags (Priority 2)
ALTER TABLE "event"
ADD COLUMN IF NOT EXISTS "isFeatured" boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS "tags" text;

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS "IDX_event_eventType" ON "event" ("eventType");
CREATE INDEX IF NOT EXISTS "IDX_event_isFeatured" ON "event" ("isFeatured");
CREATE INDEX IF NOT EXISTS "IDX_event_registrationDeadline" ON "event" ("registrationDeadline");
