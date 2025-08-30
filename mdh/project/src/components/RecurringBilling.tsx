import React, { useState, useEffect } from 'react';
import { 
  Calendar, 
  DollarSign, 
  RefreshCw, 
  Plus, 
  Settings, 
  Play, 
  Pause, 
  StopCircle,
  AlertTriangle,
  CheckCircle,
  Clock,
  Users,
  FileText,
  BarChart3,
  TrendingUp,
  Zap,
  X,
  Edit,
  Trash2,
  Eye,
  Download,
  CreditCard,
  Repeat,
  History
} from 'lucide-react';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';
import { toast } from 'react-hot-toast';
import { supabase } from '../lib/supabase';
import { formatCurrency } from '../lib/currency';
import RecurringBillingTemplates from './RecurringBillingTemplates';

interface RecurringInvoiceTemplate {
  id: string;
  name: string;
  description: string;
  billing_cycle: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly';
  amount: number;
  currency: string;
  tax_rate: number;
  auto_generate: boolean;
  next_generation_date: string;
  last_generated_at: string;
  is_active: boolean;
  created_at: string;
}

interface CustomerSubscription {
  id: string;
  customer_id: string;
  template_id: string;
  subscription_name: string;
  billing_cycle: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly';
  amount: number;
  currency: string;
  start_date: string;
  end_date: string;
  next_billing_date: string;
  auto_renew: boolean;
  status: 'active' | 'paused' | 'cancelled' | 'expired';
  notes: string;
  created_at: string;
  customer?: {
    name: string;
    email: string;
  };
  template?: {
    name: string;
  };
}

interface RecurringInvoiceHistory {
  id: string;
  subscription_id: string;
  template_id: string;
  invoice_id: string;
  billing_cycle: string;
  amount: number;
  generated_at: string;
  due_date: string;
  status: 'generated' | 'sent' | 'paid' | 'overdue' | 'cancelled';
  error_message: string;
  retry_count: number;
}

