import React, { useState, useEffect, useRef } from 'react';
import { toast } from 'react-hot-toast';
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

// UserItem Component
const UserItem: React.FC<{ 
  user: any; 
  channels: Channel[]; 
  setChannels: React.Dispatch<React.SetStateAction<Channel[]>>;
  setSelectedChannel: React.Dispatch<React.SetStateAction<Channel | null>>;
}> = ({ user, channels, setChannels, setSelectedChannel }) => {
  const [showMenu, setShowMenu] = useState(false);

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
        toast.success(`${user.name} profilini görüntüle`);
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
      <div className="flex items-center space-x-3 p-2 hover:bg-gray-50 rounded-lg group">
        <div className={`w-8 h-8 ${user.color} rounded-full flex items-center justify-center`}>
          <span className="text-white text-xs font-semibold">{user.avatar}</span>
        </div>
        <div className="flex-1">
          <span className="text-sm text-gray-900 font-medium">{user.name}</span>
          <p className="text-xs text-gray-500">{user.title}</p>
        </div>
        <div className={`w-2 h-2 ${getStatusColor(user.status)} rounded-full`}></div>
        
        {/* Menu Button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            setShowMenu(!showMenu);
          }}
          className="p-1 text-gray-400 hover:text-gray-600 rounded opacity-0 group-hover:opacity-100 transition-opacity"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
          </svg>
        </button>
      </div>

      {/* Dropdown Menu */}
      {showMenu && (
        <div className="absolute right-0 top-full mt-1 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-10">
          <div className="py-1">
            <button
              onClick={() => handleUserAction('message')}
              className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center space-x-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
              <span>Mesaj Gönder</span>
            </button>
            
            <button
              onClick={() => handleUserAction('profile')}
              className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center space-x-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              <span>Profili Görüntüle</span>
            </button>
            
            <button
              onClick={() => handleUserAction('call')}
              className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center space-x-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
              </svg>
              <span>Ara</span>
            </button>
            
            <button
              onClick={() => handleUserAction('video')}
              className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center space-x-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
              <span>Video Görüşme</span>
            </button>
            
            <button
              onClick={() => handleUserAction('email')}
              className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center space-x-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              <span>E-posta Gönder</span>
            </button>
            
            <button
              onClick={() => handleUserAction('schedule')}
              className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center space-x-2"
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

const EmployeeChat: React.FC = () => {
  const { supabase } = useSupabase();
  
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
  const [showAdvancedSearch, setShowAdvancedSearch] = useState(false);
  const [advancedSearchResults, setAdvancedSearchResults] = useState<AdvancedSearchResults | null>(null);
  const [isSearching, setIsSearching] = useState(false);

  // Bildirimler
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadNotifications, setUnreadNotifications] = useState(0);

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
      lastMessageTime: new Date(),
      unreadCount: 0
    },
    {
      id: '2', 
      name: 'ik',
      description: 'İnsan kaynakları ve personel konuları',
      type: 'public',
      members: ['user1', 'user2'],
      lastMessage: 'Yeni iş ilanı eklendi',
      lastMessageTime: new Date(),
      unreadCount: 2
    },
    {
      id: '3',
      name: 'teknoloji', 
      description: 'Teknoloji ve yazılım geliştirme',
      type: 'public',
      members: ['user1', 'user3'],
      lastMessage: 'Yeni framework kurulumu',
      lastMessageTime: new Date(),
      unreadCount: 0
    },
    {
      id: '4',
      name: 'satış',
      description: 'Satış ve pazarlama stratejileri',
      type: 'public', 
      members: ['user1', 'user2'],
      lastMessage: 'Aylık satış raporu hazır',
      lastMessageTime: new Date(),
      unreadCount: 1
    },
    {
      id: '5',
      name: 'e-ticaret-platformu',
      description: 'E-ticaret platformu geliştirme',
      type: 'public',
      members: ['user1', 'user3'],
      lastMessage: 'Yeni özellik eklendi',
      lastMessageTime: new Date(),
      unreadCount: 0
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
          ? { ...ch, lastMessage: newMessage, lastMessageTime: new Date() }
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
        const voiceMessage: VoiceMessage = {
          id: Date.now().toString(),
          audioUrl: URL.createObjectURL(blob),
          duration: chunks.length * 100,
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
  };

  // Effect'ler
  useEffect(() => {
    loadChannels();
  }, []);

  useEffect(() => {
    if (selectedChannel) {
      loadMessages(selectedChannel.id);
    }
  }, [selectedChannel]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

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
    <div className="flex h-screen bg-white">
      {/* Left Column - Channel List */}
      <div className="w-80 bg-white border-r border-gray-200 flex flex-col">
        <ChannelList
          channels={channels}
          selectedChannel={selectedChannel}
          onChannelSelect={handleChannelSelect}
          onCreateChannel={() => {}}
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          showChannelList={true}
        />
      </div>

      {/* Middle Column - Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        {selectedChannel && (
          <div className="bg-white border-b border-gray-200 px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="flex items-center space-x-2">
                  <span className="text-lg font-semibold text-gray-900">#{selectedChannel.name}</span>
                </div>
                <div className="text-sm text-gray-500">
                  {selectedChannel.description}
                </div>
              </div>
              
              {/* Header Icons - Extended */}
              <div className="flex items-center space-x-1">
                {/* Search */}
                <button 
                  onClick={() => {
                    const searchInput = document.querySelector('input[placeholder*="ara"]') as HTMLInputElement;
                    if (searchInput) {
                      searchInput.focus();
                    }
                  }}
                  className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100" 
                  title="Ara"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </button>
                
                {/* Filter */}
                <button 
                  onClick={() => {
                    toast.success('Filtre menüsü açıldı');
                  }}
                  className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100" 
                  title="Filtrele"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.207A1 1 0 013 6.5V4z" />
                  </svg>
                </button>
                
                {/* Lightning Bolt - Quick Actions */}
                <button 
                  onClick={() => {
                    toast.success('Hızlı aksiyonlar menüsü açıldı');
                  }}
                  className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100" 
                  title="Hızlı Aksiyon"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </button>
                
                {/* Wave/Chart - Analytics */}
                <button 
                  onClick={() => {
                    toast.success('Analitik raporu açıldı');
                  }}
                  className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100" 
                  title="Analitik"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </button>
                
                {/* Bell with green dot - Notifications */}
                <button 
                  onClick={() => {
                    toast.success('Bildirimler açıldı');
                  }}
                  className="p-2 text-green-500 hover:text-green-600 rounded-lg hover:bg-green-50 relative" 
                  title="Bildirimler"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-5 5v-5z" />
                  </svg>
                  <div className="absolute top-1 right-1 w-2 h-2 bg-green-500 rounded-full"></div>
                </button>
                
                {/* Settings */}
                <button 
                  onClick={() => {
                    toast.success('Ayarlar menüsü açıldı');
                  }}
                  className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100" 
                  title="Ayarlar"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </button>
                
                {/* Shield - Security */}
                <button 
                  onClick={() => {
                    toast.success('Güvenlik ayarları açıldı');
                  }}
                  className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100" 
                  title="Güvenlik"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                </button>
                
                {/* Another Lightning Bolt - Auto Actions */}
                <button 
                  onClick={() => {
                    toast.success('Otomatik aksiyonlar açıldı');
                  }}
                  className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100" 
                  title="Otomatik Aksiyon"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Messages */}
        <div className="flex-1 overflow-y-auto">
          {selectedChannel ? (
            messages.length > 0 ? (
              <div className="p-6">
                <MessageList
                  messages={isSearching ? (advancedSearchResults?.messages || []) : messages}
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
                />
              </div>
            ) : (
              <div className="flex items-center justify-center h-full">
                <div className="text-center text-gray-500">
                  <div className="w-16 h-16 mx-auto mb-4 border-2 border-gray-300 rounded-full flex items-center justify-center">
                    <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-semibold mb-2">Kanal mesajları</h3>
                  <p>Bu kanalda henüz mesaj yok.</p>
                </div>
              </div>
            )
          ) : (
            <div className="flex items-center justify-center h-full">
              <div className="text-center text-gray-500">
                <h3 className="text-xl font-semibold mb-2">Kanal Seçin</h3>
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
            />
          </div>
        )}
      </div>

      {/* Right Column - Users/Employees */}
      <div className="w-64 bg-white border-l border-gray-200 flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-medium text-gray-900">Çalışanlar</h3>
              <p className="text-xs text-gray-500 mt-1">16 çalışan</p>
            </div>
            <div className="flex items-center space-x-1">
              <span className="text-xs text-gray-400">Ça</span>
              <span className="text-xs text-gray-400">Me</span>
              <span className="text-xs text-gray-400">Sis</span>
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
        <div className="p-4 border-t border-gray-200">
          <h4 className="text-xs font-medium text-gray-700 mb-2">Hızlı Aksiyonlar</h4>
          <div className="space-y-1">
            <button className="w-full flex items-center space-x-2 px-2 py-1 text-xs text-gray-600 hover:bg-gray-50 rounded">
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              <span>Yeni Kanal</span>
            </button>
            <button className="w-full flex items-center space-x-2 px-2 py-1 text-xs text-gray-600 hover:bg-gray-50 rounded">
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
              <span>Toplu Mesaj</span>
            </button>
            <button className="w-full flex items-center space-x-2 px-2 py-1 text-xs text-gray-600 hover:bg-gray-50 rounded">
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              <span>Rapor Oluştur</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmployeeChat;
