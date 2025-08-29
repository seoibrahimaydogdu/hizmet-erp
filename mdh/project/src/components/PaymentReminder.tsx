import React, { useState, useEffect } from 'react';
import { 
  AlertTriangle, 
  Clock, 
  Send, 
  Eye, 
  Edit3,
  Calendar,
  DollarSign,
  User,
  FileText,
  CheckCircle,
  XCircle,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight
} from 'lucide-react';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';
import { toast } from 'react-hot-toast';
import { supabase } from '../lib/supabase';
import { 
  paymentTemplates, 
  PaymentTemplate, 
  fillTemplate, 
  getTemplateByDaysOverdue,
  getTemplatesByCategory,
  defaultVariables 
} from '../utils/paymentTemplates';

interface PaymentReminderProps {
  currentUser: any;
}

interface Invoice {
  id: string;
  invoice_number: string;
  customer_name: string;
  customer_email: string;
  amount: number;
  due_date: string;
  status: 'paid' | 'pending' | 'overdue';
  created_at: string;
  paid_at?: string;
}

interface ReminderHistory {
  id: string;
  invoice_id: string;
  template_id: string;
  message: string;
  sent_at: string;
  sent_by: string;
  status: 'sent' | 'failed';
}

const PaymentReminder: React.FC<PaymentReminderProps> = ({ currentUser }) => {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [reminderHistory, setReminderHistory] = useState<ReminderHistory[]>([]);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState<PaymentTemplate | null>(null);
  const [customMessage, setCustomMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showTemplatePreview, setShowTemplatePreview] = useState(false);
  const [showCustomEditor, setShowCustomEditor] = useState(false);

  // Pagination state'leri
  const [overdueCurrentPage, setOverdueCurrentPage] = useState(1);
  const [pendingCurrentPage, setPendingCurrentPage] = useState(1);
  const [historyCurrentPage, setHistoryCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(5);

  // Faturaları yükle (mevcut payments tablosundan)
  const loadInvoices = async () => {
    try {
      // Önce ödemeleri çek
      const { data: paymentsData, error: paymentsError } = await supabase
        .from('payments')
        .select('*')
        .order('created_at', { ascending: false });

      if (paymentsError) {
        console.error('Ödemeler yüklenirken hata:', paymentsError);
        toast.error('Ödemeler yüklenemedi');
        return;
      }

      // Müşteri ID'lerini topla
      const customerIds = [...new Set((paymentsData || []).map((p: any) => p.customer_id).filter(Boolean))];

      // Müşteri bilgilerini çek
      let customersData: any[] = [];
      if (customerIds.length > 0) {
        const { data: customers, error: customersError } = await supabase
          .from('customers')
          .select('id, name, email, company')
          .in('id', customerIds);

        if (customersError) {
          console.error('Müşteri bilgileri yüklenirken hata:', customersError);
        } else {
          customersData = customers || [];
        }
      }

      // Payments verilerini Invoice formatına dönüştür
      const convertedInvoices = (paymentsData || []).map((payment: any) => {
        // Müşteri bilgilerini bul
        const customer = customersData.find((c: any) => c.id === payment.customer_id);
        
        return {
          id: payment.id,
          invoice_number: payment.invoice_number || `PAY-${payment.id.slice(0, 8)}`,
          customer_name: customer?.name || customer?.company || 'Bilinmeyen Müşteri',
          customer_email: customer?.email || 'email@example.com',
          amount: parseFloat(payment.amount) || 0,
          due_date: payment.due_date || payment.created_at,
          status: (payment.status === 'completed' ? 'paid' : 
                  payment.status === 'pending' ? 'pending' : 'overdue') as 'paid' | 'pending' | 'overdue',
          created_at: payment.created_at,
          paid_at: payment.status === 'completed' ? payment.updated_at : null
        };
      });

      setInvoices(convertedInvoices);
    } catch (error) {
      console.error('Ödemeler yüklenirken hata:', error);
      toast.error('Ödemeler yüklenemedi');
    }
  };

  // Hatırlatma geçmişini yükle (geçici olarak boş bırak)
  const loadReminderHistory = async () => {
    // Şimdilik boş bırakıyoruz çünkü reminder_history tablosu henüz yok
    setReminderHistory([]);
  };

  // Gecikme gününü hesapla
  const calculateDaysOverdue = (dueDate: string): number => {
    const due = new Date(dueDate);
    const today = new Date();
    const diffTime = today.getTime() - due.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 0 ? diffDays : 0;
  };

  // Gecikme faizi hesapla
  const calculateLateFee = (amount: number, daysOverdue: number): number => {
    const dailyRate = 0.001; // %0.1 günlük faiz
    return amount * dailyRate * daysOverdue;
  };

  // Template önizlemesi oluştur
  const generatePreview = (invoice: Invoice, template: PaymentTemplate): string => {
    const daysOverdue = calculateDaysOverdue(invoice.due_date);
    const lateFee = calculateLateFee(invoice.amount, daysOverdue);
    const currentAmount = invoice.amount + lateFee;

    const variables = {
      ...defaultVariables,
      müşteri_adı: invoice.customer_name,
      ödeme_tutari: invoice.amount.toLocaleString('tr-TR'),
      fatura_no: invoice.invoice_number,
      vade_tarihi: format(new Date(invoice.due_date), 'dd.MM.yyyy', { locale: tr }),
      güncel_tutar: currentAmount.toLocaleString('tr-TR'),
      ödeme_tarihi: format(new Date(), 'dd.MM.yyyy', { locale: tr }),
      aylık_taksit: (currentAmount / 3).toLocaleString('tr-TR')
    };

    return fillTemplate(template.template, variables);
  };

  // Hatırlatma gönder
  const sendReminder = async () => {
    if (!selectedInvoice || !selectedTemplate) {
      toast.error('Lütfen fatura ve template seçin');
      return;
    }

    setIsLoading(true);

    try {
      const message = showCustomEditor ? customMessage : generatePreview(selectedInvoice, selectedTemplate);

      // 1. Müşteri bilgilerini bul
      const { data: customerData, error: customerError } = await supabase
        .from('customers')
        .select('id, name, email')
        .eq('email', selectedInvoice.customer_email)
        .single();

      if (customerError || !customerData) {
        console.error('Müşteri bulunamadı:', customerError);
        toast.error('Müşteri bilgileri bulunamadı');
        return;
      }

      // 2. Ödeme hatırlatması için ticket oluştur
      const { data: ticketData, error: ticketError } = await supabase
        .from('tickets')
        .insert({
          title: `Ödeme Hatırlatması - ${selectedInvoice.invoice_number}`,
          description: `${selectedInvoice.customer_name} için ${selectedInvoice.amount.toLocaleString('tr-TR')} TL tutarındaki ${selectedInvoice.invoice_number} numaralı faturanın ödeme hatırlatması`,
          status: 'open',
          priority: 'high',
          category: 'payment_reminder',
          ticket_type: 'reminder',
          customer_id: customerData.id,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (ticketError) {
        console.error('Ticket oluşturma hatası:', ticketError);
        toast.error('Hatırlatma ticket\'ı oluşturulamadı');
        return;
      }

      // 3. Hatırlatma mesajını ticket'a gönder
      const { error: messageError } = await supabase
        .from('ticket_messages')
        .insert({
          ticket_id: ticketData.id,
          sender_type: 'admin',
          message: message,
          message_type: 'text',
          is_internal: true, // Müşteri cevap veremesin
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });

      if (messageError) {
        console.error('Mesaj gönderme hatası:', messageError);
        toast.error('Hatırlatma mesajı gönderilemedi');
        return;
      }

      // 4. Müşteriye bildirim gönder (Canlı Destek sekmesine yönlendirmek için)
      const { error: notificationError } = await supabase
        .from('notifications')
        .insert({
          user_id: customerData.id,
          title: 'Ödeme Hatırlatması',
          message: `${selectedInvoice.invoice_number} numaralı faturanız için ödeme hatırlatması gönderildi. Canlı Destek sekmesinden detayları görüntüleyebilirsiniz.`,
          type: 'payment_reminder',
          is_read: false,
          created_at: new Date().toISOString()
        });

      console.log('Notification created for customer:', customerData.id);
      console.log('Notification type: payment_reminder');

      if (notificationError) {
        console.error('Bildirim gönderme hatası:', notificationError);
        // Bildirim hatası kritik değil, devam et
      }

      // Başarılı gönderim
      toast.success('Hatırlatma başarıyla Canlı Destek üzerinden gönderildi');
      
      // Formu temizle
      setSelectedInvoice(null);
      setSelectedTemplate(null);
      setCustomMessage('');
      setShowTemplatePreview(false);
      setShowCustomEditor(false);

    } catch (error) {
      console.error('Hatırlatma gönderilirken hata:', error);
      toast.error('Hatırlatma gönderilemedi');
    } finally {
      setIsLoading(false);
    }
  };

  // Otomatik template önerisi
  const getSuggestedTemplate = (invoice: Invoice): PaymentTemplate | null => {
    const daysOverdue = calculateDaysOverdue(invoice.due_date);
    return getTemplateByDaysOverdue(daysOverdue);
  };

  // Bileşen yüklendiğinde verileri yükle
  useEffect(() => {
    loadInvoices();
    loadReminderHistory();
  }, []);

  // Veriler değiştiğinde sayfa numaralarını sıfırla
  useEffect(() => {
    setOverdueCurrentPage(1);
    setPendingCurrentPage(1);
    setHistoryCurrentPage(1);
  }, [invoices, reminderHistory, itemsPerPage]);

  // Gecikmiş faturalar
  const overdueInvoices = invoices.filter(invoice => 
    invoice.status === 'pending' && calculateDaysOverdue(invoice.due_date) > 0
  );

  // Bekleyen faturalar
  const pendingInvoices = invoices.filter(invoice => 
    invoice.status === 'pending' && calculateDaysOverdue(invoice.due_date) === 0
  );

  // Pagination fonksiyonları
  const getPaginatedData = (data: any[], currentPage: number, itemsPerPage: number) => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return data.slice(startIndex, endIndex);
  };

  const getTotalPages = (data: any[]) => {
    return Math.ceil(data.length / itemsPerPage);
  };

  const handlePageChange = (page: number, setter: (page: number) => void) => {
    setter(page);
  };

  // Paginated data
  const paginatedOverdueInvoices = getPaginatedData(overdueInvoices, overdueCurrentPage, itemsPerPage);
  const paginatedPendingInvoices = getPaginatedData(pendingInvoices, pendingCurrentPage, itemsPerPage);
  const paginatedReminderHistory = getPaginatedData(reminderHistory, historyCurrentPage, itemsPerPage);

  // Total pages
  const totalOverduePages = getTotalPages(overdueInvoices);
  const totalPendingPages = getTotalPages(pendingInvoices);
  const totalHistoryPages = getTotalPages(reminderHistory);

  return (
    <div className="space-y-6">
             {/* Başlık */}
       <div className="flex items-center justify-between">
         <div>
           <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
             Ödeme Takibi ve Hatırlatmalar
           </h2>
           <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
             Hatırlatmalar Canlı Destek üzerinden gönderilir
           </p>
         </div>
         <div className="flex items-center space-x-4">
           <div className="flex items-center space-x-2">
             <AlertTriangle className="w-5 h-5 text-orange-500" />
             <span className="text-sm text-gray-600 dark:text-gray-400">
               {overdueInvoices.length} gecikmiş fatura
             </span>
           </div>
           <div className="flex items-center space-x-2">
             <span className="text-sm text-gray-600 dark:text-gray-400">Sayfa başına:</span>
             <select
               value={itemsPerPage}
               onChange={(e) => setItemsPerPage(Number(e.target.value))}
               className="px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300"
             >
               <option value={3}>3</option>
               <option value={5}>5</option>
               <option value={10}>10</option>
               <option value={20}>20</option>
             </select>
           </div>
         </div>
       </div>

      {/* Gecikmiş Faturalar */}
      {overdueInvoices.length > 0 && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-red-900 dark:text-red-100">
              Gecikmiş Faturalar ({overdueInvoices.length})
            </h3>
            <div className="text-sm text-red-700 dark:text-red-300">
              Sayfa {overdueCurrentPage} / {totalOverduePages}
            </div>
          </div>
          <div className="space-y-3">
            {paginatedOverdueInvoices.map((invoice) => {
              const daysOverdue = calculateDaysOverdue(invoice.due_date);
              const suggestedTemplate = getSuggestedTemplate(invoice);
              
              return (
                <div key={invoice.id} className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-red-200 dark:border-red-700">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="flex items-center space-x-2">
                        <Clock className="w-4 h-4 text-red-500" />
                        <span className="text-sm font-medium text-red-700 dark:text-red-300">
                          {daysOverdue} gün gecikmiş
                        </span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <FileText className="w-4 h-4 text-gray-500" />
                        <span className="text-sm font-medium">{invoice.invoice_number}</span>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="text-sm font-medium text-gray-900 dark:text-white">
                        {invoice.amount.toLocaleString('tr-TR')} TL
                      </span>
                      <button
                        onClick={() => {
                          setSelectedInvoice(invoice);
                          setSelectedTemplate(suggestedTemplate);
                          setShowTemplatePreview(true);
                        }}
                        className="px-3 py-1 bg-red-500 hover:bg-red-600 text-white text-sm rounded-lg transition-colors"
                      >
                        Canlı Destek Hatırlatması
                      </button>
                    </div>
                  </div>
                  <div className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                    <span>Müşteri: {invoice.customer_name}</span>
                    <span className="mx-2">•</span>
                    <span>Vade: {format(new Date(invoice.due_date), 'dd.MM.yyyy', { locale: tr })}</span>
                    {suggestedTemplate && (
                      <>
                        <span className="mx-2">•</span>
                        <span className="text-orange-600 dark:text-orange-400">
                          Önerilen: {suggestedTemplate.title}
                        </span>
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
          
          {/* Pagination Controls */}
          {totalOverduePages > 1 && (
            <div className="flex items-center justify-between mt-4 pt-4 border-t border-red-200 dark:border-red-700">
              <div className="text-sm text-red-700 dark:text-red-300">
                {overdueInvoices.length} faturadan {((overdueCurrentPage - 1) * itemsPerPage) + 1} - {Math.min(overdueCurrentPage * itemsPerPage, overdueInvoices.length)} arası gösteriliyor
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => handlePageChange(1, setOverdueCurrentPage)}
                  disabled={overdueCurrentPage === 1}
                  className="p-2 text-red-600 hover:text-red-700 disabled:text-red-400 disabled:cursor-not-allowed"
                >
                  <ChevronsLeft className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handlePageChange(overdueCurrentPage - 1, setOverdueCurrentPage)}
                  disabled={overdueCurrentPage === 1}
                  className="p-2 text-red-600 hover:text-red-700 disabled:text-red-400 disabled:cursor-not-allowed"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="px-3 py-1 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded-lg text-sm">
                  {overdueCurrentPage} / {totalOverduePages}
                </span>
                <button
                  onClick={() => handlePageChange(overdueCurrentPage + 1, setOverdueCurrentPage)}
                  disabled={overdueCurrentPage === totalOverduePages}
                  className="p-2 text-red-600 hover:text-red-700 disabled:text-red-400 disabled:cursor-not-allowed"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handlePageChange(totalOverduePages, setOverdueCurrentPage)}
                  disabled={overdueCurrentPage === totalOverduePages}
                  className="p-2 text-red-600 hover:text-red-700 disabled:text-red-400 disabled:cursor-not-allowed"
                >
                  <ChevronsRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Bekleyen Faturalar */}
      {pendingInvoices.length > 0 && (
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-yellow-900 dark:text-yellow-100">
              Bekleyen Faturalar ({pendingInvoices.length})
            </h3>
            <div className="text-sm text-yellow-700 dark:text-yellow-300">
              Sayfa {pendingCurrentPage} / {totalPendingPages}
            </div>
          </div>
          <div className="space-y-3">
            {paginatedPendingInvoices.map((invoice) => (
              <div key={invoice.id} className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-yellow-200 dark:border-yellow-700">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="flex items-center space-x-2">
                      <Calendar className="w-4 h-4 text-yellow-500" />
                      <span className="text-sm font-medium text-yellow-700 dark:text-yellow-300">
                        Vade tarihi yaklaşıyor
                      </span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <FileText className="w-4 h-4 text-gray-500" />
                      <span className="text-sm font-medium">{invoice.invoice_number}</span>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-sm font-medium text-gray-900 dark:text-white">
                      {invoice.amount.toLocaleString('tr-TR')} TL
                    </span>
                    <button
                      onClick={() => {
                        setSelectedInvoice(invoice);
                        setSelectedTemplate(paymentTemplates[0]); // İlk hatırlatma template'i
                        setShowTemplatePreview(true);
                      }}
                      className="px-3 py-1 bg-yellow-500 hover:bg-yellow-600 text-white text-sm rounded-lg transition-colors"
                    >
                      Canlı Destek Hatırlatması
                    </button>
                  </div>
                </div>
                <div className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                  <span>Müşteri: {invoice.customer_name}</span>
                  <span className="mx-2">•</span>
                  <span>Vade: {format(new Date(invoice.due_date), 'dd.MM.yyyy', { locale: tr })}</span>
                </div>
              </div>
            ))}
          </div>
          
          {/* Pagination Controls */}
          {totalPendingPages > 1 && (
            <div className="flex items-center justify-between mt-4 pt-4 border-t border-yellow-200 dark:border-yellow-700">
              <div className="text-sm text-yellow-700 dark:text-yellow-300">
                {pendingInvoices.length} faturadan {((pendingCurrentPage - 1) * itemsPerPage) + 1} - {Math.min(pendingCurrentPage * itemsPerPage, pendingInvoices.length)} arası gösteriliyor
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => handlePageChange(1, setPendingCurrentPage)}
                  disabled={pendingCurrentPage === 1}
                  className="p-2 text-yellow-600 hover:text-yellow-700 disabled:text-yellow-400 disabled:cursor-not-allowed"
                >
                  <ChevronsLeft className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handlePageChange(pendingCurrentPage - 1, setPendingCurrentPage)}
                  disabled={pendingCurrentPage === 1}
                  className="p-2 text-yellow-600 hover:text-yellow-700 disabled:text-yellow-400 disabled:cursor-not-allowed"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="px-3 py-1 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300 rounded-lg text-sm">
                  {pendingCurrentPage} / {totalPendingPages}
                </span>
                <button
                  onClick={() => handlePageChange(pendingCurrentPage + 1, setPendingCurrentPage)}
                  disabled={pendingCurrentPage === totalPendingPages}
                  className="p-2 text-yellow-600 hover:text-yellow-700 disabled:text-yellow-400 disabled:cursor-not-allowed"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handlePageChange(totalPendingPages, setPendingCurrentPage)}
                  disabled={pendingCurrentPage === totalPendingPages}
                  className="p-2 text-yellow-600 hover:text-yellow-700 disabled:text-yellow-400 disabled:cursor-not-allowed"
                >
                  <ChevronsRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Template Seçimi ve Önizleme */}
      {showTemplatePreview && selectedInvoice && (
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between mb-4">
                         <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
               Canlı Destek Hatırlatması Gönder
             </h3>
            <button
              onClick={() => setShowTemplatePreview(false)}
              className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            >
              <XCircle className="w-5 h-5" />
            </button>
          </div>

          {/* Fatura Bilgileri */}
          <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 mb-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium text-gray-700 dark:text-gray-300">Fatura No:</span>
                <span className="ml-2 text-gray-900 dark:text-white">{selectedInvoice.invoice_number}</span>
              </div>
              <div>
                <span className="font-medium text-gray-700 dark:text-gray-300">Müşteri:</span>
                <span className="ml-2 text-gray-900 dark:text-white">{selectedInvoice.customer_name}</span>
              </div>
              <div>
                <span className="font-medium text-gray-700 dark:text-gray-300">Tutar:</span>
                <span className="ml-2 text-gray-900 dark:text-white">{selectedInvoice.amount.toLocaleString('tr-TR')} TL</span>
              </div>
              <div>
                <span className="font-medium text-gray-700 dark:text-gray-300">Vade Tarihi:</span>
                <span className="ml-2 text-gray-900 dark:text-white">
                  {format(new Date(selectedInvoice.due_date), 'dd.MM.yyyy', { locale: tr })}
                </span>
              </div>
            </div>
          </div>

          {/* Template Seçimi */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Template Seçin
            </label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {paymentTemplates.map((template) => (
                <button
                  key={template.id}
                  onClick={() => setSelectedTemplate(template)}
                  className={`p-3 text-left rounded-lg border transition-colors ${
                    selectedTemplate?.id === template.id
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                      : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
                  }`}
                >
                  <div className="font-medium text-sm text-gray-900 dark:text-white">
                    {template.title}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    {template.daysAfterDue > 0 ? `${template.daysAfterDue} gün sonra` : 'Anında'}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Özel Mesaj Düzenleyici */}
          <div className="mb-4">
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Mesaj İçeriği
              </label>
              <button
                onClick={() => setShowCustomEditor(!showCustomEditor)}
                className="flex items-center space-x-1 text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300"
              >
                <Edit3 className="w-4 h-4" />
                <span>{showCustomEditor ? 'Template Kullan' : 'Özel Düzenle'}</span>
              </button>
            </div>
            
            {showCustomEditor ? (
              <textarea
                value={customMessage}
                onChange={(e) => setCustomMessage(e.target.value)}
                placeholder="Özel mesajınızı yazın..."
                className="w-full h-48 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              />
            ) : (
              <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 border border-gray-200 dark:border-gray-600">
                <pre className="text-sm text-gray-900 dark:text-white whitespace-pre-wrap font-sans">
                  {selectedTemplate ? generatePreview(selectedInvoice, selectedTemplate) : 'Template seçin...'}
                </pre>
              </div>
            )}
          </div>

          {/* Gönder Butonu */}
          <div className="flex justify-end space-x-3">
            <button
              onClick={() => setShowTemplatePreview(false)}
              className="px-4 py-2 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              İptal
            </button>
            <button
              onClick={sendReminder}
              disabled={isLoading || !selectedTemplate}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-400 text-white rounded-lg transition-colors"
            >
              <Send className="w-4 h-4" />
                             <span>{isLoading ? 'Gönderiliyor...' : 'Canlı Destek\'e Gönder'}</span>
            </button>
          </div>
        </div>
      )}

      {/* Hatırlatma Geçmişi */}
      {reminderHistory.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Hatırlatma Geçmişi ({reminderHistory.length})
            </h3>
            <div className="text-sm text-gray-600 dark:text-gray-400">
              Sayfa {historyCurrentPage} / {totalHistoryPages}
            </div>
          </div>
          <div className="space-y-3">
            {paginatedReminderHistory.map((reminder) => {
              const invoice = invoices.find(inv => inv.id === reminder.invoice_id);
              const template = paymentTemplates.find(t => t.id === reminder.template_id);
              
              return (
                <div key={reminder.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    <div>
                      <div className="text-sm font-medium text-gray-900 dark:text-white">
                        {invoice?.invoice_number} - {invoice?.customer_name}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        {template?.title} • {format(new Date(reminder.sent_at), 'dd.MM.yyyy HH:mm', { locale: tr })}
                      </div>
                    </div>
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    {reminder.status === 'sent' ? 'Gönderildi' : 'Başarısız'}
                  </div>
                </div>
              );
            })}
          </div>
          
          {/* Pagination Controls */}
          {totalHistoryPages > 1 && (
            <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
              <div className="text-sm text-gray-600 dark:text-gray-400">
                {reminderHistory.length} hatırlatmadan {((historyCurrentPage - 1) * itemsPerPage) + 1} - {Math.min(historyCurrentPage * itemsPerPage, reminderHistory.length)} arası gösteriliyor
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => handlePageChange(1, setHistoryCurrentPage)}
                  disabled={historyCurrentPage === 1}
                  className="p-2 text-gray-600 hover:text-gray-700 disabled:text-gray-400 disabled:cursor-not-allowed"
                >
                  <ChevronsLeft className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handlePageChange(historyCurrentPage - 1, setHistoryCurrentPage)}
                  disabled={historyCurrentPage === 1}
                  className="p-2 text-gray-600 hover:text-gray-700 disabled:text-gray-400 disabled:cursor-not-allowed"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="px-3 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg text-sm">
                  {historyCurrentPage} / {totalHistoryPages}
                </span>
                <button
                  onClick={() => handlePageChange(historyCurrentPage + 1, setHistoryCurrentPage)}
                  disabled={historyCurrentPage === totalHistoryPages}
                  className="p-2 text-gray-600 hover:text-gray-700 disabled:text-gray-400 disabled:cursor-not-allowed"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handlePageChange(totalHistoryPages, setHistoryCurrentPage)}
                  disabled={historyCurrentPage === totalHistoryPages}
                  className="p-2 text-gray-600 hover:text-gray-700 disabled:text-gray-400 disabled:cursor-not-allowed"
                >
                  <ChevronsRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default PaymentReminder;
