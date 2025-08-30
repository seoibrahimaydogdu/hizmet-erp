import React, { useState, useEffect, useRef } from 'react';
import { 
  Send, 
  Eye, 
  EyeOff, 
  CheckCircle2,
  User,
  Shield,
  Paperclip,
  File,
  Download,
  X,
  Lightbulb,
  FileText,
  MessageSquare,
  Share2
} from 'lucide-react';
import VoiceMessage from './common/VoiceMessage';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';
import { toast } from 'react-hot-toast';
import { supabase } from '../lib/supabase';
import FileUpload from './FileUpload';
import RichTextEditor from './RichTextEditor';

import AutoDocumentation from './AutoDocumentation';
import CrossChannelContext from './CrossChannelContext';

interface TicketMessagingProps {
  ticket: any;
  currentUser: any;
  onMessageSent?: () => void;
}

interface Message {
  id: string;
  ticket_id: string;
  sender_id: string;
  sender_type: 'customer' | 'admin';
  message: string;
  message_type: 'text' | 'file';
  is_internal: boolean;
  is_read: boolean;
  read_at?: string;
  created_at: string;
  sender_name?: string;
  attachments?: string[];
  // Alıntı özelliği
  reply_to?: {
    message_id: string;
    sender_name: string;
    message: string;
  };
}

