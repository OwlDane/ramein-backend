-- Migration: Create tables for Kapanggih Event Management System
-- This migration creates the basic table structure safely

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create user role enum if it doesn't exist
DO $$ BEGIN
    CREATE TYPE user_role_enum AS ENUM ('USER', 'ADMIN');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create user table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.user (
    id uuid NOT NULL DEFAULT uuid_generate_v4(),
    email character varying NOT NULL UNIQUE,
    password character varying NOT NULL,
    name character varying NOT NULL,
    phone character varying NOT NULL,
    address character varying NOT NULL,
    education character varying NOT NULL,
    "isVerified" boolean NOT NULL DEFAULT false,
    "verificationToken" character varying,
    "tokenExpiry" timestamp without time zone,
    "resetToken" character varying,
    "resetTokenExpiry" timestamp without time zone,
    role user_role_enum NOT NULL DEFAULT 'USER'::user_role_enum,
    "createdAt" timestamp without time zone NOT NULL DEFAULT now(),
    "updatedAt" timestamp without time zone NOT NULL DEFAULT now(),
    CONSTRAINT user_pkey PRIMARY KEY (id)
);

-- Create event table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.event (
    id uuid NOT NULL DEFAULT uuid_generate_v4(),
    title character varying NOT NULL,
    date timestamp without time zone NOT NULL,
    time character varying NOT NULL,
    location character varying NOT NULL,
    flyer text NOT NULL,
    certificate text,
    description text NOT NULL,
    "createdBy" character varying NOT NULL,
    "isPublished" boolean NOT NULL DEFAULT false,
    "createdAt" timestamp without time zone NOT NULL DEFAULT now(),
    "updatedAt" timestamp without time zone NOT NULL DEFAULT now(),
    CONSTRAINT event_pkey PRIMARY KEY (id)
);

-- Create kategori_kegiatan table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.kategori_kegiatan (
    id SERIAL PRIMARY KEY,
    nama_kategori character varying NOT NULL,
    slug character varying NOT NULL UNIQUE,
    kategori_logo character varying,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);

-- Create participant table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.participant (
    id uuid NOT NULL DEFAULT uuid_generate_v4(),
    "userId" uuid NOT NULL,
    "eventId" uuid NOT NULL,
    "tokenNumber" character varying NOT NULL UNIQUE,
    "hasAttended" boolean NOT NULL DEFAULT false,
    "attendedAt" timestamp without time zone,
    "certificateUrl" character varying,
    "createdAt" timestamp without time zone NOT NULL DEFAULT now(),
    "updatedAt" timestamp without time zone NOT NULL DEFAULT now(),
    CONSTRAINT participant_pkey PRIMARY KEY (id),
    CONSTRAINT FK_participant_user FOREIGN KEY ("userId") REFERENCES public.user(id) ON DELETE CASCADE,
    CONSTRAINT FK_participant_event FOREIGN KEY ("eventId") REFERENCES public.event(id) ON DELETE CASCADE
);

-- Create indexes for better performance (only if they don't exist)
CREATE INDEX IF NOT EXISTS idx_user_email ON public.user(email);
CREATE INDEX IF NOT EXISTS idx_user_verification_token ON public.user("verificationToken");
CREATE INDEX IF NOT EXISTS idx_user_reset_token ON public.user("resetToken");
CREATE INDEX IF NOT EXISTS idx_event_date ON public.event(date);
CREATE INDEX IF NOT EXISTS idx_event_created_by ON public.event("createdBy");
CREATE INDEX IF NOT EXISTS idx_participant_user_id ON public.participant("userId");
CREATE INDEX IF NOT EXISTS idx_participant_event_id ON public.participant("eventId");
CREATE INDEX IF NOT EXISTS idx_participant_token ON public.participant("tokenNumber");
CREATE INDEX IF NOT EXISTS idx_kategori_slug ON public.kategori_kegiatan(slug);
