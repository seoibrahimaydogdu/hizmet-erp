import React, { useState } from 'react';
import AdvancedSearch, { SearchFilters } from './AdvancedSearch';

const AdvancedSearchDemo: React.FC = () => {
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [currentFilters, setCurrentFilters] = useState<SearchFilters | null>(null);

  const handleSearch = (filters: SearchFilters) => {
    setCurrentFilters(filters);
    
    // Demo verileri
    const demoData = [
      {
        id: '1',
        type: 'ticket',
        title: 'Sistem Hatası',
        subtitle: 'Kullanıcı girişi yapılamıyor',
        description: 'Kullanıcılar sisteme giriş yaparken hata alıyor',
        status: 'open',
        priority: 'high',
        assignedTo: 'Ayşe Demir',
        createdAt: '2024-01-15',
        amount: 1500
      },
      {
        id: '2',
        type: 'customer',
        title: 'ABC Şirketi',
        subtitle: 'info@abc.com',
        description: 'Premium müşteri - 5 yıllık üyelik',
        status: 'active',
        plan: 'premium',
        createdAt: '2023-06-20',
        amount: 5000
      },
      {
        id: '3',
        type: 'payment',
        title: 'Fatura #INV-001',
        subtitle: 'ABC Şirketi',
        description: 'Aylık abonelik ödemesi',
        status: 'paid',
        amount: 2500,
        createdAt: '2024-01-10'
      }
    ];

    // Filtreleme işlemi
    const filtered = demoData.filter(item => {
      // Arama terimi kontrolü
      if (filters.searchTerm && !item.title.toLowerCase().includes(filters.searchTerm.toLowerCase()) &&
          !item.subtitle.toLowerCase().includes(filters.searchTerm.toLowerCase()) &&
          !item.description.toLowerCase().includes(filters.searchTerm.toLowerCase())) {
        return false;
      }

      // Tip kontrolü
      if (filters.searchType !== 'all' && item.type !== filters.searchType) {
        return false;
      }

      // Durum kontrolü
      if (filters.status && item.status !== filters.status) {
        return false;
      }

      // Öncelik kontrolü
      if (filters.priority && item.priority !== filters.priority) {
        return false;
      }

      // Atanan kişi kontrolü
      if (filters.assignedTo && item.assignedTo && 
          !item.assignedTo.toLowerCase().includes(filters.assignedTo.toLowerCase())) {
        return false;
      }

      // Tarih aralığı kontrolü
      if (filters.dateRange.start && item.createdAt < filters.dateRange.start) {
        return false;
      }
      if (filters.dateRange.end && item.createdAt > filters.dateRange.end) {
        return false;
      }

      // Tutar aralığı kontrolü
      if (filters.amountRange.min !== '' && item.amount < filters.amountRange.min) {
        return false;
      }
      if (filters.amountRange.max !== '' && item.amount > filters.amountRange.max) {
        return false;
      }

      // Etiket kontrolü
      if (filters.tags.length > 0) {
        const itemText = `${item.title} ${item.subtitle} ${item.description}`.toLowerCase();
        const hasMatchingTag = filters.tags.some(tag => 
          itemText.includes(tag.toLowerCase())
        );
        if (!hasMatchingTag) {
          return false;
        }
      }

      return true;
    });

    setSearchResults(filtered);
  };

  const handleClear = () => {
    setSearchResults([]);
    setCurrentFilters(null);
  };

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          Gelişmiş Arama Demo
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Admin Panel için gelişmiş arama ve filtreleme özelliği
        </p>
      </div>

      <AdvancedSearch
        onSearch={handleSearch}
        onClear={handleClear}
        searchTypes={['all', 'tickets', 'customers', 'payments']}
      />

      {/* Sonuçlar */}
      {currentFilters && (
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Arama Sonuçları ({searchResults.length})
          </h2>
          
          {searchResults.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500 dark:text-gray-400">
                Arama kriterlerinize uygun sonuç bulunamadı
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {searchResults.map((item, index) => (
                <div
                  key={item.id}
                  className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          item.type === 'ticket' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' :
                          item.type === 'customer' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' :
                          'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200'
                        }`}>
                          {item.type === 'ticket' ? 'Talep' : 
                           item.type === 'customer' ? 'Müşteri' : 'Ödeme'}
                        </span>
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          item.status === 'open' || item.status === 'active' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' :
                          item.status === 'closed' || item.status === 'paid' ? 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200' :
                          'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                        }`}>
                          {item.status === 'open' ? 'Açık' :
                           item.status === 'closed' ? 'Kapalı' :
                           item.status === 'active' ? 'Aktif' :
                           item.status === 'paid' ? 'Ödendi' : item.status}
                        </span>
                        {item.priority && (
                          <span className={`px-2 py-1 text-xs rounded-full ${
                            item.priority === 'high' ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' :
                            item.priority === 'medium' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' :
                            'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                          }`}>
                            {item.priority === 'high' ? 'Yüksek' :
                             item.priority === 'medium' ? 'Orta' : 'Düşük'}
                          </span>
                        )}
                      </div>
                      <h3 className="font-medium text-gray-900 dark:text-white">
                        {item.title}
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {item.subtitle}
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-500 mt-1">
                        {item.description}
                      </p>
                      {item.assignedTo && (
                        <p className="text-sm text-gray-500 dark:text-gray-500 mt-1">
                          Atanan: {item.assignedTo}
                        </p>
                      )}
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {item.createdAt}
                      </p>
                      {item.amount && (
                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                          ₺{item.amount.toLocaleString()}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Özellikler */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
            🔍 Gelişmiş Arama
          </h3>
          <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
            <li>• Çoklu alan arama</li>
            <li>• Tip bazlı filtreleme</li>
            <li>• Tarih aralığı seçimi</li>
            <li>• Durum ve öncelik filtreleri</li>
          </ul>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
            🏷️ Etiket Sistemi
          </h3>
          <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
            <li>• Dinamik etiket ekleme</li>
            <li>• Etiket bazlı filtreleme</li>
            <li>• Kolay etiket kaldırma</li>
            <li>• Görsel etiket gösterimi</li>
          </ul>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
            📊 Filtre Özeti
          </h3>
          <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
            <li>• Aktif filtrelerin görünümü</li>
            <li>• Tek tıkla temizleme</li>
            <li>• Filtre sayısı gösterimi</li>
            <li>• Responsive tasarım</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default AdvancedSearchDemo;
