import React, { useState, useEffect, useRef, ReactNode } from 'react';
import { useUIUX } from '../../contexts/UIUXContext';
import { useAnimation } from './AnimationSystem';
import { 
  TrendingUp, TrendingDown, BarChart3, PieChart, 
  Activity, Users, DollarSign, Calendar,
  ArrowUpRight, ArrowDownRight, Minus
} from 'lucide-react';

// Chart Types
export type ChartType = 'line' | 'bar' | 'pie' | 'doughnut' | 'area' | 'scatter' | 'radar';

export type ChartTheme = 'light' | 'dark' | 'auto';

export interface ChartData {
  labels: string[];
  datasets: {
    label: string;
    data: number[];
    backgroundColor?: string | string[];
    borderColor?: string | string[];
    borderWidth?: number;
    fill?: boolean;
    tension?: number;
  }[];
}

export interface ChartOptions {
  responsive?: boolean;
  maintainAspectRatio?: boolean;
  plugins?: {
    legend?: {
      display?: boolean;
      position?: 'top' | 'bottom' | 'left' | 'right';
    };
    tooltip?: {
      enabled?: boolean;
      mode?: 'index' | 'point' | 'nearest' | 'dataset' | 'x' | 'y';
    };
  };
  scales?: {
    x?: {
      display?: boolean;
      title?: {
        display?: boolean;
        text?: string;
      };
    };
    y?: {
      display?: boolean;
      title?: {
        display?: boolean;
        text?: string;
      };
    };
  };
  animation?: {
    duration?: number;
    easing?: string;
  };
}

// Base Chart Component
interface BaseChartProps {
  type: ChartType;
  data: ChartData;
  options?: ChartOptions;
  width?: number;
  height?: number;
  className?: string;
  onDataPointClick?: (data: any) => void;
  onDataPointHover?: (data: any) => void;
}

