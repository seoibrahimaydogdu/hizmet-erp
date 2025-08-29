import React, { useState, useEffect } from 'react';
import {
  BarChart3,
  PieChart,
  TrendingUp,
  TrendingDown,
  Users,
  ShoppingCart,
  Mail,
  MessageSquare,
  Phone,
  Twitter,
  Facebook,
  Instagram,
  Linkedin,
  Youtube,
  Globe,
  Calendar,
  DollarSign,
  Target,
  ArrowUpRight,
  ArrowDownRight,
  Eye,
  Filter,
  Download,
  RefreshCw,
  Settings,
  Info,
  AlertCircle,
  CheckCircle,
  Clock,
  Star,
  Heart,
  Zap
} from 'lucide-react';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';
import { toast } from 'react-hot-toast';

interface ChannelData {
  id: string;
  name: string;
  icon: React.ReactNode;
  color: string;
  visits: number;
  conversions: number;
  conversionRate: number;
  revenue: number;
  avgOrderValue: number;
  customerSatisfaction: number;
  responseTime: number;
  costPerAcquisition: number;
  roi: number;
  trend: 'up' | 'down' | 'stable';
  trendPercentage: number;
}

interface PurchaseJourney {
  stage: string;
  channel: string;
  visitors: number;
  conversions: number;
  conversionRate: number;
  dropoffRate: number;
  avgTimeSpent: number;
  cost: number;
  revenue: number;
}

interface CustomerSegment {
  segment: string;
  channel: string;
  count: number;
  avgValue: number;
  satisfaction: number;
  retentionRate: number;
  preferredChannels: string[];
}

