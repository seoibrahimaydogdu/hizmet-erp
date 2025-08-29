import React, { useState, useEffect, useCallback } from 'react';
import { 
  Plus, 
  Save, 
  Check, 
  X, 
  Clock, 
  Users, 
  UserCheck, 
  AlertCircle,
  FileText,
  Calendar,
  DollarSign,
  ShoppingCart,
  Briefcase,
  Settings,
  Eye,
  Edit,
  Trash2,
  Copy,
  Download,
  Upload,
  Filter,
  Search,
  MoreVertical,
  ChevronRight,
  ChevronDown,
  Star,
  StarOff,
  Bell,
  Mail,
  MessageSquare,
  GitBranch,
  RefreshCw,
  Play,
  Pause,
  RotateCcw
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { supabase } from '../lib/supabase';

interface ApprovalWorkflow {
  id?: string;
  name: string;
  description: string;
  workflow_type: 'sequential' | 'parallel' | 'conditional';
  status: 'active' | 'inactive' | 'archived';
  workflow_config: any;
  trigger_conditions: any;
  auto_approve_timeout: number;
  require_all_approvers: boolean;
  allow_delegate: boolean;
  max_delegation_level: number;
  created_by?: string;
  created_at?: string;
  updated_at?: string;
}

interface ApprovalStep {
  id?: string;
  approval_workflow_id?: string;
  step_order: number;
  step_name: string;
  step_type: 'approval' | 'review' | 'signature';
  approver_type: 'user' | 'role' | 'group' | 'dynamic';
  approver_config: any;
  conditions: any;
  timeout_hours: number;
  is_required: boolean;
  can_skip: boolean;
}

interface ApprovalRequest {
  id?: string;
  approval_workflow_id: string;
  request_type: string;
  request_data: any;
  requester_id: string;
  current_step_id?: string;
  status: 'pending' | 'approved' | 'rejected' | 'cancelled' | 'expired';
  priority: 'low' | 'normal' | 'high' | 'urgent';
  due_date?: string;
  started_at?: string;
  completed_at?: string;
  total_steps: number;
  completed_steps: number;
  created_at?: string;
  updated_at?: string;
}

interface ApprovalTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  template_config: any;
  is_public: boolean;
  usage_count: number;
}

