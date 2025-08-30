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
  // Gerçek zamanlı özellikler
  messageReadStatus?: { [messageId: string]: any };
  onMessageView?: (messageId: string) => void;
  typingUsers?: any[];
  // Mesaj iletme ve kopyalama
  onCopyMessage?: (message: ChatMessage) => void;
  onForwardMessage?: (message: ChatMessage) => void;
  // Mesaj sabitleme ve önemli işaretleme
  onStarMessage?: (messageId: string) => void;
  isMessagePinned?: (messageId: string) => boolean;
  isMessageStarred?: (messageId: string) => boolean;
  // Görev oluşturma
  onCreateTask?: (message: ChatMessage) => void;
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
  userVotes,
  messageReadStatus,
  onMessageView,
  typingUsers,
  onCopyMessage,
  onForwardMessage,
  onStarMessage,
  isMessagePinned,
  isMessageStarred,
  onCreateTask
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

  // HTML etiketlerini temizle ve sadece metni göster
  const stripHtml = (html: string) => {
    const tmp = document.createElement('div');
    tmp.innerHTML = html;
    return tmp.textContent || tmp.innerText || '';
  };

  return (
    <div className="space-y-4">
      {/* Normal Mesajlar */}
      {messages.map((message) => (
                 <div
           key={message.id}
           className={`flex items-start space-x-3 group ${
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
              <span className="text-sm font-medium text-gray-900 dark:text-white">{message.senderName}</span>
              <span className="text-xs text-gray-500 dark:text-gray-400">
                {format(new Date(message.timestamp), 'HH:mm', { locale: tr })}
              </span>
            </div>

                         {/* Message Bubble */}
             <div className={`inline-block px-4 py-2 rounded-lg relative ${
               message.senderId === currentUserId 
                 ? 'bg-blue-500 text-white' 
                 : 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white'
             }`}>
               {/* Mesaj Aksiyonları */}
               <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity">
                 <div className="flex items-center space-x-1">
                   {onCreateTask && (
                     <button
                       onClick={() => onCreateTask(message)}
                       className="p-1 text-gray-400 hover:text-gray-600 dark:text-gray-300 dark:hover:text-gray-100 rounded"
                       title="Görev oluştur"
                     >
                       <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                         <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                       </svg>
                     </button>
                   )}
                   {onStarMessage && (
                     <button
                       onClick={() => onStarMessage(message.id)}
                       className={`p-1 rounded ${isMessageStarred && isMessageStarred(message.id) ? 'text-yellow-500' : 'text-gray-400 hover:text-gray-600 dark:text-gray-300 dark:hover:text-gray-100'}`}
                       title={isMessageStarred && isMessageStarred(message.id) ? 'Önemli işaretlemeyi kaldır' : 'Önemli işaretle'}
                     >
                       <svg className="w-3 h-3" fill={isMessageStarred && isMessageStarred(message.id) ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
                         <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                       </svg>
                     </button>
                   )}
                   {onPinMessage && (
                     <button
                       onClick={() => onPinMessage(message.id)}
                       className={`p-1 rounded ${isMessagePinned && isMessagePinned(message.id) ? 'text-blue-500' : 'text-gray-400 hover:text-gray-600 dark:text-gray-300 dark:hover:text-gray-100'}`}
                       title={isMessagePinned && isMessagePinned(message.id) ? 'Sabitlemeyi kaldır' : 'Sabitle'}
                     >
                       <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                         <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                       </svg>
                     </button>
                   )}
                 </div>
               </div>
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
                 <p className="text-sm">{stripHtml(message.content)}</p>
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
              <span className="text-sm font-medium text-gray-900 dark:text-white">{voiceMessage.senderName}</span>
              <span className="text-xs text-gray-500 dark:text-gray-400">
                {format(new Date(voiceMessage.timestamp), 'HH:mm', { locale: tr })}
              </span>
            </div>

            {/* Voice Message Bubble */}
            <div className={`inline-flex items-center space-x-2 px-4 py-2 rounded-lg ${
              voiceMessage.senderId === currentUserId 
                ? 'bg-blue-500 text-white' 
                : 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white'
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
