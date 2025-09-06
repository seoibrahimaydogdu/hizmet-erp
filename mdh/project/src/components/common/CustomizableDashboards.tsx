import React, { useState, useRef, ReactNode, DragEvent } from 'react';
import { useAnimation } from './AnimationSystem';
import { TouchFeedback } from './TouchInteractions';
import { 
  GripVertical, Settings, Eye, EyeOff, Plus, X, 
  BarChart3, TrendingUp, Users,
  Calendar, Clock, Star, ThumbsUp, MessageSquare,
  FileText, Image, Video, Music, Download,
  List, Kanban, Columns, Edit3, Trash2
} from 'lucide-react';

// Widget Types
export type WidgetType = 
  | 'chart' | 'stat' | 'table' | 'list' | 'calendar' | 'clock' | 'weather'
  | 'news' | 'social' | 'media' | 'text' | 'image' | 'video' | 'audio'
  | 'form' | 'button' | 'link' | 'iframe' | 'custom';

export type WidgetSize = 'small' | 'medium' | 'large' | 'xlarge';

// View Types
export type ViewType = 'grid' | 'list' | 'kanban';

// Column Interface for Kanban View
export interface Column {
  id: string;
  title: string;
  color: string;
  order: number;
  widgetIds: string[];
}

export type WidgetPosition = {
  x: number;
  y: number;
  w: number;
  h: number;
};

// Widget Interface
export interface Widget {
  id: string;
  type: WidgetType;
  title: string;
  position: WidgetPosition;
  size: WidgetSize;
  visible: boolean;
  locked: boolean;
  data?: any;
  config?: any;
  content?: ReactNode;
}

// Dashboard Layout
export interface DashboardLayout {
  id: string;
  name: string;
  description?: string;
  widgets: Widget[];
  columns: number;
  rows: number;
  gap: number;
  padding: number;
  background?: string;
  theme?: 'light' | 'dark' | 'auto';
  viewType: ViewType;
  kanbanColumns: Column[];
}

// Widget Component Props
interface WidgetComponentProps {
  widget: Widget;
  isEditing?: boolean;
  onUpdate?: (widget: Widget) => void;
  onDelete?: (widgetId: string) => void;
}

