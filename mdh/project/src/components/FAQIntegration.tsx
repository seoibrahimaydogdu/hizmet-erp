import React, { useState, useEffect } from 'react';
import { HelpCircle, Search, ChevronDown, ChevronRight, ExternalLink, BookOpen } from 'lucide-react';

interface FAQIntegrationProps {
  category: string;
  searchTerm?: string;
  className?: string;
}

interface FAQItem {
  id: string;
  question: string;
  answer: string;
  category: string;
  tags: string[];
  helpful: number;
  notHelpful: number;
}

const FAQIntegration: React.FC<FAQIntegrationProps> = ({
  category,
  searchTerm = '',
  className = ''
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [expandedFAQ, setExpandedFAQ] = useState<string | null>(null);
  const [faqs, setFaqs] = useState<FAQItem[]>([]);
  const [filteredFaqs, setFilteredFaqs] = useState<FAQItem[]>([]);
  const [loading, setLoading] = useState(false);

  // Örnek FAQ verileri (gerçek uygulamada API'den gelecek)
  const sampleFAQs: FAQItem[] = [
    {
      id: '1',
      question: 'Ödeme yaparken hata alıyorum, ne yapmalıyım?',
      answer: 'Ödeme hatalarında öncelikle kart bilgilerinizi kontrol edin. Kartınızın limitinin yeterli olduğundan emin olun. Sorun devam ederse farklı bir tarayıcı deneyin veya mobil uygulamamızı kullanın.',
      category: 'payment',
      tags: ['ödeme', 'hata', 'kart'],
      helpful: 45,
      notHelpful: 3
    },
    {
      id: '2',
      question: 'Fatura bilgilerimi nasıl güncelleyebilirim?',
      answer: 'Hesap ayarlarından "Fatura Bilgileri" bölümüne giderek bilgilerinizi güncelleyebilirsiniz. Değişiklikler anında sisteme yansıyacaktır.',
      category: 'billing',
      tags: ['fatura', 'güncelleme', 'hesap'],
      helpful: 32,
      notHelpful: 1
    },
    {
      id: '3',
      question: 'Şifremi unuttum, nasıl sıfırlayabilirim?',
      answer: 'Giriş sayfasında "Şifremi Unuttum" linkine tıklayın. E-posta adresinize gönderilen link ile şifrenizi sıfırlayabilirsiniz.',
      category: 'account',
      tags: ['şifre', 'sıfırlama', 'giriş'],
      helpful: 67,
      notHelpful: 2
    },
    {
      id: '4',
      question: 'Yeni özellik önerisi nasıl yapabilirim?',
      answer: 'Destek sayfasından "Özellik Önerisi" kategorisini seçerek önerinizi detaylı bir şekilde açıklayabilirsiniz. Önerileriniz değerlendirilerek size geri bildirim verilecektir.',
      category: 'feature_request',
      tags: ['özellik', 'öneri', 'geliştirme'],
      helpful: 28,
      notHelpful: 4
    },
    {
      id: '5',
      question: 'Sistem yavaş çalışıyor, ne yapabilirim?',
      answer: 'Öncelikle internet bağlantınızı kontrol edin. Tarayıcı önbelleğini temizleyin ve sayfayı yenileyin. Sorun devam ederse farklı bir tarayıcı deneyin.',
      category: 'technical',
      tags: ['performans', 'yavaş', 'sistem'],
      helpful: 39,
      notHelpful: 5
    },
    {
      id: '6',
      question: 'Hata raporu nasıl gönderebilirim?',
      answer: 'Destek sayfasından "Hata Bildirimi" kategorisini seçin. Hatanın ne olduğunu, hangi adımları takip ettiğinizi ve sistem bilgilerinizi detaylı olarak açıklayın.',
      category: 'bug',
      tags: ['hata', 'rapor', 'bildirim'],
      helpful: 41,
      notHelpful: 2
    },
    {
      id: '7',
      question: 'Proje durumumu nasıl takip edebilirim?',
      answer: 'Proje panelinizden tüm projelerinizin durumunu, ilerleme yüzdesini ve güncellemeleri görebilirsiniz. E-posta bildirimleri de alabilirsiniz.',
      category: 'project',
      tags: ['proje', 'takip', 'durum'],
      helpful: 23,
      notHelpful: 1
    },
    {
      id: '8',
      question: 'Hesabımı nasıl silebilirim?',
      answer: 'Hesap ayarlarından "Hesap Silme" bölümüne gidin. Tüm verilerinizin silineceğini onaylayın. Bu işlem geri alınamaz.',
      category: 'account',
      tags: ['hesap', 'silme', 'kapatma'],
      helpful: 15,
      notHelpful: 8
    }
  ];

  useEffect(() => {
    setFaqs(sampleFAQs);
  }, []);

  useEffect(() => {
    // Kategori ve arama terimine göre FAQ'ları filtrele
    let filtered = faqs.filter(faq => {
      const matchesCategory = category ? faq.category === category : true;
      const matchesSearch = searchTerm ? 
        faq.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
        faq.answer.toLowerCase().includes(searchTerm.toLowerCase()) ||
        faq.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
        : true;
      
      return matchesCategory && matchesSearch;
    });

    // Kategoriye göre sırala (eşleşenler önce)
    if (category) {
      filtered.sort((a, b) => {
        if (a.category === category && b.category !== category) return -1;
        if (a.category !== category && b.category === category) return 1;
        return b.helpful - a.helpful; // Yardımcı olma sayısına göre sırala
      });
    }

    setFilteredFaqs(filtered.slice(0, 5)); // İlk 5 FAQ'yu göster
  }, [faqs, category, searchTerm]);

  const toggleFAQ = (faqId: string) => {
    setExpandedFAQ(expandedFAQ === faqId ? null : faqId);
  };

  const getCategoryIcon = (cat: string) => {
    const icons = {
      payment: '💳',
      billing: '📄',
      account: '👤',
      feature_request: '⭐',
      technical: '🔧',
      bug: '🐛',
      project: '📋'
    };
    return icons[cat as keyof typeof icons] || '❓';
  };

  const getCategoryName = (cat: string) => {
    const names = {
      payment: 'Ödeme',
      billing: 'Faturalama',
      account: 'Hesap',
      feature_request: 'Özellik Önerisi',
      technical: 'Teknik',
      bug: 'Hata',
      project: 'Proje'
    };
    return names[cat as keyof typeof names] || cat;
  };

  if (filteredFaqs.length === 0) return null;

  return (
    <div className={className}>
      {/* Ana Buton */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-3 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border border-green-200 dark:border-green-800 rounded-lg hover:from-green-100 hover:to-emerald-100 dark:hover:from-green-900/30 dark:hover:to-emerald-900/30 transition-all"
      >
        <div className="flex items-center space-x-3">
          <HelpCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
          <div className="text-left">
            <p className="text-sm font-medium text-green-900 dark:text-green-300">
              Sık Sorulan Sorular
            </p>
            <p className="text-xs text-green-700 dark:text-green-400">
              {filteredFaqs.length} ilgili soru bulundu
            </p>
          </div>
        </div>
        {isOpen ? (
          <ChevronDown className="w-4 h-4 text-green-600 dark:text-green-400" />
        ) : (
          <ChevronRight className="w-4 h-4 text-green-600 dark:text-green-400" />
        )}
      </button>

      {/* FAQ Listesi */}
      {isOpen && (
        <div className="mt-4 space-y-3">
          {filteredFaqs.map((faq) => (
            <div
              key={faq.id}
              className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden"
            >
              <button
                type="button"
                onClick={() => toggleFAQ(faq.id)}
                className="w-full flex items-center justify-between p-4 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                <div className="flex items-start space-x-3 text-left">
                  <span className="text-lg">{getCategoryIcon(faq.category)}</span>
                  <div className="flex-1">
                    <h4 className="text-sm font-medium text-gray-900 dark:text-white">
                      {faq.question}
                    </h4>
                    <div className="flex items-center space-x-3 mt-1">
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {getCategoryName(faq.category)}
                      </span>
                      <span className="text-xs text-green-600 dark:text-green-400">
                        {faq.helpful} kişiye yardımcı oldu
                      </span>
                    </div>
                  </div>
                </div>
                {expandedFAQ === faq.id ? (
                  <ChevronDown className="w-4 h-4 text-gray-500 flex-shrink-0" />
                ) : (
                  <ChevronRight className="w-4 h-4 text-gray-500 flex-shrink-0" />
                )}
              </button>

              {expandedFAQ === faq.id && (
                <div className="px-4 pb-4 border-t border-gray-200 dark:border-gray-700">
                  <div className="pt-3">
                    <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                      {faq.answer}
                    </p>
                    
                    {/* Etiketler */}
                    <div className="flex flex-wrap gap-1 mt-3">
                      {faq.tags.map((tag, index) => (
                        <span
                          key={index}
                          className="px-2 py-1 bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 text-xs rounded-full"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>

                    {/* Yardımcı Olma Butonları */}
                    <div className="flex items-center space-x-4 mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                      <button
                        type="button"
                        className="flex items-center space-x-1 text-xs text-green-600 dark:text-green-400 hover:text-green-700 dark:hover:text-green-300"
                      >
                        <span>👍</span>
                        <span>Yardımcı ({faq.helpful})</span>
                      </button>
                      <button
                        type="button"
                        className="flex items-center space-x-1 text-xs text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300"
                      >
                        <span>👎</span>
                        <span>Yardımcı Değil ({faq.notHelpful})</span>
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}

          {/* Daha Fazla FAQ Linki */}
          <div className="text-center pt-2">
            <button
              type="button"
              className="inline-flex items-center space-x-1 text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300"
            >
              <BookOpen className="w-4 h-4" />
              <span>Tüm FAQ'ları Görüntüle</span>
              <ExternalLink className="w-3 h-3" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default FAQIntegration;
