import { X } from 'lucide-react';
import type { Notification } from '@/types/api';

interface NotificationDropdownProps {
  notifications: Notification[];
  onMarkAsRead: (id: string) => void;
  onClose: () => void;
}

// Icône selon le type de notification
function getTypeIcon(type: Notification['type']): string {
  switch (type) {
    case 'statut_candidature': return '📋';
    case 'nouveau_programme':  return '🎓';
    case 'document_manquant':  return '📎';
    case 'rappel_echeance':    return '⏰';
    case 'systeme':            return 'ℹ️';
    default:                   return '🔔';
  }
}

export function NotificationDropdown({
  notifications,
  onMarkAsRead,
  onClose,
}: NotificationDropdownProps) {
  return (
    <div>
      {/* En-tête */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--edu-divider)]">
        <h3 className="font-semibold text-[var(--edu-text-primary)]">Notifications</h3>
        <button
          onClick={onClose}
          className="p-1 rounded-full hover:bg-[var(--edu-surface)] transition-colors"
          aria-label="Fermer"
        >
          <X className="w-4 h-4 text-[var(--edu-text-secondary)]" />
        </button>
      </div>

      {/* Liste */}
      {notifications.length === 0 ? (
        <div className="px-4 py-8 text-center text-[var(--edu-text-secondary)] text-sm">
          Aucune notification
        </div>
      ) : (
        <div className="divide-y divide-[var(--edu-divider)] max-h-[360px] overflow-y-auto">
          {notifications.map((notif) => (
            <div
              key={notif.id}
              className={`px-4 py-3 transition-colors cursor-pointer flex items-start gap-3 ${
                !notif.est_lue
                  ? 'bg-blue-50 dark:bg-blue-950/20 hover:bg-blue-100/80 dark:hover:bg-blue-900/30'
                  : 'hover:bg-[var(--edu-surface)]'
              }`}
              onClick={() => !notif.est_lue && onMarkAsRead(notif.id)}
            >
              {/* Point non lu */}
              {!notif.est_lue ? (
                <div className="w-2 h-2 rounded-full bg-[var(--edu-blue)] mt-1.5 flex-shrink-0" />
              ) : (
                <div className="w-2 h-2 mt-1.5 flex-shrink-0" />
              )}

              <div className="flex-1 min-w-0">
                <div className="flex items-start gap-2">
                  <span className="text-base flex-shrink-0">{getTypeIcon(notif.type)}</span>
                  <div className="flex-1 min-w-0">
                    {notif.titre && (
                      <p className="text-sm font-medium text-[var(--edu-text-primary)] line-clamp-1">
                        {notif.titre}
                      </p>
                    )}
                    {notif.contenu && (
                      <p className="text-xs text-[var(--edu-text-secondary)] mt-0.5 line-clamp-2">
                        {notif.contenu}
                      </p>
                    )}
                    {notif.cree_le && (
                      <p className="text-xs text-[var(--edu-text-tertiary)] mt-1">
                        {new Date(notif.cree_le).toLocaleDateString('fr-FR', {
                          day: 'numeric',
                          month: 'short',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pied */}
      <div className="px-4 py-3 border-t border-[var(--edu-divider)]">
        <button
          onClick={onClose}
          className="text-sm text-[var(--edu-blue)] hover:underline w-full text-center"
        >
          Voir toutes les notifications
        </button>
      </div>
    </div>
  );
}
