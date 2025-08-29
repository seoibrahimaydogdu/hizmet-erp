import React, { useState, useEffect } from 'react';
import { X, Plus, User, FileText, Tag, AlertTriangle, Clock, Users, TrendingUp } from 'lucide-react';
import { useSupabase } from '../hooks/useSupabase';
import { toast } from 'react-hot-toast';

import FileUpload from './FileUpload';
import TicketTemplates from './TicketTemplates';
import FAQIntegration from './FAQIntegration';

import PriorityWizard from './PriorityWizard';
import RichTextEditor from './RichTextEditor';

interface CreateTicketProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  customerData?: any; // Müşteri portalı için opsiyonel
}

const CreateTicket: React.FC<CreateTicketProps> = ({ isOpen, onClose, onSuccess, customerData }) => {
  const { customers, agents, createTicket, tickets } = useSupabase();

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'general',
    priority: 'medium',
    customer_id: customerData?.id || '',
    agent_id: ''
  });

  const [loading, setLoading] = useState(false);
  const [queueStatus, setQueueStatus] = useState({
    position: 0,
    totalInQueue: 0,
    estimatedTime: '',
    avgResponseTime: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title || (!formData.customer_id && !customerData?.id)) {
      toast.error('Başlık ve müşteri seçimi zorunludur');
      return;
    }

    setLoading(true);
    try {
      const ticketData = {
        ...formData,
        customer_id: customerData?.id || formData.customer_id
      };

      await createTicket(ticketData);
      toast.success('Talep başarıyla oluşturuldu');
      resetForm();
      onSuccess();
      onClose();
    } catch (error) {
      toast.error('Talep oluşturulurken hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      category: 'general',
      priority: 'medium',
      customer_id: customerData?.id || '',
      agent_id: ''
    });
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };



  // Şablon seçimi işleyicisi
  const handleTemplateSelect = (template: any) => {
    setFormData(prev => ({
      ...prev,
      category: template.category,
      description: template.sections.map((section: any) => 
        `${section.title}:\n${section.placeholder}`
      ).join('\n\n')
    }));
    
    toast.success(`${template.title} şablonu uygulandı`);
  };

  // Dosya değişikliği işleyicisi (şu an kullanılmıyor)
  const handleFilesChange = (files: File[]) => {
    console.log('Files selected:', files);
  };

  // Öncelik değişikliği işleyicisi
  const handlePriorityChange = (priority: string) => {
    setFormData(prev => ({
      ...prev,
      priority
    }));
  };





  // Sıra durumu hesaplama fonksiyonu
  const calculateQueueStatus = () => {
    if (!customerData) return;

    // Açık talepleri filtrele (öncelik sırasına göre)
    const openTickets = tickets.filter(t => 
      t.status === 'open' || t.status === 'in_progress'
    ).sort((a, b) => {
      // Öncelik sıralaması: urgent > high > medium > low
      const priorityOrder = { urgent: 4, high: 3, medium: 2, low: 1 };
      const aPriority = priorityOrder[a.priority as keyof typeof priorityOrder] || 1;
      const bPriority = priorityOrder[b.priority as keyof typeof priorityOrder] || 1;
      
      if (aPriority !== bPriority) {
        return bPriority - aPriority; // Yüksek öncelik önce
      }
      
      // Aynı öncelik seviyesinde oluşturulma tarihine göre
      return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
    });

    // Müşterinin mevcut açık taleplerini say (gelecekte kullanım için)
    
    // Yeni talep için tahmini sıra pozisyonu
    const selectedPriority = formData.priority;
    const priorityOrder = { urgent: 4, high: 3, medium: 2, low: 1 };
    const newTicketPriority = priorityOrder[selectedPriority as keyof typeof priorityOrder] || 2;
    
    // Aynı veya daha yüksek öncelikte kaç talep var
    const higherPriorityTickets = openTickets.filter(t => {
      const tPriority = priorityOrder[t.priority as keyof typeof priorityOrder] || 1;
      return tPriority >= newTicketPriority;
    });

    const position = higherPriorityTickets.length + 1;
    const totalInQueue = openTickets.length + 1;

    // Ortalama yanıt süresi hesapla (son 30 talep)
    const recentTickets = tickets
      .filter(t => t.status === 'resolved' || t.status === 'closed')
      .sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())
      .slice(0, 30);

    let avgResponseHours = 24; // Varsayılan
    if (recentTickets.length > 0) {
      const totalResponseTime = recentTickets.reduce((sum, ticket) => {
        const created = new Date(ticket.created_at).getTime();
        const updated = new Date(ticket.updated_at).getTime();
        return sum + (updated - created);
      }, 0);
      
      avgResponseHours = Math.round((totalResponseTime / recentTickets.length) / (1000 * 60 * 60));
    }

    // Tahmini yanıt süresi hesapla
    let estimatedHours = avgResponseHours;
    if (selectedPriority === 'urgent') {
      estimatedHours = Math.max(1, Math.round(avgResponseHours * 0.25));
    } else if (selectedPriority === 'high') {
      estimatedHours = Math.max(2, Math.round(avgResponseHours * 0.5));
    } else if (selectedPriority === 'medium') {
      estimatedHours = avgResponseHours;
    } else {
      estimatedHours = Math.round(avgResponseHours * 1.5);
    }

    // Çevrimiçi temsilci sayısına göre ayarla
    const onlineAgents = agents.filter(a => a.status === 'online').length;
    if (onlineAgents === 0) {
      estimatedHours += 4; // Çevrimiçi temsilci yoksa 4 saat ekle
    } else if (onlineAgents === 1) {
      estimatedHours = Math.round(estimatedHours * 1.2);
    }

    const formatTime = (hours: number) => {
      if (hours < 1) return '1 saat içinde';
      if (hours < 24) return `${hours} saat içinde`;
      const days = Math.ceil(hours / 24);
      return `${days} gün içinde`;
    };

    setQueueStatus({
      position,
      totalInQueue,
      estimatedTime: formatTime(estimatedHours),
      avgResponseTime: formatTime(avgResponseHours)
    });
  };

  // Sıra durumunu güncelle
  useEffect(() => {
    if (isOpen && customerData) {
      calculateQueueStatus();
    }
  }, [isOpen, customerData, formData.priority, tickets, agents]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
              <Plus className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Yeni Talep Oluştur</h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">Müşteri talebi oluşturun</p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Sıra Durumu (Sadece müşteri portalında göster) */}
          {customerData && (
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-6 mb-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                  <Users className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Destek Sırası Durumu
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Talebinizin işlem sırası ve tahmini yanıt süresi
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                {/* Sıra Pozisyonu */}
                <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-orange-100 dark:bg-orange-900/30 rounded-lg">
                      <TrendingUp className="w-4 h-4 text-orange-600 dark:text-orange-400" />
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-gray-900 dark:text-white">
                        #{queueStatus.position}
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        Sıradaki Konum
                      </div>
                    </div>
                  </div>
                </div>

                {/* Toplam Sıra */}
                <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                      <Users className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-gray-900 dark:text-white">
                        {queueStatus.totalInQueue}
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        Toplam Talep
                      </div>
                    </div>
                  </div>
                </div>

                {/* Tahmini Süre */}
                <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                      <Clock className="w-4 h-4 text-green-600 dark:text-green-400" />
                    </div>
                    <div>
                      <div className="text-lg font-bold text-gray-900 dark:text-white">
                        {queueStatus.estimatedTime}
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        Tahmini Yanıt
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Açıklama Metinleri */}
              <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 space-y-3">
                <h4 className="font-medium text-gray-900 dark:text-white flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  Sıralama Nasıl Çalışır?
                </h4>
                <div className="text-sm text-gray-700 dark:text-gray-300 space-y-2">
                  <div className="flex items-start gap-2">
                    <span className="text-blue-600 dark:text-blue-400 font-medium">•</span>
                    <span>
                      <strong>Öncelik Sıralaması:</strong> Acil &gt; Yüksek &gt; Orta &gt; Düşük öncelik sırasına göre
                    </span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-blue-600 dark:text-blue-400 font-medium">•</span>
                    <span>
                      <strong>Oluşturulma Zamanı:</strong> Aynı öncelik seviyesinde ilk gelen önce işlenir
                    </span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-blue-600 dark:text-blue-400 font-medium">•</span>
                    <span>
                      <strong>Temsilci Durumu:</strong> {agents.filter(a => a.status === 'online').length} temsilci çevrimiçi
                      {agents.filter(a => a.status === 'online').length === 0 && 
                        <span className="text-orange-600 dark:text-orange-400 ml-1">(Yanıt süresi artabilir)</span>
                      }
                    </span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-blue-600 dark:text-blue-400 font-medium">•</span>
                    <span>
                      <strong>Ortalama Yanıt Süresi:</strong> Son 30 talep ortalaması {queueStatus.avgResponseTime}
                    </span>
                  </div>
                </div>
                
                <div className="mt-3 p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
                  <div className="flex items-start gap-2">
                    <Clock className="w-4 h-4 text-yellow-600 dark:text-yellow-400 mt-0.5" />
                    <div className="text-sm text-yellow-800 dark:text-yellow-200">
                      <strong>Not:</strong> Tahmini süreler gerçek duruma göre değişebilir. 
                      Acil talepler öncelikli olarak değerlendirilir.
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Başlık */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              <FileText className="w-4 h-4 inline mr-2" />
              Talep Başlığı *
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
              placeholder="Talep başlığını girin"
              required
            />
          </div>

          {/* Açıklama - Rich Text Editor */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              <FileText className="w-4 h-4 inline mr-2" />
              Açıklama
            </label>
            <RichTextEditor
              value={formData.description}
              onChange={(value) => setFormData({ ...formData, description: value })}
              placeholder="Talep detaylarını açıklayın..."
              className="min-h-[200px]"
              showToolbar={true}
              maxLength={5000}
            />
          </div>

          {/* Dosya Ekleme Sistemi */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Dosya Ekleri
            </label>
            <FileUpload
              onFilesChange={handleFilesChange}
              maxFiles={5}
              maxSize={10}
              className="mb-4"
            />
          </div>

          {/* Gelişmiş Şablonlar */}
          <TicketTemplates
            onTemplateSelect={handleTemplateSelect}
            className="mb-6"
          />

          {/* Öncelik Belirleme Sihirbazı */}
          <PriorityWizard
            onPriorityChange={handlePriorityChange}
            currentPriority={formData.priority}
            className="mb-6"
          />

          {/* Kategori ve Öncelik Bilgisi */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                <Tag className="w-4 h-4 inline mr-2" />
                Kategori
              </label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
              >
                <option value="general">Genel</option>
                <option value="technical">Teknik</option>
                <option value="billing">Faturalama</option>
                <option value="feature">Özellik İsteği</option>
                <option value="feature_request">Özellik Önerisi</option>
                <option value="bug">Hata Bildirimi</option>
                <option value="account">Hesap Yönetimi</option>
                <option value="payment">Ödeme Sorunları</option>
                <option value="payment_reminder">Ödeme</option>
                <option value="project">Proje Soruları</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                <AlertTriangle className="w-4 h-4 inline mr-2" />
                Seçilen Öncelik
              </label>
              <div className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white">
                {formData.priority === 'low' && 'Düşük Öncelik'}
                {formData.priority === 'medium' && 'Orta Öncelik'}
                {formData.priority === 'high' && 'Yüksek Öncelik'}
                {formData.priority === 'urgent' && 'Acil Öncelik'}
              </div>
              {customerData && (
                <div className="mt-2 p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <div className="text-xs text-blue-700 dark:text-blue-300">
                    💡 Öncelik seviyesi sıra pozisyonunuzu etkiler. Yukarıdaki sıra durumu otomatik güncellenir.
                  </div>
                </div>
              )}
            </div>
          </div>



          {/* Sık Sorulan Sorular */}
          {formData.category && (
            <FAQIntegration
              category={formData.category}
              searchTerm={formData.title}
              className="mb-6"
            />
          )}



          {/* Müşteri ve Temsilci */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Müşteri seçimi sadece admin panelinde göster */}
            {!customerData && (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  <User className="w-4 h-4 inline mr-2" />
                  Müşteri *
                </label>
                <select
                  value={formData.customer_id}
                  onChange={(e) => setFormData({ ...formData, customer_id: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  required
                >
                  <option value="">Müşteri seçin</option>
                  {customers.map((customer) => (
                    <option key={customer.id} value={customer.id}>
                      {customer.name} - {customer.company || 'Şirket yok'} ({customer.email})
                    </option>
                  ))}
                </select>
                {formData.customer_id && (
                  <div className="mt-2 p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4 text-blue-600" />
                      <span className="text-sm text-blue-700 dark:text-blue-300">
                        Seçilen müşteri: {customers.find(c => c.id === formData.customer_id)?.name}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Müşteri bilgisi göster (müşteri portalında) */}
            {customerData && (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  <User className="w-4 h-4 inline mr-2" />
                  Müşteri Bilgisi
                </label>
                <div className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white">
                  {customerData.name} - {customerData.company || 'Şirket yok'} ({customerData.email})
                </div>
                <div className="mt-2 p-2 bg-green-50 dark:bg-green-900/20 rounded-lg">
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4 text-green-600" />
                    <span className="text-sm text-green-700 dark:text-green-300">
                      Talep sizin adınıza oluşturulacak
                    </span>
                  </div>
                </div>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                <User className="w-4 h-4 inline mr-2" />
                Temsilci (Opsiyonel)
              </label>
              <select
                value={formData.agent_id}
                onChange={(e) => setFormData({ ...formData, agent_id: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
              >
                <option value="">Otomatik atama (En az yüklü temsilci)</option>
                {agents.map((agent) => (
                  <option key={agent.id} value={agent.id}>
                    {agent.name} ({agent.status === 'online' ? 'Çevrimiçi' : agent.status === 'busy' ? 'Meşgul' : 'Çevrimdışı'})
                  </option>
                ))}
              </select>
              {formData.agent_id === '' && (
                <div className="mt-2 p-2 bg-green-50 dark:bg-green-900/20 rounded-lg">
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4 text-green-600" />
                    <div className="text-sm text-green-700 dark:text-green-300">
                      <div>Sistem otomatik olarak uygun temsilciyi atayacak:</div>
                      <div className="text-xs mt-1">
                        • Teknik sorunlar → Senior temsilciler
                        <br />
                        • Faturalama → Deneyimli temsilciler
                        <br />
                        • Diğer → En az yüklü temsilci
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>



          {/* Buttons */}
          <div className="flex items-center justify-end gap-3 pt-6 border-t border-gray-200 dark:border-gray-700">
            <button
              type="button"
              onClick={handleClose}
              className="px-6 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              İptal
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-lg font-medium transition-colors flex items-center gap-2"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Oluşturuluyor...
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4" />
                  Talep Oluştur
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateTicket;
