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
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import AdvancedChartInteractivity, { DataPoint, ChartAnnotation } from '../common/AdvancedChartInteractivity';

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
  const [viewingPayment, setViewingPayment] = useState<Payment | null>(null);
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

  // Advanced Interactivity States
  const [enableAdvancedInteractivity, setEnableAdvancedInteractivity] = useState(false);
  const [paymentTrendsDataPoints, setPaymentTrendsDataPoints] = useState<DataPoint[]>([]);
  const [paymentMethodDataPoints, setPaymentMethodDataPoints] = useState<DataPoint[]>([]);
  const [drillDownLevel, setDrillDownLevel] = useState(0);
  const [drillDownPath, setDrillDownPath] = useState<string[]>([]);

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
    setViewingPayment(payment);
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

  // Grafik verilerini oluştur
  const paymentTrendsData = [
    { month: 'Ocak', amount: 45000, count: 25 },
    { month: 'Şubat', amount: 52000, count: 28 },
    { month: 'Mart', amount: 48000, count: 26 },
    { month: 'Nisan', amount: 61000, count: 32 },
    { month: 'Mayıs', amount: 55000, count: 29 },
    { month: 'Haziran', amount: 67000, count: 35 }
  ];

  const paymentMethodData = [
    { name: 'Kredi Kartı', value: 45, color: '#3B82F6' },
    { name: 'Banka Havalesi', value: 30, color: '#10B981' },
    { name: 'Nakit', value: 15, color: '#F59E0B' },
    { name: 'Çek', value: 10, color: '#EF4444' }
  ];

  // Advanced Interactivity - Veri dönüştürme
  useEffect(() => {
    if (enableAdvancedInteractivity) {
      console.log('Payment Management - Advanced Interactivity Enabled');
      console.log('Drill Down Level:', drillDownLevel);
      console.log('Drill Down Path:', drillDownPath);
      
      // Payment trends verilerini DataPoint formatına dönüştür
      let trendsPoints: DataPoint[] = [];
      
      if (drillDownLevel === 0) {
        // Seviye 0: Aylık trend
        trendsPoints = paymentTrendsData.map((item, index) => ({
          id: `trend-${index}`,
          x: item.month,
          y: item.amount,
          label: `₺${item.amount.toLocaleString()}`,
          metadata: { count: item.count }
        }));
      } else if (drillDownLevel === 1) {
        // Seviye 1: Haftalık detay
        trendsPoints = [
          { id: 'trend-w1', x: '1. Hafta', y: 12000, label: '₺12,000', metadata: { count: 6 } },
          { id: 'trend-w2', x: '2. Hafta', y: 15000, label: '₺15,000', metadata: { count: 8 } },
          { id: 'trend-w3', x: '3. Hafta', y: 18000, label: '₺18,000', metadata: { count: 9 } },
          { id: 'trend-w4', x: '4. Hafta', y: 22000, label: '₺22,000', metadata: { count: 12 } }
        ];
      } else {
        // Seviye 2: Günlük detay
        trendsPoints = [
          { id: 'trend-d1', x: 'Pzt', y: 3000, label: '₺3,000', metadata: { count: 2 } },
          { id: 'trend-d2', x: 'Sal', y: 3500, label: '₺3,500', metadata: { count: 3 } },
          { id: 'trend-d3', x: 'Çar', y: 4000, label: '₺4,000', metadata: { count: 4 } },
          { id: 'trend-d4', x: 'Per', y: 4500, label: '₺4,500', metadata: { count: 5 } },
          { id: 'trend-d5', x: 'Cum', y: 5000, label: '₺5,000', metadata: { count: 6 } }
        ];
      }
      
      // Payment method verilerini DataPoint formatına dönüştür
      let methodPoints: DataPoint[] = [];
      
      if (drillDownLevel === 0) {
        // Seviye 0: Genel ödeme yöntemleri
        methodPoints = paymentMethodData.map((item, index) => ({
          id: `method-${index}`,
          x: item.name,
          y: item.value,
          label: `${item.value}%`,
          metadata: { color: item.color }
        }));
      } else if (drillDownLevel === 1) {
        // Seviye 1: Ödeme yöntemine göre detay
        methodPoints = [
          { id: 'method-kk', x: 'Kredi Kartı', y: 45, label: '45%', metadata: { color: '#3B82F6' } },
          { id: 'method-bh', x: 'Banka Havalesi', y: 30, label: '30%', metadata: { color: '#10B981' } },
          { id: 'method-nk', x: 'Nakit', y: 15, label: '15%', metadata: { color: '#F59E0B' } },
          { id: 'method-ck', x: 'Çek', y: 10, label: '10%', metadata: { color: '#EF4444' } }
        ];
      } else {
        // Seviye 2: Tutar aralığına göre detay
        methodPoints = [
          { id: 'method-0-1k', x: '0-1000₺', y: 25, label: '25%', metadata: { color: '#10B981' } },
          { id: 'method-1k-5k', x: '1000-5000₺', y: 40, label: '40%', metadata: { color: '#3B82F6' } },
          { id: 'method-5k-10k', x: '5000-10000₺', y: 25, label: '25%', metadata: { color: '#F59E0B' } },
          { id: 'method-10k+', x: '10000₺+', y: 10, label: '10%', metadata: { color: '#EF4444' } }
        ];
      }
      
      console.log('Payment Trends Points:', trendsPoints);
      console.log('Payment Method Points:', methodPoints);
      setPaymentTrendsDataPoints(trendsPoints);
      setPaymentMethodDataPoints(methodPoints);
    }
  }, [enableAdvancedInteractivity, drillDownLevel, drillDownPath]);

  // Event handlers
  const handlePaymentTrendsDataUpdate = (updatedData: DataPoint[]) => {
    console.log('Payment Trends Data Updated:', updatedData);
    setPaymentTrendsDataPoints(updatedData);
  };

  const handlePaymentMethodDataUpdate = (updatedData: DataPoint[]) => {
    console.log('Payment Method Data Updated:', updatedData);
    setPaymentMethodDataPoints(updatedData);
  };

  const handleAnnotationAdd = (annotation: ChartAnnotation) => {
    console.log('Annotation Added:', annotation);
  };

  const handleAnnotationUpdate = (annotation: ChartAnnotation) => {
    console.log('Annotation Updated:', annotation);
  };

  const handleDrillDown = (path: string) => {
    console.log('Drill Down:', path);
    setDrillDownPath([...drillDownPath, path]);
    setDrillDownLevel(drillDownLevel + 1);
  };

  const handleDrillUp = () => {
    console.log('Drill Up');
    if (drillDownLevel > 0) {
      setDrillDownLevel(drillDownLevel - 1);
      setDrillDownPath(drillDownPath.slice(0, -1));
    }
  };

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
        return 'Kredi Kartı';
      case 'Credit Card':
        return 'Kredi Kartı';
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
        return 'text-yellow-600 dark:text-yellow-400';
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
              {/* Advanced Interactivity Toggle */}
              <button
                onClick={() => setEnableAdvancedInteractivity(!enableAdvancedInteractivity)}
                className={`flex items-center px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  enableAdvancedInteractivity
                    ? 'bg-blue-500 text-white hover:bg-blue-600'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                <Activity className="w-4 h-4 mr-2" />
                Gelişmiş Etkileşim
              </button>
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

          {/* Grafik Bölümü - Gelişmiş Etkileşim Aktifken */}
          {enableAdvancedInteractivity && (
            <div className="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Ödeme Trendleri */}
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    {drillDownLevel === 0 ? 'Aylık Ödeme Trendleri' : 
                     drillDownLevel === 1 ? 'Haftalık Ödeme Trendleri' : 
                     'Günlük Ödeme Trendleri'}
                  </h3>
                  <div className="flex items-center space-x-2">
                    <span className="text-xs text-gray-600 dark:text-gray-400">
                      Seviye {drillDownLevel + 1}
                    </span>
                    {drillDownLevel > 0 && (
                      <button
                        onClick={handleDrillUp}
                        className="px-2 py-1 text-xs bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded hover:bg-gray-200 dark:hover:bg-gray-600"
                      >
                        ↑ Yukarı
                      </button>
                    )}
                  </div>
                </div>
                
                <AdvancedChartInteractivity
                  data={paymentTrendsDataPoints}
                  onDataUpdate={handlePaymentTrendsDataUpdate}
                  onAnnotationAdd={handleAnnotationAdd}
                  onAnnotationUpdate={handleAnnotationUpdate}
                  drillDownLevel={drillDownLevel}
                  onDrillDown={handleDrillDown}
                  onDrillUp={handleDrillUp}
                >
                  <ResponsiveContainer width="100%" height={300}>
                    <AreaChart data={drillDownLevel === 0 ? paymentTrendsData : 
                                  drillDownLevel === 1 ? [
                                    { month: '1. Hafta', amount: 12000, count: 6 },
                                    { month: '2. Hafta', amount: 15000, count: 8 },
                                    { month: '3. Hafta', amount: 18000, count: 9 },
                                    { month: '4. Hafta', amount: 22000, count: 12 }
                                  ] : [
                                    { month: 'Pzt', amount: 3000, count: 2 },
                                    { month: 'Sal', amount: 3500, count: 3 },
                                    { month: 'Çar', amount: 4000, count: 4 },
                                    { month: 'Per', amount: 4500, count: 5 },
                                    { month: 'Cum', amount: 5000, count: 6 }
                                  ]}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis />
                      <Tooltip 
                        formatter={(value: any) => [`₺${value.toLocaleString()}`, '']}
                        labelFormatter={(label) => `${label}`}
                      />
                      <Area 
                        type="monotone" 
                        dataKey="amount" 
                        stroke="#3B82F6" 
                        fill="#3B82F6" 
                        fillOpacity={0.6}
                        name="Ödeme Tutarı"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </AdvancedChartInteractivity>
              </div>

              {/* Ödeme Yöntemleri Dağılımı */}
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    {drillDownLevel === 0 ? 'Ödeme Yöntemleri Dağılımı' : 
                     drillDownLevel === 1 ? 'Ödeme Yöntemi Detayları' : 
                     'Tutar Aralığı Dağılımı'}
                  </h3>
                  <div className="flex items-center space-x-2">
                    <span className="text-xs text-gray-600 dark:text-gray-400">
                      Seviye {drillDownLevel + 1}
                    </span>
                    {drillDownLevel > 0 && (
                      <button
                        onClick={handleDrillUp}
                        className="px-2 py-1 text-xs bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded hover:bg-gray-200 dark:hover:bg-gray-600"
                      >
                        ↑ Yukarı
                      </button>
                    )}
                  </div>
                </div>
                
                <AdvancedChartInteractivity
                  data={paymentMethodDataPoints}
                  onDataUpdate={handlePaymentMethodDataUpdate}
                  onAnnotationAdd={handleAnnotationAdd}
                  onAnnotationUpdate={handleAnnotationUpdate}
                  drillDownLevel={drillDownLevel}
                  onDrillDown={handleDrillDown}
                  onDrillUp={handleDrillUp}
                >
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={drillDownLevel === 0 ? paymentMethodData : 
                              drillDownLevel === 1 ? [
                                { name: 'Kredi Kartı', value: 45, color: '#3B82F6' },
                                { name: 'Banka Havalesi', value: 30, color: '#10B981' },
                                { name: 'Nakit', value: 15, color: '#F59E0B' },
                                { name: 'Çek', value: 10, color: '#EF4444' }
                              ] : [
                                { name: '0-1000₺', value: 25, color: '#10B981' },
                                { name: '1000-5000₺', value: 40, color: '#3B82F6' },
                                { name: '5000-10000₺', value: 25, color: '#F59E0B' },
                                { name: '10000₺+', value: 10, color: '#EF4444' }
                              ]}
                        cx="50%"
                        cy="50%"
                        labelLine={true}
                        label={({ name, percent, value }) => {
                          if (value === 0) return null;
                          return `${name} ${percent ? (percent * 100).toFixed(0) : 0}%`;
                        }}
                        outerRadius={70}
                        fill="#8884d8"
                        dataKey="value"
                        paddingAngle={2}
                      >
                        {(drillDownLevel === 0 ? paymentMethodData : 
                          drillDownLevel === 1 ? [
                            { name: 'Kredi Kartı', value: 45, color: '#3B82F6' },
                            { name: 'Banka Havalesi', value: 30, color: '#10B981' },
                            { name: 'Nakit', value: 15, color: '#F59E0B' },
                            { name: 'Çek', value: 10, color: '#EF4444' }
                          ] : [
                            { name: '0-1000₺', value: 25, color: '#10B981' },
                            { name: '1000-5000₺', value: 40, color: '#3B82F6' },
                            { name: '5000-10000₺', value: 25, color: '#F59E0B' },
                            { name: '10000₺+', value: 10, color: '#EF4444' }
                          ]).map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip 
                        formatter={(value: any) => [`${value}%`, '']}
                        labelFormatter={(label) => `${label}`}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </AdvancedChartInteractivity>
                
                {/* Legend */}
                {paymentMethodData.length > 0 && (
                  <div className="mt-4 flex flex-wrap gap-3 justify-center">
                    {(drillDownLevel === 0 ? paymentMethodData : 
                      drillDownLevel === 1 ? [
                        { name: 'Kredi Kartı', value: 45, color: '#3B82F6' },
                        { name: 'Banka Havalesi', value: 30, color: '#10B981' },
                        { name: 'Nakit', value: 15, color: '#F59E0B' },
                        { name: 'Çek', value: 10, color: '#EF4444' }
                      ] : [
                        { name: '0-1000₺', value: 25, color: '#10B981' },
                        { name: '1000-5000₺', value: 40, color: '#3B82F6' },
                        { name: '5000-10000₺', value: 25, color: '#F59E0B' },
                        { name: '10000₺+', value: 10, color: '#EF4444' }
                      ]).map((entry, index) => (
                      <div key={index} className="flex items-center gap-2">
                        <div 
                          className="w-3 h-3 rounded-full" 
                          style={{ backgroundColor: entry.color }}
                        ></div>
                        <span className="text-sm text-gray-600 dark:text-gray-400">
                          {entry.name} ({entry.value}%)
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

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

      {/* Fatura Detayları Modal */}
      {viewingPayment && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[95vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-gray-700 dark:to-gray-600">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
                  <FileText className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                    Fatura Detayları
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {viewingPayment.customers?.name || 'Müşteri'} - {viewingPayment.invoice_number || `INV-${viewingPayment.id}`}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setViewingPayment(null)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <div className="p-6 space-y-8">
              {/* Özet Kartları */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 p-4 rounded-lg border border-green-200 dark:border-green-800">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-green-600 dark:text-green-400">Toplam Tutar</p>
                      <p className="text-2xl font-bold text-green-700 dark:text-green-300">
                        {formatCurrency(viewingPayment.amount, (viewingPayment.currency as 'TRY' | 'USD' | 'EUR') || 'TRY')}
                      </p>
                    </div>
                    <DollarSign className="w-8 h-8 text-green-500" />
                  </div>
                </div>
                
                <div className="bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-blue-600 dark:text-blue-400">Ödeme Durumu</p>
                      <p className={`text-lg font-semibold ${getStatusColor(viewingPayment.status)}`}>
                        {getStatusText(viewingPayment.status)}
                      </p>
                    </div>
                    <CheckCircle className="w-8 h-8 text-blue-500" />
                  </div>
                </div>
                
                <div className="bg-gradient-to-br from-purple-50 to-violet-50 dark:from-purple-900/20 dark:to-violet-900/20 p-4 rounded-lg border border-purple-200 dark:border-purple-800">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-purple-600 dark:text-purple-400">Ödeme Yöntemi</p>
                      <p className="text-lg font-semibold text-purple-700 dark:text-purple-300">
                        {getPaymentMethodText(viewingPayment.payment_method)}
                      </p>
                    </div>
                    <CreditCard className="w-8 h-8 text-purple-500" />
                  </div>
                </div>
                
                <div className="bg-gradient-to-br from-orange-50 to-amber-50 dark:from-orange-900/20 dark:to-amber-900/20 p-4 rounded-lg border border-orange-200 dark:border-orange-800">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-orange-600 dark:text-orange-400">Gecikme Durumu</p>
                      <div className="flex items-center space-x-1">
                        {(() => {
                          const delayStatus = getDelayStatus(viewingPayment);
                          return (
                            <>
                              <span className="text-lg">{delayStatus.icon}</span>
                              <span className={`text-sm font-semibold ${delayStatus.color}`}>
                                {delayStatus.text}
                              </span>
                            </>
                          );
                        })()}
                      </div>
                    </div>
                    <Clock className="w-8 h-8 text-orange-500" />
                  </div>
                </div>
              </div>

              {/* Detaylı Bilgiler */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Fatura Bilgileri */}
                <div className="space-y-6">
                  <div className="flex items-center space-x-2 mb-4">
                    <FileText className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                    <h4 className="text-lg font-semibold text-gray-900 dark:text-white">Fatura Bilgileri</h4>
                  </div>
                  
                  <div className="space-y-4">
                    <div className="flex justify-between items-center py-3 border-b border-gray-100 dark:border-gray-700">
                      <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Fatura Numarası</span>
                      <span className="text-sm font-mono text-gray-900 dark:text-white bg-gray-50 dark:bg-gray-700 px-3 py-1 rounded">
                        {viewingPayment.invoice_number || `INV-${viewingPayment.id}`}
                      </span>
                    </div>
                    
                    <div className="flex justify-between items-center py-3 border-b border-gray-100 dark:border-gray-700">
                      <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Fatura Tarihi</span>
                      <span className="text-sm text-gray-900 dark:text-white">
                        {viewingPayment.created_at ? format(new Date(viewingPayment.created_at), 'dd MMMM yyyy HH:mm', { locale: tr }) : 'Belirtilmemiş'}
                      </span>
                    </div>
                    
                    <div className="flex justify-between items-center py-3 border-b border-gray-100 dark:border-gray-700">
                      <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Vade Tarihi</span>
                      <span className="text-sm text-gray-900 dark:text-white">
                        {viewingPayment.due_date ? format(new Date(viewingPayment.due_date), 'dd MMMM yyyy', { locale: tr }) : 'Belirtilmemiş'}
                      </span>
                    </div>
                    
                    <div className="flex justify-between items-center py-3 border-b border-gray-100 dark:border-gray-700">
                      <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Ödeme Tarihi</span>
                      <span className="text-sm text-gray-900 dark:text-white">
                        {viewingPayment.payment_date ? format(new Date(viewingPayment.payment_date), 'dd MMMM yyyy HH:mm', { locale: tr }) : 'Ödenmedi'}
                      </span>
                    </div>
                    
                    <div className="flex justify-between items-center py-3 border-b border-gray-100 dark:border-gray-700">
                      <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Para Birimi</span>
                      <span className="text-sm font-semibold text-gray-900 dark:text-white">
                        {viewingPayment.currency || 'TRY'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Müşteri Bilgileri */}
                <div className="space-y-6">
                  <div className="flex items-center space-x-2 mb-4">
                    <Users className="w-5 h-5 text-green-600 dark:text-green-400" />
                    <h4 className="text-lg font-semibold text-gray-900 dark:text-white">Müşteri Bilgileri</h4>
                  </div>
                  
                  <div className="space-y-4">
                    <div className="flex justify-between items-center py-3 border-b border-gray-100 dark:border-gray-700">
                      <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Müşteri Adı</span>
                      <span className="text-sm font-semibold text-gray-900 dark:text-white">
                        {viewingPayment.customers?.name || 'Belirtilmemiş'}
                      </span>
                    </div>
                    
                    <div className="flex justify-between items-center py-3 border-b border-gray-100 dark:border-gray-700">
                      <span className="text-sm font-medium text-gray-600 dark:text-gray-400">E-posta</span>
                      <span className="text-sm text-blue-600 dark:text-blue-400">
                        {viewingPayment.customers?.email || 'Belirtilmemiş'}
                      </span>
                    </div>
                    
                    <div className="flex justify-between items-center py-3 border-b border-gray-100 dark:border-gray-700">
                      <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Müşteri ID</span>
                      <span className="text-sm font-mono text-gray-900 dark:text-white bg-gray-50 dark:bg-gray-700 px-3 py-1 rounded">
                        {viewingPayment.customer_id}
                      </span>
                    </div>
                    
                    <div className="flex justify-between items-center py-3 border-b border-gray-100 dark:border-gray-700">
                      <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Abonelik ID</span>
                      <span className="text-sm font-mono text-gray-900 dark:text-white bg-gray-50 dark:bg-gray-700 px-3 py-1 rounded">
                        {viewingPayment.subscription_id || 'Belirtilmemiş'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Finansal Detaylar */}
              <div className="space-y-6">
                <div className="flex items-center space-x-2 mb-4">
                  <Calculator className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                  <h4 className="text-lg font-semibold text-gray-900 dark:text-white">Finansal Detaylar</h4>
                </div>
                
                <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="text-center">
                      <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">Brüt Tutar (KDV Dahil)</p>
                      <p className="text-2xl font-bold text-gray-900 dark:text-white">
                        {formatCurrency(viewingPayment.amount, (viewingPayment.currency as 'TRY' | 'USD' | 'EUR') || 'TRY')}
                      </p>
                    </div>
                    
                    <div className="text-center">
                      <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">Net Tutar (KDV Hariç)</p>
                      <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                        {(() => {
                          const vatRate = viewingPayment.currency === 'TRY' ? 0.20 : 0.05;
                          const netAmount = viewingPayment.amount / (1 + vatRate);
                          return formatCurrency(netAmount, (viewingPayment.currency as 'TRY' | 'USD' | 'EUR') || 'TRY');
                        })()}
                      </p>
                    </div>
                    
                    <div className="text-center">
                      <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">KDV Tutarı</p>
                      <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                        {(() => {
                          const vatRate = viewingPayment.currency === 'TRY' ? 0.20 : 0.05;
                          const vatAmount = viewingPayment.amount - (viewingPayment.amount / (1 + vatRate));
                          return formatCurrency(vatAmount, (viewingPayment.currency as 'TRY' | 'USD' | 'EUR') || 'TRY');
                        })()}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Komisyon ve Ek Bilgiler */}
              {(viewingPayment.commission_type || viewingPayment.notes) && (
                <div className="space-y-6">
                  <div className="flex items-center space-x-2 mb-4">
                    <Settings className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                    <h4 className="text-lg font-semibold text-gray-900 dark:text-white">Ek Bilgiler</h4>
                  </div>
                  
                  <div className="space-y-4">
                    {viewingPayment.commission_type && (
                      <div className="flex justify-between items-center py-3 border-b border-gray-100 dark:border-gray-700">
                        <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Komisyon Türü</span>
                        <span className="text-sm font-semibold text-gray-900 dark:text-white bg-indigo-50 dark:bg-indigo-900/20 px-3 py-1 rounded">
                          {viewingPayment.commission_type}
                        </span>
                      </div>
                    )}
                    
                    {viewingPayment.notes && (
                      <div>
                        <span className="text-sm font-medium text-gray-600 dark:text-gray-400 block mb-2">Notlar</span>
                        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
                          <p className="text-sm text-gray-900 dark:text-white leading-relaxed">
                            {viewingPayment.notes}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Ödeme Geçmişi */}
              <div className="space-y-6">
                <div className="flex items-center space-x-2 mb-4">
                  <Activity className="w-5 h-5 text-red-600 dark:text-red-400" />
                  <h4 className="text-lg font-semibold text-gray-900 dark:text-white">Ödeme Geçmişi</h4>
                </div>
                
                <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className={`w-3 h-3 rounded-full ${
                        viewingPayment.status === 'completed' ? 'bg-green-500' : 
                        viewingPayment.status === 'pending' ? 'bg-yellow-500' : 
                        'bg-red-500'
                      }`}></div>
                      <div>
                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                          {getStatusText(viewingPayment.status)}
                        </p>
                        <p className="text-xs text-gray-600 dark:text-gray-400">
                          {viewingPayment.payment_date ? 
                            format(new Date(viewingPayment.payment_date), 'dd MMMM yyyy HH:mm', { locale: tr }) : 
                            'Henüz ödenmedi'
                          }
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold text-gray-900 dark:text-white">
                        {formatCurrency(viewingPayment.amount, (viewingPayment.currency as 'TRY' | 'USD' | 'EUR') || 'TRY')}
                      </p>
                      <p className="text-xs text-gray-600 dark:text-gray-400">
                        {getPaymentMethodText(viewingPayment.payment_method)}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Footer Actions */}
            <div className="flex justify-between items-center p-6 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50">
              <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
                <Clock className="w-4 h-4" />
                <span>Son güncelleme: {format(new Date(), 'dd MMMM yyyy HH:mm', { locale: tr })}</span>
              </div>
              
              <div className="flex space-x-3">
                <button
                  onClick={() => setViewingPayment(null)}
                  className="px-4 py-2 text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-600 border border-gray-300 dark:border-gray-500 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-500 transition-colors"
                >
                  Kapat
                </button>
                <button
                  onClick={() => {
                    // Ödeme düzenleme modal'ını aç
                    setViewingPayment(null);
                    // Burada editingPayment state'ini set edebiliriz
                  }}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
                >
                  <Edit className="w-4 h-4" />
                  <span>Düzenle</span>
                </button>
                <button
                  onClick={() => {
                    // PDF indirme işlemi
                    toast.success('Fatura PDF olarak indiriliyor...');
                  }}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center space-x-2"
                >
                  <FileText className="w-4 h-4" />
                  <span>PDF Olarak İndir</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PaymentManagement;
