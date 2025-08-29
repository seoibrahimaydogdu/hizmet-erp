import React, { useState } from 'react';
import { 
  Link, 
  Unlink, 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  Plus, 
  X,
  Search,
  Filter
} from 'lucide-react';
import { useSupabase } from '../hooks/useSupabase';
import { toast } from 'react-hot-toast';

interface TicketDependenciesProps {
  ticketId: string;
  isOpen: boolean;
  onClose: () => void;
}

interface Dependency {
  id: string;
  sourceTicketId: string;
  targetTicketId: string;
  type: 'blocks' | 'depends_on' | 'duplicate' | 'related';
  created_at: string;
  sourceTicket?: any;
  targetTicket?: any;
}

const TicketDependencies: React.FC<TicketDependenciesProps> = ({ 
  ticketId, 
  isOpen, 
  onClose 
}) => {
  const { tickets, createDependency, deleteDependency } = useSupabase();
  
  const [selectedType, setSelectedType] = useState<'blocks' | 'depends_on' | 'duplicate' | 'related'>('blocks');
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);

  // Mevcut talep
  const currentTicket = tickets.find(t => t.id === ticketId);
  
  // Bağımlılık türleri
  const dependencyTypes = [
    { 
      value: 'blocks', 
      label: 'Bloklar', 
      description: 'Bu talep çözülmeden diğeri çözülemez',
      icon: AlertTriangle,
      color: 'text-red-600'
    },
    { 
      value: 'depends_on', 
      label: 'Bağımlı', 
              description: 'Bu talep başka bir isteğe bağımlı',
      icon: Clock,
      color: 'text-yellow-600'
    },
    { 
      value: 'duplicate', 
      label: 'Duplikat', 
      description: 'Aynı sorun farklı talepler',
      icon: Unlink,
      color: 'text-orange-600'
    },
    { 
      value: 'related', 
      label: 'İlgili', 
      description: 'Benzer konular veya bağlantılı sorunlar',
      icon: Link,
      color: 'text-blue-600'
    }
  ];

  // Filtrelenmiş talepler (mevcut talep hariç)
  const filteredTickets = tickets.filter(ticket => 
    ticket.id !== ticketId &&
    (ticket.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
     ticket.id.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  // Bağımlılık ekleme
  const handleAddDependency = async (targetTicketId: string) => {
    try {
      await createDependency({
        sourceTicketId: ticketId,
        targetTicketId,
        type: selectedType
      });
      toast.success('Bağımlılık başarıyla eklendi');
      setShowAddForm(false);
      setSearchTerm('');
    } catch (error) {
      toast.error('Bağımlılık eklenirken hata oluştu');
    }
  };

  // Bağımlılık silme
  const handleRemoveDependency = async (dependencyId: string) => {
    try {
      await deleteDependency(dependencyId);
      toast.success('Bağımlılık kaldırıldı');
    } catch (error) {
      toast.error('Bağımlılık kaldırılırken hata oluştu');
    }
  };

  if (!isOpen || !currentTicket) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
              <Link className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                Talep Bağımlılıkları
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                #{currentTicket.id.slice(0, 8)} - {currentTicket.title}
              </p>
            </div>
          </div>
          
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
          {/* Bağımlılık Türü Seçimi */}
          <div className="mb-6">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
              Bağımlılık Türü
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
              {dependencyTypes.map((type) => {
                const Icon = type.icon;
                return (
                  <button
                    key={type.value}
                    onClick={() => setSelectedType(type.value as any)}
                    className={`p-4 rounded-lg border-2 transition-colors text-left ${
                      selectedType === type.value
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                        : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Icon className={`w-5 h-5 ${type.color}`} />
                      <div>
                        <h4 className="font-medium text-gray-900 dark:text-white">
                          {type.label}
                        </h4>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {type.description}
                        </p>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Bağımlılık Ekleme */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                Bağımlılık Ekle
              </h3>
              <button
                onClick={() => setShowAddForm(!showAddForm)}
                className="inline-flex items-center px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium"
              >
                <Plus className="w-4 h-4 mr-2" />
                Yeni Bağımlılık
              </button>
            </div>

            {showAddForm && (
              <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Talep Ara
                  </label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="text"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      placeholder="Talep ID veya başlık ile ara..."
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                    />
                  </div>
                </div>

                {filteredTickets.length > 0 && (
                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {filteredTickets.map((ticket) => (
                      <div
                        key={ticket.id}
                        className="flex items-center justify-between p-3 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-600"
                      >
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-sm font-medium text-gray-900 dark:text-white">
                              #{ticket.id.slice(0, 8)}
                            </span>
                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                              ticket.status === 'open' ? 'bg-red-100 text-red-800' :
                              ticket.status === 'in_progress' ? 'bg-yellow-100 text-yellow-800' :
                              ticket.status === 'resolved' ? 'bg-green-100 text-green-800' :
                              'bg-gray-100 text-gray-800'
                            }`}>
                              {ticket.status === 'open' ? 'Açık' :
                               ticket.status === 'in_progress' ? 'İşlemde' :
                               ticket.status === 'resolved' ? 'Çözüldü' : 'Kapalı'}
                            </span>
                          </div>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            {ticket.title}
                          </p>
                        </div>
                        <button
                          onClick={() => handleAddDependency(ticket.id)}
                          className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm"
                        >
                          Ekle
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {filteredTickets.length === 0 && searchTerm && (
                  <div className="text-center py-4 text-gray-500 dark:text-gray-400">
                    <Search className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p>Talep bulunamadı</p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Mevcut Bağımlılıklar */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
              Mevcut Bağımlılıklar
            </h3>
            
            {/* Burada mevcut bağımlılıklar listelenecek */}
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              <Link className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p>Henüz bağımlılık bulunmuyor</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TicketDependencies;
