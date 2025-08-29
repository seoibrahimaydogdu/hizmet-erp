import { GoogleGenerativeAI } from '@google/generative-ai';

// Gemini API key
const API_KEY = 'AIzaSyCqnn-kKkc8k_PcOLCVOYqo4fFec4yt4fA';

// Gemini AI instance
const genAI = new GoogleGenerativeAI(API_KEY);

// Model seçimi
const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

export interface TicketAnalysisRequest {
  title: string;
  description: string;
  category?: string;
  priority?: string;
  customerHistory?: string;
}

export interface TicketAnalysisResponse {
  suggestedCategory: string;
  suggestedPriority: 'low' | 'medium' | 'high' | 'critical';
  sentiment: 'positive' | 'negative' | 'neutral';
  urgency: 'low' | 'medium' | 'high' | 'critical';
  complexity: 'simple' | 'moderate' | 'complex';
  estimatedResolutionTime: string;
  keywords: string[];
  recommendations: string[];
  confidence: number;
  suggestedResponse?: string;
  riskLevel: 'low' | 'medium' | 'high';
  customerSatisfactionPrediction: number;
}

export interface ResponseSuggestionRequest {
  ticketContent: string;
  category: string;
  priority: string;
  customerName: string;
  tone: 'formal' | 'friendly' | 'technical' | 'empathetic';
  language: 'tr' | 'en';
}

export interface ResponseSuggestionResponse {
  suggestedResponse: string;
  alternativeResponses: string[];
  tone: string;
  estimatedResponseTime: string;
  followUpQuestions: string[];
}

// Talep analizi fonksiyonu
export async function analyzeTicketWithAI(request: TicketAnalysisRequest): Promise<TicketAnalysisResponse> {
  try {
    const prompt = `
    Aşağıdaki talep bilgilerini analiz ederek detaylı bir rapor hazırla:

    Talep Başlığı: ${request.title}
    Talep Açıklaması: ${request.description}
    Mevcut Kategori: ${request.category || 'Belirlenmemiş'}
    Mevcut Öncelik: ${request.priority || 'Belirlenmemiş'}
    Müşteri Geçmişi: ${request.customerHistory || 'Bilgi yok'}

    Lütfen aşağıdaki formatta JSON yanıtı ver:

    {
      "suggestedCategory": "Teknik Destek|Ödeme|Şikayet|Öneri/İstek|Hesap Yönetimi|Genel",
      "suggestedPriority": "low|medium|high|critical",
      "sentiment": "positive|negative|neutral",
      "urgency": "low|medium|high|critical",
      "complexity": "simple|moderate|complex",
      "estimatedResolutionTime": "1-2 saat|2-4 saat|4-6 saat|1-2 gün|1 hafta",
      "keywords": ["anahtar", "kelimeler", "listesi"],
      "recommendations": ["öneri1", "öneri2", "öneri3"],
      "confidence": 0.85,
      "suggestedResponse": "Önerilen yanıt şablonu",
      "riskLevel": "low|medium|high",
      "customerSatisfactionPrediction": 0.75
    }

    Analiz kriterleri:
    - Kategori: İçeriğe göre en uygun kategori
    - Öncelik: Aciliyet ve önem derecesi
    - Duygu: Müşterinin duygu durumu
    - Aciliyet: Ne kadar hızlı yanıt verilmeli
    - Karmaşıklık: Çözümün ne kadar karmaşık olduğu
    - Anahtar kelimeler: Önemli terimler
    - Öneriler: Eylem önerileri
    - Güven: Analiz güvenilirliği (0-1)
    - Risk: Müşteri kaybı riski
    - Memnuniyet tahmini: Müşteri memnuniyet oranı (0-1)
    `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    // JSON parse et
    const analysis = JSON.parse(text);
    
    return analysis;
  } catch (error) {
    console.error('Gemini API analiz hatası:', error);
    
    // Fallback analiz
    return {
      suggestedCategory: 'Genel',
      suggestedPriority: 'medium',
      sentiment: 'neutral',
      urgency: 'medium',
      complexity: 'moderate',
      estimatedResolutionTime: '2-4 saat',
      keywords: [],
      recommendations: ['Manuel analiz gerekli'],
      confidence: 0.5,
      riskLevel: 'medium',
      customerSatisfactionPrediction: 0.5
    };
  }
}

