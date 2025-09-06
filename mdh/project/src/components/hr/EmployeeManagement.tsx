import React, { useState } from 'react';
import { DragDropContext, Droppable, Draggable, DropResult } from 'react-beautiful-dnd';
import { supabase } from '../../lib/supabase';
import { 
  Plus, 
  Search, 
  Eye, 
  Edit, 
  Trash2, 
  User, 
  Mail, 
  Phone, 
  Calendar,
  Building,
  Award,
  TrendingUp,
  Clock,
  Users,
  UserPlus,
  UserCheck,
  Briefcase,
  XCircle,
  List,
  Grid3X3,
  Settings,
  X,
  Save
} from 'lucide-react';

interface Employee {
  id: string;
  name: string;
  email: string;
  position: string;
  title: string;
  department: string;
  hire_date: string;
  skills: string[];
  performance_score: number;
  attendance_rate: number;
  leave_balance: number;
  career_goals: string[];
  status: string;
  phone?: string;
  address?: string;
  education?: string;
  experience_years?: number;
  manager_id?: string;
  team_size?: number;
  reporting_level?: number;
  salary?: number;
}

interface EmployeeFormData {
  name: string;
  email: string;
  position: string;
  title: string;
  department: string;
  hire_date: string;
  skills: string[];
  performance_score: number;
  attendance_rate: number;
  leave_balance: number;
  career_goals: string[];
  status: string;
  phone?: string;
  address?: string;
  education?: string;
  experience_years?: number;
  manager_id?: string;
  team_size?: number;
  reporting_level?: number;
  salary?: number;
}

interface Column {
  id: string;
  name: string;
  color: string;
  status: string;
  order: number;
}

interface EmployeeManagementProps {
  employees: Employee[];
  onEmployeeUpdate: () => void;
  onViewEmployee?: (employeeId: string) => void;
}

