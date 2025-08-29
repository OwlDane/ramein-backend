-- Fix NULL data in kategori_kegiatan table
-- Run this before enabling synchronize

-- 1. Check for NULL values
SELECT id, nama_kategori, slug 
FROM kategori_kegiatan 
WHERE nama_kategori IS NULL OR slug IS NULL;

-- 2. Update NULL nama_kategori with default values
UPDATE kategori_kegiatan 
SET nama_kategori = 'Uncategorized' 
WHERE nama_kategori IS NULL;

-- 3. Update NULL slug with default values (if any)
UPDATE kategori_kegiatan 
SET slug = 'uncategorized-' || id 
WHERE slug IS NULL;

-- 4. Verify no NULL values remain
SELECT id, nama_kategori, slug 
FROM kategori_kegiatan 
WHERE nama_kategori IS NULL OR slug IS NULL;

-- 5. Check table structure
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'kategori_kegiatan' 
ORDER BY ordinal_position;
