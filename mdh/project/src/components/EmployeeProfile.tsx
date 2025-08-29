import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import {
  User,
  Mail,
  Phone,
  Calendar,
  MapPin,
  Building,
  Award,
  Target,
  TrendingUp,
  Clock,
  CheckCircle,
  XCircle,
  Edit,
  ArrowLeft,
  Brain,
  GraduationCap,
  Activity,
  BarChart3,
  Star,
  Users,
  FileText,
  Eye,
  Plus,
  Trash2
} from 'lucide-react';

interface Employee {
  id: string;
  name: string;
  email: string;
  phone: string;
  position: string;
  title: string;
  department: string;
  hire_date: string;
  manager_id?: string;
  team_size: number;
  reporting_level: number;
  salary: number;
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

interface Skill {
  id: string;
  name: string;
  category: string;
  level: string;
  employees: string[];
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
  progress?: number;
  status: string;
  start_date: string;
  target_date: string;
  target_completion_date: string;
  description: string;
  milestones?: string[];
  last_updated?: string;
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

interface DevelopmentActivity {
  id: string;
  employee_id: string;
  activity_type: string;
  title: string;
  description: string;
  start_date: string;
  end_date: string;
  status: string;
  completion_percentage: number;
}

interface PendingLeaveApproval {
  id: string;
  leave_request_id: string;
  employee_id: string;
  manager_id: string;
  request_date: string;
  status: string;
  manager_notes?: string;
  approval_date?: string;
  employee_name?: string;
  leave_type?: string;
  start_date?: string;
  end_date?: string;
  reason?: string;
  days_requested?: number;
}

interface EmployeeProfileProps {
  employeeId: string;
  onBack: () => void;
}

const EmployeeProfile: React.FC<EmployeeProfileProps> = ({ employeeId, onBack }) => {
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [manager, setManager] = useState<Employee | null>(null);
  const [teamMembers, setTeamMembers] = useState<Employee[]>([]);
  const [performanceReviews, setPerformanceReviews] = useState<PerformanceReview[]>([]);
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([]);
  const [skills, setSkills] = useState<Skill[]>([]);
  const [careerPlans, setCareerPlans] = useState<CareerDevelopmentPlan[]>([]);
  const [productivityMetrics, setProductivityMetrics] = useState<ProductivityMetric[]>([]);
  const [developmentActivities, setDevelopmentActivities] = useState<DevelopmentActivity[]>([]);
  const [pendingLeaveApprovals, setPendingLeaveApprovals] = useState<PendingLeaveApproval[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    fetchEmployeeData();
  }, [employeeId]);

