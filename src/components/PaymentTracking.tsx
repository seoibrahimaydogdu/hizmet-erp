import React, { useState, useEffect } from 'react';
import { 
  Search, 
  Filter, 
  Download, 
  Mail, 
  AlertTriangle, 
  DollarSign,
  Calendar,
  User,
  CreditCard,
  Clock,
  CheckCircle,
  XCircle
} from 'lucide-react';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';
import { toast } from 'react-hot-toast';

interface Payment {
  id: string;
  customer_id: string;
  customer_name: string;
  customer_email: string;
  amount: number;
  due_date: string;
  status: 'paid' | 'pending' | 'overdue';
  invoice_number: string;
  created_at: string;
  total_debt: number;
}

const PaymentTracking: React.FC = () => {
  const [payments, setPayments] = useState<Payment[]>([
    {
      id: '1',
      customer_id: 'c1',
      customer_name: 'Ahmet Yılmaz',
      customer_email: 'ahmet@example.com',
      amount: 299.99,
      due_date: '2025-01-15',
      status: 'overdue',
      invoice_number: 'INV-2025-001',
      created_at: '2025-01-01',
      total_debt: 599.98
    },
    {
      id: '2',
      customer_id: 'c2',
      customer_name: 'Fatma Kaya',
      customer_email: 'fatma@example.com',
      amount: 199.99,
      due_date: '2025-01-20',
      status: 'pending',
      invoice_number: 'INV-2025-002',
      created_at: '2025-01-05',
      total_debt: 199.99
    },
    {
      id: '3',
      customer_id: 'c3',
      customer_name: 'Can Demir',
      customer_email: 'can@example.com',
      amount: 499.99,
      due_date: '2025-01-10',
      status: 'paid',
      invoice_number: 'INV-2025-003',
      created_at: '2024-12-28',
      total_debt: 0
    }
  ]);

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [loading, setLoading] = useState(false);

  const filteredPayments = payments.filter(payment => {
    const matchesSearch = payment.customer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         payment.customer_email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         payment.invoice_number.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || payment.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'paid': return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'pending': return <Clock className="w-4 h-4 text-yellow-500" />;
      case 'overdue': return <XCircle className="w-4 h-4 text-red-500" />;
      default: return <Clock className="w-4 h-4 text-gray-400" />;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'paid': return 'Ödendi';
      case 'pending': return 'Beklemede';
      case 'overdue': return 'Gecikmiş';
      default: return 'Bilinmeyen';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid': return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400';
      case 'pending': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400';
      case 'overdue': return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400';
    }
  };

  const handleSendReminder = async (payment: Payment) => {
    setLoading(true);
    try {
      // Burada gerçek e-posta gönderme API'si çağrılacak
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simülasyon
      toast.success(`${payment.customer_name} adlı müşteriye hatırlatma e-postası gönderildi`);
    } catch (error) {
      toast.error('E-posta gönderilirken hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  const handleBulkReminder = async () => {
    const overduePayments = filteredPayments.filter(p => p.status === 'overdue');
    if (overduePayments.length === 0) {
      toast.info('Gecikmiş ödeme bulunamadı');
      return;
    }

    setLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 2000));
      toast.success(`${overduePayments.length} müşteriye toplu hatırlatma e-postası gönderildi`);
    } catch (error) {
      toast.error('Toplu e-posta gönderilirken hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  const totalOverdue = filteredPayments
    .filter(p => p.status === 'overdue')
    .reduce((sum, p) => sum + p.amount, 0);

  const totalPending = filteredPayments
    .filter(p => p.status === 'pending')
    .reduce((sum, p) => sum + p.amount, 0);

  const totalDebt = filteredPayments
    .reduce((sum, p) => sum + p.total_debt, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Ödeme Takibi</h1>
          <p className="text-gray-600 dark:text-gray-400">
            {filteredPayments.length} ödeme kaydı bulundu
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleBulkReminder}
            disabled={loading}
            className="inline-flex items-center px-4 py-2 bg-orange-600 hover:bg-orange-700 disabled:bg-orange-400 text-white rounded-lg text-sm font-medium"
          >
            <Mail className="w-4 h-4 mr-2" />
            {loading ? 'Gönderiliyor...' : 'Toplu Hatırlatma'}
          </button>
          <button className="inline-flex items-center px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700">
            <Download className="w-4 h-4 mr-2" />
            Dışa Aktar
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Gecikmiş Ödemeler</p>
              <p className="text-2xl font-bold text-red-600 mt-2">₺{totalOverdue.toLocaleString()}</p>
            </div>
            <div className="bg-red-100 dark:bg-red-900/20 p-3 rounded-lg">
              <AlertTriangle className="w-6 h-6 text-red-600" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Bekleyen Ödemeler</p>
              <p className="text-2xl font-bold text-yellow-600 mt-2">₺{totalPending.toLocaleString()}</p>
            </div>
            <div className="bg-yellow-100 dark:bg-yellow-900/20 p-3 rounded-lg">
              <Clock className="w-6 h-6 text-yellow-600" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Toplam Borç</p>
              <p className="text-2xl font-bold text-purple-600 mt-2">₺{totalDebt.toLocaleString()}</p>
            </div>
            <div className="bg-purple-100 dark:bg-purple-900/20 p-3 rounded-lg">
              <DollarSign className="w-6 h-6 text-purple-600" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Bu Ay Toplam</p>
              <p className="text-2xl font-bold text-blue-600 mt-2">₺{(totalOverdue + totalPending).toLocaleString()}</p>
            </div>
            <div className="bg-blue-100 dark:bg-blue-900/20 p-3 rounded-lg">
              <CreditCard className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Müşteri, e-posta veya fatura numarası ara..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-gray-400" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">Tüm Durumlar</option>
              <option value="paid">Ödendi</option>
              <option value="pending">Beklemede</option>
              <option value="overdue">Gecikmiş</option>
            </select>
          </div>
        </div>
      </div>

      {/* Payments Table */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Müşteri
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Fatura No
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Tutar
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Toplam Borç
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Vade Tarihi
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
              {filteredPayments.map((payment) => (
                <tr key={payment.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                  <td className="px-6 py-4">
                    <div className="flex items-center">
                      <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white font-semibold">
                        {payment.customer_name.charAt(0)}
                      </div>
                      <div className="ml-3">
                        <div className="text-sm font-medium text-gray-900 dark:text-white">
                          {payment.customer_name}
                        </div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          {payment.customer_email}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm font-medium text-gray-900 dark:text-white">
                      {payment.invoice_number}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm font-bold text-gray-900 dark:text-white">
                      ₺{payment.amount.toLocaleString()}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`text-sm font-bold ${payment.total_debt > 0 ? 'text-red-600' : 'text-green-600'}`}>
                      ₺{payment.total_debt.toLocaleString()}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center">
                      <Calendar className="w-4 h-4 text-gray-400 mr-2" />
                      <span className="text-sm text-gray-900 dark:text-white">
                        {format(new Date(payment.due_date), 'dd MMM yyyy', { locale: tr })}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center">
                      {getStatusIcon(payment.status)}
                      <span className={`ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(payment.status)}`}>
                        {getStatusText(payment.status)}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      {payment.status === 'overdue' && (
                        <button
                          onClick={() => handleSendReminder(payment)}
                          disabled={loading}
                          className="inline-flex items-center px-3 py-1 bg-orange-600 hover:bg-orange-700 disabled:bg-orange-400 text-white rounded text-xs font-medium"
                        >
                          <Mail className="w-3 h-3 mr-1" />
                          Hatırlatma Gönder
                        </button>
                      )}
                      <button className="inline-flex items-center px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs font-medium">
                        <User className="w-3 h-3 mr-1" />
                        Profil
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

export default PaymentTracking;