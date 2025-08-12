import React, { useState, useEffect, useRef } from 'react';
import { Send, Phone, Video, Paperclip, Smile, MoreVertical, X, Minimize2 } from 'lucide-react';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';

interface Message {
  id: string;
  sender: 'user' | 'agent';
  content: string;
  timestamp: Date;
  type: 'text' | 'image' | 'file';
}

interface ChatUser {
  id: string;
  name: string;
  avatar: string;
  status: 'online' | 'away' | 'busy' | 'offline';
  lastMessage: string;
  lastMessageTime: Date;
  unreadCount: number;
}

interface LiveChatProps {
  isOpen: boolean;
  onClose: () => void;
  onMinimize: () => void;
  isMinimized: boolean;
}

const LiveChat: React.FC<LiveChatProps> = ({ isOpen, onClose, onMinimize, isMinimized }) => {
  const [selectedUser, setSelectedUser] = useState<ChatUser | null>(null);
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [chatUsers, setChatUsers] = useState<ChatUser[]>([
    {
      id: '1',
      name: 'Ahmet Yılmaz',
      avatar: 'AY',
      status: 'online',
      lastMessage: 'Ürün iade etmek istiyorum',
      lastMessageTime: new Date(Date.now() - 2 * 60 * 1000),
      unreadCount: 2
    },
    {
      id: '2',
      name: 'Fatma Kaya',
      avatar: 'FK',
      status: 'online',
      lastMessage: 'Teşekkürler, sorunu çözdünüz',
      lastMessageTime: new Date(Date.now() - 5 * 60 * 1000),
      unreadCount: 0
    },
    {
      id: '3',
      name: 'Can Demir',
      avatar: 'CD',
      status: 'away',
      lastMessage: 'Sipariş durumu nasıl?',
      lastMessageTime: new Date(Date.now() - 10 * 60 * 1000),
      unreadCount: 1
    }
  ]);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (selectedUser) {
      // Simulate loading messages for selected user
      const sampleMessages: Message[] = [
        {
          id: '1',
          sender: 'user',
          content: 'Merhaba, satın aldığım ürünü iade etmek istiyorum.',
          timestamp: new Date(Date.now() - 10 * 60 * 1000),
          type: 'text'
        },
        {
          id: '2',
          sender: 'agent',
          content: 'Merhaba! Size yardımcı olmaktan memnuniyet duyarım. İade sebebinizi öğrenebilir miyim?',
          timestamp: new Date(Date.now() - 8 * 60 * 1000),
          type: 'text'
        },
        {
          id: '3',
          sender: 'user',
          content: 'Ürün hasarlı geldi ve beklediğim gibi değil.',
          timestamp: new Date(Date.now() - 5 * 60 * 1000),
          type: 'text'
        }
      ];
      setMessages(sampleMessages);
    }
  }, [selectedUser]);

  const handleSendMessage = () => {
    if (message.trim() && selectedUser) {
      const newMessage: Message = {
        id: Date.now().toString(),
        sender: 'agent',
        content: message,
        timestamp: new Date(),
        type: 'text'
      };
      setMessages(prev => [...prev, newMessage]);
      setMessage('');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'online': return 'bg-green-500';
      case 'away': return 'bg-yellow-500';
      case 'busy': return 'bg-red-500';
      default: return 'bg-gray-400';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'online': return 'Çevrimiçi';
      case 'away': return 'Uzakta';
      case 'busy': return 'Meşgul';
      default: return 'Çevrimdışı';
    }
  };

  if (!isOpen) return null;

  return (
    <div className={`fixed bottom-4 right-4 bg-white dark:bg-gray-800 rounded-lg shadow-2xl border border-gray-200 dark:border-gray-700 ${
      isMinimized ? 'w-80 h-16' : 'w-96 h-[600px]'
    } transition-all duration-300 z-50`}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center space-x-3">
          <div className="relative">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
          </div>
          <div>
            <h3 className="font-semibold text-gray-900 dark:text-white">Canlı Destek</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">3 aktif</p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={onMinimize}
            className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
          >
            <Minimize2 className="w-4 h-4 text-gray-500" />
          </button>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
          >
            <X className="w-4 h-4 text-gray-500" />
          </button>
        </div>
      </div>

      {!isMinimized && (
        <div className="flex h-[calc(100%-64px)]">
          {/* Chat List */}
          <div className="w-1/3 border-r border-gray-200 dark:border-gray-700">
            <div className="p-3">
              <input
                type="text"
                placeholder="Sohbet ara..."
                className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="overflow-y-auto h-[calc(100%-60px)]">
              {chatUsers.map((user) => (
                <div
                  key={user.id}
                  onClick={() => setSelectedUser(user)}
                  className={`flex items-center p-3 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 ${
                    selectedUser?.id === user.id ? 'bg-blue-50 dark:bg-blue-900/20' : ''
                  }`}
                >
                  <div className="relative">
                    <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white font-semibold text-sm">
                      {user.avatar}
                    </div>
                    <div className={`absolute -bottom-1 -right-1 w-3 h-3 ${getStatusColor(user.status)} rounded-full border-2 border-white dark:border-gray-800`}></div>
                  </div>
                  <div className="ml-3 flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                        {user.name}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {format(user.lastMessageTime, 'HH:mm', { locale: tr })}
                      </p>
                    </div>
                    <div className="flex items-center justify-between">
                      <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
                        {user.lastMessage}
                      </p>
                      {user.unreadCount > 0 && (
                        <span className="inline-flex items-center justify-center w-5 h-5 text-xs font-bold text-white bg-blue-500 rounded-full">
                          {user.unreadCount}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Chat Area */}
          <div className="flex-1 flex flex-col">
            {selectedUser ? (
              <>
                {/* Chat Header */}
                <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
                  <div className="flex items-center space-x-3">
                    <div className="relative">
                      <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white font-semibold text-sm">
                        {selectedUser.avatar}
                      </div>
                      <div className={`absolute -bottom-1 -right-1 w-3 h-3 ${getStatusColor(selectedUser.status)} rounded-full border-2 border-white dark:border-gray-800`}></div>
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900 dark:text-white">{selectedUser.name}</h4>
                      <p className="text-sm text-gray-500 dark:text-gray-400">{getStatusText(selectedUser.status)}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full">
                      <Phone className="w-4 h-4 text-gray-500" />
                    </button>
                    <button className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full">
                      <Video className="w-4 h-4 text-gray-500" />
                    </button>
                    <button className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full">
                      <MoreVertical className="w-4 h-4 text-gray-500" />
                    </button>
                  </div>
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                  {messages.map((msg) => (
                    <div
                      key={msg.id}
                      className={`flex ${msg.sender === 'agent' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                          msg.sender === 'agent'
                            ? 'bg-blue-500 text-white'
                            : 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white'
                        }`}
                      >
                        <p className="text-sm">{msg.content}</p>
                        <p className={`text-xs mt-1 ${
                          msg.sender === 'agent' ? 'text-blue-100' : 'text-gray-500 dark:text-gray-400'
                        }`}>
                          {format(msg.timestamp, 'HH:mm', { locale: tr })}
                        </p>
                      </div>
                    </div>
                  ))}
                  <div ref={messagesEndRef} />
                </div>

                {/* Message Input */}
                <div className="p-4 border-t border-gray-200 dark:border-gray-700">
                  <div className="flex items-center space-x-2">
                    <button className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full">
                      <Paperclip className="w-4 h-4 text-gray-500" />
                    </button>
                    <button className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full">
                      <Smile className="w-4 h-4 text-gray-500" />
                    </button>
                    <input
                      type="text"
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      onKeyPress={handleKeyPress}
                      placeholder="Mesajınızı yazın..."
                      className="flex-1 px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <button
                      onClick={handleSendMessage}
                      disabled={!message.trim()}
                      className="p-2 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300 dark:disabled:bg-gray-600 rounded-full transition-colors"
                    >
                      <Send className="w-4 h-4 text-white" />
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center">
                <div className="text-center">
                  <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Send className="w-8 h-8 text-gray-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                    Sohbet Seçin
                  </h3>
                  <p className="text-gray-500 dark:text-gray-400">
                    Müşterilerle sohbet etmek için sol taraftan birini seçin
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default LiveChat;