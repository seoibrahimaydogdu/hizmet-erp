import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useUIUX } from '../../contexts/UIUXContext';

// Animation Types
export type AnimationType = 
  | 'fadeIn' | 'fadeOut' | 'fadeInUp' | 'fadeInDown' | 'fadeInLeft' | 'fadeInRight'
  | 'slideInUp' | 'slideInDown' | 'slideInLeft' | 'slideInRight'
  | 'scaleIn' | 'scaleOut' | 'bounceIn' | 'bounceOut'
  | 'rotateIn' | 'rotateOut' | 'flipInX' | 'flipInY'
  | 'zoomIn' | 'zoomOut' | 'pulse' | 'shake' | 'wiggle'
  | 'typing' | 'loading' | 'success' | 'error' | 'warning';

export type AnimationDuration = 'fast' | 'normal' | 'slow' | 'slower';
export type AnimationEasing = 'ease' | 'ease-in' | 'ease-out' | 'ease-in-out' | 'linear' | 'bounce' | 'elastic';

export interface AnimationConfig {
  type: AnimationType;
  duration?: AnimationDuration;
  delay?: number;
  easing?: AnimationEasing;
  iterationCount?: number | 'infinite';
  direction?: 'normal' | 'reverse' | 'alternate' | 'alternate-reverse';
  fillMode?: 'none' | 'forwards' | 'backwards' | 'both';
  onStart?: () => void;
  onEnd?: () => void;
}

export interface AnimationContextType {
  isAnimating: boolean;
  animationQueue: string[];
  addAnimation: (id: string, config: AnimationConfig) => void;
  removeAnimation: (id: string) => void;
  clearAnimations: () => void;
  getAnimationClass: (config: AnimationConfig) => string;
  createTransition: (config: AnimationConfig) => string;
}

const AnimationContext = createContext<AnimationContextType | undefined>(undefined);

export const useAnimation = () => {
  const context = useContext(AnimationContext);
  if (context === undefined) {
    throw new Error('useAnimation must be used within an AnimationProvider');
  }
  return context;
};

interface AnimationProviderProps {
  children: ReactNode;
}

export const AnimationProvider: React.FC<AnimationProviderProps> = ({ children }) => {
  const { settings } = useUIUX();
  const [isAnimating, setIsAnimating] = useState(false);
  const [animationQueue, setAnimationQueue] = useState<string[]>([]);
  const [activeAnimations, setActiveAnimations] = useState<Map<string, AnimationConfig>>(new Map());

  // Animation CSS sınıflarını oluştur
  const getAnimationClass = (config: AnimationConfig): string => {
    const { type, duration = 'normal', easing = 'ease-in-out' } = config;
    
    const durationMap = {
      fast: '0.15s',
      normal: '0.3s',
      slow: '0.5s',
      slower: '0.8s'
    };

    const easingMap = {
      ease: 'ease',
      'ease-in': 'ease-in',
      'ease-out': 'ease-out',
      'ease-in-out': 'ease-in-out',
      linear: 'linear',
      bounce: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
      elastic: 'cubic-bezier(0.175, 0.885, 0.32, 1.275)'
    };

    const baseClass = `animate-${type}`;
    const durationClass = `duration-${duration}`;
    const easingClass = `ease-${easing.replace('-', '')}`;

    return `${baseClass} ${durationClass} ${easingClass}`;
  };

  // Transition CSS oluştur
  const createTransition = (config: AnimationConfig): string => {
    const { duration = 'normal', easing = 'ease-in-out' } = config;
    
    const durationMap = {
      fast: '0.15s',
      normal: '0.3s',
      slow: '0.5s',
      slower: '0.8s'
    };

    const easingMap = {
      ease: 'ease',
      'ease-in': 'ease-in',
      'ease-out': 'ease-out',
      'ease-in-out': 'ease-in-out',
      linear: 'linear',
      bounce: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
      elastic: 'cubic-bezier(0.175, 0.885, 0.32, 1.275)'
    };

    return `transition-all ${durationMap[duration]} ${easingMap[easing]}`;
  };

  // Animasyon ekle
  const addAnimation = (id: string, config: AnimationConfig) => {
    setActiveAnimations(prev => new Map(prev.set(id, config)));
    setAnimationQueue(prev => [...prev, id]);
    
    if (config.onStart) {
      config.onStart();
    }

    // Animasyon süresini hesapla ve kuyruktan çıkar
    const durationMap = {
      fast: 150,
      normal: 300,
      slow: 500,
      slower: 800
    };

    const totalDuration = (durationMap[config.duration || 'normal']) + (config.delay || 0);

    setTimeout(() => {
      removeAnimation(id);
      if (config.onEnd) {
        config.onEnd();
      }
    }, totalDuration);
  };

  // Animasyon kaldır
  const removeAnimation = (id: string) => {
    setActiveAnimations(prev => {
      const newMap = new Map(prev);
      newMap.delete(id);
      return newMap;
    });
    setAnimationQueue(prev => prev.filter(animId => animId !== id));
  };

  // Tüm animasyonları temizle
  const clearAnimations = () => {
    setActiveAnimations(new Map());
    setAnimationQueue([]);
  };

  // Animasyon durumunu güncelle
  useEffect(() => {
    setIsAnimating(activeAnimations.size > 0);
  }, [activeAnimations]);

  // Reduced motion kontrolü
  useEffect(() => {
    if (settings.reducedMotion) {
      clearAnimations();
    }
  }, [settings.reducedMotion]);

  return (
    <AnimationContext.Provider value={{
      isAnimating,
      animationQueue,
      addAnimation,
      removeAnimation,
      clearAnimations,
      getAnimationClass,
      createTransition
    }}>
      {children}
    </AnimationContext.Provider>
  );
};

