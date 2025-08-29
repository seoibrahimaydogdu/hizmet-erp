import React, { useState, useEffect } from 'react';
import { 
  CheckSquare, 
  Square, 
  Users, 
  Filter,
  Search,
  RefreshCw,
  Download,
  Archive,
  AlertTriangle,
  FileText,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';
import { toast } from 'react-hot-toast';
import { supabase } from '../lib/supabase';

interface BulkOperationsProps {
  currentUser: any;
}

interface Ticket {
  id: string;
  title: string;
  status: string;
  priority: string;
  category: string;
  created_at: string;
  customer_name?: string;
  agent_name?: string;
}

const BulkOperations: React.FC<BulkOperationsProps> = ({ currentUser }) => {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [filteredTickets, setFilteredTickets] = useState<Ticket[]>([]);
  const [selectedTickets, setSelectedTickets] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    status: '',
    priority: '',
    category: ''
  });
  const [showFilters, setShowFilters] = useState(false);
  const [bulkAction, setBulkAction] = useState('');

  useEffect(() => {
    fetchTickets();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [tickets, searchTerm, filters]);

  const fetchTickets = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('tickets')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setTickets(data || []);
    } catch (error) {
      console.error('Talep yükleme hatası:', error);
      toast.error('Talepler yüklenirken hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...tickets];

    if (searchTerm) {
      filtered = filtered.filter(ticket =>
        ticket.title.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (filters.status) {
      filtered = filtered.filter(ticket => ticket.status === filters.status);
    }

    if (filters.priority) {
      filtered = filtered.filter(ticket => ticket.priority === filters.priority);
    }

    if (filters.category) {
      filtered = filtered.filter(ticket => ticket.category === filters.category);
    }

    setFilteredTickets(filtered);
  };

  const handleSelectAll = () => {
    if (selectedTickets.size === filteredTickets.length) {
      setSelectedTickets(new Set());
    } else {
      setSelectedTickets(new Set(filteredTickets.map(ticket => ticket.id)));
    }
  };

  const handleSelectTicket = (ticketId: string) => {
    const newSelected = new Set(selectedTickets);
    if (newSelected.has(ticketId)) {
      newSelected.delete(ticketId);
    } else {
      newSelected.add(ticketId);
    }
    setSelectedTickets(newSelected);
  };

  const executeBulkAction = async () => {
    if (selectedTickets.size === 0) {
      toast.error('Lütfen en az bir talep seçin');
      return;
    }

    if (!bulkAction) {
      toast.error('Lütfen bir işlem seçin');
      return;
    }

    try {
      setProcessing(true);
      const ticketIds = Array.from(selectedTickets);

      switch (bulkAction) {
        case 'status':
          const { error: statusError } = await supabase
            .from('tickets')
            .update({ status: 'in_progress', updated_at: new Date().toISOString() })
            .in('id', ticketIds);

          if (statusError) throw statusError;
          toast.success(`${ticketIds.length} talep durumu güncellendi`);
          break;

        case 'priority':
          const { error: priorityError } = await supabase
            .from('tickets')
            .update({ priority: 'medium', updated_at: new Date().toISOString() })
            .in('id', ticketIds);

          if (priorityError) throw priorityError;
          toast.success(`${ticketIds.length} talep önceliği güncellendi`);
          break;

        case 'archive':
          const { error: archiveError } = await supabase
            .from('tickets')
            .update({ status: 'archived', updated_at: new Date().toISOString() })
            .in('id', ticketIds);

          if (archiveError) throw archiveError;
          toast.success(`${ticketIds.length} talep arşivlendi`);
          break;

        case 'export':
          const selectedTicketsData = tickets.filter(ticket => 
            selectedTickets.has(ticket.id)
          );
          
          const csvContent = [
            ['ID', 'Başlık', 'Durum', 'Öncelik', 'Kategori', 'Oluşturulma Tarihi'],
            ...selectedTicketsData.map(ticket => [
              ticket.id,
              ticket.title,
              ticket.status,
              ticket.priority,
              ticket.category,
              format(new Date(ticket.created_at), 'dd/MM/yyyy HH:mm', { locale: tr })
            ])
          ].map(row => row.join(',')).join('\n');

          const blob = new Blob([csvContent], { type: 'text/csv' });
          const url = window.URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `talepler_${format(new Date(), 'yyyy-MM-dd')}.csv`;
          a.click();
          window.URL.revokeObjectURL(url);
          
          toast.success(`${ticketIds.length} talep dışa aktarıldı`);
          break;

        default:
          toast.error('Geçersiz işlem');
          return;
      }

      setSelectedTickets(new Set());
      setBulkAction('');
      fetchTickets();

    } catch (error) {
      console.error('Toplu işlem hatası:', error);
      toast.error('Toplu işlem sırasında hata oluştu');
    } finally {
      setProcessing(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400';
      case 'in_progress': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400';
      case 'resolved': return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400';
      case 'closed': return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400';
      case 'archived': return 'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'low': return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400';
      case 'medium': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400';
      case 'high': return 'bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400';
      case 'urgent': return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2 text-gray-600 dark:text-gray-400">Talepler yükleniyor...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="p-3 bg-blue-100 dark:bg-blue-900/20 rounded-xl">
            <Users className="w-6 h-6 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Toplu İşlemler
            </h1>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Talepleri toplu olarak yönetin ve işlemler yapın
            </p>
          </div>
        </div>
        
        <button
          onClick={fetchTickets}
          className="flex items-center space-x-2 px-4 py-2 text-sm text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
          <span>Yenile</span>
        </button>
      </div>

      {/* Arama ve Filtreler */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Talep ara..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
              />
            </div>
          </div>

          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center space-x-2 px-4 py-2 text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <Filter className="w-4 h-4" />
            <span>Filtreler</span>
            {showFilters ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>

        {showFilters && (
          <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
            <select
              value={filters.status}
              onChange={(e) => setFilters({ ...filters, status: e.target.value })}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
            >
              <option value="">Tüm Durumlar</option>
              <option value="open">Açık</option>
              <option value="in_progress">İşlemde</option>
              <option value="resolved">Çözüldü</option>
              <option value="closed">Kapalı</option>
              <option value="archived">Arşivlendi</option>
            </select>

            <select
              value={filters.priority}
              onChange={(e) => setFilters({ ...filters, priority: e.target.value })}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
            >
              <option value="">Tüm Öncelikler</option>
              <option value="low">Düşük</option>
              <option value="medium">Orta</option>
              <option value="high">Yüksek</option>
              <option value="urgent">Acil</option>
            </select>

            <select
              value={filters.category}
              onChange={(e) => setFilters({ ...filters, category: e.target.value })}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
            >
              <option value="">Tüm Kategoriler</option>
              <option value="technical">Teknik</option>
              <option value="billing">Faturalama</option>
              <option value="general">Genel</option>
              <option value="bug">Hata</option>
              <option value="feature">Özellik</option>
            </select>
          </div>
        )}
      </div>

      {/* Toplu İşlem Araçları */}
      {selectedTickets.size > 0 && (
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-xl p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <CheckSquare className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              <span className="text-sm font-medium text-blue-800 dark:text-blue-300">
                {selectedTickets.size} talep seçildi
              </span>
            </div>

            <div className="flex items-center space-x-2">
              <select
                value={bulkAction}
                onChange={(e) => setBulkAction(e.target.value)}
                className="px-3 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
              >
                <option value="">İşlem seçin...</option>
                <option value="status">Durum Güncelle</option>
                <option value="priority">Öncelik Güncelle</option>
                <option value="archive">Arşivle</option>
                <option value="export">Dışa Aktar</option>
              </select>

              <button
                onClick={executeBulkAction}
                disabled={!bulkAction || processing}
                className="px-4 py-1 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {processing ? 'İşleniyor...' : 'Uygula'}
              </button>

              <button
                onClick={() => setSelectedTickets(new Set())}
                className="px-3 py-1 text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                Seçimi Temizle
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Talep Listesi */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-6 py-3 text-left">
                  <button
                    onClick={handleSelectAll}
                    className="flex items-center space-x-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
                  >
                    {selectedTickets.size === filteredTickets.length && filteredTickets.length > 0 ? (
                      <CheckSquare className="w-4 h-4" />
                    ) : (
                      <Square className="w-4 h-4" />
                    )}
                    <span>Tümü</span>
                  </button>
                </th>
                <th className="px-6 py-3 text-left text-sm font-medium text-gray-700 dark:text-gray-300">
                  Talep
                </th>
                <th className="px-6 py-3 text-left text-sm font-medium text-gray-700 dark:text-gray-300">
                  Durum
                </th>
                <th className="px-6 py-3 text-left text-sm font-medium text-gray-700 dark:text-gray-300">
                  Öncelik
                </th>
                <th className="px-6 py-3 text-left text-sm font-medium text-gray-700 dark:text-gray-300">
                  Kategori
                </th>
                <th className="px-6 py-3 text-left text-sm font-medium text-gray-700 dark:text-gray-300">
                  Tarih
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {filteredTickets.map((ticket) => (
                <tr key={ticket.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                  <td className="px-6 py-4">
                    <button
                      onClick={() => handleSelectTicket(ticket.id)}
                      className="flex items-center space-x-2"
                    >
                      {selectedTickets.has(ticket.id) ? (
                        <CheckSquare className="w-4 h-4 text-blue-600" />
                      ) : (
                        <Square className="w-4 h-4 text-gray-400" />
                      )}
                    </button>
                  </td>
                  <td className="px-6 py-4">
                    <div className="max-w-xs">
                      <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                        {ticket.title}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        #{ticket.id.slice(0, 8)}
                      </p>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(ticket.status)}`}>
                      {ticket.status === 'open' && 'Açık'}
                      {ticket.status === 'in_progress' && 'İşlemde'}
                      {ticket.status === 'resolved' && 'Çözüldü'}
                      {ticket.status === 'closed' && 'Kapalı'}
                      {ticket.status === 'archived' && 'Arşivlendi'}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getPriorityColor(ticket.priority)}`}>
                      {ticket.priority === 'low' && 'Düşük'}
                      {ticket.priority === 'medium' && 'Orta'}
                      {ticket.priority === 'high' && 'Yüksek'}
                      {ticket.priority === 'urgent' && 'Acil'}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm text-gray-900 dark:text-white">
                      {ticket.category === 'technical' && 'Teknik'}
                      {ticket.category === 'billing' && 'Faturalama'}
                      {ticket.category === 'general' && 'Genel'}
                      {ticket.category === 'bug' && 'Hata'}
                      {ticket.category === 'feature' && 'Özellik'}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                      {format(new Date(ticket.created_at), 'dd/MM/yyyy', { locale: tr })}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredTickets.length === 0 && (
          <div className="text-center py-8">
            <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500 dark:text-gray-400">
              {searchTerm || Object.values(filters).some(f => f) 
                ? 'Arama kriterlerinize uygun talep bulunamadı'
                : 'Henüz talep bulunmuyor'
              }
            </p>
          </div>
        )}
      </div>

      {/* İstatistikler */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Toplam Talep
              </p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {tickets.length}
              </p>
            </div>
            <div className="p-3 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
              <FileText className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Filtrelenmiş
              </p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {filteredTickets.length}
              </p>
            </div>
            <div className="p-3 bg-green-100 dark:bg-green-900/20 rounded-lg">
              <Filter className="w-6 h-6 text-green-600 dark:text-green-400" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Seçili
              </p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {selectedTickets.size}
              </p>
            </div>
            <div className="p-3 bg-orange-100 dark:bg-orange-900/20 rounded-lg">
              <CheckSquare className="w-6 h-6 text-orange-600 dark:text-orange-400" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Açık Talepler
              </p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {tickets.filter(t => t.status === 'open').length}
              </p>
            </div>
            <div className="p-3 bg-red-100 dark:bg-red-900/20 rounded-lg">
              <AlertTriangle className="w-6 h-6 text-red-600 dark:text-red-400" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BulkOperations;
