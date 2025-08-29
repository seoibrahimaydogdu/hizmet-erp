import React, { useState } from 'react';
import { supabase } from '../../lib/supabase';
import { 
  Plus, 
  Search, 
  Filter, 
  Eye, 
  Edit, 
  Trash2, 
  TrendingUp,
  Target,
  Star,
  Award,
  Users,
  BarChart3,
  PieChart,
  Zap,
  User,
  Mail,
  Building,
  Briefcase,
  Calendar,
  CheckCircle,
  AlertCircle,
  XCircle,
  Clock,
  ArrowUp,
  ArrowDown,
  Minus,
  MessageSquare,
  MapPin,
  GraduationCap,
  BookOpen,
  Lightbulb,
  Rocket,
  Flag,
  CheckSquare,
  Activity,
  Target as TargetIcon,
  TrendingDown,
  BarChart,
  LineChart,
  PieChart as PieChartIcon
} from 'lucide-react';

interface ProductivityMetric {
  id: string;
  employee_id: string;
  metric_date: string;
  task_completion_rate: number;
  quality_score: number;
  efficiency_score: number;
  collaboration_score: number;
  innovation_score: number;
  total_score: number;
  notes: string;
  employee_name?: string;
  employee_department?: string;
  employee_position?: string;
}

interface ProductivityMetricFormData {
  employee_id: string;
  metric_date: string;
  task_completion_rate: number;
  quality_score: number;
  efficiency_score: number;
  collaboration_score: number;
  innovation_score: number;
  notes: string;
}

interface ProductivityAnalysisProps {
  productivityMetrics: ProductivityMetric[];
  employees: any[];
  onProductivityUpdate: () => void;
}

