import React, { useState, useEffect } from 'react';
import { 
  Tag, 
  Percent, 
  DollarSign, 
  Calendar, 
  Clock, 
  CheckCircle, 
  XCircle, 
  AlertTriangle,
  Copy,
  Share2,
  Users,
  TrendingUp,
  Gift,
  Star,
  ArrowRight,
  ArrowLeft
} from 'lucide-react';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';
import { formatCurrency } from '../lib/currency';
import { supabase } from '../lib/supabase';
import { toast } from 'react-hot-toast';

interface CustomerPromotionsProps {
  customerData: any;
  onBack: () => void;
}

const CustomerPromotions: React.FC<CustomerPromotionsProps> = ({ customerData, onBack }) => {
  const [promotions, setPromotions] = useState<any[]>([]);
  const [referralData, setReferralData] = useState<any>(null);
  const [referralSettings, setReferralSettings] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'promotions' | 'referral'>('referral');
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
    
    // Gerçek zamanlı güncellemeler için subscription
    const referralSubscription = supabase
      .channel('customer_referral_changes')
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'referral_codes',
          filter: `customer_id=eq.${customerData.id}`
        }, 
        (payload: any) => {
          console.log('Referral code change detected:', payload);
          fetchData();
        }
      )
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'referrals',
          filter: `referrer_id=eq.${customerData.id}`
        }, 
        (payload: any) => {
          console.log('Referral change detected:', payload);
          fetchData();
        }
      )
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'promotions'
        }, 
        (payload: any) => {
          console.log('Promotion change detected:', payload);
          fetchData();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(referralSubscription);
    };
  }, [customerData]);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Aktif promosyonları getir
      const { data: promotionsData, error: promotionsError } = await supabase
        .from('promotions')
        .select('*')
        .eq('is_active', true)
        .gte('end_date', new Date().toISOString())
        .order('created_at', { ascending: false });

      if (promotionsError) {
        console.warn('Promosyon verileri yüklenirken hata:', promotionsError);
        // Promosyon hatası kritik değil, devam et
      }

      // Referans verilerini getir
      const { data: referralCodeData, error: referralCodeError } = await supabase
        .from('referral_codes')
        .select('*')
        .eq('customer_id', customerData.id)
        .eq('is_active', true)
        .single();

      if (referralCodeError && referralCodeError.code !== 'PGRST116') {
        console.warn('Referans kodu verileri yüklenirken hata:', referralCodeError);
        // Referans kodu hatası kritik değil, devam et
      }

      // Referans ayarlarını getir
      const { data: settingsData, error: settingsError } = await supabase
        .from('referral_settings')
        .select('*')
        .eq('is_active', true)
        .single();

      if (settingsError) {
        console.warn('Referans ayarları yüklenirken hata:', settingsError);
        // Varsayılan ayarları kullan
                 const defaultSettings = {
           is_active: true,
           reward_type: 'percentage',
           reward_value: 10.00,
           reward_currency: 'TRY',
           referrer_reward_type: 'percentage',
           referrer_reward_value: 10.00,
           referee_reward_type: 'percentage',
           referee_reward_value: 10.00,
           minimum_purchase_amount: 0.00,
           maximum_rewards_per_referrer: -1, // Sınırsız
           referral_code_length: 8
         };
        setReferralSettings(defaultSettings);
      } else {
        setReferralSettings(settingsData);
      }

      // Referans istatistiklerini getir
      let referralStats = null;
      if (referralCodeData) {
        try {
          const { data: referralsData, error: referralsError } = await supabase
            .from('referrals')
            .select(`
              *,
              referee:customers!referrals_referee_id_fkey(name, email)
            `)
            .eq('referrer_id', customerData.id);

          if (!referralsError && referralsData) {
            referralStats = {
              totalReferrals: referralsData.length,
              completedReferrals: referralsData.filter(r => r.status === 'completed').length,
              pendingReferrals: referralsData.filter(r => r.status === 'pending').length,
              totalEarnings: referralsData
                .filter(r => r.status === 'completed')
                .reduce((sum, r) => sum + (parseFloat(r.referrer_reward) || 0), 0),
              recentReferrals: referralsData.slice(0, 5)
            };
          }
        } catch (error) {
          console.warn('Referans istatistikleri yüklenirken hata:', error);
          // İstatistik hatası kritik değil, devam et
        }
      }

      setPromotions(promotionsData || []);
      setReferralData({
        code: referralCodeData,
        stats: referralStats
      });
      // setReferralSettings zaten yukarıda ayarlandı

    } catch (error) {
      console.error('Veri yükleme hatası:', error);
      // Kritik olmayan hatalar için toast gösterme
      // toast.error('Veriler yüklenirken hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = async (text: string, type: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedCode(type);
      toast.success(`${type === 'code' ? 'Referans kodu' : 'Link'} kopyalandı!`);
      setTimeout(() => setCopiedCode(null), 2000);
    } catch (error) {
      toast.error('Kopyalama başarısız');
    }
  };

  const shareReferral = async () => {
    if (!referralData?.code) return;

    const shareText = `🎉 ${customerData.name} size özel bir indirim kodu paylaşıyor!\n\n` +
      `Kod: ${referralData.code.code}\n` +
      `%${referralSettings?.referee_reward_value || 10} indirim kazanın!\n\n` +
      `Bu kodu kullanarak hem siz hem de arkadaşınız kazançlı çıkacaksınız! 🚀`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Özel İndirim Kodu',
          text: shareText,
          url: window.location.origin
        });
      } catch (error) {
        copyToClipboard(shareText, 'share');
      }
    } else {
      copyToClipboard(shareText, 'share');
    }
  };

  const [creatingCode, setCreatingCode] = useState(false);

  const createReferralCode = async () => {
    setCreatingCode(true);
    try {
      const { data, error } = await supabase
        .rpc('create_referral_code_for_customer', {
          customer_uuid: customerData.id
        });

      if (error) throw error;

      toast.success('Referans kodunuz oluşturuldu!');
      fetchData(); // Verileri yenile
    } catch (error) {
      console.error('Referans kodu oluşturma hatası:', error);
      toast.error('Referans kodu oluşturulamadı');
    } finally {
      setCreatingCode(false);
    }
  };

  const getPromotionStatus = (promotion: any) => {
    const now = new Date();
    const endDate = new Date(promotion.end_date);
    const daysUntilExpiry = Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    
    if (daysUntilExpiry <= 0) {
      return { status: 'expired', text: 'Süresi Doldu', color: 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400' };
    }
    
    if (daysUntilExpiry <= 7) {
      return { status: 'ending-soon', text: `${daysUntilExpiry} gün kaldı`, color: 'bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400' };
    }
    
    if (daysUntilExpiry <= 30) {
      return { status: 'ending-soon', text: 'Bitmek Üzere', color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400' };
    }
    
    return { status: 'active', text: 'Aktif', color: 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400' };
  };

  const formatDiscountValue = (type: string, value: number) => {
    if (type === 'percentage') {
      return `%${value}`;
    } else {
      return formatCurrency(value);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button
              onClick={onBack}
              className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">
              Promosyonlar & Referans Programı
            </h1>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-3">
        <div className="flex space-x-6">
          <button
            onClick={() => setActiveTab('promotions')}
            className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeTab === 'promotions'
                ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700'
            }`}
          >
            <Tag className="w-4 h-4" />
            <span>Promosyonlar</span>
            {promotions.length > 0 && (
              <span className="px-2 py-0.5 text-xs bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300 rounded-full">
                {promotions.length}
              </span>
            )}
          </button>
          
          <button
            onClick={() => setActiveTab('referral')}
            className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeTab === 'referral'
                ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Referans Programı</span>
            {referralData?.code && (
              <span className="px-2 py-0.5 text-xs bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300 rounded-full">
                Aktif
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="p-6">
        {activeTab === 'promotions' && (
          <div className="space-y-6">
            {/* Promosyon İstatistikleri */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Aktif Promosyon</p>
                    <p className="text-2xl font-bold text-blue-600 mt-2">{promotions.length}</p>
                    <p className="text-xs text-gray-500 mt-1">Kullanılabilir</p>
                  </div>
                  <div className="bg-blue-500 p-3 rounded-lg">
                    <Tag className="w-6 h-6 text-white" />
                  </div>
                </div>
              </div>

              <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Bitmek Üzere</p>
                    <p className="text-2xl font-bold text-orange-600 mt-2">
                      {promotions.filter(p => {
                        const daysLeft = Math.ceil((new Date(p.end_date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
                        return daysLeft <= 7 && daysLeft > 0;
                      }).length}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">7 gün içinde</p>
                  </div>
                  <div className="bg-orange-500 p-3 rounded-lg">
                    <Clock className="w-6 h-6 text-white" />
                  </div>
                </div>
              </div>

              <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Ortalama İndirim</p>
                    <p className="text-2xl font-bold text-green-600 mt-2">
                      {promotions.length > 0 
                        ? Math.round(promotions.reduce((sum, p) => sum + (parseFloat(p.discount_value) || 0), 0) / promotions.length)
                        : 0}%
                    </p>
                    <p className="text-xs text-gray-500 mt-1">Ortalama değer</p>
                  </div>
                  <div className="bg-green-500 p-3 rounded-lg">
                    <TrendingUp className="w-6 h-6 text-white" />
                  </div>
                </div>
              </div>
            </div>

            {/* Promosyon Listesi */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
              <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
                  <Gift className="w-5 h-5 mr-2 text-purple-600" />
                  Mevcut Promosyonlar
                </h2>
              </div>
              
              {promotions.length === 0 ? (
                <div className="p-8 text-center">
                  <Tag className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                    Henüz Promosyon Yok
                  </h3>
                  <p className="text-gray-500 dark:text-gray-400">
                    Şu anda aktif promosyon bulunmuyor. Yeni promosyonlar için takipte kalın!
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-gray-200 dark:divide-gray-700">
                  {promotions.map((promotion) => {
                    const status = getPromotionStatus(promotion);
                    const daysLeft = Math.ceil((new Date(promotion.end_date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
                    
                    return (
                      <div key={promotion.id} className="p-6 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center space-x-3 mb-2">
                              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                                {promotion.name}
                              </h3>
                              <span className={`inline-flex items-center px-2 py-1 text-xs font-semibold rounded-full ${status.color}`}>
                                {status.text}
                              </span>
                            </div>
                            
                            {promotion.description && (
                              <p className="text-gray-600 dark:text-gray-400 mb-3">
                                {promotion.description}
                              </p>
                            )}
                            
                            <div className="flex items-center space-x-6 text-sm">
                              <div className="flex items-center space-x-2">
                                {promotion.discount_type === 'percentage' ? (
                                  <Percent className="w-4 h-4 text-green-600" />
                                ) : (
                                  <DollarSign className="w-4 h-4 text-green-600" />
                                )}
                                <span className="font-semibold text-green-600">
                                  {formatDiscountValue(promotion.discount_type, promotion.discount_value)}
                                </span>
                                <span className="text-gray-500">İndirim</span>
                              </div>
                              
                              <div className="flex items-center space-x-2">
                                <Calendar className="w-4 h-4 text-gray-400" />
                                <span className="text-gray-500">
                                  Bitiş: {format(new Date(promotion.end_date), 'dd MMM yyyy', { locale: tr })}
                                </span>
                              </div>
                              
                              {daysLeft > 0 && (
                                <div className="flex items-center space-x-2">
                                  <Clock className="w-4 h-4 text-orange-400" />
                                  <span className="text-orange-600 font-medium">
                                    {daysLeft} gün kaldı
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>
                          
                          <div className="flex items-center space-x-2">
                            <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium">
                              Kullan
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'referral' && (
          <div className="space-y-6">
            {/* Referans Programı Başlığı */}
            <div className="bg-gradient-to-r from-green-600 to-emerald-600 rounded-xl p-6 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold mb-2 flex items-center">
                    <Users className="w-6 h-6 mr-2" />
                    Referans Programı
                  </h2>
                  <p className="text-green-100">
                    Arkadaşlarınızı davet edin, birlikte kazanın! Her referans için özel ödüller.
                  </p>
                  <div className="mt-3 flex items-center space-x-4 text-sm">
                    <div className="flex items-center space-x-1">
                      <CheckCircle className="w-4 h-4" />
                      <span>Anında Ödül</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <TrendingUp className="w-4 h-4" />
                      <span>Sınırsız Referans</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Gift className="w-4 h-4" />
                      <span>Özel İndirimler</span>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-3xl font-bold">
                    %{referralSettings?.referrer_reward_value || 10}
                  </div>
                  <div className="text-green-100 text-sm">Referans Ödülü</div>
                  <div className="text-xs text-green-200 mt-1">
                    + %{referralSettings?.referee_reward_value || 10} arkadaşınıza
                  </div>
                </div>
              </div>
            </div>

            {/* Referans Kodu Bölümü */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
                  <Star className="w-5 h-5 mr-2 text-yellow-600" />
                  Referans Kodunuz
                </h3>
                {!referralData?.code && (
                  <button
                    onClick={createReferralCode}
                    disabled={creatingCode}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm font-medium flex items-center"
                  >
                    {creatingCode ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                        Oluşturuluyor...
                      </>
                    ) : (
                      'Kod Oluştur'
                    )}
                  </button>
                )}
              </div>

              {referralData?.code ? (
                <div className="space-y-4">
                  <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Referans Kodunuz</p>
                        <div className="flex items-center space-x-3">
                          <span className="text-2xl font-bold text-blue-600 dark:text-blue-400 font-mono">
                            {referralData.code.code}
                          </span>
                          <button
                            onClick={() => copyToClipboard(referralData.code.code, 'code')}
                            className={`p-2 rounded-lg transition-colors ${
                              copiedCode === 'code' 
                                ? 'bg-green-100 text-green-600 dark:bg-green-900/20 dark:text-green-400' 
                                : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'
                            }`}
                          >
                            {copiedCode === 'code' ? <CheckCircle className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                          </button>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm text-gray-600 dark:text-gray-400">Kullanım</div>
                        <div className="text-lg font-bold text-gray-900 dark:text-white">
                          {referralData.code.usage_count} / {referralData.code.max_usage === -1 || referralData.code.max_usage === null ? 'Sınırsız' : referralData.code.max_usage}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex space-x-3">
                    <button
                      onClick={shareReferral}
                      className="flex-1 flex items-center justify-center space-x-2 px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                    >
                      <Share2 className="w-4 h-4" />
                      <span>Paylaş</span>
                    </button>
                    
                    <button
                      onClick={() => copyToClipboard(`${window.location.origin}?ref=${referralData.code.code}`, 'link')}
                      className={`flex items-center space-x-2 px-4 py-3 rounded-lg transition-colors ${
                        copiedCode === 'link'
                          ? 'bg-green-100 text-green-600 dark:bg-green-900/20 dark:text-green-400'
                          : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'
                      }`}
                    >
                      {copiedCode === 'link' ? <CheckCircle className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                      <span>Link Kopyala</span>
                    </button>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <Users className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                    Henüz Referans Kodunuz Yok
                  </h3>
                  <p className="text-gray-500 dark:text-gray-400 mb-4">
                    Referans kodunuzu oluşturarak arkadaşlarınızı davet edebilir ve ödüller kazanabilirsiniz.
                  </p>
                  <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-lg p-4 mb-4">
                    <div className="flex items-center justify-center space-x-2 text-green-600 dark:text-green-400">
                      <Gift className="w-5 h-5" />
                      <span className="font-medium">Her referans için %{referralSettings?.referrer_reward_value || 5} ödül kazanın!</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Referans İstatistikleri */}
            {referralData?.stats && (
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Toplam Referans</p>
                      <p className="text-2xl font-bold text-blue-600 mt-2">{referralData.stats.totalReferrals}</p>
                    </div>
                    <div className="bg-blue-500 p-3 rounded-lg">
                      <Users className="w-6 h-6 text-white" />
                    </div>
                  </div>
                </div>

                <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Tamamlanan</p>
                      <p className="text-2xl font-bold text-green-600 mt-2">{referralData.stats.completedReferrals}</p>
                    </div>
                    <div className="bg-green-500 p-3 rounded-lg">
                      <CheckCircle className="w-6 h-6 text-white" />
                    </div>
                  </div>
                </div>

                <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Bekleyen</p>
                      <p className="text-2xl font-bold text-orange-600 mt-2">{referralData.stats.pendingReferrals}</p>
                    </div>
                    <div className="bg-orange-500 p-3 rounded-lg">
                      <Clock className="w-6 h-6 text-white" />
                    </div>
                  </div>
                </div>

                <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Toplam Kazanç</p>
                      <p className="text-2xl font-bold text-purple-600 mt-2">
                        {formatCurrency(referralData.stats.totalEarnings)}
                      </p>
                    </div>
                    <div className="bg-purple-500 p-3 rounded-lg">
                      <TrendingUp className="w-6 h-6 text-white" />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Son Referanslar */}
            {referralData?.stats?.recentReferrals && referralData.stats.recentReferrals.length > 0 && (
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
                <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
                    <ArrowRight className="w-5 h-5 mr-2 text-green-600" />
                    Son Referanslarınız
                  </h3>
                </div>
                <div className="divide-y divide-gray-200 dark:divide-gray-700">
                  {referralData.stats.recentReferrals.map((referral: any) => (
                    <div key={referral.id} className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center">
                            <Users className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                          </div>
                          <div>
                            <p className="font-medium text-gray-900 dark:text-white">
                              {referral.referee?.name || 'Bilinmeyen Kullanıcı'}
                            </p>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                              {referral.referee?.email || 'E-posta bilgisi yok'}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <span className={`inline-flex items-center px-2 py-1 text-xs font-semibold rounded-full ${
                            referral.status === 'completed' 
                              ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
                              : referral.status === 'pending'
                              ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400'
                              : 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400'
                          }`}>
                            {referral.status === 'completed' ? 'Tamamlandı' : 
                             referral.status === 'pending' ? 'Bekliyor' : 'İptal'}
                          </span>
                          <div className="text-xs text-gray-500 mt-1">
                            {format(new Date(referral.created_at), 'dd MMM yyyy', { locale: tr })}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Program Kuralları */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                <AlertTriangle className="w-5 h-5 mr-2 text-orange-600" />
                Program Kuralları
              </h3>
              <div className="space-y-3 text-sm text-gray-600 dark:text-gray-400">
                <div className="flex items-start space-x-3">
                  <div className="w-2 h-2 bg-blue-600 rounded-full mt-2 flex-shrink-0"></div>
                  <p>Her referans için referans eden kişi %{referralSettings?.referrer_reward_value || 10} ödül kazanır.</p>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="w-2 h-2 bg-blue-600 rounded-full mt-2 flex-shrink-0"></div>
                  <p>Referans edilen kişi de %{referralSettings?.referee_reward_value || 10} indirim kazanır.</p>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="w-2 h-2 bg-blue-600 rounded-full mt-2 flex-shrink-0"></div>
                  <p>Minimum {formatCurrency(referralSettings?.minimum_purchase_amount || 600)} tutarında alışveriş yapılması gerekir.</p>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="w-2 h-2 bg-blue-600 rounded-full mt-2 flex-shrink-0"></div>
                  <p>Referans ekleme sayısında üst sınır yoktur, istediğiniz kadar referans ekleyebilirsiniz.</p>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="w-2 h-2 bg-blue-600 rounded-full mt-2 flex-shrink-0"></div>
                  <p>Referans kodunuz sınırsız kullanıma sahiptir.</p>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="w-2 h-2 bg-blue-600 rounded-full mt-2 flex-shrink-0"></div>
                  <p>Referans kodunuz {referralSettings?.referral_code_length || 8} karakter uzunluğundadır.</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CustomerPromotions;
