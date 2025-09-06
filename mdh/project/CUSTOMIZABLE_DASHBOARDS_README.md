# Customizable Dashboards - Gelişmiş Widget Yönetim Sistemi

Bu dokümantasyon, yeni geliştirilen Customizable Dashboards sisteminin tüm özelliklerini ve kullanımını açıklar.

## 🚀 Yeni Özellikler

### 1. Çoklu Görünüm Modları
- **Grid Görünümü**: Klasik grid layout ile widget düzenleme
- **Liste Görünümü**: Tablo formatında widget yönetimi
- **Kanban Görünümü**: Sürükle-bırak ile sütunlar arası widget taşıma

### 2. Sütun Yönetimi (Kanban)
- Sütun ekleme, düzenleme ve silme
- Renk kodlaması ile sütun kategorileri
- Widget sayısı gösterimi
- Sürükle-bırak ile widget taşıma

### 3. Gelişmiş Widget Yönetimi
- Widget ekleme, düzenleme, gizleme ve silme
- Widget kilitleme özelliği
- Görünürlük kontrolü
- Boyut yönetimi

## 📋 Bileşen Yapısı

### Ana Bileşenler

#### 1. DashboardManager
Ana dashboard yönetim bileşeni. Tüm görünüm modlarını koordine eder.

```tsx
<DashboardManager
  currentLayout={currentLayout}
  onLayoutChange={handleLayoutChange}
  onLayoutSave={handleLayoutSave}
  onLayoutDelete={handleLayoutDelete}
/>
```

#### 2. ViewSwitcher
Görünüm modları arasında geçiş yapmak için kullanılan bileşen.

```tsx
<ViewSwitcher
  currentView={currentLayout.viewType}
  onViewChange={handleViewChange}
/>
```

#### 3. ColumnManager
Kanban sütunlarını yönetmek için kullanılan bileşen.

```tsx
<ColumnManager
  columns={currentLayout.kanbanColumns}
  onColumnsChange={handleColumnsChange}
  isEditing={isEditing}
/>
```

#### 4. ListView
Widget'ları liste formatında gösteren bileşen.

```tsx
<ListView
  widgets={currentLayout.widgets}
  isEditing={isEditing}
  onWidgetUpdate={handleWidgetUpdate}
  onWidgetDelete={handleWidgetDelete}
/>
```

#### 5. KanbanView
Widget'ları kanban formatında gösteren bileşen.

```tsx
<KanbanView
  widgets={currentLayout.widgets}
  columns={currentLayout.kanbanColumns}
  isEditing={isEditing}
  onWidgetUpdate={handleWidgetUpdate}
  onWidgetDelete={handleWidgetDelete}
  onColumnsChange={handleColumnsChange}
/>
```

## 🔧 Veri Yapıları

### DashboardLayout Interface

```typescript
interface DashboardLayout {
  id: string;
  name: string;
  description?: string;
  widgets: Widget[];
  columns: number;
  rows: number;
  gap: number;
  padding: number;
  background?: string;
  theme?: 'light' | 'dark' | 'auto';
  viewType: ViewType; // 'grid' | 'list' | 'kanban'
  kanbanColumns: Column[];
}
```

### Widget Interface

```typescript
interface Widget {
  id: string;
  type: WidgetType;
  title: string;
  position: WidgetPosition;
  size: WidgetSize;
  visible: boolean;
  locked: boolean;
  data?: any;
  config?: any;
  content?: ReactNode;
}
```

### Column Interface

```typescript
interface Column {
  id: string;
  title: string;
  color: string;
  order: number;
  widgetIds: string[];
}
```

## 🎯 Kullanım Örnekleri

### Temel Kullanım

```tsx
import React, { useState } from 'react';
import { DashboardManager, DashboardLayout } from './components/common/CustomizableDashboards';

const MyDashboard = () => {
  const [currentLayout, setCurrentLayout] = useState<DashboardLayout>({
    id: 'main-dashboard',
    name: 'Ana Dashboard',
    widgets: [],
    columns: 4,
    rows: 4,
    gap: 16,
    padding: 16,
    viewType: 'grid',
    kanbanColumns: []
  });

  const handleLayoutChange = (layout: DashboardLayout) => {
    setCurrentLayout(layout);
  };

  const handleLayoutSave = (layout: DashboardLayout) => {
    // API çağrısı veya local storage
    localStorage.setItem('dashboard', JSON.stringify(layout));
  };

  return (
    <DashboardManager
      currentLayout={currentLayout}
      onLayoutChange={handleLayoutChange}
      onLayoutSave={handleLayoutSave}
      onLayoutDelete={() => {}}
    />
  );
};
```

### Kanban Sütunları ile Başlangıç

