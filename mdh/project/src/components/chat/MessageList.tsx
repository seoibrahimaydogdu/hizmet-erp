import React, { useRef, useEffect, useState } from 'react';
import { 
  MoreHorizontal, 
  Edit, 
  Copy, 
  Trash2, 
  Pin, 
  Reply,
  X,
  CheckCircle,
  AlertCircle,
  Play,
  Pause,
  Volume2
} from 'lucide-react';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';
import { ChatMessage, VoiceMessage } from './types';
import toast from 'react-hot-toast';

interface MessageListProps {
  messages: ChatMessage[];
  voiceMessages: VoiceMessage[];
  currentUserId: string;
  onEditMessage: (messageId: string, newContent: string) => void;
  onDeleteMessage: (messageId: string) => void;
  onPinMessage: (messageId: string) => void;
  onReplyToMessage: (message: ChatMessage) => void;
  editingMessage: string | null;
  setEditingMessage: (messageId: string | null) => void;
  showActionMenu: string | null;
  setShowActionMenu: (messageId: string | null) => void;
  replyingTo: ChatMessage | null;
  cancelReply: () => void;
  pollVotes?: {[messageId: string]: {[optionIndex: number]: number}};
  onPollVote?: (messageId: string, optionIndex: number, optionText: string) => void;
  userVotes?: {[messageId: string]: {userId: string, optionIndex: number}};
}

