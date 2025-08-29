import React, { useState } from 'react';
import { supabase } from '../../lib/supabase';
import { 
  Plus, 
  Search, 
  Filter, 
  Eye, 
  Edit, 
  Trash2, 
  Calendar,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  TrendingUp,
  Users,
  CalendarDays,
  BarChart3,
  PieChart,
  Zap,
  User,
  Mail,
  Phone,
  Building,
  Briefcase,
  Award,
  Star,
  Target,
  CheckSquare,
  X,
  ArrowLeft,
  ArrowRight
} from 'lucide-react';

interface LeaveRequest {
  id: string;
  employee_id: string;
  leave_type: string;
  start_date: string;
  end_date: string;
  reason: string;
  status: string;
  days_requested?: number;
  employee_name?: string;
  employee_email?: string;
  employee_department?: string;
}

interface LeaveRequestFormData {
  employee_id: string;
  leave_type: string;
  start_date: string;
  end_date: string;
  reason: string;
  status: string;
  days_requested: number;
}

interface LeaveManagementProps {
  leaveRequests: LeaveRequest[];
  employees: any[];
  onLeaveUpdate: () => void;
}

const LeaveManagement: React.FC<LeaveManagementProps> = ({ leaveRequests, employees, onLeaveUpdate }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [showAddLeaveRequest, setShowAddLeaveRequest] = useState(false);
  const [showEditLeaveRequest, setShowEditLeaveRequest] = useState(false);
  const [showViewLeaveRequest, setShowViewLeaveRequest] = useState(false);
  const [selectedLeaveRequest, setSelectedLeaveRequest] = useState<LeaveRequest | null>(null);
  const [leaveRequestFormData, setLeaveRequestFormData] = useState<LeaveRequestFormData>({
    employee_id: '',
    leave_type: '',
    start_date: '',
    end_date: '',
    reason: '',
    status: 'pending',
    days_requested: 0
  });

  const leaveTypes = ['annual', 'sick', 'personal', 'maternity', 'paternity'];
  const leaveStatuses = ['pending', 'approved', 'rejected'];

  const getLeaveTypeLabel = (type: string) => {
    switch (type) {
      case 'annual': return 'Yıllık İzin';
      case 'sick': return 'Hastalık İzni';
      case 'personal': return 'Kişisel İzin';
      case 'maternity': return 'Doğum İzni';
      case 'paternity': return 'Babalar İzni';
      default: return type;
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'pending': return 'Beklemede';
      case 'approved': return 'Onaylandı';
      case 'rejected': return 'Reddedildi';
      default: return status;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'approved': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'rejected': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  const calculateDays = (startDate: string, endDate: string) => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
    return diffDays;
  };

  const filteredLeaveRequests = leaveRequests.filter(request => {
    const employee = employees.find(emp => emp.id === request.employee_id);
    const matchesSearch = employee?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         employee?.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         getLeaveTypeLabel(request.leave_type).toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = !statusFilter || request.status === statusFilter;
    const matchesType = !typeFilter || request.leave_type === typeFilter;
    return matchesSearch && matchesStatus && matchesType;
  });

  const handleAddLeaveRequest = async () => {
    try {
      const days = calculateDays(leaveRequestFormData.start_date, leaveRequestFormData.end_date);
      const { error } = await supabase
        .from('leave_requests')
        .insert([{ ...leaveRequestFormData, days_requested: days }]);

      if (error) throw error;

      setShowAddLeaveRequest(false);
      setLeaveRequestFormData({
        employee_id: '',
        leave_type: '',
        start_date: '',
        end_date: '',
        reason: '',
        status: 'pending',
        days_requested: 0
      });
      onLeaveUpdate();
    } catch (error) {
      console.error('İzin talebi eklenirken hata:', error);
    }
  };

  const handleEditLeaveRequest = async () => {
    if (!selectedLeaveRequest) return;

    try {
      const days = calculateDays(leaveRequestFormData.start_date, leaveRequestFormData.end_date);
      const { error } = await supabase
        .from('leave_requests')
        .update({ ...leaveRequestFormData, days_requested: days })
        .eq('id', selectedLeaveRequest.id);

      if (error) throw error;

      setShowEditLeaveRequest(false);
      setSelectedLeaveRequest(null);
      onLeaveUpdate();
    } catch (error) {
      console.error('İzin talebi güncellenirken hata:', error);
    }
  };

  const handleDeleteLeaveRequest = async (id: string) => {
    if (!confirm('Bu izin talebini silmek istediğinizden emin misiniz?')) return;

    try {
      const { error } = await supabase
        .from('leave_requests')
        .delete()
        .eq('id', id);

      if (error) throw error;
      onLeaveUpdate();
    } catch (error) {
      console.error('İzin talebi silinirken hata:', error);
    }
  };

  const handleApproveLeaveRequest = async (id: string) => {
    try {
      const { error } = await supabase
        .from('leave_requests')
        .update({ status: 'approved' })
        .eq('id', id);

      if (error) throw error;
      onLeaveUpdate();
    } catch (error) {
      console.error('İzin talebi onaylanırken hata:', error);
    }
  };

  const handleRejectLeaveRequest = async (id: string) => {
    try {
      const { error } = await supabase
        .from('leave_requests')
        .update({ status: 'rejected' })
        .eq('id', id);

      if (error) throw error;
      onLeaveUpdate();
    } catch (error) {
      console.error('İzin talebi reddedilirken hata:', error);
    }
  };

  const handleViewLeaveRequest = (request: LeaveRequest) => {
    setSelectedLeaveRequest(request);
    setShowViewLeaveRequest(true);
  };

  const handleEditLeaveRequestClick = (request: LeaveRequest) => {
    setSelectedLeaveRequest(request);
    setLeaveRequestFormData({
      employee_id: request.employee_id,
      leave_type: request.leave_type,
      start_date: request.start_date,
      end_date: request.end_date,
      reason: request.reason,
      status: request.status,
      days_requested: request.days_requested || 0
    });
    setShowEditLeaveRequest(true);
  };

  // İstatistikler hesaplama
  const totalRequests = leaveRequests.length;
  const pendingRequests = leaveRequests.filter(r => r.status === 'pending').length;
  const approvedRequests = leaveRequests.filter(r => r.status === 'approved').length;
  const rejectedRequests = leaveRequests.filter(r => r.status === 'rejected').length;

  // İzin türü dağılımı
  const leaveTypeDistribution = leaveTypes.map(type => ({
    type,
    label: getLeaveTypeLabel(type),
    count: leaveRequests.filter(r => r.leave_type === type).length,
    approvedCount: leaveRequests.filter(r => r.leave_type === type && r.status === 'approved').length
  }));

  return (
    <div className="space-y-6">
      {/* İstatistikler */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900 dark:to-indigo-900 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Toplam Talep</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{totalRequests}</p>
            </div>
            <div className="p-2 bg-blue-500 rounded-lg">
              <Calendar className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>
        
        <div className="bg-gradient-to-br from-yellow-50 to-amber-50 dark:from-yellow-900 dark:to-amber-900 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Bekleyen</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{pendingRequests}</p>
            </div>
            <div className="p-2 bg-yellow-500 rounded-lg">
              <Clock className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>
        
        <div className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900 dark:to-emerald-900 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Onaylanan</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{approvedRequests}</p>
            </div>
            <div className="p-2 bg-green-500 rounded-lg">
              <CheckCircle className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>
        
        <div className="bg-gradient-to-br from-red-50 to-rose-50 dark:from-red-900 dark:to-rose-900 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Reddedilen</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{rejectedRequests}</p>
            </div>
            <div className="p-2 bg-red-500 rounded-lg">
              <XCircle className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>
      </div>

      {/* İzin Türü Dağılımı */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
          <PieChart className="w-5 h-5 mr-2 text-blue-500" />
          İzin Türü Dağılımı
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          {leaveTypeDistribution.map((typeData) => (
            <div key={typeData.type} className="text-center">
              <div className={`w-16 h-16 mx-auto mb-2 rounded-full flex items-center justify-center ${
                typeData.count > 0 ? 'bg-blue-100 dark:bg-blue-900' : 'bg-gray-100 dark:bg-gray-700'
              }`}>
                <span className={`text-xl font-bold ${
                  typeData.count > 0 ? 'text-blue-600 dark:text-blue-400' : 'text-gray-400'
                }`}>
                  {typeData.count}
                </span>
              </div>
              <p className="text-sm font-medium text-gray-900 dark:text-white">{typeData.label}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {typeData.count > 0 ? Math.round((typeData.approvedCount / typeData.count) * 100) : 0}% onay oranı
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Arama ve Filtreler */}
      <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="İzin talebi ara..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
              />
            </div>
          </div>
          
          <div className="flex gap-2">
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
            >
              <option value="">Tüm Türler</option>
              {leaveTypes.map(type => (
                <option key={type} value={type}>{getLeaveTypeLabel(type)}</option>
              ))}
            </select>
            
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
            >
              <option value="">Tüm Durumlar</option>
              {leaveStatuses.map(status => (
                <option key={status} value={status}>{getStatusLabel(status)}</option>
              ))}
            </select>
          </div>
          
          <button
            onClick={() => setShowAddLeaveRequest(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center space-x-2"
          >
            <Plus className="w-5 h-5" />
            <span>İzin Talebi Ekle</span>
          </button>
        </div>
      </div>

      {/* İzin Talepleri Listesi */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Çalışan
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  İzin Türü
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Tarih Aralığı
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Gün Sayısı
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
              {filteredLeaveRequests.map((request) => {
                const employee = employees.find(emp => emp.id === request.employee_id);
                return (
                  <tr key={request.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10">
                          <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-semibold">
                            {employee?.name?.split(' ').map((n: string) => n[0]).join('').toUpperCase() || '?'}
                          </div>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900 dark:text-white">
                            {employee?.name || 'Bilinmeyen Çalışan'}
                          </div>
                          <div className="text-sm text-gray-500 dark:text-gray-400">
                            {employee?.department || 'Departman yok'}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900 dark:text-white">
                        {getLeaveTypeLabel(request.leave_type)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900 dark:text-white">
                        {new Date(request.start_date).toLocaleDateString('tr-TR')}
                      </div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        {new Date(request.end_date).toLocaleDateString('tr-TR')}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900 dark:text-white">
                        {request.days_requested || calculateDays(request.start_date, request.end_date)} gün
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(request.status)}`}>
                        {getStatusLabel(request.status)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleViewLeaveRequest(request)}
                          className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleEditLeaveRequestClick(request)}
                          className="text-green-600 hover:text-green-900 dark:text-green-400 dark:hover:text-green-300"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        {request.status === 'pending' && (
                          <>
                            <button
                              onClick={() => handleApproveLeaveRequest(request.id)}
                              className="text-green-600 hover:text-green-900 dark:text-green-400 dark:hover:text-green-300"
                            >
                              <CheckCircle className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleRejectLeaveRequest(request.id)}
                              className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                            >
                              <XCircle className="w-4 h-4" />
                            </button>
                          </>
                        )}
                        <button
                          onClick={() => handleDeleteLeaveRequest(request.id)}
                          className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* İzin Talebi Ekleme Modal */}
      {showAddLeaveRequest && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Yeni İzin Talebi Ekle</h3>
            <div className="space-y-4">
              <select
                value={leaveRequestFormData.employee_id}
                onChange={(e) => setLeaveRequestFormData({...leaveRequestFormData, employee_id: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
              >
                <option value="">Çalışan Seçin</option>
                {employees.map(employee => (
                  <option key={employee.id} value={employee.id}>{employee.name}</option>
                ))}
              </select>
              <select
                value={leaveRequestFormData.leave_type}
                onChange={(e) => setLeaveRequestFormData({...leaveRequestFormData, leave_type: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
              >
                <option value="">İzin Türü Seçin</option>
                {leaveTypes.map(type => (
                  <option key={type} value={type}>{getLeaveTypeLabel(type)}</option>
                ))}
              </select>
              <input
                type="date"
                placeholder="Başlangıç Tarihi"
                value={leaveRequestFormData.start_date}
                onChange={(e) => setLeaveRequestFormData({...leaveRequestFormData, start_date: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
              />
              <input
                type="date"
                placeholder="Bitiş Tarihi"
                value={leaveRequestFormData.end_date}
                onChange={(e) => setLeaveRequestFormData({...leaveRequestFormData, end_date: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
              />
              <textarea
                placeholder="İzin Sebebi"
                value={leaveRequestFormData.reason}
                onChange={(e) => setLeaveRequestFormData({...leaveRequestFormData, reason: e.target.value})}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
              />
            </div>
            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => setShowAddLeaveRequest(false)}
                className="px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600"
              >
                İptal
              </button>
              <button
                onClick={handleAddLeaveRequest}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Ekle
              </button>
            </div>
          </div>
        </div>
      )}

      {/* İzin Talebi Düzenleme Modal */}
      {showEditLeaveRequest && selectedLeaveRequest && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">İzin Talebi Düzenle</h3>
            <div className="space-y-4">
              <select
                value={leaveRequestFormData.employee_id}
                onChange={(e) => setLeaveRequestFormData({...leaveRequestFormData, employee_id: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
              >
                <option value="">Çalışan Seçin</option>
                {employees.map(employee => (
                  <option key={employee.id} value={employee.id}>{employee.name}</option>
                ))}
              </select>
              <select
                value={leaveRequestFormData.leave_type}
                onChange={(e) => setLeaveRequestFormData({...leaveRequestFormData, leave_type: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
              >
                <option value="">İzin Türü Seçin</option>
                {leaveTypes.map(type => (
                  <option key={type} value={type}>{getLeaveTypeLabel(type)}</option>
                ))}
              </select>
              <input
                type="date"
                placeholder="Başlangıç Tarihi"
                value={leaveRequestFormData.start_date}
                onChange={(e) => setLeaveRequestFormData({...leaveRequestFormData, start_date: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
              />
              <input
                type="date"
                placeholder="Bitiş Tarihi"
                value={leaveRequestFormData.end_date}
                onChange={(e) => setLeaveRequestFormData({...leaveRequestFormData, end_date: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
              />
              <textarea
                placeholder="İzin Sebebi"
                value={leaveRequestFormData.reason}
                onChange={(e) => setLeaveRequestFormData({...leaveRequestFormData, reason: e.target.value})}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
              />
            </div>
            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => setShowEditLeaveRequest(false)}
                className="px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600"
              >
                İptal
              </button>
              <button
                onClick={handleEditLeaveRequest}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Güncelle
              </button>
            </div>
          </div>
        </div>
      )}

      {/* İzin Talebi Görüntüleme Modal */}
      {showViewLeaveRequest && selectedLeaveRequest && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white">İzin Talebi Detayları</h3>
              <button
                onClick={() => setShowViewLeaveRequest(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <XCircle className="w-6 h-6" />
              </button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Temel Bilgiler */}
              <div className="space-y-4">
                <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                  <h4 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center">
                    <User className="w-5 h-5 mr-2 text-blue-500" />
                    Çalışan Bilgileri
                  </h4>
                  <div className="space-y-2 text-sm">
                    {(() => {
                      const employee = employees.find(emp => emp.id === selectedLeaveRequest.employee_id);
                      return (
                        <>
                          <div className="flex items-center">
                            <Mail className="w-4 h-4 mr-2 text-gray-400" />
                            <span className="text-gray-600 dark:text-gray-300">{employee?.email || 'Bilinmeyen'}</span>
                          </div>
                          <div className="flex items-center">
                            <Building className="w-4 h-4 mr-2 text-gray-400" />
                            <span className="text-gray-600 dark:text-gray-300">{employee?.department || 'Departman yok'}</span>
                          </div>
                          <div className="flex items-center">
                            <Briefcase className="w-4 h-4 mr-2 text-gray-400" />
                            <span className="text-gray-600 dark:text-gray-300">{employee?.position || 'Pozisyon yok'}</span>
                          </div>
                        </>
                      );
                    })()}
                  </div>
                </div>
              </div>

              {/* İzin Detayları */}
              <div className="space-y-4">
                <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                  <h4 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center">
                    <Calendar className="w-5 h-5 mr-2 text-green-500" />
                    İzin Detayları
                  </h4>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600 dark:text-gray-300">İzin Türü</span>
                      <span className="text-sm font-medium text-gray-900 dark:text-white">
                        {getLeaveTypeLabel(selectedLeaveRequest.leave_type)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600 dark:text-gray-300">Başlangıç</span>
                      <span className="text-sm font-medium text-gray-900 dark:text-white">
                        {new Date(selectedLeaveRequest.start_date).toLocaleDateString('tr-TR')}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600 dark:text-gray-300">Bitiş</span>
                      <span className="text-sm font-medium text-gray-900 dark:text-white">
                        {new Date(selectedLeaveRequest.end_date).toLocaleDateString('tr-TR')}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600 dark:text-gray-300">Gün Sayısı</span>
                      <span className="text-sm font-medium text-gray-900 dark:text-white">
                        {selectedLeaveRequest.days_requested || calculateDays(selectedLeaveRequest.start_date, selectedLeaveRequest.end_date)} gün
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Durum ve İşlemler */}
              <div className="space-y-4">
                <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                  <h4 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center">
                    <Award className="w-5 h-5 mr-2 text-purple-500" />
                    Durum & İşlemler
                  </h4>
                  <div className="space-y-3">
                    <div>
                      <span className="text-sm text-gray-600 dark:text-gray-300">Durum:</span>
                      <span className={`ml-2 inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(selectedLeaveRequest.status)}`}>
                        {getStatusLabel(selectedLeaveRequest.status)}
                      </span>
                    </div>
                    <div>
                      <span className="text-sm text-gray-600 dark:text-gray-300">Sebep:</span>
                      <p className="text-sm text-gray-900 dark:text-white mt-1">
                        {selectedLeaveRequest.reason || 'Sebep belirtilmemiş'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-end mt-6">
              <button
                onClick={() => handleEditLeaveRequestClick(selectedLeaveRequest)}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center space-x-2"
              >
                <Edit className="w-4 h-4" />
                <span>Düzenle</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LeaveManagement;
