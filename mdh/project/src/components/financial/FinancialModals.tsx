import React from 'react';
import { X, DollarSign, CreditCard, Calendar, FileText, Mail, Edit, Plus, ChevronDown, Download } from 'lucide-react';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';
import { formatCurrency } from '../../lib/currency';

interface FinancialModalsProps {
  showInvoiceModal: boolean;
  showReminderModal: boolean;
  showPaymentEdit: boolean;
  showAddPaymentModal: boolean;
  selectedPayment: any;
  editingPayment: any;
  formData: any;
  customers: any[];
  onCloseInvoiceModal: () => void;
  onCloseReminderModal: () => void;
  onClosePaymentEdit: () => void;
  onCloseAddPaymentModal: () => void;
  onUpdatePayment: (e: React.FormEvent) => void;
  onCreatePayment: (e: React.FormEvent) => void;
  onSendReminder: () => void;
  onFormDataChange: (field: string, value: any) => void;
}

const FinancialModals = ({
  showInvoiceModal,
  showReminderModal,
  showPaymentEdit,
  showAddPaymentModal,
  selectedPayment,
  editingPayment,
  formData,
  customers,
  onCloseInvoiceModal,
  onCloseReminderModal,
  onClosePaymentEdit,
  onCloseAddPaymentModal,
  onUpdatePayment,
  onCreatePayment,
  onSendReminder,
  onFormDataChange
}: FinancialModalsProps) => {
  
  const getPaymentMethodText = (method: string) => {
    switch (method) {
      case 'credit_card':
        return 'Credit Card';
      case 'Credit Card':
        return 'Credit Card';
      case 'bank_transfer':
        return 'Banka Transferi';
      case 'cash':
        return 'Nakit';
      case 'check':
        return 'Çek';
      default:
        return method;
    }
  };
  return (
    <>
      {/* Yeni Ödeme Modal */}
      {showAddPaymentModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center p-6 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                <Plus className="w-5 h-5" />
                Yeni Ödeme
              </h2>
              <button
                onClick={onCloseAddPaymentModal}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <form onSubmit={(e) => {
              e.preventDefault();
              console.log('Form data before submission:', formData);
              onCreatePayment(e);
            }} className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Müşteri
                  </label>
                  <div className="relative">
                    <select
                      value={formData.customer_id || ''}
                      onChange={(e) => onFormDataChange('customer_id', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white appearance-none"
                    >
                      <option value="">Müşteri seçin</option>
                      {customers.map((customer) => (
                        <option key={customer.id} value={customer.id}>
                          {customer.name}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 pointer-events-none" />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Para Birimi
                  </label>
                  <select
                    value={formData.currency || 'TRY'}
                    onChange={(e) => onFormDataChange('currency', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                    required
                  >
                    <option value="TRY">Türk Lirası (₺)</option>
                    <option value="USD">Amerikan Doları ($)</option>
                    <option value="EUR">Euro (€)</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Tutar
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">
                      {formData.currency === 'USD' ? '$' : formData.currency === 'EUR' ? '€' : '₺'}
                    </span>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.amount || ''}
                      onChange={(e) => onFormDataChange('amount', e.target.value)}
                      className="w-full pl-8 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                      placeholder="0.00"
                      required
                    />
                  </div>
                  {/* Tutar önizleme */}
                  {formData.amount && (
                    <div className="mt-2 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                      <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Tutar Önizleme:</div>
                      <div className="flex justify-between items-center">
                        <span className="text-lg font-semibold text-blue-600 dark:text-blue-400">
                          {(() => {
                            const amount = Number(formData.amount) || 0;
                            const currency = formData.currency || 'TRY';
                            const symbol = currency === 'USD' ? '$' : currency === 'EUR' ? '€' : '₺';
                            
                            // Komisyon hesaplama seçeneğine göre tutar hesaplama
                            let displayAmount = amount;
                            if (formData.payment_method && formData.payment_method !== 'cash' && formData.commission_type === 'added') {
                              const commissionRate = formData.payment_method === 'Credit Card' ? 0.025 : 
                                                   formData.payment_method === 'bank_transfer' ? 0.01 : 
                                                   formData.payment_method === 'check' ? 0.015 : 0;
                              displayAmount = amount * (1 + commissionRate);
                            }
                            
                            return formatCurrency(displayAmount, currency);
                          })()}
                        </span>
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          {(() => {
                            const amount = Number(formData.amount) || 0;
                            const currency = formData.currency || 'TRY';
                            const symbol = currency === 'USD' ? '$' : currency === 'EUR' ? '€' : '₺';
                            
                            // Para birimine göre KDV oranı belirleme
                            let vatRate = 0.20; // Varsayılan %20
                            if (currency === 'USD') {
                              vatRate = 0.05; // %5 KDV
                            } else if (currency === 'EUR') {
                              vatRate = 0.20; // %20 KDV
                            }
                            
                            const netAmount = amount / (1 + vatRate);
                            const vatAmount = amount - netAmount;
                            const vatPercentage = Math.round(vatRate * 100);
                            
                            return (
                              <>
                                <div>Net Fiyat: {formatCurrency(netAmount, currency)}</div>
                                <div>Vergi Kesintisi (%{vatPercentage}): {formatCurrency(vatAmount, currency)}</div>
                              </>
                            );
                          })()}
                          {formData.payment_method && formData.payment_method !== 'cash' && (
                            <div className="text-orange-600 dark:text-orange-400">
                              {(() => {
                                const amount = Number(formData.amount) || 0;
                                const commissionRate = formData.payment_method === 'Credit Card' ? 0.025 : 
                                                     formData.payment_method === 'bank_transfer' ? 0.01 : 
                                                     formData.payment_method === 'check' ? 0.015 : 0;
                                
                                if (formData.commission_type === 'included') {
                                  const netAmount = amount / (1 + commissionRate);
                                  const commissionAmount = amount - netAmount;
                                  const symbol = formData.currency === 'USD' ? '$' : formData.currency === 'EUR' ? '€' : '₺';
                                  return `Net: ${symbol}${netAmount.toFixed(2)} (Komisyon: ${symbol}${commissionAmount.toFixed(2)})`;
                                } else {
                                  const totalAmount = amount * (1 + commissionRate);
                                  const commissionAmount = totalAmount - amount;
                                  const symbol = formData.currency === 'USD' ? '$' : formData.currency === 'EUR' ? '€' : '₺';
                                  return `Toplam: ${symbol}${totalAmount.toFixed(2)} (Komisyon: ${symbol}${commissionAmount.toFixed(2)})`;
                                }
                              })()}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Ödeme Yöntemi
                  </label>
                  <select
                    value={formData.payment_method || ''}
                    onChange={(e) => onFormDataChange('payment_method', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                    required
                  >
                    <option value="">Seçiniz</option>
                    <option value="Credit Card">Kredi Kartı (%2.5 komisyon)</option>
                    <option value="bank_transfer">Banka Transferi (%1 komisyon)</option>
                    <option value="cash">Nakit (Komisyon yok)</option>
                    <option value="check">Çek (%1.5 komisyon)</option>
                  </select>
                </div>
                
                {/* Komisyon Hesaplama Seçeneği */}
                {formData.payment_method && formData.payment_method !== 'cash' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Komisyon Hesaplama
                    </label>
                    <div className="space-y-2">
                      <label className="flex items-center">
                        <input
                          type="radio"
                          name="commission_type"
                          value="included"
                          checked={formData.commission_type === 'included'}
                          onChange={(e) => onFormDataChange('commission_type', e.target.value)}
                          className="mr-2"
                        />
                        <span className="text-sm text-gray-700 dark:text-gray-300">
                          Komisyonu içinden al (Örn: 1000$ → 975$ net)
                        </span>
                      </label>
                      <label className="flex items-center">
                        <input
                          type="radio"
                          name="commission_type"
                          value="added"
                          checked={formData.commission_type === 'added'}
                          onChange={(e) => onFormDataChange('commission_type', e.target.value)}
                          className="mr-2"
                        />
                        <span className="text-sm text-gray-700 dark:text-gray-300">
                          Komisyonu üstüne ekle (Örn: 1000$ → 1025$ toplam)
                        </span>
                      </label>
                    </div>
                  </div>
                )}
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Durum
                  </label>
                  <select
                    value={formData.status || ''}
                    onChange={(e) => onFormDataChange('status', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                    required
                  >
                    <option value="">Seçiniz</option>
                    <option value="pending">Bekliyor</option>
                    <option value="completed">Tamamlandı</option>
                    <option value="overdue">Gecikmiş</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Ödeme Tarihi
                  </label>
                  <input
                    type="date"
                    value={formData.payment_date || ''}
                    onChange={(e) => onFormDataChange('payment_date', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Vade Tarihi
                  </label>
                  <input
                    type="date"
                    value={formData.due_date || ''}
                    onChange={(e) => onFormDataChange('due_date', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  />
                </div>
              </div>
              
              <div className="mt-6">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Notlar
                </label>
                <textarea
                  rows={3}
                  value={formData.notes || ''}
                  onChange={(e) => onFormDataChange('notes', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  placeholder="Ödeme ile ilgili notlar..."
                />
              </div>
              
              <div className="flex justify-end gap-3 mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
                <button
                  type="button"
                  onClick={onCloseAddPaymentModal}
                  className="px-4 py-2 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  Ödeme Oluştur
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Fatura Görüntüleme Modal */}
      {showInvoiceModal && selectedPayment && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center p-6 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                <FileText className="w-5 h-5" />
                Fatura Detayı
              </h2>
              <button
                onClick={onCloseInvoiceModal}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Müşteri Bilgileri</h3>
                  <div className="space-y-3">
                    <div>
                      <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Müşteri Adı</label>
                      <p className="text-gray-900 dark:text-white">{selectedPayment.customers?.name || 'Bilinmeyen Müşteri'}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500 dark:text-gray-400">E-posta</label>
                      <p className="text-gray-900 dark:text-white">{selectedPayment.customers?.email || 'E-posta yok'}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Fatura No</label>
                      <p className="text-gray-900 dark:text-white">{selectedPayment.id}</p>
                    </div>
                  </div>
                </div>
                
                <div>
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Ödeme Bilgileri</h3>
                  <div className="space-y-3">
                    <div>
                      <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Tutar</label>
                      <p className="text-2xl font-bold text-gray-900 dark:text-white">{formatCurrency(selectedPayment.amount || 0)}</p>
                    </div>
                                         <div>
                       <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Ödeme Yöntemi</label>
                       <p className="text-gray-900 dark:text-white">{getPaymentMethodText(selectedPayment.payment_method)}</p>
                     </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Durum</label>
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        selectedPayment.status === 'completed' 
                          ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
                          : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400'
                      }`}>
                        {selectedPayment.status === 'completed' ? 'Tamamlandı' : 'Beklemede'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Tarih Bilgileri</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Ödeme Tarihi</label>
                    <p className="text-gray-900 dark:text-white">
                      {selectedPayment.payment_date ? format(new Date(selectedPayment.payment_date), 'dd MMMM yyyy', { locale: tr }) : 'Belirtilmemiş'}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Vade Tarihi</label>
                    <p className="text-gray-900 dark:text-white">
                      {selectedPayment.due_date ? format(new Date(selectedPayment.due_date), 'dd MMMM yyyy', { locale: tr }) : 'Belirtilmemiş'}
                    </p>
                  </div>
                </div>
              </div>
              
              {selectedPayment.notes && (
                <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Notlar</h3>
                  <p className="text-gray-700 dark:text-gray-300">{selectedPayment.notes}</p>
                </div>
              )}
            </div>
            
            <div className="flex justify-end gap-3 p-6 border-t border-gray-200 dark:border-gray-700">
              <button
                onClick={onCloseInvoiceModal}
                className="px-4 py-2 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                Kapat
              </button>
              <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2">
                <FileText className="w-4 h-4" />
                PDF İndir
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Hatırlatma Gönderme Modal */}
      {showReminderModal && selectedPayment && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-md w-full mx-4">
            <div className="flex justify-between items-center p-6 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                <Mail className="w-5 h-5" />
                Hatırlatma Gönder
              </h2>
              <button
                onClick={onCloseReminderModal}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <div className="p-6">
              <div className="mb-4">
                <p className="text-gray-700 dark:text-gray-300">
                  <strong>{selectedPayment.customers?.name}</strong> adlı müşteriye ödeme hatırlatması gönderilecek.
                </p>
              </div>
              
              <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 mb-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Tutar:</span>
                                      <span className="font-semibold text-gray-900 dark:text-white">{formatCurrency(selectedPayment.amount || 0)}</span>
                </div>
                <div className="flex justify-between items-center mt-2">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Vade Tarihi:</span>
                  <span className="font-semibold text-gray-900 dark:text-white">
                    {selectedPayment.due_date ? format(new Date(selectedPayment.due_date), 'dd MMM yyyy', { locale: tr }) : 'Belirtilmemiş'}
                  </span>
                </div>
              </div>
              
              <div className="space-y-3">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  E-posta Konusu
                </label>
                <input
                  type="text"
                  defaultValue="Ödeme Hatırlatması"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                />
                
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Mesaj
                </label>
                <textarea
                  rows={4}
                  defaultValue={`Sayın ${selectedPayment.customers?.name},

${selectedPayment.due_date ? `Vade tarihi ${format(new Date(selectedPayment.due_date), 'dd MMMM yyyy', { locale: tr })} olan` : ''} ${formatCurrency(selectedPayment.amount || 0)} tutarındaki ödemenizi henüz alamadık.

Lütfen ödemenizi en kısa sürede tamamlayınız.

Teşekkürler.`}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                />
              </div>
            </div>
            
            <div className="flex justify-end gap-3 p-6 border-t border-gray-200 dark:border-gray-700">
              <button
                onClick={onCloseReminderModal}
                className="px-4 py-2 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                İptal
              </button>
              <button
                onClick={onSendReminder}
                className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 flex items-center gap-2"
              >
                <Mail className="w-4 h-4" />
                Hatırlatma Gönder
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Ödeme Düzenleme Modal */}
      {showPaymentEdit && editingPayment && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center p-6 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                <Edit className="w-5 h-5" />
                Ödeme Düzenle
              </h2>
              <button
                onClick={onClosePaymentEdit}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <form onSubmit={onUpdatePayment} className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Müşteri
                  </label>
                  <div className="relative">
                    <select
                      value={formData.customer_id || ''}
                      onChange={(e) => onFormDataChange('customer_id', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white appearance-none"
                    >
                      <option value="">Müşteri seçin</option>
                      {customers.map((customer) => (
                        <option key={customer.id} value={customer.id}>
                          {customer.name}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 pointer-events-none" />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Para Birimi
                  </label>
                  <select
                    value={formData.currency || 'TRY'}
                    onChange={(e) => onFormDataChange('currency', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  >
                    <option value="TRY">Türk Lirası (₺)</option>
                    <option value="USD">Amerikan Doları ($)</option>
                    <option value="EUR">Euro (€)</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Tutar
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">
                      {formData.currency === 'USD' ? '$' : formData.currency === 'EUR' ? '€' : '₺'}
                    </span>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.amount || ''}
                      onChange={(e) => onFormDataChange('amount', e.target.value)}
                      className="w-full pl-8 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                      placeholder="0.00"
                    />
                  </div>
                  {/* Tutar önizleme */}
                  {formData.amount && (
                    <div className="mt-2 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                      <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Tutar Önizleme:</div>
                      <div className="flex justify-between items-center">
                        <span className="text-lg font-semibold text-blue-600 dark:text-blue-400">
                          {(() => {
                            const amount = Number(formData.amount) || 0;
                            const currency = formData.currency || 'TRY';
                            const symbol = currency === 'USD' ? '$' : currency === 'EUR' ? '€' : '₺';
                            
                            // Komisyon hesaplama seçeneğine göre tutar hesaplama
                            let displayAmount = amount;
                            if (formData.payment_method && formData.payment_method !== 'cash' && formData.commission_type === 'added') {
                              const commissionRate = formData.payment_method === 'Credit Card' ? 0.025 : 
                                                   formData.payment_method === 'bank_transfer' ? 0.01 : 
                                                   formData.payment_method === 'check' ? 0.015 : 0;
                              displayAmount = amount * (1 + commissionRate);
                            }
                            
                            const formattedAmount = displayAmount % 1 === 0 ? displayAmount.toLocaleString() : displayAmount.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
                            return `${symbol}${formattedAmount}`;
                          })()}
                        </span>
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          {(() => {
                            const amount = Number(formData.amount) || 0;
                            const currency = formData.currency || 'TRY';
                            const symbol = currency === 'USD' ? '$' : currency === 'EUR' ? '€' : '₺';
                            
                            // Para birimine göre KDV oranı belirleme
                            let vatRate = 0.20; // Varsayılan %20
                            if (currency === 'USD') {
                              vatRate = 0.05; // %5 KDV
                            } else if (currency === 'EUR') {
                              vatRate = 0.20; // %20 KDV
                            }
                            
                            const netAmount = amount / (1 + vatRate);
                            const vatAmount = amount - netAmount;
                            const vatPercentage = Math.round(vatRate * 100);
                            
                            return (
                              <>
                                <div>Net Fiyat: {formatCurrency(netAmount, currency)}</div>
                                <div>Vergi Kesintisi (%{vatPercentage}): {formatCurrency(vatAmount, currency)}</div>
                              </>
                            );
                          })()}
                          {formData.payment_method && formData.payment_method !== 'cash' && (
                            <div className="text-orange-600 dark:text-orange-400">
                              {(() => {
                                const amount = Number(formData.amount) || 0;
                                const commissionRate = formData.payment_method === 'Credit Card' ? 0.025 : 
                                                     formData.payment_method === 'bank_transfer' ? 0.01 : 
                                                     formData.payment_method === 'check' ? 0.015 : 0;
                                
                                if (formData.commission_type === 'included') {
                                  const netAmount = amount / (1 + commissionRate);
                                  const commissionAmount = amount - netAmount;
                                  const symbol = formData.currency === 'USD' ? '$' : formData.currency === 'EUR' ? '€' : '₺';
                                  return `Net: ${symbol}${netAmount.toFixed(2)} (Komisyon: ${symbol}${commissionAmount.toFixed(2)})`;
                                } else {
                                  const totalAmount = amount * (1 + commissionRate);
                                  const commissionAmount = totalAmount - amount;
                                  const symbol = formData.currency === 'USD' ? '$' : formData.currency === 'EUR' ? '€' : '₺';
                                  return `Toplam: ${symbol}${totalAmount.toFixed(2)} (Komisyon: ${symbol}${commissionAmount.toFixed(2)})`;
                                }
                              })()}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Ödeme Yöntemi
                  </label>
                  <select
                    value={formData.payment_method || ''}
                    onChange={(e) => onFormDataChange('payment_method', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  >
                    <option value="">Seçiniz</option>
                    <option value="Credit Card">Kredi Kartı (%2.5 komisyon)</option>
                    <option value="bank_transfer">Banka Transferi (%1 komisyon)</option>
                    <option value="cash">Nakit (Komisyon yok)</option>
                    <option value="check">Çek (%1.5 komisyon)</option>
                  </select>
                </div>
                
                {/* Komisyon Hesaplama Seçeneği - Düzenleme Modal */}
                {formData.payment_method && formData.payment_method !== 'cash' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Komisyon Hesaplama
                    </label>
                    <div className="space-y-2">
                      <label className="flex items-center">
                        <input
                          type="radio"
                          name="commission_type_edit"
                          value="included"
                          checked={formData.commission_type === 'included'}
                          onChange={(e) => onFormDataChange('commission_type', e.target.value)}
                          className="mr-2"
                        />
                        <span className="text-sm text-gray-700 dark:text-gray-300">
                          Komisyonu içinden al (Örn: 1000$ → 975$ net)
                        </span>
                      </label>
                      <label className="flex items-center">
                        <input
                          type="radio"
                          name="commission_type_edit"
                          value="added"
                          checked={formData.commission_type === 'added'}
                          onChange={(e) => onFormDataChange('commission_type', e.target.value)}
                          className="mr-2"
                        />
                        <span className="text-sm text-gray-700 dark:text-gray-300">
                          Komisyonu üstüne ekle (Örn: 1000$ → 1025$ toplam)
                        </span>
                      </label>
                    </div>
                  </div>
                )}
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Durum
                  </label>
                  <select
                    value={formData.status || ''}
                    onChange={(e) => onFormDataChange('status', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  >
                    <option value="">Seçiniz</option>
                    <option value="completed">Tamamlandı</option>
                    <option value="pending">Beklemede</option>
                    <option value="overdue">Gecikmiş</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Ödeme Tarihi
                  </label>
                  <input
                    type="date"
                    value={formData.payment_date || ''}
                    onChange={(e) => onFormDataChange('payment_date', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Vade Tarihi
                  </label>
                  <input
                    type="date"
                    value={formData.due_date || ''}
                    onChange={(e) => onFormDataChange('due_date', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  />
                </div>
              </div>
              
              <div className="mt-6">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Notlar
                </label>
                <textarea
                  rows={3}
                  value={formData.notes || ''}
                  onChange={(e) => onFormDataChange('notes', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  placeholder="Ödeme ile ilgili notlar..."
                />
              </div>
              
              <div className="flex justify-end gap-3 mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
                <button
                  type="button"
                  onClick={onClosePaymentEdit}
                  className="px-4 py-2 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2"
                >
                  <Edit className="w-4 h-4" />
                  Güncelle
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};

export default FinancialModals;
