import React, { useState, useEffect } from 'react';
import { 
  RotateCcw, 
  AlertTriangle, 
  CheckCircle, 
  XCircle, 
  Search, 
  Filter, 
  Calendar, 
  User, 
  FileText, 
  Eye, 
  Edit, 
  Clock,
  Shield,
  Flag,
  History,
  RefreshCw,
  Download,
  MoreHorizontal,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';
import { tr } from 'date-fns/locale';
import { toast } from 'react-hot-toast';
import { supabase } from '../lib/supabase';

interface RevertRecord {
  id: string;
  ticket_id: string;
  from_version_id: string;
  to_version_id: string;
  reverted_by: string;
  revert_reason: string;
  created_at: string;
  reverted_at: string;
  is_active: boolean;
  admin_notes?: string;
  reviewed_by?: string;
  reviewed_at?: string;
  review_status: 'pending' | 'approved' | 'rejected' | 'investigation_required';
  ticket_title?: string;
  from_version_number?: number;
  to_version_number?: number;
  reverted_by_name?: string;
  reviewed_by_name?: string;
}

interface RevertHistoryProps {
  ticketId?: string; // Belirli bir talep için filtreleme
  isAdmin?: boolean;
}

const RevertHistory: React.FC<RevertHistoryProps> = ({ 
  ticketId, 
  isAdmin = false 
}) => {
  const [reverts, setReverts] = useState<RevertRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState('all');
  const [expandedReverts, setExpandedReverts] = useState<Set<string>>(new Set());
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [selectedRevert, setSelectedRevert] = useState<RevertRecord | null>(null);
  const [reviewNotes, setReviewNotes] = useState('');
  const [reviewStatus, setReviewStatus] = useState<'approved' | 'rejected' | 'investigation_required'>('approved');

  useEffect(() => {
    fetchRevertHistory();
  }, [ticketId]);

  const fetchRevertHistory = async () => {
    try {
      setLoading(true);
      
      let query = supabase
        .from('ticket_version_reverts')
        .select(`
          *,
          from_version:from_version_id(version_number),
          to_version:to_version_id(version_number),
          ticket:ticket_id(title)
        `)
        .order('created_at', { ascending: false });

      if (ticketId) {
        query = query.eq('ticket_id', ticketId);
      }

      const { data, error } = await query;

      if (error) throw error;

      // Kullanıcı bilgilerini ekle
      const revertsWithUsers = data?.map(revert => ({
        ...revert,
        from_version_number: revert.from_version?.version_number,
        to_version_number: revert.to_version?.version_number,
        ticket_title: revert.ticket?.title,
        reverted_by_name: getDefaultUserName(revert.reverted_by),
        reviewed_by_name: revert.reviewed_by ? getDefaultUserName(revert.reviewed_by) : null
      })) || [];

      setReverts(revertsWithUsers);
    } catch (error) {
      console.error('Geri alma geçmişi yükleme hatası:', error);
      toast.error('Geri alma geçmişi yüklenirken hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  const getDefaultUserName = (userId: string) => {
    return userId || 'Bilinmeyen Kullanıcı';
  };

  const getReviewStatusIcon = (status: string) => {
    switch (status) {
      case 'approved':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'rejected':
        return <XCircle className="w-4 h-4 text-red-500" />;
      case 'investigation_required':
        return <AlertTriangle className="w-4 h-4 text-orange-500" />;
      default:
        return <Clock className="w-4 h-4 text-gray-500" />;
    }
  };

  const getReviewStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
        return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400';
      case 'rejected':
        return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400';
      case 'investigation_required':
        return 'bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400';
    }
  };

  const getReviewStatusText = (status: string) => {
    switch (status) {
      case 'approved':
        return 'Onaylandı';
      case 'rejected':
        return 'Reddedildi';
      case 'investigation_required':
        return 'İnceleme Gerekli';
      case 'pending':
        return 'Beklemede';
      default:
        return status;
    }
  };

  const toggleExpanded = (revertId: string) => {
    const newExpanded = new Set(expandedReverts);
    if (newExpanded.has(revertId)) {
      newExpanded.delete(revertId);
    } else {
      newExpanded.add(revertId);
    }
    setExpandedReverts(newExpanded);
  };

  const handleReview = async () => {
    if (!selectedRevert) return;

    try {
      const { error } = await supabase
        .from('ticket_version_reverts')
        .update({
          review_status: reviewStatus,
          admin_notes: reviewNotes,
          reviewed_by: 'admin', // Gerçek uygulamada auth.uid() kullanılacak
          reviewed_at: new Date().toISOString()
        })
        .eq('id', selectedRevert.id);

      if (error) throw error;

      toast.success('Geri alma kaydı incelendi');
      setShowReviewModal(false);
      setSelectedRevert(null);
      setReviewNotes('');
      setReviewStatus('approved');
      fetchRevertHistory();
    } catch (error) {
      console.error('İnceleme hatası:', error);
      toast.error('İnceleme kaydedilirken hata oluştu');
    }
  };

  const filteredReverts = reverts.filter(revert => {
    const matchesFilter = filter === 'all' || revert.review_status === filter;
    const matchesSearch = searchTerm === '' || 
      revert.ticket_title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      revert.revert_reason?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      revert.reverted_by_name?.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesFilter && matchesSearch;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2 text-gray-600 dark:text-gray-400">Geri alma geçmişi yükleniyor...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-red-100 dark:bg-red-900/20 rounded-lg">
            <RotateCcw className="w-5 h-5 text-red-600 dark:text-red-400" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Geri Alma Geçmişi
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {reverts.length} geri alma kaydı
            </p>
          </div>
        </div>
        
        <button
          onClick={fetchRevertHistory}
          className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          title="Yenile"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* Filtreler */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Arama */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Geri alma kaydı ara..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Durum filtresi */}
          <div>
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">Tüm Durumlar</option>
              <option value="pending">Beklemede</option>
              <option value="approved">Onaylandı</option>
              <option value="rejected">Reddedildi</option>
              <option value="investigation_required">İnceleme Gerekli</option>
            </select>
          </div>
        </div>
      </div>

      {/* Geri alma kayıtları */}
      <div className="space-y-4">
        {filteredReverts.length === 0 ? (
          <div className="text-center py-12">
            <RotateCcw className="w-16 h-16 mx-auto mb-4 text-gray-400" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              Geri Alma Kaydı Bulunamadı
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              {searchTerm || filter !== 'all'
                ? 'Arama kriterlerinize uygun geri alma kaydı bulunamadı.'
                : 'Henüz geri alma işlemi yapılmamış.'}
            </p>
          </div>
        ) : (
          filteredReverts.map((revert) => {
            const isExpanded = expandedReverts.has(revert.id);
            
            return (
              <div key={revert.id} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
                <div className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="p-2 bg-red-100 dark:bg-red-900/20 rounded-lg">
                        <RotateCcw className="w-4 h-4 text-red-600 dark:text-red-400" />
                      </div>
                      
                      <div>
                        <div className="flex items-center space-x-2">
                          <h4 className="font-medium text-gray-900 dark:text-white">
                            {revert.ticket_title || 'Bilinmeyen Talep'}
                          </h4>
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getReviewStatusColor(revert.review_status)}`}>
                            {getReviewStatusIcon(revert.review_status)}
                            <span className="ml-1">{getReviewStatusText(revert.review_status)}</span>
                          </span>
                        </div>
                        
                        <div className="flex items-center space-x-2 text-sm text-gray-500 dark:text-gray-400">
                          <Clock className="w-3 h-3" />
                          <span>{formatDistanceToNow(new Date(revert.created_at), { addSuffix: true, locale: tr })}</span>
                          <span>•</span>
                          <User className="w-3 h-3" />
                          <span>{revert.reverted_by_name}</span>
                          <span>•</span>
                          <span>v{revert.from_version_number} → v{revert.to_version_number}</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      {isAdmin && revert.review_status === 'pending' && (
                        <button
                          onClick={() => {
                            setSelectedRevert(revert);
                            setShowReviewModal(true);
                          }}
                          className="flex items-center space-x-1 px-3 py-1 text-xs text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                        >
                          <Eye className="w-3 h-3" />
                          <span>İncele</span>
                        </button>
                      )}
                      
                      <button
                        onClick={() => toggleExpanded(revert.id)}
                        className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                      >
                        {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                  
                  <div className="mt-3">
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {revert.revert_reason}
                    </p>
                  </div>
                </div>
                
                {/* Detaylar */}
                {isExpanded && (
                  <div className="border-t border-gray-200 dark:border-gray-700 p-4 bg-gray-50 dark:bg-gray-700/50">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <h5 className="text-sm font-medium text-gray-900 dark:text-white mb-2">Geri Alma Detayları</h5>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-gray-500 dark:text-gray-400">Geri Alınan Versiyon:</span>
                            <span className="font-medium">v{revert.from_version_number}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-500 dark:text-gray-400">Hedef Versiyon:</span>
                            <span className="font-medium">v{revert.to_version_number}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-500 dark:text-gray-400">Geri Alan:</span>
                            <span className="font-medium">{revert.reverted_by_name}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-500 dark:text-gray-400">Tarih:</span>
                            <span className="font-medium">{format(new Date(revert.created_at), 'dd MMMM yyyy HH:mm', { locale: tr })}</span>
                          </div>
                        </div>
                      </div>
                      
                      {revert.review_status !== 'pending' && (
                        <div>
                          <h5 className="text-sm font-medium text-gray-900 dark:text-white mb-2">İnceleme Bilgileri</h5>
                          <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                              <span className="text-gray-500 dark:text-gray-400">Durum:</span>
                              <span className={`font-medium ${getReviewStatusColor(revert.review_status)}`}>
                                {getReviewStatusText(revert.review_status)}
                              </span>
                            </div>
                            {revert.reviewed_by_name && (
                              <div className="flex justify-between">
                                <span className="text-gray-500 dark:text-gray-400">İnceleyen:</span>
                                <span className="font-medium">{revert.reviewed_by_name}</span>
                              </div>
                            )}
                            {revert.reviewed_at && (
                              <div className="flex justify-between">
                                <span className="text-gray-500 dark:text-gray-400">İnceleme Tarihi:</span>
                                <span className="font-medium">{format(new Date(revert.reviewed_at), 'dd MMMM yyyy HH:mm', { locale: tr })}</span>
                              </div>
                            )}
                            {revert.admin_notes && (
                              <div>
                                <span className="text-gray-500 dark:text-gray-400">Notlar:</span>
                                <p className="text-sm text-gray-700 dark:text-gray-300 mt-1">{revert.admin_notes}</p>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* İnceleme Modal */}
      {showReviewModal && selectedRevert && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-xl max-w-md w-full mx-4">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
                  <Eye className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Geri Alma Kaydını İncele
                </h3>
              </div>
            </div>
            
            <div className="p-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    İnceleme Durumu
                  </label>
                  <select
                    value={reviewStatus}
                    onChange={(e) => setReviewStatus(e.target.value as any)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="approved">Onayla</option>
                    <option value="rejected">Reddet</option>
                    <option value="investigation_required">İnceleme Gerekli</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Admin Notları
                  </label>
                  <textarea
                    value={reviewNotes}
                    onChange={(e) => setReviewNotes(e.target.value)}
                    placeholder="İnceleme notlarınızı buraya yazın..."
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    rows={4}
                  />
                </div>
              </div>
            </div>
            
            <div className="p-6 border-t border-gray-200 dark:border-gray-700 flex items-center justify-end space-x-3">
              <button
                onClick={() => {
                  setShowReviewModal(false);
                  setSelectedRevert(null);
                  setReviewNotes('');
                  setReviewStatus('approved');
                }}
                className="px-4 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                İptal
              </button>
              <button
                onClick={handleReview}
                className="px-4 py-2 text-sm text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
              >
                İncelemeyi Kaydet
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RevertHistory;
