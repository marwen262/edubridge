import { useState } from 'react';
import { MessageCircle } from 'lucide-react';
import { ChatbotPanel } from './ChatbotPanel';

export default function ChatbotButton() {
  const [isOpen, setIsOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(1);

  const handleOpen = () => {
    setIsOpen(true);
    setUnreadCount(0);
  };

  const handleClose = () => {
    setIsOpen(false);
  };

  const handleNewAssistantMessage = () => {
    if (!isOpen) {
      setUnreadCount(prev => prev + 1);
    }
  };

  return (
    <>
      <ChatbotPanel
        isOpen={isOpen}
        onClose={handleClose}
        onNewAssistantMessage={handleNewAssistantMessage}
      />

      {!isOpen && (
        <div className="fixed bottom-6 right-6 z-50 group">
          {/* Tooltip */}
          <span
            className="absolute bottom-full mb-2 right-0 whitespace-nowrap
                       bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900
                       text-xs rounded-lg px-2.5 py-1.5 opacity-0 group-hover:opacity-100
                       transition-opacity pointer-events-none"
          >
            EduBridge Assistant
          </span>

          {/* FAB button */}
          <button
            onClick={handleOpen}
            aria-label="Ouvrir l'assistant EduBridge"
            className="relative w-14 h-14 rounded-full bg-blue-600 hover:bg-blue-700
                       shadow-lg hover:shadow-xl transition-all duration-200 active:scale-95
                       flex items-center justify-center"
          >
            <MessageCircle size={24} className="text-white" />

            {/* Badge numérique style WhatsApp */}
            {unreadCount > 0 && (
              <span
                className="absolute -top-1 -right-1 min-w-[20px] h-5 rounded-full
                           bg-red-500 border-2 border-white
                           flex items-center justify-center
                           text-[10px] font-bold text-white px-1"
              >
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>
        </div>
      )}
    </>
  );
}
