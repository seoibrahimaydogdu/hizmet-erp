import React, { useState, useEffect } from 'react';
import SmartSearch from './SmartSearch';
import SearchAnalytics from './SearchAnalytics';
import { Search, BarChart3, Settings } from 'lucide-react';

interface SmartSearchIntegrationProps {
  onSearchResults?: (results: any[]) => void;
  className?: string;
}

const SmartSearchIntegration: React.FC<SmartSearchIntegrationProps> = ({
  onSearchResults,
  className = ''
}) => {
  const [currentView, setCurrentView] = useState<'search' | 'analytics' | 'settings'>('search');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [, setIsLoading] = useState(false);
  const [searchConfig, setSearchConfig] = useState({
    enableSmartSuggestions: true,
    enableFilterSuggestions: true,
    enableAnalytics: true,
    maxSuggestions: 8,
    searchTimeout: 300,
    enableCaching: true
  });

  // Arama fonksiyonu - gerçek veri ile entegrasyon için
  const handleSearch = async (filters: any) => {
    setIsLoading(true);
    
    try {
      // Burada gerçek API çağrısı yapılacak
      // Şimdilik simüle edilmiş veri kullanıyoruz
      const results = await performSearch(filters);
      
      setSearchResults(results);
      onSearchResults?.(results);
      
      // Arama geçmişini güncelle
      updateSearchHistory(filters, results.length);
      
    } catch (error) {
      console.error('Arama hatası:', error);
      setSearchResults([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Simüle edilmiş arama fonksiyonu
  const performSearch = async (filters: any): Promise<any[]> => {
    // Gerçek implementasyonda burada Supabase veya başka bir API çağrısı yapılacak
    return new Promise((resolve) => {
      setTimeout(() => {
        // Örnek sonuçlar
        const mockResults = [
          {
            id: '1',
            type: 'ticket',
            title: 'Ödeme sistemi çalışmıyor',
            description: 'Müşteri ödeme yaparken sistem hata veriyor',
            status: 'open',
            priority: 'high',
            createdAt: new Date().toISOString(),
            tags: ['payment', 'system-error']
          }
        ];
        resolve(mockResults);
      }, 500);
    });
  };

  // Arama geçmişini güncelle
  const updateSearchHistory = (_filters: any, resultCount: number) => {
    const searchHistory = JSON.parse(localStorage.getItem('searchHistory') || '[]');
    const newEntry = {
      term: _filters.searchTerm,
      timestamp: new Date(),
      results: resultCount,
      searchTime: Date.now(),
      filters: _filters
    };
    
    searchHistory.push(newEntry);
    
    // Son 100 aramayı sakla
    const recentHistory = searchHistory.slice(-100);
    localStorage.setItem('searchHistory', JSON.stringify(recentHistory));
  };

  // Filtreleri temizle
  const handleClear = () => {
    setSearchResults([]);
    onSearchResults?.([]);
  };

  // Ayarları kaydet
  const handleSaveSettings = () => {
    localStorage.setItem('searchConfig', JSON.stringify(searchConfig));
    // Ayarları gerçek API'ye gönder
    console.log('Ayarlar kaydedildi:', searchConfig);
  };

  // Ayarları yükle
  useEffect(() => {
    const savedConfig = localStorage.getItem('searchConfig');
    if (savedConfig) {
      setSearchConfig(JSON.parse(savedConfig));
    }
  }, []);

  return (
    <div className={`bg-white dark:bg-gray-800 rounded-lg shadow-lg ${className}`}>
      {/* Header */}
      <div className="border-b border-gray-200 dark:border-gray-700 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
              <Search className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                Akıllı Arama Sistemi
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                AI olmadan gelişmiş arama ve analitik özellikleri
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setCurrentView('search')}
              className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                currentView === 'search'
                  ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
            >
              <Search className="w-4 h-4 mr-1 inline" />
              Arama
            </button>
            <button
              onClick={() => setCurrentView('analytics')}
              className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                currentView === 'analytics'
                  ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
            >
              <BarChart3 className="w-4 h-4 mr-1 inline" />
              Analitik
            </button>
            <button
              onClick={() => setCurrentView('settings')}
              className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                currentView === 'settings'
                  ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
            >
              <Settings className="w-4 h-4 mr-1 inline" />
              Ayarlar
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        {currentView === 'search' && (
          <div className="space-y-4">
            <SmartSearch
              onSearch={handleSearch}
              onClear={handleClear}
              searchTypes={['all', 'tickets', 'customers', 'payments', 'agents']}
            />
            
            {/* Arama Sonuçları */}
            {searchResults.length > 0 && (
              <div className="mt-4">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-3">
                  Arama Sonuçları ({searchResults.length})
                </h3>
                <div className="space-y-2">
                  {searchResults.map((result, index) => (
                    <div
                      key={index}
                      className="p-3 border border-gray-200 dark:border-gray-700 rounded-lg hover:shadow-sm transition-shadow"
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <h4 className="font-medium text-gray-900 dark:text-white">
                            {result.title}
                          </h4>
                          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                            {result.description}
                          </p>
                          <div className="flex items-center space-x-4 mt-2">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                              result.status === 'open' ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' :
                              result.status === 'closed' ? 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200' :
                              'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                            }`}>
                              {result.status}
                            </span>
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                              result.priority === 'high' ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' :
                              result.priority === 'medium' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' :
                              'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                            }`}>
                              {result.priority}
                            </span>
                          </div>
                        </div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          {new Date(result.createdAt).toLocaleDateString('tr-TR')}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {currentView === 'analytics' && (
          <SearchAnalytics />
        )}

        {currentView === 'settings' && (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                Arama Ayarları
              </h3>
              
              <div className="space-y-4">
                {/* Akıllı Öneriler */}
                <div className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                  <div>
                    <h4 className="font-medium text-gray-900 dark:text-white">Akıllı Öneriler</h4>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Arama yaparken akıllı öneriler göster
                    </p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={searchConfig.enableSmartSuggestions}
                      onChange={(e) => setSearchConfig(prev => ({
                        ...prev,
                        enableSmartSuggestions: e.target.checked
                      }))}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                  </label>
                </div>

                {/* Filtre Önerileri */}
                <div className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                  <div>
                    <h4 className="font-medium text-gray-900 dark:text-white">Filtre Önerileri</h4>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Arama terimine göre otomatik filtre önerileri
                    </p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={searchConfig.enableFilterSuggestions}
                      onChange={(e) => setSearchConfig(prev => ({
                        ...prev,
                        enableFilterSuggestions: e.target.checked
                      }))}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                  </label>
                </div>

                {/* Analitik */}
                <div className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                  <div>
                    <h4 className="font-medium text-gray-900 dark:text-white">Arama Analitikleri</h4>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Arama istatistikleri ve performans metrikleri
                    </p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={searchConfig.enableAnalytics}
                      onChange={(e) => setSearchConfig(prev => ({
                        ...prev,
                        enableAnalytics: e.target.checked
                      }))}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                  </label>
                </div>

                {/* Önbellekleme */}
                <div className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                  <div>
                    <h4 className="font-medium text-gray-900 dark:text-white">Önbellekleme</h4>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Arama sonuçlarını önbellekte sakla
                    </p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={searchConfig.enableCaching}
                      onChange={(e) => setSearchConfig(prev => ({
                        ...prev,
                        enableCaching: e.target.checked
                      }))}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                  </label>
                </div>

                {/* Maksimum Öneri Sayısı */}
                <div className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Maksimum Öneri Sayısı
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="20"
                    value={searchConfig.maxSuggestions}
                    onChange={(e) => setSearchConfig(prev => ({
                      ...prev,
                      maxSuggestions: parseInt(e.target.value)
                    }))}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  />
                </div>

                {/* Arama Gecikmesi */}
                <div className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Arama Gecikmesi (ms)
                  </label>
                  <input
                    type="number"
                    min="100"
                    max="1000"
                    step="100"
                    value={searchConfig.searchTimeout}
                    onChange={(e) => setSearchConfig(prev => ({
                      ...prev,
                      searchTimeout: parseInt(e.target.value)
                    }))}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  />
                </div>
              </div>

              {/* Kaydet Butonu */}
              <div className="flex justify-end pt-4">
                <button
                  onClick={handleSaveSettings}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
                >
                  Ayarları Kaydet
                </button>
              </div>
            </div>

            {/* Entegrasyon Bilgileri */}
            <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
              <h4 className="font-medium text-gray-900 dark:text-white mb-3">
                🔧 Entegrasyon Bilgileri
              </h4>
              <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                <p>• Bu bileşen mevcut projenize kolayca entegre edilebilir</p>
                <p>• Supabase, REST API veya GraphQL ile çalışabilir</p>
                <p>• Tüm arama verileri localStorage'da saklanır</p>
                <p>• Responsive tasarım ile tüm cihazlarda çalışır</p>
                <p>• Dark mode desteği dahildir</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SmartSearchIntegration;
