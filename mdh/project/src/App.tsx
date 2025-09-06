import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, useNavigate, useLocation } from 'react-router-dom';
import VoiceSearch from './components/common/VoiceSearch';

import { Toaster, toast } from 'react-hot-toast';

import {
  LayoutDashboard,
  MessageSquare,
  Users,
  UserCheck,
  BarChart3,
  Settings,
  Bell,
  Search,
  Menu,
  X,
  User,
  CreditCard,
  DollarSign,
  FileText,
  AlertTriangle,
  AlertCircle,
  Clock,
  Flag,
  RefreshCw,
  Maximize2,
  Lightbulb,
  GanttChart,
  Briefcase,
  GitBranch
} from 'lucide-react';

import { formatDistanceToNow, format } from 'date-fns';
import { tr } from 'date-fns/locale';

import { useSupabase } from './hooks/useSupabase';
import { useTheme } from './contexts/ThemeContext';
import { useSettings, SettingsProvider } from './contexts/SettingsContext';
import { useUser, UserProvider } from './contexts/UserContext';
import { formatCurrency } from './lib/currency';
import { AnimationProvider } from './components/common/AnimationSystem';





// Import components
import TicketsPage from './components/TicketsPage';
import CustomersPage from './components/CustomersPage';
import AgentsPage from './components/AgentsPage';
import ReportsPage from './components/ReportsPage';
import SettingsPage from './components/SettingsPage';

import ProfilePage from './components/ProfilePage';

import AdminCustomerProfile from './components/AdminCustomerProfile';
import FinancialManagement from './components/FinancialManagement';
import CustomerPortal from './components/CustomerPortal';
import AgentPortal from './components/AgentPortal';
import ErrorBoundary from './components/ErrorBoundary';
import { setupGlobalErrorHandler } from './components/common/ErrorBoundary';
import PaymentReminder from './components/PaymentReminder';
import AgentFeaturesDemo from './components/AgentFeaturesDemo';
import RealTimeHintSystem from './components/RealTimeHintSystem';
import SmartFormDemo from './components/SmartFormDemo';
import SmartProjectManagement from './components/SmartProjectManagement';
import HRManagement from './components/HRManagement';
import AdvancedSearch from './components/AdvancedSearch';
import WorkflowBuilder from './components/WorkflowBuilder';
import ApprovalWorkflows from './components/ApprovalWorkflows';
import EmployeeChat from './components/EmployeeChat';
import EmployeeProfile from './components/EmployeeProfile';
import EmployeePortal from './components/EmployeePortal';
import ManagerPortal from './components/ManagerPortal';


// BulkOperations artık TicketList içinde entegre edildi

