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
  Target
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

const CustomerProfile: React.FC<CustomerProfileProps> = ({ customerId, onBack }) => {
  const [activeTab, setActiveTab] = useState('overview');
  const [customerData, setCustomerData] = useState<CustomerData | null>(null);
  const [tickets, setTickets] = useState<TicketData[]>([]);
  const [loading, setLoading] = useState(true);

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
        </div>
      </div>
    </div>
  );
};

export default CustomerProfile;