import React from 'react';

// Temel Skeleton Bileşeni
export const SkeletonBox: React.FC<{ 
  width?: string; 
  height?: string; 
  className?: string;
  rounded?: boolean;
}> = ({ 
  width = 'w-full', 
  height = 'h-4', 
  className = '', 
  rounded = true 
}) => (
  <div 
    className={`animate-pulse bg-gray-200 dark:bg-gray-700 ${width} ${height} ${
      rounded ? 'rounded' : ''
    } ${className}`}
  />
);

// Müşteri Kartı Skeleton
export const CustomerCardSkeleton: React.FC = () => (
  <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
    <div className="flex items-center space-x-3 mb-3">
      <SkeletonBox width="w-10" height="h-10" className="rounded-full" />
      <div className="flex-1">
        <SkeletonBox width="w-3/4" height="h-4" className="mb-2" />
        <SkeletonBox width="w-1/2" height="h-3" />
      </div>
    </div>
    <div className="space-y-2">
      <SkeletonBox width="w-full" height="h-3" />
      <SkeletonBox width="w-2/3" height="h-3" />
    </div>
    <div className="flex justify-between items-center mt-3">
      <SkeletonBox width="w-20" height="h-6" className="rounded-full" />
      <SkeletonBox width="w-16" height="h-4" />
    </div>
  </div>
);

// Talep Kartı Skeleton
export const TicketCardSkeleton: React.FC = () => (
  <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
    <div className="flex justify-between items-start mb-3">
      <div className="flex-1">
        <SkeletonBox width="w-3/4" height="h-5" className="mb-2" />
        <SkeletonBox width="w-1/2" height="h-3" />
      </div>
      <SkeletonBox width="w-16" height="h-6" className="rounded-full" />
    </div>
    <div className="space-y-2 mb-3">
      <SkeletonBox width="w-full" height="h-3" />
      <SkeletonBox width="w-2/3" height="h-3" />
    </div>
    <div className="flex justify-between items-center">
      <div className="flex items-center space-x-2">
        <SkeletonBox width="w-8" height="h-8" className="rounded-full" />
        <SkeletonBox width="w-20" height="h-3" />
      </div>
      <SkeletonBox width="w-16" height="h-3" />
    </div>
  </div>
);

// Temsilci Kartı Skeleton
export const AgentCardSkeleton: React.FC = () => (
  <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
    <div className="flex items-center space-x-3 mb-3">
      <SkeletonBox width="w-12" height="h-12" className="rounded-full" />
      <div className="flex-1">
        <SkeletonBox width="w-3/4" height="h-4" className="mb-2" />
        <SkeletonBox width="w-1/2" height="h-3" />
      </div>
      <SkeletonBox width="w-20" height="h-6" className="rounded-full" />
    </div>
    <div className="grid grid-cols-2 gap-4 mb-3">
      <div>
        <SkeletonBox width="w-16" height="h-3" className="mb-1" />
        <SkeletonBox width="w-12" height="h-4" />
      </div>
      <div>
        <SkeletonBox width="w-16" height="h-3" className="mb-1" />
        <SkeletonBox width="w-12" height="h-4" />
      </div>
    </div>
    <div className="flex justify-between items-center">
      <SkeletonBox width="w-24" height="h-3" />
      <SkeletonBox width="w-16" height="h-3" />
    </div>
  </div>
);

// Tablo Skeleton
export const TableSkeleton: React.FC<{ rows?: number; columns?: number }> = ({ 
  rows = 5, 
  columns = 4 
}) => (
  <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
    {/* Header */}
    <div className="px-6 py-3 border-b border-gray-200 dark:border-gray-700">
      <div className="flex space-x-4">
        {Array.from({ length: columns }).map((_, i) => (
          <SkeletonBox key={i} width="w-24" height="h-4" />
        ))}
      </div>
    </div>
    
    {/* Rows */}
    {Array.from({ length: rows }).map((_, rowIndex) => (
      <div key={rowIndex} className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 last:border-b-0">
        <div className="flex space-x-4">
          {Array.from({ length: columns }).map((_, colIndex) => (
            <SkeletonBox key={colIndex} width="w-20" height="h-4" />
          ))}
        </div>
      </div>
    ))}
  </div>
);

// Liste Skeleton
export const ListSkeleton: React.FC<{ items?: number }> = ({ items = 5 }) => (
  <div className="space-y-3">
    {Array.from({ length: items }).map((_, i) => (
      <div key={i} className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
        <div className="flex items-center space-x-3">
          <SkeletonBox width="w-10" height="h-10" className="rounded-full" />
          <div className="flex-1">
            <SkeletonBox width="w-3/4" height="h-4" className="mb-2" />
            <SkeletonBox width="w-1/2" height="h-3" />
          </div>
          <SkeletonBox width="w-16" height="h-6" className="rounded-full" />
        </div>
      </div>
    ))}
  </div>
);

// Dashboard Kartları Skeleton
export const DashboardCardSkeleton: React.FC = () => (
  <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
    <div className="flex items-center justify-between mb-4">
      <SkeletonBox width="w-8" height="h-8" className="rounded" />
      <SkeletonBox width="w-16" height="h-6" className="rounded-full" />
    </div>
    <div className="space-y-2">
      <SkeletonBox width="w-3/4" height="h-6" />
      <SkeletonBox width="w-1/2" height="h-4" />
    </div>
    <div className="mt-4">
      <SkeletonBox width="w-full" height="h-2" className="rounded-full" />
    </div>
  </div>
);

// Grafik Skeleton
export const ChartSkeleton: React.FC = () => (
  <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
    <div className="mb-4">
      <SkeletonBox width="w-1/3" height="h-5" className="mb-2" />
      <SkeletonBox width="w-1/2" height="h-3" />
    </div>
    <div className="h-64 flex items-end justify-between space-x-2">
      {Array.from({ length: 7 }).map((_, i) => (
        <SkeletonBox 
          key={i} 
          width="w-8" 
          height={`h-${Math.floor(Math.random() * 20) + 10}`} 
          className="rounded-t"
        />
      ))}
    </div>
  </div>
);

// Mesaj Skeleton (Chat için)
export const MessageSkeleton: React.FC = () => (
  <div className="flex items-start space-x-3 p-4">
    <SkeletonBox width="w-8" height="h-8" className="rounded-full" />
    <div className="flex-1">
      <div className="flex items-center space-x-2 mb-2">
        <SkeletonBox width="w-20" height="h-3" />
        <SkeletonBox width="w-16" height="h-3" />
      </div>
      <div className="space-y-2">
        <SkeletonBox width="w-3/4" height="h-4" />
        <SkeletonBox width="w-1/2" height="h-4" />
      </div>
    </div>
  </div>
);

// Form Skeleton
export const FormSkeleton: React.FC = () => (
  <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
    <div className="space-y-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i}>
          <SkeletonBox width="w-24" height="h-4" className="mb-2" />
          <SkeletonBox width="w-full" height="h-10" className="rounded" />
        </div>
      ))}
      <div className="flex justify-end space-x-3">
        <SkeletonBox width="w-20" height="h-10" className="rounded" />
        <SkeletonBox width="w-24" height="h-10" className="rounded" />
      </div>
    </div>
  </div>
);

export default {
  SkeletonBox,
  CustomerCardSkeleton,
  TicketCardSkeleton,
  AgentCardSkeleton,
  TableSkeleton,
  ListSkeleton,
  DashboardCardSkeleton,
  ChartSkeleton,
  MessageSkeleton,
  FormSkeleton
};
