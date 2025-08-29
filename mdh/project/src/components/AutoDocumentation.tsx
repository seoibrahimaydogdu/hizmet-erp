import React, { useState, useEffect, useRef } from 'react';
import { 
  FileText, 
  Save, 
  Edit, 
  Download, 
  Share2, 
  Clock, 
  User, 
  Tag,
  CheckCircle,
  AlertCircle,
  X,
  Plus,
  Search,
  Filter
} from 'lucide-react';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';
import { toast } from 'react-hot-toast';

interface Documentation {
  id: string;
  ticketId: string;
  customerId: string;
  agentId: string;
  title: string;
  summary: string;
  keyPoints: string[];
  actions: Action[];
  resolution: string;
  category: string;
  priority: 'low' | 'medium' | 'high';
  status: 'draft' | 'completed' | 'reviewed';
  createdAt: Date;
  updatedAt: Date;
  tags: string[];
  attachments?: string[];
}

interface Action {
  id: string;
  description: string;
  type: 'escalation' | 'refund' | 'replacement' | 'technical' | 'policy' | 'other';
  status: 'pending' | 'completed' | 'cancelled';
  assignedTo?: string;
  dueDate?: Date;
}

interface AutoDocumentationProps {
  ticket: any;
  conversationHistory: any[];
  currentUser: any;
  onSave?: (doc: Documentation) => void;
  onUpdate?: (doc: Documentation) => void;
}

