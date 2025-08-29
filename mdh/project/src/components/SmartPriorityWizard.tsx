import React, { useState } from 'react';
import { 
  Clock, 
  AlertTriangle, 
  CheckCircle, 
  ArrowLeft,
  Brain,
  TrendingUp,
  BarChart3
} from 'lucide-react';
import { toast } from 'react-hot-toast';

interface SmartPriorityWizardProps {
  onPriorityChange: (priority: string, confidence: number, reasoning: string) => void;
  currentPriority: string;
  className?: string;
  customerData?: any;
  ticketHistory?: any[];
}

const SmartPriorityWizard: React.FC<SmartPriorityWizardProps> = ({
  onPriorityChange,
  className = ''
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [analysis, setAnalysis] = useState<any>(null);
  const [showAnalysis, setShowAnalysis] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const questions = [
    {
      id: 'business_impact',
      text: 'Bu sorun iş akışınızı ne kadar etkiliyor?',
      weight: 25,
      options: [
        { value: 'none', text: 'Hiç etkilemiyor', score: 1 },
        { value: 'low', text: 'Az etkiliyor', score: 2 },
        { value: 'medium', text: 'Orta düzeyde etkiliyor', score: 3 },
        { value: 'high', text: 'Çok etkiliyor', score: 4 },
        { value: 'critical', text: 'İş akışını tamamen durduruyor', score: 5 }
      ]
    },
    {
      id: 'affected_users',
      text: 'Kaç kişi bu sorundan etkileniyor?',
      weight: 20,
      options: [
        { value: '1', text: 'Sadece ben', score: 1 },
        { value: '2-5', text: '2-5 kişi', score: 2 },
        { value: '6-20', text: '6-20 kişi', score: 3 },
        { value: '21-100', text: '21-100 kişi', score: 4 },
        { value: '100+', text: '100+ kişi', score: 5 }
      ]
    },
    {
      id: 'revenue_impact',
      text: 'Bu sorun gelir kaybına neden oluyor mu?',
      weight: 25,
      options: [
        { value: 'none', text: 'Gelir kaybı yok', score: 1 },
        { value: 'low', text: 'Az gelir kaybı', score: 2 },
        { value: 'medium', text: 'Orta düzeyde gelir kaybı', score: 3 },
        { value: 'high', text: 'Yüksek gelir kaybı', score: 4 },
        { value: 'critical', text: 'Kritik gelir kaybı', score: 5 }
      ]
    },
    {
      id: 'frequency',
      text: 'Bu sorun ne sıklıkla oluşuyor?',
      weight: 15,
      options: [
        { value: 'once', text: 'Sadece bir kez', score: 1 },
        { value: 'rarely', text: 'Nadiren', score: 2 },
        { value: 'sometimes', text: 'Ara sıra', score: 3 },
        { value: 'often', text: 'Sık sık', score: 4 },
        { value: 'always', text: 'Sürekli', score: 5 }
      ]
    },
    {
      id: 'deadline',
      text: 'Bu sorunun çözülmesi için bir zaman sınırı var mı?',
      weight: 15,
      options: [
        { value: 'none', text: 'Zaman sınırı yok', score: 1 },
        { value: 'week', text: '1 hafta içinde', score: 3 },
        { value: '3days', text: '3 gün içinde', score: 4 },
        { value: 'day', text: '24 saat içinde', score: 5 },
        { value: 'urgent', text: 'Acil (bugün)', score: 6 }
      ]
    }
  ];

  const performAIAnalysis = async () => {
    setIsAnalyzing(true);
    await new Promise(resolve => setTimeout(resolve, 2000));

    const totalScore = Object.entries(answers).reduce((score, [questionId, answer]) => {
      const question = questions.find(q => q.id === questionId);
      const option = question?.options.find(o => o.value === answer);
      return score + (option?.score || 0) * (question?.weight || 0);
    }, 0);

    let priority: string;
    let confidence: number;
    let reasoning: string;

    if (totalScore >= 120) {
      priority = 'urgent';
      confidence = 95;
      reasoning = 'Kritik iş etkisi ve acil deadline nedeniyle en yüksek öncelik';
    } else if (totalScore >= 90) {
      priority = 'high';
      confidence = 85;
      reasoning = 'Yüksek iş etkisi ve finansal kayıp nedeniyle yüksek öncelik';
    } else if (totalScore >= 60) {
      priority = 'medium';
      confidence = 75;
      reasoning = 'Orta düzeyde etki ve sıklık nedeniyle orta öncelik';
    } else {
      priority = 'low';
      confidence = 80;
      reasoning = 'Düşük etki ve esnek deadline nedeniyle düşük öncelik';
    }

    setIsAnalyzing(false);
    return { priority, confidence, reasoning, totalScore };
  };

  const handleAnswer = (answer: string) => {
    const currentQ = questions[currentQuestion];
    setAnswers(prev => ({ ...prev, [currentQ.id]: answer }));

    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(prev => prev + 1);
    } else {
      performAIAnalysis().then(result => {
        setAnalysis(result);
        setShowAnalysis(true);
      });
    }
  };

  const handleConfirmPriority = () => {
    if (analysis) {
      onPriorityChange(analysis.priority, analysis.confidence, analysis.reasoning);
      toast.success(`Öncelik ${analysis.priority} olarak belirlendi`);
      setIsOpen(false);
      setShowAnalysis(false);
      setCurrentQuestion(0);
      setAnswers({});
      setAnalysis(null);
    }
  };

  const getPriorityInfo = (priority: string) => {
    const info = {
      urgent: {
        icon: <AlertTriangle className="w-5 h-5 text-red-500" />,
        color: 'text-red-600 dark:text-red-400',
        bgColor: 'bg-red-100 dark:bg-red-900/20',
        text: 'Acil Öncelik'
      },
      high: {
        icon: <TrendingUp className="w-5 h-5 text-orange-500" />,
        color: 'text-orange-600 dark:text-orange-400',
        bgColor: 'bg-orange-100 dark:bg-orange-900/20',
        text: 'Yüksek Öncelik'
      },
      medium: {
        icon: <Clock className="w-5 h-5 text-blue-500" />,
        color: 'text-blue-600 dark:text-blue-400',
        bgColor: 'bg-blue-100 dark:bg-blue-900/20',
        text: 'Orta Öncelik'
      },
      low: {
        icon: <CheckCircle className="w-5 h-5 text-green-500" />,
        color: 'text-green-600 dark:text-green-400',
        bgColor: 'bg-green-100 dark:bg-green-900/20',
        text: 'Düşük Öncelik'
      }
    };
    return info[priority as keyof typeof info] || info.medium;
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className={`flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg hover:from-blue-600 hover:to-purple-700 transition-all duration-200 shadow-lg hover:shadow-xl ${className}`}
      >
        <Brain className="w-4 h-4" />
        <span>Akıllı Öncelik Belirleme</span>
                        <Brain className="w-4 h-4" />
      </button>
    );
  }

  if (showAnalysis && analysis) {
    const priorityInfo = getPriorityInfo(analysis.priority);
    
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
          <div className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <Brain className="w-5 h-5 text-blue-500" />
                AI Öncelik Analizi
              </h3>
              <button onClick={() => setIsOpen(false)} className="text-gray-400 hover:text-gray-600">✕</button>
            </div>

            <div className={`${priorityInfo.bgColor} rounded-lg p-4 mb-6`}>
              <div className="flex items-center gap-3 mb-2">
                {priorityInfo.icon}
                <span className={`font-semibold ${priorityInfo.color}`}>{priorityInfo.text}</span>
                <div className="ml-auto bg-white dark:bg-gray-700 px-2 py-1 rounded text-sm">
                  %{analysis.confidence} Güven
                </div>
              </div>
            </div>

            <div className="mb-6">
              <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Analiz Sonucu</h4>
              <p className="text-gray-600 dark:text-gray-300 text-sm">{analysis.reasoning}</p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={handleConfirmPriority}
                className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Bu Önceliği Onayla
              </button>
              <button
                onClick={() => {
                  setShowAnalysis(false);
                  setCurrentQuestion(0);
                  setAnswers({});
                }}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Yeniden Başla
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <Brain className="w-5 h-5 text-blue-500" />
              Akıllı Öncelik Belirleme
            </h3>
            <button onClick={() => setIsOpen(false)} className="text-gray-400 hover:text-gray-600">✕</button>
          </div>

          <div className="mb-6">
            <div className="flex justify-between text-sm text-gray-600 mb-2">
              <span>Soru {currentQuestion + 1} / {questions.length}</span>
              <span>%{Math.round(((currentQuestion + 1) / questions.length) * 100)}</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-gradient-to-r from-blue-500 to-purple-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${((currentQuestion + 1) / questions.length) * 100}%` }}
              />
            </div>
          </div>

          <div className="mb-6">
            <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              {questions[currentQuestion].text}
            </h4>
            <div className="space-y-3">
              {questions[currentQuestion].options.map((option) => (
                <button
                  key={option.value}
                  onClick={() => handleAnswer(option.value)}
                  className="w-full text-left p-4 border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-all duration-200"
                >
                  <div className="font-medium text-gray-900 dark:text-white">{option.text}</div>
                </button>
              ))}
            </div>
          </div>

          <div className="flex justify-between">
            <button
              onClick={() => setCurrentQuestion(prev => Math.max(0, prev - 1))}
              disabled={currentQuestion === 0}
              className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-800 disabled:opacity-50"
            >
              <ArrowLeft className="w-4 h-4" />
              Önceki
            </button>
            
            {isAnalyzing && (
              <div className="flex items-center gap-2 text-blue-600">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                AI Analiz ediyor...
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SmartPriorityWizard;
