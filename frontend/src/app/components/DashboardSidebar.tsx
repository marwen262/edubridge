import React from 'react';
import { Link, useLocation } from 'react-router';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/context/AuthContext';
import { useNotifications } from '@/hooks/useNotifications';
import { cn } from '@/app/components/ui/utils';
import { demandeAccesService, institutService } from '@/services/api';
import type { Institut } from '@/types/api';
import {
  LayoutDashboard,
  FileText,
  BookOpen,
  Heart,
  FolderOpen,
  Settings,
  Bell,
  PieChart,
  Sliders,
  Building2,
  Users,
  BarChart3,
  User,
  LogOut,
} from 'lucide-react';
import logoedubridge from '@/assets/logo/logoedubridge.png';

interface NavItem {
  label: string;
  icon: React.ReactNode;
  href: string;
  disabled?: boolean;
  badge?: number;
}

interface NavGroup {
  label?: string;
  items: NavItem[];
}

interface DashboardSidebarProps {
  role: 'candidate' | 'institution' | 'admin';
  user: {
    name: string;
    avatar?: string;
    role?: string;
  };
}

export function DashboardSidebar({ role, user }: DashboardSidebarProps) {
  const { t } = useTranslation();
  const location = useLocation();
  const { logout, user: authUser } = useAuth();
  const { unreadCount } = useNotifications();
  const [nbDemandes, setNbDemandes] = React.useState(0);
  const [nbInstitutsEnAttente, setNbInstitutsEnAttente] = React.useState(0);

  React.useEffect(() => {
    if (authUser?.role !== 'admin') return;
    demandeAccesService
      .listerToutes({ statut: 'en_attente', limit: 1 })
      .then((r) => {
        const payload = r.data as { pagination?: { total: number } };
        setNbDemandes(payload.pagination?.total ?? 0);
      })
      .catch(() => {});
    institutService
      .listerEnAttente()
      .then((r) => {
        const payload = r.data as { instituts?: Institut[] };
        const enAttente = (payload.instituts ?? []).filter(
          (i) => i.validation_status === 'pending_admin_review'
        );
        setNbInstitutsEnAttente(enAttente.length);
      })
      .catch(() => {});
  }, [authUser]);

  const candidateGroups: NavGroup[] = [
    {
      label: 'PRINCIPAL',
      items: [
        {
          label: t('sidebar.candidate.dashboard'),
          icon: <LayoutDashboard className="w-5 h-5" />,
          href: '/dashboard/candidate',
          badge: unreadCount,
        },
        {
          label: t('sidebar.candidate.applications'),
          icon: <FileText className="w-5 h-5" />,
          href: '/dashboard/candidatures',
        },
        {
          label: t('sidebar.candidate.programs'),
          icon: <BookOpen className="w-5 h-5" />,
          href: '/search',
        },
      ],
    },
    {
      label: 'DOSSIER',
      items: [
        {
          label: t('sidebar.candidate.favorites'),
          icon: <Heart className="w-5 h-5" />,
          href: '/dashboard/favoris',
        },
        {
          label: t('sidebar.candidate.documents'),
          icon: <FolderOpen className="w-5 h-5" />,
          href: '/dashboard/documents',
        },
      ],
    },
    {
      label: 'COMPTE',
      items: [
        {
          label: t('sidebar.candidate.settings'),
          icon: <Settings className="w-5 h-5" />,
          href: '/dashboard/parametres',
        },
      ],
    },
  ];

  const institutionGroups: NavGroup[] = [
    {
      items: [
        { label: t('sidebar.institution.dashboard'), icon: <LayoutDashboard className="w-5 h-5" />, href: '/dashboard/institution' },
        { label: t('sidebar.institution.programs'), icon: <FileText className="w-5 h-5" />, href: '/dashboard/institution/programmes' },
        { label: t('sidebar.institution.applications'), icon: <BarChart3 className="w-5 h-5" />, href: '/dashboard/institution/candidatures' },
        { label: t('sidebar.institution.candidates'), icon: <User className="w-5 h-5" />, href: '/dashboard/institution/candidats' },
        { label: t('sidebar.institution.notifications'), icon: <Bell className="w-5 h-5" />, href: '/dashboard/institution/notifications' },
        { label: t('sidebar.institution.reports'), icon: <PieChart className="w-5 h-5" />, href: '/dashboard/institution/rapports' },
        { label: t('sidebar.institution.profile'), icon: <Building2 className="w-5 h-5" />, href: '/dashboard/institution/profil' },
        { label: t('sidebar.institution.settings'), icon: <Settings className="w-5 h-5" />, href: '/dashboard/institution/parametres' },
      ],
    },
  ];

  const adminGroups: NavGroup[] = [
    {
      items: [
        { label: t('sidebar.admin.dashboard'), icon: <LayoutDashboard className="w-5 h-5" />, href: '/dashboard/admin' },
        { label: t('sidebar.admin.users'), icon: <Users className="w-5 h-5" />, href: '/dashboard/admin/utilisateurs' },
        {
          label: t('sidebar.admin.institutions'),
          icon: <Building2 className="w-5 h-5" />,
          href: '/dashboard/admin/instituts',
          badge: nbInstitutsEnAttente > 0 ? nbInstitutsEnAttente : undefined,
        },
        { label: t('sidebar.admin.programs'), icon: <FileText className="w-5 h-5" />, href: '/dashboard/admin/programmes' },
        { label: t('sidebar.admin.applications'), icon: <BarChart3 className="w-5 h-5" />, href: '/dashboard/admin/candidatures' },
        { label: t('sidebar.admin.notifications'), icon: <Bell className="w-5 h-5" />, href: '/dashboard/admin/notifications' },
        {
          label: "Demandes d'accès",
          icon: <Building2 className="w-5 h-5" />,
          href: '/dashboard/admin/demandes',
          badge: nbDemandes > 0 ? nbDemandes : undefined,
        },
        { label: t('sidebar.admin.reports'), icon: <PieChart className="w-5 h-5" />, href: '/dashboard/admin/rapports' },
        { label: t('sidebar.admin.systemSettings'), icon: <Sliders className="w-5 h-5" />, href: '/dashboard/admin/parametres' },
      ],
    },
  ];

  const groups =
    role === 'candidate'
      ? candidateGroups
      : role === 'institution'
      ? institutionGroups
      : adminGroups;

  const accentColor = role === 'candidate' ? 'var(--edu-blue)' : 'var(--edu-indigo)';

  const roleLabels: Record<typeof role, string> = {
    candidate: t('sidebar.roles.candidate'),
    institution: t('sidebar.roles.institution'),
    admin: t('sidebar.roles.admin'),
  };

  return (
    <aside className="w-64 bg-white dark:bg-[#1D1D1F] border-r border-[var(--edu-border)] flex flex-col h-screen sticky top-0">
      {/* Logo */}
      <Link
        to="/"
        className="flex justify-center items-center px-4 py-5 border-b border-[var(--edu-border)]"
      >
        <img
          src={logoedubridge}
          alt="EduBridge"
          className="h-[72px] w-auto dark:bg-white dark:rounded-xl dark:p-2"
        />
      </Link>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 py-4">
        <div className="space-y-5">
          {groups.map((group, gi) => (
            <div key={gi}>
              {group.label && (
                <p className="px-3 mb-1.5 text-[10px] font-semibold tracking-widest text-[var(--edu-text-tertiary)] uppercase select-none">
                  {group.label}
                </p>
              )}
              <ul className="space-y-0.5">
                {group.items.map((item) => {
                  const isActive = location.pathname === item.href;

                  if (item.disabled) {
                    return (
                      <li key={item.label}>
                        <span className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-[var(--edu-text-tertiary)] opacity-50 cursor-not-allowed select-none">
                          {item.icon}
                          <span className="text-[15px] flex-1">{item.label}</span>
                          <span className="text-[10px] bg-[var(--edu-surface)] text-[var(--edu-text-tertiary)] px-1.5 py-0.5 rounded font-medium whitespace-nowrap">
                            {t('common.soon')}
                          </span>
                        </span>
                      </li>
                    );
                  }

                  return (
                    <li key={item.href}>
                      <Link
                        to={item.href}
                        className={cn(
                          'flex items-center gap-3 px-3 py-2.5 rounded-xl transition-colors',
                          isActive
                            ? 'text-white font-medium'
                            : 'text-[var(--edu-text-secondary)] hover:bg-[var(--edu-surface)] hover:text-[var(--edu-text-primary)]'
                        )}
                        style={isActive ? { backgroundColor: accentColor } : {}}
                      >
                        {item.icon}
                        <span className="text-[15px] flex-1">{item.label}</span>
                        {item.badge !== undefined && item.badge > 0 && (
                          <span
                            className="inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full text-[11px] font-bold text-white leading-none"
                            style={{ backgroundColor: 'var(--edu-danger)' }}
                          >
                            {item.badge > 99 ? '99+' : item.badge}
                          </span>
                        )}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </div>
      </nav>

      {/* User + Logout */}
      <div className="px-4 py-4 border-t border-[var(--edu-border)] space-y-2">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[var(--edu-blue)] to-[var(--edu-indigo)] flex items-center justify-center text-white font-semibold text-sm flex-shrink-0 overflow-hidden">
            {user.avatar ? (
              <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
            ) : (
              user.name.charAt(0).toUpperCase()
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-[var(--edu-text-primary)] truncate">
              {user.name}
            </p>
            <span
              className="inline-block text-[11px] font-medium px-1.5 py-0.5 rounded mt-0.5"
              style={{ backgroundColor: `${accentColor}18`, color: accentColor }}
            >
              {roleLabels[role]}
            </span>
          </div>
        </div>
        <button
          onClick={logout}
          className="flex items-center gap-2.5 w-full px-3 py-2 rounded-xl text-[var(--edu-text-secondary)] hover:bg-[var(--edu-surface)] hover:text-[var(--edu-danger)] transition-colors text-sm"
        >
          <LogOut className="w-4 h-4" />
          <span>{t('sidebar.logout')}</span>
        </button>
      </div>
    </aside>
  );
}