const TicketMessaging: React.FC<TicketMessagingProps> = ({ 
  ticket, 
  currentUser, 
  onMessageSent 
}) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showInternal, setShowInternal] = useState(false);
  const [attachments, setAttachments] = useState<File[]>([]);
  const [showFileUpload, setShowFileUpload] = useState(false);
  const [downloadingFiles, setDownloadingFiles] = useState<Set<string>>(new Set());

  const [showDocumentation, setShowDocumentation] = useState(false);
  const [showCrossChannel, setShowCrossChannel] = useState(false);
  const [conversationContext, setConversationContext] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // Alıntı özelliği için state'ler
  const [replyingTo, setReplyingTo] = useState<Message | null>(null);
  const [replyContent, setReplyContent] = useState('');

  const isAdmin = currentUser?.role === 'admin' || currentUser?.role === 'Sistem Yöneticisi';

  // Alıntı fonksiyonları
  const handleReplyToMessage = (message: Message) => {
    setReplyingTo(message);
  };

  const cancelReply = () => {
    setReplyingTo(null);
    setReplyContent('');
  };

  // Debug: Kullanıcı bilgilerini kontrol et (sadece geliştirme modunda)
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      console.log('TicketMessaging bileşeni yüklendi');
      console.log('Ticket ID:', ticket?.id);
      console.log('Current User:', currentUser?.name);
      console.log('Is Admin:', isAdmin);
    }
  }, [ticket, currentUser, isAdmin]);

  // Mesajları yükle
  const loadMessages = async () => {
    try {
      console.log('Mesajlar yükleniyor... Ticket ID:', ticket.id);
      
      // Kimlik doğrulama kontrolünü kaldır - doğrudan devam et
      console.log('Mesajlar yükleniyor...');
      
      // Önce sadece mesajları yükle
      let query = supabase
        .from('ticket_messages')
        .select('*')
        .eq('ticket_id', ticket.id);
      
      // Admin değilse iç mesajları filtrele
      if (!isAdmin) {
        query = query.eq('is_internal', false);
      }
      
      const { data, error } = await query.order('created_at', { ascending: true });

      if (error) {
        console.error('Mesajlar yüklenirken hata:', error);
        console.error('Hata detayları:', {
          code: error.code,
          message: error.message,
          details: error.details,
          hint: error.hint
        });
        toast.error(`Mesajlar yüklenemedi: ${error.message}`);
        return;
      }

      // Konuşma bağlamını güncelle
      if (data) {
        const contextText = data
          .map(msg => msg.message)
          .join(' ');
        setConversationContext(contextText);
      }

      console.log('Mesajlar başarıyla yüklendi:', data);

      // Duplicate mesajları temizle - aynı ID'ye sahip mesajları filtrele
      const uniqueMessages = data.filter((msg: any, index: number, self: any[]) => 
        index === self.findIndex((m: any) => m.id === msg.id)
      );
      
      // Ek güvenlik: Aynı içerik ve zaman damgasına sahip mesajları da filtrele
      const finalUniqueMessages = uniqueMessages.filter((msg: any, index: number, self: any[]) => 
        index === self.findIndex((m: any) => 
          m.id === msg.id || 
          (m.message === msg.message && 
           m.sender_type === msg.sender_type && 
           Math.abs(new Date(m.created_at).getTime() - new Date(msg.created_at).getTime()) < 1000) // 1 saniye içinde aynı mesaj
        )
      );
      
      console.log('İlk duplicate temizleme sonrası:', uniqueMessages.length);
      console.log('Final duplicate temizleme sonrası:', finalUniqueMessages.length);

      // Kullanıcı bilgilerini al
      const userIds = [...new Set(finalUniqueMessages.map((msg: any) => msg.sender_id))];
      console.log('Kullanıcı ID\'leri:', userIds);

      // Null ID'leri filtrele
      const validUserIds = userIds.filter(id => id !== null && id !== undefined);
      console.log('Geçerli kullanıcı ID\'leri:', validUserIds);

      // Customers tablosundan kullanıcı bilgilerini al (sadece geçerli ID'ler ile)
      let customers: any[] = [];
      if (validUserIds.length > 0) {
        const { data: customersData, error: customersError } = await supabase
          .from('customers')
          .select('id, name, email')
          .in('id', validUserIds);

        if (customersError) {
          console.error('Müşteri bilgileri alınırken hata:', customersError);
        } else {
          customers = customersData || [];
        }
      }

      // Agents tablosundan tüm kullanıcı bilgilerini al
      let agents: any[] = [];
      const { data: agentsData, error: agentsError } = await supabase
        .from('agents')
        .select('id, name, email');

      if (agentsError) {
        console.error('Ajan bilgileri alınırken hata:', agentsError);
      } else {
        agents = agentsData || [];
      }

      console.log('Müşteriler:', customers);
      console.log('Ajanlar:', agents);

             // Mesajları işle ve gönderen adlarını ekle
       const processedMessages = finalUniqueMessages.map((msg: any) => {

         
         // Gönderen adını belirle
         let senderName = 'Kullanıcı';
         
         // Eğer sender_id NULL ise, currentUser'dan al
         if (!msg.sender_id) {
           senderName = currentUser?.name || (msg.sender_type === 'admin' ? 'Temsilci' : 'Müşteri');
         } else if (msg.sender_type === 'admin') {
           // Admin ise agents tablosundan ara
           let agent = null;
           
           // Önce ID ile ara
           agent = agents?.find((a: any) => a.id === msg.sender_id);
           
           // Eğer bulunamazsa, sender_id'nin email olup olmadığını kontrol et
           if (!agent && msg.sender_id && msg.sender_id.includes('@')) {
             agent = agents?.find((a: any) => a.email === msg.sender_id);
           }
           
           // Eğer hala bulunamazsa, currentUser'ın email'i ile ara
           if (!agent && currentUser?.email) {
             agent = agents?.find((a: any) => a.email === currentUser.email);
           }
           

           
           if (agent?.name) {
             senderName = agent.name;
           } else if (agent?.email) {
             senderName = agent.email.split('@')[0]; // Email'in @ öncesi kısmını al
           } else {
             // Eğer agents tablosunda bulunamazsa, currentUser ile karşılaştır
             if (currentUser?.id === msg.sender_id) {
               senderName = currentUser.name || 'Temsilci';
             } else {
               senderName = 'Temsilci';
             }
           }
         } else {
           // Müşteri ise customers tablosundan ara
           const customer = customers?.find((c: any) => c.id === msg.sender_id);
           if (customer?.name) {
             senderName = customer.name;
           } else if (customer?.email) {
             senderName = customer.email.split('@')[0]; // Email'in @ öncesi kısmını al
           } else {
             // Eğer customers tablosunda bulunamazsa, UUID kontrolü yap
             const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
             if (uuidRegex.test(msg.sender_id)) {
               senderName = 'Müşteri';
             } else {
               senderName = 'Müşteri';
             }
           }
         }

        return {
          ...msg,
          sender_name: senderName,
          attachments: msg.attachments || [] // Attachments bilgisini ekle
        };
      });

             // State'i temizle ve yeni mesajları set et
             setMessages([]);
             setTimeout(() => {
               setMessages(processedMessages);
             }, 100);
       
       // Yeni mesajları otomatik olarak okundu işaretle
       const unreadMessages = processedMessages.filter(msg => 
         !msg.is_read && msg.sender_type !== (isAdmin ? 'admin' : 'customer')
       );
       
       if (unreadMessages.length > 0) {
         console.log(`${unreadMessages.length} okunmamış mesaj bulundu, okundu işaretleniyor...`);
         unreadMessages.forEach(msg => {
           markAsRead(msg.id);
         });
       }
     } catch (error) {
       console.error('Mesajlar yüklenirken catch hatası:', error);
       toast.error('Mesajlar yüklenemedi');
     }
   };

  // Mesaj gönder
  const sendMessage = async () => {
    if (!newMessage.trim()) {
      toast.error('Mesaj içeriği gerekli');
      return;
    }

    setIsLoading(true);

    try {
      console.log('Mesaj gönderme başlıyor...');
      console.log('Ticket ID:', ticket.id);
      console.log('Current User:', currentUser);
      console.log('Is Admin:', isAdmin);
      console.log('Message:', newMessage);

      // Kullanıcı ID'sini belirle - currentUser'dan al
      let userId = currentUser?.id;
      
      console.log('Current User ID:', userId);
      
      // Eğer currentUser'da id yoksa veya geçerli UUID değilse, NULL kullan
      if (!userId) {
        userId = null;
        console.log('Kullanıcı ID bulunamadı, NULL kullanılıyor');
      } else {
        // UUID formatını kontrol et
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
        if (!uuidRegex.test(userId)) {
          userId = null;
          console.log('Geçersiz UUID formatı, NULL kullanılıyor');
        }
      }
      
      console.log('Kullanılacak User ID:', userId);

             // Gerçek veritabanına mesaj gönder
       const { data, error } = await supabase
         .from('ticket_messages')
         .insert({
           ticket_id: ticket.id,
           sender_id: userId,
           sender_type: isAdmin ? 'admin' : 'customer',
           message: newMessage.replace(/<[^>]*>/g, ''), // HTML etiketlerini temizle
           message_type: 'text',
           is_internal: false,
           created_at: new Date().toISOString(),
           updated_at: new Date().toISOString(),
           // Alıntı özelliği
           ...(replyingTo && {
             reply_to: {
               message_id: replyingTo.id,
               sender_name: replyingTo.sender_name || 'Bilinmeyen',
               message: replyingTo.message
             }
           })
         });

      if (error) {
        console.error('Mesaj gönderme hatası:', error);
        console.error('Hata detayları:', {
          code: error.code,
          message: error.message,
          details: error.details,
          hint: error.hint
        });
        toast.error(`Mesaj gönderilemedi: ${error.message}`);
        return;
      }

      console.log('Mesaj başarıyla gönderildi:', data);

             // Yeni mesajı hemen state'e ekle
       const newMessageWithName: Message = {
         id: crypto.randomUUID(), // Geçici ID
         ticket_id: ticket.id,
         sender_id: currentUser?.id || '',
         sender_type: isAdmin ? 'admin' : 'customer',
         message: newMessage.replace(/<[^>]*>/g, ''), // HTML etiketlerini temizle
         message_type: 'text',
         is_internal: false,
         is_read: false,
         created_at: new Date().toISOString(),
         sender_name: isAdmin ? 'Admin' : 'Siz'
       };
      setMessages(prevMessages => [...prevMessages, newMessageWithName]);

      // Formu temizle
      setNewMessage('');
      
      // Alıntıyı temizle
      if (replyingTo) {
        setReplyingTo(null);
      }

      // Talep durumunu güncelle
      if (ticket.status === 'open') {
        const { error: updateError } = await supabase
          .from('tickets')
          .update({ 
            status: 'in_progress',
            updated_at: new Date().toISOString()
          })
          .eq('id', ticket.id);

        if (updateError) {
          console.error('Talep durumu güncellenirken hata:', updateError);
        }
      }

      // Timeline'a manuel kayıt ekle (trigger çalışmazsa)
      try {
        await supabase
          .from('ticket_timeline')
          .insert({
            ticket_id: ticket.id,
            action_type: 'message_sent',
            action_description: isAdmin ? 'Temsilci yanıt verdi' : 'Müşteri mesaj gönderdi',
            user_id: currentUser?.id,
            user_type: isAdmin ? 'admin' : 'customer',
            metadata: {
              message_id: (data as any)?.[0]?.id || crypto.randomUUID(),
              message_preview: newMessage.substring(0, 100),
              has_attachments: false
            }
          });
      } catch (timelineError) {
        console.log('Timeline kaydı eklenirken hata (normal olabilir):', timelineError);
      }

              toast.success('Mesaj iletildi');
      
      // Timeline'ı yenile
      if (onMessageSent) {
        onMessageSent();
      }
    } catch (error) {
      console.error('Mesaj gönderme catch hatası:', error);
      toast.error('Mesaj gönderilemedi');
    } finally {
      setIsLoading(false);
    }
  };

  // İç mesaj gönder (sadece admin)
  const sendInternalMessage = async () => {
    if (!newMessage.trim()) {
      toast.error('Mesaj içeriği gerekli');
      return;
    }

    setIsLoading(true);

    try {
      console.log('İç mesaj gönderme başlıyor...');
      console.log('Ticket ID:', ticket.id);
      console.log('Current User:', currentUser);
      console.log('Message:', newMessage);

      // Kullanıcı ID'sini belirle - currentUser'dan al
      let userId = currentUser?.id;
      
      // Eğer currentUser'da id yoksa veya geçerli UUID değilse, NULL kullan
      if (!userId) {
        userId = null;
        console.log('Kullanıcı ID bulunamadı, NULL kullanılıyor');
      } else {
        // UUID formatını kontrol et
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
        if (!uuidRegex.test(userId)) {
          userId = null;
          console.log('Geçersiz UUID formatı, NULL kullanılıyor');
        }
      }
      
      console.log('Kullanılacak User ID:', userId);

             // Gerçek veritabanına iç mesaj gönder
       const { data, error } = await supabase
         .from('ticket_messages')
         .insert({
           ticket_id: ticket.id,
           sender_id: userId,
           sender_type: 'admin',
           message: newMessage.replace(/<[^>]*>/g, ''), // HTML etiketlerini temizle
           message_type: 'text',
           is_internal: true,
           created_at: new Date().toISOString(),
           updated_at: new Date().toISOString()
         });

      if (error) {
        console.error('İç mesaj gönderme hatası:', error);
        console.error('Hata detayları:', {
          code: error.code,
          message: error.message,
          details: error.details,
          hint: error.hint
        });
        toast.error(`İç mesaj gönderilemedi: ${error.message}`);
        return;
      }

      console.log('İç mesaj başarıyla gönderildi:', data);

             // Yeni iç mesajı hemen state'e ekle
       const newMessageWithName: Message = {
         id: crypto.randomUUID(), // Geçici ID
         ticket_id: ticket.id,
         sender_id: currentUser?.id || '',
         sender_type: 'admin',
         message: newMessage.replace(/<[^>]*>/g, ''), // HTML etiketlerini temizle
         message_type: 'text',
         is_internal: true,
         is_read: false,
         created_at: new Date().toISOString(),
         sender_name: 'Admin (İç Not)'
       };
      setMessages(prevMessages => [...prevMessages, newMessageWithName]);

      // Timeline'a manuel kayıt ekle (iç mesaj için)
      try {
        await supabase
          .from('ticket_timeline')
          .insert({
            ticket_id: ticket.id,
            action_type: 'message_sent',
            action_description: 'Temsilci iç not ekledi',
            user_id: currentUser?.id,
            user_type: 'admin',
            metadata: {
              message_id: (data as any)?.[0]?.id || crypto.randomUUID(),
              message_preview: newMessage.substring(0, 100),
              has_attachments: false,
              is_internal: true
            }
          });
      } catch (timelineError) {
        console.log('Timeline kaydı eklenirken hata (normal olabilir):', timelineError);
      }

      setNewMessage('');
      
              toast.success('İç mesaj iletildi');
      
      if (onMessageSent) {
        onMessageSent();
      }
    } catch (error) {
      console.error('İç mesaj gönderme catch hatası:', error);
      toast.error('Mesaj gönderilemedi');
    } finally {
      setIsLoading(false);
    }
  };

  // Dosya ekleme işleyicisi
  const handleFilesChange = (files: File[]) => {
    setAttachments(files);
  };



  const handleDocumentationSave = (doc: any) => {
    console.log('Dokümantasyon kaydedildi:', doc);
    toast.success('Dokümantasyon kaydedildi');
  };

  // Dosya ile mesaj gönder
  const sendMessageWithFiles = async () => {
    if (!newMessage.trim() && attachments.length === 0) {
      toast.error('Mesaj içeriği veya dosya gerekli');
      return;
    }

    setIsLoading(true);
    
    // Dosya yükleme başladığını bildir
    if (attachments.length > 0) {
      toast.loading(`${attachments.length} dosya yükleniyor...`, { id: 'file-upload' });
    }

    try {
      // Dosyaları Supabase Storage'a yükle
      const uploadedFileUrls = [];
      const uploadedFileNames = [];
      const failedFiles = [];
      const fallbackFiles = []; // Base64 formatında dosyalar
      
      for (const file of attachments) {
        try {
          // Dosya boyutu kontrolü (25MB)
          if (file.size > 25 * 1024 * 1024) {
            failedFiles.push(`${file.name} (çok büyük - 25MB limit)`);
            continue;
          }

          // 5MB'dan büyük dosyalar için direkt base64 kullan
          if (file.size > 5 * 1024 * 1024) {
            try {
              const base64 = await new Promise<string>((resolve, reject) => {
                const reader = new FileReader();
                reader.onload = () => resolve(reader.result as string);
                reader.onerror = reject;
                reader.readAsDataURL(file);
              });
              
              fallbackFiles.push({
                name: file.name,
                size: file.size,
                type: file.type,
                data: base64
              });
              
              console.log(`${file.name} direkt base64 formatında hazırlandı (5MB+ dosya)`);
              continue;
            } catch (base64Error) {
              console.error('Base64 dönüştürme hatası:', base64Error);
              failedFiles.push(`${file.name} (base64 dönüştürme hatası)`);
              continue;
            }
          }

          // Dosya tipi kontrolü
          const allowedTypes = [
            'image/jpeg', 'image/png', 'image/gif', 'image/webp',
            'application/pdf', 'text/plain', 'text/csv',
            'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'application/zip', 'application/x-rar-compressed'
          ];
          
          if (!allowedTypes.includes(file.type) && !file.type.startsWith('image/')) {
            failedFiles.push(`${file.name} (desteklenmeyen tip)`);
            continue;
          }

          // Benzersiz dosya adı oluştur
          const fileExt = file.name.split('.').pop();
          const fileName = `${ticket.id}/${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
          
          console.log('Dosya yükleme başlıyor:', {
            fileName,
            fileSize: file.size,
            fileType: file.type,
            ticketId: ticket.id
          });
          
          // Dosyayı Supabase Storage'a yükle
          console.log('Dosya yükleme denemesi başlıyor...');
          
          const { data: uploadData, error: uploadError } = await supabase.storage
            .from('ticket-attachments')
            .upload(fileName, file, {
              cacheControl: '3600',
              upsert: false
            });

          if (uploadError) {
            console.error('Dosya yükleme hatası:', uploadError);
            console.error('Hata mesajı:', uploadError.message);
            
            // Fallback: Dosyayı base64 formatında hazırla
            try {
              const base64 = await new Promise<string>((resolve, reject) => {
                const reader = new FileReader();
                reader.onload = () => resolve(reader.result as string);
                reader.onerror = reject;
                reader.readAsDataURL(file);
              });
              
              fallbackFiles.push({
                name: file.name,
                size: file.size,
                type: file.type,
                data: base64
              });
              
              console.log(`${file.name} base64 formatında hazırlandı (fallback)`);
            } catch (base64Error) {
              console.error('Base64 dönüştürme hatası:', base64Error);
              failedFiles.push(`${file.name} (yükleme ve base64 hatası)`);
            }
            continue;
          }

          // Dosya URL'sini al
          const { data: urlData } = supabase.storage
            .from('ticket-attachments')
            .getPublicUrl(fileName);

          uploadedFileUrls.push(urlData.publicUrl);
          uploadedFileNames.push(file.name);

          console.log(`${file.name} başarıyla yüklendi:`, urlData.publicUrl);
        } catch (error) {
          console.error('Dosya yükleme hatası:', error);
          console.error('Hata tipi:', typeof error);
          console.error('Hata mesajı:', error instanceof Error ? error.message : String(error));
          failedFiles.push(`${file.name} (beklenmeyen hata)`);
          continue;
        }
      }

      // Dosya yükleme sonucunu bildir
      if (attachments.length > 0) {
        const totalFiles = uploadedFileUrls.length + fallbackFiles.length;
        if (failedFiles.length === 0) {
          toast.success(`${totalFiles} dosya başarıyla işlendi`, { id: 'file-upload' });
        } else if (totalFiles > 0) {
          toast.success(`${totalFiles} dosya işlendi, ${failedFiles.length} dosya başarısız`, { id: 'file-upload' });
        } else {
          toast.error(`Hiçbir dosya işlenemedi: ${failedFiles.join(', ')}`, { id: 'file-upload' });
        }
      }

             // Mesaj içeriğini hazırla - HTML etiketlerini temizle
       const messageContent = newMessage.trim().replace(/<[^>]*>/g, '');
      const messageType = (uploadedFileUrls.length > 0 || fallbackFiles.length > 0) ? 'file' : 'text';

      // Kullanıcı ID'sini belirle
      let userId = currentUser?.id;
      if (!userId) {
        userId = null;
      } else {
        // UUID formatını kontrol et
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
        if (!uuidRegex.test(userId)) {
          userId = null;
        }
      }

      // Gerçek veritabanına dosyalı mesaj gönder
      const { data, error } = await supabase
        .from('ticket_messages')
        .insert({
          ticket_id: ticket.id,
          sender_id: userId,
          sender_type: isAdmin ? 'admin' : 'customer',
          message: messageContent,
          message_type: messageType,
          is_internal: false,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          attachments: [...uploadedFileUrls, ...fallbackFiles.map(f => f.data)] // URL'leri ve base64 dosyaları kaydet
        });

      if (error) {
        console.error('Dosyalı mesaj gönderme hatası:', error);
        console.error('Hata detayları:', {
          code: error.code,
          message: error.message,
          details: error.details,
          hint: error.hint
        });
        toast.error(`Mesaj gönderilemedi: ${error.message}`);
        return;
      }

      console.log('Dosyalı mesaj başarıyla gönderildi:', data);

             // Yeni mesajı hemen state'e ekle
       const newMessageWithName: Message = {
         id: crypto.randomUUID(), // Geçici ID
         ticket_id: ticket.id,
         sender_id: currentUser?.id || '',
         sender_type: isAdmin ? 'admin' : 'customer',
         message: messageContent.replace(/<[^>]*>/g, ''), // HTML etiketlerini temizle
         message_type: messageType,
         is_internal: false,
         is_read: false,
         created_at: new Date().toISOString(),
         sender_name: isAdmin ? 'Admin' : 'Siz',
         attachments: [...uploadedFileUrls, ...fallbackFiles.map(f => f.data)]
       };
      setMessages(prevMessages => [...prevMessages, newMessageWithName]);

      setNewMessage('');
      setAttachments([]);
      setShowFileUpload(false);

      // Mesaj gönderme sonucunu bildir
      const totalFiles = uploadedFileUrls.length + fallbackFiles.length;
      if (totalFiles > 0) {
        toast.success(`Mesaj ve ${totalFiles} dosya gönderildi`);
      } else {
        toast.success('Mesaj iletildi');
      }
      
      if (onMessageSent) {
        onMessageSent();
      }
    } catch (error) {
      console.error('Dosyalı mesaj gönderme hatası:', error);
      toast.error('Mesaj gönderilemedi', { id: 'file-upload' });
    } finally {
      setIsLoading(false);
    }
  };

  // Mesajları okundu olarak işaretle
  const markAsRead = async (messageId: string) => {
    try {
      const { error } = await supabase
        .from('ticket_messages')
        .update({ 
          is_read: true,
          read_at: new Date().toISOString()
        })
        .eq('id', messageId);
      
      if (error) {
        console.error('Mesaj okundu işaretleme hatası:', error);
      } else {
        // Local state'i güncelle
        setMessages(prevMessages => 
          prevMessages.map(msg => 
            msg.id === messageId 
              ? { ...msg, is_read: true, read_at: new Date().toISOString() }
              : msg
          )
        );
      }
    } catch (error) {
      console.error('Mesaj okundu işaretleme hatası:', error);
    }
  };

  // Mesajları otomatik kaydır
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Mesajları yükle
  useEffect(() => {
    loadMessages();
  }, [ticket.id]);

  // Gerçek zamanlı mesaj güncellemeleri
  useEffect(() => {
    if (!ticket) return;

    const messagesSubscription = supabase
      .channel(`ticket_messages_${ticket.id}`)
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'ticket_messages',
          filter: `ticket_id=eq.${ticket.id}`
        }, 
        (payload: any) => {
          console.log('Message change detected:', payload);
          
          if (payload.eventType === 'INSERT') {
            // Admin değilse iç mesajları ekleme
            if (!isAdmin && payload.new.is_internal) {
              return;
            }
            
            // Kendi gönderdiğimiz mesajları tekrar ekleme (zaten state'te var)
            if (payload.new.sender_id === currentUser?.id) {
              console.log('Kendi mesajımız, tekrar eklenmiyor');
              return;
            }
            
            // Yeni mesajı doğrudan state'e ekle
            const newMessage = {
              ...payload.new,
              sender_name: payload.new.sender_type === 'admin' ? 'Admin' : 'Müşteri',
              attachments: payload.new.attachments || []
            };
            
            setMessages(prevMessages => {
              // Mesaj zaten varsa ekleme
              if (prevMessages.find(msg => msg.id === newMessage.id)) {
                console.log('Real-time subscription: Duplicate mesaj tespit edildi, eklenmedi:', newMessage.id);
                return prevMessages;
              }
              console.log('Real-time subscription: Yeni mesaj eklendi:', newMessage.id);
              return [...prevMessages, newMessage];
            });
            
            // Eğer mesaj müşteriden geldiyse bildirim göster
            if (payload.new.sender_type === 'customer') {
              toast.success('Müşteriden yeni mesaj geldi!', {
                duration: 3000,
                icon: '💬',
              });
            } else if (payload.new.sender_type === 'admin') {
              toast.success('Admin mesajı gönderildi!', {
                duration: 2000,
                icon: '✅',
              });
            }
          } else if (payload.eventType === 'UPDATE' && payload.new.is_read && payload.old.is_read === false) {
            // Mesaj okundu olarak işaretlendiğinde state'i güncelle
            setMessages(prevMessages => 
              prevMessages.map(msg => 
                msg.id === payload.new.id 
                  ? { ...msg, is_read: true, read_at: payload.new.read_at }
                  : msg
              )
            );
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(messagesSubscription);
    };
  }, [ticket.id]);

  // Filtrelenmiş mesajlar
  const filteredMessages = showInternal ? messages : messages.filter(msg => !msg.is_internal);

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
      {/* Mesajlaşma Başlığı */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Talep Mesajları
          </h3>
          {isAdmin && (
            <button
              onClick={() => setShowInternal(!showInternal)}
              className="flex items-center space-x-2 px-3 py-1 text-sm bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/40 transition-colors"
            >
              {showInternal ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              <span>{showInternal ? 'İç Mesajları Gizle' : 'İç Mesajları Göster'}</span>
            </button>
          )}
        </div>
      </div>

      {/* Mesaj Listesi */}
      <div className="h-96 overflow-y-auto p-4 space-y-4">
        {filteredMessages.length === 0 ? (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            <p>Henüz mesaj bulunmuyor</p>
            <p className="text-sm">İlk mesajı göndererek konuşmaya başlayın</p>
          </div>
        ) : (
          filteredMessages.map((message) => (
                         <div
               key={message.id}
               className={`flex ${message.sender_type === 'admin' ? 'justify-end' : 'justify-start'}`}
               onMouseEnter={() => {
                 // Sadece kendi mesajlarımızı değil, diğer kullanıcıların mesajlarını okundu işaretle
                 if (!message.is_read && message.sender_type !== (isAdmin ? 'admin' : 'customer')) {
                   markAsRead(message.id);
                 }
               }}
             >
              <div
                className={`max-w-xs lg:max-w-md px-4 py-3 rounded-lg group ${
                  message.sender_type === 'admin'
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white'
                } ${message.is_internal ? 'border-2 border-yellow-400' : ''}`}
              >
                {/* Alıntı Mesajı */}
                {message.reply_to && (
                  <div className="mb-2 p-2 bg-gray-200 dark:bg-gray-600 rounded border-l-4 border-blue-500">
                    <div className="flex items-center space-x-2 mb-1">
                      <svg className="w-3 h-3 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
                      </svg>
                      <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
                        {message.reply_to.sender_name}
                      </span>
                    </div>
                    <p className="text-xs text-gray-600 dark:text-gray-400 line-clamp-2">
                      {message.reply_to.message.length > 80 
                        ? `${message.reply_to.message.substring(0, 80)}...` 
                        : message.reply_to.message
                      }
                    </p>
                  </div>
                )}
                {/* Mesaj Başlığı */}
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    {message.sender_type === 'admin' ? (
                      <Shield className="w-4 h-4" />
                    ) : (
                      <User className="w-4 h-4" />
                    )}
                    <span className="text-xs font-medium">
                      {message.sender_name}
                      {message.is_internal && ' (İç Not)'}
                    </span>
                  </div>
                  <div className="flex items-center space-x-1">
                    {/* Yanıtla Butonu */}
                    <button
                      onClick={() => handleReplyToMessage(message)}
                      className="p-1 text-gray-400 hover:text-gray-600 dark:text-gray-300 dark:hover:text-gray-100 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                      title="Yanıtla"
                    >
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
                      </svg>
                    </button>
                    <div className="relative group">
                      <div className="flex items-center space-x-0.5">
                        <svg className={`w-5 h-5 ${message.is_read ? 'text-blue-500' : 'text-gray-400'}`} fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                        <svg className={`w-5 h-5 ${message.is_read ? 'text-blue-500' : 'text-gray-400'}`} fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-1 px-2 py-1 text-xs bg-gray-800 text-white rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap">
                        {message.is_read ? 'Okundu' : 'Okunmadı'}
                      </div>
                    </div>
                    <span className="text-xs opacity-75">
                      {format(new Date(message.created_at), 'HH:mm', { locale: tr })}
                    </span>
                  </div>
                </div>

                {/* Mesaj İçeriği */}
                <div className="space-y-2">
                  {/* Mesaj metnini ve dosya bilgilerini ayır */}
                  {(() => {
                    const lines = message.message.split('\n');
                    const textLines: string[] = [];
                    const fileLines: string[] = [];
                    
                    lines.forEach(line => {
                      if (line.trim().startsWith('📎')) {
                        fileLines.push(line.trim());
                      } else {
                        textLines.push(line);
                      }
                    });
                    
                    const messageText = textLines.join('\n').trim();
                    
                    return (
                      <>
                                                 {/* Mesaj metni */}
                         {messageText && (
                           <p className="text-sm whitespace-pre-wrap">
                             {messageText.replace(/<[^>]*>/g, '')}
                           </p>
                         )}
                        
                        {/* Dosya ekleri */}
                        {fileLines.length > 0 && (
                          <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-600">
                            <div className="flex items-center space-x-2 mb-2">
                              <Paperclip className="w-4 h-4 text-gray-500" />
                              <span className="text-xs font-medium text-gray-600 dark:text-gray-400">
                                Ekler ({fileLines.length})
                              </span>
                            </div>
                            <div className="space-y-1">
                              {fileLines.map((fileLine, index) => {
                                // 📎 [dosya_adi.pdf](data:application/pdf;base64,ABC123...) (125.5 KB) formatını parse et
                                const match = fileLine.match(/📎\s*\[(.+?)\]\(data:(.+?);base64,(.+?)\)\s*\((.+?)\)/);
                                if (match) {
                                  const fileName = match[1];
                                  const fileType = match[2];
                                  const base64Data = match[3];
                                  const fileSize = match[4];
                                  
                                  return (
                                    <div key={index} className="flex items-center space-x-2 p-2 bg-gray-50 dark:bg-gray-600 rounded-lg">
                                      <File className="w-4 h-4 text-blue-500" />
                                      <span className="text-xs text-gray-700 dark:text-gray-300 flex-1 truncate">
                                        {fileName}
                                      </span>
                                      <span className="text-xs text-gray-500 dark:text-gray-400">
                                        {fileSize}
                                      </span>
                                                                             <button
                                         onClick={() => {
                                           const fileKey = `${message.id}-base64-${index}`;
                                           
                                           // İndirme başladığını işaretle
                                           setDownloadingFiles(prev => new Set(prev).add(fileKey));
                                           
                                           try {
                                             // Base64 dosyayı indir
                                             const link = document.createElement('a');
                                             link.href = `data:${fileType};base64,${base64Data}`;
                                             link.download = fileName;
                                             document.body.appendChild(link);
                                             link.click();
                                             document.body.removeChild(link);
                                             toast.success(`${fileName} başarıyla indirildi`);
                                           } catch (error) {
                                             console.error('Base64 dosya indirme hatası:', error);
                                             const errorMessage = error instanceof Error ? error.message : 'Bilinmeyen hata';
                                             toast.error(`${fileName} indirilemedi: ${errorMessage}`);
                                           } finally {
                                             // İndirme bittiğini işaretle
                                             setDownloadingFiles(prev => {
                                               const newSet = new Set(prev);
                                               newSet.delete(fileKey);
                                               return newSet;
                                             });
                                           }
                                         }}
                                         disabled={downloadingFiles.has(`${message.id}-base64-${index}`)}
                                         className={`p-1 transition-colors ${
                                           downloadingFiles.has(`${message.id}-base64-${index}`)
                                             ? 'text-gray-400 cursor-not-allowed'
                                             : 'text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300'
                                         }`}
                                         title={downloadingFiles.has(`${message.id}-base64-${index}`) ? 'İndiriliyor...' : 'Dosyayı indir'}
                                       >
                                         {downloadingFiles.has(`${message.id}-base64-${index}`) ? (
                                           <div className="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin" />
                                         ) : (
                                           <Download className="w-3 h-3" />
                                         )}
                                       </button>
                                    </div>
                                  );
                                }
                                
                                // Eski format için fallback: 📎 dosya_adi.pdf (125.5 KB)
                                const oldMatch = fileLine.match(/📎\s*(.+?)\s*\((.+?)\)/);
                                if (oldMatch) {
                                  const fileName = oldMatch[1];
                                  const fileSize = oldMatch[2];
                                  
                                  return (
                                    <div key={index} className="flex items-center space-x-2 p-2 bg-gray-50 dark:bg-gray-600 rounded-lg">
                                      <File className="w-4 h-4 text-blue-500" />
                                      <span className="text-xs text-gray-700 dark:text-gray-300 flex-1 truncate">
                                        {fileName}
                                      </span>
                                      <span className="text-xs text-gray-500 dark:text-gray-400">
                                        {fileSize}
                                      </span>
                                      <button
                                        onClick={() => {
                                          toast.error('Bu dosya için veri bulunamadı');
                                        }}
                                        className="p-1 text-gray-400 cursor-not-allowed"
                                        title="Dosya verisi yok"
                                      >
                                        <Download className="w-3 h-3" />
                                      </button>
                                    </div>
                                  );
                                }
                                
                                return (
                                  <div key={index} className="flex items-center space-x-2 p-2 bg-gray-50 dark:bg-gray-600 rounded-lg">
                                    <File className="w-4 h-4 text-blue-500" />
                                    <span className="text-xs text-gray-700 dark:text-gray-300 flex-1 truncate">
                                      {fileLine.replace('📎', '').trim()}
                                    </span>
                                    <button
                                      onClick={() => {
                                        toast.error('Dosya formatı tanınmadı');
                                      }}
                                      className="p-1 text-gray-400 cursor-not-allowed"
                                      title="Dosya formatı tanınmadı"
                                    >
                                      <Download className="w-3 h-3" />
                                    </button>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        )}
                      </>
                    );
                  })()}
                  
                  {/* Yeni attachments sistemi - Supabase Storage URL'leri */}
                  {message.attachments && message.attachments.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-600">
                      <div className="flex items-center space-x-2 mb-2">
                        <Paperclip className="w-4 h-4 text-gray-500" />
                        <span className="text-xs font-medium text-gray-600 dark:text-gray-400">
                          Ekler ({message.attachments.length})
                        </span>
                      </div>
                      <div className="space-y-1">
                        {message.attachments.map((attachment, index) => {
                          // URL'den dosya adını çıkar
                          const fileName = attachment.split('/').pop() || `Dosya ${index + 1}`;
                          const isImage = /\.(jpg|jpeg|png|gif|webp)$/i.test(fileName);
                          
                          return (
                            <div key={index} className="flex items-center space-x-2 p-2 bg-gray-50 dark:bg-gray-600 rounded-lg">
                              {isImage ? (
                                <div className="w-8 h-8 rounded overflow-hidden">
                                  <img 
                                    src={attachment} 
                                    alt={fileName}
                                    className="w-full h-full object-cover"
                                    onError={(e) => {
                                      e.currentTarget.style.display = 'none';
                                    }}
                                  />
                                </div>
                              ) : (
                                <File className="w-4 h-4 text-blue-500" />
                              )}
                              <span className="text-xs text-gray-700 dark:text-gray-300 flex-1 truncate">
                                {fileName}
                              </span>
                                                             <button
                                 onClick={async () => {
                                   const fileKey = `${message.id}-${index}`;
                                   
                                   // İndirme başladığını işaretle
                                   setDownloadingFiles(prev => new Set(prev).add(fileKey));
                                   
                                   try {
                                     // Dosyayı fetch ile al
                                     const response = await fetch(attachment);
                                     if (!response.ok) {
                                       throw new Error(`HTTP ${response.status}: ${response.statusText}`);
                                     }
                                     
                                     // Blob oluştur
                                     const blob = await response.blob();
                                     
                                     // Dosyayı indir
                                     const url = window.URL.createObjectURL(blob);
                                     const link = document.createElement('a');
                                     link.href = url;
                                     link.download = fileName;
                                     document.body.appendChild(link);
                                     link.click();
                                     document.body.removeChild(link);
                                     
                                     // URL'yi temizle
                                     window.URL.revokeObjectURL(url);
                                     
                                     toast.success(`${fileName} başarıyla indirildi`);
                                   } catch (error) {
                                     console.error('Dosya indirme hatası:', error);
                                     const errorMessage = error instanceof Error ? error.message : 'Bilinmeyen hata';
                                     toast.error(`${fileName} indirilemedi: ${errorMessage}`);
                                   } finally {
                                     // İndirme bittiğini işaretle
                                     setDownloadingFiles(prev => {
                                       const newSet = new Set(prev);
                                       newSet.delete(fileKey);
                                       return newSet;
                                     });
                                   }
                                 }}
                                 disabled={downloadingFiles.has(`${message.id}-${index}`)}
                                 className={`p-1 transition-colors ${
                                   downloadingFiles.has(`${message.id}-${index}`)
                                     ? 'text-gray-400 cursor-not-allowed'
                                     : 'text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300'
                                 }`}
                                 title={downloadingFiles.has(`${message.id}-${index}`) ? 'İndiriliyor...' : 'Dosyayı indir'}
                               >
                                 {downloadingFiles.has(`${message.id}-${index}`) ? (
                                   <div className="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin" />
                                 ) : (
                                   <Download className="w-3 h-3" />
                                 )}
                               </button>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

             {/* Mesaj Gönderme Formu */}
       <div className="p-4 border-t border-gray-200 dark:border-gray-700">
         {/* Alıntı Göstergesi */}
         {replyingTo && (
           <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
             <div className="flex items-center justify-between">
               <div className="flex items-center space-x-2">
                 <svg className="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
                 </svg>
                 <span className="text-sm font-medium text-blue-700 dark:text-blue-300">
                   {replyingTo.sender_name} mesajına yanıt veriyorsunuz
                 </span>
               </div>
               <button
                 onClick={cancelReply}
                 className="text-blue-500 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-200"
                 title="Yanıtlamayı iptal et"
               >
                 <X className="w-4 h-4" />
               </button>
             </div>
             <p className="mt-1 text-sm text-blue-600 dark:text-blue-400 line-clamp-2">
               {replyingTo.message.length > 100 
                 ? `${replyingTo.message.substring(0, 100)}...` 
                 : replyingTo.message
               }
             </p>
           </div>
         )}
         
         {/* Dosya Ekleme Bölümü */}
         {showFileUpload && (
           <div className="mb-4 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
             <div className="flex items-center justify-between mb-2">
               <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                 Dosya Ekleri
               </span>
               <button
                 onClick={() => setShowFileUpload(false)}
                 className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
               >
                 <X className="w-4 h-4" />
               </button>
             </div>
             <FileUpload
               onFilesChange={handleFilesChange}
               maxFiles={5}
               maxSize={10}
               className="mb-2"
             />
           </div>
         )}

         <div className="flex space-x-2">
           <div className="flex-1">
             <RichTextEditor
               value={newMessage}
               onChange={setNewMessage}
               placeholder="Mesajınızı yazın... (CTRL+ENTER ile gönder)"
               className="min-h-[120px]"
               showToolbar={true}
               maxLength={2000}
               onEnterPress={() => {
                 if (attachments.length > 0) {
                   sendMessageWithFiles();
                 } else {
                   sendMessage();
                 }
               }}
             />
           </div>
           <div className="flex flex-col space-y-1.5">
             {/* Sesli Mesaj Butonu */}
             <VoiceMessage
               onSendMessage={(text) => {
                 setNewMessage(text);
                 // Sesli mesaj gönderildikten sonra otomatik olarak gönder
                 setTimeout(() => {
                   if (attachments.length > 0) {
                     sendMessageWithFiles();
                   } else {
                     sendMessage();
                   }
                 }, 100);
               }}
               className="mb-1"
             />
             
             {/* Dosya Ekleme Butonu */}
             <button
               onClick={() => setShowFileUpload(!showFileUpload)}
               className="px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-lg transition-colors"
               title="Dosya ekle"
             >
               <Paperclip className="w-4 h-4" />
             </button>
             
             {/* Mesaj Gönderme Butonu */}
             <button
               onClick={attachments.length > 0 ? sendMessageWithFiles : sendMessage}
               disabled={isLoading || (!newMessage.trim() && attachments.length === 0)}
               className="px-4 py-2 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-400 text-white rounded-lg transition-colors"
               title={isLoading ? 'Gönderiliyor...' : 'Mesaj gönder'}
             >
               {isLoading ? (
                 <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
               ) : (
                 <Send className="w-4 h-4" />
               )}
             </button>
             
             {/* İç Mesaj Butonu (Sadece Admin) */}
             {isAdmin && (
               <button
                 onClick={sendInternalMessage}
                 disabled={isLoading || !newMessage.trim()}
                 className="px-4 py-2 bg-yellow-500 hover:bg-yellow-600 disabled:bg-gray-400 text-white rounded-lg transition-colors"
                 title="İç not olarak gönder (müşteri göremez)"
               >
                 <Shield className="w-4 h-4" />
               </button>
             )}
           </div>
         </div>
       </div>

       {/* Yeni Özellikler Butonları */}
       {isAdmin && (
         <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
           <div className="flex items-center justify-between mb-4">
             <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
               Temsilci Araçları
             </h3>
           </div>
           
           <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
             <button
               onClick={() => setShowDocumentation(!showDocumentation)}
               className={`p-3 rounded-lg border-2 transition-all duration-200 flex flex-col items-center gap-2 ${
                 showDocumentation 
                   ? 'border-green-500 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300' 
                   : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 hover:border-green-400 dark:hover:border-green-500'
               }`}
             >
               <FileText className="w-6 h-6" />
               <span className="text-sm font-medium">Otomatik Dokümantasyon</span>
             </button>
             
             <button
               onClick={() => setShowCrossChannel(!showCrossChannel)}
               className={`p-3 rounded-lg border-2 transition-all duration-200 flex flex-col items-center gap-2 ${
                 showCrossChannel 
                   ? 'border-orange-500 bg-orange-50 dark:bg-orange-900/20 text-orange-700 dark:text-orange-300' 
                   : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 hover:border-orange-400 dark:hover:border-orange-500'
               }`}
             >
               <Share2 className="w-6 h-6" />
               <span className="text-sm font-medium">Cross-Channel</span>
             </button>
           </div>
         </div>
       )}

       {/* Yeni Özellikler Panelleri */}
       {isAdmin && (
         <>


           {/* Otomatik Dokümantasyon */}
           {showDocumentation && (
             <div className="p-4 border-t border-gray-200 dark:border-gray-700">
               <AutoDocumentation
                 ticket={ticket}
                 conversationHistory={messages}
                 currentUser={currentUser}
                 onSave={handleDocumentationSave}
               />
             </div>
           )}



           {/* Cross-Channel Context */}
           {showCrossChannel && (
             <div className="p-4 border-t border-gray-200 dark:border-gray-700">
               <CrossChannelContext
                 customerId={ticket.customer_id || 'default-customer-id'}
                 currentInteraction={{
                   id: 'current',
                   channelId: 'chat',
                   channelType: 'chat',
                   channelIcon: <MessageSquare className="w-4 h-4" />,
                   channelColor: 'bg-green-500',
                   interactionType: 'message',
                   content: 'Mevcut konuşma',
                   timestamp: new Date(),
                   sentiment: 'neutral',
                   priority: 'medium',
                   tags: ['aktif']
                 }}
                 onInteractionSelect={(interaction) => {
                   console.log('Seçilen etkileşim:', interaction);
                   toast.success(`${interaction.channelType} kanalından etkileşim seçildi`);
                 }}
                 onContextShare={(context) => {
                   console.log('Paylaşılan bağlam:', context);
                   toast.success('Müşteri bağlamı paylaşıldı');
                 }}
               />
             </div>
           )}
         </>
       )}
    </div>
  );
};

export default TicketMessaging;
