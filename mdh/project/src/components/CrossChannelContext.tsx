import React, { useState, useEffect, useRef } from 'react';
import { 
  Link, 
  MessageSquare, 
  Mail, 
  Phone, 
  MessageCircle, 
  Twitter, 
  Facebook,
  Clock,
  User,
  Tag,
  Search,
  Filter,
  Eye,
  EyeOff,
  Share2,
  Copy,
  ExternalLink,
  AlertCircle,
  CheckCircle,
  X,
  Plus,
  Minus,
  ChevronDown,
  ChevronRight,
  Calendar,
  MapPin,
  CreditCard,
  ShoppingCart,
  Star,
  Heart,
  ThumbsUp,
  ThumbsDown
} from 'lucide-react';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';
import { toast } from 'react-hot-toast';

interface CustomerInteraction {
  id: string;
  channelId: string;
  channelType: 'email' | 'chat' | 'phone' | 'social' | 'whatsapp';
  channelIcon: React.ReactNode;
  channelColor: string;
  interactionType: 'message' | 'call' | 'purchase' | 'complaint' | 'inquiry' | 'feedback';
  content: string;
  timestamp: Date;
  agentId?: string;
  agentName?: string;
  sentiment: 'positive' | 'negative' | 'neutral';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  tags: string[];
  attachments?: string[];
  relatedTicketId?: string;
  resolution?: string;
}

interface CustomerProfile {
  id: string;
  name: string;
  email: string;
  phone: string;
  avatar: string;
  joinDate: Date;
  lastActivity: Date;
  totalInteractions: number;
  totalSpent: number;
  loyaltyPoints: number;
  preferences: {
    preferredChannel: string;
    preferredLanguage: string;
    marketingConsent: boolean;
    timezone: string;
  };
  demographics: {
    age?: number;
    location?: string;
    occupation?: string;
    interests?: string[];
  };
  purchaseHistory: {
    totalOrders: number;
    averageOrderValue: number;
    lastPurchaseDate?: Date;
    favoriteCategories: string[];
  };
  supportHistory: {
    totalTickets: number;
    resolvedTickets: number;
    averageResolutionTime: number;
    satisfactionScore: number;
  };
}

interface CrossChannelContextProps {
  customerId?: string; // Opsiyonel - belirli müşteri için
  currentInteraction?: CustomerInteraction;
  onInteractionSelect?: (interaction: CustomerInteraction) => void;
  onContextShare?: (context: any) => void;
  showAllCustomers?: boolean; // Tüm müşterileri göster
}

