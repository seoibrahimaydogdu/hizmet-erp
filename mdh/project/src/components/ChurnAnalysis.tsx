import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { 
  TrendingDown, 
  Users, 
  Calendar, 
  AlertTriangle,
  Filter,
  Download,
  Eye,
  Loader2,
  RefreshCw,
  Info,
  X,
  Mail,
  Phone,
  Building,
  Clock,
  Star,
  FileText,
  CheckCircle,
  Send,
  Gift,
  Percent,
  MessageSquare,
  TrendingUp
} from 'lucide-react';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';
import { supabase } from '../lib/supabase';

interface ChurnedUser {
  id: string;
  name: string;
  email: string;
  plan: string;
  churn_date: string;
  subscription_duration: number;
  total_tickets: number;
  satisfaction_score: number;
  last_payment?: string;
}

interface ChurnReason {
  reason: string;
  count: number;
  percentage: number;
}

interface PlanChurnData {
  plan: string;
  count: number;
  percentage: number;
}

interface RiskCustomer {
  id: string;
  name: string;
  email: string;
  plan: string;
  last_login?: string;
  days_since_last_activity?: number;
  satisfaction_score: number;
}

interface ChurnAnalytics {
  churn_rate: number;
  total_customers: number;
  churned_customers: number;
  avg_subscription_duration: number;
  churned_users: ChurnedUser[];
  churn_by_plan: PlanChurnData[];
  risk_customers: RiskCustomer[];
}

// Test verileri (Supabase bağlantısı olmadığında kullanılır)
const mockChurnData: ChurnAnalytics = {
  churn_rate: 12.5,
  total_customers: 150,
  churned_customers: 6,
  avg_subscription_duration: 45.2,
  churned_users: [
    {
      id: '1',
      name: 'Mehmet Özkan',
      email: 'mehmet@example.com',
      plan: 'Pro',
      churn_date: '2024-12-15T14:30:00Z',
      subscription_duration: 45,
      total_tickets: 15,
      satisfaction_score: 3
    },
    {
      id: '2',
      name: 'Ayşe Demir',
      email: 'ayse@example.com',
      plan: 'Basic',
      churn_date: '2024-12-18T16:45:00Z',
      subscription_duration: 23,
      total_tickets: 8,
      satisfaction_score: 2
    },
    {
      id: '3',
      name: 'Ali Kaya',
      email: 'ali@example.com',
      plan: 'Premium',
      churn_date: '2024-12-20T11:20:00Z',
      subscription_duration: 67,
      total_tickets: 25,
      satisfaction_score: 4
    },
    {
      id: '4',
      name: 'Zeynep Yıldız',
      email: 'zeynep@example.com',
      plan: 'Pro',
      churn_date: '2024-12-22T09:30:00Z',
      subscription_duration: 89,
      total_tickets: 12,
      satisfaction_score: 6
    },
    {
      id: '5',
      name: 'Fatma Çelik',
      email: 'fatma@example.com',
      plan: 'Basic',
      churn_date: '2024-12-25T15:45:00Z',
      subscription_duration: 34,
      total_tickets: 5,
      satisfaction_score: 5
    },
    {
      id: '6',
      name: 'Hasan Yılmaz',
      email: 'hasan@example.com',
      plan: 'Basic',
      churn_date: '2024-12-28T13:20:00Z',
      subscription_duration: 12,
      total_tickets: 3,
      satisfaction_score: 4
    }
  ],
  churn_by_plan: [
    { plan: 'Basic', count: 3, percentage: 50 },
    { plan: 'Pro', count: 2, percentage: 33.3 },
    { plan: 'Premium', count: 1, percentage: 16.7 }
  ],
  risk_customers: [
    {
      id: 'risk-1',
      name: 'Ahmet Şahin',
      email: 'ahmet@example.com',
      plan: 'Professional',
      days_since_last_activity: 15,
      satisfaction_score: 6
    },
    {
      id: 'risk-2',
      name: 'Mustafa Arslan',
      email: 'mustafa@example.com',
      plan: 'Premium',
      days_since_last_activity: 8,
      satisfaction_score: 7
    }
  ]
};

const mockChurnReasons: ChurnReason[] = [
  { reason: 'Düşük Memnuniyet', count: 2, percentage: 33.3 },
  { reason: 'Kullanım Yok', count: 1, percentage: 16.7 },
  { reason: 'Özellik Eksikliği', count: 2, percentage: 33.3 },
  { reason: 'Ödeme Sorunu', count: 1, percentage: 16.7 }
];

