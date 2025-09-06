import React, { useState } from 'react';
import { 
  DashboardManager, 
  DashboardLayout, 
  Widget, 
  Column 
} from '../common/CustomizableDashboards';

// Örnek Dashboard Kullanımı
export const DashboardExample: React.FC = () => {
  // Örnek sütunlar
  const initialColumns: Column[] = [
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

  // Örnek widget'lar
  const initialWidgets: Widget[] = [
    {
      id: 'widget-1',
      type: 'chart',
      title: 'Satış Grafiği',
      position: { x: 0, y: 0, w: 2, h: 2 },
      size: 'medium',
      visible: true,
      locked: false
    },
    {
      id: 'widget-2',
      type: 'stat',
      title: 'Toplam Müşteri',
      position: { x: 2, y: 0, w: 1, h: 1 },
      size: 'small',
      visible: true,
      locked: false
    },
    {
      id: 'widget-3',
      type: 'table',
      title: 'Son Siparişler',
      position: { x: 0, y: 2, w: 3, h: 2 },
      size: 'large',
      visible: true,
      locked: false
    }
  ];

  // Dashboard layout state
  const [currentLayout, setCurrentLayout] = useState<DashboardLayout>({
    id: 'main-dashboard',
    name: 'Ana Dashboard',
    description: 'Ana işletme dashboard\'u',
    widgets: initialWidgets,
    columns: 4,
    rows: 4,
    gap: 16,
    padding: 16,
    background: '#f8fafc',
    theme: 'light',
    viewType: 'grid',
    kanbanColumns: initialColumns
  });

  // Layout değişikliklerini handle et
  const handleLayoutChange = (layout: DashboardLayout) => {
    setCurrentLayout(layout);
    console.log('Layout güncellendi:', layout);
  };

  // Layout kaydetme
  const handleLayoutSave = (layout: DashboardLayout) => {
    // Burada API çağrısı yapılabilir
    console.log('Layout kaydedildi:', layout);
    
    // Local storage'a kaydet
    localStorage.setItem('dashboard-layout', JSON.stringify(layout));
  };

  // Layout silme (şimdilik kullanılmıyor)
  const handleLayoutDelete = (layoutId: string) => {
    console.log('Layout silindi:', layoutId);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">
            Dashboard Örneği
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Bu örnek, yeni dashboard widget yönetim sisteminin tüm özelliklerini gösterir:
          </p>
          <ul className="mt-2 text-sm text-gray-600 dark:text-gray-400 list-disc list-inside">
            <li><strong>Grid Görünümü:</strong> Klasik grid layout ile widget düzenleme</li>
            <li><strong>Liste Görünümü:</strong> Tablo formatında widget yönetimi</li>
            <li><strong>Kanban Görünümü:</strong> Sürükle-bırak ile sütunlar arası widget taşıma</li>
            <li><strong>Sütun Yönetimi:</strong> Kanban sütunlarını ekleme, düzenleme ve silme</li>
            <li><strong>Widget Yönetimi:</strong> Widget ekleme, düzenleme, gizleme ve silme</li>
          </ul>
        </div>

        <DashboardManager
          currentLayout={currentLayout}
          onLayoutChange={handleLayoutChange}
          onLayoutSave={handleLayoutSave}
          onLayoutDelete={handleLayoutDelete}
        />

        {/* Kullanım Talimatları */}
        <div className="mt-8 bg-white dark:bg-gray-800 rounded-xl shadow-soft border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
            Kullanım Talimatları
          </h3>
          
          <div className="grid md:grid-cols-3 gap-6">
            <div>
              <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-2">
                🎯 Görünüm Değiştirme
              </h4>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Üst kısımdaki Grid, Liste, Kanban butonları ile görünüm modları arasında geçiş yapabilirsiniz.
              </p>
            </div>
            
            <div>
              <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-2">
                ✏️ Düzenleme Modu
              </h4>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                "Düzenle" butonuna tıklayarak düzenleme modunu açın. Widget ekleyebilir, silebilir ve düzenleyebilirsiniz.
              </p>
            </div>
            
            <div>
              <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-2">
                📋 Sütun Yönetimi
              </h4>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Kanban görünümünde "Sütun Yönetimi" butonu ile sütunları ekleyebilir, düzenleyebilir ve silebilirsiniz.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardExample;
