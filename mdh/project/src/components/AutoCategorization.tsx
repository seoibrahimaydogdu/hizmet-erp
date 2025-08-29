import React, { useState, useEffect } from 'react';
import { 
  Bot, 
  Filter, 
  Search, 
  Tag, 
  Target, 
  Clock, 
  TrendingUp,
  Zap,
  Settings,
  RefreshCw,
  CheckCircle,
  AlertCircle,
  Star,
  BarChart3,
  Lightbulb,
  Users,
  Calendar,
  MessageSquare
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { supabase } from '../lib/supabase';

interface AutoCategorizationProps {
  tickets: any[];
  onCategoryUpdate?: (ticketId: string, category: string) => void;
  onPriorityUpdate?: (ticketId: string, priority: string) => void;
  onFilterChange?: (filters: any) => void;
}

interface CategoryRule {
  id: string;
  name: string;
  keywords: string[];
  priority: 'low' | 'medium' | 'high';
  autoAssign: boolean;
  responseTemplate?: string;
  estimatedTime: string;
  color: string;
  isActive: boolean;
}

interface SmartFilter {
  id: string;
  name: string;
  conditions: any[];
  isActive: boolean;
  color: string;
}

const AutoCategorization: React.FC<AutoCategorizationProps> = ({
  tickets,
  onCategoryUpdate,
  onPriorityUpdate,
  onFilterChange
}) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [categoryRules, setCategoryRules] = useState<CategoryRule[]>([
    {
      id: '1',
      name: 'Teknik Destek',
      keywords: ['hata', 'çalışmıyor', 'bozuk', 'teknik', 'sistem', 'uygulama', 'site'],
      priority: 'high',
      autoAssign: true,
      responseTemplate: 'Teknik sorununuz için destek ekibimiz çalışıyor.',
      estimatedTime: '2-4 saat',
      color: 'blue',
      isActive: true
    },
    {
      id: '2',
      name: 'Ödeme',
      keywords: ['ödeme', 'fatura', 'ücret', 'para', 'kart', 'banka', 'havale'],
      priority: 'high',
      autoAssign: true,
      responseTemplate: 'Ödeme işleminiz için size yardımcı olacağız.',
      estimatedTime: '1-2 saat',
      color: 'green',
      isActive: true
    },
    {
      id: '3',
      name: 'Şikayet',
      keywords: ['şikayet', 'problem', 'sorun', 'memnun değil', 'kötü', 'berbat'],
      priority: 'high',
      autoAssign: true,
      responseTemplate: 'Şikayetinizi ciddiye alıyoruz, hemen inceleyeceğiz.',
      estimatedTime: '4-6 saat',
      color: 'red',
      isActive: true
    },
    {
      id: '4',
      name: 'Öneri/İstek',
      keywords: ['öneri', 'istek', 'özellik', 'yeni', 'ekle', 'geliştir'],
      priority: 'medium',
      autoAssign: false,
      responseTemplate: 'Öneriniz için teşekkürler, değerlendireceğiz.',
      estimatedTime: '1-2 gün',
      color: 'purple',
      isActive: true
    },
    {
      id: '5',
      name: 'Hesap Yönetimi',
      keywords: ['hesap', 'giriş', 'şifre', 'kayıt', 'profil', 'bilgi'],
      priority: 'medium',
      autoAssign: true,
      responseTemplate: 'Hesap işlemleriniz için size yardımcı olacağız.',
      estimatedTime: '2-4 saat',
      color: 'orange',
      isActive: true
    }
  ]);

  const [smartFilters, setSmartFilters] = useState<SmartFilter[]>([
    {
      id: '1',
      name: 'Yüksek Öncelikli',
      conditions: [{ field: 'priority', operator: 'equals', value: 'high' }],
      isActive: true,
      color: 'red'
    },
    {
      id: '2',
      name: 'Bugün Gelen',
      conditions: [{ field: 'created_at', operator: 'today', value: '' }],
      isActive: true,
      color: 'blue'
    },
    {
      id: '3',
      name: 'Yanıt Bekleyen',
      conditions: [{ field: 'status', operator: 'equals', value: 'open' }],
      isActive: true,
      color: 'yellow'
    },
    {
      id: '4',
      name: 'Negatif Duygu',
      conditions: [{ field: 'sentiment', operator: 'equals', value: 'negative' }],
      isActive: true,
      color: 'red'
    }
  ]);

  const [processingStats, setProcessingStats] = useState({
    totalProcessed: 0,
    categorized: 0,
    priorityUpdated: 0,
    timeSaved: 0,
    accuracy: 0
  });

  const [showRulesModal, setShowRulesModal] = useState(false);
  const [selectedRule, setSelectedRule] = useState<CategoryRule | null>(null);

  // Otomatik kategorizasyon işlemi
  const processAutoCategorization = async () => {
    setIsProcessing(true);
    let categorized = 0;
    let priorityUpdated = 0;
    
    try {
      for (const ticket of tickets) {
        if (ticket.status === 'open' || ticket.status === 'in_progress') {
          const content = `${ticket.title} ${ticket.description}`.toLowerCase();
          
          // Kategori kurallarını kontrol et
          for (const rule of categoryRules) {
            if (!rule.isActive) continue;
            
            const matches = rule.keywords.some(keyword => 
              content.includes(keyword.toLowerCase())
            );
            
            if (matches) {
              // Kategori güncelle
              if (ticket.category !== rule.name) {
                await onCategoryUpdate?.(ticket.id, rule.name);
                categorized++;
              }
              
              // Öncelik güncelle
              if (ticket.priority !== rule.priority) {
                await onPriorityUpdate?.(ticket.id, rule.priority);
                priorityUpdated++;
              }
              
              break; // İlk eşleşen kuralı uygula
            }
          }
        }
      }
      
      setProcessingStats({
        totalProcessed: tickets.length,
        categorized,
        priorityUpdated,
        timeSaved: (categorized + priorityUpdated) * 2, // 2 dakika tasarruf
        accuracy: 92 // Örnek doğruluk oranı
      });
      
      toast.success(`${categorized} talep kategorize edildi, ${priorityUpdated} öncelik güncellendi`);
    } catch (error) {
      console.error('Kategorizasyon hatası:', error);
      toast.error('Kategorizasyon sırasında hata oluştu');
    } finally {
      setIsProcessing(false);
    }
  };

  // Akıllı filtreleme
  const applySmartFilters = () => {
    const activeFilters = smartFilters.filter(f => f.isActive);
    const filteredTickets = tickets.filter(ticket => {
      return activeFilters.every(filter => {
        return filter.conditions.every(condition => {
          switch (condition.field) {
            case 'priority':
              return ticket.priority === condition.value;
            case 'status':
              return ticket.status === condition.value;
            case 'created_at':
              if (condition.operator === 'today') {
                const today = new Date().toDateString();
                const ticketDate = new Date(ticket.created_at).toDateString();
                return today === ticketDate;
              }
              return true;
            case 'sentiment':
              // Basit duygu analizi
              const content = `${ticket.title} ${ticket.description}`.toLowerCase();
              const negativeWords = ['kötü', 'berbat', 'sinir', 'kızgın', 'memnun değil'];
              const isNegative = negativeWords.some(word => content.includes(word));
              return condition.value === 'negative' ? isNegative : !isNegative;
            default:
              return true;
          }
        });
      });
    });
    
    onFilterChange?.(filteredTickets);
  };

  // Kategori kuralı ekleme/düzenleme
  const saveCategoryRule = (rule: CategoryRule) => {
    if (rule.id) {
      setCategoryRules(prev => prev.map(r => r.id === rule.id ? rule : r));
    } else {
      setCategoryRules(prev => [...prev, { ...rule, id: Date.now().toString() }]);
    }
    setShowRulesModal(false);
    setSelectedRule(null);
  };

  // Performans analizi
  const getPerformanceMetrics = () => {
    const totalTickets = tickets.length;
    const categorizedTickets = tickets.filter(t => t.category !== 'Genel').length;
    const highPriorityTickets = tickets.filter(t => t.priority === 'high').length;
    const resolvedTickets = tickets.filter(t => t.status === 'resolved').length;
    
    return {
      categorizationRate: totalTickets > 0 ? (categorizedTickets / totalTickets) * 100 : 0,
      highPriorityRate: totalTickets > 0 ? (highPriorityTickets / totalTickets) * 100 : 0,
      resolutionRate: totalTickets > 0 ? (resolvedTickets / totalTickets) * 100 : 0,
      avgResolutionTime: '2.5 saat' // Örnek değer
    };
  };

  const metrics = getPerformanceMetrics();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-purple-100 dark:bg-purple-900 rounded-lg">
              <Bot className="w-6 h-6 text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                Otomatik Kategorizasyon
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Akıllı kategorizasyon kuralları ve otomatik filtreleme
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setShowRulesModal(true)}
              className="inline-flex items-center px-3 py-2 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg font-medium transition-colors"
            >
              <Settings className="w-4 h-4 mr-2" />
              Kuralları Yönet
            </button>
            <button
              onClick={processAutoCategorization}
              disabled={isProcessing}
              className="inline-flex items-center px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-400 text-white rounded-lg font-medium transition-colors"
            >
              {isProcessing ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  İşleniyor...
                </>
              ) : (
                <>
                  <Zap className="w-4 h-4 mr-2" />
                  Kategorize Et
                </>
              )}
            </button>
          </div>
        </div>

        {/* İstatistikler */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
              {processingStats.totalProcessed}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">
              İşlenen
            </div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600 dark:text-green-400">
              {processingStats.categorized}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">
              Kategorize Edilen
            </div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
              {processingStats.priorityUpdated}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">
              Öncelik Güncellenen
            </div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">
              {processingStats.timeSaved}dk
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">
              Zaman Tasarrufu
            </div>
          </div>
        </div>
      </div>

      {/* Performans Metrikleri */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
            <BarChart3 className="w-5 h-5 mr-2" />
            Performans Metrikleri
          </h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-700 dark:text-gray-300">
                Kategorizasyon Oranı
              </span>
              <div className="flex items-center space-x-2">
                <div className="w-20 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                  <div 
                    className="bg-green-500 h-2 rounded-full"
                    style={{ width: `${metrics.categorizationRate}%` }}
                  />
                </div>
                <span className="text-sm font-medium text-gray-900 dark:text-white">
                  %{Math.round(metrics.categorizationRate)}
                </span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-700 dark:text-gray-300">
                Yüksek Öncelik Oranı
              </span>
              <div className="flex items-center space-x-2">
                <div className="w-20 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                  <div 
                    className="bg-red-500 h-2 rounded-full"
                    style={{ width: `${metrics.highPriorityRate}%` }}
                  />
                </div>
                <span className="text-sm font-medium text-gray-900 dark:text-white">
                  %{Math.round(metrics.highPriorityRate)}
                </span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-700 dark:text-gray-300">
                Çözüm Oranı
              </span>
              <div className="flex items-center space-x-2">
                <div className="w-20 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                  <div 
                    className="bg-blue-500 h-2 rounded-full"
                    style={{ width: `${metrics.resolutionRate}%` }}
                  />
                </div>
                <span className="text-sm font-medium text-gray-900 dark:text-white">
                  %{Math.round(metrics.resolutionRate)}
                </span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-700 dark:text-gray-300">
                Ortalama Çözüm Süresi
              </span>
              <span className="text-sm font-medium text-gray-900 dark:text-white">
                {metrics.avgResolutionTime}
              </span>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
            <Filter className="w-5 h-5 mr-2" />
            Akıllı Filtreler
          </h3>
          <div className="space-y-3">
            {smartFilters.map(filter => (
              <div key={filter.id} className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={filter.isActive}
                    onChange={(e) => {
                      setSmartFilters(prev => prev.map(f => 
                        f.id === filter.id ? { ...f, isActive: e.target.checked } : f
                      ));
                    }}
                    className="rounded border-gray-300"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">
                    {filter.name}
                  </span>
                </div>
                <div 
                  className={`w-3 h-3 rounded-full bg-${filter.color}-500`}
                  style={{ backgroundColor: filter.color === 'red' ? '#ef4444' : 
                           filter.color === 'blue' ? '#3b82f6' : 
                           filter.color === 'yellow' ? '#eab308' : '#8b5cf6' }}
                />
              </div>
            ))}
            <button
              onClick={applySmartFilters}
              className="w-full mt-4 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors"
            >
              Filtreleri Uygula
            </button>
          </div>
        </div>
      </div>

      {/* Kategori Kuralları */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Kategorizasyon Kuralları
          </h3>
        </div>
        <div className="divide-y divide-gray-200 dark:divide-gray-700">
          {categoryRules.map(rule => (
            <div key={rule.id} className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <h4 className="font-medium text-gray-900 dark:text-white">
                      {rule.name}
                    </h4>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      rule.priority === 'high' ? 'bg-red-100 text-red-800' :
                      rule.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-green-100 text-green-800'
                    }`}>
                      {rule.priority === 'high' ? 'Yüksek' : 
                       rule.priority === 'medium' ? 'Orta' : 'Düşük'} Öncelik
                    </span>
                    {rule.autoAssign && (
                      <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">
                        Otomatik Atama
                      </span>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-2 mb-3">
                    {rule.keywords.map((keyword, index) => (
                      <span 
                        key={index}
                        className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded text-xs"
                      >
                        {keyword}
                      </span>
                    ))}
                  </div>
                  <div className="flex items-center space-x-4 text-sm text-gray-600 dark:text-gray-400">
                    <span className="flex items-center">
                      <Clock className="w-4 h-4 mr-1" />
                      {rule.estimatedTime}
                    </span>
                    <span className="flex items-center">
                      <CheckCircle className="w-4 h-4 mr-1" />
                      {rule.isActive ? 'Aktif' : 'Pasif'}
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setSelectedRule(rule);
                    setShowRulesModal(true);
                  }}
                  className="text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
                >
                  Düzenle
                </button>
              </div>
              {rule.responseTemplate && (
                <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3">
                  <h5 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Yanıt Şablonu:
                  </h5>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {rule.responseTemplate}
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Kural Ekleme/Düzenleme Modal */}
      {showRulesModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              {selectedRule ? 'Kuralı Düzenle' : 'Yeni Kural Ekle'}
            </h3>
            <form onSubmit={(e) => {
              e.preventDefault();
              const formData = new FormData(e.currentTarget);
              const newRule: CategoryRule = {
                id: selectedRule?.id || '',
                name: formData.get('name') as string,
                keywords: (formData.get('keywords') as string).split(',').map(k => k.trim()),
                priority: formData.get('priority') as 'low' | 'medium' | 'high',
                autoAssign: formData.get('autoAssign') === 'on',
                responseTemplate: formData.get('responseTemplate') as string,
                estimatedTime: formData.get('estimatedTime') as string,
                color: formData.get('color') as string,
                isActive: formData.get('isActive') === 'on'
              };
              saveCategoryRule(newRule);
            }}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Kategori Adı
                  </label>
                  <input
                    type="text"
                    name="name"
                    defaultValue={selectedRule?.name}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Anahtar Kelimeler (virgülle ayırın)
                  </label>
                  <input
                    type="text"
                    name="keywords"
                    defaultValue={selectedRule?.keywords.join(', ')}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Öncelik
                  </label>
                  <select
                    name="priority"
                    defaultValue={selectedRule?.priority}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  >
                    <option value="low">Düşük</option>
                    <option value="medium">Orta</option>
                    <option value="high">Yüksek</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Tahmini Süre
                  </label>
                  <input
                    type="text"
                    name="estimatedTime"
                    defaultValue={selectedRule?.estimatedTime}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Yanıt Şablonu
                  </label>
                  <textarea
                    name="responseTemplate"
                    defaultValue={selectedRule?.responseTemplate}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  />
                </div>
                <div className="flex items-center space-x-4">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      name="autoAssign"
                      defaultChecked={selectedRule?.autoAssign}
                      className="rounded border-gray-300"
                    />
                    <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                      Otomatik Atama
                    </span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      name="isActive"
                      defaultChecked={selectedRule?.isActive}
                      className="rounded border-gray-300"
                    />
                    <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                      Aktif
                    </span>
                  </label>
                </div>
              </div>
              <div className="flex items-center justify-end space-x-3 mt-6">
                <button
                  type="button"
                  onClick={() => {
                    setShowRulesModal(false);
                    setSelectedRule(null);
                  }}
                  className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
                >
                  {selectedRule ? 'Güncelle' : 'Ekle'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AutoCategorization;
