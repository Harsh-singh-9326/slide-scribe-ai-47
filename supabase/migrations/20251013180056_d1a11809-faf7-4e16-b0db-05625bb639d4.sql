-- Make presentations storage bucket public for image uploads
UPDATE storage.buckets 
SET public = true 
WHERE id = 'presentations';