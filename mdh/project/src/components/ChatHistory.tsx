import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  MessageSquare, 
  Download, 
  Search, 
  Filter, 
  Calendar,
  Clock,
  User,
  Bot,
  FileText,
  Eye,
  Printer,
  Share2,
  Archive,
  Star,
  Tag,
  ArrowLeft,
  ChevronDown,
  ChevronUp,
  MoreVertical,
  History,
  ScrollText,
  Sparkles
} from 'lucide-react';
import { format, formatDistanceToNow, parseISO } from 'date-fns';
import { tr } from 'date-fns/locale';
import { toast } from 'react-hot-toast';
import { supabase } from '../lib/supabase';

interface ChatHistoryProps {
  customerData: any;
  tickets: any[];
  onBack?: () => void;
}

interface ChatMessage {
  id: string;
  ticket_id: string;
  sender_type: 'customer' | 'admin';
  sender_name: string;
  message: string;
  created_at: string;
  is_read: boolean;
  is_internal?: boolean;
  attachments?: string[];
}

interface ChatSession {
  id: string;
  ticket_id: string;
  title: string;
  status: string;
  priority: string;
  created_at: string;
  updated_at: string;
  duration?: number;
  message_count: number;
  agent_name?: string;
  tags?: string[];
  rating?: number;
  summary?: string;
}

