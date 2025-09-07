import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Search, 
  Mail, 
  Edit,
  Eye,
  X,
  CreditCard,
  Calculator,
  Trash2,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Users,
  Repeat,
  Zap,
  Target,
  AlertTriangle,
  CheckCircle,
  Grid3X3,
  List,
  Move,
  Calendar,
  Activity,
  Clock,
  DollarSign,
  RefreshCw,
  FileText,
  Settings
} from 'lucide-react';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';
import { formatCurrency } from '../../lib/currency';
import { toast } from 'react-hot-toast';
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

interface PaymentColumn {
  id: string;
  name: string;
  status: string;
  color: string;
  icon: string;
  order: number;
  isDefault: boolean;
}

interface PaymentManagementProps {
  payments: Payment[];
  onEditPayment: (payment: Payment) => void;
  onSendBulkReminders: () => void;
  onSendPersonBasedReminders: () => void;
  onAddPayment: () => void;
  onDeletePayment: (payment: Payment) => void;
}

const PaymentManagement: React.FC<PaymentManagementProps> = ({
  payments,
  onEditPayment,
  onSendBulkReminders,
  onSendPersonBasedReminders,
  onAddPayment,
  onDeletePayment
}) => {
  const [activeTab, setActiveTab] = useState<'payments' | 'recurring-billing' | 'cost-analysis'>('payments');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [paymentMethodFilter, setPaymentMethodFilter] = useState('all');
  
  // Pagination state'leri
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // Kanban board için state'ler
  const [viewMode, setViewMode] = useState<'list' | 'kanban'>('list');
  const [draggedPayment, setDraggedPayment] = useState<Payment | null>(null);
  const [columns, setColumns] = useState<PaymentColumn[]>([]);
  const [showColumnModal, setShowColumnModal] = useState(false);
  const [editingColumn, setEditingColumn] = useState<PaymentColumn | null>(null);
  const [newColumn, setNewColumn] = useState<Partial<PaymentColumn>>({
    name: '',
    status: '',
    color: 'blue',
    icon: 'Calendar',
    order: 0,
    isDefault: false
  });
  
  // Liste görünümü için sütun özelleştirme
  const [showColumnSettings, setShowColumnSettings] = useState(false);
  const [visibleColumns, setVisibleColumns] = useState({
    customer: true,
    invoiceNumber: true,
    amount: true,
    paymentMethod: true,
    status: true,
    paymentDate: true,
    dueDate: true,
    delay: true,
    actions: true
  });
  
  // Kanban sütun özelleştirme
  const [showKanbanSettings, setShowKanbanSettings] = useState(false);
  const [kanbanSettings, setKanbanSettings] = useState({
    showCardCount: true,
    showProgressBar: true,
    showCustomerAvatar: true,
    showInvoiceNumber: true,
    showPaymentMethod: true,
    showDueDate: true,
    compactMode: false,
    autoSort: true
  });

  // Varsayılan sütunlar
  const defaultColumns: PaymentColumn[] = [
    { id: 'pending', name: 'Bekleyen', status: 'pending', color: 'yellow', icon: 'Clock', order: 1, isDefault: true },
    { id: 'completed', name: 'Tamamlandı', status: 'completed', color: 'green', icon: 'CheckCircle', order: 2, isDefault: true },
    { id: 'overdue', name: 'Gecikmiş', status: 'overdue', color: 'red', icon: 'AlertTriangle', order: 3, isDefault: true },
    { id: 'cancelled', name: 'İptal', status: 'cancelled', color: 'gray', icon: 'X', order: 4, isDefault: true },
    { id: 'partial', name: 'Kısmi Ödeme', status: 'partial', color: 'blue', icon: 'DollarSign', order: 5, isDefault: true },
    { id: 'refunded', name: 'İade', status: 'refunded', color: 'purple', icon: 'RefreshCw', order: 6, isDefault: true }
  ];

  // İkon seçenekleri
  const iconOptions = [
    { value: 'Calendar', label: 'Takvim', icon: Calendar },
    { value: 'Activity', label: 'Aktivite', icon: Activity },
    { value: 'Clock', label: 'Saat', icon: Clock },
    { value: 'CheckCircle', label: 'Onay', icon: CheckCircle },
    { value: 'AlertTriangle', label: 'Uyarı', icon: AlertTriangle },
    { value: 'Users', label: 'Kullanıcılar', icon: Users },
    { value: 'Target', label: 'Hedef', icon: Target },
    { value: 'Zap', label: 'Şimşek', icon: Zap },
    { value: 'CreditCard', label: 'Kredi Kartı', icon: CreditCard },
    { value: 'DollarSign', label: 'Para', icon: DollarSign },
    { value: 'RefreshCw', label: 'Yenile', icon: RefreshCw },
    { value: 'X', label: 'Kapat', icon: X },
    { value: 'FileText', label: 'Dosya', icon: FileText },
    { value: 'Mail', label: 'Mail', icon: Mail },
    { value: 'Calculator', label: 'Hesap', icon: Calculator }
  ];

  // Renk seçenekleri
  const colorOptions = [
    { value: 'blue', label: 'Mavi', class: 'text-blue-600 dark:text-blue-400' },
    { value: 'green', label: 'Yeşil', class: 'text-green-600 dark:text-green-400' },
    { value: 'yellow', label: 'Sarı', class: 'text-yellow-600 dark:text-yellow-400' },
    { value: 'red', label: 'Kırmızı', class: 'text-red-600 dark:text-red-400' },
    { value: 'purple', label: 'Mor', class: 'text-purple-600 dark:text-purple-400' },
    { value: 'pink', label: 'Pembe', class: 'text-pink-600 dark:text-pink-400' },
    { value: 'indigo', label: 'İndigo', class: 'text-indigo-600 dark:text-indigo-400' },
    { value: 'gray', label: 'Gri', class: 'text-gray-600 dark:text-gray-400' }
  ];

  const handleShowBillingInfo = (payment: Payment) => {
    // Fatura detaylarını göster
    toast.success(`${payment.customers?.name || 'Müşteri'} için fatura detayları gösteriliyor`);
  };

  // Sütunları yükle
  useEffect(() => {
    setColumns(defaultColumns);
  }, []);

  // Filtreleme işlemlerinde sayfa numarasını sıfırla
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter, paymentMethodFilter, itemsPerPage]);

  // Sürükle-bırak fonksiyonları
  const handleDragStart = (e: React.DragEvent, payment: Payment) => {
    setDraggedPayment(payment);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = async (e: React.DragEvent, newStatus: string) => {
    e.preventDefault();
    
    if (!draggedPayment || draggedPayment.status === newStatus) {
      setDraggedPayment(null);
      return;
    }

    try {
      // Burada gerçek bir API çağrısı yapılabilir
      // Şimdilik sadece toast gösterelim
      const statusText = getStatusText(newStatus);
      toast.success(`${draggedPayment.customers?.name || 'Ödeme'} durumu "${statusText}" olarak güncellendi`, {
        duration: 3000,
        icon: '✅'
      });
      
      setDraggedPayment(null);
    } catch (error) {
      console.error('❌ Ödeme durumu güncelleme hatası:', error);
      toast.error('Ödeme durumu güncellenirken hata oluştu');
      setDraggedPayment(null);
    }
  };

  // Sütun yönetimi fonksiyonları
  const handleAddColumn = () => {
    setEditingColumn(null);
    setNewColumn({
      name: '',
      status: '',
      color: 'blue',
      icon: 'Calendar',
      order: columns.length + 1,
      isDefault: false
    });
    setShowColumnModal(true);
  };

  const handleEditColumn = (column: PaymentColumn) => {
    setEditingColumn(column);
    setNewColumn(column);
    setShowColumnModal(true);
  };

  const handleSaveColumn = async () => {
    if (!newColumn.name || !newColumn.status) {
      toast.error('Sütun adı ve durum alanları zorunludur');
      return;
    }

    try {
      if (editingColumn) {
        // Sütun güncelleme
        setColumns(prev => prev.map(col => 
          col.id === editingColumn.id ? { ...col, ...newColumn } : col
        ));
        toast.success('Sütun başarıyla güncellendi');
      } else {
        // Yeni sütun ekleme
        const columnData = {
          ...newColumn,
          id: `custom_${Date.now()}`,
          order: columns.length + 1
        };

        setColumns(prev => [...prev, columnData as PaymentColumn]);
        toast.success('Yeni sütun başarıyla eklendi');
      }

      setShowColumnModal(false);
      setEditingColumn(null);
      setNewColumn({
        name: '',
        status: '',
        color: 'blue',
        icon: 'Calendar',
        order: 0,
        isDefault: false
      });
    } catch (error) {
      console.error('❌ Sütun kaydetme hatası:', error);
      toast.error('Sütun kaydedilirken hata oluştu');
    }
  };

  const handleDeleteColumn = async (columnId: string) => {
    const column = columns.find(col => col.id === columnId);
    if (!column) return;

    if (column.isDefault) {
      toast.error('Varsayılan sütunlar silinemez');
      return;
    }

    // Bu sütundaki ödemeleri kontrol et
    const paymentsInColumn = payments.filter(p => p.status === column.status);
    if (paymentsInColumn.length > 0) {
      toast.error('Bu sütunda ödemeler bulunuyor. Önce ödemeleri başka sütunlara taşıyın');
      return;
    }

    setColumns(prev => prev.filter(col => col.id !== columnId));
    toast.success('Sütun başarıyla silindi');
  };

  // Sütun sıralama fonksiyonu
  const handleColumnReorder = (draggedColumnId: string, targetColumnId: string) => {
    const draggedColumn = columns.find(col => col.id === draggedColumnId);
    const targetColumn = columns.find(col => col.id === targetColumnId);
    
    if (!draggedColumn || !targetColumn) return;
    
    const newColumns = columns.map(col => {
      if (col.id === draggedColumnId) {
        return { ...col, order: targetColumn.order };
      } else if (col.id === targetColumnId) {
        return { ...col, order: draggedColumn.order };
      }
      return col;
    });
    
    setColumns(newColumns);
    toast.success('Sütun sırası güncellendi');
  };

  // Kanban board render fonksiyonu
  const renderKanbanBoard = () => {
    const sortedColumns = [...columns].sort((a, b) => a.order - b.order);

    return (
      <div className={`grid gap-6 ${sortedColumns.length <= 2 ? 'grid-cols-1 md:grid-cols-2' : sortedColumns.length <= 3 ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3' : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'}`}>
        {sortedColumns.map((column) => {
          const columnPayments = payments.filter(p => p.status === column.status);
          const iconOption = iconOptions.find(opt => opt.value === column.icon);
          const IconComponent = iconOption?.icon || Calendar;
          
          return (
            <div
              key={column.id}
              className={`bg-gray-50 dark:bg-gray-800 rounded-lg p-4 min-h-[600px] transition-all duration-200 ${
                draggedPayment && draggedPayment.status !== column.status
                  ? 'ring-2 ring-blue-500 ring-opacity-50 bg-blue-50 dark:bg-blue-900/20'
                  : ''
              }`}
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, column.status)}
            >
              <div 
                className="flex items-center justify-between mb-4 cursor-move"
                draggable
                onDragStart={(e) => {
                  e.dataTransfer.setData('text/plain', column.id);
                  e.dataTransfer.effectAllowed = 'move';
                }}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault();
                  const draggedColumnId = e.dataTransfer.getData('text/plain');
                  if (draggedColumnId !== column.id) {
                    handleColumnReorder(draggedColumnId, column.id);
                  }
                }}
              >
                <div className="flex items-center space-x-2">
                  <Move className="w-4 h-4 text-gray-400 opacity-50" />
                  <IconComponent className={`w-5 h-5 text-${column.color}-600 dark:text-${column.color}-400`} />
                  <h3 className="font-semibold text-gray-900 dark:text-white">{column.name}</h3>
                  {kanbanSettings.showCardCount && (
                    <span className="bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400 text-xs px-2 py-1 rounded-full">
                      {columnPayments.length}
                    </span>
                  )}
                </div>
                <div className="flex items-center space-x-1">
                  <button
                    onClick={() => handleEditColumn(column)}
                    className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                    title="Sütunu Düzenle"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  {!column.isDefault && (
                    <button
                      onClick={() => handleDeleteColumn(column.id)}
                      className="text-gray-400 hover:text-red-600 dark:hover:text-red-400"
                      title="Sütunu Sil"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
              
              <div className="space-y-3">
                {columnPayments.map((payment) => {
                  const delayStatus = getDelayStatus(payment);
                  
                  return (
                    <div
                      key={payment.id}
                      draggable
                      onDragStart={(e) => handleDragStart(e, payment)}
                      className={`bg-white dark:bg-gray-700 rounded-lg p-4 shadow-sm border border-gray-200 dark:border-gray-600 cursor-move hover:shadow-md transition-all duration-200 ${
                        draggedPayment?.id === payment.id ? 'opacity-50 scale-95' : 'hover:scale-105'
                      }`}
                    >
                      {/* Müşteri Avatar ve Başlık */}
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center space-x-2">
                          {kanbanSettings.showCustomerAvatar && (
                            <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center text-white font-medium text-sm">
                              {payment.customers?.name?.charAt(0) || '?'}
                            </div>
                          )}
                          <div>
                            <h4 className={`font-medium text-gray-900 dark:text-white ${kanbanSettings.compactMode ? 'text-xs' : 'text-sm'}`}>
                              {payment.customers?.name || 'Bilinmeyen Müşteri'}
                            </h4>
                            {!kanbanSettings.compactMode && (
                              <p className="text-xs text-gray-500 dark:text-gray-400">
                                {payment.customers?.email || 'E-posta yok'}
                              </p>
                            )}
                          </div>
                        </div>
                        <Move className="w-4 h-4 text-gray-400 opacity-50" />
                      </div>
                      
                      {/* Fatura Numarası */}
                      {kanbanSettings.showInvoiceNumber && (
                        <div className="bg-gray-50 dark:bg-gray-600 rounded-md p-2 mb-3">
                          <p className="text-xs font-mono text-gray-700 dark:text-gray-300">
                            {payment.invoice_number || `INV-${payment.id.slice(0, 8)}`}
                          </p>
                        </div>
                      )}
                      
                      {/* Ödeme Detayları */}
                      <div className="space-y-2 mb-3">
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-gray-500 dark:text-gray-400">Tutar</span>
                          <span className="text-sm font-semibold text-gray-900 dark:text-white">
                            {formatCurrency(payment.amount || 0, (payment.currency as 'TRY' | 'USD' | 'EUR') || 'TRY')}
                          </span>
                        </div>
                        
                        {kanbanSettings.showPaymentMethod && (
                          <div className="flex items-center justify-between">
                            <span className="text-xs text-gray-500 dark:text-gray-400">Yöntem</span>
                            <span className="text-xs text-gray-700 dark:text-gray-300">
                              {getPaymentMethodText(payment.payment_method)}
                            </span>
                          </div>
                        )}
                        
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-gray-500 dark:text-gray-400">Durum</span>
                          <span className={`text-xs font-medium px-2 py-1 rounded-full ${delayStatus.color} bg-opacity-20`}>
                            {delayStatus.icon} {delayStatus.text}
                          </span>
                        </div>
                      </div>
                      
                      {/* Vade Tarihi ve Durum Çubuğu */}
                      {kanbanSettings.showDueDate && (
                        <div className="mb-3">
                          <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 mb-1">
                            <span>Vade Tarihi</span>
                            <span>{payment.due_date ? format(new Date(payment.due_date), 'dd/MM/yyyy', { locale: tr }) : '-'}</span>
                          </div>
                          {kanbanSettings.showProgressBar && payment.due_date && (
                            <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-1.5">
                              <div 
                                className={`h-1.5 rounded-full ${
                                  new Date(payment.due_date) < new Date() 
                                    ? 'bg-red-500' 
                                    : new Date(payment.due_date).getTime() - new Date().getTime() < 7 * 24 * 60 * 60 * 1000
                                      ? 'bg-yellow-500'
                                      : 'bg-green-500'
                                }`}
                                style={{
                                  width: `${Math.min(100, Math.max(0, 
                                    ((new Date(payment.due_date).getTime() - new Date().getTime()) / (30 * 24 * 60 * 60 * 1000)) * 100
                                  ))}%`
                                }}
                              ></div>
                            </div>
                          )}
                        </div>
                      )}
                      
                      {/* İşlem Butonları */}
                      <div className="flex items-center justify-between">
                        <div className="flex space-x-1">
                          <button 
                            onClick={() => handleShowBillingInfo(payment)}
                            className="p-1.5 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-md transition-colors"
                            title="Fatura Detayları"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                          <button 
                            onClick={() => onEditPayment(payment)}
                            className="p-1.5 text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-md transition-colors"
                            title="Düzenle"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>
                          <button 
                            onClick={() => onDeletePayment(payment)}
                            className="p-1.5 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md transition-colors"
                            title="Sil"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                        
                        {/* Ödeme Durumu İkonu */}
                        <div className={`w-3 h-3 rounded-full ${
                          payment.status === 'completed' ? 'bg-green-500' :
                          payment.status === 'pending' ? 'bg-yellow-500' :
                          payment.status === 'overdue' ? 'bg-red-500' :
                          'bg-gray-500'
                        }`}></div>
                      </div>
                    </div>
                  );
                })}
                
                {columnPayments.length === 0 && (
                  <div className="text-center py-8 text-gray-500 dark:text-gray-400 text-sm">
                    Bu durumda ödeme yok
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

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
              <span>Abonelik Ödemeleri</span>
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
            <div className="flex items-center space-x-3">
              {/* Görünüm Değiştirme Butonları */}
              <div className="flex items-center bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
                <button
                  onClick={() => setViewMode('list')}
                  className={`flex items-center px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                    viewMode === 'list'
                      ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm'
                      : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                  }`}
                >
                  <List className="w-4 h-4 mr-1.5" />
                  Liste
                </button>
                <button
                  onClick={() => setViewMode('kanban')}
                  className={`flex items-center px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                    viewMode === 'kanban'
                      ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm'
                      : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                  }`}
                >
                  <Grid3X3 className="w-4 h-4 mr-1.5" />
                  Kanban
                </button>
              </div>
              
              <div className="flex gap-2">
                <button
                  onClick={onAddPayment}
                  className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  Yeni Ödeme
                </button>
                
                {viewMode === 'kanban' && (
                  <>
                    <button
                      onClick={handleAddColumn}
                      className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 flex items-center gap-2"
                      title="Yeni Sütun Ekle"
                    >
                      <Plus className="w-4 h-4" />
                      Yeni Sütun
                    </button>
                    <button
                      onClick={() => setShowKanbanSettings(true)}
                      className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 flex items-center gap-2"
                      title="Kanban Ayarları"
                    >
                      <Settings className="w-4 h-4" />
                      Kanban Ayarları
                    </button>
                  </>
                )}
                
                {viewMode === 'list' && (
                  <button
                    onClick={() => setShowColumnSettings(true)}
                    className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 flex items-center gap-2"
                    title="Sütun Ayarları"
                  >
                    <Settings className="w-4 h-4" />
                    Sütun Ayarları
                  </button>
                )}
                
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
          {viewMode === 'list' ? (
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
              <div className="overflow-x-auto pr-2">
                <table className="w-full min-w-[1150px]">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    {visibleColumns.customer && (
                      <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider w-40">
                        MÜŞTERİ
                      </th>
                    )}
                    {visibleColumns.invoiceNumber && (
                      <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider w-28">
                        FATURA NO
                      </th>
                    )}
                    {visibleColumns.amount && (
                      <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider w-32">
                        TUTAR
                      </th>
                    )}
                    {visibleColumns.paymentMethod && (
                      <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider w-24">
                        YÖNTEM
                      </th>
                    )}
                    {visibleColumns.status && (
                      <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider w-20">
                        DURUM
                      </th>
                    )}
                    {visibleColumns.paymentDate && (
                      <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider w-24">
                        ÖDEME
                      </th>
                    )}
                    {visibleColumns.dueDate && (
                      <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider w-24">
                        VADE
                      </th>
                    )}
                    {visibleColumns.delay && (
                      <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider w-28">
                        GECİKME
                      </th>
                    )}
                    {visibleColumns.actions && (
                      <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider w-24">
                        İŞLEMLER
                      </th>
                    )}
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
                    
                    return (
                      <tr key={payment.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                        {visibleColumns.customer && (
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
                        )}
                        {visibleColumns.invoiceNumber && (
                          <td className="px-2 py-2 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900 dark:text-white">
                              {payment.invoice_number || `INV-${payment.id}`}
                            </div>
                            <div className="text-xs text-gray-500 dark:text-gray-400">
                              ID: {payment.id.slice(0, 8)}...
                            </div>
                          </td>
                        )}
                        {visibleColumns.amount && (
                          <td className="px-2 py-2 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900 dark:text-white">
                              {formatCurrency(payment.amount || 0, (payment.currency as 'TRY' | 'USD' | 'EUR') || 'TRY')}
                            </div>
                            <div className="text-xs text-gray-500 dark:text-gray-400">
                              Net: {formatCurrency(price || 0, (payment.currency as 'TRY' | 'USD' | 'EUR') || 'TRY')}
                            </div>
                          </td>
                        )}
                        {visibleColumns.paymentMethod && (
                          <td className="px-2 py-2 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                            {getPaymentMethodText(payment.payment_method)}
                          </td>
                        )}
                        {visibleColumns.status && (
                          <td className="px-2 py-2 whitespace-nowrap">
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(payment.status)}`}>
                              {getStatusText(payment.status)}
                            </span>
                          </td>
                        )}
                        {visibleColumns.paymentDate && (
                          <td className="px-2 py-2 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                            {payment.payment_date ? format(new Date(payment.payment_date), 'dd/MM/yy', { locale: tr }) : '-'}
                          </td>
                        )}
                        {visibleColumns.dueDate && (
                          <td className="px-2 py-2 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                            {payment.due_date ? format(new Date(payment.due_date), 'dd/MM/yy', { locale: tr }) : '-'}
                          </td>
                        )}
                        {visibleColumns.delay && (
                          <td className="px-2 py-2 whitespace-nowrap">
                            <span className={`text-xs font-medium ${delayStatus.color}`}>
                              {delayStatus.icon} {delayStatus.text}
                            </span>
                          </td>
                        )}
                        {visibleColumns.actions && (
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
                        )}
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
          ) : (
            <div className="p-6">
              {renderKanbanBoard()}
            </div>
          )}
        </div>
      )}

      {activeTab === 'recurring-billing' && (
        <div>
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Abonelik Ödemeleri</h2>
            <div className="flex items-center space-x-3">
              {/* Görünüm Değiştirme Butonları */}
              <div className="flex items-center bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
                <button
                  onClick={() => setViewMode('list')}
                  className={`flex items-center px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                    viewMode === 'list'
                      ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm'
                      : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                  }`}
                >
                  <List className="w-4 h-4 mr-1.5" />
                  Liste
                </button>
                <button
                  onClick={() => setViewMode('kanban')}
                  className={`flex items-center px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                    viewMode === 'kanban'
                      ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm'
                      : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                  }`}
                >
                  <Grid3X3 className="w-4 h-4 mr-1.5" />
                  Kanban
                </button>
              </div>
            </div>
          </div>

          {/* Abonelik Ödemeleri İçeriği */}
          {viewMode === 'list' ? (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
              <div className="p-6 text-center">
                <Repeat className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">Liste Görünümü</h3>
                <p className="text-gray-600 dark:text-gray-400">Abonelik ödemeleri liste görünümü burada görünecek</p>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
                <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                  <h3 className="text-sm font-medium text-gray-900 dark:text-white">Aktif Abonelikler</h3>
                </div>
                <div className="p-4">
                  <p className="text-sm text-gray-600 dark:text-gray-400">Kanban görünümü burada görünecek</p>
                </div>
              </div>
            </div>
          )}
        </div>
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

      {/* Kanban Ayarları Modal */}
      {showKanbanSettings && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Kanban Ayarları
              </h3>
              <button
                onClick={() => setShowKanbanSettings(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <div className="space-y-4">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Kanban görünümü ayarlarını özelleştirin:
              </p>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-700 dark:text-gray-300">Kart Sayısını Göster</span>
                  <input
                    type="checkbox"
                    checked={kanbanSettings.showCardCount}
                    onChange={(e) => setKanbanSettings({
                      ...kanbanSettings,
                      showCardCount: e.target.checked
                    })}
                    className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-700 dark:text-gray-300">İlerleme Çubuğu</span>
                  <input
                    type="checkbox"
                    checked={kanbanSettings.showProgressBar}
                    onChange={(e) => setKanbanSettings({
                      ...kanbanSettings,
                      showProgressBar: e.target.checked
                    })}
                    className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-700 dark:text-gray-300">Müşteri Avatarı</span>
                  <input
                    type="checkbox"
                    checked={kanbanSettings.showCustomerAvatar}
                    onChange={(e) => setKanbanSettings({
                      ...kanbanSettings,
                      showCustomerAvatar: e.target.checked
                    })}
                    className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-700 dark:text-gray-300">Fatura Numarası</span>
                  <input
                    type="checkbox"
                    checked={kanbanSettings.showInvoiceNumber}
                    onChange={(e) => setKanbanSettings({
                      ...kanbanSettings,
                      showInvoiceNumber: e.target.checked
                    })}
                    className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-700 dark:text-gray-300">Ödeme Yöntemi</span>
                  <input
                    type="checkbox"
                    checked={kanbanSettings.showPaymentMethod}
                    onChange={(e) => setKanbanSettings({
                      ...kanbanSettings,
                      showPaymentMethod: e.target.checked
                    })}
                    className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-700 dark:text-gray-300">Vade Tarihi</span>
                  <input
                    type="checkbox"
                    checked={kanbanSettings.showDueDate}
                    onChange={(e) => setKanbanSettings({
                      ...kanbanSettings,
                      showDueDate: e.target.checked
                    })}
                    className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-700 dark:text-gray-300">Kompakt Mod</span>
                  <input
                    type="checkbox"
                    checked={kanbanSettings.compactMode}
                    onChange={(e) => setKanbanSettings({
                      ...kanbanSettings,
                      compactMode: e.target.checked
                    })}
                    className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-700 dark:text-gray-300">Otomatik Sıralama</span>
                  <input
                    type="checkbox"
                    checked={kanbanSettings.autoSort}
                    onChange={(e) => setKanbanSettings({
                      ...kanbanSettings,
                      autoSort: e.target.checked
                    })}
                    className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                  />
                </div>
              </div>
            </div>
            
            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => setShowKanbanSettings(false)}
                className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
              >
                İptal
              </button>
              <button
                onClick={() => {
                  setShowKanbanSettings(false);
                  toast.success('Kanban ayarları kaydedildi');
                }}
                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
              >
                Kaydet
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Liste Sütun Özelleştirme Modal */}
      {showColumnSettings && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Sütun Ayarları
              </h3>
              <button
                onClick={() => setShowColumnSettings(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <div className="space-y-4">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Görüntülenecek sütunları seçin:
              </p>
              
              <div className="space-y-3">
                {Object.entries(visibleColumns).map(([key, value]) => {
                  const columnLabels: {[key: string]: string} = {
                    customer: 'Müşteri',
                    invoiceNumber: 'Fatura No',
                    amount: 'Tutar',
                    paymentMethod: 'Ödeme Yöntemi',
                    status: 'Durum',
                    paymentDate: 'Ödeme Tarihi',
                    dueDate: 'Vade Tarihi',
                    delay: 'Gecikme',
                    actions: 'İşlemler'
                  };
                  
                  return (
                    <label key={key} className="flex items-center space-x-3">
                      <input
                        type="checkbox"
                        checked={value}
                        onChange={(e) => setVisibleColumns({
                          ...visibleColumns,
                          [key]: e.target.checked
                        })}
                        className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                      />
                      <span className="text-sm text-gray-700 dark:text-gray-300">
                        {columnLabels[key]}
                      </span>
                    </label>
                  );
                })}
              </div>
            </div>
            
            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => setShowColumnSettings(false)}
                className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
              >
                İptal
              </button>
              <button
                onClick={() => {
                  setShowColumnSettings(false);
                  toast.success('Sütun ayarları kaydedildi');
                }}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Kaydet
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Sütun Yönetimi Modal */}
      {showColumnModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                {editingColumn ? 'Sütunu Düzenle' : 'Yeni Sütun Ekle'}
              </h3>
              <button
                onClick={() => setShowColumnModal(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Sütun Adı
                </label>
                <input
                  type="text"
                  value={newColumn.name || ''}
                  onChange={(e) => setNewColumn({...newColumn, name: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  placeholder="Sütun adını girin"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Durum Kodu
                </label>
                <input
                  type="text"
                  value={newColumn.status || ''}
                  onChange={(e) => setNewColumn({...newColumn, status: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  placeholder="Örn: in_review, testing"
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Ödemelerin bu sütuna atanması için kullanılacak benzersiz kod
                </p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  İkon
                </label>
                <div className="grid grid-cols-5 gap-2">
                  {iconOptions.map((option) => {
                    const IconComponent = option.icon;
                    return (
                      <button
                        key={option.value}
                        onClick={() => setNewColumn({...newColumn, icon: option.value})}
                        className={`p-2 rounded-lg border-2 transition-colors ${
                          newColumn.icon === option.value
                            ? 'border-primary bg-primary/10'
                            : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
                        }`}
                        title={option.label}
                      >
                        <IconComponent className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                      </button>
                    );
                  })}
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Renk
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {colorOptions.map((option) => (
                    <button
                      key={option.value}
                      onClick={() => setNewColumn({...newColumn, color: option.value})}
                      className={`p-2 rounded-lg border-2 transition-colors ${
                        newColumn.color === option.value
                          ? 'border-primary bg-primary/10'
                          : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
                      }`}
                    >
                      <div className={`w-4 h-4 rounded-full bg-${option.value}-500`}></div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
            
            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => setShowColumnModal(false)}
                className="px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600"
              >
                İptal
              </button>
              <button
                onClick={handleSaveColumn}
                disabled={!newColumn.name || !newColumn.status}
                className="px-4 py-2 bg-primary hover:bg-primary-600 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {editingColumn ? 'Güncelle' : 'Ekle'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PaymentManagement;