const ApprovalWorkflows: React.FC = () => {
  const [workflows, setWorkflows] = useState<ApprovalWorkflow[]>([]);
  const [templates, setTemplates] = useState<ApprovalTemplate[]>([]);
  const [requests, setRequests] = useState<ApprovalRequest[]>([]);
  const [selectedWorkflow, setSelectedWorkflow] = useState<ApprovalWorkflow | null>(null);
  const [selectedRequest, setSelectedRequest] = useState<ApprovalRequest | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [showTemplates, setShowTemplates] = useState(false);
  const [showCreateRequest, setShowCreateRequest] = useState(false);
  const [activeTab, setActiveTab] = useState<'workflows' | 'requests' | 'templates'>('workflows');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');

  // Workflow'ları yükle
  const fetchWorkflows = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('approval_workflows')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setWorkflows(data || []);
    } catch (error) {
      console.error('Onay süreçleri yüklenirken hata:', error);
      toast.error('Onay süreçleri yüklenemedi');
    }
  }, []);

  // Şablonları yükle
  const fetchTemplates = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('approval_templates')
        .select('*')
        .order('usage_count', { ascending: false });

      if (error) throw error;
      setTemplates(data || []);
    } catch (error) {
      console.error('Şablonlar yüklenirken hata:', error);
      toast.error('Şablonlar yüklenemedi');
    }
  }, []);

  // Onay taleplerini yükle
  const fetchRequests = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('approval_requests')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setRequests(data || []);
    } catch (error) {
      console.error('Onay talepleri yüklenirken hata:', error);
      toast.error('Onay talepleri yüklenemedi');
    }
  }, []);

  useEffect(() => {
    fetchWorkflows();
    fetchTemplates();
    fetchRequests();
  }, [fetchWorkflows, fetchTemplates, fetchRequests]);

  // Yeni workflow oluştur
  const createNewWorkflow = () => {
    const newWorkflow: ApprovalWorkflow = {
      name: 'Yeni Onay Süreci',
      description: '',
      workflow_type: 'sequential',
      status: 'active',
      workflow_config: {},
      trigger_conditions: {},
      auto_approve_timeout: 24,
      require_all_approvers: false,
      allow_delegate: true,
      max_delegation_level: 1
    };
    setSelectedWorkflow(newWorkflow);
    setIsEditing(true);
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
        result = await supabase
          .from('approval_workflows')
          .update(workflowData)
          .eq('id', selectedWorkflow.id);
      } else {
        result = await supabase
          .from('approval_workflows')
          .insert([workflowData]);
      }

      if (result.error) throw result.error;

      toast.success('Onay süreci kaydedildi');
      fetchWorkflows();
      setIsEditing(false);
    } catch (error) {
      console.error('Onay süreci kaydedilirken hata:', error);
      toast.error('Onay süreci kaydedilemedi');
    }
  };

  // Şablon kullan
  const useTemplate = (template: ApprovalTemplate) => {
    const newWorkflow: ApprovalWorkflow = {
      name: `${template.name} - Kopya`,
      description: template.description,
      workflow_type: 'sequential',
      status: 'active',
      workflow_config: template.template_config,
      trigger_conditions: {},
      auto_approve_timeout: 24,
      require_all_approvers: false,
      allow_delegate: true,
      max_delegation_level: 1
    };
    setSelectedWorkflow(newWorkflow);
    setIsEditing(true);
    setShowTemplates(false);
  };

  // Filtrelenmiş veriler
  const filteredWorkflows = workflows.filter(workflow => {
    const matchesSearch = workflow.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         workflow.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || workflow.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const filteredRequests = requests.filter(request => {
    const matchesSearch = request.request_type.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || request.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="h-screen bg-gray-50 dark:bg-gray-900 flex flex-col">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Onay Süreçleri
            </h1>
            <div className="flex items-center space-x-2">
              <button
                onClick={createNewWorkflow}
                className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Plus size={16} />
                <span>Yeni Süreç</span>
              </button>
              <button
                onClick={() => setShowTemplates(true)}
                className="flex items-center space-x-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
              >
                <FileText size={16} />
                <span>Şablonlar</span>
              </button>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
              <input
                type="text"
                placeholder="Ara..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              <option value="all">Tümü</option>
              <option value="active">Aktif</option>
              <option value="inactive">Pasif</option>
              <option value="archived">Arşivlenmiş</option>
            </select>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="flex space-x-8 px-4">
          <button
            onClick={() => setActiveTab('workflows')}
            className={`py-3 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'workflows'
                ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
            }`}
          >
            Onay Süreçleri
          </button>
          <button
            onClick={() => setActiveTab('requests')}
            className={`py-3 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'requests'
                ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
            }`}
          >
            Onay Talepleri
          </button>
          <button
            onClick={() => setActiveTab('templates')}
            className={`py-3 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'templates'
                ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
            }`}
          >
            Şablonlar
          </button>
        </div>
      </div>

      <div className="flex-1 flex">
        {/* Main Content */}
        <div className="flex-1 p-6 overflow-y-auto">
          {activeTab === 'workflows' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredWorkflows.map((workflow) => (
                  <div
                    key={workflow.id}
                    className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 hover:shadow-md transition-shadow cursor-pointer"
                    onClick={() => setSelectedWorkflow(workflow)}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center space-x-2">
                        <div className={`w-3 h-3 rounded-full ${
                          workflow.status === 'active' ? 'bg-green-500' :
                          workflow.status === 'inactive' ? 'bg-yellow-500' : 'bg-gray-500'
                        }`}></div>
                        <span className="text-sm font-medium text-gray-900 dark:text-white">
                          {workflow.name}
                        </span>
                      </div>
                      <MoreVertical size={16} className="text-gray-400" />
                    </div>
                    
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                      {workflow.description || 'Açıklama yok'}
                    </p>
                    
                    <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                      <span className="capitalize">{workflow.workflow_type}</span>
                      <span>{workflow.auto_approve_timeout}h timeout</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'requests' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredRequests.map((request) => (
                  <div
                    key={request.id}
                    className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 hover:shadow-md transition-shadow cursor-pointer"
                    onClick={() => setSelectedRequest(request)}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center space-x-2">
                        <div className={`w-3 h-3 rounded-full ${
                          request.status === 'pending' ? 'bg-yellow-500' :
                          request.status === 'approved' ? 'bg-green-500' :
                          request.status === 'rejected' ? 'bg-red-500' : 'bg-gray-500'
                        }`}></div>
                        <span className="text-sm font-medium text-gray-900 dark:text-white">
                          {request.request_type}
                        </span>
                      </div>
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        request.priority === 'urgent' ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' :
                        request.priority === 'high' ? 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200' :
                        request.priority === 'normal' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' :
                        'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
                      }`}>
                        {request.priority}
                      </span>
                    </div>
                    
                    <div className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                      Adım {request.completed_steps}/{request.total_steps}
                    </div>
                    
                    <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                      <span className="capitalize">{request.status}</span>
                      <span>{new Date(request.created_at || '').toLocaleDateString('tr-TR')}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'templates' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {templates.map((template) => (
                  <div
                    key={template.id}
                    className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 hover:shadow-md transition-shadow cursor-pointer"
                    onClick={() => useTemplate(template)}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-sm font-medium text-gray-900 dark:text-white">
                        {template.name}
                      </span>
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {template.usage_count} kullanım
                      </span>
                    </div>
                    
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                      {template.description}
                    </p>
                    
                    <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                      <span className="capitalize">{template.category}</span>
                      {template.is_public && <span className="text-green-600">Genel</span>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Sidebar */}
        {(selectedWorkflow || selectedRequest) && (
          <div className="w-96 bg-white dark:bg-gray-800 border-l border-gray-200 dark:border-gray-700 p-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Detaylar
            </h3>
            
            {selectedWorkflow && (
              <WorkflowDetails
                workflow={selectedWorkflow}
                onUpdate={setSelectedWorkflow}
                onSave={saveWorkflow}
                isEditing={isEditing}
                setIsEditing={setIsEditing}
              />
            )}
            
            {selectedRequest && (
              <RequestDetails
                request={selectedRequest}
                onUpdate={setSelectedRequest}
              />
            )}
          </div>
        )}
      </div>

      {/* Templates Modal */}
      {showTemplates && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-96 max-h-96 overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Şablonlar
              </h3>
              <button
                onClick={() => setShowTemplates(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={20} />
              </button>
            </div>
            <div className="space-y-3">
              {templates.map((template) => (
                <div
                  key={template.id}
                  className="p-3 border border-gray-200 dark:border-gray-700 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700"
                  onClick={() => useTemplate(template)}
                >
                  <div className="font-medium text-gray-900 dark:text-white">
                    {template.name}
                  </div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    {template.description}
                  </div>
                  <div className="text-xs text-gray-400 mt-1">
                    {template.category} • {template.usage_count} kullanım
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Workflow Details Component
const WorkflowDetails: React.FC<{
  workflow: ApprovalWorkflow;
  onUpdate: (workflow: ApprovalWorkflow) => void;
  onSave: () => void;
  isEditing: boolean;
  setIsEditing: (editing: boolean) => void;
}> = ({ workflow, onUpdate, onSave, isEditing, setIsEditing }) => {
  return (
    <div className="space-y-4">
      {isEditing ? (
        <>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              İsim
            </label>
            <input
              type="text"
              value={workflow.name}
              onChange={(e) => onUpdate({ ...workflow, name: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Açıklama
            </label>
            <textarea
              value={workflow.description}
              onChange={(e) => onUpdate({ ...workflow, description: e.target.value })}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Süreç Tipi
            </label>
            <select
              value={workflow.workflow_type}
              onChange={(e) => onUpdate({ ...workflow, workflow_type: e.target.value as any })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              <option value="sequential">Sıralı</option>
              <option value="parallel">Paralel</option>
              <option value="conditional">Koşullu</option>
            </select>
          </div>
          
          <div className="pt-4 space-y-2">
            <button
              onClick={onSave}
              className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Kaydet
            </button>
            <button
              onClick={() => setIsEditing(false)}
              className="w-full px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
            >
              İptal
            </button>
          </div>
        </>
      ) : (
        <>
          <div>
            <h4 className="font-medium text-gray-900 dark:text-white">{workflow.name}</h4>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{workflow.description}</p>
          </div>
          
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600 dark:text-gray-400">Tip:</span>
              <span className="text-gray-900 dark:text-white capitalize">{workflow.workflow_type}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600 dark:text-gray-400">Durum:</span>
              <span className="text-gray-900 dark:text-white capitalize">{workflow.status}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600 dark:text-gray-400">Timeout:</span>
              <span className="text-gray-900 dark:text-white">{workflow.auto_approve_timeout} saat</span>
            </div>
          </div>
          
          <div className="pt-4">
            <button
              onClick={() => setIsEditing(true)}
              className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Düzenle
            </button>
          </div>
        </>
      )}
    </div>
  );
};

// Request Details Component
const RequestDetails: React.FC<{
  request: ApprovalRequest;
  onUpdate: (request: ApprovalRequest) => void;
}> = ({ request, onUpdate }) => {
  return (
    <div className="space-y-4">
      <div>
        <h4 className="font-medium text-gray-900 dark:text-white">{request.request_type}</h4>
        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
          Talep #{request.id?.slice(0, 8)}
        </p>
      </div>
      
      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-gray-600 dark:text-gray-400">Durum:</span>
          <span className={`capitalize ${
            request.status === 'pending' ? 'text-yellow-600' :
            request.status === 'approved' ? 'text-green-600' :
            request.status === 'rejected' ? 'text-red-600' : 'text-gray-600'
          }`}>
            {request.status}
          </span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-600 dark:text-gray-400">Öncelik:</span>
          <span className="text-gray-900 dark:text-white capitalize">{request.priority}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-600 dark:text-gray-400">İlerleme:</span>
          <span className="text-gray-900 dark:text-white">
            {request.completed_steps}/{request.total_steps}
          </span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-600 dark:text-gray-400">Oluşturulma:</span>
          <span className="text-gray-900 dark:text-white">
            {new Date(request.created_at || '').toLocaleDateString('tr-TR')}
          </span>
        </div>
      </div>
      
      <div className="pt-4">
        <button className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
          Detayları Görüntüle
        </button>
      </div>
    </div>
  );
};

export default ApprovalWorkflows;
