import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// .env dosyasını yükle
dotenv.config({ path: path.join(__dirname, '.env') });

// Supabase bağlantı bilgileri
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Supabase bağlantı bilgileri eksik!');
  console.error('VITE_SUPABASE_URL ve SUPABASE_SERVICE_ROLE_KEY (veya VITE_SUPABASE_ANON_KEY) environment değişkenlerini ayarlayın.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function runHRMigration() {
  try {
    console.log('🚀 İK Yönetimi migration başlatılıyor...');
    
    // Migration dosyasını oku
    const migrationPath = path.join(__dirname, 'supabase', 'migrations', '20241201_hr_management.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
    
    console.log('📄 Migration SQL dosyası okundu.');
    console.log('');
    console.log('⚠️  Supabase\'de exec_sql fonksiyonu mevcut değil.');
    console.log('📋 Migration SQL komutlarını manuel olarak çalıştırmanız gerekiyor:');
    console.log('');
    console.log('1. Supabase Dashboard\'a gidin');
    console.log('2. SQL Editor\'ı açın');
    console.log('3. Aşağıdaki SQL komutlarını kopyalayıp yapıştırın:');
    console.log('');
    console.log('='.repeat(80));
    console.log(migrationSQL);
    console.log('='.repeat(80));
    console.log('');
    console.log('✅ Migration SQL komutları yukarıda gösterildi.');
    console.log('📋 Oluşturulacak tablolar:');
    console.log('   - employees (Çalışanlar)');
    console.log('   - skills (Beceriler)');
    console.log('   - performance_reviews (Performans Değerlendirmeleri)');
    console.log('   - leave_requests (İzin Talepleri)');
    console.log('');
    console.log('🎯 Örnek veriler eklenecek.');
    console.log('🔒 RLS politikaları ve indeksler zaten mevcut olduğu için atlanacak.');
    
  } catch (error) {
    console.error('❌ Migration sırasında hata oluştu:', error);
    process.exit(1);
  }
}

// Migration'ı çalıştır
runHRMigration();