const ProductivityAnalysis: React.FC<ProductivityAnalysisProps> = ({ productivityMetrics, employees, onProductivityUpdate }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [showAddMetric, setShowAddMetric] = useState(false);
  const [showEditMetric, setShowEditMetric] = useState(false);
  const [showViewMetric, setShowViewMetric] = useState(false);
  const [selectedMetric, setSelectedMetric] = useState<ProductivityMetric | null>(null);
  const [metricFormData, setMetricFormData] = useState<ProductivityMetricFormData>({
    employee_id: '',
    metric_date: '',
    task_completion_rate: 0,
    quality_score: 0,
    efficiency_score: 0,
    collaboration_score: 0,
    innovation_score: 0,
    notes: ''
  });

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-600 dark:text-green-400';
    if (score >= 80) return 'text-blue-600 dark:text-blue-400';
    if (score >= 70) return 'text-yellow-600 dark:text-yellow-400';
    if (score >= 60) return 'text-orange-600 dark:text-orange-400';
    return 'text-red-600 dark:text-red-400';
  };

  const getScoreBgColor = (score: number) => {
    if (score >= 90) return 'bg-green-100 dark:bg-green-900';
    if (score >= 80) return 'bg-blue-100 dark:bg-blue-900';
    if (score >= 70) return 'bg-yellow-100 dark:bg-yellow-900';
    if (score >= 60) return 'bg-orange-100 dark:bg-orange-900';
    return 'bg-red-100 dark:bg-red-900';
  };

  const getPerformanceLevel = (score: number) => {
    if (score >= 90) return { label: 'Mükemmel', color: 'text-green-600 dark:text-green-400' };
    if (score >= 80) return { label: 'Çok İyi', color: 'text-blue-600 dark:text-blue-400' };
    if (score >= 70) return { label: 'İyi', color: 'text-yellow-600 dark:text-yellow-400' };
    if (score >= 60) return { label: 'Orta', color: 'text-orange-600 dark:text-orange-400' };
    return { label: 'Geliştirilmeli', color: 'text-red-600 dark:text-red-400' };
  };

  const filteredMetrics = productivityMetrics.filter(metric => {
    const employee = employees.find(emp => emp.id === metric.employee_id);
    const matchesSearch = employee?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         employee?.email?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDate = !dateFilter || metric.metric_date === dateFilter;
    return matchesSearch && matchesDate;
  });

  const handleAddMetric = async () => {
    try {
      const totalScore = Math.round(
        (metricFormData.task_completion_rate + 
         metricFormData.quality_score + 
         metricFormData.efficiency_score + 
         metricFormData.collaboration_score + 
         metricFormData.innovation_score) / 5
      );

      const { error } = await supabase
        .from('productivity_metrics')
        .insert([{ ...metricFormData, total_score: totalScore }]);

      if (error) throw error;

      setShowAddMetric(false);
      setMetricFormData({
        employee_id: '',
        metric_date: '',
        task_completion_rate: 0,
        quality_score: 0,
        efficiency_score: 0,
        collaboration_score: 0,
        innovation_score: 0,
        notes: ''
      });
      onProductivityUpdate();
    } catch (error) {
      console.error('Verimlilik metriği eklenirken hata:', error);
    }
  };

  const handleEditMetric = async () => {
    if (!selectedMetric) return;

    try {
      const totalScore = Math.round(
        (metricFormData.task_completion_rate + 
         metricFormData.quality_score + 
         metricFormData.efficiency_score + 
         metricFormData.collaboration_score + 
         metricFormData.innovation_score) / 5
      );

      const { error } = await supabase
        .from('productivity_metrics')
        .update({ ...metricFormData, total_score: totalScore })
        .eq('id', selectedMetric.id);

      if (error) throw error;

      setShowEditMetric(false);
      setSelectedMetric(null);
      onProductivityUpdate();
    } catch (error) {
      console.error('Verimlilik metriği güncellenirken hata:', error);
    }
  };

  const handleDeleteMetric = async (id: string) => {
    if (!confirm('Bu verimlilik metriğini silmek istediğinizden emin misiniz?')) return;

    try {
      const { error } = await supabase
        .from('productivity_metrics')
        .delete()
        .eq('id', id);

      if (error) throw error;
      onProductivityUpdate();
    } catch (error) {
      console.error('Verimlilik metriği silinirken hata:', error);
    }
  };

  const handleViewMetric = (metric: ProductivityMetric) => {
    setSelectedMetric(metric);
    setShowViewMetric(true);
  };

  const handleEditMetricClick = (metric: ProductivityMetric) => {
    setSelectedMetric(metric);
    setMetricFormData({
      employee_id: metric.employee_id,
      metric_date: metric.metric_date,
      task_completion_rate: metric.task_completion_rate,
      quality_score: metric.quality_score,
      efficiency_score: metric.efficiency_score,
      collaboration_score: metric.collaboration_score,
      innovation_score: metric.innovation_score,
      notes: metric.notes
    });
    setShowEditMetric(true);
  };

  // İstatistikler hesaplama
  const totalMetrics = productivityMetrics.length;
  const averageTotalScore = productivityMetrics.length > 0 
    ? Math.round(productivityMetrics.reduce((sum, m) => sum + m.total_score, 0) / productivityMetrics.length)
    : 0;
  const highPerformers = productivityMetrics.filter(m => m.total_score >= 80).length;
  const needsImprovement = productivityMetrics.filter(m => m.total_score < 60).length;

  // Kategori ortalamaları
  const avgTaskCompletion = productivityMetrics.length > 0 
    ? Math.round(productivityMetrics.reduce((sum, m) => sum + m.task_completion_rate, 0) / productivityMetrics.length)
    : 0;
  const avgQuality = productivityMetrics.length > 0 
    ? Math.round(productivityMetrics.reduce((sum, m) => sum + m.quality_score, 0) / productivityMetrics.length)
    : 0;
  const avgEfficiency = productivityMetrics.length > 0 
    ? Math.round(productivityMetrics.reduce((sum, m) => sum + m.efficiency_score, 0) / productivityMetrics.length)
    : 0;
  const avgCollaboration = productivityMetrics.length > 0 
    ? Math.round(productivityMetrics.reduce((sum, m) => sum + m.collaboration_score, 0) / productivityMetrics.length)
    : 0;
  const avgInnovation = productivityMetrics.length > 0 
    ? Math.round(productivityMetrics.reduce((sum, m) => sum + m.innovation_score, 0) / productivityMetrics.length)
    : 0;

  // En iyi performans gösterenler
  const topPerformers = productivityMetrics
    .sort((a, b) => b.total_score - a.total_score)
    .slice(0, 5);

  return (
    <div className="space-y-6">
      {/* İstatistikler */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900 dark:to-indigo-900 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Toplam Metrik</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{totalMetrics}</p>
            </div>
            <div className="p-2 bg-blue-500 rounded-lg">
              <BarChart3 className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>
        
        <div className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900 dark:to-emerald-900 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Ortalama Puan</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{averageTotalScore}</p>
            </div>
            <div className="p-2 bg-green-500 rounded-lg">
              <TrendingUp className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>
        
        <div className="bg-gradient-to-br from-purple-50 to-violet-50 dark:from-purple-900 dark:to-violet-900 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Yüksek Performans</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{highPerformers}</p>
            </div>
            <div className="p-2 bg-purple-500 rounded-lg">
              <Star className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>
        
        <div className="bg-gradient-to-br from-red-50 to-rose-50 dark:from-red-900 dark:to-rose-900 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Geliştirilmeli</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{needsImprovement}</p>
            </div>
            <div className="p-2 bg-red-500 rounded-lg">
              <AlertCircle className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>
      </div>

      {/* Kategori Ortalamaları */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
          <PieChartIcon className="w-5 h-5 mr-2 text-blue-500" />
          Kategori Ortalamaları
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <div className="text-center">
            <div className={`w-16 h-16 mx-auto mb-2 rounded-full flex items-center justify-center ${getScoreBgColor(avgTaskCompletion)}`}>
              <span className={`text-xl font-bold ${getScoreColor(avgTaskCompletion)}`}>
                {avgTaskCompletion}
              </span>
            </div>
            <p className="text-sm font-medium text-gray-900 dark:text-white">Görev Tamamlama</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">Ortalama</p>
          </div>
          
          <div className="text-center">
            <div className={`w-16 h-16 mx-auto mb-2 rounded-full flex items-center justify-center ${getScoreBgColor(avgQuality)}`}>
              <span className={`text-xl font-bold ${getScoreColor(avgQuality)}`}>
                {avgQuality}
              </span>
            </div>
            <p className="text-sm font-medium text-gray-900 dark:text-white">Kalite</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">Ortalama</p>
          </div>
          
          <div className="text-center">
            <div className={`w-16 h-16 mx-auto mb-2 rounded-full flex items-center justify-center ${getScoreBgColor(avgEfficiency)}`}>
              <span className={`text-xl font-bold ${getScoreColor(avgEfficiency)}`}>
                {avgEfficiency}
              </span>
            </div>
            <p className="text-sm font-medium text-gray-900 dark:text-white">Verimlilik</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">Ortalama</p>
          </div>
          
          <div className="text-center">
            <div className={`w-16 h-16 mx-auto mb-2 rounded-full flex items-center justify-center ${getScoreBgColor(avgCollaboration)}`}>
              <span className={`text-xl font-bold ${getScoreColor(avgCollaboration)}`}>
                {avgCollaboration}
              </span>
            </div>
            <p className="text-sm font-medium text-gray-900 dark:text-white">İşbirliği</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">Ortalama</p>
          </div>
          
          <div className="text-center">
            <div className={`w-16 h-16 mx-auto mb-2 rounded-full flex items-center justify-center ${getScoreBgColor(avgInnovation)}`}>
              <span className={`text-xl font-bold ${getScoreColor(avgInnovation)}`}>
                {avgInnovation}
              </span>
            </div>
            <p className="text-sm font-medium text-gray-900 dark:text-white">İnovasyon</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">Ortalama</p>
          </div>
        </div>
      </div>

      {/* En İyi Performans Gösterenler */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
          <Award className="w-5 h-5 mr-2 text-yellow-500" />
          En İyi Performans Gösterenler
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          {topPerformers.map((metric, index) => {
            const employee = employees.find(emp => emp.id === metric.employee_id);
            return (
              <div key={metric.id} className="text-center">
                <div className="relative">
                  <div className="w-16 h-16 mx-auto mb-2 rounded-full bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center text-white font-bold text-lg">
                    {employee?.name?.split(' ').map((n: string) => n[0]).join('').toUpperCase() || '?'}
                  </div>
                  {index < 3 && (
                    <div className="absolute -top-1 -right-1 w-6 h-6 bg-yellow-500 rounded-full flex items-center justify-center text-white text-xs font-bold">
                      {index + 1}
                    </div>
                  )}
                </div>
                <p className="text-sm font-medium text-gray-900 dark:text-white">{employee?.name || 'Bilinmeyen'}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">{employee?.department || 'Departman yok'}</p>
                <p className={`text-lg font-bold ${getScoreColor(metric.total_score)}`}>
                  {metric.total_score}%
                </p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Arama ve Filtreler */}
      <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Verimlilik metriği ara..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
              />
            </div>
          </div>
          
          <div className="flex gap-2">
            <input
              type="date"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
            />
          </div>
          
          <button
            onClick={() => setShowAddMetric(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center space-x-2"
          >
            <Plus className="w-5 h-5" />
            <span>Metrik Ekle</span>
          </button>
        </div>
      </div>

      {/* Verimlilik Metrikleri Listesi */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Çalışan
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Tarih
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Toplam Puan
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Kategoriler
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  İşlemler
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {filteredMetrics.map((metric) => {
                const employee = employees.find(emp => emp.id === metric.employee_id);
                const performanceLevel = getPerformanceLevel(metric.total_score);
                return (
                  <tr key={metric.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10">
                          <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-semibold">
                            {employee?.name?.split(' ').map((n: string) => n[0]).join('').toUpperCase() || '?'}
                          </div>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900 dark:text-white">
                            {employee?.name || 'Bilinmeyen Çalışan'}
                          </div>
                          <div className="text-sm text-gray-500 dark:text-gray-400">
                            {employee?.department || 'Departman yok'}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900 dark:text-white">
                        {new Date(metric.metric_date).toLocaleDateString('tr-TR')}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-2 mr-2">
                          <div
                            className={`h-2 rounded-full ${
                              metric.total_score >= 80 ? 'bg-green-500' :
                              metric.total_score >= 60 ? 'bg-yellow-500' : 'bg-red-500'
                            }`}
                            style={{ width: `${metric.total_score}%` }}
                          />
                        </div>
                        <span className={`text-sm font-medium ${getScoreColor(metric.total_score)}`}>
                          {metric.total_score}%
                        </span>
                      </div>
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${performanceLevel.color} bg-opacity-10`}>
                        {performanceLevel.label}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="grid grid-cols-2 gap-1 text-xs">
                        <div className="flex items-center justify-between">
                          <span className="text-gray-500 dark:text-gray-400">Görev:</span>
                          <span className={`font-medium ${getScoreColor(metric.task_completion_rate)}`}>
                            {metric.task_completion_rate}%
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-gray-500 dark:text-gray-400">Kalite:</span>
                          <span className={`font-medium ${getScoreColor(metric.quality_score)}`}>
                            {metric.quality_score}%
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-gray-500 dark:text-gray-400">Verimlilik:</span>
                          <span className={`font-medium ${getScoreColor(metric.efficiency_score)}`}>
                            {metric.efficiency_score}%
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-gray-500 dark:text-gray-400">İşbirliği:</span>
                          <span className={`font-medium ${getScoreColor(metric.collaboration_score)}`}>
                            {metric.collaboration_score}%
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleViewMetric(metric)}
                          className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleEditMetricClick(metric)}
                          className="text-green-600 hover:text-green-900 dark:text-green-400 dark:hover:text-green-300"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteMetric(metric.id)}
                          className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modallar buraya eklenecek */}
      
      {/* Verimlilik Metriği Ekleme Modal */}
      {showAddMetric && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Yeni Verimlilik Metriği Ekle</h3>
            <div className="space-y-4">
              <select
                value={metricFormData.employee_id}
                onChange={(e) => setMetricFormData({...metricFormData, employee_id: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
              >
                <option value="">Çalışan Seçin</option>
                {employees.map(employee => (
                  <option key={employee.id} value={employee.id}>{employee.name}</option>
                ))}
              </select>
              
              <input
                type="date"
                placeholder="Metrik Tarihi"
                value={metricFormData.metric_date}
                onChange={(e) => setMetricFormData({...metricFormData, metric_date: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
              />
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Görev Tamamlama Oranı (%)</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={metricFormData.task_completion_rate}
                    onChange={(e) => setMetricFormData({...metricFormData, task_completion_rate: parseInt(e.target.value) || 0})}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Kalite Puanı (%)</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={metricFormData.quality_score}
                    onChange={(e) => setMetricFormData({...metricFormData, quality_score: parseInt(e.target.value) || 0})}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Verimlilik Puanı (%)</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={metricFormData.efficiency_score}
                    onChange={(e) => setMetricFormData({...metricFormData, efficiency_score: parseInt(e.target.value) || 0})}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">İşbirliği Puanı (%)</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={metricFormData.collaboration_score}
                    onChange={(e) => setMetricFormData({...metricFormData, collaboration_score: parseInt(e.target.value) || 0})}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">İnovasyon Puanı (%)</label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={metricFormData.innovation_score}
                  onChange={(e) => setMetricFormData({...metricFormData, innovation_score: parseInt(e.target.value) || 0})}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                />
              </div>
              
              <textarea
                placeholder="Notlar (Opsiyonel)"
                value={metricFormData.notes}
                onChange={(e) => setMetricFormData({...metricFormData, notes: e.target.value})}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
              />
            </div>
            
            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => setShowAddMetric(false)}
                className="px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600"
              >
                İptal
              </button>
              <button
                onClick={handleAddMetric}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Ekle
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Verimlilik Metriği Düzenleme Modal */}
      {showEditMetric && selectedMetric && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Verimlilik Metriği Düzenle</h3>
            <div className="space-y-4">
              <select
                value={metricFormData.employee_id}
                onChange={(e) => setMetricFormData({...metricFormData, employee_id: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
              >
                <option value="">Çalışan Seçin</option>
                {employees.map(employee => (
                  <option key={employee.id} value={employee.id}>{employee.name}</option>
                ))}
              </select>
              
              <input
                type="date"
                placeholder="Metrik Tarihi"
                value={metricFormData.metric_date}
                onChange={(e) => setMetricFormData({...metricFormData, metric_date: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
              />
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Görev Tamamlama Oranı (%)</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={metricFormData.task_completion_rate}
                    onChange={(e) => setMetricFormData({...metricFormData, task_completion_rate: parseInt(e.target.value) || 0})}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Kalite Puanı (%)</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={metricFormData.quality_score}
                    onChange={(e) => setMetricFormData({...metricFormData, quality_score: parseInt(e.target.value) || 0})}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Verimlilik Puanı (%)</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={metricFormData.efficiency_score}
                    onChange={(e) => setMetricFormData({...metricFormData, efficiency_score: parseInt(e.target.value) || 0})}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">İşbirliği Puanı (%)</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={metricFormData.collaboration_score}
                    onChange={(e) => setMetricFormData({...metricFormData, collaboration_score: parseInt(e.target.value) || 0})}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">İnovasyon Puanı (%)</label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={metricFormData.innovation_score}
                  onChange={(e) => setMetricFormData({...metricFormData, innovation_score: parseInt(e.target.value) || 0})}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                />
              </div>
              
              <textarea
                placeholder="Notlar (Opsiyonel)"
                value={metricFormData.notes}
                onChange={(e) => setMetricFormData({...metricFormData, notes: e.target.value})}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
              />
            </div>
            
            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => setShowEditMetric(false)}
                className="px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600"
              >
                İptal
              </button>
              <button
                onClick={handleEditMetric}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Güncelle
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Verimlilik Metriği Görüntüleme Modal */}
      {showViewMetric && selectedMetric && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white">Verimlilik Metriği Detayları</h3>
              <button
                onClick={() => setShowViewMetric(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <XCircle className="w-6 h-6" />
              </button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Çalışan Bilgileri */}
              <div className="space-y-4">
                <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                  <h4 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center">
                    <User className="w-5 h-5 mr-2 text-blue-500" />
                    Çalışan Bilgileri
                  </h4>
                  <div className="space-y-2 text-sm">
                    {(() => {
                      const employee = employees.find(emp => emp.id === selectedMetric.employee_id);
                      return (
                        <>
                          <div className="flex items-center">
                            <Mail className="w-4 h-4 mr-2 text-gray-400" />
                            <span className="text-gray-600 dark:text-gray-300">{employee?.email || 'Bilinmeyen'}</span>
                          </div>
                          <div className="flex items-center">
                            <Building className="w-4 h-4 mr-2 text-gray-400" />
                            <span className="text-gray-600 dark:text-gray-300">{employee?.department || 'Departman yok'}</span>
                          </div>
                          <div className="flex items-center">
                            <Briefcase className="w-4 h-4 mr-2 text-gray-400" />
                            <span className="text-gray-600 dark:text-gray-300">{employee?.position || 'Pozisyon yok'}</span>
                          </div>
                        </>
                      );
                    })()}
                  </div>
                </div>
              </div>

              {/* Genel Performans */}
              <div className="space-y-4">
                <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                  <h4 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center">
                    <Target className="w-5 h-5 mr-2 text-green-500" />
                    Genel Performans
                  </h4>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600 dark:text-gray-300">Toplam Puan</span>
                      <span className={`text-sm font-medium ${getScoreColor(selectedMetric.total_score)}`}>
                        {selectedMetric.total_score}%
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2">
                      <div 
                        className={`h-2 rounded-full ${
                          selectedMetric.total_score >= 80 ? 'bg-green-500' :
                          selectedMetric.total_score >= 60 ? 'bg-yellow-500' : 'bg-red-500'
                        }`}
                        style={{ width: `${selectedMetric.total_score}%` }}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600 dark:text-gray-300">Performans Seviyesi</span>
                      <span className={`text-sm font-medium ${getPerformanceLevel(selectedMetric.total_score).color}`}>
                        {getPerformanceLevel(selectedMetric.total_score).label}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600 dark:text-gray-300">Değerlendirme Tarihi</span>
                      <span className="text-sm font-medium text-gray-900 dark:text-white">
                        {new Date(selectedMetric.metric_date).toLocaleDateString('tr-TR')}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Kategori Detayları */}
              <div className="space-y-4">
                <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                  <h4 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center">
                    <BarChart className="w-5 h-5 mr-2 text-purple-500" />
                    Kategori Detayları
                  </h4>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600 dark:text-gray-300">Görev Tamamlama</span>
                      <span className={`text-sm font-medium ${getScoreColor(selectedMetric.task_completion_rate)}`}>
                        {selectedMetric.task_completion_rate}%
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600 dark:text-gray-300">Kalite</span>
                      <span className={`text-sm font-medium ${getScoreColor(selectedMetric.quality_score)}`}>
                        {selectedMetric.quality_score}%
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600 dark:text-gray-300">Verimlilik</span>
                      <span className={`text-sm font-medium ${getScoreColor(selectedMetric.efficiency_score)}`}>
                        {selectedMetric.efficiency_score}%
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600 dark:text-gray-300">İşbirliği</span>
                      <span className={`text-sm font-medium ${getScoreColor(selectedMetric.collaboration_score)}`}>
                        {selectedMetric.collaboration_score}%
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600 dark:text-gray-300">İnovasyon</span>
                      <span className={`text-sm font-medium ${getScoreColor(selectedMetric.innovation_score)}`}>
                        {selectedMetric.innovation_score}%
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Notlar */}
            {selectedMetric.notes && (
              <div className="mt-6">
                <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                  <h4 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center">
                    <MessageSquare className="w-5 h-5 mr-2 text-blue-500" />
                    Notlar
                  </h4>
                  <p className="text-sm text-gray-900 dark:text-white">
                    {selectedMetric.notes}
                  </p>
                </div>
              </div>
            )}

            <div className="flex justify-end mt-6">
              <button
                onClick={() => handleEditMetricClick(selectedMetric)}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center space-x-2"
              >
                <Edit className="w-4 h-4" />
                <span>Düzenle</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductivityAnalysis;
