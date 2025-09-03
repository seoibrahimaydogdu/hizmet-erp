const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Supabase URL ve Key bulunamadı!');
  console.error('Lütfen .env dosyasında VITE_SUPABASE_URL ve VITE_SUPABASE_ANON_KEY tanımlayın.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function runFeedbackMigration() {
  console.log('🚀 Feedback Analytics Migration başlatılıyor...');
  
  try {
    // 1. Önce mevcut feedback tablosunu kontrol et
    console.log('🔍 Feedback tablosu kontrol ediliyor...');
    const { data: existingFeedback, error: checkError } = await supabase
      .from('feedback_requests')
      .select('*')
      .limit(1);
    
    if (checkError) {
      console.error('❌ Feedback tablosu bulunamadı:', checkError);
      console.log('💡 Önce feedback tablosunu oluşturmanız gerekiyor');
      return;
    }
    
    console.log('✅ Feedback tablosu mevcut');
    
    // 2. Test verisi ekle (yeni alanlar otomatik eklenir)
    console.log('🧪 Test verisi ekleniyor...');
    const { error: testDataError } = await supabase
      .from('feedback_requests')
      .insert([
        {
          subject: 'Ödeme sayfasında hata',
          message: 'Ödeme yaparken sayfa donuyor',
          type: 'error',
          page_source: 'payment',
          emotional_impact_score: 9,
          tags: ['Hata', 'Ödeme', 'Performans'],
          status: 'pending'
        },
        {
          subject: 'Mobil uygulama yavaş',
          message: 'Mobil uygulama çok yavaş açılıyor',
          type: 'general',
          page_source: 'mobile',
          emotional_impact_score: 7,
          tags: ['Performans', 'Mobil'],
          status: 'pending'
        },
        {
          subject: 'Güvenlik iyileştirmesi',
          message: 'İki faktörlü doğrulama eklenebilir',
          type: 'feature',
          page_source: 'login',
          emotional_impact_score: 8,
          tags: ['Güvenlik', 'Özellik Talebi'],
          status: 'pending'
        }
      ]);
    
    if (testDataError) {
      console.error('❌ Test verisi eklenirken hata:', testDataError);
      console.log('💡 Yeni alanlar henüz eklenmemiş olabilir');
      return;
    }
    
    console.log('✅ Test verisi eklendi');
    
    // 3. Mevcut kayıtları güncelle (varsa)
    console.log('🔄 Mevcut kayıtlar güncelleniyor...');
    const { error: updateError } = await supabase
      .from('feedback_requests')
      .update({ 
        emotional_impact_score: 5, 
        tags: [] 
      })
      .is('emotional_impact_score', null);
    
    if (updateError) {
      console.log('ℹ️ Güncellenecek kayıt bulunamadı veya alan zaten mevcut');
    } else {
      console.log('✅ Mevcut kayıtlar güncellendi');
    }
    
    console.log('\n🎉 Migration başarıyla tamamlandı!');
    console.log('\n📊 Şimdi yapabilecekleriniz:');
    console.log('1. Uygulamayı yeniden başlatın');
    console.log('2. Agents sayfasına gidin');
    console.log('3. "Görev Listesi" tab\'ına tıklayın');
    console.log('4. Geri bildirimleri analiz edin ve görev listesini görün');
    
    console.log('\n💡 Not: Yeni alanlar (emotional_impact_score, tags) otomatik olarak eklenir');
    console.log('   Eğer hata alırsanız, migration SQL dosyasını manuel olarak çalıştırın');
    
  } catch (error) {
    console.error('❌ Migration sırasında hata:', error);
  }
}

runFeedbackMigration();
