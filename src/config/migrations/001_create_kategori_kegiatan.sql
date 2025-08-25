-- Create kategori_kegiatan table
CREATE TABLE IF NOT EXISTS kategori_kegiatan (
    id SERIAL PRIMARY KEY,
    nama_kategori VARCHAR(255) NOT NULL,
    slug VARCHAR(255) NOT NULL UNIQUE,
    kategori_logo VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create index on slug for faster lookups
CREATE INDEX IF NOT EXISTS idx_kategori_kegiatan_slug ON kategori_kegiatan(slug);

-- Add foreign key to kegiatan table
ALTER TABLE kegiatan
ADD COLUMN IF NOT EXISTS kategori_id INTEGER REFERENCES kategori_kegiatan(id) ON DELETE RESTRICT;