const MessageList: React.FC<MessageListProps> = ({
  messages,
  voiceMessages,
  currentUserId,
  onEditMessage,
  onDeleteMessage,
  onPinMessage,
  onReplyToMessage,
  editingMessage,
  setEditingMessage,
  showActionMenu,
  setShowActionMenu,
  replyingTo,
  cancelReply,
  pollVotes,
  onPollVote,
  userVotes
}) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [playingVoiceId, setPlayingVoiceId] = useState<string | null>(null);
  const [audioElement, setAudioElement] = useState<HTMLAudioElement | null>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleEdit = (messageId: string, newContent: string) => {
    onEditMessage(messageId, newContent);
    setEditingMessage(null);
  };

  // Sesli mesaj oynatma fonksiyonları
  const playVoiceMessage = (voiceMessage: VoiceMessage) => {
    if (playingVoiceId === voiceMessage.id) {
      // Aynı mesajı durdur
      if (audioElement) {
        audioElement.pause();
        audioElement.currentTime = 0;
      }
      setPlayingVoiceId(null);
      setAudioElement(null);
    } else {
      // Önceki sesli mesajı durdur
      if (audioElement) {
        audioElement.pause();
        audioElement.currentTime = 0;
      }

      // Yeni sesli mesajı oynat
      const audio = new Audio(voiceMessage.audioUrl);
      audio.onended = () => {
        setPlayingVoiceId(null);
        setAudioElement(null);
      };
      audio.onerror = () => {
        setPlayingVoiceId(null);
        setAudioElement(null);
      };
      
      audio.play();
      setPlayingVoiceId(voiceMessage.id);
      setAudioElement(audio);
    }
  };

  const formatDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  // Anket oylama fonksiyonları
  const handlePollVote = (messageId: string, optionIndex: number, optionText: string) => {
    if (onPollVote) {
      onPollVote(messageId, optionIndex, optionText);
    } else {
      // Fallback: Burada gerçek uygulamada API çağrısı yapılır
      console.log(`Anket oyu: ${messageId}, Seçenek: ${optionIndex}, Metin: ${optionText}`);
      
      // Başarı mesajı göster
      toast.success(`"${optionText}" seçeneğine oy verildi`);
    }
  };

  const getPollVoteCount = (messageId: string, optionIndex: number) => {
    if (pollVotes && pollVotes[messageId] && pollVotes[messageId][optionIndex]) {
      return pollVotes[messageId][optionIndex];
    }
    // Fallback: Burada gerçek uygulamada veritabanından oy sayısı alınır
    // Şimdilik mock data kullanıyoruz
    const mockVotes = Math.floor(Math.random() * 10) + 1;
    return mockVotes;
  };

  const isUserVoted = (messageId: string, optionIndex: number) => {
    if (userVotes && userVotes[messageId] && userVotes[messageId].optionIndex === optionIndex) {
      return true;
    }
    return false;
  };

  return (
    <div className="space-y-4">
      {/* Normal Mesajlar */}
      {messages.map((message) => (
        <div
          key={message.id}
          className={`flex items-start space-x-3 ${
            message.senderId === currentUserId ? 'flex-row-reverse space-x-reverse' : ''
          }`}
        >
          {/* Avatar */}
          <div className="flex-shrink-0">
            <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
              <span className="text-white text-sm font-semibold">
                {message.senderName.charAt(0).toUpperCase()}
              </span>
            </div>
          </div>

          {/* Message Content */}
          <div className={`flex-1 max-w-xs ${message.senderId === currentUserId ? 'text-right' : ''}`}>
            {/* Sender Name and Time */}
            <div className={`flex items-center space-x-2 mb-1 ${message.senderId === currentUserId ? 'justify-end' : ''}`}>
              <span className="text-sm font-medium text-gray-900">{message.senderName}</span>
              <span className="text-xs text-gray-500">
                {format(new Date(message.timestamp), 'HH:mm', { locale: tr })}
              </span>
            </div>

            {/* Message Bubble */}
            <div className={`inline-block px-4 py-2 rounded-lg ${
              message.senderId === currentUserId 
                ? 'bg-blue-500 text-white' 
                : 'bg-gray-100 text-gray-900'
            }`}>
              {message.messageType === 'poll' ? (
                <div className="text-sm">
                  <div className="mb-2 font-medium">📊 Anket</div>
                  <div className="mb-3">
                    <div className="font-medium mb-2">{message.content.split('\n')[1]?.replace('**', '')}</div>
                    <div className="space-y-2">
                      {message.content.split('\n').slice(2, -2).map((line, index) => {
                        if (line.trim() && line.includes('.')) {
                          const optionText = line.split('. ')[1];
                          return (
                            <button
                              key={index}
                              onClick={() => handlePollVote(message.id, index + 1, optionText)}
                              className={`w-full text-left px-3 py-2 rounded-lg border transition-colors ${
                                message.senderId === currentUserId 
                                  ? 'border-blue-300 hover:bg-blue-400 text-white' 
                                  : 'border-gray-300 hover:bg-gray-200 text-gray-700'
                              } ${isUserVoted(message.id, index + 1) ? 'bg-green-100 border-green-500 shadow-md' : ''}`}
                            >
                              <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-2">
                                  <span>{line}</span>
                                  {isUserVoted(message.id, index + 1) && (
                                    <span className="text-green-600 text-xs">✓ Oy verdiğiniz</span>
                                  )}
                                </div>
                                <span className="text-xs opacity-70">
                                  {getPollVoteCount(message.id, index + 1)} oy
                                </span>
                              </div>
                            </button>
                          );
                        }
                        return null;
                      })}
                    </div>
                  </div>
                  {message.content.includes('Bitiş:') && (
                    <div className="text-xs opacity-70 mb-2">
                      {message.content.split('Bitiş:')[1]}
                    </div>
                  )}
                  <div className="text-xs opacity-70">
                    adOy vermek için seçeneklere tıklayın
                  </div>
                </div>
              ) : message.messageType === 'system' && message.content.includes('📋 Görev Oluşturuldu:') ? (
                <div className="text-sm">
                  <div className="mb-2 font-medium">📋 Görev</div>
                  <div className="whitespace-pre-line">{message.content}</div>
                  <div className="mt-3 pt-2 border-t border-gray-300 border-opacity-30">
                    <div className="text-xs opacity-80">
                      ✅ Görev başarıyla oluşturuldu
                    </div>
                  </div>
                </div>
              ) : (
                <p className="text-sm">{message.content}</p>
              )}
            </div>
          </div>
        </div>
      ))}

      {/* Sesli Mesajlar */}
      {voiceMessages.map((voiceMessage) => (
        <div
          key={voiceMessage.id}
          className={`flex items-start space-x-3 ${
            voiceMessage.senderId === currentUserId ? 'flex-row-reverse space-x-reverse' : ''
          }`}
        >
          {/* Avatar */}
          <div className="flex-shrink-0">
            <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
              <span className="text-white text-sm font-semibold">
                {voiceMessage.senderName.charAt(0).toUpperCase()}
              </span>
            </div>
          </div>

          {/* Voice Message Content */}
          <div className={`flex-1 max-w-xs ${voiceMessage.senderId === currentUserId ? 'text-right' : ''}`}>
            {/* Sender Name and Time */}
            <div className={`flex items-center space-x-2 mb-1 ${voiceMessage.senderId === currentUserId ? 'justify-end' : ''}`}>
              <span className="text-sm font-medium text-gray-900">{voiceMessage.senderName}</span>
              <span className="text-xs text-gray-500">
                {format(new Date(voiceMessage.timestamp), 'HH:mm', { locale: tr })}
              </span>
            </div>

            {/* Voice Message Bubble */}
            <div className={`inline-flex items-center space-x-2 px-4 py-2 rounded-lg ${
              voiceMessage.senderId === currentUserId 
                ? 'bg-blue-500 text-white' 
                : 'bg-gray-100 text-gray-900'
            }`}>
              <button
                onClick={() => playVoiceMessage(voiceMessage)}
                className="flex items-center space-x-2 hover:opacity-80 transition-opacity"
              >
                {playingVoiceId === voiceMessage.id ? (
                  <Pause className="w-4 h-4" />
                ) : (
                  <Play className="w-4 h-4" />
                )}
                <Volume2 className="w-4 h-4" />
                <span className="text-sm">{formatDuration(voiceMessage.duration)}</span>
              </button>
            </div>

            {/* Transcript */}
            {voiceMessage.transcription && (
              <div className={`mt-2 p-2 bg-gray-100 border-l-2 border-gray-300 rounded-r ${
                voiceMessage.senderId === currentUserId ? 'text-right border-l-0 border-r-2' : ''
              }`}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-gray-500 font-medium">
                    Transcript
                  </span>
                  <button
                    onClick={() => playVoiceMessage(voiceMessage)}
                    className="text-xs text-gray-600 hover:text-gray-800 hover:bg-gray-200 px-2 py-1 rounded transition-colors"
                    title="Sesi Dinle"
                  >
                    {playingVoiceId === voiceMessage.id ? '⏸️ Durdur' : '▶️ Dinle'}
                  </button>
                </div>
                <p className="text-sm text-gray-700 leading-relaxed">
                  {voiceMessage.transcription}
                </p>
                <div className="mt-1 pt-1 border-t border-gray-200">
                  <div className="flex items-center justify-between text-xs text-gray-400">
                    <span>🎤 Sesli mesaj</span>
                    <span>{formatDuration(voiceMessage.duration)}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Transcript Yoksa Bilgi Mesajı */}
            {!voiceMessage.transcription && (
              <div className={`mt-2 p-2 bg-gray-100 border-l-2 border-gray-300 rounded-r ${
                voiceMessage.senderId === currentUserId ? 'text-right border-l-0 border-r-2' : ''
              }`}>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-500 font-medium">
                    Transcript bulunamadı
                  </span>
                  <button
                    onClick={() => playVoiceMessage(voiceMessage)}
                    className="text-xs text-gray-600 hover:text-gray-800 hover:bg-gray-200 px-2 py-1 rounded transition-colors"
                    title="Sesi Dinle"
                  >
                    {playingVoiceId === voiceMessage.id ? '⏸️ Durdur' : '▶️ Dinle'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      ))}
      
      <div ref={messagesEndRef} />
    </div>
  );
};

export default MessageList;
