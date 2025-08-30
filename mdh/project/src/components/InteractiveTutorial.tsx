import React, { useState } from 'react';
import { 
  HelpCircle, 
  X, 
  ArrowRight, 
  ArrowLeft, 
  Check, 
  Lightbulb,
  Play,
  Target
} from 'lucide-react';
import toast from 'react-hot-toast';

interface TutorialStep {
  id: string;
  title: string;
  description: string;
  selector: string; // CSS selector for element to highlight
  position: 'top' | 'bottom' | 'left' | 'right';
  action?: 'click' | 'hover' | 'type' | 'scroll';
  actionText?: string;
  hint?: string;
}

interface Tutorial {
  id: string;
  name: string;
  description: string;
  steps: TutorialStep[];
  category: string;
}

const InteractiveTutorial: React.FC = () => {
  const [isActive, setIsActive] = useState(false);
  const [currentTutorial, setCurrentTutorial] = useState<Tutorial | null>(null);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<Set<string>>(new Set());
  const [showTutorials, setShowTutorials] = useState(false);

  // Tutorial verileri
  const tutorials: Tutorial[] = [
    {
      id: 'talep-olusturma',
      name: 'Talep Oluşturma',
      description: 'Yeni destek talebi nasıl oluşturulur?',
      category: 'temel',
      steps: [
                 {
           id: 'step-1',
           title: 'Talep Oluştur Butonunu Bulun',
           description: 'Dashboard\'da "Yeni Talep Oluştur" butonuna tıklayın',
           selector: 'button[onclick*="create"], button:contains("+"), button:contains("Yeni"), .create-button',
           position: 'bottom',
           action: 'click',
           actionText: 'Tıklayın',
           hint: 'Dashboard ana sayfasında büyük mavi buton olarak görünür'
         },
        {
          id: 'step-2',
          title: 'Talep Başlığı Girin',
          description: 'Sorununuzu kısa ve net bir şekilde açıklayın',
          selector: 'input[type="text"], input[name="title"], input[placeholder*="başlık"]',
          position: 'bottom',
          action: 'type',
          actionText: 'Başlık yazın',
          hint: 'Örnek: "Sisteme giriş yapamıyorum"'
        },
        {
          id: 'step-3',
          title: 'Kategori Seçin',
          description: 'Talebinizin hangi kategoriye ait olduğunu seçin',
          selector: 'select, select[name="category"]',
          position: 'bottom',
          action: 'click',
          actionText: 'Kategori seçin',
          hint: 'Teknik, Fatura, Özellik İsteği gibi'
        },
        {
          id: 'step-4',
          title: 'Açıklama Yazın',
          description: 'Sorununuzu detaylı olarak açıklayın',
          selector: 'textarea, textarea[name="description"]',
          position: 'top',
          action: 'type',
          actionText: 'Açıklama yazın',
          hint: 'Ne zaman başladı, hangi adımları takip ettiniz?'
        },
        {
          id: 'step-5',
          title: 'Talebi Gönderin',
          description: 'Talebinizi sisteme gönderin',
          selector: 'button[type="submit"], button:contains("Gönder")',
          position: 'top',
          action: 'click',
          actionText: 'Gönder',
          hint: 'Talebiniz başarıyla oluşturulacak'
        }
      ]
    },
    {
      id: 'talep-takip',
      name: 'Talep Takibi',
      description: 'Mevcut taleplerinizi nasıl takip edersiniz?',
      category: 'temel',
      steps: [
                 {
           id: 'step-1',
           title: 'Taleplerim Sayfasına Gidin',
           description: 'Üst menüden "Taleplerim" seçeneğine tıklayın',
           selector: 'a[href*="tickets"], .my-tickets, .ticket-list-link',
           position: 'bottom',
           action: 'click',
           actionText: 'Taleplerim',
           hint: 'Üst menüde bulunur'
         },
        {
          id: 'step-2',
          title: 'Talep Listesini İnceleyin',
          description: 'Tüm taleplerinizi burada görebilirsiniz',
          selector: '.ticket-list, .tickets-table, .ticket-item',
          position: 'bottom',
          action: 'hover',
          actionText: 'İnceleyin',
          hint: 'Durum, tarih ve başlık bilgilerini görün'
        },
        {
          id: 'step-3',
          title: 'Talep Detayını Açın',
          description: 'Herhangi bir talebe tıklayarak detaylarını görün',
          selector: '.ticket-item, .ticket-row, .ticket-link',
          position: 'bottom',
          action: 'click',
          actionText: 'Detayı açın',
          hint: 'Talebin tüm detayları ve mesajları görünür'
        }
      ]
    },
    {
      id: 'profil-yonetimi',
      name: 'Profil Yönetimi',
      description: 'Profil bilgilerinizi nasıl güncellersiniz?',
      category: 'hesap',
      steps: [
                 {
           id: 'step-1',
           title: 'Profil Sayfasına Gidin',
           description: 'Üst menüden "Profil" seçeneğine tıklayın',
           selector: '.profile-menu, .user-menu, .avatar-button',
           position: 'bottom',
           action: 'click',
           actionText: 'Profil',
           hint: 'Üst menü çubuğunda bulunur'
         },
        {
          id: 'step-2',
          title: 'Bilgileri Düzenleyin',
          description: 'Düzenle butonuna tıklayarak bilgileri güncelleyin',
          selector: '.edit-profile, .edit-button, button[onclick*="edit"]',
          position: 'bottom',
          action: 'click',
          actionText: 'Düzenle',
          hint: 'Bilgilerinizi güncellemek için'
        },
        {
          id: 'step-3',
          title: 'Değişiklikleri Kaydedin',
          description: 'Güncellemeleri kaydetmek için kaydet butonuna tıklayın',
          selector: '.save-profile, .save-button, button[type="submit"]',
          position: 'top',
          action: 'click',
          actionText: 'Kaydet',
          hint: 'Değişiklikleriniz kaydedilecek'
        }
      ]
         },
     {
       id: 'odeme-takibi',
       name: 'Ödeme Takibi',
       description: 'Ödeme durumunuzu nasıl kontrol edersiniz?',
       category: 'finansal',
       steps: [
         {
           id: 'step-1',
           title: 'Ödemeler Sayfasına Gidin',
           description: 'Üst menüden "Ödemeler" seçeneğine tıklayın',
           selector: 'button:contains("Ödemeler"), .payments-link',
           position: 'bottom',
           action: 'click',
           actionText: 'Ödemeler',
           hint: 'Üst menü çubuğunda CreditCard ikonu ile'
         },
         {
           id: 'step-2',
           title: 'Ödeme Geçmişinizi İnceleyin',
           description: 'Tüm ödemelerinizi burada görebilirsiniz',
           selector: '.payment-list, .payments-table',
           position: 'bottom',
           action: 'hover',
           actionText: 'İnceleyin',
           hint: 'Ödeme tarihi, tutar ve durum bilgilerini görün'
         }
       ]
     },
     {
       id: 'canli-destek',
       name: 'Canlı Destek',
       description: 'Canlı destek ile nasıl iletişim kurarsınız?',
       category: 'destek',
       steps: [
         {
           id: 'step-1',
           title: 'Canlı Destek Sayfasına Gidin',
           description: 'Üst menüden "Canlı Destek" seçeneğine tıklayın',
           selector: 'button:contains("Canlı Destek"), .live-chat-link',
           position: 'bottom',
           action: 'click',
           actionText: 'Canlı Destek',
           hint: 'Üst menüde "Online" yazısı ile gösterilir'
         },
         {
           id: 'step-2',
           title: 'Mesaj Yazın',
           description: 'Alt kısımdaki metin kutusuna mesajınızı yazın',
           selector: 'textarea, .message-input',
           position: 'top',
           action: 'type',
           actionText: 'Mesaj yazın',
           hint: 'Sorunuzu detaylı olarak açıklayın'
         }
       ]
     }
   ];

  // Artık overlay'e gerek yok, modal kendi overlay'ini oluşturuyor

  const startTutorial = (tutorial: Tutorial) => {
    setCurrentTutorial(tutorial);
    setCurrentStepIndex(0);
    setIsActive(true);
    setShowTutorials(false);
    // Element vurgulama kaldırıldı, sadece modal göster
  };

  // Artık element vurgulama yok, sadece modal gösteriyoruz

  const nextStep = () => {
    if (!currentTutorial) return;
    
    if (currentStepIndex < currentTutorial.steps.length - 1) {
      setCurrentStepIndex(currentStepIndex + 1);
    } else {
      completeTutorial();
    }
  };

  const prevStep = () => {
    if (!currentTutorial || currentStepIndex === 0) return;

    setCurrentStepIndex(currentStepIndex - 1);
  };

  const completeTutorial = () => {
    if (!currentTutorial) return;

    setIsActive(false);
    setCurrentTutorial(null);
    setCurrentStepIndex(0);

    // Tamamlanan adımları kaydet
    const newCompletedSteps = new Set(completedSteps);
    currentTutorial.steps.forEach(step => {
      newCompletedSteps.add(`${currentTutorial.id}-${step.id}`);
    });
    setCompletedSteps(newCompletedSteps);

    toast.success(
      <div>
        <div className="font-semibold">Tebrikler! 🎉</div>
        <div className="text-sm">{currentTutorial.name} eğitimini tamamladınız!</div>
      </div>,
      { duration: 4000 }
    );
  };

  const skipTutorial = () => {
    setIsActive(false);
    setCurrentTutorial(null);
    setCurrentStepIndex(0);
    toast('Eğitim atlandı. İstediğiniz zaman tekrar başlatabilirsiniz.');
  };

  const getCurrentStep = (): TutorialStep | null => {
    if (!currentTutorial) return null;
    return currentTutorial.steps[currentStepIndex];
  };

  const getProgressPercentage = (): number => {
    if (!currentTutorial) return 0;
    return ((currentStepIndex + 1) / currentTutorial.steps.length) * 100;
  };

  const isStepCompleted = (tutorialId: string, stepId: string): boolean => {
    return completedSteps.has(`${tutorialId}-${stepId}`);
  };

  const getTutorialProgress = (tutorial: Tutorial): number => {
    const completedCount = tutorial.steps.filter(step => 
      isStepCompleted(tutorial.id, step.id)
    ).length;
    return (completedCount / tutorial.steps.length) * 100;
  };

    if (isActive && currentTutorial) {
    const currentStep = getCurrentStep();
    if (!currentStep) return null;

    return (
      <>
        {/* Tutorial Overlay */}
        <div className="fixed inset-0 z-[9999] bg-black bg-opacity-50 flex items-center justify-center p-4">
          {/* Tutorial Modal */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 p-6 max-w-md w-full pointer-events-auto">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <Target className="w-5 h-5 text-blue-600" />
                <span className="text-sm font-medium text-gray-500">
                  Adım {currentStepIndex + 1} / {currentTutorial.steps.length}
                </span>
              </div>
              <button
                onClick={skipTutorial}
                className="text-gray-400 hover:text-gray-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Progress Bar */}
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mb-4">
              <div 
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${getProgressPercentage()}%` }}
              ></div>
            </div>

            {/* Content */}
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
              {currentStep.title}
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              {currentStep.description}
            </p>

            {currentStep.hint && (
              <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-3 mb-4">
                <div className="flex items-center gap-2">
                  <Lightbulb className="w-4 h-4 text-yellow-600" />
                  <span className="text-sm text-yellow-700 dark:text-yellow-300">
                    {currentStep.hint}
                  </span>
                </div>
              </div>
            )}

            {/* Action Button */}
            {currentStep.action && (
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3 mb-4">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-blue-700 dark:text-blue-300">Yapılacak:</span>
                  <span className="text-sm text-blue-600 dark:text-blue-400">
                    {currentStep.actionText || currentStep.action}
                  </span>
                </div>
              </div>
            )}

            {/* Navigation */}
            <div className="flex justify-between mt-4">
              <button
                onClick={prevStep}
                disabled={currentStepIndex === 0}
                className={`px-4 py-2 rounded text-sm flex items-center gap-2 transition-colors ${
                  currentStepIndex === 0
                    ? 'text-gray-400 cursor-not-allowed'
                    : 'text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200'
                }`}
              >
                <ArrowLeft className="w-4 h-4" />
                Önceki
              </button>

              <button
                onClick={nextStep}
                className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm flex items-center gap-2 transition-colors"
              >
                {currentStepIndex === currentTutorial.steps.length - 1 ? (
                  <>
                    <Check className="w-4 h-4" />
                    Tamamla
                  </>
                ) : (
                  <>
                    Sonraki
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      {/* Tutorial Trigger Button */}
      <button
        onClick={() => setShowTutorials(!showTutorials)}
        className="fixed bottom-6 left-6 bg-blue-600 hover:bg-blue-700 text-white rounded-full p-3 shadow-lg transition-all duration-200 z-50"
        title="İnteraktif Eğitim"
      >
        <HelpCircle className="w-6 h-6" />
      </button>

      {/* Tutorial Selection Modal */}
      {showTutorials && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[10000] p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full max-h-[80vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                    İnteraktif Eğitim
                  </h2>
                  <p className="text-gray-600 dark:text-gray-400">
                    Adım adım öğrenin, uygulayın
                  </p>
                </div>
                <button
                  onClick={() => setShowTutorials(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {tutorials.map((tutorial) => {
                  const progress = getTutorialProgress(tutorial);
                  const isCompleted = progress === 100;

                  return (
                    <div
                      key={tutorial.id}
                      className={`border rounded-lg p-4 transition-all cursor-pointer hover:shadow-md ${
                        isCompleted
                          ? 'border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-900/20'
                          : 'border-gray-200 dark:border-gray-600 hover:border-blue-300 dark:hover:border-blue-600'
                      }`}
                      onClick={() => startTutorial(tutorial)}
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h3 className="font-semibold text-gray-900 dark:text-white">
                            {tutorial.name}
                          </h3>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            {tutorial.description}
                          </p>
                        </div>
                        {isCompleted && (
                          <Check className="w-5 h-5 text-green-500" />
                        )}
                      </div>

                      <div className="space-y-2">
                        <div className="flex justify-between text-xs text-gray-500">
                          <span>{tutorial.steps.length} adım</span>
                          <span>%{Math.round(progress)} tamamlandı</span>
                        </div>
                        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                          <div
                            className={`h-2 rounded-full transition-all duration-300 ${
                              isCompleted ? 'bg-green-600' : 'bg-blue-600'
                            }`}
                            style={{ width: `${progress}%` }}
                          ></div>
                        </div>
                      </div>

                      <button className="w-full mt-3 bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg transition-colors flex items-center justify-center gap-2">
                        {isCompleted ? (
                          <>
                            <Play className="w-4 h-4" />
                            Tekrar İncele
                          </>
                        ) : (
                          <>
                            <Play className="w-4 h-4" />
                            Başla
                          </>
                        )}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default InteractiveTutorial;
