import React, { useState, useEffect, useRef } from 'react';
import {
  Send,
  Users,
  MessageSquare,
  Clock,
  CheckCircle,
  AlertCircle,
  RefreshCw,
  Bell,
  X,
  Settings,
  Info,
  FileText,
  Smile,
  Paperclip,
  Mic,
  Image,
  File,
  Bold,
  Italic,
  Underline,
  List,
  ListOrdered,
  Quote,
  Code,
  Link,
  Table,
  Eye,
  Shield,
  Zap,
  Star,
  TrendingUp,
  AlertTriangle,
  Calendar,
  Target,
  Activity,
  UserPlus,
  Video,
  Phone,
  MoreHorizontal,
  Pin,
  Archive,
  Trash2,
  Edit,
  Copy,
  Download,
  Plus,
  Hash,
  Lock,
  Globe,
  Search,
  Filter
} from 'lucide-react';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';
import { toast } from 'react-hot-toast';
import { useSupabase } from '../hooks/useSupabase';

interface ChatMessage {
  id: string;
  content: string;
  senderId: string;
  senderName: string;
  senderRole: string;
  senderAvatar: string;
  channelId: string;
  messageType: 'text' | 'file' | 'image' | 'system' | 'announcement';
  attachments?: string[];
  timestamp: Date;
  isPinned?: boolean;
  isEdited?: boolean;
  editedAt?: Date;
  reactions?: { [key: string]: string[] }; // emoji: [userId1, userId2]
  mentions?: string[];
  isDirectMessage?: boolean;
  recipientId?: string;
}

interface Employee {
  id: string;
  name: string;
  role: string;
  department: string;
  avatar: string;
  status: 'online' | 'away' | 'busy' | 'offline';
  lastSeen: Date;
  isTyping: boolean;
  availability: 'available' | 'busy' | 'do_not_disturb';
}

interface ChatChannel {
  id: string;
  name: string;
  description: string;
  type: 'public' | 'private' | 'direct';
  members: string[];
  isPinned?: boolean;
  unreadCount: number;
  lastMessage?: string;
  lastMessageTime?: Date;
}

interface EmployeeChatProps {
  currentUserId: string;
  currentUserName: string;
  currentUserRole: string;
  currentUserDepartment: string;
  className?: string;
  onNotification?: (notification: any) => void; // Dashboard bildirimleri için callback
  initialChannelId?: string; // Başlangıçta seçilecek kanal ID'si
}

