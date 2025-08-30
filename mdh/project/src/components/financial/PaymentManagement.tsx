import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Search, 
  Filter, 
  Mail, 
  MoreVertical,
  FileText,
  Edit,
  Eye,
  X,
  CreditCard,
  Receipt,
  Calculator,
  Info,
  Trash2,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Users,
  Repeat,
  Settings,
  BarChart3,
  History,
  Zap,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Percent,
  Target,
  AlertTriangle,
  CheckCircle,
  Download,
  PieChart
} from 'lucide-react';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';
import { formatCurrency, getCurrencySymbol } from '../../lib/currency';
import { toast } from 'react-hot-toast';
import RecurringBillingTemplates from '../RecurringBillingTemplates';
import CostAnalysis from './CostAnalysis';

interface Payment {
  id: string;
  customer_id: string;
  subscription_id: string;
  amount: number;
  currency: string;
  payment_method: string;
  status: string;
  payment_date: string;
  due_date: string;
  notes: string;
  commission_type?: string;
  invoice_number?: string;
  invoice_date?: string;
  created_at?: string;
  customers?: {
    name: string;
    email: string;
  };
}

interface PaymentManagementProps {
  payments: Payment[];
  onViewInvoice: (payment: Payment) => void;
  onEditPayment: (payment: Payment) => void;
  onSendReminder: (payment: Payment) => void;
  onSendBulkReminders: () => void;
  onSendPersonBasedReminders: () => void;
  onAddPayment: () => void;
  onDeletePayment: (payment: Payment) => void;
}

