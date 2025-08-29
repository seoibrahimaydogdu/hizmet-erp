const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Environment variables
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Environment variables eksik!');
  console.log('Lütfen aşağıdaki environment variables\'ları ayarlayın:');
  console.log('VITE_SUPABASE_URL=your-supabase-url');
  console.log('SUPABASE_SERVICE_ROLE_KEY=your-service-role-key');
  process.exit(1);
}

// Supabase client
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function runApprovalMigration() {
  try {
    console.log('🚀 Approval Workflows migration başlatılıyor...');
    
    // Migration dosyasını oku
    const migrationPath = path.join(__dirname, 'supabase', 'migrations', '20241201_approval_workflows.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
    
    console.log('📄 Migration dosyası okundu');
    
    // SQL'i çalıştır
    const { error } = await supabase.rpc('exec_sql', { sql: migrationSQL });
    
    if (error) {
      console.error('❌ Migration hatası:', error);
      process.exit(1);
    }
    
    console.log('✅ Approval Workflows migration başarıyla tamamlandı!');
    console.log('');
    console.log('📋 Oluşturulan tablolar:');
    console.log('  - approval_workflows');
    console.log('  - approval_steps');
    console.log('  - approval_requests');
    console.log('  - approval_step_status');
    console.log('  - approval_history');
    console.log('  - approval_templates');
    console.log('  - approval_notifications');
    console.log('');
    console.log('🎯 Varsayılan veriler eklendi:');
    console.log('  - Onay şablonları');
    console.log('  - Onay süreçleri');
    console.log('');
    console.log('🔧 Sonraki adımlar:');
    console.log('  1. Uygulamayı başlatın: npm run dev');
    console.log('  2. Sidebar\'dan "Onay Süreçleri" seçin');
    console.log('  3. Yeni onay süreci oluşturun');
    
  } catch (error) {
    console.error('❌ Beklenmeyen hata:', error);
    process.exit(1);
  }
}

// Migration'ı çalıştır
runApprovalMigration();
