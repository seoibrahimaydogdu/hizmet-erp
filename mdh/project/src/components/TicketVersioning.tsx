import React, { useState, useEffect } from 'react';
import { 
  GitBranch, 
  History, 
  RotateCcw, 
  GitCompare, 
  Eye, 
  Download, 
  MoreHorizontal,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
  CheckCircle,
  Clock,
  User,
  Tag,
  FileText,
  Settings,
  Star,
  ArrowLeft,
  ArrowRight,
  Plus,
  Minus,
  Edit,
  Trash2,
  Copy,
  Share2,
  Filter,
  Search,
  Calendar,
  Info,
  HelpCircle,
  RefreshCw,
  Save,
  X
} from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';
import { tr } from 'date-fns/locale';
import { toast } from 'react-hot-toast';
import { supabase } from '../lib/supabase';

interface TicketVersion {
  id: string;
  ticket_id: string;
  version_number: number;
  title: string;
  description: string;
  status: string;
  priority: string;
  category: string;
  assigned_to?: string;
  tags?: string[];
  custom_fields?: any;
  created_by: string;
  created_at: string;
  change_reason?: string;
  change_type: 'manual' | 'auto' | 'revert';
  previous_version_id?: string;
  user_name?: string;
  user_avatar?: string;
}

interface VersionChange {
  field_name: string;
  version1_value: string;
  version2_value: string;
  change_type: string;
}

interface TicketVersioningProps {
  ticketId: string;
  currentUser: any;
  onRefresh?: () => void;
  isCustomer?: boolean;
}

