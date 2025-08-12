import React, { useState } from 'react';
import { useSupabase } from '../hooks/useSupabase';
import { toast } from 'react-hot-toast';
import { 
  Download, 
  Filter, 
  Calendar,
  TrendingUp,
  TrendingDown,
  MessageSquare,
  CheckCircle,
  Clock,
  Users,
  Star,
  UserCheck,
  AlertCircle
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  Area,
  AreaChart
} from 'recharts';

const ReportsPage: React.FC = () => {
  const {
    loading,
    tickets,
    customers,
    agents,
    fetchTickets,
    fetchCustomers,
    fetchAgents
  } = useSupabase();

  const [dateRange, setDateRange] = useState('last7days');
  const [reportType, setReportType] = useState('overview');
  const [isExporting, setIsExporting] = useState(false);
  const [filteredTickets, setFilteredTickets] = useState<any[]>([]);
  const [filteredCustomers, setFilteredCustomers] = useState<any[]>([]);
  const [filteredAgents, setFilteredAgents] = useState<any[]>([]);

  // Tarih filtreleme fonksiyonu
  const filterByDateRange = (data: any[], dateField: string = 'created_at') => {
    const now = new Date();
    let startDate = new Date();

    switch (dateRange) {
      case 'last7days':
        startDate.setDate(now.getDate() - 7);
        break;
      case 'last30days':
        startDate.setDate(now.getDate() - 30);
        break;
      case 'last3months':
        startDate.setMonth(now.getMonth() - 3);
        break;
      case 'last1year':
        startDate.setFullYear(now.getFullYear() - 1);
        break;
      default:
        startDate.setDate(now.getDate() - 7);
    }

    return data.filter(item => {
      const itemDate = new Date(item[dateField]);
      return itemDate >= startDate && itemDate <= now;
    });
  };

  // Filtreleri uygula
  const applyFilters = () => {
    let newFilteredTickets = filterByDateRange(tickets);
    let newFilteredCustomers = filterByDateRange(customers);
    let newFilteredAgents = filterByDateRange(agents);

    setFilteredTickets(newFilteredTickets);
    setFilteredCustomers(newFilteredCustomers);
    setFilteredAgents(newFilteredAgents);
  };

  // Filtreler değiştiğinde uygula
  React.useEffect(() => {
    if (tickets.length > 0 || customers.length > 0 || agents.length > 0) {
      applyFilters();
    }
  }, [dateRange, reportType, tickets, customers, agents]);

  // Rapor türüne göre istatistikleri hesapla
  const calculateStats = () => {
    let displayTickets = filteredTickets;
    let displayCustomers = filteredCustomers;
    let displayAgents = filteredAgents;

    // Rapor türüne göre ek filtreler
    switch (reportType) {
      case 'agent_performance':
        displayAgents = filteredAgents.filter(agent => agent.total_resolved > 0);
        displayTickets = filteredTickets.filter(t => t.agent_id && displayAgents.some(a => a.id === t.agent_id));
        break;
      case 'category_analysis':
        // Kategori analizi için tüm talepler
        break;
      case 'customer_satisfaction':
        displayCustomers = filteredCustomers.filter(customer => customer.satisfaction_score > 0);
        displayTickets = filteredTickets.filter(t => t.customer_id && displayCustomers.some(c => c.id === t.customer_id));
        break;
      default:
        // Genel bakış için tüm veriler
        break;
    }

    const totalTickets = displayTickets.length;
    const resolvedTickets = displayTickets.filter(t => t.status === 'resolved').length;
    const openTickets = displayTickets.filter(t => t.status === 'open').length;
    const inProgressTickets = displayTickets.filter(t => t.status === 'in_progress').length;
    const activeAgents = displayAgents.filter(a => a.status === 'online').length;
    
    // Ortalama yanıt süresi hesaplama (örnek)
    const avgResponseTime = totalTickets > 0 ? '2.1 saat' : '0 saat';
    
    // Müşteri memnuniyeti ortalaması
    const avgSatisfaction = displayCustomers.length > 0 
      ? (displayCustomers.reduce((sum, c) => sum + c.satisfaction_score, 0) / displayCustomers.length).toFixed(1)
      : '0';

    return {
      totalTickets,
      resolvedTickets,
      openTickets,
      inProgressTickets,
      activeAgents,
      avgResponseTime,
      avgSatisfaction,
      displayTickets,
      displayCustomers,
      displayAgents
    };
  };

  const stats = calculateStats();

  // Gerçek verilerden haftalık trend oluştur
  const generateWeeklyData = () => {
    const days = ['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz'];
    const now = new Date();
    const ticketsToUse = stats.displayTickets;
    
    return days.map((day, index) => {
      const date = new Date(now);
      date.setDate(date.getDate() - (6 - index));
      
      const dayTickets = ticketsToUse.filter(ticket => {
        const ticketDate = new Date(ticket.created_at);
        return ticketDate.toDateString() === date.toDateString();
      });
      
      const resolvedToday = dayTickets.filter(t => t.status === 'resolved').length;
      
      return {
        name: day,
        gelen: dayTickets.length,
        cozulen: resolvedToday
      };
    });
  };

  const weeklyData = generateWeeklyData();

  // Gerçek verilerden kategori dağılımı oluştur
  const generateCategoryData = () => {
    const ticketsToUse = stats.displayTickets;
    
    const categories = {
      'Teknik Destek': { count: 0, color: '#3B82F6' },
      'İade/Değişim': { count: 0, color: '#10B981' },
      'Sipariş': { count: 0, color: '#F59E0B' },
      'Kargo': { count: 0, color: '#EF4444' },
      'Ödeme': { count: 0, color: '#8B5CF6' },
      'Genel': { count: 0, color: '#6B7280' }
    };

    ticketsToUse.forEach(ticket => {
      const category = ticket.category || 'Genel';
      const categoryName = category === 'technical' ? 'Teknik Destek' :
                          category === 'billing' ? 'Ödeme' :
                          category === 'support' ? 'İade/Değişim' :
                          'Genel';
      
      if (categories[categoryName]) {
        categories[categoryName].count++;
      } else {
        categories['Genel'].count++;
      }
    });

    return Object.entries(categories)
      .filter(([_, data]) => data.count > 0)
      .map(([name, data]) => ({
        name,
        value: data.count,
        color: data.color
      }));
  };

  const categoryData = generateCategoryData();

  // Gerçek verilerden temsilci performansı oluştur
  const generateAgentPerformance = () => {
    const colors = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'];
    const agentsToUse = stats.displayAgents;
    const ticketsToUse = stats.displayTickets;
    
    return agentsToUse.slice(0, 4).map((agent, index) => {
      const agentTickets = ticketsToUse.filter(t => t.agent_id === agent.id);
      const solvedTickets = agentTickets.filter(t => t.status === 'resolved').length;
      
      return {
        name: agent.name,
        avatar: agent.name.split(' ').map(n => n[0]).join(''),
        solved: solvedTickets,
        rating: (4.5 + Math.random() * 0.5).toFixed(1), // Simulated rating
        color: colors[index % colors.length]
      };
    });
  };

  const agentPerformance = generateAgentPerformance();

  const getDateRangeText = (range: string) => {
    const ranges = {
      'last7days': 'Son 7 Gün',
      'last30days': 'Son 30 Gün',
      'last3months': 'Son 3 Ay',
      'last1year': 'Son 1 Yıl'
    };
    return ranges[range as keyof typeof ranges] || 'Son 7 Gün';
  };

  const getReportTypeText = (type: string) => {
    const types = {
      'overview': 'Genel Bakış',
      'agent_performance': 'Temsilci Performansı',
      'category_analysis': 'Kategori Analizi',
      'customer_satisfaction': 'Müşteri Memnuniyeti'
    };
    return types[type as keyof typeof types] || 'Genel Bakış';
  };

  // Rapor türüne göre farklı stat kartları göster
  const getStatsCards = () => {
    const baseCards = [
      {
        title: 'Toplam Talepler',
        value: stats.totalTickets.toString(),
        change: '+12%',
        trend: 'up',
        icon: MessageSquare,
        color: 'blue'
      },
      {
        title: 'Çözülen Talepler',
        value: stats.resolvedTickets.toString(),
        change: '+8%',
        trend: 'up',
        icon: CheckCircle,
        color: 'green'
      }
    ];

    if (reportType === 'agent_performance') {
      return [
        ...baseCards,
        {
          title: 'Aktif Temsilciler',
          value: stats.activeAgents.toString(),
          change: '0',
          trend: 'neutral',
          icon: UserCheck,
          color: 'indigo'
        },
        {
          title: 'Ortalama Çözüm',
          value: stats.displayAgents.length > 0 ? Math.round(stats.resolvedTickets / stats.displayAgents.length).toString() : '0',
          change: '+2',
          trend: 'up',
          icon: Star,
          color: 'purple'
        }
      ];
    } else if (reportType === 'customer_satisfaction') {
      return [
        ...baseCards,
        {
          title: 'Müşteri Memnuniyeti',
          value: stats.avgSatisfaction,
          change: '+0.3',
          trend: 'up',
          icon: Star,
          color: 'purple'
        },
        {
          title: 'Değerlendiren Müşteri',
          value: stats.displayCustomers.length.toString(),
          change: '+5',
          trend: 'up',
          icon: Users,
          color: 'indigo'
        }
      ];
    } else {
      return [
        ...baseCards,
        {
          title: 'Ortalama Yanıt Süresi',
          value: stats.avgResponseTime,
          change: '-15 dk',
          trend: 'down',
          icon: Clock,
          color: 'orange'
        },
        {
          title: 'Müşteri Memnuniyeti',
          value: stats.avgSatisfaction,
          change: '+0.3',
          trend: 'up',
          icon: Star,
          color: 'purple'
        },
        {
          title: 'Aktif Temsilciler',
          value: stats.activeAgents.toString(),
          change: '0',
          trend: 'neutral',
          icon: UserCheck,
          color: 'indigo'
        },
        {
          title: 'Bekleyen Talepler',
          value: stats.openTickets.toString(),
          change: '-5',
          trend: 'down',
          icon: AlertCircle,
          color: 'yellow'
        }
      ];
    }
  };

  const statsCards = getStatsCards();

  // Rapor başlığını dinamik yap
  const getReportTitle = () => {
    switch (reportType) {
      case 'agent_performance':
        return 'Temsilci Performans Raporu';
      case 'category_analysis':
        return 'Kategori Analiz Raporu';
      case 'customer_satisfaction':
        return 'Müşteri Memnuniyet Raporu';
      default:
        return 'Genel Bakış Raporu';
    }
  };

  React.useEffect(() => {
    fetchTickets();
    fetchCustomers();
    fetchAgents();
  }, []);

  const getStatColor = (color: string) => {
    const colors = {
      blue: 'bg-blue-500',
      green: 'bg-green-500',
      orange: 'bg-orange-500',
      purple: 'bg-purple-500',
      indigo: 'bg-indigo-500',
      yellow: 'bg-yellow-500'
    };
    return colors[color as keyof typeof colors] || 'bg-gray-500';
  };

  const getTrendColor = (trend: string) => {
    switch (trend) {
      case 'up': return 'text-green-600';
      case 'down': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up': return <TrendingUp className="w-4 h-4" />;
      case 'down': return <TrendingDown className="w-4 h-4" />;
      default: return null;
    }
  };

  const handleExport = async () => {
    setIsExporting(true);
    try {
      // Rapor verilerini hazırla
      const reportData = {
        date: new Date().toISOString(),
        dateRange: getDateRangeText(dateRange),
        reportType: getReportTypeText(reportType),
        stats: statsCards,
        weeklyData,
        categoryData,
        agentPerformance,
        totalTickets: stats.displayTickets.length,
        totalCustomers: stats.displayCustomers.length,
        totalAgents: stats.displayAgents.length
      };

      // JSON formatında indir
      const dataStr = JSON.stringify(reportData, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(dataBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${getReportTitle().toLowerCase().replace(/\s+/g, '-')}-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast.success('Rapor başarıyla indirildi!');
    } catch (error) {
      toast.error('Rapor indirme başarısız!');
      console.error('Export error:', error);
    } finally {
      setIsExporting(false);
    }
  };

  const handleFilterChange = () => {
    toast.success(`Filtre uygulandı: ${getDateRangeText(dateRange)} - ${getReportTypeText(reportType)}`);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{getReportTitle()}</h1>
          <p className="text-gray-600 dark:text-gray-400">
            {getDateRangeText(dateRange)} - {stats.totalTickets} talep analizi
          </p>
        </div>
    {
      title: 'Toplam Talepler',
      value: stats.totalTickets.toString(),
      change: '+12%',
      trend: 'up',
      icon: MessageSquare,
      color: 'blue'
    },
    {
      title: 'Çözülen Talepler',
      value: stats.resolvedTickets.toString(),
      change: '+8%',
      trend: 'up',
      icon: CheckCircle,
      color: 'green'
    },
    {
      title: 'Ortalama Yanıt Süresi',
      value: stats.avgResponseTime,
      change: '-15 dk',
      trend: 'down',
      icon: Clock,
      color: 'orange'
    },
    {
      title: 'Müşteri Memnuniyeti',
      value: stats.avgSatisfaction,
      change: '+0.3',
      trend: 'up',
      icon: Star,
      color: 'purple'
    },
    {
      title: 'Aktif Temsilciler',
      value: stats.activeAgents.toString(),
      change: '0',
      trend: 'neutral',
      icon: UserCheck,
      color: 'indigo'
    },
    {
      title: 'Bekleyen Talepler',
      value: stats.openTickets.toString(),
      change: '-5',
      trend: 'down',
      icon: AlertCircle,
      color: 'yellow'
    }
  ];

  React.useEffect(() => {
    fetchTickets();
    fetchCustomers();
    fetchAgents();
  }, []);

  const getStatColor = (color: string) => {
    const colors = {
      blue: 'bg-blue-500',
      green: 'bg-green-500',
      orange: 'bg-orange-500',
      purple: 'bg-purple-500',
      indigo: 'bg-indigo-500',
      yellow: 'bg-yellow-500'
    };
    return colors[color as keyof typeof colors] || 'bg-gray-500';
  };

  const getTrendColor = (trend: string) => {
    switch (trend) {
      case 'up': return 'text-green-600';
      case 'down': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up': return <TrendingUp className="w-4 h-4" />;
      case 'down': return <TrendingDown className="w-4 h-4" />;
      default: return null;
    }
  };

  const handleExport = async () => {
    setIsExporting(true);
    try {
      // Rapor verilerini hazırla
      const reportData = {
        date: new Date().toISOString(),
        dateRange: getDateRangeText(dateRange),
        reportType: getReportTypeText(reportType),
        stats: statsCards,
        weeklyData,
        categoryData,
        agentPerformance,
        totalTickets: tickets.length,
        totalCustomers: customers.length,
        totalAgents: agents.length
      };

      // JSON formatında indir
      const dataStr = JSON.stringify(reportData, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(dataBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `destek-raporu-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast.success('Rapor başarıyla indirildi!');
    } catch (error) {
      toast.error('Rapor indirme başarısız!');
      console.error('Export error:', error);
    } finally {
      setIsExporting(false);
    }
  };

  const handleFilterChange = () => {
    applyFilters();
    toast.success(`Filtre uygulandı: ${getDateRangeText(dateRange)} - ${getReportTypeText(reportType)}`);
    // Burada filtreleme mantığı eklenebilir
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Raporlar ve Analitik</h1>
          <p className="text-gray-600 dark:text-gray-400">Destek sistemi performans raporları</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleExport}
            disabled={isExporting}
            className="inline-flex items-center px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Download className="w-4 h-4 mr-2" />
            {isExporting ? 'İndiriliyor...' : 'Rapor İndir'}
          </button>
          <button 
            onClick={handleFilterChange}
            className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium"
          >
            <Filter className="w-4 h-4 mr-2" />
            Filtrele
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-gray-400" />
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="last7days">Son 7 Gün</option>
              <option value="last30days">Son 30 Gün</option>
              <option value="last3months">Son 3 Ay</option>
              <option value="last1year">Son 1 Yıl</option>
            </select>
          </div>
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-gray-400" />
            <select
              value={reportType}
              onChange={(e) => setReportType(e.target.value)}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="overview">Genel Bakış</option>
              <option value="agent_performance">Temsilci Performansı</option>
              <option value="category_analysis">Kategori Analizi</option>
              <option value="customer_satisfaction">Müşteri Memnuniyeti</option>
            </select>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          <div className="col-span-full flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-3 text-gray-500 dark:text-gray-400">Veriler yükleniyor...</span>
          </div>
        ) : (
          statsCards.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <div key={index} className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between mb-4">
                <div className={`w-12 h-12 ${getStatColor(stat.color)} rounded-lg flex items-center justify-center`}>
                  <Icon className="w-6 h-6 text-white" />
                </div>
                <div className={`flex items-center gap-1 text-sm font-medium ${getTrendColor(stat.trend)}`}>
                  {getTrendIcon(stat.trend)}
                  <span>{stat.change}</span>
                </div>
              </div>
              <div>
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">{stat.value}</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">{stat.title}</p>
              </div>
            </div>
          );
          })
        )}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Weekly Trend Chart */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Haftalık Talep Trendi</h3>
            <div className="flex items-center gap-4 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                <span className="text-gray-600 dark:text-gray-400">Gelen Talepler</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <span className="text-gray-600 dark:text-gray-400">Çözülen Talepler</span>
              </div>
            </div>
          </div>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              {weeklyData.length > 0 ? (
                <BarChart data={weeklyData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.3} />
                  <XAxis 
                    dataKey="name" 
                    stroke="#6B7280"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis 
                    stroke="#6B7280"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                  />
                  <Tooltip 
                    contentStyle={{
                      backgroundColor: '#1F2937',
                      border: 'none',
                      borderRadius: '8px',
                      color: '#F9FAFB'
                    }}
                  />
                  <Bar dataKey="gelen" fill="#3B82F6" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="cozulen" fill="#10B981" radius={[4, 4, 0, 0]} />
                </BarChart>
              ) : (
                <div className="flex items-center justify-center h-full text-gray-500 dark:text-gray-400">
                  Henüz veri bulunmuyor
                </div>
              )}
            </ResponsiveContainer>
          </div>
        </div>

        {/* Category Distribution */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">Kategori Dağılımı</h3>
          <div className="space-y-4">
            {categoryData.length > 0 ? categoryData.map((category, index) => (
              <div key={index} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div 
                    className="w-4 h-4 rounded-full"
                    style={{ backgroundColor: category.color }}
                  ></div>
                  <span className="text-sm font-medium text-gray-900 dark:text-white">
                    {category.name}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-24 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <div 
                      className="h-2 rounded-full"
                      style={{ 
                        backgroundColor: category.color,
                        width: `${(category.value / 45) * 100}%`
                      }}
                    ></div>
                  </div>
                  <span className="text-sm font-semibold text-gray-900 dark:text-white w-8 text-right">
                    {category.value}
                  </span>
                </div>
              </div>
            )) : (
              <div className="text-center text-gray-500 dark:text-gray-400 py-8">
                Henüz kategori verisi bulunmuyor
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Agent Performance */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">Temsilci Performansı</h3>
        <div className="space-y-4">
          {agentPerformance.length > 0 ? agentPerformance.map((agent, index) => (
            <div key={index} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <div className="flex items-center gap-4">
                <div 
                  className="w-12 h-12 rounded-full flex items-center justify-center text-white font-semibold"
                  style={{ backgroundColor: agent.color }}
                >
                  {agent.avatar}
                </div>
                <div>
                  <h4 className="font-medium text-gray-900 dark:text-white">{agent.name}</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">{agent.solved} çözülen</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Star className="w-4 h-4 text-yellow-500 fill-current" />
                <span className="font-semibold text-gray-900 dark:text-white">{agent.rating}</span>
              </div>
            </div>
          )) : (
            <div className="text-center text-gray-500 dark:text-gray-400 py-8">
              Henüz temsilci performans verisi bulunmuyor
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ReportsPage;