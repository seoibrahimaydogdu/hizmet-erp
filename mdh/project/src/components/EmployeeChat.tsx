import React, { useState, useEffect, useRef } from 'react';
import { Settings, Bell, Moon, Sun } from 'lucide-react';
import toast from 'react-hot-toast';
import { useNavigate, useLocation } from 'react-router-dom';
import { useSupabase } from '../hooks/useSupabase';
import ChannelList from './chat/ChannelList';
import MessageList from './chat/MessageList';
import MessageInput from './chat/MessageInput';
import { 
  ChatMessage, 
  Channel, 
  VoiceMessage, 
  FileMessage,
  AutoCategorization,
  WorkflowRule,
  AutoResponse,
  SemanticSearch,
  AdvancedSearchResults,
  UserPreferences
} from './chat/types';
import { useTheme } from '../contexts/ThemeContext';
import { useNotifications } from '../contexts/NotificationContext';
import { useUIUX } from '../contexts/UIUXContext';
import FeedbackButton from './common/FeedbackButton';
import NotificationPanel from './notifications/NotificationPanel';
import UIUXSettingsPanel from './uiux/UIUXSettingsPanel';
import DataMigration from './DataMigration';
import { useLoading } from '../hooks/useLoading';
import { 
  InlineLoading 
} from './common/ProgressIndicator';
import ErrorBoundary from './common/ErrorBoundary';

// Yeni interface'ler
interface Poll {
  id: string;
  question: string;
  options: string[];
  votes: { [option: string]: number };
  createdBy: string;
  createdAt: Date;
  expiresAt?: Date;
  isActive: boolean;
  channelId: string;
}

interface MessageTemplate {
  id: string;
  name: string;
  content: string;
  category: string;
  createdBy: string;
  isPublic: boolean;
  usageCount: number;
}

interface Task {
  id: string;
  title: string;
  description: string;
  assignedTo: string[];
  dueDate: Date;
  priority: 'low' | 'medium' | 'high';
  status: 'pending' | 'in_progress' | 'completed';
  createdFromMessage: string;
  channelId: string;
}

interface ConversationSummary {
  id: string;
  channelId: string;
  summary: string;
  keyPoints: string[];
  actionItems: string[];
  participants: string[];
  createdAt: Date;
  messageCount: number;
}

interface AdvancedSearchFilter {
  dateRange: { start: Date | null; end: Date | null };
  sender: string[];
  messageType: string[];
  hasAttachments: boolean;
  hasMentions: boolean;
  keywords: string[];
}

// Gerçek zamanlı bildirimler ve okundu durumu için interface'ler
interface MessageReadStatus {
  messageId: string;
  readBy: string[];
  readAt: { [userId: string]: Date };
  unreadBy: string[];
}

interface TypingIndicator {
  userId: string;
  userName: string;
  channelId: string;
  isTyping: boolean;
  lastTypingTime: Date;
}

interface RealTimeNotification {
  id: string;
  type: 'message' | 'reaction' | 'mention' | 'file' | 'typing';
  channelId: string;
  senderId: string;
  senderName: string;
  messageId?: string;
  content?: string;
  timestamp: Date;
  isRead: boolean;
}

