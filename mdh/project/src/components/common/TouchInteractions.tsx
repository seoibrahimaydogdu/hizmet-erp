import React, { useState, useEffect, useRef, ReactNode, TouchEvent, MouseEvent } from 'react';
import { useUIUX } from '../../contexts/UIUXContext';
import { useAnimation } from './AnimationSystem';

// Touch Gesture Types
export type TouchGesture = 'swipe' | 'pinch' | 'pan' | 'tap' | 'longPress' | 'doubleTap';

export type SwipeDirection = 'up' | 'down' | 'left' | 'right';

export interface TouchGestureConfig {
  swipe?: {
    threshold?: number;
    velocity?: number;
    onSwipe?: (direction: SwipeDirection, distance: number) => void;
  };
  pinch?: {
    threshold?: number;
    onPinch?: (scale: number, center: { x: number; y: number }) => void;
  };
  pan?: {
    threshold?: number;
    onPan?: (delta: { x: number; y: number }, velocity: { x: number; y: number }) => void;
  };
  tap?: {
    onTap?: (position: { x: number; y: number }) => void;
  };
  longPress?: {
    duration?: number;
    onLongPress?: (position: { x: number; y: number }) => void;
  };
  doubleTap?: {
    threshold?: number;
    onDoubleTap?: (position: { x: number; y: number }) => void;
  };
}

// Touch State
interface TouchState {
  touches: Touch[];
  startTime: number;
  startPosition: { x: number; y: number };
  lastPosition: { x: number; y: number };
  velocity: { x: number; y: number };
  isLongPress: boolean;
  longPressTimer: NodeJS.Timeout | null;
  lastTapTime: number;
  tapCount: number;
}

// Touch Gesture Hook
export const useTouchGestures = (config: TouchGestureConfig) => {
  const [touchState, setTouchState] = useState<TouchState>({
    touches: [],
    startTime: 0,
    startPosition: { x: 0, y: 0 },
    lastPosition: { x: 0, y: 0 },
    velocity: { x: 0, y: 0 },
    isLongPress: false,
    longPressTimer: null,
    lastTapTime: 0,
    tapCount: 0
  });

  const handleTouchStart = (e: TouchEvent) => {
    const touch = e.touches[0];
    const now = Date.now();
    
    setTouchState(prev => ({
      ...prev,
      touches: Array.from(e.touches),
      startTime: now,
      startPosition: { x: touch.clientX, y: touch.clientY },
      lastPosition: { x: touch.clientX, y: touch.clientY },
      velocity: { x: 0, y: 0 }
    }));

    // Long press detection
    if (config.longPress) {
      const timer = setTimeout(() => {
        setTouchState(prev => ({ ...prev, isLongPress: true }));
        config.longPress?.onLongPress?.({ x: touch.clientX, y: touch.clientY });
      }, config.longPress.duration || 500);
      
      setTouchState(prev => ({ ...prev, longPressTimer: timer }));
    }

    // Double tap detection
    if (config.doubleTap) {
      const timeSinceLastTap = now - touchState.lastTapTime;
      if (timeSinceLastTap < (config.doubleTap.threshold || 300)) {
        setTouchState(prev => ({ ...prev, tapCount: prev.tapCount + 1 }));
        if (touchState.tapCount === 1) {
          config.doubleTap?.onDoubleTap?.({ x: touch.clientX, y: touch.clientY });
          setTouchState(prev => ({ ...prev, tapCount: 0 }));
        }
      } else {
        setTouchState(prev => ({ ...prev, tapCount: 1 }));
      }
      setTouchState(prev => ({ ...prev, lastTapTime: now }));
    }
  };

  const handleTouchMove = (e: TouchEvent) => {
    const touch = e.touches[0];
    const now = Date.now();
    const deltaTime = now - touchState.startTime;
    
    if (deltaTime > 0) {
      const deltaX = touch.clientX - touchState.startPosition.x;
      const deltaY = touch.clientY - touchState.startPosition.y;
      const velocityX = deltaX / deltaTime;
      const velocityY = deltaY / deltaTime;

      setTouchState(prev => ({
        ...prev,
        lastPosition: { x: touch.clientX, y: touch.clientY },
        velocity: { x: velocityX, y: velocityY }
      }));

      // Pan gesture
      if (config.pan && Math.abs(deltaX) > (config.pan.threshold || 10) || Math.abs(deltaY) > (config.pan.threshold || 10)) {
        config.pan.onPan?.({ x: deltaX, y: deltaY }, { x: velocityX, y: velocityY });
      }

      // Cancel long press if moved too much
      if (touchState.longPressTimer && (Math.abs(deltaX) > 10 || Math.abs(deltaY) > 10)) {
        clearTimeout(touchState.longPressTimer);
        setTouchState(prev => ({ ...prev, longPressTimer: null }));
      }
    }
  };

  const handleTouchEnd = (e: TouchEvent) => {
    const touch = e.changedTouches[0];
    const now = Date.now();
    const deltaTime = now - touchState.startTime;
    const deltaX = touch.clientX - touchState.startPosition.x;
    const deltaY = touch.clientY - touchState.startPosition.y;
    const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);

    // Clear long press timer
    if (touchState.longPressTimer) {
      clearTimeout(touchState.longPressTimer);
      setTouchState(prev => ({ ...prev, longPressTimer: null }));
    }

    // Swipe detection
    if (config.swipe && deltaTime < 300 && distance > (config.swipe.threshold || 50)) {
      const velocity = distance / deltaTime;
      if (velocity > (config.swipe.velocity || 0.3)) {
        let direction: SwipeDirection;
        if (Math.abs(deltaX) > Math.abs(deltaY)) {
          direction = deltaX > 0 ? 'right' : 'left';
        } else {
          direction = deltaY > 0 ? 'down' : 'up';
        }
        config.swipe.onSwipe?.(direction, distance);
      }
    }

    // Tap detection
    if (config.tap && deltaTime < 200 && distance < 10 && !touchState.isLongPress) {
      config.tap.onTap?.({ x: touch.clientX, y: touch.clientY });
    }

    // Reset state
    setTouchState(prev => ({
      ...prev,
      touches: [],
      isLongPress: false,
      longPressTimer: null
    }));
  };

  return {
    touchState,
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd
  };
};

