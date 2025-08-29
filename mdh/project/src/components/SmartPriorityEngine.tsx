import React, { useState, useEffect } from 'react';
import { 
  Brain, 
  Target, 
  Clock, 
  AlertTriangle, 
  CheckCircle, 
  TrendingUp,
  BarChart3,
  Settings,
  RefreshCw,
  Eye,
  Zap,
  Star,
  User,
  DollarSign,
  Gauge,
  Shield,
  Timer
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { supabase } from '../lib/supabase';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';

interface SmartPriorityEngineProps {
  ticketId: string;
  ticketData: any;
  customerData: any;
  agentData?: any;
  onPriorityUpdate?: (priority: string, confidence: number, factors: any) => void;
  showDetails?: boolean;
  className?: string;
}

interface PriorityCalculation {
  calculated_priority: string;
  confidence_score: number;
  factors: {
    business_impact: number;
    customer_value: number;
    urgency: number;
    complexity: number;
    resource_availability: number;
    sla_risk: number;
    weights: {
      business_impact: number;
      customer_value: number;
      urgency: number;
      complexity: number;
      resource_availability: number;
      sla_risk: number;
    };
  };
  final_score: number;
}

interface SLATracking {
  id: string;
  sla_type: string;
  priority_level: string;
  deadline: string;
  escalation_level: number;
  is_active: boolean;
}

const SmartPriorityEngine: React.FC<SmartPriorityEngineProps> = ({
  ticketId,
  ticketData,
  customerData,
  agentData,
  onPriorityUpdate,
  showDetails = false,
  className = ''
}) => {
  const [calculation, setCalculation] = useState<PriorityCalculation | null>(null);
  const [slaTracking, setSlaTracking] = useState<SLATracking | null>(null);
  const [isCalculating, setIsCalculating] = useState(false);
  const [showFactorDetails, setShowFactorDetails] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState<string>('');

  // Öncelik hesaplama
  const calculatePriority = async () => {
    setIsCalculating(true);
    try {
      const { data, error } = await supabase
        .rpc('calculate_smart_priority', { p_ticket_id: ticketId });

      if (error) throw error;

      setCalculation(data);
      
      // SLA bilgilerini al
      const { data: slaData } = await supabase
        .from('sla_tracking')
        .select('*')
        .eq('ticket_id', ticketId)
        .eq('is_active', true)
        .single();

      setSlaTracking(slaData);

      // Callback ile öncelik güncelleme
      if (onPriorityUpdate && data) {
        onPriorityUpdate(
          data.calculated_priority,
          data.confidence_score,
          data.factors
        );
      }

      toast.success('Öncelik başarıyla hesaplandı');
    } catch (error) {
      console.error('Öncelik hesaplama hatası:', error);
      toast.error('Öncelik hesaplanırken hata oluştu');
    } finally {
      setIsCalculating(false);
    }
  };

  // Kalan süre hesaplama
  useEffect(() => {
    if (slaTracking?.deadline) {
      const updateTimeRemaining = () => {
        const now = new Date().getTime();
        const deadline = new Date(slaTracking.deadline).getTime();
        const diff = deadline - now;

        if (diff <= 0) {
          setTimeRemaining('Süre doldu');
        } else {
          const hours = Math.floor(diff / (1000 * 60 * 60));
          const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
          setTimeRemaining(`${hours}s ${minutes}dk`);
        }
      };

      updateTimeRemaining();
      const interval = setInterval(updateTimeRemaining, 60000); // Her dakika güncelle

      return () => clearInterval(interval);
    }
  }, [slaTracking]);

  // İlk yüklemede hesaplama yap
  useEffect(() => {
    if (ticketId) {
      calculatePriority();
    }
  }, [ticketId]);

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'text-red-600 bg-red-100 dark:bg-red-900/20 dark:text-red-400';
      case 'urgent': return 'text-orange-600 bg-orange-100 dark:bg-orange-900/20 dark:text-orange-400';
      case 'high': return 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900/20 dark:text-yellow-400';
      case 'medium': return 'text-blue-600 bg-blue-100 dark:bg-blue-900/20 dark:text-blue-400';
      case 'low': return 'text-green-600 bg-green-100 dark:bg-green-900/20 dark:text-green-400';
      default: return 'text-gray-600 bg-gray-100 dark:bg-gray-900/20 dark:text-gray-400';
    }
  };

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'critical': return <AlertTriangle className="w-4 h-4" />;
      case 'urgent': return <Zap className="w-4 h-4" />;
      case 'high': return <TrendingUp className="w-4 h-4" />;
      case 'medium': return <Clock className="w-4 h-4" />;
      case 'low': return <CheckCircle className="w-4 h-4" />;
      default: return <Target className="w-4 h-4" />;
    }
  };

  const getConfidenceColor = (score: number) => {
    if (score >= 90) return 'text-green-600';
    if (score >= 80) return 'text-blue-600';
    if (score >= 70) return 'text-yellow-600';
    return 'text-red-600';
  };

  const renderFactorBar = (factor: string, score: number, weight: number) => {
    const percentage = (score / 5) * 100;
    const weightPercentage = weight * 100;
    
    return (
      <div key={factor} className="mb-3">
        <div className="flex justify-between items-center mb-1">
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300 capitalize">
            {factor.replace('_', ' ')}
          </span>
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-500">{score}/5</span>
            <span className="text-xs text-blue-500">({weightPercentage}%)</span>
          </div>
        </div>
        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
          <div 
            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
            style={{ width: `${percentage}%` }}
          />
        </div>
      </div>
    );
  };

  if (!calculation) {
    return (
      <div className={`bg-white dark:bg-gray-800 rounded-lg p-4 ${className}`}>
        <div className="flex items-center justify-center">
          <RefreshCw className="w-5 h-5 animate-spin text-blue-600" />
          <span className="ml-2 text-gray-600 dark:text-gray-400">Öncelik hesaplanıyor...</span>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 ${className}`}>
      {/* Ana Öncelik Göstergesi */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${getPriorityColor(calculation.calculated_priority)}`}>
              {getPriorityIcon(calculation.calculated_priority)}
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white capitalize">
                {calculation.calculated_priority} Öncelik
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Skor: {calculation.final_score.toFixed(2)}/5.0
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="text-right">
              <div className={`text-sm font-medium ${getConfidenceColor(calculation.confidence_score)}`}>
                %{calculation.confidence_score} Güven
              </div>
              <div className="text-xs text-gray-500">AI Tahmini</div>
            </div>
            
            <button
              onClick={calculatePriority}
              disabled={isCalculating}
              className="p-2 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
            >
              <RefreshCw className={`w-4 h-4 ${isCalculating ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>
      </div>

      {/* SLA Bilgisi */}
      {slaTracking && (
        <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-blue-50 dark:bg-blue-900/10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Timer className="w-4 h-4 text-blue-600" />
              <span className="text-sm font-medium text-blue-800 dark:text-blue-300">
                SLA Takibi
              </span>
            </div>
            <div className="text-right">
              <div className="text-sm font-medium text-gray-900 dark:text-white">
                {timeRemaining}
              </div>
              <div className="text-xs text-gray-500">
                {format(new Date(slaTracking.deadline), 'dd MMM HH:mm', { locale: tr })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Faktör Detayları */}
      {showDetails && (
        <div className="p-4">
          <div className="flex items-center justify-between mb-4">
            <h4 className="font-medium text-gray-900 dark:text-white flex items-center gap-2">
              <BarChart3 className="w-4 h-4" />
              Öncelik Faktörleri
            </h4>
            <button
              onClick={() => setShowFactorDetails(!showFactorDetails)}
              className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
            >
              {showFactorDetails ? 'Gizle' : 'Detaylar'}
            </button>
          </div>

          {showFactorDetails && (
            <div className="space-y-4">
              {renderFactorBar('business_impact', calculation.factors.business_impact, calculation.factors.weights.business_impact)}
              {renderFactorBar('customer_value', calculation.factors.customer_value, calculation.factors.weights.customer_value)}
              {renderFactorBar('urgency', calculation.factors.urgency, calculation.factors.weights.urgency)}
              {renderFactorBar('complexity', calculation.factors.complexity, calculation.factors.weights.complexity)}
              {renderFactorBar('resource_availability', calculation.factors.resource_availability, calculation.factors.weights.resource_availability)}
              {renderFactorBar('sla_risk', calculation.factors.sla_risk, calculation.factors.weights.sla_risk)}
            </div>
          )}

          {/* Hızlı Bilgiler */}
          <div className="grid grid-cols-2 gap-4 mt-4">
            <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3">
              <div className="flex items-center gap-2 mb-1">
                <User className="w-4 h-4 text-gray-500" />
                <span className="text-xs text-gray-500">Müşteri Değeri</span>
              </div>
              <div className="text-sm font-medium text-gray-900 dark:text-white">
                {customerData?.satisfaction_score || 'N/A'}/10
              </div>
            </div>
            
            <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3">
              <div className="flex items-center gap-2 mb-1">
                <DollarSign className="w-4 h-4 text-gray-500" />
                <span className="text-xs text-gray-500">Toplam Harcama</span>
              </div>
              <div className="text-sm font-medium text-gray-900 dark:text-white">
                {customerData?.total_spent ? `${customerData.total_spent}₺` : 'N/A'}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SmartPriorityEngine;
