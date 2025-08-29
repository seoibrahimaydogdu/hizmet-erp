import React, { useState, useEffect, useCallback } from 'react';
import { 
  DollarSign, 
  Plus, 
  Eye, 
  Edit, 
  Trash2,
  Calendar,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Percent,
  Tag,
  Bell,
  Users,
  MessageSquare,
  X
} from 'lucide-react';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';
import { formatCurrency, formatCurrencyForPromotion, getCurrencySymbol } from '../lib/currency';

interface PromotionManagementProps {
  promotions: any[];
  promotionUsage: any[];
  onAddPromotion?: () => void;
  onEditPromotion?: (promotion: any) => void;
  onDeletePromotion?: (promotionId: string) => void;
  onViewPromotion?: (promotionId: string) => void;
  onUpdatePromotionStatus?: (promotionId: string, isActive: boolean) => void;
}

const PromotionManagement: React.FC<PromotionManagementProps> = ({
  promotions,
  promotionUsage,
  onAddPromotion,
  onEditPromotion,
  onDeletePromotion,
  onViewPromotion,
  onUpdatePromotionStatus
}) => {
  const [selectedPeriod, setSelectedPeriod] = useState('current_month');
  const [showNotificationModal, setShowNotificationModal] = useState(false);
  const [showUsageModal, setShowUsageModal] = useState(false);
  const [selectedPromotion, setSelectedPromotion] = useState<any>(null);
  const [notificationType, setNotificationType] = useState<'ending-soon' | 'expiring'>('ending-soon');
  const [customNotificationMessage, setCustomNotificationMessage] = useState('');

  // Bitiş tarihi geçmiş promosyonları otomatik pasife al
  useEffect(() => {
    const now = new Date();
    const expiredPromotions = promotions.filter(promotion => {
      if (!promotion.is_active || !promotion.end_date) return false;
      const endDate = new Date(promotion.end_date);
      return endDate < now;
    });

    // Süresi dolmuş promosyonları pasife al (sessizce, hata mesajı göstermeden)
    if (onUpdatePromotionStatus) {
      expiredPromotions.forEach(async (promotion) => {
        try {
          await onUpdatePromotionStatus(promotion.id, false);
        } catch (error) {
          // Sessizce hata logla, kullanıcıya gösterme
          console.error('Otomatik promosyon pasifleştirme hatası:', error);
        }
      });
    }

    // Eğer süresi dolmuş promosyon varsa konsola bilgi ver
    if (expiredPromotions.length > 0) {
      console.log(`${expiredPromotions.length} promosyon süresi doldu ve pasife alındı.`);
    }
  }, [promotions, onUpdatePromotionStatus]);

  // Bildirim mesajı oluştur
  const getNotificationMessage = useCallback((promotion: any, type: 'ending-soon' | 'expiring') => {
    const daysLeft = type === 'ending-soon' ? 30 : 7;
    const urgency = type === 'ending-soon' ? 'yakında' : 'çok yakında';
    
    return `🎉 ${promotion.name} promosyonu ${urgency} sona erecek! 
    
${type === 'ending-soon' ? '1 ay' : '1 hafta'} kaldı, kaçırmayın!

📅 Bitiş Tarihi: ${format(new Date(promotion.end_date), 'dd MMMM yyyy', { locale: tr })}
💰 İndirim: ${formatDiscountValue(promotion.discount_type, promotion.discount_value)}
${promotion.description ? `📝 ${promotion.description}` : ''}

Hemen fırsatı değerlendirin! 🚀`;
  }, []);

  // Bildirim türü değiştiğinde mesajı güncelle
  useEffect(() => {
    if (selectedPromotion && showNotificationModal) {
      setCustomNotificationMessage(getNotificationMessage(selectedPromotion, notificationType));
    }
  }, [notificationType, selectedPromotion, showNotificationModal, getNotificationMessage]);

  // Promosyon kullanım sayısını hesapla
  const getPromotionUsageCount = (promotionId: string) => {
    return promotionUsage.filter(usage => usage.promotion_id === promotionId).length;
  };

  // Promosyon kullanıcılarını getir
  const getPromotionUsers = (promotionId: string) => {
    return promotionUsage.filter(usage => usage.promotion_id === promotionId);
  };

  // Promosyon kullanmayan kullanıcıları getir
  const getNonUsageUsers = (promotionId: string) => {
    const usedUserIds = promotionUsage
      .filter(usage => usage.promotion_id === promotionId)
      .map(usage => usage.customer_id);
    
    // Burada customers verisi yok, bu yüzden sadece kullanım verilerinden çıkarım yapıyoruz
    return [];
  };

  // Promosyon istatistikleri
  const getPromotionStats = () => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    
    const currentMonthPromotions = promotions.filter(promotion => {
      const promotionDate = new Date(promotion.created_at);
      return promotionDate.getMonth() === currentMonth && 
             promotionDate.getFullYear() === currentYear;
    });

    const activePromotions = promotions.filter(p => p.is_active);
    const inactivePromotions = promotions.filter(p => !p.is_active);
    const percentagePromotions = promotions.filter(p => p.discount_type === 'percentage');
    const fixedPromotions = promotions.filter(p => p.discount_type === 'fixed');

    // Bitmek üzere olan promosyonlar (1 ay içinde)
    const endingSoonPromotions = promotions.filter(promotion => {
      if (!promotion.is_active || !promotion.end_date) return false;
      const endDate = new Date(promotion.end_date);
      const daysUntilExpiry = Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      return endDate > now && daysUntilExpiry <= 30;
    });

    // 7 gün içinde dolacak promosyonlar
    const expiringPromotions = promotions.filter(promotion => {
      if (!promotion.is_active || !promotion.end_date) return false;
      const endDate = new Date(promotion.end_date);
      const daysUntilExpiry = Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      return endDate > now && daysUntilExpiry <= 7;
    });

    const averageDiscount = promotions.length > 0 
      ? promotions.reduce((sum, p) => sum + Number(p.discount_value), 0) / promotions.length 
      : 0;

    return {
      totalPromotions: promotions.length,
      activePromotions: activePromotions.length,
      inactivePromotions: inactivePromotions.length,
      currentMonthCount: currentMonthPromotions.length,
      percentagePromotions: percentagePromotions.length,
      fixedPromotions: fixedPromotions.length,
      endingSoonPromotions: endingSoonPromotions.length,
      expiringPromotions: expiringPromotions.length,
      averageDiscount
    };
  };

  const stats = getPromotionStats();

  // Durum rengi
  const getStatusColor = (isActive: boolean) => {
    return isActive 
      ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
      : 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400';
  };

  // İndirim türü ikonu
  const getDiscountTypeIcon = (type: string) => {
    return type === 'percentage' ? <Percent className="w-4 h-4" /> : <DollarSign className="w-4 h-4" />;
  };

  // İndirim değeri formatı
  const formatDiscountValue = (type: string, value: number, currencyCode: string = 'TRY') => {
    const safeValue = value !== null && value !== undefined ? value : 0;
    if (type === 'percentage') {
      return `%${safeValue}`;
    } else {
      // Promosyon için özel formatlama (sembol olmadan)
      return formatCurrencyForPromotion(safeValue, currencyCode as any);
    }
  };

  // Promosyon durumu kontrolü
  const getPromotionStatus = (promotion: any) => {
    const now = new Date();
    const endDate = promotion.end_date ? new Date(promotion.end_date) : null;
    
    if (!promotion.is_active) {
      return { status: 'inactive', text: 'Pasif', color: 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400' };
    }
    
    if (endDate && endDate < now) {
      return { status: 'expired', text: 'Süresi Doldu', color: 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400' };
    }
    
    if (endDate) {
      const daysUntilExpiry = Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      
      // 1 ay (30 gün) kontrolü
      if (daysUntilExpiry <= 30 && daysUntilExpiry > 7) {
        return { status: 'ending-soon', text: 'Bitmek Üzere', color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400' };
      }
      
      // 7 gün kontrolü
      if (daysUntilExpiry <= 7) {
        return { status: 'expiring', text: `${daysUntilExpiry} gün kaldı`, color: 'bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400' };
      }
    }
    
    return { status: 'active', text: 'Aktif', color: 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400' };
  };

  // Bildirim gönderme fonksiyonu
  const sendNotification = (promotion: any, type: 'ending-soon' | 'expiring') => {
    setSelectedPromotion(promotion);
    setNotificationType(type);
    setShowNotificationModal(true);
    // Varsayılan mesajı ayarla
    setCustomNotificationMessage(getNotificationMessage(promotion, type));
  };

  // Bildirim modalını kapat
  const closeNotificationModal = () => {
    setShowNotificationModal(false);
    setSelectedPromotion(null);
    setCustomNotificationMessage('');
  };

  // Bildirim gönder
  const handleSendNotification = () => {
    if (!selectedPromotion) return;
    
    // Burada gerçek bildirim gönderme işlemi yapılacak
    console.log('Bildirim gönderiliyor:', {
      promotion: selectedPromotion,
      type: notificationType,
      message: customNotificationMessage || getNotificationMessage(selectedPromotion, notificationType),
      recipients: getNotificationRecipients(selectedPromotion)
    });
    
    closeNotificationModal();
  };

  // Bildirim alıcılarını al
  const getNotificationRecipients = (promotion: any) => {
    // Burada gerçek müşteri listesi alınacak
    return [
      { id: 1, name: 'Ayşe Demir', email: 'ayse@example.com', phone: '+90 532 123 45 67' },
      { id: 2, name: 'Ayşe Demir', email: 'ayse@example.com', phone: '+90 555 234 5678' },
      { id: 3, name: 'Mehmet Kaya', email: 'mehmet@example.com', phone: '+90 555 345 6789' },
      { id: 4, name: 'Fatma Özkan', email: 'fatma@example.com', phone: '+90 555 456 7890' },
      { id: 5, name: 'Ali Çelik', email: 'ali@example.com', phone: '+90 555 567 8901' }
    ];
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Promosyon Yönetimi</h2>
        <button
          onClick={onAddPromotion}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center"
        >
          <Plus className="w-4 h-4 mr-2" />
          Yeni Promosyon
        </button>
      </div>

      {/* Promosyon İstatistikleri */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Toplam Promosyon</p>
              <p className="text-2xl font-bold text-blue-600 mt-2">{stats.totalPromotions}</p>
              <p className="text-xs text-gray-500 mt-1">Tüm zamanlar</p>
            </div>
            <div className="bg-blue-500 p-3 rounded-lg">
              <Tag className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Aktif Promosyon</p>
              <p className="text-2xl font-bold text-green-600 mt-2">{stats.activePromotions}</p>
              <p className="text-xs text-gray-500 mt-1">Şu anda aktif</p>
            </div>
            <div className="bg-green-500 p-3 rounded-lg">
              <CheckCircle className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Bitmek Üzere</p>
              <p className="text-2xl font-bold text-yellow-600 mt-2">{stats.endingSoonPromotions}</p>
              <p className="text-xs text-gray-500 mt-1">1 ay içinde</p>
            </div>
            <div className="bg-yellow-500 p-3 rounded-lg">
              <AlertTriangle className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Ortalama İndirim</p>
              <p className="text-2xl font-bold text-orange-600 mt-2">
                {stats.averageDiscount.toFixed(0)}
              </p>
              <p className="text-xs text-gray-500 mt-1">Ortalama değer</p>
            </div>
            <div className="bg-orange-500 p-3 rounded-lg">
              <TrendingUp className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>
      </div>

      {/* Promosyon Detay İstatistikleri */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Promosyon Durumları</h3>
            <Tag className="w-5 h-5 text-blue-500" />
          </div>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <div className="flex items-center">
                <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                <span className="text-sm text-gray-600 dark:text-gray-400">Aktif</span>
              </div>
              <span className="text-sm font-semibold text-green-600">
                {stats.activePromotions}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <div className="flex items-center">
                <XCircle className="w-4 h-4 text-gray-500 mr-2" />
                <span className="text-sm text-gray-600 dark:text-gray-400">Pasif</span>
              </div>
              <span className="text-sm font-semibold text-gray-600">
                {stats.inactivePromotions}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <div className="flex items-center">
                <AlertTriangle className="w-4 h-4 text-yellow-500 mr-2" />
                <span className="text-sm text-gray-600 dark:text-gray-400">Bitmek Üzere</span>
              </div>
              <span className="text-sm font-semibold text-yellow-600">
                {stats.endingSoonPromotions}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <div className="flex items-center">
                <Calendar className="w-4 h-4 text-blue-500 mr-2" />
                <span className="text-sm text-gray-600 dark:text-gray-400">Bu Ay</span>
              </div>
              <span className="text-sm font-semibold text-blue-600">
                {stats.currentMonthCount}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <div className="flex items-center">
                <Tag className="w-4 h-4 text-purple-500 mr-2" />
                <span className="text-sm text-gray-600 dark:text-gray-400">Toplam</span>
              </div>
              <span className="text-sm font-semibold text-gray-900 dark:text-white">
                {stats.totalPromotions}
              </span>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">İndirim Türleri</h3>
            <DollarSign className="w-5 h-5 text-green-500" />
          </div>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <div className="flex items-center">
                <Percent className="w-4 h-4 text-blue-500 mr-2" />
                <span className="text-sm text-gray-600 dark:text-gray-400">Yüzde İndirim</span>
              </div>
              <span className="text-sm font-semibold text-blue-600">
                {stats.percentagePromotions}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <div className="flex items-center">
                <DollarSign className="w-4 h-4 text-green-500 mr-2" />
                <span className="text-sm text-gray-600 dark:text-gray-400">Tutar İndirim</span>
              </div>
              <span className="text-sm font-semibold text-green-600">
                {stats.fixedPromotions}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <div className="flex items-center">
                <TrendingUp className="w-4 h-4 text-orange-500 mr-2" />
                <span className="text-sm text-gray-600 dark:text-gray-400">Ortalama İndirim</span>
              </div>
              <span className="text-sm font-semibold text-orange-600">
                {stats.averageDiscount.toFixed(0)}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <div className="flex items-center">
                <Tag className="w-4 h-4 text-purple-500 mr-2" />
                <span className="text-sm text-gray-600 dark:text-gray-400">Toplam</span>
              </div>
              <span className="text-sm font-semibold text-gray-900 dark:text-white">
                {stats.totalPromotions}
              </span>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Hızlı Eylemler</h3>
            <AlertTriangle className="w-5 h-5 text-orange-500" />
          </div>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600 dark:text-gray-400">Aktif Promosyonlar</span>
              <span className="text-sm font-semibold text-green-600">
                {stats.activePromotions}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600 dark:text-gray-400">Pasif Promosyonlar</span>
              <span className="text-sm font-semibold text-gray-600">
                {stats.inactivePromotions}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600 dark:text-gray-400">Bitmek Üzere</span>
              <span className="text-sm font-semibold text-yellow-600">
                {stats.endingSoonPromotions}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600 dark:text-gray-400">Bu Ay Yeni</span>
              <span className="text-sm font-semibold text-blue-600">
                {stats.currentMonthCount}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600 dark:text-gray-400">Ortalama İndirim</span>
              <span className="text-sm font-semibold text-orange-600">
                {stats.averageDiscount.toFixed(0)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Süresi Yaklaşan Promosyonlar Uyarısı */}
      {(() => {
        const now = new Date();
        
        // 7 gün içinde dolacak promosyonlar
        const expiringPromotions = promotions.filter(promotion => {
          if (!promotion.is_active || !promotion.end_date) return false;
          const endDate = new Date(promotion.end_date);
          const daysUntilExpiry = Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
          return endDate > now && daysUntilExpiry <= 7;
        });

        // 1 ay içinde dolacak promosyonlar (7 günden fazla)
        const endingSoonPromotions = promotions.filter(promotion => {
          if (!promotion.is_active || !promotion.end_date) return false;
          const endDate = new Date(promotion.end_date);
          const daysUntilExpiry = Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
          return endDate > now && daysUntilExpiry <= 30 && daysUntilExpiry > 7;
        });

        if (expiringPromotions.length > 0 || endingSoonPromotions.length > 0) {
          return (
            <div className="space-y-3">
              {/* 7 gün uyarısı */}
              {expiringPromotions.length > 0 && (
                <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg p-4">
                  <div className="flex items-center">
                    <AlertTriangle className="w-5 h-5 text-orange-600 dark:text-orange-400 mr-3" />
                    <div>
                      <h3 className="text-sm font-medium text-orange-800 dark:text-orange-200">
                        Acil: Süresi Dolmak Üzere
                      </h3>
                      <p className="text-sm text-orange-700 dark:text-orange-300 mt-1">
                        {expiringPromotions.length} promosyonun süresi 7 gün içinde dolacak.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* 1 ay uyarısı */}
              {endingSoonPromotions.length > 0 && (
                <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
                  <div className="flex items-center">
                    <AlertTriangle className="w-5 h-5 text-yellow-600 dark:text-yellow-400 mr-3" />
                    <div>
                      <h3 className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
                        Bitmek Üzere Olan Promosyonlar
                      </h3>
                      <p className="text-sm text-yellow-700 dark:text-yellow-300 mt-1">
                        {endingSoonPromotions.length} promosyonun süresi 1 ay içinde dolacak.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        }
        return null;
      })()}

      {/* Promosyon Tablosu */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Promosyon Adı
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  İndirim
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Tür
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Başlangıç
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Bitiş
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Kullanım
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Durum
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  İşlemler
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {promotions.map((promotion) => (
                <tr key={promotion.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                  <td className="px-6 py-4">
                    <div>
                      <div className="text-sm font-medium text-gray-900 dark:text-white">
                        {promotion.name}
                      </div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        {promotion.description || 'Açıklama yok'}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center">
                      {getDiscountTypeIcon(promotion.discount_type)}
                      <span className="text-sm font-medium text-green-600 ml-2">
                        {formatDiscountValue(promotion.discount_type, promotion.discount_value)}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm text-gray-900 dark:text-white">
                      {promotion.discount_type === 'percentage' ? 'Yüzde' : 'Tutar'}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm text-gray-900 dark:text-white">
                      {promotion.start_date ? 
                        format(new Date(promotion.start_date), 'dd MMM yyyy', { locale: tr }) : '-'
                      }
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm text-gray-900 dark:text-white">
                      {promotion.end_date ? 
                        format(new Date(promotion.end_date), 'dd MMM yyyy', { locale: tr }) : '-'
                      }
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-blue-600">
                        {getPromotionUsageCount(promotion.id)}
                      </span>
                      <button
                        onClick={() => {
                          setSelectedPromotion(promotion);
                          setShowUsageModal(true);
                        }}
                        className="inline-flex items-center px-2 py-1 bg-blue-100 hover:bg-blue-200 text-blue-700 rounded text-xs font-medium"
                        title="Kullanıcı detaylarını göster"
                      >
                        <Users className="w-3 h-3" />
                      </button>
                    </div>
                  </td>
                                     <td className="px-6 py-4">
                     <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full whitespace-nowrap ${getPromotionStatus(promotion).color}`}>
                       {getPromotionStatus(promotion).text}
                     </span>
                   </td>
                                     <td className="px-6 py-4">
                     <div className="flex items-center gap-2">
                       <button 
                         onClick={() => onViewPromotion?.(promotion)}
                         className="inline-flex items-center px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs font-medium"
                       >
                         <Eye className="w-3 h-3 mr-1" />
                         Görüntüle
                       </button>
                       <button 
                         onClick={() => onEditPromotion?.(promotion)}
                         className="inline-flex items-center px-3 py-1 bg-green-600 hover:bg-green-700 text-white rounded text-xs font-medium"
                       >
                         <Edit className="w-3 h-3 mr-1" />
                         Düzenle
                       </button>
                       <button 
                         onClick={() => onDeletePromotion?.(promotion.id)}
                         className="inline-flex items-center px-3 py-1 bg-red-600 hover:bg-red-700 text-white rounded text-xs font-medium"
                       >
                         <Trash2 className="w-3 h-3 mr-1" />
                         Sil
                       </button>
                                               {/* Bildirim butonları */}
                        {promotion.is_active && promotion.end_date && (() => {
                          const now = new Date();
                          const endDate = new Date(promotion.end_date);
                          const daysUntilExpiry = Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
                          
                          // Süresi dolmuş promosyonlarda bildirim butonu gösterme
                          if (daysUntilExpiry <= 0) {
                            return null;
                          }
                          
                          // 1 ay kala bildirim butonu
                          if (daysUntilExpiry <= 30 && daysUntilExpiry > 7) {
                            return (
                              <button 
                                onClick={() => sendNotification(promotion, 'ending-soon')}
                                className="inline-flex items-center px-3 py-1 bg-yellow-600 hover:bg-yellow-700 text-white rounded text-xs font-medium whitespace-nowrap"
                                title="1 ay kala bildirim gönder"
                              >
                                <Bell className="w-3 h-3 mr-1" />
                                1 Ay
                              </button>
                            );
                          } 
                          
                          // 1 hafta kala bildirim butonu
                          if (daysUntilExpiry <= 7 && daysUntilExpiry > 0) {
                            return (
                              <button 
                                onClick={() => sendNotification(promotion, 'expiring')}
                                className="inline-flex items-center px-3 py-1 bg-orange-600 hover:bg-orange-700 text-white rounded text-xs font-medium whitespace-nowrap"
                                title="1 hafta kala bildirim gönder"
                              >
                                <Bell className="w-3 h-3 mr-1" />
                                1 Hafta
                              </button>
                            );
                          }
                          
                          return null;
                        })()}
                     </div>
                   </td>
                </tr>
              ))}
            </tbody>
          </table>
                 </div>
       </div>

       {/* Bildirim Modal */}
       {showNotificationModal && selectedPromotion && (
         <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
           <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
             <div className="p-6">
               <div className="flex items-center justify-between mb-6">
                 <div className="flex items-center">
                   <Bell className="w-6 h-6 text-blue-600 mr-3" />
                   <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                     Promosyon Bildirimi
                   </h3>
                 </div>
                 <button
                   onClick={closeNotificationModal}
                   className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                 >
                   <X className="w-6 h-6" />
                 </button>
               </div>

               {/* Promosyon Bilgileri */}
               <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 mb-6">
                 <h4 className="font-semibold text-blue-900 dark:text-blue-200 mb-2">
                   {selectedPromotion.name}
                 </h4>
                 <div className="grid grid-cols-2 gap-4 text-sm">
                   <div>
                     <span className="text-blue-700 dark:text-blue-300">İndirim:</span>
                     <span className="ml-2 font-medium text-blue-900 dark:text-blue-100">
                       {formatDiscountValue(selectedPromotion.discount_type, selectedPromotion.discount_value)}
                     </span>
                   </div>
                   <div>
                     <span className="text-blue-700 dark:text-blue-300">Bitiş Tarihi:</span>
                     <span className="ml-2 font-medium text-blue-900 dark:text-blue-100">
                       {format(new Date(selectedPromotion.end_date), 'dd MMMM yyyy', { locale: tr })}
                     </span>
                   </div>
                   <div>
                     <span className="text-blue-700 dark:text-blue-300">Bildirim Türü:</span>
                     <select
                       value={notificationType}
                       onChange={(e) => setNotificationType(e.target.value as 'ending-soon' | 'expiring')}
                       className="ml-2 px-2 py-1 border border-blue-300 dark:border-blue-600 rounded text-sm bg-white dark:bg-gray-700 text-blue-900 dark:text-blue-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                     >
                       <option value="ending-soon">1 Ay Kala</option>
                       <option value="expiring">1 Hafta Kala</option>
                     </select>
                   </div>
                   <div>
                     <span className="text-blue-700 dark:text-blue-300">Durum:</span>
                     <span className="ml-2 font-medium text-blue-900 dark:text-blue-100">
                       {getPromotionStatus(selectedPromotion).text}
                     </span>
                   </div>
                 </div>
               </div>

               {/* Bildirim Mesajı */}
               <div className="mb-6">
                 <h4 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center">
                   <MessageSquare className="w-5 h-5 mr-2 text-green-600" />
                   Bildirim Mesajı
                 </h4>
                 <div className="space-y-3">
                   <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                     <div className="text-xs text-gray-500 dark:text-gray-400 mb-2">Varsayılan Mesaj Önizlemesi:</div>
                     <pre className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap font-sans">
                       {getNotificationMessage(selectedPromotion, notificationType)}
                     </pre>
                   </div>
                   <div>
                     <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                       Mesajı Özelleştir
                     </label>
                     <textarea
                       value={customNotificationMessage}
                       onChange={(e) => setCustomNotificationMessage(e.target.value)}
                       className="w-full h-32 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white resize-none"
                       placeholder="Bildirim mesajınızı buraya yazın..."
                     />
                     <div className="flex justify-between items-center mt-2">
                       <span className="text-xs text-gray-500 dark:text-gray-400">
                         {customNotificationMessage.length} karakter
                       </span>
                       <button
                         onClick={() => setCustomNotificationMessage(getNotificationMessage(selectedPromotion, notificationType))}
                         className="text-xs text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
                       >
                         Varsayılan Mesajı Geri Yükle
                       </button>
                     </div>
                     {customNotificationMessage && customNotificationMessage !== getNotificationMessage(selectedPromotion, notificationType) && (
                       <div className="mt-3 bg-green-50 dark:bg-green-900/20 rounded-lg p-3">
                         <div className="text-xs text-green-600 dark:text-green-400 mb-2 font-medium">Özelleştirilmiş Mesaj Önizlemesi:</div>
                         <pre className="text-sm text-green-700 dark:text-green-300 whitespace-pre-wrap font-sans">
                           {customNotificationMessage}
                         </pre>
                       </div>
                     )}
                   </div>
                 </div>
               </div>

               {/* Alıcı Listesi */}
               <div className="mb-6">
                 <h4 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center">
                   <Users className="w-5 h-5 mr-2 text-purple-600" />
                   Bildirim Alıcıları ({getNotificationRecipients(selectedPromotion).length} kişi)
                 </h4>
                 <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 max-h-48 overflow-y-auto">
                   <div className="space-y-2">
                     {getNotificationRecipients(selectedPromotion).map((recipient) => (
                       <div key={recipient.id} className="flex items-center justify-between p-2 bg-white dark:bg-gray-600 rounded">
                         <div>
                           <div className="font-medium text-gray-900 dark:text-white">
                             {recipient.name}
                           </div>
                           <div className="text-sm text-gray-500 dark:text-gray-400">
                             {recipient.email} • {recipient.phone}
                           </div>
                         </div>
                         <div className="flex space-x-2">
                           <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400">
                             E-posta
                           </span>
                           <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400">
                             SMS
                           </span>
                         </div>
                       </div>
                     ))}
                   </div>
                 </div>
               </div>

               {/* Bildirim İstatistikleri */}
               <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-lg p-4 mb-6">
                 <h4 className="font-semibold text-yellow-900 dark:text-yellow-200 mb-2">
                   Bildirim Özeti
                 </h4>
                 <div className="grid grid-cols-3 gap-4 text-sm">
                   <div className="text-center">
                     <div className="text-2xl font-bold text-yellow-600">
                       {getNotificationRecipients(selectedPromotion).length}
                     </div>
                     <div className="text-yellow-700 dark:text-yellow-300">Toplam Alıcı</div>
                   </div>
                   <div className="text-center">
                     <div className="text-2xl font-bold text-green-600">2</div>
                     <div className="text-green-700 dark:text-green-300">Gönderim Türü</div>
                   </div>
                   <div className="text-center">
                     <div className="text-2xl font-bold text-blue-600">
                       {notificationType === 'ending-soon' ? '30' : '7'}
                     </div>
                     <div className="text-blue-700 dark:text-blue-300">Gün Kaldı</div>
                   </div>
                 </div>
               </div>

               {/* Aksiyon Butonları */}
               <div className="flex justify-end space-x-3">
                 <button
                   onClick={closeNotificationModal}
                   className="px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                 >
                   İptal
                 </button>
                 <button
                   onClick={handleSendNotification}
                   className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center"
                 >
                   <Bell className="w-4 h-4 mr-2" />
                   Bildirimi Gönder
                 </button>
               </div>
             </div>
           </div>
         </div>
       )}

       {/* Kullanıcı Detayları Modal */}
       {showUsageModal && selectedPromotion && (
         <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
           <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
             <div className="p-6">
               <div className="flex items-center justify-between mb-6">
                 <div className="flex items-center">
                   <Users className="w-6 h-6 text-blue-600 mr-3" />
                   <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                     {selectedPromotion.name} - Kullanıcı Detayları
                   </h3>
                 </div>
                 <button
                   onClick={() => setShowUsageModal(false)}
                   className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                 >
                   <X className="w-6 h-6" />
                 </button>
               </div>

               {/* Promosyon Bilgileri */}
               <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 mb-6">
                 <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                   <div>
                     <span className="text-blue-700 dark:text-blue-300">İndirim:</span>
                     <span className="ml-2 font-medium text-blue-900 dark:text-blue-100">
                       {formatDiscountValue(selectedPromotion.discount_type, selectedPromotion.discount_value)}
                     </span>
                   </div>
                   <div>
                     <span className="text-blue-700 dark:text-blue-300">Toplam Kullanım:</span>
                     <span className="ml-2 font-medium text-blue-900 dark:text-blue-100">
                       {getPromotionUsageCount(selectedPromotion.id)}
                     </span>
                   </div>
                   <div>
                     <span className="text-blue-700 dark:text-blue-300">Kullanım Limiti:</span>
                     <span className="ml-2 font-medium text-blue-900 dark:text-blue-100">
                       {selectedPromotion.usage_limit || 'Sınırsız'}
                     </span>
                   </div>
                   <div>
                     <span className="text-blue-700 dark:text-blue-300">Durum:</span>
                     <span className="ml-2 font-medium text-blue-900 dark:text-blue-100">
                       {getPromotionStatus(selectedPromotion).text}
                     </span>
                   </div>
                 </div>
               </div>

               {/* Kullanıcı Listesi */}
               <div className="mb-6">
                 <h4 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center">
                   <CheckCircle className="w-5 h-5 mr-2 text-green-600" />
                   Promosyonu Kullananlar ({getPromotionUsers(selectedPromotion.id).length} kişi)
                 </h4>
                 <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 max-h-64 overflow-y-auto">
                   {getPromotionUsers(selectedPromotion.id).length > 0 ? (
                     <div className="space-y-2">
                       {getPromotionUsers(selectedPromotion.id).map((usage, index) => (
                         <div key={index} className="flex items-center justify-between p-3 bg-white dark:bg-gray-600 rounded-lg">
                           <div className="flex-1">
                             <div className="font-medium text-gray-900 dark:text-white">
                               {usage.customer_name || `Müşteri ${usage.customer_id}`}
                             </div>
                             <div className="text-sm text-gray-500 dark:text-gray-400">
                               {usage.customer_email || 'E-posta bilgisi yok'} • {usage.customer_phone || 'Telefon bilgisi yok'}
                             </div>
                             <div className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                               Kullanım Tarihi: {usage.used_at ? format(new Date(usage.used_at), 'dd MMM yyyy HH:mm', { locale: tr }) : 'Bilinmiyor'}
                             </div>
                           </div>
                           <div className="flex items-center gap-2">
                             <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400">
                               Kullandı
                             </span>
                           </div>
                         </div>
                       ))}
                     </div>
                   ) : (
                     <div className="text-center text-gray-500 dark:text-gray-400 py-8">
                       <Users className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                       <p>Henüz bu promosyonu kullanan kimse yok</p>
                     </div>
                   )}
                 </div>
               </div>

               {/* Kullanmayanlar Mesajı */}
               <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-lg p-4 mb-6">
                 <h4 className="font-semibold text-yellow-900 dark:text-yellow-200 mb-2 flex items-center">
                   <AlertTriangle className="w-5 h-5 mr-2" />
                   Kullanmayanlara Mesaj Gönder
                 </h4>
                 <p className="text-sm text-yellow-700 dark:text-yellow-300 mb-3">
                   Bu promosyonu henüz kullanmayan müşterilere özel teklif mesajı gönderebilirsiniz.
                 </p>
                 <button
                   onClick={() => {
                     setShowUsageModal(false);
                     setShowNotificationModal(true);
                     setNotificationType('ending-soon');
                   }}
                   className="inline-flex items-center px-4 py-2 bg-yellow-600 hover:bg-yellow-700 text-white rounded-lg text-sm font-medium"
                 >
                   <MessageSquare className="w-4 h-4 mr-2" />
                   Kullanmayanlara Mesaj Gönder
                 </button>
               </div>

               {/* İstatistikler */}
               <div className="grid grid-cols-3 gap-4 mb-6">
                 <div className="text-center bg-green-50 dark:bg-green-900/20 rounded-lg p-4">
                   <div className="text-2xl font-bold text-green-600">
                     {getPromotionUsageCount(selectedPromotion.id)}
                   </div>
                   <div className="text-sm text-green-700 dark:text-green-300">Kullanan</div>
                 </div>
                 <div className="text-center bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
                   <div className="text-2xl font-bold text-blue-600">
                     {selectedPromotion.usage_limit ? selectedPromotion.usage_limit - getPromotionUsageCount(selectedPromotion.id) : '∞'}
                   </div>
                   <div className="text-sm text-blue-700 dark:text-blue-300">Kalan</div>
                 </div>
                 <div className="text-center bg-purple-50 dark:bg-purple-900/20 rounded-lg p-4">
                   <div className="text-2xl font-bold text-purple-600">
                     {selectedPromotion.usage_limit ? 
                       Math.round((getPromotionUsageCount(selectedPromotion.id) / selectedPromotion.usage_limit) * 100) : 
                       getPromotionUsageCount(selectedPromotion.id) > 0 ? 100 : 0
                     }%
                   </div>
                   <div className="text-sm text-purple-700 dark:text-purple-300">Kullanım Oranı</div>
                 </div>
               </div>

               {/* Aksiyon Butonları */}
               <div className="flex justify-end space-x-3">
                 <button
                   onClick={() => setShowUsageModal(false)}
                   className="px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                 >
                   Kapat
                 </button>
               </div>
             </div>
           </div>
         </div>
       )}
     </div>
   );
 };

export default PromotionManagement;
