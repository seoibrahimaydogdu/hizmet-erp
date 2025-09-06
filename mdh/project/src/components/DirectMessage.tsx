import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { 
  Search, 
  MessageSquare, 
  Phone, 
  Video, 
  Send, 
  Paperclip, 
  Smile,
  User,
  Crown,
  Shield,
  Building,
  CheckCircle,
  CheckCircle2,
  X
} from 'lucide-react';
import { toast } from 'react-hot-toast';

interface Employee {
  id: string;
  name: string;
  email: string;
  position: string;
  department: string;
  role: 'employee' | 'manager' | 'admin' | 'hr';
  avatar: string;
  status: 'online' | 'away' | 'busy' | 'offline';
  lastSeen?: Date;
  phone?: string;
}

interface Message {
  id: string;
  senderId: string;
  senderName: string;
  senderRole: string;
  content: string;
  timestamp: Date;
  isRead: boolean;
  messageType: 'text' | 'file' | 'image';
  attachments?: any[];
}

interface DirectMessageProps {
  currentUser: Employee;
  onClose?: () => void;
  initialEmployee?: Employee; // Başlangıçta seçili olacak kişi
}

const DirectMessage: React.FC<DirectMessageProps> = ({ currentUser, onClose, initialEmployee }) => {
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(initialEmployee || null);
  const [searchTerm, setSearchTerm] = useState('');
  const [newMessage, setNewMessage] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [showEmployeeList, setShowEmployeeList] = useState(!initialEmployee); // Eğer initialEmployee varsa liste gizli başlasın

  // initialEmployee değiştiğinde selectedEmployee'yi güncelle
  useEffect(() => {
    if (initialEmployee) {
      setSelectedEmployee(initialEmployee);
      setShowEmployeeList(false);
    }
  }, [initialEmployee]);

  // Tüm çalışanları ve müdürleri içeren mock data
  const allEmployees: Employee[] = useMemo(() => [
    // Müdürler ve Yöneticiler
    {
      id: 'mgr-001',
      name: 'Mehmet Demir',
      email: 'mehmet.demir@sirket.com',
      position: 'Genel Müdür',
      department: 'Yönetim',
      role: 'manager',
      avatar: 'MD',
      status: 'online',
      phone: '+90 532 123 4567'
    },
    {
      id: 'mgr-002',
      name: 'Ayşe Kaya',
      email: 'ayse.kaya@sirket.com',
      position: 'İK Müdürü',
      department: 'İnsan Kaynakları',
      role: 'hr',
      avatar: 'AK',
      status: 'away',
      phone: '+90 532 234 5678'
    },
    {
      id: 'mgr-003',
      name: 'Can Özkan',
      email: 'can.ozkan@sirket.com',
      position: 'IT Müdürü',
      department: 'Bilgi İşlem',
      role: 'manager',
      avatar: 'CO',
      status: 'online',
      phone: '+90 532 345 6789'
    },
    {
      id: 'mgr-004',
      name: 'Zeynep Kaya',
      email: 'zeynep.kaya@sirket.com',
      position: 'Proje Yöneticisi',
      department: 'Proje Yönetimi',
      role: 'manager',
      avatar: 'ZK',
      status: 'online',
      phone: '+90 532 456 7890'
    },
    // Çalışanlar
    {
      id: 'emp-001',
      name: 'Ahmet Yılmaz',
      email: 'ahmet.yilmaz@sirket.com',
      position: 'Yazılım Geliştirici',
      department: 'IT',
      role: 'employee',
      avatar: 'AY',
      status: 'online'
    },
    {
      id: 'emp-002',
      name: 'Fatma Demir',
      email: 'fatma.demir@sirket.com',
      position: 'UI/UX Tasarımcı',
      department: 'IT',
      role: 'employee',
      avatar: 'FD',
      status: 'away'
    },
    {
      id: 'emp-003',
      name: 'Ali Veli',
      email: 'ali.veli@sirket.com',
      position: 'Test Uzmanı',
      department: 'IT',
      role: 'employee',
      avatar: 'AV',
      status: 'offline'
    },
    {
      id: 'emp-004',
      name: 'Elif Şahin',
      email: 'elif.sahin@sirket.com',
      position: 'Muhasebe Uzmanı',
      department: 'Muhasebe',
      role: 'employee',
      avatar: 'ES',
      status: 'online'
    },
    {
      id: 'emp-005',
      name: 'Burak Kılıç',
      email: 'burak.kilic@sirket.com',
      position: 'Satış Temsilcisi',
      department: 'Satış',
      role: 'employee',
      avatar: 'BK',
      status: 'busy'
    },
    {
      id: 'emp-006',
      name: 'Selin Öztürk',
      email: 'selin.ozturk@sirket.com',
      position: 'Pazarlama Uzmanı',
      department: 'Pazarlama',
      role: 'employee',
      avatar: 'SO',
      status: 'online'
    },
    {
      id: 'emp-007',
      name: 'Emre Yıldız',
      email: 'emre.yildiz@sirket.com',
      position: 'Sistem Yöneticisi',
      department: 'IT',
      role: 'employee',
      avatar: 'EY',
      status: 'away'
    },
    {
      id: 'emp-008',
      name: 'Gamze Arslan',
      email: 'gamze.arslan@sirket.com',
      position: 'İK Uzmanı',
      department: 'İnsan Kaynakları',
      role: 'employee',
      avatar: 'GA',
      status: 'online'
    }
  ], []);

  // Filtrelenmiş çalışan listesi
  const filteredEmployees = useMemo(() => {
    return allEmployees.filter(emp => 
      emp.id !== currentUser.id && // Kendisini hariç tut
      (emp.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
       emp.position.toLowerCase().includes(searchTerm.toLowerCase()) ||
       emp.department.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  }, [allEmployees, currentUser.id, searchTerm]);

  // Rol ikonları
  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'manager':
        return <Crown className="w-4 h-4 text-yellow-600" />;
      case 'hr':
        return <Shield className="w-4 h-4 text-blue-600" />;
      case 'admin':
        return <Building className="w-4 h-4 text-purple-600" />;
      default:
        return <User className="w-4 h-4 text-gray-600" />;
    }
  };

  // Durum rengi
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'online':
        return 'bg-green-500';
      case 'away':
        return 'bg-yellow-500';
      case 'busy':
        return 'bg-red-500';
      case 'offline':
        return 'bg-gray-400';
      default:
        return 'bg-gray-400';
    }
  };

  // Durum metni
  const getStatusText = (status: string) => {
    switch (status) {
      case 'online':
        return 'Çevrimiçi';
      case 'away':
        return 'Uzakta';
      case 'busy':
        return 'Meşgul';
      case 'offline':
        return 'Çevrimdışı';
      default:
        return 'Bilinmiyor';
    }
  };

  // Çalışan seçme
  const handleSelectEmployee = useCallback((employee: Employee) => {
    setSelectedEmployee(employee);
    setShowEmployeeList(false);
    setMessages([]); // Yeni konuşma başlat
    toast.success(`${employee.name} ile mesajlaşma başlatıldı`);
  }, []);

  // Mesaj gönderme
  const handleSendMessage = useCallback(() => {
    if (!newMessage.trim() || !selectedEmployee) return;

    const message: Message = {
      id: Date.now().toString(),
      senderId: currentUser.id,
      senderName: currentUser.name,
      senderRole: currentUser.role,
      content: newMessage,
      timestamp: new Date(),
      isRead: false,
      messageType: 'text'
    };

    setMessages(prev => [...prev, message]);
    setNewMessage('');

    // Mock otomatik yanıt
    setTimeout(() => {
      const autoReply: Message = {
        id: (Date.now() + 1).toString(),
        senderId: selectedEmployee.id,
        senderName: selectedEmployee.name,
        senderRole: selectedEmployee.role,
        content: 'Mesajınızı aldım, en kısa sürede yanıtlayacağım.',
        timestamp: new Date(),
        isRead: true,
        messageType: 'text'
      };
      setMessages(prev => [...prev, autoReply]);
    }, 2000);

    toast.success('Mesaj gönderildi');
  }, [newMessage, selectedEmployee, currentUser]);

  // Enter tuşu ile mesaj gönderme
  const handleKeyPress = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  }, [handleSendMessage]);

  // Geri dönme
  const handleBack = useCallback(() => {
    if (selectedEmployee) {
      setSelectedEmployee(null);
      setShowEmployeeList(true);
    } else if (onClose) {
      onClose();
    }
  }, [selectedEmployee, onClose]);

  return (
    <div className="h-full flex flex-col bg-white dark:bg-gray-900">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center space-x-3">
          {selectedEmployee && (
            <button
              onClick={handleBack}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            </button>
          )}
          <div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              {selectedEmployee ? `Mesajlaşma - ${selectedEmployee.name}` : 'Doğrudan Mesaj'}
            </h2>
            {selectedEmployee && (
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {selectedEmployee.position} • {selectedEmployee.department}
              </p>
            )}
          </div>
        </div>
        
        {selectedEmployee && (
          <div className="flex items-center space-x-2">
                <button className="p-2 text-gray-700 dark:text-gray-300 hover:text-green-600 dark:hover:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-lg transition-colors">
                  <Phone className="w-5 h-5" />
                </button>
                <button className="p-2 text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors">
                  <Video className="w-5 h-5" />
                </button>
          </div>
        )}
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Çalışan Listesi */}
        {showEmployeeList && (
          <div className="w-80 border-r border-gray-200 dark:border-gray-700 flex flex-col">
            {/* Arama */}
            <div className="p-4 border-b border-gray-200 dark:border-gray-700">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Çalışan ara..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* Çalışan Listesi */}
            <div className="flex-1 overflow-y-auto">
              <div className="p-2">
                {/* Müdürler ve Yöneticiler */}
                <div className="mb-4">
                  <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2 px-2">
                    Müdürler ve Yöneticiler
                  </h3>
                  <div className="space-y-1">
                    {filteredEmployees
                      .filter(emp => emp.role === 'manager' || emp.role === 'hr' || emp.role === 'admin')
                      .map((employee) => (
                        <button
                          key={employee.id}
                          onClick={() => handleSelectEmployee(employee)}
                          className="w-full flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-left"
                        >
                          <div className="relative">
                            <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center text-white font-semibold text-sm">
                              {employee.avatar}
                            </div>
                            <div className={`absolute -bottom-1 -right-1 w-3 h-3 rounded-full border-2 border-white dark:border-gray-800 ${getStatusColor(employee.status)}`}></div>
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center space-x-2">
                              <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                                {employee.name}
                              </p>
                              {getRoleIcon(employee.role)}
                            </div>
                            <p className="text-xs text-gray-600 dark:text-gray-400 truncate">
                              {employee.position}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-500 truncate">
                              {employee.department}
                            </p>
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            {getStatusText(employee.status)}
                          </div>
                        </button>
                      ))}
                  </div>
                </div>

                {/* Çalışanlar */}
                <div>
                  <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2 px-2">
                    Çalışanlar
                  </h3>
                  <div className="space-y-1">
                    {filteredEmployees
                      .filter(emp => emp.role === 'employee')
                      .map((employee) => (
                        <button
                          key={employee.id}
                          onClick={() => handleSelectEmployee(employee)}
                          className="w-full flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-left"
                        >
                          <div className="relative">
                            <div className="w-10 h-10 bg-gray-600 rounded-full flex items-center justify-center text-white font-semibold text-sm">
                              {employee.avatar}
                            </div>
                            <div className={`absolute -bottom-1 -right-1 w-3 h-3 rounded-full border-2 border-white dark:border-gray-800 ${getStatusColor(employee.status)}`}></div>
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center space-x-2">
                              <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                                {employee.name}
                              </p>
                              {getRoleIcon(employee.role)}
                            </div>
                            <p className="text-xs text-gray-600 dark:text-gray-400 truncate">
                              {employee.position}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-500 truncate">
                              {employee.department}
                            </p>
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            {getStatusText(employee.status)}
                          </div>
                        </button>
                      ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Mesajlaşma Alanı */}
        {selectedEmployee && (
          <div className="flex-1 flex flex-col">
            {/* Mesajlar */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.length === 0 ? (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center">
                    <MessageSquare className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500 dark:text-gray-400">
                      {selectedEmployee.name} ile mesajlaşmaya başlayın
                    </p>
                  </div>
                </div>
              ) : (
                messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${message.senderId === currentUser.id ? 'justify-end' : 'justify-start'}`}
                  >
                    <div className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                      message.senderId === currentUser.id
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white'
                    }`}>
                      <p className="text-sm">{message.content}</p>
                      <div className={`flex items-center justify-between mt-1 ${
                        message.senderId === currentUser.id
                          ? 'text-blue-100'
                          : 'text-gray-500 dark:text-gray-400'
                      }`}>
                        <span className="text-xs">
                          {message.timestamp.toLocaleTimeString('tr-TR', { 
                            hour: '2-digit', 
                            minute: '2-digit' 
                          })}
                        </span>
                        {message.senderId === currentUser.id && (
                          <div className="flex items-center space-x-1">
                            {message.isRead ? (
                              <CheckCircle2 className="w-3 h-3" />
                            ) : (
                              <CheckCircle className="w-3 h-3" />
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Mesaj Gönderme */}
            <div className="border-t border-gray-200 dark:border-gray-700 p-4">
              <div className="flex items-center space-x-2">
                <button className="p-2 text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors">
                  <Paperclip className="w-5 h-5" />
                </button>
                <div className="flex-1 relative">
                  <input
                    type="text"
                    placeholder={`${selectedEmployee.name} ile mesajlaş...`}
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyPress={handleKeyPress}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <button className="p-2 text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors">
                  <Smile className="w-5 h-5" />
                </button>
                <button
                  onClick={handleSendMessage}
                  disabled={!newMessage.trim()}
                  className="p-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
                >
                  <Send className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DirectMessage;