  const fetchEmployeeData = async () => {
    try {
      setLoading(true);

      // Çalışan bilgilerini getir
      const { data: employeeData, error: employeeError } = await supabase
        .from('employees')
        .select('*')
        .eq('id', employeeId)
        .single();

      if (employeeError) throw employeeError;
      setEmployee(employeeData);

      // Yönetici bilgilerini getir
      if (employeeData.manager_id) {
        const { data: managerData, error: managerError } = await supabase
          .from('employees')
          .select('*')
          .eq('id', employeeData.manager_id)
          .single();

        if (!managerError && managerData) {
          setManager(managerData);
        }
      }

      // Ekip üyelerini getir
      const { data: teamData, error: teamError } = await supabase
        .from('employees')
        .select('*')
        .eq('manager_id', employeeId)
        .order('name');

      if (!teamError && teamData) {
        setTeamMembers(teamData);
      }

      // Performans değerlendirmelerini getir
      const { data: reviewsData, error: reviewsError } = await supabase
        .from('performance_reviews')
        .select('*')
        .eq('employee_id', employeeId)
        .order('review_date', { ascending: false });

      if (reviewsError) throw reviewsError;
      setPerformanceReviews(reviewsData || []);

      // İzin taleplerini getir
      const { data: leaveData, error: leaveError } = await supabase
        .from('leave_requests')
        .select('*')
        .eq('employee_id', employeeId)
        .order('start_date', { ascending: false });

      if (leaveError) throw leaveError;
      setLeaveRequests(leaveData || []);

      // Becerileri getir
      const { data: skillsData, error: skillsError } = await supabase
        .from('skills')
        .select('*')
        .order('name');

      if (skillsError) throw skillsError;
      setSkills(skillsData || []);

      // Kariyer planlarını getir
      const { data: careerData, error: careerError } = await supabase
        .from('career_development_plans')
        .select('*')
        .eq('employee_id', employeeId)
        .order('start_date', { ascending: false });

      if (careerError) throw careerError;
      setCareerPlans(careerData || []);

      // Verimlilik metriklerini getir
      const { data: productivityData, error: productivityError } = await supabase
        .from('productivity_metrics')
        .select('*')
        .eq('employee_id', employeeId)
        .order('metric_date', { ascending: false });

      if (productivityError) throw productivityError;
      setProductivityMetrics(productivityData || []);

      // Gelişim aktivitelerini getir
      const { data: activitiesData, error: activitiesError } = await supabase
        .from('development_activities')
        .select('*')
        .eq('employee_id', employeeId)
        .order('start_date', { ascending: false });

      if (activitiesError) throw activitiesError;
      setDevelopmentActivities(activitiesData || []);

      // Eğer çalışan müdür ise, onay bekleyen izinleri getir
      if (employeeData.title && (employeeData.title.toLowerCase().includes('müdür') || 
          employeeData.title.toLowerCase().includes('direktör') || 
          employeeData.title.toLowerCase().includes('ceo') || 
          employeeData.title.toLowerCase().includes('supervisor'))) {
        
        const { data: approvalsData, error: approvalsError } = await supabase
          .from('pending_leave_approvals')
          .select(`
            *,
            leave_requests!inner(
              leave_type,
              start_date,
              end_date,
              reason,
              days_requested
            ),
            employees!inner(name)
          `)
          .eq('manager_id', employeeId)
          .eq('status', 'pending')
          .order('request_date', { ascending: false });

        if (!approvalsError && approvalsData) {
          const formattedApprovals = approvalsData.map(approval => ({
            ...approval,
            employee_name: approval.employees?.name,
            leave_type: approval.leave_requests?.leave_type,
            start_date: approval.leave_requests?.start_date,
            end_date: approval.leave_requests?.end_date,
            reason: approval.leave_requests?.reason,
            days_requested: approval.leave_requests?.days_requested
          }));
          setPendingLeaveApprovals(formattedApprovals);
        }
      }

    } catch (error) {
      console.error('Çalışan verileri yüklenirken hata:', error);
    } finally {
      setLoading(false);
    }
  };

  const getLeaveTypeLabel = (type: string) => {
    const types: { [key: string]: string } = {
      'annual': 'Yıllık İzin',
      'sick': 'Hastalık İzni',
      'maternity': 'Doğum İzni',
      'paternity': 'Babalar İzni',
      'personal': 'Özel İzin'
    };
    return types[type] || type;
  };

  const getStatusLabel = (status: string) => {
    const statuses: { [key: string]: string } = {
      'pending': 'Beklemede',
      'approved': 'Onaylandı',
      'rejected': 'Reddedildi'
    };
    return statuses[status] || status;
  };

  const getStatusColor = (status: string) => {
    const colors: { [key: string]: string } = {
      'pending': 'yellow',
      'approved': 'green',
      'rejected': 'red'
    };
    return colors[status] || 'gray';
  };

  const calculateDays = (startDate: string, endDate: string) => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays + 1;
  };

