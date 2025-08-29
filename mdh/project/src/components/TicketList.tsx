import React, { useState, useEffect } from 'react';
import { 
  Search, 
  MessageSquare, 
  User, 
  Clock, 
  CheckCircle, 
  XCircle, 
  AlertCircle,
  Edit,
  Trash2,
  Eye,
  Download,
  SortAsc,
  SortDesc,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Plus,
  X,
  Filter,
  ChevronDown,
  ChevronUp,
  Calendar,
  ArrowLeft,
  ArrowRight,
  Users,
  Building,
  Mail,
  Phone
} from 'lucide-react';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';
import { useSupabase } from '../hooks/useSupabase';
import { supabase } from '../lib/supabase';
import { toast } from 'react-hot-toast';


interface TicketFilters {
  status: string;
  priority: string;
  category: string;
  assignedAgent: string;
  dateRange: string;
  searchTerm: string;
}

interface TicketStats {
  total: number;
  open: number;
  inProgress: number;
  resolved: number;
  closed: number;
  highPriority: number;
  overdue: number;
  avgResolutionTime: number;
  newToday: number;
}

interface TicketListProps {
  onViewTicket: (ticketId: string) => void;
  onEditTicket: (ticketId: string) => void;
  onDeleteTicket: (ticketId: string) => void;
  onViewCustomer?: (customerId: string) => void;
  onNavigateToPage?: (page: string, customerId?: string) => void;
  activeTab?: string;
  filteredTickets?: any[];
}

