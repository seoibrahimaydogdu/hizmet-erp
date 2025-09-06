import React, { useState, useEffect, useRef, ReactNode } from 'react';
import { useUIUX } from '../../contexts/UIUXContext';
import { useAnimation } from './AnimationSystem';
import { TouchFeedback } from './TouchInteractions';
import { 
  ChevronLeft, ChevronRight, X, Check, Star, 
  ArrowRight, ArrowLeft, Play, Pause, SkipForward,
  HelpCircle, Lightbulb, Target, Zap, Shield, Heart
} from 'lucide-react';

// Tour Types
export type TourType = 'onboarding' | 'feature' | 'help' | 'announcement' | 'tutorial';

export type TourPosition = 'top' | 'bottom' | 'left' | 'right' | 'center';

export type TourTrigger = 'manual' | 'auto' | 'onboarding' | 'feature-first-use' | 'periodic';

// Tour Step
export interface TourStep {
  id: string;
  title: string;
  content: string;
  target?: string; // CSS selector
  position?: TourPosition;
  action?: {
    type: 'click' | 'input' | 'scroll' | 'wait';
    selector?: string;
    value?: string;
    duration?: number;
  };
  media?: {
    type: 'image' | 'video' | 'gif';
    src: string;
    alt?: string;
  };
  interactive?: boolean;
  skipable?: boolean;
  required?: boolean;
}

// Tour Configuration
export interface TourConfig {
  id: string;
  name: string;
  description?: string;
  type: TourType;
  trigger: TourTrigger;
  steps: TourStep[];
  settings?: {
    showProgress?: boolean;
    showSkip?: boolean;
    autoAdvance?: boolean;
    autoAdvanceDelay?: number;
    allowKeyboardNavigation?: boolean;
    showTooltips?: boolean;
    theme?: 'light' | 'dark' | 'auto';
  };
  conditions?: {
    userRole?: string[];
    featureFlags?: string[];
    completedTours?: string[];
    skipConditions?: string[];
  };
}

// Tour State
export interface TourState {
  isActive: boolean;
  currentStep: number;
  isPaused: boolean;
  isCompleted: boolean;
  startTime: number;
  endTime?: number;
  skippedSteps: number[];
  userInteractions: {
    stepId: string;
    action: string;
    timestamp: number;
  }[];
}

// Tour Context
interface TourContextType {
  activeTour: TourConfig | null;
  tourState: TourState;
  startTour: (tourId: string) => void;
  endTour: () => void;
  nextStep: () => void;
  previousStep: () => void;
  skipStep: () => void;
  pauseTour: () => void;
  resumeTour: () => void;
  completeTour: () => void;
  updateTourState: (state: Partial<TourState>) => void;
}

// Tour Provider
export const TourProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [activeTour, setActiveTour] = useState<TourConfig | null>(null);
  const [tourState, setTourState] = useState<TourState>({
    isActive: false,
    currentStep: 0,
    isPaused: false,
    isCompleted: false,
    startTime: 0,
    skippedSteps: [],
    userInteractions: []
  });

  const startTour = (tourId: string) => {
    // Tour configuration would be loaded from a service
    const tour: TourConfig = {
      id: tourId,
      name: 'Demo Tour',
      type: 'onboarding',
      trigger: 'manual',
      steps: []
    };
    
    setActiveTour(tour);
    setTourState({
      isActive: true,
      currentStep: 0,
      isPaused: false,
      isCompleted: false,
      startTime: Date.now(),
      skippedSteps: [],
      userInteractions: []
    });
  };

  const endTour = () => {
    setActiveTour(null);
    setTourState(prev => ({
      ...prev,
      isActive: false,
      endTime: Date.now()
    }));
  };

  const nextStep = () => {
    if (activeTour && tourState.currentStep < activeTour.steps.length - 1) {
      setTourState(prev => ({
        ...prev,
        currentStep: prev.currentStep + 1
      }));
    } else {
      completeTour();
    }
  };

  const previousStep = () => {
    if (tourState.currentStep > 0) {
      setTourState(prev => ({
        ...prev,
        currentStep: prev.currentStep - 1
      }));
    }
  };

  const skipStep = () => {
    setTourState(prev => ({
      ...prev,
      skippedSteps: [...prev.skippedSteps, prev.currentStep]
    }));
    nextStep();
  };

  const pauseTour = () => {
    setTourState(prev => ({ ...prev, isPaused: true }));
  };

  const resumeTour = () => {
    setTourState(prev => ({ ...prev, isPaused: false }));
  };

  const completeTour = () => {
    setTourState(prev => ({
      ...prev,
      isCompleted: true,
      endTime: Date.now()
    }));
    setTimeout(endTour, 1000);
  };

  const updateTourState = (state: Partial<TourState>) => {
    setTourState(prev => ({ ...prev, ...state }));
  };

  return (
    <TourContext.Provider value={{
      activeTour,
      tourState,
      startTour,
      endTour,
      nextStep,
      previousStep,
      skipStep,
      pauseTour,
      resumeTour,
      completeTour,
      updateTourState
    }}>
      {children}
    </TourContext.Provider>
  );
};