// Swipeable Component
interface SwipeableProps {
  children: ReactNode;
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  onSwipeUp?: () => void;
  onSwipeDown?: () => void;
  threshold?: number;
  className?: string;
}

export const Swipeable: React.FC<SwipeableProps> = ({
  children,
  onSwipeLeft,
  onSwipeRight,
  onSwipeUp,
  onSwipeDown,
  threshold = 50,
  className = ''
}) => {
  const { addAnimation } = useAnimation();
  
  const { handleTouchStart, handleTouchMove, handleTouchEnd } = useTouchGestures({
    swipe: {
      threshold,
      onSwipe: (direction, distance) => {
        switch (direction) {
          case 'left':
            onSwipeLeft?.();
            break;
          case 'right':
            onSwipeRight?.();
            break;
          case 'up':
            onSwipeUp?.();
            break;
          case 'down':
            onSwipeDown?.();
            break;
        }
        
        // Add swipe animation
        addAnimation(`swipe-${direction}`, {
          type: 'slideInRight',
          duration: 'fast',
          easing: 'ease-out'
        });
      }
    }
  });

  return (
    <div
      className={`touch-none ${className}`}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {children}
    </div>
  );
};

// Pull to Refresh Component
interface PullToRefreshProps {
  children: ReactNode;
  onRefresh: () => Promise<void>;
  threshold?: number;
  className?: string;
}

export const PullToRefresh: React.FC<PullToRefreshProps> = ({
  children,
  onRefresh,
  threshold = 80,
  className = ''
}) => {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [pullDistance, setPullDistance] = useState(0);
  const { addAnimation } = useAnimation();

  const { handleTouchStart, handleTouchMove, handleTouchEnd } = useTouchGestures({
    pan: {
      onPan: (delta, velocity) => {
        if (delta.y > 0 && window.scrollY === 0) {
          const distance = Math.min(delta.y * 0.5, threshold * 1.5);
          setPullDistance(distance);
        }
      }
    }
  });

  const handleTouchEndWithRefresh = async (e: TouchEvent) => {
    handleTouchEnd(e);
    
    if (pullDistance >= threshold) {
      setIsRefreshing(true);
      addAnimation('refresh', {
        type: 'loading',
        duration: 'normal',
        easing: 'linear'
      });
      
      try {
        await onRefresh();
      } finally {
        setIsRefreshing(false);
        setPullDistance(0);
      }
    } else {
      setPullDistance(0);
    }
  };

  return (
    <div className={`relative ${className}`}>
      {/* Pull indicator */}
      <div
        className="absolute top-0 left-0 right-0 flex items-center justify-center bg-primary-50 dark:bg-primary-900/20 transition-all duration-300"
        style={{
          height: `${Math.min(pullDistance, threshold)}px`,
          transform: `translateY(${Math.min(pullDistance - threshold, 0)}px)`
        }}
      >
        {isRefreshing ? (
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-600"></div>
        ) : (
          <div className="text-primary-600 text-sm font-medium">
            {pullDistance >= threshold ? 'Bırakın...' : 'Yenilemek için çekin...'}
          </div>
        )}
      </div>

      {/* Content */}
      <div
        className="transition-transform duration-300"
        style={{
          transform: `translateY(${Math.min(pullDistance, threshold)}px)`
        }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEndWithRefresh}
      >
        {children}
      </div>
    </div>
  );
};