```tsx
const initialColumns = [
  {
    id: 'todo',
    title: 'Yapılacaklar',
    color: '#3B82F6',
    order: 0,
    widgetIds: []
  },
  {
    id: 'in-progress',
    title: 'Devam Eden',
    color: '#F59E0B',
    order: 1,
    widgetIds: []
  },
  {
    id: 'done',
    title: 'Tamamlanan',
    color: '#10B981',
    order: 2,
    widgetIds: []
  }
];

const [currentLayout, setCurrentLayout] = useState<DashboardLayout>({
  // ... diğer özellikler
  viewType: 'kanban',
  kanbanColumns: initialColumns
});
```

## 🎨 Özelleştirme

### Widget Tipleri

Sistem aşağıdaki widget tiplerini destekler:

- `chart` - Grafik widget'ları
- `stat` - İstatistik widget'ları
- `table` - Tablo widget'ları
- `list` - Liste widget'ları
- `calendar` - Takvim widget'ları
- `clock` - Saat widget'ları
- `weather` - Hava durumu widget'ları
- `news` - Haber widget'ları
- `social` - Sosyal medya widget'ları
- `media` - Medya widget'ları
- `text` - Metin widget'ları
- `image` - Resim widget'ları
- `video` - Video widget'ları
- `audio` - Ses widget'ları
- `form` - Form widget'ları
- `button` - Buton widget'ları
- `link` - Bağlantı widget'ları
- `iframe` - Iframe widget'ları
- `custom` - Özel widget'lar

### Widget Boyutları

- `small` - Küçük (w-48 h-32)
- `medium` - Orta (w-64 h-48)
- `large` - Büyük (w-80 h-64)
- `xlarge` - Çok Büyük (w-96 h-80)

## 🔄 Event Handlers

### Layout Değişiklikleri

```tsx
const handleLayoutChange = (layout: DashboardLayout) => {
  // Layout güncellemelerini handle et
  setCurrentLayout(layout);
  
  // Otomatik kaydetme (opsiyonel)
  debouncedSave(layout);
};
```

### Widget Güncellemeleri

```tsx
const handleWidgetUpdate = (updatedWidget: Widget) => {
  const updatedLayout = {
    ...currentLayout,
    widgets: currentLayout.widgets.map(widget =>
      widget.id === updatedWidget.id ? updatedWidget : widget
    )
  };
  setCurrentLayout(updatedLayout);
};
```

### Sütun Güncellemeleri

```tsx
const handleColumnsChange = (columns: Column[]) => {
  const updatedLayout = {
    ...currentLayout,
    kanbanColumns: columns
  };
  setCurrentLayout(updatedLayout);
};
```

## 🎭 Animasyonlar

Sistem, kullanıcı deneyimini artırmak için çeşitli animasyonlar kullanır:

- **Widget Ekleme**: `bounceIn` animasyonu
- **Widget Silme**: `scaleOut` animasyonu
- **Sütun Ekleme**: `slideInUp` animasyonu
- **Sütun Silme**: `scaleOut` animasyonu
- **Widget Taşıma**: `bounceIn` animasyonu

## 🔧 Gelişmiş Özellikler

### Drag & Drop

Kanban görünümünde widget'lar sürüklenebilir:

```tsx
// Widget'ı sürükle
const handleDragStart = (e: DragEvent, widgetId: string) => {
  e.dataTransfer.setData('text/plain', widgetId);
};

// Widget'ı bırak
const handleDrop = (e: DragEvent, targetColumnId: string) => {
  const widgetId = e.dataTransfer.getData('text/plain');
  // Widget'ı hedef sütuna taşı
};
```

### Responsive Tasarım

Tüm bileşenler responsive tasarım prensiplerine uygun olarak geliştirilmiştir:

- Mobil cihazlarda otomatik düzen ayarlaması
- Touch-friendly etkileşimler
- Esnek grid sistemi

### Dark Mode Desteği

Sistem tam dark mode desteği sunar:

```tsx
const layout: DashboardLayout = {
  // ... diğer özellikler
  theme: 'dark' // 'light' | 'dark' | 'auto'
};
```

## 📱 Mobil Uyumluluk

- Touch gesture desteği
- Responsive grid sistemi
- Mobil-optimized widget boyutları
- Swipe gesture'ları

## 🔒 Güvenlik

- Widget kilitleme sistemi
- Görünürlük kontrolü
- Güvenli drag & drop işlemleri
- Input validation

## 🚀 Performans

- Lazy loading widget'ları
- Optimized re-rendering
- Efficient drag & drop
- Memory leak prevention

## 📚 Örnek Projeler

Tam çalışan örnekler için `src/components/examples/DashboardExample.tsx` dosyasını inceleyebilirsiniz.

## 🤝 Katkıda Bulunma

Yeni özellikler eklemek veya mevcut özellikleri geliştirmek için:

1. Yeni widget tipleri ekleyin
2. Animasyon sistemini genişletin
3. Yeni görünüm modları geliştirin
4. Performans optimizasyonları yapın

## 📄 Lisans

Bu proje MIT lisansı altında lisanslanmıştır.
