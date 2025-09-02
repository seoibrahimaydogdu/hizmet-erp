const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Supabase configuration
const supabaseUrl = process.env.SUPABASE_URL || 'your-supabase-url';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'your-service-role-key';

if (!supabaseUrl || !supabaseKey || supabaseUrl === 'your-supabase-url') {
  console.error('❌ Lütfen SUPABASE_URL ve SUPABASE_SERVICE_ROLE_KEY environment variables\'larını ayarlayın');
  console.error('Örnek:');
  console.error('SUPABASE_URL=https://your-project.supabase.co');
  console.error('SUPABASE_SERVICE_ROLE_KEY=your-service-role-key');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function fixFeedbackTrigger() {
  try {
    console.log('🔧 Feedback trigger sorunu düzeltiliyor...');
    
    // SQL dosyasını oku
    const sqlPath = path.join(__dirname, 'fix-feedback-trigger.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');
    
    console.log('📝 SQL komutları çalıştırılıyor...');
    
    // SQL'i çalıştır
    const { error } = await supabase.rpc('exec_sql', { sql });
    
    if (error) {
      // Eğer exec_sql fonksiyonu yoksa, manuel olarak çalıştır
      console.log('⚠️ exec_sql fonksiyonu bulunamadı, manuel olarak çalıştırılıyor...');
      
      // Trigger'ı kaldır
      await supabase.rpc('exec_sql', { 
        sql: 'DROP TRIGGER IF EXISTS update_feedback_queue_position ON feedback_requests;' 
      });
      
      // Fonksiyonu kaldır
      await supabase.rpc('exec_sql', { 
        sql: 'DROP FUNCTION IF EXISTS calculate_feedback_queue_position() CASCADE;' 
      });
      
      // Yeni fonksiyonu oluştur
      const createFunctionSQL = `
        CREATE OR REPLACE FUNCTION calculate_feedback_queue_position()
        RETURNS TRIGGER AS $$
        BEGIN
          NEW.queue_position = (
            SELECT COALESCE(MAX(queue_position), 0) + 1
            FROM feedback_requests 
            WHERE status = 'pending'
          );
          RETURN NEW;
        END;
        $$ LANGUAGE plpgsql;
      `;
      
      await supabase.rpc('exec_sql', { sql: createFunctionSQL });
      
      // Yeni trigger'ı oluştur
      const createTriggerSQL = `
        CREATE TRIGGER update_feedback_queue_position
          BEFORE INSERT ON feedback_requests
          FOR EACH ROW
          EXECUTE FUNCTION calculate_feedback_queue_position();
      `;
      
      await supabase.rpc('exec_sql', { sql: createTriggerSQL });
      
    }
    
    console.log('✅ Feedback trigger başarıyla düzeltildi!');
    console.log('🎯 Artık geri bildirim gönderilebilir');
    
  } catch (error) {
    console.error('❌ Hata oluştu:', error);
    console.log('\n🔧 Manuel olarak düzeltmek için:');
    console.log('1. Supabase Dashboard\'a gidin');
    console.log('2. SQL Editor\'ü açın');
    console.log('3. fix-feedback-trigger.sql dosyasındaki komutları çalıştırın');
  }
}

// Script'i çalıştır
fixFeedbackTrigger();
