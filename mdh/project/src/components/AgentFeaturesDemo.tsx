import React, { useState } from 'react';
import { 
  FileText, 
  MessageSquare, 
  Share2,
  Users,
  Settings,
  Play,
  Pause,
  RotateCcw,
  BarChart3,
  UserCheck,
  TrendingUp,
  Mail,
  Phone,
  Building,
  Star,
  Calendar,
  MessageCircle,
  Globe,
  Smartphone,
  Clock,
  CheckCircle
} from 'lucide-react';
import AutoDocumentation from './AutoDocumentation';
import MultiChannelManager from './MultiChannelManager';
import CrossChannelContext from './CrossChannelContext';

const AgentFeaturesDemo: React.FC = () => {
  const [activeFeature, setActiveFeature] = useState<string>('documentation');
  const [demoMode, setDemoMode] = useState<'static' | 'interactive'>('interactive');
  const [viewMode, setViewMode] = useState<'overall' | 'customer'>('overall');
  const [selectedCustomer, setSelectedCustomer] = useState<string>('all');
  const [conversationContext, setConversationContext] = useState('Müşteri ürün iade etmek istiyorum. Hasar var ve memnun değil.');

  // Tüm müşteri listesi - TicketDetail.tsx ile senkronize
  const allCustomers = [
    {
      id: 'cust-001',
      name: 'Ayşe Demir',
      email: 'ayse.demir@example.com',
      phone: '+90 532 123 45 67',
      company: 'Demir Teknoloji A.Ş.',
      plan: 'premium',
      satisfaction_score: 85,
      total_tickets: 12,
      avatar: 'AD',
      status: 'active'
    },
    {
      id: 'cust-002',
      name: 'Ahmet Yılmaz',
      email: 'ahmet.yilmaz@example.com',
      phone: '+90 533 234 56 78',
      company: 'Yılmaz Holding',
      plan: 'pro',
      satisfaction_score: 92,
      total_tickets: 8,
      avatar: 'AY',
      status: 'active'
    },
    {
      id: 'cust-003',
      name: 'Mehmet Kaya',
      email: 'mehmet.kaya@example.com',
      phone: '+90 534 345 67 89',
      company: 'Kaya Mobilya',
      plan: 'basic',
      satisfaction_score: 78,
      total_tickets: 15,
      avatar: 'MK',
      status: 'active'
    },
    {
      id: 'cust-004',
      name: 'Fatma Özkan',
      email: 'fatma.ozkan@example.com',
      phone: '+90 535 456 78 90',
      company: 'Özkan Gıda',
      plan: 'premium',
      satisfaction_score: 88,
      total_tickets: 6,
      avatar: 'FÖ',
      status: 'active'
    },
    {
      id: 'cust-005',
      name: 'Ali Çelik',
      email: 'ali.celik@example.com',
      phone: '+90 536 567 89 01',
      company: 'Çelik İnşaat',
      plan: 'pro',
      satisfaction_score: 95,
      total_tickets: 20,
      avatar: 'AÇ',
      status: 'active'
    },
    {
      id: 'cust-006',
      name: 'Zeynep Arslan',
      email: 'zeynep.arslan@example.com',
      phone: '+90 537 678 90 12',
      company: 'Arslan Tasarım',
      plan: 'basic',
      satisfaction_score: 82,
      total_tickets: 9,
      avatar: 'ZA',
      status: 'active'
    },
    {
      id: 'cust-007',
      name: 'Mustafa Koç',
      email: 'mustafa.koc@example.com',
      phone: '+90 538 789 01 23',
      company: 'Koç Otomotiv',
      plan: 'premium',
      satisfaction_score: 90,
      total_tickets: 14,
      avatar: 'MK',
      status: 'active'
    },
    {
      id: 'cust-008',
      name: 'Elif Yıldız',
      email: 'elif.yildiz@example.com',
      phone: '+90 539 890 12 34',
      company: 'Yıldız Eğitim',
      plan: 'pro',
      satisfaction_score: 87,
      total_tickets: 11,
      avatar: 'EY',
      status: 'active'
    }
  ];

  // Cross-channel ve multi-channel istekler için mock veriler
  const customerRequests = {
    'cust-001': [
      { channel: 'email', type: 'iade', content: 'Ürün iade etmek istiyorum. Hasar var.', status: 'active' },
      { channel: 'chat', type: 'destek', content: 'Sistem giriş yapamıyorum', status: 'resolved' },
      { channel: 'phone', type: 'siparis', content: 'Yeni sipariş vermek istiyorum', status: 'active' },
      { channel: 'social', type: 'sikayet', content: 'Müşteri hizmetleri yavaş', status: 'pending' }
    ],
    'cust-002': [
      { channel: 'email', type: 'fatura', content: 'Fatura düzeltmesi gerekiyor', status: 'resolved' },
      { channel: 'chat', type: 'destek', content: 'Teknik destek almak istiyorum', status: 'active' },
      { channel: 'phone', type: 'iade', content: 'Ürün değişimi talebi', status: 'pending' }
    ],
    'cust-003': [
      { channel: 'email', type: 'siparis', content: 'Toplu sipariş vermek istiyorum', status: 'active' },
      { channel: 'chat', type: 'destek', content: 'Ürün kullanım sorunu', status: 'resolved' },
      { channel: 'social', type: 'oneri', content: 'Yeni özellik önerisi', status: 'pending' },
      { channel: 'phone', type: 'fatura', content: 'Fatura bilgisi sorgusu', status: 'active' }
    ],
    'cust-004': [
      { channel: 'email', type: 'iade', content: 'Gıda ürünü iade talebi', status: 'resolved' },
      { channel: 'chat', type: 'destek', content: 'Sipariş takibi', status: 'active' }
    ],
    'cust-005': [
      { channel: 'email', type: 'siparis', content: 'İnşaat malzemesi siparişi', status: 'active' },
      { channel: 'phone', type: 'destek', content: 'Teslimat bilgisi', status: 'resolved' },
      { channel: 'social', type: 'sikayet', content: 'Teslimat gecikmesi', status: 'pending' },
      { channel: 'chat', type: 'fatura', content: 'Fatura düzeltmesi', status: 'active' }
    ],
    'cust-006': [
      { channel: 'email', type: 'destek', content: 'Tasarım yazılımı sorunu', status: 'active' },
      { channel: 'chat', type: 'oneri', content: 'Yeni tasarım önerisi', status: 'pending' }
    ],
    'cust-007': [
      { channel: 'email', type: 'siparis', content: 'Otomotiv parçası siparişi', status: 'active' },
      { channel: 'phone', type: 'destek', content: 'Teknik destek', status: 'resolved' },
      { channel: 'social', type: 'oneri', content: 'Yeni model önerisi', status: 'pending' },
      { channel: 'chat', type: 'fatura', content: 'Fatura sorgusu', status: 'active' }
    ],
    'cust-008': [
      { channel: 'email', type: 'destek', content: 'Eğitim platformu sorunu', status: 'active' },
      { channel: 'chat', type: 'oneri', content: 'Yeni kurs önerisi', status: 'pending' },
      { channel: 'phone', type: 'siparis', content: 'Eğitim materyali siparişi', status: 'resolved' }
    ]
  };

  const mockTicket = {
    id: 'demo-ticket-123',
    customer_id: 'demo-customer-456',
    title: 'Ürün İade Talebi',
    status: 'in_progress',
    priority: 'high',
    category: 'iade'
  };

  const mockUser = {
    id: 'demo-agent-789',
    name: 'Elif Koç',
    email: 'elif.koc@example.com',
    role: 'admin'
  };

  const mockMessages = [
    {
      id: '1',
      sender: 'customer',
      content: 'Merhaba, satın aldığım ürünü iade etmek istiyorum.',
      timestamp: new Date(Date.now() - 10 * 60 * 1000)
    },
    {
      id: '2',
      sender: 'agent',
      content: 'Merhaba! Size yardımcı olmaktan memnuniyet duyarım. İade sebebinizi öğrenebilir miyim?',
      timestamp: new Date(Date.now() - 8 * 60 * 1000)
    },
    {
      id: '3',
      sender: 'customer',
      content: 'Ürün hasarlı geldi ve beklediğim gibi değil.',
      timestamp: new Date(Date.now() - 5 * 60 * 1000)
    }
  ];

  const features = [
    {
      id: 'documentation',
      name: 'Otomatik Dokümantasyon',
      description: 'Konuşma özeti ve otomatik rapor oluşturma',
      icon: <FileText className="w-6 h-6" />,
      color: 'green'
    },
    {
      id: 'multichannel',
      name: 'Çoklu Kanal Yönetimi',
      description: 'Tüm iletişim kanallarını tek yerden yönetme',
      icon: <MessageSquare className="w-6 h-6" />,
      color: 'purple'
    },
    {
      id: 'crosschannel',
      name: 'Cross-Channel Context',
      description: 'Müşteri etkileşim geçmişi ve bağlam analizi',
      icon: <Share2 className="w-6 h-6" />,
      color: 'orange'
    }
  ];

  const getColorClasses = (color: string) => {
    switch (color) {
      case 'green': return 'border-green-500 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300';
      case 'purple': return 'border-purple-500 bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300';
      case 'orange': return 'border-orange-500 bg-orange-50 dark:bg-orange-900/20 text-orange-700 dark:text-orange-300';
      default: return 'border-gray-500 bg-gray-50 dark:bg-gray-900/20 text-gray-700 dark:text-gray-300';
    }
  };

  const getChannelIcon = (channel: string) => {
    switch (channel) {
      case 'email': return <Mail className="w-4 h-4" />;
      case 'chat': return <MessageCircle className="w-4 h-4" />;
      case 'phone': return <Phone className="w-4 h-4" />;
      case 'social': return <Globe className="w-4 h-4" />;
      default: return <MessageSquare className="w-4 h-4" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400';
      case 'resolved': return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400';
      case 'pending': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'active': return 'Aktif';
      case 'resolved': return 'Çözüldü';
      case 'pending': return 'Beklemede';
      default: return 'Bilinmeyen';
    }
  };

  const getTypeText = (type: string) => {
    switch (type) {
      case 'iade': return 'İade';
      case 'destek': return 'Destek';
      case 'siparis': return 'Sipariş';
      case 'fatura': return 'Fatura';
      case 'sikayet': return 'Şikayet';
      case 'oneri': return 'Öneri';
      default: return 'Diğer';
    }
  };

  const renderCustomerStats = () => {
    const selectedCustomerData = selectedCustomer === 'all' 
      ? allCustomers 
      : allCustomers.filter(c => c.id === selectedCustomer);

    const totalRequests = selectedCustomer === 'all'
      ? Object.values(customerRequests).flat().length
      : customerRequests[selectedCustomer as keyof typeof customerRequests]?.length || 0;

    const activeRequests = selectedCustomer === 'all'
      ? Object.values(customerRequests).flat().filter(r => r.status === 'active').length
      : customerRequests[selectedCustomer as keyof typeof customerRequests]?.filter(r => r.status === 'active').length || 0;

    const resolvedRequests = selectedCustomer === 'all'
      ? Object.values(customerRequests).flat().filter(r => r.status === 'resolved').length
      : customerRequests[selectedCustomer as keyof typeof customerRequests]?.filter(r => r.status === 'resolved').length || 0;

    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Toplam İstek</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{totalRequests}</p>
            </div>
            <div className="bg-blue-500 p-2 rounded-lg">
              <MessageSquare className="w-5 h-5 text-white" />
            </div>
          </div>
        </div>
        
        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Aktif İstekler</p>
              <p className="text-2xl font-bold text-yellow-600">{activeRequests}</p>
            </div>
            <div className="bg-yellow-500 p-2 rounded-lg">
              <Clock className="w-5 h-5 text-white" />
            </div>
          </div>
        </div>
        
        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Çözülen İstekler</p>
              <p className="text-2xl font-bold text-green-600">{resolvedRequests}</p>
            </div>
            <div className="bg-green-500 p-2 rounded-lg">
              <CheckCircle className="w-5 h-5 text-white" />
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderCustomerList = () => {
    const customersToShow = selectedCustomer === 'all' ? allCustomers : allCustomers.filter(c => c.id === selectedCustomer);
    
    return (
      <div className="space-y-4">
        {customersToShow.map((customer) => (
          <div key={customer.id} className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
            {/* Müşteri Başlığı */}
            <div className="p-4 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center text-white font-semibold">
                    {customer.avatar}
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{customer.name}</h3>
                                         <div className="flex flex-col sm:flex-row sm:flex-wrap items-start sm:items-center gap-2 sm:gap-4 text-sm text-gray-600 dark:text-gray-400">
                       <div className="flex items-center w-full sm:w-auto">
                         <Mail className="w-4 h-4 mr-1 flex-shrink-0" />
                         <span className="break-all">{customer.email}</span>
                       </div>
                       <div className="flex items-center">
                         <Phone className="w-4 h-4 mr-1" />
                         <span>{customer.phone}</span>
                       </div>
                       {customer.company && (
                         <div className="flex items-center">
                           <Building className="w-4 h-4 mr-1" />
                           <span className="break-words">{customer.company}</span>
                         </div>
                       )}
                     </div>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="flex items-center">
                    <Star className="w-4 h-4 text-yellow-400 fill-current mr-1" />
                    <span className="text-sm font-medium">{customer.satisfaction_score}/100</span>
                  </div>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    customer.plan === 'premium' ? 'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400' :
                    customer.plan === 'pro' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400' :
                    'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400'
                  }`}>
                    {customer.plan === 'premium' ? 'Premium' : customer.plan === 'pro' ? 'Pro' : 'Basic'}
                  </span>
                </div>
              </div>
            </div>

            {/* Müşteri İstekleri */}
            <div className="p-4">
              <h4 className="text-md font-semibold text-gray-900 dark:text-white mb-3 flex items-center">
                <MessageSquare className="w-4 h-4 mr-2" />
                Cross-Channel ve Multi-Channel İstekler ({customerRequests[customer.id as keyof typeof customerRequests]?.length || 0})
              </h4>
              
              <div className="space-y-3">
                {customerRequests[customer.id as keyof typeof customerRequests]?.map((request, index) => (
                  <div key={index} className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start space-x-3 flex-1">
                        <div className="flex items-center space-x-2">
                          {getChannelIcon(request.channel)}
                          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                            {request.channel === 'email' ? 'E-posta' :
                             request.channel === 'chat' ? 'Canlı Chat' :
                             request.channel === 'phone' ? 'Telefon' :
                             request.channel === 'social' ? 'Sosyal Medya' : 'Diğer'}
                          </span>
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-1">
                            <span className="text-sm font-medium text-gray-900 dark:text-white">
                              {getTypeText(request.type)}
                            </span>
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(request.status)}`}>
                              {getStatusText(request.status)}
                            </span>
                          </div>
                          <p className="text-sm text-gray-600 dark:text-gray-400">{request.content}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                )) || (
                  <div className="text-center py-4 text-gray-500 dark:text-gray-400">
                    Bu müşteri için henüz istek bulunmuyor.
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  };

  const renderFeature = () => {
    switch (activeFeature) {
      case 'documentation':
        return (
          <div className="h-96 overflow-y-auto">
            <AutoDocumentation
              ticket={mockTicket}
              conversationHistory={mockMessages}
              currentUser={mockUser}
              onSave={(doc) => {
                console.log('Dokümantasyon kaydedildi:', doc);
              }}
            />
          </div>
        );
      case 'multichannel':
        return (
          <div className="h-96">
            <MultiChannelManager
              currentUser={mockUser}
              onMessageSelect={(message) => {
                console.log('Mesaj seçildi:', message);
              }}
              onChannelChange={(channel) => {
                console.log('Kanal değişti:', channel);
              }}
            />
          </div>
        );
      case 'crosschannel':
        return (
          <div className="h-96 overflow-y-auto">
            <CrossChannelContext
              showAllCustomers={true}
              currentInteraction={{
                id: 'current',
                channelId: 'chat',
                channelType: 'chat',
                channelIcon: <MessageSquare className="w-4 h-4" />,
                channelColor: 'bg-green-500',
                interactionType: 'message',
                content: 'Mevcut konuşma',
                timestamp: new Date(),
                sentiment: 'negative',
                priority: 'high',
                tags: ['iade', 'hasar']
              }}
              onInteractionSelect={(interaction) => {
                console.log('Etkileşim seçildi:', interaction);
              }}
              onContextShare={(context) => {
                console.log('Bağlam paylaşıldı:', context);
              }}
            />
          </div>
        );
      default:
        return <div>Özellik bulunamadı</div>;
    }
  };

  const renderOverallStats = () => (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
      <div className="bg-gradient-to-r from-green-500 to-green-600 text-white p-4 rounded-lg">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm opacity-90">Toplam Dokümantasyon</p>
            <p className="text-2xl font-bold">1,247</p>
            <p className="text-xs opacity-75">+12% bu ay</p>
          </div>
          <FileText className="w-8 h-8 opacity-80" />
        </div>
      </div>
      
      <div className="bg-gradient-to-r from-purple-500 to-purple-600 text-white p-4 rounded-lg">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm opacity-90">Aktif Kanallar</p>
            <p className="text-2xl font-bold">8</p>
            <p className="text-xs opacity-75">3 yeni bu hafta</p>
          </div>
          <MessageSquare className="w-8 h-8 opacity-80" />
        </div>
      </div>
      
      <div className="bg-gradient-to-r from-orange-500 to-orange-600 text-white p-4 rounded-lg">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm opacity-90">Cross-Channel Analiz</p>
            <p className="text-2xl font-bold">89%</p>
            <p className="text-xs opacity-75">Başarı oranı</p>
          </div>
          <Share2 className="w-8 h-8 opacity-80" />
        </div>
      </div>
    </div>
  );



  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto p-6">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                Temsilci Özellikleri Demo
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                Gelişmiş temsilci araçlarını keşfedin ve test edin
              </p>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600 dark:text-gray-400">Demo Modu:</span>
                <button
                  onClick={() => setDemoMode(demoMode === 'static' ? 'interactive' : 'static')}
                  className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                    demoMode === 'interactive'
                      ? 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-300'
                      : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
                  }`}
                >
                  {demoMode === 'interactive' ? 'İnteraktif' : 'Statik'}
                </button>
              </div>
              
              <button
                onClick={() => window.location.reload()}
                className="p-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
                title="Sayfayı yenile"
              >
                <RotateCcw className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

        {/* View Mode Toggle */}
        <div className="mb-6">
          <div className="flex items-center gap-4">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Görünüm:</span>
            <div className="flex bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
              <button
                onClick={() => setViewMode('overall')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  viewMode === 'overall'
                    ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                <div className="flex items-center gap-2">
                  <BarChart3 className="w-4 h-4" />
                  Genel İstatistikler
                </div>
              </button>
              <button
                onClick={() => setViewMode('customer')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  viewMode === 'customer'
                    ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                <div className="flex items-center gap-2">
                  <UserCheck className="w-4 h-4" />
                  Müşteri Bazlı
                </div>
              </button>
            </div>
          </div>
        </div>

        {/* Customer Selection */}
        {viewMode === 'customer' && (
          <div className="mb-6">
            <div className="flex items-center gap-4">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Müşteri Seçimi:</span>
              <select
                value={selectedCustomer}
                onChange={(e) => setSelectedCustomer(e.target.value)}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">Tüm Müşteriler</option>
                {allCustomers.map((customer) => (
                  <option key={customer.id} value={customer.id}>
                    {customer.name} - {customer.company}
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}

        {/* Statistics Display */}
        {viewMode === 'overall' ? renderOverallStats() : renderCustomerStats()}

        {/* Customer List Display */}
        {viewMode === 'customer' && (
          <div className="mb-8">
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
              <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                      Müşteri Listesi ve Cross-Channel İstekler
                    </h2>
                    <p className="text-gray-600 dark:text-gray-400 mt-1">
                      Tüm müşterilerin cross-channel ve multi-channel isteklerini görüntüleyin
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1 text-sm text-gray-500 dark:text-gray-400">
                      <Users className="w-4 h-4" />
                      {selectedCustomer === 'all' ? allCustomers.length : 1} Müşteri
                    </div>
                  </div>
                </div>
              </div>
              <div className="p-6">
                {renderCustomerList()}
              </div>
            </div>
          </div>
        )}

        {/* Feature Navigation */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          {features.map((feature) => (
            <button
              key={feature.id}
              onClick={() => setActiveFeature(feature.id)}
              className={`p-4 rounded-lg border-2 transition-all duration-200 text-left ${
                activeFeature === feature.id
                  ? getColorClasses(feature.color)
                  : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 hover:border-gray-400 dark:hover:border-gray-500'
              }`}
            >
              <div className="flex items-center gap-3 mb-2">
                {feature.icon}
                <h3 className="font-semibold text-gray-900 dark:text-white">
                  {feature.name}
                </h3>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {feature.description}
              </p>
            </button>
          ))}
        </div>

        {/* Demo Controls */}
        {demoMode === 'interactive' && (
          <div className="mb-6 p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-3">
              İnteraktif Demo Kontrolleri
            </h3>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Konuşma Bağlamı
                </label>
                <textarea
                  value={conversationContext}
                  onChange={(e) => setConversationContext(e.target.value)}
                  className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows={3}
                  placeholder="Konuşma içeriğini buraya yazın..."
                />
              </div>
              
              <div className="flex items-center gap-4">
                <button
                  onClick={() => setConversationContext('Müşteri teknik sorun yaşıyor ve yardım istiyor.')}
                  className="px-3 py-1 bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-300 rounded-lg text-sm hover:bg-blue-200 dark:hover:bg-blue-900/30"
                >
                  Teknik Sorun
                </button>
                <button
                  onClick={() => setConversationContext('Müşteri fiyat ve indirim hakkında bilgi istiyor.')}
                  className="px-3 py-1 bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-300 rounded-lg text-sm hover:bg-green-200 dark:hover:bg-green-900/30"
                >
                  Fiyat Sorgusu
                </button>
                <button
                  onClick={() => setConversationContext('Müşteri çok memnun ve teşekkür ediyor.')}
                  className="px-3 py-1 bg-purple-100 text-purple-700 dark:bg-purple-900/20 dark:text-purple-300 rounded-lg text-sm hover:bg-purple-200 dark:hover:bg-purple-900/30"
                >
                  Memnuniyet
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Feature Display */}
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                  {features.find(f => f.id === activeFeature)?.name}
                </h2>
                <p className="text-gray-600 dark:text-gray-400 mt-1">
                  {features.find(f => f.id === activeFeature)?.description}
                </p>
              </div>
              
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1 text-sm text-gray-500 dark:text-gray-400">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  Demo Modu
                </div>
              </div>
            </div>
          </div>
          
          <div className="p-6">
            {renderFeature()}
          </div>
        </div>

        {/* Feature Information */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Özellik Avantajları
            </h3>
            <ul className="space-y-3">
              <li className="flex items-start gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0"></div>
                <span className="text-gray-700 dark:text-gray-300">
                  Temsilci verimliliğini %40'a kadar artırır
                </span>
              </li>
              <li className="flex items-start gap-2">
                <div className="w-2 h-2 bg-purple-500 rounded-full mt-2 flex-shrink-0"></div>
                <span className="text-gray-700 dark:text-gray-300">
                  Müşteri memnuniyet skorunu yükseltir
                </span>
              </li>
              <li className="flex items-start gap-2">
                <div className="w-2 h-2 bg-orange-500 rounded-full mt-2 flex-shrink-0"></div>
                <span className="text-gray-700 dark:text-gray-300">
                  Yanıt sürelerini kısaltır
                </span>
              </li>
              <li className="flex items-start gap-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                <span className="text-gray-700 dark:text-gray-300">
                  Hata oranlarını azaltır
                </span>
              </li>
            </ul>
          </div>
          
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Teknik Özellikler
            </h3>
            <ul className="space-y-3">
              <li className="flex items-start gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0"></div>
                <span className="text-gray-700 dark:text-gray-300">
                  Otomatik dokümantasyon ve raporlama
                </span>
              </li>
              <li className="flex items-start gap-2">
                <div className="w-2 h-2 bg-purple-500 rounded-full mt-2 flex-shrink-0"></div>
                <span className="text-gray-700 dark:text-gray-300">
                  Çoklu kanal entegrasyonu
                </span>
              </li>
              <li className="flex items-start gap-2">
                <div className="w-2 h-2 bg-orange-500 rounded-full mt-2 flex-shrink-0"></div>
                <span className="text-gray-700 dark:text-gray-300">
                  Cross-channel bağlam analizi
                </span>
              </li>
              <li className="flex items-start gap-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                <span className="text-gray-700 dark:text-gray-300">
                  Gelişmiş müşteri profili
                </span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AgentFeaturesDemo;
