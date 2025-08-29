import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Environment variables'ları yükle
dotenv.config();

// Supabase bağlantısı
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

console.log('🔍 Proje Yönetimi Tabloları Testi');
console.log('==================================');
console.log('URL:', supabaseUrl ? '✅ Ayarlandı' : '❌ Eksik');
console.log('Key:', supabaseKey ? '✅ Ayarlandı' : '❌ Eksik');

if (!supabaseUrl || !supabaseKey) {
  console.log('\n❌ Environment variables eksik!');
  console.log('.env dosyasında VITE_SUPABASE_URL ve VITE_SUPABASE_ANON_KEY ayarlayın.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testProjectTables() {
  try {
    console.log('\n🔄 Tablolar test ediliyor...');
    
    // 1. Projects tablosu testi
    console.log('\n📊 Projects tablosu test ediliyor...');
    const { data: projectsData, error: projectsError } = await supabase
      .from('projects')
      .select('*')
      .limit(1);
    
    if (projectsError) {
      console.log('❌ Projects tablosu hatası:', projectsError.message);
      if (projectsError.message.includes('relation "projects" does not exist')) {
        console.log('💡 Projects tablosu oluşturulmamış. SQL migration gerekli.');
      }
    } else {
      console.log('✅ Projects tablosu mevcut');
      console.log('📈 Proje sayısı:', projectsData?.length || 0);
    }
    
    // 2. Project Resources tablosu testi
    console.log('\n👥 Project Resources tablosu test ediliyor...');
    const { data: resourcesData, error: resourcesError } = await supabase
      .from('project_resources')
      .select('*')
      .limit(1);
    
    if (resourcesError) {
      console.log('❌ Project Resources tablosu hatası:', resourcesError.message);
      if (resourcesError.message.includes('relation "project_resources" does not exist')) {
        console.log('💡 Project Resources tablosu oluşturulmamış. SQL migration gerekli.');
      }
    } else {
      console.log('✅ Project Resources tablosu mevcut');
      console.log('📈 Kaynak sayısı:', resourcesData?.length || 0);
    }
    
    // 3. Project Tasks tablosu testi
    console.log('\n📋 Project Tasks tablosu test ediliyor...');
    const { data: tasksData, error: tasksError } = await supabase
      .from('project_tasks')
      .select('*')
      .limit(1);
    
    if (tasksError) {
      console.log('❌ Project Tasks tablosu hatası:', tasksError.message);
      if (tasksError.message.includes('relation "project_tasks" does not exist')) {
        console.log('💡 Project Tasks tablosu oluşturulmamış. SQL migration gerekli.');
      }
    } else {
      console.log('✅ Project Tasks tablosu mevcut');
      console.log('📈 Görev sayısı:', tasksData?.length || 0);
    }
    
    // 4. Project Risks tablosu testi
    console.log('\n⚠️ Project Risks tablosu test ediliyor...');
    const { data: risksData, error: risksError } = await supabase
      .from('project_risks')
      .select('*')
      .limit(1);
    
    if (risksError) {
      console.log('❌ Project Risks tablosu hatası:', risksError.message);
      if (risksError.message.includes('relation "project_risks" does not exist')) {
        console.log('💡 Project Risks tablosu oluşturulmamış. SQL migration gerekli.');
      }
    } else {
      console.log('✅ Project Risks tablosu mevcut');
      console.log('📈 Risk sayısı:', risksData?.length || 0);
    }
    
    console.log('\n🎯 Test Sonuçları:');
    console.log('==================');
    
    if (projectsError && resourcesError && tasksError && risksError) {
      console.log('❌ Hiçbir tablo mevcut değil!');
      console.log('\n💡 Çözüm:');
      console.log('1. Supabase Dashboard\'a gidin');
      console.log('2. SQL Editor\'ü açın');
      console.log('3. supabase/migrations/20241215_create_project_management_tables.sql dosyasını çalıştırın');
      console.log('4. Veya aşağıdaki SQL komutlarını tek tek çalıştırın:');
      console.log('\n-- Projeler tablosu');
      console.log('CREATE TABLE IF NOT EXISTS projects (id UUID DEFAULT gen_random_uuid() PRIMARY KEY, name VARCHAR(255) NOT NULL, description TEXT, status VARCHAR(50) DEFAULT \'planning\', priority VARCHAR(50) DEFAULT \'medium\', start_date DATE NOT NULL, end_date DATE NOT NULL, budget DECIMAL(15,2) DEFAULT 0, actual_cost DECIMAL(15,2) DEFAULT 0, progress INTEGER DEFAULT 0, team_size INTEGER DEFAULT 1, risk_level VARCHAR(50) DEFAULT \'low\', customer_id UUID, created_by UUID, created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(), updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW());');
    } else {
      console.log('✅ Bazı tablolar mevcut');
      console.log('📊 Mevcut tablolar:');
      if (!projectsError) console.log('   - projects');
      if (!resourcesError) console.log('   - project_resources');
      if (!tasksError) console.log('   - project_tasks');
      if (!risksError) console.log('   - project_risks');
    }
    
  } catch (error) {
    console.log('❌ Test hatası:', error.message);
  }
}

testProjectTables();
