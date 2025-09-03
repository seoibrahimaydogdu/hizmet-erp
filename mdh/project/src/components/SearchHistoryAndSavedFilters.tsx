import React, { useState, useEffect } from 'react';
import { History, Bookmark, Star, Clock, Trash2, Save, Search, Filter, X, Plus } from 'lucide-react';

interface SearchHistoryItem {
  id: string;
  query: string;
  filters: any;
  timestamp: Date;
  resultCount: number;
  isFavorite: boolean;
}

interface SavedFilter {
  id: string;
  name: string;
  description?: string;
  filters: any;
  category: string;
  isDefault: boolean;
  usageCount: number;
  lastUsed: Date;
  createdAt: Date;
}

interface SearchHistoryAndSavedFiltersProps {
  onLoadSearch: (query: string, filters: any) => void;
  onSaveFilter: (name: string, description: string, filters: any, category: string) => void;
  className?: string;
}

const SearchHistoryAndSavedFilters: React.FC<SearchHistoryAndSavedFiltersProps> = ({
  onLoadSearch,
  onSaveFilter,
  className = ''
}) => {
  const [activeTab, setActiveTab] = useState<'history' | 'saved'>('history');
  const [searchHistory, setSearchHistory] = useState<SearchHistoryItem[]>([]);
  const [savedFilters, setSavedFilters] = useState<SavedFilter[]>([]);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [saveForm, setSaveForm] = useState({
    name: '',
    description: '',
    category: 'genel'
  });
  const [currentFilters, setCurrentFilters] = useState<any>({});
  const [searchTerm, setSearchTerm] = useState('');

  const categories = [
    { value: 'genel', label: 'Genel', color: 'bg-gray-100 text-gray-800' },
    { value: 'müşteri', label: 'Müşteri', color: 'bg-blue-100 text-blue-800' },
    { value: 'talep', label: 'Talep', color: 'bg-green-100 text-green-800' },
    { value: 'ödeme', label: 'Ödeme', color: 'bg-yellow-100 text-yellow-800' },
    { value: 'rapor', label: 'Rapor', color: 'bg-purple-100 text-purple-800' },
    { value: 'özel', label: 'Özel', color: 'bg-pink-100 text-pink-800' }
  ];

  // LocalStorage'dan verileri yükle
  useEffect(() => {
    const history = JSON.parse(localStorage.getItem('searchHistory') || '[]');
    const saved = JSON.parse(localStorage.getItem('savedFilters') || '[]');
    
    setSearchHistory(history.map((item: any) => ({
      ...item,
      timestamp: new Date(item.timestamp)
    })));
    
    setSavedFilters(saved.map((item: any) => ({
      ...item,
      lastUsed: new Date(item.lastUsed),
      createdAt: new Date(item.createdAt)
    })));
  }, []);

  // Verileri LocalStorage'a kaydet
  const saveToLocalStorage = (key: string, data: any) => {
    localStorage.setItem(key, JSON.stringify(data));
  };

  // Arama geçmişine ekle
  const addToHistory = (query: string, filters: any, resultCount: number) => {
    const newItem: SearchHistoryItem = {
      id: Date.now().toString(),
      query,
      filters,
      timestamp: new Date(),
      resultCount,
      isFavorite: false
    };

    const updatedHistory = [newItem, ...searchHistory.slice(0, 49)]; // Son 50 arama
    setSearchHistory(updatedHistory);
    saveToLocalStorage('searchHistory', updatedHistory);
  };

  // Arama geçmişinden kaldır
  const removeFromHistory = (id: string) => {
    const updatedHistory = searchHistory.filter(item => item.id !== id);
    setSearchHistory(updatedHistory);
    saveToLocalStorage('searchHistory', updatedHistory);
  };

  // Favori olarak işaretle
  const toggleFavorite = (id: string) => {
    const updatedHistory = searchHistory.map(item => 
      item.id === id ? { ...item, isFavorite: !item.isFavorite } : item
    );
    setSearchHistory(updatedHistory);
    saveToLocalStorage('searchHistory', updatedHistory);
  };

  // Kayıtlı filtre ekle
  const handleSaveFilter = () => {
    if (!saveForm.name.trim()) return;

    const newFilter: SavedFilter = {
      id: Date.now().toString(),
      name: saveForm.name,
      description: saveForm.description,
      filters: currentFilters,
      category: saveForm.category,
      isDefault: false,
      usageCount: 0,
      lastUsed: new Date(),
      createdAt: new Date()
    };

    const updatedSaved = [newFilter, ...savedFilters];
    setSavedFilters(updatedSaved);
    saveToLocalStorage('savedFilters', updatedSaved);

    // Formu temizle
    setSaveForm({ name: '', description: '', category: 'genel' });
    setShowSaveModal(false);
  };

  // Kayıtlı filtreyi kaldır
  const removeSavedFilter = (id: string) => {
    const updatedSaved = savedFilters.filter(filter => filter.id !== id);
    setSavedFilters(updatedSaved);
    saveToLocalStorage('savedFilters', updatedSaved);
  };

  // Kayıtlı filtreyi kullan
  const useSavedFilter = (filter: SavedFilter) => {
    // Kullanım sayısını artır
    const updatedSaved = savedFilters.map(f => 
      f.id === filter.id 
        ? { ...f, usageCount: f.usageCount + 1, lastUsed: new Date() }
        : f
    );
    setSavedFilters(updatedSaved);
    saveToLocalStorage('savedFilters', updatedSaved);

    // Filtreyi yükle
    onLoadSearch('', filter.filters);
  };

  // Arama geçmişini kullan
  const useHistoryItem = (item: SearchHistoryItem) => {
    onLoadSearch(item.query, item.filters);
  };

  // Filtrelenmiş veriler
  const filteredHistory = searchHistory.filter(item =>
    item.query.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredSaved = savedFilters.filter(filter =>
    filter.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    filter.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    filter.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatTimeAgo = (date: Date) => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Az önce';
    if (diffMins < 60) return `${diffMins} dakika önce`;
    if (diffHours < 24) return `${diffHours} saat önce`;
    if (diffDays < 7) return `${diffDays} gün önce`;
    return date.toLocaleDateString('tr-TR');
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Başlık ve Tab'lar */}
      <div className="border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            <History size={20} className="text-blue-600" />
            Arama Geçmişi & Kayıtlı Filtreler
          </h3>
          <button
            onClick={() => setShowSaveModal(true)}
            className="px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors flex items-center gap-2 text-sm"
          >
            <Save size={16} />
            Filtre Kaydet
          </button>
        </div>

        <div className="flex space-x-8">
          <button
            onClick={() => setActiveTab('history')}
            className={`pb-2 px-1 border-b-2 font-medium text-sm transition-colors ${
              activeTab === 'history'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <History size={16} className="inline mr-2" />
            Arama Geçmişi ({searchHistory.length})
          </button>
          <button
            onClick={() => setActiveTab('saved')}
            className={`pb-2 px-1 border-b-2 font-medium text-sm transition-colors ${
              activeTab === 'saved'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <Bookmark size={16} className="inline mr-2" />
            Kayıtlı Filtreler ({savedFilters.length})
          </button>
        </div>
      </div>

      {/* Arama Çubuğu */}
      <div className="relative">
        <Search size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder={`${activeTab === 'history' ? 'Arama geçmişinde ara' : 'Kayıtlı filtrelerde ara'}...`}
          className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
        />
      </div>

      {/* Arama Geçmişi Tab'ı */}
      {activeTab === 'history' && (
        <div className="space-y-3">
          {filteredHistory.length === 0 ? (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              <History size={48} className="mx-auto mb-4 opacity-50" />
              <p>Arama geçmişi boş</p>
              <p className="text-sm">Arama yaptığınızda burada görünecek</p>
            </div>
          ) : (
            filteredHistory.map((item) => (
              <div
                key={item.id}
                className="flex items-center gap-3 p-3 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              >
                {/* Favori Butonu */}
                <button
                  onClick={() => toggleFavorite(item.id)}
                  className={`p-2 rounded-lg transition-colors ${
                    item.isFavorite
                      ? 'text-yellow-600 hover:text-yellow-700'
                      : 'text-gray-400 hover:text-gray-600'
                  }`}
                  title={item.isFavorite ? 'Favorilerden çıkar' : 'Favorilere ekle'}
                >
                  <Star size={16} fill={item.isFavorite ? 'currentColor' : 'none'} />
                </button>

                {/* Arama Bilgileri */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium text-gray-900 dark:text-white truncate">
                      {item.query}
                    </span>
                    <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 rounded text-xs">
                      {item.resultCount} sonuç
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                    <Clock size={14} />
                    <span>{formatTimeAgo(item.timestamp)}</span>
                    {Object.keys(item.filters).length > 0 && (
                      <span className="flex items-center gap-1">
                        <Filter size={14} />
                        {Object.keys(item.filters).length} filtre
                      </span>
                    )}
                  </div>
                </div>

                {/* Aksiyon Butonları */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => useHistoryItem(item)}
                    className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 transition-colors"
                  >
                    Kullan
                  </button>
                  <button
                    onClick={() => removeFromHistory(item.id)}
                    className="p-1 text-red-600 hover:text-red-700 rounded transition-colors"
                    title="Geçmişten kaldır"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Kayıtlı Filtreler Tab'ı */}
      {activeTab === 'saved' && (
        <div className="space-y-3">
          {filteredSaved.length === 0 ? (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              <Bookmark size={48} className="mx-auto mb-4 opacity-50" />
              <p>Kayıtlı filtre yok</p>
              <p className="text-sm">Filtre kaydet butonuna tıklayarak kaydedebilirsiniz</p>
            </div>
          ) : (
            filteredSaved.map((filter) => (
              <div
                key={filter.id}
                className="flex items-center gap-3 p-3 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              >
                {/* Kategori Etiketi */}
                <div className={`px-3 py-1 rounded-full text-xs font-medium ${
                  categories.find(c => c.value === filter.category)?.color || 'bg-gray-100 text-gray-800'
                }`}>
                  {categories.find(c => c.value === filter.category)?.label || filter.category}
                </div>

                {/* Filtre Bilgileri */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium text-gray-900 dark:text-white">
                      {filter.name}
                    </span>
                    {filter.isDefault && (
                      <span className="px-2 py-1 bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 rounded text-xs">
                        Varsayılan
                      </span>
                    )}
                  </div>
                  {filter.description && (
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                      {filter.description}
                    </p>
                  )}
                  <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
                    <span>Kullanım: {filter.usageCount}</span>
                    <span>Son kullanım: {formatTimeAgo(filter.lastUsed)}</span>
                    <span>Oluşturulma: {filter.createdAt.toLocaleDateString('tr-TR')}</span>
                  </div>
                </div>

                {/* Aksiyon Butonları */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => useSavedFilter(filter)}
                    className="px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700 transition-colors"
                  >
                    Kullan
                  </button>
                  <button
                    onClick={() => removeSavedFilter(filter.id)}
                    className="p-1 text-red-600 hover:text-red-700 rounded transition-colors"
                    title="Kayıtlı filtreyi kaldır"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Filtre Kaydetme Modal'ı */}
      {showSaveModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Filtre Kaydet
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Filtre Adı *
                </label>
                <input
                  type="text"
                  value={saveForm.name}
                  onChange={(e) => setSaveForm(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Örn: Acil Talepler"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Açıklama
                </label>
                <textarea
                  value={saveForm.description}
                  onChange={(e) => setSaveForm(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Filtrenin ne için kullanıldığını açıklayın..."
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Kategori
                </label>
                <select
                  value={saveForm.category}
                  onChange={(e) => setSaveForm(prev => ({ ...prev, category: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                >
                  {categories.map(category => (
                    <option key={category.value} value={category.value}>
                      {category.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={handleSaveFilter}
                disabled={!saveForm.name.trim()}
                className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Kaydet
              </button>
              <button
                onClick={() => setShowSaveModal(false)}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                İptal
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SearchHistoryAndSavedFilters;
