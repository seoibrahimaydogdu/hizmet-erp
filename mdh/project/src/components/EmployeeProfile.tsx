import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { 
  ArrowLeft, 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  Calendar, 
  Award, 
  Target, 
  Brain, 
  TrendingUp, 
  Clock, 
  CheckCircle, 
  AlertCircle, 
  Edit, 
  Save, 
  X,
  Download,
  FileText,
  Star,
  Users,
  Briefcase,
  GraduationCap,
  Activity,
  BarChart3,
  PieChart,
  LineChart
} from 'lucide-react';

interface Employee {
  id: string;
  name: string;
  email: string;
  position: string;
  title: string;
  department: string;
  hire_date: string;
  manager_id?: string;
  team_size: number;
  reporting_level: number;
  skills: string[];
  performance_score: number;
  attendance_rate: number;
  leave_balance: number;
  career_goals: string[];
  status: string;
}

interface PerformanceReview {
  id: string;
  employee_id: string;
  reviewer_id: string;
  score: number;
  feedback: string;
  goals: string[];
  review_date: string;
  next_review_date: string;
}

interface LeaveRequest {
  id: string;
  employee_id: string;
  leave_type: string;
  start_date: string;
  end_date: string;
  reason: string;
  status: string;
  days_requested?: number;
}

interface CareerDevelopmentPlan {
  id: string;
  employee_id: string;
  mentor_id: string;
  current_position: string;
  target_position: string;
  timeline_months: number;
  required_skills: string[];
  action_items: string[];
  progress_percentage: number;
  status: string;
  start_date: string;
  target_date: string;
  description: string;
}

interface ProductivityMetric {
  id: string;
  employee_id: string;
  metric_date: string;
  tasks_completed: number;
  tasks_assigned: number;
  hours_worked: number;
  quality_score: number;
  efficiency_score: number;
  collaboration_score: number;
  notes: string;
}

interface EmployeeProfileProps {
  employeeId?: string;
  onBack?: () => void;
}

