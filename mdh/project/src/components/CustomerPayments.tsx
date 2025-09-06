import React, { useState, useEffect } from 'react';
import { 
  CreditCard, 
  Search, 
  Filter, 
  Download, 
  Eye,
  Calendar,
  DollarSign,
  CheckCircle,
  Clock,
  XCircle,
  AlertCircle,
  Receipt,
  TrendingUp,
  TrendingDown,
  Plus,
  Lock,
  X,
  Copy,
  FileText,
  BarChart3,
  List,
  Grid3X3,
  GripVertical,
  Trash2,
  Save,
  RotateCcw,
  Settings
} from 'lucide-react';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';
import { toast } from 'react-hot-toast';
import { formatCurrency } from '../lib/currency';
import { DndProvider, useDrag, useDrop } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';

interface CustomerPaymentsProps {
  customerData: any;
  payments: any[];
  onBack: () => void;
}

interface ColumnConfig {
  id: string;
  label: string;
  visible: boolean;
  width?: number;
  order: number;
}

interface DraggedItem {
  type: string;
  id: string;
  index: number;
}

const CustomerPayments: React.FC<CustomerPaymentsProps> = ({ 
  customerData, 
  payments, 
  onBack 
}) => {
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPayment, setSelectedPayment] = useState<any>(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentForm, setPaymentForm] = useState({
    amount: '',
    description: ''
  });
  const [isProcessing, setIsProcessing] = useState(false);
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [receiptData, setReceiptData] = useState<any>(null);
  const [showExportModal, setShowExportModal] = useState(false);
  
  // Yeni state'ler - görünüm ve sütun yönetimi
  const [viewMode, setViewMode] = useState<'list' | 'kanban'>('list');
  const [showColumnSettings, setShowColumnSettings] = useState(false);
  const [showAddColumnModal, setShowAddColumnModal] = useState(false);
  const [newColumnData, setNewColumnData] = useState({
    label: '',
    id: '',
    width: 150
  });
  
  // Sütun yönetimi state'leri
  const [columns, setColumns] = useState<ColumnConfig[]>([
    { id: 'invoice_number', label: 'Fatura No', visible: true, order: 0 },
    { id: 'description', label: 'Açıklama', visible: true, order: 1 },
    { id: 'amount', label: 'Tutar', visible: true, order: 2 },
    { id: 'status', label: 'Durum', visible: true, order: 3 },
    { id: 'payment_method', label: 'Ödeme Yöntemi', visible: true, order: 4 },
    { id: 'created_at', label: 'Tarih', visible: true, order: 5 },
    { id: 'actions', label: 'İşlemler', visible: true, order: 6 }
  ]);

  // Sütun yönetimi fonksiyonları
  const moveColumn = (dragIndex: number, hoverIndex: number) => {
    setColumns(prevColumns => {
      const newColumns = [...prevColumns];
      const draggedColumn = newColumns[dragIndex];
      newColumns.splice(dragIndex, 1);
      newColumns.splice(hoverIndex, 0, draggedColumn);
      
      // Sıralama numaralarını güncelle
      return newColumns.map((col, index) => ({
        ...col,
        order: index
      }));
    });
  };

  const toggleColumnVisibility = (columnId: string) => {
    setColumns(prevColumns => 
      prevColumns.map(col => 
        col.id === columnId ? { ...col, visible: !col.visible } : col
      )
    );
  };

  const resetColumns = () => {
    setColumns([
      { id: 'invoice_number', label: 'Fatura No', visible: true, order: 0 },
      { id: 'description', label: 'Açıklama', visible: true, order: 1 },
      { id: 'amount', label: 'Tutar', visible: true, order: 2 },
      { id: 'status', label: 'Durum', visible: true, order: 3 },
      { id: 'payment_method', label: 'Ödeme Yöntemi', visible: true, order: 4 },
      { id: 'created_at', label: 'Tarih', visible: true, order: 5 },
      { id: 'actions', label: 'İşlemler', visible: true, order: 6 }
    ]);
    toast.success('Sütunlar varsayılan ayarlara sıfırlandı');
  };

  const saveColumnSettings = () => {
    localStorage.setItem('customer-payments-columns', JSON.stringify(columns));
    setShowColumnSettings(false);
    toast.success('Sütun ayarları kaydedildi');
  };

  const addNewColumn = () => {
    if (!newColumnData.label.trim() || !newColumnData.id.trim()) {
      toast.error('Sütun adı ve ID gerekli');
      return;
    }

    // ID'nin benzersiz olduğunu kontrol et
    if (columns.some(col => col.id === newColumnData.id)) {
      toast.error('Bu ID zaten kullanılıyor');
      return;
    }

    const newColumn: ColumnConfig = {
      id: newColumnData.id,
      label: newColumnData.label,
      visible: true,
      width: newColumnData.width,
      order: columns.length
    };

    setColumns(prev => [...prev, newColumn]);
    setNewColumnData({ label: '', id: '', width: 150 });
    setShowAddColumnModal(false);
    toast.success('Yeni sütun eklendi');
  };

  const removeColumn = (columnId: string) => {
    // Varsayılan sütunları silmeyi engelle
    const defaultColumns = ['invoice_number', 'description', 'status', 'actions'];
    if (defaultColumns.includes(columnId)) {
      toast.error('Bu sütun silinemez');
      return;
    }

    setColumns(prev => prev.filter(col => col.id !== columnId));
    toast.success('Sütun silindi');
  };

  // Sıralı sütunları al
  const sortedColumns = columns
    .filter(col => col.visible)
    .sort((a, b) => a.order - b.order);

  // Hızlı ödeme modalını dinle
  useEffect(() => {
    const handleOpenPaymentModal = () => {
      setShowPaymentModal(true);
    };

    window.addEventListener('openPaymentModal', handleOpenPaymentModal);
    
    return () => {
      window.removeEventListener('openPaymentModal', handleOpenPaymentModal);
    };
  }, []);

  // Test verilerini ekleme fonksiyonu - KALDIRILDI
  // Artık sadece gerçek veriler kullanılıyor

  // Müşteriye ait ödemeleri filtrele ve kopya faturaları temizle
  const customerPayments = payments
    .filter(p => p.customer_id === customerData?.id)
    .filter((payment, index, self) => {
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
          const currentCreatedAt = new Date(payment.created_at).getTime();
          const existingCreatedAt = new Date(self[invoiceIndex].created_at).getTime();
          return currentCreatedAt <= existingCreatedAt;
        }
      }
      
      return true;
    });

  // Filtreleme
  const filteredPayments = customerPayments.filter(payment => {
    const matchesSearch = payment.invoice_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         payment.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         payment.id.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || payment.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  // Kanban için durum türlerini tanımla
  const statusTypes = [
    { id: 'completed', label: 'Tamamlandı', color: 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400' },
    { id: 'pending', label: 'Bekliyor', color: 'bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400' },
    { id: 'failed', label: 'Başarısız', color: 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400' }
  ];

  // Kanban için ödemeleri durum türlerine göre grupla
  const paymentsByStatus = statusTypes.map(status => ({
    ...status,
    payments: filteredPayments.filter(payment => payment.status === status.id)
  }));

  // Kanban bileşenleri
  const DraggablePaymentCard: React.FC<{ payment: any; statusId: string }> = ({ payment, statusId }) => {
    const [{ isDragging }, drag] = useDrag({
      type: 'payment',
      item: { type: 'payment', id: payment.id, statusId },
      collect: (monitor) => ({
        isDragging: monitor.isDragging(),
      }),
    });

    return (
      <div
        ref={drag}
        className={`bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm border border-gray-200 dark:border-gray-700 cursor-move transition-all hover:shadow-md ${
          isDragging ? 'opacity-50 rotate-2' : ''
        }`}
        onClick={() => handleViewPayment(payment)}
      >
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center">
            <span className="text-sm font-medium text-gray-900 dark:text-white">
              #{payment.invoice_number || payment.id.slice(0, 8)}
            </span>
          </div>
          <div className="flex items-center gap-1">
            {getStatusIcon(payment.status)}
          </div>
        </div>
        
        <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-2 line-clamp-2">
          {payment.description || 'Ödeme'}
        </h4>
        
        <div className="space-y-2">
          <div className="flex items-center text-xs text-gray-500 dark:text-gray-400">
            <Calendar className="w-3 h-3 mr-1" />
            {format(new Date(payment.created_at), 'dd MMM yyyy', { locale: tr })}
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <DollarSign className="w-3 h-3 text-green-600 dark:text-green-400 mr-1" />
              <span className="text-sm font-medium text-gray-900 dark:text-white">
                {formatCurrency(parseFloat(payment.amount), payment.currency as any)}
              </span>
            </div>
            {payment.payment_method && (
              <span className="text-xs text-gray-500 dark:text-gray-400">
                {payment.payment_method}
              </span>
            )}
          </div>
        </div>
      </div>
    );
  };

  const DroppableStatusColumn: React.FC<{ status: any }> = ({ status }) => {
    const [{ isOver }, drop] = useDrop({
      accept: 'payment',
      drop: (item: any) => {
        if (item.statusId !== status.id) {
          // Ödeme durumunu güncelle (gerçek uygulamada API çağrısı yapılacak)
          toast.success(`Ödeme durumu ${status.label} olarak güncellendi`);
        }
      },
      collect: (monitor) => ({
        isOver: monitor.isOver(),
      }),
    });

    return (
      <div
        ref={drop}
        className={`flex-1 min-w-0 bg-gray-50 dark:bg-gray-700 rounded-lg p-4 transition-colors ${
          isOver ? 'bg-blue-50 dark:bg-blue-900/20 border-2 border-blue-300 border-dashed' : ''
        }`}
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center">
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${status.color}`}>
              {status.label}
            </span>
            <span className="ml-2 text-sm text-gray-500 dark:text-gray-400">
              ({status.payments.length})
            </span>
          </div>
        </div>
        
        <div className="space-y-3 max-h-96 overflow-y-auto">
          {status.payments.map((payment: any) => (
            <DraggablePaymentCard
              key={payment.id}
              payment={payment}
              statusId={status.id}
            />
          ))}
          {status.payments.length === 0 && (
            <div className="text-center py-8 text-gray-400 dark:text-gray-500">
              <CreditCard className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">Bu durumda ödeme yok</p>
            </div>
          )}
        </div>
      </div>
    );
  };

  // Sürükle-bırak bileşenleri
  const DraggableColumn: React.FC<{ column: ColumnConfig; index: number }> = ({ column, index }) => {
    const [{ isDragging }, drag] = useDrag({
      type: 'column',
      item: { type: 'column', id: column.id, index },
      collect: (monitor) => ({
        isDragging: monitor.isDragging(),
      }),
    });

    const isDefaultColumn = ['invoice_number', 'description', 'status', 'actions'].includes(column.id);

    return (
      <div
        ref={drag}
        className={`flex items-center gap-2 p-2 rounded-lg border cursor-move transition-all ${
          isDragging 
            ? 'bg-blue-100 border-blue-300 opacity-50' 
            : 'bg-white dark:bg-gray-700 border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600'
        }`}
      >
        <GripVertical className="w-4 h-4 text-gray-400" />
        <span className="text-sm font-medium text-gray-900 dark:text-white">
          {column.label}
        </span>
        <div className="ml-auto flex items-center gap-2">
          <button
            onClick={() => toggleColumnVisibility(column.id)}
            className={`px-2 py-1 text-xs rounded ${
              column.visible 
                ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400' 
                : 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400'
            }`}
          >
            {column.visible ? 'Görünür' : 'Gizli'}
          </button>
          {!isDefaultColumn && (
            <button
              onClick={() => removeColumn(column.id)}
              className="p-1 text-red-400 hover:text-red-600 dark:hover:text-red-400"
              title="Sütunu Sil"
            >
              <Trash2 className="w-3 h-3" />
            </button>
          )}
        </div>
      </div>
    );
  };

  const DroppableColumnList: React.FC = () => {
    const [{ isOver }, drop] = useDrop({
      accept: 'column',
      drop: (item: DraggedItem) => {
        if (item.index !== undefined) {
          const dragIndex = item.index;
          const hoverIndex = columns.findIndex(col => col.id === item.id);
          if (dragIndex !== hoverIndex) {
            moveColumn(dragIndex, hoverIndex);
          }
        }
      },
      collect: (monitor) => ({
        isOver: monitor.isOver(),
      }),
    });

    return (
      <div
        ref={drop}
        className={`space-y-2 p-4 rounded-lg border-2 border-dashed transition-colors ${
          isOver 
            ? 'border-blue-400 bg-blue-50 dark:bg-blue-900/20' 
            : 'border-gray-200 dark:border-gray-600'
        }`}
      >
        {columns
          .sort((a, b) => a.order - b.order)
          .map((column, index) => (
            <DraggableColumn key={column.id} column={column} index={index} />
          ))}
      </div>
    );
  };

  const handleViewPayment = (payment: any) => {
    setSelectedPayment(payment);
  };

  const handlePaymentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessing(true);

    try {
      // Simüle edilmiş ödeme işlemi
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Rastgele ödeme durumu simülasyonu (test için)
      const randomStatus = Math.random();
      let status, message;
      
      if (randomStatus < 0.7) {
        // %70 başarılı
        status = 'completed';
        message = 'Ödeme başarıyla tamamlandı!';
      } else if (randomStatus < 0.85) {
        // %15 bekleyen
        status = 'pending';
        message = 'Ödeme onay bekliyor. Banka işlemi tamamlandıktan sonra güncellenecek.';
      } else {
        // %15 başarısız
        status = 'failed';
        message = 'Ödeme işlemi başarısız oldu. Lütfen kart bilgilerinizi kontrol edip tekrar deneyin.';
      }
      
      // Duruma göre toast mesajı
      if (status === 'completed') {
        toast.success(message);
      } else if (status === 'pending') {
        toast(message, {
          icon: '⏳',
          style: {
            background: '#fbbf24',
            color: '#fff',
          },
        });
      } else {
        toast.error(message);
      }
      
      setShowPaymentModal(false);
      setSelectedPayment(null);
      setPaymentForm({
        amount: '',
        description: ''
      });
      
      // Burada gerçek ödeme API'si çağrılacak
      // const response = await fetch('/api/payments', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({
      //     customerId: customerData.id,
      //     amount: paymentForm.amount,
      //     description: paymentForm.description,
      //     status: status, // Simüle edilen durum
      //     cardDetails: {
      //       number: paymentForm.cardNumber,
      //       holder: paymentForm.cardHolder,
      //       expiry: `${paymentForm.expiryMonth}/${paymentForm.expiryYear}`,
      //       cvv: paymentForm.cvv
      //     }
      //   })
      // });
      
    } catch (error) {
      toast.error('Ödeme işlemi başarısız oldu. Lütfen tekrar deneyin.');
    } finally {
      setIsProcessing(false);
    }
  };

  // Hızlı işlemler fonksiyonları
  const handleMakePayment = async (paymentId: string) => {
    try {
      // Seçili ödemeyi bul
      const payment = selectedPayment || customerPayments.find(p => p.id === paymentId);
      
      if (!payment) {
        toast.error('Ödeme bilgisi bulunamadı');
        return;
      }

      // Seçili ödemeyi state'e kaydet (modal için)
      setSelectedPayment(payment);
      
      // Ödeme modalını aç ve formu otomatik doldur
      setShowPaymentModal(true);
      setPaymentForm({
        amount: payment.amount.toString(),
        description: payment.description || 'Ödeme'
      });
      
      // Başarısız ödemeler için özel mesaj
      if (payment.status === 'failed') {
        toast.success('Başarısız ödeme için ödeme formu açılıyor...');
      } else {
        toast.success('Ödeme formu açılıyor...');
      }
    } catch (error) {
      console.error('Ödeme işlemi başlatılırken hata:', error);
      toast.error('Ödeme işlemi başlatılamadı');
    }
  };

  const handleDownloadInvoice = async () => {
    try {
      // Test amaçlı - gerçek API hazır olduğunda bu kısmı değiştirin
      toast.success('Fatura indirme özelliği test modunda çalışıyor');
      
      // Gerçek API çağrısı için bu kodu kullanın:
      /*
      const response = await fetch(`/api/invoices/${invoiceNumber}/download`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${customerData?.access_token}`,
        },
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `fatura-${invoiceNumber}.pdf`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        
        toast.success('Fatura başarıyla indirildi');
      } else {
        throw new Error('Fatura indirilemedi');
      }
      */
    } catch (error) {
      console.error('Fatura indirme hatası:', error);
      toast.error('Fatura indirilemedi');
    }
  };

  const handleViewReceipt = async (paymentId: string) => {
    try {
      // Test amaçlı mock veri
      const mockReceiptData = {
        receipt_number: `REC-${paymentId}`,
        amount: selectedPayment?.amount || '0.00',
        created_at: selectedPayment?.created_at || new Date().toISOString(),
        status: selectedPayment?.status || 'pending'
      };
      
      setReceiptData(mockReceiptData);
      setShowReceiptModal(true);
      
      // Gerçek API çağrısı için bu kodu kullanın:
      /*
      const response = await fetch(`/api/payments/${paymentId}/receipt`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${customerData?.access_token}`,
        },
      });

      if (response.ok) {
        const receiptData = await response.json();
        setReceiptData(receiptData);
        setShowReceiptModal(true);
      } else {
        throw new Error('Makbuz bulunamadı');
      }
      */
    } catch (error) {
      console.error('Makbuz görüntüleme hatası:', error);
      toast.error('Makbuz görüntülenemedi');
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'pending': return <Clock className="w-4 h-4 text-orange-500" />;
      case 'failed': return <XCircle className="w-4 h-4 text-red-500" />;
      default: return <AlertCircle className="w-4 h-4 text-gray-400" />;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'completed': return 'Tamamlandı';
      case 'pending': return 'Bekliyor';
      case 'failed': return 'Başarısız';
      default: return 'Bilinmiyor';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400';
      case 'pending': return 'bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400';
      case 'failed': return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400';
    }
  };

  // Ödeme istatistikleri
  const paymentStats = {
    total: customerPayments.length,
    completed: customerPayments.filter(p => p.status === 'completed').length,
    pending: customerPayments.filter(p => p.status === 'pending').length,
    failed: customerPayments.filter(p => p.status === 'failed').length,
    totalAmount: customerPayments
      .filter(p => p.status === 'completed')
      .reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0),
    pendingAmount: customerPayments
      .filter(p => p.status === 'pending')
      .reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0)
  };

  // Ödeme detay modalı
  if (selectedPayment) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => setSelectedPayment(null)}
              className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              ←
            </button>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              Ödeme Detayı
            </h2>
          </div>
          <div className="flex items-center space-x-2">
            {getStatusIcon(selectedPayment.status)}
            <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(selectedPayment.status)}`}>
              {getStatusText(selectedPayment.status)}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Ödeme Detayları */}
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Ödeme Bilgileri
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Fatura No
                </label>
                <span className="text-sm font-medium text-gray-900 dark:text-white font-mono">
                  #{selectedPayment.invoice_number || selectedPayment.id.slice(0, 8)}
                </span>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Tutar
                </label>
                <span className="text-2xl font-bold text-gray-900 dark:text-white">
                  {formatCurrency(parseFloat(selectedPayment.amount), selectedPayment.currency as any)}
                </span>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Açıklama
                </label>
                <span className="text-sm text-gray-900 dark:text-white">
                  {selectedPayment.description || 'Açıklama bulunmuyor'}
                </span>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Ödeme Yöntemi
                </label>
                <span className="text-sm text-gray-900 dark:text-white">
                  {selectedPayment.payment_method || 'Belirtilmemiş'}
                </span>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Oluşturulma Tarihi
                </label>
                <span className="text-sm text-gray-900 dark:text-white">
                  {format(new Date(selectedPayment.created_at), 'dd MMM yyyy HH:mm', { locale: tr })}
                </span>
              </div>
              
              {selectedPayment.updated_at && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Güncelleme Tarihi
                  </label>
                  <span className="text-sm text-gray-900 dark:text-white">
                    {format(new Date(selectedPayment.updated_at), 'dd MMM yyyy HH:mm', { locale: tr })}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Hızlı İşlemler */}
          <div className="space-y-6">
            {/* Başarısız Ödeme Uyarısı */}
            {selectedPayment.status === 'failed' && (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0">
                    <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 mt-0.5" />
                  </div>
                  <div className="flex-1">
                    <h4 className="text-sm font-medium text-red-900 dark:text-red-300 mb-1">
                      Ödeme Başarısız
                    </h4>
                    <p className="text-sm text-red-800 dark:text-red-200 mb-3">
                      Bu ödeme işlemi başarısız olmuştur. Lütfen kart bilgilerinizi kontrol edip tekrar deneyin.
                    </p>
                    <button
                      onClick={() => handleMakePayment(selectedPayment.id)}
                      className="inline-flex items-center px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-medium rounded-lg transition-colors"
                    >
                      <CreditCard className="w-4 h-4 mr-2" />
                      Tekrar Ödeme Yap
                    </button>
                  </div>
                </div>
              </div>
            )}

            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Hızlı İşlemler
              </h3>
              <div className="space-y-3">
                <button 
                  onClick={() => handleMakePayment(selectedPayment.id)}
                  className={`w-full flex items-center space-x-3 p-3 rounded-lg transition-colors ${
                    selectedPayment.status === 'failed' 
                      ? 'bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/40 border-2 border-red-200 dark:border-red-800' 
                      : 'bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/40'
                  }`}
                >
                  <CreditCard className={`w-5 h-5 ${
                    selectedPayment.status === 'failed' 
                      ? 'text-red-600 dark:text-red-400' 
                      : 'text-blue-600 dark:text-blue-400'
                  }`} />
                  <span className={`text-sm font-medium ${
                    selectedPayment.status === 'failed' 
                      ? 'text-red-900 dark:text-red-300' 
                      : 'text-gray-900 dark:text-white'
                  }`}>
                    {selectedPayment.status === 'failed' ? 'Tekrar Ödeme Yap' : 'Ödeme Yap'}
                  </span>
                </button>
               
                <button 
                  onClick={() => handleDownloadInvoice()}
                  className="w-full flex items-center space-x-3 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg hover:bg-green-100 dark:hover:bg-green-900/40 transition-colors"
                >
                  <Download className="w-5 h-5 text-green-600 dark:text-green-400" />
                  <span className="text-sm font-medium text-gray-900 dark:text-white">Fatura İndir</span>
                </button>
                
                <button 
                  onClick={() => handleViewReceipt(selectedPayment.id)}
                  className="w-full flex items-center space-x-3 p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg hover:bg-purple-100 dark:hover:bg-purple-900/40 transition-colors"
                >
                  <Receipt className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                  <span className="text-sm font-medium text-gray-900 dark:text-white">Makbuz Görüntüle</span>
                </button>

                <button 
                  onClick={() => {
                    // Ödeme geçmişini kopyala
                    const paymentInfo = `
