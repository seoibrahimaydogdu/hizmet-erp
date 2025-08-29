import React, { useState, useEffect } from 'react';
import { 
  User, 
  Lock, 
  Eye, 
  EyeOff, 
  LogIn, 
  MessageSquare, 
  CreditCard, 
  Settings, 
  Home,
  Bell,
  Search,
  Plus,
  Calendar,
  Clock,
  CheckCircle,
  AlertCircle,
  XCircle,
  DollarSign,
  Palette,
  Sun,
  Moon,
  Tag
} from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';
import { formatCurrency } from '../lib/currency';
import { useSupabase } from '../hooks/useSupabase';
import { supabase } from '../lib/supabase';
import { toast } from 'react-hot-toast';
import CustomerTickets from './CustomerTickets';
import CustomerPayments from './CustomerPayments';
import CustomerProfile from './CustomerProfile';
import CustomerLiveChat from './CustomerLiveChat';
import SmartPriorityWizard from './SmartPriorityWizard';
import SmartPaymentReminder from './SmartPaymentReminder';
import ChatHistory from './ChatHistory';
import CustomerPromotions from './CustomerPromotions';
import RichTextEditor from './RichTextEditor';
import InteractiveTutorial from './InteractiveTutorial';

interface CustomerPortalProps {
  onBackToAdmin?: () => void;
}

