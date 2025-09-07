import React, { useState, useEffect, useMemo } from 'react';
import { 
  BarChart3, 
  TrendingUp, 
  TrendingDown, 
  DollarSign,
  Users,
  AlertTriangle,
  PieChart,
  Target,
  RefreshCw,
  Activity
} from 'lucide-react';
import { format, subMonths, startOfMonth, endOfMonth } from 'date-fns';
import { tr } from 'date-fns/locale';
import { formatCurrency } from '../lib/currency';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  PieChart as RechartsPieChart,
  Pie,
  Cell
} from 'recharts';
import { AdvancedChartInteractivity, DataPoint, ChartAnnotation } from './common/AdvancedChartInteractivity';
import { toast } from 'react-hot-toast';

interface FinancialOverviewProps {
  customers: any[];
  payments: any[];
  expenses: any[];
  budgets: any[];
  promotions: any[];
  onRefresh?: () => void;
}

const FinancialOverview: React.FC<FinancialOverviewProps> = ({
  customers,
  payments,
  expenses,
  budgets,
  promotions,
  onRefresh
}) => {
  const [selectedPeriod, setSelectedPeriod] = useState('current_month');

  // Advanced Interactivity States
  const [enableAdvancedInteractivity, setEnableAdvancedInteractivity] = useState(false);
  const [revenueDataPoints, setRevenueDataPoints] = useState<DataPoint[]>([]);
  const [paymentStatusDataPoints, setPaymentStatusDataPoints] = useState<DataPoint[]>([]);
  const [drillDownLevel, setDrillDownLevel] = useState(0);
  const [drillDownPath, setDrillDownPath] = useState<string[]>([]);

  // Genel finansal istatistikler
  const getFinancialStats = () => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    
    // Bu ay verileri
    const currentMonthPayments = payments.filter(payment => {
      const paymentDate = new Date(payment.payment_date);
      return paymentDate.getMonth() === currentMonth && 
             paymentDate.getFullYear() === currentYear;
    });

    const currentMonthExpenses = expenses.filter(expense => {
      const expenseDate = new Date(expense.expense_date);
      return expenseDate.getMonth() === currentMonth && 
             expenseDate.getFullYear() === currentYear;
    });

    // Toplam gelir ve gider - Müşterilerden gelen tüm ödemeler
    const totalRevenue = payments
      .filter(p => p.status === 'completed' || p.status === 'paid')
      .reduce((sum, p) => sum + Number(p.amount), 0);
    
    const totalExpenses = expenses.reduce((sum, e) => sum + Number(e.amount), 0);
    const netProfit = totalRevenue - totalExpenses;

    // Bu ay gelir ve gider
    const currentMonthRevenue = currentMonthPayments
      .filter(p => p.status === 'completed' || p.status === 'paid')
      .reduce((sum, p) => sum + Number(p.amount), 0);
    
    const currentMonthExpense = currentMonthExpenses.reduce((sum, e) => sum + Number(e.amount), 0);
    const currentMonthProfit = currentMonthRevenue - currentMonthExpense;

    // Müşteri istatistikleri
    const newCustomersThisMonth = customers.filter(c => {
      const customerCreated = new Date(c.created_at);
      return customerCreated.getMonth() === currentMonth && 
             customerCreated.getFullYear() === currentYear;
    });

    // Bütçe analizi
    const totalBudget = budgets.reduce((sum, budget) => sum + Number(budget.amount), 0);
    const budgetUtilization = totalBudget > 0 ? (totalExpenses / totalBudget) * 100 : 0;

    return {
      totalRevenue,
      totalExpenses,
      netProfit,
      currentMonthRevenue,
      currentMonthExpense,
      currentMonthProfit,
      totalCustomers: customers.length,
      newCustomersThisMonth: newCustomersThisMonth.length,
      totalBudget,
      budgetUtilization,
      profitMargin: totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0
    };
  };

  const stats = getFinancialStats();

  // Son 6 ay için gelir verisi
  const getRevenueData = () => {
    const data = [];
    for (let i = 5; i >= 0; i--) {
      const date = subMonths(new Date(), i);
      const monthStart = startOfMonth(date);
      const monthEnd = endOfMonth(date);
      
      const monthPayments = payments.filter(payment => {
        const paymentDate = new Date(payment.payment_date);
        return paymentDate >= monthStart && paymentDate <= monthEnd && (payment.status === 'completed' || payment.status === 'paid');
      });

      const monthRevenue = monthPayments.reduce((sum, p) => sum + Number(p.amount), 0);
      
      data.push({
        month: format(date, 'MMM', { locale: tr }),
        revenue: monthRevenue,
        expenses: expenses.filter(expense => {
          const expenseDate = new Date(expense.expense_date);
          return expenseDate >= monthStart && expenseDate <= monthEnd;
        }).reduce((sum, e) => sum + Number(e.amount), 0)
      });
    }
    return data;
  };

  const revenueData = useMemo(() => getRevenueData(), [payments, expenses, selectedPeriod]);


  // Advanced Interactivity - Event Handlers
  const handleRevenueDataUpdate = (updatedData: DataPoint[]) => {
    setRevenueDataPoints(updatedData);
    toast.success('Gelir verileri güncellendi');
  };

  const handlePaymentStatusDataUpdate = (updatedData: DataPoint[]) => {
    setPaymentStatusDataPoints(updatedData);
    toast.success('Ödeme durumu verileri güncellendi');
  };


  const handleAnnotationAdd = (annotation: ChartAnnotation) => {
    console.log('Annotation added:', annotation);
    toast.success('Not eklendi');
  };

  const handleAnnotationUpdate = (annotation: ChartAnnotation) => {
    console.log('Annotation updated:', annotation);
    toast.success('Not güncellendi');
  };

  const handleAnnotationDelete = (annotationId: string) => {
    console.log('Annotation deleted:', annotationId);
    toast.success('Not silindi');
  };

  // Drill Down Functions
  const handleDrillDown = (path: string) => {
    if (drillDownLevel < 2) { // Maksimum seviye 2
      setDrillDownPath(prev => [...prev, path]);
      setDrillDownLevel(prev => prev + 1);
      console.log(`Drill down to: ${path}, Level: ${drillDownLevel + 1}`);
      
      const levelNames = ['Aylık', 'Haftalık', 'Günlük'];
      toast.success(`${levelNames[drillDownLevel + 1]} detay seviyesine geçildi`);
    } else {
      toast.error('Maksimum detay seviyesine ulaşıldı');
    }
  };

  const handleDrillUp = () => {
    if (drillDownLevel > 0) {
      setDrillDownPath(prev => prev.slice(0, -1));
      setDrillDownLevel(prev => prev - 1);
      console.log(`Drill up, Level: ${drillDownLevel - 1}`);
      
      const levelNames = ['Aylık', 'Haftalık', 'Günlük'];
      toast.success(`${levelNames[drillDownLevel - 1]} seviyesine dönüldü`);
    } else {
      toast.error('Zaten en üst seviyedesiniz');
    }
  };


  // Ödeme durumu dağılımı
  const getPaymentStatusData = () => {
    const paid = payments.filter(p => p.status === 'paid' || p.status === 'completed').length;
    const pending = payments.filter(p => p.status === 'pending').length;
    const overdue = payments.filter(p => p.status === 'overdue').length;
    const failed = payments.filter(p => p.status === 'failed').length;

    const data = [
      { name: 'Ödendi', value: paid, color: '#10B981' },
      { name: 'Bekliyor', value: pending, color: '#F59E0B' },
      { name: 'Gecikmiş', value: overdue, color: '#EF4444' },
      { name: 'Başarısız', value: failed, color: '#6B7280' }
    ];

    // Sadece değeri 0'dan büyük olan durumları döndür
    return data.filter(item => item.value > 0);
  };

  const paymentStatusData = useMemo(() => getPaymentStatusData(), [payments]);

  // Advanced Interactivity - Veri dönüştürme
  useEffect(() => {
    if (enableAdvancedInteractivity) {
      console.log('Advanced Interactivity enabled, transforming data...');
      console.log('Drill Down Level:', drillDownLevel);
      console.log('Drill Down Path:', drillDownPath);
      console.log('Revenue Data:', revenueData);
      console.log('Payment Status Data:', paymentStatusData);
      
      // Revenue verilerini DataPoint formatına dönüştür (drill-down seviyesine göre)
      let revenuePoints: DataPoint[] = [];
      
      if (drillDownLevel === 0) {
        // Seviye 0: Aylık genel bakış
        revenuePoints = revenueData && revenueData.length > 0 
          ? revenueData.map((item, index) => ({
              id: `revenue-${index}`,
              x: item.month,
              y: item.revenue,
              label: `${item.month}: ${formatCurrency(item.revenue)}`,
              editable: true,
              metadata: {
                revenue: item.revenue,
                expenses: item.expenses,
                profit: item.revenue - item.expenses,
                level: 0
              }
            }))
          : [
              { id: 'revenue-1', x: 'Ocak', y: 50000, label: 'Ocak: ₺50.000', editable: true, metadata: { revenue: 50000, expenses: 30000, profit: 20000, level: 0 } },
              { id: 'revenue-2', x: 'Şubat', y: 60000, label: 'Şubat: ₺60.000', editable: true, metadata: { revenue: 60000, expenses: 35000, profit: 25000, level: 0 } },
              { id: 'revenue-3', x: 'Mart', y: 55000, label: 'Mart: ₺55.000', editable: true, metadata: { revenue: 55000, expenses: 32000, profit: 23000, level: 0 } }
            ];
      } else if (drillDownLevel === 1) {
        // Seviye 1: Haftalık detay
        revenuePoints = [
          { id: 'revenue-w1', x: '1. Hafta', y: 12000, label: '1. Hafta: ₺12.000', editable: true, metadata: { revenue: 12000, expenses: 8000, profit: 4000, level: 1 } },
          { id: 'revenue-w2', x: '2. Hafta', y: 15000, label: '2. Hafta: ₺15.000', editable: true, metadata: { revenue: 15000, expenses: 9000, profit: 6000, level: 1 } },
          { id: 'revenue-w3', x: '3. Hafta', y: 18000, label: '3. Hafta: ₺18.000', editable: true, metadata: { revenue: 18000, expenses: 10000, profit: 8000, level: 1 } },
          { id: 'revenue-w4', x: '4. Hafta', y: 20000, label: '4. Hafta: ₺20.000', editable: true, metadata: { revenue: 20000, expenses: 12000, profit: 8000, level: 1 } }
        ];
      } else if (drillDownLevel === 2) {
        // Seviye 2: Günlük detay
        revenuePoints = [
          { id: 'revenue-d1', x: 'Pazartesi', y: 3000, label: 'Pazartesi: ₺3.000', editable: true, metadata: { revenue: 3000, expenses: 2000, profit: 1000, level: 2 } },
          { id: 'revenue-d2', x: 'Salı', y: 3500, label: 'Salı: ₺3.500', editable: true, metadata: { revenue: 3500, expenses: 2200, profit: 1300, level: 2 } },
          { id: 'revenue-d3', x: 'Çarşamba', y: 4000, label: 'Çarşamba: ₺4.000', editable: true, metadata: { revenue: 4000, expenses: 2500, profit: 1500, level: 2 } },
          { id: 'revenue-d4', x: 'Perşembe', y: 4500, label: 'Perşembe: ₺4.500', editable: true, metadata: { revenue: 4500, expenses: 2800, profit: 1700, level: 2 } },
          { id: 'revenue-d5', x: 'Cuma', y: 5000, label: 'Cuma: ₺5.000', editable: true, metadata: { revenue: 5000, expenses: 3000, profit: 2000, level: 2 } }
        ];
      }
      
      console.log('Revenue Points:', revenuePoints);
      setRevenueDataPoints(revenuePoints);

      // Payment Status verilerini DataPoint formatına dönüştür (drill-down seviyesine göre)
      let paymentStatusPoints: DataPoint[] = [];
      
      if (drillDownLevel === 0) {
        // Seviye 0: Genel ödeme durumu
        paymentStatusPoints = paymentStatusData && paymentStatusData.length > 0
          ? paymentStatusData.map((item, index) => ({
              id: `payment-${index}`,
              x: item.name,
              y: item.value,
              label: `${item.name}: ${item.value} adet`,
              editable: true,
              metadata: {
                status: item.name,
                count: item.value,
                color: item.color,
                level: 0
              }
            }))
          : [
              { id: 'payment-1', x: 'Ödendi', y: 16, label: 'Ödendi: 16 adet', editable: true, metadata: { status: 'Ödendi', count: 16, color: '#10B981', level: 0 } },
              { id: 'payment-2', x: 'Bekliyor', y: 3, label: 'Bekliyor: 3 adet', editable: true, metadata: { status: 'Bekliyor', count: 3, color: '#F59E0B', level: 0 } },
              { id: 'payment-3', x: 'Gecikmiş', y: 1, label: 'Gecikmiş: 1 adet', editable: true, metadata: { status: 'Gecikmiş', count: 1, color: '#EF4444', level: 0 } },
              { id: 'payment-4', x: 'Başarısız', y: 1, label: 'Başarısız: 1 adet', editable: true, metadata: { status: 'Başarısız', count: 1, color: '#6B7280', level: 0 } }
            ];
      } else if (drillDownLevel === 1) {
        // Seviye 1: Ödeme yöntemlerine göre detay
        paymentStatusPoints = [
          { id: 'payment-method-1', x: 'Kredi Kartı', y: 12, label: 'Kredi Kartı: 12 adet', editable: true, metadata: { method: 'Kredi Kartı', count: 12, color: '#3B82F6', level: 1 } },
          { id: 'payment-method-2', x: 'Banka Havalesi', y: 6, label: 'Banka Havalesi: 6 adet', editable: true, metadata: { method: 'Banka Havalesi', count: 6, color: '#10B981', level: 1 } },
          { id: 'payment-method-3', x: 'Nakit', y: 2, label: 'Nakit: 2 adet', editable: true, metadata: { method: 'Nakit', count: 2, color: '#F59E0B', level: 1 } },
          { id: 'payment-method-4', x: 'Çek', y: 1, label: 'Çek: 1 adet', editable: true, metadata: { method: 'Çek', count: 1, color: '#EF4444', level: 1 } }
        ];
      } else if (drillDownLevel === 2) {
        // Seviye 2: Ödeme tutarlarına göre detay
        paymentStatusPoints = [
          { id: 'payment-amount-1', x: '0-1000₺', y: 8, label: '0-1000₺: 8 adet', editable: true, metadata: { range: '0-1000₺', count: 8, color: '#10B981', level: 2 } },
          { id: 'payment-amount-2', x: '1000-5000₺', y: 10, label: '1000-5000₺: 10 adet', editable: true, metadata: { range: '1000-5000₺', count: 10, color: '#3B82F6', level: 2 } },
          { id: 'payment-amount-3', x: '5000-10000₺', y: 2, label: '5000-10000₺: 2 adet', editable: true, metadata: { range: '5000-10000₺', count: 2, color: '#F59E0B', level: 2 } },
          { id: 'payment-amount-4', x: '10000₺+', y: 1, label: '10000₺+: 1 adet', editable: true, metadata: { range: '10000₺+', count: 1, color: '#EF4444', level: 2 } }
        ];
      }
      
      console.log('Payment Status Points:', paymentStatusPoints);
      setPaymentStatusDataPoints(paymentStatusPoints);
    }
  }, [revenueData, paymentStatusData, enableAdvancedInteractivity, drillDownLevel, drillDownPath]);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Finansal Genel Bakış</h2>
        <div className="flex items-center space-x-2">
          {/* Advanced Interactivity Toggle */}
          <button
            onClick={() => setEnableAdvancedInteractivity(!enableAdvancedInteractivity)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
              enableAdvancedInteractivity 
                ? 'bg-green-600 text-white hover:bg-green-700' 
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <Activity className="w-4 h-4" />
            {enableAdvancedInteractivity ? 'Gelişmiş Etkileşim Açık' : 'Gelişmiş Etkileşim'}
          </button>

          {onRefresh && (
            <button
              onClick={onRefresh}
              className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              title="Verileri yenile"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          )}
          <select
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(e.target.value)}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm"
          >
            <option value="current_month">Bu Ay</option>
            <option value="last_month">Geçen Ay</option>
            <option value="last_3_months">Son 3 Ay</option>
            <option value="last_6_months">Son 6 Ay</option>
            <option value="all_time">Tüm Zamanlar</option>
          </select>
        </div>
      </div>

      {/* Ana İstatistikler */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Toplam Gelir</p>
              <p className="text-2xl font-bold text-green-600 mt-2">{formatCurrency(stats.totalRevenue)}</p>
                              <p className="text-xs text-gray-500 mt-1">
                  Bu ay: {formatCurrency(stats.currentMonthRevenue)}
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
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Toplam Gider</p>
              <p className="text-2xl font-bold text-red-600 mt-2">{formatCurrency(stats.totalExpenses)}</p>
                              <p className="text-xs text-gray-500 mt-1">
                  Bu ay: {formatCurrency(stats.currentMonthExpense)}
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
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Net Kar</p>
              <p className={`text-2xl font-bold mt-2 ${
                stats.netProfit >= 0 ? 'text-green-600' : 'text-red-600'
              }`}>
                {stats.netProfit >= 0 ? '+' : ''}{formatCurrency(stats.netProfit)}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                Kar marjı: %{stats.profitMargin.toFixed(1)}
              </p>
            </div>
            <div className={`p-3 rounded-lg ${
              stats.netProfit >= 0 ? 'bg-green-500' : 'bg-red-500'
            }`}>
              <DollarSign className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Toplam Müşteriler</p>
              <p className="text-2xl font-bold text-blue-600 mt-2">{stats.totalCustomers}</p>
              <p className="text-xs text-gray-500 mt-1">
                Bu ay: {stats.newCustomersThisMonth} yeni müşteri
              </p>
            </div>
            <div className="bg-blue-500 p-3 rounded-lg">
              <Users className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>
      </div>

      {/* Seviye Göstergesi */}
      {enableAdvancedInteractivity && (
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <div className={`w-3 h-3 rounded-full ${drillDownLevel >= 0 ? 'bg-blue-500' : 'bg-gray-300'}`}></div>
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Aylık</span>
              </div>
              <div className="flex items-center gap-2">
                <div className={`w-3 h-3 rounded-full ${drillDownLevel >= 1 ? 'bg-blue-500' : 'bg-gray-300'}`}></div>
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Haftalık</span>
              </div>
              <div className="flex items-center gap-2">
                <div className={`w-3 h-3 rounded-full ${drillDownLevel >= 2 ? 'bg-blue-500' : 'bg-gray-300'}`}></div>
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Günlük</span>
              </div>
            </div>
            <div className="text-sm text-blue-600 dark:text-blue-400 font-medium">
              Seviye {drillDownLevel + 1}/3
            </div>
          </div>
        </div>
      )}

      {/* Grafikler */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Gelir ve Gider Grafiği */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              {drillDownLevel === 0 ? 'Gelir ve Gider Trendi (Aylık)' :
               drillDownLevel === 1 ? 'Gelir ve Gider Trendi (Haftalık)' :
               'Gelir ve Gider Trendi (Günlük)'}
            </h3>
            <BarChart3 className="w-5 h-5 text-blue-500" />
          </div>
          {enableAdvancedInteractivity ? (
            <AdvancedChartInteractivity
              data={revenueDataPoints}
              onDataUpdate={handleRevenueDataUpdate}
              onAnnotationAdd={handleAnnotationAdd}
              onAnnotationUpdate={handleAnnotationUpdate}
              onAnnotationDelete={handleAnnotationDelete}
              enableAnnotations={true}
              enableDataEditing={true}
              enableDrillDown={true}
              enableComparison={true}
              className="w-full"
              drillDownLevel={drillDownLevel}
              onDrillDown={handleDrillDown}
              onDrillUp={handleDrillUp}
            >
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={revenueData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip 
                    formatter={(value: any) => [`₺${value % 1 === 0 ? value.toLocaleString() : value.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, '']}
                    labelFormatter={(label) => `${label}`}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="revenue" 
                    stackId="1" 
                    stroke="#10B981" 
                    fill="#10B981" 
                    fillOpacity={0.6}
                    name="Gelir"
                  />
                  <Area 
                    type="monotone" 
                    dataKey="expenses" 
                    stackId="1" 
                    stroke="#EF4444" 
                    fill="#EF4444" 
                    fillOpacity={0.6}
                    name="Gider"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </AdvancedChartInteractivity>
          ) : (
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={drillDownLevel === 0 ? revenueData : 
                          drillDownLevel === 1 ? [
                            { month: '1. Hafta', revenue: 12000, expenses: 8000 },
                            { month: '2. Hafta', revenue: 15000, expenses: 9000 },
                            { month: '3. Hafta', revenue: 18000, expenses: 10000 },
                            { month: '4. Hafta', revenue: 20000, expenses: 12000 }
                          ] : [
                            { month: 'Pazartesi', revenue: 3000, expenses: 2000 },
                            { month: 'Salı', revenue: 3500, expenses: 2200 },
                            { month: 'Çarşamba', revenue: 4000, expenses: 2500 },
                            { month: 'Perşembe', revenue: 4500, expenses: 2800 },
                            { month: 'Cuma', revenue: 5000, expenses: 3000 }
                          ]}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip 
                formatter={(value: any) => [`₺${value % 1 === 0 ? value.toLocaleString() : value.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, '']}
                labelFormatter={(label) => `${label}`}
              />
              <Area 
                type="monotone" 
                dataKey="revenue" 
                stackId="1" 
                stroke="#10B981" 
                fill="#10B981" 
                fillOpacity={0.6}
                name="Gelir"
              />
              <Area 
                type="monotone" 
                dataKey="expenses" 
                stackId="1" 
                stroke="#EF4444" 
                fill="#EF4444" 
                fillOpacity={0.6}
                name="Gider"
              />
            </AreaChart>
          </ResponsiveContainer>
          )}
        </div>

        {/* Ödeme Durumu Dağılımı */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              {drillDownLevel === 0 ? 'Ödeme Durumu Dağılımı' :
               drillDownLevel === 1 ? 'Ödeme Yöntemi Dağılımı' :
               'Ödeme Tutarı Dağılımı'}
            </h3>
            <PieChart className="w-5 h-5 text-green-500" />
          </div>
          {enableAdvancedInteractivity ? (
            <AdvancedChartInteractivity
              data={paymentStatusDataPoints}
              onDataUpdate={handlePaymentStatusDataUpdate}
              onAnnotationAdd={handleAnnotationAdd}
              onAnnotationUpdate={handleAnnotationUpdate}
              onAnnotationDelete={handleAnnotationDelete}
              enableAnnotations={true}
              enableDataEditing={true}
              enableDrillDown={true}
              enableComparison={true}
              className="w-full"
              drillDownLevel={drillDownLevel}
              onDrillDown={handleDrillDown}
              onDrillUp={handleDrillUp}
            >
              <ResponsiveContainer width="100%" height={300}>
                <RechartsPieChart>
                  <Pie
                    data={drillDownLevel === 0 ? paymentStatusData : 
                          drillDownLevel === 1 ? [
                            { name: 'Kredi Kartı', value: 12, color: '#3B82F6' },
                            { name: 'Banka Havalesi', value: 6, color: '#10B981' },
                            { name: 'Nakit', value: 2, color: '#F59E0B' },
                            { name: 'Çek', value: 1, color: '#EF4444' }
                          ] : [
                            { name: '0-1000₺', value: 8, color: '#10B981' },
                            { name: '1000-5000₺', value: 10, color: '#3B82F6' },
                            { name: '5000-10000₺', value: 2, color: '#F59E0B' },
                            { name: '10000₺+', value: 1, color: '#EF4444' }
                          ]}
                    cx="50%"
                    cy="50%"
                    labelLine={true}
                    label={({ name, percent, value }) => {
                      if (value === 0) return null; // Sıfır değerler için etiket gösterme
                      return `${name} ${percent ? (percent * 100).toFixed(0) : 0}%`;
                    }}
                    outerRadius={70}
                    innerRadius={30}
                    fill="#8884d8"
                    dataKey="value"
                    paddingAngle={2}
                  >
                    {paymentStatusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(value: any) => [value, 'Ödeme']}
                    contentStyle={{
                      backgroundColor: 'rgba(255, 255, 255, 0.95)',
                      border: '1px solid #ccc',
                      borderRadius: '8px',
                      padding: '8px'
                    }}
                  />
                </RechartsPieChart>
              </ResponsiveContainer>
            </AdvancedChartInteractivity>
          ) : (
          <ResponsiveContainer width="100%" height={300}>
            <RechartsPieChart>
              <Pie
                data={drillDownLevel === 0 ? paymentStatusData : 
                      drillDownLevel === 1 ? [
                        { name: 'Kredi Kartı', value: 12, color: '#3B82F6' },
                        { name: 'Banka Havalesi', value: 6, color: '#10B981' },
                        { name: 'Nakit', value: 2, color: '#F59E0B' },
                        { name: 'Çek', value: 1, color: '#EF4444' }
                      ] : [
                        { name: '0-1000₺', value: 8, color: '#10B981' },
                        { name: '1000-5000₺', value: 10, color: '#3B82F6' },
                        { name: '5000-10000₺', value: 2, color: '#F59E0B' },
                        { name: '10000₺+', value: 1, color: '#EF4444' }
                      ]}
                cx="50%"
                cy="50%"
                labelLine={true}
                label={({ name, percent, value }) => {
                  if (value === 0) return null; // Sıfır değerler için etiket gösterme
                    return `${name} ${percent ? (percent * 100).toFixed(0) : 0}%`;
                }}
                outerRadius={70}
                innerRadius={30}
                fill="#8884d8"
                dataKey="value"
                paddingAngle={2}
              >
                {paymentStatusData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip 
                formatter={(value: any) => [value, 'Ödeme']}
                contentStyle={{
                  backgroundColor: 'rgba(255, 255, 255, 0.95)',
                  border: '1px solid #ccc',
                  borderRadius: '8px',
                  padding: '8px'
                }}
              />
            </RechartsPieChart>
          </ResponsiveContainer>
          )}
          
          {/* Legend */}
          {(drillDownLevel === 0 ? paymentStatusData : 
            drillDownLevel === 1 ? [
              { name: 'Kredi Kartı', value: 12, color: '#3B82F6' },
              { name: 'Banka Havalesi', value: 6, color: '#10B981' },
              { name: 'Nakit', value: 2, color: '#F59E0B' },
              { name: 'Çek', value: 1, color: '#EF4444' }
            ] : [
              { name: '0-1000₺', value: 8, color: '#10B981' },
              { name: '1000-5000₺', value: 10, color: '#3B82F6' },
              { name: '5000-10000₺', value: 2, color: '#F59E0B' },
              { name: '10000₺+', value: 1, color: '#EF4444' }
            ]).length > 0 && (
            <div className="mt-4 flex flex-wrap gap-3 justify-center">
              {(drillDownLevel === 0 ? paymentStatusData : 
                drillDownLevel === 1 ? [
                  { name: 'Kredi Kartı', value: 12, color: '#3B82F6' },
                  { name: 'Banka Havalesi', value: 6, color: '#10B981' },
                  { name: 'Nakit', value: 2, color: '#F59E0B' },
                  { name: 'Çek', value: 1, color: '#EF4444' }
                ] : [
                  { name: '0-1000₺', value: 8, color: '#10B981' },
                  { name: '1000-5000₺', value: 10, color: '#3B82F6' },
                  { name: '5000-10000₺', value: 2, color: '#F59E0B' },
                  { name: '10000₺+', value: 1, color: '#EF4444' }
                ]).map((entry, index) => (
                <div key={index} className="flex items-center gap-2">
                  <div 
                    className="w-3 h-3 rounded-full" 
                    style={{ backgroundColor: entry.color }}
                  ></div>
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    {entry.name} ({entry.value})
                  </span>
                </div>
              ))}
            </div>
          )}
          
          {paymentStatusData.length === 0 && (
            <div className="text-center text-gray-500 dark:text-gray-400 mt-8">
              Henüz ödeme verisi bulunmuyor
            </div>
          )}
        </div>
      </div>

      {/* Detay İstatistikleri */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Müşteri İstatistikleri</h3>
            <Users className="w-5 h-5 text-blue-500" />
          </div>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600 dark:text-gray-400">Toplam Müşteri</span>
              <span className="text-sm font-semibold text-gray-900 dark:text-white">
                {stats.totalCustomers}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600 dark:text-gray-400">Bu Ay Yeni</span>
              <span className="text-sm font-semibold text-blue-600">
                {stats.newCustomersThisMonth}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600 dark:text-gray-400">Aktif Ödemeler</span>
              <span className="text-sm font-semibold text-green-600">
                {payments.filter(p => p.status === 'completed').length}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600 dark:text-gray-400">Ödeme Oranı</span>
              <span className="text-sm font-semibold text-purple-600">
                {payments.length > 0 ? Math.round((payments.filter(p => p.status === 'completed').length / payments.length) * 100) : 0}%
              </span>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Bütçe Durumu</h3>
            <Target className="w-5 h-5 text-indigo-500" />
          </div>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600 dark:text-gray-400">Toplam Bütçe</span>
              <span className="text-sm font-semibold text-indigo-600">
                {formatCurrency(stats.totalBudget)}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600 dark:text-gray-400">Toplam Harcama</span>
              <span className="text-sm font-semibold text-red-600">
                {formatCurrency(stats.totalExpenses)}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600 dark:text-gray-400">Kullanım Oranı</span>
              <span className="text-sm font-semibold text-orange-600">
                %{stats.budgetUtilization.toFixed(1)}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600 dark:text-gray-400">Kalan Bütçe</span>
              <span className={`text-sm font-semibold ${
                stats.totalBudget - stats.totalExpenses >= 0 ? 'text-green-600' : 'text-red-600'
              }`}>
                {stats.totalBudget - stats.totalExpenses >= 0 ? '+' : ''}{formatCurrency(stats.totalBudget - stats.totalExpenses)}
              </span>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Hızlı Eylemler</h3>
            <AlertTriangle className="w-5 h-5 text-orange-500" />
          </div>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600 dark:text-gray-400">Geciken Ödemeler</span>
              <span className="text-sm font-semibold text-red-600">
                {payments.filter(p => p.status === 'overdue').length}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600 dark:text-gray-400">Bekleyen Ödemeler</span>
              <span className="text-sm font-semibold text-yellow-600">
                {payments.filter(p => p.status === 'pending').length}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600 dark:text-gray-400">Aktif Promosyonlar</span>
              <span className="text-sm font-semibold text-green-600">
                {promotions.filter(p => p.is_active).length}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600 dark:text-gray-400">Bu Ay Kar</span>
              <span className={`text-sm font-semibold ${
                stats.currentMonthProfit >= 0 ? 'text-green-600' : 'text-red-600'
              }`}>
                {stats.currentMonthProfit >= 0 ? '+' : ''}{formatCurrency(stats.currentMonthProfit)}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FinancialOverview;

