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
  // GELİŞMİŞ MESAJLAŞMA ÖZELLİKLERİ
  onAddReaction?: (messageId: string, emoji: string) => void;
  onRemoveReaction?: (messageId: string, emoji: string) => void;
  messageReactions?: { [messageId: string]: { [emoji: string]: string[] } };
  onStartEditing?: (messageId: string, currentContent: string) => void;
  onSaveEdit?: () => void;
  onCancelEdit?: () => void;
  editingMessageId?: string | null;
  editingContent?: string;
  onUpdateMessageStatus?: (messageId: string, status: 'sent' | 'delivered' | 'read' | 'failed') => void;
  messageStatuses?: { [messageId: string]: 'sent' | 'delivered' | 'read' | 'failed' };
  onCopyMessageText?: (messageId: string) => void;
  onForwardMessageToChannel?: (messageId: string, targetChannelId: string) => void;
  onRestoreMessage?: (messageId: string) => void;
  deletedMessages?: Set<string>;
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
  onCreateTask,
  // GELİŞMİŞ MESAJLAŞMA ÖZELLİKLERİ
  onAddReaction,
  onRemoveReaction,
  messageReactions,
  onStartEditing,
  onSaveEdit,
  onCancelEdit,
  editingMessageId,
  editingContent,
  onUpdateMessageStatus,
  messageStatuses,
  onCopyMessageText,
  onForwardMessageToChannel,
  onRestoreMessage,
  deletedMessages
}) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [playingVoiceId, setPlayingVoiceId] = useState<string | null>(null);
  const [audioElement, setAudioElement] = useState<HTMLAudioElement | null>(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState<string | null>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Emoji picker dışına tıklandığında kapat
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (showEmojiPicker && !(event.target as Element).closest('.emoji-picker-container')) {
        setShowEmojiPicker(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showEmojiPicker]);

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
               {/* Alıntı Mesajı */}
               {message.replyTo && (
                 <div className="mb-2 p-2 bg-gray-200 dark:bg-gray-600 rounded border-l-4 border-blue-500">
                   <div className="flex items-center space-x-2 mb-1">
                     <Reply className="w-3 h-3 text-blue-500" />
                     <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
                       {message.replyTo.senderName}
                     </span>
                   </div>
                   <p className="text-xs text-gray-600 dark:text-gray-400 line-clamp-2">
                     {message.replyTo.content.length > 80 
                       ? `${message.replyTo.content.substring(0, 80)}...` 
                       : message.replyTo.content
                     }
                   </p>
                 </div>
               )}
                               {/* Mesaj Aksiyonları - Sağ Taraf */}
                <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <div className="flex items-center space-x-1">
                    {/* Yanıtla Butonu */}
                    {onReplyToMessage && (
                      <button
                        onClick={() => onReplyToMessage(message)}
                        className="p-1 text-gray-400 hover:text-gray-600 dark:text-gray-300 dark:hover:text-gray-100 rounded"
                        title="Yanıtla"
                      >
                        <Reply className="w-3 h-3" />
                      </button>
                    )}
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
                    {/* Mesaj Kopyalama */}
                    {onCopyMessage && (
                      <button
                        onClick={() => onCopyMessage(message)}
                        className="p-1 text-gray-400 hover:text-gray-600 dark:text-gray-300 dark:hover:text-gray-100 rounded"
                        title="Kopyala"
                      >
                        <Copy className="w-3 h-3" />
                      </button>
                    )}
                    {/* Mesaj İletme */}
                    {onForwardMessage && (
                      <button
                        onClick={() => onForwardMessage(message)}
                        className="p-1 text-gray-400 hover:text-gray-600 dark:text-gray-300 dark:hover:text-gray-100 rounded"
                        title="İlet"
                      >
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
                        </svg>
                      </button>
                    )}
                    {/* Mesaj Geri Yükleme (sadece silinen mesajlar için) */}
                    {deletedMessages && deletedMessages.has(message.id) && onRestoreMessage && (
                      <button
                        onClick={() => onRestoreMessage(message.id)}
                        className="p-1 text-green-400 hover:text-green-600 dark:text-green-300 dark:hover:text-green-100 rounded"
                        title="Geri yükle"
                      >
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
                        </svg>
                      </button>
                    )}
                  </div>
                </div>

                {/* Emoji Butonu - Sol Taraf */}
                <div className="absolute top-1/2 -translate-y-1/2 -left-8 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => setShowEmojiPicker(showEmojiPicker === message.id ? null : message.id)}
                    className="p-1 text-gray-400 hover:text-gray-600 dark:text-gray-300 dark:hover:text-gray-100 rounded bg-white dark:bg-gray-800 shadow-sm border border-gray-200 dark:border-gray-700"
                    title="Emoji ekle"
                  >
                    😊
                  </button>
                </div>

               {/* GELİŞMİŞ MESAJLAŞMA ÖZELLİKLERİ */}
               
               {/* Mesaj Durumu */}
               {messageStatuses && messageStatuses[message.id] && (
                 <div className="absolute -bottom-5 right-0 text-xs">
                   <span className={`${
                     messageStatuses[message.id] === 'sent' ? 'text-gray-400' :
                     messageStatuses[message.id] === 'delivered' ? 'text-blue-400' :
                     messageStatuses[message.id] === 'read' ? 'text-green-400' :
                     messageStatuses[message.id] === 'failed' ? 'text-red-400' : 'text-gray-400'
                   }`}>
                     {messageStatuses[message.id] === 'sent' && '✓'}
                     {messageStatuses[message.id] === 'delivered' && '✓✓'}
                     {messageStatuses[message.id] === 'read' && '✓✓'}
                     {messageStatuses[message.id] === 'failed' && '✗'}
                   </span>
                 </div>
               )}

               {/* Düzenlenmiş Mesaj İşareti */}
               {message.isEdited && (
                 <div className="text-xs text-gray-400 italic mt-1">
                   (düzenlendi)
                 </div>
               )}

               {/* Emoji Picker */}
               {showEmojiPicker === message.id && (
                 <div className="emoji-picker-container mt-2 p-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg">
                   <div className="flex gap-2">
                     <button
                       onClick={() => {
                         onAddReaction?.(message.id, '👍');
                         setShowEmojiPicker(null);
                       }}
                       className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 dark:text-gray-300 dark:hover:text-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
                       title="Beğen"
                     >
                       👍
                     </button>
                     <button
                       onClick={() => {
                         onAddReaction?.(message.id, '❤️');
                         setShowEmojiPicker(null);
                       }}
                       className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 dark:text-gray-300 dark:hover:text-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
                       title="Sev"
                     >
                       ❤️
                     </button>
                     <button
                       onClick={() => {
                         onAddReaction?.(message.id, '😂');
                         setShowEmojiPicker(null);
                       }}
                       className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 dark:text-gray-300 dark:hover:text-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
                       title="Gül"
                     >
                       😂
                     </button>
                     <button
                       onClick={() => {
                         onAddReaction?.(message.id, '😮');
                         setShowEmojiPicker(null);
                       }}
                       className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 dark:text-gray-300 dark:hover:text-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
                       title="Şaşır"
                     >
                       😮
                     </button>
                     <button
                       onClick={() => {
                         onAddReaction?.(message.id, '👏');
                         setShowEmojiPicker(null);
                       }}
                       className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 dark:text-gray-300 dark:hover:text-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
                       title="Alkışla"
                     >
                       👏
                     </button>
                     <button
                       onClick={() => {
                         onAddReaction?.(message.id, '🎉');
                         setShowEmojiPicker(null);
                       }}
                       className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 dark:text-gray-300 dark:hover:text-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
                       title="Kutla"
                     >
                       🎉
                     </button>
                   </div>
                 </div>
               )}

               
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

                           {/* Mesaj Reaksiyonları - Mesaj balonunun altında */}
              {messageReactions && messageReactions[message.id] && Object.keys(messageReactions[message.id]).length > 0 && (
                <div className={`mt-2 flex flex-wrap gap-1 ${message.senderId === currentUserId ? 'justify-end' : 'justify-start'}`}>
                  {Object.entries(messageReactions[message.id])
                    .filter(([emoji, users]) => users.length > 0) // Sadece 1 ve daha fazla reaksiyonu olanları göster
                    .map(([emoji, users]) => (
                    <button
                      key={emoji}
                      onClick={() => users.includes(currentUserId) 
                        ? onRemoveReaction?.(message.id, emoji)
                        : onAddReaction?.(message.id, emoji)
                      }
                      className={`px-2 py-1 rounded-full text-xs transition-colors ${
                        users.includes(currentUserId)
                          ? 'bg-blue-100 text-blue-600'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                      title={`${users.length} kişi ${emoji} reaksiyonu verdi`}
                    >
                      {emoji} {users.length}
                    </button>
                  ))}
                </div>
              )}
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
