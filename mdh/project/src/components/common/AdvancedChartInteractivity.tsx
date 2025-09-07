import React, { useState, useRef, useEffect, useCallback } from 'react';
import { 
  Plus, 
  Edit3, 
  Trash2, 
  ZoomIn, 
  ZoomOut, 
  RotateCcw, 
  Download, 
  Share2,
  Eye,
  EyeOff,
  ChevronDown,
  ChevronUp,
  BarChart3,
  TrendingUp,
  PieChart,
  Activity,
  Move
} from 'lucide-react';
import { toast } from 'react-hot-toast';

// Annotation Types
export interface ChartAnnotation {
  id: string;
  type: 'note' | 'arrow' | 'highlight' | 'line';
  x: number;
  y: number;
  text?: string;
  color: string;
  size: 'small' | 'medium' | 'large';
  visible: boolean;
  createdAt: Date;
  createdBy: string;
}

// Data Point Interface
export interface DataPoint {
  id: string;
  x: number | string;
  y: number;
  label?: string;
  metadata?: any;
  editable?: boolean;
}

// Chart Comparison Interface
export interface ChartComparison {
  id: string;
  title: string;
  data: any[];
  type: 'line' | 'bar' | 'pie' | 'area';
  color: string;
  visible: boolean;
}

// Advanced Chart Interactivity Component
interface AdvancedChartInteractivityProps {
  children: React.ReactNode;
  data: DataPoint[];
  onDataUpdate?: (updatedData: DataPoint[]) => void;
  onAnnotationAdd?: (annotation: ChartAnnotation) => void;
  onAnnotationUpdate?: (annotation: ChartAnnotation) => void;
  onAnnotationDelete?: (annotationId: string) => void;
  enableAnnotations?: boolean;
  enableDataEditing?: boolean;
  enableDrillDown?: boolean;
  enableComparison?: boolean;
  className?: string;
  drillDownLevel?: number;
  onDrillDown?: (path: string) => void;
  onDrillUp?: () => void;
}

