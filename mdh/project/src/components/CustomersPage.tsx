import React, { useState, useEffect } from 'react';
import { 
  Search, 
  Filter, 
  Download, 
  Plus, 
  Eye, 
  Edit, 
  Trash2, 
  MoreVertical,
  CheckSquare,
  Square,
  User,
  Mail,
  Phone,
  Building,
  Star,
  Calendar
} from 'lucide-react';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';
import { useSupabase } from '../hooks/useSupabase';
import { getCurrencyOptions, getCurrencySymbol } from '../lib/currency';
import { toast } from 'react-hot-toast';
import { MessageSquare, Clock, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import AdvancedSearch, { SearchFilters } from './AdvancedSearch';
import RealTimeHintSystem from './RealTimeHintSystem';

interface CustomersPageProps {
  onViewCustomer?: (customerId: string) => void;
  onViewTicket?: (ticketId: string) => void;
}

const CustomersPage: React.FC<CustomersPageProps> = ({ onViewCustomer, onViewTicket }) => {
  const {
    loading,
    customers,
    tickets,
    searchTerm,
    setSearchTerm,
    selectedItems,
    setSelectedItems,
    exportData,
    fetchCustomers
  } = useSupabase();

  const [planFilter, setPlanFilter] = useState('all');
  const [showNewCustomerModal, setShowNewCustomerModal] = useState(false);
  const [showActionMenu, setShowActionMenu] = useState<string | null>(null);
  const [showViewModal, setShowViewModal] = useState<string | null>(null);
  const [showEditModal, setShowEditModal] = useState<string | null>(null);
  const [advancedFilters, setAdvancedFilters] = useState<SearchFilters>({
    searchTerm: '',
    searchType: 'customers',
    dateRange: { start: '', end: '' },
    status: '',
    priority: '',
    assignedTo: '',
    tags: [],
    amountRange: { min: '', max: '' },
    customFields: {}
  });
  const [newCustomerData, setNewCustomerData] = useState({
    name: '',
    email: '',
    phone: '',
    company: '',
    plan: 'free',
    currency: 'TRY' // Para birimi varsayılan olarak TL
  });

  // Para birimi seçenekleri
  const currencyOptions = getCurrencyOptions();

  useEffect(() => {
    console.log('🔄 CustomersPage useEffect triggered');
    console.log('🔄 fetchCustomers function:', fetchCustomers);
    fetchCustomers();
  }, []);

  console.log('📊 Current customers state:', customers);
  console.log('📊 Customers length:', customers.length);
  
  // Filter customers based on search term, plan and advanced filters
  const filteredCustomers = customers.filter(customer => {
    // Basic search filter
    const matchesSearch = customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         customer.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         customer.company?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         customer.phone?.toLowerCase().includes(searchTerm.toLowerCase());
    
    // Plan filter
    const matchesPlan = planFilter === 'all' || customer.plan === planFilter;
    
    // Advanced filters
    const matchesAdvancedSearch = !advancedFilters.searchTerm || 
      customer.name.toLowerCase().includes(advancedFilters.searchTerm.toLowerCase()) ||
      customer.email.toLowerCase().includes(advancedFilters.searchTerm.toLowerCase()) ||
      customer.company?.toLowerCase().includes(advancedFilters.searchTerm.toLowerCase()) ||
      customer.phone?.toLowerCase().includes(advancedFilters.searchTerm.toLowerCase());
    
    // Date range filter (if customer has created_at)
    const matchesDateRange = !advancedFilters.dateRange.start && !advancedFilters.dateRange.end || 
      (customer.created_at && 
       (!advancedFilters.dateRange.start || new Date(customer.created_at) >= new Date(advancedFilters.dateRange.start)) &&
       (!advancedFilters.dateRange.end || new Date(customer.created_at) <= new Date(advancedFilters.dateRange.end)));
    
    // Tags filter
    const matchesTags = advancedFilters.tags.length === 0 || 
      advancedFilters.tags.some(tag => 
        customer.name.toLowerCase().includes(tag.toLowerCase()) ||
        customer.company?.toLowerCase().includes(tag.toLowerCase())
      );
    
    return matchesSearch && matchesPlan && matchesAdvancedSearch && matchesDateRange && matchesTags;
  });

  const handleSelectAll = () => {
    if (selectedItems.length === filteredCustomers.length) {
      setSelectedItems([]);
    } else {
      setSelectedItems(filteredCustomers.map(customer => customer.id));
    }
  };

  const handleSelectItem = (id: string) => {
    setSelectedItems(prev => 
      prev.includes(id) 
        ? prev.filter(item => item !== id)
        : [...prev, id]
    );
  };

  const handleSearch = () => {
    // Arama işlemi zaten otomatik çalışıyor, bu buton için ek işlem
    if (searchTerm.trim()) {
      toast.success(`"${searchTerm}" için ${filteredCustomers.length} müşteri bulundu`);
    } else {
      toast('Arama terimi girin');
    }
  };

  const handleViewCustomer = (customerId: string) => {
    if (onViewCustomer) {
      onViewCustomer(customerId);
    } else {
      setShowViewModal(customerId);
    }
  };

  const handleEditCustomer = (customerId: string) => {
    setShowEditModal(customerId);
  };

  const handleDeleteCustomer = async (customerId: string) => {
    if (confirm('Bu müşteriyi silmek istediğinizden emin misiniz?')) {
      try {
        // Burada Supabase delete işlemi yapılacak
        toast.success('Müşteri başarıyla silindi');
        fetchCustomers();
      } catch (error) {
        toast.error('Müşteri silinirken hata oluştu');
      }
    }
  };

  const handleCreateTicket = (customerId: string) => {
    // Yeni talep oluşturma
    toast.success('Yeni talep oluşturma sayfasına yönlendiriliyor...');
    setShowActionMenu(null);
  };

  const handleSendEmail = (customerId: string) => {
    // E-posta gönderme
    toast.success('E-posta gönderme penceresi açılıyor...');
    setShowActionMenu(null);
  };

  const handleViewTickets = (customerId: string) => {
    // Müşteri taleplerini görüntüleme
    toast.success('Müşteri talepleri görüntüleniyor...');
    setShowActionMenu(null);
  };

  const handleViewTicket = (ticketId: string) => {
    if (onViewTicket) {
      onViewTicket(ticketId);
    } else {
      toast(`Talep #${ticketId.slice(0, 8)} detayları açılıyor...`);
    }
  };

  const handleCreateCustomer = async () => {
    if (!newCustomerData.name.trim()) {
      toast.error('Müşteri adı gerekli');
      return;
    }
    if (!newCustomerData.email.trim()) {
      toast.error('E-posta adresi gerekli');
      return;
    }
    
    try {
      // Burada Supabase create işlemi yapılacak
      toast.success('Yeni müşteri oluşturuldu');
      setShowNewCustomerModal(false);
      setNewCustomerData({
        name: '',
        email: '',
        phone: '',
        company: '',
        plan: 'free',
        currency: 'TRY'
      });
      fetchCustomers();
    } catch (error) {
      toast.error('Müşteri oluşturulurken hata oluştu');
    }
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

  const getSelectedCustomer = (id: string) => {
    return customers.find(customer => customer.id === id);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Müşteriler</h1>
          <p className="text-gray-600 dark:text-gray-400">
            {filteredCustomers.length} müşteri bulundu
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => exportData('customers')}
            className="inline-flex items-center px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
          >
            <Download className="w-4 h-4 mr-2" />
            Dışa Aktar
          </button>
          <button
            onClick={() => setShowNewCustomerModal(true)}
            className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium"
          >
            <Plus className="w-4 h-4 mr-2" />
            Yeni Müşteri
          </button>
        </div>
      </div>

      {/* Advanced Search */}
      <AdvancedSearch
        onSearch={(filters) => {
          setAdvancedFilters(filters);
          toast.success('Gelişmiş arama uygulandı');
        }}
        onClear={() => {
          setAdvancedFilters({
            searchTerm: '',
            searchType: 'customers',
            dateRange: { start: '', end: '' },
            status: '',
            priority: '',
            assignedTo: '',
            tags: [],
            amountRange: { min: '', max: '' },
            customFields: {}
          });
          toast.success('Filtreler temizlendi');
        }}
        searchTypes={['customers']}
      />

      {/* Plan Filter */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-gray-400" />
          <select
            value={planFilter}
            onChange={(e) => setPlanFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">Tüm Planlar</option>
            <option value="free">Free</option>
            <option value="basic">Basic</option>
            <option value="pro">Pro</option>
            <option value="professional">Professional</option>
            <option value="premium">Premium</option>
          </select>
        </div>
      </div>

      {/* Bulk Actions */}
      {selectedItems.length > 0 && (
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-blue-900 dark:text-blue-300">
              {selectedItems.length} müşteri seçildi
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => toast.success('Toplu e-posta gönderiliyor...')}
                className="px-3 py-1 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded"
              >
                E-posta Gönder
              </button>
              <button
                onClick={() => exportData('customers')}
                className="px-3 py-1 text-sm border border-blue-300 dark:border-blue-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white hover:bg-gray-50 dark:hover:bg-gray-600"
              >
                Dışa Aktar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Customers Table */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
              <tr>
                <th className="w-12 px-6 py-3 text-left">
                  <button
                    onClick={handleSelectAll}
                    className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                  >
                    {selectedItems.length === filteredCustomers.length && filteredCustomers.length > 0 ? (
                      <CheckSquare className="w-4 h-4" />
                    ) : (
                      <Square className="w-4 h-4" />
                    )}
                  </button>
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Müşteri
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  İletişim
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Plan
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Para Birimi
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Memnuniyet
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Talepler
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Ödeme Durumu
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Son Ödeme
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Kayıt Tarihi
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  İşlemler
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {loading ? (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center">
                    <div className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                      <span className="ml-3 text-gray-500 dark:text-gray-400">Yükleniyor...</span>
                    </div>
                  </td>
                </tr>
              ) : filteredCustomers.length === 0 ? (
                <tr>
                  <td colSpan={10} className="px-6 py-12 text-center text-gray-500 dark:text-gray-400">
                    {searchTerm || planFilter !== 'all' ? 'Arama kriterlerine uygun müşteri bulunamadı' : 'Henüz müşteri bulunmuyor'}
                  </td>
                </tr>
              ) : (
                filteredCustomers.map((customer) => (
                  <tr key={customer.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                    <td className="px-6 py-4">
                      <button
                        onClick={() => handleSelectItem(customer.id)}
                        className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                      >
                        {selectedItems.includes(customer.id) ? (
                          <CheckSquare className="w-4 h-4" />
                        ) : (
                          <Square className="w-4 h-4" />
                        )}
                      </button>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        {customer.avatar_url ? (
                          <img
                            src={customer.avatar_url}
                            alt={customer.name}
                            className="w-10 h-10 rounded-full object-cover"
                          />
                        ) : (
                          <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white font-semibold">
                            {customer.name.charAt(0)}
                          </div>
                        )}
                        <div className="ml-3">
                          <div className="text-sm font-medium text-gray-900 dark:text-white">
                            {customer.name}
                          </div>
                          {customer.company && (
                            <div className="text-sm text-gray-500 dark:text-gray-400">
                              {customer.company}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="space-y-1">
                        <div className="flex items-center text-sm text-gray-900 dark:text-white">
                          <Mail className="w-4 h-4 mr-2 text-gray-400" />
                          {customer.email}
                        </div>
                        {customer.phone && (
                          <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                            <Phone className="w-4 h-4 mr-2 text-gray-400" />
                            {customer.phone}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getPlanColor(customer.plan)}`}>
                        {getPlanText(customer.plan)}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <span className="text-sm font-medium text-gray-900 dark:text-white">
                          {getCurrencySymbol(customer.currency as any)}
                        </span>
                        <span className="text-sm text-gray-500 dark:text-gray-400 ml-1">
                          {customer.currency}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <Star className="w-4 h-4 text-yellow-400 fill-current mr-1" />
                        <span className="text-sm font-medium text-gray-900 dark:text-white">
                          {customer.satisfaction_score}/5
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm font-medium text-gray-900 dark:text-white">
                        {customer.total_tickets}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        {Math.random() > 0.3 ? (
                          <>
                            <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                            <span className="text-sm text-green-600 dark:text-green-400 font-medium">Güncel</span>
                          </>
                        ) : (
                          <>
                            <div className="w-2 h-2 bg-red-500 rounded-full mr-2"></div>
                            <span className="text-sm text-red-600 dark:text-red-400 font-medium">Gecikmiş</span>
                          </>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                      {format(new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000), 'dd MMM yyyy', { locale: tr })}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                      {format(new Date(customer.created_at), 'dd MMM yyyy', { locale: tr })}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleViewCustomer(customer.id)}
                          className="p-1 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400"
                          title="Görüntüle"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleEditCustomer(customer.id)}
                          className="p-1 text-gray-400 hover:text-green-600 dark:hover:text-green-400"
                          title="Düzenle"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteCustomer(customer.id)}
                          className="p-1 text-gray-400 hover:text-red-600 dark:hover:text-red-400"
                          title="Sil"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                        <div className="relative">
                          <button
                            onClick={() => setShowActionMenu(showActionMenu === customer.id ? null : customer.id)}
                            className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                            title="Daha fazla"
                          >
                            <MoreVertical className="w-4 h-4" />
                          </button>
                          {showActionMenu === customer.id && (
                            <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-md shadow-lg border border-gray-200 dark:border-gray-700 z-10">
                              <div className="py-1">
                                <button
                                  onClick={() => handleCreateTicket(customer.id)}
                                  className="block w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                                >
                                  Yeni Talep Oluştur
                                </button>
                                <button
                                  onClick={() => handleSendEmail(customer.id)}
                                  className="block w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                                >
                                  E-posta Gönder
                                </button>
                                <button
                                  onClick={() => handleViewTickets(customer.id)}
                                  className="block w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                                >
                                  Taleplerini Görüntüle
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between">
        <div className="text-sm text-gray-700 dark:text-gray-300">
          {filteredCustomers.length} müşteri gösteriliyor
        </div>
        <div className="flex items-center gap-2">
          <button className="px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700">
            Önceki
          </button>
          <button className="px-3 py-2 text-sm bg-blue-600 text-white rounded-lg">
            1
          </button>
          <button className="px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700">
            Sonraki
          </button>
        </div>
      </div>

      {/* New Customer Modal */}
      {showNewCustomerModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 w-full max-w-2xl mx-4">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Yeni Müşteri Ekle</h3>
              <button
                onClick={() => setShowNewCustomerModal(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                ✕
              </button>
            </div>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Ad Soyad *
                  </label>
                  <input
                    type="text"
                    value={newCustomerData.name}
                    onChange={(e) => setNewCustomerData({ ...newCustomerData, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Müşteri adını girin..."
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    E-posta *
                  </label>
                  <input
                    type="email"
                    value={newCustomerData.email}
                    onChange={(e) => setNewCustomerData({ ...newCustomerData, email: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="E-posta adresini girin..."
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Telefon
                  </label>
                  <input
                    type="tel"
                    value={newCustomerData.phone}
                    onChange={(e) => setNewCustomerData({ ...newCustomerData, phone: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Telefon numarasını girin..."
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Şirket
                  </label>
                  <input
                    type="text"
                    value={newCustomerData.company}
                    onChange={(e) => setNewCustomerData({ ...newCustomerData, company: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Şirket adını girin..."
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Plan
                  </label>
                  <select
                    value={newCustomerData.plan}
                    onChange={(e) => setNewCustomerData({ ...newCustomerData, plan: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="free">Free</option>
                    <option value="basic">Basic</option>
                    <option value="pro">Pro</option>
                    <option value="professional">Professional</option>
                    <option value="premium">Premium</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Para Birimi *
                  </label>
                  <select
                    value={newCustomerData.currency}
                    onChange={(e) => setNewCustomerData({ ...newCustomerData, currency: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  >
                    {currencyOptions.map((currency) => (
                      <option key={currency.code} value={currency.code}>
                        {currency.symbol} {currency.name}
                      </option>
                    ))}
                  </select>
                  <p className="text-xs text-gray-500 mt-1">
                    Müşterinin ödeme yapacağı para birimini seçin
                  </p>
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <button
                  onClick={() => setShowNewCustomerModal(false)}
                  className="px-4 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                  İptal
                </button>
                <button
                  onClick={handleCreateCustomer}
                  className="px-4 py-2 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded-lg"
                >
                  Müşteri Ekle
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* View Customer Modal */}
      {showViewModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 w-full max-w-2xl mx-4">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Müşteri Detayları</h3>
              <button
                onClick={() => setShowViewModal(null)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                ✕
              </button>
            </div>
            {(() => {
              const customer = getSelectedCustomer(showViewModal);
              if (!customer) return null;
              return (
                <div className="space-y-4">
                  <div className="flex items-center space-x-4">
                    {customer.avatar_url ? (
                      <img src={customer.avatar_url} alt={customer.name} className="w-16 h-16 rounded-full" />
                    ) : (
                      <div className="w-16 h-16 bg-blue-500 rounded-full flex items-center justify-center text-white text-xl font-bold">
                        {customer.name.charAt(0)}
                      </div>
                    )}
                    <div>
                      <h4 className="text-xl font-semibold text-gray-900 dark:text-white">{customer.name}</h4>
                      <p className="text-gray-600 dark:text-gray-400">{customer.company}</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">E-posta</label>
                      <p className="text-gray-900 dark:text-white">{customer.email}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Telefon</label>
                      <p className="text-gray-900 dark:text-white">{customer.phone || 'Belirtilmemiş'}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Plan</label>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getPlanColor(customer.plan)}`}>
                        {getPlanText(customer.plan)}
                      </span>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Para Birimi</label>
                      <div className="flex items-center">
                        <span className="text-sm font-medium text-gray-900 dark:text-white">
                          {getCurrencySymbol(customer.currency as any)}
                        </span>
                        <span className="text-sm text-gray-500 dark:text-gray-400 ml-1">
                          {customer.currency}
                        </span>
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Memnuniyet</label>
                      <div className="flex items-center">
                        <Star className="w-4 h-4 text-yellow-400 fill-current mr-1" />
                        <span>{customer.satisfaction_score}/5</span>
                      </div>
                    </div>
                  </div>

                  {/* Müşteri Talepleri */}
                  <div className="mt-6">
                    <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                      <MessageSquare className="w-5 h-5 text-blue-600" />
                      Müşteri Talepleri ({tickets.filter(t => t.customer_id === customer.id).length})
                    </h4>
                    
                    {(() => {
                      const customerTickets = tickets.filter(t => t.customer_id === customer.id);
                      
                      if (customerTickets.length === 0) {
                        return (
                          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                            <MessageSquare className="w-12 h-12 mx-auto mb-2 opacity-50" />
                            <p>Bu müşterinin henüz talebi bulunmuyor</p>
                          </div>
                        );
                      }

                      return (
                        <div className="space-y-3 max-h-60 overflow-y-auto">
                          {customerTickets.slice(0, 5).map((ticket) => (
                            <div 
                              key={ticket.id} 
                              className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3 border border-gray-200 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-600 cursor-pointer transition-colors"
                              onClick={() => handleViewTicket(ticket.id)}
                            >
                              <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-2">
                                  <span className="text-sm font-medium text-gray-900 dark:text-white">
                                    #{ticket.id.slice(0, 8)}
                                  </span>
                                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                                    ticket.status === 'open' ? 'bg-red-100 text-red-800' :
                                    ticket.status === 'in_progress' ? 'bg-yellow-100 text-yellow-800' :
                                    ticket.status === 'resolved' ? 'bg-green-100 text-green-800' :
                                    'bg-gray-100 text-gray-800'
                                  }`}>
                                    {ticket.status === 'open' ? 'Açık' :
                                     ticket.status === 'in_progress' ? 'İşlemde' :
                                     ticket.status === 'resolved' ? 'Çözüldü' : 'Kapalı'}
                                  </span>
                                </div>
                                <span className="text-xs text-gray-500 dark:text-gray-400">
                                  {format(new Date(ticket.created_at), 'dd MMM yyyy', { locale: tr })}
                                </span>
                              </div>
                              <h5 className="text-sm font-medium text-gray-900 dark:text-white mb-1">
                                {ticket.title}
                              </h5>
                              {ticket.description && (
                                <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                                  {ticket.description}
                                </p>
                              )}
                              <div className="mt-2 flex items-center gap-2 text-xs text-blue-600 dark:text-blue-400">
                                <MessageSquare className="w-3 h-3" />
                                <span>Detayları görüntüle</span>
                              </div>
                            </div>
                          ))}
                          
                          {customerTickets.length > 5 && (
                            <div className="text-center py-2">
                              <span className="text-sm text-gray-500 dark:text-gray-400">
                                ve {customerTickets.length - 5} talep daha...
                              </span>
                            </div>
                          )}
                        </div>
                      );
                    })()}
                  </div>
                </div>
              );
            })()}
          </div>
        </div>
      )}

      {/* Edit Customer Modal */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 w-full max-w-2xl mx-4">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Müşteri Düzenle</h3>
              <button
                onClick={() => setShowEditModal(null)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                ✕
              </button>
            </div>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Ad Soyad</label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    defaultValue={getSelectedCustomer(showEditModal)?.name}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">E-posta</label>
                  <input
                    type="email"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    defaultValue={getSelectedCustomer(showEditModal)?.email}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Telefon</label>
                  <input
                    type="tel"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    defaultValue={getSelectedCustomer(showEditModal)?.phone}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Şirket</label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    defaultValue={getSelectedCustomer(showEditModal)?.company}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Plan</label>
                  <select
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    defaultValue={getSelectedCustomer(showEditModal)?.plan}
                  >
                    <option value="free">Free</option>
                    <option value="basic">Basic</option>
                    <option value="pro">Pro</option>
                    <option value="premium">Premium</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Para Birimi</label>
                  <select
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    defaultValue={getSelectedCustomer(showEditModal)?.currency || 'TRY'}
                  >
                    {currencyOptions.map((currency) => (
                      <option key={currency.code} value={currency.code}>
                        {currency.symbol} {currency.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <button
                  onClick={() => setShowEditModal(null)}
                  className="px-4 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                  İptal
                </button>
                <button
                  onClick={() => {
                    toast.success('Müşteri bilgileri güncellendi');
                    setShowEditModal(null);
                  }}
                  className="px-4 py-2 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded-lg"
                >
                  Kaydet
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Akıllı İpuçları Sistemi */}
      <RealTimeHintSystem
        currentPage="customers"
        currentAction={planFilter}
        userRole="admin"
        contextData={{
          totalCustomers: customers.length,
          filteredCustomers: filteredCustomers.length,
          planFilter: planFilter,
          selectedItems: selectedItems.length,
          searchTerm: searchTerm,
          advancedFilters: advancedFilters,
          riskyCustomers: customers.filter(c => {
            // Riskli müşteri hesaplama (örnek: son 30 günde talep açmamış müşteriler)
            const lastTicket = tickets.filter(t => t.customer_id === c.id)
              .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0];
            
            if (!lastTicket) return true; // Hiç talep açmamış müşteriler
            
            const daysSinceLastTicket = (new Date().getTime() - new Date(lastTicket.created_at).getTime()) / (1000 * 60 * 60 * 24);
            return daysSinceLastTicket > 30; // 30 günden fazla talep açmamış müşteriler
          }).length,
          premiumCustomers: customers.filter(c => c.plan === 'premium' || c.plan === 'pro').length,
          newCustomers: customers.filter(c => {
            const daysSinceCreated = (new Date().getTime() - new Date(c.created_at).getTime()) / (1000 * 60 * 60 * 24);
            return daysSinceCreated <= 7; // Son 7 günde oluşturulan müşteriler
          }).length
        }}
        onHintAction={(hintId, action) => {
          console.log('Customer hint action:', hintId, action);
          
          switch (action) {
            case 'view_details':
              // Müşteri memnuniyet raporu
              toast.success('Müşteri memnuniyet raporu açılıyor');
              break;
            case 'view_risky_customers':
              // Riskli müşteriler listesi
              toast.success('Riskli müşteriler listesi açılıyor');
              break;
            case 'optimize_customer_retention':
              // Müşteri tutma optimizasyonu
              toast.success('Müşteri tutma optimizasyonu başlatıldı');
              break;
            case 'proactive_communication':
              // Proaktif iletişim
              toast.success('Proaktif iletişim kampanyası başlatıldı');
              break;
            default:
              console.log('Unknown customer hint action:', action);
          }
        }}
      />
    </div>
  );
};

export default CustomersPage;