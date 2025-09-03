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
  AlertCircle,
  ListTodo,
  TrendingUp,
  AlertTriangle
} from 'lucide-react';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';
import { useSupabase } from '../hooks/useSupabase';
import { toast } from 'react-hot-toast';
import FeedbackButton from './common/FeedbackButton';

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
  const [activeTab, setActiveTab] = useState('agents'); // 'agents' veya 'tasks'
  const [showNewAgentModal, setShowNewAgentModal] = useState(false);
  const [showActionMenu, setShowActionMenu] = useState<string | null>(null);
  const [showViewModal, setShowViewModal] = useState<string | null>(null);
  const [showEditModal, setShowEditModal] = useState<string | null>(null);
  const [newAgentData, setNewAgentData] = useState({
    name: '',
    email: '',
    role: 'agent',
    status: 'offline'
  });
  
  // Görev Listesi için state'ler
  const [feedbackTasks, setFeedbackTasks] = useState([]);
  const [loadingTasks, setLoadingTasks] = useState(false);
  const [taskFilter, setTaskFilter] = useState('all'); // 'all', 'high', 'medium', 'low'

  useEffect(() => {
    fetchAgents();
  }, []);

  useEffect(() => {
    if (activeTab === 'tasks') {
      fetchFeedbackTasks();
    }
  }, [activeTab]);

  // Görev listesi verilerini çek
  const fetchFeedbackTasks = async () => {
    setLoadingTasks(true);
    try {
      // Önce veritabanından geri bildirimleri çek
      const { data: feedbackData, error } = await supabase
        .from('feedback_requests')
        .select('*')
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Geri bildirimler çekilemedi:', error);
        return;
      }

      // Geri bildirimleri analiz et ve görev listesi oluştur
      const tasks = analyzeFeedbackData(feedbackData || []);
      setFeedbackTasks(tasks);
    } catch (error) {
      console.error('Görev listesi yüklenirken hata:', error);
    } finally {
      setLoadingTasks(false);
    }
  };

  // Geri bildirim verilerini analiz eden fonksiyon
  const analyzeFeedbackData = (feedbackData: any[]) => {
    const taskMap = new Map();
    
    feedbackData.forEach(feedback => {
      // Ana kategori belirle
      let category = 'Diğer';
      if (feedback.type === 'error') category = 'Hata';
      else if (feedback.type === 'feature') category = 'Özellik';
      else if (feedback.type === 'general') category = 'Genel';
      
      // Etiket bazlı alt kategori
      let subCategory = 'Genel';
      if (feedback.tags && feedback.tags.length > 0) {
        const priorityTags = ['Güvenlik', 'Hata', 'Ödeme', 'Performans'];
        for (const tag of priorityTags) {
          if (feedback.tags.includes(tag)) {
            subCategory = tag;
            break;
          }
        }
      }
      
      const key = `${category}:${subCategory}`;
      
      if (!taskMap.has(key)) {
        taskMap.set(key, {
          id: key,
          title: `${category}: ${subCategory}`,
          category,
          subCategory,
          feedbackCount: 0,
          totalEmotionalScore: 0,
          avgEmotionalScore: 0,
          priorityScore: 0,
          sampleSubjects: [],
          lastUpdated: new Date(),
          urgency: 'medium'
        });
      }
      
      const task = taskMap.get(key);
      task.feedbackCount++;
      task.totalEmotionalScore += feedback.emotional_impact_score || 5;
      task.avgEmotionalScore = Math.round(task.totalEmotionalScore / task.feedbackCount);
      
      // Öncelik skoru hesapla
      let priority = 0;
      if (feedback.type === 'error') priority += 3;
      else if (feedback.type === 'general') priority += 2;
      else priority += 1;
      
      if (feedback.page_source?.includes('payment') || feedback.page_source?.includes('ödeme')) priority += 2;
      if (feedback.page_source?.includes('login') || feedback.page_source?.includes('giriş')) priority += 2;
      
      if (feedback.tags?.includes('Güvenlik')) priority += 2;
      if (feedback.tags?.includes('Hata')) priority += 2;
      if (feedback.tags?.includes('Ödeme')) priority += 1;
      
      task.priorityScore += priority;
      
      // Örnek konular ekle
      if (task.sampleSubjects.length < 3 && feedback.subject) {
        task.sampleSubjects.push(feedback.subject);
      }
      
      // Son güncelleme tarihi
      const feedbackDate = new Date(feedback.created_at);
      if (feedbackDate > task.lastUpdated) {
        task.lastUpdated = feedbackDate;
      }
    });
    
    // Öncelik skoruna göre sırala ve aciliyet belirle
    const tasks = Array.from(taskMap.values()).map(task => {
      const avgPriority = task.priorityScore / task.feedbackCount;
      if (avgPriority >= 8) task.urgency = 'high';
      else if (avgPriority >= 5) task.urgency = 'medium';
      else task.urgency = 'low';
      
      return task;
    });
    
    return tasks.sort((a, b) => b.priorityScore - a.priorityScore);
  };

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

  const handleCreateAgent = async () => {
    if (!newAgentData.name.trim()) {
      toast.error('Temsilci adı gerekli');
      return;
    }
    if (!newAgentData.email.trim()) {
      toast.error('E-posta adresi gerekli');
      return;
    }
    
    try {
      // Burada Supabase create işlemi yapılacak
      toast.success('Yeni temsilci oluşturuldu');
      setShowNewAgentModal(false);
      setNewAgentData({
        name: '',
        email: '',
        role: 'agent',
        status: 'offline'
      });
      fetchAgents();
    } catch (error) {
      toast.error('Temsilci oluşturulurken hata oluştu');
    }
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
            {activeTab === 'agents' ? `${filteredAgents.length} temsilci bulundu` : 'Geri bildirim analizi ve görev listesi'}
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
          <FeedbackButton 
            pageSource="agents" 
            position="inline"
            className="inline-flex items-center px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-medium"
          />
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-gray-200 dark:border-gray-700">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('agents')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'agents'
                ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
            }`}
          >
            <div className="flex items-center gap-2">
              <User className="w-4 h-4" />
              Temsilciler
            </div>
          </button>
          <button
            onClick={() => setActiveTab('tasks')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'tasks'
                ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
            }`}
          >
            <div className="flex items-center gap-2">
              <ListTodo className="w-4 h-4" />
              Görev Listesi
            </div>
          </button>
        </nav>
      </div>

      {/* Filters - Only show for Agents tab */}
      {activeTab === 'agents' && (
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
                value={statusFilter}
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
      )}

      {/* Bulk Actions - Only show for Agents tab */}
      {activeTab === 'agents' && selectedItems.length > 0 && (
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

      {/* Agents Tab Content */}
      {activeTab === 'agents' && (
        <>
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
        </>
      )}

      {/* Görev Listesi Tab Content */}
      {activeTab === 'tasks' && (
        <>
          {/* Görev Listesi Header */}
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Öncelikli Yapılacaklar Listesi</h2>
                <p className="text-gray-600 dark:text-gray-400">
                  Müşteri geri bildirimleri analiz edilerek oluşturulan öncelikli görevler
                </p>
              </div>
              <div className="flex items-center gap-3">
                <select
                  value={taskFilter}
                  onChange={(e) => setTaskFilter(e.target.value)}
                  className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">Tüm Öncelikler</option>
                  <option value="high">Yüksek Öncelik</option>
                  <option value="medium">Orta Öncelik</option>
                  <option value="low">Düşük Öncelik</option>
                </select>
                <button
                  onClick={fetchFeedbackTasks}
                  disabled={loadingTasks}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium disabled:opacity-50"
                >
                  {loadingTasks ? 'Yenileniyor...' : 'Yenile'}
                </button>
              </div>
            </div>

            {/* İstatistikler */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                <div className="flex items-center">
                  <div className="w-10 h-10 bg-blue-100 dark:bg-blue-800 rounded-full flex items-center justify-center">
                    <AlertTriangle className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div className="ml-3">
                    <p className="text-sm font-medium text-blue-600 dark:text-blue-400">Toplam Görev</p>
                    <p className="text-2xl font-bold text-blue-900 dark:text-blue-100">{feedbackTasks.length}</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-lg">
                <div className="flex items-center">
                  <div className="w-10 h-10 bg-red-100 dark:bg-red-800 rounded-full flex items-center justify-center">
                    <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400" />
                  </div>
                  <div className="ml-3">
                    <p className="text-sm font-medium text-red-600 dark:text-red-400">Yüksek Öncelik</p>
                    <p className="text-2xl font-bold text-red-900 dark:text-red-100">
                      {feedbackTasks.filter(t => t.urgency === 'high').length}
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-lg">
                <div className="flex items-center">
                  <div className="w-10 h-10 bg-yellow-100 dark:bg-yellow-800 rounded-full flex items-center justify-center">
                    <Clock className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
                  </div>
                  <div className="ml-3">
                    <p className="text-sm font-medium text-yellow-600 dark:text-yellow-400">Orta Öncelik</p>
                    <p className="text-2xl font-bold text-yellow-900 dark:text-yellow-100">
                      {feedbackTasks.filter(t => t.urgency === 'medium').length}
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
                <div className="flex items-center">
                  <div className="w-10 h-10 bg-green-100 dark:bg-green-800 rounded-full flex items-center justify-center">
                    <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
                  </div>
                  <div className="ml-3">
                    <p className="text-sm font-medium text-green-600 dark:text-green-400">Düşük Öncelik</p>
                    <p className="text-2xl font-bold text-green-900 dark:text-green-100">
                      {feedbackTasks.filter(t => t.urgency === 'low').length}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Görev Listesi */}
            {loadingTasks ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <p className="text-gray-500 dark:text-gray-400">Görev listesi yükleniyor...</p>
              </div>
            ) : feedbackTasks.length === 0 ? (
              <div className="text-center py-12">
                <ListTodo className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">Henüz görev bulunmuyor</h3>
                <p className="text-gray-500 dark:text-gray-400">
                  Müşteri geri bildirimleri geldiğinde burada görünecek
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {feedbackTasks
                  .filter(task => taskFilter === 'all' || task.urgency === taskFilter)
                  .slice(0, 10) // İlk 10 görevi göster
                  .map((task, index) => (
                    <div
                      key={task.id}
                      className={`border rounded-lg p-4 transition-all hover:shadow-md ${
                        task.urgency === 'high'
                          ? 'border-red-200 bg-red-50 dark:bg-red-900/20 dark:border-red-800'
                          : task.urgency === 'medium'
                          ? 'border-yellow-200 bg-yellow-50 dark:bg-yellow-900/20 dark:border-yellow-800'
                          : 'border-green-200 bg-green-50 dark:bg-green-900/20 dark:border-green-800'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              task.urgency === 'high'
                                ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                                : task.urgency === 'medium'
                                ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
                                : 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                            }`}>
                              {task.urgency === 'high' ? '🔥 Yüksek' : task.urgency === 'medium' ? '⚡ Orta' : '✅ Düşük'}
                            </span>
                            <span className="text-sm text-gray-500 dark:text-gray-400">
                              #{index + 1}
                            </span>
                          </div>
                          
                          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                            {task.title}
                          </h3>
                          
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-3">
                            <div className="flex items-center gap-2">
                              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                              <span className="text-sm text-gray-600 dark:text-gray-400">
                                <strong>{task.feedbackCount}</strong> geri bildirim
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                              <span className="text-sm text-gray-600 dark:text-gray-400">
                                Ortalama etki: <strong>{task.avgEmotionalScore}/10</strong>
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                              <span className="text-sm text-gray-600 dark:text-gray-400">
                                Öncelik: <strong>{task.priorityScore}</strong>
                              </span>
                            </div>
                          </div>
                          
                          {task.sampleSubjects.length > 0 && (
                            <div className="mb-3">
                              <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                                Örnek konular:
                              </p>
                              <div className="flex flex-wrap gap-2">
                                {task.sampleSubjects.map((subject, idx) => (
                                  <span
                                    key={idx}
                                    className="inline-block px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-xs rounded"
                                  >
                                    {subject.length > 30 ? subject.substring(0, 30) + '...' : subject}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}
                          
                          <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
                            <span>
                              Son güncelleme: {format(task.lastUpdated, 'dd MMM yyyy HH:mm', { locale: tr })}
                            </span>
                            <span className="text-xs">
                              {task.category} • {task.subCategory}
                            </span>
                          </div>
                        </div>
                        
                        <div className="ml-4 flex flex-col items-end gap-2">
                          <div className={`w-16 h-16 rounded-full flex items-center justify-center text-white font-bold text-lg ${
                            task.urgency === 'high'
                              ? 'bg-red-500'
                              : task.urgency === 'medium'
                              ? 'bg-yellow-500'
                              : 'bg-green-500'
                          }`}>
                            {task.priorityScore}
                          </div>
                          <button className="px-3 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors">
                            Detay Gör
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </div>
        </>
      )}



      {/* New Agent Modal */}
      {showNewAgentModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 w-full max-w-2xl mx-4">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Yeni Temsilci Ekle</h3>
              <button
                onClick={() => setShowNewAgentModal(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                ✕
              </button>
            </div>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Ad Soyad *
                  </label>
                  <input
                    type="text"
                    value={newAgentData.name}
                    onChange={(e) => setNewAgentData({ ...newAgentData, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Temsilci adını girin..."
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    E-posta *
                  </label>
                  <input
                    type="email"
                    value={newAgentData.email}
                    onChange={(e) => setNewAgentData({ ...newAgentData, email: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="E-posta adresini girin..."
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Rol
                  </label>
                  <select
                    value={newAgentData.role}
                    onChange={(e) => setNewAgentData({ ...newAgentData, role: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="agent">Temsilci</option>
                    <option value="supervisor">Süpervizör</option>
                    <option value="admin">Yönetici</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Başlangıç Durumu
                  </label>
                  <select
                    value={newAgentData.status}
                    onChange={(e) => setNewAgentData({ ...newAgentData, status: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="offline">Çevrimdışı</option>
                    <option value="online">Çevrimiçi</option>
                    <option value="away">Uzakta</option>
                    <option value="busy">Meşgul</option>
                  </select>
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <button
                  onClick={() => setShowNewAgentModal(false)}
                  className="px-4 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                  İptal
                </button>
                <button
                  onClick={handleCreateAgent}
                  className="px-4 py-2 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded-lg"
                >
                  Temsilci Ekle
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

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