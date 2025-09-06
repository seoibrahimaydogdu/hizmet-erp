import React, { useState, useEffect, ReactNode } from 'react';
import { useAnimation } from './AnimationSystem';
import { TouchFeedback } from './TouchInteractions';
import { 
  ChevronRight, ChevronLeft,
  Search, Menu, X, Home
} from 'lucide-react';

// Navigation Types
export type NavigationType = 'sidebar' | 'topbar' | 'breadcrumb' | 'tabs' | 'pagination' | 'floating';

export type NavigationItem = {
  id: string;
  label: string;
  icon?: ReactNode;
  href?: string;
  children?: NavigationItem[];
  badge?: string | number;
  disabled?: boolean;
  hidden?: boolean;
  onClick?: () => void;
  meta?: {
    description?: string;
    keywords?: string[];
    category?: string;
  };
};

export type NavigationState = {
  isOpen: boolean;
  activeItem: string | null;
  expandedItems: string[];
  searchQuery: string;
  keyboardNavigation: boolean;
  focusIndex: number;
};

// Sidebar Navigation Component
interface SidebarNavigationProps {
  items: NavigationItem[];
  activeItem?: string;
  onItemClick?: (item: NavigationItem) => void;
  collapsed?: boolean;
  onToggleCollapse?: () => void;
  className?: string;
}

