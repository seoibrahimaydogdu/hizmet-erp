import React, { useState } from 'react';
import { Search, Code, Asterisk, Quote, X, Plus, Minus, Zap } from 'lucide-react';

interface SearchOperator {
  id: string;
  type: 'text' | 'boolean' | 'regex' | 'wildcard' | 'phrase';
  operator: 'AND' | 'OR' | 'NOT' | 'regex' | 'wildcard' | 'phrase';
  value: string;
  field?: string;
  isActive: boolean;
}

interface AdvancedSearchOperatorsProps {
  onSearch: (operators: SearchOperator[]) => void;
  onClear: () => void;
  className?: string;
}

const AdvancedSearchOperators: React.FC<AdvancedSearchOperatorsProps> = ({
  onSearch,
  onClear,
  className = ''
}) => {
  const [operators, setOperators] = useState<SearchOperator[]>([]);
  const [currentOperator, setCurrentOperator] = useState<SearchOperator>({
    id: '',
    type: 'text',
    operator: 'AND',
    value: '',
    field: '',
    isActive: true
  });
  const [showHelp, setShowHelp] = useState(false);

  const operatorTypes = [
    { value: 'text', label: 'Metin Arama', icon: Search, desc: 'Normal metin arama' },
    { value: 'boolean', label: 'Boolean Operatörler', icon: Code, desc: 'AND, OR, NOT mantığı' },
    { value: 'regex', label: 'Regex Arama', icon: Code, desc: 'Düzenli ifade ile arama' },
    { value: 'wildcard', label: 'Wildcard Arama', icon: Asterisk, desc: '* ve ? karakterleri' },
    { value: 'phrase', label: 'Cümle Arama', icon: Quote, desc: 'Tırnak içinde tam cümle' }
  ];

  const booleanOperators = [
    { value: 'AND', label: 'VE (AND)', desc: 'Her iki koşul da sağlanmalı' },
    { value: 'OR', label: 'VEYA (OR)', desc: 'Koşullardan biri sağlanmalı' },
    { value: 'NOT', label: 'DEĞİL (NOT)', desc: 'Koşul sağlanmamalı' }
  ];

  const searchFields = [
    { value: 'all', label: 'Tüm Alanlar' },
    { value: 'title', label: 'Başlık' },
    { value: 'description', label: 'Açıklama' },
    { value: 'content', label: 'İçerik' },
    { value: 'tags', label: 'Etiketler' },
    { value: 'category', label: 'Kategori' }
  ];

  const addOperator = () => {
    if (!currentOperator.value.trim()) return;

    const newOperator: SearchOperator = {
      ...currentOperator,
      id: Date.now().toString(),
      isActive: true
    };

    setOperators(prev => [...prev, newOperator]);
    setCurrentOperator({
      id: '',
      type: 'text',
      operator: 'AND',
      value: '',
      field: '',
      isActive: true
    });
  };

  const removeOperator = (id: string) => {
    setOperators(prev => prev.filter(op => op.id !== id));
  };

  const toggleOperator = (id: string) => {
    setOperators(prev => prev.map(op => 
      op.id === id ? { ...op, isActive: !op.isActive } : op
    ));
  };

  const handleSearch = () => {
    const activeOperators = operators.filter(op => op.isActive);
    onSearch(activeOperators);
  };

  const handleClear = () => {
    setOperators([]);
    onClear();
  };

  const getOperatorIcon = (type: string) => {
    switch (type) {
      case 'text': return <Search size={16} />;
      case 'boolean': return <Code size={16} />;
      case 'regex': return <Code size={16} />;
      case 'wildcard': return <Asterisk size={16} />;
      case 'phrase': return <Quote size={16} />;
      default: return <Search size={16} />;
    }
  };

  const getOperatorColor = (type: string) => {
    switch (type) {
      case 'text': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'boolean': return 'bg-green-100 text-green-800 border-green-200';
      case 'regex': return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'wildcard': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'phrase': return 'bg-pink-100 text-pink-800 border-pink-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Başlık ve Yardım */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
          <Zap size={20} className="text-blue-600" />
          Gelişmiş Arama Operatörleri
        </h3>
        <button
          onClick={() => setShowHelp(!showHelp)}
          className="text-blue-600 hover:text-blue-700 text-sm font-medium"
        >
          {showHelp ? 'Yardımı Gizle' : 'Yardım'}
        </button>
      </div>

      {/* Yardım Paneli */}
      {showHelp && (
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
          <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-2">Kullanım Örnekleri:</h4>
          <div className="space-y-2 text-sm text-blue-800 dark:text-blue-200">
            <div><strong>Boolean:</strong> "hata" AND "ödeme" → Hem hata hem ödeme içeren</div>
            <div><strong>Regex:</strong> ^[A-Z]{2}-\d{4}$ → İki büyük harf + tire + 4 rakam</div>
            <div><strong>Wildcard:</strong> hata* → hata ile başlayan</div>
            <div><strong>Phrase:</strong> "ödeme sorunu" → Tam cümle arama</div>
          </div>
        </div>
      )}

      {/* Operatör Ekleme Formu */}
      <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          {/* Operatör Tipi */}
          <select
            value={currentOperator.type}
            onChange={(e) => setCurrentOperator(prev => ({ ...prev, type: e.target.value as any }))}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
          >
            {operatorTypes.map(type => (
              <option key={type.value} value={type.value}>
                {type.label}
              </option>
            ))}
          </select>

          {/* Boolean Operatör (sadece boolean tipinde) */}
          {currentOperator.type === 'boolean' && (
            <select
              value={currentOperator.operator}
              onChange={(e) => setCurrentOperator(prev => ({ ...prev, operator: e.target.value as any }))}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
            >
              {booleanOperators.map(op => (
                <option key={op.value} value={op.value}>
                  {op.label}
                </option>
              ))}
            </select>
          )}

          {/* Arama Alanı */}
          <select
            value={currentOperator.field || 'all'}
            onChange={(e) => setCurrentOperator(prev => ({ ...prev, field: e.target.value }))}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
          >
            {searchFields.map(field => (
              <option key={field.value} value={field.value}>
                {field.label}
              </option>
            ))}
          </select>

          {/* Arama Değeri */}
          <div className="flex gap-2">
            <input
              type="text"
              value={currentOperator.value}
              onChange={(e) => setCurrentOperator(prev => ({ ...prev, value: e.target.value }))}
              placeholder={currentOperator.type === 'regex' ? '^[A-Z]{2}-\d{4}$' : 
                         currentOperator.type === 'wildcard' ? 'hata*' :
                         currentOperator.type === 'phrase' ? '"ödeme sorunu"' : 'Arama terimi'}
              className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
            />
            <button
              onClick={addOperator}
              className="px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              <Plus size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* Aktif Operatörler */}
      {operators.length > 0 && (
        <div className="space-y-3">
          <h4 className="font-medium text-gray-900 dark:text-white">Aktif Operatörler:</h4>
          {operators.map((operator) => (
            <div
              key={operator.id}
              className={`flex items-center gap-3 p-3 border rounded-lg transition-all ${
                operator.isActive 
                  ? 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800' 
                  : 'border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 opacity-50'
              }`}
            >
              {/* Operatör İkonu */}
              <div className={`p-2 rounded-lg ${getOperatorColor(operator.type)}`}>
                {getOperatorIcon(operator.type)}
              </div>

              {/* Operatör Detayları */}
              <div className="flex-1">
                <div className="flex items-center gap-2 text-sm">
                  {operator.type === 'boolean' && (
                    <span className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded text-xs">
                      {operator.operator}
                    </span>
                  )}
                  {operator.field && operator.field !== 'all' && (
                    <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 rounded text-xs">
                      {operator.field}
                    </span>
                  )}
                  <span className="font-medium text-gray-900 dark:text-white">
                    {operator.value}
                  </span>
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  {operatorTypes.find(t => t.value === operator.type)?.desc}
                </div>
              </div>

              {/* Kontroller */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => toggleOperator(operator.id)}
                  className={`p-1 rounded transition-colors ${
                    operator.isActive 
                      ? 'text-green-600 hover:text-green-700' 
                      : 'text-gray-400 hover:text-gray-600'
                  }`}
                  title={operator.isActive ? 'Devre dışı bırak' : 'Etkinleştir'}
                >
                  {operator.isActive ? '✓' : '○'}
                </button>
                <button
                  onClick={() => removeOperator(operator.id)}
                  className="p-1 text-red-600 hover:text-red-700 rounded transition-colors"
                  title="Kaldır"
                >
                  <X size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Arama Butonları */}
      <div className="flex gap-3">
        <button
          onClick={handleSearch}
          disabled={operators.length === 0}
          className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
        >
          <Search size={16} />
          Gelişmiş Arama Yap
        </button>
        <button
          onClick={handleClear}
          className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
        >
          Temizle
        </button>
      </div>

      {/* Operatör Sayısı */}
      {operators.length > 0 && (
        <div className="text-sm text-gray-500 dark:text-gray-400 text-center">
          {operators.filter(op => op.isActive).length} aktif operatör
        </div>
      )}
    </div>
  );
};

export default AdvancedSearchOperators;
