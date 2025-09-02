import React, { useState, useEffect, useCallback, useRef } from 'react';
import { 
  Plus, 
  Save, 
  Play, 
  Pause, 
  Trash2, 
  Copy, 
  Settings, 
  Eye,
  Download,
  Upload,
  Grid3X3,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  CheckCircle,
  AlertCircle,
  Clock,
  Users,
  MessageSquare,
  Bell,
  Mail,
  UserCheck,
  Edit,
  Globe,
  GitBranch,
  Flag,
  RefreshCw,
  X,
  MousePointer,
  Link,
  Unlink,
  Move,
  Hand,
  HelpCircle,
  ArrowRight,
  ArrowLeft,
  PlayCircle,
  ShoppingCart,
  DollarSign,
  CheckSquare,
  User,
  Database
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { supabase } from '../lib/supabase';
import FeedbackButton from './common/FeedbackButton';

interface WorkflowNode {
  id: string;
  type: 'trigger' | 'condition' | 'action' | 'approval' | 'notification' | 'assignment';
  position: { x: number; y: number };
  data: {
    label: string;
    config: any;
    [key: string]: any;
  };
}

interface WorkflowConnection {
  id: string;
  source: string;
  target: string;
  sourceHandle?: string;
  targetHandle?: string;
  label?: string;
}

interface Workflow {
  id?: string;
  name: string;
  description: string;
  category: string;
  status: 'draft' | 'active' | 'inactive' | 'archived';
  workflow_data: {
    nodes: WorkflowNode[];
    connections: WorkflowConnection[];
  };
  trigger_config: any;
  variables: any;
  version: number;
  execution_count: number;
  last_executed?: string;
  created_by?: string;
  created_at?: string;
  updated_at?: string;
}

interface WorkflowTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  template_data: any;
  usage_count: number;
  is_public: boolean;
}

