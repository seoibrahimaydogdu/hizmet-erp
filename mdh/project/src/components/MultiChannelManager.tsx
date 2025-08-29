import React, { useState, useEffect, useRef } from 'react';
import { 
  MessageSquare, 
  Mail, 
  Phone, 
  MessageCircle, 
  Twitter, 
  Facebook, 
  Instagram,
  WhatsApp,
  Plus,
  Settings,
  Filter,
  Search,
  Bell,
  CheckCircle,
  Clock,
  AlertCircle,
  X,
  MoreVertical,
  Archive,
  Star,
  Reply,
  Forward,
  Trash2,
  Eye,
  EyeOff
} from 'lucide-react';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';
import { toast } from 'react-hot-toast';

interface Channel {
  id: string;
  type: 'email' | 'chat' | 'phone' | 'social' | 'whatsapp';
  name: string;
  icon: React.ReactNode;
  color: string;
  unreadCount: number;
  isActive: boolean;
  lastActivity: Date;
}

interface Message {
  id: string;
  channelId: string;
  customerId: string;
  customerName: string;
  customerAvatar: string;
  content: string;
  timestamp: Date;
  isRead: boolean;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'new' | 'in_progress' | 'resolved' | 'closed';
  tags: string[];
  attachments?: string[];
}

interface MultiChannelManagerProps {
  currentUser: any;
  onMessageSelect?: (message: Message) => void;
  onChannelChange?: (channel: Channel) => void;
  customerId?: string; // Belirli bir müşteri için filtreleme
}

