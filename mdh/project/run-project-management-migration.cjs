const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Supabase bağlantısı
const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://your-project.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'your-service-role-key';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function runMigration() {
  try {
    console.log('🚀 Proje Yönetimi migration başlatılıyor...');
    
    // Migration dosyasını oku
    const migrationPath = path.join(__dirname, 'supabase', 'migrations', '20241215_create_project_management_tables.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
    
    console.log('📄 Migration dosyası okundu');
    
    // SQL komutlarını çalıştır
    const { error } = await supabase.rpc('exec_sql', { sql: migrationSQL });
    
    if (error) {
      console.error('❌ Migration hatası:', error);
      return;
    }
    
    console.log('✅ Proje Yönetimi tabloları başarıyla oluşturuldu!');
    console.log('📊 Oluşturulan tablolar:');
    console.log('   - projects (Projeler)');
    console.log('   - project_resources (Proje Kaynakları)');
    console.log('   - project_tasks (Proje Görevleri)');
    console.log('   - project_risks (Proje Riskleri)');
    console.log('   - project_phases (Proje Aşamaları)');
    console.log('   - project_timeline (Proje Zaman Çizelgesi)');
    console.log('');
    console.log('🎯 Örnek veriler eklendi');
    console.log('🔒 RLS politikaları aktif');
    console.log('⚡ Trigger\'lar ve indeksler oluşturuldu');
    
  } catch (error) {
    console.error('❌ Migration çalıştırma hatası:', error);
  }
}

// Manuel SQL çalıştırma fonksiyonu
async function executeSQL(sql) {
  try {
    const { error } = await supabase.rpc('exec_sql', { sql });
    if (error) throw error;
    return true;
  } catch (error) {
    console.error('SQL çalıştırma hatası:', error);
    return false;
  }
}

// Alternatif migration yöntemi - SQL komutlarını tek tek çalıştır
async function runMigrationAlternative() {
  try {
    console.log('🚀 Alternatif migration yöntemi başlatılıyor...');
    
    const sqlCommands = [
      // Projeler tablosu
      `CREATE TABLE IF NOT EXISTS projects (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        status VARCHAR(50) DEFAULT 'planning' CHECK (status IN ('planning', 'active', 'completed', 'on_hold')),
        priority VARCHAR(50) DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'critical')),
        start_date DATE NOT NULL,
        end_date DATE NOT NULL,
        budget DECIMAL(15,2) DEFAULT 0,
        actual_cost DECIMAL(15,2) DEFAULT 0,
        progress INTEGER DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
        team_size INTEGER DEFAULT 1,
        risk_level VARCHAR(50) DEFAULT 'low' CHECK (risk_level IN ('low', 'medium', 'high')),
        customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
        created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );`,
      
      // Proje kaynakları tablosu
      `CREATE TABLE IF NOT EXISTS project_resources (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        role VARCHAR(255) NOT NULL,
        availability INTEGER DEFAULT 40 CHECK (availability > 0),
        current_load INTEGER DEFAULT 0 CHECK (current_load >= 0),
        skills TEXT[] DEFAULT '{}',
        hourly_rate DECIMAL(10,2) DEFAULT 0,
        status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'on_leave')),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );`,
      
      // Proje görevleri tablosu
      `CREATE TABLE IF NOT EXISTS project_tasks (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'blocked')),
        priority VARCHAR(50) DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
        assigned_to UUID REFERENCES project_resources(id) ON DELETE SET NULL,
        estimated_hours INTEGER DEFAULT 0,
        actual_hours INTEGER DEFAULT 0,
        start_date DATE,
        due_date DATE,
        dependencies UUID[] DEFAULT '{}',
        progress INTEGER DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );`,
      
      // Risk analizi tablosu
      `CREATE TABLE IF NOT EXISTS project_risks (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
        risk_type VARCHAR(50) NOT NULL CHECK (risk_type IN ('budget', 'schedule', 'resource', 'technical')),
        title VARCHAR(255) NOT NULL,
        description TEXT,
        probability INTEGER DEFAULT 50 CHECK (probability >= 0 AND probability <= 100),
        impact INTEGER DEFAULT 50 CHECK (impact >= 0 AND impact <= 100),
        mitigation_strategy TEXT,
        status VARCHAR(50) DEFAULT 'identified' CHECK (status IN ('identified', 'monitoring', 'mitigated')),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );`,
      
      // Proje aşamaları tablosu
      `CREATE TABLE IF NOT EXISTS project_phases (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        duration INTEGER DEFAULT 0,
        progress INTEGER DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
        start_date DATE,
        end_date DATE,
        order_index INTEGER DEFAULT 0,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );`,
      
      // Proje zaman çizelgesi tablosu
      `CREATE TABLE IF NOT EXISTS project_timeline (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
        phase_id UUID REFERENCES project_phases(id) ON DELETE CASCADE,
        task_id UUID REFERENCES project_tasks(id) ON DELETE CASCADE,
        start_date DATE NOT NULL,
        end_date DATE NOT NULL,
        assigned_resources UUID[] DEFAULT '{}',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );`
    ];
    
    // Her SQL komutunu çalıştır
    for (let i = 0; i < sqlCommands.length; i++) {
      console.log(`📝 Komut ${i + 1}/${sqlCommands.length} çalıştırılıyor...`);
      const success = await executeSQL(sqlCommands[i]);
      if (!success) {
        console.error(`❌ Komut ${i + 1} başarısız`);
        return;
      }
    }
    
    console.log('✅ Tüm tablolar başarıyla oluşturuldu!');
    
  } catch (error) {
    console.error('❌ Alternatif migration hatası:', error);
  }
}

// Ana fonksiyon
async function main() {
  console.log('🎯 Proje Yönetimi Migration Script');
  console.log('=====================================');
  
  // İlk yöntemi dene
  await runMigration();
  
  // Eğer ilk yöntem başarısız olursa alternatif yöntemi dene
  // await runMigrationAlternative();
}

// Script çalıştır
if (require.main === module) {
  main().catch(console.error);
}

module.exports = { runMigration, runMigrationAlternative };
