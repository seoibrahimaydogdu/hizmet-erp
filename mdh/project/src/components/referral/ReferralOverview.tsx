import React from 'react';
import { 
  Users, 
  TrendingUp, 
  DollarSign, 
  Percent,
  CheckCircle,
  Clock,
  Star,
  ArrowRight
} from 'lucide-react';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';
import { formatCurrency } from '../../lib/currency';

interface ReferralOverviewProps {
  stats: any;
  referralSettings: any;
  recentReferrals: any[];
}

const ReferralOverview: React.FC<ReferralOverviewProps> = ({ 
  stats, 
  referralSettings, 
  recentReferrals 
}) => {
  return (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Toplam Referans</p>
              <p className="text-2xl font-bold text-blue-600 mt-2">{stats.totalReferrals}</p>
              <p className="text-xs text-gray-500 mt-1">Tüm zamanlar</p>
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
              <p className="text-2xl font-bold text-green-600 mt-2">{stats.completedReferrals}</p>
              <p className="text-xs text-gray-500 mt-1">%{stats.conversionRate} dönüşüm</p>
            </div>
            <div className="bg-green-500 p-3 rounded-lg">
              <CheckCircle className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Toplam Kazanç</p>
              <p className="text-2xl font-bold text-purple-600 mt-2">
                {formatCurrency(stats.totalEarnings)}
              </p>
              <p className="text-xs text-gray-500 mt-1">Tamamlanan referanslar</p>
            </div>
            <div className="bg-purple-500 p-3 rounded-lg">
              <DollarSign className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Aktif Kodlar</p>
              <p className="text-2xl font-bold text-orange-600 mt-2">{stats.activeCodes}</p>
              <p className="text-xs text-gray-500 mt-1">Toplam {stats.totalCodes}</p>
            </div>
            <div className="bg-orange-500 p-3 rounded-lg">
              <Star className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>
      </div>

      {/* Program Settings Overview */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
          <TrendingUp className="w-5 h-5 mr-2 text-blue-600" />
          Program Ayarları
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600 dark:text-gray-400">Referans Ödülü</span>
              <span className="text-sm font-semibold text-green-600">
                %{referralSettings?.referrer_reward_value || 5}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600 dark:text-gray-400">Referee İndirimi</span>
              <span className="text-sm font-semibold text-blue-600">
                %{referralSettings?.referee_reward_value || 5}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600 dark:text-gray-400">Min. Alışveriş</span>
              <span className="text-sm font-semibold text-gray-900 dark:text-white">
                {formatCurrency(referralSettings?.minimum_purchase_amount || 0)}
              </span>
            </div>
          </div>
          
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600 dark:text-gray-400">Maks. Ödül</span>
              <span className="text-sm font-semibold text-orange-600">
                {referralSettings?.maximum_rewards_per_referrer || 10}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600 dark:text-gray-400">Kod Uzunluğu</span>
              <span className="text-sm font-semibold text-gray-900 dark:text-white">
                {referralSettings?.referral_code_length || 8} karakter
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600 dark:text-gray-400">Durum</span>
              <span className={`inline-flex items-center px-2 py-1 text-xs font-semibold rounded-full ${
                referralSettings?.is_active 
                  ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
                  : 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
              }`}>
                {referralSettings?.is_active ? 'Aktif' : 'Pasif'}
              </span>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600 dark:text-gray-400">Bekleyen</span>
              <span className="text-sm font-semibold text-yellow-600">
                {stats.pendingReferrals}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600 dark:text-gray-400">Dönüşüm Oranı</span>
              <span className="text-sm font-semibold text-purple-600">
                %{stats.conversionRate}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600 dark:text-gray-400">Ort. Kazanç</span>
              <span className="text-sm font-semibold text-gray-900 dark:text-white">
                {stats.completedReferrals > 0 
                  ? formatCurrency(stats.totalEarnings / stats.completedReferrals)
                  : formatCurrency(0)
                }
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Referrals */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
            <ArrowRight className="w-5 h-5 mr-2 text-green-600" />
            Son Referanslar
          </h3>
        </div>
        
        {recentReferrals.length === 0 ? (
          <div className="p-8 text-center">
            <Users className="w-16 h-16 mx-auto mb-4 text-gray-300" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              Henüz Referans Yok
            </h3>
            <p className="text-gray-500 dark:text-gray-400">
              Müşteriler referans kodlarını kullanmaya başladığında burada görünecek.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {recentReferrals.map((referral) => (
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
                      <p className="text-xs text-gray-400 dark:text-gray-500">
                        Referans eden: {referral.referrer?.name || 'Bilinmeyen'}
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
                    {referral.status === 'completed' && (
                      <div className="text-xs text-green-600 font-medium mt-1">
                        +{formatCurrency(referral.referrer_reward)}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ReferralOverview;
