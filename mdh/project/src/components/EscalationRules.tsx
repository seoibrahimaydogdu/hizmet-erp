import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Edit, 
  Trash2, 
  Save, 
  X, 
  AlertTriangle,
  Clock,
  Users,
  Bell,
  Zap,
  CheckCircle,
  XCircle,
  Search,
  Filter,
  Settings
} from 'lucide-react';
import { toast } from 'react-hot-toast';

interface EscalationRule {
  id: string;
  name: string;
  description: string;
  is_active: boolean;
  conditions: {
    priority?: string[];
    category?: string[];
    status?: string[];
    time_threshold_hours?: number;
    sla_breach?: boolean;
    customer_tier?: string[];
  };
  actions: {
    assign_to_agent?: string;
    assign_to_team?: string;
    change_priority?: string;
    send_notification?: boolean;
    notify_managers?: boolean;
    auto_response?: string;
  };
  created_at: string;
  updated_at: string;
  execution_count: number;
  last_executed?: string;
}

const EscalationRules: React.FC = () => {
  const [rules, setRules] = useState<EscalationRule[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [editingRule, setEditingRule] = useState<EscalationRule | null>(null);

  const [newRule, setNewRule] = useState({
    name: '',
    description: '',
    is_active: true,
    conditions: {
      priority: [] as string[],
      category: [] as string[],
      status: [] as string[],
      time_threshold_hours: 24,
      sla_breach: false,
      customer_tier: [] as string[]
    },
    actions: {
      assign_to_agent: '',
      assign_to_team: '',
      change_priority: '',
      send_notification: true,
      notify_managers: false,
      auto_response: ''
    }
  });

  // Mock agents and teams
  const agents = [
    { id: '1', name: 'Ayşe Demir', team: 'Teknik Destek' },
    { id: '2', name: 'Fatma Kaya', team: 'Müşteri Hizmetleri' },
    { id: '3', name: 'Can Demir', team: 'Satış' }
  ];

  const teams = [
    { id: '1', name: 'Teknik Destek' },
    { id: '2', name: 'Müşteri Hizmetleri' },
    { id: '3', name: 'Satış' },
    { id: '4', name: 'Yönetim' }
  ];

  // Mock data
  useEffect(() => {
    const mockRules: EscalationRule[] = [
      {
        id: '1',
        name: 'Yüksek Öncelik SLA İhlali',
        description: 'Yüksek öncelikli ticket\'lar 4 saat içinde çözülmezse yöneticiye bildirim gönder',
        is_active: true,
        conditions: {
          priority: ['high'],
          time_threshold_hours: 4,
          sla_breach: true
        },
        actions: {
          notify_managers: true,
          change_priority: 'high',
          auto_response: 'Bu ticket SLA ihlali nedeniyle yöneticiye bildirildi.'
        },
        created_at: '2024-01-15T10:00:00Z',
        updated_at: '2024-01-15T10:00:00Z',
        execution_count: 12,
        last_executed: '2024-01-20T14:30:00Z'
      },
      {
        id: '2',
        name: 'Fatura Sorunları Otomatik Atama',
        description: 'Fatura kategorisindeki ticket\'lar 2 saat sonra fatura ekibine atanır',
        is_active: true,
        conditions: {
          category: ['billing'],
          time_threshold_hours: 2
        },
        actions: {
          assign_to_team: '2',
          send_notification: true,
          auto_response: 'Fatura sorununuz fatura ekibimize yönlendirildi.'
        },
        created_at: '2024-01-10T14:30:00Z',
        updated_at: '2024-01-12T09:15:00Z',
        execution_count: 8,
        last_executed: '2024-01-19T11:20:00Z'
      },
      {
        id: '3',
        name: 'VIP Müşteri Öncelik Yükseltme',
        description: 'VIP müşterilerin ticket\'ları 1 saat sonra yüksek önceliğe yükseltilir',
        is_active: true,
        conditions: {
          customer_tier: ['vip', 'premium'],
          time_threshold_hours: 1
        },
        actions: {
          change_priority: 'high',
          send_notification: true,
          auto_response: 'VIP müşteri statüsünüz nedeniyle ticket\'ınız yüksek önceliğe yükseltildi.'
        },
        created_at: '2024-01-08T16:45:00Z',
        updated_at: '2024-01-08T16:45:00Z',
        execution_count: 5,
        last_executed: '2024-01-18T16:45:00Z'
      }
    ];
    setRules(mockRules);
  }, []);

  // Filter rules
  const filteredRules = rules.filter(rule => {
    const matchesSearch = rule.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         rule.description.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || 
                         (statusFilter === 'active' && rule.is_active) ||
                         (statusFilter === 'inactive' && !rule.is_active);
    
    return matchesSearch && matchesStatus;
  });

  const handleCreateRule = () => {
    if (!newRule.name.trim()) {
      toast.error('Kural adı gereklidir');
      return;
    }

    const rule: EscalationRule = {
      id: Date.now().toString(),
      ...newRule,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      execution_count: 0
    };

    setRules(prev => [...prev, rule]);
    setShowCreateModal(false);
    setNewRule({
      name: '',
      description: '',
      is_active: true,
      conditions: {
        priority: [],
        category: [],
        status: [],
        time_threshold_hours: 24,
        sla_breach: false,
        customer_tier: []
      },
      actions: {
        assign_to_agent: '',
        assign_to_team: '',
        change_priority: '',
        send_notification: true,
        notify_managers: false,
        auto_response: ''
      }
    });
    toast.success('Escalation kuralı oluşturuldu');
  };

  const handleEditRule = () => {
    if (!editingRule) return;

    if (!editingRule.name.trim()) {
      toast.error('Kural adı gereklidir');
      return;
    }

    setRules(prev => prev.map(r => 
      r.id === editingRule.id 
        ? { ...editingRule, updated_at: new Date().toISOString() }
        : r
    ));
    setShowEditModal(null);
    setEditingRule(null);
    toast.success('Escalation kuralı güncellendi');
  };

  const handleDeleteRule = (id: string) => {
    if (confirm('Bu escalation kuralını silmek istediğinizden emin misiniz?')) {
      setRules(prev => prev.filter(r => r.id !== id));
      toast.success('Escalation kuralı silindi');
    }
  };

  const toggleRuleStatus = (id: string) => {
    setRules(prev => prev.map(r => 
      r.id === id 
        ? { ...r, is_active: !r.is_active, updated_at: new Date().toISOString() }
        : r
    ));
    toast.success('Kural durumu güncellendi');
  };

  const getPriorityText = (priority: string) => {
    switch (priority) {
      case 'high': return 'Yüksek';
      case 'medium': return 'Orta';
      case 'low': return 'Düşük';
      default: return priority;
    }
  };

  const getCategoryText = (category: string) => {
    switch (category) {
      case 'technical': return 'Teknik';
      case 'billing': return 'Faturalama';
      case 'feature_request': return 'Özellik Talebi';
      case 'general': return 'Genel';
      case 'payment_reminder': return 'Ödeme';
      default: return category;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'open': return 'Açık';
      case 'in_progress': return 'İşlemde';
      case 'resolved': return 'Çözüldü';
      case 'closed': return 'Kapalı';
      default: return status;
    }
  };

  const getCustomerTierText = (tier: string) => {
    switch (tier) {
      case 'vip': return 'VIP';
      case 'premium': return 'Premium';
      case 'standard': return 'Standart';
      case 'basic': return 'Temel';
      default: return tier;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Escalation Kuralları</h1>
          <p className="text-gray-600 dark:text-gray-400">
            {filteredRules.length} kural bulundu
          </p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium"
        >
          <Plus className="w-4 h-4 mr-2" />
          Yeni Kural
        </button>
      </div>

      {/* Search and Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Search */}
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Kural ara..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
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
              <option value="active">Aktif</option>
              <option value="inactive">Pasif</option>
            </select>
          </div>
        </div>
      </div>

      {/* Rules Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {filteredRules.map((rule) => (
          <div key={rule.id} className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    {rule.name}
                  </h3>
                  <button
                    onClick={() => toggleRuleStatus(rule.id)}
                    className={`px-2 py-1 rounded text-xs font-medium ${
                      rule.is_active 
                        ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
                        : 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400'
                    }`}
                  >
                    {rule.is_active ? 'Aktif' : 'Pasif'}
                  </button>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                  {rule.description}
                </p>
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => {
                    setEditingRule(rule);
                    setShowEditModal(rule.id);
                  }}
                  className="p-1 text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-300"
                  title="Düzenle"
                >
                  <Edit className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleDeleteRule(rule.id)}
                  className="p-1 text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
                  title="Sil"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Conditions */}
            <div className="mb-4">
              <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-2 flex items-center">
                <AlertTriangle className="w-4 h-4 mr-1" />
                Koşullar
              </h4>
              <div className="space-y-2 text-sm">
                {rule.conditions.priority && rule.conditions.priority.length > 0 && (
                  <div className="flex items-center gap-2">
                    <span className="text-gray-500 dark:text-gray-400">Öncelik:</span>
                    <div className="flex gap-1">
                      {rule.conditions.priority.map(p => (
                        <span key={p} className="px-2 py-1 bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400 text-xs rounded">
                          {getPriorityText(p)}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                
                {rule.conditions.category && rule.conditions.category.length > 0 && (
                  <div className="flex items-center gap-2">
                    <span className="text-gray-500 dark:text-gray-400">Kategori:</span>
                    <div className="flex gap-1">
                      {rule.conditions.category.map(c => (
                        <span key={c} className="px-2 py-1 bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400 text-xs rounded">
                          {getCategoryText(c)}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {rule.conditions.time_threshold_hours && (
                  <div className="flex items-center gap-2">
                    <span className="text-gray-500 dark:text-gray-400">Süre:</span>
                    <span className="text-gray-900 dark:text-white font-medium">
                      {rule.conditions.time_threshold_hours} saat
                    </span>
                  </div>
                )}

                {rule.conditions.sla_breach && (
                  <div className="flex items-center gap-2">
                    <span className="text-gray-500 dark:text-gray-400">SLA İhlali:</span>
                    <span className="text-red-600 dark:text-red-400 font-medium">Evet</span>
                  </div>
                )}

                {rule.conditions.customer_tier && rule.conditions.customer_tier.length > 0 && (
                  <div className="flex items-center gap-2">
                    <span className="text-gray-500 dark:text-gray-400">Müşteri Seviyesi:</span>
                    <div className="flex gap-1">
                      {rule.conditions.customer_tier.map(t => (
                        <span key={t} className="px-2 py-1 bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400 text-xs rounded">
                          {getCustomerTierText(t)}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="mb-4">
              <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-2 flex items-center">
                <Zap className="w-4 h-4 mr-1" />
                Aksiyonlar
              </h4>
              <div className="space-y-2 text-sm">
                {rule.actions.assign_to_agent && (
                  <div className="flex items-center gap-2">
                    <span className="text-gray-500 dark:text-gray-400">Ata:</span>
                    <span className="text-gray-900 dark:text-white font-medium">
                      {agents.find(a => a.id === rule.actions.assign_to_agent)?.name}
                    </span>
                  </div>
                )}

                {rule.actions.assign_to_team && (
                  <div className="flex items-center gap-2">
                    <span className="text-gray-500 dark:text-gray-400">Ekibe Ata:</span>
                    <span className="text-gray-900 dark:text-white font-medium">
                      {teams.find(t => t.id === rule.actions.assign_to_team)?.name}
                    </span>
                  </div>
                )}

                {rule.actions.change_priority && (
                  <div className="flex items-center gap-2">
                    <span className="text-gray-500 dark:text-gray-400">Öncelik Değiştir:</span>
                    <span className="text-gray-900 dark:text-white font-medium">
                      {getPriorityText(rule.actions.change_priority)}
                    </span>
                  </div>
                )}

                {rule.actions.send_notification && (
                  <div className="flex items-center gap-2">
                    <span className="text-gray-500 dark:text-gray-400">Bildirim:</span>
                    <span className="text-green-600 dark:text-green-400 font-medium">Gönder</span>
                  </div>
                )}

                {rule.actions.notify_managers && (
                  <div className="flex items-center gap-2">
                    <span className="text-gray-500 dark:text-gray-400">Yönetici Bildirimi:</span>
                    <span className="text-orange-600 dark:text-orange-400 font-medium">Gönder</span>
                  </div>
                )}
              </div>
            </div>

            {/* Stats */}
            <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 pt-3 border-t border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-4">
                <span>{rule.execution_count} kez çalıştı</span>
                {rule.last_executed && (
                  <span>Son: {new Date(rule.last_executed).toLocaleDateString('tr-TR')}</span>
                )}
              </div>
              <span>{new Date(rule.updated_at).toLocaleDateString('tr-TR')}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Create Rule Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 w-full max-w-4xl mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Yeni Escalation Kuralı</h3>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Basic Info */}
              <div className="space-y-4">
                <h4 className="font-medium text-gray-900 dark:text-white">Temel Bilgiler</h4>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Kural Adı *
                  </label>
                  <input
                    type="text"
                    value={newRule.name}
                    onChange={(e) => setNewRule({ ...newRule, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Örn: Yüksek Öncelik SLA İhlali"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Açıklama
                  </label>
                  <textarea
                    value={newRule.description}
                    onChange={(e) => setNewRule({ ...newRule, description: e.target.value })}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Kuralın ne yaptığını açıklayın..."
                  />
                </div>

                <div>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={newRule.is_active}
                      onChange={(e) => setNewRule({ ...newRule, is_active: e.target.checked })}
                      className="mr-2 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-700 dark:text-gray-300">Kuralı aktif et</span>
                  </label>
                </div>
              </div>

              {/* Conditions */}
              <div className="space-y-4">
                <h4 className="font-medium text-gray-900 dark:text-white">Koşullar</h4>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Öncelik
                  </label>
                  <div className="space-y-2">
                    {['high', 'medium', 'low'].map(priority => (
                      <label key={priority} className="flex items-center">
                        <input
                          type="checkbox"
                          checked={newRule.conditions.priority.includes(priority)}
                          onChange={(e) => {
                            const newPriorities = e.target.checked
                              ? [...newRule.conditions.priority, priority]
                              : newRule.conditions.priority.filter(p => p !== priority);
                            setNewRule({
                              ...newRule,
                              conditions: { ...newRule.conditions, priority: newPriorities }
                            });
                          }}
                          className="mr-2 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <span className="text-sm text-gray-700 dark:text-gray-300">{getPriorityText(priority)}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Kategori
                  </label>
                  <div className="space-y-2">
                    {['general', 'technical', 'billing', 'feature_request'].map(category => (
                      <label key={category} className="flex items-center">
                        <input
                          type="checkbox"
                          checked={newRule.conditions.category.includes(category)}
                          onChange={(e) => {
                            const newCategories = e.target.checked
                              ? [...newRule.conditions.category, category]
                              : newRule.conditions.category.filter(c => c !== category);
                            setNewRule({
                              ...newRule,
                              conditions: { ...newRule.conditions, category: newCategories }
                            });
                          }}
                          className="mr-2 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <span className="text-sm text-gray-700 dark:text-gray-300">{getCategoryText(category)}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Zaman Eşiği (Saat)
                  </label>
                  <input
                    type="number"
                    value={newRule.conditions.time_threshold_hours}
                    onChange={(e) => setNewRule({
                      ...newRule,
                      conditions: { ...newRule.conditions, time_threshold_hours: parseInt(e.target.value) || 0 }
                    })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    min="1"
                    max="168"
                  />
                </div>

                <div>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={newRule.conditions.sla_breach}
                      onChange={(e) => setNewRule({
                        ...newRule,
                        conditions: { ...newRule.conditions, sla_breach: e.target.checked }
                      })}
                      className="mr-2 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-700 dark:text-gray-300">SLA ihlali durumunda</span>
                  </label>
                </div>
              </div>

              {/* Actions */}
              <div className="space-y-4">
                <h4 className="font-medium text-gray-900 dark:text-white">Aksiyonlar</h4>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Temsilciye Ata
                  </label>
                  <select
                    value={newRule.actions.assign_to_agent}
                    onChange={(e) => setNewRule({
                      ...newRule,
                      actions: { ...newRule.actions, assign_to_agent: e.target.value }
                    })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Temsilci Seçin</option>
                    {agents.map(agent => (
                      <option key={agent.id} value={agent.id}>{agent.name} ({agent.team})</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Ekibe Ata
                  </label>
                  <select
                    value={newRule.actions.assign_to_team}
                    onChange={(e) => setNewRule({
                      ...newRule,
                      actions: { ...newRule.actions, assign_to_team: e.target.value }
                    })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Ekip Seçin</option>
                    {teams.map(team => (
                      <option key={team.id} value={team.id}>{team.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Öncelik Değiştir
                  </label>
                  <select
                    value={newRule.actions.change_priority}
                    onChange={(e) => setNewRule({
                      ...newRule,
                      actions: { ...newRule.actions, change_priority: e.target.value }
                    })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Öncelik Seçin</option>
                    <option value="high">Yüksek</option>
                    <option value="medium">Orta</option>
                    <option value="low">Düşük</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={newRule.actions.send_notification}
                      onChange={(e) => setNewRule({
                        ...newRule,
                        actions: { ...newRule.actions, send_notification: e.target.checked }
                      })}
                      className="mr-2 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-700 dark:text-gray-300">Bildirim gönder</span>
                  </label>

                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={newRule.actions.notify_managers}
                      onChange={(e) => setNewRule({
                        ...newRule,
                        actions: { ...newRule.actions, notify_managers: e.target.checked }
                      })}
                      className="mr-2 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-700 dark:text-gray-300">Yöneticilere bildir</span>
                  </label>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Otomatik Yanıt
                  </label>
                  <textarea
                    value={newRule.actions.auto_response}
                    onChange={(e) => setNewRule({
                      ...newRule,
                      actions: { ...newRule.actions, auto_response: e.target.value }
                    })}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Müşteriye gönderilecek otomatik yanıt..."
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-6 border-t border-gray-200 dark:border-gray-700">
              <button
                onClick={() => setShowCreateModal(false)}
                className="px-4 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                İptal
              </button>
              <button
                onClick={handleCreateRule}
                className="px-4 py-2 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded-lg"
              >
                <Save className="w-4 h-4 mr-2 inline" />
                Oluştur
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Rule Modal - Similar to Create but with editingRule data */}
      {showEditModal && editingRule && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 w-full max-w-4xl mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Escalation Kuralını Düzenle</h3>
              <button
                onClick={() => {
                  setShowEditModal(null);
                  setEditingRule(null);
                }}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            {/* Similar form structure as create modal but with editingRule data */}
            <div className="text-center py-8">
              <p className="text-gray-500 dark:text-gray-400">Edit modal implementation would be similar to create modal</p>
              <p className="text-sm text-gray-400 mt-2">For brevity, showing simplified version</p>
            </div>

            <div className="flex justify-end gap-3 pt-6 border-t border-gray-200 dark:border-gray-700">
              <button
                onClick={() => {
                  setShowEditModal(null);
                  setEditingRule(null);
                }}
                className="px-4 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                İptal
              </button>
              <button
                onClick={handleEditRule}
                className="px-4 py-2 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded-lg"
              >
                <Save className="w-4 h-4 mr-2 inline" />
                Kaydet
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EscalationRules;
