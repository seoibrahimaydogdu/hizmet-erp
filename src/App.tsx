import React, { useState, useEffect } from 'react';
import { Toaster } from 'react-hot-toast';
import { 
  LayoutDashboard, 
  MessageSquare, 
  Users, 
  UserCheck, 
  BarChart3, 
  Settings, 
  Bell, 
  Search,
  Menu,
  X,
  User,
  CreditCard,
  TrendingDown
} from 'lucide-react';

// Import components
import TicketsPage from './components/TicketsPage';
import CustomersPage from './components/CustomersPage';
import AgentsPage from './components/AgentsPage';
import ReportsPage from './components/ReportsPage';
import SettingsPage from './components/SettingsPage';
import LiveChat from './components/LiveChat';
import ProfilePage from './components/ProfilePage';
import PaymentTracking from './components/PaymentTracking';
import ChurnAnalysis from './components/ChurnAnalysis';
import CustomerProfile from './components/CustomerProfile';

function App() {
  const [currentPage, setCurrentPage] = useState('dashboard');
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [darkMode, setDarkMode] = useState(false);

  const menuItems = [
    { id: 'dashboard', name: 'Dashboard', icon: LayoutDashboard },
    { id: 'tickets', name: 'Talepler', icon: MessageSquare },
    { id: 'customers', name: 'Müşteriler', icon: Users },
    { id: 'agents', name: 'Temsilciler', icon: UserCheck },
    { id: 'payment-tracking', name: 'Ödeme Takibi', icon: CreditCard },
    { id: 'churn-analysis', name: 'Churn Analizi', icon: TrendingDown },
    { id: 'live-chat', name: 'Canlı Destek', icon: MessageSquare },
    { id: 'reports', name: 'Raporlar', icon: BarChart3 },
    { id: 'settings', name: 'Ayarlar', icon: Settings },
  ];

  const renderContent = () => {
    // Müşteri profili sayfası için özel kontrol
    if (currentPage === 'customer-profile' && selectedCustomerId) {
      return (
        <CustomerProfile 
          customerId={selectedCustomerId} 
          onBack={() => {
            setCurrentPage('customers');
            setSelectedCustomerId(null);
          }} 
        />
      );
    }

    switch (currentPage) {
      case 'dashboard':
        return (
          <div className="p-6">
            <div className="flex justify-between items-center mb-8">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Dashboard</h1>
                <p className="text-gray-600 dark:text-gray-400 mt-2">Destek sistemi genel bakış</p>
              </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Toplam Talepler</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white mt-2">5</p>
                    <div className="flex items-center mt-2">
                      <span className="text-sm font-medium text-green-600">↗ +12%</span>
                    </div>
                  </div>
                  <div className="bg-blue-500 p-3 rounded-lg">
                    <MessageSquare className="w-6 h-6 text-white" />
                  </div>
                </div>
              </div>

              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Açık Talepler</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white mt-2">3</p>
                    <div className="flex items-center mt-2">
                      <span className="text-sm font-medium text-green-600">↗ +5%</span>
                    </div>
                  </div>
                  <div className="bg-orange-500 p-3 rounded-lg">
                    <MessageSquare className="w-6 h-6 text-white" />
                  </div>
                </div>
              </div>

              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Çözülen Talepler</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white mt-2">2</p>
                    <div className="flex items-center mt-2">
                      <span className="text-sm font-medium text-green-600">↗ +8%</span>
                    </div>
                  </div>
                  <div className="bg-green-500 p-3 rounded-lg">
                    <MessageSquare className="w-6 h-6 text-white" />
                  </div>
                </div>
              </div>

              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Aktif Temsilciler</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white mt-2">4</p>
                    <div className="flex items-center mt-2">
                      <span className="text-sm font-medium text-gray-500">0%</span>
                    </div>
                  </div>
                  <div className="bg-purple-500 p-3 rounded-lg">
                    <Users className="w-6 h-6 text-white" />
                  </div>
                </div>
              </div>
            </div>

            {/* Recent Activity */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Son Aktiviteler</h3>
              <div className="space-y-4">
                <div className="flex items-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <div className="w-2 h-2 bg-green-500 rounded-full mr-3"></div>
                  <div className="flex-1">
                    <p className="text-sm text-gray-900 dark:text-white">Yeni talep oluşturuldu</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">2 dakika önce</p>
                  </div>
                </div>
                <div className="flex items-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mr-3"></div>
                  <div className="flex-1">
                    <p className="text-sm text-gray-900 dark:text-white">Talep #123 çözümlendi</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">15 dakika önce</p>
                  </div>
                </div>
                <div className="flex items-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <div className="w-2 h-2 bg-yellow-500 rounded-full mr-3"></div>
                  <div className="flex-1">
                    <p className="text-sm text-gray-900 dark:text-white">Yeni müşteri kaydı</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">1 saat önce</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      case 'tickets':
        return <TicketsPage />;
      case 'customers':
        return (
          <CustomersPage 
            onViewCustomer={(customerId: string) => {
              setSelectedCustomerId(customerId);
              setCurrentPage('customer-profile');
            }} 
          />
        );
      case 'agents':
        return <AgentsPage />;
      case 'payment-tracking':
        return <PaymentTracking />;
      case 'churn-analysis':
        return <ChurnAnalysis />;
      case 'live-chat':
        return <LiveChat />;
      case 'reports':
        return <ReportsPage />;
      case 'settings':
        return <SettingsPage />;
      case 'profile':
        return <ProfilePage />;
      default:
        return <div className="p-6">Sayfa bulunamadı</div>;
    }
  };

  return (
    <div className={`min-h-screen ${darkMode ? 'dark' : ''}`}>
      <div className="flex bg-gray-50 dark:bg-gray-900">
        {/* Sidebar */}
        <div className={`fixed inset-y-0 left-0 z-50 w-64 bg-white dark:bg-gray-800 shadow-lg transform ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0`}>
          <div className="flex items-center justify-between h-16 px-6 border-b border-gray-200 dark:border-gray-700">
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">Destek Merkezi</h1>
            <button
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
          <nav className="mt-6 px-3">
            <div className="space-y-1">
              {menuItems.map((item) => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      setCurrentPage(item.id);
                      setSidebarOpen(false);
                    }}
                    className={`w-full flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                      currentPage === item.id
                        ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400'
                        : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                    }`}
                  >
                    <Icon className="w-5 h-5 mr-3" />
                    {item.name}
                  </button>
                );
              })}
            </div>
          </nav>
        </div>

        {/* Main Content */}
        <div className="flex-1 lg:ml-0">
          {/* Header */}
          <header className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between h-16 px-6">
              <div className="flex items-center">
                <button
                  onClick={() => setSidebarOpen(true)}
                  className="lg:hidden text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 mr-4"
                >
                  <Menu className="w-6 h-6" />
                </button>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Talepler, müşteriler, temsil..."
                    className="pl-10 pr-4 py-2 w-80 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
              <div className="flex items-center space-x-4">
                <button
                  onClick={() => setDarkMode(!darkMode)}
                  className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  {darkMode ? '☀️' : '🌙'}
                </button>
                <button className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700">
                  <Bell className="w-5 h-5" />
                </button>
                <button 
                  onClick={() => setCurrentPage('profile')}
                  className="flex items-center space-x-3 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white font-semibold text-sm">
                    AU
                  </div>
                  <div className="text-left">
                    <p className="text-sm font-medium text-gray-900 dark:text-white">Admin User</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">admin@company.com</p>
                  </div>
                </button>
              </div>
            </div>
          </header>

          {/* Page Content */}
          <main className="flex-1">
            {renderContent()}
          </main>
        </div>
      </div>

      {/* Overlay for mobile sidebar */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black bg-opacity-50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <Toaster position="top-right" />
    </div>
  );
}

export default App;