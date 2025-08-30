import React, { useState, useRef, useEffect } from 'react';
import { Mic, MicOff, Loader2, Send, Trash2 } from 'lucide-react';

interface VoiceMessageProps {
  onSendMessage: (message: string) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}

const VoiceMessage: React.FC<VoiceMessageProps> = ({
  onSendMessage,
  placeholder = "Sesli mesaj gönder...",
  className = "",
  disabled = false
}) => {
  const [isRecording, setIsRecording] = useState(false);
  const [isSupported, setIsSupported] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [transcript, setTranscript] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    // Web Speech API desteğini kontrol et
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      setIsSupported(true);
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      
      recognitionRef.current.continuous = true;
      recognitionRef.current.interimResults = true;
      recognitionRef.current.lang = 'tr-TR';

      recognitionRef.current.onstart = () => {
        setIsRecording(true);
        setError(null);
        setTranscript('');
      };

      recognitionRef.current.onresult = (event: any) => {
        let finalTranscript = '';
        let interimTranscript = '';

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalTranscript += transcript;
          } else {
            interimTranscript += transcript;
          }
        }

        setTranscript(finalTranscript + interimTranscript);
      };

      recognitionRef.current.onerror = (event: any) => {
        console.error('Sesli mesaj hatası:', event.error);
        setError('Sesli mesaj sırasında bir hata oluştu');
        setIsRecording(false);
      };

      recognitionRef.current.onend = () => {
        setIsRecording(false);
      };
    } else {
      setIsSupported(false);
      setError('Tarayıcınız sesli mesaj özelliğini desteklemiyor');
    }
  }, []);

  const toggleRecording = () => {
    if (!isSupported || disabled) return;

    if (isRecording) {
      recognitionRef.current?.stop();
    } else {
      try {
        recognitionRef.current?.start();
      } catch (err) {
        setError('Sesli mesaj başlatılamadı');
      }
    }
  };

  const sendMessage = async () => {
    if (!transcript.trim()) return;

    setIsProcessing(true);
    try {
      await onSendMessage(transcript);
      setTranscript('');
    } catch (err) {
      setError('Mesaj gönderilemedi');
    } finally {
      setIsProcessing(false);
    }
  };

  const clearTranscript = () => {
    setTranscript('');
  };

  if (!isSupported) {
    return (
      <div className={`text-xs text-gray-400 ${className}`}>
        Sesli mesaj desteklenmiyor
      </div>
    );
  }

  return (
    <div className={`space-y-1.5 ${className}`}>
      {/* Sesli mesaj butonu */}
      <div className="flex items-center space-x-1.5">
        <button
          onClick={toggleRecording}
          disabled={disabled}
          className={`
            p-1.5 rounded-full transition-all duration-200
            ${isRecording 
              ? 'bg-red-400 text-white animate-pulse' 
              : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
            }
            ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
          `}
          title={isRecording ? 'Kaydı durdur' : 'Sesli mesaj başlat'}
        >
          {isRecording ? (
            <MicOff size={14} />
          ) : (
            <Mic size={14} />
          )}
        </button>
        
        {isRecording && (
          <div className="flex items-center text-xs text-gray-600">
            <Loader2 size={10} className="animate-spin mr-1" />
            Kaydediliyor...
          </div>
        )}
      </div>

      {/* Transcript alanı */}
      {transcript && (
        <div className="bg-gray-50 rounded-md p-2 border border-gray-200">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <p className="text-xs text-gray-600 mb-1">Sesli mesaj:</p>
              <p className="text-sm text-gray-800 break-words whitespace-pre-wrap">{transcript}</p>
            </div>
            <div className="flex items-center space-x-1 flex-shrink-0">
              <button
                onClick={clearTranscript}
                className="p-1 text-gray-400 hover:text-red-400 transition-colors"
                title="Temizle"
              >
                <Trash2 size={12} />
              </button>
              <button
                onClick={sendMessage}
                disabled={isProcessing}
                className={`
                  p-1.5 rounded-full transition-all duration-200
                  ${isProcessing 
                    ? 'bg-gray-300 cursor-not-allowed' 
                    : 'bg-gray-500 hover:bg-gray-600 cursor-pointer'
                  }
                  text-white
                `}
                title="Gönder"
              >
                {isProcessing ? (
                  <Loader2 size={12} className="animate-spin" />
                ) : (
                  <Send size={12} />
                )}
              </button>
            </div>
          </div>
        </div>
      )}
      
      {error && (
        <div className="text-xs text-red-400">
          {error}
        </div>
      )}
    </div>
  );
};

export default VoiceMessage;
