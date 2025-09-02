import React, { useState, useEffect, useCallback } from 'react';
import { X, Send, Upload, AlertCircle, Lightbulb, MessageSquare, FileText, CheckCircle } from 'lucide-react';
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
  type: 'error' | 'feature' | 'general' | 'other';
  pageSource: string;
  userId?: string;
  userName?: string;
  browserInfo: string;
  osInfo: string;
  timestamp: string;
  queueInfo?: {
    queuePosition: number;
    estimatedTime: string;
  };
}

const FeedbackModal: React.FC<FeedbackModalProps> = ({ isOpen, onClose, pageSource }) => {
  const { supabase } = useSupabase();
  const { userProfile } = useUser();
  
  const [feedback, setFeedback] = useState<FeedbackData>({
    subject: '',
    message: '',
    type: 'general',
    pageSource: pageSource || 'Unknown',
    userId: userProfile?.id,
    browserInfo: '',
    osInfo: '',
    timestamp: new Date().toISOString()
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [showSuccess, setShowSuccess] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  // Sıra bilgilerini çeken fonksiyon
  const fetchQueueInfo = useCallback(async () => {
    try {
      // Pending feedback sayısını çek
      const { count: pendingCount } = await supabase
        .from('feedback_requests')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'pending');

      // Ortalama yanıt süresini hesapla (örnek: 2-4 saat)
      const estimatedHours = Math.max(2, Math.min(6, Math.ceil((pendingCount || 0) / 3)));
      const estimatedTime = `${estimatedHours} saat`;

      setFeedback(prev => ({
        ...prev,
        queueInfo: {
          queuePosition: (pendingCount || 0) + 1, // +1 çünkü bu feedback de eklenecek
          estimatedTime
        }
      }));
    } catch (error) {
      console.error('Sıra bilgileri çekilemedi:', error);
      // Hata durumunda varsayılan değerler
      setFeedback(prev => ({
        ...prev,
        queueInfo: {
          queuePosition: 1,
          estimatedTime: '2-4 saat'
        }
      }));
    }
  }, [supabase]);

  useEffect(() => {
    if (isOpen) {
      // Tarayıcı ve OS bilgilerini otomatik topla
      const userAgent = navigator.userAgent;
      const browserInfo = getBrowserInfo(userAgent);
      const osInfo = getOSInfo(userAgent);
      
      // Sıra bilgilerini çek
      fetchQueueInfo();
      
                           setFeedback(prev => ({
          ...prev,
          pageSource: pageSource || 'Unknown',
          userId: userProfile?.id,
          userName: userProfile?.name || userProfile?.email || 'Misafir', // Otomatik olarak giriş yapan kullanıcının adı
          browserInfo,
          osInfo,
          timestamp: new Date().toISOString()
        }));
    }
  }, [isOpen, pageSource, userProfile, fetchQueueInfo]);

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

  // Gelişmiş kelime sayma fonksiyonu
  const countWords = (text: string): number => {
    if (!text.trim()) return 0;
    // Boşlukları temizle ve kelimeleri say
    const words = text.trim().split(/\s+/).filter(word => word.length > 0);
    return words.length;
  };

  // Konuya özel teşekkür mesajı oluşturan fonksiyon
  const generateSuccessMessage = (subject: string, type: string): string => {
    const lowerSubject = subject.toLowerCase();
    const lowerType = type.toLowerCase();
    
    // Konu bazlı mesajlar
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
    
    // Tür bazlı mesajlar
    if (lowerType === 'error') {
      return `Teşekkürler! "${subject}" hatasını hemen inceleyeceğiz ve çözeceğiz.`;
    }
    
    if (lowerType === 'feature') {
      return `Teşekkürler! "${subject}" özellik talebinizi değerlendirip geliştirme planımıza ekleyeceğiz.`;
    }
    
    if (lowerType === 'general') {
      return `Teşekkürler! "${subject}" konusundaki görüşünüz bizim için çok değerli.`;
    }
    
    // Varsayılan mesaj
    return `Teşekkürler! "${subject}" konusundaki geri bildiriminizi değerlendireceğiz.`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!feedback.subject.trim() || !feedback.message.trim()) {
      setError('Lütfen konu ve mesaj alanlarını doldurun.');
      return;
    }



    setIsSubmitting(true);
    setError('');

    try {
      // Önce tablo varlığını kontrol et
      console.log('Supabase bağlantısı test ediliyor...');
      
             // Veri yapısını tablo yapısına uygun hale getir
       const feedbackData = {
         subject: feedback.subject,
         message: feedback.message,
         type: feedback.type,
         page_source: feedback.pageSource,
         user_id: feedback.userId,
         user_name: feedback.userName,
         browser_info: feedback.browserInfo,
         os_info: feedback.osInfo,
         timestamp: feedback.timestamp
       };

      console.log('Gönderilecek veri:', feedbackData);

      const { error: insertError } = await supabase
        .from('feedback_requests')
        .insert([feedbackData]);

      if (insertError) {
        console.error('Supabase insert hatası:', insertError);
        throw insertError;
      }

                    // Başarılı gönderim - konfeti ve mesaj göster
       const message = generateSuccessMessage(feedback.subject, feedback.type);
       setSuccessMessage(message);
       setShowSuccess(true);
       
       // 3 saniye sonra modal'ı kapat
       setTimeout(() => {
                   setFeedback({
            subject: '',
            message: '',
            type: 'general',
            pageSource: pageSource || 'Unknown',
            userId: userProfile?.id,
            userName: userProfile?.name || userProfile?.email || 'Misafir', // Otomatik olarak giriş yapan kullanıcının adı
            browserInfo: '',
            osInfo: '',
            timestamp: new Date().toISOString()
          });
         setShowSuccess(false);
         onClose();
       }, 3000);
    } catch (err) {
      console.error('Feedback submission error:', err);
      
      // Hata türüne göre özel mesaj göster
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
      {/* Konfeti Efekti */}
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
        {/* Header */}
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

                 {/* Content */}
         <div className="p-6">
           {showSuccess ? (
             // Başarı Mesajı
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
             // Normal Form İçeriği
             <>
               <p className="text-gray-600 mb-4">
                 Ürünümüzü geliştirmemize yardımcı olun! Lütfen karşılaştığınız sorunu, 
                 özellik talebinizi veya genel yorumunuzu bizimle paylaşın.
               </p>

          {/* Sıra Bilgisi ve Tahmini Süre */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
              <h4 className="text-sm font-medium text-blue-800">Sıra Durumu</h4>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                  <span className="text-blue-600 font-semibold text-xs">📊</span>
                </div>
                <div>
                  <p className="text-blue-700 font-medium">Sırada</p>
                  <p className="text-blue-900 text-lg font-bold">
                    {feedback.queueInfo?.queuePosition || '...'} kişi
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                  <span className="text-green-600 font-semibold text-xs">⏱️</span>
                </div>
                <div>
                  <p className="text-green-700 font-medium">Tahmini Süre</p>
                  <p className="text-green-900 text-lg font-bold">
                    {feedback.queueInfo?.estimatedTime || '...'}
                  </p>
                </div>
              </div>
            </div>
            <p className="text-xs text-blue-600 mt-2">
              Geri bildiriminiz öncelik sırasına göre değerlendirilecektir
            </p>
          </div>

                     <form onSubmit={handleSubmit} className="space-y-6">
             {/* Konu */}
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

                           

              {/* Mesaj */}
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

             {/* Geri Bildirim Türü */}
             <div>
               <label className="block text-sm font-medium text-gray-700 mb-3">
                 Geri Bildiriminizin Türü
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
                       onChange={(e) => setFeedback(prev => ({ ...prev, type: e.target.value as any }))}
                       className="mt-1 text-blue-600 focus:ring-blue-500"
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
             </div>

             {/* Teknik Bilgiler */}
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
                    <span className="text-gray-600">Gönderen:</span>
                    <span className="ml-2 text-gray-900 font-medium">{feedback.userName || 'Adınızı yukarıda girin'}</span>
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

             {/* Hata Mesajı */}
             {error && (
               <div className="bg-red-50 border border-red-200 rounded-md p-3">
                 <p className="text-red-600 text-sm">{error}</p>
               </div>
             )}

             {/* Butonlar */}
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
