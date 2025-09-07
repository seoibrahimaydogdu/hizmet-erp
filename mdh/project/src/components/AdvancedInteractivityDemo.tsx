import React, { useState, useCallback } from 'react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area
} from 'recharts';
import { 
  TrendingUp, 
  BarChart3, 
  PieChart as PieChartIcon,
  Activity,
  Settings,
  Play,
  Pause,
  RotateCcw
} from 'lucide-react';
import { AdvancedChartInteractivity, DataPoint, ChartAnnotation } from './common/AdvancedChartInteractivity';
import { toast } from 'react-hot-toast';

const AdvancedInteractivityDemo: React.FC = () => {
  const [activeChart, setActiveChart] = useState<'bar' | 'line' | 'pie' | 'area'>('bar');
  const [isPlaying, setIsPlaying] = useState(false);
  const [animationSpeed, setAnimationSpeed] = useState(1000);

  // Sample data
  const [barData, setBarData] = useState<DataPoint[]>([
    { id: '1', x: 'Ocak', y: 400, label: 'Ocak Satışları', editable: true },
    { id: '2', x: 'Şubat', y: 300, label: 'Şubat Satışları', editable: true },
    { id: '3', x: 'Mart', y: 200, label: 'Mart Satışları', editable: true },
    { id: '4', x: 'Nisan', y: 278, label: 'Nisan Satışları', editable: true },
    { id: '5', x: 'Mayıs', y: 189, label: 'Mayıs Satışları', editable: true },
    { id: '6', x: 'Haziran', y: 239, label: 'Haziran Satışları', editable: true },
  ]);

  const [lineData, setLineData] = useState<DataPoint[]>([
    { id: '1', x: '00:00', y: 400, label: 'Gece Yarısı', editable: true },
    { id: '2', x: '04:00', y: 300, label: 'Sabah Erken', editable: true },
    { id: '3', x: '08:00', y: 200, label: 'Sabah', editable: true },
    { id: '4', x: '12:00', y: 278, label: 'Öğle', editable: true },
    { id: '5', x: '16:00', y: 189, label: 'Öğleden Sonra', editable: true },
    { id: '6', x: '20:00', y: 239, label: 'Akşam', editable: true },
  ]);

  const [pieData, setPieData] = useState<DataPoint[]>([
    { id: '1', x: 'Teknik', y: 35, label: 'Teknik Destek', editable: true },
    { id: '2', x: 'Faturalandırma', y: 25, label: 'Faturalandırma', editable: true },
    { id: '3', x: 'Genel', y: 20, label: 'Genel Sorular', editable: true },
    { id: '4', x: 'Hesap', y: 20, label: 'Hesap Yönetimi', editable: true },
  ]);

  const [areaData, setAreaData] = useState<DataPoint[]>([
    { id: '1', x: 'Pzt', y: 12, label: 'Pazartesi', editable: true },
    { id: '2', x: 'Sal', y: 19, label: 'Salı', editable: true },
    { id: '3', x: 'Çar', y: 15, label: 'Çarşamba', editable: true },
    { id: '4', x: 'Per', y: 22, label: 'Perşembe', editable: true },
    { id: '5', x: 'Cum', y: 18, label: 'Cuma', editable: true },
    { id: '6', x: 'Cmt', y: 8, label: 'Cumartesi', editable: true },
    { id: '7', x: 'Paz', y: 5, label: 'Pazar', editable: true },
  ]);

  // Data update handlers
  const handleBarDataUpdate = useCallback((updatedData: DataPoint[]) => {
    setBarData(updatedData);
  }, []);

  const handleLineDataUpdate = useCallback((updatedData: DataPoint[]) => {
    setLineData(updatedData);
  }, []);

  const handlePieDataUpdate = useCallback((updatedData: DataPoint[]) => {
    setPieData(updatedData);
  }, []);

  const handleAreaDataUpdate = useCallback((updatedData: DataPoint[]) => {
    setAreaData(updatedData);
  }, []);

  // Annotation handlers
  const handleAnnotationAdd = useCallback((annotation: ChartAnnotation) => {
    console.log('Annotation added:', annotation);
    toast.success('Not eklendi');
  }, []);

  const handleAnnotationUpdate = useCallback((annotation: ChartAnnotation) => {
    console.log('Annotation updated:', annotation);
    toast.success('Not güncellendi');
  }, []);

  const handleAnnotationDelete = useCallback((annotationId: string) => {
    console.log('Annotation deleted:', annotationId);
    toast.success('Not silindi');
  }, []);

  // Animation
  const animateData = useCallback(() => {
    if (!isPlaying) return;

    const updateData = (data: DataPoint[], setter: (data: DataPoint[]) => void) => {
      const newData = data.map(point => ({
        ...point,
        y: Math.max(0, point.y + (Math.random() - 0.5) * 50)
      }));
      setter(newData);
    };

    updateData(barData, setBarData);
    updateData(lineData, setLineData);
    updateData(pieData, setPieData);
    updateData(areaData, setAreaData);

    setTimeout(animateData, animationSpeed);
  }, [isPlaying, animationSpeed, barData, lineData, pieData, areaData]);

  React.useEffect(() => {
    if (isPlaying) {
      animateData();
    }
  }, [isPlaying, animateData]);

  // Chart colors
  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];

  // Render chart based on active type
  const renderChart = () => {
    const commonProps = {
      width: 800,
      height: 400,
      margin: { top: 20, right: 30, left: 20, bottom: 5 }
    };

    switch (activeChart) {
      case 'bar':
        return (
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={barData} {...commonProps}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="x" />
              <YAxis />
              <Tooltip />
              <Bar 
                dataKey="y" 
                fill="#3b82f6"
                onClick={(data) => {
                  if (data) {
                    const point = barData.find(p => p.x === data.x);
                    if (point) {
                      toast.success(`Veri noktası tıklandı: ${point.label}`);
                    }
                  }
                }}
              />
            </BarChart>
          </ResponsiveContainer>
        );

      case 'line':
        return (
          <ResponsiveContainer width="100%" height={400}>
            <LineChart data={lineData} {...commonProps}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="x" />
              <YAxis />
              <Tooltip />
              <Line 
                type="monotone" 
                dataKey="y" 
                stroke="#10b981" 
                strokeWidth={2}
                dot={{ r: 4 }}
                onClick={(data: any) => {
                  if (data) {
                    const point = lineData.find(p => p.x === data.x);
                    if (point) {
                      toast.success(`Veri noktası tıklandı: ${point.label}`);
                    }
                  }
                }}
              />
            </LineChart>
          </ResponsiveContainer>
        );

      case 'pie':
        return (
          <ResponsiveContainer width="100%" height={400}>
            <PieChart {...commonProps}>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name} ${percent ? (percent * 100).toFixed(0) : 0}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="y"
                onClick={(data) => {
                  if (data) {
                    const point = pieData.find(p => p.x === data.x);
                    if (point) {
                      toast.success(`Veri noktası tıklandı: ${point.label}`);
                    }
                  }
                }}
              >
                {pieData.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        );

      case 'area':
        return (
          <ResponsiveContainer width="100%" height={400}>
            <AreaChart data={areaData} {...commonProps}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="x" />
              <YAxis />
              <Tooltip />
              <Area 
                type="monotone" 
                dataKey="y" 
                stroke="#8b5cf6" 
                fill="#8b5cf6"
                fillOpacity={0.3}
                onClick={(data: any) => {
                  if (data) {
                    const point = areaData.find(p => p.x === data.x);
                    if (point) {
                      toast.success(`Veri noktası tıklandı: ${point.label}`);
                    }
                  }
                }}
              />
            </AreaChart>
          </ResponsiveContainer>
        );

      default:
        return null;
    }
  };

  const getCurrentData = () => {
    switch (activeChart) {
      case 'bar': return barData;
      case 'line': return lineData;
      case 'pie': return pieData;
      case 'area': return areaData;
      default: return [];
    }
  };

  const getCurrentDataHandler = () => {
    switch (activeChart) {
      case 'bar': return handleBarDataUpdate;
      case 'line': return handleLineDataUpdate;
      case 'pie': return handlePieDataUpdate;
      case 'area': return handleAreaDataUpdate;
      default: return () => {};
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Gelişmiş Grafik Etkileşimi
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Grafiklerde not ekleme, veri düzenleme, detay seviyesine inme ve karşılaştırma özellikleri
          </p>
        </div>

        {/* Controls */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Grafik Türü
              </h3>
              <div className="flex gap-2">
                {[
                  { type: 'bar', label: 'Bar', icon: BarChart3 },
                  { type: 'line', label: 'Line', icon: TrendingUp },
                  { type: 'pie', label: 'Pie', icon: PieChartIcon },
                  { type: 'area', label: 'Area', icon: Activity }
                ].map(({ type, label, icon: Icon }) => (
                  <button
                    key={type}
                    onClick={() => setActiveChart(type as any)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                      activeChart === type
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    {label}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <label className="text-sm text-gray-600 dark:text-gray-400">
                  Animasyon Hızı:
                </label>
                <input
                  type="range"
                  min="500"
                  max="3000"
                  step="500"
                  value={animationSpeed}
                  onChange={(e) => setAnimationSpeed(Number(e.target.value))}
                  className="w-24"
                />
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  {animationSpeed}ms
                </span>
              </div>

              <button
                onClick={() => setIsPlaying(!isPlaying)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                  isPlaying
                    ? 'bg-red-600 text-white hover:bg-red-700'
                    : 'bg-green-600 text-white hover:bg-green-700'
                }`}
              >
                {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                {isPlaying ? 'Durdur' : 'Başlat'}
              </button>

              <button
                onClick={() => {
                  setBarData(barData.map(point => ({ ...point, y: Math.floor(Math.random() * 500) + 100 })));
                  setLineData(lineData.map(point => ({ ...point, y: Math.floor(Math.random() * 500) + 100 })));
                  setPieData(pieData.map(point => ({ ...point, y: Math.floor(Math.random() * 50) + 10 })));
                  setAreaData(areaData.map(point => ({ ...point, y: Math.floor(Math.random() * 30) + 5 })));
                }}
                className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
              >
                <RotateCcw className="w-4 h-4" />
                Rastgele Veri
              </button>
            </div>
          </div>
        </div>

        {/* Chart Container */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <AdvancedChartInteractivity
            data={getCurrentData()}
            onDataUpdate={getCurrentDataHandler()}
            onAnnotationAdd={handleAnnotationAdd}
            onAnnotationUpdate={handleAnnotationUpdate}
            onAnnotationDelete={handleAnnotationDelete}
            enableAnnotations={true}
            enableDataEditing={true}
            enableDrillDown={true}
            enableComparison={true}
            className="w-full"
          >
            {renderChart()}
          </AdvancedChartInteractivity>
        </div>

        {/* Features Info */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
                <Settings className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              </div>
              <h4 className="font-semibold text-gray-900 dark:text-white">Not Ekleme</h4>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Grafik üzerine not, ok, vurgu ve çizgi ekleyebilirsiniz. Ctrl+A ile hızlı erişim.
            </p>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 bg-green-100 dark:bg-green-900/20 rounded-lg">
                <TrendingUp className="w-5 h-5 text-green-600 dark:text-green-400" />
              </div>
              <h4 className="font-semibold text-gray-900 dark:text-white">Veri Düzenleme</h4>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Veri noktalarına tıklayarak değerleri düzenleyebilirsiniz. Gerçek zamanlı güncelleme.
            </p>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 bg-purple-100 dark:bg-purple-900/20 rounded-lg">
                <BarChart3 className="w-5 h-5 text-purple-600 dark:text-purple-400" />
              </div>
              <h4 className="font-semibold text-gray-900 dark:text-white">Detay Seviyesi</h4>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Veri detaylarına inmek için drill-down özelliğini kullanın. Seviye takibi yapın.
            </p>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 bg-orange-100 dark:bg-orange-900/20 rounded-lg">
                <Activity className="w-5 h-5 text-orange-600 dark:text-orange-400" />
              </div>
              <h4 className="font-semibold text-gray-900 dark:text-white">Grafik Karşılaştırma</h4>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Birden fazla grafiği yan yana karşılaştırın. Görünürlük kontrolü yapın.
            </p>
          </div>
        </div>

        {/* Keyboard Shortcuts */}
        <div className="mt-8 bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Klavye Kısayolları
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="flex items-center gap-2">
              <kbd className="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded text-sm">Ctrl + +</kbd>
              <span className="text-sm text-gray-600 dark:text-gray-400">Yakınlaştır</span>
            </div>
            <div className="flex items-center gap-2">
              <kbd className="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded text-sm">Ctrl + -</kbd>
              <span className="text-sm text-gray-600 dark:text-gray-400">Uzaklaştır</span>
            </div>
            <div className="flex items-center gap-2">
              <kbd className="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded text-sm">Ctrl + 0</kbd>
              <span className="text-sm text-gray-600 dark:text-gray-400">Sıfırla</span>
            </div>
            <div className="flex items-center gap-2">
              <kbd className="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded text-sm">Ctrl + A</kbd>
              <span className="text-sm text-gray-600 dark:text-gray-400">Not Ekle</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdvancedInteractivityDemo;
