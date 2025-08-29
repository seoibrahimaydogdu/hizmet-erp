import React, { useState } from 'react';
import { 
  Star, 
  Plus, 
  Edit, 
  Trash2, 
  Copy, 
  CheckCircle,
  Users,
  DollarSign,
  Eye,
  X
} from 'lucide-react';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';
import { formatCurrency } from '../../lib/currency';
import { supabase } from '../../lib/supabase';
import { toast } from 'react-hot-toast';

interface ReferralCodesProps {
  referralCodes: any[];
  customers: any[];
  onRefresh: () => void;
  onEditCode: (code: any) => void;
  onViewCode: (code: any) => void;
}

const ReferralCodes: React.FC<ReferralCodesProps> = ({ 
  referralCodes, 
  customers, 
  onRefresh, 
  onEditCode,
  onViewCode
}) => {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState('');
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [loadingStates, setLoadingStates] = useState<{[key: string]: boolean}>({});

  const copyToClipboard = async (text: string, codeId: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedCode(codeId);
      toast.success('Kod kopyalandı!');
      setTimeout(() => setCopiedCode(null), 2000);
    } catch (error) {
      toast.error('Kopyalama başarısız');
    }
  };

  const createReferralCode = async () => {
    if (!selectedCustomer) {
      toast.error('Lütfen müşteri seçin');
      return;
    }

    setLoadingStates(prev => ({ ...prev, create: true }));

    try {
      const { data, error } = await supabase
        .rpc('create_referral_code_for_customer', {
          customer_uuid: selectedCustomer
        });

      if (error) throw error;

      toast.success('Referans kodu oluşturuldu!');
      setShowCreateModal(false);
      setSelectedCustomer('');
      onRefresh();
    } catch (error) {
      console.error('Referans kodu oluşturma hatası:', error);
      toast.error('Referans kodu oluşturulamadı');
    } finally {
      setLoadingStates(prev => ({ ...prev, create: false }));
    }
  };

  const deleteReferralCode = async (codeId: string) => {
    if (!confirm('Bu referans kodunu silmek istediğinizden emin misiniz?')) {
      return;
    }

    setLoadingStates(prev => ({ ...prev, [`delete_${codeId}`]: true }));

    try {
      const { error } = await supabase
        .from('referral_codes')
        .delete()
        .eq('id', codeId);

      if (error) throw error;

      toast.success('Referans kodu silindi');
      onRefresh();
    } catch (error) {
      console.error('Referans kodu silme hatası:', error);
      toast.error('Referans kodu silinirken hata oluştu');
    } finally {
      setLoadingStates(prev => ({ ...prev, [`delete_${codeId}`]: false }));
    }
  };

  const toggleCodeStatus = async (codeId: string, currentStatus: boolean) => {
    setLoadingStates(prev => ({ ...prev, [`toggle_${codeId}`]: true }));

    try {
      const { error } = await supabase
        .from('referral_codes')
        .update({ is_active: !currentStatus })
        .eq('id', codeId);

      if (error) throw error;

      toast.success(`Kod ${!currentStatus ? 'aktif' : 'pasif'} hale getirildi`);
      onRefresh();
    } catch (error) {
      console.error('Kod durumu güncelleme hatası:', error);
      toast.error('Kod durumu güncellenirken hata oluştu');
    } finally {
      setLoadingStates(prev => ({ ...prev, [`toggle_${codeId}`]: false }));
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            Referans Kodları
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            Müşterilerin referans kodlarını yönetin
          </p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center"
        >
          <Plus className="w-4 h-4 mr-2" />
          Yeni Kod
        </button>
      </div>

      {/* Codes Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {referralCodes.map((code) => (
          <div key={code.id} className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center space-x-2">
                <Star className={`w-5 h-5 ${code.is_active ? 'text-yellow-500' : 'text-gray-400'}`} />
                <span className={`inline-flex items-center px-2 py-1 text-xs font-semibold rounded-full ${
                  code.is_active 
                    ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
                    : 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400'
                }`}>
                  {code.is_active ? 'Aktif' : 'Pasif'}
                </span>
              </div>
              <div className="flex items-center space-x-1">
                <button
                  onClick={() => onViewCode(code)}
                  className="p-1 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400"
                  title="Görüntüle"
                >
                  <Eye className="w-4 h-4" />
                </button>
                <button
                  onClick={() => onEditCode(code)}
                  className="p-1 text-gray-400 hover:text-green-600 dark:hover:text-green-400"
                  title="Düzenle"
                >
                  <Edit className="w-4 h-4" />
                </button>
                <button
                  onClick={() => deleteReferralCode(code.id)}
                  disabled={loadingStates[`delete_${code.id}`]}
                  className="p-1 text-gray-400 hover:text-red-600 dark:hover:text-red-400 disabled:opacity-50 disabled:cursor-not-allowed"
                  title="Sil"
                >
                  {loadingStates[`delete_${code.id}`] ? (
                    <div className="w-4 h-4 border-2 border-red-600 border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Trash2 className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            <div className="space-y-3">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Referans Kodu</p>
                <div className="flex items-center space-x-2">
                  <span className="text-lg font-mono font-bold text-blue-600 dark:text-blue-400">
                    {code.code}
                  </span>
                  <button
                    onClick={() => copyToClipboard(code.code, code.id)}
                    className={`p-1 rounded transition-colors ${
                      copiedCode === code.id 
                        ? 'bg-green-100 text-green-600 dark:bg-green-900/20 dark:text-green-400' 
                        : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'
                    }`}
                  >
                    {copiedCode === code.id ? <CheckCircle className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Müşteri</p>
                <p className="font-medium text-gray-900 dark:text-white">
                  {code.customer?.name || 'Bilinmeyen'}
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {code.customer?.email || 'E-posta yok'}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                                 <div>
                   <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Kullanım</p>
                   <p className="font-semibold text-gray-900 dark:text-white">
                     {code.usage_count} / Sınırsız
                   </p>
                 </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Kazanç</p>
                  <p className="font-semibold text-green-600">
                    {formatCurrency(code.total_earnings)}
                  </p>
                </div>
              </div>

              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Oluşturulma</p>
                <p className="text-sm text-gray-900 dark:text-white">
                  {format(new Date(code.created_at), 'dd MMM yyyy', { locale: tr })}
                </p>
              </div>

              <div className="flex space-x-2 pt-2">
                <button
                  onClick={() => toggleCodeStatus(code.id, code.is_active)}
                  disabled={loadingStates[`toggle_${code.id}`]}
                  className={`flex-1 px-3 py-2 text-sm rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                    code.is_active
                      ? 'bg-red-100 text-red-700 hover:bg-red-200 dark:bg-red-900/20 dark:text-red-400 dark:hover:bg-red-900/40'
                      : 'bg-green-100 text-green-700 hover:bg-green-200 dark:bg-green-900/20 dark:text-green-400 dark:hover:bg-green-900/40'
                  }`}
                >
                  {loadingStates[`toggle_${code.id}`] ? (
                    <div className="flex items-center justify-center">
                      <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-2" />
                      {code.is_active ? 'Pasifleştiriliyor...' : 'Aktifleştiriliyor...'}
                    </div>
                  ) : (
                    code.is_active ? 'Pasifleştir' : 'Aktifleştir'
                  )}
                </button>
                <button
                  onClick={() => onViewCode(code)}
                  className="px-3 py-2 text-sm bg-blue-100 text-blue-700 hover:bg-blue-200 dark:bg-blue-900/20 dark:text-blue-400 dark:hover:bg-blue-900/40 rounded-lg transition-colors"
                  title="Detayları Görüntüle"
                >
                  <Eye className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {referralCodes.length === 0 && (
        <div className="text-center py-12">
          <Star className="w-16 h-16 mx-auto mb-4 text-gray-300" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            Henüz Referans Kodu Yok
          </h3>
          <p className="text-gray-500 dark:text-gray-400 mb-4">
            Müşteriler için referans kodları oluşturmaya başlayın.
          </p>
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            İlk Kodu Oluştur
          </button>
        </div>
      )}

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-md w-full mx-4">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Yeni Referans Kodu
                </h3>
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Müşteri Seçin
                  </label>
                  <select
                    value={selectedCustomer}
                    onChange={(e) => setSelectedCustomer(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  >
                    <option value="">Müşteri seçin...</option>
                    {customers.map((customer) => (
                      <option key={customer.id} value={customer.id}>
                        {customer.name} ({customer.email})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    onClick={() => setShowCreateModal(false)}
                    className="px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                  >
                    İptal
                  </button>
                  <button
                    onClick={createReferralCode}
                    disabled={loadingStates.create}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center"
                  >
                    {loadingStates.create ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                        Oluşturuluyor...
                      </>
                    ) : (
                      'Oluştur'
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReferralCodes;
