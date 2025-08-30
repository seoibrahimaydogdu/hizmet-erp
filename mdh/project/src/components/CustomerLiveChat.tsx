import React, { useState, useEffect, useRef } from 'react';
import {
  Send,
  User,
  MessageSquare,
  Clock,
  Users,
  CheckCircle,
  AlertCircle,
  RefreshCw,
  Bell,
  X,
  Minus,
  Plus,
  Settings,
  Info,
  Phone,
  Video,
  FileText,
  Smile,
  Paperclip,
  Mic,
  Image,
  File,
  Bold,
  Italic,
  Underline,
  Strikethrough,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  List,
  ListOrdered,
  Quote,
  Code,
  Palette,
  Link,
  Table,
  Undo,
  Redo,
  Eye,
  Shield,
  Zap,
  Star,
  TrendingUp,
  AlertTriangle,
  Search
} from 'lucide-react';
import VoiceSearch from './common/VoiceSearch';
import VoiceMessage from './common/VoiceMessage';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';
import { toast } from 'react-hot-toast';
import { useSupabase } from '../hooks/useSupabase';

interface Message {
  id: string;
  content: string;
  senderId: string;
  senderName: string;
  senderType: 'customer' | 'agent';
  timestamp: Date;
  attachments?: string[];
  ticketId?: string;
  // Alıntı özelliği
  replyTo?: {
    messageId: string;
    senderName: string;
    content: string;
  };
}

interface Ticket {
  id: string;
  title: string;
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  category: string;
  created_at: string;
  updated_at: string;
  customer_id: string;
  agent_id?: string;
}

interface QueuePosition {
  position: number;
  estimatedWaitTime: number;
  totalInQueue: number;
}

interface CustomerLiveChatProps {
  customerId: string;
  customerName: string;
  customerEmail: string;
  className?: string;
}