  const calculateExperienceYears = () => {
    if (!employee?.hire_date) return 0;
    const hireDate = new Date(employee.hire_date);
    const today = new Date();
    const diffTime = Math.abs(today.getTime() - hireDate.getTime());
    const diffYears = Math.ceil(diffTime / (1000 * 60 * 60 * 24 * 365));
    return diffYears;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!employee) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <User className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-600">Çalışan bulunamadı</h2>
          <button
            onClick={onBack}
            className="mt-4 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
          >
            Geri Dön
          </button>
        </div>
      </div>
    );
  }

  const tabs = [
    { id: 'overview', name: 'Genel Bakış', icon: User },
    { id: 'hierarchy', name: 'Hiyerarşi', icon: Users },
    { id: 'performance', name: 'Performans', icon: Target },
    { id: 'leave', name: 'İzin Geçmişi', icon: Calendar },
    // Müdürler için onay bekleyen izinler sekmesi
    ...(employee?.title && (employee.title.toLowerCase().includes('müdür') || 
        employee.title.toLowerCase().includes('direktör') || 
        employee.title.toLowerCase().includes('ceo') || 
        employee.title.toLowerCase().includes('supervisor')) ? [
      { id: 'pending-approvals', name: 'Onay Bekleyen İzinler', icon: Clock }
    ] : []),
    { id: 'skills', name: 'Beceriler', icon: Brain },
    { id: 'career', name: 'Kariyer', icon: GraduationCap },
    { id: 'productivity', name: 'Verimlilik', icon: TrendingUp },
    { id: 'development', name: 'Gelişim', icon: Activity }
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-4">
            <div className="flex items-center space-x-4">
              <button
                onClick={onBack}
                className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                  <span className="text-white font-bold text-lg">
                    {employee.name.split(' ').map(n => n[0]).join('')}
                  </span>
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{employee.name}</h1>
                  <p className="text-gray-600 dark:text-gray-400">{employee.title} • {employee.position} • {employee.department}</p>
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <button className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 flex items-center space-x-2">
                <Edit className="w-4 h-4" />
                <span>Düzenle</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex space-x-8 overflow-x-auto">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${
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
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Temel Bilgiler */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6 flex items-center">
                <User className="w-5 h-5 mr-2 text-blue-500" />
                Temel Bilgiler
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div className="flex items-center space-x-3">
                  <Mail className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">E-posta</p>
                    <p className="text-gray-900 dark:text-white">{employee.email}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <Phone className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Telefon</p>
                    <p className="text-gray-900 dark:text-white">{employee.phone}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <Calendar className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">İşe Başlama</p>
                    <p className="text-gray-900 dark:text-white">{new Date(employee.hire_date).toLocaleDateString('tr-TR')}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <Building className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Departman</p>
                    <p className="text-gray-900 dark:text-white">{employee.department}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <Award className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Pozisyon</p>
                    <p className="text-gray-900 dark:text-white">{employee.position}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <Star className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Ünvan</p>
                    <p className="text-gray-900 dark:text-white">{employee.title}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <Clock className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Deneyim</p>
                    <p className="text-gray-900 dark:text-white">{calculateExperienceYears()} yıl</p>
                  </div>
                </div>
              </div>
            </div>

            {/* İstatistikler */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
                <div className="flex items-center">
                  <Target className="w-8 h-8 text-blue-500" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Performans Puanı</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">{employee.performance_score}/10</p>
                  </div>
                </div>
              </div>
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
                <div className="flex items-center">
                  <CheckCircle className="w-8 h-8 text-green-500" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Devam Oranı</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">{employee.attendance_rate}%</p>
                  </div>
                </div>
              </div>
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
                <div className="flex items-center">
                  <Calendar className="w-8 h-8 text-orange-500" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Kalan İzin</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">{employee.leave_balance} gün</p>
                  </div>
                </div>
              </div>
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
                <div className="flex items-center">
                  <Brain className="w-8 h-8 text-purple-500" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Beceri Sayısı</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">{employee.skills.length}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Son Aktiviteler */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6 flex items-center">
                <Activity className="w-5 h-5 mr-2 text-green-500" />
                Son Aktiviteler
              </h2>
              <div className="space-y-4">
                {performanceReviews.slice(0, 3).map((review) => (
                  <div key={review.id} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
                        <Target className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">Performans Değerlendirmesi</p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {new Date(review.review_date).toLocaleDateString('tr-TR')} • {review.score}/10 puan
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-sm font-medium text-gray-900 dark:text-white">{review.score}/10</span>
                    </div>
                  </div>
                ))}
                {performanceReviews.length === 0 && (
                  <div className="text-center py-8">
                    <Activity className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                    <p className="text-gray-500 dark:text-gray-400">Henüz aktivite bulunmuyor</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'hierarchy' && (
          <div className="space-y-6">
            {/* Hiyerarşik Yapı */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6 flex items-center">
                <Users className="w-5 h-5 mr-2 text-purple-500" />
                Organizasyon Yapısı
              </h2>
              
              {/* Yönetici Bilgisi */}
              {manager && (
                <div className="mb-6">
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Yönetici</h3>
                  <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900 dark:to-indigo-900 rounded-lg p-4 border border-blue-200 dark:border-blue-700">
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center">
                        <span className="text-white font-bold text-lg">
                          {manager.name.split(' ').map(n => n[0]).join('')}
                        </span>
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-900 dark:text-white">{manager.name}</h4>
                        <p className="text-sm text-gray-600 dark:text-gray-400">{manager.title} • {manager.department}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-500">Raporlama Seviyesi: {employee?.reporting_level}</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Ekip Bilgisi */}
              {teamMembers.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Ekip ({teamMembers.length} üye)</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {teamMembers.slice(0, 6).map((member, index) => (
                      <div key={member.id} className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900 dark:to-emerald-900 rounded-lg p-4 border border-green-200 dark:border-green-700">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center">
                            <span className="text-white font-bold text-sm">
                              {member.name.split(' ').map(n => n[0]).join('')}
                            </span>
                          </div>
                          <div>
                            <h4 className="font-medium text-gray-900 dark:text-white">{member.name}</h4>
                            <p className="text-sm text-gray-600 dark:text-gray-400">{member.title}</p>
                            <p className="text-xs text-gray-500 dark:text-gray-500">Performans: {member.performance_score}/10</p>
                          </div>
                        </div>
                      </div>
                    ))}
                    {teamMembers.length > 6 && (
                      <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 border border-gray-200 dark:border-gray-600 flex items-center justify-center">
                        <span className="text-gray-500 dark:text-gray-400 font-medium">
                          +{teamMembers.length - 6} daha
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Organizasyon Şeması */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Organizasyon Şeması</h3>
                <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-6">
                  <div className="flex flex-col items-center space-y-4">
                    {/* Üst Seviye */}
                    {manager && (
                      <div className="bg-white dark:bg-gray-800 rounded-lg p-3 border-2 border-blue-300 dark:border-blue-600 shadow-md">
                        <div className="text-center">
                          <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center mx-auto mb-2">
                            <span className="text-white font-bold text-xs">
                              {manager.name.split(' ').map(n => n[0]).join('')}
                            </span>
                          </div>
                          <p className="text-sm font-medium text-gray-900 dark:text-white">{manager.name}</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">{manager.title}</p>
                        </div>
                      </div>
                    )}
                    
                    {/* Bağlantı Çizgisi */}
                    {manager && (
                      <div className="w-0.5 h-6 bg-gray-300 dark:bg-gray-600"></div>
                    )}
                    
                    {/* Mevcut Çalışan */}
                    <div className="bg-gradient-to-r from-purple-500 to-pink-600 rounded-lg p-4 border-2 border-purple-300 dark:border-purple-600 shadow-lg">
                      <div className="text-center">
                        <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center mx-auto mb-2">
                          <span className="text-purple-600 font-bold text-lg">
                            {employee.name.split(' ').map(n => n[0]).join('')}
                          </span>
                        </div>
                        <p className="text-sm font-bold text-white">{employee.name}</p>
                        <p className="text-xs text-purple-100">{employee.title}</p>
                        <p className="text-xs text-purple-100">{employee.department}</p>
                      </div>
                    </div>
                    
                    {/* Alt Seviye */}
                    {teamMembers.length > 0 && (
                      <>
                        <div className="w-0.5 h-6 bg-gray-300 dark:bg-gray-600"></div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                          {teamMembers.slice(0, 3).map((member, index) => (
                            <div key={member.id} className="bg-white dark:bg-gray-800 rounded-lg p-2 border border-gray-300 dark:border-gray-600 shadow-sm">
                              <div className="text-center">
                                <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-1">
                                  <span className="text-white font-bold text-xs">
                                    {member.name.split(' ').map(n => n[0]).join('')}
                                  </span>
                                </div>
                                <p className="text-xs font-medium text-gray-900 dark:text-white">{member.name}</p>
                                <p className="text-xs text-gray-500 dark:text-gray-400">{member.title}</p>
                              </div>
                            </div>
                          ))}
                          {teamMembers.length > 3 && (
                            <div className="bg-gray-100 dark:bg-gray-600 rounded-lg p-2 border border-gray-300 dark:border-gray-600 flex items-center justify-center">
                              <span className="text-gray-500 dark:text-gray-400 text-xs font-medium">
                                +{teamMembers.length - 3}
                              </span>
                            </div>
                          )}
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Ekip Performans Özeti */}
            {teamMembers.length > 0 && (
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6 flex items-center">
                  <BarChart3 className="w-5 h-5 mr-2 text-green-500" />
                  Ekip Performans Özeti
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="text-center p-4 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900 dark:to-blue-800 rounded-lg">
                    <div className="text-2xl font-bold text-blue-600 dark:text-blue-400 mb-2">
                      {teamMembers.length > 0 
                        ? (teamMembers.reduce((sum, member) => sum + member.performance_score, 0) / teamMembers.length).toFixed(1)
                        : '0.0'
                      }
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Ortalama Performans</p>
                  </div>
                  <div className="text-center p-4 bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900 dark:to-green-800 rounded-lg">
                    <div className="text-2xl font-bold text-green-600 dark:text-green-400 mb-2">
                      {teamMembers.length > 0 
                        ? (teamMembers.reduce((sum, member) => sum + member.attendance_rate, 0) / teamMembers.length).toFixed(1)
                        : '0.0'
                      }%
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Ortalama Devam Oranı</p>
                  </div>
                  <div className="text-center p-4 bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900 dark:to-orange-800 rounded-lg">
                    <div className="text-2xl font-bold text-orange-600 dark:text-orange-400 mb-2">{teamMembers.length}</div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Ekip Üyesi</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'performance' && (
          <div className="space-y-6">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6 flex items-center">
                <Target className="w-5 h-5 mr-2 text-blue-500" />
                Performans Değerlendirmeleri
              </h2>
              <div className="space-y-4">
                {performanceReviews.map((review) => (
                  <div key={review.id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                          Değerlendirme - {new Date(review.review_date).toLocaleDateString('tr-TR')}
                        </h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          Sonraki değerlendirme: {new Date(review.next_review_date).toLocaleDateString('tr-TR')}
                        </p>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">{review.score}/10</div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">Puan</div>
                      </div>
                    </div>
                    <div className="mb-4">
                      <h4 className="font-medium text-gray-900 dark:text-white mb-2">Değerlendirme Notu</h4>
                      <p className="text-gray-700 dark:text-gray-300">{review.feedback}</p>
                    </div>
                    {review.goals && review.goals.length > 0 && (
                      <div>
                        <h4 className="font-medium text-gray-900 dark:text-white mb-2">Hedefler</h4>
                        <ul className="space-y-1">
                          {review.goals.map((goal, index) => (
                            <li key={index} className="flex items-center space-x-2 text-gray-700 dark:text-gray-300">
                              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                              <span>{goal}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                ))}
                {performanceReviews.length === 0 && (
                  <div className="text-center py-8">
                    <Target className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                    <p className="text-gray-500 dark:text-gray-400">Henüz performans değerlendirmesi bulunmuyor</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'leave' && (
          <div className="space-y-6">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6 flex items-center">
                <Calendar className="w-5 h-5 mr-2 text-green-500" />
                İzin Geçmişi
              </h2>
              <div className="space-y-4">
                {leaveRequests.map((request) => (
                  <div key={request.id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                          {getLeaveTypeLabel(request.leave_type)}
                        </h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {new Date(request.start_date).toLocaleDateString('tr-TR')} - {new Date(request.end_date).toLocaleDateString('tr-TR')}
                        </p>
                      </div>
                      <div className="text-right">
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                          getStatusColor(request.status) === 'green' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' :
                          getStatusColor(request.status) === 'yellow' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' :
                          'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                        }`}>
                          {getStatusLabel(request.status)}
                        </span>
                      </div>
                    </div>
                    <div className="mb-4">
                      <h4 className="font-medium text-gray-900 dark:text-white mb-2">İzin Sebebi</h4>
                      <p className="text-gray-700 dark:text-gray-300">{request.reason}</p>
                    </div>
                    <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
                      <span>{calculateDays(request.start_date, request.end_date)} gün</span>
                      <span>Talep Tarihi: {new Date(request.start_date).toLocaleDateString('tr-TR')}</span>
                    </div>
                  </div>
                ))}
                {leaveRequests.length === 0 && (
                  <div className="text-center py-8">
                    <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                    <p className="text-gray-500 dark:text-gray-400">Henüz izin talebi bulunmuyor</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'skills' && (
          <div className="space-y-6">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6 flex items-center">
                <Brain className="w-5 h-5 mr-2 text-purple-500" />
                Beceriler ve Yetkinlikler
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {employee.skills.map((skillName, index) => {
                  const skill = skills.find(s => s.name === skillName);
                  return (
                    <div key={index} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="font-medium text-gray-900 dark:text-white">{skillName}</h3>
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          skill?.level === 'expert' ? 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200' :
                          skill?.level === 'advanced' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' :
                          skill?.level === 'intermediate' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' :
                          'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
                        }`}>
                          {skill?.level === 'expert' ? 'Uzman' :
                           skill?.level === 'advanced' ? 'İleri' :
                           skill?.level === 'intermediate' ? 'Orta' : 'Başlangıç'}
                        </span>
                      </div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">{skill?.category || 'Kategori belirtilmemiş'}</p>
                    </div>
                  );
                })}
                {employee.skills.length === 0 && (
                  <div className="col-span-full text-center py-8">
                    <Brain className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                    <p className="text-gray-500 dark:text-gray-400">Henüz beceri tanımlanmamış</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'career' && (
          <div className="space-y-6">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6 flex items-center">
                <GraduationCap className="w-5 h-5 mr-2 text-indigo-500" />
                Kariyer Gelişim Planları
              </h2>
              <div className="space-y-4">
                {careerPlans.map((plan) => (
                  <div key={plan.id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                          {plan.current_position} → {plan.target_position}
                        </h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {new Date(plan.start_date).toLocaleDateString('tr-TR')} - {new Date(plan.target_completion_date).toLocaleDateString('tr-TR')}
                        </p>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">{plan.progress_percentage}%</div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">İlerleme</div>
                      </div>
                    </div>
                    <div className="mb-4">
                      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
                        <div 
                          className="bg-gradient-to-r from-indigo-400 to-indigo-600 h-3 rounded-full transition-all duration-300" 
                          style={{ width: `${plan.progress_percentage}%` }}
                        ></div>
                      </div>
                    </div>
                    <div className="mb-4">
                      <h4 className="font-medium text-gray-900 dark:text-white mb-2">Açıklama</h4>
                      <p className="text-gray-700 dark:text-gray-300">{plan.description}</p>
                    </div>
                    <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
                      <span>Durum: {plan.status === 'active' ? 'Aktif' : plan.status === 'completed' ? 'Tamamlandı' : 'Duraklatıldı'}</span>
                      <span>{plan.timeline_months} ay</span>
                    </div>
                  </div>
                ))}
                {careerPlans.length === 0 && (
                  <div className="text-center py-8">
                    <GraduationCap className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                    <p className="text-gray-500 dark:text-gray-400">Henüz kariyer planı bulunmuyor</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'productivity' && (
          <div className="space-y-6">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6 flex items-center">
                <TrendingUp className="w-5 h-5 mr-2 text-green-500" />
                Verimlilik Analizi
              </h2>
              <div className="space-y-4">
                {productivityMetrics.map((metric) => (
                  <div key={metric.id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                          Verimlilik Raporu - {new Date(metric.metric_date).toLocaleDateString('tr-TR')}
                        </h3>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold text-green-600 dark:text-green-400">{metric.efficiency_score}%</div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">Verimlilik</div>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                      <div className="text-center">
                        <div className="text-lg font-bold text-blue-600 dark:text-blue-400">{metric.tasks_completed}</div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">Tamamlanan</div>
                      </div>
                      <div className="text-center">
                        <div className="text-lg font-bold text-purple-600 dark:text-purple-400">{metric.tasks_assigned}</div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">Atanan</div>
                      </div>
                      <div className="text-center">
                        <div className="text-lg font-bold text-orange-600 dark:text-orange-400">{metric.hours_worked}</div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">Çalışma Saati</div>
                      </div>
                      <div className="text-center">
                        <div className="text-lg font-bold text-red-600 dark:text-red-400">{metric.quality_score}/10</div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">Kalite</div>
                      </div>
                    </div>
                    {metric.notes && (
                      <div>
                        <h4 className="font-medium text-gray-900 dark:text-white mb-2">Notlar</h4>
                        <p className="text-gray-700 dark:text-gray-300">{metric.notes}</p>
                      </div>
                    )}
                  </div>
                ))}
                {productivityMetrics.length === 0 && (
                  <div className="text-center py-8">
                    <TrendingUp className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                    <p className="text-gray-500 dark:text-gray-400">Henüz verimlilik verisi bulunmuyor</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'pending-approvals' && (
          <div className="space-y-6">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6 flex items-center">
                <Clock className="w-5 h-5 mr-2 text-orange-500" />
                Onay Bekleyen İzinler
              </h2>
              
              {/* İstatistikler */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="bg-orange-50 dark:bg-orange-900/20 rounded-lg p-4">
                  <div className="flex items-center">
                    <Clock className="w-8 h-8 text-orange-500" />
                    <div className="ml-4">
                      <p className="text-sm font-medium text-orange-600 dark:text-orange-400">Bekleyen</p>
                      <p className="text-2xl font-bold text-orange-700 dark:text-orange-300">
                        {pendingLeaveApprovals.filter(a => a.status === 'pending').length}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4">
                  <div className="flex items-center">
                    <CheckCircle className="w-8 h-8 text-green-500" />
                    <div className="ml-4">
                      <p className="text-sm font-medium text-green-600 dark:text-green-400">Onaylanan</p>
                      <p className="text-2xl font-bold text-green-700 dark:text-green-300">
                        {pendingLeaveApprovals.filter(a => a.status === 'approved').length}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-4">
                  <div className="flex items-center">
                    <XCircle className="w-8 h-8 text-red-500" />
                    <div className="ml-4">
                      <p className="text-sm font-medium text-red-600 dark:text-red-400">Reddedilen</p>
                      <p className="text-2xl font-bold text-red-700 dark:text-red-300">
                        {pendingLeaveApprovals.filter(a => a.status === 'rejected').length}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Onay Bekleyen İzinler Listesi */}
              <div className="space-y-4">
                {pendingLeaveApprovals.length > 0 ? (
                  pendingLeaveApprovals.map((approval) => (
                    <div key={approval.id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-6">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center space-x-4">
                          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                            <span className="text-white font-bold text-sm">
                              {approval.employee_name?.split(' ').map(n => n[0]).join('')}
                            </span>
                          </div>
                          <div>
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                              {approval.employee_name}
                            </h3>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                              {getLeaveTypeLabel(approval.leave_type || '')} • {approval.days_requested} gün
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                            approval.status === 'pending' 
                              ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400'
                              : approval.status === 'approved'
                              ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
                              : 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
                          }`}>
                            {getStatusLabel(approval.status)}
                          </div>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <div>
                          <p className="text-sm text-gray-500 dark:text-gray-400">İzin Tarihleri</p>
                          <p className="text-gray-900 dark:text-white">
                            {approval.start_date && approval.end_date && 
                              `${new Date(approval.start_date).toLocaleDateString('tr-TR')} - ${new Date(approval.end_date).toLocaleDateString('tr-TR')}`
                            }
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500 dark:text-gray-400">Talep Tarihi</p>
                          <p className="text-gray-900 dark:text-white">
                            {new Date(approval.request_date).toLocaleDateString('tr-TR')}
                          </p>
                        </div>
                      </div>
                      
                      {approval.reason && (
                        <div className="mb-4">
                          <p className="text-sm text-gray-500 dark:text-gray-400">İzin Nedeni</p>
                          <p className="text-gray-900 dark:text-white">{approval.reason}</p>
                        </div>
                      )}
                      
                      {approval.status === 'pending' && (
                        <div className="flex items-center space-x-3">
                          <button className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 flex items-center space-x-2">
                            <CheckCircle className="w-4 h-4" />
                            <span>Onayla</span>
                          </button>
                          <button className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 flex items-center space-x-2">
                            <XCircle className="w-4 h-4" />
                            <span>Reddet</span>
                          </button>
                          <button className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 flex items-center space-x-2">
                            <Eye className="w-4 h-4" />
                            <span>Detayları Gör</span>
                          </button>
                        </div>
                      )}
                      
                      {approval.status !== 'pending' && approval.approval_date && (
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          {approval.status === 'approved' ? 'Onaylandı' : 'Reddedildi'} tarihi: {new Date(approval.approval_date).toLocaleDateString('tr-TR')}
                        </div>
                      )}
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8">
                    <Clock className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                    <p className="text-gray-500 dark:text-gray-400">Onay bekleyen izin bulunmuyor</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'development' && (
          <div className="space-y-6">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6 flex items-center">
                <Activity className="w-5 h-5 mr-2 text-purple-500" />
                Gelişim Aktiviteleri
              </h2>
              <div className="space-y-4">
                {developmentActivities.map((activity) => (
                  <div key={activity.id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{activity.title}</h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {new Date(activity.start_date).toLocaleDateString('tr-TR')} - {new Date(activity.end_date).toLocaleDateString('tr-TR')}
                        </p>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">{activity.completion_percentage}%</div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">Tamamlanma</div>
                      </div>
                    </div>
                    <div className="mb-4">
                      <p className="text-gray-700 dark:text-gray-300">{activity.description}</p>
                    </div>
                    <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
                      <span>Tür: {activity.activity_type}</span>
                      <span>Durum: {activity.status === 'completed' ? 'Tamamlandı' : activity.status === 'in_progress' ? 'Devam Ediyor' : 'Planlandı'}</span>
                    </div>
                  </div>
                ))}
                {developmentActivities.length === 0 && (
                  <div className="text-center py-8">
                    <Activity className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                    <p className="text-gray-500 dark:text-gray-400">Henüz gelişim aktivitesi bulunmuyor</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default EmployeeProfile;
