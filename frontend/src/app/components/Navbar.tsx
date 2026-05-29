import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router';
import { Bell, LogOut } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Button } from './ui/button';
import { useAuth } from '@/context/AuthContext';
import { useNotifications } from '@/hooks/useNotifications';
import { notificationService } from '@/services/api';
import { NotificationDropdown } from './NotificationDropdown';
import logoEduBridge from '@/assets/logo/logoedubridge.png';

interface NavbarProps {
  transparent?: boolean;
}

export function Navbar({ transparent = false }: NavbarProps) {
  const { t, i18n } = useTranslation();
  const [notifOpen, setNotifOpen] = React.useState(false);
  const notifRef = React.useRef<HTMLDivElement>(null);

  const { isAuthenticated, user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Toujours appelé, mais affiché uniquement si authentifié
  const { notifications, unreadCount, refetch: refetchNotifications } = useNotifications();

  const dashboardPath =
    user?.role === 'candidat'
      ? '/dashboard/candidate'
      : user?.role === 'institut'
        ? '/dashboard/institution'
        : '/dashboard/admin';

  const notificationsPath =
    user?.role === 'candidat'
      ? '/dashboard/notifications'
      : user?.role === 'institut'
        ? '/dashboard/institution/notifications'
        : '/dashboard/admin/notifications';

  /**
   * Navigue vers l'ancre #id sur la page d'accueil.
   * Si l'utilisateur est déjà sur /, scroll directement.
   * Sinon, navigue d'abord vers / puis scroll après le rendu.
   */
  const handleScrollAnchor = (e: React.MouseEvent, anchor: string) => {
    e.preventDefault();
    const scrollToAnchor = () => {
      const el = document.getElementById(anchor);
      if (el) el.scrollIntoView({ behavior: 'smooth' });
    };
    if (location.pathname === '/') {
      scrollToAnchor();
    } else {
      navigate('/');
      // Attend le prochain tick pour que Home soit monté
      setTimeout(scrollToAnchor, 100);
    }
  };

  React.useEffect(() => {
    const isDark = localStorage.getItem('darkMode') === 'true';
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

  const handleMarkAsRead = async (id: string) => {
    try {
      await notificationService.markAsRead(id);
      refetchNotifications();
    } catch {
      // Silencieux — l'échec d'un markAsRead ne doit pas perturber l'UX
    }
  };

  const switchToLanguage = (lang: 'fr' | 'en') => {
    if (!i18n.language.startsWith(lang)) {
      i18n.changeLanguage(lang);
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
          <Link to="/" className="flex items-center">
            <img
              src={logoEduBridge}
              alt="EduBridge"
              className="h-14 md:h-[68px] w-auto dark:bg-white dark:rounded-lg dark:p-1.5"
            />
          </Link>

          {/* Navigation Links */}
          <div className="hidden md:flex items-center gap-8">
            <Link
              to="/"
              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
              className="text-[15px] text-[var(--edu-text-primary)] hover:text-[var(--edu-blue)] transition-colors"
            >
              {t('navbar.home')}
            </Link>
            <Link
              to="/search"
              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
              className="text-[15px] text-[var(--edu-text-primary)] hover:text-[var(--edu-blue)] transition-colors"
            >
              {t('navbar.programs')}
            </Link>
            <Link
              to="/institutions"
              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
              className="text-[15px] text-[var(--edu-text-primary)] hover:text-[var(--edu-blue)] transition-colors"
            >
              {t('navbar.institutions')}
            </Link>
            <Link
              to="/compare"
              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
              className="text-[15px] text-[var(--edu-text-primary)] hover:text-[var(--edu-blue)] transition-colors"
            >
              {t('navbar.compare')}
            </Link>
            <Link
              to="/guide"
              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
              className="text-[15px] text-[var(--edu-text-primary)] hover:text-[var(--edu-blue)] transition-colors"
            >
              {t('navbar.guide')}
            </Link>
            <a
              href="#how-it-works"
              onClick={(e) => handleScrollAnchor(e, 'how-it-works')}
              className="text-[15px] text-[var(--edu-text-primary)] hover:text-[var(--edu-blue)] transition-colors"
            >
              {t('navbar.howItWorks')}
            </a>
            <a
              href="#about"
              onClick={(e) => handleScrollAnchor(e, 'about')}
              className="text-[15px] text-[var(--edu-text-primary)] hover:text-[var(--edu-blue)] transition-colors"
            >
              {t('navbar.about')}
            </a>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-4">

            {/* Language Switcher */}
            <div className="flex items-center border border-[var(--edu-border)] rounded-full overflow-hidden text-xs font-semibold">
              {(['fr', 'en'] as const).map((lang) => {
                const isActive = i18n.language.startsWith(lang);
                return (
                  <button
                    key={lang}
                    onClick={() => switchToLanguage(lang)}
                    title={lang === 'fr' ? 'Passer en français' : 'Switch to English'}
                    className={`px-3 py-1.5 leading-none transition-colors ${
                      isActive
                        ? 'bg-[var(--edu-blue)] text-white'
                        : 'text-[var(--edu-text-secondary)] hover:text-[var(--edu-blue)]'
                    }`}
                  >
                    {lang.toUpperCase()}
                  </button>
                );
              })}
            </div>

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
                      notificationsHref={notificationsPath}
                    />
                  </div>
                )}
              </div>
            )}

            {isAuthenticated ? (
              <>
                <Link to={dashboardPath}>
                  <Button className="rounded-full bg-[var(--edu-blue)] hover:bg-[var(--edu-blue-hover)] text-white text-[15px] font-medium px-6">
                    {t('navbar.mySpace')}
                  </Button>
                </Link>
                <button
                  onClick={logout}
                  className="p-2 rounded-full hover:bg-[var(--edu-surface)] transition-colors text-[var(--edu-text-secondary)] hover:text-[var(--edu-danger)]"
                  aria-label={t('navbar.logout')}
                  title={t('navbar.logout')}
                >
                  <LogOut className="w-5 h-5" />
                </button>
              </>
            ) : (
              <>
                <Link to="/login">
                  <Button variant="ghost" className="text-[15px] font-medium text-[var(--edu-text-primary)]">
                    {t('navbar.login')}
                  </Button>
                </Link>

                <Link to="/signup">
                  <Button className="rounded-full bg-[var(--edu-blue)] hover:bg-[var(--edu-blue-hover)] text-white text-[15px] font-medium px-6">
                    {t('navbar.start')}
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
