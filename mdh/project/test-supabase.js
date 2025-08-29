import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Environment variables'ları yükle
dotenv.config();

// Supabase bağlantısı
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

console.log('🔍 Supabase Bağlantı Testi');
console.log('==========================');
console.log('URL:', supabaseUrl ? '✅ Ayarlandı' : '❌ Eksik');
console.log('Key:', supabaseKey ? '✅ Ayarlandı' : '❌ Eksik');

if (!supabaseUrl || !supabaseKey) {
  console.log('\n❌ Environment variables eksik!');
  console.log('.env dosyasında VITE_SUPABASE_URL ve VITE_SUPABASE_ANON_KEY ayarlayın.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testConnection() {
  try {
    console.log('\n🔄 Bağlantı test ediliyor...');
    
    // Basit bir sorgu test et
    const { data, error } = await supabase
      .from('projects')
      .select('count')
      .limit(1);
    
    if (error) {
      console.log('❌ Bağlantı hatası:', error.message);
      
      if (error.message.includes('relation "projects" does not exist')) {
        console.log('\n💡 Çözüm: Proje yönetimi tabloları oluşturulmamış.');
        console.log('Migration script\'ini çalıştırın:');
        console.log('node run-project-management-migration.js');
      }
      
      return;
    }
    
    console.log('✅ Bağlantı başarılı!');
    console.log('📊 Veri örneği:', data);
    
  } catch (error) {
    console.log('❌ Test hatası:', error.message);
  }
}

testConnection();
