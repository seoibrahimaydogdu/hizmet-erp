import React, { useState, useEffect } from 'react';
import { 
  User, 
  Mail, 
  Phone, 
  Building, 
  Calendar, 
  CreditCard, 
  MessageSquare,
  Star,
  TrendingUp,
  Clock,
  DollarSign,
  FileText,
  Activity,
  AlertCircle,
  CheckCircle,
  XCircle,
  Users,
  ShoppingCart,
  Award,
  Award,
  FileText,
  Upload,
  Download,
  AlertTriangle,
  TrendingUp as TrendingUpIcon,
  Package,
  Lightbulb,
  BarChart3,
  Calendar as CalendarIcon,
  Clock as ClockIcon,
  Users as UsersIcon,
  Zap,
  Shield,
  Database,
  Settings as SettingsIcon
} from 'lucide-react';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts';
import { supabase } from '../lib/supabase';
import { toast } from 'react-hot-toast';

interface CustomerProfileProps {
  customerId: string;
  onBack: () => void;
}

interface CustomerData {
  id: string;
  name: string;
  email: string;
  phone?: string;
  company?: string;
  plan: string;
  satisfaction_score: number;
  total_tickets: number;
  created_at: string;
  updated_at: string;
  avatar_url?: string;
}

interface TicketData {
  id: string;
  title: string;
  description?: string;
  status: string;
  priority: string;
  category: string;
  created_at: string;
  updated_at: string;
  resolved_at?: string;
  agents?: {
    name: string;
    email: string;
  };
}

interface PlanHistory {
  id: string;
  plan: string;
  start_date: string;
  end_date?: string;
  price: number;
  reason: string;
  is_current: boolean;
}

interface Document {
  id: string;
  name: string;
  type: string;
  size: string;
  uploaded_date: string;
  category: string;
  url: string;
}

interface Reminder {
  id: string;
  title: string;
  description: string;
  type: 'warning' | 'info' | 'success';
  priority: 'high' | 'medium' | 'low';
  due_date: string;
  is_completed: boolean;
}

interface Contact {
  id: string;
  name: string;
  role: string;
  email: string;
  phone?: string;
  department: string;
  is_primary: boolean;
}

interface Recommendation {
  id: string;
  title: string;
  description: string;
  type: 'upgrade' | 'addon' | 'feature';
  potential_value: string;
  priority: 'high' | 'medium' | 'low';
}

interface FeatureUsage {
  feature: string;
  usage_percentage: number;
  total_available: number;
  used: number;
  trend: 'up' | 'down' | 'stable';
}

