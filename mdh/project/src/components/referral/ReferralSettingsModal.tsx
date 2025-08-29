import React, { useState, useEffect } from 'react';
import { X, Save, Settings, Percent, DollarSign, Users, Calendar } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { toast } from 'react-hot-toast';

interface ReferralSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: any;
  onSave: () => void;
}

const ReferralSettingsModal: React.FC<ReferralSettingsModalProps> = ({
  isOpen,
  onClose,
  settings,
  onSave
}) => {
  const [formData, setFormData] = useState({
    is_active: true,
    reward_type: 'percentage',
    reward_value: 10.00,
    reward_currency: 'TRY',
    referrer_reward_type: 'percentage',
    referrer_reward_value: 5.00,
    referee_reward_type: 'percentage',
    referee_reward_value: 5.00,
    minimum_purchase_amount: 0.00,
    maximum_rewards_per_referrer: -1, // Sınırsız
    referral_code_length: 8
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (settings) {
      setFormData(settings);
    }
  }, [settings]);

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from('referral_settings')
        .upsert([formData], { onConflict: 'id' });

      if (error) throw error;

      toast.success('Referans programı ayarları güncellendi!');
      onSave();
      onClose();
    } catch (error: any) {
      toast.error('Ayarlar güncellenirken hata oluştu: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-3">
            <Settings className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              Referans Programı Ayarları
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
          {/* Program Durumu */}
          <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <div className="flex items-center space-x-3">
              <div className={`w-3 h-3 rounded-full ${formData.is_active ? 'bg-green-500' : 'bg-red-500'}`} />
              <span className="font-medium text-gray-900 dark:text-white">
                Program Durumu
              </span>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={formData.is_active}
                onChange={(e) => handleInputChange('is_active', e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
            </label>
          </div>

          {/* Ödül Ayarları */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Referans Eden Ödülü */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white flex items-center space-x-2">
                <Users className="w-5 h-5 text-blue-600" />
                <span>Referans Eden Ödülü</span>
              </h3>
              
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Ödül Tipi
                  </label>
                  <select
                    value={formData.referrer_reward_type}
                    onChange={(e) => handleInputChange('referrer_reward_type', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  >
                    <option value="percentage">Yüzde (%)</option>
                    <option value="fixed_amount">Sabit Tutar</option>
                    <option value="points">Puan</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Ödül Değeri
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      step="0.01"
                      value={formData.referrer_reward_value}
                      onChange={(e) => handleInputChange('referrer_reward_value', parseFloat(e.target.value))}
                      className="w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                    />
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      {formData.referrer_reward_type === 'percentage' ? (
                        <Percent className="w-4 h-4 text-gray-400" />
                      ) : (
                        <DollarSign className="w-4 h-4 text-gray-400" />
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Referans Edilen Ödülü */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white flex items-center space-x-2">
                <Users className="w-5 h-5 text-green-600" />
                <span>Referans Edilen Ödülü</span>
              </h3>
              
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Ödül Tipi
                  </label>
                  <select
                    value={formData.referee_reward_type}
                    onChange={(e) => handleInputChange('referee_reward_type', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  >
                    <option value="percentage">Yüzde (%)</option>
                    <option value="fixed_amount">Sabit Tutar</option>
                    <option value="points">Puan</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Ödül Değeri
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      step="0.01"
                      value={formData.referee_reward_value}
                      onChange={(e) => handleInputChange('referee_reward_value', parseFloat(e.target.value))}
                      className="w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                    />
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      {formData.referee_reward_type === 'percentage' ? (
                        <Percent className="w-4 h-4 text-gray-400" />
                      ) : (
                        <DollarSign className="w-4 h-4 text-gray-400" />
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Diğer Ayarlar */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Minimum Satın Alma Tutarı
              </label>
              <div className="relative">
                <input
                  type="number"
                  step="0.01"
                  value={formData.minimum_purchase_amount}
                  onChange={(e) => handleInputChange('minimum_purchase_amount', parseFloat(e.target.value))}
                  className="w-full pl-8 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                />
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <DollarSign className="w-4 h-4 text-gray-400" />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Maksimum Referans Sayısı
              </label>
              <div className="flex items-center space-x-3">
                <input
                  type="number"
                  value={formData.maximum_rewards_per_referrer === -1 ? '' : formData.maximum_rewards_per_referrer}
                  onChange={(e) => handleInputChange('maximum_rewards_per_referrer', e.target.value === '' ? -1 : parseInt(e.target.value))}
                  placeholder="-1 = Sınırsız"
                  className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                />
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  {formData.maximum_rewards_per_referrer === -1 ? 'Sınırsız' : 'Adet'}
                </span>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Referans Kodu Uzunluğu
              </label>
              <input
                type="number"
                min="4"
                max="12"
                value={formData.referral_code_length}
                onChange={(e) => handleInputChange('referral_code_length', parseInt(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
              />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end space-x-3 p-6 border-t border-gray-200 dark:border-gray-700">
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
        </div>
      </div>
    </div>
  );
};

export default ReferralSettingsModal;