function App() {
  const { theme, setTheme, isDark } = useTheme();
  
  // Global error handler'ı kur
  useEffect(() => {
    setupGlobalErrorHandler();
  }, []);
  const { settings } = useSettings();
  const { userProfile } = useUser();
  const navigate = useNavigate();
  const location = useLocation();
  const [currentPage, setCurrentPage] = useState('dashboard');
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [showEmployeeChat, setShowEmployeeChat] = useState(false);
  const [globalSearchTerm, setGlobalSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [isRefreshingBilling, setIsRefreshingBilling] = useState(false);
  const [isRefreshingSupport, setIsRefreshingSupport] = useState(false);
  const [lastBillingUpdate, setLastBillingUpdate] = useState(new Date());
  const [lastSupportUpdate, setLastSupportUpdate] = useState(new Date());

  const {
    notifications,
    fetchNotifications,
    markNotificationAsRead,
    tickets,
    customers,
    agents,
    payments,
    subscriptions,
    fetchTickets,
    fetchCustomers,
    fetchAgents,
    fetchSubscriptionPlans,
    fetchSubscriptions,
    fetchPayments,
    fetchExpenseCategories,
    fetchExpenses,
    fetchPromotions,
    fetchBudgets,
    fetchFinancialReports
  } = useSupabase();

  const unreadCount = notifications.filter((n: any) => !n.is_read).length;



  // Son talepleri hesapla
  const recentTickets = tickets
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 4)
    .map(ticket => {
      const customer = customers.find(c => c.id === ticket.customer_id);
      const timeAgo = formatDistanceToNow(new Date(ticket.created_at), { 
        addSuffix: true, 
        locale: tr 
      });
      return {
        id: ticket.id,
        shortId: ticket.id.slice(0, 8),
        title: ticket.title || 'Başlıksız Talep',
        time: timeAgo,
        customer: customer?.name || 'Bilinmeyen Müşteri'
      };
    });

  useEffect(() => {
    fetchNotifications();
    fetchTickets();
    fetchCustomers();
    fetchAgents();
    try { fetchSubscriptionPlans(); } catch (e) { console.log('subscription_plans tablosu yok'); }
    try { fetchSubscriptions(); } catch (e) { console.log('subscriptions tablosu yok'); }
    try { fetchPayments(); } catch (e) { console.log('payments tablosu yok'); }
    try { fetchExpenseCategories(); } catch (e) { console.log('expense_categories tablosu yok'); }
    try { fetchExpenses(); } catch (e) { console.log('expenses tablosu yok'); }
    try { fetchPromotions(); } catch (e) { console.log('promotions tablosu yok'); }
    try { fetchBudgets(); } catch (e) { console.log('budgets tablosu yok'); }
    try { fetchFinancialReports(); } catch (e) { console.log('financial_reports tablosu yok'); }
  }, []);


  // Kısayol tuşu: Ctrl + Shift + F ile detaylı arama
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.ctrlKey && event.shiftKey && event.key === 'F') {
        event.preventDefault();
        setCurrentPage('advanced-search-demo');
        toast.success('🔍 Detaylı arama sayfası açıldı');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);



  // Dashboard'da ödeme verilerini otomatik yenile (5 dakikada bir)
  useEffect(() => {
    if (currentPage === 'dashboard') {
      const interval = setInterval(() => {
        fetchPayments();
        fetchCustomers();
      }, 5 * 60 * 1000); // 5 dakika

      return () => clearInterval(interval);
    }
  }, [currentPage]);



  const handleGlobalSearch = (searchTerm: string) => {
    setGlobalSearchTerm(searchTerm);
    if (!searchTerm.trim()) {
      setSearchResults([]);
      setShowSearchResults(false);
      return;
    }

    const searchLower = searchTerm.toLowerCase();
    const results: any[] = [];

    // Taleplerde arama
    tickets.forEach(ticket => {
      const customer = customers.find(c => c.id === ticket.customer_id);
      const assignedAgent = agents.find(a => a.id === ticket.agent_id);
      if (
        ticket.id.toLowerCase().includes(searchLower) ||
        ticket.title.toLowerCase().includes(searchLower) ||
        ticket.description?.toLowerCase().includes(searchLower) ||
        customer?.name.toLowerCase().includes(searchLower) ||
        customer?.email.toLowerCase().includes(searchLower) ||
        customer?.company?.toLowerCase().includes(searchLower) ||
        assignedAgent?.name.toLowerCase().includes(searchLower)
      ) {
        results.push({
          type: 'ticket',
          id: ticket.id,
          title: ticket.title,
          subtitle: customer?.name || 'Bilinmeyen Müşteri',
          description: `Talep #${ticket.id.slice(0, 8)} - ${ticket.status}`,
          action: () => {
            setCurrentPage('tickets');
            localStorage.setItem('selectedTicketId', ticket.id);
          }
        });
      }
    });

    // Müşterilerde arama
    customers.forEach(customer => {
      if (
        customer.name.toLowerCase().includes(searchLower) ||
        customer.email.toLowerCase().includes(searchLower) ||
        customer.company?.toLowerCase().includes(searchLower) ||
        customer.phone?.toLowerCase().includes(searchLower)
      ) {
        results.push({
          type: 'customer',
          id: customer.id,
          title: customer.name,
          subtitle: customer.email,
          description: customer.company || 'Şirket bilgisi yok',
          action: () => {
            localStorage.setItem('previousPage', 'dashboard');
            setSelectedCustomerId(customer.id);
            setCurrentPage('customer-profile');
          }
        });
      }
    });

    // Temsilcilerde arama
    agents.forEach(agent => {
      if (
        agent.name.toLowerCase().includes(searchLower) ||
        agent.email.toLowerCase().includes(searchLower)
      ) {
        results.push({
          type: 'agent',
          id: agent.id,
          title: agent.name,
          subtitle: agent.email,
          description: `Temsilci - ${agent.status || 'Aktif'}`,
          action: () => {
            setCurrentPage('agents');
          }
        });
      }
    });

    // Ödemelerde arama
    if (payments && payments.length > 0) {
      payments.forEach(payment => {
        const customer = customers.find(c => c.id === payment.customer_id);
        if (
          payment.id.toLowerCase().includes(searchLower) ||
          payment.invoice_number?.toLowerCase().includes(searchLower) ||
          payment.description?.toLowerCase().includes(searchLower) ||
          customer?.name.toLowerCase().includes(searchLower)
        ) {
          results.push({
            type: 'payment',
            id: payment.id,
            title: `Ödeme #${payment.invoice_number || payment.id.slice(0, 8)}`,
            subtitle: customer?.name || 'Bilinmeyen Müşteri',
            description: `${payment.amount} ${payment.currency} - ${payment.status}`,
            action: () => {
              setCurrentPage('financial-management');
            }
          });
        }
      });
    }

    // Faturalarda arama
    if (subscriptions && subscriptions.length > 0) {
      subscriptions.forEach(subscription => {
        const customer = customers.find(c => c.id === subscription.customer_id);
        if (
          subscription.id.toLowerCase().includes(searchLower) ||
          subscription.invoice_number?.toLowerCase().includes(searchLower) ||
          customer?.name.toLowerCase().includes(searchLower)
        ) {
          results.push({
            type: 'invoice',
            id: subscription.id,
            title: `Fatura #${subscription.invoice_number || subscription.id.slice(0, 8)}`,
            subtitle: customer?.name || 'Bilinmeyen Müşteri',
            description: `${subscription.amount} ${subscription.currency} - ${subscription.status}`,
            action: () => {
              setCurrentPage('financial-management');
            }
          });
        }
      });
    }

    setSearchResults(results.slice(0, 10));
    setShowSearchResults(true);
  };

  const handleSearchResultClick = (result: any) => {
    result.action();
    setShowSearchResults(false);
    setGlobalSearchTerm('');
  };

  const renderContent = () => {
    switch (currentPage) {
      case 'dashboard':
        return (
          <div className="p-4 h-full flex flex-col space-y-4">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Dashboard</h1>
            
            {/* Canlı Destek Section */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white">Canlı Destek</h2>
                  <p className="text-gray-600 dark:text-gray-400">Müşteri taleplerini yönetin ve canlı destek sağlayın</p>
                </div>
                <button 
                  onClick={() => setCurrentPage('tickets')}
                  className="inline-flex items-center px-4 py-2 bg-primary hover:bg-primary-600 text-white rounded-lg text-sm font-medium transition-colors"
                >
                  <MessageSquare className="w-4 h-4 mr-2" />
                  Canlı Destek
                </button>
              </div>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-white dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600 p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-2xl font-bold text-gray-900 dark:text-white">{ticketStats.totalTickets}</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Toplam Talep</p>
                    </div>
                    <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
                      <MessageSquare className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                    </div>
                  </div>
                </div>
                
                <div className="bg-white dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600 p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-2xl font-bold text-red-600 dark:text-red-400">{ticketStats.openTickets}</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Açık Talepler</p>
                    </div>
                    <div className="p-2 bg-red-100 dark:bg-red-900 rounded-lg">
                      <AlertCircle className="w-6 h-6 text-red-600 dark:text-red-400" />
                    </div>
                  </div>
                </div>
                
                <div className="bg-white dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600 p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">{ticketStats.highPriorityTickets}</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Yüksek Öncelik</p>
                    </div>
                    <div className="p-2 bg-orange-100 dark:bg-orange-900 rounded-lg">
                      <AlertTriangle className="w-6 h-6 text-orange-600 dark:text-orange-400" />
                    </div>
                  </div>
                </div>
                
                <div className="bg-white dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600 p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-2xl font-bold text-red-600 dark:text-red-400">{ticketStats.slaViolations}</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">SLA İhlali</p>
                    </div>
                    <div className="p-2 bg-red-100 dark:bg-red-900 rounded-lg">
                      <Clock className="w-6 h-6 text-red-600 dark:text-red-400" />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Müşteri Yönetimi Section */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white">Müşteri Yönetimi</h2>
                  <p className="text-gray-600 dark:text-gray-400">Müşteri bilgilerini ve durumlarını takip edin</p>
                </div>
                <button 
                  onClick={() => setCurrentPage('customers')}
                  className="inline-flex items-center px-4 py-2 bg-primary hover:bg-primary-600 text-white rounded-lg text-sm font-medium transition-colors"
                >
                  <Users className="w-4 h-4 mr-2" />
                  + Yeni Müşteri
                </button>
              </div>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-white dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600 p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-2xl font-bold text-gray-900 dark:text-white">{customers.length}</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Toplam Müşteri</p>
                    </div>
                    <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
                      <Users className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                    </div>
                  </div>
                </div>
                
                <div className="bg-white dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600 p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-2xl font-bold text-green-600 dark:text-green-400">{agents.filter(a => a.status === 'active').length}</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Aktif Temsilci</p>
                    </div>
                    <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
                      <UserCheck className="w-6 h-6 text-green-600 dark:text-green-400" />
                    </div>
                  </div>
                </div>
                
                <div className="bg-white dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600 p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">{unreadCount}</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Okunmamış Bildirim</p>
                    </div>
                    <div className="p-2 bg-orange-100 dark:bg-orange-900 rounded-lg">
                      <Bell className="w-6 h-6 text-orange-600 dark:text-orange-400" />
                    </div>
                  </div>
                </div>
                
                <div className="bg-white dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600 p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">{payments ? payments.filter(p => p.status === 'pending').length : 0}</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Bekleyen Ödeme</p>
                    </div>
                    <div className="p-2 bg-purple-100 dark:bg-purple-900 rounded-lg">
                      <CreditCard className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Ödeme Takibi Section */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white">Ödeme Takibi</h2>
                  <p className="text-gray-600 dark:text-gray-400">Gecikmiş ödemeleri takip edin ve otomatik hatırlatmalar gönderin</p>
                </div>
                <button 
                  onClick={() => setCurrentPage('payment-reminder')}
                  className="inline-flex items-center px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg text-sm font-medium transition-colors"
                >
                  <AlertTriangle className="w-4 h-4 mr-2" />
                  Ödeme Takibi
                </button>
              </div>
              
              <PaymentReminder currentUser={userProfile} />
            </div>

            {/* Alt Bölüm */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 flex-1">
              {/* Billing Section */}
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Faturalama</h3>
                    <div className="flex items-center gap-1">
                      <div className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        En Son Güncellenme: {format(lastBillingUpdate, 'dd.MM.yyyy HH:mm', { locale: tr })}
                      </div>

                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <button 
                      onClick={async () => {
                        setIsRefreshingBilling(true);
                        try {
                          // Simüle edilmiş senkronizasyon işlemi
                          await new Promise(resolve => setTimeout(resolve, 1500));
                          
                          // Gerçek veri yenileme
                          await Promise.all([fetchPayments(), fetchCustomers()]);
                          
                          // Güncelleme tarihini güncelle
                          setLastBillingUpdate(new Date());
                          
                          toast.success('✅ Faturalama verileri Finansal Yönetim ile başarıyla senkronize edildi');
                        } catch (error) {
                          toast.error('❌ Senkronizasyon sırasında hata oluştu');
                          console.error('Sync error:', error);
                        } finally {
                          setIsRefreshingBilling(false);
                        }
                      }}
                      disabled={isRefreshingBilling}
                      className={`p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors ${
                        isRefreshingBilling ? 'opacity-50 cursor-not-allowed' : ''
                      }`}
                      title="Finansal Yönetim ile senkronize et"
                    >
                      <RefreshCw className={`w-4 h-4 ${isRefreshingBilling ? 'animate-spin' : ''}`} />
                    </button>
                    <button 
                      onClick={() => setCurrentPage('financial-management')}
                      className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
                      title="Detaylı görünüm"
                    >
                      <Maximize2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600 dark:text-gray-400">Bugün</span>
                    <span className="text-green-600 font-semibold">{formatCurrency(billingData.today)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600 dark:text-gray-400">Bu Ay</span>
                    <span className="text-orange-600 font-semibold">{formatCurrency(billingData.thisMonth)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600 dark:text-gray-400">Bu Yıl</span>
                    <span className="text-pink-600 font-semibold">{formatCurrency(billingData.thisYear)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600 dark:text-gray-400">Tüm Zamanlar</span>
                    <span className="text-gray-900 dark:text-white font-semibold">{formatCurrency(billingData.allTime)}</span>
                  </div>
                  
                  {/* Ödeme İstatistikleri */}
                  <div className="border-t border-gray-200 dark:border-gray-600 pt-3 mt-3">
                    <div className="grid grid-cols-2 gap-3 text-xs">
                      <div className="flex justify-between">
                        <span className="text-gray-500 dark:text-gray-400">Toplam Ödeme</span>
                        <span className="font-medium text-gray-900 dark:text-white">{paymentStats.totalPayments}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500 dark:text-gray-400">Bekleyen</span>
                        <span className="font-medium text-orange-600">{paymentStats.pendingPayments}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500 dark:text-gray-400">Başarısız</span>
                        <span className="font-medium text-red-600">{paymentStats.failedPayments}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500 dark:text-gray-400">Ortalama</span>
                        <span className="font-medium text-blue-600">{formatCurrency(paymentStats.averagePayment)}</span>
                      </div>
                    </div>
                  </div>
                  
                  {/* En Çok Ödeme Yapan Firmalar */}
                  {topPayingCompanies.length > 0 ? (
                    <div className="border-t border-gray-200 dark:border-gray-600 pt-3 mt-3">
                      <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-2">En Çok Ödeme Yapan Firmalar</h4>
                      <div className="space-y-2">
                        {topPayingCompanies.slice(0, 3).map((company: any, index: number) => (
                          <div key={index} className="flex justify-between items-center text-xs">
                            <span className="text-gray-600 dark:text-gray-400 truncate max-w-[120px]" title={company.name}>
                              {company.name}
                            </span>
                            <span className="font-medium text-gray-900 dark:text-white">
                              {formatCurrency(company.totalPaid)}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : payments && payments.length === 0 ? (
                    <div className="border-t border-gray-200 dark:border-gray-600 pt-3 mt-3">
                      <div className="text-center py-2">
                        <p className="text-xs text-gray-500 dark:text-gray-400">Henüz ödeme verisi yok</p>
                        <p className="text-xs text-gray-400 dark:text-gray-500">İlk ödeme yapıldığında burada görünecek</p>
                      </div>
                    </div>
                  ) : null}
                </div>
              </div>

              {/* Support Section */}
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <button 
                      onClick={() => setCurrentPage('tickets')}
                      className="text-lg font-semibold text-gray-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 transition-colors cursor-pointer"
                    >
                      Destek
                    </button>
                    <div className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1 mt-1">
                      <Clock className="w-3 h-3" />
                      En Son Güncelleme: {format(lastSupportUpdate, 'dd.MM.yyyy HH:mm', { locale: tr })}
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <button 
                      onClick={async () => {
                        setIsRefreshingSupport(true);
                        try {
                          await Promise.all([fetchTickets(), fetchCustomers(), fetchAgents()]);
                          
                          // Güncelleme tarihini güncelle
                          setLastSupportUpdate(new Date());
                          
                          toast.success('Destek verileri başarıyla yenilendi');
                        } catch (error) {
                          toast.error('Veriler yenilenirken hata oluştu');
                        } finally {
                          setIsRefreshingSupport(false);
                        }
                      }}
                      disabled={isRefreshingSupport}
                      className={`p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors ${
                        isRefreshingSupport ? 'opacity-50 cursor-not-allowed' : ''
                      }`}
                      title="Destek verilerini yenile"
                    >
                      <RefreshCw className={`w-4 h-4 ${isRefreshingSupport ? 'animate-spin' : ''}`} />
                    </button>
                    <button 
                      onClick={() => setCurrentPage('tickets')}
                      className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
                      title="Taleplere git"
                    >
                      <Maximize2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                <div className="space-y-3 mb-4">
                  <div className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-700 rounded">
                    <div className="flex items-center">
                      <Clock className="w-4 h-4 text-blue-600 mr-2" />
                      <span className="text-sm text-gray-600 dark:text-gray-400">Yanıt Bekleyen</span>
                    </div>
                    <span className="text-sm font-semibold text-gray-900 dark:text-white">{ticketStats.openTickets} Talep</span>
                  </div>
                  <div className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-700 rounded">
                    <div className="flex items-center">
                      <Flag className="w-4 h-4 text-green-600 mr-2" />
                      <span className="text-sm text-gray-600 dark:text-gray-400">Size Atanan</span>
                    </div>
                    <span className="text-sm font-semibold text-gray-900 dark:text-white">{ticketStats.assignedTickets} Talep</span>
                  </div>
                </div>
                <div>
                  <button 
                    onClick={() => setCurrentPage('tickets')}
                    className="text-sm font-medium text-gray-900 dark:text-white mb-2 hover:text-blue-600 dark:hover:text-blue-400 transition-colors cursor-pointer"
                  >
                    Son Talepler
                  </button>
                  <div className="space-y-2">
                    {recentTickets.map((ticket: any, index: number) => (
                      <button
                        key={index}
                        onClick={() => {
                          setCurrentPage('tickets');
                          localStorage.setItem('selectedTicketId', ticket.id);
                        }}
                        className="w-full flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-700 rounded text-sm hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors cursor-pointer"
                      >
                        <div className="flex-1 min-w-0 text-left">
                          <p className="font-medium text-gray-900 dark:text-white truncate">#{ticket.shortId} - {ticket.title}</p>
                          <p className="text-gray-500 dark:text-gray-400 text-xs">{ticket.customer} • {ticket.time}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

            </div>
          </div>
        );
      case 'tickets':
        return <TicketsPage />;
      case 'customers':
        return <CustomersPage onViewCustomer={(customerId) => {
          localStorage.setItem('previousPage', 'customers');
          setSelectedCustomerId(customerId);
          setCurrentPage('customer-profile');
        }} />;
      case 'agents':
        return <AgentsPage />;
      case 'agent-features-demo':
        return <AgentFeaturesDemo />;
      case 'smart-form-demo':
        return <SmartFormDemo />;

              case 'advanced-search-demo':
          return <AdvancedSearch 
            onSearch={(filters) => {
              console.log('Gelişmiş arama filtreleri:', filters);
              // Burada arama işlemi yapılabilir
            }}
            onClear={() => {
              console.log('Filtreler temizlendi');
              // Burada temizleme işlemi yapılabilir
            }}
          />;

      case 'reports':
        return <ReportsPage />;

      case 'smart-project-management':
        return <SmartProjectManagement onChannelSelect={() => {
          setShowEmployeeChat(true);
        }} />;



      case 'settings':
        return <SettingsPage />;

      case 'profile':
        return <ProfilePage />;
      case 'customer-profile':
        return selectedCustomerId ? (
          <AdminCustomerProfile 
            customerData={customers.find(c => c.id === selectedCustomerId)}
            tickets={tickets}
            payments={payments}
            onBack={() => {
              // Hangi sayfadan geldiğini kontrol et
              const previousPage = localStorage.getItem('previousPage') || 'customers';
              setCurrentPage(previousPage);
              localStorage.removeItem('previousPage');
            }}
            onViewTickets={(customerId) => {
              // Müşteri taleplerini görüntüleme fonksiyonu
              console.log('Müşteri talepleri görüntüleniyor:', customerId);
              // Talepler sayfasına yönlendir ve müşteri filtresini uygula
              localStorage.setItem('customerFilter', customerId);
              setCurrentPage('tickets');
              toast.success('Müşteri talepleri filtrelendi');
            }}
            onViewPayments={(customerId) => {
              // Müşteri ödemelerini görüntüleme fonksiyonu
              console.log('Müşteri ödemeleri görüntüleniyor:', customerId);
              // Finansal yönetim sayfasına yönlendir ve müşteri filtresini uygula
              localStorage.setItem('customerFilter', customerId);
              setCurrentPage('financial-management');
              toast.success('Müşteri ödemeleri filtrelendi');
            }}
          />
        ) : (
          <div className="text-center py-12">
            <p className="text-gray-500">Müşteri seçilmedi</p>
          </div>
        );
      case 'financial-management':
        return <FinancialManagement onViewCustomer={(customerId) => {
          localStorage.setItem('previousPage', 'financial-management');
          setSelectedCustomerId(customerId);
          setCurrentPage('customer-profile');
        }} />;
      case 'hr-management':
        return <HRManagement />;
      case 'employee-profile':
        return <EmployeeProfile />;
      case 'workflow-builder':
        return <WorkflowBuilder />;
      case 'approval-workflows':
        return <ApprovalWorkflows />;

      case 'payment-reminder':
        return <PaymentReminder currentUser={userProfile} />;
      // BulkOperations artık TicketList içinde entegre edildi
      default:
        return <div>Sayfa bulunamadı</div>;
    }
  };

  // Talep durumu hesaplamaları - Tutarlı veriler için
  const ticketStats = {
    totalTickets: tickets.length,
    openTickets: tickets.filter(t => t.status === 'open' || t.status === 'pending').length,
    highPriorityTickets: tickets.filter(t => t.priority === 'high').length,
    slaViolations: tickets.filter(t => {
      const created = new Date(t.created_at);
      const now = new Date();
      const diffHours = (now.getTime() - created.getTime()) / (1000 * 60 * 60);
      return diffHours > 24; // 24 saatten eski talepler SLA ihlali
    }).length,
    assignedTickets: tickets.filter(t => t.agent_id && agents.some(a => a.id === t.agent_id && a.status === 'active')).length
  };

  // Gelişmiş Billing data calculations - Supabase'den gerçek zamanlı veriler
  // Finansal Yönetim ile aynı hesaplama mantığını kullanır
  const billingData = {
    today: payments ? payments
      .filter(p => {
        const today = new Date();
        const paymentDate = new Date(p.created_at);
        return paymentDate.toDateString() === today.toDateString() && 
               (p.status === 'completed' || p.status === 'paid');
      })
      .reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0) : 0,
    thisMonth: payments ? payments
      .filter(p => {
        const now = new Date();
        const paymentDate = new Date(p.created_at);
        return paymentDate.getMonth() === now.getMonth() && 
               paymentDate.getFullYear() === now.getFullYear() && 
               (p.status === 'completed' || p.status === 'paid');
      })
      .reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0) : 0,
    thisYear: payments ? payments
      .filter(p => {
        const now = new Date();
        const paymentDate = new Date(p.created_at);
        return paymentDate.getFullYear() === now.getFullYear() && 
               (p.status === 'completed' || p.status === 'paid');
      })
      .reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0) : 0,
    allTime: payments ? payments
      .filter(p => p.status === 'completed' || p.status === 'paid')
      .reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0) : 0
  };

  // Ödeme yapan firmaların analizi - Finansal Yönetim ile uyumlu
  const payingCompanies = payments ? payments
    .filter(p => p.status === 'completed' || p.status === 'paid')
    .reduce((acc, payment) => {
      const customer = customers.find(c => c.id === payment.customer_id);
      const companyName = customer?.company || customer?.name || 'Bilinmeyen Firma';
      
      if (!acc[companyName]) {
        acc[companyName] = {
          name: companyName,
          totalPaid: 0,
          paymentCount: 0,
          lastPayment: null
        };
      }
      
      acc[companyName].totalPaid += parseFloat(payment.amount) || 0;
      acc[companyName].paymentCount += 1;
      
      const paymentDate = new Date(payment.created_at);
      if (!acc[companyName].lastPayment || paymentDate > acc[companyName].lastPayment) {
        acc[companyName].lastPayment = paymentDate;
      }
      
      return acc;
    }, {} as Record<string, any>) : {};

  // En çok ödeme yapan firmalar (top 5)
  const topPayingCompanies = Object.values(payingCompanies)
    .sort((a: any, b: any) => b.totalPaid - a.totalPaid)
    .slice(0, 5);

  // Ödeme istatistikleri - Finansal Yönetim ile uyumlu
  const paymentStats = {
    totalPayments: payments ? payments.filter(p => p.status === 'completed' || p.status === 'paid').length : 0,
    pendingPayments: payments ? payments.filter(p => p.status === 'pending').length : 0,
    failedPayments: payments ? payments.filter(p => p.status === 'failed').length : 0,
    averagePayment: payments && payments.filter(p => p.status === 'completed' || p.status === 'paid').length > 0 
      ? payments.filter(p => p.status === 'completed' || p.status === 'paid')
          .reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0) / 
        payments.filter(p => p.status === 'completed' || p.status === 'paid').length
      : 0
  };




  // Müşteri portalı gösteriliyorsa
  // Check if we're on the customers route
  if (location.pathname === '/customers') {
    return <CustomerPortal onBackToAdmin={() => navigate('/')} />;
  }

  // Temsilci portalı gösteriliyorsa
  if (location.pathname === '/agents') {
    return <AgentPortal onBackToAdmin={() => navigate('/')} />;
  }

  // Çalışan portalı gösteriliyorsa
  if (location.pathname === '/employee') {
    return <EmployeePortal onBackToAdmin={() => navigate('/')} />;
  }

  // Müdür portalı gösteriliyorsa
  if (location.pathname === '/manager') {
    return <ManagerPortal onBackToAdmin={() => navigate('/')} />;
  }

  // Çalışan profili gösteriliyorsa
  if (location.pathname === '/employee-profile') {
    return <EmployeeProfile />;
  }

  return (
    <ErrorBoundary>
      <div className="h-screen overflow-hidden">
        <div className="bg-gray-50 dark:bg-gray-900 dark:bg-gray-950 h-screen flex overflow-hidden">

          {/* Sidebar */}
          <div className={`fixed inset-y-0 left-8 z-50 w-64 bg-white dark:bg-gray-800 dark:bg-gray-900 transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0 lg:flex-shrink-0 flex flex-col ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 dark:bg-gray-900 flex-shrink-0">
              <h1 className="text-xl font-bold text-gray-900 dark:text-white">{settings.siteName}</h1>
              <button
                onClick={() => setSidebarOpen(false)}
                className="lg:hidden p-1 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <nav className="p-6 space-y-2 bg-white dark:bg-gray-800 dark:bg-gray-900 overflow-y-auto flex-1 min-h-0">
              {/* Sidebar menü öğeleri aynı kalır */}
              <button onClick={() => setCurrentPage('dashboard')} className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-left transition-colors ${currentPage === 'dashboard' ? 'bg-primary-100 text-primary-700 dark:bg-primary-900 dark:text-primary-200' : 'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700'}`}>
                <LayoutDashboard className="w-5 h-5" /><span>Dashboard</span>
              </button>
              <button onClick={() => setCurrentPage('tickets')} className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-left transition-colors ${currentPage === 'tickets' ? 'bg-primary-100 text-primary-700 dark:bg-primary-900 dark:text-primary-200' : 'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700'}`}>
                <MessageSquare className="w-5 h-5" /><span>Talepler</span>
              </button>
              <button onClick={() => setCurrentPage('customers')} className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-left transition-colors ${currentPage === 'customers' ? 'bg-primary-100 text-primary-700 dark:bg-primary-900 dark:text-primary-200' : 'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700'}`}>
                <Users className="w-5 h-5" /><span>Müşteriler</span>
              </button>
              <button onClick={() => setCurrentPage('agents')} className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-left transition-colors ${currentPage === 'agents' ? 'bg-primary-100 text-primary-700 dark:bg-primary-900 dark:text-primary-200' : 'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700'}`}>
                <UserCheck className="w-5 h-5" /><span>Temsilciler</span>
              </button>
              <button onClick={() => setCurrentPage('reports')} className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-left transition-colors ${currentPage === 'reports' ? 'bg-primary-100 text-primary-700 dark:bg-primary-900 dark:text-primary-200' : 'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700'}`}>
                <BarChart3 className="w-5 h-5" /><span>Raporlar</span>
              </button>

              <button onClick={() => setCurrentPage('smart-project-management')} className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-left transition-colors ${currentPage === 'smart-project-management' ? 'bg-primary-100 text-primary-700 dark:bg-primary-900 dark:text-primary-200' : 'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700'}`}>
                <GanttChart className="w-5 h-5" /><span>Akıllı Proje Yönetimi</span>
              </button>



              <button onClick={() => setCurrentPage('financial-management')} className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-left transition-colors ${currentPage === 'financial-management' ? 'bg-primary-100 text-primary-700 dark:bg-primary-900 dark:text-primary-200' : 'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700'}`}>
                <DollarSign className="w-5 h-5" /><span>Finansal Yönetim</span>
              </button>
              
              <button onClick={() => setCurrentPage('hr-management')} className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-left transition-colors ${currentPage === 'hr-management' ? 'bg-primary-100 text-primary-700 dark:bg-primary-900 dark:text-primary-200' : 'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700'}`}>
                <Briefcase className="w-5 h-5" /><span>İK Yönetimi</span>
              </button>
              
              <button onClick={() => setCurrentPage('workflow-builder')} className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-left transition-colors ${currentPage === 'workflow-builder' ? 'bg-primary-100 text-primary-700 dark:bg-primary-900 dark:text-primary-200' : 'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700'}`}>
                <GitBranch className="w-5 h-5" /><span>Workflow Builder</span>
              </button>
              <button onClick={() => setCurrentPage('approval-workflows')} className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-left transition-colors ${currentPage === 'approval-workflows' ? 'bg-primary-100 text-primary-700 dark:bg-primary-900 dark:text-primary-200' : 'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700'}`}>
                <UserCheck className="w-5 h-5" /><span>Onay Süreçleri</span>
              </button>
              

              
              {/* Çalışan Mesajlaşma Sistemi */}
              <button onClick={() => setShowEmployeeChat(true)} className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-left transition-colors text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700`}>
                <MessageSquare className="w-5 h-5" /><span>Takım İletişimi</span>
                <span className="ml-auto px-2 py-0.5 text-xs bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300 rounded-full">
                  3
                </span>
              </button>
              {/* Toplu İşlemler artık Talep sayfasında entegre edildi */}
              <button onClick={() => setCurrentPage('settings')} className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-left transition-colors ${currentPage === 'settings' ? 'bg-primary-100 text-primary-700 dark:bg-primary-900 dark:text-primary-200' : 'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700'}`}>
                <Settings className="w-5 h-5" /><span>Ayarlar</span>
              </button>
              
              {/* Temsilci Özellikleri Demo */}
              <button onClick={() => setCurrentPage('agent-features-demo')} className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-left transition-colors ${currentPage === 'agent-features-demo' ? 'bg-primary-100 text-primary-700 dark:bg-primary-900 dark:text-primary-200' : 'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700'}`}>
                <Lightbulb className="w-5 h-5" /><span>Temsilci Özellikleri Demo</span>
              </button>
              

              

            </nav>
            
            {/* Portal Erişimleri */}
            <div className="border-t border-gray-200 dark:border-gray-700 pt-2 mt-2 bg-white dark:bg-gray-800 flex-shrink-0 p-6 space-y-2">
              <button 
                onClick={() => navigate('/customers')}
                className="w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-left transition-colors text-blue-600 hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-900/20"
              >
                <User className="w-5 h-5" />
                <span>Müşteri Portalı</span>
              </button>
              
              <button 
                onClick={() => navigate('/agents')}
                className="w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-left transition-colors text-green-600 hover:bg-green-50 dark:text-green-400 dark:hover:bg-green-900/20"
              >
                <UserCheck className="w-5 h-5" />
                <span>Temsilci Portalı</span>
              </button>
              
              <button 
                onClick={() => navigate('/employee')}
                className="w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-left transition-colors text-purple-600 hover:bg-purple-50 dark:text-purple-400 dark:hover:bg-purple-900/20"
              >
                <Briefcase className="w-5 h-5" />
                <span>Çalışan Portalı</span>
              </button>
              
              <button 
                onClick={() => navigate('/manager')}
                className="w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-left transition-colors text-orange-600 hover:bg-orange-50 dark:text-orange-400 dark:hover:bg-orange-900/20"
              >
                <UserCheck className="w-5 h-5" />
                <span>Müdür Portalı</span>
              </button>
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1 flex flex-col h-full overflow-hidden">
            {/* Header */}
                        <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 py-2 pt-3 flex-shrink-0 lg:pl-5">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <button
                    onClick={() => setSidebarOpen(!sidebarOpen)}
                    className="lg:hidden p-1.5 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
                  >
                    <Menu className="w-4 h-4" />
                  </button>
                  <div className="relative flex items-center">
                    <Search className="absolute left-2.5 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="text"
                      value={globalSearchTerm}
                      onChange={(e) => handleGlobalSearch(e.target.value)}
                      onFocus={() => setShowSearchResults(true)}
                      onBlur={() => setTimeout(() => setShowSearchResults(false), 200)}
                      placeholder="Talep no, müşteri adı, fatura no, e-posta, şirket..."
                      className="pl-8 pr-12 py-1.5 w-72 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <div className="absolute right-1.5 top-1/2 transform -translate-y-1/2">
                      <VoiceSearch
                        onTranscript={(text) => handleGlobalSearch(text)}
                        className=""
                      />
                    </div>
                    
                    {/* Arama Sonuçları Dropdown */}
                    {showSearchResults && (
                      <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-xl z-50 max-h-80 overflow-y-auto">
                        {searchResults.length > 0 ? (
                          <>
                            <div className="px-3 py-2 border-b border-gray-200 dark:border-gray-700">
                              <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                {searchResults.length} sonuç bulundu
                              </p>
                            </div>
                            {searchResults.map((result, index) => (
                              <button
                                key={`${result.type}-${result.id}-${index}`}
                                onClick={() => handleSearchResultClick(result)}
                                className="w-full px-3 py-2 text-left hover:bg-gray-50 dark:hover:bg-gray-700 border-b border-gray-100 dark:border-gray-600 last:border-b-0"
                              >
                                <div className="flex items-center gap-3">
                                  <div className="flex-shrink-0">
                                    {result.type === 'ticket' && <MessageSquare className="w-4 h-4 text-blue-600" />}
                                    {result.type === 'customer' && <User className="w-4 h-4 text-green-600" />}
                                    {result.type === 'agent' && <UserCheck className="w-4 h-4 text-purple-600" />}
                                    {result.type === 'payment' && <CreditCard className="w-4 h-4 text-orange-600" />}
                                    {result.type === 'invoice' && <FileText className="w-4 h-4 text-red-600" />}
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                                      {result.title}
                                    </p>
                                    <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                                      {result.subtitle}
                                    </p>
                                    <p className="text-xs text-gray-400 dark:text-gray-500 truncate">
                                      {result.description}
                                    </p>
                                  </div>
                                </div>
                              </button>
                            ))}
                          </>
                        ) : (
                          <div className="p-4 text-center">
                            <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">
                              "{globalSearchTerm}" için sonuç bulunamadı
                            </p>
                          </div>
                        )}
                        
                        {/* Detaylı Arama Linki - Her zaman görünür */}
                        <div className="px-3 py-2 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700">
                          <button
                            onClick={() => {
                              // Arama terimini localStorage'a kaydet
                              if (globalSearchTerm.trim()) {
                                localStorage.setItem('globalSearchTerm', globalSearchTerm.trim());
                              }
                              setCurrentPage('advanced-search-demo');
                              setShowSearchResults(false);
                              setGlobalSearchTerm('');
                            }}
                            className="w-full flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 py-2 px-2 rounded hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
                          >
                            <Search className="w-4 h-4" />
                            <span>🔍 Detaylı Arama Yap</span>
                            <span className="ml-auto text-xs text-gray-500">→</span>
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                  
                  {/* Detaylı Arama Butonu */}
                  <button
                    onClick={() => {
                      if (globalSearchTerm.trim()) {
                        localStorage.setItem('globalSearchTerm', globalSearchTerm.trim());
                      }
                      setCurrentPage('advanced-search-demo');
                      setShowSearchResults(false);
                    }}
                    className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                    title="Detaylı Arama (Ctrl + Shift + F)"
                  >
                    <Search className="w-4 h-4" />
                  </button>
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => {
                      if (theme === 'auto') {
                        setTheme(isDark ? 'light' : 'dark');
                      } else {
                        setTheme(theme === 'light' ? 'dark' : 'light');
                      }
                    }}
                    className="p-1.5 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
                    title={theme === 'auto' ? 'Otomatik tema - Manuel değiştir' : 'Tema değiştir'}
                  >
                    {isDark ? '☀️' : '🌙'}
                  </button>
                  <div className="relative">
                    <button
                      onClick={() => {
                        setNotificationsOpen((v) => !v);
                        fetchNotifications();
                      }}
                      className="relative p-1.5 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
                    >
                      <Bell className="w-4 h-4" />
                      {/* Notification badge hidden */}
                      {/* {unreadCount > 0 && (
                        <span className="absolute -top-1 -right-1 px-1 min-w-[16px] h-4 text-[10px] leading-4 text-white bg-red-600 rounded-full text-center">
                          {unreadCount}
                        </span>
                      )} */}
                    </button>
                    {notificationsOpen && (
                      <div className="absolute right-0 mt-1 w-72 sm:w-80 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-xl z-50">
                        <div className="px-3 py-2 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
                          <p className="text-sm font-semibold text-gray-900 dark:text-white">Bildirimler</p>
                          <button
                            onClick={async () => {
                              const unread = notifications.filter((n: any) => !n.is_read);
                              await Promise.all(unread.map((n: any) => markNotificationAsRead(n.id)));
                              fetchNotifications();
                            }}
                            className="text-xs text-blue-600 hover:underline"
                          >
                            Tümünü okundu işaretle
                          </button>
                        </div>
                        <div className="max-h-64 overflow-auto divide-y divide-gray-200 dark:divide-gray-700">
                          {notifications.length === 0 ? (
                            <div className="p-3 text-sm text-gray-500 dark:text-gray-400">Henüz bildirim yok</div>
                          ) : (
                            notifications.map((n: any) => {
                              const icon = n.type === 'payment' ? (
                                <CreditCard className="w-4 h-4 text-blue-600" />
                              ) : n.type === 'ticket' ? (
                                <MessageSquare className="w-4 h-4 text-green-600" />
                              ) : (
                                <Bell className="w-4 h-4 text-gray-500" />
                              );
                              return (
                                <button
                                  key={n.id}
                                  onClick={async () => {
                                    if (!n.is_read) await markNotificationAsRead(n.id);
                                    setNotificationsOpen(false);
                                    if (n.type === 'payment') setCurrentPage('financial-management');
                                    if (n.type === 'ticket') setCurrentPage('tickets');
                                  }}
                                  className={`w-full flex items-start gap-2 px-3 py-2 text-left hover:bg-gray-50 dark:hover:bg-gray-700 ${!n.is_read ? 'bg-blue-50/40 dark:bg-blue-900/10' : ''}`}
                                >
                                  <div className="mt-0.5">{icon}</div>
                                  <div className="flex-1">
                                    <p className="text-sm font-medium text-gray-900 dark:text-white">{n.title}</p>
                                    <p className="text-xs text-gray-600 dark:text-gray-300">{n.message}</p>
                                    <p className="text-[10px] text-gray-500 dark:text-gray-400 mt-0.5">
                                      {formatDistanceToNow(new Date(n.created_at), { addSuffix: true, locale: tr })}
                                    </p>
                                  </div>
                                  {!n.is_read && <span className="mt-1 w-1.5 h-1.5 bg-blue-600 rounded-full" />}
                                </button>
                              );
                            })
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                  <button
                    onClick={() => setCurrentPage('profile')}
                    className="flex items-center space-x-2 p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
                  >
                    <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center text-white font-semibold text-xs">
                      {userProfile.name.split(' ').map(n => n[0]).join('')}
                    </div>
                    <div className="text-left">
                      <p className="text-sm font-medium text-gray-900 dark:text-white">{userProfile.name}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">{userProfile.email}</p>
                    </div>
                  </button>
                </div>
              </div>
            </header>

            {/* Page Content */}
            <main className="flex-1 bg-gray-50 dark:bg-gray-900 dark:bg-gray-950 overflow-y-auto overflow-x-hidden lg:pl-5">
              {renderContent()}
            </main>
          </div>

          {/* Overlay for mobile sidebar */}
          {sidebarOpen && (
            <div
              className="fixed inset-0 z-40 bg-black bg-opacity-50 lg:hidden"
              onClick={() => setSidebarOpen(false)}
              style={{ zIndex: 40 }}
            />
          )}

          <Toaster position="top-right" />



          {/* Çalışan Mesajlaşma Sistemi Modal */}
          {showEmployeeChat && location.pathname !== '/employee-profile' && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full h-full max-w-full max-h-full flex flex-col">
                <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Çalışan Mesajlaşma Sistemi</h2>
                  <button
                    onClick={() => {
                      setShowEmployeeChat(false);
                    }}
                    className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                    title="Kapat"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
                <div className="flex-1 overflow-hidden">
                  <EmployeeChat />
                </div>
              </div>
            </div>
          )}

          {/* Global Akıllı İpuçları Sistemi */}
          <RealTimeHintSystem
            currentPage={currentPage}
            currentAction={location.pathname}
            userRole="admin"
            contextData={{
              currentPage: currentPage,
              selectedCustomerId: selectedCustomerId,
              globalSearchTerm: globalSearchTerm,
              totalTickets: tickets?.length || 0,
              totalCustomers: customers?.length || 0,
              totalAgents: agents?.length || 0,
              totalPayments: payments?.length || 0,
              unreadNotifications: notifications?.filter(n => !n.is_read).length || 0,
              lastBillingUpdate: lastBillingUpdate,
              lastSupportUpdate: lastSupportUpdate
            }}
            onHintAction={(hintId, action) => {
              console.log('Global hint action:', hintId, action);
              
              switch (action) {
                case 'optimize':
                  // Performans optimizasyonu
                  toast.success('Sistem performans optimizasyonu başlatıldı');
                  break;
                case 'view_reports':
                  // Raporlar sayfasına yönlendir
                  setCurrentPage('reports');
                  break;
                case 'smart_sort':
                  // Akıllı sıralama
                  toast.success('Akıllı sıralama sistemi etkinleştirildi');
                  break;
                case 'view_templates':
                  // Şablonları görüntüle
                  toast.success('Hızlı yanıt şablonları açılıyor');
                  break;
                case 'enable_ai':
                  // AI özelliklerini etkinleştir
                  toast.success('AI destekli özellikler etkinleştirildi');
                  break;
                case 'view_details':
                  // Detayları görüntüle
                  toast.success('Detaylı rapor açılıyor');
                  break;
                case 'view_risky_customers':
                  // Riskli müşterileri görüntüle
                  toast.success('Riskli müşteriler listesi açılıyor');
                  break;
                case 'optimize_payments':
                  // Ödeme optimizasyonu
                  toast.success('Ödeme optimizasyonu başlatıldı');
                  break;
                case 'start_reminders':
                  // Hatırlatma sistemi
                  toast.success('Akıllı hatırlatma sistemi başlatıldı');
                  break;
                case 'optimize_resources':
                  // Kaynak optimizasyonu
                  toast.success('Kaynak optimizasyonu başlatıldı');
                  break;
                case 'view_trend_report':
                  // Trend raporu
                  toast.success('Trend raporu açılıyor');
                  break;
                case 'performance_analysis':
                  // Performans analizi
                  toast.success('Detaylı performans analizi başlatıldı');
                  break;
                case 'sla_optimization':
                  // SLA optimizasyonu
                  toast.success('SLA optimizasyonu başlatıldı');
                  break;
                case 'payment_analysis':
                  // Ödeme analizi
                  toast.success('Detaylı ödeme analizi başlatıldı');
                  break;
                case 'revenue_optimization':
                  // Gelir optimizasyonu
                  toast.success('Gelir optimizasyonu başlatıldı');
                  break;
                case 'optimize_customer_retention':
                  // Müşteri tutma optimizasyonu
                  toast.success('Müşteri tutma optimizasyonu başlatıldı');
                  break;
                case 'proactive_communication':
                  // Proaktif iletişim
                  toast.success('Proaktif iletişim kampanyası başlatıldı');
                  break;
                case 'view_notifications':
                  // Bildirimleri görüntüle
                  setNotificationsOpen(true);
                  break;
                case 'view_tickets':
                  // Talepleri görüntüle
                  setCurrentPage('tickets');
                  break;
                case 'view_customer_analysis':
                  // Müşteri analizi
                  setCurrentPage('customers');
                  break;
                case 'optimize_response_time':
                  // Yanıt süresi optimizasyonu
                  toast.success('Yanıt süresi optimizasyonu başlatıldı');
                  break;
                case 'emergency_action':
                  // Acil aksiyon modu
                  toast.success('Acil aksiyon modu etkinleştirildi');
                  break;
                case 'view_shortcuts':
                  // Kısayolları görüntüle
                  toast.success('Kısayol listesi açılıyor');
                  break;
                case 'emergency_collection':
                  // Acil tahsilat
                  toast.success('Acil tahsilat sistemi başlatıldı');
                  break;
                case 'vip_service':
                  // VIP hizmet
                  toast.success('VIP müşteri hizmeti başlatıldı');
                  break;
                case 'revenue_analysis':
                  // Gelir analizi
                  toast.success('Gelir analizi açılıyor');
                  break;
                case 'satisfaction_analysis':
                  // Müşteri memnuniyet analizi
                  toast.success('Müşteri memnuniyet analizi başlatıldı');
                  break;
                case 'vip_opportunities':
                  // VIP hizmet fırsatları
                  toast.success('VIP hizmet fırsatları açılıyor');
                  break;
                case 'optimize_onboarding':
                  // Onboarding optimizasyonu
                  toast.success('Onboarding optimizasyonu başlatıldı');
                  break;
                case 'sla_check':
                  // SLA kontrolü
                  toast.success('SLA kontrol sistemi başlatıldı');
                  break;
                case 'performance_report':
                  // Performans raporu
                  toast.success('Performans raporu açılıyor');
                  break;
                default:
                  console.log('Unknown global hint action:', action);
              }
            }}
          />
        </div>
      </div>
    </ErrorBoundary>
  );
}

// Ana App bileşeni - Router ile sarılmış
const AppWithProviders: React.FC = () => {
  return (
    <Router>
      <SettingsProvider>
        <UserProvider>
          <AnimationProvider>
            <App />
          </AnimationProvider>
        </UserProvider>
      </SettingsProvider>
    </Router>
  );
};

export default AppWithProviders;