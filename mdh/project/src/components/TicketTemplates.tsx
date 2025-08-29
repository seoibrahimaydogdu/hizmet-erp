import React, { useState } from 'react';
import { FileText, Copy, CheckCircle, ChevronDown, ChevronRight, BookOpen, Lightbulb } from 'lucide-react';
import { toast } from 'react-hot-toast';

interface TicketTemplatesProps {
  onTemplateSelect: (template: TemplateData) => void;
  className?: string;
}

interface TemplateData {
  title: string;
  description: string;
  category: string;
  sections: TemplateSection[];
}

interface TemplateSection {
  title: string;
  placeholder: string;
  required: boolean;
  tips?: string[];
}

const TicketTemplates: React.FC<TicketTemplatesProps> = ({
  onTemplateSelect,
  className = ''
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('');

  const templates: Record<string, TemplateData[]> = {
    'bug': [
      {
        title: 'Hata Raporu Şablonu',
        description: 'Sistematik hata raporu için kapsamlı şablon',
        category: 'bug',
        sections: [
          {
            title: 'Hata Açıklaması',
            placeholder: 'Hatanın ne olduğunu kısa ve net bir şekilde açıklayın...',
            required: true,
            tips: [
              'Hatanın tam olarak ne olduğunu belirtin',
              'Beklenen davranış ile gerçek davranış arasındaki farkı açıklayın',
              'Hatanın ne zaman oluştuğunu belirtin'
            ]
          },
          {
            title: 'Adımlar',
            placeholder: 'Hatayı yeniden oluşturmak için takip edilen adımları sıralayın...',
            required: true,
            tips: [
              'Adımları sıra numarası ile yazın',
              'Her adımı net ve anlaşılır şekilde açıklayın',
              'Hangi sayfada/ekranda olduğunuzu belirtin'
            ]
          },
          {
            title: 'Sistem Bilgileri',
            placeholder: 'Kullandığınız sistem bilgilerini paylaşın...',
            required: false,
            tips: [
              'İşletim sistemi ve versiyonu',
              'Tarayıcı ve versiyonu',
              'Cihaz bilgileri (mobil/desktop)',
              'Ekran çözünürlüğü'
            ]
          },
          {
            title: 'Hata Mesajları',
            placeholder: 'Aldığınız hata mesajlarını buraya yapıştırın...',
            required: false,
            tips: [
              'Tam hata mesajını kopyalayıp yapıştırın',
              'Hata kodlarını da dahil edin',
              'Ekran görüntüsü varsa belirtin'
            ]
          }
        ]
      }
    ],
    'feature_request': [
      {
        title: 'Özellik Önerisi Şablonu',
        description: 'Yeni özellik önerisi için detaylı şablon',
        category: 'feature_request',
        sections: [
          {
            title: 'Önerilen Özellik',
            placeholder: 'Önerdiğiniz özelliği kısa ve net bir şekilde açıklayın...',
            required: true,
            tips: [
              'Özelliğin ne yapacağını açıklayın',
              'Hangi problemi çözeceğini belirtin',
              'Kullanıcı deneyimini nasıl iyileştireceğini açıklayın'
            ]
          },
          {
            title: 'Kullanım Senaryosu',
            placeholder: 'Bu özelliğin nasıl kullanılacağını açıklayın...',
            required: true,
            tips: [
              'Günlük kullanım senaryolarını tanımlayın',
              'Hangi kullanıcı gruplarının faydalanacağını belirtin',
              'İş akışındaki yerini açıklayın'
            ]
          },
          {
            title: 'Fayda Analizi',
            placeholder: 'Bu özelliğin sağlayacağı faydaları açıklayın...',
            required: true,
            tips: [
              'Zaman tasarrufu sağlayacak mı?',
              'Maliyet azaltacak mı?',
              'Kullanıcı memnuniyetini artıracak mı?',
              'Rekabet avantajı sağlayacak mı?'
            ]
          },
          {
            title: 'Alternatif Çözümler',
            placeholder: 'Varsa mevcut alternatif çözümleri belirtin...',
            required: false,
            tips: [
              'Şu anda nasıl çözüyorsunuz?',
              'Başka araçlar kullanıyor musunuz?',
              'Geçici çözümleriniz neler?'
            ]
          }
        ]
      }
    ],
    'technical': [
      {
        title: 'Teknik Destek Şablonu',
        description: 'Teknik sorunlar için kapsamlı destek şablonu',
        category: 'technical',
        sections: [
          {
            title: 'Sorun Açıklaması',
            placeholder: 'Yaşadığınız teknik sorunu detaylı olarak açıklayın...',
            required: true,
            tips: [
              'Sorunun ne olduğunu net bir şekilde belirtin',
              'Hangi işlemi yaparken oluştuğunu açıklayın',
              'Sorunun ne zaman başladığını belirtin'
            ]
          },
          {
            title: 'Denenen Çözümler',
            placeholder: 'Sorunu çözmek için denediğiniz yöntemleri listeleyin...',
            required: false,
            tips: [
              'Hangi adımları denediniz?',
              'Sonuç ne oldu?',
              'Hata mesajları aldınız mı?',
              'Yardım dokümanlarını kontrol ettiniz mi?'
            ]
          },
          {
            title: 'Sistem Detayları',
            placeholder: 'Kullandığınız sistem ve yazılım bilgilerini paylaşın...',
            required: true,
            tips: [
              'İşletim sistemi ve versiyonu',
              'Tarayıcı ve versiyonu',
              'Kullandığınız yazılımlar',
              'Donanım bilgileri (gerekirse)'
            ]
          },
          {
            title: 'Ek Bilgiler',
            placeholder: 'Sorunla ilgili ek bilgileri buraya ekleyin...',
            required: false,
            tips: [
              'Ekran görüntüleri',
              'Hata logları',
              'Performans sorunları',
              'Güvenlik endişeleri'
            ]
          }
        ]
      }
    ],
    'billing': [
      {
        title: 'Faturalama Sorunu Şablonu',
        description: 'Fatura ve ödeme sorunları için şablon',
        category: 'billing',
        sections: [
          {
            title: 'Fatura Bilgileri',
            placeholder: 'İlgili fatura bilgilerini paylaşın...',
            required: true,
            tips: [
              'Fatura numarası',
              'Fatura tarihi',
              'Fatura tutarı',
              'Fatura dönemi'
            ]
          },
          {
            title: 'Sorun Açıklaması',
            placeholder: 'Faturalama ile ilgili yaşadığınız sorunu açıklayın...',
            required: true,
            tips: [
              'Sorunun ne olduğunu belirtin',
              'Beklenen ile gerçek durum arasındaki farkı açıklayın',
              'Ne zaman fark ettiniz?'
            ]
          },
          {
            title: 'Ödeme Bilgileri',
            placeholder: 'Ödeme ile ilgili bilgileri paylaşın...',
            required: false,
            tips: [
              'Ödeme yöntemi',
              'Ödeme tarihi',
              'Banka dekontu (varsa)',
              'Ödeme durumu'
            ]
          },
          {
            title: 'İletişim Bilgileri',
            placeholder: 'İletişim için gerekli bilgileri paylaşın...',
            required: false,
            tips: [
              'Telefon numarası',
              'E-posta adresi',
              'Tercih ettiğiniz iletişim yöntemi',
              'Müsait olduğunuz saatler'
            ]
          }
        ]
      }
    ]
  };

  const handleTemplateSelect = (template: TemplateData) => {
    onTemplateSelect(template);
    setIsOpen(false);
    toast.success(`${template.title} seçildi`);
  };

  const copyTemplateToClipboard = (template: TemplateData) => {
    const templateText = template.sections.map(section => 
      `${section.title}:\n${section.placeholder}\n`
    ).join('\n');
    
    navigator.clipboard.writeText(templateText);
    toast.success('Şablon panoya kopyalandı');
  };

  return (
    <div className={className}>
      {/* Ana Buton */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-3 bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 border border-purple-200 dark:border-purple-800 rounded-lg hover:from-purple-100 hover:to-blue-100 dark:hover:from-purple-900/30 dark:hover:to-blue-900/30 transition-all"
      >
        <div className="flex items-center space-x-3">
          <BookOpen className="w-5 h-5 text-purple-600 dark:text-purple-400" />
          <div className="text-left">
            <p className="text-sm font-medium text-purple-900 dark:text-purple-300">
              Talep Şablonları
            </p>
            <p className="text-xs text-purple-700 dark:text-purple-400">
              Kategorilere göre hazır şablonlar
            </p>
          </div>
        </div>
        {isOpen ? (
          <ChevronDown className="w-4 h-4 text-purple-600 dark:text-purple-400" />
        ) : (
          <ChevronRight className="w-4 h-4 text-purple-600 dark:text-purple-400" />
        )}
      </button>

      {/* Şablonlar Listesi */}
      {isOpen && (
        <div className="mt-4 space-y-4">
          {Object.entries(templates).map(([category, categoryTemplates]) => (
            <div key={category} className="space-y-2">
              <h4 className="text-sm font-medium text-gray-900 dark:text-white capitalize">
                {category === 'feature_request' ? 'Özellik Önerisi' : 
                 category === 'bug' ? 'Hata Bildirimi' :
                 category === 'technical' ? 'Teknik Destek' :
                 category === 'billing' ? 'Faturalama' : category}
              </h4>
              
              {categoryTemplates.map((template, index) => (
                <div
                  key={index}
                  className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 space-y-3"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h5 className="text-sm font-medium text-gray-900 dark:text-white">
                        {template.title}
                      </h5>
                      <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                        {template.description}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => copyTemplateToClipboard(template)}
                      className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
                      title="Şablonu kopyala"
                    >
                      <Copy className="w-4 h-4 text-gray-500" />
                    </button>
                  </div>

                  {/* Şablon Bölümleri */}
                  <div className="space-y-2">
                    {template.sections.map((section, sectionIndex) => (
                      <div key={sectionIndex} className="bg-gray-50 dark:bg-gray-700 rounded p-3">
                        <div className="flex items-center space-x-2 mb-2">
                          <FileText className="w-4 h-4 text-blue-500" />
                          <span className="text-xs font-medium text-gray-900 dark:text-white">
                            {section.title}
                          </span>
                          {section.required && (
                            <span className="text-xs text-red-500">*</span>
                          )}
                        </div>
                        <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">
                          {section.placeholder}
                        </p>
                        {section.tips && (
                          <div className="space-y-1">
                            <p className="text-xs text-gray-500 dark:text-gray-500 font-medium">
                              İpuçları:
                            </p>
                            <ul className="text-xs text-gray-500 dark:text-gray-500 space-y-1">
                              {section.tips.map((tip, tipIndex) => (
                                <li key={tipIndex} className="flex items-start space-x-1">
                                  <Lightbulb className="w-3 h-3 text-yellow-500 mt-0.5 flex-shrink-0" />
                                  <span>{tip}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>

                  <button
                    type="button"
                    onClick={() => handleTemplateSelect(template)}
                    className="w-full flex items-center justify-center space-x-2 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-lg transition-colors"
                  >
                    <CheckCircle className="w-4 h-4" />
                    <span>Bu Şablonu Kullan</span>
                  </button>
                </div>
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default TicketTemplates;
