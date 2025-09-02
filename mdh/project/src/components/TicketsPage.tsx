import React, { useState, useEffect } from 'react';
import { Plus, Filter as FilterIcon, MessageSquare, Users, Clock, CheckCircle, AlertCircle, Bot, Lightbulb, RotateCcw } from 'lucide-react';
import CreateTicket from './CreateTicket';
import TicketList from './TicketList';
import TicketDetail from './TicketDetail';
import AutoCategorization from './AutoCategorization';
import AISmartAssignment from './AISmartAssignment';
import SmartPriorityEngine from './SmartPriorityEngine';
import SLAMonitor from './SLAMonitor';
import RevertHistory from './RevertHistory';
import FeedbackTab from './FeedbackTab';
import { useUser } from '../contexts/UserContext';
import { useSupabase } from '../hooks/useSupabase';
import { toast } from 'react-hot-toast';
import { supabase } from '../lib/supabase';

interface TicketsPageProps {
  onNavigateToPage?: (page: string, customerId?: string) => void;
}

const TicketsPage: React.FC<TicketsPageProps> = ({ onNavigateToPage }) => {
  const { userProfile } = useUser();
  const { tickets, customers, agents, fetchTickets, fetchCustomers, updateTicketStatus, assignTicket, updateTicketCategory } = useSupabase();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('all'); // all, open, in_progress, resolved, reminders, feedback

  const [showAutoCategorization, setShowAutoCategorization] = useState(false);

  const [showSmartAssignment, setShowSmartAssignment] = useState(false);

  useEffect(() => {
    const storedTicketId = localStorage.getItem('selectedTicketId');
    if (storedTicketId) {
      setSelectedTicketId(storedTicketId);
      setShowDetailModal(true);
      localStorage.removeItem('selectedTicketId');
    }
  }, []);

  const handleViewTicket = (ticketId: string) => {
    setSelectedTicketId(ticketId);
    setShowDetailModal(true);
  };

  const handleEditTicket = (ticketId: string) => {
    setSelectedTicketId(ticketId);
    setShowDetailModal(true);
  };

  const handleDeleteTicket = async (ticketId: string) => {
    try {
      const { error } = await supabase
        .from('tickets')
        .delete()
        .eq('id', ticketId);

      if (error) {
        toast.error('Talep silinirken hata oluştu');
        return;
      }

      toast.success('Talep başarıyla silindi');
      fetchTickets();
      // Müşteri verilerini de yeniden yükle
      fetchCustomers();
    } catch (error) {
      console.error('Talep silme hatası:', error);
      toast.error('Talep silinirken hata oluştu');
    }
  };

  const handleStatusUpdate = async (ticketId: string, status: string) => {
    try {
      await updateTicketStatus(ticketId, status);
      toast.success('Talep durumu güncellendi');
    } catch (error) {
      toast.error('Durum güncellenirken hata oluştu');
    }
  };

  const handleAssignTicket = async (ticketId: string, agentId: string) => {
    try {
      await assignTicket(ticketId, agentId);
      toast.success('Talep atandı');
    } catch (error) {
      toast.error('Atama yapılırken hata oluştu');
    }
  };

  const handleCategoryUpdate = async (ticketId: string, category: string) => {
    try {
      const { error } = await supabase
        .from('tickets')
        .update({ category })
        .eq('id', ticketId);

      if (error) {
        toast.error('Kategori güncellenirken hata oluştu');
        return;
      }

      toast.success('Kategori güncellendi');
      fetchTickets();
    } catch (error) {
      console.error('Kategori güncelleme hatası:', error);
      toast.error('Kategori güncellenirken hata oluştu');
    }
  };

  const handlePriorityUpdate = async (ticketId: string, priority: string) => {
    try {
      const { error } = await supabase
        .from('tickets')
        .update({ priority })
        .eq('id', ticketId);

      if (error) {
        toast.error('Öncelik güncellenirken hata oluştu');
        return;
      }

      toast.success('Öncelik güncellendi');
      fetchTickets();
    } catch (error) {
      console.error('Öncelik güncelleme hatası:', error);
      toast.error('Öncelik güncellenirken hata oluştu');
    }
  };

  const handleTicketUpdate = () => {
    console.log('Ticket updated');
  };

  const handleCreateSuccess = () => {
    console.log('Ticket created');
    fetchTickets(); // Talepleri yeniden yükle
    toast.success('Talep başarıyla oluşturuldu');
  };

  // Gerçek zamanlı güncellemeler için subscription
  useEffect(() => {
    const ticketsSubscription = supabase
      .channel('admin_tickets_changes')
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'tickets' 
        }, 
        (payload: any) => {
          console.log('Admin ticket change detected:', payload);
          if (payload.eventType === 'INSERT') {
            toast.success('Yeni talep geldi!');
            // Yeni talep geldiğinde tüm listeyi yenile
            fetchTickets();
          }
          // UPDATE ve DELETE işlemleri için state zaten güncelleniyor, fetchTickets() gerekmez
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(ticketsSubscription);
    };
  }, []);

  // Ticket istatistikleri
  const ticketStats = {
    total: tickets.length,
    open: tickets.filter(t => t.status === 'open').length,
    inProgress: tickets.filter(t => t.status === 'in_progress').length,
    resolved: tickets.filter(t => t.status === 'resolved').length,
    reminders: tickets.filter(t => t.ticket_type === 'reminder' || t.ticket_type === 'notification').length,
    today: tickets.filter(t => {
      const today = new Date().toDateString();
      const ticketDate = new Date(t.created_at).toDateString();
      return today === ticketDate;
    }).length
  };

  // Filtrelenmiş talepler
  const filteredTickets = tickets.filter(ticket => {
    if (activeTab === 'all') return true;
    if (activeTab === 'reminders') {
      return ticket.ticket_type === 'reminder' || ticket.ticket_type === 'notification';
    }
    return ticket.status === activeTab;
  });

  // Müşteri filtresi kontrolü
  const customerFilter = localStorage.getItem('customerFilter');
  
  // Müşteri filtresi uygulanmış talepler
  const customerFilteredTickets = customerFilter 
    ? filteredTickets.filter(ticket => ticket.customer_id === customerFilter)
    : filteredTickets;

  return (
    <div className="h-full flex flex-col space-y-4 pt-2">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">
            Talepler
          </h1>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Müşteri taleplerini yönetin ve takip edin
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowAutoCategorization(true)}
            className="inline-flex items-center px-3 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-sm font-medium"
          >
            <Bot className="w-4 h-4 mr-2" />
            Otomatik Kategorizasyon
          </button>

          <button
            onClick={() => setShowSmartAssignment(true)}
            className="inline-flex items-center px-3 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-medium"
          >
            <Users className="w-4 h-4 mr-2" />
            Akıllı Atama
          </button>
          <button
            onClick={() => setShowCreateModal(true)}
            className="inline-flex items-center px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium"
          >
            <Plus className="w-4 h-4 mr-2" />
            Yeni Talep
          </button>
        </div>
      </div>

      {/* İstatistikler */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-2">
            <div className="p-1.5 bg-blue-100 dark:bg-blue-900 rounded-lg">
              <MessageSquare className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            </div>
            <span className="text-lg font-bold text-gray-900 dark:text-white">
              {ticketStats.total}
            </span>
          </div>
          <h3 className="text-xs font-medium text-gray-900 dark:text-white mb-1">
            Toplam Talep
          </h3>
          <p className="text-xs text-gray-600 dark:text-gray-400">
            Tüm destek talepleri
          </p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-2">
            <div className="p-1.5 bg-red-100 dark:bg-red-900 rounded-lg">
              <AlertCircle className="w-4 h-4 text-red-600 dark:text-red-400" />
            </div>
            <span className="text-lg font-bold text-red-600 dark:text-red-400">
              {ticketStats.open}
            </span>
          </div>
          <h3 className="text-xs font-medium text-gray-900 dark:text-white mb-1">
            Açık Talepler
          </h3>
          <p className="text-xs text-gray-600 dark:text-gray-400">
            Yanıt bekleyen talepler
          </p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-2">
            <div className="p-1.5 bg-yellow-100 dark:bg-yellow-900 rounded-lg">
              <Clock className="w-4 h-4 text-yellow-600 dark:text-yellow-400" />
            </div>
            <span className="text-lg font-bold text-yellow-600 dark:text-yellow-400">
              {ticketStats.inProgress}
            </span>
          </div>
          <h3 className="text-xs font-medium text-gray-900 dark:text-white mb-1">
            İşlemde
          </h3>
          <p className="text-xs text-gray-600 dark:text-gray-400">
            Çözüm sürecinde
          </p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-2">
            <div className="p-1.5 bg-green-100 dark:bg-green-900 rounded-lg">
              <CheckCircle className="w-4 h-4 text-green-600 dark:text-green-400" />
            </div>
            <span className="text-lg font-bold text-green-600 dark:text-green-400">
              {ticketStats.resolved}
            </span>
          </div>
          <h3 className="text-xs font-medium text-gray-900 dark:text-white mb-1">
            Çözüldü
          </h3>
          <p className="text-xs text-gray-600 dark:text-gray-400">
            Tamamlanan talepler
          </p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-2">
            <div className="p-1.5 bg-purple-100 dark:bg-purple-900 rounded-lg">
              <Users className="w-4 h-4 text-purple-600 dark:text-purple-400" />
            </div>
            <span className="text-lg font-bold text-purple-600 dark:text-purple-400">
              {ticketStats.today}
            </span>
          </div>
          <h3 className="text-xs font-medium text-gray-900 dark:text-white mb-1">
            Bugün Yeni
          </h3>
          <p className="text-xs text-gray-600 dark:text-gray-400">
            Bugün oluşturulan
          </p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-2">
            <div className="p-1.5 bg-orange-100 dark:bg-orange-900 rounded-lg">
              <MessageSquare className="w-4 h-4 text-orange-600 dark:text-orange-400" />
            </div>
            <span className="text-lg font-bold text-orange-600 dark:text-orange-400">
              {ticketStats.reminders}
            </span>
          </div>
          <h3 className="text-xs font-medium text-gray-900 dark:text-white mb-1">
            Hatırlatmalar
          </h3>
          <p className="text-xs text-gray-600 dark:text-gray-400">
            Ödeme hatırlatmaları
          </p>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="border-b border-gray-200 dark:border-gray-700">
          <nav className="flex space-x-6 px-4">
            <button
              onClick={() => setActiveTab('all')}
              className={`py-3 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'all'
                  ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
            >
              Tümü ({ticketStats.total})
            </button>
            <button
              onClick={() => setActiveTab('open')}
              className={`py-3 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'open'
                  ? 'border-red-500 text-red-600 dark:text-red-400'
                  : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
            >
              Açık ({ticketStats.open})
            </button>
            <button
              onClick={() => setActiveTab('in_progress')}
              className={`py-3 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'in_progress'
                  ? 'border-yellow-500 text-yellow-600 dark:text-yellow-400'
                  : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
            >
              İşlemde ({ticketStats.inProgress})
            </button>
            <button
              onClick={() => setActiveTab('resolved')}
              className={`py-3 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'resolved'
                  ? 'border-green-500 text-green-600 dark:text-green-400'
                  : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
            >
              Çözüldü ({ticketStats.resolved})
            </button>
            <button
              onClick={() => setActiveTab('reminders')}
              className={`py-3 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'reminders'
                  ? 'border-orange-500 text-orange-600 dark:text-orange-400'
                  : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
            >
              Hatırlatmalar ({ticketStats.reminders})
            </button>
            <button
              onClick={() => setActiveTab('priority')}
              className={`py-3 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'priority'
                  ? 'border-purple-500 text-purple-600 dark:text-purple-400'
                  : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
            >
              Akıllı Öncelik
            </button>
            <button
              onClick={() => setActiveTab('sla')}
              className={`py-3 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'sla'
                  ? 'border-red-500 text-red-600 dark:text-red-400'
                  : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
            >
              SLA Takibi
            </button>
            <button
              onClick={() => setActiveTab('revert-history')}
              className={`py-3 px-1 border-b-2 font-medium text-sm transition-colors flex items-center ${
                activeTab === 'revert-history'
                  ? 'border-gray-500 text-gray-600 dark:text-gray-400'
                  : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
            >
              <RotateCcw className="w-4 h-4 mr-2" />
              Geri Alınış Geçmişi
            </button>
            <button
              onClick={() => setActiveTab('feedback')}
              className={`py-3 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'feedback'
                  ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
            >
              Geri Bildirimler
            </button>
          </nav>
        </div>
      </div>

      {/* Tab Content */}
      {activeTab === 'priority' && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
              Akıllı Öncelik Yönetimi
            </h2>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-3">
                  Toplu Öncelik Hesaplama
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                  Tüm açık taleplerin önceliklerini AI ile otomatik olarak hesaplayın.
                </p>
                <button
                  onClick={() => {
                    // Toplu öncelik hesaplama işlemi
                    toast.success('Toplu öncelik hesaplama başlatıldı');
                  }}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
                >
                  Toplu Hesaplama Başlat
                </button>
              </div>
              
              <div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-3">
                  Öncelik İstatistikleri
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3">
                    <div className="text-2xl font-bold text-blue-600">{tickets.filter(t => t.priority === 'high').length}</div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">Yüksek Öncelik</div>
                  </div>
                  <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3">
                    <div className="text-2xl font-bold text-orange-600">{tickets.filter(t => t.priority === 'urgent').length}</div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">Acil</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'sla' && (
        <div className="space-y-6">
          <SLAMonitor showAll={true} />
        </div>
      )}

      {activeTab === 'revert-history' && (
        <div className="space-y-6">
          <RevertHistory isAdmin={true} />
        </div>
      )}

      {activeTab === 'feedback' && (
        <div className="space-y-6">
          <FeedbackTab />
        </div>
      )}

      {/* Ticket List - Flex-1 ile kalan alanı kapla */}
      {!['priority', 'sla', 'revert-history', 'feedback'].includes(activeTab) && (
        <div className="flex-1 min-h-0">
          <TicketList
            onViewTicket={handleViewTicket}
            onEditTicket={handleEditTicket}
            onDeleteTicket={handleDeleteTicket}
            onStatusUpdate={handleStatusUpdate}
            onAssignTicket={handleAssignTicket}
            onNavigateToPage={onNavigateToPage}
            activeTab={activeTab}
            filteredTickets={customerFilteredTickets}
          />
        </div>
      )}



      {/* Otomatik Kategorizasyon Modal */}
      {showAutoCategorization && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg w-full max-w-6xl h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                  Otomatik Kategorizasyon
                </h2>
                <button
                  onClick={() => setShowAutoCategorization(false)}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
            <div className="p-6">
              <AutoCategorization
                tickets={tickets}
                onCategoryUpdate={handleCategoryUpdate}
                onPriorityUpdate={handlePriorityUpdate}
                onFilterChange={(filteredTickets) => {
                  console.log('Filtered tickets:', filteredTickets);
                }}
              />
            </div>
          </div>
        </div>
      )}



      {/* Akıllı Atama Modal */}
      {showSmartAssignment && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg w-full max-w-6xl h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                  AI Akıllı Temsilci Atama
                </h2>
                <button
                  onClick={() => setShowSmartAssignment(false)}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
            <div className="p-6">
              <AISmartAssignment
                tickets={tickets}
                agents={agents}
                onAssignTicket={async (ticketId, agentId) => {
                  try {
                    const { error } = await supabase
                      .from('tickets')
                      .update({ agent_id: agentId })
                      .eq('id', ticketId);
                    
                    if (error) throw error;
                    
                    toast.success('Talep başarıyla atandı');
                    fetchTickets();
                  } catch (error) {
                    console.error('Atama hatası:', error);
                    toast.error('Talep atanırken hata oluştu');
                  }
                }}
              />
            </div>
          </div>
        </div>
      )}

      <CreateTicket
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSuccess={handleCreateSuccess}
      />

      <TicketDetail
        ticketId={selectedTicketId}
        isOpen={showDetailModal}
        onClose={() => {
          setShowDetailModal(false);
          setSelectedTicketId(null);
        }}
        onUpdate={handleTicketUpdate}
        onTicketChange={(newTicketId) => {
          setSelectedTicketId(newTicketId);
        }}
        currentUser={userProfile}
      />
    </div>
  );
};

export default TicketsPage;