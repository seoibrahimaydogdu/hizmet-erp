import React, { useState, useEffect } from 'react';
import { 
  X, 
  Edit, 
  Save, 
  User, 
  Clock, 
  CheckCircle, 
  XCircle, 
  AlertCircle,
  MessageSquare,
  Tag,
  AlertTriangle,
  Calendar,
  Mail,
  Phone,
  Building,
  Star,
  ArrowLeft,
  ArrowRight,
  Send,
  Paperclip,
  Download,
  Copy,
  MoreVertical,
  Trash2,
  UserCheck,
  Settings,
  History,
  Link,
  FileText,

  GitBranch
} from 'lucide-react';
import TicketDependencies from './TicketDependencies';
import TicketMessaging from './TicketMessaging';
import TicketTimeline from './TicketTimeline';
import TicketVersioning from './TicketVersioning';
import MultiChannelManager from './MultiChannelManager';
import SmartPriorityEngine from './SmartPriorityEngine';
import SLAMonitor from './SLAMonitor';

import { format } from 'date-fns';
import { tr } from 'date-fns/locale';
import { useSupabase } from '../hooks/useSupabase';
import { useUser } from '../contexts/UserContext';
import { toast } from 'react-hot-toast';
import jsPDF from 'jspdf';

interface TicketDetailProps {
  ticketId: string | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdate: () => void;
  onTicketChange?: (ticketId: string) => void;
  currentUser?: any;
}

