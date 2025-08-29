import React, { useState } from 'react';
import { Zap, Clock, AlertTriangle, CheckCircle, ArrowRight, ArrowLeft } from 'lucide-react';

interface PriorityWizardProps {
  onPriorityChange: (priority: string) => void;
  currentPriority: string;
  className?: string;
}

interface Question {
  id: string;
  text: string;
  options: {
    value: string;
    text: string;
    score: number;
  }[];
}

const PriorityWizard: React.FC<PriorityWizardProps> = ({
  onPriorityChange,
  currentPriority,
  className = ''
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [calculatedPriority, setCalculatedPriority] = useState<string>('');

  const questions: Question[] = [
    {
      id: 'business_impact',
      text: 'Bu sorun iş akışınızı ne kadar etkiliyor?',
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
      options: [
        { value: 'none', text: 'Zaman sınırı yok', score: 1 },
        { value: 'week', text: '1 hafta içinde', score: 3 },
        { value: '3days', text: '3 gün içinde', score: 4 },
        { value: 'day', text: '24 saat içinde', score: 5 },
        { value: 'urgent', text: 'Acil (bugün)', score: 6 }
      ]
    }
  ];

  const getPriorityFromScore = (score: number): string => {
    if (score >= 25) return 'high';
    if (score >= 18) return 'medium';
    return 'low';
  };

  const getPriorityInfo = (priority: string) => {
    const info = {
      low: {
        icon: <Clock className="w-5 h-5 text-gray-500" />,
        color: 'text-gray-600 dark:text-gray-400',
        bgColor: 'bg-gray-100 dark:bg-gray-800',
        text: 'Düşük Öncelik',
        description: 'İlk yanıt: 1 iş günü, Çözüm: 2-3 iş günü'
      },
      medium: {
        icon: <AlertTriangle className="w-5 h-5 text-yellow-500" />,
        color: 'text-yellow-600 dark:text-yellow-400',
        bgColor: 'bg-yellow-100 dark:bg-yellow-900/20',
        text: 'Orta Öncelik',
        description: 'İlk yanıt: 1 saat, Çözüm: 12-24 saat'
      },
      high: {
        icon: <Zap className="w-5 h-5 text-red-500" />,
        color: 'text-red-600 dark:text-red-400',
        bgColor: 'bg-red-100 dark:bg-red-900/20',
        text: 'Yüksek Öncelik',
        description: 'İlk yanıt: 15 dakika, Çözüm: 1-1.5 saat'
      }
    };
    return info[priority as keyof typeof info] || info.medium;
  };

  const handleAnswer = (questionId: string, value: string) => {
    setAnswers(prev => ({ ...prev, [questionId]: value }));
  };

  const calculatePriority = () => {
    let totalScore = 0;
    questions.forEach(question => {
      const answer = answers[question.id];
      if (answer) {
        const option = question.options.find(opt => opt.value === answer);
        if (option) {
          totalScore += option.score;
        }
      }
    });

    const priority = getPriorityFromScore(totalScore);
    setCalculatedPriority(priority);
    onPriorityChange(priority);
  };

  const handleNext = () => {
    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(prev => prev + 1);
    } else {
      calculatePriority();
    }
  };

  const handlePrevious = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(prev => prev - 1);
    }
  };

  const resetWizard = () => {
    setCurrentQuestion(0);
    setAnswers({});
    setCalculatedPriority('');
  };

  const currentPriorityInfo = getPriorityInfo(currentPriority);

  return (
    <div className={className}>
      {/* Başlık */}
      <div className="mb-4">
        <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Öncelik Belirleme Sihirbazı
        </h4>
      </div>
      
      {/* Öncelik Göstergesi */}
      <div className="mb-4">
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className={`w-full flex items-center justify-between p-3 rounded-lg border transition-colors ${currentPriorityInfo.bgColor} border-gray-200 dark:border-gray-700`}
        >
          <div className="flex items-center space-x-3">
            {currentPriorityInfo.icon}
            <div className="text-left">
              <p className={`text-sm font-medium ${currentPriorityInfo.color}`}>
                {currentPriorityInfo.text}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {currentPriorityInfo.description}
              </p>
            </div>
          </div>
          <ArrowRight className={`w-4 h-4 text-gray-400 transition-transform ${isOpen ? 'rotate-90' : ''}`} />
        </button>
      </div>

             {/* Öncelik Sihirbazı */}
       {isOpen && (
         <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 space-y-4">
           <div className="flex items-center justify-end">
             <button
               type="button"
               onClick={resetWizard}
               className="text-xs text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300"
             >
               Sıfırla
             </button>
           </div>

          {/* İlerleme Çubuğu */}
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
            <div
              className="bg-blue-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${((currentQuestion + 1) / questions.length) * 100}%` }}
            />
          </div>

          {/* Soru */}
          {currentQuestion < questions.length && (
            <div className="space-y-3">
              <p className="text-sm text-gray-700 dark:text-gray-300">
                {questions[currentQuestion].text}
              </p>
              <div className="space-y-2">
                {questions[currentQuestion].options.map((option) => (
                  <label
                    key={option.value}
                    className="flex items-center space-x-3 p-3 border border-gray-200 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer transition-colors"
                  >
                    <input
                      type="radio"
                      name={questions[currentQuestion].id}
                      value={option.value}
                      checked={answers[questions[currentQuestion].id] === option.value}
                      onChange={(e) => handleAnswer(questions[currentQuestion].id, e.target.value)}
                      className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-900 dark:text-white">
                      {option.text}
                    </span>
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* Sonuç */}
          {calculatedPriority && (
            <div className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
              <div className="flex items-center space-x-2">
                <CheckCircle className="w-5 h-5 text-green-500" />
                <div>
                  <p className="text-sm font-medium text-green-900 dark:text-green-300">
                    Önerilen Öncelik: {getPriorityInfo(calculatedPriority).text}
                  </p>
                  <p className="text-xs text-green-700 dark:text-green-400">
                    {getPriorityInfo(calculatedPriority).description}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Navigasyon Butonları */}
          <div className="flex justify-between">
            <button
              type="button"
              onClick={handlePrevious}
              disabled={currentQuestion === 0}
              className="flex items-center space-x-1 px-3 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Önceki</span>
            </button>
            
            {currentQuestion < questions.length - 1 ? (
              <button
                type="button"
                onClick={handleNext}
                disabled={!answers[questions[currentQuestion].id]}
                className="flex items-center space-x-1 px-3 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <span>Sonraki</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                type="button"
                onClick={handleNext}
                disabled={!answers[questions[currentQuestion].id]}
                className="flex items-center space-x-1 px-3 py-2 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <CheckCircle className="w-4 h-4" />
                <span>Hesapla</span>
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default PriorityWizard;
