import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useUser } from '../contexts/UserContext';
import EmployeeManagement from './hr/EmployeeManagement';
import SkillManagement from './hr/SkillManagement';
import LeaveManagement from './hr/LeaveManagement';
import PerformanceTracking from './hr/PerformanceTracking';
import CareerPlanning from './hr/CareerPlanning';
import ProductivityAnalysis from './hr/ProductivityAnalysis';
import DevelopmentActivities from './hr/DevelopmentActivities';
import LeaveApprovalManager from './hr/LeaveApprovalManager';
import PayrollManagement from './hr/PayrollManagement';
import { 
  BarChart3, 
  Brain, 
  Target, 
  GraduationCap, 
  Calendar, 
  TrendingUp,
  Users,
  Award,
  Clock,
  CheckCircle,
  AlertCircle,
  Activity,
  Plus,
  Edit,
  Trash2,
  Eye,
  Download,
  Filter,
  Search,
  UserPlus,
  BookOpen,
  Briefcase,
  Heart,
  Star,
  TrendingDown,
  Zap,
  X,
  Save,
  User,
  FileText,
  Map,
  Lightbulb,
  Flag,
  XCircle,
  PieChart,
  List,
  CheckSquare,
  DollarSign,
  Settings
} from 'lucide-react';
import { ArrowRight } from 'lucide-react';

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
  salary?: number; // Added for payroll
}

interface Skill {
  id: string;
  name: string;
  category: string;
  level: string;
  employees: string[];
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

interface LeaveRequestFormData {
  employee_id: string;
  leave_type: string;
  start_date: string;
  end_date: string;
  reason: string;
  status: string;
  days_requested: number;
}

interface CompetencyAssessment {
  id: string;
  employee_id: string;
  skill_id: string;
  assessor_id: string;
  current_level: string;
  target_level: string;
  assessment_date: string;
  notes: string;
  next_assessment_date: string;
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
  skills_developed: string[];
}

// Form interfaces
interface EmployeeFormData {
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

interface SkillFormData {
  name: string;
  category: string;
  level: string;
}

const HRManagement: React.FC = () => {
  const { userProfile } = useUser();
  const navigate = useNavigate();
  const location = useLocation();
  const [activeTab, setActiveTab] = useState('overview');
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [skills, setSkills] = useState<Skill[]>([]);
  const [performanceReviews, setPerformanceReviews] = useState<PerformanceReview[]>([]);
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([]);
  const [competencyAssessments, setCompetencyAssessments] = useState<CompetencyAssessment[]>([]);
  const [careerPlans, setCareerPlans] = useState<CareerDevelopmentPlan[]>([]);
  const [productivityMetrics, setProductivityMetrics] = useState<ProductivityMetric[]>([]);
  const [developmentActivities, setDevelopmentActivities] = useState<DevelopmentActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDepartment, setSelectedDepartment] = useState('all');
  const [leaveSearchTerm, setLeaveSearchTerm] = useState('');
  const [selectedLeaveStatus, setSelectedLeaveStatus] = useState('all');
  
  // Modal states
  const [showAddEmployee, setShowAddEmployee] = useState(false);
  const [showEditEmployee, setShowEditEmployee] = useState(false);
  const [showViewEmployee, setShowViewEmployee] = useState(false);
  const [showAddSkill, setShowAddSkill] = useState(false);
  const [showEditSkill, setShowEditSkill] = useState(false);
  const [showAddLeaveRequest, setShowAddLeaveRequest] = useState(false);
  const [showEditLeaveRequest, setShowEditLeaveRequest] = useState(false);
  const [showViewLeaveRequest, setShowViewLeaveRequest] = useState(false);
  
  // Selected items
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [selectedSkill, setSelectedSkill] = useState<Skill | null>(null);
  const [selectedLeaveRequest, setSelectedLeaveRequest] = useState<LeaveRequest | null>(null);
  
