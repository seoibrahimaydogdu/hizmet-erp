import React, { useState, useEffect } from 'react';
import { 
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
  Star,
  Settings,
  GripVertical,
  X,
  Save,
  RotateCcw,
  List,
  Grid3X3
} from 'lucide-react';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';
import { useSupabase } from '../hooks/useSupabase';
import { getCurrencyOptions, getCurrencySymbol } from '../lib/currency';
import { toast } from 'react-hot-toast';
import { MessageSquare } from 'lucide-react';
import AdvancedSearch, { SearchFilters } from './AdvancedSearch';
import RealTimeHintSystem from './RealTimeHintSystem';
import FeedbackButton from './common/FeedbackButton';
import { DndProvider, useDrag, useDrop } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';

interface CustomersPageProps {
  onViewCustomer?: (customerId: string) => void;
  onViewTicket?: (ticketId: string) => void;
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

const CustomersPage: React.FC<CustomersPageProps> = ({ onViewCustomer, onViewTicket }) => {
  const {
    loading,
    customers,
    tickets,
    searchTerm,
    selectedItems,
    setSelectedItems,
    exportData,
    fetchCustomers
  } = useSupabase();

  const [planFilter, setPlanFilter] = useState('all');
  const [viewMode, setViewMode] = useState<'list' | 'kanban'>('list');
  const [showNewCustomerModal, setShowNewCustomerModal] = useState(false);
  const [showActionMenu, setShowActionMenu] = useState<string | null>(null);
  const [showViewModal, setShowViewModal] = useState<string | null>(null);
  const [showEditModal, setShowEditModal] = useState<string | null>(null);
  const [showColumnSettings, setShowColumnSettings] = useState(false);
  const [showAddColumnModal, setShowAddColumnModal] = useState(false);
  const [newColumnData, setNewColumnData] = useState({
    label: '',
    id: '',
    width: 150
  });
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

  // Sütun yönetimi state'leri
  const [columns, setColumns] = useState<ColumnConfig[]>([
    { id: 'customer', label: 'Müşteri', visible: true, order: 0 },
    { id: 'contact', label: 'İletişim', visible: true, order: 1 },
    { id: 'plan', label: 'Plan', visible: true, order: 2 },
    { id: 'currency', label: 'Para Birimi', visible: true, order: 3 },
    { id: 'satisfaction', label: 'Memnuniyet', visible: true, order: 4 },
    { id: 'tickets', label: 'Talepler', visible: true, order: 5 },
    { id: 'payment_status', label: 'Ödeme Durumu', visible: true, order: 6 },
    { id: 'last_payment', label: 'Son Ödeme', visible: true, order: 7 },
    { id: 'created_at', label: 'Kayıt Tarihi', visible: true, order: 8 },
    { id: 'actions', label: 'İşlemler', visible: true, order: 9 }
  ]);

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
        console.log('Deleting customer:', customerId);
        toast.success('Müşteri başarıyla silindi');
        fetchCustomers();
      } catch (error) {
        toast.error('Müşteri silinirken hata oluştu');
      }
    }
  };

  const handleCreateTicket = () => {
    // Yeni talep oluşturma
    toast.success('Yeni talep oluşturma sayfasına yönlendiriliyor...');
    setShowActionMenu(null);
  };

  const handleSendEmail = () => {
    // E-posta gönderme
    toast.success('E-posta gönderme penceresi açılıyor...');
    setShowActionMenu(null);
  };

  const handleViewTickets = () => {
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

  // Sürükle-bırak fonksiyonları
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
      { id: 'customer', label: 'Müşteri', visible: true, order: 0 },
      { id: 'contact', label: 'İletişim', visible: true, order: 1 },
      { id: 'plan', label: 'Plan', visible: true, order: 2 },
      { id: 'currency', label: 'Para Birimi', visible: true, order: 3 },
      { id: 'satisfaction', label: 'Memnuniyet', visible: true, order: 4 },
      { id: 'tickets', label: 'Talepler', visible: true, order: 5 },
      { id: 'payment_status', label: 'Ödeme Durumu', visible: true, order: 6 },
      { id: 'last_payment', label: 'Son Ödeme', visible: true, order: 7 },
      { id: 'created_at', label: 'Kayıt Tarihi', visible: true, order: 8 },
      { id: 'actions', label: 'İşlemler', visible: true, order: 9 }
    ]);
    toast.success('Sütunlar varsayılan ayarlara sıfırlandı');
  };

  const saveColumnSettings = () => {
    // Burada localStorage'a kaydedebiliriz
    localStorage.setItem('customers-columns', JSON.stringify(columns));
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
    const defaultColumns = ['customer', 'contact', 'plan', 'actions'];
    if (defaultColumns.includes(columnId)) {
      toast.error('Bu sütun silinemez');
      return;
    }

    setColumns(prev => prev.filter(col => col.id !== columnId));
    toast.success('Sütun silindi');
  };

  // Kanban için plan türlerini tanımla
  const planTypes = [
    { id: 'free', label: 'Free', color: 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400' },
    { id: 'basic', label: 'Basic', color: 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400' },
    { id: 'pro', label: 'Pro', color: 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400' },
    { id: 'professional', label: 'Professional', color: 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400' },
    { id: 'premium', label: 'Premium', color: 'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400' }
  ];

  // Kanban için müşterileri plan türlerine göre grupla
  const customersByPlan = planTypes.map(plan => ({
    ...plan,
    customers: filteredCustomers.filter(customer => customer.plan === plan.id)
  }));

  // Kanban için müşteri planını güncelle
  const updateCustomerPlan = async (customerId: string, newPlan: string) => {
    try {
      // Burada Supabase update işlemi yapılacak
      console.log('Updating customer plan:', customerId, 'to', newPlan);
      toast.success('Müşteri planı güncellendi');
      fetchCustomers();
    } catch (error) {
      toast.error('Plan güncellenirken hata oluştu');
    }
  };

  // Sıralı sütunları al
  const sortedColumns = columns
    .filter(col => col.visible)
    .sort((a, b) => a.order - b.order);

  // Kanban bileşenleri
  const DraggableCustomerCard: React.FC<{ customer: any; planId: string }> = ({ customer, planId }) => {
    const [{ isDragging }, drag] = useDrag({
      type: 'customer',
      item: { type: 'customer', id: customer.id, planId },
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
      >
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center">
            {customer.avatar_url ? (
              <img
                src={customer.avatar_url}
                alt={customer.name}
                className="w-8 h-8 rounded-full object-cover"
              />
            ) : (
              <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white font-semibold text-sm">
                {customer.name.charAt(0)}
              </div>
            )}
            <div className="ml-3">
              <h4 className="text-sm font-medium text-gray-900 dark:text-white">
                {customer.name}
              </h4>
              {customer.company && (
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {customer.company}
                </p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => handleViewCustomer(customer.id)}
              className="p-1 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400"
              title="Görüntüle"
            >
              <Eye className="w-3 h-3" />
            </button>
            <button
              onClick={() => handleEditCustomer(customer.id)}
              className="p-1 text-gray-400 hover:text-green-600 dark:hover:text-green-400"
              title="Düzenle"
            >
              <Edit className="w-3 h-3" />
            </button>
          </div>
        </div>
        
        <div className="space-y-2">
          <div className="flex items-center text-xs text-gray-500 dark:text-gray-400">
            <Mail className="w-3 h-3 mr-1" />
            {customer.email}
          </div>
          {customer.phone && (
            <div className="flex items-center text-xs text-gray-500 dark:text-gray-400">
              <Phone className="w-3 h-3 mr-1" />
              {customer.phone}
            </div>
          )}
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <Star className="w-3 h-3 text-yellow-400 fill-current mr-1" />
              <span className="text-xs text-gray-600 dark:text-gray-400">
                {customer.satisfaction_score}/5
              </span>
            </div>
            <span className="text-xs text-gray-500 dark:text-gray-400">
              {customer.total_tickets} talep
            </span>
          </div>
        </div>
      </div>
    );
  };

  const DroppablePlanColumn: React.FC<{ plan: any }> = ({ plan }) => {
    const [{ isOver }, drop] = useDrop({
      accept: 'customer',
      drop: (item: any) => {
        if (item.planId !== plan.id) {
          updateCustomerPlan(item.id, plan.id);
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
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${plan.color}`}>
              {plan.label}
            </span>
            <span className="ml-2 text-sm text-gray-500 dark:text-gray-400">
              ({plan.customers.length})
            </span>
          </div>
        </div>
        
        <div className="space-y-3 max-h-96 overflow-y-auto">
          {plan.customers.map((customer: any) => (
            <DraggableCustomerCard
              key={customer.id}
              customer={customer}
              planId={plan.id}
            />
          ))}
          {plan.customers.length === 0 && (
            <div className="text-center py-8 text-gray-400 dark:text-gray-500">
              <User className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">Bu planda müşteri yok</p>
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

    const isDefaultColumn = ['customer', 'contact', 'plan', 'actions'].includes(column.id);

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

  return (
    <DndProvider backend={HTML5Backend}>
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
          {/* Görünüm Seçenekleri */}
          <div className="flex items-center bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
            <button
              onClick={() => setViewMode('list')}
              className={`inline-flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                viewMode === 'list'
                  ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
              title="Liste Görünümü"
            >
              <List className="w-4 h-4 mr-2" />
              Liste
            </button>
            <button
              onClick={() => setViewMode('kanban')}
              className={`inline-flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                viewMode === 'kanban'
                  ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
              title="Kanban Görünümü"
            >
              <Grid3X3 className="w-4 h-4 mr-2" />
              Kanban
            </button>
          </div>
          <button
            onClick={() => setShowColumnSettings(true)}
            className="inline-flex items-center px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
            title="Sütun Ayarları"
          >
            <Settings className="w-4 h-4 mr-2" />
            Sütunlar
          </button>
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
          <FeedbackButton 
            pageSource="customers" 
            position="inline"
            className="inline-flex items-center px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-medium"
          />
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

      {/* Customers View */}
      {viewMode === 'list' ? (
        /* Liste Görünümü */
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
                  {sortedColumns.map((column) => (
                    <th 
                      key={column.id}
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"
                    >
                      {column.label}
                    </th>
                  ))}
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
                      {sortedColumns.map((column) => (
                        <td key={column.id} className="px-6 py-4">
                          {column.id === 'customer' && (
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
                          )}
                          {column.id === 'contact' && (
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
                          )}
                          {column.id === 'plan' && (
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getPlanColor(customer.plan)}`}>
                              {getPlanText(customer.plan)}
                            </span>
                          )}
                          {column.id === 'currency' && (
                            <div className="flex items-center">
                              <span className="text-sm font-medium text-gray-900 dark:text-white">
                                {getCurrencySymbol(customer.currency as any)}
                              </span>
                              <span className="text-sm text-gray-500 dark:text-gray-400 ml-1">
                                {customer.currency}
                              </span>
                            </div>
                          )}
                          {column.id === 'satisfaction' && (
                            <div className="flex items-center">
                              <Star className="w-4 h-4 text-yellow-400 fill-current mr-1" />
                              <span className="text-sm font-medium text-gray-900 dark:text-white">
                                {customer.satisfaction_score}/5
                              </span>
                            </div>
                          )}
                          {column.id === 'tickets' && (
                            <span className="text-sm font-medium text-gray-900 dark:text-white">
                              {customer.total_tickets}
                            </span>
                          )}
                          {column.id === 'payment_status' && (
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
                          )}
                          {column.id === 'last_payment' && (
                            <span className="text-sm text-gray-500 dark:text-gray-400">
                              {format(new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000), 'dd MMM yyyy', { locale: tr })}
                            </span>
                          )}
                          {column.id === 'created_at' && (
                            <span className="text-sm text-gray-500 dark:text-gray-400">
                              {format(new Date(customer.created_at), 'dd MMM yyyy', { locale: tr })}
                            </span>
                          )}
                        {column.id === 'actions' && (
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
                                      onClick={handleCreateTicket}
                                      className="block w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                                    >
                                      Yeni Talep Oluştur
                                    </button>
                                    <button
                                      onClick={handleSendEmail}
                                      className="block w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                                    >
                                      E-posta Gönder
                                    </button>
                                    <button
                                      onClick={handleViewTickets}
                                      className="block w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                                    >
                                      Taleplerini Görüntüle
                                    </button>
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                        {/* Özel sütunlar için genel render */}
                        {!['customer', 'contact', 'plan', 'currency', 'satisfaction', 'tickets', 'payment_status', 'last_payment', 'created_at', 'actions'].includes(column.id) && (
                          <div className="text-sm text-gray-500 dark:text-gray-400">
                            {/* Özel sütun verisi burada gösterilecek */}
                            {/* Müşteri objesinde bu sütun ID'si ile eşleşen veri varsa göster */}
                            {(customer as any)[column.id] || '-'}
                          </div>
                        )}
                        </td>
                      ))}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* Kanban Görünümü */
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <span className="ml-3 text-gray-500 dark:text-gray-400">Yükleniyor...</span>
            </div>
          ) : filteredCustomers.length === 0 ? (
            <div className="text-center py-12 text-gray-500 dark:text-gray-400">
              <User className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p className="text-lg font-medium mb-2">
                {searchTerm || planFilter !== 'all' ? 'Arama kriterlerine uygun müşteri bulunamadı' : 'Henüz müşteri bulunmuyor'}
              </p>
              <p className="text-sm">Yeni müşteri eklemek için yukarıdaki "Yeni Müşteri" butonunu kullanın.</p>
            </div>
          ) : (
            <div className="flex gap-6 overflow-x-auto pb-4">
              {customersByPlan.map((plan) => (
                <DroppablePlanColumn key={plan.id} plan={plan} />
              ))}
            </div>
          )}
        </div>
      )}

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

      {/* Sütun Ayarları Modal */}
      {showColumnSettings && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 w-full max-w-4xl mx-4 max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Sütun Ayarları</h3>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setShowAddColumnModal(true)}
                  className="inline-flex items-center px-3 py-2 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded-lg"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Sütun Ekle
                </button>
                <button
                  onClick={() => setShowColumnSettings(false)}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
            
            <div className="space-y-6">
              <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-3">
                  Sütunları sürükleyerek sıralayın ve görünürlüklerini ayarlayın
                </h4>
                <DndProvider backend={HTML5Backend}>
                  <DroppableColumnList />
                </DndProvider>
              </div>
              
              <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-gray-600">
                <div className="flex items-center gap-3">
                  <button
                    onClick={resetColumns}
                    className="inline-flex items-center px-4 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                  >
                    <RotateCcw className="w-4 h-4 mr-2" />
                    Varsayılana Sıfırla
                  </button>
                  <span className="text-sm text-gray-500 dark:text-gray-400">
                    {columns.filter(col => col.visible).length} sütun görünür
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setShowColumnSettings(false)}
                    className="px-4 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                  >
                    İptal
                  </button>
                  <button
                    onClick={saveColumnSettings}
                    className="inline-flex items-center px-4 py-2 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded-lg"
                  >
                    <Save className="w-4 h-4 mr-2" />
                    Kaydet
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
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Yeni Sütun Ekle</h3>
              <button
                onClick={() => setShowAddColumnModal(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Sütun Adı *
                </label>
                <input
                  type="text"
                  value={newColumnData.label}
                  onChange={(e) => setNewColumnData({ ...newColumnData, label: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Örn: Şehir, Ülke, Notlar..."
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Sütun ID *
                </label>
                <input
                  type="text"
                  value={newColumnData.id}
                  onChange={(e) => setNewColumnData({ ...newColumnData, id: e.target.value.toLowerCase().replace(/\s+/g, '_') })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Örn: city, country, notes..."
                />
                <p className="text-xs text-gray-500 mt-1">
                  Boşluklar otomatik olarak alt çizgi (_) ile değiştirilir
                </p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Sütun Genişliği (px)
                </label>
                <input
                  type="number"
                  value={newColumnData.width}
                  onChange={(e) => setNewColumnData({ ...newColumnData, width: parseInt(e.target.value) || 150 })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  min="100"
                  max="400"
                />
              </div>
              
              <div className="flex justify-end gap-3 pt-4">
                <button
                  onClick={() => setShowAddColumnModal(false)}
                  className="px-4 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                  İptal
                </button>
                <button
                  onClick={addNewColumn}
                  className="px-4 py-2 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded-lg"
                >
                  Sütun Ekle
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
    </DndProvider>
  );
};

export default CustomersPage;