const EmployeeManagement: React.FC<EmployeeManagementProps> = ({ employees, onEmployeeUpdate, onViewEmployee }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [showAddEmployee, setShowAddEmployee] = useState(false);
  const [showEditEmployee, setShowEditEmployee] = useState(false);
  const [showViewEmployee, setShowViewEmployee] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  
  // Görünüm ve sütun yönetimi state'leri
  const [viewMode, setViewMode] = useState<'list' | 'kanban'>('list');
  const [columns, setColumns] = useState<Column[]>([
    { id: 'active', name: 'Aktif Çalışanlar', color: 'bg-green-500', status: 'active', order: 1 },
    { id: 'on_leave', name: 'İzindeki Çalışanlar', color: 'bg-yellow-500', status: 'on_leave', order: 2 },
    { id: 'inactive', name: 'Pasif Çalışanlar', color: 'bg-red-500', status: 'inactive', order: 3 }
  ]);
  const [showColumnSettings, setShowColumnSettings] = useState(false);
  const [editingColumn, setEditingColumn] = useState<Column | null>(null);
  const [newColumnName, setNewColumnName] = useState('');
  const [newColumnColor, setNewColumnColor] = useState('bg-blue-500');
  const [employeeFormData, setEmployeeFormData] = useState<EmployeeFormData>({
    name: '',
    email: '',
    position: '',
    title: 'Çalışan',
    department: '',
    hire_date: '',
    skills: [],
    performance_score: 0,
    attendance_rate: 100,
    leave_balance: 20,
    career_goals: [],
    status: 'active'
  });

  const departments = ['Teknoloji', 'Müşteri Hizmetleri', 'Satış', 'İK', 'Finans', 'Pazarlama', 'Operasyon'];
  const statuses = ['active', 'inactive', 'on_leave'];
  const columnColors = [
    'bg-blue-500', 'bg-green-500', 'bg-yellow-500', 'bg-red-500', 
    'bg-purple-500', 'bg-pink-500', 'bg-indigo-500', 'bg-gray-500'
  ];

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'active': return 'Aktif';
      case 'inactive': return 'Pasif';
      case 'on_leave': return 'İzinde';
      default: return status;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'inactive': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      case 'on_leave': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  const calculateExperienceYears = (hireDate: string) => {
    const hire = new Date(hireDate);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - hire.getTime());
    const diffYears = Math.ceil(diffTime / (1000 * 60 * 60 * 24 * 365));
    return diffYears;
  };

  const filteredEmployees = employees.filter(employee => {
    const matchesSearch = employee.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         employee.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         employee.position.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDepartment = !departmentFilter || employee.department === departmentFilter;
    const matchesStatus = !statusFilter || employee.status === statusFilter;
    return matchesSearch && matchesDepartment && matchesStatus;
  });

  const handleAddEmployee = async () => {
    try {
      const { error } = await supabase
        .from('employees')
        .insert([employeeFormData]);

      if (error) throw error;

      setShowAddEmployee(false);
      setEmployeeFormData({
        name: '',
        email: '',
        position: '',
        title: 'Çalışan',
        department: '',
        hire_date: '',
        skills: [],
        performance_score: 0,
        attendance_rate: 100,
        leave_balance: 20,
        career_goals: [],
        status: 'active'
      });
      onEmployeeUpdate();
    } catch (error) {
      console.error('Çalışan eklenirken hata:', error);
    }
  };

  const handleEditEmployee = async () => {
    if (!selectedEmployee) return;

    try {
      const { error } = await supabase
        .from('employees')
        .update(employeeFormData)
        .eq('id', selectedEmployee.id);

      if (error) throw error;

      setShowEditEmployee(false);
      setSelectedEmployee(null);
      onEmployeeUpdate();
    } catch (error) {
      console.error('Çalışan güncellenirken hata:', error);
    }
  };

  const handleDeleteEmployee = async (id: string) => {
    if (!confirm('Bu çalışanı silmek istediğinizden emin misiniz?')) return;

    try {
      const { error } = await supabase
        .from('employees')
        .delete()
        .eq('id', id);

      if (error) throw error;
      onEmployeeUpdate();
    } catch (error) {
      console.error('Çalışan silinirken hata:', error);
    }
  };

  const handleViewEmployee = (employee: Employee) => {
    if (onViewEmployee) {
      onViewEmployee(employee.id);
    } else {
      setSelectedEmployee(employee);
      setShowViewEmployee(true);
    }
  };

  const handleEditEmployeeClick = (employee: Employee) => {
    setSelectedEmployee(employee);
    setEmployeeFormData({
      name: employee.name,
      email: employee.email,
      position: employee.position,
      title: employee.title || 'Çalışan',
      department: employee.department,
      hire_date: employee.hire_date,
      skills: employee.skills,
      performance_score: employee.performance_score,
      attendance_rate: employee.attendance_rate,
      leave_balance: employee.leave_balance,
      career_goals: employee.career_goals,
      status: employee.status,
      phone: employee.phone,
      address: employee.address,
      education: employee.education,
      experience_years: employee.experience_years
    });
    setShowEditEmployee(true);
  };

  // Sütun yönetimi fonksiyonları
  const handleAddColumn = () => {
    if (!newColumnName.trim()) return;
    
    const newColumn: Column = {
      id: `column_${Date.now()}`,
      name: newColumnName,
      color: newColumnColor,
      status: 'custom',
      order: columns.length + 1
    };
    
    setColumns([...columns, newColumn]);
    setNewColumnName('');
    setNewColumnColor('bg-blue-500');
  };

  const handleEditColumn = (column: Column) => {
    setEditingColumn(column);
    setNewColumnName(column.name);
    setNewColumnColor(column.color);
  };

  const handleUpdateColumn = () => {
    if (!editingColumn || !newColumnName.trim()) return;
    
    setColumns(columns.map(col => 
      col.id === editingColumn.id 
        ? { ...col, name: newColumnName, color: newColumnColor }
        : col
    ));
    setEditingColumn(null);
    setNewColumnName('');
    setNewColumnColor('bg-blue-500');
  };

  const handleDeleteColumn = (columnId: string) => {
    if (columns.length <= 1) return; // En az bir sütun kalmalı
    setColumns(columns.filter(col => col.id !== columnId));
  };


  const getEmployeesByStatus = (status: string) => {
    return filteredEmployees.filter(emp => emp.status === status);
  };

  // Sürükle-bırak işlemi
  const handleDragEnd = async (result: DropResult) => {
    const { destination, source, draggableId } = result;

    // Geçerli bir hedef yoksa işlemi iptal et
    if (!destination) return;

    // Aynı sütun ve aynı pozisyondaysa işlemi iptal et
    if (
      destination.droppableId === source.droppableId &&
      destination.index === source.index
    ) {
      return;
    }

    // Hedef sütunun status'unu bul
    const targetColumn = columns.find(col => col.id === destination.droppableId);
    if (!targetColumn) return;

    try {
      // Çalışanın durumunu güncelle
      const { error } = await supabase
        .from('employees')
        .update({ status: targetColumn.status })
        .eq('id', draggableId);

      if (error) throw error;
      
      // Verileri yenile
      onEmployeeUpdate();
    } catch (error) {
      console.error('Çalışan durumu güncellenirken hata:', error);
    }
  };

  return (
    <div className="space-y-6">
      {/* İstatistikler */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900 dark:to-indigo-900 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Toplam Çalışan</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{employees.length}</p>
            </div>
            <div className="p-2 bg-blue-500 rounded-lg">
              <Users className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>
        
        <div className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900 dark:to-emerald-900 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Aktif Çalışan</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {employees.filter(e => e.status === 'active').length}
              </p>
            </div>
            <div className="p-2 bg-green-500 rounded-lg">
              <UserCheck className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>
        
        <div className="bg-gradient-to-br from-yellow-50 to-amber-50 dark:from-yellow-900 dark:to-amber-900 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">İzindeki Çalışan</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {employees.filter(e => e.status === 'on_leave').length}
              </p>
            </div>
            <div className="p-2 bg-yellow-500 rounded-lg">
              <Clock className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>
        
        <div className="bg-gradient-to-br from-purple-50 to-violet-50 dark:from-purple-900 dark:to-violet-900 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Ortalama Performans</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {employees.length > 0 
                  ? Math.round(employees.reduce((sum, e) => sum + e.performance_score, 0) / employees.length)
                  : 0
                }%
              </p>
            </div>
            <div className="p-2 bg-purple-500 rounded-lg">
              <TrendingUp className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>
      </div>

      {/* Arama ve Filtreler */}
      <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Çalışan ara..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
              />
            </div>
          </div>
          
          <div className="flex gap-2">
            <select
              value={departmentFilter}
              onChange={(e) => setDepartmentFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
            >
              <option value="">Tüm Departmanlar</option>
              {departments.map(dept => (
                <option key={dept} value={dept}>{dept}</option>
              ))}
            </select>
            
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
            >
              <option value="">Tüm Durumlar</option>
              {statuses.map(status => (
                <option key={status} value={status}>{getStatusLabel(status)}</option>
              ))}
            </select>
          </div>
          
          {/* Görünüm Geçiş Butonları */}
          <div className="flex gap-2">
            <div className="flex bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
              <button
                onClick={() => setViewMode('list')}
                className={`px-3 py-2 rounded-md flex items-center space-x-2 text-sm font-medium transition-colors ${
                  viewMode === 'list'
                    ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm'
                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                }`}
              >
                <List className="w-4 h-4" />
                <span>Liste</span>
              </button>
              <button
                onClick={() => setViewMode('kanban')}
                className={`px-3 py-2 rounded-md flex items-center space-x-2 text-sm font-medium transition-colors ${
                  viewMode === 'kanban'
                    ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm'
                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                }`}
              >
                <Grid3X3 className="w-4 h-4" />
                <span>Kanban</span>
              </button>
            </div>
            
            {viewMode === 'kanban' && (
              <button
                onClick={() => setShowColumnSettings(true)}
                className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center space-x-2"
                title="Sütun Ayarları"
              >
                <Settings className="w-4 h-4" />
              </button>
            )}
          </div>
          
          <button
            onClick={() => setShowAddEmployee(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center space-x-2"
          >
            <UserPlus className="w-5 h-5" />
            <span>Çalışan Ekle</span>
          </button>
        </div>
      </div>

      {/* Çalışanlar Görünümü */}
      <div className="w-full">
        {viewMode === 'list' ? (
          // Liste Görünümü
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
                <Users className="w-5 h-5 mr-2" />
                Çalışanlar ({filteredEmployees.length})
              </h3>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Çalışan
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Pozisyon
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Departman
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Performans
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Durum
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider w-40">
                      İşlemler
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {filteredEmployees.map((employee) => (
                    <tr key={employee.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10">
                            <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-semibold">
                              {employee.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                            </div>
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900 dark:text-white">
                              {employee.name}
                            </div>
                            <div className="text-sm text-gray-500 dark:text-gray-400">
                              {employee.email}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900 dark:text-white">{employee.position}</div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          {employee.title} • {calculateExperienceYears(employee.hire_date)} yıl deneyim
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900 dark:text-white">{employee.department}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-2 mr-2">
                            <div 
                              className={`h-2 rounded-full ${
                                employee.performance_score >= 80 ? 'bg-green-500' :
                                employee.performance_score >= 60 ? 'bg-yellow-500' : 'bg-red-500'
                              }`}
                              style={{ width: `${employee.performance_score}%` }}
                            />
                          </div>
                          <span className="text-sm text-gray-900 dark:text-white">
                            {employee.performance_score}%
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(employee.status)}`}>
                          {getStatusLabel(employee.status)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex space-x-3">
                          <button
                            onClick={() => handleViewEmployee(employee)}
                            className="p-2 text-blue-600 hover:text-white hover:bg-blue-600 dark:text-blue-400 dark:hover:text-white dark:hover:bg-blue-600 rounded-lg transition-colors border border-blue-200 dark:border-blue-700"
                            title="Görüntüle"
                          >
                            <Eye className="w-5 h-5" />
                          </button>
                          <button
                            onClick={() => handleEditEmployeeClick(employee)}
                            className="p-2 text-green-600 hover:text-white hover:bg-green-600 dark:text-green-400 dark:hover:text-white dark:hover:bg-green-600 rounded-lg transition-colors border border-green-200 dark:border-green-700"
                            title="Düzenle"
                          >
                            <Edit className="w-5 h-5" />
                          </button>
                          <button
                            onClick={() => handleDeleteEmployee(employee.id)}
                            className="p-2 text-red-600 hover:text-white hover:bg-red-600 dark:text-red-400 dark:hover:text-white dark:hover:bg-red-600 rounded-lg transition-colors border border-red-200 dark:border-red-700"
                            title="Sil"
                          >
                            <Trash2 className="w-5 h-5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          // Kanban Görünümü
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
                <Grid3X3 className="w-5 h-5 mr-2" />
                Kanban Görünümü ({filteredEmployees.length} çalışan)
              </h3>
            </div>
            <div className="p-6">
              <DragDropContext onDragEnd={handleDragEnd}>
                <div className="flex gap-6 overflow-x-auto pb-4">
                  {columns.sort((a, b) => a.order - b.order).map((column) => {
                    const columnEmployees = getEmployeesByStatus(column.status);
                    return (
                      <div key={column.id} className="flex-shrink-0 w-80">
                        <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                          <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center space-x-2">
                              <div className={`w-3 h-3 rounded-full ${column.color}`}></div>
                              <h4 className="font-semibold text-gray-900 dark:text-white">
                                {column.name}
                              </h4>
                              <span className="bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300 px-2 py-1 rounded-full text-xs">
                                {columnEmployees.length}
                              </span>
                            </div>
                            <div className="flex items-center space-x-1">
                              <button
                                onClick={() => handleEditColumn(column)}
                                className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                                title="Sütun Düzenle"
                              >
                                <Edit className="w-4 h-4" />
                              </button>
                              {columns.length > 1 && (
                                <button
                                  onClick={() => handleDeleteColumn(column.id)}
                                  className="p-1 text-gray-400 hover:text-red-600 dark:hover:text-red-400"
                                  title="Sütun Sil"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              )}
                            </div>
                          </div>
                          
                          <Droppable droppableId={column.id}>
                            {(provided, snapshot) => (
                              <div
                                ref={provided.innerRef}
                                {...provided.droppableProps}
                                className={`space-y-3 min-h-[200px] transition-colors ${
                                  snapshot.isDraggingOver ? 'bg-blue-50 dark:bg-blue-900/20' : ''
                                }`}
                              >
                                {columnEmployees.map((employee, index) => (
                                  <Draggable
                                    key={employee.id}
                                    draggableId={employee.id}
                                    index={index}
                                  >
                                    {(provided, snapshot) => (
                                      <div
                                        ref={provided.innerRef}
                                        {...provided.draggableProps}
                                        {...provided.dragHandleProps}
                                        className={`bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm border border-gray-200 dark:border-gray-600 hover:shadow-md transition-shadow cursor-pointer ${
                                          snapshot.isDragging ? 'shadow-lg rotate-2' : ''
                                        }`}
                                        onClick={() => handleViewEmployee(employee)}
                                      >
                                        <div className="flex items-start justify-between mb-3">
                                          <div className="flex items-center space-x-3">
                                            <div className="h-8 w-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-semibold text-sm">
                                              {employee.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                                            </div>
                                            <div>
                                              <h5 className="font-medium text-gray-900 dark:text-white text-sm">
                                                {employee.name}
                                              </h5>
                                              <p className="text-xs text-gray-500 dark:text-gray-400">
                                                {employee.position}
                                              </p>
                                            </div>
                                          </div>
                                          <div className="flex space-x-1">
                                            <button
                                              onClick={(e) => {
                                                e.stopPropagation();
                                                handleEditEmployeeClick(employee);
                                              }}
                                              className="p-1 text-gray-400 hover:text-green-600 dark:hover:text-green-400"
                                              title="Düzenle"
                                            >
                                              <Edit className="w-3 h-3" />
                                            </button>
                                            <button
                                              onClick={(e) => {
                                                e.stopPropagation();
                                                handleDeleteEmployee(employee.id);
                                              }}
                                              className="p-1 text-gray-400 hover:text-red-600 dark:hover:text-red-400"
                                              title="Sil"
                                            >
                                              <Trash2 className="w-3 h-3" />
                                            </button>
                                          </div>
                                        </div>
                                        
                                        <div className="space-y-2">
                                          <div className="flex items-center justify-between text-xs">
                                            <span className="text-gray-500 dark:text-gray-400">Performans</span>
                                            <span className="font-medium text-gray-900 dark:text-white">
                                              {employee.performance_score}%
                                            </span>
                                          </div>
                                          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5">
                                            <div 
                                              className={`h-1.5 rounded-full ${
                                                employee.performance_score >= 80 ? 'bg-green-500' :
                                                employee.performance_score >= 60 ? 'bg-yellow-500' : 'bg-red-500'
                                              }`}
                                              style={{ width: `${employee.performance_score}%` }}
                                            />
                                          </div>
                                          <div className="flex items-center justify-between text-xs">
                                            <span className="text-gray-500 dark:text-gray-400">{employee.department}</span>
                                            <span className="text-gray-500 dark:text-gray-400">
                                              {calculateExperienceYears(employee.hire_date)} yıl
                                            </span>
                                          </div>
                                        </div>
                                      </div>
                                    )}
                                  </Draggable>
                                ))}
                                {provided.placeholder}
                                
                                {columnEmployees.length === 0 && (
                                  <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                                    <Users className="w-8 h-8 mx-auto mb-2 opacity-50" />
                                    <p className="text-sm">Bu sütunda çalışan bulunmuyor</p>
                                  </div>
                                )}
                              </div>
                            )}
                          </Droppable>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </DragDropContext>
            </div>
          </div>
        )}
      </div>

      {/* Çalışan Ekleme Modal */}
      {showAddEmployee && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Yeni Çalışan Ekle</h3>
            <div className="space-y-4">
              <input
                type="text"
                placeholder="Ad Soyad"
                value={employeeFormData.name}
                onChange={(e) => setEmployeeFormData({...employeeFormData, name: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
              />
              <input
                type="email"
                placeholder="E-posta"
                value={employeeFormData.email}
                onChange={(e) => setEmployeeFormData({...employeeFormData, email: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
              />
              <input
                type="text"
                placeholder="Pozisyon"
                value={employeeFormData.position}
                onChange={(e) => setEmployeeFormData({...employeeFormData, position: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
              />
              <select
                value={employeeFormData.department}
                onChange={(e) => setEmployeeFormData({...employeeFormData, department: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
              >
                <option value="">Departman Seçin</option>
                {departments.map(dept => (
                  <option key={dept} value={dept}>{dept}</option>
                ))}
              </select>
              <input
                type="date"
                value={employeeFormData.hire_date}
                onChange={(e) => setEmployeeFormData({...employeeFormData, hire_date: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
              />
              <select
                value={employeeFormData.status}
                onChange={(e) => setEmployeeFormData({...employeeFormData, status: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
              >
                <option value="active">Aktif</option>
                <option value="inactive">Pasif</option>
                <option value="on_leave">İzinde</option>
              </select>
            </div>
            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => setShowAddEmployee(false)}
                className="px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600"
              >
                İptal
              </button>
              <button
                onClick={handleAddEmployee}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Ekle
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Çalışan Düzenleme Modal */}
      {showEditEmployee && selectedEmployee && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Çalışan Düzenle</h3>
            <div className="space-y-4">
              <input
                type="text"
                placeholder="Ad Soyad"
                value={employeeFormData.name}
                onChange={(e) => setEmployeeFormData({...employeeFormData, name: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
              />
              <input
                type="email"
                placeholder="E-posta"
                value={employeeFormData.email}
                onChange={(e) => setEmployeeFormData({...employeeFormData, email: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
              />
              <input
                type="text"
                placeholder="Pozisyon"
                value={employeeFormData.position}
                onChange={(e) => setEmployeeFormData({...employeeFormData, position: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
              />
              <select
                value={employeeFormData.department}
                onChange={(e) => setEmployeeFormData({...employeeFormData, department: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
              >
                <option value="">Departman Seçin</option>
                {departments.map(dept => (
                  <option key={dept} value={dept}>{dept}</option>
                ))}
              </select>
              <input
                type="date"
                value={employeeFormData.hire_date}
                onChange={(e) => setEmployeeFormData({...employeeFormData, hire_date: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
              />
              <select
                value={employeeFormData.status}
                onChange={(e) => setEmployeeFormData({...employeeFormData, status: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
              >
                <option value="active">Aktif</option>
                <option value="inactive">Pasif</option>
                <option value="on_leave">İzinde</option>
              </select>
            </div>
            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => setShowEditEmployee(false)}
                className="px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600"
              >
                İptal
              </button>
              <button
                onClick={handleEditEmployee}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Güncelle
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Çalışan Görüntüleme Modal */}
      {showViewEmployee && selectedEmployee && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white">Çalışan Detayları</h3>
              <button
                onClick={() => setShowViewEmployee(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <XCircle className="w-6 h-6" />
              </button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Temel Bilgiler */}
              <div className="space-y-4">
                <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                  <h4 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center">
                    <User className="w-5 h-5 mr-2 text-blue-500" />
                    Temel Bilgiler
                  </h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center">
                      <Mail className="w-4 h-4 mr-2 text-gray-400" />
                      <span className="text-gray-600 dark:text-gray-300">{selectedEmployee.email}</span>
                    </div>
                    <div className="flex items-center">
                      <Phone className="w-4 h-4 mr-2 text-gray-400" />
                      <span className="text-gray-600 dark:text-gray-300">{selectedEmployee.phone || 'Belirtilmemiş'}</span>
                    </div>
                    <div className="flex items-center">
                      <Calendar className="w-4 h-4 mr-2 text-gray-400" />
                      <span className="text-gray-600 dark:text-gray-300">
                        İşe Başlama: {new Date(selectedEmployee.hire_date).toLocaleDateString('tr-TR')}
                      </span>
                    </div>
                    <div className="flex items-center">
                      <Building className="w-4 h-4 mr-2 text-gray-400" />
                      <span className="text-gray-600 dark:text-gray-300">{selectedEmployee.department}</span>
                    </div>
                    <div className="flex items-center">
                      <Briefcase className="w-4 h-4 mr-2 text-gray-400" />
                      <span className="text-gray-600 dark:text-gray-300">{selectedEmployee.position}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* İstatistikler */}
              <div className="space-y-4">
                <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                  <h4 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center">
                    <TrendingUp className="w-5 h-5 mr-2 text-green-500" />
                    İstatistikler
                  </h4>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600 dark:text-gray-300">Performans Puanı</span>
                      <div className="flex items-center">
                        <div className="w-16 bg-gray-200 dark:bg-gray-600 rounded-full h-2 mr-2">
                          <div 
                            className={`h-2 rounded-full ${
                              selectedEmployee.performance_score >= 80 ? 'bg-green-500' :
                              selectedEmployee.performance_score >= 60 ? 'bg-yellow-500' : 'bg-red-500'
                            }`}
                            style={{ width: `${selectedEmployee.performance_score}%` }}
                          />
                        </div>
                        <span className="text-sm font-medium text-gray-900 dark:text-white">
                          {selectedEmployee.performance_score}%
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600 dark:text-gray-300">Devam Oranı</span>
                      <span className="text-sm font-medium text-gray-900 dark:text-white">
                        {selectedEmployee.attendance_rate}%
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600 dark:text-gray-300">Kalan İzin</span>
                      <span className="text-sm font-medium text-gray-900 dark:text-white">
                        {selectedEmployee.leave_balance} gün
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600 dark:text-gray-300">Deneyim</span>
                      <span className="text-sm font-medium text-gray-900 dark:text-white">
                        {calculateExperienceYears(selectedEmployee.hire_date)} yıl
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Durum ve Beceriler */}
              <div className="space-y-4">
                <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                  <h4 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center">
                    <Award className="w-5 h-5 mr-2 text-purple-500" />
                    Durum & Beceriler
                  </h4>
                  <div className="space-y-3">
                    <div>
                      <span className="text-sm text-gray-600 dark:text-gray-300">Durum:</span>
                      <span className={`ml-2 inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(selectedEmployee.status)}`}>
                        {getStatusLabel(selectedEmployee.status)}
                      </span>
                    </div>
                    <div>
                      <span className="text-sm text-gray-600 dark:text-gray-300">Beceri Sayısı:</span>
                      <span className="ml-2 text-sm font-medium text-gray-900 dark:text-white">
                        {selectedEmployee.skills.length}
                      </span>
                    </div>
                    {selectedEmployee.skills.length > 0 && (
                      <div>
                        <span className="text-sm text-gray-600 dark:text-gray-300">Beceriler:</span>
                        <div className="mt-1 flex flex-wrap gap-1">
                          {selectedEmployee.skills.map((skill, index) => (
                            <span key={index} className="px-2 py-1 text-xs bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 rounded">
                              {skill}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-end mt-6">
              <button
                onClick={() => handleEditEmployeeClick(selectedEmployee)}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center space-x-2"
              >
                <Edit className="w-4 h-4" />
                <span>Düzenle</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Sütun Ayarları Modal */}
      {showColumnSettings && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white flex items-center">
                <Settings className="w-5 h-5 mr-2" />
                Sütun Ayarları
              </h3>
              <button
                onClick={() => setShowColumnSettings(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Mevcut Sütunlar */}
            <div className="space-y-4 mb-6">
              <h4 className="font-medium text-gray-900 dark:text-white">Mevcut Sütunlar</h4>
              <div className="space-y-2">
                {columns.sort((a, b) => a.order - b.order).map((column) => (
                  <div key={column.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className={`w-4 h-4 rounded-full ${column.color}`}></div>
                      <span className="font-medium text-gray-900 dark:text-white">{column.name}</span>
                      <span className="text-sm text-gray-500 dark:text-gray-400">
                        ({getEmployeesByStatus(column.status).length} çalışan)
                      </span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => handleEditColumn(column)}
                        className="p-1 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400"
                        title="Düzenle"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      {columns.length > 1 && (
                        <button
                          onClick={() => handleDeleteColumn(column.id)}
                          className="p-1 text-gray-400 hover:text-red-600 dark:hover:text-red-400"
                          title="Sil"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Yeni Sütun Ekleme */}
            <div className="space-y-4">
              <h4 className="font-medium text-gray-900 dark:text-white">Yeni Sütun Ekle</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Sütun Adı
                  </label>
                  <input
                    type="text"
                    value={newColumnName}
                    onChange={(e) => setNewColumnName(e.target.value)}
                    placeholder="Sütun adını girin"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Renk
                  </label>
                  <div className="flex space-x-2">
                    {columnColors.map((color) => (
                      <button
                        key={color}
                        onClick={() => setNewColumnColor(color)}
                        className={`w-8 h-8 rounded-full ${color} border-2 ${
                          newColumnColor === color ? 'border-gray-900 dark:border-white' : 'border-gray-300 dark:border-gray-600'
                        }`}
                        title={color}
                      />
                    ))}
                  </div>
                </div>
              </div>
              <button
                onClick={handleAddColumn}
                disabled={!newColumnName.trim()}
                className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
              >
                <Plus className="w-4 h-4" />
                <span>Sütun Ekle</span>
              </button>
            </div>

            {/* Sütun Düzenleme */}
            {editingColumn && (
              <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <h4 className="font-medium text-gray-900 dark:text-white mb-4">Sütun Düzenle</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Sütun Adı
                    </label>
                    <input
                      type="text"
                      value={newColumnName}
                      onChange={(e) => setNewColumnName(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Renk
                    </label>
                    <div className="flex space-x-2">
                      {columnColors.map((color) => (
                        <button
                          key={color}
                          onClick={() => setNewColumnColor(color)}
                          className={`w-8 h-8 rounded-full ${color} border-2 ${
                            newColumnColor === color ? 'border-gray-900 dark:border-white' : 'border-gray-300 dark:border-gray-600'
                          }`}
                          title={color}
                        />
                      ))}
                    </div>
                  </div>
                </div>
                <div className="flex justify-end space-x-3 mt-4">
                  <button
                    onClick={() => setEditingColumn(null)}
                    className="px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600"
                  >
                    İptal
                  </button>
                  <button
                    onClick={handleUpdateColumn}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center space-x-2"
                  >
                    <Save className="w-4 h-4" />
                    <span>Güncelle</span>
                  </button>
                </div>
              </div>
            )}

            <div className="flex justify-end mt-6">
              <button
                onClick={() => setShowColumnSettings(false)}
                className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
              >
                Kapat
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EmployeeManagement;
