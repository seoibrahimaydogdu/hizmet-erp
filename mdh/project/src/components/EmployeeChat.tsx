import React, { useState, useEffect, useRef } from 'react';
import { Search, MoreVertical, Send, Paperclip, Smile, Mic, Settings, Bell, Moon, Sun } from 'lucide-react';
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
import NotificationPanel from './notifications/NotificationPanel';
import UIUXSettingsPanel from './uiux/UIUXSettingsPanel';
import DataMigration from './DataMigration';

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

// UserItem Component
const UserItem: React.FC<{ 
  user: any; 
  channels: Channel[]; 
  setChannels: React.Dispatch<React.SetStateAction<Channel[]>>;
  setSelectedChannel: React.Dispatch<React.SetStateAction<Channel | null>>;
}> = ({ user, channels, setChannels, setSelectedChannel }) => {
  const [showMenu, setShowMenu] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const getStatusColor = (status: string) => {
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
        </div>
        <div className={`w-2 h-2 ${getStatusColor(user.status)} rounded-full`}></div>
        
        {/* Menu Button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            setShowMenu(!showMenu);
          }}
          className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded opacity-0 group-hover:opacity-100 transition-opacity"
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
              onClick={() => handleUserAction('call')}
              className="w-full text-left px-3 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center space-x-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
              </svg>
              <span>Ara</span>
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
  const { addNotification, unreadCount, clearAllNotifications } = useNotifications();
  const { user, migrateFromLocalStorage } = useSupabase();
  const { settings, state, updateState, updateSettings } = useUIUX();
  
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
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadNotifications, setUnreadNotifications] = useState(0);

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

  // Üretkenlik araçları
  const [tasks, setTasks] = useState<Task[]>([]);
  const [showTaskCreator, setShowTaskCreator] = useState(false);
  const [taskForm, setTaskForm] = useState({
    title: '',
    description: '',
    assignedTo: [] as string[],
    dueDate: new Date(),
    priority: 'medium' as 'low' | 'medium' | 'high'
  });

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
      
      // Update channel last message
      setChannels(prev => prev.map(ch => 
        ch.id === selectedChannel.id 
          ? { ...ch, lastMessage: newMessage, lastMessageTime: Date.now() }
          : ch
      ));

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

  // Dosya yükleme
  const handleFileUpload = async (file: File) => {
    try {
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
      toast.success('Dosya yüklendi');
    } catch (error) {
      console.error('Dosya yüklenirken hata:', error);
      toast.error('Dosya yüklenemedi');
    }
  };

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

  // Görev oluşturma
  const createTask = async () => {
    if (!taskForm.title.trim() || !taskForm.description.trim()) {
      toast.error('Lütfen görev başlığı ve açıklamasını doldurun');
      return;
    }

    if (selectedChannel) {
      // Görevi mesaj olarak gönder
      const taskMessage = `
📋 Görev Oluşturuldu: ${taskForm.title}

📝 Açıklama: ${taskForm.description}

👥 Atanan Kişiler: ${taskForm.assignedTo.length > 0 ? taskForm.assignedTo.map(userId => {
  const userInfo = {
    'user1': { name: 'Test User', role: 'Sistem Yöneticisi' },
    'user2': { name: 'Ahmet Yılmaz', role: 'Yazılım Geliştirici' },
    'user3': { name: 'Ayşe Çelik', role: 'Proje Yöneticisi' },
    'user4': { name: 'Ali Demir', role: 'UI/UX Tasarımcı' },
    'user5': { name: 'Aylin Doğan', role: 'İnsan Kaynakları' },
    'user6': { name: 'Mehmet Kaya', role: 'Satış Müdürü' },
    'user7': { name: 'Fatma Özkan', role: 'Muhasebe Uzmanı' }
  };
  const user = userInfo[userId as keyof typeof userInfo];
  return user ? `${user.name} (${user.role})` : userId;
}).join(', ') : 'Atanmamış'}

📅 Bitiş Tarihi: ${taskForm.dueDate.toLocaleDateString('tr-TR')}

⚡ Öncelik: ${taskForm.priority === 'low' ? 'Düşük' : taskForm.priority === 'medium' ? 'Orta' : 'Yüksek'}

🆔 Durum: Bekliyor
      `.trim();

      const newTaskMessage: ChatMessage = {
        id: Date.now().toString(),
        content: taskMessage,
        senderId: 'user1',
        senderName: 'Test User',
        senderRole: 'employee',
        senderAvatar: 'TU',
        channelId: selectedChannel.id,
        messageType: 'system',
        timestamp: new Date()
      };

      // Mesajı listeye ekle
      setMessages(prev => [...prev, newTaskMessage]);

      // Kanalın son mesajını güncelle
      setChannels(prev => prev.map(ch => 
        ch.id === selectedChannel.id 
          ? { ...ch, lastMessage: `📋 ${taskForm.title}`, lastMessageTime: Date.now() }
          : ch
      ));

      // Görevi tasks listesine de ekle
      const task: Task = {
        id: Date.now().toString(),
        title: taskForm.title,
        description: taskForm.description,
        assignedTo: taskForm.assignedTo,
        dueDate: taskForm.dueDate,
        priority: taskForm.priority,
        status: 'pending',
        createdFromMessage: newTaskMessage.id,
        channelId: selectedChannel.id
      };

      setTasks(prev => [...prev, task]);
      setShowTaskCreator(false);
      setTaskForm({
        title: '',
        description: '',
        assignedTo: [],
        dueDate: new Date(),
        priority: 'medium'
      });
      
      toast.success('Görev mesaj olarak gönderildi');
    } else {
      toast.error('Lütfen önce bir kanal seçin');
    }
  };

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
    setLoading(true);
    try {
      // Mock data
      setChannels(mockChannels);
    } catch (error) {
      console.error('Kanallar yüklenirken hata:', error);
      setError('Kanallar yüklenemedi');
    } finally {
      setLoading(false);
    }
  };

  // Mesajları yükle
  const loadMessages = async (channelId: string) => {
    setLoading(true);
    try {
      // Mock data
      setMessages(mockMessagesByChannel[channelId] || []);
    } catch (error) {
      console.error('Mesajlar yüklenirken hata:', error);
      setError('Mesajlar yüklenemedi');
    } finally {
      setLoading(false);
    }
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
    loadChannels();
    
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
  }, [user]);

  useEffect(() => {
    if (selectedChannel) {
      loadMessages(selectedChannel.id);
    }
  }, [selectedChannel]);

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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div>
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
    <div className={`flex h-screen bg-white dark:bg-gray-900 dark:bg-gray-950 ${uiuxClasses.fontSizeClass} ${settings.reducedMotion ? 'motion-reduce' : ''} ${settings.highContrast ? 'high-contrast' : ''}`}>
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
        {/* Header */}
        <div className={`bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4 ${uiuxClasses.shadowClass} ${uiuxClasses.borderRadiusClass}`}>
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
                  <span className="text-lg font-semibold text-gray-900 dark:text-white">Çalışan Mesajlaşma Sistemi</span>
                </div>
              )}
            </div>
            
            {/* Header Icons */}
            <div className="flex items-center space-x-3">
              {/* Notifications */}
              <button 
                onClick={() => setShowNotificationPanel(true)}
                className="relative p-2 text-gray-400 hover:text-gray-600 dark:text-gray-300 dark:hover:text-gray-100 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors" 
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
                className="p-2 text-gray-400 hover:text-gray-600 dark:text-gray-300 dark:hover:text-gray-100 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors" 
                title="UI/UX Ayarları"
              >
                <Settings className="w-5 h-5" />
              </button>

              {/* Dark Mode Toggle */}
              <button 
                onClick={toggleDarkMode}
                className="p-2 text-gray-400 hover:text-gray-600 dark:text-gray-300 dark:hover:text-gray-100 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors" 
                title={isDarkMode ? "Açık moda geç" : "Koyu moda geç"}
              >
                {isDarkMode ? (
                  <Sun className="w-5 h-5 text-yellow-500" />
                ) : (
                  <Moon className="w-5 h-5 text-gray-600" />
                )}
              </button>
              
              {/* Search */}
              <button 
                onClick={() => {
                  const searchInput = document.querySelector('input[placeholder*="ara"]') as HTMLInputElement;
                  if (searchInput) {
                    searchInput.focus();
                  }
                }}
                className="p-2 text-gray-400 hover:text-gray-600 dark:text-gray-300 dark:hover:text-gray-100 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors" 
                title="Ara"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </button>
            </div>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto">
          {selectedChannel ? (
            messages.length > 0 ? (
              <div className="p-6">
                <MessageList
                  messages={messages}
                  voiceMessages={voiceMessages}
                  currentUserId="user1"
                  onEditMessage={editMessage}
                  onDeleteMessage={deleteMessage}
                  onPinMessage={pinMessage}
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
                />
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
              </div>
            </div>
            )
          ) : (
            <div className="flex items-center justify-center h-full">
              <div className="text-center text-gray-500 dark:text-gray-300">
                <h3 className="text-xl font-semibold mb-2 dark:text-white">Kanal Seçin</h3>
                <p>Mesajlaşmaya başlamak için bir kanal seçin</p>
              </div>
            </div>
          )}
        </div>

        {/* Message Input */}
        {selectedChannel && (
          <div className="border-t border-gray-200 p-4">
            <MessageInput
              newMessage={newMessage}
              setNewMessage={setNewMessage}
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

      {/* YENİ ÖZELLİKLER İÇİN MODAL'LAR VE PANELLER */}

      {/* Gelişmiş Arama Paneli */}
      {showAdvancedSearchPanel && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Gelişmiş Arama</h3>
              <button
                onClick={() => setShowAdvancedSearchPanel(false)}
                className="text-gray-400 hover:text-gray-600"
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
                className="text-gray-400 hover:text-gray-600"
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
                  className="text-gray-400 hover:text-gray-600"
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
                className="text-gray-400 hover:text-gray-600"
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
                className="text-gray-400 hover:text-gray-600"
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
                className="text-gray-400 hover:text-gray-600"
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
                 className="text-gray-400 hover:text-gray-600"
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
                 className="text-gray-400 hover:text-gray-600"
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

       {/* Rapor Oluşturma Modal'ı */}
       {showReportModal && (
         <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
           <div className="bg-white rounded-lg p-6 w-full max-w-md">
             <div className="flex items-center justify-between mb-4">
               <h3 className="text-lg font-semibold text-gray-900">Rapor Oluştur</h3>
               <button
                 onClick={() => setShowReportModal(false)}
                 className="text-gray-400 hover:text-gray-600"
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
         notifications={[]}
         onMarkAsRead={(id) => console.log('Mark as read:', id)}
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
   );
 };

export default EmployeeChat;
