import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Calendar, 
  TrendingUp, 
  AlertTriangle, 
  Target, 
  Clock, 
  DollarSign, 
  BarChart3,
  CheckCircle,
  XCircle,
  Activity,
  Zap,
  Brain,
  GanttChart,
  PieChart,
  LineChart,
  ArrowUpRight,
  ArrowDownRight,
  RefreshCw,
  Settings,
  Plus,
  Edit,
  Trash2,
  Eye,
  Download,
  Layers,
  Network,
  Thermometer,
  Globe,
  Maximize2,
  Minimize2,
  FileText,
  X,
  MessageSquare,
  UserPlus,
  Video
} from 'lucide-react';
import { useSupabase } from '../hooks/useSupabase';
import { toast } from 'react-hot-toast';
import EmployeeChat from './EmployeeChat';
import FeedbackButton from './common/FeedbackButton';

interface Project {
  id: string;
  name: string;
  description: string;
  status: 'planning' | 'active' | 'completed' | 'on_hold';
  priority: 'low' | 'medium' | 'high' | 'critical';
  start_date: string;
  end_date: string;
  budget: number;
  actual_cost: number;
  progress: number;
  team_size: number;
  risk_level: 'low' | 'medium' | 'high';
  created_at: string;
}

interface Resource {
  id: string;
  name: string;
  role: string;
  availability: number;
  current_load: number;
  skills: string[];
  hourly_rate: number;
}

interface Task {
  id: string;
  project_id: string;
  name: string;
  description: string;
  status: 'pending' | 'in_progress' | 'completed' | 'blocked';
  priority: 'low' | 'medium' | 'high' | 'critical';
  assigned_to: string;
  estimated_hours: number;
  actual_hours: number;
  start_date: string;
  due_date: string;
  dependencies: string[];
  progress?: number;
}

interface RiskAnalysis {
  id: string;
  project_id: string;
  risk_type: 'budget' | 'schedule' | 'resource' | 'technical';
  probability: number;
  impact: number;
  mitigation_strategy: string;
  status: 'identified' | 'monitoring' | 'mitigated';
}

interface SmartProjectManagementProps {
  onChannelSelect?: (channelId: string) => void;
}

