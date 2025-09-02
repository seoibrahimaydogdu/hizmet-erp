const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Supabase URL ve Service Key gerekli!');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function runFeedbackMigration() {
  try {
    console.log('Geri bildirim tablosu oluşturuluyor...');
    
    // Migration SQL'ini oku
    const fs = require('fs');
    const migrationSQL = fs.readFileSync('./supabase/migrations/20250115000000_create_feedback_table.sql', 'utf8');
    
    // SQL'i çalıştır
    const { error } = await supabase.rpc('exec_sql', { sql: migrationSQL });
    
    if (error) {
      console.error('Migration hatası:', error);
      return;
    }
    
    console.log('✅ Geri bildirim tablosu başarıyla oluşturuldu!');
    console.log('📋 Tablo: feedback_requests');
    console.log('🔒 RLS: Disabled (şimdilik)');
    console.log('📊 İndeksler oluşturuldu');
    console.log('⚡ Trigger\'lar eklendi');
    
  } catch (error) {
    console.error('Migration çalıştırılırken hata:', error);
  }
}

runFeedbackMigration();
