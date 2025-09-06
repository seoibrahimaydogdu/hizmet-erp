import React, { useState, useRef, useEffect } from 'react';
import { Mic, MicOff, Loader2 } from 'lucide-react';

interface VoiceSearchProps {
  onTranscript: (text: string) => void;
  onListeningChange?: (isListening: boolean) => void;
  className?: string;
  disabled?: boolean;
}

const VoiceSearch: React.FC<VoiceSearchProps> = ({
  onTranscript,
  onListeningChange,
  className = "",
  disabled = false
}) => {
  const [isListening, setIsListening] = useState(false);
  const [isSupported, setIsSupported] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    // Web Speech API desteğini kontrol et
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      setIsSupported(true);
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = false;
      recognitionRef.current.lang = 'tr-TR,en-US'; // Hem Türkçe hem İngilizce

      recognitionRef.current.onstart = () => {
        setIsListening(true);
        setError(null);
        onListeningChange?.(true);
      };

      recognitionRef.current.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        // Mevcut metni temizle ve yeni transcript'i gönder
        onTranscript(transcript);
        setIsListening(false);
        onListeningChange?.(false);
      };

      recognitionRef.current.onerror = (event: any) => {
        console.error('Sesli arama hatası:', event.error);
        setError('Sesli arama sırasında bir hata oluştu');
        setIsListening(false);
        onListeningChange?.(false);
      };

      recognitionRef.current.onend = () => {
        setIsListening(false);
        onListeningChange?.(false);
      };
    } else {
      setIsSupported(false);
      setError('Tarayıcınız sesli arama özelliğini desteklemiyor');
    }
  }, [onTranscript]);

  const toggleListening = () => {
    if (!isSupported || disabled) return;

    if (isListening) {
      recognitionRef.current?.stop();
    } else {
      try {
        recognitionRef.current?.start();
      } catch (err) {
        setError('Sesli arama başlatılamadı');
      }
    }
  };

  if (!isSupported) {
    return (
      <div className={`text-xs text-gray-400 ${className}`}>
        Sesli arama desteklenmiyor
      </div>
    );
  }

  return (
    <div className={`flex items-center ${className}`}>
      <button
        onClick={toggleListening}
        disabled={disabled}
        className={`
          p-1.5 rounded-full transition-all duration-200
          ${isListening 
            ? 'bg-red-400 text-white animate-pulse' 
            : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
          }
          ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
        `}
        title={isListening ? 'Dinlemeyi durdur' : 'Sesli arama başlat'}
      >
        {isListening ? (
          <MicOff size={12} />
        ) : (
          <Mic size={12} />
        )}
      </button>
      
      {isListening && (
        <div className="ml-1.5 flex items-center text-xs text-gray-600">
          <Loader2 size={10} className="animate-spin mr-1" />
        </div>
      )}
      
      {error && (
        <div className="ml-1.5 text-xs text-red-400">
          {error}
        </div>
      )}
    </div>
  );
};

export default VoiceSearch;
