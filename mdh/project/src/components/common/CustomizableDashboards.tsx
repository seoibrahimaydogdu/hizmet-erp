import React, { useState, useEffect, useRef, ReactNode, DragEvent } from 'react';
import { useUIUX } from '../../contexts/UIUXContext';
import { useAnimation } from './AnimationSystem';
import { TouchFeedback } from './TouchInteractions';
import { 
  GripVertical, Settings, Eye, EyeOff, Plus, X, 
  BarChart3, PieChart, TrendingUp, Users, DollarSign,
  Calendar, Clock, Star, Heart, ThumbsUp, MessageSquare,
  FileText, Image, Video, Music, Download, Upload
} from 'lucide-react';

// Widget Types
export type WidgetType = 
  | 'chart' | 'stat' | 'table' | 'list' | 'calendar' | 'clock' | 'weather'
  | 'news' | 'social' | 'media' | 'text' | 'image' | 'video' | 'audio'
  | 'form' | 'button' | 'link' | 'iframe' | 'custom';

export type WidgetSize = 'small' | 'medium' | 'large' | 'xlarge';

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
}

// Widget Component Props
interface WidgetComponentProps {
  widget: Widget;
  isEditing?: boolean;
  onUpdate?: (widget: Widget) => void;
  onDelete?: (widgetId: string) => void;
  onMove?: (widgetId: string, position: WidgetPosition) => void;
  onResize?: (widgetId: string, size: WidgetSize) => void;
}

// Base Widget Component
export const WidgetComponent: React.FC<WidgetComponentProps> = ({
  widget,
  isEditing = false,
  onUpdate,
  onDelete,
  onMove,
  onResize
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const { addAnimation } = useAnimation();
  const widgetRef = useRef<HTMLDivElement>(null);

  const getSizeClasses = () => {
    switch (widget.size) {
      case 'small': return 'w-48 h-32';
      case 'medium': return 'w-64 h-48';
      case 'large': return 'w-80 h-64';
      case 'xlarge': return 'w-96 h-80';
      default: return 'w-64 h-48';
    }
  };

  const handleDragStart = (e: DragEvent) => {
    if (!isEditing || widget.locked) return;
    
    setIsDragging(true);
    setDragStart({ x: e.clientX, y: e.clientY });
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
        {widgetTemplates.map((template, index) => (
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
  layouts,
  currentLayout,
  onLayoutChange,
  onLayoutSave,
  onLayoutDelete,
  className = ''
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [showWidgetLibrary, setShowWidgetLibrary] = useState(false);
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
          {isEditing && (
            <>
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

      {/* Widget Library */}
      {showWidgetLibrary && (
        <WidgetLibrary onAddWidget={handleAddWidget} />
      )}

      {/* Dashboard Builder */}
      <DashboardBuilder
        layout={currentLayout}
        onLayoutChange={onLayoutChange}
        isEditing={isEditing}
      />
    </div>
  );
};

export default DashboardBuilder;
