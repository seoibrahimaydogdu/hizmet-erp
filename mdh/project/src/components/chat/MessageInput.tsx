import React, { useRef, useState } from 'react';
import { 
  Send, 
  Paperclip, 
  Mic, 
  Smile, 
  Image,
  File,
  Bold,
  Italic,
  Underline,
  List,
  ListOrdered,
  Quote,
  Code,
  Link,
  Table,
  Edit3,
  BarChart3,
  Target,
  Calendar,
  Clock,
  Users,
  CheckSquare,
  MessageSquare,
  Zap
} from 'lucide-react';
import { ChatMessage } from './types';

interface MessageInputProps {
  newMessage: string;
  setNewMessage: (message: string) => void;
  onSendMessage: () => void;
  onFileUpload: (file: File) => void;
  onVoiceRecord: () => void;
  isRecording: boolean;
  replyingTo: ChatMessage | null;
  cancelReply: () => void;
  sendReply: () => void;
  replyContent: string;
  setReplyContent: (content: string) => void;
}

const MessageInput: React.FC<MessageInputProps> = ({
  newMessage,
  setNewMessage,
  onSendMessage,
  onFileUpload,
  onVoiceRecord,
  isRecording,
  replyingTo,
  cancelReply,
  sendReply,
  replyContent,
  setReplyContent
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [showWorkflowMenu, setShowWorkflowMenu] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (replyingTo) {
        sendReply();
      } else {
        onSendMessage();
      }
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      onFileUpload(files[0]);
    }
  };

  // Text formatting functions
  const formatText = (format: string) => {
    if (!textareaRef.current) return;
    
    const textarea = textareaRef.current;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = textarea.value.substring(start, end);
    
    let formattedText = '';
    let cursorOffset = 0;
    
    switch (format) {
      case 'bold':
        formattedText = `**${selectedText}**`;
        cursorOffset = 2;
        break;
      case 'italic':
        formattedText = `*${selectedText}*`;
        cursorOffset = 1;
        break;
      case 'underline':
        formattedText = `__${selectedText}__`;
        cursorOffset = 2;
        break;
      case 'code':
        formattedText = `\`${selectedText}\``;
        cursorOffset = 1;
        break;
      case 'quote':
        formattedText = `> ${selectedText}`;
        cursorOffset = 2;
        break;
      case 'list':
        formattedText = `- ${selectedText}`;
        cursorOffset = 2;
        break;
      case 'ordered-list':
        formattedText = `1. ${selectedText}`;
        cursorOffset = 3;
        break;
    }
    
    const newValue = textarea.value.substring(0, start) + formattedText + textarea.value.substring(end);
    setNewMessage(newValue);
    
    // Set cursor position
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + cursorOffset, start + cursorOffset + selectedText.length);
    }, 0);
  };

  const addEmoji = (emoji: string) => {
    setNewMessage(prev => prev + emoji);
    setShowEmojiPicker(false);
  };

  const addWorkflowItem = (type: string) => {
    let content = '';
    switch (type) {
      case 'task':
        content = '/task Yeni görev oluştur';
        break;
      case 'meeting':
        content = '/meeting Toplantı planla';
        break;
      case 'poll':
        content = '/poll Anket oluştur';
        break;
      case 'reminder':
        content = '/reminder Hatırlatıcı ayarla';
        break;
      case 'assign':
        content = '/assign Görev ata';
        break;
    }
    setNewMessage(content);
    setShowWorkflowMenu(false);
  };

  const emojis = ['😊', '👍', '❤️', '🎉', '🔥', '💡', '✅', '❌', '🤔', '👏'];

  return (
    <div className="space-y-3">
      {/* Formatting Toolbar */}
      <div className="flex items-center space-x-2 px-3 py-2 bg-gray-50 rounded-lg">
        <button
          onClick={() => fileInputRef.current?.click()}
          className="p-1 text-gray-500 hover:text-gray-700 rounded hover:bg-gray-200"
          title="Dosya ekle"
        >
          <Paperclip className="w-4 h-4" />
        </button>
        
        <div className="relative">
          <button 
            onClick={() => setShowEmojiPicker(!showEmojiPicker)}
            className="p-1 text-gray-500 hover:text-gray-700 rounded hover:bg-gray-200"
            title="Emoji"
          >
            <Smile className="w-4 h-4" />
          </button>
          
          {showEmojiPicker && (
            <div className="absolute bottom-full left-0 mb-2 p-2 bg-white border border-gray-200 rounded-lg shadow-lg z-10">
              <div className="grid grid-cols-5 gap-1">
                {emojis.map((emoji, index) => (
                  <button
                    key={index}
                    onClick={() => addEmoji(emoji)}
                    className="p-1 hover:bg-gray-100 rounded text-lg"
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
        
        <button 
          onClick={() => formatText('bold')}
          className="p-1 text-gray-500 hover:text-gray-700 rounded hover:bg-gray-200 font-bold"
          title="Kalın"
        >
          B
        </button>
        
        <button 
          onClick={() => formatText('italic')}
          className="p-1 text-gray-500 hover:text-gray-700 rounded hover:bg-gray-200 italic"
          title="İtalik"
        >
          I
        </button>
        
        <button 
          onClick={() => formatText('code')}
          className="p-1 text-gray-500 hover:text-gray-700 rounded hover:bg-gray-200"
          title="Kod"
        >
          <Code className="w-4 h-4" />
        </button>
        
        <button 
          onClick={() => formatText('quote')}
          className="p-1 text-gray-500 hover:text-gray-700 rounded hover:bg-gray-200"
          title="Alıntı"
        >
          <Quote className="w-4 h-4" />
        </button>
        
        <button 
          onClick={() => formatText('list')}
          className="p-1 text-gray-500 hover:text-gray-700 rounded hover:bg-gray-200"
          title="Liste"
        >
          <List className="w-4 h-4" />
        </button>
        
        <button 
          onClick={() => formatText('ordered-list')}
          className="p-1 text-gray-500 hover:text-gray-700 rounded hover:bg-gray-200"
          title="Numaralı Liste"
        >
          <ListOrdered className="w-4 h-4" />
        </button>
        
        {/* Workflow Menu Toggle */}
        <div className="relative">
          <button 
            onClick={() => setShowWorkflowMenu(!showWorkflowMenu)}
            className="p-1 text-blue-500 hover:text-blue-700 rounded hover:bg-blue-50"
            title="İş Akışı"
          >
            <Zap className="w-4 h-4" />
          </button>
          
          {/* Workflow Dropdown */}
          {showWorkflowMenu && (
            <div className="absolute bottom-full left-0 mb-2 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-10">
              <div className="p-2 space-y-1">
                <button
                  onClick={() => addWorkflowItem('task')}
                  className="w-full flex items-center space-x-2 px-2 py-1 text-sm text-gray-700 hover:bg-gray-100 rounded"
                >
                  <CheckSquare className="w-4 h-4" />
                  <span>Görev Oluştur</span>
                </button>
                <button
                  onClick={() => addWorkflowItem('meeting')}
                  className="w-full flex items-center space-x-2 px-2 py-1 text-sm text-gray-700 hover:bg-gray-100 rounded"
                >
                  <Calendar className="w-4 h-4" />
                  <span>Toplantı Planla</span>
                </button>
                <button
                  onClick={() => addWorkflowItem('poll')}
                  className="w-full flex items-center space-x-2 px-2 py-1 text-sm text-gray-700 hover:bg-gray-100 rounded"
                >
                  <BarChart3 className="w-4 h-4" />
                  <span>Anket Oluştur</span>
                </button>
                <button
                  onClick={() => addWorkflowItem('reminder')}
                  className="w-full flex items-center space-x-2 px-2 py-1 text-sm text-gray-700 hover:bg-gray-100 rounded"
                >
                  <Clock className="w-4 h-4" />
                  <span>Hatırlatıcı</span>
                </button>
                <button
                  onClick={() => addWorkflowItem('assign')}
                  className="w-full flex items-center space-x-2 px-2 py-1 text-sm text-gray-700 hover:bg-gray-100 rounded"
                >
                  <Users className="w-4 h-4" />
                  <span>Görev Ata</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        onChange={handleFileSelect}
        className="hidden"
        accept="image/*,.pdf,.doc,.docx,.txt"
      />

      {/* Message Input */}
      <div className="flex items-end space-x-2">
        <div className="flex-1 relative">
          <textarea
            ref={textareaRef}
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Mesajınızı yazın... (@ ile mention yapabilirsiniz)"
            className="w-full px-4 py-3 border border-gray-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
            rows={1}
            style={{ minHeight: '44px', maxHeight: '120px' }}
          />
        </div>

        {/* Send Button */}
        <button
          onClick={replyingTo ? sendReply : onSendMessage}
          disabled={!newMessage.trim()}
          className="p-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Send className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};

export default MessageInput;
