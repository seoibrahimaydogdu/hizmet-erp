import React, { useState, useEffect } from 'react';
import { 
  Bell, 
  CreditCard, 
  Calendar, 
  DollarSign, 
  AlertTriangle, 
  CheckCircle, 
  Clock,
  TrendingUp,
  TrendingDown,
  Users,
  Mail,
  MessageSquare,
  Settings,
  Plus,
  Edit,
  Trash2,
  Download,
  BarChart3,
  X
} from 'lucide-react';
import { format, addDays, addWeeks, differenceInDays } from 'date-fns';
import { tr } from 'date-fns/locale';
import { toast } from 'react-hot-toast';
import { supabase } from '../lib/supabase';
import { formatCurrency } from '../lib/currency';

interface SmartPaymentReminderProps {
  customerData: any;
  payments: any[];
  onBack?: () => void;
}

interface PaymentPlan {
  id: string;
  customer_id: string;
  total_amount: number;
  remaining_amount: number;
  installment_count: number;
  current_installment: number;
  installment_amount: number;
  start_date: string;
  next_due_date: string;
  status: 'active' | 'completed' | 'overdue' | 'cancelled';
  created_at: string;
}

interface ReminderSchedule {
  id: string;
  customer_id: string;
  payment_id: string;
  reminder_type: 'email' | 'sms' | 'push' | 'in_app';
  reminder_date: string;
  status: 'pending' | 'sent' | 'cancelled';
  message_template: string;
  created_at: string;
}

