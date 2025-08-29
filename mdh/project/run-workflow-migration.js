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

async function runWorkflowMigration() {
  try {
    console.log('🚀 Workflow Builder migration başlatılıyor...');
    
    // Migration dosyasını oku
    const migrationPath = path.join(__dirname, 'supabase', 'migrations', '20241201_workflow_builder.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
    
    console.log('📄 Migration dosyası okundu');
    
    // SQL'i çalıştır
    const { error } = await supabase.rpc('exec_sql', { sql: migrationSQL });
    
    if (error) {
      console.error('❌ Migration hatası:', error);
      process.exit(1);
    }
    
    console.log('✅ Workflow Builder migration başarıyla tamamlandı!');
    console.log('');
    console.log('📋 Oluşturulan tablolar:');
    console.log('  - workflows');
    console.log('  - workflow_executions');
    console.log('  - workflow_templates');
    console.log('  - workflow_node_types');
    console.log('  - workflow_variables');
    console.log('  - workflow_permissions');
    console.log('');
    console.log('🎯 Varsayılan veriler eklendi:');
    console.log('  - Node tipleri');
    console.log('  - Şablonlar');
    console.log('');
    console.log('🔧 Sonraki adımlar:');
    console.log('  1. Uygulamayı başlatın: npm run dev');
    console.log('  2. Sidebar\'dan "Workflow Builder" seçin');
    console.log('  3. Yeni workflow oluşturun');
    
  } catch (error) {
    console.error('❌ Beklenmeyen hata:', error);
    process.exit(1);
  }
}

// Migration'ı çalıştır
runWorkflowMigration();