export const BaseChart: React.FC<BaseChartProps> = ({
  type,
  data,
  options = {},
  width = 400,
  height = 300,
  className = '',
  onDataPointClick,
  onDataPointHover
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { settings } = useUIUX();
  const { addAnimation } = useAnimation();
  const [isLoaded, setIsLoaded] = useState(false);

  // Chart rendering logic (simplified for demo)
  useEffect(() => {
    if (!canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, width, height);

    // Simple chart rendering based on type
    switch (type) {
      case 'line':
        renderLineChart(ctx, data, width, height);
        break;
      case 'bar':
        renderBarChart(ctx, data, width, height);
        break;
      case 'pie':
        renderPieChart(ctx, data, width, height);
        break;
      case 'area':
        renderAreaChart(ctx, data, width, height);
        break;
      default:
        renderLineChart(ctx, data, width, height);
    }

    setIsLoaded(true);
    
    // Add entrance animation
    addAnimation(`chart-${Date.now()}`, {
      type: 'fadeInUp',
      duration: 'normal',
      easing: 'ease-out'
    });
  }, [type, data, width, height, addAnimation]);

  return (
    <div className={`relative ${className}`}>
      <canvas
        ref={canvasRef}
        width={width}
        height={height}
        className="w-full h-full"
        onClick={onDataPointClick}
        onMouseMove={onDataPointHover}
      />
      
      {/* Loading overlay */}
      {!isLoaded && (
        <div className="absolute inset-0 flex items-center justify-center bg-white/80 dark:bg-gray-800/80 rounded-lg">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
        </div>
      )}
    </div>
  );
};

// Simple chart rendering functions
const renderLineChart = (ctx: CanvasRenderingContext2D, data: ChartData, width: number, height: number) => {
  const { labels, datasets } = data;
  const dataset = datasets[0];
  
  if (!dataset || !labels.length) return;

  const padding = 40;
  const chartWidth = width - (padding * 2);
  const chartHeight = height - (padding * 2);
  
  const maxValue = Math.max(...dataset.data);
  const minValue = Math.min(...dataset.data);
  const valueRange = maxValue - minValue;
  
  // Draw axes
  ctx.strokeStyle = '#e5e7eb';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(padding, padding);
  ctx.lineTo(padding, height - padding);
  ctx.lineTo(width - padding, height - padding);
  ctx.stroke();
  
  // Draw line
  ctx.strokeStyle = dataset.borderColor as string || '#3b82f6';
  ctx.lineWidth = 2;
  ctx.beginPath();
  
  labels.forEach((label, index) => {
    const x = padding + (index * chartWidth) / (labels.length - 1);
    const y = height - padding - ((dataset.data[index] - minValue) / valueRange) * chartHeight;
    
    if (index === 0) {
      ctx.moveTo(x, y);
    } else {
      ctx.lineTo(x, y);
    }
  });
  
  ctx.stroke();
  
  // Draw data points
  ctx.fillStyle = dataset.backgroundColor as string || '#3b82f6';
  labels.forEach((label, index) => {
    const x = padding + (index * chartWidth) / (labels.length - 1);
    const y = height - padding - ((dataset.data[index] - minValue) / valueRange) * chartHeight;
    
    ctx.beginPath();
    ctx.arc(x, y, 4, 0, 2 * Math.PI);
    ctx.fill();
  });
};

const renderBarChart = (ctx: CanvasRenderingContext2D, data: ChartData, width: number, height: number) => {
  const { labels, datasets } = data;
  const dataset = datasets[0];
  
  if (!dataset || !labels.length) return;

  const padding = 40;
  const chartWidth = width - (padding * 2);
  const chartHeight = height - (padding * 2);
  
  const maxValue = Math.max(...dataset.data);
  const barWidth = chartWidth / labels.length * 0.8;
  const barSpacing = chartWidth / labels.length * 0.2;
  
  // Draw axes
  ctx.strokeStyle = '#e5e7eb';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(padding, padding);
  ctx.lineTo(padding, height - padding);
  ctx.lineTo(width - padding, height - padding);
  ctx.stroke();
  
  // Draw bars
  labels.forEach((label, index) => {
    const barHeight = (dataset.data[index] / maxValue) * chartHeight;
    const x = padding + index * (barWidth + barSpacing) + barSpacing / 2;
    const y = height - padding - barHeight;
    
    ctx.fillStyle = dataset.backgroundColor as string || '#3b82f6';
    ctx.fillRect(x, y, barWidth, barHeight);
  });
};

const renderPieChart = (ctx: CanvasRenderingContext2D, data: ChartData, width: number, height: number) => {
  const { labels, datasets } = data;
  const dataset = datasets[0];
  
  if (!dataset || !labels.length) return;

  const centerX = width / 2;
  const centerY = height / 2;
  const radius = Math.min(width, height) / 2 - 20;
  
  const total = dataset.data.reduce((sum, value) => sum + value, 0);
  let currentAngle = -Math.PI / 2;
  
  labels.forEach((label, index) => {
    const sliceAngle = (dataset.data[index] / total) * 2 * Math.PI;
    
    ctx.beginPath();
    ctx.moveTo(centerX, centerY);
    ctx.arc(centerX, centerY, radius, currentAngle, currentAngle + sliceAngle);
    ctx.closePath();
    
    const colors = Array.isArray(dataset.backgroundColor) 
      ? dataset.backgroundColor 
      : ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];
    
    ctx.fillStyle = colors[index % colors.length];
    ctx.fill();
    
    currentAngle += sliceAngle;
  });
};

const renderAreaChart = (ctx: CanvasRenderingContext2D, data: ChartData, width: number, height: number) => {
  const { labels, datasets } = data;
  const dataset = datasets[0];
  
  if (!dataset || !labels.length) return;

  const padding = 40;
  const chartWidth = width - (padding * 2);
  const chartHeight = height - (padding * 2);
  
  const maxValue = Math.max(...dataset.data);
  const minValue = Math.min(...dataset.data);
  const valueRange = maxValue - minValue;
  
  // Draw area
  ctx.fillStyle = (dataset.backgroundColor as string || '#3b82f6') + '40';
  ctx.beginPath();
  
  labels.forEach((label, index) => {
    const x = padding + (index * chartWidth) / (labels.length - 1);
    const y = height - padding - ((dataset.data[index] - minValue) / valueRange) * chartHeight;
    
    if (index === 0) {
      ctx.moveTo(x, height - padding);
      ctx.lineTo(x, y);
    } else {
      ctx.lineTo(x, y);
    }
  });
  
  ctx.lineTo(width - padding, height - padding);
  ctx.closePath();
  ctx.fill();
  
  // Draw line
  ctx.strokeStyle = dataset.borderColor as string || '#3b82f6';
  ctx.lineWidth = 2;
  ctx.beginPath();
  
  labels.forEach((label, index) => {
    const x = padding + (index * chartWidth) / (labels.length - 1);
    const y = height - padding - ((dataset.data[index] - minValue) / valueRange) * chartHeight;
    
    if (index === 0) {
      ctx.moveTo(x, y);
    } else {
      ctx.lineTo(x, y);
    }
  });
  
  ctx.stroke();
};

