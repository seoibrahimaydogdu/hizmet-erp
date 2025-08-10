import { useState, useEffect } from 'react';
import { supabase, Customer, Agent, Ticket, Notification, SystemLog, Template, Automation } from '../lib/supabase';
import { toast } from 'react-hot-toast';

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
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [systemLogs, setSystemLogs] = useState<SystemLog[]>([]);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [automations, setAutomations] = useState<Automation[]>([]);

  // Filtered and paginated data
  const filteredTickets = tickets.filter(ticket => 
    ticket.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    ticket.customers?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    ticket.status.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const paginatedTickets = filteredTickets.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const totalPages = Math.ceil(filteredTickets.length / itemsPerPage);

  // Fetch functions
  const fetchCustomers = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('customers')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      setCustomers(data || []);
    } catch (error) {
      toast.error('Müşteriler yüklenirken hata oluştu');
      console.error('Error fetching customers:', error);
    } finally {
      setLoading(false);
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
      setAgents(data || []);
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
      setTickets(data || []);
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

  const fetchSystemLogs = async () => {
    try {
      const { data, error } = await supabase
        .from('system_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);
      
      if (error) throw error;
      setSystemLogs(data || []);
    } catch (error) {
      console.error('Error fetching system logs:', error);
    }
  };

  const fetchTemplates = async () => {
    try {
      const { data, error } = await supabase
        .from('templates')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      setTemplates(data || []);
    } catch (error) {
      toast.error('Şablonlar yüklenirken hata oluştu');
      console.error('Error fetching templates:', error);
    }
  };

  const fetchAutomations = async () => {
    try {
      const { data, error } = await supabase
        .from('automations')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      setAutomations(data || []);
    } catch (error) {
      toast.error('Otomasyonlar yüklenirken hata oluştu');
      console.error('Error fetching automations:', error);
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
      
      toast.success('Talep durumu güncellendi');
      fetchTickets();
      
      // Log the action
      await logAction('ticket_status_updated', { ticket_id: ticketId, new_status: status });
    } catch (error) {
      toast.error('Durum güncellenirken hata oluştu');
      console.error('Error updating ticket status:', error);
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
      
      toast.success('Talep atandı');
      fetchTickets();
      
      // Log the action
      await logAction('ticket_assigned', { ticket_id: ticketId, agent_id: agentId });
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

  const createTicket = async (ticketData: Partial<Ticket>) => {
    try {
      const { error } = await supabase
        .from('tickets')
        .insert(ticketData);

      if (error) throw error;
      
      toast.success('Yeni talep oluşturuldu');
      fetchTickets();
      await logAction('ticket_created', ticketData);
    } catch (error) {
      toast.error('Talep oluşturulurken hata oluştu');
      console.error('Error creating ticket:', error);
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
      
      toast.success(`${ticketIds.length} talep güncellendi`);
      fetchTickets();
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
    filteredTickets,
    paginatedTickets,
    notifications,
    systemLogs,
    templates,
    automations,
    fetchCustomers,
    fetchAgents,
    fetchTickets,
    fetchNotifications,
    fetchSystemLogs,
    fetchTemplates,
    fetchAutomations,
    updateTicketStatus,
    assignTicket,
    markNotificationAsRead,
    logAction,
    createTicket,
    updateAgentStatus,
    bulkUpdateTickets,
    exportData
  };
};