import React from 'react';
import { Link } from 'react-router';
import { Moon, Sun, GraduationCap, Bell } from 'lucide-react';
import { Button } from './ui/button';
import { useAuth } from '@/context/AuthContext';
import { useNotifications } from '@/hooks/useNotifications';
import { notificationService } from '@/services/api';
import { NotificationDropdown } from './NotificationDropdown';

interface NavbarProps {
  transparent?: boolean;
}

export function Navbar({ transparent = false }: NavbarProps) {
  const [darkMode, setDarkMode] = React.useState(false);
  const [notifOpen, setNotifOpen] = React.useState(false);
  const notifRef = React.useRef<HTMLDivElement>(null);

  const { isAuthenticated, user } = useAuth();

  // Toujours appelé, mais affiché uniquement si authentifié
  const { notifications, unreadCount, refetch: refetchNotifications } = useNotifications();

  const dashboardPath =
    user?.role === 'candidat'
      ? '/dashboard/candidate'
      : user?.role === 'institut'
        ? '/dashboard/institution'
        : '/dashboard/admin';

  React.useEffect(() => {
    const isDark = localStorage.getItem('darkMode') === 'true';
    setDarkMode(isDark);
    if (isDark) {
      document.documentElement.classList.add('dark');
    }
  }, []);

  // Fermer le dropdown au clic extérieur
  React.useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setNotifOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const toggleDarkMode = () => {
    const newMode = !darkMode;
    setDarkMode(newMode);
    localStorage.setItem('darkMode', String(newMode));
    if (newMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  const handleMarkAsRead = async (id: string) => {
    try {
      await notificationService.markAsRead(id);
      refetchNotifications();
    } catch {
      // Silencieux — l'échec d'un markAsRead ne doit pas perturber l'UX
    }
  };

  const baseClasses = transparent
    ? 'glass-card'
    : 'bg-white dark:bg-[#1D1D1F] border-b border-[var(--edu-border)]';

  return (
    <nav className={`sticky top-0 z-50 ${baseClasses}`}>
      <div className="max-w-[1440px] mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 text-[var(--edu-text-primary)]">
            <GraduationCap className="w-8 h-8 text-[var(--edu-blue)]" />
            <span className="text-xl font-semibold tracking-tight">EduBridge</span>
          </Link>

          {/* Navigation Links */}
          <div className="hidden md:flex items-center gap-8">
            <Link
              to="/search"
              className="text-[15px] text-[var(--edu-text-primary)] hover:text-[var(--edu-blue)] transition-colors"
            >
              Programs
            </Link>
            <Link
              to="/search"
              className="text-[15px] text-[var(--edu-text-primary)] hover:text-[var(--edu-blue)] transition-colors"
            >
              Institutions
            </Link>
            <a
              href="#how-it-works"
              className="text-[15px] text-[var(--edu-text-primary)] hover:text-[var(--edu-blue)] transition-colors"
            >
              How it works
            </a>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-4">
            <button
              onClick={toggleDarkMode}
              className="p-2 rounded-full hover:bg-[var(--edu-surface)] transition-colors"
              aria-label="Toggle dark mode"
            >
              {darkMode ? (
                <Sun className="w-5 h-5 text-[var(--edu-text-secondary)]" />
              ) : (
                <Moon className="w-5 h-5 text-[var(--edu-text-secondary)]" />
              )}
            </button>

            {/* Cloche notifications — uniquement si connecté */}
            {isAuthenticated && (
              <div className="relative" ref={notifRef}>
                <button
                  onClick={() => setNotifOpen((prev) => !prev)}
                  className="relative p-2 rounded-lg hover:bg-[var(--edu-surface)] transition-colors"
                  aria-label="Notifications"
                >
                  <Bell className="w-5 h-5 text-[var(--edu-text-primary)]" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-[var(--edu-danger)] text-white text-xs font-bold flex items-center justify-center">
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  )}
                </button>

                {/* Dropdown */}
                {notifOpen && (
                  <div className="absolute right-0 top-full mt-2 w-80 rounded-xl border border-[var(--edu-divider)] bg-white dark:bg-[#1D1D1F] shadow-lg z-50">
                    <NotificationDropdown
                      notifications={notifications.slice(0, 5)}
                      onMarkAsRead={handleMarkAsRead}
                      onClose={() => setNotifOpen(false)}
                    />
                  </div>
                )}
              </div>
            )}

            {isAuthenticated ? (
              <Link to={dashboardPath}>
                <Button className="rounded-full bg-[var(--edu-blue)] hover:bg-[var(--edu-blue-hover)] text-white text-[15px] font-medium px-6">
                  Mon espace
                </Button>
              </Link>
            ) : (
              <>
                <Link to="/login">
                  <Button variant="ghost" className="text-[15px] font-medium text-[var(--edu-text-primary)]">
                    Sign in
                  </Button>
                </Link>

                <Link to="/signup">
                  <Button className="rounded-full bg-[var(--edu-blue)] hover:bg-[var(--edu-blue-hover)] text-white text-[15px] font-medium px-6">
                    Get started
                  </Button>
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