const CustomerPortal: React.FC<CustomerPortalProps> = ({ onBackToAdmin }) => {
  const { theme, setTheme, isDark } = useTheme();
  const [currentPage, setCurrentPage] = useState('dashboard');
  const [customerData, setCustomerData] = useState<any>(null);

  const {
    customers,
    tickets,
    payments,
    fetchCustomers,
    fetchTickets,
    fetchPayments
  } = useSupabase();

  useEffect(() => {
    // Müşteri verilerini yükle
    fetchCustomers();
    fetchTickets();
    fetchPayments();
    
    // Gerçek zamanlı güncellemeler için subscription
    const ticketsSubscription = supabase
      .channel('customer_tickets_changes')
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'tickets' 
        }, 
        (payload: any) => {
          console.log('Customer ticket change detected:', payload);
          // Talepleri yeniden yükle
          fetchTickets();
        }
      )
      .subscribe();

    // Canlı destek yönlendirmesi için event listener
    const handleNavigateToLiveChat = () => {
      setCurrentPage('live-chat');
    };

    window.addEventListener('navigateToLiveChat', handleNavigateToLiveChat);

    // Direkt müşteri verilerini yükle
    const loadCustomerData = () => {
      // Ayşe Demir müşterisini bul
      const customer = customers.find(c => c.email === 'ayse.demir@example.com');
      
      if (customer) {
        console.log('Müşteri bulundu:', customer.name);
        setCustomerData(customer);
      } else {
        console.log('Müşteri bulunamadı, varsayılan müşteri kullanılıyor...');
        // Varsayılan müşteri oluştur
        const defaultCustomer = {
          id: '550e8400-e29b-41d4-a716-446655440001',
          name: 'Ayşe Demir',
          email: 'ayse.demir@example.com',
          phone: '+90 532 123 45 67',
          company: 'Demir Teknoloji A.Ş.',
          plan: 'premium',
          currency: 'TRY',
          satisfaction_score: 85,
          total_tickets: 12,
          avatar_url: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150&h=150&fit=crop&crop=face',
          created_at: '2024-01-15 09:30:00+03',
          updated_at: '2024-08-20 14:45:00+03'
        };
        setCustomerData(defaultCustomer);
      }
    };

    // Müşteri verilerini yükle
    loadCustomerData();

    return () => {
      supabase.removeChannel(ticketsSubscription);
      window.removeEventListener('navigateToLiveChat', handleNavigateToLiveChat);
    };
  }, [customers]);

  // Bildirim tercihlerini localStorage'da sakla
  const [notificationPreferences, setNotificationPreferences] = useState(() => {
    const saved = localStorage.getItem(`notification_prefs_${customerData?.id}`);
    return saved ? JSON.parse(saved) : {
      lastPaymentReminder: null,
      reminderCount: 0,
      autoRedirect: true,
      lastRedirectTime: null
    };
  });

  // Bildirim tercihlerini güncelle
  const updateNotificationPreferences = (updates: any) => {
    const newPrefs = { ...notificationPreferences, ...updates };
    setNotificationPreferences(newPrefs);
    localStorage.setItem(`notification_prefs_${customerData?.id}`, JSON.stringify(newPrefs));
  };

  // Müşteri giriş yaptıktan sonra bildirim subscription'ı başlat
  useEffect(() => {
    if (!customerData?.id) return;

    console.log('Setting up notification subscription for customer:', customerData.id);
    console.log('Customer data:', customerData);

    // Bildirimler için subscription
    const notificationsSubscription = supabase
      .channel('customer_notifications_changes')
      .on('postgres_changes', 
        { 
          event: 'INSERT', 
          schema: 'public', 
          table: 'notifications',
          filter: `user_id=eq.${customerData.id}`
        }, 
        (payload: any) => {
          console.log('Customer notification received:', payload);
          console.log('Notification type:', payload.new.type);
          console.log('Notification message:', payload.new.message);
          
          if (payload.new.type === 'payment_reminder') {
            console.log('Payment reminder notification received');
            
            const now = Date.now();
            const lastReminder = notificationPreferences.lastPaymentReminder;
            const timeSinceLastReminder = lastReminder ? now - lastReminder : Infinity;
            
            // Eğer son 5 dakika içinde bildirim aldıysa, tekrar gösterme
            if (timeSinceLastReminder < 5 * 60 * 1000) {
              console.log('Payment reminder received too recently, skipping...');
              return;
            }
            
            // Bildirim sayısını artır
            const newCount = notificationPreferences.reminderCount + 1;
            updateNotificationPreferences({
              lastPaymentReminder: now,
              reminderCount: newCount
            });
            
            // İlk 2 bildirimde otomatik yönlendirme yap
            if (newCount <= 2 && notificationPreferences.autoRedirect) {
              toast.success('Ödeme hatırlatması geldi! Canlı Destek sekmesine yönlendiriliyorsunuz.');
              setTimeout(() => {
                setCurrentPage('live-chat');
              }, 1500);
            } else {
              // Sonraki bildirimlerde sadece bilgi ver
              toast.success('Yeni bir ödeme hatırlatması bildirimi aldınız. Canlı Destek sekmesinden kontrol edebilirsiniz.');
            }
          }
        }
      )
      .subscribe();

    // Talepler için de subscription (payment_reminder kategorisindeki talepler için)
    const ticketsSubscription = supabase
      .channel('customer_payment_reminder_tickets')
      .on('postgres_changes', 
        { 
          event: 'INSERT', 
          schema: 'public', 
          table: 'tickets',
          filter: `customer_id=eq.${customerData.id} AND category=eq.payment_reminder`
        }, 
        (payload: any) => {
          console.log('Payment reminder ticket created:', payload);
          
          const now = Date.now();
          const lastRedirect = notificationPreferences.lastRedirectTime;
          const timeSinceLastRedirect = lastRedirect ? now - lastRedirect : Infinity;
          
          // Eğer son 10 dakika içinde yönlendirme yapıldıysa, tekrar yapma
          if (timeSinceLastRedirect < 10 * 60 * 1000) {
            toast.success('Yeni bir ödeme hatırlatması isteği oluşturuldu. Canlı Destek sekmesinden kontrol edebilirsiniz.');
            return;
          }
          
          // İlk 3 talepte otomatik yönlendirme yap
          if (notificationPreferences.reminderCount <= 3 && notificationPreferences.autoRedirect) {
            toast.success('Ödeme hatırlatması isteği oluşturuldu! Canlı Destek sekmesine yönlendiriliyorsunuz.');
            updateNotificationPreferences({ lastRedirectTime: now });
            setTimeout(() => {
              setCurrentPage('live-chat');
            }, 1500);
          } else {
            toast.success('Yeni bir ödeme hatırlatması isteği oluşturuldu. Canlı Destek sekmesinden kontrol edebilirsiniz.');
          }
        }
      )
      .subscribe();

    // Mevcut ödeme hatırlatması taleplerini kontrol et
    const existingPaymentReminders = tickets.filter(t => 
      t.customer_id === customerData.id && 
      t.category === 'payment_reminder' &&
      t.status === 'open'
    );

    console.log('Existing payment reminder tickets:', existingPaymentReminders);

    // Eğer açık ödeme hatırlatması talepleri varsa ve daha önce bildirim gösterilmediyse
    if (existingPaymentReminders.length > 0 && !notificationPreferences.lastPaymentReminder) {
      console.log('Found existing payment reminder tickets, showing notification...');
      toast.success(`${existingPaymentReminders.length} adet açık ödeme hatırlatması isteğiniz bulunuyor. Canlı Destek sekmesinden kontrol edebilirsiniz.`);
    }

    return () => {
      supabase.removeChannel(notificationsSubscription);
      supabase.removeChannel(ticketsSubscription);
    };
  }, [customerData?.id, tickets, notificationPreferences]);

  // Otomatik giriş sistemi - Manuel giriş kaldırıldı

  const handleLogout = () => {
    setCustomerData(null);
    toast.success('Başarıyla çıkış yapıldı');
  };

  // Müşteriye ait talepleri filtrele (ödeme hatırlatmaları hariç)
  const customerTickets = tickets.filter(t => 
    t.customer_id === customerData?.id && t.category !== 'payment_reminder'
  );
  
  // Müşteriye ait ödemeleri filtrele
  const customerPayments = payments.filter(p => p.customer_id === customerData?.id);

  // Talep istatistikleri (ödeme hatırlatmaları hariç)
  const ticketStats = {
    total: customerTickets.filter(t => t.category !== 'payment_reminder').length,
    open: customerTickets.filter(t => t.status === 'open' && t.category !== 'payment_reminder').length,
    inProgress: customerTickets.filter(t => t.status === 'in_progress' && t.category !== 'payment_reminder').length,
    resolved: customerTickets.filter(t => t.status === 'resolved' && t.category !== 'payment_reminder').length
  };

  // Ödeme istatistikleri
  const paymentStats = {
    total: customerPayments.length,
    pending: customerPayments.filter(p => p.status === 'pending').length,
    completed: customerPayments.filter(p => p.status === 'completed').length,
    totalAmount: customerPayments
      .filter(p => p.status === 'completed')
      .reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0)
  };

  if (!customerData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="flex items-center justify-center mb-4">
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                Müşteri Portalı
              </h1>
            </div>
            <p className="text-gray-600 dark:text-gray-400">
              Otomatik giriş yapılıyor...
            </p>
          </div>

          {/* Loading Screen */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8">
            <div className="text-center">
              <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                Müşteri Portalına Giriş Yapılıyor
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
                Ayşe Demir hesabına otomatik giriş yapılıyor...
              </p>
              
              {/* Progress Bar */}
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mb-6">
                <div className="bg-blue-600 h-2 rounded-full animate-pulse" style={{ width: '60%' }}></div>
              </div>
              
              <div className="text-xs text-gray-500 dark:text-gray-400 space-y-1">
                <p>• Müşteri verileri yükleniyor...</p>
                <p>• Oturum açılıyor...</p>
                <p>• Dashboard hazırlanıyor...</p>
              </div>
            </div>

            {/* Admin'e Dön */}
            {onBackToAdmin && (
              <button
                onClick={onBackToAdmin}
                className="w-full mt-6 px-4 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
              >
                ← Admin Paneline Dön
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Ana Portal İçeriği
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">
              Müşteri Portalı
            </h1>
            <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
              <span>Hoş geldiniz,</span>
              <span className="font-medium text-gray-900 dark:text-white">
                {customerData?.name}
              </span>
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            <button className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700">
              <Bell className="w-5 h-5" />
            </button>
            <button
              onClick={handleLogout}
              className="px-4 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              Çıkış Yap
            </button>
          </div>
        </div>
      </header>

      {/* Navigation */}
      <nav className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-3">
        <div className="flex items-center space-x-6">
          <button
            onClick={() => setCurrentPage('dashboard')}
            className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
              currentPage === 'dashboard'
                ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700'
            }`}
          >
            <Home className="w-4 h-4" />
            <span>Dashboard</span>
          </button>
          
          <button
            onClick={() => setCurrentPage('tickets')}
            className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
              currentPage === 'tickets'
                ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700'
            }`}
          >
            <MessageSquare className="w-4 h-4" />
            <span>Talepler</span>
            {ticketStats.open > 0 && (
              <span className="px-2 py-0.5 text-xs bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300 rounded-full">
                {ticketStats.open}
              </span>
            )}
          </button>
          
          <button
            onClick={() => setCurrentPage('payments')}
            className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
              currentPage === 'payments'
                ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700'
            }`}
          >
            <CreditCard className="w-4 h-4" />
            <span>Ödemeler</span>
            {paymentStats.pending > 0 && (
              <span className="px-2 py-0.5 text-xs bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300 rounded-full">
                {paymentStats.pending}
              </span>
            )}
          </button>
          
          <button
            onClick={() => setCurrentPage('profile')}
            className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
              currentPage === 'profile'
                ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700'
            }`}
          >
            <Settings className="w-4 h-4" />
            <span>Profil</span>
          </button>
          
          <button
            onClick={() => setCurrentPage('live-chat')}
            className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
              currentPage === 'live-chat'
                ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700'
            }`}
          >
            <MessageSquare className="w-4 h-4" />
            <span>Canlı Destek</span>
            <span className="px-2 py-0.5 text-xs bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300 rounded-full">
              Online
            </span>
          </button>
          
          <button
            onClick={() => setCurrentPage('promotions')}
            className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
              currentPage === 'promotions'
                ? 'bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700'
            }`}
          >
            <Tag className="w-4 h-4" />
            <span>Promosyonlar</span>
            <span className="px-2 py-0.5 text-xs bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300 rounded-full">
              Yeni
            </span>
          </button>
        </div>
      </nav>

      {/* Main Content */}
      <main className="p-6">
        {currentPage === 'dashboard' && (
          <div className="space-y-6">
            {/* Welcome Section */}
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl p-6 text-white">
              <h2 className="text-2xl font-bold mb-2">
                Hoş geldiniz, {customerData?.name}!
              </h2>
              <p className="text-blue-100">
                Hesabınızın genel durumunu buradan takip edebilirsiniz.
              </p>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {/* Talep İstatistikleri */}
              <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
                    <MessageSquare className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                  </div>
                  <span className="text-2xl font-bold text-gray-900 dark:text-white">
                    {ticketStats.total}
                  </span>
                </div>
                <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-1">
                  Toplam Talep
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {ticketStats.open} açık, {ticketStats.resolved} çözüldü
                </p>
              </div>

              {/* Açık Talepler */}
              <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-2 bg-red-100 dark:bg-red-900 rounded-lg">
                    <AlertCircle className="w-6 h-6 text-red-600 dark:text-red-400" />
                  </div>
                  <span className="text-2xl font-bold text-red-600 dark:text-red-400">
                    {ticketStats.open}
                  </span>
                </div>
                <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-1">
                  Açık Talepler
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Yanıt bekleyen talepleriniz
                </p>
              </div>

              {/* Toplam Ödeme */}
              <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
                    <CreditCard className="w-6 h-6 text-green-600 dark:text-green-400" />
                  </div>
                  <span className="text-2xl font-bold text-green-600 dark:text-green-400">
                    {formatCurrency(paymentStats.totalAmount)}
                  </span>
                </div>
                <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-1">
                  Toplam Ödeme
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {paymentStats.completed} başarılı ödeme
                </p>
              </div>

              {/* Bekleyen Ödemeler */}
              <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-2 bg-orange-100 dark:bg-orange-900 rounded-lg">
                    <Clock className="w-6 h-6 text-orange-600 dark:text-orange-400" />
                  </div>
                  <span className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                    {paymentStats.pending}
                  </span>
                </div>
                <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-1">
                  Bekleyen Ödeme
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Onay bekleyen ödemeleriniz
                </p>
              </div>
            </div>

            {/* Recent Activity */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Son Talepler */}
              <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Son Talepler
                  </h3>
                  <button
                    onClick={() => setCurrentPage('tickets')}
                    className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
                  >
                    Tümünü Gör
                  </button>
                </div>
                
                                 {customerTickets.filter(t => t.category !== 'payment_reminder').length === 0 ? (
                   <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                     <MessageSquare className="w-12 h-12 mx-auto mb-2 opacity-50" />
                     <p>Henüz talep oluşturmadınız</p>
                   </div>
                 ) : (
                   <div className="space-y-3">
                     {customerTickets.filter(t => t.category !== 'payment_reminder').slice(0, 3).map((ticket) => (
                      <div
                        key={ticket.id}
                        className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 cursor-pointer transition-colors"
                        onClick={() => setCurrentPage('tickets')}
                      >
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-sm font-medium text-gray-900 dark:text-white">
                              #{ticket.id.slice(0, 8)}
                            </span>
                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                              ticket.status === 'open' ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300' :
                              ticket.status === 'in_progress' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300' :
                              'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
                            }`}>
                              {ticket.status === 'open' ? 'Açık' :
                               ticket.status === 'in_progress' ? 'İşlemde' : 'Çözüldü'}
                            </span>
                          </div>
                          <p className="text-sm text-gray-600 dark:text-gray-400 truncate">
                            {ticket.title || 'Başlıksız Talep'}
                          </p>
                        </div>
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          {format(new Date(ticket.created_at), 'dd MMM', { locale: tr })}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Son Ödemeler */}
              <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Son Ödemeler
                  </h3>
                  <button
                    onClick={() => setCurrentPage('payments')}
                    className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
                  >
                    Tümünü Gör
                  </button>
                </div>
                
                {customerPayments.length === 0 ? (
                  <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                    <CreditCard className="w-12 h-12 mx-auto mb-2 opacity-50" />
                    <p>Henüz ödeme yapmadınız</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {customerPayments.slice(0, 3).map((payment) => (
                      <div
                        key={payment.id}
                        className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 cursor-pointer transition-colors"
                        onClick={() => setCurrentPage('payments')}
                      >
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-sm font-medium text-gray-900 dark:text-white">
                              #{payment.invoice_number || payment.id.slice(0, 8)}
                            </span>
                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                              payment.status === 'completed' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300' :
                              payment.status === 'pending' ? 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300' :
                              'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300'
                            }`}>
                              {payment.status === 'completed' ? 'Tamamlandı' :
                               payment.status === 'pending' ? 'Bekliyor' : 'Başarısız'}
                            </span>
                          </div>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            {payment.description || 'Ödeme'}
                          </p>
                        </div>
                        <div className="text-right">
                          <span className="text-sm font-medium text-gray-900 dark:text-white">
                            {formatCurrency(parseFloat(payment.amount))}
                          </span>
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            {format(new Date(payment.created_at), 'dd MMM', { locale: tr })}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Tema Ayarları */}
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                <Palette className="w-5 h-5 mr-2 text-purple-600 dark:text-purple-400" />
                Tema Ayarları
              </h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">Mevcut Tema</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {theme === 'light' ? 'Açık Tema' : theme === 'dark' ? 'Koyu Tema' : 'Otomatik Tema'}
                    </p>
                  </div>
                  <div className="flex items-center space-x-2">
                    {isDark ? <Moon className="w-5 h-5 text-gray-400" /> : <Sun className="w-5 h-5 text-gray-400" />}
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      {isDark ? 'Koyu' : 'Açık'}
                    </span>
                  </div>
                </div>
                
                <div className="grid grid-cols-3 gap-3">
                  <button
                    onClick={() => setTheme('light')}
                    className={`p-3 border-2 rounded-lg transition-colors ${
                      theme === 'light'
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                        : 'border-gray-300 dark:border-gray-600 hover:border-gray-400'
                    }`}
                  >
                    <div className="flex items-center justify-center mb-2">
                      <Sun className="w-5 h-5 text-yellow-500" />
                    </div>
                    <p className="text-center text-xs font-medium text-gray-900 dark:text-white">Açık</p>
                  </button>
                  
                  <button
                    onClick={() => setTheme('dark')}
                    className={`p-3 border-2 rounded-lg transition-colors ${
                      theme === 'dark'
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                        : 'border-gray-300 dark:border-gray-600 hover:border-gray-400'
                    }`}
                  >
                    <div className="flex items-center justify-center mb-2">
                      <Moon className="w-5 h-5 text-blue-500" />
                    </div>
                    <p className="text-center text-xs font-medium text-gray-900 dark:text-white">Koyu</p>
                  </button>
                  
                  <button
                    onClick={() => setTheme('auto')}
                    className={`p-3 border-2 rounded-lg transition-colors ${
                      theme === 'auto'
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                        : 'border-gray-300 dark:border-gray-600 hover:border-gray-400'
                    }`}
                  >
                    <div className="flex items-center justify-center mb-2">
                      <Settings className="w-5 h-5 text-gray-500" />
                    </div>
                    <p className="text-center text-xs font-medium text-gray-900 dark:text-white">Otomatik</p>
                  </button>
                </div>
              </div>
            </div>

                         {/* Bildirim Ayarları */}
             <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
               <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                 <Bell className="w-5 h-5 mr-2 text-blue-600 dark:text-blue-400" />
                 Bildirim Ayarları
               </h3>
               <div className="space-y-4">
                 <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                   <div>
                     <p className="text-sm font-medium text-gray-900 dark:text-white">Otomatik Yönlendirme</p>
                     <p className="text-xs text-gray-500 dark:text-gray-400">
                       Ödeme hatırlatmalarında canlı destek sekmesine otomatik yönlendirme
                     </p>
                   </div>
                   <button
                     onClick={() => updateNotificationPreferences({ 
                       autoRedirect: !notificationPreferences.autoRedirect 
                     })}
                     className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                       notificationPreferences.autoRedirect 
                         ? 'bg-blue-600' 
                         : 'bg-gray-300 dark:bg-gray-600'
                     }`}
                   >
                     <span
                       className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                         notificationPreferences.autoRedirect ? 'translate-x-6' : 'translate-x-1'
                       }`}
                     />
                   </button>
                 </div>
                 
                 <div className="text-sm text-gray-600 dark:text-gray-400">
                   <p>• İlk 2 bildirimde otomatik yönlendirme yapılır</p>
                   <p>• Aynı bildirim 5 dakika içinde tekrar gösterilmez</p>
                   <p>• Toplam {notificationPreferences.reminderCount} bildirim aldınız</p>
                 </div>
                 
                 <button
                   onClick={() => updateNotificationPreferences({
                     reminderCount: 0,
                     lastPaymentReminder: null,
                     lastRedirectTime: null
                   })}
                   className="px-4 py-2 text-sm bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                 >
                   Bildirim Sayacını Sıfırla
                 </button>
               </div>
             </div>

             {/* Quick Actions */}
             <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
               <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                 Hızlı İşlemler
               </h3>
               <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <button
                  onClick={() => setCurrentPage('tickets')}
                  className="flex items-center space-x-3 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/40 transition-colors"
                >
                  <Plus className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                  <div className="text-left">
                    <p className="font-medium text-gray-900 dark:text-white">Yeni Talep</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Destek talebi oluştur</p>
                  </div>
                </button>
                
                <button
                  onClick={() => setCurrentPage('payments')}
                  className="flex items-center space-x-3 p-4 bg-green-50 dark:bg-green-900/20 rounded-lg hover:bg-green-100 dark:hover:bg-green-900/40 transition-colors"
                >
                  <CreditCard className="w-6 h-6 text-green-600 dark:text-green-400" />
                  <div className="text-left">
                    <p className="font-medium text-gray-900 dark:text-white">Ödeme Yap</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Bekleyen ödemeleri gör</p>
                  </div>
                </button>
                
                <button
                  onClick={() => setCurrentPage('profile')}
                  className="flex items-center space-x-3 p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg hover:bg-purple-100 dark:hover:bg-purple-900/40 transition-colors"
                >
                  <Settings className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                  <div className="text-left">
                    <p className="font-medium text-gray-900 dark:text-white">Profil</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Bilgileri güncelle</p>
                  </div>
                </button>

                <button
                  onClick={() => {
                    // Hızlı ödeme işlemi
                    setCurrentPage('payments');
                    // Ödeme modalını açmak için custom event
                    setTimeout(() => {
                      window.dispatchEvent(new CustomEvent('openPaymentModal'));
                    }, 100);
                  }}
                  className="flex items-center space-x-3 p-4 bg-orange-50 dark:bg-orange-900/20 rounded-lg hover:bg-orange-100 dark:hover:bg-orange-900/40 transition-colors"
                >
                  <DollarSign className="w-6 h-6 text-orange-600 dark:text-orange-400" />
                  <div className="text-left">
                    <p className="font-medium text-gray-900 dark:text-white">Hızlı Ödeme</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Acil ödeme yap</p>
                  </div>
                </button>

                <button
                  onClick={() => {
                    setCurrentPage('live-chat');
                    // Canlı destek için özel mesaj gönder
                    setTimeout(() => {
                      const event = new CustomEvent('startPaymentSupport', {
                        detail: {
                          message: 'Akıllı ödeme planı ve hatırlatma sistemi hakkında bilgi almak istiyorum.',
                          customerData: customerData
                        }
                      });
                      window.dispatchEvent(event);
                    }, 100);
                  }}
                  className="flex items-center space-x-3 p-4 bg-green-50 dark:bg-green-900/20 rounded-lg hover:bg-green-100 dark:hover:bg-green-900/40 transition-colors"
                >
                  <Bell className="w-6 h-6 text-green-600 dark:text-green-400" />
                  <div className="text-left">
                    <p className="font-medium text-gray-900 dark:text-white">Akıllı Ödeme</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Canlı Destek ile Planla</p>
                  </div>
                </button>

                <button
                  onClick={() => setCurrentPage('chat-history')}
                  className="flex items-center space-x-3 p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg hover:bg-purple-100 dark:hover:bg-purple-900/40 transition-colors"
                >
                  <MessageSquare className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                  <div className="text-left">
                    <p className="font-medium text-gray-900 dark:text-white">Sohbet Geçmişi</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Transcript & Özetler</p>
                  </div>
                </button>

                <button
                  onClick={() => setCurrentPage('promotions')}
                  className="flex items-center space-x-3 p-4 bg-orange-50 dark:bg-orange-900/20 rounded-lg hover:bg-orange-100 dark:hover:bg-orange-900/40 transition-colors"
                >
                  <Tag className="w-6 h-6 text-orange-600 dark:text-orange-400" />
                  <div className="text-left">
                    <p className="font-medium text-gray-900 dark:text-white">Promosyonlar</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">İndirimler & Referans</p>
                  </div>
                </button>
              </div>
            </div>
          </div>
        )}

        {currentPage === 'tickets' && (
          <CustomerTickets
            customerData={customerData}
            tickets={tickets}
            payments={payments}
            onBack={() => {
              setCurrentPage('dashboard');
              // Talepleri yeniden yükle
              fetchTickets();
            }}
            onRefresh={fetchTickets}
            currentUser={customerData}
          />
        )}

        {currentPage === 'payments' && (
          <CustomerPayments
            customerData={customerData}
            payments={payments}
            onBack={() => setCurrentPage('dashboard')}
          />
        )}

        {currentPage === 'profile' && (
          <CustomerProfile
            customerData={customerData}
            tickets={tickets}
            payments={payments}
            onBack={() => setCurrentPage('dashboard')}
          />
        )}

                 {currentPage === 'live-chat' && (
           <div className="h-full">
             {/* Canlı Destek Alanı - Tam Genişlik */}
             <div className="h-full">
               <CustomerLiveChat
                 customerId={customerData?.id}
                 customerName={customerData?.name}
                 customerEmail={customerData?.email}
                 className="h-full"
               />
             </div>
           </div>
         )}

        {currentPage === 'payment-reminder' && (
          <SmartPaymentReminder
            customerData={customerData}
            payments={payments}
            onBack={() => setCurrentPage('dashboard')}
          />
        )}

        {currentPage === 'chat-history' && (
          <ChatHistory
            customerData={customerData}
            tickets={customerTickets}
            onBack={() => setCurrentPage('dashboard')}
          />
        )}

        {currentPage === 'promotions' && (
          <CustomerPromotions
            customerData={customerData}
            onBack={() => setCurrentPage('dashboard')}
          />
        )}
      </main>

      {/* Interactive Tutorial System */}
      <InteractiveTutorial />
    </div>
  );
};

export default CustomerPortal;
