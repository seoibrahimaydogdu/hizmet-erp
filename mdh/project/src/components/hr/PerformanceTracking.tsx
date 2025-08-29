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
  MessageSquare
} from 'lucide-react';

interface PerformanceReview {
  id: string;
  employee_id: string;
  review_date: string;
  performance_score: number;
  goals_achieved: number;
  goals_total: number;
  feedback: string;
  reviewer_name: string;
  next_review_date: string;
  employee_name?: string;
  employee_department?: string;
  employee_position?: string;
}

interface PerformanceReviewFormData {
  employee_id: string;
  review_date: string;
  performance_score: number;
  goals_achieved: number;
  goals_total: number;
  feedback: string;
  reviewer_name: string;
  next_review_date: string;
}

interface PerformanceTrackingProps {
  performanceReviews: PerformanceReview[];
  employees: any[];
  onPerformanceUpdate: () => void;
}

const PerformanceTracking: React.FC<PerformanceTrackingProps> = ({ performanceReviews, employees, onPerformanceUpdate }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [scoreFilter, setScoreFilter] = useState('');
  const [showAddReview, setShowAddReview] = useState(false);
  const [showEditReview, setShowEditReview] = useState(false);
  const [showViewReview, setShowViewReview] = useState(false);
  const [selectedReview, setSelectedReview] = useState<PerformanceReview | null>(null);
  const [reviewFormData, setReviewFormData] = useState<PerformanceReviewFormData>({
    employee_id: '',
    review_date: '',
    performance_score: 0,
    goals_achieved: 0,
    goals_total: 1,
    feedback: '',
    reviewer_name: '',
    next_review_date: ''
  });

  const scoreRanges = [
    { min: 90, max: 100, label: 'Mükemmel (90-100)', color: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' },
    { min: 80, max: 89, label: 'Çok İyi (80-89)', color: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' },
    { min: 70, max: 79, label: 'İyi (70-79)', color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' },
    { min: 60, max: 69, label: 'Orta (60-69)', color: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200' },
    { min: 0, max: 59, label: 'Geliştirilmeli (0-59)', color: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' }
  ];

  const getScoreRange = (score: number) => {
    return scoreRanges.find(range => score >= range.min && score <= range.max) || scoreRanges[4];
  };

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-600 dark:text-green-400';
    if (score >= 80) return 'text-blue-600 dark:text-blue-400';
    if (score >= 70) return 'text-yellow-600 dark:text-yellow-400';
    if (score >= 60) return 'text-orange-600 dark:text-orange-400';
    return 'text-red-600 dark:text-red-400';
  };

  const filteredReviews = performanceReviews.filter(review => {
    const employee = employees.find(emp => emp.id === review.employee_id);
    const matchesSearch = employee?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         employee?.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         review.reviewer_name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesScore = !scoreFilter || getScoreRange(review.performance_score).label.includes(scoreFilter);
    return matchesSearch && matchesScore;
  });

  const handleAddReview = async () => {
    try {
      const { error } = await supabase
        .from('performance_reviews')
        .insert([reviewFormData]);

      if (error) throw error;

      setShowAddReview(false);
      setReviewFormData({
        employee_id: '',
        review_date: '',
        performance_score: 0,
        goals_achieved: 0,
        goals_total: 1,
        feedback: '',
        reviewer_name: '',
        next_review_date: ''
      });
      onPerformanceUpdate();
    } catch (error) {
      console.error('Performans değerlendirmesi eklenirken hata:', error);
    }
  };

  const handleEditReview = async () => {
    if (!selectedReview) return;

    try {
      const { error } = await supabase
        .from('performance_reviews')
        .update(reviewFormData)
        .eq('id', selectedReview.id);

      if (error) throw error;

      setShowEditReview(false);
      setSelectedReview(null);
      onPerformanceUpdate();
    } catch (error) {
      console.error('Performans değerlendirmesi güncellenirken hata:', error);
    }
  };

  const handleDeleteReview = async (id: string) => {
    if (!confirm('Bu performans değerlendirmesini silmek istediğinizden emin misiniz?')) return;

    try {
      const { error } = await supabase
        .from('performance_reviews')
        .delete()
        .eq('id', id);

      if (error) throw error;
      onPerformanceUpdate();
    } catch (error) {
      console.error('Performans değerlendirmesi silinirken hata:', error);
    }
  };

  const handleViewReview = (review: PerformanceReview) => {
    setSelectedReview(review);
    setShowViewReview(true);
  };

  const handleEditReviewClick = (review: PerformanceReview) => {
    setSelectedReview(review);
    setReviewFormData({
      employee_id: review.employee_id,
      review_date: review.review_date,
      performance_score: review.performance_score,
      goals_achieved: review.goals_achieved,
      goals_total: review.goals_total,
      feedback: review.feedback,
      reviewer_name: review.reviewer_name,
      next_review_date: review.next_review_date
    });
    setShowEditReview(true);
  };

  // İstatistikler hesaplama
  const totalReviews = performanceReviews.length;
  const averageScore = performanceReviews.length > 0 
    ? Math.round(performanceReviews.reduce((sum, r) => sum + r.performance_score, 0) / performanceReviews.length)
    : 0;
  const highPerformers = performanceReviews.filter(r => r.performance_score >= 80).length;
  const needsImprovement = performanceReviews.filter(r => r.performance_score < 60).length;

  // Performans dağılımı
  const performanceDistribution = scoreRanges.map(range => ({
    ...range,
    count: performanceReviews.filter(r => r.performance_score >= range.min && r.performance_score <= range.max).length
  }));

  // En iyi performans gösteren çalışanlar
  const topPerformers = performanceReviews
    .sort((a, b) => b.performance_score - a.performance_score)
    .slice(0, 5);

  return (
    <div className="space-y-6">
      {/* İstatistikler */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900 dark:to-indigo-900 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Toplam Değerlendirme</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{totalReviews}</p>
            </div>
            <div className="p-2 bg-blue-500 rounded-lg">
              <Target className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>
        
        <div className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900 dark:to-emerald-900 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Ortalama Puan</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{averageScore}</p>
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

      {/* Performans Dağılımı */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
          <PieChart className="w-5 h-5 mr-2 text-blue-500" />
          Performans Dağılımı
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          {performanceDistribution.map((range) => (
            <div key={range.label} className="text-center">
              <div className={`w-16 h-16 mx-auto mb-2 rounded-full flex items-center justify-center ${
                range.count > 0 ? 'bg-blue-100 dark:bg-blue-900' : 'bg-gray-100 dark:bg-gray-700'
              }`}>
                <span className={`text-xl font-bold ${
                  range.count > 0 ? 'text-blue-600 dark:text-blue-400' : 'text-gray-400'
                }`}>
                  {range.count}
                </span>
              </div>
              <p className="text-sm font-medium text-gray-900 dark:text-white">{range.label.split(' ')[0]}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {totalReviews > 0 ? Math.round((range.count / totalReviews) * 100) : 0}%
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* En İyi Performans Gösterenler */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
          <Award className="w-5 h-5 mr-2 text-yellow-500" />
          En İyi Performans Gösterenler
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          {topPerformers.map((review, index) => {
            const employee = employees.find(emp => emp.id === review.employee_id);
            return (
              <div key={review.id} className="text-center">
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
                <p className={`text-lg font-bold ${getScoreColor(review.performance_score)}`}>
                  {review.performance_score}%
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
                placeholder="Performans değerlendirmesi ara..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
              />
            </div>
          </div>
          
          <div className="flex gap-2">
            <select
              value={scoreFilter}
              onChange={(e) => setScoreFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
            >
              <option value="">Tüm Puanlar</option>
              {scoreRanges.map(range => (
                <option key={range.label} value={range.label}>{range.label}</option>
              ))}
            </select>
          </div>
          
          <button
            onClick={() => setShowAddReview(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center space-x-2"
          >
            <Plus className="w-5 h-5" />
            <span>Değerlendirme Ekle</span>
          </button>
        </div>
      </div>

      {/* Performans Değerlendirmeleri Listesi */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Çalışan
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Değerlendirme Tarihi
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Performans Puanı
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Hedef Başarısı
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Değerlendiren
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  İşlemler
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {filteredReviews.map((review) => {
                const employee = employees.find(emp => emp.id === review.employee_id);
                const scoreRange = getScoreRange(review.performance_score);
                return (
                  <tr key={review.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
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
                        {new Date(review.review_date).toLocaleDateString('tr-TR')}
                      </div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        Sonraki: {new Date(review.next_review_date).toLocaleDateString('tr-TR')}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-2 mr-2">
                          <div 
                            className={`h-2 rounded-full ${
                              review.performance_score >= 80 ? 'bg-green-500' :
                              review.performance_score >= 60 ? 'bg-yellow-500' : 'bg-red-500'
                            }`}
                            style={{ width: `${review.performance_score}%` }}
                          />
                        </div>
                        <span className={`text-sm font-medium ${getScoreColor(review.performance_score)}`}>
                          {review.performance_score}%
                        </span>
                      </div>
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${scoreRange.color}`}>
                        {scoreRange.label.split(' ')[0]}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900 dark:text-white">
                        {review.goals_achieved} / {review.goals_total}
                      </div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        {Math.round((review.goals_achieved / review.goals_total) * 100)}% başarı
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900 dark:text-white">
                        {review.reviewer_name}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleViewReview(review)}
                          className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleEditReviewClick(review)}
                          className="text-green-600 hover:text-green-900 dark:text-green-400 dark:hover:text-green-300"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteReview(review.id)}
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

      {/* Performans Değerlendirmesi Ekleme Modal */}
      {showAddReview && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Yeni Performans Değerlendirmesi Ekle</h3>
            <div className="space-y-4">
              <select
                value={reviewFormData.employee_id}
                onChange={(e) => setReviewFormData({...reviewFormData, employee_id: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
              >
                <option value="">Çalışan Seçin</option>
                {employees.map(employee => (
                  <option key={employee.id} value={employee.id}>{employee.name}</option>
                ))}
              </select>
              <input
                type="date"
                placeholder="Değerlendirme Tarihi"
                value={reviewFormData.review_date}
                onChange={(e) => setReviewFormData({...reviewFormData, review_date: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
              />
              <input
                type="number"
                placeholder="Performans Puanı (0-100)"
                min="0"
                max="100"
                value={reviewFormData.performance_score}
                onChange={(e) => setReviewFormData({...reviewFormData, performance_score: parseInt(e.target.value) || 0})}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
              />
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="number"
                  placeholder="Başarılan Hedef"
                  min="0"
                  value={reviewFormData.goals_achieved}
                  onChange={(e) => setReviewFormData({...reviewFormData, goals_achieved: parseInt(e.target.value) || 0})}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                />
                <input
                  type="number"
                  placeholder="Toplam Hedef"
                  min="1"
                  value={reviewFormData.goals_total}
                  onChange={(e) => setReviewFormData({...reviewFormData, goals_total: parseInt(e.target.value) || 1})}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                />
              </div>
              <input
                type="text"
                placeholder="Değerlendiren Kişi"
                value={reviewFormData.reviewer_name}
                onChange={(e) => setReviewFormData({...reviewFormData, reviewer_name: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
              />
              <input
                type="date"
                placeholder="Sonraki Değerlendirme Tarihi"
                value={reviewFormData.next_review_date}
                onChange={(e) => setReviewFormData({...reviewFormData, next_review_date: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
              />
              <textarea
                placeholder="Geri Bildirim"
                value={reviewFormData.feedback}
                onChange={(e) => setReviewFormData({...reviewFormData, feedback: e.target.value})}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
              />
            </div>
            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => setShowAddReview(false)}
                className="px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600"
              >
                İptal
              </button>
              <button
                onClick={handleAddReview}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Ekle
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Performans Değerlendirmesi Düzenleme Modal */}
      {showEditReview && selectedReview && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Performans Değerlendirmesi Düzenle</h3>
            <div className="space-y-4">
              <select
                value={reviewFormData.employee_id}
                onChange={(e) => setReviewFormData({...reviewFormData, employee_id: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
              >
                <option value="">Çalışan Seçin</option>
                {employees.map(employee => (
                  <option key={employee.id} value={employee.id}>{employee.name}</option>
                ))}
              </select>
              <input
                type="date"
                placeholder="Değerlendirme Tarihi"
                value={reviewFormData.review_date}
                onChange={(e) => setReviewFormData({...reviewFormData, review_date: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
              />
              <input
                type="number"
                placeholder="Performans Puanı (0-100)"
                min="0"
                max="100"
                value={reviewFormData.performance_score}
                onChange={(e) => setReviewFormData({...reviewFormData, performance_score: parseInt(e.target.value) || 0})}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
              />
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="number"
                  placeholder="Başarılan Hedef"
                  min="0"
                  value={reviewFormData.goals_achieved}
                  onChange={(e) => setReviewFormData({...reviewFormData, goals_achieved: parseInt(e.target.value) || 0})}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                />
                <input
                  type="number"
                  placeholder="Toplam Hedef"
                  min="1"
                  value={reviewFormData.goals_total}
                  onChange={(e) => setReviewFormData({...reviewFormData, goals_total: parseInt(e.target.value) || 1})}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                />
              </div>
              <input
                type="text"
                placeholder="Değerlendiren Kişi"
                value={reviewFormData.reviewer_name}
                onChange={(e) => setReviewFormData({...reviewFormData, reviewer_name: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
              />
              <input
                type="date"
                placeholder="Sonraki Değerlendirme Tarihi"
                value={reviewFormData.next_review_date}
                onChange={(e) => setReviewFormData({...reviewFormData, next_review_date: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
              />
              <textarea
                placeholder="Geri Bildirim"
                value={reviewFormData.feedback}
                onChange={(e) => setReviewFormData({...reviewFormData, feedback: e.target.value})}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
              />
            </div>
            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => setShowEditReview(false)}
                className="px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600"
              >
                İptal
              </button>
              <button
                onClick={handleEditReview}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Güncelle
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Performans Değerlendirmesi Görüntüleme Modal */}
      {showViewReview && selectedReview && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white">Performans Değerlendirmesi Detayları</h3>
              <button
                onClick={() => setShowViewReview(false)}
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
                      const employee = employees.find(emp => emp.id === selectedReview.employee_id);
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

              {/* Performans Detayları */}
              <div className="space-y-4">
                <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                  <h4 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center">
                    <Target className="w-5 h-5 mr-2 text-green-500" />
                    Performans Detayları
                  </h4>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600 dark:text-gray-300">Performans Puanı</span>
                      <span className={`text-sm font-medium ${getScoreColor(selectedReview.performance_score)}`}>
                        {selectedReview.performance_score}%
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2">
                      <div 
                        className={`h-2 rounded-full ${
                          selectedReview.performance_score >= 80 ? 'bg-green-500' :
                          selectedReview.performance_score >= 60 ? 'bg-yellow-500' : 'bg-red-500'
                        }`}
                        style={{ width: `${selectedReview.performance_score}%` }}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600 dark:text-gray-300">Hedef Başarısı</span>
                      <span className="text-sm font-medium text-gray-900 dark:text-white">
                        {selectedReview.goals_achieved} / {selectedReview.goals_total}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600 dark:text-gray-300">Başarı Oranı</span>
                      <span className="text-sm font-medium text-gray-900 dark:text-white">
                        {Math.round((selectedReview.goals_achieved / selectedReview.goals_total) * 100)}%
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Değerlendirme Bilgileri */}
              <div className="space-y-4">
                <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                  <h4 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center">
                    <Award className="w-5 h-5 mr-2 text-purple-500" />
                    Değerlendirme Bilgileri
                  </h4>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600 dark:text-gray-300">Değerlendirme Tarihi</span>
                      <span className="text-sm font-medium text-gray-900 dark:text-white">
                        {new Date(selectedReview.review_date).toLocaleDateString('tr-TR')}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600 dark:text-gray-300">Sonraki Değerlendirme</span>
                      <span className="text-sm font-medium text-gray-900 dark:text-white">
                        {new Date(selectedReview.next_review_date).toLocaleDateString('tr-TR')}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600 dark:text-gray-300">Değerlendiren</span>
                      <span className="text-sm font-medium text-gray-900 dark:text-white">
                        {selectedReview.reviewer_name}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Geri Bildirim */}
            <div className="mt-6">
              <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                <h4 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center">
                  <MessageSquare className="w-5 h-5 mr-2 text-blue-500" />
                  Geri Bildirim
                </h4>
                <p className="text-sm text-gray-900 dark:text-white">
                  {selectedReview.feedback || 'Geri bildirim belirtilmemiş'}
                </p>
              </div>
            </div>

            <div className="flex justify-end mt-6">
              <button
                onClick={() => handleEditReviewClick(selectedReview)}
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

export default PerformanceTracking;
