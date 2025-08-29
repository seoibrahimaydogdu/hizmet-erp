import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { 
  Bell, 
  AlertTriangle, 
  CheckCircle, 
  XCircle, 
  Plus, 
  Edit, 
  Trash2, 
  Eye,
  Clock,
  Mail,
  MessageSquare,
  Activity,
  TrendingUp,
  TrendingDown,
  Zap
} from 'lucide-react';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';
import { toast } from 'react-hot-toast';

interface SmartAlert {
  id: string;
  alert_name: string;
  alert_type: 'threshold' | 'trend' | 'anomaly';
  metric_key: string;
  condition_config: any;
  severity: 'low' | 'medium' | 'high' | 'critical';
  recipients: any[];
  is_active: boolean;
  last_triggered_at: string | null;
  created_at: string;
  updated_at: string;
}

interface AlertHistory {
  id: string;
  alert_id: string;
  triggered_at: string;
  metric_value: any;
  message: string;
  sent_to: any[] | null;
  status: 'sent' | 'failed' | 'acknowledged';
  alert?: SmartAlert;
}

const SmartAlertManager: React.FC = () => {
  const [alerts, setAlerts] = useState<SmartAlert[]>([]);
  const [alertHistory, setAlertHistory] = useState<AlertHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [activeTab, setActiveTab] = useState<'alerts' | 'history'>('alerts');

  // Yeni uyarı formu
  const [newAlert, setNewAlert] = useState({
    alert_name: '',
    alert_type: 'threshold' as const,
    metric_key: 'tickets_open',
    operator: '>',
    value: '',
    severity: 'medium' as const,
    recipients: [] as any[]
  });

  useEffect(() => {
    loadAlerts();
    loadAlertHistory();
  }, []);

  const loadAlerts = async () => {
    try {
      const { data, error } = await supabase
        .from('smart_alerts')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setAlerts(data || []);
    } catch (error) {
      console.error('Uyarılar yüklenirken hata:', error);
      toast.error('Uyarılar yüklenemedi');
    } finally {
      setLoading(false);
    }
  };

  const loadAlertHistory = async () => {
    try {
      const { data, error } = await supabase
        .from('alert_history')
        .select(`
          *,
          smart_alerts(*)
        `)
        .order('triggered_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      setAlertHistory(data || []);
    } catch (error) {
      console.error('Uyarı geçmişi yüklenirken hata:', error);
    }
  };

  const createAlert = async () => {
    try {
      const conditionConfig = {
        operator: newAlert.operator,
        value: parseFloat(newAlert.value),
        duration: '1_hour'
      };

      const { data, error } = await supabase
        .from('smart_alerts')
        .insert({
          alert_name: newAlert.alert_name,
          alert_type: newAlert.alert_type,
          metric_key: newAlert.metric_key,
          condition_config: conditionConfig,
          severity: newAlert.severity,
          recipients: newAlert.recipients
        })
        .select()
        .single();

      if (error) throw error;

      toast.success('Uyarı başarıyla oluşturuldu');
      setShowCreateModal(false);
      setNewAlert({
        alert_name: '',
        alert_type: 'threshold',
        metric_key: 'tickets_open',
        operator: '>',
        value: '',
        severity: 'medium',
        recipients: []
      });
      loadAlerts();
    } catch (error) {
      console.error('Uyarı oluşturulurken hata:', error);
      toast.error('Uyarı oluşturulamadı');
    }
  };

  const toggleAlertStatus = async (alertId: string, isActive: boolean) => {
    try {
      const { error } = await supabase
        .from('smart_alerts')
        .update({ is_active: !isActive })
        .eq('id', alertId);

      if (error) throw error;

      toast.success(`Uyarı ${!isActive ? 'aktifleştirildi' : 'duraklatıldı'}`);
      loadAlerts();
    } catch (error) {
      console.error('Uyarı durumu güncellenirken hata:', error);
      toast.error('Uyarı durumu güncellenemedi');
    }
  };

  const deleteAlert = async (alertId: string) => {
    if (!confirm('Bu uyarıyı silmek istediğinizden emin misiniz?')) return;

    try {
      const { error } = await supabase
        .from('smart_alerts')
        .delete()
        .eq('id', alertId);

      if (error) throw error;

      toast.success('Uyarı başarıyla silindi');
      loadAlerts();
    } catch (error) {
      console.error('Uyarı silinirken hata:', error);
      toast.error('Uyarı silinemedi');
    }
  };

  const testAlert = async (alertId: string) => {
    try {
      const { data, error } = await supabase.rpc('check_smart_alerts');
      if (error) throw error;

      toast.success('Uyarı test edildi');
      loadAlertHistory();
    } catch (error) {
      console.error('Uyarı test edilirken hata:', error);
      toast.error('Uyarı test edilemedi');
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'high':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'critical':
        return <AlertTriangle className="w-4 h-4 text-red-500" />;
      case 'high':
        return <AlertTriangle className="w-4 h-4 text-orange-500" />;
      case 'medium':
        return <Bell className="w-4 h-4 text-yellow-500" />;
      case 'low':
        return <Bell className="w-4 h-4 text-blue-500" />;
      default:
        return <Bell className="w-4 h-4 text-gray-500" />;
    }
  };

  const getAlertTypeIcon = (type: string) => {
    switch (type) {
      case 'threshold':
        return <Activity className="w-4 h-4" />;
      case 'trend':
        return <TrendingUp className="w-4 h-4" />;
      case 'anomaly':
        return <Zap className="w-4 h-4" />;
      default:
        return <Bell className="w-4 h-4" />;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'sent':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'failed':
        return <XCircle className="w-4 h-4 text-red-500" />;
      case 'acknowledged':
        return <Eye className="w-4 h-4 text-blue-500" />;
      default:
        return <Clock className="w-4 h-4 text-gray-500" />;
    }
  };

  const getMetricDisplayName = (key: string) => {
    const metricNames: { [key: string]: string } = {
      'tickets_open': 'Açık Talepler',
      'tickets_resolved_today': 'Bugün Çözülen',
      'avg_resolution_time_hours': 'Ort. Çözüm Süresi',
      'total_revenue_today': 'Bugünkü Gelir',
      'customer_satisfaction_avg': 'Müşteri Memnuniyeti',
      'sla_breach_risk': 'SLA İhlali Riski'
    };
    return metricNames[key] || key;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Akıllı Uyarı Yöneticisi</h2>
          <p className="text-gray-600 mt-1">Kritik metrikler için otomatik uyarıları yönetin</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Yeni Uyarı
        </button>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('alerts')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'alerts'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Aktif Uyarılar
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'history'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Uyarı Geçmişi
          </button>
        </nav>
      </div>

      {/* Alerts Tab */}
      {activeTab === 'alerts' && (
        <div className="space-y-4">
          {alerts.length === 0 ? (
            <div className="text-center py-12">
              <Bell className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Henüz uyarı yok</h3>
              <p className="text-gray-600 mb-4">İlk akıllı uyarınızı oluşturmak için yukarıdaki butonu kullanın.</p>
            </div>
          ) : (
            <div className="grid gap-4">
              {alerts.map((alert) => (
                <div key={alert.id} className="bg-white rounded-lg border border-gray-200 p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className={`p-2 rounded-lg ${
                        alert.is_active ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-600'
                      }`}>
                        {getAlertTypeIcon(alert.alert_type)}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-lg font-semibold text-gray-900">{alert.alert_name}</h3>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getSeverityColor(alert.severity)}`}>
                            {alert.severity.toUpperCase()}
                          </span>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-gray-600 mt-1">
                          <span>{getMetricDisplayName(alert.metric_key)}</span>
                          <span>•</span>
                          <span>{alert.condition_config.operator} {alert.condition_config.value}</span>
                          {alert.last_triggered_at && (
                            <>
                              <span>•</span>
                              <span>Son: {format(new Date(alert.last_triggered_at), 'dd MMM HH:mm', { locale: tr })}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => testAlert(alert.id)}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="Test et"
                      >
                        <Zap className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => toggleAlertStatus(alert.id, alert.is_active)}
                        className={`p-2 rounded-lg transition-colors ${
                          alert.is_active 
                            ? 'text-orange-600 hover:bg-orange-50' 
                            : 'text-green-600 hover:bg-green-50'
                        }`}
                        title={alert.is_active ? 'Duraklat' : 'Aktifleştir'}
                      >
                        {alert.is_active ? <XCircle className="w-4 h-4" /> : <CheckCircle className="w-4 h-4" />}
                      </button>
                      <button
                        onClick={() => deleteAlert(alert.id)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Sil"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  
                  {/* Recipients */}
                  <div className="mt-4 pt-4 border-t border-gray-100">
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Mail className="w-4 h-4" />
                      <span>Alıcılar:</span>
                      {alert.recipients.map((recipient, index) => (
                        <span key={index} className="bg-gray-100 px-2 py-1 rounded text-xs">
                          {recipient.value}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* History Tab */}
      {activeTab === 'history' && (
        <div className="space-y-4">
          {alertHistory.length === 0 ? (
            <div className="text-center py-12">
              <Clock className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Henüz uyarı geçmişi yok</h3>
              <p className="text-gray-600">Akıllı uyarılar tetiklendiğinde burada görünecek.</p>
            </div>
          ) : (
            <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Uyarı
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Tetiklenme
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Değer
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Durum
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {alertHistory.map((history) => (
                    <tr key={history.id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {history.alert?.alert_name || 'Bilinmeyen Uyarı'}
                        </div>
                        <div className="text-sm text-gray-500">
                          {getMetricDisplayName(history.alert?.metric_key || '')}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {format(new Date(history.triggered_at), 'dd MMM yyyy HH:mm', { locale: tr })}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {history.metric_value?.value || 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          {getStatusIcon(history.status)}
                          <span className="text-sm text-gray-900 capitalize">{history.status}</span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Create Alert Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Yeni Akıllı Uyarı</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Uyarı Adı
                </label>
                <input
                  type="text"
                  value={newAlert.alert_name}
                  onChange={(e) => setNewAlert({ ...newAlert, alert_name: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Yüksek Talep Yoğunluğu"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Metrik
                </label>
                <select
                  value={newAlert.metric_key}
                  onChange={(e) => setNewAlert({ ...newAlert, metric_key: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="tickets_open">Açık Talepler</option>
                  <option value="tickets_resolved_today">Bugün Çözülen</option>
                  <option value="avg_resolution_time_hours">Ort. Çözüm Süresi</option>
                  <option value="total_revenue_today">Bugünkü Gelir</option>
                  <option value="customer_satisfaction_avg">Müşteri Memnuniyeti</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Operatör
                  </label>
                  <select
                    value={newAlert.operator}
                    onChange={(e) => setNewAlert({ ...newAlert, operator: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value=">">Büyük</option>
                    <option value="<">Küçük</option>
                    <option value=">=">Büyük Eşit</option>
                    <option value="<=">Küçük Eşit</option>
                    <option value="=">Eşit</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Değer
                  </label>
                  <input
                    type="number"
                    value={newAlert.value}
                    onChange={(e) => setNewAlert({ ...newAlert, value: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="50"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Önem Seviyesi
                </label>
                <select
                  value={newAlert.severity}
                  onChange={(e) => setNewAlert({ ...newAlert, severity: e.target.value as any })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="low">Düşük</option>
                  <option value="medium">Orta</option>
                  <option value="high">Yüksek</option>
                  <option value="critical">Kritik</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  E-posta Alıcıları
                </label>
                <input
                  type="text"
                  placeholder="admin@example.com, manager@example.com"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  onBlur={(e) => {
                    const emails = e.target.value.split(',').map(email => email.trim()).filter(email => email);
                    setNewAlert({
                      ...newAlert,
                      recipients: emails.map(email => ({ type: 'email', value: email }))
                    });
                  }}
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => setShowCreateModal(false)}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                İptal
              </button>
              <button
                onClick={createAlert}
                disabled={!newAlert.alert_name || !newAlert.value}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
              >
                Oluştur
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SmartAlertManager;