const RecurringBilling: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'overview' | 'templates' | 'subscriptions' | 'history' | 'settings'>('overview');
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  
  // Data states
  const [templates, setTemplates] = useState<RecurringInvoiceTemplate[]>([]);
  const [subscriptions, setSubscriptions] = useState<CustomerSubscription[]>([]);
  const [history, setHistory] = useState<RecurringInvoiceHistory[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Load templates
      const { data: templatesData } = await supabase
        .from('recurring_invoice_templates')
        .select('*')
        .order('created_at', { ascending: false });

      // Load subscriptions with customer and template info
      const { data: subscriptionsData } = await supabase
        .from('customer_subscriptions')
        .select(`
          *,
          customer:customers(name, email),
          template:recurring_invoice_templates(name)
        `)
        .order('created_at', { ascending: false });

      // Load history
      const { data: historyData } = await supabase
        .from('recurring_invoice_history')
        .select('*')
        .order('generated_at', { ascending: false });

      // Load customers
      const { data: customersData } = await supabase
        .from('customers')
        .select('id, name, email')
        .order('name');

      setTemplates(templatesData || []);
      setSubscriptions(subscriptionsData || []);
      setHistory(historyData || []);
      setCustomers(customersData || []);
    } catch (error) {
      console.error('Data loading error:', error);
      toast.error('Veriler yüklenirken hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  const generateInvoices = async () => {
    try {
      setGenerating(true);
      
      const { data, error } = await supabase.rpc('generate_recurring_invoices');
      
      if (error) throw error;
      
      toast.success(`${data.generated_count} fatura oluşturuldu`);
      loadData(); // Reload data
    } catch (error) {
      console.error('Invoice generation error:', error);
      toast.error('Fatura oluşturulurken hata oluştu');
    } finally {
      setGenerating(false);
    }
  };

  const getStats = () => {
    const activeSubscriptions = subscriptions.filter(s => s.status === 'active');
    const pendingInvoices = history.filter(h => h.status === 'generated' || h.status === 'sent');
    const totalRevenue = subscriptions.reduce((sum, s) => sum + s.amount, 0);

    return {
      totalTemplates: templates.length,
      activeSubscriptions: activeSubscriptions.length,
      pendingInvoices: pendingInvoices.length,
      totalRevenue,
      nextBilling: subscriptions
        .filter(s => s.status === 'active')
        .sort((a, b) => new Date(a.next_billing_date).getTime() - new Date(b.next_billing_date).getTime())[0]
    };
  };

  const stats = getStats();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="w-8 h-8 animate-spin text-blue-600" />
        <span className="ml-2 text-gray-600">Yükleniyor...</span>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Otomatik Fatura Sistemi</h1>
          <p className="text-gray-600 dark:text-gray-400">Tekrarlayan faturaları yönetin ve otomatik oluşturun</p>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={generateInvoices}
            disabled={generating}
            className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50"
          >
            <Zap className="w-4 h-4 mr-2" />
            {generating ? 'Oluşturuluyor...' : 'Faturaları Oluştur'}
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Toplam Şablon</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.totalTemplates}</p>
            </div>
            <div className="p-3 bg-blue-100 dark:bg-blue-900 rounded-lg">
              <FileText className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Aktif Abonelik</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.activeSubscriptions}</p>
            </div>
            <div className="p-3 bg-green-100 dark:bg-green-900 rounded-lg">
              <Users className="w-6 h-6 text-green-600 dark:text-green-400" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Bekleyen Fatura</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.pendingInvoices}</p>
            </div>
            <div className="p-3 bg-orange-100 dark:bg-orange-900 rounded-lg">
              <Clock className="w-6 h-6 text-orange-600 dark:text-orange-400" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Toplam Gelir</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{formatCurrency(stats.totalRevenue)}</p>
            </div>
            <div className="p-3 bg-purple-100 dark:bg-purple-900 rounded-lg">
              <DollarSign className="w-6 h-6 text-purple-600 dark:text-purple-400" />
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
        <div className="border-b border-gray-200 dark:border-gray-700">
          <nav className="flex space-x-8 px-6">
            {[
              { id: 'overview', label: 'Genel Bakış', icon: BarChart3 },
              { id: 'templates', label: 'Şablonlar', icon: FileText },
              { id: 'subscriptions', label: 'Abonelikler', icon: Users },
              { id: 'history', label: 'Geçmiş', icon: Clock },
              { id: 'settings', label: 'Ayarlar', icon: Settings }
            ].map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                  }`}
                >
                  <Icon className="w-4 h-4 mr-2" />
                  {tab.label}
                </button>
              );
            })}
          </nav>
        </div>

        <div className="p-6">
          {activeTab === 'overview' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Upcoming Invoices */}
                <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-6">
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                    Yaklaşan Faturalar
                  </h3>
                  <div className="space-y-3">
                    {subscriptions
                      .filter(s => s.status === 'active')
                      .sort((a, b) => new Date(a.next_billing_date).getTime() - new Date(b.next_billing_date).getTime())
                      .slice(0, 5)
                      .map((subscription) => (
                        <div key={subscription.id} className="flex items-center justify-between p-3 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                          <div>
                            <p className="font-medium text-gray-900 dark:text-white">
                              {subscription.customer?.name || 'Müşteri'}
                            </p>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                              {subscription.subscription_name}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="font-medium text-gray-900 dark:text-white">
                              {formatCurrency(subscription.amount)}
                            </p>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                              {format(new Date(subscription.next_billing_date), 'dd MMM yyyy', { locale: tr })}
                            </p>
                          </div>
                        </div>
                      ))}
                  </div>
                </div>

                {/* Recent Activity */}
                <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-6">
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                    Son Aktiviteler
                  </h3>
                  <div className="space-y-3">
                    {history.slice(0, 5).map((item) => (
                      <div key={item.id} className="flex items-center space-x-3 p-3 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                        <div className={`p-2 rounded-full ${
                          item.status === 'paid' ? 'bg-green-100 dark:bg-green-900' :
                          item.status === 'overdue' ? 'bg-red-100 dark:bg-red-900' :
                          'bg-blue-100 dark:bg-blue-900'
                        }`}>
                          {item.status === 'paid' ? (
                            <CheckCircle className="w-4 h-4 text-green-600 dark:text-green-400" />
                          ) : item.status === 'overdue' ? (
                            <AlertTriangle className="w-4 h-4 text-red-600 dark:text-red-400" />
                          ) : (
                            <Clock className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                          )}
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-900 dark:text-white">
                            {formatCurrency(item.amount)} - {item.status}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            {format(new Date(item.generated_at), 'dd MMM yyyy HH:mm', { locale: tr })}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'templates' && (
            <RecurringBillingTemplates />
          )}

          {activeTab === 'subscriptions' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                  Müşteri Abonelikleri
                </h3>
                <button className="flex items-center space-x-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors">
                  <Plus className="w-4 h-4" />
                  <span>Yeni Abonelik</span>
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                  <thead className="bg-gray-50 dark:bg-gray-800">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Müşteri
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Abonelik
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Tutar
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Sonraki Fatura
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Durum
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        İşlemler
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                    {subscriptions.map((subscription) => (
                      <tr key={subscription.id}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="text-sm font-medium text-gray-900 dark:text-white">
                              {subscription.customer?.name || 'Müşteri'}
                            </div>
                            <div className="text-sm text-gray-500 dark:text-gray-400">
                              {subscription.customer?.email}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900 dark:text-white">
                            {subscription.subscription_name}
                          </div>
                          <div className="text-sm text-gray-500 dark:text-gray-400">
                            {subscription.template?.name}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                          {formatCurrency(subscription.amount)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                          {format(new Date(subscription.next_billing_date), 'dd MMM yyyy', { locale: tr })}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            subscription.status === 'active' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' :
                            subscription.status === 'paused' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' :
                            subscription.status === 'cancelled' ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' :
                            'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
                          }`}>
                            {subscription.status === 'active' ? 'Aktif' :
                             subscription.status === 'paused' ? 'Duraklatıldı' :
                             subscription.status === 'cancelled' ? 'İptal Edildi' :
                             'Süresi Doldu'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex space-x-2">
                            <button className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300">
                              <Edit className="w-4 h-4" />
                            </button>
                            <button className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300">
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'history' && (
            <div className="space-y-6">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                Fatura Geçmişi
              </h3>

              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                  <thead className="bg-gray-50 dark:bg-gray-800">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Tarih
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Tutar
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Vade Tarihi
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Durum
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        İşlemler
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                    {history.map((item) => (
                      <tr key={item.id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                          {format(new Date(item.generated_at), 'dd MMM yyyy HH:mm', { locale: tr })}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                          {formatCurrency(item.amount)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                          {format(new Date(item.due_date), 'dd MMM yyyy', { locale: tr })}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            item.status === 'paid' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' :
                            item.status === 'overdue' ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' :
                            item.status === 'sent' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' :
                            'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
                          }`}>
                            {item.status === 'paid' ? 'Ödendi' :
                             item.status === 'overdue' ? 'Gecikmiş' :
                             item.status === 'sent' ? 'Gönderildi' :
                             'Oluşturuldu'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex space-x-2">
                            <button className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300">
                              <Eye className="w-4 h-4" />
                            </button>
                            <button className="text-green-600 hover:text-green-900 dark:text-green-400 dark:hover:text-green-300">
                              <Download className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'settings' && (
            <div className="space-y-6">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                Otomatik Fatura Ayarları
              </h3>
              
              <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-medium text-gray-900 dark:text-white">
                        Otomatik Fatura Oluşturma
                      </h4>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Vadesi gelen abonelikler için otomatik fatura oluştur
                      </p>
                    </div>
                    <button className="relative inline-flex h-6 w-11 items-center rounded-full bg-gray-200 dark:bg-gray-700">
                      <span className="inline-block h-4 w-4 transform rounded-full bg-white transition translate-x-1"></span>
                    </button>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-medium text-gray-900 dark:text-white">
                        E-posta Bildirimleri
                      </h4>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Fatura oluşturulduğunda müşteriye e-posta gönder
                      </p>
                    </div>
                    <button className="relative inline-flex h-6 w-11 items-center rounded-full bg-gray-200 dark:bg-gray-700">
                      <span className="inline-block h-4 w-4 transform rounded-full bg-white transition translate-x-1"></span>
                    </button>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-medium text-gray-900 dark:text-white">
                        Gecikmiş Fatura Uyarıları
                      </h4>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Vadesi geçen faturalar için uyarı gönder
                      </p>
                    </div>
                    <button className="relative inline-flex h-6 w-11 items-center rounded-full bg-gray-200 dark:bg-gray-700">
                      <span className="inline-block h-4 w-4 transform rounded-full bg-white transition translate-x-1"></span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default RecurringBilling;
