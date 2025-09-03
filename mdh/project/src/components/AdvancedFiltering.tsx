import React, { useState } from 'react';
import { Filter, Plus, X, ChevronDown, ChevronRight, Layers, Sliders, Eye, EyeOff } from 'lucide-react';

interface FilterOption {
  id: string;
  label: string;
  value: string;
  count: number;
  isSelected: boolean;
  children?: FilterOption[];
}

interface FilterGroup {
  id: string;
  name: string;
  type: 'single' | 'multiple' | 'range' | 'hierarchy' | 'custom';
  options: FilterOption[];
  isExpanded: boolean;
  isVisible: boolean;
  order: number;
}

interface AdvancedFilteringProps {
  onFiltersChange: (filters: any) => void;
  onClearAll: () => void;
  className?: string;
}

const AdvancedFiltering: React.FC<AdvancedFilteringProps> = ({
  onFiltersChange,
  onClearAll,
  className = ''
}) => {
  const [filterGroups, setFilterGroups] = useState<FilterGroup[]>([
    {
      id: 'status',
      name: 'Durum',
      type: 'multiple',
      options: [
        { id: 'open', label: 'Açık', value: 'open', count: 45, isSelected: false },
        { id: 'closed', label: 'Kapalı', value: 'closed', count: 23, isSelected: false },
        { id: 'pending', label: 'Beklemede', value: 'pending', count: 12, isSelected: false },
        { id: 'in_progress', label: 'İşlemde', value: 'in_progress', count: 18, isSelected: false }
      ],
      isExpanded: true,
      isVisible: true,
      order: 1
    },
    {
      id: 'priority',
      name: 'Öncelik',
      type: 'hierarchy',
      options: [
        { 
          id: 'high', 
          label: 'Yüksek', 
          value: 'high', 
          count: 15, 
          isSelected: false,
          children: [
            { id: 'urgent', label: 'Acil', value: 'urgent', count: 8, isSelected: false },
            { id: 'critical', label: 'Kritik', value: 'critical', count: 7, isSelected: false }
          ]
        },
        { id: 'medium', label: 'Orta', value: 'medium', count: 32, isSelected: false },
        { id: 'low', label: 'Düşük', value: 'low', count: 28, isSelected: false }
      ],
      isExpanded: true,
      isVisible: true,
      order: 2
    },
    {
      id: 'category',
      name: 'Kategori',
      type: 'multiple',
      options: [
        { id: 'technical', label: 'Teknik', value: 'technical', count: 25, isSelected: false },
        { id: 'billing', label: 'Faturalama', value: 'billing', count: 18, isSelected: false },
        { id: 'feature', label: 'Özellik', value: 'feature', count: 22, isSelected: false },
        { id: 'bug', label: 'Hata', value: 'bug', count: 15, isSelected: false }
      ],
      isExpanded: true,
      isVisible: true,
      order: 3
    },
    {
      id: 'amount',
      name: 'Tutar Aralığı',
      type: 'range',
      options: [
        { id: '0-100', label: '0 - 100 TL', value: '0-100', count: 30, isSelected: false },
        { id: '100-500', label: '100 - 500 TL', value: '100-500', count: 25, isSelected: false },
        { id: '500-1000', label: '500 - 1000 TL', value: '500-1000', count: 20, isSelected: false },
        { id: '1000+', label: '1000+ TL', value: '1000+', count: 15, isSelected: false }
      ],
      isExpanded: true,
      isVisible: true,
      order: 4
    }
  ]);

  const [customFilters, setCustomFilters] = useState<any[]>([]);
  const [showCustomFilterModal, setShowCustomFilterModal] = useState(false);
  const [customFilterForm, setCustomFilterForm] = useState({
    name: '',
    type: 'text',
    operator: 'equals',
    value: ''
  });

  // Filtre grubunu genişlet/daralt
  const toggleFilterGroup = (groupId: string) => {
    setFilterGroups(prev => prev.map(group => 
      group.id === groupId ? { ...group, isExpanded: !group.isExpanded } : group
    ));
  };

  // Filtre grubunu göster/gizle
  const toggleFilterVisibility = (groupId: string) => {
    setFilterGroups(prev => prev.map(group => 
      group.id === groupId ? { ...group, isVisible: !group.isVisible } : group
    ));
  };

  // Filtre seçeneklerini güncelle
  const updateFilterSelection = (groupId: string, optionId: string, isSelected: boolean) => {
    setFilterGroups(prev => prev.map(group => {
      if (group.id === groupId) {
        const updateOptions = (options: FilterOption[]): FilterOption[] => {
          return options.map(option => {
            if (option.id === optionId) {
              return { ...option, isSelected };
            }
            if (option.children) {
              return { ...option, children: updateOptions(option.children) };
            }
            return option;
          });
        };

        return { ...group, options: updateOptions(group.options) };
      }
      return group;
    }));
  };

  // Çoklu seçim filtrelerini güncelle
  const updateMultipleSelection = (groupId: string, optionId: string) => {
    const group = filterGroups.find(g => g.id === groupId);
    if (!group) return;

    const option = group.options.find(o => o.id === optionId);
    if (!option) return;

    const newIsSelected = !option.isSelected;
    updateFilterSelection(groupId, optionId, newIsSelected);
  };

  // Hiyerarşik filtreleri güncelle
  const updateHierarchySelection = (groupId: string, optionId: string) => {
    const group = filterGroups.find(g => g.id === groupId);
    if (!group) return;

    const updateHierarchy = (options: FilterOption[], targetId: string): FilterOption[] => {
      return options.map(option => {
        if (option.id === targetId) {
          const newIsSelected = !option.isSelected;
          // Alt öğeleri de güncelle
          const updatedChildren = option.children ? 
            option.children.map(child => ({ ...child, isSelected: newIsSelected })) : 
            undefined;
          
          return { ...option, isSelected: newIsSelected, children: updatedChildren };
        }
        if (option.children) {
          return { ...option, children: updateHierarchy(option.children, targetId) };
        }
        return option;
      });
    };

    const updatedOptions = updateHierarchy(group.options, optionId);
    setFilterGroups(prev => prev.map(g => 
      g.id === groupId ? { ...g, options: updatedOptions } : g
    ));
  };

  // Özel filtre ekle
  const addCustomFilter = () => {
    if (!customFilterForm.name.trim() || !customFilterForm.value.trim()) return;

    const newFilter = {
      id: Date.now().toString(),
      ...customFilterForm,
      isActive: true
    };

    setCustomFilters(prev => [...prev, newFilter]);
    setCustomFilterForm({ name: '', type: 'text', operator: 'equals', value: '' });
    setShowCustomFilterModal(false);
  };

  // Özel filtreyi kaldır
  const removeCustomFilter = (id: string) => {
    setCustomFilters(prev => prev.filter(f => f.id !== id));
  };

  // Özel filtreyi aktif/pasif yap
  const toggleCustomFilter = (id: string) => {
    setCustomFilters(prev => prev.map(f => 
      f.id === id ? { ...f, isActive: !f.isActive } : f
    ));
  };

  // Tüm filtreleri temizle
  const clearAllFilters = () => {
    setFilterGroups(prev => prev.map(group => ({
      ...group,
      options: group.options.map(option => ({
        ...option,
        isSelected: false,
        children: option.children?.map(child => ({ ...child, isSelected: false }))
      }))
    })));
    setCustomFilters([]);
    onClearAll();
  };

  // Aktif filtreleri al
  const getActiveFilters = () => {
    const activeFilters: any = {};

    // Grup filtreleri
    filterGroups.forEach(group => {
      if (!group.isVisible) return;

      const selectedOptions = group.options.filter(option => {
        if (option.isSelected) return true;
        if (option.children) {
          return option.children.some(child => child.isSelected);
        }
        return false;
      });

      if (selectedOptions.length > 0) {
        activeFilters[group.id] = {
          type: group.type,
          values: selectedOptions.map(opt => opt.value),
          options: selectedOptions
        };
      }
    });

    // Özel filtreler
    const activeCustomFilters = customFilters.filter(f => f.isActive);
    if (activeCustomFilters.length > 0) {
      activeFilters.custom = activeCustomFilters;
    }

    return activeFilters;
  };

  // Filtreleri uygula
  const applyFilters = () => {
    const activeFilters = getActiveFilters();
    onFiltersChange(activeFilters);
  };

  // Filtre grubunu yeniden sırala
  const reorderFilterGroup = (groupId: string, direction: 'up' | 'down') => {
    setFilterGroups(prev => {
      const currentIndex = prev.findIndex(g => g.id === groupId);
      if (currentIndex === -1) return prev;

      const newIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
      if (newIndex < 0 || newIndex >= prev.length) return prev;

      const newGroups = [...prev];
      [newGroups[currentIndex], newGroups[newIndex]] = [newGroups[newIndex], newGroups[currentIndex]];

      // Sıra numaralarını güncelle
      return newGroups.map((group, index) => ({ ...group, order: index + 1 }));
    });
  };

  const renderFilterOption = (option: FilterOption, groupId: string, groupType: string) => {
    const isSelected = option.isSelected;
    const hasChildren = option.children && option.children.length > 0;

    return (
      <div key={option.id} className="space-y-2">
        <label className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 p-2 rounded">
          <input
            type={groupType === 'multiple' ? 'checkbox' : 'radio'}
            checked={isSelected}
            onChange={() => {
              if (groupType === 'hierarchy') {
                updateHierarchySelection(groupId, option.id);
              } else {
                updateMultipleSelection(groupId, option.id);
              }
            }}
            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          />
          <span className="flex-1 text-sm text-gray-700 dark:text-gray-300">
            {option.label}
          </span>
          <span className="text-xs text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">
            {option.count}
          </span>
          {hasChildren && (
            <button
              onClick={(e) => {
                e.preventDefault();
                // Alt öğeleri toggle et
              }}
              className="text-gray-400 hover:text-gray-600"
            >
              <ChevronRight size={16} />
            </button>
          )}
        </label>

        {/* Alt öğeler */}
        {hasChildren && option.children && (
          <div className="ml-6 space-y-1">
            {option.children.map(child => (
              <label key={child.id} className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 p-2 rounded">
                <input
                  type="checkbox"
                  checked={child.isSelected}
                  onChange={() => updateFilterSelection(groupId, child.id, !child.isSelected)}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="flex-1 text-sm text-gray-600 dark:text-gray-400">
                  {child.label}
                </span>
                <span className="text-xs text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">
                  {child.count}
                </span>
              </label>
            ))}
          </div>
        )}
      </div>
    );
  };

  const renderFilterGroup = (group: FilterGroup) => {
    if (!group.isVisible) return null;

    return (
      <div key={group.id} className="border border-gray-200 dark:border-gray-700 rounded-lg">
        {/* Grup Başlığı */}
        <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-2">
            <button
              onClick={() => toggleFilterGroup(group.id)}
              className="text-gray-500 hover:text-gray-700"
            >
              {group.isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
            </button>
            <h4 className="font-medium text-gray-900 dark:text-white">{group.name}</h4>
            <span className="text-xs text-gray-500 dark:text-gray-400 bg-gray-200 dark:bg-gray-700 px-2 py-1 rounded">
              {group.type}
            </span>
          </div>

          <div className="flex items-center gap-2">
            {/* Sıralama Butonları */}
            <button
              onClick={() => reorderFilterGroup(group.id, 'up')}
              disabled={group.order === 1}
              className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
              title="Yukarı taşı"
            >
              ↑
            </button>
            <button
              onClick={() => reorderFilterGroup(group.id, 'down')}
              disabled={group.order === filterGroups.length}
              className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
              title="Aşağı taşı"
            >
              ↓
            </button>

            {/* Görünürlük Toggle */}
            <button
              onClick={() => toggleFilterVisibility(group.id)}
              className="p-1 text-gray-400 hover:text-gray-600"
              title={group.isVisible ? 'Gizle' : 'Göster'}
            >
              {group.isVisible ? <Eye size={16} /> : <EyeOff size={16} />}
            </button>
          </div>
        </div>

        {/* Grup İçeriği */}
        {group.isExpanded && (
          <div className="p-3 space-y-2">
            {group.options.map(option => renderFilterOption(option, group.id, group.type))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Başlık ve Kontroller */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
          <Layers size={20} className="text-blue-600" />
          Gelişmiş Filtreleme
        </h3>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowCustomFilterModal(true)}
            className="px-3 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors flex items-center gap-2 text-sm"
          >
            <Plus size={16} />
            Özel Filtre
          </button>
          <button
            onClick={clearAllFilters}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-sm"
          >
            Tümünü Temizle
          </button>
        </div>
      </div>

      {/* Filtre Grupları */}
      <div className="space-y-3">
        {filterGroups.map(renderFilterGroup)}
      </div>

      {/* Özel Filtreler */}
      {customFilters.length > 0 && (
        <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
          <h4 className="font-medium text-gray-900 dark:text-white mb-3 flex items-center gap-2">
            <Sliders size={16} />
            Özel Filtreler
          </h4>
          <div className="space-y-2">
            {customFilters.map(filter => (
              <div key={filter.id} className="flex items-center gap-3 p-2 bg-gray-50 dark:bg-gray-800 rounded">
                <button
                  onClick={() => toggleCustomFilter(filter.id)}
                  className={`px-2 py-1 rounded text-xs ${
                    filter.isActive 
                      ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' 
                      : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                  }`}
                >
                  {filter.isActive ? 'Aktif' : 'Pasif'}
                </button>
                <span className="text-sm text-gray-700 dark:text-gray-300">
                  {filter.name} {filter.operator} {filter.value}
                </span>
                <button
                  onClick={() => removeCustomFilter(filter.id)}
                  className="ml-auto p-1 text-red-600 hover:text-red-700 rounded"
                  title="Kaldır"
                >
                  <X size={14} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Filtreleri Uygula Butonu */}
      <button
        onClick={applyFilters}
        className="w-full bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
      >
        <Filter size={16} />
        Filtreleri Uygula
      </button>

      {/* Özel Filtre Ekleme Modal'ı */}
      {showCustomFilterModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Özel Filtre Ekle
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Filtre Adı *
                </label>
                <input
                  type="text"
                  value={customFilterForm.name}
                  onChange={(e) => setCustomFilterForm(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Örn: Müşteri Tipi"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Tip
                  </label>
                  <select
                    value={customFilterForm.type}
                    onChange={(e) => setCustomFilterForm(prev => ({ ...prev, type: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                  >
                    <option value="text">Metin</option>
                    <option value="number">Sayı</option>
                    <option value="date">Tarih</option>
                    <option value="boolean">Boolean</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Operatör
                  </label>
                  <select
                    value={customFilterForm.operator}
                    onChange={(e) => setCustomFilterForm(prev => ({ ...prev, operator: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                  >
                    <option value="equals">Eşittir</option>
                    <option value="contains">İçerir</option>
                    <option value="starts_with">İle Başlar</option>
                    <option value="ends_with">İle Biter</option>
                    <option value="greater_than">Büyüktür</option>
                    <option value="less_than">Küçüktür</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Değer *
                </label>
                <input
                  type="text"
                  value={customFilterForm.value}
                  onChange={(e) => setCustomFilterForm(prev => ({ ...prev, value: e.target.value }))}
                  placeholder="Filtre değeri"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={addCustomFilter}
                disabled={!customFilterForm.name.trim() || !customFilterForm.value.trim()}
                className="flex-1 bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Ekle
              </button>
              <button
                onClick={() => setShowCustomFilterModal(false)}
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

export default AdvancedFiltering;
