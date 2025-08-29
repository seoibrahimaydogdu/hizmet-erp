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
  PieChart
} from 'lucide-react';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';
import { formatCurrency } from '../lib/currency';

interface ExpenseManagementProps {
  expenses: any[];
  expenseCategories: any[];
  onAddExpense?: () => void;
  onEditExpense?: (expense: any) => void;
  onDeleteExpense?: (expenseId: string) => void;
  onViewExpense?: (expenseId: string) => void;
}

const ExpenseManagement: React.FC<ExpenseManagementProps> = ({
  expenses,
  expenseCategories,
  onAddExpense,
  onEditExpense,
  onDeleteExpense,
  onViewExpense
}) => {
  const [selectedPeriod, setSelectedPeriod] = useState('current_month');

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

  const stats = getExpenseStats();

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
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Gider Yönetimi</h2>
        <button
          onClick={onAddExpense}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center"
        >
          <Plus className="w-4 h-4 mr-2" />
          Yeni Gider
        </button>
      </div>

      {/* Gider İstatistikleri */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Toplam Gider</p>
              <p className="text-2xl font-bold text-red-600 mt-2">{formatCurrency(stats.totalExpenses)}</p>
              <p className="text-xs text-gray-500 mt-1">Tüm zamanlar</p>
            </div>
            <div className="bg-red-500 p-3 rounded-lg">
              <TrendingDown className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Bu Ay</p>
              <p className="text-2xl font-bold text-orange-600 mt-2">{formatCurrency(stats.currentMonthTotal)}</p>
              <p className="text-xs text-gray-500 mt-1">{stats.currentMonthCount} gider</p>
            </div>
            <div className="bg-orange-500 p-3 rounded-lg">
              <Calendar className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Ortalama Gider</p>
              <p className="text-2xl font-bold text-blue-600 mt-2">{formatCurrency(stats.averageExpense)}</p>
              <p className="text-xs text-gray-500 mt-1">Gider başına</p>
            </div>
            <div className="bg-blue-500 p-3 rounded-lg">
              <DollarSign className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Toplam Gider</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mt-2">{stats.totalCount}</p>
              <p className="text-xs text-gray-500 mt-1">Kayıt sayısı</p>
            </div>
            <div className="bg-gray-500 p-3 rounded-lg">
              <PieChart className="w-6 h-6 text-white" />
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

      {/* Gider Tablosu */}
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
    </div>
  );
};

export default ExpenseManagement;
