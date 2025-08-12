import React, { useState } from 'react';
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
  Target
} from 'lucide-react';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts';

interface CustomerProfileProps {
  customerId: string;
  onBack: () => void;
}

interface CustomerData {
  id: string;
  name: string;
  email: string;
  phone: string;
  company: string;
  plan: string;
  status: 'active' | 'inactive' | 'suspended';
  created_at: string;
  last_login: string;
  total_spent: number;
  current_balance: number;
  satisfaction_score: number;
  total_tickets: number;
  resolved_tickets: number;
  pending_tickets: number;
  avatar_url?: string;
  subscription_months: number;
  purchase_journey: string[];
  assigned_agents: string[];
}

interface Ticket {
  id: string;
  title: string;
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  priority: 'low' | 'medium' | 'high';
  created_at: string;
  resolved_at?: string;
  agent_name?: string;
  category: string;
}

interface Payment {
  id: string;
  amount: number;
  status: 'paid' | 'pending' | 'failed';
  date: string;
  invoice_number: string;
  plan: string;
}

interface ActivityLog {
  id: string;
  action: string;
  description: string;
  timestamp: string;
  type: 'login' | 'payment' | 'ticket' | 'feature_usage' | 'plan_change';
}

interface SupportAgent {
  id: string;
  name: string;
  avatar: string;
  tickets_handled: number;
  avg_response_time: string;
}

