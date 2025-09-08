import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Calendar, 
  TrendingUp, 
  AlertTriangle, 
  Clock, 
  DollarSign, 
  BarChart3,
  CheckCircle,
  Activity,
  Zap,
  Brain,
  RefreshCw,
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
  Video,
  Grid3X3,
  List,
  Move,
  Target
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import AdvancedChartInteractivity, { DataPoint, ChartAnnotation } from './common/AdvancedChartInteractivity';
import { useSupabase } from '../hooks/useSupabase';
import { toast } from 'react-hot-toast';
import EmployeeChat from './EmployeeChat';
import FeedbackButton from './common/FeedbackButton';
import { ProjectTableSkeleton, DashboardCardSkeleton, LoadingWrapper } from './common/SkeletonLoader';
import AdvancedButton, { IconButton } from './common/AdvancedButton';
import { StatCard } from './common/AdvancedCard';
import { ErrorState, EmptyState } from './common/ErrorStates';

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

interface ProjectColumn {
  id: string;
  name: string;
  status: string;
  color: string;
  icon: string;
  order: number;
  isDefault: boolean;
}


interface SmartProjectManagementProps {
  onChannelSelect?: (channelId: string) => void;
}

const SmartProjectManagement: React.FC<SmartProjectManagementProps> = ({ onChannelSelect }) => {
  const { supabase } = useSupabase();
  const [activeTab, setActiveTab] = useState('overview');
  const [projects, setProjects] = useState<Project[]>([]);
  const [resources, setResources] = useState<Resource[]>([]);
  const [loading, setLoading] = useState(true);
  const [isProjectsLoading, setIsProjectsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showNewProjectModal, setShowNewProjectModal] = useState(false);
  const [showEditProjectModal, setShowEditProjectModal] = useState(false);
  const [showProjectDetailModal, setShowProjectDetailModal] = useState(false);
  const [activeProjectTab, setActiveProjectTab] = useState<'overview' | 'team' | 'timeline' | 'analytics' | 'files'>('overview');
  const [showAutoReportingModal, setShowAutoReportingModal] = useState(false);
  const [showTeamChatModal, setShowTeamChatModal] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [viewingProject, setViewingProject] = useState<Project | null>(null);
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
  
  // Kanban board için state'ler
  const [viewMode, setViewMode] = useState<'list' | 'kanban'>('list');
  const [draggedProject, setDraggedProject] = useState<Project | null>(null);
  const [columns, setColumns] = useState<ProjectColumn[]>([]);
  const [showColumnModal, setShowColumnModal] = useState(false);
  const [editingColumn, setEditingColumn] = useState<ProjectColumn | null>(null);
  const [newColumn, setNewColumn] = useState<Partial<ProjectColumn>>({
    name: '',
    status: '',
    color: 'blue',
    icon: 'Calendar',
    order: 0,
    isDefault: false
  });

  // Advanced Interactivity States
  const [enableAdvancedInteractivity, setEnableAdvancedInteractivity] = useState(false);
  const [projectStatusDataPoints, setProjectStatusDataPoints] = useState<DataPoint[]>([]);
  const [projectPriorityDataPoints, setProjectPriorityDataPoints] = useState<DataPoint[]>([]);
  const [drillDownLevel, setDrillDownLevel] = useState(0);
  const [drillDownPath, setDrillDownPath] = useState<string[]>([]);

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

  // Varsayılan sütunlar
  const defaultColumns: ProjectColumn[] = [
    { id: 'planning', name: 'Planlama', status: 'planning', color: 'blue', icon: 'Calendar', order: 1, isDefault: true },
    { id: 'active', name: 'Aktif', status: 'active', color: 'green', icon: 'Activity', order: 2, isDefault: true },
    { id: 'on_hold', name: 'Beklemede', status: 'on_hold', color: 'yellow', icon: 'Clock', order: 3, isDefault: true },
    { id: 'completed', name: 'Tamamlandı', status: 'completed', color: 'gray', icon: 'CheckCircle', order: 4, isDefault: true }
  ];

  // İkon seçenekleri
  const iconOptions = [
    { value: 'Calendar', label: 'Takvim', icon: Calendar },
    { value: 'Activity', label: 'Aktivite', icon: Activity },
    { value: 'Clock', label: 'Saat', icon: Clock },
    { value: 'CheckCircle', label: 'Onay', icon: CheckCircle },
    { value: 'AlertTriangle', label: 'Uyarı', icon: AlertTriangle },
    { value: 'Users', label: 'Kullanıcılar', icon: Users },
    { value: 'Target', label: 'Hedef', icon: Target },
    { value: 'Zap', label: 'Şimşek', icon: Zap },
    { value: 'Brain', label: 'Beyin', icon: Brain },
    { value: 'Layers', label: 'Katmanlar', icon: Layers }
  ];

  // Renk seçenekleri
  const colorOptions = [
    { value: 'blue', label: 'Mavi', class: 'text-blue-600 dark:text-blue-400' },
    { value: 'green', label: 'Yeşil', class: 'text-green-600 dark:text-green-400' },
    { value: 'yellow', label: 'Sarı', class: 'text-yellow-600 dark:text-yellow-400' },
    { value: 'red', label: 'Kırmızı', class: 'text-red-600 dark:text-red-400' },
    { value: 'purple', label: 'Mor', class: 'text-purple-600 dark:text-purple-400' },
    { value: 'pink', label: 'Pembe', class: 'text-pink-600 dark:text-pink-400' },
    { value: 'indigo', label: 'İndigo', class: 'text-indigo-600 dark:text-indigo-400' },
    { value: 'gray', label: 'Gri', class: 'text-gray-600 dark:text-gray-400' }
  ];

  useEffect(() => {
    loadData();
    loadColumns();
  }, []);

  // Advanced Interactivity - Veri dönüştürme
  useEffect(() => {
    if (enableAdvancedInteractivity) {
      console.log('Smart Project Management - Advanced Interactivity Enabled');
      console.log('Drill Down Level:', drillDownLevel);
      console.log('Drill Down Path:', drillDownPath);
      
      // Project status verilerini DataPoint formatına dönüştür
      let statusPoints: DataPoint[] = [];
      
      if (drillDownLevel === 0) {
        // Seviye 0: Genel proje durumları
        const statusCounts = projects.reduce((acc, project) => {
          acc[project.status] = (acc[project.status] || 0) + 1;
          return acc;
        }, {} as Record<string, number>);
        
        statusPoints = Object.entries(statusCounts).map(([status, count], index) => ({
          id: `status-${index}`,
          x: status === 'planning' ? 'Planlama' : 
             status === 'active' ? 'Aktif' : 
             status === 'completed' ? 'Tamamlandı' : 'Beklemede',
          y: count,
          label: `${count} proje`,
          metadata: { status, count }
        }));
      } else if (drillDownLevel === 1) {
        // Seviye 1: Detaylı durum analizi
        statusPoints = [
          { id: 'status-planning-detail', x: 'Planlama Aşaması', y: 8, label: '8 proje', metadata: { status: 'planning' } },
          { id: 'status-active-detail', x: 'Aktif Projeler', y: 12, label: '12 proje', metadata: { status: 'active' } },
          { id: 'status-completed-detail', x: 'Tamamlanan', y: 15, label: '15 proje', metadata: { status: 'completed' } },
          { id: 'status-onhold-detail', x: 'Beklemede', y: 3, label: '3 proje', metadata: { status: 'on_hold' } }
        ];
      } else {
        // Seviye 2: Aylık detaylar
        statusPoints = [
          { id: 'status-jan', x: 'Ocak', y: 5, label: '5 proje', metadata: { month: 'january' } },
          { id: 'status-feb', x: 'Şubat', y: 7, label: '7 proje', metadata: { month: 'february' } },
          { id: 'status-mar', x: 'Mart', y: 9, label: '9 proje', metadata: { month: 'march' } },
          { id: 'status-apr', x: 'Nisan', y: 6, label: '6 proje', metadata: { month: 'april' } }
        ];
      }
      
      // Project priority verilerini DataPoint formatına dönüştür
      let priorityPoints: DataPoint[] = [];
      
      if (drillDownLevel === 0) {
        // Seviye 0: Öncelik bazında projeler
        const priorityCounts = projects.reduce((acc, project) => {
          acc[project.priority] = (acc[project.priority] || 0) + 1;
          return acc;
        }, {} as Record<string, number>);
        
        priorityPoints = Object.entries(priorityCounts).map(([priority, count], index) => ({
          id: `priority-${index}`,
          x: priority === 'low' ? 'Düşük' : 
             priority === 'medium' ? 'Orta' : 
             priority === 'high' ? 'Yüksek' : 'Kritik',
          y: count,
          label: `${count} proje`,
          metadata: { priority, count }
        }));
      } else if (drillDownLevel === 1) {
        // Seviye 1: Öncelik detayları
        priorityPoints = [
          { id: 'priority-low-detail', x: 'Düşük Öncelik', y: 6, label: '6 proje', metadata: { priority: 'low' } },
          { id: 'priority-medium-detail', x: 'Orta Öncelik', y: 18, label: '18 proje', metadata: { priority: 'medium' } },
          { id: 'priority-high-detail', x: 'Yüksek Öncelik', y: 10, label: '10 proje', metadata: { priority: 'high' } },
          { id: 'priority-critical-detail', x: 'Kritik Öncelik', y: 4, label: '4 proje', metadata: { priority: 'critical' } }
        ];
      } else {
        // Seviye 2: Bütçe bazında detaylar
        priorityPoints = [
          { id: 'priority-budget-low', x: '0-10K ₺', y: 8, label: '8 proje', metadata: { budgetRange: '0-10k' } },
          { id: 'priority-budget-medium', x: '10-50K ₺', y: 15, label: '15 proje', metadata: { budgetRange: '10-50k' } },
          { id: 'priority-budget-high', x: '50-100K ₺', y: 12, label: '12 proje', metadata: { budgetRange: '50-100k' } },
          { id: 'priority-budget-critical', x: '100K+ ₺', y: 3, label: '3 proje', metadata: { budgetRange: '100k+' } }
        ];
      }
      
      console.log('Project Status Points:', statusPoints);
      console.log('Project Priority Points:', priorityPoints);
      setProjectStatusDataPoints(statusPoints);
      setProjectPriorityDataPoints(priorityPoints);
    }
  }, [enableAdvancedInteractivity, drillDownLevel, drillDownPath, projects]);

  // Event handlers
  const handleProjectStatusDataUpdate = (updatedData: DataPoint[]) => {
    console.log('Project Status Data Updated:', updatedData);
    setProjectStatusDataPoints(updatedData);
  };

  const handleProjectPriorityDataUpdate = (updatedData: DataPoint[]) => {
    console.log('Project Priority Data Updated:', updatedData);
    setProjectPriorityDataPoints(updatedData);
  };


  const handleAnnotationAdd = (annotation: ChartAnnotation) => {
    console.log('Annotation Added:', annotation);
  };

  const handleAnnotationUpdate = (annotation: ChartAnnotation) => {
    console.log('Annotation Updated:', annotation);
  };

  const handleDrillDown = (path: string) => {
    console.log('Drill Down:', path);
    setDrillDownPath([...drillDownPath, path]);
    setDrillDownLevel(drillDownLevel + 1);
  };

  const handleDrillUp = () => {
    console.log('Drill Up');
    if (drillDownLevel > 0) {
      setDrillDownLevel(drillDownLevel - 1);
      setDrillDownPath(drillDownPath.slice(0, -1));
    }
  };

  const loadColumns = async () => {
    try {
      if (supabase) {
        const { data: columnsData, error: columnsError } = await supabase
          .from('project_columns')
          .select('*')
          .order('order', { ascending: true });

        if (columnsError) {
          console.error('❌ Sütunlar yükleme hatası:', columnsError);
          setColumns(defaultColumns);
        } else {
          console.log('✅ Sütunlar yüklendi:', columnsData?.length || 0);
          setColumns(columnsData && columnsData.length > 0 ? columnsData : defaultColumns);
        }
      } else {
        setColumns(defaultColumns);
      }
    } catch (error) {
      console.error('❌ Sütun yükleme hatası:', error);
      setColumns(defaultColumns);
    }
  };

  const loadData = async () => {
    setLoading(true);
    setIsProjectsLoading(true);
    setError(null);
    try {
      console.log('🔄 Veri yükleniyor...');
      
      // Supabase bağlantısını test et
      const { data: _testData, error: testError } = await supabase
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
        setLoading(false);
        setIsProjectsLoading(false);
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


      setLoading(false);
      setIsProjectsLoading(false);
      console.log('🎉 Veri yükleme tamamlandı');
      
    } catch (error) {
      console.error('❌ Veri yükleme hatası:', error);
      setError('Veri yüklenirken hata oluştu');
      
      // Hata durumunda mock data kullan
      setProjects(mockProjects);
      setResources(mockResources);
      setLoading(false);
      setIsProjectsLoading(false);
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

  // Teslim tarihine göre değerleme fonksiyonu
  const getDeliveryStatus = (project: Project) => {
    if (!project.end_date) return { status: 'Belirtilmemiş', color: 'gray', percentage: 0 };
    
    const today = new Date();
    const endDate = new Date(project.end_date);
    const startDate = new Date(project.start_date);
    
    const totalDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    const passedDays = Math.ceil((today.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    const remainingDays = Math.ceil((endDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    
    const timeProgress = Math.min(Math.max((passedDays / totalDays) * 100, 0), 100);
    
    if (remainingDays < 0) {
      return { 
        status: `${Math.abs(remainingDays)} gün gecikme`, 
        color: 'red', 
        percentage: timeProgress 
      };
    } else if (remainingDays <= 7) {
      return { 
        status: `${remainingDays} gün kaldı`, 
        color: 'yellow', 
        percentage: timeProgress 
      };
    } else {
      return { 
        status: `${remainingDays} gün kaldı`, 
        color: 'green', 
        percentage: timeProgress 
      };
    }
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
    setViewingProject(project);
    setActiveProjectTab('overview'); // Tab'ı her açılışta sıfırla
    setShowProjectDetailModal(true);
    toast.success(`${project.name} projesi detayları görüntüleniyor`);
  };

  // Sürükle-bırak fonksiyonları
  const handleDragStart = (e: React.DragEvent, project: Project) => {
    setDraggedProject(project);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = async (e: React.DragEvent, newStatus: Project['status']) => {
    e.preventDefault();
    
    if (!draggedProject || draggedProject.status === newStatus) {
      setDraggedProject(null);
      return;
    }

    try {
      // Proje durumunu güncelle
      const updatedProject = { ...draggedProject, status: newStatus };
      
      // Supabase'de güncelle
      if (supabase) {
        const { error } = await supabase
          .from('projects')
          .update({ status: newStatus })
          .eq('id', draggedProject.id);

        if (error) {
          console.error('❌ Proje durumu güncelleme hatası:', error);
          toast.error('Proje durumu güncellenirken hata oluştu');
          return;
        }
      }

      // Local state'i güncelle
      setProjects(prev => 
        prev.map(p => p.id === draggedProject.id ? updatedProject : p)
      );

      toast.success(`${draggedProject.name} projesi ${getStatusText(newStatus)} durumuna taşındı`);
    } catch (error) {
      console.error('❌ Proje durumu güncelleme hatası:', error);
      toast.error('Proje durumu güncellenirken hata oluştu');
    } finally {
      setDraggedProject(null);
    }
  };

  const getStatusText = (status: Project['status']) => {
    switch (status) {
      case 'planning': return 'Planlama';
      case 'active': return 'Aktif';
      case 'completed': return 'Tamamlandı';
      case 'on_hold': return 'Beklemede';
      default: return status;
    }
  };

  // Sütun yönetimi fonksiyonları
  const handleAddColumn = () => {
    setEditingColumn(null);
    setNewColumn({
      name: '',
      status: '',
      color: 'blue',
      icon: 'Calendar',
      order: columns.length + 1,
      isDefault: false
    });
    setShowColumnModal(true);
  };

  const handleEditColumn = (column: ProjectColumn) => {
    setEditingColumn(column);
    setNewColumn(column);
    setShowColumnModal(true);
  };

  const handleSaveColumn = async () => {
    if (!newColumn.name || !newColumn.status) {
      toast.error('Sütun adı ve durum alanları zorunludur');
      return;
    }

    try {
      if (editingColumn) {
        // Sütun güncelleme
        if (supabase) {
          const { error } = await supabase
            .from('project_columns')
            .update(newColumn)
            .eq('id', editingColumn.id);

          if (error) {
            console.error('❌ Sütun güncelleme hatası:', error);
            toast.error('Sütun güncellenirken hata oluştu');
            return;
          }
        }

        setColumns(prev => prev.map(col => 
          col.id === editingColumn.id ? { ...col, ...newColumn } : col
        ));
        toast.success('Sütun başarıyla güncellendi');
      } else {
        // Yeni sütun ekleme
        const columnData = {
          ...newColumn,
          id: `custom_${Date.now()}`,
          order: columns.length + 1
        };

        if (supabase) {
          const { error } = await supabase
            .from('project_columns')
            .insert([columnData]);

          if (error) {
            console.error('❌ Sütun ekleme hatası:', error);
            toast.error('Sütun eklenirken hata oluştu');
            return;
          }
        }

        setColumns(prev => [...prev, columnData as ProjectColumn]);
        toast.success('Yeni sütun başarıyla eklendi');
      }

      setShowColumnModal(false);
      setEditingColumn(null);
      setNewColumn({
        name: '',
        status: '',
        color: 'blue',
        icon: 'Calendar',
        order: 0,
        isDefault: false
      });
    } catch (error) {
      console.error('❌ Sütun kaydetme hatası:', error);
      toast.error('Sütun kaydedilirken hata oluştu');
    }
  };

  const handleDeleteColumn = async (columnId: string) => {
    const column = columns.find(col => col.id === columnId);
    if (!column) return;

    if (column.isDefault) {
      toast.error('Varsayılan sütunlar silinemez');
      return;
    }

    // Bu sütundaki projeleri varsayılan sütuna taşı
    const projectsInColumn = projects.filter(p => p.status === column.status);
    if (projectsInColumn.length > 0) {
      toast.error('Bu sütunda projeler bulunuyor. Önce projeleri başka sütunlara taşıyın');
      return;
    }

    try {
      if (supabase) {
        const { error } = await supabase
          .from('project_columns')
          .delete()
          .eq('id', columnId);

        if (error) {
          console.error('❌ Sütun silme hatası:', error);
          toast.error('Sütun silinirken hata oluştu');
          return;
        }
      }

      setColumns(prev => prev.filter(col => col.id !== columnId));
      toast.success('Sütun başarıyla silindi');
    } catch (error) {
      console.error('❌ Sütun silme hatası:', error);
      toast.error('Sütun silinirken hata oluştu');
    }
  };

  // Kanban board render fonksiyonu
  const renderKanbanBoard = () => {
    const sortedColumns = [...columns].sort((a, b) => a.order - b.order);

    return (
      <div className={`grid gap-6 ${sortedColumns.length <= 2 ? 'grid-cols-1 md:grid-cols-2' : sortedColumns.length <= 3 ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3' : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'}`}>
        {sortedColumns.map((column) => {
          const columnProjects = projects.filter(p => p.status === column.status);
          const iconOption = iconOptions.find(opt => opt.value === column.icon);
          const IconComponent = iconOption?.icon || Calendar;
          
          return (
            <div
              key={column.id}
              className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 min-h-[600px]"
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, column.status as Project['status'])}
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-2">
                  <IconComponent className={`w-5 h-5 text-${column.color}-600 dark:text-${column.color}-400`} />
                  <h3 className="font-semibold text-gray-900 dark:text-white">{column.name}</h3>
                  <span className="bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400 text-xs px-2 py-1 rounded-full">
                    {columnProjects.length}
                  </span>
                </div>
                <div className="flex items-center space-x-1">
                  <button
                    onClick={() => handleEditColumn(column)}
                    className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                    title="Sütunu Düzenle"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  {!column.isDefault && (
                    <button
                      onClick={() => handleDeleteColumn(column.id)}
                      className="text-gray-400 hover:text-red-600 dark:hover:text-red-400"
                      title="Sütunu Sil"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
              
              <div className="space-y-3">
                {columnProjects.map((project) => (
                  <div
                    key={project.id}
                    draggable
                    onDragStart={(e) => handleDragStart(e, project)}
                    className={`bg-white dark:bg-gray-700 rounded-lg p-4 shadow-sm border border-gray-200 dark:border-gray-600 cursor-move hover:shadow-md transition-shadow ${
                      draggedProject?.id === project.id ? 'opacity-50' : ''
                    }`}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <h4 className="font-medium text-gray-900 dark:text-white text-sm line-clamp-2">
                        {project.name}
                      </h4>
                      <Move className="w-4 h-4 text-gray-400" />
                    </div>
                    
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-3 line-clamp-2">
                      {project.description}
                    </p>
                    
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-gray-500 dark:text-gray-400">İlerleme</span>
                        <span className="text-gray-900 dark:text-white font-medium">{project.progress}%</span>
                      </div>
                      <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-1.5">
                        <div 
                          className="bg-primary h-1.5 rounded-full transition-all duration-300"
                          style={{ width: `${project.progress}%` }}
                        ></div>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between mt-3 text-xs">
                      <span className="text-gray-500 dark:text-gray-400">
                        ₺{project.actual_cost.toLocaleString()}
                      </span>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        calculateRiskScore(project) < 30 ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' :
                        calculateRiskScore(project) < 60 ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' :
                        'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                      }`}>
                        Risk: {calculateRiskScore(project).toFixed(0)}%
                      </span>
                    </div>
                    
                    <div className="flex items-center justify-between mt-3">
                      <div className="flex space-x-1">
                        <button 
                          onClick={() => handleViewProject(project)}
                          className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300"
                          title="Görüntüle"
                        >
                          <Eye className="w-3 h-3" />
                        </button>
                        <button 
                          onClick={() => handleEditProject(project)}
                          className="text-green-600 hover:text-green-900 dark:text-green-400 dark:hover:text-green-300"
                          title="Düzenle"
                        >
                          <Edit className="w-3 h-3" />
                        </button>
                        <button 
                          onClick={() => handleDeleteProject(project.id)}
                          className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                          title="Sil"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {project.team_size} kişi
                      </span>
                    </div>
                  </div>
                ))}
                
                {columnProjects.length === 0 && (
                  <div className="text-center py-8 text-gray-500 dark:text-gray-400 text-sm">
                    Bu durumda proje yok
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  const renderOverview = () => {
    if (error) {
      return (
        <ErrorState
          type="error"
          title="Veri Yükleme Hatası"
          message={error}
          action={{
            label: 'Tekrar Dene',
            onClick: loadData
          }}
        />
      );
    }

    return (
    <div className="space-y-6">
      {/* Proje Özeti */}
        <LoadingWrapper 
          isLoading={loading} 
          skeleton={
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[1,2,3,4].map(i => <DashboardCardSkeleton key={i} />)}
            </div>
          }
        >
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard
            title="Aktif Projeler"
            value={projects.filter(p => p.status === 'active').length}
            icon={<Activity className="w-6 h-6" />}
            color="blue"
          />
          
          <StatCard
            title="Toplam Bütçe"
            value={`₺${projects.reduce((sum, p) => sum + p.budget, 0).toLocaleString()}`}
            icon={<DollarSign className="w-6 h-6" />}
            color="green"
          />
          
          <StatCard
            title="Ortalama İlerleme"
            value={`${Math.round(projects.reduce((sum, p) => sum + p.progress, 0) / projects.length)}%`}
            icon={<TrendingUp className="w-6 h-6" />}
            color="purple"
          />
          
          <StatCard
            title="Risk Skoru"
            value={Math.round(projects.reduce((sum, p) => sum + calculateRiskScore(p), 0) / projects.length)}
            icon={<AlertTriangle className="w-6 h-6" />}
            color="red"
          />
            </div>

      {/* Advanced Interactivity Charts */}
      {enableAdvancedInteractivity && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Project Status Chart */}
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                {drillDownLevel === 0 ? 'Proje Durumları' : 
                 drillDownLevel === 1 ? 'Detaylı Durum Analizi' : 
                 'Aylık Proje Trendi'}
              </h3>
              {enableAdvancedInteractivity && (
                <div className="flex items-center space-x-2">
                  <span className="text-xs text-gray-600 dark:text-gray-400">
                    Seviye {drillDownLevel + 1}
                  </span>
                  {drillDownLevel > 0 && (
                    <button
                      onClick={handleDrillUp}
                      className="px-2 py-1 text-xs bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded hover:bg-gray-200 dark:hover:bg-gray-600"
                    >
                      ↑ Yukarı
                    </button>
                  )}
          </div>
              )}
        </div>

            <AdvancedChartInteractivity
              data={projectStatusDataPoints}
              onDataUpdate={handleProjectStatusDataUpdate}
              onAnnotationAdd={handleAnnotationAdd}
              onAnnotationUpdate={handleAnnotationUpdate}
              drillDownLevel={drillDownLevel}
              onDrillDown={handleDrillDown}
              onDrillUp={handleDrillUp}
            >
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={drillDownLevel === 0 ? [
                      { name: 'Planlama', value: projects.filter(p => p.status === 'planning').length, color: '#3B82F6' },
                      { name: 'Aktif', value: projects.filter(p => p.status === 'active').length, color: '#10B981' },
                      { name: 'Tamamlandı', value: projects.filter(p => p.status === 'completed').length, color: '#8B5CF6' },
                      { name: 'Beklemede', value: projects.filter(p => p.status === 'on_hold').length, color: '#F59E0B' }
                    ] : drillDownLevel === 1 ? [
                      { name: 'Planlama Aşaması', value: 8, color: '#3B82F6' },
                      { name: 'Aktif Projeler', value: 12, color: '#10B981' },
                      { name: 'Tamamlanan', value: 15, color: '#8B5CF6' },
                      { name: 'Beklemede', value: 3, color: '#F59E0B' }
                    ] : [
                      { name: 'Ocak', value: 5, color: '#3B82F6' },
                      { name: 'Şubat', value: 7, color: '#10B981' },
                      { name: 'Mart', value: 9, color: '#8B5CF6' },
                      { name: 'Nisan', value: 6, color: '#F59E0B' }
                    ]}
                    cx="50%"
                    cy="50%"
                    outerRadius={100}
                    dataKey="value"
                    label={({ name, value }) => `${name}: ${value}`}
                  >
                    {(drillDownLevel === 0 ? [
                      { name: 'Planlama', value: projects.filter(p => p.status === 'planning').length, color: '#3B82F6' },
                      { name: 'Aktif', value: projects.filter(p => p.status === 'active').length, color: '#10B981' },
                      { name: 'Tamamlandı', value: projects.filter(p => p.status === 'completed').length, color: '#8B5CF6' },
                      { name: 'Beklemede', value: projects.filter(p => p.status === 'on_hold').length, color: '#F59E0B' }
                    ] : drillDownLevel === 1 ? [
                      { name: 'Planlama Aşaması', value: 8, color: '#3B82F6' },
                      { name: 'Aktif Projeler', value: 12, color: '#10B981' },
                      { name: 'Tamamlanan', value: 15, color: '#8B5CF6' },
                      { name: 'Beklemede', value: 3, color: '#F59E0B' }
                    ] : [
                      { name: 'Ocak', value: 5, color: '#3B82F6' },
                      { name: 'Şubat', value: 7, color: '#10B981' },
                      { name: 'Mart', value: 9, color: '#8B5CF6' },
                      { name: 'Nisan', value: 6, color: '#F59E0B' }
                    ]).map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </AdvancedChartInteractivity>
        </div>

          {/* Project Priority Chart */}
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                {drillDownLevel === 0 ? 'Proje Öncelikleri' : 
                 drillDownLevel === 1 ? 'Öncelik Detay Analizi' : 
                 'Bütçe Bazında Analiz'}
              </h3>
              {enableAdvancedInteractivity && (
                <div className="flex items-center space-x-2">
                  <span className="text-xs text-gray-600 dark:text-gray-400">
                    Seviye {drillDownLevel + 1}
                  </span>
                  {drillDownLevel > 0 && (
                    <button
                      onClick={handleDrillUp}
                      className="px-2 py-1 text-xs bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded hover:bg-gray-200 dark:hover:bg-gray-600"
                    >
                      ↑ Yukarı
                    </button>
                  )}
            </div>
              )}
        </div>

            <AdvancedChartInteractivity
              data={projectPriorityDataPoints}
              onDataUpdate={handleProjectPriorityDataUpdate}
              onAnnotationAdd={handleAnnotationAdd}
              onAnnotationUpdate={handleAnnotationUpdate}
              drillDownLevel={drillDownLevel}
              onDrillDown={handleDrillDown}
              onDrillUp={handleDrillUp}
            >
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={drillDownLevel === 0 ? [
                  { priority: 'Düşük', count: projects.filter(p => p.priority === 'low').length },
                  { priority: 'Orta', count: projects.filter(p => p.priority === 'medium').length },
                  { priority: 'Yüksek', count: projects.filter(p => p.priority === 'high').length },
                  { priority: 'Kritik', count: projects.filter(p => p.priority === 'critical').length }
                ] : drillDownLevel === 1 ? [
                  { priority: 'Düşük Öncelik', count: 6 },
                  { priority: 'Orta Öncelik', count: 18 },
                  { priority: 'Yüksek Öncelik', count: 10 },
                  { priority: 'Kritik Öncelik', count: 4 }
                ] : [
                  { priority: '0-10K ₺', count: 8 },
                  { priority: '10-50K ₺', count: 15 },
                  { priority: '50-100K ₺', count: 12 },
                  { priority: '100K+ ₺', count: 3 }
                ]}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="priority" />
                  <YAxis />
                  <Tooltip formatter={(value) => [`${value} proje`, 'Proje Sayısı']} />
                  <Bar dataKey="count" fill="#8B5CF6" name="Proje Sayısı" />
                </BarChart>
              </ResponsiveContainer>
            </AdvancedChartInteractivity>
            </div>
            </div>
      )}

      {/* Proje Listesi */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Proje Listesi</h3>
            <div className="flex items-center space-x-3">
              {/* Görünüm Değiştirme Butonları */}
              <div className="flex items-center bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
                <button
                  onClick={() => setViewMode('list')}
                  className={`flex items-center px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                    viewMode === 'list'
                      ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm'
                      : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                  }`}
                >
                  <List className="w-4 h-4 mr-1.5" />
                  Liste
                </button>
                <button
                  onClick={() => setViewMode('kanban')}
                  className={`flex items-center px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                    viewMode === 'kanban'
                      ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm'
                      : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                  }`}
                >
                  <Grid3X3 className="w-4 h-4 mr-1.5" />
                  Kanban
                </button>
              </div>
              
              <div className="flex items-center space-x-2">
                <AdvancedButton
                  onClick={() => setShowNewProjectModal(true)}
                  variant="primary"
                  gradient
                  ripple
                  glow
                  icon={<Plus className="w-4 h-4" />}
                  iconPosition="left"
                >
                  Yeni Proje
                </AdvancedButton>
                
                {viewMode === 'kanban' && (
                  <button
                    onClick={handleAddColumn}
                    className="inline-flex items-center px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg text-sm font-medium transition-colors"
                    title="Yeni Sütun Ekle"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Yeni Sütun
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
        {viewMode === 'list' ? (
          <LoadingWrapper 
            isLoading={isProjectsLoading} 
            skeleton={<ProjectTableSkeleton />}
          >
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Proje</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Durum</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Teslim Tarihi</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Var Olan İlerleme</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Bütçe</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Risk</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">İşlemler</th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {projects.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-12">
                      <EmptyState
                        type="projects"
                        action={{
                          label: 'İlk Projeyi Oluştur',
                          onClick: () => setShowNewProjectModal(true)
                        }}
                      />
                    </td>
                  </tr>
                ) : (
                  projects.map((project) => (
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
                            className={`h-2 rounded-full transition-all duration-300 ${
                              getDeliveryStatus(project).color === 'red' ? 'bg-red-500' :
                              getDeliveryStatus(project).color === 'yellow' ? 'bg-yellow-500' :
                              'bg-green-500'
                            }`}
                            style={{ width: `${getDeliveryStatus(project).percentage}%` }}
                          ></div>
                        </div>
                        <span className="text-sm text-gray-900 dark:text-white">
                          {getDeliveryStatus(project).status}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="w-16 bg-gray-200 dark:bg-gray-700 rounded-full h-2 mr-2">
                          <div 
                            className="bg-blue-500 h-2 rounded-full transition-all duration-300"
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
                        <IconButton
                          onClick={() => handleViewProject(project)}
                          variant="ghost"
                          icon={<Eye className="w-4 h-4" />}
                          aria-label="Görüntüle"
                          className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300"
                        />
                        <IconButton
                          onClick={() => handleEditProject(project)}
                          variant="ghost"
                          icon={<Edit className="w-4 h-4" />}
                          aria-label="Düzenle"
                          className="text-green-600 hover:text-green-900 dark:text-green-400 dark:hover:text-green-300"
                        />
                        <IconButton
                          onClick={() => handleDeleteProject(project.id)}
                          variant="ghost"
                          icon={<Trash2 className="w-4 h-4" />}
                          aria-label="Sil"
                          className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                        />
                      </div>
                    </td>
                  </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          </LoadingWrapper>
        ) : (
          <div className="p-6">
            {renderKanbanBoard()}
          </div>
        )}
      </div>
        </LoadingWrapper>
    </div>
  );
  };

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
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Proaktif Risk Analizi</h3>
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
                  {generate3DGanttData().map((project) => (
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
          {/* Advanced Interactivity Toggle */}
          <button
            onClick={() => setEnableAdvancedInteractivity(!enableAdvancedInteractivity)}
            className={`flex items-center px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
              enableAdvancedInteractivity
                ? 'bg-blue-500 text-white hover:bg-blue-600'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
            }`}
          >
            <BarChart3 className="w-4 h-4 mr-2" />
            Gelişmiş Etkileşim
          </button>
          <AdvancedButton
            onClick={loadData}
            variant="ghost"
            icon={<RefreshCw className="w-4 h-4" />}
            iconPosition="left"
            hover
            scale
          >
            Yenile
          </AdvancedButton>
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
                     {columns.map((column) => (
                       <option key={column.id} value={column.status}>
                         {column.name}
                       </option>
                     ))}
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

       {/* Sütun Yönetimi Modal */}
       {showColumnModal && (
         <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
           <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md">
             <div className="flex items-center justify-between mb-6">
               <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                 {editingColumn ? 'Sütunu Düzenle' : 'Yeni Sütun Ekle'}
               </h3>
               <button
                 onClick={() => setShowColumnModal(false)}
                 className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
               >
                 <X className="w-6 h-6" />
               </button>
             </div>
             
             <div className="space-y-4">
               <div>
                 <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                   Sütun Adı
                 </label>
                 <input
                   type="text"
                   value={newColumn.name || ''}
                   onChange={(e) => setNewColumn({...newColumn, name: e.target.value})}
                   className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                   placeholder="Sütun adını girin"
                 />
               </div>
               
               <div>
                 <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                   Durum Kodu
                 </label>
                 <input
                   type="text"
                   value={newColumn.status || ''}
                   onChange={(e) => setNewColumn({...newColumn, status: e.target.value})}
                   className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                   placeholder="Örn: in_review, testing"
                 />
                 <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                   Projelerin bu sütuna atanması için kullanılacak benzersiz kod
                 </p>
               </div>
               
               <div>
                 <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                   İkon
                 </label>
                 <div className="grid grid-cols-5 gap-2">
                   {iconOptions.map((option) => {
                     const IconComponent = option.icon;
                     return (
                       <button
                         key={option.value}
                         onClick={() => setNewColumn({...newColumn, icon: option.value})}
                         className={`p-2 rounded-lg border-2 transition-colors ${
                           newColumn.icon === option.value
                             ? 'border-primary bg-primary/10'
                             : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
                         }`}
                         title={option.label}
                       >
                         <IconComponent className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                       </button>
                     );
                   })}
                 </div>
               </div>
               
               <div>
                 <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                   Renk
                 </label>
                 <div className="grid grid-cols-4 gap-2">
                   {colorOptions.map((option) => (
                     <button
                       key={option.value}
                       onClick={() => setNewColumn({...newColumn, color: option.value})}
                       className={`p-2 rounded-lg border-2 transition-colors ${
                         newColumn.color === option.value
                           ? 'border-primary bg-primary/10'
                           : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
                       }`}
                     >
                       <div className={`w-4 h-4 rounded-full bg-${option.value}-500`}></div>
                     </button>
                   ))}
                 </div>
               </div>
             </div>
             
             <div className="flex justify-end space-x-3 mt-6">
               <button
                 onClick={() => setShowColumnModal(false)}
                 className="px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600"
               >
                 İptal
               </button>
               <button
                 onClick={handleSaveColumn}
                 disabled={!newColumn.name || !newColumn.status}
                 className="px-4 py-2 bg-primary hover:bg-primary-600 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
               >
                 {editingColumn ? 'Güncelle' : 'Ekle'}
               </button>
             </div>
           </div>
         </div>
       )}

       {/* Proje Detay Modal */}
       {showProjectDetailModal && viewingProject && (
         <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
           <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-7xl max-h-[95vh] overflow-y-auto">
             <div className="flex items-center justify-between mb-6">
               <div>
                 <h3 className="text-2xl font-bold text-gray-900 dark:text-white">Proje Detayları</h3>
                 <p className="text-gray-600 dark:text-gray-400 mt-1">
                   {viewingProject.name} - Kapsamlı Proje Analizi
                 </p>
               </div>
               <div className="flex items-center gap-3">
                 <button className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 transition-colors flex items-center gap-2">
                   <Download className="w-4 h-4" />
                   Rapor İndir
                 </button>
                 <button className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm hover:bg-green-700 transition-colors flex items-center gap-2">
                   <Edit className="w-4 h-4" />
                   Düzenle
                 </button>
               <button
                   onClick={() => {
                     setShowProjectDetailModal(false);
                     setActiveProjectTab('overview'); // Tab'ı kapatırken sıfırla
                   }}
                   className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 p-2"
               >
                 <X className="w-6 h-6" />
               </button>
               </div>
             </div>
             

             {/* Tab Navigation */}
             <div className="flex space-x-1 bg-gray-100 dark:bg-gray-700 p-1 rounded-lg mb-6">
               <button
                 onClick={() => setActiveProjectTab('overview')}
                 className={`flex-1 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                   activeProjectTab === 'overview'
                     ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm'
                     : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                 }`}
               >
                 <BarChart3 className="w-4 h-4 inline mr-2" />
                 Genel Bakış
               </button>
               <button
                 onClick={() => setActiveProjectTab('team')}
                 className={`flex-1 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                   activeProjectTab === 'team'
                     ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm'
                     : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                 }`}
               >
                 <Users className="w-4 h-4 inline mr-2" />
                 Ekip & Görevler
               </button>
               <button
                 onClick={() => setActiveProjectTab('timeline')}
                 className={`flex-1 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                   activeProjectTab === 'timeline'
                     ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm'
                     : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                 }`}
               >
                 <Calendar className="w-4 h-4 inline mr-2" />
                 Zaman Çizelgesi
               </button>
               <button
                 onClick={() => setActiveProjectTab('analytics')}
                 className={`flex-1 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                   activeProjectTab === 'analytics'
                     ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm'
                     : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                 }`}
               >
                 <TrendingUp className="w-4 h-4 inline mr-2" />
                 Analitik
               </button>
               <button
                 onClick={() => setActiveProjectTab('files')}
                 className={`flex-1 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                   activeProjectTab === 'files'
                     ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm'
                     : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                 }`}
               >
                 <FileText className="w-4 h-4 inline mr-2" />
                 Dosyalar & Yorumlar
               </button>
             </div>
             
             {/* Tab Content */}
             {activeProjectTab === 'overview' && (
             <div className="space-y-6">
               {/* Proje Başlığı */}
                 <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-lg p-6 border border-blue-200 dark:border-blue-700">
                   <div className="flex items-start justify-between">
                     <div>
                       <h4 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                   {viewingProject.name}
                 </h4>
                       <p className="text-gray-600 dark:text-gray-400 text-lg">
                   {viewingProject.description}
                 </p>
               </div>
                     <div className="flex items-center gap-2">
                       <span className={`px-3 py-1 text-sm font-semibold rounded-full ${
                     viewingProject.status === 'active' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' :
                     viewingProject.status === 'planning' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' :
                     viewingProject.status === 'completed' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' :
                     'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
                   }`}>
                     {viewingProject.status === 'active' ? 'Aktif' :
                      viewingProject.status === 'planning' ? 'Planlama' :
                      viewingProject.status === 'completed' ? 'Tamamlandı' :
                      'Bilinmiyor'}
                   </span>
                     </div>
                   </div>
                 </div>

                 {/* Proje Bilgileri Grid */}
                 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                   {/* İlerleme Kartı */}
                   <div className="bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg p-6 hover:shadow-lg transition-shadow">
                     <div className="flex items-center justify-between mb-4">
                       <div className="flex items-center space-x-2">
                         <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                     <span className="text-sm font-medium text-gray-700 dark:text-gray-300">İlerleme</span>
                   </div>
                       <span className="text-2xl font-bold text-gray-900 dark:text-white">
                         {viewingProject.progress}%
                       </span>
                     </div>
                     <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-3 mb-2">
                       <div 
                         className="bg-gradient-to-r from-green-500 to-blue-500 h-3 rounded-full transition-all duration-500"
                         style={{ width: `${viewingProject.progress}%` }}
                       ></div>
                     </div>
                     <div className="flex justify-between text-xs text-gray-600 dark:text-gray-400">
                       <span>Başlangıç</span>
                       <span>Hedef: 100%</span>
                   </div>
                 </div>

                   {/* Bütçe Kartı */}
                   <div className="bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg p-6 hover:shadow-lg transition-shadow">
                     <div className="flex items-center justify-between mb-4">
                       <div className="flex items-center space-x-2">
                         <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
                     <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Bütçe</span>
                   </div>
                       <DollarSign className="w-5 h-5 text-purple-500" />
                     </div>
                     <div className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                     ₺{viewingProject.budget.toLocaleString()}
                   </div>
                     <div className="text-sm text-gray-600 dark:text-gray-400">
                       Harcanan: ₺{viewingProject.actual_cost.toLocaleString()}
                     </div>
                     <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2 mt-2">
                       <div 
                         className="bg-gradient-to-r from-purple-500 to-pink-500 h-2 rounded-full transition-all duration-500"
                         style={{ width: `${Math.min((viewingProject.actual_cost / viewingProject.budget) * 100, 100)}%` }}
                       ></div>
                     </div>
                 </div>

                   {/* Risk Kartı */}
                   <div className="bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg p-6 hover:shadow-lg transition-shadow">
                     <div className="flex items-center justify-between mb-4">
                       <div className="flex items-center space-x-2">
                         <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                     <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Risk Skoru</span>
                   </div>
                       <AlertTriangle className="w-5 h-5 text-red-500" />
                     </div>
                     <div className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                     {typeof viewingProject.risk_level === 'number' ? `${viewingProject.risk_level}%` : 
                      viewingProject.risk_level === 'high' ? 'Yüksek' :
                      viewingProject.risk_level === 'medium' ? 'Orta' :
                      viewingProject.risk_level === 'low' ? 'Düşük' : 'Bilinmiyor'}
                   </div>
                     <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2">
                       <div 
                         className={`h-2 rounded-full transition-all duration-500 ${
                           viewingProject.risk_level === 'high' || (typeof viewingProject.risk_level === 'number' && viewingProject.risk_level > 70) ? 'bg-red-500' :
                           viewingProject.risk_level === 'medium' || (typeof viewingProject.risk_level === 'number' && viewingProject.risk_level > 40) ? 'bg-yellow-500' :
                           'bg-green-500'
                         }`}
                         style={{ 
                           width: typeof viewingProject.risk_level === 'number' ? `${viewingProject.risk_level}%` : 
                                  viewingProject.risk_level === 'high' ? '80%' :
                                  viewingProject.risk_level === 'medium' ? '50%' : '20%'
                         }}
                       ></div>
                     </div>
                   </div>

                   {/* Ekip Kartı */}
                   <div className="bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg p-6 hover:shadow-lg transition-shadow">
                     <div className="flex items-center justify-between mb-4">
                       <div className="flex items-center space-x-2">
                         <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
                         <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Ekip</span>
                       </div>
                       <Users className="w-5 h-5 text-orange-500" />
                     </div>
                     <div className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                       {viewingProject.team_size} Kişi
                     </div>
                     <div className="text-sm text-gray-600 dark:text-gray-400">
                       Aktif üyeler
                     </div>
                     <div className="flex -space-x-2 mt-3">
                       {[...Array(Math.min(viewingProject.team_size, 4))].map((_, i) => (
                         <div key={i} className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full border-2 border-white dark:border-gray-700 flex items-center justify-center">
                           <span className="text-xs font-semibold text-white">
                             {String.fromCharCode(65 + i)}
                           </span>
                         </div>
                       ))}
                       {viewingProject.team_size > 4 && (
                         <div className="w-8 h-8 bg-gray-300 dark:bg-gray-600 rounded-full border-2 border-white dark:border-gray-700 flex items-center justify-center">
                           <span className="text-xs font-semibold text-gray-600 dark:text-gray-400">
                             +{viewingProject.team_size - 4}
                           </span>
                         </div>
                       )}
                     </div>
                 </div>

                 <div className="bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg p-4">
                   <div className="flex items-center space-x-2 mb-2">
                     <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                     <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Öncelik</span>
                   </div>
                   <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                     viewingProject.priority === 'high' ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' :
                     viewingProject.priority === 'medium' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' :
                     'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                   }`}>
                     {viewingProject.priority === 'high' ? 'Yüksek' :
                      viewingProject.priority === 'medium' ? 'Orta' :
                      'Düşük'}
                   </span>
                 </div>

                 <div className="bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg p-4">
                   <div className="flex items-center space-x-2 mb-2">
                     <div className="w-2 h-2 bg-indigo-500 rounded-full"></div>
                     <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Ekip Boyutu</span>
                   </div>
                   <div className="text-lg font-semibold text-gray-900 dark:text-white">
                     {viewingProject.team_size} kişi
                   </div>
                 </div>
               </div>

                 {/* Proje Tarihleri */}
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                   <div className="bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg p-6">
                     <h5 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                       <Calendar className="w-5 h-5 mr-2 text-blue-500" />
                       Proje Tarihleri
                     </h5>
                     <div className="space-y-3">
                       <div className="flex justify-between items-center">
                         <span className="text-sm text-gray-600 dark:text-gray-400">Başlangıç:</span>
                         <span className="text-sm font-medium text-gray-900 dark:text-white">
                           {new Date(viewingProject.start_date).toLocaleDateString('tr-TR')}
                         </span>
                 </div>
                       <div className="flex justify-between items-center">
                         <span className="text-sm text-gray-600 dark:text-gray-400">Bitiş:</span>
                         <span className="text-sm font-medium text-gray-900 dark:text-white">
                           {new Date(viewingProject.end_date).toLocaleDateString('tr-TR')}
                         </span>
                       </div>
                       <div className="flex justify-between items-center">
                         <span className="text-sm text-gray-600 dark:text-gray-400">Oluşturulma:</span>
                         <span className="text-sm font-medium text-gray-900 dark:text-white">
                           {new Date(viewingProject.created_at).toLocaleDateString('tr-TR')}
                         </span>
                       </div>
                     </div>
                   </div>

                   <div className="bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg p-6">
                     <h5 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                       <Target className="w-5 h-5 mr-2 text-green-500" />
                       Proje Hedefleri
                     </h5>
                     <div className="space-y-3">
                       <div className="flex items-center justify-between">
                         <span className="text-sm text-gray-600 dark:text-gray-400">Öncelik:</span>
                         <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                           viewingProject.priority === 'high' ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' :
                           viewingProject.priority === 'medium' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' :
                           'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                         }`}>
                           {viewingProject.priority === 'high' ? 'Yüksek' :
                            viewingProject.priority === 'medium' ? 'Orta' : 'Düşük'}
                         </span>
                       </div>
                       <div className="flex items-center justify-between">
                         <span className="text-sm text-gray-600 dark:text-gray-400">Durum:</span>
                         <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                           viewingProject.status === 'active' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' :
                           viewingProject.status === 'planning' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' :
                           viewingProject.status === 'completed' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' :
                           'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
                         }`}>
                           {viewingProject.status === 'active' ? 'Aktif' :
                            viewingProject.status === 'planning' ? 'Planlama' :
                            viewingProject.status === 'completed' ? 'Tamamlandı' : 'Bilinmiyor'}
                         </span>
                       </div>
                     </div>
                   </div>
                 </div>
               </div>
             )}

             {/* Team Tab */}
             {activeProjectTab === 'team' && (
               <div className="space-y-6">
                 <div className="bg-white dark:bg-gray-700 rounded-lg p-6">
                   <h4 className="text-xl font-semibold text-gray-900 dark:text-white mb-6 flex items-center">
                     <Users className="w-6 h-6 mr-2 text-blue-500" />
                     Ekip Üyeleri ve Görevler
                   </h4>
                   
                   {/* Ekip Üyeleri */}
                   <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                     {[...Array(viewingProject.team_size)].map((_, i) => (
                       <div key={i} className="bg-gray-50 dark:bg-gray-600 rounded-lg p-4">
                         <div className="flex items-center space-x-3 mb-3">
                           <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                             <span className="text-sm font-semibold text-white">
                               {String.fromCharCode(65 + i)}
                             </span>
                           </div>
                           <div>
                             <h5 className="font-medium text-gray-900 dark:text-white">
                               Ekip Üyesi {i + 1}
                             </h5>
                             <p className="text-sm text-gray-600 dark:text-gray-400">
                               Geliştirici
                   </p>
                 </div>
                         </div>
                         <div className="space-y-2">
                           <div className="flex justify-between text-sm">
                             <span className="text-gray-600 dark:text-gray-400">Görevler:</span>
                             <span className="font-medium text-gray-900 dark:text-white">5</span>
                           </div>
                           <div className="flex justify-between text-sm">
                             <span className="text-gray-600 dark:text-gray-400">Tamamlanan:</span>
                             <span className="font-medium text-green-600 dark:text-green-400">3</span>
                           </div>
                         </div>
                       </div>
                     ))}
               </div>

                   {/* Görev Listesi */}
                   <div className="bg-gray-50 dark:bg-gray-600 rounded-lg p-4">
                     <h5 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                       Aktif Görevler
                     </h5>
                     <div className="space-y-3">
                       {[
                         { name: 'UI/UX Tasarımı', assignee: 'Ekip Üyesi 1', progress: 80, priority: 'high' },
                         { name: 'Backend API Geliştirme', assignee: 'Ekip Üyesi 2', progress: 60, priority: 'medium' },
                         { name: 'Veritabanı Optimizasyonu', assignee: 'Ekip Üyesi 3', progress: 40, priority: 'low' },
                         { name: 'Test Senaryoları', assignee: 'Ekip Üyesi 1', progress: 20, priority: 'medium' }
                       ].map((task, index) => (
                         <div key={index} className="bg-white dark:bg-gray-700 rounded-lg p-4">
                           <div className="flex items-center justify-between mb-2">
                             <h6 className="font-medium text-gray-900 dark:text-white">{task.name}</h6>
                             <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                               task.priority === 'high' ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' :
                               task.priority === 'medium' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' :
                               'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                             }`}>
                               {task.priority === 'high' ? 'Yüksek' : task.priority === 'medium' ? 'Orta' : 'Düşük'}
                             </span>
                           </div>
                           <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400 mb-2">
                             <span>{task.assignee}</span>
                             <span>{task.progress}%</span>
                           </div>
                           <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2">
                             <div 
                               className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                               style={{ width: `${task.progress}%` }}
                             ></div>
                           </div>
                         </div>
                       ))}
                     </div>
                   </div>
                 </div>
               </div>
             )}

             {/* Timeline Tab */}
             {activeProjectTab === 'timeline' && (
               <div className="space-y-6">
                 <div className="bg-white dark:bg-gray-700 rounded-lg p-6">
                   <h4 className="text-xl font-semibold text-gray-900 dark:text-white mb-6 flex items-center">
                     <Calendar className="w-6 h-6 mr-2 text-blue-500" />
                     Proje Zaman Çizelgesi
                   </h4>
                   
                   {/* Gantt Chart Benzeri Timeline */}
                   <div className="space-y-4">
                     {[
                       { phase: 'Planlama', start: '2024-01-01', end: '2024-01-15', progress: 100, status: 'completed' },
                       { phase: 'Tasarım', start: '2024-01-10', end: '2024-01-25', progress: 80, status: 'active' },
                       { phase: 'Geliştirme', start: '2024-01-20', end: '2024-02-15', progress: 60, status: 'active' },
                       { phase: 'Test', start: '2024-02-10', end: '2024-02-25', progress: 20, status: 'pending' },
                       { phase: 'Deployment', start: '2024-02-20', end: '2024-03-01', progress: 0, status: 'pending' }
                     ].map((phase, index) => (
                       <div key={index} className="bg-gray-50 dark:bg-gray-600 rounded-lg p-4">
                         <div className="flex items-center justify-between mb-3">
                           <h5 className="font-semibold text-gray-900 dark:text-white">{phase.phase}</h5>
                           <div className="flex items-center gap-2">
                             <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                               phase.status === 'completed' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' :
                               phase.status === 'active' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' :
                               'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
                             }`}>
                               {phase.status === 'completed' ? 'Tamamlandı' :
                                phase.status === 'active' ? 'Aktif' : 'Beklemede'}
                             </span>
                             <span className="text-sm font-medium text-gray-900 dark:text-white">
                               {phase.progress}%
                             </span>
                           </div>
                         </div>
                         <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400 mb-2">
                           <span>{new Date(phase.start).toLocaleDateString('tr-TR')}</span>
                           <span>{new Date(phase.end).toLocaleDateString('tr-TR')}</span>
                         </div>
                         <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-3">
                           <div 
                             className={`h-3 rounded-full transition-all duration-500 ${
                               phase.status === 'completed' ? 'bg-green-500' :
                               phase.status === 'active' ? 'bg-blue-500' : 'bg-gray-400'
                             }`}
                             style={{ width: `${phase.progress}%` }}
                           ></div>
                         </div>
                       </div>
                     ))}
                   </div>
                 </div>
               </div>
             )}

             {/* Analytics Tab */}
             {activeProjectTab === 'analytics' && (
               <div className="space-y-6">
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                   {/* Performans Grafiği */}
                   <div className="bg-white dark:bg-gray-700 rounded-lg p-6">
                     <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                       <TrendingUp className="w-5 h-5 mr-2 text-green-500" />
                       Performans Trendi
                     </h4>
                     <div className="h-64 flex items-center justify-center">
                       <div className="text-center">
                         <BarChart3 className="w-16 h-16 text-gray-400 mx-auto mb-2" />
                         <p className="text-gray-600 dark:text-gray-400">Performans grafiği burada görünecek</p>
                       </div>
                     </div>
                   </div>

                   {/* Risk Analizi */}
                   <div className="bg-white dark:bg-gray-700 rounded-lg p-6">
                     <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                       <AlertTriangle className="w-5 h-5 mr-2 text-red-500" />
                       Risk Analizi
                     </h4>
                     <div className="space-y-4">
                       <div className="flex items-center justify-between">
                         <span className="text-sm text-gray-600 dark:text-gray-400">Bütçe Riski</span>
                         <div className="flex items-center gap-2">
                           <div className="w-20 bg-gray-200 dark:bg-gray-600 rounded-full h-2">
                             <div className="bg-yellow-500 h-2 rounded-full" style={{ width: '60%' }}></div>
                           </div>
                           <span className="text-sm font-medium text-gray-900 dark:text-white">60%</span>
                         </div>
                       </div>
                       <div className="flex items-center justify-between">
                         <span className="text-sm text-gray-600 dark:text-gray-400">Zaman Riski</span>
                         <div className="flex items-center gap-2">
                           <div className="w-20 bg-gray-200 dark:bg-gray-600 rounded-full h-2">
                             <div className="bg-red-500 h-2 rounded-full" style={{ width: '80%' }}></div>
                           </div>
                           <span className="text-sm font-medium text-gray-900 dark:text-white">80%</span>
                         </div>
                       </div>
                       <div className="flex items-center justify-between">
                         <span className="text-sm text-gray-600 dark:text-gray-400">Kaynak Riski</span>
                         <div className="flex items-center gap-2">
                           <div className="w-20 bg-gray-200 dark:bg-gray-600 rounded-full h-2">
                             <div className="bg-green-500 h-2 rounded-full" style={{ width: '30%' }}></div>
                           </div>
                           <span className="text-sm font-medium text-gray-900 dark:text-white">30%</span>
                         </div>
                       </div>
                     </div>
                   </div>
                 </div>

                 {/* Detaylı Metrikler */}
                 <div className="bg-white dark:bg-gray-700 rounded-lg p-6">
                   <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                     <Activity className="w-5 h-5 mr-2 text-blue-500" />
                     Detaylı Metrikler
                   </h4>
                   <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                     <div className="text-center">
                       <div className="text-3xl font-bold text-blue-600 dark:text-blue-400 mb-2">
                         {viewingProject.progress}%
                       </div>
                       <div className="text-sm text-gray-600 dark:text-gray-400">Genel İlerleme</div>
                     </div>
                     <div className="text-center">
                       <div className="text-3xl font-bold text-green-600 dark:text-green-400 mb-2">
                         {Math.round((viewingProject.actual_cost / viewingProject.budget) * 100)}%
                       </div>
                       <div className="text-sm text-gray-600 dark:text-gray-400">Bütçe Kullanımı</div>
                     </div>
                     <div className="text-center">
                       <div className="text-3xl font-bold text-purple-600 dark:text-purple-400 mb-2">
                         {viewingProject.team_size}
                       </div>
                       <div className="text-sm text-gray-600 dark:text-gray-400">Aktif Ekip Üyesi</div>
                     </div>
                   </div>
                 </div>
               </div>
             )}

             {/* Files Tab */}
             {activeProjectTab === 'files' && (
               <div className="space-y-6">
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                   {/* Dosyalar */}
                   <div className="bg-white dark:bg-gray-700 rounded-lg p-6">
                     <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                       <FileText className="w-5 h-5 mr-2 text-blue-500" />
                       Proje Dosyaları
                     </h4>
                     <div className="space-y-3">
                       {[
                         { name: 'Proje Planı.pdf', size: '2.4 MB', date: '2024-01-15', type: 'pdf' },
                         { name: 'Tasarım Mockup.fig', size: '5.2 MB', date: '2024-01-20', type: 'figma' },
                         { name: 'API Dokümantasyonu.md', size: '156 KB', date: '2024-01-25', type: 'markdown' },
                         { name: 'Test Raporu.xlsx', size: '890 KB', date: '2024-02-01', type: 'excel' }
                       ].map((file, index) => (
                         <div key={index} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-600 rounded-lg">
                           <div className="flex items-center space-x-3">
                             <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                               file.type === 'pdf' ? 'bg-red-100 text-red-600' :
                               file.type === 'figma' ? 'bg-purple-100 text-purple-600' :
                               file.type === 'markdown' ? 'bg-blue-100 text-blue-600' :
                               'bg-green-100 text-green-600'
                             }`}>
                               <FileText className="w-4 h-4" />
                             </div>
                             <div>
                               <div className="font-medium text-gray-900 dark:text-white">{file.name}</div>
                               <div className="text-sm text-gray-600 dark:text-gray-400">
                                 {file.size} • {new Date(file.date).toLocaleDateString('tr-TR')}
                               </div>
                             </div>
                           </div>
                           <button className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                             <Download className="w-4 h-4" />
                           </button>
                         </div>
                       ))}
                     </div>
                   </div>

                   {/* Yorumlar */}
                   <div className="bg-white dark:bg-gray-700 rounded-lg p-6">
                     <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                       <MessageSquare className="w-5 h-5 mr-2 text-green-500" />
                       Proje Yorumları
                     </h4>
                     <div className="space-y-4">
                       {[
                         { author: 'Proje Yöneticisi', comment: 'İlerleme çok iyi gidiyor, tebrikler ekip!', date: '2024-02-01', time: '14:30' },
                         { author: 'Ekip Üyesi 1', comment: 'UI tasarımı tamamlandı, review için hazır.', date: '2024-01-28', time: '16:45' },
                         { author: 'Ekip Üyesi 2', comment: 'Backend API\'ler test edildi, sorun yok.', date: '2024-01-25', time: '11:20' }
                       ].map((comment, index) => (
                         <div key={index} className="bg-gray-50 dark:bg-gray-600 rounded-lg p-4">
                           <div className="flex items-center justify-between mb-2">
                             <span className="font-medium text-gray-900 dark:text-white">{comment.author}</span>
                             <span className="text-sm text-gray-600 dark:text-gray-400">
                               {new Date(comment.date).toLocaleDateString('tr-TR')} {comment.time}
                             </span>
                           </div>
                           <p className="text-gray-700 dark:text-gray-300">{comment.comment}</p>
                         </div>
                       ))}
                     </div>
                     
                     {/* Yeni Yorum Ekleme */}
                     <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-600">
                       <textarea
                         placeholder="Yeni yorum ekle..."
                         className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white resize-none"
                         rows={3}
                       ></textarea>
                       <button className="mt-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 transition-colors">
                         Yorum Ekle
                       </button>
                     </div>
                   </div>
                 </div>
               </div>
             )}

               {/* İşlem Butonları */}
               <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200 dark:border-gray-600">
                 <button
                   onClick={() => {
                     setShowProjectDetailModal(false);
                     setEditingProject(viewingProject);
                     setShowEditProjectModal(true);
                   }}
                   className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                 >
                   Düzenle
                 </button>
                 <button
                   onClick={() => setShowProjectDetailModal(false)}
                   className="px-4 py-2 bg-gray-300 hover:bg-gray-400 text-gray-700 rounded-lg transition-colors"
                 >
                   Kapat
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
                   value={editingProject?.name || ''}
                   onChange={(e) => editingProject && setEditingProject({...editingProject, name: e.target.value})}
                   className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                 />
               </div>
               
               <div>
                 <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                   Açıklama
                 </label>
                 <textarea
                   value={editingProject?.description || ''}
                   onChange={(e) => editingProject && setEditingProject({...editingProject, description: e.target.value})}
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
                     value={editingProject?.status || 'planning'}
                     onChange={(e) => editingProject && setEditingProject({...editingProject, status: e.target.value as any})}
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
                     value={editingProject?.priority || 'medium'}
                     onChange={(e) => editingProject && setEditingProject({...editingProject, priority: e.target.value as any})}
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
                     value={editingProject?.start_date || ''}
                     onChange={(e) => editingProject && setEditingProject({...editingProject, start_date: e.target.value})}
                     className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                   />
                 </div>
                 
                 <div>
                   <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                     Bitiş Tarihi
                   </label>
                   <input
                     type="date"
                     value={editingProject?.end_date || ''}
                     onChange={(e) => editingProject && setEditingProject({...editingProject, end_date: e.target.value})}
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
                     value={editingProject?.budget || 0}
                     onChange={(e) => editingProject && setEditingProject({...editingProject, budget: parseFloat(e.target.value) || 0})}
                     className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                   />
                 </div>
                 
                 <div>
                   <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                     Gerçek Maliyet (₺)
                   </label>
                   <input
                     type="number"
                     value={editingProject?.actual_cost || 0}
                     onChange={(e) => editingProject && setEditingProject({...editingProject, actual_cost: parseFloat(e.target.value) || 0})}
                     className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                   />
                 </div>
                 
                 <div>
                   <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                     Ekip Büyüklüğü
                   </label>
                   <input
                     type="number"
                     value={editingProject?.team_size || 1}
                     onChange={(e) => editingProject && setEditingProject({...editingProject, team_size: parseInt(e.target.value) || 1})}
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
                   value={editingProject?.risk_level || 'low'}
                   onChange={(e) => editingProject && setEditingProject({...editingProject, risk_level: e.target.value as any})}
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
                <EmployeeChat />
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
