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
  CheckSquare
} from 'lucide-react';

interface CareerDevelopmentPlan {
  id: string;
  employee_id: string;
  title: string;
  description: string;
  target_position: string;
  target_completion_date: string;
  progress_percentage: number;
  milestones: string[];
  skills_required: string[];
  mentor_name?: string;
  status: string;
  created_date: string;
  last_updated?: string;
  employee_name?: string;
  employee_department?: string;
  employee_position?: string;
}

interface CareerDevelopmentPlanFormData {
  employee_id: string;
  title: string;
  description: string;
  target_position: string;
  target_completion_date: string;
  progress_percentage: number;
  milestones: string[];
  skills_required: string[];
  mentor_name: string;
  status: string;
}

interface CareerPlanningProps {
  careerPlans: CareerDevelopmentPlan[];
  employees: any[];
  onCareerUpdate: () => void;
}

const CareerPlanning: React.FC<CareerPlanningProps> = ({ careerPlans, employees, onCareerUpdate }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [showAddPlan, setShowAddPlan] = useState(false);
  const [showEditPlan, setShowEditPlan] = useState(false);
  const [showViewPlan, setShowViewPlan] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<CareerDevelopmentPlan | null>(null);
  const [planFormData, setPlanFormData] = useState<CareerDevelopmentPlanFormData>({
    employee_id: '',
    title: '',
    description: '',
    target_position: '',
    target_completion_date: '',
    progress_percentage: 0,
    milestones: [],
    skills_required: [],
    mentor_name: '',
    status: 'active'
  });

  const planStatuses = ['active', 'completed', 'on_hold', 'cancelled'];
  const targetPositions = ['Senior Developer', 'Team Lead', 'Project Manager', 'Product Manager', 'Technical Lead', 'Architect', 'DevOps Engineer', 'Data Scientist', 'UX Designer', 'Business Analyst'];

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'active': return 'Aktif';
      case 'completed': return 'Tamamlandı';
      case 'on_hold': return 'Beklemede';
      case 'cancelled': return 'İptal Edildi';
      default: return status;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'completed': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'on_hold': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'cancelled': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  const getProgressColor = (progress: number) => {
    if (progress >= 80) return 'bg-green-500';
    if (progress >= 60) return 'bg-blue-500';
    if (progress >= 40) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const filteredPlans = careerPlans.filter(plan => {
    const employee = employees.find(emp => emp.id === plan.employee_id);
    const matchesSearch = employee?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         plan.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         plan.target_position.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = !statusFilter || plan.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleAddPlan = async () => {
    try {
      const { error } = await supabase
        .from('career_development_plans')
        .insert([planFormData]);

      if (error) throw error;

      setShowAddPlan(false);
      setPlanFormData({
        employee_id: '',
        title: '',
        description: '',
        target_position: '',
        target_completion_date: '',
        progress_percentage: 0,
        milestones: [],
        skills_required: [],
        mentor_name: '',
        status: 'active'
      });
      onCareerUpdate();
    } catch (error) {
      console.error('Kariyer planı eklenirken hata:', error);
    }
  };

  const handleEditPlan = async () => {
    if (!selectedPlan) return;

    try {
      const { error } = await supabase
        .from('career_development_plans')
        .update(planFormData)
        .eq('id', selectedPlan.id);

      if (error) throw error;

      setShowEditPlan(false);
      setSelectedPlan(null);
      onCareerUpdate();
    } catch (error) {
      console.error('Kariyer planı güncellenirken hata:', error);
    }
  };

  const handleDeletePlan = async (id: string) => {
    if (!confirm('Bu kariyer planını silmek istediğinizden emin misiniz?')) return;

    try {
      const { error } = await supabase
        .from('career_development_plans')
        .delete()
        .eq('id', id);

      if (error) throw error;
      onCareerUpdate();
    } catch (error) {
      console.error('Kariyer planı silinirken hata:', error);
    }
  };

  const handleViewPlan = (plan: CareerDevelopmentPlan) => {
    setSelectedPlan(plan);
    setShowViewPlan(true);
  };

  const handleEditPlanClick = (plan: CareerDevelopmentPlan) => {
    setSelectedPlan(plan);
    setPlanFormData({
      employee_id: plan.employee_id,
      title: plan.title,
      description: plan.description,
      target_position: plan.target_position,
      target_completion_date: plan.target_completion_date,
      progress_percentage: plan.progress_percentage,
      milestones: plan.milestones || [],
      skills_required: plan.skills_required || [],
      mentor_name: plan.mentor_name || '',
      status: plan.status
    });
    setShowEditPlan(true);
  };

  // İstatistikler hesaplama
  const totalPlans = careerPlans.length;
  const activePlans = careerPlans.filter(p => p.status === 'active').length;
  const completedPlans = careerPlans.filter(p => p.status === 'completed').length;
  const averageProgress = careerPlans.length > 0 
    ? Math.round(careerPlans.reduce((sum, p) => sum + p.progress_percentage, 0) / careerPlans.length)
    : 0;

  return (
    <div className="space-y-6">
      {/* İstatistikler */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900 dark:to-indigo-900 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Toplam Plan</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{totalPlans}</p>
            </div>
            <div className="p-2 bg-blue-500 rounded-lg">
              <Target className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>
        
        <div className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900 dark:to-emerald-900 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Aktif Planlar</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{activePlans}</p>
            </div>
            <div className="p-2 bg-green-500 rounded-lg">
              <TrendingUp className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>
        
        <div className="bg-gradient-to-br from-purple-50 to-violet-50 dark:from-purple-900 dark:to-violet-900 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Tamamlanan</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{completedPlans}</p>
            </div>
            <div className="p-2 bg-purple-500 rounded-lg">
              <CheckCircle className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>
        
        <div className="bg-gradient-to-br from-yellow-50 to-amber-50 dark:from-yellow-900 dark:to-amber-900 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Ortalama İlerleme</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{averageProgress}%</p>
            </div>
            <div className="p-2 bg-yellow-500 rounded-lg">
              <BarChart3 className="w-6 h-6 text-white" />
            </div>
          </div>
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
                placeholder="Kariyer planı ara..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
              />
            </div>
          </div>
          
          <div className="flex gap-2">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
            >
              <option value="">Tüm Durumlar</option>
              {planStatuses.map(status => (
                <option key={status} value={status}>{getStatusLabel(status)}</option>
              ))}
            </select>
          </div>
          
          <button
            onClick={() => setShowAddPlan(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center space-x-2"
          >
            <Plus className="w-5 h-5" />
            <span>Plan Ekle</span>
          </button>
        </div>
      </div>

      {/* Kariyer Planları Listesi */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredPlans.map((plan) => {
          const employee = employees.find(emp => emp.id === plan.employee_id);
          return (
            <div key={plan.id} className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-semibold">
                    {employee?.name?.split(' ').map((n: string) => n[0]).join('').toUpperCase() || '?'}
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{plan.title}</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{employee?.name || 'Bilinmeyen'}</p>
                  </div>
                </div>
                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(plan.status)}`}>
                  {getStatusLabel(plan.status)}
                </span>
              </div>

              <div className="space-y-3">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Hedef Pozisyon</p>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">{plan.target_position}</p>
                </div>

                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">İlerleme</p>
                  <div className="flex items-center space-x-2">
                    <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                      <div 
                        className={`h-2 rounded-full ${getProgressColor(plan.progress_percentage)}`}
                        style={{ width: `${plan.progress_percentage}%` }}
                      />
                    </div>
                    <span className="text-sm font-medium text-gray-900 dark:text-white">{plan.progress_percentage}%</span>
                  </div>
                </div>

                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Tamamlanma Tarihi</p>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    {new Date(plan.target_completion_date).toLocaleDateString('tr-TR')}
                  </p>
                </div>

                {plan.mentor_name && (
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Mentor</p>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">{plan.mentor_name}</p>
                  </div>
                )}
              </div>

              <div className="flex justify-end space-x-2 mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                <button
                  onClick={() => handleViewPlan(plan)}
                  className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300"
                >
                  <Eye className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleEditPlanClick(plan)}
                  className="text-green-600 hover:text-green-900 dark:text-green-400 dark:hover:text-green-300"
                >
                  <Edit className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleDeletePlan(plan.id)}
                  className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Kariyer Planı Ekleme Modal */}
      {showAddPlan && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Yeni Kariyer Planı Ekle</h3>
            <div className="space-y-4">
              <select
                value={planFormData.employee_id}
                onChange={(e) => setPlanFormData({...planFormData, employee_id: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
              >
                <option value="">Çalışan Seçin</option>
                {employees.map(employee => (
                  <option key={employee.id} value={employee.id}>{employee.name}</option>
                ))}
              </select>
              
              <input
                type="text"
                placeholder="Plan Başlığı"
                value={planFormData.title}
                onChange={(e) => setPlanFormData({...planFormData, title: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
              />
              
              <textarea
                placeholder="Plan Açıklaması"
                value={planFormData.description}
                onChange={(e) => setPlanFormData({...planFormData, description: e.target.value})}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
              />
              
              <select
                value={planFormData.target_position}
                onChange={(e) => setPlanFormData({...planFormData, target_position: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
              >
                <option value="">Hedef Pozisyon Seçin</option>
                {targetPositions.map(position => (
                  <option key={position} value={position}>{position}</option>
                ))}
              </select>
              
              <input
                type="date"
                placeholder="Hedef Tamamlanma Tarihi"
                value={planFormData.target_completion_date}
                onChange={(e) => setPlanFormData({...planFormData, target_completion_date: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
              />
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">İlerleme Yüzdesi</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={planFormData.progress_percentage}
                    onChange={(e) => setPlanFormData({...planFormData, progress_percentage: parseInt(e.target.value) || 0})}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Durum</label>
                  <select
                    value={planFormData.status}
                    onChange={(e) => setPlanFormData({...planFormData, status: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  >
                    {planStatuses.map(status => (
                      <option key={status} value={status}>{getStatusLabel(status)}</option>
                    ))}
                  </select>
                </div>
              </div>
              
              <input
                type="text"
                placeholder="Mentor Adı (Opsiyonel)"
                value={planFormData.mentor_name}
                onChange={(e) => setPlanFormData({...planFormData, mentor_name: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
              />
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Gerekli Beceriler (virgülle ayırın)</label>
                <input
                  type="text"
                  placeholder="React, Node.js, TypeScript, ..."
                  value={planFormData.skills_required.join(', ')}
                  onChange={(e) => setPlanFormData({...planFormData, skills_required: e.target.value.split(',').map(s => s.trim()).filter(s => s)})}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Kilometre Taşları (her satıra bir tane)</label>
                <textarea
                  placeholder="İlk kilometre taşı&#10;İkinci kilometre taşı&#10;Üçüncü kilometre taşı"
                  value={planFormData.milestones.join('\n')}
                  onChange={(e) => setPlanFormData({...planFormData, milestones: e.target.value.split('\n').filter(s => s.trim())})}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                />
              </div>
            </div>
            
            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => setShowAddPlan(false)}
                className="px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600"
              >
                İptal
              </button>
              <button
                onClick={handleAddPlan}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Ekle
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Kariyer Planı Düzenleme Modal */}
      {showEditPlan && selectedPlan && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Kariyer Planı Düzenle</h3>
            <div className="space-y-4">
              <select
                value={planFormData.employee_id}
                onChange={(e) => setPlanFormData({...planFormData, employee_id: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
              >
                <option value="">Çalışan Seçin</option>
                {employees.map(employee => (
                  <option key={employee.id} value={employee.id}>{employee.name}</option>
                ))}
              </select>
              
              <input
                type="text"
                placeholder="Plan Başlığı"
                value={planFormData.title}
                onChange={(e) => setPlanFormData({...planFormData, title: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
              />
              
              <textarea
                placeholder="Plan Açıklaması"
                value={planFormData.description}
                onChange={(e) => setPlanFormData({...planFormData, description: e.target.value})}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
              />
              
              <select
                value={planFormData.target_position}
                onChange={(e) => setPlanFormData({...planFormData, target_position: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
              >
                <option value="">Hedef Pozisyon Seçin</option>
                {targetPositions.map(position => (
                  <option key={position} value={position}>{position}</option>
                ))}
              </select>
              
              <input
                type="date"
                placeholder="Hedef Tamamlanma Tarihi"
                value={planFormData.target_completion_date}
                onChange={(e) => setPlanFormData({...planFormData, target_completion_date: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
              />
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">İlerleme Yüzdesi</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={planFormData.progress_percentage}
                    onChange={(e) => setPlanFormData({...planFormData, progress_percentage: parseInt(e.target.value) || 0})}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Durum</label>
                  <select
                    value={planFormData.status}
                    onChange={(e) => setPlanFormData({...planFormData, status: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  >
                    {planStatuses.map(status => (
                      <option key={status} value={status}>{getStatusLabel(status)}</option>
                    ))}
                  </select>
                </div>
              </div>
              
              <input
                type="text"
                placeholder="Mentor Adı (Opsiyonel)"
                value={planFormData.mentor_name}
                onChange={(e) => setPlanFormData({...planFormData, mentor_name: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
              />
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Gerekli Beceriler (virgülle ayırın)</label>
                <input
                  type="text"
                  placeholder="React, Node.js, TypeScript, ..."
                  value={planFormData.skills_required.join(', ')}
                  onChange={(e) => setPlanFormData({...planFormData, skills_required: e.target.value.split(',').map(s => s.trim()).filter(s => s)})}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Kilometre Taşları (her satıra bir tane)</label>
                <textarea
                  placeholder="İlk kilometre taşı&#10;İkinci kilometre taşı&#10;Üçüncü kilometre taşı"
                  value={planFormData.milestones.join('\n')}
                  onChange={(e) => setPlanFormData({...planFormData, milestones: e.target.value.split('\n').filter(s => s.trim())})}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                />
              </div>
            </div>
            
            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => setShowEditPlan(false)}
                className="px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600"
              >
                İptal
              </button>
              <button
                onClick={handleEditPlan}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Güncelle
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Kariyer Planı Görüntüleme Modal */}
      {showViewPlan && selectedPlan && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white">Kariyer Planı Detayları</h3>
              <button
                onClick={() => setShowViewPlan(false)}
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
                      const employee = employees.find(emp => emp.id === selectedPlan.employee_id);
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

              {/* Plan Detayları */}
              <div className="space-y-4">
                <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                  <h4 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center">
                    <Target className="w-5 h-5 mr-2 text-green-500" />
                    Plan Detayları
                  </h4>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600 dark:text-gray-300">Hedef Pozisyon</span>
                      <span className="text-sm font-medium text-gray-900 dark:text-white">
                        {selectedPlan.target_position}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600 dark:text-gray-300">İlerleme</span>
                      <span className="text-sm font-medium text-gray-900 dark:text-white">
                        {selectedPlan.progress_percentage}%
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2">
                      <div 
                        className={`h-2 rounded-full ${getProgressColor(selectedPlan.progress_percentage)}`}
                        style={{ width: `${selectedPlan.progress_percentage}%` }}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600 dark:text-gray-300">Tamamlanma Tarihi</span>
                      <span className="text-sm font-medium text-gray-900 dark:text-white">
                        {new Date(selectedPlan.target_completion_date).toLocaleDateString('tr-TR')}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Durum ve Mentor */}
              <div className="space-y-4">
                <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                  <h4 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center">
                    <Award className="w-5 h-5 mr-2 text-purple-500" />
                    Durum & Mentor
                  </h4>
                  <div className="space-y-3">
                    <div>
                      <span className="text-sm text-gray-600 dark:text-gray-300">Durum:</span>
                      <span className={`ml-2 inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(selectedPlan.status)}`}>
                        {getStatusLabel(selectedPlan.status)}
                      </span>
                    </div>
                    {selectedPlan.mentor_name && (
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600 dark:text-gray-300">Mentor</span>
                        <span className="text-sm font-medium text-gray-900 dark:text-white">
                          {selectedPlan.mentor_name}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Açıklama */}
            <div className="mt-6">
              <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                <h4 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center">
                  <MessageSquare className="w-5 h-5 mr-2 text-blue-500" />
                  Plan Açıklaması
                </h4>
                <p className="text-sm text-gray-900 dark:text-white">
                  {selectedPlan.description || 'Açıklama belirtilmemiş'}
                </p>
              </div>
            </div>

            {/* Gerekli Beceriler */}
            {selectedPlan.skills_required && selectedPlan.skills_required.length > 0 && (
              <div className="mt-6">
                <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                  <h4 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center">
                    <BookOpen className="w-5 h-5 mr-2 text-green-500" />
                    Gerekli Beceriler
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {selectedPlan.skills_required.map((skill, index) => (
                      <span key={index} className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Kilometre Taşları */}
            {selectedPlan.milestones && selectedPlan.milestones.length > 0 && (
              <div className="mt-6">
                <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                  <h4 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center">
                    <Flag className="w-5 h-5 mr-2 text-yellow-500" />
                    Kilometre Taşları
                  </h4>
                  <div className="space-y-2">
                    {selectedPlan.milestones.map((milestone, index) => (
                      <div key={index} className="flex items-center space-x-2">
                        <CheckSquare className="w-4 h-4 text-green-500" />
                        <span className="text-sm text-gray-900 dark:text-white">{milestone}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            <div className="flex justify-end mt-6">
              <button
                onClick={() => handleEditPlanClick(selectedPlan)}
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

export default CareerPlanning;