const TourContext = React.createContext<TourContextType | undefined>(undefined);

export const useTour = () => {
  const context = React.useContext(TourContext);
  if (context === undefined) {
    throw new Error('useTour must be used within a TourProvider');
  }
  return context;
};

// Tour Overlay Component
interface TourOverlayProps {
  step: TourStep;
  position: TourPosition;
  onNext: () => void;
  onPrevious: () => void;
  onSkip: () => void;
  onClose: () => void;
  progress: { current: number; total: number };
  settings?: TourConfig['settings'];
}

export const TourOverlay: React.FC<TourOverlayProps> = ({
  step,
  position,
  onNext,
  onPrevious,
  onSkip,
  onClose,
  progress,
  settings = {}
}) => {
  const { addAnimation } = useAnimation();
  const [targetElement, setTargetElement] = useState<HTMLElement | null>(null);
  const overlayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (step.target) {
      const element = document.querySelector(step.target) as HTMLElement;
      setTargetElement(element);
    }
  }, [step.target]);

  useEffect(() => {
    addAnimation('tour-step', {
      type: 'fadeInUp',
      duration: 'normal',
      easing: 'ease-out'
    });
  }, [step.id, addAnimation]);

  const getPositionClasses = () => {
    switch (position) {
      case 'top': return 'bottom-full left-1/2 transform -translate-x-1/2 mb-4';
      case 'bottom': return 'top-full left-1/2 transform -translate-x-1/2 mt-4';
      case 'left': return 'right-full top-1/2 transform -translate-y-1/2 mr-4';
      case 'right': return 'left-full top-1/2 transform -translate-y-1/2 ml-4';
      case 'center': return 'top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2';
      default: return 'bottom-full left-1/2 transform -translate-x-1/2 mb-4';
    }
  };

  const getArrowClasses = () => {
    switch (position) {
      case 'top': return 'top-full left-1/2 transform -translate-x-1/2 border-t-primary-500';
      case 'bottom': return 'bottom-full left-1/2 transform -translate-x-1/2 border-b-primary-500';
      case 'left': return 'left-full top-1/2 transform -translate-y-1/2 border-l-primary-500';
      case 'right': return 'right-full top-1/2 transform -translate-y-1/2 border-r-primary-500';
      default: return 'top-full left-1/2 transform -translate-x-1/2 border-t-primary-500';
    }
  };

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/50 z-50" />
      
      {/* Target Highlight */}
      {targetElement && (
        <div
          className="fixed z-50 border-2 border-primary-500 rounded-lg pointer-events-none"
          style={{
            left: targetElement.offsetLeft - 4,
            top: targetElement.offsetTop - 4,
            width: targetElement.offsetWidth + 8,
            height: targetElement.offsetHeight + 8
          }}
        />
      )}

      {/* Tour Content */}
      <div
        ref={overlayRef}
        className={`fixed z-50 max-w-sm bg-white dark:bg-gray-800 rounded-xl shadow-strong border border-gray-200 dark:border-gray-700 ${getPositionClasses()}`}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-primary-100 dark:bg-primary-900 rounded-full flex items-center justify-center">
              <Lightbulb className="w-4 h-4 text-primary-600 dark:text-primary-400" />
            </div>
            <h3 className="font-semibold text-gray-900 dark:text-gray-100">
              {step.title}
            </h3>
          </div>
          
          <div className="flex items-center gap-2">
            {settings.showProgress && (
              <div className="text-xs text-gray-500 dark:text-gray-400">
                {progress.current}/{progress.total}
              </div>
            )}
            
            <TouchFeedback feedback="scale">
              <button
                onClick={onClose}
                className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <X className="w-4 h-4" />
              </button>
            </TouchFeedback>
          </div>
        </div>

        {/* Content */}
        <div className="p-4">
          {/* Media */}
          {step.media && (
            <div className="mb-4">
              {step.media.type === 'image' && (
                <img
                  src={step.media.src}
                  alt={step.media.alt || step.title}
                  className="w-full h-32 object-cover rounded-lg"
                />
              )}
              {step.media.type === 'video' && (
                <video
                  src={step.media.src}
                  className="w-full h-32 object-cover rounded-lg"
                  controls
                />
              )}
              {step.media.type === 'gif' && (
                <img
                  src={step.media.src}
                  alt={step.media.alt || step.title}
                  className="w-full h-32 object-cover rounded-lg"
                />
              )}
            </div>
          )}

          {/* Text Content */}
          <p className="text-gray-700 dark:text-gray-300 mb-4">
            {step.content}
          </p>

          {/* Interactive Elements */}
          {step.interactive && (
            <div className="mb-4 p-3 bg-primary-50 dark:bg-primary-900/20 rounded-lg">
              <p className="text-sm text-primary-700 dark:text-primary-300">
                💡 Bu adımı tamamlamak için gerekli işlemi yapın
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-4 border-t border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-2">
            {progress.current > 1 && (
              <TouchFeedback feedback="scale">
                <button
                  onClick={onPrevious}
                  className="flex items-center gap-1 px-3 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 transition-colors"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Önceki
                </button>
              </TouchFeedback>
            )}
          </div>

          <div className="flex items-center gap-2">
            {settings.showSkip && step.skipable && (
              <TouchFeedback feedback="scale">
                <button
                  onClick={onSkip}
                  className="px-3 py-2 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
                >
                  Atlama
                </button>
              </TouchFeedback>
            )}
            
            <TouchFeedback feedback="scale">
              <button
                onClick={onNext}
                className="flex items-center gap-1 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
              >
                {progress.current === progress.total ? 'Tamamla' : 'Sonraki'}
                {progress.current < progress.total && <ArrowRight className="w-4 h-4" />}
                {progress.current === progress.total && <Check className="w-4 h-4" />}
              </button>
            </TouchFeedback>
          </div>
        </div>

        {/* Arrow */}
        <div
          className={`absolute w-0 h-0 border-8 border-transparent ${getArrowClasses()}`}
        />
      </div>
    </>
  );
};

