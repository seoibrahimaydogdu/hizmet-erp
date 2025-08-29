import React, { useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Download, MessageSquare, CheckCircle, Clock, Star, Users, AlertCircle } from 'lucide-react';

const ReportsPage = () => {
  // Sample data for charts
  const weeklyData = [
    { name: 'Pzt', tickets: 12, resolved: 10 },
    { name: 'Sal', tickets: 19, resolved: 15 },
    { name: 'Çar', tickets: 15, resolved: 12 },
    { name: 'Per', tickets: 22, resolved: 18 },
    { name: 'Cum', tickets: 18, resolved: 16 },
    { name: 'Cmt', tickets: 8, resolved: 7 },
    { name: 'Paz', tickets: 5, resolved: 4 }
  ];

  const categoryData = [
    { name: 'Teknik', value: 35, color: '#3b82f6' },
    { name: 'Faturalandırma', value: 25, color: '#10b981' },
    { name: 'Genel', value: 20, color: '#f59e0b' },
    { name: 'Hesap', value: 20, color: '#ef4444' }
  ];

  const topAgents = [
    { name: 'Ahmet Yılmaz', resolved: 45, rating: 4.8 },
    { name: 'Ayşe Kaya', resolved: 38, rating: 4.7 },
    { name: 'Mehmet Demir', resolved: 32, rating: 4.6 },
    { name: 'Fatma Şahin', resolved: 28, rating: 4.5 }
  ];

  // Calculate stats
  const totalTickets = weeklyData.reduce((sum, day) => sum + day.tickets, 0);
  const totalResolved = weeklyData.reduce((sum, day) => sum + day.resolved, 0);
  const resolutionRate = Math.round((totalResolved / totalTickets) * 100);
  const avgResponseTime = 2.5;
  const customerSatisfaction = 4.2;
  const activeAgents = 12;
  const pendingTickets = totalTickets - totalResolved;

  const stats = [
    {
      title: 'Toplam Talepler',
      value: totalTickets.toString(),
      change: '+12%',
      trend: 'up',
      icon: MessageSquare,
      color: 'bg-blue-500'
    },
    {
      title: 'Çözülen Talepler',
      value: totalResolved.toString(),
      change: '+8%',
      trend: 'up',
      icon: CheckCircle,
      color: 'bg-green-500'
    },
    {
      title: 'Ortalama Yanıt Süresi',
      value: `${avgResponseTime}s`,
      change: '-15 dk',
      trend: 'down',
      icon: Clock,
      color: 'bg-orange-500'
    },
    {
      title: 'Müşteri Memnuniyeti',
      value: customerSatisfaction.toString(),
      change: '+0.3',
      trend: 'up',
      icon: Star,
      color: 'bg-purple-500'
    },
    {
      title: 'Aktif Temsilciler',
      value: activeAgents.toString(),
      change: '+2',
      trend: 'up',
      icon: Users,
      color: 'bg-indigo-500'
    },
    {
      title: 'Bekleyen Talepler',
      value: pendingTickets.toString(),
      change: '-5',
      trend: 'down',
      icon: AlertCircle,
      color: 'bg-red-500'
    }
  ];

  const handleExportReport = () => {
    const reportData = {
      generatedAt: new Date().toISOString(),
      period: 'Son 7 Gün',
      stats: {
        totalTickets,
        totalResolved,
        resolutionRate,
        avgResponseTime,
        customerSatisfaction,
        activeAgents,
        pendingTickets
      },
      weeklyData,
      categoryData,
      topAgents
    };

    const dataStr = JSON.stringify(reportData, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    
    const exportFileDefaultName = `destek-raporu-${new Date().toISOString().split('T')[0]}.json`;
    
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
          <h1 className="text-3xl font-bold text-gray-900">Raporlar ve Analitik</h1>
          <p className="text-gray-600 mt-2">Destek sistemi performans raporları</p>
        </div>
        <button
          onClick={handleExportReport}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Download className="w-4 h-4" />
          Rapor İndir
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <div key={index} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                  <p className="text-2xl font-bold text-gray-900 mt-2">{stat.value}</p>
                  <div className="flex items-center mt-2">
                    <span className={`text-sm font-medium ${
                      stat.trend === 'up' ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {stat.trend === 'up' ? '↗' : '↘'} {stat.change}
                    </span>
                  </div>
                </div>
                <div className={`${stat.color} p-3 rounded-lg`}>
                  <Icon className="w-6 h-6 text-white" />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        {/* Weekly Trend */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Haftalık Trend</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={weeklyData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="tickets" fill="#3b82f6" name="Toplam Talepler" />
              <Bar dataKey="resolved" fill="#10b981" name="Çözülen" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Category Distribution */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Kategori Dağılımı</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={categoryData}
                cx="50%"
                cy="50%"
                outerRadius={100}
                dataKey="value"
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
              >
                {categoryData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Top Agents */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">En İyi Temsilciler</h3>
        <div className="space-y-4">
          {topAgents.map((agent, index) => (
            <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                  <span className="text-blue-600 font-semibold">{agent.name.charAt(0)}</span>
                </div>
                <div>
                  <p className="font-medium text-gray-900">{agent.name}</p>
                  <p className="text-sm text-gray-600">{agent.resolved} çözülen talep</p>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <Star className="w-4 h-4 text-yellow-400 fill-current" />
                <span className="text-sm font-medium text-gray-900">{agent.rating}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ReportsPage;