-- Ticket dosya ekleri için storage bucket oluştur
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'ticket-attachments',
  'ticket-attachments',
  true,
  10485760, -- 10MB limit
  ARRAY['image/*', 'application/pdf', 'text/*', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'application/zip', 'application/x-rar-compressed']
) ON CONFLICT (id) DO NOTHING;

-- Storage bucket için RLS politikaları
CREATE POLICY "Users can upload ticket attachments" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'ticket-attachments' AND
    (auth.role() = 'authenticated')
  );

CREATE POLICY "Users can view ticket attachments" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'ticket-attachments' AND
    (auth.role() = 'authenticated')
  );

CREATE POLICY "Users can update ticket attachments" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'ticket-attachments' AND
    (auth.role() = 'authenticated')
  );

CREATE POLICY "Users can delete ticket attachments" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'ticket-attachments' AND
    (auth.role() = 'authenticated')
  );
