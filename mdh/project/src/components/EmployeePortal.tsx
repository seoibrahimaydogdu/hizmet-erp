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
  RefreshCw
} from 'lucide-react';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';

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

  const renderDashboard = () => (
    <div className="space-y-6">
      {/* Hoş Geldin Kartı */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Hoş geldin, {employee.name}!</h1>
            <p className="text-blue-100 mt-1">{employee.position} • {employee.department}</p>
            <p className="text-blue-100 text-sm mt-2">
              Bugün: {format(new Date(), 'dd MMMM yyyy, EEEE', { locale: tr })}
            </p>
          </div>
          <div className="w-16 h-16 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
            <span className="text-2xl font-bold">{employee.avatar}</span>
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

      {/* Son Aktiviteler */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Son Aktiviteler</h3>
        </div>
        <div className="p-4 space-y-3">
          {recentActivities.map((activity) => (
            <div key={activity.id} className="flex items-center space-x-3">
              <div className={`p-2 rounded-lg ${activity.color.replace('text-', 'bg-').replace('-600', '-100')} dark:${activity.color.replace('text-', 'bg-').replace('-600', '-900')}`}>
                <activity.icon className={`w-4 h-4 ${activity.color}`} />
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
      case 'leave':
        return renderLeaveManagement();
      case 'salary':
        return renderSalaryInfo();
      case 'performance':
        return renderPerformance();
      default:
        return renderDashboard();
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
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

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar */}
          <div className="lg:w-64 flex-shrink-0">
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
            </nav>
          </div>

          {/* Main Content */}
          <div className="flex-1">
            {renderContent()}
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmployeePortal;
