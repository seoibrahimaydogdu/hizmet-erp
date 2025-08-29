import React, { useState } from 'react';
import { 
  Hash, 
  Lock, 
  Users, 
  Pin, 
  MoreHorizontal,
  Plus,
  Search,
  Filter,
  Mic,
  HelpCircle
} from 'lucide-react';
import { Channel } from './types';
import toast from 'react-hot-toast';

interface ChannelListProps {
  channels: Channel[];
  selectedChannel: Channel | null;
  onChannelSelect: (channel: Channel) => void;
  onCreateChannel: () => void;
  searchTerm: string;
  onSearchChange: (term: string) => void;
  showChannelList: boolean;
  onChannelUpdate?: (updatedChannels: Channel[]) => void;
}

const ChannelList: React.FC<ChannelListProps> = ({
  channels,
  selectedChannel,
  onChannelSelect,
  onCreateChannel,
  searchTerm,
  onSearchChange,
  showChannelList,
  onChannelUpdate
}) => {
  const [showChannelMenu, setShowChannelMenu] = useState<string | null>(null);
  const [showFilterMenu, setShowFilterMenu] = useState(false);
  const [filterType, setFilterType] = useState<'all' | 'public' | 'private' | 'direct'>('all');
  const [isListening, setIsListening] = useState(false);
  const [showHelpModal, setShowHelpModal] = useState(false);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [advancedFilters, setAdvancedFilters] = useState({
    hasUnread: false,
    isPinned: false,
    hasRecentActivity: false,
    memberCount: 'all' as 'all' | 'small' | 'medium' | 'large'
  });
  const [showArchivedChannels, setShowArchivedChannels] = useState(false);
  const [sortBy, setSortBy] = useState<'name' | 'activity' | 'unread'>('activity');
  const [showChannelStats, setShowChannelStats] = useState(false);
  const [showCreateChannelModal, setShowCreateChannelModal] = useState(false);
  const [showArchiveModal, setShowArchiveModal] = useState(false);
  const [newChannelForm, setNewChannelForm] = useState({
    name: '',
    description: '',
    type: 'public' as 'public' | 'private' | 'direct',
    members: [] as string[]
  });

  const filteredChannels = channels.filter(channel => {
    const matchesSearch = channel.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterType === 'all' || channel.type === filterType;
    
    // Gelişmiş filtreler
    const matchesUnread = !advancedFilters.hasUnread || (channel.unreadCount && channel.unreadCount > 0);
    const matchesPinned = !advancedFilters.isPinned || channel.isPinned;
    const matchesRecentActivity = !advancedFilters.hasRecentActivity || channel.lastMessageTime;
    const matchesMemberCount = advancedFilters.memberCount === 'all' || 
      (advancedFilters.memberCount === 'small' && channel.members.length <= 5) ||
      (advancedFilters.memberCount === 'medium' && channel.members.length > 5 && channel.members.length <= 20) ||
      (advancedFilters.memberCount === 'large' && channel.members.length > 20);
    
    // Arşivlenmiş kanalları filtrele
    const matchesArchived = showArchivedChannels ? true : !channel.isArchived;
    
    return matchesSearch && matchesFilter && matchesUnread && matchesPinned && matchesRecentActivity && matchesMemberCount && matchesArchived;
  }).sort((a, b) => {
    // Önce sabitlenen kanalları en üste koy
    if (a.isPinned && !b.isPinned) return -1;
    if (!a.isPinned && b.isPinned) return 1;
    
    // Sonra diğer sıralama kriterlerini uygula
    switch (sortBy) {
      case 'name':
        return a.name.localeCompare(b.name);
      case 'activity':
        return (b.lastMessageTime || 0) - (a.lastMessageTime || 0);
      case 'unread':
        return (b.unreadCount || 0) - (a.unreadCount || 0);
      default:
        return 0;
    }
  });

  const getChannelIcon = (channel: Channel) => {
    if (channel.type === 'private') return <Lock className="w-4 h-4" />;
    if (channel.type === 'direct') return <Users className="w-4 h-4" />;
    return <Hash className="w-4 h-4" />;
  };

  const handleChannelAction = (channelId: string, action: string) => {
    const channel = channels.find(c => c.id === channelId);
    if (!channel) return;

    switch (action) {
      case 'pin':
        // Kanalı sabitle/sabitlemeyi kaldır
        const updatedChannels = channels.map(c => 
          c.id === channelId ? { ...c, isPinned: !c.isPinned } : c
        );
        if (onChannelUpdate) {
          onChannelUpdate(updatedChannels);
        }
        // Burada gerçek uygulamada API çağrısı yapılır
        console.log(`${channel.name} kanalı ${channel.isPinned ? 'sabitlemeyi kaldırıldı' : 'sabitlendi'}`);
        
        // Başarı mesajı göster
        const action = channel.isPinned ? 'sabitlemeyi kaldırıldı' : 'sabitlendi';
        toast.success(`${channel.name} kanalı ${action}`);
        break;
        
      case 'mute':
        // Kanalı sessize al/sessizi kaldır
        const mutedChannels = channels.map(c => 
          c.id === channelId ? { ...c, isMuted: !c.isMuted } : c
        );
        if (onChannelUpdate) {
          onChannelUpdate(mutedChannels);
        }
        console.log(`${channel.name} kanalı ${channel.isMuted ? 'sessizi kaldırıldı' : 'sessize alındı'}`);
        
        // Başarı mesajı göster
        const muteAction = channel.isMuted ? 'sessizi kaldırıldı' : 'sessize alındı';
        toast.success(`${channel.name} kanalı ${muteAction}`);
        break;
        
      case 'archive':
        // Kanali arşivle/arşivden çıkar
        const archivedChannels = channels.map(c => 
          c.id === channelId ? { ...c, isArchived: !c.isArchived } : c
        );
        if (onChannelUpdate) {
          onChannelUpdate(archivedChannels);
        }
        console.log(`${channel.name} kanalı ${channel.isArchived ? 'arşivden çıkarıldı' : 'arşivlendi'}`);
        
        // Başarı mesajı göster
        const archiveAction = channel.isArchived ? 'arşivden çıkarıldı' : 'arşivlendi';
        toast.success(`${channel.name} kanalı ${archiveAction}`);
        break;
        
      case 'leave':
        // Kanaldan ayrıl
        if (confirm(`${channel.name} kanalından ayrılmak istediğinizden emin misiniz?`)) {
          console.log(`${channel.name} kanalından ayrıldınız`);
          toast.success(`${channel.name} kanalından ayrıldınız`);
          // Burada gerçek uygulamada API çağrısı yapılır
        }
        break;
        
      case 'markAsRead':
        // Okundu olarak işaretle
        const readChannels = channels.map(c => 
          c.id === channelId ? { ...c, unreadCount: 0 } : c
        );
        if (onChannelUpdate) {
          onChannelUpdate(readChannels); // Parent component'e güncellenmiş kanalları gönder
        }
        console.log(`${channel.name} kanalı okundu olarak işaretlendi`);
        toast.success(`${channel.name} kanalı okundu olarak işaretlendi`);
        break;
    }
    setShowChannelMenu(null);
  };

  const startVoiceSearch = () => {
    if (!('webkitSpeechRecognition' in window)) {
      alert('Sesli arama bu tarayıcıda desteklenmiyor');
      return;
    }

    setIsListening(true);
    const recognition = new (window as any).webkitSpeechRecognition();
    recognition.lang = 'tr-TR';
    recognition.continuous = false;
    recognition.interimResults = false;
    
    recognition.onstart = () => {
      console.log('Sesli arama başladı...');
    };
    
    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      onSearchChange(transcript);
      setIsListening(false);
    };
    
    recognition.onerror = (event: any) => {
      console.error('Sesli arama hatası:', event.error);
      setIsListening(false);
      if (event.error === 'no-speech') {
        alert('Ses algılanamadı. Lütfen tekrar deneyin.');
      }
    };
    
    recognition.onend = () => {
      setIsListening(false);
    };
    
    try {
      recognition.start();
    } catch (error) {
      console.error('Sesli arama başlatılamadı:', error);
      setIsListening(false);
    }
  };

  const showHelp = () => {
    setShowHelpModal(true);
  };

  const clearAllFilters = () => {
    setFilterType('all');
    setAdvancedFilters({
      hasUnread: false,
      isPinned: false,
      hasRecentActivity: false,
      memberCount: 'all'
    });
    setShowFilterMenu(false);
    setShowAdvancedFilters(false);
  };

  const handleCreateChannel = () => {
    if (!newChannelForm.name.trim()) {
      alert('Kanal adı gereklidir');
      return;
    }

    // Yeni kanal oluştur
    const newChannel = {
      id: Date.now().toString(),
      name: newChannelForm.name,
      description: newChannelForm.description,
      type: newChannelForm.type,
      members: newChannelForm.members,
      isPinned: false,
      isArchived: false,
      isMuted: false,
      lastMessage: '',
      lastMessageTime: Date.now(),
      unreadCount: 0
    };

    console.log('Yeni kanal oluşturuldu:', newChannel);
    // Burada gerçek uygulamada API çağrısı yapılır
    
    // Formu temizle
    setNewChannelForm({
      name: '',
      description: '',
      type: 'public',
      members: []
    });
    setShowCreateChannelModal(false);
  };

  const handleBulkArchive = () => {
    const channelsToArchive = channels.filter(channel => 
      !channel.isArchived && channel.type !== 'public'
    );

    if (channelsToArchive.length === 0) {
      alert('Arşivlenecek kanal bulunamadı');
      return;
    }

    if (confirm(`${channelsToArchive.length} kanalı arşivlemek istediğinizden emin misiniz?`)) {
      console.log('Kanallar arşivlendi:', channelsToArchive.map(c => c.name));
      // Burada gerçek uygulamada API çağrısı yapılır
      setShowArchiveModal(false);
    }
  };

  return (
    <div className="w-80 bg-white border-r border-gray-200 flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <h1 className="text-lg font-semibold text-gray-900">Mesajlaşma Sistemi</h1>
      </div>

      {/* Channels Section */}
      <div className="p-4 border-b border-gray-200">
                 <div className="flex items-center justify-between mb-4">
           <div className="flex items-center space-x-2">
             <h2 className="text-sm font-medium text-gray-900">Kanallar</h2>
             <button
               onClick={() => setShowChannelStats(!showChannelStats)}
               className="p-1 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
               title="Kanal İstatistikleri"
             >
               <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
               </svg>
             </button>
           </div>
                       <div className="flex items-center space-x-1">
              <button
                onClick={() => setShowArchiveModal(true)}
                className="p-1 text-gray-400 hover:text-red-600 rounded-lg hover:bg-gray-100"
                title="Toplu Arşivleme"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
              <button
                onClick={() => setShowCreateChannelModal(true)}
                className="p-1 text-gray-400 hover:text-green-600 rounded-lg hover:bg-gray-100"
                title="Yeni Kanal Oluştur"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
         </div>
        
        {/* Search Bar */}
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Kanal ara..."
            className="w-full pl-10 pr-12 py-2 text-sm border border-gray-300 rounded-lg bg-white text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
                     <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex items-center space-x-1">
             <button 
               onClick={startVoiceSearch}
               className={`p-1 ${isListening ? 'text-red-600 animate-pulse' : 'text-red-500 hover:text-red-600'}`}
               title={isListening ? 'Dinleniyor...' : 'Sesli Arama'}
             >
               <Mic className="w-4 h-4" />
             </button>
             <button 
               onClick={showHelp}
               className="p-1 text-gray-400 hover:text-gray-600" 
               title="Yardım"
             >
               <HelpCircle className="w-4 h-4" />
             </button>
             <button 
               onClick={() => setShowFilterMenu(!showFilterMenu)}
               className={`p-1 ${showFilterMenu ? 'text-blue-600' : 'text-gray-400 hover:text-gray-600'}`}
               title="Filtrele"
             >
               <Filter className="w-4 h-4" />
             </button>
           </div>
        </div>

        {/* Filter Menu */}
        {showFilterMenu && (
          <div className="mb-4 p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-gray-900">Filtreler</h3>
              <button
                onClick={clearAllFilters}
                className="text-xs text-blue-600 hover:text-blue-700"
              >
                Temizle
              </button>
            </div>
            
            <div className="space-y-2">
              {/* Temel Filtreler */}
              <div>
                <h4 className="text-xs font-medium text-gray-700 mb-1">Kanal Tipi</h4>
                <div className="space-y-1">
                  <button
                    onClick={() => setFilterType('all')}
                    className={`w-full text-left px-2 py-1 text-xs rounded ${
                      filterType === 'all' ? 'bg-blue-100 text-blue-700' : 'text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    Tüm Kanallar
                  </button>
                  <button
                    onClick={() => setFilterType('public')}
                    className={`w-full text-left px-2 py-1 text-xs rounded ${
                      filterType === 'public' ? 'bg-blue-100 text-blue-700' : 'text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    Genel Kanallar
                  </button>
                  <button
                    onClick={() => setFilterType('private')}
                    className={`w-full text-left px-2 py-1 text-xs rounded ${
                      filterType === 'private' ? 'bg-blue-100 text-blue-700' : 'text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    Özel Kanallar
                  </button>
                  <button
                    onClick={() => setFilterType('direct')}
                    className={`w-full text-left px-2 py-1 text-xs rounded ${
                      filterType === 'direct' ? 'bg-blue-100 text-blue-700' : 'text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    Direkt Mesajlar
                  </button>
                </div>
              </div>

              {/* Gelişmiş Filtreler */}
              <div>
                <button
                  onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                  className="w-full text-left px-2 py-1 text-xs text-blue-600 hover:text-blue-700 flex items-center justify-between"
                >
                  <span>Gelişmiş Filtreler</span>
                  <svg className={`w-3 h-3 transform transition-transform ${showAdvancedFilters ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                
                {showAdvancedFilters && (
                  <div className="mt-2 space-y-2 pl-2">
                    <label className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={advancedFilters.hasUnread}
                        onChange={(e) => setAdvancedFilters(prev => ({ ...prev, hasUnread: e.target.checked }))}
                        className="w-3 h-3"
                      />
                      <span className="text-xs text-gray-600">Sadece okunmamış</span>
                    </label>
                    <label className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={advancedFilters.isPinned}
                        onChange={(e) => setAdvancedFilters(prev => ({ ...prev, isPinned: e.target.checked }))}
                        className="w-3 h-3"
                      />
                      <span className="text-xs text-gray-600">Sadece sabitlenmiş</span>
                    </label>
                    <label className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={advancedFilters.hasRecentActivity}
                        onChange={(e) => setAdvancedFilters(prev => ({ ...prev, hasRecentActivity: e.target.checked }))}
                        className="w-3 h-3"
                      />
                      <span className="text-xs text-gray-600">Son aktivite var</span>
                    </label>
                    <div>
                      <label className="text-xs text-gray-600">Üye sayısı:</label>
                      <select
                        value={advancedFilters.memberCount}
                        onChange={(e) => setAdvancedFilters(prev => ({ ...prev, memberCount: e.target.value as any }))}
                        className="w-full mt-1 text-xs border border-gray-300 rounded px-2 py-1"
                      >
                        <option value="all">Tümü</option>
                        <option value="small">Küçük (≤5 üye)</option>
                        <option value="medium">Orta (6-20 üye)</option>
                        <option value="large">Büyük (&gt;20 üye)</option>
                      </select>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
                 )}

         {/* Kanal İstatistikleri */}
         {showChannelStats && (
           <div className="mb-4 p-3 bg-blue-50 rounded-lg">
             <h4 className="text-xs font-medium text-blue-900 mb-2">📊 Kanal İstatistikleri</h4>
             <div className="grid grid-cols-2 gap-2 text-xs">
               <div className="bg-white p-2 rounded">
                 <div className="text-blue-600 font-medium">{channels.length}</div>
                 <div className="text-gray-600">Toplam Kanal</div>
               </div>
               <div className="bg-white p-2 rounded">
                 <div className="text-green-600 font-medium">
                   {channels.filter(c => c.unreadCount && c.unreadCount > 0).length}
                 </div>
                 <div className="text-gray-600">Okunmamış</div>
               </div>
               <div className="bg-white p-2 rounded">
                 <div className="text-purple-600 font-medium">
                   {channels.filter(c => c.isPinned).length}
                 </div>
                 <div className="text-gray-600">Sabitlenmiş</div>
               </div>
               <div className="bg-white p-2 rounded">
                 <div className="text-orange-600 font-medium">
                   {channels.filter(c => c.isMuted).length}
                 </div>
                 <div className="text-gray-600">Sessize Alınmış</div>
               </div>
             </div>
           </div>
         )}

                   {/* Sıralama ve Arşiv Seçenekleri */}
          <div className="mb-4 space-y-2">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="w-full text-xs border border-gray-300 rounded px-2 py-1 bg-white"
            >
              <option value="activity">Son Aktiviteye Göre</option>
              <option value="name">İsme Göre</option>
              <option value="unread">Okunmamış Sayısına Göre</option>
            </select>
            
            <button
              onClick={() => setShowArchivedChannels(!showArchivedChannels)}
              className={`w-full text-xs px-2 py-1 rounded border transition-colors ${
                showArchivedChannels 
                  ? 'bg-gray-100 text-gray-700 border-gray-300' 
                  : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50'
              }`}
            >
              {showArchivedChannels ? 'Arşivlenmiş Kanalları Gizle' : 'Arşivlenmiş Kanalları Göster'}
            </button>
          </div>
       </div>

       {/* Channel List */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-2 space-y-1">
          {filteredChannels.length > 0 ? (
            filteredChannels.map((channel) => (
              <div key={channel.id} className="relative">
                <div className={`flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors group ${
                  selectedChannel?.id === channel.id
                    ? 'bg-purple-100'
                    : 'hover:bg-gray-100'
                }`}>
                  <button
                    onClick={() => onChannelSelect(channel)}
                    className={`flex-1 flex items-center space-x-3 text-left ${
                      selectedChannel?.id === channel.id
                        ? 'text-purple-700'
                        : 'text-gray-700'
                    }`}
                  >
                    <div className="flex-shrink-0">
                      {selectedChannel?.id === channel.id ? (
                        <Users className="w-4 h-4" />
                      ) : (
                        getChannelIcon(channel)
                      )}
                    </div>
                                         <div className="flex-1 min-w-0">
                                               <div className="flex items-center space-x-2">
                          <span className={`font-medium text-sm truncate ${channel.isArchived ? 'text-gray-400' : ''}`}>
                            #{channel.name}
                          </span>
                          {channel.isPinned && (
                            <Pin className="w-3 h-3 text-yellow-500 fill-yellow-500" />
                          )}
                          {channel.isArchived && (
                            <svg className="w-3 h-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
                            </svg>
                          )}
                          {channel.isMuted && (
                            <svg className="w-3 h-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                            </svg>
                          )}
                        </div>
                       {channel.lastMessage && (
                         <p className={`text-xs truncate ${channel.isArchived ? 'text-gray-400' : 'text-gray-500'}`}>
                           {channel.lastMessage}
                         </p>
                       )}
                     </div>
                    {channel.unreadCount && channel.unreadCount > 0 && (
                      <span className="flex-shrink-0 px-2 py-1 text-xs font-medium text-white bg-red-500 rounded-full">
                        {channel.unreadCount}
                      </span>
                    )}
                  </button>
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowChannelMenu(showChannelMenu === channel.id ? null : channel.id);
                    }}
                    className="flex-shrink-0 p-1 text-gray-400 hover:text-gray-600 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <MoreHorizontal className="w-4 h-4" />
                  </button>
                </div>

                                 {/* Channel Menu */}
                 {showChannelMenu === channel.id && (
                   <div className="absolute right-0 top-full mt-1 w-40 bg-white border border-gray-200 rounded-lg shadow-lg z-10">
                     <div className="py-1">
                                               {channel.unreadCount && channel.unreadCount > 0 && (
                          <button
                            onClick={() => handleChannelAction(channel.id, 'markAsRead')}
                            className="w-full text-left px-3 py-1 text-sm text-gray-700 hover:bg-green-50 hover:text-green-700 flex items-center transition-colors"
                          >
                            <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                            Okundu İşaretle
                          </button>
                        )}
                                                 <button
                           onClick={() => handleChannelAction(channel.id, 'pin')}
                           className={`w-full text-left px-3 py-1 text-sm flex items-center transition-colors ${
                             channel.isPinned 
                               ? 'text-yellow-700 hover:bg-yellow-50' 
                               : 'text-gray-700 hover:bg-gray-100'
                           }`}
                         >
                           <Pin className={`w-3 h-3 mr-2 ${channel.isPinned ? 'text-yellow-600 fill-yellow-600' : ''}`} />
                           {channel.isPinned ? 'Sabitlemeyi Kaldır' : 'Sabitle'}
                         </button>
                                               <button
                          onClick={() => handleChannelAction(channel.id, 'mute')}
                          className={`w-full text-left px-3 py-1 text-sm flex items-center transition-colors ${
                            channel.isMuted 
                              ? 'text-orange-700 hover:bg-orange-50' 
                              : 'text-gray-700 hover:bg-gray-100'
                          }`}
                        >
                          <svg className={`w-3 h-3 mr-2 ${channel.isMuted ? 'text-orange-600' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" />
                          </svg>
                          {channel.isMuted ? 'Sessizi Kaldır' : 'Sessize Al'}
                        </button>
                        <button
                          onClick={() => handleChannelAction(channel.id, 'archive')}
                          className={`w-full text-left px-3 py-1 text-sm flex items-center transition-colors ${
                            channel.isArchived 
                              ? 'text-purple-700 hover:bg-purple-50' 
                              : 'text-gray-700 hover:bg-gray-100'
                          }`}
                        >
                          <svg className={`w-3 h-3 mr-2 ${channel.isArchived ? 'text-purple-600' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
                          </svg>
                          {channel.isArchived ? 'Arşivden Çıkar' : 'Arşivle'}
                        </button>
                       <div className="border-t border-gray-200 my-1"></div>
                       {channel.type !== 'public' && (
                         <button
                           onClick={() => handleChannelAction(channel.id, 'leave')}
                           className="w-full text-left px-3 py-1 text-sm text-red-600 hover:bg-red-50 flex items-center"
                         >
                           <svg className="w-3 h-3 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                             <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                           </svg>
                           Kanaldan Ayrıl
                         </button>
                       )}
                     </div>
                   </div>
                 )}
              </div>
            ))
          ) : (
            <div className="text-center py-8 text-gray-500">
              <p className="text-sm">Kanal bulunamadı</p>
            </div>
          )}
        </div>
      </div>

             {/* Yardım Modal'ı */}
       {showHelpModal && (
         <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
           <div className="bg-white rounded-lg p-6 w-full max-w-md max-h-[80vh] overflow-y-auto">
             <div className="flex items-center justify-between mb-4">
               <h3 className="text-lg font-semibold text-gray-900">Yardım</h3>
               <button
                 onClick={() => setShowHelpModal(false)}
                 className="text-gray-400 hover:text-gray-600"
               >
                 <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                 </svg>
               </button>
             </div>

             <div className="space-y-4">
               <div>
                 <h4 className="font-medium text-gray-900 mb-2">🔍 Arama</h4>
                 <p className="text-sm text-gray-600 mb-2">
                   Kanal adlarında arama yapabilirsiniz. Türkçe karakterler desteklenir.
                 </p>
               </div>

               <div>
                 <h4 className="font-medium text-gray-900 mb-2">🎤 Sesli Arama</h4>
                 <p className="text-sm text-gray-600 mb-2">
                   Mikrofon butonuna tıklayarak sesli arama yapabilirsiniz. Türkçe konuşun.
                 </p>
                 <ul className="text-xs text-gray-500 space-y-1 ml-4">
                   <li>• "genel kanal" diyebilirsiniz</li>
                   <li>• "teknoloji" diyebilirsiniz</li>
                   <li>• "satış" diyebilirsiniz</li>
                 </ul>
               </div>

               <div>
                 <h4 className="font-medium text-gray-900 mb-2">🔧 Filtreleme</h4>
                 <p className="text-sm text-gray-600 mb-2">
                   Filtre butonu ile kanalları kategorilere göre filtreleyebilirsiniz.
                 </p>
                 <ul className="text-xs text-gray-500 space-y-1 ml-4">
                   <li>• <strong>Kanal Tipi:</strong> Genel, Özel, Direkt Mesaj</li>
                   <li>• <strong>Gelişmiş:</strong> Okunmamış, Sabitlenmiş, Üye sayısı</li>
                 </ul>
               </div>

               <div>
                 <h4 className="font-medium text-gray-900 mb-2">📌 Kanal İşlemleri</h4>
                 <p className="text-sm text-gray-600 mb-2">
                   Her kanalın yanındaki üç nokta butonuna tıklayarak:
                 </p>
                 <ul className="text-xs text-gray-500 space-y-1 ml-4">
                   <li>• Kanalları sabitleyebilirsiniz</li>
                   <li>• Sessize alabilirsiniz</li>
                   <li>• Kanaldan ayrılabilirsiniz</li>
                 </ul>
               </div>

               <div>
                 <h4 className="font-medium text-gray-900 mb-2">⌨️ Klavye Kısayolları</h4>
                 <ul className="text-xs text-gray-500 space-y-1 ml-4">
                   <li>• <kbd className="px-1 py-0.5 bg-gray-100 rounded text-xs">Ctrl + K</kbd> Arama odakla</li>
                   <li>• <kbd className="px-1 py-0.5 bg-gray-100 rounded text-xs">Ctrl + F</kbd> Filtreleme</li>
                   <li>• <kbd className="px-1 py-0.5 bg-gray-100 rounded text-xs">Ctrl + H</kbd> Yardım</li>
                 </ul>
               </div>

               <button
                 onClick={() => setShowHelpModal(false)}
                 className="w-full bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
               >
                 Anladım
               </button>
             </div>
           </div>
         </div>
       )}

       {/* Yeni Kanal Oluşturma Modal'ı */}
       {showCreateChannelModal && (
         <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
           <div className="bg-white rounded-lg p-6 w-full max-w-md">
             <div className="flex items-center justify-between mb-4">
               <h3 className="text-lg font-semibold text-gray-900">Yeni Kanal Oluştur</h3>
               <button
                 onClick={() => setShowCreateChannelModal(false)}
                 className="text-gray-400 hover:text-gray-600"
               >
                 <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                 </svg>
               </button>
             </div>

             <div className="space-y-4">
               <div>
                 <label className="block text-sm font-medium text-gray-700 mb-1">
                   Kanal Adı *
                 </label>
                 <input
                   type="text"
                   value={newChannelForm.name}
                   onChange={(e) => setNewChannelForm(prev => ({ ...prev, name: e.target.value }))}
                   placeholder="örn: genel, teknoloji, satış"
                   className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                 />
               </div>

               <div>
                 <label className="block text-sm font-medium text-gray-700 mb-1">
                   Açıklama
                 </label>
                 <textarea
                   value={newChannelForm.description}
                   onChange={(e) => setNewChannelForm(prev => ({ ...prev, description: e.target.value }))}
                   placeholder="Kanalın amacını açıklayın..."
                   rows={3}
                   className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                 />
               </div>

               <div>
                 <label className="block text-sm font-medium text-gray-700 mb-1">
                   Kanal Tipi
                 </label>
                 <select
                   value={newChannelForm.type}
                   onChange={(e) => setNewChannelForm(prev => ({ ...prev, type: e.target.value as any }))}
                   className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                 >
                   <option value="public">Genel Kanal</option>
                   <option value="private">Özel Kanal</option>
                   <option value="direct">Direkt Mesaj</option>
                 </select>
               </div>

               <div className="flex space-x-3 pt-4">
                 <button
                   onClick={() => setShowCreateChannelModal(false)}
                   className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
                 >
                   İptal
                 </button>
                 <button
                   onClick={handleCreateChannel}
                   className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                 >
                   Oluştur
                 </button>
               </div>
             </div>
           </div>
         </div>
       )}

       {/* Toplu Arşivleme Modal'ı */}
       {showArchiveModal && (
         <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
           <div className="bg-white rounded-lg p-6 w-full max-w-md">
             <div className="flex items-center justify-between mb-4">
               <h3 className="text-lg font-semibold text-gray-900">Toplu Arşivleme</h3>
               <button
                 onClick={() => setShowArchiveModal(false)}
                 className="text-gray-400 hover:text-gray-600"
               >
                 <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                 </svg>
               </button>
             </div>

             <div className="space-y-4">
               <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                 <div className="flex items-center">
                   <svg className="w-5 h-5 text-yellow-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                   </svg>
                   <span className="text-sm text-yellow-800 font-medium">Dikkat</span>
                 </div>
                 <p className="text-sm text-yellow-700 mt-2">
                   Arşivlenecek kanallar gizlenecek ancak silinmeyecektir. Arşivlenmiş kanalları görüntülemek için "Arşivlenmiş Kanalları Göster" butonunu kullanabilirsiniz.
                 </p>
               </div>

               <div className="bg-gray-50 rounded-lg p-4">
                 <h4 className="text-sm font-medium text-gray-900 mb-2">Arşivlenecek Kanallar:</h4>
                 <div className="space-y-1 max-h-32 overflow-y-auto">
                   {channels.filter(channel => !channel.isArchived && channel.type !== 'public').map(channel => (
                     <div key={channel.id} className="flex items-center text-sm text-gray-600">
                       <span className="w-2 h-2 bg-gray-400 rounded-full mr-2"></span>
                       #{channel.name}
                     </div>
                   ))}
                   {channels.filter(channel => !channel.isArchived && channel.type !== 'public').length === 0 && (
                     <p className="text-sm text-gray-500 italic">Arşivlenecek kanal bulunamadı</p>
                   )}
                 </div>
               </div>

               <div className="flex space-x-3 pt-4">
                 <button
                   onClick={() => setShowArchiveModal(false)}
                   className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
                 >
                   İptal
                 </button>
                 <button
                   onClick={handleBulkArchive}
                   className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                 >
                   Arşivle
                 </button>
               </div>
             </div>
           </div>
         </div>
       )}
    </div>
  );
};

export default ChannelList;
