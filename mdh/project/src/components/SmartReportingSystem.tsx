import React, { useState, useEffect, useMemo } from 'react';
import { 
  TrendingUp, 
  TrendingDown, 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  DollarSign,
  BarChart3,
  Activity,
  Target,
  Zap,
  Eye,
  Download,
  RefreshCw,
  Filter,
  Star,
  UserCheck,
  AlertCircle
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart as RechartsPieChart, Pie, Cell, LineChart, Line, AreaChart, Area } from 'recharts';
import { format, subDays, startOfMonth, endOfMonth, differenceInHours } from 'date-fns';
import { tr } from 'date-fns/locale';
import { useSupabase } from '../hooks/useSupabase';
import { toast } from 'react-hot-toast';

interface SmartInsight {
  id: string;
  type: 'trend' | 'anomaly' | 'recommendation' | 'warning' | 'success';
  title: string;
  description: string;
  impact: 'high' | 'medium' | 'low';
  confidence: number;
  data: any;
  action?: string;
  icon: React.ReactNode;
  color: string;
}

interface PredictionData {
  metric: string;
  current: number;
  predicted: number;
  trend: 'up' | 'down' | 'stable';
  confidence: number;
  timeframe: string;
  type: string;
  title: string;
  impact: string;
}

interface AnomalyData {
  metric: string;
  value: number;
  expected: number;
  deviation: number;
  severity: 'high' | 'medium' | 'low';
  timestamp: Date;
  description: string;
  type: string;
  detectedAt: string;
  impact: string;
}