const CrossChannelContext: React.FC<CrossChannelContextProps> = ({
  customerId,
  currentInteraction,
  onInteractionSelect,
  onContextShare,
  showAllCustomers = false
}) => {
  const [customerProfile, setCustomerProfile] = useState<CustomerProfile | null>(null);
  const [interactions, setInteractions] = useState<CustomerInteraction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedTimeframe, setSelectedTimeframe] = useState('30d');
  const [showAllChannels, setShowAllChannels] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterChannel, setFilterChannel] = useState('all');
  const [filterSentiment, setFilterSentiment] = useState('all');
  const [expandedSections, setExpandedSections] = useState<string[]>(['profile', 'interactions', 'purchases']);
  const [showTimeline, setShowTimeline] = useState(true);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(customerId || null);

  // Tüm müşteriler için mock veriler
  const allCustomersData = {
    'cust-001': {
      id: 'cust-001',
      name: 'Ayşe Demir',
      email: 'ayse.demir@example.com',
      phone: '+90 532 123 45 67',
      avatar: 'AD',
      joinDate: new Date('2023-01-15'),
      lastActivity: new Date(Date.now() - 2 * 60 * 1000),
      totalInteractions: 47,
      totalSpent: 12500,
      loyaltyPoints: 1250,
      preferences: {
        preferredChannel: 'whatsapp',
        preferredLanguage: 'tr',
        marketingConsent: true,
        timezone: 'Europe/Istanbul'
      },
      demographics: {
        age: 32,
        location: 'İstanbul, Türkiye',
        occupation: 'Yazılım Geliştirici',
        interests: ['teknoloji', 'spor', 'seyahat']
      },
      purchaseHistory: {
        totalOrders: 15,
        averageOrderValue: 833,
        lastPurchaseDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
        favoriteCategories: ['elektronik', 'kitap', 'spor']
      },
      supportHistory: {
        totalTickets: 8,
        resolvedTickets: 7,
        averageResolutionTime: 2.5,
        satisfactionScore: 4.2
      }
    },
    'cust-002': {
      id: 'cust-002',
      name: 'Ahmet Yılmaz',
      email: 'ahmet.yilmaz@example.com',
      phone: '+90 533 234 56 78',
      avatar: 'AY',
      joinDate: new Date('2023-02-20'),
      lastActivity: new Date(Date.now() - 30 * 60 * 1000),
      totalInteractions: 32,
      totalSpent: 8900,
      loyaltyPoints: 890,
      preferences: {
        preferredChannel: 'email',
        preferredLanguage: 'tr',
        marketingConsent: false,
        timezone: 'Europe/Istanbul'
      },
      demographics: {
        age: 45,
        location: 'Ankara, Türkiye',
        occupation: 'İş İnsanı',
        interests: ['iş', 'yönetim', 'teknoloji']
      },
      purchaseHistory: {
        totalOrders: 12,
        averageOrderValue: 742,
        lastPurchaseDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
        favoriteCategories: ['iş', 'teknoloji', 'eğitim']
      },
      supportHistory: {
        totalTickets: 5,
        resolvedTickets: 5,
        averageResolutionTime: 1.8,
        satisfactionScore: 4.8
      }
    },
    'cust-003': {
      id: 'cust-003',
      name: 'Mehmet Kaya',
      email: 'mehmet.kaya@example.com',
      phone: '+90 534 345 67 89',
      avatar: 'MK',
      joinDate: new Date('2023-03-10'),
      lastActivity: new Date(Date.now() - 2 * 60 * 60 * 1000),
      totalInteractions: 28,
      totalSpent: 6700,
      loyaltyPoints: 670,
      preferences: {
        preferredChannel: 'phone',
        preferredLanguage: 'tr',
        marketingConsent: true,
        timezone: 'Europe/Istanbul'
      },
      demographics: {
        age: 38,
        location: 'İzmir, Türkiye',
        occupation: 'Mobilya Ustası',
        interests: ['el sanatları', 'mobilya', 'tasarım']
      },
      purchaseHistory: {
        totalOrders: 18,
        averageOrderValue: 372,
        lastPurchaseDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
        favoriteCategories: ['mobilya', 'el sanatları', 'ev']
      },
      supportHistory: {
        totalTickets: 10,
        resolvedTickets: 8,
        averageResolutionTime: 3.2,
        satisfactionScore: 3.9
      }
    },
    'cust-004': {
      id: 'cust-004',
      name: 'Fatma Özkan',
      email: 'fatma.ozkan@example.com',
      phone: '+90 535 456 78 90',
      avatar: 'FÖ',
      joinDate: new Date('2023-01-25'),
      lastActivity: new Date(Date.now() - 15 * 60 * 1000),
      totalInteractions: 41,
      totalSpent: 11200,
      loyaltyPoints: 1120,
      preferences: {
        preferredChannel: 'chat',
        preferredLanguage: 'tr',
        marketingConsent: true,
        timezone: 'Europe/Istanbul'
      },
      demographics: {
        age: 29,
        location: 'Bursa, Türkiye',
        occupation: 'Gıda Mühendisi',
        interests: ['yemek', 'sağlık', 'spor']
      },
      purchaseHistory: {
        totalOrders: 22,
        averageOrderValue: 509,
        lastPurchaseDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
        favoriteCategories: ['gıda', 'sağlık', 'spor']
      },
      supportHistory: {
        totalTickets: 6,
        resolvedTickets: 6,
        averageResolutionTime: 2.1,
        satisfactionScore: 4.5
      }
    },
    'cust-005': {
      id: 'cust-005',
      name: 'Ali Çelik',
      email: 'ali.celik@example.com',
      phone: '+90 536 567 89 01',
      avatar: 'AÇ',
      joinDate: new Date('2022-11-15'),
      lastActivity: new Date(Date.now() - 45 * 60 * 1000),
      totalInteractions: 65,
      totalSpent: 18900,
      loyaltyPoints: 1890,
      preferences: {
        preferredChannel: 'whatsapp',
        preferredLanguage: 'tr',
        marketingConsent: true,
        timezone: 'Europe/Istanbul'
      },
      demographics: {
        age: 52,
        location: 'Antalya, Türkiye',
        occupation: 'İnşaat Müteahhidi',
        interests: ['inşaat', 'seyahat', 'spor']
      },
      purchaseHistory: {
        totalOrders: 35,
        averageOrderValue: 540,
        lastPurchaseDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
        favoriteCategories: ['inşaat', 'ev', 'bahçe']
      },
      supportHistory: {
        totalTickets: 15,
        resolvedTickets: 13,
        averageResolutionTime: 2.8,
        satisfactionScore: 4.1
      }
    }
  };

  // Tüm müşteriler için etkileşim verileri
  const allInteractionsData = {
    'cust-001': [
      {
        id: '1',
        channelId: 'whatsapp',
        channelType: 'whatsapp',
        channelIcon: <MessageCircle className="w-4 h-4" />,
        channelColor: 'bg-green-600',
        interactionType: 'message',
        content: 'Ürün iade etmek istiyorum. Hasar var.',
        timestamp: new Date(Date.now() - 5 * 60 * 1000),
        agentId: 'agent-1',
        agentName: 'Elif Koç',
        sentiment: 'negative',
        priority: 'high',
        tags: ['iade', 'hasar', 'memnuniyetsizlik'],
        relatedTicketId: 'ticket-123'
      },
      {
        id: '2',
        channelId: 'email',
        channelType: 'email',
        channelIcon: <Mail className="w-4 h-4" />,
        channelColor: 'bg-blue-500',
        interactionType: 'inquiry',
        content: 'Sipariş durumu hakkında bilgi istiyorum.',
        timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
        agentId: 'agent-2',
        agentName: 'Mehmet Demir',
        sentiment: 'neutral',
        priority: 'medium',
        tags: ['sipariş', 'bilgi'],
        relatedTicketId: 'ticket-122'
      }
    ],
    'cust-002': [
      {
        id: '3',
        channelId: 'email',
        channelType: 'email',
        channelIcon: <Mail className="w-4 h-4" />,
        channelColor: 'bg-blue-500',
        interactionType: 'complaint',
        content: 'Fatura düzeltmesi gerekiyor.',
        timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
        agentId: 'agent-3',
        agentName: 'Ayşe Kaya',
        sentiment: 'negative',
        priority: 'medium',
        tags: ['fatura', 'düzeltme'],
        relatedTicketId: 'ticket-124'
      },
      {
        id: '4',
        channelId: 'phone',
        channelType: 'phone',
        channelIcon: <Phone className="w-4 h-4" />,
        channelColor: 'bg-purple-500',
        interactionType: 'call',
        content: 'Teknik destek için aradı. Sorun çözüldü.',
        timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
        agentId: 'agent-4',
        agentName: 'Can Özkan',
        sentiment: 'positive',
        priority: 'medium',
        tags: ['teknik destek', 'çözüldü'],
        resolution: 'Müşteri memnun kaldı, sorun çözüldü.'
      }
    ],
    'cust-003': [
      {
        id: '5',
        channelId: 'phone',
        channelType: 'phone',
        channelIcon: <Phone className="w-4 h-4" />,
        channelColor: 'bg-purple-500',
        interactionType: 'call',
        content: 'Toplu sipariş vermek istiyorum.',
        timestamp: new Date(Date.now() - 30 * 60 * 1000),
        agentId: 'agent-5',
        agentName: 'Zeynep Arslan',
        sentiment: 'positive',
        priority: 'high',
        tags: ['toplu sipariş', 'mobilya'],
        relatedTicketId: 'ticket-125'
      },
      {
        id: '6',
        channelId: 'chat',
        channelType: 'chat',
        channelIcon: <MessageSquare className="w-4 h-4" />,
        channelColor: 'bg-green-500',
        interactionType: 'inquiry',
        content: 'Ürün kullanım sorunu yaşıyorum.',
        timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
        agentId: 'agent-6',
        agentName: 'Burak Yıldız',
        sentiment: 'neutral',
        priority: 'medium',
        tags: ['kullanım', 'sorun'],
        relatedTicketId: 'ticket-126'
      }
    ],
    'cust-004': [
      {
        id: '7',
        channelId: 'chat',
        channelType: 'chat',
        channelIcon: <MessageSquare className="w-4 h-4" />,
        channelColor: 'bg-green-500',
        interactionType: 'message',
        content: 'Gıda ürünü iade talebi.',
        timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
        agentId: 'agent-7',
        agentName: 'Deniz Kaya',
        sentiment: 'negative',
        priority: 'medium',
        tags: ['iade', 'gıda'],
        relatedTicketId: 'ticket-127'
      },
      {
        id: '8',
        channelId: 'email',
        channelType: 'email',
        channelIcon: <Mail className="w-4 h-4" />,
        channelColor: 'bg-blue-500',
        interactionType: 'feedback',
        content: 'Harika bir deneyim yaşadım! Teşekkürler.',
        timestamp: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
        sentiment: 'positive',
        priority: 'low',
        tags: ['olumlu geri bildirim', 'memnuniyet']
      }
    ],
    'cust-005': [
      {
        id: '9',
        channelId: 'whatsapp',
        channelType: 'whatsapp',
        channelIcon: <MessageCircle className="w-4 h-4" />,
        channelColor: 'bg-green-600',
        interactionType: 'message',
        content: 'İnşaat malzemesi siparişi vermek istiyorum.',
        timestamp: new Date(Date.now() - 2 * 60 * 1000),
        agentId: 'agent-8',
        agentName: 'Ece Demir',
        sentiment: 'positive',
        priority: 'high',
        tags: ['sipariş', 'inşaat'],
        relatedTicketId: 'ticket-128'
      },
      {
        id: '10',
        channelId: 'phone',
        channelType: 'phone',
        channelIcon: <Phone className="w-4 h-4" />,
        channelColor: 'bg-purple-500',
        interactionType: 'call',
        content: 'Teslimat bilgisi sorgusu.',
        timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
        agentId: 'agent-9',
        agentName: 'Kemal Özkan',
        sentiment: 'neutral',
        priority: 'medium',
        tags: ['teslimat', 'bilgi'],
        relatedTicketId: 'ticket-129'
      }
    ]
  };

  // Müşteri verilerini yükle
  useEffect(() => {
    const loadCustomerData = async () => {
      setIsLoading(true);
      
      // Gerçek uygulamada burada API çağrısı yapılacak
      await new Promise(resolve => setTimeout(resolve, 500));
      
      if (showAllCustomers) {
        // Tüm müşterileri göster
        const firstCustomerId = Object.keys(allCustomersData)[0];
        setSelectedCustomerId(firstCustomerId);
        setCustomerProfile(allCustomersData[firstCustomerId as keyof typeof allCustomersData]);
        setInteractions(allInteractionsData[firstCustomerId as keyof typeof allInteractionsData] || []);
      } else if (customerId && allCustomersData[customerId as keyof typeof allCustomersData]) {
        // Belirli bir müşteriyi göster
        setSelectedCustomerId(customerId);
        setCustomerProfile(allCustomersData[customerId as keyof typeof allCustomersData]);
        setInteractions(allInteractionsData[customerId as keyof typeof allInteractionsData] || []);
      } else {
        // Varsayılan müşteri
        const defaultCustomerId = 'cust-001';
        setSelectedCustomerId(defaultCustomerId);
        setCustomerProfile(allCustomersData[defaultCustomerId]);
        setInteractions(allInteractionsData[defaultCustomerId] || []);
      }
      
      setIsLoading(false);
    };

    loadCustomerData();
  }, [customerId, showAllCustomers]);

  const handleSectionToggle = (sectionId: string) => {
    setExpandedSections(prev => 
      prev.includes(sectionId) 
        ? prev.filter(id => id !== sectionId)
        : [...prev, sectionId]
    );
  };

  const handleInteractionSelect = (interaction: CustomerInteraction) => {
    onInteractionSelect?.(interaction);
  };

  const handleContextShare = () => {
    const context = {
      customerProfile,
      interactions,
      currentInteraction
    };
    onContextShare?.(context);
    toast.success('Bağlam paylaşıldı');
  };

  const handleCustomerChange = (customerId: string) => {
    setSelectedCustomerId(customerId);
    setCustomerProfile(allCustomersData[customerId as keyof typeof allCustomersData]);
    setInteractions(allInteractionsData[customerId as keyof typeof allInteractionsData] || []);
  };

  const getSentimentIcon = (sentiment: string) => {
    switch (sentiment) {
      case 'positive': return <ThumbsUp className="w-4 h-4 text-green-500" />;
      case 'negative': return <ThumbsDown className="w-4 h-4 text-red-500" />;
      case 'neutral': return <Minus className="w-4 h-4 text-gray-500" />;
      default: return <Minus className="w-4 h-4 text-gray-500" />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'text-red-600 bg-red-100 dark:bg-red-900/20';
      case 'high': return 'text-orange-600 bg-orange-100 dark:bg-orange-900/20';
      case 'medium': return 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900/20';
      case 'low': return 'text-green-600 bg-green-100 dark:bg-green-900/20';
      default: return 'text-gray-600 bg-gray-100 dark:bg-gray-900/20';
    }
  };

  const getInteractionTypeIcon = (type: string) => {
    switch (type) {
      case 'message': return <MessageSquare className="w-4 h-4" />;
      case 'call': return <Phone className="w-4 h-4" />;
      case 'purchase': return <ShoppingCart className="w-4 h-4" />;
      case 'complaint': return <AlertCircle className="w-4 h-4" />;
      case 'inquiry': return <Search className="w-4 h-4" />;
      case 'feedback': return <Star className="w-4 h-4" />;
      default: return <MessageSquare className="w-4 h-4" />;
    }
  };

  const filteredInteractions = interactions.filter(interaction => {
    const matchesSearch = searchTerm === '' || 
      interaction.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
      interaction.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesChannel = filterChannel === 'all' || interaction.channelType === filterChannel;
    const matchesSentiment = filterSentiment === 'all' || interaction.sentiment === filterSentiment;
    
    return matchesSearch && matchesChannel && matchesSentiment;
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!customerProfile) {
    return (
      <div className="text-center py-8">
        <User className="w-16 h-16 mx-auto text-gray-400 mb-4" />
        <p className="text-gray-600 dark:text-gray-400">Müşteri profili bulunamadı</p>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center text-white font-semibold">
              {customerProfile.avatar}
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                {customerProfile.name}
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {customerProfile.email} • {customerProfile.phone}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            {showAllCustomers && (
              <select
                value={selectedCustomerId || ''}
                onChange={(e) => handleCustomerChange(e.target.value)}
                className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {Object.entries(allCustomersData).map(([id, customer]) => (
                  <option key={id} value={id}>
                    {customer.name} - {customer.email}
                  </option>
                ))}
              </select>
            )}
            <button
              onClick={handleContextShare}
              className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
            >
              <Share2 className="w-4 h-4" />
              Paylaş
            </button>
            <button
              onClick={() => setShowTimeline(!showTimeline)}
              className="p-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
            >
              {showTimeline ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </div>

      <div className="p-4 space-y-6">
        {/* Müşteri Profili */}
        <div className="border border-gray-200 dark:border-gray-700 rounded-lg">
          <button
            onClick={() => handleSectionToggle('profile')}
            className="w-full p-4 text-left flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-700"
          >
            <div className="flex items-center gap-3">
              <User className="w-5 h-5 text-blue-600" />
              <h4 className="font-medium text-gray-900 dark:text-white">Müşteri Profili</h4>
            </div>
            {expandedSections.includes('profile') ? <ChevronDown className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
          </button>
          
          {expandedSections.includes('profile') && (
            <div className="px-4 pb-4 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Toplam Etkileşim</span>
                    <span className="font-medium">{customerProfile.totalInteractions}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Toplam Harcama</span>
                    <span className="font-medium">₺{customerProfile.totalSpent.toLocaleString()}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Sadakat Puanı</span>
                    <span className="font-medium">{customerProfile.loyaltyPoints}</span>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Tercih Edilen Kanal</span>
                    <span className="font-medium capitalize">{customerProfile.preferences.preferredChannel}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Memnuniyet Skoru</span>
                    <span className="font-medium">{customerProfile.supportHistory.satisfactionScore}/5</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Ortalama Çözüm Süresi</span>
                    <span className="font-medium">{customerProfile.supportHistory.averageResolutionTime} saat</span>
                  </div>
                </div>
              </div>
              
              <div className="flex flex-wrap gap-2">
                {customerProfile.demographics.interests?.map((interest, index) => (
                  <span key={index} className="px-2 py-1 bg-blue-100 dark:bg-blue-900/20 text-blue-800 dark:text-blue-300 text-xs rounded-full">
                    {interest}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Satın Alma Geçmişi */}
        <div className="border border-gray-200 dark:border-gray-700 rounded-lg">
          <button
            onClick={() => handleSectionToggle('purchases')}
            className="w-full p-4 text-left flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-700"
          >
            <div className="flex items-center gap-3">
              <ShoppingCart className="w-5 h-5 text-green-600" />
              <h4 className="font-medium text-gray-900 dark:text-white">Satın Alma Geçmişi</h4>
            </div>
            {expandedSections.includes('purchases') ? <ChevronDown className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
          </button>
          
          {expandedSections.includes('purchases') && (
            <div className="px-4 pb-4 space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">{customerProfile.purchaseHistory.totalOrders}</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Toplam Sipariş</div>
                </div>
                <div className="text-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">₺{customerProfile.purchaseHistory.averageOrderValue}</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Ortalama Sipariş</div>
                </div>
                <div className="text-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <div className="text-2xl font-bold text-purple-600">{customerProfile.purchaseHistory.favoriteCategories.length}</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Favori Kategori</div>
                </div>
              </div>
              
              <div>
                <h5 className="font-medium text-gray-900 dark:text-white mb-2">Favori Kategoriler</h5>
                <div className="flex flex-wrap gap-2">
                  {customerProfile.purchaseHistory.favoriteCategories.map((category, index) => (
                    <span key={index} className="px-2 py-1 bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-300 text-xs rounded-full">
                      {category}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Etkileşim Geçmişi */}
        <div className="border border-gray-200 dark:border-gray-700 rounded-lg">
          <button
            onClick={() => handleSectionToggle('interactions')}
            className="w-full p-4 text-left flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-700"
          >
            <div className="flex items-center gap-3">
              <MessageSquare className="w-5 h-5 text-purple-600" />
              <h4 className="font-medium text-gray-900 dark:text-white">Etkileşim Geçmişi</h4>
              <span className="text-sm text-gray-500">({filteredInteractions.length})</span>
            </div>
            {expandedSections.includes('interactions') ? <ChevronDown className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
          </button>
          
          {expandedSections.includes('interactions') && (
            <div className="px-4 pb-4">
              {/* Filtreler */}
              <div className="flex items-center gap-2 mb-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Etkileşimlerde ara..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                
                <select
                  value={filterChannel}
                  onChange={(e) => setFilterChannel(e.target.value)}
                  className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="all">Tüm Kanallar</option>
                  <option value="email">E-posta</option>
                  <option value="chat">Chat</option>
                  <option value="phone">Telefon</option>
                  <option value="whatsapp">WhatsApp</option>
                  <option value="social">Sosyal Medya</option>
                </select>
                
                <select
                  value={filterSentiment}
                  onChange={(e) => setFilterSentiment(e.target.value)}
                  className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="all">Tüm Duygular</option>
                  <option value="positive">Pozitif</option>
                  <option value="negative">Negatif</option>
                  <option value="neutral">Nötr</option>
                </select>
              </div>

              {/* Etkileşim Listesi */}
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {filteredInteractions.map((interaction) => (
                  <div
                    key={interaction.id}
                    onClick={() => handleInteractionSelect(interaction)}
                    className={`p-3 border border-gray-200 dark:border-gray-600 rounded-lg cursor-pointer transition-colors ${
                      currentInteraction?.id === interaction.id 
                        ? 'bg-blue-50 dark:bg-blue-900/10 border-blue-300 dark:border-blue-600' 
                        : 'hover:bg-gray-50 dark:hover:bg-gray-700'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`w-8 h-8 ${interaction.channelColor} rounded-lg flex items-center justify-center text-white`}>
                        {interaction.channelIcon}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-gray-900 dark:text-white">
                              {interaction.interactionType === 'call' ? 'Telefon Görüşmesi' : 
                               interaction.interactionType === 'purchase' ? 'Satın Alma' :
                               interaction.interactionType === 'complaint' ? 'Şikayet' :
                               interaction.interactionType === 'inquiry' ? 'Sorgu' :
                               interaction.interactionType === 'feedback' ? 'Geri Bildirim' : 'Mesaj'}
                            </span>
                            {getSentimentIcon(interaction.sentiment)}
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(interaction.priority)}`}>
                              {interaction.priority === 'urgent' ? 'Acil' : 
                               interaction.priority === 'high' ? 'Yüksek' :
                               interaction.priority === 'medium' ? 'Orta' : 'Düşük'}
                            </span>
                          </div>
                          <span className="text-xs text-gray-500 dark:text-gray-400">
                            {format(interaction.timestamp, 'dd MMM HH:mm', { locale: tr })}
                          </span>
                        </div>
                        
                        <p className="text-sm text-gray-700 dark:text-gray-300 mb-2 line-clamp-2">
                          {interaction.content}
                        </p>
                        
                        {interaction.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1">
                            {interaction.tags.map((tag, index) => (
                              <span key={index} className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 text-xs rounded-full">
                                {tag}
                              </span>
                            ))}
                          </div>
                        )}
                        
                        {interaction.agentName && (
                          <div className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                            Temsilci: {interaction.agentName}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Timeline Görünümü */}
        {showTimeline && (
          <div className="border border-gray-200 dark:border-gray-700 rounded-lg">
            <div className="p-4 border-b border-gray-200 dark:border-gray-700">
              <h4 className="font-medium text-gray-900 dark:text-white">Zaman Çizelgesi</h4>
            </div>
            <div className="p-4">
              <div className="space-y-4">
                {filteredInteractions.slice(0, 5).map((interaction, index) => (
                  <div key={interaction.id} className="flex items-start gap-4">
                    <div className="flex-shrink-0">
                      <div className={`w-8 h-8 ${interaction.channelColor} rounded-full flex items-center justify-center text-white`}>
                        {interaction.channelIcon}
                      </div>
                      {index < filteredInteractions.length - 1 && (
                        <div className="w-0.5 h-8 bg-gray-300 dark:bg-gray-600 mx-auto mt-2"></div>
                      )}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium text-gray-900 dark:text-white">
                          {interaction.interactionType === 'call' ? 'Telefon Görüşmesi' : 
                           interaction.interactionType === 'purchase' ? 'Satın Alma' :
                           interaction.interactionType === 'complaint' ? 'Şikayet' :
                           interaction.interactionType === 'inquiry' ? 'Sorgu' :
                           interaction.interactionType === 'feedback' ? 'Geri Bildirim' : 'Mesaj'}
                        </span>
                        {getSentimentIcon(interaction.sentiment)}
                      </div>
                      
                      <p className="text-sm text-gray-700 dark:text-gray-300 mb-1">
                        {interaction.content}
                      </p>
                      
                      <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
                        <span>{format(interaction.timestamp, 'dd MMM yyyy HH:mm', { locale: tr })}</span>
                        {interaction.agentName && (
                          <span>Temsilci: {interaction.agentName}</span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CrossChannelContext;
