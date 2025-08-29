import React, { useState, useEffect, useRef } from 'react';
import { useSupabase } from '../hooks/useSupabase';
import { Search, Check, AlertCircle, Zap, Lightbulb } from 'lucide-react';
import toast from 'react-hot-toast';

interface SmartFormAssistantProps {
  formType: string;
  fields: FormField[];
  onFieldChange: (fieldName: string, value: string) => void;
  onFormSubmit?: (data: any) => void;
}

interface FormField {
  name: string;
  type: string;
  label: string;
  required?: boolean;
  autoComplete?: boolean;
  options?: string[];
  value?: string;
}

interface Suggestion {
  id: string;
  value: string;
  confidence: number;
  usage_count: number;
}

interface AutoFillRule {
  target_field: string;
  action_value: string;
  rule_name: string;
}

const SmartFormAssistant: React.FC<SmartFormAssistantProps> = ({
  formType,
  fields,
  onFieldChange,
  onFormSubmit
}) => {
  const { supabase } = useSupabase();
  const [suggestions, setSuggestions] = useState<Record<string, Suggestion[]>>({});
  const [showSuggestions, setShowSuggestions] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState<Record<string, boolean>>({});
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [autoFillHistory, setAutoFillHistory] = useState<Record<string, string[]>>({});
  const suggestionTimeoutRef = useRef<NodeJS.Timeout>();

  // Form verilerini güncelle
  const handleFieldChange = async (fieldName: string, value: string) => {
    setFormData(prev => ({ ...prev, [fieldName]: value }));
    onFieldChange(fieldName, value);

    // Akıllı önerileri getir
    if (value.length >= 2) {
      await getSuggestions(fieldName, value);
    } else {
      setSuggestions(prev => ({ ...prev, [fieldName]: [] }));
      setShowSuggestions(prev => ({ ...prev, [fieldName]: false }));
    }

    // Otomatik doldurma kurallarını kontrol et
    await checkAutoFillRules(fieldName, value);

    // Form geçmişini kaydet
    if (value.trim()) {
      await saveFormHistory(fieldName, value);
    }
  };

  // Akıllı önerileri getir
  const getSuggestions = async (fieldName: string, searchTerm: string) => {
    setLoading(prev => ({ ...prev, [fieldName]: true }));
    
    try {
      const { data, error } = await supabase.rpc('get_smart_suggestions', {
        p_field_type: fieldName,
        p_search_term: searchTerm
      });

      if (error) throw error;

      setSuggestions(prev => ({ 
        ...prev, 
        [fieldName]: data || [] 
      }));
      setShowSuggestions(prev => ({ 
        ...prev, 
        [fieldName]: (data || []).length > 0 
      }));
    } catch (error) {
      console.error('Error fetching suggestions:', error);
    } finally {
      setLoading(prev => ({ ...prev, [fieldName]: false }));
    }
  };

  // Otomatik doldurma kurallarını kontrol et
  const checkAutoFillRules = async (triggerField: string, triggerValue: string) => {
    try {
      const { data, error } = await supabase.rpc('auto_fill_form', {
        p_form_type: formType,
        p_trigger_field: triggerField,
        p_trigger_value: triggerValue
      });

      if (error) throw error;

      if (data) {
        const { target_field, action_value, rule_name } = data;
        
        // Otomatik doldurma önerisi göster
        toast.success(
          <div>
            <div className="font-semibold">Akıllı Öneri</div>
            <div className="text-sm">{rule_name}</div>
            <div className="text-sm text-gray-600">
              {target_field}: {action_value}
            </div>
          </div>,
          {
            duration: 4000,
            icon: <Zap className="w-4 h-4 text-blue-500" />
          }
        );

        // Kullanıcıya otomatik doldurma seçeneği sun
        if (confirm(`${target_field} alanını "${action_value}" olarak doldurmak ister misiniz?`)) {
          handleFieldChange(target_field, action_value);
        }
      }
    } catch (error) {
      console.error('Error checking auto-fill rules:', error);
    }
  };

  // Form geçmişini kaydet
  const saveFormHistory = async (fieldName: string, fieldValue: string) => {
    try {
      const { error } = await supabase.rpc('save_form_history', {
        p_user_id: null, // Şimdilik null, auth sistemi eklenince güncellenecek
        p_form_type: formType,
        p_field_name: fieldName,
        p_field_value: fieldValue
      });

      if (error) throw error;
    } catch (error) {
      console.error('Error saving form history:', error);
    }
  };

  // Öneriyi seç
  const selectSuggestion = (fieldName: string, suggestion: Suggestion) => {
    handleFieldChange(fieldName, suggestion.value);
    setShowSuggestions(prev => ({ ...prev, [fieldName]: false }));
    
    toast.success(`"${suggestion.value}" seçildi`, {
      icon: <Check className="w-4 h-4 text-green-500" />
    });
  };

  // Form validasyonu
  const validateForm = () => {
    const errors: Record<string, string> = {};

    fields.forEach(field => {
      const value = formData[field.name] || '';
      
      if (field.required && !value.trim()) {
        errors[field.name] = `${field.label} alanı zorunludur`;
      }

      if (field.type === 'email' && value && !/^[^@]+@[^@]+\.[^@]+$/.test(value)) {
        errors[field.name] = 'Geçerli bir e-posta adresi giriniz';
      }

      if (field.type === 'tel' && value && !/^[+]?[0-9\s-]{10,}$/.test(value)) {
        errors[field.name] = 'Geçerli bir telefon numarası giriniz';
      }
    });

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Form gönder
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (validateForm()) {
      if (onFormSubmit) {
        onFormSubmit(formData);
      }
      
      toast.success('Form başarıyla gönderildi!', {
        icon: <Check className="w-4 h-4 text-green-500" />
      });
    } else {
      toast.error('Lütfen hataları düzeltin', {
        icon: <AlertCircle className="w-4 h-4 text-red-500" />
      });
    }
  };

  // Akıllı ipuçları
  const getSmartTips = () => {
    const tips = [
      {
        icon: <Zap className="w-4 h-4" />,
        text: 'Email yazdığınızda şirket bilgileri otomatik doldurulur'
      },
      {
        icon: <Lightbulb className="w-4 h-4" />,
        text: 'Sık kullanılan değerler öneri olarak gösterilir'
      },
      {
        icon: <Check className="w-4 h-4" />,
        text: 'Form geçmişiniz kaydedilir ve gelecekte size yardımcı olur'
      }
    ];

    return tips;
  };

  return (
    <div className="space-y-6">
      {/* Akıllı İpuçları */}
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
        <div className="flex items-center gap-2 mb-3">
          <Lightbulb className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          <h3 className="font-semibold text-blue-900 dark:text-blue-100">Akıllı Form Asistanı</h3>
        </div>
        <div className="space-y-2">
          {getSmartTips().map((tip, index) => (
            <div key={index} className="flex items-center gap-2 text-sm text-blue-700 dark:text-blue-300">
              {tip.icon}
              <span>{tip.text}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        {fields.map((field) => (
          <div key={field.name} className="relative">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              {field.label}
              {field.required && <span className="text-red-500 ml-1">*</span>}
            </label>

            <div className="relative">
              {field.type === 'select' ? (
                <select
                  value={formData[field.name] || ''}
                  onChange={(e) => handleFieldChange(field.name, e.target.value)}
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    validationErrors[field.name] 
                      ? 'border-red-300 dark:border-red-600' 
                      : 'border-gray-300 dark:border-gray-600'
                  } bg-white dark:bg-gray-800 text-gray-900 dark:text-white`}
                >
                  <option value="">Seçiniz</option>
                  {field.options?.map((option) => (
                    <option key={option} value={option}>
                      {option.charAt(0).toUpperCase() + option.slice(1)}
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  type={field.type}
                  value={formData[field.name] || ''}
                  onChange={(e) => handleFieldChange(field.name, e.target.value)}
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    validationErrors[field.name] 
                      ? 'border-red-300 dark:border-red-600' 
                      : 'border-gray-300 dark:border-gray-600'
                  } bg-white dark:bg-gray-800 text-gray-900 dark:text-white`}
                  placeholder={`${field.label} giriniz`}
                />
              )}

              {/* Loading indicator */}
              {loading[field.name] && (
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                </div>
              )}

              {/* Suggestions dropdown */}
              {showSuggestions[field.name] && suggestions[field.name] && (
                <div className="absolute z-10 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                  {suggestions[field.name].map((suggestion) => (
                    <button
                      key={suggestion.id}
                      type="button"
                      onClick={() => selectSuggestion(field.name, suggestion)}
                      className="w-full px-3 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center justify-between"
                    >
                      <span className="text-gray-900 dark:text-white">{suggestion.value}</span>
                      <div className="flex items-center gap-2 text-xs text-gray-500">
                        <span>%{Math.round(suggestion.confidence * 100)}</span>
                        <span>({suggestion.usage_count} kez)</span>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Validation error */}
            {validationErrors[field.name] && (
              <p className="mt-1 text-sm text-red-600 dark:text-red-400 flex items-center gap-1">
                <AlertCircle className="w-4 h-4" />
                {validationErrors[field.name]}
              </p>
            )}
          </div>
        ))}

        {/* Submit button */}
        <button
          type="submit"
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors duration-200 flex items-center justify-center gap-2"
        >
          <Zap className="w-4 h-4" />
          Akıllı Form Gönder
        </button>
      </form>
    </div>
  );
};

export default SmartFormAssistant;
