import React, { useState } from 'react';
import Advanced3DGanttChart from './Advanced3DGanttChart';
import './3DGanttChart.css';

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

const Gantt3DDemo: React.FC = () => {
  const [showDependencies, setShowDependencies] = useState(true);
  const [showTimeline, setShowTimeline] = useState(true);
  const [selectedView, setSelectedView] = useState<'demo' | 'custom'>('demo');

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
    },
    {
      id: '5',
      name: 'Veritabanı Optimizasyonu',
      duration: 45,
      progress: 40,
      startDate: '2024-03-01',
      endDate: '2024-04-15',
      dependencies: ['3'],
      color: '#ff6b6b',
      priority: 'medium',
      assignee: 'Ali Veli'
    },
    {
      id: '6',
      name: 'Güvenlik Testleri',
      duration: 30,
      progress: 20,
      startDate: '2024-04-01',
      endDate: '2024-04-30',
      dependencies: ['1', '2'],
      color: '#4ecdc4',
      priority: 'high',
      assignee: 'Zeynep Arslan'
    }
  ];

  const [customTasks, setCustomTasks] = useState<Task[]>([
    {
      id: '1',
      name: 'Yeni Proje',
      duration: 30,
      progress: 0,
      startDate: '2024-01-01',
      endDate: '2024-01-30',
      dependencies: [],
      color: '#4285f4',
      priority: 'medium',
      assignee: 'Takım Üyesi'
    }
  ]);

  const addCustomTask = () => {
    const newTask: Task = {
      id: (customTasks.length + 1).toString(),
      name: `Task ${customTasks.length + 1}`,
      duration: 30,
      progress: 0,
      startDate: '2024-01-01',
      endDate: '2024-01-30',
      dependencies: [],
      color: `#${Math.floor(Math.random()*16777215).toString(16)}`,
      priority: 'medium',
      assignee: 'Takım Üyesi'
    };
    setCustomTasks([...customTasks, newTask]);
  };

  const updateCustomTask = (id: string, field: keyof Task, value: any) => {
    setCustomTasks(tasks => 
      tasks.map(task => 
        task.id === id ? { ...task, [field]: value } : task
      )
    );
  };

  const removeCustomTask = (id: string) => {
    setCustomTasks(tasks => tasks.filter(task => task.id !== id));
  };

  return (
    <div className="gantt-3d-demo">
      <div className="demo-header">
        <h1>🚀 3D Gantt Chart Demo</h1>
        <p>Gerçek 3D görselleştirme ile proje yönetimi</p>
      </div>

      <div className="demo-controls">
        <div className="view-selector">
          <button 
            className={selectedView === 'demo' ? 'active' : ''}
            onClick={() => setSelectedView('demo')}
          >
            📊 Demo Veriler
          </button>
          <button 
            className={selectedView === 'custom' ? 'active' : ''}
            onClick={() => setSelectedView('custom')}
          >
            ✏️ Özel Veriler
          </button>
        </div>

        <div className="display-options">
          <label>
            <input 
              type="checkbox" 
              checked={showDependencies} 
              onChange={(e) => setShowDependencies(e.target.checked)}
            />
            Bağımlılıkları Göster
          </label>
          <label>
            <input 
              type="checkbox" 
              checked={showTimeline} 
              onChange={(e) => setShowTimeline(e.target.checked)}
            />
            Zaman Çizelgesi
          </label>
        </div>
      </div>

      {selectedView === 'demo' ? (
        <Advanced3DGanttChart 
          tasks={demoTasks}
          width={1000}
          height={700}
          showDependencies={showDependencies}
          showTimeline={showTimeline}
        />
      ) : (
        <div className="custom-view">
          <div className="custom-controls">
            <button onClick={addCustomTask} className="add-task-btn">
              ➕ Yeni Task Ekle
            </button>
          </div>

          <div className="custom-tasks-editor">
            {customTasks.map(task => (
              <div key={task.id} className="task-editor-item">
                <div className="task-editor-header">
                  <h4>Task {task.id}</h4>
                  <button 
                    onClick={() => removeCustomTask(task.id)}
                    className="remove-task-btn"
                  >
                    ❌
                  </button>
                </div>
                
                <div className="task-editor-fields">
                  <div className="field-group">
                    <label>Ad:</label>
                    <input 
                      type="text" 
                      value={task.name}
                      onChange={(e) => updateCustomTask(task.id, 'name', e.target.value)}
                    />
                  </div>
                  
                  <div className="field-group">
                    <label>Süre (gün):</label>
                    <input 
                      type="number" 
                      value={task.duration}
                      onChange={(e) => updateCustomTask(task.id, 'duration', parseInt(e.target.value))}
                      min="1"
                    />
                  </div>
                  
                  <div className="field-group">
                    <label>İlerleme (%):</label>
                    <input 
                      type="number" 
                      value={task.progress}
                      onChange={(e) => updateCustomTask(task.id, 'progress', parseInt(e.target.value))}
                      min="0"
                      max="100"
                    />
                  </div>
                  
                  <div className="field-group">
                    <label>Öncelik:</label>
                    <select 
                      value={task.priority}
                      onChange={(e) => updateCustomTask(task.id, 'priority', e.target.value)}
                    >
                      <option value="low">Düşük</option>
                      <option value="medium">Orta</option>
                      <option value="high">Yüksek</option>
                    </select>
                  </div>
                  
                  <div className="field-group">
                    <label>Renk:</label>
                    <input 
                      type="color" 
                      value={task.color}
                      onChange={(e) => updateCustomTask(task.id, 'color', e.target.value)}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>

          <Advanced3DGanttChart 
            tasks={customTasks}
            width={1000}
            height={700}
            showDependencies={showDependencies}
            showTimeline={showTimeline}
          />
        </div>
      )}

      <div className="demo-features">
        <h3>🎯 Özellikler</h3>
        <div className="features-grid">
          <div className="feature-item">
            <h4>🌐 Gerçek 3D Görselleştirme</h4>
            <p>Three.js ile tam 3D ortamda proje görselleştirme</p>
          </div>
          <div className="feature-item">
            <h4>🎮 İnteraktif Kontroller</h4>
            <p>Fare ile döndürme, yakınlaştırma ve farklı açılardan görüntüleme</p>
          </div>
          <div className="feature-item">
            <h4>📊 İlerleme Gösterimi</h4>
            <p>Her task'ın ilerleme durumu 3D bloklarda görsel olarak gösterilir</p>
          </div>
          <div className="feature-item">
            <h4>🔗 Bağımlılık Bağlantıları</h4>
            <p>Task'lar arası bağımlılıklar 3D çizgilerle gösterilir</p>
          </div>
          <div className="feature-item">
            <h4>⏰ Zaman Çizelgesi</h4>
            <p>3D ortamda zaman ekseni ve işaretleri</p>
          </div>
          <div className="feature-item">
            <h4>🎨 Özelleştirilebilir</h4>
            <p>Renk, öncelik ve diğer özellikler özelleştirilebilir</p>
          </div>
        </div>
      </div>

      <div className="demo-instructions">
        <h3>📖 Kullanım Talimatları</h3>
        <ul>
          <li><strong>Fare ile Döndürme:</strong> Sol tık + sürükle</li>
          <li><strong>Yakınlaştırma:</strong> Fare tekerleği</li>
          <li><strong>Pan:</strong> Sağ tık + sürükle</li>
          <li><strong>Task Seçimi:</strong> Task'lara tıklayarak detayları görüntüleyin</li>
          <li><strong>Görünüm Değiştirme:</strong> Alt kısımdaki butonları kullanın</li>
        </ul>
      </div>
    </div>
  );
};

export default Gantt3DDemo;
