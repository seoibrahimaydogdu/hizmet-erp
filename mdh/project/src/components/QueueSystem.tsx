import React, { useState, useEffect, useRef } from 'react';
import {
  Users,
  Clock,
  MessageSquare,
  User,
  CheckCircle,
  AlertCircle,
  RefreshCw,
  Bell,
  X,
  Minus,
  Plus,
  Settings,
  Info
} from 'lucide-react';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';
import { toast } from 'react-hot-toast';
import { useSupabase } from '../hooks/useSupabase';


interface QueuePosition {
  id: string;
  customerId: string;
  customerName: string;
  customerEmail: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  category: string;
  estimatedWaitTime: number; // dakika cinsinden
  joinedAt: Date;
  status: 'waiting' | 'in_service' | 'completed' | 'left';
  agentId?: string;
  agentName?: string;
  startedAt?: Date;
  completedAt?: Date;
  notes?: string;
}

interface QueueSystemProps {
  customerId: string;
  customerName: string;
  customerEmail: string;
  onJoinQueue: (position: QueuePosition) => void;
  onLeaveQueue: () => void;
  onAgentAssigned: (agentId: string) => void;
  className?: string;
}

const QueueSystem: React.FC<QueueSystemProps> = ({
  customerId,
  customerName,
  customerEmail,
  onJoinQueue,
  onLeaveQueue,
  onAgentAssigned,
  className = ''
}) => {
  const { supabase } = useSupabase();

  
  const [queue, setQueue] = useState<QueuePosition[]>([]);
  const [currentPosition, setCurrentPosition] = useState<QueuePosition | null>(null);
  const [isInQueue, setIsInQueue] = useState(false);
  const [showJoinForm, setShowJoinForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [agents, setAgents] = useState<any[]>([]);
  const [settings, setSettings] = useState({
    maxWaitTime: 30, // dakika
    autoAssign: true,
    priorityBoost: true,
    notifications: true
  });

  const [joinForm, setJoinForm] = useState({
    priority: 'medium' as const,
    category: 'general',
    notes: ''
  });

  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Queue verilerini yükle
  const loadQueue = async () => {
    try {
      const { data, error } = await supabase
        .from('queue_positions')
        .select('*')
        .eq('status', 'waiting')
        .order('joinedAt', { ascending: true });

      if (error) throw error;

      const queueData = data.map((item: any) => ({
        ...item,
        joinedAt: new Date(item.joinedAt),
        startedAt: item.startedAt ? new Date(item.startedAt) : undefined,
        completedAt: item.completedAt ? new Date(item.completedAt) : undefined
      }));

      setQueue(queueData);

      // Mevcut pozisyonu bul
      const currentPos = queueData.find(pos => pos.customerId === customerId);
      setCurrentPosition(currentPos || null);
      setIsInQueue(!!currentPos);

    } catch (error) {
      console.error('Queue yükleme hatası:', error);
      toast.error('Sıra bilgileri yüklenemedi');
    }
  };

  // Temsilcileri yükle
  const loadAgents = async () => {
    try {
      const { data, error } = await supabase
        .from('agents')
        .select('*')
        .eq('status', 'active')
        .eq('is_available', true);

      if (error) throw error;
      setAgents(data || []);
    } catch (error) {
      console.error('Temsilci yükleme hatası:', error);
    }
  };

  // Queue'ya katıl
  const joinQueue = async () => {
    if (!joinForm.category.trim()) {
      toast.error('Lütfen kategori seçin');
      return;
    }

    setLoading(true);
    try {
      const estimatedWaitTime = calculateEstimatedWaitTime();
      
      const newPosition: Omit<QueuePosition, 'id'> = {
        customerId,
        customerName,
        customerEmail,
        priority: joinForm.priority,
        category: joinForm.category,
        estimatedWaitTime,
        joinedAt: new Date(),
        status: 'waiting',
        notes: joinForm.notes
      };

      const { data, error } = await supabase
        .from('queue_positions')
        .insert([newPosition])
        .select()
        .single();

      if (error) throw error;

      const position: QueuePosition = {
        ...data,
        joinedAt: new Date(data.joinedAt)
      };

      setCurrentPosition(position);
      setIsInQueue(true);
      setShowJoinForm(false);
      onJoinQueue(position);

      toast.success(`Sıraya katıldınız! Tahmini bekleme süresi: ${estimatedWaitTime} dakika`);

      // Bildirim gönder
      if (settings.notifications) {
        sendNotification('Sıraya Katıldınız', {
          body: `Tahmini bekleme süresi: ${estimatedWaitTime} dakika`,
          tag: 'queue-joined'
        });
      }

    } catch (error) {
      console.error('Queue katılma hatası:', error);
      toast.error('Sıraya katılırken hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  // Queue'dan ayrıl
  const leaveQueue = async () => {
    if (!currentPosition) return;

    setLoading(true);
    try {
      const { error } = await supabase
        .from('queue_positions')
        .update({ 
          status: 'left',
          completedAt: new Date().toISOString()
        })
        .eq('id', currentPosition.id);

      if (error) throw error;

      setCurrentPosition(null);
      setIsInQueue(false);
      onLeaveQueue();

      toast.success('Sıradan ayrıldınız');

    } catch (error) {
      console.error('Queue ayrılma hatası:', error);
      toast.error('Sıradan ayrılırken hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  // Tahmini bekleme süresi hesapla
  const calculateEstimatedWaitTime = (): number => {
    const activeAgents = agents.length;
    const peopleAhead = queue.filter(pos => 
      pos.priority === 'urgent' || 
      (pos.priority === 'high' && joinForm.priority !== 'urgent') ||
      (pos.priority === 'medium' && joinForm.priority === 'low')
    ).length;

    const avgServiceTime = 5; // dakika
    const baseWaitTime = (peopleAhead * avgServiceTime) / Math.max(activeAgents, 1);

    // Öncelik bonusu
    let priorityMultiplier = 1;
    switch (joinForm.priority) {
      case 'urgent': priorityMultiplier = 0.3; break;
      case 'high': priorityMultiplier = 0.7; break;
      case 'medium': priorityMultiplier = 1; break;
      case 'low': priorityMultiplier = 1.5; break;
    }

    return Math.max(Math.round(baseWaitTime * priorityMultiplier), 1);
  };

  // Pozisyon hesapla
  const getPosition = (): number => {
    if (!currentPosition) return 0;
    
    const waitingQueue = queue.filter(pos => pos.status === 'waiting');
    return waitingQueue.findIndex(pos => pos.id === currentPosition.id) + 1;
  };

  // Kalan süre hesapla
  const getRemainingTime = (): number => {
    if (!currentPosition) return 0;
    
    const position = getPosition();
    const avgServiceTime = 5; // dakika
    const activeAgents = agents.length;
    
    return Math.max(Math.round((position * avgServiceTime) / Math.max(activeAgents, 1)), 1);
  };

  // Real-time güncellemeler
  useEffect(() => {
    loadQueue();
    loadAgents();

    // Real-time subscription
    const queueSubscription = supabase
      .channel('queue_changes')
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'queue_positions' 
        }, 
        (payload: any) => {
          console.log('Queue değişikliği:', payload);
          loadQueue();
          
          // Temsilci atandığında bildirim
          if (payload.eventType === 'UPDATE' && 
              payload.new.agentId && 
              payload.new.customerId === customerId) {
            onAgentAssigned(payload.new.agentId);
            toast.success('Temsilci atandı! Sohbet başlıyor...');
            
            if (settings.notifications) {
              sendNotification('Temsilci Atandı', {
                body: 'Destek temsilciniz sizi bekliyor',
                tag: 'agent-assigned'
              });
            }
          }
        }
      )
      .subscribe();

    // Periyodik güncelleme
    intervalRef.current = setInterval(() => {
      loadQueue();
    }, 30000); // 30 saniyede bir

    return () => {
      supabase.removeChannel(queueSubscription);
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [customerId]);

  const priorityColors = {
    urgent: 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400',
    high: 'bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400',
    medium: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400',
    low: 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
  };

  const priorityText = {
    urgent: 'Acil',
    high: 'Yüksek',
    medium: 'Orta',
    low: 'Düşük'
  };

  return (
    <div className={`bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
            <Users className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Canlı Destek Sırası
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {queue.filter(pos => pos.status === 'waiting').length} kişi bekliyor
            </p>
          </div>
        </div>
        
        <button
          onClick={() => setShowJoinForm(!showJoinForm)}
          className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          title="Ayarlar"
        >
          <Settings className="w-5 h-5 text-gray-600 dark:text-gray-400" />
        </button>
      </div>

      {/* Mevcut Durum */}
      {isInQueue && currentPosition && (
        <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 mb-6 border border-blue-200 dark:border-blue-800">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              <span className="font-medium text-blue-900 dark:text-blue-100">
                Sırada Bekliyorsunuz
              </span>
            </div>
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${priorityColors[currentPosition.priority]}`}>
              {priorityText[currentPosition.priority]}
            </span>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div className="flex items-center gap-2">
              <User className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              <span className="text-blue-700 dark:text-blue-300">
                Pozisyon: {getPosition()}
              </span>
            </div>
            
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              <span className="text-blue-700 dark:text-blue-300">
                Tahmini: {getRemainingTime()} dakika
              </span>
            </div>
            
            <div className="flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              <span className="text-blue-700 dark:text-blue-300">
                Kategori: {currentPosition.category}
              </span>
            </div>
          </div>
          
          <div className="mt-3 flex gap-2">
            <button
              onClick={leaveQueue}
              disabled={loading}
              className="px-3 py-1 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
            >
              {loading ? 'Ayrılıyor...' : 'Sıradan Ayrıl'}
            </button>
            
            <button
              onClick={loadQueue}
              className="px-3 py-1 bg-gray-600 text-white text-sm rounded-lg hover:bg-gray-700 transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Queue'ya Katılma Formu */}
      {!isInQueue && showJoinForm && (
        <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 mb-6">
          <h4 className="font-medium text-gray-900 dark:text-white mb-4">
            Sıraya Katıl
          </h4>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Öncelik
              </label>
              <select
                value={joinForm.priority}
                onChange={(e) => setJoinForm({ ...joinForm, priority: e.target.value as any })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
              >
                <option value="low">Düşük</option>
                <option value="medium">Orta</option>
                <option value="high">Yüksek</option>
                <option value="urgent">Acil</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Kategori
              </label>
              <select
                value={joinForm.category}
                onChange={(e) => setJoinForm({ ...joinForm, category: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
              >
                <option value="general">Genel</option>
                <option value="technical">Teknik Destek</option>
                <option value="billing">Faturalama</option>
                <option value="sales">Satış</option>
                <option value="complaint">Şikayet</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Notlar (Opsiyonel)
              </label>
              <textarea
                value={joinForm.notes}
                onChange={(e) => setJoinForm({ ...joinForm, notes: e.target.value })}
                rows={3}
                placeholder="Sorununuz hakkında kısa bilgi..."
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
              />
            </div>
            
            <div className="flex gap-2">
              <button
                onClick={joinQueue}
                disabled={loading}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
              >
                {loading ? 'Katılıyor...' : 'Sıraya Katıl'}
              </button>
              
              <button
                onClick={() => setShowJoinForm(false)}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                İptal
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Queue'ya Katılma Butonu */}
      {!isInQueue && !showJoinForm && (
        <div className="text-center mb-6">
          <button
            onClick={() => setShowJoinForm(true)}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            <MessageSquare className="w-5 h-5 inline mr-2" />
            Canlı Destek Sırasına Katıl
          </button>
        </div>
      )}

      {/* Sıra Durumu */}
      <div className="space-y-3">
        <h4 className="font-medium text-gray-900 dark:text-white flex items-center gap-2">
          <Users className="w-4 h-4" />
          Sıra Durumu
        </h4>
        
        {queue.filter(pos => pos.status === 'waiting').length === 0 ? (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            <Users className="w-12 h-12 mx-auto mb-2 opacity-50" />
            <p>Şu anda sırada kimse yok</p>
          </div>
        ) : (
          <div className="space-y-2 max-h-60 overflow-y-auto">
            {queue
              .filter(pos => pos.status === 'waiting')
              .slice(0, 10) // İlk 10 kişiyi göster
              .map((position, index) => (
                <div
                  key={position.id}
                  className={`flex items-center justify-between p-3 rounded-lg border ${
                    position.customerId === customerId
                      ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800'
                      : 'bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-gray-200 dark:bg-gray-600 rounded-full flex items-center justify-center text-sm font-medium">
                      {index + 1}
                    </div>
                    
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">
                        {position.customerName}
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {position.category}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${priorityColors[position.priority]}`}>
                      {priorityText[position.priority]}
                    </span>
                    
                    {position.customerId === customerId && (
                      <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900/20 text-blue-800 dark:text-blue-400 rounded-full text-xs font-medium">
                        Siz
                      </span>
                    )}
                  </div>
                </div>
              ))}
          </div>
        )}
      </div>

      {/* Bilgi */}
      <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
        <div className="flex items-start gap-2">
          <Info className="w-4 h-4 text-gray-600 dark:text-gray-400 mt-0.5" />
          <div className="text-sm text-gray-600 dark:text-gray-400">
            <p className="font-medium mb-1">Sıra Kuralları:</p>
            <ul className="space-y-1 text-xs">
              <li>• Acil öncelikli talepler önce hizmet alır</li>
              <li>• Tahmini bekleme süresi dinamik olarak hesaplanır</li>
              <li>• Sıradan ayrılırsanız pozisyonunuzu kaybedersiniz</li>
              <li>• Temsilci atandığında otomatik bildirim alırsınız</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QueueSystem;