const TicketVersioning: React.FC<TicketVersioningProps> = ({ 
  ticketId, 
  currentUser, 
  onRefresh,
  isCustomer = false 
}) => {
  const [versions, setVersions] = useState<TicketVersion[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedVersions, setSelectedVersions] = useState<string[]>([]);
  const [comparison, setComparison] = useState<VersionChange[]>([]);
  const [showComparison, setShowComparison] = useState(false);
  const [expandedVersions, setExpandedVersions] = useState<Set<string>>(new Set());
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [showRevertModal, setShowRevertModal] = useState(false);
  const [revertReason, setRevertReason] = useState('');
  const [revertingToVersion, setRevertingToVersion] = useState<string>('');

  // Versiyonları yükle
  useEffect(() => {
    fetchVersions();
  }, [ticketId]);

  const fetchVersions = async () => {
    try {
      setLoading(true);
      
      console.log('Versiyonlar yükleniyor... Ticket ID:', ticketId);
      
      // RLS politikalarını bypass etmek için doğrudan sorgu
      const { data, error } = await supabase
        .from('ticket_versions')
        .select('*')
        .eq('ticket_id', ticketId)
        .order('version_number', { ascending: false });

      console.log('Versiyon sorgu sonucu:', { data, error });

      if (error) {
        console.error('Versiyon sorgu hatası:', error);
        throw error;
      }

      // Kullanıcı bilgilerini ekle
      const versionsWithUsers = data?.map(version => ({
        ...version,
        user_name: getDefaultUserName(version.created_by),
        user_avatar: null
      })) || [];

      console.log('İşlenmiş versiyonlar:', versionsWithUsers);
      setVersions(versionsWithUsers);
    } catch (error) {
      console.error('Versiyon yükleme hatası:', error);
      toast.error('Versiyonlar yüklenirken hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  const getDefaultUserName = (userId: string) => {
    // Gerçek uygulamada kullanıcı bilgileri alınacak
    return userId === currentUser?.id ? 'Siz' : 'Kullanıcı';
  };

  // Versiyon karşılaştırma
  const compareVersions = async (version1Id: string, version2Id: string) => {
    try {
      const { data, error } = await supabase
        .rpc('compare_ticket_versions', {
          p_version1_id: version1Id,
          p_version2_id: version2Id
        });

      if (error) throw error;

      setComparison(data || []);
      setShowComparison(true);
    } catch (error) {
      console.error('Versiyon karşılaştırma hatası:', error);
      toast.error('Versiyonlar karşılaştırılırken hata oluştu');
    }
  };

  // Versiyon seçimi
  const toggleVersionSelection = (versionId: string) => {
    const newSelection = [...selectedVersions];
    const index = newSelection.indexOf(versionId);
    
    if (index > -1) {
      newSelection.splice(index, 1);
    } else {
      if (newSelection.length < 2) {
        newSelection.push(versionId);
      } else {
        toast.error('En fazla 2 versiyon seçebilirsiniz');
        return;
      }
    }
    
    setSelectedVersions(newSelection);
  };

  // Versiyon geri alma
  const revertToVersion = async (targetVersionId: string) => {
    try {
      const targetVersion = versions.find(v => v.id === targetVersionId);
      if (!targetVersion) return;

      // Mevcut talep bilgilerini al
      const { data: currentTicket } = await supabase
        .from('tickets')
        .select('*')
        .eq('id', ticketId)
        .single();

      if (!currentTicket) {
        toast.error('Talep bulunamadı');
        return;
      }

      // Önce geri alma kaydı oluştur (kalıcı kayıt)
      const { error: revertError } = await supabase
        .from('ticket_version_reverts')
        .insert({
          ticket_id: ticketId,
          from_version_id: versions[0]?.id, // En son versiyon
          to_version_id: targetVersionId,
          reverted_by: currentUser?.id,
          revert_reason: revertReason || 'Kullanıcı tarafından geri alındı',
          reverted_at: new Date().toISOString(),
          is_active: true // Aktif geri alma kaydı
        });

      if (revertError) throw revertError;

      // Talep bilgilerini hedef versiyona göre güncelle
      const { error: updateError } = await supabase
        .from('tickets')
        .update({
          title: targetVersion.title,
          description: targetVersion.description,
          status: targetVersion.status,
          priority: targetVersion.priority,
          category: targetVersion.category,
          assigned_to: targetVersion.assigned_to,
          tags: targetVersion.tags,
          custom_fields: targetVersion.custom_fields,
          last_reverted_at: new Date().toISOString(), // Son geri alma tarihi
          last_reverted_by: currentUser?.id, // Son geri alan kullanıcı
          last_reverted_to_version: targetVersion.version_number // Hangi versiyona geri alındı
        })
        .eq('id', ticketId);

      if (updateError) throw updateError;

      // Yeni bir "revert" tipinde versiyon oluştur (geri alma kaydı)
      const { error: versionError } = await supabase
        .rpc('create_ticket_version', {
          p_ticket_id: ticketId,
          p_change_reason: `Versiyon ${targetVersion.version_number}'e geri alındı. Sebep: ${revertReason || 'Kullanıcı tarafından geri alındı'}`,
          p_change_type: 'revert'
        });

      if (versionError) {
        console.error('Geri alma versiyonu oluşturma hatası:', versionError);
        // Bu hata kritik değil, devam et
      }

      toast.success(`Versiyon ${targetVersion.version_number}'e başarıyla geri alındı. Bu işlem kalıcı olarak kaydedildi.`);
      setShowRevertModal(false);
      setRevertReason('');
      setRevertingToVersion('');
      
      // Sayfayı yenile
      if (onRefresh) onRefresh();
      fetchVersions();
    } catch (error) {
      console.error('Versiyon geri alma hatası:', error);
      toast.error('Versiyon geri alınırken hata oluştu');
    }
  };

  // Manuel versiyon oluşturma
  const createManualVersion = async (reason: string) => {
    try {
      const { error } = await supabase
        .rpc('create_ticket_version', {
          p_ticket_id: ticketId,
          p_change_reason: reason,
          p_change_type: 'manual'
        });

      if (error) throw error;

      toast.success('Yeni versiyon oluşturuldu');
      fetchVersions();
    } catch (error) {
      console.error('Versiyon oluşturma hatası:', error);
      toast.error('Versiyon oluşturulurken hata oluştu');
    }
  };

  // Filtreleme
  const filteredVersions = versions.filter(version => {
    const matchesFilter = filter === 'all' || version.change_type === filter;
    const matchesSearch = searchTerm === '' || 
      version.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      version.change_reason?.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesFilter && matchesSearch;
  });

  // Versiyon tipi ikonları
  const getVersionTypeIcon = (changeType: string) => {
    switch (changeType) {
      case 'manual':
        return <Edit className="w-4 h-4 text-blue-500" />;
      case 'auto':
        return <Settings className="w-4 h-4 text-green-500" />;
      case 'revert':
        return <RotateCcw className="w-4 h-4 text-orange-500" />;
      default:
        return <GitBranch className="w-4 h-4 text-gray-500" />;
    }
  };

  // Versiyon tipi renkleri
  const getVersionTypeColor = (changeType: string) => {
    switch (changeType) {
      case 'manual':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400';
      case 'auto':
        return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400';
      case 'revert':
        return 'bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400';
    }
  };

  // Durum metni
  const getStatusText = (status: string) => {
    const statuses: {[key: string]: string} = {
      'open': 'Açık',
      'in_progress': 'İşlemde',
      'resolved': 'Çözüldü',
      'closed': 'Kapalı',
      'draft': 'Taslak'
    };
    return statuses[status] || status;
  };

  // Öncelik metni
  const getPriorityText = (priority: string) => {
    const priorities: {[key: string]: string} = {
      'low': 'Düşük',
      'medium': 'Orta',
      'high': 'Yüksek',
      'urgent': 'Acil'
    };
    return priorities[priority] || priority;
  };

  // Kategori metni
  const getCategoryText = (category: string) => {
    const categories: {[key: string]: string} = {
      'general': 'Genel',
      'technical': 'Teknik',
      'billing': 'Faturalama',
      'feature_request': 'Özellik Talebi',
      'bug_report': 'Hata Bildirimi',
      'payment_reminder': 'Ödeme',
      'support': 'Destek'
    };
    return categories[category] || category;
  };

  // Versiyon detaylarını göster/gizle
  const toggleExpanded = (versionId: string) => {
    const newExpanded = new Set(expandedVersions);
    if (newExpanded.has(versionId)) {
      newExpanded.delete(versionId);
    } else {
      newExpanded.add(versionId);
    }
    setExpandedVersions(newExpanded);
  };

  // Versiyon render etme
  const renderVersion = (version: TicketVersion) => {
    const isExpanded = expandedVersions.has(version.id);
    const isSelected = selectedVersions.includes(version.id);

    return (
      <div key={version.id} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className={`p-4 ${isSelected ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-700' : ''}`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <input
                type="checkbox"
                checked={isSelected}
                onChange={() => toggleVersionSelection(version.id)}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              
              <div className="flex items-center space-x-2">
                <div className="p-2 bg-gray-100 dark:bg-gray-700 rounded-lg">
                  {getVersionTypeIcon(version.change_type)}
                </div>
                
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="text-lg font-semibold text-gray-900 dark:text-white">
                      v{version.version_number}
                    </span>
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getVersionTypeColor(version.change_type)}`}>
                      {version.change_type === 'manual' ? 'Manuel' :
                       version.change_type === 'auto' ? 'Otomatik' :
                       version.change_type === 'revert' ? 'Geri Alma' : 'Bilinmeyen'}
                    </span>
                  </div>
                  
                  <div className="flex items-center space-x-2 text-sm text-gray-500 dark:text-gray-400">
                    <Clock className="w-3 h-3" />
                    <span>{formatDistanceToNow(new Date(version.created_at), { addSuffix: true, locale: tr })}</span>
                    <span>•</span>
                    <User className="w-3 h-3" />
                    <span>{version.user_name}</span>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <button
                onClick={() => toggleExpanded(version.id)}
                className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>
              
              <div className="relative">
                <button className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors">
                  <MoreHorizontal className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
          
          <div className="mt-3">
            <h4 className="font-medium text-gray-900 dark:text-white mb-1">
              {version.title}
            </h4>
            
            {version.change_reason && (
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {version.change_reason}
              </p>
            )}
          </div>
        </div>
        
        {/* Detaylar */}
        {isExpanded && (
          <div className="border-t border-gray-200 dark:border-gray-700 p-4 bg-gray-50 dark:bg-gray-700/50">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h5 className="text-sm font-medium text-gray-900 dark:text-white mb-2">Talep Bilgileri</h5>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-500 dark:text-gray-400">Durum:</span>
                    <span className="font-medium">{getStatusText(version.status)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500 dark:text-gray-400">Öncelik:</span>
                    <span className="font-medium">{getPriorityText(version.priority)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500 dark:text-gray-400">Kategori:</span>
                    <span className="font-medium">{getCategoryText(version.category)}</span>
                  </div>
                </div>
              </div>
              
              <div>
                <h5 className="text-sm font-medium text-gray-900 dark:text-white mb-2">Açıklama</h5>
                <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-3">
                  {version.description || 'Açıklama yok'}
                </p>
              </div>
            </div>
            
            <div className="mt-4 flex items-center justify-between">
              <div className="flex items-center space-x-2 text-xs text-gray-500 dark:text-gray-400">
                <Calendar className="w-3 h-3" />
                <span>{format(new Date(version.created_at), 'dd MMMM yyyy HH:mm', { locale: tr })}</span>
              </div>
              
              <div className="flex items-center space-x-2">
                {!isCustomer && (
                  <button
                    onClick={() => {
                      setRevertingToVersion(version.id);
                      setShowRevertModal(true);
                    }}
                    className="flex items-center space-x-1 px-3 py-1 text-xs text-orange-600 dark:text-orange-400 hover:bg-orange-50 dark:hover:bg-orange-900/20 rounded-lg transition-colors"
                  >
                    <RotateCcw className="w-3 h-3" />
                    <span>Geri Al</span>
                  </button>
                )}
                
                                 <button
                   onClick={() => {
                     if (selectedVersions.length === 1) {
                       toggleVersionSelection(version.id);
                     }
                     if (selectedVersions.length === 2) {
                       compareVersions(selectedVersions[0], selectedVersions[1]);
                     }
                   }}
                   className="flex items-center space-x-1 px-3 py-1 text-xs text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                 >
                   <GitCompare className="w-3 h-3" />
                   <span>Karşılaştır</span>
                 </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2 text-gray-600 dark:text-gray-400">Versiyonlar yükleniyor...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-purple-100 dark:bg-purple-900/20 rounded-lg">
            <GitBranch className="w-5 h-5 text-purple-600 dark:text-purple-400" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Talep Versiyonları
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {versions.length} versiyon kaydı
            </p>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
                     {selectedVersions.length === 2 && (
             <button
               onClick={() => compareVersions(selectedVersions[0], selectedVersions[1])}
               className="flex items-center space-x-2 px-3 py-2 text-sm text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
             >
               <GitCompare className="w-4 h-4" />
               <span>Karşılaştır</span>
             </button>
           )}
          
          {!isCustomer && (
            <button
              onClick={() => {
                const reason = prompt('Versiyon oluşturma sebebi:');
                if (reason) createManualVersion(reason);
              }}
              className="flex items-center space-x-2 px-3 py-2 text-sm text-green-600 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-lg transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>Yeni Versiyon</span>
            </button>
          )}
          
          <button
            onClick={fetchVersions}
            className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            title="Yenile"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Filtreler */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Arama */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Versiyon ara..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Tip filtresi */}
          <div>
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">Tüm Versiyonlar</option>
              <option value="manual">Manuel</option>
              <option value="auto">Otomatik</option>
              <option value="revert">Geri Alma</option>
            </select>
          </div>
        </div>
      </div>

      {/* Seçim bilgisi */}
      {selectedVersions.length > 0 && (
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-xl p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Info className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              <span className="text-sm text-blue-800 dark:text-blue-300">
                {selectedVersions.length} versiyon seçildi
              </span>
            </div>
            
            <button
              onClick={() => setSelectedVersions([])}
              className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
            >
              Seçimi Temizle
            </button>
          </div>
        </div>
      )}

      {/* Versiyonlar listesi */}
      <div className="space-y-4">
        {filteredVersions.length === 0 ? (
          <div className="text-center py-12">
            <GitBranch className="w-16 h-16 mx-auto mb-4 text-gray-400" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              Versiyon Bulunamadı
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              {searchTerm || filter !== 'all'
                ? 'Arama kriterlerinize uygun versiyon bulunamadı.'
                : 'Bu talep için henüz versiyon kaydı bulunmuyor. Talep üzerinde değişiklik yapıldığında otomatik olarak versiyon oluşturulacak.'}
            </p>
            {!isCustomer && (
              <button
                onClick={() => {
                  const reason = prompt('İlk versiyon oluşturma sebebi:');
                  if (reason) createManualVersion(reason);
                }}
                className="inline-flex items-center space-x-2 px-4 py-2 text-sm text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors border border-blue-200 dark:border-blue-700"
              >
                <Plus className="w-4 h-4" />
                <span>İlk Versiyonu Oluştur</span>
              </button>
            )}
          </div>
        ) : (
          filteredVersions.map(renderVersion)
        )}
      </div>

      {/* Karşılaştırma Modal */}
      {showComparison && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Versiyon Karşılaştırması
                </h3>
                <button
                  onClick={() => setShowComparison(false)}
                  className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
            
            <div className="p-6">
              <div className="space-y-4">
                {comparison.map((change, index) => (
                  <div key={index} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-medium text-gray-900 dark:text-white capitalize">
                        {change.field_name === 'title' ? 'Başlık' :
                         change.field_name === 'description' ? 'Açıklama' :
                         change.field_name === 'status' ? 'Durum' :
                         change.field_name === 'priority' ? 'Öncelik' :
                         change.field_name === 'category' ? 'Kategori' : change.field_name}
                      </h4>
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                        change.change_type === 'modified' 
                          ? 'bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400'
                          : 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400'
                      }`}>
                        {change.change_type === 'modified' ? 'Değiştirildi' : 'Değişmedi'}
                      </span>
                    </div>
                    
                    {change.change_type === 'modified' && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <div className="flex items-center space-x-2 mb-2">
                            <Minus className="w-4 h-4 text-red-500" />
                            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Önceki</span>
                          </div>
                          <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-lg">
                            <p className="text-sm text-gray-900 dark:text-white">
                              {change.field_name === 'status' ? getStatusText(change.version1_value) :
                               change.field_name === 'priority' ? getPriorityText(change.version1_value) :
                               change.field_name === 'category' ? getCategoryText(change.version1_value) :
                               change.version1_value || 'Boş'}
                            </p>
                          </div>
                        </div>
                        
                        <div>
                          <div className="flex items-center space-x-2 mb-2">
                            <Plus className="w-4 h-4 text-green-500" />
                            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Yeni</span>
                          </div>
                          <div className="p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700 rounded-lg">
                            <p className="text-sm text-gray-900 dark:text-white">
                              {change.field_name === 'status' ? getStatusText(change.version2_value) :
                               change.field_name === 'priority' ? getPriorityText(change.version2_value) :
                               change.field_name === 'category' ? getCategoryText(change.version2_value) :
                               change.version2_value || 'Boş'}
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Geri Alma Modal */}
      {showRevertModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-xl max-w-md w-full mx-4">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-orange-100 dark:bg-orange-900/20 rounded-lg">
                  <AlertTriangle className="w-5 h-5 text-orange-600 dark:text-orange-400" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Versiyona Geri Al
                </h3>
              </div>
            </div>
            
            <div className="p-6">
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                Bu işlem mevcut talep bilgilerini seçilen versiyona geri alacaktır. Bu işlem geri alınamaz.
              </p>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Geri Alma Sebebi
                  </label>
                  <textarea
                    value={revertReason}
                    onChange={(e) => setRevertReason(e.target.value)}
                    placeholder="Geri alma sebebini belirtin..."
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    rows={3}
                  />
                </div>
              </div>
            </div>
            
            <div className="p-6 border-t border-gray-200 dark:border-gray-700 flex items-center justify-end space-x-3">
              <button
                onClick={() => {
                  setShowRevertModal(false);
                  setRevertReason('');
                  setRevertingToVersion('');
                }}
                className="px-4 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                İptal
              </button>
              <button
                onClick={() => revertToVersion(revertingToVersion)}
                className="px-4 py-2 text-sm text-white bg-orange-600 hover:bg-orange-700 rounded-lg transition-colors"
              >
                Geri Al
              </button>
            </div>
          </div>
        </div>
      )}

      {/* İstatistikler */}
      {versions.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="flex items-center space-x-2">
              <GitBranch className="w-5 h-5 text-purple-600 dark:text-purple-400" />
              <span className="text-sm font-medium text-gray-900 dark:text-white">
                Toplam Versiyon
              </span>
            </div>
            <p className="text-2xl font-bold text-gray-900 dark:text-white mt-2">
              {versions.length}
            </p>
          </div>
          
          <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="flex items-center space-x-2">
              <Edit className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              <span className="text-sm font-medium text-gray-900 dark:text-white">
                Manuel
              </span>
            </div>
            <p className="text-2xl font-bold text-gray-900 dark:text-white mt-2">
              {versions.filter(v => v.change_type === 'manual').length}
            </p>
          </div>
          
          <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="flex items-center space-x-2">
              <Settings className="w-5 h-5 text-green-600 dark:text-green-400" />
              <span className="text-sm font-medium text-gray-900 dark:text-white">
                Otomatik
              </span>
            </div>
            <p className="text-2xl font-bold text-gray-900 dark:text-white mt-2">
              {versions.filter(v => v.change_type === 'auto').length}
            </p>
          </div>
          
          <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="flex items-center space-x-2">
              <RotateCcw className="w-5 h-5 text-orange-600 dark:text-orange-400" />
              <span className="text-sm font-medium text-gray-900 dark:text-white">
                Geri Alma
              </span>
            </div>
            <p className="text-2xl font-bold text-gray-900 dark:text-white mt-2">
              {versions.filter(v => v.change_type === 'revert').length}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default TicketVersioning;