const TicketList: React.FC<TicketListProps> = ({
  onViewTicket,
  onEditTicket,
  onDeleteTicket,

  onViewCustomer,
  onNavigateToPage,
  activeTab = 'all',
  filteredTickets: propFilteredTickets
}) => {
  const {
    tickets,
    agents,
    customers,
    loading,
    fetchTickets,
    fetchCustomers,
    searchTerm,
    setSearchTerm,
    exportData
  } = useSupabase();

  // Local state'ler
  const [showFilters, setShowFilters] = useState(false);
  const [sortBy, setSortBy] = useState('created_at');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [selectedTickets, setSelectedTickets] = useState<string[]>([]);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteType, setDeleteType] = useState<'single' | 'bulk' | 'customer'>('single');
  const [ticketToDelete, setTicketToDelete] = useState<string | null>(null);
  const [customerToDelete, setCustomerToDelete] = useState<string | null>(null);
  const [ticketMessageCounts, setTicketMessageCounts] = useState<{[key: string]: number}>({});
  const [bulkTagInput, setBulkTagInput] = useState('');
  const [bulkMessageInput, setBulkMessageInput] = useState('');
  const [showBulkMessageModal, setShowBulkMessageModal] = useState(false);

  // Filter state'leri
  const [filters, setFilters] = useState<TicketFilters>({
    status: 'all',
    priority: 'all',
    category: 'all',
    assignedAgent: 'all',
    dateRange: 'all',
    searchTerm: ''
  });

  // Müşteri görüntüleme fonksiyonu
  const handleViewCustomer = (customerId: string) => {
    console.log('Müşteri ID:', customerId); // Debug için
    console.log('onNavigateToPage prop:', onNavigateToPage); // Debug için
    console.log('onViewCustomer prop:', onViewCustomer); // Debug için
    
    if (onNavigateToPage) {
      console.log('onNavigateToPage çağrılıyor...'); // Debug için
      // Eğer onNavigateToPage prop'u varsa, müşteri sayfasına yönlendir
      onNavigateToPage('customers', customerId);
    } else if (onViewCustomer) {
      console.log('onViewCustomer çağrılıyor...'); // Debug için
      // Eğer onViewCustomer prop'u varsa, onu kullan
      onViewCustomer(customerId);
    } else {
      console.log('Varsayılan yönlendirme kullanılıyor...'); // Debug için
      // Varsayılan olarak URL ile yönlendir
      window.location.href = `/customers?customerId=${customerId}`;
    }
    
    toast.success('Müşteri sayfasına yönlendiriliyor...');
  };

  // Toplu seçim işlemleri
  const handleSelectTicket = (ticketId: string) => {
    setSelectedTickets(prev => 
      prev.includes(ticketId) 
        ? prev.filter(id => id !== ticketId)
        : [...prev, ticketId]
    );
  };

  const handleSelectAllTickets = () => {
    if (selectedTickets.length === filteredTickets.length) {
      setSelectedTickets([]);
    } else {
      setSelectedTickets(filteredTickets.map(ticket => ticket.id));
    }
  };

  // Silme işlemleri
  const handleDeleteSingleTicket = (ticketId: string) => {
    setTicketToDelete(ticketId);
    setDeleteType('single');
    setShowDeleteConfirm(true);
  };

  const handleDeleteBulkTickets = () => {
    if (selectedTickets.length === 0) {
      toast.error('Lütfen silinecek talepleri seçin');
      return;
    }
    setDeleteType('bulk');
    setShowDeleteConfirm(true);
  };

  const handleDeleteCustomerTickets = (customerId: string) => {
    setCustomerToDelete(customerId);
    setDeleteType('customer');
    setShowDeleteConfirm(true);
  };

  const confirmDelete = async () => {
    try {
      if (deleteType === 'single' && ticketToDelete) {
        await onDeleteTicket(ticketToDelete);
        toast.success('Talep başarıyla silindi');
      } else if (deleteType === 'bulk') {
        // Toplu silme işlemi
        const { error } = await supabase
          .from('tickets')
          .delete()
          .in('id', selectedTickets);

        if (error) {
          toast.error('Toplu silme işlemi başarısız');
          return;
        }

        toast.success(`${selectedTickets.length} talep başarıyla silindi`);
        setSelectedTickets([]);
        fetchTickets();
        // Müşteri verilerini de yeniden yükle
        fetchCustomers();
      } else if (deleteType === 'customer' && customerToDelete) {
        // Müşteri bazlı silme işlemi
        const { error } = await supabase
          .from('tickets')
          .delete()
          .eq('customer_id', customerToDelete);

        if (error) {
          toast.error('Müşteri talepleri silinirken hata oluştu');
          return;
        }

        toast.success('Müşteri talepleri başarıyla silindi');
        fetchTickets();
        // Müşteri verilerini de yeniden yükle
        fetchCustomers();
      }

      setShowDeleteConfirm(false);
      setTicketToDelete(null);
      setCustomerToDelete(null);
    } catch (error) {
      console.error('Silme işlemi hatası:', error);
      toast.error('Silme işlemi başarısız');
    }
  };

  // Verileri yükle
  useEffect(() => {
    fetchTickets();
    
    // Gerçek zamanlı güncellemeler için subscription
    const ticketsSubscription = supabase
      .channel('tickets_changes')
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'tickets' 
        }, 
        (payload: any) => {
          console.log('Ticket change detected:', payload);
          
          // Yeni talep oluşturulduğunda bildirim göster
          if (payload.eventType === 'INSERT') {
            toast.success('Yeni bir talep oluşturuldu!', {
              duration: 4000,
              icon: '🎫',
            });
          }
          
          // Talepleri yeniden yükle
          fetchTickets();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(ticketsSubscription);
    };
  }, []);

  // İstatistikleri hesapla
  const calculateStats = (): TicketStats => {
    const total = tickets.length;
    const open = tickets.filter(t => t.status === 'open').length;
    const inProgress = tickets.filter(t => t.status === 'in_progress').length;
    const resolved = tickets.filter(t => t.status === 'resolved').length;
    const closed = tickets.filter(t => t.status === 'closed').length;
    const highPriority = tickets.filter(t => t.priority === 'high').length;
    
    // Bugün oluşturulan yeni talepler
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const newToday = tickets.filter(t => {
      const createdDate = new Date(t.created_at);
      createdDate.setHours(0, 0, 0, 0);
      return createdDate.getTime() === today.getTime();
    }).length;
    
    // SLA ihlali hesaplama
    const overdue = tickets.filter(t => {
      if (t.status === 'resolved' || t.status === 'closed') return false;
      const createdAt = new Date(t.created_at).getTime();
      const slaHours = t.priority === 'high' ? 4 : t.priority === 'medium' ? 24 : 72;
      const dueTime = createdAt + (slaHours * 60 * 60 * 1000);
      return Date.now() > dueTime;
    }).length;

    // Ortalama çözüm süresi
    const resolvedTickets = tickets.filter(t => t.resolved_at);
    const avgResolutionTime = resolvedTickets.length > 0 
      ? resolvedTickets.reduce((sum, t) => {
          const created = new Date(t.created_at).getTime();
          const resolved = new Date(t.resolved_at!).getTime();
          return sum + (resolved - created);
        }, 0) / resolvedTickets.length / (1000 * 60 * 60) // Saat cinsinden
      : 0;

    return {
      total,
      open,
      inProgress,
      resolved,
      closed,
      highPriority,
      overdue,
      avgResolutionTime: Math.round(avgResolutionTime),
      newToday
    };
  };

  const stats = calculateStats();

  // Müşteri filtresi kontrolü
  const customerFilter = localStorage.getItem('customerFilter');
  
  // Müşteri filtresi temizleme fonksiyonu
  const clearCustomerFilter = () => {
    localStorage.removeItem('customerFilter');
    toast.success('Müşteri filtresi temizlendi');
    // Sayfayı yenile
    window.location.reload();
  };
  
  // Müşteri filtresi uygulandığında bildirim göster
  useEffect(() => {
    if (customerFilter) {
      const customer = customers.find(c => c.id === customerFilter);
      if (customer) {
        toast.success(`${customer.name} için talepler filtrelendi`, {
          duration: 3000,
          icon: '👤',
        });
      }
    }
  }, [customerFilter, customers]);
  
  // Filtrelenmiş talepler - Eğer prop'tan geliyorsa onu kullan, yoksa kendi filtreleme mantığını kullan
  const filteredTickets = propFilteredTickets || tickets.filter(ticket => {
    // Müşteri filtresi
    if (customerFilter && ticket.customer_id !== customerFilter) return false;
    
    // ActiveTab filtresi
    if (activeTab !== 'all' && ticket.status !== activeTab) return false;
    
    // Status filtresi
    if (filters.status !== 'all' && ticket.status !== filters.status) return false;
    
    // Priority filtresi
    if (filters.priority !== 'all' && ticket.priority !== filters.priority) return false;
    
    // Category filtresi
    if (filters.category !== 'all' && ticket.category !== filters.category) return false;
    
    // Agent filtresi
    if (filters.assignedAgent !== 'all' && ticket.agent_id !== filters.assignedAgent) return false;
    
    // Arama filtresi - Geliştirilmiş arama (etiketler dahil)
    const searchTermToUse = searchTerm || filters.searchTerm;
    if (searchTermToUse) {
      const searchLower = searchTermToUse.toLowerCase();
      const customer = customers.find(c => c.id === ticket.customer_id);
      const assignedAgent = agents.find(a => a.id === ticket.agent_id);
      
      // Talep ID'si arama
      const ticketIdMatch = ticket.id.toLowerCase().includes(searchLower);
      
      // Talep başlığı arama
      const titleMatch = ticket.title.toLowerCase().includes(searchLower);
      
      // Talep açıklaması arama
      const descriptionMatch = ticket.description?.toLowerCase().includes(searchLower) || false;
      
      // Müşteri adı arama
      const customerNameMatch = customer?.name.toLowerCase().includes(searchLower) || false;
      
      // Müşteri e-posta arama
      const customerEmailMatch = customer?.email.toLowerCase().includes(searchLower) || false;
      
      // Müşteri şirket arama
      const customerCompanyMatch = customer?.company?.toLowerCase().includes(searchLower) || false;
      
      // Temsilci adı arama
      const agentNameMatch = assignedAgent?.name.toLowerCase().includes(searchLower) || false;
      
      // Talep numarası arama (ID'nin ilk 8 karakteri)
      const ticketNumberMatch = ticket.id.slice(0, 8).toLowerCase().includes(searchLower);
      
      // Etiketlerde arama
      const tagsMatch = ticket.tags?.some(tag => 
        tag.toLowerCase().includes(searchLower)
      ) || false;
      
      // Kategori arama
      const categoryMatch = ticket.category.toLowerCase().includes(searchLower);
      
      // Öncelik arama
      const priorityMatch = ticket.priority.toLowerCase().includes(searchLower);
      
      // Durum arama
      const statusMatch = ticket.status.toLowerCase().includes(searchLower);
      
      // Tüm arama kriterlerini kontrol et
      const matchesSearch = 
        ticketIdMatch ||
        titleMatch ||
        descriptionMatch ||
        customerNameMatch ||
        customerEmailMatch ||
        customerCompanyMatch ||
        agentNameMatch ||
        ticketNumberMatch ||
        tagsMatch ||
        categoryMatch ||
        priorityMatch ||
        statusMatch;
      
      if (!matchesSearch) return false;
    }
    
    // Tarih filtresi
    if (filters.dateRange !== 'all') {
      const ticketDate = new Date(ticket.created_at);
      const now = new Date();
      const daysDiff = Math.floor((now.getTime() - ticketDate.getTime()) / (1000 * 60 * 60 * 24));
      
      switch (filters.dateRange) {
        case 'today':
          if (daysDiff > 0) return false;
          break;
        case 'week':
          if (daysDiff > 7) return false;
          break;
        case 'month':
          if (daysDiff > 30) return false;
          break;
      }
    }
    
    return true;
  });

  // Mesaj sayılarını hesapla
  useEffect(() => {
    const fetchMessageCounts = async () => {
      try {
        const counts: {[key: string]: number} = {};
        
        if (filteredTickets.length === 0) {
          setTicketMessageCounts(counts);
          return;
        }

        // Tek seferde tüm taleplerin mesaj sayısını al
        const ticketIds = filteredTickets.map(t => t.id);
        
        const { data, error } = await supabase
          .from('ticket_messages')
          .select('ticket_id')
          .in('ticket_id', ticketIds);

        if (error) {
          console.error('Mesaj sayıları alınırken hata:', error);
          // Hata durumunda boş sayılar set et
          const emptyCounts: {[key: string]: number} = {};
          filteredTickets.forEach(ticket => {
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
        filteredTickets.forEach(ticket => {
          if (!counts[ticket.id]) {
            counts[ticket.id] = 0;
          }
        });
        
        setTicketMessageCounts(counts);
      } catch (error) {
        console.error('Mesaj sayıları alınırken hata:', error);
        // Hata durumunda boş sayılar set et
        const emptyCounts: {[key: string]: number} = {};
        filteredTickets.forEach(ticket => {
          emptyCounts[ticket.id] = 0;
        });
        setTicketMessageCounts(emptyCounts);
      }
    };

    fetchMessageCounts();
  }, [filteredTickets]);

  // Gerçek zamanlı mesaj güncellemeleri için subscription
  useEffect(() => {
    if (filteredTickets.length === 0) return;

    const messageSubscription = supabase
      .channel('admin_ticket_messages')
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'ticket_messages',
          filter: `ticket_id=in.(${filteredTickets.map(t => t.id).join(',')})`
        }, 
        (payload: any) => {
          console.log('Admin mesaj değişikliği algılandı:', payload);
          
          // Mesaj sayılarını güncelle
          if (payload.eventType === 'INSERT' || payload.eventType === 'DELETE') {
            const ticketId = payload.new?.ticket_id || payload.old?.ticket_id;
            if (ticketId && filteredTickets.some(t => t.id === ticketId)) {
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
  }, [filteredTickets]);

  // Sıralama
  const sortedTickets = [...filteredTickets].sort((a, b) => {
    let aValue: any = a[sortBy as keyof typeof a];
    let bValue: any = b[sortBy as keyof typeof b];
    
    if (sortBy === 'created_at' || sortBy === 'updated_at' || sortBy === 'resolved_at') {
      aValue = new Date(aValue || 0).getTime();
      bValue = new Date(bValue || 0).getTime();
    }
    
    if (sortOrder === 'asc') {
      return aValue > bValue ? 1 : -1;
    } else {
      return aValue < bValue ? 1 : -1;
    }
  });

  // Pagination
  const totalPages = Math.ceil(sortedTickets.length / itemsPerPage);
  const paginatedTickets = sortedTickets.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Status icon ve renk fonksiyonları
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'open': return <AlertCircle className="w-4 h-4 text-red-500" />;
      case 'in_progress': return <Clock className="w-4 h-4 text-yellow-500" />;
      case 'resolved': return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'closed': return <XCircle className="w-4 h-4 text-gray-500" />;
      default: return <AlertCircle className="w-4 h-4 text-gray-400" />;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'open': return 'Açık';
      case 'in_progress': return 'İşlemde';
      case 'resolved': return 'Çözüldü';
      case 'closed': return 'Kapalı';
      default: return 'Bilinmeyen';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open': return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400';
      case 'in_progress': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400';
      case 'resolved': return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400';
      case 'closed': return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400';
      case 'medium': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400';
      case 'low': return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400';
    }
  };

  const getPriorityText = (priority: string) => {
    switch (priority) {
      case 'high': return 'Yüksek';
      case 'medium': return 'Orta';
      case 'low': return 'Düşük';
      default: return 'Normal';
    }
  };

  const getCategoryText = (category: string) => {
    switch (category) {
      case 'technical': return 'Teknik Destek';
      case 'billing': return 'Faturalama';
      case 'feature': return 'Özellik İsteği';
      case 'feature_request': return 'Özellik Önerisi';
      case 'bug': return 'Hata Bildirimi';
      case 'account': return 'Hesap Yönetimi';
      case 'payment': return 'Ödeme Sorunları';
      case 'payment_reminder': return 'Ödeme';
      case 'project': return 'Proje Soruları';
      default: return category;
    }
  };

  // SLA hesaplama
  const getSlaInfo = (ticket: any) => {
    const createdAt = new Date(ticket.created_at).getTime();
    const slaHours = ticket.priority === 'high' ? 4 : ticket.priority === 'medium' ? 24 : 72;
    const dueTime = createdAt + (slaHours * 60 * 60 * 1000);
    const now = Date.now();
    const remainingMs = dueTime - now;
    const breached = remainingMs < 0 && ticket.status !== 'resolved' && ticket.status !== 'closed';
    
    return { remainingMs, breached, slaHours };
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        <span className="ml-3 text-gray-500">Talepler yükleniyor...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Müşteri Filtresi Bildirimi */}
      {customerFilter && (
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <User className="w-5 h-5 text-blue-600" />
              <div>
                <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
                  Müşteri Filtresi Aktif
                </p>
                <p className="text-xs text-blue-700 dark:text-blue-300">
                  {customers.find(c => c.id === customerFilter)?.name || 'Bilinmeyen Müşteri'} için talepler gösteriliyor
                </p>
              </div>
            </div>
            <button
              onClick={clearCustomerFilter}
              className="flex items-center space-x-1 px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-lg transition-colors"
            >
              <X className="w-4 h-4" />
              <span>Filtreyi Temizle</span>
            </button>
          </div>
        </div>
      )}

      {/* İstatistikler */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Toplam Talep</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.total}</p>
            </div>
            <div className="p-3 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
              <MessageSquare className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Açık Talepler</p>
              <p className="text-2xl font-bold text-red-600 dark:text-red-400">{stats.open}</p>
            </div>
            <div className="p-3 bg-red-100 dark:bg-red-900/20 rounded-lg">
              <AlertCircle className="w-6 h-6 text-red-600 dark:text-red-400" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Yüksek Öncelik</p>
              <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">{stats.highPriority}</p>
            </div>
            <div className="p-3 bg-orange-100 dark:bg-orange-900/20 rounded-lg">
              <AlertCircle className="w-6 h-6 text-orange-600 dark:text-orange-400" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">SLA İhlali</p>
              <p className="text-2xl font-bold text-red-600 dark:text-red-400">{stats.overdue}</p>
            </div>
            <div className="p-3 bg-red-100 dark:bg-red-900/20 rounded-lg">
              <Clock className="w-6 h-6 text-red-600 dark:text-red-400" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Bugün Yeni</p>
              <p className="text-2xl font-bold text-green-600 dark:text-green-400">{stats.newToday}</p>
            </div>
            <div className="p-3 bg-green-100 dark:bg-green-900/20 rounded-lg">
              <Plus className="w-6 h-6 text-green-600 dark:text-green-400" />
            </div>
          </div>
        </div>
      </div>

      {/* Filtreler */}
      {showFilters && (
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Durum</label>
              <select
                value={filters.status}
                onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
              >
                <option value="all">Tümü</option>
                <option value="open">Açık</option>
                <option value="in_progress">İşlemde</option>
                <option value="resolved">Çözüldü</option>
                <option value="closed">Kapalı</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Öncelik</label>
              <select
                value={filters.priority}
                onChange={(e) => setFilters({ ...filters, priority: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
              >
                <option value="all">Tümü</option>
                <option value="high">Yüksek</option>
                <option value="medium">Orta</option>
                <option value="low">Düşük</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Kategori</label>
              <select
                value={filters.category}
                onChange={(e) => setFilters({ ...filters, category: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
              >
                <option value="all">Tümü</option>
                <option value="general">Genel</option>
                <option value="technical">Teknik</option>
                <option value="billing">Faturalama</option>
                <option value="feature">Özellik İsteği</option>
                <option value="feature_request">Özellik Önerisi</option>
                <option value="bug">Hata Bildirimi</option>
                <option value="account">Hesap Yönetimi</option>
                                           <option value="payment">Ödeme Sorunları</option>
                           <option value="payment_reminder">Ödeme</option>
                <option value="project">Proje Soruları</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Temsilci</label>
              <select
                value={filters.assignedAgent}
                onChange={(e) => setFilters({ ...filters, assignedAgent: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
              >
                <option value="all">Tümü</option>
                {agents.map((agent) => (
                  <option key={agent.id} value={agent.id}>
                    {agent.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Tarih Aralığı</label>
              <select
                value={filters.dateRange}
                onChange={(e) => setFilters({ ...filters, dateRange: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
              >
                <option value="all">Tümü</option>
                <option value="today">Bugün</option>
                <option value="week">Son 7 Gün</option>
                <option value="month">Son 30 Gün</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Arama</label>
              <input
                type="text"
                value={filters.searchTerm}
                onChange={(e) => {
                  setFilters({ ...filters, searchTerm: e.target.value });
                  // Filtreler arama terimi değiştiğinde üst arama çubuğunu da güncelle
                  setSearchTerm(e.target.value);
                }}
                placeholder="Talep no, müşteri adı, etiket, kategori, öncelik..."
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Talep numarası, müşteri adı, e-posta, şirket, temsilci, etiket, kategori, öncelik veya durum ile arama yapabilirsiniz
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Talep Listesi */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
        {/* Tablo başlığı ve arama */}
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          {/* Hızlı Toplu Seçim */}
          <div className="mb-4 flex flex-wrap gap-2">
            <button
              onClick={() => {
                const highPriorityTickets = filteredTickets
                  .filter(t => t.priority === 'high')
                  .map(t => t.id);
                setSelectedTickets(highPriorityTickets);
                if (highPriorityTickets.length > 0) {
                  toast.success(`${highPriorityTickets.length} yüksek öncelikli talep seçildi`);
                }
              }}
              className="inline-flex items-center px-3 py-1.5 bg-red-100 hover:bg-red-200 text-red-700 rounded-lg text-sm font-medium transition-colors"
            >
              <AlertCircle className="w-4 h-4 mr-1" />
              Yüksek Öncelikli
            </button>
            
            <button
              onClick={() => {
                const openTickets = filteredTickets
                  .filter(t => t.status === 'open')
                  .map(t => t.id);
                setSelectedTickets(openTickets);
                if (openTickets.length > 0) {
                  toast.success(`${openTickets.length} açık talep seçildi`);
                }
              }}
              className="inline-flex items-center px-3 py-1.5 bg-orange-100 hover:bg-orange-200 text-orange-700 rounded-lg text-sm font-medium transition-colors"
            >
              <AlertCircle className="w-4 h-4 mr-1" />
              Açık Talepler
            </button>
            
            <button
              onClick={() => {
                const overdueTickets = filteredTickets
                  .filter(t => {
                    const slaInfo = getSlaInfo(t);
                    return slaInfo.breached;
                  })
                  .map(t => t.id);
                setSelectedTickets(overdueTickets);
                if (overdueTickets.length > 0) {
                  toast.success(`${overdueTickets.length} SLA ihlali olan talep seçildi`);
                }
              }}
              className="inline-flex items-center px-3 py-1.5 bg-red-100 hover:bg-red-200 text-red-700 rounded-lg text-sm font-medium transition-colors"
            >
              <Clock className="w-4 h-4 mr-1" />
              SLA İhlali
            </button>
            
            <button
              onClick={() => {
                const unassignedTickets = filteredTickets
                  .filter(t => !t.agent_id)
                  .map(t => t.id);
                setSelectedTickets(unassignedTickets);
                if (unassignedTickets.length > 0) {
                  toast.success(`${unassignedTickets.length} atanmamış talep seçildi`);
                }
              }}
              className="inline-flex items-center px-3 py-1.5 bg-yellow-100 hover:bg-yellow-200 text-yellow-700 rounded-lg text-sm font-medium transition-colors"
            >
              <User className="w-4 h-4 mr-1" />
              Atanmamış
            </button>
            
            <button
              onClick={() => {
                const todayTickets = filteredTickets
                  .filter(t => {
                    const today = new Date();
                    const createdDate = new Date(t.created_at);
                    return today.toDateString() === createdDate.toDateString();
                  })
                  .map(t => t.id);
                setSelectedTickets(todayTickets);
                if (todayTickets.length > 0) {
                  toast.success(`${todayTickets.length} bugün oluşturulan talep seçildi`);
                }
              }}
              className="inline-flex items-center px-3 py-1.5 bg-green-100 hover:bg-green-200 text-green-700 rounded-lg text-sm font-medium transition-colors"
            >
              <Calendar className="w-4 h-4 mr-1" />
              Bugün Oluşturulan
            </button>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    // Üst arama çubuğu değiştiğinde filtreler arama terimini de güncelle
                    setFilters(prev => ({ ...prev, searchTerm: e.target.value }));
                  }}
                  placeholder="Talep no, müşteri adı, etiket, kategori, öncelik..."
                  className="pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                />
              </div>
              
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                >
                  {sortOrder === 'asc' ? <SortAsc className="w-4 h-4" /> : <SortDesc className="w-4 h-4" />}
                </button>
                
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                >
                  <option value="created_at">Oluşturulma Tarihi</option>
                  <option value="updated_at">Güncelleme Tarihi</option>
                  <option value="priority">Öncelik</option>
                  <option value="status">Durum</option>
                  <option value="title">Başlık</option>
                </select>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="inline-flex items-center px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                <Search className="w-4 h-4 mr-2" />
                Filtreler
              </button>
              
              <button
                onClick={() => exportData('tickets')}
                className="inline-flex items-center px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                <Download className="w-4 h-4 mr-2" />
                Dışa Aktar
              </button>
            </div>
          </div>
        </div>

        {/* Gelişmiş Toplu İşlemler */}
        {selectedTickets.length > 0 && (
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-4">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-4">
                <span className="text-sm font-medium text-blue-800 dark:text-blue-200">
                  {selectedTickets.length} talep seçildi
                </span>
                <button
                  onClick={() => setSelectedTickets([])}
                  className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-200"
                >
                  Seçimi Temizle
                </button>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={handleDeleteBulkTickets}
                  className="inline-flex items-center px-3 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-medium"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Seçilenleri Sil ({selectedTickets.length})
                </button>
              </div>
            </div>
            
            {/* Toplu İşlem Seçenekleri */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3">
              <div className="bg-white dark:bg-gray-800 rounded-lg p-3 border border-gray-200 dark:border-gray-700">
                <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-2">Durum Güncelle</h4>
                <select 
                  className="w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                  onChange={async (e) => {
                    const newStatus = e.target.value;
                    if (newStatus && newStatus !== 'select') {
                      try {
                        const { error } = await supabase
                          .from('tickets')
                          .update({ status: newStatus, updated_at: new Date().toISOString() })
                          .in('id', selectedTickets);
                        
                        if (error) {
                          toast.error('Durum güncellenirken hata oluştu');
                        } else {
                          toast.success(`${selectedTickets.length} talebin durumu güncellendi`);
                          fetchTickets();
                        }
                      } catch (error) {
                        toast.error('Durum güncellenirken hata oluştu');
                      }
                    }
                  }}
                >
                  <option value="select">Durum Seçin</option>
                  <option value="open">Açık</option>
                  <option value="in_progress">İşlemde</option>
                  <option value="resolved">Çözüldü</option>
                  <option value="closed">Kapalı</option>
                </select>
              </div>
              
              <div className="bg-white dark:bg-gray-800 rounded-lg p-3 border border-gray-200 dark:border-gray-700">
                <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-2">Öncelik Güncelle</h4>
                <select 
                  className="w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                  onChange={async (e) => {
                    const newPriority = e.target.value;
                    if (newPriority && newPriority !== 'select') {
                      try {
                        const { error } = await supabase
                          .from('tickets')
                          .update({ priority: newPriority, updated_at: new Date().toISOString() })
                          .in('id', selectedTickets);
                        
                        if (error) {
                          toast.error('Öncelik güncellenirken hata oluştu');
                        } else {
                          toast.success(`${selectedTickets.length} talebin önceliği güncellendi`);
                          fetchTickets();
                        }
                      } catch (error) {
                        toast.error('Öncelik güncellenirken hata oluştu');
                      }
                    }
                  }}
                >
                  <option value="select">Öncelik Seçin</option>
                  <option value="high">Yüksek</option>
                  <option value="medium">Orta</option>
                  <option value="low">Düşük</option>
                </select>
              </div>
              
              <div className="bg-white dark:bg-gray-800 rounded-lg p-3 border border-gray-200 dark:border-gray-700">
                <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-2">Temsilci Ata</h4>
                <select 
                  className="w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                  onChange={async (e) => {
                    const agentId = e.target.value;
                    if (agentId && agentId !== 'select') {
                      try {
                        const { error } = await supabase
                          .from('tickets')
                          .update({ agent_id: agentId, updated_at: new Date().toISOString() })
                          .in('id', selectedTickets);
                        
                        if (error) {
                          toast.error('Temsilci atanırken hata oluştu');
                        } else {
                          const agent = agents.find(a => a.id === agentId);
                          toast.success(`${selectedTickets.length} talep ${agent?.name || 'temsilci'} atandı`);
                          fetchTickets();
                        }
                      } catch (error) {
                        toast.error('Temsilci atanırken hata oluştu');
                      }
                    }
                  }}
                >
                  <option value="select">Temsilci Seçin</option>
                  {agents.map((agent) => (
                    <option key={agent.id} value={agent.id}>
                      {agent.name}
                    </option>
                  ))}
                </select>
              </div>
              
              <div className="bg-white dark:bg-gray-800 rounded-lg p-3 border border-gray-200 dark:border-gray-700">
                <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-2">Kategori Güncelle</h4>
                <select 
                  className="w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                  onChange={async (e) => {
                    const newCategory = e.target.value;
                    if (newCategory && newCategory !== 'select') {
                      try {
                        const { error } = await supabase
                          .from('tickets')
                          .update({ category: newCategory, updated_at: new Date().toISOString() })
                          .in('id', selectedTickets);
                        
                        if (error) {
                          toast.error('Kategori güncellenirken hata oluştu');
                        } else {
                          toast.success(`${selectedTickets.length} talebin kategorisi güncellendi`);
                          fetchTickets();
                        }
                      } catch (error) {
                        toast.error('Kategori güncellenirken hata oluştu');
                      }
                    }
                  }}
                >
                  <option value="select">Kategori Seçin</option>
                  <option value="general">Genel</option>
                  <option value="technical">Teknik</option>
                  <option value="billing">Faturalama</option>
                  <option value="feature">Özellik İsteği</option>
                  <option value="feature_request">Özellik Önerisi</option>
                  <option value="bug">Hata Bildirimi</option>
                  <option value="account">Hesap Yönetimi</option>
                  <option value="payment">Ödeme Sorunları</option>
                  <option value="payment_reminder">Ödeme</option>
                  <option value="project">Proje Soruları</option>
                </select>
              </div>
              
              <div className="bg-white dark:bg-gray-800 rounded-lg p-3 border border-gray-200 dark:border-gray-700">
                <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-2">Etiket Ekle</h4>
                <div className="flex space-x-2">
                  <input
                    type="text"
                    value={bulkTagInput}
                    onChange={(e) => setBulkTagInput(e.target.value)}
                    placeholder="Etiket adı"
                    className="flex-1 px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                  />
                  <button
                    onClick={async () => {
                      if (bulkTagInput.trim()) {
                        try {
                          const selectedTicketData = filteredTickets.filter(t => selectedTickets.includes(t.id));
                          const updatePromises = selectedTicketData.map(async (ticket) => {
                            const currentTags = ticket.tags || [];
                            const newTags = [...currentTags, bulkTagInput.trim()];
                            const { error } = await supabase
                              .from('tickets')
                              .update({ 
                                tags: newTags, 
                                updated_at: new Date().toISOString() 
                              })
                              .eq('id', ticket.id);
                            return error;
                          });
                          
                          const results = await Promise.all(updatePromises);
                          const hasError = results.some(error => error);
                          
                          if (hasError) {
                            toast.error('Etiket eklenirken hata oluştu');
                          } else {
                            toast.success(`${selectedTickets.length} isteğe etiket eklendi`);
                            setBulkTagInput('');
                            fetchTickets();
                          }
                        } catch (error) {
                          toast.error('Etiket eklenirken hata oluştu');
                        }
                      }
                    }}
                    className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded transition-colors"
                  >
                    Ekle
                  </button>
                </div>
              </div>
              
              <div className="bg-white dark:bg-gray-800 rounded-lg p-3 border border-gray-200 dark:border-gray-700">
                <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-2">Toplu Mesaj</h4>
                <button
                  onClick={() => setShowBulkMessageModal(true)}
                  className="w-full px-3 py-2 bg-green-600 hover:bg-green-700 text-white text-sm rounded transition-colors"
                >
                  Mesaj Gönder
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Tablo içeriği */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  <input
                    type="checkbox"
                    checked={selectedTickets.length === filteredTickets.length && filteredTickets.length > 0}
                    onChange={handleSelectAllTickets}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Talep
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Müşteri
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Durum
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Öncelik
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Temsilci
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Tarih
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  SLA
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Yanıt Sayısı
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  İşlemler
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {paginatedTickets.map((ticket) => {
                const slaInfo = getSlaInfo(ticket);
                const assignedAgent = agents.find(a => a.id === ticket.agent_id);
                const customer = customers.find(c => c.id === ticket.customer_id);
                
                return (
                  <tr key={ticket.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <input
                        type="checkbox"
                        checked={selectedTickets.includes(ticket.id)}
                        onChange={() => handleSelectTicket(ticket.id)}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900 dark:text-white">
                          {ticket.title}
                        </div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          #{ticket.id.slice(0, 8)}
                        </div>
                        {ticket.category && (
                          <div className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                            {getCategoryText(ticket.category)}
                          </div>
                        )}
                      </div>
                    </td>
                    
                    <td className="px-6 py-4 whitespace-nowrap">
                      {customer && (
                        <div className="flex items-center gap-3">
                          <div className="flex-shrink-0">
                            {customer.avatar_url ? (
                              <img src={customer.avatar_url} alt={customer.name} className="w-8 h-8 rounded-full" />
                            ) : (
                              <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white text-sm font-medium">
                                {customer.name.charAt(0)}
                              </div>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <button
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                console.log('Müşteri butonuna tıklandı:', customer.id); // Debug için
                                console.log('Customer object:', customer); // Debug için
                                handleViewCustomer(customer.id);
                              }}
                              className="text-sm font-medium text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 hover:underline transition-colors text-left w-full cursor-pointer"
                              title="Müşteri sayfasına git"
                            >
                              {customer.name}
                            </button>
                            <div className="text-sm text-gray-500 dark:text-gray-400 truncate">
                              {customer.email}
                            </div>
                            {customer.company && (
                              <div className="text-xs text-gray-400 dark:text-gray-500 truncate">
                                {customer.company}
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </td>
                    
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(ticket.status)}`}>
                        {getStatusIcon(ticket.status)}
                        <span className="ml-1">{getStatusText(ticket.status)}</span>
                      </span>
                    </td>
                    
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getPriorityColor(ticket.priority)}`}>
                        {getPriorityText(ticket.priority)}
                      </span>
                    </td>
                    
                    <td className="px-6 py-4 whitespace-nowrap">
                      {assignedAgent ? (
                        <div className="text-sm text-gray-900 dark:text-white">
                          {assignedAgent.name}
                        </div>
                      ) : (
                        <span className="text-sm text-gray-500 dark:text-gray-400">Atanmamış</span>
                      )}
                    </td>
                    
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {format(new Date(ticket.created_at), 'dd MMM yyyy', { locale: tr })}
                    </td>
                    
                    <td className="px-6 py-4 whitespace-nowrap">
                      {slaInfo.breached ? (
                        <span className="text-sm text-red-600 dark:text-red-400 font-medium">
                          SLA İhlali
                        </span>
                      ) : (
                        <span className="text-sm text-gray-500 dark:text-gray-400">
                          {Math.floor(slaInfo.remainingMs / (1000 * 60 * 60))}h kaldı
                        </span>
                      )}
                    </td>
                    
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-1">
                        <MessageSquare className="w-4 h-4 text-gray-400" />
                        <span className={`text-sm font-medium ${
                          (ticketMessageCounts[ticket.id] || 0) > 0 
                            ? 'text-blue-600 dark:text-blue-400' 
                            : 'text-gray-500 dark:text-gray-400'
                        }`}>
                          {ticketMessageCounts[ticket.id] || 0}
                        </span>
                      </div>
                    </td>
                    
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            onViewTicket(ticket.id);
                          }}
                          className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
                          title="Görüntüle"
                        >
                          <Eye className="w-4 h-4 text-gray-500" />
                        </button>
                        
                        <button
                          onClick={() => onEditTicket(ticket.id)}
                          className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
                          title="Düzenle"
                        >
                          <Edit className="w-4 h-4 text-blue-500" />
                        </button>
                        
                        <button
                          onClick={() => handleDeleteSingleTicket(ticket.id)}
                          className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
                          title="Sil"
                        >
                          <Trash2 className="w-4 h-4 text-red-500" />
                        </button>
                        
                        {customer && (
                          <button
                            onClick={() => handleDeleteCustomerTickets(customer.id)}
                            className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
                            title="Müşteri taleplerini sil"
                          >
                            <User className="w-4 h-4 text-orange-500" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-700 dark:text-gray-300">
              {paginatedTickets.length > 0 ? (
                <>
                  {(currentPage - 1) * itemsPerPage + 1} - {Math.min(currentPage * itemsPerPage, sortedTickets.length)} / {sortedTickets.length} talep
                </>
              ) : (
                'Talep bulunamadı'
              )}
            </div>
            
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage(1)}
                disabled={currentPage === 1}
                className="p-2 border border-gray-300 dark:border-gray-600 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                <ChevronsLeft className="w-4 h-4" />
              </button>
              
              <button
                onClick={() => setCurrentPage(currentPage - 1)}
                disabled={currentPage === 1}
                className="p-2 border border-gray-300 dark:border-gray-600 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              
              <span className="px-3 py-2 text-sm text-gray-700 dark:text-gray-300">
                Sayfa {currentPage} / {totalPages}
              </span>
              
              <button
                onClick={() => setCurrentPage(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="p-2 border border-gray-300 dark:border-gray-600 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
              
              <button
                onClick={() => setCurrentPage(totalPages)}
                disabled={currentPage === totalPages}
                className="p-2 border border-gray-300 dark:border-gray-600 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                <ChevronsRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Silme Onay Modalı */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 max-w-md w-full mx-4">
            <div className="flex items-center mb-4">
              <div className="p-2 bg-red-100 dark:bg-red-900/20 rounded-lg mr-3">
                <Trash2 className="w-6 h-6 text-red-600 dark:text-red-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Silme Onayı
              </h3>
            </div>
            
            <div className="mb-6">
              {deleteType === 'single' && (
                <p className="text-gray-600 dark:text-gray-400">
                  Bu talebi silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.
                </p>
              )}
              {deleteType === 'bulk' && (
                <p className="text-gray-600 dark:text-gray-400">
                  <strong>{selectedTickets.length}</strong> talebi silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.
                </p>
              )}
              {deleteType === 'customer' && (
                <p className="text-gray-600 dark:text-gray-400">
                  Bu müşterinin tüm taleplerini silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.
                </p>
              )}
            </div>
            
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => {
                  setShowDeleteConfirm(false);
                  setTicketToDelete(null);
                  setCustomerToDelete(null);
                }}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                İptal
              </button>
              <button
                onClick={confirmDelete}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg"
              >
                Sil
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toplu Mesaj Gönderme Modalı */}
      {showBulkMessageModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 max-w-2xl w-full mx-4">
            <div className="flex items-center mb-4">
              <div className="p-2 bg-green-100 dark:bg-green-900/20 rounded-lg mr-3">
                <MessageSquare className="w-6 h-6 text-green-600 dark:text-green-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Toplu Mesaj Gönder
              </h3>
            </div>
            
            <div className="mb-4">
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                <strong>{selectedTickets.length}</strong> isteğe aynı mesajı göndereceksiniz.
              </p>
              
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Mesaj İçeriği
              </label>
              <textarea
                value={bulkMessageInput}
                onChange={(e) => setBulkMessageInput(e.target.value)}
                placeholder="Göndermek istediğiniz mesajı yazın..."
                rows={6}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white resize-none"
              />
            </div>
            
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => {
                  setShowBulkMessageModal(false);
                  setBulkMessageInput('');
                }}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                İptal
              </button>
              <button
                onClick={async () => {
                  if (bulkMessageInput.trim()) {
                    try {
                      const messagePromises = selectedTickets.map(async (ticketId) => {
                        const { error } = await supabase
                          .from('ticket_messages')
                          .insert({
                            ticket_id: ticketId,
                            content: bulkMessageInput.trim(),
                            sender_type: 'agent',
                            sender_id: agents.find(a => a.status === 'active')?.id || null,
                            created_at: new Date().toISOString()
                          });
                        return error;
                      });
                      
                      const results = await Promise.all(messagePromises);
                      const hasError = results.some(error => error);
                      
                      if (hasError) {
                        toast.error('Mesaj gönderilirken hata oluştu');
                      } else {
                        toast.success(`${selectedTickets.length} isteğe mesaj iletildi`);
                        setShowBulkMessageModal(false);
                        setBulkMessageInput('');
                        fetchTickets();
                      }
                    } catch (error) {
                      toast.error('Mesaj gönderilirken hata oluştu');
                    }
                  } else {
                    toast.error('Lütfen mesaj içeriği girin');
                  }
                }}
                className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg"
              >
                Gönder
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TicketList;