const AutoDocumentation: React.FC<AutoDocumentationProps> = ({
  ticket,
  conversationHistory,
  currentUser,
  onSave,
  onUpdate
}) => {
  const [documentation, setDocumentation] = useState<Documentation | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');

  // Otomatik dokümantasyon oluşturma
  const generateDocumentation = async () => {
    setIsGenerating(true);
    
    try {
      // Gerçek uygulamada burada AI API'si çağrılacak
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const conversationText = conversationHistory
        .map(msg => `${msg.sender}: ${msg.content}`)
        .join('\n');
      
      // AI analizi simülasyonu
      const analysis = analyzeConversation(conversationText);
      
      const newDoc: Documentation = {
        id: `doc-${Date.now()}`,
        ticketId: ticket.id,
        customerId: ticket.customer_id,
        agentId: currentUser.id,
        title: analysis.title,
        summary: analysis.summary,
        keyPoints: analysis.keyPoints,
        actions: analysis.actions,
        resolution: analysis.resolution,
        category: analysis.category,
        priority: analysis.priority,
        status: 'draft',
        createdAt: new Date(),
        updatedAt: new Date(),
        tags: analysis.tags
      };
      
      setDocumentation(newDoc);
      toast.success('Dokümantasyon otomatik oluşturuldu');
    } catch (error) {
      toast.error('Dokümantasyon oluşturulurken hata oluştu');
    } finally {
      setIsGenerating(false);
    }
  };

  // Konuşma analizi (simülasyon)
  const analyzeConversation = (text: string) => {
    const analysis = {
      title: '',
      summary: '',
      keyPoints: [] as string[],
      actions: [] as Action[],
      resolution: '',
      category: '',
      priority: 'medium' as const,
      tags: [] as string[]
    };

    if (text.toLowerCase().includes('iade') || text.toLowerCase().includes('refund')) {
      analysis.title = 'İade Talebi - Müşteri Memnuniyeti';
      analysis.summary = 'Müşteri satın aldığı ürünü iade etmek istedi. Ürün hasarlı geldiği belirtildi.';
      analysis.keyPoints = [
        'Müşteri ürünü hasarlı aldığını belirtti',
        '30 günlük iade süresi içinde',
        'İade koşulları açıklandı'
      ];
      analysis.actions = [
        {
          id: 'action-1',
          description: 'İade etiketi oluşturuldu',
          type: 'refund',
          status: 'completed'
        },
        {
          id: 'action-2',
          description: 'Müşteriye iade süreci açıklandı',
          type: 'policy',
          status: 'completed'
        }
      ];
      analysis.resolution = 'İade işlemi başlatıldı. Müşteri memnun kaldı.';
      analysis.category = 'İade/Değişim';
      analysis.priority = 'high';
      analysis.tags = ['iade', 'müşteri memnuniyeti', 'hasar'];
    } else if (text.toLowerCase().includes('teknik') || text.toLowerCase().includes('sorun')) {
      analysis.title = 'Teknik Destek Talebi';
      analysis.summary = 'Müşteri teknik bir sorun yaşadığını belirtti.';
      analysis.keyPoints = [
        'Teknik sorun tespit edildi',
        'Müşteriye çözüm önerileri sunuldu',
        'Gerekirse teknik destek ekibine yönlendirme yapıldı'
      ];
      analysis.actions = [
        {
          id: 'action-1',
          description: 'Teknik destek ekibine yönlendirildi',
          type: 'technical',
          status: 'pending'
        }
      ];
      analysis.resolution = 'Teknik destek ekibi sorunu çözdü.';
      analysis.category = 'Teknik Destek';
      analysis.priority = 'medium';
      analysis.tags = ['teknik destek', 'sorun çözümü'];
    } else {
      analysis.title = 'Genel Müşteri Hizmetleri';
      analysis.summary = 'Müşteri ile genel bir konuşma gerçekleştirildi.';
      analysis.keyPoints = [
        'Müşteri soruları yanıtlandı',
        'Gerekli bilgiler verildi'
      ];
      analysis.actions = [];
      analysis.resolution = 'Müşteri memnun kaldı.';
      analysis.category = 'Genel';
      analysis.priority = 'low';
      analysis.tags = ['genel', 'bilgilendirme'];
    }

    return analysis;
  };

  const handleSave = async () => {
    if (!documentation) return;
    
    try {
      const updatedDoc = {
        ...documentation,
        status: 'completed',
        updatedAt: new Date()
      };
      
      setDocumentation(updatedDoc);
      onSave?.(updatedDoc);
      setIsEditing(false);
      toast.success('Dokümantasyon kaydedildi');
    } catch (error) {
      toast.error('Kaydetme sırasında hata oluştu');
    }
  };

  const handleExport = (format: 'pdf' | 'docx' | 'txt') => {
    if (!documentation) return;
    
    toast.success(`${format.toUpperCase()} formatında dışa aktarılıyor...`);
    // Gerçek uygulamada burada export işlemi yapılacak
  };

  const handleShare = () => {
    if (!documentation) return;
    
    // Gerçek uygulamada burada paylaşım işlemi yapılacak
    toast.success('Dokümantasyon paylaşıldı');
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'text-red-600 bg-red-100 dark:bg-red-900/20';
      case 'medium': return 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900/20';
      case 'low': return 'text-green-600 bg-green-100 dark:bg-green-900/20';
      default: return 'text-gray-600 bg-gray-100 dark:bg-gray-900/20';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'text-green-600 bg-green-100 dark:bg-green-900/20';
      case 'draft': return 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900/20';
      case 'reviewed': return 'text-blue-600 bg-blue-100 dark:bg-blue-900/20';
      default: return 'text-gray-600 bg-gray-100 dark:bg-gray-900/20';
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <FileText className="w-6 h-6 text-blue-600" />
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Otomatik Dokümantasyon
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                AI destekli konuşma özeti ve rapor oluşturma
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            {!documentation && (
              <button
                onClick={generateDocumentation}
                disabled={isGenerating}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {isGenerating ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Oluşturuluyor...
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4" />
                    Oluştur
                  </>
                )}
              </button>
            )}
            
            {documentation && (
              <>
                <button
                  onClick={() => setIsEditing(!isEditing)}
                  className="p-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
                >
                  <Edit className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setShowModal(true)}
                  className="p-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
                >
                  <Download className="w-4 h-4" />
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        {!documentation ? (
          <div className="text-center py-8">
            <FileText className="w-16 h-16 mx-auto text-gray-400 mb-4" />
            <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              Dokümantasyon Henüz Oluşturulmadı
            </h4>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Konuşma tamamlandıktan sonra AI destekli dokümantasyon oluşturabilirsiniz.
            </p>
            <button
              onClick={generateDocumentation}
              disabled={isGenerating}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {isGenerating ? 'Oluşturuluyor...' : 'Dokümantasyon Oluştur'}
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Header Info */}
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h4 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                  {documentation.title}
                </h4>
                <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                  <span className="flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    {format(documentation.createdAt, 'dd MMM yyyy HH:mm', { locale: tr })}
                  </span>
                  <span className="flex items-center gap-1">
                    <User className="w-4 h-4" />
                    {currentUser.name}
                  </span>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(documentation.priority)}`}>
                  {documentation.priority === 'high' ? 'Yüksek' : documentation.priority === 'medium' ? 'Orta' : 'Düşük'} Öncelik
                </span>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(documentation.status)}`}>
                  {documentation.status === 'completed' ? 'Tamamlandı' : documentation.status === 'draft' ? 'Taslak' : 'İncelendi'}
                </span>
              </div>
            </div>

            {/* Summary */}
            <div>
              <h5 className="text-lg font-medium text-gray-900 dark:text-white mb-2">Özet</h5>
              <p className="text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-900/50 p-3 rounded-lg">
                {documentation.summary}
              </p>
            </div>

            {/* Key Points */}
            <div>
              <h5 className="text-lg font-medium text-gray-900 dark:text-white mb-2">Ana Noktalar</h5>
              <ul className="space-y-2">
                {documentation.keyPoints.map((point, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                    <span className="text-gray-700 dark:text-gray-300">{point}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Actions */}
            {documentation.actions.length > 0 && (
              <div>
                <h5 className="text-lg font-medium text-gray-900 dark:text-white mb-2">Yapılan İşlemler</h5>
                <div className="space-y-2">
                  {documentation.actions.map((action) => (
                    <div key={action.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-900/50 rounded-lg">
                      <div className="flex items-center gap-2">
                        <span className={`w-2 h-2 rounded-full ${
                          action.status === 'completed' ? 'bg-green-500' : 
                          action.status === 'pending' ? 'bg-yellow-500' : 'bg-red-500'
                        }`}></span>
                        <span className="text-gray-700 dark:text-gray-300">{action.description}</span>
                      </div>
                      <span className="text-xs text-gray-500 dark:text-gray-400 capitalize">
                        {action.status === 'completed' ? 'Tamamlandı' : 
                         action.status === 'pending' ? 'Bekliyor' : 'İptal'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Resolution */}
            <div>
              <h5 className="text-lg font-medium text-gray-900 dark:text-white mb-2">Çözüm</h5>
              <p className="text-gray-700 dark:text-gray-300 bg-green-50 dark:bg-green-900/10 p-3 rounded-lg border-l-4 border-green-500">
                {documentation.resolution}
              </p>
            </div>

            {/* Tags */}
            {documentation.tags.length > 0 && (
              <div>
                <h5 className="text-lg font-medium text-gray-900 dark:text-white mb-2">Etiketler</h5>
                <div className="flex flex-wrap gap-2">
                  {documentation.tags.map((tag, index) => (
                    <span key={index} className="px-2 py-1 bg-blue-100 dark:bg-blue-900/20 text-blue-800 dark:text-blue-300 text-xs rounded-full">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex items-center gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
              <button
                onClick={handleSave}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2"
              >
                <Save className="w-4 h-4" />
                Kaydet
              </button>
              <button
                onClick={() => handleExport('pdf')}
                className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 flex items-center gap-2"
              >
                <Download className="w-4 h-4" />
                PDF
              </button>
              <button
                onClick={handleShare}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
              >
                <Share2 className="w-4 h-4" />
                Paylaş
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Export Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-96">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Dışa Aktar
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="space-y-3">
              <button
                onClick={() => { handleExport('pdf'); setShowModal(false); }}
                className="w-full p-3 text-left border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-3"
              >
                <FileText className="w-5 h-5 text-red-500" />
                <div>
                  <div className="font-medium text-gray-900 dark:text-white">PDF Formatı</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Yazdırılabilir doküman</div>
                </div>
              </button>
              
              <button
                onClick={() => { handleExport('docx'); setShowModal(false); }}
                className="w-full p-3 text-left border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-3"
              >
                <FileText className="w-5 h-5 text-blue-500" />
                <div>
                  <div className="font-medium text-gray-900 dark:text-white">Word Formatı</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Düzenlenebilir doküman</div>
                </div>
              </button>
              
              <button
                onClick={() => { handleExport('txt'); setShowModal(false); }}
                className="w-full p-3 text-left border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-3"
              >
                <FileText className="w-5 h-5 text-gray-500" />
                <div>
                  <div className="font-medium text-gray-900 dark:text-white">Metin Formatı</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Basit metin dosyası</div>
                </div>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AutoDocumentation;
