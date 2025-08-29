import React, { useState, useEffect } from 'react';
import { 
  Clock, 
  AlertTriangle, 
  CheckCircle, 
  XCircle, 
  Bell,
  TrendingUp,
  TrendingDown,
  Eye,
  Settings,
  RefreshCw,
  Timer,
  Zap,
  Shield,
  User,
  MessageSquare
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { supabase } from '../lib/supabase';
import { format, formatDistanceToNow } from 'date-fns';
import { tr } from 'date-fns/locale';

interface SLAMonitorProps {
  ticketId?: string;
  showAll?: boolean;
  className?: string;
}

interface SLARecord {
  id: string;
  ticket_id: string;
  sla_type: string;
  priority_level: string;
  deadline: string;
  escalation_level: number;
  last_escalation: string | null;
  escalation_history: any[];
  is_active: boolean;
  created_at: string;
  ticket?: {
    title: string;
    status: string;
    customer_id: string;
    agent_id: string | null;
  };
  customer?: {
    name: string;
    email: string;
  };
  agent?: {
    name: string;
    status: string;
  };
}

const SLAMonitor: React.FC<SLAMonitorProps> = ({
  ticketId,
  showAll = false,
  className = ''
}) => {
  const [slaRecords, setSlaRecords] = useState<SLARecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'active' | 'overdue' | 'at_risk'>('all');
  const [showSettings, setShowSettings] = useState(false);

  // SLA kayıtlarını yükle
  const loadSLARecords = async () => {
    setLoading(true);
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

      if (!showAll) {
        query = query.eq('is_active', true);
      }

      const { data, error } = await query;

      if (error) throw error;

      setSlaRecords(data || []);
    } catch (error) {
      console.error('SLA kayıtları yüklenirken hata:', error);
      toast.error('SLA bilgileri yüklenirken hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  // Otomatik eskalasyon
  const performEscalation = async (slaRecord: SLARecord) => {
    try {
      const now = new Date();
      const deadline = new Date(slaRecord.deadline);
      const timeDiff = deadline.getTime() - now.getTime();
      const hoursRemaining = timeDiff / (1000 * 60 * 60);

      let newEscalationLevel = slaRecord.escalation_level;
      let escalationAction = '';

      // Eskalasyon kuralları
      if (hoursRemaining < 0) {
        // SLA ihlal edildi
        if (slaRecord.escalation_level < 4) {
          newEscalationLevel = 4;
          escalationAction = 'SLA ihlal edildi - Acil durum protokolü';
        }
      } else if (hoursRemaining < 1) {
        // 1 saat kaldı
        if (slaRecord.escalation_level < 3) {
          newEscalationLevel = 3;
          escalationAction = '1 saat kaldı - Yönetici müdahalesi';
        }
      } else if (hoursRemaining < 2) {
        // 2 saat kaldı
        if (slaRecord.escalation_level < 2) {
          newEscalationLevel = 2;
          escalationAction = '2 saat kaldı - Takım lideri bildirimi';
        }
      } else if (hoursRemaining < 4) {
        // 4 saat kaldı
        if (slaRecord.escalation_level < 1) {
          newEscalationLevel = 1;
          escalationAction = '4 saat kaldı - Temsilci uyarısı';
        }
      }

      if (newEscalationLevel > slaRecord.escalation_level) {
        // Eskalasyon güncelle
        const { error } = await supabase
          .from('sla_tracking')
          .update({
            escalation_level: newEscalationLevel,
            last_escalation: now.toISOString(),
            escalation_history: [
              ...slaRecord.escalation_history,
              {
                level: newEscalationLevel,
                action: escalationAction,
                timestamp: now.toISOString(),
                triggered_by: 'system'
              }
            ]
          })
          .eq('id', slaRecord.id);

        if (error) throw error;

        // Bildirim gönder
        await sendEscalationNotification(slaRecord, escalationAction);

        toast.success(`Eskalasyon seviyesi ${newEscalationLevel}'e yükseltildi`);
        loadSLARecords();
      }
    } catch (error) {
      console.error('Eskalasyon hatası:', error);
      toast.error('Eskalasyon yapılırken hata oluştu');
    }
  };

  // Eskalasyon bildirimi gönder
  const sendEscalationNotification = async (slaRecord: SLARecord, action: string) => {
    try {
      // Temsilciye bildirim
      if (slaRecord.ticket?.agent_id) {
        await supabase
          .from('notifications')
          .insert({
            user_id: slaRecord.ticket.agent_id,
            title: 'SLA Uyarısı',
            message: `Talep #${slaRecord.ticket_id.slice(0, 8)} için ${action}`,
            type: 'sla_escalation',
            is_read: false
          });
      }

      // Yöneticilere bildirim (eskalasyon seviyesi 3+ ise)
      if (slaRecord.escalation_level >= 3) {
        // Tüm yöneticilere bildirim gönder
        const { data: managers } = await supabase
          .from('agents')
          .select('id')
          .eq('role', 'manager');

        if (managers) {
          const notifications = managers.map(manager => ({
            user_id: manager.id,
            title: 'Kritik SLA Uyarısı',
            message: `Talep #${slaRecord.ticket_id.slice(0, 8)} için acil müdahale gerekli`,
            type: 'critical_sla',
            is_read: false
          }));

          await supabase
            .from('notifications')
            .insert(notifications);
        }
      }
    } catch (error) {
      console.error('Bildirim gönderme hatası:', error);
    }
  };

  // SLA durumunu kontrol et
  const getSLAStatus = (slaRecord: SLARecord) => {
    const now = new Date();
    const deadline = new Date(slaRecord.deadline);
    const timeDiff = deadline.getTime() - now.getTime();
    const hoursRemaining = timeDiff / (1000 * 60 * 60);

    if (hoursRemaining < 0) {
      return { status: 'overdue', color: 'text-red-600', bgColor: 'bg-red-100 dark:bg-red-900/20' };
    } else if (hoursRemaining < 1) {
      return { status: 'critical', color: 'text-orange-600', bgColor: 'bg-orange-100 dark:bg-orange-900/20' };
    } else if (hoursRemaining < 2) {
      return { status: 'warning', color: 'text-yellow-600', bgColor: 'bg-yellow-100 dark:bg-yellow-900/20' };
    } else {
      return { status: 'normal', color: 'text-green-600', bgColor: 'bg-green-100 dark:bg-green-900/20' };
    }
  };

  // Kalan süreyi formatla
  const formatTimeRemaining = (deadline: string) => {
    const now = new Date();
    const deadlineDate = new Date(deadline);
    const timeDiff = deadlineDate.getTime() - now.getTime();

    if (timeDiff < 0) {
      return `Gecikme: ${formatDistanceToNow(deadlineDate, { locale: tr, addSuffix: true })}`;
    }

    const hours = Math.floor(timeDiff / (1000 * 60 * 60));
    const minutes = Math.floor((timeDiff % (1000 * 60 * 60)) / (1000 * 60));

    if (hours > 24) {
      const days = Math.floor(hours / 24);
      return `${days} gün ${hours % 24}s kaldı`;
    } else if (hours > 0) {
      return `${hours}s ${minutes}dk kaldı`;
    } else {
      return `${minutes}dk kaldı`;
    }
  };

  // Eskalasyon seviyesi rengi
  const getEscalationColor = (level: number) => {
    switch (level) {
      case 1: return 'text-blue-600 bg-blue-100 dark:bg-blue-900/20';
      case 2: return 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900/20';
      case 3: return 'text-orange-600 bg-orange-100 dark:bg-orange-900/20';
      case 4: return 'text-red-600 bg-red-100 dark:bg-red-900/20';
      default: return 'text-gray-600 bg-gray-100 dark:bg-gray-900/20';
    }
  };

  // Filtrelenmiş kayıtlar
  const filteredRecords = slaRecords.filter(record => {
    const status = getSLAStatus(record);
    switch (filter) {
      case 'active': return status.status === 'normal';
      case 'overdue': return status.status === 'overdue';
      case 'at_risk': return status.status === 'critical' || status.status === 'warning';
      default: return true;
    }
  });

  useEffect(() => {
    loadSLARecords();
    
    // Her 5 dakikada bir güncelle
    const interval = setInterval(loadSLARecords, 5 * 60 * 1000);
    
    return () => clearInterval(interval);
  }, [ticketId, showAll]);

  // Otomatik eskalasyon kontrolü
  useEffect(() => {
    const escalationInterval = setInterval(() => {
      slaRecords.forEach(record => {
        if (record.is_active) {
          performEscalation(record);
        }
      });
    }, 60 * 1000); // Her dakika kontrol et

    return () => clearInterval(escalationInterval);
  }, [slaRecords]);

  if (loading) {
    return (
      <div className={`bg-white dark:bg-gray-800 rounded-lg p-4 ${className}`}>
        <div className="flex items-center justify-center">
          <RefreshCw className="w-5 h-5 animate-spin text-blue-600" />
          <span className="ml-2 text-gray-600 dark:text-gray-400">SLA bilgileri yükleniyor...</span>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 ${className}`}>
      {/* Header */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Timer className="w-5 h-5 text-blue-600" />
            <h3 className="font-semibold text-gray-900 dark:text-white">
              SLA Takibi
            </h3>
            <span className="text-sm text-gray-500">
              ({filteredRecords.length} kayıt)
            </span>
          </div>
          
          <div className="flex items-center gap-2">
            {!ticketId && (
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value as any)}
                className="text-sm border border-gray-300 dark:border-gray-600 rounded px-2 py-1 bg-white dark:bg-gray-700"
              >
                <option value="all">Tümü</option>
                <option value="active">Aktif</option>
                <option value="at_risk">Risk Altında</option>
                <option value="overdue">Gecikmiş</option>
              </select>
            )}
            
            <button
              onClick={loadSLARecords}
              className="p-1 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* SLA Kayıtları */}
      <div className="max-h-96 overflow-y-auto">
        {filteredRecords.length === 0 ? (
          <div className="p-4 text-center text-gray-500 dark:text-gray-400">
            SLA kaydı bulunamadı
          </div>
        ) : (
          filteredRecords.map((record) => {
            const status = getSLAStatus(record);
            const timeRemaining = formatTimeRemaining(record.deadline);
            
            return (
              <div
                key={record.id}
                className={`p-4 border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors ${
                  status.status === 'overdue' ? 'bg-red-50 dark:bg-red-900/10' : ''
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <div className={`p-1 rounded ${status.bgColor}`}>
                        <Clock className={`w-4 h-4 ${status.color}`} />
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-gray-900 dark:text-white">
                          {record.ticket?.title || `Talep #${record.ticket_id.slice(0, 8)}`}
                        </span>
                        
                        {record.escalation_level > 0 && (
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getEscalationColor(record.escalation_level)}`}>
                            Seviye {record.escalation_level}
                          </span>
                        )}
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-gray-500">Müşteri:</span>
                        <span className="ml-1 text-gray-900 dark:text-white">
                          {record.customer?.name || 'Bilinmiyor'}
                        </span>
                      </div>
                      
                      <div>
                        <span className="text-gray-500">Temsilci:</span>
                        <span className="ml-1 text-gray-900 dark:text-white">
                          {record.agent?.name || 'Atanmamış'}
                        </span>
                      </div>
                      
                      <div>
                        <span className="text-gray-500">Öncelik:</span>
                        <span className="ml-1 text-gray-900 dark:text-white capitalize">
                          {record.priority_level}
                        </span>
                      </div>
                      
                      <div>
                        <span className="text-gray-500">Vade:</span>
                        <span className="ml-1 text-gray-900 dark:text-white">
                          {format(new Date(record.deadline), 'dd MMM HH:mm', { locale: tr })}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <div className={`text-sm font-medium ${status.color}`}>
                      {timeRemaining}
                    </div>
                    <div className="text-xs text-gray-500">
                      {status.status === 'overdue' ? 'Gecikmiş' : 
                       status.status === 'critical' ? 'Kritik' :
                       status.status === 'warning' ? 'Uyarı' : 'Normal'}
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default SLAMonitor;
