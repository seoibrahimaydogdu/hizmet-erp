import React, { useState, useEffect } from 'react';
import { X, Save, Star, Users, DollarSign, Calendar, ToggleLeft, ToggleRight } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { toast } from 'react-hot-toast';

interface ReferralCodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  code: any;
  onSave: () => void;
  mode?: 'view' | 'edit';
}

const ReferralCodeModal: React.FC<ReferralCodeModalProps> = ({
  isOpen,
  onClose,
  code,
  onSave,
  mode = 'edit'
}) => {
     const [formData, setFormData] = useState({
     code: '',
     is_active: true,
     max_usage: -1, // Sınırsız
     customer_id: ''
   });
  const [loading, setLoading] = useState(false);
  const [customers, setCustomers] = useState<any[]>([]);

  useEffect(() => {
    fetchCustomers();
    if (code) {
             setFormData({
         code: code.code || '',
         is_active: code.is_active ?? true,
         max_usage: code.max_usage || -1, // Sınırsız
         customer_id: code.customer_id || ''
       });
    }
  }, [code]);

  const fetchCustomers = async () => {
    try {
      const { data, error } = await supabase
        .from('customers')
        .select('id, name, email')
        .order('name');

      if (error) throw error;
      setCustomers(data || []);
    } catch (error: any) {
      toast.error('Müşteriler yüklenirken hata oluştu: ' + error.message);
    }
  };

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSave = async () => {
    if (!formData.customer_id) {
      toast.error('Lütfen bir müşteri seçin');
      return;
    }

    setLoading(true);
    try {
      const updateData = {
        is_active: formData.is_active,
        max_usage: formData.max_usage
      };

      const { error } = await supabase
        .from('referral_codes')
        .update(updateData)
        .eq('id', code.id);

      if (error) throw error;

      toast.success('Referans kodu güncellendi!');
      onSave();
      onClose();
    } catch (error: any) {
      toast.error('Kod güncellenirken hata oluştu: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const selectedCustomer = customers.find(c => c.id === formData.customer_id);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-lg w-full mx-4">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-3">
            <Star className="w-6 h-6 text-yellow-600 dark:text-yellow-400" />
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              {mode === 'view' ? 'Referans Kodu Detayları' : 'Referans Kodu Düzenle'}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Kod Bilgisi */}
          <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Referans Kodu</p>
                <p className="text-lg font-mono font-bold text-gray-900 dark:text-white">
                  {formData.code}
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-600 dark:text-gray-400">Kullanım</p>
                                 <p className="text-lg font-bold text-blue-600 dark:text-blue-400">
                   {code?.usage_count || 0} / Sınırsız
                 </p>
              </div>
            </div>
          </div>

          {/* Müşteri Bilgisi */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Müşteri
            </label>
            <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3">
              {selectedCustomer ? (
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
                    <Users className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">
                      {selectedCustomer.name}
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {selectedCustomer.email}
                    </p>
                  </div>
                </div>
              ) : (
                <p className="text-gray-500 dark:text-gray-400">Müşteri bulunamadı</p>
              )}
            </div>
          </div>

          {/* Durum */}
          <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <div className="flex items-center space-x-3">
              <div className={`w-3 h-3 rounded-full ${formData.is_active ? 'bg-green-500' : 'bg-red-500'}`} />
              <span className="font-medium text-gray-900 dark:text-white">
                Kod Durumu
              </span>
            </div>
            {mode === 'edit' ? (
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.is_active}
                  onChange={(e) => handleInputChange('is_active', e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
              </label>
            ) : (
              <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                formData.is_active 
                  ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
                  : 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
              }`}>
                {formData.is_active ? 'Aktif' : 'Pasif'}
              </span>
            )}
          </div>

          {/* Maksimum Kullanım */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Maksimum Kullanım Sayısı
            </label>
            {mode === 'edit' ? (
                             <div className="flex items-center space-x-3">
                 <input
                   type="number"
                   min="-1"
                   value={formData.max_usage === -1 ? '' : formData.max_usage}
                   onChange={(e) => handleInputChange('max_usage', e.target.value === '' ? -1 : parseInt(e.target.value))}
                   placeholder="-1 = Sınırsız"
                   className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                 />
                 <span className="text-sm text-gray-500 dark:text-gray-400">
                   {formData.max_usage === -1 ? 'Sınırsız' : 'Adet'}
                 </span>
               </div>
            ) : (
                             <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3">
                 <p className="text-lg font-semibold text-gray-900 dark:text-white">
                   Sınırsız
                 </p>
               </div>
            )}
          </div>

          {/* İstatistikler */}
          {code && (
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
                <div className="flex items-center space-x-2">
                  <DollarSign className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Toplam Kazanç</p>
                    <p className="text-lg font-bold text-blue-600 dark:text-blue-400">
                      ₺{code.total_earnings || 0}
                    </p>
                  </div>
                </div>
              </div>
              <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4">
                <div className="flex items-center space-x-2">
                  <Calendar className="w-5 h-5 text-green-600 dark:text-green-400" />
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Oluşturulma</p>
                    <p className="text-sm font-medium text-green-600 dark:text-green-400">
                      {new Date(code.created_at).toLocaleDateString('tr-TR')}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end space-x-3 p-6 border-t border-gray-200 dark:border-gray-700">
          {mode === 'edit' ? (
            <>
              <button
                onClick={onClose}
                className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors"
              >
                İptal
              </button>
              <button
                onClick={handleSave}
                disabled={loading}
                className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <Save className="w-4 h-4" />
                <span>{loading ? 'Kaydediliyor...' : 'Kaydet'}</span>
              </button>
            </>
          ) : (
            <button
              onClick={onClose}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Kapat
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ReferralCodeModal;
