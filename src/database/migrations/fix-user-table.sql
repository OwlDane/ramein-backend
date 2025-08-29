-- Migration: Fix user table - Add missing columns safely
-- Run this script to sync database with User entity

-- 1. Check current user table structure
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'user' 
ORDER BY ordinal_position;

-- 2. Add missing columns safely
DO $$ 
BEGIN
    -- Add isEmailVerified if not exists
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'user' AND column_name = 'isEmailVerified') THEN
        ALTER TABLE "user" ADD COLUMN "isEmailVerified" BOOLEAN DEFAULT FALSE;
    END IF;
    
    -- Add isOtpVerified if not exists
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'user' AND column_name = 'isOtpVerified') THEN
        ALTER TABLE "user" ADD COLUMN "isOtpVerified" BOOLEAN DEFAULT FALSE;
    END IF;
    
    -- Add verificationToken if not exists
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'user' AND column_name = 'verificationToken') THEN
        ALTER TABLE "user" ADD COLUMN "verificationToken" VARCHAR NULL;
    END IF;
    
    -- Add tokenExpiry if not exists
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'user' AND column_name = 'tokenExpiry') THEN
        ALTER TABLE "user" ADD COLUMN "tokenExpiry" TIMESTAMP NULL;
    END IF;
    
    -- Add resetToken if not exists
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'user' AND column_name = 'resetToken') THEN
        ALTER TABLE "user" ADD COLUMN "resetToken" VARCHAR NULL;
    END IF;
    
    -- Add resetTokenExpiry if not exists
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'user' AND column_name = 'resetTokenExpiry') THEN
        ALTER TABLE "user" ADD COLUMN "resetTokenExpiry" TIMESTAMP NULL;
    END IF;
    
    -- Add otp if not exists
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'user' AND column_name = 'otp') THEN
        ALTER TABLE "user" ADD COLUMN "otp" VARCHAR NULL;
    END IF;
    
    -- Add otpCreatedAt if not exists
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'user' AND column_name = 'otpCreatedAt') THEN
        ALTER TABLE "user" ADD COLUMN "otpCreatedAt" TIMESTAMP NULL;
    END IF;
END $$;

-- 3. Update existing records to have default values
UPDATE "user" 
SET 
    "isEmailVerified" = COALESCE("isEmailVerified", FALSE),
    "isOtpVerified" = COALESCE("isOtpVerified", FALSE)
WHERE "isEmailVerified" IS NULL OR "isOtpVerified" IS NULL;

-- 4. Verify the final structure
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'user' 
ORDER BY ordinal_position;
