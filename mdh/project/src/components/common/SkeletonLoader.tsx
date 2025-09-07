import React from 'react';

// Genel skeleton component
export const SkeletonBox: React.FC<{ 
  className?: string; 
  width?: string; 
  height?: string; 
}> = ({ className = '', width = 'w-full', height = 'h-4' }) => (
  <div className={`bg-gray-200 dark:bg-gray-700 rounded animate-pulse ${width} ${height} ${className}`}></div>
);

// Proje kartı skeleton
export const ProjectCardSkeleton: React.FC = () => (
  <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 animate-pulse">
    <div className="flex items-start justify-between mb-4">
      <div className="flex-1">
        <SkeletonBox width="w-3/4" height="h-5" className="mb-2" />
        <SkeletonBox width="w-1/2" height="h-4" />
      </div>
      <SkeletonBox width="w-16" height="h-6" className="rounded-full" />
    </div>
    
    <div className="space-y-3 mb-4">
      <div className="flex items-center space-x-3">
        <SkeletonBox width="w-4" height="h-4" className="rounded-full" />
        <SkeletonBox width="w-20" height="h-4" />
      </div>
      <div className="flex items-center space-x-3">
        <SkeletonBox width="w-4" height="h-4" className="rounded-full" />
        <SkeletonBox width="w-24" height="h-4" />
      </div>
    </div>
    
    <div className="flex items-center justify-between">
      <SkeletonBox width="w-16" height="h-8" className="rounded" />
      <div className="flex space-x-2">
        <SkeletonBox width="w-8" height="h-8" className="rounded" />
        <SkeletonBox width="w-8" height="h-8" className="rounded" />
        <SkeletonBox width="w-8" height="h-8" className="rounded" />
      </div>
    </div>
  </div>
);

// Proje tablosu skeleton
export const ProjectTableSkeleton: React.FC = () => (
  <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
    {/* Tablo başlığı */}
    <div className="bg-gray-50 dark:bg-gray-700 px-6 py-3 border-b border-gray-200 dark:border-gray-600">
      <div className="flex items-center justify-between">
        <SkeletonBox width="w-32" height="h-5" />
        <SkeletonBox width="w-24" height="h-8" className="rounded" />
      </div>
    </div>
    
    {/* Tablo satırları */}
    <div className="divide-y divide-gray-200 dark:divide-gray-600">
      {[1, 2, 3, 4, 5].map((i) => (
        <div key={i} className="px-6 py-4 animate-pulse">
          <div className="flex items-center space-x-4">
            {/* Proje adı */}
            <div className="flex-1">
              <SkeletonBox width="w-3/4" height="h-4" className="mb-1" />
              <SkeletonBox width="w-1/2" height="h-3" />
            </div>
            
            {/* Durum */}
            <SkeletonBox width="w-20" height="h-6" className="rounded-full" />
            
            {/* Teslim tarihi */}
            <div className="flex items-center space-x-2">
              <SkeletonBox width="w-16" height="h-2" className="rounded-full" />
              <SkeletonBox width="w-16" height="h-4" />
            </div>
            
            {/* İlerleme */}
            <div className="flex items-center space-x-2">
              <SkeletonBox width="w-16" height="h-2" className="rounded-full" />
              <SkeletonBox width="w-8" height="h-4" />
            </div>
            
            {/* Bütçe */}
            <SkeletonBox width="w-20" height="h-4" />
            
            {/* Risk */}
            <SkeletonBox width="w-16" height="h-6" className="rounded-full" />
            
            {/* İşlemler */}
            <div className="flex space-x-2">
              <SkeletonBox width="w-8" height="h-8" className="rounded" />
              <SkeletonBox width="w-8" height="h-8" className="rounded" />
              <SkeletonBox width="w-8" height="h-8" className="rounded" />
            </div>
          </div>
        </div>
      ))}
    </div>
  </div>
);

// Dashboard kartları skeleton
export const DashboardCardSkeleton: React.FC = () => (
  <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 animate-pulse">
    <div className="flex items-center justify-between mb-4">
      <SkeletonBox width="w-8" height="h-8" className="rounded" />
      <SkeletonBox width="w-16" height="h-6" className="rounded-full" />
    </div>
    
    <SkeletonBox width="w-3/4" height="h-6" className="mb-2" />
    <SkeletonBox width="w-1/2" height="h-4" className="mb-4" />
    
    <div className="flex items-center justify-between">
      <SkeletonBox width="w-20" height="h-8" />
      <SkeletonBox width="w-12" height="h-4" />
    </div>
  </div>
);

// Liste skeleton
export const ListSkeleton: React.FC<{ count?: number }> = ({ count = 5 }) => (
  <div className="space-y-3">
    {Array.from({ length: count }).map((_, i) => (
      <div key={i} className="flex items-center space-x-4 p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 animate-pulse">
        <SkeletonBox width="w-10" height="h-10" className="rounded-full" />
        <div className="flex-1 space-y-2">
          <SkeletonBox width="w-1/4" height="h-4" />
          <SkeletonBox width="w-1/2" height="h-3" />
        </div>
        <SkeletonBox width="w-20" height="h-8" className="rounded" />
      </div>
    ))}
  </div>
);

// Form skeleton
export const FormSkeleton: React.FC = () => (
  <div className="space-y-6 animate-pulse">
    <div className="space-y-2">
      <SkeletonBox width="w-24" height="h-4" />
      <SkeletonBox width="w-full" height="h-10" className="rounded" />
    </div>
    
    <div className="space-y-2">
      <SkeletonBox width="w-32" height="h-4" />
      <SkeletonBox width="w-full" height="h-10" className="rounded" />
    </div>
    
    <div className="space-y-2">
      <SkeletonBox width="w-28" height="h-4" />
      <SkeletonBox width="w-full" height="h-24" className="rounded" />
    </div>
    
    <div className="flex space-x-4">
      <SkeletonBox width="w-24" height="h-10" className="rounded" />
      <SkeletonBox width="w-20" height="h-10" className="rounded" />
    </div>
  </div>
);

// Genel tablo skeleton
export const TableSkeleton: React.FC<{ 
  rows?: number; 
  columns?: number; 
  className?: string;
}> = ({ rows = 5, columns = 4, className = '' }) => (
  <div className={`bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden ${className}`}>
    {/* Tablo başlığı */}
    <div className="bg-gray-50 dark:bg-gray-700 px-6 py-3 border-b border-gray-200 dark:border-gray-600">
      <div className="flex items-center justify-between">
        <SkeletonBox width="w-32" height="h-5" />
        <SkeletonBox width="w-24" height="h-8" className="rounded" />
      </div>
    </div>
    
    {/* Tablo satırları */}
    <div className="divide-y divide-gray-200 dark:divide-gray-600">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="px-6 py-4 animate-pulse">
          <div className="flex items-center space-x-4">
            {Array.from({ length: columns }).map((_, j) => (
              <div key={j} className="flex-1">
                <SkeletonBox width="w-3/4" height="h-4" className="mb-1" />
                <SkeletonBox width="w-1/2" height="h-3" />
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  </div>
);

// Genel loading wrapper
export const LoadingWrapper: React.FC<{ 
  isLoading: boolean; 
  children: React.ReactNode; 
  skeleton: React.ReactNode;
  className?: string;
}> = ({ isLoading, children, skeleton, className = '' }) => {
  if (isLoading) {
    return <div className={className}>{skeleton}</div>;
  }
  
  return <>{children}</>;
};