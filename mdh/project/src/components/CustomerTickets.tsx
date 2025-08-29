import React, { useState, useEffect } from 'react';
import { 
  MessageSquare, 
  Plus, 
  Search, 
  Filter, 
  Calendar, 
  Clock, 
  CheckCircle, 
  AlertCircle, 
  XCircle, 
  Settings, 
  Eye, 
  X, 
  Download, 
  Bell,
  ArrowLeft,
  RefreshCw,
  FileText,
  BarChart3,
  Share2,
  Mail,
  Loader2
} from 'lucide-react';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';
import { toast } from 'react-hot-toast';
import { useSupabase } from '../hooks/useSupabase';
import { supabase } from '../lib/supabase';
import CreateTicket from './CreateTicket';
import TicketDetail from './TicketDetail';
import TicketTimeline from './TicketTimeline';

interface CustomerTicketsProps {
  customerData: any;
  tickets: any[];
  payments: any[];
  onBack: () => void;
  onRefresh: () => void;
  currentUser: any;
}

const CustomerTickets: React.FC<CustomerTicketsProps> = ({
  customerData,
  tickets,
  payments,
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
  const [sortBy, setSortBy] = useState('created_at');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [ticketMessageCounts, setTicketMessageCounts] = useState<{[key: string]: number}>({});
  const [isLoading, setIsLoading] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [exportFormat, setExportFormat] = useState<'json' | 'csv' | 'pdf'>('json');

  const { updateTicketStatus, deleteTicket } = useSupabase();

  // Müşteriye ait talepleri filtrele (ödeme hatırlatmaları hariç)
  const customerTickets = tickets.filter(t => 
    t.customer_id === customerData?.id && t.category !== 'payment_reminder'
  );

  // Ödeme hatırlatması talepleri (sadece Canlı Destek için)
  const paymentReminderTickets = tickets.filter(t => 
    t.customer_id === customerData?.id && t.category === 'payment_reminder'
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

  // Talep tıklama
  const handleTicketClick = (ticket: any) => {
    handleViewTicket(ticket);
  };

  // Talep durumu güncelleme
  const handleStatusUpdate = async (ticketId: string, newStatus: string) => {
    try {
      await updateTicketStatus(ticketId, newStatus);
      toast.success('Talep durumu güncellendi');
      onRefresh();
    } catch (error) {
      console.error('Durum güncelleme hatası:', error);
      toast.error('Durum güncellenirken hata oluştu');
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
      let mimeType: string;

      if (exportFormat === 'json') {
        blob = new Blob([JSON.stringify(ticketHistory, null, 2)], { type: 'application/json' });
        filename = `talep-gecmisi-${customerData?.name || 'user'}-${new Date().toISOString().split('T')[0]}.json`;
        mimeType = 'application/json';
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
        mimeType = 'text/csv';
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
        mimeType = 'text/html';
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

      {/* Talep Listesi */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
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
          <div className="space-y-4">
            <div className="divide-y divide-gray-200 dark:divide-gray-700">
              {sortedTickets.map((ticket) => (
                <div
                  key={ticket.id}
                  className="p-6 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer transition-colors"
                  onClick={() => handleViewTicket(ticket)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <span className="text-sm font-medium text-gray-900 dark:text-white">
                          #{ticket.id.slice(0, 8)}
                        </span>
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(ticket.status)}`}>
                          {getStatusText(ticket.status)}
                        </span>
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getPriorityColor(ticket.priority)}`}>
                          {getPriorityText(ticket.priority)}
                        </span>
                        <div className="flex items-center gap-1 px-2 py-0.5 bg-gray-100 dark:bg-gray-700 rounded-full">
                          {getCategoryIcon(ticket.category)}
                          <span className="text-xs text-gray-700 dark:text-gray-300">
                            {getCategoryText(ticket.category)}
                          </span>
                        </div>
                      </div>
                      
                      <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                        {ticket.title || 'Başlıksız Talep'}
                      </h3>
                      
                      {ticket.description && (
                        <p className="text-gray-600 dark:text-gray-400 text-sm line-clamp-2 mb-3">
                          {ticket.description}
                        </p>
                      )}
                      
                      <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
                        <div className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          <span>{format(new Date(ticket.created_at), 'dd MMM yyyy', { locale: tr })}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <MessageSquare className="w-4 h-4" />
                          <span className={`font-medium ${
                            (ticketMessageCounts[ticket.id] || 0) > 0 
                              ? 'text-blue-600 dark:text-blue-400' 
                              : 'text-gray-500 dark:text-gray-400'
                          }`}>
                            {ticketMessageCounts[ticket.id] || 0} {(ticketMessageCounts[ticket.id] || 0) === 1 ? 'yanıt' : 'yanıt'}
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      {ticket.status === 'draft' && (
                        <>
                          <button 
                            className="p-2 text-orange-400 hover:text-orange-600 dark:hover:text-orange-300"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleEditDraft(ticket);
                            }}
                            title="Taslağı düzenle"
                          >
                            <Settings className="w-5 h-5" />
                          </button>
                          <button 
                            className="p-2 text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 bg-red-50 hover:bg-red-100 dark:bg-red-900/20 dark:hover:bg-red-900/30 rounded-lg"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteDraft(ticket);
                            }}
                            title="Taslağı sil"
                          >
                            <X className="w-5 h-5" />
                          </button>
                        </>
                      )}
                      <button className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                        <Eye className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

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
                    const ticketHistory = {
                      customer: customerData,
                      tickets: filteredTickets,
                      exportDate: new Date().toISOString()
                    };
                    
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
    </div>
  );
};

export default CustomerTickets;
