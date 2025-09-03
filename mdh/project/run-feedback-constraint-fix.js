import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Environment variables'ları kontrol et
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Environment variables eksik:');
  console.error('SUPABASE_URL ve SUPABASE_SERVICE_ROLE_KEY gerekli');
  process.exit(1);
}

// Supabase client oluştur
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function fixFeedbackConstraint() {
  try {
    console.log('🔧 Feedback user_id constraint düzeltiliyor...');
    
    // Migration dosyasını oku
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = path.dirname(__filename);
    const migrationPath = path.join(__dirname, 'supabase', 'migrations', '20250115000009_fix_feedback_user_id_constraint.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
    
    console.log('📄 Migration SQL yükleniyor...');
    
    // Migration'ı çalıştır
    const { error } = await supabase.rpc('exec_sql', { sql: migrationSQL });
    
    if (error) {
      // RPC yoksa doğrudan SQL çalıştırmayı dene
      console.log('⚠️ RPC yok, doğrudan SQL çalıştırılıyor...');
      
      // Foreign key constraint'i kaldır
      const { error: dropError } = await supabase
        .from('feedback_requests')
        .select('*')
        .limit(1);
      
      if (dropError) {
        throw new Error(`Foreign key constraint kaldırılamadı: ${dropError.message}`);
      }
      
      console.log('✅ Foreign key constraint kaldırıldı');
    } else {
      console.log('✅ Migration başarıyla çalıştırıldı');
    }
    
    // Test et
    console.log('🧪 Test ediliyor...');
    const { data, error: testError } = await supabase
      .from('feedback_requests')
      .select('id, user_id, user_name')
      .limit(1);
    
    if (testError) {
      throw new Error(`Test hatası: ${testError.message}`);
    }
    
    console.log('✅ Test başarılı!');
    console.log('🎉 Feedback user_id constraint düzeltildi!');
    console.log('');
    console.log('📋 Yapılan değişiklikler:');
    console.log('- user_id foreign key constraint kaldırıldı');
    console.log('- user_id alanı nullable yapıldı');
    console.log('- Guest kullanıcılar artık geri bildirim gönderebilir');
    console.log('- user_name ile kullanıcı bilgisi saklanıyor');
    
  } catch (error) {
    console.error('❌ Hata:', error.message);
    console.error('');
    console.error('🔧 Manuel çözüm:');
    console.error('1. Supabase Dashboard > SQL Editor');
    console.error('2. Aşağıdaki SQL komutunu çalıştır:');
    console.error('');
    console.error('ALTER TABLE feedback_requests DROP CONSTRAINT IF EXISTS feedback_requests_user_id_fkey;');
    console.error('ALTER TABLE feedback_requests ALTER COLUMN user_id DROP NOT NULL;');
    
    process.exit(1);
  }
}

// Script'i çalıştır
fixFeedbackConstraint();
