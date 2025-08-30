-- Chat sistemi tabloları

-- Kanallar tablosu
CREATE TABLE IF NOT EXISTS channels (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  type VARCHAR(50) DEFAULT 'public', -- 'public', 'private', 'direct'
  created_by UUID REFERENCES auth.users(id),
  is_active BOOLEAN DEFAULT true,
  is_archived BOOLEAN DEFAULT false,
  member_count INTEGER DEFAULT 0,
  last_message_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Kanal üyeleri tablosu
CREATE TABLE IF NOT EXISTS channel_members (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  channel_id UUID REFERENCES channels(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  role VARCHAR(50) DEFAULT 'member', -- 'admin', 'moderator', 'member'
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_read_at TIMESTAMP WITH TIME ZONE,
  is_muted BOOLEAN DEFAULT false,
  UNIQUE(channel_id, user_id)
);

-- Mesajlar tablosu
CREATE TABLE IF NOT EXISTS messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  channel_id UUID REFERENCES channels(id) ON DELETE CASCADE,
  sender_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  message_type VARCHAR(50) DEFAULT 'text', -- 'text', 'file', 'image', 'voice', 'poll'
  reply_to_id UUID REFERENCES messages(id),
  is_edited BOOLEAN DEFAULT false,
  edited_at TIMESTAMP WITH TIME ZONE,
  is_deleted BOOLEAN DEFAULT false,
  deleted_at TIMESTAMP WITH TIME ZONE,
  metadata JSONB, -- Dosya bilgileri, poll verileri vb.
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Mesaj tepkileri tablosu
CREATE TABLE IF NOT EXISTS message_reactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  message_id UUID REFERENCES messages(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  reaction_type VARCHAR(50) NOT NULL, -- 'like', 'love', 'laugh', 'wow', 'sad', 'angry'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(message_id, user_id, reaction_type)
);

-- Dosya yüklemeleri tablosu
CREATE TABLE IF NOT EXISTS file_uploads (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  message_id UUID REFERENCES messages(id) ON DELETE CASCADE,
  file_name VARCHAR(255) NOT NULL,
  file_path VARCHAR(500) NOT NULL,
  file_size INTEGER NOT NULL,
  file_type VARCHAR(100) NOT NULL,
  mime_type VARCHAR(100),
  uploaded_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Poll'lar tablosu
CREATE TABLE IF NOT EXISTS polls (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  message_id UUID REFERENCES messages(id) ON DELETE CASCADE,
  question TEXT NOT NULL,
  options JSONB NOT NULL, -- [{"id": "1", "text": "Seçenek 1", "votes": 0}]
  is_multiple_choice BOOLEAN DEFAULT false,
  expires_at TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Poll oyları tablosu
CREATE TABLE IF NOT EXISTS poll_votes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  poll_id UUID REFERENCES polls(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  selected_options JSONB NOT NULL, -- ["1", "3"] gibi seçilen option ID'leri
  voted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(poll_id, user_id)
);

-- Mesaj şablonları tablosu
CREATE TABLE IF NOT EXISTS message_templates (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  content TEXT NOT NULL,
  category VARCHAR(100),
  created_by UUID REFERENCES auth.users(id),
  is_public BOOLEAN DEFAULT false,
  usage_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Chat görevleri tablosu
CREATE TABLE IF NOT EXISTS chat_tasks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  assigned_to UUID REFERENCES auth.users(id),
  created_by UUID REFERENCES auth.users(id),
  channel_id UUID REFERENCES channels(id),
  message_id UUID REFERENCES messages(id),
  priority VARCHAR(20) DEFAULT 'medium', -- 'low', 'medium', 'high', 'urgent'
  status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'in_progress', 'completed', 'cancelled'
  due_date TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Konuşma özetleri tablosu
CREATE TABLE IF NOT EXISTS conversation_summaries (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  channel_id UUID REFERENCES channels(id) ON DELETE CASCADE,
  summary TEXT NOT NULL,
  key_points JSONB, -- ["Önemli nokta 1", "Önemli nokta 2"]
  action_items JSONB, -- ["Yapılacak 1", "Yapılacak 2"]
  participants JSONB, -- ["user_id1", "user_id2"]
  message_count INTEGER DEFAULT 0,
  generated_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);


-- Index'ler daha sonra ayrı bir migration'da eklenecek

-- Trigger'lar
CREATE OR REPLACE FUNCTION update_channel_last_message()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE channels 
  SET last_message_at = NEW.created_at,
      member_count = (
        SELECT COUNT(*) FROM channel_members 
        WHERE channel_id = NEW.channel_id
      )
  WHERE id = NEW.channel_id;
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger'lar daha sonra ayrı bir migration'da eklenecek