const CustomerLiveChat: React.FC<CustomerLiveChatProps> = ({
  customerId,
  customerName,
  customerEmail,
  className = ''
}) => {
  const { supabase } = useSupabase();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const editorRef = useRef<HTMLDivElement>(null);

  // Chat state
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const [agentInfo, setAgentInfo] = useState<any>(null);
  const [isTyping, setIsTyping] = useState(false);
  const [attachments, setAttachments] = useState<File[]>([]);

  // Ticket state
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [currentTicket, setCurrentTicket] = useState<Ticket | null>(null);
  const [showTicketForm, setShowTicketForm] = useState(false);
  const [ticketForm, setTicketForm] = useState({
    title: '',
    priority: 'medium' as 'low' | 'medium' | 'high' | 'urgent',
    category: 'general',
    description: ''
  });

  // Queue state
  const [queuePosition, setQueuePosition] = useState<QueuePosition | null>(null);
  const [isInQueue, setIsInQueue] = useState(false);
  const [agents, setAgents] = useState<any[]>([]);
  const [isLoadingQueue, setIsLoadingQueue] = useState(false);

  // Rich editor state
  const [isRichEditor, setIsRichEditor] = useState(false);
  const [characterCount, setCharacterCount] = useState(0);
  const maxCharacters = 2000;

  // Search state
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredTickets, setFilteredTickets] = useState<Ticket[]>([]);
  
  // Alıntı özelliği için state'ler
  const [replyingTo, setReplyingTo] = useState<Message | null>(null);
  const [replyContent, setReplyContent] = useState('');

  // Priority colors and text
  const priorityColors = {
    low: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300',
    medium: 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300',
    high: 'bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-300',
    urgent: 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300'
  };

  const priorityText = {
    low: 'Düşük',
    medium: 'Orta',
    high: 'Yüksek',
    urgent: 'Acil'
  };

  const priorityIcons = {
    low: <Star className="w-4 h-4" />,
    medium: <TrendingUp className="w-4 h-4" />,
    high: <AlertTriangle className="w-4 h-4" />,
    urgent: <Zap className="w-4 h-4" />
  };

  // Load tickets
  const loadTickets = async () => {
    try {
      const { data, error } = await supabase
        .from('tickets')
        .select('*')
        .eq('customer_id', customerId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setTickets(data || []);
    } catch (error) {
      console.error('Ticket yükleme hatası:', error);
    }
  };

  // Filter tickets based on search term
  useEffect(() => {
    if (!searchTerm.trim()) {
      setFilteredTickets(tickets);
    } else {
      const filtered = tickets.filter(ticket =>
        ticket.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        ticket.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
        priorityText[ticket.priority].toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredTickets(filtered);
    }
  }, [searchTerm, tickets]);

  // Load messages for current ticket
  const loadMessages = async (ticketId?: string) => {
    if (!ticketId) return;
    
    try {
      console.log('Loading messages for ticket:', ticketId);
      
      const { data, error } = await supabase
        .from('ticket_messages')
        .select('*')
        .eq('ticket_id', ticketId)
        .order('created_at', { ascending: true });

      if (error) throw error;

      console.log('Raw message data:', data);

      if (data && data.length > 0) {
        const messageData = data.map((msg: any) => ({
          id: msg.id,
          content: msg.message,
          senderId: msg.sender_id,
          senderName: msg.sender_name,
          senderType: msg.sender_type,
          timestamp: new Date(msg.created_at),
          attachments: msg.attachments || [],
          ticketId: msg.ticket_id
        }));

        console.log('Processed message data:', messageData);
        setMessages(messageData);
      } else {
        console.log('No messages found for ticket:', ticketId);
        setMessages([]);
      }
    } catch (error) {
      console.error('Mesaj yükleme hatası:', error);
      setMessages([]);
    }
  };

  // Load queue position - Sadece admin panelinden gelen sıralamayı kontrol et
  const loadQueuePosition = async () => {
    setIsLoadingQueue(true);
    try {
      // Müşterinin queue'da olup olmadığını kontrol et
      const { data: customerQueue, error: customerError } = await supabase
        .from('queue')
        .select('*')
        .eq('customer_id', customerId)
        .eq('status', 'waiting')
        .single();

      if (customerError && customerError.code !== 'PGRST116') throw customerError;

      if (customerQueue) {
        setIsInQueue(true);
        
        // Tüm waiting queue'yu admin panelinden gelen sıralamaya göre al
        const { data: allQueueData, error: queueError } = await supabase
          .from('queue')
          .select('id, customer_id, priority, created_at, queue_order')
          .eq('status', 'waiting')
          .order('queue_order', { ascending: true }); // Admin panelinden gelen sıralama

        if (queueError) throw queueError;

        if (allQueueData) {
          // Müşterinin pozisyonunu bul
          const position = allQueueData.findIndex(item => 
            item.customer_id === customerId
          ) + 1;

          // Tahmini bekleme süresini hesapla
          const estimatedWaitTime = calculateEstimatedWaitTime(customerQueue.priority, position, allQueueData.length);

          // Pozisyon değişikliğini kontrol et
          const currentPosition = queuePosition?.position;
          if (currentPosition && currentPosition !== position) {
            console.log(`Sıra pozisyonu değişti: ${currentPosition} -> ${position}`);
            toast.success(`Sıra pozisyonunuz güncellendi: ${position}. sıra`);
          }

          setQueuePosition({
            position,
            estimatedWaitTime,
            totalInQueue: allQueueData.length
          });
        }
      } else {
        // Müşteri artık queue'da değilse
        if (isInQueue) {
          setIsInQueue(false);
          setQueuePosition(null);
          toast.success('Sıranız geldi!');
        }
      }
    } catch (error) {
      console.error('Queue position yükleme hatası:', error);
    } finally {
      setIsLoadingQueue(false);
    }
  };

  // Load agents
  const loadAgents = async () => {
    try {
      const { data, error } = await supabase
        .from('agents')
        .select('*')
        .eq('status', 'online');

      if (error) throw error;
      setAgents(data || []);
    } catch (error) {
      console.error('Agent yükleme hatası:', error);
    }
  };



  // Create new ticket
  const createTicket = async () => {
    if (!ticketForm.title.trim()) {
      toast.error('Lütfen başlık girin');
      return;
    }

    try {
      const { data, error } = await supabase
        .from('tickets')
        .insert([{
          title: ticketForm.title,
          priority: ticketForm.priority,
          category: ticketForm.category,
          description: ticketForm.description,
          customer_id: customerId,
          status: 'open'
        }])
        .select()
        .single();

      if (error) throw error;

      setCurrentTicket(data);
      setShowTicketForm(false);
      setTicketForm({ title: '', priority: 'medium', category: 'general', description: '' });
      toast.success('Destek talebi oluşturuldu!');
      loadTickets();
    } catch (error) {
      console.error('Ticket oluşturma hatası:', error);
      toast.error('Destek talebi oluşturulamadı');
    }
  };

  // Send message
  const sendMessage = async () => {
    if (!newMessage.trim() && attachments.length === 0) return;
    if (!currentTicket) {
      toast.error('Lütfen önce bir destek talebi seçin');
      return;
    }

    try {
      const messageData = {
        message: newMessage,
        sender_id: customerId,
        sender_name: customerName,
        sender_type: 'customer',
        ticket_id: currentTicket.id,
        attachments: attachments.map(file => file.name),
        // Alıntı özelliği
        ...(replyingTo && {
          reply_to: {
            message_id: replyingTo.id,
            sender_name: replyingTo.senderName,
            message: replyingTo.content
          }
        })
      };

      const { error } = await supabase
        .from('ticket_messages')
        .insert([messageData]);

      if (error) throw error;

      setNewMessage('');
      setAttachments([]);
      setCharacterCount(0);
      
      // Alıntıyı temizle
      if (replyingTo) {
        setReplyingTo(null);
      }

    } catch (error) {
      console.error('Mesaj gönderme hatası:', error);
      toast.error('Mesaj gönderilemedi');
    }
  };

  // Alıntı fonksiyonları
  const handleReplyToMessage = (message: Message) => {
    setReplyingTo(message);
  };

  const cancelReply = () => {
    setReplyingTo(null);
    setReplyContent('');
  };

  // File handling
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    setAttachments(prev => [...prev, ...files]);
  };

  const removeAttachment = (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  // Rich editor functions
  const formatText = (command: string, value?: string) => {
    document.execCommand(command, false, value);
    editorRef.current?.focus();
  };

  const handleEditorChange = (e: React.FormEvent<HTMLDivElement>) => {
    const content = e.currentTarget.innerText;
    setNewMessage(content);
    setCharacterCount(content.length);
  };

  // Calculate estimated wait time
  const calculateEstimatedWaitTime = (priority: string, position: number, totalInQueue: number) => {
    const baseTimePerPerson = 5; // 5 dakika kişi başına
    const baseTime = position * baseTimePerPerson;
    
    switch (priority) {
      case 'urgent':
        return Math.max(1, Math.floor(baseTime * 0.3));
      case 'high':
        return Math.max(2, Math.floor(baseTime * 0.5));
      case 'medium':
        return Math.max(3, Math.floor(baseTime * 0.8));
      case 'low':
        return Math.max(5, Math.floor(baseTime * 1.2));
      default:
        return baseTime;
    }
  };

  // Real-time subscriptions
  useEffect(() => {
    loadTickets();
    loadQueuePosition();
    loadAgents();

    // Sıra pozisyonunu her 30 saniyede bir güncelle
    const queueInterval = setInterval(() => {
      if (isInQueue) {
        loadQueuePosition();
      }
    }, 30000); // 30 saniye

    const ticketsSubscription = supabase
      .channel('customer_tickets')
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'tickets',
          filter: `customer_id=eq.${customerId}`
        }, 
        (payload: any) => {
          loadTickets();
          
          if (payload.eventType === 'UPDATE' && 
              payload.new.id === currentTicket?.id) {
            setCurrentTicket(payload.new);
          }
        }
      )
      .subscribe();

    const queueSubscription = supabase
      .channel('customer_queue')
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'queue'
        }, 
        (payload: any) => {
          // Queue'da herhangi bir değişiklik olduğunda anında pozisyonu güncelle
          console.log('Queue değişikliği algılandı:', payload);
          loadQueuePosition();
        }
      )
      .subscribe();

    return () => {
      clearInterval(queueInterval);
      supabase.removeChannel(ticketsSubscription);
      supabase.removeChannel(queueSubscription);
    };
  }, [customerId, isInQueue]);

  useEffect(() => {
    if (currentTicket) {
      loadMessages(currentTicket.id);
      setIsConnected(true);
    } else {
      setMessages([]);
      setIsConnected(false);
    }
  }, [currentTicket]);

  // Messages subscription
  useEffect(() => {
    if (!currentTicket) return;

    const messagesSubscription = supabase
      .channel('ticket_messages')
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'ticket_messages',
          filter: `ticket_id=eq.${currentTicket.id}`
        }, 
        (payload: any) => {
          if (payload.eventType === 'INSERT') {
            const newMsg = {
              id: payload.new.id,
              content: payload.new.message,
              senderId: payload.new.sender_id,
              senderName: payload.new.sender_name,
              senderType: payload.new.sender_type,
              timestamp: new Date(payload.new.created_at),
              attachments: payload.new.attachments || [],
              ticketId: payload.new.ticket_id
            };
            setMessages(prev => [...prev, newMsg]);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(messagesSubscription);
    };
  }, [currentTicket]);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  return (
    <div className={`bg-white dark:bg-gray-800 rounded-lg shadow-lg h-full flex ${className}`}>
      <div className="w-96 bg-red-50 dark:bg-red-900/20 border-r border-red-200 dark:border-red-800 flex flex-col">
        <div className="p-4 border-b border-red-200 dark:border-red-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center">
              <MessageSquare className="w-5 h-5 text-red-600 dark:text-red-400" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white">
                Canlı Destek
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {currentTicket ? `Talep: ${currentTicket.title}` : 'Destek talebi seçin'}
              </p>
            </div>
          </div>
        </div>

        {/* Queue Status */}
        {isInQueue && queuePosition && (
          <div className="p-4 border-b border-red-200 dark:border-red-800 bg-red-100 dark:bg-red-900/30">
            <div className="text-center">
              <div className="flex items-center justify-center gap-2 mb-2">
                <Clock className="w-5 h-5 text-red-600 dark:text-red-400" />
                <span className="font-semibold text-red-800 dark:text-red-200">
                  Sıra Pozisyonu: {queuePosition.position}
                </span>
              </div>
                             <p className="text-sm text-red-700 dark:text-red-300 mb-3">
                 Tahmini bekleme süresi: {calculateEstimatedWaitTime(ticketForm.priority, queuePosition.position, queuePosition.totalInQueue)} dakika
               </p>
                             <div className="flex gap-2">
                 <button
                   onClick={loadQueuePosition}
                   disabled={isLoadingQueue}
                   className="px-3 py-1 border border-red-300 text-red-700 rounded text-sm hover:bg-red-50 transition-colors disabled:opacity-50"
                   title="Sıra pozisyonunu güncelle"
                 >
                   <RefreshCw className={`w-4 h-4 ${isLoadingQueue ? 'animate-spin' : ''}`} />
                 </button>
               </div>
            </div>
          </div>
        )}

        {/* Priority Wizard */}
        {!isInQueue && !currentTicket && (
          <div className="p-4 border-b border-red-200 dark:border-red-800">
            <h4 className="font-medium text-gray-900 dark:text-white mb-3">Öncelik Seçin</h4>
            <div className="space-y-2">
              {Object.entries(priorityText).map(([key, text]) => (
                <button
                  key={key}
                  onClick={() => setTicketForm({ ...ticketForm, priority: key as any })}
                  className={`w-full p-3 rounded border transition-colors ${
                    ticketForm.priority === key
                      ? 'bg-red-100 dark:bg-red-900/30 border-red-300 dark:border-red-700'
                      : 'bg-white dark:bg-gray-700 border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded ${priorityColors[key as keyof typeof priorityColors]}`}>
                      {priorityIcons[key as keyof typeof priorityIcons]}
                    </div>
                    <div className="text-left">
                      <div className="font-medium text-gray-900 dark:text-white">{text}</div>
                      <div className="text-xs text-gray-600 dark:text-gray-400">
                        {key === 'urgent' && 'Acil durumlar için'}
                        {key === 'high' && 'Önemli sorunlar için'}
                        {key === 'medium' && 'Genel sorular için'}
                        {key === 'low' && 'Bilgi talepleri için'}
                      </div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}
        
        <div className="p-4 flex-1">
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-medium text-gray-900 dark:text-white">Destek Talepleri</h4>
            <button
              onClick={() => setShowTicketForm(true)}
              className="px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700 transition-colors"
            >
              <Plus className="w-4 h-4 inline mr-1" />
              Yeni Talep
            </button>
          </div>

          {/* Arama Alanı */}
          <div className="relative mb-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Destek taleplerinde ara..."
                className="w-full pl-10 pr-12 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
              />
              <div className="absolute right-1.5 top-1/2 transform -translate-y-1/2">
                <VoiceSearch
                  onTranscript={(text) => setSearchTerm(text)}
                  className=""
                />
              </div>
            </div>
          </div>
          
          <div className="space-y-2 flex-1 overflow-y-auto">
            {filteredTickets.length === 0 ? (
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {searchTerm ? 'Arama sonucu bulunamadı' : 'Henüz destek talebiniz yok'}
              </p>
            ) : (
              filteredTickets.map((ticket) => (
                <div
                  key={ticket.id}
                  onClick={() => setCurrentTicket(ticket)}
                  className={`p-3 rounded border cursor-pointer transition-colors ${
                    currentTicket?.id === ticket.id
                      ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
                      : 'bg-white dark:bg-gray-700 border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <h5 className="font-medium text-gray-900 dark:text-white text-sm truncate">
                        {ticket.title}
                      </h5>
                      <p className="text-xs text-gray-600 dark:text-gray-400">
                        {format(new Date(ticket.created_at), 'dd MMM HH:mm', { locale: tr })}
                      </p>
                    </div>
                    <span className={`px-2 py-1 rounded text-xs font-medium ${priorityColors[ticket.priority]}`}>
                      {priorityText[ticket.priority]}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      <div className="flex-1 bg-yellow-50 dark:bg-yellow-900/20 flex flex-col">
        <div className="p-4 border-b border-yellow-200 dark:border-yellow-800">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-yellow-100 dark:bg-yellow-900/20 rounded-full flex items-center justify-center">
                <MessageSquare className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white">
                  Chat Alanı
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {currentTicket ? `Talep: ${currentTicket.title}` : 'Destek talebi seçin'}
                </p>
              </div>
            </div>
            
                         <div className="flex items-center gap-2">
               {/* Sıra Pozisyonu - Her zaman göster */}
               <div className="flex items-center gap-2 px-3 py-2 bg-yellow-200 dark:bg-yellow-800/50 rounded-lg border-2 border-yellow-300 dark:border-yellow-600 shadow-md">
                 <Clock className="w-4 h-4 text-yellow-700 dark:text-yellow-300" />
                 {isInQueue && queuePosition ? (
                   <>
                     <span className="text-sm font-bold text-yellow-800 dark:text-yellow-200">
                       {queuePosition.position}. SIRA
                     </span>
                     <span className="text-xs text-yellow-700 dark:text-yellow-300 bg-yellow-100 dark:bg-yellow-900/30 px-2 py-1 rounded">
                       {queuePosition.totalInQueue} kişi
                     </span>
                     <div className="w-2 h-2 bg-yellow-500 rounded-full animate-bounce"></div>
                   </>
                                   ) : (
                    <>
                      <span className="text-sm font-bold text-yellow-800 dark:text-yellow-200">
                        SIRA BEKLENİYOR
                      </span>
                      <span className="text-xs text-yellow-700 dark:text-yellow-300 bg-yellow-100 dark:bg-yellow-900/30 px-2 py-1 rounded">
                        {queuePosition?.totalInQueue || 0} kişi
                      </span>
                    </>
                  )}
               </div>
               
               {currentTicket && (
                 <span className={`px-2 py-1 rounded text-xs font-medium ${priorityColors[currentTicket.priority]}`}>
                   {priorityText[currentTicket.priority]}
                 </span>
               )}
               
               <div className="w-2 h-2 bg-green-500 rounded-full"></div>
               <span className="text-sm text-green-600 dark:text-green-400">Online</span>
             </div>
          </div>
        </div>

        {/* New Ticket Form */}
        {showTicketForm && (
          <div className="p-4 border-b border-yellow-200 dark:border-yellow-800 bg-yellow-100 dark:bg-yellow-900/20">
            <h4 className="font-medium text-gray-900 dark:text-white mb-3">Yeni Destek Talebi</h4>
            <div className="space-y-3">
              <input
                type="text"
                value={ticketForm.title}
                onChange={(e) => setTicketForm({ ...ticketForm, title: e.target.value })}
                placeholder="Talep başlığı..."
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded text-sm focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              />
              
              <div className="grid grid-cols-2 gap-2">
                <select
                  value={ticketForm.priority}
                  onChange={(e) => setTicketForm({ ...ticketForm, priority: e.target.value as any })}
                  className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded text-sm focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                >
                  <option value="low">Düşük Öncelik</option>
                  <option value="medium">Orta Öncelik</option>
                  <option value="high">Yüksek Öncelik</option>
                  <option value="urgent">Acil</option>
                </select>
                
                <select
                  value={ticketForm.category}
                  onChange={(e) => setTicketForm({ ...ticketForm, category: e.target.value })}
                  className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded text-sm focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                >
                  <option value="general">Genel</option>
                  <option value="technical">Teknik</option>
                  <option value="billing">Faturalama</option>
                  <option value="support">Destek</option>
                </select>
              </div>
              
              <textarea
                value={ticketForm.description}
                onChange={(e) => setTicketForm({ ...ticketForm, description: e.target.value })}
                placeholder="Sorununuzu açıklayın..."
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded text-sm focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white resize-none"
              />
              
              <div className="flex gap-2">
                <button
                  onClick={createTicket}
                  className="px-4 py-2 bg-yellow-600 text-white rounded text-sm hover:bg-yellow-700 transition-colors"
                >
                  Talep Oluştur
                </button>
                <button
                  onClick={() => setShowTicketForm(false)}
                  className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded text-sm hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
                >
                  İptal
                </button>
              </div>
            </div>
          </div>
        )}

        

                 <div className="flex-1 flex flex-col">
           <div className="flex-1 overflow-y-auto p-6 space-y-4">
             {(() => {
               console.log('Current messages state:', messages);
               console.log('Messages length:', messages.length);
               console.log('Current ticket:', currentTicket);
               return null;
             })()}
             
             {messages.length === 0 ? (
               <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                 <MessageSquare className="w-16 h-16 mx-auto mb-4 opacity-50" />
                 <p className="text-lg mb-2">Henüz mesaj yok</p>
                 <p className="text-sm mb-6">Destek talebi seçerek mesajlaşmaya başlayın</p>
                 
                 
               </div>
             ) : (
              messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.senderType === 'customer' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg group ${
                      message.senderType === 'customer'
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white'
                    }`}
                  >
                    {/* Alıntı Mesajı */}
                    {message.replyTo && (
                      <div className="mb-2 p-2 bg-gray-200 dark:bg-gray-600 rounded border-l-4 border-blue-500">
                        <div className="flex items-center space-x-2 mb-1">
                          <svg className="w-3 h-3 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
                          </svg>
                          <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
                            {message.replyTo.senderName}
                          </span>
                        </div>
                        <p className="text-xs text-gray-600 dark:text-gray-400 line-clamp-2">
                          {message.replyTo.content.length > 80 
                            ? `${message.replyTo.content.substring(0, 80)}...` 
                            : message.replyTo.content
                          }
                        </p>
                      </div>
                    )}
                    
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-medium text-gray-900 dark:text-white">
                          {message.senderType === 'customer' ? 'Siz' : message.senderName}
                        </span>
                        <span className="text-xs opacity-70 text-gray-600 dark:text-gray-300">
                          {format(message.timestamp, 'HH:mm', { locale: tr })}
                        </span>
                        {message.senderType === 'customer' && (
                          <div className="flex items-center gap-1">
                            <CheckCircle className="w-3 h-3" />
                            <CheckCircle className="w-3 h-3" />
                          </div>
                        )}
                      </div>
                      {/* Yanıtla Butonu */}
                      <button
                        onClick={() => handleReplyToMessage(message)}
                        className="p-1 text-gray-400 hover:text-gray-600 dark:text-gray-300 dark:hover:text-gray-100 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                        title="Yanıtla"
                      >
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
                        </svg>
                      </button>
                    </div>
                    
                    <div 
                      className="text-sm"
                      dangerouslySetInnerHTML={{ __html: message.content }}
                    />
                    
                    {message.attachments && message.attachments.length > 0 && (
                      <div className="mt-2 space-y-1">
                        {message.attachments.map((attachment, index) => (
                          <div key={index} className="flex items-center gap-2 text-xs opacity-70">
                            <File className="w-3 h-3" />
                            <span>{attachment}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Message Input */}
          {currentTicket && (
            <div className="p-6 border-t border-gray-200 dark:border-gray-700">
              {/* Alıntı Göstergesi */}
              {replyingTo && (
                <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <svg className="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
                      </svg>
                      <span className="text-sm font-medium text-blue-700 dark:text-blue-300">
                        {replyingTo.senderName} mesajına yanıt veriyorsunuz
                      </span>
                    </div>
                    <button
                      onClick={cancelReply}
                      className="text-blue-500 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-200"
                      title="Yanıtlamayı iptal et"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                  <p className="mt-1 text-sm text-blue-600 dark:text-blue-400 line-clamp-2">
                    {replyingTo.content.length > 100 
                      ? `${replyingTo.content.substring(0, 100)}...` 
                      : replyingTo.content
                    }
                  </p>
                </div>
              )}
              
              {/* Rich Editor Toolbar */}
              {isRichEditor && (
                <div className="mb-3 p-2 bg-gray-50 dark:bg-gray-700 rounded border">
                  <div className="flex flex-wrap gap-1 mb-2">
                                         {/* Text Formatting */}
                     <button onClick={() => formatText('bold')} className="p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-gray-100">
                       <Bold className="w-4 h-4" />
                     </button>
                     <button onClick={() => formatText('italic')} className="p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-gray-100">
                       <Italic className="w-4 h-4" />
                     </button>
                     <button onClick={() => formatText('underline')} className="p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-gray-100">
                       <Underline className="w-4 h-4" />
                     </button>
                     <button onClick={() => formatText('strikeThrough')} className="p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-gray-100">
                       <Strikethrough className="w-4 h-4" />
                     </button>
                    
                    <div className="w-px h-6 bg-gray-300 dark:bg-gray-600 mx-1"></div>
                    
                                         {/* Alignment */}
                     <button onClick={() => formatText('justifyLeft')} className="p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-gray-100">
                       <AlignLeft className="w-4 h-4" />
                     </button>
                     <button onClick={() => formatText('justifyCenter')} className="p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-gray-100">
                       <AlignCenter className="w-4 h-4" />
                     </button>
                     <button onClick={() => formatText('justifyRight')} className="p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-gray-100">
                       <AlignRight className="w-4 h-4" />
                     </button>
                     <button onClick={() => formatText('justifyFull')} className="p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-gray-100">
                       <AlignJustify className="w-4 h-4" />
                     </button>
                    
                    <div className="w-px h-6 bg-gray-300 dark:bg-gray-600 mx-1"></div>
                    
                                         {/* Lists */}
                     <button onClick={() => formatText('insertUnorderedList')} className="p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-gray-100">
                       <List className="w-4 h-4" />
                     </button>
                     <button onClick={() => formatText('insertOrderedList')} className="p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-gray-100">
                       <ListOrdered className="w-4 h-4" />
                     </button>
                    
                    <div className="w-px h-6 bg-gray-300 dark:bg-gray-600 mx-1"></div>
                    
                                         {/* Special */}
                     <button onClick={() => formatText('formatBlock', '<blockquote>')} className="p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-gray-100">
                       <Quote className="w-4 h-4" />
                     </button>
                     <button onClick={() => formatText('formatBlock', '<pre>')} className="p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-gray-100">
                       <Code className="w-4 h-4" />
                     </button>
                     <button onClick={() => formatText('foreColor')} className="p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-gray-100">
                       <Palette className="w-4 h-4" />
                     </button>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {characterCount} / {maxCharacters} karakter
                    </span>
                                         <div className="flex gap-1">
                       <button onClick={() => formatText('undo')} className="p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-gray-100">
                         <Undo className="w-4 h-4" />
                       </button>
                       <button onClick={() => formatText('redo')} className="p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-gray-100">
                         <Redo className="w-4 h-4" />
                       </button>
                       <button onClick={() => formatText('removeFormat')} className="p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-gray-100">
                         <X className="w-4 h-4" />
                       </button>
                     </div>
                  </div>
                </div>
              )}

                             {/* Attachments */}
               {attachments.length > 0 && (
                 <div className="mb-3 flex flex-wrap gap-2">
                   {attachments.map((file, index) => (
                     <div key={index} className="flex items-center gap-1 px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded text-xs border border-gray-200 dark:border-gray-600">
                       <File className="w-3 h-3 text-gray-600 dark:text-gray-300" />
                       <span className="truncate max-w-20 text-gray-700 dark:text-gray-300">{file.name}</span>
                       <button
                         onClick={() => removeAttachment(index)}
                         className="text-red-500 hover:text-red-700 dark:hover:text-red-400"
                       >
                         <X className="w-3 h-3" />
                       </button>
                     </div>
                   ))}
                 </div>
               )}
              
                             <div className="flex items-end gap-2">
                 <div className="flex-1">
                   {isRichEditor ? (
                    <div
                      ref={editorRef}
                      contentEditable
                      onInput={handleEditorChange}
                      className="min-h-[80px] max-h-48 overflow-y-auto px-3 py-3 border border-gray-300 dark:border-gray-600 rounded text-sm focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                      data-placeholder="Mesajınızı yazın..."
                    />
                  ) : (
                    <textarea
                      value={newMessage}
                      onChange={(e) => {
                        setNewMessage(e.target.value);
                        setCharacterCount(e.target.value.length);
                      }}
                      onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && sendMessage()}
                      placeholder="Mesajınızı yazın..."
                      rows={4}
                      className="w-full px-3 py-3 border border-gray-300 dark:border-gray-600 rounded text-sm focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white resize-none"
                    />
                  )}
                </div>
                
                                 <div className="flex flex-col gap-1">
                   {/* Sesli Mesaj Bileşeni */}
                   <VoiceMessage
                     onSendMessage={(text) => {
                       setNewMessage(text);
                       // Sesli mesaj gönderildikten sonra otomatik olarak gönder
                       setTimeout(() => {
                         if (attachments.length > 0) {
                           sendMessage();
                         } else {
                           sendMessage();
                         }
                       }, 100);
                     }}
                     className=""
                   />
                   
                   <button
                     onClick={() => setIsRichEditor(!isRichEditor)}
                     className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                     title={isRichEditor ? 'Basit Editör' : 'Zengin Editör'}
                   >
                     <FileText className="w-4 h-4" />
                   </button>
                   
                   <button
                     onClick={() => fileInputRef.current?.click()}
                     className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                     title="Dosya ekle"
                   >
                     <Paperclip className="w-4 h-4" />
                   </button>
                   
                   <input
                     ref={fileInputRef}
                     type="file"
                     multiple
                     onChange={handleFileUpload}
                     className="hidden"
                   />
                   
                   <button
                     onClick={sendMessage}
                     disabled={!newMessage.trim() && attachments.length === 0}
                     className="p-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors disabled:opacity-50"
                     title="Gönder"
                   >
                     <Send className="w-4 h-4" />
                   </button>
                 </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CustomerLiveChat;
