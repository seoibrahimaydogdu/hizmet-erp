import React, { useState, useMemo, useEffect } from 'react';
import { Sankey, Tooltip, ResponsiveContainer } from 'recharts';
import { 
  Users, 
  CheckCircle, 
  XCircle, 
  TrendingUp, 
  TrendingDown,
  Filter,
  Download,
  RefreshCw,
  Eye,
  BarChart3,
  Calendar,
  Target,
  Zap
} from 'lucide-react';
import { format, subDays } from 'date-fns';
import { tr } from 'date-fns/locale';
import { useSupabase } from '../hooks/useSupabase';
import { toast } from 'react-hot-toast';

interface CustomerJourneyData {
  nodes: Array<{
    name: string;
    category: string;
    color: string;
  }>;
  links: Array<{
    source: number;
    target: number;
    value: number;
    label?: string;
  }>;
}

interface JourneyMetrics {
  totalCustomers: number;
  conversionRate: number;
  dropOffRate: number;
  avgJourneyTime: number;
  topDropOffPoint: string;
  topConversionPoint: string;
}

const CustomerJourneySankey: React.FC = () => {
  const { 
    customers, 
    tickets, 
    payments, 
    subscriptions,
    fetchCustomers,
    fetchTickets,
    fetchPayments,
    fetchSubscriptions
  } = useSupabase();

  const [dateRange, setDateRange] = useState('30');
  const [selectedJourney, setSelectedJourney] = useState<'all' | 'new' | 'returning' | 'vip'>('all');
  const [isLoading, setIsLoading] = useState(false);
  const [showDetails, setShowDetails] = useState(false);

  // Verileri yükle
  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      try {
        await Promise.all([
          fetchCustomers(),
          fetchTickets(),
          fetchPayments(),
          fetchSubscriptions()
        ]);
      } catch (error) {
        console.error('Veri yükleme hatası:', error);
        toast.error('Veriler yüklenirken hata oluştu');
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, []);

  // Müşteri yolculuğu verilerini hesapla
  const journeyData = useMemo((): CustomerJourneyData => {
    const endDate = new Date();
    const startDate = subDays(endDate, parseInt(dateRange));

    // Filtrelenmiş veriler
    const filteredCustomers = customers.filter(customer => {
      const customerDate = new Date(customer.created_at);
      return customerDate >= startDate && customerDate <= endDate;
    });

    const filteredTickets = tickets.filter(ticket => {
      const ticketDate = new Date(ticket.created_at);
      return ticketDate >= startDate && ticketDate <= endDate;
    });

    const filteredPayments = payments.filter(payment => {
      if (!payment.payment_date) return false;
      const paymentDate = new Date(payment.payment_date);
      return paymentDate >= startDate && paymentDate <= endDate;
    });

    // Müşteri kategorileri
    let targetCustomers = filteredCustomers;
    if (selectedJourney === 'new') {
      targetCustomers = filteredCustomers.filter(c => {
        const customerDate = new Date(c.created_at);
        const daysSinceCreation = Math.floor((endDate.getTime() - customerDate.getTime()) / (1000 * 60 * 60 * 24));
        return daysSinceCreation <= 30;
      });
    } else if (selectedJourney === 'returning') {
      targetCustomers = filteredCustomers.filter(c => {
        const customerTickets = filteredTickets.filter(t => t.customer_id === c.id);
        return customerTickets.length > 1;
      });
    } else if (selectedJourney === 'vip') {
      targetCustomers = filteredCustomers.filter(c => {
        const customerPayments = filteredPayments.filter(p => p.customer_id === c.id);
        const totalSpent = customerPayments.reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0);
        return totalSpent > 1000; // VIP müşteri eşiği
      });
    }

    // Yolculuk aşamaları
    const stages = {
      'Web Ziyareti': targetCustomers.length,
      'Kayıt': 0,
      'İlk Talep': 0,
      'Destek Alımı': 0,
      'Ödeme': 0,
      'Abonelik': 0,
      'Memnuniyet': 0,
      'Tekrar Ziyaret': 0,
      'Ayrılma': 0
    };

    // Her müşteri için yolculuk analizi
    targetCustomers.forEach(customer => {
      const customerTickets = filteredTickets.filter(t => t.customer_id === customer.id);
      const customerPayments = filteredPayments.filter(p => p.customer_id === customer.id);
      const customerSubscriptions = subscriptions.filter(s => s.customer_id === customer.id);

      // Kayıt aşaması
      if (customer.created_at) {
        stages['Kayıt']++;
      }

      // İlk talep
      if (customerTickets.length > 0) {
        stages['İlk Talep']++;
      }

      // Destek alımı
      if (customerTickets.some(t => t.status === 'resolved' || t.status === 'closed')) {
        stages['Destek Alımı']++;
      }

      // Ödeme
      if (customerPayments.length > 0) {
        stages['Ödeme']++;
      }

      // Abonelik
      if (customerSubscriptions.length > 0) {
        stages['Abonelik']++;
      }

      // Memnuniyet
      if (customerTickets.some(t => t.satisfaction_rating && t.satisfaction_rating >= 4)) {
        stages['Memnuniyet']++;
      }

      // Tekrar ziyaret (birden fazla talep)
      if (customerTickets.length > 1) {
        stages['Tekrar Ziyaret']++;
      }

      // Ayrılma (son 30 günde talep yok)
      const lastTicket = customerTickets.sort((a, b) => 
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      )[0];
      if (lastTicket) {
        const daysSinceLastTicket = Math.floor((endDate.getTime() - new Date(lastTicket.created_at).getTime()) / (1000 * 60 * 60 * 24));
        if (daysSinceLastTicket > 30) {
          stages['Ayrılma']++;
        }
      }
    });

    // Sankey diyagramı için node'lar
    const nodes = [
      { name: 'Web Ziyareti', category: 'entry', color: '#3b82f6' },
      { name: 'Kayıt', category: 'conversion', color: '#10b981' },
      { name: 'İlk Talep', category: 'engagement', color: '#f59e0b' },
      { name: 'Destek Alımı', category: 'support', color: '#8b5cf6' },
      { name: 'Ödeme', category: 'revenue', color: '#ef4444' },
      { name: 'Abonelik', category: 'retention', color: '#06b6d4' },
      { name: 'Memnuniyet', category: 'satisfaction', color: '#84cc16' },
      { name: 'Tekrar Ziyaret', category: 'loyalty', color: '#f97316' },
      { name: 'Ayrılma', category: 'churn', color: '#6b7280' }
    ];

    // Sankey diyagramı için link'ler
    const links = [
      { source: 0, target: 1, value: stages['Kayıt'], label: 'Kayıt Oranı' },
      { source: 1, target: 2, value: stages['İlk Talep'], label: 'İlk Talep' },
      { source: 2, target: 3, value: stages['Destek Alımı'], label: 'Destek Alımı' },
      { source: 3, target: 4, value: stages['Ödeme'], label: 'Ödeme' },
      { source: 4, target: 5, value: stages['Abonelik'], label: 'Abonelik' },
      { source: 5, target: 6, value: stages['Memnuniyet'], label: 'Memnuniyet' },
      { source: 6, target: 7, value: stages['Tekrar Ziyaret'], label: 'Tekrar Ziyaret' },
      { source: 1, target: 8, value: Math.max(0, stages['Kayıt'] - stages['İlk Talep']), label: 'Kayıt Sonrası Ayrılma' },
      { source: 2, target: 8, value: Math.max(0, stages['İlk Talep'] - stages['Destek Alımı']), label: 'Talep Sonrası Ayrılma' },
      { source: 3, target: 8, value: Math.max(0, stages['Destek Alımı'] - stages['Ödeme']), label: 'Destek Sonrası Ayrılma' },
      { source: 4, target: 8, value: Math.max(0, stages['Ödeme'] - stages['Abonelik']), label: 'Ödeme Sonrası Ayrılma' },
      { source: 5, target: 8, value: Math.max(0, stages['Abonelik'] - stages['Memnuniyet']), label: 'Abonelik Sonrası Ayrılma' },
      { source: 6, target: 8, value: Math.max(0, stages['Memnuniyet'] - stages['Tekrar Ziyaret']), label: 'Memnuniyet Sonrası Ayrılma' }
    ].filter(link => link.value > 0);

    return { nodes, links };
  }, [customers, tickets, payments, subscriptions, dateRange, selectedJourney]);

  // Yolculuk metrikleri
  const journeyMetrics = useMemo((): JourneyMetrics => {
    const totalCustomers = journeyData.nodes[0]?.name === 'Web Ziyareti' ? 
      customers.filter(c => {
        const customerDate = new Date(c.created_at);
        const startDate = subDays(new Date(), parseInt(dateRange));
        return customerDate >= startDate;
      }).length : 0;

    const finalStage = journeyData.nodes.find(n => n.name === 'Tekrar Ziyaret');
    const finalStageValue = journeyData.links.find(l => l.target === journeyData.nodes.indexOf(finalStage!))?.value || 0;
    
    const conversionRate = totalCustomers > 0 ? (finalStageValue / totalCustomers) * 100 : 0;
    const dropOffRate = 100 - conversionRate;
    
    const avgJourneyTime = 7; // Ortalama yolculuk süresi (gün)
    
    const topDropOffPoint = journeyData.links
      .filter(l => l.target === journeyData.nodes.findIndex(n => n.name === 'Ayrılma'))
      .sort((a, b) => b.value - a.value)[0]?.label || 'Bilinmiyor';
    
    const topConversionPoint = journeyData.links
      .filter(l => l.target !== journeyData.nodes.findIndex(n => n.name === 'Ayrılma'))
      .sort((a, b) => b.value - a.value)[0]?.label || 'Bilinmiyor';

    return {
      totalCustomers,
      conversionRate,
      dropOffRate,
      avgJourneyTime,
      topDropOffPoint,
      topConversionPoint
    };
  }, [journeyData, customers, dateRange]);

  // Özel Sankey Tooltip
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white dark:bg-gray-800 p-3 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg">
          <p className="font-semibold text-gray-900 dark:text-white">{data.label}</p>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Müşteri Sayısı: <span className="font-medium">{data.value}</span>
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
            {((data.value / journeyMetrics.totalCustomers) * 100).toFixed(1)}% oranında
          </p>
        </div>
      );
    }
    return null;
  };

  // Rapor indirme
  const handleExportReport = () => {
    const reportData = {
      generatedAt: new Date().toISOString(),
      dateRange: `${dateRange} gün`,
      journeyType: selectedJourney,
      metrics: journeyMetrics,
      journeyData: journeyData
    };

    const dataStr = JSON.stringify(reportData, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);
    const exportFileDefaultName = `musteri-yolculugu-raporu-${new Date().toISOString().split('T')[0]}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.style.display = 'none';
    
    document.body.appendChild(linkElement);
    linkElement.click();
    document.body.removeChild(linkElement);

    toast.success('Müşteri yolculuğu raporu indirildi!');
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="flex items-center space-x-2">
          <RefreshCw className="w-5 h-5 animate-spin text-blue-600" />
          <span className="text-gray-600">Müşteri yolculuğu verileri yükleniyor...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <BarChart3 className="w-6 h-6 text-blue-600" />
            Müşteri Yolculuğu Analizi
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Müşterilerinizin farklı aşamalardaki hareketlerini görsel olarak analiz edin
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowDetails(!showDetails)}
            className="flex items-center gap-2 px-3 py-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors"
          >
            <Eye className="w-4 h-4" />
            {showDetails ? 'Detayları Gizle' : 'Detayları Göster'}
          </button>
          
          <button
            onClick={handleExportReport}
            className="flex items-center gap-2 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
          >
            <Download className="w-4 h-4" />
            Rapor İndir
          </button>
        </div>
      </div>

      {/* Filtreler */}
      <div className="flex flex-wrap items-center gap-4 p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-gray-500" />
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Filtreler:</span>
        </div>
        
        <select
          value={dateRange}
          onChange={(e) => setDateRange(e.target.value)}
          className="border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
        >
          <option value="7">Son 7 Gün</option>
          <option value="30">Son 30 Gün</option>
          <option value="90">Son 90 Gün</option>
          <option value="365">Son 1 Yıl</option>
        </select>
        
        <select
          value={selectedJourney}
          onChange={(e) => setSelectedJourney(e.target.value as any)}
          className="border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
        >
          <option value="all">Tüm Müşteriler</option>
          <option value="new">Yeni Müşteriler</option>
          <option value="returning">Dönen Müşteriler</option>
          <option value="vip">VIP Müşteriler</option>
        </select>
      </div>

      {/* Ana Metrikler */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Toplam Müşteri</p>
              <p className="mt-2 text-2xl font-bold text-gray-900 dark:text-white">
                {journeyMetrics.totalCustomers.toLocaleString()}
              </p>
            </div>
            <div className="bg-blue-500 p-3 rounded-lg">
              <Users className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Dönüşüm Oranı</p>
              <p className="mt-2 text-2xl font-bold text-green-600">
                %{journeyMetrics.conversionRate.toFixed(1)}
              </p>
            </div>
            <div className="bg-green-500 p-3 rounded-lg">
              <TrendingUp className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Ayrılma Oranı</p>
              <p className="mt-2 text-2xl font-bold text-red-600">
                %{journeyMetrics.dropOffRate.toFixed(1)}
              </p>
            </div>
            <div className="bg-red-500 p-3 rounded-lg">
              <TrendingDown className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Ort. Yolculuk Süresi</p>
              <p className="mt-2 text-2xl font-bold text-gray-900 dark:text-white">
                {journeyMetrics.avgJourneyTime} gün
              </p>
            </div>
            <div className="bg-purple-500 p-3 rounded-lg">
              <Calendar className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>
      </div>

      {/* Sankey Diyagramı */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Müşteri Yolculuğu Akış Diyagramı
          </h3>
          <div className="text-sm text-gray-500 dark:text-gray-400">
            {format(new Date(), 'dd MMMM yyyy', { locale: tr })} tarihine kadar
          </div>
        </div>
        
        <div className="h-96">
          <ResponsiveContainer width="100%" height="100%">
            <Sankey
              data={journeyData}
              nodeWidth={15}
              nodePadding={50}
              linkCurvature={0.5}
              iterations={32}
            >
              <Tooltip content={<CustomTooltip />} />
            </Sankey>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Detaylı Analiz */}
      {showDetails && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* En Çok Ayrılma Noktaları */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <XCircle className="w-5 h-5 text-red-500" />
              En Çok Ayrılma Noktaları
            </h4>
            <div className="space-y-3">
              <div className="flex justify-between items-center p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
                <span className="text-sm font-medium text-gray-900 dark:text-white">
                  {journeyMetrics.topDropOffPoint}
                </span>
                <span className="text-sm text-red-600 font-semibold">
                  %{journeyMetrics.dropOffRate.toFixed(1)}
                </span>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Müşterilerin en çok bu aşamada yolculuktan ayrıldığını gösterir.
              </p>
            </div>
          </div>

          {/* En Başarılı Dönüşüm Noktaları */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-500" />
              En Başarılı Dönüşüm Noktaları
            </h4>
            <div className="space-y-3">
              <div className="flex justify-between items-center p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                <span className="text-sm font-medium text-gray-900 dark:text-white">
                  {journeyMetrics.topConversionPoint}
                </span>
                <span className="text-sm text-green-600 font-semibold">
                  %{journeyMetrics.conversionRate.toFixed(1)}
                </span>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Müşterilerin en çok bu aşamada başarılı olduğunu gösterir.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Yolculuk Aşamaları Detayı */}
      {showDetails && (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <Target className="w-5 h-5 text-blue-500" />
            Yolculuk Aşamaları Detayı
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {journeyData.nodes.map((node, index) => {
              const nodeLinks = journeyData.links.filter(link => link.source === index);
              const totalOutgoing = nodeLinks.reduce((sum, link) => sum + link.value, 0);
              const percentage = journeyMetrics.totalCustomers > 0 
                ? (totalOutgoing / journeyMetrics.totalCustomers) * 100 
                : 0;

              return (
                <div key={node.name} className="p-4 border border-gray-200 dark:border-gray-600 rounded-lg">
                  <div className="flex items-center gap-3 mb-2">
                    <div 
                      className="w-4 h-4 rounded-full" 
                      style={{ backgroundColor: node.color }}
                    />
                    <span className="font-medium text-gray-900 dark:text-white text-sm">
                      {node.name}
                    </span>
                  </div>
                  <div className="text-2xl font-bold text-gray-900 dark:text-white">
                    {totalOutgoing.toLocaleString()}
                  </div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    %{percentage.toFixed(1)} oranında
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Akıllı Öneriler */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl p-6 border border-blue-200 dark:border-blue-800">
        <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
          <Zap className="w-5 h-5 text-blue-600" />
          Akıllı Öneriler
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
            <h5 className="font-medium text-gray-900 dark:text-white mb-2">
              Dönüşüm Optimizasyonu
            </h5>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {journeyMetrics.conversionRate < 20 
                ? "Dönüşüm oranınız düşük. Müşteri deneyimini iyileştirmek için onboarding sürecini gözden geçirin."
                : journeyMetrics.conversionRate < 40
                ? "Dönüşüm oranınız orta seviyede. Müşteri memnuniyetini artırmak için destek süreçlerini optimize edin."
                : "Dönüşüm oranınız yüksek! Bu başarıyı sürdürmek için müşteri geri bildirimlerini düzenli olarak toplayın."
              }
            </p>
          </div>
          
          <div className="p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
            <h5 className="font-medium text-gray-900 dark:text-white mb-2">
              Ayrılma Önleme
            </h5>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {journeyMetrics.dropOffRate > 60
                ? "Ayrılma oranınız yüksek. Müşteri tutma stratejileri geliştirin ve proaktif destek sağlayın."
                : journeyMetrics.dropOffRate > 40
                ? "Ayrılma oranınız orta seviyede. Müşteri memnuniyet anketleri düzenleyin ve iyileştirme alanlarını belirleyin."
                : "Ayrılma oranınız düşük. Müşteri sadakatini artırmak için VIP programları ve özel teklifler sunun."
              }
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CustomerJourneySankey;
