import React, { useRef, useState, useEffect } from 'react';
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
  Square,
  Play,
  X,
  Eye,
  Download
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
  onVoiceMessage?: (audioBlob: Blob) => void;
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
  setReplyContent,
  onVoiceMessage
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const contentEditableRef = useRef<HTMLDivElement>(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [isVoiceRecording, setIsVoiceRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [isPlayingVoice, setIsPlayingVoice] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const [showFilePreview, setShowFilePreview] = useState(false);
  const [transcript, setTranscript] = useState<string>('');
  const [isTranscribing, setIsTranscribing] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const recognitionRef = useRef<any>(null);

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (replyingTo) {
        sendReply();
      } else {
        onSendMessage();
      }
    }
    
    // Escape tuşu ile sesli kaydı durdur
    if (e.key === 'Escape' && isVoiceRecording) {
      e.preventDefault();
      stopVoiceRecording();
    }
  };

  const handleInput = () => {
    if (contentEditableRef.current) {
      const content = contentEditableRef.current.innerHTML;
      // Remove placeholder text if it exists
      const cleanContent = content.replace(/<div><br><\/div>/g, '').trim();
      setNewMessage(cleanContent);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      const file = files[0];
      setSelectedFile(file);
      setShowFilePreview(true);
      
      // Dosya önizlemesi oluştur
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (e) => {
          setFilePreview(e.target?.result as string);
        };
        reader.readAsDataURL(file);
      } else {
        setFilePreview(null);
      }
    }
  };

  const handleFileUpload = () => {
    if (selectedFile) {
      onFileUpload(selectedFile);
      clearFilePreview();
    }
  };

  const clearFilePreview = () => {
    setSelectedFile(null);
    setFilePreview(null);
    setShowFilePreview(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileIcon = (fileType: string) => {
    if (fileType.startsWith('image/')) return '🖼️';
    if (fileType.includes('pdf')) return '📄';
    if (fileType.includes('word') || fileType.includes('document')) return '📝';
    if (fileType.includes('excel') || fileType.includes('spreadsheet')) return '📊';
    if (fileType.includes('powerpoint') || fileType.includes('presentation')) return '📽️';
    if (fileType.includes('text')) return '📄';
    if (fileType.includes('audio')) return '🎵';
    if (fileType.includes('video')) return '🎬';
    if (fileType.includes('zip') || fileType.includes('rar')) return '📦';
    return '📎';
  };

  // Text formatting functions
  const formatText = (format: string) => {
    if (!contentEditableRef.current) return;
    
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) return;
    
    const range = selection.getRangeAt(0);
    const selectedText = range.toString();
    
    if (!selectedText) return;
    
    let formattedElement: HTMLElement;
    
    switch (format) {
      case 'bold':
        formattedElement = document.createElement('strong');
        break;
      case 'italic':
        formattedElement = document.createElement('em');
        break;
      case 'underline':
        formattedElement = document.createElement('u');
        break;
      case 'code':
        formattedElement = document.createElement('code');
        break;
      case 'quote':
        formattedElement = document.createElement('blockquote');
        break;
      case 'list':
        formattedElement = document.createElement('li');
        break;
      case 'ordered-list':
        formattedElement = document.createElement('li');
        break;
      default:
        return;
    }
    
    formattedElement.textContent = selectedText;
    range.deleteContents();
    range.insertNode(formattedElement);
    
    // Update the message state
    if (contentEditableRef.current) {
      setNewMessage(contentEditableRef.current.innerHTML);
    }
    
    // Clear selection
    selection.removeAllRanges();
  };

  const addEmoji = (emoji: string) => {
    if (contentEditableRef.current) {
      const selection = window.getSelection();
      if (selection && selection.rangeCount > 0) {
        const range = selection.getRangeAt(0);
        const textNode = document.createTextNode(emoji);
        range.insertNode(textNode);
        range.setStartAfter(textNode);
        range.setEndAfter(textNode);
        selection.removeAllRanges();
        selection.addRange(range);
      } else {
        contentEditableRef.current.innerHTML += emoji;
      }
      setNewMessage(contentEditableRef.current.innerHTML);
    }
    setShowEmojiPicker(false);
  };

  // Click outside handler for emoji picker
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      if (showEmojiPicker && !target.closest('.emoji-picker-container')) {
        setShowEmojiPicker(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showEmojiPicker]);

  // Sesli kayıt fonksiyonları
  const startVoiceRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];
      
      // Transcript'i sıfırla
      setTranscript('');
      setIsTranscribing(true);

      // Web Speech API ile gerçek zamanlı transcript
      if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
        const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
        const recognition = new SpeechRecognition();
        recognitionRef.current = recognition;
        
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = 'tr-TR'; // Türkçe dil desteği
        
        recognition.onresult = (event: any) => {
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
        
        recognition.onerror = (event: any) => {
          console.error('Speech recognition error:', event.error);
          setIsTranscribing(false);
        };
        
        recognition.onend = () => {
          setIsTranscribing(false);
        };
        
        recognition.start();
      }

      mediaRecorder.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data);
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' });
        setAudioBlob(audioBlob);
        
        // Speech recognition'ı durdur
        if (recognitionRef.current) {
          recognitionRef.current.stop();
          setIsTranscribing(false);
        }
        
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsVoiceRecording(true);
      setRecordingTime(0);
      
      // Kayıt süresini takip et
      recordingIntervalRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
    } catch (error) {
      console.error('Mikrofon erişimi hatası:', error);
      alert('Mikrofon erişimi sağlanamadı. Lütfen izin verin.');
    }
  };

  const stopVoiceRecording = () => {
    if (mediaRecorderRef.current && isVoiceRecording) {
      mediaRecorderRef.current.stop();
      setIsVoiceRecording(false);
      
      if (recordingIntervalRef.current) {
        clearInterval(recordingIntervalRef.current);
        recordingIntervalRef.current = null;
      }
    }
  };

  const sendVoiceMessage = () => {
    if (audioBlob && onVoiceMessage) {
      // Transcript ile birlikte ses mesajını gönder
      const voiceMessageData = {
        audioBlob,
        transcript: transcript.trim() || 'Transcript bulunamadı'
      };
      
      // onVoiceMessage prop'unu güncellemek için interface'i değiştirmemiz gerekiyor
      // Şimdilik transcript'i localStorage'a kaydedelim ve EmployeeChat'te kullanabilelim
      localStorage.setItem('lastVoiceTranscript', transcript.trim() || 'Transcript bulunamadı');
      
      onVoiceMessage(audioBlob);
      setAudioBlob(null);
      setTranscript('');
      setRecordingTime(0);
    }
  };

  const playVoiceMessage = () => {
    if (audioBlob) {
      const audio = new Audio(URL.createObjectURL(audioBlob));
      setIsPlayingVoice(true);
      
      audio.onended = () => {
        setIsPlayingVoice(false);
      };
      
      audio.play();
    }
  };

  const cancelVoiceRecording = () => {
    if (mediaRecorderRef.current && isVoiceRecording) {
      mediaRecorderRef.current.stop();
      setIsVoiceRecording(false);
      setAudioBlob(null);
      setRecordingTime(0);
      
      if (recordingIntervalRef.current) {
        clearInterval(recordingIntervalRef.current);
        recordingIntervalRef.current = null;
      }
    }
  };

  // Component unmount olduğunda interval'ı temizle
  useEffect(() => {
    return () => {
      if (recordingIntervalRef.current) {
        clearInterval(recordingIntervalRef.current);
      }
    };
  }, []);

  // Emoji picker için click-outside handler
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (showEmojiPicker && !(event.target as Element).closest('.emoji-picker-container')) {
        setShowEmojiPicker(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showEmojiPicker]);

  // Global Escape tuşu ile sesli kaydı durdur
  useEffect(() => {
    const handleEscapeKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isVoiceRecording) {
        e.preventDefault();
        stopVoiceRecording();
      }
    };

    document.addEventListener('keydown', handleEscapeKey);
    return () => {
      document.removeEventListener('keydown', handleEscapeKey);
    };
  }, [isVoiceRecording]);



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
        
                 <div className="relative emoji-picker-container">
           <button 
             onClick={() => setShowEmojiPicker(!showEmojiPicker)}
             className="p-1 text-gray-500 hover:text-gray-700 rounded hover:bg-gray-200"
             title="Emoji"
           >
             <Smile className="w-4 h-4" />
           </button>
           
           {showEmojiPicker && (
             <div className="absolute bottom-full left-0 mb-2 p-2 bg-white border border-gray-200 rounded-lg shadow-xl z-50 min-w-max">
               <div className="grid grid-cols-5 gap-1">
                 {emojis.map((emoji, index) => (
                   <button
                     key={index}
                     onClick={() => addEmoji(emoji)}
                     className="p-1 hover:bg-gray-100 rounded text-lg transition-colors"
                   >
                     {emoji}
                   </button>
                 ))}
               </div>
             </div>
           )}
         </div>

         {/* Sesli Kayıt Butonu */}
         {!isVoiceRecording && !audioBlob && (
           <button
             onClick={startVoiceRecording}
             className="p-1 text-gray-500 hover:text-gray-700 rounded hover:bg-gray-200"
             title="Sesli Mesaj Kaydet"
           >
             <Mic className="w-4 h-4" />
           </button>
         )}

         {/* Kayıt Sırasında Durdur Butonu */}
         {isVoiceRecording && (
           <button
             onClick={stopVoiceRecording}
             className="p-2 text-white bg-red-500 hover:bg-red-600 rounded-full animate-pulse shadow-lg"
             title="Kaydı Durdur"
           >
             <Square className="w-5 h-5" />
           </button>
         )}

         {/* Kayıt Tamamlandığında Kontroller */}
         {audioBlob && !isVoiceRecording && (
           <div className="flex items-center space-x-1">
             <button
               onClick={playVoiceMessage}
               className="p-1 text-green-500 hover:text-green-700 rounded hover:bg-green-100"
               title="Sesli Mesajı Dinle"
             >
               <Play className="w-4 h-4" />
             </button>
             <button
               onClick={sendVoiceMessage}
               className="p-1 text-blue-500 hover:text-blue-700 rounded hover:bg-blue-100"
               title="Sesli Mesajı Gönder"
             >
               <Send className="w-4 h-4" />
             </button>
             <button
               onClick={cancelVoiceRecording}
               className="p-1 text-red-500 hover:text-red-700 rounded hover:bg-red-100"
               title="Kaydı İptal Et"
             >
               <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
               </svg>
             </button>
           </div>
         )}
        
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
        
                 {/* Yeni Özellikler - Gelişmiş Arama */}
         <button 
           onClick={() => {
             // Bu fonksiyon EmployeeChat'ten gelecek
             window.dispatchEvent(new CustomEvent('openAdvancedSearch'));
           }}
           className="p-1 text-gray-500 hover:text-gray-700 rounded hover:bg-gray-200"
           title="Gelişmiş Arama"
         >
           <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
             <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.207A1 1 0 013 6.5V4z" />
           </svg>
         </button>

         {/* Yeni Özellikler - Anket Oluştur */}
         <button 
           onClick={() => {
             window.dispatchEvent(new CustomEvent('openPollCreator'));
           }}
           className="p-1 text-gray-500 hover:text-gray-700 rounded hover:bg-gray-200"
           title="Anket Oluştur"
         >
           <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
             <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
           </svg>
         </button>

         {/* Yeni Özellikler - Mesaj Şablonları */}
         <button 
           onClick={() => {
             window.dispatchEvent(new CustomEvent('openTemplateSelector'));
           }}
           className="p-1 text-gray-500 hover:text-gray-700 rounded hover:bg-gray-200"
           title="Mesaj Şablonları"
         >
           <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
             <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
           </svg>
         </button>

         {/* Yeni Özellikler - Görev Oluştur */}
         <button 
           onClick={() => {
             window.dispatchEvent(new CustomEvent('openTaskCreator'));
           }}
           className="p-1 text-gray-500 hover:text-gray-700 rounded hover:bg-gray-200"
           title="Görev Oluştur"
         >
           <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
             <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 7l2 2 4-4" />
           </svg>
         </button>

         {/* Yeni Özellikler - Akıllı Özetleme */}
         <button 
           onClick={() => {
             window.dispatchEvent(new CustomEvent('generateSummary'));
           }}
           className="p-1 text-gray-500 hover:text-gray-700 rounded hover:bg-gray-200"
           title="Akıllı Özetleme"
         >
           <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
             <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
           </svg>
         </button>


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
            <div
              ref={contentEditableRef}
              contentEditable
              onInput={handleInput}
              onKeyPress={handleKeyPress}
              data-placeholder="Mesajınızı yazın... (@ ile mention yapabilirsiniz)"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[44px] max-h-[120px] overflow-y-auto empty:before:content-[attr(data-placeholder)] empty:before:text-gray-400 empty:before:pointer-events-none"
              style={{ minHeight: '44px', maxHeight: '120px' }}
            />
          </div>

         {/* Send Button */}
         <button
           onClick={replyingTo ? sendReply : onSendMessage}
           disabled={!newMessage || newMessage.trim() === '' || newMessage === '<div><br></div>'}
           className="p-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
         >
           <Send className="w-5 h-5" />
         </button>
       </div>

       {/* Sesli Kayıt Durumu */}
       {isVoiceRecording && (
         <div className="flex items-center justify-between p-4 bg-red-50 border-2 border-red-300 rounded-lg shadow-lg">
           <div className="flex items-center space-x-3">
             <div className="w-4 h-4 bg-red-500 rounded-full animate-pulse"></div>
             <span className="text-base text-red-700 font-semibold">
               🎤 Kayıt yapılıyor... {Math.floor(recordingTime / 60)}:{(recordingTime % 60).toString().padStart(2, '0')}
             </span>
           </div>
           <button
             onClick={stopVoiceRecording}
             className="px-4 py-2 text-white bg-red-500 hover:bg-red-600 rounded-lg shadow-lg font-medium transition-colors"
             title="Kaydı Durdur"
           >
             <div className="flex items-center space-x-2">
               <Square className="w-5 h-5" />
               <span>Durdur</span>
             </div>
           </button>
         </div>
       )}

       {/* Gerçek Zamanlı Transcript */}
       {isVoiceRecording && transcript && (
         <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
           <div className="flex items-center justify-between mb-2">
             <span className="text-sm font-medium text-blue-700 flex items-center space-x-2">
               <span>🎯</span>
               <span>Gerçek Zamanlı Transcript</span>
             </span>
             <span className="text-xs text-blue-500">
               {isTranscribing ? 'Dinleniyor...' : 'Tamamlandı'}
             </span>
           </div>
           <div className="p-2 bg-white border border-blue-100 rounded text-sm text-gray-800 min-h-[40px]">
             {transcript || 'Konuşma algılanıyor...'}
           </div>
         </div>
       )}

       {/* Sesli Mesaj Önizleme */}
       {audioBlob && !isVoiceRecording && (
         <div className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg">
           <div className="flex items-center space-x-2">
             <div className="w-3 h-3 bg-green-500 rounded-full"></div>
             <span className="text-sm text-green-700 font-medium">
               Sesli mesaj hazır ({Math.floor(recordingTime / 60)}:{(recordingTime % 60).toString().padStart(2, '0')})
             </span>
           </div>
           <div className="flex items-center space-x-1">
             <button
               onClick={playVoiceMessage}
               className="p-1 text-green-600 hover:text-green-800 rounded hover:bg-green-100"
               title="Dinle"
             >
               <Play className="w-4 h-4" />
             </button>
             <button
               onClick={sendVoiceMessage}
               className="p-1 text-blue-600 hover:text-blue-800 rounded hover:bg-blue-100"
               title="Gönder"
             >
               <Send className="w-4 h-4" />
             </button>
             <button
               onClick={cancelVoiceRecording}
               className="p-1 text-red-600 hover:text-red-800 rounded hover:bg-red-100"
               title="İptal"
             >
               <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
               </svg>
             </button>
           </div>
         </div>
       )}

       {/* Dosya Önizleme */}
       {showFilePreview && selectedFile && (
         <div className="p-4 bg-blue-50 border-2 border-blue-300 rounded-lg shadow-lg">
           <div className="flex items-start justify-between mb-3">
             <h4 className="text-lg font-semibold text-blue-800">Dosya Önizleme</h4>
             <button
               onClick={clearFilePreview}
               className="p-1 text-blue-600 hover:text-blue-800 rounded hover:bg-blue-100"
               title="Önizlemeyi Kapat"
               type="button"
             >
               <X className="w-5 h-5" />
             </button>
           </div>
           
           {/* Dosya Bilgileri */}
           <div className="flex items-center space-x-3 mb-4">
             <div className="text-3xl">{getFileIcon(selectedFile.type)}</div>
             <div className="flex-1">
               <p className="font-medium text-gray-900">{selectedFile.name}</p>
               <p className="text-sm text-gray-600">
                 {formatFileSize(selectedFile.size)} • {selectedFile.type || 'Bilinmeyen tip'}
               </p>
             </div>
           </div>

           {/* Görsel Önizleme (Resim dosyaları için) */}
           {filePreview && selectedFile.type.startsWith('image/') && (
             <div className="mb-4">
               <div className="relative group">
                 <img
                   src={filePreview}
                   alt={selectedFile.name}
                   className="max-w-full max-h-64 rounded-lg border border-gray-300 shadow-sm"
                 />
                 <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all duration-200 rounded-lg flex items-center justify-center">
                   <button
                     onClick={() => window.open(filePreview, '_blank')}
                     className="opacity-0 group-hover:opacity-100 bg-white bg-opacity-90 p-2 rounded-full shadow-lg transition-all duration-200 hover:bg-opacity-100"
                     title="Büyük Görüntüle"
                     type="button"
                   >
                     <Eye className="w-5 h-5 text-gray-700" />
                   </button>
                 </div>
               </div>
             </div>
           )}

           {/* PDF Önizleme */}
           {selectedFile.type === 'application/pdf' && (
             <div className="mb-4 p-4 bg-gray-100 rounded-lg border border-gray-300">
               <div className="flex items-center space-x-2 text-gray-700">
                 <File className="w-5 h-5" />
                 <span className="font-medium">PDF Dosyası</span>
               </div>
               <p className="text-sm text-gray-600 mt-1">
                 PDF dosyaları önizlenemez. Dosyayı yüklemek için "Dosyayı Yükle" butonuna tıklayın.
               </p>
             </div>
           )}

           {/* Diğer Dosya Tipleri */}
           {!filePreview && !selectedFile.type.startsWith('image/') && selectedFile.type !== 'application/pdf' && (
             <div className="mb-4 p-4 bg-gray-100 rounded-lg border border-gray-300">
               <div className="flex items-center space-x-2 text-gray-700">
                 <File className="w-5 h-5" />
                 <span className="font-medium">{selectedFile.type || 'Bilinmeyen Dosya Tipi'}</span>
               </div>
               <p className="text-sm text-gray-600 mt-1">
                 Bu dosya tipi önizlenemez. Dosyayı yüklemek için "Dosyayı Yükle" butonuna tıklayın.
               </p>
             </div>
           )}

           {/* Aksiyon Butonları */}
           <div className="flex items-center space-x-3">
             <button
               onClick={handleFileUpload}
               className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 font-medium transition-colors flex items-center space-x-2"
               title="Dosyayı Yükle"
               type="button"
             >
               <Download className="w-4 h-4" />
               <span>Dosyayı Yükle</span>
             </button>
             <button
               onClick={clearFilePreview}
               className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 font-medium transition-colors flex items-center space-x-2"
               title="İptal Et"
               type="button"
             >
               <X className="w-4 h-4" />
               <span>İptal Et</span>
             </button>
           </div>
         </div>
       )}
    </div>
  );
};

export default MessageInput;
