import React, { useState } from 'react';
import { 
  BarChart3, 
  TrendingUp, 
  TrendingDown, 
  DollarSign,
  Users,
  CreditCard,
  AlertTriangle,
  Calendar,
  PieChart,
  Target,
  RefreshCw
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
  Cell,
  BarChart,
  Bar,
  LineChart,
  Line
} from 'recharts';

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

  const revenueData = getRevenueData();

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

  const paymentStatusData = getPaymentStatusData();

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Finansal Genel Bakış</h2>
        <div className="flex items-center space-x-2">
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

      {/* Grafikler */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Gelir ve Gider Grafiği */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Gelir ve Gider Trendi</h3>
            <BarChart3 className="w-5 h-5 text-blue-500" />
          </div>
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
        </div>

        {/* Ödeme Durumu Dağılımı */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Ödeme Durumu Dağılımı</h3>
            <PieChart className="w-5 h-5 text-green-500" />
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <RechartsPieChart>
              <Pie
                data={paymentStatusData}
                cx="50%"
                cy="50%"
                labelLine={true}
                label={({ name, percent, value }) => {
                  if (value === 0) return null; // Sıfır değerler için etiket gösterme
                  return `${name} ${(percent * 100).toFixed(0)}%`;
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
          
          {/* Legend */}
          {paymentStatusData.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-3 justify-center">
              {paymentStatusData.map((entry, index) => (
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