const SmartProjectManagement: React.FC<SmartProjectManagementProps> = ({ onChannelSelect }) => {
  const { supabase } = useSupabase();
  const [activeTab, setActiveTab] = useState('overview');
  const [projects, setProjects] = useState<Project[]>([]);
  const [resources, setResources] = useState<Resource[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [risks, setRisks] = useState<RiskAnalysis[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [showNewProjectModal, setShowNewProjectModal] = useState(false);
  const [showResourceModal, setShowResourceModal] = useState(false);
  const [showRiskModal, setShowRiskModal] = useState(false);
  const [showEditProjectModal, setShowEditProjectModal] = useState(false);
  const [showAutoReportingModal, setShowAutoReportingModal] = useState(false);
  const [showTeamChatModal, setShowTeamChatModal] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [newProject, setNewProject] = useState<Partial<Project>>({
    name: '',
    description: '',
    status: 'planning',
    priority: 'medium',
    start_date: '',
    end_date: '',
    budget: 0,
    team_size: 1,
    risk_level: 'low'
  });

  // Gelişmiş görselleştirme state'leri
  const [visualizationMode, setVisualizationMode] = useState<'2d' | '3d'>('2d');
  const [selectedTimeframe, setSelectedTimeframe] = useState<'week' | 'month' | 'quarter'>('month');
  const [showHeatMap, setShowHeatMap] = useState(false);
  const [showNetworkGraph, setShowNetworkGraph] = useState(false);
  const [fullscreenMode, setFullscreenMode] = useState(false);
  const [selectedMetric, setSelectedMetric] = useState<'progress' | 'budget' | 'risk' | 'team'>('progress');

  // Mock data for demonstration
  const mockProjects: Project[] = [
    {
      id: '1',
      name: 'E-ticaret Platformu Geliştirme',
      description: 'Modern e-ticaret platformu geliştirme projesi. React, Node.js ve PostgreSQL kullanarak tam özellikli bir e-ticaret sistemi.',
      status: 'active',
      priority: 'high',
      start_date: '2024-01-15',
      end_date: '2024-06-30',
      budget: 150000,
      actual_cost: 85000,
      progress: 65,
      team_size: 8,
      risk_level: 'medium',
      created_at: '2024-01-10'
    },
    {
      id: '2',
      name: 'Mobil Uygulama Geliştirme',
      description: 'iOS ve Android mobil uygulama geliştirme. React Native ile cross-platform mobil uygulama.',
      status: 'planning',
      priority: 'medium',
      start_date: '2024-03-01',
      end_date: '2024-08-31',
      budget: 80000,
      actual_cost: 0,
      progress: 15,
      team_size: 5,
      risk_level: 'low',
      created_at: '2024-02-15'
    },
    {
      id: '3',
      name: 'CRM Sistemi Entegrasyonu',
      description: 'Mevcut CRM sistemini yeni ERP sistemi ile entegrasyon projesi.',
      status: 'active',
      priority: 'critical',
      start_date: '2024-02-01',
      end_date: '2024-05-31',
      budget: 120000,
      actual_cost: 95000,
      progress: 85,
      team_size: 6,
      risk_level: 'high',
      created_at: '2024-01-20'
    },
    {
      id: '4',
      name: 'Web Sitesi Yenileme',
      description: 'Kurumsal web sitesinin modern tasarım ile yenilenmesi projesi.',
      status: 'completed',
      priority: 'low',
      start_date: '2024-01-01',
      end_date: '2024-03-31',
      budget: 45000,
      actual_cost: 42000,
      progress: 100,
      team_size: 3,
      risk_level: 'low',
      created_at: '2023-12-15'
    }
  ];

  const mockResources: Resource[] = [
    {
      id: '1',
      name: 'Ahmet Yılmaz',
      role: 'Proje Yöneticisi',
      availability: 40,
      current_load: 35,
      skills: ['Proje Yönetimi', 'Agile', 'Scrum'],
      hourly_rate: 150
    },
    {
      id: '2',
      name: 'Fatma Demir',
      role: 'Frontend Geliştirici',
      availability: 40,
      current_load: 40,
      skills: ['React', 'TypeScript', 'UI/UX'],
      hourly_rate: 120
    },
    {
      id: '3',
      name: 'Mehmet Kaya',
      role: 'Backend Geliştirici',
      availability: 40,
      current_load: 30,
      skills: ['Node.js', 'PostgreSQL', 'API'],
      hourly_rate: 130
    },
    {
      id: '4',
      name: 'Ayşe Özkan',
      role: 'UI/UX Tasarımcı',
      availability: 40,
      current_load: 25,
      skills: ['Figma', 'Adobe Creative Suite', 'Prototyping'],
      hourly_rate: 100
    },
    {
      id: '5',
      name: 'Ali Çelik',
      role: 'DevOps Mühendisi',
      availability: 40,
      current_load: 20,
      skills: ['Docker', 'Kubernetes', 'AWS', 'CI/CD'],
      hourly_rate: 140
    },
    {
      id: '6',
      name: 'Zeynep Arslan',
      role: 'Test Uzmanı',
      availability: 40,
      current_load: 15,
      skills: ['QA', 'Automation', 'Selenium', 'Jest'],
      hourly_rate: 110
    }
  ];

  const mockTasks: Task[] = [
    {
      id: '1',
      project_id: '1',
      name: 'Frontend Ana Sayfa Tasarımı',
      description: 'E-ticaret platformunun ana sayfa tasarımının tamamlanması',
      status: 'completed',
      priority: 'high',
      assigned_to: '2',
      estimated_hours: 40,
      actual_hours: 38,
      start_date: '2024-01-20',
      due_date: '2024-02-15',
      dependencies: [],
      progress: 100
    },
    {
      id: '2',
      project_id: '1',
      name: 'Backend API Geliştirme',
      description: 'Ürün listeleme ve arama API\'lerinin geliştirilmesi',
      status: 'in_progress',
      priority: 'high',
      assigned_to: '3',
      estimated_hours: 60,
      actual_hours: 45,
      start_date: '2024-02-01',
      due_date: '2024-03-15',
      dependencies: [],
      progress: 75
    },
    {
      id: '3',
      project_id: '1',
      name: 'Ödeme Sistemi Entegrasyonu',
      description: 'Stripe ödeme sistemi entegrasyonu',
      status: 'pending',
      priority: 'critical',
      assigned_to: '3',
      estimated_hours: 30,
      actual_hours: 0,
      start_date: '2024-03-01',
      due_date: '2024-03-31',
      dependencies: [],
      progress: 0
    },
    {
      id: '4',
      project_id: '2',
      name: 'Mobil Uygulama Tasarımı',
      description: 'React Native uygulamasının UI/UX tasarımı',
      status: 'in_progress',
      priority: 'medium',
      assigned_to: '4',
      estimated_hours: 50,
      actual_hours: 25,
      start_date: '2024-03-01',
      due_date: '2024-04-15',
      dependencies: [],
      progress: 50
    }
  ];

  const mockRisks: RiskAnalysis[] = [
    {
      id: '1',
      project_id: '1',
      risk_type: 'schedule',
      probability: 60,
      impact: 80,
      mitigation_strategy: 'Alternatif ödeme sistemleri araştırılacak',
      status: 'monitoring'
    },
    {
      id: '2',
      project_id: '1',
      risk_type: 'budget',
      probability: 40,
      impact: 70,
      mitigation_strategy: 'Gereksiz özellikler ertelenebilir',
      status: 'identified'
    },
    {
      id: '3',
      project_id: '2',
      risk_type: 'resource',
      probability: 70,
      impact: 60,
      mitigation_strategy: 'Eğitim programı başlatılacak',
      status: 'identified'
    }
  ];

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      console.log('🔄 Veri yükleniyor...');
      
      // Supabase bağlantısını test et
      const { data: testData, error: testError } = await supabase
        .from('projects')
        .select('count')
        .limit(1);
      
      if (testError) {
        console.error('❌ Supabase bağlantı hatası:', testError);
        
        // Tablo yoksa migration gerekebilir
        if (testError.message.includes('relation "projects" does not exist')) {
          console.log('💡 Proje yönetimi tabloları oluşturulmamış. Migration gerekli.');
          toast.error('Proje yönetimi tabloları oluşturulmamış. Lütfen migration çalıştırın.');
        }
        
        // Mock data kullan
        setProjects(mockProjects);
        setResources(mockResources);
        setTasks(mockTasks);
        setRisks(mockRisks);
        setLoading(false);
        return;
      }
      
      console.log('✅ Supabase bağlantısı başarılı');
      
      // Projeleri yükle
      const { data: projectsData, error: projectsError } = await supabase
        .from('projects')
        .select('*')
        .order('created_at', { ascending: false });

      if (projectsError) {
        console.error('❌ Projeler yükleme hatası:', projectsError);
        setProjects(mockProjects);
      } else {
        console.log('✅ Projeler yüklendi:', projectsData?.length || 0);
        setProjects(projectsData && projectsData.length > 0 ? projectsData : mockProjects);
      }

      // Kaynakları yükle
      const { data: resourcesData, error: resourcesError } = await supabase
        .from('project_resources')
        .select('*')
        .eq('status', 'active')
        .order('name');

      if (resourcesError) {
        console.error('❌ Kaynaklar yükleme hatası:', resourcesError);
        setResources(mockResources);
      } else {
        console.log('✅ Kaynaklar yüklendi:', resourcesData?.length || 0);
        setResources(resourcesData && resourcesData.length > 0 ? resourcesData : mockResources);
      }

      // Görevleri yükle
      const { data: tasksData, error: tasksError } = await supabase
        .from('project_tasks')
        .select('*')
        .order('created_at', { ascending: false });

      if (tasksError) {
        console.error('❌ Görevler yükleme hatası:', tasksError);
        setTasks([]);
      } else {
        console.log('✅ Görevler yüklendi:', tasksData?.length || 0);
        setTasks(tasksData || []);
      }

      // Riskleri yükle
      const { data: risksData, error: risksError } = await supabase
        .from('project_risks')
        .select('*')
        .order('created_at', { ascending: false });

      if (risksError) {
        console.error('❌ Riskler yükleme hatası:', risksError);
        setRisks([]);
      } else {
        console.log('✅ Riskler yüklendi:', risksData?.length || 0);
        setRisks(risksData || []);
      }

      setLoading(false);
      console.log('🎉 Veri yükleme tamamlandı');
      
    } catch (error) {
      console.error('❌ Veri yükleme hatası:', error);
      toast.error('Veri yüklenirken hata oluştu, mock data kullanılıyor');
      
      // Hata durumunda mock data kullan
      setProjects(mockProjects);
      setResources(mockResources);
      setTasks(mockTasks);
      setRisks(mockRisks);
      setLoading(false);
    }
  };

  const calculateResourceOptimization = () => {
    const optimization = resources.map(resource => ({
      ...resource,
      utilization: (resource.current_load / resource.availability) * 100,
      recommended: resource.current_load < resource.availability * 0.8 ? 'Daha fazla görev atanabilir' : 
                   resource.current_load > resource.availability * 0.9 ? 'Yüksek yük - görev azaltılmalı' : 'Optimal'
    }));
    return optimization;
  };

  const calculateRiskScore = (project: Project) => {
    const budgetRisk = project.actual_cost / project.budget;
    const scheduleRisk = new Date(project.end_date) < new Date() ? 1 : 0;
    const progressRisk = project.progress < 50 && new Date(project.end_date) < new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) ? 0.8 : 0;
    
    return Math.min(100, (budgetRisk + scheduleRisk + progressRisk) * 33.33);
  };

  const predictCompletion = (project: Project) => {
    const currentProgress = project.progress;
    const remainingWork = 100 - currentProgress;
    const daysElapsed = Math.floor((new Date().getTime() - new Date(project.start_date).getTime()) / (1000 * 60 * 60 * 24));
    const dailyProgress = currentProgress / daysElapsed;
    const estimatedDaysRemaining = remainingWork / dailyProgress;
    
    return {
      estimatedCompletion: new Date(Date.now() + estimatedDaysRemaining * 24 * 60 * 60 * 1000),
      confidence: Math.min(95, Math.max(60, 100 - Math.abs(estimatedDaysRemaining - 30) * 2))
    };
  };

  const generateTimeline = (project: Project) => {
    const phases = [
      { name: 'Planlama', duration: 10, progress: project.progress > 10 ? 100 : project.progress * 10 },
      { name: 'Tasarım', duration: 15, progress: project.progress > 25 ? 100 : Math.max(0, (project.progress - 10) * 6.67) },
      { name: 'Geliştirme', duration: 40, progress: project.progress > 65 ? 100 : Math.max(0, (project.progress - 25) * 2.5) },
      { name: 'Test', duration: 20, progress: project.progress > 85 ? 100 : Math.max(0, (project.progress - 65) * 5) },
      { name: 'Deployment', duration: 15, progress: project.progress > 100 ? 100 : Math.max(0, (project.progress - 85) * 6.67) }
    ];
    return phases;
  };

  // Gelişmiş görselleştirme fonksiyonları
  const generateHeatMapData = () => {
    const days = 30;
    const heatMapData: Array<{
      date: string;
      project: string;
      value: number;
      intensity: number;
    }> = [];
    
    for (let i = 0; i < days; i++) {
      const date = new Date();
      date.setDate(date.getDate() - (days - i - 1));
      
      projects.forEach(project => {
        const progress = Math.random() * 100;
        const intensity = progress / 100;
        
        heatMapData.push({
          date: date.toISOString().split('T')[0],
          project: project.name,
          value: progress,
          intensity: intensity
        });
      });
    }
    
    return heatMapData;
  };

  const generateNetworkData = () => {
    const nodes = projects.map(project => ({
      id: project.id,
      label: project.name,
      group: project.status,
      size: project.team_size * 5,
      color: project.status === 'active' ? '#10B981' : 
             project.status === 'completed' ? '#6B7280' : '#F59E0B'
    }));

    const edges: Array<{
      from: string;
      to: string;
      arrows: string;
      color: { color: string; opacity: number };
    }> = [];
    projects.forEach((project, index) => {
      if (index < projects.length - 1) {
        edges.push({
          from: project.id,
          to: projects[index + 1].id,
          arrows: 'to',
          color: { color: '#3B82F6', opacity: 0.6 }
        });
      }
    });

    return { nodes, edges };
  };

  const generate3DGanttData = () => {
    return projects.map(project => {
      const startDate = new Date(project.start_date);
      const endDate = new Date(project.end_date);
      const duration = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
      
      return {
        id: project.id,
        name: project.name,
        start: startDate,
        end: endDate,
        duration: duration,
        progress: project.progress,
        team: project.team_size,
        budget: project.budget,
        risk: calculateRiskScore(project)
      };
    });
  };

  // Proje işlemleri
  const handleCreateProject = async () => {
    try {
      console.log('🔄 Proje oluşturuluyor:', newProject);
      
      // Veri doğrulama
      if (!newProject.name?.trim()) {
        toast.error('Proje adı zorunludur');
        return;
      }
      
      if (!newProject.start_date || !newProject.end_date) {
        toast.error('Başlangıç ve bitiş tarihi zorunludur');
        return;
      }
      
      if (new Date(newProject.start_date) >= new Date(newProject.end_date)) {
        toast.error('Bitiş tarihi başlangıç tarihinden sonra olmalıdır');
        return;
      }
      
      const { data, error } = await supabase
        .from('projects')
        .insert([{
          ...newProject,
          created_by: null, // Geçici olarak null
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }])
        .select()
        .single();

      if (error) {
        console.error('❌ Proje oluşturma hatası:', error);
        
        // Hata mesajını daha detaylı göster
        if (error.message.includes('duplicate key')) {
          toast.error('Bu proje adı zaten kullanılıyor');
        } else if (error.message.includes('not null')) {
          toast.error('Zorunlu alanlar eksik');
        } else {
          toast.error(`Proje oluşturulurken hata oluştu: ${error.message}`);
        }
        return;
      }

      console.log('✅ Proje oluşturuldu:', data);
      toast.success('Proje başarıyla oluşturuldu');
      setShowNewProjectModal(false);
      setNewProject({
        name: '',
        description: '',
        status: 'planning',
        priority: 'medium',
        start_date: '',
        end_date: '',
        budget: 0,
        team_size: 1,
        risk_level: 'low'
      });
      loadData();
    } catch (error) {
      console.error('❌ Proje oluşturma hatası:', error);
      toast.error('Proje oluşturulurken hata oluştu');
    }
  };

  const handleUpdateProject = async () => {
    if (!editingProject) return;

    try {
      console.log('🔄 Proje güncelleniyor:', editingProject);
      
      // Veri doğrulama
      if (!editingProject.name?.trim()) {
        toast.error('Proje adı zorunludur');
        return;
      }
      
      if (!editingProject.start_date || !editingProject.end_date) {
        toast.error('Başlangıç ve bitiş tarihi zorunludur');
        return;
      }
      
      if (new Date(editingProject.start_date) >= new Date(editingProject.end_date)) {
        toast.error('Bitiş tarihi başlangıç tarihinden sonra olmalıdır');
        return;
      }
      
      const { error } = await supabase
        .from('projects')
        .update({
          name: editingProject.name,
          description: editingProject.description,
          status: editingProject.status,
          priority: editingProject.priority,
          start_date: editingProject.start_date,
          end_date: editingProject.end_date,
          budget: editingProject.budget,
          actual_cost: editingProject.actual_cost,
          team_size: editingProject.team_size,
          risk_level: editingProject.risk_level,
          updated_at: new Date().toISOString()
        })
        .eq('id', editingProject.id);

      if (error) {
        console.error('❌ Proje güncelleme hatası:', error);
        
        // Hata mesajını daha detaylı göster
        if (error.message.includes('duplicate key')) {
          toast.error('Bu proje adı zaten kullanılıyor');
        } else if (error.message.includes('not null')) {
          toast.error('Zorunlu alanlar eksik');
        } else {
          toast.error(`Proje güncellenirken hata oluştu: ${error.message}`);
        }
        return;
      }

      console.log('✅ Proje güncellendi');
      toast.success('Proje başarıyla güncellendi');
      setShowEditProjectModal(false);
      setEditingProject(null);
      loadData();
    } catch (error) {
      console.error('❌ Proje güncelleme hatası:', error);
      toast.error('Proje güncellenirken hata oluştu');
    }
  };

  const handleDeleteProject = async (projectId: string) => {
    if (!confirm('Bu projeyi silmek istediğinizden emin misiniz?')) return;

    try {
      console.log('🔄 Proje siliniyor:', projectId);
      
      const { error } = await supabase
        .from('projects')
        .delete()
        .eq('id', projectId);

      if (error) {
        console.error('❌ Proje silme hatası:', error);
        
        // Hata mesajını daha detaylı göster
        if (error.message.includes('foreign key')) {
          toast.error('Bu projeye bağlı görevler veya riskler var. Önce onları silin.');
        } else {
          toast.error(`Proje silinirken hata oluştu: ${error.message}`);
        }
        return;
      }

      console.log('✅ Proje silindi');
      toast.success('Proje başarıyla silindi');
      loadData();
    } catch (error) {
      console.error('❌ Proje silme hatası:', error);
      toast.error('Proje silinirken hata oluştu');
    }
  };

  const handleEditProject = (project: Project) => {
    setEditingProject(project);
    setShowEditProjectModal(true);
  };

  const handleViewProject = (project: Project) => {
    setSelectedProject(project);
    // Proje detay sayfasına yönlendirme veya modal açma
    toast.success(`${project.name} projesi detayları görüntüleniyor`);
  };

  const renderOverview = () => (
    <div className="space-y-6">
      {/* Proje Özeti */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Aktif Projeler</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {projects.filter(p => p.status === 'active').length}
              </p>
            </div>
            <div className="p-3 bg-blue-100 dark:bg-blue-900 rounded-lg">
              <Activity className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Toplam Bütçe</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                ₺{projects.reduce((sum, p) => sum + p.budget, 0).toLocaleString()}
              </p>
            </div>
            <div className="p-3 bg-green-100 dark:bg-green-900 rounded-lg">
              <DollarSign className="w-6 h-6 text-green-600 dark:text-green-400" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Ortalama İlerleme</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {Math.round(projects.reduce((sum, p) => sum + p.progress, 0) / projects.length)}%
              </p>
            </div>
            <div className="p-3 bg-purple-100 dark:bg-purple-900 rounded-lg">
              <TrendingUp className="w-6 h-6 text-purple-600 dark:text-purple-400" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Risk Skoru</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {Math.round(projects.reduce((sum, p) => sum + calculateRiskScore(p), 0) / projects.length)}
              </p>
            </div>
            <div className="p-3 bg-red-100 dark:bg-red-900 rounded-lg">
              <AlertTriangle className="w-6 h-6 text-red-600 dark:text-red-400" />
            </div>
          </div>
        </div>
      </div>

      {/* Proje Listesi */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Proje Listesi</h3>
            <button
              onClick={() => setShowNewProjectModal(true)}
              className="inline-flex items-center px-4 py-2 bg-primary hover:bg-primary-600 text-white rounded-lg text-sm font-medium transition-colors"
            >
              <Plus className="w-4 h-4 mr-2" />
              Yeni Proje
            </button>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Proje</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Durum</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">İlerleme</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Bütçe</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Risk</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">İşlemler</th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {projects.map((project) => (
                <tr key={project.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900 dark:text-white">{project.name}</div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">{project.description}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      project.status === 'active' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' :
                      project.status === 'planning' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' :
                      project.status === 'completed' ? 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200' :
                      'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                    }`}>
                      {project.status === 'active' ? 'Aktif' :
                       project.status === 'planning' ? 'Planlama' :
                       project.status === 'completed' ? 'Tamamlandı' : 'Beklemede'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="w-16 bg-gray-200 dark:bg-gray-700 rounded-full h-2 mr-2">
                        <div 
                          className="bg-primary h-2 rounded-full transition-all duration-300"
                          style={{ width: `${project.progress}%` }}
                        ></div>
                      </div>
                      <span className="text-sm text-gray-900 dark:text-white">{project.progress}%</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                    ₺{project.actual_cost.toLocaleString()} / ₺{project.budget.toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      calculateRiskScore(project) < 30 ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' :
                      calculateRiskScore(project) < 60 ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' :
                      'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                    }`}>
                      {calculateRiskScore(project).toFixed(0)}%
                    </span>
                  </td>
                                     <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                     <div className="flex space-x-2">
                       <button 
                         onClick={() => handleViewProject(project)}
                         className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300"
                         title="Görüntüle"
                       >
                         <Eye className="w-4 h-4" />
                       </button>
                       <button 
                         onClick={() => handleEditProject(project)}
                         className="text-green-600 hover:text-green-900 dark:text-green-400 dark:hover:text-green-300"
                         title="Düzenle"
                       >
                         <Edit className="w-4 h-4" />
                       </button>
                       <button 
                         onClick={() => handleDeleteProject(project.id)}
                         className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                         title="Sil"
                       >
                         <Trash2 className="w-4 h-4" />
                       </button>
                     </div>
                   </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  const renderResourceOptimization = () => (
    <div className="space-y-6">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Dinamik Kaynak Optimizasyonu</h3>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {calculateResourceOptimization().map((resource) => (
            <div key={resource.id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h4 className="font-medium text-gray-900 dark:text-white">{resource.name}</h4>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{resource.role}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    {resource.utilization.toFixed(0)}% Kullanım
                  </p>
                  <p className={`text-xs ${
                    resource.utilization < 80 ? 'text-green-600 dark:text-green-400' :
                    resource.utilization > 90 ? 'text-red-600 dark:text-red-400' :
                    'text-yellow-600 dark:text-yellow-400'
                  }`}>
                    {resource.recommended}
                  </p>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">Mevcut Yük</span>
                  <span className="text-gray-900 dark:text-white">{resource.current_load}h / {resource.availability}h</span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                  <div 
                    className={`h-2 rounded-full transition-all duration-300 ${
                      resource.utilization < 80 ? 'bg-green-500' :
                      resource.utilization > 90 ? 'bg-red-500' : 'bg-yellow-500'
                    }`}
                    style={{ width: `${resource.utilization}%` }}
                  ></div>
                </div>
                <div className="flex flex-wrap gap-1">
                  {resource.skills.map((skill, index) => (
                    <span key={index} className="inline-flex px-2 py-1 text-xs bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded-full">
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderRiskAnalysis = () => (
    <div className="space-y-6">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Proaktif Risk Analizi</h3>
          <button
            onClick={() => setShowRiskModal(true)}
            className="inline-flex items-center px-4 py-2 bg-primary hover:bg-primary-600 text-white rounded-lg text-sm font-medium transition-colors"
          >
            <Plus className="w-4 h-4 mr-2" />
            Risk Ekle
          </button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map((project) => {
            const riskScore = calculateRiskScore(project);
            const prediction = predictCompletion(project);
            
            return (
              <div key={project.id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                <h4 className="font-medium text-gray-900 dark:text-white mb-3">{project.name}</h4>
                
                <div className="space-y-3">
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-600 dark:text-gray-400">Risk Skoru</span>
                      <span className={`font-medium ${
                        riskScore < 30 ? 'text-green-600 dark:text-green-400' :
                        riskScore < 60 ? 'text-yellow-600 dark:text-yellow-400' :
                        'text-red-600 dark:text-red-400'
                      }`}>
                        {riskScore.toFixed(0)}%
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                      <div 
                        className={`h-2 rounded-full ${
                          riskScore < 30 ? 'bg-green-500' :
                          riskScore < 60 ? 'bg-yellow-500' : 'bg-red-500'
                        }`}
                        style={{ width: `${riskScore}%` }}
                      ></div>
                    </div>
                  </div>
                  
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Tahmini Tamamlanma</p>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      {prediction.estimatedCompletion.toLocaleDateString('tr-TR')}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Güven: {prediction.confidence.toFixed(0)}%
                    </p>
                  </div>
                  
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Bütçe Durumu</p>
                    <p className={`text-sm font-medium ${
                      project.actual_cost / project.budget < 0.8 ? 'text-green-600 dark:text-green-400' :
                      project.actual_cost / project.budget > 1.1 ? 'text-red-600 dark:text-red-400' :
                      'text-yellow-600 dark:text-yellow-400'
                    }`}>
                      {(project.actual_cost / project.budget * 100).toFixed(0)}% kullanıldı
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );

  const renderPerformancePrediction = () => (
    <div className="space-y-6">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">Performans Tahminlemesi</h3>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {projects.map((project) => {
            const prediction = predictCompletion(project);
            const timeline = generateTimeline(project);
            
            return (
              <div key={project.id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                <h4 className="font-medium text-gray-900 dark:text-white mb-4">{project.name}</h4>
                
                <div className="space-y-4">
                  <div>
                    <h5 className="text-sm font-medium text-gray-900 dark:text-white mb-2">Proje Aşamaları</h5>
                    <div className="space-y-2">
                      {timeline.map((phase, index) => (
                        <div key={index}>
                          <div className="flex justify-between text-sm mb-1">
                            <span className="text-gray-600 dark:text-gray-400">{phase.name}</span>
                            <span className="text-gray-900 dark:text-white">{phase.progress.toFixed(0)}%</span>
                          </div>
                          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                            <div 
                              className="bg-primary h-2 rounded-full transition-all duration-300"
                              style={{ width: `${phase.progress}%` }}
                            ></div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Tahmini Tamamlanma</p>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        {prediction.estimatedCompletion.toLocaleDateString('tr-TR')}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Güven Oranı</p>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        {prediction.confidence.toFixed(0)}%
                      </p>
                    </div>
                  </div>
                  
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Tahmini Maliyet</p>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      ₺{Math.round(project.budget * (project.actual_cost / project.budget / (project.progress / 100))).toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );

  const renderTimelineManagement = () => (
    <div className="space-y-6">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">Otomatik Zaman Çizelgesi ve Görev Ataması</h3>
        
        {projects.map((project) => {
          const timeline = generateTimeline(project);
          
          return (
            <div key={project.id} className="mb-8 last:mb-0">
              <h4 className="font-medium text-gray-900 dark:text-white mb-4">{project.name}</h4>
              
              <div className="relative">
                <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gray-200 dark:bg-gray-700"></div>
                
                <div className="space-y-6">
                  {timeline.map((phase, index) => (
                    <div key={index} className="relative flex items-start">
                      <div className="absolute left-2 top-2 w-4 h-4 bg-primary rounded-full border-4 border-white dark:border-gray-800"></div>
                      
                      <div className="ml-8 flex-1">
                        <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                          <div className="flex items-center justify-between mb-2">
                            <h5 className="font-medium text-gray-900 dark:text-white">{phase.name}</h5>
                            <span className="text-sm text-gray-500 dark:text-gray-400">{phase.duration} gün</span>
                          </div>
                          
                          <div className="mb-3">
                            <div className="flex justify-between text-sm mb-1">
                              <span className="text-gray-600 dark:text-gray-400">İlerleme</span>
                              <span className="text-gray-900 dark:text-white">{phase.progress.toFixed(0)}%</span>
                            </div>
                            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                              <div 
                                className="bg-primary h-2 rounded-full transition-all duration-300"
                                style={{ width: `${phase.progress}%` }}
                              ></div>
                            </div>
                          </div>
                          
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-2">
                              <Users className="w-4 h-4 text-gray-400" />
                              <span className="text-sm text-gray-600 dark:text-gray-400">
                                {Math.ceil(project.team_size * (phase.duration / 100))} kişi atanacak
                              </span>
                            </div>
                            
                            <button className="text-sm text-primary hover:text-primary-600 dark:text-primary-400 dark:hover:text-primary-300">
                              Görevleri Görüntüle
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );

  const renderAdvancedVisualizations = () => (
    <div className="space-y-6">
      {/* Görselleştirme Kontrolleri */}
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Gelişmiş Görselleştirme</h3>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setVisualizationMode(visualizationMode === '2d' ? '3d' : '2d')}
              className="inline-flex items-center px-3 py-2 bg-primary hover:bg-primary-600 text-white rounded-lg text-sm font-medium transition-colors"
            >
              <Layers className="w-4 h-4 mr-2" />
              {visualizationMode === '2d' ? '3D Mod' : '2D Mod'}
            </button>
            <button
              onClick={() => setFullscreenMode(!fullscreenMode)}
              className="inline-flex items-center px-3 py-2 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg text-sm font-medium transition-colors"
            >
              {fullscreenMode ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <select
            value={selectedTimeframe}
            onChange={(e) => setSelectedTimeframe(e.target.value as any)}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          >
            <option value="week">Haftalık</option>
            <option value="month">Aylık</option>
            <option value="quarter">Çeyreklik</option>
          </select>

          <select
            value={selectedMetric}
            onChange={(e) => setSelectedMetric(e.target.value as any)}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          >
            <option value="progress">İlerleme</option>
            <option value="budget">Bütçe</option>
            <option value="risk">Risk</option>
            <option value="team">Ekip</option>
          </select>

          <button
            onClick={() => setShowHeatMap(!showHeatMap)}
            className={`inline-flex items-center px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
              showHeatMap 
                ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' 
                : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
            }`}
          >
            <Thermometer className="w-4 h-4 mr-2" />
            Heat Map
          </button>

          <button
            onClick={() => setShowNetworkGraph(!showNetworkGraph)}
            className={`inline-flex items-center px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
              showNetworkGraph 
                ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' 
                : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
            }`}
          >
            <Network className="w-4 h-4 mr-2" />
            Network
          </button>
        </div>
      </div>

      {/* 3D Gantt Chart */}
      {visualizationMode === '3d' && (
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
          <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">3D Gantt Chart</h4>
          <div className="relative h-96 bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-lg overflow-hidden">
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <Globe className="w-16 h-16 text-blue-500 dark:text-blue-400 mx-auto mb-4" />
                <h5 className="text-lg font-medium text-gray-900 dark:text-white mb-2">3D Gantt Chart</h5>
                <p className="text-gray-600 dark:text-gray-400">Proje zaman çizelgesi 3D görünümde</p>
                <div className="mt-4 space-y-2">
                  {generate3DGanttData().map((project, index) => (
                    <div key={project.id} className="flex items-center justify-between bg-white dark:bg-gray-700 rounded-lg p-3 shadow-sm">
                      <span className="text-sm font-medium text-gray-900 dark:text-white">{project.name}</span>
                      <div className="flex items-center space-x-4">
                        <span className="text-xs text-gray-500 dark:text-gray-400">{project.duration} gün</span>
                        <div className="w-20 bg-gray-200 dark:bg-gray-600 rounded-full h-2">
                          <div 
                            className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full"
                            style={{ width: `${project.progress}%` }}
                          ></div>
                        </div>
                        <span className="text-xs font-medium text-gray-900 dark:text-white">{project.progress}%</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Heat Map */}
      {showHeatMap && (
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
          <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Performans Heat Map</h4>
          <div className="grid grid-cols-30 gap-1">
            {generateHeatMapData().slice(0, 30).map((data, index) => (
              <div
                key={index}
                className="h-8 rounded cursor-pointer transition-all duration-200 hover:scale-110"
                style={{
                  backgroundColor: `rgba(59, 130, 246, ${data.intensity})`,
                  opacity: data.intensity > 0.3 ? 1 : 0.3
                }}
                title={`${data.date}: ${data.project} - ${data.value.toFixed(0)}%`}
              />
            ))}
          </div>
          <div className="mt-4 flex items-center justify-between text-sm text-gray-600 dark:text-gray-400">
            <span>Düşük Performans</span>
            <div className="flex space-x-1">
              {[0, 0.25, 0.5, 0.75, 1].map((intensity, index) => (
                <div
                  key={index}
                  className="w-4 h-4 rounded"
                  style={{ backgroundColor: `rgba(59, 130, 246, ${intensity})` }}
                />
              ))}
            </div>
            <span>Yüksek Performans</span>
          </div>
        </div>
      )}

      {/* Network Graph */}
      {showNetworkGraph && (
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
          <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Proje Bağımlılıkları Network</h4>
          <div className="relative h-96 bg-gradient-to-br from-green-50 to-blue-50 dark:from-green-900/20 dark:to-blue-900/20 rounded-lg overflow-hidden">
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <Network className="w-16 h-16 text-green-500 dark:text-green-400 mx-auto mb-4" />
                <h5 className="text-lg font-medium text-gray-900 dark:text-white mb-2">Proje Ağı</h5>
                <p className="text-gray-600 dark:text-gray-400">Proje bağımlılıkları ve ilişkileri</p>
                <div className="mt-4 grid grid-cols-2 gap-4">
                  {generateNetworkData().nodes.map((node) => (
                    <div key={node.id} className="bg-white dark:bg-gray-700 rounded-lg p-3 shadow-sm border-l-4" style={{ borderLeftColor: node.color }}>
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-gray-900 dark:text-white">{node.label}</span>
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: node.color }}></div>
                      </div>
                      <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                        Ekip: {node.size / 5} kişi
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* İnteraktif Dashboard */}
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
        <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">İnteraktif Dashboard</h4>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <h5 className="font-medium text-gray-900 dark:text-white">Gerçek Zamanlı İlerleme</h5>
              <Activity className="w-5 h-5 text-blue-500" />
            </div>
            <div className="space-y-2">
              {projects.map(project => (
                <div key={project.id} className="flex items-center justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">{project.name}</span>
                  <div className="flex items-center space-x-2">
                    <div className="w-16 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                      <div 
                        className="bg-blue-500 h-2 rounded-full transition-all duration-500"
                        style={{ width: `${project.progress}%` }}
                      ></div>
                    </div>
                    <span className="text-xs font-medium text-gray-900 dark:text-white">{project.progress}%</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <h5 className="font-medium text-gray-900 dark:text-white">Bütçe Analizi</h5>
              <DollarSign className="w-5 h-5 text-green-500" />
            </div>
            <div className="space-y-2">
              {projects.map(project => {
                const budgetUsage = (project.actual_cost / project.budget) * 100;
                return (
                  <div key={project.id} className="flex items-center justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-400">{project.name}</span>
                    <div className="flex items-center space-x-2">
                      <div className="w-16 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                        <div 
                          className={`h-2 rounded-full transition-all duration-500 ${
                            budgetUsage > 100 ? 'bg-red-500' : 
                            budgetUsage > 80 ? 'bg-yellow-500' : 'bg-green-500'
                          }`}
                          style={{ width: `${Math.min(budgetUsage, 100)}%` }}
                        ></div>
                      </div>
                      <span className="text-xs font-medium text-gray-900 dark:text-white">{budgetUsage.toFixed(0)}%</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <h5 className="font-medium text-gray-900 dark:text-white">Risk Değerlendirmesi</h5>
              <AlertTriangle className="w-5 h-5 text-purple-500" />
            </div>
            <div className="space-y-2">
              {projects.map(project => {
                const riskScore = calculateRiskScore(project);
                return (
                  <div key={project.id} className="flex items-center justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-400">{project.name}</span>
                    <div className="flex items-center space-x-2">
                      <div className="w-16 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                        <div 
                          className={`h-2 rounded-full transition-all duration-500 ${
                            riskScore > 60 ? 'bg-red-500' : 
                            riskScore > 30 ? 'bg-yellow-500' : 'bg-green-500'
                          }`}
                          style={{ width: `${riskScore}%` }}
                        ></div>
                      </div>
                      <span className="text-xs font-medium text-gray-900 dark:text-white">{riskScore.toFixed(0)}%</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderRealTimeCollaboration = () => (
    <div className="space-y-6">
      {/* Gerçek Zamanlı İşbirliği Kontrol Paneli */}
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Gerçek Zamanlı İşbirliği Sistemi</h3>
          <button
            onClick={() => setShowTeamChatModal(true)}
            className="inline-flex items-center px-4 py-2 bg-primary hover:bg-primary-600 text-white rounded-lg text-sm font-medium transition-colors"
          >
            <MessageSquare className="w-4 h-4 mr-2" />
            Takım Chat'ini Aç
          </button>
        </div>

        {/* İşbirliği İstatistikleri */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-900/30 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-900 dark:text-blue-100">Aktif Kullanıcılar</p>
                <p className="text-2xl font-bold text-blue-900 dark:text-blue-100">8</p>
              </div>
              <Users className="w-8 h-8 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
          
          <div className="bg-gradient-to-r from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-900/30 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-green-900 dark:text-green-100">Aktif Kanallar</p>
                <p className="text-2xl font-bold text-green-900 dark:text-green-100">5</p>
              </div>
              <MessageSquare className="w-8 h-8 text-green-600 dark:text-green-400" />
            </div>
          </div>
          
          <div className="bg-gradient-to-r from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-900/30 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-purple-900 dark:text-purple-100">Bugünkü Mesajlar</p>
                <p className="text-2xl font-bold text-purple-900 dark:text-purple-100">127</p>
              </div>
              <Activity className="w-8 h-8 text-purple-600 dark:text-purple-400" />
            </div>
          </div>
          
          <div className="bg-gradient-to-r from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-900/30 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-orange-900 dark:text-orange-100">Dosya Paylaşımları</p>
                <p className="text-2xl font-bold text-orange-900 dark:text-orange-100">23</p>
              </div>
              <FileText className="w-8 h-8 text-orange-600 dark:text-orange-400" />
            </div>
          </div>
        </div>

        {/* Proje Kanalları */}
        <div className="mb-6">
          <h4 className="text-md font-semibold text-gray-900 dark:text-white mb-4">Proje Kanalları</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {projects.map(project => (
              <div 
                key={project.id} 
                className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 border-2 border-dashed border-gray-300 dark:border-gray-600 hover:border-primary dark:hover:border-primary-400 transition-colors cursor-pointer"
                onClick={() => onChannelSelect?.(project.id)}
              >
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
                    <MessageSquare className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">#{project.name.replace(/\s+/g, '-').toLowerCase()}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{project.team_size} üye</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Hızlı Eylemler */}
        <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
          <div className="flex items-center space-x-3 mb-3">
            <Zap className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            <h4 className="text-md font-semibold text-gray-900 dark:text-white">Hızlı Eylemler</h4>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <button className="flex items-center space-x-2 p-2 bg-white dark:bg-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors">
              <UserPlus className="w-4 h-4 text-gray-600 dark:text-gray-400" />
              <span className="text-sm text-gray-700 dark:text-gray-300">Yeni Kanal Oluştur</span>
            </button>
            <button className="flex items-center space-x-2 p-2 bg-white dark:bg-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors">
              <Video className="w-4 h-4 text-gray-600 dark:text-gray-400" />
              <span className="text-sm text-gray-700 dark:text-gray-300">Toplantı Başlat</span>
            </button>
            <button className="flex items-center space-x-2 p-2 bg-white dark:bg-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors">
              <FileText className="w-4 h-4 text-gray-600 dark:text-gray-400" />
              <span className="text-sm text-gray-700 dark:text-gray-300">Dosya Paylaş</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  const renderAutoReporting = () => (
    <div className="space-y-6">
      {/* Otomatik Raporlama Kontrol Paneli */}
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Otomatik Raporlama Sistemi</h3>
          <button
            onClick={() => setShowAutoReportingModal(true)}
            className="inline-flex items-center px-4 py-2 bg-primary hover:bg-primary-600 text-white rounded-lg text-sm font-medium transition-colors"
          >
            <FileText className="w-4 h-4 mr-2" />
            Rapor Oluştur
          </button>
        </div>

        {/* Rapor İstatistikleri */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-900/30 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-900 dark:text-blue-100">Haftalık Raporlar</p>
                <p className="text-2xl font-bold text-blue-900 dark:text-blue-100">12</p>
              </div>
              <FileText className="w-8 h-8 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
          
          <div className="bg-gradient-to-r from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-900/30 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-green-900 dark:text-green-100">Aylık Raporlar</p>
                <p className="text-2xl font-bold text-green-900 dark:text-green-100">4</p>
              </div>
              <BarChart3 className="w-8 h-8 text-green-600 dark:text-green-400" />
            </div>
          </div>
          
          <div className="bg-gradient-to-r from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-900/30 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-purple-900 dark:text-purple-100">Özel Raporlar</p>
                <p className="text-2xl font-bold text-purple-900 dark:text-purple-100">8</p>
              </div>
              <TrendingUp className="w-8 h-8 text-purple-600 dark:text-purple-400" />
            </div>
          </div>
          
          <div className="bg-gradient-to-r from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-900/30 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-orange-900 dark:text-orange-100">AI Önerileri</p>
                <p className="text-2xl font-bold text-orange-900 dark:text-orange-100">5</p>
              </div>
              <Brain className="w-8 h-8 text-orange-600 dark:text-orange-400" />
            </div>
          </div>
        </div>

        {/* Rapor Şablonları */}
        <div className="mb-6">
          <h4 className="text-md font-semibold text-gray-900 dark:text-white mb-4">Rapor Şablonları</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 border-2 border-dashed border-gray-300 dark:border-gray-600 hover:border-primary dark:hover:border-primary-400 transition-colors cursor-pointer">
              <div className="text-center">
                <FileText className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                <p className="text-sm font-medium text-gray-900 dark:text-white">Proje Durumu</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">Genel proje durumu raporu</p>
              </div>
            </div>
            
            <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 border-2 border-dashed border-gray-300 dark:border-gray-600 hover:border-primary dark:hover:border-primary-400 transition-colors cursor-pointer">
              <div className="text-center">
                <Users className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                <p className="text-sm font-medium text-gray-900 dark:text-white">Ekip Performansı</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">Ekip üyelerinin performansı</p>
              </div>
            </div>
            
            <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 border-2 border-dashed border-gray-300 dark:border-gray-600 hover:border-primary dark:hover:border-primary-400 transition-colors cursor-pointer">
              <div className="text-center">
                <DollarSign className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                <p className="text-sm font-medium text-gray-900 dark:text-white">Maliyet Analizi</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">Bütçe ve maliyet raporu</p>
              </div>
            </div>
            
            <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 border-2 border-dashed border-gray-300 dark:border-gray-600 hover:border-primary dark:hover:border-primary-400 transition-colors cursor-pointer">
              <div className="text-center">
                <AlertTriangle className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                <p className="text-sm font-medium text-gray-900 dark:text-white">Risk Raporu</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">Risk analizi ve uyarılar</p>
              </div>
            </div>
          </div>
        </div>

        {/* AI Önerileri */}
        <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
          <div className="flex items-center space-x-3 mb-3">
            <Brain className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            <h4 className="text-md font-semibold text-gray-900 dark:text-white">AI Rapor Önerileri</h4>
          </div>
          <div className="space-y-2">
            <div className="flex items-center space-x-3 p-2 bg-white dark:bg-gray-700 rounded-lg">
              <div className="w-2 h-2 bg-red-500 rounded-full"></div>
              <p className="text-sm text-gray-700 dark:text-gray-300">Proje gecikmesi tespit edildi - Acil durum raporu öneriliyor</p>
            </div>
            <div className="flex items-center space-x-3 p-2 bg-white dark:bg-gray-700 rounded-lg">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <p className="text-sm text-gray-700 dark:text-gray-300">Ekip performansı artış gösteriyor - Motivasyon raporu hazırlanabilir</p>
            </div>
            <div className="flex items-center space-x-3 p-2 bg-white dark:bg-gray-700 rounded-lg">
              <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
              <p className="text-sm text-gray-700 dark:text-gray-300">Bütçe aşımı riski - Maliyet kontrol raporu gerekli</p>
            </div>
          </div>
        </div>
      </div>

      {/* Son Raporlar */}
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
        <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Son Raporlar</h4>
        <div className="space-y-4">
          {[
            { id: '1', title: 'Haftalık Proje Durumu Raporu', type: 'Haftalık', date: '2024-01-15', status: 'completed' },
            { id: '2', title: 'Ekip Performans Analizi', type: 'Aylık', date: '2024-01-10', status: 'completed' },
            { id: '3', title: 'Risk Değerlendirme Raporu', type: 'Özel', date: '2024-01-08', status: 'pending' },
            { id: '4', title: 'Maliyet Kontrol Raporu', type: 'Haftalık', date: '2024-01-05', status: 'completed' }
          ].map((report) => (
            <div key={report.id} className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
              <div className="flex items-center space-x-4">
                <FileText className="w-6 h-6 text-gray-400" />
                <div>
                  <h5 className="font-medium text-gray-900 dark:text-white">{report.title}</h5>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{report.type} • {report.date}</p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                  report.status === 'completed' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' :
                  'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                }`}>
                  {report.status === 'completed' ? 'Tamamlandı' : 'Beklemede'}
                </span>
                <button className="text-primary hover:text-primary-600 dark:text-primary-400 dark:hover:text-primary-300">
                  <Download className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Akıllı Proje Yönetimi</h1>
          <p className="text-gray-600 dark:text-gray-400">Proje performansını optimize edin ve riskleri önceden tahmin edin</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={loadData}
            className="inline-flex items-center px-4 py-2 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg text-sm font-medium transition-colors"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Yenile
          </button>
          <FeedbackButton 
            pageSource="smart-project-management" 
            position="inline"
            className="inline-flex items-center px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-medium"
          />
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-gray-200 dark:border-gray-700">
        <nav className="-mb-px flex space-x-8">
                     {[
             { id: 'overview', name: 'Genel Bakış', icon: BarChart3 },
             { id: 'resource-optimization', name: 'Kaynak Optimizasyonu', icon: Users },
             { id: 'risk-analysis', name: 'Risk Analizi', icon: AlertTriangle },
             { id: 'performance-prediction', name: 'Performans Tahminlemesi', icon: TrendingUp },
             { id: 'timeline-management', name: 'Zaman Çizelgesi', icon: Calendar },
             { id: 'advanced-visualizations', name: 'Gelişmiş Görselleştirme', icon: Layers },
             { id: 'real-time-collaboration', name: 'Gerçek Zamanlı İşbirliği', icon: MessageSquare },
             { id: 'auto-reporting', name: 'Otomatik Raporlama', icon: FileText }
           ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center space-x-2 py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === tab.id
                  ? 'border-primary text-primary dark:text-primary-400'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              <span>{tab.name}</span>
            </button>
          ))}
        </nav>
      </div>

             {/* Tab Content */}
               <div className="mt-6">
          {activeTab === 'overview' && renderOverview()}
          {activeTab === 'resource-optimization' && renderResourceOptimization()}
          {activeTab === 'risk-analysis' && renderRiskAnalysis()}
          {activeTab === 'performance-prediction' && renderPerformancePrediction()}
          {activeTab === 'timeline-management' && renderTimelineManagement()}
          {activeTab === 'advanced-visualizations' && renderAdvancedVisualizations()}
          {activeTab === 'real-time-collaboration' && renderRealTimeCollaboration()}
          {activeTab === 'auto-reporting' && renderAutoReporting()}
        </div>

       {/* Yeni Proje Modal */}
       {showNewProjectModal && (
         <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
           <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
             <div className="flex items-center justify-between mb-6">
               <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Yeni Proje Oluştur</h3>
               <button
                 onClick={() => setShowNewProjectModal(false)}
                 className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
               >
                 <X className="w-6 h-6" />
               </button>
             </div>
             
             <div className="space-y-4">
               <div>
                 <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                   Proje Adı
                 </label>
                 <input
                   type="text"
                   value={newProject.name}
                   onChange={(e) => setNewProject({...newProject, name: e.target.value})}
                   className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                   placeholder="Proje adını girin"
                 />
               </div>
               
               <div>
                 <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                   Açıklama
                 </label>
                 <textarea
                   value={newProject.description}
                   onChange={(e) => setNewProject({...newProject, description: e.target.value})}
                   className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                   rows={3}
                   placeholder="Proje açıklamasını girin"
                 />
               </div>
               
               <div className="grid grid-cols-2 gap-4">
                 <div>
                   <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                     Durum
                   </label>
                   <select
                     value={newProject.status}
                     onChange={(e) => setNewProject({...newProject, status: e.target.value as any})}
                     className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                   >
                     <option value="planning">Planlama</option>
                     <option value="active">Aktif</option>
                     <option value="completed">Tamamlandı</option>
                     <option value="on_hold">Beklemede</option>
                   </select>
                 </div>
                 
                 <div>
                   <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                     Öncelik
                   </label>
                   <select
                     value={newProject.priority}
                     onChange={(e) => setNewProject({...newProject, priority: e.target.value as any})}
                     className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                   >
                     <option value="low">Düşük</option>
                     <option value="medium">Orta</option>
                     <option value="high">Yüksek</option>
                     <option value="critical">Kritik</option>
                   </select>
                 </div>
               </div>
               
               <div className="grid grid-cols-2 gap-4">
                 <div>
                   <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                     Başlangıç Tarihi
                   </label>
                   <input
                     type="date"
                     value={newProject.start_date}
                     onChange={(e) => setNewProject({...newProject, start_date: e.target.value})}
                     className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                   />
                 </div>
                 
                 <div>
                   <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                     Bitiş Tarihi
                   </label>
                   <input
                     type="date"
                     value={newProject.end_date}
                     onChange={(e) => setNewProject({...newProject, end_date: e.target.value})}
                     className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                   />
                 </div>
               </div>
               
               <div className="grid grid-cols-2 gap-4">
                 <div>
                   <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                     Bütçe (₺)
                   </label>
                   <input
                     type="number"
                     value={newProject.budget}
                     onChange={(e) => setNewProject({...newProject, budget: parseFloat(e.target.value) || 0})}
                     className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                     placeholder="0"
                   />
                 </div>
                 
                 <div>
                   <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                     Ekip Büyüklüğü
                   </label>
                   <input
                     type="number"
                     value={newProject.team_size}
                     onChange={(e) => setNewProject({...newProject, team_size: parseInt(e.target.value) || 1})}
                     className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                     placeholder="1"
                     min="1"
                   />
                 </div>
               </div>
               
               <div>
                 <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                   Risk Seviyesi
                 </label>
                 <select
                   value={newProject.risk_level}
                   onChange={(e) => setNewProject({...newProject, risk_level: e.target.value as any})}
                   className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                 >
                   <option value="low">Düşük</option>
                   <option value="medium">Orta</option>
                   <option value="high">Yüksek</option>
                 </select>
               </div>
             </div>
             
             <div className="flex justify-end space-x-3 mt-6">
               <button
                 onClick={() => setShowNewProjectModal(false)}
                 className="px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600"
               >
                 İptal
               </button>
               <button
                 onClick={handleCreateProject}
                 disabled={!newProject.name || !newProject.start_date || !newProject.end_date}
                 className="px-4 py-2 bg-primary hover:bg-primary-600 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
               >
                 Proje Oluştur
               </button>
             </div>
           </div>
         </div>
       )}

       {/* Proje Düzenleme Modal */}
       {showEditProjectModal && editingProject && (
         <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
           <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
             <div className="flex items-center justify-between mb-6">
               <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Proje Düzenle</h3>
               <button
                 onClick={() => setShowEditProjectModal(false)}
                 className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
               >
                 <X className="w-6 h-6" />
               </button>
             </div>
             
             <div className="space-y-4">
               <div>
                 <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                   Proje Adı
                 </label>
                 <input
                   type="text"
                   value={editingProject.name}
                   onChange={(e) => setEditingProject({...editingProject, name: e.target.value})}
                   className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                 />
               </div>
               
               <div>
                 <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                   Açıklama
                 </label>
                 <textarea
                   value={editingProject.description}
                   onChange={(e) => setEditingProject({...editingProject, description: e.target.value})}
                   className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                   rows={3}
                 />
               </div>
               
               <div className="grid grid-cols-2 gap-4">
                 <div>
                   <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                     Durum
                   </label>
                   <select
                     value={editingProject.status}
                     onChange={(e) => setEditingProject({...editingProject, status: e.target.value as any})}
                     className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                   >
                     <option value="planning">Planlama</option>
                     <option value="active">Aktif</option>
                     <option value="completed">Tamamlandı</option>
                     <option value="on_hold">Beklemede</option>
                   </select>
                 </div>
                 
                 <div>
                   <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                     Öncelik
                   </label>
                   <select
                     value={editingProject.priority}
                     onChange={(e) => setEditingProject({...editingProject, priority: e.target.value as any})}
                     className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                   >
                     <option value="low">Düşük</option>
                     <option value="medium">Orta</option>
                     <option value="high">Yüksek</option>
                     <option value="critical">Kritik</option>
                   </select>
                 </div>
               </div>
               
               <div className="grid grid-cols-2 gap-4">
                 <div>
                   <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                     Başlangıç Tarihi
                   </label>
                   <input
                     type="date"
                     value={editingProject.start_date}
                     onChange={(e) => setEditingProject({...editingProject, start_date: e.target.value})}
                     className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                   />
                 </div>
                 
                 <div>
                   <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                     Bitiş Tarihi
                   </label>
                   <input
                     type="date"
                     value={editingProject.end_date}
                     onChange={(e) => setEditingProject({...editingProject, end_date: e.target.value})}
                     className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                   />
                 </div>
               </div>
               
               <div className="grid grid-cols-3 gap-4">
                 <div>
                   <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                     Bütçe (₺)
                   </label>
                   <input
                     type="number"
                     value={editingProject.budget}
                     onChange={(e) => setEditingProject({...editingProject, budget: parseFloat(e.target.value) || 0})}
                     className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                   />
                 </div>
                 
                 <div>
                   <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                     Gerçek Maliyet (₺)
                   </label>
                   <input
                     type="number"
                     value={editingProject.actual_cost}
                     onChange={(e) => setEditingProject({...editingProject, actual_cost: parseFloat(e.target.value) || 0})}
                     className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                   />
                 </div>
                 
                 <div>
                   <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                     Ekip Büyüklüğü
                   </label>
                   <input
                     type="number"
                     value={editingProject.team_size}
                     onChange={(e) => setEditingProject({...editingProject, team_size: parseInt(e.target.value) || 1})}
                     className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                     min="1"
                   />
                 </div>
               </div>
               
               <div>
                 <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                   Risk Seviyesi
                 </label>
                 <select
                   value={editingProject.risk_level}
                   onChange={(e) => setEditingProject({...editingProject, risk_level: e.target.value as any})}
                   className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                 >
                   <option value="low">Düşük</option>
                   <option value="medium">Orta</option>
                   <option value="high">Yüksek</option>
                 </select>
               </div>
             </div>
             
             <div className="flex justify-end space-x-3 mt-6">
               <button
                 onClick={() => setShowEditProjectModal(false)}
                 className="px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600"
               >
                 İptal
               </button>
               <button
                 onClick={handleUpdateProject}
                 className="px-4 py-2 bg-primary hover:bg-primary-600 text-white rounded-lg"
               >
                 Güncelle
               </button>
             </div>
           </div>
         </div>
       )}

               {/* Takım Chat Modal */}
        {showTeamChatModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-gray-800 rounded-lg w-full max-w-6xl max-h-[95vh] overflow-hidden">
              <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Proje Takım Chat Sistemi</h3>
                <button
                  onClick={() => setShowTeamChatModal(false)}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
              <div className="h-[calc(95vh-80px)]">
                <EmployeeChat
                  currentUserId="1"
                  currentUserName="Proje Yöneticisi"
                  currentUserRole="Admin"
                  currentUserDepartment="Yönetim"
                />
              </div>
            </div>
          </div>
        )}

        {/* Otomatik Raporlama Modal */}
        {showAutoReportingModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Otomatik Raporlama Sistemi</h3>
                <button
                  onClick={() => setShowAutoReportingModal(false)}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
             
             <div className="space-y-6">
               {/* Rapor Kontrol Paneli */}
               <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                 <div className="bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-900/30 rounded-lg p-4">
                   <div className="flex items-center justify-between">
                     <div>
                       <p className="text-sm font-medium text-blue-900 dark:text-blue-100">Haftalık Raporlar</p>
                       <p className="text-2xl font-bold text-blue-900 dark:text-blue-100">12</p>
                     </div>
                     <FileText className="w-8 h-8 text-blue-600 dark:text-blue-400" />
                   </div>
                 </div>
                 
                 <div className="bg-gradient-to-r from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-900/30 rounded-lg p-4">
                   <div className="flex items-center justify-between">
                     <div>
                       <p className="text-sm font-medium text-green-900 dark:text-green-100">Aylık Raporlar</p>
                       <p className="text-2xl font-bold text-green-900 dark:text-green-100">4</p>
                     </div>
                     <BarChart3 className="w-8 h-8 text-green-600 dark:text-green-400" />
                   </div>
                 </div>
                 
                 <div className="bg-gradient-to-r from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-900/30 rounded-lg p-4">
                   <div className="flex items-center justify-between">
                     <div>
                       <p className="text-sm font-medium text-purple-900 dark:text-purple-100">Özel Raporlar</p>
                       <p className="text-2xl font-bold text-purple-900 dark:text-purple-100">8</p>
                     </div>
                     <TrendingUp className="w-8 h-8 text-purple-600 dark:text-purple-400" />
                   </div>
                 </div>
               </div>

               {/* Rapor Şablonları */}
               <div>
                 <h4 className="text-md font-semibold text-gray-900 dark:text-white mb-4">Rapor Şablonları</h4>
                 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                   <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 border-2 border-dashed border-gray-300 dark:border-gray-600 hover:border-primary dark:hover:border-primary-400 transition-colors cursor-pointer">
                     <div className="text-center">
                       <FileText className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                       <p className="text-sm font-medium text-gray-900 dark:text-white">Proje Durumu</p>
                       <p className="text-xs text-gray-500 dark:text-gray-400">Genel proje durumu raporu</p>
                     </div>
                   </div>
                   
                   <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 border-2 border-dashed border-gray-300 dark:border-gray-600 hover:border-primary dark:hover:border-primary-400 transition-colors cursor-pointer">
                     <div className="text-center">
                       <Users className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                       <p className="text-sm font-medium text-gray-900 dark:text-white">Ekip Performansı</p>
                       <p className="text-xs text-gray-500 dark:text-gray-400">Ekip üyelerinin performansı</p>
                     </div>
                   </div>
                   
                   <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 border-2 border-dashed border-gray-300 dark:border-gray-600 hover:border-primary dark:hover:border-primary-400 transition-colors cursor-pointer">
                     <div className="text-center">
                       <DollarSign className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                       <p className="text-sm font-medium text-gray-900 dark:text-white">Maliyet Analizi</p>
                       <p className="text-xs text-gray-500 dark:text-gray-400">Bütçe ve maliyet raporu</p>
                     </div>
                   </div>
                   
                   <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 border-2 border-dashed border-gray-300 dark:border-gray-600 hover:border-primary dark:hover:border-primary-400 transition-colors cursor-pointer">
                     <div className="text-center">
                       <AlertTriangle className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                       <p className="text-sm font-medium text-gray-900 dark:text-white">Risk Raporu</p>
                       <p className="text-xs text-gray-500 dark:text-gray-400">Risk analizi ve uyarılar</p>
                     </div>
                   </div>
                 </div>
               </div>

               {/* AI Önerileri */}
               <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
                 <div className="flex items-center space-x-3 mb-3">
                   <Brain className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                   <h4 className="text-md font-semibold text-gray-900 dark:text-white">AI Rapor Önerileri</h4>
                 </div>
                 <div className="space-y-2">
                   <div className="flex items-center space-x-3 p-2 bg-white dark:bg-gray-700 rounded-lg">
                     <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                     <p className="text-sm text-gray-700 dark:text-gray-300">Proje gecikmesi tespit edildi - Acil durum raporu öneriliyor</p>
                   </div>
                   <div className="flex items-center space-x-3 p-2 bg-white dark:bg-gray-700 rounded-lg">
                     <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                     <p className="text-sm text-gray-700 dark:text-gray-300">Ekip performansı artış gösteriyor - Motivasyon raporu hazırlanabilir</p>
                   </div>
                   <div className="flex items-center space-x-3 p-2 bg-white dark:bg-gray-700 rounded-lg">
                     <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                     <p className="text-sm text-gray-700 dark:text-gray-300">Bütçe aşımı riski - Maliyet kontrol raporu gerekli</p>
                   </div>
                 </div>
               </div>
             </div>
           </div>
         </div>
       )}
     </div>
   );
 };

export default SmartProjectManagement;
