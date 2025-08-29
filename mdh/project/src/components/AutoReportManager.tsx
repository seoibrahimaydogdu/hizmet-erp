import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { 
  Calendar, 
  Clock, 
  Mail, 
  Download, 
  Play, 
  Pause, 
  Edit, 
  Trash2, 
  Plus,
  AlertCircle,
  CheckCircle,
  XCircle,
  Settings,
  FileText,
  BarChart3,
  TrendingUp
} from 'lucide-react';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';
import { toast } from 'react-hot-toast';

interface AutoReport {
  id: string;
  report_type: 'daily' | 'weekly' | 'monthly' | 'custom';
  report_name: string;
  report_config: any;
  schedule_config: any;
  recipients: any[];
  is_active: boolean;
  last_generated_at: string | null;
  next_generation_at: string | null;
  created_at: string;
  updated_at: string;
}

interface ReportHistory {
  id: string;
  report_id: string;
  generated_at: string;
  report_data: any;
  file_path: string | null;
  sent_to: any[] | null;
  status: 'generated' | 'sent' | 'failed';
  error_message: string | null;
}

const AutoReportManager: React.FC = () => {
  const [reports, setReports] = useState<AutoReport[]>([]);
  const [reportHistory, setReportHistory] = useState<ReportHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedReport, setSelectedReport] = useState<AutoReport | null>(null);
  const [activeTab, setActiveTab] = useState<'reports' | 'history'>('reports');

  // Yeni rapor formu
  const [newReport, setNewReport] = useState({
    report_type: 'daily' as const,
    report_name: '',
    metrics: [] as string[],
    charts: [] as string[],
    frequency: 'daily' as const,
    time: '09:00',
    recipients: [] as any[]
  });

  useEffect(() => {
    loadReports();
    loadReportHistory();
  }, []);

  const loadReports = async () => {
    try {
      const { data, error } = await supabase
        .from('auto_reports')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setReports(data || []);
    } catch (error) {
      console.error('Raporlar yüklenirken hata:', error);
      toast.error('Raporlar yüklenemedi');
    } finally {
      setLoading(false);
    }
  };

  const loadReportHistory = async () => {
    try {
      const { data, error } = await supabase
        .from('report_history')
        .select(`
          *,
          auto_reports(report_name, report_type)
        `)
        .order('generated_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      setReportHistory(data || []);
    } catch (error) {
      console.error('Rapor geçmişi yüklenirken hata:', error);
    }
  };

  const createReport = async () => {
    try {
      const reportConfig = {
        metrics: newReport.metrics,
        charts: newReport.charts,
        filters: { date_range: `last_${newReport.report_type === 'daily' ? '24_hours' : newReport.report_type === 'weekly' ? '7_days' : '30_days'}` }
      };

      const scheduleConfig = {
        frequency: newReport.frequency,
        time: newReport.time,
        timezone: 'Europe/Istanbul'
      };

      const { data, error } = await supabase
        .from('auto_reports')
        .insert({
          report_type: newReport.report_type,
          report_name: newReport.report_name,
          report_config: reportConfig,
          schedule_config: scheduleConfig,
          recipients: newReport.recipients
        })
        .select()
        .single();

      if (error) throw error;

      toast.success('Rapor başarıyla oluşturuldu');
      setShowCreateModal(false);
      setNewReport({
        report_type: 'daily',
        report_name: '',
        metrics: [],
        charts: [],
        frequency: 'daily',
        time: '09:00',
        recipients: []
      });
      loadReports();
    } catch (error) {
      console.error('Rapor oluşturulurken hata:', error);
      toast.error('Rapor oluşturulamadı');
    }
  };

  const toggleReportStatus = async (reportId: string, isActive: boolean) => {
    try {
      const { error } = await supabase
        .from('auto_reports')
        .update({ is_active: !isActive })
        .eq('id', reportId);

      if (error) throw error;

      toast.success(`Rapor ${!isActive ? 'aktifleştirildi' : 'duraklatıldı'}`);
      loadReports();
    } catch (error) {
      console.error('Rapor durumu güncellenirken hata:', error);
      toast.error('Rapor durumu güncellenemedi');
    }
  };

  const generateReportNow = async (reportId: string) => {
    try {
      const { data, error } = await supabase.rpc('generate_auto_report', {
        p_report_id: reportId
      });

      if (error) throw error;

      toast.success('Rapor başarıyla oluşturuldu');
      loadReports();
      loadReportHistory();
    } catch (error) {
      console.error('Rapor oluşturulurken hata:', error);
      toast.error('Rapor oluşturulamadı');
    }
  };

  const deleteReport = async (reportId: string) => {
    if (!confirm('Bu raporu silmek istediğinizden emin misiniz?')) return;

    try {
      const { error } = await supabase
        .from('auto_reports')
        .delete()
        .eq('id', reportId);

      if (error) throw error;

      toast.success('Rapor başarıyla silindi');
      loadReports();
    } catch (error) {
      console.error('Rapor silinirken hata:', error);
      toast.error('Rapor silinemedi');
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'generated':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'sent':
        return <Mail className="w-4 h-4 text-blue-500" />;
      case 'failed':
        return <XCircle className="w-4 h-4 text-red-500" />;
      default:
        return <AlertCircle className="w-4 h-4 text-gray-500" />;
    }
  };

  const getReportTypeIcon = (type: string) => {
    switch (type) {
      case 'daily':
        return <Calendar className="w-4 h-4" />;
      case 'weekly':
        return <BarChart3 className="w-4 h-4" />;
      case 'monthly':
        return <TrendingUp className="w-4 h-4" />;
      default:
        return <FileText className="w-4 h-4" />;
    }
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
          <h2 className="text-2xl font-bold text-gray-900">Otomatik Rapor Yöneticisi</h2>
          <p className="text-gray-600 mt-1">Otomatik raporları yönetin ve zamanlayın</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Yeni Rapor
        </button>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('reports')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'reports'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Aktif Raporlar
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'history'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Rapor Geçmişi
          </button>
        </nav>
      </div>

      {/* Reports Tab */}
      {activeTab === 'reports' && (
        <div className="space-y-4">
          {reports.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Henüz rapor yok</h3>
              <p className="text-gray-600 mb-4">İlk otomatik raporunuzu oluşturmak için yukarıdaki butonu kullanın.</p>
            </div>
          ) : (
            <div className="grid gap-4">
              {reports.map((report) => (
                <div key={report.id} className="bg-white rounded-lg border border-gray-200 p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className={`p-2 rounded-lg ${
                        report.is_active ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-600'
                      }`}>
                        {getReportTypeIcon(report.report_type)}
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">{report.report_name}</h3>
                        <div className="flex items-center gap-4 text-sm text-gray-600 mt-1">
                          <span className="capitalize">{report.report_type}</span>
                          <span>•</span>
                          <span>{report.schedule_config.time}</span>
                          {report.last_generated_at && (
                            <>
                              <span>•</span>
                              <span>Son: {format(new Date(report.last_generated_at), 'dd MMM HH:mm', { locale: tr })}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => generateReportNow(report.id)}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="Şimdi oluştur"
                      >
                        <Play className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => toggleReportStatus(report.id, report.is_active)}
                        className={`p-2 rounded-lg transition-colors ${
                          report.is_active 
                            ? 'text-orange-600 hover:bg-orange-50' 
                            : 'text-green-600 hover:bg-green-50'
                        }`}
                        title={report.is_active ? 'Duraklat' : 'Aktifleştir'}
                      >
                        {report.is_active ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                      </button>
                      <button
                        onClick={() => {
                          setSelectedReport(report);
                          setShowEditModal(true);
                        }}
                        className="p-2 text-gray-600 hover:bg-gray-50 rounded-lg transition-colors"
                        title="Düzenle"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => deleteReport(report.id)}
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
                      {report.recipients.map((recipient, index) => (
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
          {reportHistory.length === 0 ? (
            <div className="text-center py-12">
              <Clock className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Henüz rapor geçmişi yok</h3>
              <p className="text-gray-600">Otomatik raporlar oluşturulduğunda burada görünecek.</p>
            </div>
          ) : (
            <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Rapor
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Oluşturulma
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Durum
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      İşlemler
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {reportHistory.map((history) => (
                    <tr key={history.id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {history.report_data?.report_name || 'Bilinmeyen Rapor'}
                        </div>
                        <div className="text-sm text-gray-500">
                          {history.report_data?.period || 'Özel'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {format(new Date(history.generated_at), 'dd MMM yyyy HH:mm', { locale: tr })}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          {getStatusIcon(history.status)}
                          <span className="text-sm text-gray-900 capitalize">{history.status}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <button
                          onClick={() => {
                            // Rapor verilerini indir
                            const dataStr = JSON.stringify(history.report_data, null, 2);
                            const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
                            const linkElement = document.createElement('a');
                            linkElement.setAttribute('href', dataUri);
                            linkElement.setAttribute('download', `rapor-${history.id}.json`);
                            linkElement.click();
                          }}
                          className="text-blue-600 hover:text-blue-900 flex items-center gap-1"
                        >
                          <Download className="w-4 h-4" />
                          İndir
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Create Report Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Yeni Otomatik Rapor</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Rapor Adı
                </label>
                <input
                  type="text"
                  value={newReport.report_name}
                  onChange={(e) => setNewReport({ ...newReport, report_name: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Günlük Performans Raporu"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Rapor Türü
                </label>
                <select
                  value={newReport.report_type}
                  onChange={(e) => setNewReport({ ...newReport, report_type: e.target.value as any })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="daily">Günlük</option>
                  <option value="weekly">Haftalık</option>
                  <option value="monthly">Aylık</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Zaman
                </label>
                <input
                  type="time"
                  value={newReport.time}
                  onChange={(e) => setNewReport({ ...newReport, time: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
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
                    setNewReport({
                      ...newReport,
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
                onClick={createReport}
                disabled={!newReport.report_name}
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

export default AutoReportManager;
