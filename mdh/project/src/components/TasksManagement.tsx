import React, { useState, useEffect } from 'react';
import { useDrag, useDrop } from 'react-dnd';
import { 
  Target, 
  Plus, 
  Search, 
  Calendar, 
  User, 
  Clock, 
  CheckCircle, 
  AlertCircle, 
  XCircle,
  Edit,
  Eye,
  BarChart3,
  Flag,
  Zap,
  List
} from 'lucide-react';
import FeedbackButton from './common/FeedbackButton';

const ItemTypes = {
  TASK: 'task',
};

interface Task {
  id: string;
  title: string;
  description: string;
  assignee: string;
  assigneeId: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  category: string;
  dueDate: string;
  createdAt: string;
  completedAt?: string;
  estimatedHours: number;
  actualHours: number;
  progress: number;
  tags: string[];
  attachments: TaskAttachment[];
  comments: TaskComment[];
  portal: 'admin' | 'employee' | 'agent' | 'manager';
  // Yeni detaylı alanlar
  createdBy: string;
  lastModified: string;
  estimatedCost: number;
  actualCost: number;
  dependencies: string[];
  subtasks: TaskSubtask[];
  timeEntries: TaskTimeEntry[];
  history: TaskHistory[];
  relatedTickets: string[];
  department: string;
  project: string;
  milestone: string;
  riskLevel: 'low' | 'medium' | 'high';
  complexity: 'simple' | 'moderate' | 'complex';
  effort: 'small' | 'medium' | 'large';
}

interface TaskComment {
  id: string;
  author: string;
  authorId: string;
  content: string;
  timestamp: string;
  type: 'comment' | 'status_change' | 'assignment' | 'system';
  attachments?: string[];
}

interface TaskAttachment {
  id: string;
  name: string;
  url: string;
  type: 'image' | 'document' | 'video' | 'other';
  size: number;
  uploadedBy: string;
  uploadedAt: string;
}

interface TaskSubtask {
  id: string;
  title: string;
  status: 'pending' | 'in_progress' | 'completed';
  assignee: string;
  dueDate: string;
  progress: number;
}

interface TaskTimeEntry {
  id: string;
  date: string;
  hours: number;
  description: string;
  user: string;
  billable: boolean;
}

interface TaskHistory {
  id: string;
  action: string;
  user: string;
  timestamp: string;
  oldValue?: string;
  newValue?: string;
  details: string;
}

interface TaskStats {
  total: number;
  pending: number;
  inProgress: number;
  completed: number;
  overdue: number;
  highPriority: number;
}

