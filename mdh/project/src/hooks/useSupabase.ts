import { useState, useEffect } from 'react';
import { supabase, Customer, Agent, Ticket } from '../lib/supabase';
import { toast } from 'react-hot-toast';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabaseClient = createClient(supabaseUrl, supabaseAnonKey);

export const useSupabase = () => {
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [selectedItems, setSelectedItems] = useState<string[]>([]);

  // Customers
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [notifications, setNotifications] = useState<any[]>([]);
  
  // Financial Management
  const [subscriptionPlans, setSubscriptionPlans] = useState<any[]>([]);
  const [subscriptions, setSubscriptions] = useState<any[]>([]);
  const [payments, setPayments] = useState<any[]>([]);
  const [expenseCategories, setExpenseCategories] = useState<any[]>([]);
  const [expenses, setExpenses] = useState<any[]>([]);
  const [promotions, setPromotions] = useState<any[]>([]);
  const [promotionUsage, setPromotionUsage] = useState<any[]>([]);
  const [budgets, setBudgets] = useState<any[]>([]);
  const [financialReports, setFinancialReports] = useState<any[]>([]);
  // SLA thresholds (hours)
  const SLA_THRESHOLDS = {
    high: 4,
    medium: 24,
    low: 72,
  } as const;

  // Akıllı öncelik hesaplama fonksiyonu
  const calculateSmartPriority = async (ticketId: string) => {
    try {
      const { data, error } = await supabase
        .rpc('calculate_smart_priority', { p_ticket_id: ticketId });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Akıllı öncelik hesaplama hatası:', error);
      throw error;
    }
  };

  // Toplu öncelik hesaplama
  const calculateBulkPriority = async (ticketIds: string[]) => {
    try {
      const results = [];
      for (const ticketId of ticketIds) {
        const result = await calculateSmartPriority(ticketId);
        results.push(result);
      }
      return results;
    } catch (error) {
      console.error('Toplu öncelik hesaplama hatası:', error);
      throw error;
    }
  };

  // SLA kayıtlarını getir
  const fetchSLARecords = async (ticketId?: string) => {
    try {
      let query = supabase
        .from('sla_tracking')
        .select(`
          *,
          ticket:tickets(title, status, customer_id, agent_id),
          customer:customers(name, email),
          agent:agents(name, status)
        `)
        .order('deadline', { ascending: true });

      if (ticketId) {
        query = query.eq('ticket_id', ticketId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('SLA kayıtları getirme hatası:', error);
      throw error;
    }
  };

  // Öncelik hesaplama geçmişini getir
  const fetchPriorityCalculations = async (ticketId?: string) => {
    try {
      let query = supabase
        .from('priority_calculations')
        .select('*')
        .order('calculated_at', { ascending: false });

      if (ticketId) {
        query = query.eq('ticket_id', ticketId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Öncelik hesaplama geçmişi getirme hatası:', error);
      throw error;
    }
  };

  // Filtered and paginated data
  const paginatedTickets = tickets.slice(0, 10); // Basit pagination
  const totalPages = Math.ceil(tickets.length / 10);

  // Fetch functions
  const fetchCustomers = async () => {
    setLoading(true);
    try {
      console.log('🔍 Fetching customers...');
      
      const { data, error } = await supabase
        .from('customers')
        .select('*')
        .order('created_at', { ascending: false });
      
      console.log('🔍 Full Supabase response:', { data, error, count: data?.length });
      
      console.log('🔍 Supabase response:', { data, error });
      
      if (error) {
        console.error('❌ Supabase error:', error);
        throw error;
      }
      
      console.log('✅ Raw customers data:', data);
      console.log('✅ Data length:', data?.length);
      
      // Duplicate müşterileri filtrele
      const uniqueCustomers = data ? data.filter((customer, index, self) => 
        index === self.findIndex(c => c.id === customer.id)
      ) : [];
      
      console.log('✅ Filtered customers:', uniqueCustomers);
      console.log('✅ Final count:', uniqueCustomers.length);
      
      setCustomers(uniqueCustomers);
      console.log('✅ State updated with customers');
    } catch (error) {
      console.error('❌ Error in fetchCustomers:', error);
      toast.error('Müşteriler yüklenirken hata oluştu');
    } finally {
      setLoading(false);
      console.log('✅ Loading finished');
    }
  };

  const fetchAgents = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('agents')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      // Duplicate temsilcileri filtrele
      const uniqueAgents = data ? data.filter((agent, index, self) => 
        index === self.findIndex(a => a.id === agent.id)
      ) : [];
      
      setAgents(uniqueAgents);
    } catch (error) {
      toast.error('Temsilciler yüklenirken hata oluştu');
      console.error('Error fetching agents:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchTickets = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('tickets')
        .select(`
          *,
          customers!tickets_customer_id_fkey (name, email, avatar_url, company),
          agents!tickets_agent_id_fkey (name, email, avatar_url)
        `)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      // Duplicate talepleri filtrele
      const uniqueTickets = data ? data.filter((ticket, index, self) => 
        index === self.findIndex(t => t.id === ticket.id)
      ) : [];
      
      setTickets(uniqueTickets);
    } catch (error) {
      toast.error('Talepler yüklenirken hata oluştu');
      console.error('Error fetching tickets:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchNotifications = async () => {
    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10);
      
      if (error) throw error;
      setNotifications(data || []);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    }
  };

  const addNotification = async (payload: { title: string; message: string; type: string; is_read?: boolean }) => {
    try {
      const notification = {
        title: payload.title,
        message: payload.message,
        type: payload.type,
        is_read: payload.is_read ?? false,
        created_at: new Date().toISOString(),
      };
      
      console.log('Notification ekleniyor:', notification);
      
      // Önce notifications tablosunun varlığını kontrol et
      const { data: tableCheck, error: tableError } = await supabase
        .from('notifications')
        .select('id')
        .limit(1);
      
      if (tableError) {
        console.error('Notifications tablosu erişim hatası:', tableError);
        return; // Sessizce devam et
      }
      
      const { data, error } = await supabase.from('notifications').insert(notification).select();
      
      if (error) {
        console.error('Notification insert hatası:', error);
        // Hata durumunda sessizce devam et
        return;
      }
      
      console.log('Notification başarıyla eklendi:', data);
      await fetchNotifications();
    } catch (error) {
      console.error('Error adding notification:', error);
      // Hata durumunda sessizce devam et
    }
  };

  // Seed example notifications for demo
  const seedExampleNotifications = async () => {
    try {
      const examples = [
        {
          title: 'Yeni ödeme alındı',
          message: 'Ahmet Yılmaz için ₺299,99 tutarında ödeme alındı',
          type: 'payment',
          is_read: false,
          created_at: new Date().toISOString(),
        },
        {
          title: 'Talep çözümlendi',
          message: 'Talep #123 başarıyla çözüldü',
          type: 'ticket',
          is_read: false,
          created_at: new Date(Date.now() - 10 * 60 * 1000).toISOString(),
        },
        {
          title: 'Yeni müşteri kaydı',
          message: 'Ayşe Demir sisteme kayıt oldu',
          type: 'info',
          is_read: true,
          created_at: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
        },
      ];

      for (const e of examples) {
        await supabase.from('notifications').insert(e);
      }
      await fetchNotifications();
      toast.success('Örnek bildirimler eklendi');
    } catch (error) {
      console.error('Error seeding notifications:', error);
      toast.error('Örnek bildirimler eklenemedi');
    }
  };

  // SLA utility
  const getSlaTargetHours = (priority: string) => {
    if (priority === 'high') return SLA_THRESHOLDS.high;
    if (priority === 'medium') return SLA_THRESHOLDS.medium;
    return SLA_THRESHOLDS.low;
  };

  const getSlaInfo = (ticket: any) => {
    const createdAt = new Date(ticket.created_at).getTime();
    const targetMs = getSlaTargetHours(ticket.priority) * 60 * 60 * 1000;
    const dueAt = createdAt + targetMs;
    const now = Date.now();
    const remainingMs = dueAt - now;
    const breached = remainingMs < 0 && ticket.status !== 'resolved' && ticket.status !== 'closed';
    return { remainingMs, breached };
  };

  // Periodic SLA check → creates notifications for risk/breach
  const checkSlaAndNotify = async () => {
    try {
      await fetchTickets();
      const currentNotifications = notifications;
      for (const t of tickets) {
        if (t.status === 'resolved' || t.status === 'closed') continue;
        const sla = getSlaInfo(t);
        const hasSimilar = currentNotifications.some((n: any) =>
          n.type === 'ticket' && typeof n.message === 'string' && n.message.includes(String(t.id)) && !n.is_read
        );
        if (hasSimilar) continue;
        if (!sla.breached && sla.remainingMs <= 4 * 60 * 60 * 1000) {
          await addNotification({ title: 'SLA Riski', message: `Talep ${t.id} SLA riskinde (≤4 saat)`, type: 'ticket' });
        }
        if (sla.breached) {
          await addNotification({ title: 'SLA İhlali', message: `Talep ${t.id} için SLA ihlali oluştu`, type: 'ticket' });
        }
      }
    } catch (error) {
      console.error('Error checking SLA:', error);
    }
  };

  // CRUD operations
  const updateTicketStatus = async (ticketId: string, status: string) => {
    try {
      const { error } = await supabase
        .from('tickets')
        .update({ 
          status, 
          updated_at: new Date().toISOString(),
          ...(status === 'resolved' && { resolved_at: new Date().toISOString() })
        })
        .eq('id', ticketId);

      if (error) throw error;
      
      // State'i anında güncelle
      setTickets(prevTickets => 
        prevTickets.map(ticket => 
          ticket.id === ticketId 
            ? { 
                ...ticket, 
                status, 
                updated_at: new Date().toISOString(),
                ...(status === 'resolved' && { resolved_at: new Date().toISOString() })
              }
            : ticket
        )
      );
      
      toast.success('Talep durumu güncellendi');
      
      // Log the action
      await logAction('ticket_status_updated', { ticket_id: ticketId, new_status: status });
      await addNotification({
        title: 'Talep durumu güncellendi',
        message: `Talep ${ticketId} ${status} olarak güncellendi`,
        type: 'ticket',
      });
    } catch (error) {
      toast.error('Durum güncellenirken hata oluştu');
      console.error('Error updating ticket status:', error);
    }
  };

  // Yeni fonksiyon: Talep kategorisini güncelle
  const updateTicketCategory = async (ticketId: string, category: string) => {
    try {
      const { error } = await supabase
        .from('tickets')
        .update({ 
          category, 
          updated_at: new Date().toISOString()
        })
        .eq('id', ticketId);

      if (error) throw error;
      
      // State'i anında güncelle
      setTickets(prevTickets => 
        prevTickets.map(ticket => 
          ticket.id === ticketId 
            ? { ...ticket, category, updated_at: new Date().toISOString() }
            : ticket
        )
      );
      
      toast.success('Talep kategorisi güncellendi');
      
      // Log the action
      await logAction('ticket_category_updated', { ticket_id: ticketId, new_category: category });
      await addNotification({
        title: 'Talep kategorisi güncellendi',
        message: `Talep ${ticketId} kategorisi ${category} olarak güncellendi`,
        type: 'ticket',
      });
    } catch (error) {
      toast.error('Kategori güncellenirken hata oluştu');
      console.error('Error updating ticket category:', error);
    }
  };

  // Yeni fonksiyon: Talep önceliğini güncelle
  const updateTicketPriority = async (ticketId: string, priority: string) => {
    try {
      const { error } = await supabase
        .from('tickets')
        .update({ 
          priority, 
          updated_at: new Date().toISOString()
        })
        .eq('id', ticketId);

      if (error) throw error;
      
      // State'i anında güncelle
      setTickets(prevTickets => 
        prevTickets.map(ticket => 
          ticket.id === ticketId 
            ? { ...ticket, priority, updated_at: new Date().toISOString() }
            : ticket
        )
      );
      
      toast.success('Talep önceliği güncellendi');
      
      // Log the action
      await logAction('ticket_priority_updated', { ticket_id: ticketId, new_priority: priority });
      await addNotification({
        title: 'Talep önceliği güncellendi',
        message: `Talep ${ticketId} önceliği ${priority} olarak güncellendi`,
        type: 'ticket',
      });
    } catch (error) {
      toast.error('Öncelik güncellenirken hata oluştu');
      console.error('Error updating ticket priority:', error);
    }
  };

  // Yeni fonksiyon: Talep başlığını güncelle
  const updateTicketTitle = async (ticketId: string, title: string) => {
    try {
      const { error } = await supabase
        .from('tickets')
        .update({ 
          title, 
          updated_at: new Date().toISOString()
        })
        .eq('id', ticketId);

      if (error) throw error;
      
      // State'i anında güncelle
      setTickets(prevTickets => 
        prevTickets.map(ticket => 
          ticket.id === ticketId 
            ? { ...ticket, title, updated_at: new Date().toISOString() }
            : ticket
        )
      );
      
      toast.success('Talep başlığı güncellendi');
      
      // Log the action
      await logAction('ticket_title_updated', { ticket_id: ticketId, new_title: title });
      await addNotification({
        title: 'Talep başlığı güncellendi',
        message: `Talep ${ticketId} başlığı güncellendi`,
        type: 'ticket',
      });
    } catch (error) {
      toast.error('Başlık güncellenirken hata oluştu');
      console.error('Error updating ticket title:', error);
    }
  };

  // Yeni fonksiyon: Talep açıklamasını güncelle
  const updateTicketDescription = async (ticketId: string, description: string) => {
    try {
      const { error } = await supabase
        .from('tickets')
        .update({ 
          description, 
          updated_at: new Date().toISOString()
        })
        .eq('id', ticketId);

      if (error) throw error;
      
      // State'i anında güncelle
      setTickets(prevTickets => 
        prevTickets.map(ticket => 
          ticket.id === ticketId 
            ? { ...ticket, description, updated_at: new Date().toISOString() }
            : ticket
        )
      );
      
      toast.success('Talep açıklaması güncellendi');
      
      // Log the action
      await logAction('ticket_description_updated', { ticket_id: ticketId });
      await addNotification({
        title: 'Talep açıklaması güncellendi',
        message: `Talep ${ticketId} açıklaması güncellendi`,
        type: 'ticket',
      });
    } catch (error) {
      toast.error('Açıklama güncellenirken hata oluştu');
      console.error('Error updating ticket description:', error);
    }
  };

  // Yeni fonksiyon: Talebi üst seviyeye yükselt
  const escalateTicket = async (ticketId: string) => {
    try {
      const ticket = tickets.find(t => t.id === ticketId);
      if (!ticket) {
        toast.error('Talep bulunamadı');
        return;
      }

      // Önceliği yükselt
      let newPriority = ticket.priority;
      if (ticket.priority === 'low') {
        newPriority = 'medium';
      } else if (ticket.priority === 'medium') {
        newPriority = 'high';
      }

      // Durumu "in_progress" yap
      const { error } = await supabase
        .from('tickets')
        .update({ 
          priority: newPriority,
          status: 'in_progress',
          updated_at: new Date().toISOString()
        })
        .eq('id', ticketId);

      if (error) throw error;
      
      // State'i anında güncelle
      setTickets(prevTickets => 
        prevTickets.map(ticket => 
          ticket.id === ticketId 
            ? { 
                ...ticket, 
                priority: newPriority, 
                status: 'in_progress', 
                updated_at: new Date().toISOString() 
              }
            : ticket
        )
      );
      
      toast.success('Talep üst seviyeye yükseltildi');
      
      // Log the action
      await logAction('ticket_escalated', { 
        ticket_id: ticketId, 
        old_priority: ticket.priority, 
        new_priority: newPriority 
      });
      await addNotification({
        title: 'Talep yükseltildi',
        message: `Talep ${ticketId} üst seviyeye yükseltildi (${newPriority} öncelik)`,
        type: 'ticket',
      });
    } catch (error) {
      toast.error('Talep yükseltilirken hata oluştu');
      console.error('Error escalating ticket:', error);
    }
  };

  // Yeni fonksiyon: Talepleri birleştir
  const mergeTickets = async (sourceTicketId: string, targetTicketId: string) => {
    try {
      const sourceTicket = tickets.find(t => t.id === sourceTicketId);
      const targetTicket = tickets.find(t => t.id === targetTicketId);
      
      if (!sourceTicket || !targetTicket) {
        toast.error('Talepler bulunamadı');
        return;
      }

      // Hedef talebin açıklamasını güncelle
      const mergedDescription = `${targetTicket.description || ''}\n\n--- BİRLEŞTİRİLEN TALEP ---\nTalep #${sourceTicket.id.slice(0, 8)}: ${sourceTicket.title}\n${sourceTicket.description || ''}`;
      
      // Hedef talebi güncelle
      const { error: updateError } = await supabase
        .from('tickets')
        .update({ 
          description: mergedDescription,
          updated_at: new Date().toISOString()
        })
        .eq('id', targetTicketId);

      if (updateError) throw updateError;

      // Kaynak talebi kapat
      const { error: closeError } = await supabase
        .from('tickets')
        .update({ 
          status: 'closed',
          description: `Bu talep #${targetTicket.id.slice(0, 8)} numaralı isteğe birleştirildi.`,
          updated_at: new Date().toISOString()
        })
        .eq('id', sourceTicketId);

      if (closeError) throw closeError;

      // Bağımlılık oluştur
      await createDependency({
        sourceTicketId: targetTicketId,
        targetTicketId: sourceTicketId,
        type: 'related'
      });
      
      toast.success('Talepler başarıyla birleştirildi');
      fetchTickets();
      
      // Log the action
      await logAction('tickets_merged', { 
        source_ticket_id: sourceTicketId, 
        target_ticket_id: targetTicketId 
      });
      await addNotification({
        title: 'Talepler birleştirildi',
        message: `Talep #${sourceTicket.id.slice(0, 8)} #${targetTicket.id.slice(0, 8)} numaralı isteğe birleştirildi`,
        type: 'ticket',
      });
    } catch (error) {
      toast.error('Talepler birleştirilirken hata oluştu');
      console.error('Error merging tickets:', error);
    }
  };

  // Yeni fonksiyon: Takip talebi oluştur
  const createFollowUpTicket = async (parentTicketId: string) => {
    try {
      const parentTicket = tickets.find(t => t.id === parentTicketId);
      if (!parentTicket) {
        toast.error('Ana talep bulunamadı');
        return;
      }

      const customer = customers.find(c => c.id === parentTicket.customer_id);
      if (!customer) {
        toast.error('Müşteri bilgisi bulunamadı');
        return;
      }

      const followUpData = {
        title: `Takip: ${parentTicket.title}`,
        description: `Bu talep, #${parentTicket.id.slice(0, 8)} numaralı talebin takibidir.\n\nAna Talep Detayları:\n${parentTicket.description || 'Açıklama bulunmuyor'}`,
        category: parentTicket.category,
        priority: parentTicket.priority,
        customer_id: parentTicket.customer_id,
        agent_id: parentTicket.agent_id,
        status: 'open'
      };

      const { data, error } = await supabase
        .from('tickets')
        .insert(followUpData)
        .select()
        .single();

      if (error) throw error;
      
              toast.success('Takip isteği oluşturuldu');
      fetchTickets();
      
      // Ana talep ile bağımlılık oluştur
      await createDependency({
        sourceTicketId: data.id,
        targetTicketId: parentTicketId,
        type: 'depends_on'
      });
      
      // Log the action
      await logAction('follow_up_ticket_created', { 
        parent_ticket_id: parentTicketId, 
        follow_up_ticket_id: data.id 
      });
              await addNotification({
          title: 'Takip İsteği Oluşturuldu',
          message: `#${parentTicket.id.slice(0, 8)} numaralı talep için takip isteği oluşturuldu`,
          type: 'ticket',
        });

      return data;
    } catch (error) {
      toast.error('Takip talebi oluşturulurken hata oluştu');
      console.error('Error creating follow-up ticket:', error);
    }
  };

  const assignTicket = async (ticketId: string, agentId: string) => {
    try {
      const { error } = await supabase
        .from('tickets')
        .update({ 
          agent_id: agentId,
          updated_at: new Date().toISOString()
        })
        .eq('id', ticketId);

      if (error) throw error;
      
      // State'i anında güncelle
      setTickets(prevTickets => 
        prevTickets.map(ticket => 
          ticket.id === ticketId 
            ? { ...ticket, agent_id: agentId, updated_at: new Date().toISOString() }
            : ticket
        )
      );
      
      toast.success('Talep atandı');
      
      // Log the action
      await logAction('ticket_assigned', { ticket_id: ticketId, agent_id: agentId });
      await addNotification({
        title: 'Talep atandı',
        message: `Talep ${ticketId} temsilci ${agentId} üzerine atandı`,
        type: 'ticket',
      });
    } catch (error) {
      toast.error('Atama yapılırken hata oluştu');
      console.error('Error assigning ticket:', error);
    }
  };

  const markNotificationAsRead = async (notificationId: string) => {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('id', notificationId);

      if (error) throw error;
      fetchNotifications();
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const logAction = async (action: string, details?: any) => {
    try {
      await supabase
        .from('system_logs')
        .insert({
          action,
          details,
          ip_address: 'admin_panel',
          created_at: new Date().toISOString()
        });
    } catch (error) {
      console.error('Error logging action:', error);
    }
  };

  const fetchCustomerActivities = async (customerId: string) => {
    try {
      // Önce customer_id ile direkt eşleşen aktiviteleri al
      const { data: directMatches, error: directError } = await supabase
        .from('system_logs')
        .select('*')
        .or(`details->>'customer_id'.eq.${customerId}`)
        .order('created_at', { ascending: false })
        .limit(10);
      
      if (directError) throw directError;
      
      // Eğer yeterli veri yoksa, tüm aktiviteleri al ve filtrele
      if (!directMatches || directMatches.length === 0) {
        const { data: allActivities, error: allError } = await supabase
          .from('system_logs')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(20);
        
        if (allError) throw allError;
        
        // Müşteri ile ilgili aktiviteleri filtrele
        const filteredActivities = allActivities?.filter(activity => {
          const details = activity.details;
          if (!details) return false;
          
          // Farklı aktivite türlerinde customer_id'nin nasıl saklandığını kontrol et
          return details.customer_id === customerId || 
                 details.customer_id === customerId ||
                 (typeof details === 'object' && details.customer_id === customerId);
        }) || [];
        
        return filteredActivities.slice(0, 10);
      }
      
      return directMatches || [];
    } catch (error) {
      console.error('Error fetching customer activities:', error);
      return [];
    }
  };

  const createTicket = async (ticketData: Partial<Ticket>) => {
    try {
      let finalAgentId = ticketData.agent_id;
      
      // Eğer agent_id boşsa, otomatik atama yap
      if (ticketData.agent_id === '' || !ticketData.agent_id) {
        // En az yüklü temsilciyi bul
        const availableAgents = agents.filter(agent => agent.status !== 'offline');
        if (availableAgents.length > 0) {
          let selectedAgent = availableAgents[0];
          
          // Kategori bazlı öncelikli atama
          if (ticketData.category === 'technical') {
            // Teknik kategorisi için senior agent'ları tercih et
            const seniorAgents = availableAgents.filter(agent => 
              agent.role === 'senior_agent' || agent.role === 'team_lead'
            );
            if (seniorAgents.length > 0) {
              selectedAgent = seniorAgents[0];
            }
          } else if (ticketData.category === 'billing') {
            // Faturalama için deneyimli agent'ları tercih et
            const experiencedAgents = availableAgents.filter(agent => 
              agent.total_resolved > 50
            );
            if (experiencedAgents.length > 0) {
              selectedAgent = experiencedAgents[0];
            }
          }
          
          // Seçilen agent'ın aktif ticket sayısını kontrol et
          const selectedAgentActiveTickets = tickets.filter(t => 
            t.agent_id === selectedAgent.id && 
            (t.status === 'open' || t.status === 'in_progress')
          ).length;
          
          // Eğer seçilen agent çok yüklüyse, en az yüklü olanı bul
          if (selectedAgentActiveTickets > 10) {
            const agentWithLeastTickets = availableAgents.reduce((prev, current) => {
              const prevActiveTickets = tickets.filter(t => 
                t.agent_id === prev.id && 
                (t.status === 'open' || t.status === 'in_progress')
              ).length;
              const currentActiveTickets = tickets.filter(t => 
                t.agent_id === current.id && 
                (t.status === 'open' || t.status === 'in_progress')
              ).length;
              return currentActiveTickets < prevActiveTickets ? current : prev;
            });
            selectedAgent = agentWithLeastTickets;
          }
          
          finalAgentId = selectedAgent.id;
        }
      }

      const processedData = {
        ...ticketData,
        agent_id: finalAgentId
      };

      const { error } = await supabase
        .from('tickets')
        .insert(processedData);

      if (error) throw error;
      
      const successMessage = finalAgentId && finalAgentId !== ticketData.agent_id 
        ? `Talep isteği oluşturuldu ve ${agents.find(a => a.id === finalAgentId)?.name} temsilcisine atandı`
        : 'Talep isteği oluşturuldu';
      
      toast.success(successMessage);
      fetchTickets();
      await logAction('ticket_created', processedData);
      await addNotification({
        title: 'Talep İsteği Oluşturuldu',
        message: `${ticketData.title || 'Talep'} eklendi`,
        type: 'ticket',
      });
    } catch (error: any) {
      let errorMessage = 'Talep oluşturulurken hata oluştu';
      
      // Hata detaylarını kontrol et
      if (error?.message) {
        if (error.message.includes('foreign key')) {
          errorMessage = 'Seçilen müşteri veya temsilci bulunamadı';
        } else if (error.message.includes('not null')) {
          errorMessage = 'Zorunlu alanlar eksik';
        } else if (error.message.includes('unique')) {
          errorMessage = 'Bu talep zaten mevcut';
        }
      }
      
      toast.error(errorMessage);
      console.error('Error creating ticket:', error);
    }
  };

  const deleteTicket = async (ticketId: string) => {
    try {
      const { error } = await supabase
        .from('tickets')
        .delete()
        .eq('id', ticketId);

      if (error) throw error;
      
      toast.success('Talep başarıyla silindi');
      fetchTickets();
      await logAction('ticket_deleted', { ticket_id: ticketId });
      await addNotification({
        title: 'Talep silindi',
        message: `Talep ${ticketId} silindi`,
        type: 'ticket',
      });
    } catch (error) {
      toast.error('Talep silinirken hata oluştu');
      console.error('Error deleting ticket:', error);
    }
  };

  // Bağımlılık işlemleri
  const createDependency = async (dependencyData: {
    sourceTicketId: string;
    targetTicketId: string;
    type: 'blocks' | 'depends_on' | 'duplicate' | 'related';
  }) => {
    try {
      const { error } = await supabase
        .from('ticket_dependencies')
        .insert({
          source_ticket_id: dependencyData.sourceTicketId,
          target_ticket_id: dependencyData.targetTicketId,
          type: dependencyData.type,
          created_at: new Date().toISOString()
        });

      if (error) throw error;
      
      toast.success('Bağımlılık başarıyla oluşturuldu');
      await logAction('dependency_created', dependencyData);
    } catch (error) {
      toast.error('Bağımlılık oluşturulurken hata oluştu');
      console.error('Error creating dependency:', error);
    }
  };

  const deleteDependency = async (dependencyId: string) => {
    try {
      const { error } = await supabase
        .from('ticket_dependencies')
        .delete()
        .eq('id', dependencyId);

      if (error) throw error;
      
      toast.success('Bağımlılık kaldırıldı');
      await logAction('dependency_deleted', { dependency_id: dependencyId });
    } catch (error) {
      toast.error('Bağımlılık kaldırılırken hata oluştu');
      console.error('Error deleting dependency:', error);
    }
  };

  const updateAgentStatus = async (agentId: string, status: string) => {
    try {
      const { error } = await supabase
        .from('agents')
        .update({ status, updated_at: new Date().toISOString() })
        .eq('id', agentId);

      if (error) throw error;
      
      toast.success('Temsilci durumu güncellendi');
      fetchAgents();
      await addNotification({
        title: 'Temsilci durumu güncellendi',
        message: `Temsilci ${agentId} durumu ${status} olarak güncellendi`,
        type: 'info',
      });
    } catch (error) {
      toast.error('Durum güncellenirken hata oluştu');
      console.error('Error updating agent status:', error);
    }
  };

  // Bulk operations
  const bulkUpdateTickets = async (ticketIds: string[], updates: Partial<Ticket>) => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from('tickets')
        .update(updates)
        .in('id', ticketIds);

      if (error) throw error;
      
      // State'i anında güncelle
      setTickets(prevTickets => 
        prevTickets.map(ticket => 
          ticketIds.includes(ticket.id) 
            ? { ...ticket, ...updates, updated_at: new Date().toISOString() }
            : ticket
        )
      );
      
      toast.success(`${ticketIds.length} talep güncellendi`);
      setSelectedItems([]);
    } catch (error) {
      toast.error('Toplu güncelleme başarısız');
      console.error('Error bulk updating tickets:', error);
    } finally {
      setLoading(false);
    }
  };

  const exportData = async (type: 'tickets' | 'customers' | 'agents') => {
    try {
      let data;
      switch (type) {
        case 'tickets':
          data = tickets;
          break;
        case 'customers':
          data = customers;
          break;
        case 'agents':
          data = agents;
          break;
      }
      
      const csv = convertToCSV(data);
      downloadCSV(csv, `${type}_export.csv`);
      toast.success('Veri başarıyla dışa aktarıldı');
    } catch (error) {
      toast.error('Dışa aktarma başarısız');
    }
  };

  const convertToCSV = (data: any[]) => {
    if (!data.length) return '';
    
    const headers = Object.keys(data[0]).join(',');
    const rows = data.map(item => 
      Object.values(item).map(value => 
        typeof value === 'string' ? `"${value}"` : value
      ).join(',')
    );
    
    return [headers, ...rows].join('\n');
  };

  const downloadCSV = (csv: string, filename: string) => {
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  // Financial Management Functions
  const fetchSubscriptionPlans = async () => {
    try {
      const { data, error } = await supabase
        .from('subscription_plans')
        .select('*')
        .order('price', { ascending: true });
      
      if (error) throw error;
      setSubscriptionPlans(data || []);
    } catch (error) {
      console.error('Error fetching subscription plans:', error);
    }
  };

  const fetchSubscriptions = async () => {
    try {
      const { data, error } = await supabase
        .from('subscriptions')
        .select(`
          *,
          customers (name, email, company),
          subscription_plans (name, price, billing_cycle)
        `)
        .order('created_at', { ascending: false });
      
      if (error) {
        console.warn('Subscriptions table might not exist yet:', error);
        setSubscriptions([]);
        return;
      }
      setSubscriptions(data || []);
    } catch (error) {
      console.warn('Error fetching subscriptions:', error);
      setSubscriptions([]);
    }
  };

  const fetchPayments = async () => {
    try {
      const { data, error } = await supabase
        .from('payments')
        .select(`
          *,
          customers (name, email),
          subscriptions (id)
        `)
        .order('payment_date', { ascending: false });
      
      if (error) {
        console.warn('Payments table might not exist yet:', error);
        setPayments([]);
        return;
      }
      
      // Duplicate ödemeleri filtrele - hem ID hem de invoice_number bazında
      const uniquePayments = data ? data.filter((payment, index, self) => {
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
      }) : [];
      
      setPayments(uniquePayments);
    } catch (error) {
      console.warn('Error fetching payments:', error);
      setPayments([]);
    }
  };

  const fetchExpenseCategories = async () => {
    try {
      const { data, error } = await supabase
        .from('expense_categories')
        .select('*')
        .order('name');
      
      if (error) {
        console.warn('Expense categories table might not exist yet:', error);
        setExpenseCategories([]);
        return;
      }
      
      // Duplicate kategorileri filtrele
      const uniqueCategories = data ? data.filter((category, index, self) => 
        index === self.findIndex(c => c.id === category.id)
      ) : [];
      
      setExpenseCategories(uniqueCategories);
    } catch (error) {
      console.warn('Error fetching expense categories:', error);
      setExpenseCategories([]);
    }
  };

  const fetchExpenses = async () => {
    try {
      const { data, error } = await supabase
        .from('expenses')
        .select(`
          *,
          expense_categories (name, color)
        `)
        .order('expense_date', { ascending: false });
      
      if (error) {
        console.warn('Expenses table might not exist yet:', error);
        setExpenses([]);
        return;
      }
      
      // Veriyi dönüştür ve duplicate giderleri filtrele
      const transformedData = data ? data.map(expense => ({
        ...expense,
        description: expense.title, // title alanını description olarak kullan
        notes: expense.description // description alanını notes olarak kullan
      })) : [];
      
      const uniqueExpenses = transformedData.filter((expense, index, self) => 
        index === self.findIndex(e => e.id === expense.id)
      );
      
      setExpenses(uniqueExpenses);
    } catch (error) {
      console.warn('Error fetching expenses:', error);
      setExpenses([]);
    }
  };

  const fetchPromotions = async () => {
    try {
      const { data, error } = await supabase
        .from('promotions')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error('Promotion fetch error:', error);
        throw error;
      }
      
      // Duplicate promosyonları filtrele
      const uniquePromotions = data ? data.filter((promotion, index, self) => 
        index === self.findIndex(p => p.id === promotion.id)
      ) : [];
      
      setPromotions(uniquePromotions);
    } catch (error) {
      console.error('Error fetching promotions:', error);
      setPromotions([]);
      throw error; // Hatayı yukarı fırlat
    }
  };

  const fetchPromotionUsage = async () => {
    try {
      const { data, error } = await supabase
        .from('promotion_usage')
        .select(`
          *,
          promotions (name, description, discount_type, discount_value),
          customers (name, email, company),
          subscriptions (id),
          payments (id, amount, payment_date)
        `)
        .order('used_at', { ascending: false });
      
      if (error) {
        console.warn('Promotion usage table might not exist yet:', error);
        setPromotionUsage([]);
        return;
      }
      setPromotionUsage(data || []);
    } catch (error) {
      console.warn('Error fetching promotion usage:', error);
      setPromotionUsage([]);
      throw error; // Hatayı yukarı fırlat
    }
  };

  const fetchBudgets = async () => {
    try {
      const { data, error } = await supabase
        .from('budgets')
        .select(`
          *,
          expense_categories (name, color)
        `)
        .order('created_at', { ascending: false });
      
      if (error) {
        console.warn('Budgets table might not exist yet:', error);
        setBudgets([]);
        return;
      }
      
      // Duplicate bütçeleri filtrele
      const uniqueBudgets = data ? data.filter((budget, index, self) => 
        index === self.findIndex(b => b.id === budget.id)
      ) : [];
      
      setBudgets(uniqueBudgets);
    } catch (error) {
      console.warn('Error fetching budgets:', error);
      setBudgets([]);
    }
  };

  const fetchFinancialReports = async () => {
    try {
      const { data, error } = await supabase
        .from('financial_reports')
        .select('*')
        .order('generated_at', { ascending: false });
      
      if (error) throw error;
      setFinancialReports(data || []);
    } catch (error) {
      console.error('Error fetching financial reports:', error);
    }
  };

  // Financial CRUD Operations
  const createSubscription = async (subscriptionData: any) => {
    try {
      const { error } = await supabase
        .from('subscriptions')
        .insert(subscriptionData);

      if (error) throw error;
      
      toast.success('Abonelik oluşturuldu');
      fetchSubscriptions();
      await logAction('subscription_created', subscriptionData);
    } catch (error) {
      toast.error('Abonelik oluşturulurken hata oluştu');
      console.error('Error creating subscription:', error);
    }
  };

  const createPayment = async (paymentData: any) => {
    try {
      // Veri doğrulama ve temizleme
      const cleanData = {
        customer_id: paymentData.customer_id,
        subscription_id: paymentData.subscription_id || null,
        amount: Number(paymentData.amount) || 0,
        currency: paymentData.currency || 'TRY',
        payment_method: paymentData.payment_method || 'credit_card',
        status: paymentData.status || 'pending',
        commission_type: paymentData.commission_type || 'included',
        transaction_id: paymentData.transaction_id || null,
        payment_date: paymentData.payment_date ? new Date(paymentData.payment_date).toISOString() : null,
        due_date: paymentData.due_date ? new Date(paymentData.due_date).toISOString() : null,
        invoice_url: paymentData.invoice_url || null,
        notes: paymentData.notes || '',
        description: paymentData.description || ''
      };

      // Invoice number kontrolü - eğer manuel olarak girilmişse benzersiz olduğunu kontrol et
      if (paymentData.invoice_number) {
        const { data: existingPayment, error: checkError } = await supabase
          .from('payments')
          .select('id')
          .eq('invoice_number', paymentData.invoice_number)
          .single();

        if (existingPayment) {
          throw new Error('Bu fatura numarası zaten kullanılıyor. Lütfen farklı bir numara girin.');
        }
      }

      // Zorunlu alanları kontrol et
      if (!cleanData.customer_id) {
        throw new Error('Müşteri seçimi zorunludur');
      }

      if (!cleanData.amount || cleanData.amount <= 0) {
        throw new Error('Geçerli bir tutar giriniz');
      }

      if (!cleanData.payment_method) {
        throw new Error('Ödeme yöntemi seçimi zorunludur');
      }

      if (!cleanData.status) {
        throw new Error('Durum seçimi zorunludur');
      }

      const { error } = await supabase
        .from('payments')
        .insert(cleanData);

      if (error) {
        console.error('Supabase error:', error);
        throw error;
      }
      
      toast.success('Ödeme kaydedildi');
      fetchPayments();
      await logAction('payment_created', cleanData);
      await addNotification({
        title: 'Yeni ödeme alındı',
        message: `${cleanData.amount}${cleanData.currency === 'USD' ? '$' : cleanData.currency === 'EUR' ? '€' : '₺'} tutarında ödeme alındı`,
        type: 'payment',
      });
    } catch (error: any) {
      console.error('Error creating payment:', error);
      
      // Hata mesajını daha detaylı göster
      let errorMessage = 'Ödeme kaydedilirken hata oluştu';
      
      if (error.message) {
        errorMessage = error.message;
      } else if (error.details) {
        errorMessage = error.details;
      } else if (error.hint) {
        errorMessage = `${errorMessage}: ${error.hint}`;
      }
      
      toast.error(errorMessage);
    }
  };

  const updatePayment = async (paymentId: string, paymentData: any) => {
    try {
      // Veri doğrulama ve temizleme
      const cleanData = {
        customer_id: paymentData.customer_id,
        subscription_id: paymentData.subscription_id || null,
        amount: Number(paymentData.amount) || 0,
        currency: paymentData.currency || 'TRY',
        payment_method: paymentData.payment_method || 'credit_card',
        status: paymentData.status || 'pending',
        commission_type: paymentData.commission_type || 'included',
        transaction_id: paymentData.transaction_id || null,
        payment_date: paymentData.payment_date ? new Date(paymentData.payment_date).toISOString() : null,
        due_date: paymentData.due_date ? new Date(paymentData.due_date).toISOString() : null,
        invoice_url: paymentData.invoice_url || null,
        notes: paymentData.notes || ''
      };

      // Zorunlu alanları kontrol et
      if (!cleanData.customer_id) {
        throw new Error('Müşteri seçimi zorunludur');
      }

      if (!cleanData.amount || cleanData.amount <= 0) {
        throw new Error('Geçerli bir tutar giriniz');
      }

      if (!cleanData.payment_method) {
        throw new Error('Ödeme yöntemi seçimi zorunludur');
      }

      if (!cleanData.status) {
        throw new Error('Durum seçimi zorunludur');
      }

      const { error } = await supabase
        .from('payments')
        .update(cleanData)
        .eq('id', paymentId);

      if (error) {
        console.error('Supabase error:', error);
        throw error;
      }
      
      toast.success('Ödeme güncellendi');
      fetchPayments();
      await logAction('payment_updated', { payment_id: paymentId, ...cleanData });
      await addNotification({
        title: 'Ödeme güncellendi',
        message: `${cleanData.amount}${cleanData.currency === 'USD' ? '$' : cleanData.currency === 'EUR' ? '€' : '₺'} tutarında ödeme güncellendi`,
        type: 'payment',
      });
    } catch (error: any) {
      console.error('Error updating payment:', error);
      
      // Hata mesajını daha detaylı göster
      let errorMessage = 'Ödeme güncellenirken hata oluştu';
      
      if (error.message) {
        errorMessage = error.message;
      } else if (error.details) {
        errorMessage = error.details;
      } else if (error.hint) {
        errorMessage = `${errorMessage}: ${error.hint}`;
      }
      
      toast.error(errorMessage);
    }
  };

  const createExpense = async (expenseData: any) => {
    try {
      // Veri doğrulama ve temizleme
      const cleanData = {
        title: expenseData.description || 'İsimsiz Gider',
        description: expenseData.notes || '',
        category_id: expenseData.category_id || null,
        amount: Number(expenseData.amount) || 0,
        currency: 'TRY',
        expense_date: expenseData.expense_date || new Date().toISOString(),
        vendor: expenseData.vendor || '',
        invoice_number: expenseData.invoice_number || '',
        receipt_url: expenseData.receipt_url || '',
        is_recurring: expenseData.is_recurring || false,
        recurring_interval: expenseData.recurring_interval || null,
        next_due_date: expenseData.next_due_date || null,
        status: expenseData.status || 'pending',
        approved_by: expenseData.approved_by || null
      };

      const { error } = await supabase
        .from('expenses')
        .insert(cleanData);

      if (error) throw error;
      
      toast.success('Gider kaydedildi');
      fetchExpenses();
      await logAction('expense_created', cleanData);
    } catch (error) {
      toast.error('Gider kaydedilirken hata oluştu');
      console.error('Error creating expense:', error);
    }
  };

  const updateExpense = async (expenseId: string, expenseData: any) => {
    try {
      // Veri doğrulama ve temizleme
      const cleanData = {
        title: expenseData.description || 'İsimsiz Gider',
        description: expenseData.notes || '',
        category_id: expenseData.category_id || null,
        amount: Number(expenseData.amount) || 0,
        currency: 'TRY',
        expense_date: expenseData.expense_date || new Date().toISOString(),
        vendor: expenseData.vendor || '',
        invoice_number: expenseData.invoice_number || '',
        receipt_url: expenseData.receipt_url || '',
        is_recurring: expenseData.is_recurring || false,
        recurring_interval: expenseData.recurring_interval || null,
        next_due_date: expenseData.next_due_date || null,
        status: expenseData.status || 'pending',
        approved_by: expenseData.approved_by || null
      };

      const { error } = await supabase
        .from('expenses')
        .update(cleanData)
        .eq('id', expenseId);

      if (error) throw error;
      
      toast.success('Gider başarıyla güncellendi');
      fetchExpenses();
      await logAction('expense_updated', { expense_id: expenseId, ...cleanData });
    } catch (error) {
      toast.error('Gider güncellenirken hata oluştu');
      console.error('Error updating expense:', error);
    }
  };

  const deleteExpense = async (expenseId: string) => {
    try {
      const { error } = await supabase
        .from('expenses')
        .delete()
        .eq('id', expenseId);

      if (error) throw error;
      
      toast.success('Gider başarıyla silindi');
      fetchExpenses();
      await logAction('expense_deleted', { expense_id: expenseId });
    } catch (error) {
      toast.error('Gider silinirken hata oluştu');
      console.error('Error deleting expense:', error);
    }
  };

  const getExpenseById = async (expenseId: string) => {
    try {
      const { data, error } = await supabase
        .from('expenses')
        .select(`
          *,
          expense_categories (name, color)
        `)
        .eq('id', expenseId)
        .single();

      if (error) throw error;
      
      // Veriyi dönüştür
      const transformedData = {
        ...data,
        description: data.title, // title alanını description olarak kullan
        notes: data.description // description alanını notes olarak kullan
      };
      
      return transformedData;
    } catch (error) {
      console.error('Error fetching expense:', error);
      return null;
    }
  };

  const createPromotion = async (promotionData: any) => {
    try {
      // Veri doğrulama ve temizleme
      const cleanData = {
        name: promotionData.name || 'İsimsiz Promosyon',
        description: promotionData.description || '',
        discount_type: promotionData.discount_type || 'percentage',
        discount_value: Number(promotionData.discount_value) || 0,
        start_date: promotionData.start_date || null,
        end_date: promotionData.end_date || null,
        usage_limit: promotionData.usage_limit ? Number(promotionData.usage_limit) : null,
        is_active: promotionData.is_active || false
      };

      const { error } = await supabase
        .from('promotions')
        .insert(cleanData);

      if (error) throw error;
      
      toast.success('Promosyon oluşturuldu');
      fetchPromotions();
      await logAction('promotion_created', cleanData);
    } catch (error) {
      toast.error('Promosyon oluşturulurken hata oluştu');
      console.error('Error creating promotion:', error);
    }
  };

  const updatePromotion = async (promotionId: string, promotionData: any) => {
    try {
      // Veri doğrulama ve temizleme
      const cleanData: any = {};
      
      // Sadece gönderilen alanları güncelle
      if (promotionData.name !== undefined) cleanData.name = promotionData.name || 'İsimsiz Promosyon';
      if (promotionData.description !== undefined) cleanData.description = promotionData.description || '';
      if (promotionData.discount_type !== undefined) cleanData.discount_type = promotionData.discount_type || 'percentage';
      if (promotionData.discount_value !== undefined) cleanData.discount_value = Number(promotionData.discount_value) || 0;
      if (promotionData.start_date !== undefined) cleanData.start_date = promotionData.start_date || null;
      if (promotionData.end_date !== undefined) cleanData.end_date = promotionData.end_date || null;
      if (promotionData.usage_limit !== undefined) cleanData.usage_limit = promotionData.usage_limit ? Number(promotionData.usage_limit) : null;
      if (promotionData.is_active !== undefined) cleanData.is_active = Boolean(promotionData.is_active);

      const { error } = await supabase
        .from('promotions')
        .update(cleanData)
        .eq('id', promotionId);

      if (error) throw error;
      
      // Sadece manuel güncellemelerde başarı mesajı göster
      const isManualUpdate = promotionData.name !== undefined || 
                            promotionData.description !== undefined || 
                            promotionData.discount_value !== undefined ||
                            promotionData.discount_type !== undefined ||
                            promotionData.start_date !== undefined ||
                            promotionData.end_date !== undefined ||
                            promotionData.usage_limit !== undefined;
      
      if (isManualUpdate) {
        toast.success('Promosyon güncellendi');
      }
      
      fetchPromotions();
      await logAction('promotion_updated', { promotion_id: promotionId, ...cleanData });
    } catch (error) {
      // Sadece manuel güncellemelerde hata mesajı göster
      const isManualUpdate = promotionData.name !== undefined || 
                            promotionData.description !== undefined || 
                            promotionData.discount_value !== undefined ||
                            promotionData.discount_type !== undefined ||
                            promotionData.start_date !== undefined ||
                            promotionData.end_date !== undefined ||
                            promotionData.usage_limit !== undefined;
      
      if (isManualUpdate) {
        toast.error('Promosyon güncellenirken hata oluştu');
      }
      console.error('Error updating promotion:', error);
      throw error; // Hatayı yukarı fırlat
    }
  };

  const deletePromotion = async (promotionId: string) => {
    try {
      const { error } = await supabase
        .from('promotions')
        .delete()
        .eq('id', promotionId);

      if (error) throw error;
      
      toast.success('Promosyon başarıyla silindi');
      fetchPromotions();
      await logAction('promotion_deleted', { promotion_id: promotionId });
    } catch (error) {
      toast.error('Promosyon silinirken hata oluştu');
      console.error('Error deleting promotion:', error);
    }
  };

  const createBudget = async (budgetData: any) => {
    try {
      const { error } = await supabase
        .from('budgets')
        .insert(budgetData);

      if (error) throw error;
      
      toast.success('Bütçe oluşturuldu');
      fetchBudgets();
      await logAction('budget_created', budgetData);
    } catch (error) {
      toast.error('Bütçe oluşturulurken hata oluştu');
      console.error('Error creating budget:', error);
    }
  };

  const deleteBudget = async (budgetId: string) => {
    try {
      const { error } = await supabase
        .from('budgets')
        .delete()
        .eq('id', budgetId);

      if (error) throw error;
      
      toast.success('Bütçe başarıyla silindi');
      fetchBudgets();
      await logAction('budget_deleted', { budget_id: budgetId });
    } catch (error) {
      toast.error('Bütçe silinirken hata oluştu');
      console.error('Error deleting budget:', error);
    }
  };

  const updateBudget = async (budgetId: string, budgetData: any) => {
    try {
      const { error } = await supabase
        .from('budgets')
        .update(budgetData)
        .eq('id', budgetId);

      if (error) throw error;
      
      toast.success('Bütçe başarıyla güncellendi');
      fetchBudgets();
      await logAction('budget_updated', { budget_id: budgetId, ...budgetData });
    } catch (error) {
      toast.error('Bütçe güncellenirken hata oluştu');
      console.error('Error updating budget:', error);
    }
  };

  const createCustomer = async (customerData: any) => {
    try {
      const { data, error } = await supabase
        .from('customers')
        .insert([customerData])
        .select()
        .single();
      
      if (error) throw error;
      
      toast.success('Müşteri başarıyla oluşturuldu');
      logAction('customer_created', { customer_id: data.id });
      await fetchCustomers();
      return data;
    } catch (error) {
      toast.error('Müşteri oluşturulurken hata oluştu');
      console.error('Error creating customer:', error);
      throw error;
    }
  };

  const updateCustomer = async (customerId: string, customerData: any) => {
    try {
      const { data, error } = await supabase
        .from('customers')
        .update(customerData)
        .eq('id', customerId)
        .select()
        .single();
      
      if (error) throw error;
      
      toast.success('Müşteri başarıyla güncellendi');
      logAction('customer_updated', { customer_id: customerId });
      await fetchCustomers();
      return data;
    } catch (error) {
      toast.error('Müşteri güncellenirken hata oluştu');
      console.error('Error updating customer:', error);
      throw error;
    }
  };

  // Financial Analytics
  const getFinancialMetrics = () => {
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    
    const monthlyPayments = payments.filter(p => {
      const paymentDate = new Date(p.payment_date);
      return paymentDate.getMonth() === currentMonth && paymentDate.getFullYear() === currentYear;
    });
    
    const monthlyExpenses = expenses.filter(e => {
      const expenseDate = new Date(e.expense_date);
      return expenseDate.getMonth() === currentMonth && expenseDate.getFullYear() === currentYear;
    });
    
    const totalRevenue = monthlyPayments
      .filter(p => p.status === 'completed' || p.status === 'paid')
      .reduce((sum, p) => sum + Number(p.amount), 0);
    const totalExpenses = monthlyExpenses.reduce((sum, e) => sum + Number(e.amount), 0);
    const netProfit = totalRevenue - totalExpenses;
    const mrr = subscriptions
      .filter(s => s.status === 'active')
      .reduce((sum, s) => sum + Number(s.subscription_plans?.price || 0), 0);
    
    return {
      totalRevenue,
      totalExpenses,
      netProfit,
      mrr,
      activeSubscriptions: subscriptions.filter(s => s.status === 'active').length,
      pendingPayments: payments.filter(p => p.status === 'pending').length,
      overduePayments: payments.filter(p => {
        const dueDate = new Date(p.due_date);
        return dueDate < new Date() && p.status === 'pending';
      }).length
    };
  };

  // Geliştirilmiş arama fonksiyonu
  const searchTickets = (searchTerm: string) => {
    if (!searchTerm.trim()) return tickets;
    
    const searchLower = searchTerm.toLowerCase();
    
    return tickets.filter(ticket => {
      const customer = customers.find(c => c.id === ticket.customer_id);
      const assignedAgent = agents.find(a => a.id === ticket.agent_id);
      
      // Talep ID'si arama
      const ticketIdMatch = ticket.id.toLowerCase().includes(searchLower);
      
      // Talep başlığı arama
      const titleMatch = ticket.title.toLowerCase().includes(searchLower);
      
      // Talep açıklaması arama
      const descriptionMatch = ticket.description?.toLowerCase().includes(searchLower) || false;
      
      // Müşteri adı arama
      const customerNameMatch = customer?.name.toLowerCase().includes(searchLower) || false;
      
      // Müşteri e-posta arama
      const customerEmailMatch = customer?.email.toLowerCase().includes(searchLower) || false;
      
      // Müşteri şirket arama
      const customerCompanyMatch = customer?.company?.toLowerCase().includes(searchLower) || false;
      
      // Temsilci adı arama
      const agentNameMatch = assignedAgent?.name.toLowerCase().includes(searchLower) || false;
      
      // Talep numarası arama (ID'nin ilk 8 karakteri)
      const ticketNumberMatch = ticket.id.slice(0, 8).toLowerCase().includes(searchLower);
      
      // Etiketlerde arama
      const tagsMatch = ticket.tags?.some(tag => 
        tag.toLowerCase().includes(searchLower)
      ) || false;
      
      // Kategori arama
      const categoryMatch = ticket.category.toLowerCase().includes(searchLower);
      
      // Öncelik arama
      const priorityMatch = ticket.priority.toLowerCase().includes(searchLower);
      
      // Durum arama
      const statusMatch = ticket.status.toLowerCase().includes(searchLower);
      
      // Tüm arama kriterlerini kontrol et
      return (
        ticketIdMatch ||
        titleMatch ||
        descriptionMatch ||
        customerNameMatch ||
        customerEmailMatch ||
        customerCompanyMatch ||
        agentNameMatch ||
        ticketNumberMatch ||
        tagsMatch ||
        categoryMatch ||
        priorityMatch ||
        statusMatch
      );
    });
  };

  // Ana veri yükleme
  useEffect(() => {
    fetchCustomers();
    fetchAgents();
    fetchTickets();
    fetchNotifications();
    
    // Finansal verileri de yükle (hata durumunda uygulamayı durdurmamak için)
    fetchSubscriptionPlans();
    fetchSubscriptions();
    fetchPayments();
    fetchExpenseCategories();
    fetchExpenses();
    fetchPromotions();
    fetchPromotionUsage();
    fetchBudgets();
    fetchFinancialReports();
  }, []);

  // Real-time subscriptions
  useEffect(() => {
    const ticketsSubscription = supabase
      .channel('tickets')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tickets' }, () => {
        fetchTickets();
      })
      .subscribe();

    const notificationsSubscription = supabase
      .channel('notifications')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'notifications' }, () => {
        fetchNotifications();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(ticketsSubscription);
      supabase.removeChannel(notificationsSubscription);
    };
  }, []);

  // Periodic SLA watcher (client-side interval)
  useEffect(() => {
    const id = setInterval(() => {
      checkSlaAndNotify();
    }, 60 * 1000);
    return () => clearInterval(id);
  }, [tickets, notifications]);

  // Zaman çizelgesi fonksiyonları
  const fetchTicketTimeline = async (ticketId: string) => {
    try {
      const { data, error } = await supabase
        .from('ticket_timeline')
        .select('*')
        .eq('ticket_id', ticketId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Timeline yükleme hatası:', error);
      throw error;
    }
  };

  // İş akışı adımları fonksiyonları
  const fetchTicketWorkflowSteps = async (ticketId: string) => {
    try {
      const { data, error } = await supabase
        .from('ticket_workflow_steps')
        .select(`
          *,
          assigned_user:assigned_user_id(name)
        `)
        .eq('ticket_id', ticketId)
        .order('step_number', { ascending: true });

      if (error) throw error;
      
      // Atanan kullanıcı adını ekle
      return data.map((step: any) => ({
        ...step,
        assigned_user_name: step.assigned_user?.name || null
      }));
    } catch (error) {
      console.error('İş akışı adımları yükleme hatası:', error);
      return [];
    }
  };

  const addTimelineEntry = async (ticketId: string, entry: {
    action_type: string;
    action_description: string;
    previous_value?: string;
    new_value?: string;
    user_id?: string;
    user_type: 'customer' | 'agent' | 'system';
    metadata?: any;
  }) => {
    try {
      const { data, error } = await supabase
        .from('ticket_timeline')
        .insert({
          ticket_id: ticketId,
          ...entry
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Timeline entry ekleme hatası:', error);
      throw error;
    }
  };

  // Auto Reporting Functions
  const calculateRealtimeMetrics = async () => {
    const { data, error } = await supabase.rpc('calculate_realtime_metrics');
    if (error) throw error;
    return data;
  };

  const generateAutoReport = async (reportId: string) => {
    const { data, error } = await supabase.rpc('generate_auto_report', {
      p_report_id: reportId
    });
    if (error) throw error;
    return data;
  };

  const checkSmartAlerts = async () => {
    const { data, error } = await supabase.rpc('check_smart_alerts');
    if (error) throw error;
    return data;
  };

  const getWidgetData = async (widgetType: string, config: any) => {
    const { data, error } = await supabase.rpc('get_widget_data', {
      p_widget_type: widgetType,
      p_config: config
    });
    if (error) throw error;
    return data;
  };

  const fetchAutoReports = async () => {
    const { data, error } = await supabase
      .from('auto_reports')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data;
  };

  const fetchReportHistory = async () => {
    const { data, error } = await supabase
      .from('report_history')
      .select(`
        *,
        auto_reports(report_name, report_type)
      `)
      .order('generated_at', { ascending: false })
      .limit(50);
    if (error) throw error;
    return data;
  };

  const fetchSmartAlerts = async () => {
    const { data, error } = await supabase
      .from('smart_alerts')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data;
  };

  const fetchAlertHistory = async () => {
    const { data, error } = await supabase
      .from('alert_history')
      .select(`
        *,
        smart_alerts(*)
      `)
      .order('triggered_at', { ascending: false })
      .limit(50);
    if (error) throw error;
    return data;
  };

  const fetchDashboardWidgets = async (userId: string) => {
    const { data, error } = await supabase
      .from('dashboard_widgets')
      .select('*')
      .eq('user_id', userId)
      .eq('is_active', true)
      .order('created_at', { ascending: true });
    if (error) throw error;
    return data;
  };

  // Smart Form Assistant functions
  const getSmartSuggestions = async (fieldType: string, searchTerm: string = '') => {
    const { data, error } = await supabase.rpc('get_smart_suggestions', {
      p_field_type: fieldType,
      p_search_term: searchTerm
    });
    if (error) throw error;
    return data;
  };

  const saveFormHistory = async (userId: string | null, formType: string, fieldName: string, fieldValue: string) => {
    const { error } = await supabase.rpc('save_form_history', {
      p_user_id: userId,
      p_form_type: formType,
      p_field_name: fieldName,
      p_field_value: fieldValue
    });
    if (error) throw error;
  };

  const autoFillForm = async (formType: string, triggerField: string, triggerValue: string) => {
    const { data, error } = await supabase.rpc('auto_fill_form', {
      p_form_type: formType,
      p_trigger_field: triggerField,
      p_trigger_value: triggerValue
    });
    if (error) throw error;
    return data;
  };

  const fetchFormTemplates = async () => {
    const { data, error } = await supabase
      .from('form_templates')
      .select('*')
      .eq('is_active', true)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data;
  };

  const fetchFormHistory = async () => {
    const { data, error } = await supabase
      .from('form_history')
      .select('*')
      .order('last_used', { ascending: false });
    if (error) throw error;
    return data;
  };

  // Smart Onboarding functions
  const getUserTrainingProgress = async (userId: string | null) => {
    const { data, error } = await supabase.rpc('get_user_training_progress', {
      p_user_id: userId
    });
    if (error) throw error;
    return data;
  };

  const getRecommendedModules = async (userId: string | null, userRole: string = 'basic') => {
    const { data, error } = await supabase.rpc('get_recommended_modules', {
      p_user_id: userId,
      p_user_role: userRole
    });
    if (error) throw error;
    return data;
  };

  const getSmartTip = async (userId: string | null, context: string) => {
    const { data, error } = await supabase.rpc('get_smart_tip', {
      p_user_id: userId,
      p_context: context
    });
    if (error) throw error;
    return data;
  };

  const updateTrainingProgress = async (
    userId: string | null,
    moduleId: string,
    progressPercentage: number,
    currentStep: number,
    completedSteps: any[]
  ) => {
    const { error } = await supabase.rpc('update_training_progress', {
      p_user_id: userId,
      p_module_id: moduleId,
      p_progress_percentage: progressPercentage,
      p_current_step: currentStep,
      p_completed_steps: completedSteps
    });
    if (error) throw error;
  };

  const checkAndAwardBadges = async (userId: string | null) => {
    const { data, error } = await supabase.rpc('check_and_award_badges', {
      p_user_id: userId
    });
    if (error) throw error;
    return data;
  };

  const fetchTrainingModules = async () => {
    const { data, error } = await supabase
      .from('training_modules')
      .select('*')
      .eq('is_active', true)
      .order('difficulty_level', { ascending: true });
    if (error) throw error;
    return data;
  };

  const fetchTrainingBadges = async () => {
    const { data, error } = await supabase
      .from('training_badges')
      .select('*')
      .eq('is_active', true)
      .order('points', { ascending: false });
    if (error) throw error;
    return data;
  };

  const fetchUserBadges = async (userId: string | null) => {
    const { data, error } = await supabase
      .from('user_badges')
      .select(`
        badge_id,
        training_badges (
          id,
          name,
          description,
          icon,
          category,
          points
        )
      `)
      .eq('user_id', userId);
    if (error) throw error;
    return data;
  };

  const fetchSmartTips = async () => {
    const { data, error } = await supabase
      .from('smart_tips')
      .select('*')
      .eq('is_active', true)
      .order('priority', { ascending: false });
    if (error) throw error;
    return data;
  };

  // Kullanıcı tercihleri fonksiyonları
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    // Mevcut kullanıcıyı al
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
    };

    getUser();

    // Auth state değişikliklerini dinle
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setUser(session?.user ?? null);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  // Kullanıcı tercihlerini al
  const getUserPreferences = async () => {
    if (!user) return null;

    const { data, error } = await supabase
      .from('user_preferences')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error('Kullanıcı tercihleri alınamadı:', error);
      return null;
    }

    return data;
  };

  // Kullanıcı tercihlerini oluştur veya güncelle
  const upsertUserPreferences = async (preferences: any) => {
    if (!user) return null;

    const { data, error } = await supabase
      .from('user_preferences')
      .upsert({
        user_id: user.id,
        ...preferences
      })
      .select()
      .single();

    if (error) {
      console.error('Kullanıcı tercihleri kaydedilemedi:', error);
      return null;
    }

    return data;
  };

  // UI/UX ayarlarını güncelle
  const updateUIUXSettings = async (settings: any) => {
    if (!user) return null;

    const { data, error } = await supabase
      .from('user_preferences')
      .upsert({
        user_id: user.id,
        uiux_settings: settings
      })
      .select()
      .single();

    if (error) {
      console.error('UI/UX ayarları güncellenemedi:', error);
      return null;
    }

    return data;
  };

  // Bildirim ayarlarını güncelle
  const updateNotificationSettings = async (settings: any) => {
    if (!user) return null;

    const { data, error } = await supabase
      .from('user_preferences')
      .upsert({
        user_id: user.id,
        notification_settings: settings
      })
      .select()
      .single();

    if (error) {
      console.error('Bildirim ayarları güncellenemedi:', error);
      return null;
    }

    return data;
  };

  // Tema ayarını güncelle
  const updateTheme = async (theme: string) => {
    if (!user) return null;

    const { data, error } = await supabase
      .from('user_preferences')
      .upsert({
        user_id: user.id,
        theme: theme
      })
      .select()
      .single();

    if (error) {
      console.error('Tema ayarı güncellenemedi:', error);
      return null;
    }

    return data;
  };

  // Bildirim geçmişini güncelle
  const updateNotificationHistory = async (shownNotifications: string[], hasShownWelcome: boolean) => {
    if (!user) return null;

    const { data, error } = await supabase
      .from('user_preferences')
      .upsert({
        user_id: user.id,
        shown_notifications: shownNotifications,
        has_shown_welcome_notifications: hasShownWelcome
      })
      .select()
      .single();

    if (error) {
      console.error('Bildirim geçmişi güncellenemedi:', error);
      return null;
    }

    return data;
  };

  // LocalStorage'dan Supabase'e veri taşıma
  const migrateFromLocalStorage = async () => {
    if (!user) return null;

    try {
      // LocalStorage'dan tüm verileri al
      const uiuxSettings = localStorage.getItem('uiuxSettings');
      const notificationSettings = localStorage.getItem('notificationSettings');
      const theme = localStorage.getItem('theme');
      const shownNotifications = localStorage.getItem('shownNotifications');
      const hasShownWelcome = localStorage.getItem('hasShownWelcomeNotifications');
      const userProfile = localStorage.getItem('userProfile');
      const appSettings = localStorage.getItem('appSettings');
      
      // Müşteri bildirim tercihlerini al
      const customerNotificationPrefs: Record<string, string | null> = {};
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('notification_prefs_')) {
          const customerId = key.replace('notification_prefs_', '');
          customerNotificationPrefs[customerId] = localStorage.getItem(key);
        }
      }

      // Supabase'e taşı
      const preferences = {
        user_id: user.id,
        uiux_settings: uiuxSettings ? JSON.parse(uiuxSettings) : null,
        notification_settings: notificationSettings ? JSON.parse(notificationSettings) : null,
        theme: theme || 'auto',
        shown_notifications: shownNotifications ? JSON.parse(shownNotifications) : [],
        has_shown_welcome_notifications: hasShownWelcome === 'true',
        user_preferences: {
          userProfile: userProfile ? JSON.parse(userProfile) : null,
          appSettings: appSettings ? JSON.parse(appSettings) : null,
          customerNotificationPrefs: customerNotificationPrefs
        }
      };

      const { data, error } = await supabase
        .from('user_preferences')
        .upsert(preferences)
        .select()
        .single();

      if (error) {
        console.error('Veri taşıma hatası:', error);
        return null;
      }

      // Başarılı taşıma sonrası localStorage'ı temizle
      localStorage.removeItem('uiuxSettings');
      localStorage.removeItem('notificationSettings');
      localStorage.removeItem('theme');
      localStorage.removeItem('shownNotifications');
      localStorage.removeItem('hasShownWelcomeNotifications');
      localStorage.removeItem('userProfile');
      localStorage.removeItem('appSettings');
      
      // Müşteri bildirim tercihlerini temizle
      Object.keys(customerNotificationPrefs).forEach(customerId => {
        localStorage.removeItem(`notification_prefs_${customerId}`);
      });
      
      console.log('✅ Tüm LocalStorage verileri Supabase\'e başarıyla taşındı');
      return data;

    } catch (error) {
      console.error('Veri taşıma sırasında hata:', error);
      return null;
    }
  };

  return {
    loading,
    searchTerm,
    setSearchTerm,
    currentPage,
    setCurrentPage,
    totalPages,
    selectedItems,
    setSelectedItems,
    customers,
    agents,
    tickets,
    paginatedTickets,
    notifications,
    // Financial Management
    subscriptionPlans,
    subscriptions,
    payments,
    expenseCategories,
    expenses,
    promotions,
    promotionUsage,
    budgets,
    financialReports,
    fetchCustomers,
    fetchAgents,
    fetchTickets,
    fetchNotifications,
    fetchSubscriptionPlans,
    fetchSubscriptions,
    fetchPayments,
    fetchExpenseCategories,
    fetchExpenses,
    fetchPromotions,
    fetchPromotionUsage,
    fetchBudgets,
    fetchFinancialReports,
    createSubscription,
    createPayment,
    updatePayment,
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
    getFinancialMetrics,
    addNotification,
    updateTicketStatus,
    assignTicket,
    markNotificationAsRead,
    logAction,
    fetchCustomerActivities,
    createTicket,
    deleteTicket,
    createDependency,
    deleteDependency,
    updateAgentStatus,
    bulkUpdateTickets,
    exportData,
    searchTickets,
    updateTicketPriority,
    updateTicketCategory,
    updateTicketTitle,
    updateTicketDescription,
    escalateTicket,
    mergeTickets,
    createFollowUpTicket,
    // Timeline functions
    fetchTicketTimeline,
    addTimelineEntry,
    // Workflow functions
    fetchTicketWorkflowSteps,
    // Smart Priority functions
    calculateSmartPriority,
    calculateBulkPriority,
    fetchSLARecords,
    fetchPriorityCalculations,
    // Auto Reporting functions
    calculateRealtimeMetrics,
    generateAutoReport,
    checkSmartAlerts,
    getWidgetData,
    fetchAutoReports,
    fetchReportHistory,
    fetchSmartAlerts,
    fetchAlertHistory,
    fetchDashboardWidgets,
    // Smart Form Assistant functions
    getSmartSuggestions,
    saveFormHistory,
    autoFillForm,
    fetchFormTemplates,
    fetchFormHistory,
    // Smart Onboarding functions
    getUserTrainingProgress,
    getRecommendedModules,
    getSmartTip,
    updateTrainingProgress,
    checkAndAwardBadges,
    fetchTrainingModules,
    fetchTrainingBadges,
    fetchUserBadges,
    fetchSmartTips,
    // Kullanıcı tercihleri fonksiyonları
    user,
    getUserPreferences,
    upsertUserPreferences,
    updateUIUXSettings,
    updateNotificationSettings,
    updateTheme,
    updateNotificationHistory,
    migrateFromLocalStorage,
    supabase
  };
};