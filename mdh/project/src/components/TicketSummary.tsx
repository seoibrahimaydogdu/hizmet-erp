import React, { useState } from 'react';
import { CheckCircle, AlertTriangle, Clock, FileText, Tag, User, Calendar, Eye, EyeOff } from 'lucide-react';

interface TicketSummaryProps {
  ticketData: {
    title: string;
    description: string;
    category: string;
    priority: string;
    attachments?: File[];
  };
  onConfirm: () => void;
  onEdit: () => void;
  className?: string;
}

const TicketSummary: React.FC<TicketSummaryProps> = ({
  ticketData,
  onConfirm,
  onEdit,
  className = ''
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [showFullDescription, setShowFullDescription] = useState(false);

  const getCategoryInfo = (category: string) => {
    const info = {
      technical: { name: 'Teknik Destek', icon: '🔧', color: 'text-blue-600 dark:text-blue-400' },
      billing: { name: 'Faturalama', icon: '📄', color: 'text-green-600 dark:text-green-400' },
      feature: { name: 'Özellik İsteği', icon: '⭐', color: 'text-purple-600 dark:text-purple-400' },
      feature_request: { name: 'Özellik Önerisi', icon: '⭐', color: 'text-purple-600 dark:text-purple-400' },
      bug: { name: 'Hata Bildirimi', icon: '🐛', color: 'text-red-600 dark:text-red-400' },
      account: { name: 'Hesap Yönetimi', icon: '👤', color: 'text-gray-600 dark:text-gray-400' },
      payment: { name: 'Ödeme Sorunları', icon: '💳', color: 'text-orange-600 dark:text-orange-400' },
      project: { name: 'Proje Soruları', icon: '📋', color: 'text-indigo-600 dark:text-indigo-400' }
    };
    return info[category as keyof typeof info] || { name: category, icon: '❓', color: 'text-gray-600 dark:text-gray-400' };
  };

  const getPriorityInfo = (priority: string) => {
    const info = {
      low: { name: 'Düşük', color: 'text-gray-600 dark:text-gray-400', bgColor: 'bg-gray-100 dark:bg-gray-800', icon: <Clock className="w-4 h-4" /> },
      medium: { name: 'Orta', color: 'text-yellow-600 dark:text-yellow-400', bgColor: 'bg-yellow-100 dark:bg-yellow-900/20', icon: <AlertTriangle className="w-4 h-4" /> },
      high: { name: 'Yüksek', color: 'text-red-600 dark:text-red-400', bgColor: 'bg-red-100 dark:bg-red-900/20', icon: <AlertTriangle className="w-4 h-4" /> }
    };
    return info[priority as keyof typeof info] || info.medium;
  };

  const getEstimatedResponseTime = (priority: string) => {
    const times = {
      low: 'İlk yanıt: 1 iş günü, Çözüm: 2-3 iş günü',
      medium: 'İlk yanıt: 1 saat, Çözüm: 12-24 saat',
      high: 'İlk yanıt: 15 dakika, Çözüm: 1-1.5 saat'
    };
    return times[priority as keyof typeof times] || 'İlk yanıt: 1 saat, Çözüm: 12-24 saat';
  };

  const truncateText = (text: string, maxLength: number) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

  const categoryInfo = getCategoryInfo(ticketData.category);
  const priorityInfo = getPriorityInfo(ticketData.priority);

  return (
    <div className={className}>
      {/* Özet Gösterme Butonu */}
      <button
        type="button"
        onClick={() => setIsVisible(!isVisible)}
        className="w-full flex items-center justify-between p-3 bg-gradient-to-r from-orange-50 to-red-50 dark:from-orange-900/20 dark:to-red-900/20 border border-orange-200 dark:border-orange-800 rounded-lg hover:from-orange-100 hover:to-red-100 dark:hover:from-orange-900/30 dark:hover:to-red-900/30 transition-all"
      >
        <div className="flex items-center space-x-3">
          <Eye className="w-5 h-5 text-orange-600 dark:text-orange-400" />
          <div className="text-left">
            <p className="text-sm font-medium text-orange-900 dark:text-orange-300">
              Talep Özeti
            </p>
            <p className="text-xs text-orange-700 dark:text-orange-400">
              Göndermeden önce kontrol edin
            </p>
          </div>
        </div>
        {isVisible ? (
          <EyeOff className="w-4 h-4 text-orange-600 dark:text-orange-400" />
        ) : (
          <Eye className="w-4 h-4 text-orange-600 dark:text-orange-400" />
        )}
      </button>

      {/* Talep Özeti */}
      {isVisible && (
        <div className="mt-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6 space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Talep Özeti
            </h3>
            <div className="flex items-center space-x-2">
              <Calendar className="w-4 h-4 text-gray-500" />
              <span className="text-sm text-gray-500 dark:text-gray-400">
                {new Date().toLocaleDateString('tr-TR')}
              </span>
            </div>
          </div>

          {/* Başlık */}
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <FileText className="w-4 h-4 text-gray-500" />
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Başlık</span>
            </div>
            <p className="text-sm text-gray-900 dark:text-white bg-gray-50 dark:bg-gray-700 p-3 rounded-lg">
              {ticketData.title}
            </p>
          </div>

          {/* Kategori ve Öncelik */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <Tag className="w-4 h-4 text-gray-500" />
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Kategori</span>
              </div>
              <div className="flex items-center space-x-2 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <span className="text-lg">{categoryInfo.icon}</span>
                <span className={`text-sm font-medium ${categoryInfo.color}`}>
                  {categoryInfo.name}
                </span>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <AlertTriangle className="w-4 h-4 text-gray-500" />
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Öncelik</span>
              </div>
              <div className={`flex items-center space-x-2 p-3 rounded-lg ${priorityInfo.bgColor}`}>
                {priorityInfo.icon}
                <span className={`text-sm font-medium ${priorityInfo.color}`}>
                  {priorityInfo.name}
                </span>
              </div>
            </div>
          </div>

          {/* Açıklama */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <FileText className="w-4 h-4 text-gray-500" />
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Açıklama</span>
              </div>
              <button
                type="button"
                onClick={() => setShowFullDescription(!showFullDescription)}
                className="text-xs text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300"
              >
                {showFullDescription ? 'Kısalt' : 'Tamamını Göster'}
              </button>
            </div>
            <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded-lg">
              <p className="text-sm text-gray-900 dark:text-white whitespace-pre-wrap">
                {showFullDescription ? ticketData.description : truncateText(ticketData.description, 200)}
              </p>
            </div>
          </div>

          {/* Dosya Ekleri */}
          {ticketData.attachments && ticketData.attachments.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <FileText className="w-4 h-4 text-gray-500" />
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Dosya Ekleri ({ticketData.attachments.length})
                </span>
              </div>
              <div className="space-y-2">
                {ticketData.attachments.map((file, index) => (
                  <div key={index} className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <div className="flex items-center space-x-2">
                      <FileText className="w-4 h-4 text-blue-500" />
                      <span className="text-sm text-gray-900 dark:text-white">{file.name}</span>
                    </div>
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {(file.size / 1024 / 1024).toFixed(2)} MB
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Tahmini Yanıt Süresi */}
          <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
            <div className="flex items-center space-x-2">
              <Clock className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              <div>
                <p className="text-sm font-medium text-blue-900 dark:text-blue-300">
                  Tahmini Yanıt Süresi
                </p>
                <p className="text-xs text-blue-700 dark:text-blue-400">
                  {getEstimatedResponseTime(ticketData.priority)}
                </p>
              </div>
            </div>
          </div>

          {/* Onay Mesajı */}
          <div className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
            <div className="flex items-start space-x-2">
              <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-green-900 dark:text-green-300">
                  Talep Hazır
                </p>
                <p className="text-xs text-green-700 dark:text-green-400">
                  Talep bilgileriniz doğru görünüyor. Onayladıktan sonra destek ekibimize iletilecektir.
                </p>
              </div>
            </div>
          </div>

          {/* Aksiyon Butonları */}
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              type="button"
              onClick={onEdit}
              className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              Düzenle
            </button>
            <button
              type="button"
              onClick={onConfirm}
              className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors flex items-center justify-center space-x-2"
            >
              <CheckCircle className="w-4 h-4" />
              <span>Talep Gönder</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default TicketSummary;
