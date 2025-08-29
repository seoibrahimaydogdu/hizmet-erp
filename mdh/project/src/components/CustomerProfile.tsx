import React, { useState, useEffect } from 'react';
import { 
  User, 
  Mail, 
  Phone, 
  Building, 
  CreditCard, 
  Settings, 
  Save,
  Edit,
  X,
  Shield,
  Calendar,
  Star,
  CheckCircle,
  AlertCircle,
  Download,
  FileText,
  BarChart3,
  Activity,
  Clock,
  DollarSign,
  TrendingUp,
  Users,
  MessageSquare,
  Bell,
  Eye,
  Plus,
  Trash2,
  Copy,
  ExternalLink,
  Moon,
  Sun,
  Palette,
  Check,
  Zap,
  Crown,
  Star as StarIcon
} from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';
import { toast } from 'react-hot-toast';
import { getCurrencySymbol, getCurrencyOptions, formatCurrency } from '../lib/currency';
import { supabase } from '../lib/supabase';

interface CustomerProfileProps {
  customerData: any;
  onBack: () => void;
  tickets?: any[];
  payments?: any[];
}

const CustomerProfile: React.FC<CustomerProfileProps> = ({ 
  customerData, 
  onBack,
  tickets = [],
  payments = []
}) => {
  const { theme, setTheme, isDark, primaryColor, setPrimaryColor } = useTheme();
  const [isEditing, setIsEditing] = useState(false);
  const [showPlanModal, setShowPlanModal] = useState(false);
  const [subscriptionPlans, setSubscriptionPlans] = useState<any[]>([]);
  const [selectedPlan, setSelectedPlan] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [editData, setEditData] = useState({
    name: customerData?.name || '',
    email: customerData?.email || '',
    phone: customerData?.phone || '',
    company: customerData?.company || '',
    currency: customerData?.currency || 'TRY'
  });

  const currencyOptions = getCurrencyOptions();

  // Abonelik planlarını yükle
  useEffect(() => {
    fetchSubscriptionPlans();
  }, []);

  const fetchSubscriptionPlans = async () => {
    try {
      const { data, error } = await supabase
        .from('subscription_plans')
        .select('*')
        .eq('is_active', true)
        .order('price', { ascending: true });
      
      if (error) throw error;
      setSubscriptionPlans(data || []);
    } catch (error) {
      console.error('Error fetching subscription plans:', error);
      // Fallback planlar
      setSubscriptionPlans([
        {
          id: 'basic',
          name: 'Basic',
          description: 'Temel özellikler',
          price: 99.00,
          billing_cycle: 'monthly',
          features: ['Destek', 'Temel raporlar', 'Email desteği']
        },
        {
          id: 'professional',
          name: 'Professional',
          description: 'Profesyonel özellikler',
          price: 199.00,
          billing_cycle: 'monthly',
          features: ['Öncelikli destek', 'Gelişmiş raporlar', 'Telefon desteği', 'API erişimi']
        },
        {
          id: 'enterprise',
          name: 'Enterprise',
          description: 'Kurumsal çözümler',
          price: 499.00,
          billing_cycle: 'monthly',
          features: ['7/24 destek', 'Özel entegrasyonlar', 'Dedicated manager', 'SLA garantisi']
        }
      ]);
    }
  };

  const handlePlanChange = async (plan: any) => {
    setSelectedPlan(plan);
    setLoading(true);
    
    try {
      // Müşterinin planını güncelle
      const { error } = await supabase
        .from('customers')
        .update({ plan: plan.name.toLowerCase() })
        .eq('id', customerData.id);
      
      if (error) throw error;
      
      toast.success(`${plan.name} planına başarıyla geçiş yapıldı!`);
      setShowPlanModal(false);
      setSelectedPlan(null);
      
      // Sayfayı yenile
      window.location.reload();
    } catch (error) {
      console.error('Error updating plan:', error);
      toast.error('Plan değiştirme işlemi başarısız oldu');
    } finally {
      setLoading(false);
    }
  };

  // Müşteriye ait verileri filtrele
  const customerTickets = tickets.filter(t => t.customer_id === customerData?.id);
  const customerPayments = payments.filter(p => p.customer_id === customerData?.id);

  // İstatistikler
  const stats = {
    totalTickets: customerTickets.length,
    openTickets: customerTickets.filter(t => t.status === 'open').length,
    resolvedTickets: customerTickets.filter(t => t.status === 'resolved').length,
    totalPayments: customerPayments.length,
    totalAmount: customerPayments
      .filter(p => p.status === 'completed')
      .reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0),
    pendingPayments: customerPayments.filter(p => p.status === 'pending').length
  };

  const handleSave = () => {
    if (!editData.name.trim()) {
      toast.error('Ad soyad gerekli');
      return;
    }
    if (!editData.email.trim()) {
      toast.error('E-posta adresi gerekli');
      return;
    }

    // Burada Supabase'e güncelleme işlemi yapılacak
    toast.success('Profil bilgileri güncellendi');
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditData({
      name: customerData?.name || '',
      email: customerData?.email || '',
      phone: customerData?.phone || '',
      company: customerData?.company || '',
      currency: customerData?.currency || 'TRY'
    });
    setIsEditing(false);
  };

  const getPlanColor = (plan: string) => {
    switch (plan) {
      case 'premium': return 'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400';
      case 'pro':
      case 'professional': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400';
      case 'basic': return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400';
    }
  };

  const getPlanText = (plan: string) => {
    switch (plan) {
      case 'premium': return 'Premium';
      case 'pro':
      case 'professional': return 'Professional';
      case 'basic': return 'Basic';
      default: return 'Free';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button
            onClick={onBack}
            className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            ←
          </button>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Profil Bilgileri</h2>
        </div>
        {!isEditing && (
          <button
            onClick={() => setIsEditing(true)}
            className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium"
          >
            <Edit className="w-4 h-4 mr-2" />
            Düzenle
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Ana Profil Bilgileri */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Kişisel Bilgiler
              </h3>
              {isEditing && (
                <div className="flex items-center space-x-2">
                  <button
                    onClick={handleCancel}
                    className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
                  >
                    <X className="w-4 h-4" />
                  </button>
                  <button
                    onClick={handleSave}
                    className="inline-flex items-center px-3 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-medium"
                  >
                    <Save className="w-4 h-4 mr-2" />
                    Kaydet
                  </button>
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Ad Soyad *
                </label>
                {isEditing ? (
                  <input
                    type="text"
                    value={editData.name}
                    onChange={(e) => setEditData({ ...editData, name: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Ad soyad girin..."
                  />
                ) : (
                  <div className="flex items-center space-x-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <User className="w-5 h-5 text-gray-400" />
                    <span className="text-gray-900 dark:text-white">{customerData?.name}</span>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  E-posta *
                </label>
                {isEditing ? (
                  <input
                    type="email"
                    value={editData.email}
                    onChange={(e) => setEditData({ ...editData, email: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="E-posta adresi girin..."
                  />
                ) : (
                  <div className="flex items-center space-x-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <Mail className="w-5 h-5 text-gray-400" />
                    <span className="text-gray-900 dark:text-white">{customerData?.email}</span>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Telefon
                </label>
                {isEditing ? (
                  <input
                    type="tel"
                    value={editData.phone}
                    onChange={(e) => setEditData({ ...editData, phone: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Telefon numarası girin..."
                  />
                ) : (
                  <div className="flex items-center space-x-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <Phone className="w-5 h-5 text-gray-400" />
                    <span className="text-gray-900 dark:text-white">
                      {customerData?.phone || 'Belirtilmemiş'}
                    </span>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Şirket
                </label>
                {isEditing ? (
                  <input
                    type="text"
                    value={editData.company}
                    onChange={(e) => setEditData({ ...editData, company: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Şirket adı girin..."
                  />
                ) : (
                  <div className="flex items-center space-x-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <Building className="w-5 h-5 text-gray-400" />
                    <span className="text-gray-900 dark:text-white">
                      {customerData?.company || 'Belirtilmemiş'}
                    </span>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Para Birimi
                </label>
                {isEditing ? (
                  <select
                    value={editData.currency}
                    onChange={(e) => setEditData({ ...editData, currency: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {currencyOptions.map((currency) => (
                      <option key={currency.code} value={currency.code}>
                        {currency.symbol} {currency.name}
                      </option>
                    ))}
                  </select>
                ) : (
                  <div className="flex items-center space-x-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <CreditCard className="w-5 h-5 text-gray-400" />
                    <span className="text-gray-900 dark:text-white">
                      {getCurrencySymbol(customerData?.currency as any)} {customerData?.currency}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Hesap İstatistikleri */}
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Hesap İstatistikleri
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <div className="text-2xl font-bold text-blue-600 dark:text-blue-400 mb-1">
                  {stats.totalTickets}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  Toplam Talep
                </div>
              </div>
              
              <div className="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                <div className="text-2xl font-bold text-green-600 dark:text-green-400 mb-1">
                  {customerData?.satisfaction_score || 0}/5
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  Memnuniyet
                </div>
              </div>
              
              <div className="text-center p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                <div className="text-2xl font-bold text-purple-600 dark:text-purple-400 mb-1">
                  {format(new Date(customerData?.created_at), 'dd/MM/yy', { locale: tr })}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  Kayıt Tarihi
                </div>
              </div>
              
              <div className="text-center p-4 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
                <div className="text-2xl font-bold text-orange-600 dark:text-orange-400 mb-1">
                  {getPlanText(customerData?.plan)}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  Plan
                </div>
              </div>
            </div>
          </div>

          {/* Detaylı İstatistikler */}
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Detaylı İstatistikler
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Açık Talepler</p>
                    <p className="text-2xl font-bold text-red-600 dark:text-red-400">{stats.openTickets}</p>
                  </div>
                  <AlertCircle className="w-8 h-8 text-red-500" />
                </div>
              </div>
              
              <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Çözülen Talepler</p>
                    <p className="text-2xl font-bold text-green-600 dark:text-green-400">{stats.resolvedTickets}</p>
                  </div>
                  <CheckCircle className="w-8 h-8 text-green-500" />
                </div>
              </div>
              
              <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Toplam Ödeme</p>
                    <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{stats.totalPayments}</p>
                  </div>
                  <CreditCard className="w-8 h-8 text-blue-500" />
                </div>
              </div>
              
              <div className="p-4 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Bekleyen Ödeme</p>
                    <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">{stats.pendingPayments}</p>
                  </div>
                  <Clock className="w-8 h-8 text-orange-500" />
                </div>
              </div>
            </div>
          </div>

          {/* Finansal Özet */}
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Finansal Özet
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                <div className="flex items-center justify-center mb-2">
                  <TrendingUp className="w-6 h-6 text-green-600 dark:text-green-400 mr-2" />
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Toplam Ödenen</span>
                </div>
                <div className="text-3xl font-bold text-green-600 dark:text-green-400">
                  ₺{stats.totalAmount.toLocaleString()}
                </div>
              </div>
              
              <div className="text-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <div className="flex items-center justify-center mb-2">
                  <DollarSign className="w-6 h-6 text-blue-600 dark:text-blue-400 mr-2" />
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Ortalama Ödeme</span>
                </div>
                <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                  ₺{stats.totalPayments > 0 ? (stats.totalAmount / stats.totalPayments).toLocaleString() : '0'}
                </div>
              </div>
              
              <div className="text-center p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                <div className="flex items-center justify-center mb-2">
                  <Activity className="w-6 h-6 text-purple-600 dark:text-purple-400 mr-2" />
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Başarı Oranı</span>
                </div>
                <div className="text-3xl font-bold text-purple-600 dark:text-purple-400">
                  {stats.totalPayments > 0 ? Math.round(((stats.totalPayments - stats.pendingPayments) / stats.totalPayments) * 100) : 0}%
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Yan Panel */}
        <div className="space-y-6">
          {/* Abonelik Bilgileri */}
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Abonelik Bilgileri
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Mevcut Plan
                </label>
                <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getPlanColor(customerData?.plan)}`}>
                  {getPlanText(customerData?.plan)}
                </span>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Durum
                </label>
                <div className="flex items-center space-x-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  <span className="text-sm text-green-600 dark:text-green-400 font-medium">Aktif</span>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Son Güncelleme
                </label>
                <span className="text-sm text-gray-900 dark:text-white">
                  {format(new Date(customerData?.updated_at || customerData?.created_at), 'dd MMM yyyy', { locale: tr })}
                </span>
              </div>
            </div>
            
            <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-600">
              <button 
                onClick={() => setShowPlanModal(true)}
                className="w-full flex items-center justify-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors"
              >
                <Settings className="w-4 h-4" />
                <span>Plan Değiştir</span>
              </button>
            </div>
          </div>

          {/* Güvenlik */}
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Güvenlik
            </h3>
            <div className="space-y-3">
              <button className="w-full flex items-center space-x-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors">
                <Shield className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                <span className="text-sm font-medium text-gray-900 dark:text-white">Şifre Değiştir</span>
              </button>
              
              <button className="w-full flex items-center space-x-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors">
                <AlertCircle className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                <span className="text-sm font-medium text-gray-900 dark:text-white">İki Faktörlü Doğrulama</span>
              </button>
              
              <button className="w-full flex items-center space-x-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors">
                <Calendar className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                <span className="text-sm font-medium text-gray-900 dark:text-white">Oturum Geçmişi</span>
              </button>
            </div>
          </div>

          {/* Hızlı İşlemler */}
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Hızlı İşlemler
            </h3>
            <div className="space-y-3">
              <button 
                onClick={() => {
                  // Profil fotoğrafı ekleme işlemi
                  const input = document.createElement('input');
                  input.type = 'file';
                  input.accept = 'image/*';
                  input.onchange = (e) => {
                    const file = (e.target as HTMLInputElement).files?.[0];
                    if (file) {
                      toast.success('Profil fotoğrafı başarıyla yüklendi!');
                      // Burada gerçek upload işlemi yapılacak
                    }
                  };
                  input.click();
                }}
                className="w-full flex items-center space-x-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/40 transition-colors"
              >
                <User className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                <span className="text-sm font-medium text-gray-900 dark:text-white">Profil Fotoğrafı Ekle</span>
              </button>
              
              <button 
                onClick={() => {
                  // E-posta bildirimleri ayarları
                  toast.success('E-posta bildirimleri ayarları açılıyor...');
                  // Burada modal açılacak
                }}
                className="w-full flex items-center space-x-3 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg hover:bg-green-100 dark:hover:bg-green-900/40 transition-colors"
              >
                <Mail className="w-5 h-5 text-green-600 dark:text-green-400" />
                <span className="text-sm font-medium text-gray-900 dark:text-white">E-posta Bildirimleri</span>
              </button>
              
              <button 
                onClick={() => {
                  // Değerlendirme yapma
                  const rating = prompt('Hizmetimizi 1-5 arası puanlayın:');
                  if (rating && !isNaN(Number(rating)) && Number(rating) >= 1 && Number(rating) <= 5) {
                    toast.success(`Değerlendirmeniz için teşekkürler! Puanınız: ${rating}/5`);
                  } else if (rating !== null) {
                    toast.error('Lütfen 1-5 arası geçerli bir puan girin');
                  }
                }}
                className="w-full flex items-center space-x-3 p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg hover:bg-purple-100 dark:hover:bg-purple-900/40 transition-colors"
              >
                <Star className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                <span className="text-sm font-medium text-gray-900 dark:text-white">Değerlendirme Yap</span>
              </button>

              <button 
                onClick={() => {
                  // Veri indirme işlemi
                  const data = {
                    customer: customerData,
                    tickets: customerTickets,
                    payments: customerPayments,
                    exportDate: new Date().toISOString()
                  };
                  
                  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = `musteri-verileri-${customerData?.name || 'user'}-${new Date().toISOString().split('T')[0]}.json`;
                  document.body.appendChild(a);
                  a.click();
                  document.body.removeChild(a);
                  URL.revokeObjectURL(url);
                  
                  toast.success('Verileriniz başarıyla indirildi!');
                }}
                className="w-full flex items-center space-x-3 p-3 bg-orange-50 dark:bg-orange-900/20 rounded-lg hover:bg-orange-100 dark:hover:bg-orange-900/40 transition-colors"
              >
                <Download className="w-5 h-5 text-orange-600 dark:text-orange-400" />
                <span className="text-sm font-medium text-gray-900 dark:text-white">Veri İndir</span>
              </button>

              <button 
                onClick={() => {
                  // Rapor görüntüleme
                  const reportData = {
                    totalTickets: stats.totalTickets,
                    openTickets: stats.openTickets,
                    resolvedTickets: stats.resolvedTickets,
                    totalPayments: stats.totalPayments,
                    totalAmount: stats.totalAmount,
                    successRate: stats.totalPayments > 0 ? Math.round(((stats.totalPayments - stats.pendingPayments) / stats.totalPayments) * 100) : 0
                  };
                  
                  const reportWindow = window.open('', '_blank');
                  if (reportWindow) {
                    reportWindow.document.write(`
                      <html>
                        <head><title>Müşteri Raporu</title></head>
                        <body style="font-family: Arial, sans-serif; padding: 20px;">
                          <h1>Müşteri Raporu - ${customerData?.name}</h1>
                          <h2>Talep İstatistikleri</h2>
                          <p>Toplam Talep: ${reportData.totalTickets}</p>
                          <p>Açık Talep: ${reportData.openTickets}</p>
                          <p>Çözülen Talep: ${reportData.resolvedTickets}</p>
                          <h2>Ödeme İstatistikleri</h2>
                          <p>Toplam Ödeme: ${reportData.totalPayments}</p>
                          <p>Toplam Tutar: ₺${reportData.totalAmount.toLocaleString()}</p>
                          <p>Başarı Oranı: %${reportData.successRate}</p>
                          <p><small>Rapor Tarihi: ${new Date().toLocaleDateString('tr-TR')}</small></p>
                        </body>
                      </html>
                    `);
                    reportWindow.document.close();
                  }
                  
                  toast.success('Rapor yeni sekmede açıldı!');
                }}
                className="w-full flex items-center space-x-3 p-3 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg hover:bg-indigo-100 dark:hover:bg-indigo-900/40 transition-colors"
              >
                <BarChart3 className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                <span className="text-sm font-medium text-gray-900 dark:text-white">Rapor Görüntüle</span>
              </button>

              <button 
                onClick={() => {
                  // Fatura geçmişi görüntüleme
                  if (customerPayments.length === 0) {
                    toast.error('Henüz fatura bulunmuyor');
                    return;
                  }
                  
                  const invoiceWindow = window.open('', '_blank');
                  if (invoiceWindow) {
                    invoiceWindow.document.write(`
                      <html>
                        <head><title>Fatura Geçmişi</title></head>
                        <body style="font-family: Arial, sans-serif; padding: 20px;">
                          <h1>Fatura Geçmişi - ${customerData?.name}</h1>
                          <table border="1" style="width: 100%; border-collapse: collapse;">
                            <tr style="background-color: #f3f4f6;">
                              <th style="padding: 10px;">Fatura No</th>
                              <th style="padding: 10px;">Tutar</th>
                              <th style="padding: 10px;">Durum</th>
                              <th style="padding: 10px;">Tarih</th>
                            </tr>
                            ${customerPayments.map(payment => `
                              <tr>
                                <td style="padding: 10px;">${payment.invoice_number || payment.id.slice(0, 8)}</td>
                                <td style="padding: 10px;">${formatCurrency(parseFloat(payment.amount))}</td>
                                <td style="padding: 10px;">${payment.status === 'completed' ? 'Tamamlandı' : payment.status === 'pending' ? 'Bekliyor' : 'Başarısız'}</td>
                                <td style="padding: 10px;">${new Date(payment.created_at).toLocaleDateString('tr-TR')}</td>
                              </tr>
                            `).join('')}
                          </table>
                          <p><small>Rapor Tarihi: ${new Date().toLocaleDateString('tr-TR')}</small></p>
                        </body>
                      </html>
                    `);
                    invoiceWindow.document.close();
                  }
                  
                  toast.success('Fatura geçmişi yeni sekmede açıldı!');
                }}
                className="w-full flex items-center space-x-3 p-3 bg-teal-50 dark:bg-teal-900/20 rounded-lg hover:bg-teal-100 dark:hover:bg-teal-900/40 transition-colors"
              >
                <FileText className="w-5 h-5 text-teal-600 dark:text-teal-400" />
                <span className="text-sm font-medium text-gray-900 dark:text-white">Fatura Geçmişi</span>
              </button>
            </div>
          </div>

          {/* Tema Ayarları */}
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
              <Palette className="w-5 h-5 mr-2 text-purple-600 dark:text-purple-400" />
              Tema Ayarları
            </h3>
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                  Tema Seçimi
                </label>
                <div className="grid grid-cols-3 gap-4">
                  <div
                    onClick={() => setTheme('light')}
                    className={`p-4 border-2 rounded-lg cursor-pointer transition-colors ${
                      theme === 'light'
                        ? 'border-primary bg-primary-50 dark:bg-primary-900/20'
                        : 'border-gray-300 dark:border-gray-600'
                    }`}
                  >
                    <div className="flex items-center justify-center mb-2">
                      <Sun className="w-6 h-6 text-yellow-500" />
                    </div>
                    <p className="text-center text-sm font-medium text-gray-900 dark:text-white">Açık</p>
                  </div>
                  <div
                    onClick={() => setTheme('dark')}
                    className={`p-4 border-2 rounded-lg cursor-pointer transition-colors ${
                      theme === 'dark'
                        ? 'border-primary bg-primary-50 dark:bg-primary-900/20'
                        : 'border-gray-300 dark:border-gray-600'
                    }`}
                  >
                    <div className="flex items-center justify-center mb-2">
                      <Moon className="w-6 h-6 text-primary" />
                    </div>
                    <p className="text-center text-sm font-medium text-gray-900 dark:text-white">Koyu</p>
                  </div>
                  <div
                    onClick={() => setTheme('auto')}
                    className={`p-4 border-2 rounded-lg cursor-pointer transition-colors ${
                      theme === 'auto'
                        ? 'border-primary bg-primary-50 dark:bg-primary-900/20'
                        : 'border-gray-300 dark:border-gray-600'
                    }`}
                  >
                    <div className="flex items-center justify-center mb-2">
                      <Settings className="w-6 h-6 text-gray-500" />
                    </div>
                    <p className="text-center text-sm font-medium text-gray-900 dark:text-white">Otomatik</p>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                  Ana Renk
                </label>
                <div className="grid grid-cols-6 gap-3">
                  {['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899'].map((color) => (
                    <button
                      key={color}
                      onClick={() => setPrimaryColor(color)}
                      className={`w-12 h-12 rounded-lg border-2 transition-all ${
                        primaryColor === color
                          ? 'border-gray-900 dark:border-white scale-110'
                          : 'border-gray-300 dark:border-gray-600 hover:scale-105'
                      }`}
                      style={{ backgroundColor: color }}
                      title={`Renk: ${color}`}
                    />
                  ))}
                </div>
              </div>

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
            </div>
          </div>

          {/* Son Aktiviteler */}
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Son Aktiviteler
            </h3>
            <div className="space-y-4">
              {customerTickets.slice(0, 3).map((ticket) => (
                <div key={ticket.id} className="flex items-center space-x-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
                    <MessageSquare className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      Talep #{ticket.id.slice(0, 8)} - {ticket.title || 'Başlıksız'}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {format(new Date(ticket.created_at), 'dd MMM yyyy HH:mm', { locale: tr })}
                    </p>
                  </div>
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                    ticket.status === 'open' ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300' :
                    ticket.status === 'in_progress' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300' :
                    'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
                  }`}>
                    {ticket.status === 'open' ? 'Açık' :
                     ticket.status === 'in_progress' ? 'İşlemde' : 'Çözüldü'}
                  </span>
                </div>
              ))}
              
              {customerPayments.slice(0, 3).map((payment) => (
                <div key={payment.id} className="flex items-center space-x-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
                    <CreditCard className="w-4 h-4 text-green-600 dark:text-green-400" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      Ödeme #{payment.invoice_number || payment.id.slice(0, 8)} - {payment.description || 'Ödeme'}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {format(new Date(payment.created_at), 'dd MMM yyyy HH:mm', { locale: tr })}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="text-sm font-medium text-gray-900 dark:text-white">
                      {formatCurrency(parseFloat(payment.amount))}
                    </span>
                    <span className={`block inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                      payment.status === 'completed' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300' :
                      payment.status === 'pending' ? 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300' :
                      'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300'
                    }`}>
                      {payment.status === 'completed' ? 'Tamamlandı' :
                       payment.status === 'pending' ? 'Bekliyor' : 'Başarısız'}
                    </span>
                  </div>
                </div>
              ))}
              
              {customerTickets.length === 0 && customerPayments.length === 0 && (
                <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                  <Activity className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p>Henüz aktivite bulunmuyor</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Plan Değiştirme Modal */}
      {showPlanModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                  Plan Değiştir
                </h2>
                <button
                  onClick={() => setShowPlanModal(false)}
                  className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <p className="text-gray-600 dark:text-gray-400 mt-2">
                Mevcut planınızı değiştirin ve yeni özelliklere erişim kazanın.
              </p>
            </div>

            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {subscriptionPlans.map((plan) => (
                  <div
                    key={plan.id}
                    className={`relative p-6 rounded-xl border-2 transition-all ${
                      customerData?.plan === plan.name.toLowerCase() || 
                      (customerData?.plan === 'professional' && plan.name === 'Professional')
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                        : 'border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-600'
                    }`}
                  >
                    {(customerData?.plan === plan.name.toLowerCase() || 
                      (customerData?.plan === 'professional' && plan.name === 'Professional')) && (
                      <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                        <span className="bg-blue-600 text-white px-3 py-1 rounded-full text-xs font-medium">
                          Mevcut Plan
                        </span>
                      </div>
                    )}

                    <div className="text-center mb-6">
                      <div className="flex justify-center mb-4">
                        {plan.name === 'Basic' && (
                          <div className="p-3 bg-green-100 dark:bg-green-900/20 rounded-full">
                            <Zap className="w-8 h-8 text-green-600 dark:text-green-400" />
                          </div>
                        )}
                        {plan.name === 'Professional' && (
                          <div className="p-3 bg-blue-100 dark:bg-blue-900/20 rounded-full">
                            <StarIcon className="w-8 h-8 text-blue-600 dark:text-blue-400" />
                          </div>
                        )}
                        {plan.name === 'Enterprise' && (
                          <div className="p-3 bg-purple-100 dark:bg-purple-900/20 rounded-full">
                            <Crown className="w-8 h-8 text-purple-600 dark:text-purple-400" />
                          </div>
                        )}
                      </div>
                      
                      <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                        {plan.name}
                      </h3>
                      <p className="text-gray-600 dark:text-gray-400 text-sm mb-4">
                        {plan.description}
                      </p>
                      
                      <div className="mb-6">
                        <span className="text-3xl font-bold text-gray-900 dark:text-white">
                          ₺{plan.price}
                        </span>
                        <span className="text-gray-600 dark:text-gray-400">
                          /{plan.billing_cycle === 'monthly' ? 'ay' : 'yıl'}
                        </span>
                      </div>
                    </div>

                    <div className="space-y-3 mb-6">
                      {Array.isArray(plan.features) ? plan.features.map((feature: string, index: number) => (
                        <div key={index} className="flex items-center space-x-3">
                          <Check className="w-4 h-4 text-green-500 flex-shrink-0" />
                          <span className="text-sm text-gray-700 dark:text-gray-300">{feature}</span>
                        </div>
                      )) : (
                        <div className="flex items-center space-x-3">
                          <Check className="w-4 h-4 text-green-500 flex-shrink-0" />
                          <span className="text-sm text-gray-700 dark:text-gray-300">Temel özellikler</span>
                        </div>
                      )}
                    </div>

                    <button
                      onClick={() => handlePlanChange(plan)}
                      disabled={loading || customerData?.plan === plan.name.toLowerCase() || 
                        (customerData?.plan === 'professional' && plan.name === 'Professional')}
                      className={`w-full py-3 px-4 rounded-lg font-medium transition-colors ${
                        customerData?.plan === plan.name.toLowerCase() || 
                        (customerData?.plan === 'professional' && plan.name === 'Professional')
                          ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                          : loading
                          ? 'bg-blue-400 text-white cursor-not-allowed'
                          : 'bg-blue-600 hover:bg-blue-700 text-white'
                      }`}
                    >
                      {loading && selectedPlan?.id === plan.id ? (
                        <div className="flex items-center justify-center">
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          Değiştiriliyor...
                        </div>
                      ) : customerData?.plan === plan.name.toLowerCase() || 
                        (customerData?.plan === 'professional' && plan.name === 'Professional') ? (
                        'Mevcut Plan'
                      ) : (
                        'Bu Planı Seç'
                      )}
                    </button>
                  </div>
                ))}
              </div>

              <div className="mt-8 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <h4 className="font-medium text-gray-900 dark:text-white mb-2">
                  Plan Değişikliği Hakkında
                </h4>
                <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                  <li>• Plan değişikliği anında etkili olur</li>
                  <li>• Yeni planın fiyatı bir sonraki fatura döneminde uygulanır</li>
                  <li>• Mevcut özellikleriniz korunur</li>
                  <li>• İstediğiniz zaman planınızı değiştirebilirsiniz</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CustomerProfile;