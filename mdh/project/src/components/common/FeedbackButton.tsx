import React, { useState } from 'react';
import { MessageSquare } from 'lucide-react';
import FeedbackModal from './FeedbackModal';

interface FeedbackButtonProps {
  pageSource?: string;
  showOnPages?: string[]; // Hangi sayfalarda gösterileceği
  excludeFromPages?: string[]; // Hangi sayfalarda gizleneceği
  position?: 'fixed' | 'inline'; // Sabit mi yoksa sayfa içinde mi
  className?: string; // Ek CSS sınıfları
}

const FeedbackButton: React.FC<FeedbackButtonProps> = ({ 
  pageSource, 
  showOnPages = [], 
  excludeFromPages = ['dashboard', 'tickets'],
  position = 'fixed',
  className = ''
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const openModal = () => setIsModalOpen(true);
  const closeModal = () => setIsModalOpen(false);

  // Eğer sayfa exclude listesindeyse veya showOnPages belirtilmişse ve bu sayfa listede yoksa gizle
  if (excludeFromPages.includes(pageSource || '') || 
      (showOnPages.length > 0 && !showOnPages.includes(pageSource || ''))) {
    return null;
  }

  return (
    <>
      <button
        onClick={openModal}
        className={`${position === 'fixed' ? 'fixed top-4 right-4 z-40' : 'inline-flex'} items-center gap-2 px-2 py-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors duration-200`}
        title="Geri Bildirim Gönder"
      >
        <MessageSquare size={16} />
        <span>Geri Bildirim Gönder</span>
      </button>

      <FeedbackModal
        isOpen={isModalOpen}
        onClose={closeModal}
        pageSource={pageSource}
      />
    </>
  );
};

export default FeedbackButton;
