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

interface ChannelListProps {
  channels: Channel[];
  selectedChannel: Channel | null;
  onChannelSelect: (channel: Channel) => void;
  onCreateChannel: () => void;
  searchTerm: string;
  onSearchChange: (term: string) => void;
  showChannelList: boolean;
}

const ChannelList: React.FC<ChannelListProps> = ({
  channels,
  selectedChannel,
  onChannelSelect,
  onCreateChannel,
  searchTerm,
  onSearchChange,
  showChannelList
}) => {
  const [showChannelMenu, setShowChannelMenu] = useState<string | null>(null);
  const [showFilterMenu, setShowFilterMenu] = useState(false);
  const [filterType, setFilterType] = useState<'all' | 'public' | 'private' | 'direct'>('all');

  const filteredChannels = channels.filter(channel => {
    const matchesSearch = channel.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterType === 'all' || channel.type === filterType;
    return matchesSearch && matchesFilter;
  });

  const getChannelIcon = (channel: Channel) => {
    if (channel.type === 'private') return <Lock className="w-4 h-4" />;
    if (channel.type === 'direct') return <Users className="w-4 h-4" />;
    return <Hash className="w-4 h-4" />;
  };

  const handleChannelAction = (channelId: string, action: string) => {
    switch (action) {
      case 'pin':
        // Pin channel logic
        break;
      case 'mute':
        // Mute channel logic
        break;
      case 'leave':
        // Leave channel logic
        break;
    }
    setShowChannelMenu(null);
  };

  const startVoiceSearch = () => {
    // Voice search functionality
    if ('webkitSpeechRecognition' in window) {
      const recognition = new (window as any).webkitSpeechRecognition();
      recognition.lang = 'tr-TR';
      recognition.continuous = false;
      recognition.interimResults = false;
      
      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        onSearchChange(transcript);
      };
      
      recognition.start();
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
          <h2 className="text-sm font-medium text-gray-900">Kanallar</h2>
          <button
            onClick={onCreateChannel}
            className="p-1 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
            title="Yeni Kanal Oluştur"
          >
            <Plus className="w-4 h-4" />
          </button>
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
              className="p-1 text-red-500 hover:text-red-600"
              title="Sesli Arama"
            >
              <Mic className="w-4 h-4" />
            </button>
            <button 
              onClick={() => setShowFilterMenu(!showFilterMenu)}
              className="p-1 text-gray-400 hover:text-gray-600"
              title="Filtrele"
            >
              <Filter className="w-4 h-4" />
            </button>
            <button className="p-1 text-gray-400 hover:text-gray-600" title="Yardım">
              <HelpCircle className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Filter Menu */}
        {showFilterMenu && (
          <div className="mb-4 p-2 bg-gray-50 rounded-lg">
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
        )}
      </div>

      {/* Channel List */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-2 space-y-1">
          {filteredChannels.length > 0 ? (
            filteredChannels.map((channel) => (
              <div key={channel.id} className="relative">
                <button
                  onClick={() => onChannelSelect(channel)}
                  className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-left transition-colors group ${
                    selectedChannel?.id === channel.id
                      ? 'bg-purple-100 text-purple-700'
                      : 'text-gray-700 hover:bg-gray-100'
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
                      <span className="font-medium text-sm truncate">#{channel.name}</span>
                      {channel.isPinned && <Pin className="w-3 h-3 text-gray-400" />}
                    </div>
                    {channel.lastMessage && (
                      <p className="text-xs text-gray-500 truncate">
                        {channel.lastMessage}
                      </p>
                    )}
                  </div>
                  {channel.unreadCount && channel.unreadCount > 0 && (
                    <span className="flex-shrink-0 px-2 py-1 text-xs font-medium text-white bg-red-500 rounded-full">
                      {channel.unreadCount}
                    </span>
                  )}
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowChannelMenu(showChannelMenu === channel.id ? null : channel.id);
                    }}
                    className="flex-shrink-0 p-1 text-gray-400 hover:text-gray-600 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <MoreHorizontal className="w-4 h-4" />
                  </button>
                </button>

                {/* Channel Menu */}
                {showChannelMenu === channel.id && (
                  <div className="absolute right-0 top-full mt-1 w-32 bg-white border border-gray-200 rounded-lg shadow-lg z-10">
                    <div className="py-1">
                      <button
                        onClick={() => handleChannelAction(channel.id, 'pin')}
                        className="w-full text-left px-3 py-1 text-sm text-gray-700 hover:bg-gray-100"
                      >
                        {channel.isPinned ? 'Sabitlemeyi Kaldır' : 'Sabitle'}
                      </button>
                      <button
                        onClick={() => handleChannelAction(channel.id, 'mute')}
                        className="w-full text-left px-3 py-1 text-sm text-gray-700 hover:bg-gray-100"
                      >
                        Sessize Al
                      </button>
                      {channel.type !== 'public' && (
                        <button
                          onClick={() => handleChannelAction(channel.id, 'leave')}
                          className="w-full text-left px-3 py-1 text-sm text-red-600 hover:bg-red-50"
                        >
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
    </div>
  );
};

export default ChannelList;
