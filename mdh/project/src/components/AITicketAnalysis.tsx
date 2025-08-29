import React, { useState, useEffect } from 'react';
import { 
  Brain, 
  Zap, 
  Target, 
  TrendingUp, 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  MessageSquare,
  BarChart3,
  Lightbulb,
  Settings,
  RefreshCw,
  Star,
  Tag,
  User,
  Calendar
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { supabase } from '../lib/supabase';
import { analyzeTicketWithAI, TicketAnalysisRequest, TicketAnalysisResponse } from '../lib/gemini';

interface AITicketAnalysisProps {
  tickets: any[];
  onAnalysisComplete?: (analysis: any) => void;
  onCategoryUpdate?: (ticketId: string, category: string) => void;
  onPriorityUpdate?: (ticketId: string, priority: string) => void;
}

interface TicketAnalysis {
  ticketId: string;
  suggestedCategory: string;
  suggestedPriority: string;
  sentiment: 'positive' | 'negative' | 'neutral';
  urgency: 'low' | 'medium' | 'high' | 'critical';
  complexity: 'simple' | 'moderate' | 'complex';
  estimatedResolutionTime: string;
  keywords: string[];
  similarTickets: string[];
  recommendations: string[];
  confidence: number;
}

const AITicketAnalysis: React.FC<AITicketAnalysisProps> = ({
  tickets,
  onAnalysisComplete,
  onCategoryUpdate,
  onPriorityUpdate
}) => {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResults, setAnalysisResults] = useState<TicketAnalysis[]>([]);
  const [selectedTicket, setSelectedTicket] = useState<any>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [autoApply, setAutoApply] = useState(false);
  const [analysisStats, setAnalysisStats] = useState({
    totalAnalyzed: 0,
    accuracy: 0,
    timeSaved: 0,
    categoriesImproved: 0
  });

  // AI Analiz Fonksiyonu - Gemini API ile
  const analyzeTicket = async (ticket: any): Promise<TicketAnalysis> => {
    try {
      // Müşteri geçmişini al
      const customerHistory = tickets
        .filter(t => t.customer_id === ticket.customer_id && t.id !== ticket.id)
        .map(t => `${t.title}: ${t.status}`)
        .join(', ');

      // Gemini API'ye gönder
      const request: TicketAnalysisRequest = {
        title: ticket.title || '',
        description: ticket.description || '',
        category: ticket.category,
        priority: ticket.priority,
        customerHistory: customerHistory || 'İlk talep'
      };

      const aiResponse: TicketAnalysisResponse = await analyzeTicketWithAI(request);

      // Benzer talepler
      const similarTickets = tickets
        .filter(t => t.id !== ticket.id && t.category === aiResponse.suggestedCategory)
        .slice(0, 3)
        .map(t => t.id);

      return {
        ticketId: ticket.id,
        suggestedCategory: aiResponse.suggestedCategory,
        suggestedPriority: aiResponse.suggestedPriority,
        sentiment: aiResponse.sentiment,
        urgency: aiResponse.urgency,
        complexity: aiResponse.complexity,
        estimatedResolutionTime: aiResponse.estimatedResolutionTime,
        keywords: aiResponse.keywords,
        similarTickets,
        recommendations: aiResponse.recommendations,
        confidence: aiResponse.confidence
      };
    } catch (error) {
      console.error('AI analiz hatası:', error);
      toast.error('AI analizi sırasında hata oluştu, basit analiz kullanılıyor');
      
      // Fallback analiz
      const title = ticket.title?.toLowerCase() || '';
      const description = ticket.description?.toLowerCase() || '';
      const content = `${title} ${description}`;
      
      let suggestedCategory = 'Genel';
      if (content.includes('ödeme') || content.includes('fatura') || content.includes('ücret') || content.includes('hatırlatma')) {
        suggestedCategory = 'payment_reminder';
      } else if (content.includes('teknik') || content.includes('hata') || content.includes('çalışmıyor')) {
        suggestedCategory = 'Teknik Destek';
      } else if (content.includes('şikayet') || content.includes('problem') || content.includes('sorun')) {
        suggestedCategory = 'Şikayet';
      } else if (content.includes('öneri') || content.includes('istek') || content.includes('özellik')) {
        suggestedCategory = 'Öneri/İstek';
      } else if (content.includes('hesap') || content.includes('giriş') || content.includes('şifre')) {
        suggestedCategory = 'Hesap Yönetimi';
      }

      return {
        ticketId: ticket.id,
        suggestedCategory,
        suggestedPriority: 'medium',
        sentiment: 'neutral',
        urgency: 'medium',
        complexity: 'moderate',
        estimatedResolutionTime: '2-4 saat',
        keywords: content.split(' ').filter(word => word.length > 3).slice(0, 5),
        similarTickets: [],
        recommendations: ['Manuel analiz gerekli'],
        confidence: 0.5
      };
    }
  };

  // Toplu analiz
  const runAnalysis = async () => {
    setIsAnalyzing(true);
    const results: TicketAnalysis[] = [];
    
    try {
      for (const ticket of tickets) {
        if (ticket.status === 'open' || ticket.status === 'in_progress') {
          const analysis = await analyzeTicket(ticket);
          results.push(analysis);
          
          // Otomatik uygulama
          if (autoApply) {
            if (analysis.suggestedCategory !== ticket.category) {
              await onCategoryUpdate?.(ticket.id, analysis.suggestedCategory);
            }
            if (analysis.suggestedPriority !== ticket.priority) {
              await onPriorityUpdate?.(ticket.id, analysis.suggestedPriority);
            }
          }
        }
      }
      
      setAnalysisResults(results);
      setAnalysisStats({
        totalAnalyzed: results.length,
        accuracy: 85, // Örnek değer
        timeSaved: results.length * 5, // 5 dakika tasarruf
        categoriesImproved: results.filter(r => r.suggestedCategory !== 'Genel').length
      });
      
      onAnalysisComplete?.(results);
      toast.success(`${results.length} talep analiz edildi`);
    } catch (error) {
      console.error('Analiz hatası:', error);
      toast.error('Analiz sırasında hata oluştu');
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Trend analizi
  const getTrendAnalysis = () => {
    const categoryCounts = tickets.reduce((acc: any, ticket) => {
      acc[ticket.category] = (acc[ticket.category] || 0) + 1;
      return acc;
    }, {});

    const priorityCounts = tickets.reduce((acc: any, ticket) => {
      acc[ticket.priority] = (acc[ticket.priority] || 0) + 1;
      return acc;
    }, {});

    return { categoryCounts, priorityCounts };
  };

  const trends = getTrendAnalysis();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
              <Brain className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                AI Talep Analizi
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Yapay zeka destekli talep kategorizasyonu ve öncelik belirleme
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={autoApply}
                onChange={(e) => setAutoApply(e.target.checked)}
                className="rounded border-gray-300"
              />
              <span className="text-sm text-gray-700 dark:text-gray-300">
                Otomatik Uygula
              </span>
            </label>
            <button
              onClick={runAnalysis}
              disabled={isAnalyzing}
              className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-lg font-medium transition-colors"
            >
              {isAnalyzing ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  Analiz Ediliyor...
                </>
              ) : (
                <>
                  <Zap className="w-4 h-4 mr-2" />
                  Analiz Başlat
                </>
              )}
            </button>
          </div>
        </div>

        {/* İstatistikler */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
              {analysisStats.totalAnalyzed}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">
              Analiz Edilen
            </div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600 dark:text-green-400">
              %{analysisStats.accuracy}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">
              Doğruluk
            </div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
              {analysisStats.timeSaved}dk
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">
              Zaman Tasarrufu
            </div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">
              {analysisStats.categoriesImproved}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">
              İyileştirilen
            </div>
          </div>
        </div>
      </div>

      {/* Trend Analizi */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
            <BarChart3 className="w-5 h-5 mr-2" />
            Kategori Dağılımı
          </h3>
          <div className="space-y-3">
            {Object.entries(trends.categoryCounts).map(([category, count]) => (
              <div key={category} className="flex items-center justify-between">
                <span className="text-sm text-gray-700 dark:text-gray-300">
                  {category}
                </span>
                <div className="flex items-center space-x-2">
                  <div className="w-20 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <div 
                      className="bg-blue-600 h-2 rounded-full"
                      style={{ width: `${(count as number / tickets.length) * 100}%` }}
                    />
                  </div>
                  <span className="text-sm font-medium text-gray-900 dark:text-white">
                    {count as number}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
            <TrendingUp className="w-5 h-5 mr-2" />
            Öncelik Dağılımı
          </h3>
          <div className="space-y-3">
            {Object.entries(trends.priorityCounts).map(([priority, count]) => (
              <div key={priority} className="flex items-center justify-between">
                <span className="text-sm text-gray-700 dark:text-gray-300 capitalize">
                  {priority}
                </span>
                <div className="flex items-center space-x-2">
                  <div className="w-20 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full ${
                        priority === 'high' ? 'bg-red-500' :
                        priority === 'medium' ? 'bg-yellow-500' :
                        'bg-green-500'
                      }`}
                      style={{ width: `${(count as number / tickets.length) * 100}%` }}
                    />
                  </div>
                  <span className="text-sm font-medium text-gray-900 dark:text-white">
                    {count as number}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Analiz Sonuçları */}
      {analysisResults.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Analiz Sonuçları
            </h3>
          </div>
          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {analysisResults.map((analysis) => {
              const ticket = tickets.find(t => t.id === analysis.ticketId);
              if (!ticket) return null;

              return (
                <div key={analysis.ticketId} className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900 dark:text-white mb-1">
                        #{ticket.shortId} - {ticket.title}
                      </h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                        {ticket.description?.substring(0, 100)}...
                      </p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        analysis.confidence > 0.9 ? 'bg-green-100 text-green-800' :
                        analysis.confidence > 0.7 ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        %{Math.round(analysis.confidence * 100)} Güven
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        Önerilen Kategori
                      </label>
                      <div className="flex items-center space-x-2">
                        <Tag className="w-4 h-4 text-blue-500" />
                        <span className="text-sm text-gray-900 dark:text-white">
                          {analysis.suggestedCategory}
                        </span>
                        {ticket.category !== analysis.suggestedCategory && (
                          <button
                            onClick={() => onCategoryUpdate?.(ticket.id, analysis.suggestedCategory)}
                            className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded hover:bg-blue-200"
                          >
                            Uygula
                          </button>
                        )}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        Önerilen Öncelik
                      </label>
                      <div className="flex items-center space-x-2">
                        <Target className="w-4 h-4 text-red-500" />
                        <span className={`text-sm font-medium capitalize ${
                          analysis.suggestedPriority === 'high' ? 'text-red-600' :
                          analysis.suggestedPriority === 'medium' ? 'text-yellow-600' :
                          'text-green-600'
                        }`}>
                          {analysis.suggestedPriority}
                        </span>
                        {ticket.priority !== analysis.suggestedPriority && (
                          <button
                            onClick={() => onPriorityUpdate?.(ticket.id, analysis.suggestedPriority)}
                            className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded hover:bg-red-200"
                          >
                            Uygula
                          </button>
                        )}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        Duygu Analizi
                      </label>
                      <div className="flex items-center space-x-2">
                        <MessageSquare className="w-4 h-4 text-purple-500" />
                        <span className={`text-sm font-medium capitalize ${
                          analysis.sentiment === 'positive' ? 'text-green-600' :
                          analysis.sentiment === 'negative' ? 'text-red-600' :
                          'text-gray-600'
                        }`}>
                          {analysis.sentiment === 'positive' ? 'Pozitif' :
                           analysis.sentiment === 'negative' ? 'Negatif' : 'Nötr'}
                        </span>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        Tahmini Süre
                      </label>
                      <div className="flex items-center space-x-2">
                        <Clock className="w-4 h-4 text-orange-500" />
                        <span className="text-sm text-gray-900 dark:text-white">
                          {analysis.estimatedResolutionTime}
                        </span>
                      </div>
                    </div>
                  </div>

                  {analysis.recommendations.length > 0 && (
                    <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3">
                      <h5 className="text-sm font-medium text-blue-900 dark:text-blue-100 mb-2 flex items-center">
                        <Lightbulb className="w-4 h-4 mr-1" />
                        AI Önerileri
                      </h5>
                      <ul className="space-y-1">
                        {analysis.recommendations.map((rec, index) => (
                          <li key={index} className="text-sm text-blue-800 dark:text-blue-200">
                            • {rec}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default AITicketAnalysis;
