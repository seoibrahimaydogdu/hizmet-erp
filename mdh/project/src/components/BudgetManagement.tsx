import React, { useState } from 'react';
import { 
  FileText, 
  Plus, 
  Eye, 
  Edit, 
  Trash2,
  Calendar,
  DollarSign,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  PieChart,
  Target
} from 'lucide-react';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';
import { formatCurrency } from '../lib/currency';

interface BudgetManagementProps {
  budgets: any[];
  expenses: any[];
  expenseCategories: any[];
  onAddBudget?: () => void;
  onEditBudget?: (budget: any) => void;
  onDeleteBudget?: (budgetId: string) => void;
  onViewBudget?: (budgetId: string) => void;
}

const BudgetManagement: React.FC<BudgetManagementProps> = ({
  budgets,
  expenses,
  expenseCategories,
  onAddBudget,
  onEditBudget,
  onDeleteBudget,
  onViewBudget
}) => {
  const [selectedPeriod, setSelectedPeriod] = useState('current_month');

  // Bütçe istatistikleri
  const getBudgetStats = () => {
    // Null/undefined kontrolü
    const safeBudgets = budgets || [];
    const safeExpenses = expenses || [];
    const safeExpenseCategories = expenseCategories || [];
    
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    
    const currentMonthBudgets = safeBudgets.filter(budget => {
      const budgetDate = new Date(budget.created_at);
      return budgetDate.getMonth() === currentMonth && 
             budgetDate.getFullYear() === currentYear;
    });

    const totalBudget = safeBudgets.reduce((sum, budget) => sum + Number(budget.amount), 0);
    const currentMonthBudget = currentMonthBudgets.reduce((sum, budget) => sum + Number(budget.amount), 0);

    // Kategori bazında bütçe ve harcama analizi
    const budgetAnalysis = safeExpenseCategories.map(category => {
      const categoryBudgets = safeBudgets.filter(budget => budget.category_id === category.id);
      const categoryExpenses = safeExpenses.filter(expense => expense.category_id === category.id);
      
      const totalBudgeted = categoryBudgets.reduce((sum, budget) => sum + Number(budget.amount), 0);
      const totalSpent = categoryExpenses.reduce((sum, expense) => sum + Number(expense.amount), 0);
      const remaining = totalBudgeted - totalSpent;
      const percentageUsed = totalBudgeted > 0 ? (totalSpent / totalBudgeted) * 100 : 0;

      return {
        category: category.name,
        totalBudgeted,
        totalSpent,
        remaining,
        percentageUsed,
        isOverBudget: totalSpent > totalBudgeted
      };
    });

    const overBudgetCategories = budgetAnalysis.filter(b => b.isOverBudget);
    const underBudgetCategories = budgetAnalysis.filter(b => !b.isOverBudget);

    const averageBudget = safeBudgets.length > 0 ? totalBudget / safeBudgets.length : 0;

    return {
      totalBudget,
      currentMonthBudget,
      currentMonthCount: currentMonthBudgets.length,
      budgetAnalysis,
      overBudgetCategories: overBudgetCategories.length,
      underBudgetCategories: underBudgetCategories.length,
      averageBudget,
      totalCount: safeBudgets.length
    };
  };

  const stats = getBudgetStats();

  // Durum rengi
  const getBudgetStatusColor = (percentageUsed: number) => {
    if (percentageUsed >= 100) return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400';
    if (percentageUsed >= 80) return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400';
    return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400';
  };

  // Durum metni
  const getBudgetStatusText = (percentageUsed: number) => {
    if (percentageUsed >= 100) return 'Aşım';
    if (percentageUsed >= 80) return 'Kritik';
    return 'Normal';
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Bütçe Yönetimi</h2>
        <button
          onClick={onAddBudget}
          className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 flex items-center"
        >
          <Plus className="w-4 h-4 mr-2" />
          Yeni Bütçe
        </button>
      </div>

      {/* Bütçe İstatistikleri */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Toplam Bütçe</p>
              <p className="text-2xl font-bold text-indigo-600 mt-2">{formatCurrency(stats.totalBudget)}</p>
              <p className="text-xs text-gray-500 mt-1">Tüm kategoriler</p>
            </div>
            <div className="bg-indigo-500 p-3 rounded-lg">
              <FileText className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Bu Ay</p>
              <p className="text-2xl font-bold text-blue-600 mt-2">{formatCurrency(stats.currentMonthBudget)}</p>
              <p className="text-xs text-gray-500 mt-1">{stats.currentMonthCount} bütçe</p>
            </div>
            <div className="bg-blue-500 p-3 rounded-lg">
              <Calendar className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Bütçe Aşımı</p>
              <p className="text-2xl font-bold text-red-600 mt-2">{stats.overBudgetCategories}</p>
              <p className="text-xs text-gray-500 mt-1">Kategori</p>
            </div>
            <div className="bg-red-500 p-3 rounded-lg">
              <AlertTriangle className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Ortalama Bütçe</p>
              <p className="text-2xl font-bold text-green-600 mt-2">{formatCurrency(stats.averageBudget)}</p>
              <p className="text-xs text-gray-500 mt-1">Kategori başına</p>
            </div>
            <div className="bg-green-500 p-3 rounded-lg">
              <Target className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>
      </div>

      {/* Bütçe Analizi */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Kategori Bazında Bütçe</h3>
            <PieChart className="w-5 h-5 text-blue-500" />
          </div>
          <div className="space-y-4">
            {stats.budgetAnalysis.slice(0, 5).map((analysis, index) => (
              <div key={index} className="border-b border-gray-200 dark:border-gray-700 pb-3 last:border-b-0">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium text-gray-900 dark:text-white">
                    {analysis.category}
                  </span>
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getBudgetStatusColor(analysis.percentageUsed)}`}>
                    {getBudgetStatusText(analysis.percentageUsed)}
                  </span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-600 dark:text-gray-400">
                    Harcanan: {formatCurrency(analysis.totalSpent)}
                  </span>
                  <span className="text-gray-600 dark:text-gray-400">
                    Bütçe: {formatCurrency(analysis.totalBudgeted)}
                  </span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mt-2">
                  <div 
                    className={`h-2 rounded-full ${
                      analysis.percentageUsed >= 100 ? 'bg-red-500' :
                      analysis.percentageUsed >= 80 ? 'bg-yellow-500' : 'bg-green-500'
                    }`}
                    style={{ width: `${Math.min(analysis.percentageUsed, 100)}%` }}
                  ></div>
                </div>
                <div className="flex justify-between items-center mt-1">
                  <span className="text-xs text-gray-500">
                    {analysis.percentageUsed.toFixed(1)}% kullanıldı
                  </span>
                  <span className={`text-xs font-medium ${
                    analysis.remaining >= 0 ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {analysis.remaining >= 0 ? '+' : ''}{formatCurrency(analysis.remaining)} kaldı
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Bütçe Durumu</h3>
            <Target className="w-5 h-5 text-green-500" />
          </div>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <div className="flex items-center">
                <TrendingUp className="w-4 h-4 text-green-500 mr-2" />
                <span className="text-sm text-gray-600 dark:text-gray-400">Normal Bütçe</span>
              </div>
              <span className="text-sm font-semibold text-green-600">
                {stats.underBudgetCategories}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <div className="flex items-center">
                <AlertTriangle className="w-4 h-4 text-yellow-500 mr-2" />
                <span className="text-sm text-gray-600 dark:text-gray-400">Kritik Bütçe</span>
              </div>
              <span className="text-sm font-semibold text-yellow-600">
                {stats.budgetAnalysis.filter(b => b.percentageUsed >= 80 && b.percentageUsed < 100).length}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <div className="flex items-center">
                <TrendingDown className="w-4 h-4 text-red-500 mr-2" />
                <span className="text-sm text-gray-600 dark:text-gray-400">Bütçe Aşımı</span>
              </div>
              <span className="text-sm font-semibold text-red-600">
                {stats.overBudgetCategories}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <div className="flex items-center">
                <FileText className="w-4 h-4 text-blue-500 mr-2" />
                <span className="text-sm text-gray-600 dark:text-gray-400">Toplam Kategori</span>
              </div>
              <span className="text-sm font-semibold text-gray-900 dark:text-white">
                {stats.budgetAnalysis.length}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Bütçe Tablosu */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Bütçe Adı
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Kategori
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Bütçe
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Harcanan
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Kalan
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
              {budgets.map((budget) => {
                const categoryExpenses = expenses.filter(expense => expense.category_id === budget.category_id);
                const totalSpent = categoryExpenses.reduce((sum, expense) => sum + Number(expense.amount), 0);
                const remaining = Number(budget.amount) - totalSpent;
                const percentageUsed = (totalSpent / Number(budget.amount)) * 100;

                return (
                  <tr key={budget.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                    <td className="px-6 py-4">
                      <div>
                        <div className="text-sm font-medium text-gray-900 dark:text-white">
                          {budget.name}
                        </div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          {budget.description || 'Açıklama yok'}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-gray-900 dark:text-white">
                        {budget.expense_categories?.name || '-'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm font-medium text-indigo-600">
                        {formatCurrency(Number(budget.amount))}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm font-medium text-red-600">
                        {formatCurrency(totalSpent)}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`text-sm font-medium ${
                        remaining >= 0 ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {remaining >= 0 ? '+' : ''}{formatCurrency(remaining)}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getBudgetStatusColor(percentageUsed)}`}>
                        {getBudgetStatusText(percentageUsed)}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <button 
                          onClick={() => onViewBudget?.(budget.id)}
                          className="inline-flex items-center px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs font-medium"
                        >
                          <Eye className="w-3 h-3 mr-1" />
                          Görüntüle
                        </button>
                        <button 
                          onClick={() => onEditBudget?.(budget)}
                          className="inline-flex items-center px-3 py-1 bg-green-600 hover:bg-green-700 text-white rounded text-xs font-medium"
                        >
                          <Edit className="w-3 h-3 mr-1" />
                          Düzenle
                        </button>
                        <button 
                          onClick={() => onDeleteBudget?.(budget.id)}
                          className="inline-flex items-center px-3 py-1 bg-red-600 hover:bg-red-700 text-white rounded text-xs font-medium"
                        >
                          <Trash2 className="w-3 h-3 mr-1" />
                          Sil
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default BudgetManagement;
