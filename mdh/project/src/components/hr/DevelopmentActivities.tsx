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
  PieChart as PieChartIcon,
  Play,
  Pause,
  StopCircle,
  CalendarDays,
  Clock as ClockIcon,
  Award as AwardIcon,
  BookOpen as BookOpenIcon,
  Video,
  Headphones,
  Globe,
  Code,
  Palette,
  Database,
  Cloud,
  Smartphone,
  Monitor
} from 'lucide-react';

interface DevelopmentActivity {
  id: string;
  employee_id: string;
  activity_type: string;
  title: string;
  description: string;
  start_date: string;
  end_date?: string;
  duration_hours: number;
  status: string;
  completion_percentage: number;
  skills_gained: string[];
  certificate_url?: string;
  notes: string;
  employee_name?: string;
  employee_department?: string;
  employee_position?: string;
}

interface DevelopmentActivityFormData {
  employee_id: string;
  activity_type: string;
  title: string;
  description: string;
  start_date: string;
  end_date: string;
  duration_hours: number;
  status: string;
  completion_percentage: number;
  skills_gained: string[];
  certificate_url: string;
  notes: string;
}

interface DevelopmentActivitiesProps {
  developmentActivities: DevelopmentActivity[];
  employees: any[];
  onDevelopmentUpdate: () => void;
}