const MultiChannelManager: React.FC<MultiChannelManagerProps> = ({
  currentUser,
  onMessageSelect,
  onChannelChange,
  customerId
}) => {
  const [channels, setChannels] = useState<Channel[]>([
    {
      id: 'email',
      type: 'email',
      name: 'E-posta',
      icon: <Mail className="w-4 h-4" />,
      color: 'bg-blue-500',
      unreadCount: 12,
      isActive: true,
      lastActivity: new Date(Date.now() - 5 * 60 * 1000)
    },
    {
      id: 'chat',
      type: 'chat',
      name: 'Canlı Chat',
      icon: <MessageSquare className="w-4 h-4" />,
      color: 'bg-green-500',
      unreadCount: 5,
      isActive: true,
      lastActivity: new Date(Date.now() - 2 * 60 * 1000)
    },
    {
      id: 'phone',
      type: 'phone',
      name: 'Telefon',
      icon: <Phone className="w-4 h-4" />,
      color: 'bg-purple-500',
      unreadCount: 3,
      isActive: true,
      lastActivity: new Date(Date.now() - 10 * 60 * 1000)
    },
    {
      id: 'whatsapp',
      type: 'whatsapp',
      name: 'WhatsApp',
      icon: <MessageCircle className="w-4 h-4" />,
      color: 'bg-green-600',
      unreadCount: 8,
      isActive: true,
      lastActivity: new Date(Date.now() - 1 * 60 * 1000)
    },
    {
      id: 'twitter',
      type: 'social',
      name: 'Twitter',
      icon: <Twitter className="w-4 h-4" />,
      color: 'bg-blue-400',
      unreadCount: 2,
      isActive: false,
      lastActivity: new Date(Date.now() - 30 * 60 * 1000)
    },
    {
      id: 'facebook',
      type: 'social',
      name: 'Facebook',
      icon: <Facebook className="w-4 h-4" />,
      color: 'bg-blue-600',
      unreadCount: 1,
      isActive: false,
      lastActivity: new Date(Date.now() - 45 * 60 * 1000)
    }
  ]);

  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      channelId: 'email',
      customerId: 'cust-1',
      customerName: 'Ayşe Demir',
      customerAvatar: 'AD',
      content: 'Ürün iade etmek istiyorum. Hasar var.',
      timestamp: new Date(Date.now() - 5 * 60 * 1000),
      isRead: false,
      priority: 'high',
      status: 'new',
      tags: ['iade', 'hasar']
    },
    {
      id: '2',
      channelId: 'chat',
      customerId: 'cust-2',
      customerName: 'Fatma Kaya',
      customerAvatar: 'FK',
      content: 'Sipariş durumu nasıl?',
      timestamp: new Date(Date.now() - 2 * 60 * 1000),
      isRead: false,
      priority: 'medium',
      status: 'in_progress',
      tags: ['sipariş']
    },
    {
      id: '3',
      channelId: 'whatsapp',
      customerId: 'cust-3',
      customerName: 'Can Demir',
      customerAvatar: 'CD',
      content: 'Teknik sorun yaşıyorum',
      timestamp: new Date(Date.now() - 1 * 60 * 1000),
      isRead: false,
      priority: 'urgent',
      status: 'new',
      tags: ['teknik', 'sorun']
    }
  ]);

  const [selectedChannel, setSelectedChannel] = useState<Channel | null>(channels[0]);
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterPriority, setFilterPriority] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [showSettings, setShowSettings] = useState(false);
  const [showUnifiedView, setShowUnifiedView] = useState(true);

  // Filtrelenmiş mesajlar
  const filteredMessages = messages.filter(message => {
    const matchesChannel = !selectedChannel || message.channelId === selectedChannel.id;
    const matchesSearch = searchTerm === '' || 
      message.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      message.content.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesPriority = filterPriority === 'all' || message.priority === filterPriority;
    const matchesStatus = filterStatus === 'all' || message.status === filterStatus;
    const matchesCustomer = !customerId || message.customerId === customerId;
    
    return matchesChannel && matchesSearch && matchesPriority && matchesStatus && matchesCustomer;
  });

  const handleChannelSelect = (channel: Channel) => {
    setSelectedChannel(channel);
    onChannelChange?.(channel);
  };

  const handleMessageSelect = (message: Message) => {
    setSelectedMessage(message);
    onMessageSelect?.(message);
    
    // Mesajı okundu olarak işaretle
    setMessages(prev => prev.map(msg => 
      msg.id === message.id ? { ...msg, isRead: true } : msg
    ));
  };

  const handleMessageAction = (messageId: string, action: string) => {
    switch (action) {
      case 'archive':
        setMessages(prev => prev.filter(msg => msg.id !== messageId));
        toast.success('Mesaj arşivlendi');
        break;
      case 'star':
        setMessages(prev => prev.map(msg => 
          msg.id === messageId ? { ...msg, tags: [...msg.tags, 'yıldızlı'] } : msg
        ));
        toast.success('Mesaj yıldızlandı');
        break;
      case 'reply':
        toast.info('Yanıt penceresi açılıyor...');
        break;
      case 'forward':
        toast.info('Yönlendirme penceresi açılıyor...');
        break;
    }
  };

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'urgent': return <AlertCircle className="w-4 h-4 text-red-500" />;
      case 'high': return <AlertCircle className="w-4 h-4 text-orange-500" />;
      case 'medium': return <Clock className="w-4 h-4 text-yellow-500" />;
      case 'low': return <CheckCircle className="w-4 h-4 text-green-500" />;
      default: return <Clock className="w-4 h-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'new': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400';
      case 'in_progress': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400';
      case 'resolved': return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400';
      case 'closed': return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'new': return 'Yeni';
      case 'in_progress': return 'İşlemde';
      case 'resolved': return 'Çözüldü';
      case 'closed': return 'Kapalı';
      default: return 'Bilinmiyor';
    }
  };

  const totalUnreadCount = channels.reduce((sum, channel) => sum + channel.unreadCount, 0);

  return (
    <div className="flex h-full bg-white dark:bg-gray-900">
      {/* Sol Panel - Kanallar */}
      <div className="w-64 border-r border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Kanallar
            </h2>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowUnifiedView(!showUnifiedView)}
                className={`p-1 rounded ${showUnifiedView ? 'bg-blue-100 dark:bg-blue-900/20' : 'bg-gray-100 dark:bg-gray-700'}`}
                title={showUnifiedView ? 'Birleşik görünümü kapat' : 'Birleşik görünümü aç'}
              >
                {showUnifiedView ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
              </button>
              <button
                onClick={() => setShowSettings(true)}
                className="p-1 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
              >
                <Settings className="w-4 h-4" />
              </button>
            </div>
          </div>
          
          {showUnifiedView && (
            <button
              onClick={() => setSelectedChannel(null)}
              className={`w-full p-3 text-left rounded-lg mb-2 flex items-center justify-between ${
                !selectedChannel 
                  ? 'bg-blue-100 dark:bg-blue-900/20 text-blue-900 dark:text-blue-100' 
                  : 'hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg flex items-center justify-center">
                  <MessageSquare className="w-4 h-4 text-white" />
                </div>
                <span className="font-medium">Tüm Kanallar</span>
              </div>
              <span className="bg-blue-500 text-white text-xs rounded-full px-2 py-1">
                {totalUnreadCount}
              </span>
            </button>
          )}
        </div>

        <div className="p-2">
          {channels.map((channel) => (
            <button
              key={channel.id}
              onClick={() => handleChannelSelect(channel)}
              className={`w-full p-3 text-left rounded-lg mb-1 flex items-center justify-between transition-colors ${
                selectedChannel?.id === channel.id 
                  ? 'bg-blue-100 dark:bg-blue-900/20 text-blue-900 dark:text-blue-100' 
                  : 'hover:bg-gray-100 dark:hover:bg-gray-700'
              } ${!channel.isActive ? 'opacity-50' : ''}`}
            >
              <div className="flex items-center gap-3">
                <div className={`w-8 h-8 ${channel.color} rounded-lg flex items-center justify-center`}>
                  {channel.icon}
                </div>
                <div className="flex-1 text-left">
                  <div className="font-medium">{channel.name}</div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    {format(channel.lastActivity, 'HH:mm')}
                  </div>
                </div>
              </div>
              {/* Channel notification badge hidden */}
              {/* {channel.unreadCount > 0 && (
                <span className="bg-red-500 text-white text-xs rounded-full px-2 py-1 min-w-[20px]">
                  {channel.unreadCount}
                </span>
              )} */}
            </button>
          ))}
        </div>
      </div>

      {/* Sağ Panel - Mesajlar */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                {selectedChannel ? selectedChannel.name : 'Tüm Kanallar'}
                {customerId && (
                  <span className="text-sm text-gray-500 dark:text-gray-400 ml-2">
                    (Müşteri Filtresi Aktif)
                  </span>
                )}
              </h3>
              {selectedChannel && (
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  {filteredMessages.length} mesaj
                </span>
              )}
            </div>
            
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Mesajlarda ara..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              
              <select
                value={filterPriority}
                onChange={(e) => setFilterPriority(e.target.value)}
                className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">Tüm Öncelikler</option>
                <option value="urgent">Acil</option>
                <option value="high">Yüksek</option>
                <option value="medium">Orta</option>
                <option value="low">Düşük</option>
              </select>
              
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">Tüm Durumlar</option>
                <option value="new">Yeni</option>
                <option value="in_progress">İşlemde</option>
                <option value="resolved">Çözüldü</option>
                <option value="closed">Kapalı</option>
              </select>
            </div>
          </div>
        </div>

        {/* Mesaj Listesi */}
        <div className="flex-1 overflow-y-auto">
          {filteredMessages.length === 0 ? (
            <div className="flex items-center justify-center h-full text-gray-500 dark:text-gray-400">
              <div className="text-center">
                <MessageSquare className="w-16 h-16 mx-auto mb-4 opacity-50" />
                <p>Mesaj bulunamadı</p>
                <p className="text-sm">Farklı filtreler deneyin</p>
              </div>
            </div>
          ) : (
            <div className="divide-y divide-gray-200 dark:divide-gray-700">
              {filteredMessages.map((message) => (
                <div
                  key={message.id}
                  onClick={() => handleMessageSelect(message)}
                  className={`p-4 cursor-pointer transition-colors ${
                    selectedMessage?.id === message.id 
                      ? 'bg-blue-50 dark:bg-blue-900/10' 
                      : 'hover:bg-gray-50 dark:hover:bg-gray-800'
                  } ${!message.isRead ? 'bg-yellow-50 dark:bg-yellow-900/10' : ''}`}
                >
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0">
                      <div className="w-10 h-10 bg-gray-300 dark:bg-gray-600 rounded-full flex items-center justify-center text-sm font-medium text-gray-700 dark:text-gray-300">
                        {message.customerAvatar}
                      </div>
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-gray-900 dark:text-white">
                            {message.customerName}
                          </span>
                          {getPriorityIcon(message.priority)}
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(message.status)}`}>
                            {getStatusText(message.status)}
                          </span>
                        </div>
                        <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
                          <span>{format(message.timestamp, 'HH:mm')}</span>
                          <div className="flex items-center gap-1">
                            {message.tags.includes('yıldızlı') && <Star className="w-3 h-3 text-yellow-500" />}
                            {!message.isRead && <div className="w-2 h-2 bg-blue-500 rounded-full"></div>}
                          </div>
                        </div>
                      </div>
                      
                      <p className="text-sm text-gray-700 dark:text-gray-300 line-clamp-2">
                        {message.content}
                      </p>
                      
                      {message.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {message.tags.filter(tag => tag !== 'yıldızlı').map((tag, index) => (
                            <span key={index} className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 text-xs rounded-full">
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                    
                    <div className="flex-shrink-0">
                      <div className="flex items-center gap-1">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleMessageAction(message.id, 'reply');
                          }}
                          className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                        >
                          <Reply className="w-4 h-4" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleMessageAction(message.id, 'star');
                          }}
                          className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                        >
                          <Star className="w-4 h-4" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleMessageAction(message.id, 'archive');
                          }}
                          className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                        >
                          <Archive className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Ayarlar Modal */}
      {showSettings && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-96">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Kanal Ayarları
              </h3>
              <button
                onClick={() => setShowSettings(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <h4 className="font-medium text-gray-900 dark:text-white mb-2">Kanal Durumları</h4>
                {channels.map((channel) => (
                  <div key={channel.id} className="flex items-center justify-between py-2">
                    <span className="text-gray-700 dark:text-gray-300">{channel.name}</span>
                    <button
                      onClick={() => {
                        setChannels(prev => prev.map(ch => 
                          ch.id === channel.id ? { ...ch, isActive: !ch.isActive } : ch
                        ));
                      }}
                      className={`px-3 py-1 rounded-full text-xs font-medium ${
                        channel.isActive 
                          ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400' 
                          : 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400'
                      }`}
                    >
                      {channel.isActive ? 'Aktif' : 'Pasif'}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MultiChannelManager;
