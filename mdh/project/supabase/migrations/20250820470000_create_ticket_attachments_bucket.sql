-- Ticket attachments için storage bucket oluştur (eğer yoksa)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
SELECT 
  'ticket-attachments',
  'ticket-attachments',
  true,
  10485760, -- 10MB
  ARRAY[
    'image/*',
    'application/pdf',
    'text/plain',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'text/csv',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  ]
WHERE NOT EXISTS (
  SELECT 1 FROM storage.buckets WHERE id = 'ticket-attachments'
);

-- RLS politikalarını ayarla (eğer yoksa)
DO $$
BEGIN
  -- Ticket attachments are publicly accessible
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'objects' 
    AND schemaname = 'storage' 
    AND policyname = 'Ticket attachments are publicly accessible'
  ) THEN
    CREATE POLICY "Ticket attachments are publicly accessible" ON storage.objects
      FOR SELECT USING (bucket_id = 'ticket-attachments');
  END IF;

  -- Authenticated users can upload ticket attachments
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'objects' 
    AND schemaname = 'storage' 
    AND policyname = 'Authenticated users can upload ticket attachments'
  ) THEN
    CREATE POLICY "Authenticated users can upload ticket attachments" ON storage.objects
      FOR INSERT WITH CHECK (
        bucket_id = 'ticket-attachments' 
        AND auth.role() = 'authenticated'
      );
  END IF;

  -- Users can update their own ticket attachments
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'objects' 
    AND schemaname = 'storage' 
    AND policyname = 'Users can update their own ticket attachments'
  ) THEN
    CREATE POLICY "Users can update their own ticket attachments" ON storage.objects
      FOR UPDATE USING (
        bucket_id = 'ticket-attachments' 
        AND auth.uid()::text = (storage.foldername(name))[1]
      );
  END IF;

  -- Users can delete their own ticket attachments
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'objects' 
    AND schemaname = 'storage' 
    AND policyname = 'Users can delete their own ticket attachments'
  ) THEN
    CREATE POLICY "Users can delete their own ticket attachments" ON storage.objects
      FOR DELETE USING (
        bucket_id = 'ticket-attachments' 
        AND auth.uid()::text = (storage.foldername(name))[1]
      );
  END IF;
END $$;