const DevelopmentActivities: React.FC<DevelopmentActivitiesProps> = ({ developmentActivities, employees, onDevelopmentUpdate }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [showAddActivity, setShowAddActivity] = useState(false);
  const [showEditActivity, setShowEditActivity] = useState(false);
  const [showViewActivity, setShowViewActivity] = useState(false);
  const [selectedActivity, setSelectedActivity] = useState<DevelopmentActivity | null>(null);
  const [activityFormData, setActivityFormData] = useState<DevelopmentActivityFormData>({
    employee_id: '',
    activity_type: '',
    title: '',
    description: '',
    start_date: '',
    end_date: '',
    duration_hours: 0,
    status: 'in_progress',
    completion_percentage: 0,
    skills_gained: [],
    certificate_url: '',
    notes: ''
  });

  const activityTypes = [
    'online_course',
    'workshop',
    'conference',
    'certification',
    'mentoring',
    'project',
    'reading',
    'video_tutorial',
    'podcast',
    'webinar',
    'hackathon',
    'open_source'
  ];

  const activityStatuses = ['not_started', 'in_progress', 'completed', 'paused', 'cancelled'];

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'online_course': return 'Online Kurs';
      case 'workshop': return 'Atölye';
      case 'conference': return 'Konferans';
      case 'certification': return 'Sertifikasyon';
      case 'mentoring': return 'Mentorluk';
      case 'project': return 'Proje';
      case 'reading': return 'Okuma';
      case 'video_tutorial': return 'Video Eğitim';
      case 'podcast': return 'Podcast';
      case 'webinar': return 'Webinar';
      case 'hackathon': return 'Hackathon';
      case 'open_source': return 'Açık Kaynak';
      default: return type;
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'online_course': return <BookOpenIcon className="w-5 h-5" />;
      case 'workshop': return <Users className="w-5 h-5" />;
      case 'conference': return <Globe className="w-5 h-5" />;
      case 'certification': return <AwardIcon className="w-5 h-5" />;
      case 'mentoring': return <User className="w-5 h-5" />;
      case 'project': return <Code className="w-5 h-5" />;
      case 'reading': return <BookOpen className="w-5 h-5" />;
      case 'video_tutorial': return <Video className="w-5 h-5" />;
      case 'podcast': return <Headphones className="w-5 h-5" />;
      case 'webinar': return <Monitor className="w-5 h-5" />;
      case 'hackathon': return <Zap className="w-5 h-5" />;
      case 'open_source': return <Code className="w-5 h-5" />;
      default: return <Activity className="w-5 h-5" />;
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'not_started': return 'Başlanmadı';
      case 'in_progress': return 'Devam Ediyor';
      case 'completed': return 'Tamamlandı';
      case 'paused': return 'Duraklatıldı';
      case 'cancelled': return 'İptal Edildi';
      default: return status;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'not_started': return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
      case 'in_progress': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'completed': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'paused': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'cancelled': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'not_started': return <ClockIcon className="w-4 h-4" />;
      case 'in_progress': return <Play className="w-4 h-4" />;
      case 'completed': return <CheckCircle className="w-4 h-4" />;
      case 'paused': return <Pause className="w-4 h-4" />;
      case 'cancelled': return <StopCircle className="w-4 h-4" />;
      default: return <ClockIcon className="w-4 h-4" />;
    }
  };

  const getProgressColor = (progress: number) => {
    if (progress >= 80) return 'bg-green-500';
    if (progress >= 60) return 'bg-blue-500';
    if (progress >= 40) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const filteredActivities = developmentActivities.filter(activity => {
    const employee = employees.find(emp => emp.id === activity.employee_id);
    const matchesSearch = employee?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         activity.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         activity.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = !typeFilter || activity.activity_type === typeFilter;
    const matchesStatus = !statusFilter || activity.status === statusFilter;
    return matchesSearch && matchesType && matchesStatus;
  });

  const handleAddActivity = async () => {
    try {
      const { error } = await supabase
        .from('development_activities')
        .insert([activityFormData]);

      if (error) throw error;

      setShowAddActivity(false);
      setActivityFormData({
        employee_id: '',
        activity_type: '',
        title: '',
        description: '',
        start_date: '',
        end_date: '',
        duration_hours: 0,
        status: 'in_progress',
        completion_percentage: 0,
        skills_gained: [],
        certificate_url: '',
        notes: ''
      });
      onDevelopmentUpdate();
    } catch (error) {
      console.error('Gelişim aktivitesi eklenirken hata:', error);
    }
  };

  const handleEditActivity = async () => {
    if (!selectedActivity) return;

    try {
      const { error } = await supabase
        .from('development_activities')
        .update(activityFormData)
        .eq('id', selectedActivity.id);

      if (error) throw error;

      setShowEditActivity(false);
      setSelectedActivity(null);
      onDevelopmentUpdate();
    } catch (error) {
      console.error('Gelişim aktivitesi güncellenirken hata:', error);
    }
  };

  const handleDeleteActivity = async (id: string) => {
    if (!confirm('Bu gelişim aktivitesini silmek istediğinizden emin misiniz?')) return;

    try {
      const { error } = await supabase
        .from('development_activities')
        .delete()
        .eq('id', id);

      if (error) throw error;
      onDevelopmentUpdate();
    } catch (error) {
      console.error('Gelişim aktivitesi silinirken hata:', error);
    }
  };

  const handleViewActivity = (activity: DevelopmentActivity) => {
    setSelectedActivity(activity);
    setShowViewActivity(true);
  };

  const handleEditActivityClick = (activity: DevelopmentActivity) => {
    setSelectedActivity(activity);
    setActivityFormData({
      employee_id: activity.employee_id,
      activity_type: activity.activity_type,
      title: activity.title,
      description: activity.description,
      start_date: activity.start_date,
      end_date: activity.end_date || '',
      duration_hours: activity.duration_hours,
      status: activity.status,
      completion_percentage: activity.completion_percentage,
      skills_gained: activity.skills_gained || [],
      certificate_url: activity.certificate_url || '',
      notes: activity.notes
    });
    setShowEditActivity(true);
  };

  // İstatistikler hesaplama
  const totalActivities = developmentActivities.length;
  const completedActivities = developmentActivities.filter(a => a.status === 'completed').length;
  const inProgressActivities = developmentActivities.filter(a => a.status === 'in_progress').length;
  const totalHours = developmentActivities.reduce((sum, a) => sum + a.duration_hours, 0);

  // Aktivite türü dağılımı
  const activityTypeDistribution = activityTypes.map(type => ({
    type,
    label: getTypeLabel(type),
    count: developmentActivities.filter(a => a.activity_type === type).length
  }));

  // En aktif çalışanlar
  const mostActiveEmployees = employees.map(employee => {
    const employeeActivities = developmentActivities.filter(a => a.id === employee.id);
    return {
      employee,
      activityCount: employeeActivities.length,
      totalHours: employeeActivities.reduce((sum, a) => sum + a.duration_hours, 0)
    };
  }).sort((a, b) => b.activityCount - a.activityCount).slice(0, 5);

  return (
    <div className="space-y-6">
      {/* İstatistikler */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900 dark:to-indigo-900 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Toplam Aktivite</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{totalActivities}</p>
            </div>
            <div className="p-2 bg-blue-500 rounded-lg">
              <Activity className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>
        
        <div className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900 dark:to-emerald-900 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Tamamlanan</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{completedActivities}</p>
            </div>
            <div className="p-2 bg-green-500 rounded-lg">
              <CheckCircle className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>
        
        <div className="bg-gradient-to-br from-purple-50 to-violet-50 dark:from-purple-900 dark:to-violet-900 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Devam Eden</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{inProgressActivities}</p>
            </div>
            <div className="p-2 bg-purple-500 rounded-lg">
              <Play className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>
        
        <div className="bg-gradient-to-br from-yellow-50 to-amber-50 dark:from-yellow-900 dark:to-amber-900 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Toplam Saat</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{totalHours}h</p>
            </div>
            <div className="p-2 bg-yellow-500 rounded-lg">
              <Clock className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>
      </div>

      {/* Aktivite Türü Dağılımı */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
          <PieChartIcon className="w-5 h-5 mr-2 text-blue-500" />
          Aktivite Türü Dağılımı
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {activityTypeDistribution.map((item) => (
            <div key={item.type} className="text-center">
              <div className={`w-16 h-16 mx-auto mb-2 rounded-full flex items-center justify-center ${
                item.count > 0 ? 'bg-blue-100 dark:bg-blue-900' : 'bg-gray-100 dark:bg-gray-700'
              }`}>
                <span className={`text-xl font-bold ${
                  item.count > 0 ? 'text-blue-600 dark:text-blue-400' : 'text-gray-400'
                }`}>
                  {item.count}
                </span>
              </div>
              <p className="text-sm font-medium text-gray-900 dark:text-white">{item.label}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {totalActivities > 0 ? Math.round((item.count / totalActivities) * 100) : 0}%
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* En Aktif Çalışanlar */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
          <Award className="w-5 h-5 mr-2 text-yellow-500" />
          En Aktif Çalışanlar
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          {mostActiveEmployees.map((item, index) => (
            <div key={item.employee.id} className="text-center">
              <div className="relative">
                <div className="w-16 h-16 mx-auto mb-2 rounded-full bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center text-white font-bold text-lg">
                  {item.employee.name?.split(' ').map((n: string) => n[0]).join('').toUpperCase() || '?'}
                </div>
                {index < 3 && (
                  <div className="absolute -top-1 -right-1 w-6 h-6 bg-yellow-500 rounded-full flex items-center justify-center text-white text-xs font-bold">
                    {index + 1}
                  </div>
                )}
              </div>
              <p className="text-sm font-medium text-gray-900 dark:text-white">{item.employee.name || 'Bilinmeyen'}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">{item.activityCount} aktivite</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">{item.totalHours}h toplam</p>
            </div>
          ))}
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
                placeholder="Gelişim aktivitesi ara..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
              />
            </div>
          </div>
          
          <div className="flex gap-2">
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
            >
              <option value="">Tüm Türler</option>
              {activityTypes.map(type => (
                <option key={type} value={type}>{getTypeLabel(type)}</option>
              ))}
            </select>
            
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
            >
              <option value="">Tüm Durumlar</option>
              {activityStatuses.map(status => (
                <option key={status} value={status}>{getStatusLabel(status)}</option>
              ))}
            </select>
          </div>
          
          <button
            onClick={() => setShowAddActivity(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center space-x-2"
          >
            <Plus className="w-5 h-5" />
            <span>Aktivite Ekle</span>
          </button>
        </div>
      </div>

      {/* Gelişim Aktiviteleri Listesi */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredActivities.map((activity) => {
          const employee = employees.find(emp => emp.id === activity.employee_id);
          return (
            <div key={activity.id} className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white">
                    {getTypeIcon(activity.activity_type)}
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{activity.title}</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{getTypeLabel(activity.activity_type)}</p>
                  </div>
                </div>
                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(activity.status)}`}>
                  {getStatusIcon(activity.status)}
                  <span className="ml-1">{getStatusLabel(activity.status)}</span>
                </span>
              </div>

              <div className="space-y-3">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Çalışan</p>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">{employee?.name || 'Bilinmeyen'}</p>
                </div>

                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">İlerleme</p>
                  <div className="flex items-center space-x-2">
                    <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                      <div 
                        className={`h-2 rounded-full ${getProgressColor(activity.completion_percentage)}`}
                        style={{ width: `${activity.completion_percentage}%` }}
                      />
                    </div>
                    <span className="text-sm font-medium text-gray-900 dark:text-white">{activity.completion_percentage}%</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <p className="text-gray-600 dark:text-gray-400">Başlangıç</p>
                    <p className="font-medium text-gray-900 dark:text-white">
                      {new Date(activity.start_date).toLocaleDateString('tr-TR')}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-600 dark:text-gray-400">Süre</p>
                    <p className="font-medium text-gray-900 dark:text-white">{activity.duration_hours}h</p>
                  </div>
                </div>

                {activity.skills_gained && activity.skills_gained.length > 0 && (
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Kazanılan Beceriler</p>
                    <div className="flex flex-wrap gap-1">
                      {activity.skills_gained.slice(0, 3).map((skill, index) => (
                        <span key={index} className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                          {skill}
                        </span>
                      ))}
                      {activity.skills_gained.length > 3 && (
                        <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200">
                          +{activity.skills_gained.length - 3}
                        </span>
                      )}
                    </div>
                  </div>
                )}
              </div>

              <div className="flex justify-end space-x-2 mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                <button
                  onClick={() => handleViewActivity(activity)}
                  className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300"
                >
                  <Eye className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleEditActivityClick(activity)}
                  className="text-green-600 hover:text-green-900 dark:text-green-400 dark:hover:text-green-300"
                >
                  <Edit className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleDeleteActivity(activity.id)}
                  className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Modallar buraya eklenecek */}
      
      {/* Gelişim Aktivitesi Ekleme Modal */}
      {showAddActivity && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Yeni Gelişim Aktivitesi Ekle</h3>
            <div className="space-y-4">
              <select
                value={activityFormData.employee_id}
                onChange={(e) => setActivityFormData({...activityFormData, employee_id: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
              >
                <option value="">Çalışan Seçin</option>
                {employees.map(employee => (
                  <option key={employee.id} value={employee.id}>{employee.name}</option>
                ))}
              </select>
              
              <select
                value={activityFormData.activity_type}
                onChange={(e) => setActivityFormData({...activityFormData, activity_type: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
              >
                <option value="">Aktivite Türü Seçin</option>
                {activityTypes.map(type => (
                  <option key={type} value={type}>{getTypeLabel(type)}</option>
                ))}
              </select>
              
              <input
                type="text"
                placeholder="Aktivite Başlığı"
                value={activityFormData.title}
                onChange={(e) => setActivityFormData({...activityFormData, title: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
              />
              
              <textarea
                placeholder="Aktivite Açıklaması"
                value={activityFormData.description}
                onChange={(e) => setActivityFormData({...activityFormData, description: e.target.value})}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
              />
              
              <div className="grid grid-cols-2 gap-4">
                <input
                  type="date"
                  placeholder="Başlangıç Tarihi"
                  value={activityFormData.start_date}
                  onChange={(e) => setActivityFormData({...activityFormData, start_date: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                />
                
                <input
                  type="date"
                  placeholder="Bitiş Tarihi (Opsiyonel)"
                  value={activityFormData.end_date}
                  onChange={(e) => setActivityFormData({...activityFormData, end_date: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Süre (Saat)</label>
                  <input
                    type="number"
                    min="0"
                    value={activityFormData.duration_hours}
                    onChange={(e) => setActivityFormData({...activityFormData, duration_hours: parseInt(e.target.value) || 0})}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Tamamlanma (%)</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={activityFormData.completion_percentage}
                    onChange={(e) => setActivityFormData({...activityFormData, completion_percentage: parseInt(e.target.value) || 0})}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Durum</label>
                <select
                  value={activityFormData.status}
                  onChange={(e) => setActivityFormData({...activityFormData, status: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                >
                  {activityStatuses.map(status => (
                    <option key={status} value={status}>{getStatusLabel(status)}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Kazanılan Beceriler (virgülle ayırın)</label>
                <input
                  type="text"
                  placeholder="React, Node.js, TypeScript, ..."
                  value={activityFormData.skills_gained.join(', ')}
                  onChange={(e) => setActivityFormData({...activityFormData, skills_gained: e.target.value.split(',').map(s => s.trim()).filter(s => s)})}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                />
              </div>
              
              <input
                type="url"
                placeholder="Sertifika URL (Opsiyonel)"
                value={activityFormData.certificate_url}
                onChange={(e) => setActivityFormData({...activityFormData, certificate_url: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
              />
              
              <textarea
                placeholder="Notlar (Opsiyonel)"
                value={activityFormData.notes}
                onChange={(e) => setActivityFormData({...activityFormData, notes: e.target.value})}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
              />
            </div>
            
            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => setShowAddActivity(false)}
                className="px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600"
              >
                İptal
              </button>
              <button
                onClick={handleAddActivity}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Ekle
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Gelişim Aktivitesi Düzenleme Modal */}
      {showEditActivity && selectedActivity && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Gelişim Aktivitesi Düzenle</h3>
            <div className="space-y-4">
              <select
                value={activityFormData.employee_id}
                onChange={(e) => setActivityFormData({...activityFormData, employee_id: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
              >
                <option value="">Çalışan Seçin</option>
                {employees.map(employee => (
                  <option key={employee.id} value={employee.id}>{employee.name}</option>
                ))}
              </select>
              
              <select
                value={activityFormData.activity_type}
                onChange={(e) => setActivityFormData({...activityFormData, activity_type: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
              >
                <option value="">Aktivite Türü Seçin</option>
                {activityTypes.map(type => (
                  <option key={type} value={type}>{getTypeLabel(type)}</option>
                ))}
              </select>
              
              <input
                type="text"
                placeholder="Aktivite Başlığı"
                value={activityFormData.title}
                onChange={(e) => setActivityFormData({...activityFormData, title: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
              />
              
              <textarea
                placeholder="Aktivite Açıklaması"
                value={activityFormData.description}
                onChange={(e) => setActivityFormData({...activityFormData, description: e.target.value})}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
              />
              
              <div className="grid grid-cols-2 gap-4">
                <input
                  type="date"
                  placeholder="Başlangıç Tarihi"
                  value={activityFormData.start_date}
                  onChange={(e) => setActivityFormData({...activityFormData, start_date: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                />
                
                <input
                  type="date"
                  placeholder="Bitiş Tarihi (Opsiyonel)"
                  value={activityFormData.end_date}
                  onChange={(e) => setActivityFormData({...activityFormData, end_date: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Süre (Saat)</label>
                  <input
                    type="number"
                    min="0"
                    value={activityFormData.duration_hours}
                    onChange={(e) => setActivityFormData({...activityFormData, duration_hours: parseInt(e.target.value) || 0})}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Tamamlanma (%)</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={activityFormData.completion_percentage}
                    onChange={(e) => setActivityFormData({...activityFormData, completion_percentage: parseInt(e.target.value) || 0})}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Durum</label>
                <select
                  value={activityFormData.status}
                  onChange={(e) => setActivityFormData({...activityFormData, status: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                >
                  {activityStatuses.map(status => (
                    <option key={status} value={status}>{getStatusLabel(status)}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Kazanılan Beceriler (virgülle ayırın)</label>
                <input
                  type="text"
                  placeholder="React, Node.js, TypeScript, ..."
                  value={activityFormData.skills_gained.join(', ')}
                  onChange={(e) => setActivityFormData({...activityFormData, skills_gained: e.target.value.split(',').map(s => s.trim()).filter(s => s)})}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                />
              </div>
              
              <input
                type="url"
                placeholder="Sertifika URL (Opsiyonel)"
                value={activityFormData.certificate_url}
                onChange={(e) => setActivityFormData({...activityFormData, certificate_url: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
              />
              
              <textarea
                placeholder="Notlar (Opsiyonel)"
                value={activityFormData.notes}
                onChange={(e) => setActivityFormData({...activityFormData, notes: e.target.value})}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
              />
            </div>
            
            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => setShowEditActivity(false)}
                className="px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600"
              >
                İptal
              </button>
              <button
                onClick={handleEditActivity}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Güncelle
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Gelişim Aktivitesi Görüntüleme Modal */}
      {showViewActivity && selectedActivity && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white">Gelişim Aktivitesi Detayları</h3>
              <button
                onClick={() => setShowViewActivity(false)}
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
                      const employee = employees.find(emp => emp.id === selectedActivity.employee_id);
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

              {/* Aktivite Detayları */}
              <div className="space-y-4">
                <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                  <h4 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center">
                    <Target className="w-5 h-5 mr-2 text-green-500" />
                    Aktivite Detayları
                  </h4>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600 dark:text-gray-300">Aktivite Türü</span>
                      <span className="text-sm font-medium text-gray-900 dark:text-white">
                        {getTypeLabel(selectedActivity.activity_type)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600 dark:text-gray-300">Durum</span>
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(selectedActivity.status)}`}>
                        {getStatusIcon(selectedActivity.status)}
                        <span className="ml-1">{getStatusLabel(selectedActivity.status)}</span>
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600 dark:text-gray-300">İlerleme</span>
                      <span className="text-sm font-medium text-gray-900 dark:text-white">
                        {selectedActivity.completion_percentage}%
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2">
                      <div 
                        className={`h-2 rounded-full ${getProgressColor(selectedActivity.completion_percentage)}`}
                        style={{ width: `${selectedActivity.completion_percentage}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Zaman ve Süre */}
              <div className="space-y-4">
                <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                  <h4 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center">
                    <Clock className="w-5 h-5 mr-2 text-purple-500" />
                    Zaman ve Süre
                  </h4>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600 dark:text-gray-300">Başlangıç Tarihi</span>
                      <span className="text-sm font-medium text-gray-900 dark:text-white">
                        {new Date(selectedActivity.start_date).toLocaleDateString('tr-TR')}
                      </span>
                    </div>
                    {selectedActivity.end_date && (
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600 dark:text-gray-300">Bitiş Tarihi</span>
                        <span className="text-sm font-medium text-gray-900 dark:text-white">
                          {new Date(selectedActivity.end_date).toLocaleDateString('tr-TR')}
                        </span>
                      </div>
                    )}
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600 dark:text-gray-300">Toplam Süre</span>
                      <span className="text-sm font-medium text-gray-900 dark:text-white">
                        {selectedActivity.duration_hours} saat
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Açıklama */}
            <div className="mt-6">
              <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                <h4 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center">
                  <MessageSquare className="w-5 h-5 mr-2 text-blue-500" />
                  Aktivite Açıklaması
                </h4>
                <p className="text-sm text-gray-900 dark:text-white">
                  {selectedActivity.description || 'Açıklama belirtilmemiş'}
                </p>
              </div>
            </div>

            {/* Kazanılan Beceriler */}
            {selectedActivity.skills_gained && selectedActivity.skills_gained.length > 0 && (
              <div className="mt-6">
                <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                  <h4 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center">
                    <BookOpen className="w-5 h-5 mr-2 text-green-500" />
                    Kazanılan Beceriler
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {selectedActivity.skills_gained.map((skill, index) => (
                      <span key={index} className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Sertifika */}
            {selectedActivity.certificate_url && (
              <div className="mt-6">
                <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                  <h4 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center">
                    <AwardIcon className="w-5 h-5 mr-2 text-yellow-500" />
                    Sertifika
                  </h4>
                  <a 
                    href={selectedActivity.certificate_url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 text-sm underline"
                  >
                    Sertifikayı Görüntüle
                  </a>
                </div>
              </div>
            )}

            {/* Notlar */}
            {selectedActivity.notes && (
              <div className="mt-6">
                <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                  <h4 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center">
                    <MessageSquare className="w-5 h-5 mr-2 text-blue-500" />
                    Notlar
                  </h4>
                  <p className="text-sm text-gray-900 dark:text-white">
                    {selectedActivity.notes}
                  </p>
                </div>
              </div>
            )}

            <div className="flex justify-end mt-6">
              <button
                onClick={() => handleEditActivityClick(selectedActivity)}
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

export default DevelopmentActivities;