export const AdvancedChartInteractivity: React.FC<AdvancedChartInteractivityProps> = ({
  children,
  data,
  onDataUpdate,
  onAnnotationAdd,
  onAnnotationUpdate,
  onAnnotationDelete,
  enableAnnotations = true,
  enableDataEditing = true,
  enableDrillDown = true,
  enableComparison = true,
  className = '',
  drillDownLevel: externalDrillDownLevel = 0,
  onDrillDown,
  onDrillUp
}) => {
  const [annotations, setAnnotations] = useState<ChartAnnotation[]>([]);
  const [isAddingAnnotation, setIsAddingAnnotation] = useState(false);
  const [isReadyToAddAnnotation, setIsReadyToAddAnnotation] = useState(false);
  const [annotationType, setAnnotationType] = useState<ChartAnnotation['type']>('note');
  const [annotationText, setAnnotationText] = useState('');
  const [annotationColor, setAnnotationColor] = useState('#3b82f6');
  const [editingDataPoint, setEditingDataPoint] = useState<DataPoint | null>(null);
  const [internalDrillDownLevel, setInternalDrillDownLevel] = useState(0);
  const [drillDownPath, setDrillDownPath] = useState<string[]>([]);
  const [draggedAnnotation, setDraggedAnnotation] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [comparisonCharts, setComparisonCharts] = useState<ChartComparison[]>([]);
  const [showComparison, setShowComparison] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  const chartRef = useRef<HTMLDivElement>(null);
  const annotationInputRef = useRef<HTMLInputElement>(null);

  // Annotation Management
  const addAnnotation = useCallback((x: number, y: number) => {
    if (!isAddingAnnotation) return;

    const newAnnotation: ChartAnnotation = {
      id: `annotation-${Date.now()}`,
      type: annotationType,
      x,
      y,
      text: annotationText,
      color: annotationColor,
      size: 'medium',
      visible: true,
      createdAt: new Date(),
      createdBy: 'current-user'
    };

    setAnnotations(prev => [...prev, newAnnotation]);
    onAnnotationAdd?.(newAnnotation);
    setIsAddingAnnotation(false);
    setAnnotationText('');
    toast.success('Not eklendi');
  }, [isAddingAnnotation, annotationType, annotationText, annotationColor, onAnnotationAdd]);

  const updateAnnotation = useCallback((annotation: ChartAnnotation) => {
    setAnnotations(prev => prev.map(a => a.id === annotation.id ? annotation : a));
    onAnnotationUpdate?.(annotation);
  }, [onAnnotationUpdate]);

  const deleteAnnotation = useCallback((annotationId: string) => {
    setAnnotations(prev => prev.filter(a => a.id !== annotationId));
    onAnnotationDelete?.(annotationId);
    toast.success('Not silindi');
  }, [onAnnotationDelete]);

  // Drag and Drop Functions
  const handleAnnotationDragStart = useCallback((e: React.MouseEvent, annotationId: string) => {
    e.preventDefault();
    setDraggedAnnotation(annotationId);
    setIsDragging(true);
    
    const rect = (e.target as HTMLElement).getBoundingClientRect();
    setDragOffset({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    });
  }, []);

  const handleAnnotationDragMove = useCallback((e: React.MouseEvent) => {
    if (!draggedAnnotation) return;
    
    const container = chartRef.current;
    if (!container) return;
    
    const containerRect = container.getBoundingClientRect();
    const newX = e.clientX - containerRect.left - dragOffset.x;
    const newY = e.clientY - containerRect.top - dragOffset.y;
    
    // Container sınırları içinde tut
    const boundedX = Math.max(0, Math.min(newX, containerRect.width - 50));
    const boundedY = Math.max(0, Math.min(newY, containerRect.height - 50));
    
    setAnnotations(prev => prev.map(annotation => 
      annotation.id === draggedAnnotation 
        ? { ...annotation, x: boundedX, y: boundedY }
        : annotation
    ));
  }, [draggedAnnotation, dragOffset]);

  const handleAnnotationDragEnd = useCallback(() => {
    if (draggedAnnotation) {
      const updatedAnnotation = annotations.find(a => a.id === draggedAnnotation);
      if (updatedAnnotation) {
        onAnnotationUpdate?.(updatedAnnotation);
        toast.success('Not taşındı');
      }
    }
    setDraggedAnnotation(null);
    setIsDragging(false);
    setDragOffset({ x: 0, y: 0 });
  }, [draggedAnnotation, annotations, onAnnotationUpdate]);

  // Data Point Editing
  const editDataPoint = useCallback((dataPoint: DataPoint) => {
    if (!enableDataEditing || !dataPoint.editable) return;
    setEditingDataPoint(dataPoint);
  }, [enableDataEditing]);

  const saveDataPoint = useCallback((updatedPoint: DataPoint) => {
    const updatedData = data.map(point => 
      point.id === updatedPoint.id ? updatedPoint : point
    );
    onDataUpdate?.(updatedData);
    setEditingDataPoint(null);
    toast.success('Veri güncellendi');
  }, [data, onDataUpdate]);

  // Drill Down
  const drillDown = useCallback((path: string) => {
    if (onDrillDown) {
      onDrillDown(path);
    } else {
      setDrillDownPath(prev => [...prev, path]);
      setInternalDrillDownLevel(prev => prev + 1);
      toast.success(`Detay seviyesi: ${internalDrillDownLevel + 1}`);
    }
  }, [internalDrillDownLevel, onDrillDown]);

  const drillUp = useCallback(() => {
    if (onDrillUp) {
      onDrillUp();
    } else if (internalDrillDownLevel > 0) {
      setDrillDownPath(prev => prev.slice(0, -1));
      setInternalDrillDownLevel(prev => prev - 1);
      toast.success(`Detay seviyesi: ${internalDrillDownLevel - 1}`);
    }
  }, [internalDrillDownLevel, onDrillUp]);

  // Chart Comparison
  const addComparisonChart = useCallback((chart: ChartComparison) => {
    setComparisonCharts(prev => [...prev, chart]);
    toast.success('Karşılaştırma grafiği eklendi');
  }, []);

  const toggleComparisonChart = useCallback((chartId: string) => {
    setComparisonCharts(prev => prev.map(chart => 
      chart.id === chartId ? { ...chart, visible: !chart.visible } : chart
    ));
  }, []);

  // Zoom and Pan
  const handleZoomIn = useCallback(() => {
    setZoom(prev => Math.min(prev + 0.1, 3));
  }, []);

  const handleZoomOut = useCallback(() => {
    setZoom(prev => Math.max(prev - 0.1, 0.5));
  }, []);

  const handleResetZoom = useCallback(() => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  }, []);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      setIsDragging(true);
      setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
    }
  }, [pan]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (isDragging) {
      setPan({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y
      });
    }
  }, [isDragging, dragStart]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  // Chart Click Handler
  const handleChartClick = useCallback((e: React.MouseEvent) => {
    const rect = chartRef.current?.getBoundingClientRect();
    if (!rect) return;

    const x = (e.clientX - rect.left) / zoom;
    const y = (e.clientY - rect.top) / zoom;

    if (isReadyToAddAnnotation) {
      addAnnotation(x, y);
      setIsReadyToAddAnnotation(false);
      setIsAddingAnnotation(false);
      setAnnotationText('');
    }
  }, [isReadyToAddAnnotation, addAnnotation, zoom]);

  // Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey) {
        switch (e.key) {
          case '=':
          case '+':
            e.preventDefault();
            handleZoomIn();
            break;
          case '-':
            e.preventDefault();
            handleZoomOut();
            break;
          case '0':
            e.preventDefault();
            handleResetZoom();
            break;
          case 'a':
            e.preventDefault();
            setIsAddingAnnotation(true);
            break;
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleZoomIn, handleZoomOut, handleResetZoom]);

  // Mouse event listeners for drag and drop
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (draggedAnnotation) {
        handleAnnotationDragMove(e as any);
      }
    };

    const handleMouseUp = () => {
      if (draggedAnnotation) {
        handleAnnotationDragEnd();
      }
    };

    if (draggedAnnotation) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [draggedAnnotation, handleAnnotationDragMove, handleAnnotationDragEnd]);

  return (
    <div className={`relative ${className}`}>
      {/* Toolbar */}
      <div className="absolute top-4 left-4 z-10 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 p-2">
        <div className="flex items-center gap-2">
          {/* Zoom Controls */}
          <div className="flex items-center gap-1 border-r border-gray-200 dark:border-gray-600 pr-2">
            <button
              onClick={handleZoomOut}
              className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
              title="Yakınlaştır (Ctrl + -)"
            >
              <ZoomOut className="w-4 h-4" />
            </button>
            <span className="text-xs text-gray-600 dark:text-gray-400 min-w-[3rem] text-center">
              {Math.round(zoom * 100)}%
            </span>
            <button
              onClick={handleZoomIn}
              className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
              title="Uzaklaştır (Ctrl + +)"
            >
              <ZoomIn className="w-4 h-4" />
            </button>
            <button
              onClick={handleResetZoom}
              className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
              title="Sıfırla (Ctrl + 0)"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>

          {/* Annotation Controls */}
          {enableAnnotations && (
            <div className="flex items-center gap-1 border-r border-gray-200 dark:border-gray-600 pr-2">
              <button
                onClick={() => setIsAddingAnnotation(!isAddingAnnotation)}
                className={`p-1 rounded ${isAddingAnnotation ? 'bg-blue-100 text-blue-600' : 'hover:bg-gray-100 dark:hover:bg-gray-700'}`}
                title="Not Ekle (Ctrl + A)"
              >
                <Plus className="w-4 h-4" />
              </button>
              <select
                value={annotationType}
                onChange={(e) => setAnnotationType(e.target.value as ChartAnnotation['type'])}
                className="text-xs border border-gray-200 dark:border-gray-600 rounded px-1 py-0.5 bg-white dark:bg-gray-700"
              >
                <option value="note">Not</option>
                <option value="arrow">Ok</option>
                <option value="highlight">Vurgu</option>
                <option value="line">Çizgi</option>
              </select>
            </div>
          )}

          {/* Drill Down Controls */}
          {enableDrillDown && (
            <div className="flex items-center gap-1 border-r border-gray-200 dark:border-gray-600 pr-2">
              <button
                onClick={drillUp}
                disabled={onDrillUp ? externalDrillDownLevel === 0 : internalDrillDownLevel === 0}
                className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded disabled:opacity-50"
                title="Yukarı Git"
              >
                <ChevronUp className="w-4 h-4" />
              </button>
              <span className="text-xs text-gray-600 dark:text-gray-400">
                Seviye {onDrillUp ? externalDrillDownLevel + 1 : internalDrillDownLevel + 1}
              </span>
              <button
                onClick={() => drillDown('detail')}
                className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                title="Detaya İn"
              >
                <ChevronDown className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Comparison Controls */}
          {enableComparison && (
            <div className="flex items-center gap-1">
              <button
                onClick={() => setShowComparison(!showComparison)}
                className={`p-1 rounded ${showComparison ? 'bg-green-100 text-green-600' : 'hover:bg-gray-100 dark:hover:bg-gray-700'}`}
                title="Karşılaştırma"
              >
                <BarChart3 className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Chart Container */}
      <div
        ref={chartRef}
        className="relative overflow-hidden"
        style={{
          transform: `scale(${zoom}) translate(${pan.x / zoom}px, ${pan.y / zoom}px)`,
          transformOrigin: 'top left'
        }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onClick={handleChartClick}
      >
        {children}

        {/* Annotations Overlay */}
        {enableAnnotations && annotations.map(annotation => (
          <div
            key={annotation.id}
            className={`absolute cursor-pointer ${annotation.visible ? 'block' : 'hidden'}`}
            style={{
              left: annotation.x,
              top: annotation.y,
              zIndex: 10
            }}
            onClick={(e) => {
              e.stopPropagation();
            }}
          >
            {annotation.type === 'note' && (
              <div
                className={`relative p-3 rounded-lg shadow-md border cursor-move bg-white dark:bg-gray-800 ${annotation.size === 'small' ? 'text-xs' : annotation.size === 'large' ? 'text-base' : 'text-sm'} ${draggedAnnotation === annotation.id ? 'opacity-50' : ''}`}
                style={{ 
                  borderColor: annotation.color,
                  color: annotation.color
                }}
                onMouseDown={(e) => handleAnnotationDragStart(e, annotation.id)}
              >
                <div className="flex items-center gap-2">
                  <Move className="w-3 h-3 opacity-60" />
                  <span className="font-medium">{annotation.text || 'Not'}</span>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteAnnotation(annotation.id);
                  }}
                  className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center text-xs hover:bg-red-600 transition-colors shadow-sm"
                  title="Notu Sil"
                >
                  ×
                </button>
              </div>
            )}
            {annotation.type === 'arrow' && (
              <div className="relative">
                <div
                  className="w-0 h-0 shadow-sm"
                  style={{
                    borderLeft: `12px solid transparent`,
                    borderRight: `12px solid transparent`,
                    borderBottom: `24px solid ${annotation.color}`
                  }}
                />
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteAnnotation(annotation.id);
                  }}
                  className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center text-xs hover:bg-red-600 transition-colors shadow-sm"
                  title="Oku Sil"
                >
                  ×
                </button>
              </div>
            )}
            {annotation.type === 'highlight' && (
              <div className="relative">
                <div
                  className="w-6 h-6 rounded-full border-2 shadow-sm"
                  style={{
                    backgroundColor: annotation.color + '60',
                    borderColor: annotation.color
                  }}
                />
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteAnnotation(annotation.id);
                  }}
                  className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center text-xs hover:bg-red-600 transition-colors shadow-sm"
                  title="Vurguyu Sil"
                >
                  ×
                </button>
              </div>
            )}
            {annotation.type === 'line' && (
              <div className="relative">
                <div
                  className="w-12 h-1 rounded shadow-sm"
                  style={{ backgroundColor: annotation.color }}
                />
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteAnnotation(annotation.id);
                  }}
                  className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center text-xs hover:bg-red-600 transition-colors shadow-sm"
                  title="Çizgiyi Sil"
                >
                  ×
                </button>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Annotation Input */}
      {isAddingAnnotation && (
        <div className="absolute top-20 left-4 z-20 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 p-4 w-80">
          <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-3">
            Not Ekle
          </h4>
          <input
            ref={annotationInputRef}
            type="text"
            value={annotationText}
            onChange={(e) => setAnnotationText(e.target.value)}
            placeholder="Not metni girin..."
            className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-md text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white mb-3"
            autoFocus
          />
          <div className="flex items-center gap-2 mb-3">
            <span className="text-xs text-gray-600 dark:text-gray-400">Renk:</span>
            <input
              type="color"
              value={annotationColor}
              onChange={(e) => setAnnotationColor(e.target.value)}
              className="w-8 h-8 rounded border border-gray-200 dark:border-gray-600 cursor-pointer"
            />
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                if (annotationText.trim()) {
                  setIsReadyToAddAnnotation(true);
                  toast.success('Grafik üzerine tıklayarak notu ekleyin');
                } else {
                  toast.error('Lütfen not metni girin');
                }
              }}
              className="px-4 py-2 text-sm bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
            >
              Ekle
            </button>
            <button
              onClick={() => {
                setIsAddingAnnotation(false);
                setIsReadyToAddAnnotation(false);
                setAnnotationText('');
              }}
              className="px-4 py-2 text-sm bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
            >
              İptal
            </button>
          </div>
        </div>
      )}

      {/* Data Point Edit Modal */}
      {editingDataPoint && (
        <div className="absolute inset-0 z-30 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 w-96">
            <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
              Veri Noktasını Düzenle
            </h4>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  X Değeri
                </label>
                <input
                  type="text"
                  value={editingDataPoint.x}
                  onChange={(e) => setEditingDataPoint(prev => prev ? { ...prev, x: e.target.value } : null)}
                  className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Y Değeri
                </label>
                <input
                  type="number"
                  value={editingDataPoint.y}
                  onChange={(e) => setEditingDataPoint(prev => prev ? { ...prev, y: Number(e.target.value) } : null)}
                  className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Etiket
                </label>
                <input
                  type="text"
                  value={editingDataPoint.label || ''}
                  onChange={(e) => setEditingDataPoint(prev => prev ? { ...prev, label: e.target.value } : null)}
                  className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-6">
              <button
                onClick={() => setEditingDataPoint(null)}
                className="px-4 py-2 text-sm bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded hover:bg-gray-200 dark:hover:bg-gray-600"
              >
                İptal
              </button>
              <button
                onClick={() => editingDataPoint && saveDataPoint(editingDataPoint)}
                className="px-4 py-2 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Kaydet
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Comparison Panel */}
      {showComparison && (
        <div className="absolute top-4 right-4 z-10 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 p-4 w-80">
          <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-3">
            Grafik Karşılaştırması
          </h4>
          <div className="space-y-2">
            {comparisonCharts.map(chart => (
              <div key={chart.id} className="flex items-center gap-2">
                <button
                  onClick={() => toggleComparisonChart(chart.id)}
                  className={`p-1 rounded ${chart.visible ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-400'}`}
                >
                  {chart.visible ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                </button>
                <span className="text-sm text-gray-700 dark:text-gray-300 flex-1">
                  {chart.title}
                </span>
                <div
                  className="w-4 h-4 rounded"
                  style={{ backgroundColor: chart.color }}
                />
              </div>
            ))}
          </div>
          <button
            onClick={() => addComparisonChart({
              id: `chart-${Date.now()}`,
              title: 'Yeni Grafik',
              data: [],
              type: 'line',
              color: '#3b82f6',
              visible: true
            })}
            className="w-full mt-3 px-3 py-2 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Grafik Ekle
          </button>
        </div>
      )}

      {/* Drill Down Path */}
      {enableDrillDown && drillDownPath.length > 0 && (
        <div className="absolute bottom-4 left-4 z-10 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 p-3">
          <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
            <span>Yol:</span>
            {drillDownPath.map((path, index) => (
              <React.Fragment key={index}>
                <span className="text-blue-600 dark:text-blue-400">{path}</span>
                {index < drillDownPath.length - 1 && <span>/</span>}
              </React.Fragment>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

// Hook for using advanced chart interactivity
export const useAdvancedChartInteractivity = () => {
  const [annotations, setAnnotations] = useState<ChartAnnotation[]>([]);
  const [data, setData] = useState<DataPoint[]>([]);
  const [comparisonCharts, setComparisonCharts] = useState<ChartComparison[]>([]);

  const addAnnotation = useCallback((annotation: ChartAnnotation) => {
    setAnnotations(prev => [...prev, annotation]);
  }, []);

  const updateAnnotation = useCallback((annotation: ChartAnnotation) => {
    setAnnotations(prev => prev.map(a => a.id === annotation.id ? annotation : a));
  }, []);

  const deleteAnnotation = useCallback((annotationId: string) => {
    setAnnotations(prev => prev.filter(a => a.id !== annotationId));
  }, []);

  const updateData = useCallback((newData: DataPoint[]) => {
    setData(newData);
  }, []);

  const addComparisonChart = useCallback((chart: ChartComparison) => {
    setComparisonCharts(prev => [...prev, chart]);
  }, []);

  return {
    annotations,
    data,
    comparisonCharts,
    addAnnotation,
    updateAnnotation,
    deleteAnnotation,
    updateData,
    addComparisonChart
  };
};

export default AdvancedChartInteractivity;
