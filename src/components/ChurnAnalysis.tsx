import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { 
  TrendingDown, 
  Users, 
  Calendar, 
  AlertTriangle,
  Filter,
  Download,
  Eye
} from 'lucide-react';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';

interface ChurnedUser {
  id: string;
  name: string;
  email: string;
  plan: string;
  churn_date: string;
  churn_reason: string;
  last_login: string;
  subscription_duration: number; // days
  top_features: string[];
}

interface FeatureUsage {
  feature: string;
  usage_count: number;
  percentage: number;
}

const ChurnAnalysis: React.FC = () => {
  const [churnedUsers] = useState<ChurnedUser[]>([
    {
      id: '1',
      name: 'Mehmet Özkan',
      email: 'mehmet@example.com',
      plan: 'Pro',
      churn_date: '2025-01-05',
      churn_reason: 'Fiyat',
      last_login: '2025-01-03',
      subscription_duration: 45,
      top_features: ['Raporlar', 'Analitik', 'Canlı Destek']
    },
    {
      id: '2',
      name: 'Ayşe Demir',
      email: 'ayse@example.com',
      plan: 'Basic',
      churn_date: '2025-01-08',
      churn_reason: 'Özellik Eksikliği',
      last_login: '2025-01-07',
      subscription_duration: 23,
      top_features: ['Dashboard', 'Müşteri Yönetimi', 'Raporlar']
    },
    {
      id: '3',
      name: 'Ali Kaya',
      email: 'ali@example.com',
      plan: 'Premium',
      churn_date: '2025-01-10',
      churn_reason: 'Kullanım Zorluğu',
      last_login: '2025-01-09',
      subscription_duration: 67,
      top_features: ['Analitik', 'Otomasyonlar', 'API Entegrasyonu']
    },
    {
      id: '4',
      name: 'Zeynep Yıldız',
      email: 'zeynep@example.com',
      plan: 'Pro',
      churn_date: '2025-01-12',
      churn_reason: 'Rakip Ürün',
      last_login: '2025-01-11',
      subscription_duration: 89,
      top_features: ['Canlı Destek', 'Raporlar', 'Dashboard']
    }
  ]);

  const [timeFilter, setTimeFilter] = useState('30');
  const [planFilter, setPlanFilter] = useState('all');

  // Churn nedenleri analizi
  const churnReasons = churnedUsers.reduce((acc, user) => {
    acc[user.churn_reason] = (acc[user.churn_reason] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const churnReasonData = Object.entries(churnReasons).map(([reason, count]) => ({
    name: reason,
    value: count,
    percentage: Math.round((count / churnedUsers.length) * 100)
  }));

  // En çok kullanılan özellikler analizi
  const featureUsage = churnedUsers.reduce((acc, user) => {
    user.top_features.forEach((feature, index) => {
      if (!acc[feature]) {
        acc[feature] = { count: 0, totalWeight: 0 };
      }
      // İlk özellik 3 puan, ikinci 2 puan, üçüncü 1 puan
      const weight = 3 - index;
      acc[feature].count += 1;
      acc[feature].totalWeight += weight;
    });
    return acc;
  }, {} as Record<string, { count: number; totalWeight: number }>);

  const topFeaturesData = Object.entries(featureUsage)
    .map(([feature, data]) => ({
      feature,
      usage_count: data.count,
      weighted_score: data.totalWeight,
      percentage: Math.round((data.count / churnedUsers.length) * 100)
    }))
    .sort((a, b) => b.weighted_score - a.weighted_score)
    .slice(0, 5);

  // Plan bazında churn analizi
  const planChurnData = churnedUsers.reduce((acc, user) => {
    acc[user.plan] = (acc[user.plan] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const planChurnChartData = Object.entries(planChurnData).map(([plan, count]) => ({
    plan,
    count,
    percentage: Math.round((count / churnedUsers.length) * 100)
  }));

  const colors = ['#ef4444', '#f97316', '#eab308', '#22c55e', '#3b82f6', '#8b5cf6'];

  const filteredUsers = churnedUsers.filter(user => {
    const matchesPlan = planFilter === 'all' || user.plan === planFilter;
    const churnDate = new Date(user.churn_date);
    const daysAgo = parseInt(timeFilter);
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysAgo);
    const matchesTime = churnDate >= cutoffDate;
    
    return matchesPlan && matchesTime;
  });

  const churnRate = 15.2; // Örnek churn oranı
  const avgSubscriptionDuration = Math.round(
    churnedUsers.reduce((sum, user) => sum + user.subscription_duration, 0) / churnedUsers.length
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Churn Analizi</h1>
          <p className="text-gray-600 dark:text-gray-400">
            Son {timeFilter} günde {filteredUsers.length} kullanıcı ayrıldı
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button className="inline-flex items-center px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700">
            <Download className="w-4 h-4 mr-2" />
            Rapor İndir
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Churn Oranı</p>
              <p className="text-2xl font-bold text-red-600 mt-2">{churnRate}%</p>
            </div>
            <div className="bg-red-100 dark:bg-red-900/20 p-3 rounded-lg">
              <TrendingDown className="w-6 h-6 text-red-600" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Ayrılan Kullanıcı</p>
              <p className="text-2xl font-bold text-orange-600 mt-2">{filteredUsers.length}</p>
            </div>
            <div className="bg-orange-100 dark:bg-orange-900/20 p-3 rounded-lg">
              <Users className="w-6 h-6 text-orange-600" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Ort. Abonelik Süresi</p>
              <p className="text-2xl font-bold text-blue-600 mt-2">{avgSubscriptionDuration} gün</p>
            </div>
            <div className="bg-blue-100 dark:bg-blue-900/20 p-3 rounded-lg">
              <Calendar className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Risk Altındaki</p>
              <p className="text-2xl font-bold text-purple-600 mt-2">23</p>
            </div>
            <div className="bg-purple-100 dark:bg-purple-900/20 p-3 rounded-lg">
              <AlertTriangle className="w-6 h-6 text-purple-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-gray-400" />
            <select
              value={timeFilter}
              onChange={(e) => setTimeFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="7">Son 7 Gün</option>
              <option value="30">Son 30 Gün</option>
              <option value="90">Son 90 Gün</option>
              <option value="365">Son 1 Yıl</option>
            </select>
          </div>
          <div>
            <select
              value={planFilter}
              onChange={(e) => setPlanFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">Tüm Planlar</option>
              <option value="Basic">Basic</option>
              <option value="Pro">Pro</option>
              <option value="Premium">Premium</option>
            </select>
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Features Used by Churned Users */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Ayrılan Kullanıcıların En Çok Kullandığı Özellikler
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={topFeaturesData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="feature" 
                angle={-45}
                textAnchor="end"
                height={80}
                fontSize={12}
              />
              <YAxis />
              <Tooltip 
                formatter={(value, name) => [
                  `${value} kullanıcı`,
                  name === 'usage_count' ? 'Kullanım Sayısı' : name
                ]}
              />
              <Bar dataKey="usage_count" fill="#3b82f6" name="Kullanım Sayısı" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Churn Reasons */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Churn Nedenleri</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={churnReasonData}
                cx="50%"
                cy="50%"
                outerRadius={100}
                dataKey="value"
                label={({ name, percentage }) => `${name} (${percentage}%)`}
              >
                {churnReasonData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Plan-based Churn Analysis */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Plan Bazında Churn Analizi</h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={planChurnChartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="plan" />
            <YAxis />
            <Tooltip formatter={(value) => [`${value} kullanıcı`, 'Ayrılan Sayısı']} />
            <Bar dataKey="count" fill="#ef4444" name="Ayrılan Kullanıcı" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Churned Users Table */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Ayrılan Kullanıcılar</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Kullanıcı
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Plan
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Ayrılma Tarihi
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Neden
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Abonelik Süresi
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  En Çok Kullanılan
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  İşlemler
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {filteredUsers.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                  <td className="px-6 py-4">
                    <div className="flex items-center">
                      <div className="w-10 h-10 bg-red-500 rounded-full flex items-center justify-center text-white font-semibold">
                        {user.name.charAt(0)}
                      </div>
                      <div className="ml-3">
                        <div className="text-sm font-medium text-gray-900 dark:text-white">
                          {user.name}
                        </div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          {user.email}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400">
                      {user.plan}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">
                    {format(new Date(user.churn_date), 'dd MMM yyyy', { locale: tr })}
                  </td>
                  <td className="px-6 py-4">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400">
                      {user.churn_reason}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">
                    {user.subscription_duration} gün
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-wrap gap-1">
                      {user.top_features.slice(0, 2).map((feature, index) => (
                        <span
                          key={index}
                          className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400"
                        >
                          {feature}
                        </span>
                      ))}
                      {user.top_features.length > 2 && (
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          +{user.top_features.length - 2}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <button className="inline-flex items-center px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs font-medium">
                      <Eye className="w-3 h-3 mr-1" />
                      Detay
                    </button>
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

export default ChurnAnalysis;