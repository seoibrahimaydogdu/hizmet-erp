import { useState, useEffect, useRef } from 'react';
import { toast } from 'react-hot-toast';
import { useSupabase } from '../../../hooks/useSupabase';
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
} from '../types';

export const useChat = (
  currentUserId: string,
  currentUserName: string,
  currentUserRole: string,
  currentUserDepartment: string,
  initialChannelId?: string
) => {
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

  // Mesaj gönderme
  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedChannel) return;

    const message: ChatMessage = {
      id: `msg_${Date.now()}`,
      content: newMessage,
      senderId: currentUserId,
      senderName: currentUserName,
      senderRole: currentUserRole,
      senderAvatar: `https://ui-avatars.com/api/?name=${currentUserName}&background=random`,
      channelId: selectedChannel.id,
      messageType: 'text',
      timestamp: new Date(),
      mentions: [],
      isDirectMessage: false
    };

    try {
      // Supabase'e kaydet
      const { error } = await supabase
        .from('chat_messages')
        .insert({
          content: message.content,
          sender_id: message.senderId,
          sender_name: message.senderName,
          sender_role: message.senderRole,
          channel_id: message.channelId,
          message_type: message.messageType,
          created_at: message.timestamp.toISOString()
        });

      if (error) throw error;

      setMessages(prev => [...prev, message]);
      setNewMessage('');
      
      // Otomatik kategorizasyon
      if (autoCategorization.enabled) {
        const category = autoCategorizeMessage(message);
        if (category !== 'genel') {
          toast.success(`Mesaj "${category}" kategorisine otomatik olarak eklendi`);
        }
      }

      // İş akışı kurallarını uygula
      applyWorkflowRules(message);

      // Otomatik yanıt kontrolü
      const autoResponse = checkAutoResponse(message);
      if (autoResponse) {
        toast.success('Otomatik yanıt gönderildi');
      }

    } catch (error) {
      console.error('Mesaj gönderme hatası:', error);
      toast.error('Mesaj gönderilemedi');
    }
  };

  // Yanıt gönderme
  const sendReply = () => {
    if (!replyingTo || !replyContent.trim()) return;
    
    const replyMessage: ChatMessage = {
      id: `reply_${Date.now()}`,
      content: replyContent,
      senderId: currentUserId,
      senderName: currentUserName,
      senderRole: currentUserRole,
      senderAvatar: `https://ui-avatars.com/api/?name=${currentUserName}&background=random`,
      channelId: selectedChannel?.id || '',
      messageType: 'text',
      timestamp: new Date(),
      mentions: [],
      isDirectMessage: false,
      replyTo: {
        messageId: replyingTo.id,
        senderName: replyingTo.senderName,
        content: replyingTo.content.substring(0, 100) + (replyingTo.content.length > 100 ? '...' : '')
      }
    };
    
    setMessages(prev => [...prev, replyMessage]);
    setReplyingTo(null);
    setReplyContent('');
    setNewMessage('');
    
    toast.success('Yanıt gönderildi');
  };

  // Mesaj düzenleme
  const editMessage = (messageId: string, newContent: string) => {
    setMessages(prev => prev.map(msg => 
      msg.id === messageId 
        ? { ...msg, content: newContent, isEdited: true, editedAt: new Date() }
        : msg
    ));
    toast.success('Mesaj düzenlendi');
  };

  // Mesaj silme
  const deleteMessage = (messageId: string) => {
    setMessages(prev => prev.filter(msg => msg.id !== messageId));
    toast.success('Mesaj silindi');
  };

  // Mesaj sabitleme
  const pinMessage = (messageId: string) => {
    setMessages(prev => prev.map(msg => 
      msg.id === messageId ? { ...msg, isPinned: !msg.isPinned } : msg
    ));
    toast.success('Mesaj sabitlendi');
  };

  // Yanıtla işlemleri
  const handleReplyToMessage = (message: ChatMessage) => {
    setReplyingTo(message);
    setReplyContent('');
    editorRef.current?.focus();
  };

  const cancelReply = () => {
    setReplyingTo(null);
    setReplyContent('');
  };

  // Otomatik kategorizasyon
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

  // İş akışı kuralları
  const applyWorkflowRules = (message: ChatMessage) => {
    const sortedRules = workflowRules
      .filter(rule => rule.enabled)
      .sort((a, b) => b.priority - a.priority);
    
    for (const rule of sortedRules) {
      const content = message.content.toLowerCase();
      
      if (rule.condition.includes('contains')) {
        const keywords = rule.condition.match(/"([^"]+)"/g)?.map(k => k.replace(/"/g, '')) || [];
        if (keywords.some(keyword => content.includes(keyword))) {
          executeWorkflowAction(rule.action, message);
        }
      }
    }
  };

  const executeWorkflowAction = (action: string, message: ChatMessage) => {
    switch (action) {
      case 'forward to manager':
        toast.success('Mesaj yöneticiye yönlendirildi');
        break;
      case 'categorize as project':
        toast.success('Mesaj proje kategorisine eklendi');
        break;
      default:
        console.log('Bilinmeyen iş akışı aksiyonu:', action);
    }
  };

  // Otomatik yanıt kontrolü
  const checkAutoResponse = (message: ChatMessage): string | null => {
    const content = message.content.toLowerCase();
    
    for (const autoResponse of autoResponses) {
      if (autoResponse.enabled && content.includes(autoResponse.trigger)) {
        return autoResponse.response;
      }
    }
    
    return null;
  };

  // Dosya yükleme
  const handleFileUpload = async (file: File) => {
    try {
      const fileMessage: FileMessage = {
        id: `file_${Date.now()}`,
        fileName: file.name,
        fileUrl: URL.createObjectURL(file),
        fileSize: file.size,
        fileType: file.type,
        senderId: currentUserId,
        senderName: currentUserName,
        timestamp: new Date(),
        channelId: selectedChannel?.id || '',
        isImage: file.type.startsWith('image/'),
        isVideo: file.type.startsWith('video/'),
        isAudio: file.type.startsWith('audio/'),
        isDocument: file.type.includes('document') || file.type.includes('pdf')
      };

      setFileMessages(prev => [...prev, fileMessage]);
      toast.success('Dosya yüklendi');
    } catch (error) {
      console.error('Dosya yükleme hatası:', error);
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
          id: `voice_${Date.now()}`,
          audioUrl: URL.createObjectURL(blob),
          duration: 0, // Gerçek uygulamada hesaplanır
          senderId: currentUserId,
          senderName: currentUserName,
          timestamp: new Date(),
          channelId: selectedChannel?.id || '',
          isProcessing: true
        };

        setVoiceMessages(prev => [...prev, voiceMessage]);
        setIsRecording(false);
        toast.success('Sesli mesaj kaydedildi');
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (error) {
      console.error('Sesli kayıt hatası:', error);
      toast.error('Sesli kayıt başlatılamadı');
    }
  };

  // Gelişmiş arama
  const performSemanticSearch = async (query: string) => {
    const startTime = Date.now();
    setIsSearching(true);
    
    try {
      // Mock semantic search - gerçek uygulamada AI API kullanılır
      const semanticResults = messages.filter(msg => {
        const content = msg.content.toLowerCase();
        const queryLower = query.toLowerCase();
        
        // Basit semantic matching
        const queryWords = queryLower.split(' ');
        const contentWords = content.split(' ');
        
        const matchScore = queryWords.filter(word => 
          contentWords.some(contentWord => 
            contentWord.includes(word) || word.includes(contentWord)
          )
        ).length / queryWords.length;
        
        return matchScore > 0.3;
      });
      
      const searchTime = Date.now() - startTime;
      
      setAdvancedSearchResults({
        messages: semanticResults,
        voiceMessages: voiceMessages.filter(msg => 
          msg.transcription?.toLowerCase().includes(query.toLowerCase())
        ),
        files: fileMessages.filter(file => 
          file.fileName.toLowerCase().includes(query.toLowerCase())
        ),
        totalResults: semanticResults.length,
        searchTime,
        relevance: 0.85
      });
      
      // Arama geçmişine ekle
      setSemanticSearch(prev => ({
        ...prev,
        searchHistory: [query, ...prev.searchHistory.slice(0, 9)]
      }));
      
    } catch (error) {
      console.error('Arama hatası:', error);
      toast.error('Arama yapılamadı');
    } finally {
      setIsSearching(false);
    }
  };

  // Kanalları yükle
  const loadChannels = async () => {
    try {
      setLoading(true);
      
      // Mock kanal verileri - gerçek uygulamada Supabase'den gelir
      const mockChannels: Channel[] = [
        {
          id: '1',
          name: 'genel',
          description: 'Genel sohbet kanalı',
          type: 'public',
          members: [currentUserId],
          lastMessage: 'Merhaba!',
          lastMessageTime: new Date(),
          unreadCount: 0
        },
        {
          id: '2',
          name: 'proje',
          description: 'Proje tartışmaları',
          type: 'public',
          members: [currentUserId],
          lastMessage: 'Proje durumu güncellendi',
          lastMessageTime: new Date(),
          unreadCount: 2
        },
        {
          id: '3',
          name: 'destek',
          description: 'Teknik destek',
          type: 'public',
          members: [currentUserId],
          lastMessage: 'Yeni destek talebi',
          lastMessageTime: new Date(),
          unreadCount: 1
        }
      ];

      setChannels(mockChannels);
      
      // İlk kanalı seç
      if (initialChannelId) {
        const channel = mockChannels.find(c => c.id === initialChannelId);
        if (channel) setSelectedChannel(channel);
      } else if (mockChannels.length > 0) {
        setSelectedChannel(mockChannels[0]);
      }
      
    } catch (error) {
      console.error('Kanallar yüklenirken hata:', error);
      setError('Kanallar yüklenemedi');
    } finally {
      setLoading(false);
    }
  };

  // Mesajları yükle
  const loadMessages = async (channelId?: string) => {
    try {
      setLoading(true);
      
      // Mock mesaj verileri - gerçek uygulamada Supabase'den gelir
      const mockMessages: ChatMessage[] = [
        {
          id: '1',
          content: 'Merhaba! Nasılsınız?',
          senderId: 'user1',
          senderName: 'Ahmet Yılmaz',
          senderRole: 'Admin',
          senderAvatar: 'https://ui-avatars.com/api/?name=Ahmet+Yılmaz&background=random',
          channelId: channelId || '1',
          messageType: 'text',
          timestamp: new Date(Date.now() - 3600000),
          mentions: [],
          isDirectMessage: false
        },
        {
          id: '2',
          content: 'İyiyim, teşekkürler! Proje durumu nasıl?',
          senderId: currentUserId,
          senderName: currentUserName,
          senderRole: currentUserRole,
          senderAvatar: `https://ui-avatars.com/api/?name=${currentUserName}&background=random`,
          channelId: channelId || '1',
          messageType: 'text',
          timestamp: new Date(Date.now() - 1800000),
          mentions: [],
          isDirectMessage: false
        }
      ];

      setMessages(mockMessages);
      
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

  return {
    // State'ler
    messages,
    channels,
    selectedChannel,
    newMessage,
    loading,
    error,
    replyingTo,
    replyContent,
    editingMessage,
    showActionMenu,
    voiceMessages,
    isRecording,
    fileMessages,
    filePreview,
    filePreviewData,
    searchTerm,
    filterType,
    showAdvancedSearch,
    advancedSearchResults,
    isSearching,
    notifications,
    unreadNotifications,
    autoCategorization,
    workflowRules,
    autoResponses,
    semanticSearch,
    userPreferences,

    // Setters
    setNewMessage,
    setError,
    setReplyingTo,
    setReplyContent,
    setEditingMessage,
    setShowActionMenu,
    setIsRecording,
    setFilePreview,
    setFilePreviewData,
    setSearchTerm,
    setFilterType,
    setShowAdvancedSearch,
    setAdvancedSearchResults,
    setAutoCategorization,
    setWorkflowRules,
    setAutoResponses,
    setSemanticSearch,
    setUserPreferences,

    // Actions
    sendMessage,
    sendReply,
    editMessage,
    deleteMessage,
    pinMessage,
    handleReplyToMessage,
    cancelReply,
    handleFileUpload,
    startVoiceRecording,
    performSemanticSearch,
    handleChannelSelect,

    // Refs
    messagesEndRef,
    editorRef
  };
};
