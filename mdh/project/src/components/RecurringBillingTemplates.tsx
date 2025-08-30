import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Eye, Settings, Play, Pause } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { supabase } from '../lib/supabase';

interface RecurringTemplate {
  id: string;
  name: string;
  description: string;
  billing_cycle: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly';
  amount: number;
  currency: string;
  tax_rate: number;
  auto_generate: boolean;
  is_active: boolean;
  created_at: string;
}

export default function RecurringBillingTemplates() {
  const [templates, setTemplates] = useState<RecurringTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<RecurringTemplate | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    billing_cycle: 'monthly' as const,
    amount: 0,
    currency: 'TRY',
    tax_rate: 0,
    auto_generate: true
  });

  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = async () => {
    try {
      const { data, error } = await supabase
        .from('recurring_invoice_templates')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setTemplates(data || []);
    } catch (error) {
      toast.error('Şablonlar yüklenirken hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      if (editingTemplate) {
        const { error } = await supabase
          .from('recurring_invoice_templates')
          .update(formData)
          .eq('id', editingTemplate.id);

        if (error) throw error;
        toast.success('Şablon güncellendi');
      } else {
        const { error } = await supabase
          .from('recurring_invoice_templates')
          .insert([formData]);

        if (error) throw error;
        toast.success('Şablon oluşturuldu');
      }

      setShowForm(false);
      setEditingTemplate(null);
      resetForm();
      loadTemplates();
    } catch (error) {
      toast.error('İşlem sırasında hata oluştu');
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      billing_cycle: 'monthly',
      amount: 0,
      currency: 'TRY',
      tax_rate: 0,
      auto_generate: true
    });
  };

  const editTemplate = (template: RecurringTemplate) => {
    setEditingTemplate(template);
    setFormData({
      name: template.name,
      description: template.description,
      billing_cycle: template.billing_cycle,
      amount: template.amount,
      currency: template.currency,
      tax_rate: template.tax_rate,
      auto_generate: template.auto_generate
    });
    setShowForm(true);
  };

  const toggleStatus = async (template: RecurringTemplate) => {
    try {
      const { error } = await supabase
        .from('recurring_invoice_templates')
        .update({ is_active: !template.is_active })
        .eq('id', template.id);

      if (error) throw error;
      toast.success('Durum güncellendi');
      loadTemplates();
    } catch (error) {
      toast.error('Durum güncellenirken hata oluştu');
    }
  };

  const deleteTemplate = async (id: string) => {
    if (!confirm('Bu şablonu silmek istediğinizden emin misiniz?')) return;

    try {
      const { error } = await supabase
        .from('recurring_invoice_templates')
        .delete()
        .eq('id', id);

      if (error) throw error;
      toast.success('Şablon silindi');
      loadTemplates();
    } catch (error) {
      toast.error('Şablon silinirken hata oluştu');
    }
  };

  const getBillingCycleText = (cycle: string) => {
    const cycles = {
      daily: 'Günlük',
      weekly: 'Haftalık',
      monthly: 'Aylık',
      quarterly: '3 Aylık',
      yearly: 'Yıllık'
    };
    return cycles[cycle as keyof typeof cycles] || cycle;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
          Tekrarlayan Fatura Şablonları
        </h2>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center space-x-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>Yeni Şablon</span>
        </button>
      </div>

      {showForm && (
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-medium mb-4">
            {editingTemplate ? 'Şablon Düzenle' : 'Yeni Şablon'}
          </h3>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Şablon Adı
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Fatura Döngüsü
                </label>
                <select
                  value={formData.billing_cycle}
                  onChange={(e) => setFormData({...formData, billing_cycle: e.target.value as any})}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                >
                  <option value="daily">Günlük</option>
                  <option value="weekly">Haftalık</option>
                  <option value="monthly">Aylık</option>
                  <option value="quarterly">3 Aylık</option>
                  <option value="yearly">Yıllık</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Tutar
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.amount}
                  onChange={(e) => setFormData({...formData, amount: parseFloat(e.target.value)})}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Para Birimi
                </label>
                <select
                  value={formData.currency}
                  onChange={(e) => setFormData({...formData, currency: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                >
                  <option value="TRY">TRY</option>
                  <option value="USD">USD</option>
                  <option value="EUR">EUR</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  KDV Oranı (%)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.tax_rate}
                  onChange={(e) => setFormData({...formData, tax_rate: parseFloat(e.target.value)})}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                />
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="auto_generate"
                  checked={formData.auto_generate}
                  onChange={(e) => setFormData({...formData, auto_generate: e.target.checked})}
                  className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                />
                <label htmlFor="auto_generate" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Otomatik Oluştur
                </label>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Açıklama
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
              />
            </div>

            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => {
                  setShowForm(false);
                  setEditingTemplate(null);
                  resetForm();
                }}
                className="px-4 py-2 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                İptal
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
              >
                {editingTemplate ? 'Güncelle' : 'Oluştur'}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {templates.map((template) => (
          <div key={template.id} className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                  {template.name}
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {getBillingCycleText(template.billing_cycle)}
                </p>
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() => toggleStatus(template)}
                  className={`p-1 rounded ${template.is_active ? 'text-green-600 hover:text-green-700' : 'text-gray-400 hover:text-gray-600'}`}
                >
                  {template.is_active ? <Play className="w-4 h-4" /> : <Pause className="w-4 h-4" />}
                </button>
                <button
                  onClick={() => editTemplate(template)}
                  className="p-1 text-blue-600 hover:text-blue-700 rounded"
                >
                  <Edit className="w-4 h-4" />
                </button>
                <button
                  onClick={() => deleteTemplate(template.id)}
                  className="p-1 text-red-600 hover:text-red-700 rounded"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            <p className="text-gray-600 dark:text-gray-300 text-sm mb-4">
              {template.description}
            </p>

            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-gray-500 dark:text-gray-400">Tutar:</span>
                <span className="text-sm font-medium text-gray-900 dark:text-white">
                  {template.amount} {template.currency}
                </span>
              </div>
              {template.tax_rate > 0 && (
                <div className="flex justify-between">
                  <span className="text-sm text-gray-500 dark:text-gray-400">KDV:</span>
                  <span className="text-sm font-medium text-gray-900 dark:text-white">
                    %{template.tax_rate}
                  </span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-sm text-gray-500 dark:text-gray-400">Otomatik:</span>
                <span className={`text-sm font-medium ${template.auto_generate ? 'text-green-600' : 'text-gray-500'}`}>
                  {template.auto_generate ? 'Evet' : 'Hayır'}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {templates.length === 0 && !loading && (
        <div className="text-center py-12">
          <Settings className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            Henüz şablon yok
          </h3>
          <p className="text-gray-500 dark:text-gray-400 mb-4">
            İlk tekrarlayan fatura şablonunuzu oluşturun
          </p>
          <button
            onClick={() => setShowForm(true)}
            className="inline-flex items-center space-x-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>İlk Şablonu Oluştur</span>
          </button>
        </div>
      )}
    </div>
  );
}
