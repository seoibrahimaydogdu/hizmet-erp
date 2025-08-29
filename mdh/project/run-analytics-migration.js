const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Supabase bağlantısı
const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://your-project.supabase.co';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || 'your-anon-key';

const supabase = createClient(supabaseUrl, supabaseKey);

async function runAnalyticsMigration() {
  try {
    console.log('Analitik migration başlatılıyor...');
    
    // Migration dosyasını oku
    const migrationPath = path.join(__dirname, 'supabase', 'migrations', '20250821070000_analytics_functions.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
    
    console.log('Migration SQL yüklendi, çalıştırılıyor...');
    
    // SQL'i çalıştır
    const { data, error } = await supabase.rpc('exec_sql', { 
      sql_query: migrationSQL 
    });
    
    if (error) {
      console.error('Migration hatası:', error);
      return;
    }
    
    console.log('Analitik migration başarıyla tamamlandı!');
    console.log('Oluşturulan fonksiyonlar:');
    console.log('- exec_sql');
    console.log('- get_ticket_analytics');
    console.log('- get_agent_performance');
    console.log('- get_customer_analytics');
    console.log('- get_financial_analytics');
    console.log('- get_sla_analytics');
    console.log('- get_daily_trends');
    console.log('- get_category_analytics');
    
  } catch (error) {
    console.error('Migration çalıştırma hatası:', error);
  }
}

// Scripti çalıştır
runAnalyticsMigration();