const EmployeeProfile: React.FC<EmployeeProfileProps> = ({ employeeId, onBack }) => {
  const navigate = useNavigate();
  const location = useLocation();
  

  const [employee, setEmployee] = useState<Employee | null>(null);
  const [manager, setManager] = useState<Employee | null>(null);
  const [performanceReviews, setPerformanceReviews] = useState<PerformanceReview[]>([]);
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([]);
  const [careerPlans, setCareerPlans] = useState<CareerDevelopmentPlan[]>([]);
  const [productivityMetrics, setProductivityMetrics] = useState<ProductivityMetric[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState<Partial<Employee>>({});

  // URL'den veya props'tan employee ID'sini al
  const currentEmployeeId = employeeId || location.state?.employeeId || '';

  useEffect(() => {
    if (currentEmployeeId) {
      fetchEmployeeData();
    }
  }, [currentEmployeeId]);

  const fetchEmployeeData = async () => {
    try {
      setLoading(true);
      
             // Çalışan bilgilerini getir
       const { data: employeeData, error: employeeError } = await supabase
         .from('employees')
         .select('*')
         .eq('id', currentEmployeeId)
         .single();
       
              if (employeeError) {
         // Mock data kullan
         const mockEmployee: Employee = {
           id: currentEmployeeId,
           name: location.state?.employeeName || 'Test Çalışan',
           email: 'test@example.com',
           position: 'Yazılım Geliştirici',
           title: 'Senior Developer',
           department: 'Teknoloji',
           hire_date: '2023-01-15',
           team_size: 5,
           reporting_level: 2,
           skills: ['React', 'TypeScript', 'Node.js', 'PostgreSQL'],
           performance_score: 85,
           attendance_rate: 95,
           leave_balance: 15,
           career_goals: ['Tech Lead olmak', 'Mikroservis mimarisi öğrenmek'],
           status: 'active'
         };
         setEmployee(mockEmployee);
         setEditForm(mockEmployee);
       } else {
         setEmployee(employeeData);
         setEditForm(employeeData);
       }

      // Yönetici bilgilerini getir
      if (employeeData.manager_id) {
        const { data: managerData, error: managerError } = await supabase
          .from('employees')
          .select('*')
          .eq('id', employeeData.manager_id)
          .single();
        
        if (!managerError) {
          setManager(managerData);
        }
      }

      // Performans değerlendirmelerini getir
      const { data: reviewsData, error: reviewsError } = await supabase
        .from('performance_reviews')
        .select('*')
        .eq('employee_id', currentEmployeeId)
        .order('review_date', { ascending: false });
      
      if (!reviewsError) {
        setPerformanceReviews(reviewsData || []);
      }

      // İzin taleplerini getir
      const { data: leaveData, error: leaveError } = await supabase
        .from('leave_requests')
        .select('*')
        .eq('employee_id', currentEmployeeId)
        .order('start_date', { ascending: false });
      
      if (!leaveError) {
        setLeaveRequests(leaveData || []);
      }

      // Kariyer planlarını getir
      const { data: careerData, error: careerError } = await supabase
        .from('career_development_plans')
        .select('*')
        .eq('employee_id', currentEmployeeId)
        .order('start_date', { ascending: false });
      
      if (!careerError) {
        setCareerPlans(careerData || []);
      }

      // Verimlilik metriklerini getir
      const { data: productivityData, error: productivityError } = await supabase
        .from('productivity_metrics')
        .select('*')
        .eq('employee_id', currentEmployeeId)
        .order('metric_date', { ascending: false })
        .limit(10);
      
      if (!productivityError) {
        setProductivityMetrics(productivityData || []);
      }

    } catch (error) {
      console.error('Çalışan verileri yüklenirken hata:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      const { error } = await supabase
        .from('employees')
        .update(editForm)
        .eq('id', currentEmployeeId);
      
      if (error) throw error;
      
      setEmployee({ ...employee, ...editForm } as Employee);
      setIsEditing(false);
    } catch (error) {
      console.error('Güncelleme hatası:', error);
    }
  };

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      // Navigation state'inden geri dön
      const previousPage = location.state?.from;
      
      if (previousPage) {
        // Eğer state'te from değeri varsa oraya git
        navigate(previousPage);
      } else {
        // Eğer yoksa browser history'den geri git
        window.history.back();
      }
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'inactive': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      case 'on_leave': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'active': return 'Aktif';
      case 'inactive': return 'Pasif';
      case 'on_leave': return 'İzinde';
      default: return 'Bilinmiyor';
    }
  };

  const getLeaveTypeText = (type: string) => {
    switch (type) {
      case 'annual': return 'Yıllık İzin';
      case 'sick': return 'Hastalık İzni';
      case 'personal': return 'Kişisel İzin';
      case 'maternity': return 'Doğum İzni';
      case 'paternity': return 'Babalar İzni';
      default: return type;
    }
  };

  const getLeaveStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'pending': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'rejected': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  const getLeaveStatusText = (status: string) => {
    switch (status) {
      case 'approved': return 'Onaylandı';
      case 'pending': return 'Beklemede';
      case 'rejected': return 'Reddedildi';
      default: return status;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!employee) {
    return (
      <div className="p-4">
        <button
          onClick={handleBack}
          className="flex items-center space-x-2 text-blue-600 hover:text-blue-800 mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Geri Dön</span>
        </button>
        <div className="text-center py-8">
          <User className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500">Çalışan bulunamadı</p>
        </div>
      </div>
    );
  }

  const tabs = [
    { id: 'overview', name: 'Genel Bakış', icon: User },
    { id: 'performance', name: 'Performans', icon: Target },
    { id: 'leave', name: 'İzin Geçmişi', icon: Calendar },
    { id: 'career', name: 'Kariyer Planı', icon: GraduationCap },
    { id: 'productivity', name: 'Verimlilik', icon: TrendingUp },
    { id: 'skills', name: 'Beceriler', icon: Brain }
  ];

  return (
    <div className="p-4 max-w-full overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={handleBack}
          className="flex items-center space-x-2 text-blue-600 hover:text-blue-800"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Geri Dön</span>
        </button>
        
        <div className="flex items-center space-x-2">
          {isEditing ? (
            <>
              <button
                onClick={handleSave}
                className="flex items-center space-x-2 px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
              >
                <Save className="w-4 h-4" />
                <span>Kaydet</span>
              </button>
              <button
                onClick={() => {
                  setIsEditing(false);
                  setEditForm(employee);
                }}
                className="flex items-center space-x-2 px-3 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
              >
                <X className="w-4 h-4" />
                <span>İptal</span>
              </button>
            </>
          ) : (
            <button
              onClick={() => setIsEditing(true)}
              className="flex items-center space-x-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              <Edit className="w-4 h-4" />
              <span>Düzenle</span>
            </button>
          )}
        </div>
      </div>

      {/* Employee Header */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 mb-6">
        <div className="flex items-start space-x-6">
          <div className="flex-shrink-0">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-2xl font-bold">
              {employee.name.split(' ').map(n => n[0]).join('').toUpperCase()}
            </div>
          </div>
          
          <div className="flex-1">
            <div className="flex items-center space-x-4 mb-4">
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                  {isEditing ? (
                    <input
                      type="text"
                      value={editForm.name || ''}
                      onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                      className="bg-transparent border-b border-gray-300 focus:border-blue-500 outline-none"
                    />
                  ) : (
                    employee.name
                  )}
                </h1>
                <p className="text-lg text-gray-600 dark:text-gray-400">
                  {isEditing ? (
                    <input
                      type="text"
                      value={editForm.position || ''}
                      onChange={(e) => setEditForm({ ...editForm, position: e.target.value })}
                      className="bg-transparent border-b border-gray-300 focus:border-blue-500 outline-none"
                    />
                  ) : (
                    employee.position
                  )}
                </p>
              </div>
              
              <span className={`inline-flex px-3 py-1 text-sm font-semibold rounded-full ${getStatusColor(employee.status)}`}>
                {getStatusText(employee.status)}
              </span>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="flex items-center space-x-2">
                <Mail className="w-4 h-4 text-gray-400" />
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  {isEditing ? (
                    <input
                      type="email"
                      value={editForm.email || ''}
                      onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                      className="bg-transparent border-b border-gray-300 focus:border-blue-500 outline-none w-full"
                    />
                  ) : (
                    employee.email
                  )}
                </span>
              </div>
              
              <div className="flex items-center space-x-2">
                <Briefcase className="w-4 h-4 text-gray-400" />
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  {isEditing ? (
                    <select
                      value={editForm.department || ''}
                      onChange={(e) => setEditForm({ ...editForm, department: e.target.value })}
                      className="bg-transparent border-b border-gray-300 focus:border-blue-500 outline-none"
                    >
                      <option value="Teknoloji">Teknoloji</option>
                      <option value="Müşteri Hizmetleri">Müşteri Hizmetleri</option>
                      <option value="Satış">Satış</option>
                      <option value="İK">İK</option>
                      <option value="Finans">Finans</option>
                      <option value="Pazarlama">Pazarlama</option>
                      <option value="Operasyon">Operasyon</option>
                      <option value="Genel Yönetim">Genel Yönetim</option>
                    </select>
                  ) : (
                    employee.department
                  )}
                </span>
              </div>
              
              <div className="flex items-center space-x-2">
                <Calendar className="w-4 h-4 text-gray-400" />
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  İşe Başlama: {new Date(employee.hire_date).toLocaleDateString('tr-TR')}
                </span>
              </div>
              
              <div className="flex items-center space-x-2">
                <Users className="w-4 h-4 text-gray-400" />
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  Ekip: {employee.team_size} kişi
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <nav className="flex space-x-4 md:space-x-8 border-b border-gray-200 dark:border-gray-700 mb-6 overflow-x-auto pb-2">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center space-x-2 py-2 px-1 border-b-2 font-medium text-sm whitespace-nowrap flex-shrink-0 ${
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.name}</span>
            </button>
          );
        })}
      </nav>

      {/* Tab Content */}
      <div className="mt-6">
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* İstatistikler */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
                <div className="flex items-center">
                  <Target className="w-6 h-6 text-blue-500" />
                  <div className="ml-3">
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Performans</p>
                    <p className="text-xl font-bold text-gray-900 dark:text-white">{employee.performance_score}%</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
                <div className="flex items-center">
                  <Clock className="w-6 h-6 text-green-500" />
                  <div className="ml-3">
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Devam Oranı</p>
                    <p className="text-xl font-bold text-gray-900 dark:text-white">{employee.attendance_rate}%</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
                <div className="flex items-center">
                  <Calendar className="w-6 h-6 text-yellow-500" />
                  <div className="ml-3">
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">İzin Bakiye</p>
                    <p className="text-xl font-bold text-gray-900 dark:text-white">{employee.leave_balance} gün</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
                <div className="flex items-center">
                  <Brain className="w-6 h-6 text-purple-500" />
                  <div className="ml-3">
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Beceri Sayısı</p>
                    <p className="text-xl font-bold text-gray-900 dark:text-white">{employee.skills?.length || 0}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Yönetici Bilgisi */}
            {manager && (
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Yönetici</h3>
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center text-white font-semibold">
                    {manager.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                  </div>
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">{manager.name}</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">{manager.position}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Kariyer Hedefleri */}
            {employee.career_goals && employee.career_goals.length > 0 && (
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Kariyer Hedefleri</h3>
                <div className="space-y-2">
                  {employee.career_goals.map((goal, index) => (
                    <div key={index} className="flex items-center space-x-2">
                      <Target className="w-4 h-4 text-blue-500" />
                      <span className="text-gray-700 dark:text-gray-300">{goal}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'performance' && (
          <div className="space-y-6">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Performans Değerlendirmeleri</h3>
              
              {performanceReviews.length === 0 ? (
                <p className="text-gray-500 dark:text-gray-400">Henüz performans değerlendirmesi bulunmamaktadır.</p>
              ) : (
                <div className="space-y-4">
                  {performanceReviews.map((review) => (
                    <div key={review.id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center space-x-2">
                          <Star className="w-5 h-5 text-yellow-500" />
                          <span className="font-medium text-gray-900 dark:text-white">
                            {review.score}/100
                          </span>
                        </div>
                        <span className="text-sm text-gray-500 dark:text-gray-400">
                          {new Date(review.review_date).toLocaleDateString('tr-TR')}
                        </span>
                      </div>
                      
                      <p className="text-gray-700 dark:text-gray-300 mb-3">{review.feedback}</p>
                      
                      {review.goals && review.goals.length > 0 && (
                        <div>
                          <p className="text-sm font-medium text-gray-900 dark:text-white mb-2">Hedefler:</p>
                          <ul className="list-disc list-inside space-y-1">
                            {review.goals.map((goal, index) => (
                              <li key={index} className="text-sm text-gray-600 dark:text-gray-400">{goal}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'leave' && (
          <div className="space-y-6">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">İzin Geçmişi</h3>
              
              {leaveRequests.length === 0 ? (
                <p className="text-gray-500 dark:text-gray-400">Henüz izin talebi bulunmamaktadır.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                    <thead className="bg-gray-50 dark:bg-gray-700">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                          İzin Türü
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                          Başlangıç
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                          Bitiş
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                          Gün Sayısı
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                          Durum
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                      {leaveRequests.map((request) => (
                        <tr key={request.id}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                            {getLeaveTypeText(request.leave_type)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                            {new Date(request.start_date).toLocaleDateString('tr-TR')}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                            {new Date(request.end_date).toLocaleDateString('tr-TR')}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                            {request.days_requested || 0} gün
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getLeaveStatusColor(request.status)}`}>
                              {getLeaveStatusText(request.status)}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'career' && (
          <div className="space-y-6">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Kariyer Gelişim Planları</h3>
              
              {careerPlans.length === 0 ? (
                <p className="text-gray-500 dark:text-gray-400">Henüz kariyer gelişim planı bulunmamaktadır.</p>
              ) : (
                <div className="space-y-4">
                  {careerPlans.map((plan) => (
                    <div key={plan.id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="font-medium text-gray-900 dark:text-white">
                          {plan.current_position} → {plan.target_position}
                        </h4>
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          plan.status === 'active' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' :
                          plan.status === 'completed' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' :
                          'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
                        }`}>
                          {plan.status === 'active' ? 'Aktif' : 
                           plan.status === 'completed' ? 'Tamamlandı' : 'Beklemede'}
                        </span>
                      </div>
                      
                      <p className="text-gray-700 dark:text-gray-300 mb-3">{plan.description}</p>
                      
                      <div className="mb-3">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm text-gray-600 dark:text-gray-400">İlerleme</span>
                          <span className="text-sm font-medium text-gray-900 dark:text-white">{plan.progress_percentage}%</span>
                        </div>
                        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                          <div 
                            className="bg-blue-500 h-2 rounded-full"
                            style={{ width: `${plan.progress_percentage}%` }}
                          />
                        </div>
                      </div>
                      
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        Hedef Tarih: {new Date(plan.target_date).toLocaleDateString('tr-TR')}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'productivity' && (
          <div className="space-y-6">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Verimlilik Metrikleri</h3>
              
              {productivityMetrics.length === 0 ? (
                <p className="text-gray-500 dark:text-gray-400">Henüz verimlilik metriği bulunmamaktadır.</p>
              ) : (
                <div className="space-y-4">
                  {productivityMetrics.map((metric) => (
                    <div key={metric.id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <span className="font-medium text-gray-900 dark:text-white">
                          {new Date(metric.metric_date).toLocaleDateString('tr-TR')}
                        </span>
                      </div>
                      
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div>
                          <p className="text-sm text-gray-600 dark:text-gray-400">Tamamlanan Görev</p>
                          <p className="text-lg font-semibold text-gray-900 dark:text-white">{metric.tasks_completed}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600 dark:text-gray-400">Atanan Görev</p>
                          <p className="text-lg font-semibold text-gray-900 dark:text-white">{metric.tasks_assigned}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600 dark:text-gray-400">Çalışma Saati</p>
                          <p className="text-lg font-semibold text-gray-900 dark:text-white">{metric.hours_worked}h</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600 dark:text-gray-400">Kalite Skoru</p>
                          <p className="text-lg font-semibold text-gray-900 dark:text-white">{metric.quality_score}%</p>
                        </div>
                      </div>
                      
                      {metric.notes && (
                        <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                          <p className="text-sm text-gray-600 dark:text-gray-400">{metric.notes}</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'skills' && (
          <div className="space-y-6">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Beceriler</h3>
              
              {(!employee.skills || employee.skills.length === 0) ? (
                <p className="text-gray-500 dark:text-gray-400">Henüz beceri tanımlanmamıştır.</p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {employee.skills.map((skill, index) => (
                    <div key={index} className="flex items-center space-x-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                      <Brain className="w-5 h-5 text-blue-500" />
                      <span className="text-gray-900 dark:text-white">{skill}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default EmployeeProfile;
