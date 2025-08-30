-- Kullanıcı tercihleri tablosu
CREATE TABLE IF NOT EXISTS user_preferences (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- UI/UX Ayarları
  uiux_settings JSONB DEFAULT '{
    "layout": "default",
    "sidebarCollapsed": false,
    "sidebarWidth": 320,
    "messageSpacing": "normal",
    "fontSize": "medium",
    "lineHeight": "normal",
    "borderRadius": "medium",
    "shadows": "subtle",
    "animations": true,
    "animationSpeed": "normal",
    "reducedMotion": false,
    "accentColor": "#3b82f6",
    "colorScheme": "blue",
    "customColors": {
      "primary": "#3b82f6",
      "secondary": "#6b7280",
      "accent": "#8b5cf6"
    },
    "fontFamily": "system",
    "customFont": "",
    "fontWeight": "normal",
    "highContrast": false,
    "largeText": false,
    "focusIndicators": true,
    "screenReader": false,
    "lazyLoading": true,
    "virtualScrolling": false,
    "imageOptimization": true,
    "customCSS": "",
    "customJS": ""
  }',
  
  -- Bildirim Ayarları
  notification_settings JSONB DEFAULT '{
    "enabled": true,
    "sound": true,
    "desktop": true,
    "mobile": true,
    "mentions": true,
    "messages": true,
    "files": true,
    "system": true,
    "reminders": true,
    "announcements": true,
    "quietHours": {
      "enabled": false,
      "start": "22:00",
      "end": "08:00"
    },
    "priorityFilter": "all",
    "soundEffects": {
      "message": "/sounds/message.mp3",
      "mention": "/sounds/mention.mp3",
      "file": "/sounds/file.mp3",
      "system": "/sounds/system.mp3"
    },
    "vibrationPattern": [200, 100, 200],
    "autoDismiss": {
      "enabled": true,
      "duration": 5000
    }
  }',
  
  -- Tema Ayarları
  theme VARCHAR(10) DEFAULT 'auto',
  
  -- Bildirim Geçmişi
  shown_notifications JSONB DEFAULT '[]',
  has_shown_welcome_notifications BOOLEAN DEFAULT false,
  
  -- Kullanıcı Tercihleri
  user_preferences JSONB DEFAULT '{
    "language": "tr",
    "timezone": "Europe/Istanbul",
    "dateFormat": "DD/MM/YYYY",
    "timeFormat": "24h"
  }',
  
  -- Responsive Ayarları
  responsive_settings JSONB DEFAULT '{
    "sidebarCollapsed": false,
    "lastScreenSize": "lg",
    "mobileMenuOpen": false
  }',
  
  -- Zaman damgaları
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS (Row Level Security) etkinleştir
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;

-- RLS politikaları
CREATE POLICY "Users can view their own preferences" ON user_preferences
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own preferences" ON user_preferences
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own preferences" ON user_preferences
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own preferences" ON user_preferences
  FOR DELETE USING (auth.uid() = user_id);

-- Unique index user_id için
CREATE UNIQUE INDEX IF NOT EXISTS user_preferences_user_id_idx ON user_preferences(user_id);

-- Updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_user_preferences_updated_at 
  BEFORE UPDATE ON user_preferences 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