// Animation Components
interface AnimatedComponentProps {
  children: ReactNode;
  animation: AnimationConfig;
  className?: string;
  style?: React.CSSProperties;
  onAnimationStart?: () => void;
  onAnimationEnd?: () => void;
}

export const AnimatedComponent: React.FC<AnimatedComponentProps> = ({
  children,
  animation,
  className = '',
  style = {},
  onAnimationStart,
  onAnimationEnd
}) => {
  const { getAnimationClass, createTransition } = useAnimation();
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(true);
      onAnimationStart?.();
    }, animation.delay || 0);

    return () => clearTimeout(timer);
  }, [animation.delay, onAnimationStart]);

  const animationClass = getAnimationClass(animation);
  const transitionClass = createTransition(animation);

  return (
    <div
      className={`${animationClass} ${transitionClass} ${className}`}
      style={{
        ...style,
        opacity: isVisible ? 1 : 0,
        transform: isVisible ? 'translateY(0)' : 'translateY(20px)'
      }}
      onAnimationEnd={onAnimationEnd}
    >
      {children}
    </div>
  );
};

// Page Transition Component
interface PageTransitionProps {
  children: ReactNode;
  direction?: 'left' | 'right' | 'up' | 'down';
  duration?: AnimationDuration;
}

export const PageTransition: React.FC<PageTransitionProps> = ({
  children,
  direction = 'right',
  duration = 'normal'
}) => {
  const [isEntering, setIsEntering] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsEntering(false);
    }, 50);

    return () => clearTimeout(timer);
  }, []);

  const getDirectionClass = () => {
    switch (direction) {
      case 'left': return 'translate-x-full';
      case 'right': return '-translate-x-full';
      case 'up': return 'translate-y-full';
      case 'down': return '-translate-y-full';
      default: return '-translate-x-full';
    }
  };

  const durationClass = {
    fast: 'duration-150',
    normal: 'duration-300',
    slow: 'duration-500',
    slower: 'duration-800'
  }[duration];

  return (
    <div
      className={`transform transition-transform ${durationClass} ease-in-out ${
        isEntering ? getDirectionClass() : 'translate-x-0'
      }`}
    >
      {children}
    </div>
  );
};

// Stagger Animation Component
interface StaggerAnimationProps {
  children: ReactNode[];
  staggerDelay?: number;
  animation: AnimationConfig;
  className?: string;
}

export const StaggerAnimation: React.FC<StaggerAnimationProps> = ({
  children,
  staggerDelay = 100,
  animation,
  className = ''
}) => {
  return (
    <div className={className}>
      {children.map((child, index) => (
        <AnimatedComponent
          key={index}
          animation={{
            ...animation,
            delay: (animation.delay || 0) + (index * staggerDelay)
          }}
        >
          {child}
        </AnimatedComponent>
      ))}
    </div>
  );
};

export default AnimationProvider;
