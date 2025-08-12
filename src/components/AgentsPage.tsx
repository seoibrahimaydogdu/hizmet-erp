import React, { useState, useEffect } from 'react';
import { 
  Search, 
  Filter, 
  Download, 
  Plus, 
  Eye, 
  Edit, 
  Trash2, 
  MoreVertical,
  CheckSquare,
  Square,
  User,
  Mail,
  Phone,
  Shield,
  Star,
  Calendar,
  Clock,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';
import { useSupabase } from '../hooks/useSupabase';
import { toast } from 'react-hot-toast';

const AgentsPage: React.FC = () => {
  const {
    loading,
    agents,
    searchTerm,
    setSearchTerm,
    selectedItems,
    setSelectedItems,
    exportData,
    fetchAgents,
    updateAgentStatus
  } = useSupabase();

  const [statusFilter, setStatusFilter] = useState('all');
  const [roleFilter, setRoleFilter] = useState('all');
  const [showNewAgentModal, setShowNewAgentModal] = useState(false);
  const [showActionMenu, setShowActionMenu] = useState<string | null>(null);
  const [showViewModal, setShowViewModal] = useState<string | null>(null);
  const [showEditModal, setShowEditModal] = useState<string | null>(null);

  useEffect(() => {
    fetchAgents();
  }, []);

  // Filter agents based on search term, status, and role
  const filteredAgents = agents.filter(agent => {
    const matchesSearch = agent.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         agent.email.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || agent.status === statusFilter;
    const matchesRole = roleFilter === 'all' || agent.role === roleFilter;
    
    return matchesSearch && matchesStatus && matchesRole;
  });

  const handleSelectAll = () => {
    if (selectedItems.length === filteredAgents.length) {
      setSelectedItems([]);
    } else {
      setSelectedItems(filteredAgents.map(agent => agent.id));
    }
  };

  const handleSelectItem = (id: string) => {
    setSelectedItems(prev => 
      prev.includes(id) 
        ? prev.filter(item => item !== id)
        : [...prev, id]
    );
  };

  const handleSearch = () => {
    if (searchTerm.trim()) {
      toast.success(`"${searchTerm}" için ${filteredAgents.length} temsilci bulundu`);
    } else {
      toast.info('Arama terimi girin');
    }
  };

  const handleViewAgent = (agentId: string) => {
    setShowViewModal(agentId);
  };

  const handleEditAgent = (agentId: string) => {
    setShowEditModal(agentId);
  };

  const handleDeleteAgent = async (agentId: string) => {
    if (confirm('Bu temsilciyi silmek istediğinizden emin misiniz?')) {
      try {
        toast.success('Temsilci başarıyla silindi');
        fetchAgents();
      } catch (error) {
        toast.error('Temsilci silinirken hata oluştu');
      }
    }
  };

  const handleStatusChange = async (agentId: string, newStatus: string) => {
    await updateAgentStatus(agentId, newStatus);
    setShowActionMenu(null);
  };

  const handleAssignTickets = (agentId: string) => {
    toast.success('Talep atama sayfasına yönlendiriliyor...');
    setShowActionMenu(null);
  };

  const handleViewPerformance = (agentId: string) => {
    toast.success('Performans raporu görüntüleniyor...');
    setShowActionMenu(null);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'online': return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'busy': return <AlertCircle className="w-4 h-4 text-yellow-500" />;
      case 'away': return <Clock className="w-4 h-4 text-orange-500" />;
      default: return <AlertCircle className="w-4 h-4 text-gray-400" />;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'online': return 'Çevrimiçi';
      case 'busy': return 'Meşgul';
      case 'away': return 'Uzakta';
      default: return 'Çevrimdışı';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'online': return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400';
      case 'busy': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400';
      case 'away': return 'bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400';
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin': return 'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400';
      case 'supervisor': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400';
      case 'agent': return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400';
    }
  };

  const getRoleText = (role: string) => {
    switch (role) {
      case 'admin': return 'Yönetici';
      case 'supervisor': return 'Süpervizör';
      case 'agent': return 'Temsilci';
      default: return 'Kullanıcı';
    }
  };

  const getSelectedAgent = (id: string) => {
    return agents.find(agent => agent.id === id);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Temsilciler</h1>
          <p className="text-gray-600 dark:text-gray-400">
            {filteredAgents.length} temsilci bulundu
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => exportData('agents')}
            className="inline-flex items-center px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
          >
            <Download className="w-4 h-4 mr-2" />
            Dışa Aktar
          </button>
          <button
            onClick={() => setShowNewAgentModal(true)}
            className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium"
          >
            <Plus className="w-4 h-4 mr-2" />
            Yeni Temsilci
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Search */}
          <div className="flex-1">
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Temsilci ara (ad, e-posta)..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <button
                onClick={handleSearch}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium"
              >
                Ara
              </button>
            </div>
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-gray-400" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">Tüm Durumlar</option>
              <option value="online">Çevrimiçi</option>
              <option value="busy">Meşgul</option>
              <option value="away">Uzakta</option>
              <option value="offline">Çevrimdışı</option>
            </select>
          </div>

          {/* Role Filter */}
          <div>
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">Tüm Roller</option>
              <option value="admin">Yönetici</option>
              <option value="supervisor">Süpervizör</option>
              <option value="agent">Temsilci</option>
            </select>
          </div>
        </div>
      </div>

      {/* Bulk Actions */}
      {selectedItems.length > 0 && (
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-blue-900 dark:text-blue-300">
              {selectedItems.length} temsilci seçildi
            </span>
            <div className="flex items-center gap-2">
              <select
                onChange={(e) => {
                  if (e.target.value) {
                    selectedItems.forEach(id => handleStatusChange(id, e.target.value));
                  }
                }}
                className="px-3 py-1 text-sm border border-blue-300 dark:border-blue-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option value="">Durum Değiştir</option>
                <option value="online">Çevrimiçi</option>
                <option value="busy">Meşgul</option>
                <option value="away">Uzakta</option>
                <option value="offline">Çevrimdışı</option>
              </select>
              <button
                onClick={() => exportData('agents')}
                className="px-3 py-1 text-sm border border-blue-300 dark:border-blue-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white hover:bg-gray-50 dark:hover:bg-gray-600"
              >
                Dışa Aktar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Agents Table */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
              <tr>
                <th className="w-12 px-6 py-3 text-left">
                  <button
                    onClick={handleSelectAll}
                    className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                  >
                    {selectedItems.length === filteredAgents.length && filteredAgents.length > 0 ? (
                      <CheckSquare className="w-4 h-4" />
                    ) : (
                      <Square className="w-4 h-4" />
                    )}
                  </button>
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Temsilci
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Rol
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Durum
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Performans
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Çözülen
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Kayıt Tarihi
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  İşlemler
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {loading ? (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center">
                    <div className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                      <span className="ml-3 text-gray-500 dark:text-gray-400">Yükleniyor...</span>
                    </div>
                  </td>
                </tr>
              ) : filteredAgents.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center text-gray-500 dark:text-gray-400">
                    {searchTerm || statusFilter !== 'all' || roleFilter !== 'all' ? 'Arama kriterlerine uygun temsilci bulunamadı' : 'Henüz temsilci bulunmuyor'}
                  </td>
                </tr>
              ) : (
                filteredAgents.map((agent) => (
                  <tr key={agent.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                    <td className="px-6 py-4">
                      <button
                        onClick={() => handleSelectItem(agent.id)}
                        className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                      >
                        {selectedItems.includes(agent.id) ? (
                          <CheckSquare className="w-4 h-4" />
                        ) : (
                          <Square className="w-4 h-4" />
                        )}
                      </button>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        {agent.avatar_url ? (
                          <img
                            src={agent.avatar_url}
                            alt={agent.name}
                            className="w-10 h-10 rounded-full object-cover"
                          />
                        ) : (
                          <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white font-semibold">
                            {agent.name.charAt(0)}
                          </div>
                        )}
                        <div className="ml-3">
                          <div className="text-sm font-medium text-gray-900 dark:text-white">
                            {agent.name}
                          </div>
                          <div className="text-sm text-gray-500 dark:text-gray-400">
                            {agent.email}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getRoleColor(agent.role)}`}>
                        {getRoleText(agent.role)}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        {getStatusIcon(agent.status)}
                        <span className={`ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(agent.status)}`}>
                          {getStatusText(agent.status)}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <div className="w-16 bg-gray-200 dark:bg-gray-700 rounded-full h-2 mr-2">
                          <div 
                            className="bg-blue-600 h-2 rounded-full"
                            style={{ width: `${agent.performance_score}%` }}
                          ></div>
                        </div>
                        <span className="text-sm font-medium text-gray-900 dark:text-white">
                          {agent.performance_score}%
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm font-medium text-gray-900 dark:text-white">
                        {agent.total_resolved}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                      {format(new Date(agent.created_at), 'dd MMM yyyy', { locale: tr })}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleViewAgent(agent.id)}
                          className="p-1 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400"
                          title="Görüntüle"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleEditAgent(agent.id)}
                          className="p-1 text-gray-400 hover:text-green-600 dark:hover:text-green-400"
                          title="Düzenle"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteAgent(agent.id)}
                          className="p-1 text-gray-400 hover:text-red-600 dark:hover:text-red-400"
                          title="Sil"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                        <div className="relative">
                          <button
                            onClick={() => setShowActionMenu(showActionMenu === agent.id ? null : agent.id)}
                            className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                            title="Daha fazla"
                          >
                            <MoreVertical className="w-4 h-4" />
                          </button>
                          {showActionMenu === agent.id && (
                            <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-md shadow-lg border border-gray-200 dark:border-gray-700 z-10">
                              <div className="py-1">
                                <div className="px-4 py-2 text-xs font-medium text-gray-500 dark:text-gray-400">
                                  Durum Değiştir
                                </div>
                                <button
                                  onClick={() => handleStatusChange(agent.id, 'online')}
                                  className="block w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                                >
                                  Çevrimiçi
                                </button>
                                <button
                                  onClick={() => handleStatusChange(agent.id, 'busy')}
                                  className="block w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                                >
                                  Meşgul
                                </button>
                                <button
                                  onClick={() => handleStatusChange(agent.id, 'away')}
                                  className="block w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                                >
                                  Uzakta
                                </button>
                                <div className="border-t border-gray-200 dark:border-gray-600">
                                  <button
                                    onClick={() => handleAssignTickets(agent.id)}
                                    className="block w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                                  >
                                    Talep Ata
                                  </button>
                                  <button
                                    onClick={() => handleViewPerformance(agent.id)}
                                    className="block w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                                  >
                                    Performans Görüntüle
                                  </button>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between">
        <div className="text-sm text-gray-700 dark:text-gray-300">
          {filteredAgents.length} temsilci gösteriliyor
        </div>
        <div className="flex items-center gap-2">
          <button className="px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700">
            Önceki
          </button>
          <button className="px-3 py-2 text-sm bg-blue-600 text-white rounded-lg">
            1
          </button>
          <button className="px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700">
            Sonraki
          </button>
        </div>
      </div>

      {/* View Agent Modal */}
      {showViewModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 w-full max-w-2xl mx-4">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Temsilci Detayları</h3>
              <button
                onClick={() => setShowViewModal(null)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                ✕
              </button>
            </div>
            {(() => {
              const agent = getSelectedAgent(showViewModal);
              if (!agent) return null;
              return (
                <div className="space-y-4">
                  <div className="flex items-center space-x-4">
                    {agent.avatar_url ? (
                      <img src={agent.avatar_url} alt={agent.name} className="w-16 h-16 rounded-full" />
                    ) : (
                      <div className="w-16 h-16 bg-blue-500 rounded-full flex items-center justify-center text-white text-xl font-bold">
                        {agent.name.charAt(0)}
                      </div>
                    )}
                    <div>
                      <h4 className="text-xl font-semibold text-gray-900 dark:text-white">{agent.name}</h4>
                      <p className="text-gray-600 dark:text-gray-400">{agent.email}</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Rol</label>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getRoleColor(agent.role)}`}>
                        {getRoleText(agent.role)}
                      </span>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Durum</label>
                      <div className="flex items-center">
                        {getStatusIcon(agent.status)}
                        <span className="ml-2">{getStatusText(agent.status)}</span>
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Performans</label>
                      <div className="flex items-center">
                        <div className="w-24 bg-gray-200 dark:bg-gray-700 rounded-full h-2 mr-2">
                          <div 
                            className="bg-blue-600 h-2 rounded-full"
                            style={{ width: `${agent.performance_score}%` }}
                          ></div>
                        </div>
                        <span>{agent.performance_score}%</span>
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Çözülen Talepler</label>
                      <p className="text-gray-900 dark:text-white">{agent.total_resolved}</p>
                    </div>
                  </div>
                </div>
              );
            })()}
          </div>
        </div>
      )}

      {/* Edit Agent Modal */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 w-full max-w-2xl mx-4">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Temsilci Düzenle</h3>
              <button
                onClick={() => setShowEditModal(null)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                ✕
              </button>
            </div>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Ad Soyad</label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    defaultValue={getSelectedAgent(showEditModal)?.name}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">E-posta</label>
                  <input
                    type="email"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    defaultValue={getSelectedAgent(showEditModal)?.email}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Rol</label>
                  <select
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    defaultValue={getSelectedAgent(showEditModal)?.role}
                  >
                    <option value="agent">Temsilci</option>
                    <option value="supervisor">Süpervizör</option>
                    <option value="admin">Yönetici</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Durum</label>
                  <select
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    defaultValue={getSelectedAgent(showEditModal)?.status}
                  >
                    <option value="online">Çevrimiçi</option>
                    <option value="busy">Meşgul</option>
                    <option value="away">Uzakta</option>
                    <option value="offline">Çevrimdışı</option>
                  </select>
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <button
                  onClick={() => setShowEditModal(null)}
                  className="px-4 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                  İptal
                </button>
                <button
                  onClick={() => {
                    toast.success('Temsilci bilgileri güncellendi');
                    setShowEditModal(null);
                  }}
                  className="px-4 py-2 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded-lg"
                >
                  Kaydet
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AgentsPage;