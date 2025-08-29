import React from 'react';
import Advanced3DGanttChart from './Advanced3DGanttChart';

interface Task {
  id: string;
  name: string;
  duration: number;
  progress: number;
  startDate: string;
  endDate: string;
  dependencies?: string[];
  color?: string;
  priority?: 'low' | 'medium' | 'high';
  assignee?: string;
}

const Simple3DGanttDemo: React.FC = () => {
  // Demo verileri
  const demoTasks: Task[] = [
    {
      id: '1',
      name: 'E-ticaret Platformu Geliştirme',
      duration: 167,
      progress: 65,
      startDate: '2024-01-15',
      endDate: '2024-06-30',
      dependencies: ['2'],
      color: '#4285f4',
      priority: 'high',
      assignee: 'Ahmet Yılmaz'
    },
    {
      id: '2',
      name: 'Mobil Uygulama Geliştirme',
      duration: 183,
      progress: 15,
      startDate: '2024-02-01',
      endDate: '2024-08-01',
      dependencies: ['3'],
      color: '#ea4335',
      priority: 'medium',
      assignee: 'Fatma Demir'
    },
    {
      id: '3',
      name: 'CRM Sistemi Entegrasyonu',
      duration: 120,
      progress: 85,
      startDate: '2024-01-01',
      endDate: '2024-04-30',
      dependencies: [],
      color: '#fbbc04',
      priority: 'high',
      assignee: 'Mehmet Kaya'
    },
    {
      id: '4',
      name: 'Web Sitesi Yenileme',
      duration: 90,
      progress: 100,
      startDate: '2024-01-01',
      endDate: '2024-03-31',
      dependencies: ['1'],
      color: '#34a853',
      priority: 'low',
      assignee: 'Ayşe Özkan'
    }
  ];

  return (
    <div className="p-6 bg-gradient-to-br from-blue-50 to-purple-50 min-h-screen">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-4">
            🌐 3D Gantt Chart Demo
          </h1>
          <p className="text-lg text-gray-600">
            Gerçek 3D görselleştirme ile proje yönetimi
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-xl p-6">
          <Advanced3DGanttChart 
            tasks={demoTasks}
            width={1000}
            height={700}
            showDependencies={true}
            showTimeline={true}
          />
        </div>

        <div className="mt-8 bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">
            🎯 Özellikler
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="p-4 bg-blue-50 rounded-lg">
              <h3 className="font-semibold text-blue-800 mb-2">🌐 Gerçek 3D Görselleştirme</h3>
              <p className="text-blue-600 text-sm">Three.js ile tam 3D ortamda proje görselleştirme</p>
            </div>
            <div className="p-4 bg-green-50 rounded-lg">
              <h3 className="font-semibold text-green-800 mb-2">🎮 İnteraktif Kontroller</h3>
              <p className="text-green-600 text-sm">Fare ile döndürme, yakınlaştırma ve farklı açılardan görüntüleme</p>
            </div>
            <div className="p-4 bg-purple-50 rounded-lg">
              <h3 className="font-semibold text-purple-800 mb-2">📊 İlerleme Gösterimi</h3>
              <p className="text-purple-600 text-sm">Her task'ın ilerleme durumu 3D bloklarda görsel olarak gösterilir</p>
            </div>
            <div className="p-4 bg-orange-50 rounded-lg">
              <h3 className="font-semibold text-orange-800 mb-2">🔗 Bağımlılık Bağlantıları</h3>
              <p className="text-orange-600 text-sm">Task'lar arası bağımlılıklar 3D çizgilerle gösterilir</p>
            </div>
            <div className="p-4 bg-red-50 rounded-lg">
              <h3 className="font-semibold text-red-800 mb-2">⏰ Zaman Çizelgesi</h3>
              <p className="text-red-600 text-sm">3D ortamda zaman ekseni ve işaretleri</p>
            </div>
            <div className="p-4 bg-indigo-50 rounded-lg">
              <h3 className="font-semibold text-indigo-800 mb-2">🎨 Özelleştirilebilir</h3>
              <p className="text-indigo-600 text-sm">Renk, öncelik ve diğer özellikler özelleştirilebilir</p>
            </div>
          </div>
        </div>

        <div className="mt-8 bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">
            📖 Kullanım Talimatları
          </h2>
          <div className="space-y-2 text-gray-600">
            <p><strong>Fare ile Döndürme:</strong> Sol tık + sürükle</p>
            <p><strong>Yakınlaştırma:</strong> Fare tekerleği</p>
            <p><strong>Pan:</strong> Sağ tık + sürükle</p>
            <p><strong>Task Seçimi:</strong> Task'lara tıklayarak detayları görüntüleyin</p>
            <p><strong>Görünüm Değiştirme:</strong> Alt kısımdaki butonları kullanın</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Simple3DGanttDemo;
