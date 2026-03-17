-- Increase file size limit for audio bucket to 50MB (52428800 bytes)
UPDATE storage.buckets 
SET file_size_limit = 52428800,
    allowed_mime_types = ARRAY['audio/mpeg', 'audio/wav', 'audio/ogg', 'audio/mp4', 'audio/aac']
WHERE id = 'tangail_radio_audio';

-- Also ensure images have a decent limit and mime types
UPDATE storage.buckets
SET file_size_limit = 10485760, -- 10MB
    allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/avif']
WHERE id = 'tangail_radio_images';
