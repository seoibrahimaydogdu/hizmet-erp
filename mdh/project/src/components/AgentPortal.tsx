import React, { useState, useEffect } from 'react';
import { 
  MessageSquare, 
  BarChart3, 
  Settings, 
  Home,
  Bell,
  Search,
  Plus,
  Clock,
  CheckCircle,
  AlertCircle,
  Sun,
  Moon,
  Target,
  Award,
  Phone,
  Video,
  Paperclip,
  Smile,
  Send,
  Users,
  User,
  Star,
  TrendingUp,
  Mail,
  MapPin,
  Building,
  Download,
  RefreshCw,
  Zap,
  TrendingDown,
  Activity,
  X,
  LogOut
} from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';
import { useSupabase } from '../hooks/useSupabase';
import { supabase } from '../lib/supabase';
import { toast } from 'react-hot-toast';
import EmployeeChat from './EmployeeChat';
import FeedbackButton from './common/FeedbackButton';
import DirectMessage from './DirectMessage';

interface AgentPortalProps {
  onBackToAdmin?: () => void;
}

const AgentPortal: React.FC<AgentPortalProps> = ({ onBackToAdmin }) => {
  const { setTheme, isDark } = useTheme();
  const [currentPage, setCurrentPage] = useState('dashboard');
  const [agentData, setAgentData] = useState<any>(null);
  
  // EmployeeChat modal için state
  const [showEmployeeChat, setShowEmployeeChat] = useState(false);
  const [selectedChatType, setSelectedChatType] = useState<'team' | 'direct'>('team');
  const [showDirectMessage, setShowDirectMessage] = useState(false);

  // Görev yönetimi için state'ler
  const [tasks, setTasks] = useState([
    {
      id: 1,
      title: 'Müşteri geri bildirimlerini analiz et',
      description: 'Son 30 günlük geri bildirimleri incele',
      category: 'Raporlama',
      status: 'Devam Ediyor',
      priority: 'Yüksek',
      dueDate: '2024-01-15',
      createdAt: '2024-01-10',
      completedAt: null
    },
    {
      id: 2,
      title: 'Yeni müşteri eğitim materyali hazırla',
      description: 'Onboarding süreci için dokümantasyon',
      category: 'Eğitim',
      status: 'Beklemede',
      priority: 'Orta',
      dueDate: '2024-01-20',
      createdAt: '2024-01-12',
      completedAt: null
    },
    {
      id: 3,
      title: 'VIP müşteri takip raporu',
      description: 'Aylık VIP müşteri analizi',
      category: 'Müşteri Takibi',
      status: 'Tamamlandı',
      priority: 'Yüksek',
      dueDate: '2024-01-10',
      createdAt: '2024-01-05',
      completedAt: '2024-01-10'
    }
  ]);
  
  const [showNewTaskModal, setShowNewTaskModal] = useState(false);
  const [showEditTaskModal, setShowEditTaskModal] = useState(false);
  const [selectedTask, setSelectedTask] = useState<any>(null);
  const [newTask, setNewTask] = useState({
    title: '',
    description: '',
    category: 'Raporlama',
    priority: 'Orta',
    dueDate: ''
  });

  // Yeni Grup için state'ler
  const [showNewGroupModal, setShowNewGroupModal] = useState(false);
  const [newGroup, setNewGroup] = useState({
    name: '',
    description: '',
    type: 'public',
    members: [] as string[]
  });

  const {
    tickets,
    customers,
    fetchAgents,
    fetchTickets,
    fetchCustomers
  } = useSupabase();

  useEffect(() => {
    // Temsilci verilerini yükle
    fetchAgents();
    fetchTickets();
    fetchCustomers();
    
    // Gerçek zamanlı güncellemeler için subscription
    const ticketsSubscription = supabase
      .channel('agent_tickets_changes')
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'tickets' 
        }, 
        (payload: any) => {
          console.log('Agent ticket change detected:', payload);
          fetchTickets();
        }
      )
      .subscribe();

    // Direkt temsilci verilerini yükle
    const loadAgentData = async () => {
      try {
        // Demo temsilci verisi - gerçek uygulamada auth'dan gelecek
        const demoAgent = {
          id: 'agent-1',
          name: 'Ahmet Yılmaz',
          email: 'ahmet@company.com',
          phone: '+90 555 123 4567',
          department: 'Müşteri Hizmetleri',
          status: 'active',
          avatar: null,
          created_at: new Date().toISOString(),
          last_login: new Date().toISOString(),
          performance_score: 4.8,
          total_tickets: 156,
          resolved_tickets: 142,
          avg_response_time: '2.5 saat'
        };
        setAgentData(demoAgent);
      } catch (error) {
        console.error('Temsilci verileri yüklenirken hata:', error);
        toast.error('Temsilci verileri yüklenemedi');
      }
    };

    loadAgentData();


    return () => {
      ticketsSubscription.unsubscribe();
    };
  }, [fetchAgents, fetchTickets, fetchCustomers]);

  // Temsilciye atanmış talepler
  const agentTickets = tickets.filter(ticket => ticket.agent_id === agentData?.id);

  // Görev yönetimi fonksiyonları
  const handleCreateTask = () => {
    if (!newTask.title.trim()) {
      toast.error('Görev başlığı gereklidir');
      return;
    }
    
    const task = {
      id: Math.max(...tasks.map(t => t.id)) + 1,
      title: newTask.title,
      description: newTask.description,
      category: newTask.category,
      status: 'Beklemede',
      priority: newTask.priority,
      dueDate: newTask.dueDate,
      createdAt: new Date().toISOString().split('T')[0],
      completedAt: null
    };
    
    setTasks([...tasks, task]);
    setNewTask({ title: '', description: '', category: 'Raporlama', priority: 'Orta', dueDate: '' });
    setShowNewTaskModal(false);
    toast.success('Görev başarıyla oluşturuldu');
  };

  // Grup oluşturma fonksiyonu
  const handleCreateGroup = () => {
    if (!newGroup.name.trim()) {
      toast.error('Grup adı gereklidir');
      return;
    }
    
    console.log('Yeni grup oluşturuluyor:', newGroup);
    // Burada gerçek grup oluşturma işlemi yapılacak
    
    // Formu temizle
    setNewGroup({
      name: '',
      description: '',
      type: 'public',
      members: []
    });
    setShowNewGroupModal(false);
    toast.success('Grup başarıyla oluşturuldu!');
  };

  const handleUpdateTask = (taskId: number, updates: any) => {
    setTasks(tasks.map(task => 
      task.id === taskId ? { ...task, ...updates } : task
    ));
    toast.success('Görev güncellendi');
  };

  const handleDeleteTask = (taskId: number) => {
    setTasks(tasks.filter(task => task.id !== taskId));
    toast.success('Görev silindi');
  };

  const handleCompleteTask = (taskId: number) => {
    handleUpdateTask(taskId, { 
      status: 'Tamamlandı', 
      completedAt: new Date().toISOString().split('T')[0] 
    });
  };

  const handleStartTask = (taskId: number) => {
    handleUpdateTask(taskId, { status: 'Devam Ediyor' });
  };

  const handleArchiveTask = (taskId: number) => {
    handleDeleteTask(taskId);
  };

  const openEditTask = (task: any) => {
    setSelectedTask(task);
    setShowEditTaskModal(true);
  };

  // Görev istatistikleri
  const taskStats = {
    total: tasks.length,
    active: tasks.filter(t => t.status === 'Devam Ediyor').length,
    completed: tasks.filter(t => t.status === 'Tamamlandı').length,
    overdue: tasks.filter(t => {
      if (t.status === 'Tamamlandı') return false;
      return new Date(t.dueDate) < new Date();
    }).length
  };

  // Temsilci istatistikleri
  const agentStats = {
    totalTickets: agentTickets.length,
    openTickets: agentTickets.filter(t => t.status === 'open' || t.status === 'pending').length,
    resolvedTickets: agentTickets.filter(t => t.status === 'resolved').length,
    highPriorityTickets: agentTickets.filter(t => t.priority === 'high').length,
    avgResponseTime: '2.5 saat',
    customerSatisfaction: 4.8
  };


  // Dinamik mesaj fonksiyonu
  const getDashboardMessage = (ticketCount: number) => {
    if (ticketCount === 0) {
      return "Harika! Bugün hiç bekleyen talebin yok. Müşteri memnuniyeti için diğer görevlere odaklanabilirsin. 📚✨";
    } else if (ticketCount === 1) {
      return `Sadece ${ticketCount} talep bekliyor. Hızlıca halledip günü rahat geçirebilirsin! 🎯`;
    } else if (ticketCount <= 3) {
      return `${ticketCount} müşteri seni bekliyor. Dengeli bir tempoda hepsini çözebilirsin! ⚖️`;
    } else if (ticketCount <= 6) {
      return `${ticketCount} talep var ve biraz yoğun görünüyor. Öncelik sırasına göre başlayalım! 🚀`;
    } else if (ticketCount <= 10) {
      return `Vay be! ${ticketCount} talep bekliyor. Yoğun bir gün olacak ama sen halledersin! 💪`;
    } else {
      return `Wow! ${ticketCount} talep var! Süper kahraman moduna geçme zamanı! 🦸‍♀️⚡`;
    }
  };

  const renderDashboard = () => (
    <div className="space-y-6">
      {/* Hoş Geldin Mesajı */}
      <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold mb-2">
              Hoş geldin, {agentData?.name || 'Temsilci'}! 👋
            </h1>
            <p className="text-blue-100">
              {getDashboardMessage(agentStats.openTickets)}
            </p>
          </div>
          <div className="text-right">
            <p className="text-sm text-blue-100">Son giriş</p>
            <p className="font-semibold">
              {agentData?.last_login ? format(new Date(agentData.last_login), 'dd MMM yyyy, HH:mm', { locale: tr }) : 'Bilinmiyor'}
            </p>
          </div>
        </div>
      </div>

      {/* İstatistik Kartları */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Toplam Talep</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{agentStats.totalTickets}</p>
            </div>
            <div className="p-3 bg-blue-100 dark:bg-blue-900 rounded-full">
              <MessageSquare className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Açık Talepler</p>
              <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">{agentStats.openTickets}</p>
            </div>
            <div className="p-3 bg-orange-100 dark:bg-orange-900 rounded-full">
              <AlertCircle className="w-6 h-6 text-orange-600 dark:text-orange-400" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Çözülen</p>
              <p className="text-2xl font-bold text-green-600 dark:text-green-400">{agentStats.resolvedTickets}</p>
            </div>
            <div className="p-3 bg-green-100 dark:bg-green-900 rounded-full">
              <CheckCircle className="w-6 h-6 text-green-600 dark:text-green-400" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Müşteri Memnuniyeti</p>
              <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">{agentStats.customerSatisfaction}/5</p>
            </div>
            <div className="p-3 bg-purple-100 dark:bg-purple-900 rounded-full">
              <Award className="w-6 h-6 text-purple-600 dark:text-purple-400" />
            </div>
          </div>
        </div>
      </div>

      {/* Hızlı Aksiyonlar */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg border border-gray-200 dark:border-gray-700">
        <div className="flex items-center space-x-3 mb-4">
          <div className="p-2 bg-gradient-to-r from-green-500 to-green-600 rounded-lg">
            <Zap className="w-5 h-5 text-white" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Hızlı Aksiyonlar</h3>
        </div>
        
        <div className="space-y-3">
          <button 
            onClick={() => setCurrentPage('tasks')}
            className="w-full flex items-center space-x-3 p-3 bg-orange-50 dark:bg-orange-900/20 hover:bg-orange-100 dark:hover:bg-orange-900/30 rounded-lg transition-colors group"
          >
            <Target className="w-5 h-5 text-orange-600 dark:text-orange-400 group-hover:scale-110 transition-transform" />
            <span className="text-sm font-medium text-orange-900 dark:text-orange-100">Görevler</span>
          </button>
          
          <button 
            onClick={() => setCurrentPage('tickets')}
            className="w-full flex items-center space-x-3 p-3 bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/30 rounded-lg transition-colors group"
          >
            <Plus className="w-5 h-5 text-blue-600 dark:text-blue-400 group-hover:scale-110 transition-transform" />
            <span className="text-sm font-medium text-blue-900 dark:text-blue-100">Yeni Talep</span>
          </button>
          
          <button 
            onClick={() => setCurrentPage('live-chat')}
            className="w-full flex items-center space-x-3 p-3 bg-green-50 dark:bg-green-900/20 hover:bg-green-100 dark:hover:bg-green-900/30 rounded-lg transition-colors group"
          >
            <MessageSquare className="w-5 h-5 text-green-600 dark:text-green-400 group-hover:scale-110 transition-transform" />
            <span className="text-sm font-medium text-green-900 dark:text-green-100">Canlı Sohbet</span>
          </button>
          
          <button 
            onClick={() => setCurrentPage('performance')}
            className="w-full flex items-center space-x-3 p-3 bg-purple-50 dark:bg-purple-900/20 hover:bg-purple-100 dark:hover:bg-purple-900/30 rounded-lg transition-colors group"
          >
            <BarChart3 className="w-5 h-5 text-purple-600 dark:text-purple-400 group-hover:scale-110 transition-transform" />
            <span className="text-sm font-medium text-purple-900 dark:text-purple-100">Performans</span>
          </button>
        </div>
      </div>

      {/* Son Talepler */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Son Talepler</h2>
            <button 
              onClick={() => setCurrentPage('tickets')}
              className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300"
            >
              Tümünü Gör
            </button>
          </div>
        </div>
        <div className="p-6">
          <div className="space-y-4">
            {agentTickets.slice(0, 3).map((ticket: any) => (
              <div key={ticket.id} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <div className="flex-1">
                  <div className="flex items-center space-x-3">
                    <span className="text-sm font-medium text-gray-900 dark:text-white">
                      #{ticket.shortId || ticket.id.slice(-6)}
                    </span>
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      ticket.priority === 'high' 
                        ? 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300'
                        : ticket.priority === 'medium'
                        ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300'
                        : 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300'
                    }`}>
                      {ticket.priority === 'high' ? 'Yüksek' : ticket.priority === 'medium' ? 'Orta' : 'Düşük'}
                    </span>
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      ticket.status === 'open' 
                        ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300'
                        : ticket.status === 'pending'
                        ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300'
                        : 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300'
                    }`}>
                      {ticket.status === 'open' ? 'Açık' : ticket.status === 'pending' ? 'Beklemede' : 'Çözüldü'}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{ticket.title}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                    {ticket.customer_name} • {format(new Date(ticket.created_at), 'dd MMM yyyy, HH:mm', { locale: tr })}
                  </p>
                </div>
              </div>
            ))}
            {agentTickets.length === 0 && (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                <MessageSquare className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>Henüz atanmış talep bulunmuyor</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  const renderTasks = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Görev Yönetimi</h1>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Kişisel görevlerinizi organize edin ve takip edin
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <FeedbackButton 
            pageSource="AgentPortal-tasks" 
            position="inline"
            className="inline-flex items-center px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-medium"
          />
          <button 
            onClick={() => setShowNewTaskModal(true)}
            className="flex items-center space-x-2 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
          >
            <Target className="w-4 h-4" />
            <span>Yeni Görev</span>
          </button>
        </div>
      </div>

      {/* Görev İstatistikleri */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Toplam Görev</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{taskStats.total}</p>
            </div>
            <div className="p-3 bg-blue-100 dark:bg-blue-900 rounded-full">
              <Target className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Aktif Görevler</p>
              <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">{taskStats.active}</p>
            </div>
            <div className="p-3 bg-orange-100 dark:bg-orange-900 rounded-full">
              <Clock className="w-6 h-6 text-orange-600 dark:text-orange-400" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Tamamlanan</p>
              <p className="text-2xl font-bold text-green-600 dark:text-green-400">{taskStats.completed}</p>
            </div>
            <div className="p-3 bg-green-100 dark:bg-green-900 rounded-full">
              <CheckCircle className="w-6 h-6 text-green-600 dark:text-green-400" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Geciken</p>
              <p className="text-2xl font-bold text-red-600 dark:text-red-400">{taskStats.overdue}</p>
            </div>
            <div className="p-3 bg-red-100 dark:bg-red-900 rounded-full">
              <AlertCircle className="w-6 h-6 text-red-600 dark:text-red-400" />
            </div>
          </div>
        </div>
      </div>

      {/* Görev Filtreleri */}
      <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm border border-gray-200 dark:border-gray-700">
        <h3 className="font-semibold text-gray-900 dark:text-white mb-3">Görev Filtreleri</h3>
        <div className="flex flex-wrap gap-4">
          <select className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white">
            <option>Tüm Durumlar</option>
            <option>Beklemede</option>
            <option>Devam Ediyor</option>
            <option>Tamamlandı</option>
            <option>İptal Edildi</option>
          </select>
          <select className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white">
            <option>Tüm Öncelikler</option>
            <option>Yüksek</option>
            <option>Orta</option>
            <option>Düşük</option>
          </select>
          <select className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white">
            <option>Tüm Kategoriler</option>
            <option>Müşteri Takibi</option>
            <option>Raporlama</option>
            <option>Eğitim</option>
            <option>Proje</option>
          </select>
          <div className="flex-1 max-w-md">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Görev ara..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Görev Listesi */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-gray-900 dark:text-white">Görev Listesi</h3>
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-600 dark:text-gray-400">Toplam:</span>
              <span className="px-2 py-1 bg-orange-100 dark:bg-orange-900 text-orange-800 dark:text-orange-200 rounded-full text-sm font-medium">
                {taskStats.total}
              </span>
            </div>
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Görev
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Kategori
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Durum
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Öncelik
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Bitiş Tarihi
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  İşlemler
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {tasks.map((task) => {
                const getCategoryColor = (category: string) => {
                  switch (category) {
                    case 'Raporlama': return 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300';
                    case 'Eğitim': return 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300';
                    case 'Müşteri Takibi': return 'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300';
                    case 'Proje': return 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900 dark:text-indigo-300';
                    default: return 'bg-gray-100 text-gray-700 dark:bg-gray-900 dark:text-gray-300';
                  }
                };

                const getStatusColor = (status: string) => {
                  switch (status) {
                    case 'Beklemede': return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300';
                    case 'Devam Ediyor': return 'bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300';
                    case 'Tamamlandı': return 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300';
                    case 'İptal Edildi': return 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300';
                    default: return 'bg-gray-100 text-gray-700 dark:bg-gray-900 dark:text-gray-300';
                  }
                };

                const getPriorityColor = (priority: string) => {
                  switch (priority) {
                    case 'Yüksek': return 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300';
                    case 'Orta': return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300';
                    case 'Düşük': return 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300';
                    default: return 'bg-gray-100 text-gray-700 dark:bg-gray-900 dark:text-gray-300';
                  }
                };

                const formatDate = (dateString: string) => {
                  return new Date(dateString).toLocaleDateString('tr-TR', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric'
                  });
                };

                return (
                  <tr key={task.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900 dark:text-white">
                          {task.title}
                        </div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          {task.description}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs rounded-full ${getCategoryColor(task.category)}`}>
                        {task.category}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(task.status)}`}>
                        {task.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs rounded-full ${getPriorityColor(task.priority)}`}>
                        {task.priority}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {formatDate(task.dueDate)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center space-x-2">
                        <button 
                          onClick={() => openEditTask(task)}
                          className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300"
                        >
                          Düzenle
                        </button>
                        {task.status === 'Beklemede' && (
                          <button 
                            onClick={() => handleStartTask(task.id)}
                            className="text-green-600 dark:text-green-400 hover:text-green-700 dark:hover:text-green-300"
                          >
                            Başlat
                          </button>
                        )}
                        {task.status === 'Devam Ediyor' && (
                          <button 
                            onClick={() => handleCompleteTask(task.id)}
                            className="text-green-600 dark:text-green-400 hover:text-green-700 dark:hover:text-green-300"
                          >
                            Tamamla
                          </button>
                        )}
                        {task.status === 'Tamamlandı' && (
                          <button 
                            onClick={() => handleArchiveTask(task.id)}
                            className="text-gray-600 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
                          >
                            Arşivle
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  const renderTickets = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Akıllı Talep Yönetimi</h1>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Otomatik atama, öncelik sıralama ve SLA takibi ile optimize edilmiş talep yönetimi
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <FeedbackButton 
            pageSource="AgentPortal-tickets" 
            position="inline"
            className="inline-flex items-center px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-medium"
          />
          <button className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors">
            <Target className="w-4 h-4" />
            <span>Otomatik Atama</span>
          </button>
        <button className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
          <Plus className="w-4 h-4" />
          <span>Yeni Talep</span>
        </button>
        </div>
      </div>

      {/* Akıllı Filtreler ve SLA Durumu */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Filtreler */}
        <div className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm border border-gray-200 dark:border-gray-700">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-3">Akıllı Filtreler</h3>
        <div className="flex flex-wrap gap-4">
          <select className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white">
            <option>Tüm Durumlar</option>
            <option>Açık</option>
            <option>Beklemede</option>
            <option>Çözüldü</option>
          </select>
          <select className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white">
            <option>Tüm Öncelikler</option>
            <option>Yüksek</option>
            <option>Orta</option>
            <option>Düşük</option>
          </select>
            <select className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white">
              <option>Tüm Kategoriler</option>
              <option>Teknik Destek</option>
              <option>Faturalama</option>
              <option>Genel Soru</option>
              <option>Şikayet</option>
          </select>
          <div className="flex-1 max-w-md">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Talep ara..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>
          </div>
        </div>
      </div>

        {/* SLA Durumu */}
        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm border border-gray-200 dark:border-gray-700">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-3">SLA Durumu</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600 dark:text-gray-400">Kritik SLA</span>
              <span className="px-2 py-1 bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200 rounded-full text-xs font-medium">
                {agentTickets.filter(t => t.priority === 'high' && t.status !== 'resolved').length}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600 dark:text-gray-400">Orta SLA</span>
              <span className="px-2 py-1 bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200 rounded-full text-xs font-medium">
                {agentTickets.filter(t => t.priority === 'medium' && t.status !== 'resolved').length}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600 dark:text-gray-400">Normal SLA</span>
              <span className="px-2 py-1 bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 rounded-full text-xs font-medium">
                {agentTickets.filter(t => t.priority === 'low' && t.status !== 'resolved').length}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Gelişmiş Talep Listesi */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-gray-900 dark:text-white">Talep Listesi</h3>
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-600 dark:text-gray-400">Toplam:</span>
              <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded-full text-sm font-medium">
                {agentTickets.length}
              </span>
            </div>
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Talep
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Müşteri
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Durum
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Öncelik
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  SLA
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Tarih
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  İşlemler
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {agentTickets.slice(0, 10).map((ticket: any) => {
                // SLA hesaplama
                const createdDate = new Date(ticket.created_at);
                const now = new Date();
                const hoursDiff = (now.getTime() - createdDate.getTime()) / (1000 * 60 * 60);
                
                const getSLAColor = (priority: string, hours: number) => {
                  const slaHours = priority === 'high' ? 4 : priority === 'medium' ? 24 : 72;
                  if (hours > slaHours) return 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300';
                  if (hours > slaHours * 0.8) return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300';
                  return 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300';
                };

                const getSLAText = (priority: string, hours: number) => {
                  const slaHours = priority === 'high' ? 4 : priority === 'medium' ? 24 : 72;
                  const remaining = slaHours - hours;
                  if (remaining <= 0) return 'SLA Aşıldı';
                  if (remaining <= slaHours * 0.2) return `${Math.round(remaining)}h kaldı`;
                  return 'Normal';
                };

                return (
                <tr key={ticket.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                        <div className="flex items-center space-x-2">
                      <div className="text-sm font-medium text-gray-900 dark:text-white">
                        #{ticket.shortId || ticket.id.slice(-6)}
                      </div>
                          {ticket.priority === 'high' && (
                            <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                          )}
                        </div>
                        <div className="text-sm text-gray-500 dark:text-gray-400 truncate max-w-xs">
                        {ticket.title}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center space-x-2">
                        <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white text-xs font-semibold">
                          {ticket.customer_name?.charAt(0) || 'M'}
                        </div>
                    <div className="text-sm text-gray-900 dark:text-white">
                      {ticket.customer_name || 'Bilinmiyor'}
                        </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      ticket.status === 'open' 
                        ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300'
                        : ticket.status === 'pending'
                        ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300'
                        : 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300'
                    }`}>
                      {ticket.status === 'open' ? 'Açık' : ticket.status === 'pending' ? 'Beklemede' : 'Çözüldü'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      ticket.priority === 'high' 
                        ? 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300'
                        : ticket.priority === 'medium'
                        ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300'
                        : 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300'
                    }`}>
                      {ticket.priority === 'high' ? 'Yüksek' : ticket.priority === 'medium' ? 'Orta' : 'Düşük'}
                    </span>
                  </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs rounded-full ${getSLAColor(ticket.priority, hoursDiff)}`}>
                        {getSLAText(ticket.priority, hoursDiff)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                    {format(new Date(ticket.created_at), 'dd MMM yyyy', { locale: tr })}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center space-x-2">
                    <button className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300">
                      Görüntüle
                    </button>
                        <button className="text-green-600 dark:text-green-400 hover:text-green-700 dark:hover:text-green-300">
                          Çöz
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
    </div>
  );

  const renderLiveChat = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Canlı Destek</h1>
        <div className="flex items-center space-x-4">
          <FeedbackButton 
            pageSource="AgentPortal-live-chat" 
            position="inline"
            className="inline-flex items-center px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-medium"
          />
        <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
            <span className="text-sm text-gray-600 dark:text-gray-400">Çevrimiçi</span>
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-600 dark:text-gray-400">Aktif Sohbetler:</span>
            <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded-full text-sm font-medium">
              {agentStats.openTickets}
            </span>
          </div>
        </div>
      </div>

      {/* Gelişmiş Canlı Destek Arayüzü */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 h-[calc(100vh-300px)]">
        <div className="h-full flex">
          {/* Sol Panel - Müşteri Listesi */}
          <div className="w-80 bg-gray-50 dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700 flex flex-col">
            <div className="p-4 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-gray-900 dark:text-white">Aktif Sohbetler</h3>
                <span className="px-2 py-1 bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 rounded-full text-xs">
                  {agentTickets.filter(t => t.status === 'open' || t.status === 'pending').length} aktif
                </span>
              </div>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Müşteri ara..."
                  className="w-full pl-10 pr-4 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* Müşteri Listesi */}
            <div className="flex-1 overflow-y-auto">
              {agentTickets.filter(t => t.status === 'open' || t.status === 'pending').slice(0, 5).map((ticket: any) => (
                <div
                  key={ticket.id}
                  className="p-4 border-b border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer transition-colors"
                >
                  <div className="flex items-center space-x-3">
                    <div className="relative">
                      <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white font-semibold text-sm">
                        {ticket.customer_name?.charAt(0) || 'M'}
                      </div>
                      <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-white dark:border-gray-900"></div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                          {ticket.customer_name || 'Bilinmeyen Müşteri'}
                        </p>
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          ticket.priority === 'high' 
                            ? 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300'
                            : ticket.priority === 'medium'
                            ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300'
                            : 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300'
                        }`}>
                          {ticket.priority === 'high' ? 'Yüksek' : ticket.priority === 'medium' ? 'Orta' : 'Düşük'}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                        {ticket.title}
                      </p>
                      <p className="text-xs text-gray-400 dark:text-gray-500">
                        {format(new Date(ticket.created_at), 'dd MMM HH:mm', { locale: tr })}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
              
              {agentTickets.filter(t => t.status === 'open' || t.status === 'pending').length === 0 && (
                <div className="p-8 text-center text-gray-500 dark:text-gray-400">
              <MessageSquare className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p className="text-sm">Aktif sohbet bulunmuyor</p>
            </div>
              )}
          </div>
        </div>

          {/* Sağ Panel - Chat Alanı */}
          <div className="flex-1 flex flex-col">
            {/* Chat Header */}
            <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white font-semibold">
                    M
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white">Müşteri Seçin</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Sol taraftan bir müşteri seçin</p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <button className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors">
                    <Phone className="w-5 h-5 text-gray-500" />
                  </button>
                  <button className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors">
                    <Video className="w-5 h-5 text-gray-500" />
                  </button>
                </div>
              </div>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-4 bg-gray-50 dark:bg-gray-900">
              <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                <MessageSquare className="w-16 h-16 mx-auto mb-4 opacity-50" />
                <p className="text-lg mb-2">Sohbet Başlatın</p>
                <p className="text-sm">Sol taraftan bir müşteri seçerek sohbet etmeye başlayın</p>
              </div>
            </div>

            {/* Message Input */}
            <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
              <div className="flex items-end space-x-3">
                <button className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors">
                  <Paperclip className="w-5 h-5 text-gray-500" />
                </button>
                <button className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors">
                  <Smile className="w-5 h-5 text-gray-500" />
                </button>
                <div className="flex-1">
                  <textarea
                    placeholder="Müşteri seçin ve mesajınızı yazın..."
                    rows={1}
                    className="w-full px-4 py-3 text-sm border border-gray-300 dark:border-gray-600 rounded-2xl bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                    style={{ minHeight: '44px', maxHeight: '120px' }}
                    disabled
                  />
                </div>
                <button
                  disabled
                  className="p-3 bg-gray-300 dark:bg-gray-600 rounded-full transition-colors"
                >
                  <Send className="w-5 h-5 text-gray-500" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderCRM = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Müşteri İlişkileri Yönetimi</h1>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Müşteri profilleri, geçmiş ve segmentasyon ile kapsamlı CRM
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <FeedbackButton 
            pageSource="AgentPortal-crm" 
            position="inline"
            className="inline-flex items-center px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-medium"
          />
          <button className="flex items-center space-x-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors">
            <TrendingUp className="w-4 h-4" />
            <span>Analiz</span>
          </button>
          <button className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
            <Plus className="w-4 h-4" />
            <span>Yeni Müşteri</span>
          </button>
        </div>
      </div>

      {/* CRM Dashboard */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Toplam Müşteri</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{customers.length}</p>
            </div>
            <div className="p-3 bg-blue-100 dark:bg-blue-900 rounded-full">
              <Users className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">VIP Müşteriler</p>
              <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                {customers.filter(c => c.plan === 'premium' || c.plan === 'vip').length}
              </p>
            </div>
            <div className="p-3 bg-purple-100 dark:bg-purple-900 rounded-full">
              <Star className="w-6 h-6 text-purple-600 dark:text-purple-400" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Aktif Müşteriler</p>
              <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                {customers.filter(c => c.plan === 'premium' || c.plan === 'standard').length}
              </p>
            </div>
            <div className="p-3 bg-green-100 dark:bg-green-900 rounded-full">
              <CheckCircle className="w-6 h-6 text-green-600 dark:text-green-400" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Memnuniyet</p>
              <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">4.8/5</p>
            </div>
            <div className="p-3 bg-yellow-100 dark:bg-yellow-900 rounded-full">
              <Award className="w-6 h-6 text-yellow-600 dark:text-yellow-400" />
            </div>
          </div>
        </div>
      </div>

      {/* Müşteri Segmentasyonu */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Müşteri Segmentasyonu</h3>
            <div className="flex items-center space-x-2">
              <Search className="w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Müşteri ara..."
                className="px-3 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>
          </div>
          
          <div className="space-y-4">
            {/* VIP Müşteriler */}
            <div className="border border-purple-200 dark:border-purple-800 rounded-lg p-4 bg-purple-50 dark:bg-purple-900/20">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-2">
                  <Star className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                  <h4 className="font-semibold text-purple-900 dark:text-purple-100">VIP Müşteriler</h4>
                </div>
                <span className="px-2 py-1 bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200 rounded-full text-sm">
                  {customers.filter(c => c.plan === 'premium' || c.plan === 'vip').length} müşteri
                </span>
              </div>
              <div className="space-y-2">
                {customers.filter(c => c.plan === 'premium' || c.plan === 'vip').slice(0, 2).map((customer, index) => (
                  <div key={index} className="flex items-center justify-between p-2 bg-white dark:bg-gray-800 rounded border">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center text-white text-xs font-semibold">
                        {customer.name.charAt(0)}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900 dark:text-white">{customer.name}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">{customer.company || 'Şirket bilgisi yok'}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold text-gray-900 dark:text-white">{customer.plan || 'Premium'}</p>
                      <div className="flex items-center space-x-1">
                        <div className={`w-2 h-2 rounded-full ${customer.plan === 'premium' ? 'bg-green-500' : 'bg-yellow-500'}`}></div>
                        <span className="text-xs text-gray-500 dark:text-gray-400 capitalize">{customer.plan || 'standard'}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Yeni Müşteriler */}
            <div className="border border-green-200 dark:border-green-800 rounded-lg p-4 bg-green-50 dark:bg-green-900/20">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-2">
                  <User className="w-5 h-5 text-green-600 dark:text-green-400" />
                  <h4 className="font-semibold text-green-900 dark:text-green-100">Yeni Müşteriler</h4>
                </div>
                <span className="px-2 py-1 bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 rounded-full text-sm">
                  {customers.filter(c => {
                    const createdDate = new Date(c.created_at);
                    const weekAgo = new Date();
                    weekAgo.setDate(weekAgo.getDate() - 7);
                    return createdDate > weekAgo;
                  }).length} müşteri
                </span>
              </div>
              <div className="space-y-2">
                {customers.filter(c => {
                  const createdDate = new Date(c.created_at);
                  const weekAgo = new Date();
                  weekAgo.setDate(weekAgo.getDate() - 7);
                  return createdDate > weekAgo;
                }).slice(0, 1).map((customer, index) => (
                  <div key={index} className="flex items-center justify-between p-2 bg-white dark:bg-gray-800 rounded border">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center text-white text-xs font-semibold">
                        {customer.name.charAt(0)}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900 dark:text-white">{customer.name}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">{customer.company || 'Şirket bilgisi yok'}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {new Date(customer.created_at).toLocaleDateString('tr-TR')}
                      </p>
                      <div className="flex items-center space-x-1">
                        <div className={`w-2 h-2 rounded-full ${customer.plan === 'premium' ? 'bg-green-500' : 'bg-yellow-500'}`}></div>
                        <span className="text-xs text-gray-500 dark:text-gray-400 capitalize">{customer.plan || 'standard'}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Müşteri Detayları */}
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Müşteri Detayları</h3>
          
          <div className="space-y-4">
            <div className="text-center">
              <div className="w-20 h-20 bg-blue-500 rounded-full flex items-center justify-center text-white text-2xl font-bold mx-auto mb-3">
                AY
              </div>
              <h4 className="font-semibold text-gray-900 dark:text-white">Ahmet Yılmaz</h4>
              <p className="text-sm text-gray-500 dark:text-gray-400">ABC Teknoloji A.Ş.</p>
              <div className="flex items-center justify-center space-x-1 mt-2">
                <Star className="w-4 h-4 text-yellow-500 fill-current" />
                <Star className="w-4 h-4 text-yellow-500 fill-current" />
                <Star className="w-4 h-4 text-yellow-500 fill-current" />
                <Star className="w-4 h-4 text-yellow-500 fill-current" />
                <Star className="w-4 h-4 text-yellow-500 fill-current" />
                <span className="text-sm text-gray-600 dark:text-gray-400 ml-2">5.0</span>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center space-x-3">
                <Mail className="w-4 h-4 text-gray-400" />
                <span className="text-sm text-gray-600 dark:text-gray-400">ahmet@abcteknoloji.com</span>
              </div>
              <div className="flex items-center space-x-3">
                <Phone className="w-4 h-4 text-gray-400" />
                <span className="text-sm text-gray-600 dark:text-gray-400">+90 532 123 4567</span>
              </div>
              <div className="flex items-center space-x-3">
                <MapPin className="w-4 h-4 text-gray-400" />
                <span className="text-sm text-gray-600 dark:text-gray-400">İstanbul, Türkiye</span>
              </div>
              <div className="flex items-center space-x-3">
                <Building className="w-4 h-4 text-gray-400" />
                <span className="text-sm text-gray-600 dark:text-gray-400">Teknoloji</span>
              </div>
            </div>

            <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
              <h5 className="font-medium text-gray-900 dark:text-white mb-2">İstatistikler</h5>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">Toplam Talep:</span>
                  <span className="font-medium text-gray-900 dark:text-white">47</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">Çözülen:</span>
                  <span className="font-medium text-gray-900 dark:text-white">45</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">Ortalama Yanıt:</span>
                  <span className="font-medium text-gray-900 dark:text-white">1.2 saat</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">Son İletişim:</span>
                  <span className="font-medium text-gray-900 dark:text-white">2 gün önce</span>
                </div>
              </div>
            </div>

            <div className="flex space-x-2">
              <button className="flex-1 px-3 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 transition-colors">
                Mesaj Gönder
              </button>
              <button className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg text-sm hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                Profil
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderPerformance = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Gelişmiş Performans Analizi</h1>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Detaylı KPI takibi, trend analizi ve performans raporları
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <FeedbackButton 
            pageSource="AgentPortal-performance" 
            position="inline"
            className="inline-flex items-center px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-medium"
          />
          <button className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors">
            <Download className="w-4 h-4" />
            <span>Rapor İndir</span>
          </button>
          <button className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
            <RefreshCw className="w-4 h-4" />
            <span>Yenile</span>
          </button>
        </div>
      </div>

      {/* KPI Dashboard */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Çözüm Oranı</p>
              <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                {agentStats.totalTickets > 0 ? Math.round((agentStats.resolvedTickets / agentStats.totalTickets) * 100) : 0}%
              </p>
              <div className="flex items-center mt-1">
                <TrendingUp className="w-4 h-4 text-green-500 mr-1" />
                <span className="text-xs text-green-600 dark:text-green-400">+5.2% bu ay</span>
              </div>
            </div>
            <div className="p-3 bg-green-100 dark:bg-green-900 rounded-full">
              <Target className="w-6 h-6 text-green-600 dark:text-green-400" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Ortalama Yanıt Süresi</p>
              <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{agentStats.avgResponseTime}</p>
              <div className="flex items-center mt-1">
                <TrendingDown className="w-4 h-4 text-green-500 mr-1" />
                <span className="text-xs text-green-600 dark:text-green-400">-12% iyileşme</span>
              </div>
            </div>
            <div className="p-3 bg-blue-100 dark:bg-blue-900 rounded-full">
              <Clock className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Müşteri Memnuniyeti</p>
              <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">{agentStats.customerSatisfaction}/5</p>
              <div className="flex items-center mt-1">
                <TrendingUp className="w-4 h-4 text-green-500 mr-1" />
                <span className="text-xs text-green-600 dark:text-green-400">+0.3 puan</span>
              </div>
            </div>
            <div className="p-3 bg-purple-100 dark:bg-purple-900 rounded-full">
              <Award className="w-6 h-6 text-purple-600 dark:text-purple-400" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Aktif Görevler</p>
              <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">{agentStats.openTickets}</p>
              <div className="flex items-center mt-1">
                <Activity className="w-4 h-4 text-orange-500 mr-1" />
                <span className="text-xs text-orange-600 dark:text-orange-400">Güncel</span>
              </div>
            </div>
            <div className="p-3 bg-orange-100 dark:bg-orange-900 rounded-full">
              <Activity className="w-6 h-6 text-orange-600 dark:text-orange-400" />
            </div>
          </div>
        </div>
      </div>

      {/* Detaylı Analiz */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Performans Trendi */}
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Performans Trendi</h3>
            <div className="flex items-center space-x-2">
              <select className="px-3 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white">
                <option>Son 7 Gün</option>
                <option>Son 30 Gün</option>
                <option>Son 3 Ay</option>
              </select>
            </div>
          </div>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <div className="flex items-center space-x-3">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <span className="text-sm font-medium text-gray-900 dark:text-white">Çözülen Talepler</span>
              </div>
              <div className="text-right">
                <p className="text-lg font-bold text-gray-900 dark:text-white">142</p>
                <p className="text-xs text-green-600 dark:text-green-400">+8 bu hafta</p>
              </div>
            </div>
            
            <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <div className="flex items-center space-x-3">
                <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                <span className="text-sm font-medium text-gray-900 dark:text-white">Ortalama Yanıt Süresi</span>
              </div>
              <div className="text-right">
                <p className="text-lg font-bold text-gray-900 dark:text-white">2.3 saat</p>
                <p className="text-xs text-green-600 dark:text-green-400">-0.2 saat</p>
              </div>
            </div>
            
            <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <div className="flex items-center space-x-3">
                <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
                <span className="text-sm font-medium text-gray-900 dark:text-white">Müşteri Puanı</span>
              </div>
              <div className="text-right">
                <p className="text-lg font-bold text-gray-900 dark:text-white">4.8/5</p>
                <p className="text-xs text-green-600 dark:text-green-400">+0.1 puan</p>
              </div>
            </div>
          </div>
        </div>

        {/* Hedefler ve Başarılar */}
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Hedefler ve Başarılar</h3>
          
          <div className="space-y-4">
            <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-medium text-green-900 dark:text-green-100">Aylık Çözüm Hedefi</h4>
                <span className="text-sm font-bold text-green-800 dark:text-green-200">150/150</span>
              </div>
              <div className="w-full bg-green-200 dark:bg-green-800 rounded-full h-2">
                <div className="bg-green-500 h-2 rounded-full" style={{ width: '100%' }}></div>
              </div>
              <p className="text-xs text-green-700 dark:text-green-300 mt-1">✅ Hedef tamamlandı!</p>
            </div>
            
            <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-medium text-blue-900 dark:text-blue-100">Yanıt Süresi Hedefi</h4>
                <span className="text-sm font-bold text-blue-800 dark:text-blue-200">2.3/2.0 saat</span>
              </div>
              <div className="w-full bg-blue-200 dark:bg-blue-800 rounded-full h-2">
                <div className="bg-blue-500 h-2 rounded-full" style={{ width: '87%' }}></div>
              </div>
              <p className="text-xs text-blue-700 dark:text-blue-300 mt-1">Hedefin %87'si</p>
            </div>
            
            <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg border border-purple-200 dark:border-purple-800">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-medium text-purple-900 dark:text-purple-100">Memnuniyet Hedefi</h4>
                <span className="text-sm font-bold text-purple-800 dark:text-purple-200">4.8/4.5</span>
              </div>
              <div className="w-full bg-purple-200 dark:bg-purple-800 rounded-full h-2">
                <div className="bg-purple-500 h-2 rounded-full" style={{ width: '100%' }}></div>
              </div>
              <p className="text-xs text-purple-700 dark:text-purple-300 mt-1">✅ Hedef aşıldı!</p>
            </div>
          </div>
        </div>
      </div>

      {/* Başarı Rozetleri */}
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Başarı Rozetleri</h3>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
            <div className="w-12 h-12 bg-yellow-500 rounded-full flex items-center justify-center mx-auto mb-2">
              <Award className="w-6 h-6 text-white" />
            </div>
            <h4 className="font-medium text-yellow-900 dark:text-yellow-100 text-sm">Hızlı Çözüm</h4>
            <p className="text-xs text-yellow-700 dark:text-yellow-300">Ortalama 2.3 saat</p>
          </div>
          
          <div className="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
            <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-2">
              <Star className="w-6 h-6 text-white" />
            </div>
            <h4 className="font-medium text-green-900 dark:text-green-100 text-sm">Müşteri Favorisi</h4>
            <p className="text-xs text-green-700 dark:text-green-300">4.8/5 puan</p>
          </div>
          
          <div className="text-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
            <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center mx-auto mb-2">
              <Target className="w-6 h-6 text-white" />
            </div>
            <h4 className="font-medium text-blue-900 dark:text-blue-100 text-sm">Hedef Avcısı</h4>
            <p className="text-xs text-blue-700 dark:text-blue-300">%100 başarı</p>
          </div>
          
          <div className="text-center p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg border border-purple-200 dark:border-purple-800">
            <div className="w-12 h-12 bg-purple-500 rounded-full flex items-center justify-center mx-auto mb-2">
              <Activity className="w-6 h-6 text-white" />
            </div>
            <h4 className="font-medium text-purple-900 dark:text-purple-100 text-sm">Süper Temsilci</h4>
            <p className="text-xs text-purple-700 dark:text-purple-300">142 çözüm</p>
          </div>
        </div>
      </div>
    </div>
  );

  const renderTeam = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Takım İletişimi</h1>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Takım sohbeti, bilgi paylaşımı ve işbirliği araçları
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <FeedbackButton 
            pageSource="AgentPortal-team" 
            position="inline"
            className="inline-flex items-center px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-medium"
          />
          <button 
            onClick={() => setShowNewGroupModal(true)}
            className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Yeni Grup</span>
          </button>
        </div>
      </div>

      {/* Hızlı Erişim Kartları */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
        <button 
          onClick={() => {
            setSelectedChatType('team');
            setShowEmployeeChat(true);
          }}
          className="bg-white dark:bg-gray-800 rounded-lg p-3 border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow text-left"
        >
          <div className="flex items-center justify-between mb-2">
            <div className="p-1.5 bg-blue-100 dark:bg-blue-900 rounded-lg">
              <Users className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <span className="text-xs bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300 px-2 py-1 rounded-full">
              0
                  </span>
              </div>
          <h3 className="font-semibold text-gray-900 dark:text-white text-sm">Takım Sohbeti</h3>
          <p className="text-xs text-gray-600 dark:text-gray-400">Takım üyeleriyle mesajlaş</p>
                </button>

              <button 
          onClick={() => setShowDirectMessage(true)}
          className="bg-white dark:bg-gray-800 rounded-lg p-3 border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow text-left"
        >
          <div className="flex items-center justify-between mb-2">
            <div className="p-1.5 bg-green-100 dark:bg-green-900 rounded-lg">
              <User className="w-5 h-5 text-green-600 dark:text-green-400" />
            </div>
          </div>
          <h3 className="font-semibold text-gray-900 dark:text-white text-sm">Direkt Mesaj</h3>
          <p className="text-xs text-gray-600 dark:text-gray-400">Birebir mesajlaşma</p>
            </button>


        <button className="bg-white dark:bg-gray-800 rounded-lg p-3 border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow text-left">
          <div className="flex items-center justify-between mb-2">
            <div className="p-1.5 bg-orange-100 dark:bg-orange-900 rounded-lg">
              <Video className="w-5 h-5 text-orange-600 dark:text-orange-400" />
            </div>
            </div>
          <h3 className="font-semibold text-gray-900 dark:text-white text-sm">Video Görüşme</h3>
          <p className="text-xs text-gray-600 dark:text-gray-400">Toplantı başlat</p>
              </button>
        </div>

      {/* TeamChat Bileşeni - Tam Ekran */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 h-[800px]">
        <EmployeeChat />
            </div>
            

    </div>
  );


  const renderSettings = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Ayarlar</h1>
        <FeedbackButton 
          pageSource="AgentPortal-settings" 
          position="inline"
          className="inline-flex items-center px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-medium"
        />
      </div>

      {/* Profil Ayarları */}
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Profil Bilgileri</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Ad Soyad
            </label>
            <input
              type="text"
              value={agentData?.name || ''}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              readOnly
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              E-posta
            </label>
            <input
              type="email"
              value={agentData?.email || ''}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              readOnly
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Telefon
            </label>
            <input
              type="tel"
              value={agentData?.phone || ''}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              readOnly
            />
          </div>
        </div>
      </div>

      {/* Bildirim Ayarları */}
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Bildirim Ayarları</h2>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Yeni talep bildirimleri</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">Yeni atanan talepler için bildirim al</p>
            </div>
            <input type="checkbox" defaultChecked className="rounded" />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300">E-posta bildirimleri</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">Önemli güncellemeler için e-posta al</p>
            </div>
            <input type="checkbox" defaultChecked className="rounded" />
          </div>
        </div>
      </div>
    </div>
  );

  const renderContent = () => {
    switch (currentPage) {
      case 'dashboard':
        return renderDashboard();
      case 'tasks':
        return renderTasks();
      case 'tickets':
        return renderTickets();
      case 'live-chat':
        return renderLiveChat();
      case 'crm':
        return renderCRM();
      case 'performance':
        return renderPerformance();
      case 'team':
        return renderTeam();
      case 'settings':
        return renderSettings();
      default:
        return renderDashboard();
    }
  };

  return (
    <div className={`min-h-screen ${isDark ? 'dark' : ''}`}>
      <div className="flex bg-gray-50 dark:bg-gray-900">
        {/* Sidebar */}
        <div className="w-64 bg-white dark:bg-gray-800 shadow-lg border-r border-gray-200 dark:border-gray-700">
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold">
                {agentData?.name?.charAt(0) || 'A'}
              </div>
              <div>
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                  {agentData?.name || 'Temsilci'}
                </h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {agentData?.department || 'Müşteri Hizmetleri'}
                </p>
              </div>
            </div>
          </div>

          <nav className="p-4 space-y-2">
            <button
              onClick={() => setCurrentPage('dashboard')}
              className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-left transition-colors ${
                currentPage === 'dashboard'
                  ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300'
                  : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
            >
              <Home className="w-5 h-5" />
              <span>Dashboard</span>
            </button>

            <button
              onClick={() => setCurrentPage('tasks')}
              className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-left transition-colors ${
                currentPage === 'tasks'
                  ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300'
                  : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
            >
              <Target className="w-5 h-5" />
              <span>Görevler</span>
            </button>

            <button
              onClick={() => setCurrentPage('tickets')}
              className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-left transition-colors ${
                currentPage === 'tickets'
                  ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300'
                  : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
            >
              <MessageSquare className="w-5 h-5" />
              <span>Taleplerim</span>
              {agentStats.openTickets > 0 && (
                <span className="ml-auto px-2 py-0.5 text-xs bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300 rounded-full">
                  {agentStats.openTickets}
                </span>
              )}
            </button>

            <button
              onClick={() => setCurrentPage('live-chat')}
              className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-left transition-colors ${
                currentPage === 'live-chat'
                  ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300'
                  : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
            >
              <MessageSquare className="w-5 h-5" />
              <span>Canlı Destek</span>
            </button>

            <button
              onClick={() => setCurrentPage('crm')}
              className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-left transition-colors ${
                currentPage === 'crm'
                  ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300'
                  : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
            >
              <Users className="w-5 h-5" />
              <span>Müşteri Yönetimi</span>
            </button>

            <button
              onClick={() => setCurrentPage('performance')}
              className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-left transition-colors ${
                currentPage === 'performance'
                  ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300'
                  : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
            >
              <BarChart3 className="w-5 h-5" />
              <span>Performans</span>
            </button>

            <button
              onClick={() => setCurrentPage('team')}
              className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-left transition-colors ${
                currentPage === 'team'
                  ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300'
                  : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
            >
              <Users className="w-5 h-5" />
              <span>Takım İletişimi</span>
            </button>


            <button
              onClick={() => setCurrentPage('settings')}
              className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-left transition-colors ${
                currentPage === 'settings'
                  ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300'
                  : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
            >
              <Settings className="w-5 h-5" />
              <span>Ayarlar</span>
            </button>

            {onBackToAdmin && (
              <button
                onClick={onBackToAdmin}
                className="w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-left transition-colors text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 mt-4"
              >
                <LogOut className="w-5 h-5" />
                <span>Admin Panel'e Dön</span>
              </button>
            )}
          </nav>

        </div>

        {/* Main Content */}
        <div className="flex-1 flex flex-col">
          {/* Header */}
          <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-xl font-semibold text-gray-900 dark:text-white">
                  {currentPage === 'dashboard' && 'Dashboard'}
                  {currentPage === 'tasks' && 'Görevler'}
                  {currentPage === 'tickets' && 'Taleplerim'}
                  {currentPage === 'live-chat' && 'Canlı Destek'}
                  {currentPage === 'crm' && 'Müşteri Yönetimi'}
                  {currentPage === 'performance' && 'Performans'}
                  {currentPage === 'team' && 'Takım İletişimi'}
                  {currentPage === 'settings' && 'Ayarlar'}
                </h1>
              </div>
              <div className="flex items-center space-x-4">
                <button
                  onClick={() => setTheme(isDark ? 'light' : 'dark')}
                  className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
                </button>
                <button className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700">
                  <Bell className="w-5 h-5" />
                </button>
                <button className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700">
                  <LogOut className="w-5 h-5" />
                </button>
              </div>
            </div>
          </header>

          {/* Page Content */}
          <main className="flex-1 p-6 overflow-y-auto">
            {renderContent()}
          </main>
        </div>
      </div>

      {/* EmployeeChat Modal */}
      {showEmployeeChat && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full h-full max-w-7xl max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                {selectedChatType === 'team' ? 'Takım Sohbeti' : 'Direkt Mesajlaşma'}
              </h2>
              <button
                onClick={() => setShowEmployeeChat(false)}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            <div className="flex-1 overflow-hidden">
              <EmployeeChat />
            </div>
          </div>
        </div>
      )}

      {/* Direkt Mesaj Modal */}
      {showDirectMessage && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full h-full max-w-6xl max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
                  <User className="w-5 h-5 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Direkt Mesajlaşma</h2>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Birebir mesajlaşma</p>
                </div>
              </div>
              <button
                onClick={() => setShowDirectMessage(false)}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            <div className="flex-1 overflow-hidden">
              <DirectMessage currentUser={agentData} />
            </div>
          </div>
        </div>
      )}

      {/* Yeni Görev Modal */}
      {showNewTaskModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-orange-100 dark:bg-orange-900 rounded-lg">
                  <Target className="w-5 h-5 text-orange-600 dark:text-orange-400" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Yeni Görev Oluştur</h2>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Yeni bir görev ekleyin</p>
                </div>
              </div>
              <button
                onClick={() => setShowNewTaskModal(false)}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            
            <div className="p-6 space-y-6">
              {/* Görev Başlığı */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Görev Başlığı *
                </label>
                <input
                  type="text"
                  value={newTask.title}
                  onChange={(e) => setNewTask({...newTask, title: e.target.value})}
                  placeholder="Görev başlığını girin..."
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                />
              </div>

              {/* Görev Açıklaması */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Açıklama
                </label>
                <textarea
                  value={newTask.description}
                  onChange={(e) => setNewTask({...newTask, description: e.target.value})}
                  placeholder="Görev açıklamasını girin..."
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent resize-none"
                />
              </div>

              {/* Kategori ve Öncelik */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Kategori
                  </label>
                  <select
                    value={newTask.category}
                    onChange={(e) => setNewTask({...newTask, category: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  >
                    <option value="Raporlama">Raporlama</option>
                    <option value="Eğitim">Eğitim</option>
                    <option value="Müşteri Takibi">Müşteri Takibi</option>
                    <option value="Proje">Proje</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Öncelik
                  </label>
                  <select
                    value={newTask.priority}
                    onChange={(e) => setNewTask({...newTask, priority: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  >
                    <option value="Düşük">Düşük</option>
                    <option value="Orta">Orta</option>
                    <option value="Yüksek">Yüksek</option>
                  </select>
                </div>
              </div>

              {/* Bitiş Tarihi */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Bitiş Tarihi
                </label>
                <input
                  type="date"
                  value={newTask.dueDate}
                  onChange={(e) => setNewTask({...newTask, dueDate: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                />
              </div>

              {/* Butonlar */}
              <div className="flex items-center justify-end space-x-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                <button
                  onClick={() => setShowNewTaskModal(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors"
                >
                  İptal
                </button>
                <button
                  onClick={handleCreateTask}
                  className="px-4 py-2 text-sm font-medium text-white bg-orange-600 hover:bg-orange-700 rounded-lg transition-colors flex items-center space-x-2"
                >
                  <Target className="w-4 h-4" />
                  <span>Görev Oluştur</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Yeni Grup Modal */}
      {showNewGroupModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Yeni Grup Oluştur</h2>
              <button
                onClick={() => setShowNewGroupModal(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <div className="p-6 space-y-6">
              {/* Grup Adı */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Grup Adı *
                </label>
                <input
                  type="text"
                  value={newGroup.name}
                  onChange={(e) => setNewGroup(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  placeholder="Grup adını girin"
                />
              </div>

              {/* Grup Açıklaması */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Açıklama
                </label>
                <textarea
                  value={newGroup.description}
                  onChange={(e) => setNewGroup(prev => ({ ...prev, description: e.target.value }))}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  placeholder="Grup açıklamasını girin"
                />
              </div>

              {/* Grup Tipi */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Grup Tipi
                </label>
                <select
                  value={newGroup.type}
                  onChange={(e) => setNewGroup(prev => ({ ...prev, type: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                >
                  <option value="public">Herkese Açık</option>
                  <option value="private">Özel</option>
                  <option value="restricted">Kısıtlı</option>
                </select>
              </div>

              {/* Üye Seçimi */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Üyeler
                </label>
                <div className="space-y-2">
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    Grup oluşturulduktan sonra üyeler eklenebilir
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-end space-x-3 p-6 border-t border-gray-200 dark:border-gray-700">
              <button
                onClick={() => setShowNewGroupModal(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors"
              >
                İptal
              </button>
              <button
                onClick={handleCreateGroup}
                className="px-4 py-2 text-sm font-medium text-white bg-green-600 hover:bg-green-700 rounded-lg transition-colors flex items-center space-x-2"
              >
                <Plus className="w-4 h-4" />
                <span>Grup Oluştur</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AgentPortal;