// Touch Feedback Component
interface TouchFeedbackProps {
  children: ReactNode;
  feedback?: 'scale' | 'ripple' | 'glow' | 'none';
  className?: string;
  onClick?: () => void;
}

export const TouchFeedback: React.FC<TouchFeedbackProps> = ({
  children,
  feedback = 'scale',
  className = '',
  onClick
}) => {
  const [isPressed, setIsPressed] = useState(false);
  const { addAnimation } = useAnimation();

  const handleTouchStart = () => {
    setIsPressed(true);
    
    if (feedback === 'ripple') {
      addAnimation('ripple', {
        type: 'scaleIn',
        duration: 'fast',
        easing: 'ease-out'
      });
    }
  };

  const handleTouchEnd = () => {
    setIsPressed(false);
    onClick?.();
  };

  const getFeedbackClasses = () => {
    switch (feedback) {
      case 'scale':
        return isPressed ? 'scale-95' : 'scale-100';
      case 'ripple':
        return 'relative overflow-hidden';
      case 'glow':
        return isPressed ? 'shadow-glow' : 'shadow-none';
      default:
        return '';
    }
  };

  return (
    <div
      className={`transition-all duration-150 ${getFeedbackClasses()} ${className}`}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      onMouseDown={handleTouchStart}
      onMouseUp={handleTouchEnd}
      onMouseLeave={() => setIsPressed(false)}
    >
      {children}
      
      {/* Ripple effect */}
      {feedback === 'ripple' && isPressed && (
        <div className="absolute inset-0 bg-white/20 rounded-full animate-ping"></div>
      )}
    </div>
  );
};

// Mobile Navigation Component
interface MobileNavigationProps {
  children: ReactNode;
  isOpen: boolean;
  onClose: () => void;
  position?: 'left' | 'right' | 'top' | 'bottom';
  className?: string;
}

export const MobileNavigation: React.FC<MobileNavigationProps> = ({
  children,
  isOpen,
  onClose,
  position = 'left',
  className = ''
}) => {
  const { addAnimation } = useAnimation();

  useEffect(() => {
    if (isOpen) {
      addAnimation('mobile-nav-open', {
        type: 'slideInLeft',
        duration: 'normal',
        easing: 'ease-out'
      });
    }
  }, [isOpen, addAnimation]);

  const getPositionClasses = () => {
    switch (position) {
      case 'left':
        return 'left-0 top-0 h-full w-80';
      case 'right':
        return 'right-0 top-0 h-full w-80';
      case 'top':
        return 'top-0 left-0 w-full h-64';
      case 'bottom':
        return 'bottom-0 left-0 w-full h-64';
      default:
        return 'left-0 top-0 h-full w-80';
    }
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 z-40"
        onClick={onClose}
      />
      
      {/* Navigation */}
      <div
        className={`fixed ${getPositionClasses()} bg-white dark:bg-gray-800 shadow-strong z-50 ${className}`}
      >
        {children}
      </div>
    </>
  );
};

// Haptic Feedback Hook
export const useHapticFeedback = () => {
  const triggerHaptic = (type: 'light' | 'medium' | 'heavy' = 'light') => {
    if ('vibrate' in navigator) {
      const patterns = {
        light: [10],
        medium: [20],
        heavy: [30]
      };
      navigator.vibrate(patterns[type]);
    }
  };

  return { triggerHaptic };
};

// Touch Optimized Input Component
interface TouchInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  feedback?: boolean;
}

export const TouchInput: React.FC<TouchInputProps> = ({
  label,
  error,
  feedback = true,
  className = '',
  ...props
}) => {

  const handleFocus = () => {
    if (feedback && 'vibrate' in navigator) {
      navigator.vibrate([10]);
    }
  };

  return (
    <div className="space-y-2">
      {label && (
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          {label}
        </label>
      )}
      
      <TouchFeedback feedback="glow">
        <input
          className={`
            w-full px-4 py-3 text-base border border-gray-300 dark:border-gray-600
            rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100
            focus:ring-2 focus:ring-primary-500 focus:border-transparent
            transition-all duration-200
            ${error ? 'border-error-500 focus:ring-error-500' : ''}
            ${className}
          `}
          onFocus={handleFocus}
          {...props}
        />
      </TouchFeedback>
      
      {error && (
        <p className="text-sm text-error-600 dark:text-error-400">
          {error}
        </p>
      )}
    </div>
  );
};

export default TouchFeedback;