const PaymentManagement: React.FC<PaymentManagementProps> = ({
  payments,
  onViewInvoice,
  onEditPayment,
  onSendReminder,
  onSendBulkReminders,
  onSendPersonBasedReminders,
  onAddPayment,
  onDeletePayment
}) => {
  const [activeTab, setActiveTab] = useState<'payments' | 'recurring-billing' | 'cost-analysis'>('payments');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [paymentMethodFilter, setPaymentMethodFilter] = useState('all');
  const [showBillingInfoModal, setShowBillingInfoModal] = useState(false);
  const [selectedPaymentForBilling, setSelectedPaymentForBilling] = useState<Payment | null>(null);
  
  // Pagination state'leri
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  const handleShowBillingInfo = (payment: Payment) => {
    setSelectedPaymentForBilling(payment);
    setShowBillingInfoModal(true);
  };

  // Filtreleme işlemlerinde sayfa numarasını sıfırla
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter, paymentMethodFilter, itemsPerPage]);

  // Müşteri filtresi kontrolü
  const customerFilter = localStorage.getItem('customerFilter');
  
  // Önce kopya faturaları temizle
  const uniquePayments = payments.filter((payment, index, self) => {
    // ID bazında duplicate kontrolü
    const idIndex = self.findIndex(p => p.id === payment.id);
    if (index !== idIndex) return false;
    
    // Invoice number bazında duplicate kontrolü (eğer invoice_number varsa)
    if (payment.invoice_number) {
      const invoiceIndex = self.findIndex(p => 
        p.invoice_number === payment.invoice_number && 
        p.id !== payment.id
      );
             if (invoiceIndex !== -1) {
         // Aynı invoice_number'a sahip başka bir ödeme varsa, en eski olanı tut
         const currentCreatedAt = new Date(payment.created_at || new Date()).getTime();
         const existingCreatedAt = new Date(self[invoiceIndex].created_at || new Date()).getTime();
         return currentCreatedAt <= existingCreatedAt;
       }
    }
    
    return true;
  });

  const filteredPayments = uniquePayments.filter(payment => {
    // Müşteri filtresi
    if (customerFilter && payment.customer_id !== customerFilter) return false;
    
    const searchLower = searchTerm.toLowerCase();
    
    // Müşteri adı ve e-posta araması
    const customerNameMatch = payment.customers?.name?.toLowerCase().includes(searchLower) || false;
    const customerEmailMatch = payment.customers?.email?.toLowerCase().includes(searchLower) || false;
    
    // Fatura numarası araması - hem INV- prefix'li hem de raw UUID formatında
    const invoiceNumberMatch = (() => {
      if (!searchTerm.trim()) return false;
      
      // Eğer arama terimi "INV-" ile başlıyorsa, tam eşleşme ara
      if (searchLower.startsWith('inv-')) {
        const invoiceNumber = payment.invoice_number || `INV-${payment.id}`;
        return invoiceNumber.toLowerCase().includes(searchLower);
      }
      
      // Eğer arama terimi UUID formatında ise (INV- olmadan), hem raw ID hem de INV- formatında ara
      if (searchLower.length >= 8 && !searchLower.includes(' ')) {
        // Raw UUID araması
        const rawIdMatch = payment.id.toLowerCase().includes(searchLower);
        
        // INV- formatında araması
        const invFormatMatch = (payment.invoice_number || `INV-${payment.id}`).toLowerCase().includes(searchLower);
        
        return rawIdMatch || invFormatMatch;
      }
      
      // Genel arama - hem invoice_number hem de ID'de ara
      const generalInvoiceMatch = (payment.invoice_number || `INV-${payment.id}`).toLowerCase().includes(searchLower);
      const generalIdMatch = payment.id.toLowerCase().includes(searchLower);
      
      return generalInvoiceMatch || generalIdMatch;
    })();
    
    // Tutar araması
    const amountMatch = payment.amount?.toString().includes(searchLower) || false;
    
    // Genel arama eşleşmesi
    const matchesSearch = customerNameMatch || customerEmailMatch || invoiceNumberMatch || amountMatch;
    
    const matchesStatus = statusFilter === 'all' || payment.status === statusFilter;
    const matchesPaymentMethod = paymentMethodFilter === 'all' || payment.payment_method === paymentMethodFilter;
    
    return matchesSearch && matchesStatus && matchesPaymentMethod;
  });

  const getStatusCount = (status: string) => {
    return uniquePayments.filter(p => status === 'all' ? true : p.status === status).length;
  };

  const getPaymentMethodCount = (method: string) => {
    return uniquePayments.filter(p => method === 'all' ? true : p.payment_method === method).length;
  };

  const getPaymentMethodText = (method: string) => {
    switch (method) {
      case 'credit_card':
        return 'Credit Card';
      case 'Credit Card':
        return 'Credit Card';
      case 'bank_transfer':
        return 'Banka Transferi';
      case 'cash':
        return 'Nakit';
      case 'check':
        return 'Çek';
      default:
        return method;
    }
  };

  // Pagination fonksiyonları
  const getPaginatedData = (data: Payment[]) => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return data.slice(startIndex, endIndex);
  };

  const getTotalPages = () => {
    return Math.ceil(filteredPayments.length / itemsPerPage);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  // Paginated data
  const paginatedPayments = getPaginatedData(filteredPayments);
  const totalPages = getTotalPages();

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400';
      case 'overdue':
        return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'completed':
        return 'Tamamlandı';
      case 'pending':
        return 'Bekleyen';
      case 'overdue':
        return 'Gecikmiş';
      default:
        return status;
    }
  };

  const getDelayStatus = (payment: Payment) => {
    if (payment.status === 'completed') {
      return { text: 'Ödendi', color: 'text-green-600', icon: '✓' };
    }
    
    if (payment.due_date && new Date(payment.due_date) < new Date()) {
      const daysOverdue = Math.abs(Math.ceil((new Date(payment.due_date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)));
      return { text: `${daysOverdue} gün gecikmiş`, color: 'text-red-600', icon: '⚠️' };
    }
    
    return { text: 'Zamanında', color: 'text-green-600', icon: '✓' };
  };

  const calculateBillingDetails = (payment: Payment) => {
    const totalAmount = payment.amount;
    
    // Para birimi sembolünü al
    const currencySymbol = getCurrencySymbol(payment.currency as any || 'TRY');
    
    // Para birimine göre locale belirle
    const getLocale = (currency: string) => {
      switch (currency) {
        case 'USD':
          return 'en-US';
        case 'EUR':
          return 'de-DE';
        default:
          return 'tr-TR';
      }
    };
    
    const locale = getLocale(payment.currency || 'TRY');
    
    // Para birimine göre VAT oranı belirle
    const getVatRate = (currency: string) => {
      switch (currency) {
        case 'TRY':
          return 0.20; // %20 KDV
        case 'USD':
          return 0.05; // %5 VAT
        case 'EUR':
          return 0.20; // %20 VAT
        default:
          return 0.20; // %20 varsayılan
      }
    };
    
    const vatRate = getVatRate(payment.currency || 'TRY');
    const netAmount = totalAmount / (1 + vatRate);
    const vatAmount = totalAmount - netAmount;
    
    // Tutarlı para birimi formatlaması için formatCurrency kullan
    return {
      netAmount: formatCurrency(netAmount, payment.currency as any || 'TRY'),
      vatAmount: formatCurrency(vatAmount, payment.currency as any || 'TRY'),
      totalAmount: formatCurrency(totalAmount, payment.currency as any || 'TRY'),
      vatRate: (vatRate * 100).toFixed(0),
      currencySymbol,
      showVAT: true
    };
  };

  return (
    <div className="space-y-6">
      {/* Tab Navigation */}
      <div className="border-b border-gray-200 dark:border-gray-700">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('payments')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'payments'
                ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
            }`}
          >
            <div className="flex items-center space-x-2">
              <CreditCard className="w-4 h-4" />
              <span>Manuel Ödemeler</span>
            </div>
          </button>
          <button
            onClick={() => setActiveTab('recurring-billing')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'recurring-billing'
                ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
            }`}
          >
            <div className="flex items-center space-x-2">
              <Repeat className="w-4 h-4" />
              <span>Otomatik Ödemeler</span>
            </div>
          </button>
          <button
            onClick={() => setActiveTab('cost-analysis')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'cost-analysis'
                ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
            }`}
          >
            <div className="flex items-center space-x-2">
              <Calculator className="w-4 h-4" />
              <span>Maliyet Analizi</span>
            </div>
          </button>
        </nav>
      </div>

      {activeTab === 'payments' && (
        <div>
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Ödeme Takibi</h2>
            <div className="flex gap-2">
              <button
                onClick={onAddPayment}
                className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Yeni Ödeme
              </button>
              <button
                onClick={onSendBulkReminders}
                className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 flex items-center gap-2"
              >
                <Mail className="w-4 h-4" />
                Toplu Hatırlatma
              </button>
              <button
                onClick={onSendPersonBasedReminders}
                className="bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700 flex items-center gap-2"
              >
                <Users className="w-4 h-4" />
                Kişi Bazlı Hatırlatma
              </button>
            </div>
          </div>

          {/* Ödeme Yöntemi Filtresi */}
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-3">
            <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Ödeme Yöntemi</h3>
            <div className="flex flex-wrap gap-1">
              <button
                onClick={() => setPaymentMethodFilter('all')}
                className={`px-2 py-1 rounded text-xs font-medium transition-colors ${
                  paymentMethodFilter === 'all'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                Tümü ({getPaymentMethodCount('all')})
              </button>
              <button
                onClick={() => setPaymentMethodFilter('credit_card')}
                className={`px-2 py-1 rounded text-xs font-medium transition-colors ${
                  paymentMethodFilter === 'credit_card'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                Kredi Kartı ({getPaymentMethodCount('credit_card')})
              </button>
              <button
                onClick={() => setPaymentMethodFilter('bank_transfer')}
                className={`px-2 py-1 rounded text-xs font-medium transition-colors ${
                  paymentMethodFilter === 'bank_transfer'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                Banka Transferi ({getPaymentMethodCount('bank_transfer')})
              </button>
              <button
                onClick={() => setPaymentMethodFilter('cash')}
                className={`px-2 py-1 rounded text-xs font-medium transition-colors ${
                  paymentMethodFilter === 'cash'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                Nakit ({getPaymentMethodCount('cash')})
              </button>
              <button
                onClick={() => setPaymentMethodFilter('check')}
                className={`px-2 py-1 rounded text-xs font-medium transition-colors ${
                  paymentMethodFilter === 'check'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                Çek ({getPaymentMethodCount('check')})
              </button>
            </div>
          </div>

          {/* Arama ve Filtreler */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Müşteri adı, e-posta, fatura no (INV-... veya UUID), tutar ara..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                />
              </div>
            </div>
            
            <div className="flex gap-2">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white text-sm"
              >
                <option value="all">Tüm Durumlar</option>
                <option value="completed">Tamamlandı</option>
                <option value="pending">Bekleyen</option>
                <option value="overdue">Gecikmiş</option>
              </select>
              
              <button className="p-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700">
                <Filter className="w-4 h-4 text-gray-500" />
              </button>
            </div>
          </div>

          {/* Hızlı Filtreler */}
          <div className="flex flex-wrap gap-1">
            <button
              onClick={() => setStatusFilter('all')}
              className={`px-3 py-1.5 rounded text-xs font-medium transition-colors ${
                statusFilter === 'all'
                  ? 'bg-blue-600 text-white'
                  : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700'
              }`}
            >
              Tümü ({getStatusCount('all')})
            </button>
            <button
              onClick={() => setStatusFilter('completed')}
              className={`px-3 py-1.5 rounded text-xs font-medium transition-colors ${
                statusFilter === 'completed'
                  ? 'bg-blue-600 text-white'
                  : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700'
              }`}
            >
              Tamamlanan ({getStatusCount('completed')})
            </button>
            <button
              onClick={() => setStatusFilter('pending')}
              className={`px-3 py-1.5 rounded text-xs font-medium transition-colors ${
                statusFilter === 'pending'
                  ? 'bg-blue-600 text-white'
                  : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700'
              }`}
            >
              Bekleyen ({getStatusCount('pending')})
            </button>
            <button
              onClick={() => setStatusFilter('overdue')}
              className={`px-3 py-1.5 rounded text-xs font-medium transition-colors ${
                statusFilter === 'overdue'
                  ? 'bg-blue-600 text-white'
                  : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700'
              }`}
            >
              Gecikmiş ({getStatusCount('overdue')})
            </button>
          </div>

          {/* Ödeme Tablosu */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
            <div className="overflow-x-auto pr-2">
              <table className="w-full min-w-[1150px]">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider w-40">
                      MÜŞTERİ
                    </th>
                    <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider w-28">
                      FATURA NO
                    </th>
                    <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider w-32">
                      TUTAR
                    </th>
                    <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider w-24">
                      YÖNTEM
                    </th>
                    <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider w-20">
                      DURUM
                    </th>
                    <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider w-24">
                      ÖDEME
                    </th>
                    <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider w-24">
                      VADE
                    </th>
                    <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider w-28">
                      GECİKME
                    </th>
                    <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider w-24">
                      İŞLEMLER
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {paginatedPayments.map((payment) => {
                    const delayStatus = getDelayStatus(payment);
                    
                    // Para birimine göre VAT oranı belirle
                    const getVatRate = (currency: string) => {
                      switch (currency) {
                        case 'TRY':
                          return 0.20; // %20 KDV
                        case 'USD':
                          return 0.05; // %5 VAT
                        case 'EUR':
                          return 0.20; // %20 VAT
                        default:
                          return 0.20; // %20 varsayılan
                      }
                    };
                    
                    const vatRate = getVatRate(payment.currency || 'TRY');
                    const price = payment.amount / (1 + vatRate);
                    const vat = payment.amount - price;
                    
                    return (
                      <tr key={payment.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                        <td className="px-2 py-2 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-6 w-6">
                              <div className="h-6 w-6 rounded-full bg-blue-500 flex items-center justify-center text-white font-medium text-xs">
                                {payment.customers?.name?.charAt(0) || '?'}
                              </div>
                            </div>
                            <div className="ml-2">
                              <div className="text-sm font-medium text-gray-900 dark:text-white truncate max-w-24">
                                {payment.customers?.name || 'Bilinmeyen Müşteri'}
                              </div>
                              <div className="text-xs text-gray-500 dark:text-gray-400 truncate max-w-24">
                                {payment.customers?.email || 'E-posta yok'}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-2 py-2 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900 dark:text-white">
                            {payment.invoice_number || `INV-${payment.id}`}
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            ID: {payment.id.slice(0, 8)}...
                          </div>
                        </td>
                        <td className="px-2 py-2 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900 dark:text-white">
                                                       {formatCurrency(payment.amount || 0, (payment.currency as 'TRY' | 'USD' | 'EUR') || 'TRY')}
                         </div>
                         <div className="text-xs text-gray-500 dark:text-gray-400">
                           Net: {formatCurrency(price || 0, (payment.currency as 'TRY' | 'USD' | 'EUR') || 'TRY')}
                          </div>
                        </td>
                        <td className="px-2 py-2 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                          {getPaymentMethodText(payment.payment_method)}
                        </td>
                        <td className="px-2 py-2 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(payment.status)}`}>
                            {getStatusText(payment.status)}
                          </span>
                        </td>
                        <td className="px-2 py-2 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                          {payment.payment_date ? format(new Date(payment.payment_date), 'dd/MM/yy', { locale: tr }) : '-'}
                        </td>
                        <td className="px-2 py-2 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                          {payment.due_date ? format(new Date(payment.due_date), 'dd/MM/yy', { locale: tr }) : '-'}
                        </td>
                        <td className="px-2 py-2 whitespace-nowrap">
                          <span className={`text-xs font-medium ${delayStatus.color}`}>
                            {delayStatus.icon} {delayStatus.text}
                          </span>
                        </td>
                        <td className="px-2 py-2 whitespace-nowrap text-sm font-medium">
                          <div className="flex items-center gap-0.5">
                            {/* Göster Butonu */}
                            <button
                              onClick={() => handleShowBillingInfo(payment)}
                              className="p-1 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded transition-colors"
                              title="Faturalandırma Detayları"
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </button>
                            
                            {/* Düzenle Butonu */}
                            <button
                              onClick={() => onEditPayment(payment)}
                              className="p-1 text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 rounded transition-colors"
                              title="Düzenle"
                            >
                              <Edit className="w-3.5 h-3.5" />
                            </button>
                            
                            {/* Sil Butonu */}
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                if (window.confirm(`${payment.customers?.name || 'Bu müşteri'} için ödeme kaydını silmek istediğinizden emin misiniz?`)) {
                                  onDeletePayment(payment);
                                }
                              }}
                              className="p-1 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
                              title="Sil"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            
            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700">
                <div className="flex items-center space-x-4">
                  <div className="text-sm text-gray-700 dark:text-gray-300">
                    {filteredPayments.length} ödemeden {((currentPage - 1) * itemsPerPage) + 1} - {Math.min(currentPage * itemsPerPage, filteredPayments.length)} arası gösteriliyor
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Sayfa başına:</span>
                    <select
                      value={itemsPerPage}
                      onChange={(e) => setItemsPerPage(Number(e.target.value))}
                      className="px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300"
                    >
                      <option value={5}>5</option>
                      <option value={10}>10</option>
                      <option value={20}>20</option>
                      <option value={50}>50</option>
                    </select>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => handlePageChange(1)}
                    disabled={currentPage === 1}
                    className="p-2 text-gray-600 hover:text-gray-700 disabled:text-gray-400 disabled:cursor-not-allowed"
                  >
                    <ChevronsLeft className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="p-2 text-gray-600 hover:text-gray-700 disabled:text-gray-400 disabled:cursor-not-allowed"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <span className="px-3 py-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg text-sm">
                    {currentPage} / {totalPages}
                  </span>
                  <button
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className="p-2 text-gray-600 hover:text-gray-700 disabled:text-gray-400 disabled:cursor-not-allowed"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handlePageChange(totalPages)}
                    disabled={currentPage === totalPages}
                    className="p-2 text-gray-600 hover:text-gray-700 disabled:text-gray-400 disabled:cursor-not-allowed"
                  >
                    <ChevronsRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'recurring-billing' && (
        <RecurringBillingTemplates />
      )}

      {activeTab === 'cost-analysis' && (
        <CostAnalysis
          costs={[
            {
              id: '1',
              name: 'Personel Maaşları',
              category: 'personnel',
              amount: 50000,
              currency: 'TRY',
              date: '2024-01-15',
              description: 'Ocak ayı personel maaşları',
              isRecurring: true,
              frequency: 'Aylık'
            },
            {
              id: '2',
              name: 'Ofis Kirası',
              category: 'rent',
              amount: 15000,
              currency: 'TRY',
              date: '2024-01-01',
              description: 'Ocak ayı ofis kirası',
              isRecurring: true,
              frequency: 'Aylık'
            },
            {
              id: '3',
              name: 'Elektrik Faturası',
              category: 'utilities',
              amount: 2500,
              currency: 'TRY',
              date: '2024-01-10',
              description: 'Ocak ayı elektrik faturası',
              isRecurring: true,
              frequency: 'Aylık'
            },
            {
              id: '4',
              name: 'Yazılım Lisansları',
              category: 'software',
              amount: 8000,
              currency: 'TRY',
              date: '2024-01-05',
              description: 'Yıllık yazılım lisans ücretleri',
              isRecurring: true,
              frequency: 'Yıllık'
            }
          ]}
          revenues={[
            {
              id: '1',
              name: 'Müşteri Ödemeleri',
              category: 'sales',
              amount: 120000,
              currency: 'TRY',
              date: '2024-01-20'
            },
            {
              id: '2',
              name: 'Danışmanlık Hizmetleri',
              category: 'consulting',
              amount: 45000,
              currency: 'TRY',
              date: '2024-01-15'
            },
            {
              id: '3',
              name: 'Abonelik Gelirleri',
              category: 'subscription',
              amount: 25000,
              currency: 'TRY',
              date: '2024-01-01'
            }
          ]}
          onAddCost={() => toast.success('Yeni gider ekleme özelliği yakında eklenecek')}
          onEditCost={(cost) => toast.success(`${cost.name} düzenleme özelliği yakında eklenecek`)}
          onDeleteCost={(cost) => toast.success(`${cost.name} silme özelliği yakında eklenecek`)}
          onAddRevenue={() => toast.success('Yeni gelir ekleme özelliği yakında eklenecek')}
          onEditRevenue={(revenue) => toast.success(`${revenue.name} düzenleme özelliği yakında eklenecek`)}
          onDeleteRevenue={(revenue) => toast.success(`${revenue.name} silme özelliği yakında eklenecek`)}
        />
      )}
    </div>
  );
};

export default PaymentManagement;
