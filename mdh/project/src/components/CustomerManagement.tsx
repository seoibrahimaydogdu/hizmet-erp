import React, { useState } from 'react';
import { 
  Users, 
  Plus, 
  Eye, 
  Edit, 
  CheckCircle, 
  Clock, 
  AlertTriangle,
  TrendingUp,
  CreditCard
} from 'lucide-react';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';
import { formatCurrency } from '../lib/currency';

interface CustomerManagementProps {
  customers: any[];
  payments: any[];
  onViewCustomer?: (customerId: string) => void;
  onEditCustomer?: (customer: any) => void;
  onAddCustomer?: () => void;
}

const CustomerManagement: React.FC<CustomerManagementProps> = ({
  customers,
  payments,
  onViewCustomer,
  onEditCustomer,
  onAddCustomer
}) => {
  const [selectedPeriod, setSelectedPeriod] = useState('current_month');

  // Null/undefined kontrolü
  const safePayments = payments || [];
  const safeCustomers = customers || [];

  // Müşteri istatistikleri
  const getCustomerStats = () => {
    const pendingPayments = safePayments.filter(p => p.status === 'pending');
    const overduePayments = safePayments.filter(p => p.status === 'overdue');
    const totalRevenue = safePayments
      .filter(p => p.status === 'paid')
      .reduce((sum, p) => sum + Number(p.amount), 0);
    
    const newCustomersThisMonth = safeCustomers.filter(c => {
      const customerCreated = new Date(c.created_at);
      const now = new Date();
      return customerCreated.getMonth() === now.getMonth() && 
             customerCreated.getFullYear() === now.getFullYear();
    });

    return {
      totalCustomers: safeCustomers.length,
      pendingPayments: pendingPayments.length,
      overduePayments: overduePayments.length,
      totalRevenue,
      newCustomersThisMonth: newCustomersThisMonth.length,
      averageRevenuePerCustomer: safeCustomers.length > 0 ? totalRevenue / safeCustomers.length : 0
    };
  };

  const stats = getCustomerStats();

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Müşteri Yönetimi</h2>
        <button
          onClick={onAddCustomer}
          className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          <Plus className="w-4 h-4 mr-2" />
          Yeni Müşteri
        </button>
      </div>

      {/* Müşteri İstatistikleri */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Toplam Müşteri</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mt-2">{stats.totalCustomers}</p>
              <p className="text-xs text-green-600 mt-1">+{stats.newCustomersThisMonth} bu ay</p>
            </div>
            <div className="bg-blue-500 p-3 rounded-lg">
              <Users className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Tamamlanan Ödemeler</p>
              <p className="text-2xl font-bold text-green-600 mt-2">{safePayments.filter(p => p.status === 'completed').length}</p>
              <p className="text-xs text-gray-500 mt-1">
                {safePayments.length > 0 ? Math.round((safePayments.filter(p => p.status === 'completed').length / safePayments.length) * 100) : 0}% oranında
              </p>
            </div>
            <div className="bg-green-500 p-3 rounded-lg">
              <CheckCircle className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Bekleyen Ödeme</p>
              <p className="text-2xl font-bold text-yellow-600 mt-2">{stats.pendingPayments}</p>
              <p className="text-xs text-gray-500 mt-1">Ödeme bekliyor</p>
            </div>
            <div className="bg-yellow-500 p-3 rounded-lg">
              <Clock className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Toplam Gelir</p>
              <p className="text-2xl font-bold text-green-600 mt-2">{formatCurrency(stats.totalRevenue)}</p>
              <p className="text-xs text-gray-500 mt-1">
                                  Ortalama: {formatCurrency(stats.averageRevenuePerCustomer)}
              </p>
            </div>
            <div className="bg-green-500 p-3 rounded-lg">
              <TrendingUp className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>
      </div>

      {/* İstatistik Kartları */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Ödeme Durumları</h3>
            <CreditCard className="w-5 h-5 text-green-500" />
          </div>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600 dark:text-gray-400">Ödendi</span>
              <span className="text-sm font-semibold text-green-600">
                {safePayments.filter(p => p.status === 'paid').length}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600 dark:text-gray-400">Bekliyor</span>
              <span className="text-sm font-semibold text-yellow-600">
                {safePayments.filter(p => p.status === 'pending').length}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600 dark:text-gray-400">Gecikmiş</span>
              <span className="text-sm font-semibold text-red-600">
                {safePayments.filter(p => p.status === 'overdue').length}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600 dark:text-gray-400">Başarısız</span>
              <span className="text-sm font-semibold text-red-600">
                {safePayments.filter(p => p.status === 'failed').length}
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
                {stats.overduePayments}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600 dark:text-gray-400">Bekleyen Ödemeler</span>
              <span className="text-sm font-semibold text-yellow-600">
                {safePayments.filter(p => p.status === 'pending').length}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600 dark:text-gray-400">Yeni Müşteriler</span>
              <span className="text-sm font-semibold text-green-600">
                {stats.newCustomersThisMonth}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600 dark:text-gray-400">Ödeme Yapan Müşteriler</span>
              <span className="text-sm font-semibold text-blue-600">
                {safeCustomers.filter(c => safePayments.some(p => p.customer_id === c.id && p.status === 'paid')).length}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Müşteri Tablosu */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Müşteri
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  E-posta
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Telefon
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Şirket
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Son Ödeme
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Ödeme Durumu
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Son Ödeme Tarihi
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Toplam Ödeme
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  İşlemler
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {safeCustomers.map((customer) => {
                const customerPayments = safePayments.filter(p => p.customer_id === customer.id);
                const totalPaid = customerPayments
                  .filter(p => p.status === 'paid')
                  .reduce((sum, p) => sum + Number(p.amount), 0);
                const lastPayment = customerPayments.length > 0 ? customerPayments[customerPayments.length - 1] : null;
                const pendingPayments = customerPayments.filter(p => p.status === 'pending');

                return (
                  <tr key={customer.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white font-semibold">
                          {customer.name.charAt(0)}
                        </div>
                        <div className="ml-3">
                          <div className="text-sm font-medium text-gray-900 dark:text-white">
                            {customer.name}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-gray-900 dark:text-white">
                        {customer.email}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-gray-900 dark:text-white">
                        {customer.phone || '-'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-gray-900 dark:text-white">
                        {customer.company || '-'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div>
                        <div className="text-sm font-medium text-gray-900 dark:text-white">
                          {lastPayment ? `₺${Number(lastPayment.amount).toLocaleString()}` : '-'}
                        </div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          {lastPayment ? format(new Date(lastPayment.created_at), 'dd MMM yyyy', { locale: tr }) : '-'}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        pendingPayments.length > 0
                          ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400'
                          : customerPayments.some(p => p.status === 'paid')
                          ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
                          : 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400'
                      }`}>
                        {pendingPayments.length > 0 ? 'Beklemede' :
                         customerPayments.some(p => p.status === 'paid') ? 'Ödendi' : 'Ödeme Yok'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-gray-900 dark:text-white">
                        {lastPayment ? 
                          format(new Date(lastPayment.created_at), 'dd MMM yyyy', { locale: tr }) : '-'
                        }
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm font-medium text-gray-900 dark:text-white">
                        {formatCurrency(totalPaid)}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <button 
                          onClick={() => onViewCustomer?.(customer.id)}
                          className="inline-flex items-center px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs font-medium"
                        >
                          <Eye className="w-3 h-3 mr-1" />
                          Görüntüle
                        </button>
                        <button 
                          onClick={() => onEditCustomer?.(customer)}
                          className="inline-flex items-center px-3 py-1 bg-green-600 hover:bg-green-700 text-white rounded text-xs font-medium"
                        >
                          <Edit className="w-3 h-3 mr-1" />
                          Düzenle
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

export default CustomerManagement;