const ChatHistory: React.FC<ChatHistoryProps> = ({
  customerData,
  tickets,
  onBack
}) => {
  const [selectedSession, setSelectedSession] = useState<ChatSession | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [chatSessions, setChatSessions] = useState<ChatSession[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('all');
  const [showTranscript, setShowTranscript] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isGeneratingSummary, setIsGeneratingSummary] = useState(false);
  const [sessionSummary, setSessionSummary] = useState<string>('');

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const loadChatSessions = useCallback(async () => {
    if (!customerData?.id) return;

    try {
      setIsLoading(true);
      
      // Müşteriye ait talepleri filtrele (tüm talepler)
      const customerTickets = tickets.filter(t => 
        t.customer_id === customerData.id
      );

      // Her talep için mesaj sayısını hesapla
      const sessionsWithMessageCount = await Promise.all(
        customerTickets.map(async (ticket) => {
          const { count, error } = await supabase
            .from('ticket_messages')
            .select('*', { count: 'exact', head: true })
            .eq('ticket_id', ticket.id)
            .not('is_internal', 'eq', true);

          if (error) {
            console.error('Mesaj sayısı hesaplama hatası:', error);
          }

          const duration = ticket.resolved_at 
            ? new Date(ticket.resolved_at).getTime() - new Date(ticket.created_at).getTime()
            : new Date().getTime() - new Date(ticket.created_at).getTime();

          const session = {
            id: ticket.id,
            ticket_id: ticket.id,
            title: ticket.title,
            status: ticket.status,
            priority: ticket.priority,
            created_at: ticket.created_at,
            updated_at: ticket.updated_at,
            duration: Math.round(duration / (1000 * 60)), // dakika cinsinden
            message_count: count || 0,
            agent_name: ticket.agent_name,
            tags: ticket.tags || [],
            rating: ticket.rating,
            summary: ticket.summary
          };
          
          return session;
        })
      );

      setChatSessions(sessionsWithMessageCount);
    } catch (error) {
      console.error('Sohbet oturumları yüklenirken hata:', error);
      toast.error('Sohbet geçmişi yüklenemedi');
    } finally {
      setIsLoading(false);
    }
  }, [customerData?.id, tickets.length]);

  const loadSessionMessages = useCallback(async (ticketId: string) => {
    try {
      const { data, error } = await supabase
        .from('ticket_messages')
        .select('*')
        .eq('ticket_id', ticketId)
        .not('is_internal', 'eq', true)
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Mesaj yükleme hatası:', error);
        throw error;
      }
      
      setMessages(data || []);
    } catch (error) {
      console.error('Mesajlar yüklenirken hata:', error);
      toast.error('Mesajlar yüklenemedi');
    }
  }, []);

  // Müşteriye ait sohbet oturumlarını yükle
  useEffect(() => {
    loadChatSessions();
  }, [loadChatSessions]);

  // Seçili oturumun mesajlarını yükle
  useEffect(() => {
    if (selectedSession) {
      loadSessionMessages(selectedSession.ticket_id);
    }
  }, [selectedSession, loadSessionMessages]);

  // Filtrelenmiş oturumlar
  const filteredSessions = chatSessions.filter(session => {
    const matchesSearch = session.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         session.agent_name?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || session.status === statusFilter;
    
    let matchesDate = true;
    if (dateFilter !== 'all') {
      const sessionDate = new Date(session.created_at);
      const now = new Date();
      
      switch (dateFilter) {
        case 'today':
          matchesDate = sessionDate.toDateString() === now.toDateString();
          break;
        case 'week':
          const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          matchesDate = sessionDate >= weekAgo;
          break;
        case 'month':
          const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          matchesDate = sessionDate >= monthAgo;
          break;
      }
    }

    return matchesSearch && matchesStatus && matchesDate;
  });

  // AI destekli özet oluştur
  const generateSessionSummary = async () => {
    if (!selectedSession || !messages.length) return;

    setIsGeneratingSummary(true);
    
    try {
      // Simüle edilmiş AI özet (gerçek uygulamada API çağrısı yapılır)
      await new Promise(resolve => setTimeout(resolve, 3000));

      const messageTexts = messages.map(m => `${m.sender_name}: ${m.message}`).join('\n');
      
      // Basit özet algoritması
      const summary = `Bu sohbet oturumu ${messages.length} mesaj içermektedir. 
      Müşteri ${messages.filter(m => m.sender_type === 'customer').length} mesaj göndermiş, 
      destek ekibi ${messages.filter(m => m.sender_type === 'admin').length} yanıt vermiştir. 
      Oturum ${selectedSession.duration} dakika sürmüş ve ${selectedSession.status} durumunda sonlanmıştır.`;

      setSessionSummary(summary);
      
      // Özeti veritabanına kaydet
      await supabase
        .from('tickets')
        .update({ summary })
        .eq('id', selectedSession.ticket_id);

      toast.success('Sohbet özeti oluşturuldu');
    } catch (error) {
      console.error('Özet oluşturulurken hata:', error);
      toast.error('Özet oluşturulamadı');
    } finally {
      setIsGeneratingSummary(false);
    }
  };

  // Transcript'i PDF olarak indir
  const downloadTranscript = async () => {
    if (!selectedSession || !messages.length) return;

    try {
      const transcriptContent = generateTranscriptContent();
      
      // Basit text dosyası olarak indir (gerçek uygulamada PDF oluşturulur)
      const blob = new Blob([transcriptContent], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `sohbet-transcript-${selectedSession.id}.txt`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast.success('Transcript indirildi');
    } catch (error) {
      console.error('Transcript indirilirken hata:', error);
      toast.error('Transcript indirilemedi');
    }
  };

  // Transcript içeriği oluştur
  const generateTranscriptContent = () => {
    if (!selectedSession || !messages.length) return '';

    let content = `SOHBET TRANSCRIPT\n`;
    content += `==================\n\n`;
    content += `Talep ID: ${selectedSession.ticket_id}\n`;
    content += `Başlık: ${selectedSession.title}\n`;
    content += `Tarih: ${format(new Date(selectedSession.created_at), 'dd MMMM yyyy HH:mm', { locale: tr })}\n`;
    content += `Süre: ${selectedSession.duration} dakika\n`;
    content += `Durum: ${selectedSession.status}\n`;
    content += `Öncelik: ${selectedSession.priority}\n`;
    content += `Temsilci: ${selectedSession.agent_name || 'Atanmamış'}\n`;
    content += `Mesaj Sayısı: ${messages.length}\n\n`;
    content += `MESAJLAR:\n`;
    content += `==========\n\n`;

    messages.forEach((message, index) => {
      const timestamp = format(new Date(message.created_at), 'HH:mm', { locale: tr });
      content += `[${timestamp}] ${message.sender_name}:\n`;
      content += `${message.message}\n\n`;
    });

    if (sessionSummary) {
      content += `ÖZET:\n`;
      content += `======\n`;
      content += `${sessionSummary}\n\n`;
    }

    return content;
  };

  // Oturum durumu bilgisi
  const getSessionStatusInfo = (status: string) => {
    const info = {
      open: {
        color: 'text-blue-600',
        bgColor: 'bg-blue-100',
        text: 'Açık'
      },
      in_progress: {
        color: 'text-orange-600',
        bgColor: 'bg-orange-100',
        text: 'Devam Ediyor'
      },
      resolved: {
        color: 'text-green-600',
        bgColor: 'bg-green-100',
        text: 'Çözüldü'
      },
      closed: {
        color: 'text-gray-600',
        bgColor: 'bg-gray-100',
        text: 'Kapalı'
      }
    };
    return info[status as keyof typeof info] || info.open;
  };

  // Ana görünüm - Sohbet oturumları listesi
  if (!selectedSession) {
    return (
      <div className="p-6 max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <History className="w-8 h-8 text-blue-500" />
              Sohbet Geçmişi
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-2">
              Geçmiş sohbet oturumlarınızı görüntüleyin ve transcript'leri indirin
            </p>
          </div>
          {onBack && (
            <button
              onClick={onBack}
              className="flex items-center gap-2 px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Geri
            </button>
          )}
        </div>

        {/* Filtreler */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Arama
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Sohbet ara..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Durum
              </label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option value="all">Tümü</option>
                <option value="open">Açık</option>
                <option value="in_progress">Devam Ediyor</option>
                <option value="resolved">Çözüldü</option>
                <option value="closed">Kapalı</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Tarih
              </label>
              <select
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option value="all">Tümü</option>
                <option value="today">Bugün</option>
                <option value="week">Son 7 Gün</option>
                <option value="month">Son 30 Gün</option>
              </select>
            </div>

            <div className="flex items-end">
              <button
                onClick={() => {
                  setSearchTerm('');
                  setStatusFilter('all');
                  setDateFilter('all');
                }}
                className="w-full px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
              >
                Filtreleri Temizle
              </button>
            </div>
          </div>
        </div>

        {/* Sohbet Oturumları */}
        <div className="space-y-4">
          {isLoading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="text-gray-600 dark:text-gray-400 mt-2">Sohbet geçmişi yükleniyor...</p>
            </div>
          ) : filteredSessions.length === 0 ? (
            <div className="text-center py-8">
              <MessageSquare className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 dark:text-gray-400">Henüz sohbet geçmişi bulunmuyor</p>
            </div>
          ) : (
            filteredSessions.map((session) => {
              const statusInfo = getSessionStatusInfo(session.status);
              
              return (
                <div
                  key={session.id}
                  onClick={() => setSelectedSession(session)}
                  className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 cursor-pointer hover:shadow-md transition-all duration-200"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                          {session.title}
                        </h3>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusInfo.bgColor} ${statusInfo.color}`}>
                          {statusInfo.text}
                        </span>
                        {session.rating && (
                          <div className="flex items-center gap-1">
                            <Star className="w-4 h-4 text-yellow-500 fill-current" />
                            <span className="text-sm text-gray-600 dark:text-gray-400">
                              {session.rating}/5
                            </span>
                          </div>
                        )}
                      </div>
                      
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-600 dark:text-gray-400">
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4" />
                          <span>{format(new Date(session.created_at), 'dd MMM yyyy', { locale: tr })}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4" />
                          <span>{session.duration} dakika</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <MessageSquare className="w-4 h-4" />
                          <span>{session.message_count} mesaj</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <User className="w-4 h-4" />
                          <span>{session.agent_name || 'Atanmamış'}</span>
                        </div>
                      </div>

                      {session.summary && (
                        <div className="mt-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                          <p className="text-sm text-blue-800 dark:text-blue-200">
                            <strong>Özet:</strong> {session.summary}
                          </p>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-2 ml-4">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedSession(session);
                          setShowTranscript(true);
                        }}
                        className="p-2 text-gray-400 hover:text-blue-600 transition-colors"
                        title="Transcript Görüntüle"
                      >
                        <ScrollText className="w-5 h-5" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedSession(session);
                        }}
                        className="p-2 text-gray-400 hover:text-blue-600 transition-colors"
                        title="Detayları Görüntüle"
                      >
                        <Eye className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    );
  }

  // Detay görünümü - Seçili oturumun mesajları
  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <button
            onClick={() => {
              setSelectedSession(null);
              setShowTranscript(false);
              setSessionSummary('');
            }}
            className="flex items-center gap-2 px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Geri
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              {selectedSession?.title}
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              {format(new Date(selectedSession?.created_at || ''), 'dd MMMM yyyy HH:mm', { locale: tr })}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={generateSessionSummary}
            disabled={isGeneratingSummary}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            <Sparkles className="w-4 h-4" />
            {isGeneratingSummary ? 'Özet Oluşturuluyor...' : 'AI Özet'}
          </button>
          <button
            onClick={downloadTranscript}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            <Download className="w-4 h-4" />
            Transcript İndir
          </button>
        </div>
      </div>

      {/* Oturum Bilgileri */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 mb-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <p className="text-sm text-gray-600 dark:text-gray-400">Durum</p>
            <p className="font-semibold text-gray-900 dark:text-white">
              {getSessionStatusInfo(selectedSession?.status || '').text}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-600 dark:text-gray-400">Süre</p>
            <p className="font-semibold text-gray-900 dark:text-white">
              {selectedSession?.duration} dakika
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-600 dark:text-gray-400">Mesaj Sayısı</p>
            <p className="font-semibold text-gray-900 dark:text-white">
              {messages.length}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-600 dark:text-gray-400">Temsilci</p>
            <p className="font-semibold text-gray-900 dark:text-white">
              {selectedSession?.agent_name || 'Atanmamış'}
            </p>
          </div>
        </div>
      </div>

      {/* AI Özet */}
      {sessionSummary && (
        <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-6 mb-6">
          <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-100 mb-2 flex items-center gap-2">
            <Sparkles className="w-5 h-5" />
            AI Özet
          </h3>
          <p className="text-blue-800 dark:text-blue-200">{sessionSummary}</p>
        </div>
      )}

      {/* Mesajlar */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Sohbet Mesajları
          </h3>
        </div>
        
        <div className="h-96 overflow-y-auto p-4 space-y-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.sender_type === 'customer' ? 'justify-start' : 'justify-end'}`}
            >
              <div
                className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                  message.sender_type === 'customer'
                    ? 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white'
                    : 'bg-blue-600 text-white'
                }`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-medium opacity-75">
                    {message.sender_name}
                  </span>
                  <span className="text-xs opacity-75">
                    {format(new Date(message.created_at), 'HH:mm', { locale: tr })}
                  </span>
                </div>
                <p className="text-sm">{message.message}</p>
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>
      </div>
    </div>
  );
};

export default ChatHistory;
