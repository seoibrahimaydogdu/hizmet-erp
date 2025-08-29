import React, { useRef, useEffect } from 'react';
import { 
  MoreHorizontal, 
  Edit, 
  Copy, 
  Trash2, 
  Pin, 
  Reply,
  X,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';
import { ChatMessage } from './types';

interface MessageListProps {
  messages: ChatMessage[];
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
}

const MessageList: React.FC<MessageListProps> = ({
  messages,
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
  cancelReply
}) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleEdit = (messageId: string, newContent: string) => {
    onEditMessage(messageId, newContent);
    setEditingMessage(null);
  };

  return (
    <div className="space-y-4">
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
              <p className="text-sm">{message.content}</p>
            </div>
          </div>
        </div>
      ))}
      
      <div ref={messagesEndRef} />
    </div>
  );
};

export default MessageList;
