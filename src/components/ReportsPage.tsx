import React, { useState } from 'react';
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
  const [dateRange, setDateRange] = useState('Son 7 Gün');
  const [reportType, setReportType] = useState('Genel Bakış');

  // Sample data for charts
  const weeklyData = [
    { name: 'Pzt', gelen: 45, cozulen: 38 },
    { name: 'Sal', gelen: 78, cozulen: 65 },
    { name: 'Çar', gelen: 52, cozulen: 48 },
    { name: 'Per', gelen: 89, cozulen: 72 },
    { name: 'Cum', gelen: 95, cozulen: 85 },
    { name: 'Cmt', gelen: 34, cozulen: 32 },
    { name: 'Paz', gelen: 28, cozulen: 26 }
  ];

  const categoryData = [
    { name: 'Teknik Destek', value: 45, color: '#3B82F6' },
    { name: 'İade/Değişim', value: 38, color: '#10B981' },
    { name: 'Sipariş', value: 32, color: '#F59E0B' },
    { name: 'Kargo', value: 25, color: '#EF4444' },
    { name: 'Ödeme', value: 16, color: '#8B5CF6' }
  ];

  const agentPerformance = [
    { name: 'Mehmet Özkan', avatar: 'MO', solved: 42, rating: 4.9, color: '#3B82F6' },
    { name: 'Ayşe Demir', avatar: 'AD', solved: 38, rating: 4.8, color: '#10B981' },
    { name: 'Can Yıldız', avatar: 'CY', solved: 35, rating: 4.7, color: '#F59E0B' },
    { name: 'Zeynep Kara', avatar: 'ZK', solved: 27, rating: 4.6, color: '#EF4444' }
  ];

  const stats = [
    {
      title: 'Toplam Talepler',
      value: '156',
      change: '+12%',
      trend: 'up',
      icon: MessageSquare,
      color: 'blue'
    },
    {
      title: 'Çözülen Talepler',
      value: '142',
      change: '+8%',
      trend: 'up',
      icon: CheckCircle,
      color: 'green'
    },
    {
      title: 'Ortalama Yanıt Süresi',
      value: '2.1 saat',
      change: '-15 dk',
      trend: 'down',
      icon: Clock,
      color: 'orange'
    },
    {
      title: 'Müşteri Memnuniyeti',
      value: '4.8',
      change: '+0.3',
      trend: 'up',
      icon: Star,
      color: 'purple'
    },
    {
      title: 'Aktif Temsilciler',
      value: '8',
      change: '0',
      trend: 'neutral',
      icon: UserCheck,
      color: 'indigo'
    },
    {
      title: 'Bekleyen Talepler',
      value: '14',
      change: '-5',
      trend: 'down',
      icon: AlertCircle,
      color: 'yellow'
    }
  ];

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

  const handleExport = () => {
    // Export functionality
    console.log('Exporting report...');
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
            className="inline-flex items-center px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
          >
            <Download className="w-4 h-4 mr-2" />
            Rapor İndir
          </button>
          <button className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium">
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
              <option value="Son 7 Gün">Son 7 Gün</option>
              <option value="Son 30 Gün">Son 30 Gün</option>
              <option value="Son 3 Ay">Son 3 Ay</option>
              <option value="Son 1 Yıl">Son 1 Yıl</option>
            </select>
          </div>
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-gray-400" />
            <select
              value={reportType}
              onChange={(e) => setReportType(e.target.value)}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="Genel Bakış">Genel Bakış</option>
              <option value="Temsilci Performansı">Temsilci Performansı</option>
              <option value="Kategori Analizi">Kategori Analizi</option>
              <option value="Müşteri Memnuniyeti">Müşteri Memnuniyeti</option>
            </select>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {stats.map((stat, index) => {
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
        })}
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
            </ResponsiveContainer>
          </div>
        </div>

        {/* Category Distribution */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">Kategori Dağılımı</h3>
          <div className="space-y-4">
            {categoryData.map((category, index) => (
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
            ))}
          </div>
        </div>
      </div>

      {/* Agent Performance */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">Temsilci Performansı</h3>
        <div className="space-y-4">
          {agentPerformance.map((agent, index) => (
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
          ))}
        </div>
      </div>
    </div>
  );
};

export default ReportsPage;