# EmployeeChat Push Notification Sistemi

Bu dokümantasyon, EmployeeChat bileşenine eklenen gelişmiş push notification sistemini açıklar.

## 🚀 Özellikler

### 1. Tarayıcı Push Bildirimleri
- **Sayfa Kapalıyken Bildirim**: Kullanıcı sayfayı kapatsa bile bildirim alır
- **Telefon Bildirimleri Gibi**: Native uygulama bildirimleri gibi çalışır
- **İzin Sistemi**: Kullanıcı izin vermesi gerekir
- **Tıklama Desteği**: Bildirime tıklayınca sayfa açılır

### 2. Akıllı Bildirim Sistemi
- **Sessiz Saatler**: Gece 22:00-08:00 arası bildirim göndermez
- **Öncelikli Kişiler**: Belirli kişilerden gelen mesajlar her zaman bildirim olur
- **Acil Kelimeler**: "acil", "önemli", "deadline" gibi kelimeler içeren mesajlar öncelikli
- **Do Not Disturb**: Kullanıcı rahatsız edilmek istemiyorsa bildirimleri kapatabilir

### 3. Zengin Bildirimler
- **Gönderen Resmi**: Bildirimde gönderen kişinin resmi görünür
- **Mesaj Önizlemesi**: Mesajın ilk birkaç kelimesi görünür
- **Yanıtla Butonu**: Direkt yanıt verebilir
- **Okundu İşaretle**: Mesajı okundu olarak işaretleyebilir
- **Direkt Gitme**: Bildirime tıklayınca direkt o mesaja gider

### 4. Bildirim Türleri
- **Yeni Mesaj**: Genel mesaj bildirimleri
- **Mention**: Birisi sizi etiketlediğinde
- **Direkt Mesaj**: Özel mesaj geldiğinde
- **Kanal Bildirimi**: Önemli kanal duyuruları
- **Sistem Bildirimi**: Sistem güncellemeleri

## 🛠️ Teknik Detaylar

### Service Worker
- **Dosya**: `/public/sw.js`
- **Özellikler**:
  - Push event handling
  - Notification click events
  - Background sync
  - Offline caching

### Interface'ler
```typescript
interface PushNotification {
  id: string;
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  tag?: string;
  data?: any;
  actions?: NotificationAction[];
  requireInteraction?: boolean;
  silent?: boolean;
  timestamp: Date;
  type: 'message' | 'mention' | 'direct' | 'channel' | 'system';
  senderId?: string;
  senderName?: string;
  senderAvatar?: string;
  channelId?: string;
  channelName?: string;
  messageId?: string;
  priority: 'low' | 'normal' | 'high' | 'urgent';
  isRead: boolean;
}

interface NotificationSettings {
  enabled: boolean;
  silentHours: {
    enabled: boolean;
    start: string; // "22:00"
    end: string;   // "08:00"
  };
  priorityContacts: string[]; // User IDs
  urgentKeywords: string[]; // ["acil", "önemli", "deadline"]
  doNotDisturb: boolean;
  notificationTypes: {
    newMessage: boolean;
    mention: boolean;
    directMessage: boolean;
    channelAnnouncement: boolean;
    systemNotification: boolean;
  };
  soundEnabled: boolean;
  vibrationEnabled: boolean;
  showPreview: boolean;
  autoMarkAsRead: boolean;
}
```

### Ana Fonksiyonlar

#### 1. setupPushNotifications()
- Notification API desteğini kontrol eder
- Service Worker kaydı yapar
- İzin durumunu kontrol eder
- Ayarları localStorage'dan yükler

#### 2. createNotification(message: ChatMessage)
- Akıllı bildirim kurallarını uygular
- Tarayıcı notification'ı gösterir
- Notification geçmişine ekler
- Event handler'ları bağlar

#### 3. shouldShowNotification(message: ChatMessage)
- Sessiz saat kontrolü
- Öncelikli kişi kontrolü
- Acil kelime kontrolü
- Do not disturb kontrolü

#### 4. isSilentHours()
- Gece yarısını kapsayan sessiz saat hesaplaması
- 22:00-08:00 arası kontrol

## 🎨 UI Bileşenleri

### Notification Settings Modal
- **Erişim**: Header'daki zil ikonuna tıklayarak
- **Özellikler**:
  - Bildirim izni yönetimi
  - Genel ayarlar
  - Sessiz saatler
  - Bildirim türleri
  - Acil kelimeler
  - Bildirim geçmişi
  - Test butonu

### Header Notification Button
- **Konum**: Chat header'ında
- **Durumlar**:
  - 🔴 Kırmızı nokta: İzin verilmemiş
  - 🟢 Yeşil: İzin verilmiş

## 📱 Kullanım

### 1. İlk Kurulum
```javascript
// Component mount olduğunda otomatik çalışır
useEffect(() => {
  setupPushNotifications();
}, []);
```

### 2. Bildirim İzni İsteme
```javascript
const permission = await requestNotificationPermission();
if (permission) {
  console.log('Bildirim izni verildi');
}
```

### 3. Test Bildirimi
```javascript
// Settings modal'ında "Test Et" butonuna tıklayın
await testNotification();
```

### 4. Ayarları Güncelleme
```javascript
updateNotificationSettings({
  silentHours: { enabled: true, start: "23:00", end: "07:00" },
  urgentKeywords: ["acil", "önemli", "deadline", "kritik"]
});
```

## 🔧 Konfigürasyon

### Varsayılan Ayarlar
```javascript
const defaultSettings = {
  enabled: true,
  silentHours: {
    enabled: true,
    start: "22:00",
    end: "08:00"
  },
  urgentKeywords: ["acil", "önemli", "deadline", "urgent", "kritik"],
  doNotDisturb: false,
  notificationTypes: {
    newMessage: true,
    mention: true,
    directMessage: true,
    channelAnnouncement: true,
    systemNotification: true
  },
  soundEnabled: true,
  showPreview: true
};
```

### CSS Sınıfları
- `.notification-badge`: Bildirim rozeti animasyonu
- `.highlight-message`: Mesaj vurgulama animasyonu
- `.notification-priority-*`: Öncelik seviyesi renkleri
- `.notification-silent-hours`: Sessiz saat görünümü

## 🚨 Hata Yönetimi

### Yaygın Hatalar
1. **Notification API Desteklenmiyor**
   - Çözüm: Modern tarayıcı kullanın

2. **İzin Reddedildi**
   - Çözüm: Tarayıcı ayarlarından manuel olarak izin verin

3. **Service Worker Kaydı Başarısız**
   - Çözüm: HTTPS kullanın (localhost hariç)

### Debug
```javascript
// Console'da kontrol edin
console.log('Notification supported:', 'Notification' in window);
console.log('Permission:', Notification.permission);
console.log('Service Worker:', 'serviceWorker' in navigator);
```

## 🔮 Gelecek Özellikler

- [ ] Push server entegrasyonu
- [ ] Ses dosyası desteği
- [ ] Vibration API desteği
- [ ] Bildirim gruplandırma
- [ ] Otomatik temizleme
- [ ] Analytics entegrasyonu

## 📋 Gereksinimler

- Modern tarayıcı (Chrome 42+, Firefox 44+, Safari 16+)
- HTTPS (localhost hariç)
- Notification API desteği
- Service Worker desteği

## 🔒 Güvenlik

- Sadece HTTPS üzerinde çalışır
- Kullanıcı izni gerekir
- Veriler localStorage'da şifrelenmemiş saklanır
- Service Worker güvenli context'te çalışır
