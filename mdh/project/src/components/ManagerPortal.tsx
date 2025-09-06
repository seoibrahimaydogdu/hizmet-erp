import React, { useState, useEffect, useCallback } from 'react';
import { 
  BarChart3, 
  Settings, 
  Home,
  Bell,
  Search,
  Plus,
  Clock,
  CheckCircle,
  AlertCircle,
  Sun,
  Moon,
  Award,
  Users,
  Star,
  TrendingUp,
  Download,
  LogOut,
  DollarSign,
  PieChart,
  LineChart,
  Eye,
  Edit,
  Trash2,
  ChevronDown,
  ChevronUp,
  MessageSquare,
  Target,
  TrendingDown,
  Heart,
  MessageCircle,
  AlertTriangle,
  XCircle,
  FileText,
  Filter,
  RefreshCw,
  Zap,
  Shield,
  UserCheck,
  Percent,
  Timer,
  MapPin,
  Calendar,
  BarChart,
  Mail,
  Phone,
  MoreVertical,
  X,
  History,
  User,
  Link2,
  Paperclip,
  Share,
  Copy,
  Archive,
  List
} from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { useSupabase } from '../hooks/useSupabase';
import { supabase } from '../lib/supabase';
import FeedbackButton from './common/FeedbackButton';
import EmployeeChat from './EmployeeChat';
import DirectMessage from './DirectMessage';
// import Modal from './common/Modal'; // Kendi Modal bileşenimizi kullanıyoruz

interface ManagerPortalProps {
  onBackToAdmin?: () => void;
}