interface RecoveryAction {
  id: string;
  type: 'email' | 'call' | 'discount' | 'upgrade' | 'survey';
  title: string;
  description: string;
  icon: React.ReactNode;
  action: () => void;
}

interface UserDetailModalProps {
  user: ChurnedUser | null;
  isOpen: boolean;
  onClose: () => void;
}

const UserDetailModal: React.FC<UserDetailModalProps> = ({ user, isOpen, onClose }) => {
  const [showRecoveryActions, setShowRecoveryActions] = useState(false);
  const [showContactForm, setShowContactForm] = useState(false);
  const [contactMethod, setContactMethod] = useState<'email' | 'call'>('email');
  const [contactMessage, setContactMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  if (!user || !isOpen) return null;

  const getSatisfactionColor = (score: number) => {
    if (score >= 7) return 'text-green-600 bg-green-100 dark:bg-green-900/20 dark:text-green-400';
    if (score >= 5) return 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900/20 dark:text-yellow-400';
    return 'text-red-600 bg-red-100 dark:bg-red-900/20 dark:text-red-400';
  };

  const handleContact = async () => {
    setIsLoading(true);
    try {
      // Gerçek uygulamada burada email/call API'si çağrılır
      await new Promise(resolve => setTimeout(resolve, 2000)); // Simüle edilmiş API çağrısı
      
      // Churn recovery kaydı oluştur
      const { error } = await supabase
        .from('churn_recovery_actions')
        .insert({
          customer_id: user.id,
          action_type: contactMethod,
          message: contactMessage,
          status: 'sent',
          created_at: new Date().toISOString()
        });

      if (error) throw error;

      setActionSuccess(`${contactMethod === 'email' ? 'Email' : 'Arama'} başarıyla gönderildi!`);
      setShowContactForm(false);
      setContactMessage('');
      
      setTimeout(() => setActionSuccess(null), 3000);
    } catch (error) {
      console.error('İletişim hatası:', error);
      setActionSuccess('Bir hata oluştu. Lütfen tekrar deneyin.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRecoveryAction = async (actionType: string) => {
    setIsLoading(true);
    try {
      // Gerçek uygulamada burada recovery API'si çağrılır
      await new Promise(resolve => setTimeout(resolve, 1500)); // Simüle edilmiş API çağrısı
      
      // Recovery action kaydı oluştur
      const { error } = await supabase
        .from('churn_recovery_actions')
        .insert({
          customer_id: user.id,
          action_type: actionType,
          status: 'pending',
          created_at: new Date().toISOString()
        });

      if (error) throw error;

      // Aksiyon tipine göre özel mesajlar ve detaylar
      let successMessage = '';
      let actionDetails = '';
      
      switch (actionType) {
        case 'discount':
          successMessage = `🎉 ${user.name} için %20 özel indirim kodu oluşturuldu ve email ile gönderildi!`;
          actionDetails = `
📧 Gönderilen Email İçeriği:
─────────────────────────────
Konu: Özel İndirim Teklifimiz - Sizi Geri Kazanmak İstiyoruz!

Merhaba ${user.name},

Sizi tekrar aramızda görmekten mutluluk duyacağımızı belirtmek isteriz. 
Sizin gibi değerli bir müşterimizi kaybetmek istemiyoruz.

Bu nedenle size özel bir teklifimiz var:
🎯 %20 İNDİRİM KODU: GERIKAZAN20

Bu kodu kullanarak 30 gün boyunca tüm hizmetlerimizden %20 indirimle yararlanabilirsiniz.

Kodunuzu kullanmak için: https://app.example.com/redeem/GERIKAZAN20

Herhangi bir sorunuz varsa bizimle iletişime geçmekten çekinmeyin.

Saygılarımızla,
[Şirket Adı] Ekibi
          `;
          break;
          
        case 'upgrade':
          successMessage = `🚀 ${user.name} için ücretsiz plan yükseltme teklifi hazırlandı ve iletilmek üzere kuyruğa alındı!`;
          actionDetails = `
📧 Gönderilen Email İçeriği:
─────────────────────────────
Konu: Özel Plan Yükseltme Teklifimiz - 3 Ay Ücretsiz!

Merhaba ${user.name},

Sizin deneyiminizi daha da geliştirmek için özel bir teklifimiz var.

🚀 3 AY ÜCRETSİZ PLAN YÜKSELTME

Mevcut ${user.plan} planınızdan bir üst plana 3 ay boyunca ücretsiz geçiş yapabilirsiniz.

Bu yükseltme ile:
• Gelişmiş analitik araçları
• Öncelikli destek hizmeti
• Özel özellikler
• Daha fazla depolama alanı

Yükseltme işlemini başlatmak için: https://app.example.com/upgrade/special

Bu teklif 7 gün geçerlidir.

Saygılarımızla,
[Şirket Adı] Ekibi
          `;
          break;
          
        case 'gift':
          successMessage = `🎁 ${user.name} için özel hediye paketi hazırlandı ve kargo ile gönderilmek üzere işleme alındı!`;
          actionDetails = `
📦 Hediye Paketi Detayları:
─────────────────────────────
Paket İçeriği:
• Premium şirket logolu kalem seti
• Özel tasarım mouse pad
• Şirket kültürü kitabı
• Kişiselleştirilmiş teşekkür kartı

📧 Gönderilen Email İçeriği:
─────────────────────────────
Konu: Özel Hediye Paketiniz Yolda!

Merhaba ${user.name},

Sizin için özel bir hediye paketi hazırladık ve kargo ile gönderdik.

🎁 Paket İçeriği:
• Premium şirket logolu kalem seti
• Özel tasarım mouse pad
• Şirket kültürü kitabı
• Kişiselleştirilmiş teşekkür kartı

Kargo takip numarası: TR123456789
Tahmini teslimat: 2-3 iş günü

Bu küçük hediyemizle sizin değerinizi göstermek istedik.

Saygılarımızla,
[Şirket Adı] Ekibi
          `;
          break;
          
        case 'survey':
          successMessage = `📋 ${user.name} için detaylı memnuniyet anketi hazırlandı ve email ile gönderildi!`;
          actionDetails = `
📧 Gönderilen Email İçeriği:
─────────────────────────────
Konu: Deneyiminizi İyileştirmek İçin Görüşünüzü Alabilir miyiz?

Merhaba ${user.name},

Sizin deneyiminizi daha da iyileştirmek için kısa bir anket hazırladık.

📋 Anket Linki: https://survey.example.com/churn-feedback

Bu anket yaklaşık 3-5 dakika sürecek ve şunları içeriyor:
• Hizmet kalitesi değerlendirmesi
• Ayrılma nedenleri
• İyileştirme önerileri
• Geri dönüş olasılığı

Anketi doldurduğunuzda:
• 1 ay ücretsiz premium özellik
• Özel indirim kodu
• Kişisel danışmanlık seansı

Anketi doldurmak için: https://survey.example.com/churn-feedback

Görüşleriniz bizim için çok değerli.

Saygılarımızla,
[Şirket Adı] Ekibi
          `;
          break;
          
        default:
          successMessage = `${actionType} aksiyonu başarıyla uygulandı!`;
          actionDetails = 'Aksiyon detayları mevcut değil.';
      }

      setActionSuccess(successMessage);
      
      // Detayları console'a yazdır (gerçek uygulamada log sistemi kullanılır)
      console.log('Recovery Action Details:', actionDetails);
      
      setShowRecoveryActions(false);
      
      setTimeout(() => setActionSuccess(null), 5000);
    } catch (error) {
      console.error('Recovery action hatası:', error);
      setActionSuccess('Bir hata oluştu. Lütfen tekrar deneyin.');
    } finally {
      setIsLoading(false);
    }
  };

  const recoveryActions: RecoveryAction[] = [
    {
      id: 'discount',
      type: 'discount',
      title: 'Özel İndirim',
      description: '%20 indirim ile geri kazan',
      icon: <Percent className="w-5 h-5" />,
      action: () => handleRecoveryAction('discount')
    },
    {
      id: 'upgrade',
      type: 'upgrade',
      title: 'Plan Yükseltme',
      description: 'Ücretsiz plan yükseltme teklifi',
      icon: <TrendingUp className="w-5 h-5" />,
      action: () => handleRecoveryAction('upgrade')
    },
    {
      id: 'gift',
      type: 'gift',
      title: 'Hediye Paketi',
      description: 'Özel hediye paketi gönder',
      icon: <Gift className="w-5 h-5" />,
      action: () => handleRecoveryAction('gift')
    },
    {
      id: 'survey',
      type: 'survey',
      title: 'Memnuniyet Anketi',
      description: 'Ayrılma nedenini öğren',
      icon: <MessageSquare className="w-5 h-5" />,
      action: () => handleRecoveryAction('survey')
    }
  ];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Kullanıcı Detayları</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Success Message */}
          {actionSuccess && (
            <div className="mb-4 p-3 bg-green-100 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-600" />
                <span className="text-green-800 dark:text-green-400 text-sm">{actionSuccess}</span>
              </div>
            </div>
          )}

          <div className="space-y-6">
            {/* Kullanıcı Bilgileri */}
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-red-500 rounded-full flex items-center justify-center text-white font-semibold text-xl">
                {user.name.charAt(0)}
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{user.name}</h3>
                <p className="text-gray-600 dark:text-gray-400">{user.email}</p>
              </div>
            </div>

            {/* İstatistikler */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                <div className="flex items-center gap-2">
                  <Building className="w-4 h-4 text-gray-500" />
                  <span className="text-sm text-gray-600 dark:text-gray-400">Plan</span>
                </div>
                <p className="text-lg font-semibold text-gray-900 dark:text-white mt-1">{user.plan}</p>
              </div>

              <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-gray-500" />
                  <span className="text-sm text-gray-600 dark:text-gray-400">Abonelik Süresi</span>
                </div>
                <p className="text-lg font-semibold text-gray-900 dark:text-white mt-1">
                  {Math.round(user.subscription_duration)} gün
                </p>
              </div>

              <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-gray-500" />
                  <span className="text-sm text-gray-600 dark:text-gray-400">Toplam Talep</span>
                </div>
                <p className="text-lg font-semibold text-gray-900 dark:text-white mt-1">{user.total_tickets}</p>
              </div>

              <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                <div className="flex items-center gap-2">
                  <Star className="w-4 h-4 text-gray-500" />
                  <span className="text-sm text-gray-600 dark:text-gray-400">Memnuniyet</span>
                </div>
                <p className={`text-lg font-semibold mt-1 ${getSatisfactionColor(user.satisfaction_score)}`}>
                  {user.satisfaction_score}/10
                </p>
              </div>
            </div>

            {/* Ayrılma Bilgileri */}
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
              <h4 className="font-semibold text-red-800 dark:text-red-400 mb-2">Ayrılma Bilgileri</h4>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-red-500" />
                  <span className="text-sm text-gray-600 dark:text-gray-400">Ayrılma Tarihi:</span>
                  <span className="text-sm font-medium text-gray-900 dark:text-white">
                    {format(new Date(user.churn_date), 'dd MMMM yyyy, HH:mm', { locale: tr })}
                  </span>
                </div>
                {user.last_payment && (
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-red-500" />
                    <span className="text-sm text-gray-600 dark:text-gray-400">Son Ödeme:</span>
                    <span className="text-sm font-medium text-gray-900 dark:text-white">
                      {format(new Date(user.last_payment), 'dd MMMM yyyy', { locale: tr })}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Memnuniyet Analizi */}
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
              <h4 className="font-semibold text-blue-800 dark:text-blue-400 mb-2">Memnuniyet Analizi</h4>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Memnuniyet Puanı</span>
                  <div className="flex items-center gap-2">
                    <div className="flex">
                      {[...Array(10)].map((_, i) => (
                        <Star
                          key={i}
                          className={`w-4 h-4 ${
                            i < user.satisfaction_score
                              ? 'text-yellow-400 fill-current'
                              : 'text-gray-300 dark:text-gray-600'
                          }`}
                        />
                      ))}
                    </div>
                    <span className="text-sm font-medium text-gray-900 dark:text-white">
                      {user.satisfaction_score}/10
                    </span>
                  </div>
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  {user.satisfaction_score >= 7 && 'Yüksek memnuniyet seviyesi'}
                  {user.satisfaction_score >= 5 && user.satisfaction_score < 7 && 'Orta memnuniyet seviyesi'}
                  {user.satisfaction_score < 5 && 'Düşük memnuniyet seviyesi - Ayrılma nedeni olabilir'}
                </div>
              </div>
            </div>

            {/* İletişim Formu */}
            {showContactForm && (
              <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                <h4 className="font-semibold text-gray-900 dark:text-white mb-3">İletişim Kur</h4>
                <div className="space-y-3">
                  <div className="flex gap-2">
                    <button
                      onClick={() => setContactMethod('email')}
                      className={`px-3 py-2 rounded-lg text-sm font-medium ${
                        contactMethod === 'email'
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300'
                      }`}
                    >
                      <Mail className="w-4 h-4 inline mr-1" />
                      Email
                    </button>
                    <button
                      onClick={() => setContactMethod('call')}
                      className={`px-3 py-2 rounded-lg text-sm font-medium ${
                        contactMethod === 'call'
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300'
                      }`}
                    >
                      <Phone className="w-4 h-4 inline mr-1" />
                      Arama
                    </button>
                  </div>
                  <textarea
                    value={contactMessage}
                    onChange={(e) => setContactMessage(e.target.value)}
                    placeholder={contactMethod === 'email' 
                      ? 'Email mesajınızı yazın...' 
                      : 'Arama notlarınızı yazın...'
                    }
                    className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white resize-none"
                    rows={4}
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={handleContact}
                      disabled={isLoading || !contactMessage.trim()}
                      className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 text-sm font-medium"
                    >
                      {isLoading ? (
                        <Loader2 className="w-4 h-4 animate-spin inline mr-2" />
                      ) : (
                        <Send className="w-4 h-4 inline mr-2" />
                      )}
                      Gönder
                    </button>
                    <button
                      onClick={() => setShowContactForm(false)}
                      className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 text-sm font-medium"
                    >
                      İptal
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Geri Kazanma Aksiyonları */}
            {showRecoveryActions && (
              <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                <h4 className="font-semibold text-gray-900 dark:text-white mb-3">Geri Kazanma Aksiyonları</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                  {user.name} için uygun geri kazanma stratejilerini seçin. Her aksiyon otomatik olarak müşteriye iletilir.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <button
                    onClick={() => handleRecoveryAction('discount')}
                    disabled={isLoading}
                    className="p-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 text-left disabled:opacity-50 transition-all hover:shadow-md"
                  >
                    <div className="flex items-start gap-3">
                      <div className="text-blue-600 mt-1">
                        <Percent className="w-6 h-6" />
                      </div>
                      <div className="flex-1">
                        <div className="font-semibold text-gray-900 dark:text-white mb-1">Özel İndirim</div>
                        <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">%20 indirim ile geri kazan</div>
                        <div className="text-xs text-blue-600 dark:text-blue-400">
                          • Özel indirim kodu oluşturulur<br/>
                          • Email ile otomatik gönderilir<br/>
                          • 30 gün geçerlilik süresi<br/>
                          • Tüm hizmetlerde geçerli
                        </div>
                      </div>
                    </div>
                  </button>

                  <button
                    onClick={() => handleRecoveryAction('upgrade')}
                    disabled={isLoading}
                    className="p-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 text-left disabled:opacity-50 transition-all hover:shadow-md"
                  >
                    <div className="flex items-start gap-3">
                      <div className="text-green-600 mt-1">
                        <TrendingUp className="w-6 h-6" />
                      </div>
                      <div className="flex-1">
                        <div className="font-semibold text-gray-900 dark:text-white mb-1">Plan Yükseltme</div>
                        <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">Ücretsiz plan yükseltme teklifi</div>
                        <div className="text-xs text-green-600 dark:text-green-400">
                          • 3 ay ücretsiz yükseltme<br/>
                          • Özel özellikler açılır<br/>
                          • Kişiselleştirilmiş teklif<br/>
                          • 7 gün geçerlilik süresi
                        </div>
                      </div>
                    </div>
                  </button>

                  <button
                    onClick={() => handleRecoveryAction('gift')}
                    disabled={isLoading}
                    className="p-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 text-left disabled:opacity-50 transition-all hover:shadow-md"
                  >
                    <div className="flex items-start gap-3">
                      <div className="text-purple-600 mt-1">
                        <Gift className="w-6 h-6" />
                      </div>
                      <div className="flex-1">
                        <div className="font-semibold text-gray-900 dark:text-white mb-1">Hediye Paketi</div>
                        <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">Özel hediye paketi gönder</div>
                        <div className="text-xs text-purple-600 dark:text-purple-400">
                          • Premium hediye paketi<br/>
                          • Kargo ile gönderilir<br/>
                          • Kişiselleştirilmiş not<br/>
                          • 2-3 iş günü teslimat
                        </div>
                      </div>
                    </div>
                  </button>

                  <button
                    onClick={() => handleRecoveryAction('survey')}
                    disabled={isLoading}
                    className="p-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 text-left disabled:opacity-50 transition-all hover:shadow-md"
                  >
                    <div className="flex items-start gap-3">
                      <div className="text-orange-600 mt-1">
                        <MessageSquare className="w-6 h-6" />
                      </div>
                      <div className="flex-1">
                        <div className="font-semibold text-gray-900 dark:text-white mb-1">Memnuniyet Anketi</div>
                        <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">Ayrılma nedenini öğren</div>
                        <div className="text-xs text-orange-600 dark:text-orange-400">
                          • Detaylı memnuniyet anketi<br/>
                          • Ayrılma nedenleri analizi<br/>
                          • Geri bildirim toplama<br/>
                          • Anket sonrası ödül
                        </div>
                      </div>
                    </div>
                  </button>
                </div>
                <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                  <div className="flex items-start gap-2">
                    <Info className="w-4 h-4 text-blue-600 mt-0.5" />
                    <div className="text-sm text-blue-800 dark:text-blue-400">
                      <strong>Bilgi:</strong> Seçilen aksiyon otomatik olarak müşteriye iletilir ve sistem tarafından takip edilir. 
                      Aksiyon sonuçları dashboard'da görüntülenebilir.
                      <br/><br/>
                      <strong>Önerilen Strateji:</strong> Müşterinin memnuniyet puanına göre aksiyon seçin:
                      <br/>• Düşük memnuniyet (1-4): Memnuniyet Anketi + Özel İndirim
                      <br/>• Orta memnuniyet (5-6): Plan Yükseltme + Hediye Paketi
                      <br/>• Yüksek memnuniyet (7+): Özel İndirim veya Plan Yükseltme
                    </div>
                  </div>
                </div>
                <div className="mt-3">
                  <button
                    onClick={() => setShowRecoveryActions(false)}
                    className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 text-sm font-medium"
                  >
                    İptal
                  </button>
                </div>
              </div>
            )}

            {/* Aksiyonlar */}
            {!showContactForm && !showRecoveryActions && (
              <div className="flex gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                <button 
                  onClick={() => setShowContactForm(true)}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium"
                >
                  <Mail className="w-4 h-4 mr-2 inline" />
                  İletişime Geç
                </button>
                <button 
                  onClick={() => setShowRecoveryActions(true)}
                  className="flex-1 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 text-sm font-medium"
                >
                  <RefreshCw className="w-4 h-4 mr-2 inline" />
                  Geri Kazan
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const ChurnAnalysis: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [churnData, setChurnData] = useState<ChurnAnalytics | null>(null);
  const [churnReasons, setChurnReasons] = useState<ChurnReason[]>([]);
  const [timeFilter, setTimeFilter] = useState('30');
  const [planFilter, setPlanFilter] = useState('all');
  const [error, setError] = useState<string | null>(null);
  const [useMockData, setUseMockData] = useState(false);
  const [selectedUser, setSelectedUser] = useState<ChurnedUser | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const fetchChurnData = async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      setError(null);

      const daysAgo = parseInt(timeFilter);
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - daysAgo);

      // Supabase bağlantısını test et
      const { data: testConnection } = await supabase
        .from('customers')
        .select('count')
        .limit(1);

      if (!testConnection) {
        // Supabase bağlantısı yoksa mock verileri kullan
        setUseMockData(true);
        setChurnData(mockChurnData);
        setChurnReasons(mockChurnReasons);
        return;
      }

      setUseMockData(false);

      // Churn analizi verilerini çek
      const { data: churnAnalytics, error: churnError } = await supabase
        .rpc('get_churn_analytics', {
          start_date: startDate.toISOString(),
          end_date: new Date().toISOString()
        });

      if (churnError) {
        console.error('Churn analizi hatası:', churnError);
        throw new Error('Churn analizi verileri alınamadı');
      }

      // Churn nedenleri verilerini çek
      const { data: reasonsData, error: reasonsError } = await supabase
        .rpc('get_churn_reasons', {
          start_date: startDate.toISOString(),
          end_date: new Date().toISOString()
        });

      if (reasonsError) {
        console.error('Churn nedenleri hatası:', reasonsError);
        throw new Error('Churn nedenleri verileri alınamadı');
      }

      setChurnData(churnAnalytics);
      setChurnReasons(reasonsData || []);
    } catch (err) {
      console.error('Churn verileri çekilirken hata:', err);
      // Hata durumunda mock verileri kullan
      setUseMockData(true);
      setChurnData(mockChurnData);
      setChurnReasons(mockChurnReasons);
      setError(err instanceof Error ? err.message : 'Veriler yüklenirken bir hata oluştu');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchChurnData();
  }, [timeFilter]);

  const handleRefresh = () => {
    fetchChurnData(true);
  };

  const filteredUsers = churnData?.churned_users?.filter(user => {
    const matchesPlan = planFilter === 'all' || user.plan === planFilter;
    return matchesPlan;
  }) || [];

  const colors = ['#ef4444', '#f97316', '#eab308', '#22c55e', '#3b82f6', '#8b5cf6'];

  const handleExportReport = async () => {
    try {
      const reportData = {
        churn_rate: churnData?.churn_rate,
        total_customers: churnData?.total_customers,
        churned_customers: churnData?.churned_customers,
        avg_subscription_duration: churnData?.avg_subscription_duration,
        churned_users: filteredUsers,
        churn_reasons: churnReasons,
        risk_customers: churnData?.risk_customers,
        generated_at: new Date().toISOString(),
        time_period: `${timeFilter} gün`,
        plan_filter: planFilter,
        data_source: useMockData ? 'Mock Data' : 'Supabase'
      };

      const blob = new Blob([JSON.stringify(reportData, null, 2)], {
        type: 'application/json'
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `churn-analysis-${format(new Date(), 'yyyy-MM-dd')}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Rapor indirme hatası:', err);
      setError('Rapor indirilirken bir hata oluştu');
    }
  };

  const handleViewUserDetails = (user: ChurnedUser) => {
    setSelectedUser(user);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedUser(null);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex items-center gap-3">
          <Loader2 className="w-6 h-6 animate-spin" />
          <span className="text-gray-600 dark:text-gray-400">Churn verileri yükleniyor...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Churn Analizi</h1>
          <p className="text-gray-600 dark:text-gray-400">
            Son {timeFilter} günde {churnData?.churned_customers || 0} kullanıcı ayrıldı
          </p>
          {useMockData && (
            <div className="flex items-center gap-2 mt-2 text-amber-600 dark:text-amber-400">
              <Info className="w-4 h-4" />
              <span className="text-sm">Test verileri kullanılıyor</span>
            </div>
          )}
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={handleRefresh}
            disabled={refreshing}
            className="inline-flex items-center px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            Yenile
          </button>
          <button 
            onClick={handleExportReport}
            className="inline-flex items-center px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
          >
            <Download className="w-4 h-4 mr-2" />
            Rapor İndir
          </button>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-red-500" />
            <p className="text-red-700 dark:text-red-400 text-sm">{error}</p>
          </div>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Churn Oranı</p>
              <p className="text-2xl font-bold text-red-600 mt-2">{churnData?.churn_rate || 0}%</p>
            </div>
            <div className="bg-red-100 dark:bg-red-900/20 p-3 rounded-lg">
              <TrendingDown className="w-6 h-6 text-red-600" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Ayrılan Kullanıcı</p>
              <p className="text-2xl font-bold text-orange-600 mt-2">{churnData?.churned_customers || 0}</p>
            </div>
            <div className="bg-orange-100 dark:bg-orange-900/20 p-3 rounded-lg">
              <Users className="w-6 h-6 text-orange-600" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Ort. Abonelik Süresi</p>
              <p className="text-2xl font-bold text-blue-600 mt-2">
                {Math.round(churnData?.avg_subscription_duration || 0)} gün
              </p>
            </div>
            <div className="bg-blue-100 dark:bg-blue-900/20 p-3 rounded-lg">
              <Calendar className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Risk Altındaki</p>
              <p className="text-2xl font-bold text-purple-600 mt-2">
                {churnData?.risk_customers?.length || 0}
              </p>
            </div>
            <div className="bg-purple-100 dark:bg-purple-900/20 p-3 rounded-lg">
              <AlertTriangle className="w-6 h-6 text-purple-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-gray-400" />
            <select
              value={timeFilter}
              onChange={(e) => setTimeFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="7">Son 7 Gün</option>
              <option value="30">Son 30 Gün</option>
              <option value="90">Son 90 Gün</option>
              <option value="365">Son 1 Yıl</option>
            </select>
          </div>
          <div>
            <select
              value={planFilter}
              onChange={(e) => setPlanFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">Tüm Planlar</option>
              <option value="Basic">Basic</option>
              <option value="Pro">Pro</option>
              <option value="Professional">Professional</option>
              <option value="Premium">Premium</option>
            </select>
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Churn Reasons */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Churn Nedenleri</h3>
          {churnReasons.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={churnReasons}
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  dataKey="count"
                  label={({ reason, percentage }) => `${reason} (${percentage.toFixed(1)}%)`}
                >
                  {churnReasons.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-[300px] text-gray-500">
              <div className="text-center">
                <AlertTriangle className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                <p>Veri bulunamadı</p>
              </div>
            </div>
          )}
        </div>

        {/* Plan-based Churn Analysis */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Plan Bazında Churn Analizi</h3>
          {churnData?.churn_by_plan && churnData.churn_by_plan.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={churnData.churn_by_plan}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="plan" />
                <YAxis />
                <Tooltip formatter={(value) => [`${value} kullanıcı`, 'Ayrılan Sayısı']} />
                <Bar dataKey="count" fill="#ef4444" name="Ayrılan Kullanıcı" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-[300px] text-gray-500">
              <div className="text-center">
                <AlertTriangle className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                <p>Veri bulunamadı</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Risk Customers */}
      {churnData?.risk_customers && churnData.risk_customers.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Risk Altındaki Müşteriler</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Müşteri
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Plan
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Son Aktivite
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Memnuniyet
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Risk Seviyesi
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {churnData.risk_customers.map((customer) => (
                  <tr key={customer.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <div className="w-10 h-10 bg-orange-500 rounded-full flex items-center justify-center text-white font-semibold">
                          {customer.name.charAt(0)}
                        </div>
                        <div className="ml-3">
                          <div className="text-sm font-medium text-gray-900 dark:text-white">
                            {customer.name}
                          </div>
                          <div className="text-sm text-gray-500 dark:text-gray-400">
                            {customer.email}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400">
                        {customer.plan}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">
                      {customer.days_since_last_activity 
                        ? `${Math.round(customer.days_since_last_activity)} gün önce`
                        : 'Bilinmiyor'
                      }
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        customer.satisfaction_score >= 7 
                          ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
                          : customer.satisfaction_score >= 5
                          ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400'
                          : 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
                      }`}>
                        {customer.satisfaction_score}/10
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400">
                        Yüksek Risk
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Churned Users Table */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Ayrılan Kullanıcılar</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Kullanıcı
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Plan
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Ayrılma Tarihi
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Abonelik Süresi
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Toplam Talep
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Memnuniyet
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  İşlemler
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {filteredUsers.length > 0 ? (
                filteredUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <div className="w-10 h-10 bg-red-500 rounded-full flex items-center justify-center text-white font-semibold">
                          {user.name.charAt(0)}
                        </div>
                        <div className="ml-3">
                          <div className="text-sm font-medium text-gray-900 dark:text-white">
                            {user.name}
                          </div>
                          <div className="text-sm text-gray-500 dark:text-gray-400">
                            {user.email}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400">
                        {user.plan}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">
                      {format(new Date(user.churn_date), 'dd MMM yyyy', { locale: tr })}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">
                      {Math.round(user.subscription_duration)} gün
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">
                      {user.total_tickets}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        user.satisfaction_score >= 7 
                          ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
                          : user.satisfaction_score >= 5
                          ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400'
                          : 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
                      }`}>
                        {user.satisfaction_score}/10
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <button 
                        onClick={() => handleViewUserDetails(user)}
                        className="inline-flex items-center px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs font-medium transition-colors"
                      >
                        <Eye className="w-3 h-3 mr-1" />
                        Detay
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-gray-500">
                    <div className="text-center">
                      <AlertTriangle className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                      <p>Seçilen kriterlere uygun ayrılan kullanıcı bulunamadı</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* User Detail Modal */}
      <UserDetailModal 
        user={selectedUser}
        isOpen={isModalOpen}
        onClose={handleCloseModal}
      />
    </div>
  );
};

export default ChurnAnalysis;