// UserItem Component
const UserItem: React.FC<{ 
  user: any; 
  channels: Channel[]; 
  setChannels: React.Dispatch<React.SetStateAction<Channel[]>>;
  setSelectedChannel: React.Dispatch<React.SetStateAction<Channel | null>>;
  userStatus?: 'online' | 'away' | 'busy' | 'offline';
  customStatus?: string;
  lastSeen?: Date;
}> = ({ user, channels, setChannels, setSelectedChannel, userStatus = 'online', customStatus, lastSeen }) => {
  const [showMenu, setShowMenu] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const getSimpleStatusColor = (status: string) => {
    switch (status) {
      case 'green': return 'bg-green-500';
      case 'yellow': return 'bg-yellow-500';
      case 'gray': return 'bg-gray-400';
      default: return 'bg-gray-400';
    }
  };

  const handleUserAction = (action: string) => {
    switch (action) {
      case 'message':
        // Create DM channel and switch to it
        const dmChannel: Channel = {
          id: `dm-${user.id}`,
          name: user.name,
          description: `Direkt mesajlaşma - ${user.title}`,
          type: 'direct',
          members: [user.id, 'current-user'],
          lastMessage: undefined,
          unreadCount: 0,
          isPinned: false
        };
        
        // Add to channels if not exists
        if (!channels.find((ch: Channel) => ch.id === dmChannel.id)) {
          setChannels((prev: Channel[]) => [...prev, dmChannel]);
        }
        
        // Select the DM channel
        setSelectedChannel(dmChannel);
        setShowMenu(false);
        break;
      case 'profile':
        // Navigate to EmployeeProfile with navigation state
        navigate('/employee-profile', { 
          state: { 
            employeeId: user.id, 
            employeeName: user.name,
            from: location.pathname 
          } 
        });
        setShowMenu(false);
        break;
      case 'call':
        toast.success(`${user.name} aranıyor...`);
        break;
      case 'video':
        toast.success(`${user.name} ile video görüşme başlatılıyor...`);
        break;
      case 'email':
        toast.success(`${user.name} e-posta gönderiliyor...`);
        break;
      case 'schedule':
        toast.success(`${user.name} ile toplantı planlanıyor...`);
        break;
    }
    setShowMenu(false);
  };

  return (
    <div className="relative">
      <div className="flex items-center space-x-3 p-2 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg group">
        <div className={`w-8 h-8 ${user.color} rounded-full flex items-center justify-center`}>
          <span className="text-white text-xs font-semibold">{user.avatar}</span>
        </div>
                  <div className="flex-1">
            <span className="text-sm text-gray-900 dark:text-white font-medium">{user.name}</span>
            <p className="text-xs text-gray-500 dark:text-gray-300">{user.title}</p>
            {customStatus && (
              <p className="text-xs text-blue-600 dark:text-blue-400 italic">{customStatus}</p>
            )}
            {userStatus === 'offline' && lastSeen && (
              <p className="text-xs text-gray-400">Son görülme: {(() => {
                const now = new Date();
                const diff = now.getTime() - lastSeen.getTime();
                const minutes = Math.floor(diff / (1000 * 60));
                const hours = Math.floor(diff / (1000 * 60 * 60));
                const days = Math.floor(diff / (1000 * 60 * 60 * 24));

                if (minutes < 1) return 'Az önce';
                if (minutes < 60) return `${minutes} dakika önce`;
                if (hours < 24) return `${hours} saat önce`;
                return `${days} gün önce`;
              })()}</p>
            )}
          </div>
        <div className={`w-2 h-2 ${getSimpleStatusColor(userStatus)} rounded-full`}></div>
        
        {/* Menu Button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            setShowMenu(!showMenu);
          }}
          className="p-0.5 text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100 rounded opacity-0 group-hover:opacity-100 transition-opacity"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
          </svg>
        </button>
      </div>

      {/* Dropdown Menu */}
      {showMenu && (
        <div className="absolute right-0 top-full mt-1 w-48 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-10">
          <div className="py-1">
            <button
              onClick={() => handleUserAction('message')}
              className="w-full text-left px-3 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center space-x-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
              <span>Mesaj Gönder</span>
            </button>
            
            <button
              onClick={() => handleUserAction('profile')}
              className="w-full text-left px-3 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center space-x-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              <span>Profili Görüntüle</span>
            </button>
            
            
            <button
              onClick={() => handleUserAction('video')}
              className="w-full text-left px-3 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center space-x-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
              <span>Video Görüşme</span>
            </button>
            
            <button
              onClick={() => handleUserAction('email')}
              className="w-full text-left px-3 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center space-x-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              <span>E-posta Gönder</span>
            </button>
            
            <button
              onClick={() => handleUserAction('schedule')}
              className="w-full text-left px-3 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center space-x-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <span>Toplantı Planla</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

function EmployeeChat() {
  const navigate = useNavigate();
  const location = useLocation();
  const { supabase } = useSupabase();
  const { isDarkMode, toggleDarkMode } = useTheme();
  const { addNotification, unreadCount, clearAllNotifications, markAsRead, notifications } = useNotifications();
  const { user, migrateFromLocalStorage } = useSupabase();
  const { settings, state, updateState, updateSettings } = useUIUX();
  
  // Yeni loading sistemi
  const { executeWithLoading, isLoading } = useLoading();
  
  // Bildirim ve UI/UX state'leri
  const [showNotificationPanel, setShowNotificationPanel] = useState(false);
  const [showUIUXSettings, setShowUIUXSettings] = useState(false);
  
  // State'ler
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [channels, setChannels] = useState<Channel[]>([]);
  const [selectedChannel, setSelectedChannel] = useState<Channel | null>(null);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Yanıtla özelliği için state'ler
  const [replyingTo, setReplyingTo] = useState<ChatMessage | null>(null);
  const [replyContent, setReplyContent] = useState('');

  // Mesaj düzenleme
  const [editingMessage, setEditingMessage] = useState<string | null>(null);
  const [showActionMenu, setShowActionMenu] = useState<string | null>(null);

  // Sesli mesajlar
  const [voiceMessages, setVoiceMessages] = useState<VoiceMessage[]>([]);
  const [isRecording, setIsRecording] = useState(false);
  const [audioChunks, setAudioChunks] = useState<Blob[]>([]);
  const [showVoiceRecorder, setShowVoiceRecorder] = useState(false);

  // Dosya yönetimi
  const [fileMessages, setFileMessages] = useState<FileMessage[]>([]);
  const [filePreview, setFilePreview] = useState<{ file: File; preview: string } | null>(null);
  const [filePreviewData, setFilePreviewData] = useState<{ file: File; type: string; content?: any } | null>(null);

  // Arama ve filtreleme
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'text' | 'files' | 'voice'>('all');
  const [isSearching, setIsSearching] = useState(false);
  const [advancedSearchResults, setAdvancedSearchResults] = useState<AdvancedSearchResults | null>(null);
  const [advancedSearchQuery, setAdvancedSearchQuery] = useState('');

  // Bildirimler
  const [unreadNotifications, setUnreadNotifications] = useState(0);

  // GERÇEK ZAMANLI ÖZELLİKLER İÇİN STATE'LER
  
  // Mesaj okundu durumu
  const [messageReadStatus, setMessageReadStatus] = useState<{ [messageId: string]: MessageReadStatus }>({});
  
  // Yazıyor göstergesi
  const [typingUsers, setTypingUsers] = useState<TypingIndicator[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [typingTimeout, setTypingTimeout] = useState<NodeJS.Timeout | null>(null);
  
  // Gerçek zamanlı bildirimler
  const [realTimeNotifications, setRealTimeNotifications] = useState<RealTimeNotification[]>([]);
  
  // Mesaj okundu bildirimleri
  const [readReceipts, setReadReceipts] = useState<{ [messageId: string]: { [userId: string]: Date } }>({});

  // YENİ ÖZELLİKLER İÇİN STATE'LER
  
  // Anket sistemi
  const [polls, setPolls] = useState<Poll[]>([]);
  const [showPollCreator, setShowPollCreator] = useState(false);
  const [pollForm, setPollForm] = useState({
    question: '',
    options: ['', ''],
    expiresAt: undefined as Date | undefined
  });
  const [pollVotes, setPollVotes] = useState<{[messageId: string]: {[optionIndex: number]: number}}>({});
  const [userVotes, setUserVotes] = useState<{[messageId: string]: {userId: string, optionIndex: number}}>({});

  // Mesaj şablonları
  const [messageTemplates, setMessageTemplates] = useState<MessageTemplate[]>([
    {
      id: '1',
      name: 'Selamlaşma',
      content: 'Merhaba! Nasılsınız? Bugün nasıl geçiyor?',
      category: 'genel',
      createdBy: 'user1',
      isPublic: true,
      usageCount: 0
    },
    {
      id: '2',
      name: 'Proje Güncellemesi',
      content: 'Proje durumu hakkında güncel bilgi verebilir misiniz? Hangi aşamadayız?',
      category: 'proje',
      createdBy: 'user1',
      isPublic: true,
      usageCount: 0
    }
  ]);
  const [showTemplateSelector, setShowTemplateSelector] = useState(false);
  const [showTemplateCreator, setShowTemplateCreator] = useState(false);
  const [templateForm, setTemplateForm] = useState({
    name: '',
    content: '',
    category: 'genel'
  });

  // Üretkenlik araçları (eski - kaldırıldı)

  // Gelişmiş arama ve filtreleme
  const [advancedSearchFilters, setAdvancedSearchFilters] = useState<AdvancedSearchFilter>({
    dateRange: { start: null, end: null },
    sender: 'all',
    messageType: 'all',
    hasAttachments: false,
    hasMentions: false,
    keywords: []
  });

  // UI/UX ayarlarını uygula
  const applyUIUXSettings = () => {
    // Font boyutu ayarları
    const fontSizeMap = { small: 'text-sm', medium: 'text-base', large: 'text-lg' };
    const fontSizeClass = fontSizeMap[settings.fontSize];
    
    // Mesaj aralığı ayarları
    const spacingMap = { tight: 'space-y-1', normal: 'space-y-2', loose: 'space-y-4' };
    const spacingClass = spacingMap[settings.messageSpacing];
    
    // Border radius ayarları
    const borderRadiusMap = { none: 'rounded-none', small: 'rounded', medium: 'rounded-lg', large: 'rounded-xl' };
    const borderRadiusClass = borderRadiusMap[settings.borderRadius];
    
    // Gölge ayarları
    const shadowMap = { none: 'shadow-none', subtle: 'shadow-sm', medium: 'shadow', strong: 'shadow-lg' };
    const shadowClass = shadowMap[settings.shadows];
    
    return {
      fontSizeClass,
      spacingClass,
      borderRadiusClass,
      shadowClass,
      animations: settings.animations,
      reducedMotion: settings.reducedMotion,
      highContrast: settings.highContrast,
      largeText: settings.largeText,
      focusIndicators: settings.focusIndicators
    };
  };

  const uiuxClasses = applyUIUXSettings();
  const [showAdvancedSearchPanel, setShowAdvancedSearchPanel] = useState(false);

  // UI/UX ayarlarını güncelle
  const handleUIUXSettingsUpdate = (newSettings: any) => {
    updateSettings(newSettings);
    // Ayarları localStorage'a kaydet
    localStorage.setItem('uiuxSettings', JSON.stringify({ ...settings, ...newSettings }));
  };

  // UI/UX ayarlarını sıfırla
  const handleUIUXSettingsReset = () => {
    const defaultSettings = {
      layout: 'default',
      sidebarCollapsed: false,
      sidebarWidth: 320,
      messageSpacing: 'normal',
      fontSize: 'medium',
      lineHeight: 'normal',
      borderRadius: 'medium',
      shadows: 'subtle',
      animations: true,
      animationSpeed: 'normal',
      reducedMotion: false,
      accentColor: '#3b82f6',
      colorScheme: 'blue',
      customColors: {
        primary: '#3b82f6',
        secondary: '#6b7280',
        accent: '#8b5cf6'
      },
      fontFamily: 'system',
      customFont: '',
      fontWeight: 'normal',
      highContrast: false,
      largeText: false,
      focusIndicators: true,
      screenReader: false,
      lazyLoading: true,
      virtualScrolling: false,
      imageOptimization: true,
      customCSS: '',
      customJS: ''
    };
    updateSettings(defaultSettings);
    localStorage.setItem('uiuxSettings', JSON.stringify(defaultSettings));
  };

  // Akıllı özetleme
  const [conversationSummaries, setConversationSummaries] = useState<ConversationSummary[]>([]);
  const [showSummary, setShowSummary] = useState(false);
  const [currentSummary, setCurrentSummary] = useState<ConversationSummary | null>(null);
  const [isGeneratingSummary, setIsGeneratingSummary] = useState(false);

  // Hızlı Aksiyonlar için state'ler
  const [showNewChannelModal, setShowNewChannelModal] = useState(false);
  const [showBulkMessageModal, setShowBulkMessageModal] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [newChannelForm, setNewChannelForm] = useState({
    name: '',
    description: '',
    type: 'public' as 'public' | 'private'
  });
  const [bulkMessageForm, setBulkMessageForm] = useState({
    message: '',
    selectedChannels: [] as string[],
    selectedUsers: [] as string[]
  });
  const [reportForm, setReportForm] = useState({
    title: '',
    type: 'activity' as 'activity' | 'performance' | 'engagement',
    dateRange: { 
      start: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7 gün önce
      end: new Date() 
    },
    includeCharts: true
  });

  // Ayarlar
  const [autoCategorization, setAutoCategorization] = useState<AutoCategorization>({
    enabled: true,
    categories: ['genel', 'proje', 'destek', 'satış', 'teknik'],
    keywords: {
      genel: ['merhaba', 'nasılsın', 'günaydın'],
      proje: ['proje', 'görev', 'deadline', 'planlama'],
      destek: ['yardım', 'sorun', 'hata', 'destek'],
      satış: ['satış', 'müşteri', 'fiyat', 'teklif'],
      teknik: ['teknik', 'kod', 'bug', 'sistem']
    }
  });

  const [workflowRules, setWorkflowRules] = useState<WorkflowRule[]>([]);
  const [autoResponses, setAutoResponses] = useState<AutoResponse[]>([]);
  const [semanticSearch, setSemanticSearch] = useState<SemanticSearch>({
    enabled: true,
    searchHistory: [],
    recentSearches: []
  });

  const [userPreferences, setUserPreferences] = useState<UserPreferences>({
    theme: 'auto',
    notifications: {
      enabled: true,
      sound: true,
      desktop: true,
      mentions: true,
      reactions: true
    },
    privacy: {
      showOnlineStatus: true,
      showLastSeen: true,
      allowMentions: true
    }
  });

  // Refs
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const editorRef = useRef<HTMLTextAreaElement>(null);

  // Mock data for initial setup
  const mockChannels: Channel[] = [
    {
      id: '1',
      name: 'genel',
      description: 'Tüm şirket duyuruları ve genel konular',
      type: 'public',
      members: ['user1', 'user2', 'user3'],
      lastMessage: 'Merhaba!',
      lastMessageTime: Date.now(),
      unreadCount: 0
    },
    {
      id: '2', 
      name: 'ik',
      description: 'İnsan kaynakları ve personel konuları',
      type: 'public',
      members: ['user1', 'user2'],
      lastMessage: 'Yeni iş ilanı eklendi',
      lastMessageTime: Date.now(),
      unreadCount: 2
    },
    {
      id: '3',
      name: 'teknoloji', 
      description: 'Teknoloji ve yazılım geliştirme',
      type: 'public',
      members: ['user1', 'user3'],
      lastMessage: 'Yeni framework kurulumu',
      lastMessageTime: Date.now(),
      unreadCount: 0
    },
    {
      id: '4',
      name: 'satış',
      description: 'Satış ve pazarlama stratejileri',
      type: 'public', 
      members: ['user1', 'user2'],
      lastMessage: 'Aylık satış raporu hazır',
      lastMessageTime: Date.now(),
      unreadCount: 1
    },
    {
      id: '5',
      name: 'e-ticaret-platformu',
      description: 'E-ticaret platformu geliştirme',
      type: 'public',
      members: ['user1', 'user3'],
      lastMessage: 'Yeni özellik eklendi',
      lastMessageTime: Date.now(),
      unreadCount: 0,
      isPinned: true
    }
  ];

  // Mock messages for each channel
  const mockMessagesByChannel: { [key: string]: ChatMessage[] } = {
    '1': [ // genel
      {
        id: '1-1',
        content: 'Merhaba! Nasılsınız?',
        senderId: 'user2',
        senderName: 'Ahmet Yılmaz',
        senderRole: 'employee',
        senderAvatar: 'AY',
        channelId: '1',
        messageType: 'text',
        timestamp: new Date(Date.now() - 1000 * 60 * 30) // 30 dakika önce
      },
      {
        id: '1-2',
        content: 'İyiyim, teşekkürler! Proje durumu nasıl?',
        senderId: 'user1',
        senderName: 'Test User',
        senderRole: 'employee',
        senderAvatar: 'TU',
        channelId: '1',
        messageType: 'text',
        timestamp: new Date(Date.now() - 1000 * 60 * 10) // 10 dakika önce
      },
      {
        id: '1-3',
        content: 'Haftalık toplantı yarın saat 10:00\'da',
        senderId: 'user3',
        senderName: 'Ayşe Çelik',
        senderRole: 'manager',
        senderAvatar: 'AÇ',
        channelId: '1',
        messageType: 'announcement',
        timestamp: new Date(Date.now() - 1000 * 60 * 5) // 5 dakika önce
      }
    ],
    '2': [ // ik
      {
        id: '2-1',
        content: 'Yeni iş ilanı eklendi: Senior Frontend Developer',
        senderId: 'user4',
        senderName: 'Aylin Doğan',
        senderRole: 'hr',
        senderAvatar: 'AD',
        channelId: '2',
        messageType: 'announcement',
        timestamp: new Date(Date.now() - 1000 * 60 * 45) // 45 dakika önce
      },
      {
        id: '2-2',
        content: 'Performans değerlendirmeleri bu hafta başlıyor',
        senderId: 'user4',
        senderName: 'Aylin Doğan',
        senderRole: 'hr',
        senderAvatar: 'AD',
        channelId: '2',
        messageType: 'announcement',
        timestamp: new Date(Date.now() - 1000 * 60 * 20) // 20 dakika önce
      },
      {
        id: '2-3',
        content: 'Yeni çalışan oryantasyonu pazartesi günü',
        senderId: 'user1',
        senderName: 'Test User',
        senderRole: 'employee',
        senderAvatar: 'TU',
        channelId: '2',
        messageType: 'text',
        timestamp: new Date(Date.now() - 1000 * 60 * 15) // 15 dakika önce
      }
    ],
    '3': [ // teknoloji
      {
        id: '3-1',
        content: 'React 18 güncellemesi tamamlandı',
        senderId: 'user2',
        senderName: 'Ahmet Yılmaz',
        senderRole: 'employee',
        senderAvatar: 'AY',
        channelId: '3',
        messageType: 'text',
        timestamp: new Date(Date.now() - 1000 * 60 * 60) // 1 saat önce
      },
      {
        id: '3-2',
        content: 'Yeni CI/CD pipeline kurulumu başarılı',
        senderId: 'user3',
        senderName: 'Ali Demir',
        senderRole: 'employee',
        senderAvatar: 'AD',
        channelId: '3',
        messageType: 'text',
        timestamp: new Date(Date.now() - 1000 * 60 * 30) // 30 dakika önce
      },
      {
        id: '3-3',
        content: 'Bug fix: Login sayfasındaki hata düzeltildi',
        senderId: 'user2',
        senderName: 'Ahmet Yılmaz',
        senderRole: 'employee',
        senderAvatar: 'AY',
        channelId: '3',
        messageType: 'text',
        timestamp: new Date(Date.now() - 1000 * 60 * 15) // 15 dakika önce
      }
    ],
    '4': [ // satış
      {
        id: '4-1',
        content: 'Aylık satış hedefimizi %120 aştık! 🎉',
        senderId: 'user5',
        senderName: 'Mehmet Kaya',
        senderRole: 'manager',
        senderAvatar: 'MK',
        channelId: '4',
        messageType: 'announcement',
        timestamp: new Date(Date.now() - 1000 * 60 * 90) // 1.5 saat önce
      },
      {
        id: '4-2',
        content: 'Yeni müşteri demo\'su yarın saat 14:00',
        senderId: 'user1',
        senderName: 'Test User',
        senderRole: 'employee',
        senderAvatar: 'TU',
        channelId: '4',
        messageType: 'text',
        timestamp: new Date(Date.now() - 1000 * 60 * 40) // 40 dakika önce
      },
      {
        id: '4-3',
        content: 'Pazarlama kampanyası sonuçları hazır',
        senderId: 'user5',
        senderName: 'Mehmet Kaya',
        senderRole: 'manager',
        senderAvatar: 'MK',
        channelId: '4',
        messageType: 'text',
        timestamp: new Date(Date.now() - 1000 * 60 * 25) // 25 dakika önce
      }
    ],
    '5': [ // e-ticaret-platformu
      {
        id: '5-1',
        content: 'Yeni ödeme sistemi entegrasyonu tamamlandı',
        senderId: 'user2',
        senderName: 'Ahmet Yılmaz',
        senderRole: 'employee',
        senderAvatar: 'AY',
        channelId: '5',
        messageType: 'text',
        timestamp: new Date(Date.now() - 1000 * 60 * 120) // 2 saat önce
      },
      {
        id: '5-2',
        content: 'Mobil uygulama beta testi başlıyor',
        senderId: 'user3',
        senderName: 'Ali Demir',
        senderRole: 'employee',
        senderAvatar: 'AD',
        channelId: '5',
        messageType: 'announcement',
        timestamp: new Date(Date.now() - 1000 * 60 * 60) // 1 saat önce
      },
      {
        id: '5-3',
        content: 'SEO optimizasyonu çalışmaları devam ediyor',
        senderId: 'user1',
        senderName: 'Test User',
        senderRole: 'employee',
        senderAvatar: 'TU',
        channelId: '5',
        messageType: 'text',
        timestamp: new Date(Date.now() - 1000 * 60 * 30) // 30 dakika önce
      }
    ],
    // DM kanalları için örnek mesajlar
    'dm-1': [ // Ahmet Yılmaz DM
      {
        id: 'dm-1-1',
        content: 'Merhaba! Proje hakkında konuşabilir miyiz?',
        senderId: 'user2',
        senderName: 'Ahmet Yılmaz',
        senderRole: 'employee',
        senderAvatar: 'AY',
        channelId: 'dm-1',
        messageType: 'text',
        timestamp: new Date(Date.now() - 1000 * 60 * 20) // 20 dakika önce
      }
    ],
    'dm-2': [ // Ayşe Çelik DM
      {
        id: 'dm-2-1',
        content: 'Toplantı notlarını gönderebilir misin?',
        senderId: 'user3',
        senderName: 'Ayşe Çelik',
        senderRole: 'manager',
        senderAvatar: 'AÇ',
        channelId: 'dm-2',
        messageType: 'text',
        timestamp: new Date(Date.now() - 1000 * 60 * 35) // 35 dakika önce
      }
    ],
    'dm-3': [ // Ali Demir DM
      {
        id: 'dm-3-1',
        content: 'Tasarım dosyalarını inceledim, çok güzel olmuş!',
        senderId: 'user3',
        senderName: 'Ali Demir',
        senderRole: 'employee',
        senderAvatar: 'AD',
        channelId: 'dm-3',
        messageType: 'text',
        timestamp: new Date(Date.now() - 1000 * 60 * 50) // 50 dakika önce
      }
    ],
    'dm-4': [ // Aylin Doğan DM
      {
        id: 'dm-4-1',
        content: 'İzin talebiniz onaylandı',
        senderId: 'user4',
        senderName: 'Aylin Doğan',
        senderRole: 'hr',
        senderAvatar: 'AD',
        channelId: 'dm-4',
        messageType: 'text',
        timestamp: new Date(Date.now() - 1000 * 60 * 15) // 15 dakika önce
      }
    ],
    'dm-5': [ // Mehmet Kaya DM
      {
        id: 'dm-5-1',
        content: 'Satış raporunu hazırladım, kontrol edebilir misin?',
        senderId: 'user5',
        senderName: 'Mehmet Kaya',
        senderRole: 'manager',
        senderAvatar: 'MK',
        channelId: 'dm-5',
        messageType: 'text',
        timestamp: new Date(Date.now() - 1000 * 60 * 25) // 25 dakika önce
      }
    ],
    'dm-6': [ // Fatma Özkan DM
      {
        id: 'dm-6-1',
        content: 'Muhasebe belgeleri hazır',
        senderId: 'user6',
        senderName: 'Fatma Özkan',
        senderRole: 'employee',
        senderAvatar: 'FÖ',
        channelId: 'dm-6',
        messageType: 'text',
        timestamp: new Date(Date.now() - 1000 * 60 * 40) // 40 dakika önce
      }
    ]
  };

  // Mesaj gönderme fonksiyonu
  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedChannel) return;

    const message: ChatMessage = {
      id: Date.now().toString(),
      content: newMessage,
      senderId: 'user1',
      senderName: 'Test User',
      senderRole: 'employee',
      senderAvatar: 'TU',
      channelId: selectedChannel.id,
      messageType: 'text',
      timestamp: new Date()
    };

    try {
      // Auto-categorization
      const category = autoCategorizeMessage(message);

      // Workflow rules
      const workflowResult = applyWorkflowRules(message);
      if (workflowResult) {
        await executeWorkflowAction(workflowResult);
      }

      // Auto-response check
      const autoResponse = checkAutoResponse(message);
      if (autoResponse) {
        setTimeout(() => {
          const responseMessage: ChatMessage = {
            id: Date.now().toString(),
            content: autoResponse.response,
            senderId: 'system',
            senderName: 'Sistem',
            senderRole: 'system',
            senderAvatar: 'S',
            channelId: selectedChannel.id,
            messageType: 'text',
            timestamp: new Date()
          };
          setMessages(prev => [...prev, responseMessage]);
        }, 1000);
      }

      setMessages(prev => [...prev, message]);
      setNewMessage('');
      
      // Takım mesajı senkronizasyonu için localStorage'a kaydet
      const teamMessage = {
        id: message.id,
        sender: message.senderName,
        message: message.content,
        time: message.timestamp.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' }),
        avatar: message.senderAvatar,
        timestamp: message.timestamp
      };
      
      const existingMessages = JSON.parse(localStorage.getItem('teamMessages') || '[]');
      existingMessages.push(teamMessage);
      localStorage.setItem('teamMessages', JSON.stringify(existingMessages));
      
      // AgentPortal'a event gönder
      window.dispatchEvent(new CustomEvent('teamMessageSent', { detail: teamMessage }));
      
      // Update channel last message
      setChannels(prev => prev.map(ch => 
        ch.id === selectedChannel.id 
          ? { ...ch, lastMessage: newMessage, lastMessageTime: Date.now() }
          : ch
      ));

      // Gerçek zamanlı özellikler: Mesaj okundu durumu başlat
      const messageReadStatus: MessageReadStatus = {
        messageId: message.id,
        readBy: ['user1'], // Gönderen kendisi okumuş sayılır
        readAt: { 'user1': new Date() },
        unreadBy: selectedChannel.members.filter(member => member !== 'user1')
      };
      
      setMessageReadStatus(prev => ({
        ...prev,
        [message.id]: messageReadStatus
      }));

      // Yazıyor göstergesini temizle
      setIsTyping(false);
      setTypingUsers(prev => prev.filter(t => t.userId !== 'user1' || t.channelId !== selectedChannel.id));

      // Gerçek zamanlı bildirim gönder
      const notification: RealTimeNotification = {
        id: Date.now().toString(),
        type: 'message',
        channelId: selectedChannel.id,
        senderId: 'user1',
        senderName: 'Test User',
        messageId: message.id,
        content: newMessage,
        timestamp: new Date(),
        isRead: false
      };
      
      setRealTimeNotifications(prev => [...prev, notification]);

      toast.success('Mesaj gönderildi');
    } catch (error) {
      console.error('Mesaj gönderilirken hata:', error);
      toast.error('Mesaj gönderilemedi');
    }
  };

  // Yanıt gönderme
  const sendReply = async () => {
    if (!replyContent.trim() || !replyingTo || !selectedChannel) return;

    const message: ChatMessage = {
      id: Date.now().toString(),
      content: replyContent,
      senderId: 'user1',
      senderName: 'Test User',
      senderRole: 'employee',
      senderAvatar: 'TU',
      channelId: selectedChannel.id,
      messageType: 'text',
      timestamp: new Date(),
      replyTo: {
        messageId: replyingTo.id,
        senderName: replyingTo.senderName,
        content: replyingTo.content
      }
    };

    setMessages(prev => [...prev, message]);
    setReplyContent('');
    setReplyingTo(null);
    toast.success('Yanıt gönderildi');
  };

  // Mesaj düzenleme
  const editMessage = async (messageId: string, newContent: string) => {
    setMessages(prev => prev.map(msg => 
      msg.id === messageId 
        ? { ...msg, content: newContent, isEdited: true, editedAt: new Date() }
        : msg
    ));
    setEditingMessage(null);
    toast.success('Mesaj düzenlendi');
  };

  // Mesaj silme
  const deleteMessage = async (messageId: string) => {
    setMessages(prev => prev.filter(msg => msg.id !== messageId));
    toast.success('Mesaj silindi');
  };

  // GERÇEK ZAMANLI ÖZELLİKLER İÇİN FONKSİYONLAR

  // Mesaj okundu olarak işaretle
  const markMessageAsRead = async (messageId: string) => {
    const currentUserId = 'user1';
    const currentTime = new Date();
    
    setMessageReadStatus(prev => {
      const currentStatus = prev[messageId];
      if (!currentStatus) return prev;
      
      const updatedStatus: MessageReadStatus = {
        ...currentStatus,
        readBy: [...currentStatus.readBy, currentUserId],
        readAt: {
          ...currentStatus.readAt,
          [currentUserId]: currentTime
        },
        unreadBy: currentStatus.unreadBy.filter(userId => userId !== currentUserId)
      };
      
      return {
        ...prev,
        [messageId]: updatedStatus
      };
    });

    // Okundu bildirimi gönder
    const readReceipt = {
      messageId,
      userId: currentUserId,
      readAt: currentTime
    };
    
    setReadReceipts(prev => ({
      ...prev,
      [messageId]: {
        ...prev[messageId],
        [currentUserId]: currentTime
      }
    }));
  };

  // Yazıyor göstergesi başlat
  const startTyping = () => {
    if (!selectedChannel) return;
    
    setIsTyping(true);
    
    const typingIndicator: TypingIndicator = {
      userId: 'user1',
      userName: 'Test User',
      channelId: selectedChannel.id,
      isTyping: true,
      lastTypingTime: new Date()
    };
    
    setTypingUsers(prev => {
      const existing = prev.find(t => t.userId === 'user1' && t.channelId === selectedChannel.id);
      if (existing) {
        return prev.map(t => 
          t.userId === 'user1' && t.channelId === selectedChannel.id
            ? { ...t, isTyping: true, lastTypingTime: new Date() }
            : t
        );
      }
      return [...prev, typingIndicator];
    });

    // 3 saniye sonra yazıyor göstergesini kaldır
    if (typingTimeout) {
      clearTimeout(typingTimeout);
    }
    
    const timeout = setTimeout(() => {
      stopTyping();
    }, 3000);
    
    setTypingTimeout(timeout);
  };

  // Yazıyor göstergesini durdur
  const stopTyping = () => {
    setIsTyping(false);
    setTypingUsers(prev => prev.filter(t => !(t.userId === 'user1' && t.channelId === selectedChannel?.id)));
    
    if (typingTimeout) {
      clearTimeout(typingTimeout);
      setTypingTimeout(null);
    }
  };

  // Mesaj görüntülendiğinde otomatik okundu işaretle
  const handleMessageView = (messageId: string) => {
    const currentUserId = 'user1';
    const message = messages.find(m => m.id === messageId);
    
    if (message && message.senderId !== currentUserId) {
      markMessageAsRead(messageId);
    }
  };

  // MESAJ İLETME VE KOPYALAMA FONKSİYONLARI

  // Mesajı kopyala
  const copyMessageToClipboard = async (message: ChatMessage) => {
    try {
      await navigator.clipboard.writeText(message.content);
      toast.success('Mesaj panoya kopyalandı');
    } catch (error) {
      console.error('Mesaj kopyalanırken hata:', error);
      toast.error('Mesaj kopyalanamadı');
    }
  };

  // Mesajı ilet
  const forwardMessage = (message: ChatMessage, targetChannelId: string) => {
    const targetChannel = channels.find(ch => ch.id === targetChannelId);
    if (!targetChannel) {
      toast.error('Hedef kanal bulunamadı');
      return;
    }

    const forwardedMessage: ChatMessage = {
      id: Date.now().toString(),
      content: `📤 İletilen mesaj:\n\n${message.content}`,
      senderId: 'user1',
      senderName: 'Test User',
      senderRole: 'employee',
      senderAvatar: 'TU',
      channelId: targetChannelId,
      messageType: 'text',
      timestamp: new Date(),
      forwardedFrom: {
        messageId: message.id,
        senderName: message.senderName,
        channelName: channels.find(ch => ch.id === message.channelId)?.name || 'Bilinmeyen Kanal',
        originalTimestamp: message.timestamp
      }
    };

    setMessages(prev => [...prev, forwardedMessage]);
    
    // Kanalın son mesajını güncelle
    setChannels(prev => prev.map(ch => 
      ch.id === targetChannelId 
        ? { ...ch, lastMessage: `📤 ${message.content.substring(0, 50)}...`, lastMessageTime: Date.now() }
        : ch
    ));

    toast.success(`Mesaj ${targetChannel.name} kanalına iletildi`);
  };

  // Mesaj iletme modal'ı için state
  const [showForwardModal, setShowForwardModal] = useState(false);
  const [messageToForward, setMessageToForward] = useState<ChatMessage | null>(null);

  // GELİŞMİŞ DOSYA YÖNETİMİ İÇİN STATE'LER
  
  // Dosya sürükle-bırak
  const [isDragOver, setIsDragOver] = useState(false);
  const [dragCounter, setDragCounter] = useState(0);
  
  // Dosya önizleme ve düzenleme
  const [showFileEditor, setShowFileEditor] = useState(false);
  const [fileToEdit, setFileToEdit] = useState<File | null>(null);
  const [fileEditContent, setFileEditContent] = useState('');
  
  // Dosya filtreleme
  const [fileFilter, setFileFilter] = useState<'all' | 'images' | 'documents' | 'videos' | 'audio'>('all');
  const [showFileManager, setShowFileManager] = useState(false);
  
  // Dosya arama
  const [fileSearchTerm, setFileSearchTerm] = useState('');
  const [filteredFiles, setFilteredFiles] = useState<FileMessage[]>([]);

  // ÇALIŞAN DURUMU VE MÜSAİTLİK İÇİN STATE'LER
  
  // Kullanıcı durumu
  const [userStatus, setUserStatus] = useState<'online' | 'away' | 'busy' | 'offline'>('online');
  const [customStatus, setCustomStatus] = useState('');
  const [lastSeen, setLastSeen] = useState(new Date());
  
  // Diğer kullanıcıların durumu
  const [otherUsersStatus, setOtherUsersStatus] = useState<{
    [userId: string]: {
      status: 'online' | 'away' | 'busy' | 'offline';
      customStatus?: string;
      lastSeen: Date;
      isTyping?: boolean;
    }
  }>({});
  
  // Durum değiştirme modal'ı
  const [showStatusModal, setShowStatusModal] = useState(false);

  // MESAJ FİLTRELEME VE ETİKETLEME İÇİN STATE'LER
  
  // Mesaj filtreleme
  const [messageFilters, setMessageFilters] = useState({
    showFiles: true,
    showImages: true,
    showLinks: true,
    showMentions: false,
    showSystemMessages: true,
    showAnnouncements: true
  });
  
  // Mesaj etiketleme
  const [messageTags, setMessageTags] = useState<{ [messageId: string]: string[] }>({});
  const [availableTags, setAvailableTags] = useState<string[]>([
    'önemli', 'acil', 'proje', 'toplantı', 'görev', 'sorun', 'çözüm', 'fikir'
  ]);
  
  // Filtreleme modal'ı
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [filteredMessages, setFilteredMessages] = useState<ChatMessage[]>([]);

  // Mesaj sabitleme
  const pinMessage = async (messageId: string) => {
    setMessages(prev => prev.map(msg => 
      msg.id === messageId ? { ...msg, isPinned: !msg.isPinned } : msg
    ));
    toast.success('Mesaj sabitlendi');
  };

  // Yanıtla fonksiyonu
  const handleReplyToMessage = (message: ChatMessage) => {
    setReplyingTo(message);
  };

  // Yanıtı iptal et
  const cancelReply = () => {
    setReplyingTo(null);
    setReplyContent('');
  };

  // Auto-categorization
  const autoCategorizeMessage = (message: ChatMessage): string => {
    if (!autoCategorization.enabled) return 'genel';
    
    const content = message.content.toLowerCase();
    
    for (const [category, keywords] of Object.entries(autoCategorization.keywords)) {
      if (keywords.some(keyword => content.includes(keyword))) {
        return category;
      }
    }
    
    return 'genel';
  };

  // Workflow rules
  const applyWorkflowRules = (message: ChatMessage) => {
    for (const rule of workflowRules) {
      if (message.content.toLowerCase().includes(rule.condition.toLowerCase())) {
        return rule;
      }
    }
    return null;
  };

  // Workflow action execution
  const executeWorkflowAction = async (rule: WorkflowRule) => {
    switch (rule.action) {
      case 'notify':
        toast.success(`Workflow: ${rule.name} tetiklendi`);
        break;
      case 'assign':
        toast.success(`Görev atandı: ${rule.name}`);
        break;
      case 'escalate':
        toast.success(`Yöneticiye yönlendirildi: ${rule.name}`);
        break;
    }
  };

  // Auto-response check
  const checkAutoResponse = (message: ChatMessage) => {
    for (const response of autoResponses) {
      if (message.content.toLowerCase().includes(response.trigger.toLowerCase())) {
        return response;
      }
    }
    return null;
  };

  // GELİŞMİŞ DOSYA YÖNETİMİ FONKSİYONLARI

  // Dosya sürükle-bırak işlemleri
  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragCounter(prev => prev + 1);
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragCounter(prev => prev - 1);
    if (dragCounter === 0) {
      setIsDragOver(false);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
    setDragCounter(0);

    const files = Array.from(e.dataTransfer.files);
    files.forEach(file => handleFileUpload(file));
    
    toast.success(`${files.length} dosya yüklendi`);
  };

  // Dosya yükleme
  const handleFileUpload = async (file: File) => {
    try {
      // Dosya boyutu kontrolü (10MB limit)
      if (file.size > 10 * 1024 * 1024) {
        toast.error('Dosya boyutu 10MB\'dan büyük olamaz');
        return;
      }

      // Dosya tipi kontrolü
      const allowedTypes = [
        'image/', 'video/', 'audio/', 'text/', 'application/pdf',
        'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'application/vnd.ms-powerpoint', 'application/vnd.openxmlformats-officedocument.presentationml.presentation'
      ];

      const isAllowed = allowedTypes.some(type => file.type.startsWith(type));
      if (!isAllowed) {
        toast.error('Bu dosya tipi desteklenmiyor');
        return;
      }

      const fileMessage: FileMessage = {
        id: Date.now().toString(),
        fileName: file.name,
        fileUrl: URL.createObjectURL(file),
        fileSize: file.size,
        fileType: file.type,
        senderId: 'user1',
        senderName: 'Test User',
        timestamp: new Date(),
        channelId: selectedChannel?.id || '',
        isImage: file.type.startsWith('image/'),
        isVideo: file.type.startsWith('video/'),
        isAudio: file.type.startsWith('audio/'),
        isDocument: file.type.includes('pdf') || file.type.includes('document')
      };

      setFileMessages(prev => [...prev, fileMessage]);
      
      // Mesaj olarak da gönder
      const message: ChatMessage = {
        id: Date.now().toString(),
        content: `📎 ${file.name} dosyası paylaşıldı`,
        senderId: 'user1',
        senderName: 'Test User',
        senderRole: 'employee',
        senderAvatar: 'TU',
        channelId: selectedChannel?.id || '',
        messageType: 'file',
        timestamp: new Date(),
        attachments: [fileMessage.id]
      };

      setMessages(prev => [...prev, message]);
      
      // Kanalın son mesajını güncelle
      if (selectedChannel) {
        setChannels(prev => prev.map(ch => 
          ch.id === selectedChannel.id 
            ? { ...ch, lastMessage: `📎 ${file.name}`, lastMessageTime: Date.now() }
            : ch
        ));
      }

      toast.success('Dosya yüklendi');
    } catch (error) {
      console.error('Dosya yüklenirken hata:', error);
      toast.error('Dosya yüklenemedi');
    }
  };

  // Dosya düzenleme
  const editFile = (file: File) => {
    setFileToEdit(file);
    setFileEditContent('');
    setShowFileEditor(true);
  };

  // Dosya filtreleme
  const filterFiles = () => {
    let filtered = fileMessages;
    
    // Tip filtreleme
    switch (fileFilter) {
      case 'images':
        filtered = filtered.filter(f => f.isImage);
        break;
      case 'documents':
        filtered = filtered.filter(f => f.isDocument);
        break;
      case 'videos':
        filtered = filtered.filter(f => f.isVideo);
        break;
      case 'audio':
        filtered = filtered.filter(f => f.isAudio);
        break;
    }
    
    // Arama filtreleme
    if (fileSearchTerm) {
      filtered = filtered.filter(f => 
        f.fileName.toLowerCase().includes(fileSearchTerm.toLowerCase())
      );
    }
    
    setFilteredFiles(filtered);
  };

  // Dosya arama ve filtreleme effect'i
  useEffect(() => {
    filterFiles();
  }, [fileFilter, fileSearchTerm, fileMessages]);

  // ÇALIŞAN DURUMU VE MÜSAİTLİK FONKSİYONLARI

  // Kullanıcı durumunu güncelle
  const updateUserStatus = (status: 'online' | 'away' | 'busy' | 'offline', customMessage?: string) => {
    setUserStatus(status);
    if (customMessage) {
      setCustomStatus(customMessage);
    }
    setLastSeen(new Date());
    
    // Diğer kullanıcılara durum değişikliğini bildir
    toast.success(`Durumunuz "${status}" olarak güncellendi`);
  };

  // Son görülme zamanını hesapla
  const getLastSeenText = (lastSeen: Date) => {
    const now = new Date();
    const diff = now.getTime() - lastSeen.getTime();
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (minutes < 1) return 'Az önce';
    if (minutes < 60) return `${minutes} dakika önce`;
    if (hours < 24) return `${hours} saat önce`;
    return `${days} gün önce`;
  };

  // Kullanıcı durumu rengini al
  const getUserStatusColor = (status: 'online' | 'away' | 'busy' | 'offline') => {
    switch (status) {
      case 'online': return 'bg-green-500';
      case 'away': return 'bg-yellow-500';
      case 'busy': return 'bg-red-500';
      case 'offline': return 'bg-gray-500';
      default: return 'bg-gray-500';
    }
  };

  // Kullanıcı durumu metnini al
  const getUserStatusText = (status: 'online' | 'away' | 'busy' | 'offline') => {
    switch (status) {
      case 'online': return 'Çevrimiçi';
      case 'away': return 'Uzakta';
      case 'busy': return 'Meşgul';
      case 'offline': return 'Çevrimdışı';
      default: return 'Bilinmiyor';
    }
  };

  // Otomatik durum güncelleme (5 dakika hareketsizlik sonrası "away")
  useEffect(() => {
    let timeout: NodeJS.Timeout;
    
    const resetTimeout = () => {
      clearTimeout(timeout);
      timeout = setTimeout(() => {
        if (userStatus === 'online') {
          updateUserStatus('away');
        }
      }, 5 * 60 * 1000); // 5 dakika
    };

    const handleActivity = () => {
      if (userStatus === 'away') {
        updateUserStatus('online');
      }
      resetTimeout();
    };

    // Kullanıcı aktivitelerini dinle
    window.addEventListener('mousemove', handleActivity);
    window.addEventListener('keypress', handleActivity);
    window.addEventListener('click', handleActivity);
    window.addEventListener('scroll', handleActivity);

    resetTimeout();

    return () => {
      clearTimeout(timeout);
      window.removeEventListener('mousemove', handleActivity);
      window.removeEventListener('keypress', handleActivity);
      window.removeEventListener('click', handleActivity);
      window.removeEventListener('scroll', handleActivity);
    };
  }, [userStatus]);

  // MESAJ FİLTRELEME VE ETİKETLEME FONKSİYONLARI

  // Mesajları filtrele
  const filterMessages = () => {
    let filtered = messages;

    // Dosya mesajları
    if (!messageFilters.showFiles) {
      filtered = filtered.filter(msg => msg.messageType !== 'file');
    }

    // Resim mesajları
    if (!messageFilters.showImages) {
      filtered = filtered.filter(msg => !msg.content.includes('🖼️') && !msg.content.includes('image'));
    }

    // Link mesajları
    if (!messageFilters.showLinks) {
      filtered = filtered.filter(msg => !msg.content.includes('http'));
    }

    // Mention mesajları
    if (!messageFilters.showMentions) {
      filtered = filtered.filter(msg => !msg.content.includes('@'));
    }

    // Sistem mesajları
    if (!messageFilters.showSystemMessages) {
      filtered = filtered.filter(msg => msg.messageType !== 'system');
    }

    // Duyuru mesajları
    if (!messageFilters.showAnnouncements) {
      filtered = filtered.filter(msg => msg.messageType !== 'announcement');
    }

    setFilteredMessages(filtered);
  };

  // Mesaj etiketle
  const tagMessage = (messageId: string, tag: string) => {
    setMessageTags(prev => {
      const currentTags = prev[messageId] || [];
      if (currentTags.includes(tag)) {
        return prev; // Etiket zaten var
      }
      return {
        ...prev,
        [messageId]: [...currentTags, tag]
      };
    });

    // Yeni etiket varsa ekle
    if (!availableTags.includes(tag)) {
      setAvailableTags(prev => [...prev, tag]);
    }

    toast.success(`Mesaj "${tag}" etiketi ile etiketlendi`);
  };

  // Mesaj etiketini kaldır
  const removeMessageTag = (messageId: string, tag: string) => {
    setMessageTags(prev => {
      const currentTags = prev[messageId] || [];
      return {
        ...prev,
        [messageId]: currentTags.filter(t => t !== tag)
      };
    });

    toast.success(`"${tag}" etiketi kaldırıldı`);
  };

  // Etiketli mesajları getir
  const getMessagesByTag = (tag: string) => {
    return messages.filter(msg => messageTags[msg.id]?.includes(tag));
  };

  // Mesaj filtreleme effect'i
  useEffect(() => {
    filterMessages();
  }, [messageFilters, messages]);

  // MESAJ SABİTLEME VE ÖNEMLİ İŞARETLEME FONKSİYONLARI

  // Mesajı sabitle/sabitlemeyi kaldır
  const togglePinMessage = (messageId: string) => {
    if (!selectedChannel) return;

    const channelPinnedMessages = pinnedMessages[selectedChannel.id] || [];
    const isPinned = channelPinnedMessages.includes(messageId);

    if (isPinned) {
      // Sabitlemeyi kaldır
      const updatedPinnedMessages = channelPinnedMessages.filter(id => id !== messageId);
      setPinnedMessages(prev => ({
        ...prev,
        [selectedChannel.id]: updatedPinnedMessages
      }));
      toast.success('Mesaj sabitlemeyi kaldırıldı');
    } else {
      // Sabitle (maksimum 5 mesaj)
      if (channelPinnedMessages.length >= 5) {
        toast.error('Maksimum 5 mesaj sabitleyebilirsiniz');
        return;
      }
      
      const updatedPinnedMessages = [...channelPinnedMessages, messageId];
      setPinnedMessages(prev => ({
        ...prev,
        [selectedChannel.id]: updatedPinnedMessages
      }));
      toast.success('Mesaj sabitlendi');
    }
  };

  // Mesajı önemli işaretle/önemli işaretlemeyi kaldır
  const toggleStarMessage = (messageId: string) => {
    const isStarred = starredMessages[messageId];
    
    setStarredMessages(prev => ({
      ...prev,
      [messageId]: !isStarred
    }));

    if (isStarred) {
      toast.success('Mesaj önemli işaretlemeyi kaldırıldı');
    } else {
      toast.success('Mesaj önemli işaretlendi');
    }
  };

  // Sabitlenen mesajları getir
  const getPinnedMessages = (channelId: string) => {
    const pinnedIds = pinnedMessages[channelId] || [];
    return messages.filter(msg => pinnedIds.includes(msg.id));
  };

  // Önemli işaretlenen mesajları getir
  const getStarredMessages = () => {
    return messages.filter(msg => starredMessages[msg.id]);
  };

  // Mesajın sabitlenip sabitlenmediğini kontrol et
  const isMessagePinned = (messageId: string) => {
    if (!selectedChannel) return false;
    const channelPinnedMessages = pinnedMessages[selectedChannel.id] || [];
    return channelPinnedMessages.includes(messageId);
  };

  // Mesajın önemli işaretlenip işaretlenmediğini kontrol et
  const isMessageStarred = (messageId: string) => {
    return starredMessages[messageId] || false;
  };

  // Sabitlenen mesaj sayısını getir
  const getPinnedMessageCount = (channelId: string) => {
    return pinnedMessages[channelId]?.length || 0;
  };

  // Önemli işaretlenen mesaj sayısını getir
  const getStarredMessageCount = () => {
    return Object.values(starredMessages).filter(Boolean).length;
  };

  // GELİŞMİŞ GÖREV YÖNETİMİ İÇİN STATE'LER
  
  // Görevler
  const [tasks, setTasks] = useState<Task[]>([]);
  const [showTaskManager, setShowTaskManager] = useState(false);
  const [showTaskCreator, setShowTaskCreator] = useState(false);
  const [showTaskDetails, setShowTaskDetails] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  
  // Görev filtreleme
  const [taskFilter, setTaskFilter] = useState<'all' | 'pending' | 'in_progress' | 'completed' | 'overdue'>('all');
  const [taskPriorityFilter, setTaskPriorityFilter] = useState<'all' | 'low' | 'medium' | 'high' | 'urgent'>('all');
  const [taskAssigneeFilter, setTaskAssigneeFilter] = useState('all');
  
  // Görev oluşturma formu
  const [taskForm, setTaskForm] = useState({
    title: '',
    description: '',
    assignedTo: [] as string[],
    dueDate: new Date(),
    priority: 'medium' as 'low' | 'medium' | 'high' | 'urgent',
    tags: [] as string[],
    attachments: [] as string[],
    estimatedHours: 0,
    dependencies: [] as string[]
  });
  
  // Görev düzenleme
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  
  // Görev arama
  const [taskSearchTerm, setTaskSearchTerm] = useState('');
  
  // Görev istatistikleri
  const [taskStats, setTaskStats] = useState({
    total: 0,
    pending: 0,
    inProgress: 0,
    completed: 0,
    overdue: 0
  });

  // GELİŞMİŞ GÖREV YÖNETİMİ FONKSİYONLARI

  // Görev oluştur
  const createTask = () => {
    if (!taskForm.title.trim()) {
      toast.error('Görev başlığı gereklidir');
      return;
    }

    const newTask: Task = {
      id: Date.now().toString(),
      title: taskForm.title,
      description: taskForm.description,
      assignee: taskForm.assignedTo[0] || 'user1',
      assigneeName: 'Test User', // Gerçek uygulamada kullanıcı adı alınır
      priority: taskForm.priority,
      status: 'pending',
      dueDate: taskForm.dueDate,
      createdAt: new Date(),
      tags: taskForm.tags,
      attachments: taskForm.attachments
    };

    setTasks(prev => [...prev, newTask]);
    updateTaskStats();
    
    // Görev oluşturma mesajı gönder
    if (selectedChannel) {
      const taskMessage: ChatMessage = {
        id: Date.now().toString(),
        content: `📋 Görev Oluşturuldu:\n\n**${newTask.title}**\n\n${newTask.description}\n\n👤 Atanan: ${newTask.assigneeName}\n📅 Bitiş: ${newTask.dueDate.toLocaleDateString('tr-TR')}\n🎯 Öncelik: ${getPriorityText(newTask.priority)}`,
        senderId: 'user1',
        senderName: 'Test User',
        senderRole: 'employee',
        senderAvatar: 'TU',
        channelId: selectedChannel.id,
        messageType: 'system',
        timestamp: new Date()
      };

      setMessages(prev => [...prev, taskMessage]);
    }

    // Formu temizle
    setTaskForm({
      title: '',
      description: '',
      assignedTo: [],
      dueDate: new Date(),
      priority: 'medium',
      tags: [],
      attachments: [],
      estimatedHours: 0,
      dependencies: []
    });

    setShowTaskCreator(false);
    toast.success('Görev başarıyla oluşturuldu');
  };

  // Görev güncelle
  const updateTask = (taskId: string, updates: Partial<Task>) => {
    setTasks(prev => prev.map(task => 
      task.id === taskId ? { ...task, ...updates } : task
    ));
    updateTaskStats();
    toast.success('Görev güncellendi');
  };

  // Görev sil
  const deleteTask = (taskId: string) => {
    setTasks(prev => prev.filter(task => task.id !== taskId));
    updateTaskStats();
    toast.success('Görev silindi');
  };

  // Görev durumunu değiştir
  const changeTaskStatus = (taskId: string, newStatus: 'pending' | 'in_progress' | 'completed' | 'cancelled') => {
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;

    const updates: Partial<Task> = { status: newStatus };
    
    if (newStatus === 'completed') {
      updates.completedAt = new Date();
    }

    updateTask(taskId, updates);
  };

  // Görev önceliğini değiştir
  const changeTaskPriority = (taskId: string, newPriority: 'low' | 'medium' | 'high' | 'urgent') => {
    updateTask(taskId, { priority: newPriority });
  };

  // Görev atamasını değiştir
  const reassignTask = (taskId: string, newAssignee: string) => {
    updateTask(taskId, { assignee: newAssignee });
  };

  // Görev istatistiklerini güncelle
  const updateTaskStats = () => {
    const stats = {
      total: tasks.length,
      pending: tasks.filter(t => t.status === 'pending').length,
      inProgress: tasks.filter(t => t.status === 'in_progress').length,
      completed: tasks.filter(t => t.status === 'completed').length,
      overdue: tasks.filter(t => {
        return t.status !== 'completed' && t.dueDate < new Date();
      }).length
    };
    setTaskStats(stats);
  };

  // Görevleri filtrele
  const getFilteredTasks = () => {
    let filtered = tasks;

    // Durum filtresi
    if (taskFilter !== 'all') {
      filtered = filtered.filter(task => task.status === taskFilter);
    }

    // Öncelik filtresi
    if (taskPriorityFilter !== 'all') {
      filtered = filtered.filter(task => task.priority === taskPriorityFilter);
    }

    // Atanan kişi filtresi
    if (taskAssigneeFilter !== 'all') {
      filtered = filtered.filter(task => task.assignee === taskAssigneeFilter);
    }

    // Arama filtresi
    if (taskSearchTerm) {
      const searchLower = taskSearchTerm.toLowerCase();
      filtered = filtered.filter(task => 
        task.title.toLowerCase().includes(searchLower) ||
        task.description.toLowerCase().includes(searchLower) ||
        task.assigneeName.toLowerCase().includes(searchLower)
      );
    }

    return filtered;
  };

  // Öncelik metnini al
  const getPriorityText = (priority: string) => {
    switch (priority) {
      case 'low': return 'Düşük';
      case 'medium': return 'Orta';
      case 'high': return 'Yüksek';
      case 'urgent': return 'Acil';
      default: return 'Orta';
    }
  };

  // Öncelik rengini al
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'low': return 'bg-gray-500';
      case 'medium': return 'bg-blue-500';
      case 'high': return 'bg-orange-500';
      case 'urgent': return 'bg-red-500';
      default: return 'bg-blue-500';
    }
  };

  // Durum metnini al
  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending': return 'Bekliyor';
      case 'in_progress': return 'Devam Ediyor';
      case 'completed': return 'Tamamlandı';
      case 'cancelled': return 'İptal Edildi';
      default: return 'Bekliyor';
    }
  };

  // Durum rengini al
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-500';
      case 'in_progress': return 'bg-blue-500';
      case 'completed': return 'bg-green-500';
      case 'cancelled': return 'bg-gray-500';
      default: return 'bg-yellow-500';
    }
  };

  // Mesajdan görev oluştur
  const createTaskFromMessage = (message: ChatMessage) => {
    setTaskForm(prev => ({
      ...prev,
      title: message.content.substring(0, 50) + (message.content.length > 50 ? '...' : ''),
      description: message.content
    }));
    setShowTaskCreator(true);
  };

  // Görev istatistiklerini effect ile güncelle
  useEffect(() => {
    updateTaskStats();
  }, [tasks]);

  // KANAL İÇİ ARAMA FONKSİYONLARI

  // Seçili kanalın mesajlarını ara
  const searchChannelMessages = (query: string) => {
    if (!query.trim() || !selectedChannel) {
      setFilteredMessages(messages);
      return;
    }

    const searchLower = query.toLowerCase();
    const filtered = messages.filter(message => {
      // Sadece seçili kanaldaki mesajları ara
      if (message.channelId !== selectedChannel.id) {
        return false;
      }

      // Mesaj içeriğinde ara
      if (message.content.toLowerCase().includes(searchLower)) {
        return true;
      }

      // Gönderen adında ara
      if (message.senderName.toLowerCase().includes(searchLower)) {
        return true;
      }

      // Dosya mesajlarında dosya adında ara
      if (message.messageType === 'file' && message.attachments) {
        const fileMessage = fileMessages.find(fm => fm.id === message.attachments?.[0]);
        if (fileMessage && fileMessage.fileName.toLowerCase().includes(searchLower)) {
          return true;
        }
      }

      return false;
    });

    setFilteredMessages(filtered);
    
    if (filtered.length > 0) {
      toast.success(`"${query}" için ${filtered.length} mesaj bulundu`);
    } else {
      toast.error(`"${query}" için mesaj bulunamadı`);
    }
  };

  // Kanal içi arama state'i
  const [channelSearchTerm, setChannelSearchTerm] = useState('');
  const [showChannelSearch, setShowChannelSearch] = useState(false);

  // MESAJ SABİTLEME VE ÖNEMLİ İŞARETLEME İÇİN STATE'LER
  
  // Sabitlenen mesajlar
  const [pinnedMessages, setPinnedMessages] = useState<{ [channelId: string]: string[] }>({});
  
  // Önemli işaretlenen mesajlar (yıldızlı)
  const [starredMessages, setStarredMessages] = useState<{ [messageId: string]: boolean }>({});
  
  // Sabitlenen mesajlar paneli
  const [showPinnedMessages, setShowPinnedMessages] = useState(false);
  
  // Önemli mesajlar paneli
  const [showStarredMessages, setShowStarredMessages] = useState(false);

  // Sesli mesaj işleme
  const handleVoiceMessage = async (audioBlob: Blob) => {
    try {
      // localStorage'dan gerçek transcript'i al
      const realTranscript = localStorage.getItem('lastVoiceTranscript') || 'Transcript bulunamadı';
      
      const voiceMessage: VoiceMessage = {
        id: Date.now().toString(),
        audioUrl: URL.createObjectURL(audioBlob),
        duration: Math.round(audioBlob.size / 1000), // Yaklaşık süre hesaplama
        transcription: realTranscript,
        senderId: 'user1',
        senderName: 'Test User',
        timestamp: new Date(),
        channelId: selectedChannel?.id || ''
      };

      setVoiceMessages(prev => [...prev, voiceMessage]);
      
      // Kanalın son mesajını güncelle
      if (selectedChannel) {
        setChannels(prev => prev.map(channel => 
          channel.id === selectedChannel.id 
            ? { 
                ...channel, 
                lastMessage: '🎤 Sesli mesaj', 
                lastMessageTime: Date.now() 
              }
            : channel
        ));
      }

      // localStorage'dan transcript'i temizle
      localStorage.removeItem('lastVoiceTranscript');

      toast.success('Sesli mesaj gönderildi');
    } catch (error) {
      console.error('Sesli mesaj gönderilirken hata:', error);
      toast.error('Sesli mesaj gönderilemedi');
    }
  };

  // Sesli mesaj kaydetme
  const startVoiceRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      const chunks: Blob[] = [];

      mediaRecorder.ondataavailable = (e) => {
        chunks.push(e.data);
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunks, { type: 'audio/webm' });
        
        // Gerçek transcript kullanılıyor, mock'a gerek yok
        const voiceMessage: VoiceMessage = {
          id: Date.now().toString(),
          audioUrl: URL.createObjectURL(blob),
          duration: chunks.length * 100,
          transcription: 'Transcript bulunamadı', // Gerçek transcript MessageInput'ta oluşturuluyor
          senderId: 'user1',
          senderName: 'Test User',
          timestamp: new Date(),
          channelId: selectedChannel?.id || ''
        };

        setVoiceMessages(prev => [...prev, voiceMessage]);
        toast.success('Sesli mesaj kaydedildi');
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (error) {
      console.error('Sesli kayıt başlatılırken hata:', error);
      toast.error('Sesli kayıt başlatılamadı');
    }
  };

  // Semantic search
  const performSemanticSearch = async (query: string) => {
    if (!query.trim()) return;

    setIsSearching(true);
    try {
      // Mock semantic search
      const results = messages.filter(msg => 
        msg.content.toLowerCase().includes(query.toLowerCase()) ||
        msg.senderName.toLowerCase().includes(query.toLowerCase())
      );

      setAdvancedSearchResults({
        messages: results,
        voiceMessages: [],
        files: [],
        users: [],
        totalResults: results.length,
        searchTime: Date.now(),
        relevance: 0.8
      });

      toast.success(`${results.length} sonuç bulundu`);
    } catch (error) {
      console.error('Arama yapılırken hata:', error);
      toast.error('Arama yapılamadı');
    } finally {
      setIsSearching(false);
    }
  };

  // YENİ ÖZELLİKLER İÇİN FONKSİYONLAR

  // Anket oluşturma
  const createPoll = async () => {
    if (!pollForm.question.trim() || pollForm.options.some(opt => !opt.trim())) {
      toast.error('Lütfen soru ve tüm seçenekleri doldurun');
      return;
    }

    const poll: Poll = {
      id: Date.now().toString(),
      question: pollForm.question,
      options: pollForm.options.filter(opt => opt.trim()),
      votes: {},
      createdBy: 'user1',
      createdAt: new Date(),
      expiresAt: pollForm.expiresAt,
      isActive: true,
      channelId: selectedChannel?.id || ''
    };

    setPolls(prev => [...prev, poll]);
    setShowPollCreator(false);
    setPollForm({ question: '', options: ['', ''], expiresAt: undefined });
    toast.success('Anket oluşturuldu');
  };

  // Anketi mesaj olarak gönderme
  const sendPollAsMessage = () => {
    if (!pollForm.question.trim() || pollForm.options.some(opt => !opt.trim())) {
      toast.error('Lütfen soru ve tüm seçenekleri doldurun');
      return;
    }

    // Anket mesajını oluştur
    const pollMessage = `
📊 **Anket: ${pollForm.question}**

${pollForm.options.filter(opt => opt.trim()).map((option, index) => 
  `${index + 1}. ${option}`
).join('\n')}

${pollForm.expiresAt ? `\n⏰ Bitiş: ${new Date(pollForm.expiresAt).toLocaleString('tr-TR')}` : ''}

Oy vermek için mesajı yanıtlayın ve seçenek numarasını yazın!
    `.trim();

    // Anketi mesaj olarak gönder
    if (selectedChannel) {
      const newPollMessage: ChatMessage = {
        id: Date.now().toString(),
        content: pollMessage,
        senderId: 'user1',
        senderName: 'Test User',
        senderRole: 'employee',
        senderAvatar: 'TU',
        channelId: selectedChannel.id,
        messageType: 'poll',
        timestamp: new Date()
      };

      // Mesajı listeye ekle
      setMessages(prev => [...prev, newPollMessage]);

      // Kanalın son mesajını güncelle
      setChannels(prev => prev.map(ch => 
        ch.id === selectedChannel.id 
          ? { ...ch, lastMessage: '📊 Anket', lastMessageTime: Date.now() }
          : ch
      ));

      // Anket form'unu temizle ve modal'ı kapat
      setShowPollCreator(false);
      setPollForm({ question: '', options: ['', ''], expiresAt: undefined });
      
      toast.success('Anket mesaj olarak gönderildi');
    } else {
      toast.error('Lütfen önce bir kanal seçin');
    }
  };

  // Anket oylama
  const votePoll = (pollId: string, option: string) => {
    setPolls(prev => prev.map(poll => {
      if (poll.id === pollId) {
        const currentVotes = poll.votes[option] || 0;
        return {
          ...poll,
          votes: { ...poll.votes, [option]: currentVotes + 1 }
        };
      }
      return poll;
    }));
    toast.success('Oyunuz kaydedildi');
  };

  // Anket mesajı oylama
  const handlePollVote = (messageId: string, optionIndex: number, optionText: string) => {
    const currentUserId = 'user1'; // Gerçek uygulamada bu dinamik olacak
    
    // Kullanıcının daha önce oy verip vermediğini kontrol et
    const existingVote = userVotes[messageId];
    
    if (existingVote && existingVote.userId === currentUserId) {
      // Kullanıcı daha önce oy vermiş, oyunu değiştir
      if (existingVote.optionIndex === optionIndex) {
        // Aynı seçeneğe tekrar oy vermeye çalışıyor
        toast.error('Bu seçeneğe zaten oy verdiniz');
        return;
      }
      
      // Önceki oyu azalt
      setPollVotes(prev => ({
        ...prev,
        [messageId]: {
          ...prev[messageId],
          [existingVote.optionIndex]: Math.max(0, (prev[messageId]?.[existingVote.optionIndex] || 0) - 1)
        }
      }));
      
      toast.success(`Oyunuz "${optionText}" seçeneğine değiştirildi`);
    } else {
      // İlk kez oy veriyor
      toast.success(`"${optionText}" seçeneğine oy verildi`);
    }
    
    // Yeni oyu ekle
    setPollVotes(prev => ({
      ...prev,
      [messageId]: {
        ...prev[messageId],
        [optionIndex]: (prev[messageId]?.[optionIndex] || 0) + 1
      }
    }));
    
    // Kullanıcının oy verdiği seçeneği kaydet
    setUserVotes(prev => ({
      ...prev,
      [messageId]: {
        userId: currentUserId,
        optionIndex: optionIndex
      }
    }));
  };

  // Mesaj şablonu oluşturma
  const createMessageTemplate = async () => {
    if (!templateForm.name.trim() || !templateForm.content.trim()) {
      toast.error('Lütfen şablon adı ve içeriğini doldurun');
      return;
    }

    const template: MessageTemplate = {
      id: Date.now().toString(),
      name: templateForm.name,
      content: templateForm.content,
      category: templateForm.category,
      createdBy: 'user1',
      isPublic: true,
      usageCount: 0
    };

    setMessageTemplates(prev => [...prev, template]);
    setShowTemplateCreator(false);
    setTemplateForm({ name: '', content: '', category: 'genel' });
    toast.success('Mesaj şablonu oluşturuldu');
  };

  // Mesaj şablonu kullanma
  const useMessageTemplate = (template: MessageTemplate) => {
    if (selectedChannel) {
      // Şablonu mesaj olarak gönder
      const newTemplateMessage: ChatMessage = {
        id: Date.now().toString(),
        content: template.content,
        senderId: 'user1',
        senderName: 'Test User',
        senderRole: 'employee',
        senderAvatar: 'TU',
        channelId: selectedChannel.id,
        messageType: 'text',
        timestamp: new Date()
      };

      // Mesajı listeye ekle
      setMessages(prev => [...prev, newTemplateMessage]);

      // Kanalın son mesajını güncelle
      setChannels(prev => prev.map(ch => 
        ch.id === selectedChannel.id 
          ? { ...ch, lastMessage: template.content.substring(0, 50) + '...', lastMessageTime: Date.now() }
          : ch
      ));

      // Kullanım sayısını artır
      setMessageTemplates(prev => prev.map(t => 
        t.id === template.id ? { ...t, usageCount: t.usageCount + 1 } : t
      ));

      setShowTemplateSelector(false);
      toast.success('Şablon mesaj olarak gönderildi');
    } else {
      // Kanal seçili değilse input'a ekle
      setNewMessage(template.content);
      setShowTemplateSelector(false);
      
      // Kullanım sayısını artır
      setMessageTemplates(prev => prev.map(t => 
        t.id === template.id ? { ...t, usageCount: t.usageCount + 1 } : t
      ));
      
      toast.success('Şablon uygulandı');
    }
  };

  // Eski görev oluşturma fonksiyonu kaldırıldı

  // Gelişmiş arama fonksiyonu
  const performAdvancedSearch = () => {
    if (!advancedSearchQuery.trim()) {
      toast.error('Arama terimi girin');
      return;
    }

    const query = advancedSearchQuery.toLowerCase();
    const results: AdvancedSearchResults = {
      messages: [],
      voiceMessages: [],
      files: [],
      users: [],
      totalResults: 0,
      searchTime: Date.now(),
      relevance: 0.9
    };

    // Mesajlarda arama
    messages.forEach(message => {
      let shouldInclude = false;
      
      // Mesaj tipi filtresi
      if (advancedSearchFilters.messageType !== 'all' && 
          message.messageType !== advancedSearchFilters.messageType) {
        return;
      }

      // İçerik arama
      if (message.content.toLowerCase().includes(query)) {
        shouldInclude = true;
      }

      // Gönderen filtresi
      if (advancedSearchFilters.sender !== 'all' && 
          message.senderId !== advancedSearchFilters.sender) {
        return;
      }

      // Dosya ekleri filtresi
      if (advancedSearchFilters.hasAttachments && 
          message.messageType !== 'file' && message.messageType !== 'image') {
        return;
      }

      // Mention filtresi
      if (advancedSearchFilters.hasMentions && 
          !message.content.includes('@')) {
        return;
      }

      if (shouldInclude) {
        results.messages.push(message);
      }
    });

    // Kullanıcılarda arama
    const allUsers = [
      { id: 'user1', name: 'Test User', role: 'Sistem Yöneticisi', avatar: 'TU' },
      { id: 'user2', name: 'Ahmet Yılmaz', role: 'Yazılım Geliştirici', avatar: 'AY' },
      { id: 'user3', name: 'Ayşe Çelik', role: 'Proje Yöneticisi', avatar: 'AÇ' },
      { id: 'user4', name: 'Ali Demir', role: 'UI/UX Tasarımcı', avatar: 'AD' },
      { id: 'user5', name: 'Aylin Doğan', role: 'İnsan Kaynakları', avatar: 'AD' },
      { id: 'user6', name: 'Mehmet Kaya', role: 'Satış Müdürü', avatar: 'MK' },
      { id: 'user7', name: 'Fatma Özkan', role: 'Muhasebe Uzmanı', avatar: 'FÖ' }
    ];

    allUsers.forEach(user => {
      if (user.name.toLowerCase().includes(query) || 
          user.role.toLowerCase().includes(query)) {
        results.users.push(user);
      }
    });

    // Dosyalarda arama (mock data)
    const mockFiles: FileMessage[] = [
      { 
        id: '1', 
        fileName: 'rapor.pdf', 
        fileUrl: '/files/rapor.pdf',
        fileSize: 2500000,
        fileType: 'pdf', 
        senderId: 'user1', 
        senderName: 'Test User',
        timestamp: new Date(),
        channelId: '1'
      },
      { 
        id: '2', 
        fileName: 'sunum.pptx', 
        fileUrl: '/files/sunum.pptx',
        fileSize: 5100000,
        fileType: 'powerpoint', 
        senderId: 'user2', 
        senderName: 'Ahmet Yılmaz',
        timestamp: new Date(),
        channelId: '1'
      },
      { 
        id: '3', 
        fileName: 'resim.jpg', 
        fileUrl: '/files/resim.jpg',
        fileSize: 1200000,
        fileType: 'image', 
        senderId: 'user3', 
        senderName: 'Ayşe Çelik',
        timestamp: new Date(),
        channelId: '1'
      }
    ];

    mockFiles.forEach(file => {
      if (file.fileName.toLowerCase().includes(query) || 
          file.fileType.toLowerCase().includes(query)) {
        results.files.push(file);
      }
    });

    results.totalResults = results.messages.length + results.users.length + results.files.length;
    setAdvancedSearchResults(results);
    
    if (results.totalResults > 0) {
      toast.success(`${results.totalResults} sonuç bulundu`);
    } else {
      toast.error('Sonuç bulunamadı');
    }
  };

  // Akıllı özetleme
  const generateConversationSummary = async () => {
    if (!selectedChannel || messages.length === 0) {
      toast.error('Özetlenecek mesaj bulunamadı');
      return;
    }

    setIsGeneratingSummary(true);
    try {
      // Mock AI özetleme - gerçek uygulamada AI servisi kullanılır
      const recentMessages = messages.slice(-50); // Son 50 mesaj
      const participants = [...new Set(recentMessages.map(msg => msg.senderName))];
      
      // Anahtar kelimeleri çıkar
      const allContent = recentMessages.map(msg => msg.content).join(' ');
      const keyPoints = [
        'Proje durumu tartışıldı',
        'Yeni özellikler planlandı',
        'Teknik sorunlar çözüldü',
        'Toplantı tarihleri belirlendi'
      ];

      // Aksiyon maddeleri
      const actionItems = [
        'Yeni özellik geliştirme başlatılacak',
        'Teknik dokümantasyon güncellenecek',
        'Test süreçleri planlanacak'
      ];

      const summary: ConversationSummary = {
        id: Date.now().toString(),
        channelId: selectedChannel.id,
        summary: `Bu kanalda ${recentMessages.length} mesaj üzerinden yapılan konuşmalar özetlendi. Ana konular: proje geliştirme, teknik sorunlar ve planlama.`,
        keyPoints,
        actionItems,
        participants,
        createdAt: new Date(),
        messageCount: recentMessages.length
      };

      setCurrentSummary(summary);
      setConversationSummaries(prev => [...prev, summary]);
      setShowSummary(true);
      toast.success('Konuşma özeti oluşturuldu');
    } catch (error) {
      console.error('Özet oluşturulurken hata:', error);
      toast.error('Özet oluşturulamadı');
    } finally {
      setIsGeneratingSummary(false);
    }
  };

  // Hızlı Aksiyonlar için fonksiyonlar
  const createNewChannel = async () => {
    if (!newChannelForm.name.trim()) {
      toast.error('Kanal adı gereklidir');
      return;
    }

    const newChannel: Channel = {
      id: Date.now().toString(),
      name: newChannelForm.name,
      description: newChannelForm.description,
      type: newChannelForm.type,
      members: ['user1'],
      lastMessage: undefined,
      lastMessageTime: Date.now(),
      unreadCount: 0
    };

    setChannels(prev => [...prev, newChannel]);
    setShowNewChannelModal(false);
    setNewChannelForm({ name: '', description: '', type: 'public' });
    toast.success('Yeni kanal oluşturuldu');
  };

  const sendBulkMessage = async () => {
    if (!bulkMessageForm.message.trim()) {
      toast.error('Mesaj içeriği gereklidir');
      return;
    }

    if (bulkMessageForm.selectedChannels.length === 0 && bulkMessageForm.selectedUsers.length === 0) {
      toast.error('En az bir kanal veya kullanıcı seçin');
      return;
    }

    // Seçili kanallara mesaj gönder
    bulkMessageForm.selectedChannels.forEach(channelId => {
      const message: ChatMessage = {
        id: Date.now().toString() + channelId,
        content: bulkMessageForm.message,
        senderId: 'user1',
        senderName: 'Test User',
        senderRole: 'employee',
        senderAvatar: 'TU',
        channelId: channelId,
        messageType: 'announcement',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, message]);
    });

    setShowBulkMessageModal(false);
    setBulkMessageForm({ message: '', selectedChannels: [], selectedUsers: [] });
    toast.success('Toplu mesaj gönderildi');
  };

  const generateReport = async () => {
    if (!reportForm.title.trim()) {
      toast.error('Rapor başlığı gereklidir');
      return;
    }

    // Mock rapor oluşturma
    const reportData = {
      title: reportForm.title,
      type: reportForm.type,
      dateRange: reportForm.dateRange,
      stats: {
        totalMessages: messages.length,
        activeUsers: channels.length,
        averageResponseTime: '2.5 dakika',
        engagementRate: '85%'
      },
      charts: reportForm.includeCharts ? [
        { type: 'message_activity', data: [120, 150, 180, 200, 160, 140] },
        { type: 'user_engagement', data: [85, 90, 88, 92, 87, 89] }
      ] : []
    };

    setShowReportModal(false);
    setReportForm({
      title: '',
      type: 'activity',
      dateRange: { 
        start: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7 gün önce
        end: new Date() 
      },
      includeCharts: true
    });
    toast.success('Rapor oluşturuldu ve indirildi');
  };

  // Kanalları yükle
  const loadChannels = async () => {
    // Mock data
    setChannels(mockChannels);
  };

  // Mesajları yükle
  const loadMessages = async (channelId: string) => {
    // Mock data
    setMessages(mockMessagesByChannel[channelId] || []);
  };

  // Kanal seçimi
  const handleChannelSelect = (channel: Channel) => {
    setSelectedChannel(channel);
    loadMessages(channel.id);
    
    // Kanal seçildiğinde okundu olarak işaretle
    if (channel.unreadCount && channel.unreadCount > 0) {
      setChannels(prev => prev.map(ch => 
        ch.id === channel.id 
          ? { ...ch, unreadCount: 0 }
          : ch
      ));
      
      // Başarı mesajı göster
      toast.success(`${channel.name} kanalı okundu olarak işaretlendi`);
    }
  };

  // Effect'ler
  useEffect(() => {
    executeWithLoading('channels', loadChannels, {
      successMessage: 'Kanallar başarıyla yüklendi',
      errorMessage: 'Kanallar yüklenirken hata oluştu'
    });
    
    // Örnek bildirimler ekle (sadece ilk kez)
    const hasShownWelcomeNotifications = localStorage.getItem('hasShownWelcomeNotifications');
    
    if (!hasShownWelcomeNotifications) {
      setTimeout(() => {
        addNotification({
          title: 'Hoş Geldiniz!',
          message: 'EmployeeChat sistemine başarıyla giriş yaptınız.',
          type: 'success',
          priority: 'medium',
          category: 'system'
        });
      }, 1000);

      setTimeout(() => {
        addNotification({
          title: 'Yeni Mesaj',
          message: 'Ahmet Yılmaz size mesaj gönderdi.',
          type: 'message',
          priority: 'high',
          category: 'chat',
          senderName: 'Ahmet Yılmaz',
          channelName: 'Genel'
        });
      }, 3000);

      setTimeout(() => {
        addNotification({
          title: 'Dosya Paylaşıldı',
          message: 'Yeni bir dosya paylaşıldı: proje_raporu.pdf',
          type: 'file',
          priority: 'medium',
          category: 'file',
          senderName: 'Mehmet Demir'
        });
      }, 5000);

      // Bildirimlerin gösterildiğini işaretle
      localStorage.setItem('hasShownWelcomeNotifications', 'true');
    }
    
    // LocalStorage'dan Supabase'e veri taşıma (kullanıcı giriş yapmışsa)
    if (user) {
      migrateFromLocalStorage()
        .then(() => {
          console.log('Veriler başarıyla Supabase\'e taşındı');
        })
        .catch((error) => {
          console.error('Veri taşıma hatası:', error);
        });
    }

    // AgentPortal'dan gelen takım mesajlarını dinle
    const handleTeamMessage = (event: any) => {
      const teamMessage = event.detail;
      
      // Eğer genel kanal seçiliyse mesajı ekle
      if (selectedChannel && selectedChannel.name === 'Genel') {
        const chatMessage: ChatMessage = {
          id: teamMessage.id,
          content: teamMessage.message,
          senderId: 'agent-' + teamMessage.sender,
          senderName: teamMessage.sender,
          senderRole: 'agent',
          senderAvatar: teamMessage.avatar,
          channelId: selectedChannel.id,
          messageType: 'text',
          timestamp: teamMessage.timestamp
        };
        
        setMessages(prev => [...prev, chatMessage]);
      }
    };

    window.addEventListener('teamMessageSent', handleTeamMessage);

    return () => {
      window.removeEventListener('teamMessageSent', handleTeamMessage);
    };
  }, [user, selectedChannel]);

  useEffect(() => {
    if (selectedChannel) {
      loadMessages(selectedChannel.id);
      
      // Kanal seçildiğinde o kanala ait okunmamış bildirimleri otomatik olarak okundu olarak işaretle
      if (notifications.length > 0) {
        const unreadChannelNotifications = notifications.filter(
          (n) => !n.isRead && n.channelId === selectedChannel.id
        );

        // O kanala ait okunmamış bildirimleri okundu olarak işaretle
        unreadChannelNotifications.forEach((notification) => {
          markAsRead(notification.id);
        });
      }
    }
  }, [selectedChannel, notifications, markAsRead]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // MessageInput'tan gelen event'leri dinle
  useEffect(() => {
    const handleOpenAdvancedSearch = () => {
      setShowAdvancedSearchPanel(true);
    };

    const handleOpenPollCreator = () => {
      setShowPollCreator(true);
    };

    const handleOpenTemplateSelector = () => {
      setShowTemplateSelector(true);
    };

    const handleOpenTaskCreator = () => {
      setShowTaskCreator(true);
    };

    const handleGenerateSummary = () => {
      generateConversationSummary();
    };

    // Event listener'ları ekle
    window.addEventListener('openAdvancedSearch', handleOpenAdvancedSearch);
    window.addEventListener('openPollCreator', handleOpenPollCreator);
    window.addEventListener('openTemplateSelector', handleOpenTemplateSelector);
    window.addEventListener('openTaskCreator', handleOpenTaskCreator);
    window.addEventListener('generateSummary', handleGenerateSummary);

    // Cleanup
    return () => {
      window.removeEventListener('openAdvancedSearch', handleOpenAdvancedSearch);
      window.removeEventListener('openPollCreator', handleOpenPollCreator);
      window.removeEventListener('openTemplateSelector', handleOpenTemplateSelector);
      window.removeEventListener('openTaskCreator', handleOpenTaskCreator);
      window.removeEventListener('generateSummary', handleGenerateSummary);
    };
  }, []);

  if (isLoading('channels')) {
    return (
      <div className="flex items-center justify-center h-screen">
        <InlineLoading
          isLoading={true}
          message="EmployeeChat yükleniyor..."
        >
          <div></div>
        </InlineLoading>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-red-500 text-center">
          <h2 className="text-xl font-bold mb-2">Hata</h2>
          <p>{error}</p>
        </div>
      </div>
    );
  }

  return (
    <ErrorBoundary level="page">
      <div 
        className={`flex h-screen bg-white dark:bg-gray-900 dark:bg-gray-950 ${uiuxClasses.fontSizeClass} ${settings.reducedMotion ? 'motion-reduce' : ''} ${settings.highContrast ? 'high-contrast' : ''} ${isDragOver ? 'bg-blue-50 dark:bg-blue-900/20' : ''}`}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
      >
      {/* Left Column - Channel List */}
      <div className="w-80 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex flex-col">
        <ChannelList
          channels={channels}
          selectedChannel={selectedChannel}
          onChannelSelect={handleChannelSelect}
          onCreateChannel={() => {}}
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          showChannelList={true}
          onChannelUpdate={setChannels}
        />
      </div>

      {/* Middle Column - Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {/* Header - Her zaman görünür */}
        <div className={`bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4 ${uiuxClasses.shadowClass} ${uiuxClasses.borderRadiusClass} sticky top-0 z-10`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              {selectedChannel ? (
                <>
                  <div className="flex items-center space-x-2">
                    <span className="text-lg font-semibold text-gray-900 dark:text-white">#{selectedChannel.name}</span>
                  </div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    {selectedChannel.description}
                  </div>
                </>
              ) : (
                <div className="flex items-center space-x-2">
                  <span className="text-lg font-semibold text-gray-900 dark:text-white">TeamChat</span>
                </div>
              )}
            </div>
            
            {/* Header Icons */}
            <div className="flex items-center space-x-3">
              {/* Feedback Button */}
              <FeedbackButton 
                pageSource="employee-chat" 
                position="inline"
                className="inline-flex items-center px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-medium"
              />
              {/* Notifications */}
              <button 
                onClick={() => setShowNotificationPanel(true)}
                className="relative p-1.5 text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors" 
                title="Bildirimler"
              >
                <Bell className="w-5 h-5" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                    {unreadCount > 99 ? '99+' : unreadCount}
                  </span>
                )}
              </button>

              {/* UI/UX Settings */}
              <button 
                onClick={() => setShowUIUXSettings(true)}
                className="p-1.5 text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors" 
                title="UI/UX Ayarları"
              >
                <Settings className="w-5 h-5" />
              </button>

              {/* Dark Mode Toggle */}
              <button 
                onClick={toggleDarkMode}
                className="p-1.5 text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors" 
                title={isDarkMode ? "Açık moda geç" : "Koyu moda geç"}
              >
                {isDarkMode ? (
                  <Sun className="w-5 h-5 text-yellow-500" />
                ) : (
                  <Moon className="w-5 h-5 text-gray-600" />
                )}
              </button>
              
              {/* Sabitlenen Mesajlar */}
              {selectedChannel && getPinnedMessageCount(selectedChannel.id) > 0 && (
                <button 
                  onClick={() => setShowPinnedMessages(true)}
                  className="relative p-1.5 text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors" 
                  title="Sabitlenen mesajlar"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                  </svg>
                  <span className="absolute -top-1 -right-1 bg-blue-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">
                    {getPinnedMessageCount(selectedChannel.id)}
                  </span>
                </button>
              )}

              {/* Görev Yönetimi */}
              <button 
                onClick={() => setShowTaskManager(true)}
                className="relative p-1.5 text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors" 
                title="Görev yönetimi"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                </svg>
                {taskStats.total > 0 && (
                  <span className="absolute -top-1 -right-1 bg-purple-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">
                    {taskStats.total}
                  </span>
                )}
              </button>

              {/* Önemli Mesajlar */}
              {getStarredMessageCount() > 0 && (
                <button 
                  onClick={() => setShowStarredMessages(true)}
                  className="relative p-1.5 text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors" 
                  title="Önemli mesajlar"
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                  </svg>
                  <span className="absolute -top-1 -right-1 bg-yellow-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">
                    {getStarredMessageCount()}
                  </span>
                </button>
              )}

              {/* Kanal İçi Arama */}
              {selectedChannel && (
                <button 
                  onClick={() => setShowChannelSearch(!showChannelSearch)}
                  className="p-1.5 text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors" 
                  title="Kanal içinde ara"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </button>
              )}

              {/* Kanal Arama */}
              <button 
                onClick={() => {
                  const searchInput = document.querySelector('input[placeholder*="ara"]') as HTMLInputElement;
                  if (searchInput) {
                    searchInput.focus();
                  }
                }}
                className="p-1.5 text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors" 
                title="Kanal ara"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 21l4-4 4 4M3 10h18M7 15h10" />
                </svg>
              </button>
            </div>
          </div>

          {/* Kanal İçi Arama Çubuğu */}
          {showChannelSearch && selectedChannel && (
            <div className="bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-3">
              <div className="flex items-center space-x-3">
                <div className="flex-1 relative">
                  <input
                    type="text"
                    placeholder={`#${selectedChannel.name} kanalında ara...`}
                    value={channelSearchTerm}
                    onChange={(e) => {
                      setChannelSearchTerm(e.target.value);
                      searchChannelMessages(e.target.value);
                    }}
                    className="w-full px-4 py-2 pl-10 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <svg className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                <button
                  onClick={() => {
                    setShowChannelSearch(false);
                    setChannelSearchTerm('');
                    setFilteredMessages(messages);
                  }}
                  className="p-1.5 text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                  title="Aramayı kapat"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              {channelSearchTerm && (
                <div className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                  {filteredMessages.length} sonuç bulundu
                </div>
              )}
            </div>
          )}
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto pt-8">
          {selectedChannel ? (
            messages.length > 0 ? (
              <div className="p-6">
                {/* Bildirim Göstergesi - Kanal İçinde */}
                {unreadCount > 0 && (
                  <div className="mb-4 p-3 bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <div className="w-6 h-6 bg-orange-500 rounded-full flex items-center justify-center">
                          <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                          </svg>
                        </div>
                        <span className="text-sm text-orange-800 dark:text-orange-200 font-medium">
                          {unreadCount} okunmamış bildirim
                        </span>
                      </div>
                      <button
                        onClick={() => setShowNotificationPanel(true)}
                        className="text-orange-600 dark:text-orange-400 hover:text-orange-800 dark:hover:text-orange-200 text-xs font-medium"
                      >
                        Görüntüle
                      </button>
                    </div>
                  </div>
                )}
                
                <MessageList
                  messages={channelSearchTerm ? filteredMessages : messages}
                  voiceMessages={voiceMessages}
                  currentUserId="user1"
                  onEditMessage={editMessage}
                  onDeleteMessage={deleteMessage}
                  onPinMessage={togglePinMessage}
                  onReplyToMessage={handleReplyToMessage}
                  editingMessage={editingMessage}
                  setEditingMessage={setEditingMessage}
                  showActionMenu={showActionMenu}
                  setShowActionMenu={setShowActionMenu}
                  replyingTo={replyingTo}
                  cancelReply={cancelReply}
                  pollVotes={pollVotes}
                  onPollVote={handlePollVote}
                  userVotes={userVotes}
                  messageReadStatus={messageReadStatus}
                  onMessageView={handleMessageView}
                  typingUsers={typingUsers}
                  onCopyMessage={copyMessageToClipboard}
                  onForwardMessage={(message) => {
                    setMessageToForward(message);
                    setShowForwardModal(true);
                  }}
                  onStarMessage={toggleStarMessage}
                  isMessagePinned={isMessagePinned}
                  isMessageStarred={isMessageStarred}
                  onCreateTask={createTaskFromMessage}
                />

                {/* Yazıyor Göstergesi */}
                {typingUsers.length > 0 && (
                  <div className="px-6 py-2 text-sm text-gray-500 dark:text-gray-400 italic">
                    <div className="flex items-center space-x-2">
                      <div className="flex space-x-1">
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                      </div>
                      <span>
                        {typingUsers.map(t => t.userName).join(', ')} yazıyor...
                      </span>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center justify-center h-full">
                <div className="text-center text-gray-500 dark:text-gray-300">
                  <div className="w-16 h-16 mx-auto mb-4 border-2 border-gray-300 dark:border-gray-600 rounded-full flex items-center justify-center">
                    <svg className="w-8 h-8 text-gray-400 dark:text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-semibold mb-2 dark:text-white">Kanal mesajları</h3>
                  <p>Bu kanalda henüz mesaj yok.</p>
                  
                  {/* Bildirim Göstergesi - Boş Kanal */}
                  {unreadCount > 0 && (
                    <div className="mt-6 p-4 bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <div className="w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center">
                            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                            </svg>
                          </div>
                          <div>
                            <h4 className="text-sm font-medium text-orange-800 dark:text-orange-200">Okunmamış Bildirimler</h4>
                            <p className="text-xs text-orange-600 dark:text-orange-300">{unreadCount} adet okunmamış bildiriminiz var</p>
                          </div>
                        </div>
                        <button
                          onClick={() => setShowNotificationPanel(true)}
                          className="text-orange-600 dark:text-orange-400 hover:text-orange-800 dark:hover:text-orange-200 text-sm font-medium"
                        >
                          Görüntüle
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )
          ) : (
            <div className="flex items-center justify-center h-full">
              <div className="text-center text-gray-500 dark:text-gray-300">
                <h3 className="text-xl font-semibold mb-2 dark:text-white">Kanal Seçin</h3>
                <p>Mesajlaşmaya başlamak için bir kanal seçin</p>
                
                {/* Bildirim Göstergesi */}
                {unreadCount > 0 && (
                  <div className="mt-6 p-4 bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <div className="w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center">
                          <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                          </svg>
                        </div>
                        <div>
                          <h4 className="text-sm font-medium text-orange-800 dark:text-orange-200">Okunmamış Bildirimler</h4>
                          <p className="text-xs text-orange-600 dark:text-orange-300">{unreadCount} adet okunmamış bildiriminiz var</p>
                        </div>
                      </div>
                      <button
                        onClick={() => setShowNotificationPanel(true)}
                        className="text-orange-600 dark:text-orange-400 hover:text-orange-800 dark:hover:text-orange-200 text-sm font-medium"
                      >
                        Görüntüle
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Message Input */}
        {selectedChannel && (
          <div className="border-t border-gray-200 p-4">
            <MessageInput
              newMessage={newMessage}
              setNewMessage={(value) => {
                setNewMessage(value);
                // Yazıyor göstergesini başlat
                if (value.trim()) {
                  startTyping();
                } else {
                  stopTyping();
                }
              }}
              onSendMessage={sendMessage}
              onFileUpload={handleFileUpload}
              onVoiceRecord={startVoiceRecording}
              isRecording={isRecording}
              replyingTo={replyingTo}
              cancelReply={cancelReply}
              sendReply={sendReply}
              replyContent={replyContent}
              setReplyContent={setReplyContent}
              onVoiceMessage={handleVoiceMessage}
              onTypingStart={startTyping}
              onTypingStop={stopTyping}
            />
          </div>
        )}
      </div>

      {/* Right Column - Users/Employees */}
      <div className="w-64 bg-white dark:bg-gray-800 border-l border-gray-200 dark:border-gray-700 flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-medium text-gray-900 dark:text-white">Çalışanlar</h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">16 çalışan</p>
            </div>
          </div>
        </div>

        {/* Users List */}
        <div className="flex-1 overflow-y-auto p-4">
          <div className="space-y-3">
            {[
              { id: '1', name: 'Ahmet Yılmaz', title: 'Yazılım Geliştirici', avatar: 'AY', color: 'bg-blue-500', status: 'green' },
              { id: '2', name: 'Ayşe Çelik', title: 'Proje Yöneticisi', avatar: 'AÇ', color: 'bg-green-500', status: 'green' },
              { id: '3', name: 'Ali Demir', title: 'UI/UX Tasarımcı', avatar: 'AD', color: 'bg-purple-500', status: 'yellow' },
              { id: '4', name: 'Aylin Doğan', title: 'İnsan Kaynakları', avatar: 'AD', color: 'bg-orange-500', status: 'gray' },
              { id: '5', name: 'Mehmet Kaya', title: 'Satış Müdürü', avatar: 'MK', color: 'bg-red-500', status: 'green' },
              { id: '6', name: 'Fatma Özkan', title: 'Muhasebe Uzmanı', avatar: 'FÖ', color: 'bg-indigo-500', status: 'gray' }
            ].map((user) => (
              <UserItem 
                key={user.id} 
                user={user} 
                channels={channels} 
                setChannels={setChannels} 
                setSelectedChannel={setSelectedChannel} 
              />
            ))}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="p-4 border-t border-gray-200 dark:border-gray-700">
          <h4 className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">Hızlı Aksiyonlar</h4>
          <div className="space-y-1">
            <button 
              onClick={() => {
                // Görevler sayfasına yönlendirme - EmployeePortal'a geçiş
                window.location.href = '/employee';
              }}
              className="w-full flex items-center space-x-2 px-2 py-1 text-xs text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 rounded transition-colors"
            >
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>Görevler</span>
            </button>
            <button 
              onClick={() => setShowNewChannelModal(true)}
              className="w-full flex items-center space-x-2 px-2 py-1 text-xs text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 rounded transition-colors"
            >
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              <span>Yeni Kanal</span>
            </button>
            <button 
              onClick={() => setShowBulkMessageModal(true)}
              className="w-full flex items-center space-x-2 px-2 py-1 text-xs text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 rounded transition-colors"
            >
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
              <span>Toplu Mesaj</span>
            </button>
            <button 
              onClick={() => setShowReportModal(true)}
              className="w-full flex items-center space-x-2 px-2 py-1 text-xs text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 rounded transition-colors"
            >
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              <span>Rapor Oluştur</span>
            </button>
          </div>
        </div>
      </div>

      {/* Sürükle-Bırak Göstergesi */}
      {isDragOver && (
        <div className="fixed inset-0 bg-blue-500 bg-opacity-20 z-50 flex items-center justify-center pointer-events-none">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-8 shadow-xl border-2 border-dashed border-blue-500">
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-4 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
                <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Dosyaları Buraya Bırakın</h3>
              <p className="text-gray-600 dark:text-gray-300">Dosyalarınızı yüklemek için buraya bırakın</p>
            </div>
          </div>
        </div>
      )}

      {/* YENİ ÖZELLİKLER İÇİN MODAL'LAR VE PANELLER */}

      {/* Gelişmiş Arama Paneli */}
      {showAdvancedSearchPanel && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Gelişmiş Arama</h3>
              <button
                onClick={() => setShowAdvancedSearchPanel(false)}
                className="text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="space-y-4">
              {/* Tarih Aralığı */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Tarih Aralığı</label>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="date"
                    className="border border-gray-300 rounded-lg px-3 py-2"
                    onChange={(e) => setAdvancedSearchFilters(prev => ({
                      ...prev,
                      dateRange: { ...prev.dateRange, start: e.target.value ? new Date(e.target.value) : null }
                    }))}
                  />
                  <input
                    type="date"
                    className="border border-gray-300 rounded-lg px-3 py-2"
                    onChange={(e) => setAdvancedSearchFilters(prev => ({
                      ...prev,
                      dateRange: { ...prev.dateRange, end: e.target.value ? new Date(e.target.value) : null }
                    }))}
                  />
                </div>
              </div>

              {/* Gönderen */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Gönderen</label>
                <select
                  multiple
                  className="border border-gray-300 rounded-lg px-3 py-2 w-full"
                  onChange={(e) => {
                    const selected = Array.from(e.target.selectedOptions, option => option.value);
                    setAdvancedSearchFilters(prev => ({ ...prev, sender: selected }));
                  }}
                >
                  <option value="user1">Test User</option>
                  <option value="user2">Ahmet Yılmaz</option>
                  <option value="user3">Ayşe Çelik</option>
                </select>
              </div>

              {/* Mesaj Tipi */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Mesaj Tipi</label>
                <div className="space-y-2">
                  {['text', 'announcement', 'file', 'voice'].map(type => (
                    <label key={type} className="flex items-center">
                      <input
                        type="checkbox"
                        className="mr-2"
                        onChange={(e) => {
                          if (e.target.checked) {
                            setAdvancedSearchFilters(prev => ({
                              ...prev,
                              messageType: [...prev.messageType, type]
                            }));
                          } else {
                            setAdvancedSearchFilters(prev => ({
                              ...prev,
                              messageType: prev.messageType.filter(t => t !== type)
                            }));
                          }
                        }}
                      />
                      <span className="text-sm text-gray-700">{type}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Diğer Filtreler */}
              <div className="space-y-2">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    className="mr-2"
                    checked={advancedSearchFilters.hasAttachments}
                    onChange={(e) => setAdvancedSearchFilters(prev => ({
                      ...prev,
                      hasAttachments: e.target.checked
                    }))}
                  />
                  <span className="text-sm text-gray-700">Ek dosyası olan mesajlar</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    className="mr-2"
                    checked={advancedSearchFilters.hasMentions}
                    onChange={(e) => setAdvancedSearchFilters(prev => ({
                      ...prev,
                      hasMentions: e.target.checked
                    }))}
                  />
                  <span className="text-sm text-gray-700">Mention içeren mesajlar</span>
                </label>
              </div>

              {/* Anahtar Kelimeler */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Anahtar Kelimeler</label>
                <input
                  type="text"
                  placeholder="Virgülle ayırarak yazın"
                  className="border border-gray-300 rounded-lg px-3 py-2 w-full"
                  onChange={(e) => setAdvancedSearchFilters(prev => ({
                    ...prev,
                    keywords: e.target.value.split(',').map(k => k.trim()).filter(k => k)
                  }))}
                />
              </div>

              {/* Arama Butonu */}
              <div className="flex space-x-2">
                <button
                  onClick={performAdvancedSearch}
                  className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
                >
                  Ara
                </button>
                <button
                  onClick={() => setShowAdvancedSearchPanel(false)}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  İptal
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Anket Oluşturma Modal'ı */}
      {showPollCreator && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Anket Oluştur</h3>
              <button
                onClick={() => setShowPollCreator(false)}
                className="text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Soru</label>
                <input
                  type="text"
                  value={pollForm.question}
                  onChange={(e) => setPollForm(prev => ({ ...prev, question: e.target.value }))}
                  className="border border-gray-300 rounded-lg px-3 py-2 w-full"
                  placeholder="Anket sorusunu yazın"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Seçenekler</label>
                {pollForm.options.map((option, index) => (
                  <div key={index} className="flex items-center space-x-2 mb-2">
                    <input
                      type="text"
                      value={option}
                      onChange={(e) => {
                        const newOptions = [...pollForm.options];
                        newOptions[index] = e.target.value;
                        setPollForm(prev => ({ ...prev, options: newOptions }));
                      }}
                      className="flex-1 border border-gray-300 rounded-lg px-3 py-2"
                      placeholder={`Seçenek ${index + 1}`}
                    />
                    {pollForm.options.length > 2 && (
                      <button
                        onClick={() => {
                          const newOptions = pollForm.options.filter((_, i) => i !== index);
                          setPollForm(prev => ({ ...prev, options: newOptions }));
                        }}
                        className="text-red-500 hover:text-red-700"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    )}
                  </div>
                ))}
                <button
                  onClick={() => setPollForm(prev => ({ ...prev, options: [...prev.options, ''] }))}
                  className="text-blue-600 hover:text-blue-800 text-sm"
                >
                  + Seçenek Ekle
                </button>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Bitiş Tarihi (Opsiyonel)</label>
                <input
                  type="datetime-local"
                  onChange={(e) => setPollForm(prev => ({ ...prev, expiresAt: e.target.value ? new Date(e.target.value) : undefined }))}
                  className="border border-gray-300 rounded-lg px-3 py-2 w-full"
                />
              </div>

              <div className="flex space-x-2">
                <button
                  onClick={createPoll}
                  className="flex-1 bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700"
                >
                  Anket Oluştur
                </button>
                <button
                  onClick={sendPollAsMessage}
                  className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
                >
                  Anketi Mesaj Olarak Gönder
                </button>
                <button
                  onClick={() => setShowPollCreator(false)}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  İptal
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Mesaj Şablonları Modal'ı */}
      {showTemplateSelector && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Mesaj Şablonları</h3>
              <div className="flex space-x-2">
                <button
                  onClick={() => setShowTemplateCreator(true)}
                  className="bg-green-600 text-white px-3 py-1 rounded-lg hover:bg-green-700 text-sm"
                >
                  Yeni Şablon
                </button>
                <button
                  onClick={() => setShowTemplateSelector(false)}
                  className="text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            <div className="space-y-4">
              {messageTemplates.length === 0 ? (
                <p className="text-gray-500 text-center py-8">Henüz şablon bulunmamaktadır</p>
              ) : (
                messageTemplates.map(template => (
                  <div key={template.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium text-gray-900">{template.name}</h4>
                      <span className="text-xs text-gray-500">{template.usageCount} kullanım</span>
                    </div>
                    <p className="text-sm text-gray-600 mb-3">{template.content}</p>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-500">{template.category}</span>
                      <button
                        onClick={() => useMessageTemplate(template)}
                        className="bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700"
                      >
                        Kullan
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Mesaj Şablonu Oluşturma Modal'ı */}
      {showTemplateCreator && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Yeni Şablon Oluştur</h3>
              <button
                onClick={() => setShowTemplateCreator(false)}
                className="text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Şablon Adı</label>
                <input
                  type="text"
                  value={templateForm.name}
                  onChange={(e) => setTemplateForm(prev => ({ ...prev, name: e.target.value }))}
                  className="border border-gray-300 rounded-lg px-3 py-2 w-full"
                  placeholder="Şablon adını yazın"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Kategori</label>
                <select
                  value={templateForm.category}
                  onChange={(e) => setTemplateForm(prev => ({ ...prev, category: e.target.value }))}
                  className="border border-gray-300 rounded-lg px-3 py-2 w-full"
                >
                  <option value="genel">Genel</option>
                  <option value="proje">Proje</option>
                  <option value="destek">Destek</option>
                  <option value="satış">Satış</option>
                  <option value="teknik">Teknik</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">İçerik</label>
                <textarea
                  value={templateForm.content}
                  onChange={(e) => setTemplateForm(prev => ({ ...prev, content: e.target.value }))}
                  className="border border-gray-300 rounded-lg px-3 py-2 w-full h-32 resize-none"
                  placeholder="Şablon içeriğini yazın"
                />
              </div>

              <div className="flex space-x-2">
                <button
                  onClick={createMessageTemplate}
                  className="flex-1 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700"
                >
                  Şablon Oluştur
                </button>
                <button
                  onClick={() => setShowTemplateCreator(false)}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  İptal
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Görev Oluşturma Modal'ı */}
      {showTaskCreator && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Görev Oluştur</h3>
              <button
                onClick={() => setShowTaskCreator(false)}
                className="text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Görev Başlığı</label>
                <input
                  type="text"
                  value={taskForm.title}
                  onChange={(e) => setTaskForm(prev => ({ ...prev, title: e.target.value }))}
                  className="border border-gray-300 rounded-lg px-3 py-2 w-full"
                  placeholder="Görev başlığını yazın"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Açıklama</label>
                <textarea
                  value={taskForm.description}
                  onChange={(e) => setTaskForm(prev => ({ ...prev, description: e.target.value }))}
                  className="border border-gray-300 rounded-lg px-3 py-2 w-full h-24 resize-none"
                  placeholder="Görev açıklamasını yazın"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Atanan Kişiler</label>
                
                {/* Hızlı Seçim Butonları */}
                <div className="flex space-x-2 mb-2">
                  <button
                    type="button"
                    onClick={() => {
                      const allUserIds = ['user1', 'user2', 'user3', 'user4', 'user5', 'user6', 'user7'];
                      setTaskForm(prev => ({ ...prev, assignedTo: allUserIds }));
                    }}
                    className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors"
                  >
                    Tümünü Seç
                  </button>
                  <button
                    type="button"
                    onClick={() => setTaskForm(prev => ({ ...prev, assignedTo: [] }))}
                    className="text-xs px-2 py-1 bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors"
                  >
                    Tümünü Temizle
                  </button>
                </div>

                <div className="border border-gray-300 rounded-lg p-3 max-h-32 overflow-y-auto">
                  <div className="space-y-2">
                    {[
                      { id: 'user1', name: 'Test User', role: 'Sistem Yöneticisi' },
                      { id: 'user2', name: 'Ahmet Yılmaz', role: 'Yazılım Geliştirici' },
                      { id: 'user3', name: 'Ayşe Çelik', role: 'Proje Yöneticisi' },
                      { id: 'user4', name: 'Ali Demir', role: 'UI/UX Tasarımcı' },
                      { id: 'user5', name: 'Aylin Doğan', role: 'İnsan Kaynakları' },
                      { id: 'user6', name: 'Mehmet Kaya', role: 'Satış Müdürü' },
                      { id: 'user7', name: 'Fatma Özkan', role: 'Muhasebe Uzmanı' }
                    ].map((user) => (
                      <label key={user.id} className="flex items-center space-x-3 cursor-pointer hover:bg-gray-50 p-2 rounded">
                        <input
                          type="checkbox"
                          value={user.id}
                          checked={taskForm.assignedTo.includes(user.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setTaskForm(prev => ({
                                ...prev,
                                assignedTo: [...prev.assignedTo, user.id]
                              }));
                            } else {
                              setTaskForm(prev => ({
                                ...prev,
                                assignedTo: prev.assignedTo.filter(id => id !== user.id)
                              }));
                            }
                          }}
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                        <div className="flex-1">
                          <div className="text-sm font-medium text-gray-900">{user.name}</div>
                          <div className="text-xs text-gray-500">{user.role}</div>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>
                {taskForm.assignedTo.length > 0 && (
                  <div className="mt-2 text-xs text-gray-600">
                    Seçilen: {taskForm.assignedTo.length} kişi
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Bitiş Tarihi</label>
                <input
                  type="datetime-local"
                  value={taskForm.dueDate && !isNaN(taskForm.dueDate.getTime()) ? taskForm.dueDate.toISOString().slice(0, 16) : ''}
                  onChange={(e) => setTaskForm(prev => ({ ...prev, dueDate: e.target.value ? new Date(e.target.value) : new Date() }))}
                  className="border border-gray-300 rounded-lg px-3 py-2 w-full"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Öncelik</label>
                <select
                  value={taskForm.priority}
                  onChange={(e) => setTaskForm(prev => ({ ...prev, priority: e.target.value as 'low' | 'medium' | 'high' }))}
                  className="border border-gray-300 rounded-lg px-3 py-2 w-full"
                >
                  <option value="low">Düşük</option>
                  <option value="medium">Orta</option>
                  <option value="high">Yüksek</option>
                </select>
              </div>

              <div className="flex space-x-2">
                <button
                  onClick={createTask}
                  className="flex-1 bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700"
                >
                  Görev Oluştur
                </button>
                <button
                  onClick={() => setShowTaskCreator(false)}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  İptal
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Akıllı Özetleme Modal'ı */}
      {showSummary && currentSummary && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Konuşma Özeti</h3>
              <button
                onClick={() => setShowSummary(false)}
                className="text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="space-y-4">
              <div className="bg-blue-50 p-4 rounded-lg">
                <h4 className="font-medium text-blue-900 mb-2">Özet</h4>
                <p className="text-blue-800">{currentSummary.summary}</p>
              </div>

              <div>
                <h4 className="font-medium text-gray-900 mb-2">Anahtar Noktalar</h4>
                <ul className="space-y-1">
                  {currentSummary.keyPoints.map((point, index) => (
                    <li key={index} className="flex items-center text-sm text-gray-700">
                      <svg className="w-4 h-4 text-blue-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      {point}
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <h4 className="font-medium text-gray-900 mb-2">Aksiyon Maddeleri</h4>
                <ul className="space-y-1">
                  {currentSummary.actionItems.map((item, index) => (
                    <li key={index} className="flex items-center text-sm text-gray-700">
                      <svg className="w-4 h-4 text-orange-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                      </svg>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="flex items-center justify-between text-sm text-gray-500">
                <span>Katılımcılar: {currentSummary.participants.join(', ')}</span>
                <span>Mesaj Sayısı: {currentSummary.messageCount}</span>
              </div>

              <button
                onClick={() => setShowSummary(false)}
                className="w-full bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700"
              >
                Kapat
              </button>
            </div>
          </div>
        </div>
      )}

             {/* Anketler Listesi */}
       {polls.length > 0 && selectedChannel && (
         <div className="absolute bottom-20 right-4 w-80 bg-white rounded-lg shadow-lg border border-gray-200 max-h-96 overflow-y-auto">
           <div className="p-4 border-b border-gray-200">
             <h4 className="font-medium text-gray-900">Aktif Anketler</h4>
           </div>
           <div className="p-4 space-y-4">
             {polls.filter(poll => poll.channelId === selectedChannel.id && poll.isActive).map(poll => (
               <div key={poll.id} className="border border-gray-200 rounded-lg p-3">
                 <h5 className="font-medium text-gray-900 mb-2">{poll.question}</h5>
                 <div className="space-y-2">
                   {poll.options.map((option, index) => (
                     <button
                       key={index}
                       onClick={() => votePoll(poll.id, option)}
                       className="w-full text-left p-2 rounded border border-gray-200 hover:bg-gray-50 text-sm"
                     >
                       {option}
                       {poll.votes[option] && (
                         <span className="float-right text-blue-600 font-medium">
                           {poll.votes[option]} oy
                         </span>
                       )}
                     </button>
                   ))}
                 </div>
               </div>
             ))}
           </div>
         </div>
       )}

       {/* HIZLI AKSİYONLAR MODAL'LARI */}

       {/* Yeni Kanal Oluşturma Modal'ı */}
       {showNewChannelModal && (
         <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
           <div className="bg-white rounded-lg p-6 w-full max-w-md">
             <div className="flex items-center justify-between mb-4">
               <h3 className="text-lg font-semibold text-gray-900">Yeni Kanal Oluştur</h3>
               <button
                 onClick={() => setShowNewChannelModal(false)}
                 className="text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100"
               >
                 <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                 </svg>
               </button>
             </div>

             <div className="space-y-4">
               <div>
                 <label className="block text-sm font-medium text-gray-700 mb-2">Kanal Adı</label>
                 <input
                   type="text"
                   value={newChannelForm.name}
                   onChange={(e) => setNewChannelForm(prev => ({ ...prev, name: e.target.value }))}
                   className="border border-gray-300 rounded-lg px-3 py-2 w-full"
                   placeholder="Kanal adını yazın"
                 />
               </div>

               <div>
                 <label className="block text-sm font-medium text-gray-700 mb-2">Açıklama</label>
                 <textarea
                   value={newChannelForm.description}
                   onChange={(e) => setNewChannelForm(prev => ({ ...prev, description: e.target.value }))}
                   className="border border-gray-300 rounded-lg px-3 py-2 w-full h-20 resize-none"
                   placeholder="Kanal açıklamasını yazın"
                 />
               </div>

               <div>
                 <label className="block text-sm font-medium text-gray-700 mb-2">Kanal Tipi</label>
                 <select
                   value={newChannelForm.type}
                   onChange={(e) => setNewChannelForm(prev => ({ ...prev, type: e.target.value as 'public' | 'private' }))}
                   className="border border-gray-300 rounded-lg px-3 py-2 w-full"
                 >
                   <option value="public">Herkese Açık</option>
                   <option value="private">Özel</option>
                 </select>
               </div>

               <div className="flex space-x-2">
                 <button
                   onClick={createNewChannel}
                   className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
                 >
                   Kanal Oluştur
                 </button>
                 <button
                   onClick={() => setShowNewChannelModal(false)}
                   className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                 >
                   İptal
                 </button>
               </div>
             </div>
           </div>
         </div>
       )}

       {/* Toplu Mesaj Modal'ı */}
       {showBulkMessageModal && (
         <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
           <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[80vh] overflow-y-auto">
             <div className="flex items-center justify-between mb-4">
               <h3 className="text-lg font-semibold text-gray-900">Toplu Mesaj Gönder</h3>
               <button
                 onClick={() => setShowBulkMessageModal(false)}
                 className="text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100"
               >
                 <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                 </svg>
               </button>
             </div>

             <div className="space-y-4">
               <div>
                 <label className="block text-sm font-medium text-gray-700 mb-2">Mesaj İçeriği</label>
                 <textarea
                   value={bulkMessageForm.message}
                   onChange={(e) => setBulkMessageForm(prev => ({ ...prev, message: e.target.value }))}
                   className="border border-gray-300 rounded-lg px-3 py-2 w-full h-32 resize-none"
                   placeholder="Göndermek istediğiniz mesajı yazın"
                 />
               </div>

               <div>
                 <label className="block text-sm font-medium text-gray-700 mb-2">Hedef Kanallar</label>
                 <div className="max-h-32 overflow-y-auto border border-gray-300 rounded-lg p-2">
                   {channels.map(channel => (
                     <label key={channel.id} className="flex items-center space-x-2 p-1">
                       <input
                         type="checkbox"
                         checked={bulkMessageForm.selectedChannels.includes(channel.id)}
                         onChange={(e) => {
                           if (e.target.checked) {
                             setBulkMessageForm(prev => ({
                               ...prev,
                               selectedChannels: [...prev.selectedChannels, channel.id]
                             }));
                           } else {
                             setBulkMessageForm(prev => ({
                               ...prev,
                               selectedChannels: prev.selectedChannels.filter(id => id !== channel.id)
                             }));
                           }
                         }}
                       />
                       <span className="text-sm text-gray-700">#{channel.name}</span>
                     </label>
                   ))}
                 </div>
               </div>

               <div>
                 <label className="block text-sm font-medium text-gray-700 mb-2">Hedef Kullanıcılar</label>
                 <div className="max-h-32 overflow-y-auto border border-gray-300 rounded-lg p-2">
                   {[
                     { id: 'user1', name: 'Test User' },
                     { id: 'user2', name: 'Ahmet Yılmaz' },
                     { id: 'user3', name: 'Ayşe Çelik' },
                     { id: 'user4', name: 'Ali Demir' },
                     { id: 'user5', name: 'Aylin Doğan' }
                   ].map(user => (
                     <label key={user.id} className="flex items-center space-x-2 p-1">
                       <input
                         type="checkbox"
                         checked={bulkMessageForm.selectedUsers.includes(user.id)}
                         onChange={(e) => {
                           if (e.target.checked) {
                             setBulkMessageForm(prev => ({
                               ...prev,
                               selectedUsers: [...prev.selectedUsers, user.id]
                             }));
                           } else {
                             setBulkMessageForm(prev => ({
                               ...prev,
                               selectedUsers: prev.selectedUsers.filter(id => id !== user.id)
                             }));
                           }
                         }}
                       />
                       <span className="text-sm text-gray-700">{user.name}</span>
                     </label>
                   ))}
                 </div>
               </div>

               <div className="flex space-x-2">
                 <button
                   onClick={sendBulkMessage}
                   className="flex-1 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700"
                 >
                   Mesaj Gönder
                 </button>
                 <button
                   onClick={() => setShowBulkMessageModal(false)}
                   className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                 >
                   İptal
                 </button>
               </div>
             </div>
           </div>
         </div>
       )}

       {/* Sabitlenen Mesajlar Modal'ı */}
       {showPinnedMessages && selectedChannel && (
         <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
           <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-2xl max-h-[80vh] overflow-hidden">
             <div className="flex items-center justify-between mb-4">
               <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                 Sabitlenen Mesajlar - #{selectedChannel.name}
               </h3>
               <button
                 onClick={() => setShowPinnedMessages(false)}
                 className="text-gray-400 hover:text-gray-600 dark:text-gray-300 dark:hover:text-gray-100"
               >
                 <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                 </svg>
               </button>
             </div>

             <div className="overflow-y-auto max-h-[60vh] space-y-4">
               {getPinnedMessages(selectedChannel.id).length > 0 ? (
                 getPinnedMessages(selectedChannel.id).map((message) => (
                   <div key={message.id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                     <div className="flex items-start justify-between mb-2">
                       <div className="flex items-center space-x-2">
                         <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                           <span className="text-white text-sm font-semibold">
                             {message.senderName.charAt(0).toUpperCase()}
                           </span>
                         </div>
                         <span className="text-sm font-medium text-gray-900 dark:text-white">
                           {message.senderName}
                         </span>
                         <span className="text-xs text-gray-500 dark:text-gray-400">
                           {new Date(message.timestamp).toLocaleString('tr-TR')}
                         </span>
                       </div>
                       <button
                         onClick={() => togglePinMessage(message.id)}
                         className="text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100"
                         title="Sabitlemeyi kaldır"
                       >
                         <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                           <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                         </svg>
                       </button>
                     </div>
                     <p className="text-sm text-gray-700 dark:text-gray-300">{message.content}</p>
                   </div>
                 ))
               ) : (
                 <div className="text-center text-gray-500 dark:text-gray-400 py-8">
                   Bu kanalda sabitlenen mesaj bulunmuyor.
                 </div>
               )}
             </div>
           </div>
         </div>
       )}

       {/* Görev Yönetimi Modal'ı */}
       {showTaskManager && (
         <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
           <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-6xl max-h-[90vh] overflow-hidden">
             <div className="flex items-center justify-between mb-6">
               <h3 className="text-xl font-semibold text-gray-900 dark:text-white flex items-center space-x-2">
                 <svg className="w-6 h-6 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                 </svg>
                 <span>Görev Yönetimi</span>
               </h3>
               <div className="flex items-center space-x-2">
                 <button
                   onClick={() => setShowTaskCreator(true)}
                   className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                 >
                   + Yeni Görev
                 </button>
                 <button
                   onClick={() => setShowTaskManager(false)}
                   className="text-gray-400 hover:text-gray-600 dark:text-gray-300 dark:hover:text-gray-100"
                 >
                   <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                   </svg>
                 </button>
               </div>
             </div>

             {/* İstatistikler */}
             <div className="grid grid-cols-5 gap-4 mb-6">
               <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                 <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">{taskStats.total}</div>
                 <div className="text-sm text-blue-600 dark:text-blue-400">Toplam</div>
               </div>
               <div className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-lg">
                 <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">{taskStats.pending}</div>
                 <div className="text-sm text-yellow-600 dark:text-yellow-400">Bekliyor</div>
               </div>
               <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                 <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">{taskStats.inProgress}</div>
                 <div className="text-sm text-blue-600 dark:text-blue-400">Devam Ediyor</div>
               </div>
               <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
                 <div className="text-2xl font-bold text-green-600 dark:text-green-400">{taskStats.completed}</div>
                 <div className="text-sm text-green-600 dark:text-green-400">Tamamlandı</div>
               </div>
               <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-lg">
                 <div className="text-2xl font-bold text-red-600 dark:text-red-400">{taskStats.overdue}</div>
                 <div className="text-sm text-red-600 dark:text-red-400">Gecikmiş</div>
               </div>
             </div>

             {/* Filtreler */}
             <div className="flex items-center space-x-4 mb-6">
               <input
                 type="text"
                 placeholder="Görev ara..."
                 value={taskSearchTerm}
                 onChange={(e) => setTaskSearchTerm(e.target.value)}
                 className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
               />
               <select
                 value={taskFilter}
                 onChange={(e) => setTaskFilter(e.target.value as any)}
                 className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
               >
                 <option value="all">Tüm Durumlar</option>
                 <option value="pending">Bekliyor</option>
                 <option value="in_progress">Devam Ediyor</option>
                 <option value="completed">Tamamlandı</option>
                 <option value="overdue">Gecikmiş</option>
               </select>
               <select
                 value={taskPriorityFilter}
                 onChange={(e) => setTaskPriorityFilter(e.target.value as any)}
                 className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
               >
                 <option value="all">Tüm Öncelikler</option>
                 <option value="low">Düşük</option>
                 <option value="medium">Orta</option>
                 <option value="high">Yüksek</option>
                 <option value="urgent">Acil</option>
               </select>
             </div>

             {/* Görev Listesi */}
             <div className="overflow-y-auto max-h-[50vh] space-y-3">
               {getFilteredTasks().length > 0 ? (
                 getFilteredTasks().map((task) => (
                   <div key={task.id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                     <div className="flex items-start justify-between">
                       <div className="flex-1">
                         <div className="flex items-center space-x-2 mb-2">
                           <h4 className="text-lg font-medium text-gray-900 dark:text-white">{task.title}</h4>
                           <span className={`px-2 py-1 text-xs rounded-full ${getPriorityColor(task.priority)} text-white`}>
                             {getPriorityText(task.priority)}
                           </span>
                           <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(task.status)} text-white`}>
                             {getStatusText(task.status)}
                           </span>
                         </div>
                         <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">{task.description}</p>
                         <div className="flex items-center space-x-4 text-xs text-gray-500 dark:text-gray-400">
                           <span>👤 {task.assigneeName}</span>
                           <span>📅 {task.dueDate.toLocaleDateString('tr-TR')}</span>
                           <span>🏷️ {task.tags.join(', ') || 'Etiket yok'}</span>
                         </div>
                       </div>
                       <div className="flex items-center space-x-2">
                         <button
                           onClick={() => {
                             setSelectedTask(task);
                             setShowTaskDetails(true);
                           }}
                           className="p-2 text-gray-400 hover:text-gray-600 dark:text-gray-300 dark:hover:text-gray-100"
                           title="Detayları görüntüle"
                         >
                           <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                             <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                             <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                           </svg>
                         </button>
                         <button
                           onClick={() => deleteTask(task.id)}
                           className="p-2 text-red-400 hover:text-red-600"
                           title="Görevi sil"
                         >
                           <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                             <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                           </svg>
                         </button>
                       </div>
                     </div>
                   </div>
                 ))
               ) : (
                 <div className="text-center text-gray-500 dark:text-gray-400 py-8">
                   Görev bulunamadı.
                 </div>
               )}
             </div>
           </div>
         </div>
       )}

       {/* Görev Oluşturma Modal'ı */}
       {showTaskCreator && (
         <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
           <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
             <div className="flex items-center justify-between mb-6">
               <h3 className="text-xl font-semibold text-gray-900 dark:text-white">Yeni Görev Oluştur</h3>
               <button
                 onClick={() => setShowTaskCreator(false)}
                 className="text-gray-400 hover:text-gray-600 dark:text-gray-300 dark:hover:text-gray-100"
               >
                 <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                 </svg>
               </button>
             </div>

             <div className="space-y-4">
               <div>
                 <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Görev Başlığı *</label>
                 <input
                   type="text"
                   value={taskForm.title}
                   onChange={(e) => setTaskForm(prev => ({ ...prev, title: e.target.value }))}
                   className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                   placeholder="Görev başlığını yazın"
                 />
               </div>

               <div>
                 <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Açıklama</label>
                 <textarea
                   value={taskForm.description}
                   onChange={(e) => setTaskForm(prev => ({ ...prev, description: e.target.value }))}
                   rows={4}
                   className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                   placeholder="Görev açıklamasını yazın"
                 />
               </div>

               <div className="grid grid-cols-2 gap-4">
                 <div>
                   <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Bitiş Tarihi</label>
                   <input
                     type="datetime-local"
                     value={taskForm.dueDate.toISOString().slice(0, 16)}
                     onChange={(e) => setTaskForm(prev => ({ ...prev, dueDate: new Date(e.target.value) }))}
                     className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                   />
                 </div>

                 <div>
                   <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Öncelik</label>
                   <select
                     value={taskForm.priority}
                     onChange={(e) => setTaskForm(prev => ({ ...prev, priority: e.target.value as any }))}
                     className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                   >
                     <option value="low">Düşük</option>
                     <option value="medium">Orta</option>
                     <option value="high">Yüksek</option>
                     <option value="urgent">Acil</option>
                   </select>
                 </div>
               </div>

               <div>
                 <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Atanan Kişi</label>
                 <select
                   value={taskForm.assignedTo[0] || ''}
                   onChange={(e) => setTaskForm(prev => ({ ...prev, assignedTo: e.target.value ? [e.target.value] : [] }))}
                   className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                 >
                   <option value="">Kişi seçin</option>
                   <option value="user1">Test User</option>
                   <option value="user2">Ahmet Yılmaz</option>
                   <option value="user3">Ayşe Çelik</option>
                 </select>
               </div>

               <div className="flex space-x-2">
                 <button
                   onClick={createTask}
                   className="flex-1 bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors"
                 >
                   Görev Oluştur
                 </button>
                 <button
                   onClick={() => setShowTaskCreator(false)}
                   className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                 >
                   İptal
                 </button>
               </div>
             </div>
           </div>
         </div>
       )}

       {/* Önemli Mesajlar Modal'ı */}
       {showStarredMessages && (
         <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
           <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-2xl max-h-[80vh] overflow-hidden">
             <div className="flex items-center justify-between mb-4">
               <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center space-x-2">
                 <svg className="w-5 h-5 text-yellow-500" fill="currentColor" viewBox="0 0 24 24">
                   <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                 </svg>
                 <span>Önemli Mesajlar</span>
               </h3>
               <button
                 onClick={() => setShowStarredMessages(false)}
                 className="text-gray-400 hover:text-gray-600 dark:text-gray-300 dark:hover:text-gray-100"
               >
                 <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                 </svg>
               </button>
             </div>

             <div className="overflow-y-auto max-h-[60vh] space-y-4">
               {getStarredMessages().length > 0 ? (
                 getStarredMessages().map((message) => (
                   <div key={message.id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                     <div className="flex items-start justify-between mb-2">
                       <div className="flex items-center space-x-2">
                         <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                           <span className="text-white text-sm font-semibold">
                             {message.senderName.charAt(0).toUpperCase()}
                           </span>
                         </div>
                         <span className="text-sm font-medium text-gray-900 dark:text-white">
                           {message.senderName}
                         </span>
                         <span className="text-xs text-gray-500 dark:text-gray-400">
                           {new Date(message.timestamp).toLocaleString('tr-TR')}
                         </span>
                         <span className="text-xs text-gray-400 dark:text-gray-500">
                           #{channels.find(ch => ch.id === message.channelId)?.name || 'Bilinmeyen Kanal'}
                         </span>
                       </div>
                       <button
                         onClick={() => toggleStarMessage(message.id)}
                         className="text-yellow-500 hover:text-yellow-600"
                         title="Önemli işaretlemeyi kaldır"
                       >
                         <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                           <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                         </svg>
                       </button>
                     </div>
                     <p className="text-sm text-gray-700 dark:text-gray-300">{message.content}</p>
                   </div>
                 ))
               ) : (
                 <div className="text-center text-gray-500 dark:text-gray-400 py-8">
                   Önemli işaretlenen mesaj bulunmuyor.
                 </div>
               )}
             </div>
           </div>
         </div>
       )}

       {/* Mesaj İletme Modal'ı */}
       {showForwardModal && messageToForward && (
         <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
           <div className="bg-white rounded-lg p-6 w-full max-w-md">
             <div className="flex items-center justify-between mb-4">
               <h3 className="text-lg font-semibold text-gray-900">Mesaj İlet</h3>
               <button
                 onClick={() => {
                   setShowForwardModal(false);
                   setMessageToForward(null);
                 }}
                 className="text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100"
               >
                 <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                 </svg>
               </button>
             </div>

             <div className="space-y-4">
               {/* İletilecek mesaj önizlemesi */}
               <div className="bg-gray-50 rounded-lg p-3">
                 <p className="text-sm text-gray-600 mb-2">İletilecek mesaj:</p>
                 <p className="text-sm text-gray-900">{messageToForward.content}</p>
                 <p className="text-xs text-gray-500 mt-1">
                   {messageToForward.senderName} • {new Date(messageToForward.timestamp).toLocaleString('tr-TR')}
                 </p>
               </div>

               <div>
                 <label className="block text-sm font-medium text-gray-700 mb-2">Hedef Kanal Seçin</label>
                 <div className="max-h-48 overflow-y-auto border border-gray-300 rounded-lg p-2">
                   {channels.filter(ch => ch.id !== selectedChannel?.id).map(channel => (
                     <label key={channel.id} className="flex items-center space-x-2 p-2 hover:bg-gray-50 rounded cursor-pointer">
                       <input
                         type="radio"
                         name="targetChannel"
                         value={channel.id}
                         className="text-blue-600 focus:ring-blue-500"
                       />
                       <div className="flex-1">
                         <span className="text-sm font-medium text-gray-900">#{channel.name}</span>
                         <p className="text-xs text-gray-500">{channel.description}</p>
                       </div>
                     </label>
                   ))}
                 </div>
               </div>

               <div className="flex space-x-2">
                 <button
                   onClick={() => {
                     const selectedChannelId = document.querySelector('input[name="targetChannel"]:checked') as HTMLInputElement;
                     if (selectedChannelId) {
                       forwardMessage(messageToForward, selectedChannelId.value);
                       setShowForwardModal(false);
                       setMessageToForward(null);
                     } else {
                       toast.error('Lütfen bir hedef kanal seçin');
                     }
                   }}
                   className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
                 >
                   İlet
                 </button>
                 <button
                   onClick={() => {
                     setShowForwardModal(false);
                     setMessageToForward(null);
                   }}
                   className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                 >
                   İptal
                 </button>
               </div>
             </div>
           </div>
         </div>
       )}

       {/* Rapor Oluşturma Modal'ı */}
       {showReportModal && (
         <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
           <div className="bg-white rounded-lg p-6 w-full max-w-md">
             <div className="flex items-center justify-between mb-4">
               <h3 className="text-lg font-semibold text-gray-900">Rapor Oluştur</h3>
               <button
                 onClick={() => setShowReportModal(false)}
                 className="text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100"
               >
                 <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                 </svg>
               </button>
             </div>

             <div className="space-y-4">
               <div>
                 <label className="block text-sm font-medium text-gray-700 mb-2">Rapor Başlığı</label>
                 <input
                   type="text"
                   value={reportForm.title}
                   onChange={(e) => setReportForm(prev => ({ ...prev, title: e.target.value }))}
                   className="border border-gray-300 rounded-lg px-3 py-2 w-full"
                   placeholder="Rapor başlığını yazın"
                 />
               </div>

               <div>
                 <label className="block text-sm font-medium text-gray-700 mb-2">Rapor Tipi</label>
                 <select
                   value={reportForm.type}
                   onChange={(e) => setReportForm(prev => ({ ...prev, type: e.target.value as 'activity' | 'performance' | 'engagement' }))}
                   className="border border-gray-300 rounded-lg px-3 py-2 w-full"
                 >
                   <option value="activity">Aktivite Raporu</option>
                   <option value="performance">Performans Raporu</option>
                   <option value="engagement">Katılım Raporu</option>
                 </select>
               </div>

               <div>
                 <label className="block text-sm font-medium text-gray-700 mb-2">Tarih Aralığı</label>
                 <div className="grid grid-cols-2 gap-2">
                   <input
                     type="date"
                     value={reportForm.dateRange.start && !isNaN(reportForm.dateRange.start.getTime()) ? reportForm.dateRange.start.toISOString().split('T')[0] : ''}
                     onChange={(e) => setReportForm(prev => ({
                       ...prev,
                       dateRange: { ...prev.dateRange, start: e.target.value ? new Date(e.target.value) : new Date() }
                     }))}
                     className="border border-gray-300 rounded-lg px-3 py-2"
                   />
                   <input
                     type="date"
                     value={reportForm.dateRange.end && !isNaN(reportForm.dateRange.end.getTime()) ? reportForm.dateRange.end.toISOString().split('T')[0] : ''}
                     onChange={(e) => setReportForm(prev => ({
                       ...prev,
                       dateRange: { ...prev.dateRange, end: e.target.value ? new Date(e.target.value) : new Date() }
                     }))}
                     className="border border-gray-300 rounded-lg px-3 py-2"
                   />
                 </div>
               </div>

               <div>
                 <label className="flex items-center">
                   <input
                     type="checkbox"
                     checked={reportForm.includeCharts}
                     onChange={(e) => setReportForm(prev => ({ ...prev, includeCharts: e.target.checked }))}
                     className="mr-2"
                   />
                   <span className="text-sm text-gray-700">Grafikleri dahil et</span>
                 </label>
               </div>

               <div className="flex space-x-2">
                 <button
                   onClick={generateReport}
                   className="flex-1 bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700"
                 >
                   Rapor Oluştur
                 </button>
                 <button
                   onClick={() => setShowReportModal(false)}
                   className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                 >
                   İptal
                 </button>
               </div>
             </div>
           </div>
         </div>
       )}

       {/* Notification Panel */}
       <NotificationPanel 
         isOpen={showNotificationPanel}
         onClose={() => setShowNotificationPanel(false)}
         notifications={notifications}
         onMarkAsRead={markAsRead}
         onResetNotifications={clearAllNotifications}
       />

       {/* UI/UX Settings Panel */}
       <UIUXSettingsPanel 
         isOpen={showUIUXSettings}
         onClose={() => setShowUIUXSettings(false)}
         settings={settings}
         onUpdateSettings={handleUIUXSettingsUpdate}
         onReset={handleUIUXSettingsReset}
       />

       {/* Veri Taşıma Bileşeni - Sadece kullanıcı giriş yaptığında göster */}
       {user && (
         <DataMigration onComplete={() => {
           console.log('Veri taşıma tamamlandı');
         }} />
       )}
     </div>
    </ErrorBoundary>
   );
 };

export default EmployeeChat;
