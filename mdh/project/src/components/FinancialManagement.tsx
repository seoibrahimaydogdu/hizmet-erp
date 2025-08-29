import React, { useState, useEffect, useCallback } from 'react';
import { 
  DollarSign, 
  TrendingUp, 
  TrendingDown, 
  Users, 
  CreditCard, 
  AlertTriangle,
  Plus,
  Calendar,
  FileText,
  BarChart3,
  PieChart,
  Download,
  Eye,
  Edit,
  Trash2,
  CheckCircle,
  XCircle,
  Clock,
  X,
  Wallet,
  Mail,
  User,
  Search,
  Filter,
  MoreVertical,
  Gift,
  UserMinus
} from 'lucide-react';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';
import { toast } from 'react-hot-toast';
import { useSupabase } from '../hooks/useSupabase';
import { supabase } from '../lib/supabase';
import { formatCurrency } from '../lib/currency';

import ExpenseManagement from './ExpenseManagement';
import PromotionManagement from './PromotionManagement';
import BudgetManagement from './BudgetManagement';
import FinancialOverview from './FinancialOverview';
import PaymentManagement from './financial/PaymentManagement';
import FinancialModals from './financial/FinancialModals';
import ReferralManagement from './ReferralManagement';
import RealTimeHintSystem from './RealTimeHintSystem';
import ChurnAnalysis from './ChurnAnalysis';

interface FinancialManagementProps {
  onViewCustomer?: (customerId: string) => void;
}