Ödeme Bilgileri:
Fatura No: ${selectedPayment.invoice_number || selectedPayment.id.slice(0, 8)}
                Tutar: {formatCurrency(parseFloat(selectedPayment.amount))}
Durum: ${getStatusText(selectedPayment.status)}
Tarih: ${format(new Date(selectedPayment.created_at), 'dd.MM.yyyy HH:mm', { locale: tr })}
                    `.trim();
                    
                    navigator.clipboard.writeText(paymentInfo).then(() => {
                      toast.success('Ödeme bilgileri panoya kopyalandı!');
                    }).catch(() => {
                      toast.error('Kopyalama işlemi başarısız oldu');
                    });
                  }}
                  className="w-full flex items-center space-x-3 p-3 bg-orange-50 dark:bg-orange-900/20 rounded-lg hover:bg-orange-100 dark:hover:bg-orange-900/40 transition-colors"
                >
                  <Copy className="w-5 h-5 text-orange-600 dark:text-orange-400" />
                  <span className="text-sm font-medium text-gray-900 dark:text-white">Bilgileri Kopyala</span>
                </button>

                <button 
                  onClick={() => {
                    // Ödeme detaylarını yazdır
                    const printWindow = window.open('', '_blank');
                    if (printWindow) {
                      printWindow.document.write(`
                        <html>
                          <head><title>Ödeme Detayı</title></head>
                          <body style="font-family: Arial, sans-serif; padding: 20px;">
                            <h1>Ödeme Detayı</h1>
                            <p><strong>Fatura No:</strong> ${selectedPayment.invoice_number || selectedPayment.id.slice(0, 8)}</p>
                            <p><strong>Tutar:</strong> {formatCurrency(parseFloat(selectedPayment.amount))}</p>
                            <p><strong>Durum:</strong> ${getStatusText(selectedPayment.status)}</p>
                            <p><strong>Açıklama:</strong> ${selectedPayment.description || 'Açıklama bulunmuyor'}</p>
                            <p><strong>Oluşturulma Tarihi:</strong> ${format(new Date(selectedPayment.created_at), 'dd.MM.yyyy HH:mm', { locale: tr })}</p>
                            ${selectedPayment.updated_at ? `<p><strong>Güncelleme Tarihi:</strong> ${format(new Date(selectedPayment.updated_at), 'dd.MM.yyyy HH:mm', { locale: tr })}</p>` : ''}
                            <p><small>Yazdırma Tarihi: ${new Date().toLocaleDateString('tr-TR')}</small></p>
                          </body>
                        </html>
                      `);
                      printWindow.document.close();
                      printWindow.print();
                    }
                  }}
                  className="w-full flex items-center space-x-3 p-3 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg hover:bg-indigo-100 dark:hover:bg-indigo-900/40 transition-colors"
                >
                  <FileText className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                  <span className="text-sm font-medium text-gray-900 dark:text-white">Yazdır</span>
                </button>
              </div>
            </div>

            {/* Ödeme Geçmişi */}
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Ödeme Geçmişi
              </h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
                      <CreditCard className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">Ödeme Oluşturuldu</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {format(new Date(selectedPayment.created_at), 'dd MMM yyyy HH:mm', { locale: tr })}
                      </p>
                    </div>
                  </div>
                </div>
                
                {selectedPayment.status === 'completed' && (
                  <div className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
                        <CheckCircle className="w-4 h-4 text-green-600 dark:text-green-400" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900 dark:text-white">Ödeme Tamamlandı</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {selectedPayment.updated_at ? format(new Date(selectedPayment.updated_at), 'dd MMM yyyy HH:mm', { locale: tr }) : 'Bilinmiyor'}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Ana liste görünümü
  return (
    <DndProvider backend={HTML5Backend}>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button
              onClick={onBack}
              className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              ←
            </button>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Ödemelerim</h2>
          </div>
          <div className="flex items-center space-x-2">
            {/* Görünüm Değiştirme Toggle */}
            <div className="flex items-center bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
              <button
                onClick={() => setViewMode('list')}
                className={`flex items-center px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                  viewMode === 'list'
                    ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                <List className="w-4 h-4 mr-2" />
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
                <Grid3X3 className="w-4 h-4 mr-2" />
                Kanban
              </button>
            </div>

            {/* Sütun Ayarları Butonu (Sadece Kanban Görünümünde) */}
            {viewMode === 'kanban' && (
              <button
                onClick={() => setShowColumnSettings(true)}
                className="flex items-center space-x-2 px-4 py-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg font-medium transition-colors"
              >
                <Settings className="w-4 h-4" />
                <span>Sütunlar</span>
              </button>
            )}

            <button
              onClick={() => setShowPaymentModal(true)}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>Ödeme Yap</span>
            </button>
          </div>
        </div>

      {/* İstatistikler */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
              <CreditCard className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
            <span className="text-2xl font-bold text-gray-900 dark:text-white">
              {paymentStats.total}
            </span>
          </div>
          <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-1">
            Toplam Ödeme
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Tüm ödemeleriniz
          </p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
              <CheckCircle className="w-6 h-6 text-green-600 dark:text-green-400" />
            </div>
            <span className="text-2xl font-bold text-green-600 dark:text-green-400">
              {paymentStats.completed}
            </span>
          </div>
          <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-1">
            Tamamlanan
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Başarılı ödemeler
          </p>
        </div>

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
            Bekleyen
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Onay bekleyen ödemeler
          </p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 bg-red-100 dark:bg-red-900 rounded-lg">
              <XCircle className="w-6 h-6 text-red-600 dark:text-red-400" />
            </div>
            <span className="text-2xl font-bold text-red-600 dark:text-red-400">
              {paymentStats.failed}
            </span>
          </div>
          <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-1">
            Başarısız
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Başarısız ödemeler
          </p>
        </div>
      </div>

      {/* Toplam Tutarlar */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Toplam Ödenen
              </p>
              <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                ₺{paymentStats.totalAmount.toLocaleString()}
              </p>
            </div>
            <div className="p-3 bg-green-100 dark:bg-green-900 rounded-lg">
              <TrendingUp className="w-6 h-6 text-green-600 dark:text-green-400" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Bekleyen Tutar
              </p>
              <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                ₺{paymentStats.pendingAmount.toLocaleString()}
              </p>
            </div>
            <div className="p-3 bg-orange-100 dark:bg-orange-900 rounded-lg">
              <TrendingDown className="w-6 h-6 text-orange-600 dark:text-orange-400" />
            </div>
          </div>
        </div>
      </div>

      {/* Filtreler */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Fatura no, açıklama ara..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-gray-400" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">Tüm Durumlar</option>
              <option value="completed">Tamamlandı</option>
              <option value="pending">Bekliyor</option>
              <option value="failed">Başarısız</option>
            </select>
          </div>
        </div>
      </div>

        {/* Ödeme Görünümü */}
        {viewMode === 'list' ? (
          /* Liste Görünümü */
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
            {filteredPayments.length === 0 ? (
              <div className="text-center py-12">
                <CreditCard className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                  {searchTerm || statusFilter !== 'all' ? 'Arama kriterlerine uygun ödeme bulunamadı' : 'Henüz ödeme yapmadınız'}
                </h3>
                <p className="text-gray-500 dark:text-gray-400">
                  {searchTerm || statusFilter !== 'all' ? 'Farklı arama kriterleri deneyin' : 'İlk ödemeniz burada görünecek'}
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 dark:bg-gray-700">
                    <tr>
                      {sortedColumns.map((column) => (
                        <th
                          key={column.id}
                          className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"
                          style={{ width: column.width ? `${column.width}px` : 'auto' }}
                        >
                          {column.label}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                    {filteredPayments.map((payment) => (
                      <tr
                        key={payment.id}
                        className="hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer transition-colors"
                        onClick={() => handleViewPayment(payment)}
                      >
                        {sortedColumns.map((column) => (
                          <td key={column.id} className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                            {column.id === 'invoice_number' && (
                              <span className="font-medium">
                                #{payment.invoice_number || payment.id.slice(0, 8)}
                              </span>
                            )}
                            {column.id === 'description' && (
                              <span>{payment.description || 'Ödeme'}</span>
                            )}
                            {column.id === 'amount' && (
                              <span className="font-medium">
                                {formatCurrency(parseFloat(payment.amount), payment.currency as any)}
                              </span>
                            )}
                            {column.id === 'status' && (
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(payment.status)}`}>
                                {getStatusText(payment.status)}
                              </span>
                            )}
                            {column.id === 'payment_method' && (
                              <span>{payment.payment_method || 'Belirtilmemiş'}</span>
                            )}
                            {column.id === 'created_at' && (
                              <span>{format(new Date(payment.created_at), 'dd MMM yyyy', { locale: tr })}</span>
                            )}
                            {column.id === 'actions' && (
                              <div className="flex items-center space-x-2">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleViewPayment(payment);
                                  }}
                                  className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                                >
                                  <Eye className="w-4 h-4" />
                                </button>
                                {payment.status === 'failed' && (
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleMakePayment(payment.id);
                                    }}
                                    className="p-1 text-red-400 hover:text-red-600 dark:hover:text-red-400"
                                  >
                                    <CreditCard className="w-4 h-4" />
                                  </button>
                                )}
                              </div>
                            )}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        ) : (
          /* Kanban Görünümü */
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            {filteredPayments.length === 0 ? (
              <div className="text-center py-12">
                <CreditCard className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                  {searchTerm || statusFilter !== 'all' ? 'Arama kriterlerine uygun ödeme bulunamadı' : 'Henüz ödeme yapmadınız'}
                </h3>
                <p className="text-gray-500 dark:text-gray-400">
                  {searchTerm || statusFilter !== 'all' ? 'Farklı arama kriterleri deneyin' : 'İlk ödemeniz burada görünecek'}
                </p>
              </div>
            ) : (
              <div className="flex gap-6 overflow-x-auto pb-4">
                {paymentsByStatus.map((status) => (
                  <DroppableStatusColumn key={status.id} status={status} />
                ))}
              </div>
            )}
          </div>
        )}

      {/* Hızlı İşlemler */}
      {filteredPayments.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Hızlı İşlemler
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <button
              onClick={() => setShowPaymentModal(true)}
              className="flex items-center space-x-3 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/40 transition-colors"
            >
              <Plus className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              <div className="text-left">
                <p className="font-medium text-gray-900 dark:text-white">Yeni Ödeme</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">Hızlı ödeme yap</p>
              </div>
            </button>
            
            <button
              onClick={() => setShowExportModal(true)}
              className="flex items-center space-x-3 p-4 bg-green-50 dark:bg-green-900/20 rounded-lg hover:bg-green-100 dark:hover:bg-green-900/40 transition-colors"
            >
              <Download className="w-6 h-6 text-green-600 dark:text-green-400" />
              <div className="text-left">
                <p className="font-medium text-gray-900 dark:text-white">Geçmişi İndir</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">PDF, JSON, CSV formatında</p>
              </div>
            </button>
            
            <button
              onClick={() => {
                // Ödeme raporu oluştur
                const reportData = {
                  total: filteredPayments.length,
                  completed: filteredPayments.filter(p => p.status === 'completed').length,
                  pending: filteredPayments.filter(p => p.status === 'pending').length,
                  failed: filteredPayments.filter(p => p.status === 'failed').length,
                  totalAmount: filteredPayments
                    .filter(p => p.status === 'completed')
                    .reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0),
                  pendingAmount: filteredPayments
                    .filter(p => p.status === 'pending')
                    .reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0)
                };
                
                const reportWindow = window.open('', '_blank');
                if (reportWindow) {
                  reportWindow.document.write(`
                    <html>
                      <head><title>Ödeme Raporu</title></head>
                      <body style="font-family: Arial, sans-serif; padding: 20px;">
                        <h1>Ödeme Raporu - ${customerData?.name}</h1>
                        <h2>Genel İstatistikler</h2>
                        <p>Toplam Ödeme: ${reportData.total}</p>
                        <p>Tamamlanan: ${reportData.completed}</p>
                        <p>Bekleyen: ${reportData.pending}</p>
                        <p>Başarısız: ${reportData.failed}</p>
                        <h2>Finansal Özet</h2>
                                        <p>Toplam Ödenen: {formatCurrency(reportData.totalAmount)}</p>
                <p>Bekleyen Tutar: {formatCurrency(reportData.pendingAmount)}</p>
                        <p>Başarı Oranı: %${reportData.total > 0 ? Math.round(((reportData.total - reportData.pending - reportData.failed) / reportData.total) * 100) : 0}</p>
                        <p><small>Rapor Tarihi: ${new Date().toLocaleDateString('tr-TR')}</small></p>
                      </body>
                    </html>
                  `);
                  reportWindow.document.close();
                }
                
                toast.success('Ödeme raporu yeni sekmede açıldı!');
              }}
              className="flex items-center space-x-3 p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg hover:bg-purple-100 dark:hover:bg-purple-900/40 transition-colors"
            >
              <BarChart3 className="w-6 h-6 text-purple-600 dark:text-purple-400" />
              <div className="text-left">
                <p className="font-medium text-gray-900 dark:text-white">Rapor Oluştur</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">Detaylı analiz</p>
              </div>
            </button>

            <button
              onClick={() => {
                // Toplu fatura indirme
                const completedPayments = filteredPayments.filter(p => p.status === 'completed');
                if (completedPayments.length === 0) {
                  toast.error('İndirilecek fatura bulunmuyor');
                  return;
                }
                
                toast.success(`${completedPayments.length} fatura indirme işlemi başlatıldı`);
                // Burada gerçek fatura indirme API'si çağrılacak
              }}
              className="flex items-center space-x-3 p-4 bg-orange-50 dark:bg-orange-900/20 rounded-lg hover:bg-orange-100 dark:hover:bg-orange-900/40 transition-colors"
            >
              <FileText className="w-6 h-6 text-orange-600 dark:text-orange-400" />
              <div className="text-left">
                <p className="font-medium text-gray-900 dark:text-white">Faturaları İndir</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">Toplu indirme</p>
              </div>
            </button>
          </div>
        </div>
      )}

      {/* Stripe Benzeri Ödeme Modal */}
      {showPaymentModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                  {selectedPayment && selectedPayment.status === 'failed' ? 'Tekrar Ödeme Yap' : 'Güvenli Ödeme'}
                </h2>
                <button
                  onClick={() => {
                    setShowPaymentModal(false);
                    setSelectedPayment(null);
                    setPaymentForm({ amount: '', description: '' });
                  }}
                  className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Başarısız Ödeme Uyarısı */}
              {selectedPayment && selectedPayment.status === 'failed' && (
                <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                  <div className="flex items-start space-x-3">
                    <div className="flex-shrink-0">
                      <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 mt-0.5" />
                    </div>
                    <div className="flex-1">
                      <h4 className="text-sm font-medium text-red-900 dark:text-red-300 mb-1">
                        Önceki Ödeme Başarısız
                      </h4>
                      <p className="text-sm text-red-800 dark:text-red-200">
                        Bu ödeme işlemi daha önce başarısız olmuştur. Lütfen kart bilgilerinizi kontrol edip tekrar deneyin.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              <form onSubmit={handlePaymentSubmit} className="space-y-6">
                {/* Ödeme Bilgileri */}
                <div className="space-y-4">
                  {/* Başarısız ödeme için özel açıklama */}
                  {selectedPayment && selectedPayment.status === 'failed' && (
                    <div className="p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                      <p className="text-sm text-blue-800 dark:text-blue-200">
                        <strong>Önceki Ödeme Bilgileri:</strong> Bu ödeme daha önce başarısız olmuştur. 
                        Aynı tutar ve açıklama ile yeni bir ödeme denemesi yapabilirsiniz.
                      </p>
                    </div>
                  )}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Tutar (₺)
                    </label>
                    <input
                      type="number"
                      value={paymentForm.amount}
                      onChange={(e) => setPaymentForm({ ...paymentForm, amount: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="0.00"
                      min="0.01"
                      step="0.01"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Açıklama
                    </label>
                    <input
                      type="text"
                      value={paymentForm.description}
                      onChange={(e) => setPaymentForm({ ...paymentForm, description: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Ödeme açıklaması"
                      required
                    />
                  </div>
                </div>

                {/* Stripe Kart Bilgileri */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
                    <Lock className="w-5 h-5 mr-2 text-green-600" />
                    Kart Bilgileri
                  </h3>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Kart Numarası
                    </label>
                    <input
                      type="text"
                      className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                      placeholder="1234 5678 9012 3456"
                      maxLength={19}
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Kart Sahibi
                    </label>
                    <input
                      type="text"
                      className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="AD SOYAD"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Ay
                      </label>
                      <select
                        className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                        required
                      >
                        <option value="">Ay</option>
                        {Array.from({ length: 12 }, (_, i) => i + 1).map(month => (
                          <option key={month} value={month.toString().padStart(2, '0')}>
                            {month.toString().padStart(2, '0')}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Yıl
                      </label>
                      <select
                        className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                        required
                      >
                        <option value="">Yıl</option>
                        {Array.from({ length: 10 }, (_, i) => new Date().getFullYear() + i).map(year => (
                          <option key={year} value={year.toString().slice(-2)}>
                            {year}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        CVV
                      </label>
                      <input
                        type="text"
                        className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                        placeholder="123"
                        maxLength={4}
                        required
                      />
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="saveCard"
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <label htmlFor="saveCard" className="text-sm text-gray-700 dark:text-gray-300">
                      Kartı kaydet (güvenli)
                    </label>
                  </div>
                </div>

                {/* Güvenlik Bilgisi */}
                <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                  <div className="flex items-start space-x-3">
                    <Lock className="w-5 h-5 text-green-600 mt-0.5" />
                    <div>
                      <h4 className="text-sm font-medium text-green-900 dark:text-green-300">
                        Güvenli Ödeme
                      </h4>
                      <p className="text-xs text-green-800 dark:text-green-200 mt-1">
                        Tüm ödeme bilgileriniz SSL ile şifrelenir ve güvenli sunucularda saklanır.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Ödeme Butonu */}
                <div className="flex justify-end pt-4">
                  <button
                    type="submit"
                    disabled={isProcessing}
                    className="px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-lg font-medium transition-colors"
                  >
                    {isProcessing ? (
                      <div className="flex items-center space-x-2">
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                        <span>İşleniyor...</span>
                      </div>
                    ) : (
                      <>
                        <CreditCard className="w-5 h-5 inline mr-2" />
                        {selectedPayment && selectedPayment.status === 'failed' ? 'Tekrar Ödeme Yap' : 'Ödeme Yap'}
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Makbuz Modal'ı */}
      {showReceiptModal && receiptData && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Makbuz</h3>
              <button
                onClick={() => setShowReceiptModal(false)}
                className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="font-medium text-gray-700 dark:text-gray-300">Makbuz No:</span>
                <span className="text-gray-900 dark:text-white">{receiptData.receipt_number || 'N/A'}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium text-gray-700 dark:text-gray-300">Tutar:</span>
                <span className="text-gray-900 dark:text-white">₺{receiptData.amount || '0.00'}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium text-gray-700 dark:text-gray-300">Tarih:</span>
                <span className="text-gray-900 dark:text-white">
                  {receiptData.created_at ? format(new Date(receiptData.created_at), 'dd MMM yyyy HH:mm', { locale: tr }) : 'N/A'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium text-gray-700 dark:text-gray-300">Durum:</span>
                <span className={`px-2 py-1 rounded text-sm ${
                  receiptData.status === 'completed' ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400' : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400'
                }`}>
                  {receiptData.status === 'completed' ? 'Tamamlandı' : 'Bekliyor'}
                </span>
              </div>
            </div>
            
            <div className="mt-6 flex gap-3">
              <button
                onClick={() => {
                  // Makbuzu yazdır
                  window.print();
                }}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
              >
                Yazdır
              </button>
              <button
                onClick={() => setShowReceiptModal(false)}
                className="flex-1 bg-gray-300 hover:bg-gray-400 dark:bg-gray-600 dark:hover:bg-gray-500 text-gray-700 dark:text-gray-200 px-4 py-2 rounded-lg transition-colors"
              >
                Kapat
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Export Modal */}
      {showExportModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 max-w-md w-full mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Geçmişi İndir</h3>
              <button
                onClick={() => setShowExportModal(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <div className="space-y-4">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Ödeme geçmişinizi hangi formatta indirmek istiyorsunuz?
              </p>
              
              <div className="space-y-3">
                <button
                  onClick={() => {
                    // PDF formatında indir
                    
                    // PDF oluştur
                    const pdfContent = `
                      <html>
                        <head>
                          <title>Ödeme Geçmişi - ${customerData?.name}</title>
                          <style>
                            body { font-family: Arial, sans-serif; margin: 20px; }
                            .header { text-align: center; margin-bottom: 30px; }
                            .customer-info { margin-bottom: 20px; }
                            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
                            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
                            th { background-color: #f2f2f2; }
                            .status-completed { color: green; }
                            .status-pending { color: orange; }
                            .status-failed { color: red; }
                            .footer { margin-top: 30px; text-align: center; font-size: 12px; color: #666; }
                          </style>
                        </head>
                        <body>
                          <div class="header">
                            <h1>Ödeme Geçmişi</h1>
                            <p>Müşteri: ${customerData?.name}</p>
                            <p>Rapor Tarihi: ${new Date().toLocaleDateString('tr-TR')}</p>
                          </div>
                          
                          <div class="customer-info">
                            <h3>Müşteri Bilgileri</h3>
                            <p><strong>Ad Soyad:</strong> ${customerData?.name}</p>
                            <p><strong>Email:</strong> ${customerData?.email}</p>
                            <p><strong>Telefon:</strong> ${customerData?.phone}</p>
                          </div>
                          
                          <table>
                            <thead>
                              <tr>
                                <th>Fatura No</th>
                                <th>Tarih</th>
                                <th>Açıklama</th>
                                <th>Tutar</th>
                                <th>Durum</th>
                              </tr>
                            </thead>
                            <tbody>
                              ${filteredPayments.map(payment => `
                                <tr>
                                  <td>${payment.invoice_number || payment.id.slice(0, 8)}</td>
                                  <td>${format(new Date(payment.created_at), 'dd.MM.yyyy', { locale: tr })}</td>
                                  <td>${payment.description || 'Ödeme'}</td>
                                  <td>${formatCurrency(parseFloat(payment.amount), payment.currency as any)}</td>
                                  <td class="status-${payment.status}">${getStatusText(payment.status)}</td>
                                </tr>
                              `).join('')}
                            </tbody>
                          </table>
                          
                          <div class="footer">
                            <p>Bu rapor ${new Date().toLocaleDateString('tr-TR')} tarihinde oluşturulmuştur.</p>
                            <p>Toplam ${filteredPayments.length} ödeme kaydı bulunmaktadır.</p>
                          </div>
                        </body>
                      </html>
                    `;
                    
                    const blob = new Blob([pdfContent], { type: 'text/html' });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `odeme-gecmisi-${customerData?.name || 'user'}-${new Date().toISOString().split('T')[0]}.html`;
                    document.body.appendChild(a);
                    a.click();
                    document.body.removeChild(a);
                    URL.revokeObjectURL(url);
                    
                    setShowExportModal(false);
                    toast.success('Ödeme geçmişi PDF formatında indirildi!');
                  }}
                  className="w-full flex items-center space-x-3 p-3 bg-red-50 dark:bg-red-900/20 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/40 transition-colors"
                >
                  <FileText className="w-5 h-5 text-red-600" />
                  <div className="text-left">
                    <p className="font-medium text-gray-900 dark:text-white">PDF Format</p>
                    <p className="text-xs text-gray-600 dark:text-gray-400">Yazdırılabilir rapor</p>
                  </div>
                </button>
                
                <button
                  onClick={() => {
                    // JSON formatında indir
                    
                    const paymentHistory = {
                      customer: customerData,
                      payments: filteredPayments,
                      exportDate: new Date().toISOString()
                    };
                    const blob = new Blob([JSON.stringify(paymentHistory, null, 2)], { type: 'application/json' });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `odeme-gecmisi-${customerData?.name || 'user'}-${new Date().toISOString().split('T')[0]}.json`;
                    document.body.appendChild(a);
                    a.click();
                    document.body.removeChild(a);
                    URL.revokeObjectURL(url);
                    
                    setShowExportModal(false);
                    toast.success('Ödeme geçmişi JSON formatında indirildi!');
                  }}
                  className="w-full flex items-center space-x-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/40 transition-colors"
                >
                  <FileText className="w-5 h-5 text-blue-600" />
                  <div className="text-left">
                    <p className="font-medium text-gray-900 dark:text-white">JSON Format</p>
                    <p className="text-xs text-gray-600 dark:text-gray-400">Tam veri yapısı</p>
                  </div>
                </button>
                
                <button
                  onClick={() => {
                    // CSV formatında indir
                    const csvHeaders = ['Fatura No', 'Tarih', 'Açıklama', 'Tutar', 'Durum', 'Ödeme Yöntemi'];
                    const csvData = filteredPayments.map(payment => [
                      payment.invoice_number || payment.id.slice(0, 8),
                      format(new Date(payment.created_at), 'dd.MM.yyyy', { locale: tr }),
                      payment.description || 'Ödeme',
                      formatCurrency(parseFloat(payment.amount), payment.currency as any),
                      getStatusText(payment.status),
                      payment.payment_method || 'Belirtilmemiş'
                    ]);
                    
                    const csvContent = [csvHeaders, ...csvData]
                      .map(row => row.map(cell => `"${cell}"`).join(','))
                      .join('\n');
                    
                    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `odeme-gecmisi-${customerData?.name || 'user'}-${new Date().toISOString().split('T')[0]}.csv`;
                    document.body.appendChild(a);
                    a.click();
                    document.body.removeChild(a);
                    URL.revokeObjectURL(url);
                    
                    setShowExportModal(false);
                    toast.success('Ödeme geçmişi CSV formatında indirildi!');
                  }}
                  className="w-full flex items-center space-x-3 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg hover:bg-green-100 dark:hover:bg-green-900/40 transition-colors"
                >
                  <FileText className="w-5 h-5 text-green-600" />
                  <div className="text-left">
                    <p className="font-medium text-gray-900 dark:text-white">CSV Format</p>
                    <p className="text-xs text-gray-600 dark:text-gray-400">Excel uyumlu</p>
                  </div>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Sütun Ayarları Modal */}
      {showColumnSettings && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 w-full max-w-4xl mx-4 max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Sütun Ayarları
              </h3>
              <button
                onClick={() => setShowColumnSettings(false)}
                className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-6">
              <div>
                <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-3">
                  Sütunları Sürükleyerek Yeniden Sıralayın
                </h4>
                <DroppableColumnList />
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-gray-700">
                <div className="flex items-center space-x-3">
                  <button
                    onClick={() => setShowAddColumnModal(true)}
                    className="flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Yeni Sütun Ekle</span>
                  </button>
                  
                  <button
                    onClick={resetColumns}
                    className="flex items-center space-x-2 px-4 py-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg font-medium transition-colors"
                  >
                    <RotateCcw className="w-4 h-4" />
                    <span>Sıfırla</span>
                  </button>
                </div>

                <div className="flex items-center space-x-3">
                  <button
                    onClick={() => setShowColumnSettings(false)}
                    className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white font-medium transition-colors"
                  >
                    İptal
                  </button>
                  <button
                    onClick={saveColumnSettings}
                    className="flex items-center space-x-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors"
                  >
                    <Save className="w-4 h-4" />
                    <span>Kaydet</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Yeni Sütun Ekleme Modal */}
      {showAddColumnModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 w-full max-w-md mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Yeni Sütun Ekle
              </h3>
              <button
                onClick={() => setShowAddColumnModal(false)}
                className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Sütun Adı
                </label>
                <input
                  type="text"
                  value={newColumnData.label}
                  onChange={(e) => setNewColumnData({ ...newColumnData, label: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Örn: Özel Alan"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Sütun ID (Teknik)
                </label>
                <input
                  type="text"
                  value={newColumnData.id}
                  onChange={(e) => setNewColumnData({ ...newColumnData, id: e.target.value.toLowerCase().replace(/\s+/g, '_') })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="ozel_alan"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Sütun Genişliği (px)
                </label>
                <input
                  type="number"
                  value={newColumnData.width}
                  onChange={(e) => setNewColumnData({ ...newColumnData, width: parseInt(e.target.value) || 150 })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  min="100"
                  max="500"
                />
              </div>
            </div>

            <div className="flex items-center justify-end space-x-3 mt-6">
              <button
                onClick={() => setShowAddColumnModal(false)}
                className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white font-medium transition-colors"
              >
                İptal
              </button>
              <button
                onClick={addNewColumn}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
              >
                Ekle
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
    </DndProvider>
  );
};

export default CustomerPayments;