const WorkflowBuilder: React.FC = () => {
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [templates, setTemplates] = useState<WorkflowTemplate[]>([]);
  const [selectedWorkflow, setSelectedWorkflow] = useState<Workflow | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [showTemplates, setShowTemplates] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectionStart, setConnectionStart] = useState<string | null>(null);
  const [draggedNode, setDraggedNode] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [showNodeConfig, setShowNodeConfig] = useState<string | null>(null);
  const [toolMode, setToolMode] = useState<'select' | 'connect' | 'pan'>('select');
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [connectionPreview, setConnectionPreview] = useState<{ start: { x: number; y: number }; end: { x: number; y: number } } | null>(null);
  
  // Tutorial state
  const [showTutorial, setShowTutorial] = useState(false);
  const [tutorialStep, setTutorialStep] = useState(0);
  const [tutorialCompleted, setTutorialCompleted] = useState(false);
  
  const canvasRef = useRef<HTMLDivElement>(null);
  const connectionCanvasRef = useRef<HTMLCanvasElement>(null);

  // Node tipleri - Gerçek trigger'lar ile
  const nodeTypes = [
    {
      type: 'trigger',
      label: 'Tetikleyici',
      icon: MessageSquare,
      color: 'bg-blue-500',
      description: 'Workflow\'u başlatan olaylar',
      triggers: [
        { id: 'customer_created', label: 'Müşteri Eklendi', icon: Users },
        { id: 'ticket_created', label: 'Talep Oluşturuldu', icon: MessageSquare },
        { id: 'ticket_status_changed', label: 'Talep Durumu Değişti', icon: RefreshCw },
        { id: 'payment_received', label: 'Ödeme Alındı', icon: CheckCircle },
        { id: 'order_placed', label: 'Sipariş Verildi', icon: ShoppingCart },
        { id: 'sla_breach', label: 'SLA İhlali', icon: AlertCircle },
        { id: 'daily_report', label: 'Günlük Rapor', icon: Clock },
        { id: 'webhook', label: 'Webhook', icon: Globe }
      ]
    },
    {
      type: 'condition',
      label: 'Koşul',
      icon: GitBranch,
      color: 'bg-yellow-500',
      description: 'Mantıksal koşul kontrolü',
      conditions: [
        { id: 'priority_check', label: 'Öncelik Kontrolü', icon: Flag },
        { id: 'amount_check', label: 'Tutar Kontrolü', icon: DollarSign },
        { id: 'status_check', label: 'Durum Kontrolü', icon: CheckSquare },
        { id: 'time_check', label: 'Zaman Kontrolü', icon: Clock },
        { id: 'user_check', label: 'Kullanıcı Kontrolü', icon: User }
      ]
    },
    {
      type: 'action',
      label: 'Aksiyon',
      icon: CheckCircle,
      color: 'bg-green-500',
      description: 'Gerçekleştirilecek işlemler',
      actions: [
        { id: 'send_email', label: 'E-posta Gönder', icon: Mail },
        { id: 'send_notification', label: 'Bildirim Gönder', icon: Bell },
        { id: 'assign_ticket', label: 'Talep Ata', icon: UserCheck },
        { id: 'update_status', label: 'Durum Güncelle', icon: Edit },
        { id: 'create_ticket', label: 'Talep Oluştur', icon: Plus },
        { id: 'send_sms', label: 'SMS Gönder', icon: MessageSquare },
        { id: 'webhook_call', label: 'Webhook Çağır', icon: Globe },
        { id: 'database_update', label: 'Veritabanı Güncelle', icon: Database }
      ]
    },
    {
      type: 'approval',
      label: 'Onay',
      icon: Users,
      color: 'bg-purple-500',
      description: 'Onay süreçleri',
      approvals: [
        { id: 'manager_approval', label: 'Yönetici Onayı', icon: UserCheck },
        { id: 'finance_approval', label: 'Finans Onayı', icon: DollarSign },
        { id: 'technical_approval', label: 'Teknik Onay', icon: Settings },
        { id: 'customer_approval', label: 'Müşteri Onayı', icon: User }
      ]
    },
    {
      type: 'notification',
      label: 'Bildirim',
      icon: Bell,
      color: 'bg-orange-500',
      description: 'Bildirim gönderme',
      notifications: [
        { id: 'email_notification', label: 'E-posta Bildirimi', icon: Mail },
        { id: 'sms_notification', label: 'SMS Bildirimi', icon: MessageSquare },
        { id: 'push_notification', label: 'Push Bildirimi', icon: Bell },
        { id: 'slack_notification', label: 'Slack Bildirimi', icon: MessageSquare }
      ]
    }
  ];

  // Varsayılan node konfigürasyonları
  const defaultNodeConfigs = {
    trigger: {
      'ticket_created': { label: 'Talep Oluşturuldu', icon: MessageSquare },
      'status_changed': { label: 'Durum Değişti', icon: RefreshCw },
      'priority_updated': { label: 'Öncelik Güncellendi', icon: Flag },
      'time_based': { label: 'Zaman Bazlı', icon: Clock }
    },
    action: {
      'send_email': { label: 'E-posta Gönder', icon: Mail },
      'assign_ticket': { label: 'Talep Ata', icon: UserCheck },
      'update_status': { label: 'Durum Güncelle', icon: Edit },
      'send_notification': { label: 'Bildirim Gönder', icon: Bell },
      'webhook': { label: 'Webhook', icon: Globe }
    }
  };

  // Workflow'ları yükle
  const fetchWorkflows = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('workflows')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setWorkflows(data || []);
    } catch (error) {
      console.error('Workflow\'lar yüklenirken hata:', error);
      toast.error('Workflow\'lar yüklenemedi');
    }
  }, []);

  // Şablonları yükle
  const fetchTemplates = useCallback(async () => {
    try {
      console.log('Şablonlar yükleniyor...');
      const { data, error } = await supabase
        .from('workflow_templates')
        .select('*')
        .eq('is_public', true)
        .order('usage_count', { ascending: false });

      if (error) {
        console.error('Şablon yükleme hatası:', error);
        // Eğer tablo yoksa varsayılan şablonları oluştur
        if (error.code === '42P01') { // Table doesn't exist
          console.log('workflow_templates tablosu bulunamadı, varsayılan şablonlar oluşturuluyor...');
          await createDefaultTemplates();
        } else {
          throw error;
        }
      } else {
        console.log('Şablonlar yüklendi:', data);
        setTemplates(data || []);
      }
    } catch (error) {
      console.error('Şablonlar yüklenirken hata:', error);
      toast.error('Şablonlar yüklenemedi');
    }
  }, []);

  // Varsayılan şablonları oluştur
  const createDefaultTemplates = async () => {
    try {
      const defaultTemplates = [
        {
          name: 'Otomatik Talep Atama',
          description: 'Yeni talepleri otomatik olarak uygun temsilciye atar',
          category: 'ticket',
          template_data: {
            nodes: [
              {
                id: 'trigger_1',
                type: 'trigger',
                position: { x: 100, y: 100 },
                data: { label: 'Talep Oluşturuldu', config: { type: 'ticket_created' } }
              },
              {
                id: 'action_1',
                type: 'action',
                position: { x: 400, y: 100 },
                data: { label: 'Talep Ata', config: { type: 'assign_ticket' } }
              }
            ],
            connections: [
              {
                id: 'conn_1',
                source: 'trigger_1',
                target: 'action_1'
              }
            ]
          },
          usage_count: 0,
          is_public: true
        },
        {
          name: 'SLA İhlali Yükseltme',
          description: 'SLA ihlali durumunda talebi yükseltir',
          category: 'ticket',
          template_data: {
            nodes: [
              {
                id: 'trigger_1',
                type: 'trigger',
                position: { x: 100, y: 100 },
                data: { label: 'SLA İhlali', config: { type: 'sla_breach' } }
              },
              {
                id: 'action_1',
                type: 'action',
                position: { x: 400, y: 100 },
                data: { label: 'Yükselt', config: { type: 'escalate' } }
              }
            ],
            connections: [
              {
                id: 'conn_1',
                source: 'trigger_1',
                target: 'action_1'
              }
            ]
          },
          usage_count: 0,
          is_public: true
        },
        {
          name: 'Müşteri Bildirimi',
          description: 'Talep durumu değiştiğinde müşteriye bildirim gönderir',
          category: 'notification',
          template_data: {
            nodes: [
              {
                id: 'trigger_1',
                type: 'trigger',
                position: { x: 100, y: 100 },
                data: { label: 'Durum Değişti', config: { type: 'status_changed' } }
              },
              {
                id: 'action_1',
                type: 'action',
                position: { x: 400, y: 100 },
                data: { label: 'E-posta Gönder', config: { type: 'send_email' } }
              }
            ],
            connections: [
              {
                id: 'conn_1',
                source: 'trigger_1',
                target: 'action_1'
              }
            ]
          },
          usage_count: 0,
          is_public: true
        }
      ];

      console.log('Varsayılan şablonlar oluşturuluyor:', defaultTemplates);

      const { data, error } = await supabase
        .from('workflow_templates')
        .insert(defaultTemplates);

      if (error) {
        console.error('Şablon oluşturma hatası:', error);
        throw error;
      }
      
      console.log('Şablonlar oluşturuldu:', data);
      setTemplates(data || []);
      toast.success('Varsayılan şablonlar oluşturuldu');
    } catch (error) {
      console.error('Varsayılan şablonlar oluşturulurken hata:', error);
      toast.error('Şablonlar oluşturulamadı');
    }
  };

  useEffect(() => {
    fetchWorkflows();
    fetchTemplates();
  }, [fetchWorkflows, fetchTemplates]);

  // Yeni workflow oluştur
  const createNewWorkflow = () => {
    const newWorkflow: Workflow = {
      name: 'Yeni Workflow',
      description: '',
      category: 'ticket',
      status: 'draft',
      workflow_data: {
        nodes: [],
        connections: []
      },
      trigger_config: {},
      variables: {},
      version: 1,
      execution_count: 0
    };
    setSelectedWorkflow(newWorkflow);
    setIsEditing(true);
  };

  // Gerçek trigger fonksiyonları
  const triggerFunctions = {
    // Müşteri eklendiğinde
    customer_created: async (data: any) => {
      console.log('Müşteri eklendi trigger çalıştı:', data);
      // Burada gerçek müşteri ekleme işlemi yapılabilir
      return { success: true, message: 'Müşteri eklendi', data };
    },

    // Talep oluşturulduğunda
    ticket_created: async (data: any) => {
      console.log('Talep oluşturuldu trigger çalıştı:', data);
      // Burada gerçek talep oluşturma işlemi yapılabilir
      return { success: true, message: 'Talep oluşturuldu', data };
    },

    // Talep durumu değiştiğinde
    ticket_status_changed: async (data: any) => {
      console.log('Talep durumu değişti trigger çalıştı:', data);
      return { success: true, message: 'Talep durumu değişti', data };
    },

    // Ödeme alındığında
    payment_received: async (data: any) => {
      console.log('Ödeme alındı trigger çalıştı:', data);
      return { success: true, message: 'Ödeme alındı', data };
    },

    // Sipariş verildiğinde
    order_placed: async (data: any) => {
      console.log('Sipariş verildi trigger çalıştı:', data);
      return { success: true, message: 'Sipariş verildi', data };
    },

    // SLA ihlali
    sla_breach: async (data: any) => {
      console.log('SLA ihlali trigger çalıştı:', data);
      return { success: true, message: 'SLA ihlali tespit edildi', data };
    },

    // Günlük rapor
    daily_report: async (data: any) => {
      console.log('Günlük rapor trigger çalıştı:', data);
      return { success: true, message: 'Günlük rapor hazırlandı', data };
    },

    // Webhook
    webhook: async (data: any) => {
      console.log('Webhook trigger çalıştı:', data);
      return { success: true, message: 'Webhook tetiklendi', data };
    }
  };

  // Aksiyon fonksiyonları
  const actionFunctions = {
    // E-posta gönder
    send_email: async (data: any) => {
      console.log('E-posta gönderiliyor:', data);
      // Burada gerçek e-posta gönderme işlemi yapılabilir
      return { success: true, message: 'E-posta gönderildi' };
    },

    // Bildirim gönder
    send_notification: async (data: any) => {
      console.log('Bildirim gönderiliyor:', data);
      return { success: true, message: 'Bildirim gönderildi' };
    },

    // Talep ata
    assign_ticket: async (data: any) => {
      console.log('Talep atanıyor:', data);
      return { success: true, message: 'Talep atandı' };
    },

    // Durum güncelle
    update_status: async (data: any) => {
      console.log('Durum güncelleniyor:', data);
      return { success: true, message: 'Durum güncellendi' };
    },

    // SMS gönder
    send_sms: async (data: any) => {
      console.log('SMS gönderiliyor:', data);
      return { success: true, message: 'SMS gönderildi' };
    },

    // Webhook çağır
    webhook_call: async (data: any) => {
      console.log('Webhook çağrılıyor:', data);
      return { success: true, message: 'Webhook çağrıldı' };
    }
  };

  // Workflow'u çalıştır
  const executeWorkflow = async (workflow: Workflow, triggerData?: any) => {
    try {
      console.log('Workflow çalıştırılıyor:', workflow.name);
      
      // Trigger node'unu bul
      const triggerNode = workflow.workflow_data.nodes.find(node => node.type === 'trigger');
      if (!triggerNode) {
        throw new Error('Trigger node bulunamadı');
      }

      const triggerType = triggerNode.data.config.triggerType;
      if (!triggerType || typeof triggerType !== 'string' || !triggerFunctions[triggerType as keyof typeof triggerFunctions]) {
        throw new Error('Geçersiz trigger tipi');
      }

      // Trigger'ı çalıştır
      const triggerResult = await triggerFunctions[triggerType as keyof typeof triggerFunctions](triggerData || {});
      console.log('Trigger sonucu:', triggerResult);

      // Workflow'u takip et
      const executionPath = await followWorkflowPath(workflow, triggerNode.id, triggerResult);
      
      // Çalıştırma sayısını artır
      setSelectedWorkflow(prev => prev ? {
        ...prev,
        execution_count: prev.execution_count + 1,
        last_executed: new Date().toISOString()
      } : null);

      toast.success(`Workflow başarıyla çalıştırıldı: ${executionPath.length} adım`);
      return executionPath;

    } catch (error) {
      console.error('Workflow çalıştırılırken hata:', error);
      toast.error('Workflow çalıştırılamadı');
      throw error;
    }
  };

  // Workflow yolunu takip et
  const followWorkflowPath = async (workflow: Workflow, startNodeId: string, initialData: any) => {
    const executionPath: any[] = [];
    let currentNodeId = startNodeId;
    let currentData = initialData;

    while (currentNodeId) {
      const currentNode = workflow.workflow_data.nodes.find(node => node.id === currentNodeId);
      if (!currentNode) break;

      console.log(`Node çalıştırılıyor: ${currentNode.data.label}`);

      // Node tipine göre işlem yap
      if (currentNode.type === 'action') {
        const actionType = currentNode.data.config.actionType;
        if (actionType && actionFunctions[actionType as keyof typeof actionFunctions]) {
          const result = await actionFunctions[actionType as keyof typeof actionFunctions](currentData);
          executionPath.push({
            nodeId: currentNodeId,
            nodeType: currentNode.type,
            action: actionType,
            result
          });
        }
      } else if (currentNode.type === 'condition') {
        // Koşul kontrolü
        const conditionResult = await evaluateCondition(currentNode, currentData);
        executionPath.push({
          nodeId: currentNodeId,
          nodeType: currentNode.type,
          condition: currentNode.data.config.conditionType,
          result: conditionResult
        });
      }

      // Sonraki node'u bul
      const nextConnection = workflow.workflow_data.connections.find(conn => conn.source === currentNodeId);
      currentNodeId = nextConnection?.target || null;
    }

    return executionPath;
  };

  // Koşul değerlendir
  const evaluateCondition = async (conditionNode: WorkflowNode, data: any) => {
    const conditionType = conditionNode.data.config.conditionType;
    
    switch (conditionType) {
      case 'priority_check':
        return data.priority === 'high';
      case 'amount_check':
        return data.amount > 1000;
      case 'status_check':
        return data.status === 'active';
      default:
        return true;
    }
  };

  // Workflow kaydet
  const saveWorkflow = async () => {
    if (!selectedWorkflow) return;

    try {
      const workflowData = {
        ...selectedWorkflow,
        updated_at: new Date().toISOString()
      };

      let result;
      if (selectedWorkflow.id) {
        // Güncelle
        result = await supabase
          .from('workflows')
          .update(workflowData)
          .eq('id', selectedWorkflow.id);
      } else {
        // Yeni oluştur
        result = await supabase
          .from('workflows')
          .insert([workflowData]);
      }

      if (result.error) throw result.error;

      toast.success('Workflow kaydedildi');
      fetchWorkflows();
      setIsEditing(false);
    } catch (error) {
      console.error('Workflow kaydedilirken hata:', error);
      toast.error('Workflow kaydedilemedi');
    }
  };

  // Node ekle - Gelişmiş trigger sistemi ile
  const addNode = (nodeType: string, position: { x: number; y: number }, subType?: string) => {
    if (!selectedWorkflow) return;

    // Position kontrolü
    if (!position || typeof position.x !== 'number' || typeof position.y !== 'number') {
      console.warn('Invalid position provided:', position);
      position = { x: 0, y: 0 };
    }

    const nodeTypeInfo = nodeTypes.find(nt => nt.type === nodeType);
    let label = nodeTypeInfo?.label || `${nodeType.charAt(0).toUpperCase() + nodeType.slice(1)} Node`;
    let config = {};

    // Alt tip seçimi
    if (subType) {
      if (nodeType === 'trigger' && nodeTypeInfo?.triggers) {
        const trigger = nodeTypeInfo.triggers.find(t => t.id === subType);
        if (trigger) {
          label = trigger.label;
          config = { triggerType: subType };
        }
      } else if (nodeType === 'action' && nodeTypeInfo?.actions) {
        const action = nodeTypeInfo.actions.find(a => a.id === subType);
        if (action) {
          label = action.label;
          config = { actionType: subType };
        }
      } else if (nodeType === 'condition' && nodeTypeInfo?.conditions) {
        const condition = nodeTypeInfo.conditions.find(c => c.id === subType);
        if (condition) {
          label = condition.label;
          config = { conditionType: subType };
        }
      }
    }

    const newNode: WorkflowNode = {
      id: `node_${Date.now()}`,
      type: nodeType as any,
      position,
      data: {
        label,
        config,
        nodeType,
        subType
      }
    };

    setSelectedWorkflow(prev => prev ? {
      ...prev,
      workflow_data: {
        ...prev.workflow_data,
        nodes: [...prev.workflow_data.nodes, newNode]
      }
    } : null);

    toast.success(`${label} eklendi`);
  };

  // Node sil
  const deleteNode = (nodeId: string) => {
    if (!selectedWorkflow) return;

    const nodeToDelete = selectedWorkflow.workflow_data.nodes.find(n => n.id === nodeId);
    const connectionsToDelete = selectedWorkflow.workflow_data.connections.filter(
      conn => conn.source === nodeId || conn.target === nodeId
    );

    setSelectedWorkflow(prev => prev ? {
      ...prev,
      workflow_data: {
        nodes: prev.workflow_data.nodes.filter(node => node.id !== nodeId),
        connections: prev.workflow_data.connections.filter(
          conn => conn.source !== nodeId && conn.target !== nodeId
        )
      }
    } : null);

    toast.success(`${nodeToDelete?.data.label || 'Node'} silindi (${connectionsToDelete.length} bağlantı da silindi)`);
  };

  // Node taşı
  const moveNode = (nodeId: string, newPosition: { x: number; y: number }) => {
    if (!selectedWorkflow) return;

    setSelectedWorkflow(prev => prev ? {
      ...prev,
      workflow_data: {
        ...prev.workflow_data,
        nodes: prev.workflow_data.nodes.map(node =>
          node.id === nodeId ? { ...node, position: newPosition } : node
        )
      }
    } : null);
  };

  // Bağlantı oluştur
  const createConnection = (sourceId: string, targetId: string) => {
    if (!selectedWorkflow) return;

    // Aynı node'a bağlantı yapılamaz
    if (sourceId === targetId) {
      toast.error('Node kendisine bağlanamaz');
      return;
    }

    // Zaten var olan bağlantıyı kontrol et
    const existingConnection = selectedWorkflow.workflow_data.connections.find(
      conn => conn.source === sourceId && conn.target === targetId
    );
    if (existingConnection) {
      toast.error('Bu bağlantı zaten mevcut');
      return;
    }

    const sourceNode = selectedWorkflow.workflow_data.nodes.find(n => n.id === sourceId);
    const targetNode = selectedWorkflow.workflow_data.nodes.find(n => n.id === targetId);

    // Node'ların varlığını kontrol et
    if (!sourceNode) {
      toast.error('Kaynak node bulunamadı');
      return;
    }

    if (!targetNode) {
      toast.error('Hedef node bulunamadı');
      return;
    }

    // Node'ların position bilgilerini kontrol et
    if (!sourceNode.position) {
      console.warn('Kaynak node position undefined, varsayılan değer atanıyor');
      sourceNode.position = { x: Math.random() * 400, y: Math.random() * 300 };
    }

    if (!targetNode.position) {
      console.warn('Hedef node position undefined, varsayılan değer atanıyor');
      targetNode.position = { x: Math.random() * 400, y: Math.random() * 300 };
    }

    const newConnection: WorkflowConnection = {
      id: `conn_${Date.now()}`,
      source: sourceId,
      target: targetId,
      label: `${sourceNode?.data.label} → ${targetNode?.data.label}`
    };

    console.log('Yeni bağlantı oluşturuluyor:', newConnection);
    console.log('Mevcut bağlantılar:', selectedWorkflow.workflow_data.connections);

    setSelectedWorkflow(prev => {
      const updatedWorkflow = prev ? {
        ...prev,
        workflow_data: {
          ...prev.workflow_data,
          connections: [...prev.workflow_data.connections, newConnection]
        }
      } : null;
      
      console.log('Güncellenmiş workflow:', updatedWorkflow);
      
      return updatedWorkflow;
    });

    // Bağlantı oluşturulduktan sonra hemen çiz
    setTimeout(() => {
      drawConnections();
      console.log('Bağlantı çizimi tetiklendi');
    }, 50);

    toast.success('Bağlantı oluşturuldu');
  };

  // Bağlantı sil
  const deleteConnection = (connectionId: string) => {
    if (!selectedWorkflow) return;

    setSelectedWorkflow(prev => prev ? {
      ...prev,
      workflow_data: {
        ...prev.workflow_data,
        connections: prev.workflow_data.connections.filter(
          conn => conn.id !== connectionId
        )
      }
    } : null);
  };

  // Şablon kullan
  const useTemplate = (template: WorkflowTemplate) => {
    try {
      console.log('Şablon yükleniyor:', template);
      
      // Template data'yı doğru formata dönüştür
      const workflowData = {
        nodes: template.template_data.nodes || [],
        connections: template.template_data.connections || []
      };

      console.log('Workflow data:', workflowData);
      console.log('Node pozisyonları:', workflowData.nodes.map((n: any) => ({ id: n.id, position: n.position })));

      const newWorkflow: Workflow = {
        name: `${template.name} - Kopya`,
        description: template.description,
        category: template.category,
        status: 'draft',
        workflow_data: workflowData,
        trigger_config: {},
        variables: {},
        version: 1,
        execution_count: 0
      };
      
      console.log('Yeni workflow:', newWorkflow);
      
      // Canvas'ı merkeze getir ve zoom'u sıfırla
      setPan({ x: 50, y: 50 });
      setZoom(1);
      
      setSelectedWorkflow(newWorkflow);
      setIsEditing(true);
      setShowTemplates(false);
      
      // Şablon kullanım sayısını artır
      updateTemplateUsage(template.id);
      
      toast.success(`${template.name} şablonu yüklendi - ${workflowData.nodes.length} node eklendi`);
      
      // Debug için node'ları kontrol et
      setTimeout(() => {
        console.log('Şablon yüklendikten sonra selectedWorkflow:', newWorkflow);
        console.log('Node sayısı:', newWorkflow.workflow_data.nodes.length);
        newWorkflow.workflow_data.nodes.forEach((node, index) => {
          console.log(`Node ${index}:`, { id: node.id, position: node.position, type: node.type });
        });
      }, 100);
      
    } catch (error) {
      console.error('Şablon yüklenirken hata:', error);
      toast.error('Şablon yüklenemedi');
    }
  };

  // Şablon kullanım sayısını güncelle
  const updateTemplateUsage = async (templateId: string) => {
    try {
      // Önce mevcut kullanım sayısını al
      const { data: template } = await supabase
        .from('workflow_templates')
        .select('usage_count')
        .eq('id', templateId)
        .single();

      if (template) {
        // Kullanım sayısını artır
        await supabase
          .from('workflow_templates')
          .update({ usage_count: (template.usage_count || 0) + 1 })
          .eq('id', templateId);
      }
    } catch (error) {
      console.error('Şablon kullanım sayısı güncellenirken hata:', error);
    }
  };

  // Tutorial adımları
  const tutorialSteps = [
    {
      title: "Workflow Builder'a Hoş Geldiniz! 🎉",
      content: "Bu araç ile görsel iş akışları oluşturabilirsiniz. Adım adım nasıl kullanacağınızı öğrenelim.",
      position: "center"
    },
    {
      title: "1. Node Tipleri",
      content: "Sol panelde farklı node tipleri bulunur. Bunları canvas'a sürükleyip bırakarak workflow oluşturabilirsiniz.",
      position: "left"
    },
    {
      title: "2. Tool Modları",
      content: "Üst panelde 3 farklı mod var: Seçim (node seçme), Bağlantı (node'ları bağlama), Kaydırma (canvas'ı hareket ettirme).",
      position: "top"
    },
    {
      title: "3. Zoom Kontrolleri",
      content: "Zoom in/out butonları ile canvas'ı yakınlaştırıp uzaklaştırabilirsiniz.",
      position: "top"
    },
    {
      title: "4. Node Ekleme",
      content: "Node'ları sidebar'dan sürükleyip canvas'a bırakın. Veya şablonlardan hazır workflow'lar kullanın.",
      position: "center"
    },
    {
      title: "5. Bağlantı Oluşturma",
      content: "Bağlantı modunu seçin, bir node'a tıklayın, sonra başka bir node'a tıklayarak bağlantı oluşturun.",
      position: "center"
    },
    {
      title: "6. Node Düzenleme",
      content: "Node'a çift tıklayarak veya seçip düzenle butonuna basarak ayarlarını değiştirebilirsiniz.",
      position: "center"
    },
    {
      title: "7. Kaydetme",
      content: "Workflow'nuzu tamamladıktan sonra Kaydet butonuna basarak veritabanına kaydedin.",
      position: "center"
    }
  ];

  // Tutorial kontrolleri
  const nextTutorialStep = () => {
    if (tutorialStep < tutorialSteps.length - 1) {
      setTutorialStep(tutorialStep + 1);
    } else {
      setTutorialCompleted(true);
      setShowTutorial(false);
      localStorage.setItem('workflow-tutorial-completed', 'true');
    }
  };

  const prevTutorialStep = () => {
    if (tutorialStep > 0) {
      setTutorialStep(tutorialStep - 1);
    }
  };

  const startTutorial = () => {
    setShowTutorial(true);
    setTutorialStep(0);
    setTutorialCompleted(false);
  };

  // Tutorial tamamlanma kontrolü
  useEffect(() => {
    const completed = localStorage.getItem('workflow-tutorial-completed');
    if (!completed) {
      setShowTutorial(true);
    }
  }, []);

  // Zoom kontrolleri
  const handleZoomIn = () => setZoom(prev => Math.min(prev + 0.1, 2));
  const handleZoomOut = () => setZoom(prev => Math.max(prev - 0.1, 0.5));
  const handleResetZoom = () => setZoom(1);

  // Mouse event handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      if (toolMode === 'pan') {
        setIsDragging(true);
        setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
      } else if (toolMode === 'connect' && connectionStart) {
        // Bağlantı modunda canvas'a tıklandığında bağlantıyı iptal et
        setConnectionStart(null);
        setIsConnecting(false);
        setConnectionPreview(null);
        toast('Bağlantı iptal edildi.');
      }
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging && toolMode === 'pan') {
      setPan({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y
      });
    }

    // Mouse pozisyonunu güncelle
    const rect = canvasRef.current?.getBoundingClientRect();
    if (rect) {
      const x = (e.clientX - rect.left - pan.x) / zoom;
      const y = (e.clientY - rect.top - pan.y) / zoom;
      setMousePosition({ x, y });
    }

    // Bağlantı önizlemesi - Bağlantı modunda otomatik çizgi göster
    if (toolMode === 'connect' && connectionStart) {
      setConnectionPreview({
        start: getNodePosition(connectionStart),
        end: mousePosition
      });
    } else if (toolMode === 'connect' && !connectionStart) {
      // Bağlantı modunda ama henüz başlangıç node'u seçilmemişse, mouse pozisyonunu takip et
      setConnectionPreview(null);
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    setDraggedNode(null);
  };

  // Node pozisyonunu al
  const getNodePosition = (nodeId: string) => {
    const node = selectedWorkflow?.workflow_data.nodes.find(n => n.id === nodeId);
    return node?.position || { x: 0, y: 0 };
  };

  // Node'a tıklama
  const handleNodeClick = (nodeId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    
    if (toolMode === 'connect') {
      if (!connectionStart) {
        // İlk node'a tıklandığında bağlantı başlat
        setConnectionStart(nodeId);
        setIsConnecting(true);
        toast.success('Bağlantı başlatıldı. Hedef node\'a tıklayın.');
      } else if (connectionStart !== nodeId) {
        // İkinci node'a tıklandığında bağlantıyı tamamla
        createConnection(connectionStart, nodeId);
        setConnectionStart(null);
        setIsConnecting(false);
        setConnectionPreview(null);
        toast.success('Bağlantı oluşturuldu!');
      } else {
        // Aynı node'a tekrar tıklandığında bağlantıyı iptal et
        setConnectionStart(null);
        setIsConnecting(false);
        setConnectionPreview(null);
        toast('Bağlantı iptal edildi.');
      }
    } else {
      setSelectedNode(nodeId);
      setShowNodeConfig(nodeId);
    }
  };

  // Node sürükleme başlat
  const handleNodeDragStart = (nodeId: string, e: React.MouseEvent) => {
    if (toolMode !== 'select') return;
    
    e.stopPropagation();
    setDraggedNode(nodeId);
    const rect = e.currentTarget.getBoundingClientRect();
    setDragOffset({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    });
  };

  // Node sürükleme
  const handleNodeDrag = (e: React.MouseEvent) => {
    if (!draggedNode || !selectedWorkflow) return;

    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;

    const newX = (e.clientX - rect.left - pan.x - dragOffset.x) / zoom;
    const newY = (e.clientY - rect.top - pan.y - dragOffset.y) / zoom;

    moveNode(draggedNode, { x: newX, y: newY });
  };

  // Node'a çift tıklama
  const handleNodeDoubleClick = (nodeId: string) => {
    setShowNodeConfig(nodeId);
    toast.success('Node konfigürasyonu açıldı');
  };

  // Bağlantı çizimi
  const drawConnections = useCallback(() => {
    const canvas = connectionCanvasRef.current;
    if (!canvas || !selectedWorkflow) {
      console.log('Canvas veya workflow yok:', { canvas: !!canvas, workflow: !!selectedWorkflow });
      return;
    }

    const ctx = canvas.getContext('2d');
    if (!ctx) {
      console.log('Canvas context alınamadı');
      return;
    }

    // Canvas boyutunu kontrol et ve ayarla
    const rect = canvas.getBoundingClientRect();
    console.log('Canvas rect:', rect);
    
    // Canvas boyutunu her zaman güncelle
    canvas.width = rect.width;
    canvas.height = rect.height;
    console.log('Canvas boyutu ayarlandı:', { width: canvas.width, height: canvas.height });

    // Node'ların position bilgilerini kontrol et ve düzelt
    const validNodes = selectedWorkflow.workflow_data.nodes.map(node => {
      if (!node.position) {
        console.warn(`Node ${node.id} için position undefined, varsayılan değer atanıyor`);
        return { ...node, position: { x: Math.random() * 400, y: Math.random() * 300 } };
      }
      return node;
    });

    // Eğer position undefined olan node'lar varsa, workflow state'ini güncelle
    const hasInvalidNodes = selectedWorkflow.workflow_data.nodes.some(node => !node.position);
    if (hasInvalidNodes) {
      console.log('Position undefined olan node\'lar düzeltiliyor...');
      setSelectedWorkflow(prev => prev ? {
        ...prev,
        workflow_data: {
          ...prev.workflow_data,
          nodes: validNodes
        }
      } : null);
    }

    console.log('Bağlantılar çiziliyor:', selectedWorkflow.workflow_data.connections);
    console.log('Node sayısı:', validNodes.length);

    // Canvas'ı temizle
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    

    
    // Transform'u doğru şekilde uygula
    ctx.save();
    // Canvas'ın kendi koordinat sistemine göre transform uygula
    ctx.translate(pan.x, pan.y);
    ctx.scale(zoom, zoom);
    
    console.log('Transform uygulandı:', { pan: pan, zoom: zoom });

         // Bağlantıları çiz - N8n tarzında
     selectedWorkflow.workflow_data.connections.forEach((connection, index) => {
       const sourceNode = validNodes.find(n => n.id === connection.source);
       const targetNode = validNodes.find(n => n.id === connection.target);
       
       // Node'ların varlığını ve position bilgilerini kontrol et
       if (!sourceNode || !targetNode || !sourceNode.position || !targetNode.position) {
         console.warn(`Bağlantı ${index} için geçersiz node:`, { sourceNode, targetNode });
         return;
       }
       
       // Node boyutları
       const nodeWidth = 192; // w-48 = 12rem = 192px
       const nodeHeight = 48;  // h-12 = 3rem = 48px
       
       // Bağlantı başlangıç noktası (kaynak node'un sağ tarafı)
       const startX = sourceNode.position.x + nodeWidth;
       const startY = sourceNode.position.y + nodeHeight / 2;
       
       // Bağlantı bitiş noktası (hedef node'un sol tarafı)
       const endX = targetNode.position.x;
       const endY = targetNode.position.y + nodeHeight / 2;
       
       console.log(`Bağlantı koordinatları:`, { startX, startY, endX, endY });
       
               // N8n tarzında düzenli çizgi çiz - ortogonal (dik açılı) çizgiler
        ctx.strokeStyle = '#6366f1'; // İndigo renk (N8n tarzı)
        ctx.lineWidth = 2;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        
        // Ortogonal çizgi hesaplama (N8n tarzı)
        const midX = (startX + endX) / 2;
        
        ctx.beginPath();
        ctx.moveTo(startX, startY);
        ctx.lineTo(midX, startY); // Yatay çizgi
        ctx.lineTo(midX, endY);   // Dikey çizgi
        ctx.lineTo(endX, endY);   // Yatay çizgi
        ctx.stroke();
       
       console.log('N8n tarzı çizgi çizildi:', { startX, startY, endX, endY, color: ctx.strokeStyle, width: ctx.lineWidth });

       // N8n tarzında küçük nokta (bağlantı noktası)
       const dotRadius = 3;
       ctx.fillStyle = '#6366f1';
       ctx.beginPath();
       ctx.arc(startX, startY, dotRadius, 0, 2 * Math.PI);
       ctx.fill();
       
       // Hedef noktada da küçük nokta
       ctx.beginPath();
       ctx.arc(endX, endY, dotRadius, 0, 2 * Math.PI);
       ctx.fill();
       
       console.log(`Bağlantı ${index} çizildi - N8n tarzı çizgi ve noktalar`);
     });

         // Bağlantı önizlemesi - N8n tarzında
     if (connectionPreview) {
       const nodeWidth = 192;
       const nodeHeight = 48;
       
               // N8n tarzında kesikli çizgi önizlemesi - ortogonal
        ctx.strokeStyle = '#6366f1';
        ctx.lineWidth = 2;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.setLineDash([6, 6]);
        
        const previewStartX = connectionPreview.start.x + nodeWidth;
        const previewStartY = connectionPreview.start.y + nodeHeight / 2;
        const previewEndX = connectionPreview.end.x;
        const previewEndY = connectionPreview.end.y + nodeHeight / 2;
        const previewMidX = (previewStartX + previewEndX) / 2;
        
        ctx.beginPath();
        ctx.moveTo(previewStartX, previewStartY);
        ctx.lineTo(previewMidX, previewStartY); // Yatay çizgi
        ctx.lineTo(previewMidX, previewEndY);   // Dikey çizgi
        ctx.lineTo(previewEndX, previewEndY);   // Yatay çizgi
        ctx.stroke();
        ctx.setLineDash([]);

               // Önizleme noktaları (değişkenler zaten tanımlanmış)
       
       // Başlangıç noktası
       const dotRadius = 3;
       ctx.fillStyle = '#6366f1';
       ctx.beginPath();
       ctx.arc(previewStartX, previewStartY, dotRadius, 0, 2 * Math.PI);
       ctx.fill();
       
       // Hedef noktası
       ctx.beginPath();
       ctx.arc(previewEndX, previewEndY, dotRadius, 0, 2 * Math.PI);
       ctx.fill();
     }

    ctx.restore();
  }, [selectedWorkflow, pan.x, pan.y, zoom, connectionPreview]);

  useEffect(() => {
    console.log('drawConnections useEffect tetiklendi');
    console.log('Bağlantı sayısı:', selectedWorkflow?.workflow_data.connections.length);
    drawConnections();
  }, [drawConnections, selectedWorkflow?.workflow_data.connections, selectedWorkflow?.workflow_data.nodes]);

  // Bağlantı değişikliklerini izle ve çiz
  useEffect(() => {
    if (selectedWorkflow && selectedWorkflow.workflow_data.connections.length > 0) {
      console.log('Bağlantı değişikliği algılandı, yeniden çiziliyor...');
      setTimeout(() => {
        drawConnections();
      }, 100);
    }
  }, [selectedWorkflow?.workflow_data.connections.length]);

  // Cache temizleme ve yeniden çizim
  useEffect(() => {
    if (selectedWorkflow) {
      console.log('Workflow değişti, cache temizleniyor ve yeniden çiziliyor...');
      // Canvas'ı temizle
      const canvas = connectionCanvasRef.current;
      if (canvas) {
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.clearRect(0, 0, canvas.width, canvas.height);
        }
      }
      // Yeniden çiz
      setTimeout(() => {
        drawConnections();
      }, 50);
    }
  }, [selectedWorkflow?.id]);

  // Canvas boyutunu güncelle
  useEffect(() => {
    const canvas = connectionCanvasRef.current;
    if (!canvas) return;

    const updateCanvasSize = () => {
      const parent = canvas.parentElement;
      if (parent) {
        const rect = parent.getBoundingClientRect();
        
        // Canvas boyutunu ayarla
        canvas.width = rect.width;
        canvas.height = rect.height;
        
        console.log('Canvas boyutu ayarlandı:', { width: canvas.width, height: canvas.height });
        
        // Canvas güncellendikten sonra bağlantıları yeniden çiz
        setTimeout(() => {
          drawConnections();
        }, 50);
      }
    };

    // İlk boyutlandırma
    updateCanvasSize();

    // ResizeObserver ile boyut değişikliklerini izle
    const resizeObserver = new ResizeObserver(updateCanvasSize);
    resizeObserver.observe(canvas.parentElement!);

    return () => {
      resizeObserver.disconnect();
    };
  }, [drawConnections]);



  // Node'u sidebar'dan sürükle
  const handleNodeDragFromSidebar = (nodeType: string, e: React.DragEvent) => {
    e.preventDefault();
    const rect = canvasRef.current?.getBoundingClientRect();
    if (rect) {
      const x = (e.clientX - rect.left - pan.x) / zoom;
      const y = (e.clientY - rect.top - pan.y) / zoom;
      addNode(nodeType, { x, y });
    }
  };



  return (
    <div className="h-screen bg-gray-50 dark:bg-gray-900 flex flex-col">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Workflow Builder
            </h1>
                         <div className="flex items-center space-x-2">
               <button
                 onClick={createNewWorkflow}
                 className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
               >
                 <Plus size={16} />
                 <span>Yeni Workflow</span>
               </button>
                               <button
                  onClick={() => {
                    setShowTemplates(true);
                    fetchTemplates(); // Şablonları yeniden yükle
                    console.log('Şablon modal açılıyor, mevcut şablonlar:', templates);
                  }}
                  className="flex items-center space-x-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                >
                  <Grid3X3 size={16} />
                  <span>Şablonlar</span>
                </button>
               <button
                 onClick={startTutorial}
                 className="flex items-center space-x-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
               >
                 <HelpCircle size={16} />
                 <span>Tutorial</span>
               </button>

             </div>
          </div>
          
          <div className="flex items-center space-x-4">
            {/* Feedback Button */}
            <FeedbackButton 
              pageSource="workflow-builder" 
              position="inline"
              className="inline-flex items-center px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-medium"
            />
            {/* Tool Mode Selector - Fotoğrafta gösterilen araç çubuğu */}
                         <div className="flex items-center space-x-1 bg-gray-100 dark:bg-gray-700 rounded-xl p-1">
               <button
                 onClick={() => {
                   setToolMode('select');
                   setSelectedNode(null);
                   setIsConnecting(false);
                   setConnectionStart(null);
                   setConnectionPreview(null);
                   toast.success('Seçim modu aktif');
                 }}
                 className={`p-2 rounded-lg transition-all duration-200 ${
                   toolMode === 'select' 
                     ? 'bg-white dark:bg-gray-600 shadow-lg scale-105' 
                     : 'hover:bg-gray-200 dark:hover:bg-gray-600 hover:scale-105'
                 }`}
                 title="Seçim Modu - Node'ları seç ve düzenle"
               >
                 <MousePointer size={16} className={toolMode === 'select' ? 'text-indigo-600' : 'text-gray-600'} />
               </button>
               <button
                 onClick={() => {
                   setToolMode('connect');
                   setSelectedNode(null);
                   toast.success('Bağlantı modu aktif - Node\'ları bağlamak için tıklayın');
                 }}
                 className={`p-2 rounded-lg transition-all duration-200 ${
                   toolMode === 'connect' 
                     ? 'bg-white dark:bg-gray-600 shadow-lg scale-105' 
                     : 'hover:bg-gray-200 dark:hover:bg-gray-600 hover:scale-105'
                 }`}
                 title="Bağlantı Modu - Node'ları birbirine bağla"
               >
                 <Link size={16} className={toolMode === 'connect' ? 'text-indigo-600' : 'text-gray-600'} />
               </button>
               <button
                 onClick={() => {
                   setToolMode('pan');
                   setSelectedNode(null);
                   setIsConnecting(false);
                   setConnectionStart(null);
                   setConnectionPreview(null);
                   toast.success('Kaydırma modu aktif - Canvas\'ı sürükleyin');
                 }}
                 className={`p-2 rounded-lg transition-all duration-200 ${
                   toolMode === 'pan' 
                     ? 'bg-white dark:bg-gray-600 shadow-lg scale-105' 
                     : 'hover:bg-gray-200 dark:hover:bg-gray-600 hover:scale-105'
                 }`}
                 title="Kaydırma Modu - Canvas'ı sürükle ve kaydır"
               >
                 <Hand size={16} className={toolMode === 'pan' ? 'text-indigo-600' : 'text-gray-600'} />
               </button>
             </div>

                         {/* Zoom Controls - N8n tarzında */}
             <div className="flex items-center space-x-2 bg-gray-100 dark:bg-gray-700 rounded-xl p-1">
               <button
                 onClick={() => {
                   handleZoomOut();
                   toast.success(`Zoom: ${Math.round((zoom - 0.1) * 100)}%`);
                 }}
                 className="p-2 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-all duration-200 hover:scale-105"
                 title="Yakınlaştır"
               >
                 <ZoomOut size={16} className="text-gray-600" />
               </button>
               <span className="px-3 text-sm font-medium text-gray-700 dark:text-gray-300 min-w-[50px] text-center">
                 {Math.round(zoom * 100)}%
               </span>
               <button
                 onClick={() => {
                   handleZoomIn();
                   toast.success(`Zoom: ${Math.round((zoom + 0.1) * 100)}%`);
                 }}
                 className="p-2 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-all duration-200 hover:scale-105"
                 title="Uzaklaştır"
               >
                 <ZoomIn size={16} className="text-gray-600" />
               </button>
               <button
                 onClick={() => {
                   handleResetZoom();
                   toast.success('Zoom sıfırlandı');
                 }}
                 className="p-2 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-all duration-200 hover:scale-105"
                 title="Zoom'u Sıfırla"
               >
                 <RotateCcw size={16} className="text-gray-600" />
               </button>
             </div>

            {/* Action Buttons */}
            {selectedWorkflow && (
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => {
                    saveWorkflow();
                    toast.success('Workflow başarıyla kaydedildi!');
                  }}
                  className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-all duration-200 hover:scale-105 shadow-lg"
                  title="Workflow'u kaydet"
                >
                  <Save size={16} />
                  <span>Kaydet</span>
                </button>
                <button
                  onClick={() => {
                    setShowSettings(true);
                    toast.success('Ayarlar paneli açıldı');
                  }}
                  className="flex items-center space-x-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-all duration-200 hover:scale-105 shadow-lg"
                  title="Workflow ayarlarını düzenle"
                >
                  <Settings size={16} />
                  <span>Ayarlar</span>
                </button>
                                 <button
                   onClick={async () => {
                     try {
                       if (selectedWorkflow) {
                         await executeWorkflow(selectedWorkflow, {
                           customer: { name: 'Test Müşteri', email: 'test@example.com' },
                           ticket: { id: 'TICKET-001', priority: 'high', status: 'open' },
                           amount: 1500
                         });
                       }
                   } catch (error) {
                     console.error('Workflow çalıştırma hatası:', error);
                   }
                   }}
                   className="flex items-center space-x-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-all duration-200 hover:scale-105 shadow-lg"
                   title="Workflow'u test et"
                 >
                   <PlayCircle size={16} />
                   <span>Test Et</span>
                 </button>
                 <button
                   onClick={() => {
                     if (selectedWorkflow.status === 'active') {
                       setSelectedWorkflow({
                         ...selectedWorkflow,
                         status: 'inactive'
                       });
                       toast.success('Workflow pasif hale getirildi');
                     } else {
                       setSelectedWorkflow({
                         ...selectedWorkflow,
                         status: 'active'
                       });
                       toast.success('Workflow aktif hale getirildi');
                     }
                   }}
                   className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-all duration-200 hover:scale-105 shadow-lg ${
                     selectedWorkflow.status === 'active'
                       ? 'bg-red-600 text-white hover:bg-red-700'
                       : 'bg-blue-600 text-white hover:bg-blue-700'
                   }`}
                   title={selectedWorkflow.status === 'active' ? 'Workflow\'u pasif hale getir' : 'Workflow\'u aktif hale getir'}
                 >
                   {selectedWorkflow.status === 'active' ? (
                     <>
                       <Pause size={16} />
                       <span>Durdur</span>
                     </>
                   ) : (
                     <>
                       <Play size={16} />
                       <span>Başlat</span>
                     </>
                   )}
                 </button>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="flex-1 flex">
        {/* Sidebar */}
        <div className="w-80 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 p-4 overflow-y-auto">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Node Tipleri
          </h2>
          
                     <div className="space-y-3">
             {nodeTypes.map((nodeType) => (
               <div key={nodeType.type} className="space-y-2">
                 {/* Ana node tipi */}
                 <div
                   draggable
                   onDragStart={(e) => {
                     e.dataTransfer.setData('nodeType', nodeType.type);
                   }}
                   className="bg-white dark:bg-gray-800 rounded-xl p-4 cursor-move hover:bg-gray-50 dark:hover:bg-gray-700 transition-all duration-200 border border-gray-200 dark:border-gray-600 hover:border-indigo-300 dark:hover:border-indigo-400 hover:shadow-sm"
                 >
                   <div className="flex items-center space-x-3">
                     <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${nodeType.color} shadow-sm`}>
                       {React.createElement(nodeType.icon, { className: "w-4 h-4 text-white" })}
                     </div>
                     <div>
                       <h3 className="font-medium text-gray-900 dark:text-white">
                         {nodeType.label}
                       </h3>
                       <p className="text-sm text-gray-500 dark:text-gray-400">
                         {nodeType.description}
                       </p>
                     </div>
                   </div>
                 </div>

                 {/* Alt tipler */}
                 {nodeType.triggers && (
                   <div className="ml-4 space-y-1">
                     {nodeType.triggers.map((trigger) => (
                       <div
                         key={trigger.id}
                         draggable
                         onDragStart={(e) => {
                           e.dataTransfer.setData('nodeType', nodeType.type);
                           e.dataTransfer.setData('subType', trigger.id);
                         }}
                         className="bg-gray-50 dark:bg-gray-700 rounded-lg p-2 cursor-move hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors border border-gray-200 dark:border-gray-600"
                       >
                         <div className="flex items-center space-x-2">
                           <div className={`w-6 h-6 rounded flex items-center justify-center ${nodeType.color} shadow-sm`}>
                             {React.createElement(trigger.icon, { className: "w-3 h-3 text-white" })}
                           </div>
                           <span className="text-sm text-gray-700 dark:text-gray-300">
                             {trigger.label}
                           </span>
                         </div>
                       </div>
                     ))}
                   </div>
                 )}

                 {nodeType.actions && (
                   <div className="ml-4 space-y-1">
                     {nodeType.actions.map((action) => (
                       <div
                         key={action.id}
                         draggable
                         onDragStart={(e) => {
                           e.dataTransfer.setData('nodeType', nodeType.type);
                           e.dataTransfer.setData('subType', action.id);
                         }}
                         className="bg-gray-50 dark:bg-gray-700 rounded-lg p-2 cursor-move hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors border border-gray-200 dark:border-gray-600"
                       >
                         <div className="flex items-center space-x-2">
                           <div className={`w-6 h-6 rounded flex items-center justify-center ${nodeType.color} shadow-sm`}>
                             {React.createElement(action.icon, { className: "w-3 h-3 text-white" })}
                           </div>
                           <span className="text-sm text-gray-700 dark:text-gray-300">
                             {action.label}
                           </span>
                         </div>
                       </div>
                     ))}
                   </div>
                 )}

                 {nodeType.conditions && (
                   <div className="ml-4 space-y-1">
                     {nodeType.conditions.map((condition) => (
                       <div
                         key={condition.id}
                         draggable
                         onDragStart={(e) => {
                           e.dataTransfer.setData('nodeType', nodeType.type);
                           e.dataTransfer.setData('subType', condition.id);
                         }}
                         className="bg-gray-50 dark:bg-gray-700 rounded-lg p-2 cursor-move hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors border border-gray-200 dark:border-gray-600"
                       >
                         <div className="flex items-center space-x-2">
                           <div className={`w-6 h-6 rounded flex items-center justify-center ${nodeType.color} shadow-sm`}>
                             {React.createElement(condition.icon, { className: "w-3 h-3 text-white" })}
                           </div>
                           <span className="text-sm text-gray-700 dark:text-gray-300">
                             {condition.label}
                           </span>
                         </div>
                       </div>
                     ))}
                   </div>
                 )}
               </div>
             ))}
           </div>

          {/* Workflow Listesi */}
          {!isEditing && (
            <div className="mt-8">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Workflow'lar
              </h3>
              <div className="space-y-2">
                {workflows.map((workflow) => (
                  <div
                    key={workflow.id}
                    onClick={() => {
                      setSelectedWorkflow(workflow);
                      setIsEditing(true);
                    }}
                    className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
                  >
                    <h4 className="font-medium text-gray-900 dark:text-white">
                      {workflow.name}
                    </h4>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {workflow.description}
                    </p>
                    <div className="flex items-center justify-between mt-2">
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        workflow.status === 'active' ? 'bg-green-100 text-green-800' :
                        workflow.status === 'draft' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {workflow.status}
                      </span>
                      <span className="text-xs text-gray-500">
                        {workflow.workflow_data.nodes.length} node
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Main Canvas */}
        <div className="flex-1 relative overflow-hidden">
          {/* Connection Canvas - Parent container'ın dışında */}
          <canvas
            ref={connectionCanvasRef}
            className="absolute inset-0 pointer-events-none"
            style={{ 
              zIndex: 9999,
              imageRendering: '-webkit-optimize-contrast',
              backgroundColor: 'transparent',
              width: '100%',
              height: '100%',
              display: 'block',
              position: 'absolute',
              top: 0,
              left: 0,
              opacity: 1
            }}
          />
          

          
          <div
            ref={canvasRef}
            className={`w-full h-full relative ${
              toolMode === 'connect' ? 'cursor-crosshair' : 
              toolMode === 'pan' ? 'cursor-grab' : 
              'cursor-default'
            }`}
             style={{
               backgroundImage: `
                 linear-gradient(rgba(0,0,0,0.1) 1px, transparent 1px),
                 linear-gradient(90deg, rgba(0,0,0,0.1) 1px, transparent 1px)
               `,
               backgroundSize: '20px 20px',
               transform: `scale(${zoom}) translate(${pan.x / zoom}px, ${pan.y / zoom}px)`,
               transformOrigin: '0 0',
               position: 'relative'
             }}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onDragOver={(e) => e.preventDefault()}
                         onDrop={(e) => {
               e.preventDefault();
               const nodeType = e.dataTransfer.getData('nodeType');
               const subType = e.dataTransfer.getData('subType');
               if (nodeType) {
                 const rect = canvasRef.current?.getBoundingClientRect();
                 if (rect) {
                   const x = (e.clientX - rect.left - pan.x) / zoom;
                   const y = (e.clientY - rect.top - pan.y) / zoom;
                   addNode(nodeType, { x, y }, subType || undefined);
                 }
               }
             }}
          >
                         {/* Debug bilgisi */}
             {selectedWorkflow && (
               <div className="absolute top-4 left-4 bg-red-500 text-white p-2 rounded text-xs z-50">
                 <div>Node Sayısı: {selectedWorkflow.workflow_data.nodes.length}</div>
                 <div>Bağlantı Sayısı: {selectedWorkflow.workflow_data.connections.length}</div>
                 <div>Zoom: {zoom}</div>
                 <div>Pan: ({pan.x}, {pan.y})</div>
                 <div>Canvas Transform: scale({zoom}) translate({pan.x / zoom}px, {pan.y / zoom}px)</div>
                 <div>Canvas Boyutu: {connectionCanvasRef.current?.width || 0} x {connectionCanvasRef.current?.height || 0}</div>
                 <div>Canvas Görünür: {connectionCanvasRef.current ? 'EVET' : 'HAYIR'}</div>
                 <div>Canvas Style: {connectionCanvasRef.current?.style.display || 'N/A'}</div>
                 <div>Canvas Opacity: {connectionCanvasRef.current?.style.opacity || 'N/A'}</div>
                 <div>Canvas Z-Index: {connectionCanvasRef.current?.style.zIndex || 'N/A'}</div>
                 <div>Node Pozisyonları:</div>
                 {selectedWorkflow.workflow_data.nodes.map((node, index) => (
                   <div key={node.id} className="text-xs">
                     Node {index}: ({node.position?.x || 0}, {node.position?.y || 0})
                   </div>
                 ))}
                 <div>Bağlantılar:</div>
                 {selectedWorkflow.workflow_data.connections.map((conn, index) => (
                   <div key={conn.id} className="text-xs">
                     Bağlantı {index}: {conn.source} → {conn.target}
                   </div>
                 ))}
               </div>
             )}

            {/* Nodes */}
            {selectedWorkflow?.workflow_data.nodes.map((node) => {
              const nodeType = nodeTypes.find(nt => nt.type === node.type);
              const isSelected = selectedNode === node.id;
              const isConnecting = connectionStart === node.id;

              // Node position kontrolü ve varsayılan değer atama
              const nodePosition = node.position || { x: Math.random() * 400, y: Math.random() * 300 };

              return (
                                 <div
                   key={node.id}
                   className={`absolute w-48 h-12 rounded-xl border-2 cursor-pointer transition-all duration-200 ${
                     isSelected 
                       ? 'border-indigo-500 shadow-lg shadow-indigo-500/25' 
                       : isConnecting
                       ? 'border-green-500 shadow-lg shadow-green-500/25'
                       : 'border-gray-200 dark:border-gray-600 hover:border-indigo-300 dark:hover:border-indigo-400'
                   } bg-white dark:bg-gray-800 hover:shadow-md`}
                   style={{
                     left: nodePosition.x,
                     top: nodePosition.y,
                     zIndex: isSelected ? 100 : 50,
                     transform: `translateZ(0)`
                   }}
                   onClick={(e) => handleNodeClick(node.id, e)}
                   onDoubleClick={() => handleNodeDoubleClick(node.id)}
                   onMouseDown={(e) => handleNodeDragStart(node.id, e)}
                   onMouseMove={handleNodeDrag}
                 >
                   <div className="flex items-center h-full px-3">
                     <div className={`w-6 h-6 rounded-lg flex items-center justify-center ${nodeType?.color} mr-2 shadow-sm`}>
                       {nodeType?.icon && React.createElement(nodeType.icon, { className: "w-3 h-3 text-white" })}
                     </div>
                     <span className="text-sm font-medium text-gray-900 dark:text-white truncate">
                       {node.data?.label || 'Node'}
                     </span>
                   </div>

                                     {/* Node Controls - N8n tarzında */}
                   {isSelected && (
                     <div className="absolute -top-10 left-0 right-0 flex justify-center space-x-2">
                       <button
                         onClick={(e) => {
                           e.stopPropagation();
                           setShowNodeConfig(node.id);
                         }}
                         className="p-1.5 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600 shadow-sm transition-colors"
                         title="Düzenle"
                       >
                         <Edit size={12} />
                       </button>
                       <button
                         onClick={(e) => {
                           e.stopPropagation();
                           deleteNode(node.id);
                         }}
                         className="p-1.5 bg-red-500 text-white rounded-lg hover:bg-red-600 shadow-sm transition-colors"
                         title="Sil"
                       >
                         <Trash2 size={12} />
                       </button>
                     </div>
                   )}
                </div>
              );
            })}
          </div>

          {/* Status Bar */}
          <div className="absolute bottom-0 left-0 right-0 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 p-3">
            <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400">
              <div className="flex items-center space-x-6">
                <div className="flex items-center space-x-2">
                  <div className={`w-3 h-3 rounded-full ${
                    toolMode === 'select' ? 'bg-blue-500' : 
                    toolMode === 'connect' ? 'bg-green-500' : 
                    'bg-orange-500'
                  }`}></div>
                  <span className="font-medium">
                    {toolMode === 'select' ? 'Seçim Modu' : 
                     toolMode === 'connect' ? 'Bağlantı Modu' : 
                     'Kaydırma Modu'}
                  </span>
                </div>
                <div className="flex items-center space-x-4">
                  <span className="flex items-center space-x-1">
                    <ZoomIn size={14} />
                    <span>{Math.round(zoom * 100)}%</span>
                  </span>
                  <span className="flex items-center space-x-1">
                    <GitBranch size={14} />
                    <span>{selectedWorkflow?.workflow_data.nodes.length || 0} Node</span>
                  </span>
                  <span className="flex items-center space-x-1">
                    <Link size={14} />
                    <span>{selectedWorkflow?.workflow_data.connections.length || 0} Bağlantı</span>
                  </span>
                  {selectedWorkflow && (
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      selectedWorkflow.status === 'active' ? 'bg-green-100 text-green-800' :
                      selectedWorkflow.status === 'draft' ? 'bg-yellow-100 text-yellow-800' :
                      selectedWorkflow.status === 'inactive' ? 'bg-gray-100 text-gray-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {selectedWorkflow.status === 'active' ? 'Aktif' :
                       selectedWorkflow.status === 'draft' ? 'Taslak' :
                       selectedWorkflow.status === 'inactive' ? 'Pasif' :
                       'Arşivlenmiş'}
                    </span>
                  )}
                </div>
              </div>
              <div className="flex items-center space-x-4">
                <span className="font-mono text-xs">
                  X: {Math.round(mousePosition.x)}, Y: {Math.round(mousePosition.y)}
                </span>
                {selectedWorkflow && (
                  <span className="text-xs text-gray-500">
                    Son güncelleme: {selectedWorkflow.updated_at ? 
                      new Date(selectedWorkflow.updated_at).toLocaleString('tr-TR') : 
                      'Henüz kaydedilmedi'}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Templates Modal */}
      {showTemplates && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-4xl max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                Workflow Şablonları
              </h2>
              <button
                onClick={() => setShowTemplates(false)}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                <X size={24} />
              </button>
            </div>
            
                         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
               {templates.length > 0 ? (
                 templates.map((template) => (
                   <div
                     key={template.id}
                     onClick={() => useTemplate(template)}
                     className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
                   >
                     <h3 className="font-medium text-gray-900 dark:text-white mb-2">
                       {template.name}
                     </h3>
                     <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">
                       {template.description}
                     </p>
                     <div className="flex items-center justify-between">
                       <span className="text-xs text-gray-500">
                         {template.usage_count || 0} kullanım
                       </span>
                       <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                         {template.category}
                       </span>
                     </div>
                     <div className="mt-2 text-xs text-gray-400">
                       {template.template_data?.nodes?.length || 0} node, {template.template_data?.connections?.length || 0} bağlantı
                     </div>
                   </div>
                 ))
               ) : (
                 <div className="col-span-full text-center py-8">
                   <div className="text-gray-500 dark:text-gray-400 mb-4">
                     <Grid3X3 size={48} className="mx-auto mb-4" />
                     <h3 className="text-lg font-medium mb-2">Henüz şablon yok</h3>
                     <p className="text-sm">İlk şablonu oluşturmak için aşağıdaki butona tıklayın</p>
                   </div>
                   <button
                     onClick={createDefaultTemplates}
                     className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                   >
                     Varsayılan Şablonları Oluştur
                   </button>
                 </div>
               )}
             </div>
          </div>
        </div>
      )}

      {/* Node Configuration Modal */}
      {showNodeConfig && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                Node Konfigürasyonu
              </h2>
              <button
                onClick={() => setShowNodeConfig(null)}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                <X size={24} />
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Node Adı
                </label>
                <input
                  type="text"
                  value={selectedWorkflow?.workflow_data.nodes.find(n => n.id === showNodeConfig)?.data.label || ''}
                  onChange={(e) => {
                    if (!selectedWorkflow) return;
                    setSelectedWorkflow({
                      ...selectedWorkflow,
                      workflow_data: {
                        ...selectedWorkflow.workflow_data,
                        nodes: selectedWorkflow.workflow_data.nodes.map(node =>
                          node.id === showNodeConfig
                            ? { ...node, data: { ...node.data, label: e.target.value } }
                            : node
                        )
                      }
                    });
                  }}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>
              
              <div className="flex justify-end space-x-2">
                <button
                  onClick={() => setShowNodeConfig(null)}
                  className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
                >
                  İptal
                </button>
                <button
                  onClick={() => setShowNodeConfig(null)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Kaydet
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Workflow Settings Modal */}
      {showSettings && selectedWorkflow && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-2xl max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                Workflow Ayarları
              </h2>
              <button
                onClick={() => setShowSettings(false)}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                <X size={24} />
              </button>
            </div>
            
            <div className="space-y-6">
              {/* Temel Bilgiler */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Workflow Adı
                  </label>
                  <input
                    type="text"
                    value={selectedWorkflow.name}
                    onChange={(e) => setSelectedWorkflow({
                      ...selectedWorkflow,
                      name: e.target.value
                    })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Kategori
                  </label>
                  <select
                    value={selectedWorkflow.category}
                    onChange={(e) => setSelectedWorkflow({
                      ...selectedWorkflow,
                      category: e.target.value
                    })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  >
                    <option value="ticket">Talep Yönetimi</option>
                    <option value="customer">Müşteri Yönetimi</option>
                    <option value="payment">Ödeme Yönetimi</option>
                    <option value="notification">Bildirim</option>
                    <option value="approval">Onay Süreci</option>
                    <option value="automation">Otomasyon</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Açıklama
                </label>
                <textarea
                  value={selectedWorkflow.description}
                  onChange={(e) => setSelectedWorkflow({
                    ...selectedWorkflow,
                    description: e.target.value
                  })}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  placeholder="Workflow'un ne yaptığını açıklayın..."
                />
              </div>

              {/* Durum ve Versiyon */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Durum
                  </label>
                  <select
                    value={selectedWorkflow.status}
                    onChange={(e) => setSelectedWorkflow({
                      ...selectedWorkflow,
                      status: e.target.value as any
                    })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  >
                    <option value="draft">Taslak</option>
                    <option value="active">Aktif</option>
                    <option value="inactive">Pasif</option>
                    <option value="archived">Arşivlenmiş</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Versiyon
                  </label>
                  <input
                    type="number"
                    value={selectedWorkflow.version}
                    onChange={(e) => setSelectedWorkflow({
                      ...selectedWorkflow,
                      version: parseInt(e.target.value) || 1
                    })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Çalıştırma Sayısı
                  </label>
                  <input
                    type="number"
                    value={selectedWorkflow.execution_count}
                    onChange={(e) => setSelectedWorkflow({
                      ...selectedWorkflow,
                      execution_count: parseInt(e.target.value) || 0
                    })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>
              </div>

              {/* Tetikleyici Konfigürasyonu */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                  Tetikleyici Ayarları
                </h3>
                <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Tetikleyici Tipi
                      </label>
                      <select
                        value={selectedWorkflow.trigger_config?.type || ''}
                        onChange={(e) => setSelectedWorkflow({
                          ...selectedWorkflow,
                          trigger_config: {
                            ...selectedWorkflow.trigger_config,
                            type: e.target.value
                          }
                        })}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      >
                        <option value="">Seçiniz</option>
                        <option value="ticket_created">Talep Oluşturuldu</option>
                        <option value="status_changed">Durum Değişti</option>
                        <option value="priority_updated">Öncelik Güncellendi</option>
                        <option value="time_based">Zaman Bazlı</option>
                        <option value="webhook">Webhook</option>
                      </select>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Koşullar
                      </label>
                      <textarea
                        value={JSON.stringify(selectedWorkflow.trigger_config?.conditions || {}, null, 2)}
                        onChange={(e) => {
                          try {
                            const conditions = JSON.parse(e.target.value);
                            setSelectedWorkflow({
                              ...selectedWorkflow,
                              trigger_config: {
                                ...selectedWorkflow.trigger_config,
                                conditions
                              }
                            });
                          } catch (error) {
                            // JSON parse hatası durumunda değeri olduğu gibi bırak
                          }
                        }}
                        rows={3}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white font-mono text-sm"
                        placeholder='{"priority": "high", "status": "open"}'
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Değişkenler */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                  Workflow Değişkenleri
                </h3>
                <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                  <textarea
                    value={JSON.stringify(selectedWorkflow.variables || {}, null, 2)}
                    onChange={(e) => {
                      try {
                        const variables = JSON.parse(e.target.value);
                        setSelectedWorkflow({
                          ...selectedWorkflow,
                          variables
                        });
                      } catch (error) {
                        // JSON parse hatası durumunda değeri olduğu gibi bırak
                      }
                    }}
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white font-mono text-sm"
                    placeholder='{"timeout": 300, "retry_count": 3, "notification_email": "admin@example.com"}'
                  />
                </div>
              </div>

              {/* İstatistikler */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                  İstatistikler
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3">
                    <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                      {selectedWorkflow.workflow_data.nodes.length}
                    </div>
                    <div className="text-sm text-blue-600 dark:text-blue-400">Node</div>
                  </div>
                  
                  <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-3">
                    <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                      {selectedWorkflow.workflow_data.connections.length}
                    </div>
                    <div className="text-sm text-green-600 dark:text-green-400">Bağlantı</div>
                  </div>
                  
                  <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-3">
                    <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                      {selectedWorkflow.execution_count}
                    </div>
                    <div className="text-sm text-purple-600 dark:text-purple-400">Çalıştırma</div>
                  </div>
                  
                  <div className="bg-orange-50 dark:bg-orange-900/20 rounded-lg p-3">
                    <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                      v{selectedWorkflow.version}
                    </div>
                    <div className="text-sm text-orange-600 dark:text-orange-400">Versiyon</div>
                  </div>
                </div>
              </div>

              {/* Aksiyon Butonları */}
              <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200 dark:border-gray-600">
                <button
                  onClick={() => setShowSettings(false)}
                  className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
                >
                  İptal
                </button>
                <button
                  onClick={() => {
                    saveWorkflow();
                    setShowSettings(false);
                  }}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Kaydet ve Kapat
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tutorial Modal */}
      {showTutorial && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-2xl mx-4">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center">
                <PlayCircle className="w-8 h-8 mr-3 text-purple-600" />
                {tutorialSteps[tutorialStep].title}
              </h2>
              <button
                onClick={() => {
                  setShowTutorial(false);
                  localStorage.setItem('workflow-tutorial-completed', 'true');
                }}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                <X size={24} />
              </button>
            </div>
            
            <div className="mb-6">
              <p className="text-lg text-gray-700 dark:text-gray-300 leading-relaxed">
                {tutorialSteps[tutorialStep].content}
              </p>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  {tutorialStep + 1} / {tutorialSteps.length}
                </span>
                <div className="w-32 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                  <div 
                    className="bg-purple-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${((tutorialStep + 1) / tutorialSteps.length) * 100}%` }}
                  />
                </div>
              </div>
              
              <div className="flex items-center space-x-3">
                <button
                  onClick={prevTutorialStep}
                  disabled={tutorialStep === 0}
                  className="flex items-center space-x-2 px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ArrowLeft size={16} />
                  <span>Önceki</span>
                </button>
                
                <button
                  onClick={nextTutorialStep}
                  className="flex items-center space-x-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                >
                  <span>{tutorialStep === tutorialSteps.length - 1 ? 'Bitir' : 'Sonraki'}</span>
                  <ArrowRight size={16} />
                </button>
              </div>
            </div>

            {/* Tutorial Tips */}
            <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <h3 className="font-medium text-blue-900 dark:text-blue-200 mb-2">💡 İpucu:</h3>
              <p className="text-sm text-blue-700 dark:text-blue-300">
                {tutorialStep === 0 && "Workflow Builder ile iş süreçlerinizi görselleştirebilir ve otomatikleştirebilirsiniz."}
                {tutorialStep === 1 && "Node'ları sürükleyip bırakarak workflow oluşturmaya başlayın."}
                {tutorialStep === 2 && "Tool modları ile farklı işlemler yapabilirsiniz."}
                {tutorialStep === 3 && "Zoom kontrolleri ile büyük workflow'ları daha rahat görüntüleyebilirsiniz."}
                {tutorialStep === 4 && "Şablonlar ile hızlıca başlayabilir veya sıfırdan oluşturabilirsiniz."}
                {tutorialStep === 5 && "Bağlantılar ile node'lar arasındaki akışı tanımlayın."}
                {tutorialStep === 6 && "Node ayarlarını düzenleyerek özelleştirin."}
                {tutorialStep === 7 && "Workflow'nuzu kaydederek tekrar kullanabilirsiniz."}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default WorkflowBuilder;
