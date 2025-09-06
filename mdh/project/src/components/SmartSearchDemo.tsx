import React, { useState } from 'react';
import SmartSearch from './SmartSearch';
import SearchAnalytics from './SearchAnalytics';
import { Search, BarChart3, Users, FileText, DollarSign } from 'lucide-react';

interface DemoData {
  id: string;
  type: 'ticket' | 'customer' | 'payment' | 'agent';
  title: string;
  description: string;
  status: string;
  priority: string;
  assignedTo: string;
  createdAt: string;
  amount?: number;
  tags: string[];
}

const SmartSearchDemo: React.FC = () => {
  const [currentView, setCurrentView] = useState<'search' | 'analytics'>('search');
  const [searchResults, setSearchResults] = useState<DemoData[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Demo verileri
  const demoData: DemoData[] = [
    {
      id: '1',
      type: 'ticket',
      title: 'Ödeme sistemi çalışmıyor',
      description: 'Müşteri ödeme yaparken sistem hata veriyor. Ödeme işlemi tamamlanamıyor.',
      status: 'open',
      priority: 'high',
      assignedTo: 'Ahmet Yılmaz',
      createdAt: '2024-01-15',
      tags: ['payment', 'system-error', 'urgent']
    },
    {
      id: '2',
      type: 'ticket',
      title: 'Fatura yazdırma sorunu',
      description: 'Fatura PDF olarak yazdırılamıyor. Sistem yanıt vermiyor.',
      status: 'in-progress',
      priority: 'medium',
      assignedTo: 'Fatma Demir',
      createdAt: '2024-01-14',
      tags: ['billing', 'pdf', 'printing']
    },
    {
      id: '3',
      type: 'customer',
      title: 'ABC Şirketi',
      description: 'Kurumsal müşteri, premium paket kullanıyor.',
      status: 'active',
      priority: 'low',
      assignedTo: 'Mehmet Kaya',
      createdAt: '2024-01-10',
      tags: ['corporate', 'premium', 'vip']
    },
    {
      id: '4',
      type: 'payment',
      title: 'Ödeme - 2024-001',
      description: 'ABC Şirketi aylık ödemesi',
      status: 'completed',
      priority: 'medium',
      assignedTo: 'Sistem',
      createdAt: '2024-01-12',
      amount: 2500,
      tags: ['monthly', 'corporate', 'completed']
    },
    {
      id: '5',
      type: 'ticket',
      title: 'Şifre sıfırlama talebi',
      description: 'Müşteri şifresini unutmuş, sıfırlama talep ediyor.',
      status: 'resolved',
      priority: 'low',
      assignedTo: 'Ayşe Özkan',
      createdAt: '2024-01-13',
      tags: ['password', 'reset', 'account']
    },
    {
      id: '6',
      type: 'ticket',
      title: 'Teknik destek - Sistem yavaş',
      description: 'Uygulama çok yavaş çalışıyor, sayfa yüklenmiyor.',
      status: 'open',
      priority: 'high',
      assignedTo: 'Teknik Ekip',
      createdAt: '2024-01-16',
      tags: ['performance', 'slow', 'technical']
    },
    {
      id: '7',
      type: 'customer',
      title: 'XYZ Ltd.',
      description: 'Yeni müşteri, temel paket kullanıyor.',
      status: 'active',
      priority: 'low',
      assignedTo: 'Ali Veli',
      createdAt: '2024-01-11',
      tags: ['new', 'basic', 'startup']
    },
    {
      id: '8',
      type: 'payment',
      title: 'Ödeme - 2024-002',
      description: 'XYZ Ltd. aylık ödemesi',
      status: 'pending',
      priority: 'medium',
      assignedTo: 'Sistem',
      createdAt: '2024-01-15',
      amount: 500,
      tags: ['monthly', 'basic', 'pending']
    },
    {
      id: '9',
      type: 'agent',
      title: 'Ahmet Yılmaz',
      description: 'Senior Destek Temsilcisi, 5 yıl deneyim',
      status: 'active',
      priority: 'low',
      assignedTo: 'HR',
      createdAt: '2023-06-01',
      tags: ['senior', 'support', 'experienced']
    },
    {
      id: '10',
      type: 'ticket',
      title: 'Chat sistemi çalışmıyor',
      description: 'Canlı destek chat sistemi yanıt vermiyor.',
      status: 'closed',
      priority: 'medium',
      assignedTo: 'Teknik Ekip',
      createdAt: '2024-01-09',
      tags: ['chat', 'support', 'system']
    }
  ];

  // Arama fonksiyonu
  const handleSearch = (filters: any) => {
    try {
      setIsLoading(true);
      
      // Filtre doğrulama
      if (!filters || typeof filters !== 'object') {
        console.error('Geçersiz filtre verisi');
        setSearchResults([]);
        setIsLoading(false);
        return;
      }
      
      // Simüle edilmiş arama gecikmesi
      setTimeout(() => {
        try {
          let results = [...demoData];

          // Arama terimi filtresi
          if (filters.searchTerm && typeof filters.searchTerm === 'string') {
            const searchTerm = filters.searchTerm.toLowerCase().trim();
            if (searchTerm) {
              results = results.filter(item => 
                item.title.toLowerCase().includes(searchTerm) ||
                item.description.toLowerCase().includes(searchTerm) ||
                item.assignedTo.toLowerCase().includes(searchTerm) ||
                item.tags.some(tag => tag.toLowerCase().includes(searchTerm))
              );
            }
          }

          // Tip filtresi
          if (filters.searchType && filters.searchType !== 'all') {
            results = results.filter(item => item.type === filters.searchType);
          }

          // Durum filtresi
          if (filters.status && filters.status !== '') {
            results = results.filter(item => item.status === filters.status);
          }

          // Öncelik filtresi
          if (filters.priority && filters.priority !== '') {
            results = results.filter(item => item.priority === filters.priority);
          }

          // Tarih filtresi
          if (filters.dateRange && filters.dateRange.start) {
            try {
              const startDate = new Date(filters.dateRange.start);
              if (!isNaN(startDate.getTime())) {
                results = results.filter(item => 
                  new Date(item.createdAt) >= startDate
                );
              }
            } catch (dateError) {
              console.warn('Başlangıç tarihi geçersiz:', dateError);
            }
          }
          
          if (filters.dateRange && filters.dateRange.end) {
            try {
              const endDate = new Date(filters.dateRange.end);
              if (!isNaN(endDate.getTime())) {
                results = results.filter(item => 
                  new Date(item.createdAt) <= endDate
                );
              }
            } catch (dateError) {
              console.warn('Bitiş tarihi geçersiz:', dateError);
            }
          }

          // Etiket filtresi
          if (filters.tags && Array.isArray(filters.tags) && filters.tags.length > 0) {
            results = results.filter(item => 
              filters.tags.some((tag: string) => item.tags.includes(tag))
            );
          }

          // Atanan kişi filtresi
          if (filters.assignedTo && filters.assignedTo !== '') {
            results = results.filter(item => 
              item.assignedTo === filters.assignedTo
            );
          }

          // Tutar filtresi
          if (filters.amountRange) {
            if (filters.amountRange.min && filters.amountRange.min !== '') {
              const minAmount = parseFloat(filters.amountRange.min);
              if (!isNaN(minAmount)) {
                results = results.filter(item => 
                  item.amount && item.amount >= minAmount
                );
              }
            }
            
            if (filters.amountRange.max && filters.amountRange.max !== '') {
              const maxAmount = parseFloat(filters.amountRange.max);
              if (!isNaN(maxAmount)) {
                results = results.filter(item => 
                  item.amount && item.amount <= maxAmount
                );
              }
            }
          }

          setSearchResults(results);
        } catch (filterError) {
          console.error('Filtreleme sırasında hata:', filterError);
          setSearchResults([]);
        } finally {
          setIsLoading(false);
        }
      }, 500);
    } catch (error) {
      console.error('Arama sırasında hata oluştu:', error);
      setSearchResults([]);
      setIsLoading(false);
    }
  };

  // Filtreleri temizle
  const handleClear = () => {
    setSearchResults([]);
  };

  // Tip ikonu
  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'ticket':
        return <FileText className="w-4 h-4 text-blue-600" />;
      case 'customer':
        return <Users className="w-4 h-4 text-green-600" />;
      case 'payment':
        return <DollarSign className="w-4 h-4 text-yellow-600" />;
      case 'agent':
        return <Users className="w-4 h-4 text-purple-600" />;
      default:
        return <FileText className="w-4 h-4 text-gray-600" />;
    }
  };

  // Durum rengi
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      case 'closed':
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
      case 'in-progress':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'resolved':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'pending':
        return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200';
      case 'active':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'completed':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  // Öncelik rengi
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'low':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'high':
        return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200';
      case 'urgent':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            🔍 Akıllı Arama ve Analitik Demo
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            AI olmadan geliştirilmiş akıllı arama ve gelişmiş analitik özelliklerini test edin
          </p>
        </div>

        {/* Navigation */}
        <div className="mb-6">
          <div className="flex space-x-1 bg-gray-200 dark:bg-gray-700 p-1 rounded-lg w-fit">
            <button
              onClick={() => setCurrentView('search')}
              className={`flex items-center space-x-2 px-4 py-2 rounded-md transition-colors ${
                currentView === 'search'
                  ? 'bg-white dark:bg-gray-800 text-blue-600 dark:text-blue-400 shadow-sm'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              <Search className="w-4 h-4" />
              <span>Akıllı Arama</span>
            </button>
            <button
              onClick={() => setCurrentView('analytics')}
              className={`flex items-center space-x-2 px-4 py-2 rounded-md transition-colors ${
                currentView === 'analytics'
                  ? 'bg-white dark:bg-gray-800 text-blue-600 dark:text-blue-400 shadow-sm'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              <BarChart3 className="w-4 h-4" />
              <span>Arama Analitikleri</span>
            </button>
          </div>
        </div>

        {/* Content */}
        {currentView === 'search' ? (
          <div className="space-y-6">
            {/* Akıllı Arama Bileşeni */}
            <SmartSearch
              onSearch={handleSearch}
              onClear={handleClear}
              searchTypes={['all', 'tickets', 'customers', 'payments', 'agents']}
            />

            {/* Arama Sonuçları */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                  Arama Sonuçları
                </h2>
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  {isLoading ? 'Aranıyor...' : `${searchResults.length} sonuç bulundu`}
                </div>
              </div>

              {isLoading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  <span className="ml-3 text-gray-600 dark:text-gray-400">Aranıyor...</span>
                </div>
              ) : searchResults.length === 0 ? (
                <div className="text-center py-12">
                  <Search className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500 dark:text-gray-400">
                    Arama yapmak için yukarıdaki formu kullanın
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {searchResults.map((item) => (
                    <div
                      key={item.id}
                      className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:shadow-md transition-shadow"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-start space-x-3">
                          {getTypeIcon(item.type)}
                          <div className="flex-1">
                            <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                              {item.title}
                            </h3>
                            <p className="text-gray-600 dark:text-gray-400 mt-1">
                              {item.description}
                            </p>
                            <div className="flex items-center space-x-4 mt-3">
                              <div className="flex items-center space-x-2">
                                <span className="text-sm text-gray-500 dark:text-gray-400">Durum:</span>
                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(item.status)}`}>
                                  {item.status === 'open' ? 'Açık' :
                                   item.status === 'closed' ? 'Kapalı' :
                                   item.status === 'in-progress' ? 'İşlemde' :
                                   item.status === 'resolved' ? 'Çözüldü' :
                                   item.status === 'pending' ? 'Beklemede' :
                                   item.status === 'active' ? 'Aktif' :
                                   item.status === 'completed' ? 'Tamamlandı' : item.status}
                                </span>
                              </div>
                              <div className="flex items-center space-x-2">
                                <span className="text-sm text-gray-500 dark:text-gray-400">Öncelik:</span>
                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(item.priority)}`}>
                                  {item.priority === 'low' ? 'Düşük' :
                                   item.priority === 'medium' ? 'Orta' :
                                   item.priority === 'high' ? 'Yüksek' :
                                   item.priority === 'urgent' ? 'Acil' : item.priority}
                                </span>
                              </div>
                              <div className="flex items-center space-x-2">
                                <span className="text-sm text-gray-500 dark:text-gray-400">Atanan:</span>
                                <span className="text-sm text-gray-900 dark:text-white">{item.assignedTo}</span>
                              </div>
                              {item.amount && (
                                <div className="flex items-center space-x-2">
                                  <span className="text-sm text-gray-500 dark:text-gray-400">Tutar:</span>
                                  <span className="text-sm font-medium text-gray-900 dark:text-white">
                                    ₺{item.amount.toLocaleString()}
                                  </span>
                                </div>
                              )}
                            </div>
                            <div className="flex items-center space-x-2 mt-3">
                              <span className="text-sm text-gray-500 dark:text-gray-400">Etiketler:</span>
                              <div className="flex flex-wrap gap-1">
                                {item.tags.map((tag, index) => (
                                  <span
                                    key={index}
                                    className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded text-xs"
                                  >
                                    #{tag}
                                  </span>
                                ))}
                              </div>
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm text-gray-500 dark:text-gray-400">
                            {new Date(item.createdAt).toLocaleDateString('tr-TR')}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ) : (
          <SearchAnalytics data={demoData} />
        )}

        {/* Özellik Açıklamaları */}
        <div className="mt-8 bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            🚀 Geliştirilen Özellikler
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-3">
                🔍 AI Olmadan Akıllı Arama
              </h3>
              <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                <li>• <strong>Akıllı Öneriler:</strong> Popüler aramalar, benzer terimler, kategori önerileri</li>
                <li>• <strong>Otomatik Filtre Önerileri:</strong> Arama terimine göre akıllı filtre önerileri</li>
                <li>• <strong>Arama Geçmişi:</strong> Son 50 aramayı hatırlama ve önerme</li>
                <li>• <strong>Etiket Sistemi:</strong> Dinamik etiket ekleme ve filtreleme</li>
                <li>• <strong>Çoklu Alan Arama:</strong> Başlık, açıklama, atanan kişi, etiketlerde arama</li>
              </ul>
            </div>
            <div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-3">
                📊 Gelişmiş Analitik Arama
              </h3>
              <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                <li>• <strong>Trend Analizi:</strong> Popüler aramalar ve kullanım trendleri</li>
                <li>• <strong>Performans Metrikleri:</strong> Arama süreleri, başarı oranları</li>
                <li>• <strong>Saatlik Dağılım:</strong> Günün hangi saatlerinde daha çok arama yapıldığı</li>
                <li>• <strong>Kategori İstatistikleri:</strong> Hangi kategorilerde daha çok arama yapıldığı</li>
                <li>• <strong>İyileştirme Önerileri:</strong> Sistem performansı için otomatik öneriler</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SmartSearchDemo;
