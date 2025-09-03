import React, { useState, useEffect } from 'react';
import { X, Send, AlertCircle, Lightbulb, MessageSquare, FileText, CheckCircle } from 'lucide-react';
import { useSupabase } from '../../hooks/useSupabase';
import { useUser } from '../../contexts/UserContext';

interface FeedbackModalProps {
  isOpen: boolean;
  onClose: () => void;
  pageSource?: string;
}

interface FeedbackData {
  subject: string;
  message: string;
  type: 'error' | 'feature' | 'general' | 'other' | '';
  pageSource: string;
  userId?: string; // Artık kullanılmıyor - foreign key constraint hatası nedeniyle
  userName?: string;
  browserInfo: string;
  osInfo: string;
  timestamp: string;
  emotionalImpactScore: number;
  tags: string[];
}

const FeedbackModal: React.FC<FeedbackModalProps> = ({ isOpen, onClose, pageSource }) => {
  const { supabase } = useSupabase();
  const { userProfile } = useUser();
  
  const [feedback, setFeedback] = useState<FeedbackData>({
    subject: '',
    message: '',
    type: '', // Boş başlangıç - zorunlu seçim için
    pageSource: pageSource || 'Unknown',
    userId: undefined, // user_id kullanılmıyor - foreign key constraint hatası nedeniyle
    browserInfo: '',
    osInfo: '',
    timestamp: new Date().toISOString(),
    emotionalImpactScore: 5,
    tags: []
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [showSuccess, setShowSuccess] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  // Geri bildirim türüne göre etiketleri tanımla
  const getTagsByType = (type: string): { category: string; tags: string[] }[] => {
    switch (type) {
      case 'error':
        return [
          {
            category: 'Hata Türleri',
            tags: ['Sistem Hatası', 'Sistem Çökmesi', 'Veri Kaybı', 'Oturum Hatası']
          },
          {
            category: 'Performans',
            tags: ['Performans', 'Yavaşlık', 'Bağlantı Sorunu']
          },
          {
            category: 'Kullanım',
            tags: ['Kullanılabilirlik Sorunu', 'Mobil Uygulama', 'Entegrasyon']
          },
          {
            category: 'Güvenlik',
            tags: ['Güvenlik', 'Ödeme']
          }
        ];
      case 'feature':
        return [
          {
            category: 'Özellikler',
            tags: ['Özellik Talebi', 'Dashboard', 'Workflow', 'API']
          },
          {
            category: 'Kullanıcı Deneyimi',
            tags: ['Kullanılabilirlik İyileştirmesi', 'Özelleştirme', 'Bildirimler']
          },
          {
            category: 'Analitik',
            tags: ['Raporlama', 'Analitik', 'Otomasyon']
          },
          {
            category: 'Platform',
            tags: ['Mobil Uygulama', 'Entegrasyon']
          }
        ];
      case 'general':
        return [
          {
            category: 'Genel',
            tags: ['Genel Görüş', 'Memnuniyet', 'Öneriler', 'Değerlendirme']
          },
          {
            category: 'Kullanıcı Deneyimi',
            tags: ['Kullanıcı Deneyimi', 'Tasarım', 'Kalite', 'Hız', 'Erişilebilirlik']
          },
          {
            category: 'Destek',
            tags: ['Destek', 'Eğitim', 'Dokümantasyon', 'Yardım']
          },
          {
            category: 'Geliştirme',
            tags: ['Geliştirme', 'Yenilik', 'Güncelleme']
          }
        ];
      case 'other':
        return [
          {
            category: 'İş',
            tags: ['İş Ortaklığı', 'Özel Proje', 'Danışmanlık', 'Strateji']
          },
          {
            category: 'Satış',
            tags: ['Satış', 'Pazarlama', 'Fiyatlandırma', 'Müşteri Kazanımı']
          },
          {
            category: 'Destek',
            tags: ['Teknik Destek', 'Müşteri Hizmetleri', 'Eğitim', 'Onboarding']
          },
          {
            category: 'Diğer',
            tags: ['Diğer', 'Özel Talep', 'Lisans', 'Yasal']
          }
        ];
      default:
        return [];
    }
  };

  // Geri bildirim türü değiştiğinde etiketleri sıfırla
  const handleTypeChange = (newType: string) => {
    setFeedback(prev => ({ 
      ...prev, 
      type: newType as any,
      tags: [] // Tür değiştiğinde etiketleri sıfırla
    }));
  };

  useEffect(() => {
    if (isOpen) {
      const userAgent = navigator.userAgent;
      const browserInfo = getBrowserInfo(userAgent);
      const osInfo = getOSInfo(userAgent);
      
      setFeedback(prev => ({
        ...prev,
        pageSource: pageSource || 'Unknown',
        userId: undefined, // user_id kullanılmıyor - foreign key constraint hatası nedeniyle
        userName: userProfile?.name || userProfile?.email || 'Misafir Kullanıcı',
        browserInfo,
        osInfo,
        timestamp: new Date().toISOString(),
        emotionalImpactScore: 5,
        type: '', // Zorunlu seçim için sıfırla
        tags: []
      }));
    }
  }, [isOpen, pageSource, userProfile]);

  const getBrowserInfo = (userAgent: string): string => {
    if (userAgent.includes('Chrome')) return 'Chrome';
    if (userAgent.includes('Firefox')) return 'Firefox';
    if (userAgent.includes('Safari')) return 'Safari';
    if (userAgent.includes('Edge')) return 'Edge';
    return 'Unknown Browser';
  };

  const getOSInfo = (userAgent: string): string => {
    if (userAgent.includes('Windows')) return 'Windows';
    if (userAgent.includes('Mac')) return 'macOS';
    if (userAgent.includes('Linux')) return 'Linux';
    if (userAgent.includes('Android')) return 'Android';
    if (userAgent.includes('iOS')) return 'iOS';
    return 'Unknown OS';
  };

  const countWords = (text: string): number => {
    if (!text.trim()) return 0;
    const words = text.trim().split(/\s+/).filter(word => word.length > 0);
    return words.length;
  };

  const generateSuccessMessage = (subject: string, type: string): string => {
    const lowerSubject = subject.toLowerCase();
    const lowerType = type.toLowerCase();
    
    if (lowerSubject.includes('hata') || lowerSubject.includes('error') || lowerSubject.includes('bug')) {
      return `Teşekkürler! "${subject}" hatasını hemen inceleyeceğiz ve en kısa sürede çözeceğiz.`;
    }
    
    if (lowerSubject.includes('ödeme') || lowerSubject.includes('payment') || lowerSubject.includes('billing')) {
      return `Teşekkürler! "${subject}" konusundaki ödeme sorununuzu öncelikli olarak ele alacağız.`;
    }
    
    if (lowerSubject.includes('performans') || lowerSubject.includes('performance') || lowerSubject.includes('yavaş')) {
      return `Teşekkürler! "${subject}" performans sorununu analiz edip optimize edeceğiz.`;
    }
    
    if (lowerSubject.includes('güvenlik') || lowerSubject.includes('security') || lowerSubject.includes('privacy')) {
      return `Teşekkürler! "${subject}" güvenlik konusunu en yüksek öncelikle değerlendireceğiz.`;
    }
    
    if (lowerSubject.includes('mobil') || lowerSubject.includes('mobile') || lowerSubject.includes('app')) {
      return `Teşekkürler! "${subject}" mobil uygulama konusundaki geri bildiriminizi değerlendireceğiz.`;
    }
    
    if (lowerType === 'error') {
      return `Teşekkürler! "${subject}" hatasını hemen inceleyeceğiz ve çözeceğiz.`;
    }
    
    if (lowerType === 'feature') {
      return `Teşekkürler! "${subject}" özellik talebinizi değerlendirip geliştirme planımıza ekleyeceğiz.`;
    }
    
    if (lowerType === 'general') {
      return `Teşekkürler! "${subject}" konusundaki görüşünüz bizim için çok değerli.`;
    }
    
    return `Teşekkürler! "${subject}" konusundaki geri bildiriminizi değerlendireceğiz.`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!feedback.subject.trim() || !feedback.message.trim()) {
      setError('Lütfen konu ve mesaj alanlarını doldurun.');
      return;
    }

    if (!feedback.type) {
      setError('Lütfen geri bildirim türünü seçin.');
      return;
    }

    if (feedback.tags.length === 0) {
      setError('Lütfen en az bir etiket seçin.');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      // Guest kullanıcılar için user_id alanını hiç gönderme
      const feedbackData: any = {
        subject: feedback.subject,
        message: feedback.message,
        type: feedback.type,
        page_source: feedback.pageSource,
        user_name: feedback.userName || 'Misafir Kullanıcı',
        browser_info: feedback.browserInfo,
        os_info: feedback.osInfo,
        timestamp: feedback.timestamp,
        emotional_impact_score: feedback.emotionalImpactScore,
        tags: feedback.tags
      };

      // user_id alanını hiç gönderme - foreign key constraint hatası nedeniyle
      // user_name ile kullanıcı bilgisi saklanacak

      const { error: insertError } = await supabase
        .from('feedback_requests')
        .insert([feedbackData]);

      if (insertError) {
        throw insertError;
      }

      const message = generateSuccessMessage(feedback.subject, feedback.type);
      setSuccessMessage(message);
      setShowSuccess(true);
      
                           setTimeout(() => {
          setFeedback({
            subject: '',
            message: '',
            type: '', // Zorunlu seçim için sıfırla
            pageSource: pageSource || 'Unknown',
            userId: undefined, // user_id kullanılmıyor - foreign key constraint hatası nedeniyle
            userName: userProfile?.name || userProfile?.email || 'Misafir Kullanıcı',
            browserInfo: '',
            osInfo: '',
            timestamp: new Date().toISOString(),
            emotionalImpactScore: 5,
            tags: []
          });
          setShowSuccess(false);
          onClose();
        }, 3000);
    } catch (err) {
      console.error('Feedback submission error:', err);
      
      if (err && typeof err === 'object' && 'message' in err) {
        setError(`Hata: ${err.message}`);
      } else {
        setError('Geri bildirim gönderilirken bir hata oluştu. Lütfen tekrar deneyin.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-30 p-4">
      {showSuccess && (
        <div className="fixed inset-0 pointer-events-none z-40">
          {[...Array(50)].map((_, i) => (
            <div
              key={i}
              className="absolute animate-bounce"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 2}s`,
                animationDuration: `${1 + Math.random() * 2}s`
              }}
            >
              <div
                className="w-2 h-2 rounded-full"
                style={{
                  backgroundColor: ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD', '#98D8C8'][Math.floor(Math.random() * 7)]
                }}
              />
            </div>
          ))}
        </div>
      )}
      
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center gap-3">
            <MessageSquare className="text-blue-600" size={24} />
            <h2 className="text-xl font-semibold text-gray-900">Geri Bildirimde Bulun</h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        <div className="p-6">
          {showSuccess ? (
            <div className="text-center py-8">
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle className="w-12 h-12 text-green-600" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Geri Bildiriminiz Alındı! 🎉</h3>
              <p className="text-lg text-gray-700 leading-relaxed mb-6">
                {successMessage}
              </p>
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <p className="text-sm text-green-700">
                  💡 Geri bildiriminiz ekibimize iletildi. En kısa sürede size dönüş yapacağız.
                </p>
              </div>
            </div>
          ) : (
            <>
              <p className="text-gray-600 mb-4">
                Ürünümüzü geliştirmemize yardımcı olun! Lütfen karşılaştığınız sorunu, 
                özellik talebinizi veya genel yorumunuzu bizimle paylaşın.
              </p>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Konu <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={feedback.subject}
                    onChange={(e) => setFeedback(prev => ({ ...prev, subject: e.target.value }))}
                    placeholder="Kısa bir başlık girin, örneğin: Ödeme hatası"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Mesaj <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    value={feedback.message}
                    onChange={(e) => setFeedback(prev => ({ ...prev, message: e.target.value }))}
                    placeholder="Lütfen detaylı açıklayın."
                    rows={6}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                    required
                  />
                  <p className="text-sm text-gray-500 mt-1">
                    {countWords(feedback.message)} kelime
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Geri Bildiriminizin Türü <span className="text-red-500">*</span>
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { value: 'error', label: 'Hata Bildirimi', icon: AlertCircle, desc: 'Beklenmedik bir sorunla karşılaştım.' },
                      { value: 'feature', label: 'Özellik Talebi', icon: Lightbulb, desc: 'Yeni bir özellik veya iyileştirme öneriyorum.' },
                      { value: 'general', label: 'Genel Görüş', icon: MessageSquare, desc: 'Ürün hakkında genel bir yorumum var.' },
                      { value: 'other', label: 'Diğer', icon: FileText, desc: 'Diğer konular.' }
                    ].map((type) => (
                      <label
                        key={type.value}
                        className={`flex items-start gap-3 p-3 border rounded-lg cursor-pointer transition-colors ${
                          feedback.type === type.value
                            ? 'border-blue-500 bg-blue-50'
                            : 'border-gray-300 hover:border-gray-400'
                        }`}
                      >
                        <input
                          type="radio"
                          name="feedbackType"
                          value={type.value}
                          checked={feedback.type === type.value}
                          onChange={(e) => handleTypeChange(e.target.value)}
                          className="mt-1 text-blue-600 focus:ring-blue-500"
                          required
                        />
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <type.icon size={16} className="text-gray-600" />
                            <span className="text-gray-900">{type.label}</span>
                          </div>
                          <p className="text-sm text-gray-600">{type.desc}</p>
                        </div>
                      </label>
                    ))}
                  </div>
                  {!feedback.type && (
                    <div className="mt-2 text-sm text-red-600">
                      ⚠️ Lütfen bir geri bildirim türü seçin.
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Bu sorun/öneri sizi ne kadar etkiledi? <span className="text-gray-500">(1: Hiç etkilemedi, 10: Çok etkiledi)</span>
                  </label>
                  <div className="flex items-center gap-4">
                    <span className="text-sm text-gray-500">1</span>
                    <input
                      type="range"
                      min="1"
                      max="10"
                      value={feedback.emotionalImpactScore}
                      onChange={(e) => setFeedback(prev => ({ ...prev, emotionalImpactScore: parseInt(e.target.value) }))}
                      className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
                    />
                    <span className="text-sm text-gray-500">10</span>
                    <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                      <span className="text-blue-600 font-bold text-lg">{feedback.emotionalImpactScore}</span>
                    </div>
                  </div>
                  <div className="mt-2 text-sm text-gray-600">
                    {feedback.emotionalImpactScore <= 3 && "Bu konu sizi çok az etkiledi."}
                    {feedback.emotionalImpactScore > 3 && feedback.emotionalImpactScore <= 6 && "Bu konu sizi orta düzeyde etkiledi."}
                    {feedback.emotionalImpactScore > 6 && feedback.emotionalImpactScore <= 8 && "Bu konu sizi önemli ölçüde etkiledi."}
                    {feedback.emotionalImpactScore > 8 && "Bu konu sizi çok ciddi şekilde etkiledi."}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    İlgili Etiketler (Birden fazla seçebilirsiniz) <span className="text-red-500">*</span>
                    <span className="text-xs text-gray-500 ml-2">
                      {feedback.type === 'error' && 'Hata türüne özel etiketler'}
                      {feedback.type === 'feature' && 'Özellik talebine özel etiketler'}
                      {feedback.type === 'general' && 'Genel görüşe özel etiketler'}
                      {feedback.type === 'other' && 'Diğer konulara özel etiketler'}
                    </span>
                  </label>
                  
                  {!feedback.type ? (
                    <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                      <p className="text-yellow-800 text-sm">
                        ⚠️ Lütfen önce geri bildirim türünü seçin. Etiketler tür seçimine göre değişecektir.
                      </p>
                    </div>
                  ) : (
                                         <>
                       {/* Etiket seçenekleri her zaman gösterilsin */}
                       {getTagsByType(feedback.type).map((category) => (
                         <div key={category.category} className="mb-4 p-3 bg-gray-50 rounded-lg border border-gray-200">
                           <h4 className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
                             <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                             {category.category}
                           </h4>
                           <div className="grid grid-cols-2 gap-2">
                             {category.tags.map((tag) => (
                               <label
                                 key={tag}
                                 className={`flex items-center gap-3 p-3 border rounded-lg cursor-pointer transition-all duration-200 ${
                                   feedback.tags.includes(tag)
                                     ? 'border-blue-500 bg-blue-50 shadow-sm'
                                     : 'border-gray-300 hover:border-blue-300 hover:bg-blue-25 hover:shadow-sm'
                                 }`}
                               >
                                 <input
                                   type="checkbox"
                                   checked={feedback.tags.includes(tag)}
                                   onChange={(e) => {
                                     if (e.target.checked) {
                                       setFeedback(prev => ({ ...prev, tags: [...prev.tags, tag] }));
                                     } else {
                                       setFeedback(prev => ({ ...prev, tags: prev.tags.filter(t => t !== tag) }));
                                     }
                                   }}
                                   className="text-blue-600 focus:ring-blue-500 h-4 w-4"
                                 />
                                 <span className="text-sm text-gray-900 font-medium">{tag}</span>
                               </label>
                             ))}
                           </div>
                         </div>
                       ))}
                       
                       {/* Uyarı mesajı */}
                       {feedback.tags.length === 0 && (
                         <div className="p-4 bg-orange-50 border border-orange-200 rounded-lg">
                           <p className="text-orange-800 text-sm">
                             ⚠️ Lütfen en az bir etiket seçin. Bu, geri bildiriminizi daha iyi kategorize etmemize yardımcı olur.
                           </p>
                         </div>
                       )}
                       
                       {/* Seçilen etiketler */}
                       {feedback.tags.length > 0 && (
                         <div className="mt-4 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg">
                           <div className="text-sm font-medium text-blue-800 mb-3 flex items-center gap-2">
                             <CheckCircle size={16} className="text-blue-600" />
                             Seçilen Etiketler ({feedback.tags.length})
                           </div>
                           <div className="flex flex-wrap gap-2">
                             {feedback.tags.map((tag) => (
                               <span
                                 key={tag}
                                 className="inline-flex items-center gap-2 px-3 py-2 bg-white text-blue-800 text-sm font-medium rounded-full border border-blue-200 shadow-sm hover:shadow-md transition-all duration-200"
                               >
                                 {tag}
                                 <button
                                   type="button"
                                   onClick={() => setFeedback(prev => ({ 
                                     ...prev, 
                                     tags: prev.tags.filter(t => t !== tag) 
                                   }))}
                                   className="text-blue-600 hover:text-red-500 hover:bg-red-50 w-5 h-5 rounded-full flex items-center justify-center transition-colors"
                                   title="Etiketi kaldır"
                                 >
                                   ×
                                 </button>
                               </span>
                             ))}
                           </div>
                         </div>
                       )}
                     </>
                   )}
                 </div>

                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="text-sm font-medium text-gray-700 mb-3">Teknik Bilgiler (Otomatik Doldurulacaktır)</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                    <div>
                      <span className="text-gray-600">Kaynağı:</span>
                      <span className="ml-2 text-gray-900">{feedback.pageSource}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Kullanıcı:</span>
                      <span className="ml-2 text-gray-900">{feedback.userName || 'Adınızı yukarıda girin'}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Tarayıcı:</span>
                      <span className="ml-2 text-gray-900">{feedback.browserInfo}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">İşletim Sistemi:</span>
                      <span className="ml-2 text-gray-900">{feedback.osInfo}</span>
                    </div>
                  </div>
                </div>

                {error && (
                  <div className="bg-red-50 border border-red-200 rounded-md p-3">
                    <p className="text-red-600 text-sm">{error}</p>
                  </div>
                )}

                <div className="flex gap-3 pt-4">
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
                  >
                    {isSubmitting ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        Gönderiliyor...
                      </>
                    ) : (
                      <>
                        <Send size={16} />
                        Gönder
                      </>
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
                  >
                    Kapat
                  </button>
                </div>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default FeedbackModal;
