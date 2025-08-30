const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Environment variables
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Supabase URL ve Service Role Key gerekli!');
  console.log('Lütfen .env dosyasında VITE_SUPABASE_URL ve SUPABASE_SERVICE_ROLE_KEY değerlerini ayarlayın.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function runMigration() {
  try {
    console.log('🚀 Recurring Billing migration başlatılıyor...');
    
    // Migration dosyasını oku
    const migrationPath = path.join(__dirname, 'supabase', 'migrations', '20250115000007_recurring_billing.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
    
    console.log('📄 Migration dosyası okundu');
    
    // SQL'i çalıştır
    const { data, error } = await supabase.rpc('exec_sql', { sql: migrationSQL });
    
    if (error) {
      console.error('❌ Migration hatası:', error);
      throw error;
    }
    
    console.log('✅ Migration başarıyla tamamlandı!');
    console.log('📊 Oluşturulan tablolar:');
    console.log('   - recurring_invoice_templates');
    console.log('   - customer_subscriptions');
    console.log('   - recurring_invoice_history');
    console.log('   - invoice_templates');
    console.log('   - invoice_automation_rules');
    
    console.log('\n🔧 Oluşturulan fonksiyonlar:');
    console.log('   - calculate_next_billing_date()');
    console.log('   - generate_recurring_invoices()');
    console.log('   - check_subscription_status()');
    
    console.log('\n🎯 Varsayılan veriler eklendi:');
    console.log('   - 2 fatura şablonu');
    console.log('   - 4 tekrarlayan fatura şablonu');
    
    console.log('\n✨ Recurring Billing sistemi hazır!');
    console.log('Frontend\'de "Otomatik Faturalar" menüsünden erişebilirsiniz.');
    
  } catch (error) {
    console.error('❌ Migration sırasında hata:', error);
    process.exit(1);
  }
}

// Migration'ı çalıştır
runMigration();