  // Form data
  const [employeeFormData, setEmployeeFormData] = useState<EmployeeFormData>({
    name: '',
    email: '',
    position: '',
    title: 'Çalışan',
    department: '',
    hire_date: '',
    manager_id: undefined,
    team_size: 0,
    reporting_level: 1,
    skills: [],
    performance_score: 0,
    attendance_rate: 100,
    leave_balance: 20,
    career_goals: [],
    status: 'active'
  });
  
  const [skillFormData, setSkillFormData] = useState<SkillFormData>({
    name: '',
    category: '',
    level: 'beginner'
  });

  const [leaveRequestFormData, setLeaveRequestFormData] = useState<LeaveRequestFormData>({
    employee_id: '',
    leave_type: '',
    start_date: '',
    end_date: '',
    reason: '',
    status: 'pending',
    days_requested: 0
  });



  // Departments
  const departments = ['Teknoloji', 'Müşteri Hizmetleri', 'Satış', 'İK', 'Finans', 'Pazarlama', 'Operasyon', 'Genel Yönetim'];
  const titles = ['Stajyer', 'Junior', 'Uzman', 'Senior', 'Müdür Yardımcısı', 'Müdür', 'Bölge Müdürü', 'Direktör', 'Genel Müdür'];
  const skillCategories = ['Programlama', 'Frontend', 'Backend', 'DevOps', 'Cloud', 'Soft Skills', 'Satış', 'İnsan Kaynakları', 'Sistem Yönetimi'];
  const skillLevels = ['beginner', 'intermediate', 'advanced', 'expert'];
  const leaveTypes = ['annual', 'sick', 'personal', 'maternity', 'paternity'];
  const leaveStatuses = ['pending', 'approved', 'rejected'];

  useEffect(() => {
    fetchHRData();
  }, []);

  const fetchHRData = async () => {
    try {
      setLoading(true);
      console.log('HR verileri yükleniyor...');
      
      // Çalışanları getir
      const { data: employeesData, error: employeesError } = await supabase
        .from('employees')
        .select('*')
        .order('name');
      
      console.log('Çalışanlar verisi:', employeesData);
      console.log('Çalışanlar hatası:', employeesError);
      
      if (employeesError) throw employeesError;
      setEmployees(employeesData || []);

      // Becerileri getir
      const { data: skillsData, error: skillsError } = await supabase
        .from('skills')
        .select('*')
        .order('name');
      
      console.log('Beceriler verisi:', skillsData);
      console.log('Beceriler hatası:', skillsError);
      
      if (skillsError) throw skillsError;
      setSkills(skillsData || []);

      // Performans değerlendirmelerini getir
      const { data: reviewsData, error: reviewsError } = await supabase
        .from('performance_reviews')
        .select('*')
        .order('review_date', { ascending: false });
      
      console.log('Performans değerlendirmeleri verisi:', reviewsData);
      console.log('Performans değerlendirmeleri hatası:', reviewsError);
      
      if (reviewsError) throw reviewsError;
      setPerformanceReviews(reviewsData || []);

      // İzin taleplerini getir
      const { data: leaveData, error: leaveError } = await supabase
        .from('leave_requests')
        .select('*')
        .order('start_date', { ascending: false });
      
      console.log('İzin talepleri verisi:', leaveData);
      console.log('İzin talepleri hatası:', leaveError);
      
      if (leaveError) throw leaveError;
      setLeaveRequests(leaveData || []);

      // Yeterlilik değerlendirmelerini getir
      const { data: competencyData, error: competencyError } = await supabase
        .from('competency_assessments')
        .select('*')
        .order('assessment_date', { ascending: false });
      
      console.log('Yeterlilik değerlendirmeleri verisi:', competencyData);
      console.log('Yeterlilik değerlendirmeleri hatası:', competencyError);
      
      if (competencyError) throw competencyError;
      setCompetencyAssessments(competencyData || []);

      // Kariyer gelişim planlarını getir
      const { data: careerData, error: careerError } = await supabase
        .from('career_development_plans')
        .select('*')
        .order('start_date', { ascending: false });
      
      console.log('Kariyer planları verisi:', careerData);
      console.log('Kariyer planları hatası:', careerError);
      
      if (careerError) throw careerError;
      setCareerPlans(careerData || []);

      // Verimlilik metriklerini getir
      const { data: productivityData, error: productivityError } = await supabase
        .from('productivity_metrics')
        .select('*')
        .order('metric_date', { ascending: false });
      
      console.log('Verimlilik metrikleri verisi:', productivityData);
      console.log('Verimlilik metrikleri hatası:', productivityError);
      
      if (productivityError) throw productivityError;
      setProductivityMetrics(productivityData || []);

      // Gelişim aktivitelerini getir
      const { data: activitiesData, error: activitiesError } = await supabase
        .from('development_activities')
        .select('*')
        .order('start_date', { ascending: false });
      
      console.log('Gelişim aktiviteleri verisi:', activitiesData);
      console.log('Gelişim aktiviteleri hatası:', activitiesError);
      
      if (activitiesError) throw activitiesError;
      setDevelopmentActivities(activitiesData || []);

      console.log('Tüm HR verileri başarıyla yüklendi!');

    } catch (error) {
      console.error('HR verileri yüklenirken hata:', error);
    } finally {
      setLoading(false);
    }
  };

