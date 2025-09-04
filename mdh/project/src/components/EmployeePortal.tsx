import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  User, 
  Calendar, 
  Clock, 
  DollarSign, 
  TrendingUp, 
  Award, 
  FileText, 
  Settings, 
  Bell, 
  Home,
  Briefcase,
  CreditCard,
  BarChart3,
  MessageSquare,
  CheckCircle,
  AlertCircle,
  Star,
  Users,
  Building,
  Shield,
  Calculator,
  Receipt,
  Target,
  Brain,
  Save,
  GraduationCap,
  Info,
  Plus,
  Edit,
  Eye,
  Download,
  RefreshCw,
  Send,
  Phone,
  Video,
  Paperclip,
  Smile,
  Mic,
  Search,
  Filter,
  MoreVertical,
  X,
  AlertTriangle,
  Megaphone,
  UserPlus,
  Hash,
  Lock,
  Globe
} from 'lucide-react';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';
import EmployeeChat from './EmployeeChat';

interface EmployeePortalProps {
  onBackToAdmin?: () => void;
}

const EmployeePortal: React.FC<EmployeePortalProps> = ({ onBackToAdmin }) => {
  const navigate = useNavigate();
  const [currentPage, setCurrentPage] = useState('dashboard');
  const [employee, setEmployee] = useState({
    id: 'emp-001',
    name: 'Ahmet Yılmaz',
    email: 'ahmet.yilmaz@sirket.com',
    position: 'Yazılım Geliştirici',
    department: 'IT',
    hireDate: '2023-01-15',
    manager: 'Mehmet Demir',
    avatar: 'AY',
    status: 'active'
  });

  const [dashboardStats, setDashboardStats] = useState({
    totalWorkDays: 22,
    completedTasks: 15,
    pendingTasks: 3,
    leaveBalance: 12,
    performanceScore: 4.2,
    monthlySalary: 25000,
    overtimeHours: 8,
    attendanceRate: 95.5
  });

  // Gelişmiş dashboard verileri
  const [advancedStats, setAdvancedStats] = useState({
    daily: {
      tasksCompleted: 3,
      hoursWorked: 8.5,
      meetingsAttended: 2,
      goalsAchieved: 1
    },
    weekly: {
      tasksCompleted: 18,
      hoursWorked: 42.5,
      meetingsAttended: 8,
      goalsAchieved: 5
    },
    monthly: {
      tasksCompleted: 72,
      hoursWorked: 170,
      meetingsAttended: 32,
      goalsAchieved: 20
    },
    targets: {
      dailyTasks: 4,
      weeklyTasks: 20,
      monthlyTasks: 80,
      dailyHours: 8,
      weeklyHours: 40,
      monthlyHours: 160
    },
    teamComparison: {
      myRank: 3,
      totalMembers: 12,
      aboveAverage: true,
      percentile: 75
    },
    achievements: [
      { id: 1, title: 'Haftalık Hedef Aşımı', description: 'Bu hafta hedeflenen görev sayısını %20 aştınız', date: '2024-01-15', icon: '🏆', color: 'gold' },
      { id: 2, title: 'Mükemmel Devam', description: 'Son 30 günde %100 devam oranı', date: '2024-01-10', icon: '⭐', color: 'blue' },
      { id: 3, title: 'Takım Lideri', description: 'En çok yardım eden çalışan', date: '2024-01-05', icon: '👑', color: 'purple' }
    ]
  });

  const [recentActivities] = useState([
    {
      id: 1,
      type: 'task',
      title: 'Proje A geliştirmesi tamamlandı',
      time: '2 saat önce',
      icon: CheckCircle,
      color: 'text-green-600'
    },
    {
      id: 2,
      type: 'leave',
      title: 'İzin talebi onaylandı',
      time: '1 gün önce',
      icon: Calendar,
      color: 'text-blue-600'
    },
    {
      id: 3,
      type: 'salary',
      title: 'Aralık maaşı yatırıldı',
      time: '3 gün önce',
      icon: DollarSign,
      color: 'text-green-600'
    },
    {
      id: 4,
      type: 'performance',
      title: 'Performans değerlendirmesi güncellendi',
      time: '1 hafta önce',
      icon: TrendingUp,
      color: 'text-purple-600'
    }
  ]);

  const [leaveRequests] = useState([
    {
      id: 1,
      type: 'Yıllık İzin',
      startDate: '2024-01-15',
      endDate: '2024-01-20',
      days: 5,
      status: 'approved',
      reason: 'Aile ziyareti'
    },
    {
      id: 2,
      type: 'Hastalık İzni',
      startDate: '2024-01-10',
      endDate: '2024-01-12',
      days: 3,
      status: 'pending',
      reason: 'Grip'
    }
  ]);

  const [salaryHistory] = useState([
    {
      month: 'Aralık 2023',
      gross: 25000,
      net: 21500,
      deductions: 3500,
      bonuses: 2000
    },
    {
      month: 'Kasım 2023',
      gross: 25000,
      net: 21500,
      deductions: 3500,
      bonuses: 0
    },
    {
      month: 'Ekim 2023',
      gross: 25000,
      net: 21500,
      deductions: 3500,
      bonuses: 1000
    }
  ]);

  const [performanceData] = useState({
    currentScore: 4.2,
    previousScore: 4.0,
    goals: [
      { title: 'Kod kalitesi iyileştirme', progress: 80, target: 100 },
      { title: 'Takım çalışması', progress: 90, target: 100 },
      { title: 'Proje teslim süreleri', progress: 75, target: 100 }
    ],
    skills: ['React', 'TypeScript', 'Node.js', 'SQL', 'Git'],
    achievements: [
      'En İyi Performans Ödülü - Q3 2023',
      'Takım Lideri Sertifikası',
      'Agile Metodoloji Sertifikası'
    ]
  });

  // İletişim ve mesajlaşma state'leri
  const [communicationData, setCommunicationData] = useState({
    unreadMessages: 5,
    unreadAnnouncements: 2,
    emergencyContacts: [
      { name: 'Mehmet Demir', role: 'Yönetici', phone: '+90 532 123 4567', status: 'online' },
      { name: 'Ayşe Kaya', role: 'İK Uzmanı', phone: '+90 532 234 5678', status: 'away' },
      { name: 'Can Özkan', role: 'IT Sorumlusu', phone: '+90 532 345 6789', status: 'online' }
    ],
    teamMembers: [
      { id: '1', name: 'Ahmet Yılmaz', role: 'Yazılım Geliştirici', status: 'online', avatar: 'AY' },
      { id: '2', name: 'Fatma Demir', role: 'UI/UX Tasarımcı', status: 'away', avatar: 'FD' },
      { id: '3', name: 'Ali Veli', role: 'Test Uzmanı', status: 'offline', avatar: 'AV' },
      { id: '4', name: 'Zeynep Kaya', role: 'Proje Yöneticisi', status: 'online', avatar: 'ZK' }
    ],
    recentAnnouncements: [
      {
        id: 1,
        title: 'Yeni Yıl Tatili Duyurusu',
        content: '31 Aralık ve 1 Ocak tarihlerinde şirket kapalı olacaktır.',
        priority: 'high',
        date: '2024-01-15',
        author: 'İK Departmanı'
      },
      {
        id: 2,
        title: 'Performans Değerlendirme Süreci',
        content: 'Q4 performans değerlendirmeleri başlamıştır. Lütfen formları doldurun.',
        priority: 'medium',
        date: '2024-01-10',
        author: 'İK Departmanı'
      }
    ],
    directMessages: [
      {
        id: 1,
        sender: 'Mehmet Demir',
        senderRole: 'Yönetici',
        content: 'Merhaba Ahmet, bugünkü toplantıya katılabilecek misin?',
        timestamp: '2024-01-15 14:30',
        isRead: false
      },
      {
        id: 2,
        sender: 'Ayşe Kaya',
        senderRole: 'İK Uzmanı',
        content: 'İzin talebiniz onaylandı. İyi tatiller!',
        timestamp: '2024-01-15 10:15',
        isRead: true
      }
    ]
  });

  const [showChatModal, setShowChatModal] = useState(false);
  const [selectedChatType, setSelectedChatType] = useState<'team' | 'direct' | 'emergency'>('team');
  const [selectedContact, setSelectedContact] = useState<any>(null);

  // Takvim ve zaman yönetimi verileri
  const [calendarData, setCalendarData] = useState({
    todaySchedule: [
      { id: 1, title: 'Günlük Standup', time: '09:00', duration: 30, type: 'meeting', participants: 8 },
      { id: 2, title: 'Proje A Geliştirme', time: '10:00', duration: 120, type: 'work', participants: 1 },
      { id: 3, title: 'Müşteri Toplantısı', time: '14:00', duration: 60, type: 'meeting', participants: 3 },
      { id: 4, title: 'Kod Review', time: '16:00', duration: 45, type: 'review', participants: 2 }
    ],
    weeklySchedule: [
      { day: 'Pazartesi', workHours: 8.5, meetings: 3, tasks: 4 },
      { day: 'Salı', workHours: 7.5, meetings: 2, tasks: 5 },
      { day: 'Çarşamba', workHours: 8.0, meetings: 4, tasks: 3 },
      { day: 'Perşembe', workHours: 8.5, meetings: 2, tasks: 6 },
      { day: 'Cuma', workHours: 7.0, meetings: 1, tasks: 4 }
    ],
    timeTracking: {
      totalHours: 39.5,
      targetHours: 40,
      overtime: 0,
      breakTime: 2.5,
      productivity: 87
    },
    shifts: [
      { id: 1, date: '2024-01-15', startTime: '09:00', endTime: '18:00', type: 'normal', status: 'completed' },
      { id: 2, date: '2024-01-16', startTime: '09:00', endTime: '18:00', type: 'normal', status: 'completed' },
      { id: 3, date: '2024-01-17', startTime: '09:00', endTime: '18:00', type: 'normal', status: 'current' },
      { id: 4, date: '2024-01-18', startTime: '09:00', endTime: '18:00', type: 'normal', status: 'upcoming' }
    ]
  });

  // Hedef ve görev yönetimi verileri
  const [goalsData, setGoalsData] = useState({
    smartGoals: [
      {
        id: 1,
        title: 'Kod Kalitesi İyileştirme',
        description: 'Kod review skorunu %90\'a çıkarmak',
        specific: 'Tüm kodlar için unit test coverage %90+',
        measurable: 'Test coverage metrikleri ile ölçülebilir',
        achievable: 'Mevcut teknoloji stack ile mümkün',
        relevant: 'Proje kalitesi için kritik',
        timebound: '3 ay içinde tamamlanacak',
        progress: 75,
        deadline: '2024-04-15',
        status: 'in_progress',
        category: 'technical'
      },
      {
        id: 2,
        title: 'Takım İletişimi Geliştirme',
        description: 'Takım içi iletişimi güçlendirmek',
        specific: 'Haftalık 1-on-1 toplantıları düzenlemek',
        measurable: 'Toplantı sayısı ve feedback skorları',
        achievable: 'Mevcut takvim ile uyumlu',
        relevant: 'Takım performansı için önemli',
        timebound: '2 ay içinde başlatılacak',
        progress: 40,
        deadline: '2024-03-15',
        status: 'in_progress',
        category: 'leadership'
      }
    ],
    tasks: [
      {
        id: 1,
        title: 'Proje A API Geliştirme',
        description: 'REST API endpoint\'lerini geliştir',
        priority: 'high',
        status: 'in_progress',
        assignee: 'Ahmet Yılmaz',
        dueDate: '2024-01-20',
        progress: 60,
        estimatedHours: 16,
        actualHours: 10,
        tags: ['backend', 'api', 'urgent']
      },
      {
        id: 2,
        title: 'Unit Test Yazma',
        description: 'Yeni modüller için unit test yaz',
        priority: 'medium',
        status: 'pending',
        assignee: 'Ahmet Yılmaz',
        dueDate: '2024-01-25',
        progress: 0,
        estimatedHours: 8,
        actualHours: 0,
        tags: ['testing', 'quality']
      },
      {
        id: 3,
        title: 'Code Review',
        description: 'Takım üyelerinin kodlarını review et',
        priority: 'medium',
        status: 'completed',
        assignee: 'Ahmet Yılmaz',
        dueDate: '2024-01-18',
        progress: 100,
        estimatedHours: 4,
        actualHours: 4,
        tags: ['review', 'mentoring']
      }
    ],
    projects: [
      {
        id: 1,
        name: 'E-Ticaret Platformu',
        description: 'Modern e-ticaret platformu geliştirme',
        status: 'active',
        progress: 65,
        startDate: '2024-01-01',
        endDate: '2024-06-30',
        teamMembers: 5,
        budget: 500000,
        spent: 325000
      },
      {
        id: 2,
        name: 'Mobil Uygulama',
        description: 'iOS ve Android uygulaması',
        status: 'planning',
        progress: 15,
        startDate: '2024-02-01',
        endDate: '2024-08-31',
        teamMembers: 3,
        budget: 300000,
        spent: 45000
      }
    ]
  });

  // Analitik ve raporlama verileri
  const [analyticsData, setAnalyticsData] = useState({
    performanceMetrics: {
      productivity: 87,
      quality: 92,
      collaboration: 78,
      innovation: 85,
      attendance: 95
    },
    weeklyTrends: [
      { week: '1. Hafta', tasks: 12, hours: 38, quality: 88, productivity: 82 },
      { week: '2. Hafta', tasks: 15, hours: 42, quality: 90, productivity: 85 },
      { week: '3. Hafta', tasks: 18, hours: 40, quality: 92, productivity: 87 },
      { week: '4. Hafta', tasks: 16, hours: 39, quality: 94, productivity: 89 }
    ],
    monthlyComparison: {
      current: {
        tasksCompleted: 72,
        hoursWorked: 170,
        qualityScore: 92,
        productivityScore: 87,
        collaborationScore: 78
      },
      previous: {
        tasksCompleted: 68,
        hoursWorked: 165,
        qualityScore: 89,
        productivityScore: 84,
        collaborationScore: 75
      }
    },
    skillDevelopment: [
      { skill: 'JavaScript', current: 85, target: 90, progress: 94 },
      { skill: 'React', current: 78, target: 85, progress: 92 },
      { skill: 'Node.js', current: 72, target: 80, progress: 90 },
      { skill: 'TypeScript', current: 65, target: 75, progress: 87 },
      { skill: 'Leadership', current: 70, target: 80, progress: 88 }
    ],
    reports: [
      {
        id: 1,
        title: 'Aylık Performans Raporu',
        type: 'performance',
        period: 'Ocak 2024',
        status: 'completed',
        generatedDate: '2024-01-31',
        insights: ['Görev tamamlama oranı %15 arttı', 'Kalite skoru %3 iyileşti', 'Takım işbirliği gelişti']
      },
      {
        id: 2,
        title: 'Haftalık Verimlilik Analizi',
        type: 'productivity',
        period: '3. Hafta',
        status: 'completed',
        generatedDate: '2024-01-21',
        insights: ['En verimli gün: Çarşamba', 'Toplantı süreleri optimize edildi', 'Kod kalitesi artışı']
      },
      {
        id: 3,
        title: 'Yetenek Gelişim Raporu',
        type: 'skills',
        period: 'Q1 2024',
        status: 'in_progress',
        generatedDate: '2024-01-15',
        insights: ['JavaScript seviyesi %5 arttı', 'React öğrenme hızlandı', 'Yeni teknolojiler keşfedildi']
      }
    ]
  });

  // Kişiselleştirme verileri
  const [personalizationData, setPersonalizationData] = useState({
    theme: 'light', // light, dark, auto
    dashboardWidgets: {
      showWelcomeCard: true,
      showPerformanceMetrics: true,
      showRecentActivities: true,
      showAchievements: true,
      showTeamComparison: true,
      showTimeTracking: true
    },
    shortcuts: [
      { id: 1, name: 'Hızlı Görev Ekle', icon: 'Plus', action: 'add-task', enabled: true },
      { id: 2, name: 'İzin Talebi', icon: 'Calendar', action: 'request-leave', enabled: true },
      { id: 3, name: 'Mesaj Gönder', icon: 'MessageSquare', action: 'send-message', enabled: true },
      { id: 4, name: 'Rapor Oluştur', icon: 'FileText', action: 'generate-report', enabled: false },
      { id: 5, name: 'Toplantı Planla', icon: 'Users', action: 'schedule-meeting', enabled: true }
    ],
    notificationPreferences: {
      emailNotifications: true,
      pushNotifications: true,
      smsNotifications: false,
      taskReminders: true,
      meetingReminders: true,
      deadlineAlerts: true,
      achievementNotifications: true,
      teamUpdates: true
    },
    displaySettings: {
      language: 'tr',
      dateFormat: 'DD.MM.YYYY',
      timeFormat: '24h',
      currency: 'TRY',
      timezone: 'Europe/Istanbul',
      compactMode: false,
      showAvatars: true,
      showAnimations: true
    }
  });

  const renderDashboard = () => (
    <div className="space-y-4">
      {/* Hoş Geldin Kartı */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg p-4 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold">Hoş geldin, {employee.name}!</h1>
            <p className="text-blue-100 mt-1 text-sm">{employee.position} • {employee.department}</p>
            <p className="text-blue-100 text-xs mt-1">
              Bugün: {format(new Date(), 'dd MMMM yyyy, EEEE', { locale: tr })}
            </p>
          </div>
          <div className="w-12 h-12 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
            <span className="text-lg font-bold">{employee.avatar}</span>
          </div>
        </div>
      </div>

      {/* Zaman Bazlı İstatistikler */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-3">
        <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-3">Zaman Bazlı Performans</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {/* Günlük */}
          <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3">
            <h4 className="text-sm font-medium text-blue-800 dark:text-blue-200 mb-2">📅 Günlük</h4>
            <div className="space-y-1 text-xs">
              <div className="flex justify-between">
                <span className="text-blue-600 dark:text-blue-400">Görevler:</span>
                <span className="font-semibold text-blue-800 dark:text-blue-200">{advancedStats.daily.tasksCompleted}/{advancedStats.targets.dailyTasks}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-blue-600 dark:text-blue-400">Saat:</span>
                <span className="font-semibold text-blue-800 dark:text-blue-200">{advancedStats.daily.hoursWorked}h</span>
              </div>
              <div className="flex justify-between">
                <span className="text-blue-600 dark:text-blue-400">Toplantı:</span>
                <span className="font-semibold text-blue-800 dark:text-blue-200">{advancedStats.daily.meetingsAttended}</span>
              </div>
            </div>
          </div>

          {/* Haftalık */}
          <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-3">
            <h4 className="text-sm font-medium text-green-800 dark:text-green-200 mb-2">📊 Haftalık</h4>
            <div className="space-y-1 text-xs">
              <div className="flex justify-between">
                <span className="text-green-600 dark:text-green-400">Görevler:</span>
                <span className="font-semibold text-green-800 dark:text-green-200">{advancedStats.weekly.tasksCompleted}/{advancedStats.targets.weeklyTasks}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-green-600 dark:text-green-400">Saat:</span>
                <span className="font-semibold text-green-800 dark:text-green-200">{advancedStats.weekly.hoursWorked}h</span>
              </div>
              <div className="flex justify-between">
                <span className="text-green-600 dark:text-green-400">Hedef:</span>
                <span className="font-semibold text-green-800 dark:text-green-200">{advancedStats.weekly.goalsAchieved}</span>
              </div>
            </div>
          </div>

          {/* Aylık */}
          <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-3">
            <h4 className="text-sm font-medium text-purple-800 dark:text-purple-200 mb-2">📈 Aylık</h4>
            <div className="space-y-1 text-xs">
              <div className="flex justify-between">
                <span className="text-purple-600 dark:text-purple-400">Görevler:</span>
                <span className="font-semibold text-purple-800 dark:text-purple-200">{advancedStats.monthly.tasksCompleted}/{advancedStats.targets.monthlyTasks}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-purple-600 dark:text-purple-400">Saat:</span>
                <span className="font-semibold text-purple-800 dark:text-purple-200">{advancedStats.monthly.hoursWorked}h</span>
              </div>
              <div className="flex justify-between">
                <span className="text-purple-600 dark:text-purple-400">Hedef:</span>
                <span className="font-semibold text-purple-800 dark:text-purple-200">{advancedStats.monthly.goalsAchieved}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Takım Karşılaştırması */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-3">
        <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-3">Takım İçindeki Konumunuz</h3>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full flex items-center justify-center">
              <span className="text-white font-bold text-lg">#{advancedStats.teamComparison.myRank}</span>
            </div>
            <div>
              <h4 className="font-semibold text-gray-900 dark:text-white text-sm">Takım Sıralaması</h4>
              <p className="text-xs text-gray-600 dark:text-gray-400">{advancedStats.teamComparison.totalMembers} kişi arasında</p>
            </div>
          </div>
          <div className="text-right">
            <div className={`text-lg font-bold ${advancedStats.teamComparison.aboveAverage ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
              %{advancedStats.teamComparison.percentile}
            </div>
            <p className="text-xs text-gray-600 dark:text-gray-400">
              {advancedStats.teamComparison.aboveAverage ? 'Ortalamanın Üstünde' : 'Ortalamanın Altında'}
            </p>
          </div>
        </div>
      </div>

      {/* İstatistik Kartları */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{dashboardStats.completedTasks}</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">Tamamlanan Görev</p>
            </div>
            <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
              <CheckCircle className="w-6 h-6 text-green-600 dark:text-green-400" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{dashboardStats.leaveBalance}</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">Kalan İzin Günü</p>
            </div>
            <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
              <Calendar className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{dashboardStats.performanceScore}</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">Performans Puanı</p>
            </div>
            <div className="p-2 bg-purple-100 dark:bg-purple-900 rounded-lg">
              <Star className="w-6 h-6 text-purple-600 dark:text-purple-400" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{dashboardStats.attendanceRate}%</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">Devam Oranı</p>
            </div>
            <div className="p-2 bg-orange-100 dark:bg-orange-900 rounded-lg">
              <Clock className="w-6 h-6 text-orange-600 dark:text-orange-400" />
            </div>
          </div>
        </div>
      </div>

      {/* Başarı Rozetleri */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-3">
        <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-3">🏆 Başarı Rozetleri</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {advancedStats.achievements.map((achievement) => (
            <div key={achievement.id} className={`p-3 rounded-lg border-2 ${
              achievement.color === 'gold' ? 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800' :
              achievement.color === 'blue' ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800' :
              'bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-800'
            }`}>
              <div className="flex items-center space-x-2 mb-2">
                <span className="text-lg">{achievement.icon}</span>
                <h4 className="font-semibold text-gray-900 dark:text-white text-sm">{achievement.title}</h4>
              </div>
              <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">{achievement.description}</p>
              <p className="text-xs text-gray-500 dark:text-gray-500">{format(new Date(achievement.date), 'dd.MM.yyyy', { locale: tr })}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Son Aktiviteler */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
        <div className="p-3 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-base font-semibold text-gray-900 dark:text-white">Son Aktiviteler</h3>
        </div>
        <div className="p-3 space-y-2">
          {recentActivities.map((activity) => (
            <div key={activity.id} className="flex items-center space-x-2">
              <div className={`p-1.5 rounded-lg ${activity.color.replace('text-', 'bg-').replace('-600', '-100')} dark:${activity.color.replace('text-', 'bg-').replace('-600', '-900')}`}>
                <activity.icon className={`w-3 h-3 ${activity.color}`} />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900 dark:text-white">{activity.title}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">{activity.time}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderLeaveManagement = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">İzin Yönetimi</h2>
        <button className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors">
          <Plus className="w-4 h-4 mr-2" />
          Yeni İzin Talebi
        </button>
      </div>

      {/* İzin Bakiyesi */}
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">İzin Bakiyesi</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="text-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">12</p>
            <p className="text-sm text-gray-600 dark:text-gray-400">Yıllık İzin</p>
          </div>
          <div className="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
            <p className="text-2xl font-bold text-green-600 dark:text-green-400">5</p>
            <p className="text-sm text-gray-600 dark:text-gray-400">Hastalık İzni</p>
          </div>
          <div className="text-center p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
            <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">2</p>
            <p className="text-sm text-gray-600 dark:text-gray-400">Doğum İzni</p>
          </div>
        </div>
      </div>

      {/* İzin Talepleri */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">İzin Talepleri</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">İzin Türü</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Başlangıç</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Bitiş</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Gün</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Durum</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">İşlemler</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {leaveRequests.map((request) => (
                <tr key={request.id}>
                  <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">{request.type}</td>
                  <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">{format(new Date(request.startDate), 'dd.MM.yyyy', { locale: tr })}</td>
                  <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">{format(new Date(request.endDate), 'dd.MM.yyyy', { locale: tr })}</td>
                  <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">{request.days}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      request.status === 'approved' 
                        ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                        : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                    }`}>
                      {request.status === 'approved' ? 'Onaylandı' : 'Beklemede'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex space-x-2">
                      <button className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300">
                        <Eye className="w-4 h-4" />
                      </button>
                      <button className="text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-300">
                        <Edit className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  const renderSalaryInfo = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Maaş Bilgileri</h2>
        <button className="inline-flex items-center px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-medium transition-colors">
          <Download className="w-4 h-4 mr-2" />
          Bordro İndir
        </button>
      </div>

      {/* Mevcut Maaş */}
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Mevcut Maaş</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-gray-600 dark:text-gray-400">Brüt Maaş</span>
              <span className="text-lg font-semibold text-gray-900 dark:text-white">₺25,000</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600 dark:text-gray-400">Net Maaş</span>
              <span className="text-lg font-semibold text-green-600 dark:text-green-400">₺21,500</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600 dark:text-gray-400">Kesintiler</span>
              <span className="text-lg font-semibold text-red-600 dark:text-red-400">₺3,500</span>
            </div>
          </div>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-gray-600 dark:text-gray-400">Prim/Bonus</span>
              <span className="text-lg font-semibold text-blue-600 dark:text-blue-400">₺2,000</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600 dark:text-gray-400">Mesai Ücreti</span>
              <span className="text-lg font-semibold text-purple-600 dark:text-purple-400">₺800</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600 dark:text-gray-400">Toplam Kazanç</span>
              <span className="text-xl font-bold text-green-600 dark:text-green-400">₺24,300</span>
            </div>
          </div>
        </div>
      </div>

      {/* Maaş Geçmişi */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Maaş Geçmişi</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Ay</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Brüt</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Net</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Kesinti</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Bonus</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">İşlemler</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {salaryHistory.map((salary, index) => (
                <tr key={index}>
                  <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">{salary.month}</td>
                  <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">₺{salary.gross.toLocaleString()}</td>
                  <td className="px-4 py-3 text-sm text-green-600 dark:text-green-400">₺{salary.net.toLocaleString()}</td>
                  <td className="px-4 py-3 text-sm text-red-600 dark:text-red-400">₺{salary.deductions.toLocaleString()}</td>
                  <td className="px-4 py-3 text-sm text-blue-600 dark:text-blue-400">₺{salary.bonuses.toLocaleString()}</td>
                  <td className="px-4 py-3">
                    <button className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300">
                      <Download className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  const renderCommunication = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white">İletişim ve Mesajlaşma</h2>
        <div className="flex items-center space-x-2">
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            <span className="text-sm text-gray-600 dark:text-gray-400">Çevrimiçi</span>
          </div>
        </div>
      </div>

      {/* Hızlı Erişim Kartları */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
        <button 
          onClick={() => {
            setSelectedChatType('team');
            setShowChatModal(true);
          }}
          className="bg-white dark:bg-gray-800 rounded-lg p-3 border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow text-left"
        >
          <div className="flex items-center justify-between mb-2">
            <div className="p-1.5 bg-blue-100 dark:bg-blue-900 rounded-lg">
              <Users className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <span className="text-xs bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300 px-2 py-1 rounded-full">
              {communicationData.unreadMessages}
            </span>
          </div>
          <h3 className="font-semibold text-gray-900 dark:text-white text-sm">Takım Sohbeti</h3>
          <p className="text-xs text-gray-600 dark:text-gray-400">Takım üyeleriyle mesajlaş</p>
        </button>

        <button 
          onClick={() => {
            setSelectedChatType('direct');
            setShowChatModal(true);
          }}
          className="bg-white dark:bg-gray-800 rounded-lg p-3 border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow text-left"
        >
          <div className="flex items-center justify-between mb-2">
            <div className="p-1.5 bg-green-100 dark:bg-green-900 rounded-lg">
              <MessageSquare className="w-5 h-5 text-green-600 dark:text-green-400" />
            </div>
            <span className="text-xs bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300 px-2 py-1 rounded-full">
              {communicationData.directMessages.filter(m => !m.isRead).length}
            </span>
          </div>
          <h3 className="font-semibold text-gray-900 dark:text-white text-sm">Doğrudan Mesaj</h3>
          <p className="text-xs text-gray-600 dark:text-gray-400">Yönetici ile iletişim</p>
        </button>

        <button 
          onClick={() => {
            setSelectedChatType('emergency');
            setShowChatModal(true);
          }}
          className="bg-white dark:bg-gray-800 rounded-lg p-3 border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow text-left"
        >
          <div className="flex items-center justify-between mb-2">
            <div className="p-1.5 bg-red-100 dark:bg-red-900 rounded-lg">
              <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400" />
            </div>
          </div>
          <h3 className="font-semibold text-gray-900 dark:text-white text-sm">Acil Durum</h3>
          <p className="text-xs text-gray-600 dark:text-gray-400">Acil iletişim</p>
        </button>

        <button 
          onClick={() => setCurrentPage('announcements')}
          className="bg-white dark:bg-gray-800 rounded-lg p-3 border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow text-left w-full"
        >
          <div className="flex items-center justify-between mb-2">
            <div className="p-1.5 bg-purple-100 dark:bg-purple-900 rounded-lg">
              <Megaphone className="w-5 h-5 text-purple-600 dark:text-purple-400" />
            </div>
            <span className="text-xs bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300 px-2 py-1 rounded-full">
              {communicationData.unreadAnnouncements}
            </span>
          </div>
          <h3 className="font-semibold text-gray-900 dark:text-white text-sm">Duyurular</h3>
          <p className="text-xs text-gray-600 dark:text-gray-400">Şirket duyuruları</p>
        </button>
      </div>

      {/* Son Duyurular */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
        <div className="p-3 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-base font-semibold text-gray-900 dark:text-white">Son Duyurular</h3>
        </div>
        <div className="p-3 space-y-3">
          {communicationData.recentAnnouncements.map((announcement) => (
            <div key={announcement.id} className="flex items-start space-x-2 p-2 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <div className={`p-1.5 rounded-lg ${
                announcement.priority === 'high' 
                  ? 'bg-red-100 dark:bg-red-900' 
                  : 'bg-blue-100 dark:bg-blue-900'
              }`}>
                <Megaphone className={`w-3 h-3 ${
                  announcement.priority === 'high' 
                    ? 'text-red-600 dark:text-red-400' 
                    : 'text-blue-600 dark:text-blue-400'
                }`} />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium text-gray-900 dark:text-white text-sm">{announcement.title}</h4>
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    announcement.priority === 'high' 
                      ? 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300' 
                      : 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300'
                  }`}>
                    {announcement.priority === 'high' ? 'Yüksek' : 'Normal'}
                  </span>
                </div>
                <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">{announcement.content}</p>
                <div className="flex items-center justify-between mt-1">
                  <span className="text-xs text-gray-500 dark:text-gray-400">{announcement.author}</span>
                  <span className="text-xs text-gray-500 dark:text-gray-400">{format(new Date(announcement.date), 'dd.MM.yyyy', { locale: tr })}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Takım Üyeleri */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
        <div className="p-3 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-base font-semibold text-gray-900 dark:text-white">Takım Üyeleri</h3>
        </div>
        <div className="p-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {communicationData.teamMembers.map((member) => (
              <div key={member.id} className="flex items-center space-x-2 p-2 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <div className="relative">
                  <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white font-semibold text-xs">
                    {member.avatar}
                  </div>
                  <div className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-white dark:border-gray-800 ${
                    member.status === 'online' ? 'bg-green-500' : 
                    member.status === 'away' ? 'bg-yellow-500' : 'bg-gray-400'
                  }`}></div>
                </div>
                <div className="flex-1">
                  <h4 className="font-medium text-gray-900 dark:text-white text-sm">{member.name}</h4>
                  <p className="text-xs text-gray-600 dark:text-gray-400">{member.role}</p>
                </div>
                <div className="flex space-x-1">
                  <button className="p-1.5 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors">
                    <MessageSquare className="w-3 h-3" />
                  </button>
                  <button className="p-1.5 text-gray-400 hover:text-green-600 dark:hover:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-lg transition-colors">
                    <Phone className="w-3 h-3" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Doğrudan Mesajlar */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
        <div className="p-3 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-base font-semibold text-gray-900 dark:text-white">Son Mesajlar</h3>
        </div>
        <div className="p-3 space-y-2">
          {communicationData.directMessages.map((message) => (
            <div key={message.id} className={`flex items-start space-x-2 p-2 rounded-lg ${
              !message.isRead ? 'bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800' : 'bg-gray-50 dark:bg-gray-700'
            }`}>
              <div className="w-6 h-6 bg-gray-600 rounded-full flex items-center justify-center text-white font-semibold text-xs">
                {message.sender.split(' ').map(n => n[0]).join('')}
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium text-gray-900 dark:text-white text-sm">{message.sender}</h4>
                  <span className="text-xs text-gray-500 dark:text-gray-400">{message.timestamp}</span>
                </div>
                <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">{message.content}</p>
                <span className="text-xs text-gray-500 dark:text-gray-400">{message.senderRole}</span>
              </div>
              {!message.isRead && (
                <div className="w-1.5 h-1.5 bg-blue-600 rounded-full"></div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderPersonalization = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white">Ayarlar</h2>
        <div className="flex items-center space-x-2">
          <button className="inline-flex items-center px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-medium transition-colors">
            <Save className="w-4 h-4 mr-1" />
            Ayarları Kaydet
          </button>
        </div>
      </div>

      {/* Tema Seçenekleri */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-3">
        <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-3">🎨 Tema Seçenekleri</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <button className={`p-3 rounded-lg border-2 transition-colors ${
            personalizationData.theme === 'light' 
              ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' 
              : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
          }`}>
            <div className="text-center">
              <div className="w-8 h-8 bg-white border border-gray-300 rounded-lg mx-auto mb-2"></div>
              <h4 className="font-semibold text-gray-900 dark:text-white text-sm">Açık Tema</h4>
              <p className="text-xs text-gray-600 dark:text-gray-400">Temiz ve parlak görünüm</p>
            </div>
          </button>
          
          <button className={`p-3 rounded-lg border-2 transition-colors ${
            personalizationData.theme === 'dark' 
              ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' 
              : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
          }`}>
            <div className="text-center">
              <div className="w-8 h-8 bg-gray-800 border border-gray-600 rounded-lg mx-auto mb-2"></div>
              <h4 className="font-semibold text-gray-900 dark:text-white text-sm">Koyu Tema</h4>
              <p className="text-xs text-gray-600 dark:text-gray-400">Göz yormayan koyu görünüm</p>
            </div>
          </button>
          
          <button className={`p-3 rounded-lg border-2 transition-colors ${
            personalizationData.theme === 'auto' 
              ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' 
              : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
          }`}>
            <div className="text-center">
              <div className="w-8 h-8 bg-gradient-to-r from-white to-gray-800 border border-gray-300 rounded-lg mx-auto mb-2"></div>
              <h4 className="font-semibold text-gray-900 dark:text-white text-sm">Otomatik</h4>
              <p className="text-xs text-gray-600 dark:text-gray-400">Sistem ayarına göre</p>
            </div>
          </button>
        </div>
      </div>

      {/* Dashboard Widgetları */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-3">
        <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-3">📊 Dashboard Widgetları</h3>
        <div className="space-y-2">
          {Object.entries(personalizationData.dashboardWidgets).map(([key, value]) => (
            <div key={key} className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <div>
                <h4 className="font-medium text-gray-900 dark:text-white text-sm">
                  {key === 'showWelcomeCard' ? 'Hoş Geldin Kartı' :
                   key === 'showPerformanceMetrics' ? 'Performans Metrikleri' :
                   key === 'showRecentActivities' ? 'Son Aktiviteler' :
                   key === 'showAchievements' ? 'Başarı Rozetleri' :
                   key === 'showTeamComparison' ? 'Takım Karşılaştırması' : 'Zaman Takibi'}
                </h4>
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  {key === 'showWelcomeCard' ? 'Kişiselleştirilmiş hoş geldin mesajı' :
                   key === 'showPerformanceMetrics' ? 'Performans göstergeleri' :
                   key === 'showRecentActivities' ? 'Son yapılan işlemler' :
                   key === 'showAchievements' ? 'Kazanılan rozetler' :
                   key === 'showTeamComparison' ? 'Takım içi sıralama' : 'Çalışma saatleri'}
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" className="sr-only peer" checked={value} />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
              </label>
            </div>
          ))}
        </div>
      </div>

      {/* Kısayollar */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-3">
        <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-3">⚡ Hızlı Kısayollar</h3>
        <div className="space-y-2">
          {personalizationData.shortcuts.map((shortcut) => (
            <div key={shortcut.id} className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <div className="flex items-center space-x-3">
                <div className="p-1.5 bg-blue-100 dark:bg-blue-900 rounded-lg">
                  {shortcut.icon === 'Plus' && <Plus className="w-4 h-4 text-blue-600 dark:text-blue-400" />}
                  {shortcut.icon === 'Calendar' && <Calendar className="w-4 h-4 text-blue-600 dark:text-blue-400" />}
                  {shortcut.icon === 'MessageSquare' && <MessageSquare className="w-4 h-4 text-blue-600 dark:text-blue-400" />}
                  {shortcut.icon === 'FileText' && <FileText className="w-4 h-4 text-blue-600 dark:text-blue-400" />}
                  {shortcut.icon === 'Users' && <Users className="w-4 h-4 text-blue-600 dark:text-blue-400" />}
                </div>
                <div>
                  <h4 className="font-medium text-gray-900 dark:text-white text-sm">{shortcut.name}</h4>
                  <p className="text-xs text-gray-600 dark:text-gray-400">{shortcut.action}</p>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" className="sr-only peer" checked={shortcut.enabled} />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
              </label>
            </div>
          ))}
        </div>
      </div>

      {/* Bildirim Tercihleri */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-3">
        <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-3">🔔 Bildirim Tercihleri</h3>
        <div className="space-y-2">
          {Object.entries(personalizationData.notificationPreferences).map(([key, value]) => (
            <div key={key} className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <div>
                <h4 className="font-medium text-gray-900 dark:text-white text-sm">
                  {key === 'emailNotifications' ? 'E-posta Bildirimleri' :
                   key === 'pushNotifications' ? 'Push Bildirimleri' :
                   key === 'smsNotifications' ? 'SMS Bildirimleri' :
                   key === 'taskReminders' ? 'Görev Hatırlatıcıları' :
                   key === 'meetingReminders' ? 'Toplantı Hatırlatıcıları' :
                   key === 'deadlineAlerts' ? 'Son Tarih Uyarıları' :
                   key === 'achievementNotifications' ? 'Başarı Bildirimleri' : 'Takım Güncellemeleri'}
                </h4>
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  {key === 'emailNotifications' ? 'E-posta ile bildirim al' :
                   key === 'pushNotifications' ? 'Tarayıcı bildirimleri' :
                   key === 'smsNotifications' ? 'SMS ile bildirim al' :
                   key === 'taskReminders' ? 'Görev hatırlatmaları' :
                   key === 'meetingReminders' ? 'Toplantı hatırlatmaları' :
                   key === 'deadlineAlerts' ? 'Son tarih uyarıları' :
                   key === 'achievementNotifications' ? 'Başarı bildirimleri' : 'Takım güncellemeleri'}
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" className="sr-only peer" checked={value} />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
              </label>
            </div>
          ))}
        </div>
      </div>

      {/* Görüntü Ayarları */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-3">
        <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-3">🖥️ Görüntü Ayarları</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Dil</label>
              <select className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm">
                <option value="tr">Türkçe</option>
                <option value="en">English</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Tarih Formatı</label>
              <select className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm">
                <option value="DD.MM.YYYY">DD.MM.YYYY</option>
                <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                <option value="YYYY-MM-DD">YYYY-MM-DD</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Saat Formatı</label>
              <select className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm">
                <option value="24h">24 Saat</option>
                <option value="12h">12 Saat (AM/PM)</option>
              </select>
            </div>
          </div>
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Para Birimi</label>
              <select className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm">
                <option value="TRY">₺ Türk Lirası</option>
                <option value="USD">$ Amerikan Doları</option>
                <option value="EUR">€ Euro</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Saat Dilimi</label>
              <select className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm">
                <option value="Europe/Istanbul">İstanbul (UTC+3)</option>
                <option value="Europe/London">Londra (UTC+0)</option>
                <option value="America/New_York">New York (UTC-5)</option>
              </select>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Kompakt Mod</span>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" className="sr-only peer" checked={personalizationData.displaySettings.compactMode} />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
              </label>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderAnalytics = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white">Analitik ve Raporlama</h2>
        <div className="flex items-center space-x-2">
          <button className="inline-flex items-center px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-sm font-medium transition-colors">
            <Download className="w-4 h-4 mr-1" />
            Rapor İndir
          </button>
          <button className="inline-flex items-center px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors">
            <RefreshCw className="w-4 h-4 mr-1" />
            Yenile
          </button>
        </div>
      </div>

      {/* Performans Metrikleri */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-3">
        <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-3">📊 Performans Metrikleri</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3">
          {Object.entries(analyticsData.performanceMetrics).map(([key, value]) => (
            <div key={key} className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg text-center">
              <div className="text-2xl font-bold text-gray-900 dark:text-white mb-1">%{value}</div>
              <div className="text-xs text-gray-600 dark:text-gray-400 capitalize">
                {key === 'productivity' ? 'Verimlilik' :
                 key === 'quality' ? 'Kalite' :
                 key === 'collaboration' ? 'İşbirliği' :
                 key === 'innovation' ? 'İnovasyon' : 'Devam'}
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-1.5 mt-2">
                <div 
                  className="bg-blue-600 h-1.5 rounded-full transition-all duration-300"
                  style={{ width: `${value}%` }}
                ></div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Haftalık Trendler */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-3">
        <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-3">📈 Haftalık Trendler</h3>
        <div className="space-y-2">
          {analyticsData.weeklyTrends.map((week, index) => (
            <div key={index} className="p-2 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-semibold text-gray-900 dark:text-white text-sm">{week.week}</h4>
                <span className="text-xs text-gray-500 dark:text-gray-400">Verimlilik: %{week.productivity}</span>
              </div>
              <div className="grid grid-cols-4 gap-2 text-xs">
                <div className="text-center">
                  <div className="font-semibold text-gray-900 dark:text-white">{week.tasks}</div>
                  <div className="text-gray-600 dark:text-gray-400">Görev</div>
                </div>
                <div className="text-center">
                  <div className="font-semibold text-gray-900 dark:text-white">{week.hours}h</div>
                  <div className="text-gray-600 dark:text-gray-400">Saat</div>
                </div>
                <div className="text-center">
                  <div className="font-semibold text-gray-900 dark:text-white">%{week.quality}</div>
                  <div className="text-gray-600 dark:text-gray-400">Kalite</div>
                </div>
                <div className="text-center">
                  <div className="font-semibold text-gray-900 dark:text-white">%{week.productivity}</div>
                  <div className="text-gray-600 dark:text-gray-400">Verimlilik</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Aylık Karşılaştırma */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-3">
          <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-3">📅 Bu Ay vs Geçen Ay</h3>
          <div className="space-y-3">
            {Object.entries(analyticsData.monthlyComparison.current).map(([key, currentValue]) => {
              const previousValue = analyticsData.monthlyComparison.previous[key];
              const change = currentValue - previousValue;
              const changePercent = previousValue > 0 ? ((change / previousValue) * 100).toFixed(1) : 0;
              
              return (
                <div key={key} className="flex items-center justify-between">
                  <div>
                    <span className="text-sm text-gray-600 dark:text-gray-400 capitalize">
                      {key === 'tasksCompleted' ? 'Tamamlanan Görevler' :
                       key === 'hoursWorked' ? 'Çalışılan Saatler' :
                       key === 'qualityScore' ? 'Kalite Skoru' :
                       key === 'productivityScore' ? 'Verimlilik Skoru' : 'İşbirliği Skoru'}
                    </span>
                    <div className="flex items-center space-x-2">
                      <span className="text-lg font-bold text-gray-900 dark:text-white">
                        {key.includes('Score') ? `${currentValue}%` : currentValue}
                      </span>
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        change >= 0 ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300' : 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300'
                      }`}>
                        {change >= 0 ? '+' : ''}{changePercent}%
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-3">
          <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-3">🎯 Yetenek Gelişimi</h3>
          <div className="space-y-3">
            {analyticsData.skillDevelopment.map((skill, index) => (
              <div key={index}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium text-gray-900 dark:text-white">{skill.skill}</span>
                  <span className="text-xs text-gray-600 dark:text-gray-400">{skill.current}% / {skill.target}%</span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2">
                  <div 
                    className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${skill.progress}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Raporlar */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-3">
        <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-3">📋 Raporlar</h3>
        <div className="space-y-2">
          {analyticsData.reports.map((report) => (
            <div key={report.id} className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <h4 className="font-semibold text-gray-900 dark:text-white text-sm">{report.title}</h4>
                  <p className="text-xs text-gray-600 dark:text-gray-400">{report.period}</p>
                </div>
                <div className="flex items-center space-x-2">
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    report.status === 'completed' ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300' :
                    report.status === 'in_progress' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300' :
                    'bg-gray-100 text-gray-700 dark:bg-gray-900 dark:text-gray-300'
                  }`}>
                    {report.status === 'completed' ? 'Tamamlandı' :
                     report.status === 'in_progress' ? 'Hazırlanıyor' : 'Bekliyor'}
                  </span>
                  <button className="p-1 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 rounded">
                    <Download className="w-3 h-3" />
                  </button>
                </div>
              </div>
              <div className="space-y-1">
                {report.insights.map((insight, index) => (
                  <div key={index} className="flex items-center space-x-2 text-xs text-gray-600 dark:text-gray-400">
                    <div className="w-1 h-1 bg-blue-500 rounded-full"></div>
                    <span>{insight}</span>
                  </div>
                ))}
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                Oluşturulma: {format(new Date(report.generatedDate), 'dd.MM.yyyy', { locale: tr })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderGoalsTasks = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white">Hedef ve Görev Yönetimi</h2>
        <div className="flex items-center space-x-2">
          <button className="inline-flex items-center px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-medium transition-colors">
            <Plus className="w-4 h-4 mr-1" />
            Yeni Hedef
          </button>
          <button className="inline-flex items-center px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors">
            <Plus className="w-4 h-4 mr-1" />
            Yeni Görev
          </button>
        </div>
      </div>

      {/* SMART Hedefler */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-3">
        <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-3">🎯 SMART Hedefler</h3>
        <div className="space-y-3">
          {goalsData.smartGoals.map((goal) => (
            <div key={goal.id} className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-semibold text-gray-900 dark:text-white text-sm">{goal.title}</h4>
                <span className={`text-xs px-2 py-1 rounded-full ${
                  goal.status === 'in_progress' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300' :
                  goal.status === 'completed' ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300' :
                  'bg-gray-100 text-gray-700 dark:bg-gray-900 dark:text-gray-300'
                }`}>
                  {goal.status === 'in_progress' ? 'Devam Ediyor' :
                   goal.status === 'completed' ? 'Tamamlandı' : 'Bekliyor'}
                </span>
              </div>
              <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">{goal.description}</p>
              
              {/* SMART Kriterleri */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mb-3">
                <div className="text-xs">
                  <span className="font-medium text-gray-700 dark:text-gray-300">S:</span>
                  <span className="text-gray-600 dark:text-gray-400 ml-1">{goal.specific}</span>
                </div>
                <div className="text-xs">
                  <span className="font-medium text-gray-700 dark:text-gray-300">M:</span>
                  <span className="text-gray-600 dark:text-gray-400 ml-1">{goal.measurable}</span>
                </div>
                <div className="text-xs">
                  <span className="font-medium text-gray-700 dark:text-gray-300">A:</span>
                  <span className="text-gray-600 dark:text-gray-400 ml-1">{goal.achievable}</span>
                </div>
                <div className="text-xs">
                  <span className="font-medium text-gray-700 dark:text-gray-300">R:</span>
                  <span className="text-gray-600 dark:text-gray-400 ml-1">{goal.relevant}</span>
                </div>
                <div className="text-xs col-span-2">
                  <span className="font-medium text-gray-700 dark:text-gray-300">T:</span>
                  <span className="text-gray-600 dark:text-gray-400 ml-1">{goal.timebound}</span>
                </div>
              </div>

              {/* İlerleme */}
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-gray-600 dark:text-gray-400">İlerleme</span>
                    <span className="font-semibold text-gray-900 dark:text-white">%{goal.progress}</span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2">
                    <div 
                      className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${goal.progress}%` }}
                    ></div>
                  </div>
                </div>
                <div className="ml-3 text-xs text-gray-500 dark:text-gray-400">
                  {format(new Date(goal.deadline), 'dd.MM.yyyy', { locale: tr })}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Görevler */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-3">
        <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-3">📋 Görevler</h3>
        <div className="space-y-2">
          {goalsData.tasks.map((task) => (
            <div key={task.id} className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-2">
                  <h4 className="font-semibold text-gray-900 dark:text-white text-sm">{task.title}</h4>
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    task.priority === 'high' ? 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300' :
                    task.priority === 'medium' ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300' :
                    'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300'
                  }`}>
                    {task.priority === 'high' ? 'Yüksek' :
                     task.priority === 'medium' ? 'Orta' : 'Düşük'}
                  </span>
                </div>
                <span className={`text-xs px-2 py-1 rounded-full ${
                  task.status === 'completed' ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300' :
                  task.status === 'in_progress' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300' :
                  'bg-gray-100 text-gray-700 dark:bg-gray-900 dark:text-gray-300'
                }`}>
                  {task.status === 'completed' ? 'Tamamlandı' :
                   task.status === 'in_progress' ? 'Devam Ediyor' : 'Bekliyor'}
                </span>
              </div>
              <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">{task.description}</p>
              
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-gray-600 dark:text-gray-400">İlerleme</span>
                    <span className="font-semibold text-gray-900 dark:text-white">%{task.progress}</span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-1.5">
                    <div 
                      className="bg-green-600 h-1.5 rounded-full transition-all duration-300"
                      style={{ width: `${task.progress}%` }}
                    ></div>
                  </div>
                </div>
                <div className="ml-3 text-xs text-gray-500 dark:text-gray-400">
                  {task.actualHours}h / {task.estimatedHours}h
                </div>
              </div>
              
              <div className="flex items-center justify-between mt-2">
                <div className="flex space-x-1">
                  {task.tags.map((tag, index) => (
                    <span key={index} className="text-xs bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300 px-2 py-1 rounded-full">
                      {tag}
                    </span>
                  ))}
                </div>
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  {format(new Date(task.dueDate), 'dd.MM.yyyy', { locale: tr })}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Projeler */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-3">
        <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-3">🚀 Projeler</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {goalsData.projects.map((project) => (
            <div key={project.id} className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-semibold text-gray-900 dark:text-white text-sm">{project.name}</h4>
                <span className={`text-xs px-2 py-1 rounded-full ${
                  project.status === 'active' ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300' :
                  project.status === 'planning' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300' :
                  'bg-gray-100 text-gray-700 dark:bg-gray-900 dark:text-gray-300'
                }`}>
                  {project.status === 'active' ? 'Aktif' :
                   project.status === 'planning' ? 'Planlama' : 'Tamamlandı'}
                </span>
              </div>
              <p className="text-xs text-gray-600 dark:text-gray-400 mb-3">{project.description}</p>
              
              <div className="space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="text-gray-600 dark:text-gray-400">İlerleme</span>
                  <span className="font-semibold text-gray-900 dark:text-white">%{project.progress}</span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2">
                  <div 
                    className="bg-purple-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${project.progress}%` }}
                  ></div>
                </div>
                
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-gray-600 dark:text-gray-400">Takım:</span>
                    <span className="font-semibold text-gray-900 dark:text-white ml-1">{project.teamMembers} kişi</span>
                  </div>
                  <div>
                    <span className="text-gray-600 dark:text-gray-400">Bütçe:</span>
                    <span className="font-semibold text-gray-900 dark:text-white ml-1">₺{project.spent.toLocaleString()}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderCalendar = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white">Takvim ve Zaman Yönetimi</h2>
        <div className="flex items-center space-x-2">
          <button className="inline-flex items-center px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors">
            <Plus className="w-4 h-4 mr-1" />
            Yeni Etkinlik
          </button>
        </div>
      </div>

      {/* Bugünkü Program */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-3">
        <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-3">📅 Bugünkü Program</h3>
        <div className="space-y-2">
          {calendarData.todaySchedule.map((event) => (
            <div key={event.id} className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <div className="flex items-center space-x-3">
                <div className={`w-3 h-3 rounded-full ${
                  event.type === 'meeting' ? 'bg-blue-500' :
                  event.type === 'work' ? 'bg-green-500' :
                  'bg-purple-500'
                }`}></div>
                <div>
                  <h4 className="font-medium text-gray-900 dark:text-white text-sm">{event.title}</h4>
                  <p className="text-xs text-gray-600 dark:text-gray-400">
                    {event.time} • {event.duration} dk • {event.participants} kişi
                  </p>
                </div>
              </div>
              <div className="flex space-x-1">
                <button className="p-1 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 rounded">
                  <Edit className="w-3 h-3" />
                </button>
                <button className="p-1 text-gray-400 hover:text-red-600 dark:hover:text-red-400 rounded">
                  <X className="w-3 h-3" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Haftalık Çalışma Saatleri */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-3">
        <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-3">📊 Haftalık Çalışma Saatleri</h3>
        <div className="space-y-2">
          {calendarData.weeklySchedule.map((day, index) => (
            <div key={index} className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
                  <span className="text-xs font-semibold text-blue-600 dark:text-blue-400">{index + 1}</span>
                </div>
                <div>
                  <h4 className="font-medium text-gray-900 dark:text-white text-sm">{day.day}</h4>
                  <p className="text-xs text-gray-600 dark:text-gray-400">
                    {day.workHours}h çalışma • {day.meetings} toplantı • {day.tasks} görev
                  </p>
                </div>
              </div>
              <div className="text-right">
                <div className="text-sm font-semibold text-gray-900 dark:text-white">{day.workHours}h</div>
                <div className="w-16 bg-gray-200 dark:bg-gray-600 rounded-full h-1.5">
                  <div 
                    className="bg-blue-600 h-1.5 rounded-full"
                    style={{ width: `${(day.workHours / 8) * 100}%` }}
                  ></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Zaman Takibi */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-3">
          <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-3">⏱️ Zaman Takibi</h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600 dark:text-gray-400">Toplam Saat</span>
              <span className="text-lg font-bold text-gray-900 dark:text-white">{calendarData.timeTracking.totalHours}h</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600 dark:text-gray-400">Hedef Saat</span>
              <span className="text-lg font-bold text-blue-600 dark:text-blue-400">{calendarData.timeTracking.targetHours}h</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600 dark:text-gray-400">Mesai</span>
              <span className="text-lg font-bold text-orange-600 dark:text-orange-400">{calendarData.timeTracking.overtime}h</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600 dark:text-gray-400">Mola</span>
              <span className="text-lg font-bold text-gray-600 dark:text-gray-400">{calendarData.timeTracking.breakTime}h</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600 dark:text-gray-400">Verimlilik</span>
              <span className="text-lg font-bold text-green-600 dark:text-green-400">%{calendarData.timeTracking.productivity}</span>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-3">
          <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-3">🔄 Vardiya Takibi</h3>
          <div className="space-y-2">
            {calendarData.shifts.map((shift) => (
              <div key={shift.id} className={`p-2 rounded-lg border ${
                shift.status === 'completed' ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800' :
                shift.status === 'current' ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800' :
                'bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600'
              }`}>
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium text-gray-900 dark:text-white text-sm">
                      {format(new Date(shift.date), 'dd MMMM', { locale: tr })}
                    </h4>
                    <p className="text-xs text-gray-600 dark:text-gray-400">
                      {shift.startTime} - {shift.endTime}
                    </p>
                  </div>
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    shift.status === 'completed' ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300' :
                    shift.status === 'current' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300' :
                    'bg-gray-100 text-gray-700 dark:bg-gray-900 dark:text-gray-300'
                  }`}>
                    {shift.status === 'completed' ? 'Tamamlandı' :
                     shift.status === 'current' ? 'Devam Ediyor' : 'Bekliyor'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  const renderAnnouncements = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white">Şirket Duyuruları</h2>
        <div className="flex items-center space-x-2">
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            <span className="text-sm text-gray-600 dark:text-gray-400">Güncel</span>
          </div>
        </div>
      </div>

      {/* Tüm Duyurular */}
      <div className="space-y-3">
        {communicationData.recentAnnouncements.map((announcement) => (
          <div key={announcement.id} className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 hover:shadow-md transition-shadow">
            <div className="flex items-start space-x-3">
              <div className={`p-2 rounded-lg ${
                announcement.priority === 'high' 
                  ? 'bg-red-100 dark:bg-red-900' 
                  : 'bg-blue-100 dark:bg-blue-900'
              }`}>
                <Megaphone className={`w-5 h-5 ${
                  announcement.priority === 'high' 
                    ? 'text-red-600 dark:text-red-400' 
                    : 'text-blue-600 dark:text-blue-400'
                }`} />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold text-gray-900 dark:text-white">{announcement.title}</h3>
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    announcement.priority === 'high' 
                      ? 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300' 
                      : 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300'
                  }`}>
                    {announcement.priority === 'high' ? 'Yüksek Öncelik' : 'Normal'}
                  </span>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">{announcement.content}</p>
                <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                  <span>📢 {announcement.author}</span>
                  <span>📅 {format(new Date(announcement.date), 'dd MMMM yyyy, EEEE', { locale: tr })}</span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Duyuru Kategorileri */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
        <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-3">Duyuru Kategorileri</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="text-center p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white mx-auto mb-2">
              <span className="text-sm">📢</span>
            </div>
            <p className="text-xs font-medium text-gray-900 dark:text-white">Genel Duyurular</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">5 duyuru</p>
          </div>
          <div className="text-center p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
            <div className="w-8 h-8 bg-green-600 rounded-full flex items-center justify-center text-white mx-auto mb-2">
              <span className="text-sm">🎉</span>
            </div>
            <p className="text-xs font-medium text-gray-900 dark:text-white">Etkinlikler</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">2 etkinlik</p>
          </div>
          <div className="text-center p-3 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
            <div className="w-8 h-8 bg-orange-600 rounded-full flex items-center justify-center text-white mx-auto mb-2">
              <span className="text-sm">⚠️</span>
            </div>
            <p className="text-xs font-medium text-gray-900 dark:text-white">Uyarılar</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">1 uyarı</p>
          </div>
          <div className="text-center p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
            <div className="w-8 h-8 bg-purple-600 rounded-full flex items-center justify-center text-white mx-auto mb-2">
              <span className="text-sm">📋</span>
            </div>
            <p className="text-xs font-medium text-gray-900 dark:text-white">Politikalar</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">3 politika</p>
          </div>
        </div>
      </div>
    </div>
  );

  const renderPerformance = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Performans Değerlendirmesi</h2>
        <button className="inline-flex items-center px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-sm font-medium transition-colors">
          <BarChart3 className="w-4 h-4 mr-2" />
          Detaylı Rapor
        </button>
      </div>

      {/* Performans Puanı */}
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Genel Performans Puanı</h3>
          <div className="flex items-center space-x-2">
            <span className="text-3xl font-bold text-purple-600 dark:text-purple-400">{performanceData.currentScore}</span>
            <span className="text-gray-500 dark:text-gray-400">/ 5.0</span>
          </div>
        </div>
        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
          <div 
            className="bg-purple-600 h-3 rounded-full transition-all duration-300"
            style={{ width: `${(performanceData.currentScore / 5) * 100}%` }}
          ></div>
        </div>
        <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400 mt-2">
          <span>Önceki: {performanceData.previousScore}</span>
          <span className="text-green-600 dark:text-green-400">+{performanceData.currentScore - performanceData.previousScore}</span>
        </div>
      </div>

      {/* Hedefler */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Hedefler ve İlerleme</h3>
        </div>
        <div className="p-4 space-y-4">
          {performanceData.goals.map((goal, index) => (
            <div key={index} className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-gray-900 dark:text-white">{goal.title}</span>
                <span className="text-sm text-gray-600 dark:text-gray-400">{goal.progress}%</span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div 
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${goal.progress}%` }}
                ></div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Yetenekler */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Yetenekler</h3>
        </div>
        <div className="p-4">
          <div className="flex flex-wrap gap-2">
            {performanceData.skills.map((skill, index) => (
              <span 
                key={index}
                className="inline-flex px-3 py-1 text-sm font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 rounded-full"
              >
                {skill}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Başarılar */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Başarılar ve Sertifikalar</h3>
        </div>
        <div className="p-4 space-y-3">
          {performanceData.achievements.map((achievement, index) => (
            <div key={index} className="flex items-center space-x-3">
              <div className="p-2 bg-yellow-100 dark:bg-yellow-900 rounded-lg">
                <Award className="w-4 h-4 text-yellow-600 dark:text-yellow-400" />
              </div>
              <span className="text-sm text-gray-900 dark:text-white">{achievement}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderContent = () => {
    switch (currentPage) {
      case 'dashboard':
        return renderDashboard();
      case 'calendar':
        return renderCalendar();
      case 'goals-tasks':
        return renderGoalsTasks();
      case 'analytics':
        return renderAnalytics();
      case 'personalization':
        return renderPersonalization();
      case 'leave':
        return renderLeaveManagement();
      case 'salary':
        return renderSalaryInfo();
      case 'performance':
        return renderPerformance();
      case 'communication':
        return renderCommunication();
      case 'announcements':
        return renderAnnouncements();
      default:
        return renderDashboard();
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="w-full px-0.5 sm:px-1 lg:px-1.5">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => onBackToAdmin ? onBackToAdmin() : navigate('/')}
                className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <h1 className="text-xl font-semibold text-gray-900 dark:text-white">Çalışan Portalı</h1>
            </div>
            <div className="flex items-center space-x-4">
              <button className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700">
                <Bell className="w-5 h-5" />
              </button>
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white font-semibold text-sm">
                  {employee.avatar}
                </div>
                <div className="text-left">
                  <p className="text-sm font-medium text-gray-900 dark:text-white">{employee.name}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{employee.position}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="w-full px-0.5 sm:px-1 lg:px-1.5 py-4">
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Sidebar */}
          <div className="lg:w-72 flex-shrink-0">
            <nav className="space-y-2">
              <button
                onClick={() => setCurrentPage('dashboard')}
                className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-left transition-colors ${
                  currentPage === 'dashboard' 
                    ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-200' 
                    : 'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700'
                }`}
              >
                <Home className="w-5 h-5" />
                <span>Dashboard</span>
              </button>
              
              <button
                onClick={() => setCurrentPage('calendar')}
                className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-left transition-colors ${
                  currentPage === 'calendar' 
                    ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-200' 
                    : 'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700'
                }`}
              >
                <Calendar className="w-5 h-5" />
                <span>Takvim</span>
              </button>
              
              <button
                onClick={() => setCurrentPage('goals-tasks')}
                className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-left transition-colors ${
                  currentPage === 'goals-tasks' 
                    ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-200' 
                    : 'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700'
                }`}
              >
                <Target className="w-5 h-5" />
                <span>Hedefler</span>
              </button>
              
              <button
                onClick={() => setCurrentPage('analytics')}
                className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-left transition-colors ${
                  currentPage === 'analytics' 
                    ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-200' 
                    : 'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700'
                }`}
              >
                <BarChart3 className="w-5 h-5" />
                <span>Analitik</span>
              </button>
              
              <button
                onClick={() => setCurrentPage('personalization')}
                className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-left transition-colors ${
                  currentPage === 'personalization' 
                    ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-200' 
                    : 'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700'
                }`}
              >
                <Settings className="w-5 h-5" />
                <span>Ayarlar</span>
              </button>
              
              <button
                onClick={() => setCurrentPage('leave')}
                className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-left transition-colors ${
                  currentPage === 'leave' 
                    ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-200' 
                    : 'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700'
                }`}
              >
                <Calendar className="w-5 h-5" />
                <span>İzin Yönetimi</span>
              </button>
              
              <button
                onClick={() => setCurrentPage('salary')}
                className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-left transition-colors ${
                  currentPage === 'salary' 
                    ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-200' 
                    : 'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700'
                }`}
              >
                <DollarSign className="w-5 h-5" />
                <span>Maaş Bilgileri</span>
              </button>
              
              <button
                onClick={() => setCurrentPage('performance')}
                className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-left transition-colors ${
                  currentPage === 'performance' 
                    ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-200' 
                    : 'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700'
                }`}
              >
                <BarChart3 className="w-5 h-5" />
                <span>Performans</span>
              </button>
              
              <button
                onClick={() => setCurrentPage('communication')}
                className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-left transition-colors ${
                  currentPage === 'communication' 
                    ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-200' 
                    : 'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700'
                }`}
              >
                <MessageSquare className="w-5 h-5" />
                <span>İletişim</span>
                {communicationData.unreadMessages > 0 && (
                  <span className="ml-auto px-2 py-0.5 text-xs bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300 rounded-full">
                    {communicationData.unreadMessages}
                  </span>
                )}
              </button>
            </nav>
          </div>

          {/* Main Content */}
          <div className="flex-1">
            {renderContent()}
          </div>
        </div>
      </div>

      {/* Chat Modal */}
      {showChatModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full h-full max-w-6xl max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center space-x-3">
                <div className={`p-2 rounded-lg ${
                  selectedChatType === 'team' ? 'bg-blue-100 dark:bg-blue-900' :
                  selectedChatType === 'direct' ? 'bg-green-100 dark:bg-green-900' :
                  'bg-red-100 dark:bg-red-900'
                }`}>
                  {selectedChatType === 'team' && <Users className="w-5 h-5 text-blue-600 dark:text-blue-400" />}
                  {selectedChatType === 'direct' && <MessageSquare className="w-5 h-5 text-green-600 dark:text-green-400" />}
                  {selectedChatType === 'emergency' && <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400" />}
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                    {selectedChatType === 'team' && 'Takım Sohbeti'}
                    {selectedChatType === 'direct' && 'Doğrudan Mesajlaşma'}
                    {selectedChatType === 'emergency' && 'Acil Durum İletişimi'}
                  </h2>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {selectedChatType === 'team' && 'Takım üyeleriyle gerçek zamanlı mesajlaşma'}
                    {selectedChatType === 'direct' && 'Yönetici ve diğer çalışanlarla özel mesajlaşma'}
                    {selectedChatType === 'emergency' && 'Acil durumlar için hızlı iletişim'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowChatModal(false)}
                className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                title="Kapat"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="flex-1 overflow-hidden">
              {selectedChatType === 'team' ? (
                <EmployeeChat />
              ) : selectedChatType === 'direct' ? (
                <div className="h-full flex flex-col">
                  {/* Doğrudan mesajlaşma arayüzü */}
                  <div className="flex-1 p-4 overflow-y-auto">
                    <div className="space-y-4">
                      {communicationData.directMessages.map((message) => (
                        <div key={message.id} className={`flex ${message.sender === employee.name ? 'justify-end' : 'justify-start'}`}>
                          <div className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                            message.sender === employee.name 
                              ? 'bg-blue-600 text-white' 
                              : 'bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white'
                          }`}>
                            <p className="text-sm">{message.content}</p>
                            <p className={`text-xs mt-1 ${
                              message.sender === employee.name 
                                ? 'text-blue-100' 
                                : 'text-gray-500 dark:text-gray-400'
                            }`}>
                              {message.timestamp}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="border-t border-gray-200 dark:border-gray-700 p-4">
                    <div className="flex items-center space-x-2">
                      <input
                        type="text"
                        placeholder="Mesajınızı yazın..."
                        className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      <button className="p-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors">
                        <Send className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="h-full p-4">
                  <div className="space-y-4">
                    <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
                      <div className="flex items-center space-x-2 mb-2">
                        <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400" />
                        <h3 className="font-semibold text-red-800 dark:text-red-200">Acil Durum İletişimi</h3>
                      </div>
                      <p className="text-sm text-red-700 dark:text-red-300">
                        Acil durumlar için aşağıdaki kişilerle hızlıca iletişime geçebilirsiniz.
                      </p>
                    </div>
                    
                    <div className="space-y-3">
                      {communicationData.emergencyContacts.map((contact, index) => (
                        <div key={index} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                          <div className="flex items-center space-x-3">
                            <div className="relative">
                              <div className="w-10 h-10 bg-gray-600 rounded-full flex items-center justify-center text-white font-semibold text-sm">
                                {contact.name.split(' ').map(n => n[0]).join('')}
                              </div>
                              <div className={`absolute -bottom-1 -right-1 w-3 h-3 rounded-full border-2 border-white dark:border-gray-800 ${
                                contact.status === 'online' ? 'bg-green-500' : 'bg-yellow-500'
                              }`}></div>
                            </div>
                            <div>
                              <h4 className="font-medium text-gray-900 dark:text-white">{contact.name}</h4>
                              <p className="text-sm text-gray-600 dark:text-gray-400">{contact.role}</p>
                            </div>
                          </div>
                          <div className="flex space-x-2">
                            <button className="p-2 text-gray-400 hover:text-green-600 dark:hover:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-lg transition-colors">
                              <Phone className="w-4 h-4" />
                            </button>
                            <button className="p-2 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors">
                              <MessageSquare className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EmployeePortal;