const ManagerPortal: React.FC<ManagerPortalProps> = ({ onBackToAdmin }) => {
  const { setTheme, isDark } = useTheme();
  const [currentPage, setCurrentPage] = useState('dashboard');
  const [managerData, setManagerData] = useState<any>(null);
  const [expandedSections, setExpandedSections] = useState<{[key: string]: boolean}>({});
  const [selectedTimeRange, setSelectedTimeRange] = useState('7d');
  const [selectedManagerType, setSelectedManagerType] = useState('team-manager');
  
  // Takım İletişimi için state'ler
  const [showEmployeeChat, setShowEmployeeChat] = useState(false);
  const [showDirectMessage, setShowDirectMessage] = useState(false);
  const [selectedChatType, setSelectedChatType] = useState<'team' | 'direct'>('team');
  const [showNewGroupModal, setShowNewGroupModal] = useState(false);
  const [newGroup, setNewGroup] = useState({
    name: '',
    description: '',
    type: 'public',
    members: [] as string[]
  });
  const [realTimeData] = useState({
    activeUsers: 12,
    currentTickets: 8,
    avgResponseTime: 45,
    customerSatisfaction: 4.7
  });

  // Müşteri segment verileri
  const customerSegments = {
    'VIP Müşteriler': {
      segment: 'VIP Müşteriler',
      count: 45,
      revenue: 125000,
      color: 'green',
      description: 'Yüksek değerli, sadık müşteriler',
      customers: [
        { id: 1, name: 'Ahmet Yılmaz', company: 'Yılmaz Holding', email: 'ahmet@yilmaz.com', phone: '+90 532 123 45 67', plan: 'premium', satisfaction: 95, lastActivity: '2024-01-15', totalSpent: 25000 },
        { id: 2, name: 'Fatma Demir', company: 'Demir Teknoloji', email: 'fatma@demir.com', phone: '+90 533 234 56 78', plan: 'premium', satisfaction: 92, lastActivity: '2024-01-14', totalSpent: 18000 },
        { id: 3, name: 'Mehmet Kaya', company: 'Kaya İnşaat', email: 'mehmet@kaya.com', phone: '+90 534 345 67 89', plan: 'premium', satisfaction: 98, lastActivity: '2024-01-16', totalSpent: 32000 },
        { id: 4, name: 'Ayşe Özkan', company: 'Özkan Ticaret', email: 'ayse@ozkan.com', phone: '+90 535 456 78 90', plan: 'premium', satisfaction: 89, lastActivity: '2024-01-13', totalSpent: 15000 },
        { id: 5, name: 'Can Arslan', company: 'Arslan Grup', email: 'can@arslan.com', phone: '+90 536 567 89 01', plan: 'premium', satisfaction: 96, lastActivity: '2024-01-16', totalSpent: 28000 }
      ]
    },
    'Aktif Müşteriler': {
      segment: 'Aktif Müşteriler',
      count: 180,
      revenue: 85000,
      color: 'blue',
      description: 'Düzenli kullanıcılar',
      customers: [
        { id: 6, name: 'Elif Yıldız', company: 'Yıldız Yazılım', email: 'elif@yildiz.com', phone: '+90 537 678 90 12', plan: 'standard', satisfaction: 85, lastActivity: '2024-01-15', totalSpent: 8500 },
        { id: 7, name: 'Burak Çelik', company: 'Çelik Mühendislik', email: 'burak@celik.com', phone: '+90 538 789 01 23', plan: 'standard', satisfaction: 88, lastActivity: '2024-01-14', totalSpent: 12000 },
        { id: 8, name: 'Selin Aydın', company: 'Aydın Danışmanlık', email: 'selin@aydin.com', phone: '+90 539 890 12 34', plan: 'standard', satisfaction: 82, lastActivity: '2024-01-16', totalSpent: 6500 },
        { id: 9, name: 'Okan Şahin', company: 'Şahin Lojistik', email: 'okan@sahin.com', phone: '+90 540 901 23 45', plan: 'standard', satisfaction: 90, lastActivity: '2024-01-15', totalSpent: 9800 },
        { id: 10, name: 'Zeynep Koç', company: 'Koç Eğitim', email: 'zeynep@koc.com', phone: '+90 541 012 34 56', plan: 'standard', satisfaction: 87, lastActivity: '2024-01-14', totalSpent: 7500 }
      ]
    },
    'Yeni Müşteriler': {
      segment: 'Yeni Müşteriler',
      count: 65,
      revenue: 25000,
      color: 'purple',
      description: 'Son 3 ayda katılanlar',
      customers: [
        { id: 11, name: 'Deniz Aktaş', company: 'Aktaş Gıda', email: 'deniz@aktas.com', phone: '+90 542 123 45 67', plan: 'basic', satisfaction: 78, lastActivity: '2024-01-16', totalSpent: 2500 },
        { id: 12, name: 'Gökhan Polat', company: 'Polat Turizm', email: 'gokhan@polat.com', phone: '+90 543 234 56 78', plan: 'basic', satisfaction: 82, lastActivity: '2024-01-15', totalSpent: 3200 },
        { id: 13, name: 'Merve Güneş', company: 'Güneş Enerji', email: 'merve@gunes.com', phone: '+90 544 345 67 89', plan: 'basic', satisfaction: 75, lastActivity: '2024-01-14', totalSpent: 1800 },
        { id: 14, name: 'Tolga Özdemir', company: 'Özdemir Medya', email: 'tolga@ozdemir.com', phone: '+90 545 456 78 90', plan: 'basic', satisfaction: 80, lastActivity: '2024-01-16', totalSpent: 2900 },
        { id: 15, name: 'Pınar Erdoğan', company: 'Erdoğan Sağlık', email: 'pinar@erdogan.com', phone: '+90 546 567 89 01', plan: 'basic', satisfaction: 85, lastActivity: '2024-01-15', totalSpent: 2100 }
      ]
    },
    'Riskli Müşteriler': {
      segment: 'Riskli Müşteriler',
      count: 12,
      revenue: 5000,
      color: 'red',
      description: 'Churn riski yüksek',
      customers: [
        { id: 16, name: 'Serkan Yılmaz', company: 'Yılmaz Mobilya', email: 'serkan@yilmazmobilya.com', phone: '+90 547 678 90 12', plan: 'standard', satisfaction: 45, lastActivity: '2024-01-05', totalSpent: 1200, riskReason: 'Düşük memnuniyet, son aktivite 11 gün önce' },
        { id: 17, name: 'Gülay Çakır', company: 'Çakır Tekstil', email: 'gulay@cakir.com', phone: '+90 548 789 01 23', plan: 'basic', satisfaction: 38, lastActivity: '2024-01-03', totalSpent: 800, riskReason: 'Çok düşük memnuniyet, şikayet geçmişi' },
        { id: 18, name: 'Hakan Doğan', company: 'Doğan İnşaat', email: 'hakan@dogan.com', phone: '+90 549 890 12 34', plan: 'standard', satisfaction: 52, lastActivity: '2024-01-08', totalSpent: 1500, riskReason: 'Orta memnuniyet, düzensiz kullanım' },
        { id: 19, name: 'Nurcan Kılıç', company: 'Kılıç Eğitim', email: 'nurcan@kilic.com', phone: '+90 550 901 23 45', plan: 'basic', satisfaction: 41, lastActivity: '2024-01-02', totalSpent: 600, riskReason: 'Düşük memnuniyet, uzun süreli inaktivite' },
        { id: 20, name: 'Emre Yurt', company: 'Yurt Teknoloji', email: 'emre@yurt.com', phone: '+90 551 012 34 56', plan: 'standard', satisfaction: 48, lastActivity: '2024-01-06', totalSpent: 1100, riskReason: 'Düşük memnuniyet, destek talepleri artışı' }
      ]
    }
  };

  // Görev yönetimi için state'ler
  const [taskView, setTaskView] = useState<'list' | 'kanban'>('list');
  const [showColumnSettings, setShowColumnSettings] = useState(false);
  const [customColumns, setCustomColumns] = useState([
    { id: 'pending', name: 'Beklemede', color: 'bg-yellow-100 border-yellow-300', tasks: [] },
    { id: 'in_progress', name: 'Devam Ediyor', color: 'bg-blue-100 border-blue-300', tasks: [] },
    { id: 'completed', name: 'Tamamlandı', color: 'bg-green-100 border-green-300', tasks: [] },
    { id: 'cancelled', name: 'İptal Edildi', color: 'bg-red-100 border-red-300', tasks: [] }
  ]);

  // Müşteri analizi için state'ler
  const [customerView, setCustomerView] = useState<'list' | 'kanban'>('list');
  const [showCustomerColumnSettings, setShowCustomerColumnSettings] = useState(false);
  const [customerColumns, setCustomerColumns] = useState([
    { id: 'vip', name: 'VIP Müşteriler', color: 'bg-green-100 border-green-300', customers: [] },
    { id: 'active', name: 'Aktif Müşteriler', color: 'bg-blue-100 border-blue-300', customers: [] },
    { id: 'at_risk', name: 'Risk Altında', color: 'bg-yellow-100 border-yellow-300', customers: [] },
    { id: 'inactive', name: 'Pasif Müşteriler', color: 'bg-gray-100 border-gray-300', customers: [] }
  ]);

  // Müşteri verileri
  const [customersData] = useState([
    {
      id: 1,
      name: 'Ahmet Yılmaz',
      company: 'Yılmaz Teknoloji',
      email: 'ahmet@yilmaz.com',
      phone: '+90 555 123 4567',
      plan: 'premium',
      satisfaction: 4.8,
      lastActivity: '2024-01-15',
      totalSpent: 15000,
      status: 'vip',
      riskLevel: 'low',
      tags: ['VIP', 'Premium']
    },
    {
      id: 2,
      name: 'Ayşe Demir',
      company: 'Demir İnşaat',
      email: 'ayse@demir.com',
      phone: '+90 555 234 5678',
      plan: 'standard',
      satisfaction: 4.2,
      lastActivity: '2024-01-14',
      totalSpent: 8500,
      status: 'active',
      riskLevel: 'low',
      tags: ['Aktif', 'Standart']
    },
    {
      id: 3,
      name: 'Mehmet Özkan',
      company: 'Özkan Ticaret',
      email: 'mehmet@ozkan.com',
      phone: '+90 555 345 6789',
      plan: 'basic',
      satisfaction: 3.1,
      lastActivity: '2024-01-05',
      totalSpent: 3200,
      status: 'at_risk',
      riskLevel: 'high',
      tags: ['Risk', 'Temel']
    },
    {
      id: 4,
      name: 'Fatma Kaya',
      company: 'Kaya Gıda',
      email: 'fatma@kaya.com',
      phone: '+90 555 456 7890',
      plan: 'standard',
      satisfaction: 4.5,
      lastActivity: '2024-01-12',
      totalSpent: 12000,
      status: 'vip',
      riskLevel: 'low',
      tags: ['VIP', 'Standart']
    },
    {
      id: 5,
      name: 'Ali Veli',
      company: 'Veli Otomotiv',
      email: 'ali@veli.com',
      phone: '+90 555 567 8901',
      plan: 'basic',
      satisfaction: 2.8,
      lastActivity: '2023-12-20',
      totalSpent: 1800,
      status: 'inactive',
      riskLevel: 'high',
      tags: ['Pasif', 'Temel']
    },
    {
      id: 6,
      name: 'Zeynep Arslan',
      company: 'Arslan Tekstil',
      email: 'zeynep@arslan.com',
      phone: '+90 555 678 9012',
      plan: 'premium',
      satisfaction: 4.9,
      lastActivity: '2024-01-16',
      totalSpent: 22000,
      status: 'vip',
      riskLevel: 'low',
      tags: ['VIP', 'Premium']
    },
    {
      id: 7,
      name: 'Mustafa Çelik',
      company: 'Çelik Metal',
      email: 'mustafa@celik.com',
      phone: '+90 555 789 0123',
      plan: 'standard',
      satisfaction: 3.9,
      lastActivity: '2024-01-10',
      totalSpent: 6500,
      status: 'active',
      riskLevel: 'medium',
      tags: ['Aktif', 'Standart']
    },
    {
      id: 8,
      name: 'Elif Özkan',
      company: 'Özkan Eğitim',
      email: 'elif@ozkan.com',
      phone: '+90 555 890 1234',
      plan: 'basic',
      satisfaction: 3.2,
      lastActivity: '2024-01-08',
      totalSpent: 2800,
      status: 'at_risk',
      riskLevel: 'high',
      tags: ['Risk', 'Temel']
    }
  ]);

  // Görev verileri
  const [tasksData] = useState([
    {
      id: 1,
      title: 'Müşteri Memnuniyet Anketi Geliştirme',
      description: 'Yeni müşteri memnuniyet anketi sistemi geliştirilmesi',
      assignee: 'Ahmet Yılmaz',
      priority: 'high',
      status: 'in_progress',
      progress: 75,
      dueDate: '2024-01-15',
      estimatedHours: 40,
      actualHours: 30,
      tags: ['Frontend', 'React']
    },
    {
      id: 2,
      title: 'Yeni Destek Portalı Tasarımı',
      description: 'Müşteri destek portalı için modern tasarım oluşturulması',
      assignee: 'Ayşe Demir',
      priority: 'medium',
      status: 'pending',
      progress: 0,
      dueDate: '2024-01-20',
      estimatedHours: 24,
      actualHours: 0,
      tags: ['UI/UX', 'Design']
    },
    {
      id: 3,
      title: 'Takım Performans Raporu',
      description: 'Aylık takım performans raporu hazırlanması',
      assignee: 'Mehmet Özkan',
      priority: 'high',
      status: 'completed',
      progress: 100,
      dueDate: '2024-01-10',
      estimatedHours: 16,
      actualHours: 16,
      tags: ['Rapor', 'Analiz']
    },
    {
      id: 4,
      title: 'Müşteri Eğitim Materyalleri',
      description: 'Yeni müşteriler için eğitim materyalleri hazırlanması',
      assignee: 'Fatma Kaya',
      priority: 'low',
      status: 'in_progress',
      progress: 45,
      dueDate: '2024-01-25',
      estimatedHours: 32,
      actualHours: 14,
      tags: ['Eğitim', 'Dokümantasyon']
    },
    {
      id: 5,
      title: 'Sistem Güvenlik Güncellemesi',
      description: 'Sistem güvenlik açıklarının kapatılması',
      assignee: 'Ali Veli',
      priority: 'high',
      status: 'pending',
      progress: 0,
      dueDate: '2024-01-18',
      estimatedHours: 20,
      actualHours: 0,
      tags: ['Güvenlik', 'Backend']
    }
  ]);

  // Modal state'leri
  const [modals, setModals] = useState({
    viewMember: { isOpen: false, data: null as any },
    editMember: { isOpen: false, data: null as any },
    assignTask: { isOpen: false, data: null as any },
    performanceReview: { isOpen: false, data: null as any },
    leaveManagement: { isOpen: false, data: null as any },
    sendMessage: { isOpen: false, data: null as any },
    deleteMember: { isOpen: false, data: null as any },
    regionDetails: { isOpen: false, data: null as any },
    campaignDetails: { isOpen: false, data: null as any },
    customerSegmentDetails: { isOpen: false, data: null as any },
    newTask: { isOpen: false, data: null as any },
    viewTaskDetails: { isOpen: false, data: null as any }
  });

  // İşlem geçmişi state'i
  const [actionHistory, setActionHistory] = useState([
    {
      id: 1,
      action: 'Görev Atandı',
      user: 'Mehmet Özkan',
      target: 'Elif Özkan',
      timestamp: new Date(Date.now() - 1000 * 60 * 30), // 30 dakika önce
      type: 'task_assignment',
      details: 'Müşteri şikayeti çözümü görevi atandı'
    },
    {
      id: 2,
      action: 'Performans Değerlendirmesi',
      user: 'Mehmet Özkan',
      target: 'Can Arslan',
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2), // 2 saat önce
      type: 'performance_review',
      details: 'Aylık performans değerlendirmesi tamamlandı'
    },
    {
      id: 3,
      action: 'Bölge Raporu Oluşturuldu',
      user: 'Mehmet Özkan',
      target: 'İstanbul Bölgesi',
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 4), // 4 saat önce
      type: 'report_generation',
      details: 'Aylık bölge performans raporu oluşturuldu'
    }
  ]);

  const {
    tickets,
    agents,
    payments,
    fetchAgents,
    fetchTickets,
    fetchCustomers,
    fetchPayments
  } = useSupabase();

  // Müdür türleri ve özel menüleri
  const managerTypes = {
    'team-manager': {
      title: 'Takım Müdürü',
      icon: Users,
      color: 'blue',
      menuItems: [
        { id: 'dashboard', label: 'Dashboard', icon: Home },
        { id: 'team-management', label: 'Takım Yönetimi', icon: Users },
        { id: 'team-communication', label: 'Takım İletişimi', icon: MessageSquare },
        { id: 'analytics', label: 'Analitik & Raporlar', icon: BarChart3 },
        { id: 'tasks', label: 'Görevler', icon: Target },
        { id: 'customers', label: 'Müşteri Analizi', icon: Eye },
        { id: 'action-history', label: 'İşlem Geçmişi', icon: History },
        { id: 'settings', label: 'Ayarlar', icon: Settings }
      ]
    },
    'regional-manager': {
      title: 'Bölge Müdürü',
      icon: MapPin,
      color: 'green',
      menuItems: [
        { id: 'dashboard', label: 'Dashboard', icon: Home },
        { id: 'team-management', label: 'Takım Yönetimi', icon: Users },
        { id: 'team-communication', label: 'Takım İletişimi', icon: MessageSquare },
        { id: 'analytics', label: 'Analitik & Raporlar', icon: BarChart3 },
        { id: 'tasks', label: 'Görevler', icon: Target },
        { id: 'budget', label: 'Bütçe Yönetimi', icon: DollarSign },
        { id: 'regional-analysis', label: 'Bölge Analizi', icon: MapPin },
        { id: 'performance', label: 'Performans Takibi', icon: TrendingUp },
        { id: 'customers', label: 'Müşteri Analizi', icon: Eye },
        { id: 'action-history', label: 'İşlem Geçmişi', icon: History },
        { id: 'settings', label: 'Ayarlar', icon: Settings }
      ]
    },
    'cmo': {
      title: 'CMO (Pazarlama Müdürü)',
      icon: TrendingUp,
      color: 'purple',
      menuItems: [
        { id: 'dashboard', label: 'Dashboard', icon: Home },
        { id: 'customer-insights', label: 'Müşteri İçgörüleri', icon: Eye },
        { id: 'team-communication', label: 'Takım İletişimi', icon: MessageSquare },
        { id: 'tasks', label: 'Görevler', icon: Target },
        { id: 'budget', label: 'Pazarlama Bütçesi', icon: DollarSign },
        { id: 'brand-management', label: 'Marka Yönetimi', icon: Shield },
        { id: 'action-history', label: 'İşlem Geçmişi', icon: History },
        { id: 'settings', label: 'Ayarlar', icon: Settings }
      ]
    }
  };

  const currentManagerType = managerTypes[selectedManagerType as keyof typeof managerTypes];

  // Grup oluşturma fonksiyonu
  const handleCreateGroup = () => {
    if (!newGroup.name.trim()) {
      alert('Grup adı gereklidir');
      return;
    }
    
    console.log('Yeni grup oluşturuluyor:', newGroup);
    // Burada gerçek grup oluşturma işlemi yapılacak
    
    // Formu temizle
    setNewGroup({
      name: '',
      description: '',
      type: 'public',
      members: []
    });
    setShowNewGroupModal(false);
    alert('Grup başarıyla oluşturuldu!');
  };

  // Modal yönetim fonksiyonları
  const openModal = (modalName: string, data: any = null) => {
    setModals(prev => ({
      ...prev,
      [modalName]: { isOpen: true, data }
    }));
  };

  const closeModal = useCallback((modalName: string) => {
    console.log(`Modal kapatılıyor: ${modalName}`);
    setModals(prev => ({
      ...prev,
      [modalName]: { isOpen: false, data: null }
    }));
  }, []);

  // İşlem geçmişi ekleme fonksiyonu
  const addToActionHistory = (action: string, target: string, type: string, details: string) => {
    const newAction = {
      id: actionHistory.length + 1,
      action,
      user: 'Mehmet Özkan', // Şu anki kullanıcı
      target,
      timestamp: new Date(),
      type,
      details
    };
    
    setActionHistory(prev => [newAction, ...prev]);
  };

  // İşlem fonksiyonları
  const handleViewMember = (member: any) => {
    openModal('viewMember', member);
  };

  const handleEditMember = (member: any) => {
    openModal('editMember', member);
  };

  const handleAssignTask = (member: any) => {
    openModal('assignTask', member);
  };

  const handlePerformanceReview = (member: any) => {
    openModal('performanceReview', member);
  };

  const handleLeaveManagement = (member: any) => {
    openModal('leaveManagement', member);
  };

  const handleSendMessage = (member: any) => {
    openModal('sendMessage', member);
  };

  const handleDeleteMember = (member: any) => {
    openModal('deleteMember', member);
  };

  useEffect(() => {
    // Müdür verilerini yükle
    fetchAgents();
    fetchTickets();
    fetchCustomers();
    fetchPayments();
    
    // Gerçek zamanlı güncellemeler için subscription
    const ticketsSubscription = supabase
      .channel('manager_tickets_changes')
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'tickets' 
        }, 
        (payload: any) => {
          console.log('Manager ticket change detected:', payload);
          fetchTickets();
        }
      )
      .subscribe();

    // Demo müdür verisi - gerçek uygulamada auth'dan gelecek
    const demoManager = {
      id: 'manager-1',
      name: 'Mehmet Özkan',
      email: 'mehmet@company.com',
      phone: '+90 555 987 6543',
      department: 'Müşteri Hizmetleri Müdürü',
      status: 'active',
      avatar: null,
      created_at: new Date().toISOString(),
      last_login: new Date().toISOString(),
      team_size: 12,
      total_revenue: 125000,
      team_performance: 4.7
    };
    setManagerData(demoManager);

    return () => {
      ticketsSubscription.unsubscribe();
    };
  }, [fetchAgents, fetchTickets, fetchCustomers, fetchPayments]);

  // Müdür istatistikleri
  const managerStats = {
    totalTickets: tickets.length,
    openTickets: tickets.filter(t => t.status === 'open' || t.status === 'pending').length,
    resolvedTickets: tickets.filter(t => t.status === 'resolved').length,
    teamSize: agents.length,
    totalRevenue: payments.reduce((sum, payment) => sum + (payment.amount || 0), 0),
    avgResponseTime: '1.8 saat',
    customerSatisfaction: 4.7,
    teamPerformance: 4.6
  };

  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  // Modal bileşenleri
  const Modal = ({ isOpen, onClose, title, children, size = 'medium' }: {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    children: React.ReactNode;
    size?: 'small' | 'medium' | 'large';
  }) => {
    const [isDragging, setIsDragging] = useState(false);
    const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
    const [modalPosition, setModalPosition] = useState({ x: 0, y: 0 });

    if (!isOpen) return null;

    const sizeClasses: Record<string, string> = {
      small: 'max-w-md',
      medium: 'max-w-2xl',
      large: 'max-w-4xl'
    };

    const handleBackdropClick = (e: React.MouseEvent) => {
      if (e.target === e.currentTarget) {
        onClose();
      }
    };

    const handleCloseClick = (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      onClose();
    };

    const handleMouseDown = (e: React.MouseEvent) => {
      if (e.target === e.currentTarget || (e.target as HTMLElement).closest('button')) {
        return;
      }
      setIsDragging(true);
      setDragOffset({
        x: e.clientX - modalPosition.x,
        y: e.clientY - modalPosition.y
      });
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;
      
      const newX = e.clientX - dragOffset.x;
      const newY = e.clientY - dragOffset.y;
      
      // Ekran sınırları içinde tut
      const maxX = window.innerWidth - 400; // Modal genişliği
      const maxY = window.innerHeight - 200; // Modal yüksekliği
      
      setModalPosition({
        x: Math.max(0, Math.min(newX, maxX)),
        y: Math.max(0, Math.min(newY, maxY))
      });
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    React.useEffect(() => {
      if (isDragging) {
        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);
        return () => {
          document.removeEventListener('mousemove', handleMouseMove);
          document.removeEventListener('mouseup', handleMouseUp);
        };
      }
    }, [isDragging, dragOffset]);

    return (
      <div 
        className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999] p-4"
        onClick={handleBackdropClick}
      >
        <div 
          className={`bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full ${sizeClasses[size as keyof typeof sizeClasses]} max-h-[95vh] flex flex-col cursor-move select-none`}
          style={{
            transform: `translate(${modalPosition.x}px, ${modalPosition.y}px)`,
            transition: isDragging ? 'none' : 'transform 0.2s ease-out'
          }}
          onMouseDown={handleMouseDown}
        >
          <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{title}</h3>
            <button
              onClick={handleCloseClick}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 z-10 cursor-pointer"
              type="button"
              aria-label="Modalı kapat"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
          <div className="p-6 overflow-y-auto flex-1 min-h-0">
            {children}
          </div>
        </div>
      </div>
    );
  };

  const renderDashboard = () => (
    <div className="space-y-4">
      {/* Müdür Türü Seçici */}
      <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className={`p-2 bg-${currentManagerType.color}-100 dark:bg-${currentManagerType.color}-900 rounded-lg`}>
              <currentManagerType.icon className={`w-5 h-5 text-${currentManagerType.color}-600 dark:text-${currentManagerType.color}-400`} />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Müdür Portalı</h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">Rolünüzü seçin ve özel dashboard'unuzu görün</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Müdür Türü:</label>
            <select 
              value={selectedManagerType}
              onChange={(e) => setSelectedManagerType(e.target.value)}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="team-manager">Takım Müdürü</option>
              <option value="regional-manager">Bölge Müdürü</option>
              <option value="cmo">CMO (Pazarlama Müdürü)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Kompakt Hoş Geldin Paneli */}
      <div className="bg-gradient-to-r from-purple-600 via-blue-600 to-indigo-700 rounded-xl p-6 text-white relative overflow-hidden">
        <div className="absolute inset-0 bg-black/10"></div>
        <div className="relative z-10 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-white/20 rounded-full">
              <Shield className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Hoş geldin, Mehmet Özkan! 👏</h1>
              <p className="text-purple-100 text-sm">Operasyonel mükemmellik merkezi - Takımınızın performansını optimize edin</p>
            </div>
          </div>
          <div className="text-right">
            <div className="text-xs text-purple-200 mb-1">Son Güncelleme</div>
            <div className="text-xl font-bold">{new Date().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}</div>
            <div className="flex items-center space-x-1 text-green-300">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
              <span className="text-xs">Canlı Veri</span>
            </div>
          </div>
        </div>
      </div>

      {/* Kompakt İstatistik Kartları */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm hover:shadow-md transition-all duration-200 border border-gray-100 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-gray-600 dark:text-gray-400">Aktif Kullanıcılar</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{realTimeData.activeUsers}</p>
            </div>
            <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
              <TrendingUp className="w-5 h-5 text-green-600 dark:text-green-400" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm hover:shadow-md transition-all duration-200 border border-gray-100 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-gray-600 dark:text-gray-400">Aktif Talepler</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{realTimeData.currentTickets}</p>
            </div>
            <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
              <MessageSquare className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm hover:shadow-md transition-all duration-200 border border-gray-100 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-gray-600 dark:text-gray-400">Ort. Yanıt</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{realTimeData.avgResponseTime}m</p>
            </div>
            <div className="p-2 bg-yellow-100 dark:bg-yellow-900 rounded-lg">
              <Timer className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm hover:shadow-md transition-all duration-200 border border-gray-100 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-gray-600 dark:text-gray-400">Memnuniyet</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{realTimeData.customerSatisfaction}/5</p>
            </div>
            <div className="p-2 bg-purple-100 dark:bg-purple-900 rounded-lg">
              <Star className="w-5 h-5 text-purple-600 dark:text-purple-400" />
            </div>
          </div>
        </div>
      </div>


      {/* Kompakt Analiz Paneli */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Takım Performans Analizi */}
        <div className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
                <BarChart3 className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Takım Performansı</h3>
            </div>
            <div className="flex items-center space-x-2">
              <select 
                value={selectedTimeRange}
                onChange={(e) => setSelectedTimeRange(e.target.value)}
                className="px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option value="1d">Son 1 Gün</option>
                <option value="7d">Son 7 Gün</option>
                <option value="30d">Son 30 Gün</option>
                <option value="90d">Son 3 Ay</option>
              </select>
              <button
                onClick={() => toggleSection('team-performance')}
                className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
              >
                {expandedSections['team-performance'] ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
              </button>
            </div>
          </div>
          
          <div className="space-y-2">
            {(() => {
              // Fallback veri - agents boşsa örnek veri kullan
              const fallbackAgents = [
                { id: '1', name: 'Ayşe Demir', department: 'Müşteri Hizmetleri', status: 'active' },
                { id: '2', name: 'Mehmet Özkan', department: 'Teknik Destek', status: 'active' },
                { id: '3', name: 'Fatma Kaya', department: 'Satış', status: 'active' },
                { id: '4', name: 'Can Arslan', department: 'Müşteri Hizmetleri', status: 'active' }
              ];
              
              const displayAgents = agents && agents.length > 0 ? agents : fallbackAgents;
              
              return displayAgents.slice(0, 4).map((agent: any, index: number) => {
              // Sabit performans değerleri - her render'da değişmesin
              const performanceValues = [4.2, 4.5, 4.8, 4.1];
              const ticketsValues = [45, 52, 38, 41];
              
              const performance = performanceValues[index] || 4.5;
              const ticketsResolved = ticketsValues[index] || 40;
              
              return (
                <div key={agent.id || index} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-sm">
                      {agent.name?.charAt(0) || 'A'}
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900 dark:text-white text-sm">{agent.name || `Agent ${index + 1}`}</h4>
                      <p className="text-xs text-gray-600 dark:text-gray-400">{agent.department || 'Müşteri Hizmetleri'}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center space-x-1">
                      <Star className="w-3 h-3 text-yellow-500 fill-current" />
                      <span className="text-sm font-medium text-gray-900 dark:text-white">{performance.toFixed(1)}</span>
                    </div>
                    <span className="text-xs text-gray-500 dark:text-gray-400">{ticketsResolved} talep çözüldü</span>
                  </div>
                </div>
              );
              });
            })()}
          </div>
        </div>

        {/* Hızlı Aksiyonlar ve Uyarılar */}
        <div className="space-y-6">
          {/* Kritik Uyarılar */}
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg border border-gray-200 dark:border-gray-700">
            <div className="flex items-center space-x-3 mb-4">
              <div className="p-2 bg-gradient-to-r from-red-500 to-red-600 rounded-lg">
                <AlertTriangle className="w-5 h-5 text-white" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Kritik Uyarılar</h3>
            </div>
            
            <div className="space-y-3">
              <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                <div className="flex items-center space-x-2 mb-1">
                  <AlertCircle className="w-4 h-4 text-red-600 dark:text-red-400" />
                  <span className="text-sm font-medium text-red-900 dark:text-red-100">SLA Aşımı</span>
                </div>
                <p className="text-xs text-red-700 dark:text-red-300">3 yüksek öncelikli talep SLA süresini aştı</p>
              </div>
              
              <div className="p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                <div className="flex items-center space-x-2 mb-1">
                  <Clock className="w-4 h-4 text-yellow-600 dark:text-yellow-400" />
                  <span className="text-sm font-medium text-yellow-900 dark:text-yellow-100">Yanıt Süresi</span>
                </div>
                <p className="text-xs text-yellow-700 dark:text-yellow-300">Ortalama yanıt süresi hedefin üzerinde</p>
              </div>
              
              <div className="p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                <div className="flex items-center space-x-2 mb-1">
                  <Users className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  <span className="text-sm font-medium text-blue-900 dark:text-blue-100">Takım Durumu</span>
                </div>
                <p className="text-xs text-blue-700 dark:text-blue-300">2 takım üyesi izinli</p>
              </div>
            </div>
          </div>

          {/* Hızlı Aksiyonlar */}
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg border border-gray-200 dark:border-gray-700">
            <div className="flex items-center space-x-3 mb-4">
              <div className="p-2 bg-gradient-to-r from-green-500 to-green-600 rounded-lg">
                <Zap className="w-5 h-5 text-white" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Hızlı Aksiyonlar</h3>
            </div>
            
            <div className="space-y-3">
              <button 
                onClick={() => {
                  // Admin paneldeki görevler sayfasına yönlendir
                  window.location.href = '/#tasks';
                }}
                className="w-full flex items-center space-x-3 p-3 bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/30 rounded-lg transition-colors group"
              >
                <Plus className="w-5 h-5 text-blue-600 dark:text-blue-400 group-hover:scale-110 transition-transform" />
                <span className="text-sm font-medium text-blue-900 dark:text-blue-100">Görev Ata</span>
              </button>
              
              <button 
                onClick={() => setCurrentPage('budget')}
                className="w-full flex items-center space-x-3 p-3 bg-green-50 dark:bg-green-900/20 hover:bg-green-100 dark:hover:bg-green-900/30 rounded-lg transition-colors group"
              >
                <DollarSign className="w-5 h-5 text-green-600 dark:text-green-400 group-hover:scale-110 transition-transform" />
                <span className="text-sm font-medium text-green-900 dark:text-green-100">Bütçe Güncelle</span>
              </button>
              
              <button 
                onClick={() => setCurrentPage('analytics')}
                className="w-full flex items-center space-x-3 p-3 bg-purple-50 dark:bg-purple-900/20 hover:bg-purple-100 dark:hover:bg-purple-900/30 rounded-lg transition-colors group"
              >
                <FileText className="w-5 h-5 text-purple-600 dark:text-purple-400 group-hover:scale-110 transition-transform" />
                <span className="text-sm font-medium text-purple-900 dark:text-purple-100">Rapor Oluştur</span>
              </button>
              
              <button className="w-full flex items-center space-x-3 p-3 bg-orange-50 dark:bg-orange-900/20 hover:bg-orange-100 dark:hover:bg-orange-900/30 rounded-lg transition-colors group">
                <RefreshCw className="w-5 h-5 text-orange-600 dark:text-orange-400 group-hover:scale-110 transition-transform" />
                <span className="text-sm font-medium text-orange-900 dark:text-orange-100">Verileri Yenile</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderTeamManagement = () => {
    // Fallback veri - agents boşsa örnek veri kullan
    const fallbackAgents = [
      { id: '1', name: 'Ayşe Demir', email: 'ayse@example.com', department: 'Müşteri Hizmetleri', status: 'active' },
      { id: '2', name: 'Mehmet Özkan', email: 'mehmet@example.com', department: 'Teknik Destek', status: 'active' },
      { id: '3', name: 'Fatma Kaya', email: 'fatma@example.com', department: 'Satış', status: 'active' },
      { id: '4', name: 'Can Arslan', email: 'can@example.com', department: 'Müşteri Hizmetleri', status: 'active' },
      { id: '5', name: 'Zeynep Yılmaz', email: 'zeynep@example.com', department: 'Pazarlama', status: 'active' },
      { id: '6', name: 'Ali Çelik', email: 'ali@example.com', department: 'İnsan Kaynakları', status: 'active' }
    ];
    
    const displayAgents = agents && agents.length > 0 ? agents : fallbackAgents;

    return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Takım Yönetimi</h1>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Takım üyelerini yönetin, performansları takip edin ve görev atayın
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <FeedbackButton 
            pageSource="ManagerPortal-team-management" 
            position="inline"
            className="inline-flex items-center px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-medium"
          />
          <button className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
            <Plus className="w-4 h-4" />
            <span>Yeni Üye Ekle</span>
          </button>
        </div>
      </div>

      {/* Takım Üyeleri Listesi */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Takım Üyeleri</h3>
            <div className="flex items-center space-x-2">
              <Search className="w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Takım üyesi ara..."
                className="px-3 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Üye
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Departman
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Performans
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Aktif Talepler
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Durum
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  İşlemler
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {displayAgents.map((agent: any, index: number) => (
                <tr key={agent.id || index} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white font-semibold">
                        {agent.name?.charAt(0) || 'A'}
                      </div>
                      <div>
                        <div className="text-sm font-medium text-gray-900 dark:text-white">
                          {agent.name || 'Temsilci'}
                        </div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          {agent.email || 'email@example.com'}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm text-gray-900 dark:text-white">
                      {agent.department || 'Müşteri Hizmetleri'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center space-x-1">
                      <Star className="w-4 h-4 text-yellow-500 fill-current" />
                      <span className="text-sm font-medium text-gray-900 dark:text-white">
                        4.{[2, 5, 8, 1, 6, 3, 4, 7][index] || 5}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="px-2 py-1 text-xs bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300 rounded-full">
                      {[3, 7, 2, 5, 8, 4, 6, 1][index] || 5}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="px-2 py-1 text-xs bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300 rounded-full">
                      Aktif
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex items-center space-x-1">
                      {/* Görüntüle */}
                      <button 
                        onClick={() => handleViewMember(agent)}
                        className="p-1.5 text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded transition-colors"
                        title="Detayları Görüntüle"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      
                      {/* Düzenle */}
                      <button 
                        onClick={() => handleEditMember(agent)}
                        className="p-1.5 text-green-600 hover:text-green-800 dark:text-green-400 dark:hover:text-green-300 hover:bg-green-50 dark:hover:bg-green-900/20 rounded transition-colors"
                        title="Bilgileri Düzenle"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      
                      {/* Görev Ata */}
                      <button 
                        onClick={() => handleAssignTask(agent)}
                        className="p-1.5 text-purple-600 hover:text-purple-800 dark:text-purple-400 dark:hover:text-purple-300 hover:bg-purple-50 dark:hover:bg-purple-900/20 rounded transition-colors"
                        title="Görev Ata"
                      >
                        <Target className="w-4 h-4" />
                      </button>
                      
                      {/* Performans Değerlendir */}
                      <button 
                        onClick={() => handlePerformanceReview(agent)}
                        className="p-1.5 text-yellow-600 hover:text-yellow-800 dark:text-yellow-400 dark:hover:text-yellow-300 hover:bg-yellow-50 dark:hover:bg-yellow-900/20 rounded transition-colors"
                        title="Performans Değerlendir"
                      >
                        <Star className="w-4 h-4" />
                      </button>
                      
                      {/* İzin Yönetimi */}
                      <button 
                        onClick={() => handleLeaveManagement(agent)}
                        className="p-1.5 text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 dark:hover:text-indigo-300 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded transition-colors"
                        title="İzin Yönetimi"
                      >
                        <Calendar className="w-4 h-4" />
                      </button>
                      
                      {/* Mesaj Gönder */}
                      <button 
                        onClick={() => handleSendMessage(agent)}
                        className="p-1.5 text-cyan-600 hover:text-cyan-800 dark:text-cyan-400 dark:hover:text-cyan-300 hover:bg-cyan-50 dark:hover:bg-cyan-900/20 rounded transition-colors"
                        title="Mesaj Gönder"
                      >
                        <MessageSquare className="w-4 h-4" />
                      </button>
                      
                      {/* Sil */}
                      <button 
                        onClick={() => handleDeleteMember(agent)}
                        className="p-1.5 text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
                        title="Üyeyi Sil"
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
  };

  const renderAnalytics = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Analitik ve Raporlar</h1>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Detaylı performans analizi, trend raporları ve KPI takibi
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <FeedbackButton 
            pageSource="ManagerPortal-analytics" 
            position="inline"
            className="inline-flex items-center px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-medium"
          />
          <button className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors">
            <Download className="w-4 h-4" />
            <span>Rapor İndir</span>
          </button>
        </div>
      </div>

      {/* KPI Kartları */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Çözüm Oranı</p>
              <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                {managerStats.totalTickets > 0 ? Math.round((managerStats.resolvedTickets / managerStats.totalTickets) * 100) : 0}%
              </p>
            </div>
            <div className="p-3 bg-green-100 dark:bg-green-900 rounded-full">
              <CheckCircle className="w-6 h-6 text-green-600 dark:text-green-400" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Ortalama Yanıt Süresi</p>
              <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{managerStats.avgResponseTime}</p>
            </div>
            <div className="p-3 bg-blue-100 dark:bg-blue-900 rounded-full">
              <Clock className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Müşteri Memnuniyeti</p>
              <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">{managerStats.customerSatisfaction}/5</p>
            </div>
            <div className="p-3 bg-purple-100 dark:bg-purple-900 rounded-full">
              <Award className="w-6 h-6 text-purple-600 dark:text-purple-400" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Aktif Talepler</p>
              <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">{managerStats.openTickets}</p>
            </div>
            <div className="p-3 bg-orange-100 dark:bg-orange-900 rounded-full">
              <AlertCircle className="w-6 h-6 text-orange-600 dark:text-orange-400" />
            </div>
          </div>
        </div>
      </div>

      {/* Grafik Alanları */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Aylık Talep Trendi</h3>
          <div className="h-64 flex items-center justify-center bg-gray-50 dark:bg-gray-700 rounded-lg">
            <div className="text-center">
              <LineChart className="w-12 h-12 text-gray-400 mx-auto mb-2" />
              <p className="text-gray-500 dark:text-gray-400">Grafik burada görünecek</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Talep Kategorileri</h3>
          <div className="h-64 flex items-center justify-center bg-gray-50 dark:bg-gray-700 rounded-lg">
            <div className="text-center">
              <PieChart className="w-12 h-12 text-gray-400 mx-auto mb-2" />
              <p className="text-gray-500 dark:text-gray-400">Pasta grafik burada görünecek</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderBudget = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Bütçe Yönetimi</h1>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Departman bütçelerini takip edin, harcamaları analiz edin ve maliyet optimizasyonu yapın
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <FeedbackButton 
            pageSource="ManagerPortal-budget" 
            position="inline"
            className="inline-flex items-center px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-medium"
          />
          <button className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors">
            <Plus className="w-4 h-4" />
            <span>Bütçe Ekle</span>
          </button>
        </div>
      </div>

      {/* Bütçe Özeti */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-gradient-to-r from-green-500 to-green-600 rounded-lg">
              <DollarSign className="w-6 h-6 text-white" />
            </div>
            <span className="text-xs bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300 px-2 py-1 rounded-full">
              +5.2%
            </span>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">Toplam Bütçe</p>
            <p className="text-3xl font-bold text-gray-900 dark:text-white mb-2">₺2,450,000</p>
            <div className="flex items-center space-x-2">
              <div className="w-16 bg-gray-200 dark:bg-gray-600 rounded-full h-2">
                <div className="bg-gradient-to-r from-green-500 to-green-600 h-2 rounded-full" style={{ width: '75%' }}></div>
              </div>
              <span className="text-xs text-gray-500 dark:text-gray-400">75% kullanıldı</span>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg">
              <TrendingUp className="w-6 h-6 text-white" />
            </div>
            <span className="text-xs bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300 px-2 py-1 rounded-full">
              +8.1%
            </span>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">Aylık Gelir</p>
            <p className="text-3xl font-bold text-gray-900 dark:text-white mb-2">₺185,000</p>
            <div className="flex items-center space-x-2">
              <div className="w-16 bg-gray-200 dark:bg-gray-600 rounded-full h-2">
                <div className="bg-gradient-to-r from-blue-500 to-blue-600 h-2 rounded-full" style={{ width: '90%' }}></div>
              </div>
              <span className="text-xs text-gray-500 dark:text-gray-400">Hedefin %90'ı</span>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-gradient-to-r from-orange-500 to-orange-600 rounded-lg">
              <TrendingDown className="w-6 h-6 text-white" />
            </div>
            <span className="text-xs bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300 px-2 py-1 rounded-full">
              -2.3%
            </span>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">Aylık Gider</p>
            <p className="text-3xl font-bold text-gray-900 dark:text-white mb-2">₺142,000</p>
            <div className="flex items-center space-x-2">
              <div className="w-16 bg-gray-200 dark:bg-gray-600 rounded-full h-2">
                <div className="bg-gradient-to-r from-orange-500 to-orange-600 h-2 rounded-full" style={{ width: '65%' }}></div>
              </div>
              <span className="text-xs text-gray-500 dark:text-gray-400">Bütçenin %65'i</span>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-gradient-to-r from-purple-500 to-purple-600 rounded-lg">
              <Percent className="w-6 h-6 text-white" />
            </div>
            <span className="text-xs bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300 px-2 py-1 rounded-full">
              +12.5%
            </span>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">Kar Marjı</p>
            <p className="text-3xl font-bold text-gray-900 dark:text-white mb-2">%23.2</p>
            <div className="flex items-center space-x-2">
              <div className="w-16 bg-gray-200 dark:bg-gray-600 rounded-full h-2">
                <div className="bg-gradient-to-r from-purple-500 to-purple-600 h-2 rounded-full" style={{ width: '23%' }}></div>
              </div>
              <span className="text-xs text-gray-500 dark:text-gray-400">Hedef: %25</span>
            </div>
          </div>
        </div>
      </div>

      {/* Departman Bütçeleri */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg border border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white">Departman Bütçeleri</h3>
          <div className="flex items-center space-x-2">
            <Filter className="w-4 h-4 text-gray-400" />
            <select className="px-3 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white">
              <option>Tüm Departmanlar</option>
              <option>Müşteri Hizmetleri</option>
              <option>Satış</option>
              <option>Pazarlama</option>
              <option>İnsan Kaynakları</option>
            </select>
          </div>
        </div>
        
        <div className="space-y-4">
          {[
            { name: 'Müşteri Hizmetleri', budget: 450000, spent: 320000, color: 'blue' },
            { name: 'Satış', budget: 600000, spent: 480000, color: 'green' },
            { name: 'Pazarlama', budget: 300000, spent: 280000, color: 'purple' },
            { name: 'İnsan Kaynakları', budget: 200000, spent: 150000, color: 'orange' },
            { name: 'Teknoloji', budget: 800000, spent: 650000, color: 'indigo' }
          ].map((dept, index) => {
            const percentage = (dept.spent / dept.budget) * 100;
            const colorClasses = {
              blue: 'from-blue-500 to-blue-600',
              green: 'from-green-500 to-green-600',
              purple: 'from-purple-500 to-purple-600',
              orange: 'from-orange-500 to-orange-600',
              indigo: 'from-indigo-500 to-indigo-600'
            };
            
            return (
              <div key={index} className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h4 className="font-semibold text-gray-900 dark:text-white">{dept.name}</h4>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      ₺{dept.spent.toLocaleString('tr-TR')} / ₺{dept.budget.toLocaleString('tr-TR')}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-gray-900 dark:text-white">%{percentage.toFixed(1)}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">kullanıldı</p>
                  </div>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-3">
                  <div 
                    className={`bg-gradient-to-r ${colorClasses[dept.color as keyof typeof colorClasses]} h-3 rounded-full transition-all duration-500`}
                    style={{ width: `${Math.min(percentage, 100)}%` }}
                  ></div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );

  const renderTasks = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Görev Yönetimi</h1>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Takım üyelerine görev atayın, ilerlemeyi takip edin ve projeleri yönetin
          </p>
        </div>
        <div className="flex items-center space-x-3">
          {/* Görünüm Değiştirme Butonları */}
          <div className="flex items-center bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
            <button
              onClick={() => setTaskView('list')}
              className={`flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                taskView === 'list'
                  ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              <List className="w-4 h-4" />
              <span>Liste</span>
            </button>
            <button
              onClick={() => setTaskView('kanban')}
              className={`flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                taskView === 'kanban'
                  ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              <BarChart3 className="w-4 h-4" />
              <span>Kanban</span>
            </button>
          </div>

          {/* Sütun Ayarları Butonu (Sadece Kanban Görünümünde) */}
          {taskView === 'kanban' && (
            <button
              onClick={() => setShowColumnSettings(true)}
              className="flex items-center space-x-2 px-3 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg text-sm font-medium transition-colors"
            >
              <Settings className="w-4 h-4" />
              <span>Sütun Ayarları</span>
            </button>
          )}

          <FeedbackButton 
            pageSource="ManagerPortal-tasks" 
            position="inline"
            className="inline-flex items-center px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-medium"
          />
          <button 
            onClick={() => openModal('newTask')}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Yeni Görev</span>
          </button>
        </div>
      </div>

      {/* Görev İstatistikleri */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg">
              <Target className="w-6 h-6 text-white" />
            </div>
            <span className="text-xs bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300 px-2 py-1 rounded-full">
              Toplam
            </span>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">Toplam Görev</p>
            <p className="text-3xl font-bold text-gray-900 dark:text-white">{tasksData.length}</p>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-gradient-to-r from-green-500 to-green-600 rounded-lg">
              <CheckCircle className="w-6 h-6 text-white" />
            </div>
            <span className="text-xs bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300 px-2 py-1 rounded-full">
              Tamamlandı
            </span>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">Tamamlanan</p>
            <p className="text-3xl font-bold text-gray-900 dark:text-white">
              {tasksData.filter(t => t.status === 'completed').length}
            </p>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-gradient-to-r from-yellow-500 to-yellow-600 rounded-lg">
              <Clock className="w-6 h-6 text-white" />
            </div>
            <span className="text-xs bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300 px-2 py-1 rounded-full">
              Devam Ediyor
            </span>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">Devam Eden</p>
            <p className="text-3xl font-bold text-gray-900 dark:text-white">
              {tasksData.filter(t => t.status === 'in_progress').length}
            </p>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-gradient-to-r from-orange-500 to-orange-600 rounded-lg">
              <AlertTriangle className="w-6 h-6 text-white" />
            </div>
            <span className="text-xs bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300 px-2 py-1 rounded-full">
              Bekleyen
            </span>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">Bekleyen</p>
            <p className="text-3xl font-bold text-gray-900 dark:text-white">
              {tasksData.filter(t => t.status === 'pending').length}
            </p>
          </div>
        </div>
      </div>

      {/* Görev Görünümü */}
      {taskView === 'list' ? (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="p-4 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-gray-900 dark:text-white">Görev Listesi</h3>
          <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-600 dark:text-gray-400">Toplam:</span>
                <span className="px-2 py-1 bg-orange-100 dark:bg-orange-900 text-orange-800 dark:text-orange-200 rounded-full text-sm font-medium">
                  {tasksData.length}
                </span>
              </div>
          </div>
        </div>
        
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Görev
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Atanan
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Öncelik
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Durum
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    İlerleme
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Bitiş Tarihi
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    İşlemler
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {tasksData.map((task) => {
                  const getPriorityColor = (priority: string) => {
                    switch (priority) {
                      case 'high': return 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300';
                      case 'medium': return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300';
                      case 'low': return 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300';
                      default: return 'bg-gray-100 text-gray-700 dark:bg-gray-900 dark:text-gray-300';
                    }
                  };

                  const getStatusColor = (status: string) => {
                    switch (status) {
                      case 'pending': return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300';
                      case 'in_progress': return 'bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300';
                      case 'completed': return 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300';
                      case 'cancelled': return 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300';
                      default: return 'bg-gray-100 text-gray-700 dark:bg-gray-900 dark:text-gray-300';
                    }
                  };

                  const formatDate = (dateString: string) => {
                    return new Date(dateString).toLocaleDateString('tr-TR', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric'
                    });
                  };

                  return (
                    <tr key={task.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900 dark:text-white">
                            {task.title}
                          </div>
                          <div className="text-sm text-gray-500 dark:text-gray-400">
                            {task.description}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900 dark:text-white">{task.assignee}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getPriorityColor(task.priority)}`}>
                      {task.priority === 'high' ? 'Yüksek' : task.priority === 'medium' ? 'Orta' : 'Düşük'}
                    </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(task.status)}`}>
                          {task.status === 'pending' ? 'Beklemede' : 
                           task.status === 'in_progress' ? 'Devam Ediyor' : 
                           task.status === 'completed' ? 'Tamamlandı' : 'İptal Edildi'}
                    </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-1 bg-gray-200 dark:bg-gray-600 rounded-full h-2 mr-2">
                            <div 
                              className="bg-blue-600 h-2 rounded-full" 
                              style={{ width: `${task.progress}%` }}
                            ></div>
                  </div>
                          <span className="text-sm text-gray-600 dark:text-gray-400">{task.progress}%</span>
                  </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        {formatDate(task.dueDate)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                <div className="flex items-center space-x-2">
                          <button className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300">
                            <Edit className="w-4 h-4" />
                  </button>
                  <button 
                    onClick={() => openModal('viewTaskDetails', task)}
                            className="text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-300"
                  >
                            <Eye className="w-4 h-4" />
                  </button>
                </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
              </div>
            </div>
      ) : (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="p-4 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-gray-900 dark:text-white">Kanban Görünümü</h3>
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-600 dark:text-gray-400">Toplam:</span>
                <span className="px-2 py-1 bg-orange-100 dark:bg-orange-900 text-orange-800 dark:text-orange-200 rounded-full text-sm font-medium">
                  {tasksData.length}
                </span>
        </div>
            </div>
          </div>
          
          <div className="p-6">
            <div className="flex space-x-6 overflow-x-auto">
              {customColumns.map((column) => {
                const columnTasks = tasksData.filter(task => {
                  switch (column.id) {
                    case 'pending': return task.status === 'pending';
                    case 'in_progress': return task.status === 'in_progress';
                    case 'completed': return task.status === 'completed';
                    case 'cancelled': return task.status === 'cancelled';
                    default: return false;
                  }
                });

                return (
                  <div key={column.id} className="flex-shrink-0 w-80">
                    <div className={`${column.color} border-2 rounded-lg p-4 min-h-96`}>
                      <div className="flex items-center justify-between mb-4">
                        <h4 className="font-semibold text-gray-900 dark:text-white">
                          {column.name}
                        </h4>
                        <span className="px-2 py-1 bg-white dark:bg-gray-600 text-gray-600 dark:text-gray-300 rounded-full text-sm font-medium">
                          {columnTasks.length}
                        </span>
                      </div>
                      
                      <div className="space-y-3">
                        {columnTasks.map((task) => {
                          const getPriorityColor = (priority: string) => {
                            switch (priority) {
                              case 'high': return 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300';
                              case 'medium': return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300';
                              case 'low': return 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300';
                              default: return 'bg-gray-100 text-gray-700 dark:bg-gray-900 dark:text-gray-300';
                            }
                          };

                          return (
                            <div
                              key={task.id}
                              className="bg-white dark:bg-gray-700 rounded-lg p-4 shadow-sm border border-gray-200 dark:border-gray-600 hover:shadow-md transition-shadow cursor-pointer"
                            >
                              <div className="flex items-start justify-between mb-2">
                                <h5 className="text-sm font-medium text-gray-900 dark:text-white line-clamp-2">
                                  {task.title}
                                </h5>
                                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(task.priority)}`}>
                                  {task.priority === 'high' ? 'Yüksek' : task.priority === 'medium' ? 'Orta' : 'Düşük'}
                                </span>
                              </div>
                              
                              <p className="text-xs text-gray-600 dark:text-gray-400 mb-3 line-clamp-2">
                                {task.description}
                              </p>
                              
                              <div className="mb-3">
                                <div className="flex justify-between text-xs mb-1">
                                  <span className="text-gray-600 dark:text-gray-400">İlerleme</span>
                                  <span className="font-semibold text-gray-900 dark:text-white">{task.progress}%</span>
                                </div>
                                <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2">
                                  <div 
                                    className="bg-blue-600 h-2 rounded-full"
                                    style={{ width: `${task.progress}%` }}
                                  ></div>
                                </div>
                              </div>
                              
                              <div className="flex items-center justify-between">
                                <span className="text-xs text-gray-500 dark:text-gray-400">
                                  {task.actualHours}h / {task.estimatedHours}h
                                </span>
                                <span className="text-xs text-gray-500 dark:text-gray-400">
                                  {new Date(task.dueDate).toLocaleDateString('tr-TR')}
                                </span>
      </div>
                            </div>
                          );
                        })}
                        
                        {columnTasks.length === 0 && (
                          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                            <Target className="w-8 h-8 mx-auto mb-2 opacity-50" />
                            <p className="text-sm">Bu sütunda görev yok</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );

  const renderCustomers = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Müşteri Analizi</h1>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Müşteri segmentasyonu, memnuniyet analizi ve churn riski takibi
          </p>
        </div>
        <div className="flex items-center space-x-3">
          {/* Görünüm Değiştirme Butonları */}
          <div className="flex items-center bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
            <button
              onClick={() => setCustomerView('list')}
              className={`flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                customerView === 'list'
                  ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              <List className="w-4 h-4" />
              <span>Liste</span>
            </button>
            <button
              onClick={() => setCustomerView('kanban')}
              className={`flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                customerView === 'kanban'
                  ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              <BarChart3 className="w-4 h-4" />
              <span>Kanban</span>
            </button>
          </div>

          {/* Sütun Ayarları Butonu (Sadece Kanban Görünümünde) */}
          {customerView === 'kanban' && (
            <button
              onClick={() => setShowCustomerColumnSettings(true)}
              className="flex items-center space-x-2 px-3 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg text-sm font-medium transition-colors"
            >
              <Settings className="w-4 h-4" />
              <span>Sütun Ayarları</span>
            </button>
          )}

          <FeedbackButton 
            pageSource="ManagerPortal-customers" 
            position="inline"
            className="inline-flex items-center px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-medium"
          />
          <button className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
            <Download className="w-4 h-4" />
            <span>Rapor İndir</span>
          </button>
        </div>
      </div>

      {/* Müşteri İstatistikleri */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-gradient-to-r from-green-500 to-green-600 rounded-lg">
              <Star className="w-6 h-6 text-white" />
            </div>
            <span className="text-xs bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300 px-2 py-1 rounded-full">
              VIP
            </span>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">VIP Müşteriler</p>
            <p className="text-3xl font-bold text-gray-900 dark:text-white">
              {customersData.filter(c => c.status === 'vip').length}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              %{Math.round((customersData.filter(c => c.status === 'vip').length / customersData.length) * 100)} toplam müşteri
            </p>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg">
              <UserCheck className="w-6 h-6 text-white" />
            </div>
            <span className="text-xs bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300 px-2 py-1 rounded-full">
              Aktif
            </span>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">Aktif Müşteriler</p>
            <p className="text-3xl font-bold text-gray-900 dark:text-white">
              {customersData.filter(c => c.status === 'active').length}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              %{Math.round((customersData.filter(c => c.status === 'active').length / customersData.length) * 100)} toplam müşteri
            </p>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-gradient-to-r from-yellow-500 to-yellow-600 rounded-lg">
              <AlertTriangle className="w-6 h-6 text-white" />
            </div>
            <span className="text-xs bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300 px-2 py-1 rounded-full">
              Risk
            </span>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">Risk Altında</p>
            <p className="text-3xl font-bold text-gray-900 dark:text-white">
              {customersData.filter(c => c.status === 'at_risk').length}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              %{Math.round((customersData.filter(c => c.status === 'at_risk').length / customersData.length) * 100)} toplam müşteri
            </p>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-gradient-to-r from-purple-500 to-purple-600 rounded-lg">
              <TrendingUp className="w-6 h-6 text-white" />
            </div>
            <span className="text-xs bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300 px-2 py-1 rounded-full">
              Ortalama
            </span>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">Memnuniyet</p>
            <p className="text-3xl font-bold text-gray-900 dark:text-white">
              {(customersData.reduce((acc, c) => acc + c.satisfaction, 0) / customersData.length).toFixed(1)}/5
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Ortalama puan</p>
          </div>
        </div>
      </div>

      {/* Müşteri Görünümü */}
      {customerView === 'list' ? (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="p-4 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-gray-900 dark:text-white">Müşteri Listesi</h3>
          <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-600 dark:text-gray-400">Toplam:</span>
                <span className="px-2 py-1 bg-orange-100 dark:bg-orange-900 text-orange-800 dark:text-orange-200 rounded-full text-sm font-medium">
                  {customersData.length}
                </span>
              </div>
          </div>
        </div>
        
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Müşteri
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Şirket
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Plan
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Durum
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Memnuniyet
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Toplam Harcama
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Son Aktivite
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    İşlemler
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {customersData.map((customer) => {
                  const getStatusColor = (status: string) => {
                    switch (status) {
                      case 'vip': return 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300';
                      case 'active': return 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300';
                      case 'at_risk': return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300';
                      case 'inactive': return 'bg-gray-100 text-gray-700 dark:bg-gray-900 dark:text-gray-300';
                      default: return 'bg-gray-100 text-gray-700 dark:bg-gray-900 dark:text-gray-300';
                    }
                  };

                  const getPlanColor = (plan: string) => {
                    switch (plan) {
                      case 'premium': return 'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300';
                      case 'standard': return 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300';
                      case 'basic': return 'bg-gray-100 text-gray-700 dark:bg-gray-900 dark:text-gray-300';
                      default: return 'bg-gray-100 text-gray-700 dark:bg-gray-900 dark:text-gray-300';
                    }
                  };

                  const formatDate = (dateString: string) => {
                    return new Date(dateString).toLocaleDateString('tr-TR', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric'
                    });
                  };

                  const getStatusText = (status: string) => {
                    switch (status) {
                      case 'vip': return 'VIP';
                      case 'active': return 'Aktif';
                      case 'at_risk': return 'Risk Altında';
                      case 'inactive': return 'Pasif';
                      default: return 'Bilinmiyor';
                    }
                  };

                  const getPlanText = (plan: string) => {
                    switch (plan) {
                      case 'premium': return 'Premium';
                      case 'standard': return 'Standart';
                      case 'basic': return 'Temel';
                      default: return 'Bilinmiyor';
                    }
            };
            
            return (
                    <tr key={customer.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                      <td className="px-6 py-4 whitespace-nowrap">
                  <div>
                          <div className="text-sm font-medium text-gray-900 dark:text-white">
                            {customer.name}
                  </div>
                          <div className="text-sm text-gray-500 dark:text-gray-400">
                            {customer.email}
                  </div>
                </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900 dark:text-white">{customer.company}</div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">{customer.phone}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getPlanColor(customer.plan)}`}>
                          {getPlanText(customer.plan)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(customer.status)}`}>
                          {getStatusText(customer.status)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex items-center">
                            {[...Array(5)].map((_, i) => (
                              <Star
                                key={i}
                                className={`w-4 h-4 ${
                                  i < Math.floor(customer.satisfaction)
                                    ? 'text-yellow-400'
                                    : 'text-gray-300 dark:text-gray-600'
                                }`}
                                fill={i < Math.floor(customer.satisfaction) ? 'currentColor' : 'none'}
                              />
                            ))}
                          </div>
                          <span className="ml-2 text-sm text-gray-600 dark:text-gray-400">
                            {customer.satisfaction}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                        ₺{customer.totalSpent.toLocaleString('tr-TR')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        {formatDate(customer.lastActivity)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex items-center space-x-2">
                          <button className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300">
                            <Eye className="w-4 h-4" />
                          </button>
                          <button className="text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-300">
                            <Edit className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="p-4 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-gray-900 dark:text-white">Kanban Görünümü</h3>
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-600 dark:text-gray-400">Toplam:</span>
                <span className="px-2 py-1 bg-orange-100 dark:bg-orange-900 text-orange-800 dark:text-orange-200 rounded-full text-sm font-medium">
                  {customersData.length}
                </span>
              </div>
            </div>
          </div>
          
          <div className="p-6">
            <div className="flex space-x-6 overflow-x-auto">
              {customerColumns.map((column) => {
                const columnCustomers = customersData.filter(customer => {
                  switch (column.id) {
                    case 'vip': return customer.status === 'vip';
                    case 'active': return customer.status === 'active';
                    case 'at_risk': return customer.status === 'at_risk';
                    case 'inactive': return customer.status === 'inactive';
                    default: return false;
                  }
                });

                return (
                  <div key={column.id} className="flex-shrink-0 w-80">
                    <div className={`${column.color} border-2 rounded-lg p-4 min-h-96`}>
                      <div className="flex items-center justify-between mb-4">
                        <h4 className="font-semibold text-gray-900 dark:text-white">
                          {column.name}
                        </h4>
                        <span className="px-2 py-1 bg-white dark:bg-gray-600 text-gray-600 dark:text-gray-300 rounded-full text-sm font-medium">
                          {columnCustomers.length}
                        </span>
                      </div>
                      
                      <div className="space-y-3">
                        {columnCustomers.map((customer) => {
                          const getPlanColor = (plan: string) => {
                            switch (plan) {
                              case 'premium': return 'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300';
                              case 'standard': return 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300';
                              case 'basic': return 'bg-gray-100 text-gray-700 dark:bg-gray-900 dark:text-gray-300';
                              default: return 'bg-gray-100 text-gray-700 dark:bg-gray-900 dark:text-gray-300';
                            }
                          };

                          const getPlanText = (plan: string) => {
                            switch (plan) {
                              case 'premium': return 'Premium';
                              case 'standard': return 'Standart';
                              case 'basic': return 'Temel';
                              default: return 'Bilinmiyor';
                            }
                          };

                          return (
                            <div
                              key={customer.id}
                              className="bg-white dark:bg-gray-700 rounded-lg p-4 shadow-sm border border-gray-200 dark:border-gray-600 hover:shadow-md transition-shadow cursor-pointer"
                            >
                              <div className="flex items-start justify-between mb-2">
                                <h5 className="text-sm font-medium text-gray-900 dark:text-white line-clamp-2">
                                  {customer.name}
                                </h5>
                                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getPlanColor(customer.plan)}`}>
                                  {getPlanText(customer.plan)}
                                </span>
                </div>
                              
                              <p className="text-xs text-gray-600 dark:text-gray-400 mb-3 line-clamp-2">
                                {customer.company}
                              </p>
                              
                              <div className="mb-3">
                                <div className="flex items-center justify-between text-xs mb-1">
                                  <span className="text-gray-600 dark:text-gray-400">Memnuniyet</span>
                                  <span className="font-semibold text-gray-900 dark:text-white">{customer.satisfaction}/5</span>
                                </div>
                                <div className="flex items-center">
                                  {[...Array(5)].map((_, i) => (
                                    <Star
                                      key={i}
                                      className={`w-3 h-3 ${
                                        i < Math.floor(customer.satisfaction)
                                          ? 'text-yellow-400'
                                          : 'text-gray-300 dark:text-gray-600'
                                      }`}
                                      fill={i < Math.floor(customer.satisfaction) ? 'currentColor' : 'none'}
                                    />
                                  ))}
                                </div>
                              </div>
                              
                              <div className="flex items-center justify-between">
                                <span className="text-xs text-gray-500 dark:text-gray-400">
                                  ₺{customer.totalSpent.toLocaleString('tr-TR')}
                                </span>
                                <span className="text-xs text-gray-500 dark:text-gray-400">
                                  {new Date(customer.lastActivity).toLocaleDateString('tr-TR')}
                                </span>
                </div>
              </div>
            );
          })}
                        
                        {columnCustomers.length === 0 && (
                          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                            <User className="w-8 h-8 mx-auto mb-2 opacity-50" />
                            <p className="text-sm">Bu sütunda müşteri yok</p>
                          </div>
                        )}
        </div>
      </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );

  const renderSettings = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Müdür Ayarları</h1>
        <FeedbackButton 
          pageSource="ManagerPortal-settings" 
          position="inline"
          className="inline-flex items-center px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-medium"
        />
      </div>

      {/* Profil Ayarları */}
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Profil Bilgileri</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Ad Soyad
            </label>
            <input
              type="text"
              value={managerData?.name || ''}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              readOnly
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              E-posta
            </label>
            <input
              type="email"
              value={managerData?.email || ''}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              readOnly
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Departman
            </label>
            <input
              type="text"
              value={managerData?.department || ''}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              readOnly
            />
          </div>
        </div>
      </div>

      {/* Bildirim Ayarları */}
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Bildirim Ayarları</h2>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Takım performans bildirimleri</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">Takım performansındaki değişiklikler için bildirim al</p>
            </div>
            <input type="checkbox" defaultChecked className="rounded" />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Kritik talep bildirimleri</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">Yüksek öncelikli talepler için bildirim al</p>
            </div>
            <input type="checkbox" defaultChecked className="rounded" />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Günlük rapor e-postaları</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">Günlük performans raporları için e-posta al</p>
            </div>
            <input type="checkbox" defaultChecked className="rounded" />
          </div>
        </div>
      </div>
    </div>
  );

  // Yeni müdür türü sayfaları için render fonksiyonları
  const renderRegionalAnalysis = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Bölge Analizi</h1>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Bölgesel performansı analiz edin, karşılaştırın ve stratejiler geliştirin
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <button className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors">
            <Download className="w-4 h-4" />
            <span>Rapor İndir</span>
          </button>
        </div>
      </div>

      {/* Bölge Performans Tablosu */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Bölge Performansı</h3>
            <div className="flex items-center space-x-2">
              <Filter className="w-4 h-4 text-gray-400" />
              <select className="px-3 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white">
                <option>Tüm Bölgeler</option>
                <option>İstanbul</option>
                <option>Ankara</option>
                <option>İzmir</option>
                <option>Bursa</option>
              </select>
            </div>
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Bölge
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Müdür
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Performans
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Gelir
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Müşteri Sayısı
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  İşlemler
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {[
                { region: 'İstanbul', manager: 'Ahmet Yılmaz', performance: 4.8, revenue: '₺2.4M', customers: 1250 },
                { region: 'Ankara', manager: 'Fatma Demir', performance: 4.5, revenue: '₺1.8M', customers: 890 },
                { region: 'İzmir', manager: 'Mehmet Kaya', performance: 4.2, revenue: '₺1.5M', customers: 650 },
                { region: 'Bursa', manager: 'Ayşe Özkan', performance: 4.6, revenue: '₺1.2M', customers: 420 }
              ].map((region, index) => (
                <tr key={index} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center text-white font-semibold">
                        {region.region.charAt(0)}
                      </div>
                      <div>
                        <div className="text-sm font-medium text-gray-900 dark:text-white">
                          {region.region}
                        </div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          Bölge Müdürlüğü
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm text-gray-900 dark:text-white">
                      {region.manager}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center space-x-1">
                      <Star className="w-4 h-4 text-yellow-500 fill-current" />
                      <span className="text-sm font-medium text-gray-900 dark:text-white">
                        {region.performance}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm font-medium text-gray-900 dark:text-white">
                      {region.revenue}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="px-2 py-1 text-xs bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300 rounded-full">
                      {region.customers}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex items-center space-x-1">
                      {/* Bölge Detayları */}
                      <button 
                        onClick={() => console.log('Bölge detayları:', region)}
                        className="p-1.5 text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded transition-colors"
                        title="Bölge Detayları"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      
                      {/* Performans Raporu */}
                      <button 
                        onClick={() => console.log('Performans raporu:', region)}
                        className="p-1.5 text-green-600 hover:text-green-800 dark:text-green-400 dark:hover:text-green-300 hover:bg-green-50 dark:hover:bg-green-900/20 rounded transition-colors"
                        title="Performans Raporu"
                      >
                        <BarChart className="w-4 h-4" />
                      </button>
                      
                      {/* Bütçe Yönetimi */}
                      <button 
                        onClick={() => console.log('Bütçe yönetimi:', region)}
                        className="p-1.5 text-purple-600 hover:text-purple-800 dark:text-purple-400 dark:hover:text-purple-300 hover:bg-purple-50 dark:hover:bg-purple-900/20 rounded transition-colors"
                        title="Bütçe Yönetimi"
                      >
                        <DollarSign className="w-4 h-4" />
                      </button>
                      
                      {/* Müdür İletişim */}
                      <button 
                        onClick={() => console.log('Müdür iletişim:', region)}
                        className="p-1.5 text-cyan-600 hover:text-cyan-800 dark:text-cyan-400 dark:hover:text-cyan-300 hover:bg-cyan-50 dark:hover:bg-cyan-900/20 rounded transition-colors"
                        title="Müdür İletişim"
                      >
                        <Phone className="w-4 h-4" />
                      </button>
                      
                      {/* Email Gönder */}
                      <button 
                        onClick={() => console.log('Email gönder:', region)}
                        className="p-1.5 text-orange-600 hover:text-orange-800 dark:text-orange-400 dark:hover:text-orange-300 hover:bg-orange-50 dark:hover:bg-orange-900/20 rounded transition-colors"
                        title="Email Gönder"
                      >
                        <Mail className="w-4 h-4" />
                      </button>
                      
                      {/* Daha Fazla */}
                      <button 
                        onClick={() => console.log('Daha fazla seçenek:', region)}
                        className="p-1.5 text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-900/20 rounded transition-colors"
                        title="Daha Fazla Seçenek"
                      >
                        <MoreVertical className="w-4 h-4" />
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

  const renderPerformance = () => (
    <div className="p-6">
      <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Performans Takibi</h2>
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
        <p className="text-gray-600 dark:text-gray-400">Performans takibi sayfası geliştiriliyor...</p>
      </div>
    </div>
  );



  const renderCustomerInsights = () => (
    <div className="space-y-6">
      {/* Başlık ve Filtreler */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Müşteri İçgörüleri</h1>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Müşteri davranışları, segmentasyon ve yaşam döngüsü analizi
          </p>
      </div>
        <div className="flex items-center space-x-3">
          <select className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white">
            <option>Tüm Müşteriler</option>
            <option>VIP Müşteriler</option>
            <option>Yeni Müşteriler</option>
            <option>Risk Altındaki Müşteriler</option>
          </select>
          <button className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors">
            <Download className="w-4 h-4 mr-2 inline" />
            Rapor İndir
          </button>
    </div>
      </div>

      {/* Ana Metrikler */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Toplam Müşteri</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">2,847</p>
            </div>
            <div className="p-3 bg-blue-100 dark:bg-blue-900 rounded-lg">
              <Users className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
          <div className="mt-4 flex items-center">
            <TrendingUp className="w-4 h-4 text-green-500 mr-1" />
            <span className="text-sm text-green-600 dark:text-green-400">+8% bu ay</span>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Ortalama Yaşam Değeri</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">₺12,450</p>
            </div>
            <div className="p-3 bg-green-100 dark:bg-green-900 rounded-lg">
              <DollarSign className="w-6 h-6 text-green-600 dark:text-green-400" />
            </div>
          </div>
          <div className="mt-4 flex items-center">
            <TrendingUp className="w-4 h-4 text-green-500 mr-1" />
            <span className="text-sm text-green-600 dark:text-green-400">+15% bu ay</span>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Müşteri Memnuniyeti</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">4.7/5</p>
            </div>
            <div className="p-3 bg-yellow-100 dark:bg-yellow-900 rounded-lg">
              <Star className="w-6 h-6 text-yellow-600 dark:text-yellow-400" />
            </div>
          </div>
          <div className="mt-4 flex items-center">
            <TrendingUp className="w-4 h-4 text-green-500 mr-1" />
            <span className="text-sm text-green-600 dark:text-green-400">+0.2 bu ay</span>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Churn Oranı</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">3.2%</p>
            </div>
            <div className="p-3 bg-red-100 dark:bg-red-900 rounded-lg">
              <TrendingDown className="w-6 h-6 text-red-600 dark:text-red-400" />
            </div>
          </div>
          <div className="mt-4 flex items-center">
            <TrendingDown className="w-4 h-4 text-green-500 mr-1" />
            <span className="text-sm text-green-600 dark:text-green-400">-0.5% bu ay</span>
          </div>
        </div>
      </div>

      {/* Müşteri Segmentasyonu */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Müşteri Segmentasyonu</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <div className="flex items-center space-x-3">
                <div className="w-4 h-4 bg-green-500 rounded-full"></div>
                <span className="text-sm font-medium text-gray-900 dark:text-white">VIP Müşteriler</span>
              </div>
              <div className="text-right">
                <div className="text-sm font-bold text-gray-900 dark:text-white">45</div>
                <div className="text-xs text-gray-500">%1.6</div>
              </div>
            </div>
            <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <div className="flex items-center space-x-3">
                <div className="w-4 h-4 bg-blue-500 rounded-full"></div>
                <span className="text-sm font-medium text-gray-900 dark:text-white">Aktif Müşteriler</span>
              </div>
              <div className="text-right">
                <div className="text-sm font-bold text-gray-900 dark:text-white">1,234</div>
                <div className="text-xs text-gray-500">%43.3</div>
              </div>
            </div>
            <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <div className="flex items-center space-x-3">
                <div className="w-4 h-4 bg-yellow-500 rounded-full"></div>
                <span className="text-sm font-medium text-gray-900 dark:text-white">Yeni Müşteriler</span>
              </div>
              <div className="text-right">
                <div className="text-sm font-bold text-gray-900 dark:text-white">567</div>
                <div className="text-xs text-gray-500">%19.9</div>
              </div>
            </div>
            <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <div className="flex items-center space-x-3">
                <div className="w-4 h-4 bg-red-500 rounded-full"></div>
                <span className="text-sm font-medium text-gray-900 dark:text-white">Risk Altındaki</span>
              </div>
              <div className="text-right">
                <div className="text-sm font-bold text-gray-900 dark:text-white">89</div>
                <div className="text-xs text-gray-500">%3.1</div>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Müşteri Yaşam Döngüsü</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600 dark:text-gray-400">Yeni Müşteri</span>
              <div className="flex items-center space-x-2">
                <div className="w-24 bg-gray-200 dark:bg-gray-600 rounded-full h-2">
                  <div className="bg-blue-500 h-2 rounded-full" style={{width: '20%'}}></div>
                </div>
                <span className="text-sm text-gray-900 dark:text-white">567</span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600 dark:text-gray-400">Aktif Müşteri</span>
              <div className="flex items-center space-x-2">
                <div className="w-24 bg-gray-200 dark:bg-gray-600 rounded-full h-2">
                  <div className="bg-green-500 h-2 rounded-full" style={{width: '43%'}}></div>
                </div>
                <span className="text-sm text-gray-900 dark:text-white">1,234</span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600 dark:text-gray-400">Sadık Müşteri</span>
              <div className="flex items-center space-x-2">
                <div className="w-24 bg-gray-200 dark:bg-gray-600 rounded-full h-2">
                  <div className="bg-purple-500 h-2 rounded-full" style={{width: '32%'}}></div>
                </div>
                <span className="text-sm text-gray-900 dark:text-white">912</span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600 dark:text-gray-400">VIP Müşteri</span>
              <div className="flex items-center space-x-2">
                <div className="w-24 bg-gray-200 dark:bg-gray-600 rounded-full h-2">
                  <div className="bg-yellow-500 h-2 rounded-full" style={{width: '2%'}}></div>
                </div>
                <span className="text-sm text-gray-900 dark:text-white">45</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Müşteri Davranış Analizi */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Müşteri Davranış Analizi</h3>
        </div>
    <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center mx-auto mb-3">
                <Clock className="w-8 h-8 text-blue-600 dark:text-blue-400" />
              </div>
              <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Ortalama Oturum Süresi</h4>
              <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">4.2 dk</p>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">+12% geçen aya göre</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mx-auto mb-3">
                <TrendingUp className="w-8 h-8 text-green-600 dark:text-green-400" />
              </div>
              <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Sayfa Görüntüleme</h4>
              <p className="text-2xl font-bold text-green-600 dark:text-green-400">8.7</p>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">+8% geçen aya göre</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-purple-100 dark:bg-purple-900 rounded-full flex items-center justify-center mx-auto mb-3">
                <Target className="w-8 h-8 text-purple-600 dark:text-purple-400" />
              </div>
              <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Dönüşüm Oranı</h4>
              <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">3.2%</p>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">+0.3% geçen aya göre</p>
            </div>
          </div>
        </div>
      </div>

      {/* En Değerli Müşteriler */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">En Değerli Müşteriler</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Müşteri</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Segment</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Toplam Harcama</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Son Aktivite</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Memnuniyet</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              <tr>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-sm">
                      AY
                    </div>
                    <div className="ml-4">
                      <div className="text-sm font-medium text-gray-900 dark:text-white">Ahmet Yılmaz</div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">ahmet@yilmaz.com</div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="px-2 py-1 text-xs bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300 rounded-full">VIP</span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">₺25,000</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">2 gün önce</td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <Star className="w-4 h-4 text-yellow-500 fill-current mr-1" />
                    <span className="text-sm text-gray-900 dark:text-white">4.8</span>
                  </div>
                </td>
              </tr>
              <tr>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <div className="w-10 h-10 bg-gradient-to-r from-green-500 to-blue-600 rounded-full flex items-center justify-center text-white font-bold text-sm">
                      FD
                    </div>
                    <div className="ml-4">
                      <div className="text-sm font-medium text-gray-900 dark:text-white">Fatma Demir</div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">fatma@demir.com</div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="px-2 py-1 text-xs bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300 rounded-full">VIP</span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">₺18,500</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">1 hafta önce</td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <Star className="w-4 h-4 text-yellow-500 fill-current mr-1" />
                    <span className="text-sm text-gray-900 dark:text-white">4.6</span>
                  </div>
                </td>
              </tr>
              <tr>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-pink-600 rounded-full flex items-center justify-center text-white font-bold text-sm">
                      MK
                    </div>
                    <div className="ml-4">
                      <div className="text-sm font-medium text-gray-900 dark:text-white">Mehmet Kaya</div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">mehmet@kaya.com</div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="px-2 py-1 text-xs bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300 rounded-full">Aktif</span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">₺12,300</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">3 gün önce</td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <Star className="w-4 h-4 text-yellow-500 fill-current mr-1" />
                    <span className="text-sm text-gray-900 dark:text-white">4.9</span>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );


  const renderBrandManagement = () => (
    <div className="space-y-6">
      {/* Başlık ve Filtreler */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Marka Yönetimi</h1>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Marka performansı, itibar yönetimi ve marka değeri analizi
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <select className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white">
            <option>Tüm Markalar</option>
            <option>Ana Marka</option>
            <option>Alt Markalar</option>
            <option>Yeni Markalar</option>
          </select>
          <button className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors">
            <Download className="w-4 h-4 mr-2 inline" />
            Rapor İndir
          </button>
        </div>
      </div>

      {/* Ana Marka Metrikleri */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Marka Farkındalığı</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">78%</p>
            </div>
            <div className="p-3 bg-blue-100 dark:bg-blue-900 rounded-lg">
              <Eye className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
          <div className="mt-4 flex items-center">
            <TrendingUp className="w-4 h-4 text-green-500 mr-1" />
            <span className="text-sm text-green-600 dark:text-green-400">+5% bu ay</span>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Marka Sadakati</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">65%</p>
            </div>
            <div className="p-3 bg-green-100 dark:bg-green-900 rounded-lg">
              <Heart className="w-6 h-6 text-green-600 dark:text-green-400" />
            </div>
          </div>
          <div className="mt-4 flex items-center">
            <TrendingUp className="w-4 h-4 text-green-500 mr-1" />
            <span className="text-sm text-green-600 dark:text-green-400">+3% bu ay</span>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Marka Değeri</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">₺2.4M</p>
            </div>
            <div className="p-3 bg-purple-100 dark:bg-purple-900 rounded-lg">
              <DollarSign className="w-6 h-6 text-purple-600 dark:text-purple-400" />
            </div>
          </div>
          <div className="mt-4 flex items-center">
            <TrendingUp className="w-4 h-4 text-green-500 mr-1" />
            <span className="text-sm text-green-600 dark:text-green-400">+12% bu ay</span>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Net Promoter Score</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">+42</p>
            </div>
            <div className="p-3 bg-yellow-100 dark:bg-yellow-900 rounded-lg">
              <Star className="w-6 h-6 text-yellow-600 dark:text-yellow-400" />
            </div>
          </div>
          <div className="mt-4 flex items-center">
            <TrendingUp className="w-4 h-4 text-green-500 mr-1" />
            <span className="text-sm text-green-600 dark:text-green-400">+2 bu ay</span>
          </div>
        </div>
      </div>

      {/* Marka Performans Analizi */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Marka Performans Trendi</h3>
          <div className="h-64 flex items-center justify-center">
            <div className="text-center">
              <TrendingUp className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500 dark:text-gray-400">Marka performans grafiği</p>
              <p className="text-sm text-gray-400">Son 12 aylık veriler</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Marka Kanal Dağılımı</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <div className="flex items-center space-x-3">
                <div className="w-4 h-4 bg-blue-500 rounded-full"></div>
                <span className="text-sm font-medium text-gray-900 dark:text-white">Sosyal Medya</span>
              </div>
              <div className="text-right">
                <div className="text-sm font-bold text-gray-900 dark:text-white">35%</div>
                <div className="text-xs text-gray-500">Ana kanal</div>
              </div>
            </div>
            <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <div className="flex items-center space-x-3">
                <div className="w-4 h-4 bg-green-500 rounded-full"></div>
                <span className="text-sm font-medium text-gray-900 dark:text-white">Web Sitesi</span>
              </div>
              <div className="text-right">
                <div className="text-sm font-bold text-gray-900 dark:text-white">28%</div>
                <div className="text-xs text-gray-500">İkincil kanal</div>
              </div>
            </div>
            <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <div className="flex items-center space-x-3">
                <div className="w-4 h-4 bg-purple-500 rounded-full"></div>
                <span className="text-sm font-medium text-gray-900 dark:text-white">Email</span>
              </div>
              <div className="text-right">
                <div className="text-sm font-bold text-gray-900 dark:text-white">22%</div>
                <div className="text-xs text-gray-500">Üçüncül kanal</div>
              </div>
            </div>
            <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <div className="flex items-center space-x-3">
                <div className="w-4 h-4 bg-yellow-500 rounded-full"></div>
                <span className="text-sm font-medium text-gray-900 dark:text-white">Diğer</span>
              </div>
              <div className="text-right">
                <div className="text-sm font-bold text-gray-900 dark:text-white">15%</div>
                <div className="text-xs text-gray-500">Diğer kanallar</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Marka İtibar Yönetimi */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Marka İtibar Yönetimi</h3>
        </div>
    <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mx-auto mb-3">
                <MessageCircle className="w-8 h-8 text-green-600 dark:text-green-400" />
              </div>
              <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Pozitif Yorumlar</h4>
              <p className="text-2xl font-bold text-green-600 dark:text-green-400">87%</p>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">+3% geçen aya göre</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-yellow-100 dark:bg-yellow-900 rounded-full flex items-center justify-center mx-auto mb-3">
                <AlertTriangle className="w-8 h-8 text-yellow-600 dark:text-yellow-400" />
              </div>
              <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Nötr Yorumlar</h4>
              <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">10%</p>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">-1% geçen aya göre</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-red-100 dark:bg-red-900 rounded-full flex items-center justify-center mx-auto mb-3">
                <XCircle className="w-8 h-8 text-red-600 dark:text-red-400" />
              </div>
              <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Negatif Yorumlar</h4>
              <p className="text-2xl font-bold text-red-600 dark:text-red-400">3%</p>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">-2% geçen aya göre</p>
            </div>
          </div>
        </div>
      </div>

      {/* Marka Kampanyaları */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Aktif Marka Kampanyaları</h3>
            <button className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors">
              <Plus className="w-4 h-4 mr-2 inline" />
              Yeni Kampanya
            </button>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Kampanya</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Marka</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Durum</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Bütçe</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Erişim</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Etkileşim</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              <tr>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900 dark:text-white">Marka Yenileme 2024</div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">Ana Marka</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="px-2 py-1 text-xs bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300 rounded-full">Ana Marka</span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="px-2 py-1 text-xs bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300 rounded-full">Aktif</span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">₺150,000</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">2.4M</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">4.2%</td>
              </tr>
              <tr>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900 dark:text-white">Sosyal Sorumluluk</div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">Alt Marka</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="px-2 py-1 text-xs bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300 rounded-full">Alt Marka</span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="px-2 py-1 text-xs bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300 rounded-full">Planlanıyor</span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">₺75,000</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">-</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">-</td>
              </tr>
              <tr>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900 dark:text-white">Yeni Ürün Lansmanı</div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">Ana Marka</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="px-2 py-1 text-xs bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300 rounded-full">Ana Marka</span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="px-2 py-1 text-xs bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300 rounded-full">Aktif</span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">₺200,000</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">3.1M</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">5.8%</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  const renderTeamCommunication = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Takım İletişimi</h1>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Takım sohbeti, bilgi paylaşımı ve işbirliği araçları
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <FeedbackButton 
            pageSource="ManagerPortal-team-communication" 
            position="inline"
            className="inline-flex items-center px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-medium"
          />
          <button 
            onClick={() => setShowNewGroupModal(true)}
            className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Yeni Grup</span>
          </button>
        </div>
      </div>

      {/* Hızlı Erişim Kartları */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
        <button 
          onClick={() => {
            setSelectedChatType('team');
            setShowEmployeeChat(true);
          }}
          className="bg-white dark:bg-gray-800 rounded-lg p-3 border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow text-left"
        >
          <div className="flex items-center justify-between mb-2">
            <div className="p-1.5 bg-blue-100 dark:bg-blue-900 rounded-lg">
              <Users className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <span className="text-xs bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300 px-2 py-1 rounded-full">
              0
            </span>
          </div>
          <h3 className="font-semibold text-gray-900 dark:text-white text-sm">Takım Sohbeti</h3>
          <p className="text-xs text-gray-600 dark:text-gray-400">Takım üyeleriyle mesajlaş</p>
        </button>

        <button 
          onClick={() => setShowDirectMessage(true)}
          className="bg-white dark:bg-gray-800 rounded-lg p-3 border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow text-left"
        >
          <div className="flex items-center justify-between mb-2">
            <div className="p-1.5 bg-green-100 dark:bg-green-900 rounded-lg">
              <User className="w-5 h-5 text-green-600 dark:text-green-400" />
            </div>
          </div>
          <h3 className="font-semibold text-gray-900 dark:text-white text-sm">Direkt Mesaj</h3>
          <p className="text-xs text-gray-600 dark:text-gray-400">Birebir mesajlaşma</p>
        </button>

        <button className="bg-white dark:bg-gray-800 rounded-lg p-3 border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow text-left">
          <div className="flex items-center justify-between mb-2">
            <div className="p-1.5 bg-orange-100 dark:bg-orange-900 rounded-lg">
              <Phone className="w-5 h-5 text-orange-600 dark:text-orange-400" />
            </div>
          </div>
          <h3 className="font-semibold text-gray-900 dark:text-white text-sm">Video Görüşme</h3>
          <p className="text-xs text-gray-600 dark:text-gray-400">Toplantı başlat</p>
        </button>
      </div>

      {/* TeamChat Bileşeni - Tam Ekran */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 h-[800px]">
        <EmployeeChat />
      </div>
    </div>
  );

  const renderActionHistory = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">İşlem Geçmişi</h1>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Tüm yönetici işlemlerini takip edin ve geçmişe bakın
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <button className="flex items-center space-x-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors">
            <Download className="w-4 h-4" />
            <span>Rapor İndir</span>
          </button>
        </div>
      </div>

      {/* İşlem Geçmişi Listesi */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Son İşlemler</h3>
            <div className="flex items-center space-x-2">
              <Filter className="w-4 h-4 text-gray-400" />
              <select className="px-3 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white">
                <option>Tüm İşlemler</option>
                <option>Görev Atama</option>
                <option>Performans Değerlendirme</option>
                <option>Rapor Oluşturma</option>
                <option>Bütçe Yönetimi</option>
              </select>
            </div>
          </div>
        </div>
        
        <div className="divide-y divide-gray-200 dark:divide-gray-700">
          {actionHistory.map((action) => (
            <div key={action.id} className="p-6 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
              <div className="flex items-start space-x-4">
                <div className={`p-2 rounded-lg ${
                  action.type === 'task_assignment' ? 'bg-blue-100 dark:bg-blue-900' :
                  action.type === 'performance_review' ? 'bg-green-100 dark:bg-green-900' :
                  action.type === 'report_generation' ? 'bg-purple-100 dark:bg-purple-900' :
                  'bg-gray-100 dark:bg-gray-700'
                }`}>
                  {action.type === 'task_assignment' && <Target className="w-5 h-5 text-blue-600 dark:text-blue-400" />}
                  {action.type === 'performance_review' && <Star className="w-5 h-5 text-green-600 dark:text-green-400" />}
                  {action.type === 'report_generation' && <FileText className="w-5 h-5 text-purple-600 dark:text-purple-400" />}
                </div>
                
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-semibold text-gray-900 dark:text-white">
                      {action.action}
                    </h4>
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {action.timestamp.toLocaleString('tr-TR')}
                    </span>
                  </div>
                  
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    <span className="font-medium">{action.user}</span> tarafından{' '}
                    <span className="font-medium">{action.target}</span> için gerçekleştirildi
                  </p>
                  
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                    {action.details}
                  </p>
                </div>
                
                <div className="flex items-center space-x-2">
                  <button className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600 rounded transition-colors">
                    <Eye className="w-4 h-4" />
                  </button>
                  <button className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600 rounded transition-colors">
                    <History className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderContent = () => {
    switch (currentPage) {
      case 'dashboard':
        return renderDashboard();
      case 'team-management':
        return renderTeamManagement();
      case 'team-communication':
        return renderTeamCommunication();
      case 'analytics':
        return renderAnalytics();
      case 'budget':
        return renderBudget();
      case 'tasks':
        return renderTasks();
      case 'customers':
        return renderCustomers();
      case 'action-history':
        return renderActionHistory();
      case 'settings':
        return renderSettings();
      // Yeni müdür türü sayfaları
      case 'regional-analysis':
        return renderRegionalAnalysis();
      case 'performance':
        return renderPerformance();
      case 'customer-insights':
        return renderCustomerInsights();
      case 'brand-management':
        return renderBrandManagement();
      default:
        return renderDashboard();
    }
  };

  return (
    <div className={`min-h-screen ${isDark ? 'dark' : ''}`}>
      <div className="flex bg-gray-50 dark:bg-gray-900">
        {/* Sidebar */}
        <div className="w-64 bg-white dark:bg-gray-800 shadow-lg border-r border-gray-200 dark:border-gray-700">
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-blue-600 rounded-full flex items-center justify-center text-white font-bold">
                {managerData?.name?.charAt(0) || 'M'}
              </div>
              <div>
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                  {managerData?.name || 'Müdür'}
                </h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {managerData?.department || 'Müşteri Hizmetleri Müdürü'}
                </p>
              </div>
            </div>
          </div>

          <nav className="p-4 space-y-2">
            {currentManagerType.menuItems.map((item) => {
              const IconComponent = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={() => setCurrentPage(item.id)}
                  className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-left transition-colors ${
                    currentPage === item.id
                      ? `bg-${currentManagerType.color}-100 text-${currentManagerType.color}-700 dark:bg-${currentManagerType.color}-900 dark:text-${currentManagerType.color}-300`
                      : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                  }`}
                >
                  <IconComponent className="w-5 h-5" />
                  <span>{item.label}</span>
                </button>
              );
            })}

            {onBackToAdmin && (
              <button
                onClick={onBackToAdmin}
                className="w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-left transition-colors text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 mt-4"
              >
                <LogOut className="w-5 h-5" />
                <span>Admin Panel'e Dön</span>
              </button>
            )}
          </nav>
        </div>

        {/* Main Content */}
        <div className="flex-1 flex flex-col">
          {/* Header */}
          <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-xl font-semibold text-gray-900 dark:text-white">
                  {currentPage === 'dashboard' && 'Dashboard'}
                  {currentPage === 'team-management' && 'Takım Yönetimi'}
                  {currentPage === 'analytics' && 'Analitik ve Raporlar'}
                  {currentPage === 'budget' && 'Bütçe Yönetimi'}
                  {currentPage === 'tasks' && 'Görev Yönetimi'}
                  {currentPage === 'customers' && 'Müşteri Analizi'}
                  {currentPage === 'action-history' && 'İşlem Geçmişi'}
                  {currentPage === 'settings' && 'Ayarlar'}
                  {currentPage === 'regional-analysis' && 'Bölge Analizi'}
                  {currentPage === 'performance' && 'Performans Takibi'}
                  {currentPage === 'customer-insights' && 'Müşteri İçgörüleri'}
                  {currentPage === 'brand-management' && 'Marka Yönetimi'}
                </h1>
              </div>
              <div className="flex items-center space-x-4">
                <button
                  onClick={() => setTheme(isDark ? 'light' : 'dark')}
                  className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
                </button>
                <button className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700">
                  <Bell className="w-5 h-5" />
                </button>
              </div>
            </div>
          </header>

          {/* Page Content */}
          <main className="flex-1 p-6 overflow-y-auto">
            {renderContent()}
          </main>
        </div>
      </div>

      {/* Modals */}
      <Modal
        isOpen={modals.viewMember.isOpen}
        onClose={() => closeModal('viewMember')}
        title="Takım Üyesi Detayları"
        size="large"
      >
        {modals.viewMember.data && (
          <div className="space-y-4">
            {/* Kompakt Profil Başlığı */}
            <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg p-4 text-white">
              <div className="flex items-center space-x-4">
                <div className="w-16 h-16 bg-white bg-opacity-20 rounded-full flex items-center justify-center text-white font-bold text-xl">
                  {(modals.viewMember.data as any).name?.charAt(0) || 'A'}
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-bold">
                    {(modals.viewMember.data as any).name || 'Takım Üyesi'}
                  </h3>
                  <p className="text-blue-100">
                    {(modals.viewMember.data as any).department || 'Müşteri Hizmetleri'}
                  </p>
                  <div className="flex items-center space-x-3 mt-1">
                    <span className="bg-white bg-opacity-20 px-2 py-1 rounded-full text-xs">
                      {(modals.viewMember.data as any).status || 'Aktif'}
                    </span>
                    <span className="text-blue-200 text-sm">
                      {(modals.viewMember.data as any).email || 'email@example.com'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Kompakt İstatistik Kartları */}
            <div className="grid grid-cols-4 gap-3">
              <div className="bg-white dark:bg-gray-800 rounded-lg p-3 border border-gray-200 dark:border-gray-700 text-center">
                <div className="flex items-center justify-center mb-2">
                  <Star className="w-5 h-5 text-yellow-500" />
                </div>
                <p className="text-lg font-bold text-gray-900 dark:text-white">4.5</p>
                <p className="text-xs text-gray-600 dark:text-gray-400">Performans</p>
              </div>

              <div className="bg-white dark:bg-gray-800 rounded-lg p-3 border border-gray-200 dark:border-gray-700 text-center">
                <div className="flex items-center justify-center mb-2">
                  <MessageSquare className="w-5 h-5 text-blue-500" />
                </div>
                <p className="text-lg font-bold text-gray-900 dark:text-white">5</p>
                <p className="text-xs text-gray-600 dark:text-gray-400">Aktif</p>
              </div>

              <div className="bg-white dark:bg-gray-800 rounded-lg p-3 border border-gray-200 dark:border-gray-700 text-center">
                <div className="flex items-center justify-center mb-2">
                  <CheckCircle className="w-5 h-5 text-green-500" />
                </div>
                <p className="text-lg font-bold text-gray-900 dark:text-white">142</p>
                <p className="text-xs text-gray-600 dark:text-gray-400">Çözülen</p>
              </div>

              <div className="bg-white dark:bg-gray-800 rounded-lg p-3 border border-gray-200 dark:border-gray-700 text-center">
                <div className="flex items-center justify-center mb-2">
                  <Timer className="w-5 h-5 text-purple-500" />
                </div>
                <p className="text-lg font-bold text-gray-900 dark:text-white">2.5s</p>
                <p className="text-xs text-gray-600 dark:text-gray-400">Yanıt</p>
              </div>
            </div>

            {/* Kompakt Bilgi Bölümleri */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Kişisel Bilgiler */}
              <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                <h4 className="text-md font-semibold text-gray-900 dark:text-white mb-3 flex items-center">
                  <UserCheck className="w-4 h-4 mr-2 text-blue-600" />
                  Kişisel Bilgiler
                </h4>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">Telefon:</span>
                    <span className="text-gray-900 dark:text-white">{(modals.viewMember.data as any).phone || '+90 555 123 4567'}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">E-posta:</span>
                    <span className="text-gray-900 dark:text-white">{(modals.viewMember.data as any).email || 'email@example.com'}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">Departman:</span>
                    <span className="text-gray-900 dark:text-white">{(modals.viewMember.data as any).department || 'Müşteri Hizmetleri'}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">Pozisyon:</span>
                    <span className="text-gray-900 dark:text-white">Müşteri Temsilcisi</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">İşe Başlama:</span>
                    <span className="text-gray-900 dark:text-white">15 Mart 2023</span>
                  </div>
                </div>
              </div>

              {/* Performans Detayları */}
              <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                <h4 className="text-md font-semibold text-gray-900 dark:text-white mb-3 flex items-center">
                  <TrendingUp className="w-4 h-4 mr-2 text-green-600" />
                  Performans Detayları
                </h4>
                <div className="space-y-3">
                  <div>
                    <div className="flex justify-between mb-1 text-sm">
                      <span className="text-gray-600 dark:text-gray-400">Müşteri Memnuniyeti</span>
                      <span className="text-gray-900 dark:text-white">92%</span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5">
                      <div className="bg-green-600 h-1.5 rounded-full" style={{ width: '92%' }}></div>
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between mb-1 text-sm">
                      <span className="text-gray-600 dark:text-gray-400">Görev Tamamlama</span>
                      <span className="text-gray-900 dark:text-white">88%</span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5">
                      <div className="bg-blue-600 h-1.5 rounded-full" style={{ width: '88%' }}></div>
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between mb-1 text-sm">
                      <span className="text-gray-600 dark:text-gray-400">Takım Çalışması</span>
                      <span className="text-gray-900 dark:text-white">95%</span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5">
                      <div className="bg-purple-600 h-1.5 rounded-full" style={{ width: '95%' }}></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Kompakt Son Aktiviteler */}
            <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
              <h4 className="text-md font-semibold text-gray-900 dark:text-white mb-3 flex items-center">
                <History className="w-4 h-4 mr-2 text-orange-600" />
                Son Aktiviteler
              </h4>
              <div className="space-y-2">
                <div className="flex items-center space-x-3 p-2 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900 dark:text-white">Müşteri talebi çözüldü</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Ticket #1234 - 2 saat önce</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3 p-2 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900 dark:text-white">Yeni görev atandı</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Müşteri şikayeti - 4 saat önce</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3 p-2 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900 dark:text-white">Performans değerlendirmesi tamamlandı</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Aylık değerlendirme - 1 gün önce</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Kompakt Eylem Butonları */}
            <div className="flex justify-end space-x-2 pt-3 border-t border-gray-200 dark:border-gray-700">
              <button
                onClick={() => openModal('sendMessage', modals.viewMember.data)}
                className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2 text-sm"
              >
                <MessageSquare className="w-4 h-4" />
                <span>Mesaj</span>
              </button>
              <button
                onClick={() => openModal('assignTask', modals.viewMember.data)}
                className="px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center space-x-2 text-sm"
              >
                <Target className="w-4 h-4" />
                <span>Görev</span>
              </button>
              <button
                onClick={() => openModal('performanceReview', modals.viewMember.data)}
                className="px-3 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors flex items-center space-x-2 text-sm"
              >
                <Star className="w-4 h-4" />
                <span>Değerlendir</span>
              </button>
            </div>
          </div>
        )}
      </Modal>

      <Modal
        isOpen={modals.assignTask.isOpen}
        onClose={() => closeModal('assignTask')}
        title="Görev Ata"
      >
        {modals.assignTask.data && (
          <div className="space-y-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white font-semibold">
                {(modals.assignTask.data as any).name?.charAt(0) || 'A'}
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 dark:text-white">
                  {(modals.assignTask.data as any).name || 'Temsilci'}
                </h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">Görev atanacak üye</p>
              </div>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Görev Başlığı
                </label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  placeholder="Görev başlığını girin"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Görev Açıklaması
                </label>
                <textarea
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  placeholder="Görev açıklamasını girin"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Öncelik
                  </label>
                  <select className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white">
                    <option>Düşük</option>
                    <option>Orta</option>
                    <option>Yüksek</option>
                    <option>Kritik</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Bitiş Tarihi
                  </label>
                  <input
                    type="date"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>
              </div>
            </div>
            
            <div className="flex justify-end space-x-3 pt-4">
              <button
                onClick={() => closeModal('assignTask')}
                className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                İptal
              </button>
              <button
                onClick={() => {
                  console.log('Görev atandı:', modals.assignTask.data);
                  addToActionHistory(
                    'Görev Atandı',
                    (modals.assignTask.data as any).name || 'Temsilci',
                    'task_assignment',
                    'Yeni görev atandı'
                  );
                  closeModal('assignTask');
                }}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Görev Ata
              </button>
            </div>
          </div>
        )}
      </Modal>

      <Modal
        isOpen={modals.performanceReview.isOpen}
        onClose={() => closeModal('performanceReview')}
        title="Performans Değerlendirme"
      >
        {modals.performanceReview.data && (
          <div className="space-y-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white font-semibold">
                {(modals.performanceReview.data as any).name?.charAt(0) || 'A'}
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 dark:text-white">
                  {(modals.performanceReview.data as any).name || 'Temsilci'}
                </h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">Performans değerlendirmesi</p>
              </div>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Genel Performans (1-5)
                </label>
                <div className="flex items-center space-x-2">
                  {[1, 2, 3, 4, 5].map((rating) => (
                    <button
                      key={rating}
                      className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                    >
                      <Star className="w-6 h-6 text-yellow-500 fill-current" />
                    </button>
                  ))}
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Müşteri Memnuniyeti
                </label>
                <input
                  type="range"
                  min="1"
                  max="5"
                  step="0.1"
                  className="w-full"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Görev Tamamlama Hızı
                </label>
                <input
                  type="range"
                  min="1"
                  max="5"
                  step="0.1"
                  className="w-full"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Takım Çalışması
                </label>
                <input
                  type="range"
                  min="1"
                  max="5"
                  step="0.1"
                  className="w-full"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Değerlendirme Notları
                </label>
                <textarea
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  placeholder="Performans değerlendirme notlarınızı girin"
                />
              </div>
            </div>
            
            <div className="flex justify-end space-x-3 pt-4">
              <button
                onClick={() => closeModal('performanceReview')}
                className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                İptal
              </button>
              <button
                onClick={() => {
                  console.log('Performans değerlendirmesi kaydedildi:', modals.performanceReview.data);
                  addToActionHistory(
                    'Performans Değerlendirmesi',
                    (modals.performanceReview.data as any).name || 'Temsilci',
                    'performance_review',
                    'Performans değerlendirmesi tamamlandı'
                  );
                  closeModal('performanceReview');
                }}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                Kaydet
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* Müşteri Segment Detayları Modal */}
      <Modal
        isOpen={modals.customerSegmentDetails.isOpen}
        onClose={() => closeModal('customerSegmentDetails')}
        title={modals.customerSegmentDetails.data ? `${modals.customerSegmentDetails.data.segment} - Müşteri Listesi` : 'Müşteri Segment Detayları'}
        size="large"
      >
        {modals.customerSegmentDetails.data && (
          <div className="space-y-6">
            {/* Segment Özeti */}
            <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    {modals.customerSegmentDetails.data.segment}
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {modals.customerSegmentDetails.data.description}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {modals.customerSegmentDetails.data.count} müşteri
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    ₺{modals.customerSegmentDetails.data.revenue.toLocaleString('tr-TR')} toplam gelir
                  </p>
                </div>
              </div>
            </div>

            {/* Müşteri Listesi */}
            <div className="space-y-4">
              <h4 className="text-md font-semibold text-gray-900 dark:text-white">
                Müşteri Detayları
              </h4>
              <div className="space-y-3">
                {modals.customerSegmentDetails.data.customers.map((customer: any) => (
                  <div key={customer.id} className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold">
                          {customer.name.charAt(0)}
                        </div>
                        <div>
                          <h5 className="font-semibold text-gray-900 dark:text-white">{customer.name}</h5>
                          <p className="text-sm text-gray-600 dark:text-gray-400">{customer.company}</p>
                          <p className="text-xs text-gray-500 dark:text-gray-500">{customer.email}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="flex items-center space-x-4">
                          <div className="text-center">
                            <p className="text-sm font-medium text-gray-900 dark:text-white">
                              {customer.satisfaction}%
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">Memnuniyet</p>
                          </div>
                          <div className="text-center">
                            <p className="text-sm font-medium text-gray-900 dark:text-white">
                              ₺{customer.totalSpent.toLocaleString('tr-TR')}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">Toplam Harcama</p>
                          </div>
                          <div className="text-center">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                              customer.plan === 'premium' 
                                ? 'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300'
                                : customer.plan === 'standard'
                                ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300'
                                : 'bg-gray-100 text-gray-700 dark:bg-gray-900 dark:text-gray-300'
                            }`}>
                              {customer.plan === 'premium' ? 'Premium' : customer.plan === 'standard' ? 'Standard' : 'Basic'}
                            </span>
                          </div>
                        </div>
                        <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                          Son aktivite: {new Date(customer.lastActivity).toLocaleDateString('tr-TR')}
                        </div>
                        {customer.riskReason && (
                          <div className="mt-2 text-xs text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 px-2 py-1 rounded">
                            ⚠️ {customer.riskReason}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="mt-3 flex items-center space-x-4 text-sm">
                      <div className="flex items-center text-gray-600 dark:text-gray-400">
                        <Phone className="w-4 h-4 mr-1" />
                        {customer.phone}
                      </div>
                      <div className="flex items-center text-gray-600 dark:text-gray-400">
                        <Mail className="w-4 h-4 mr-1" />
                        {customer.email}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Segment İstatistikleri */}
            <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
              <h4 className="text-md font-semibold text-gray-900 dark:text-white mb-3">
                Segment İstatistikleri
              </h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {Math.round(modals.customerSegmentDetails.data.customers.reduce((acc: number, c: any) => acc + c.satisfaction, 0) / modals.customerSegmentDetails.data.customers.length)}%
                  </p>
                  <p className="text-xs text-gray-600 dark:text-gray-400">Ortalama Memnuniyet</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    ₺{Math.round(modals.customerSegmentDetails.data.customers.reduce((acc: number, c: any) => acc + c.totalSpent, 0) / modals.customerSegmentDetails.data.customers.length).toLocaleString('tr-TR')}
                  </p>
                  <p className="text-xs text-gray-600 dark:text-gray-400">Ortalama Harcama</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {modals.customerSegmentDetails.data.customers.filter((c: any) => c.plan === 'premium').length}
                  </p>
                  <p className="text-xs text-gray-600 dark:text-gray-400">Premium Müşteri</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {modals.customerSegmentDetails.data.customers.filter((c: any) => c.satisfaction >= 80).length}
                  </p>
                  <p className="text-xs text-gray-600 dark:text-gray-400">Yüksek Memnuniyet</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* Yeni Görev Modal */}
      <Modal
        isOpen={modals.newTask.isOpen}
        onClose={() => closeModal('newTask')}
        title="Yeni Görev Oluştur"
        size="large"
      >
        <div className="space-y-6">
          {/* Görev Bilgileri */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Görev Başlığı
              </label>
              <input
                type="text"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Görev başlığını girin"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Atanan Kişi
              </label>
              <select className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                <option value="">Kişi seçin</option>
                <option value="ahmet">Ahmet Yılmaz</option>
                <option value="ayse">Ayşe Demir</option>
                <option value="mehmet">Mehmet Özkan</option>
                <option value="fatma">Fatma Kaya</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Görev Açıklaması
            </label>
            <textarea
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Görev detaylarını açıklayın"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Öncelik
              </label>
              <select className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                <option value="low">Düşük</option>
                <option value="medium">Orta</option>
                <option value="high">Yüksek</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Bitiş Tarihi
              </label>
              <input
                type="date"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Durum
              </label>
              <select className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                <option value="pending">Beklemede</option>
                <option value="in-progress">Devam Ediyor</option>
                <option value="completed">Tamamlandı</option>
              </select>
            </div>
          </div>

          {/* Eylem Butonları */}
          <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200 dark:border-gray-700">
            <button
              onClick={() => closeModal('newTask')}
              className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
            >
              İptal
            </button>
            <button
              onClick={() => {
                // Görev oluşturma işlemi
                console.log('Yeni görev oluşturuluyor...');
                closeModal('newTask');
              }}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Görev Oluştur
            </button>
          </div>
        </div>
      </Modal>

      {/* Görev Detayları Modal */}
      <Modal
        isOpen={modals.viewTaskDetails.isOpen}
        onClose={() => closeModal('viewTaskDetails')}
        title="Görev Detayları"
        size="large"
      >
        {modals.viewTaskDetails.data && (
          <div className="space-y-6">
            {/* Görev Başlığı ve Durum */}
            <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg p-6 text-white">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="text-2xl font-bold mb-2">
                {modals.viewTaskDetails.data.title}
              </h3>
                  <div className="flex items-center space-x-4 mb-3">
                <span className="bg-white bg-opacity-20 px-3 py-1 rounded-full text-sm">
                  {modals.viewTaskDetails.data.assignee}
                </span>
                <span className="bg-white bg-opacity-20 px-3 py-1 rounded-full text-sm">
                  Bitiş: {modals.viewTaskDetails.data.dueDate}
                </span>
                    <span className={`px-3 py-1 rounded-full text-sm ${
                      modals.viewTaskDetails.data.status === 'completed' 
                        ? 'bg-green-500 bg-opacity-80'
                        : modals.viewTaskDetails.data.status === 'in-progress'
                        ? 'bg-blue-500 bg-opacity-80'
                        : 'bg-gray-500 bg-opacity-80'
                    }`}>
                      {modals.viewTaskDetails.data.status === 'completed' ? 'Tamamlandı' : 
                       modals.viewTaskDetails.data.status === 'in-progress' ? 'Devam Ediyor' : 'Beklemede'}
                    </span>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm opacity-80">Görev ID</div>
                  <div className="font-mono text-lg">#TK-{modals.viewTaskDetails.data.id ? modals.viewTaskDetails.data.id.slice(0, 8) : '3490'}</div>
                </div>
              </div>
            </div>

            {/* Ana Bilgi Kartları */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Görev Bilgileri */}
              <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                <h4 className="text-md font-semibold text-gray-900 dark:text-white mb-3 flex items-center">
                  <User className="w-4 h-4 mr-2" />
                  Görev Bilgileri
                </h4>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Atanan:</span>
                    <span className="text-gray-900 dark:text-white font-medium">{modals.viewTaskDetails.data.assignee}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Oluşturan:</span>
                    <span className="text-gray-900 dark:text-white">Ahmet Yılmaz</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Bitiş Tarihi:</span>
                    <span className="text-gray-900 dark:text-white">{modals.viewTaskDetails.data.dueDate}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Öncelik:</span>
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      modals.viewTaskDetails.data.priority === 'high' 
                        ? 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300'
                        : modals.viewTaskDetails.data.priority === 'medium'
                        ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300'
                        : 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300'
                    }`}>
                      {modals.viewTaskDetails.data.priority === 'high' ? 'Yüksek' : modals.viewTaskDetails.data.priority === 'medium' ? 'Orta' : 'Düşük'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Kategori:</span>
                    <span className="text-gray-900 dark:text-white">Müşteri Hizmetleri</span>
                  </div>
                </div>
              </div>

              {/* İlerleme Durumu */}
              <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                <h4 className="text-md font-semibold text-gray-900 dark:text-white mb-3 flex items-center">
                  <TrendingUp className="w-4 h-4 mr-2" />
                  İlerleme Durumu
                </h4>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between mb-1 text-sm">
                      <span className="text-gray-600 dark:text-gray-400">Tamamlanma Oranı</span>
                      <span className="text-gray-900 dark:text-white font-medium">
                        {modals.viewTaskDetails.data.status === 'completed' ? '100%' : 
                         modals.viewTaskDetails.data.status === 'in-progress' ? '65%' : '0%'}
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
                      <div 
                        className="bg-gradient-to-r from-blue-500 to-purple-600 h-3 rounded-full transition-all duration-500" 
                        style={{ 
                          width: modals.viewTaskDetails.data.status === 'completed' ? '100%' : 
                                 modals.viewTaskDetails.data.status === 'in-progress' ? '65%' : '0%' 
                        }}
                      ></div>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="bg-gray-50 dark:bg-gray-700 p-2 rounded">
                      <div className="text-gray-600 dark:text-gray-400">Tahmini Süre</div>
                      <div className="font-medium">3 gün</div>
                    </div>
                    <div className="bg-gray-50 dark:bg-gray-700 p-2 rounded">
                      <div className="text-gray-600 dark:text-gray-400">Harcanan Süre</div>
                      <div className="font-medium">2 gün</div>
                  </div>
                </div>
              </div>
            </div>

              {/* Zaman Bilgileri */}
            <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                <h4 className="text-md font-semibold text-gray-900 dark:text-white mb-3 flex items-center">
                  <Clock className="w-4 h-4 mr-2" />
                  Zaman Bilgileri
                </h4>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Oluşturulma:</span>
                    <span className="text-gray-900 dark:text-white text-sm">10 Ocak 2024</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Son Güncelleme:</span>
                    <span className="text-gray-900 dark:text-white text-sm">15 Ocak 2024</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Başlama:</span>
                    <span className="text-gray-900 dark:text-white text-sm">12 Ocak 2024</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Kalan Süre:</span>
                    <span className={`text-sm font-medium ${
                      new Date(modals.viewTaskDetails.data.dueDate) < new Date() 
                        ? 'text-red-600' 
                        : 'text-green-600'
                    }`}>
                      {Math.ceil((new Date(modals.viewTaskDetails.data.dueDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))} gün
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Görev Açıklaması ve Detaylar */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                <h4 className="text-md font-semibold text-gray-900 dark:text-white mb-3 flex items-center">
                  <FileText className="w-4 h-4 mr-2" />
                Görev Açıklaması
              </h4>
                <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                Bu görev, müşteri memnuniyetini artırmak için yapılacak çalışmaları kapsamaktadır. 
                  Detaylı analiz ve raporlama süreçlerini içerir. Müşteri geri bildirimlerini toplama, 
                  analiz etme ve iyileştirme önerileri sunma süreçlerini kapsar.
                </p>
                <div className="mt-4">
                  <h5 className="text-sm font-medium text-gray-900 dark:text-white mb-2">Görev Hedefleri:</h5>
                  <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                    <li>• Müşteri memnuniyet oranını %15 artırmak</li>
                    <li>• Geri bildirim sürecini optimize etmek</li>
                    <li>• Raporlama sistemini iyileştirmek</li>
                  </ul>
                </div>
              </div>

              <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                <h4 className="text-md font-semibold text-gray-900 dark:text-white mb-3 flex items-center">
                  <Link2 className="w-4 h-4 mr-2" />
                  Bağımlılıklar
                </h4>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-700 rounded">
                    <div className="flex items-center">
                      <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                      <span className="text-sm text-gray-900 dark:text-white">Müşteri Veri Analizi</span>
                    </div>
                    <span className="text-xs text-green-600">Tamamlandı</span>
                  </div>
                  <div className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-700 rounded">
                    <div className="flex items-center">
                      <div className="w-2 h-2 bg-yellow-500 rounded-full mr-2"></div>
                      <span className="text-sm text-gray-900 dark:text-white">Rapor Şablonu Hazırlama</span>
                    </div>
                    <span className="text-xs text-yellow-600">Devam Ediyor</span>
                  </div>
                  <div className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-700 rounded">
                    <div className="flex items-center">
                      <div className="w-2 h-2 bg-gray-400 rounded-full mr-2"></div>
                      <span className="text-sm text-gray-900 dark:text-white">Sunum Hazırlama</span>
                    </div>
                    <span className="text-xs text-gray-600">Beklemede</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Zaman Çizelgesi */}
            <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
              <h4 className="text-md font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                <History className="w-4 h-4 mr-2" />
                Zaman Çizelgesi
              </h4>
              <div className="space-y-4">
                <div className="flex items-start space-x-3">
                  <div className="w-3 h-3 bg-green-500 rounded-full mt-1"></div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-900 dark:text-white">Görev Oluşturuldu</span>
                      <span className="text-xs text-gray-500">10 Ocak 2024, 09:30</span>
                    </div>
                    <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">Ahmet Yılmaz tarafından oluşturuldu</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="w-3 h-3 bg-blue-500 rounded-full mt-1"></div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-900 dark:text-white">Görev Atandı</span>
                      <span className="text-xs text-gray-500">10 Ocak 2024, 10:15</span>
                    </div>
                    <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">Ayşe Demir'e atandı</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="w-3 h-3 bg-yellow-500 rounded-full mt-1"></div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-900 dark:text-white">Çalışmaya Başlandı</span>
                      <span className="text-xs text-gray-500">12 Ocak 2024, 08:00</span>
                    </div>
                    <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">Ayşe Demir çalışmaya başladı</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="w-3 h-3 bg-purple-500 rounded-full mt-1"></div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-900 dark:text-white">İlerleme Güncellendi</span>
                      <span className="text-xs text-gray-500">15 Ocak 2024, 14:30</span>
                    </div>
                    <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">%65 tamamlandı olarak işaretlendi</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Yorumlar ve Notlar */}
            <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
              <h4 className="text-md font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                <MessageSquare className="w-4 h-4 mr-2" />
                Yorumlar ve Notlar
              </h4>
              <div className="space-y-4">
                <div className="flex space-x-3">
                  <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white text-sm font-medium">
                    AY
                  </div>
                  <div className="flex-1">
                    <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium text-gray-900 dark:text-white">Ayşe Demir</span>
                        <span className="text-xs text-gray-500">14 Ocak 2024, 16:45</span>
                      </div>
                      <p className="text-sm text-gray-700 dark:text-gray-300">
                        İlk analiz tamamlandı. Müşteri geri bildirimlerini toplama sürecinde bazı teknik zorluklar yaşıyoruz. 
                        IT ekibiyle görüşme planlıyorum.
                      </p>
                    </div>
                  </div>
                </div>
                <div className="flex space-x-3">
                  <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center text-white text-sm font-medium">
                    AY
                  </div>
                  <div className="flex-1">
                    <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium text-gray-900 dark:text-white">Ahmet Yılmaz</span>
                        <span className="text-xs text-gray-500">15 Ocak 2024, 09:20</span>
                      </div>
                      <p className="text-sm text-gray-700 dark:text-gray-300">
                        IT ekibiyle görüştüm. Sorun çözüldü. Devam edebilirsin.
                      </p>
                    </div>
                  </div>
                </div>
                <div className="border-t border-gray-200 dark:border-gray-600 pt-4">
                  <div className="flex space-x-3">
                    <div className="w-8 h-8 bg-gray-400 rounded-full flex items-center justify-center text-white text-sm font-medium">
                      +
                    </div>
                    <div className="flex-1">
                      <textarea
                        placeholder="Yeni yorum ekle..."
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                        rows={3}
                      />
                      <div className="flex justify-end mt-2">
                        <button className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition-colors">
                          Yorum Ekle
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Dosya Ekleri */}
            <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
              <h4 className="text-md font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                <Paperclip className="w-4 h-4 mr-2" />
                Dosya Ekleri
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="flex items-center space-x-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <div className="w-10 h-10 bg-red-100 dark:bg-red-900 rounded-lg flex items-center justify-center">
                    <FileText className="w-5 h-5 text-red-600 dark:text-red-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 dark:text-white truncate">Müşteri Analiz Raporu.pdf</p>
                    <p className="text-xs text-gray-500">2.3 MB • 12 Ocak 2024</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center">
                    <FileText className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 dark:text-white truncate">Geri Bildirim Şablonu.docx</p>
                    <p className="text-xs text-gray-500">1.1 MB • 13 Ocak 2024</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <div className="w-10 h-10 bg-green-100 dark:bg-green-900 rounded-lg flex items-center justify-center">
                    <BarChart3 className="w-5 h-5 text-green-600 dark:text-green-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 dark:text-white truncate">İstatistikler.xlsx</p>
                    <p className="text-xs text-gray-500">856 KB • 14 Ocak 2024</p>
                  </div>
                </div>
              </div>
              <div className="mt-4">
                <button className="flex items-center space-x-2 text-blue-600 hover:text-blue-700 transition-colors">
                  <Plus className="w-4 h-4" />
                  <span className="text-sm">Dosya Ekle</span>
                </button>
              </div>
            </div>

            {/* Eylem Butonları */}
            <div className="flex justify-between items-center pt-4 border-t border-gray-200 dark:border-gray-700">
              <div className="flex space-x-2">
                <button className="px-3 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors flex items-center space-x-1">
                  <Share className="w-4 h-4" />
                  <span className="text-sm">Paylaş</span>
                </button>
                <button className="px-3 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors flex items-center space-x-1">
                  <Copy className="w-4 h-4" />
                  <span className="text-sm">Kopyala</span>
                </button>
                <button className="px-3 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors flex items-center space-x-1">
                  <Archive className="w-4 h-4" />
                  <span className="text-sm">Arşivle</span>
                </button>
              </div>
              <div className="flex space-x-3">
              <button
                onClick={() => closeModal('viewTaskDetails')}
                className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
              >
                Kapat
              </button>
              <button
                onClick={() => {
                  console.log('Görev düzenleniyor...');
                  closeModal('viewTaskDetails');
                }}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Düzenle
              </button>
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* EmployeeChat Modal */}
      {showEmployeeChat && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full h-full max-w-7xl max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                {selectedChatType === 'team' ? 'Takım Sohbeti' : 'Direkt Mesajlaşma'}
              </h2>
              <button
                onClick={() => setShowEmployeeChat(false)}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            <div className="flex-1 overflow-hidden">
              <EmployeeChat />
            </div>
          </div>
        </div>
      )}

      {/* Direkt Mesaj Modal */}
      {showDirectMessage && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full h-full max-w-6xl max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
                  <User className="w-5 h-5 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Direkt Mesajlaşma</h2>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Birebir mesajlaşma</p>
                </div>
              </div>
              <button
                onClick={() => setShowDirectMessage(false)}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            <div className="flex-1 overflow-hidden">
              <DirectMessage currentUser={managerData} />
            </div>
          </div>
        </div>
      )}

      {/* Yeni Grup Modal */}
      {showNewGroupModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Yeni Grup Oluştur</h2>
              <button
                onClick={() => setShowNewGroupModal(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <div className="p-6 space-y-6">
              {/* Grup Adı */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Grup Adı *
                </label>
                <input
                  type="text"
                  value={newGroup.name}
                  onChange={(e) => setNewGroup(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  placeholder="Grup adını girin"
                />
              </div>

              {/* Grup Açıklaması */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Açıklama
                </label>
                <textarea
                  value={newGroup.description}
                  onChange={(e) => setNewGroup(prev => ({ ...prev, description: e.target.value }))}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  placeholder="Grup açıklamasını girin"
                />
              </div>

              {/* Grup Tipi */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Grup Tipi
                </label>
                <select
                  value={newGroup.type}
                  onChange={(e) => setNewGroup(prev => ({ ...prev, type: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                >
                  <option value="public">Herkese Açık</option>
                  <option value="private">Özel</option>
                  <option value="restricted">Kısıtlı</option>
                </select>
              </div>

              {/* Üye Seçimi */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Üyeler
                </label>
                <div className="space-y-2">
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    Grup oluşturulduktan sonra üyeler eklenebilir
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-end space-x-3 p-6 border-t border-gray-200 dark:border-gray-700">
              <button
                onClick={() => setShowNewGroupModal(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors"
              >
                İptal
              </button>
              <button
                onClick={handleCreateGroup}
                className="px-4 py-2 text-sm font-medium text-white bg-green-600 hover:bg-green-700 rounded-lg transition-colors flex items-center space-x-2"
              >
                <Plus className="w-4 h-4" />
                <span>Grup Oluştur</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Sütun Ayarları Modal */}
      {showColumnSettings && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
                  <Settings className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Sütun Ayarları</h2>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Kanban sütunlarını düzenleyin</p>
                </div>
              </div>
              <button
                onClick={() => setShowColumnSettings(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6">
              <div className="space-y-6">
                {/* Mevcut Sütunlar */}
                <div>
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Mevcut Sütunlar</h3>
                  <div className="space-y-3">
                    {customColumns.map((column, index) => (
                      <div key={column.id} className="flex items-center space-x-4 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                        <div className="flex-1">
                          <input
                            type="text"
                            value={column.name}
                            onChange={(e) => {
                              const newColumns = [...customColumns];
                              newColumns[index].name = e.target.value;
                              setCustomColumns(newColumns);
                            }}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-600 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                        <div className="flex items-center space-x-2">
                          <input
                            type="color"
                            value={column.color.includes('yellow') ? '#fef3c7' : 
                                   column.color.includes('blue') ? '#dbeafe' : 
                                   column.color.includes('green') ? '#dcfce7' : '#fee2e2'}
                            onChange={(e) => {
                              const newColumns = [...customColumns];
                              newColumns[index].color = `bg-[${e.target.value}] border-[${e.target.value}]`;
                              setCustomColumns(newColumns);
                            }}
                            className="w-8 h-8 rounded border border-gray-300 dark:border-gray-600"
                          />
                          <button
                            onClick={() => {
                              if (customColumns.length > 1) {
                                const newColumns = customColumns.filter((_, i) => i !== index);
                                setCustomColumns(newColumns);
                              }
                            }}
                            className="p-2 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                            disabled={customColumns.length <= 1}
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Yeni Sütun Ekleme */}
                <div>
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Yeni Sütun Ekle</h3>
                  <div className="flex items-center space-x-4">
                    <input
                      type="text"
                      placeholder="Sütun adı..."
                      className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          const input = e.target as HTMLInputElement;
                          if (input.value.trim()) {
                            const newColumn = {
                              id: `column_${Date.now()}`,
                              name: input.value.trim(),
                              color: 'bg-gray-100 border-gray-300',
                              tasks: []
                            };
                            setCustomColumns([...customColumns, newColumn]);
                            input.value = '';
                          }
                        }
                      }}
                    />
                    <button
                      onClick={() => {
                        const input = document.querySelector('input[placeholder="Sütun adı..."]') as HTMLInputElement;
                        if (input && input.value.trim()) {
                          const newColumn = {
                            id: `column_${Date.now()}`,
                            name: input.value.trim(),
                            color: 'bg-gray-100 border-gray-300',
                            tasks: []
                          };
                          setCustomColumns([...customColumns, newColumn]);
                          input.value = '';
                        }
                      }}
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium flex items-center space-x-2"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Ekle</span>
                    </button>
                  </div>
                </div>

                {/* Sütun Sıralama */}
                <div>
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Sütun Sıralaması</h3>
                  <div className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                    Sütunları sürükleyip bırakarak sıralayabilirsiniz
                  </div>
                  <div className="space-y-2">
                    {customColumns.map((column, index) => (
                      <div key={column.id} className="flex items-center space-x-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                        <div className="text-gray-400">
                          <span className="text-sm font-medium">{index + 1}</span>
                        </div>
                        <div className="flex-1">
                          <span className="text-sm font-medium text-gray-900 dark:text-white">{column.name}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => {
                              if (index > 0) {
                                const newColumns = [...customColumns];
                                [newColumns[index], newColumns[index - 1]] = [newColumns[index - 1], newColumns[index]];
                                setCustomColumns(newColumns);
                              }
                            }}
                            className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                            disabled={index === 0}
                          >
                            ↑
                          </button>
                          <button
                            onClick={() => {
                              if (index < customColumns.length - 1) {
                                const newColumns = [...customColumns];
                                [newColumns[index], newColumns[index + 1]] = [newColumns[index + 1], newColumns[index]];
                                setCustomColumns(newColumns);
                              }
                            }}
                            className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                            disabled={index === customColumns.length - 1}
                          >
                            ↓
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-end space-x-3 p-6 border-t border-gray-200 dark:border-gray-700">
              <button
                onClick={() => setShowColumnSettings(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors"
              >
                İptal
              </button>
              <button
                onClick={() => {
                  setShowColumnSettings(false);
                  // toast.success('Sütun ayarları kaydedildi');
                }}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
              >
                Kaydet
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Müşteri Sütun Ayarları Modal */}
      {showCustomerColumnSettings && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
                  <Settings className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Müşteri Sütun Ayarları</h2>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Müşteri kanban sütunlarını düzenleyin</p>
                </div>
              </div>
              <button
                onClick={() => setShowCustomerColumnSettings(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6">
              <div className="space-y-6">
                {/* Mevcut Sütunlar */}
                <div>
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Mevcut Sütunlar</h3>
                  <div className="space-y-3">
                    {customerColumns.map((column, index) => (
                      <div key={column.id} className="flex items-center space-x-4 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                        <div className="flex-1">
                          <input
                            type="text"
                            value={column.name}
                            onChange={(e) => {
                              const newColumns = [...customerColumns];
                              newColumns[index].name = e.target.value;
                              setCustomerColumns(newColumns);
                            }}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-600 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                        <div className="flex items-center space-x-2">
                          <input
                            type="color"
                            value={column.color.includes('green') ? '#dcfce7' : 
                                   column.color.includes('blue') ? '#dbeafe' : 
                                   column.color.includes('yellow') ? '#fef3c7' : '#f3f4f6'}
                            onChange={(e) => {
                              const newColumns = [...customerColumns];
                              newColumns[index].color = `bg-[${e.target.value}] border-[${e.target.value}]`;
                              setCustomerColumns(newColumns);
                            }}
                            className="w-8 h-8 rounded border border-gray-300 dark:border-gray-600"
                          />
                          <button
                            onClick={() => {
                              if (customerColumns.length > 1) {
                                const newColumns = customerColumns.filter((_, i) => i !== index);
                                setCustomerColumns(newColumns);
                              }
                            }}
                            className="p-2 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                            disabled={customerColumns.length <= 1}
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Yeni Sütun Ekleme */}
                <div>
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Yeni Sütun Ekle</h3>
                  <div className="flex items-center space-x-4">
                    <input
                      type="text"
                      placeholder="Sütun adı..."
                      className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          const input = e.target as HTMLInputElement;
                          if (input.value.trim()) {
                            const newColumn = {
                              id: `customer_column_${Date.now()}`,
                              name: input.value.trim(),
                              color: 'bg-gray-100 border-gray-300',
                              customers: []
                            };
                            setCustomerColumns([...customerColumns, newColumn]);
                            input.value = '';
                          }
                        }
                      }}
                    />
                    <button
                      onClick={() => {
                        const input = document.querySelector('input[placeholder="Sütun adı..."]') as HTMLInputElement;
                        if (input && input.value.trim()) {
                          const newColumn = {
                            id: `customer_column_${Date.now()}`,
                            name: input.value.trim(),
                            color: 'bg-gray-100 border-gray-300',
                            customers: []
                          };
                          setCustomerColumns([...customerColumns, newColumn]);
                          input.value = '';
                        }
                      }}
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium flex items-center space-x-2"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Ekle</span>
                    </button>
                  </div>
                </div>

                {/* Sütun Sıralama */}
                <div>
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Sütun Sıralaması</h3>
                  <div className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                    Sütunları sürükleyip bırakarak sıralayabilirsiniz
                  </div>
                  <div className="space-y-2">
                    {customerColumns.map((column, index) => (
                      <div key={column.id} className="flex items-center space-x-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                        <div className="text-gray-400">
                          <span className="text-sm font-medium">{index + 1}</span>
                        </div>
                        <div className="flex-1">
                          <span className="text-sm font-medium text-gray-900 dark:text-white">{column.name}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => {
                              if (index > 0) {
                                const newColumns = [...customerColumns];
                                [newColumns[index], newColumns[index - 1]] = [newColumns[index - 1], newColumns[index]];
                                setCustomerColumns(newColumns);
                              }
                            }}
                            className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                            disabled={index === 0}
                          >
                            ↑
                          </button>
                          <button
                            onClick={() => {
                              if (index < customerColumns.length - 1) {
                                const newColumns = [...customerColumns];
                                [newColumns[index], newColumns[index + 1]] = [newColumns[index + 1], newColumns[index]];
                                setCustomerColumns(newColumns);
                              }
                            }}
                            className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                            disabled={index === customerColumns.length - 1}
                          >
                            ↓
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-end space-x-3 p-6 border-t border-gray-200 dark:border-gray-700">
              <button
                onClick={() => setShowCustomerColumnSettings(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors"
              >
                İptal
              </button>
              <button
                onClick={() => {
                  setShowCustomerColumnSettings(false);
                  // toast.success('Müşteri sütun ayarları kaydedildi');
                }}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
              >
                Kaydet
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManagerPortal;