const ChannelAnalysis: React.FC = () => {
  const [timeRange, setTimeRange] = useState('30d');
  const [selectedChannel, setSelectedChannel] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'overview' | 'journey' | 'segments'>('overview');
  const [isLoading, setIsLoading] = useState(false);

  // Kanal verileri
  const [channelData, setChannelData] = useState<ChannelData[]>([
    {
      id: 'email',
      name: 'E-posta',
      icon: <Mail className="w-5 h-5" />,
      color: 'bg-blue-500',
      visits: 15420,
      conversions: 1234,
      conversionRate: 8.0,
      revenue: 45600,
      avgOrderValue: 37.0,
      customerSatisfaction: 4.2,
      responseTime: 2.5,
      costPerAcquisition: 12.5,
      roi: 364.8,
      trend: 'up',
      trendPercentage: 15.3
    },
    {
      id: 'chat',
      name: 'Canlı Chat',
      icon: <MessageSquare className="w-5 h-5" />,
      color: 'bg-green-500',
      visits: 8920,
      conversions: 987,
      conversionRate: 11.1,
      revenue: 36500,
      avgOrderValue: 37.0,
      customerSatisfaction: 4.5,
      responseTime: 0.5,
      costPerAcquisition: 8.2,
      roi: 445.1,
      trend: 'up',
      trendPercentage: 22.7
    },
    {
      id: 'phone',
      name: 'Telefon',
      icon: <Phone className="w-5 h-5" />,
      color: 'bg-purple-500',
      visits: 5670,
      conversions: 456,
      conversionRate: 8.0,
      revenue: 16800,
      avgOrderValue: 36.8,
      customerSatisfaction: 4.3,
      responseTime: 1.2,
      costPerAcquisition: 15.8,
      roi: 233.0,
      trend: 'down',
      trendPercentage: -5.2
    },
    {
      id: 'twitter',
      name: 'Twitter',
      icon: <Twitter className="w-5 h-5" />,
      color: 'bg-blue-400',
      visits: 3420,
      conversions: 234,
      conversionRate: 6.8,
      revenue: 8650,
      avgOrderValue: 37.0,
      customerSatisfaction: 4.1,
      responseTime: 4.8,
      costPerAcquisition: 18.5,
      roi: 200.0,
      trend: 'up',
      trendPercentage: 8.9
    },
    {
      id: 'facebook',
      name: 'Facebook',
      icon: <Facebook className="w-5 h-5" />,
      color: 'bg-blue-600',
      visits: 2890,
      conversions: 189,
      conversionRate: 6.5,
      revenue: 7000,
      avgOrderValue: 37.0,
      customerSatisfaction: 3.9,
      responseTime: 6.2,
      costPerAcquisition: 22.1,
      roi: 158.4,
      trend: 'down',
      trendPercentage: -12.3
    },
    {
      id: 'linkedin',
      name: 'LinkedIn',
      icon: <Linkedin className="w-5 h-5" />,
      color: 'bg-blue-700',
      visits: 1560,
      conversions: 123,
      conversionRate: 7.9,
      revenue: 4550,
      avgOrderValue: 37.0,
      customerSatisfaction: 4.4,
      responseTime: 3.1,
      costPerAcquisition: 25.8,
      roi: 176.4,
      trend: 'up',
      trendPercentage: 18.7
    }
  ]);

  // Satın alma süreci verileri
  const [purchaseJourney, setPurchaseJourney] = useState<PurchaseJourney[]>([
    {
      stage: 'Awareness',
      channel: 'Social Media',
      visitors: 25000,
      conversions: 5000,
      conversionRate: 20.0,
      dropoffRate: 80.0,
      avgTimeSpent: 2.5,
      cost: 5000,
      revenue: 0
    },
    {
      stage: 'Consideration',
      channel: 'Website',
      visitors: 5000,
      conversions: 2000,
      conversionRate: 40.0,
      dropoffRate: 60.0,
      avgTimeSpent: 8.2,
      cost: 2000,
      revenue: 0
    },
    {
      stage: 'Decision',
      channel: 'Email/Chat',
      visitors: 2000,
      conversions: 1200,
      conversionRate: 60.0,
      dropoffRate: 40.0,
      avgTimeSpent: 15.5,
      cost: 1000,
      revenue: 44400
    },
    {
      stage: 'Purchase',
      channel: 'All Channels',
      visitors: 1200,
      conversions: 1200,
      conversionRate: 100.0,
      dropoffRate: 0.0,
      avgTimeSpent: 5.8,
      cost: 500,
      revenue: 44400
    }
  ]);

  // Müşteri segmentleri
  const [customerSegments, setCustomerSegments] = useState<CustomerSegment[]>([
    {
      segment: 'Yüksek Değerli',
      channel: 'Email',
      count: 450,
      avgValue: 89.5,
      satisfaction: 4.6,
      retentionRate: 92.3,
      preferredChannels: ['Email', 'Chat', 'Phone']
    },
    {
      segment: 'Orta Değerli',
      channel: 'Chat',
      count: 1200,
      avgValue: 45.2,
      satisfaction: 4.3,
      retentionRate: 78.5,
      preferredChannels: ['Chat', 'Email', 'Social']
    },
    {
      segment: 'Düşük Değerli',
      channel: 'Social',
      count: 2300,
      avgValue: 18.7,
      satisfaction: 3.8,
      retentionRate: 45.2,
      preferredChannels: ['Social', 'Email']
    }
  ]);

  const filteredChannelData = selectedChannel === 'all' 
    ? channelData 
    : channelData.filter(channel => channel.id === selectedChannel);

  const totalRevenue = channelData.reduce((sum, channel) => sum + channel.revenue, 0);
  const totalConversions = channelData.reduce((sum, channel) => sum + channel.conversions, 0);
  const avgConversionRate = totalConversions > 0 ? (totalConversions / channelData.reduce((sum, channel) => sum + channel.visits, 0)) * 100 : 0;

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up':
        return <ArrowUpRight className="w-4 h-4 text-green-500" />;
      case 'down':
        return <ArrowDownRight className="w-4 h-4 text-red-500" />;
      default:
        return <TrendingUp className="w-4 h-4 text-gray-500" />;
    }
  };

  const getTrendColor = (trend: string) => {
    switch (trend) {
      case 'up':
        return 'text-green-600 dark:text-green-400';
      case 'down':
        return 'text-red-600 dark:text-red-400';
      default:
        return 'text-gray-600 dark:text-gray-400';
    }
  };

  const handleExportData = () => {
    toast.success('Veriler dışa aktarılıyor...');
    // Export logic here
  };

  const handleRefreshData = async () => {
    setIsLoading(true);
    await new Promise(resolve => setTimeout(resolve, 2000));
    setIsLoading(false);
    toast.success('Veriler güncellendi');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            Kanal Analizi & Satın Alma Süreci
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            Hangi kanallardan müşteri geliyor ve satın alma sürecini nasıl optimize edebiliriz?
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
          >
            <option value="7d">Son 7 Gün</option>
            <option value="30d">Son 30 Gün</option>
            <option value="90d">Son 90 Gün</option>
            <option value="1y">Son 1 Yıl</option>
          </select>
          
          <button
            onClick={handleRefreshData}
            disabled={isLoading}
            className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
            title="Verileri Yenile"
          >
            <RefreshCw className={`w-5 h-5 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
          
          <button
            onClick={handleExportData}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 transition-colors flex items-center gap-2"
          >
            <Download className="w-4 h-4" />
            Dışa Aktar
          </button>
        </div>
      </div>

      {/* View Mode Tabs */}
      <div className="flex space-x-1 bg-gray-100 dark:bg-gray-800 p-1 rounded-lg">
        <button
          onClick={() => setViewMode('overview')}
          className={`flex-1 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            viewMode === 'overview'
              ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
              : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
          }`}
        >
          <BarChart3 className="w-4 h-4 inline mr-2" />
          Genel Bakış
        </button>
        <button
          onClick={() => setViewMode('journey')}
          className={`flex-1 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            viewMode === 'journey'
              ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
              : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
          }`}
        >
          <TrendingUp className="w-4 h-4 inline mr-2" />
          Satın Alma Süreci
        </button>
        <button
          onClick={() => setViewMode('segments')}
          className={`flex-1 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            viewMode === 'segments'
              ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
              : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
          }`}
        >
          <Users className="w-4 h-4 inline mr-2" />
          Müşteri Segmentleri
        </button>
      </div>

      {/* Overview Mode */}
      {viewMode === 'overview' && (
        <div className="space-y-6">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Toplam Gelir</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    ₺{totalRevenue.toLocaleString()}
                  </p>
                </div>
                <div className="bg-green-100 dark:bg-green-900/20 p-3 rounded-lg">
                  <DollarSign className="w-6 h-6 text-green-600 dark:text-green-400" />
                </div>
              </div>
              <div className="mt-4 flex items-center text-sm">
                <ArrowUpRight className="w-4 h-4 text-green-500 mr-1" />
                <span className="text-green-600 dark:text-green-400">+12.5%</span>
                <span className="text-gray-600 dark:text-gray-400 ml-1">geçen aya göre</span>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Toplam Dönüşüm</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {totalConversions.toLocaleString()}
                  </p>
                </div>
                <div className="bg-blue-100 dark:bg-blue-900/20 p-3 rounded-lg">
                  <Target className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                </div>
              </div>
              <div className="mt-4 flex items-center text-sm">
                <ArrowUpRight className="w-4 h-4 text-green-500 mr-1" />
                <span className="text-green-600 dark:text-green-400">+8.3%</span>
                <span className="text-gray-600 dark:text-gray-400 ml-1">geçen aya göre</span>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Ortalama Dönüşüm Oranı</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    %{avgConversionRate.toFixed(1)}
                  </p>
                </div>
                <div className="bg-purple-100 dark:bg-purple-900/20 p-3 rounded-lg">
                  <TrendingUp className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                </div>
              </div>
              <div className="mt-4 flex items-center text-sm">
                <ArrowUpRight className="w-4 h-4 text-green-500 mr-1" />
                <span className="text-green-600 dark:text-green-400">+2.1%</span>
                <span className="text-gray-600 dark:text-gray-400 ml-1">geçen aya göre</span>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Aktif Kanallar</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {channelData.filter(c => c.trend !== 'down').length}
                  </p>
                </div>
                <div className="bg-orange-100 dark:bg-orange-900/20 p-3 rounded-lg">
                  <Globe className="w-6 h-6 text-orange-600 dark:text-orange-400" />
                </div>
              </div>
              <div className="mt-4 flex items-center text-sm">
                <span className="text-gray-600 dark:text-gray-400">Performanslı kanallar</span>
              </div>
            </div>
          </div>

          {/* Channel Filter */}
          <div className="flex items-center gap-4">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Kanal Filtresi:
            </label>
            <select
              value={selectedChannel}
              onChange={(e) => setSelectedChannel(e.target.value)}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
            >
              <option value="all">Tüm Kanallar</option>
              {channelData.map(channel => (
                <option key={channel.id} value={channel.id}>{channel.name}</option>
              ))}
            </select>
          </div>

          {/* Channel Performance Table */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Kanal Performans Analizi
              </h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Kanal
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Ziyaretçi
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Dönüşüm
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Dönüşüm Oranı
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Gelir
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      ROI
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Trend
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {filteredChannelData.map((channel) => (
                    <tr key={channel.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${channel.color} text-white mr-3`}>
                            {channel.icon}
                          </div>
                          <div>
                            <div className="text-sm font-medium text-gray-900 dark:text-white">
                              {channel.name}
                            </div>
                            <div className="text-sm text-gray-500 dark:text-gray-400">
                              {channel.visits.toLocaleString()} ziyaretçi
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                        {channel.visits.toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                        {channel.conversions.toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <span className="text-sm font-medium text-gray-900 dark:text-white">
                            %{channel.conversionRate.toFixed(1)}
                          </span>
                          <div className="ml-2 w-16 bg-gray-200 dark:bg-gray-600 rounded-full h-2">
                            <div 
                              className="bg-blue-600 h-2 rounded-full" 
                              style={{ width: `${Math.min(channel.conversionRate * 10, 100)}%` }}
                            ></div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                        ₺{channel.revenue.toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                        %{channel.roi.toFixed(1)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          {getTrendIcon(channel.trend)}
                          <span className={`ml-1 text-sm font-medium ${getTrendColor(channel.trend)}`}>
                            {channel.trendPercentage > 0 ? '+' : ''}{channel.trendPercentage.toFixed(1)}%
                          </span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Journey Mode */}
      {viewMode === 'journey' && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">
              Satın Alma Süreci Analizi
            </h3>
            
            <div className="space-y-6">
              {purchaseJourney.map((stage, index) => (
                <div key={stage.stage} className="relative">
                  {/* Connection Line */}
                  {index < purchaseJourney.length - 1 && (
                    <div className="absolute left-6 top-16 w-0.5 h-8 bg-gray-300 dark:bg-gray-600"></div>
                  )}
                  
                  <div className="flex items-start space-x-4">
                    {/* Stage Number */}
                    <div className="flex-shrink-0 w-12 h-12 bg-blue-100 dark:bg-blue-900/20 rounded-full flex items-center justify-center">
                      <span className="text-blue-600 dark:text-blue-400 font-semibold">
                        {index + 1}
                      </span>
                    </div>
                    
                    {/* Stage Content */}
                    <div className="flex-1 bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="text-lg font-semibold text-gray-900 dark:text-white">
                          {stage.stage}
                        </h4>
                        <span className="text-sm text-gray-500 dark:text-gray-400">
                          {stage.channel}
                        </span>
                      </div>
                      
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div>
                          <p className="text-sm text-gray-600 dark:text-gray-400">Ziyaretçi</p>
                          <p className="text-lg font-semibold text-gray-900 dark:text-white">
                            {stage.visitors.toLocaleString()}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600 dark:text-gray-400">Dönüşüm</p>
                          <p className="text-lg font-semibold text-gray-900 dark:text-white">
                            {stage.conversions.toLocaleString()}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600 dark:text-gray-400">Dönüşüm Oranı</p>
                          <p className="text-lg font-semibold text-gray-900 dark:text-white">
                            %{stage.conversionRate.toFixed(1)}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600 dark:text-gray-400">Kayıp Oranı</p>
                          <p className="text-lg font-semibold text-red-600 dark:text-red-400">
                            %{stage.dropoffRate.toFixed(1)}
                          </p>
                        </div>
                      </div>
                      
                      <div className="mt-4 flex items-center justify-between text-sm">
                        <span className="text-gray-600 dark:text-gray-400">
                          Ortalama süre: {stage.avgTimeSpent} dakika
                        </span>
                        {stage.revenue > 0 && (
                          <span className="text-green-600 dark:text-green-400 font-medium">
                            Gelir: ₺{stage.revenue.toLocaleString()}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Segments Mode */}
      {viewMode === 'segments' && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">
              Müşteri Segmentleri ve Kanal Tercihleri
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {customerSegments.map((segment) => (
                <div key={segment.segment} className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="text-lg font-semibold text-gray-900 dark:text-white">
                      {segment.segment}
                    </h4>
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                      {segment.count} müşteri
                    </span>
                  </div>
                  
                  <div className="space-y-3">
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Ortalama Değer</p>
                      <p className="text-lg font-semibold text-gray-900 dark:text-white">
                        ₺{segment.avgValue.toFixed(1)}
                      </p>
                    </div>
                    
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Memnuniyet</p>
                      <div className="flex items-center">
                        <div className="flex items-center">
                          {[...Array(5)].map((_, i) => (
                            <Star
                              key={i}
                              className={`w-4 h-4 ${
                                i < Math.floor(segment.satisfaction)
                                  ? 'text-yellow-400 fill-current'
                                  : 'text-gray-300 dark:text-gray-600'
                              }`}
                            />
                          ))}
                        </div>
                        <span className="ml-2 text-sm text-gray-600 dark:text-gray-400">
                          {segment.satisfaction.toFixed(1)}
                        </span>
                      </div>
                    </div>
                    
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Tutma Oranı</p>
                      <p className="text-lg font-semibold text-gray-900 dark:text-white">
                        %{segment.retentionRate.toFixed(1)}
                      </p>
                    </div>
                    
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Tercih Edilen Kanallar</p>
                      <div className="flex flex-wrap gap-1">
                        {segment.preferredChannels.map((channel, index) => (
                          <span
                            key={channel}
                            className="px-2 py-1 bg-blue-100 dark:bg-blue-900/20 text-blue-800 dark:text-blue-400 text-xs rounded-full"
                          >
                            {channel}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChannelAnalysis;
