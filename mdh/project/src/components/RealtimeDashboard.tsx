import React, { useEffect, useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { 
  RefreshCw, 
  Settings, 
  Plus, 
  X, 
  Move,
  BarChart3,
  TrendingUp,
  Activity,
  MessageSquare,
  Clock,
  DollarSign,
  Users,
  Star,
  AlertTriangle,
  CheckCircle
} from 'lucide-react';
import { Responsive, WidthProvider } from 'react-grid-layout';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, Area, AreaChart } from 'recharts';
import { toast } from 'react-hot-toast';
import 'react-grid-layout/css/styles.css';
import 'react-resizable/css/styles.css';

const ResponsiveGridLayout = WidthProvider(Responsive);

interface DashboardWidget {
  id: string;
  widget_type: 'metric' | 'chart' | 'table';
  widget_config: any;
  position: { x: number; y: number; w: number; h: number };
  refresh_interval: number;
  is_active: boolean;
}

interface RealtimeMetrics {
  tickets_open: number;
  tickets_resolved_today: number;
  avg_resolution_time_hours: number;
  total_revenue_today: number;
  customer_satisfaction_avg: number;
  calculated_at: string;
}

const RealtimeDashboard: React.FC = () => {
  const [widgets, setWidgets] = useState<DashboardWidget[]>([]);
  const [metrics, setMetrics] = useState<RealtimeMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [showAddWidget, setShowAddWidget] = useState(false);
  const [editingWidget, setEditingWidget] = useState<string | null>(null);
  const [layout, setLayout] = useState<any[]>([]);

  // Yeni widget formu
  const [newWidget, setNewWidget] = useState({
    widget_type: 'metric' as const,
    title: '',
    metric: 'tickets_open',
    chart_type: 'line',
    refresh_interval: 300
  });

  useEffect(() => {
    loadWidgets();
    loadMetrics();
    
    // Gerçek zamanlı güncelleme için interval
    const interval = setInterval(loadMetrics, 30000); // 30 saniyede bir güncelle
    
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    // Layout'u widget'lardan oluştur
    const newLayout = widgets.map(widget => ({
      i: widget.id,
      x: widget.position.x,
      y: widget.position.y,
      w: widget.position.w,
      h: widget.position.h,
      minW: 2,
      minH: 1
    }));
    setLayout(newLayout);
  }, [widgets]);

  const loadWidgets = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('dashboard_widgets')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setWidgets(data || []);
    } catch (error) {
      console.error('Widget\'lar yüklenirken hata:', error);
      toast.error('Widget\'lar yüklenemedi');
    } finally {
      setLoading(false);
    }
  };

  const loadMetrics = async () => {
    try {
      const { data, error } = await supabase.rpc('calculate_realtime_metrics');
      if (error) throw error;
      setMetrics(data);
    } catch (error) {
      console.error('Metrikler yüklenirken hata:', error);
    }
  };

  const createWidget = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const widgetConfig = {
        title: newWidget.title,
        ...(newWidget.widget_type === 'metric' && { metric: newWidget.metric }),
        ...(newWidget.widget_type === 'chart' && { chart_type: newWidget.chart_type })
      };

      // Yeni widget için pozisyon hesapla
      const maxY = widgets.length > 0 ? Math.max(...widgets.map(w => w.position.y + w.position.h)) : 0;
      const position = { x: 0, y: maxY, w: 3, h: 2 };

      const { data, error } = await supabase
        .from('dashboard_widgets')
        .insert({
          user_id: user.id,
          widget_type: newWidget.widget_type,
          widget_config: widgetConfig,
          position: position,
          refresh_interval: newWidget.refresh_interval
        })
        .select()
        .single();

      if (error) throw error;

      toast.success('Widget başarıyla oluşturuldu');
      setShowAddWidget(false);
      setNewWidget({
        widget_type: 'metric',
        title: '',
        metric: 'tickets_open',
        chart_type: 'line',
        refresh_interval: 300
      });
      loadWidgets();
    } catch (error) {
      console.error('Widget oluşturulurken hata:', error);
      toast.error('Widget oluşturulamadı');
    }
  };

  const deleteWidget = async (widgetId: string) => {
    try {
      const { error } = await supabase
        .from('dashboard_widgets')
        .delete()
        .eq('id', widgetId);

      if (error) throw error;

      toast.success('Widget başarıyla silindi');
      loadWidgets();
    } catch (error) {
      console.error('Widget silinirken hata:', error);
      toast.error('Widget silinemedi');
    }
  };

  const onLayoutChange = useCallback(async (newLayout: any[]) => {
    setLayout(newLayout);
    
    // Layout değişikliklerini veritabanına kaydet
    for (const item of newLayout) {
      const widget = widgets.find(w => w.id === item.i);
      if (widget) {
        try {
          await supabase
            .from('dashboard_widgets')
            .update({
              position: { x: item.x, y: item.y, w: item.w, h: item.h }
            })
            .eq('id', item.i);
        } catch (error) {
          console.error('Widget pozisyonu güncellenirken hata:', error);
        }
      }
    }
  }, [widgets]);

  const getMetricValue = (metricKey: string) => {
    if (!metrics) return 0;
    return metrics[metricKey as keyof RealtimeMetrics] || 0;
  };

  const getMetricDisplayName = (key: string) => {
    const metricNames: { [key: string]: string } = {
      'tickets_open': 'Açık Talepler',
      'tickets_resolved_today': 'Bugün Çözülen',
      'avg_resolution_time_hours': 'Ort. Çözüm Süresi',
      'total_revenue_today': 'Bugünkü Gelir',
      'customer_satisfaction_avg': 'Müşteri Memnuniyeti'
    };
    return metricNames[key] || key;
  };

  const getMetricIcon = (key: string) => {
    const icons: { [key: string]: any } = {
      'tickets_open': MessageSquare,
      'tickets_resolved_today': CheckCircle,
      'avg_resolution_time_hours': Clock,
      'total_revenue_today': DollarSign,
      'customer_satisfaction_avg': Star
    };
    return icons[key] || Activity;
  };

  const getMetricColor = (key: string) => {
    const colors: { [key: string]: string } = {
      'tickets_open': 'text-blue-600',
      'tickets_resolved_today': 'text-green-600',
      'avg_resolution_time_hours': 'text-orange-600',
      'total_revenue_today': 'text-purple-600',
      'customer_satisfaction_avg': 'text-yellow-600'
    };
    return colors[key] || 'text-gray-600';
  };

  const renderMetricWidget = (widget: DashboardWidget) => {
    const metricKey = widget.widget_config.metric;
    const value = getMetricValue(metricKey);
    const Icon = getMetricIcon(metricKey);
    const color = getMetricColor(metricKey);

    return (
      <div className="h-full flex flex-col">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">{widget.widget_config.title}</h3>
          <div className="flex items-center gap-2">
            <Icon className={`w-5 h-5 ${color}`} />
            <button
              onClick={() => deleteWidget(widget.id)}
              className="text-gray-400 hover:text-red-500 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className={`text-3xl font-bold ${color}`}>
              {metricKey === 'total_revenue_today' ? `₺${value.toLocaleString()}` : 
               metricKey === 'avg_resolution_time_hours' ? `${value.toFixed(1)}s` :
               metricKey === 'customer_satisfaction_avg' ? `${value.toFixed(1)}/5` :
               value.toLocaleString()}
            </div>
            <div className="text-sm text-gray-600 mt-1">
              {getMetricDisplayName(metricKey)}
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderChartWidget = (widget: DashboardWidget) => {
    // Örnek chart verisi
    const chartData = [
      { time: '09:00', value: 12 },
      { time: '10:00', value: 15 },
      { time: '11:00', value: 18 },
      { time: '12:00', value: 22 },
      { time: '13:00', value: 19 },
      { time: '14:00', value: 25 },
      { time: '15:00', value: 28 }
    ];

    return (
      <div className="h-full flex flex-col">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">{widget.widget_config.title}</h3>
          <button
            onClick={() => deleteWidget(widget.id)}
            className="text-gray-400 hover:text-red-500 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="flex-1">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="time" />
              <YAxis />
              <Tooltip />
              <Line type="monotone" dataKey="value" stroke="#3b82f6" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    );
  };

  const renderWidget = (widget: DashboardWidget) => {
    switch (widget.widget_type) {
      case 'metric':
        return renderMetricWidget(widget);
      case 'chart':
        return renderChartWidget(widget);
      default:
        return <div>Bilinmeyen widget türü</div>;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Gerçek Zamanlı Dashboard</h2>
          <p className="text-gray-600 mt-1">Özelleştirilebilir widget'lar ile anlık metrikler</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={loadMetrics}
            className="flex items-center gap-2 text-gray-600 hover:text-blue-600 transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            Yenile
          </button>
          <button
            onClick={() => setShowAddWidget(true)}
            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Widget Ekle
          </button>
        </div>
      </div>

      {/* Son Güncelleme Bilgisi */}
      {metrics && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
          <div className="flex items-center gap-2 text-sm text-blue-800">
            <Activity className="w-4 h-4" />
            <span>Son güncelleme: {new Date(metrics.calculated_at).toLocaleTimeString('tr-TR')}</span>
          </div>
        </div>
      )}

      {/* Dashboard Grid */}
      <div className="bg-gray-50 rounded-lg p-4 min-h-[600px]">
        {widgets.length === 0 ? (
          <div className="text-center py-12">
            <BarChart3 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Henüz widget yok</h3>
            <p className="text-gray-600 mb-4">Dashboard'unuzu özelleştirmek için widget ekleyin.</p>
            <button
              onClick={() => setShowAddWidget(true)}
              className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors mx-auto"
            >
              <Plus className="w-4 h-4" />
              İlk Widget'ı Ekle
            </button>
          </div>
        ) : (
          <ResponsiveGridLayout
            className="layout"
            layouts={{ lg: layout }}
            breakpoints={{ lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0 }}
            cols={{ lg: 12, md: 10, sm: 6, xs: 4, xxs: 2 }}
            rowHeight={100}
            onLayoutChange={onLayoutChange}
            isDraggable={true}
            isResizable={true}
            margin={[16, 16]}
          >
            {widgets.map((widget) => (
              <div key={widget.id} className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm">
                {renderWidget(widget)}
              </div>
            ))}
          </ResponsiveGridLayout>
        )}
      </div>

      {/* Add Widget Modal */}
      {showAddWidget && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Yeni Widget Ekle</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Widget Türü
                </label>
                <select
                  value={newWidget.widget_type}
                  onChange={(e) => setNewWidget({ ...newWidget, widget_type: e.target.value as any })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="metric">Metrik</option>
                  <option value="chart">Grafik</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Başlık
                </label>
                <input
                  type="text"
                  value={newWidget.title}
                  onChange={(e) => setNewWidget({ ...newWidget, title: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Widget başlığı"
                />
              </div>

              {newWidget.widget_type === 'metric' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Metrik
                  </label>
                  <select
                    value={newWidget.metric}
                    onChange={(e) => setNewWidget({ ...newWidget, metric: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="tickets_open">Açık Talepler</option>
                    <option value="tickets_resolved_today">Bugün Çözülen</option>
                    <option value="avg_resolution_time_hours">Ort. Çözüm Süresi</option>
                    <option value="total_revenue_today">Bugünkü Gelir</option>
                    <option value="customer_satisfaction_avg">Müşteri Memnuniyeti</option>
                  </select>
                </div>
              )}

              {newWidget.widget_type === 'chart' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Grafik Türü
                  </label>
                  <select
                    value={newWidget.chart_type}
                    onChange={(e) => setNewWidget({ ...newWidget, chart_type: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="line">Çizgi Grafik</option>
                    <option value="bar">Sütun Grafik</option>
                    <option value="area">Alan Grafik</option>
                  </select>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Yenileme Aralığı (saniye)
                </label>
                <input
                  type="number"
                  value={newWidget.refresh_interval}
                  onChange={(e) => setNewWidget({ ...newWidget, refresh_interval: parseInt(e.target.value) })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  min="30"
                  max="3600"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => setShowAddWidget(false)}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                İptal
              </button>
              <button
                onClick={createWidget}
                disabled={!newWidget.title}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
              >
                Ekle
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RealtimeDashboard;
