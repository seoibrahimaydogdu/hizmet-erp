import React, { useState, useEffect, useMemo } from 'react';
import { 
  TrendingUp, 
  TrendingDown, 
  BarChart3, 
  PieChart, 
  Clock, 
  Search, 
  Users, 
  Calendar,
  Filter,
  Star,
  AlertCircle,
  CheckCircle,
  XCircle
} from 'lucide-react';

interface SearchAnalyticsData {
  totalSearches: number;
  successfulSearches: number;
  failedSearches: number;
  averageSearchTime: number;
  popularSearches: Array<{
    term: string;
    count: number;
    trend: 'up' | 'down' | 'stable';
    lastUsed: Date;
    successRate: number;
  }>;
  searchHistory: Array<{
    term: string;
    timestamp: Date;
    results: number;
    searchTime: number;
    filters: any;
  }>;
  categoryStats: Array<{
    category: string;
    searches: number;
    successRate: number;
    avgResults: number;
  }>;
  timeStats: Array<{
    hour: number;
    searches: number;
    avgTime: number;
  }>;
  userStats: Array<{
    userId: string;
    searches: number;
    avgTime: number;
    successRate: number;
  }>;
}

interface SearchAnalyticsProps {
  data?: any[];
  className?: string;
}

const SearchAnalytics: React.FC<SearchAnalyticsProps> = ({
  data = [],
  className = ''
}) => {
  const [analytics, setAnalytics] = useState<SearchAnalyticsData>({
    totalSearches: 0,
    successfulSearches: 0,
    failedSearches: 0,
    averageSearchTime: 0,
    popularSearches: [],
    searchHistory: [],
    categoryStats: [],
    timeStats: [],
    userStats: []
  });

  const [selectedPeriod, setSelectedPeriod] = useState<'7d' | '30d' | '90d' | '1y'>('30d');
  const [selectedMetric, setSelectedMetric] = useState<'searches' | 'time' | 'success'>('searches');

  // Analitik verileri hesapla
  const calculateAnalytics = useMemo(() => {
    const searchHistory = JSON.parse(localStorage.getItem('searchHistory') || '[]');
    const popularSearches = JSON.parse(localStorage.getItem('popularSearches') || '[]');
    const failedSearches = JSON.parse(localStorage.getItem('failedSearches') || '[]');

    // Tarih filtresi uygula
    const periodDays = selectedPeriod === '7d' ? 7 : 
                      selectedPeriod === '30d' ? 30 : 
                      selectedPeriod === '90d' ? 90 : 365;
    
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - periodDays);

    const filteredHistory = searchHistory.filter((search: any) => 
      new Date(search.timestamp) >= cutoffDate
    );

    // Temel istatistikler
    const totalSearches = filteredHistory.length;
    const successfulSearches = filteredHistory.filter((s: any) => s.results > 0).length;
    const failedSearchesCount = filteredHistory.filter((s: any) => s.results === 0).length;
    const averageSearchTime = filteredHistory.reduce((acc: number, s: any) => 
      acc + (s.searchTime || 0), 0) / totalSearches || 0;

    // Popüler aramalar
    const searchCounts: Record<string, number> = {};
    filteredHistory.forEach((search: any) => {
      searchCounts[search.term] = (searchCounts[search.term] || 0) + 1;
    });

    const popularSearches = Object.entries(searchCounts)
      .map(([term, count]) => {
        const searches = filteredHistory.filter((s: any) => s.term === term);
        const successRate = searches.filter((s: any) => s.results > 0).length / searches.length * 100;
        
        return {
          term,
          count,
          trend: 'stable' as const, // Basit trend hesaplama
          lastUsed: new Date(Math.max(...searches.map((s: any) => new Date(s.timestamp).getTime()))),
          successRate
        };
      })
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    // Kategori istatistikleri
    const categoryStats = [
      { category: 'Ödeme', searches: 0, successRate: 0, avgResults: 0 },
      { category: 'Teknik', searches: 0, successRate: 0, avgResults: 0 },
      { category: 'Hesap', searches: 0, successRate: 0, avgResults: 0 },
      { category: 'Destek', searches: 0, successRate: 0, avgResults: 0 }
    ];

    // Saatlik istatistikler
    const timeStats = Array.from({ length: 24 }, (_, hour) => ({
      hour,
      searches: 0,
      avgTime: 0
    }));

    filteredHistory.forEach((search: any) => {
      const hour = new Date(search.timestamp).getHours();
      timeStats[hour].searches++;
      timeStats[hour].avgTime += search.searchTime || 0;
    });

    timeStats.forEach(stat => {
      if (stat.searches > 0) {
        stat.avgTime = stat.avgTime / stat.searches;
      }
    });

    return {
      totalSearches,
      successfulSearches,
      failedSearches: failedSearchesCount,
      averageSearchTime,
      popularSearches,
      searchHistory: filteredHistory,
      categoryStats,
      timeStats,
      userStats: []
    };
  }, [selectedPeriod]);

  useEffect(() => {
    setAnalytics(calculateAnalytics);
  }, [calculateAnalytics]);

  // Trend hesaplama
  const calculateTrend = (current: number, previous: number) => {
    if (previous === 0) return 'stable';
    const change = ((current - previous) / previous) * 100;
    if (change > 5) return 'up';
    if (change < -5) return 'down';
    return 'stable';
  };

  // Başarı oranı rengi
  const getSuccessRateColor = (rate: number) => {
    if (rate >= 80) return 'text-green-600 dark:text-green-400';
    if (rate >= 60) return 'text-yellow-600 dark:text-yellow-400';
    return 'text-red-600 dark:text-red-400';
  };

  // Trend ikonu
  const getTrendIcon = (trend: 'up' | 'down' | 'stable') => {
    switch (trend) {
      case 'up':
        return <TrendingUp className="w-4 h-4 text-green-500" />;
      case 'down':
        return <TrendingDown className="w-4 h-4 text-red-500" />;
      default:
        return <div className="w-4 h-4 bg-gray-400 rounded-full" />;
    }
  };

  return (
    <div className={`bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <BarChart3 className="w-6 h-6 text-blue-600 dark:text-blue-400" />
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            Arama Analitikleri
          </h2>
        </div>
        
        <div className="flex items-center space-x-2">
          <select
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(e.target.value as any)}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
          >
            <option value="7d">Son 7 Gün</option>
            <option value="30d">Son 30 Gün</option>
            <option value="90d">Son 90 Gün</option>
            <option value="1y">Son 1 Yıl</option>
          </select>
        </div>
      </div>

      {/* Özet Kartları */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {/* Toplam Arama */}
        <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-blue-600 dark:text-blue-400">Toplam Arama</p>
              <p className="text-2xl font-bold text-blue-900 dark:text-blue-100">
                {analytics.totalSearches.toLocaleString()}
              </p>
            </div>
            <Search className="w-8 h-8 text-blue-600 dark:text-blue-400" />
          </div>
        </div>

        {/* Başarılı Arama */}
        <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg border border-green-200 dark:border-green-800">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-green-600 dark:text-green-400">Başarılı Arama</p>
              <p className="text-2xl font-bold text-green-900 dark:text-green-100">
                {analytics.successfulSearches.toLocaleString()}
              </p>
              <p className="text-xs text-green-600 dark:text-green-400">
                %{((analytics.successfulSearches / analytics.totalSearches) * 100).toFixed(1)}
              </p>
            </div>
            <CheckCircle className="w-8 h-8 text-green-600 dark:text-green-400" />
          </div>
        </div>

        {/* Başarısız Arama */}
        <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-lg border border-red-200 dark:border-red-800">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-red-600 dark:text-red-400">Başarısız Arama</p>
              <p className="text-2xl font-bold text-red-900 dark:text-red-100">
                {analytics.failedSearches.toLocaleString()}
              </p>
              <p className="text-xs text-red-600 dark:text-red-400">
                %{((analytics.failedSearches / analytics.totalSearches) * 100).toFixed(1)}
              </p>
            </div>
            <XCircle className="w-8 h-8 text-red-600 dark:text-red-400" />
          </div>
        </div>

        {/* Ortalama Süre */}
        <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg border border-purple-200 dark:border-purple-800">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-purple-600 dark:text-purple-400">Ortalama Süre</p>
              <p className="text-2xl font-bold text-purple-900 dark:text-purple-100">
                {analytics.averageSearchTime.toFixed(0)}ms
              </p>
            </div>
            <Clock className="w-8 h-8 text-purple-600 dark:text-purple-400" />
          </div>
        </div>
      </div>

      {/* Grafikler ve Detaylar */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Popüler Aramalar */}
        <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            En Popüler Aramalar
          </h3>
          <div className="space-y-3">
            {analytics.popularSearches.slice(0, 8).map((search, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-white dark:bg-gray-800 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="flex items-center justify-center w-8 h-8 bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400 rounded-full text-sm font-medium">
                    {index + 1}
                  </div>
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">{search.term}</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {search.count} arama • Son: {search.lastUsed.toLocaleDateString('tr-TR')}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  {getTrendIcon(search.trend)}
                  <span className={`text-sm font-medium ${getSuccessRateColor(search.successRate)}`}>
                    %{search.successRate.toFixed(1)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Saatlik Dağılım */}
        <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Saatlik Arama Dağılımı
          </h3>
          <div className="space-y-2">
            {analytics.timeStats
              .filter(stat => stat.searches > 0)
              .sort((a, b) => b.searches - a.searches)
              .slice(0, 8)
              .map((stat, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 text-sm text-gray-600 dark:text-gray-400">
                      {stat.hour.toString().padStart(2, '0')}:00
                    </div>
                    <div className="flex-1 bg-gray-200 dark:bg-gray-600 rounded-full h-2">
                      <div 
                        className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                        style={{ 
                          width: `${(stat.searches / Math.max(...analytics.timeStats.map(s => s.searches))) * 100}%` 
                        }}
                      />
                    </div>
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400 w-16 text-right">
                    {stat.searches} arama
                  </div>
                </div>
              ))}
          </div>
        </div>
      </div>

      {/* Detaylı İstatistikler */}
      <div className="mt-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Arama Geçmişi */}
        <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Son Aramalar
          </h3>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {analytics.searchHistory.slice(-10).reverse().map((search, index) => (
              <div key={index} className="flex items-center justify-between p-2 bg-white dark:bg-gray-800 rounded">
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">{search.term}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {new Date(search.timestamp).toLocaleString('tr-TR')}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {search.results} sonuç
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {search.searchTime}ms
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Kategori İstatistikleri */}
        <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Kategori Dağılımı
          </h3>
          <div className="space-y-3">
            {analytics.categoryStats.map((category, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-white dark:bg-gray-800 rounded-lg">
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">{category.category}</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {category.searches} arama
                  </p>
                </div>
                <div className="text-right">
                  <p className={`text-sm font-medium ${getSuccessRateColor(category.successRate)}`}>
                    %{category.successRate.toFixed(1)}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {category.avgResults.toFixed(1)} ortalama
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Performans Metrikleri */}
        <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Performans Metrikleri
          </h3>
          <div className="space-y-4">
            {/* Başarı Oranı */}
            <div className="p-3 bg-white dark:bg-gray-800 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-900 dark:text-white">Başarı Oranı</span>
                <span className={`text-sm font-bold ${getSuccessRateColor((analytics.successfulSearches / analytics.totalSearches) * 100)}`}>
                  %{((analytics.successfulSearches / analytics.totalSearches) * 100).toFixed(1)}
                </span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2">
                <div 
                  className="bg-green-600 h-2 rounded-full transition-all duration-300"
                  style={{ 
                    width: `${(analytics.successfulSearches / analytics.totalSearches) * 100}%` 
                  }}
                />
              </div>
            </div>

            {/* Ortalama Sonuç Sayısı */}
            <div className="p-3 bg-white dark:bg-gray-800 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-900 dark:text-white">Ortalama Sonuç</span>
                <span className="text-sm font-bold text-blue-600 dark:text-blue-400">
                  {(analytics.searchHistory.reduce((acc, s) => acc + s.results, 0) / analytics.searchHistory.length || 0).toFixed(1)}
                </span>
              </div>
            </div>

            {/* En Hızlı Arama */}
            <div className="p-3 bg-white dark:bg-gray-800 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-900 dark:text-white">En Hızlı Arama</span>
                <span className="text-sm font-bold text-green-600 dark:text-green-400">
                  {Math.min(...analytics.searchHistory.map(s => s.searchTime || 0))}ms
                </span>
              </div>
            </div>

            {/* En Yavaş Arama */}
            <div className="p-3 bg-white dark:bg-gray-800 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-900 dark:text-white">En Yavaş Arama</span>
                <span className="text-sm font-bold text-red-600 dark:text-red-400">
                  {Math.max(...analytics.searchHistory.map(s => s.searchTime || 0))}ms
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Öneriler */}
      <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
        <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-100 mb-3">
          💡 İyileştirme Önerileri
        </h3>
        <div className="space-y-2 text-sm text-blue-800 dark:text-blue-200">
          {analytics.failedSearches > analytics.totalSearches * 0.3 && (
            <p>• Başarısız arama oranı yüksek. Arama önerilerini geliştirin.</p>
          )}
          {analytics.averageSearchTime > 1000 && (
            <p>• Arama süreleri yavaş. Veritabanı indekslerini optimize edin.</p>
          )}
          {analytics.popularSearches.length > 0 && (
            <p>• En popüler aramalar için hızlı erişim butonları ekleyin.</p>
          )}
          <p>• Kullanıcı davranışlarını analiz ederek arama deneyimini iyileştirin.</p>
        </div>
      </div>
    </div>
  );
};

export default SearchAnalytics;
