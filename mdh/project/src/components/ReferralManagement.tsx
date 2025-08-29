import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Plus, 
  Settings, 
  TrendingUp, 
  DollarSign, 
  Percent,
  Eye,
  Edit,
  Trash2,
  Copy,
  CheckCircle,
  AlertTriangle,
  Calendar,
  Clock,
  Star,
  ArrowRight,
  X
} from 'lucide-react';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';
import { formatCurrency } from '../lib/currency';
import { supabase } from '../lib/supabase';
import { toast } from 'react-hot-toast';
import ReferralOverview from './referral/ReferralOverview';
import ReferralCodes from './referral/ReferralCodes';
import ReferralList from './referral/ReferralList';
import ReferralSettingsModal from './referral/ReferralSettingsModal';
import ReferralCodeModal from './referral/ReferralCodeModal';

interface ReferralManagementProps {
  onBack?: () => void;
}

const ReferralManagement: React.FC<ReferralManagementProps> = ({ onBack }) => {
  const [referralSettings, setReferralSettings] = useState<any>(null);
  const [referralCodes, setReferralCodes] = useState<any[]>([]);
  const [referrals, setReferrals] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'codes' | 'referrals' | 'settings'>('overview');
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showCodeModal, setShowCodeModal] = useState(false);
  const [selectedCode, setSelectedCode] = useState<any>(null);
  const [codeModalMode, setCodeModalMode] = useState<'view' | 'edit'>('edit');

  useEffect(() => {
    fetchData();
    
    // Gerçek zamanlı güncellemeler için subscription
    const referralSubscription = supabase
      .channel('admin_referral_changes')
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'referral_codes'
        }, 
        (payload: any) => {
          console.log('Admin referral code change detected:', payload);
          fetchData();
        }
      )
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'referrals'
        }, 
        (payload: any) => {
          console.log('Admin referral change detected:', payload);
          fetchData();
        }
      )
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'referral_settings'
        }, 
        (payload: any) => {
          console.log('Admin referral settings change detected:', payload);
          fetchData();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(referralSubscription);
    };
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Referans ayarlarını getir
      const { data: settingsData, error: settingsError } = await supabase
        .from('referral_settings')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .limit(1);

      if (settingsError) throw settingsError;

      // Referans kodlarını getir
      const { data: codesData, error: codesError } = await supabase
        .from('referral_codes')
        .select(`
          *,
          customer:customers(name, email, phone)
        `)
        .order('created_at', { ascending: false });

      if (codesError) throw codesError;

      // Referansları getir
      const { data: referralsData, error: referralsError } = await supabase
        .from('referrals')
        .select(`
          *,
          referrer:customers!referrals_referrer_id_fkey(name, email),
          referee:customers!referrals_referee_id_fkey(name, email),
          referral_code:referral_codes(code)
        `)
        .order('created_at', { ascending: false });

      if (referralsError) throw referralsError;

      // Müşterileri getir
      const { data: customersData, error: customersError } = await supabase
        .from('customers')
        .select('*')
        .order('created_at', { ascending: false });

      if (customersError) throw customersError;

      // Eğer hiç ayar yoksa varsayılan ayar oluştur
      if (!settingsData || settingsData.length === 0) {
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

        try {
          const { data: newSettings, error: createError } = await supabase
            .from('referral_settings')
            .insert([defaultSettings])
            .select()
            .single();

          if (createError) throw createError;
          setReferralSettings(newSettings);
        } catch (createError) {
          console.error('Varsayılan ayar oluşturma hatası:', createError);
          // Hata durumunda null olarak devam et
          setReferralSettings(null);
        }
      } else {
        setReferralSettings(settingsData[0]);
      }
      setReferralCodes(codesData || []);
      setReferrals(referralsData || []);
      setCustomers(customersData || []);

    } catch (error) {
      console.error('Veri yükleme hatası:', error);
      console.error('Hata detayları:', {
        message: error.message,
        code: error.code,
        details: error.details,
        hint: error.hint
      });
      toast.error(`Veriler yüklenirken hata oluştu. Lütfen sayfayı yenileyin.`);
    } finally {
      setLoading(false);
    }
  };

  const getReferralStats = () => {
    const totalReferrals = referrals.length;
    const completedReferrals = referrals.filter(r => r.status === 'completed').length;
    const pendingReferrals = referrals.filter(r => r.status === 'pending').length;
    const totalEarnings = referrals
      .filter(r => r.status === 'completed')
      .reduce((sum, r) => sum + (parseFloat(r.referrer_reward) || 0), 0);
    const activeCodes = referralCodes.filter(c => c.is_active).length;
    const totalCodes = referralCodes.length;

    return {
      totalReferrals,
      completedReferrals,
      pendingReferrals,
      totalEarnings,
      activeCodes,
      totalCodes,
      conversionRate: totalReferrals > 0 ? Math.round((completedReferrals / totalReferrals) * 100) : 0
    };
  };

  const stats = getReferralStats();

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
            {onBack && (
              <button
                onClick={onBack}
                className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                <ArrowRight className="w-5 h-5 rotate-180" />
              </button>
            )}
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">
              Referans Programı Yönetimi
            </h1>
          </div>
          <button
            onClick={() => setShowSettingsModal(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center"
          >
            <Settings className="w-4 h-4 mr-2" />
            Ayarlar
          </button>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-3">
        <div className="flex space-x-6">
          <button
            onClick={() => setActiveTab('overview')}
            className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeTab === 'overview'
                ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700'
            }`}
          >
            <TrendingUp className="w-4 h-4" />
            <span>Genel Bakış</span>
          </button>
          
          <button
            onClick={() => setActiveTab('codes')}
            className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeTab === 'codes'
                ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700'
            }`}
          >
            <Star className="w-4 h-4" />
            <span>Referans Kodları</span>
            <span className="px-2 py-0.5 text-xs bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300 rounded-full">
              {stats.activeCodes}
            </span>
          </button>
          
          <button
            onClick={() => setActiveTab('referrals')}
            className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeTab === 'referrals'
                ? 'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Referanslar</span>
            <span className="px-2 py-0.5 text-xs bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300 rounded-full">
              {stats.totalReferrals}
            </span>
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="p-6">
        {activeTab === 'overview' && (
          <ReferralOverview 
            stats={stats} 
            referralSettings={referralSettings}
            recentReferrals={referrals.slice(0, 5)}
          />
        )}

        {activeTab === 'codes' && (
          <ReferralCodes 
            referralCodes={referralCodes}
            customers={customers}
            onRefresh={fetchData}
            onEditCode={(code) => {
              setSelectedCode(code);
              setCodeModalMode('edit');
              setShowCodeModal(true);
            }}
            onViewCode={(code) => {
              setSelectedCode(code);
              setCodeModalMode('view');
              setShowCodeModal(true);
            }}
          />
        )}

        {activeTab === 'referrals' && (
          <ReferralList 
            referrals={referrals}
            onRefresh={fetchData}
          />
        )}
      </div>

      {/* Settings Modal */}
      {showSettingsModal && (
        <ReferralSettingsModal
          isOpen={showSettingsModal}
          settings={referralSettings}
          onClose={() => setShowSettingsModal(false)}
          onSave={async () => {
            try {
              // ReferralSettingsModal kendi içinde kaydetme işlemini yapıyor
              // Burada sadece verileri yeniden yüklüyoruz
              await fetchData();
            } catch (error) {
              console.error('Ayar güncelleme hatası:', error);
              toast.error('Ayarlar güncellenirken hata oluştu');
            }
          }}
        />
      )}

      {/* Code Modal */}
      {showCodeModal && selectedCode && (
        <ReferralCodeModal
          isOpen={showCodeModal}
          code={selectedCode}
          mode={codeModalMode}
          onClose={() => {
            setShowCodeModal(false);
            setSelectedCode(null);
          }}
          onSave={async () => {
            try {
              await fetchData();
            } catch (error) {
              console.error('Kod güncelleme hatası:', error);
              toast.error('Kod güncellenirken hata oluştu');
            }
          }}
        />
      )}
    </div>
  );
};

export default ReferralManagement;
