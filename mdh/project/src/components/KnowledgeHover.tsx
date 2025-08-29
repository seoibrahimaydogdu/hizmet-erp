import React, { useState } from 'react';
import { HelpCircle, X, Info, Lightbulb, Settings, CreditCard, Bug, User, DollarSign, Folder, Star } from 'lucide-react';

interface KnowledgeHoverProps {
  type: 'ticket_categories' | 'feature_request' | 'general';
  className?: string;
}

const KnowledgeHover: React.FC<KnowledgeHoverProps> = ({ type, className = '' }) => {
  const [isOpen, setIsOpen] = useState(false);

  const handleToggle = () => {
    console.log('KnowledgeHover clicked, type:', type, 'current state:', isOpen);
    setIsOpen(!isOpen);
  };

  const getContent = () => {
    switch (type) {
      case 'ticket_categories':
        return {
          title: 'Talep Kategorileri Hakkında',
          content: (
            <div className="space-y-4">
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
                <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-2 flex items-center">
                  <Info className="w-4 h-4 mr-2" />
                  Önemli Bilgi
                </h4>
                <p className="text-sm text-blue-800 dark:text-blue-200">
                  Bu bölümde sadece proje ve kategori ile ilgili talepler oluşturabilirsiniz. 
                  Genel sorular, şikayetler veya diğer konular için canlı destek kullanın.
                </p>
              </div>
              
              <div className="space-y-3">
                <h4 className="font-medium text-gray-900 dark:text-white">Kategori Açıklamaları:</h4>
                
                <div className="space-y-2">
                  <div className="flex items-start space-x-3 p-2 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <Settings className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <h5 className="font-medium text-gray-900 dark:text-white text-sm">Teknik Destek</h5>
                      <p className="text-xs text-gray-600 dark:text-gray-400">Sistem kullanımı, teknik sorunlar ve destek talepleri</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start space-x-3 p-2 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <CreditCard className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <h5 className="font-medium text-gray-900 dark:text-white text-sm">Faturalama</h5>
                      <p className="text-xs text-gray-600 dark:text-gray-400">Fatura görüntüleme, düzenleme ve ödeme sorunları</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start space-x-3 p-2 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <Star className="w-4 h-4 text-pink-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <h5 className="font-medium text-gray-900 dark:text-white text-sm">Özellik Önerisi</h5>
                      <p className="text-xs text-gray-600 dark:text-gray-400">Yeni özellik önerileri ve geliştirme talepleri</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start space-x-3 p-2 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <Bug className="w-4 h-4 text-red-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <h5 className="font-medium text-gray-900 dark:text-white text-sm">Hata Bildirimi</h5>
                      <p className="text-xs text-gray-600 dark:text-gray-400">Sistem hataları ve bug raporları</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start space-x-3 p-2 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <User className="w-4 h-4 text-purple-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <h5 className="font-medium text-gray-900 dark:text-white text-sm">Hesap Yönetimi</h5>
                      <p className="text-xs text-gray-600 dark:text-gray-400">Hesap ayarları, profil düzenleme ve yetki sorunları</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start space-x-3 p-2 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <DollarSign className="w-4 h-4 text-cyan-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <h5 className="font-medium text-gray-900 dark:text-white text-sm">Ödeme Sorunları</h5>
                      <p className="text-xs text-gray-600 dark:text-gray-400">Ödeme işlemleri, kart sorunları ve iade talepleri</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start space-x-3 p-2 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <Folder className="w-4 h-4 text-lime-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <h5 className="font-medium text-gray-900 dark:text-white text-sm">Proje Soruları</h5>
                      <p className="text-xs text-gray-600 dark:text-gray-400">Proje ile ilgili sorular ve talepler</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )
        };
      
      case 'feature_request':
        return {
          title: 'Özellik Önerisi Hakkında',
          content: (
            <div className="space-y-4">
              <div className="bg-pink-50 dark:bg-pink-900/20 border border-pink-200 dark:border-pink-800 rounded-lg p-3">
                <h4 className="font-medium text-pink-900 dark:text-pink-100 mb-2 flex items-center">
                  <Lightbulb className="w-4 h-4 mr-2" />
                  Özellik Önerisi
                </h4>
                <p className="text-sm text-pink-800 dark:text-pink-200">
                  Özellik önerileriniz bizim için çok değerli! Lütfen detaylı açıklama yapın.
                </p>
              </div>
              
              <div className="space-y-3">
                <h4 className="font-medium text-gray-900 dark:text-white">Öneri İçeriği:</h4>
                
                <div className="space-y-2 text-sm">
                  <div className="flex items-start space-x-2">
                    <div className="w-2 h-2 bg-pink-500 rounded-full mt-2 flex-shrink-0"></div>
                    <p className="text-gray-700 dark:text-gray-300">Önerdiğiniz özelliğin ne yapacağını açıklayın</p>
                  </div>
                  <div className="flex items-start space-x-2">
                    <div className="w-2 h-2 bg-pink-500 rounded-full mt-2 flex-shrink-0"></div>
                    <p className="text-gray-700 dark:text-gray-300">Bu özelliğin size nasıl fayda sağlayacağını belirtin</p>
                  </div>
                  <div className="flex items-start space-x-2">
                    <div className="w-2 h-2 bg-pink-500 rounded-full mt-2 flex-shrink-0"></div>
                    <p className="text-gray-700 dark:text-gray-300">Varsa benzer özelliklerin örneklerini paylaşın</p>
                  </div>
                  <div className="flex items-start space-x-2">
                    <div className="w-2 h-2 bg-pink-500 rounded-full mt-2 flex-shrink-0"></div>
                    <p className="text-gray-700 dark:text-gray-300">Öncelik seviyesini belirtin (düşük/orta/yüksek)</p>
                  </div>
                </div>
                
                <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-3">
                  <h5 className="font-medium text-yellow-900 dark:text-yellow-100 text-sm mb-1">Not:</h5>
                  <p className="text-xs text-yellow-800 dark:text-yellow-200">
                    Tüm özellik önerileri değerlendirilir ve uygun görülenler geliştirme planına dahil edilir.
                  </p>
                </div>
              </div>
            </div>
          )
        };
      
      default:
        return {
          title: 'Genel Bilgi',
          content: (
            <div className="space-y-3">
              <p className="text-sm text-gray-700 dark:text-gray-300">
                Bu bölümde sistem kullanımı ile ilgili genel bilgiler bulabilirsiniz.
              </p>
            </div>
          )
        };
    }
  };

  const content = getContent();

  return (
    <div className={`relative inline-block ${className}`} style={{ zIndex: 1000 }}>
      <button
        onClick={handleToggle}
        className="inline-flex items-center justify-center w-6 h-6 text-blue-500 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 transition-colors bg-blue-50 hover:bg-blue-100 dark:bg-blue-900/20 dark:hover:bg-blue-900/30 rounded-full p-1"
        title="Bilgi al"
      >
        <HelpCircle className="w-4 h-4" />
      </button>

      {isOpen && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 z-40" 
            onClick={() => setIsOpen(false)}
          />
          
          {/* Tooltip */}
          <div className="absolute right-0 top-8 w-80 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-xl z-[9999] transform -translate-x-2 animate-in fade-in-0 zoom-in-95">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-sm font-medium text-gray-900 dark:text-white">
                {content.title}
              </h3>
              <button
                onClick={() => setIsOpen(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            
            {/* Content */}
            <div className="p-4 max-h-96 overflow-y-auto">
              {content.content}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default KnowledgeHover;