export const SidebarNavigation: React.FC<SidebarNavigationProps> = ({
  items,
  activeItem,
  onItemClick,
  collapsed = false,
  onToggleCollapse,
  className = ''
}) => {
  const [expandedItems, setExpandedItems] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const { addAnimation } = useAnimation();

  const filteredItems = items.filter(item =>
    item.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.meta?.keywords?.some(keyword => 
      keyword.toLowerCase().includes(searchQuery.toLowerCase())
    )
  );

  const handleItemClick = (item: NavigationItem) => {
    if (item.children && item.children.length > 0) {
      setExpandedItems(prev =>
        prev.includes(item.id)
          ? prev.filter(id => id !== item.id)
          : [...prev, item.id]
      );
    }
    
    onItemClick?.(item);
    
    addAnimation(`nav-item-${item.id}`, {
      type: 'scaleIn',
      duration: 'fast',
      easing: 'bounce'
    });
  };

  const renderNavigationItem = (item: NavigationItem, level = 0) => {
    const isActive = activeItem === item.id;
    const isExpanded = expandedItems.includes(item.id);
    const hasChildren = item.children && item.children.length > 0;

    return (
      <div key={item.id} className="relative">
        <TouchFeedback feedback="scale">
          <button
            onClick={() => handleItemClick(item)}
            disabled={item.disabled}
            className={`
              w-full flex items-center gap-3 px-3 py-2 text-left rounded-lg
              transition-all duration-200
              ${isActive 
                ? 'bg-primary-100 dark:bg-primary-900 text-primary-700 dark:text-primary-300' 
                : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
              }
              ${item.disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
              ${level > 0 ? 'ml-4' : ''}
            `}
          >
            {item.icon && (
              <span className={`flex-shrink-0 ${collapsed ? 'w-5 h-5' : 'w-5 h-5'}`}>
                {item.icon}
              </span>
            )}
            
            {!collapsed && (
              <>
                <span className="flex-1 truncate">{item.label}</span>
                
                {item.badge && (
                  <span className="px-2 py-1 text-xs bg-primary-100 dark:bg-primary-900 text-primary-700 dark:text-primary-300 rounded-full">
                    {item.badge}
                  </span>
                )}
                
                {hasChildren && (
                  <ChevronRight 
                    className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-90' : ''}`} 
                  />
                )}
              </>
            )}
          </button>
        </TouchFeedback>

        {/* Children */}
        {hasChildren && isExpanded && !collapsed && (
          <div className="mt-1 space-y-1">
            {item.children!.map(child => renderNavigationItem(child, level + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className={`bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 ${className}`}>
      {/* Header */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          {!collapsed && (
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              Navigasyon
            </h2>
          )}
          
          {onToggleCollapse && (
            <TouchFeedback feedback="scale">
              <button
                onClick={onToggleCollapse}
                className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                {collapsed ? <ChevronRight className="w-5 h-5" /> : <ChevronLeft className="w-5 h-5" />}
              </button>
            </TouchFeedback>
          )}
        </div>

        {/* Search */}
        {!collapsed && (
          <div className="mt-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Ara..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>
          </div>
        )}
      </div>

      {/* Navigation Items */}
      <nav className="p-4 space-y-1">
        {filteredItems.map(item => renderNavigationItem(item))}
      </nav>
    </div>
  );
};

// Top Bar Navigation Component
interface TopBarNavigationProps {
  items: NavigationItem[];
  activeItem?: string;
  onItemClick?: (item: NavigationItem) => void;
  userMenu?: ReactNode;
  notifications?: ReactNode;
  searchBar?: ReactNode;
  className?: string;
}

export const TopBarNavigation: React.FC<TopBarNavigationProps> = ({
  items,
  activeItem,
  onItemClick,
  userMenu,
  notifications,
  searchBar,
  className = ''
}) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { addAnimation } = useAnimation();

  const handleItemClick = (item: NavigationItem) => {
    onItemClick?.(item);
    setIsMobileMenuOpen(false);
    
    addAnimation(`topbar-item-${item.id}`, {
      type: 'scaleIn',
      duration: 'fast',
      easing: 'bounce'
    });
  };

  return (
    <header className={`bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 ${className}`}>
      <div className="px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo/Brand */}
          <div className="flex items-center">
            <TouchFeedback feedback="scale">
              <button className="flex items-center gap-2">
                <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
                  <Home className="w-5 h-5 text-white" />
                </div>
                <span className="text-xl font-bold text-gray-900 dark:text-gray-100">
                  Hizmet ERP
                </span>
              </button>
            </TouchFeedback>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            {items.map(item => (
              <TouchFeedback key={item.id} feedback="scale">
                <button
                  onClick={() => handleItemClick(item)}
                  className={`
                    flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-lg
                    transition-all duration-200
                    ${activeItem === item.id
                      ? 'bg-primary-100 dark:bg-primary-900 text-primary-700 dark:text-primary-300'
                      : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                    }
                  `}
                >
                  {item.icon}
                  {item.label}
                  {item.badge && (
                    <span className="px-2 py-1 text-xs bg-primary-100 dark:bg-primary-900 text-primary-700 dark:text-primary-300 rounded-full">
                      {item.badge}
                    </span>
                  )}
                </button>
              </TouchFeedback>
            ))}
          </nav>

          {/* Right Side Actions */}
          <div className="flex items-center gap-4">
            {/* Search Bar */}
            {searchBar}

            {/* Notifications */}
            {notifications}

            {/* User Menu */}
            {userMenu}

            {/* Mobile Menu Button */}
            <TouchFeedback feedback="scale">
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="md:hidden p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </TouchFeedback>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMobileMenuOpen && (
          <div className="md:hidden border-t border-gray-200 dark:border-gray-700">
            <nav className="py-4 space-y-2">
              {items.map(item => (
                <TouchFeedback key={item.id} feedback="scale">
                  <button
                    onClick={() => handleItemClick(item)}
                    className={`
                      w-full flex items-center gap-3 px-3 py-2 text-left rounded-lg
                      transition-all duration-200
                      ${activeItem === item.id
                        ? 'bg-primary-100 dark:bg-primary-900 text-primary-700 dark:text-primary-300'
                        : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                      }
                    `}
                  >
                    {item.icon}
                    {item.label}
                    {item.badge && (
                      <span className="ml-auto px-2 py-1 text-xs bg-primary-100 dark:bg-primary-900 text-primary-700 dark:text-primary-300 rounded-full">
                        {item.badge}
                      </span>
                    )}
                  </button>
                </TouchFeedback>
              ))}
            </nav>
          </div>
        )}
      </div>
    </header>
  );
};

// Breadcrumb Navigation Component
interface BreadcrumbNavigationProps {
  items: NavigationItem[];
  separator?: ReactNode;
  className?: string;
}

export const BreadcrumbNavigation: React.FC<BreadcrumbNavigationProps> = ({
  items,
  separator = <ChevronRight className="w-4 h-4 text-gray-400" />,
  className = ''
}) => {
  const { addAnimation } = useAnimation();

  const handleItemClick = (item: NavigationItem) => {
    addAnimation(`breadcrumb-${item.id}`, {
      type: 'scaleIn',
      duration: 'fast',
      easing: 'bounce'
    });
  };

  return (
    <nav className={`flex items-center space-x-2 text-sm ${className}`}>
      {items.map((item, index) => (
        <React.Fragment key={item.id}>
          {index > 0 && (
            <span className="flex-shrink-0">
              {separator}
            </span>
          )}
          
          <TouchFeedback feedback="scale">
            <button
              onClick={() => handleItemClick(item)}
              className={`
                flex items-center gap-1 px-2 py-1 rounded-md
                transition-all duration-200
                ${index === items.length - 1
                  ? 'text-gray-900 dark:text-gray-100 font-medium'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100'
                }
              `}
            >
              {item.icon}
              {item.label}
            </button>
          </TouchFeedback>
        </React.Fragment>
      ))}
    </nav>
  );
};

// Tab Navigation Component
interface TabNavigationProps {
  items: NavigationItem[];
  activeItem?: string;
  onItemClick?: (item: NavigationItem) => void;
  variant?: 'default' | 'pills' | 'underline';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const TabNavigation: React.FC<TabNavigationProps> = ({
  items,
  activeItem,
  onItemClick,
  variant = 'default',
  size = 'md',
  className = ''
}) => {
  const { addAnimation } = useAnimation();

  const getVariantClasses = () => {
    switch (variant) {
      case 'pills':
        return 'bg-gray-100 dark:bg-gray-700 p-1 rounded-lg';
      case 'underline':
        return 'border-b border-gray-200 dark:border-gray-700';
      default:
        return '';
    }
  };

  const getSizeClasses = () => {
    switch (size) {
      case 'sm': return 'px-3 py-1.5 text-sm';
      case 'lg': return 'px-6 py-3 text-lg';
      default: return 'px-4 py-2 text-base';
    }
  };

  const getItemClasses = (item: NavigationItem) => {
    const isActive = activeItem === item.id;
    
    switch (variant) {
      case 'pills':
        return `
          ${getSizeClasses()} rounded-md font-medium transition-all duration-200
          ${isActive
            ? 'bg-white dark:bg-gray-800 text-primary-700 dark:text-primary-300 shadow-sm'
            : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100'
          }
        `;
      case 'underline':
        return `
          ${getSizeClasses()} border-b-2 font-medium transition-all duration-200
          ${isActive
            ? 'border-primary-500 text-primary-700 dark:text-primary-300'
            : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:border-gray-300 dark:hover:border-gray-600'
          }
        `;
      default:
        return `
          ${getSizeClasses()} font-medium transition-all duration-200
          ${isActive
            ? 'text-primary-700 dark:text-primary-300'
            : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100'
          }
        `;
    }
  };

  const handleItemClick = (item: NavigationItem) => {
    onItemClick?.(item);
    
    addAnimation(`tab-${item.id}`, {
      type: 'scaleIn',
      duration: 'fast',
      easing: 'bounce'
    });
  };

  return (
    <div className={`flex items-center space-x-1 ${getVariantClasses()} ${className}`}>
      {items.map(item => (
        <TouchFeedback key={item.id} feedback="scale">
          <button
            onClick={() => handleItemClick(item)}
            disabled={item.disabled}
            className={`
              flex items-center gap-2 ${getItemClasses(item)}
              ${item.disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
            `}
          >
            {item.icon}
            {item.label}
            {item.badge && (
              <span className="px-2 py-1 text-xs bg-primary-100 dark:bg-primary-900 text-primary-700 dark:text-primary-300 rounded-full">
                {item.badge}
              </span>
            )}
          </button>
        </TouchFeedback>
      ))}
    </div>
  );
};

// Floating Navigation Component
interface FloatingNavigationProps {
  items: NavigationItem[];
  activeItem?: string;
  onItemClick?: (item: NavigationItem) => void;
  position?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';
  className?: string;
}

export const FloatingNavigation: React.FC<FloatingNavigationProps> = ({
  items,
  activeItem,
  onItemClick,
  position = 'bottom-right',
  className = ''
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const { addAnimation } = useAnimation();

  const getPositionClasses = () => {
    switch (position) {
      case 'bottom-right': return 'bottom-6 right-6';
      case 'bottom-left': return 'bottom-6 left-6';
      case 'top-right': return 'top-6 right-6';
      case 'top-left': return 'top-6 left-6';
      default: return 'bottom-6 right-6';
    }
  };

  const handleItemClick = (item: NavigationItem) => {
    onItemClick?.(item);
    setIsOpen(false);
    
    addAnimation(`floating-${item.id}`, {
      type: 'bounceIn',
      duration: 'normal',
      easing: 'bounce'
    });
  };

  return (
    <div className={`fixed z-50 ${getPositionClasses()} ${className}`}>
      {/* Navigation Items */}
      {isOpen && (
        <div className="mb-4 space-y-2">
          {items.map((item, index) => (
            <TouchFeedback key={item.id} feedback="scale">
              <button
                onClick={() => handleItemClick(item)}
                className={`
                  flex items-center gap-3 p-3 bg-white dark:bg-gray-800 rounded-lg shadow-strong border border-gray-200 dark:border-gray-700
                  transition-all duration-200
                  ${activeItem === item.id
                    ? 'bg-primary-100 dark:bg-primary-900 text-primary-700 dark:text-primary-300'
                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                  }
                `}
                style={{
                  animationDelay: `${index * 50}ms`
                }}
              >
                {item.icon}
                <span className="font-medium">{item.label}</span>
                {item.badge && (
                  <span className="px-2 py-1 text-xs bg-primary-100 dark:bg-primary-900 text-primary-700 dark:text-primary-300 rounded-full">
                    {item.badge}
                  </span>
                )}
              </button>
            </TouchFeedback>
          ))}
        </div>
      )}

      {/* Toggle Button */}
      <TouchFeedback feedback="scale">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="w-14 h-14 bg-primary-600 text-white rounded-full shadow-strong hover:bg-primary-700 transition-all duration-200 flex items-center justify-center"
        >
          {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </TouchFeedback>
    </div>
  );
};

// Keyboard Navigation Hook
export const useKeyboardNavigation = (
  items: NavigationItem[],
  onItemClick?: (item: NavigationItem) => void
) => {
  const [focusIndex, setFocusIndex] = useState(0);
  const { addAnimation } = useAnimation();

  useEffect(() => {
    const handleKeyDown = (e: globalThis.KeyboardEvent) => {
      switch (e.key) {
        case 'ArrowDown':
        case 'ArrowRight':
          e.preventDefault();
          setFocusIndex(prev => (prev + 1) % items.length);
          break;
        case 'ArrowUp':
        case 'ArrowLeft':
          e.preventDefault();
          setFocusIndex(prev => (prev - 1 + items.length) % items.length);
          break;
        case 'Enter':
        case ' ':
          e.preventDefault();
          if (items[focusIndex]) {
            onItemClick?.(items[focusIndex]);
            addAnimation(`keyboard-nav-${items[focusIndex].id}`, {
              type: 'scaleIn',
              duration: 'fast',
              easing: 'bounce'
            });
          }
          break;
        case 'Escape':
          e.preventDefault();
          setFocusIndex(0);
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [items, focusIndex, onItemClick, addAnimation]);

  return { focusIndex, setFocusIndex };
};

export default SidebarNavigation;