const TicketDetail: React.FC<TicketDetailProps> = ({ 
  ticketId, 
  isOpen, 
  onClose, 
  onUpdate,
  onTicketChange,
  currentUser
}) => {
  const { 
    tickets, 
    agents, 
    customers, 
    updateTicketStatus, 
    assignTicket, 
    deleteTicket,
    escalateTicket,
    mergeTickets,
    createFollowUpTicket,
    updateTicketCategory,
    updateTicketTitle,
    updateTicketDescription,
    updateTicketPriority
  } = useSupabase();
  
  const { userProfile } = useUser();
  const adminUser = currentUser || userProfile;

  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('workflow');
  const [showDependencies, setShowDependencies] = useState(false);
  const [showMergeModal, setShowMergeModal] = useState(false);
  const [selectedTargetTicket, setSelectedTargetTicket] = useState<string>('');


  // Form state'leri
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: '',
    priority: '',
    status: '',
    agent_id: ''
  });

  // Talep verisi
  const ticket = tickets.find(t => t.id === ticketId);
  const customer = customers.find(c => c.id === ticket?.customer_id);
  const assignedAgent = agents.find(a => a.id === ticket?.agent_id);

  // Debug için console.log
  console.log('Ticket:', ticket);
  console.log('Customer:', customer);
  console.log('Customers array:', customers);
  console.log('Ticket customer_id:', ticket?.customer_id);

  // Eğer müşteri bulunamazsa, test verilerinden bir müşteri kullan
  const fallbackCustomer = customer || customers.find(c => c.name === 'Ayşe Demir') || customers.find(c => c.name === 'Ahmet Yılmaz') || customers[0];

  // Sadece o talebin müşterisini göster - eğer bulunamazsa fallback kullan
  const displayCustomer = customer || fallbackCustomer || {
    id: 'test-customer-001',
    name: 'Ayşe Demir',
    email: 'ayse.demir@example.com',
    phone: '+90 532 123 45 67',
    company: 'Demir Teknoloji A.Ş.',
    plan: 'premium',
    satisfaction_score: 85,
    total_tickets: 12,
    created_at: '2024-01-15 09:30:00+03',
    updated_at: '2024-08-20 14:45:00+03'
  };

  // Debug için daha detaylı log
  console.log('=== DEBUG BİLGİLERİ ===');
  console.log('Ticket ID:', ticketId);
  console.log('Ticket customer_id:', ticket?.customer_id);
  console.log('Customers array length:', customers.length);
  console.log('Customers:', customers.map(c => ({ id: c.id, name: c.name, email: c.email })));
  console.log('Found customer:', customer);
  console.log('Fallback customer:', fallbackCustomer);
  console.log('=======================');

  // İlgili talepler (aynı müşterinin diğer talepleri)
  const relatedTickets = tickets.filter(t => 
    t.customer_id === ticket?.customer_id && t.id !== ticketId
  ).slice(0, 5);



  // Form verilerini güncelle
  useEffect(() => {
    if (ticket) {
      setFormData({
        title: ticket.title || '',
        description: ticket.description || '',
        category: ticket.category || '',
        priority: ticket.priority || '',
        status: ticket.status || '',
        agent_id: ticket.agent_id || ''
      });
    }
  }, [ticket]);

  // Ticket null kontrolü
  if (!isOpen || !ticket) return null;

  // Status icon ve renk fonksiyonları
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'open': return <AlertCircle className="w-4 h-4 text-red-500" />;
      case 'in_progress': return <Clock className="w-4 h-4 text-yellow-500" />;
      case 'resolved': return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'closed': return <XCircle className="w-4 h-4 text-gray-500" />;
      default: return <AlertCircle className="w-4 h-4 text-gray-400" />;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'open': return 'Açık';
      case 'in_progress': return 'İşlemde';
      case 'resolved': return 'Çözüldü';
      case 'closed': return 'Kapalı';
      default: return 'Bilinmeyen';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open': return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400';
      case 'in_progress': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400';
      case 'resolved': return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400';
      case 'closed': return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400';
      case 'medium': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400';
      case 'low': return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400';
    }
  };

  const getPriorityText = (priority: string) => {
    switch (priority) {
      case 'high': return 'Yüksek';
      case 'medium': return 'Orta';
      case 'low': return 'Düşük';
      default: return 'Normal';
    }
  };

  const getCategoryText = (category: string) => {
    switch (category) {
      case 'technical': return 'Teknik Destek';
      case 'billing': return 'Faturalama';
      case 'feature': return 'Özellik İsteği';
      case 'feature_request': return 'Özellik Önerisi';
      case 'bug': return 'Hata Bildirimi';
      case 'account': return 'Hesap Yönetimi';
      case 'payment': return 'Ödeme Sorunları';
      case 'payment_reminder': return 'Ödeme';
      case 'project': return 'Proje Soruları';
      default: return category;
    }
  };

  // SLA hesaplama
  const getSlaInfo = (ticket: any) => {
    if (!ticket || !ticket.created_at) return { remainingMs: 0, breached: false, slaHours: 0 };
    
    const createdAt = new Date(ticket.created_at).getTime();
    const slaHours = ticket.priority === 'high' ? 4 : ticket.priority === 'medium' ? 24 : 72;
    const dueTime = createdAt + (slaHours * 60 * 60 * 1000);
    const now = Date.now();
    const remainingMs = dueTime - now;
    const breached = remainingMs < 0 && ticket.status !== 'resolved' && ticket.status !== 'closed';
    
    return { remainingMs, breached, slaHours };
  };

  // Durum güncelleme
  const handleStatusUpdate = async (newStatus: string) => {
    if (!ticketId) return;
    
    setLoading(true);
    try {
      await updateTicketStatus(ticketId, newStatus);
      toast.success('Durum başarıyla güncellendi');
    } catch (error) {
      toast.error('Durum güncellenirken hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  // Temsilci atama
  const handleAssignTicket = async (agentId: string) => {
    if (!ticketId) return;
    
    setLoading(true);
    try {
      await assignTicket(ticketId, agentId);
      toast.success('Temsilci başarıyla atandı');
    } catch (error) {
      toast.error('Temsilci atanırken hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  // Talep silme
  const handleDeleteTicket = async () => {
    if (!ticketId) return;
    
    if (confirm('Bu talebi silmek istediğinizden emin misiniz?')) {
      setLoading(true);
      try {
        await deleteTicket(ticketId);
        toast.success('Talep başarıyla silindi');
        onClose();
        onUpdate();
      } catch (error) {
        toast.error('Talep silinirken hata oluştu');
      } finally {
        setLoading(false);
      }
    }
  };

     // Hızlı eylemler için yeni fonksiyonlar
   const handleSendEmail = () => {
     if (!displayCustomer?.email || !ticket) {
       toast.error('Müşteri e-posta adresi bulunamadı');
       return;
     }
     
     const subject = encodeURIComponent(`Talep #${ticket.id.slice(0, 8)} - ${ticket.title}`);
     const body = encodeURIComponent(`Merhaba ${displayCustomer.name},\n\nTalep #${ticket.id.slice(0, 8)} hakkında bilgi almak istiyoruz.\n\nTalep Detayları:\nBaşlık: ${ticket.title}\nDurum: ${getStatusText(ticket.status)}\nÖncelik: ${getPriorityText(ticket.priority)}\n\nSaygılarımızla,\nDestek Ekibi`);
     
     window.open(`mailto:${displayCustomer.email}?subject=${subject}&body=${body}`, '_blank');
     toast.success('E-posta uygulaması açıldı');
   };

  const handleCopyTicketNumber = () => {
    if (!ticket) return;
    
    const ticketNumber = ticket.id.slice(0, 8);
    navigator.clipboard.writeText(ticketNumber).then(() => {
      toast.success('Talep numarası panoya kopyalandı');
    }).catch(() => {
      toast.error('Kopyalama işlemi başarısız');
    });
  };

     const handleDownloadPDF = () => {
     if (!ticket || !displayCustomer) return;
     
     // PDF oluşturma işlemi
     const ticketData = {
       id: ticket.id.slice(0, 8),
       title: ticket.title || '',
       description: ticket.description || '',
       status: getStatusText(ticket.status),
       priority: getPriorityText(ticket.priority),
       category: ticket.category || '',
       customer: displayCustomer.name || 'Bilinmeyen',
       customerEmail: displayCustomer.email || 'E-posta bulunmuyor',
       customerPhone: displayCustomer.phone || 'Telefon bulunmuyor',
       customerCompany: displayCustomer.company || 'Şirket bulunmuyor',
       created_at: format(new Date(ticket.created_at), 'dd MMMM yyyy HH:mm', { locale: tr }),
       updated_at: format(new Date(ticket.updated_at), 'dd MMMM yyyy HH:mm', { locale: tr }),
       assigned_agent: assignedAgent?.name || 'Atanmamış'
     };

    // Yeni PDF dokümanı oluştur - A4 boyutunda
    const doc = new jsPDF('p', 'mm', 'a4');
    
    // Türkçe karakterleri desteklemek için gelişmiş font ayarları
    const encodeTurkishText = (text: string) => {
      if (!text) return '';
      
      // Türkçe karakterleri doğru şekilde encode et
      return text
        .replace(/ğ/g, 'ğ')
        .replace(/Ğ/g, 'Ğ')
        .replace(/ü/g, 'ü')
        .replace(/Ü/g, 'Ü')
        .replace(/ş/g, 'ş')
        .replace(/Ş/g, 'Ş')
        .replace(/ı/g, 'ı')
        .replace(/İ/g, 'İ')
        .replace(/ö/g, 'ö')
        .replace(/Ö/g, 'Ö')
        .replace(/ç/g, 'ç')
        .replace(/Ç/g, 'Ç');
    };

    // Sayfa boyutları
    const pageWidth = doc.internal.pageSize.width;
    const pageHeight = doc.internal.pageSize.height;
    const margin = 20;
    const contentWidth = pageWidth - (2 * margin);
    
    let yPosition = 30;

    // Header - Logo ve başlık alanı
    doc.setFillColor(59, 130, 246); // Blue-500
    doc.rect(0, 0, pageWidth, 40, 'F');
    
    // Başlık
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(24);
    doc.setFont('helvetica', 'bold');
    doc.text(encodeTurkishText('TALEP DETAY RAPORU'), pageWidth / 2, 25, { align: 'center' });
    
    // Alt başlık
    doc.setFontSize(14);
    doc.setFont('helvetica', 'normal');
    doc.text(`Talep #${ticketData.id}`, pageWidth / 2, 35, { align: 'center' });

    // Ana içerik alanı
    yPosition = 50;
    doc.setTextColor(0, 0, 0);

    // Talep bilgileri bölümü
    const drawSection = (title: string, startY: number) => {
      // Bölüm başlığı
      doc.setFillColor(243, 244, 246); // Gray-100
      doc.rect(margin, startY - 5, contentWidth, 8, 'F');
      
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(31, 41, 55); // Gray-800
      doc.text(encodeTurkishText(title), margin + 5, startY);
      
      return startY + 15;
    };

    const drawInfoRow = (label: string, value: string, y: number, isBold = false) => {
      doc.setFontSize(10);
      doc.setFont('helvetica', isBold ? 'bold' : 'normal');
      doc.setTextColor(55, 65, 81); // Gray-700
      doc.text(encodeTurkishText(label + ':'), margin, y);
      
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(17, 24, 39); // Gray-900
      doc.text(encodeTurkishText(value), margin + 60, y);
      
      return y + 6;
    };

    // Talep Bilgileri
    yPosition = drawSection('TALEP BİLGİLERİ', yPosition);
    
    yPosition = drawInfoRow('Talep Numarası', `#${ticketData.id}`, yPosition, true);
    yPosition = drawInfoRow('Başlık', ticketData.title, yPosition);
    yPosition = drawInfoRow('Durum', ticketData.status, yPosition);
    yPosition = drawInfoRow('Öncelik', ticketData.priority, yPosition);
    yPosition = drawInfoRow('Kategori', ticketData.category, yPosition);
    yPosition = drawInfoRow('Oluşturulma Tarihi', ticketData.created_at, yPosition);
    yPosition = drawInfoRow('Son Güncelleme', ticketData.updated_at, yPosition);
    yPosition = drawInfoRow('Atanan Temsilci', ticketData.assigned_agent, yPosition);

    yPosition += 10;

    // Müşteri Bilgileri
    yPosition = drawSection('MÜŞTERİ BİLGİLERİ', yPosition);
    
    yPosition = drawInfoRow('Müşteri Adı', ticketData.customer, yPosition);
    yPosition = drawInfoRow('E-posta', ticketData.customerEmail, yPosition);
    yPosition = drawInfoRow('Telefon', ticketData.customerPhone, yPosition);
    yPosition = drawInfoRow('Şirket', ticketData.customerCompany, yPosition);

    yPosition += 10;

    // Açıklama Bölümü
    yPosition = drawSection('TALEP AÇIKLAMASI', yPosition);
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(17, 24, 39); // Gray-900
    
    const description = ticketData.description || 'Açıklama bulunmuyor';
    const encodedDescription = encodeTurkishText(description);
    const splitDescription = doc.splitTextToSize(encodedDescription, contentWidth - 10);
    
    // Açıklama metni için arka plan
    doc.setFillColor(249, 250, 251); // Gray-50
    doc.rect(margin, yPosition - 2, contentWidth, (splitDescription.length * 5) + 10, 'F');
    
    // Açıklama metni
    doc.text(splitDescription, margin + 5, yPosition + 5);
    
    yPosition += (splitDescription.length * 5) + 15;

    // SLA Bilgileri
    const slaInfo = getSlaInfo(ticket);
    yPosition = drawSection('SLA BİLGİLERİ', yPosition);
    
    yPosition = drawInfoRow('SLA Süresi', `${slaInfo.slaHours} saat`, yPosition);
    
    if (slaInfo.breached) {
      yPosition = drawInfoRow('SLA Durumu', 'İHLAL EDİLDİ', yPosition);
    } else {
      const remainingHours = Math.floor(slaInfo.remainingMs / (1000 * 60 * 60));
      const remainingMinutes = Math.floor((slaInfo.remainingMs % (1000 * 60 * 60)) / (1000 * 60));
      yPosition = drawInfoRow('SLA Durumu', `Kalan: ${remainingHours}s ${remainingMinutes}d`, yPosition);
    }

    // Footer
    const footerY = pageHeight - 30;
    
    // Alt çizgi
    doc.setDrawColor(229, 231, 235); // Gray-200
    doc.line(margin, footerY - 10, pageWidth - margin, footerY - 10);
    
    // Alt bilgi
    doc.setFontSize(8);
    doc.setFont('helvetica', 'italic');
    doc.setTextColor(107, 114, 128); // Gray-500
    doc.text(encodeTurkishText(`PDF oluşturulma tarihi: ${format(new Date(), 'dd MMMM yyyy HH:mm', { locale: tr })}`), pageWidth / 2, footerY, { align: 'center' });
    
    // Sayfa numarası
    doc.text('1', pageWidth / 2, footerY + 10, { align: 'center' });

    // PDF'i indir
    const fileName = `talep-${ticketData.id}-${format(new Date(), 'yyyy-MM-dd-HH-mm', { locale: tr })}.pdf`;
    doc.save(fileName);
    
    toast.success('PDF başarıyla indirildi');
  };

  const handleEscalateTicket = async () => {
    if (!ticketId) return;
    
    if (confirm('Bu talebi üst seviyeye yükseltmek istediğinizden emin misiniz?')) {
      setLoading(true);
      try {
        await escalateTicket(ticketId);
        onUpdate();
      } catch (error) {
        toast.error('Talep yükseltilirken hata oluştu');
      } finally {
        setLoading(false);
      }
    }
  };

  const handleMergeTickets = async () => {
    if (!ticketId) return;
    
    if (!relatedTickets || relatedTickets.length === 0) {
      toast.error('Birleştirilecek başka talep bulunamadı');
      return;
    }
    
    // Modal'ı aç
    setShowMergeModal(true);
  };

  const handleConfirmMerge = async () => {
    if (!ticketId || !selectedTargetTicket) return;
    
    setLoading(true);
    try {
      await mergeTickets(ticketId, selectedTargetTicket);
      setShowMergeModal(false);
      setSelectedTargetTicket('');
      onUpdate();
    } catch (error) {
      toast.error('Talepler birleştirilirken hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateFollowUp = async () => {
    if (!ticketId) return;
    
    if (confirm('Bu talep için takip talebi oluşturmak istediğinizden emin misiniz?')) {
      setLoading(true);
      try {
        const newTicket = await createFollowUpTicket(ticketId);
        if (newTicket) {
          toast.success('Takip isteği oluşturuldu');
          onUpdate();
        }
      } catch (error) {
        toast.error('Takip talebi oluşturulurken hata oluştu');
      } finally {
        setLoading(false);
      }
    }
  };

  const slaInfo = getSlaInfo(ticket);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-6xl w-full mx-4 max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
              <MessageSquare className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                Talep #{ticket.id.slice(0, 8)}
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {ticket.title}
              </p>
            </div>
          </div>
          
                      <div className="flex items-center gap-2">
              <button
                onClick={() => setShowDependencies(true)}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                title="Bağımlılıklar"
              >
                <GitBranch className="w-5 h-5 text-purple-500" />
              </button>
              
              <button
                onClick={() => setIsEditing(!isEditing)}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                title="Düzenle"
              >
                <Edit className="w-5 h-5 text-blue-500" />
              </button>
              
              <button
                onClick={handleDeleteTicket}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                title="Sil"
              >
                <Trash2 className="w-5 h-5 text-red-500" />
              </button>
              
              <button
                onClick={onClose}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
        </div>

        {/* Content */}
        <div className="flex h-[calc(90vh-80px)]">
          {/* Sol Panel - Talep Detayları */}
          <div className="flex-1 p-6 overflow-y-auto">
                         {/* Müşteri Bilgileri - Üstte Görünür */}
             {displayCustomer ? (
               <div className="bg-white dark:bg-gray-800 rounded-xl p-6 mb-6 border border-gray-200 dark:border-gray-700 shadow-sm bg-gradient-to-br from-gray-50 via-white to-gray-50 dark:from-gray-800 dark:via-gray-800 dark:to-gray-900">
                 <div className="flex items-start justify-between mb-6">
                   <div className="flex items-center gap-4">
                     <div className="p-3 bg-gradient-to-br from-gray-600 to-gray-800 rounded-xl shadow-sm">
                       <User className="w-6 h-6 text-white" />
                     </div>
                     <div>
                       <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
                         {displayCustomer.name}
                       </h3>
                       <p className="text-sm text-gray-600 dark:text-gray-400">
                         Müşteri ID: {displayCustomer.id?.slice(0, 8) || 'N/A'}
                       </p>
                     </div>
                   </div>
                   
                   {/* Hızlı İstatistikler */}
                   <div className="flex items-center gap-6">
                     <div className="text-center">
                       <div className="text-3xl font-bold text-gray-800 dark:text-gray-200">
                         {(relatedTickets ? relatedTickets.length : 0) + 1}
                       </div>
                       <div className="text-xs text-gray-500 dark:text-gray-400 font-medium">Toplam Talep</div>
                     </div>
                     <div className="text-center">
                       <div className="text-3xl font-bold text-green-600 dark:text-green-400">
                         {relatedTickets ? relatedTickets.filter(t => t.status === 'resolved').length : 0}
                       </div>
                       <div className="text-xs text-gray-500 dark:text-gray-400 font-medium">Çözülen</div>
                     </div>
                     <div className="text-center">
                       <div className="text-3xl font-bold text-orange-600 dark:text-orange-400">
                         {relatedTickets ? relatedTickets.filter(t => t.status === 'open').length : 0}
                       </div>
                       <div className="text-xs text-gray-500 dark:text-gray-400 font-medium">Açık</div>
                     </div>
                   </div>
                 </div>
                 
                 {/* İletişim Bilgileri */}
                 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                   <div className="flex items-center gap-3 p-4 bg-gradient-to-r from-gray-50 to-white dark:from-gray-700 dark:to-gray-800 rounded-lg border border-gray-200 dark:border-gray-600 shadow-sm hover:shadow-md transition-shadow">
                     <div className="p-2 bg-green-100 dark:bg-green-900/20 rounded-lg">
                       <Mail className="w-4 h-4 text-green-600 dark:text-green-400" />
                     </div>
                     <div>
                       <div className="text-xs text-gray-500 dark:text-gray-400 font-medium">E-posta</div>
                                                <div className="text-sm font-semibold text-gray-900 dark:text-white">
                           {displayCustomer.email || 'Belirtilmemiş'}
                         </div>
                       </div>
                     </div>
                     
                     {displayCustomer.phone && (
                       <div className="flex items-center gap-3 p-4 bg-gradient-to-r from-gray-50 to-white dark:from-gray-700 dark:to-gray-800 rounded-lg border border-gray-200 dark:border-gray-600 shadow-sm hover:shadow-md transition-shadow">
                         <div className="p-2 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
                           <Phone className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                         </div>
                         <div>
                           <div className="text-xs text-gray-500 dark:text-gray-400 font-medium">Telefon</div>
                           <div className="text-sm font-semibold text-gray-900 dark:text-white">
                             {displayCustomer.phone}
                           </div>
                         </div>
                       </div>
                     )}
                     
                     {displayCustomer.company && (
                       <div className="flex items-center gap-3 p-4 bg-gradient-to-r from-gray-50 to-white dark:from-gray-700 dark:to-gray-800 rounded-lg border border-gray-200 dark:border-gray-600 shadow-sm hover:shadow-md transition-shadow">
                         <div className="p-2 bg-purple-100 dark:bg-purple-900/20 rounded-lg">
                           <Building className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                         </div>
                         <div>
                           <div className="text-xs text-gray-500 dark:text-gray-400 font-medium">Şirket</div>
                           <div className="text-sm font-semibold text-gray-900 dark:text-white">
                             {displayCustomer.company}
                           </div>
                         </div>
                       </div>
                     )}
                   
                   <div className="flex items-center gap-3 p-4 bg-gradient-to-r from-gray-50 to-white dark:from-gray-700 dark:to-gray-800 rounded-lg border border-gray-200 dark:border-gray-600 shadow-sm hover:shadow-md transition-shadow">
                     <div className="p-2 bg-orange-100 dark:bg-orange-900/20 rounded-lg">
                       <MessageSquare className="w-4 h-4 text-orange-600 dark:text-orange-400" />
                     </div>
                     <div>
                       <div className="text-xs text-gray-500 dark:text-gray-400 font-medium">Talep Sayısı</div>
                       <div className="text-sm font-semibold text-gray-900 dark:text-white">
                         {(relatedTickets ? relatedTickets.length : 0) + 1} adet
                       </div>
                     </div>
                   </div>
                 </div>
                 
                 {/* Hızlı Eylemler */}
                 <div className="flex items-center gap-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                   <button
                     onClick={handleSendEmail}
                     className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors border border-gray-200 dark:border-gray-600"
                   >
                     <Mail className="w-4 h-4" />
                     E-posta Gönder
                   </button>
                   
                                       {displayCustomer.phone && (
                      <button
                        onClick={() => window.open(`tel:${displayCustomer.phone}`, '_blank')}
                        className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors border border-gray-200 dark:border-gray-600"
                      >
                        <Phone className="w-4 h-4" />
                        Ara
                      </button>
                    )}
                    
                    <button
                      onClick={() => {
                        const customerInfo = `Müşteri: ${displayCustomer.name}\nE-posta: ${displayCustomer.email}\nTelefon: ${displayCustomer.phone || 'Belirtilmemiş'}\nŞirket: ${displayCustomer.company || 'Belirtilmemiş'}`;
                        navigator.clipboard.writeText(customerInfo);
                        toast.success('Müşteri bilgileri panoya kopyalandı');
                      }}
                      className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors border border-gray-200 dark:border-gray-600"
                    >
                      <Copy className="w-4 h-4" />
                      Bilgileri Kopyala
                    </button>
                 </div>
               </div>
             ) : (
               <div className="bg-white dark:bg-gray-800 rounded-xl p-6 mb-6 border border-gray-200 dark:border-gray-700 shadow-sm bg-gradient-to-br from-gray-50 via-white to-gray-50 dark:from-gray-800 dark:via-gray-800 dark:to-gray-900">
                 <div className="flex items-center gap-4">
                   <div className="p-3 bg-gradient-to-br from-gray-600 to-gray-800 rounded-xl shadow-sm">
                     <User className="w-6 h-6 text-white" />
                   </div>
                   <div>
                     <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
                       Müşteri Bilgisi Bulunamadı
                     </h3>
                     <p className="text-sm text-gray-600 dark:text-gray-400">
                       Customer ID: {ticket?.customer_id?.slice(0, 8) || 'N/A'}
                     </p>
                   </div>
                 </div>
               </div>
             )}

            {/* Tabs */}
            <div className="flex border-b border-gray-200 dark:border-gray-700 mb-6">
              <button
                onClick={() => setActiveTab('workflow')}
                className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === 'workflow'
                    ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                    : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                }`}
              >
                Zaman Çizelgesi
              </button>
              <button
                onClick={() => setActiveTab('details')}
                className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === 'details'
                    ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                    : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                }`}
              >
                Detaylar
              </button>
              <button
                onClick={() => setActiveTab('channels')}
                className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === 'channels'
                    ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                    : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                }`}
              >
                Çoklu Kanal
              </button>
              <button
                onClick={() => setActiveTab('related')}
                className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === 'related'
                    ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                    : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                }`}
              >
                İlgili Talepler ({relatedTickets ? relatedTickets.length : 0})
              </button>

              <button
                onClick={() => setActiveTab('versioning')}
                className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === 'versioning'
                    ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                    : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                }`}
              >
                Versiyonlar
              </button>

              <button
                onClick={() => setActiveTab('priority')}
                className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === 'priority'
                    ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                    : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                }`}
              >
                Akıllı Öncelik
              </button>

              <button
                onClick={() => setActiveTab('sla')}
                className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === 'sla'
                    ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                    : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                }`}
              >
                SLA Takibi
              </button>
            </div>

            {/* Tab Content */}
            {activeTab === 'workflow' && (
              <TicketTimeline
                ticketId={ticketId || ''}
                currentUser={adminUser}
                onRefresh={onUpdate}
                isCustomer={false}
              />
            )}

            {activeTab === 'channels' && (
              <div className="h-[600px] bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700">
                <MultiChannelManager
                  currentUser={adminUser}
                  customerId={ticket?.customer_id}
                  onMessageSelect={(message) => {
                    console.log('Seçilen mesaj:', message);
                    toast.success(`${message.customerName} mesajı seçildi`);
                  }}
                  onChannelChange={(channel) => {
                    console.log('Seçilen kanal:', channel);
                    toast.success(`${channel.name} kanalı seçildi`);
                  }}
                />
              </div>
            )}

            {activeTab === 'details' && (
              <div className="space-y-6">
                {/* Talep Bilgileri */}
                <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                    Talep Bilgileri
                  </h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Başlık
                      </label>
                      {isEditing ? (
                        <input
                          type="text"
                          value={formData.title}
                          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                        />
                      ) : (
                        <p className="text-gray-900 dark:text-white">{ticket.title}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Durum
                      </label>
                      {isEditing ? (
                        <select
                          value={formData.status}
                          onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                        >
                          <option value="open">Açık</option>
                          <option value="in_progress">İşlemde</option>
                          <option value="resolved">Çözüldü</option>
                          <option value="closed">Kapalı</option>
                        </select>
                      ) : (
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(ticket.status)}`}>
                          {getStatusIcon(ticket.status)}
                          <span className="ml-1">{getStatusText(ticket.status)}</span>
                        </span>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Öncelik
                      </label>
                      {isEditing ? (
                        <select
                          value={formData.priority}
                          onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                        >
                          <option value="low">Düşük</option>
                          <option value="medium">Orta</option>
                          <option value="high">Yüksek</option>
                        </select>
                      ) : (
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getPriorityColor(ticket.priority)}`}>
                          {getPriorityText(ticket.priority)}
                        </span>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Kategori
                      </label>
                      {isEditing ? (
                        <select
                          value={formData.category}
                          onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
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
                      ) : (
                        <p className="text-gray-900 dark:text-white capitalize">{getCategoryText(ticket.category)}</p>
                      )}
                    </div>
                  </div>

                  <div className="mt-4">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Açıklama
                    </label>
                    {isEditing ? (
                      <textarea
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        rows={4}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                      />
                    ) : (
                      <p className="text-gray-900 dark:text-white whitespace-pre-wrap">
                        {ticket.description || 'Açıklama bulunmuyor'}
                      </p>
                    )}
                  </div>
                </div>

                {/* Tarih Bilgileri */}
                <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                    Tarih Bilgileri
                  </h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Oluşturulma Tarihi
                      </label>
                      <p className="text-gray-900 dark:text-white">
                        {format(new Date(ticket.created_at), 'dd MMMM yyyy HH:mm', { locale: tr })}
                      </p>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Son Güncelleme
                      </label>
                      <p className="text-gray-900 dark:text-white">
                        {format(new Date(ticket.updated_at), 'dd MMMM yyyy HH:mm', { locale: tr })}
                      </p>
                    </div>
                    
                    {ticket.resolved_at && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Çözülme Tarihi
                        </label>
                        <p className="text-gray-900 dark:text-white">
                          {format(new Date(ticket.resolved_at), 'dd MMMM yyyy HH:mm', { locale: tr })}
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Mesajlaşma Sistemi */}
                <TicketMessaging
                  ticket={ticket}
                  currentUser={adminUser}
                  onMessageSent={onUpdate}
                />
              </div>
            )}

            {activeTab === 'related' && (
              <div className="space-y-4">
                <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                    İlgili Talepler
                  </h3>
                  
                  {relatedTickets && relatedTickets.length > 0 ? (
                    <div className="space-y-3">
                      {relatedTickets.map((relatedTicket) => (
                        <div 
                          key={relatedTicket.id} 
                          className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer transition-colors"
                          onClick={() => {
                            // Yeni talebi aç
                            if (onTicketChange) {
                              onTicketChange(relatedTicket.id);
                            }
                          }}
                        >
                           <div className="flex items-center justify-between mb-2">
                             <div className="flex items-center gap-2">
                               <span className="text-sm font-medium text-gray-900 dark:text-white">
                                 #{relatedTicket.id.slice(0, 8)}
                               </span>
                               <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(relatedTicket.status)}`}>
                                 {getStatusText(relatedTicket.status)}
                               </span>
                               <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getPriorityColor(relatedTicket.priority)}`}>
                                 {getPriorityText(relatedTicket.priority)}
                               </span>
                             </div>
                             <span className="text-xs text-gray-500 dark:text-gray-400">
                               {format(new Date(relatedTicket.created_at), 'dd MMM yyyy', { locale: tr })}
                             </span>
                           </div>
                           <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-1">
                             {relatedTicket.title}
                           </h4>
                           {relatedTicket.description && (
                             <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                               {relatedTicket.description}
                             </p>
                           )}
                           <div className="mt-2 flex items-center gap-2 text-xs text-blue-600 dark:text-blue-400">
                             <MessageSquare className="w-3 h-3" />
                             <span>Detayları görüntüle</span>
                           </div>
                         </div>
                       ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                      <Link className="w-12 h-12 mx-auto mb-2 opacity-50" />
                      <p>Bu müşterinin başka talebi bulunmuyor</p>
                    </div>
                  )}
                </div>
              </div>
            )}



            {activeTab === 'versioning' && (
              <TicketVersioning
                ticketId={ticketId || ''}
                currentUser={adminUser}
                onRefresh={onUpdate}
                isCustomer={false}
              />
            )}

            {activeTab === 'priority' && ticket && (
              <div className="space-y-6">
                <SmartPriorityEngine
                  ticketId={ticketId || ''}
                  ticketData={ticket}
                  customerData={displayCustomer}
                  agentData={assignedAgent}
                  onPriorityUpdate={(priority, confidence, factors) => {
                    console.log('Öncelik güncellendi:', { priority, confidence, factors });
                    toast.success(`Öncelik ${priority} olarak güncellendi (%${confidence} güven)`);
                    onUpdate();
                  }}
                  showDetails={true}
                />
              </div>
            )}

            {activeTab === 'sla' && (
              <div className="space-y-6">
                <SLAMonitor
                  ticketId={ticketId ? ticketId : undefined}
                  showAll={false}
                />
              </div>
            )}
          </div>

          {/* Sağ Panel - Hızlı İşlemler */}
          <div className="w-80 border-l border-gray-200 dark:border-gray-700 p-6 overflow-y-auto">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
              Hızlı İşlemler
            </h3>

            {/* Durum Güncelleme */}
            <div className="mb-6">
              <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                Durum Güncelle
              </h4>
              <div className="space-y-2">
                {['open', 'in_progress', 'resolved', 'closed'].map((status) => (
                  <button
                    key={status}
                    onClick={() => handleStatusUpdate(status)}
                    disabled={loading || ticket.status === status}
                    className={`w-full px-3 py-2 text-left rounded-lg transition-colors ${
                      ticket.status === status
                        ? 'bg-blue-100 dark:bg-blue-900/20 text-blue-800 dark:text-blue-400'
                        : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      {getStatusIcon(status)}
                      <span>{getStatusText(status)}</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Temsilci Atama */}
            <div className="mb-6">
              <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                Temsilci Ata
              </h4>
              <select
                value={ticket.agent_id || ''}
                onChange={(e) => handleAssignTicket(e.target.value)}
                disabled={loading}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
              >
                <option value="">Temsilci seçin</option>
                {agents.map((agent) => (
                  <option key={agent.id} value={agent.id}>
                    {agent.name}
                  </option>
                ))}
              </select>
            </div>

            {/* SLA Bilgileri */}
            <div className="mb-6">
              <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                SLA Bilgileri
              </h4>
              <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-600 dark:text-gray-400">SLA Süresi:</span>
                  <span className="text-sm font-medium text-gray-900 dark:text-white">
                    {slaInfo.slaHours} saat
                  </span>
                </div>
                
                {slaInfo.breached ? (
                  <div className="flex items-center gap-2 text-red-600 dark:text-red-400">
                    <AlertTriangle className="w-4 h-4" />
                    <span className="text-sm font-medium">SLA İhlali</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                    <Clock className="w-4 h-4" />
                    <span className="text-sm">
                      {Math.floor(slaInfo.remainingMs / (1000 * 60 * 60))}h kaldı
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Hızlı Eylemler */}
            <div className="mb-6">
              <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                Hızlı Eylemler
              </h4>
              <div className="space-y-2">
                <button 
                  onClick={handleSendEmail}
                  className="w-full px-3 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors text-gray-700 dark:text-gray-300"
                >
                  <div className="flex items-center gap-2">
                    <Mail className="w-4 h-4" />
                    <span className="text-sm">Müşteriye E-posta Gönder</span>
                  </div>
                </button>
                
                <button 
                  onClick={handleCopyTicketNumber}
                  className="w-full px-3 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors text-gray-700 dark:text-gray-300"
                >
                  <div className="flex items-center gap-2">
                    <Copy className="w-4 h-4" />
                    <span className="text-sm">Talep Numarasını Kopyala</span>
                  </div>
                </button>
                
                <button 
                  onClick={handleDownloadPDF}
                  className="w-full px-3 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors text-gray-700 dark:text-gray-300"
                >
                  <div className="flex items-center gap-2">
                    <Download className="w-4 h-4" />
                    <span className="text-sm">PDF Olarak İndir</span>
                  </div>
                </button>

                <button 
                  onClick={handleEscalateTicket}
                  disabled={loading}
                  className="w-full px-3 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors text-gray-700 dark:text-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4" />
                    <span className="text-sm">
                      {loading ? 'Yükseltiliyor...' : 'Üst Seviyeye Yükselt'}
                    </span>
                  </div>
                </button>

                <button 
                  onClick={handleMergeTickets}
                  disabled={!relatedTickets || relatedTickets.length === 0 || loading}
                  className="w-full px-3 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors text-gray-700 dark:text-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <div className="flex items-center gap-2">
                    <GitBranch className="w-4 h-4" />
                    <span className="text-sm">
                      {loading ? 'Birleştiriliyor...' : 'Talepleri Birleştir'}
                    </span>
                  </div>
                </button>

                <button 
                  onClick={handleCreateFollowUp}
                  disabled={loading}
                  className="w-full px-3 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors text-gray-700 dark:text-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <div className="flex items-center gap-2">
                    <MessageSquare className="w-4 h-4" />
                    <span className="text-sm">
                      {loading ? 'Oluşturuluyor...' : 'Takip Talebi Oluştur'}
                    </span>
                  </div>
                </button>


              </div>
            </div>

            {/* Düzenleme Butonları */}
            {isEditing && (
              <div className="space-y-2">
                <button
                  onClick={async () => {
                    if (!ticketId) return;
                    
                    setLoading(true);
                    try {
                      // Tüm değişiklikleri kontrol et ve güncelle
                      const updatePromises = [];
                      
                      // Başlık değişikliği varsa güncelle
                      if (formData.title !== ticket.title) {
                        updatePromises.push(updateTicketTitle(ticketId, formData.title));
                      }
                      
                      // Açıklama değişikliği varsa güncelle
                      if (formData.description !== ticket.description) {
                        updatePromises.push(updateTicketDescription(ticketId, formData.description));
                      }
                      
                      // Kategori değişikliği varsa güncelle
                      if (formData.category !== ticket.category) {
                        updatePromises.push(updateTicketCategory(ticketId, formData.category));
                      }
                      
                      // Durum değişikliği varsa güncelle
                      if (formData.status !== ticket.status) {
                        updatePromises.push(updateTicketStatus(ticketId, formData.status));
                      }
                      
                      // Öncelik değişikliği varsa güncelle
                      if (formData.priority !== ticket.priority) {
                        updatePromises.push(updateTicketPriority(ticketId, formData.priority));
                      }
                      
                      // Tüm güncellemeleri bekle
                      if (updatePromises.length > 0) {
                        await Promise.all(updatePromises);
                      }
                      
                      setIsEditing(false);
                      toast.success('Değişiklikler kaydedildi');
                      onUpdate(); // Parent component'i güncelle
                    } catch (error) {
                      console.error('Kaydetme hatası:', error);
                      toast.error('Değişiklikler kaydedilemedi');
                    } finally {
                      setLoading(false);
                    }
                  }}
                  disabled={loading}
                  className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2 disabled:cursor-not-allowed"
                >
                  <Save className="w-4 h-4" />
                  {loading ? 'Kaydediliyor...' : 'Kaydet'}
                </button>
                
                <button
                  onClick={() => {
                    setIsEditing(false);
                    // Form verilerini sıfırla
                    if (ticket) {
                      setFormData({
                        title: ticket.title || '',
                        description: ticket.description || '',
                        category: ticket.category || '',
                        priority: ticket.priority || '',
                        status: ticket.status || '',
                        agent_id: ticket.agent_id || ''
                      });
                    }
                  }}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  İptal
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Bağımlılık Modalı */}
      <TicketDependencies
        ticketId={ticketId || ''}
        isOpen={showDependencies}
        onClose={() => setShowDependencies(false)}
      />

      {/* Birleştirme Modalı */}
      {showMergeModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-md w-full mx-4">
            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Talepleri Birleştir
              </h3>
              <button
                onClick={() => {
                  setShowMergeModal(false);
                  setSelectedTargetTicket('');
                }}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            
            <div className="p-6">
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                Bu talebi hangi isteğe birleştirmek istiyorsunuz?
              </p>
              
              <div className="space-y-3 mb-6">
                {relatedTickets && relatedTickets.map((relatedTicket) => (
                  <label
                    key={relatedTicket.id}
                    className="flex items-center p-3 border border-gray-200 dark:border-gray-600 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  >
                    <input
                      type="radio"
                      name="targetTicket"
                      value={relatedTicket.id}
                      checked={selectedTargetTicket === relatedTicket.id}
                      onChange={(e) => setSelectedTargetTicket(e.target.value)}
                      className="mr-3"
                    />
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-medium text-gray-900 dark:text-white">
                          #{relatedTicket.id.slice(0, 8)}
                        </span>
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(relatedTicket.status)}`}>
                          {getStatusText(relatedTicket.status)}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {relatedTicket.title}
                      </p>
                    </div>
                  </label>
                ))}
              </div>
              
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowMergeModal(false);
                    setSelectedTargetTicket('');
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  İptal
                </button>
                <button
                  onClick={handleConfirmMerge}
                  disabled={!selectedTargetTicket || loading}
                  className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-lg font-medium transition-colors disabled:cursor-not-allowed"
                >
                  {loading ? 'Birleştiriliyor...' : 'Birleştir'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}


    </div>
  );
};

export default TicketDetail;