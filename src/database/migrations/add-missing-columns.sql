-- Migration: Add missing columns to user table
-- Run this script to sync database with User entity

-- Add isEmailVerified column
ALTER TABLE "user" 
ADD COLUMN IF NOT EXISTS "isEmailVerified" BOOLEAN DEFAULT FALSE;

-- Add isOtpVerified column  
ALTER TABLE "user" 
ADD COLUMN IF NOT EXISTS "isOtpVerified" BOOLEAN DEFAULT FALSE;

-- Add verificationToken column
ALTER TABLE "user" 
ADD COLUMN IF NOT EXISTS "verificationToken" VARCHAR NULL;

-- Add tokenExpiry column
ALTER TABLE "user" 
ADD COLUMN IF NOT EXISTS "tokenExpiry" TIMESTAMP NULL;

-- Add resetToken column
ALTER TABLE "user" 
ADD COLUMN IF NOT EXISTS "resetToken" VARCHAR NULL;

-- Add resetTokenExpiry column
ALTER TABLE "user" 
ADD COLUMN IF NOT EXISTS "resetTokenExpiry" TIMESTAMP NULL;

-- Add otp column
ALTER TABLE "user" 
ADD COLUMN IF NOT EXISTS "otp" VARCHAR NULL;

-- Add otpCreatedAt column
ALTER TABLE "user" 
ADD COLUMN IF NOT EXISTS "otpCreatedAt" TIMESTAMP NULL;

-- Update existing records to have default values
UPDATE "user" 
SET 
    "isEmailVerified" = COALESCE("isEmailVerified", FALSE),
    "isOtpVerified" = COALESCE("isOtpVerified", FALSE);

-- Verify the changes
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'user' 
ORDER BY ordinal_position;