const CustomerProfile: React.FC<CustomerProfileProps> = ({ customerId, onBack }) => {
  const [activeTab, setActiveTab] = useState('overview');

  // Mock data - gerçek uygulamada API'den gelecek
  const customerData: CustomerData = {
    id: customerId,
    name: 'Ahmet Yılmaz',
    email: 'ahmet@example.com',
    phone: '+90 555 123 4567',
    company: 'ABC Teknoloji A.Ş.',
    plan: 'Pro',
    status: 'active',
    created_at: '2024-06-15',
    last_login: '2025-01-10',
    total_spent: 2499.99,
    current_balance: -299.99,
    satisfaction_score: 4.2,
    total_tickets: 12,
    resolved_tickets: 10,
    pending_tickets: 2,
    subscription_months: 7,
    purchase_journey: ['Free Trial', 'Basic Plan', 'Pro Plan'],
    assigned_agents: ['Ayşe Kaya', 'Mehmet Demir', 'Fatma Şahin']
  };

  const tickets: Ticket[] = [
    {
      id: '1',
      title: 'Sistem yavaş çalışıyor',
      status: 'resolved',
      priority: 'high',
      created_at: '2025-01-08',
      resolved_at: '2025-01-09',
      agent_name: 'Ayşe Kaya',
      category: 'Teknik'
    },
    {
      id: '2',
      title: 'Fatura ile ilgili soru',
      status: 'in_progress',
      priority: 'medium',
      created_at: '2025-01-10',
      agent_name: 'Mehmet Demir',
      category: 'Faturalama'
    },
    {
      id: '3',
      title: 'Yeni özellik talebi',
      status: 'open',
      priority: 'low',
      created_at: '2025-01-11',
      category: 'Özellik'
    },
    {
      id: '4',
      title: 'Hesap erişim sorunu',
      status: 'resolved',
      priority: 'high',
      created_at: '2024-12-20',
      resolved_at: '2024-12-20',
      agent_name: 'Fatma Şahin',
      category: 'Hesap'
    },
    {
      id: '5',
      title: 'Entegrasyon desteği',
      status: 'resolved',
      priority: 'medium',
      created_at: '2024-11-15',
      resolved_at: '2024-11-16',
      agent_name: 'Ayşe Kaya',
      category: 'Teknik'
    }
  ];

  const payments: Payment[] = [
    {
      id: '1',
      amount: 299.99,
      status: 'paid',
      date: '2024-12-15',
      invoice_number: 'INV-2024-012',
      plan: 'Pro Plan'
    },
    {
      id: '2',
      amount: 299.99,
      status: 'pending',
      date: '2025-01-15',
      invoice_number: 'INV-2025-001',
      plan: 'Pro Plan'
    },
    {
      id: '3',
      amount: 199.99,
      status: 'paid',
      date: '2024-11-15',
      invoice_number: 'INV-2024-011',
      plan: 'Basic Plan'
    },
    {
      id: '4',
      amount: 199.99,
      status: 'paid',
      date: '2024-10-15',
      invoice_number: 'INV-2024-010',
      plan: 'Basic Plan'
    }
  ];

  const activityLogs: ActivityLog[] = [
    {
      id: '1',
      action: 'Giriş Yaptı',
      description: 'Sisteme başarıyla giriş yaptı',
      timestamp: '2025-01-10T14:30:00Z',
      type: 'login'
    },
    {
      id: '2',
      action: 'Ödeme Yapıldı',
      description: '299.99 TL ödeme gerçekleştirildi',
      timestamp: '2024-12-15T10:15:00Z',
      type: 'payment'
    },
    {
      id: '3',
      action: 'Talep Oluşturuldu',
      description: 'Yeni destek talebi oluşturuldu',
      timestamp: '2025-01-08T16:45:00Z',
      type: 'ticket'
    },
    {
      id: '4',
      action: 'Plan Yükseltildi',
      description: 'Basic\'ten Pro plana yükseltildi',
      timestamp: '2024-09-01T12:00:00Z',
      type: 'plan_change'
    },
    {
      id: '5',
      action: 'Özellik Kullanıldı',
      description: 'Analitik raporları görüntülendi',
      timestamp: '2025-01-09T09:20:00Z',
      type: 'feature_usage'
    }
  ];

  const supportAgents: SupportAgent[] = [
    {
      id: '1',
      name: 'Ayşe Kaya',
      avatar: 'AK',
      tickets_handled: 4,
      avg_response_time: '2.5 saat'
    },
    {
      id: '2',
      name: 'Mehmet Demir',
      avatar: 'MD',
      tickets_handled: 3,
      avg_response_time: '1.8 saat'
    },
    {
      id: '3',
      name: 'Fatma Şahin',
      avatar: 'FŞ',
      tickets_handled: 2,
      avg_response_time: '3.2 saat'
    }
  ];

  // Aylık kullanım verileri
  const usageData = [
    { month: 'Tem', logins: 45, tickets: 2, payments: 1, features_used: 12 },
    { month: 'Ağu', logins: 52, tickets: 1, payments: 1, features_used: 15 },
    { month: 'Eyl', logins: 38, tickets: 3, payments: 1, features_used: 18 },
    { month: 'Eki', logins: 41, tickets: 1, payments: 0, features_used: 14 },
    { month: 'Kas', logins: 35, tickets: 2, payments: 1, features_used: 16 },
    { month: 'Ara', logins: 48, tickets: 3, payments: 1, features_used: 20 }
  ];

  // Talep kategorileri dağılımı
  const ticketCategories = tickets.reduce((acc, ticket) => {
    acc[ticket.category] = (acc[ticket.category] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const ticketCategoryData = Object.entries(ticketCategories).map(([category, count]) => ({
    name: category,
    value: count,
    color: ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'][Math.floor(Math.random() * 5)]
  }));

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active': return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'inactive': return <XCircle className="w-4 h-4 text-gray-500" />;
      case 'suspended': return <AlertCircle className="w-4 h-4 text-red-500" />;
      default: return <AlertCircle className="w-4 h-4 text-gray-400" />;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'active': return 'Aktif';
      case 'inactive': return 'Pasif';
      case 'suspended': return 'Askıya Alınmış';
      default: return 'Bilinmeyen';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400';
      case 'inactive': return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400';
      case 'suspended': return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400';
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

  const getPaymentStatusIcon = (status: string) => {
    switch (status) {
      case 'paid': return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'pending': return <Clock className="w-4 h-4 text-yellow-500" />;
      case 'failed': return <XCircle className="w-4 h-4 text-red-500" />;
      default: return <AlertCircle className="w-4 h-4 text-gray-400" />;
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

  const tabs = [
    { id: 'overview', name: 'Genel Bakış', icon: User },
    { id: 'tickets', name: 'Talepler', icon: MessageSquare },
    { id: 'payments', name: 'Ödemeler', icon: CreditCard },
    { id: 'activity', name: 'Aktivite', icon: Activity },
    { id: 'support-team', name: 'Destek Ekibi', icon: Users }
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
              <p className="text-gray-600 dark:text-gray-400">{customerData.company}</p>
              <div className="flex items-center mt-2">
                {getStatusIcon(customerData.status)}
                <span className={`ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(customerData.status)}`}>
                  {getStatusText(customerData.status)}
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

        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
          <div className="text-center">
            <div className="flex items-center justify-center mb-2">
              <Mail className="w-4 h-4 text-gray-400 mr-2" />
              <span className="text-sm text-gray-600 dark:text-gray-400">E-posta</span>
            </div>
            <p className="text-sm font-medium text-gray-900 dark:text-white">{customerData.email}</p>
          </div>
          <div className="text-center">
            <div className="flex items-center justify-center mb-2">
              <Phone className="w-4 h-4 text-gray-400 mr-2" />
              <span className="text-sm text-gray-600 dark:text-gray-400">Telefon</span>
            </div>
            <p className="text-sm font-medium text-gray-900 dark:text-white">{customerData.phone}</p>
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
              <Clock className="w-4 h-4 text-gray-400 mr-2" />
              <span className="text-sm text-gray-600 dark:text-gray-400">Kullanım Süresi</span>
            </div>
            <p className="text-sm font-medium text-gray-900 dark:text-white">
              {customerData.subscription_months} ay
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
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Toplam Harcama</p>
              <p className="text-xl lg:text-2xl font-bold text-green-600 mt-2 break-all">₺{customerData.total_spent.toLocaleString()}</p>
            </div>
            <div className="bg-green-100 dark:bg-green-900/20 p-2 lg:p-3 rounded-lg flex-shrink-0">
              <DollarSign className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Mevcut Bakiye</p>
              <p className={`text-xl lg:text-2xl font-bold mt-2 break-all ${customerData.current_balance < 0 ? 'text-red-600' : 'text-green-600'}`}>
                ₺{customerData.current_balance.toLocaleString()}
              </p>
            </div>
            <div className={`p-2 lg:p-3 rounded-lg flex-shrink-0 ${customerData.current_balance < 0 ? 'bg-red-100 dark:bg-red-900/20' : 'bg-green-100 dark:bg-green-900/20'}`}>
              <CreditCard className={`w-6 h-6 ${customerData.current_balance < 0 ? 'text-red-600' : 'text-green-600'}`} />
            </div>
          </div>
        </div>

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
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Çözüm Oranı</p>
              <p className="text-xl lg:text-2xl font-bold text-purple-600 mt-2">
                {Math.round((customerData.resolved_tickets / customerData.total_tickets) * 100)}%
              </p>
            </div>
            <div className="bg-purple-100 dark:bg-purple-900/20 p-2 lg:p-3 rounded-lg flex-shrink-0">
              <TrendingUp className="w-6 h-6 text-purple-600" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Satın Alma Aşaması</p>
              <p className="text-xl lg:text-2xl font-bold text-orange-600 mt-2">{customerData.purchase_journey.length} Adım</p>
            </div>
            <div className="bg-orange-100 dark:bg-orange-900/20 p-2 lg:p-3 rounded-lg flex-shrink-0">
              <ShoppingCart className="w-6 h-6 text-orange-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Purchase Journey */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Satın Alma Süreci</h3>
        <div className="flex items-center space-x-4">
          {customerData.purchase_journey.map((step, index) => (
            <div key={index} className="flex items-center">
              <div className="flex items-center">
                <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white text-sm font-bold">
                  {index + 1}
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-900 dark:text-white">{step}</p>
                </div>
              </div>
              {index < customerData.purchase_journey.length - 1 && (
                <div className="w-8 h-0.5 bg-gray-300 dark:bg-gray-600 mx-4"></div>
              )}
            </div>
          ))}
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
              {/* Usage Chart */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Son 6 Aylık Kullanım Trendi
                </h3>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={usageData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Line type="monotone" dataKey="logins" stroke="#3b82f6" name="Giriş Sayısı" />
                    <Line type="monotone" dataKey="tickets" stroke="#ef4444" name="Talep Sayısı" />
                    <Line type="monotone" dataKey="features_used" stroke="#10b981" name="Kullanılan Özellik" />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              {/* Ticket Categories */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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

                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Özet İstatistikler</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                      <h4 className="font-medium text-gray-900 dark:text-white mb-2">Ortalama Yanıt Süresi</h4>
                      <p className="text-2xl font-bold text-blue-600">2.1 saat</p>
                    </div>
                    <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                      <h4 className="font-medium text-gray-900 dark:text-white mb-2">Bekleyen Talepler</h4>
                      <p className="text-2xl font-bold text-orange-600">{customerData.pending_tickets}</p>
                    </div>
                    <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                      <h4 className="font-medium text-gray-900 dark:text-white mb-2">Son Giriş</h4>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        {format(new Date(customerData.last_login), 'dd MMM yyyy', { locale: tr })}
                      </p>
                    </div>
                    <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                      <h4 className="font-medium text-gray-900 dark:text-white mb-2">Aktif Plan</h4>
                      <p className="text-lg font-bold text-green-600">{customerData.plan}</p>
                    </div>
                  </div>
                </div>
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
                            {ticket.agent_name && ` • ${ticket.agent_name}`}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className={`px-2 py-1 rounded text-xs font-medium ${getPriorityColor(ticket.priority)}`}>
                          {ticket.priority === 'high' ? 'Yüksek' : ticket.priority === 'medium' ? 'Orta' : 'Düşük'}
                        </span>
                        <span className="px-2 py-1 rounded text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300">
                          {ticket.category}
                        </span>
                      </div>
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      Durum: <span className="font-medium">
                        {ticket.status === 'open' ? 'Açık' : 
                         ticket.status === 'in_progress' ? 'İşlemde' :
                         ticket.status === 'resolved' ? 'Çözüldü' : 'Kapalı'}
                      </span>
                      {ticket.resolved_at && (
                        <span className="ml-4">
                          Çözüm Tarihi: {format(new Date(ticket.resolved_at), 'dd MMM yyyy', { locale: tr })}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'payments' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Ödeme Geçmişi</h3>
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  Toplam {payments.length} ödeme
                </div>
              </div>
              <div className="space-y-3">
                {payments.map((payment) => (
                  <div key={payment.id} className="border border-gray-200 dark:border-gray-600 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        {getPaymentStatusIcon(payment.status)}
                        <div className="ml-3">
                          <h4 className="font-medium text-gray-900 dark:text-white">
                            {payment.invoice_number}
                          </h4>
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            {format(new Date(payment.date), 'dd MMM yyyy', { locale: tr })} • {payment.plan}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-gray-900 dark:text-white">
                          ₺{payment.amount.toLocaleString()}
                        </p>
                        <p className={`text-sm ${
                          payment.status === 'paid' ? 'text-green-600' :
                          payment.status === 'pending' ? 'text-yellow-600' : 'text-red-600'
                        }`}>
                          {payment.status === 'paid' ? 'Ödendi' :
                           payment.status === 'pending' ? 'Beklemede' : 'Başarısız'}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'activity' && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Aktivite Geçmişi</h3>
              <div className="space-y-3">
                {activityLogs.map((log) => (
                  <div key={log.id} className="border border-gray-200 dark:border-gray-600 rounded-lg p-4">
                    <div className="flex items-start">
                      <div className={`p-2 rounded-full mr-3 ${
                        log.type === 'login' ? 'bg-blue-100 dark:bg-blue-900/20' :
                        log.type === 'payment' ? 'bg-green-100 dark:bg-green-900/20' :
                        log.type === 'ticket' ? 'bg-orange-100 dark:bg-orange-900/20' :
                        log.type === 'plan_change' ? 'bg-purple-100 dark:bg-purple-900/20' :
                        'bg-gray-100 dark:bg-gray-900/20'
                      }`}>
                        {log.type === 'login' ? <User className="w-4 h-4 text-blue-600" /> :
                         log.type === 'payment' ? <DollarSign className="w-4 h-4 text-green-600" /> :
                         log.type === 'ticket' ? <MessageSquare className="w-4 h-4 text-orange-600" /> :
                         log.type === 'plan_change' ? <Award className="w-4 h-4 text-purple-600" /> :
                         <Activity className="w-4 h-4 text-gray-600" />}
                      </div>
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-900 dark:text-white">{log.action}</h4>
                        <p className="text-sm text-gray-500 dark:text-gray-400">{log.description}</p>
                        <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                          {format(new Date(log.timestamp), 'dd MMM yyyy HH:mm', { locale: tr })}
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
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Destek Veren Ekip</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {supportAgents.map((agent) => (
                  <div key={agent.id} className="border border-gray-200 dark:border-gray-600 rounded-lg p-4">
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
                        <span className="text-sm text-gray-600 dark:text-gray-400">Çözülen Talepler:</span>
                        <span className="text-sm font-medium text-gray-900 dark:text-white">{agent.tickets_handled}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600 dark:text-gray-400">Ort. Yanıt Süresi:</span>
                        <span className="text-sm font-medium text-gray-900 dark:text-white">{agent.avg_response_time}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CustomerProfile;