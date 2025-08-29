import React, { useState, useEffect } from 'react';
import { 
  CheckCircle, 
  Clock, 
  AlertCircle, 
  Play, 
  Pause, 
  SkipForward,
  Calendar,
  User,
  MessageSquare,
  Settings,
  FileText,
  Zap,
  Heart,
  Star,
  ThumbsUp,
  Phone,
  Mail,
  Shield,
  Award
} from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';
import { tr } from 'date-fns/locale';
import { useSupabase } from '../hooks/useSupabase';

interface TicketWorkflowStepsProps {
  ticketId: string;
  ticketStatus: string;
  ticketPriority: string;
  className?: string;
}

interface WorkflowStep {
  step: number;
  title: string;
  description: string;
  icon: React.ComponentType<any>;
  status: 'completed' | 'active' | 'pending' | 'skipped';
  startedAt?: string;
  completedAt?: string;
  assignedUser?: string;
  estimatedDuration?: string;
  actualDuration?: string;
  customerBenefit?: string;
}

const TicketWorkflowSteps: React.FC<TicketWorkflowStepsProps> = ({
  ticketId,
  ticketStatus,
  ticketPriority,
  className = ''
}) => {
  const { fetchTicketWorkflowSteps } = useSupabase();
  const [workflowSteps, setWorkflowSteps] = useState<WorkflowStep[]>([]);
  const [loading, setLoading] = useState(true);

  // İkon bileşenleri
  const icons = {
    CheckCircle,
    Clock,
    AlertCircle,
    Play,
    Pause,
    SkipForward,
    Calendar,
    User,
    MessageSquare,
    Settings,
    FileText,
    Zap,
    Heart,
    Star,
    ThumbsUp,
    Phone,
    Mail,
    Shield,
    Award
  };

  // Müşteri odaklı iş akışı adımları
  const getWorkflowSteps = (status: string, priority: string): WorkflowStep[] => {
    const baseSteps: WorkflowStep[] = [
      {
        step: 1,
        title: 'Talebiniz Alındı',
        description: 'Talebiniz başarıyla sisteme kaydedildi ve kayıt numarası oluşturuldu',
        icon: Heart,
        status: 'completed',
        estimatedDuration: 'Anında',
        customerBenefit: 'Talebiniz güvenle kaydedildi'
      },
      {
        step: 2,
        title: 'Uzman Temsilci Seçiliyor',
        description: 'Talebiniz için en uygun uzman temsilci seçiliyor',
        icon: User,
        status: 'completed',
        estimatedDuration: '5 dakika',
        customerBenefit: 'Deneyimli uzman size yardımcı olacak'
      }
    ];

    const priorityResponse = {
      'low': { firstResponse: '24 saat', resolution: '3-5 iş günü' },
      'medium': { firstResponse: '4 saat', resolution: '1-2 iş günü' },
      'high': { firstResponse: '1 saat', resolution: '4-8 saat' },
      'urgent': { firstResponse: '15 dakika', resolution: '1-2 saat' }
    };

    const response = priorityResponse[priority as keyof typeof priorityResponse] || priorityResponse.medium;

    if (status === 'open') {
      return [
        ...baseSteps,
        {
          step: 3,
          title: 'İlk Yanıt Hazırlanıyor',
          description: `Temsilciniz size ${response.firstResponse} içinde ilk yanıtı verecek`,
          icon: MessageSquare,
          status: 'active',
          estimatedDuration: response.firstResponse,
          customerBenefit: 'Hızlı ve profesyonel yanıt alacaksınız'
        },
        {
          step: 4,
          title: 'Çözüm Süreci',
          description: 'Sorununuz çözüm için detaylı analiz edilecek',
          icon: Play,
          status: 'pending',
          estimatedDuration: response.resolution,
          customerBenefit: 'Sorununuz tamamen çözülecek'
        },
        {
          step: 5,
          title: 'Test ve Doğrulama',
          description: 'Çözüm test edilip size sunulacak',
          icon: Shield,
          status: 'pending',
          estimatedDuration: '30 dakika',
          customerBenefit: 'Güvenli ve test edilmiş çözüm'
        },
        {
          step: 6,
          title: 'Müşteri Memnuniyeti',
          description: 'Çözümden memnun kalıp kalmadığınızı öğreneceğiz',
          icon: Star,
          status: 'pending',
          estimatedDuration: '1 saat',
          customerBenefit: 'Memnuniyetiniz bizim için önemli'
        }
      ];
    }

    if (status === 'in_progress') {
      return [
        ...baseSteps,
        {
          step: 3,
          title: 'İlk Yanıt Verildi',
          description: 'Temsilciniz size ilk yanıtı verdi ve çalışmaya başladı',
          icon: MessageSquare,
          status: 'completed',
          estimatedDuration: response.firstResponse,
          customerBenefit: 'Artık sorununuzla ilgileniliyor'
        },
        {
          step: 4,
          title: 'Çözüm Süreci',
          description: 'Sorununuz aktif olarak çözülüyor ve ilerleme kaydediliyor',
          icon: Play,
          status: 'active',
          estimatedDuration: response.resolution,
          customerBenefit: 'Çözüm sürecinde her adımı takip edebilirsiniz'
        },
        {
          step: 5,
          title: 'Test ve Doğrulama',
          description: 'Çözüm test ediliyor ve size sunulmaya hazırlanıyor',
          icon: Shield,
          status: 'pending',
          estimatedDuration: '30 dakika',
          customerBenefit: 'Kaliteli çözüm için test süreci'
        },
        {
          step: 6,
          title: 'Müşteri Memnuniyeti',
          description: 'Çözümden memnun kalıp kalmadığınızı öğreneceğiz',
          icon: Star,
          status: 'pending',
          estimatedDuration: '1 saat',
          customerBenefit: 'Memnuniyetiniz bizim için önemli'
        }
      ];
    }

    if (status === 'resolved') {
      return [
        ...baseSteps,
        {
          step: 3,
          title: 'İlk Yanıt Verildi',
          description: 'Temsilciniz size ilk yanıtı verdi ve çalışmaya başladı',
          icon: MessageSquare,
          status: 'completed',
          estimatedDuration: response.firstResponse,
          customerBenefit: 'Hızlı yanıt aldınız'
        },
        {
          step: 4,
          title: 'Çözüm Tamamlandı',
          description: 'Sorununuz başarıyla çözüldü ve uygulandı',
          icon: Play,
          status: 'completed',
          estimatedDuration: response.resolution,
          customerBenefit: 'Sorununuz çözüldü!'
        },
        {
          step: 5,
          title: 'Test ve Doğrulama',
          description: 'Çözüm test edildi ve doğrulandı',
          icon: Shield,
          status: 'completed',
          estimatedDuration: '30 dakika',
          customerBenefit: 'Güvenli çözüm onaylandı'
        },
        {
          step: 6,
          title: 'Müşteri Memnuniyeti',
          description: 'Çözümden memnun kalıp kalmadığınızı öğrendik',
          icon: Star,
          status: 'completed',
          estimatedDuration: '1 saat',
          customerBenefit: 'Memnuniyetiniz kaydedildi'
        },
        {
          step: 7,
          title: 'Talep Başarıyla Tamamlandı',
          description: 'Talebiniz başarıyla tamamlandı ve kapatıldı',
          icon: Award,
          status: 'completed',
          estimatedDuration: 'Anında',
          customerBenefit: 'Talebiniz başarıyla tamamlandı!'
        }
      ];
    }

    if (status === 'closed') {
      return [
        ...baseSteps,
        {
          step: 3,
          title: 'İlk Yanıt Verildi',
          description: 'Temsilciniz size ilk yanıtı verdi ve çalışmaya başladı',
          icon: MessageSquare,
          status: 'completed',
          estimatedDuration: response.firstResponse,
          customerBenefit: 'Hızlı yanıt aldınız'
        },
        {
          step: 4,
          title: 'Çözüm Tamamlandı',
          description: 'Sorununuz başarıyla çözüldü ve uygulandı',
          icon: Play,
          status: 'completed',
          estimatedDuration: response.resolution,
          customerBenefit: 'Sorununuz çözüldü!'
        },
        {
          step: 5,
          title: 'Test ve Doğrulama',
          description: 'Çözüm test edildi ve doğrulandı',
          icon: Shield,
          status: 'completed',
          estimatedDuration: '30 dakika',
          customerBenefit: 'Güvenli çözüm onaylandı'
        },
        {
          step: 6,
          title: 'Müşteri Memnuniyeti',
          description: 'Çözümden memnun kalıp kalmadığınızı öğrendik',
          icon: Star,
          status: 'completed',
          estimatedDuration: '1 saat',
          customerBenefit: 'Memnuniyetiniz kaydedildi'
        },
        {
          step: 7,
          title: 'Talep Başarıyla Tamamlandı',
          description: 'Talebiniz başarıyla tamamlandı ve kapatıldı',
          icon: Award,
          status: 'completed',
          estimatedDuration: 'Anında',
          customerBenefit: 'Talebiniz başarıyla tamamlandı!'
        }
      ];
    }

    return baseSteps;
  };

  useEffect(() => {
    const loadWorkflowSteps = async () => {
      try {
        setLoading(true);
        // Veritabanından iş akışı adımlarını yükle
        const dbSteps = await fetchTicketWorkflowSteps(ticketId);
        
        // Varsayılan adımları al
        const defaultSteps = getWorkflowSteps(ticketStatus, ticketPriority);
        
        // Veritabanı verilerini varsayılan adımlarla birleştir
        const mergedSteps = defaultSteps.map(step => {
          const dbStep = dbSteps.find((db: any) => db.step_number === step.step);
          if (dbStep) {
            return {
              ...step,
              startedAt: dbStep.started_at,
              completedAt: dbStep.completed_at,
              assignedUser: dbStep.assigned_user_name,
              actualDuration: dbStep.actual_duration
            };
          }
          return step;
        });
        
        setWorkflowSteps(mergedSteps);
      } catch (error) {
        console.error('İş akışı adımları yüklenirken hata:', error);
        // Hata durumunda varsayılan adımları göster
        setWorkflowSteps(getWorkflowSteps(ticketStatus, ticketPriority));
      } finally {
        setLoading(false);
      }
    };

    loadWorkflowSteps();
  }, [ticketId, ticketStatus, ticketPriority]);

  const getStepIcon = (step: WorkflowStep) => {
    const Icon = step.icon;
    const iconClasses = {
      completed: 'text-green-500',
      active: 'text-blue-500',
      pending: 'text-gray-400',
      skipped: 'text-gray-300'
    };
    
    return <Icon className={`w-5 h-5 ${iconClasses[step.status]}`} />;
  };

  const getStepStatusColor = (status: string) => {
    const colors = {
      completed: 'bg-green-100 border-green-200 dark:bg-green-900/20 dark:border-green-800',
      active: 'bg-blue-100 border-blue-200 dark:bg-blue-900/20 dark:border-blue-800',
      pending: 'bg-gray-100 border-gray-200 dark:bg-gray-800 dark:border-gray-700',
      skipped: 'bg-gray-50 border-gray-100 dark:bg-gray-900 dark:border-gray-800'
    };
    return colors[status as keyof typeof colors] || colors.pending;
  };

  const getStepStatusText = (status: string) => {
    const texts = {
      completed: 'Tamamlandı',
      active: 'Devam Ediyor',
      pending: 'Bekliyor',
      skipped: 'Atlandı'
    };
    return texts[status as keyof typeof texts] || 'Bilinmiyor';
  };

  if (loading) {
    return (
      <div className={`bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700 ${className}`}>
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          <span className="ml-3 text-gray-600 dark:text-gray-400">İş akışı yükleniyor...</span>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700 ${className}`}>
      {/* Başlık */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
            <Heart className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Talebinizin Durumu
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {ticketStatus === 'open' ? 'Talebiniz alındı ve işleme alındı' : 
               ticketStatus === 'in_progress' ? 'Talebiniz aktif olarak çözülüyor' : 
               ticketStatus === 'resolved' ? 'Talebiniz başarıyla çözüldü' : 'Talebiniz tamamlandı'}
            </p>
          </div>
        </div>
        
        {/* İlerleme Yüzdesi */}
        <div className="text-right">
          <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
            {Math.round((workflowSteps.filter(s => s.status === 'completed').length / workflowSteps.length) * 100)}%
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">
            {workflowSteps.filter(s => s.status === 'completed').length} / {workflowSteps.length} adım
          </div>
        </div>
      </div>

      {/* İlerleme Çubuğu */}
      <div className="mb-6">
        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
          <div
            className="bg-gradient-to-r from-green-500 via-blue-500 to-blue-600 h-3 rounded-full transition-all duration-500 shadow-sm"
            style={{ 
              width: `${(workflowSteps.filter(s => s.status === 'completed').length / workflowSteps.length) * 100}%` 
            }}
          />
        </div>
      </div>

      {/* Adımlar */}
      <div className="space-y-4">
        {workflowSteps.map((step, index) => (
          <div
            key={step.step}
            className={`p-5 rounded-xl border-2 transition-all duration-200 hover:shadow-md ${getStepStatusColor(step.status)}`}
          >
            <div className="flex items-start space-x-4">
              {/* Adım Numarası ve İkon */}
              <div className="flex-shrink-0">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                  step.status === 'completed' ? 'bg-green-500 shadow-lg' :
                  step.status === 'active' ? 'bg-blue-500 shadow-lg animate-pulse' :
                  'bg-gray-300 dark:bg-gray-600'
                }`}>
                  {step.status === 'completed' ? (
                    <CheckCircle className="w-6 h-6 text-white" />
                  ) : (
                    <span className="text-sm font-bold text-white">
                      {step.step}
                    </span>
                  )}
                </div>
              </div>

              {/* Adım İçeriği */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-3">
                    {getStepIcon(step)}
                    <h4 className="text-lg font-semibold text-gray-900 dark:text-white">
                      {step.title}
                    </h4>
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                      step.status === 'completed' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300' :
                      step.status === 'active' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300 animate-pulse' :
                      'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300'
                    }`}>
                      {getStepStatusText(step.status)}
                    </span>
                  </div>
                  
                  {/* Zaman Bilgisi */}
                  <div className="text-right text-sm text-gray-500 dark:text-gray-400">
                    {step.startedAt && (
                      <div className="font-medium">
                        Başlangıç: {format(new Date(step.startedAt), 'dd MMM HH:mm', { locale: tr })}
                      </div>
                    )}
                    {step.completedAt && (
                      <div className="font-medium text-green-600">
                        Tamamlandı: {format(new Date(step.completedAt), 'dd MMM HH:mm', { locale: tr })}
                      </div>
                    )}
                    {step.estimatedDuration && (
                      <div className="text-xs">
                        Tahmini süre: {step.estimatedDuration}
                      </div>
                    )}
                  </div>
                </div>

                <p className="text-base text-gray-700 dark:text-gray-300 mb-3 leading-relaxed">
                  {step.description}
                </p>

                {/* Müşteri Faydası */}
                {step.customerBenefit && (
                  <div className="bg-blue-50 dark:bg-blue-900/30 rounded-lg p-3 mb-3 border border-blue-200 dark:border-blue-800">
                    <div className="flex items-center space-x-2">
                      <ThumbsUp className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                      <span className="text-sm font-medium text-blue-800 dark:text-blue-300">
                        Sizin İçin:
                      </span>
                    </div>
                    <p className="text-sm text-blue-700 dark:text-blue-400 mt-1">
                      {step.customerBenefit}
                    </p>
                  </div>
                )}

                {/* Atanan Kullanıcı */}
                {step.assignedUser && (
                  <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
                    <User className="w-4 h-4" />
                    <span className="font-medium">Temsilci:</span>
                    <span>{step.assignedUser}</span>
                  </div>
                )}

                {/* Gerçek Süre */}
                {step.actualDuration && (
                  <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400 mt-2">
                    <Clock className="w-4 h-4" />
                    <span className="font-medium">Gerçek süre:</span>
                    <span>{step.actualDuration}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Müşteri Bilgilendirme */}
      <div className="mt-6 p-5 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl border border-blue-200 dark:border-blue-800">
        <div className="flex items-center space-x-3 mb-3">
          <div className="p-2 bg-blue-100 dark:bg-blue-900/40 rounded-lg">
            <MessageSquare className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <h4 className="text-lg font-semibold text-blue-900 dark:text-blue-300">
              Size Nasıl Ulaşacağız?
            </h4>
            <p className="text-sm text-blue-700 dark:text-blue-400">
              Gelişmeler hakkında sizi bilgilendireceğiz
            </p>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div className="flex items-center space-x-2 text-blue-700 dark:text-blue-400">
            <Mail className="w-4 h-4" />
            <span>E-posta ile bilgilendirme</span>
          </div>
          <div className="flex items-center space-x-2 text-blue-700 dark:text-blue-400">
            <Phone className="w-4 h-4" />
            <span>Gerekirse telefon ile arama</span>
          </div>
          <div className="flex items-center space-x-2 text-blue-700 dark:text-blue-400">
            <MessageSquare className="w-4 h-4" />
            <span>Sistem üzerinden mesaj</span>
          </div>
          <div className="flex items-center space-x-2 text-blue-700 dark:text-blue-400">
            <Shield className="w-4 h-4" />
            <span>Güvenli ve hızlı çözüm</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TicketWorkflowSteps;
