const fs = require('fs');
const path = require('path');

// Migration dosyasını oku
const migrationPath = path.join(__dirname, 'supabase', 'migrations', '20250820530000_referral_program.sql');
const migrationContent = fs.readFileSync(migrationPath, 'utf8');

console.log('Referral Program Migration SQL Kodu:');
console.log('=====================================');
console.log(migrationContent);
console.log('=====================================');
console.log('\nBu migration dosyasını Supabase Dashboard\'da SQL Editor\'da çalıştırabilirsiniz.');
console.log('\nAdımlar:');
console.log('1. https://supabase.com/dashboard adresine gidin');
console.log('2. Projenizi seçin (workexe)');
console.log('3. Sol menüden "SQL Editor" seçin');
console.log('4. "New query" butonuna tıklayın');
console.log('5. Yukarıdaki SQL kodunu yapıştırın');
console.log('6. "Run" butonuna tıklayın');
console.log('\nBu işlem tamamlandıktan sonra referans programı çalışacak!');
console.log('\nEğer tablolar zaten mevcut ise, sadece eksik olan kısımları ekleyecektir.');