// Chart Card Component
interface ChartCardProps {
  title: string;
  subtitle?: string;
  type: ChartType;
  data: ChartData;
  options?: ChartOptions;
  className?: string;
  actions?: ReactNode;
  trend?: {
    value: number;
    label: string;
    direction: 'up' | 'down' | 'neutral';
  };
}

export const ChartCard: React.FC<ChartCardProps> = ({
  title,
  subtitle,
  type,
  data,
  options,
  className = '',
  actions,
  trend
}) => {
  const { isDark } = useUIUX();
  const { addAnimation } = useAnimation();

  const getTrendIcon = () => {
    switch (trend?.direction) {
      case 'up': return <ArrowUpRight className="w-4 h-4 text-success-600" />;
      case 'down': return <ArrowDownRight className="w-4 h-4 text-error-600" />;
      default: return <Minus className="w-4 h-4 text-gray-500" />;
    }
  };

  const getTrendColor = () => {
    switch (trend?.direction) {
      case 'up': return 'text-success-600';
      case 'down': return 'text-error-600';
      default: return 'text-gray-500';
    }
  };

  return (
    <div className={`bg-white dark:bg-gray-800 rounded-xl shadow-soft border border-gray-200 dark:border-gray-700 p-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            {title}
          </h3>
          {subtitle && (
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              {subtitle}
            </p>
          )}
        </div>
        
        {actions && (
          <div className="flex items-center gap-2">
            {actions}
          </div>
        )}
      </div>

      {/* Trend */}
      {trend && (
        <div className="flex items-center gap-2 mb-4">
          {getTrendIcon()}
          <span className={`text-sm font-medium ${getTrendColor()}`}>
            {trend.value}% {trend.label}
          </span>
        </div>
      )}

      {/* Chart */}
      <div className="h-64">
        <BaseChart
          type={type}
          data={data}
          options={options}
          width={400}
          height={256}
        />
      </div>
    </div>
  );
};

// Dashboard Stats Component
interface DashboardStatsProps {
  stats: {
    title: string;
    value: string | number;
    change?: {
      value: number;
      direction: 'up' | 'down' | 'neutral';
    };
    icon: ReactNode;
    color: string;
  }[];
  className?: string;
}

export const DashboardStats: React.FC<DashboardStatsProps> = ({
  stats,
  className = ''
}) => {
  const { addAnimation } = useAnimation();

  const getChangeIcon = (direction: 'up' | 'down' | 'neutral') => {
    switch (direction) {
      case 'up': return <TrendingUp className="w-4 h-4 text-success-600" />;
      case 'down': return <TrendingDown className="w-4 h-4 text-error-600" />;
      default: return <Minus className="w-4 h-4 text-gray-500" />;
    }
  };

  const getChangeColor = (direction: 'up' | 'down' | 'neutral') => {
    switch (direction) {
      case 'up': return 'text-success-600';
      case 'down': return 'text-error-600';
      default: return 'text-gray-500';
    }
  };

  return (
    <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 ${className}`}>
      {stats.map((stat, index) => (
        <div
          key={index}
          className="bg-white dark:bg-gray-800 rounded-xl shadow-soft border border-gray-200 dark:border-gray-700 p-6 hover:shadow-medium transition-shadow duration-300"
          onMouseEnter={() => {
            addAnimation(`stat-${index}`, {
              type: 'scaleIn',
              duration: 'fast',
              easing: 'bounce'
            });
          }}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                {stat.title}
              </p>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100 mt-1">
                {stat.value}
              </p>
              {stat.change && (
                <div className="flex items-center gap-1 mt-2">
                  {getChangeIcon(stat.change.direction)}
                  <span className={`text-sm font-medium ${getChangeColor(stat.change.direction)}`}>
                    {stat.change.value}%
                  </span>
                </div>
              )}
            </div>
            <div className={`p-3 rounded-lg ${stat.color}`}>
              {stat.icon}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

// Chart Types
export const ChartTypes = {
  line: 'line',
  bar: 'bar',
  pie: 'pie',
  doughnut: 'doughnut',
  area: 'area',
  scatter: 'scatter',
  radar: 'radar'
} as const;

export default BaseChart;
