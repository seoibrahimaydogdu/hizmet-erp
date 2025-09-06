import React, { useState, useEffect } from 'react';
import { 
  MessageSquare, 
  Plus, 
  Search, 
  Calendar, 
  AlertCircle, 
  Settings, 
  Eye, 
  X, 
  Download, 
  Bell,
  ArrowLeft,
  RefreshCw,
  FileText,
  BarChart3,
  Loader2,
  List,
  Grid3X3,
  GripVertical,
  Trash2,
  Save,
  RotateCcw
} from 'lucide-react';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';
import { toast } from 'react-hot-toast';
import { useSupabase } from '../hooks/useSupabase';
import { supabase } from '../lib/supabase';
import CreateTicket from './CreateTicket';
import TicketDetail from './TicketDetail';
import { DndProvider, useDrag, useDrop } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';

interface CustomerTicketsProps {
  customerData: any;
  tickets: any[];
  payments: any[];
  onBack: () => void;
  onRefresh: () => void;
  currentUser: any;
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

const CustomerTickets: React.FC<CustomerTicketsProps> = ({
  customerData,
  tickets,
  onBack,
  onRefresh,
  currentUser
}) => {
  const [currentView, setCurrentView] = useState<'list' | 'create' | 'detail'>('list');
  const [selectedTicket, setSelectedTicket] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [sortBy] = useState('created_at');
  const [sortOrder] = useState<'asc' | 'desc'>('desc');
  const [ticketMessageCounts, setTicketMessageCounts] = useState<{[key: string]: number}>({});
  const [isLoading, setIsLoading] = useState(false);
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
    { id: 'ticket_id', label: 'Talep No', visible: true, order: 0 },
    { id: 'title', label: 'Başlık', visible: true, order: 1 },
    { id: 'status', label: 'Durum', visible: true, order: 2 },
    { id: 'priority', label: 'Öncelik', visible: true, order: 3 },
    { id: 'category', label: 'Kategori', visible: true, order: 4 },
    { id: 'created_at', label: 'Oluşturulma Tarihi', visible: true, order: 5 },
    { id: 'messages', label: 'Mesajlar', visible: true, order: 6 },
    { id: 'actions', label: 'İşlemler', visible: true, order: 7 }
  ]);

  const { updateTicketStatus, deleteTicket } = useSupabase();

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
      { id: 'ticket_id', label: 'Talep No', visible: true, order: 0 },
      { id: 'title', label: 'Başlık', visible: true, order: 1 },
      { id: 'status', label: 'Durum', visible: true, order: 2 },
      { id: 'priority', label: 'Öncelik', visible: true, order: 3 },
      { id: 'category', label: 'Kategori', visible: true, order: 4 },
      { id: 'created_at', label: 'Oluşturulma Tarihi', visible: true, order: 5 },
      { id: 'messages', label: 'Mesajlar', visible: true, order: 6 },
      { id: 'actions', label: 'İşlemler', visible: true, order: 7 }
    ]);
    toast.success('Sütunlar varsayılan ayarlara sıfırlandı');
  };

  const saveColumnSettings = () => {
    localStorage.setItem('customer-tickets-columns', JSON.stringify(columns));
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
    const defaultColumns = ['ticket_id', 'title', 'status', 'actions'];
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

  // Kanban için talep durumunu güncelle
  const updateTicketStatusKanban = async (ticketId: string, newStatus: string) => {
    try {
      await updateTicketStatus(ticketId, newStatus);
      toast.success('Talep durumu güncellendi');
      onRefresh();
    } catch (error) {
      console.error('Durum güncelleme hatası:', error);
      toast.error('Durum güncellenirken hata oluştu');
    }
  };

  // Kanban bileşenleri
  const DraggableTicketCard: React.FC<{ ticket: any; statusId: string }> = ({ ticket, statusId }) => {
    const [{ isDragging }, drag] = useDrag({
      type: 'ticket',
      item: { type: 'ticket', id: ticket.id, statusId },
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
        onClick={() => handleViewTicket(ticket)}
      >
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center">
            <span className="text-sm font-medium text-gray-900 dark:text-white">
              #{ticket.id.slice(0, 8)}
            </span>
          </div>
          <div className="flex items-center gap-1">
            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getPriorityColor(ticket.priority)}`}>
              {getPriorityText(ticket.priority)}
            </span>
          </div>
        </div>
        
        <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-2 line-clamp-2">
          {ticket.title || 'Başlıksız Talep'}
        </h4>
        
        {ticket.description && (
          <p className="text-xs text-gray-600 dark:text-gray-400 line-clamp-2 mb-3">
            {ticket.description}
          </p>
        )}
        
        <div className="space-y-2">
          <div className="flex items-center text-xs text-gray-500 dark:text-gray-400">
            <Calendar className="w-3 h-3 mr-1" />
            {format(new Date(ticket.created_at), 'dd MMM yyyy', { locale: tr })}
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              {getCategoryIcon(ticket.category)}
              <span className="text-xs text-gray-600 dark:text-gray-400 ml-1">
                {getCategoryText(ticket.category)}
              </span>
            </div>
            <span className="text-xs text-blue-600 dark:text-blue-400">
              {ticketMessageCounts[ticket.id] || 0} mesaj
            </span>
          </div>
        </div>
      </div>
    );
  };

  const DroppableStatusColumn: React.FC<{ status: any }> = ({ status }) => {
    const [{ isOver }, drop] = useDrop({
      accept: 'ticket',
      drop: (item: any) => {
        if (item.statusId !== status.id) {
          updateTicketStatusKanban(item.id, status.id);
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
              ({status.tickets.length})
            </span>
          </div>
        </div>
        
        <div className="space-y-3 max-h-96 overflow-y-auto">
          {status.tickets.map((ticket: any) => (
            <DraggableTicketCard
              key={ticket.id}
              ticket={ticket}
              statusId={status.id}
            />
          ))}
          {status.tickets.length === 0 && (
            <div className="text-center py-8 text-gray-400 dark:text-gray-500">
              <MessageSquare className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">Bu durumda talep yok</p>
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

    const isDefaultColumn = ['ticket_id', 'title', 'status', 'actions'].includes(column.id);

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

  // Müşteriye ait talepleri filtrele (ödeme hatırlatmaları hariç)
  const customerTickets = tickets.filter(t => 
    t.customer_id === customerData?.id && t.category !== 'payment_reminder'
  );


  // Filtreleme ve arama
  const filteredTickets = customerTickets.filter(ticket => {
    const matchesSearch = ticket.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         ticket.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         ticket.id.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || ticket.status === statusFilter;
    const matchesPriority = priorityFilter === 'all' || ticket.priority === priorityFilter;
    const matchesCategory = categoryFilter === 'all' || ticket.category === categoryFilter;
    
    return matchesSearch && matchesStatus && matchesPriority && matchesCategory;
  });

  // Sıralama
  const sortedTickets = [...filteredTickets].sort((a, b) => {
    const aValue = a[sortBy];
    const bValue = b[sortBy];
    
    if (sortBy === 'created_at' || sortBy === 'updated_at') {
      return sortOrder === 'asc' 
        ? new Date(aValue).getTime() - new Date(bValue).getTime()
        : new Date(bValue).getTime() - new Date(aValue).getTime();
    }
    
    if (typeof aValue === 'string' && typeof bValue === 'string') {
      return sortOrder === 'asc' 
        ? aValue.localeCompare(bValue)
        : bValue.localeCompare(aValue);
    }
    
    return sortOrder === 'asc' ? aValue - bValue : bValue - aValue;
  });

  // Kanban için durum türlerini tanımla
  const statusTypes = [
    { id: 'open', label: 'Açık', color: 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400' },
    { id: 'in_progress', label: 'İşlemde', color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400' },
    { id: 'resolved', label: 'Çözüldü', color: 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400' },
    { id: 'closed', label: 'Kapalı', color: 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400' },
    { id: 'draft', label: 'Taslak', color: 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400' }
  ];

  // Kanban için talepleri durum türlerine göre grupla
  const ticketsByStatus = statusTypes.map(status => ({
    ...status,
    tickets: filteredTickets.filter(ticket => ticket.status === status.id)
  }));

  // Kategori metni döndürme fonksiyonu
  const getCategoryText = (category: string) => {
    const categories: {[key: string]: string} = {
      'general': 'Genel',
      'technical': 'Teknik',
      'billing': 'Faturalama',
      'feature_request': 'Özellik Talebi',
      'bug_report': 'Hata Bildirimi',
      'payment_reminder': 'Ödeme',
      'support': 'Destek'
    };
    return categories[category] || category;
  };

  // Durum metni döndürme fonksiyonu
  const getStatusText = (status: string) => {
    const statuses: {[key: string]: string} = {
      'open': 'Açık',
      'in_progress': 'İşlemde',
      'resolved': 'Çözüldü',
      'closed': 'Kapalı',
      'draft': 'Taslak'
    };
    return statuses[status] || status;
  };

  // Öncelik metni döndürme fonksiyonu
  const getPriorityText = (priority: string) => {
    const priorities: {[key: string]: string} = {
      'low': 'Düşük',
      'medium': 'Orta',
      'high': 'Yüksek',
      'urgent': 'Acil'
    };
    return priorities[priority] || priority;
  };

  // Durum rengi döndürme fonksiyonu
  const getStatusColor = (status: string) => {
    const colors: {[key: string]: string} = {
      'open': 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
      'in_progress': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
      'resolved': 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
      'closed': 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300',
      'draft': 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300'
    };
    return colors[status] || 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300';
  };

  // Öncelik rengi döndürme fonksiyonu
  const getPriorityColor = (priority: string) => {
    const colors: {[key: string]: string} = {
      'low': 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
      'medium': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
      'high': 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300',
      'urgent': 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300'
    };
    return colors[priority] || 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300';
  };

  // Kategori ikonu döndürme fonksiyonu
  const getCategoryIcon = (category: string) => {
    const icons: {[key: string]: React.ReactNode} = {
      'general': <MessageSquare className="w-3 h-3" />,
      'technical': <Settings className="w-3 h-3" />,
      'billing': <Download className="w-3 h-3" />,
      'feature_request': <Plus className="w-3 h-3" />,
      'bug_report': <AlertCircle className="w-3 h-3" />,
      'payment_reminder': <Bell className="w-3 h-3" />,
      'support': <MessageSquare className="w-3 h-3" />
    };
    return icons[category] || <MessageSquare className="w-3 h-3" />;
  };

  // Talep detayını görüntüleme
  const handleViewTicket = (ticket: any) => {
    setSelectedTicket(ticket);
    setCurrentView('detail');
  };

  // Taslak düzenleme
  const handleEditDraft = (ticket: any) => {
    setSelectedTicket(ticket);
    setCurrentView('create');
  };

  // Taslak silme
  const handleDeleteDraft = async (ticket: any) => {
    if (confirm('Bu taslağı silmek istediğinizden emin misiniz?')) {
      try {
        await deleteTicket(ticket.id);
        toast.success('Taslak başarıyla silindi');
        onRefresh();
      } catch (error) {
        console.error('Taslak silme hatası:', error);
        toast.error('Taslak silinirken hata oluştu');
      }
    }
  };


  // Mesaj sayılarını hesapla
  useEffect(() => {
    const fetchMessageCounts = async () => {
      try {
        const counts: {[key: string]: number} = {};
        
        if (customerTickets.length === 0) {
          setTicketMessageCounts(counts);
          return;
        }

        // Tek seferde tüm taleplerin mesaj sayısını al
        const ticketIds = customerTickets.map(t => t.id);
        
        const { data, error } = await supabase
          .from('ticket_messages')
          .select('ticket_id')
          .in('ticket_id', ticketIds)
          .eq('is_internal', false);

        if (error) {
          console.error('Mesaj sayıları alınırken hata:', error);
          // Hata durumunda boş sayılar set et
          const emptyCounts: {[key: string]: number} = {};
          customerTickets.forEach(ticket => {
            emptyCounts[ticket.id] = 0;
          });
          setTicketMessageCounts(emptyCounts);
          return;
        }

        // Mesaj sayılarını hesapla
        data?.forEach((msg: any) => {
          counts[msg.ticket_id] = (counts[msg.ticket_id] || 0) + 1;
        });

        // Mesajı olmayan talepler için 0 set et
        customerTickets.forEach(ticket => {
          if (!counts[ticket.id]) {
            counts[ticket.id] = 0;
          }
        });
        
        setTicketMessageCounts(counts);
      } catch (error) {
        console.error('Mesaj sayıları alınırken hata:', error);
        // Hata durumunda boş sayılar set et
        const emptyCounts: {[key: string]: number} = {};
        customerTickets.forEach(ticket => {
          emptyCounts[ticket.id] = 0;
        });
        setTicketMessageCounts(emptyCounts);
      }
    };

    fetchMessageCounts();
  }, [customerTickets]);

  // Gerçek zamanlı mesaj güncellemeleri için subscription
  useEffect(() => {
    if (customerTickets.length === 0) return;

    const messageSubscription = supabase
      .channel('customer_ticket_messages')
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'ticket_messages',
          filter: `ticket_id=in.(${customerTickets.map(t => t.id).join(',')})`
        }, 
        (payload: any) => {
          console.log('Mesaj değişikliği algılandı:', payload);
          
          // Mesaj sayılarını güncelle
          if (payload.eventType === 'INSERT' || payload.eventType === 'DELETE') {
            const ticketId = payload.new?.ticket_id || payload.old?.ticket_id;
            if (ticketId && customerTickets.some(t => t.id === ticketId)) {
              // Sadece ilgili talebin mesaj sayısını güncelle
              setTicketMessageCounts(prev => {
                const currentCount = prev[ticketId] || 0;
                const newCount = payload.eventType === 'INSERT' ? currentCount + 1 : Math.max(0, currentCount - 1);
                return {
                  ...prev,
                  [ticketId]: newCount
                };
              });
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(messageSubscription);
    };
  }, [customerTickets]);

  // Hızlı işlemler fonksiyonları
  const handleRefreshTickets = async () => {
    setIsLoading(true);
    try {
      // Talepleri yeniden yükle
      await onRefresh();
      
      // Açık talepleri kontrol et ve güncelleme isteği gönder
      const openTickets = sortedTickets.filter(t => t.status === 'open');
      if (openTickets.length > 0) {
        // Her açık talep için güncelleme isteği gönder
        for (const ticket of openTickets) {
          await supabase
            .from('ticket_messages')
            .insert({
              ticket_id: ticket.id,
              sender_id: customerData?.id,
              sender_type: 'customer',
              content: 'Durum güncellemesi istendi.',
              created_at: new Date().toISOString()
            });
        }
        
        toast.success(`${openTickets.length} açık talep için güncelleme isteği gönderildi`);
      } else {
        toast.success('Talepler yenilendi');
      }
    } catch (error) {
      console.error('Talepleri yenileme hatası:', error);
      toast.error('Talepleri yenilerken bir hata oluştu');
    } finally {
      setIsLoading(false);
    }
  };

  const handleExportHistory = async (exportFormat: 'json' | 'csv' | 'pdf') => {
    setIsLoading(true);
    try {
      const ticketHistory = {
        customer: {
          name: customerData?.name,
          email: customerData?.email,
          company: customerData?.company
        },
        tickets: sortedTickets.map(ticket => ({
          id: ticket.id,
          title: ticket.title,
          description: ticket.description,
          status: getStatusText(ticket.status),
          priority: getPriorityText(ticket.priority),
          category: getCategoryText(ticket.category),
          created_at: format(new Date(ticket.created_at), 'dd MMM yyyy HH:mm', { locale: tr }),
          updated_at: ticket.updated_at ? format(new Date(ticket.updated_at), 'dd MMM yyyy HH:mm', { locale: tr }) : null,
          resolved_at: ticket.resolved_at ? format(new Date(ticket.resolved_at), 'dd MMM yyyy HH:mm', { locale: tr }) : null
        })),
        statistics: {
          total: sortedTickets.length,
          open: sortedTickets.filter(t => t.status === 'open').length,
          inProgress: sortedTickets.filter(t => t.status === 'in_progress').length,
          resolved: sortedTickets.filter(t => t.status === 'resolved').length,
          closed: sortedTickets.filter(t => t.status === 'closed').length,
          highPriority: sortedTickets.filter(t => t.priority === 'high').length,
          mediumPriority: sortedTickets.filter(t => t.priority === 'medium').length,
          lowPriority: sortedTickets.filter(t => t.priority === 'low').length
        },
        exportDate: new Date().toISOString(),
        exportFormat: exportFormat
      };

      let blob: Blob;
      let filename: string;

      if (exportFormat === 'json') {
        blob = new Blob([JSON.stringify(ticketHistory, null, 2)], { type: 'application/json' });
        filename = `talep-gecmisi-${customerData?.name || 'user'}-${new Date().toISOString().split('T')[0]}.json`;
      } else if (exportFormat === 'csv') {
        const csvContent = [
          ['ID', 'Başlık', 'Durum', 'Öncelik', 'Kategori', 'Oluşturulma Tarihi', 'Güncellenme Tarihi', 'Çözülme Tarihi'],
          ...ticketHistory.tickets.map(ticket => [
            ticket.id,
            ticket.title || 'Başlıksız',
            ticket.status,
            ticket.priority,
            ticket.category,
            ticket.created_at,
            ticket.updated_at || '',
            ticket.resolved_at || ''
          ])
        ].map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');
        
        blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        filename = `talep-gecmisi-${customerData?.name || 'user'}-${new Date().toISOString().split('T')[0]}.csv`;
      } else {
        // PDF için HTML içeriği oluştur
        const htmlContent = `
          <html>
            <head>
              <title>Talep Geçmişi - ${customerData?.name}</title>
              <style>
                body { font-family: Arial, sans-serif; margin: 20px; }
                table { width: 100%; border-collapse: collapse; margin-top: 20px; }
                th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
                th { background-color: #f2f2f2; }
                .header { background-color: #f8f9fa; padding: 20px; border-radius: 5px; }
                .stats { display: flex; justify-content: space-between; margin: 20px 0; }
                .stat-item { text-align: center; }
              </style>
            </head>
            <body>
              <div class="header">
                <h1>Talep Geçmişi</h1>
                <p><strong>Müşteri:</strong> ${customerData?.name}</p>
                <p><strong>E-posta:</strong> ${customerData?.email}</p>
                <p><strong>Şirket:</strong> ${customerData?.company || 'Belirtilmemiş'}</p>
                <p><strong>Rapor Tarihi:</strong> ${format(new Date(), 'dd MMM yyyy HH:mm', { locale: tr })}</p>
              </div>
              
              <div class="stats">
                <div class="stat-item">
                  <h3>${ticketHistory.statistics.total}</h3>
                  <p>Toplam Talep</p>
                </div>
                <div class="stat-item">
                  <h3>${ticketHistory.statistics.open}</h3>
                  <p>Açık</p>
                </div>
                <div class="stat-item">
                  <h3>${ticketHistory.statistics.resolved}</h3>
                  <p>Çözülen</p>
                </div>
                <div class="stat-item">
                  <h3>${ticketHistory.statistics.highPriority}</h3>
                  <p>Yüksek Öncelik</p>
                </div>
              </div>
              
              <h2>Talep Listesi</h2>
              <table>
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Başlık</th>
                    <th>Durum</th>
                    <th>Öncelik</th>
                    <th>Kategori</th>
                    <th>Oluşturulma Tarihi</th>
                  </tr>
                </thead>
                <tbody>
                  ${ticketHistory.tickets.map(ticket => `
                    <tr>
                      <td>${ticket.id.slice(0, 8)}</td>
                      <td>${ticket.title || 'Başlıksız'}</td>
                      <td>${ticket.status}</td>
                      <td>${ticket.priority}</td>
                      <td>${ticket.category}</td>
                      <td>${ticket.created_at}</td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
            </body>
          </html>
        `;
        
        blob = new Blob([htmlContent], { type: 'text/html' });
        filename = `talep-gecmisi-${customerData?.name || 'user'}-${new Date().toISOString().split('T')[0]}.html`;
      }

      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      a.style.display = 'none';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      toast.success(`${exportFormat.toUpperCase()} formatında talep geçmişi başarıyla indirildi!`);
    } catch (error) {
      console.error('Export hatası:', error);
      toast.error('Dosya indirilirken bir hata oluştu');
    } finally {
      setIsLoading(false);
      setShowExportModal(false);
    }
  };

  const handleGenerateReport = async () => {
    setIsLoading(true);
    try {
      // Detaylı analiz raporu oluştur
      const reportData = {
        customer: customerData,
        period: {
          start: sortedTickets.length > 0 ? new Date(Math.min(...sortedTickets.map(t => new Date(t.created_at).getTime()))) : new Date(),
          end: new Date()
        },
        statistics: {
          total: sortedTickets.length,
          open: sortedTickets.filter(t => t.status === 'open').length,
          inProgress: sortedTickets.filter(t => t.status === 'in_progress').length,
          resolved: sortedTickets.filter(t => t.status === 'resolved').length,
          closed: sortedTickets.filter(t => t.status === 'closed').length,
          highPriority: sortedTickets.filter(t => t.priority === 'high').length,
          mediumPriority: sortedTickets.filter(t => t.priority === 'medium').length,
          lowPriority: sortedTickets.filter(t => t.priority === 'low').length
        },
        categoryAnalysis: sortedTickets.reduce((acc, ticket) => {
          const category = getCategoryText(ticket.category);
          if (!acc[category]) acc[category] = 0;
          acc[category]++;
          return acc;
        }, {} as Record<string, number>),
        monthlyTrend: sortedTickets.reduce((acc, ticket) => {
          const month = format(new Date(ticket.created_at), 'yyyy-MM');
          if (!acc[month]) acc[month] = 0;
          acc[month]++;
          return acc;
        }, {} as Record<string, number>),
        resolutionTime: sortedTickets
          .filter(t => t.resolved_at)
          .map(t => {
            const created = new Date(t.created_at);
            const resolved = new Date(t.resolved_at);
            return Math.round((resolved.getTime() - created.getTime()) / (1000 * 60 * 60 * 24)); // gün cinsinden
          })
      };

      // Rapor penceresini aç
      const reportWindow = window.open('', '_blank', 'width=800,height=600');
      if (reportWindow) {
        reportWindow.document.write(`
          <html>
            <head>
              <title>Detaylı Talep Analizi - ${customerData?.name}</title>
              <style>
                body { font-family: Arial, sans-serif; margin: 20px; line-height: 1.6; }
                .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; border-radius: 10px; margin-bottom: 20px; }
                .stats-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin: 20px 0; }
                .stat-card { background: #f8f9fa; padding: 20px; border-radius: 8px; text-align: center; border-left: 4px solid #007bff; }
                .stat-number { font-size: 2em; font-weight: bold; color: #007bff; }
                .section { margin: 30px 0; }
                table { width: 100%; border-collapse: collapse; margin-top: 10px; }
                th, td { border: 1px solid #ddd; padding: 12px; text-align: left; }
                th { background-color: #f2f2f2; font-weight: bold; }
                .chart-container { margin: 20px 0; padding: 20px; background: #f8f9fa; border-radius: 8px; }
                .priority-high { color: #dc3545; }
                .priority-medium { color: #ffc107; }
                .priority-low { color: #28a745; }
              </style>
            </head>
            <body>
              <div class="header">
                <h1>📊 Detaylı Talep Analizi</h1>
                <p><strong>Müşteri:</strong> ${customerData?.name} | <strong>E-posta:</strong> ${customerData?.email}</p>
                <p><strong>Rapor Tarihi:</strong> ${format(new Date(), 'dd MMM yyyy HH:mm', { locale: tr })}</p>
              </div>
              
              <div class="stats-grid">
                <div class="stat-card">
                  <div class="stat-number">${reportData.statistics.total}</div>
                  <p>Toplam Talep</p>
                </div>
                <div class="stat-card">
                  <div class="stat-number">${reportData.statistics.open}</div>
                  <p>Açık Talep</p>
                </div>
                <div class="stat-card">
                  <div class="stat-number">${reportData.statistics.resolved}</div>
                  <p>Çözülen Talep</p>
                </div>
                <div class="stat-card">
                  <div class="stat-number">${reportData.statistics.highPriority}</div>
                  <p>Yüksek Öncelik</p>
                </div>
              </div>
              
              <div class="section">
                <h2>📈 Kategori Analizi</h2>
                <table>
                  <thead>
                    <tr><th>Kategori</th><th>Talep Sayısı</th><th>Yüzde</th></tr>
                  </thead>
                  <tbody>
                                         ${Object.entries(reportData.categoryAnalysis).map(([category, count]) => `
                       <tr>
                         <td>${category}</td>
                         <td>${count}</td>
                         <td>${((count as number / reportData.statistics.total) * 100).toFixed(1)}%</td>
                       </tr>
                     `).join('')}
                  </tbody>
                </table>
              </div>
              
              <div class="section">
                <h2>📅 Aylık Trend</h2>
                <table>
                  <thead>
                    <tr><th>Ay</th><th>Talep Sayısı</th></tr>
                  </thead>
                  <tbody>
                    ${Object.entries(reportData.monthlyTrend).map(([month, count]) => `
                      <tr>
                        <td>${format(new Date(month + '-01'), 'MMMM yyyy', { locale: tr })}</td>
                        <td>${count}</td>
                      </tr>
                    `).join('')}
                  </tbody>
                </table>
              </div>
              
              <div class="section">
                <h2>⏱️ Çözüm Süresi Analizi</h2>
                ${reportData.resolutionTime.length > 0 ? `
                  <p><strong>Ortalama Çözüm Süresi:</strong> ${(reportData.resolutionTime.reduce((a, b) => a + b, 0) / reportData.resolutionTime.length).toFixed(1)} gün</p>
                  <p><strong>En Hızlı Çözüm:</strong> ${Math.min(...reportData.resolutionTime)} gün</p>
                  <p><strong>En Yavaş Çözüm:</strong> ${Math.max(...reportData.resolutionTime)} gün</p>
                ` : '<p>Çözülen talep bulunmuyor.</p>'}
              </div>
              
              <div class="section">
                <h2>📋 Talep Detayları</h2>
                <table>
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Başlık</th>
                      <th>Durum</th>
                      <th>Öncelik</th>
                      <th>Kategori</th>
                      <th>Oluşturulma Tarihi</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${sortedTickets.map(ticket => `
                      <tr>
                        <td>${ticket.id.slice(0, 8)}</td>
                        <td>${ticket.title || 'Başlıksız'}</td>
                        <td>${getStatusText(ticket.status)}</td>
                        <td class="priority-${ticket.priority}">${getPriorityText(ticket.priority)}</td>
                        <td>${getCategoryText(ticket.category)}</td>
                        <td>${format(new Date(ticket.created_at), 'dd MMM yyyy', { locale: tr })}</td>
                      </tr>
                    `).join('')}
                  </tbody>
                </table>
              </div>
            </body>
          </html>
        `);
        reportWindow.document.close();
      }
      
      toast.success('Detaylı analiz raporu oluşturuldu!');
    } catch (error) {
      console.error('Rapor oluşturma hatası:', error);
      toast.error('Rapor oluşturulurken bir hata oluştu');
    } finally {
      setIsLoading(false);
    }
  };

  if (currentView === 'create') {
    return (
      <CreateTicket
        isOpen={true}
        onClose={() => setCurrentView('list')}
        onSuccess={() => {
          setCurrentView('list');
          onRefresh();
          toast.success('Talep başarıyla oluşturuldu');
        }}
        customerData={customerData}
      />
    );
  }

  if (currentView === 'detail' && selectedTicket) {
    return (
      <TicketDetail
        ticketId={selectedTicket.id}
        isOpen={true}
        onClose={() => {
          setCurrentView('list');
          setSelectedTicket(null);
        }}
        onUpdate={() => {
          onRefresh();
        }}
        currentUser={currentUser}
      />
    );
  }

  // Hızlı İşlemler bölümünü güncelle
  return (
    <DndProvider backend={HTML5Backend}>
      <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button
            onClick={onBack}
            className="flex items-center space-x-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Geri</span>
          </button>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Taleplerim
          </h1>
          <span className="px-3 py-1 bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300 rounded-full text-sm font-medium">
            {customerTickets.length} talep
          </span>
        </div>
        
        <div className="flex items-center space-x-3">
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
          
          {viewMode === 'kanban' && (
            <button
              onClick={() => setShowColumnSettings(true)}
              className="inline-flex items-center px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
              title="Sütun Ayarları"
            >
              <Settings className="w-4 h-4 mr-2" />
              Sütunlar
            </button>
          )}
          
          <button
            onClick={onRefresh}
            className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            title="Yenile"
          >
            <RefreshCw className="w-5 h-5" />
          </button>
          <button
            onClick={() => setCurrentView('create')}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
          >
            <Plus className="w-5 h-5" />
            <span>Yeni Talep</span>
          </button>
        </div>
      </div>

      {/* Filtreler ve Arama */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
          {/* Arama */}
          <div className="lg:col-span-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Taleplerde ara..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Durum Filtresi */}
          <div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">Tüm Durumlar</option>
              <option value="open">Açık</option>
              <option value="in_progress">İşlemde</option>
              <option value="resolved">Çözüldü</option>
              <option value="closed">Kapalı</option>
              <option value="draft">Taslak</option>
            </select>
          </div>

          {/* Öncelik Filtresi */}
          <div>
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">Tüm Öncelikler</option>
              <option value="low">Düşük</option>
              <option value="medium">Orta</option>
              <option value="high">Yüksek</option>
              <option value="urgent">Acil</option>
            </select>
          </div>

          {/* Kategori Filtresi */}
          <div>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">Tüm Kategoriler</option>
              <option value="general">Genel</option>
              <option value="technical">Teknik</option>
              <option value="billing">Faturalama</option>
              <option value="feature_request">Özellik Talebi</option>
              <option value="bug_report">Hata Bildirimi</option>
              <option value="support">Destek</option>
            </select>
          </div>
        </div>
      </div>

      {/* Talep Görünümü */}
      {viewMode === 'list' ? (
        /* Liste Görünümü */
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
                <tr>
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
                {sortedTickets.length === 0 ? (
                  <tr>
                    <td colSpan={sortedColumns.length} className="px-6 py-12 text-center">
                      <MessageSquare className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                      <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                        Talep Bulunamadı
                      </h3>
                      <p className="text-gray-600 dark:text-gray-400 mb-6">
                        {searchTerm || statusFilter !== 'all' || priorityFilter !== 'all' || categoryFilter !== 'all'
                          ? 'Arama kriterlerinize uygun talep bulunamadı.'
                          : 'Henüz talep oluşturmadınız.'}
                      </p>
                      <button
                        onClick={() => setCurrentView('create')}
                        className="inline-flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
                      >
                        <Plus className="w-5 h-5" />
                        <span>İlk Talebinizi Oluşturun</span>
                      </button>
                    </td>
                  </tr>
                ) : (
                  sortedTickets.map((ticket) => (
                    <tr key={ticket.id} className="hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer" onClick={() => handleViewTicket(ticket)}>
                      {sortedColumns.map((column) => (
                        <td key={column.id} className="px-6 py-4">
                          {column.id === 'ticket_id' && (
                            <span className="text-sm font-medium text-gray-900 dark:text-white">
                              #{ticket.id.slice(0, 8)}
                            </span>
                          )}
                          {column.id === 'title' && (
                            <div>
                              <h3 className="text-sm font-medium text-gray-900 dark:text-white">
                                {ticket.title || 'Başlıksız Talep'}
                              </h3>
                              {ticket.description && (
                                <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-1 mt-1">
                                  {ticket.description}
                                </p>
                              )}
                            </div>
                          )}
                          {column.id === 'status' && (
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(ticket.status)}`}>
                              {getStatusText(ticket.status)}
                            </span>
                          )}
                          {column.id === 'priority' && (
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getPriorityColor(ticket.priority)}`}>
                              {getPriorityText(ticket.priority)}
                            </span>
                          )}
                          {column.id === 'category' && (
                            <div className="flex items-center gap-1">
                              {getCategoryIcon(ticket.category)}
                              <span className="text-xs text-gray-700 dark:text-gray-300">
                                {getCategoryText(ticket.category)}
                              </span>
                            </div>
                          )}
                          {column.id === 'created_at' && (
                            <span className="text-sm text-gray-500 dark:text-gray-400">
                              {format(new Date(ticket.created_at), 'dd MMM yyyy', { locale: tr })}
                            </span>
                          )}
                          {column.id === 'messages' && (
                            <span className={`text-sm font-medium ${
                              (ticketMessageCounts[ticket.id] || 0) > 0 
                                ? 'text-blue-600 dark:text-blue-400' 
                                : 'text-gray-500 dark:text-gray-400'
                            }`}>
                              {ticketMessageCounts[ticket.id] || 0} mesaj
                            </span>
                          )}
                          {column.id === 'actions' && (
                            <div className="flex items-center gap-2">
                              {ticket.status === 'draft' && (
                                <>
                                  <button 
                                    className="p-1 text-orange-400 hover:text-orange-600 dark:hover:text-orange-300"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleEditDraft(ticket);
                                    }}
                                    title="Taslağı düzenle"
                                  >
                                    <Settings className="w-4 h-4" />
                                  </button>
                                  <button 
                                    className="p-1 text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleDeleteDraft(ticket);
                                    }}
                                    title="Taslağı sil"
                                  >
                                    <X className="w-4 h-4" />
                                  </button>
                                </>
                              )}
                              <button 
                                className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleViewTicket(ticket);
                                }}
                                title="Görüntüle"
                              >
                                <Eye className="w-4 h-4" />
                              </button>
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
          {sortedTickets.length === 0 ? (
            <div className="text-center py-12">
              <MessageSquare className="w-16 h-16 mx-auto mb-4 text-gray-400" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                Talep Bulunamadı
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                {searchTerm || statusFilter !== 'all' || priorityFilter !== 'all' || categoryFilter !== 'all'
                  ? 'Arama kriterlerinize uygun talep bulunamadı.'
                  : 'Henüz talep oluşturmadınız.'}
              </p>
              <button
                onClick={() => setCurrentView('create')}
                className="inline-flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
              >
                <Plus className="w-5 h-5" />
                <span>İlk Talebinizi Oluşturun</span>
              </button>
            </div>
          ) : (
            <div className="flex gap-6 overflow-x-auto pb-4">
              {ticketsByStatus.map((status) => (
                <DroppableStatusColumn key={status.id} status={status} />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Hızlı İşlemler */}
      {sortedTickets.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Hızlı İşlemler
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <button
              onClick={() => setCurrentView('create')}
              className="flex items-center space-x-3 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/40 transition-colors"
            >
              <Plus className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              <div className="text-left">
                <p className="font-medium text-gray-900 dark:text-white">Yeni Talep</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">Hızlı talep oluştur</p>
              </div>
            </button>
            
            <button
              onClick={handleRefreshTickets}
              disabled={isLoading}
              className="flex items-center space-x-3 p-4 bg-green-50 dark:bg-green-900/20 rounded-lg hover:bg-green-100 dark:hover:bg-green-900/40 transition-colors disabled:opacity-50"
            >
              {isLoading ? (
                <Loader2 className="w-6 h-6 text-green-600 dark:text-green-400 animate-spin" />
              ) : (
                <MessageSquare className="w-6 h-6 text-green-600 dark:text-green-400" />
              )}
              <div className="text-left">
                <p className="font-medium text-gray-900 dark:text-white">Talepleri Yenile</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">Durumları güncelle</p>
              </div>
            </button>
            
            <button
              onClick={() => setShowExportModal(true)}
              disabled={isLoading}
              className="flex items-center space-x-3 p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg hover:bg-purple-100 dark:hover:bg-purple-900/40 transition-colors disabled:opacity-50"
            >
              <Download className="w-6 h-6 text-purple-600 dark:text-purple-400" />
              <div className="text-left">
                <p className="font-medium text-gray-900 dark:text-white">Geçmişi İndir</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">PDF, JSON, CSV formatında</p>
              </div>
            </button>

            <button
              onClick={handleGenerateReport}
              disabled={isLoading}
              className="flex items-center space-x-3 p-4 bg-orange-50 dark:bg-orange-900/20 rounded-lg hover:bg-orange-100 dark:hover:bg-orange-900/40 transition-colors disabled:opacity-50"
            >
              <BarChart3 className="w-6 h-6 text-orange-600 dark:text-orange-400" />
              <div className="text-left">
                <p className="font-medium text-gray-900 dark:text-white">Rapor Oluştur</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">Detaylı analiz</p>
              </div>
            </button>
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
                Talep geçmişinizi hangi formatta indirmek istiyorsunuz?
              </p>
              
              <div className="space-y-3">
                <button
                  onClick={() => handleExportHistory('json')}
                  disabled={isLoading}
                  className="w-full flex items-center space-x-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/40 transition-colors disabled:opacity-50"
                >
                  <FileText className="w-5 h-5 text-blue-600" />
                  <div className="text-left">
                    <p className="font-medium text-gray-900 dark:text-white">JSON Format</p>
                    <p className="text-xs text-gray-600 dark:text-gray-400">Tam veri yapısı</p>
                  </div>
                </button>
                
                <button
                  onClick={() => handleExportHistory('csv')}
                  disabled={isLoading}
                  className="w-full flex items-center space-x-3 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg hover:bg-green-100 dark:hover:bg-green-900/40 transition-colors disabled:opacity-50"
                >
                  <FileText className="w-5 h-5 text-green-600" />
                  <div className="text-left">
                    <p className="font-medium text-gray-900 dark:text-white">CSV Format</p>
                    <p className="text-xs text-gray-600 dark:text-gray-400">Excel uyumlu</p>
                  </div>
                </button>
                
                <button
                  onClick={() => {
                    // PDF formatında indir
                    
                    // PDF oluştur
                    const pdfContent = `
                      <html>
                        <head>
                          <title>Talep Geçmişi - ${customerData?.name}</title>
                          <style>
                            body { font-family: Arial, sans-serif; margin: 20px; }
                            .header { text-align: center; margin-bottom: 30px; }
                            .customer-info { margin-bottom: 20px; }
                            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
                            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
                            th { background-color: #f2f2f2; }
                            .status-open { color: blue; }
                            .status-in-progress { color: orange; }
                            .status-resolved { color: green; }
                            .status-closed { color: gray; }
                            .priority-high { background-color: #ffebee; }
                            .priority-medium { background-color: #fff3e0; }
                            .priority-low { background-color: #e8f5e8; }
                            .footer { margin-top: 30px; text-align: center; font-size: 12px; color: #666; }
                          </style>
                        </head>
                        <body>
                          <div class="header">
                            <h1>Talep Geçmişi</h1>
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
                                <th>Talep No</th>
                                <th>Tarih</th>
                                <th>Konu</th>
                                <th>Öncelik</th>
                                <th>Durum</th>
                                <th>Kategori</th>
                              </tr>
                            </thead>
                            <tbody>
                              ${filteredTickets.map(ticket => `
                                <tr class="priority-${ticket.priority}">
                                  <td>${ticket.ticket_number || ticket.id.slice(0, 8)}</td>
                                  <td>${format(new Date(ticket.created_at), 'dd.MM.yyyy', { locale: tr })}</td>
                                  <td>${ticket.subject || 'Konu belirtilmemiş'}</td>
                                  <td>${ticket.priority === 'high' ? 'Yüksek' : ticket.priority === 'medium' ? 'Orta' : 'Düşük'}</td>
                                  <td class="status-${ticket.status}">${ticket.status === 'open' ? 'Açık' : ticket.status === 'in-progress' ? 'İşlemde' : ticket.status === 'resolved' ? 'Çözüldü' : 'Kapalı'}</td>
                                  <td>${ticket.category || 'Genel'}</td>
                                </tr>
                              `).join('')}
                            </tbody>
                          </table>
                          
                          <div class="footer">
                            <p>Bu rapor ${new Date().toLocaleDateString('tr-TR')} tarihinde oluşturulmuştur.</p>
                            <p>Toplam ${filteredTickets.length} talep kaydı bulunmaktadır.</p>
                          </div>
                        </body>
                      </html>
                    `;
                    
                    const blob = new Blob([pdfContent], { type: 'text/html' });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `talep-gecmisi-${customerData?.name || 'user'}-${new Date().toISOString().split('T')[0]}.html`;
                    document.body.appendChild(a);
                    a.click();
                    document.body.removeChild(a);
                    URL.revokeObjectURL(url);
                    
                    setShowExportModal(false);
                    toast.success('Talep geçmişi PDF formatında indirildi!');
                  }}
                  disabled={isLoading}
                  className="w-full flex items-center space-x-3 p-3 bg-red-50 dark:bg-red-900/20 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/40 transition-colors disabled:opacity-50"
                >
                  <FileText className="w-5 h-5 text-red-600" />
                  <div className="text-left">
                    <p className="font-medium text-gray-900 dark:text-white">PDF Format</p>
                    <p className="text-xs text-gray-600 dark:text-gray-400">Yazdırılabilir rapor</p>
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
                  placeholder="Örn: Atanan Kişi, Son Güncelleme..."
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
                  placeholder="Örn: assigned_to, last_update..."
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
      </div>
    </DndProvider>
  );
};

export default CustomerTickets;
