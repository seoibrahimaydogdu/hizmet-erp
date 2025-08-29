import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Brain, 
  Target, 
  Clock, 
  Star, 
  CheckCircle, 
  AlertTriangle,
  Zap,
  RefreshCw,
  BarChart3,
  TrendingUp,
  UserCheck,
  Settings,
  Lightbulb
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { supabase } from '../lib/supabase';
import { predictPerformance } from '../lib/gemini';

interface AISmartAssignmentProps {
  tickets: any[];
  agents: any[];
  onAssignTicket?: (ticketId: string, agentId: string) => void;
}

interface AgentPerformance {
  agentId: string;
  agentName: string;
  successRate: number;
  avgResolutionTime: number;
  satisfactionScore: number;
  workload: number;
  expertise: string[];
  recommendedFor: string[];
  confidence: number;
}

interface AssignmentRecommendation {
  ticketId: string;
  ticketTitle: string;
  recommendedAgent: AgentPerformance;
  alternativeAgents: AgentPerformance[];
  reasoning: string;
  expectedOutcome: {
    resolutionTime: string;
    satisfactionScore: number;
    successProbability: number;
  };
}

const AISmartAssignment: React.FC<AISmartAssignmentProps> = ({
  tickets,
  agents,
  onAssignTicket
}) => {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [recommendations, setRecommendations] = useState<AssignmentRecommendation[]>([]);
  const [agentPerformances, setAgentPerformances] = useState<AgentPerformance[]>([]);
  const [showSettings, setShowSettings] = useState(false);
  const [assignmentSettings, setAssignmentSettings] = useState({
    prioritizeExperience: true,
    balanceWorkload: true,
    considerSatisfaction: true,
    autoAssign: false
  });

  // Temsilci performans analizi
  const analyzeAgentPerformance = async () => {
    const performances: AgentPerformance[] = [];

    for (const agent of agents) {
      // Temsilcinin geçmiş taleplerini al
      const agentTickets = tickets.filter(t => t.agent_id === agent.id);
      const resolvedTickets = agentTickets.filter(t => t.status === 'resolved' || t.status === 'closed');
      
      // Performans metrikleri hesapla
      const successRate = resolvedTickets.length > 0 ? resolvedTickets.length / agentTickets.length : 0;
      const avgResolutionTime = resolvedTickets.length > 0 ? 
        resolvedTickets.reduce((sum, t) => {
          const created = new Date(t.created_at).getTime();
          const resolved = new Date(t.resolved_at || t.updated_at).getTime();
          return sum + (resolved - created);
        }, 0) / resolvedTickets.length / (1000 * 60 * 60) : 24; // Saat cinsinden

      // Uzmanlık alanları (kategori bazlı başarı oranları)
      const categorySuccess = resolvedTickets.reduce((acc, t) => {
        acc[t.category] = (acc[t.category] || 0) + 1;
        return acc;
      }, {} as any);

      const expertise = Object.entries(categorySuccess)
        .sort(([,a], [,b]) => (b as number) - (a as number))
        .slice(0, 3)
        .map(([category]) => category);

      // Mevcut iş yükü
      const activeTickets = agentTickets.filter(t => 
        t.status === 'open' || t.status === 'in_progress'
      ).length;

      // Müşteri memnuniyet skoru (simüle edilmiş)
      const satisfactionScore = 0.7 + (Math.random() * 0.3);

      performances.push({
        agentId: agent.id,
        agentName: agent.name,
        successRate,
        avgResolutionTime,
        satisfactionScore,
        workload: activeTickets,
        expertise,
        recommendedFor: expertise,
        confidence: 0.8 + (Math.random() * 0.2)
      });
    }

    setAgentPerformances(performances);
    return performances;
  };

  // AI destekli atama önerileri
  const generateAssignmentRecommendations = async () => {
    setIsAnalyzing(true);
    
    try {
      const performances = await analyzeAgentPerformance();
      const newRecommendations: AssignmentRecommendation[] = [];

      // Atanmamış talepleri bul
      const unassignedTickets = tickets.filter(t => 
        !t.agent_id && (t.status === 'open' || t.status === 'in_progress')
      );

      for (const ticket of unassignedTickets.slice(0, 10)) { // İlk 10 talep
        // Her temsilci için performans tahmini yap
        const agentScores = await Promise.all(
          performances.map(async (agent) => {
            try {
              const prediction = await predictPerformance(ticket, [agent]);
              return {
                agent,
                score: prediction.successProbability * (1 - agent.workload / 10),
                prediction
              };
            } catch (error) {
              return {
                agent,
                score: agent.successRate * (1 - agent.workload / 10),
                prediction: {
                  estimatedResolutionTime: `${agent.avgResolutionTime} saat`,
                  satisfactionScore: agent.satisfactionScore,
                  successProbability: agent.successRate
                }
              };
            }
          })
        );

        // En iyi temsilciyi seç
        const sortedAgents = agentScores.sort((a, b) => b.score - a.score);
        const recommendedAgent = sortedAgents[0];
        const alternativeAgents = sortedAgents.slice(1, 4);

        // Öneri nedeni
        const reasoning = `Bu temsilci ${ticket.category} kategorisinde ${Math.round(recommendedAgent.agent.expertise.includes(ticket.category) ? 85 : 60)}% başarı oranına sahip ve şu anda ${recommendedAgent.agent.workload} aktif talebi var.`;

        newRecommendations.push({
          ticketId: ticket.id,
          ticketTitle: ticket.title,
          recommendedAgent: recommendedAgent.agent,
          alternativeAgents: alternativeAgents.map(a => a.agent),
          reasoning,
          expectedOutcome: {
            resolutionTime: recommendedAgent.prediction.estimatedResolutionTime,
            satisfactionScore: recommendedAgent.prediction.satisfactionScore,
            successProbability: recommendedAgent.prediction.successProbability
          }
        });
      }

      setRecommendations(newRecommendations);
      toast.success(`${newRecommendations.length} atama önerisi oluşturuldu`);
    } catch (error) {
      console.error('Atama önerisi hatası:', error);
      toast.error('Atama önerileri oluşturulurken hata oluştu');
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Otomatik atama
  const autoAssignTickets = async () => {
    if (!assignmentSettings.autoAssign) return;

    setIsAnalyzing(true);
    let assignedCount = 0;

    try {
      for (const recommendation of recommendations) {
        await onAssignTicket?.(recommendation.ticketId, recommendation.recommendedAgent.agentId);
        assignedCount++;
        
        // Rate limiting
        await new Promise(resolve => setTimeout(resolve, 500));
      }

      toast.success(`${assignedCount} talep otomatik olarak atandı`);
      setRecommendations([]);
    } catch (error) {
      console.error('Otomatik atama hatası:', error);
      toast.error('Otomatik atama sırasında hata oluştu');
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Manuel atama
  const assignTicket = async (ticketId: string, agentId: string) => {
    try {
      await onAssignTicket?.(ticketId, agentId);
      setRecommendations(prev => prev.filter(r => r.ticketId !== ticketId));
      toast.success('Talep başarıyla atandı');
    } catch (error) {
      toast.error('Talep atanırken hata oluştu');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
              <Brain className="w-6 h-6 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                AI Akıllı Temsilci Atama
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Yapay zeka destekli optimal temsilci atama sistemi
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setShowSettings(true)}
              className="inline-flex items-center px-3 py-2 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg font-medium transition-colors"
            >
              <Settings className="w-4 h-4 mr-2" />
              Ayarlar
            </button>
            <button
              onClick={generateAssignmentRecommendations}
              disabled={isAnalyzing}
              className="inline-flex items-center px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white rounded-lg font-medium transition-colors"
            >
              {isAnalyzing ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  Analiz Ediliyor...
                </>
              ) : (
                <>
                  <Zap className="w-4 h-4 mr-2" />
                  Önerileri Oluştur
                </>
              )}
            </button>
          </div>
        </div>

        {/* İstatistikler */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600 dark:text-green-400">
              {agents.length}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">
              Aktif Temsilci
            </div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
              {tickets.filter(t => !t.agent_id && (t.status === 'open' || t.status === 'in_progress')).length}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">
              Atanmamış Talep
            </div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
              {recommendations.length}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">
              Öneri
            </div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">
              {Math.round(agentPerformances.reduce((sum, a) => sum + a.successRate, 0) / Math.max(agentPerformances.length, 1) * 100)}%
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">
              Ortalama Başarı
            </div>
          </div>
        </div>
      </div>

      {/* Temsilci Performansları */}
      {agentPerformances.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
              <BarChart3 className="w-5 h-5 mr-2" />
              Temsilci Performans Analizi
            </h3>
          </div>
          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {agentPerformances.map(agent => (
              <div key={agent.agentId} className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
                      <UserCheck className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900 dark:text-white">
                        {agent.agentName}
                      </h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {agent.expertise.join(', ')} uzmanı
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      agent.workload > 5 ? 'bg-red-100 text-red-800' :
                      agent.workload > 2 ? 'bg-yellow-100 text-yellow-800' :
                      'bg-green-100 text-green-800'
                    }`}>
                      {agent.workload} aktif talep
                    </span>
                    <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">
                      %{Math.round(agent.confidence * 100)} Güven
                    </span>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="text-center">
                    <div className="text-lg font-bold text-green-600 dark:text-green-400">
                      %{Math.round(agent.successRate * 100)}
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      Başarı Oranı
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-bold text-blue-600 dark:text-blue-400">
                      {Math.round(agent.avgResolutionTime)}s
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      Ortalama Çözüm Süresi
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-bold text-purple-600 dark:text-purple-400">
                      {Math.round(agent.satisfactionScore * 100)}%
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      Memnuniyet Skoru
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Atama Önerileri */}
      {recommendations.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
                <Target className="w-5 h-5 mr-2" />
                Atama Önerileri
              </h3>
              {assignmentSettings.autoAssign && (
                <button
                  onClick={autoAssignTickets}
                  disabled={isAnalyzing}
                  className="inline-flex items-center px-3 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white rounded-lg text-sm font-medium transition-colors"
                >
                  {isAnalyzing ? (
                    <>
                      <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                      Atanıyor...
                    </>
                  ) : (
                    <>
                      <Zap className="w-4 h-4 mr-2" />
                      Tümünü Ata
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {recommendations.map(recommendation => (
              <div key={recommendation.ticketId} className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-900 dark:text-white mb-1">
                      {recommendation.ticketTitle}
                    </h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                      {recommendation.reasoning}
                    </p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">
                      %{Math.round(recommendation.expectedOutcome.successProbability * 100)} Başarı
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Önerilen Temsilci */}
                  <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4 border border-green-200 dark:border-green-800">
                    <h5 className="font-medium text-green-900 dark:text-green-100 mb-3 flex items-center">
                      <Star className="w-4 h-4 mr-2" />
                      Önerilen Temsilci
                    </h5>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-green-700 dark:text-green-300">
                          {recommendation.recommendedAgent.agentName}
                        </span>
                        <span className="text-sm font-medium text-green-900 dark:text-green-100">
                          %{Math.round(recommendation.recommendedAgent.confidence * 100)} Güven
                        </span>
                      </div>
                      <div className="text-xs text-green-600 dark:text-green-400">
                        Tahmini çözüm: {recommendation.expectedOutcome.resolutionTime}
                      </div>
                      <div className="text-xs text-green-600 dark:text-green-400">
                        Memnuniyet: %{Math.round(recommendation.expectedOutcome.satisfactionScore * 100)}
                      </div>
                    </div>
                    <button
                      onClick={() => assignTicket(recommendation.ticketId, recommendation.recommendedAgent.agentId)}
                      className="w-full mt-3 px-3 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-medium transition-colors"
                    >
                      Bu Temsilciye Ata
                    </button>
                  </div>

                  {/* Alternatif Temsilciler */}
                  <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                    <h5 className="font-medium text-gray-900 dark:text-white mb-3">
                      Alternatif Temsilciler
                    </h5>
                    <div className="space-y-2">
                      {recommendation.alternativeAgents.map((agent, index) => (
                        <div key={agent.agentId} className="flex items-center justify-between p-2 bg-white dark:bg-gray-800 rounded border">
                          <div>
                            <div className="text-sm font-medium text-gray-900 dark:text-white">
                              {agent.agentName}
                            </div>
                            <div className="text-xs text-gray-600 dark:text-gray-400">
                              %{Math.round(agent.successRate * 100)} başarı
                            </div>
                          </div>
                          <button
                            onClick={() => assignTicket(recommendation.ticketId, agent.agentId)}
                            className="px-2 py-1 bg-blue-100 hover:bg-blue-200 text-blue-700 rounded text-xs font-medium transition-colors"
                          >
                            Ata
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Ayarlar Modal */}
      {showSettings && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Atama Ayarları
            </h3>
            <div className="space-y-4">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={assignmentSettings.prioritizeExperience}
                  onChange={(e) => setAssignmentSettings(prev => ({
                    ...prev,
                    prioritizeExperience: e.target.checked
                  }))}
                  className="rounded border-gray-300"
                />
                <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                  Deneyimi önceliklendir
                </span>
              </label>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={assignmentSettings.balanceWorkload}
                  onChange={(e) => setAssignmentSettings(prev => ({
                    ...prev,
                    balanceWorkload: e.target.checked
                  }))}
                  className="rounded border-gray-300"
                />
                <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                  İş yükünü dengele
                </span>
              </label>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={assignmentSettings.considerSatisfaction}
                  onChange={(e) => setAssignmentSettings(prev => ({
                    ...prev,
                    considerSatisfaction: e.target.checked
                  }))}
                  className="rounded border-gray-300"
                />
                <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                  Memnuniyet skorunu dikkate al
                </span>
              </label>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={assignmentSettings.autoAssign}
                  onChange={(e) => setAssignmentSettings(prev => ({
                    ...prev,
                    autoAssign: e.target.checked
                  }))}
                  className="rounded border-gray-300"
                />
                <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                  Otomatik atama
                </span>
              </label>
            </div>
            <div className="flex justify-end mt-6">
              <button
                onClick={() => setShowSettings(false)}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
              >
                Kaydet
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AISmartAssignment;
