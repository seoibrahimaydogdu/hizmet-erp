import React, { useState, useEffect, useRef } from 'react';
import { 
  Lightbulb, 
  X, 
  ChevronDown, 
  ChevronUp, 
  MessageSquare, 
  Clock, 
  AlertTriangle,
  CheckCircle,
  Info,
  Zap,
  Star,
  TrendingUp,
  Users,
  DollarSign,
  Settings
} from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { toast } from 'react-hot-toast';
import { formatCurrency } from '../lib/currency';

interface Hint {
  id: string;
  type: 'info' | 'warning' | 'success' | 'tip' | 'priority' | 'performance';
  title: string;
  message: string;
  category: string;
  priority: 'low' | 'medium' | 'high';
  timestamp: Date;
  isRead: boolean;
  action?: {
    label: string;
    onClick: () => void;
  };
  relatedData?: any;
}

interface RealTimeHintSystemProps {
  currentPage?: string;
  currentAction?: string;
  userRole?: string;
  contextData?: any;
  onHintAction?: (hintId: string, action: string) => void;
  className?: string;
}

const RealTimeHintSystem: React.FC<RealTimeHintSystemProps> = ({
  currentPage = 'dashboard',
  currentAction = '',
  userRole = 'admin',
  contextData = {},
  onHintAction,
  className = ''
}) => {
  const { isDark } = useTheme();
  const [hints, setHints] = useState<Hint[]>([]);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [activeHint, setActiveHint] = useState<Hint | null>(null);
  const [showAllHints, setShowAllHints] = useState(false);
  const hintTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Akıllı ipuçları veritabanı
  const hintDatabase = {
    dashboard: [
      {
        id: 'dashboard_performance',
        type: 'performance' as const,
        title: 'Performans Optimizasyonu',
        message: 'Dashboard yükleme süreniz 2.3 saniye. Önbellek kullanarak %40 hızlandırabilirsiniz.',
        category: 'performance',
        priority: 'medium' as const,
        action: {
          label: 'Optimize Et',
          onClick: () => {
            toast.success('Performans optimizasyonu başlatıldı');
            onHintAction?.('dashboard_performance', 'optimize');
          }
        }
      },
      {
        id: 'dashboard_analytics',
        type: 'tip' as const,
        title: 'Analitik İpuçları',
        message: 'Son 7 günde %15 artış var. Detaylı analiz için "Raporlar" sekmesini kullanın.',
        category: 'analytics',
        priority: 'low' as const,
        action: {
          label: 'Raporları Gör',
          onClick: () => {
            toast.success('Raporlar sayfasına yönlendiriliyorsunuz');
            onHintAction?.('dashboard_analytics', 'view_reports');
          }
        }
      },
      {
        id: 'dashboard_notifications',
        type: 'info' as const,
        title: 'Bildirim Yönetimi',
        message: `${contextData?.unreadNotifications || 0} okunmamış bildiriminiz var. Hızlı aksiyon alabilirsiniz.`,
        category: 'notifications',
        priority: 'medium' as const,
        action: {
          label: 'Bildirimleri Gör',
          onClick: () => {
            toast.success('Bildirimler açılıyor');
            onHintAction?.('dashboard_notifications', 'view_notifications');
          }
        }
      },
      {
        id: 'dashboard_quick_actions',
        type: 'tip' as const,
        title: 'Hızlı İşlemler',
        message: 'Sık kullanılan işlemlerinizi hızlıca gerçekleştirmek için kısayolları kullanın.',
        category: 'productivity',
        priority: 'low' as const,
        action: {
          label: 'Kısayolları Gör',
          onClick: () => {
            toast.success('Kısayol listesi açılıyor');
            onHintAction?.('dashboard_quick_actions', 'view_shortcuts');
          }
        }
      }
    ],
    tickets: [
      {
        id: 'ticket_priority',
        type: 'priority' as const,
        title: 'Öncelik Yönetimi',
        message: '5 adet yüksek öncelikli talep bekliyor. Akıllı öncelik sistemi ile %30 daha hızlı çözüm.',
        category: 'priority',
        priority: 'high' as const,
        action: {
          label: 'Akıllı Sırala',
          onClick: () => {
            toast.success('Akıllı öncelik sıralaması uygulandı');
            onHintAction?.('ticket_priority', 'smart_sort');
          }
        }
      },
      {
        id: 'ticket_response_time',
        type: 'warning' as const,
        title: 'Yanıt Süresi Uyarısı',
        message: 'Ortalama yanıt süreniz 4.2 saat. Hedef: 2 saat. Hızlı yanıt şablonları kullanabilirsiniz.',
        category: 'response_time',
        priority: 'medium' as const,
        action: {
          label: 'Şablonları Gör',
          onClick: () => {
            toast.success('Hızlı yanıt şablonları açılıyor');
            onHintAction?.('ticket_response_time', 'view_templates');
          }
        }
      },
      {
        id: 'ticket_auto_categorization',
        type: 'tip' as const,
        title: 'Otomatik Kategorizasyon',
        message: 'AI destekli kategorizasyon ile %85 doğruluk oranı. Manuel kategorizasyon sürenizi %60 azaltın.',
        category: 'ai',
        priority: 'low' as const,
        action: {
          label: 'AI\'yi Etkinleştir',
          onClick: () => {
            toast.success('AI kategorizasyon sistemi etkinleştirildi');
            onHintAction?.('ticket_auto_categorization', 'enable_ai');
          }
        }
      }
    ],
    customers: [
      {
        id: 'customer_satisfaction',
        type: 'success' as const,
        title: 'Müşteri Memnuniyeti',
        message: 'Müşteri memnuniyet skorunuz 4.7/5. Son 30 günde %12 artış var.',
        category: 'satisfaction',
        priority: 'low' as const,
        action: {
          label: 'Detayları Gör',
          onClick: () => {
            toast.success('Müşteri memnuniyet raporu açılıyor');
            onHintAction?.('customer_satisfaction', 'view_details');
          }
        }
      },
      {
        id: 'customer_churn_risk',
        type: 'warning' as const,
        title: 'Müşteri Kaybı Riski',
        message: '3 müşteri kaybı riski altında. Proaktif iletişim ile %80 kurtarma oranı.',
        category: 'churn',
        priority: 'high' as const,
        action: {
          label: 'Riskli Müşterileri Gör',
          onClick: () => {
            toast.success('Riskli müşteriler listesi açılıyor');
            onHintAction?.('customer_churn_risk', 'view_risky_customers');
          }
        }
      }
    ],
    payments: [
      {
        id: 'payment_optimization',
        type: 'tip' as const,
        title: 'Ödeme Optimizasyonu',
        message: 'Ödeme başarı oranınız %92. Otomatik yeniden deneme ile %98\'e çıkarabilirsiniz.',
        category: 'payment',
        priority: 'medium' as const,
        action: {
          label: 'Optimize Et',
          onClick: () => {
            toast.success('Ödeme optimizasyonu başlatıldı');
            onHintAction?.('payment_optimization', 'optimize_payments');
          }
        }
      },
      {
        id: 'payment_reminders',
        type: 'info' as const,
        title: 'Akıllı Hatırlatmalar',
        message: '15 adet gecikmiş ödeme var. Akıllı hatırlatma sistemi ile %70 daha hızlı tahsilat.',
        category: 'reminders',
        priority: 'high' as const,
        action: {
          label: 'Hatırlatmaları Başlat',
          onClick: () => {
            toast.success('Akıllı hatırlatma sistemi başlatıldı');
            onHintAction?.('payment_reminders', 'start_reminders');
          }
        }
      }
    ],
    analytics: [
      {
        id: 'analytics_insights',
        type: 'tip' as const,
        title: 'Veri İçgörüleri',
        message: 'En çok talep alan kategori: Teknik Destek (%35). Kaynak tahsisi optimize edilebilir.',
        category: 'insights',
        priority: 'medium' as const,
        action: {
          label: 'Kaynakları Optimize Et',
          onClick: () => {
            toast.success('Kaynak optimizasyonu başlatıldı');
            onHintAction?.('analytics_insights', 'optimize_resources');
          }
        }
      },
      {
        id: 'analytics_trends',
        type: 'success' as const,
        title: 'Pozitif Trend',
        message: 'Son 30 günde talep çözüm süresi %25 azaldı. Bu trend devam ediyor.',
        category: 'trends',
        priority: 'low' as const,
        action: {
          label: 'Trend Raporunu Gör',
          onClick: () => {
            toast.success('Trend raporu açılıyor');
            onHintAction?.('analytics_trends', 'view_trend_report');
          }
        }
      }
    ]
  };

  // İpucu türlerine göre ikon ve renk
  const getHintStyle = (type: Hint['type']) => {
    switch (type) {
      case 'info':
        return {
          icon: Info,
          color: 'text-blue-600 dark:text-blue-400',
          bgColor: 'bg-blue-50 dark:bg-blue-900/20',
          borderColor: 'border-blue-200 dark:border-blue-800'
        };
      case 'warning':
        return {
          icon: AlertTriangle,
          color: 'text-orange-600 dark:text-orange-400',
          bgColor: 'bg-orange-50 dark:bg-orange-900/20',
          borderColor: 'border-orange-200 dark:border-orange-800'
        };
      case 'success':
        return {
          icon: CheckCircle,
          color: 'text-green-600 dark:text-green-400',
          bgColor: 'bg-green-50 dark:bg-green-900/20',
          borderColor: 'border-green-200 dark:border-green-800'
        };
      case 'tip':
        return {
          icon: Lightbulb,
          color: 'text-yellow-600 dark:text-yellow-400',
          bgColor: 'bg-yellow-50 dark:bg-yellow-900/20',
          borderColor: 'border-yellow-200 dark:border-yellow-800'
        };
      case 'priority':
        return {
          icon: Zap,
          color: 'text-orange-600 dark:text-orange-400',
          bgColor: 'bg-orange-100 dark:bg-orange-900/30',
          borderColor: 'border-orange-200 dark:border-orange-800'
        };
      case 'performance':
        return {
          icon: TrendingUp,
          color: 'text-indigo-600 dark:text-indigo-400',
          bgColor: 'bg-indigo-50 dark:bg-indigo-900/20',
          borderColor: 'border-indigo-200 dark:border-indigo-800'
        };
      default:
        return {
          icon: Info,
          color: 'text-gray-600 dark:text-gray-400',
          bgColor: 'bg-gray-50 dark:bg-gray-900/20',
          borderColor: 'border-gray-200 dark:border-gray-800'
        };
    }
  };

  // Öncelik seviyesine göre renk
  const getPriorityColor = (priority: Hint['priority']) => {
    switch (priority) {
      case 'high':
        return 'text-red-600 dark:text-red-400';
      case 'medium':
        return 'text-orange-600 dark:text-orange-400';
      case 'low':
        return 'text-green-600 dark:text-green-400';
      default:
        return 'text-gray-600 dark:text-gray-400';
    }
  };

  // İpuçlarını yükle
  useEffect(() => {
    let currentHints = hintDatabase[currentPage as keyof typeof hintDatabase] || [];
    
    // Context verilerine göre dinamik ipuçları oluştur
    if (currentPage === 'dashboard') {
      // Dashboard için dinamik ipuçları
      const dynamicHints = [];
      
             // Yüksek öncelikli talepler varsa - GİZLENDİ
       // if (contextData?.totalTickets && contextData.totalTickets > 10) {
       //   dynamicHints.push({
       //     id: 'dashboard_high_priority_tickets',
       //     type: 'priority' as const,
       //     title: 'Yüksek Öncelikli Talepler',
       //     message: `${contextData.totalTickets} adet talep var. Acil öncelikli...`,
       //     category: 'priority',
       //     priority: 'high' as const,
       //     action: {
       //       label: 'Yü',
       //       onClick: () => {
       //         toast.success('Talepler sayfasına yönlendiriliyorsunuz');
       //         onHintAction?.('dashboard_high_priority_tickets', 'view_tickets');
       //       }
       //     }
       //   });
       // }
      
      // Okunmamış bildirimler varsa
      if (contextData?.unreadNotifications && contextData.unreadNotifications > 0) {
        dynamicHints.push({
          id: 'dashboard_unread_notifications',
          type: 'warning' as const,
          title: 'Okunmamış Bildirimler',
          message: `${contextData.unreadNotifications} adet okunmamış bildiriminiz var. Hızlı aksiyon alabilirsiniz.`,
          category: 'notifications',
          priority: 'medium' as const,
          action: {
            label: 'Bildirimleri Gör',
            onClick: () => {
              toast.success('Bildirimler açılıyor');
              onHintAction?.('dashboard_unread_notifications', 'view_notifications');
            }
          }
        });
      }
      
      // Müşteri sayısı yüksekse
      if (contextData?.totalCustomers && contextData.totalCustomers > 50) {
        dynamicHints.push({
          id: 'dashboard_customer_insights',
          type: 'tip' as const,
          title: 'Müşteri İçgörüleri',
          message: `${contextData.totalCustomers} müşteriniz var. Müşteri analizi ile %25 daha iyi hizmet.`,
          category: 'customers',
          priority: 'low' as const,
          action: {
            label: 'Analizi Gör',
            onClick: () => {
              toast.success('Müşteri analizi açılıyor');
              onHintAction?.('dashboard_customer_insights', 'view_customer_analysis');
            }
          }
        });
      }
      
      // Dinamik ipuçlarını başa ekle
      currentHints = [...dynamicHints, ...currentHints];
    }
    
          // Tickets sayfası için dinamik ipuçları
      if (currentPage === 'tickets') {
        const dynamicHints = [];
        
        // Açık talepler varsa
        if (contextData?.openTickets && contextData.openTickets > 5) {
          dynamicHints.push({
            id: 'tickets_open_tickets_alert',
            type: 'warning' as const,
            title: 'Açık Talepler Uyarısı',
            message: `${contextData.openTickets} adet açık talep var. Yanıt sürenizi optimize edebilirsiniz.`,
            category: 'response_time',
            priority: 'high' as const,
            action: {
              label: 'Optimize Et',
              onClick: () => {
                toast.success('Yanıt süresi optimizasyonu başlatıldı');
                onHintAction?.('tickets_open_tickets_alert', 'optimize_response_time');
              }
            }
          });
        }
        
                 // Yüksek öncelikli talepler varsa - GİZLENDİ
         // if (contextData?.highPriorityTickets && contextData.highPriorityTickets > 0) {
         //   dynamicHints.push({
         //     id: 'tickets_high_priority_alert',
         //     type: 'priority' as const,
         //     title: 'Yüksek Öncelikli Talepler',
         //     message: `${contextData.highPriorityTickets} adet yüksek öncelikli talep bekliyor. Acil aksiyon gerekli.`,
         //     category: 'priority',
         //     priority: 'high' as const,
         //     action: {
         //       label: 'Acil Aksiyon',
         //       onClick: () => {
         //         toast.success('Acil aksiyon modu etkinleştirildi');
         //         onHintAction?.('tickets_high_priority_alert', 'emergency_action');
         //       }
         //     }
         //   });
         // }
        
                 // Gecikmiş talepler varsa - GİZLENDİ
         // if (contextData?.overdueTickets && contextData.overdueTickets > 0) {
         //   dynamicHints.push({
         //     id: 'tickets_overdue_alert',
         //     type: 'priority' as const,
         //     title: 'Gecikmiş Talepler',
         //     message: `${contextData.overdueTickets} adet gecikmiş talep var. SLA ihlali riski mevcut.`,
         //     category: 'sla',
         //     priority: 'high' as const,
         //     action: {
         //       label: 'SLA Kontrolü',
         //       onClick: () => {
         //         toast.success('SLA kontrol sistemi başlatıldı');
         //         onHintAction?.('tickets_overdue_alert', 'sla_check');
         //       }
         //     }
         //   });
         // }
        
        // Çözülen talepler başarılıysa
        if (contextData?.resolvedTickets && contextData.resolvedTickets > 50) {
          dynamicHints.push({
            id: 'tickets_resolution_success',
            type: 'success' as const,
            title: 'Başarılı Çözüm Oranı',
            message: `${contextData.resolvedTickets} talep başarıyla çözüldü. Performans trendiniz yükseliyor.`,
            category: 'performance',
            priority: 'low' as const,
            action: {
              label: 'Performans Raporu',
              onClick: () => {
                toast.success('Performans raporu açılıyor');
                onHintAction?.('tickets_resolution_success', 'performance_report');
              }
            }
          });
        }
        
        currentHints = [...dynamicHints, ...currentHints];
      }
    
          // Customers sayfası için dinamik ipuçları
      if (currentPage === 'customers') {
        const dynamicHints = [];
        
        // Riskli müşteriler varsa
        if (contextData?.riskyCustomers && contextData.riskyCustomers > 0) {
          dynamicHints.push({
            id: 'customers_risk_alert',
            type: 'warning' as const,
            title: 'Müşteri Kaybı Riski',
            message: `${contextData.riskyCustomers} müşteri kaybı riski altında. Proaktif iletişim ile %80 kurtarma oranı.`,
            category: 'churn',
            priority: 'high' as const,
            action: {
              label: 'Riskli Müşterileri Gör',
              onClick: () => {
                toast.success('Riskli müşteriler listesi açılıyor');
                onHintAction?.('customers_risk_alert', 'view_risky_customers');
              }
            }
          });
        }
        
        // Premium müşteriler varsa
        if (contextData?.premiumCustomers && contextData.premiumCustomers > 0) {
          dynamicHints.push({
            id: 'customers_premium_insight',
            type: 'success' as const,
            title: 'Premium Müşteri Segmenti',
            message: `${contextData.premiumCustomers} premium müşteriniz var. VIP hizmet fırsatları sunabilirsiniz.`,
            category: 'vip',
            priority: 'medium' as const,
            action: {
              label: 'VIP Hizmetler',
              onClick: () => {
                toast.success('VIP hizmet fırsatları açılıyor');
                onHintAction?.('customers_premium_insight', 'vip_opportunities');
              }
            }
          });
        }
        
        // Yeni müşteriler varsa
        if (contextData?.newCustomers && contextData.newCustomers > 0) {
          dynamicHints.push({
            id: 'customers_new_insight',
            type: 'tip' as const,
            title: 'Yeni Müşteri Fırsatları',
            message: `${contextData.newCustomers} yeni müşteri kazandınız. Onboarding sürecini optimize edebilirsiniz.`,
            category: 'onboarding',
            priority: 'low' as const,
            action: {
              label: 'Onboarding Optimize Et',
              onClick: () => {
                toast.success('Onboarding optimizasyonu başlatıldı');
                onHintAction?.('customers_new_insight', 'optimize_onboarding');
              }
            }
          });
        }
        
        currentHints = [...dynamicHints, ...currentHints];
      }
    
          // Analytics sayfası için dinamik ipuçları
      if (currentPage === 'analytics') {
        const dynamicHints = [];
        
        // SLA ihlalleri varsa
        if (contextData?.slaAnalytics?.slaBreaches && contextData.slaAnalytics.slaBreaches > 0) {
          dynamicHints.push({
            id: 'analytics_sla_breaches',
            type: 'warning' as const,
            title: 'SLA İhlalleri',
            message: `${contextData.slaAnalytics.slaBreaches} adet SLA ihlali tespit edildi. Acil optimizasyon gerekli.`,
            category: 'sla',
            priority: 'high' as const,
            action: {
              label: 'SLA Optimize Et',
              onClick: () => {
                toast.success('SLA optimizasyonu başlatıldı');
                onHintAction?.('analytics_sla_breaches', 'sla_optimization');
              }
            }
          });
        }
        
        // Müşteri memnuniyeti düşükse
        if (contextData?.customerAnalytics?.avgSatisfaction && contextData.customerAnalytics.avgSatisfaction < 4.0) {
          dynamicHints.push({
            id: 'analytics_satisfaction_alert',
            type: 'warning' as const,
            title: 'Müşteri Memnuniyeti Düşük',
            message: `Müşteri memnuniyet skorunuz ${contextData.customerAnalytics.avgSatisfaction}/5. İyileştirme gerekli.`,
            category: 'satisfaction',
            priority: 'medium' as const,
            action: {
              label: 'Memnuniyet Analizi',
              onClick: () => {
                toast.success('Müşteri memnuniyet analizi başlatıldı');
                onHintAction?.('analytics_satisfaction_alert', 'satisfaction_analysis');
              }
            }
          });
        }
        
        // Performans trendi pozitifse
        if (contextData?.ticketStats?.resolved && contextData.ticketStats.resolved > 100) {
          dynamicHints.push({
            id: 'analytics_performance_trend',
            type: 'success' as const,
            title: 'Pozitif Performans Trendi',
            message: `${contextData.ticketStats.resolved} talep çözüldü. Performans trendiniz yükseliyor.`,
            category: 'performance',
            priority: 'low' as const,
            action: {
              label: 'Trend Raporu',
              onClick: () => {
                toast.success('Trend raporu açılıyor');
                onHintAction?.('analytics_performance_trend', 'view_trend_report');
              }
            }
          });
        }
        
        currentHints = [...dynamicHints, ...currentHints];
      }
      
      // Payments sayfası için dinamik ipuçları
      if (currentPage === 'payments') {
        const dynamicHints = [];
        
        // Bekleyen ödemeler varsa
        if (contextData?.pendingPayments && contextData.pendingPayments > 0) {
          dynamicHints.push({
            id: 'payments_pending_alert',
            type: 'warning' as const,
            title: 'Bekleyen Ödemeler',
            message: `${contextData.pendingPayments} adet bekleyen ödeme var. Akıllı hatırlatma sistemi ile %70 daha hızlı tahsilat.`,
            category: 'reminders',
            priority: 'high' as const,
            action: {
              label: 'Hatırlatmaları Başlat',
              onClick: () => {
                toast.success('Akıllı hatırlatma sistemi başlatıldı');
                onHintAction?.('payments_pending_alert', 'start_reminders');
              }
            }
          });
        }
        
        // Gecikmiş ödemeler varsa
        if (contextData?.overduePayments && contextData.overduePayments > 0) {
          dynamicHints.push({
            id: 'payments_overdue_alert',
            type: 'priority' as const,
            title: 'Gecikmiş Ödemeler',
            message: `${contextData.overduePayments} adet gecikmiş ödeme var. Acil tahsilat aksiyonu gerekli.`,
            category: 'collections',
            priority: 'high' as const,
            action: {
              label: 'Acil Tahsilat',
              onClick: () => {
                toast.success('Acil tahsilat sistemi başlatıldı');
                onHintAction?.('payments_overdue_alert', 'emergency_collection');
              }
            }
          });
        }
        
        // Yüksek değerli ödemeler varsa
        if (contextData?.highValuePayments && contextData.highValuePayments > 0) {
          dynamicHints.push({
            id: 'payments_high_value_alert',
            type: 'success' as const,
            title: 'Yüksek Değerli Ödemeler',
            message: `${contextData.highValuePayments} adet yüksek değerli ödeme var. VIP müşteri hizmeti sunabilirsiniz.`,
            category: 'vip',
            priority: 'medium' as const,
            action: {
              label: 'VIP Hizmet',
              onClick: () => {
                toast.success('VIP müşteri hizmeti başlatıldı');
                onHintAction?.('payments_high_value_alert', 'vip_service');
              }
            }
          });
        }
        
        // Aylık gelir hedefi kontrolü
        if (contextData?.monthlyRevenue && contextData.monthlyRevenue > 0) {
          const revenueGrowth = contextData.monthlyRevenue > 50000 ? 'artış' : 'azalış';
          dynamicHints.push({
            id: 'payments_revenue_insight',
            type: 'tip' as const,
            title: 'Gelir İçgörüsü',
            message: `Bu ay ${formatCurrency(contextData.monthlyRevenue)} gelir elde ettiniz. ${revenueGrowth} trendi devam ediyor.`,
            category: 'revenue',
            priority: 'low' as const,
            action: {
              label: 'Gelir Analizi',
              onClick: () => {
                toast.success('Gelir analizi açılıyor');
                onHintAction?.('payments_revenue_insight', 'revenue_analysis');
              }
            }
          });
        }
        
        currentHints = [...dynamicHints, ...currentHints];
      }
    
    const hintsWithTimestamp = currentHints.map(hint => ({
      ...hint,
      timestamp: new Date(),
      isRead: false
    }));
    
    setHints(hintsWithTimestamp);
    
    // İlk ipucunu aktif yap
    if (hintsWithTimestamp.length > 0) {
      setActiveHint(hintsWithTimestamp[0]);
    }
  }, [currentPage, contextData]);

  // Otomatik ipucu değiştirme
  useEffect(() => {
    if (hints.length > 1 && !isMinimized) {
      hintTimeoutRef.current = setTimeout(() => {
        const currentIndex = hints.findIndex(h => h.id === activeHint?.id);
        const nextIndex = (currentIndex + 1) % hints.length;
        setActiveHint(hints[nextIndex]);
      }, 8000); // 8 saniyede bir değiştir
    }

    return () => {
      if (hintTimeoutRef.current) {
        clearTimeout(hintTimeoutRef.current);
      }
    };
  }, [hints, activeHint, isMinimized]);

  // İpucunu okundu olarak işaretle
  const markAsRead = (hintId: string) => {
    setHints(prev => prev.map(hint => 
      hint.id === hintId ? { ...hint, isRead: true } : hint
    ));
  };

  // Tüm ipuçlarını okundu olarak işaretle
  const markAllAsRead = () => {
    setHints(prev => prev.map(hint => ({ ...hint, isRead: true })));
    toast.success('Tüm ipuçları okundu olarak işaretlendi');
  };

  // İpucu sayısını hesapla
  const unreadCount = hints.filter(hint => !hint.isRead).length;
  const highPriorityCount = hints.filter(hint => hint.priority === 'high').length;

  if (hints.length === 0) {
    return null;
  }

  return (
    <div className={`fixed bottom-4 right-4 z-50 ${className}`}>
      {/* Ana İpucu Kartı */}
      {!isMinimized && activeHint && (
        <div className={`mb-3 max-w-sm ${getHintStyle(activeHint.type).bgColor} ${getHintStyle(activeHint.type).borderColor} border rounded-lg shadow-lg transition-all duration-300 ${isExpanded ? 'w-96' : 'w-80'}`}>
          <div className="p-4">
            {/* Header */}
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center space-x-2">
                {React.createElement(getHintStyle(activeHint.type).icon, {
                  className: `w-5 h-5 ${getHintStyle(activeHint.type).color}`
                })}
                <h4 className="font-medium text-gray-900 dark:text-white text-sm">
                  {activeHint.title}
                </h4>
                <span className={`px-2 py-0.5 text-xs rounded-full ${getPriorityColor(activeHint.priority)} bg-white dark:bg-gray-800`}>
                  {activeHint.priority === 'high' ? 'Yüksek' : 
                   activeHint.priority === 'medium' ? 'Orta' : 'Düşük'}
                </span>
              </div>
              <div className="flex items-center space-x-1">
                <button
                  onClick={() => setIsExpanded(!isExpanded)}
                  className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded"
                >
                  {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </button>
                <button
                  onClick={() => setIsMinimized(true)}
                  className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* İçerik */}
            <div className={`transition-all duration-300 ${isExpanded ? 'max-h-96' : 'max-h-20'} overflow-hidden`}>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                {activeHint.message}
              </p>

              {/* Genişletilmiş İçerik */}
              {isExpanded && (
                <div className="space-y-3">
                  {/* Kategori */}
                  <div className="flex items-center space-x-2 text-xs text-gray-500 dark:text-gray-400">
                    <span>Kategori:</span>
                    <span className="font-medium">{activeHint.category}</span>
                  </div>

                  {/* Zaman */}
                  <div className="flex items-center space-x-2 text-xs text-gray-500 dark:text-gray-400">
                    <Clock className="w-3 h-3" />
                    <span>{activeHint.timestamp.toLocaleTimeString('tr-TR', { 
                      hour: '2-digit', 
                      minute: '2-digit' 
                    })}</span>
                  </div>

                  {/* Aksiyon Butonu */}
                  {activeHint.action && (
                    <button
                      onClick={() => {
                        activeHint.action?.onClick();
                        markAsRead(activeHint.id);
                      }}
                      className="w-full px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-lg transition-colors"
                    >
                      {activeHint.action.label}
                    </button>
                  )}

                  {/* Diğer İpuçları */}
                  {hints.length > 1 && (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
                          Diğer İpuçları ({hints.length - 1})
                        </span>
                        <button
                          onClick={() => setShowAllHints(!showAllHints)}
                          className="text-xs text-blue-600 dark:text-blue-400 hover:underline"
                        >
                          {showAllHints ? 'Gizle' : 'Göster'}
                        </button>
                      </div>
                      
                      {showAllHints && (
                        <div className="space-y-2 max-h-32 overflow-y-auto">
                          {hints.filter(h => h.id !== activeHint.id).map(hint => (
                            <div
                              key={hint.id}
                              className={`p-2 rounded text-xs cursor-pointer transition-colors ${
                                getHintStyle(hint.type).bgColor
                              } hover:opacity-80`}
                              onClick={() => setActiveHint(hint)}
                            >
                              <div className="flex items-center space-x-2">
                                {React.createElement(getHintStyle(hint.type).icon, {
                                  className: `w-3 h-3 ${getHintStyle(hint.type).color}`
                                })}
                                <span className="font-medium text-gray-700 dark:text-gray-300">
                                  {hint.title}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Minimize Edilmiş Durum */}
      {isMinimized && (
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setIsMinimized(false)}
            className={`p-3 rounded-lg shadow-lg transition-all duration-300 ${getHintStyle(activeHint?.type || 'info').bgColor} ${getHintStyle(activeHint?.type || 'info').borderColor} border hover:scale-105`}
          >
            <div className="relative">
              <Lightbulb className={`w-6 h-6 ${getHintStyle(activeHint?.type || 'info').color}`} />
              {/* Notification badges hidden */}
              {/* {unreadCount > 0 && (
                 <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                   {unreadCount}
                 </span>
               )}
               {highPriorityCount > 0 && (
                 <span className="absolute -bottom-1 -right-1 w-4 h-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                   {highPriorityCount}
                 </span>
               )} */}
            </div>
          </button>
          

        </div>
      )}

      {/* Tüm İpuçları Modal */}
      {showAllHints && isMinimized && (
        <div className="absolute bottom-16 right-0 w-80 max-h-96 overflow-y-auto bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700">
          <div className="p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-medium text-gray-900 dark:text-white">Tüm İpuçları</h3>
              <button
                onClick={() => setShowAllHints(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            
            <div className="space-y-2">
              {hints.map(hint => (
                <div
                  key={hint.id}
                  className={`p-3 rounded-lg cursor-pointer transition-colors ${
                    getHintStyle(hint.type).bgColor
                  } hover:opacity-80 ${!hint.isRead ? 'ring-2 ring-blue-200 dark:ring-blue-800' : ''}`}
                  onClick={() => {
                    setActiveHint(hint);
                    setIsMinimized(false);
                    setShowAllHints(false);
                  }}
                >
                  <div className="flex items-start space-x-2">
                    {React.createElement(getHintStyle(hint.type).icon, {
                      className: `w-4 h-4 mt-0.5 ${getHintStyle(hint.type).color}`
                    })}
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-1">
                        <span className="font-medium text-sm text-gray-900 dark:text-white">
                          {hint.title}
                        </span>
                        <span className={`px-1.5 py-0.5 text-xs rounded ${getPriorityColor(hint.priority)} bg-white dark:bg-gray-800`}>
                          {hint.priority === 'high' ? 'Yüksek' : 
                           hint.priority === 'medium' ? 'Orta' : 'Düşük'}
                        </span>
                        {!hint.isRead && (
                          <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                        )}
                      </div>
                      <p className="text-xs text-gray-600 dark:text-gray-400 line-clamp-2">
                        {hint.message}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RealTimeHintSystem;
