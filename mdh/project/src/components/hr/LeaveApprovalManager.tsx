import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { 
  CheckCircle, 
  XCircle, 
  Clock, 
  User, 
  Calendar, 
  MessageSquare,
  AlertCircle,
  Eye,
  Check,
  X
} from 'lucide-react';

interface PendingLeaveApproval {
  id: string;
  leave_request_id: string;
  employee_id: string;
  manager_id: string;
  request_date: string;
  status: 'pending' | 'approved' | 'rejected';
  manager_notes?: string;
  approval_date?: string;
  employee: {
    name: string;
    email: string;
    department: string;
    position: string;
  };
  leave_request: {
    start_date: string;
    end_date: string;
    leave_type: string;
    reason: string;
    days_requested: number;
  };
}

interface Notification {
  id: string;
  title: string;
  message: string;
  type: string;
  is_read: boolean;
  created_at: string;
  sender?: {
    name: string;
  };
}

const LeaveApprovalManager: React.FC = () => {
  const [pendingApprovals, setPendingApprovals] = useState<PendingLeaveApproval[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedApproval, setSelectedApproval] = useState<PendingLeaveApproval | null>(null);
  const [showApprovalModal, setShowApprovalModal] = useState(false);
  const [approvalNotes, setApprovalNotes] = useState('');
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    fetchPendingApprovals();
    fetchNotifications();
  }, []);

  const fetchPendingApprovals = async () => {
    try {
      const { data, error } = await supabase
        .from('pending_leave_approvals')
        .select(`
          *,
          employee:employees!pending_leave_approvals_employee_id_fkey(
            name,
            email,
            department,
            position
          ),
          leave_request:leave_requests!pending_leave_approvals_leave_request_id_fkey(
            start_date,
            end_date,
            leave_type,
            reason,
            days_requested
          )
        `)
        .eq('status', 'pending')
        .order('request_date', { ascending: false });

      if (error) throw error;
      setPendingApprovals(data || []);
    } catch (error) {
      console.error('Onay bekleyen izinler yüklenirken hata:', error);
    }
  };

  const fetchNotifications = async () => {
    try {
      const { data, error } = await supabase
        .from('notifications')
        .select(`
          *,
          sender:employees!notifications_sender_id_fkey(name)
        `)
        .eq('type', 'leave_request')
        .eq('is_read', false)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setNotifications(data || []);
    } catch (error) {
      console.error('Bildirimler yüklenirken hata:', error);
    }
  };

  const handleApproval = async (approvalId: string, status: 'approved' | 'rejected') => {
    setProcessing(true);
    try {
      const { error } = await supabase
        .from('pending_leave_approvals')
        .update({
          status,
          manager_notes: approvalNotes,
          approval_date: new Date().toISOString()
        })
        .eq('id', approvalId);

      if (error) throw error;

      // Bildirimleri okundu olarak işaretle
      await supabase
        .from('notifications')
        .update({ is_read: true, read_at: new Date().toISOString() })
        .eq('type', 'leave_request')
        .eq('is_read', false);

      setShowApprovalModal(false);
      setSelectedApproval(null);
      setApprovalNotes('');
      fetchPendingApprovals();
      fetchNotifications();
    } catch (error) {
      console.error('İzin onaylanırken hata:', error);
    } finally {
      setProcessing(false);
    }
  };

  const markNotificationAsRead = async (notificationId: string) => {
    try {
      await supabase
        .from('notifications')
        .update({ is_read: true, read_at: new Date().toISOString() })
        .eq('id', notificationId);

      fetchNotifications();
    } catch (error) {
      console.error('Bildirim okundu olarak işaretlenirken hata:', error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'rejected': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      default: return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'approved': return 'Onaylandı';
      case 'rejected': return 'Reddedildi';
      default: return 'Onay Bekliyor';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('tr-TR');
  };

  return (
    <div className="space-y-6">
      {/* Bildirimler */}
      {notifications.length > 0 && (
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <AlertCircle className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-100">
                Yeni İzin Talepleri ({notifications.length})
              </h3>
            </div>
            <button
              onClick={() => {
                notifications.forEach(n => markNotificationAsRead(n.id));
              }}
              className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 text-sm"
            >
              Tümünü Okundu İşaretle
            </button>
          </div>
          <div className="mt-3 space-y-2">
            {notifications.slice(0, 3).map((notification) => (
              <div key={notification.id} className="flex items-center justify-between p-2 bg-white dark:bg-gray-800 rounded border">
                <div className="flex items-center space-x-2">
                  <MessageSquare className="w-4 h-4 text-blue-500" />
                  <span className="text-sm text-gray-700 dark:text-gray-300">
                    {notification.message}
                  </span>
                </div>
                <button
                  onClick={() => markNotificationAsRead(notification.id)}
                  className="text-xs text-blue-600 hover:text-blue-800"
                >
                  Okundu
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* İstatistikler */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Onay Bekleyen</p>
              <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
                {pendingApprovals.filter(a => a.status === 'pending').length}
              </p>
            </div>
            <div className="p-2 bg-yellow-500 rounded-lg">
              <Clock className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>
        
        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Bu Ay Onaylanan</p>
              <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                {pendingApprovals.filter(a => 
                  a.status === 'approved' && 
                  new Date(a.approval_date || '').getMonth() === new Date().getMonth()
                ).length}
              </p>
            </div>
            <div className="p-2 bg-green-500 rounded-lg">
              <CheckCircle className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>
        
        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Bu Ay Reddedilen</p>
              <p className="text-2xl font-bold text-red-600 dark:text-red-400">
                {pendingApprovals.filter(a => 
                  a.status === 'rejected' && 
                  new Date(a.approval_date || '').getMonth() === new Date().getMonth()
                ).length}
              </p>
            </div>
            <div className="p-2 bg-red-500 rounded-lg">
              <XCircle className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>
      </div>

      {/* Onay Bekleyen İzinler Listesi */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
            <Clock className="w-5 h-5 mr-2 text-yellow-500" />
            Onay Bekleyen İzinler
          </h3>
        </div>
        
        {pendingApprovals.length === 0 ? (
          <div className="p-8 text-center">
            <CheckCircle className="w-12 h-12 text-green-400 mx-auto mb-4" />
            <p className="text-gray-500 dark:text-gray-400">Onay bekleyen izin talebi bulunmamaktadır</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Çalışan
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    İzin Detayları
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Talep Tarihi
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Durum
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    İşlemler
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {pendingApprovals.map((approval) => (
                  <tr key={approval.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10">
                          <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-semibold">
                            {approval.employee.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                          </div>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900 dark:text-white">
                            {approval.employee.name}
                          </div>
                          <div className="text-sm text-gray-500 dark:text-gray-400">
                            {approval.employee.department} • {approval.employee.position}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900 dark:text-white">
                        {approval.leave_request.leave_type}
                      </div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        {formatDate(approval.leave_request.start_date)} - {formatDate(approval.leave_request.end_date)}
                      </div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        {approval.leave_request.days_requested} gün • {approval.leave_request.reason}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900 dark:text-white">
                        {formatDate(approval.request_date)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(approval.status)}`}>
                        {getStatusLabel(approval.status)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => {
                            setSelectedApproval(approval);
                            setShowApprovalModal(true);
                          }}
                          className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300"
                          title="Detayları Görüntüle"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        {approval.status === 'pending' && (
                          <>
                            <button
                              onClick={() => handleApproval(approval.id, 'approved')}
                              className="text-green-600 hover:text-green-900 dark:text-green-400 dark:hover:text-green-300"
                              title="Onayla"
                            >
                              <Check className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => {
                                setSelectedApproval(approval);
                                setShowApprovalModal(true);
                              }}
                              className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                              title="Reddet"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Onay/Red Modal */}
      {showApprovalModal && selectedApproval && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              İzin Talebi Onay/Red
            </h3>
            
            <div className="space-y-4 mb-6">
              <div>
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Çalışan:</p>
                <p className="text-sm text-gray-900 dark:text-white">{selectedApproval.employee.name}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300">İzin Türü:</p>
                <p className="text-sm text-gray-900 dark:text-white">{selectedApproval.leave_request.leave_type}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Tarih:</p>
                <p className="text-sm text-gray-900 dark:text-white">
                  {formatDate(selectedApproval.leave_request.start_date)} - {formatDate(selectedApproval.leave_request.end_date)}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Sebep:</p>
                <p className="text-sm text-gray-900 dark:text-white">{selectedApproval.leave_request.reason}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Not (Opsiyonel):
                </label>
                <textarea
                  value={approvalNotes}
                  onChange={(e) => setApprovalNotes(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  rows={3}
                  placeholder="Onay/red sebebinizi yazabilirsiniz..."
                />
              </div>
            </div>
            
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowApprovalModal(false)}
                className="px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600"
                disabled={processing}
              >
                İptal
              </button>
              <button
                onClick={() => handleApproval(selectedApproval.id, 'approved')}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center space-x-2"
                disabled={processing}
              >
                <Check className="w-4 h-4" />
                <span>Onayla</span>
              </button>
              <button
                onClick={() => handleApproval(selectedApproval.id, 'rejected')}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 flex items-center space-x-2"
                disabled={processing}
              >
                <X className="w-4 h-4" />
                <span>Reddet</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LeaveApprovalManager;
