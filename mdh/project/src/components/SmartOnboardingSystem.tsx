import React, { useState, useEffect } from 'react';
import { useSupabase } from '../hooks/useSupabase';
import { 
  BookOpen, 
  Trophy, 
  Lightbulb, 
  Play, 
  Check, 
  ArrowRight, 
  ArrowLeft,
  Star,
  Clock,
  Target,
  Award,
  HelpCircle,
  X,
  ChevronRight
} from 'lucide-react';
import toast from 'react-hot-toast';

interface TrainingModule {
  id: string;
  name: string;
  description: string;
  category: string;
  difficulty_level: number;
  estimated_duration: number;
  progress_percentage: number;
  is_completed: boolean;
  content: any[];
}

interface TrainingStep {
  type: string;
  title: string;
  content: string;
  questions?: any[];
}

interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: string;
  points: number;
}

interface SmartTip {
  id: string;
  title: string;
  content: string;
  category: string;
}

const SmartOnboardingSystem: React.FC = () => {
  const { supabase } = useSupabase();
  const [activeTab, setActiveTab] = useState<'modules' | 'progress' | 'badges' | 'tips'>('modules');
  const [modules, setModules] = useState<TrainingModule[]>([]);
  const [selectedModule, setSelectedModule] = useState<TrainingModule | null>(null);
  const [currentStep, setCurrentStep] = useState(0);
  const [userProgress, setUserProgress] = useState<any[]>([]);
  const [badges, setBadges] = useState<Badge[]>([]);
  const [userBadges, setUserBadges] = useState<Badge[]>([]);
  const [smartTips, setSmartTips] = useState<SmartTip[]>([]);
  const [loading, setLoading] = useState(true);
  const [quizAnswers, setQuizAnswers] = useState<Record<string, number>>({});
  const [showTip, setShowTip] = useState<SmartTip | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      // Önerilen modülleri yükle
      const { data: recommendedModules } = await supabase.rpc('get_recommended_modules', {
        p_user_id: null, // Şimdilik null, auth sistemi eklenince güncellenecek
        p_user_role: 'basic'
      });

      // Kullanıcı ilerlemesini yükle
      const { data: progress } = await supabase.rpc('get_user_training_progress', {
        p_user_id: null
      });

      // Rozetleri yükle
      const { data: badgesData } = await supabase
        .from('training_badges')
        .select('*')
        .eq('is_active', true);

      // Kullanıcı rozetlerini yükle
      const { data: userBadgesData } = await supabase
        .from('user_badges')
        .select(`
          badge_id,
          training_badges (
            id,
            name,
            description,
            icon,
            category,
            points
          )
        `);

      // Akıllı ipuçlarını yükle
      const { data: tipsData } = await supabase
        .from('smart_tips')
        .select('*')
        .eq('is_active', true)
        .order('priority', { ascending: false });

      setModules(recommendedModules || []);
      setUserProgress(progress || []);
      setBadges(badgesData || []);
      setUserBadges(userBadgesData?.map(ub => ub.training_badges) || []);
      setSmartTips(tipsData || []);

    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('Veriler yüklenirken hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  const startModule = (module: TrainingModule) => {
    setSelectedModule(module);
    setCurrentStep(0);
    setQuizAnswers({});
  };

  const nextStep = async () => {
    if (!selectedModule) return;

    const steps = selectedModule.content;
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      // Modül tamamlandı
      await completeModule();
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const completeModule = async () => {
    if (!selectedModule) return;

    try {
      // İlerlemeyi güncelle
      await supabase.rpc('update_training_progress', {
        p_user_id: null,
        p_module_id: selectedModule.id,
        p_progress_percentage: 100,
        p_current_step: selectedModule.content.length,
        p_completed_steps: selectedModule.content.map((_, index) => index + 1)
      });

      // Başarı rozetlerini kontrol et
      const { data: earnedBadges } = await supabase.rpc('check_and_award_badges', {
        p_user_id: null
      });

      if (earnedBadges && earnedBadges.length > 0) {
        toast.success(
          <div>
            <div className="font-semibold">Tebrikler! 🎉</div>
            <div className="text-sm">Yeni rozetler kazandınız!</div>
            {earnedBadges.map((badge: any) => (
              <div key={badge.badge_id} className="text-sm">
                {badge.icon} {badge.name} (+{badge.points} puan)
              </div>
            ))}
          </div>,
          { duration: 5000 }
        );
      } else {
        toast.success('Modül başarıyla tamamlandı! 🎉');
      }

      // Verileri yeniden yükle
      await loadData();
      setSelectedModule(null);
      setCurrentStep(0);

    } catch (error) {
      console.error('Error completing module:', error);
      toast.error('Modül tamamlanırken hata oluştu');
    }
  };

  const handleQuizAnswer = (questionIndex: number, answerIndex: number) => {
    setQuizAnswers(prev => ({ ...prev, [questionIndex]: answerIndex }));
  };

  const getCurrentStep = (): TrainingStep | null => {
    if (!selectedModule) return null;
    return selectedModule.content[currentStep];
  };

  const renderStepContent = (step: TrainingStep) => {
    switch (step.type) {
      case 'welcome':
      case 'overview':
      case 'navigation':
      case 'search':
      case 'create':
      case 'assign':
      case 'status':
      case 'profile':
      case 'history':
        return (
          <div className="space-y-4">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
              {step.title}
            </h3>
            <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
              {step.content}
            </p>
          </div>
        );

      case 'quiz':
        return (
          <div className="space-y-4">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
              {step.title}
            </h3>
            {step.questions?.map((question, qIndex) => (
              <div key={qIndex} className="space-y-3">
                <p className="font-medium text-gray-800 dark:text-gray-200">
                  {question.question}
                </p>
                <div className="space-y-2">
                  {question.options.map((option: string, oIndex: number) => (
                    <button
                      key={oIndex}
                      onClick={() => handleQuizAnswer(qIndex, oIndex)}
                      className={`w-full p-3 text-left rounded-lg border transition-colors ${
                        quizAnswers[qIndex] === oIndex
                          ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300'
                          : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500'
                      }`}
                    >
                      {option}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        );

      default:
        return (
          <div className="space-y-4">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
              {step.title}
            </h3>
            <p className="text-gray-600 dark:text-gray-300">
              {step.content}
            </p>
          </div>
        );
    }
  };

  const showRandomTip = () => {
    if (smartTips.length > 0) {
      const randomTip = smartTips[Math.floor(Math.random() * smartTips.length)];
      setShowTip(randomTip);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (selectedModule) {
    const currentStepData = getCurrentStep();
    const totalSteps = selectedModule.content.length;
    const progress = ((currentStep + 1) / totalSteps) * 100;

    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
        <div className="max-w-4xl mx-auto px-4">
          {/* Header */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setSelectedModule(null)}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                >
                  <ArrowLeft className="w-5 h-5" />
                </button>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                    {selectedModule.name}
                  </h1>
                  <p className="text-gray-600 dark:text-gray-400">
                    {selectedModule.description}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-4 text-sm text-gray-500">
                <div className="flex items-center gap-1">
                  <Clock className="w-4 h-4" />
                  <span>{selectedModule.estimated_duration} dk</span>
                </div>
                <div className="flex items-center gap-1">
                  <Target className="w-4 h-4" />
                  <span>Seviye {selectedModule.difficulty_level}</span>
                </div>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
              <div 
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              ></div>
            </div>
            <div className="flex justify-between text-sm text-gray-500 mt-2">
              <span>Adım {currentStep + 1} / {totalSteps}</span>
              <span>%{Math.round(progress)}</span>
            </div>
          </div>

          {/* Step Content */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 mb-6">
            {currentStepData && renderStepContent(currentStepData)}
          </div>

          {/* Navigation */}
          <div className="flex justify-between">
            <button
              onClick={prevStep}
              disabled={currentStep === 0}
              className={`px-6 py-2 rounded-lg flex items-center gap-2 transition-colors ${
                currentStep === 0
                  ? 'bg-gray-100 dark:bg-gray-700 text-gray-400 cursor-not-allowed'
                  : 'bg-gray-600 hover:bg-gray-700 text-white'
              }`}
            >
              <ArrowLeft className="w-4 h-4" />
              Önceki
            </button>

            <button
              onClick={nextStep}
              className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg flex items-center gap-2 transition-colors"
            >
              {currentStep === totalSteps - 1 ? (
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
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="max-w-6xl mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Akıllı Onboarding ve Eğitim Sistemi
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Kişiselleştirilmiş eğitim ile sisteminizi hızlıca öğrenin
          </p>
        </div>

        {/* Quick Tip */}
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Lightbulb className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              <div>
                <h3 className="font-semibold text-blue-900 dark:text-blue-100">
                  Günün İpucu
                </h3>
                <p className="text-sm text-blue-700 dark:text-blue-300">
                  {smartTips.length > 0 ? smartTips[0].content : 'Akıllı ipuçları yakında...'}
                </p>
              </div>
            </div>
            <button
              onClick={showRandomTip}
              className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300"
            >
              <HelpCircle className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 mb-6">
          <div className="border-b border-gray-200 dark:border-gray-700">
            <nav className="flex space-x-8 px-6">
              {[
                { id: 'modules', label: 'Eğitim Modülleri', icon: BookOpen },
                { id: 'progress', label: 'İlerleme', icon: Target },
                { id: 'badges', label: 'Rozetler', icon: Trophy },
                { id: 'tips', label: 'İpuçları', icon: Lightbulb }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2 transition-colors ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                      : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
                  }`}
                >
                  <tab.icon className="w-4 h-4" />
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>

          <div className="p-6">
            {activeTab === 'modules' && (
              <div className="space-y-4">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                  Önerilen Eğitim Modülleri
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {modules.map((module) => (
                    <div
                      key={module.id}
                      className="border border-gray-200 dark:border-gray-600 rounded-lg p-4 hover:shadow-md transition-shadow"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <h3 className="font-semibold text-gray-900 dark:text-white">
                          {module.name}
                        </h3>
                        {module.is_completed && (
                          <Check className="w-5 h-5 text-green-500" />
                        )}
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                        {module.description}
                      </p>
                      <div className="flex items-center justify-between text-sm text-gray-500 mb-3">
                        <span>Seviye {module.difficulty_level}</span>
                        <span>{module.estimated_duration} dk</span>
                      </div>
                      {module.progress_percentage > 0 && (
                        <div className="mb-3">
                          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                            <div
                              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                              style={{ width: `${module.progress_percentage}%` }}
                            ></div>
                          </div>
                          <div className="text-xs text-gray-500 mt-1">
                            %{module.progress_percentage} tamamlandı
                          </div>
                        </div>
                      )}
                      <button
                        onClick={() => startModule(module)}
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
                      >
                        {module.is_completed ? (
                          <>
                            <Check className="w-4 h-4" />
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
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'progress' && (
              <div className="space-y-4">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                  Eğitim İlerlemeniz
                </h2>
                {userProgress.length > 0 ? (
                  <div className="space-y-4">
                    {userProgress.map((progress) => (
                      <div
                        key={progress.module_id}
                        className="border border-gray-200 dark:border-gray-600 rounded-lg p-4"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <h3 className="font-semibold text-gray-900 dark:text-white">
                            {progress.module_name}
                          </h3>
                          <span className="text-sm text-gray-500">
                            {progress.time_spent} dk
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mb-2">
                          <div
                            className="bg-green-600 h-2 rounded-full transition-all duration-300"
                            style={{ width: `${progress.progress_percentage}%` }}
                          ></div>
                        </div>
                        <div className="flex justify-between text-sm text-gray-500">
                          <span>%{progress.progress_percentage} tamamlandı</span>
                          <span>Skor: {progress.score}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 text-center py-8">
                    Henüz eğitim modülü başlatmadınız.
                  </p>
                )}
              </div>
            )}

            {activeTab === 'badges' && (
              <div className="space-y-4">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                  Başarı Rozetleri
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {badges.map((badge) => {
                    const isEarned = userBadges.some(ub => ub.id === badge.id);
                    return (
                      <div
                        key={badge.id}
                        className={`border rounded-lg p-4 transition-all ${
                          isEarned
                            ? 'border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-900/20'
                            : 'border-gray-200 dark:border-gray-600'
                        }`}
                      >
                        <div className="flex items-center gap-3 mb-2">
                          <span className="text-2xl">{badge.icon}</span>
                          <div>
                            <h3 className="font-semibold text-gray-900 dark:text-white">
                              {badge.name}
                            </h3>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              {badge.description}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-500">
                            +{badge.points} puan
                          </span>
                          {isEarned && (
                            <span className="text-green-600 dark:text-green-400 text-sm font-medium">
                              Kazanıldı
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {activeTab === 'tips' && (
              <div className="space-y-4">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                  Akıllı İpuçları
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {smartTips.map((tip) => (
                    <div
                      key={tip.id}
                      className="border border-gray-200 dark:border-gray-600 rounded-lg p-4"
                    >
                      <div className="flex items-start gap-3">
                        <Lightbulb className="w-5 h-5 text-yellow-500 mt-0.5" />
                        <div>
                          <h3 className="font-semibold text-gray-900 dark:text-white mb-1">
                            {tip.title}
                          </h3>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            {tip.content}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Smart Tip Modal */}
      {showTip && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md mx-4">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Lightbulb className="w-5 h-5 text-yellow-500" />
                <h3 className="font-semibold text-gray-900 dark:text-white">
                  Akıllı İpucu
                </h3>
              </div>
              <button
                onClick={() => setShowTip(null)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <h4 className="font-medium text-gray-900 dark:text-white mb-2">
              {showTip.title}
            </h4>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              {showTip.content}
            </p>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowTip(null)}
                className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
              >
                Kapat
              </button>
              <button
                onClick={() => {
                  // İpucu faydalı mı kaydet
                  setShowTip(null);
                }}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg"
              >
                Faydalı
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SmartOnboardingSystem;
