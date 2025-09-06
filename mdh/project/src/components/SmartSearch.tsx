import React, { useState, useEffect, useMemo } from 'react';
import { Search, Filter, TrendingUp, Clock, Star, Tag, Users, DollarSign, Settings } from 'lucide-react';
import AdvancedSearchFilters from './AdvancedSearchFilters';

interface SearchFilters {
  searchTerm: string;
  searchType: string;
  dateRange: { start: string; end: string };
  status: string;
  priority: string;
  assignedTo: string;
  tags: string[];
  amountRange: { min: string; max: string };
  customFields: Record<string, any>;
}

interface SmartSearchProps {
  onSearch: (filters: SearchFilters) => void;
  onClear: () => void;
  searchTypes?: string[];
  data?: any[];
  className?: string;
}

interface SearchSuggestion {
  text: string;
  type: 'recent' | 'popular' | 'similar' | 'category';
  count?: number;
  icon?: React.ReactNode;
}

interface SearchAnalytics {
  popularSearches: Array<{ term: string; count: number; trend: 'up' | 'down' | 'stable' }>;
  searchHistory: Array<{ term: string; timestamp: Date; results: number }>;
  failedSearches: Array<{ term: string; timestamp: Date; suggestions: string[] }>;
  averageSearchTime: number;
  totalSearches: number;
}

