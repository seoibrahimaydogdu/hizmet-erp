import React, { useState, useEffect } from 'react';
import { 
  Clock, 
  CheckCircle, 
  AlertCircle, 
  MessageSquare, 
  FileText, 
  Edit,
  Calendar,
  User,
  Monitor,
  Globe,
  Filter,
  Search,
  MoreHorizontal,
  Eye
} from 'lucide-react';
import { useSupabase } from '../hooks/useSupabase';
import { formatDistanceToNow } from 'date-fns';
import { tr } from 'date-fns/locale';
import { toast } from 'react-hot-toast';

interface FeedbackRequest {
  id: string;
  subject: string;
  message: string;
  type: 'error' | 'feature' | 'general' | 'other';
  page_source: string;
  user_id?: string;
  user_name?: string;
  status: 'pending' | 'in_progress' | 'resolved' | 'closed';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  queue_position: number;
  estimated_duration_minutes?: number;
  created_at: string;
  updated_at: string;
  admin_notes?: string;
  assigned_to?: string;
}

const FeedbackTab: React.FC = () => {
  const { supabase } = useSupabase();
  
  const [feedbackRequests, setFeedbackRequests] = useState<FeedbackRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'pending' | 'in_progress' | 'resolved' | 'closed'>('all');
  const [selectedType, setSelectedType] = useState<'all' | 'error' | 'feature' | 'general' | 'other'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [editingFeedback, setEditingFeedback] = useState<FeedbackRequest | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);

  useEffect(() => {
    fetchFeedbackRequests();
  }, []);

  const fetchFeedbackRequests = async () => {
    try {
      setLoading(true);
      const { data, error: fetchError } = await supabase
        .from('feedback_requests')
        .select('*')
        .order('created_at', { ascending: false });

      if (fetchError) throw fetchError;
      setFeedbackRequests(data || []);
    } catch (err) {
      setError('Geri bildirim talepleri yüklenirken bir hata oluştu.');
      console.error('Error fetching feedback:', err);
    } finally {
      setLoading(false);
    }
  };

  const updateFeedbackStatus = async (id: string, status: string, adminNotes?: string, estimatedDuration?: number) => {
    try {
      const updateData: any = { status };
      if (adminNotes !== undefined) updateData.admin_notes = adminNotes;
      if (estimatedDuration !== undefined) updateData.estimated_duration_minutes = estimatedDuration;

      const { error } = await supabase
        .from('feedback_requests')
        .update(updateData)
        .eq('id', id);

      if (error) throw error;

      toast.success('Geri bildirim güncellendi');
      fetchFeedbackRequests();
      setShowEditModal(false);
      setEditingFeedback(null);
    } catch (err) {
      toast.error('Güncelleme sırasında hata oluştu');
      console.error('Update error:', err);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="text-yellow-500" size={16} />;
      case 'in_progress':
        return <AlertCircle className="text-blue-500" size={16} />;
      case 'resolved':
        return <CheckCircle className="text-green-500" size={16} />;
      case 'closed':
        return <CheckCircle className="text-gray-500" size={16} />;
      default:
        return <MessageSquare className="text-gray-500" size={16} />;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending':
        return 'Beklemede';
      case 'in_progress':
        return 'İşleniyor';
      case 'resolved':
        return 'Çözüldü';
      case 'closed':
        return 'Kapatıldı';
      default:
        return status;
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'error':
        return <AlertCircle className="text-red-500" size={16} />;
      case 'feature':
        return <MessageSquare className="text-blue-500" size={16} />;
      case 'general':
        return <MessageSquare className="text-green-500" size={16} />;
      case 'other':
        return <FileText className="text-gray-500" size={16} />;
      default:
        return <MessageSquare className="text-gray-500" size={16} />;
    }
  };

  const getTypeText = (type: string) => {
    switch (type) {
      case 'error':
        return 'Hata Bildirimi';
      case 'feature':
        return 'Özellik Talebi';
      case 'general':
        return 'Genel Görüş';
      case 'other':
        return 'Diğer';
      default:
        return type;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'high':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low':
        return 'bg-green-100 text-green-800 border-green-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getPriorityText = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return 'Acil';
      case 'high':
        return 'Yüksek';
      case 'medium':
        return 'Orta';
      case 'low':
        return 'Düşük';
      default:
        return priority;
    }
  };

  const filteredRequests = feedbackRequests.filter(request => {
    const matchesFilter = selectedFilter === 'all' || request.status === selectedFilter;
    const matchesType = selectedType === 'all' || request.type === selectedType;
    const matchesSearch = searchTerm === '' || 
      request.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
      request.message.toLowerCase().includes(searchTerm.toLowerCase()) ||
      request.page_source.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (request.user_name && request.user_name.toLowerCase().includes(searchTerm.toLowerCase()));
    
    return matchesFilter && matchesType && matchesSearch;
  });

  const getQueueInfo = (request: FeedbackRequest) => {
    if (request.status !== 'pending') return null;
    
    return (
      <div className="flex items-center gap-2 text-sm text-gray-600">
        <Clock size={14} />
        <span>Sıra: {request.queue_position}</span>
        {request.estimated_duration_minutes && (
          <span>• Tahmini süre: {request.estimated_duration_minutes} dakika</span>
        )}
      </div>
    );
  };

  const handleEdit = (feedback: FeedbackRequest) => {
    setEditingFeedback(feedback);
    setShowEditModal(true);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center">
          <AlertCircle className="mx-auto h-12 w-12 text-red-500 mb-4" />
          <p className="text-red-600">{error}</p>
          <button
            onClick={fetchFeedbackRequests}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Tekrar Dene
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        {[
          { label: 'Toplam', count: feedbackRequests.length, color: 'bg-blue-500' },
          { label: 'Beklemede', count: feedbackRequests.filter(r => r.status === 'pending').length, color: 'bg-yellow-500' },
          { label: 'İşleniyor', count: feedbackRequests.filter(r => r.status === 'in_progress').length, color: 'bg-blue-500' },
          { label: 'Çözüldü', count: feedbackRequests.filter(r => r.status === 'resolved').length, color: 'bg-green-500' },
          { label: 'Kapatıldı', count: feedbackRequests.filter(r => r.status === 'closed').length, color: 'bg-gray-500' }
        ].map((stat, index) => (
          <div key={index} className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center">
              <div className={`${stat.color} rounded-full p-2 mr-3`}>
                <MessageSquare className="text-white" size={20} />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">{stat.label}</p>
                <p className="text-xl font-bold text-gray-900">{stat.count}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Filters and Search */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Filtreler ve Arama</h3>
        </div>
        <div className="px-6 py-4 space-y-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Konu, mesaj, sayfa kaynağı veya gönderen kişide ara..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Filters */}
          <div className="flex flex-wrap gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Durum</label>
              <select
                value={selectedFilter}
                onChange={(e) => setSelectedFilter(e.target.value as any)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">Tümü</option>
                <option value="pending">Beklemede</option>
                <option value="in_progress">İşleniyor</option>
                <option value="resolved">Çözüldü</option>
                <option value="closed">Kapatıldı</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tür</label>
              <select
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value as any)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">Tümü</option>
                <option value="error">Hata Bildirimi</option>
                <option value="feature">Özellik Talebi</option>
                <option value="general">Genel Görüş</option>
                <option value="other">Diğer</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Feedback Requests List */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">
            Geri Bildirim Talepleri ({filteredRequests.length})
          </h3>
        </div>
        
        {filteredRequests.length === 0 ? (
          <div className="px-6 py-12 text-center">
            <MessageSquare className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <p className="text-gray-500">Geri bildirim talebi bulunamadı.</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {filteredRequests.map((request) => (
              <div key={request.id} className="px-6 py-6 hover:bg-gray-50 transition-colors">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    {/* Header */}
                    <div className="flex items-center gap-3 mb-3">
                      {getTypeIcon(request.type)}
                      <h4 className="text-lg font-medium text-gray-900">{request.subject}</h4>
                      <span className={`px-2 py-1 text-xs font-medium rounded-full border ${getPriorityColor(request.priority)}`}>
                        {getPriorityText(request.priority)}
                      </span>
                    </div>

                    {/* Message Preview */}
                    <p className="text-gray-600 mb-4 line-clamp-2">
                      {request.message.length > 150 
                        ? `${request.message.substring(0, 150)}...` 
                        : request.message
                      }
                    </p>

                    {/* Details */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-500 mb-4">
                      <div className="flex items-center gap-2">
                        <User size={14} />
                        <span>Gönderen: <span className="font-medium text-gray-700">{request.user_name || 'Misafir'}</span></span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Globe size={14} />
                        <span>Sayfa: {request.page_source}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Calendar size={14} />
                        <span>Oluşturulma: {formatDistanceToNow(new Date(request.created_at), { addSuffix: true, locale: tr })}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock size={14} />
                        <span>Durum: {getStatusText(request.status)}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Monitor size={14} />
                        <span>Güncelleme: {formatDistanceToNow(new Date(request.updated_at), { addSuffix: true, locale: tr })}</span>
                      </div>
                    </div>

                    {/* Queue Info */}
                    {getQueueInfo(request)}

                    {/* Admin Notes */}
                    {request.admin_notes && (
                      <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
                        <p className="text-sm font-medium text-blue-800 mb-1">Admin Notu:</p>
                        <p className="text-sm text-blue-700">{request.admin_notes}</p>
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="ml-4 flex flex-col items-center gap-2">
                    <div className="flex flex-col items-center">
                      {getStatusIcon(request.status)}
                      <span className="text-xs text-gray-500 mt-1">
                        {getStatusText(request.status)}
                      </span>
                    </div>
                    
                    <button
                      onClick={() => handleEdit(request)}
                      className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-md transition-colors"
                      title="Düzenle"
                    >
                      <Edit size={16} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Edit Modal */}
      {showEditModal && editingFeedback && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="px-6 py-4 border-b">
              <h3 className="text-lg font-medium text-gray-900">Geri Bildirim Düzenle</h3>
            </div>
            
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Durum</label>
                <select
                  value={editingFeedback.status}
                  onChange={(e) => setEditingFeedback(prev => prev ? {...prev, status: e.target.value as any} : null)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="pending">Beklemede</option>
                  <option value="in_progress">İşleniyor</option>
                  <option value="resolved">Çözüldü</option>
                  <option value="closed">Kapatıldı</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Admin Notu</label>
                <textarea
                  value={editingFeedback.admin_notes || ''}
                  onChange={(e) => setEditingFeedback(prev => prev ? {...prev, admin_notes: e.target.value} : null)}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Admin notu ekleyin..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Tahmini Süre (dakika)</label>
                <input
                  type="number"
                  value={editingFeedback.estimated_duration_minutes || ''}
                  onChange={(e) => setEditingFeedback(prev => prev ? {...prev, estimated_duration_minutes: parseInt(e.target.value) || undefined} : null)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Dakika cinsinden süre"
                />
              </div>
            </div>

            <div className="px-6 py-4 border-t flex gap-3">
              <button
                onClick={() => updateFeedbackStatus(
                  editingFeedback.id, 
                  editingFeedback.status, 
                  editingFeedback.admin_notes, 
                  editingFeedback.estimated_duration_minutes
                )}
                className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
              >
                Güncelle
              </button>
              <button
                onClick={() => {
                  setShowEditModal(false);
                  setEditingFeedback(null);
                }}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
              >
                İptal
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FeedbackTab;