  // Individual fetch functions for components
  const fetchEmployees = async () => {
    try {
      const { data, error } = await supabase
        .from('employees')
        .select('*')
        .order('name');
      
      if (error) throw error;
      setEmployees(data || []);
    } catch (error) {
      console.error('Çalışanlar yüklenirken hata:', error);
    }
  };

  const fetchSkills = async () => {
    try {
      const { data, error } = await supabase
        .from('skills')
        .select('*')
        .order('name');
      
      if (error) throw error;
      setSkills(data || []);
    } catch (error) {
      console.error('Beceriler yüklenirken hata:', error);
    }
  };

  const fetchPerformanceReviews = async () => {
    try {
      const { data, error } = await supabase
        .from('performance_reviews')
        .select('*')
        .order('review_date', { ascending: false });
      
      if (error) throw error;
      setPerformanceReviews(data || []);
    } catch (error) {
      console.error('Performans değerlendirmeleri yüklenirken hata:', error);
    }
  };

  const fetchLeaveRequests = async () => {
    try {
      const { data, error } = await supabase
        .from('leave_requests')
        .select('*')
        .order('start_date', { ascending: false });
      
      if (error) throw error;
      setLeaveRequests(data || []);
    } catch (error) {
      console.error('İzin talepleri yüklenirken hata:', error);
    }
  };

  const fetchCareerPlans = async () => {
    try {
      const { data, error } = await supabase
        .from('career_development_plans')
        .select('*')
        .order('start_date', { ascending: false });
      
      if (error) throw error;
      setCareerPlans(data || []);
    } catch (error) {
      console.error('Kariyer planları yüklenirken hata:', error);
    }
  };

  const fetchProductivityMetrics = async () => {
    try {
      const { data, error } = await supabase
        .from('productivity_metrics')
        .select('*')
        .order('metric_date', { ascending: false });
      
      if (error) throw error;
      setProductivityMetrics(data || []);
    } catch (error) {
      console.error('Verimlilik metrikleri yüklenirken hata:', error);
    }
  };

  const fetchDevelopmentActivities = async () => {
    try {
      const { data, error } = await supabase
        .from('development_activities')
        .select('*')
        .order('start_date', { ascending: false });
      
      if (error) throw error;
      setDevelopmentActivities(data || []);
    } catch (error) {
      console.error('Gelişim aktiviteleri yüklenirken hata:', error);
    }
  };

  const tabs = [
    { id: 'overview', name: 'Genel Bakış', icon: BarChart3 },
    // Müdür rolü kontrolü ile müdürler sekmesi
    ...(userProfile.role.toLowerCase().includes('müdür') || userProfile.role.toLowerCase().includes('yönetici') || userProfile.role.toLowerCase().includes('direktör') ? [
      { id: 'managers', name: 'Müdürler', icon: Award }
    ] : []),
    { id: 'employees', name: 'Çalışan Yönetimi', icon: Users },
    { id: 'payroll', name: 'Bordro ve Maaş', icon: DollarSign },
    { id: 'skills', name: 'Beceri Yönetimi', icon: Brain },
    { id: 'performance', name: 'Performans Takibi', icon: Target },
    { id: 'career', name: 'Kariyer Planlama', icon: GraduationCap },
    { id: 'leave', name: 'İzin Takibi', icon: Calendar },
    { id: 'productivity', name: 'Verimlilik Analizi', icon: TrendingUp },
    { id: 'development', name: 'Gelişim Aktiviteleri', icon: Activity }
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }



  return (
    <div className="p-4 max-w-full overflow-hidden">
      <div className="mb-4">
        <h1 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white">İK Yönetimi</h1>
        <p className="text-sm md:text-base text-gray-600 dark:text-gray-400">Çalışan yönetimi ve performans takibi</p>
      </div>

      {/* Tab Navigation */}
      <nav className="flex space-x-4 md:space-x-8 border-b border-gray-200 dark:border-gray-700 mb-4 overflow-x-auto pb-2">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center space-x-1 md:space-x-2 py-2 px-1 border-b-2 font-medium text-xs md:text-sm whitespace-nowrap flex-shrink-0 ${
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
              }`}
            >
              <Icon className="w-3 h-3 md:w-4 md:h-4" />
              <span>{tab.name}</span>
            </button>
          );
        })}
      </nav>

      {/* Tab Content */}
      <div className="mt-4 overflow-hidden">
        {activeTab === 'overview' && (
    <div className="space-y-4 md:space-y-6">
      {/* İstatistikler */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-6">
        <div className="bg-white dark:bg-gray-800 p-3 md:p-6 rounded-lg shadow">
          <div className="flex items-center">
            <Users className="w-6 h-6 md:w-8 md:h-8 text-blue-500" />
            <div className="ml-2 md:ml-4">
              <p className="text-xs md:text-sm font-medium text-gray-600 dark:text-gray-400">Toplam Çalışan</p>
              <p className="text-lg md:text-2xl font-bold text-gray-900 dark:text-white">{employees.length}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white dark:bg-gray-800 p-3 md:p-6 rounded-lg shadow">
          <div className="flex items-center">
            <Award className="w-6 h-6 md:w-8 md:h-8 text-green-500" />
            <div className="ml-2 md:ml-4">
              <p className="text-xs md:text-sm font-medium text-gray-600 dark:text-gray-400">Ortalama Performans</p>
              <p className="text-lg md:text-2xl font-bold text-gray-900 dark:text-white">
                {employees.length > 0 
                  ? (employees.reduce((sum, emp) => sum + emp.performance_score, 0) / employees.length).toFixed(1)
                  : '0.0'
                }
              </p>
            </div>
          </div>
        </div>
        
        <div className="bg-white dark:bg-gray-800 p-3 md:p-6 rounded-lg shadow">
          <div className="flex items-center">
            <Clock className="w-6 h-6 md:w-8 md:h-8 text-yellow-500" />
            <div className="ml-2 md:ml-4">
              <p className="text-xs md:text-sm font-medium text-gray-600 dark:text-gray-400">Bekleyen İzin</p>
              <p className="text-lg md:text-2xl font-bold text-gray-900 dark:text-white">
                {leaveRequests.filter(req => req.status === 'pending').length}
              </p>
            </div>
          </div>
        </div>
        
        <div className="bg-white dark:bg-gray-800 p-3 md:p-6 rounded-lg shadow">
          <div className="flex items-center">
            <Brain className="w-6 h-6 md:w-8 md:h-8 text-purple-500" />
            <div className="ml-2 md:ml-4">
              <p className="text-xs md:text-sm font-medium text-gray-600 dark:text-gray-400">Toplam Beceri</p>
              <p className="text-lg md:text-2xl font-bold text-gray-900 dark:text-white">{skills.length}</p>
            </div>
          </div>
        </div>
      </div>

            {/* Çalışan Listesi */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm overflow-hidden">
              <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
                  <Users className="w-5 h-5 mr-2 text-blue-500" />
                  Çalışan Listesi
          </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  Toplam {employees.length} çalışan bulunmaktadır
                </p>
                  </div>
                  
              {employees.length === 0 ? (
                <div className="p-8 text-center">
                  <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500 dark:text-gray-400">Henüz çalışan bulunmamaktadır</p>
            <button
                    onClick={() => setActiveTab('employees')}
                    className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center space-x-2 mx-auto"
            >
                    <UserPlus className="w-4 h-4" />
                    <span>İlk Çalışanı Ekle</span>
            </button>
          </div>
              ) : (
        <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                          Çalışan
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                          Pozisyon
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                          Departman
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                          Bağlı Olduğu Yönetici
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                          Performans
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                          Durum
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                          İşlemler
                        </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                      {employees.slice(0, 5).map((employee) => (
                        <tr key={employee.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                          <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                              <div className="flex-shrink-0 h-10 w-10">
                                <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-semibold">
                                  {employee.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                        </div>
                        </div>
                              <div className="ml-4">
                                <div className="text-sm font-medium text-gray-900 dark:text-white">
                                  {employee.name}
                      </div>
                                <div className="text-sm text-gray-500 dark:text-gray-400">
                                  {employee.email}
                      </div>
                      </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900 dark:text-white">{employee.position}</div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                              {employee.title} • {new Date(employee.hire_date).getFullYear()} - {new Date().getFullYear()} = {new Date().getFullYear() - new Date(employee.hire_date).getFullYear()} yıl
                      </div>
                    </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900 dark:text-white">{employee.department}</div>
                    </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900 dark:text-white">
                              {employee.manager_id ? 
                                employees.find(emp => emp.id === employee.manager_id)?.name || 'Belirtilmemiş' 
                                : 'Belirtilmemiş'
                              }
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-2 mr-2">
                                <div 
                                  className={`h-2 rounded-full ${
                                    employee.performance_score >= 80 ? 'bg-green-500' :
                                    employee.performance_score >= 60 ? 'bg-yellow-500' : 'bg-red-500'
                                  }`}
                                  style={{ width: `${employee.performance_score}%` }}
                                />
                              </div>
                              <span className="text-sm text-gray-900 dark:text-white">
                                {employee.performance_score}%
                              </span>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                              employee.status === 'active' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' :
                              employee.status === 'inactive' ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' :
                              'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                            }`}>
                              {employee.status === 'active' ? 'Aktif' : 
                               employee.status === 'inactive' ? 'Pasif' : 'İzinde'}
                    </span>
                    </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        <button
                                onClick={() => {
                                  navigate('/employee-profile', { 
                                    state: { 
                                      employeeId: employee.id, 
                                      employeeName: employee.name,
                                      from: location.pathname 
                                    } 
                                  });
                                }}
                          className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300"
                                title="Profil Görüntüle"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                                onClick={() => setActiveTab('employees')}
                                className="text-green-600 hover:text-green-900 dark:text-green-400 dark:hover:text-green-300"
                          title="Düzenle"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                  </div>
                    </td>
                  </tr>
                      ))}
            </tbody>
          </table>
        </div>
              )}
              
              {employees.length > 5 && (
                <div className="p-4 border-t border-gray-200 dark:border-gray-700 text-center">
                  <button
                    onClick={() => setActiveTab('employees')}
                    className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 font-medium flex items-center space-x-2 mx-auto"
                  >
                    <span>Tüm {employees.length} çalışanı görüntüle</span>
                    <ArrowRight className="w-4 h-4" />
                      </button>
                    </div>
              )}
                  </div>
                </div>
        )}
        {activeTab === 'employees' && (
          <div className="space-y-6">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white flex items-center">
                  <Users className="w-5 h-5 mr-2 text-blue-500" />
                  Çalışan Yönetimi
                </h2>
                <button
                  onClick={() => setShowAddEmployee(true)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center space-x-2"
                >
                  <UserPlus className="w-4 h-4" />
                  <span>Çalışan Ekle</span>
                </button>
              </div>
              
              <EmployeeManagement 
                employees={employees}
                onEmployeeUpdate={fetchEmployees}
                onViewEmployee={(employeeId: string) => {
                  const employee = employees.find(emp => emp.id === employeeId);
                  navigate('/employee-profile', { 
                    state: { 
                      employeeId: employeeId, 
                      employeeName: employee?.name || '',
                      from: location.pathname 
                    } 
                  });
                }}
              />
            </div>
          </div>
        )}
        {activeTab === 'skills' && (
          <SkillManagement 
            skills={skills}
            onSkillUpdate={fetchSkills}
          />
        )}
        {activeTab === 'performance' && (
          <PerformanceTracking 
            performanceReviews={performanceReviews}
            employees={employees}
            onPerformanceUpdate={fetchPerformanceReviews}
          />
        )}
        {activeTab === 'career' && (
          <CareerPlanning 
            careerPlans={careerPlans}
            employees={employees}
            onCareerUpdate={fetchCareerPlans}
          />
        )}
                {activeTab === 'leave' && (
          <LeaveManagement 
            leaveRequests={leaveRequests}
            employees={employees}
            onLeaveUpdate={fetchLeaveRequests}
          />
        )}
        {activeTab === 'payroll' && (
          <PayrollManagement />
        )}
        {activeTab === 'productivity' && (
          <ProductivityAnalysis 
            productivityMetrics={productivityMetrics}
            employees={employees}
            onProductivityUpdate={fetchProductivityMetrics}
          />
        )}
        {activeTab === 'development' && (
          <DevelopmentActivities 
            developmentActivities={developmentActivities}
            employees={employees}
            onDevelopmentUpdate={fetchDevelopmentActivities}
          />
        )}
        {activeTab === 'managers' && (
          <div className="space-y-6">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white flex items-center">
                  <Award className="w-5 h-5 mr-2 text-purple-500" />
                  Müdür Yönetimi
                </h2>
                <div className="flex items-center space-x-2">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <input
                      type="text"
                      placeholder="Müdür ara..."
                      className="pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                  <select
                    value={selectedDepartment}
                    onChange={(e) => setSelectedDepartment(e.target.value)}
                    className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="all">Tüm Departmanlar</option>
                    {departments.map(dept => (
                      <option key={dept} value={dept}>{dept}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Müdür İstatistikleri */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <div className="bg-gradient-to-r from-purple-50 to-purple-100 dark:from-purple-900 dark:to-purple-800 rounded-lg p-4">
                  <div className="flex items-center">
                    <Award className="w-8 h-8 text-purple-500" />
                    <div className="ml-3">
                      <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Toplam Müdür</p>
                      <p className="text-2xl font-bold text-gray-900 dark:text-white">
                        {employees.filter(emp => 
                          emp.title && (emp.title.toLowerCase().includes('müdür') || 
                          emp.title.toLowerCase().includes('yönetici') ||
                          emp.title.toLowerCase().includes('direktör'))
                        ).length}
                      </p>
                    </div>
                  </div>
                </div>
                
                <div className="bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-900 dark:to-blue-800 rounded-lg p-4">
                  <div className="flex items-center">
                    <Users className="w-8 h-8 text-blue-500" />
                    <div className="ml-3">
                      <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Toplam Ekip</p>
                      <p className="text-2xl font-bold text-gray-900 dark:text-white">
                        {employees.reduce((sum, emp) => sum + emp.team_size, 0)}
                      </p>
                    </div>
                  </div>
                </div>
                
                <div className="bg-gradient-to-r from-green-50 to-green-100 dark:from-green-900 dark:to-green-800 rounded-lg p-4">
                  <div className="flex items-center">
                    <Target className="w-8 h-8 text-green-500" />
                    <div className="ml-3">
                      <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Ort. Performans</p>
                      <p className="text-2xl font-bold text-gray-900 dark:text-white">
                        {(() => {
                          const managers = employees.filter(emp => 
                            emp.title && (emp.title.toLowerCase().includes('müdür') || 
                            emp.title.toLowerCase().includes('yönetici') ||
                            emp.title.toLowerCase().includes('direktör'))
                          );
                          return managers.length > 0 
                            ? (managers.reduce((sum, emp) => sum + emp.performance_score, 0) / managers.length).toFixed(1)
                            : '0.0';
                        })()}
                      </p>
                    </div>
                  </div>
                </div>
                
                <div className="bg-gradient-to-r from-orange-50 to-orange-100 dark:from-orange-900 dark:to-orange-800 rounded-lg p-4">
                  <div className="flex items-center">
                    <TrendingUp className="w-8 h-8 text-orange-500" />
                    <div className="ml-3">
                      <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Aktif Departman</p>
                      <p className="text-2xl font-bold text-gray-900 dark:text-white">
                        {new Set(employees.filter(emp => 
                          emp.title && (emp.title.toLowerCase().includes('müdür') || 
                          emp.title.toLowerCase().includes('yönetici') ||
                          emp.title.toLowerCase().includes('direktör'))
                        ).map(emp => emp.department)).size}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Müdür Tablosu */}
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                  <thead className="bg-gray-50 dark:bg-gray-700">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Müdür
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Departman
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Ekip Büyüklüğü
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Performans
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Deneyim
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        İşlemler
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                    {employees
                      .filter(emp => 
                        emp.title && (emp.title.toLowerCase().includes('müdür') || 
                         emp.title.toLowerCase().includes('yönetici') ||
                         emp.title.toLowerCase().includes('direktör')) &&
                        (selectedDepartment === 'all' || emp.department === selectedDepartment) &&
                        (searchTerm === '' || emp.name.toLowerCase().includes(searchTerm.toLowerCase()) || emp.department.toLowerCase().includes(searchTerm.toLowerCase()))
                      )
                      .map((manager) => (
                        <tr key={manager.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="flex-shrink-0 h-10 w-10">
                                <div className="h-10 w-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center text-white font-semibold">
                                  {manager.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                                </div>
                              </div>
                              <div className="ml-4">
                                <div className="text-sm font-medium text-gray-900 dark:text-white">
                                  {manager.name}
                                </div>
                                <div className="text-sm text-gray-500 dark:text-gray-400">
                                  {manager.title}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900 dark:text-white">{manager.department}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900 dark:text-white">{manager.team_size} kişi</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-2 mr-2">
                                <div 
                                  className={`h-2 rounded-full ${
                                    manager.performance_score >= 80 ? 'bg-green-500' :
                                    manager.performance_score >= 60 ? 'bg-yellow-500' : 'bg-red-500'
                                  }`}
                                  style={{ width: `${manager.performance_score}%` }}
                                />
                              </div>
                              <span className="text-sm text-gray-900 dark:text-white">
                                {manager.performance_score}%
                              </span>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900 dark:text-white">
                              {new Date().getFullYear() - new Date(manager.hire_date).getFullYear()} yıl
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <div className="flex space-x-2">
                              <button
                                onClick={() => {
                                  navigate('/employee-profile', { 
                                    state: { 
                                      employeeId: manager.id, 
                                      employeeName: manager.name,
                                      from: '/hr-management' 
                                    } 
                                  });
                                }}
                                className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300"
                                title="Profil Görüntüle"
                              >
                                <Eye className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => setActiveTab('employees')}
                                className="text-green-600 hover:text-green-900 dark:text-green-400 dark:hover:text-green-300"
                                title="Düzenle"
                              >
                                <Edit className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>

              {employees.filter(emp => 
                emp.title && (emp.title.toLowerCase().includes('müdür') || 
                emp.title.toLowerCase().includes('yönetici') ||
                emp.title.toLowerCase().includes('direktör'))
              ).length === 0 && (
                <div className="text-center py-8">
                  <Award className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                  <p className="text-gray-500 dark:text-gray-400">Henüz müdür bulunmamaktadır</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* İzin Onay Yönetimi - Sadece Yöneticiler için */}
        {activeTab === 'managers' && (
          <div className="mt-6">
            <LeaveApprovalManager />
          </div>
        )}
      </div>
    </div>
  );
};

export default HRManagement;