const SmartPaymentReminder: React.FC<SmartPaymentReminderProps> = ({
  customerData,
  payments,
  onBack
}) => {
  const [activeTab, setActiveTab] = useState('overview');
  const [showPaymentPlanModal, setShowPaymentPlanModal] = useState(false);

  const [selectedPayment, setSelectedPayment] = useState<any>(null);
  const [paymentPlans, setPaymentPlans] = useState<PaymentPlan[]>([]);
  const [reminderSchedules, setReminderSchedules] = useState<ReminderSchedule[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Müşteriye ait ödemeleri filtrele
  const customerPayments = payments.filter(p => p.customer_id === customerData?.id);

  // Ödeme istatistikleri
  const paymentStats = {
    total: customerPayments.length,
    pending: customerPayments.filter(p => p.status === 'pending').length,
    overdue: customerPayments.filter(p => p.status === 'overdue').length,
    completed: customerPayments.filter(p => p.status === 'completed').length,
    totalAmount: customerPayments
      .filter(p => p.status === 'completed')
      .reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0),
    overdueAmount: customerPayments
      .filter(p => p.status === 'overdue')
      .reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0)
  };

  // Yaklaşan ödemeler
  const upcomingPayments = customerPayments
    .filter(p => p.status === 'pending' && p.due_date)
    .sort((a, b) => new Date(a.due_date).getTime() - new Date(b.due_date).getTime())
    .slice(0, 5);

  // Geciken ödemeler
  const overduePayments = customerPayments
    .filter(p => p.status === 'overdue')
    .sort((a, b) => new Date(a.due_date).getTime() - new Date(b.due_date).getTime());

  // Ödeme planları yükle
  useEffect(() => {
    loadPaymentPlans();
    loadReminderSchedules();
  }, [customerData]);

  const loadPaymentPlans = async () => {
    if (!customerData?.id) return;

    try {
      const { data, error } = await supabase
        .from('payment_plans')
        .select('*')
        .eq('customer_id', customerData.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPaymentPlans(data || []);
    } catch (error) {
      console.error('Ödeme planları yüklenirken hata:', error);
    }
  };

  const loadReminderSchedules = async () => {
    if (!customerData?.id) return;

    try {
      const { data, error } = await supabase
        .from('reminder_schedules')
        .select('*')
        .eq('customer_id', customerData.id)
        .order('reminder_date', { ascending: true });

      if (error) throw error;
      setReminderSchedules(data || []);
    } catch (error) {
      console.error('Hatırlatma planları yüklenirken hata:', error);
    }
  };

  // Akıllı ödeme planı oluştur
  const createSmartPaymentPlan = async (payment: any, installmentCount: number) => {
    setIsLoading(true);
    
    try {
      const totalAmount = parseFloat(payment.amount);
      const installmentAmount = totalAmount / installmentCount;
      const startDate = new Date();
      const nextDueDate = addWeeks(startDate, 2); // İlk taksit 2 hafta sonra

      const { data, error } = await supabase
        .from('payment_plans')
        .insert({
          customer_id: customerData.id,
          payment_id: payment.id,
          total_amount: totalAmount,
          remaining_amount: totalAmount,
          installment_count: installmentCount,
          current_installment: 0,
          installment_amount: installmentAmount,
          start_date: startDate.toISOString(),
          next_due_date: nextDueDate.toISOString(),
          status: 'active'
        })
        .select()
        .single();

      if (error) throw error;

      // Otomatik hatırlatma planları oluştur
      await createAutomaticReminders(data.id, nextDueDate);

      toast.success('Akıllı ödeme planı oluşturuldu');
      loadPaymentPlans();
      setShowPaymentPlanModal(false);
    } catch (error) {
      console.error('Ödeme planı oluşturulurken hata:', error);
      toast.error('Ödeme planı oluşturulamadı');
    } finally {
      setIsLoading(false);
    }
  };

  // Otomatik hatırlatma planları oluştur
  const createAutomaticReminders = async (planId: string, dueDate: Date) => {
    const reminderDates = [
      addDays(dueDate, -7),  // 1 hafta önce
      addDays(dueDate, -3),  // 3 gün önce
      addDays(dueDate, -1),  // 1 gün önce
      dueDate,               // Vade günü
      addDays(dueDate, 1),   // 1 gün sonra
      addDays(dueDate, 3),   // 3 gün sonra
      addDays(dueDate, 7)    // 1 hafta sonra
    ];

    const reminders = reminderDates.map((date, index) => ({
      customer_id: customerData.id,
      payment_plan_id: planId,
      reminder_type: index < 3 ? 'email' : 'sms',
      reminder_date: date.toISOString(),
      status: 'pending',
      message_template: getReminderTemplate(index, date)
    }));

    try {
      const { error } = await supabase
        .from('reminder_schedules')
        .insert(reminders);

      if (error) throw error;
      loadReminderSchedules();
    } catch (error) {
      console.error('Hatırlatma planları oluşturulurken hata:', error);
    }
  };

  // Hatırlatma mesaj şablonları
  const getReminderTemplate = (index: number, dueDate: Date): string => {
    const templates = [
      `Sayın ${customerData?.name}, ödemeniz ${format(dueDate, 'dd MMMM yyyy', { locale: tr })} tarihinde vadesi dolacak. Lütfen ödemenizi zamanında yapın.`,
      `Ödemenizin vadesi ${format(dueDate, 'dd MMMM yyyy', { locale: tr })} tarihinde doluyor. Ödemenizi yapmayı unutmayın.`,
      `Yarın ödemenizin son günü! ${format(dueDate, 'dd MMMM yyyy', { locale: tr })} tarihine kadar ödemenizi yapabilirsiniz.`,
      `Ödemenizin vadesi bugün doluyor. Lütfen ödemenizi yapın.`,
      `Ödemenizin vadesi dün doldu. Lütfen en kısa sürede ödemenizi yapın.`,
      `Ödemeniz 3 gün gecikti. Lütfen acil olarak ödemenizi yapın.`,
      `Ödemeniz 1 hafta gecikti. Lütfen hemen ödemenizi yapın.`
    ];
    return templates[index] || templates[0];
  };

  // Ödeme planı durumu
  const getPlanStatusInfo = (plan: PaymentPlan) => {
    const info = {
      active: {
        icon: <Clock className="w-4 h-4 text-blue-500" />,
        color: 'text-blue-600',
        bgColor: 'bg-blue-100',
        text: 'Aktif'
      },
      completed: {
        icon: <CheckCircle className="w-4 h-4 text-green-500" />,
        color: 'text-green-600',
        bgColor: 'bg-green-100',
        text: 'Tamamlandı'
      },
      overdue: {
        icon: <AlertTriangle className="w-4 h-4 text-red-500" />,
        color: 'text-red-600',
        bgColor: 'bg-red-100',
        text: 'Gecikmiş'
      },
      cancelled: {
        icon: <X className="w-4 h-4 text-gray-500" />,
        color: 'text-gray-600',
        bgColor: 'bg-gray-100',
        text: 'İptal Edildi'
      }
    };
    return info[plan.status] || info.active;
  };

  // Ana dashboard görünümü
  const renderOverview = () => (
    <div className="space-y-6">
      {/* İstatistikler */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Toplam Ödeme</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mt-2">
                {formatCurrency(paymentStats.totalAmount)}
              </p>
            </div>
            <div className="bg-green-500 p-3 rounded-lg">
              <DollarSign className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Bekleyen Ödeme</p>
              <p className="text-2xl font-bold text-orange-600 mt-2">
                {paymentStats.pending}
              </p>
            </div>
            <div className="bg-orange-500 p-3 rounded-lg">
              <Clock className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Geciken Ödeme</p>
              <p className="text-2xl font-bold text-red-600 mt-2">
                {paymentStats.overdue}
              </p>
            </div>
            <div className="bg-red-500 p-3 rounded-lg">
              <AlertTriangle className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Aktif Plan</p>
              <p className="text-2xl font-bold text-blue-600 mt-2">
                {paymentPlans.filter(p => p.status === 'active').length}
              </p>
            </div>
            <div className="bg-blue-500 p-3 rounded-lg">
              <CreditCard className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>
      </div>

      {/* Geciken Ödemeler */}
      {overduePayments.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-red-500" />
              Geciken Ödemeler
            </h3>
            <span className="text-sm text-red-600 font-medium">
              {formatCurrency(paymentStats.overdueAmount)}
            </span>
          </div>
          <div className="space-y-3">
            {overduePayments.slice(0, 3).map((payment) => (
              <div key={payment.id} className="flex items-center justify-between p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">
                    {payment.invoice_number || 'Ödeme'}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Vade: {format(new Date(payment.due_date), 'dd MMM yyyy', { locale: tr })}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-red-600">
                    {formatCurrency(payment.amount)}
                  </p>
                  <p className="text-xs text-red-500">
                    {differenceInDays(new Date(), new Date(payment.due_date))} gün gecikmiş
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Yaklaşan Ödemeler */}
      {upcomingPayments.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-blue-500" />
            Yaklaşan Ödemeler
          </h3>
          <div className="space-y-3">
            {upcomingPayments.map((payment) => (
              <div key={payment.id} className="flex items-center justify-between p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">
                    {payment.invoice_number || 'Ödeme'}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Vade: {format(new Date(payment.due_date), 'dd MMM yyyy', { locale: tr })}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-blue-600">
                    {formatCurrency(payment.amount)}
                  </p>
                  <p className="text-xs text-blue-500">
                    {differenceInDays(new Date(payment.due_date), new Date())} gün kaldı
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );

  // Ödeme planları görünümü
  const renderPaymentPlans = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          Ödeme Planları
        </h3>
        <button
          onClick={() => setShowPaymentPlanModal(true)}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Yeni Plan
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {paymentPlans.map((plan) => {
          const statusInfo = getPlanStatusInfo(plan);
          const progress = ((plan.total_amount - plan.remaining_amount) / plan.total_amount) * 100;
          
          return (
            <div key={plan.id} className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <div className="flex items-center justify-between mb-4">
                <div className={`flex items-center gap-2 px-2 py-1 rounded-full text-xs font-medium ${statusInfo.bgColor} ${statusInfo.color}`}>
                  {statusInfo.icon}
                  {statusInfo.text}
                </div>
                <span className="text-sm text-gray-500">
                  {plan.current_installment}/{plan.installment_count}
                </span>
              </div>

              <div className="mb-4">
                <p className="text-sm text-gray-600 dark:text-gray-400">Toplam Tutar</p>
                <p className="text-xl font-bold text-gray-900 dark:text-white">
                  {formatCurrency(plan.total_amount)}
                </p>
              </div>

              <div className="mb-4">
                <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400 mb-1">
                  <span>İlerleme</span>
                  <span>%{Math.round(progress)}</span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                  <div 
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>

              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Kalan Tutar:</span>
                  <span className="font-medium text-gray-900 dark:text-white">
                    {formatCurrency(plan.remaining_amount)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Taksit Tutarı:</span>
                  <span className="font-medium text-gray-900 dark:text-white">
                    {formatCurrency(plan.installment_amount)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Sonraki Vade:</span>
                  <span className="font-medium text-gray-900 dark:text-white">
                    {format(new Date(plan.next_due_date), 'dd MMM yyyy', { locale: tr })}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );

  // Hatırlatma planları görünümü
  const renderReminders = () => (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
        Hatırlatma Planları
      </h3>

      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Tarih
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Tip
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Durum
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Mesaj
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {reminderSchedules.map((reminder) => (
                <tr key={reminder.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                    {format(new Date(reminder.reminder_date), 'dd MMM yyyy HH:mm', { locale: tr })}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      reminder.reminder_type === 'email' 
                        ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                        : 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                    }`}>
                      {reminder.reminder_type === 'email' ? 'E-posta' : 'SMS'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      reminder.status === 'sent' 
                        ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                        : reminder.status === 'pending'
                        ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                        : 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
                    }`}>
                      {reminder.status === 'sent' ? 'Gönderildi' : 
                       reminder.status === 'pending' ? 'Bekliyor' : 'İptal'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">
                    <div className="max-w-xs truncate">
                      {reminder.message_template}
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

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Zap className="w-8 h-8 text-blue-500" />
            Akıllı Ödeme Yönetimi
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Otomatik hatırlatmalar ve esnek ödeme planları
          </p>
        </div>
        {onBack && (
          <button
            onClick={onBack}
            className="flex items-center gap-2 px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
          >
            ← Geri
          </button>
        )}
      </div>

      {/* Tab Navigation */}
      <div className="mb-8">
        <nav className="flex space-x-8 border-b border-gray-200 dark:border-gray-700">
          {[
            { id: 'overview', name: 'Genel Bakış', icon: BarChart3 },
            { id: 'plans', name: 'Ödeme Planları', icon: CreditCard },
            { id: 'reminders', name: 'Hatırlatmalar', icon: Bell }
          ].map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.name}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="space-y-6">
        {activeTab === 'overview' && renderOverview()}
        {activeTab === 'plans' && renderPaymentPlans()}
        {activeTab === 'reminders' && renderReminders()}
      </div>

      {/* Ödeme Planı Modal */}
      {showPaymentPlanModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-md w-full">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                  Yeni Ödeme Planı
                </h3>
                <button
                  onClick={() => setShowPaymentPlanModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Ödeme Seçin
                  </label>
                  <select
                    className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    onChange={(e) => {
                      const payment = customerPayments.find(p => p.id === e.target.value);
                      setSelectedPayment(payment);
                    }}
                  >
                    <option value="">Ödeme seçin</option>
                    {customerPayments
                      .filter(p => p.status === 'pending' || p.status === 'overdue')
                      .map((payment) => (
                        <option key={payment.id} value={payment.id}>
                          {payment.invoice_number || 'Ödeme'} - {formatCurrency(payment.amount)}
                        </option>
                      ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Taksit Sayısı
                  </label>
                  <select
                    className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    defaultValue="3"
                  >
                    <option value="2">2 Taksit</option>
                    <option value="3">3 Taksit</option>
                    <option value="6">6 Taksit</option>
                    <option value="12">12 Taksit</option>
                  </select>
                </div>

                {selectedPayment && (
                  <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                    <p className="text-sm text-blue-800 dark:text-blue-200">
                      <strong>Seçilen Ödeme:</strong> {selectedPayment.invoice_number || 'Ödeme'}
                    </p>
                    <p className="text-sm text-blue-800 dark:text-blue-200">
                      <strong>Tutar:</strong> {formatCurrency(selectedPayment.amount)}
                    </p>
                  </div>
                )}
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => {
                    if (selectedPayment) {
                      createSmartPaymentPlan(selectedPayment, 3);
                    }
                  }}
                  disabled={!selectedPayment || isLoading}
                  className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {isLoading ? 'Oluşturuluyor...' : 'Plan Oluştur'}
                </button>
                <button
                  onClick={() => setShowPaymentPlanModal(false)}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  İptal
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SmartPaymentReminder;