const EmployeeChat: React.FC<EmployeeChatProps> = ({
  currentUserId,
  currentUserName,
  currentUserRole,
  currentUserDepartment,
  className = '',
  onNotification,
  initialChannelId
}) => {
  const { supabase } = useSupabase();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const editorRef = useRef<HTMLDivElement>(null);

  // Chat state
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [attachments, setAttachments] = useState<File[]>([]);
  const [filePreview, setFilePreview] = useState<{ file: File; preview: string } | null>(null);
  const [uploadProgress, setUploadProgress] = useState<{ [key: string]: number }>({});
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [emojiPickerPosition, setEmojiPickerPosition] = useState({ x: 0, y: 0 });
  const [selectedMessageForReaction, setSelectedMessageForReaction] = useState<string | null>(null);

  // Channel state
  const [channels, setChannels] = useState<ChatChannel[]>([]);
  const [selectedChannel, setSelectedChannel] = useState<ChatChannel | null>(null);
  const [showChannelList, setShowChannelList] = useState(true);
  const [showCreateChannel, setShowCreateChannel] = useState(false);
  const [newChannelName, setNewChannelName] = useState('');
  const [newChannelDescription, setNewChannelDescription] = useState('');
  const [newChannelType, setNewChannelType] = useState<'public' | 'private'>('public');

  // Employee state
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [onlineEmployees, setOnlineEmployees] = useState<Employee[]>([]);
  const [typingEmployees, setTypingEmployees] = useState<string[]>([]);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);

  // UI state
  const [activeView, setActiveView] = useState<'channels' | 'direct' | 'search'>('channels');
  const [searchTerm, setSearchTerm] = useState('');
  const [showAdvancedSearch, setShowAdvancedSearch] = useState(false);
  const [searchFilters, setSearchFilters] = useState({
    sender: '',
    dateFrom: '',
    dateTo: '',
    messageType: 'all',
    channel: 'all'
  });
  const [searchResults, setSearchResults] = useState<ChatMessage[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  const [showMemberList, setShowMemberList] = useState(true);
  const [selectedMessage, setSelectedMessage] = useState<ChatMessage | null>(null);
  const [showMessageActions, setShowMessageActions] = useState(false);
  const [editingMessage, setEditingMessage] = useState<string | null>(null);
  const [editMessageContent, setEditMessageContent] = useState('');
  const [pinnedMessages, setPinnedMessages] = useState<ChatMessage[]>([]);
  const [showPinnedMessages, setShowPinnedMessages] = useState(false);
  const [viewMode, setViewMode] = useState<'standard'>('standard');
  const [messageCategories, setMessageCategories] = useState<{
    [key: string]: 'announcement' | 'question' | 'suggestion' | 'general'
  }>({});
  const [favoriteMessages, setFavoriteMessages] = useState<string[]>([]);
  const [showFavorites, setShowFavorites] = useState(false);
  const [favoriteEmployees, setFavoriteEmployees] = useState<string[]>([]);
  const [showChannelSettings, setShowChannelSettings] = useState(false);
  const [channelMembers, setChannelMembers] = useState<{ [key: string]: Employee[] }>({});
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [channelStats, setChannelStats] = useState<{ [key: string]: { messageCount: number; memberCount: number; lastActivity: Date } }>({});
  const [blockedUsers, setBlockedUsers] = useState<string[]>([]);
  const [showPrivacySettings, setShowPrivacySettings] = useState(false);
  const [privacySettings, setPrivacySettings] = useState({
    showOnlineStatus: true,
    allowDirectMessages: true,
    allowMentions: true,
    messageHistory: '30days' as '7days' | '30days' | '90days' | 'forever'
  });
  const [showIntegrations, setShowIntegrations] = useState(false);
  const [integrations, setIntegrations] = useState({
    calendar: false,
    tasks: false,
    drive: false
  });
  const [meetingReminders, setMeetingReminders] = useState<Array<{
    id: string;
    title: string;
    time: Date;
    participants: string[];
  }>>([]);
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [analyticsData, setAnalyticsData] = useState({
    totalMessages: 0,
    activeUsers: 0,
    popularChannels: [] as Array<{ name: string; messageCount: number }>,
    messageTrends: [] as Array<{ date: string; count: number }>,
    topUsers: [] as Array<{ name: string; messageCount: number }>
  });
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [draftMessages, setDraftMessages] = useState<{ [key: string]: string }>({});
  const [keyboardShortcuts, setKeyboardShortcuts] = useState({
    sendMessage: 'Enter',
    newLine: 'Shift+Enter',
    search: 'Ctrl+K',
    emoji: 'Ctrl+E'
  });
  const [showPolls, setShowPolls] = useState(false);
  const [polls, setPolls] = useState<Array<{
    id: string;
    question: string;
    options: Array<{ text: string; votes: number; voters: string[] }>;
    createdBy: string;
    createdAt: Date;
    isActive: boolean;
  }>>([]);
  const [messageTemplates, setMessageTemplates] = useState<Array<{
    id: string;
    title: string;
    content: string;
    category: string;
  }>>([
    { id: '1', title: 'Merhaba', content: 'Merhaba! Nasılsınız?', category: 'genel' },
    { id: '2', title: 'Toplantı Hatırlatması', content: 'Yarın saat 14:00\'da toplantımız var.', category: 'toplantı' },
    { id: '3', title: 'Teşekkür', content: 'Teşekkür ederim!', category: 'genel' }
  ]);
  const [showTemplates, setShowTemplates] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [unreadNotifications, setUnreadNotifications] = useState(0);

  // 3 noktalı menü state'leri
  const [showEmployeeMenu, setShowEmployeeMenu] = useState<string | null>(null);
  const [employeeMenuPosition, setEmployeeMenuPosition] = useState({ x: 0, y: 0 });

  // Rich editor state
  const [isRichEditor, setIsRichEditor] = useState(false);
  const [characterCount, setCharacterCount] = useState(0);
  const maxCharacters = 2000;

  // Mention system state
  const [showMentionSuggestions, setShowMentionSuggestions] = useState(false);
  const [mentionQuery, setMentionQuery] = useState('');
  const [mentionPosition, setMentionPosition] = useState({ start: 0, end: 0 });
  const [filteredEmployees, setFilteredEmployees] = useState<Employee[]>([]);

  // Bildirim verilerini yükle
  const loadNotifications = async () => {
    try {
      const { data: notifications, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', currentUserId)
        .eq('read', false)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Bildirimler yüklenirken hata:', error);
        return;
      }

      setUnreadNotifications(notifications?.length || 0);
    } catch (error) {
      console.error('Bildirimler yüklenirken hata:', error);
    }
  };

  // Mock data for demonstration
  const mockEmployees: Employee[] = [
    {
      id: '1',
      name: 'Ahmet Yılmaz',
      role: 'İK Müdürü',
      department: 'İnsan Kaynakları',
      avatar: 'AY',
      status: 'online',
      lastSeen: new Date(),
      isTyping: false,
      availability: 'available'
    },
    {
      id: '2',
      name: 'Fatma Demir',
      role: 'Muhasebe Uzmanı',
      department: 'Muhasebe',
      avatar: 'FD',
      status: 'busy',
      lastSeen: new Date(Date.now() - 5 * 60 * 1000),
      isTyping: true,
      availability: 'busy'
    },
    {
      id: '3',
      name: 'Mehmet Kaya',
      role: 'Yazılım Geliştirici',
      department: 'Teknoloji',
      avatar: 'MK',
      status: 'online',
      lastSeen: new Date(),
      isTyping: false,
      availability: 'available'
    },
    {
      id: '4',
      name: 'Ayşe Özkan',
      role: 'Satış Temsilcisi',
      department: 'Satış',
      avatar: 'AÖ',
      status: 'away',
      lastSeen: new Date(Date.now() - 15 * 60 * 1000),
      isTyping: false,
      availability: 'available'
    }
  ];

  const mockChannels: ChatChannel[] = [
    {
      id: 'general',
      name: 'genel',
      description: 'Tüm şirket duyuruları ve genel konular',
      type: 'public',
      members: ['1', '2', '3', '4'],
      isPinned: true,
      unreadCount: 0,
      lastMessage: 'Merhaba herkese!',
      lastMessageTime: new Date(Date.now() - 30 * 60 * 1000)
    },
    {
      id: 'hr',
      name: 'ik',
      description: 'İnsan Kaynakları departmanı',
      type: 'public',
      members: ['1', '2'],
      unreadCount: 2,
      lastMessage: 'Yeni çalışan oryantasyonu hakkında',
      lastMessageTime: new Date(Date.now() - 10 * 60 * 1000)
    },
    {
      id: 'tech',
      name: 'teknoloji',
      description: 'Teknoloji departmanı',
      type: 'public',
      members: ['3'],
      unreadCount: 0,
      lastMessage: 'Sistem güncellemesi tamamlandı',
      lastMessageTime: new Date(Date.now() - 45 * 60 * 1000)
    },
    {
      id: 'sales',
      name: 'satış',
      description: 'Satış departmanı',
      type: 'public',
      members: ['4'],
      unreadCount: 1,
      lastMessage: 'Bu ayki hedeflerimiz',
      lastMessageTime: new Date(Date.now() - 20 * 60 * 1000)
    },
    // Proje kanalları
    {
      id: '1',
      name: 'e-ticaret-platformu',
      description: 'E-ticaret Platformu Geliştirme projesi',
      type: 'public',
      members: ['1', '2', '3', '4'],
      unreadCount: 0,
      lastMessage: 'Proje durumu güncellemesi',
      lastMessageTime: new Date(Date.now() - 15 * 60 * 1000)
    },
    {
      id: '2',
      name: 'mobil-uygulama',
      description: 'Mobil Uygulama Geliştirme projesi',
      type: 'public',
      members: ['1', '2', '3'],
      unreadCount: 1,
      lastMessage: 'React Native kurulumu tamamlandı',
      lastMessageTime: new Date(Date.now() - 5 * 60 * 1000)
    },
    {
      id: '3',
      name: 'crm-entegrasyonu',
      description: 'CRM Sistemi Entegrasyonu projesi',
      type: 'public',
      members: ['1', '3', '4'],
      unreadCount: 0,
      lastMessage: 'API entegrasyonu test edildi',
      lastMessageTime: new Date(Date.now() - 25 * 60 * 1000)
    },
    {
      id: '4',
      name: 'web-sitesi-yenileme',
      description: 'Web Sitesi Yenileme projesi',
      type: 'public',
      members: ['2', '4'],
      unreadCount: 0,
      lastMessage: 'Proje tamamlandı!',
      lastMessageTime: new Date(Date.now() - 2 * 60 * 60 * 1000)
    }
  ];

  useEffect(() => {
    loadEmployeeData();
    loadChannelData();
    loadNotifications();
    setupRealtimeSubscriptions();
    setSelectedChannel(mockChannels[0]); // Genel kanalı varsayılan olarak seç
  }, []);

  // Kanal veya çalışan seçildiğinde mesajları yükle
  useEffect(() => {
    if (selectedChannel) {
      loadMessages(selectedChannel.id);
    } else if (selectedEmployee) {
      loadMessages(undefined, selectedEmployee.id);
    }
  }, [selectedChannel, selectedEmployee]);

  // initialChannelId prop'u varsa o kanalı seç
  useEffect(() => {
    if (initialChannelId && channels.length > 0) {
      const targetChannel = channels.find(channel => channel.id === initialChannelId);
      if (targetChannel) {
        setSelectedChannel(targetChannel);
      }
    }
  }, [initialChannelId, channels]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Emoji picker'ı dışarı tıklandığında kapat
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (showEmojiPicker) {
        const target = event.target as HTMLElement;
        if (!target.closest('.emoji-picker')) {
          setShowEmojiPicker(false);
          setSelectedMessageForReaction(null);
        }
      }
      
      if (showEmployeeMenu) {
        const target = event.target as HTMLElement;
        if (!target.closest('.employee-menu')) {
          closeEmployeeMenu();
        }
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (showEmojiPicker && event.key === 'Escape') {
        setShowEmojiPicker(false);
        setSelectedMessageForReaction(null);
      }
      
      if (showEmployeeMenu && event.key === 'Escape') {
        closeEmployeeMenu();
      }
    };

    if (showEmojiPicker || showEmployeeMenu) {
      document.addEventListener('click', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
      return () => {
        document.removeEventListener('click', handleClickOutside);
        document.removeEventListener('keydown', handleKeyDown);
      };
    }
  }, [showEmojiPicker, showEmployeeMenu]);

  const loadEmployeeData = async () => {
    try {
      // Gerçek veritabanından çalışanları yükle
      const { data: employeesData, error } = await supabase
        .from('employees')
        .select('id, name, position, department, status')
        .eq('status', 'active')
        .order('name');

      if (error) {
        console.error('Çalışan verisi yükleme hatası:', error);
        toast.error('Çalışan verisi yüklenirken hata oluştu');
        // Hata durumunda mock data kullan
        setEmployees(mockEmployees);
        setOnlineEmployees(mockEmployees.filter(emp => emp.status === 'online'));
        return;
      }

      if (employeesData && employeesData.length > 0) {
        const formattedEmployees: Employee[] = employeesData.map(emp => ({
          id: emp.id,
          name: emp.name,
          role: emp.position,
          department: emp.department,
          avatar: emp.name.split(' ').map((n: string) => n[0]).join(''),
          status: 'online' as const, // Varsayılan olarak online
          lastSeen: new Date(),
          isTyping: false,
          availability: 'available' as const
        }));
        
        setEmployees(formattedEmployees);
        setOnlineEmployees(formattedEmployees);
      } else {
        // Veri yoksa mock data kullan
        setEmployees(mockEmployees);
        setOnlineEmployees(mockEmployees.filter(emp => emp.status === 'online'));
      }
    } catch (error) {
      console.error('Çalışan verisi yükleme hatası:', error);
      toast.error('Çalışan verisi yüklenirken hata oluştu');
      // Hata durumunda mock data kullan
      setEmployees(mockEmployees);
      setOnlineEmployees(mockEmployees.filter(emp => emp.status === 'online'));
    }
  };

  const loadChannelData = async () => {
    try {
      // Gerçek veri yerine mock data kullanıyoruz
      setChannels(mockChannels);
    } catch (error) {
      console.error('Kanal verisi yükleme hatası:', error);
      toast.error('Kanal verisi yüklenirken hata oluştu');
    }
  };

  const loadMessages = async (channelId?: string, recipientId?: string) => {
    try {
      console.log('Mesajlar yükleniyor - Channel ID:', channelId, 'Recipient ID:', recipientId);
      console.log('Current User ID:', currentUserId);
      
      let data;
      let error;

      if (channelId) {
        // Kanal mesajları
        const result = await supabase
          .from('employee_messages')
          .select('*')
          .eq('channel_id', channelId)
          .order('created_at', { ascending: true });
        data = result.data;
        error = result.error;
      } else if (recipientId) {
        // DM mesajları için: mevcut kullanıcı ile seçili çalışan arasındaki mesajları bul
        const result = await supabase
          .from('employee_messages')
          .select('*')
          .eq('is_direct_message', true)
          .or(`sender_id.eq.${currentUserId},sender_id.eq.${recipientId}`)
          .order('created_at', { ascending: true });
        
        // Sonuçları filtrele - sadece iki kişi arasındaki mesajları al
        data = result.data?.filter(msg => 
          (msg.sender_id === currentUserId && msg.recipient_id === recipientId) ||
          (msg.sender_id === recipientId && msg.recipient_id === currentUserId)
        ) || [];
        error = result.error;
      } else {
        // Hiçbir seçim yoksa boş veri
        data = [];
        error = null;
      }

      if (error) {
        console.error('Mesaj yükleme hatası:', error);
        // Hata durumunda boş mesaj listesi göster
        setMessages([]);
        return;
      }

      if (data && data.length > 0) {
        const formattedMessages: ChatMessage[] = data.map(msg => ({
          id: msg.id,
          content: msg.content,
          senderId: msg.sender_id,
          senderName: msg.sender_name,
          senderRole: msg.sender_role,
          senderAvatar: msg.sender_avatar,
          channelId: msg.channel_id,
          messageType: msg.message_type,
          attachments: msg.attachments || [],
          timestamp: new Date(msg.created_at),
          isPinned: msg.is_pinned,
          isEdited: msg.is_edited,
          editedAt: msg.edited_at ? new Date(msg.edited_at) : undefined,
          reactions: msg.reactions || {},
          mentions: msg.mentions || [],
          isDirectMessage: msg.is_direct_message,
          recipientId: msg.recipient_id
        }));
        setMessages(formattedMessages);
      } else {
        // Veri yoksa boş liste göster
        setMessages([]);
      }
    } catch (error) {
      console.error('Mesaj yükleme hatası:', error);
      toast.error('Mesajlar yüklenirken hata oluştu');
      // Hata durumunda boş mesaj listesi göster
      setMessages([]);
    }
  };

  const setupRealtimeSubscriptions = () => {
    // Mesaj subscription
    const messagesSubscription = supabase
      .channel('employee_messages')
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'employee_messages'
        }, 
        (payload: any) => {
          if (payload.eventType === 'INSERT') {
            const newMsg = {
              id: payload.new.id,
              content: payload.new.content,
              senderId: payload.new.sender_id,
              senderName: payload.new.sender_name,
              senderRole: payload.new.sender_role,
              senderAvatar: payload.new.sender_avatar,
              channelId: payload.new.channel_id,
              messageType: payload.new.message_type,
              attachments: payload.new.attachments || [],
              timestamp: new Date(payload.new.created_at),
              isPinned: payload.new.is_pinned,
              isEdited: payload.new.is_edited,
              editedAt: payload.new.edited_at ? new Date(payload.new.edited_at) : undefined,
              reactions: payload.new.reactions || {},
              mentions: payload.new.mentions || [],
              isDirectMessage: payload.new.is_direct_message,
              recipientId: payload.new.recipient_id
            };
            
            // Sadece seçili kanal veya çalışan için mesajları ekle
            if (selectedChannel && payload.new.channel_id === selectedChannel.id) {
              setMessages(prev => [...prev, newMsg]);
            } else if (selectedEmployee && payload.new.is_direct_message &&
              ((payload.new.sender_id === currentUserId && payload.new.recipient_id === selectedEmployee.id) ||
               (payload.new.sender_id === selectedEmployee.id && payload.new.recipient_id === currentUserId))) {
              setMessages(prev => [...prev, newMsg]);
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(messagesSubscription);
    };
  };

  const sendMessage = async () => {
    console.log('Mesaj gönderiliyor...');
    console.log('Selected Channel:', selectedChannel);
    console.log('Selected Employee:', selectedEmployee);
    console.log('Current User ID:', currentUserId);
    
    if (!newMessage.trim() && attachments.length === 0) return;
    if (!selectedChannel && !selectedEmployee) return;

    try {
      // Mention'ları kontrol et ve bildirim gönder
      const mentionMatches = newMessage.match(/@([^@\s]+)/g);
      if (mentionMatches) {
        mentionMatches.forEach(mention => {
          const mentionedName = mention.substring(1); // @ işaretini kaldır
          const mentionedEmployee = employees.find(emp => 
            emp.name.toLowerCase().includes(mentionedName.toLowerCase()) ||
            generateUsername(emp.name) === mentionedName.toLowerCase()
          );
          
          if (mentionedEmployee && mentionedEmployee.id !== currentUserId) {
            sendNotification({
              type: 'mention',
              title: 'Mention Bildirimi',
              message: `${currentUserName} sizi bir mesajda etiketledi: "${newMessage.substring(0, 50)}${newMessage.length > 50 ? '...' : ''}"`,
              channelId: selectedChannel?.id,
              messageId: `msg_${Date.now()}`
            });
          }
        });
      }

      const messageData = {
        content: newMessage,
        sender_id: currentUserId || '00000000-0000-0000-0000-000000000001', // Fallback UUID
        sender_name: currentUserName,
        sender_role: currentUserRole,
        sender_avatar: currentUserName.split(' ').map(n => n[0]).join(''),
        channel_id: selectedChannel?.id || null,
        message_type: 'text',
        attachments: attachments.map(file => file.name),
        created_at: new Date().toISOString(),
        is_direct_message: !!selectedEmployee,
        recipient_id: selectedEmployee?.id || null
      };

      const { error } = await supabase
        .from('employee_messages')
        .insert([messageData]);

      if (error) throw error;

      // Mesaj gönderildikten sonra mesajları yeniden yükle
      if (selectedChannel) {
        await loadMessages(selectedChannel.id);
      } else if (selectedEmployee) {
        await loadMessages(undefined, selectedEmployee.id);
      }

      setNewMessage('');
      setAttachments([]);
      setIsTyping(false);
      setShowMentionSuggestions(false);
    } catch (error) {
      console.error('Mesaj gönderme hatası:', error);
      toast.error('Mesaj gönderilirken hata oluştu');
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    
    files.forEach(file => {
      // Dosya boyutu kontrolü (10MB limit)
      if (file.size > 10 * 1024 * 1024) {
        toast.error(`${file.name} dosyası çok büyük. Maksimum 10MB olmalıdır.`);
        return;
      }

      // Dosya türü kontrolü
      const allowedTypes = [
        'image/jpeg', 'image/png', 'image/gif', 'image/webp',
        'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'text/plain', 'application/zip', 'application/x-rar-compressed'
      ];

      if (!allowedTypes.includes(file.type)) {
        toast.error(`${file.name} dosya türü desteklenmiyor.`);
        return;
      }

      // Resim dosyaları için önizleme oluştur
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (e) => {
          setFilePreview({ file, preview: e.target?.result as string });
        };
        reader.readAsDataURL(file);
      }

      setAttachments(prev => [...prev, file]);
      
      // Upload progress simülasyonu
      setUploadProgress(prev => ({ ...prev, [file.name]: 0 }));
      simulateUploadProgress(file.name);
    });
  };

  const simulateUploadProgress = (fileName: string) => {
    let progress = 0;
    const interval = setInterval(() => {
      progress += Math.random() * 20;
      if (progress >= 100) {
        progress = 100;
        clearInterval(interval);
      }
      setUploadProgress(prev => ({ ...prev, [fileName]: progress }));
    }, 100);
  };

  const removeAttachment = (index: number) => {
    const file = attachments[index];
    setAttachments(prev => prev.filter((_, i) => i !== index));
    setUploadProgress(prev => {
      const newProgress = { ...prev };
      delete newProgress[file.name];
      return newProgress;
    });
    if (filePreview?.file === file) {
      setFilePreview(null);
    }
  };

  const createChannel = async () => {
    if (!newChannelName.trim()) {
      toast.error('Kanal adı gereklidir');
      return;
    }

    // Kanal adı validasyonu
    const channelNameRegex = /^[a-z0-9-]+$/;
    if (!channelNameRegex.test(newChannelName.trim())) {
      toast.error('Kanal adı sadece küçük harfler, sayılar ve tire içerebilir');
      return;
    }

    if (channels.some(channel => channel.name.toLowerCase() === newChannelName.toLowerCase())) {
      toast.error('Bu isimde bir kanal zaten mevcut');
      return;
    }

    try {
      const newChannel: ChatChannel = {
        id: `channel_${Date.now()}`,
        name: newChannelName.trim(),
        description: newChannelDescription.trim(),
        type: newChannelType,
        members: [currentUserId],
        unreadCount: 0
      };

      setChannels(prev => [...prev, newChannel]);
      setSelectedChannel(newChannel);
      setShowCreateChannel(false);
      setNewChannelName('');
      setNewChannelDescription('');
      setNewChannelType('public');
      toast.success('Kanal başarıyla oluşturuldu');
    } catch (error) {
      console.error('Kanal oluşturma hatası:', error);
      toast.error('Kanal oluşturulurken hata oluştu');
    }
  };

  const startDirectMessage = (employee: Employee) => {
    console.log('Direkt mesaj başlatılıyor:', employee);
    console.log('Current User ID:', currentUserId);
    setSelectedEmployee(employee);
    setSelectedChannel(null);
    setActiveView('direct');
    // Direkt mesaj geçmişini yükle
    loadMessages(undefined, employee.id);
  };

  const renderChannelList = () => (
    <div className={`w-64 bg-white dark:bg-gray-700 border-r border-gray-200 dark:border-gray-600 flex-shrink-0 h-full rounded-lg shadow-sm ${showChannelList ? 'lg:block' : 'hidden lg:block'}`}>
      {/* Ana Başlık */}
      <div className="p-6 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">Çalışan Mesajlaşma Sistemi</h2>
          <button
            onClick={() => setShowChannelSettings(true)}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
            title="Ayarlar"
          >
            <Settings className="w-5 h-5" />
          </button>
        </div>
      </div>
      
      {/* Kanallar Bölümü */}
      <div className="p-6 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Kanallar</h3>
          <button
            onClick={() => setShowCreateChannel(true)}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
            title="Yeni kanal oluştur"
          >
            <Plus className="w-5 h-5" />
          </button>
        </div>
        
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Kanal ara..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
          />
          <button
            onClick={() => setShowAdvancedSearch(true)}
            className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <Filter className="w-4 h-4" />
          </button>
        </div>
      </div>
      
      <div className="flex-1 overflow-y-auto" style={{ height: 'calc(100vh - 300px)' }}>
        <div className="p-4 space-y-2">
          {channels
            .filter(channel => 
              channel.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
              channel.description.toLowerCase().includes(searchTerm.toLowerCase())
            )
            .map((channel) => (
              <button
                key={channel.id}
                onClick={() => {
                  setSelectedChannel(channel);
                  setSelectedEmployee(null);
                  setActiveView('channels');
                }}
                className={`w-full flex items-center space-x-3 p-3 rounded-lg text-left transition-colors ${
                  selectedChannel?.id === channel.id
                    ? 'bg-primary text-white'
                    : 'hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
              >
                <Hash className="w-4 h-4 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-medium truncate ${
                    selectedChannel?.id === channel.id ? 'text-white' : 'text-gray-900 dark:text-white'
                  }`}>
                    {channel.name}
                  </p>
                  {channel.unreadCount > 0 && (
                    <span className="inline-flex items-center justify-center w-5 h-5 text-xs font-medium bg-red-500 text-white rounded-full">
                      {channel.unreadCount}
                    </span>
                  )}
                </div>
                {channel.isPinned && (
                  <Pin className="w-3 h-3 text-yellow-500" />
                )}
              </button>
            ))}
        </div>
        
        <div className="p-6 border-t border-gray-200 dark:border-gray-700">
          <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-3">Direkt Mesajlar</h4>
          <div className="space-y-2">
            {employees
              .filter(emp => emp.id !== currentUserId && !isUserBlocked(emp.id))
              .map((employee) => (
                <button
                  key={employee.id}
                  onClick={() => startDirectMessage(employee)}
                  className="w-full flex items-center space-x-3 p-3 rounded-lg text-left hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  <div className="relative">
                    <div className="w-6 h-6 bg-primary text-white rounded-full flex items-center justify-center text-xs font-medium">
                      {employee.avatar}
                    </div>
                    <div className={`absolute -bottom-1 -right-1 w-2 h-2 rounded-full border border-white dark:border-gray-700 ${
                      employee.status === 'online' ? 'bg-green-500' :
                      employee.status === 'away' ? 'bg-yellow-500' :
                      employee.status === 'busy' ? 'bg-red-500' : 'bg-gray-500'
                    }`}></div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                      {employee.name}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                      {employee.role}
                    </p>
                  </div>
                </button>
              ))}
          </div>
        </div>
      </div>
    </div>
  );

  const renderChatArea = () => (
    <div className="flex-1 flex flex-col min-w-0 bg-white dark:bg-gray-700 rounded-lg shadow-sm h-full">
      {/* Chat Header */}
      <div className="bg-white dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600 p-6 rounded-t-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            {selectedChannel ? (
              <>
                <Hash className="w-5 h-5 text-gray-400" />
                <div>
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                    #{selectedChannel.name}
                  </h2>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {selectedChannel.description}
                  </p>
                </div>
              </>
            ) : selectedEmployee ? (
              <>
                <div className="relative">
                  <div className="w-8 h-8 bg-primary text-white rounded-full flex items-center justify-center text-sm font-medium">
                    {selectedEmployee.avatar}
                  </div>
                  <div className={`absolute -bottom-1 -right-1 w-3 h-3 rounded-full border-2 border-white dark:border-gray-700 ${
                    selectedEmployee.status === 'online' ? 'bg-green-500' :
                    selectedEmployee.status === 'away' ? 'bg-yellow-500' :
                    selectedEmployee.status === 'busy' ? 'bg-red-500' : 'bg-gray-500'
                  }`}></div>
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                    {selectedEmployee.name}
                  </h2>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {selectedEmployee.role} • {selectedEmployee.department}
                  </p>
                </div>
              </>
            ) : (
              <div>
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Mesajlaşma
                </h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Bir kanal veya kişi seçin
                </p>
              </div>
            )}
          </div>
          
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setActiveView('search')}
              className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-lg"
              title="Mesajlarda ara"
            >
              <Search className="w-5 h-5" />
            </button>
            <button
              onClick={() => setShowAdvancedSearch(true)}
              className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-lg"
              title="Gelişmiş arama"
            >
              <Filter className="w-5 h-5" />
            </button>
            <button
              onClick={() => setShowIntegrations(true)}
              className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-lg"
              title="Entegrasyonlar"
            >
              <Zap className="w-5 h-5" />
            </button>
            <button
              onClick={() => setShowAnalytics(true)}
              className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-lg"
              title="Analitik"
            >
              <TrendingUp className="w-5 h-5" />
            </button>
            {pinnedMessages.length > 0 && (
              <button
                onClick={() => setShowPinnedMessages(true)}
                className="relative p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-lg"
              >
                <Pin className="w-5 h-5" />
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-yellow-500 text-white text-xs rounded-full flex items-center justify-center">
                  {pinnedMessages.length}
                </span>
              </button>
            )}
            {favoriteMessages.length > 0 && (
              <button
                onClick={() => setShowFavorites(true)}
                className="relative p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-lg"
              >
                <Star className="w-5 h-5" />
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-yellow-500 text-white text-xs rounded-full flex items-center justify-center">
                  {favoriteMessages.length}
                </span>
              </button>
            )}
            <button 
              onClick={() => setShowChannelSettings(true)}
              className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-lg"
            >
              <Settings className="w-5 h-5" />
            </button>
            <button
              onClick={() => setShowPrivacySettings(true)}
              className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-lg"
            >
              <Shield className="w-5 h-5" />
            </button>
            <button
              onClick={() => setShowIntegrations(true)}
              className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-lg"
            >
              <Zap className="w-5 h-5" />
            </button>
            <button
              onClick={() => setShowAnalytics(true)}
              className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-lg"
            >
              <TrendingUp className="w-5 h-5" />
            </button>
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="relative p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-lg"
              title="Bildirimler"
            >
              <Bell className="w-5 h-5" />
              {unreadNotifications > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                  {unreadNotifications}
                </span>
              )}
            </button>
            {renderThemeToggle()}
            {selectedChannel && (
              <button
                onClick={() => setShowChannelSettings(true)}
                className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-lg"
              >
                <Users className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Messages Area */}
      {selectedChannel || selectedEmployee ? (
        <div className="flex flex-col h-full">
          {/* Mesaj Listesi */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6" style={{ height: 'calc(100vh - 300px)' }}>
            {messages.length === 0 ? (
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <MessageSquare className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                    {selectedEmployee ? `${selectedEmployee.name} ile sohbet` : 'Kanal mesajları'}
                  </h3>
                  <p className="text-gray-500 dark:text-gray-400">
                    {selectedEmployee ? 'Henüz mesaj yok. İlk mesajı siz gönderin!' : 'Bu kanalda henüz mesaj yok.'}
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-6">
            {messages.map((message) => (
              <div key={message.id} className="flex items-start space-x-3 group">
                <div className="flex-shrink-0">
                  <div className="w-10 h-10 bg-primary text-white rounded-full flex items-center justify-center text-base font-medium">
                    {message.senderAvatar}
                  </div>
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2 mb-2">
                    <span className="text-base font-medium text-gray-900 dark:text-white">
                      {message.senderName}
                    </span>
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                      {message.senderRole}
                    </span>
                    <span className="text-sm text-gray-400 dark:text-gray-500">
                      {format(message.timestamp, 'HH:mm', { locale: tr })}
                    </span>
                    {message.isPinned && (
                      <Pin className="w-3 h-3 text-yellow-500" />
                    )}
                    {message.isEdited && (
                      <span className="text-xs text-gray-400 dark:text-gray-500">(düzenlendi)</span>
                    )}
                    {messageCategories[message.id] && (
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs ${getMessageCategoryColor(messageCategories[message.id])}`}>
                        {getMessageCategoryIcon(messageCategories[message.id])} {messageCategories[message.id]}
                      </span>
                    )}
                  </div>
                  
                  <div className="bg-white dark:bg-gray-700 rounded-lg p-5 shadow-sm">
                    {editingMessage === message.id ? (
                      <div className="space-y-2">
                        <textarea
                          value={editMessageContent}
                          onChange={(e) => setEditMessageContent(e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white resize-none"
                          rows={2}
                        />
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => editMessage(message.id, editMessageContent)}
                            className="px-3 py-1 text-xs bg-primary text-white rounded hover:bg-primary-600"
                          >
                            Kaydet
                          </button>
                          <button
                            onClick={cancelEditing}
                            className="px-3 py-1 text-xs text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
                          >
                            İptal
                          </button>
                        </div>
                      </div>
                    ) : (
                      <p className="text-base text-gray-900 dark:text-white">
                        {message.content.split(/(@[^@\s]+)/g).map((part, index) => {
                          if (part.startsWith('@')) {
                            const mentionedName = part.substring(1);
                            const mentionedEmployee = employees.find(emp => 
                              emp.name.toLowerCase().includes(mentionedName.toLowerCase()) ||
                              generateUsername(emp.name) === mentionedName.toLowerCase()
                            );
                            
                            return mentionedEmployee ? (
                              <span key={index} className="inline-flex items-center space-x-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 px-1 rounded">
                                <span>@{mentionedEmployee.name}</span>
                                <span className="text-xs text-blue-500 dark:text-blue-400">
                                  ({mentionedEmployee.role})
                                </span>
                              </span>
                            ) : (
                              <span key={index} className="text-blue-600 dark:text-blue-400">{part}</span>
                            );
                          }
                          return part;
                        })}
                      </p>
                    )}
                    
                    {message.attachments && message.attachments.length > 0 && (
                      <div className="mt-2 space-y-1">
                        {message.attachments.map((attachment, index) => (
                          <div key={index} className="flex items-center space-x-2 text-xs text-gray-500 dark:text-gray-400">
                            <FileText className="w-3 h-3" />
                            <span>{attachment}</span>
                            <button className="text-primary hover:text-primary-600">
                              <Download className="w-3 h-3" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                    
                                         {message.reactions && Object.keys(message.reactions).length > 0 && (
                       <div className="mt-2 flex flex-wrap gap-1">
                         {Object.entries(message.reactions).map(([emoji, users]) => (
                           <button
                             key={emoji}
                             onClick={() => addReactionToMessage(message.id, emoji)}
                             className={`inline-flex items-center space-x-1 px-2 py-1 rounded-full text-xs transition-colors ${
                               users.includes(currentUserId)
                                 ? 'bg-primary text-white'
                                 : 'bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600'
                             }`}
                           >
                             <span>{emoji}</span>
                             <span className={users.includes(currentUserId) ? 'text-white' : 'text-gray-600 dark:text-gray-400'}>
                               {users.length}
                             </span>
                           </button>
                         ))}
                       </div>
                     )}
                  </div>
                  
                                     {/* Mesaj Aksiyonları */}
                   <div className="opacity-0 group-hover:opacity-100 transition-opacity mt-2 flex items-center space-x-2">
                     <button 
                       onClick={() => {
                         setNewMessage(`@${message.senderName} `);
                         document.getElementById('message-input')?.focus();
                       }}
                       className="text-xs text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
                     >
                       Yanıtla
                     </button>
                     <button 
                       onClick={(e) => {
                         e.stopPropagation();
                         setSelectedMessageForReaction(message.id);
                         setEmojiPickerPosition({ x: e.clientX, y: e.clientY });
                         setShowEmojiPicker(true);
                       }}
                       className="text-xs text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
                     >
                       😊
                     </button>
                     {message.senderId === currentUserId && (
                       <>
                         <button 
                           onClick={() => startEditingMessage(message)}
                           className="text-xs text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
                         >
                           Düzenle
                         </button>
                         <button 
                           onClick={() => deleteMessage(message.id)}
                           className="text-xs text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                         >
                           Sil
                         </button>
                       </>
                     )}
                     <button 
                       onClick={() => pinMessage(message)}
                       className={`text-xs ${
                         pinnedMessages.some(pm => pm.id === message.id)
                           ? 'text-yellow-500 hover:text-yellow-700'
                           : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
                       }`}
                     >
                       Pin
                     </button>
                     <button 
                       onClick={() => toggleFavoriteMessage(message.id)}
                       className={`text-xs ${
                         favoriteMessages.includes(message.id)
                           ? 'text-yellow-500 hover:text-yellow-700'
                           : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
                       }`}
                     >
                       <Star className={`w-3 h-3 ${favoriteMessages.includes(message.id) ? 'fill-current' : ''}`} />
                     </button>
                     <div className="relative">
                       <button className="text-xs text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300">
                         📋
                       </button>
                       <div className="absolute bottom-full right-0 mb-2 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg shadow-lg p-2 space-y-1 opacity-0 group-hover:opacity-100 transition-opacity">
                         <button
                           onClick={() => categorizeMessage(message.id, 'announcement')}
                           className="block w-full text-left text-xs px-2 py-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                         >
                           📢 Duyuru
                         </button>
                         <button
                           onClick={() => categorizeMessage(message.id, 'question')}
                           className="block w-full text-left text-xs px-2 py-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                         >
                           ❓ Soru
                         </button>
                         <button
                           onClick={() => categorizeMessage(message.id, 'suggestion')}
                           className="block w-full text-left text-xs px-2 py-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                         >
                           💡 Öneri
                         </button>
                         <button
                           onClick={() => categorizeMessage(message.id, 'general')}
                           className="block w-full text-left text-xs px-2 py-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                         >
                           💬 Genel
                         </button>
                       </div>
                     </div>
                   </div>
                </div>
              </div>
            ))}
              </div>
            )}
            
            {typingEmployees.length > 0 && (
              <div className="flex items-center space-x-2 text-sm text-gray-500 dark:text-gray-400">
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                </div>
                <span>{typingEmployees.join(', ')} yazıyor...</span>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>

          {/* Mesaj Gönderme Alanı */}
          <div className="border-t border-gray-200 dark:border-gray-700 p-6 flex-shrink-0 rounded-b-lg">
            <div className="flex items-end space-x-2">
              <div className="flex-1 min-w-0">
                <div className="flex items-center space-x-2 mb-2">
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-600"
                    title="Dosya ekle"
                  >
                    <Paperclip className="w-4 h-4" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      const rect = e.currentTarget.getBoundingClientRect();
                      setEmojiPickerPosition({ x: rect.left + rect.width / 2, y: rect.top });
                      setShowEmojiPicker(!showEmojiPicker);
                    }}
                    className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-600"
                    title="Emoji ekle"
                  >
                    <Smile className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setIsRichEditor(!isRichEditor)}
                    className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-600"
                    title="Kalın yazı"
                  >
                    <Bold className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setShowTemplates(true)}
                    className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-600"
                    title="Mesaj şablonları"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setShowPolls(true)}
                    className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-600"
                    title="Anket oluştur"
                  >
                    <TrendingUp className="w-4 h-4" />
                  </button>
                  {draftMessages[selectedChannel?.id || ''] && (
                    <button
                      onClick={() => loadDraft(selectedChannel?.id || '')}
                      className="text-yellow-600 hover:text-yellow-800 dark:text-yellow-400 dark:hover:text-yellow-300 p-1 rounded hover:bg-yellow-50 dark:hover:bg-yellow-900/20"
                      title="Taslak mesajı yükle"
                    >
                      <FileText className="w-4 h-4" />
                    </button>
                  )}
                </div>
                
                <textarea
                  id="message-input"
                  value={newMessage}
                  onChange={(e) => {
                    const value = e.target.value;
                    const cursorPosition = e.target.selectionStart;
                    
                    setNewMessage(value);
                    setCharacterCount(value.length);
                    
                    // Mention sistemi kontrolü
                    handleMentionInput(value, cursorPosition);
                    
                    // Taslak mesajı otomatik kaydet
                    if (selectedChannel) {
                      saveDraft(selectedChannel.id, value);
                    }
                  }}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      sendMessage();
                    }
                  }}
                  placeholder="Mesajınızı yazın... (@ ile mention yapabilirsiniz)"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white resize-none min-w-0"
                  rows={2}
                  maxLength={maxCharacters}
                />
                
                <div className="flex items-center justify-between mt-1">
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    {characterCount}/{maxCharacters}
                  </span>
                  <span className="text-xs text-gray-400 dark:text-gray-500">@ ile mention yapabilirsiniz</span>
                </div>
                
                {/* Mention Suggestions */}
                {showMentionSuggestions && (
                  <div className="absolute bottom-full left-0 mb-2 w-64 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                    <div className="p-2">
                      <div className="text-xs text-gray-500 dark:text-gray-400 mb-2 px-2">
                        Çalışan seçin:
                      </div>
                      {filteredEmployees.map((employee) => (
                        <button
                          key={employee.id}
                          onClick={() => selectMention(employee)}
                          className="w-full flex items-center space-x-3 p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg text-left"
                        >
                          <div className="relative">
                            <div className="w-6 h-6 bg-primary text-white rounded-full flex items-center justify-center text-xs font-medium">
                              {employee.avatar}
                            </div>
                            <div className={`absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full border border-white dark:border-gray-700 ${
                              employee.status === 'online' ? 'bg-green-500' :
                              employee.status === 'away' ? 'bg-yellow-500' :
                              employee.status === 'busy' ? 'bg-red-500' : 'bg-gray-500'
                            }`}></div>
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                              {employee.name}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                              {employee.role} • {employee.department}
                            </p>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              
              <button
                onClick={sendMessage}
                disabled={!newMessage.trim() && attachments.length === 0}
                className="px-4 py-2 bg-primary hover:bg-primary-600 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0 self-end transition-colors"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
            
            {attachments.length > 0 && (
              <div className="mt-2 space-y-1">
                {attachments.map((file, index) => (
                  <div key={index} className="flex items-center justify-between bg-gray-50 dark:bg-gray-700 rounded-lg p-2">
                    <div className="flex items-center space-x-2 flex-1">
                      <div className="w-8 h-8 flex items-center justify-center bg-gray-200 dark:bg-gray-600 rounded">
                        {file.type.startsWith('image/') ? (
                          <Image className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                        ) : file.type.includes('pdf') ? (
                          <FileText className="w-4 h-4 text-red-500" />
                        ) : file.type.includes('word') ? (
                          <FileText className="w-4 h-4 text-blue-500" />
                        ) : file.type.includes('excel') ? (
                          <FileText className="w-4 h-4 text-green-500" />
                        ) : (
                          <File className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-gray-600 dark:text-gray-400 truncate">{file.name}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-500">
                          {(file.size / 1024 / 1024).toFixed(2)} MB
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      {uploadProgress[file.name] !== undefined && uploadProgress[file.name] < 100 && (
                        <div className="w-16 h-2 bg-gray-200 dark:bg-gray-600 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-primary transition-all duration-300"
                            style={{ width: `${uploadProgress[file.name]}%` }}
                          />
                        </div>
                      )}
                      
                      {file.type.startsWith('image/') && (
                        <button
                          onClick={() => setFilePreview({ file, preview: URL.createObjectURL(file) })}
                          className="text-blue-500 hover:text-blue-700"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      )}
                      
                      <button
                        onClick={() => removeAttachment(index)}
                        className="text-red-500 hover:text-red-700"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          
          <input
            ref={fileInputRef}
            type="file"
            multiple
            onChange={handleFileUpload}
            className="hidden"
          />
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center p-8">
            <MessageSquare className="w-20 h-20 text-gray-400 mx-auto mb-6" />
            <h3 className="text-xl font-medium text-gray-900 dark:text-white mb-3">
              Mesajlaşmaya Başlayın
            </h3>
            <p className="text-gray-500 dark:text-gray-400 text-lg">
              Sol taraftan bir kanal veya kişi seçin
            </p>
          </div>
        </div>
      )}
    </div>
  );

  const renderMemberList = () => (
    <div className={`w-64 bg-white dark:bg-gray-700 border-l border-gray-200 dark:border-gray-600 flex-shrink-0 h-full rounded-lg shadow-sm ${showMemberList ? 'lg:block' : 'hidden lg:block'}`}>
      {/* Ana Başlık */}
      <div className="p-6 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">Çalışan Mesajlaşma Sistemi</h2>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="relative text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
              title="Bildirimler"
            >
              <Bell className="w-5 h-5" />
              {unreadNotifications > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                  {unreadNotifications}
                </span>
              )}
            </button>
            <button
              onClick={() => setShowPrivacySettings(true)}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
              title="Gizlilik Ayarları"
            >
              <Shield className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
      
      {/* Çalışanlar Bölümü */}
      <div className="p-6 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Çalışanlar</h3>
          <button
            onClick={() => setShowInviteModal(true)}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
            title="Çalışan davet et"
          >
            <UserPlus className="w-4 h-4" />
          </button>
        </div>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          {onlineEmployees.length} çevrimiçi • {employees.length} toplam
        </p>
      </div>
      
      <div className="overflow-y-auto" style={{ height: 'calc(100vh - 300px)' }}>
        <div className="p-4 space-y-2">
          {employees
            .sort((a, b) => {
              // Favori çalışanları önce göster
              const aIsFavorite = isEmployeeFavorite(a.id);
              const bIsFavorite = isEmployeeFavorite(b.id);
              if (aIsFavorite && !bIsFavorite) return -1;
              if (!aIsFavorite && bIsFavorite) return 1;
              
              // Sonra çevrimiçi durumuna göre sırala
              if (a.status === 'online' && b.status !== 'online') return -1;
              if (a.status !== 'online' && b.status === 'online') return 1;
              
              // Son olarak isme göre sırala
              return a.name.localeCompare(b.name, 'tr');
            })
            .map((employee) => (
            <div key={employee.id} className="group flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors">
              <div className="flex items-center space-x-2 min-w-0 flex-1">
                <div className="relative">
                  <div className="w-8 h-8 bg-gray-300 dark:bg-gray-600 text-white rounded-full flex items-center justify-center text-sm font-medium flex-shrink-0">
                    {employee.avatar}
                  </div>
                  <div className={`absolute -bottom-1 -right-1 w-3 h-3 rounded-full border-2 border-white dark:border-gray-700 ${
                    employee.status === 'online' ? 'bg-green-500' :
                    employee.status === 'away' ? 'bg-yellow-500' :
                    employee.status === 'busy' ? 'bg-red-500' : 'bg-gray-400'
                  }`} />
                </div>
                
                <div className="min-w-0 flex-1">
                  <div className="flex items-center space-x-1">
                    <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                      {employee.name}
                    </p>
                    {isEmployeeFavorite(employee.id) && (
                      <Star className="w-3 h-3 text-yellow-500 fill-current flex-shrink-0" />
                    )}
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                    {employee.role}
                  </p>
                </div>
              </div>
              
              <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                {employee.isTyping && (
                  <div className="flex space-x-1 mr-1">
                    <div className="w-1 h-1 bg-blue-500 rounded-full animate-bounce"></div>
                    <div className="w-1 h-1 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                    <div className="w-1 h-1 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  </div>
                )}
                
                <button 
                  onClick={() => isUserBlocked(employee.id) ? unblockUser(employee.id) : blockUser(employee.id)}
                  className={`text-xs px-2 py-1 rounded transition-colors ${
                    isUserBlocked(employee.id)
                      ? 'text-green-600 hover:text-green-800 dark:text-green-400 dark:hover:text-green-300 hover:bg-green-50 dark:hover:bg-green-900/20'
                      : 'text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/20'
                  }`}
                  title={isUserBlocked(employee.id) ? 'Engeli kaldır' : 'Engelle'}
                >
                  {isUserBlocked(employee.id) ? 'Engeli Kaldır' : 'Engelle'}
                </button>
                
                <button 
                  onClick={(e) => openEmployeeMenu(employee.id, e)}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
                  title="Daha fazla seçenek"
                >
                  <MoreHorizontal className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderEmployeeMenu = () => {
    if (!showEmployeeMenu) return null;

    const employee = employees.find(emp => emp.id === showEmployeeMenu);
    if (!employee) return null;

    // Ekran sınırlarını kontrol et
    const menuWidth = 200; // Menü genişliği
    const menuHeight = 400; // Menü yüksekliği (tahmini)
    const padding = 20; // Kenar boşluğu
    
    let x = employeeMenuPosition.x;
    let y = employeeMenuPosition.y;
    
    // Menü sağ tarafta açılacak, eğer sağ tarafta yer yoksa sol tarafta aç
    if (x + menuWidth > window.innerWidth - padding) {
      // Sağ tarafta yer yok, sol tarafta aç
      x = x - menuWidth;
    }
    
    // Sol tarafta da yer yoksa, ekranın ortasında aç
    if (x < padding) {
      x = window.innerWidth / 2 - menuWidth / 2;
    }
    
    // Y koordinatını sınırlar içinde tut
    if (y + menuHeight > window.innerHeight - padding) {
      // Alt tarafta yer yok, yukarıda aç
      y = y - menuHeight;
    }
    if (y < padding) y = padding;

    // Mobil cihazlarda menüyü farklı konumlandır
    const isMobile = window.innerWidth < 768;
    const menuStyle: React.CSSProperties = isMobile ? {
      left: '50%',
      top: '50%',
      transform: 'translate(-50%, -50%)',
      width: '90vw',
      maxWidth: '320px',
      maxHeight: '80vh',
      overflowY: 'auto' as const
    } : {
      left: x,
      top: y,
      transform: 'none', // Pozisyon zaten hesaplandı
      maxHeight: '80vh',
      overflowY: 'auto' as const
    };

    return (
      <div 
        className={`fixed z-50 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg shadow-lg p-1 employee-menu ${
          isMobile ? 'min-w-64 max-w-80' : 'min-w-48 max-w-64'
        }`}
        style={menuStyle}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="py-1">
          <button
            onClick={() => startDirectMessageFromMenu(employee)}
            className="w-full flex items-center space-x-3 px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg text-left transition-colors"
          >
            <MessageSquare className="w-4 h-4 flex-shrink-0" />
            <span className="truncate">Mesaj Gönder</span>
          </button>
          
          <button
            onClick={() => viewEmployeeProfile(employee)}
            className="w-full flex items-center space-x-3 px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg text-left transition-colors"
          >
            <Eye className="w-4 h-4 flex-shrink-0" />
            <span className="truncate">Profili Görüntüle</span>
          </button>
          
          <button
            onClick={() => sendFileToEmployee(employee)}
            className="w-full flex items-center space-x-3 px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg text-left transition-colors"
          >
            <Paperclip className="w-4 h-4 flex-shrink-0" />
            <span className="truncate">Dosya Gönder</span>
          </button>
          
          <button
            onClick={() => scheduleMeetingWithEmployee(employee)}
            className="w-full flex items-center space-x-3 px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg text-left transition-colors"
          >
            <Video className="w-4 h-4 flex-shrink-0" />
            <span className="truncate">Toplantı Planla</span>
          </button>
          
          <button
            onClick={() => addEmployeeToFavorites(employee)}
            className="w-full flex items-center space-x-3 px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg text-left transition-colors"
          >
            <Star className={`w-4 h-4 flex-shrink-0 ${isEmployeeFavorite(employee.id) ? 'fill-current text-yellow-500' : ''}`} />
            <span className="truncate">{isEmployeeFavorite(employee.id) ? 'Favorilerden Çıkar' : 'Favorilere Ekle'}</span>
          </button>
          
          <div className="border-t border-gray-200 dark:border-gray-600 my-1"></div>
          
          <div className="px-3 py-2 text-xs text-gray-500 dark:text-gray-400">
            Durum Değiştir:
          </div>
          
          <button
            onClick={() => changeEmployeeStatus(employee, 'online')}
            className={`w-full flex items-center space-x-3 px-3 py-2 text-sm rounded-lg text-left transition-colors ${
              employee.status === 'online' 
                ? 'bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-200' 
                : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
            }`}
          >
            <div className="w-3 h-3 bg-green-500 rounded-full flex-shrink-0"></div>
            <span className="truncate">Çevrimiçi {employee.status === 'online' && '(Mevcut)'}</span>
          </button>
          
          <button
            onClick={() => changeEmployeeStatus(employee, 'away')}
            className={`w-full flex items-center space-x-3 px-3 py-2 text-sm rounded-lg text-left transition-colors ${
              employee.status === 'away' 
                ? 'bg-yellow-100 dark:bg-yellow-900 text-yellow-700 dark:text-yellow-200' 
                : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
            }`}
          >
            <div className="w-3 h-3 bg-yellow-500 rounded-full flex-shrink-0"></div>
            <span className="truncate">Uzakta {employee.status === 'away' && '(Mevcut)'}</span>
          </button>
          
          <button
            onClick={() => changeEmployeeStatus(employee, 'busy')}
            className={`w-full flex items-center space-x-3 px-3 py-2 text-sm rounded-lg text-left transition-colors ${
              employee.status === 'busy' 
                ? 'bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-200' 
                : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
            }`}
          >
            <div className="w-3 h-3 bg-red-500 rounded-full flex-shrink-0"></div>
            <span className="truncate">Meşgul {employee.status === 'busy' && '(Mevcut)'}</span>
          </button>
          
          <button
            onClick={() => changeEmployeeStatus(employee, 'offline')}
            className={`w-full flex items-center space-x-3 px-3 py-2 text-sm rounded-lg text-left transition-colors ${
              employee.status === 'offline' 
                ? 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200' 
                : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
            }`}
          >
            <div className="w-3 h-3 bg-gray-500 rounded-full flex-shrink-0"></div>
            <span className="truncate">Çevrimdışı {employee.status === 'offline' && '(Mevcut)'}</span>
          </button>
        </div>
      </div>
    );
  };

  const renderEmojiPicker = () => {
    const emojis = ['😊', '😂', '❤️', '👍', '👎', '🎉', '🔥', '💯', '👏', '🙏', '😍', '🤔', '😮', '😢', '😡', '🤯', '🥳', '🤝', '💪', '🚀'];
    
    // Ekran sınırlarını kontrol et
    const maxX = window.innerWidth - 200; // Emoji picker genişliği
    const maxY = window.innerHeight - 200; // Emoji picker yüksekliği
    
    let x = emojiPickerPosition.x;
    let y = emojiPickerPosition.y;
    
    // X koordinatını sınırlar içinde tut
    if (x > maxX) x = maxX;
    if (x < 100) x = 100;
    
    // Y koordinatını sınırlar içinde tut
    if (y > maxY) y = maxY;
    if (y < 100) y = 100;
    
    return (
      <div 
        className="fixed z-[9999] bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg shadow-lg p-2 emoji-picker"
        style={{ 
          left: x, 
          top: y,
          transform: 'translate(-50%, -100%)',
          marginTop: '-10px'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="grid grid-cols-5 gap-1">
          {emojis.map((emoji) => (
            <button
              key={emoji}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                if (selectedMessageForReaction) {
                  addReactionToMessage(selectedMessageForReaction, emoji);
                } else {
                  setNewMessage(prev => prev + emoji);
                }
                setShowEmojiPicker(false);
                setSelectedMessageForReaction(null);
              }}
              className="w-8 h-8 flex items-center justify-center text-lg hover:bg-gray-100 dark:hover:bg-gray-600 rounded transition-colors cursor-pointer"
            >
              {emoji}
            </button>
          ))}
        </div>
      </div>
    );
  };

  const addReactionToMessage = (messageId: string, emoji: string) => {
    setMessages(prev => prev.map(message => {
      if (message.id === messageId) {
        const reactions = message.reactions || {};
        const users = reactions[emoji] || [];
        
        if (users.includes(currentUserId)) {
          // Reaksiyonu kaldır
          const updatedUsers = users.filter(id => id !== currentUserId);
          if (updatedUsers.length === 0) {
            const { [emoji]: removed, ...rest } = reactions;
            return { ...message, reactions: rest };
          } else {
            return { ...message, reactions: { ...reactions, [emoji]: updatedUsers } };
          }
        } else {
          // Reaksiyonu ekle
          return { 
            ...message, 
            reactions: { ...reactions, [emoji]: [...users, currentUserId] } 
          };
        }
      }
      return message;
    }));
  };

  const renderCreateChannelModal = () => (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white dark:bg-gray-700 rounded-lg shadow-xl w-full max-w-md mx-4">
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Yeni Kanal Oluştur</h2>
          <button
            onClick={() => {
              setShowCreateChannel(false);
              setNewChannelName('');
              setNewChannelDescription('');
              setNewChannelType('public');
            }}
            className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Kanal Adı *
            </label>
            <input
              type="text"
              value={newChannelName}
              onChange={(e) => setNewChannelName(e.target.value)}
              placeholder="örn: proje-ekibi"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              maxLength={50}
            />
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Sadece küçük harfler, sayılar ve tire kullanın
            </p>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Açıklama
            </label>
            <textarea
              value={newChannelDescription}
              onChange={(e) => setNewChannelDescription(e.target.value)}
              placeholder="Bu kanalın amacını açıklayın..."
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent resize-none"
              maxLength={200}
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Kanal Türü
            </label>
            <div className="space-y-2">
              <label className="flex items-center space-x-3 cursor-pointer">
                <input
                  type="radio"
                  name="channelType"
                  value="public"
                  checked={newChannelType === 'public'}
                  onChange={(e) => setNewChannelType(e.target.value as 'public' | 'private')}
                  className="w-4 h-4 text-primary border-gray-300 focus:ring-primary"
                />
                <div>
                  <div className="flex items-center space-x-2">
                    <Globe className="w-4 h-4 text-gray-500" />
                    <span className="text-sm font-medium text-gray-900 dark:text-white">Herkese Açık</span>
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Tüm çalışanlar bu kanalı görebilir ve katılabilir
                  </p>
                </div>
              </label>
              
              <label className="flex items-center space-x-3 cursor-pointer">
                <input
                  type="radio"
                  name="channelType"
                  value="private"
                  checked={newChannelType === 'private'}
                  onChange={(e) => setNewChannelType(e.target.value as 'public' | 'private')}
                  className="w-4 h-4 text-primary border-gray-300 focus:ring-primary"
                />
                <div>
                  <div className="flex items-center space-x-2">
                    <Lock className="w-4 h-4 text-gray-500" />
                    <span className="text-sm font-medium text-gray-900 dark:text-white">Özel</span>
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Sadece davet edilen kişiler katılabilir
                  </p>
                </div>
              </label>
            </div>
          </div>
        </div>
        
        <div className="flex items-center justify-end space-x-3 p-6 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={() => {
              setShowCreateChannel(false);
              setNewChannelName('');
              setNewChannelDescription('');
              setNewChannelType('public');
            }}
            className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors"
          >
            İptal
          </button>
          <button
            onClick={createChannel}
            disabled={!newChannelName.trim()}
            className="px-4 py-2 bg-primary hover:bg-primary-600 text-white text-sm font-medium rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Kanal Oluştur
          </button>
        </div>
      </div>
    </div>
  );

  const renderFilePreview = () => {
    if (!filePreview) return null;

    return (
      <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black bg-opacity-75">
        <div className="bg-white dark:bg-gray-700 rounded-lg shadow-xl max-w-2xl max-h-[80vh] overflow-hidden">
          <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              {filePreview.file.name}
            </h3>
            <button
              onClick={() => setFilePreview(null)}
              className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-lg"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="p-4">
            <img 
              src={filePreview.preview} 
              alt={filePreview.file.name}
              className="w-full h-auto max-h-[60vh] object-contain rounded-lg"
            />
          </div>
        </div>
      </div>
    );
  };

  const performSearch = async () => {
    setIsSearching(true);
    
    try {
      // Mock arama sonuçları - gerçek uygulamada Supabase'den gelecek
      const mockSearchResults: ChatMessage[] = [
        {
          id: 'search_1',
          content: 'Bu ayki satış raporu hazır',
          senderId: '2',
          senderName: 'Fatma Demir',
          senderRole: 'Muhasebe Uzmanı',
          senderAvatar: 'FD',
          channelId: 'general',
          messageType: 'text',
          timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
          isDirectMessage: false
        },
        {
          id: 'search_2',
          content: 'Yeni çalışan oryantasyonu için toplantı',
          senderId: '1',
          senderName: 'Ahmet Yılmaz',
          senderRole: 'İK Müdürü',
          senderAvatar: 'AY',
          channelId: 'hr',
          messageType: 'text',
          timestamp: new Date(Date.now() - 1 * 60 * 60 * 1000),
          isDirectMessage: false
        }
      ];

      // Filtreleme
      let filteredResults = mockSearchResults.filter(message => {
        // İçerik arama
        if (searchTerm && !message.content.toLowerCase().includes(searchTerm.toLowerCase())) {
          return false;
        }
        
        // Gönderen filtreleme
        if (searchFilters.sender && message.senderName.toLowerCase() !== searchFilters.sender.toLowerCase()) {
          return false;
        }
        
        // Tarih filtreleme
        if (searchFilters.dateFrom) {
          const fromDate = new Date(searchFilters.dateFrom);
          if (message.timestamp < fromDate) return false;
        }
        
        if (searchFilters.dateTo) {
          const toDate = new Date(searchFilters.dateTo);
          if (message.timestamp > toDate) return false;
        }
        
        // Mesaj türü filtreleme
        if (searchFilters.messageType !== 'all' && message.messageType !== searchFilters.messageType) {
          return false;
        }
        
        // Kanal filtreleme
        if (searchFilters.channel !== 'all' && message.channelId !== searchFilters.channel) {
          return false;
        }
        
        return true;
      });

      setSearchResults(filteredResults);
      setActiveView('search');
      
    } catch (error) {
      console.error('Arama hatası:', error);
      toast.error('Arama yapılırken hata oluştu');
    } finally {
      setIsSearching(false);
    }
  };

  const clearSearch = () => {
    setSearchTerm('');
    setSearchFilters({
      sender: '',
      dateFrom: '',
      dateTo: '',
      messageType: 'all',
      channel: 'all'
    });
    setSearchResults([]);
    setActiveView('channels');
  };

  const renderAdvancedSearchModal = () => (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white dark:bg-gray-700 rounded-lg shadow-xl w-full max-w-2xl mx-4">
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Gelişmiş Arama</h2>
          <button
            onClick={() => setShowAdvancedSearch(false)}
            className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Arama Terimi
            </label>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Mesaj içeriğinde ara..."
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Gönderen
              </label>
              <select
                value={searchFilters.sender}
                onChange={(e) => setSearchFilters(prev => ({ ...prev, sender: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              >
                <option value="">Tümü</option>
                {employees.map(emp => (
                  <option key={emp.id} value={emp.name}>{emp.name}</option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Mesaj Türü
              </label>
              <select
                value={searchFilters.messageType}
                onChange={(e) => setSearchFilters(prev => ({ ...prev, messageType: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              >
                <option value="all">Tümü</option>
                <option value="text">Metin</option>
                <option value="file">Dosya</option>
                <option value="image">Resim</option>
                <option value="system">Sistem</option>
              </select>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Başlangıç Tarihi
              </label>
              <input
                type="date"
                value={searchFilters.dateFrom}
                onChange={(e) => setSearchFilters(prev => ({ ...prev, dateFrom: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Bitiş Tarihi
              </label>
              <input
                type="date"
                value={searchFilters.dateTo}
                onChange={(e) => setSearchFilters(prev => ({ ...prev, dateTo: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              />
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Kanal
            </label>
            <select
              value={searchFilters.channel}
              onChange={(e) => setSearchFilters(prev => ({ ...prev, channel: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
            >
              <option value="all">Tüm Kanallar</option>
              {channels.map(channel => (
                <option key={channel.id} value={channel.id}>#{channel.name}</option>
              ))}
            </select>
          </div>
        </div>
        
        <div className="flex items-center justify-end space-x-3 p-6 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={clearSearch}
            className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors"
          >
            Temizle
          </button>
          <button
            onClick={() => {
              performSearch();
              setShowAdvancedSearch(false);
            }}
            disabled={isSearching}
            className="px-4 py-2 bg-primary hover:bg-primary-600 text-white text-sm font-medium rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isSearching ? 'Aranıyor...' : 'Ara'}
          </button>
        </div>
      </div>
    </div>
  );

  const renderSearchResults = () => (
    <div className="flex-1 flex flex-col">
      <div className="bg-white dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Search className="w-5 h-5 text-gray-400" />
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                Arama Sonuçları
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {searchResults.length} sonuç bulundu
              </p>
            </div>
          </div>
          <button
            onClick={clearSearch}
            className="px-3 py-1 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
          >
            Temizle
          </button>
        </div>
      </div>
      
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {searchResults.map((message) => (
          <div key={message.id} className="flex items-start space-x-3 p-3 bg-white dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-primary text-white rounded-full flex items-center justify-center text-sm font-medium">
                {message.senderAvatar}
              </div>
            </div>
            
            <div className="flex-1 min-w-0">
              <div className="flex items-center space-x-2 mb-1">
                <span className="text-sm font-medium text-gray-900 dark:text-white">
                  {message.senderName}
                </span>
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  {message.senderRole}
                </span>
                <span className="text-xs text-gray-400 dark:text-gray-500">
                  {format(message.timestamp, 'dd.MM.yyyy HH:mm', { locale: tr })}
                </span>
                <span className="text-xs text-primary">
                  #{channels.find(c => c.id === message.channelId)?.name || 'bilinmeyen'}
                </span>
              </div>
              
              <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3">
                <p className="text-sm text-gray-900 dark:text-white">{message.content}</p>
              </div>
            </div>
          </div>
        ))}
        
        {searchResults.length === 0 && !isSearching && (
          <div className="text-center py-8">
            <Search className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              Sonuç Bulunamadı
            </h3>
            <p className="text-gray-500 dark:text-gray-400">
              Arama kriterlerinizi değiştirmeyi deneyin
            </p>
          </div>
        )}
      </div>
    </div>
  );



  const editMessage = (messageId: string, newContent: string) => {
    if (!newContent.trim()) return;

    setMessages(prev => prev.map(message => {
      if (message.id === messageId && message.senderId === currentUserId) {
        return {
          ...message,
          content: newContent,
          isEdited: true,
          editedAt: new Date()
        };
      }
      return message;
    }));

    setEditingMessage(null);
    setEditMessageContent('');
    toast.success('Mesaj düzenlendi');
  };

  const deleteMessage = (messageId: string) => {
    setMessages(prev => prev.filter(message => 
      !(message.id === messageId && message.senderId === currentUserId)
    ));
    toast.success('Mesaj silindi');
  };

  const pinMessage = (message: ChatMessage) => {
    if (pinnedMessages.some(pm => pm.id === message.id)) {
      setPinnedMessages(prev => prev.filter(pm => pm.id !== message.id));
      toast.success('Mesaj pin kaldırıldı');
    } else {
      setPinnedMessages(prev => [...prev, message]);
      toast.success('Mesaj pinlendi');
    }
  };

  const startEditingMessage = (message: ChatMessage) => {
    if (message.senderId === currentUserId) {
      setEditingMessage(message.id);
      setEditMessageContent(message.content);
    }
  };

  const cancelEditing = () => {
    setEditingMessage(null);
    setEditMessageContent('');
  };

  const renderPinnedMessages = () => (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white dark:bg-gray-700 rounded-lg shadow-xl w-full max-w-4xl max-h-[80vh] mx-4 flex flex-col">
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Pinlenmiş Mesajlar ({pinnedMessages.length})
          </h2>
          <button
            onClick={() => setShowPinnedMessages(false)}
            className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="flex-1 overflow-y-auto p-6">
          {pinnedMessages.length === 0 ? (
            <div className="text-center py-8">
              <Pin className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                Pinlenmiş Mesaj Yok
              </h3>
              <p className="text-gray-500 dark:text-gray-400">
                Önemli mesajları pinleyerek burada görüntüleyebilirsiniz
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {pinnedMessages.map((message) => (
                <div key={message.id} className="flex items-start space-x-3 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-primary text-white rounded-full flex items-center justify-center text-sm font-medium">
                      {message.senderAvatar}
                    </div>
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2 mb-1">
                      <span className="text-sm font-medium text-gray-900 dark:text-white">
                        {message.senderName}
                      </span>
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {message.senderRole}
                      </span>
                      <span className="text-xs text-gray-400 dark:text-gray-500">
                        {format(message.timestamp, 'dd.MM.yyyy HH:mm', { locale: tr })}
                      </span>
                      <Pin className="w-3 h-3 text-yellow-500" />
                    </div>
                    
                    <div className="bg-white dark:bg-gray-700 rounded-lg p-3 shadow-sm">
                      {editingMessage === message.id ? (
                        <div className="space-y-2">
                          <textarea
                            value={editMessageContent}
                            onChange={(e) => setEditMessageContent(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white resize-none"
                            rows={2}
                          />
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={() => editMessage(message.id, editMessageContent)}
                              className="px-3 py-1 text-xs bg-primary text-white rounded hover:bg-primary-600"
                            >
                              Kaydet
                            </button>
                            <button
                              onClick={cancelEditing}
                              className="px-3 py-1 text-xs text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
                            >
                              İptal
                            </button>
                          </div>
                        </div>
                      ) : (
                        <p className="text-sm text-gray-900 dark:text-white">{message.content}</p>
                      )}
                    </div>
                  </div>
                  
                  <button
                    onClick={() => pinMessage(message)}
                    className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );

  const toggleFavoriteMessage = (messageId: string) => {
    setFavoriteMessages(prev => 
      prev.includes(messageId) 
        ? prev.filter(id => id !== messageId)
        : [...prev, messageId]
    );
  };

  const categorizeMessage = (messageId: string, category: 'announcement' | 'question' | 'suggestion' | 'general') => {
    setMessageCategories(prev => ({
      ...prev,
      [messageId]: category
    }));
  };

  // 3 noktalı menü fonksiyonları
  const openEmployeeMenu = (employeeId: string, event: React.MouseEvent) => {
    event.stopPropagation();
    event.preventDefault();
    
    // Eğer aynı çalışanın menüsü zaten açıksa, kapat
    if (showEmployeeMenu === employeeId) {
      closeEmployeeMenu();
      return;
    }
    
    // Tıklanan butonun pozisyonunu al
    const button = event.currentTarget as HTMLElement;
    const rect = button.getBoundingClientRect();
    
    // Menü pozisyonunu hesapla - butonun sağ tarafında açılsın
    let x = rect.right + 5; // Butonun sağ kenarından 5px uzakta
    let y = rect.top; // Butonun üst kenarıyla aynı hizada
    
    // Mobil cihazlarda menüyü butonun altında göster
    const isMobile = window.innerWidth < 768;
    if (isMobile) {
      x = rect.left; // Butonun sol kenarından başla
      y = rect.bottom + 5; // Butonun altında
    }
    
    setShowEmployeeMenu(employeeId);
    setEmployeeMenuPosition({ x, y });
  };

  const closeEmployeeMenu = () => {
    setShowEmployeeMenu(null);
  };

  const startDirectMessageFromMenu = (employee: Employee) => {
    startDirectMessage(employee);
    closeEmployeeMenu();
  };

  const viewEmployeeProfile = (employee: Employee) => {
    toast.success(`${employee.name} profilini görüntülüyorsunuz`);
    closeEmployeeMenu();
    // Burada profil görüntüleme modalı açılabilir
  };

  const sendFileToEmployee = (employee: Employee) => {
    toast.success(`${employee.name} için dosya gönderme seçeneği açılıyor`);
    closeEmployeeMenu();
    // Burada dosya seçme dialogu açılabilir
  };

  const scheduleMeetingWithEmployee = (employee: Employee) => {
    toast.success(`${employee.name} ile toplantı planlanıyor`);
    closeEmployeeMenu();
    // Burada takvim entegrasyonu ile toplantı planlama açılabilir
  };

  const addEmployeeToFavorites = (employee: Employee) => {
    if (favoriteEmployees.includes(employee.id)) {
      setFavoriteEmployees(prev => prev.filter(id => id !== employee.id));
      toast.success(`${employee.name} favorilerden çıkarıldı`);
    } else {
      setFavoriteEmployees(prev => [...prev, employee.id]);
      toast.success(`${employee.name} favorilere eklendi`);
    }
    closeEmployeeMenu();
  };

  const changeEmployeeStatus = (employee: Employee, newStatus: 'online' | 'away' | 'busy' | 'offline') => {
    setEmployees(prev => prev.map(emp => 
      emp.id === employee.id ? { ...emp, status: newStatus } : emp
    ));
    toast.success(`${employee.name} durumu "${newStatus}" olarak değiştirildi`);
    closeEmployeeMenu();
  };

  const isEmployeeFavorite = (employeeId: string) => {
    return favoriteEmployees.includes(employeeId);
  };

  const getMessageCategoryColor = (category: string) => {
    switch (category) {
      case 'announcement': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      case 'question': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'suggestion': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200';
    }
  };

  const getMessageCategoryIcon = (category: string) => {
    switch (category) {
      case 'announcement': return '📢';
      case 'question': return '❓';
      case 'suggestion': return '💡';
      default: return '💬';
    }
  };



  const renderFavoritesPanel = () => (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white dark:bg-gray-700 rounded-lg shadow-xl w-full max-w-4xl max-h-[80vh] mx-4 flex flex-col">
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Favori Mesajlar ({favoriteMessages.length})
          </h2>
          <button
            onClick={() => setShowFavorites(false)}
            className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="flex-1 overflow-y-auto p-6">
          {favoriteMessages.length === 0 ? (
            <div className="text-center py-8">
              <Star className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                Favori Mesaj Yok
              </h3>
              <p className="text-gray-500 dark:text-gray-400">
                Önemli mesajları favorilere ekleyerek burada görüntüleyebilirsiniz
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {messages
                .filter(message => favoriteMessages.includes(message.id))
                .map((message) => (
                  <div key={message.id} className="flex items-start space-x-3 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <div className="flex-shrink-0">
                      <div className="w-8 h-8 bg-primary text-white rounded-full flex items-center justify-center text-sm font-medium">
                        {message.senderAvatar}
                      </div>
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2 mb-1">
                        <span className="text-sm font-medium text-gray-900 dark:text-white">
                          {message.senderName}
                        </span>
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          {message.senderRole}
                        </span>
                        <span className="text-xs text-gray-400 dark:text-gray-500">
                          {format(message.timestamp, 'dd.MM.yyyy HH:mm', { locale: tr })}
                        </span>
                        <Star className="w-3 h-3 text-yellow-500 fill-current" />
                        {messageCategories[message.id] && (
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs ${getMessageCategoryColor(messageCategories[message.id])}`}>
                            {getMessageCategoryIcon(messageCategories[message.id])} {messageCategories[message.id]}
                          </span>
                        )}
                      </div>
                      
                      <div className="bg-white dark:bg-gray-700 rounded-lg p-3">
                        <p className="text-sm text-gray-900 dark:text-white">{message.content}</p>
                      </div>
                    </div>
                    
                    <button
                      onClick={() => toggleFavoriteMessage(message.id)}
                      className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );

  const inviteToChannel = async (channelId: string, email: string) => {
    try {
      // Mock davet işlemi
      const newMember = employees.find(emp => emp.name.toLowerCase().includes(email.toLowerCase()));
      if (newMember) {
        setChannelMembers(prev => ({
          ...prev,
          [channelId]: [...(prev[channelId] || []), newMember]
        }));
        setInviteEmail('');
        setShowInviteModal(false);
        toast.success('Davet gönderildi');
      } else {
        toast.error('Kullanıcı bulunamadı');
      }
    } catch (error) {
      console.error('Davet hatası:', error);
      toast.error('Davet gönderilirken hata oluştu');
    }
  };

  const removeFromChannel = (channelId: string, memberId: string) => {
    setChannelMembers(prev => ({
      ...prev,
      [channelId]: (prev[channelId] || []).filter(member => member.id !== memberId)
    }));
    toast.success('Üye kanaldan çıkarıldı');
  };

  const archiveChannel = (channelId: string) => {
    setChannels(prev => prev.filter(channel => channel.id !== channelId));
    toast.success('Kanal arşivlendi');
  };

  const getChannelStats = (channelId: string) => {
    const stats = channelStats[channelId] || {
      messageCount: Math.floor(Math.random() * 100),
      memberCount: channelMembers[channelId]?.length || 0,
      lastActivity: new Date(Date.now() - Math.random() * 24 * 60 * 60 * 1000)
    };
    return stats;
  };

  const renderChannelSettings = () => (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white dark:bg-gray-700 rounded-lg shadow-xl w-full max-w-2xl mx-4">
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Kanal Ayarları - #{selectedChannel?.name}
          </h2>
          <button
            onClick={() => setShowChannelSettings(false)}
            className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="p-6 space-y-6">
          {/* Kanal İstatistikleri */}
          <div>
            <h3 className="text-md font-medium text-gray-900 dark:text-white mb-3">İstatistikler</h3>
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3 text-center">
                <div className="text-2xl font-bold text-primary">
                  {getChannelStats(selectedChannel?.id || '').messageCount}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Mesaj</div>
              </div>
              <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3 text-center">
                <div className="text-2xl font-bold text-primary">
                  {getChannelStats(selectedChannel?.id || '').memberCount}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Üye</div>
              </div>
              <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3 text-center">
                <div className="text-2xl font-bold text-primary">
                  {format(getChannelStats(selectedChannel?.id || '').lastActivity, 'dd/MM', { locale: tr })}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Son Aktivite</div>
              </div>
            </div>
          </div>

          {/* Üye Yönetimi */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-md font-medium text-gray-900 dark:text-white">Üyeler</h3>
              <button
                onClick={() => setShowInviteModal(true)}
                className="px-3 py-1 text-sm bg-primary text-white rounded hover:bg-primary-600"
              >
                Davet Et
              </button>
            </div>
            <div className="space-y-2 max-h-40 overflow-y-auto">
              {(channelMembers[selectedChannel?.id || ''] || []).map((member) => (
                <div key={member.id} className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <div className="w-6 h-6 bg-primary text-white rounded-full flex items-center justify-center text-xs font-medium">
                      {member.avatar}
                    </div>
                    <span className="text-sm text-gray-900 dark:text-white">{member.name}</span>
                    <span className="text-xs text-gray-500 dark:text-gray-400">{member.role}</span>
                  </div>
                  <button
                    onClick={() => removeFromChannel(selectedChannel?.id || '', member.id)}
                    className="text-red-500 hover:text-red-700 text-xs"
                  >
                    Çıkar
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Kanal Aksiyonları */}
          <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
            <button
              onClick={() => archiveChannel(selectedChannel?.id || '')}
              className="w-full px-4 py-2 text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 border border-red-300 dark:border-red-600 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
            >
              Kanalı Arşivle
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  const renderInviteModal = () => (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white dark:bg-gray-700 rounded-lg shadow-xl w-full max-w-md mx-4">
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Üye Davet Et</h2>
          <button
            onClick={() => setShowInviteModal(false)}
            className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              E-posta Adresi
            </label>
            <input
              type="email"
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
              placeholder="ornek@firma.com"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
            />
          </div>
        </div>
        
        <div className="flex items-center justify-end space-x-3 p-6 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={() => setShowInviteModal(false)}
            className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors"
          >
            İptal
          </button>
          <button
            onClick={() => inviteToChannel(selectedChannel?.id || '', inviteEmail)}
            disabled={!inviteEmail.trim()}
            className="px-4 py-2 bg-primary hover:bg-primary-600 text-white text-sm font-medium rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Davet Gönder
          </button>
        </div>
      </div>
    </div>
  );

  const blockUser = (userId: string) => {
    setBlockedUsers(prev => [...prev, userId]);
    toast.success('Kullanıcı engellendi');
  };

  const unblockUser = (userId: string) => {
    setBlockedUsers(prev => prev.filter(id => id !== userId));
    toast.success('Kullanıcı engeli kaldırıldı');
  };

  const isUserBlocked = (userId: string) => {
    return blockedUsers.includes(userId);
  };

  const clearMessageHistory = () => {
    setMessages([]);
    toast.success('Mesaj geçmişi temizlendi');
  };

  const renderPrivacySettings = () => (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white dark:bg-gray-700 rounded-lg shadow-xl w-full max-w-md mx-4">
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Gizlilik Ayarları</h2>
          <button
            onClick={() => setShowPrivacySettings(false)}
            className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-medium text-gray-900 dark:text-white">Çevrimiçi Durumu</h3>
              <p className="text-xs text-gray-500 dark:text-gray-400">Diğer kullanıcılar çevrimiçi durumunuzu görebilir</p>
            </div>
            <button
              onClick={() => setPrivacySettings(prev => ({ ...prev, showOnlineStatus: !prev.showOnlineStatus }))}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                privacySettings.showOnlineStatus ? 'bg-primary' : 'bg-gray-200 dark:bg-gray-600'
              }`}
            >
              <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                privacySettings.showOnlineStatus ? 'translate-x-6' : 'translate-x-1'
              }`} />
            </button>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-medium text-gray-900 dark:text-white">Direkt Mesajlar</h3>
              <p className="text-xs text-gray-500 dark:text-gray-400">Diğer kullanıcılar size direkt mesaj gönderebilir</p>
            </div>
            <button
              onClick={() => setPrivacySettings(prev => ({ ...prev, allowDirectMessages: !prev.allowDirectMessages }))}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                privacySettings.allowDirectMessages ? 'bg-primary' : 'bg-gray-200 dark:bg-gray-600'
              }`}
            >
              <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                privacySettings.allowDirectMessages ? 'translate-x-6' : 'translate-x-1'
              }`} />
            </button>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-medium text-gray-900 dark:text-white">Mention'lar</h3>
              <p className="text-xs text-gray-500 dark:text-gray-400">Diğer kullanıcılar sizi mention edebilir</p>
            </div>
            <button
              onClick={() => setPrivacySettings(prev => ({ ...prev, allowMentions: !prev.allowMentions }))}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                privacySettings.allowMentions ? 'bg-primary' : 'bg-gray-200 dark:bg-gray-600'
              }`}
            >
              <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                privacySettings.allowMentions ? 'translate-x-6' : 'translate-x-1'
              }`} />
            </button>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Mesaj Geçmişi
            </label>
            <select
              value={privacySettings.messageHistory}
              onChange={(e) => setPrivacySettings(prev => ({ ...prev, messageHistory: e.target.value as any }))}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
            >
              <option value="7days">7 gün</option>
              <option value="30days">30 gün</option>
              <option value="90days">90 gün</option>
              <option value="forever">Süresiz</option>
            </select>
          </div>

          <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
            <button
              onClick={clearMessageHistory}
              className="w-full px-4 py-2 text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 border border-red-300 dark:border-red-600 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
            >
              Mesaj Geçmişini Temizle
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  const renderBlockedUsers = () => (
    <div className="p-4 space-y-3">
      <h3 className="text-sm font-medium text-gray-900 dark:text-white">Engellenen Kullanıcılar</h3>
      {blockedUsers.length === 0 ? (
        <p className="text-xs text-gray-500 dark:text-gray-400">Engellenen kullanıcı yok</p>
      ) : (
        <div className="space-y-2">
          {employees
            .filter(emp => blockedUsers.includes(emp.id))
            .map((user) => (
              <div key={user.id} className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <div className="flex items-center space-x-2">
                  <div className="w-6 h-6 bg-primary text-white rounded-full flex items-center justify-center text-xs font-medium">
                    {user.avatar}
                  </div>
                  <span className="text-sm text-gray-900 dark:text-white">{user.name}</span>
                </div>
                <button
                  onClick={() => unblockUser(user.id)}
                  className="text-xs text-primary hover:text-primary-600"
                >
                  Engeli Kaldır
                </button>
              </div>
            ))}
        </div>
      )}
    </div>
  );

  const toggleIntegration = (integration: keyof typeof integrations) => {
    setIntegrations(prev => ({ ...prev, [integration]: !prev[integration] }));
    toast.success(`${integration === 'calendar' ? 'Takvim' : integration === 'tasks' ? 'Görevler' : 'Dosya Depolama'} entegrasyonu ${integrations[integration] ? 'devre dışı' : 'etkin'} bırakıldı`);
  };



  const shareFile = (file: File) => {
    toast.success(`${file.name} dosyası paylaşıldı`);
    // Dosya paylaşım entegrasyonu burada olacak
  };

  const createTask = (title: string, assignee: string) => {
    toast.success(`${assignee} için "${title}" görevi oluşturuldu`);
    // Görev yönetimi entegrasyonu burada olacak
  };

  const renderIntegrationsPanel = () => (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white dark:bg-gray-700 rounded-lg shadow-xl w-full max-w-2xl mx-4">
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Entegrasyonlar</h2>
          <button
            onClick={() => setShowIntegrations(false)}
            className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="p-6 space-y-6">
          {/* Takvim Entegrasyonu */}
          <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <div className="flex items-center space-x-3">
              <Calendar className="w-8 h-8 text-blue-500" />
              <div>
                <h3 className="text-sm font-medium text-gray-900 dark:text-white">Takvim Entegrasyonu</h3>
                <p className="text-xs text-gray-500 dark:text-gray-400">Toplantı hatırlatmaları ve takvim senkronizasyonu</p>
              </div>
            </div>
            <button
              onClick={() => toggleIntegration('calendar')}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                integrations.calendar ? 'bg-primary' : 'bg-gray-200 dark:bg-gray-600'
              }`}
            >
              <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                integrations.calendar ? 'translate-x-6' : 'translate-x-1'
              }`} />
            </button>
          </div>

          {/* Görev Yönetimi */}
          <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <div className="flex items-center space-x-3">
              <Target className="w-8 h-8 text-green-500" />
              <div>
                <h3 className="text-sm font-medium text-gray-900 dark:text-white">Görev Yönetimi</h3>
                <p className="text-xs text-gray-500 dark:text-gray-400">Görev oluşturma ve takip</p>
              </div>
            </div>
            <button
              onClick={() => toggleIntegration('tasks')}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                integrations.tasks ? 'bg-primary' : 'bg-gray-200 dark:bg-gray-600'
              }`}
            >
              <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                integrations.tasks ? 'translate-x-6' : 'translate-x-1'
              }`} />
            </button>
          </div>

          {/* Dosya Depolama */}
          <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <div className="flex items-center space-x-3">
              <File className="w-8 h-8 text-purple-500" />
              <div>
                <h3 className="text-sm font-medium text-gray-900 dark:text-white">Dosya Depolama</h3>
                <p className="text-xs text-gray-500 dark:text-gray-400">Google Drive, OneDrive entegrasyonu</p>
              </div>
            </div>
            <button
              onClick={() => toggleIntegration('drive')}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                integrations.drive ? 'bg-primary' : 'bg-gray-200 dark:bg-gray-600'
              }`}
            >
              <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                integrations.drive ? 'translate-x-6' : 'translate-x-1'
              }`} />
            </button>
          </div>



          {/* Toplantı Hatırlatmaları */}
          {integrations.calendar && meetingReminders.length > 0 && (
            <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
              <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-3">Yaklaşan Toplantılar</h3>
              <div className="space-y-2">
                {meetingReminders.map((meeting) => (
                  <div key={meeting.id} className="flex items-center justify-between p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                    <div>
                      <h4 className="text-sm font-medium text-gray-900 dark:text-white">{meeting.title}</h4>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {format(meeting.time, 'dd.MM.yyyy HH:mm', { locale: tr })} • {meeting.participants.length} katılımcı
                      </p>
                    </div>
                    <button
                      onClick={() => toast.success('Toplantıya katılım başlatılıyor...')}
                      className="px-3 py-1 text-xs bg-primary text-white rounded hover:bg-primary-600"
                    >
                      Katıl
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  const generateAnalytics = () => {
    // Mock analitik verileri
    const mockData = {
      totalMessages: messages.length,
      activeUsers: onlineEmployees.length,
      popularChannels: [
        { name: 'genel', messageCount: 45 },
        { name: 'ik', messageCount: 23 },
        { name: 'teknoloji', messageCount: 18 },
        { name: 'satış', messageCount: 12 }
      ],
      messageTrends: [
        { date: 'Pazartesi', count: 15 },
        { date: 'Salı', count: 22 },
        { date: 'Çarşamba', count: 18 },
        { date: 'Perşembe', count: 25 },
        { date: 'Cuma', count: 20 }
      ],
      topUsers: [
        { name: 'Ahmet Yılmaz', messageCount: 34 },
        { name: 'Fatma Demir', messageCount: 28 },
        { name: 'Mehmet Kaya', messageCount: 22 },
        { name: 'Ayşe Özkan', messageCount: 19 }
      ]
    };
    setAnalyticsData(mockData);
  };

  const exportReport = (type: 'pdf' | 'excel' | 'csv') => {
    toast.success(`${type.toUpperCase()} raporu indiriliyor...`);
    // Rapor indirme işlemi burada olacak
  };

  const renderAnalyticsPanel = () => (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white dark:bg-gray-700 rounded-lg shadow-xl w-full max-w-6xl max-h-[90vh] mx-4 flex flex-col">
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Analitik ve Raporlar</h2>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => generateAnalytics()}
              className="px-3 py-1 text-sm bg-primary text-white rounded hover:bg-primary-600"
            >
              Yenile
            </button>
            <button
              onClick={() => setShowAnalytics(false)}
              className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-lg"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
        
        <div className="flex-1 overflow-y-auto p-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Genel İstatistikler */}
            <div className="space-y-4">
              <h3 className="text-md font-medium text-gray-900 dark:text-white">Genel İstatistikler</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-primary">{analyticsData.totalMessages}</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Toplam Mesaj</div>
                </div>
                <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-primary">{analyticsData.activeUsers}</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Aktif Kullanıcı</div>
                </div>
              </div>
            </div>

            {/* Popüler Kanallar */}
            <div className="space-y-4">
              <h3 className="text-md font-medium text-gray-900 dark:text-white">Popüler Kanallar</h3>
              <div className="space-y-2">
                {analyticsData.popularChannels.map((channel, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <div className="flex items-center space-x-2">
                      <span className="text-sm font-medium text-gray-900 dark:text-white">#{channel.name}</span>
                    </div>
                    <span className="text-sm text-gray-600 dark:text-gray-400">{channel.messageCount} mesaj</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Mesaj Trendleri */}
            <div className="space-y-4">
              <h3 className="text-md font-medium text-gray-900 dark:text-white">Mesaj Trendleri</h3>
              <div className="space-y-2">
                {analyticsData.messageTrends.map((trend, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <span className="text-sm text-gray-900 dark:text-white">{trend.date}</span>
                    <div className="flex items-center space-x-2">
                      <div className="w-20 h-2 bg-gray-200 dark:bg-gray-600 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-primary transition-all duration-300"
                          style={{ width: `${(trend.count / 25) * 100}%` }}
                        />
                      </div>
                      <span className="text-sm text-gray-600 dark:text-gray-400">{trend.count}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* En Aktif Kullanıcılar */}
            <div className="space-y-4">
              <h3 className="text-md font-medium text-gray-900 dark:text-white">En Aktif Kullanıcılar</h3>
              <div className="space-y-2">
                {analyticsData.topUsers.map((user, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <div className="flex items-center space-x-2">
                      <span className="text-sm font-medium text-gray-900 dark:text-white">{user.name}</span>
                    </div>
                    <span className="text-sm text-gray-600 dark:text-gray-400">{user.messageCount} mesaj</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Rapor İndirme */}
          <div className="mt-6 border-t border-gray-200 dark:border-gray-700 pt-4">
            <h3 className="text-md font-medium text-gray-900 dark:text-white mb-3">Rapor İndir</h3>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => exportReport('pdf')}
                className="px-4 py-2 text-sm bg-red-500 text-white rounded hover:bg-red-600"
              >
                PDF
              </button>
              <button
                onClick={() => exportReport('excel')}
                className="px-4 py-2 text-sm bg-green-500 text-white rounded hover:bg-green-600"
              >
                Excel
              </button>
              <button
                onClick={() => exportReport('csv')}
                className="px-4 py-2 text-sm bg-blue-500 text-white rounded hover:bg-blue-600"
              >
                CSV
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    document.documentElement.classList.toggle('dark', newTheme === 'dark');
    toast.success(`${newTheme === 'dark' ? 'Koyu' : 'Açık'} tema etkinleştirildi`);
  };

  const saveDraft = (channelId: string, content: string) => {
    if (content.trim()) {
      setDraftMessages(prev => ({ ...prev, [channelId]: content }));
    }
  };

  const loadDraft = (channelId: string) => {
    const draft = draftMessages[channelId];
    if (draft) {
      setNewMessage(draft);
      setDraftMessages(prev => {
        const newDrafts = { ...prev };
        delete newDrafts[channelId];
        return newDrafts;
      });
      toast.success('Taslak mesaj yüklendi');
    }
  };

  const handleKeyboardShortcut = (e: KeyboardEvent) => {
    if (e.ctrlKey && e.key === 'k') {
      e.preventDefault();
      setShowAdvancedSearch(true);
    } else if (e.ctrlKey && e.key === 'e') {
      e.preventDefault();
      setShowEmojiPicker(true);
    }
  };

  useEffect(() => {
    document.addEventListener('keydown', handleKeyboardShortcut);
    return () => document.removeEventListener('keydown', handleKeyboardShortcut);
  }, []);

  const renderThemeToggle = () => (
    <button
      onClick={toggleTheme}
      className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-lg transition-colors"
      title={theme === 'light' ? 'Koyu temaya geç' : 'Açık temaya geç'}
    >
      {theme === 'light' ? (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
        </svg>
      ) : (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
        </svg>
      )}
    </button>
  );

  const renderNotificationsPanel = () => {
    if (!showNotifications) return null;

    return (
      <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black bg-opacity-50">
        <div className="bg-white dark:bg-gray-700 rounded-lg shadow-xl w-full max-w-md mx-4 max-h-[80vh] overflow-hidden">
          <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Bildirimler</h2>
            <button
              onClick={() => setShowNotifications(false)}
              className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-lg"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          
          <div className="p-6 overflow-y-auto max-h-[60vh]">
            {unreadNotifications > 0 ? (
              <div className="space-y-4">
                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                  <div className="flex items-center space-x-3">
                    <Bell className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                    <div>
                      <h3 className="text-sm font-medium text-blue-900 dark:text-blue-100">
                        Yeni Mesaj Bildirimi
                      </h3>
                      <p className="text-xs text-blue-700 dark:text-blue-300">
                        {unreadNotifications} okunmamış mesajınız var
                      </p>
                    </div>
                  </div>
                </div>
                
                <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
                  <div className="flex items-center space-x-3">
                    <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
                    <div>
                      <h3 className="text-sm font-medium text-green-900 dark:text-green-100">
                        Sistem Bildirimi
                      </h3>
                      <p className="text-xs text-green-700 dark:text-green-300">
                        Sistem güncellemeleri ve önemli duyurular
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <Bell className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500 dark:text-gray-400">
                  Henüz bildiriminiz yok
                </p>
              </div>
            )}
          </div>
          
          <div className="p-6 border-t border-gray-200 dark:border-gray-700">
            <button
              onClick={() => {
                setUnreadNotifications(0);
                setShowNotifications(false);
                toast.success('Tüm bildirimler okundu olarak işaretlendi');
              }}
              className="w-full px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-600 transition-colors"
            >
              Tümünü Okundu İşaretle
            </button>
          </div>
        </div>
      </div>
    );
  };

  const renderDraftIndicator = () => {
    const hasDrafts = Object.keys(draftMessages).length > 0;
    if (!hasDrafts) return null;

    return (
      <div className="fixed bottom-4 right-4 z-40">
        <div className="bg-yellow-100 dark:bg-yellow-900 border border-yellow-300 dark:border-yellow-700 rounded-lg p-3 shadow-lg">
          <div className="flex items-center space-x-2">
            <span className="text-yellow-800 dark:text-yellow-200 text-sm">
              {Object.keys(draftMessages).length} taslak mesaj
            </span>
            <button
              onClick={() => setDraftMessages({})}
              className="text-yellow-600 dark:text-yellow-400 hover:text-yellow-800 dark:hover:text-yellow-200 text-xs"
            >
              Temizle
            </button>
          </div>
        </div>
      </div>
    );
  };

  const createPoll = (question: string, options: string[]) => {
    const newPoll = {
      id: `poll_${Date.now()}`,
      question,
      options: options.map(option => ({ text: option, votes: 0, voters: [] })),
      createdBy: currentUserId,
      createdAt: new Date(),
      isActive: true
    };
    setPolls(prev => [...prev, newPoll]);
    toast.success('Anket oluşturuldu');
  };

  const votePoll = (pollId: string, optionIndex: number) => {
    setPolls(prev => prev.map(poll => {
      if (poll.id === pollId) {
        const newOptions = poll.options.map((option, index) => {
          if (index === optionIndex) {
            const hasVoted = option.voters.includes(currentUserId);
            if (hasVoted) {
              return { ...option, votes: option.votes - 1, voters: option.voters.filter(v => v !== currentUserId) };
            } else {
              return { ...option, votes: option.votes + 1, voters: [...option.voters, currentUserId] };
            }
          }
          return option;
        });
        return { ...poll, options: newOptions };
      }
      return poll;
    }));
  };

  const useTemplate = (template: { content: string }) => {
    setNewMessage(template.content);
    setShowTemplates(false);
    toast.success('Şablon kullanıldı');
  };

  const renderPollCreator = () => (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white dark:bg-gray-700 rounded-lg shadow-xl w-full max-w-md mx-4">
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Anket Oluştur</h2>
          <button
            onClick={() => setShowPolls(false)}
            className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Soru
            </label>
            <input
              type="text"
              placeholder="Anket sorusunu yazın..."
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Seçenekler
            </label>
            <div className="space-y-2">
              {[1, 2, 3, 4].map((index) => (
                <input
                  key={index}
                  type="text"
                  placeholder={`Seçenek ${index}`}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                />
              ))}
            </div>
          </div>
        </div>
        
        <div className="flex items-center justify-end space-x-3 p-6 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={() => setShowPolls(false)}
            className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors"
          >
            İptal
          </button>
          <button
            onClick={() => createPoll('Örnek soru', ['Seçenek 1', 'Seçenek 2', 'Seçenek 3', 'Seçenek 4'])}
            className="px-4 py-2 bg-primary hover:bg-primary-600 text-white text-sm font-medium rounded-lg transition-colors"
          >
            Anket Oluştur
          </button>
        </div>
      </div>
    </div>
  );

  const renderTemplatesPanel = () => (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white dark:bg-gray-700 rounded-lg shadow-xl w-full max-w-2xl mx-4">
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Mesaj Şablonları</h2>
          <button
            onClick={() => setShowTemplates(false)}
            className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {messageTemplates.map((template) => (
              <div key={template.id} className="p-4 border border-gray-200 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer transition-colors">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-medium text-gray-900 dark:text-white">{template.title}</h3>
                  <span className="text-xs text-gray-500 dark:text-gray-400">{template.category}</span>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">{template.content}</p>
                <button
                  onClick={() => useTemplate(template)}
                  className="text-xs text-primary hover:text-primary-600"
                >
                  Kullan
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  // Bildirim gönderme fonksiyonu - Dashboard bildirimleriyle senkronize
  const sendNotification = (notification: {
    type: 'message' | 'mention' | 'reaction' | 'channel';
    title: string;
    message: string;
    channelId?: string;
    messageId?: string;
  }) => {
    // Dashboard bildirimlerine gönder
    if (onNotification) {
      onNotification({
        id: `chat_${Date.now()}`,
        title: notification.title,
        message: notification.message,
        type: notification.type,
        created_at: new Date().toISOString(),
        is_read: false
      });
    }
  };

  // Mention sistemi fonksiyonları
  const handleMentionInput = (value: string, cursorPosition: number) => {
    const beforeCursor = value.substring(0, cursorPosition);
    const mentionMatch = beforeCursor.match(/@(\w*)$/);
    
    if (mentionMatch) {
      const query = mentionMatch[1].toLowerCase();
      setMentionQuery(query);
      setMentionPosition({ 
        start: beforeCursor.lastIndexOf('@'), 
        end: cursorPosition 
      });
      
      // Çalışanları filtrele
      const filtered = employees.filter(emp => 
        emp.name.toLowerCase().includes(query) ||
        emp.name.toLowerCase().replace(/\s+/g, '').includes(query) ||
        emp.name.toLowerCase().replace(/\s+/g, '').replace(/[çğıöşü]/g, (match) => {
          const replacements: { [key: string]: string } = {
            'ç': 'c', 'ğ': 'g', 'ı': 'i', 'ö': 'o', 'ş': 's', 'ü': 'u'
          };
          return replacements[match] || match;
        }).includes(query)
      );
      
      setFilteredEmployees(filtered);
      setShowMentionSuggestions(filtered.length > 0);
    } else {
      setShowMentionSuggestions(false);
    }
  };

  const selectMention = (employee: Employee) => {
    const beforeMention = newMessage.substring(0, mentionPosition.start);
    const afterMention = newMessage.substring(mentionPosition.end);
    const mentionText = `@${employee.name}`;
    
    setNewMessage(beforeMention + mentionText + afterMention);
    setShowMentionSuggestions(false);
    setCharacterCount(beforeMention.length + mentionText.length + afterMention.length);
    
    // Input'a focus ol
    setTimeout(() => {
      const input = document.getElementById('message-input') as HTMLTextAreaElement;
      if (input) {
        const newPosition = beforeMention.length + mentionText.length;
        input.focus();
        input.setSelectionRange(newPosition, newPosition);
      }
    }, 0);
  };

  // Kullanıcı adı otomatik oluşturma
  const generateUsername = (fullName: string): string => {
    return fullName
      .toLowerCase()
      .replace(/[çğıöşü]/g, (match) => {
        const replacements: { [key: string]: string } = {
          'ç': 'c', 'ğ': 'g', 'ı': 'i', 'ö': 'o', 'ş': 's', 'ü': 'u'
        };
        return replacements[match] || match;
      })
      .replace(/\s+/g, '')
      .replace(/[^a-z0-9]/g, '');
  };

  return (
    <div className={`flex h-screen bg-gray-50 dark:bg-gray-900 overflow-hidden relative p-4 pt-8 ${className}`}>
      {/* Sol Sidebar - Kanallar */}
      <div className={`${showChannelList ? 'flex-shrink-0' : 'hidden lg:flex-shrink-0'} ${showChannelList ? 'block' : 'hidden lg:block'}`}>
        {renderChannelList()}
      </div>

      {/* Orta Alan - Chat */}
      <div className="flex-1 flex flex-col min-w-0 mx-2">
        {activeView === 'channels' && renderChatArea()}
        {activeView === 'direct' && (selectedEmployee || selectedChannel) && renderChatArea()}
        {activeView === 'search' && renderSearchResults()}
      </div>

      {/* Sağ Sidebar - Üyeler */}
      <div className={`${showMemberList ? 'flex-shrink-0' : 'hidden lg:flex-shrink-0'} ${showMemberList ? 'block' : 'hidden lg:block'}`}>
        {renderMemberList()}
      </div>

      {/* Mobil Menü Butonları */}
      <div className="lg:hidden fixed bottom-4 right-4 z-50 flex flex-col space-y-2">
        {!showChannelList && (
          <button
            onClick={() => setShowChannelList(true)}
            className="p-3 bg-primary text-white rounded-full shadow-lg hover:bg-primary-600 transition-colors"
            title="Kanalları göster"
          >
            <Hash className="w-5 h-5" />
          </button>
        )}
        {!showMemberList && (
          <button
            onClick={() => setShowMemberList(true)}
            className="p-3 bg-primary text-white rounded-full shadow-lg hover:bg-primary-600 transition-colors"
            title="Üyeleri göster"
          >
            <Users className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Mobil Overlay - Sidebar'ları kapatmak için */}
      {(showChannelList || showMemberList) && (
        <div 
          className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-40"
          onClick={() => {
            setShowChannelList(false);
            setShowMemberList(false);
          }}
        />
      )}

      {/* Kanal Oluşturma Modal */}
      {showCreateChannel && renderCreateChannelModal()}

      {/* Emoji Picker */}
      {showEmojiPicker && renderEmojiPicker()}

      {/* Çalışan Menüsü */}
      {renderEmployeeMenu()}

      {/* Dosya Önizleme Modal */}
      {filePreview && renderFilePreview()}

      {/* Gelişmiş Arama Modal */}
      {showAdvancedSearch && renderAdvancedSearchModal()}

      {/* Pinlenmiş Mesajlar Modal */}
      {showPinnedMessages && renderPinnedMessages()}

      {/* Favori Mesajlar Modal */}
      {showFavorites && renderFavoritesPanel()}

      {/* Kanal Ayarları Modal */}
      {showChannelSettings && renderChannelSettings()}

      {/* Üye Davet Et Modal */}
      {showInviteModal && renderInviteModal()}

      {/* Gizlilik Ayarları Modal */}
      {showPrivacySettings && renderPrivacySettings()}

      {/* Engellenen Kullanıcılar Modal */}
      {renderBlockedUsers()}

      {/* Entegrasyonlar Modal */}
      {showIntegrations && renderIntegrationsPanel()}

      {/* Analitik ve Raporlar Modal */}
      {showAnalytics && renderAnalyticsPanel()}

      {/* Anket Oluşturma Modal */}
      {showPolls && renderPollCreator()}

      {/* Mesaj Şablonları Modal */}
      {showTemplates && renderTemplatesPanel()}

      {/* Bildirimler Panel */}
      {renderNotificationsPanel()}

      {/* Taslak Mesaj İndicator */}
      {renderDraftIndicator()}
    </div>
  );
};

export default EmployeeChat;