// Base Widget Component
export const WidgetComponent: React.FC<WidgetComponentProps> = ({
  widget,
  isEditing = false,
  onUpdate,
  onDelete
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const { addAnimation } = useAnimation();
  const widgetRef = useRef<HTMLDivElement>(null);

  const handleDragStart = (e: DragEvent) => {
    if (!isEditing || widget.locked) return;
    
    setIsDragging(true);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', widget.id);
  };

  const handleDragEnd = () => {
    setIsDragging(false);
  };

  const handleDelete = () => {
    if (onDelete) {
      addAnimation(`widget-delete-${widget.id}`, {
        type: 'scaleOut',
        duration: 'fast',
        easing: 'ease-in'
      });
      setTimeout(() => onDelete(widget.id), 150);
    }
  };

  const handleToggleVisibility = () => {
    if (onUpdate) {
      onUpdate({ ...widget, visible: !widget.visible });
    }
  };

  const handleToggleLock = () => {
    if (onUpdate) {
      onUpdate({ ...widget, locked: !widget.locked });
    }
  };

  return (
    <div
      ref={widgetRef}
      draggable={isEditing && !widget.locked}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      className={`
        relative bg-white dark:bg-gray-800 rounded-xl shadow-soft border border-gray-200 dark:border-gray-700
        transition-all duration-300 ease-in-out
        ${isDragging ? 'opacity-50 scale-95' : ''}
        ${isEditing ? 'hover:shadow-medium' : ''}
        ${!widget.visible ? 'opacity-50' : ''}
        ${widget.locked ? 'ring-2 ring-yellow-400' : ''}
      `}
      style={{
        gridColumn: `span ${widget.position.w}`,
        gridRow: `span ${widget.position.h}`
      }}
    >
      {/* Widget Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-2">
          {isEditing && !widget.locked && (
            <GripVertical className="w-4 h-4 text-gray-400 cursor-move" />
          )}
          <h3 className="font-semibold text-gray-900 dark:text-gray-100">
            {widget.title}
          </h3>
          {widget.locked && (
            <div className="w-2 h-2 bg-yellow-400 rounded-full" title="Kilitli" />
          )}
        </div>
        
        {isEditing && (
          <div className="flex items-center gap-1">
            <TouchFeedback feedback="scale">
              <button
                onClick={handleToggleVisibility}
                className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                title={widget.visible ? 'Gizle' : 'Göster'}
              >
                {widget.visible ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
              </button>
            </TouchFeedback>
            
            <TouchFeedback feedback="scale">
              <button
                onClick={handleToggleLock}
                className={`p-1 ${widget.locked ? 'text-yellow-500' : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'}`}
                title={widget.locked ? 'Kilidi Aç' : 'Kilitle'}
              >
                <Settings className="w-4 h-4" />
              </button>
            </TouchFeedback>
            
            <TouchFeedback feedback="scale">
              <button
                onClick={handleDelete}
                className="p-1 text-gray-400 hover:text-red-500"
                title="Sil"
              >
                <X className="w-4 h-4" />
              </button>
            </TouchFeedback>
          </div>
        )}
      </div>

      {/* Widget Content */}
      <div className="p-4">
        {widget.content || <DefaultWidgetContent widget={widget} />}
      </div>

      {/* Resize Handle */}
      {isEditing && !widget.locked && (
        <div className="absolute bottom-0 right-0 w-4 h-4 cursor-se-resize opacity-0 hover:opacity-100 transition-opacity">
          <div className="w-full h-full bg-primary-500 rounded-tl-lg" />
        </div>
      )}
    </div>
  );
};

// Default Widget Content
const DefaultWidgetContent: React.FC<{ widget: Widget }> = ({ widget }) => {
  const getWidgetIcon = () => {
    switch (widget.type) {
      case 'chart': return <BarChart3 className="w-8 h-8 text-primary-500" />;
      case 'stat': return <TrendingUp className="w-8 h-8 text-success-500" />;
      case 'table': return <FileText className="w-8 h-8 text-blue-500" />;
      case 'list': return <MessageSquare className="w-8 h-8 text-purple-500" />;
      case 'calendar': return <Calendar className="w-8 h-8 text-orange-500" />;
      case 'clock': return <Clock className="w-8 h-8 text-gray-500" />;
      case 'weather': return <Star className="w-8 h-8 text-yellow-500" />;
      case 'news': return <FileText className="w-8 h-8 text-red-500" />;
      case 'social': return <Users className="w-8 h-8 text-pink-500" />;
      case 'media': return <Image className="w-8 h-8 text-green-500" />;
      case 'text': return <FileText className="w-8 h-8 text-gray-500" />;
      case 'image': return <Image className="w-8 h-8 text-blue-500" />;
      case 'video': return <Video className="w-8 h-8 text-red-500" />;
      case 'audio': return <Music className="w-8 h-8 text-purple-500" />;
      case 'form': return <FileText className="w-8 h-8 text-indigo-500" />;
      case 'button': return <ThumbsUp className="w-8 h-8 text-green-500" />;
      case 'link': return <Download className="w-8 h-8 text-blue-500" />;
      case 'iframe': return <FileText className="w-8 h-8 text-gray-500" />;
      case 'custom': return <Settings className="w-8 h-8 text-gray-500" />;
      default: return <Settings className="w-8 h-8 text-gray-500" />;
    }
  };

  return (
    <div className="flex flex-col items-center justify-center h-full text-center">
      {getWidgetIcon()}
      <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
        {widget.title}
      </p>
      <p className="text-xs text-gray-400 dark:text-gray-500">
        Widget içeriği yükleniyor...
      </p>
    </div>
  );
};

// Dashboard Builder Component
interface DashboardBuilderProps {
  layout: DashboardLayout;
  onLayoutChange: (layout: DashboardLayout) => void;
  isEditing?: boolean;
  className?: string;
}

export const DashboardBuilder: React.FC<DashboardBuilderProps> = ({
  layout,
  onLayoutChange,
  isEditing = false,
  className = ''
}) => {
  const [draggedWidget, setDraggedWidget] = useState<string | null>(null);
  const [dropZone, setDropZone] = useState<{ x: number; y: number } | null>(null);
  const { addAnimation } = useAnimation();
  const dashboardRef = useRef<HTMLDivElement>(null);

  const handleDragOver = (e: DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    
    if (dashboardRef.current) {
      const rect = dashboardRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      setDropZone({ x, y });
    }
  };

  const handleDrop = (e: DragEvent) => {
    e.preventDefault();
    const widgetId = e.dataTransfer.getData('text/plain');
    
    if (widgetId && dropZone && dashboardRef.current) {
      const rect = dashboardRef.current.getBoundingClientRect();
      const gridX = Math.floor((dropZone.x - rect.left) / 64); // 64px grid size
      const gridY = Math.floor((dropZone.y - rect.top) / 64);
      
      const updatedLayout = {
        ...layout,
        widgets: layout.widgets.map(widget =>
          widget.id === widgetId
            ? { ...widget, position: { ...widget.position, x: gridX, y: gridY } }
            : widget
        )
      };
      
      onLayoutChange(updatedLayout);
      
      addAnimation(`widget-drop-${widgetId}`, {
        type: 'bounceIn',
        duration: 'normal',
        easing: 'bounce'
      });
    }
    
    setDraggedWidget(null);
    setDropZone(null);
  };

  const handleWidgetUpdate = (updatedWidget: Widget) => {
    const updatedLayout = {
      ...layout,
      widgets: layout.widgets.map(widget =>
        widget.id === updatedWidget.id ? updatedWidget : widget
      )
    };
    onLayoutChange(updatedLayout);
  };

  const handleWidgetDelete = (widgetId: string) => {
    const updatedLayout = {
      ...layout,
      widgets: layout.widgets.filter(widget => widget.id !== widgetId)
    };
    onLayoutChange(updatedLayout);
  };

  const getGridStyle = () => {
    return {
      display: 'grid',
      gridTemplateColumns: `repeat(${layout.columns}, 1fr)`,
      gridTemplateRows: `repeat(${layout.rows}, 1fr)`,
      gap: `${layout.gap}px`,
      padding: `${layout.padding}px`,
      minHeight: '600px'
    };
  };

  return (
    <div className={`relative ${className}`}>
      {/* Dashboard Grid */}
      <div
        ref={dashboardRef}
        className="relative bg-gray-50 dark:bg-gray-900 rounded-xl border-2 border-dashed border-gray-300 dark:border-gray-600"
        style={getGridStyle()}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
      >
        {/* Grid Lines (when editing) */}
        {isEditing && (
          <div className="absolute inset-0 pointer-events-none">
            {Array.from({ length: layout.columns - 1 }, (_, i) => (
              <div
                key={`v-${i}`}
                className="absolute top-0 bottom-0 w-px bg-gray-300 dark:bg-gray-600"
                style={{ left: `${((i + 1) * 100) / layout.columns}%` }}
              />
            ))}
            {Array.from({ length: layout.rows - 1 }, (_, i) => (
              <div
                key={`h-${i}`}
                className="absolute left-0 right-0 h-px bg-gray-300 dark:bg-gray-600"
                style={{ top: `${((i + 1) * 100) / layout.rows}%` }}
              />
            ))}
          </div>
        )}

        {/* Drop Zone Indicator */}
        {dropZone && draggedWidget && (
          <div
            className="absolute bg-primary-500/20 border-2 border-primary-500 rounded-lg pointer-events-none"
            style={{
              left: `${Math.floor(dropZone.x / 64) * 64}px`,
              top: `${Math.floor(dropZone.y / 64) * 64}px`,
              width: '64px',
              height: '64px'
            }}
          />
        )}

        {/* Widgets */}
        {layout.widgets.map(widget => (
          <WidgetComponent
            key={widget.id}
            widget={widget}
            isEditing={isEditing}
            onUpdate={handleWidgetUpdate}
            onDelete={handleWidgetDelete}
          />
        ))}
      </div>
    </div>
  );
};

// Widget Library Component
interface WidgetLibraryProps {
  onAddWidget: (widget: Omit<Widget, 'id' | 'position'>) => void;
  className?: string;
}

export const WidgetLibrary: React.FC<WidgetLibraryProps> = ({
  onAddWidget,
  className = ''
}) => {
  const { addAnimation } = useAnimation();

  const widgetTemplates = [
    { type: 'chart' as WidgetType, title: 'Grafik', icon: BarChart3, color: 'text-primary-500' },
    { type: 'stat' as WidgetType, title: 'İstatistik', icon: TrendingUp, color: 'text-success-500' },
    { type: 'table' as WidgetType, title: 'Tablo', icon: FileText, color: 'text-blue-500' },
    { type: 'list' as WidgetType, title: 'Liste', icon: MessageSquare, color: 'text-purple-500' },
    { type: 'calendar' as WidgetType, title: 'Takvim', icon: Calendar, color: 'text-orange-500' },
    { type: 'clock' as WidgetType, title: 'Saat', icon: Clock, color: 'text-gray-500' },
    { type: 'weather' as WidgetType, title: 'Hava Durumu', icon: Star, color: 'text-yellow-500' },
    { type: 'news' as WidgetType, title: 'Haberler', icon: FileText, color: 'text-red-500' },
    { type: 'social' as WidgetType, title: 'Sosyal', icon: Users, color: 'text-pink-500' },
    { type: 'media' as WidgetType, title: 'Medya', icon: Image, color: 'text-green-500' },
    { type: 'text' as WidgetType, title: 'Metin', icon: FileText, color: 'text-gray-500' },
    { type: 'image' as WidgetType, title: 'Resim', icon: Image, color: 'text-blue-500' },
    { type: 'video' as WidgetType, title: 'Video', icon: Video, color: 'text-red-500' },
    { type: 'audio' as WidgetType, title: 'Ses', icon: Music, color: 'text-purple-500' },
    { type: 'form' as WidgetType, title: 'Form', icon: FileText, color: 'text-indigo-500' },
    { type: 'button' as WidgetType, title: 'Buton', icon: ThumbsUp, color: 'text-green-500' },
    { type: 'link' as WidgetType, title: 'Bağlantı', icon: Download, color: 'text-blue-500' },
    { type: 'iframe' as WidgetType, title: 'Iframe', icon: FileText, color: 'text-gray-500' },
    { type: 'custom' as WidgetType, title: 'Özel', icon: Settings, color: 'text-gray-500' }
  ];

  const handleAddWidget = (template: typeof widgetTemplates[0]) => {
    const newWidget: Omit<Widget, 'id' | 'position'> = {
      type: template.type,
      title: template.title,
      size: 'medium',
      visible: true,
      locked: false
    };
    
    onAddWidget(newWidget);
    
    addAnimation('widget-add', {
      type: 'bounceIn',
      duration: 'normal',
      easing: 'bounce'
    });
  };

  return (
    <div className={`bg-white dark:bg-gray-800 rounded-xl shadow-soft border border-gray-200 dark:border-gray-700 p-6 ${className}`}>
      <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
        Widget Kütüphanesi
      </h3>
      
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {widgetTemplates.map((template) => (
          <TouchFeedback key={template.type} feedback="scale">
            <button
              onClick={() => handleAddWidget(template)}
              className="flex flex-col items-center p-4 border border-gray-200 dark:border-gray-600 rounded-lg hover:border-primary-500 hover:bg-primary-50 dark:hover:bg-primary-900/20 transition-all duration-200"
            >
              <template.icon className={`w-8 h-8 ${template.color} mb-2`} />
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                {template.title}
              </span>
            </button>
          </TouchFeedback>
        ))}
      </div>
    </div>
  );
};

// Dashboard Manager Component
interface DashboardManagerProps {
  layouts: DashboardLayout[];
  currentLayout: DashboardLayout;
  onLayoutChange: (layout: DashboardLayout) => void;
  onLayoutSave: (layout: DashboardLayout) => void;
  onLayoutDelete: (layoutId: string) => void;
  className?: string;
}

export const DashboardManager: React.FC<DashboardManagerProps> = ({
  currentLayout,
  onLayoutChange,
  onLayoutSave,
  className = ''
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [showWidgetLibrary, setShowWidgetLibrary] = useState(false);
  const [showColumnManager, setShowColumnManager] = useState(false);
  const { addAnimation } = useAnimation();

  const handleAddWidget = (widgetTemplate: Omit<Widget, 'id' | 'position'>) => {
    const newWidget: Widget = {
      ...widgetTemplate,
      id: `widget-${Date.now()}`,
      position: { x: 0, y: 0, w: 2, h: 2 }
    };
    
    const updatedLayout = {
      ...currentLayout,
      widgets: [...currentLayout.widgets, newWidget]
    };
    
    onLayoutChange(updatedLayout);
    setShowWidgetLibrary(false);
  };

  const handleViewChange = (viewType: ViewType) => {
    const updatedLayout = {
      ...currentLayout,
      viewType
    };
    onLayoutChange(updatedLayout);
  };

  const handleColumnsChange = (columns: Column[]) => {
    const updatedLayout = {
      ...currentLayout,
      kanbanColumns: columns
    };
    onLayoutChange(updatedLayout);
  };

  const handleWidgetUpdate = (updatedWidget: Widget) => {
    const updatedLayout = {
      ...currentLayout,
      widgets: currentLayout.widgets.map(widget =>
        widget.id === updatedWidget.id ? updatedWidget : widget
      )
    };
    onLayoutChange(updatedLayout);
  };

  const handleWidgetDelete = (widgetId: string) => {
    const updatedLayout = {
      ...currentLayout,
      widgets: currentLayout.widgets.filter(widget => widget.id !== widgetId),
      kanbanColumns: currentLayout.kanbanColumns.map(column => ({
        ...column,
        widgetIds: column.widgetIds.filter(id => id !== widgetId)
      }))
    };
    onLayoutChange(updatedLayout);
  };

  const handleSaveLayout = () => {
    onLayoutSave(currentLayout);
    setIsEditing(false);
    
    addAnimation('layout-save', {
      type: 'success',
      duration: 'normal',
      easing: 'ease-out'
    });
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Dashboard Controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            {currentLayout.name}
          </h2>
          {currentLayout.description && (
            <p className="text-gray-500 dark:text-gray-400">
              {currentLayout.description}
            </p>
          )}
        </div>
        
        <div className="flex items-center gap-2">
          {/* View Switcher */}
          <ViewSwitcher
            currentView={currentLayout.viewType || 'grid'}
            onViewChange={handleViewChange}
          />
          
          {isEditing && (
            <>
              {currentLayout.viewType === 'kanban' && (
                <TouchFeedback feedback="scale">
                  <button
                    onClick={() => setShowColumnManager(!showColumnManager)}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    <Columns className="w-4 h-4" />
                    Sütun Yönetimi
                  </button>
                </TouchFeedback>
              )}
              
              <TouchFeedback feedback="scale">
                <button
                  onClick={() => setShowWidgetLibrary(!showWidgetLibrary)}
                  className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  Widget Ekle
                </button>
              </TouchFeedback>
              
              <TouchFeedback feedback="scale">
                <button
                  onClick={handleSaveLayout}
                  className="px-4 py-2 bg-success-600 text-white rounded-lg hover:bg-success-700 transition-colors"
                >
                  Kaydet
                </button>
              </TouchFeedback>
            </>
          )}
          
          <TouchFeedback feedback="scale">
            <button
              onClick={() => setIsEditing(!isEditing)}
              className={`px-4 py-2 rounded-lg transition-colors ${
                isEditing
                  ? 'bg-gray-600 text-white hover:bg-gray-700'
                  : 'bg-primary-600 text-white hover:bg-primary-700'
              }`}
            >
              {isEditing ? 'Düzenleme Modunu Kapat' : 'Düzenle'}
            </button>
          </TouchFeedback>
        </div>
      </div>

      {/* Column Manager */}
      {showColumnManager && currentLayout.viewType === 'kanban' && (
        <ColumnManager
          columns={currentLayout.kanbanColumns || []}
          onColumnsChange={handleColumnsChange}
          isEditing={isEditing}
        />
      )}

      {/* Widget Library */}
      {showWidgetLibrary && (
        <WidgetLibrary onAddWidget={handleAddWidget} />
      )}

      {/* Dashboard Content */}
      {currentLayout.viewType === 'grid' && (
        <DashboardBuilder
          layout={currentLayout}
          onLayoutChange={onLayoutChange}
          isEditing={isEditing}
        />
      )}
      
      {currentLayout.viewType === 'list' && (
        <ListView
          widgets={currentLayout.widgets}
          isEditing={isEditing}
          onWidgetUpdate={handleWidgetUpdate}
          onWidgetDelete={handleWidgetDelete}
        />
      )}
      
      {currentLayout.viewType === 'kanban' && (
        <KanbanView
          widgets={currentLayout.widgets}
          columns={currentLayout.kanbanColumns || []}
          isEditing={isEditing}
          onWidgetUpdate={handleWidgetUpdate}
          onWidgetDelete={handleWidgetDelete}
          onColumnsChange={handleColumnsChange}
        />
      )}
    </div>
  );
};

// View Switcher Component
interface ViewSwitcherProps {
  currentView: ViewType;
  onViewChange: (view: ViewType) => void;
  className?: string;
}

export const ViewSwitcher: React.FC<ViewSwitcherProps> = ({
  currentView,
  onViewChange,
  className = ''
}) => {
  const views = [
    { type: 'grid' as ViewType, label: 'Grid', icon: BarChart3 },
    { type: 'list' as ViewType, label: 'Liste', icon: List },
    { type: 'kanban' as ViewType, label: 'Kanban', icon: Kanban }
  ];

  return (
    <div className={`flex items-center gap-1 bg-gray-100 dark:bg-gray-800 rounded-lg p-1 ${className}`}>
      {views.map((view) => (
        <TouchFeedback key={view.type} feedback="scale">
          <button
            onClick={() => onViewChange(view.type)}
            className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
              currentView === view.type
                ? 'bg-white dark:bg-gray-700 text-primary-600 dark:text-primary-400 shadow-sm'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
            }`}
          >
            <view.icon className="w-4 h-4" />
            {view.label}
          </button>
        </TouchFeedback>
      ))}
    </div>
  );
};

// Column Manager Component
interface ColumnManagerProps {
  columns: Column[];
  onColumnsChange: (columns: Column[]) => void;
  isEditing?: boolean;
  className?: string;
}

export const ColumnManager: React.FC<ColumnManagerProps> = ({
  columns,
  onColumnsChange,
  isEditing = false,
  className = ''
}) => {
  const [editingColumn, setEditingColumn] = useState<string | null>(null);
  const [newColumnTitle, setNewColumnTitle] = useState('');
  const { addAnimation } = useAnimation();

  const handleAddColumn = () => {
    const newColumn: Column = {
      id: `column-${Date.now()}`,
      title: newColumnTitle || 'Yeni Sütun',
      color: `hsl(${Math.random() * 360}, 70%, 50%)`,
      order: columns.length,
      widgetIds: []
    };
    
    onColumnsChange([...columns, newColumn]);
    setNewColumnTitle('');
    
    addAnimation('column-add', {
      type: 'slideInUp',
      duration: 'normal',
      easing: 'ease-out'
    });
  };

  const handleDeleteColumn = (columnId: string) => {
    onColumnsChange(columns.filter(col => col.id !== columnId));
    
    addAnimation(`column-delete-${columnId}`, {
      type: 'scaleOut',
      duration: 'fast',
      easing: 'ease-in'
    });
  };

  const handleUpdateColumn = (columnId: string, updates: Partial<Column>) => {
    onColumnsChange(columns.map(col => 
      col.id === columnId ? { ...col, ...updates } : col
    ));
    setEditingColumn(null);
  };


  if (!isEditing) return null;

  return (
    <div className={`bg-white dark:bg-gray-800 rounded-xl shadow-soft border border-gray-200 dark:border-gray-700 p-6 ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
          Sütun Yönetimi
        </h3>
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={newColumnTitle}
            onChange={(e) => setNewColumnTitle(e.target.value)}
            placeholder="Sütun adı..."
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-sm"
          />
          <TouchFeedback feedback="scale">
            <button
              onClick={handleAddColumn}
              className="flex items-center gap-2 px-3 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors text-sm"
            >
              <Plus className="w-4 h-4" />
              Ekle
            </button>
          </TouchFeedback>
        </div>
      </div>

      <div className="space-y-3">
        {columns
          .sort((a, b) => a.order - b.order)
          .map((column) => (
            <div
              key={column.id}
              className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg"
            >
              <GripVertical className="w-4 h-4 text-gray-400 cursor-move" />
              
              <div
                className="w-4 h-4 rounded-full"
                style={{ backgroundColor: column.color }}
              />
              
              {editingColumn === column.id ? (
                <input
                  type="text"
                  defaultValue={column.title}
                  onBlur={(e) => handleUpdateColumn(column.id, { title: e.target.value })}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      handleUpdateColumn(column.id, { title: e.currentTarget.value });
                    }
                  }}
                  className="flex-1 px-2 py-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 text-sm"
                  autoFocus
                />
              ) : (
                <span
                  className="flex-1 text-gray-900 dark:text-gray-100 font-medium cursor-pointer"
                  onClick={() => setEditingColumn(column.id)}
                >
                  {column.title}
                </span>
              )}
              
              <span className="text-sm text-gray-500 dark:text-gray-400">
                {column.widgetIds.length} widget
              </span>
              
              <div className="flex items-center gap-1">
                <TouchFeedback feedback="scale">
                  <button
                    onClick={() => setEditingColumn(column.id)}
                    className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                    title="Düzenle"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>
                </TouchFeedback>
                
                <TouchFeedback feedback="scale">
                  <button
                    onClick={() => handleDeleteColumn(column.id)}
                    className="p-1 text-gray-400 hover:text-red-500"
                    title="Sil"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </TouchFeedback>
              </div>
            </div>
          ))}
      </div>
    </div>
  );
};

// List View Component
interface ListViewProps {
  widgets: Widget[];
  isEditing?: boolean;
  onWidgetUpdate?: (widget: Widget) => void;
  onWidgetDelete?: (widgetId: string) => void;
  className?: string;
}

export const ListView: React.FC<ListViewProps> = ({
  widgets,
  isEditing = false,
  onWidgetUpdate,
  onWidgetDelete,
  className = ''
}) => {
  const getWidgetIcon = (type: WidgetType) => {
    switch (type) {
      case 'chart': return <BarChart3 className="w-5 h-5 text-primary-500" />;
      case 'stat': return <TrendingUp className="w-5 h-5 text-success-500" />;
      case 'table': return <FileText className="w-5 h-5 text-blue-500" />;
      case 'list': return <MessageSquare className="w-5 h-5 text-purple-500" />;
      case 'calendar': return <Calendar className="w-5 h-5 text-orange-500" />;
      case 'clock': return <Clock className="w-5 h-5 text-gray-500" />;
      case 'weather': return <Star className="w-5 h-5 text-yellow-500" />;
      case 'news': return <FileText className="w-5 h-5 text-red-500" />;
      case 'social': return <Users className="w-5 h-5 text-pink-500" />;
      case 'media': return <Image className="w-5 h-5 text-green-500" />;
      case 'text': return <FileText className="w-5 h-5 text-gray-500" />;
      case 'image': return <Image className="w-5 h-5 text-blue-500" />;
      case 'video': return <Video className="w-5 h-5 text-red-500" />;
      case 'audio': return <Music className="w-5 h-5 text-purple-500" />;
      case 'form': return <FileText className="w-5 h-5 text-indigo-500" />;
      case 'button': return <ThumbsUp className="w-5 h-5 text-green-500" />;
      case 'link': return <Download className="w-5 h-5 text-blue-500" />;
      case 'iframe': return <FileText className="w-5 h-5 text-gray-500" />;
      case 'custom': return <Settings className="w-5 h-5 text-gray-500" />;
      default: return <Settings className="w-5 h-5 text-gray-500" />;
    }
  };

  const getSizeLabel = (size: WidgetSize) => {
    switch (size) {
      case 'small': return 'Küçük';
      case 'medium': return 'Orta';
      case 'large': return 'Büyük';
      case 'xlarge': return 'Çok Büyük';
      default: return 'Orta';
    }
  };

  return (
    <div className={`bg-white dark:bg-gray-800 rounded-xl shadow-soft border border-gray-200 dark:border-gray-700 ${className}`}>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 dark:bg-gray-700">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Widget
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Tip
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Boyut
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Durum
              </th>
              {isEditing && (
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  İşlemler
                </th>
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
            {widgets.map((widget) => (
              <tr key={widget.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center gap-3">
                    {getWidgetIcon(widget.type)}
                    <div>
                      <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                        {widget.title}
                      </div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        ID: {widget.id}
                      </div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-600 dark:text-gray-200">
                    {widget.type}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                  {getSizeLabel(widget.size)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center gap-2">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      widget.visible 
                        ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' 
                        : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                    }`}>
                      {widget.visible ? 'Görünür' : 'Gizli'}
                    </span>
                    {widget.locked && (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">
                        Kilitli
                      </span>
                    )}
                  </div>
                </td>
                {isEditing && (
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex items-center gap-2">
                      <TouchFeedback feedback="scale">
                        <button
                          onClick={() => onWidgetUpdate?.({ ...widget, visible: !widget.visible })}
                          className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                          title={widget.visible ? 'Gizle' : 'Göster'}
                        >
                          {widget.visible ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                        </button>
                      </TouchFeedback>
                      
                      <TouchFeedback feedback="scale">
                        <button
                          onClick={() => onWidgetUpdate?.({ ...widget, locked: !widget.locked })}
                          className={`${widget.locked ? 'text-yellow-500' : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'}`}
                          title={widget.locked ? 'Kilidi Aç' : 'Kilitle'}
                        >
                          <Settings className="w-4 h-4" />
                        </button>
                      </TouchFeedback>
                      
                      <TouchFeedback feedback="scale">
                        <button
                          onClick={() => onWidgetDelete?.(widget.id)}
                          className="text-gray-400 hover:text-red-500"
                          title="Sil"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </TouchFeedback>
                    </div>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// Kanban View Component
interface KanbanViewProps {
  widgets: Widget[];
  columns: Column[];
  isEditing?: boolean;
  onWidgetUpdate?: (widget: Widget) => void;
  onWidgetDelete?: (widgetId: string) => void;
  onColumnsChange?: (columns: Column[]) => void;
  className?: string;
}

export const KanbanView: React.FC<KanbanViewProps> = ({
  widgets,
  columns,
  isEditing = false,
  onWidgetUpdate,
  onWidgetDelete,
  onColumnsChange,
  className = ''
}) => {
  const [draggedWidget, setDraggedWidget] = useState<string | null>(null);
  const { addAnimation } = useAnimation();

  const handleDragStart = (e: DragEvent, widgetId: string) => {
    setDraggedWidget(widgetId);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', widgetId);
  };

  const handleDragOver = (e: DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e: DragEvent, targetColumnId: string) => {
    e.preventDefault();
    const widgetId = e.dataTransfer.getData('text/plain');
    
    if (widgetId && onColumnsChange) {
      const updatedColumns = columns.map(column => {
        if (column.id === targetColumnId) {
          // Remove widget from other columns
          const otherColumns = columns.filter(col => col.id !== targetColumnId);
          otherColumns.forEach(col => {
            col.widgetIds = col.widgetIds.filter(id => id !== widgetId);
          });
          
          // Add widget to target column if not already there
          if (!column.widgetIds.includes(widgetId)) {
            return { ...column, widgetIds: [...column.widgetIds, widgetId] };
          }
        }
        return column;
      });
      
      onColumnsChange(updatedColumns);
      
      addAnimation(`widget-move-${widgetId}`, {
        type: 'bounceIn',
        duration: 'normal',
        easing: 'bounce'
      });
    }
    
    setDraggedWidget(null);
  };

  const getWidgetById = (widgetId: string) => {
    return widgets.find(widget => widget.id === widgetId);
  };

  const getWidgetIcon = (type: WidgetType) => {
    switch (type) {
      case 'chart': return <BarChart3 className="w-4 h-4 text-primary-500" />;
      case 'stat': return <TrendingUp className="w-4 h-4 text-success-500" />;
      case 'table': return <FileText className="w-4 h-4 text-blue-500" />;
      case 'list': return <MessageSquare className="w-4 h-4 text-purple-500" />;
      case 'calendar': return <Calendar className="w-4 h-4 text-orange-500" />;
      case 'clock': return <Clock className="w-4 h-4 text-gray-500" />;
      case 'weather': return <Star className="w-4 h-4 text-yellow-500" />;
      case 'news': return <FileText className="w-4 h-4 text-red-500" />;
      case 'social': return <Users className="w-4 h-4 text-pink-500" />;
      case 'media': return <Image className="w-4 h-4 text-green-500" />;
      case 'text': return <FileText className="w-4 h-4 text-gray-500" />;
      case 'image': return <Image className="w-4 h-4 text-blue-500" />;
      case 'video': return <Video className="w-4 h-4 text-red-500" />;
      case 'audio': return <Music className="w-4 h-4 text-purple-500" />;
      case 'form': return <FileText className="w-4 h-4 text-indigo-500" />;
      case 'button': return <ThumbsUp className="w-4 h-4 text-green-500" />;
      case 'link': return <Download className="w-4 h-4 text-blue-500" />;
      case 'iframe': return <FileText className="w-4 h-4 text-gray-500" />;
      case 'custom': return <Settings className="w-4 h-4 text-gray-500" />;
      default: return <Settings className="w-4 h-4 text-gray-500" />;
    }
  };

  return (
    <div className={`space-y-6 ${className}`}>
      <div className="flex gap-6 overflow-x-auto pb-4">
        {columns
          .sort((a, b) => a.order - b.order)
          .map((column) => (
            <div
              key={column.id}
              className="flex-shrink-0 w-80"
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, column.id)}
            >
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-soft border border-gray-200 dark:border-gray-700">
                {/* Column Header */}
                <div 
                  className="p-4 border-b border-gray-200 dark:border-gray-700 rounded-t-xl"
                  style={{ backgroundColor: `${column.color}20` }}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: column.color }}
                      />
                      <h3 className="font-semibold text-gray-900 dark:text-gray-100">
                        {column.title}
                      </h3>
                    </div>
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                      {column.widgetIds.length}
                    </span>
                  </div>
                </div>

                {/* Column Content */}
                <div className="p-4 space-y-3 min-h-96">
                  {column.widgetIds.map((widgetId) => {
                    const widget = getWidgetById(widgetId);
                    if (!widget) return null;

                    return (
                      <div
                        key={widget.id}
                        draggable={isEditing}
                        onDragStart={(e) => handleDragStart(e, widget.id)}
                        className={`p-3 bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600 cursor-move hover:shadow-sm transition-all duration-200 ${
                          draggedWidget === widget.id ? 'opacity-50' : ''
                        } ${!widget.visible ? 'opacity-50' : ''}`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-2 flex-1">
                            {getWidgetIcon(widget.type)}
                            <div className="flex-1 min-w-0">
                              <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                                {widget.title}
                              </h4>
                              <p className="text-xs text-gray-500 dark:text-gray-400">
                                {widget.type}
                              </p>
                            </div>
                          </div>
                          
                          {isEditing && (
                            <div className="flex items-center gap-1">
                              <TouchFeedback feedback="scale">
                                <button
                                  onClick={() => onWidgetUpdate?.({ ...widget, visible: !widget.visible })}
                                  className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                                  title={widget.visible ? 'Gizle' : 'Göster'}
                                >
                                  {widget.visible ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                                </button>
                              </TouchFeedback>
                              
                              <TouchFeedback feedback="scale">
                                <button
                                  onClick={() => onWidgetDelete?.(widget.id)}
                                  className="p-1 text-gray-400 hover:text-red-500"
                                  title="Sil"
                                >
                                  <Trash2 className="w-3 h-3" />
                                </button>
                              </TouchFeedback>
                            </div>
                          )}
                        </div>
                        
                        {widget.locked && (
                          <div className="mt-2 flex items-center gap-1 text-xs text-yellow-600 dark:text-yellow-400">
                            <Settings className="w-3 h-3" />
                            Kilitli
                          </div>
                        )}
                      </div>
                    );
                  })}
                  
                  {column.widgetIds.length === 0 && (
                    <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                      <div className="text-sm">Bu sütunda widget yok</div>
                      {isEditing && (
                        <div className="text-xs mt-1">Widget'ları buraya sürükleyin</div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
      </div>
    </div>
  );
};

export default DashboardBuilder;