const SmartReportingSystem: React.FC = () => {
  const { 
    customers, 
    agents, 
    tickets, 
    payments, 
    subscriptions, 
    subscriptionPlans,
    expenses,
    fetchCustomers, 
    fetchAgents, 
    fetchTickets, 
    fetchPayments, 
    fetchSubscriptions, 
    fetchSubscriptionPlans,
    fetchExpenses
  } = useSupabase();

  const [dateRange, setDateRange] = useState('30');
  const [selectedPeriod, setSelectedPeriod] = useState('current');
  const [activeTab, setActiveTab] = useState<'insights' | 'predictions' | 'anomalies' | 'recommendations'>('insights');
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [refreshInterval, setRefreshInterval] = useState(30); // seconds

  // Verileri yükle
  useEffect(() => {
    fetchCustomers();
    fetchAgents();
    fetchTickets();
    fetchPayments();
    fetchSubscriptions();
    fetchSubscriptionPlans();
    fetchExpenses();
  }, []);

  // Otomatik yenileme
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      fetchCustomers();
      fetchAgents();
      fetchTickets();
      fetchPayments();
      fetchSubscriptions();
      fetchSubscriptionPlans();
      fetchExpenses();
    }, refreshInterval * 1000);

    return () => clearInterval(interval);
  }, [autoRefresh, refreshInterval]);

  // Tarih aralığı hesaplama
  const getDateRange = () => {
    const now = new Date();
    const days = parseInt(dateRange);
    
    if (selectedPeriod === 'current') {
      return {
        start: startOfMonth(now),
        end: now
      };
    } else if (selectedPeriod === 'previous') {
      const previousMonth = subDays(now, 30);
      return {
        start: startOfMonth(previousMonth),
        end: endOfMonth(previousMonth)
      };
    } else {
      return {
        start: subDays(now, days),
        end: now
      };
    }
  };

  // Akıllı içgörüler üretimi
  const generateSmartInsights = useMemo((): SmartInsight[] => {
    const insights: SmartInsight[] = [];
    const dateRange = getDateRange();
    const startDate = dateRange.start;
    const endDate = dateRange.end;

    // Filtrelenmiş veriler
    const filteredTickets = tickets.filter(ticket => {
      const ticketDate = new Date(ticket.created_at);
      return ticketDate >= startDate && ticketDate <= endDate;
    });

    const filteredPayments = payments.filter(payment => {
      if (!payment.payment_date) return false;
      const paymentDate = new Date(payment.payment_date);
      return paymentDate >= startDate && paymentDate <= endDate;
    });

    // 1. Talep Trend Analizi
    const currentWeekTickets = filteredTickets.filter(t => {
      const ticketDate = new Date(t.created_at);
      const weekAgo = subDays(new Date(), 7);
      return ticketDate >= weekAgo;
    }).length;

    const previousWeekTickets = tickets.filter(t => {
      const ticketDate = new Date(t.created_at);
      const twoWeeksAgo = subDays(new Date(), 14);
      const weekAgo = subDays(new Date(), 7);
      return ticketDate >= twoWeeksAgo && ticketDate < weekAgo;
    }).length;

    const ticketTrend = currentWeekTickets > previousWeekTickets ? 'up' : 'down';
    const ticketChange = previousWeekTickets > 0 ? 
      Math.round(((currentWeekTickets - previousWeekTickets) / previousWeekTickets) * 100) : 0;

    if (Math.abs(ticketChange) > 20) {
      insights.push({
        id: 'ticket-trend',
        type: ticketTrend === 'up' ? 'warning' : 'success',
        title: `Talep Sayısında ${ticketTrend === 'up' ? 'Artış' : 'Azalış'}`,
        description: `Bu hafta talep sayısı %${Math.abs(ticketChange)} ${ticketTrend === 'up' ? 'arttı' : 'azaldı'}. ${ticketTrend === 'up' ? 'Ek kaynak gerekebilir.' : 'Performans iyileşiyor.'}`,
        impact: Math.abs(ticketChange) > 50 ? 'high' : 'medium',
        confidence: 85,
        data: { current: currentWeekTickets, previous: previousWeekTickets, change: ticketChange },
        action: ticketTrend === 'up' ? 'Kaynak artırımı öner' : 'Başarıyı kutla',
        icon: ticketTrend === 'up' ? <TrendingUp className="w-5 h-5" /> : <TrendingDown className="w-5 h-5" />,
        color: ticketTrend === 'up' ? 'text-orange-600' : 'text-green-600'
      });
    }

    // 2. Çözüm Süresi Analizi
    const resolvedTickets = filteredTickets.filter(t => t.resolved_at);
    const avgResolutionTime = resolvedTickets.length > 0 
      ? Math.round(resolvedTickets.reduce((sum, t) => {
          const created = new Date(t.created_at);
          const resolved = new Date(t.resolved_at!);
          return sum + differenceInHours(resolved, created);
        }, 0) / resolvedTickets.length)
      : 0;

    if (avgResolutionTime > 24) {
      insights.push({
        id: 'resolution-time',
        type: 'warning',
        title: 'Yüksek Çözüm Süresi',
        description: `Ortalama çözüm süresi ${avgResolutionTime} saat. SLA hedefi 24 saat. İyileştirme gerekli.`,
        impact: 'high',
        confidence: 90,
        data: { avgResolutionTime, target: 24 },
        action: 'Süreç optimizasyonu öner',
        icon: <Clock className="w-5 h-5" />,
        color: 'text-red-600'
      });
    }

    // 3. Müşteri Memnuniyeti Analizi
    const satisfactionScores = resolvedTickets
      .filter(t => t.satisfaction_rating)
      .map(t => t.satisfaction_rating!);
    
    const avgSatisfaction = satisfactionScores.length > 0 
      ? satisfactionScores.reduce((sum, score) => sum + score, 0) / satisfactionScores.length 
      : 0;

    if (avgSatisfaction < 3.5) {
      insights.push({
        id: 'satisfaction-low',
        type: 'warning',
        title: 'Düşük Müşteri Memnuniyeti',
        description: `Ortalama memnuniyet skoru ${avgSatisfaction.toFixed(1)}/5. Müşteri deneyimi iyileştirilmeli.`,
        impact: 'high',
        confidence: 88,
        data: { avgSatisfaction, target: 4.0 },
        action: 'Müşteri deneyimi iyileştirme planı',
        icon: <Star className="w-5 h-5" />,
        color: 'text-red-600'
      });
    } else if (avgSatisfaction > 4.5) {
      insights.push({
        id: 'satisfaction-high',
        type: 'success',
        title: 'Yüksek Müşteri Memnuniyeti',
        description: `Ortalama memnuniyet skoru ${avgSatisfaction.toFixed(1)}/5. Mükemmel performans!`,
        impact: 'medium',
        confidence: 92,
        data: { avgSatisfaction },
        action: 'Başarıyı paylaş',
        icon: <CheckCircle className="w-5 h-5" />,
        color: 'text-green-600'
      });
    }

    // 4. Temsilci Performans Analizi
    const agentStats = agents.map(agent => {
      const agentTickets = filteredTickets.filter(t => t.agent_id === agent.id);
      const resolved = agentTickets.filter(t => t.status === 'resolved' || t.status === 'closed');
      const avgTime = resolved.length > 0 
        ? Math.round(resolved.reduce((sum, t) => {
            const created = new Date(t.created_at);
            const resolved = new Date(t.resolved_at!);
            return sum + differenceInHours(resolved, created);
          }, 0) / resolved.length)
        : 0;
      
      return { agent, tickets: agentTickets.length, resolved: resolved.length, avgTime };
    });

    const topPerformer = agentStats.sort((a, b) => b.resolved - a.resolved)[0];
    const underPerformer = agentStats.filter(a => a.tickets > 5).sort((a, b) => a.resolved - b.resolved)[0];

    if (topPerformer && topPerformer.resolved > 10) {
      insights.push({
        id: 'top-performer',
        type: 'success',
        title: 'En İyi Performans',
        description: `${topPerformer.agent.name} ${topPerformer.resolved} talep çözdü. Ortalama süre: ${topPerformer.avgTime} saat.`,
        impact: 'medium',
        confidence: 95,
        data: topPerformer,
        action: 'Başarıyı ödüllendir',
        icon: <UserCheck className="w-5 h-5" />,
        color: 'text-green-600'
      });
    }

    if (underPerformer && underPerformer.resolved < 5) {
      insights.push({
        id: 'under-performer',
        type: 'warning',
        title: 'Performans İyileştirme Gerekli',
        description: `${underPerformer.agent.name} sadece ${underPerformer.resolved} talep çözdü. Destek gerekebilir.`,
        impact: 'medium',
        confidence: 80,
        data: underPerformer,
        action: 'Eğitim ve destek sağla',
        icon: <AlertTriangle className="w-5 h-5" />,
        color: 'text-orange-600'
      });
    }

    // 5. Gelir Analizi
    const completedPayments = filteredPayments.filter(p => p.status === 'completed' || p.status === 'paid');
    const totalRevenue = completedPayments.reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0);

    const currentMonthRevenue = payments.filter(p => {
      if (!p.payment_date) return false;
      const paymentDate = new Date(p.payment_date);
      const monthStart = startOfMonth(new Date());
      return paymentDate >= monthStart && p.status === 'completed';
    }).reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0);

    const previousMonthRevenue = payments.filter(p => {
      if (!p.payment_date) return false;
      const paymentDate = new Date(p.payment_date);
      const previousMonth = subDays(startOfMonth(new Date()), 1);
      const previousMonthStart = startOfMonth(previousMonth);
      const previousMonthEnd = endOfMonth(previousMonth);
      return paymentDate >= previousMonthStart && paymentDate <= previousMonthEnd && p.status === 'completed';
    }).reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0);

    const revenueChange = previousMonthRevenue > 0 
      ? Math.round(((currentMonthRevenue - previousMonthRevenue) / previousMonthRevenue) * 100) 
      : 0;

    if (Math.abs(revenueChange) > 15) {
      insights.push({
        id: 'revenue-trend',
        type: revenueChange > 0 ? 'success' : 'warning',
        title: `Gelir ${revenueChange > 0 ? 'Artışı' : 'Azalışı'}`,
        description: `Bu ay gelir %${Math.abs(revenueChange)} ${revenueChange > 0 ? 'arttı' : 'azaldı'}. ${revenueChange > 0 ? 'Harika performans!' : 'Dikkat gerekli.'}`,
        impact: 'high',
        confidence: 90,
        data: { current: currentMonthRevenue, previous: previousMonthRevenue, change: revenueChange },
        action: revenueChange > 0 ? 'Başarıyı analiz et' : 'Gelir stratejisi gözden geçir',
        icon: <DollarSign className="w-5 h-5" />,
        color: revenueChange > 0 ? 'text-green-600' : 'text-red-600'
      });
    }

    // 6. SLA İhlali Analizi
    const overdueTickets = filteredTickets.filter(t => {
      if (t.status === 'resolved' || t.status === 'closed') return false;
      const created = new Date(t.created_at);
      const now = new Date();
      const diffHours = differenceInHours(now, created);
      return diffHours > 24;
    });

    const slaCompliance = filteredTickets.length > 0 
      ? Math.round(((filteredTickets.length - overdueTickets.length) / filteredTickets.length) * 100)
      : 100;

    if (slaCompliance < 80) {
      insights.push({
        id: 'sla-breach',
        type: 'warning',
        title: 'SLA Uyumluluğu Düşük',
        description: `SLA uyumluluğu %${slaCompliance}. ${overdueTickets.length} talep gecikmiş. Acil müdahale gerekli.`,
        impact: 'high',
        confidence: 95,
        data: { compliance: slaCompliance, overdue: overdueTickets.length },
        action: 'SLA ihlallerini çöz',
        icon: <AlertCircle className="w-5 h-5" />,
        color: 'text-red-600'
      });
    }

    return insights.sort((a, b) => {
      const impactOrder = { high: 3, medium: 2, low: 1 };
      return impactOrder[b.impact] - impactOrder[a.impact];
    });
  }, [tickets, customers, agents, payments, subscriptions, expenses, dateRange, selectedPeriod]);

  // Tahminleme verileri
  const predictions = useMemo((): PredictionData[] => {
    const dateRange = getDateRange();
    const startDate = dateRange.start;
    const endDate = dateRange.end;

    const filteredTickets = tickets.filter(ticket => {
      const ticketDate = new Date(ticket.created_at);
      return ticketDate >= startDate && ticketDate <= endDate;
    });

    const filteredPayments = payments.filter(payment => {
      if (!payment.payment_date) return false;
      const paymentDate = new Date(payment.payment_date);
      return paymentDate >= startDate && paymentDate <= endDate;
    });

    // Basit trend analizi (gerçek AI yerine matematiksel hesaplama)
    const dailyTickets = [];
    for (let i = 0; i < 30; i++) {
      const date = subDays(new Date(), i);
      const dayTickets = tickets.filter(t => {
        const ticketDate = new Date(t.created_at);
        return ticketDate.toDateString() === date.toDateString();
      }).length;
      dailyTickets.push(dayTickets);
    }

    const avgDailyTickets = dailyTickets.reduce((sum, val) => sum + val, 0) / dailyTickets.length;
    const trend = dailyTickets[0] > dailyTickets[14] ? 'up' : 'down';
    const predictedTickets = Math.round(avgDailyTickets * 1.1); // %10 artış varsayımı

    return [
      {
        metric: 'Günlük Talep Sayısı',
        current: Math.round(avgDailyTickets),
        predicted: predictedTickets,
        trend,
        confidence: 75,
        timeframe: 'Sonraki 7 gün',
        type: 'volume',
        title: 'Talep Artışı Bekleniyor',
        impact: 'Yüksek'
      },
      {
        metric: 'Aylık Gelir',
        current: filteredPayments.reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0),
        predicted: Math.round(filteredPayments.reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0) * 1.15),
        trend: 'up',
        confidence: 70,
        timeframe: 'Sonraki ay',
        type: 'revenue',
        title: 'Gelir Artışı Tahmini',
        impact: 'Orta'
      },
      {
        metric: 'Müşteri Memnuniyeti',
        current: 4.2,
        predicted: 4.4,
        trend: 'up',
        confidence: 80,
        timeframe: 'Sonraki 30 gün',
        type: 'satisfaction',
        title: 'Memnuniyet Artışı',
        impact: 'Düşük'
      }
    ];
  }, [tickets, payments, dateRange, selectedPeriod]);

  // Anomali tespiti
  const anomalies = useMemo((): AnomalyData[] => {
    const anomalies: AnomalyData[] = [];
    const dateRange = getDateRange();
    const startDate = dateRange.start;
    const endDate = dateRange.end;

    const filteredTickets = tickets.filter(ticket => {
      const ticketDate = new Date(ticket.created_at);
      return ticketDate >= startDate && ticketDate <= endDate;
    });

    // Günlük talep sayısı anomalisi
    const dailyTickets = [];
    for (let i = 0; i < 7; i++) {
      const date = subDays(new Date(), i);
      const dayTickets = tickets.filter(t => {
        const ticketDate = new Date(t.created_at);
        return ticketDate.toDateString() === date.toDateString();
      }).length;
      dailyTickets.push(dayTickets);
    }

    const avgDailyTickets = dailyTickets.reduce((sum, val) => sum + val, 0) / dailyTickets.length;
    const todayTickets = dailyTickets[0];
    const deviation = Math.abs(todayTickets - avgDailyTickets) / avgDailyTickets;

    if (deviation > 0.5) { // %50'den fazla sapma
      anomalies.push({
        metric: 'Günlük Talep Sayısı',
        value: todayTickets,
        expected: Math.round(avgDailyTickets),
        deviation: Math.round(deviation * 100),
        severity: deviation > 1 ? 'high' : 'medium',
        timestamp: new Date(),
        description: `Bugün ${todayTickets} talep geldi, beklenen ${Math.round(avgDailyTickets)}. %${Math.round(deviation * 100)} sapma.`,
        type: 'volume',
        detectedAt: new Date().toISOString(),
        impact: deviation > 1 ? 'Yüksek' : 'Orta'
      });
    }

    return anomalies;
  }, [tickets, dateRange, selectedPeriod]);

  // Öneriler
  const recommendations = useMemo(() => {
    const recs = [];
    
    // Talep sayısı yüksekse
    const currentWeekTickets = tickets.filter(t => {
      const ticketDate = new Date(t.created_at);
      const weekAgo = subDays(new Date(), 7);
      return ticketDate >= weekAgo;
    }).length;

    if (currentWeekTickets > 50) {
      recs.push({
        id: 'increase-staff',
        category: 'personnel',
        title: 'Personel Artırımı',
        description: 'Talep yoğunluğu yüksek. Ek temsilci alımı düşünülebilir.',
        priority: 'high',
        impact: 'Yanıt sürelerini %30 azaltabilir',
        effort: 'Orta'
      });
    }

    // Çözüm süresi yüksekse
    const resolvedTickets = tickets.filter(t => t.resolved_at);
    const avgResolutionTime = resolvedTickets.length > 0 
      ? Math.round(resolvedTickets.reduce((sum, t) => {
          const created = new Date(t.created_at);
          const resolved = new Date(t.resolved_at!);
          return sum + differenceInHours(resolved, created);
        }, 0) / resolvedTickets.length)
      : 0;

    if (avgResolutionTime > 24) {
      recs.push({
        id: 'process-optimization',
        category: 'process',
        title: 'Süreç Optimizasyonu',
        description: 'Çözüm süreleri hedefin üzerinde. İş akışları gözden geçirilmeli.',
        priority: 'high',
        impact: 'Çözüm sürelerini %25 azaltabilir',
        effort: 'Düşük'
      });
    }

    // Memnuniyet düşükse
    const satisfactionScores = resolvedTickets
      .filter(t => t.satisfaction_rating)
      .map(t => t.satisfaction_rating!);
    
    const avgSatisfaction = satisfactionScores.length > 0 
      ? satisfactionScores.reduce((sum, score) => sum + score, 0) / satisfactionScores.length 
      : 0;

    if (avgSatisfaction < 4.0) {
      recs.push({
        id: 'customer-experience',
        category: 'customer',
        title: 'Müşteri Deneyimi İyileştirme',
        description: 'Müşteri memnuniyeti hedefin altında. Eğitim ve süreç iyileştirmesi gerekli.',
        priority: 'medium',
        impact: 'Memnuniyeti %20 artırabilir',
        effort: 'Orta'
      });
    }

    return recs;
  }, [tickets]);

  const formatCurrency = (n: number) => `₺${n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  const handleExportInsights = () => {
    try {
      // Güvenli veri hazırlama - sadece serializable veriler
      const exportData = {
        generatedAt: new Date().toISOString(),
        period: `${dateRange} gün`,
        selectedPeriod: selectedPeriod,
        summary: {
          totalTickets: tickets.length,
          totalCustomers: customers.length,
          totalAgents: agents.length,
          totalRevenue: payments.reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0)
        },
        insights: {
          ticketTrends: {
            total: tickets.length,
            open: tickets.filter(t => t.status === 'open').length,
            resolved: tickets.filter(t => t.status === 'resolved').length,
            avgResolutionTime: tickets.filter(t => t.resolved_at).length > 0 
              ? Math.round(tickets.filter(t => t.resolved_at).reduce((sum, t) => {
                  const created = new Date(t.created_at);
                  const resolved = new Date(t.resolved_at!);
                  return sum + (resolved.getTime() - created.getTime()) / (1000 * 60 * 60);
                }, 0) / tickets.filter(t => t.resolved_at).length)
              : 0
          },
          customerInsights: {
            totalCustomers: customers.length,
            newCustomers: customers.filter(c => {
              const customerDate = new Date(c.created_at);
              const monthAgo = new Date();
              monthAgo.setMonth(monthAgo.getMonth() - 1);
              return customerDate >= monthAgo;
            }).length,
            avgSatisfaction: customers.length > 0 
              ? Math.round(customers.reduce((sum, c) => sum + (c.satisfaction_score || 0), 0) / customers.length * 10) / 10
              : 0
          },
          financialInsights: {
            totalRevenue: payments.reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0),
            avgPayment: payments.length > 0 
              ? payments.reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0) / payments.length
              : 0,
            revenueByMonth: (() => {
              const monthlyRevenue: { [key: string]: number } = {};
              payments.forEach(payment => {
                if (payment.payment_date) {
                  const month = new Date(payment.payment_date).toISOString().substring(0, 7);
                  monthlyRevenue[month] = (monthlyRevenue[month] || 0) + (parseFloat(payment.amount) || 0);
                }
              });
              return monthlyRevenue;
            })()
          }
        },
        predictions: predictions.map(p => ({
          type: p.type,
          title: p.title,
          confidence: p.confidence,
          timeframe: p.timeframe,
          impact: p.impact
        })),
        anomalies: anomalies.map(a => ({
          type: a.type,
          severity: a.severity,
          description: a.description,
          detectedAt: a.detectedAt,
          impact: a.impact
        })),
        recommendations: recommendations.map(r => ({
          category: r.category,
          title: r.title,
          description: r.description,
          priority: r.priority,
          impact: r.impact,
          effort: r.effort
        }))
      };

      const dataStr = JSON.stringify(exportData, null, 2);
      const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
      
      const exportFileDefaultName = `akilli-rapor-${new Date().toISOString().split('T')[0]}.json`;
      
      const linkElement = document.createElement('a');
      linkElement.setAttribute('href', dataUri);
      linkElement.setAttribute('download', exportFileDefaultName);
      linkElement.style.display = 'none';
      
      document.body.appendChild(linkElement);
      linkElement.click();
      document.body.removeChild(linkElement);
      
      toast.success('Akıllı rapor başarıyla indirildi');
    } catch (error) {
      console.error('Rapor indirme hatası:', error);
      toast.error('Rapor indirilirken bir hata oluştu. Lütfen tekrar deneyin.');
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Akıllı Raporlama Sistemi</h1>
          <p className="text-gray-600 mt-2">Otomatik içgörüler, tahminler ve öneriler</p>
        </div>
        <div className="flex items-center gap-4">
          {/* Otomatik yenileme */}
          <div className="flex items-center gap-2">
            <RefreshCw className="w-4 h-4 text-gray-500" />
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={autoRefresh}
                onChange={(e) => setAutoRefresh(e.target.checked)}
                className="rounded"
              />
              <span className="text-sm text-gray-600">Otomatik yenile</span>
            </label>
            {autoRefresh && (
              <select
                value={refreshInterval}
                onChange={(e) => setRefreshInterval(Number(e.target.value))}
                className="border border-gray-300 rounded px-2 py-1 text-sm"
              >
                <option value="30">30s</option>
                <option value="60">1dk</option>
                <option value="300">5dk</option>
              </select>
            )}
          </div>

          {/* Filtreler */}
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-gray-500" />
            <select 
              value={dateRange} 
              onChange={(e) => setDateRange(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
            >
              <option value="7">Son 7 Gün</option>
              <option value="30">Son 30 Gün</option>
              <option value="90">Son 90 Gün</option>
            </select>
            <select 
              value={selectedPeriod} 
              onChange={(e) => setSelectedPeriod(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
            >
              <option value="current">Bu Ay</option>
              <option value="previous">Geçen Ay</option>
              <option value="custom">Özel Aralık</option>
            </select>
          </div>

          <button
            onClick={handleExportInsights}
            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Download className="w-4 h-4" />
            Rapor İndir
          </button>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-gray-200 mb-8">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('insights')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'insights'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4" />
              Akıllı İçgörüler ({generateSmartInsights.length})
            </div>
          </button>
          <button
            onClick={() => setActiveTab('predictions')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'predictions'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <div className="flex items-center gap-2">
              <Target className="w-4 h-4" />
              Tahminler ({predictions.length})
            </div>
          </button>
          <button
            onClick={() => setActiveTab('anomalies')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'anomalies'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4" />
              Anomaliler ({anomalies.length})
            </div>
          </button>
          <button
            onClick={() => setActiveTab('recommendations')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'recommendations'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <div className="flex items-center gap-2">
              <Eye className="w-4 h-4" />
              Öneriler ({recommendations.length})
            </div>
          </button>
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === 'insights' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {generateSmartInsights.map((insight) => (
              <div key={insight.id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="flex items-start gap-4">
                  <div className={`p-3 rounded-lg ${insight.color.replace('text-', 'bg-').replace('-600', '-100')}`}>
                    {insight.icon}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="font-semibold text-gray-900">{insight.title}</h3>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        insight.impact === 'high' ? 'bg-red-100 text-red-800' :
                        insight.impact === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-green-100 text-green-800'
                      }`}>
                        {insight.impact === 'high' ? 'Yüksek' : insight.impact === 'medium' ? 'Orta' : 'Düşük'}
                      </span>
                    </div>
                    <p className="text-gray-600 text-sm mb-3">{insight.description}</p>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                        <span className="text-xs text-gray-500">%{insight.confidence} güven</span>
                      </div>
                      {insight.action && (
                        <button className="text-blue-600 text-sm font-medium hover:text-blue-700">
                          {insight.action}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {generateSmartInsights.length === 0 && (
            <div className="text-center py-12">
              <BarChart3 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Henüz içgörü yok</h3>
              <p className="text-gray-600">Veriler analiz edildiğinde otomatik içgörüler burada görünecek.</p>
            </div>
          )}
        </div>
      )}

      {activeTab === 'predictions' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {predictions.map((prediction, index) => (
              <div key={index} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-3 bg-blue-100 rounded-lg">
                    <Target className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">{prediction.metric}</h3>
                    <p className="text-sm text-gray-600">{prediction.timeframe}</p>
                  </div>
                </div>
                
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Mevcut</span>
                    <span className="font-semibold text-gray-900">
                      {prediction.metric.includes('Gelir') ? formatCurrency(prediction.current) : prediction.current}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Tahmin</span>
                    <span className="font-semibold text-blue-600">
                      {prediction.metric.includes('Gelir') ? formatCurrency(prediction.predicted) : prediction.predicted}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Trend</span>
                    <div className="flex items-center gap-1">
                      {prediction.trend === 'up' ? (
                        <TrendingUp className="w-4 h-4 text-green-600" />
                      ) : prediction.trend === 'down' ? (
                        <TrendingDown className="w-4 h-4 text-red-600" />
                      ) : (
                        <Activity className="w-4 h-4 text-gray-600" />
                      )}
                      <span className={`text-sm font-medium ${
                        prediction.trend === 'up' ? 'text-green-600' :
                        prediction.trend === 'down' ? 'text-red-600' :
                        'text-gray-600'
                      }`}>
                        {prediction.trend === 'up' ? 'Artış' : prediction.trend === 'down' ? 'Azalış' : 'Sabit'}
                      </span>
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Güven</span>
                    <span className="text-sm font-medium text-gray-900">%{prediction.confidence}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'anomalies' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {anomalies.map((anomaly, index) => (
              <div key={index} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="flex items-start gap-4">
                  <div className={`p-3 rounded-lg ${
                    anomaly.severity === 'high' ? 'bg-red-100' :
                    anomaly.severity === 'medium' ? 'bg-yellow-100' :
                    'bg-orange-100'
                  }`}>
                    <AlertTriangle className={`w-5 h-5 ${
                      anomaly.severity === 'high' ? 'text-red-600' :
                      anomaly.severity === 'medium' ? 'text-yellow-600' :
                      'text-orange-600'
                    }`} />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="font-semibold text-gray-900">{anomaly.metric}</h3>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        anomaly.severity === 'high' ? 'bg-red-100 text-red-800' :
                        anomaly.severity === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-orange-100 text-orange-800'
                      }`}>
                        {anomaly.severity === 'high' ? 'Yüksek' : anomaly.severity === 'medium' ? 'Orta' : 'Düşük'}
                      </span>
                    </div>
                    <p className="text-gray-600 text-sm mb-3">{anomaly.description}</p>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-gray-600">Gerçek:</span>
                        <span className="font-semibold text-gray-900 ml-2">{anomaly.value}</span>
                      </div>
                      <div>
                        <span className="text-gray-600">Beklenen:</span>
                        <span className="font-semibold text-gray-900 ml-2">{anomaly.expected}</span>
                      </div>
                      <div>
                        <span className="text-gray-600">Sapma:</span>
                        <span className="font-semibold text-red-600 ml-2">%{anomaly.deviation}</span>
                      </div>
                      <div>
                        <span className="text-gray-600">Zaman:</span>
                        <span className="font-semibold text-gray-900 ml-2">
                          {format(anomaly.timestamp, 'HH:mm', { locale: tr })}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {anomalies.length === 0 && (
            <div className="text-center py-12">
              <CheckCircle className="w-12 h-12 text-green-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Anomali tespit edilmedi</h3>
              <p className="text-gray-600">Sistem normal çalışıyor, herhangi bir anomali bulunamadı.</p>
            </div>
          )}
        </div>
      )}

      {activeTab === 'recommendations' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {recommendations.map((rec) => (
              <div key={rec.id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-blue-100 rounded-lg">
                    <Eye className="w-5 h-5 text-blue-600" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="font-semibold text-gray-900">{rec.title}</h3>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        rec.priority === 'high' ? 'bg-red-100 text-red-800' :
                        rec.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-green-100 text-green-800'
                      }`}>
                        {rec.priority === 'high' ? 'Yüksek Öncelik' : rec.priority === 'medium' ? 'Orta Öncelik' : 'Düşük Öncelik'}
                      </span>
                    </div>
                    <p className="text-gray-600 text-sm mb-4">{rec.description}</p>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-gray-600">Etki:</span>
                        <span className="font-semibold text-green-600 ml-2">{rec.impact}</span>
                      </div>
                      <div>
                        <span className="text-gray-600">Çaba:</span>
                        <span className="font-semibold text-gray-900 ml-2">{rec.effort}</span>
                      </div>
                    </div>
                    <button className="mt-4 w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium">
                      Uygula
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {recommendations.length === 0 && (
            <div className="text-center py-12">
              <CheckCircle className="w-12 h-12 text-green-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Öneri yok</h3>
              <p className="text-gray-600">Sistem performansı iyi durumda, şu an için öneri bulunmuyor.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default SmartReportingSystem;