// Yanıt önerisi fonksiyonu
export async function generateResponseSuggestion(request: ResponseSuggestionRequest): Promise<ResponseSuggestionResponse> {
  try {
    const prompt = `
    Aşağıdaki talep için profesyonel bir yanıt önerisi hazırla:

    Talep İçeriği: ${request.ticketContent}
    Kategori: ${request.category}
    Öncelik: ${request.priority}
    Müşteri Adı: ${request.customerName}
    Ton: ${request.tone === 'formal' ? 'Resmi' : request.tone === 'friendly' ? 'Samimi' : request.tone === 'technical' ? 'Teknik' : 'Empatik'}
    Dil: ${request.language === 'tr' ? 'Türkçe' : 'İngilizce'}

    Lütfen aşağıdaki formatta JSON yanıtı ver:

    {
      "suggestedResponse": "Ana yanıt önerisi",
      "alternativeResponses": ["Alternatif yanıt 1", "Alternatif yanıt 2"],
      "tone": "Kullanılan ton açıklaması",
      "estimatedResponseTime": "Tahmini yanıt süresi",
      "followUpQuestions": ["Takip sorusu 1", "Takip sorusu 2"]
    }

    Yanıt kriterleri:
    - Profesyonel ve yardımcı olmalı
    - Müşterinin sorununu anladığını göstermeli
    - Çözüm odaklı olmalı
    - Belirtilen tonda yazılmalı
    - Açık ve anlaşılır olmalı
    `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    // JSON parse et
    const suggestion = JSON.parse(text);
    
    return suggestion;
  } catch (error) {
    console.error('Gemini API yanıt önerisi hatası:', error);
    
    // Fallback yanıt
    return {
      suggestedResponse: 'Talebiniz için teşekkür ederiz. En kısa sürede size yardımcı olacağız.',
      alternativeResponses: ['Talebiniz inceleniyor.', 'Destek ekibimiz size ulaşacak.'],
      tone: 'Resmi',
      estimatedResponseTime: '2-4 saat',
      followUpQuestions: ['Başka bir sorunuz var mı?']
    };
  }
}

// Trend analizi fonksiyonu
export async function analyzeTrends(tickets: any[]): Promise<any> {
  try {
    const ticketData = tickets.map(t => ({
      category: t.category,
      priority: t.priority,
      status: t.status,
      created_at: t.created_at,
      title: t.title
    }));

    const prompt = `
    Aşağıdaki talep verilerini analiz ederek trend raporu hazırla:

    ${JSON.stringify(ticketData, null, 2)}

    Lütfen aşağıdaki analizleri yap:
    1. En çok gelen talep kategorileri
    2. Öncelik dağılımı
    3. Çözüm süreleri trendi
    4. Müşteri memnuniyet göstergeleri
    5. İyileştirme önerileri

    JSON formatında yanıt ver.
    `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    return JSON.parse(text);
  } catch (error) {
    console.error('Gemini API trend analizi hatası:', error);
    return {
      categories: {},
      priorities: {},
      recommendations: ['Veri analizi gerekli']
    };
  }
}

// Performans tahmini fonksiyonu
export async function predictPerformance(ticket: any, agentHistory: any[]): Promise<any> {
  try {
    const prompt = `
    Aşağıdaki talep ve temsilci geçmişine göre performans tahmini yap:

    Talep: ${JSON.stringify(ticket, null, 2)}
    Temsilci Geçmişi: ${JSON.stringify(agentHistory, null, 2)}

    Tahmin edilecek metrikler:
    - Çözüm süresi
    - Müşteri memnuniyet skoru
    - Başarı olasılığı
    - Risk faktörleri

    JSON formatında yanıt ver.
    `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    return JSON.parse(text);
  } catch (error) {
    console.error('Gemini API performans tahmini hatası:', error);
    return {
      estimatedResolutionTime: '2-4 saat',
      satisfactionScore: 0.7,
      successProbability: 0.8,
      riskFactors: ['Veri yetersiz']
    };
  }
}

export default {
  analyzeTicketWithAI,
  generateResponseSuggestion,
  analyzeTrends,
  predictPerformance
};