const SmartSearch: React.FC<SmartSearchProps> = ({
  onSearch,
  onClear,
  searchTypes = ['all', 'tickets', 'customers', 'payments', 'agents'],
  className = ''
}) => {
  const [filters, setFilters] = useState<SearchFilters>({
    searchTerm: '',
    searchType: 'all',
    dateRange: { start: '', end: '' },
    status: '',
    priority: '',
    assignedTo: '',
    tags: [],
    amountRange: { min: '', max: '' },
    customFields: {}
  });

  const [showSuggestions, setShowSuggestions] = useState(false);
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [analytics, setAnalytics] = useState<SearchAnalytics>({
    popularSearches: [],
    searchHistory: [],
    failedSearches: [],
    averageSearchTime: 0,
    totalSearches: 0
  });

  // Akıllı arama önerileri oluştur
  const searchSuggestions = useMemo(() => {
    if (!filters.searchTerm || filters.searchTerm.length < 2) return [];

    const suggestions: SearchSuggestion[] = [];
    const searchTerm = filters.searchTerm.toLowerCase();

    // Popüler aramalar
    const popularTerms = [
      { term: 'ödeme sorunu', count: 45, icon: <DollarSign className="w-4 h-4" /> },
      { term: 'teknik destek', count: 32, icon: <Users className="w-4 h-4" /> },
      { term: 'fatura hatası', count: 28, icon: <Tag className="w-4 h-4" /> },
      { term: 'şifre sıfırlama', count: 22, icon: <Star className="w-4 h-4" /> },
      { term: 'sistem yavaş', count: 18, icon: <Clock className="w-4 h-4" /> }
    ];

    // Benzer terimler bul
    const similarTerms = popularTerms.filter(item => 
      item.term.toLowerCase().includes(searchTerm) || 
      searchTerm.includes(item.term.toLowerCase())
    );

    similarTerms.forEach(term => {
      suggestions.push({
        text: term.term,
        type: 'popular',
        count: term.count,
        icon: term.icon
      });
    });

    // Kategori önerileri
    const categories = [
      { name: 'Ödeme', keywords: ['ödeme', 'fatura', 'billing', 'payment'] },
      { name: 'Teknik', keywords: ['teknik', 'sistem', 'hata', 'bug', 'error'] },
      { name: 'Hesap', keywords: ['hesap', 'şifre', 'login', 'account'] },
      { name: 'Destek', keywords: ['destek', 'yardım', 'help', 'support'] }
    ];

    categories.forEach(category => {
      if (category.keywords.some(keyword => searchTerm.includes(keyword))) {
        suggestions.push({
          text: `${category.name} kategorisi`,
          type: 'category',
          icon: <Tag className="w-4 h-4" />
        });
      }
    });

    // Son aramalar
    const recentSearches = analytics.searchHistory
      .filter(item => item.term.toLowerCase().includes(searchTerm))
      .slice(0, 3)
      .map(item => ({
        text: item.term,
        type: 'recent' as const,
        icon: <Clock className="w-4 h-4" />
      }));

    suggestions.push(...recentSearches);

    return suggestions.slice(0, 8);
  }, [filters.searchTerm, analytics.searchHistory]);

  // Akıllı filtre önerileri
  const generateFilterSuggestions = useMemo(() => {
    if (!filters.searchTerm) return {};

    const searchTerm = filters.searchTerm.toLowerCase();
    const suggestions: any = {};

    // Ödeme ile ilgili aramalar için
    if (searchTerm.includes('ödeme') || searchTerm.includes('fatura') || searchTerm.includes('payment')) {
      suggestions.status = 'Açık';
      suggestions.priority = 'Yüksek';
      suggestions.tags = ['payment', 'billing', 'urgent'];
    }

    // Hata ile ilgili aramalar için
    if (searchTerm.includes('hata') || searchTerm.includes('error') || searchTerm.includes('bug')) {
      suggestions.status = 'Açık';
      suggestions.priority = 'Yüksek';
      suggestions.tags = ['bug', 'error', 'technical'];
    }

    // Teknik destek için
    if (searchTerm.includes('teknik') || searchTerm.includes('destek') || searchTerm.includes('support')) {
      suggestions.status = 'İşlemde';
      suggestions.priority = 'Orta';
      suggestions.tags = ['support', 'technical', 'help'];
    }

    return suggestions;
  }, [filters.searchTerm]);

  // Arama geçmişi ve analitik güncelle
  useEffect(() => {
    const searchHistory = JSON.parse(localStorage.getItem('searchHistory') || '[]');
    const popularSearches = JSON.parse(localStorage.getItem('popularSearches') || '[]');
    
    setAnalytics(prev => ({
      ...prev,
      searchHistory: searchHistory.slice(-50), // Son 50 arama
      popularSearches: popularSearches.slice(0, 10) // En popüler 10 arama
    }));
  }, []);

  // Arama yap
  const handleSearch = () => {
    try {
      const startTime = Date.now();
      
      // Arama terimi doğrulama
      if (!filters.searchTerm.trim() && !filters.status && !filters.priority && !filters.assignedTo && filters.tags.length === 0) {
        console.warn('Arama yapmak için en az bir kriter belirtmelisiniz');
        return;
      }
      
      // Arama geçmişine ekle
      try {
        const searchHistory = JSON.parse(localStorage.getItem('searchHistory') || '[]');
        searchHistory.push({
          term: filters.searchTerm,
          timestamp: new Date().toISOString(),
          results: 0 // Gerçek sonuç sayısı burada hesaplanacak
        });
        
        // Son 100 aramayı sakla
        const recentHistory = searchHistory.slice(-100);
        localStorage.setItem('searchHistory', JSON.stringify(recentHistory));
      } catch (storageError) {
        console.warn('Arama geçmişi kaydedilemedi:', storageError);
      }

      // Popüler aramaları güncelle
      try {
        const popularSearches = JSON.parse(localStorage.getItem('popularSearches') || '[]');
        const existingIndex = popularSearches.findIndex((item: any) => item.term === filters.searchTerm);
        
        if (existingIndex >= 0) {
          popularSearches[existingIndex].count++;
        } else if (filters.searchTerm.trim()) {
          popularSearches.push({ term: filters.searchTerm, count: 1, trend: 'stable' });
        }
        
        // Sayıya göre sırala ve ilk 20'yi sakla
        popularSearches.sort((a: any, b: any) => b.count - a.count);
        localStorage.setItem('popularSearches', JSON.stringify(popularSearches.slice(0, 20)));
      } catch (storageError) {
        console.warn('Popüler aramalar kaydedilemedi:', storageError);
      }

      // Arama süresini hesapla
      const searchTime = Date.now() - startTime;
      setAnalytics(prev => ({
        ...prev,
        averageSearchTime: (prev.averageSearchTime + searchTime) / 2,
        totalSearches: prev.totalSearches + 1
      }));

      // Arama fonksiyonunu çağır
      if (onSearch && typeof onSearch === 'function') {
        onSearch(filters);
      } else {
        console.error('onSearch fonksiyonu tanımlanmamış veya geçersiz');
      }
      
      setShowSuggestions(false);
    } catch (error) {
      console.error('Arama sırasında hata oluştu:', error);
      // Kullanıcıya hata mesajı göster (toast veya alert)
      if (typeof window !== 'undefined' && window.alert) {
        window.alert('Arama sırasında bir hata oluştu. Lütfen tekrar deneyin.');
      }
    }
  };

  // Öneri seç
  const handleSuggestionSelect = (suggestion: SearchSuggestion) => {
    setFilters(prev => ({ ...prev, searchTerm: suggestion.text }));
    setShowSuggestions(false);
  };

  // Akıllı filtreleri uygula
  const applySmartFilters = () => {
    const smartFilters = generateFilterSuggestions;
    setFilters(prev => ({
      ...prev,
      ...smartFilters,
      tags: [...prev.tags, ...(smartFilters.tags || [])]
    }));
  };

  // Filtreleri temizle
  const handleClear = () => {
    setFilters({
      searchTerm: '',
      searchType: 'all',
      dateRange: { start: '', end: '' },
      status: '',
      priority: '',
      assignedTo: '',
      tags: [],
      amountRange: { min: '', max: '' },
      customFields: {}
    });
    onClear();
  };

  return (
    <div className={`bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 ${className}`}>
      {/* Ana Arama Çubuğu */}
      <div className="relative mb-4">
        <div className="flex items-center space-x-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              value={filters.searchTerm}
              onChange={(e) => {
                setFilters(prev => ({ ...prev, searchTerm: e.target.value }));
                setShowSuggestions(e.target.value.length >= 2);
              }}
              onFocus={() => setShowSuggestions(filters.searchTerm.length >= 2)}
              placeholder="Akıllı arama yapın... (örn: ödeme sorunu, teknik destek)"
              className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
            />
            
            {/* Akıllı Öneriler */}
            {showSuggestions && searchSuggestions.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg z-50 max-h-64 overflow-y-auto">
                {searchSuggestions.map((suggestion, index) => (
                  <div
                    key={index}
                    onClick={() => handleSuggestionSelect(suggestion)}
                    className="flex items-center justify-between p-3 hover:bg-gray-50 dark:hover:bg-gray-600 cursor-pointer border-b border-gray-100 dark:border-gray-600 last:border-b-0"
                  >
                    <div className="flex items-center space-x-3">
                      {suggestion.icon}
                      <span className="text-gray-900 dark:text-white">{suggestion.text}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      {suggestion.count && (
                        <span className="text-sm text-gray-500 dark:text-gray-400">
                          {suggestion.count} arama
                        </span>
                      )}
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        suggestion.type === 'popular' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' :
                        suggestion.type === 'recent' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' :
                        suggestion.type === 'category' ? 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200' :
                        'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
                      }`}>
                        {suggestion.type === 'popular' ? 'Popüler' :
                         suggestion.type === 'recent' ? 'Son' :
                         suggestion.type === 'category' ? 'Kategori' : 'Benzer'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          
          <button
            onClick={handleSearch}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
          >
            Ara
          </button>
          
          <button
            onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
            className="p-3 text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
            title="Gelişmiş Filtreler"
          >
            <Settings className="w-5 h-5" />
          </button>
          
          <button
            onClick={() => setShowAnalytics(!showAnalytics)}
            className="p-3 text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
            title="Arama Analitikleri"
          >
            <TrendingUp className="w-5 h-5" />
          </button>
        </div>

        {/* Akıllı Filtre Önerileri */}
        {Object.keys(generateFilterSuggestions).length > 0 && (
          <div className="mt-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Filter className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                <span className="text-sm font-medium text-blue-800 dark:text-blue-200">
                  Akıllı Filtre Önerileri:
                </span>
              </div>
              <button
                onClick={applySmartFilters}
                className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-200 font-medium"
              >
                Uygula
              </button>
            </div>
            <div className="mt-2 flex flex-wrap gap-2">
              {generateFilterSuggestions.status && (
                <span className="text-xs bg-blue-100 dark:bg-blue-800 text-blue-800 dark:text-blue-200 px-2 py-1 rounded">
                  Durum: {generateFilterSuggestions.status}
                </span>
              )}
              {generateFilterSuggestions.priority && (
                <span className="text-xs bg-blue-100 dark:bg-blue-800 text-blue-800 dark:text-blue-200 px-2 py-1 rounded">
                  Öncelik: {generateFilterSuggestions.priority}
                </span>
              )}
              {generateFilterSuggestions.tags && generateFilterSuggestions.tags.map((tag: string, index: number) => (
                <span key={index} className="text-xs bg-blue-100 dark:bg-blue-800 text-blue-800 dark:text-blue-200 px-2 py-1 rounded">
                  #{tag}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Arama Analitikleri */}
      {showAnalytics && (
        <div className="mb-4 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Arama Analitikleri</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Popüler Aramalar */}
            <div>
              <h4 className="font-medium text-gray-900 dark:text-white mb-2">Popüler Aramalar</h4>
              <div className="space-y-1">
                {analytics.popularSearches.slice(0, 5).map((search, index) => (
                  <div key={index} className="flex items-center justify-between text-sm">
                    <span className="text-gray-700 dark:text-gray-300">{search.term}</span>
                    <span className="text-gray-500 dark:text-gray-400">{search.count}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Son Aramalar */}
            <div>
              <h4 className="font-medium text-gray-900 dark:text-white mb-2">Son Aramalar</h4>
              <div className="space-y-1">
                {analytics.searchHistory.slice(-5).map((search, index) => (
                  <div key={index} className="flex items-center justify-between text-sm">
                    <span className="text-gray-700 dark:text-gray-300">{search.term}</span>
                    <span className="text-gray-500 dark:text-gray-400">
                      {new Date(search.timestamp).toLocaleDateString('tr-TR')}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* İstatistikler */}
            <div>
              <h4 className="font-medium text-gray-900 dark:text-white mb-2">İstatistikler</h4>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-700 dark:text-gray-300">Toplam Arama:</span>
                  <span className="text-gray-500 dark:text-gray-400">{analytics.totalSearches}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-700 dark:text-gray-300">Ortalama Süre:</span>
                  <span className="text-gray-500 dark:text-gray-400">{analytics.averageSearchTime}ms</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-700 dark:text-gray-300">Başarısız Arama:</span>
                  <span className="text-gray-500 dark:text-gray-400">{analytics.failedSearches.length}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Gelişmiş Filtreler */}
      {showAdvancedFilters && (
        <div className="mb-6">
          <AdvancedSearchFilters
            filters={filters}
            onFiltersChange={setFilters}
            onClear={handleClear}
          />
        </div>
      )}

      {/* Temel Filtreler */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mb-4">
        {/* Arama Tipi */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Arama Tipi
          </label>
          <select
            value={filters.searchType}
            onChange={(e) => setFilters(prev => ({ ...prev, searchType: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
          >
            {searchTypes.map(type => (
              <option key={type} value={type}>
                {type === 'all' ? 'Tümü' : 
                 type === 'tickets' ? 'Talepler' :
                 type === 'customers' ? 'Müşteriler' :
                 type === 'payments' ? 'Ödemeler' :
                 type === 'agents' ? 'Temsilciler' : type}
              </option>
            ))}
          </select>
        </div>

        {/* Durum */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Durum
          </label>
          <select
            value={filters.status}
            onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
          >
            <option value="">Tüm Durumlar</option>
            <option value="open">Açık</option>
            <option value="closed">Kapalı</option>
            <option value="pending">Beklemede</option>
            <option value="in-progress">İşlemde</option>
            <option value="resolved">Çözüldü</option>
            <option value="cancelled">İptal Edildi</option>
            <option value="active">Aktif</option>
            <option value="completed">Tamamlandı</option>
          </select>
        </div>

        {/* Öncelik */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Öncelik
          </label>
          <select
            value={filters.priority}
            onChange={(e) => setFilters(prev => ({ ...prev, priority: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
          >
            <option value="">Tüm Öncelikler</option>
            <option value="low">Düşük</option>
            <option value="medium">Orta</option>
            <option value="high">Yüksek</option>
            <option value="urgent">Acil</option>
          </select>
        </div>

        {/* Atanan Kişi */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Atanan Kişi
          </label>
          <select
            value={filters.assignedTo}
            onChange={(e) => setFilters(prev => ({ ...prev, assignedTo: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
          >
            <option value="">Tüm Kişiler</option>
            <option value="Ahmet Yılmaz">Ahmet Yılmaz</option>
            <option value="Fatma Demir">Fatma Demir</option>
            <option value="Mehmet Kaya">Mehmet Kaya</option>
            <option value="Ayşe Özkan">Ayşe Özkan</option>
            <option value="Teknik Ekip">Teknik Ekip</option>
            <option value="Sistem">Sistem</option>
            <option value="HR">HR</option>
            <option value="Ali Veli">Ali Veli</option>
          </select>
        </div>
      </div>

      {/* Tarih ve Tutar Aralığı */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        {/* Tarih Aralığı */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Tarih Aralığı
          </label>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Başlangıç</label>
              <input
                type="date"
                value={filters.dateRange.start}
                onChange={(e) => setFilters(prev => ({ 
                  ...prev, 
                  dateRange: { ...prev.dateRange, start: e.target.value }
                }))}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Bitiş</label>
              <input
                type="date"
                value={filters.dateRange.end}
                onChange={(e) => setFilters(prev => ({ 
                  ...prev, 
                  dateRange: { ...prev.dateRange, end: e.target.value }
                }))}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
              />
            </div>
          </div>
        </div>

        {/* Tutar Aralığı */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Tutar Aralığı (₺)
          </label>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Minimum</label>
              <input
                type="number"
                value={filters.amountRange.min}
                onChange={(e) => setFilters(prev => ({ 
                  ...prev, 
                  amountRange: { ...prev.amountRange, min: e.target.value }
                }))}
                placeholder="0"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Maksimum</label>
              <input
                type="number"
                value={filters.amountRange.max}
                onChange={(e) => setFilters(prev => ({ 
                  ...prev, 
                  amountRange: { ...prev.amountRange, max: e.target.value }
                }))}
                placeholder="∞"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Etiketler */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Etiketler
        </label>
        <div className="flex flex-wrap gap-2">
          {filters.tags.map((tag, index) => (
            <span
              key={index}
              className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
            >
              #{tag}
              <button
                onClick={() => setFilters(prev => ({
                  ...prev,
                  tags: prev.tags.filter((_, i) => i !== index)
                }))}
                className="ml-2 text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-200"
              >
                ×
              </button>
            </span>
          ))}
          <input
            type="text"
            placeholder="Etiket ekle (Enter)"
            className="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
            onKeyPress={(e) => {
              if (e.key === 'Enter') {
                const value = e.currentTarget.value.trim();
                if (value && !filters.tags.includes(value)) {
                  setFilters(prev => ({ ...prev, tags: [...prev.tags, value] }));
                  e.currentTarget.value = '';
                }
              }
            }}
          />
        </div>
      </div>

      {/* Aksiyon Butonları */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <button
            onClick={handleSearch}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
          >
            <Search className="w-4 h-4 mr-2 inline" />
            Ara
          </button>
          <button
            onClick={handleClear}
            className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors"
          >
            Temizle
          </button>
        </div>
        
        <div className="text-sm text-gray-500 dark:text-gray-400">
          {analytics.totalSearches} toplam arama
        </div>
      </div>
    </div>
  );
};

export default SmartSearch;
