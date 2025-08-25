-- Sample event categories
INSERT INTO kategori_kegiatan (nama_kategori, slug, kategori_logo) 
VALUES 
    ('Seminar', 'seminar', 'seminar.png'),
    ('Workshop', 'workshop', 'workshop.png'),
    ('Conference', 'conference', 'conference.png'),
    ('Training', 'training', 'training.png'),
    ('Webinar', 'webinar', 'webinar.png')
ON CONFLICT (slug) DO NOTHING;