// Draggable Task Component
const DraggableTask: React.FC<{
  task: Task;
  onEdit: (task: Task) => void;
  onView: (task: Task) => void;
}> = ({ task, onEdit, onView }) => {
  const [{ isDragging }, drag] = useDrag(() => ({
    type: ItemTypes.TASK,
    item: { id: task.id, status: task.status },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  }));

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
      case 'high': return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300';
      case 'medium': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
      case 'low': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300';
    }
  };

  const getPortalInfo = (portal: string) => {
    switch (portal) {
      case 'admin': return { name: 'Admin Portal', color: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300', icon: '👑' };
      case 'employee': return { name: 'Çalışan Portalı', color: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300', icon: '👤' };
      case 'agent': return { name: 'Temsilci Portalı', color: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300', icon: '🎧' };
      case 'manager': return { name: 'Müdür Portalı', color: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300', icon: '👔' };
      default: return { name: 'Bilinmeyen', color: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300', icon: '❓' };
    }
  };

  return (
    <div
      ref={drag}
      className={`bg-white dark:bg-gray-700 rounded-lg p-4 border border-gray-200 dark:border-gray-600 cursor-move hover:shadow-md transition-all duration-200 ${
        isDragging ? 'opacity-50 scale-95' : 'hover:scale-105'
      }`}
      onClick={() => onView(task)}
    >
      <div className="flex items-start justify-between mb-2">
        <h4 className="font-medium text-gray-900 dark:text-white text-sm">
          {task.title}
        </h4>
        <div className="flex items-center gap-2">
          <div className="flex flex-col gap-1">
            <span className={`px-2 py-1 text-xs font-medium rounded-full ${getPriorityColor(task.priority)}`}>
              {task.priority === 'urgent' ? 'Acil' : 
               task.priority === 'high' ? 'Yüksek' :
               task.priority === 'medium' ? 'Orta' : 'Düşük'}
            </span>
            <span className={`px-2 py-1 text-xs font-medium rounded-full ${getPortalInfo(task.portal).color}`}>
              <span>{getPortalInfo(task.portal).icon}</span>
            </span>
          </div>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onEdit(task);
            }}
            className="p-1 text-gray-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded transition-colors"
            title="Düzenle"
          >
            <Edit className="w-3 h-3" />
          </button>
        </div>
      </div>
      
      <p className="text-gray-600 dark:text-gray-400 text-xs mb-3 line-clamp-2">
        {task.description}
      </p>
      
      <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
        <span>{task.assignee}</span>
        <span>{new Date(task.dueDate).toLocaleDateString('tr-TR')}</span>
      </div>
      
      {task.progress > 0 && (
        <div className="mt-2">
          <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-1">
            <div
              className="bg-blue-600 h-1 rounded-full"
              style={{ width: `${task.progress}%` }}
            ></div>
          </div>
        </div>
      )}
      
      {/* Drag indicator */}
      <div className="flex justify-center mt-2">
        <div className="w-6 h-1 bg-gray-300 dark:bg-gray-600 rounded-full"></div>
      </div>
    </div>
  );
};

// Droppable Column Component
const DroppableColumn: React.FC<{
  status: string;
  tasks: Task[];
  onTaskMove: (taskId: string, newStatus: string) => void;
  onEdit: (task: Task) => void;
  onView: (task: Task) => void;
}> = ({ status, tasks, onTaskMove, onEdit, onView }) => {
  const [{ isOver }, drop] = useDrop(() => ({
    accept: ItemTypes.TASK,
    drop: (item: { id: string; status: string }) => {
      if (item.status !== status) {
        onTaskMove(item.id, status);
      }
    },
    collect: (monitor) => ({
      isOver: monitor.isOver(),
    }),
  }));

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return <Clock className="w-4 h-4" />;
      case 'in_progress': return <Zap className="w-4 h-4" />;
      case 'completed': return <CheckCircle className="w-4 h-4" />;
      case 'cancelled': return <XCircle className="w-4 h-4" />;
      default: return <Clock className="w-4 h-4" />;
    }
  };

  return (
    <div 
      ref={drop}
      className={`bg-gray-50 dark:bg-gray-800 rounded-lg p-4 min-h-[400px] transition-colors ${
        isOver ? 'bg-blue-50 dark:bg-blue-900/20' : ''
      }`}
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
          {getStatusIcon(status)}
          {status === 'pending' ? 'Beklemede' :
           status === 'in_progress' ? 'İşlemde' :
           status === 'completed' ? 'Tamamlandı' : 'İptal'}
        </h3>
        <span className="bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300 px-2 py-1 rounded-full text-sm">
          {tasks.length}
        </span>
      </div>
      
      <div className="space-y-3">
        {tasks.map((task) => (
          <DraggableTask
            key={task.id}
            task={task}
            onEdit={onEdit}
            onView={onView}
          />
        ))}
        
        {/* Drop zone indicator */}
        {tasks.length === 0 && (
          <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-8 text-center">
            <p className="text-gray-500 dark:text-gray-400 text-sm">
              Görevleri buraya sürükleyin
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

const TasksManagement: React.FC = () => {
  const [currentView, setCurrentView] = useState<'list' | 'kanban' | 'calendar' | 'analytics'>('list');
  const [selectedPortal, setSelectedPortal] = useState<string>('all');
  const [tasks, setTasks] = useState<Task[]>([]);
  const [filteredTasks, setFilteredTasks] = useState<Task[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [assigneeFilter] = useState<string>('all');
  const [showNewTaskModal, setShowNewTaskModal] = useState(false);
  const [showEditTaskModal, setShowEditTaskModal] = useState(false);
  const [showTaskDetailModal, setShowTaskDetailModal] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [taskStats, setTaskStats] = useState<TaskStats>({
    total: 0,
    pending: 0,
    inProgress: 0,
    completed: 0,
    overdue: 0,
    highPriority: 0
  });

  // Örnek görev verileri - Tüm portallardan
  useEffect(() => {
    const sampleTasks: Task[] = [
      // Admin Portal Görevleri
      {
        id: 'admin-1',
        title: 'Müşteri Memnuniyet Anketi Geliştirme',
        description: 'Yeni müşteri memnuniyet anketi tasarımı ve geliştirme',
        assignee: 'Ahmet Yılmaz',
        assigneeId: 'emp1',
        priority: 'high',
        status: 'in_progress',
        category: 'Geliştirme',
        dueDate: '2024-01-25',
        createdAt: '2024-01-10',
        estimatedHours: 16,
        actualHours: 8,
        progress: 50,
        tags: ['frontend', 'survey', 'customer'],
        attachments: [
          {
            id: 'att1',
            name: 'survey-design.pdf',
            url: '/attachments/survey-design.pdf',
            type: 'document',
            size: 2048000,
            uploadedBy: 'Ahmet Yılmaz',
            uploadedAt: '2024-01-12T10:30:00Z'
          }
        ],
        comments: [
          {
            id: 'comm1',
            author: 'Mehmet Özkan',
            authorId: 'emp3',
            content: 'Tasarım onaylandı, geliştirmeye başlanabilir.',
            timestamp: '2024-01-15T14:20:00Z',
            type: 'comment'
          }
        ],
        portal: 'admin',
        createdBy: 'Zeynep Yılmaz',
        lastModified: '2024-01-20T09:15:00Z',
        estimatedCost: 5000,
        actualCost: 2500,
        dependencies: ['admin-2'],
        subtasks: [
          {
            id: 'sub1',
            title: 'UI Tasarımı',
            status: 'completed',
            assignee: 'Ayşe Demir',
            dueDate: '2024-01-18',
            progress: 100
          },
          {
            id: 'sub2',
            title: 'Backend API',
            status: 'in_progress',
            assignee: 'Ahmet Yılmaz',
            dueDate: '2024-01-25',
            progress: 60
          }
        ],
        timeEntries: [
          {
            id: 'time1',
            date: '2024-01-20',
            hours: 4,
            description: 'Frontend geliştirme',
            user: 'Ahmet Yılmaz',
            billable: true
          }
        ],
        history: [
          {
            id: 'hist1',
            action: 'created',
            user: 'Zeynep Yılmaz',
            timestamp: '2024-01-10T08:00:00Z',
            details: 'Görev oluşturuldu'
          },
          {
            id: 'hist2',
            action: 'status_changed',
            user: 'Ahmet Yılmaz',
            timestamp: '2024-01-15T10:30:00Z',
            oldValue: 'pending',
            newValue: 'in_progress',
            details: 'Durum İşlemde olarak değiştirildi'
          }
        ],
        relatedTickets: ['TKT-001', 'TKT-002'],
        department: 'IT',
        project: 'Customer Experience',
        milestone: 'Q1 2024',
        riskLevel: 'medium',
        complexity: 'moderate',
        effort: 'medium'
      },
      {
        id: 'admin-2',
        title: 'Sistem Güvenlik Güncellemesi',
        description: 'Kritik güvenlik açıklarının kapatılması',
        assignee: 'Can Arslan',
        assigneeId: 'emp5',
        priority: 'urgent',
        status: 'pending',
        category: 'Güvenlik',
        dueDate: '2024-01-20',
        createdAt: '2024-01-19',
        estimatedHours: 6,
        actualHours: 0,
        progress: 0,
        tags: ['security', 'critical', 'update'],
        attachments: [],
        comments: [],
        portal: 'admin',
        createdBy: 'Can Arslan',
        lastModified: '2024-01-19T16:45:00Z',
        estimatedCost: 2000,
        actualCost: 0,
        dependencies: [],
        subtasks: [],
        timeEntries: [],
        history: [
          {
            id: 'hist3',
            action: 'created',
            user: 'Can Arslan',
            timestamp: '2024-01-19T16:45:00Z',
            details: 'Acil güvenlik güncellemesi oluşturuldu'
          }
        ],
        relatedTickets: ['TKT-003'],
        department: 'IT',
        project: 'Security',
        milestone: 'Q1 2024',
        riskLevel: 'high',
        complexity: 'simple',
        effort: 'small'
      },
      // Çalışan Portal Görevleri
      {
        id: 'emp-1',
        title: 'Haftalık Performans Raporu',
        description: 'Bu haftaki çalışma performansını analiz et ve raporla',
        assignee: 'Ayşe Demir',
        assigneeId: 'emp2',
        priority: 'medium',
        status: 'in_progress',
        category: 'Raporlama',
        dueDate: '2024-01-22',
        createdAt: '2024-01-15',
        estimatedHours: 4,
        actualHours: 2,
        progress: 50,
        tags: ['performance', 'weekly', 'report'],
        attachments: [],
        comments: [],
        portal: 'employee',
        createdBy: 'Ayşe Demir',
        lastModified: '2024-01-20T11:30:00Z',
        estimatedCost: 500,
        actualCost: 250,
        dependencies: [],
        subtasks: [],
        timeEntries: [
          {
            id: 'time2',
            date: '2024-01-20',
            hours: 2,
            description: 'Rapor hazırlama',
            user: 'Ayşe Demir',
            billable: true
          }
        ],
        history: [
          {
            id: 'hist4',
            action: 'created',
            user: 'Ayşe Demir',
            timestamp: '2024-01-15T09:00:00Z',
            details: 'Haftalık rapor görevi oluşturuldu'
          }
        ],
        relatedTickets: [],
        department: 'HR',
        project: 'Performance Management',
        milestone: 'Weekly',
        riskLevel: 'low',
        complexity: 'simple',
        effort: 'small'
      },
      {
        id: 'emp-2',
        title: 'Yeni Teknoloji Eğitimi',
        description: 'React 18 yeni özelliklerini öğren ve uygula',
        assignee: 'Mehmet Özkan',
        assigneeId: 'emp3',
        priority: 'low',
        status: 'pending',
        category: 'Eğitim',
        dueDate: '2024-02-01',
        createdAt: '2024-01-18',
        estimatedHours: 8,
        actualHours: 0,
        progress: 0,
        tags: ['learning', 'react', 'technology'],
        attachments: [],
        comments: [],
        portal: 'employee',
        createdBy: 'Mehmet Özkan',
        lastModified: '2024-01-18T14:20:00Z',
        estimatedCost: 0,
        actualCost: 0,
        dependencies: [],
        subtasks: [],
        timeEntries: [],
        history: [
          {
            id: 'hist5',
            action: 'created',
            user: 'Mehmet Özkan',
            timestamp: '2024-01-18T14:20:00Z',
            details: 'Eğitim görevi oluşturuldu'
          }
        ],
        relatedTickets: [],
        department: 'IT',
        project: 'Learning & Development',
        milestone: 'Q1 2024',
        riskLevel: 'low',
        complexity: 'simple',
        effort: 'medium'
      },
      // Temsilci Portal Görevleri
      {
        id: 'agent-1',
        title: 'Müşteri Geri Bildirimlerini Analiz Et',
        description: 'Son 30 günlük geri bildirimleri incele ve raporla',
        assignee: 'Fatma Kaya',
        assigneeId: 'emp4',
        priority: 'high',
        status: 'in_progress',
        category: 'Müşteri Hizmetleri',
        dueDate: '2024-01-28',
        createdAt: '2024-01-12',
        estimatedHours: 6,
        actualHours: 3,
        progress: 50,
        tags: ['feedback', 'analysis', 'customer'],
        attachments: [],
        comments: [],
        portal: 'agent',
        createdBy: 'Fatma Kaya',
        lastModified: '2024-01-20T13:15:00Z',
        estimatedCost: 800,
        actualCost: 400,
        dependencies: [],
        subtasks: [],
        timeEntries: [
          {
            id: 'time3',
            date: '2024-01-20',
            hours: 3,
            description: 'Geri bildirim analizi',
            user: 'Fatma Kaya',
            billable: true
          }
        ],
        history: [
          {
            id: 'hist6',
            action: 'created',
            user: 'Fatma Kaya',
            timestamp: '2024-01-12T10:00:00Z',
            details: 'Müşteri analiz görevi oluşturuldu'
          }
        ],
        relatedTickets: ['TKT-004'],
        department: 'Customer Service',
        project: 'Customer Satisfaction',
        milestone: 'Q1 2024',
        riskLevel: 'medium',
        complexity: 'moderate',
        effort: 'medium'
      },
      {
        id: 'agent-2',
        title: 'VIP Müşteri Takip Raporu',
        description: 'Aylık VIP müşteri analizi ve takip raporu',
        assignee: 'Ali Veli',
        assigneeId: 'emp6',
        priority: 'high',
        status: 'completed',
        category: 'Müşteri Takibi',
        dueDate: '2024-01-15',
        createdAt: '2024-01-05',
        completedAt: '2024-01-15',
        estimatedHours: 4,
        actualHours: 4,
        progress: 100,
        tags: ['vip', 'customer', 'monthly'],
        attachments: [],
        comments: [],
        portal: 'agent',
        createdBy: 'Ali Veli',
        lastModified: '2024-01-15T16:00:00Z',
        estimatedCost: 600,
        actualCost: 600,
        dependencies: [],
        subtasks: [],
        timeEntries: [
          {
            id: 'time4',
            date: '2024-01-15',
            hours: 4,
            description: 'VIP rapor hazırlama',
            user: 'Ali Veli',
            billable: true
          }
        ],
        history: [
          {
            id: 'hist7',
            action: 'created',
            user: 'Ali Veli',
            timestamp: '2024-01-05T09:00:00Z',
            details: 'VIP rapor görevi oluşturuldu'
          },
          {
            id: 'hist8',
            action: 'status_changed',
            user: 'Ali Veli',
            timestamp: '2024-01-15T16:00:00Z',
            oldValue: 'in_progress',
            newValue: 'completed',
            details: 'Rapor tamamlandı'
          }
        ],
        relatedTickets: ['TKT-005'],
        department: 'Customer Service',
        project: 'VIP Management',
        milestone: 'Monthly',
        riskLevel: 'low',
        complexity: 'simple',
        effort: 'small'
      },
      // Müdür Portal Görevleri
      {
        id: 'mgr-1',
        title: 'Takım Performans Değerlendirmesi',
        description: 'Aylık takım performans analizi ve değerlendirme',
        assignee: 'Zeynep Yılmaz',
        assigneeId: 'emp7',
        priority: 'high',
        status: 'in_progress',
        category: 'Yönetim',
        dueDate: '2024-01-30',
        createdAt: '2024-01-10',
        estimatedHours: 8,
        actualHours: 4,
        progress: 50,
        tags: ['management', 'performance', 'team'],
        attachments: [],
        comments: [],
        portal: 'manager',
        createdBy: 'Zeynep Yılmaz',
        lastModified: '2024-01-20T15:30:00Z',
        estimatedCost: 1200,
        actualCost: 600,
        dependencies: [],
        subtasks: [],
        timeEntries: [
          {
            id: 'time5',
            date: '2024-01-20',
            hours: 4,
            description: 'Performans değerlendirmesi',
            user: 'Zeynep Yılmaz',
            billable: true
          }
        ],
        history: [
          {
            id: 'hist9',
            action: 'created',
            user: 'Zeynep Yılmaz',
            timestamp: '2024-01-10T08:00:00Z',
            details: 'Takım değerlendirme görevi oluşturuldu'
          }
        ],
        relatedTickets: [],
        department: 'Management',
        project: 'Team Performance',
        milestone: 'Q1 2024',
        riskLevel: 'medium',
        complexity: 'moderate',
        effort: 'large'
      },
      {
        id: 'mgr-2',
        title: 'Bütçe Planlaması',
        description: 'Gelecek ay için bütçe planlaması ve onay süreci',
        assignee: 'Okan Demir',
        assigneeId: 'emp8',
        priority: 'urgent',
        status: 'pending',
        category: 'Finans',
        dueDate: '2024-01-25',
        createdAt: '2024-01-20',
        estimatedHours: 12,
        actualHours: 0,
        progress: 0,
        tags: ['budget', 'planning', 'finance'],
        attachments: [],
        comments: [],
        portal: 'manager',
        createdBy: 'Okan Demir',
        lastModified: '2024-01-20T17:00:00Z',
        estimatedCost: 0,
        actualCost: 0,
        dependencies: [],
        subtasks: [],
        timeEntries: [],
        history: [
          {
            id: 'hist10',
            action: 'created',
            user: 'Okan Demir',
            timestamp: '2024-01-20T17:00:00Z',
            details: 'Bütçe planlama görevi oluşturuldu'
          }
        ],
        relatedTickets: [],
        department: 'Finance',
        project: 'Budget Planning',
        milestone: 'Q1 2024',
        riskLevel: 'high',
        complexity: 'complex',
        effort: 'large'
      }
    ];

    setTasks(sampleTasks);
    setFilteredTasks(sampleTasks);
  }, []);

  // İstatistikleri hesapla
  useEffect(() => {
    const stats: TaskStats = {
      total: tasks.length,
      pending: tasks.filter(t => t.status === 'pending').length,
      inProgress: tasks.filter(t => t.status === 'in_progress').length,
      completed: tasks.filter(t => t.status === 'completed').length,
      overdue: tasks.filter(t => {
        const dueDate = new Date(t.dueDate);
        const now = new Date();
        return dueDate < now && t.status !== 'completed';
      }).length,
      highPriority: tasks.filter(t => t.priority === 'high' || t.priority === 'urgent').length
    };
    setTaskStats(stats);
  }, [tasks]);

  // Filtreleme
  useEffect(() => {
    let filtered = tasks;

    // Portal filtresi
    if (selectedPortal !== 'all') {
      filtered = filtered.filter(task => task.portal === selectedPortal);
    }

    // Arama terimi
    if (searchTerm) {
      filtered = filtered.filter(task =>
        task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        task.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        task.assignee.toLowerCase().includes(searchTerm.toLowerCase()) ||
        task.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    // Durum filtresi
    if (statusFilter !== 'all') {
      filtered = filtered.filter(task => task.status === statusFilter);
    }

    // Öncelik filtresi
    if (priorityFilter !== 'all') {
      filtered = filtered.filter(task => task.priority === priorityFilter);
    }

    // Atanan kişi filtresi
    if (assigneeFilter !== 'all') {
      filtered = filtered.filter(task => task.assigneeId === assigneeFilter);
    }

    setFilteredTasks(filtered);
  }, [tasks, searchTerm, statusFilter, priorityFilter, assigneeFilter, selectedPortal]);

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
      case 'high': return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300';
      case 'medium': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
      case 'low': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300';
      case 'in_progress': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
      case 'completed': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
      case 'cancelled': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return <Clock className="w-4 h-4" />;
      case 'in_progress': return <Zap className="w-4 h-4" />;
      case 'completed': return <CheckCircle className="w-4 h-4" />;
      case 'cancelled': return <XCircle className="w-4 h-4" />;
      default: return <Clock className="w-4 h-4" />;
    }
  };

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'urgent': return <AlertCircle className="w-4 h-4" />;
      case 'high': return <Flag className="w-4 h-4" />;
      case 'medium': return <Target className="w-4 h-4" />;
      case 'low': return <CheckCircle className="w-4 h-4" />;
      default: return <Target className="w-4 h-4" />;
    }
  };

  const getPortalInfo = (portal: string) => {
    switch (portal) {
      case 'admin': return { name: 'Admin Portal', color: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300', icon: '👑' };
      case 'employee': return { name: 'Çalışan Portalı', color: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300', icon: '👤' };
      case 'agent': return { name: 'Temsilci Portalı', color: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300', icon: '🎧' };
      case 'manager': return { name: 'Müdür Portalı', color: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300', icon: '👔' };
      default: return { name: 'Bilinmeyen', color: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300', icon: '❓' };
    }
  };

  // React DnD Task Move Handler
  const handleTaskMove = (taskId: string, newStatus: string) => {
    const updatedTasks = tasks.map(task => 
      task.id === taskId 
        ? { 
            ...task, 
            status: newStatus as 'pending' | 'in_progress' | 'completed' | 'cancelled',
            completedAt: newStatus === 'completed' ? new Date().toISOString().split('T')[0] : undefined
          }
        : task
    );
    
    setTasks(updatedTasks);
    const movedTask = tasks.find(t => t.id === taskId);
    if (movedTask) {
      console.log(`Görev "${movedTask.title}" ${newStatus} durumuna taşındı`);
    }
  };

  const renderTaskList = () => (
    <div className="space-y-4">
      {filteredTasks.map((task) => (
        <div
          key={task.id}
          className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 hover:shadow-md transition-all duration-200"
        >
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  {task.title}
                </h3>
                <span className={`px-2 py-1 text-xs font-medium rounded-full flex items-center gap-1 ${getPriorityColor(task.priority)}`}>
                  {getPriorityIcon(task.priority)}
                  {task.priority === 'urgent' ? 'Acil' : 
                   task.priority === 'high' ? 'Yüksek' :
                   task.priority === 'medium' ? 'Orta' : 'Düşük'}
                </span>
                <span className={`px-2 py-1 text-xs font-medium rounded-full flex items-center gap-1 ${getStatusColor(task.status)}`}>
                  {getStatusIcon(task.status)}
                  {task.status === 'pending' ? 'Beklemede' :
                   task.status === 'in_progress' ? 'İşlemde' :
                   task.status === 'completed' ? 'Tamamlandı' : 'İptal'}
                </span>
                <span className={`px-2 py-1 text-xs font-medium rounded-full flex items-center gap-1 ${getPortalInfo(task.portal).color}`}>
                  <span>{getPortalInfo(task.portal).icon}</span>
                  {getPortalInfo(task.portal).name}
                </span>
              </div>
              
              <p className="text-gray-600 dark:text-gray-400 mb-3">
                {task.description}
              </p>
              
              <div className="flex items-center gap-6 text-sm text-gray-500 dark:text-gray-400">
                <div className="flex items-center gap-1">
                  <User className="w-4 h-4" />
                  <span>{task.assignee}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Calendar className="w-4 h-4" />
                  <span>{new Date(task.dueDate).toLocaleDateString('tr-TR')}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Clock className="w-4 h-4" />
                  <span>{task.actualHours}/{task.estimatedHours}h</span>
                </div>
                <div className="flex items-center gap-1">
                  <BarChart3 className="w-4 h-4" />
                  <span>{task.progress}%</span>
                </div>
              </div>
              
              {task.tags.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-3">
                  {task.tags.map((tag, index) => (
                    <span
                      key={index}
                      className="px-2 py-1 text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              )}
            </div>
            
            <div className="flex items-center gap-2 ml-4">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedTask(task);
                  setShowEditTaskModal(true);
                  console.log('Görev düzenleme modalı açılıyor:', task.title);
                }}
                className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                title="Düzenle"
              >
                <Edit className="w-4 h-4" />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedTask(task);
                  setShowTaskDetailModal(true);
                  console.log('Görev detayları görüntüleniyor:', task.title);
                }}
                className="p-2 text-gray-400 hover:text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-lg transition-colors"
                title="Detayları Görüntüle"
              >
                <Eye className="w-4 h-4" />
              </button>
            </div>
          </div>
          
          {/* Progress Bar */}
          <div className="mt-4">
            <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400 mb-1">
              <span>İlerleme</span>
              <span>{task.progress}%</span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
              <div
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${task.progress}%` }}
              ></div>
            </div>
          </div>
          
          {/* Drag indicator */}
          <div className="flex justify-center mt-3">
            <div className="w-8 h-1 bg-gray-300 dark:bg-gray-600 rounded-full"></div>
          </div>
        </div>
      ))}
      
      {filteredTasks.length === 0 && (
        <div className="text-center py-12">
          <Target className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            Görev bulunamadı
          </h3>
          <p className="text-gray-500 dark:text-gray-400">
            Arama kriterlerinize uygun görev bulunmuyor.
          </p>
        </div>
      )}
    </div>
  );

  const renderKanbanView = () => (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
      {['pending', 'in_progress', 'completed', 'cancelled'].map((status) => (
        <DroppableColumn
          key={status}
          status={status}
          tasks={filteredTasks.filter(task => task.status === status)}
          onTaskMove={handleTaskMove}
          onEdit={(task) => {
            setSelectedTask(task);
            setShowEditTaskModal(true);
            console.log('Kanban görev düzenleme modalı açılıyor:', task.title);
          }}
          onView={(task) => {
            setSelectedTask(task);
            setShowTaskDetailModal(true);
            console.log('Görev detayları görüntüleniyor:', task.title);
          }}
        />
      ))}
    </div>
  );

  // Modal'lar
  const renderEditTaskModal = () => {
    if (!showEditTaskModal || !selectedTask) return null;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
              Görev Düzenle
            </h2>
            <button
              onClick={() => {
                setShowEditTaskModal(false);
                setSelectedTask(null);
              }}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              <XCircle className="w-6 h-6" />
            </button>
          </div>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Görev Başlığı
              </label>
              <input
                type="text"
                value={selectedTask.title}
                onChange={(e) => setSelectedTask({...selectedTask, title: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Açıklama
              </label>
              <textarea
                value={selectedTask.description}
                onChange={(e) => setSelectedTask({...selectedTask, description: e.target.value})}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Durum
                </label>
                <select
                  value={selectedTask.status}
                  onChange={(e) => setSelectedTask({...selectedTask, status: e.target.value as any})}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="pending">Beklemede</option>
                  <option value="in_progress">İşlemde</option>
                  <option value="completed">Tamamlandı</option>
                  <option value="cancelled">İptal</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Öncelik
                </label>
                <select
                  value={selectedTask.priority}
                  onChange={(e) => setSelectedTask({...selectedTask, priority: e.target.value as any})}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="low">Düşük</option>
                  <option value="medium">Orta</option>
                  <option value="high">Yüksek</option>
                  <option value="urgent">Acil</option>
                </select>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Atanan Kişi
                </label>
                <input
                  type="text"
                  value={selectedTask.assignee}
                  onChange={(e) => setSelectedTask({...selectedTask, assignee: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Bitiş Tarihi
                </label>
                <input
                  type="date"
                  value={selectedTask.dueDate}
                  onChange={(e) => setSelectedTask({...selectedTask, dueDate: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Tahmini Saat
                </label>
                <input
                  type="number"
                  value={selectedTask.estimatedHours}
                  onChange={(e) => setSelectedTask({...selectedTask, estimatedHours: parseInt(e.target.value) || 0})}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Gerçekleşen Saat
                </label>
                <input
                  type="number"
                  value={selectedTask.actualHours}
                  onChange={(e) => setSelectedTask({...selectedTask, actualHours: parseInt(e.target.value) || 0})}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                İlerleme (%)
              </label>
              <input
                type="range"
                min="0"
                max="100"
                value={selectedTask.progress}
                onChange={(e) => setSelectedTask({...selectedTask, progress: parseInt(e.target.value)})}
                className="w-full"
              />
              <div className="flex justify-between text-sm text-gray-500 dark:text-gray-400">
                <span>0%</span>
                <span className="font-medium">{selectedTask.progress}%</span>
                <span>100%</span>
              </div>
            </div>
          </div>
          
          <div className="flex justify-end gap-3 mt-6">
            <button
              onClick={() => {
                setShowEditTaskModal(false);
                setSelectedTask(null);
              }}
              className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
            >
              İptal
            </button>
            <button
              onClick={() => {
                // Görevi güncelle
                const updatedTasks = tasks.map(task => 
                  task.id === selectedTask.id ? selectedTask : task
                );
                setTasks(updatedTasks);
                setShowEditTaskModal(false);
                setSelectedTask(null);
                console.log('Görev güncellendi:', selectedTask.title);
              }}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
            >
              Kaydet
            </button>
          </div>
        </div>
      </div>
    );
  };

  const renderTaskDetailModal = () => {
    if (!showTaskDetailModal || !selectedTask) return null;

    const getPriorityColor = (priority: string) => {
      switch (priority) {
        case 'urgent': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
        case 'high': return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300';
        case 'medium': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
        case 'low': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
        default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300';
      }
    };

    const getStatusColor = (status: string) => {
      switch (status) {
        case 'pending': return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300';
        case 'in_progress': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
        case 'completed': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
        case 'cancelled': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
        default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300';
      }
    };

    const getPortalInfo = (portal: string) => {
      switch (portal) {
        case 'admin': return { name: 'Admin Portal', color: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300', icon: '👑' };
        case 'employee': return { name: 'Çalışan Portalı', color: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300', icon: '👤' };
        case 'agent': return { name: 'Temsilci Portalı', color: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300', icon: '🎧' };
        case 'manager': return { name: 'Müdür Portalı', color: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300', icon: '👔' };
        default: return { name: 'Bilinmeyen', color: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300', icon: '❓' };
      }
    };

    const getRiskColor = (risk: string) => {
      switch (risk) {
        case 'high': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
        case 'medium': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
        case 'low': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
        default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300';
      }
    };

    const getComplexityColor = (complexity: string) => {
      switch (complexity) {
        case 'complex': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
        case 'moderate': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
        case 'simple': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
        default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300';
      }
    };

    const getEffortColor = (effort: string) => {
      switch (effort) {
        case 'large': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
        case 'medium': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
        case 'small': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
        default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300';
      }
    };

    const formatFileSize = (bytes: number) => {
      if (bytes === 0) return '0 Bytes';
      const k = 1024;
      const sizes = ['Bytes', 'KB', 'MB', 'GB'];
      const i = Math.floor(Math.log(bytes) / Math.log(k));
      return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-6xl mx-4 max-h-[95vh] overflow-y-auto">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              Görev Detayları
            </h2>
            <button
              onClick={() => {
                setShowTaskDetailModal(false);
                setSelectedTask(null);
              }}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              <XCircle className="w-6 h-6" />
            </button>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Sol Kolon - Ana Bilgiler */}
            <div className="lg:col-span-2 space-y-6">
              {/* Başlık ve Açıklama */}
              <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                  {selectedTask.title}
                </h3>
                <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                  {selectedTask.description}
                </p>
              </div>

              {/* Durum ve Etiketler */}
              <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                <h4 className="font-semibold text-gray-900 dark:text-white mb-3">Durum ve Etiketler</h4>
                <div className="flex flex-wrap gap-2 mb-4">
                  <span className={`px-3 py-1 text-sm font-medium rounded-full ${getPriorityColor(selectedTask.priority)}`}>
                    {selectedTask.priority === 'urgent' ? 'Acil' : 
                     selectedTask.priority === 'high' ? 'Yüksek' :
                     selectedTask.priority === 'medium' ? 'Orta' : 'Düşük'} Öncelik
                  </span>
                  <span className={`px-3 py-1 text-sm font-medium rounded-full ${getStatusColor(selectedTask.status)}`}>
                    {selectedTask.status === 'pending' ? 'Beklemede' :
                     selectedTask.status === 'in_progress' ? 'İşlemde' :
                     selectedTask.status === 'completed' ? 'Tamamlandı' : 'İptal'}
                  </span>
                  <span className={`px-3 py-1 text-sm font-medium rounded-full ${getPortalInfo(selectedTask.portal).color}`}>
                    <span>{getPortalInfo(selectedTask.portal).icon}</span> {getPortalInfo(selectedTask.portal).name}
                  </span>
                </div>
                
                {selectedTask.tags.length > 0 && (
                  <div>
                    <h5 className="font-medium text-gray-900 dark:text-white mb-2">Etiketler</h5>
                    <div className="flex flex-wrap gap-2">
                      {selectedTask.tags.map((tag, index) => (
                        <span
                          key={index}
                          className="px-2 py-1 text-xs bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-300 rounded"
                        >
                          #{tag}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Alt Görevler */}
              {selectedTask.subtasks && selectedTask.subtasks.length > 0 && (
                <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                  <h4 className="font-semibold text-gray-900 dark:text-white mb-3">Alt Görevler</h4>
                  <div className="space-y-2">
                    {selectedTask.subtasks.map((subtask) => (
                      <div key={subtask.id} className="flex items-center justify-between p-2 bg-white dark:bg-gray-600 rounded">
                        <div className="flex-1">
                          <p className="font-medium text-gray-900 dark:text-white text-sm">{subtask.title}</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">{subtask.assignee}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={`px-2 py-1 text-xs rounded ${
                            subtask.status === 'completed' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300' :
                            subtask.status === 'in_progress' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300' :
                            'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300'
                          }`}>
                            {subtask.status === 'completed' ? 'Tamamlandı' :
                             subtask.status === 'in_progress' ? 'İşlemde' : 'Beklemede'}
                          </span>
                          <span className="text-xs text-gray-500 dark:text-gray-400">{subtask.progress}%</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Zaman Girişleri */}
              {selectedTask.timeEntries && selectedTask.timeEntries.length > 0 && (
                <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                  <h4 className="font-semibold text-gray-900 dark:text-white mb-3">Zaman Girişleri</h4>
                  <div className="space-y-2">
                    {selectedTask.timeEntries.map((entry) => (
                      <div key={entry.id} className="flex items-center justify-between p-2 bg-white dark:bg-gray-600 rounded">
                        <div className="flex-1">
                          <p className="font-medium text-gray-900 dark:text-white text-sm">{entry.description}</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">{entry.user} • {new Date(entry.date).toLocaleDateString('tr-TR')}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-gray-900 dark:text-white">{entry.hours}h</span>
                          {entry.billable && (
                            <span className="px-2 py-1 text-xs bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300 rounded">
                              Faturalanabilir
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Yorumlar */}
              {selectedTask.comments && selectedTask.comments.length > 0 && (
                <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                  <h4 className="font-semibold text-gray-900 dark:text-white mb-3">Yorumlar</h4>
                  <div className="space-y-3">
                    {selectedTask.comments.map((comment) => (
                      <div key={comment.id} className="p-3 bg-white dark:bg-gray-600 rounded">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="font-medium text-gray-900 dark:text-white text-sm">{comment.author}</span>
                          <span className="text-xs text-gray-500 dark:text-gray-400">
                            {new Date(comment.timestamp).toLocaleDateString('tr-TR', { 
                              day: '2-digit', 
                              month: '2-digit', 
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </span>
                        </div>
                        <p className="text-gray-600 dark:text-gray-400 text-sm">{comment.content}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Geçmiş */}
              {selectedTask.history && selectedTask.history.length > 0 && (
                <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                  <h4 className="font-semibold text-gray-900 dark:text-white mb-3">Görev Geçmişi</h4>
                  <div className="space-y-2">
                    {selectedTask.history.map((history) => (
                      <div key={history.id} className="flex items-start gap-3 p-2 bg-white dark:bg-gray-600 rounded">
                        <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                        <div className="flex-1">
                          <p className="font-medium text-gray-900 dark:text-white text-sm">{history.action}</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">{history.user}</p>
                          <p className="text-xs text-gray-600 dark:text-gray-400">{history.details}</p>
                          <p className="text-xs text-gray-400 dark:text-gray-500">
                            {new Date(history.timestamp).toLocaleDateString('tr-TR', { 
                              day: '2-digit', 
                              month: '2-digit', 
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Sağ Kolon - Detaylar */}
            <div className="space-y-6">
              {/* Temel Bilgiler */}
              <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                <h4 className="font-semibold text-gray-900 dark:text-white mb-3">Temel Bilgiler</h4>
                <div className="space-y-3">
                  <div>
                    <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Atanan Kişi</p>
                    <p className="text-gray-900 dark:text-white">{selectedTask.assignee}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Oluşturan</p>
                    <p className="text-gray-900 dark:text-white">{selectedTask.createdBy}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Bitiş Tarihi</p>
                    <p className="text-gray-900 dark:text-white">
                      {new Date(selectedTask.dueDate).toLocaleDateString('tr-TR')}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Son Güncelleme</p>
                    <p className="text-gray-900 dark:text-white">
                      {new Date(selectedTask.lastModified).toLocaleDateString('tr-TR', { 
                        day: '2-digit', 
                        month: '2-digit', 
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
                  </div>
                </div>
              </div>

              {/* İlerleme */}
              <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                <h4 className="font-semibold text-gray-900 dark:text-white mb-3">İlerleme</h4>
                <div className="space-y-3">
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-700 dark:text-gray-300">İlerleme</span>
                      <span className="text-gray-900 dark:text-white font-medium">{selectedTask.progress}%</span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-3">
                      <div
                        className="bg-blue-600 h-3 rounded-full transition-all duration-300"
                        style={{ width: `${selectedTask.progress}%` }}
                      ></div>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <p className="text-gray-700 dark:text-gray-300">Tahmini</p>
                      <p className="text-gray-900 dark:text-white font-medium">{selectedTask.estimatedHours}h</p>
                    </div>
                    <div>
                      <p className="text-gray-700 dark:text-gray-300">Gerçekleşen</p>
                      <p className="text-gray-900 dark:text-white font-medium">{selectedTask.actualHours}h</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Maliyet */}
              <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                <h4 className="font-semibold text-gray-900 dark:text-white mb-3">Maliyet</h4>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-700 dark:text-gray-300">Tahmini</span>
                    <span className="text-sm font-medium text-gray-900 dark:text-white">{selectedTask.estimatedCost.toLocaleString('tr-TR')} TL</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-700 dark:text-gray-300">Gerçekleşen</span>
                    <span className="text-sm font-medium text-gray-900 dark:text-white">{selectedTask.actualCost.toLocaleString('tr-TR')} TL</span>
                  </div>
                </div>
              </div>

              {/* Proje Bilgileri */}
              <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                <h4 className="font-semibold text-gray-900 dark:text-white mb-3">Proje Bilgileri</h4>
                <div className="space-y-3">
                  <div>
                    <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Departman</p>
                    <p className="text-gray-900 dark:text-white">{selectedTask.department}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Proje</p>
                    <p className="text-gray-900 dark:text-white">{selectedTask.project}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Milestone</p>
                    <p className="text-gray-900 dark:text-white">{selectedTask.milestone}</p>
                  </div>
                </div>
              </div>

              {/* Risk ve Karmaşıklık */}
              <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                <h4 className="font-semibold text-gray-900 dark:text-white mb-3">Risk ve Karmaşıklık</h4>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-700 dark:text-gray-300">Risk Seviyesi</span>
                    <span className={`px-2 py-1 text-xs rounded ${getRiskColor(selectedTask.riskLevel)}`}>
                      {selectedTask.riskLevel === 'high' ? 'Yüksek' :
                       selectedTask.riskLevel === 'medium' ? 'Orta' : 'Düşük'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-700 dark:text-gray-300">Karmaşıklık</span>
                    <span className={`px-2 py-1 text-xs rounded ${getComplexityColor(selectedTask.complexity)}`}>
                      {selectedTask.complexity === 'complex' ? 'Karmaşık' :
                       selectedTask.complexity === 'moderate' ? 'Orta' : 'Basit'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-700 dark:text-gray-300">Çaba</span>
                    <span className={`px-2 py-1 text-xs rounded ${getEffortColor(selectedTask.effort)}`}>
                      {selectedTask.effort === 'large' ? 'Büyük' :
                       selectedTask.effort === 'medium' ? 'Orta' : 'Küçük'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Dosya Ekleri */}
              {selectedTask.attachments && selectedTask.attachments.length > 0 && (
                <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                  <h4 className="font-semibold text-gray-900 dark:text-white mb-3">Dosya Ekleri</h4>
                  <div className="space-y-2">
                    {selectedTask.attachments.map((attachment) => (
                      <div key={attachment.id} className="flex items-center gap-2 p-2 bg-white dark:bg-gray-600 rounded">
                        <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900 rounded flex items-center justify-center">
                          <span className="text-blue-600 dark:text-blue-400 text-xs">📄</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{attachment.name}</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">{formatFileSize(attachment.size)}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* İlgili Talepler */}
              {selectedTask.relatedTickets && selectedTask.relatedTickets.length > 0 && (
                <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                  <h4 className="font-semibold text-gray-900 dark:text-white mb-3">İlgili Talepler</h4>
                  <div className="flex flex-wrap gap-2">
                    {selectedTask.relatedTickets.map((ticket, index) => (
                      <span
                        key={index}
                        className="px-2 py-1 text-xs bg-orange-100 dark:bg-orange-900 text-orange-800 dark:text-orange-300 rounded"
                      >
                        {ticket}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
          
          <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-gray-200 dark:border-gray-600">
            <button
              onClick={() => {
                setShowTaskDetailModal(false);
                setSelectedTask(null);
              }}
              className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
            >
              Kapat
            </button>
            <button
              onClick={() => {
                setShowTaskDetailModal(false);
                setShowEditTaskModal(true);
              }}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
            >
              Düzenle
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Görev Yönetimi</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Tüm portallardaki görevleri organize edin, takip edin ve yönetin
          </p>
          <div className="flex items-center gap-2 mt-2">
            <span className="text-sm text-gray-500 dark:text-gray-400">Portallar:</span>
            <span className="text-xs bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300 px-2 py-1 rounded-full">👑 Admin</span>
            <span className="text-xs bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300 px-2 py-1 rounded-full">👤 Çalışan</span>
            <span className="text-xs bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300 px-2 py-1 rounded-full">🎧 Temsilci</span>
            <span className="text-xs bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300 px-2 py-1 rounded-full">👔 Müdür</span>
          </div>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-sm text-gray-500 dark:text-gray-400">💡 İpucu:</span>
            <span className="text-xs bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300 px-2 py-1 rounded-full">Görevleri sürükleyip bırakarak durumlarını değiştirin</span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <FeedbackButton 
            pageSource="TasksManagement" 
            position="inline"
            className="inline-flex items-center px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-medium"
          />
          <button
            onClick={() => {
              setShowNewTaskModal(true);
              console.log('Yeni görev modalı açılıyor...');
            }}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
          >
            <Plus className="w-4 h-4" />
            Yeni Görev
          </button>
        </div>
      </div>

      {/* İstatistikler */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{taskStats.total}</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">Toplam</p>
            </div>
            <Target className="w-8 h-8 text-blue-600 dark:text-blue-400" />
          </div>
        </div>
        
        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{taskStats.pending}</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">Beklemede</p>
            </div>
            <Clock className="w-8 h-8 text-gray-600 dark:text-gray-400" />
          </div>
        </div>
        
        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{taskStats.inProgress}</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">İşlemde</p>
            </div>
            <Zap className="w-8 h-8 text-blue-600 dark:text-blue-400" />
          </div>
        </div>
        
        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{taskStats.completed}</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">Tamamlandı</p>
            </div>
            <CheckCircle className="w-8 h-8 text-green-600 dark:text-green-400" />
          </div>
        </div>
        
        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-2xl font-bold text-red-600 dark:text-red-400">{taskStats.overdue}</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">Gecikmiş</p>
            </div>
            <AlertCircle className="w-8 h-8 text-red-600 dark:text-red-400" />
          </div>
        </div>
        
        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">{taskStats.highPriority}</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">Yüksek Öncelik</p>
            </div>
            <Flag className="w-8 h-8 text-orange-600 dark:text-orange-400" />
          </div>
        </div>
      </div>

      {/* Filtreler ve Görünüm */}
      <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Arama */}
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Görev ara..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          
          {/* Filtreler */}
          <div className="flex gap-2">
            <select
              value={selectedPortal}
              onChange={(e) => setSelectedPortal(e.target.value)}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">Tüm Portallar</option>
              <option value="admin">👑 Admin Portal</option>
              <option value="employee">👤 Çalışan Portalı</option>
              <option value="agent">🎧 Temsilci Portalı</option>
              <option value="manager">👔 Müdür Portalı</option>
            </select>
            
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">Tüm Durumlar</option>
              <option value="pending">Beklemede</option>
              <option value="in_progress">İşlemde</option>
              <option value="completed">Tamamlandı</option>
              <option value="cancelled">İptal</option>
            </select>
            
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">Tüm Öncelikler</option>
              <option value="urgent">Acil</option>
              <option value="high">Yüksek</option>
              <option value="medium">Orta</option>
              <option value="low">Düşük</option>
            </select>
          </div>
          
          {/* Görünüm Seçenekleri */}
          <div className="flex gap-2">
            <button
              onClick={() => setCurrentView('list')}
              className={`px-3 py-2 rounded-lg transition-colors ${
                currentView === 'list'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
              title="Liste Görünümü"
            >
              <List className="w-4 h-4" />
            </button>
            <button
              onClick={() => setCurrentView('kanban')}
              className={`px-3 py-2 rounded-lg transition-colors ${
                currentView === 'kanban'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
              title="Kanban Görünümü"
            >
              <BarChart3 className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* İçerik */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
        <div className="p-6">
          {currentView === 'list' && renderTaskList()}
          {currentView === 'kanban' && renderKanbanView()}
        </div>
      </div>
      
      {/* Modal'lar */}
      {renderEditTaskModal()}
      {renderTaskDetailModal()}
    </div>
  );
};

export default TasksManagement;