// Tour Progress Component
interface TourProgressProps {
  progress: { current: number; total: number };
  className?: string;
}

export const TourProgress: React.FC<TourProgressProps> = ({
  progress,
  className = ''
}) => {
  const percentage = (progress.current / progress.total) * 100;

  return (
    <div className={`w-full ${className}`}>
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
          İlerleme
        </span>
        <span className="text-sm text-gray-500 dark:text-gray-400">
          {progress.current}/{progress.total}
        </span>
      </div>
      
      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
        <div
          className="bg-primary-600 h-2 rounded-full transition-all duration-300 ease-out"
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
};

// Tour Launcher Component
interface TourLauncherProps {
  tours: TourConfig[];
  className?: string;
}

export const TourLauncher: React.FC<TourLauncherProps> = ({
  tours,
  className = ''
}) => {
  const { startTour } = useTour();
  const { addAnimation } = useAnimation();

  const getTourIcon = (type: TourType) => {
    switch (type) {
      case 'onboarding': return <Star className="w-5 h-5 text-yellow-500" />;
      case 'feature': return <Zap className="w-5 h-5 text-blue-500" />;
      case 'help': return <HelpCircle className="w-5 h-5 text-green-500" />;
      case 'announcement': return <Target className="w-5 h-5 text-red-500" />;
      case 'tutorial': return <Play className="w-5 h-5 text-purple-500" />;
      default: return <Lightbulb className="w-5 h-5 text-gray-500" />;
    }
  };

  const handleStartTour = (tourId: string) => {
    startTour(tourId);
    addAnimation('tour-start', {
      type: 'bounceIn',
      duration: 'normal',
      easing: 'bounce'
    });
  };

  return (
    <div className={`bg-white dark:bg-gray-800 rounded-xl shadow-soft border border-gray-200 dark:border-gray-700 p-6 ${className}`}>
      <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
        Tur Rehberleri
      </h3>
      
      <div className="space-y-3">
        {tours.map((tour) => (
          <TouchFeedback key={tour.id} feedback="scale">
            <button
              onClick={() => handleStartTour(tour.id)}
              className="w-full flex items-center gap-3 p-3 border border-gray-200 dark:border-gray-600 rounded-lg hover:border-primary-500 hover:bg-primary-50 dark:hover:bg-primary-900/20 transition-all duration-200"
            >
              {getTourIcon(tour.type)}
              
              <div className="flex-1 text-left">
                <h4 className="font-medium text-gray-900 dark:text-gray-100">
                  {tour.name}
                </h4>
                {tour.description && (
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {tour.description}
                  </p>
                )}
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-xs text-gray-400 dark:text-gray-500">
                    {tour.steps.length} adım
                  </span>
                  <span className="text-xs text-gray-400 dark:text-gray-500">
                    •
                  </span>
                  <span className="text-xs text-gray-400 dark:text-gray-500">
                    {tour.type}
                  </span>
                </div>
              </div>
              
              <ArrowRight className="w-4 h-4 text-gray-400" />
            </button>
          </TouchFeedback>
        ))}
      </div>
    </div>
  );
};

// Tour Completion Celebration
interface TourCompletionProps {
  tourName: string;
  onClose: () => void;
}

export const TourCompletion: React.FC<TourCompletionProps> = ({
  tourName,
  onClose
}) => {
  const { addAnimation } = useAnimation();

  useEffect(() => {
    addAnimation('tour-completion', {
      type: 'bounceIn',
      duration: 'slow',
      easing: 'bounce'
    });
  }, [addAnimation]);

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-strong border border-gray-200 dark:border-gray-700 p-8 max-w-md w-full text-center">
        <div className="w-16 h-16 bg-success-100 dark:bg-success-900 rounded-full flex items-center justify-center mx-auto mb-4">
          <Check className="w-8 h-8 text-success-600 dark:text-success-400" />
        </div>
        
        <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-2">
          Tebrikler! 🎉
        </h3>
        
        <p className="text-gray-600 dark:text-gray-400 mb-6">
          <strong>{tourName}</strong> turunu başarıyla tamamladınız!
        </p>
        
        <div className="flex items-center justify-center gap-2 mb-6">
          {Array.from({ length: 5 }, (_, i) => (
            <Star key={i} className="w-5 h-5 text-yellow-400 fill-current" />
          ))}
        </div>
        
        <TouchFeedback feedback="scale">
          <button
            onClick={onClose}
            className="w-full px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
          >
            Devam Et
          </button>
        </TouchFeedback>
      </div>
    </div>
  );
};

export default TourProvider;