const CustomerProfile: React.FC<CustomerProfileProps> = ({ customerId, onBack }) => {
  const [activeTab, setActiveTab] = useState('overview');
  const [customerData, setCustomerData] = useState<CustomerData | null>(null);
  const [tickets, setTickets] = useState<TicketData[]>([]);
  const [loading, setLoading] = useState(true);
  const [planHistory] = useState<PlanHistory[]>([
    {
      id: '1',
      plan: 'Basic',
      start_date: '2024-01-15',
      end_date: '2024-06-15',
      price: 199.99,
      reason: 'İlk kayıt',
      is_current: false
    },
    {
      id: '2',
      plan: 'Pro',
      start_date: '2024-06-15',
      end_date: '2024-12-15',
      price: 399.99,
      reason: 'Özellik ihtiyacı',
      is_current: false
    },
    {
      id: '3',
      plan: 'Premium',
      start_date: '2024-12-15',
      end_date: undefined,
      price: 699.99,
      reason: 'Ekip büyümesi',
      is_current: true
    }
  ]);

  const [documents] = useState<Document[]>([
    {
      id: '1',
      name: 'Hizmet Sözleşmesi 2024.pdf',
      type: 'PDF',
      size: '2.4 MB',
      uploaded_date: '2024-01-15',
      category: 'Sözleşme',
      url: '#'
    },
    {
      id: '2',
      name: 'Fatura_INV-2024-001.pdf',
      type: 'PDF',
      size: '156 KB',
      uploaded_date: '2024-12-01',
      category: 'Fatura',
      url: '#'
    },
    {
      id: '3',
      name: 'Teknik_Dokümantasyon.docx',
      type: 'DOCX',
      size: '890 KB',
      uploaded_date: '2024-11-20',
      category: 'Dokümantasyon',
      url: '#'
    }
  ]);

  const [reminders] = useState<Reminder[]>([
    {
      id: '1',
      title: 'Sözleşme Yenileme',
      description: 'Premium plan sözleşmesi 30 gün içinde yenilenecek',
      type: 'warning',
      priority: 'high',
      due_date: '2025-02-15',
      is_completed: false
    },
    {
      id: '2',
      title: 'Son Giriş Kontrolü',
      description: 'Müşteri 15 gündür sisteme giriş yapmadı',
      type: 'info',
      priority: 'medium',
      due_date: '2025-01-25',
      is_completed: false
    },
    {
      id: '3',
      title: 'Ödeme Hatırlatması',
      description: 'Gelecek ay fatura ödemesi yaklaşıyor',
      type: 'info',
      priority: 'low',
      due_date: '2025-02-01',
      is_completed: false
    }
  ]);

  const [contacts] = useState<Contact[]>([
    {
      id: '1',
      name: 'Ahmet Yılmaz',
      role: 'Genel Müdür',
      email: 'ahmet@abcfirma.com',
      phone: '+90 555 123 4567',
      department: 'Yönetim',
      is_primary: true
    },
    {
      id: '2',
      name: 'Fatma Kaya',
      role: 'IT Sorumlusu',
      email: 'fatma@abcfirma.com',
      phone: '+90 555 234 5678',
      department: 'Bilgi İşlem',
      is_primary: false
    },
    {
      id: '3',
      name: 'Can Demir',
      role: 'Satın Alma Uzmanı',
      email: 'can@abcfirma.com',
      department: 'Satın Alma',
      is_primary: false
    }
  ]);

  const [recommendations] = useState<Recommendation[]>([
    {
      id: '1',
      title: 'API Entegrasyonu Paketi',
      description: 'Mevcut sistemlerinizle entegrasyon için özel API paketi',
      type: 'addon',
      potential_value: '₺200/ay tasarruf',
      priority: 'high'
    },
    {
      id: '2',
      title: 'Enterprise Plan Yükseltmesi',
      description: 'Gelişmiş analitik ve raporlama özellikleri',
      type: 'upgrade',
      potential_value: '%40 daha fazla verimlilik',
      priority: 'medium'
    },
    {
      id: '3',
      title: 'Otomatik Yedekleme',
      description: 'Verileriniz için günlük otomatik yedekleme hizmeti',
      type: 'feature',
      potential_value: 'Veri güvenliği',
      priority: 'medium'
    }
  ]);

  const [featureUsage] = useState<FeatureUsage[]>([
    {
      feature: 'Proje Yönetimi',
      usage_percentage: 85,
      total_available: 100,
      used: 85,
      trend: 'up'
    },
    {
      feature: 'Raporlama',
      usage_percentage: 65,
      total_available: 50,
      used: 32,
      trend: 'stable'
    },
    {
      feature: 'API Kullanımı',
      usage_percentage: 45,
      total_available: 1000,
      used: 450,
      trend: 'up'
    },
    {
      feature: 'Depolama',
      usage_percentage: 78,
      total_available: 100,
      used: 78,
      trend: 'up'
    },
    {
      feature: 'Kullanıcı Sayısı',
      usage_percentage: 60,
      total_available: 25,
      used: 15,
      trend: 'stable'
    }
  ]);

  // Müşteri verilerini Supabase'den getir
  const fetchCustomerData = async () => {
    try {
      setLoading(true);
      
      // Müşteri bilgilerini getir
      const { data: customer, error: customerError } = await supabase
        .from('customers')
        .select('*')
        .eq('id', customerId)
        .single();

      if (customerError) {
        console.error('Customer fetch error:', customerError);
        toast.error('Müşteri bilgileri alınamadı');
        return;
      }

      setCustomerData(customer);

      // Müşterinin taleplerini getir
      const { data: customerTickets, error: ticketsError } = await supabase
        .from('tickets')
        .select(`
          *,
          agents!tickets_agent_id_fkey (name, email)
        `)
        .eq('customer_id', customerId)
        .order('created_at', { ascending: false });

      if (ticketsError) {
        console.error('Tickets fetch error:', ticketsError);
        toast.error('Talep bilgileri alınamadı');
      } else {
        setTickets(customerTickets || []);
      }

    } catch (error) {
      console.error('Error fetching customer data:', error);
      toast.error('Veri yüklenirken hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (customerId) {
      fetchCustomerData();
    }
  }, [customerId]);

  // Müşteri bulunamazsa fallback
  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        <span className="ml-3 text-gray-500">Müşteri bilgileri yükleniyor...</span>
      </div>
    );
  }

  if (!customerData) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Müşteri Bulunamadı</h3>
        <p className="text-gray-600 dark:text-gray-400 mb-4">Bu müşteri ID'si ile kayıt bulunamadı.</p>
        <button
          onClick={onBack}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg"
        >
          Müşteriler Listesine Dön
        </button>
      </div>
    );
  }

  // Talep kategorileri dağılımı
  const ticketCategories = tickets.reduce((acc, ticket) => {
    acc[ticket.category] = (acc[ticket.category] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const ticketCategoryData = Object.entries(ticketCategories).map(([category, count], index) => ({
    name: category,
    value: count,
    color: ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'][index % 5]
  }));

  // Talep durumları
  const resolvedTickets = tickets.filter(t => t.status === 'resolved').length;
  const pendingTickets = tickets.filter(t => t.status === 'open' || t.status === 'in_progress').length;
  const resolutionRate = tickets.length > 0 ? Math.round((resolvedTickets / tickets.length) * 100) : 0;

  // Müşteri kayıt tarihinden bu yana geçen ay sayısı
  const subscriptionMonths = Math.floor(
    (new Date().getTime() - new Date(customerData.created_at).getTime()) / (1000 * 60 * 60 * 24 * 30)
  );

  // Destek veren temsilciler
  const supportAgents = tickets
    .filter(t => t.agents?.name)
    .reduce((acc, ticket) => {
      const agentName = ticket.agents!.name;
      if (!acc[agentName]) {
        acc[agentName] = {
          name: agentName,
          email: ticket.agents!.email,
          tickets_handled: 0,
          avatar: agentName.split(' ').map(n => n[0]).join('')
        };
      }
      acc[agentName].tickets_handled++;
      return acc;
    }, {} as Record<string, any>);

  const supportAgentsList = Object.values(supportAgents);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active': return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'inactive': return <XCircle className="w-4 h-4 text-gray-500" />;
      case 'suspended': return <AlertCircle className="w-4 h-4 text-red-500" />;
      default: return <CheckCircle className="w-4 h-4 text-green-500" />;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'active': return 'Aktif';
      case 'inactive': return 'Pasif';
      case 'suspended': return 'Askıya Alınmış';
      default: return 'Aktif';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400';
      case 'inactive': return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400';
      case 'suspended': return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400';
      default: return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400';
    }
  };

  const getTicketStatusIcon = (status: string) => {
    switch (status) {
      case 'resolved': return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'in_progress': return <Clock className="w-4 h-4 text-yellow-500" />;
      case 'open': return <AlertCircle className="w-4 h-4 text-red-500" />;
      case 'closed': return <XCircle className="w-4 h-4 text-gray-500" />;
      default: return <AlertCircle className="w-4 h-4 text-gray-400" />;
    }
  };

  const getTicketStatusText = (status: string) => {
    switch (status) {
      case 'resolved': return 'Çözüldü';
      case 'in_progress': return 'İşlemde';
      case 'open': return 'Açık';
      case 'closed': return 'Kapalı';
      default: return 'Bilinmeyen';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400';
      case 'medium': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400';
      case 'low': return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400';
    }
  };

  const getPriorityText = (priority: string) => {
    switch (priority) {
      case 'high': return 'Yüksek';
      case 'medium': return 'Orta';
      case 'low': return 'Düşük';
      default: return 'Normal';
    }
  };

  const tabs = [
    { id: 'overview', name: 'Genel Bakış', icon: User },
    { id: 'tickets', name: 'Talepler', icon: MessageSquare },
    { id: 'subscription', name: 'Abonelik Geçmişi', icon: CalendarIcon },
    { id: 'documents', name: 'Dosyalar', icon: FileText },
    { id: 'reminders', name: 'Hatırlatıcılar', icon: AlertTriangle },
    { id: 'contacts', name: 'İlgili Kişiler', icon: UsersIcon },
    { id: 'recommendations', name: 'Öneriler', icon: Lightbulb },
    { id: 'usage', name: 'Özellik Kullanımı', icon: BarChart3 },
    { id: 'activity', name: 'Aktivite', icon: Activity },
    { id: 'support-team', name: 'Destek Ekibi', icon: Users },
    { id: 'billing', name: 'Faturalandırma', icon: CreditCard }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={onBack}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            ← Geri
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Müşteri Profili</h1>
            <p className="text-gray-600 dark:text-gray-400">{customerData.name}</p>
          </div>
        </div>
      </div>

      {/* Customer Info Card */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-4">
            {customerData.avatar_url ? (
              <img
                src={customerData.avatar_url}
                alt={customerData.name}
                className="w-16 h-16 rounded-full object-cover"
              />
            ) : (
              <div className="w-16 h-16 bg-blue-500 rounded-full flex items-center justify-center text-white text-xl font-bold">
                {customerData.name.charAt(0)}
              </div>
            )}
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                {customerData.name}
              </h2>
              <p className="text-gray-600 dark:text-gray-400">{customerData.company || 'Şirket belirtilmemiş'}</p>
              <div className="flex items-center mt-2">
                {getStatusIcon('active')}
                <span className={`ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor('active')}`}>
                  {getStatusText('active')}
                </span>
              </div>
            </div>
          </div>
          <div className="text-right">
            <div className="flex items-center text-yellow-400 mb-1">
              <Star className="w-4 h-4 fill-current mr-1" />
              <span className="font-semibold">{customerData.satisfaction_score}/5</span>
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400">Memnuniyet Puanı</p>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
          <div className="text-center">
            <div className="flex items-center justify-center mb-2">
              <Mail className="w-4 h-4 text-gray-400 mr-2" />
              <span className="text-sm text-gray-600 dark:text-gray-400">E-posta</span>
            </div>
            <p className="text-sm font-medium text-gray-900 dark:text-white break-all">{customerData.email}</p>
          </div>
          <div className="text-center">
            <div className="flex items-center justify-center mb-2">
              <Phone className="w-4 h-4 text-gray-400 mr-2" />
              <span className="text-sm text-gray-600 dark:text-gray-400">Telefon</span>
            </div>
            <p className="text-sm font-medium text-gray-900 dark:text-white">{customerData.phone || 'Belirtilmemiş'}</p>
          </div>
          <div className="text-center">
            <div className="flex items-center justify-center mb-2">
              <Calendar className="w-4 h-4 text-gray-400 mr-2" />
              <span className="text-sm text-gray-600 dark:text-gray-400">Kayıt Tarihi</span>
            </div>
            <p className="text-sm font-medium text-gray-900 dark:text-white">
              {format(new Date(customerData.created_at), 'dd MMM yyyy', { locale: tr })}
            </p>
          </div>
          <div className="text-center">
            <div className="flex items-center justify-center mb-2">
              <Target className="w-4 h-4 text-gray-400 mr-2" />
              <span className="text-sm text-gray-600 dark:text-gray-400">Plan</span>
            </div>
            <p className="text-sm font-medium text-blue-600 dark:text-blue-400">{customerData.plan}</p>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Toplam Talepler</p>
              <p className="text-xl lg:text-2xl font-bold text-blue-600 mt-2">{customerData.total_tickets}</p>
            </div>
            <div className="bg-blue-100 dark:bg-blue-900/20 p-2 lg:p-3 rounded-lg flex-shrink-0">
              <MessageSquare className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Çözülen Talepler</p>
              <p className="text-xl lg:text-2xl font-bold text-green-600 mt-2">{resolvedTickets}</p>
            </div>
            <div className="bg-green-100 dark:bg-green-900/20 p-2 lg:p-3 rounded-lg flex-shrink-0">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Çözüm Oranı</p>
              <p className="text-xl lg:text-2xl font-bold text-purple-600 mt-2">{resolutionRate}%</p>
            </div>
            <div className="bg-purple-100 dark:bg-purple-900/20 p-2 lg:p-3 rounded-lg flex-shrink-0">
              <TrendingUp className="w-6 h-6 text-purple-600" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Müşteri Süresi</p>
              <p className="text-xl lg:text-2xl font-bold text-orange-600 mt-2">{subscriptionMonths} ay</p>
            </div>
            <div className="bg-orange-100 dark:bg-orange-900/20 p-2 lg:p-3 rounded-lg flex-shrink-0">
              <Clock className="w-6 h-6 text-orange-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="border-b border-gray-200 dark:border-gray-700">
          <nav className="flex space-x-8 px-6">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center py-4 px-1 border-b-2 font-medium text-sm ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                      : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
                  }`}
                >
                  <Icon className="w-4 h-4 mr-2" />
                  {tab.name}
                </button>
              );
            })}
          </nav>
        </div>

        <div className="p-6">
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Customer Summary */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                    Müşteri Özeti
                  </h3>
                  <div className="space-y-4">
                    <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                      <h4 className="font-medium text-gray-900 dark:text-white mb-2">Kayıt Tarihi</h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {format(new Date(customerData.created_at), 'dd MMMM yyyy', { locale: tr })}
                      </p>
                    </div>
                    <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                      <h4 className="font-medium text-gray-900 dark:text-white mb-2">Müşteri Süresi</h4>
                      <p className="text-lg font-bold text-blue-600">{subscriptionMonths} ay</p>
                    </div>
                    <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                      <h4 className="font-medium text-gray-900 dark:text-white mb-2">Aktif Plan</h4>
                      <p className="text-lg font-bold text-green-600">{customerData.plan}</p>
                    </div>
                  </div>
                </div>

                {/* Ticket Categories Chart */}
                {ticketCategoryData.length > 0 && (
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                      Talep Kategorileri
                    </h3>
                    <ResponsiveContainer width="100%" height={250}>
                      <PieChart>
                        <Pie
                          data={ticketCategoryData}
                          cx="50%"
                          cy="50%"
                          outerRadius={80}
                          dataKey="value"
                          label={({ name, value }) => `${name}: ${value}`}
                        >
                          {ticketCategoryData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'tickets' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Destek Talepleri</h3>
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  Toplam {tickets.length} talep
                </div>
              </div>
              {tickets.length === 0 ? (
                <div className="text-center py-8">
                  <MessageSquare className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500 dark:text-gray-400">Bu müşterinin henüz talebi bulunmuyor.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {tickets.map((ticket) => (
                    <div key={ticket.id} className="border border-gray-200 dark:border-gray-600 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center">
                          {getTicketStatusIcon(ticket.status)}
                          <div className="ml-3">
                            <h4 className="font-medium text-gray-900 dark:text-white">{ticket.title}</h4>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                              {format(new Date(ticket.created_at), 'dd MMM yyyy', { locale: tr })}
                              {ticket.agents?.name && ` • ${ticket.agents.name}`}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className={`px-2 py-1 rounded text-xs font-medium ${getPriorityColor(ticket.priority)}`}>
                            {getPriorityText(ticket.priority)}
                          </span>
                          <span className="px-2 py-1 rounded text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300">
                            {ticket.category}
                          </span>
                        </div>
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        <p className="mb-2">{ticket.description}</p>
                        <div className="flex items-center justify-between">
                          <span>
                            Durum: <span className="font-medium">{getTicketStatusText(ticket.status)}</span>
                          </span>
                          {ticket.resolved_at && (
                            <span className="text-green-600">
                              Çözüm: {format(new Date(ticket.resolved_at), 'dd MMM yyyy', { locale: tr })}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'subscription' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Abonelik Geçmişi</h3>
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  Toplam {planHistory.length} plan değişikliği
                </div>
              </div>
              
              <div className="space-y-4">
                {planHistory.map((plan, index) => (
                  <div key={plan.id} className="border border-gray-200 dark:border-gray-600 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center">
                        <div className={`w-3 h-3 rounded-full mr-3 ${plan.is_current ? 'bg-green-500' : 'bg-gray-400'}`}></div>
                        <div>
                          <h4 className="font-semibold text-gray-900 dark:text-white">{plan.plan} Plan</h4>
                          <p className="text-sm text-gray-500 dark:text-gray-400">{plan.reason}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-lg text-gray-900 dark:text-white">₺{plan.price.toLocaleString()}</p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">aylık</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center text-gray-600 dark:text-gray-400">
                        <CalendarIcon className="w-4 h-4 mr-2" />
                        <span>
                          {format(new Date(plan.start_date), 'dd MMM yyyy', { locale: tr })}
                          {plan.end_date && ` - ${format(new Date(plan.end_date), 'dd MMM yyyy', { locale: tr })}`}
                          {plan.is_current && ' - Devam Ediyor'}
                        </span>
                      </div>
                      {plan.is_current && (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400">
                          Aktif Plan
                        </span>
                      )}
                    </div>
                    
                    {plan.is_current && (
                      <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-600">
                        <div className="text-sm text-gray-600 dark:text-gray-400">
                          Plan Süresi: {Math.floor((new Date().getTime() - new Date(plan.start_date).getTime()) / (1000 * 60 * 60 * 24))} gün
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'documents' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Sözleşme ve Dosya Yönetimi</h3>
                <button className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium">
                  <Upload className="w-4 h-4 mr-2" />
                  Dosya Yükle
                </button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {documents.map((doc) => (
                  <div key={doc.id} className="border border-gray-200 dark:border-gray-600 rounded-lg p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center">
                        <div className="bg-blue-100 dark:bg-blue-900/20 p-2 rounded-lg mr-3">
                          <FileText className="w-5 h-5 text-blue-600" />
                        </div>
                        <div>
                          <h4 className="font-medium text-gray-900 dark:text-white text-sm">{doc.name}</h4>
                          <p className="text-xs text-gray-500 dark:text-gray-400">{doc.size} • {doc.type}</p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-gray-500 dark:text-gray-400">Kategori:</span>
                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                          doc.category === 'Sözleşme' ? 'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400' :
                          doc.category === 'Fatura' ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400' :
                          'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400'
                        }`}>
                          {doc.category}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-gray-500 dark:text-gray-400">Yüklenme:</span>
                        <span className="text-gray-900 dark:text-white">
                          {format(new Date(doc.uploaded_date), 'dd MMM yyyy', { locale: tr })}
                        </span>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2 mt-4">
                      <button className="flex-1 inline-flex items-center justify-center px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs font-medium">
                        <Download className="w-3 h-3 mr-1" />
                        İndir
                      </button>
                      <button className="flex-1 inline-flex items-center justify-center px-3 py-1 border border-gray-300 dark:border-gray-600 rounded text-xs font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700">
                        Görüntüle
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'reminders' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Otomatik Takip ve Hatırlatıcılar</h3>
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  {reminders.filter(r => !r.is_completed).length} aktif hatırlatıcı
                </div>
              </div>
              
              <div className="space-y-4">
                {reminders.map((reminder) => (
                  <div key={reminder.id} className={`border rounded-lg p-4 ${
                    reminder.type === 'warning' ? 'border-orange-200 bg-orange-50 dark:border-orange-800 dark:bg-orange-900/10' :
                    reminder.type === 'info' ? 'border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-900/10' :
                    'border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-900/10'
                  }`}>
                    <div className="flex items-start justify-between">
                      <div className="flex items-start">
                        <div className={`p-2 rounded-lg mr-3 ${
                          reminder.type === 'warning' ? 'bg-orange-100 dark:bg-orange-900/20' :
                          reminder.type === 'info' ? 'bg-blue-100 dark:bg-blue-900/20' :
                          'bg-green-100 dark:bg-green-900/20'
                        }`}>
                          {reminder.type === 'warning' ? (
                            <AlertTriangle className={`w-5 h-5 ${
                              reminder.type === 'warning' ? 'text-orange-600' :
                              reminder.type === 'info' ? 'text-blue-600' :
                              'text-green-600'
                            }`} />
                          ) : (
                            <ClockIcon className={`w-5 h-5 ${
                              reminder.type === 'warning' ? 'text-orange-600' :
                              reminder.type === 'info' ? 'text-blue-600' :
                              'text-green-600'
                            }`} />
                          )}
                        </div>
                        <div>
                          <h4 className="font-semibold text-gray-900 dark:text-white">{reminder.title}</h4>
                          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{reminder.description}</p>
                          <div className="flex items-center mt-2 space-x-4">
                            <div className="flex items-center text-xs text-gray-500 dark:text-gray-400">
                              <CalendarIcon className="w-3 h-3 mr-1" />
                              {format(new Date(reminder.due_date), 'dd MMM yyyy', { locale: tr })}
                            </div>
                            <span className={`px-2 py-1 rounded text-xs font-medium ${
                              reminder.priority === 'high' ? 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400' :
                              reminder.priority === 'medium' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400' :
                              'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
                            }`}>
                              {reminder.priority === 'high' ? 'Yüksek' : reminder.priority === 'medium' ? 'Orta' : 'Düşük'} Öncelik
                            </span>
                          </div>
                        </div>
                      </div>
                      <button className="inline-flex items-center px-3 py-1 bg-gray-600 hover:bg-gray-700 text-white rounded text-xs font-medium">
                        Tamamla
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'contacts' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">İlgili Kişiler</h3>
                <button className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium">
                  <UsersIcon className="w-4 h-4 mr-2" />
                  Kişi Ekle
                </button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {contacts.map((contact) => (
                  <div key={contact.id} className="border border-gray-200 dark:border-gray-600 rounded-lg p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center">
                        <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center text-white font-semibold">
                          {contact.name.split(' ').map(n => n[0]).join('')}
                        </div>
                        <div className="ml-3">
                          <h4 className="font-semibold text-gray-900 dark:text-white">{contact.name}</h4>
                          <p className="text-sm text-gray-600 dark:text-gray-400">{contact.role}</p>
                          {contact.is_primary && (
                            <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400 mt-1">
                              Ana İletişim
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex items-center text-sm">
                        <Mail className="w-4 h-4 text-gray-400 mr-2" />
                        <span className="text-gray-900 dark:text-white">{contact.email}</span>
                      </div>
                      {contact.phone && (
                        <div className="flex items-center text-sm">
                          <Phone className="w-4 h-4 text-gray-400 mr-2" />
                          <span className="text-gray-900 dark:text-white">{contact.phone}</span>
                        </div>
                      )}
                      <div className="flex items-center text-sm">
                        <Building className="w-4 h-4 text-gray-400 mr-2" />
                        <span className="text-gray-600 dark:text-gray-400">{contact.department}</span>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2 mt-4">
                      <button className="flex-1 inline-flex items-center justify-center px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs font-medium">
                        <Mail className="w-3 h-3 mr-1" />
                        E-posta
                      </button>
                      <button className="flex-1 inline-flex items-center justify-center px-3 py-1 border border-gray-300 dark:border-gray-600 rounded text-xs font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700">
                        <Phone className="w-3 h-3 mr-1" />
                        Ara
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'recommendations' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Ürün/Hizmet Önerileri</h3>
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  {recommendations.length} öneri mevcut
                </div>
              </div>
              
              <div className="space-y-4">
                {recommendations.map((rec) => (
                  <div key={rec.id} className="border border-gray-200 dark:border-gray-600 rounded-lg p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-start">
                        <div className={`p-2 rounded-lg mr-3 ${
                          rec.type === 'upgrade' ? 'bg-purple-100 dark:bg-purple-900/20' :
                          rec.type === 'addon' ? 'bg-blue-100 dark:bg-blue-900/20' :
                          'bg-green-100 dark:bg-green-900/20'
                        }`}>
                          {rec.type === 'upgrade' ? (
                            <TrendingUpIcon className={`w-5 h-5 ${
                              rec.type === 'upgrade' ? 'text-purple-600' :
                              rec.type === 'addon' ? 'text-blue-600' :
                              'text-green-600'
                            }`} />
                          ) : rec.type === 'addon' ? (
                            <Package className={`w-5 h-5 ${
                              rec.type === 'upgrade' ? 'text-purple-600' :
                              rec.type === 'addon' ? 'text-blue-600' :
                              'text-green-600'
                            }`} />
                          ) : (
                            <Zap className={`w-5 h-5 ${
                              rec.type === 'upgrade' ? 'text-purple-600' :
                              rec.type === 'addon' ? 'text-blue-600' :
                              'text-green-600'
                            }`} />
                          )}
                        </div>
                        <div>
                          <h4 className="font-semibold text-gray-900 dark:text-white">{rec.title}</h4>
                          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{rec.description}</p>
                          <div className="flex items-center mt-2 space-x-4">
                            <div className="flex items-center text-sm text-green-600 dark:text-green-400">
                              <TrendingUpIcon className="w-4 h-4 mr-1" />
                              {rec.potential_value}
                            </div>
                            <span className={`px-2 py-1 rounded text-xs font-medium ${
                              rec.priority === 'high' ? 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400' :
                              rec.priority === 'medium' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400' :
                              'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
                            }`}>
                              {rec.priority === 'high' ? 'Yüksek' : rec.priority === 'medium' ? 'Orta' : 'Düşük'} Öncelik
                            </span>
                            <span className={`px-2 py-1 rounded text-xs font-medium ${
                              rec.type === 'upgrade' ? 'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400' :
                              rec.type === 'addon' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400' :
                              'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
                            }`}>
                              {rec.type === 'upgrade' ? 'Plan Yükseltme' : rec.type === 'addon' ? 'Ek Paket' : 'Özellik'}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button className="inline-flex items-center px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs font-medium">
                          Detay
                        </button>
                        <button className="inline-flex items-center px-3 py-1 bg-green-600 hover:bg-green-700 text-white rounded text-xs font-medium">
                          Öner
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'usage' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Anahtar Özellik Kullanım Düzeyi</h3>
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  Ortalama kullanım: %{Math.round(featureUsage.reduce((sum, f) => sum + f.usage_percentage, 0) / featureUsage.length)}
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {featureUsage.map((feature, index) => (
                  <div key={index} className="border border-gray-200 dark:border-gray-600 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-semibold text-gray-900 dark:text-white">{feature.feature}</h4>
                      <div className="flex items-center">
                        <span className="text-lg font-bold text-gray-900 dark:text-white mr-2">
                          {feature.usage_percentage}%
                        </span>
                        {feature.trend === 'up' ? (
                          <TrendingUpIcon className="w-4 h-4 text-green-500" />
                        ) : feature.trend === 'down' ? (
                          <TrendingDown className="w-4 h-4 text-red-500" />
                        ) : (
                          <div className="w-4 h-4 bg-gray-400 rounded-full"></div>
                        )}
                      </div>
                    </div>
                    
                    <div className="mb-3">
                      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
                        <div 
                          className={`h-3 rounded-full ${
                            feature.usage_percentage >= 80 ? 'bg-green-500' :
                            feature.usage_percentage >= 60 ? 'bg-yellow-500' :
                            feature.usage_percentage >= 40 ? 'bg-orange-500' :
                            'bg-red-500'
                          }`}
                          style={{ width: `${feature.usage_percentage}%` }}
                        ></div>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400">
                      <span>Kullanılan: {feature.used}</span>
                      <span>Toplam: {feature.total_available}</span>
                    </div>
                    
                    <div className="mt-3">
                      {feature.usage_percentage >= 80 && (
                        <div className="flex items-center text-xs text-orange-600 dark:text-orange-400">
                          <AlertTriangle className="w-3 h-3 mr-1" />
                          Yüksek kullanım - Plan yükseltmesi önerilir
                        </div>
                      )}
                      {feature.usage_percentage < 30 && (
                        <div className="flex items-center text-xs text-blue-600 dark:text-blue-400">
                          <Lightbulb className="w-3 h-3 mr-1" />
                          Düşük kullanım - Eğitim gerekebilir
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'activity' && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Son Aktiviteler</h3>
              <div className="space-y-3">
                <div className="border border-gray-200 dark:border-gray-600 rounded-lg p-4">
                  <div className="flex items-start">
                    <div className="bg-blue-100 dark:bg-blue-900/20 p-2 rounded-full mr-3">
                      <User className="w-4 h-4 text-blue-600" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900 dark:text-white">Müşteri Kaydı Oluşturuldu</h4>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Sisteme yeni müşteri olarak kaydoldu</p>
                      <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                        {format(new Date(customerData.created_at), 'dd MMM yyyy HH:mm', { locale: tr })}
                      </p>
                    </div>
                  </div>
                </div>
                
                {tickets.slice(0, 5).map((ticket) => (
                  <div key={ticket.id} className="border border-gray-200 dark:border-gray-600 rounded-lg p-4">
                    <div className="flex items-start">
                      <div className="bg-orange-100 dark:bg-orange-900/20 p-2 rounded-full mr-3">
                        <MessageSquare className="w-4 h-4 text-orange-600" />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-900 dark:text-white">Yeni Talep: {ticket.title}</h4>
                        <p className="text-sm text-gray-500 dark:text-gray-400">{ticket.description}</p>
                        <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                          {format(new Date(ticket.created_at), 'dd MMM yyyy HH:mm', { locale: tr })}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'support-team' && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Bu Müşteriye Destek Veren Ekip</h3>
              {supportAgentsList.length === 0 ? (
                <div className="text-center py-8">
                  <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500 dark:text-gray-400">Bu müşteriye henüz destek veren temsilci bulunmuyor.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {supportAgentsList.map((agent, index) => (
                    <div key={index} className="border border-gray-200 dark:border-gray-600 rounded-lg p-4">
                      <div className="flex items-center mb-3">
                        <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center text-white font-semibold">
                          {agent.avatar}
                        </div>
                        <div className="ml-3">
                          <h4 className="font-medium text-gray-900 dark:text-white">{agent.name}</h4>
                          <p className="text-sm text-gray-500 dark:text-gray-400">Destek Temsilcisi</p>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600 dark:text-gray-400">Bu Müşteri İçin:</span>
                          <span className="text-sm font-medium text-gray-900 dark:text-white">{agent.tickets_handled} talep</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600 dark:text-gray-400">E-posta:</span>
                          <span className="text-sm font-medium text-gray-900 dark:text-white">{agent.email}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'billing' && (
            <div className="space-y-6">
              {/* Faturalandırma İstatistikleri */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-green-50 dark:bg-green-900/10 rounded-xl p-4 border border-green-200 dark:border-green-800">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-green-600 dark:text-green-400">Toplam Ödenen</p>
                      <p className="text-xl font-bold text-green-700 dark:text-green-300 mt-1">
                        ₺{bills.filter(b => b.status === 'paid').reduce((sum, b) => sum + b.amount, 0).toLocaleString()}
                      </p>
                    </div>
                    <div className="bg-green-100 dark:bg-green-900/20 p-2 rounded-lg">
                      <CheckCircle className="w-5 h-5 text-green-600" />
                    </div>
                  </div>
                </div>

                <div className="bg-yellow-50 dark:bg-yellow-900/10 rounded-xl p-4 border border-yellow-200 dark:border-yellow-800">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-yellow-600 dark:text-yellow-400">Bekleyen</p>
                      <p className="text-xl font-bold text-yellow-700 dark:text-yellow-300 mt-1">
                        ₺{bills.filter(b => b.status === 'pending').reduce((sum, b) => sum + b.amount, 0).toLocaleString()}
                      </p>
                    </div>
                    <div className="bg-yellow-100 dark:bg-yellow-900/20 p-2 rounded-lg">
                      <Clock className="w-5 h-5 text-yellow-600" />
                    </div>
                  </div>
                </div>

                <div className="bg-red-50 dark:bg-red-900/10 rounded-xl p-4 border border-red-200 dark:border-red-800">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-red-600 dark:text-red-400">Gecikmiş</p>
                      <p className="text-xl font-bold text-red-700 dark:text-red-300 mt-1">
                        ₺{bills.filter(b => b.status === 'overdue').reduce((sum, b) => sum + b.amount, 0).toLocaleString()}
                      </p>
                    </div>
                    <div className="bg-red-100 dark:bg-red-900/20 p-2 rounded-lg">
                      <XCircle className="w-5 h-5 text-red-600" />
                    </div>
                  </div>
                </div>

                <div className="bg-blue-50 dark:bg-blue-900/10 rounded-xl p-4 border border-blue-200 dark:border-blue-800">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-blue-600 dark:text-blue-400">Aylık Ortalama</p>
                      <p className="text-xl font-bold text-blue-700 dark:text-blue-300 mt-1">
                        ₺{Math.round(bills.reduce((sum, b) => sum + b.amount, 0) / 12).toLocaleString()}
                      </p>
                    </div>
                    <div className="bg-blue-100 dark:bg-blue-900/20 p-2 rounded-lg">
                      <DollarSign className="w-5 h-5 text-blue-600" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Aylık Ödeme Trendi */}
              <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
                <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Aylık Ödeme Trendi</h4>
                <ResponsiveContainer width="100%" height={250}>
                  <LineChart data={monthlyPayments}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip formatter={(value) => [`₺${value}`, 'Ödeme']} />
                    <Line type="monotone" dataKey="amount" stroke="#3b82f6" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              {/* Fatura Geçmişi */}
              <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                  <h4 className="text-lg font-semibold text-gray-900 dark:text-white">Fatura Geçmişi</h4>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 dark:bg-gray-900">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Fatura No
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Açıklama
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Tutar
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Durum
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Vade Tarihi
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Ödeme Tarihi
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          İşlemler
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                      {bills.map((bill) => (
                        <tr key={bill.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                            {bill.invoice_number}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">
                            {bill.description}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900 dark:text-white">
                            ₺{bill.amount.toLocaleString()}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              bill.status === 'paid' ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400' :
                              bill.status === 'pending' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400' :
                              'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
                            }`}>
                              {bill.status === 'paid' ? 'Ödendi' : bill.status === 'pending' ? 'Beklemede' : 'Gecikmiş'}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">
                            {format(new Date(bill.due_date), 'dd MMM yyyy', { locale: tr })}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">
                            {bill.paid_date ? format(new Date(bill.paid_date), 'dd MMM yyyy', { locale: tr }) : '-'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm">
                            <div className="flex items-center gap-2">
                              <button className="inline-flex items-center px-2 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs font-medium">
                                <Download className="w-3 h-3 mr-1" />
                                İndir
                              </button>
                              <button className="inline-flex items-center px-2 py-1 border border-gray-300 dark:border-gray-600 rounded text-xs font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700">
                                <Mail className="w-3 h-3 mr-1" />
                                Gönder
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
          )}
        </div>
      </div>
    </div>
  );
};

export default CustomerProfile;