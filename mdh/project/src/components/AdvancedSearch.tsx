import React, { useState, useEffect } from 'react';
import { Search, Filter, X, ChevronDown, ChevronUp, Calendar, User, Building, CreditCard, FileText, MessageSquare } from 'lucide-react';

interface SearchResult {
  id: string;
  type: 'ticket' | 'customer' | 'payment' | 'agent';
  title: string;
  subtitle: string;
  description: string;
  status?: string;
  priority?: string;
  date?: string;
  amount?: number;
  action: () => void;
}

interface AdvancedSearchProps {
  onSearch: (filters: SearchFilters) => void;
  onClear: () => void;
  searchTypes?: string[];
  className?: string;
  data?: {
    tickets?: any[];
    customers?: any[];
    payments?: any[];
    agents?: any[];
  };
}

export interface SearchFilters {
  searchTerm: string;
  searchType: string;
  dateRange: {
    start: string;
    end: string;
  };
  status: string;
  priority: string;
  assignedTo: string;
  tags: string[];
  amountRange: {
    min: number | '';
    max: number | '';
  };
  customFields: Record<string, string>;
}

const AdvancedSearch: React.FC<AdvancedSearchProps> = ({
  onSearch,
  onClear,
  searchTypes = ['all', 'tickets', 'customers', 'payments', 'agents'],
  className = '',
  data = {}
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
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

  const [tagInput, setTagInput] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);

  // localStorage'dan arama terimini yükle
  useEffect(() => {
    try {
      const savedSearchTerm = localStorage.getItem('globalSearchTerm');
      if (savedSearchTerm) {
        setFilters(prev => ({
          ...prev,
          searchTerm: savedSearchTerm
        }));
        // localStorage'dan temizle
        localStorage.removeItem('globalSearchTerm');
      }
    } catch (error) {
      console.warn('localStorage okuma hatası:', error);
    }
  }, []);

  const searchTypeLabels = {
    all: 'Tümü',
    tickets: 'Talepler',
    customers: 'Müşteriler',
    payments: 'Ödemeler',
    agents: 'Temsilciler',
    invoices: 'Faturalar'
  };

  const statusOptions = [
    { value: '', label: 'Tüm Durumlar' },
    { value: 'open', label: 'Açık' },
    { value: 'closed', label: 'Kapalı' },
    { value: 'pending', label: 'Beklemede' },
    { value: 'in_progress', label: 'İşlemde' },
    { value: 'resolved', label: 'Çözüldü' },
    { value: 'cancelled', label: 'İptal Edildi' }
  ];

  const priorityOptions = [
    { value: '', label: 'Tüm Öncelikler' },
    { value: 'low', label: 'Düşük' },
    { value: 'medium', label: 'Orta' },
    { value: 'high', label: 'Yüksek' },
    { value: 'urgent', label: 'Acil' }
  ];

  const handleFilterChange = (key: keyof SearchFilters, value: any) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const handleDateRangeChange = (field: 'start' | 'end', value: string) => {
    setFilters(prev => ({
      ...prev,
      dateRange: {
        ...prev.dateRange,
        [field]: value
      }
    }));
  };

  const handleAmountRangeChange = (field: 'min' | 'max', value: string) => {
    setFilters(prev => ({
      ...prev,
      amountRange: {
        ...prev.amountRange,
        [field]: value === '' ? '' : Number(value)
      }
    }));
  };

  const addTag = () => {
    if (tagInput.trim() && !filters.tags.includes(tagInput.trim())) {
      setFilters(prev => ({
        ...prev,
        tags: [...prev.tags, tagInput.trim()]
      }));
      setTagInput('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    setFilters(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };

  const handleSearch = () => {
    try {
      // Arama terimi doğrulama
      if (!filters.searchTerm.trim() && !filters.status && !filters.priority && !filters.assignedTo && filters.tags.length === 0) {
        console.warn('Arama yapmak için en az bir kriter belirtmelisiniz');
        return;
      }
      
      setIsSearching(true);
      setShowResults(true);
      
      // Arama sonuçlarını hesapla
      const results = performSearch(filters);
      setSearchResults(results);
      
      // onSearch fonksiyonunu çağır
      if (onSearch && typeof onSearch === 'function') {
        onSearch(filters);
      } else {
        console.error('onSearch fonksiyonu tanımlanmamış veya geçersiz');
      }
      
      setIsSearching(false);
    } catch (error) {
      console.error('Arama sırasında hata oluştu:', error);
      setIsSearching(false);
    }
  };

  const handleClear = () => {
    try {
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
      
      setSearchResults([]);
      setShowResults(false);
      
      if (onClear && typeof onClear === 'function') {
        onClear();
      } else {
        console.error('onClear fonksiyonu tanımlanmamış veya geçersiz');
      }
    } catch (error) {
      console.error('Filtre temizleme sırasında hata oluştu:', error);
    }
  };

  // Gelişmiş arama fonksiyonu - skorlama sistemi ile
  const performSearch = (filters: SearchFilters): SearchResult[] => {
    const results: SearchResult[] = [];
    const searchTerm = filters.searchTerm.toLowerCase().trim();
    const searchWords = searchTerm.split(' ').filter(word => word.length > 0);

    // Skorlama fonksiyonu
    const calculateScore = (text: string, searchTerm: string, searchWords: string[]): number => {
      if (!text || !searchTerm) return 0;
      
      const textLower = text.toLowerCase();
      let score = 0;
      
      // Tam eşleşme (en yüksek skor)
      if (textLower === searchTerm) score += 100;
      
      // Başlangıçta eşleşme
      if (textLower.startsWith(searchTerm)) score += 80;
      
      // Kelime başlangıçlarında eşleşme
      searchWords.forEach(word => {
        if (textLower.includes(word)) {
          score += 40;
          // Kelime başlangıcında eşleşme
          if (textLower.includes(' ' + word) || textLower.startsWith(word)) {
            score += 20;
          }
        }
      });
      
      // Kısmi eşleşme
      if (textLower.includes(searchTerm)) score += 30;
      
      return score;
    };

    // Tarih filtresi kontrolü
    const isDateInRange = (date: string, startDate?: string, endDate?: string): boolean => {
      if (!startDate && !endDate) return true;
      
      const itemDate = new Date(date);
      const start = startDate ? new Date(startDate) : new Date('1900-01-01');
      const end = endDate ? new Date(endDate) : new Date('2100-12-31');
      
      return itemDate >= start && itemDate <= end;
    };

    // Taleplerde gelişmiş arama
    if (data.tickets && (filters.searchType === 'all' || filters.searchType === 'tickets')) {
      data.tickets.forEach(ticket => {
        const customer = data.customers?.find(c => c.id === ticket.customer_id);
        const agent = data.agents?.find(a => a.id === ticket.agent_id);
        
        // Tarih filtresi kontrolü
        if (!isDateInRange(ticket.created_at, filters.dateRange.start, filters.dateRange.end)) return;
        
        // Filtre kontrolleri
        if (filters.status && ticket.status !== filters.status) return;
        if (filters.priority && ticket.priority !== filters.priority) return;
        if (filters.assignedTo && !agent?.name?.toLowerCase().includes(filters.assignedTo.toLowerCase())) return;
        
        // Arama terimi yoksa tüm talepleri dahil et
        if (!searchTerm) {
          results.push({
            id: ticket.id,
            type: 'ticket',
            title: ticket.title || 'Başlıksız Talep',
            subtitle: customer?.name || 'Bilinmeyen Müşteri',
            description: `Talep #${ticket.id.slice(0, 8)} - ${ticket.status} - ${ticket.priority || 'Normal'} öncelik`,
            status: ticket.status,
            priority: ticket.priority,
            date: ticket.created_at,
            action: () => {
              localStorage.setItem('selectedTicketId', ticket.id);
              window.location.href = '#tickets';
            }
          });
          return;
        }
        
        // Skorlama
        const titleScore = calculateScore(ticket.title || '', searchTerm, searchWords);
        const descriptionScore = calculateScore(ticket.description || '', searchTerm, searchWords);
        const customerScore = calculateScore(customer?.name || '', searchTerm, searchWords);
        const agentScore = calculateScore(agent?.name || '', searchTerm, searchWords);
        const idScore = calculateScore(ticket.id, searchTerm, searchWords);
        
        const totalScore = titleScore + descriptionScore + customerScore + agentScore + idScore;
        
        if (totalScore > 0) {
          results.push({
            id: ticket.id,
            type: 'ticket',
            title: ticket.title || 'Başlıksız Talep',
            subtitle: customer?.name || 'Bilinmeyen Müşteri',
            description: `Talep #${ticket.id.slice(0, 8)} - ${ticket.status} - ${ticket.priority || 'Normal'} öncelik - ${agent?.name || 'Atanmamış'}`,
            status: ticket.status,
            priority: ticket.priority,
            date: ticket.created_at,
            action: () => {
              localStorage.setItem('selectedTicketId', ticket.id);
              window.location.href = '#tickets';
            }
          });
        }
      });
    }

    // Müşterilerde gelişmiş arama
    if (data.customers && (filters.searchType === 'all' || filters.searchType === 'customers')) {
      data.customers.forEach(customer => {
        // Tarih filtresi kontrolü
        if (!isDateInRange(customer.created_at, filters.dateRange.start, filters.dateRange.end)) return;
        
        // Arama terimi yoksa tüm müşterileri dahil et
        if (!searchTerm) {
          results.push({
            id: customer.id,
            type: 'customer',
            title: customer.name || 'İsimsiz Müşteri',
            subtitle: customer.email || 'E-posta yok',
            description: `${customer.company || 'Şirket bilgisi yok'} - ${customer.phone || 'Telefon yok'}`,
            date: customer.created_at,
            action: () => {
              localStorage.setItem('selectedCustomerId', customer.id);
              window.location.href = '#customers';
            }
          });
          return;
        }
        
        // Skorlama
        const nameScore = calculateScore(customer.name || '', searchTerm, searchWords);
        const emailScore = calculateScore(customer.email || '', searchTerm, searchWords);
        const companyScore = calculateScore(customer.company || '', searchTerm, searchWords);
        const phoneScore = calculateScore(customer.phone || '', searchTerm, searchWords);
        
        const totalScore = nameScore + emailScore + companyScore + phoneScore;
        
        if (totalScore > 0) {
          results.push({
            id: customer.id,
            type: 'customer',
            title: customer.name || 'İsimsiz Müşteri',
            subtitle: customer.email || 'E-posta yok',
            description: `${customer.company || 'Şirket bilgisi yok'} - ${customer.phone || 'Telefon yok'}`,
            date: customer.created_at,
            action: () => {
              localStorage.setItem('selectedCustomerId', customer.id);
              window.location.href = '#customers';
            }
          });
        }
      });
    }

    // Temsilcilerde gelişmiş arama
    if (data.agents && (filters.searchType === 'all' || filters.searchType === 'agents')) {
      data.agents.forEach(agent => {
        // Tarih filtresi kontrolü
        if (!isDateInRange(agent.created_at, filters.dateRange.start, filters.dateRange.end)) return;
        
        // Arama terimi yoksa tüm temsilcileri dahil et
        if (!searchTerm) {
          results.push({
            id: agent.id,
            type: 'agent',
            title: agent.name || 'İsimsiz Temsilci',
            subtitle: agent.email || 'E-posta yok',
            description: `Temsilci - ${agent.status || 'Aktif'} - ${agent.department || 'Departman belirtilmemiş'}`,
            status: agent.status,
            date: agent.created_at,
            action: () => {
              window.location.href = '#agents';
            }
          });
          return;
        }
        
        // Skorlama
        const nameScore = calculateScore(agent.name || '', searchTerm, searchWords);
        const emailScore = calculateScore(agent.email || '', searchTerm, searchWords);
        const departmentScore = calculateScore(agent.department || '', searchTerm, searchWords);
        
        const totalScore = nameScore + emailScore + departmentScore;
        
        if (totalScore > 0) {
          results.push({
            id: agent.id,
            type: 'agent',
            title: agent.name || 'İsimsiz Temsilci',
            subtitle: agent.email || 'E-posta yok',
            description: `Temsilci - ${agent.status || 'Aktif'} - ${agent.department || 'Departman belirtilmemiş'}`,
            status: agent.status,
            date: agent.created_at,
            action: () => {
              window.location.href = '#agents';
            }
          });
        }
      });
    }

    // Ödemelerde gelişmiş arama
    if (data.payments && (filters.searchType === 'all' || filters.searchType === 'payments')) {
      data.payments.forEach(payment => {
        const customer = data.customers?.find(c => c.id === payment.customer_id);
        
        // Tarih filtresi kontrolü
        const paymentDate = payment.payment_date || payment.created_at;
        if (!isDateInRange(paymentDate, filters.dateRange.start, filters.dateRange.end)) return;
        
        // Tutar filtresi
        if (filters.amountRange.min && payment.amount < filters.amountRange.min) return;
        if (filters.amountRange.max && payment.amount > filters.amountRange.max) return;
        
        // Arama terimi yoksa tüm ödemeleri dahil et
        if (!searchTerm) {
          results.push({
            id: payment.id,
            type: 'payment',
            title: `Ödeme #${payment.invoice_number || payment.id.slice(0, 8)}`,
            subtitle: customer?.name || 'Bilinmeyen Müşteri',
            description: `${payment.amount} ${payment.currency} - ${payment.status} - ${payment.payment_method || 'Ödeme yöntemi belirtilmemiş'}`,
            status: payment.status,
            amount: parseFloat(payment.amount),
            date: paymentDate,
            action: () => {
              window.location.href = '#financial-management';
            }
          });
          return;
        }
        
        // Skorlama
        const invoiceScore = calculateScore(payment.invoice_number || '', searchTerm, searchWords);
        const descriptionScore = calculateScore(payment.description || '', searchTerm, searchWords);
        const customerScore = calculateScore(customer?.name || '', searchTerm, searchWords);
        const amountScore = calculateScore(payment.amount.toString(), searchTerm, searchWords);
        
        const totalScore = invoiceScore + descriptionScore + customerScore + amountScore;
        
        if (totalScore > 0) {
          results.push({
            id: payment.id,
            type: 'payment',
            title: `Ödeme #${payment.invoice_number || payment.id.slice(0, 8)}`,
            subtitle: customer?.name || 'Bilinmeyen Müşteri',
            description: `${payment.amount} ${payment.currency} - ${payment.status} - ${payment.payment_method || 'Ödeme yöntemi belirtilmemiş'}`,
            status: payment.status,
            amount: parseFloat(payment.amount),
            date: paymentDate,
            action: () => {
              window.location.href = '#financial-management';
            }
          });
        }
      });
    }

    // Sonuçları skorlara göre sırala (yüksek skor önce)
    results.sort((a, b) => {
      // Önce türe göre grupla
      const typeOrder = { ticket: 1, customer: 2, agent: 3, payment: 4 };
      const aTypeOrder = typeOrder[a.type as keyof typeof typeOrder] || 5;
      const bTypeOrder = typeOrder[b.type as keyof typeof typeOrder] || 5;
      
      if (aTypeOrder !== bTypeOrder) {
        return aTypeOrder - bTypeOrder;
      }
      
      // Sonra tarihe göre sırala (yeni önce)
      const aDate = a.date ? new Date(a.date).getTime() : 0;
      const bDate = b.date ? new Date(b.date).getTime() : 0;
      return bDate - aDate;
    });

    return results.slice(0, 100); // İlk 100 sonucu döndür
  };

  const hasActiveFilters = () => {
    return filters.searchTerm ||
           filters.searchType !== 'all' ||
           filters.dateRange.start ||
           filters.dateRange.end ||
           filters.status ||
           filters.priority ||
           filters.assignedTo ||
           filters.tags.length > 0 ||
           filters.amountRange.min !== '' ||
           filters.amountRange.max !== '';
  };

  return (
    <div className={`bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 ${className}`}>
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Gelişmiş arama yapın..."
              value={filters.searchTerm}
              onChange={(e) => handleFilterChange('searchTerm', e.target.value)}
              className="w-full pl-10 pr-4 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          <select
            value={filters.searchType}
            onChange={(e) => handleFilterChange('searchType', e.target.value)}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {searchTypes.map(type => (
              <option key={type} value={type}>
                {searchTypeLabels[type as keyof typeof searchTypeLabels] || type}
              </option>
            ))}
          </select>

          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex items-center gap-2 px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600"
          >
            <Filter className="w-4 h-4" />
            Filtreler
            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>

          <button
            onClick={handleSearch}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium"
          >
            Ara
          </button>

          {hasActiveFilters() && (
            <button
              onClick={handleClear}
              className="px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {isExpanded && (
        <div className="p-4 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                <Calendar className="w-4 h-4" />
                Tarih Aralığı
              </label>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="date"
                  value={filters.dateRange.start}
                  onChange={(e) => handleDateRangeChange('start', e.target.value)}
                  className="px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <input
                  type="date"
                  value={filters.dateRange.end}
                  onChange={(e) => handleDateRangeChange('end', e.target.value)}
                  className="px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                <MessageSquare className="w-4 h-4" />
                Durum
              </label>
              <select
                value={filters.status}
                onChange={(e) => handleFilterChange('status', e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {statusOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                <CreditCard className="w-4 h-4" />
                Öncelik
              </label>
              <select
                value={filters.priority}
                onChange={(e) => handleFilterChange('priority', e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {priorityOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                <User className="w-4 h-4" />
                Atanan Kişi
              </label>
              <input
                type="text"
                placeholder="Temsilci adı..."
                value={filters.assignedTo}
                onChange={(e) => handleFilterChange('assignedTo', e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                <FileText className="w-4 h-4" />
                Tutar Aralığı
              </label>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="number"
                  placeholder="Min"
                  value={filters.amountRange.min}
                  onChange={(e) => handleAmountRangeChange('min', e.target.value)}
                  className="px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <input
                  type="number"
                  placeholder="Max"
                  value={filters.amountRange.max}
                  onChange={(e) => handleAmountRangeChange('max', e.target.value)}
                  className="px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                <Building className="w-4 h-4" />
                Etiketler
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Etiket ekle..."
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && addTag()}
                  className="flex-1 px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  onClick={addTag}
                  className="px-3 py-2 text-sm bg-gray-600 hover:bg-gray-700 text-white rounded-lg"
                >
                  Ekle
                </button>
              </div>
            </div>
          </div>

          {filters.tags.length > 0 && (
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Seçili Etiketler:</label>
              <div className="flex flex-wrap gap-2">
                {filters.tags.map((tag, index) => (
                  <span
                    key={index}
                    className="inline-flex items-center gap-1 px-2 py-1 text-xs bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded-full"
                  >
                    {tag}
                    <button
                      onClick={() => removeTag(tag)}
                      className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-200"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
            </div>
          )}

          {hasActiveFilters() && (
            <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Aktif Filtreler:
                </span>
                <button
                  onClick={handleClear}
                  className="text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-200"
                >
                  Tümünü Temizle
                </button>
              </div>
              <div className="mt-2 flex flex-wrap gap-2">
                {filters.searchTerm && (
                  <span className="px-2 py-1 text-xs bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded">
                    Arama: {filters.searchTerm}
                  </span>
                )}
                {filters.searchType !== 'all' && (
                  <span className="px-2 py-1 text-xs bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded">
                    Tip: {searchTypeLabels[filters.searchType as keyof typeof searchTypeLabels]}
                  </span>
                )}
                {filters.status && (
                  <span className="px-2 py-1 text-xs bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded">
                    Durum: {statusOptions.find(s => s.value === filters.status)?.label}
                  </span>
                )}
                {filters.priority && (
                  <span className="px-2 py-1 text-xs bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded">
                    Öncelik: {priorityOptions.find(p => p.value === filters.priority)?.label}
                  </span>
                )}
                {filters.assignedTo && (
                  <span className="px-2 py-1 text-xs bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded">
                    Atanan: {filters.assignedTo}
                  </span>
                )}
                {(filters.dateRange.start || filters.dateRange.end) && (
                  <span className="px-2 py-1 text-xs bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded">
                    Tarih: {filters.dateRange.start} - {filters.dateRange.end}
                  </span>
                )}
                {(filters.amountRange.min !== '' || filters.amountRange.max !== '') && (
                  <span className="px-2 py-1 text-xs bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded">
                    Tutar: {filters.amountRange.min || '0'} - {filters.amountRange.max || '∞'}
                  </span>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Arama Sonuçları */}
      {showResults && (
        <div className="border-t border-gray-200 dark:border-gray-700">
          <div className="p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Arama Sonuçları
              </h3>
              <div className="text-sm text-gray-500 dark:text-gray-400">
                {isSearching ? (
                  <span className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                    Aranıyor...
                  </span>
                ) : (
                  `${searchResults.length} sonuç bulundu`
                )}
              </div>
            </div>

            {searchResults.length > 0 ? (
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {/* Sonuç İstatistikleri */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-4">
                  <div className="bg-blue-50 dark:bg-blue-900/20 p-2 rounded-lg text-center">
                    <div className="text-lg font-bold text-blue-600 dark:text-blue-400">
                      {searchResults.filter(r => r.type === 'ticket').length}
                    </div>
                    <div className="text-xs text-blue-600 dark:text-blue-400">Talep</div>
                  </div>
                  <div className="bg-green-50 dark:bg-green-900/20 p-2 rounded-lg text-center">
                    <div className="text-lg font-bold text-green-600 dark:text-green-400">
                      {searchResults.filter(r => r.type === 'customer').length}
                    </div>
                    <div className="text-xs text-green-600 dark:text-green-400">Müşteri</div>
                  </div>
                  <div className="bg-purple-50 dark:bg-purple-900/20 p-2 rounded-lg text-center">
                    <div className="text-lg font-bold text-purple-600 dark:text-purple-400">
                      {searchResults.filter(r => r.type === 'agent').length}
                    </div>
                    <div className="text-xs text-purple-600 dark:text-purple-400">Temsilci</div>
                  </div>
                  <div className="bg-orange-50 dark:bg-orange-900/20 p-2 rounded-lg text-center">
                    <div className="text-lg font-bold text-orange-600 dark:text-orange-400">
                      {searchResults.filter(r => r.type === 'payment').length}
                    </div>
                    <div className="text-xs text-orange-600 dark:text-orange-400">Ödeme</div>
                  </div>
                </div>

                {/* Sonuçlar */}
                {searchResults.map((result, index) => (
                  <button
                    key={`${result.type}-${result.id}-${index}`}
                    onClick={result.action}
                    className="w-full p-4 text-left bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-xl border border-gray-200 dark:border-gray-600 transition-all duration-200 hover:shadow-md hover:border-blue-300 dark:hover:border-blue-500"
                  >
                    <div className="flex items-start gap-4">
                      <div className="flex-shrink-0 mt-1">
                        {result.type === 'ticket' && (
                          <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                            <MessageSquare className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                          </div>
                        )}
                        {result.type === 'customer' && (
                          <div className="w-10 h-10 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center">
                            <User className="w-5 h-5 text-green-600 dark:text-green-400" />
                          </div>
                        )}
                        {result.type === 'agent' && (
                          <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center">
                            <User className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                          </div>
                        )}
                        {result.type === 'payment' && (
                          <div className="w-10 h-10 bg-orange-100 dark:bg-orange-900/30 rounded-lg flex items-center justify-center">
                            <CreditCard className="w-5 h-5 text-orange-600 dark:text-orange-400" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex-1">
                            <h4 className="font-semibold text-gray-900 dark:text-white text-base mb-1">
                              {result.title}
                            </h4>
                            <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                              {result.subtitle}
                            </p>
                          </div>
                          <div className="flex flex-col items-end gap-1">
                            {result.amount && (
                              <span className="text-lg font-bold text-green-600 dark:text-green-400">
                                {result.amount.toLocaleString('tr-TR')} TL
                              </span>
                            )}
                            <span className="text-xs text-gray-500 dark:text-gray-500">
                              {result.date ? new Date(result.date).toLocaleDateString('tr-TR', {
                                day: '2-digit',
                                month: '2-digit',
                                year: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                              }) : 'Tarih yok'}
                            </span>
                          </div>
                        </div>
                        
                        <p className="text-sm text-gray-700 dark:text-gray-300 mb-3 leading-relaxed">
                          {result.description}
                        </p>
                        
                        <div className="flex items-center gap-2 flex-wrap">
                          {result.status && (
                            <span className={`px-3 py-1 text-xs font-medium rounded-full ${
                              result.status === 'open' ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300' :
                              result.status === 'resolved' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300' :
                              result.status === 'in_progress' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300' :
                              result.status === 'completed' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300' :
                              result.status === 'pending' ? 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300' :
                              'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300'
                            }`}>
                              {result.status === 'open' ? 'Açık' :
                               result.status === 'resolved' ? 'Çözüldü' :
                               result.status === 'in_progress' ? 'İşlemde' :
                               result.status === 'completed' ? 'Tamamlandı' :
                               result.status === 'pending' ? 'Beklemede' :
                               result.status}
                            </span>
                          )}
                          {result.priority && (
                            <span className={`px-3 py-1 text-xs font-medium rounded-full ${
                              result.priority === 'high' ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300' :
                              result.priority === 'medium' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300' :
                              result.priority === 'low' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300' :
                              'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300'
                            }`}>
                              {result.priority === 'high' ? 'Yüksek' :
                               result.priority === 'medium' ? 'Orta' :
                               result.priority === 'low' ? 'Düşük' :
                               result.priority}
                            </span>
                          )}
                          <span className={`px-3 py-1 text-xs font-medium rounded-full ${
                            result.type === 'ticket' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300' :
                            result.type === 'customer' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300' :
                            result.type === 'agent' ? 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300' :
                            'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300'
                          }`}>
                            {result.type === 'ticket' ? 'Talep' :
                             result.type === 'customer' ? 'Müşteri' :
                             result.type === 'agent' ? 'Temsilci' :
                             'Ödeme'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            ) : !isSearching ? (
              <div className="text-center py-8">
                <Search className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-500 dark:text-gray-400 mb-2">
                  Arama kriterlerinize uygun sonuç bulunamadı
                </p>
                <p className="text-sm text-gray-400 dark:text-gray-500">
                  Farklı anahtar kelimeler veya filtreler deneyin
                </p>
              </div>
            ) : null}
          </div>
        </div>
      )}
    </div>
  );
};

export default AdvancedSearch;
