import React, { useState, useEffect } from 'react';
import { 
  Clock, 
  CheckCircle, 
  AlertCircle, 
  MessageSquare, 
  FileText, 
  Eye,
  Calendar,
  User,
  Monitor,
  Globe
} from 'lucide-react';
import { useSupabase } from '../hooks/useSupabase';
import { useUser } from '../contexts/UserContext';
import { formatDistanceToNow } from 'date-fns';
import { tr } from 'date-fns/locale';

interface FeedbackRequest {
  id: string;
  subject: string;
  message: string;
  type: 'error' | 'feature' | 'general' | 'other';
  page_source: string;
  status: 'pending' | 'in_progress' | 'resolved' | 'closed';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  queue_position: number;
  estimated_duration_minutes: number;
  created_at: string;
  updated_at: string;
  admin_notes?: string;
}

const FeedbackRequestsPage: React.FC = () => {
  const { supabase } = useSupabase();
  const { userProfile } = useUser();
  
  const [feedbackRequests, setFeedbackRequests] = useState<FeedbackRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'pending' | 'in_progress' | 'resolved' | 'closed'>('all');

  useEffect(() => {
    fetchFeedbackRequests();
  }, [userProfile]);

  const fetchFeedbackRequests = async () => {
    if (!userProfile?.id) return;

    try {
      setLoading(true);
      const { data, error: fetchError } = await supabase
        .from('feedback_requests')
        .select('*')
        .eq('user_id', userProfile.id)
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
    if (selectedFilter === 'all') return true;
    return request.status === selectedFilter;
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

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
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
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Geri Bildirim Taleplerim</h1>
          <p className="text-gray-600">
            Gönderdiğiniz geri bildirimlerin durumunu takip edin
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          {[
            { label: 'Toplam', count: feedbackRequests.length, color: 'bg-blue-500' },
            { label: 'Beklemede', count: feedbackRequests.filter(r => r.status === 'pending').length, color: 'bg-yellow-500' },
            { label: 'İşleniyor', count: feedbackRequests.filter(r => r.status === 'in_progress').length, color: 'bg-blue-500' },
            { label: 'Çözüldü', count: feedbackRequests.filter(r => r.status === 'resolved').length, color: 'bg-green-500' }
          ].map((stat, index) => (
            <div key={index} className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className={`${stat.color} rounded-full p-3 mr-4`}>
                  <MessageSquare className="text-white" size={24} />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">{stat.label}</p>
                  <p className="text-2xl font-bold text-gray-900">{stat.count}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow mb-6">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">Filtreler</h3>
          </div>
          <div className="px-6 py-4">
            <div className="flex flex-wrap gap-2">
              {[
                { value: 'all', label: 'Tümü' },
                { value: 'pending', label: 'Beklemede' },
                { value: 'in_progress', label: 'İşleniyor' },
                { value: 'resolved', label: 'Çözüldü' },
                { value: 'closed', label: 'Kapatıldı' }
              ].map((filter) => (
                <button
                  key={filter.value}
                  onClick={() => setSelectedFilter(filter.value as any)}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                    selectedFilter === filter.value
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {filter.label}
                </button>
              ))}
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
              <p className="text-gray-500">Henüz geri bildirim talebiniz bulunmuyor.</p>
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

                    {/* Status Icon */}
                    <div className="ml-4 flex flex-col items-center">
                      {getStatusIcon(request.status)}
                      <span className="text-xs text-gray-500 mt-1">
                        {getStatusText(request.status)}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default FeedbackRequestsPage;
