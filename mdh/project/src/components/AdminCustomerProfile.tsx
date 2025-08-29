import React, { useState } from 'react';
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
  ArrowLeft,
  CreditCard as CreditCardIcon,
  Ticket,
  Package,
  Zap,
  Target,
  Award,
  Folder,
  File,
  Image,
  Video,
  Music,
  Archive,
  Code,
  Database,
  Cloud,
  HardDrive,
  Wifi,
  Globe,
  MapPin,
  Tag,
  Filter,
  Search,
  MoreHorizontal,
  Share,
  Lock,
  Unlock
} from 'lucide-react';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';
import { toast } from 'react-hot-toast';
import { getCurrencySymbol, getCurrencyOptions, formatCurrency } from '../lib/currency';

interface AdminCustomerProfileProps {
  customerData: any;
  onBack: () => void;
  tickets?: any[];
  payments?: any[];
  subscriptions?: any[];
  onViewTickets?: (customerId: string) => void;
  onViewPayments?: (customerId: string) => void;
  onEditCustomer?: (customer: any) => void;
}

const AdminCustomerProfile: React.FC<AdminCustomerProfileProps> = ({ 
  customerData, 
  onBack,
  tickets = [],
  payments = [],
  subscriptions = [],
  onViewTickets,
  onViewPayments,
  onEditCustomer
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [editData, setEditData] = useState({
    name: customerData?.name || '',
    email: customerData?.email || '',
    phone: customerData?.phone || '',
    company: customerData?.company || '',
    currency: customerData?.currency || 'TRY',
    status: customerData?.status || 'active'
  });

  const currencyOptions = getCurrencyOptions();

  // Müşteriye ait verileri filtrele
  const customerTickets = tickets.filter(t => t.customer_id === customerData?.id);
  const customerPayments = payments.filter(p => p.customer_id === customerData?.id);
  const customerSubscriptions = subscriptions.filter(s => s.customer_id === customerData?.id);

  // İstatistikler
  const stats = {
    totalTickets: customerTickets.length,
    openTickets: customerTickets.filter(t => t.status === 'open').length,
    resolvedTickets: customerTickets.filter(t => t.status === 'resolved').length,
    totalPayments: customerPayments.length,
    totalAmount: customerPayments
      .filter(p => p.status === 'completed')
      .reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0),
    pendingPayments: customerPayments.filter(p => p.status === 'pending').length,
    activeSubscriptions: customerSubscriptions.filter(s => s.status === 'active').length,
    totalSubscriptions: customerSubscriptions.length
  };

  // Mock dosya verileri
  const customerFiles = [
    { id: 1, name: 'Sözleşme.pdf', type: 'pdf', size: '2.5 MB', uploaded: '2024-08-15', status: 'active' },
    { id: 2, name: 'Fatura_001.pdf', type: 'pdf', size: '1.2 MB', uploaded: '2024-08-10', status: 'active' },
    { id: 3, name: 'Profil_Resmi.jpg', type: 'image', size: '850 KB', uploaded: '2024-08-05', status: 'active' },
    { id: 4, name: 'Rapor.xlsx', type: 'spreadsheet', size: '3.1 MB', uploaded: '2024-08-01', status: 'archived' }
  ];

  // Mock aktivite verileri
  const activities = [
    { id: 1, type: 'login', description: 'Sisteme giriş yaptı', time: '2 saat önce', icon: 'user' },
    { id: 2, type: 'payment', description: '₺750.50 ödeme yaptı', time: '1 gün önce', icon: 'credit-card' },
    { id: 3, type: 'ticket', description: 'Yeni destek talebi oluşturdu', time: '2 gün önce', icon: 'message' },
    { id: 4, type: 'profile', description: 'Profil bilgilerini güncelledi', time: '1 hafta önce', icon: 'edit' }
  ];

  const handleSave = () => {
    if (!editData.name.trim()) {
      toast.error('Ad soyad gerekli');
      return;
    }
    if (!editData.email.trim()) {
      toast.error('E-posta adresi gerekli');
      return;
    }

    toast.success('Müşteri bilgileri güncellendi');
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditData({
      name: customerData?.name || '',
      email: customerData?.email || '',
      phone: customerData?.phone || '',
      company: customerData?.company || '',
      currency: customerData?.currency || 'TRY',
      status: customerData?.status || 'active'
    });
    setIsEditing(false);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400';
      case 'inactive': return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400';
      case 'suspended': return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'active': return 'Aktif';
      case 'inactive': return 'Pasif';
      case 'suspended': return 'Askıya Alınmış';
      default: return 'Bilinmiyor';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active': return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'inactive': return <Clock className="w-4 h-4 text-gray-500" />;
      case 'suspended': return <AlertCircle className="w-4 h-4 text-red-500" />;
      default: return <AlertCircle className="w-4 h-4 text-gray-400" />;
    }
  };

  const getFileIcon = (type: string) => {
    switch (type) {
      case 'pdf': return <FileText className="w-4 h-4 text-red-500" />;
      case 'image': return <Image className="w-4 h-4 text-blue-500" />;
      case 'spreadsheet': return <BarChart3 className="w-4 h-4 text-green-500" />;
      default: return <File className="w-4 h-4 text-gray-500" />;
    }
  };

  const getActivityIcon = (icon: string) => {
    switch (icon) {
      case 'user': return <User className="w-4 h-4 text-blue-500" />;
      case 'credit-card': return <CreditCard className="w-4 h-4 text-green-500" />;
      case 'message': return <MessageSquare className="w-4 h-4 text-purple-500" />;
      case 'edit': return <Edit className="w-4 h-4 text-orange-500" />;
      default: return <Activity className="w-4 h-4 text-gray-500" />;
    }
  };

  const tabs = [
    { id: 'overview', label: 'Genel Bakış', icon: <BarChart3 className="w-4 h-4" /> },
    { id: 'files', label: 'Dosya Yönetimi', icon: <Folder className="w-4 h-4" /> },
    { id: 'activities', label: 'Aktiviteler', icon: <Activity className="w-4 h-4" /> },
    { id: 'tickets', label: 'Talepler', icon: <Ticket className="w-4 h-4" /> },
    { id: 'payments', label: 'Ödemeler', icon: <CreditCard className="w-4 h-4" /> }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button
            onClick={onBack}
            className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Müşteri Profili
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              {customerData?.name} - Detaylı müşteri bilgileri
            </p>
          </div>
        </div>
        
        <div className="flex items-center space-x-3">
          {!isEditing && (
            <>
              <button
                onClick={() => onViewTickets?.(customerData?.id)}
                className="flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
              >
                <Ticket className="w-4 h-4" />
                <span>Talepleri Gör</span>
              </button>
              
              <button
                onClick={() => onViewPayments?.(customerData?.id)}
                className="flex items-center space-x-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors"
              >
                <CreditCardIcon className="w-4 h-4" />
                <span>Ödemeleri Gör</span>
              </button>
              
              <button
                onClick={() => setIsEditing(true)}
                className="flex items-center space-x-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium transition-colors"
              >
                <Edit className="w-4 h-4" />
                <span>Düzenle</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="flex space-x-1 p-1">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeTab === tab.id
                  ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400'
                  : 'text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-300'
              }`}
            >
              {tab.icon}
              <span>{tab.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      <div className="space-y-6">
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Ana Profil Bilgileri */}
            <div className="lg:col-span-2 space-y-6">
              <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Müşteri Bilgileri
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
                      Ad Soyad
                    </label>
                    {isEditing ? (
                      <input
                        type="text"
                        value={editData.name}
                        onChange={(e) => setEditData({ ...editData, name: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    ) : (
                      <p className="text-gray-900 dark:text-white font-medium">{customerData?.name}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      E-posta
                    </label>
                    {isEditing ? (
                      <input
                        type="email"
                        value={editData.email}
                        onChange={(e) => setEditData({ ...editData, email: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    ) : (
                      <p className="text-gray-900 dark:text-white font-medium">{customerData?.email}</p>
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
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    ) : (
                      <p className="text-gray-900 dark:text-white font-medium">{customerData?.phone || 'Belirtilmemiş'}</p>
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
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    ) : (
                      <p className="text-gray-900 dark:text-white font-medium">{customerData?.company || 'Belirtilmemiş'}</p>
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
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        {currencyOptions.map(option => (
                          <option key={option.code} value={option.code}>
                            {option.name} ({option.symbol})
                          </option>
                        ))}
                      </select>
                    ) : (
                      <p className="text-gray-900 dark:text-white font-medium">{customerData?.currency || 'TRY'}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Durum
                    </label>
                    {isEditing ? (
                      <select
                        value={editData.status}
                        onChange={(e) => setEditData({ ...editData, status: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="active">Aktif</option>
                        <option value="inactive">Pasif</option>
                        <option value="suspended">Askıya Alınmış</option>
                      </select>
                    ) : (
                      <div className="flex items-center space-x-2">
                        {getStatusIcon(customerData?.status)}
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(customerData?.status)}`}>
                          {getStatusText(customerData?.status)}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-600 dark:text-gray-400">Kayıt Tarihi:</span>
                      <p className="text-gray-900 dark:text-white font-medium">
                        {customerData?.created_at ? format(new Date(customerData.created_at), 'dd MMM yyyy', { locale: tr }) : 'Bilinmiyor'}
                      </p>
                    </div>
                    <div>
                      <span className="text-gray-600 dark:text-gray-400">Son Güncelleme:</span>
                      <p className="text-gray-900 dark:text-white font-medium">
                        {customerData?.updated_at ? format(new Date(customerData.updated_at), 'dd MMM yyyy', { locale: tr }) : 'Bilinmiyor'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* İstatistikler */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
                  <div className="flex items-center justify-between mb-4">
                    <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
                      <Ticket className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                    </div>
                    <span className="text-2xl font-bold text-gray-900 dark:text-white">
                      {stats.totalTickets}
                    </span>
                  </div>
                  <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-1">
                    Toplam Talep
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {stats.openTickets} açık, {stats.resolvedTickets} çözüldü
                  </p>
                </div>

                <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
                  <div className="flex items-center justify-between mb-4">
                    <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
                      <CreditCard className="w-6 h-6 text-green-600 dark:text-green-400" />
                    </div>
                    <span className="text-2xl font-bold text-gray-900 dark:text-white">
                      {stats.totalPayments}
                    </span>
                  </div>
                  <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-1">
                    Toplam Ödeme
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {getCurrencySymbol(customerData?.currency as any)}{stats.totalAmount.toLocaleString()}
                  </p>
                </div>

                <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
                  <div className="flex items-center justify-between mb-4">
                    <div className="p-2 bg-purple-100 dark:bg-purple-900 rounded-lg">
                      <Package className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                    </div>
                    <span className="text-2xl font-bold text-gray-900 dark:text-white">
                      {stats.activeSubscriptions}
                    </span>
                  </div>
                  <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-1">
                    Aktif Abonelik
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {stats.totalSubscriptions} toplam abonelik
                  </p>
                </div>

                <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
                  <div className="flex items-center justify-between mb-4">
                    <div className="p-2 bg-orange-100 dark:bg-orange-900 rounded-lg">
                      <Clock className="w-6 h-6 text-orange-600 dark:text-orange-400" />
                    </div>
                    <span className="text-2xl font-bold text-gray-900 dark:text-white">
                      {stats.pendingPayments}
                    </span>
                  </div>
                  <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-1">
                    Bekleyen Ödeme
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Onay bekleyen ödemeler
                  </p>
                </div>
              </div>
            </div>

            {/* Yan Panel */}
            <div className="space-y-6">
              {/* Müşteri Durumu */}
              <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Müşteri Durumu
                </h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Durum</span>
                    <div className="flex items-center space-x-2">
                      {getStatusIcon(customerData?.status)}
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(customerData?.status)}`}>
                        {getStatusText(customerData?.status)}
                      </span>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Müşteri Tipi</span>
                    <span className="text-sm font-medium text-gray-900 dark:text-white">
                      {customerData?.company ? 'Kurumsal' : 'Bireysel'}
                    </span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Para Birimi</span>
                    <span className="text-sm font-medium text-gray-900 dark:text-white">
                      {customerData?.currency || 'TRY'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Hızlı İşlemler */}
              <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Hızlı İşlemler
                </h3>
                <div className="space-y-3">
                  <button
                    onClick={() => onViewTickets?.(customerData?.id)}
                    className="w-full flex items-center space-x-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/40 transition-colors"
                  >
                    <Ticket className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                    <span className="text-sm font-medium text-gray-900 dark:text-white">Talepleri Görüntüle</span>
                  </button>
                  
                  <button
                    onClick={() => onViewPayments?.(customerData?.id)}
                    className="w-full flex items-center space-x-3 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg hover:bg-green-100 dark:hover:bg-green-900/40 transition-colors"
                  >
                    <CreditCard className="w-5 h-5 text-green-600 dark:text-green-400" />
                    <span className="text-sm font-medium text-gray-900 dark:text-white">Ödemeleri Görüntüle</span>
                  </button>
                  
                  <button
                    onClick={() => setIsEditing(true)}
                    className="w-full flex items-center space-x-3 p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg hover:bg-purple-100 dark:hover:bg-purple-900/40 transition-colors"
                  >
                    <Edit className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                    <span className="text-sm font-medium text-gray-900 dark:text-white">Bilgileri Düzenle</span>
                  </button>
                </div>
              </div>

              {/* Son Aktiviteler */}
              <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Son Aktiviteler
                </h3>
                <div className="space-y-3">
                  {activities.slice(0, 3).map((activity) => (
                    <div key={activity.id} className="flex items-center space-x-3 p-2 bg-gray-50 dark:bg-gray-700 rounded-lg">
                      <div className="p-1 bg-blue-100 dark:bg-blue-900 rounded">
                        {getActivityIcon(activity.icon)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                          {activity.description}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {activity.time}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'files' && (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Dosya Yönetimi
                </h3>
                <button className="flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors">
                  <Plus className="w-4 h-4" />
                  <span>Dosya Ekle</span>
                </button>
              </div>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                {customerFiles.map((file) => (
                  <div key={file.id} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="p-2 bg-white dark:bg-gray-600 rounded-lg">
                        {getFileIcon(file.type)}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900 dark:text-white">{file.name}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {file.size} • {file.uploaded} • {file.status}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <button className="p-2 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20">
                        <Download className="w-4 h-4" />
                      </button>
                      <button className="p-2 text-gray-400 hover:text-green-600 dark:hover:text-green-400 rounded-lg hover:bg-green-50 dark:hover:bg-green-900/20">
                        <Eye className="w-4 h-4" />
                      </button>
                      <button className="p-2 text-gray-400 hover:text-red-600 dark:hover:text-red-400 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'activities' && (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Müşteri Aktiviteleri
              </h3>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                {activities.map((activity) => (
                  <div key={activity.id} className="flex items-center space-x-4 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <div className="p-2 bg-white dark:bg-gray-600 rounded-lg">
                      {getActivityIcon(activity.icon)}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900 dark:text-white">{activity.description}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">{activity.time}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'tickets' && (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Müşteri Talepleri
                </h3>
                <button className="flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors">
                  <Plus className="w-4 h-4" />
                  <span>Yeni Talep</span>
                </button>
              </div>
            </div>
            <div className="p-6">
              {customerTickets.length === 0 ? (
                <div className="text-center py-12">
                  <Ticket className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                    Henüz talep bulunmuyor
                  </h3>
                  <p className="text-gray-500 dark:text-gray-400">
                    Bu müşteri henüz destek talebi oluşturmamış
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {customerTickets.slice(0, 5).map((ticket) => (
                    <div key={ticket.id} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
                          <Ticket className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900 dark:text-white">{ticket.title}</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            {format(new Date(ticket.created_at), 'dd MMM yyyy', { locale: tr })} • {ticket.status}
                          </p>
                        </div>
                      </div>
                      <button className="p-2 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20">
                        <Eye className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'payments' && (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Müşteri Ödemeleri
                </h3>
                <button className="flex items-center space-x-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors">
                  <Plus className="w-4 h-4" />
                  <span>Yeni Ödeme</span>
                </button>
              </div>
            </div>
            <div className="p-6">
              {customerPayments.length === 0 ? (
                <div className="text-center py-12">
                  <CreditCard className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                    Henüz ödeme bulunmuyor
                  </h3>
                  <p className="text-gray-500 dark:text-gray-400">
                    Bu müşteri henüz ödeme yapmamış
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {customerPayments.slice(0, 5).map((payment) => (
                    <div key={payment.id} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
                          <CreditCard className="w-4 h-4 text-green-600 dark:text-green-400" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900 dark:text-white">
                            {formatCurrency(parseFloat(payment.amount), payment.currency as any)}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            {format(new Date(payment.created_at), 'dd MMM yyyy', { locale: tr })} • {payment.status}
                          </p>
                        </div>
                      </div>
                      <button className="p-2 text-gray-400 hover:text-green-600 dark:hover:text-green-400 rounded-lg hover:bg-green-50 dark:hover:bg-green-900/20">
                        <Eye className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminCustomerProfile;
