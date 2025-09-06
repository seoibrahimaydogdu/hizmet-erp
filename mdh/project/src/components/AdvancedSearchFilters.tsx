import React, { useState, useEffect } from 'react';
import { Filter, X, Plus, Calendar, DollarSign, User, Tag, ChevronDown, ChevronUp } from 'lucide-react';

interface AdvancedSearchFiltersProps {
  filters: any;
  onFiltersChange: (filters: any) => void;
  onClear: () => void;
  className?: string;
}

const AdvancedSearchFilters: React.FC<AdvancedSearchFiltersProps> = ({
  filters,
  onFiltersChange,
  onClear,
  className = ''
}) => {
  const [expandedSections, setExpandedSections] = useState({
    basic: true,
    date: false,
    amount: false,
    tags: false,
    custom: false
  });

  const [customFilters, setCustomFilters] = useState<Array<{
    id: string;
    field: string;
    operator: string;
    value: string;
  }>>([]);

  // Filtre değişikliklerini yönet
  const updateFilter = (key: string, value: any) => {
    onFiltersChange({
      ...filters,
      [key]: value
    });
  };

  // Özel filtre ekle
  const addCustomFilter = () => {
    const newFilter = {
      id: Date.now().toString(),
      field: 'title',
      operator: 'contains',
      value: ''
    };
    setCustomFilters([...customFilters, newFilter]);
  };

  // Özel filtre kaldır
  const removeCustomFilter = (id: string) => {
    setCustomFilters(customFilters.filter(f => f.id !== id));
  };

  // Özel filtre güncelle
  const updateCustomFilter = (id: string, field: string, value: string) => {
    setCustomFilters(customFilters.map(f => 
      f.id === id ? { ...f, [field]: value } : f
    ));
  };

  // Bölüm genişletme/daraltma
  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  // Hızlı filtreler
  const quickFilters = [
    { label: 'Bugün', dateRange: { start: new Date().toISOString().split('T')[0], end: new Date().toISOString().split('T')[0] } },
    { label: 'Bu Hafta', dateRange: { start: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], end: new Date().toISOString().split('T')[0] } },
    { label: 'Bu Ay', dateRange: { start: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0], end: new Date().toISOString().split('T')[0] } },
    { label: 'Son 30 Gün', dateRange: { start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], end: new Date().toISOString().split('T')[0] } }
  ];

  // Hızlı filtre uygula
  const applyQuickFilter = (dateRange: any) => {
    updateFilter('dateRange', dateRange);
  };

  // Aktif filtre sayısı
  const activeFiltersCount = Object.values(filters).filter(value => {
    if (Array.isArray(value)) return value.length > 0;
    if (typeof value === 'object' && value !== null) {
      return Object.values(value).some(v => v !== '');
    }
    return value !== '' && value !== null && value !== undefined;
  }).length;

  return (
    <div className={`bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <Filter className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Gelişmiş Filtreler
          </h3>
          {activeFiltersCount > 0 && (
            <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded-full text-xs font-medium">
              {activeFiltersCount} aktif
            </span>
          )}
        </div>
        <button
          onClick={onClear}
          className="flex items-center space-x-1 px-3 py-1 text-sm text-gray-600 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-colors"
        >
          <X className="w-4 h-4" />
          <span>Temizle</span>
        </button>
      </div>

      {/* Hızlı Filtreler */}
      <div className="mb-6">
        <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Hızlı Filtreler</h4>
        <div className="flex flex-wrap gap-2">
          {quickFilters.map((filter, index) => (
            <button
              key={index}
              onClick={() => applyQuickFilter(filter.dateRange)}
              className="px-3 py-1 text-sm bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-full hover:bg-blue-100 dark:hover:bg-blue-900 hover:text-blue-700 dark:hover:text-blue-300 transition-colors"
            >
              {filter.label}
            </button>
          ))}
        </div>
      </div>

      {/* Temel Filtreler */}
      <div className="mb-6">
        <button
          onClick={() => toggleSection('basic')}
          className="flex items-center justify-between w-full p-3 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
        >
          <div className="flex items-center space-x-2">
            <Filter className="w-4 h-4 text-gray-600 dark:text-gray-400" />
            <span className="font-medium text-gray-900 dark:text-white">Temel Filtreler</span>
          </div>
          {expandedSections.basic ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>
        
        {expandedSections.basic && (
          <div className="mt-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Durum */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Durum
              </label>
              <select
                value={filters.status || ''}
                onChange={(e) => updateFilter('status', e.target.value)}
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
                value={filters.priority || ''}
                onChange={(e) => updateFilter('priority', e.target.value)}
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
                value={filters.assignedTo || ''}
                onChange={(e) => updateFilter('assignedTo', e.target.value)}
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
        )}
      </div>

      {/* Tarih Filtreleri */}
      <div className="mb-6">
        <button
          onClick={() => toggleSection('date')}
          className="flex items-center justify-between w-full p-3 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
        >
          <div className="flex items-center space-x-2">
            <Calendar className="w-4 h-4 text-gray-600 dark:text-gray-400" />
            <span className="font-medium text-gray-900 dark:text-white">Tarih Filtreleri</span>
          </div>
          {expandedSections.date ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>
        
        {expandedSections.date && (
          <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Başlangıç Tarihi
              </label>
              <input
                type="date"
                value={filters.dateRange?.start || ''}
                onChange={(e) => updateFilter('dateRange', { 
                  ...filters.dateRange, 
                  start: e.target.value 
                })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Bitiş Tarihi
              </label>
              <input
                type="date"
                value={filters.dateRange?.end || ''}
                onChange={(e) => updateFilter('dateRange', { 
                  ...filters.dateRange, 
                  end: e.target.value 
                })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
              />
            </div>
          </div>
        )}
      </div>

      {/* Tutar Filtreleri */}
      <div className="mb-6">
        <button
          onClick={() => toggleSection('amount')}
          className="flex items-center justify-between w-full p-3 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
        >
          <div className="flex items-center space-x-2">
            <DollarSign className="w-4 h-4 text-gray-600 dark:text-gray-400" />
            <span className="font-medium text-gray-900 dark:text-white">Tutar Filtreleri</span>
          </div>
          {expandedSections.amount ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>
        
        {expandedSections.amount && (
          <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Minimum Tutar (₺)
              </label>
              <input
                type="number"
                value={filters.amountRange?.min || ''}
                onChange={(e) => updateFilter('amountRange', { 
                  ...filters.amountRange, 
                  min: e.target.value 
                })}
                placeholder="0"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Maksimum Tutar (₺)
              </label>
              <input
                type="number"
                value={filters.amountRange?.max || ''}
                onChange={(e) => updateFilter('amountRange', { 
                  ...filters.amountRange, 
                  max: e.target.value 
                })}
                placeholder="∞"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
              />
            </div>
          </div>
        )}
      </div>

      {/* Etiket Filtreleri */}
      <div className="mb-6">
        <button
          onClick={() => toggleSection('tags')}
          className="flex items-center justify-between w-full p-3 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
        >
          <div className="flex items-center space-x-2">
            <Tag className="w-4 h-4 text-gray-600 dark:text-gray-400" />
            <span className="font-medium text-gray-900 dark:text-white">Etiket Filtreleri</span>
          </div>
          {expandedSections.tags ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>
        
        {expandedSections.tags && (
          <div className="mt-4">
            <div className="flex flex-wrap gap-2 mb-3">
              {filters.tags?.map((tag: string, index: number) => (
                <span
                  key={index}
                  className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
                >
                  #{tag}
                  <button
                    onClick={() => {
                      const newTags = filters.tags.filter((_: any, i: number) => i !== index);
                      updateFilter('tags', newTags);
                    }}
                    className="ml-2 text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-200"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
            <input
              type="text"
              placeholder="Etiket ekle (Enter)"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  const value = e.currentTarget.value.trim();
                  if (value && !filters.tags?.includes(value)) {
                    updateFilter('tags', [...(filters.tags || []), value]);
                    e.currentTarget.value = '';
                  }
                }
              }}
            />
          </div>
        )}
      </div>

      {/* Özel Filtreler */}
      <div className="mb-6">
        <button
          onClick={() => toggleSection('custom')}
          className="flex items-center justify-between w-full p-3 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
        >
          <div className="flex items-center space-x-2">
            <Plus className="w-4 h-4 text-gray-600 dark:text-gray-400" />
            <span className="font-medium text-gray-900 dark:text-white">Özel Filtreler</span>
          </div>
          {expandedSections.custom ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>
        
        {expandedSections.custom && (
          <div className="mt-4 space-y-3">
            {customFilters.map((filter) => (
              <div key={filter.id} className="flex items-center space-x-2 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <select
                  value={filter.field}
                  onChange={(e) => updateCustomFilter(filter.id, 'field', e.target.value)}
                  className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                >
                  <option value="title">Başlık</option>
                  <option value="description">Açıklama</option>
                  <option value="assignedTo">Atanan Kişi</option>
                  <option value="createdAt">Oluşturma Tarihi</option>
                </select>
                <select
                  value={filter.operator}
                  onChange={(e) => updateCustomFilter(filter.id, 'operator', e.target.value)}
                  className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                >
                  <option value="contains">İçerir</option>
                  <option value="equals">Eşittir</option>
                  <option value="startsWith">İle Başlar</option>
                  <option value="endsWith">İle Biter</option>
                </select>
                <input
                  type="text"
                  value={filter.value}
                  onChange={(e) => updateCustomFilter(filter.id, 'value', e.target.value)}
                  placeholder="Değer"
                  className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                />
                <button
                  onClick={() => removeCustomFilter(filter.id)}
                  className="p-2 text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-200"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}
            <button
              onClick={addCustomFilter}
              className="w-full p-3 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg text-gray-600 dark:text-gray-400 hover:border-blue-500 dark:hover:border-blue-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
            >
              <Plus className="w-4 h-4 mx-auto mb-1" />
              Özel Filtre Ekle
            </button>
          </div>
        )}
      </div>

      {/* Filtre Özeti */}
      {activeFiltersCount > 0 && (
        <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
          <h4 className="text-sm font-medium text-blue-900 dark:text-blue-100 mb-2">
            Aktif Filtreler ({activeFiltersCount})
          </h4>
          <div className="flex flex-wrap gap-2">
            {filters.status && (
              <span className="px-2 py-1 bg-blue-100 dark:bg-blue-800 text-blue-800 dark:text-blue-200 rounded text-xs">
                Durum: {filters.status}
              </span>
            )}
            {filters.priority && (
              <span className="px-2 py-1 bg-blue-100 dark:bg-blue-800 text-blue-800 dark:text-blue-200 rounded text-xs">
                Öncelik: {filters.priority}
              </span>
            )}
            {filters.assignedTo && (
              <span className="px-2 py-1 bg-blue-100 dark:bg-blue-800 text-blue-800 dark:text-blue-200 rounded text-xs">
                Atanan: {filters.assignedTo}
              </span>
            )}
            {filters.dateRange?.start && (
              <span className="px-2 py-1 bg-blue-100 dark:bg-blue-800 text-blue-800 dark:text-blue-200 rounded text-xs">
                Tarih: {filters.dateRange.start} - {filters.dateRange.end || '∞'}
              </span>
            )}
            {filters.amountRange?.min && (
              <span className="px-2 py-1 bg-blue-100 dark:bg-blue-800 text-blue-800 dark:text-blue-200 rounded text-xs">
                Tutar: ₺{filters.amountRange.min} - {filters.amountRange.max || '∞'}
              </span>
            )}
            {filters.tags?.map((tag: string, index: number) => (
              <span key={index} className="px-2 py-1 bg-blue-100 dark:bg-blue-800 text-blue-800 dark:text-blue-200 rounded text-xs">
                #{tag}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default AdvancedSearchFilters;