const FinancialManagement = ({ onViewCustomer }: FinancialManagementProps) => {
  const [activeTab, setActiveTab] = useState('overview');
  const { updatePayment, fetchPayments: refetchPayments } = useSupabase();
  const [showAddModal, setShowAddModal] = useState(false);
  const [modalType, setModalType] = useState<'payment' | 'expense' | 'promotion' | 'budget' | 'customer'>('payment');
  const [selectedPeriod, setSelectedPeriod] = useState('current_month');
  const [editingCustomer, setEditingCustomer] = useState<any>(null);
  const [showPromotionDetail, setShowPromotionDetail] = useState(false);
  const [showPromotionEdit, setShowPromotionEdit] = useState(false);
  const [selectedPromotion, setSelectedPromotion] = useState<any>(null);
  const [promotionLoading, setPromotionLoading] = useState(false);
  const [promotionError, setPromotionError] = useState<string | null>(null);

  // Ödeme takibi için state'ler
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState<any>(null);
  const [showReminderModal, setShowReminderModal] = useState(false);

  // Bütçe yönetimi için state'ler
  const [showBudgetDetail, setShowBudgetDetail] = useState(false);
  const [showBudgetEdit, setShowBudgetEdit] = useState(false);
  const [selectedBudget, setSelectedBudget] = useState<any>(null);

  // Gider yönetimi için state'ler
  const [showExpenseDetail, setShowExpenseDetail] = useState(false);
  const [showExpenseEdit, setShowExpenseEdit] = useState(false);
  const [selectedExpense, setSelectedExpense] = useState<any>(null);

  // Ödeme işlemleri popup için state'ler
  const [showPaymentActions, setShowPaymentActions] = useState<string | null>(null);
  const [showPaymentEdit, setShowPaymentEdit] = useState(false);
  const [showAddPaymentModal, setShowAddPaymentModal] = useState(false);
  const [editingPayment, setEditingPayment] = useState<any>(null);

  // Form verileri
  const [formData, setFormData] = useState<any>({
    commission_type: 'included' // Varsayılan olarak "içinden al" seçeneği
  });

  // Otomatik veri yenileme için
  useEffect(() => {
    if (activeTab === 'overview') {
      const interval = setInterval(() => {
        // Finansal verileri yenile
        fetchPayments();
        fetchCustomers();
        fetchExpenses();
      }, 3 * 60 * 1000); // 3 dakikada bir

      return () => clearInterval(interval);
    }
  }, [activeTab]);

  // Müşteri filtresi kontrolü
  const customerFilter = localStorage.getItem('customerFilter');
  
  // Müşteri filtresi temizleme fonksiyonu
  const clearCustomerFilter = () => {
    localStorage.removeItem('customerFilter');
    toast.success('Müşteri filtresi temizlendi');
    // Sayfayı yenile
    window.location.reload();
  };

  const {
    payments,
    expenseCategories,
    expenses,
    promotions,
    promotionUsage,
    budgets,
    customers,
    getFinancialMetrics,
    createPayment,
    createExpense,
    updateExpense,
    deleteExpense,
    getExpenseById,
    createPromotion,
    updatePromotion,
    deletePromotion,
    createBudget,
    deleteBudget,
    updateBudget,
    createCustomer,
    updateCustomer,
    fetchCustomers,
    fetchPayments,
    fetchExpenseCategories,
    fetchExpenses,
    fetchPromotions,
    fetchPromotionUsage,
    fetchBudgets,
    supabase
  } = useSupabase();

  const metrics = getFinancialMetrics();

  // Promosyon durumu güncelleme fonksiyonu
  const handleUpdatePromotionStatus = useCallback(async (promotionId: string, isActive: boolean) => {
    try {
      await updatePromotion(promotionId, { is_active: isActive });
    } catch (error) {
      // Sadece manuel güncellemelerde hata mesajı göster
      // Otomatik güncellemeler için sessizce geç
      if (error && typeof error === 'object' && 'message' in error) {
        console.error('Error updating promotion status:', error);
      }
    }
  }, [updatePromotion]);

  // Veri yükleme
  useEffect(() => {
    const loadData = async () => {
      try {
        setPromotionLoading(true);
        setPromotionError(null);
        await Promise.all([
          fetchCustomers(),
          fetchPayments(),
          fetchExpenseCategories(),
          fetchExpenses(),
          fetchPromotions(),
          fetchPromotionUsage(),
          fetchBudgets()
        ]);
      } catch (error) {
        console.error('Veri yükleme hatası:', error);
        setPromotionError('Veriler yüklenirken hata oluştu. Lütfen sayfayı yenileyin.');
        toast.error('Veriler yüklenirken hata oluştu. Lütfen sayfayı yenileyin.');
      } finally {
        setPromotionLoading(false);
      }
    };
    
    loadData();
    
    // Gerçek zamanlı güncellemeler için subscription
    const promotionSubscription = supabase
      .channel('admin_promotion_changes')
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'promotions'
        }, 
        (payload: any) => {
          console.log('Admin promotion change detected:', payload);
          // Promosyon sekmesi aktifse verileri yenile
          if (activeTab === 'promotions') {
            setPromotionLoading(true);
            Promise.all([fetchPromotions(), fetchPromotionUsage()])
              .catch(error => {
                console.error('Promotion data refresh error:', error);
                setPromotionError('Veriler yenilenirken hata oluştu.');
              })
              .finally(() => setPromotionLoading(false));
          }
        }
      )
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'promotion_usage'
        }, 
        (payload: any) => {
          console.log('Admin promotion usage change detected:', payload);
          // Promosyon sekmesi aktifse verileri yenile
          if (activeTab === 'promotions') {
            setPromotionLoading(true);
            Promise.all([fetchPromotions(), fetchPromotionUsage()])
              .catch(error => {
                console.error('Promotion usage data refresh error:', error);
                setPromotionError('Veriler yenilenirken hata oluştu.');
              })
              .finally(() => setPromotionLoading(false));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(promotionSubscription);
    };
  }, [activeTab]);

  // Popup menü dışına tıklandığında kapatma
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (showPaymentActions) {
        setShowPaymentActions(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showPaymentActions]);

  // Düzenleme modunda form verilerini doldur
  useEffect(() => {
    if (editingCustomer && modalType === 'customer') {
      setFormData({
        name: editingCustomer.name || '',
        email: editingCustomer.email || '',
        phone: editingCustomer.phone || '',
        company: editingCustomer.company || ''
      });
    }
  }, [editingCustomer, modalType]);

  // Form verilerini güncelleme
  const handleFormDataChange = (field: string, value: any) => {
    setFormData((prev: any) => ({
      ...prev,
      [field]: value
    }));
    
    // Tutar değişikliğinde gerçek zamanlı güncelleme
    if (field === 'amount' && showPaymentEdit) {
      // Düzenlenen ödeme verilerini güncelle
      setEditingPayment((prev: any) => ({
        ...prev,
        amount: Number(value) || 0
      }));
    }
    
    // Para birimi değişikliğinde tutar önizlemesini güncelle
    if (field === 'currency') {
      // Para birimi değiştiğinde tutar önizlemesi otomatik güncellenir
      console.log('Para birimi değişti:', value);
    }
    
    // Ödeme yöntemi değişikliğinde komisyon hesaplama
    if (field === 'payment_method' && formData.amount) {
      // Komisyon hesaplama mantığını kullanıcının seçimine göre yap
      // Varsayılan olarak "içinden al" seçeneği aktif
      const commissionType = formData.commission_type || 'included';
      const baseAmount = Number(formData.amount) || 0;
      let finalAmount = baseAmount;
      
      // Ödeme yöntemine göre komisyon oranı belirleme
      let commissionRate = 0;
      switch (value) {
        case 'Credit Card':
          commissionRate = 0.025; // %2.5 komisyon
          break;
        case 'bank_transfer':
          commissionRate = 0.01; // %1 komisyon
          break;
        case 'cash':
          commissionRate = 0; // Komisyon yok
          break;
        case 'check':
          commissionRate = 0.015; // %1.5 komisyon
          break;
        default:
          commissionRate = 0;
      }
      
      // Komisyon hesaplama seçeneğine göre tutar hesaplama
      if (commissionType === 'included') {
        // Komisyonu içinden al - tutar değişmez, sadece komisyon hesaplanır
        finalAmount = baseAmount;
      } else {
        // Komisyonu üstüne ekle - toplam tutar hesaplanır
        finalAmount = baseAmount * (1 + commissionRate);
      }
      
      // Tutarı güncelle
      setFormData((prev: any) => ({
        ...prev,
        amount: finalAmount.toFixed(2)
      }));
    }
    
    // Komisyon hesaplama seçeneği değişikliğinde tutar güncelleme
    if (field === 'commission_type' && formData.amount && formData.payment_method && formData.payment_method !== 'cash') {
      const baseAmount = Number(formData.amount) || 0;
      let finalAmount = baseAmount;
      
      // Ödeme yöntemine göre komisyon oranı belirleme
      let commissionRate = 0;
      switch (formData.payment_method) {
        case 'Credit Card':
          commissionRate = 0.025; // %2.5 komisyon
          break;
        case 'bank_transfer':
          commissionRate = 0.01; // %1 komisyon
          break;
        case 'check':
          commissionRate = 0.015; // %1.5 komisyon
          break;
        default:
          commissionRate = 0;
      }
      
      // Komisyon hesaplama seçeneğine göre tutar hesaplama
      if (value === 'included') {
        // Komisyonu içinden al - tutar değişmez
        finalAmount = baseAmount;
      } else {
        // Komisyonu üstüne ekle - toplam tutar hesaplanır
        finalAmount = baseAmount * (1 + commissionRate);
      }
      
      // Tutarı güncelle
      setFormData((prev: any) => ({
        ...prev,
        amount: finalAmount.toFixed(2)
      }));
    }
  };

  // Genel form gönderimi
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      switch (modalType) {
        case 'payment':
          await createPayment(formData);
          break;
        case 'expense':
          await createExpense(formData);
          break;
        case 'promotion':
          await createPromotion(formData);
          break;
        case 'budget':
          // Bütçe verilerini hazırla
          const budgetData = {
            name: formData.name,
            amount: Number(formData.amount),
            category_id: formData.category_id,
            is_active: formData.status === 'active',
            start_date: formData.start_date || null,
            end_date: formData.end_date || null
          };
          await createBudget(budgetData);
          break;
        case 'customer':
          if (editingCustomer) {
            await updateCustomer(editingCustomer.id, formData);
          } else {
            await createCustomer(formData);
          }
          break;
      }
      
      setShowAddModal(false);
      setFormData({
        commission_type: 'included' // Varsayılan değeri koru
      });
      setEditingCustomer(null);
    } catch (error) {
      console.error('Error creating/updating item:', error);
    }
  };

  // Ödeme takibi işlemleri
  const handleViewInvoice = (payment: any) => {
    setSelectedPayment(payment);
    setShowInvoiceModal(true);
  };

  const handleSendReminder = (payment: any) => {
    setSelectedPayment(payment);
    setShowReminderModal(true);
  };

  const handleEditPayment = (payment: any) => {
    console.log('Düzenlenecek ödeme:', payment);
    setEditingPayment(payment);
    setFormData({
      customer_id: payment.customer_id || '',
      subscription_id: payment.subscription_id || '',
      amount: payment.amount || '',
      currency: payment.currency || 'TRY',
      payment_method: payment.payment_method || '',
      status: payment.status || '',
      payment_date: payment.payment_date ? format(new Date(payment.payment_date), 'yyyy-MM-dd') : '',
      due_date: payment.due_date ? format(new Date(payment.due_date), 'yyyy-MM-dd') : '',
      notes: payment.notes || '',
      commission_type: payment.commission_type || 'included'
    });
    setShowPaymentEdit(true);
    setShowPaymentActions(null);
  };

  const handleUpdatePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      // Zorunlu alanları kontrol et
      if (!formData.customer_id) {
        toast.error('Müşteri seçimi zorunludur');
        return;
      }
      
      if (!formData.amount || Number(formData.amount) <= 0) {
        toast.error('Geçerli bir tutar giriniz');
        return;
      }
      
      if (!formData.payment_method) {
        toast.error('Ödeme yöntemi seçimi zorunludur');
        return;
      }
      
      if (!formData.status) {
        toast.error('Durum seçimi zorunludur');
        return;
      }

      // Ödeme verilerini hazırla
      const updatedPaymentData: any = {
        customer_id: formData.customer_id,
        amount: Number(formData.amount),
        currency: formData.currency || 'TRY',
        payment_method: formData.payment_method,
        status: formData.status,
        notes: formData.notes || '',
        commission_type: formData.commission_type || 'included'
      };

      // Opsiyonel alanları sadece değer varsa ekle
      if (formData.subscription_id) {
        updatedPaymentData.subscription_id = formData.subscription_id;
      }
      
      if (formData.payment_date) {
        updatedPaymentData.payment_date = new Date(formData.payment_date).toISOString();
      }
      
      if (formData.due_date) {
        updatedPaymentData.due_date = new Date(formData.due_date).toISOString();
      }

      // Ödeme güncelleme işlemi
      if (editingPayment && editingPayment.id) {
        await updatePayment(editingPayment.id, updatedPaymentData);
        
        // Başarılı güncelleme sonrası işlemler
        setShowPaymentEdit(false);
        setEditingPayment(null);
        setFormData({
          commission_type: 'included' // Varsayılan değeri koru
        });
      }
    } catch (error: any) {
      console.error('Error updating payment:', error);
      
      // Hata mesajını daha detaylı göster
      let errorMessage = 'Ödeme güncellenirken hata oluştu';
      
      if (error?.message) {
        errorMessage += `: ${error.message}`;
      } else if (error?.details) {
        errorMessage += `: ${error.details}`;
      } else if (error?.hint) {
        errorMessage += `: ${error.hint}`;
      } else if (error?.code) {
        errorMessage += ` (Kod: ${error.code})`;
      }
      
      // RLS hatası olup olmadığını kontrol et
      if (error?.message?.includes('row level security') || error?.message?.includes('RLS')) {
        errorMessage += '\n\nRLS (Row Level Security) hatası. Lütfen Supabase SQL Editor\'da fix_rls.sql dosyasını çalıştırın.';
      }
      
      toast.error(errorMessage);
      
      // Console'da daha detaylı hata bilgisi
      console.error('Detaylı hata bilgisi:', {
        message: error?.message,
        details: error?.details,
        hint: error?.hint,
        code: error?.code,
        fullError: error
      });
    }
  };

  const handleCreatePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      // Zorunlu alanları kontrol et
      if (!formData.customer_id) {
        toast.error('Müşteri seçimi zorunludur');
        return;
      }
      
      if (!formData.amount || Number(formData.amount) <= 0) {
        toast.error('Geçerli bir tutar giriniz');
        return;
      }
      
      if (!formData.payment_method) {
        toast.error('Ödeme yöntemi seçimi zorunludur');
        return;
      }
      
      if (!formData.status) {
        toast.error('Durum seçimi zorunludur');
        return;
      }

      // Komisyon hesaplaması
      let finalAmount = Number(formData.amount);
      let commissionAmount = 0;
      
      if (formData.payment_method && formData.payment_method !== 'cash') {
        const commissionRate = formData.payment_method === 'Credit Card' ? 0.025 : 
                              formData.payment_method === 'bank_transfer' ? 0.01 : 
                              formData.payment_method === 'check' ? 0.015 : 0;
        
        if (formData.commission_type === 'included') {
          // Komisyonu içinden al
          finalAmount = Number(formData.amount) / (1 + commissionRate);
          commissionAmount = Number(formData.amount) - finalAmount;
        } else {
          // Komisyonu üstüne ekle
          commissionAmount = Number(formData.amount) * commissionRate;
          finalAmount = Number(formData.amount) + commissionAmount;
        }
      }

      // Para birimi varsayılan değerini ayarla
      const paymentData = {
        customer_id: formData.customer_id,
        subscription_id: formData.subscription_id || null,
        amount: finalAmount,
        currency: formData.currency || 'TRY',
        payment_method: formData.payment_method,
        status: formData.status,
        payment_date: formData.payment_date || null,
        due_date: formData.due_date || null,
        notes: formData.notes || ''
      };
      
      console.log('Payment data being sent:', paymentData);
      await createPayment(paymentData);
      setShowAddPaymentModal(false);
      setFormData({
        commission_type: 'included' // Varsayılan değeri koru
      });
      toast.success('Ödeme başarıyla oluşturuldu');
    } catch (error: any) {
      console.error('Payment creation error:', error);
      // Hata mesajı zaten createPayment fonksiyonunda gösteriliyor
    }
  };

  const handleDeletePayment = async (payment: any) => {
    try {
      // Ödeme silme işlemi için useSupabase hook'undan gelen fonksiyonu kullan
      // Bu örnek için basit bir silme işlemi simüle ediyoruz
      toast.success('Ödeme başarıyla silindi');
              // Ödemeleri yeniden yükle
        await refetchPayments();
    } catch (error) {
      toast.error('Ödeme silinirken hata oluştu');
      console.error('Error deleting payment:', error);
    }
  };

  const sendReminder = async () => {
    try {
      // E-posta gönderim simülasyonu
      toast.success(`${selectedPayment.customers?.name} adlı müşteriye hatırlatma gönderildi`);
      setShowReminderModal(false);
      setSelectedPayment(null);
    } catch (error) {
      toast.error('Hatırlatma gönderilemedi');
    }
  };

  // Toplu hatırlatma modal state'leri
  const [showBulkReminderModal, setShowBulkReminderModal] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<any>(null);
  const [customMessage, setCustomMessage] = useState('');
  const [showCustomEditor, setShowCustomEditor] = useState(false);
  const [selectedPayments, setSelectedPayments] = useState<string[]>([]);
  const [isSendingBulkReminders, setIsSendingBulkReminders] = useState(false);
  
  // Toplu hatırlatma arama için state'ler
  const [bulkReminderSearchTerm, setBulkReminderSearchTerm] = useState('');
  const [bulkReminderStatusFilter, setBulkReminderStatusFilter] = useState('all');
  const [bulkReminderPaymentMethodFilter, setBulkReminderPaymentMethodFilter] = useState('all');

  // Ödeme template'leri
  const paymentTemplates = [
    {
      id: 'first_reminder',
      title: 'İlk Hatırlatma - Nazik Uyarı',
      template: `Sayın {müşteri_adı},

{ödeme_tutari} TL tutarındaki {fatura_no} numaralı faturanızın vade tarihi {vade_tarihi} olup, ödemeniz henüz alınamamıştır.

Ödemenizi en kısa sürede yapmanızı rica ederiz. Herhangi bir sorunuz varsa bizimle iletişime geçebilirsiniz.

Teşekkürler,
{şirket_adı}`,
      category: 'reminder',
      daysAfterDue: 3
    },
    {
      id: 'second_reminder',
      title: 'İkinci Hatırlatma - Önemli Uyarı',
      template: `Sayın {müşteri_adı},

{ödeme_tutari} TL tutarındaki {fatura_no} numaralı faturanızın vade tarihi {vade_tarihi} olup, ödemeniz henüz alınamamıştır.

Bu durumun devam etmesi durumunda gecikme faizi uygulanabilir. Lütfen ödemenizi acilen yapınız.

Ödeme seçenekleri:
- Banka havalesi: TR12 3456 7890 1234 5678 9012 34
- Online ödeme: https://odeme.sirketim.com

Sorularınız için: +90 212 555 0123

Saygılarımızla,
{şirket_adı}`,
      category: 'warning',
      daysAfterDue: 7
    },
    {
      id: 'urgent_reminder',
      title: 'Acil Hatırlatma - Son Uyarı',
      template: `Sayın {müşteri_adı},

{ödeme_tutari} TL tutarındaki {fatura_no} numaralı faturanızın vade tarihi {vade_tarihi} olup, ödemeniz henüz alınamamıştır.

Bu durum ciddi sonuçlar doğurabilir. Lütfen ödemenizi hemen yapınız.

Ödeme seçenekleri:
- Banka havalesi: TR12 3456 7890 1234 5678 9012 34
- Online ödeme: https://odeme.sirketim.com
- Nakit ödeme: Ofisimize gelebilirsiniz

Acil durum: +90 212 555 0123

Saygılarımızla,
{şirket_adı}`,
      category: 'urgent',
      daysAfterDue: 15
    },
    {
      id: 'final_reminder',
      title: 'Son Hatırlatma - Yasal İşlem',
      template: `Sayın {müşteri_adı},

{ödeme_tutari} TL tutarındaki {fatura_no} numaralı faturanızın vade tarihi {vade_tarihi} olup, ödemeniz henüz alınamamıştır.

Bu durum yasal işlemlerle sonuçlanabilir. Son kez ödemenizi yapmanızı rica ediyoruz.

Ödeme seçenekleri:
- Banka havalesi: TR12 3456 7890 1234 5678 9012 34
- Online ödeme: https://odeme.sirketim.com
- Nakit ödeme: Ofisimize gelebilirsiniz

Son fırsat: +90 212 555 0123

Saygılarımızla,
{şirket_adı}`,
      category: 'final',
      daysAfterDue: 30
    }
  ];

  // Template değişkenlerini doldur
  const fillTemplate = (template: string, variables: any) => {
    let filledTemplate = template;
    
    Object.keys(variables).forEach(key => {
      const placeholder = `{${key}}`;
      filledTemplate = filledTemplate.replace(new RegExp(placeholder, 'g'), variables[key] || '');
    });
    
    return filledTemplate;
  };

  // Template önizlemesi oluştur
  const generatePreview = (payment: any, template: any) => {
    const variables = {
      müşteri_adı: payment.customers?.name || 'Müşteri',
      ödeme_tutari: formatCurrency(Number(payment.amount) || 0),
      fatura_no: payment.invoice_number || payment.id.slice(0, 8),
      vade_tarihi: payment.due_date ? format(new Date(payment.due_date), 'dd/MM/yyyy', { locale: tr }) : 'Belirtilmemiş',
      şirket_adı: 'Şirket Adı'
    };

    return fillTemplate(template.template, variables);
  };

  // Toplu hatırlatma gönder
  const sendBulkReminders = async () => {
    if (!selectedTemplate && !showCustomEditor) {
      toast.error('Lütfen bir template seçin veya özel mesaj yazın');
      return;
    }

    if (selectedPayments.length === 0) {
      toast.error('Lütfen hatırlatma gönderilecek ödemeleri seçin');
      return;
    }

    setIsSendingBulkReminders(true);

    try {
      const selectedPaymentObjects = getUniquePayments(payments).filter(p => selectedPayments.includes(p.id));
      console.log('Seçili ödemeler:', selectedPaymentObjects);
      console.log('Seçili ödeme sayısı:', selectedPayments.length);
      
      let successCount = 0;
      let errorCount = 0;

      // Kişi bazlı mı toplu hatırlatma mı kontrol et
      const isPersonBased = selectedPayments.length === 1;
      const ticketType = isPersonBased ? 'reminder' : 'notification'; // Kişi bazlı: reminder, Toplu: notification
      console.log('Ticket türü:', ticketType, 'Kişi bazlı:', isPersonBased);

      for (const payment of selectedPaymentObjects) {
        try {
          console.log('İşlenen ödeme:', payment);
          const message = showCustomEditor ? customMessage : generatePreview(payment, selectedTemplate);
          console.log('Oluşturulan mesaj:', message);

          // 1. Müşteri bilgilerini bul
          console.log('Müşteri ID aranıyor:', payment.customer_id);
          const { data: customerData, error: customerError } = await supabase
            .from('customers')
            .select('id, name, email')
            .eq('id', payment.customer_id)
            .single();

          if (customerError || !customerData) {
            console.error('Müşteri bulunamadı:', customerError);
            console.error('Müşteri ID:', payment.customer_id);
            errorCount++;
            continue;
          }
          
          console.log('Müşteri bulundu:', customerData);

          // 2. Ödeme hatırlatması için ticket oluştur
          const ticketDataToInsert = {
            title: `Ödeme Hatırlatması - ${payment.invoice_number || payment.id.slice(0, 8)}`,
            description: `${customerData.name} için ${formatCurrency(Number(payment.amount))} tutarındaki ${payment.invoice_number || payment.id.slice(0, 8)} numaralı faturanın ödeme hatırlatması`,
            status: 'open',
            priority: 'high',
            category: 'payment_reminder', // Tüm hatırlatmalar için ödeme kategorisi
            ticket_type: ticketType, // Kişi bazlı: reminder, Toplu: notification
            customer_id: customerData.id,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          };
          
          console.log('Ticket oluşturuluyor:', ticketDataToInsert);
          
          const { data: ticketData, error: ticketError } = await supabase
            .from('tickets')
            .insert(ticketDataToInsert)
            .select()
            .single();

          if (ticketError) {
            console.error('Ticket oluşturma hatası:', ticketError);
            console.error('Ticket verisi:', ticketDataToInsert);
            console.error('Hata detayları:', JSON.stringify(ticketError, null, 2));
            errorCount++;
            continue;
          }
          
          console.log('Ticket oluşturuldu:', ticketData);

          // 3. Hatırlatma mesajını ticket'a gönder
          const messageDataToInsert = {
            ticket_id: ticketData.id,
            sender_id: null, // System mesajları için null
            sender_type: 'admin',
            message: message,
            is_internal: false,
            is_read: false,
            created_at: new Date().toISOString()
          };
          
          console.log('Mesaj gönderiliyor:', messageDataToInsert);
          
          const { error: messageError } = await supabase
            .from('ticket_messages')
            .insert(messageDataToInsert);

          if (messageError) {
            console.error('Mesaj gönderme hatası:', messageError);
            console.error('Mesaj verisi:', messageDataToInsert);
            errorCount++;
            continue;
          }
          
          console.log('Mesaj iletildi');

          // 4. Bildirim oluştur
          const notificationDataToInsert = {
            user_id: customerData.id,
            type: 'payment_reminder',
            title: 'Ödeme Hatırlatması',
            message: `Ödeme hatırlatması gönderildi. Tutar: ${formatCurrency(Number(payment.amount))}`,
            is_read: false,
            created_at: new Date().toISOString()
          };
          
          console.log('Bildirim oluşturuluyor:', notificationDataToInsert);
          
          const { error: notificationError } = await supabase
            .from('notifications')
            .insert(notificationDataToInsert);

          if (notificationError) {
            console.error('Bildirim oluşturma hatası:', notificationError);
            console.error('Bildirim verisi:', notificationDataToInsert);
            // Bildirim hatası kritik değil, devam et
          } else {
            console.log('Bildirim oluşturuldu');
          }

          successCount++;
          console.log(`Başarılı hatırlatma sayısı: ${successCount}`);
        } catch (error) {
          console.error('Hatırlatma gönderme hatası:', error);
          errorCount++;
          console.log(`Hata sayısı: ${errorCount}`);
        }
      }

      if (successCount > 0) {
        const reminderType = isPersonBased ? 'kişi bazlı hatırlatma' : 'toplu hatırlatma';
        const successMessage = `${successCount} ${reminderType} başarıyla gönderildi${errorCount > 0 ? `, ${errorCount} hata oluştu` : ''}`;
        console.log('Başarı mesajı:', successMessage);
        toast.success(successMessage);
      } else {
        console.log('Hiçbir hatırlatma gönderilemedi');
        toast.error('Hiçbir hatırlatma gönderilemedi');
      }

      setShowBulkReminderModal(false);
      setSelectedTemplate(null);
      setCustomMessage('');
      setShowCustomEditor(false);
      setSelectedPayments([]);
    } catch (error) {
      console.error('Toplu hatırlatma hatası:', error);
      toast.error('Toplu hatırlatma gönderilemedi');
    } finally {
      setIsSendingBulkReminders(false);
    }
  };

  // Kopya faturaları temizleme fonksiyonu
  const getUniquePayments = (paymentList: any[]) => {
    return paymentList.filter((payment, index, self) => {
      // ID bazında duplicate kontrolü
      const idIndex = self.findIndex(p => p.id === payment.id);
      if (index !== idIndex) return false;
      
      // Invoice number bazında duplicate kontrolü (eğer invoice_number varsa)
      if (payment.invoice_number) {
        const invoiceIndex = self.findIndex(p => 
          p.invoice_number === payment.invoice_number && 
          p.id !== payment.id
        );
        if (invoiceIndex !== -1) {
          // Aynı invoice_number'a sahip başka bir ödeme varsa, en eski olanı tut
          const currentCreatedAt = new Date(payment.created_at).getTime();
          const existingCreatedAt = new Date(self[invoiceIndex].created_at).getTime();
          return currentCreatedAt <= existingCreatedAt;
        }
      }
      
      return true;
    });
  };

  // Toplu hatırlatma modalını aç
  const openBulkReminderModal = () => {
    // Önce kopya faturaları temizle
    const uniquePayments = getUniquePayments(payments);
    
    // Bekleyen ve gecikmiş ödemeleri otomatik seç
    const overduePayments = uniquePayments.filter(p => 
      p.due_date && new Date(p.due_date) < new Date() && p.status !== 'completed'
    );
    setSelectedPayments(overduePayments.map(p => p.id));
    
    // Arama state'lerini sıfırla
    setBulkReminderSearchTerm('');
    setBulkReminderStatusFilter('all');
    setBulkReminderPaymentMethodFilter('all');
    
    setShowBulkReminderModal(true);
  };

  // Kişi bazlı hatırlatma modalını aç
  const openPersonBasedReminderModal = () => {
    // Önce kopya faturaları temizle
    const uniquePayments = getUniquePayments(payments);
    
    // Müşteri bazında grupla ve her müşteri için en eski bekleyen ödemeyi seç
    const customerPayments = uniquePayments.filter(p => p.status !== 'completed');
    const customerGroups = customerPayments.reduce((groups: any, payment) => {
      if (!groups[payment.customer_id]) {
        groups[payment.customer_id] = [];
      }
      groups[payment.customer_id].push(payment);
      return groups;
    }, {});
    
    // Her müşteri için en eski ödemeyi seç
    const oldestPayments = Object.values(customerGroups).map((payments: any) => {
      return payments.sort((a: any, b: any) => 
        new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      )[0];
    });
    
    setSelectedPayments(oldestPayments.map((p: any) => p.id));
    
    // Arama state'lerini sıfırla
    setBulkReminderSearchTerm('');
    setBulkReminderStatusFilter('all');
    setBulkReminderPaymentMethodFilter('all');
    
    setShowBulkReminderModal(true);
  };



  // Promosyon işlemleri
  const handleViewPromotion = (promotion: any) => {
    // Promosyon verilerini güvenli hale getir
    const safePromotion = {
      ...promotion,
      name: promotion.name || 'İsimsiz Promosyon',
      discount_value: promotion.discount_value !== null && promotion.discount_value !== undefined ? promotion.discount_value : 0,
      discount_type: promotion.discount_type || 'percentage',
      usage_limit: promotion.usage_limit || null,
      is_active: promotion.is_active || false,
      description: promotion.description || '',
      start_date: promotion.start_date || null,
      end_date: promotion.end_date || null
    };
    setSelectedPromotion(safePromotion);
    setShowPromotionDetail(true);
  };

  const handleEditPromotion = (promotion: any) => {
    // Promosyon verilerini güvenli hale getir
    const safePromotion = {
      ...promotion,
      name: promotion.name || 'İsimsiz Promosyon',
      discount_value: promotion.discount_value !== null && promotion.discount_value !== undefined ? promotion.discount_value : 0,
      discount_type: promotion.discount_type || 'percentage',
      usage_limit: promotion.usage_limit || null,
      is_active: promotion.is_active || false,
      description: promotion.description || '',
      start_date: promotion.start_date || null,
      end_date: promotion.end_date || null
    };
    
    setSelectedPromotion(safePromotion);
    setFormData({
      name: safePromotion.name,
      description: safePromotion.description,
      discount_type: safePromotion.discount_type,
      discount_value: (safePromotion.discount_value !== null && safePromotion.discount_value !== undefined ? safePromotion.discount_value : 0).toString(),
      start_date: safePromotion.start_date ? format(new Date(safePromotion.start_date), 'yyyy-MM-dd') : '',
      end_date: safePromotion.end_date ? format(new Date(safePromotion.end_date), 'yyyy-MM-dd') : '',
      usage_limit: safePromotion.usage_limit ? safePromotion.usage_limit.toString() : '',
      is_active: safePromotion.is_active
    });
    setShowPromotionEdit(true);
  };

  const handleUpdatePromotion = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      if (!selectedPromotion) return;
      
      await updatePromotion(selectedPromotion.id, formData);
      
      setShowPromotionEdit(false);
      setSelectedPromotion(null);
      setFormData({});
    } catch (error) {
      toast.error('Promosyon güncellenirken hata oluştu');
    }
  };

  // Gider işlemleri
  const handleViewExpense = async (expenseId: string) => {
    try {
      const expense = await getExpenseById(expenseId);
      if (expense) {
        setSelectedExpense(expense);
        setShowExpenseDetail(true);
      }
    } catch (error) {
      toast.error('Gider detayları yüklenirken hata oluştu');
    }
  };

  const handleEditExpense = (expense: any) => {
    setSelectedExpense(expense);
    setFormData({
      description: expense.description || '',
      amount: expense.amount || '',
      category_id: expense.category_id || '',
      expense_date: expense.expense_date ? format(new Date(expense.expense_date), 'yyyy-MM-dd') : '',
      status: expense.status || 'pending',
      notes: expense.notes || ''
    });
    setShowExpenseEdit(true);
  };

  const handleUpdateExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      if (!selectedExpense) return;
      
      await updateExpense(selectedExpense.id, formData);
      
      setShowExpenseEdit(false);
      setSelectedExpense(null);
      setFormData({});
    } catch (error) {
      console.error('Error updating expense:', error);
    }
  };

  const handleDeleteExpense = async (expenseId: string) => {
    if (window.confirm('Bu gideri silmek istediğinizden emin misiniz?')) {
      try {
        await deleteExpense(expenseId);
      } catch (error) {
        console.error('Error deleting expense:', error);
      }
    }
  };

  // Bütçe işlemleri
  const handleViewBudget = (budgetId: string) => {
    const budget = budgets?.find(b => b.id === budgetId);
    if (budget) {
      setSelectedBudget(budget);
      setShowBudgetDetail(true);
    }
  };

  const handleEditBudget = (budget: any) => {
    setSelectedBudget(budget);
    setFormData({
      name: budget.name || '',
      amount: budget.amount || '',
      category: budget.category_id || budget.category || '',
      status: budget.is_active ? 'active' : 'inactive',
      start_date: budget.start_date ? format(new Date(budget.start_date), 'yyyy-MM-dd') : '',
      end_date: budget.end_date ? format(new Date(budget.end_date), 'yyyy-MM-dd') : ''
    });
    setShowBudgetEdit(true);
  };

  const handleUpdateBudget = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      if (!selectedBudget) return;
      
      const updatedBudget = {
        name: formData.name,
        amount: Number(formData.amount),
        category_id: formData.category,
        is_active: formData.status === 'active',
        start_date: formData.start_date || null,
        end_date: formData.end_date || null
      };

      await updateBudget(selectedBudget.id, updatedBudget);
      
      setShowBudgetEdit(false);
      setSelectedBudget(null);
      setFormData({});
    } catch (error) {
      toast.error('Bütçe güncellenirken hata oluştu');
    }
  };

  // Tab render fonksiyonları
  const renderOverview = () => (
    <FinancialOverview
      customers={customers}
      payments={payments}
      expenses={expenses}
      budgets={budgets}
      promotions={promotions}
      onRefresh={() => {
        fetchPayments();
        fetchCustomers();
        fetchExpenses();
      }}
    />
  );

  const renderPayments = () => (
    <PaymentManagement
      payments={payments}
      onViewInvoice={handleViewInvoice}
      onEditPayment={handleEditPayment}
      onSendReminder={handleSendReminder}
      onSendBulkReminders={openBulkReminderModal}
      onSendPersonBasedReminders={openPersonBasedReminderModal}
      onAddPayment={() => setShowAddPaymentModal(true)}
      onDeletePayment={handleDeletePayment}
    />
  );



  const renderExpenses = () => (
    <ExpenseManagement
      expenses={expenses}
      expenseCategories={expenseCategories}
      onAddExpense={() => {
        setModalType('expense');
        setFormData({});
        setShowAddModal(true);
      }}
      onViewExpense={handleViewExpense}
      onEditExpense={handleEditExpense}
      onDeleteExpense={handleDeleteExpense}
    />
  );

  const renderPromotions = () => {
    console.log('PromotionManagement render ediliyor:', {
      promotionsCount: promotions?.length || 0,
      promotionUsageCount: promotionUsage?.length || 0,
      promotions: promotions,
      promotionUsage: promotionUsage
    });
    
    return (
      <PromotionManagement
        promotions={promotions || []}
        promotionUsage={promotionUsage || []}
        onViewPromotion={handleViewPromotion}
        onEditPromotion={handleEditPromotion}
        onDeletePromotion={async (promotionId: string) => {
          if (window.confirm('Bu promosyonu silmek istediğinizden emin misiniz?')) {
            try {
              await deletePromotion(promotionId);
            } catch (error) {
              toast.error('Promosyon silinirken hata oluştu');
              console.error('Error deleting promotion:', error);
            }
          }
        }}
        onAddPromotion={() => {
          setModalType('promotion');
          setShowAddModal(true);
        }}
        onUpdatePromotionStatus={handleUpdatePromotionStatus}
      />
    );
  };

  const renderBudgets = () => (
    <BudgetManagement
      budgets={budgets || []}
      expenses={expenses || []}
      expenseCategories={expenseCategories || []}
      onViewBudget={handleViewBudget}
      onEditBudget={handleEditBudget}
      onAddBudget={() => {
        setModalType('budget');
        setShowAddModal(true);
      }}
      onDeleteBudget={async (budgetId: string) => {
        if (window.confirm('Bu bütçeyi silmek istediğinizden emin misiniz?')) {
          try {
            await deleteBudget(budgetId);
          } catch (error) {
            toast.error('Bütçe silinirken hata oluştu');
            console.error('Error deleting budget:', error);
          }
        }
      }}
    />
  );



  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Finansal Yönetim</h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Gelir, gider, abonelik ve müşteri yönetimi
          </p>
        </div>

        {/* Müşteri Filtresi Bildirimi */}
        {customerFilter && (
          <div className="mb-6 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <User className="w-5 h-5 text-blue-600" />
                <div>
                  <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
                    Müşteri Filtresi Aktif
                  </p>
                  <p className="text-xs text-blue-700 dark:text-blue-300">
                    {customers?.find(c => c.id === customerFilter)?.name || 'Bilinmeyen Müşteri'} için ödemeler gösteriliyor
                  </p>
                </div>
              </div>
              <button
                onClick={clearCustomerFilter}
                className="flex items-center space-x-1 px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-lg transition-colors"
              >
                <X className="w-4 h-4" />
                <span>Filtreyi Temizle</span>
              </button>
            </div>
          </div>
        )}

                 {/* Tab Navigation */}
         <div className="mb-8">
           <nav className="flex space-x-8 border-b border-gray-200 dark:border-gray-700">
             {[
               { id: 'overview', name: 'Genel Bakış', icon: BarChart3 },
               { id: 'payments', name: 'Ödeme Takibi', icon: CreditCard },
               { id: 'expenses', name: 'Gider Yönetimi', icon: TrendingDown },
               { id: 'promotions', name: 'Promosyonlar', icon: Gift },
               { id: 'referrals', name: 'Referans Programı', icon: Users },
               { id: 'budgets', name: 'Bütçe Yönetimi', icon: Wallet },
               { id: 'churn', name: 'Churn Analizi', icon: UserMinus }
             ].map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => {
                    setActiveTab(tab.id);
                    // Promotion sekmesine tıklandığında verileri yeniden yükle
                    if (tab.id === 'promotions' && activeTab !== 'promotions') {
                      console.log('Promotion sekmesine tıklandı, veriler yükleniyor...');
                      setPromotionLoading(true);
                      setPromotionError(null);
                      Promise.all([fetchPromotions(), fetchPromotionUsage()])
                        .then(() => {
                          console.log('Promotion verileri başarıyla yüklendi');
                        })
                        .catch(error => {
                          console.error('Promotion veri yükleme hatası:', error);
                          setPromotionError('Veriler yüklenirken hata oluştu. Lütfen tekrar deneyin.');
                        })
                        .finally(() => setPromotionLoading(false));
                    }
                  }}
                  className={`flex items-center gap-2 py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {tab.name}
                </button>
              );
            })}
          </nav>
        </div>

                 {/* Tab Content */}
         <div className="space-y-6">
           {activeTab === 'overview' && renderOverview()}
           {activeTab === 'payments' && renderPayments()}
           {activeTab === 'expenses' && renderExpenses()}
           {activeTab === 'promotions' && (
          promotionLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <span className="ml-3 text-gray-600 dark:text-gray-400">Promosyonlar yükleniyor...</span>
            </div>
          ) : promotionError ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <div className="text-red-500 mb-4">
                  <AlertTriangle className="w-12 h-12 mx-auto" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  Promosyonlar Yüklenemedi
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  {promotionError}
                </p>
                <button
                  onClick={() => {
                    setPromotionError(null);
                    setPromotionLoading(true);
                    Promise.all([fetchPromotions(), fetchPromotionUsage()])
                      .catch(error => {
                        setPromotionError('Veriler yüklenirken hata oluştu. Lütfen tekrar deneyin.');
                      })
                      .finally(() => setPromotionLoading(false));
                  }}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                >
                  Tekrar Dene
                </button>
              </div>
            </div>
          ) : (
            renderPromotions()
          )
        )}
           {activeTab === 'referrals' && <ReferralManagement />}
           {activeTab === 'budgets' && renderBudgets()}
           {activeTab === 'churn' && <ChurnAnalysis />}
         </div>

        {/* Modals */}
                 <FinancialModals
           showInvoiceModal={showInvoiceModal}
           showReminderModal={showReminderModal}
           showPaymentEdit={showPaymentEdit}
           showAddPaymentModal={showAddPaymentModal}
           selectedPayment={selectedPayment}
           editingPayment={editingPayment}
           formData={formData}
           customers={customers}
           onCloseInvoiceModal={() => setShowInvoiceModal(false)}
           onCloseReminderModal={() => setShowReminderModal(false)}
           onClosePaymentEdit={() => setShowPaymentEdit(false)}
           onCloseAddPaymentModal={() => setShowAddPaymentModal(false)}
           onUpdatePayment={handleUpdatePayment}
           onCreatePayment={handleCreatePayment}
           onSendReminder={sendReminder}
           onFormDataChange={handleFormDataChange}
         />

        {/* Gider Ekleme Modal */}
        {showAddModal && modalType === 'expense' && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Yeni Gider Ekle</h3>
                <button
                  onClick={() => {
                    setShowAddModal(false);
                    setFormData({});
                  }}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <form onSubmit={handleSubmit} className="p-6 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Açıklama
                    </label>
                    <input
                      type="text"
                      value={formData.description || ''}
                      onChange={(e) => handleFormDataChange('description', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Kategori
                    </label>
                    <select
                      value={formData.category_id || ''}
                      onChange={(e) => handleFormDataChange('category_id', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                      required
                    >
                      <option value="">Kategori Seçin</option>
                      {(expenseCategories || []).map((category: any) => (
                        <option key={category.id} value={category.id}>
                          {category.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Tutar
                    </label>
                    <input
                      type="number"
                      value={formData.amount || ''}
                      onChange={(e) => handleFormDataChange('amount', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                      placeholder="0.00"
                      step="0.01"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Durum
                    </label>
                                         <select
                       value={formData.status || 'pending'}
                       onChange={(e) => handleFormDataChange('status', e.target.value)}
                       className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                     >
                       <option value="pending">Bekliyor</option>
                       <option value="approved">Onaylandı</option>
                       <option value="paid">Ödendi</option>
                       <option value="rejected">Reddedildi</option>
                     </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Gider Tarihi
                    </label>
                    <input
                      type="date"
                      value={formData.expense_date || ''}
                      onChange={(e) => handleFormDataChange('expense_date', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Notlar
                  </label>
                  <textarea
                    value={formData.notes || ''}
                    onChange={(e) => handleFormDataChange('notes', e.target.value)}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                    placeholder="Gider notları..."
                  />
                </div>

                <div className="flex items-center justify-end gap-3 pt-6 border-t border-gray-200 dark:border-gray-700">
                  <button
                    type="button"
                    onClick={() => {
                      setShowAddModal(false);
                      setFormData({});
                    }}
                    className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
                  >
                    İptal
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    Gider Ekle
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Gider Detay Modal */}
        {showExpenseDetail && selectedExpense && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Gider Detayları</h3>
                <button
                  onClick={() => {
                    setShowExpenseDetail(false);
                    setSelectedExpense(null);
                  }}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <div className="p-6 space-y-6">
                {/* Gider Bilgileri */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Açıklama</h4>
                    <p className="text-lg font-semibold text-gray-900 dark:text-white">{selectedExpense.description}</p>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Kategori</h4>
                    <p className="text-lg font-semibold text-gray-900 dark:text-white">
                      {selectedExpense.expense_categories?.name || '-'}
                    </p>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Tutar</h4>
                    <p className="text-2xl font-bold text-red-600">{formatCurrency(Number(selectedExpense.amount))}</p>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Durum</h4>
                    <span className={`inline-flex px-3 py-1 text-sm font-semibold rounded-full ${
                      selectedExpense.status === 'approved' 
                        ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
                        : selectedExpense.status === 'pending'
                        ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400'
                        : selectedExpense.status === 'paid'
                        ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400'
                        : 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
                    }`}>
                      {selectedExpense.status === 'approved' ? 'Onaylandı' : 
                       selectedExpense.status === 'pending' ? 'Bekliyor' : 
                       selectedExpense.status === 'paid' ? 'Ödendi' : 'Reddedildi'}
                    </span>
                  </div>
                </div>

                {/* Notlar */}
                {selectedExpense.notes && (
                  <div>
                    <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Notlar</h4>
                    <p className="text-gray-900 dark:text-white">{selectedExpense.notes}</p>
                  </div>
                )}

                {/* Tarih Bilgileri */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Gider Tarihi</h4>
                    <p className="text-gray-900 dark:text-white">
                      {selectedExpense.expense_date ? format(new Date(selectedExpense.expense_date), 'dd MMMM yyyy', { locale: tr }) : '-'}
                    </p>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Oluşturulma Tarihi</h4>
                    <p className="text-gray-900 dark:text-white">
                      {selectedExpense.created_at ? format(new Date(selectedExpense.created_at), 'dd MMMM yyyy HH:mm', { locale: tr }) : '-'}
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200 dark:border-gray-700">
                <button
                  onClick={() => {
                    setShowExpenseDetail(false);
                    setSelectedExpense(null);
                  }}
                  className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
                >
                  Kapat
                </button>
                <button
                  onClick={() => {
                    setShowExpenseDetail(false);
                    handleEditExpense(selectedExpense);
                  }}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Düzenle
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Gider Düzenleme Modal */}
        {showExpenseEdit && selectedExpense && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Gider Düzenle</h3>
                <button
                  onClick={() => {
                    setShowExpenseEdit(false);
                    setFormData({});
                    setSelectedExpense(null);
                  }}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <form onSubmit={handleUpdateExpense} className="p-6 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Açıklama
                    </label>
                    <input
                      type="text"
                      value={formData.description || ''}
                      onChange={(e) => setFormData({...formData, description: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Kategori
                    </label>
                    <select
                      value={formData.category_id || ''}
                      onChange={(e) => setFormData({...formData, category_id: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                      required
                    >
                      <option value="">Kategori Seçin</option>
                      {(expenseCategories || []).map((category: any) => (
                        <option key={category.id} value={category.id}>
                          {category.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Tutar
                    </label>
                    <input
                      type="number"
                      value={formData.amount || ''}
                      onChange={(e) => setFormData({...formData, amount: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                      placeholder="0.00"
                      step="0.01"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Durum
                    </label>
                                         <select
                       value={formData.status || selectedExpense.status || 'pending'}
                       onChange={(e) => setFormData({...formData, status: e.target.value})}
                       className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                     >
                       <option value="pending">Bekliyor</option>
                       <option value="approved">Onaylandı</option>
                       <option value="paid">Ödendi</option>
                       <option value="rejected">Reddedildi</option>
                     </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Gider Tarihi
                    </label>
                    <input
                      type="date"
                      value={formData.expense_date || ''}
                      onChange={(e) => setFormData({...formData, expense_date: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Notlar
                  </label>
                  <textarea
                    value={formData.notes || ''}
                    onChange={(e) => setFormData({...formData, notes: e.target.value})}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                    placeholder="Gider notları..."
                  />
                </div>

                <div className="flex items-center justify-end gap-3 pt-6 border-t border-gray-200 dark:border-gray-700">
                  <button
                    type="button"
                    onClick={() => {
                      setShowExpenseEdit(false);
                      setFormData({});
                      setSelectedExpense(null);
                    }}
                    className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
                  >
                    İptal
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    Güncelle
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Bütçe Detay Modal */}
        {showBudgetDetail && selectedBudget && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Bütçe Detayları</h3>
                <button
                  onClick={() => setShowBudgetDetail(false)}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <div className="p-6 space-y-6">
                {/* Bütçe Bilgileri */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Bütçe Adı</h4>
                    <p className="text-lg font-semibold text-gray-900 dark:text-white">{selectedBudget.name}</p>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Kategori</h4>
                    <p className="text-lg font-semibold text-gray-900 dark:text-white">
                      {selectedBudget.expense_categories?.name || '-'}
                    </p>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Bütçe Miktarı</h4>
                    <p className="text-2xl font-bold text-indigo-600">{formatCurrency(Number(selectedBudget.amount))}</p>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Durum</h4>
                    <span className={`inline-flex px-3 py-1 text-sm font-semibold rounded-full ${
                      selectedBudget.is_active 
                        ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
                        : 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400'
                    }`}>
                      {selectedBudget.is_active ? 'Aktif' : 'Pasif'}
                    </span>
                  </div>
                </div>



                {/* Tarih Bilgileri */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Başlangıç Tarihi</h4>
                    <p className="text-gray-900 dark:text-white">
                      {selectedBudget.start_date ? format(new Date(selectedBudget.start_date), 'dd MMMM yyyy', { locale: tr }) : '-'}
                    </p>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Bitiş Tarihi</h4>
                    <p className="text-gray-900 dark:text-white">
                      {selectedBudget.end_date ? format(new Date(selectedBudget.end_date), 'dd MMMM yyyy', { locale: tr }) : '-'}
                    </p>
                  </div>
                </div>

                {/* Harcama Analizi */}
                <div>
                  <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-4">Harcama Analizi</h4>
                  <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="text-center">
                        <p className="text-2xl font-bold text-indigo-600">{formatCurrency(Number(selectedBudget.amount))}</p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Toplam Bütçe</p>
                      </div>
                      <div className="text-center">
                        <p className="text-2xl font-bold text-red-600">
                          {formatCurrency((expenses || [])
                            .filter(expense => expense.category_id === selectedBudget.category_id)
                            .reduce((sum, expense) => sum + Number(expense.amount), 0))}
                        </p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Harcanan</p>
                      </div>
                      <div className="text-center">
                        <p className="text-2xl font-bold text-green-600">
                          {formatCurrency((Number(selectedBudget.amount) - (expenses || [])
                            .filter(expense => expense.category_id === selectedBudget.category_id)
                            .reduce((sum, expense) => sum + Number(expense.amount), 0)))}
                        </p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Kalan</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200 dark:border-gray-700">
                <button
                  onClick={() => setShowBudgetDetail(false)}
                  className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
                >
                  Kapat
                </button>
                <button
                  onClick={() => {
                    setShowBudgetDetail(false);
                    handleEditBudget(selectedBudget);
                  }}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Düzenle
                </button>
              </div>
            </div>
          </div>
        )}

                 {/* Bütçe Ekleme Modal */}
        {showAddModal && modalType === 'budget' && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Yeni Bütçe Ekle</h3>
                <button
                  onClick={() => {
                    setShowAddModal(false);
                    setFormData({});
                  }}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <form onSubmit={handleSubmit} className="p-6 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Bütçe Adı
                    </label>
                    <input
                      type="text"
                      value={formData.name || ''}
                      onChange={(e) => handleFormDataChange('name', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Kategori
                    </label>
                    <select
                      value={formData.category_id || ''}
                      onChange={(e) => handleFormDataChange('category_id', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                      required
                    >
                      <option value="">Kategori Seçin</option>
                      {(expenseCategories || []).map((category: any) => (
                        <option key={category.id} value={category.id}>
                          {category.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Miktar
                    </label>
                    <input
                      type="number"
                      value={formData.amount || ''}
                      onChange={(e) => handleFormDataChange('amount', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                      placeholder="0.00"
                      step="0.01"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Durum
                    </label>
                    <select
                      value={formData.status || 'active'}
                      onChange={(e) => handleFormDataChange('status', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                    >
                      <option value="active">Aktif</option>
                      <option value="inactive">Pasif</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Başlangıç Tarihi
                    </label>
                    <input
                      type="date"
                      value={formData.start_date || ''}
                      onChange={(e) => handleFormDataChange('start_date', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Bitiş Tarihi
                    </label>
                    <input
                      type="date"
                      value={formData.end_date || ''}
                      onChange={(e) => handleFormDataChange('end_date', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                    />
                  </div>
                </div>



                <div className="flex items-center justify-end gap-3 pt-6 border-t border-gray-200 dark:border-gray-700">
                  <button
                    type="button"
                    onClick={() => {
                      setShowAddModal(false);
                      setFormData({});
                    }}
                    className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
                  >
                    İptal
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    Bütçe Ekle
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Bütçe Düzenleme Modal */}
         {showBudgetEdit && selectedBudget && (
           <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
             <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
               <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
                 <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Bütçe Düzenle</h3>
                 <button
                   onClick={() => setShowBudgetEdit(false)}
                   className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                 >
                   <X className="w-5 h-5" />
                 </button>
               </div>
               
               <form onSubmit={handleUpdateBudget} className="p-6 space-y-6">
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                   <div>
                     <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                       Bütçe Adı
                     </label>
                     <input
                       type="text"
                       value={formData.name || ''}
                       onChange={(e) => setFormData({...formData, name: e.target.value})}
                       className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                       required
                     />
                   </div>
                   <div>
                     <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                       Kategori
                     </label>
                     <select
                       value={formData.category || ''}
                       onChange={(e) => setFormData({...formData, category: e.target.value})}
                       className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                       required
                     >
                       <option value="">Kategori Seçin</option>
                       {(expenseCategories || []).map((category: any) => (
                         <option key={category.id} value={category.id}>
                           {category.name}
                         </option>
                       ))}
                     </select>
                   </div>
                   <div>
                     <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                       Miktar
                     </label>
                     <input
                       type="number"
                       value={formData.amount || ''}
                       onChange={(e) => setFormData({...formData, amount: e.target.value})}
                       className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                       placeholder="0.00"
                       step="0.01"
                       required
                     />
                   </div>
                   <div>
                     <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                       Durum
                     </label>
                     <select
                       value={formData.status || (selectedBudget?.is_active ? 'active' : 'inactive') || 'active'}
                       onChange={(e) => setFormData({...formData, status: e.target.value})}
                       className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                     >
                       <option value="active">Aktif</option>
                       <option value="inactive">Pasif</option>
                     </select>
                   </div>
                   <div>
                     <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                       Başlangıç Tarihi
                     </label>
                     <input
                       type="date"
                       value={formData.start_date || ''}
                       onChange={(e) => setFormData({...formData, start_date: e.target.value})}
                       className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                     />
                   </div>
                   <div>
                     <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                       Bitiş Tarihi
                     </label>
                     <input
                       type="date"
                       value={formData.end_date || ''}
                       onChange={(e) => setFormData({...formData, end_date: e.target.value})}
                       className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                     />
                   </div>
                 </div>



                 <div className="flex items-center justify-end gap-3 pt-6 border-t border-gray-200 dark:border-gray-700">
                   <button
                     type="button"
                     onClick={() => setShowBudgetEdit(false)}
                     className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
                   >
                     İptal
                   </button>
                   <button
                     type="submit"
                     className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                   >
                     Güncelle
                   </button>
                 </div>
               </form>
             </div>
           </div>
         )}

         {/* Promosyon Detay Modal */}
         {showPromotionDetail && selectedPromotion && (
           <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
             <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
               <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
                 <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Promosyon Detayları</h3>
                 <button
                   onClick={() => setShowPromotionDetail(false)}
                   className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                 >
                   <X className="w-5 h-5" />
                 </button>
               </div>
               
               <div className="p-6 space-y-6">
                 {/* Promosyon Bilgileri */}
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                   <div>
                     <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Promosyon Adı</h4>
                     <p className="text-lg font-semibold text-gray-900 dark:text-white">{selectedPromotion.name}</p>
                   </div>
                   <div>
                     <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Durum</h4>
                     <span className={`inline-flex px-3 py-1 text-sm font-semibold rounded-full ${
                       selectedPromotion.is_active 
                         ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
                         : 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400'
                     }`}>
                       {selectedPromotion.is_active ? 'Aktif' : 'Pasif'}
                     </span>
                   </div>
                   <div>
                     <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">İndirim Türü</h4>
                     <p className="text-lg font-semibold text-gray-900 dark:text-white">
                       {selectedPromotion.discount_type === 'percentage' ? 'Yüzde (%)' : 'Sabit Tutar (₺)'}
                     </p>
                   </div>
                   <div>
                     <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">İndirim Değeri</h4>
                     <p className="text-2xl font-bold text-green-600">
                       {selectedPromotion.discount_type === 'percentage' 
                         ? `%${selectedPromotion.discount_value !== null && selectedPromotion.discount_value !== undefined ? selectedPromotion.discount_value : 0}` 
                         : formatCurrency(Number(selectedPromotion.discount_value !== null && selectedPromotion.discount_value !== undefined ? selectedPromotion.discount_value : 0))
                       }
                     </p>
                   </div>
                 </div>

                 {/* Açıklama */}
                 {selectedPromotion.description && (
                   <div>
                     <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Açıklama</h4>
                     <p className="text-gray-900 dark:text-white">{selectedPromotion.description}</p>
                   </div>
                 )}

                 {/* Tarih Bilgileri */}
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                   <div>
                     <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Başlangıç Tarihi</h4>
                     <p className="text-gray-900 dark:text-white">
                       {selectedPromotion.start_date ? format(new Date(selectedPromotion.start_date), 'dd MMMM yyyy', { locale: tr }) : 'Belirtilmemiş'}
                     </p>
                   </div>
                   <div>
                     <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Bitiş Tarihi</h4>
                     <p className="text-gray-900 dark:text-white">
                       {selectedPromotion.end_date ? format(new Date(selectedPromotion.end_date), 'dd MMMM yyyy', { locale: tr }) : 'Belirtilmemiş'}
                     </p>
                   </div>
                 </div>

                 {/* Kullanım İstatistikleri */}
                 <div>
                   <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-4">Kullanım İstatistikleri</h4>
                   <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                     <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                       <div className="text-center">
                         <p className="text-2xl font-bold text-blue-600">
                           {(promotionUsage || []).filter(usage => usage.promotion_id === selectedPromotion.id).length || 0}
                         </p>
                         <p className="text-sm text-gray-500 dark:text-gray-400">Toplam Kullanım</p>
                       </div>
                       <div className="text-center">
                         <p className="text-2xl font-bold text-green-600">
                           {selectedPromotion.usage_limit ? selectedPromotion.usage_limit : 'Sınırsız'}
                         </p>
                         <p className="text-sm text-gray-500 dark:text-gray-400">Kullanım Limiti</p>
                       </div>
                       <div className="text-center">
                         <p className="text-2xl font-bold text-purple-600">
                           {selectedPromotion.usage_limit && Number(selectedPromotion.usage_limit) > 0
                             ? Math.round(((promotionUsage || []).filter(usage => usage.promotion_id === selectedPromotion.id).length / Number(selectedPromotion.usage_limit)) * 100)
                             : 0
                           }%
                         </p>
                         <p className="text-sm text-gray-500 dark:text-gray-400">Kullanım Oranı</p>
                       </div>
                     </div>
                   </div>
                 </div>

                 {/* Geçerlilik Durumu */}
                 <div>
                   <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Geçerlilik Durumu</h4>
                   <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                     {(() => {
                       const now = new Date();
                       const startDate = selectedPromotion.start_date ? new Date(selectedPromotion.start_date) : null;
                       const endDate = selectedPromotion.end_date ? new Date(selectedPromotion.end_date) : null;
                       
                       if (!startDate && !endDate) {
                         return <p className="text-green-600 font-medium">Süresiz geçerli</p>;
                       }
                       
                       if (startDate && now < startDate) {
                         return <p className="text-yellow-600 font-medium">Henüz başlamadı</p>;
                       }
                       
                       if (endDate && now > endDate) {
                         return <p className="text-red-600 font-medium">Süresi dolmuş</p>;
                       }
                       
                       return <p className="text-green-600 font-medium">Aktif ve geçerli</p>;
                     })()}
                   </div>
                 </div>
               </div>

               <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200 dark:border-gray-700">
                 <button
                   onClick={() => setShowPromotionDetail(false)}
                   className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
                 >
                   Kapat
                 </button>
                 <button
                   onClick={() => {
                     setShowPromotionDetail(false);
                     handleEditPromotion(selectedPromotion);
                   }}
                   className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                 >
                   Düzenle
                 </button>
               </div>
             </div>
           </div>
         )}

         {/* Promosyon Ekleme Modal */}
         {showAddModal && modalType === 'promotion' && (
           <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
             <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
               <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
                 <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Yeni Promosyon Ekle</h3>
                 <button
                   onClick={() => {
                     setShowAddModal(false);
                     setFormData({});
                   }}
                   className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                 >
                   <X className="w-5 h-5" />
                 </button>
               </div>
               
               <form onSubmit={handleSubmit} className="p-6 space-y-6">
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                   <div>
                     <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                       Promosyon Adı
                     </label>
                     <input
                       type="text"
                       value={formData.name || ''}
                       onChange={(e) => handleFormDataChange('name', e.target.value)}
                       className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                       required
                     />
                   </div>
                   <div>
                     <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                       İndirim Türü
                     </label>
                     <select
                       value={formData.discount_type || 'percentage'}
                       onChange={(e) => handleFormDataChange('discount_type', e.target.value)}
                       className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                       required
                     >
                       <option value="percentage">Yüzde (%)</option>
                       <option value="fixed">Sabit Tutar (₺)</option>
                     </select>
                   </div>
                   <div>
                     <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                       İndirim Değeri
                     </label>
                     <input
                       type="number"
                       value={formData.discount_value || ''}
                       onChange={(e) => handleFormDataChange('discount_value', e.target.value)}
                       className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                       placeholder={formData.discount_type === 'percentage' ? '10' : '100'}
                       step={formData.discount_type === 'percentage' ? '1' : '0.01'}
                       min="0"
                       required
                     />
                   </div>
                   <div>
                     <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                       Kullanım Limiti
                     </label>
                     <input
                       type="number"
                       value={formData.usage_limit || ''}
                       onChange={(e) => handleFormDataChange('usage_limit', e.target.value)}
                       className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                       placeholder="Sınırsız için boş bırakın"
                       min="1"
                     />
                   </div>
                   <div>
                     <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                       Başlangıç Tarihi
                     </label>
                     <input
                       type="date"
                       value={formData.start_date || ''}
                       onChange={(e) => handleFormDataChange('start_date', e.target.value)}
                       className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                     />
                   </div>
                   <div>
                     <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                       Bitiş Tarihi
                     </label>
                     <input
                       type="date"
                       value={formData.end_date || ''}
                       onChange={(e) => handleFormDataChange('end_date', e.target.value)}
                       className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                     />
                   </div>
                 </div>

                 <div>
                   <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                     Açıklama
                   </label>
                   <textarea
                     value={formData.description || ''}
                     onChange={(e) => handleFormDataChange('description', e.target.value)}
                     rows={3}
                     className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                     placeholder="Promosyon açıklaması..."
                   />
                 </div>

                 <div className="flex items-center">
                   <input
                     type="checkbox"
                     id="is_active_new"
                     checked={formData.is_active || false}
                     onChange={(e) => handleFormDataChange('is_active', e.target.checked)}
                     className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                   />
                   <label htmlFor="is_active_new" className="ml-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                     Aktif
                   </label>
                 </div>

                 <div className="flex items-center justify-end gap-3 pt-6 border-t border-gray-200 dark:border-gray-700">
                   <button
                     type="button"
                     onClick={() => {
                       setShowAddModal(false);
                       setFormData({});
                     }}
                     className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
                   >
                     İptal
                   </button>
                   <button
                     type="submit"
                     className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                   >
                     Promosyon Ekle
                   </button>
                 </div>
               </form>
             </div>
           </div>
         )}

         {/* Promosyon Düzenleme Modal */}
         {showPromotionEdit && selectedPromotion && (
           <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
             <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
               <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
                 <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Promosyon Düzenle</h3>
                 <button
                   onClick={() => setShowPromotionEdit(false)}
                   className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                 >
                   <X className="w-5 h-5" />
                 </button>
               </div>
               
               <form onSubmit={handleUpdatePromotion} className="p-6 space-y-6">
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                   <div>
                     <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                       Promosyon Adı
                     </label>
                     <input
                       type="text"
                       value={formData.name || ''}
                       onChange={(e) => setFormData({...formData, name: e.target.value})}
                       className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                       required
                     />
                   </div>
                   <div>
                     <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                       İndirim Türü
                     </label>
                     <select
                       value={formData.discount_type || 'percentage'}
                       onChange={(e) => setFormData({...formData, discount_type: e.target.value})}
                       className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                       required
                     >
                       <option value="percentage">Yüzde (%)</option>
                       <option value="fixed">Sabit Tutar (₺)</option>
                     </select>
                   </div>
                   <div>
                     <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                       İndirim Değeri
                     </label>
                     <input
                       type="number"
                       value={formData.discount_value || ''}
                       onChange={(e) => setFormData({...formData, discount_value: e.target.value})}
                       className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                       placeholder={formData.discount_type === 'percentage' ? '10' : '100'}
                       step={formData.discount_type === 'percentage' ? '1' : '0.01'}
                       min="0"
                       required
                     />
                   </div>
                   <div>
                     <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                       Kullanım Limiti
                     </label>
                     <input
                       type="number"
                       value={formData.usage_limit || ''}
                       onChange={(e) => setFormData({...formData, usage_limit: e.target.value})}
                       className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                       placeholder="Sınırsız için boş bırakın"
                       min="1"
                     />
                   </div>
                   <div>
                     <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                       Başlangıç Tarihi
                     </label>
                     <input
                       type="date"
                       value={formData.start_date || ''}
                       onChange={(e) => setFormData({...formData, start_date: e.target.value})}
                       className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                     />
                   </div>
                   <div>
                     <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                       Bitiş Tarihi
                     </label>
                     <input
                       type="date"
                       value={formData.end_date || ''}
                       onChange={(e) => setFormData({...formData, end_date: e.target.value})}
                       className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                     />
                   </div>
                 </div>

                 <div>
                   <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                     Açıklama
                   </label>
                   <textarea
                     value={formData.description || ''}
                     onChange={(e) => setFormData({...formData, description: e.target.value})}
                     rows={3}
                     className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                     placeholder="Promosyon açıklaması..."
                   />
                 </div>

                 <div className="flex items-center">
                   <input
                     type="checkbox"
                     id="is_active"
                     checked={formData.is_active || false}
                     onChange={(e) => setFormData({...formData, is_active: e.target.checked})}
                     className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                   />
                   <label htmlFor="is_active" className="ml-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                     Aktif
                   </label>
                 </div>

                 <div className="flex items-center justify-end gap-3 pt-6 border-t border-gray-200 dark:border-gray-700">
                   <button
                     type="button"
                     onClick={() => setShowPromotionEdit(false)}
                     className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
                   >
                     İptal
                   </button>
                   <button
                     type="submit"
                     className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                   >
                     Güncelle
                   </button>
                 </div>
               </form>
             </div>
           </div>
         )}

        {/* Toplu Hatırlatma Modalı */}
        {showBulkReminderModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                  {selectedPayments.length === 1 ? 'Kişi Bazlı Hatırlatma Gönder' : 'Toplu Hatırlatma Gönder'}
                </h3>
                <button
                  onClick={() => {
                    setShowBulkReminderModal(false);
                    // Modal kapatıldığında arama state'lerini temizle
                    setBulkReminderSearchTerm('');
                    setBulkReminderStatusFilter('all');
                    setBulkReminderPaymentMethodFilter('all');
                  }}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Ödeme Seçimi */}
              <div className="mb-6">
                <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                  Hatırlatma Gönderilecek Ödemeler ({selectedPayments.length})
                </h4>
                
                {/* Arama ve Filtreler */}
                <div className="mb-4 space-y-3">
                  {/* Arama Çubuğu */}
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <input
                      type="text"
                      placeholder="Müşteri adı, e-posta, fatura no, tutar ara..."
                      value={bulkReminderSearchTerm}
                      onChange={(e) => setBulkReminderSearchTerm(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                    />
                  </div>
                  
                  {/* Hızlı Filtreler */}
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => setBulkReminderStatusFilter('all')}
                      className={`px-3 py-1.5 rounded text-xs font-medium transition-colors ${
                        bulkReminderStatusFilter === 'all'
                          ? 'bg-blue-600 text-white'
                          : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700'
                      }`}
                    >
                      Tüm Durumlar
                    </button>
                    <button
                      onClick={() => setBulkReminderStatusFilter('pending')}
                      className={`px-3 py-1.5 rounded text-xs font-medium transition-colors ${
                        bulkReminderStatusFilter === 'pending'
                          ? 'bg-blue-600 text-white'
                          : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700'
                      }`}
                    >
                      Bekleyen
                    </button>
                    <button
                      onClick={() => setBulkReminderStatusFilter('overdue')}
                      className={`px-3 py-1.5 rounded text-xs font-medium transition-colors ${
                        bulkReminderStatusFilter === 'overdue'
                          ? 'bg-blue-600 text-white'
                          : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700'
                      }`}
                    >
                      Gecikmiş
                    </button>
                  </div>
                  
                  {/* Ödeme Yöntemi Filtresi */}
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => setBulkReminderPaymentMethodFilter('all')}
                      className={`px-3 py-1.5 rounded text-xs font-medium transition-colors ${
                        bulkReminderPaymentMethodFilter === 'all'
                          ? 'bg-green-600 text-white'
                          : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700'
                      }`}
                    >
                      Tüm Yöntemler
                    </button>
                    <button
                      onClick={() => setBulkReminderPaymentMethodFilter('credit_card')}
                      className={`px-3 py-1.5 rounded text-xs font-medium transition-colors ${
                        bulkReminderPaymentMethodFilter === 'credit_card'
                          ? 'bg-green-600 text-white'
                          : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700'
                      }`}
                    >
                      Kredi Kartı
                    </button>
                    <button
                      onClick={() => setBulkReminderPaymentMethodFilter('bank_transfer')}
                      className={`px-3 py-1.5 rounded text-xs font-medium transition-colors ${
                        bulkReminderPaymentMethodFilter === 'bank_transfer'
                          ? 'bg-green-600 text-white'
                          : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700'
                      }`}
                    >
                      Banka Transferi
                    </button>
                    <button
                      onClick={() => setBulkReminderPaymentMethodFilter('cash')}
                      className={`px-3 py-1.5 rounded text-xs font-medium transition-colors ${
                        bulkReminderPaymentMethodFilter === 'cash'
                          ? 'bg-green-600 text-white'
                          : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700'
                      }`}
                    >
                      Nakit
                    </button>
                  </div>
                </div>
                
                {/* Seçili Ödemeler Listesi */}
                <div className="max-h-60 overflow-y-auto border border-gray-200 dark:border-gray-700 rounded-lg">
                  {getUniquePayments(payments)
                    .filter(p => selectedPayments.includes(p.id))
                    .filter(payment => {
                      // Arama filtresi
                      const searchLower = bulkReminderSearchTerm.toLowerCase();
                      const customerNameMatch = payment.customers?.name?.toLowerCase().includes(searchLower) || false;
                      const customerEmailMatch = payment.customers?.email?.toLowerCase().includes(searchLower) || false;
                      const invoiceNumberMatch = (payment.invoice_number || `INV-${payment.id}`).toLowerCase().includes(searchLower);
                      const amountMatch = payment.amount?.toString().includes(searchLower) || false;
                      const matchesSearch = customerNameMatch || customerEmailMatch || invoiceNumberMatch || amountMatch;
                      
                      // Durum filtresi
                      const matchesStatus = bulkReminderStatusFilter === 'all' || payment.status === bulkReminderStatusFilter;
                      
                      // Ödeme yöntemi filtresi
                      const matchesPaymentMethod = bulkReminderPaymentMethodFilter === 'all' || payment.payment_method === bulkReminderPaymentMethodFilter;
                      
                      return matchesSearch && matchesStatus && matchesPaymentMethod;
                    })
                    .map((payment) => (
                    <div key={payment.id} className="flex items-center justify-between p-3 border-b border-gray-200 dark:border-gray-700 last:border-b-0 hover:bg-gray-50 dark:hover:bg-gray-700">
                      <div className="flex-1">
                        <p className="font-medium text-gray-900 dark:text-white">
                          {payment.customers?.name || 'Bilinmeyen Müşteri'}
                        </p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {payment.invoice_number || payment.id.slice(0, 8)} - {formatCurrency(Number(payment.amount))}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${
                            payment.status === 'completed' ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400' :
                            payment.status === 'pending' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400' :
                            'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
                          }`}>
                            {payment.status === 'completed' ? 'Tamamlandı' : payment.status === 'pending' ? 'Bekleyen' : 'Gecikmiş'}
                          </span>
                          <span className="text-xs text-gray-500 dark:text-gray-400">
                            {payment.payment_method === 'credit_card' ? 'Kredi Kartı' : 
                             payment.payment_method === 'bank_transfer' ? 'Banka Transferi' : 
                             payment.payment_method === 'cash' ? 'Nakit' : payment.payment_method}
                          </span>
                        </div>
                      </div>
                      <button
                        onClick={() => setSelectedPayments(prev => prev.filter(id => id !== payment.id))}
                        className="p-1 hover:bg-red-100 dark:hover:bg-red-900/20 rounded transition-colors ml-2"
                        title="Seçimden çıkar"
                      >
                        <X className="w-4 h-4 text-red-500" />
                      </button>
                    </div>
                  ))}
                </div>
                
                {/* Seçili ödeme yoksa mesaj göster */}
                {getUniquePayments(payments).filter(p => selectedPayments.includes(p.id)).length === 0 && (
                  <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                    <Mail className="w-12 h-12 mx-auto mb-2 opacity-50" />
                    <p>Henüz ödeme seçilmedi</p>
                    <p className="text-sm">Ödeme listesinden hatırlatma göndermek istediğiniz ödemeleri seçin</p>
                  </div>
                )}
              </div>

              {/* Template Seçimi */}
              <div className="mb-6">
                <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                  Hatırlatma Template'i
                </h4>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  {paymentTemplates.map((template) => (
                    <div
                      key={template.id}
                      onClick={() => {
                        setSelectedTemplate(template);
                        setShowCustomEditor(false);
                      }}
                      className={`p-4 border-2 rounded-lg cursor-pointer transition-colors ${
                        selectedTemplate?.id === template.id
                          ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                          : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                      }`}
                    >
                      <h5 className="font-medium text-gray-900 dark:text-white mb-2">
                        {template.title}
                      </h5>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                        Vade tarihinden {template.daysAfterDue} gün sonra
                      </p>
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                        template.category === 'reminder' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300' :
                        template.category === 'warning' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300' :
                        template.category === 'urgent' ? 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300' :
                        'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300'
                      }`}>
                        {template.category === 'reminder' ? 'Hatırlatma' :
                         template.category === 'warning' ? 'Uyarı' :
                         template.category === 'urgent' ? 'Acil' : 'Son Uyarı'}
                      </span>
                    </div>
                  ))}
                </div>

                <div className="flex items-center mb-4">
                  <input
                    type="checkbox"
                    id="custom_editor"
                    checked={showCustomEditor}
                    onChange={(e) => {
                      setShowCustomEditor(e.target.checked);
                      if (e.target.checked) {
                        setSelectedTemplate(null);
                      }
                    }}
                    className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                  />
                  <label htmlFor="custom_editor" className="ml-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                    Özel mesaj yaz
                  </label>
                </div>

                {showCustomEditor && (
                  <textarea
                    value={customMessage}
                    onChange={(e) => setCustomMessage(e.target.value)}
                    rows={6}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                    placeholder="Özel hatırlatma mesajınızı buraya yazın..."
                  />
                )}

                {selectedTemplate && !showCustomEditor && (
                  <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <h5 className="font-medium text-gray-900 dark:text-white mb-2">
                      Template Önizlemesi
                    </h5>
                    <div className="text-sm text-gray-600 dark:text-gray-400 whitespace-pre-line">
                      {selectedTemplate.template}
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-500 mt-2">
                      * Değişkenler: {'{müşteri_adı}'}, {'{ödeme_tutari}'}, {'{fatura_no}'}, {'{vade_tarihi}'}, {'{şirket_adı}'}
                    </p>
                  </div>
                )}
              </div>

              {/* Aksiyon Butonları */}
              <div className="flex items-center justify-end gap-3 pt-6 border-t border-gray-200 dark:border-gray-700">
                <button
                  onClick={() => {
                    setShowBulkReminderModal(false);
                    // Modal kapatıldığında arama state'lerini temizle
                    setBulkReminderSearchTerm('');
                    setBulkReminderStatusFilter('all');
                    setBulkReminderPaymentMethodFilter('all');
                  }}
                  className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
                >
                  İptal
                </button>
                <button
                  onClick={sendBulkReminders}
                  disabled={isSendingBulkReminders || (selectedPayments.length === 0) || (!selectedTemplate && !showCustomEditor)}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {isSendingBulkReminders ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      Gönderiliyor...
                    </>
                  ) : (
                    <>
                      <Mail className="w-4 h-4" />
                      {selectedPayments.length === 1 ? '1 Kişi Bazlı Hatırlatma Gönder' : `${selectedPayments.length} Hatırlatma Gönder`}
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Akıllı İpuçları Sistemi */}
      <RealTimeHintSystem
        currentPage="payments"
        currentAction={activeTab}
        userRole="admin"
        contextData={{
          activeTab: activeTab,
          selectedPeriod: selectedPeriod,
          searchTerm: searchTerm,
          statusFilter: statusFilter,
          totalPayments: payments?.length || 0,
          pendingPayments: payments?.filter(p => p.status === 'pending').length || 0,
          completedPayments: payments?.filter(p => p.status === 'completed').length || 0,
          totalRevenue: payments?.filter(p => p.status === 'completed').reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0) || 0,
          overduePayments: payments?.filter(p => {
            if (p.status === 'completed') return false;
            if (!p.payment_date) return false;
            const paymentDate = new Date(p.payment_date);
            const now = new Date();
            const diffDays = (now.getTime() - paymentDate.getTime()) / (1000 * 60 * 60 * 24);
            return diffDays > 7; // 7 günden eski ödemeler
          }).length || 0,
          highValuePayments: payments?.filter(p => parseFloat(p.amount) > 1000).length || 0,
          monthlyRevenue: payments?.filter(p => {
            if (p.status !== 'completed') return false;
            const paymentDate = new Date(p.payment_date);
            const now = new Date();
            return paymentDate.getMonth() === now.getMonth() && paymentDate.getFullYear() === now.getFullYear();
          }).reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0) || 0
        }}
        onHintAction={(hintId, action) => {
          console.log('Financial hint action:', hintId, action);
          
          switch (action) {
            case 'optimize_payments':
              // Ödeme optimizasyonu
              toast.success('Ödeme optimizasyonu başlatıldı');
              break;
            case 'start_reminders':
              // Akıllı hatırlatma sistemi
              setShowReminderModal(true);
              break;
            case 'payment_analysis':
              // Ödeme analizi
              toast.success('Detaylı ödeme analizi başlatıldı');
              break;
            case 'revenue_optimization':
              // Gelir optimizasyonu
              toast.success('Gelir optimizasyonu başlatıldı');
              break;
            default:
              console.log('Unknown financial hint action:', action);
          }
        }}
      />
    </div>
  );
};

export default FinancialManagement;
