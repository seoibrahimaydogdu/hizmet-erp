import React, { useEffect, useMemo, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Area, AreaChart, Legend, LineChart, Line } from 'recharts';
import { Download, MessageSquare, CheckCircle, Clock, Star, Users, AlertCircle, TrendingUp, TrendingDown, DollarSign, UserCheck, UserX, Activity, Calendar, Filter } from 'lucide-react';
import { format, endOfMonth, subMonths, startOfMonth, endOfDay, startOfDay, subDays, differenceInHours, differenceInDays } from 'date-fns';
import { tr } from 'date-fns/locale';
import { useSupabase } from '../hooks/useSupabase';
import RealTimeHintSystem from './RealTimeHintSystem';
import AutoReportManager from './AutoReportManager';
import SmartAlertManager from './SmartAlertManager';
import RealtimeDashboard from './RealtimeDashboard';
import { toast } from 'react-hot-toast';

const ReportsPage = () => {
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

  const [dateRange, setDateRange] = useState('30'); // days
  const [selectedPeriod, setSelectedPeriod] = useState('current'); // current, previous, custom
  const [activeTab, setActiveTab] = useState<'analytics' | 'auto-reports' | 'alerts' | 'dashboard'>('analytics');

  // Tarih aralığı hesaplama
  const getDateRange = () => {
    const now = new Date();
    const days = parseInt(dateRange);
    
    if (selectedPeriod === 'current') {
      return {
        start: startOfMonth(now),
        end: endOfDay(now)
      };
    } else if (selectedPeriod === 'previous') {
      const previousMonth = subMonths(now, 1);
      return {
        start: startOfMonth(previousMonth),
        end: endOfMonth(previousMonth)
      };
    } else {
      return {
        start: subDays(now, days),
        end: endOfDay(now)
      };
    }
  };

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

  // Analitik verileri hesapla
  const analyticsData = useMemo(() => {
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

    const filteredExpenses = expenses.filter(expense => {
      if (!expense.expense_date) return false;
      const expenseDate = new Date(expense.expense_date);
      return expenseDate >= startDate && expenseDate <= endDate;
    });

    // 1. Talep İstatistikleri
    const ticketStats = {
      total: filteredTickets.length,
      open: filteredTickets.filter(t => t.status === 'open').length,
      inProgress: filteredTickets.filter(t => t.status === 'in_progress').length,
      resolved: filteredTickets.filter(t => t.status === 'resolved').length,
      closed: filteredTickets.filter(t => t.status === 'closed').length,
      highPriority: filteredTickets.filter(t => t.priority === 'high').length,
      overdue: filteredTickets.filter(t => {
        if (t.status === 'resolved' || t.status === 'closed') return false;
        const created = new Date(t.created_at);
        const now = new Date();
        const diffHours = differenceInHours(now, created);
        return diffHours > 24;
      }).length,
      avgResolutionTime: (() => {
        const resolvedTickets = filteredTickets.filter(t => t.resolved_at);
        if (resolvedTickets.length === 0) return 0;
        const totalHours = resolvedTickets.reduce((sum, t) => {
          const created = new Date(t.created_at);
          const resolved = new Date(t.resolved_at!);
          return sum + differenceInHours(resolved, created);
        }, 0);
        return Math.round(totalHours / resolvedTickets.length);
      })(),
      newToday: tickets.filter(t => {
        const today = new Date();
        const ticketDate = new Date(t.created_at);
        return today.toDateString() === ticketDate.toDateString();
      }).length,
      newThisWeek: tickets.filter(t => {
        const weekAgo = subDays(new Date(), 7);
        const ticketDate = new Date(t.created_at);
        return ticketDate >= weekAgo;
      }).length,
      newThisMonth: tickets.filter(t => {
        const monthAgo = subDays(new Date(), 30);
        const ticketDate = new Date(t.created_at);
        return ticketDate >= monthAgo;
      }).length
    };

    // 2. Temsilci Performansı
    const agentPerformance = agents.map(agent => {
      const agentTickets = filteredTickets.filter(t => t.agent_id === agent.id);
      const resolvedTickets = agentTickets.filter(t => t.status === 'resolved' || t.status === 'closed');
      const activeTickets = agentTickets.filter(t => t.status === 'open' || t.status === 'in_progress');
      
      const avgResolutionTime = resolvedTickets.length > 0 
        ? Math.round(resolvedTickets.reduce((sum, t) => {
            const created = new Date(t.created_at);
            const resolved = new Date(t.resolved_at!);
            return sum + differenceInHours(resolved, created);
          }, 0) / resolvedTickets.length)
        : 0;

      const satisfactionScore = resolvedTickets.length > 0
        ? Math.round(resolvedTickets.reduce((sum, t) => sum + (t.satisfaction_rating || 0), 0) / resolvedTickets.length * 10) / 10
        : 0;

      const successRate = agentTickets.length > 0 
        ? Math.round((resolvedTickets.length / agentTickets.length) * 100)
        : 0;

      return {
        id: agent.id,
        name: agent.name,
        resolved: resolvedTickets.length,
        avgResolutionTime,
        satisfactionScore,
        activeTickets: activeTickets.length,
        successRate
      };
    }).sort((a, b) => b.resolved - a.resolved);

    // 3. Müşteri Analitikleri
    const customerAnalytics = {
      totalCustomers: customers.length,
      newCustomers: customers.filter(c => {
        const customerDate = new Date(c.created_at);
        return customerDate >= startDate && customerDate <= endDate;
      }).length,
      churnedCustomers: 0, // Basit hesaplama
      churnRate: 0,
      avgSatisfaction: customers.length > 0 
        ? Math.round(customers.reduce((sum, c) => sum + (c.satisfaction_score || 0), 0) / customers.length * 10) / 10
        : 0,
      topCustomers: customers.map(customer => {
        const customerTickets = filteredTickets.filter(t => t.customer_id === customer.id);
        const customerPayments = filteredPayments.filter(p => p.customer_id === customer.id);
        
        return {
          id: customer.id,
          name: customer.name,
          totalTickets: customerTickets.length,
          avgSatisfaction: customerTickets.length > 0
            ? Math.round(customerTickets.reduce((sum, t) => sum + (t.satisfaction_rating || 0), 0) / customerTickets.length * 10) / 10
            : 0,
          totalSpent: customerPayments.reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0)
        };
      }).sort((a, b) => b.totalTickets - a.totalTickets).slice(0, 10)
    };

    // 4. Finansal Analitikler
    const completedPayments = filteredPayments.filter(p => p.status === 'completed' || p.status === 'paid');
    const totalRevenue = completedPayments.reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0);
    const totalExpenses = filteredExpenses.reduce((sum, e) => sum + (parseFloat(e.amount) || 0), 0);
    const payingCustomers = new Set(completedPayments.map(p => p.customer_id)).size;

    const financialAnalytics = {
      mrr: subscriptions.filter(s => s.status === 'active').reduce((sum, s) => {
        const plan = subscriptionPlans.find(p => p.id === s.plan_id);
        return sum + (parseFloat(plan?.price || '0') || 0);
      }, 0),
      arr: 0, // MRR * 12
      totalRevenue,
      totalExpenses,
      netProfit: totalRevenue - totalExpenses,
      arpu: payingCustomers > 0 ? totalRevenue / payingCustomers : 0,
      ltv: 0, // Basit hesaplama
      churnRate: 0,
      revenueByPlan: (() => {
        const planRevenue: { [key: string]: { revenue: number; customers: Set<string> } } = {};
        
        completedPayments.forEach(payment => {
          const subscription = subscriptions.find(s => s.id === payment.subscription_id);
          if (subscription) {
            const plan = subscriptionPlans.find(p => p.id === subscription.plan_id);
            const planName = plan?.name || 'Bilinmeyen';
            
            if (!planRevenue[planName]) {
              planRevenue[planName] = { revenue: 0, customers: new Set() };
            }
            
            planRevenue[planName].revenue += parseFloat(payment.amount) || 0;
            planRevenue[planName].customers.add(payment.customer_id);
          }
        });

        return Object.entries(planRevenue).map(([plan, data]) => ({
          plan,
          revenue: data.revenue,
          customers: data.customers.size
        }));
      })()
    };

    // 5. Zaman Bazlı Analitikler
    const dailyTrends = (() => {
      const trends: { [key: string]: { tickets: number; resolved: number; revenue: number } } = {};
      
      // Son 30 gün için günlük veriler
      for (let i = 0; i < 30; i++) {
        const date = subDays(new Date(), i);
        const dateStr = format(date, 'yyyy-MM-dd');
        trends[dateStr] = { tickets: 0, resolved: 0, revenue: 0 };
      }

      // Talep verilerini ekle
      filteredTickets.forEach(ticket => {
        const dateStr = format(new Date(ticket.created_at), 'yyyy-MM-dd');
        if (trends[dateStr]) {
          trends[dateStr].tickets++;
          if (ticket.status === 'resolved' || ticket.status === 'closed') {
            trends[dateStr].resolved++;
          }
        }
      });

      // Ödeme verilerini ekle
      completedPayments.forEach(payment => {
        const dateStr = format(new Date(payment.payment_date!), 'yyyy-MM-dd');
        if (trends[dateStr]) {
          trends[dateStr].revenue += parseFloat(payment.amount) || 0;
        }
      });

      return Object.entries(trends)
        .map(([date, data]) => ({
          date: format(new Date(date), 'dd MMM', { locale: tr }),
          ...data
        }))
        .reverse();
    })();

    // 6. Kategori Analitikleri
    const categoryAnalytics = (() => {
      const categoryData: { [key: string]: { count: number; resolutionTimes: number[]; satisfactionScores: number[] } } = {};
      
      filteredTickets.forEach(ticket => {
        if (!categoryData[ticket.category]) {
          categoryData[ticket.category] = { count: 0, resolutionTimes: [], satisfactionScores: [] };
        }
        
        categoryData[ticket.category].count++;
        
        if (ticket.resolved_at) {
          const created = new Date(ticket.created_at);
          const resolved = new Date(ticket.resolved_at);
          categoryData[ticket.category].resolutionTimes.push(differenceInHours(resolved, created));
        }
        
        if (ticket.satisfaction_rating) {
          categoryData[ticket.category].satisfactionScores.push(ticket.satisfaction_rating);
        }
      });

      return Object.entries(categoryData).map(([category, data]) => ({
        category,
        count: data.count,
        avgResolutionTime: data.resolutionTimes.length > 0 
          ? Math.round(data.resolutionTimes.reduce((sum, time) => sum + time, 0) / data.resolutionTimes.length)
          : 0,
        satisfactionScore: data.satisfactionScores.length > 0
          ? Math.round(data.satisfactionScores.reduce((sum, score) => sum + score, 0) / data.satisfactionScores.length * 10) / 10
          : 0,
        percentage: Math.round((data.count / filteredTickets.length) * 100)
      })).sort((a, b) => b.count - a.count);
    })();

    // 7. SLA Analitikleri
    const slaAnalytics = {
      slaBreaches: ticketStats.overdue,
      slaCompliance: filteredTickets.length > 0 
        ? Math.round(((filteredTickets.length - ticketStats.overdue) / filteredTickets.length) * 100)
        : 100,
      avgResponseTime: 0, // Basit hesaplama
      avgResolutionTime: ticketStats.avgResolutionTime,
      slaByPriority: (() => {
        const priorityData: { [key: string]: { breaches: number; compliant: number } } = {};
        
        filteredTickets.forEach(ticket => {
          if (!priorityData[ticket.priority]) {
            priorityData[ticket.priority] = { breaches: 0, compliant: 0 };
          }
          
          if (ticket.status === 'resolved' || ticket.status === 'closed') {
            priorityData[ticket.priority].compliant++;
          } else {
            const created = new Date(ticket.created_at);
            const now = new Date();
            const diffHours = differenceInHours(now, created);
            if (diffHours > 24) {
              priorityData[ticket.priority].breaches++;
            }
          }
        });

        return Object.entries(priorityData).map(([priority, data]) => ({
          priority,
          breaches: data.breaches,
          compliance: data.compliant
        }));
      })()
    };

    return {
      ticketStats,
      agentPerformance,
      customerAnalytics,
      financialAnalytics,
      timeAnalytics: { dailyTrends },
      categoryAnalytics,
      slaAnalytics
    };
  }, [tickets, customers, agents, payments, subscriptions, expenses, dateRange, selectedPeriod]);

  const formatCurrency = (n: number) => `₺${n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  const handleExportReport = () => {
    const reportData = {
      generatedAt: new Date().toISOString(),
      period: `${dateRange} gün`,
      analyticsData
    };

    const dataStr = JSON.stringify(reportData, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    
    const exportFileDefaultName = `analitik-raporu-${new Date().toISOString().split('T')[0]}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Gelişmiş Analitik Raporları</h1>
          <p className="text-gray-600 mt-2">Gerçek zamanlı verilerle detaylı performans analizi</p>
        </div>
        <div className="flex items-center gap-4">
          {/* Filtreler */}
          {activeTab === 'analytics' && (
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
          )}
          {activeTab === 'analytics' && (
            <button
              onClick={handleExportReport}
              className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Download className="w-4 h-4" />
              Rapor İndir
            </button>
          )}
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-gray-200 mb-8">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('analytics')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'analytics'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Analitik Raporlar
          </button>
          <button
            onClick={() => setActiveTab('auto-reports')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'auto-reports'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Otomatik Raporlar
          </button>
          <button
            onClick={() => setActiveTab('alerts')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'alerts'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Akıllı Uyarılar
          </button>
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'dashboard'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Gerçek Zamanlı Dashboard
          </button>
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === 'analytics' && (
        <>
          {/* Ana Metrikler */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Toplam Talepler</p>
              <p className="mt-2 text-2xl font-bold text-gray-900">{analyticsData.ticketStats.total}</p>
              <p className="text-sm text-green-600 mt-1">+{analyticsData.ticketStats.newToday} bugün</p>
            </div>
            <div className="bg-blue-500 p-3 rounded-lg">
              <MessageSquare className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Çözüm Oranı</p>
              <p className="mt-2 text-2xl font-bold text-gray-900">
                {analyticsData.ticketStats.total > 0 
                  ? Math.round((analyticsData.ticketStats.resolved / analyticsData.ticketStats.total) * 100)
                  : 0}%
              </p>
              <p className="text-sm text-green-600 mt-1">
                {analyticsData.ticketStats.resolved} çözüldü
              </p>
            </div>
            <div className="bg-green-500 p-3 rounded-lg">
              <CheckCircle className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Ortalama Çözüm Süresi</p>
              <p className="mt-2 text-2xl font-bold text-gray-900">{analyticsData.ticketStats.avgResolutionTime}s</p>
              <p className="text-sm text-orange-600 mt-1">
                {analyticsData.ticketStats.overdue} SLA ihlali
              </p>
            </div>
            <div className="bg-orange-500 p-3 rounded-lg">
              <Clock className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Toplam Gelir</p>
              <p className="mt-2 text-2xl font-bold text-gray-900">{formatCurrency(analyticsData.financialAnalytics.totalRevenue)}</p>
              <p className="text-sm text-green-600 mt-1">
                ARPU: {formatCurrency(analyticsData.financialAnalytics.arpu)}
              </p>
            </div>
            <div className="bg-purple-500 p-3 rounded-lg">
              <DollarSign className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>
      </div>

      {/* Grafikler */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        {/* Günlük Trendler */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Günlük Talep Trendleri</h3>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={analyticsData.timeAnalytics.dailyTrends}>
              <defs>
                <linearGradient id="ticketsColor" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.35}/>
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="resolvedColor" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.35}/>
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Area type="monotone" dataKey="tickets" stroke="#3b82f6" fill="url(#ticketsColor)" name="Toplam Talepler" />
              <Area type="monotone" dataKey="resolved" stroke="#10b981" fill="url(#resolvedColor)" name="Çözülen" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Kategori Dağılımı */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Kategori Dağılımı</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={analyticsData.categoryAnalytics}
                cx="50%"
                cy="50%"
                outerRadius={100}
                dataKey="count"
                label={({ category, percentage }) => `${category} ${percentage}%`}
              >
                {analyticsData.categoryAnalytics.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={`hsl(${index * 60}, 70%, 50%)`} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Temsilci Performansı */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Temsilci Performans Analizi</h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 font-medium text-gray-900">Temsilci</th>
                <th className="text-center py-3 px-4 font-medium text-gray-900">Çözülen</th>
                <th className="text-center py-3 px-4 font-medium text-gray-900">Ort. Süre</th>
                <th className="text-center py-3 px-4 font-medium text-gray-900">Memnuniyet</th>
                <th className="text-center py-3 px-4 font-medium text-gray-900">Aktif</th>
                <th className="text-center py-3 px-4 font-medium text-gray-900">Başarı Oranı</th>
              </tr>
            </thead>
            <tbody>
              {analyticsData.agentPerformance.slice(0, 5).map((agent, index) => (
                <tr key={agent.id} className="border-b border-gray-100">
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                        <span className="text-blue-600 font-semibold text-sm">{agent.name.charAt(0)}</span>
                      </div>
                      <span className="font-medium text-gray-900">{agent.name}</span>
                    </div>
                  </td>
                  <td className="text-center py-3 px-4 text-gray-900">{agent.resolved}</td>
                  <td className="text-center py-3 px-4 text-gray-900">{agent.avgResolutionTime}s</td>
                  <td className="text-center py-3 px-4">
                    <div className="flex items-center justify-center gap-1">
                      <Star className="w-4 h-4 text-yellow-400 fill-current" />
                      <span className="text-gray-900">{agent.satisfactionScore}</span>
                    </div>
                  </td>
                  <td className="text-center py-3 px-4 text-gray-900">{agent.activeTickets}</td>
                  <td className="text-center py-3 px-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      agent.successRate >= 80 ? 'bg-green-100 text-green-800' :
                      agent.successRate >= 60 ? 'bg-yellow-100 text-yellow-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      %{agent.successRate}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* SLA ve Performans Metrikleri */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        {/* SLA Analizi */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">SLA Performansı</h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-gray-600">SLA Uyumluluğu</span>
              <span className="font-semibold text-gray-900">%{analyticsData.slaAnalytics.slaCompliance}</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-green-500 h-2 rounded-full" 
                style={{ width: `${analyticsData.slaAnalytics.slaCompliance}%` }}
              ></div>
            </div>
            <div className="grid grid-cols-2 gap-4 mt-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-red-600">{analyticsData.slaAnalytics.slaBreaches}</div>
                <div className="text-sm text-gray-600">SLA İhlali</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900">{analyticsData.slaAnalytics.avgResolutionTime}s</div>
                <div className="text-sm text-gray-600">Ort. Çözüm Süresi</div>
              </div>
            </div>
          </div>
        </div>

        {/* Müşteri Analitikleri */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Müşteri Analitikleri</h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Toplam Müşteri</span>
              <span className="font-semibold text-gray-900">{analyticsData.customerAnalytics.totalCustomers}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Yeni Müşteri</span>
              <span className="font-semibold text-green-600">+{analyticsData.customerAnalytics.newCustomers}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Ortalama Memnuniyet</span>
              <div className="flex items-center gap-1">
                <Star className="w-4 h-4 text-yellow-400 fill-current" />
                <span className="font-semibold text-gray-900">{analyticsData.customerAnalytics.avgSatisfaction}</span>
              </div>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">ARPU</span>
              <span className="font-semibold text-gray-900">{formatCurrency(analyticsData.financialAnalytics.arpu)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Detaylı İstatistikler */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center gap-3">
            <div className="bg-blue-100 p-2 rounded-lg">
              <Users className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Aktif Temsilci</p>
              <p className="text-xl font-bold text-gray-900">{agents.filter(a => a.status === 'online').length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center gap-3">
            <div className="bg-green-100 p-2 rounded-lg">
              <UserCheck className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Yeni Müşteri</p>
              <p className="text-xl font-bold text-gray-900">{analyticsData.customerAnalytics.newCustomers}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center gap-3">
            <div className="bg-red-100 p-2 rounded-lg">
              <UserX className="w-5 h-5 text-red-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Yüksek Öncelik</p>
              <p className="text-xl font-bold text-gray-900">{analyticsData.ticketStats.highPriority}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center gap-3">
            <div className="bg-purple-100 p-2 rounded-lg">
              <Activity className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Bu Hafta</p>
              <p className="text-xl font-bold text-gray-900">{analyticsData.ticketStats.newThisWeek}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Akıllı İpuçları Sistemi */}
      <RealTimeHintSystem
        currentPage="analytics"
        currentAction={dateRange}
        userRole="admin"
        contextData={{
          dateRange: dateRange,
          selectedPeriod: selectedPeriod,
          ticketStats: analyticsData.ticketStats,
          financialAnalytics: analyticsData.financialAnalytics,
          customerAnalytics: analyticsData.customerAnalytics,
          slaAnalytics: analyticsData.slaAnalytics,
          agentPerformance: analyticsData.agentPerformance
        }}
        onHintAction={(hintId, action) => {
          console.log('Analytics hint action:', hintId, action);
          
          switch (action) {
            case 'optimize_resources':
              // Kaynak optimizasyonu
              toast.success('Kaynak optimizasyonu başlatıldı');
              break;
            case 'view_trend_report':
              // Trend raporu
              toast.success('Trend raporu açılıyor');
              break;
            case 'performance_analysis':
              // Performans analizi
              toast.success('Detaylı performans analizi başlatıldı');
              break;
            case 'sla_optimization':
              // SLA optimizasyonu
              toast.success('SLA optimizasyonu başlatıldı');
              break;
            default:
              console.log('Unknown analytics hint action:', action);
          }
        }}
      />
        </>
      )}

      {/* Otomatik Raporlar Tab */}
      {activeTab === 'auto-reports' && (
        <AutoReportManager />
      )}

      {/* Akıllı Uyarılar Tab */}
      {activeTab === 'alerts' && (
        <SmartAlertManager />
      )}

      {/* Gerçek Zamanlı Dashboard Tab */}
      {activeTab === 'dashboard' && (
        <RealtimeDashboard />
      )}
    </div>
  );
};

export default ReportsPage;