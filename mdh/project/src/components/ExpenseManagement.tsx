import React, { useState } from 'react';
import { 
  TrendingDown, 
  Plus, 
  Eye, 
  Edit, 
  Trash2,
  Calendar,
  DollarSign,
  AlertTriangle,
  PieChart,
  TrendingUp,
  Percent,
  Target,
  CheckCircle,
  Calculator,
  BarChart3
} from 'lucide-react';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';
import { formatCurrency } from '../lib/currency';

interface ExpenseManagementProps {
  expenses: any[];
  expenseCategories: any[];
  revenues?: any[]; // Gelir verileri eklendi
  onAddExpense?: () => void;
  onEditExpense?: (expense: any) => void;
  onDeleteExpense?: (expenseId: string) => void;
  onViewExpense?: (expenseId: string) => void;
  onAddRevenue?: () => void; // Gelir ekleme fonksiyonu
  onEditRevenue?: (revenue: any) => void; // Gelir düzenleme fonksiyonu
  onDeleteRevenue?: (revenueId: string) => void; // Gelir silme fonksiyonu
}

const ExpenseManagement: React.FC<ExpenseManagementProps> = ({
  expenses,
  expenseCategories,
  revenues = [], // Varsayılan boş array
  onAddExpense,
  onEditExpense,
  onDeleteExpense,
  onViewExpense,
  onAddRevenue,
  onEditRevenue,
  onDeleteRevenue
}) => {
  const [selectedPeriod, setSelectedPeriod] = useState('current_month');
  const [activeTab, setActiveTab] = useState<'overview' | 'expenses' | 'revenues' | 'analysis'>('overview');

  // Gider istatistikleri
  const getExpenseStats = () => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    
    const currentMonthExpenses = expenses.filter(expense => {
      const expenseDate = new Date(expense.expense_date);
      return expenseDate.getMonth() === currentMonth && 
             expenseDate.getFullYear() === currentYear;
    });

    const totalExpenses = expenses.reduce((sum, expense) => sum + Number(expense.amount), 0);
    const currentMonthTotal = currentMonthExpenses.reduce((sum, expense) => sum + Number(expense.amount), 0);
    const averageExpense = expenses.length > 0 ? totalExpenses / expenses.length : 0;

    // Kategori bazında giderler
    const categoryExpenses = expenseCategories.map(category => {
      const categoryExpenses = expenses.filter(expense => expense.category_id === category.id);
      const total = categoryExpenses.reduce((sum, expense) => sum + Number(expense.amount), 0);
      return {
        category: category.name,
        total,
        count: categoryExpenses.length,
        percentage: totalExpenses > 0 ? (total / totalExpenses) * 100 : 0
      };
    }).sort((a, b) => b.total - a.total);

    return {
      totalExpenses,
      currentMonthTotal,
      averageExpense,
      currentMonthCount: currentMonthExpenses.length,
      categoryExpenses,
      totalCount: expenses.length
    };
  };

  // Gelir istatistikleri
  const getRevenueStats = () => {
    const totalRevenues = revenues.reduce((sum, revenue) => sum + Number(revenue.amount || 0), 0);
    const currentMonthRevenues = revenues.filter(revenue => {
      const revenueDate = new Date(revenue.date || revenue.created_at);
      const now = new Date();
      return revenueDate.getMonth() === now.getMonth() && 
             revenueDate.getFullYear() === now.getFullYear();
    });
    const currentMonthTotal = currentMonthRevenues.reduce((sum, revenue) => sum + Number(revenue.amount || 0), 0);
    
    return {
      totalRevenues,
      currentMonthTotal,
      currentMonthCount: currentMonthRevenues.length,
      totalCount: revenues.length
    };
  };

  // Kar marjı hesaplamaları
  const getProfitAnalysis = () => {
    const expenseStats = getExpenseStats();
    const revenueStats = getRevenueStats();
    
    const grossProfit = revenueStats.totalRevenues - expenseStats.totalExpenses;
    const profitMargin = revenueStats.totalRevenues > 0 ? (grossProfit / revenueStats.totalRevenues) * 100 : 0;
    const expenseRatio = revenueStats.totalRevenues > 0 ? (expenseStats.totalExpenses / revenueStats.totalRevenues) * 100 : 0;
    
    return {
      grossProfit,
      profitMargin,
      expenseRatio,
      totalRevenues: revenueStats.totalRevenues,
      totalExpenses: expenseStats.totalExpenses
    };
  };

  const stats = getExpenseStats();
  const revenueStats = getRevenueStats();
  const profitAnalysis = getProfitAnalysis();

  // Durum rengi
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400';
      case 'pending': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400';
      case 'rejected': return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400';
      case 'paid': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400';
    }
  };

  // Durum metni
  const getStatusText = (status: string) => {
    switch (status) {
      case 'approved': return 'Onaylandı';
      case 'pending': return 'Bekliyor';
      case 'rejected': return 'Reddedildi';
      case 'paid': return 'Ödendi';
      default: return status;
    }
  };

  return (
    <div className="space-y-6">
      {/* Tab Navigation */}
      <div className="border-b border-gray-200 dark:border-gray-700">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('overview')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'overview'
                ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
            }`}
          >
            <div className="flex items-center space-x-2">
              <BarChart3 className="w-4 h-4" />
              <span>Genel Bakış</span>
            </div>
          </button>
          <button
            onClick={() => setActiveTab('expenses')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'expenses'
                ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
            }`}
          >
            <div className="flex items-center space-x-2">
              <TrendingDown className="w-4 h-4" />
              <span>Giderler</span>
            </div>
          </button>
          <button
            onClick={() => setActiveTab('revenues')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'revenues'
                ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
            }`}
          >
            <div className="flex items-center space-x-2">
              <TrendingUp className="w-4 h-4" />
              <span>Gelirler</span>
            </div>
          </button>
          <button
            onClick={() => setActiveTab('analysis')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'analysis'
                ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
            }`}
          >
            <div className="flex items-center space-x-2">
              <Calculator className="w-4 h-4" />
              <span>Kar Marjı Analizi</span>
            </div>
          </button>
        </nav>
      </div>

      {/* Genel Bakış Tab */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Gelir & Gider Yönetimi</h2>
            <div className="flex gap-2">
              <button
                onClick={onAddExpense}
                className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Yeni Gider
              </button>
              {onAddRevenue && (
                <button
                  onClick={onAddRevenue}
                  className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  Yeni Gelir
                </button>
              )}
            </div>
          </div>

          {/* Özet Kartları */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Toplam Gider */}
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
              <div className="flex items-center">
                <div className="p-2 bg-red-100 dark:bg-red-900/20 rounded-lg">
                  <TrendingDown className="w-6 h-6 text-red-600 dark:text-red-400" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Toplam Gider</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {formatCurrency(stats.totalExpenses)}
                  </p>
                </div>
              </div>
            </div>

            {/* Toplam Gelir */}
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
              <div className="flex items-center">
                <div className="p-2 bg-green-100 dark:bg-green-900/20 rounded-lg">
                  <TrendingUp className="w-6 h-6 text-green-600 dark:text-green-400" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Toplam Gelir</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {formatCurrency(revenueStats.totalRevenues)}
                  </p>
                </div>
              </div>
            </div>

            {/* Brüt Kar */}
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
              <div className="flex items-center">
                <div className={`p-2 rounded-lg ${profitAnalysis.grossProfit >= 0 ? 'bg-green-100 dark:bg-green-900/20' : 'bg-red-100 dark:bg-red-900/20'}`}>
                  <DollarSign className={`w-6 h-6 ${profitAnalysis.grossProfit >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`} />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Brüt Kar</p>
                  <p className={`text-2xl font-bold ${profitAnalysis.grossProfit >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                    {formatCurrency(profitAnalysis.grossProfit)}
                  </p>
                </div>
              </div>
            </div>

            {/* Kar Marjı */}
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
              <div className="flex items-center">
                <div className={`p-2 rounded-lg ${profitAnalysis.profitMargin >= 0 ? 'bg-blue-100 dark:bg-blue-900/20' : 'bg-red-100 dark:bg-red-900/20'}`}>
                  <Percent className={`w-6 h-6 ${profitAnalysis.profitMargin >= 0 ? 'text-blue-600 dark:text-blue-400' : 'text-red-600 dark:text-red-400'}`} />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Kar Marjı</p>
                  <p className={`text-2xl font-bold ${profitAnalysis.profitMargin >= 0 ? 'text-blue-600 dark:text-blue-400' : 'text-red-600 dark:text-red-400'}`}>
                    %{profitAnalysis.profitMargin.toFixed(1)}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Kategori Bazında Giderler */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Kategori Bazında Giderler</h3>
                <PieChart className="w-5 h-5 text-blue-500" />
              </div>
              <div className="space-y-3">
                {stats.categoryExpenses.slice(0, 5).map((category, index) => (
                  <div key={index} className="flex justify-between items-center">
                    <div className="flex items-center">
                      <div 
                        className="w-3 h-3 rounded-full mr-2"
                        style={{ backgroundColor: `hsl(${index * 60}, 70%, 50%)` }}
                      ></div>
                      <span className="text-sm text-gray-600 dark:text-gray-400">{category.category}</span>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-semibold text-gray-900 dark:text-white">
                        {formatCurrency(category.total)}
                      </div>
                      <div className="text-xs text-gray-500">
                        {category.percentage.toFixed(1)}%
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Gider Durumları</h3>
                <AlertTriangle className="w-5 h-5 text-orange-500" />
              </div>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Onaylandı</span>
                  <span className="text-sm font-semibold text-green-600">
                    {expenses.filter(e => e.status === 'approved').length}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Bekliyor</span>
                  <span className="text-sm font-semibold text-yellow-600">
                    {expenses.filter(e => e.status === 'pending').length}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Ödendi</span>
                  <span className="text-sm font-semibold text-blue-600">
                    {expenses.filter(e => e.status === 'paid').length}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Reddedildi</span>
                  <span className="text-sm font-semibold text-red-600">
                    {expenses.filter(e => e.status === 'rejected').length}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Toplam</span>
                  <span className="text-sm font-semibold text-gray-900 dark:text-white">
                    {expenses.length}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Gider Tablosu */}
      {activeTab === 'expenses' && (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Açıklama
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Kategori
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Tutar
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Tarih
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Durum
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    İşlemler
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {expenses.map((expense) => (
                  <tr key={expense.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                    <td className="px-6 py-4">
                      <div>
                        <div className="text-sm font-medium text-gray-900 dark:text-white">
                          {expense.description}
                        </div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          {expense.notes || 'Not yok'}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-gray-900 dark:text-white">
                        {expense.expense_categories?.name || '-'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm font-medium text-red-600">
                        {formatCurrency(Number(expense.amount))}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-gray-900 dark:text-white">
                        {format(new Date(expense.expense_date), 'dd MMM yyyy', { locale: tr })}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(expense.status)}`}>
                        {getStatusText(expense.status)}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <button 
                          onClick={() => onViewExpense?.(expense.id)}
                          className="inline-flex items-center px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs font-medium transition-colors"
                        >
                          <Eye className="w-3 h-3 mr-1" />
                          Göster
                        </button>
                        <button 
                          onClick={() => onEditExpense?.(expense)}
                          className="inline-flex items-center px-3 py-1 bg-green-600 hover:bg-green-700 text-white rounded text-xs font-medium transition-colors"
                        >
                          <Edit className="w-3 h-3 mr-1" />
                          Düzenle
                        </button>
                        <button 
                          onClick={() => onDeleteExpense?.(expense.id)}
                          className="inline-flex items-center px-3 py-1 bg-red-600 hover:bg-red-700 text-white rounded text-xs font-medium transition-colors"
                        >
                          <Trash2 className="w-3 h-3 mr-1" />
                          Sil
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Gelir Tablosu */}
      {activeTab === 'revenues' && (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Açıklama
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Tutar
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Tarih
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    İşlemler
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {revenues.map((revenue) => (
                  <tr key={revenue.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                    <td className="px-6 py-4">
                      <div>
                        <div className="text-sm font-medium text-gray-900 dark:text-white">
                          {revenue.description}
                        </div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          {revenue.notes || 'Not yok'}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm font-medium text-green-600">
                        {formatCurrency(Number(revenue.amount))}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-gray-900 dark:text-white">
                        {format(new Date(revenue.date || revenue.created_at), 'dd MMM yyyy', { locale: tr })}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <button 
                          onClick={() => onEditRevenue?.(revenue)}
                          className="inline-flex items-center px-3 py-1 bg-green-600 hover:bg-green-700 text-white rounded text-xs font-medium transition-colors"
                        >
                          <Edit className="w-3 h-3 mr-1" />
                          Düzenle
                        </button>
                        <button 
                          onClick={() => onDeleteRevenue?.(revenue.id)}
                          className="inline-flex items-center px-3 py-1 bg-red-600 hover:bg-red-700 text-white rounded text-xs font-medium transition-colors"
                        >
                          <Trash2 className="w-3 h-3 mr-1" />
                          Sil
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Kar Marjı Analizi Tab */}
      {activeTab === 'analysis' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Kar Marjı Analizi</h2>
            <div className="flex gap-2">
              <button
                onClick={onAddExpense}
                className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Yeni Gider
              </button>
              {onAddRevenue && (
                <button
                  onClick={onAddRevenue}
                  className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  Yeni Gelir
                </button>
              )}
            </div>
          </div>

          {/* Kar Marjı Analizi Kartları */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Brüt Kar */}
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
              <div className="flex items-center">
                <div className={`p-2 rounded-lg ${profitAnalysis.grossProfit >= 0 ? 'bg-green-100 dark:bg-green-900/20' : 'bg-red-100 dark:bg-red-900/20'}`}>
                  <DollarSign className={`w-6 h-6 ${profitAnalysis.grossProfit >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`} />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Brüt Kar</p>
                  <p className={`text-2xl font-bold ${profitAnalysis.grossProfit >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                    {formatCurrency(profitAnalysis.grossProfit)}
                  </p>
                </div>
              </div>
            </div>

            {/* Kar Marjı */}
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
              <div className="flex items-center">
                <div className={`p-2 rounded-lg ${profitAnalysis.profitMargin >= 0 ? 'bg-blue-100 dark:bg-blue-900/20' : 'bg-red-100 dark:bg-red-900/20'}`}>
                  <Percent className={`w-6 h-6 ${profitAnalysis.profitMargin >= 0 ? 'text-blue-600 dark:text-blue-400' : 'text-red-600 dark:text-red-400'}`} />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Kar Marjı</p>
                  <p className={`text-2xl font-bold ${profitAnalysis.profitMargin >= 0 ? 'text-blue-600 dark:text-blue-400' : 'text-red-600 dark:text-red-400'}`}>
                    %{profitAnalysis.profitMargin.toFixed(1)}
                  </p>
                </div>
              </div>
            </div>

            {/* Gider Oranı */}
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
              <div className="flex items-center">
                <div className={`p-2 rounded-lg ${profitAnalysis.expenseRatio >= 0 ? 'bg-purple-100 dark:bg-purple-900/20' : 'bg-red-100 dark:bg-red-900/20'}`}>
                  <Target className={`w-6 h-6 ${profitAnalysis.expenseRatio >= 0 ? 'text-purple-600 dark:text-purple-400' : 'text-red-600 dark:text-red-400'}`} />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Gider Oranı</p>
                  <p className={`text-2xl font-bold ${profitAnalysis.expenseRatio >= 0 ? 'text-purple-600 dark:text-purple-400' : 'text-red-600 dark:text-red-400'}`}>
                    %{profitAnalysis.expenseRatio.toFixed(1)}
                  </p>
                </div>
              </div>
            </div>

            {/* Net Kar */}
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
              <div className="flex items-center">
                <div className={`p-2 rounded-lg ${profitAnalysis.grossProfit >= 0 ? 'bg-teal-100 dark:bg-teal-900/20' : 'bg-red-100 dark:bg-red-900/20'}`}>
                  <CheckCircle className={`w-6 h-6 ${profitAnalysis.grossProfit >= 0 ? 'text-teal-600 dark:text-teal-400' : 'text-red-600 dark:text-red-400'}`} />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Net Kar</p>
                  <p className={`text-2xl font-bold ${profitAnalysis.grossProfit >= 0 ? 'text-teal-600 dark:text-teal-400' : 'text-red-600 dark:text-red-400'}`}>
                    {formatCurrency(profitAnalysis.grossProfit)}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ExpenseManagement;
