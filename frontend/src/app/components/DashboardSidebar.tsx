import React from 'react';
import { Link, useLocation } from 'react-router';
import { useAuth } from '@/context/AuthContext';
import {
  Home,
  Search,
  FileText,
  Heart,
  Upload,
  MessageSquare,
  User,
  Settings,
  Building2,
  Users,
  BarChart3,
  LayoutDashboard,
  Bell,
  Activity,
  PieChart,
  Sliders,
  LogOut,
} from 'lucide-react';
import logoedubridge from '@/assets/logo/logoedubridge.png';

interface NavItem {
  label: string;
  icon: React.ReactNode;
  href: string;
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
  const location = useLocation();
  const { logout } = useAuth();

  const candidateNav: NavItem[] = [
    { label: 'Home', icon: <Home className="w-5 h-5" />, href: '/dashboard/candidate' },
    { label: 'Explore Programs', icon: <Search className="w-5 h-5" />, href: '/search' },
    { label: 'My Applications', icon: <FileText className="w-5 h-5" />, href: '/dashboard/candidate/applications' },
    { label: 'Saved Programs', icon: <Heart className="w-5 h-5" />, href: '/dashboard/candidate/saved' },
    { label: 'Documents', icon: <Upload className="w-5 h-5" />, href: '/dashboard/candidate/documents' },
    { label: 'Messages', icon: <MessageSquare className="w-5 h-5" />, href: '/dashboard/candidate/messages' },
    { label: 'Profile', icon: <User className="w-5 h-5" />, href: '/dashboard/candidate/profile' },
    { label: 'Settings', icon: <Settings className="w-5 h-5" />, href: '/dashboard/candidate/settings' },
  ];

  const institutionNav: NavItem[] = [
    { label: 'Tableau de bord', icon: <LayoutDashboard className="w-5 h-5" />, href: '/dashboard/institution' },
    { label: 'Programmes', icon: <FileText className="w-5 h-5" />, href: '/dashboard/institution/programmes' },
    { label: 'Candidatures', icon: <BarChart3 className="w-5 h-5" />, href: '/dashboard/institution/candidatures' },
    { label: 'Candidats', icon: <User className="w-5 h-5" />, href: '/dashboard/institution/candidats' },
    { label: 'Notifications', icon: <Bell className="w-5 h-5" />, href: '/dashboard/institution/notifications' },
    { label: 'Rapports', icon: <PieChart className="w-5 h-5" />, href: '/dashboard/institution/rapports' },
    { label: 'Profil établissement', icon: <Building2 className="w-5 h-5" />, href: '/dashboard/institution/profil' },
    { label: 'Paramètres', icon: <Settings className="w-5 h-5" />, href: '/dashboard/institution/parametres' },
  ];

  const adminNav: NavItem[] = [
    { label: 'Tableau de bord', icon: <LayoutDashboard className="w-5 h-5" />, href: '/dashboard/admin' },
    { label: 'Utilisateurs', icon: <Users className="w-5 h-5" />, href: '/dashboard/admin/utilisateurs' },
    { label: 'Instituts', icon: <Building2 className="w-5 h-5" />, href: '/dashboard/admin/instituts' },
    { label: 'Programmes', icon: <FileText className="w-5 h-5" />, href: '/dashboard/admin/programmes' },
    { label: 'Candidatures', icon: <BarChart3 className="w-5 h-5" />, href: '/dashboard/admin/candidatures' },
    { label: 'Notifications', icon: <Bell className="w-5 h-5" />, href: '/dashboard/admin/notifications' },
    { label: 'Rapports', icon: <PieChart className="w-5 h-5" />, href: '/dashboard/admin/rapports' },
    { label: "Journal d'activité", icon: <Activity className="w-5 h-5" />, href: '/dashboard/admin/journal' },
    { label: 'Paramètres système', icon: <Sliders className="w-5 h-5" />, href: '/dashboard/admin/parametres' },
  ];

  const navItems = role === 'candidate' ? candidateNav : role === 'institution' ? institutionNav : adminNav;

  const accentColor = role === 'candidate' ? 'var(--edu-blue)' : 'var(--edu-indigo)';

  return (
    <aside className="w-64 bg-white dark:bg-[#1D1D1F] border-r border-[var(--edu-border)] flex flex-col h-screen sticky top-0">
      {/* Logo */}
      <Link to="/" className="flex justify-center items-center px-4 py-5 border-b border-[var(--edu-border)]">
        <img
          src={logoedubridge}
          alt="EduBridge"
          className="h-[72px] w-auto dark:bg-white dark:rounded-xl dark:p-2"
        />
      </Link>

      {/* User */}
      <div className="px-6 py-6 border-b border-[var(--edu-border)]">
        <div className="flex items-center gap-3">
          <div
            className="w-12 h-12 rounded-full bg-gradient-to-br from-[var(--edu-blue)] to-[var(--edu-indigo)] flex items-center justify-center text-white font-semibold text-lg"
          >
            {user.avatar ? (
              <img src={user.avatar} alt={user.name} className="w-full h-full rounded-full object-cover" />
            ) : (
              user.name.charAt(0).toUpperCase()
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-[var(--edu-text-primary)] truncate">{user.name}</p>
            {user.role && <p className="text-xs text-[var(--edu-text-secondary)] truncate">{user.role}</p>}
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 py-4">
        <ul className="space-y-1">
          {navItems.map((item) => {
            const isActive = location.pathname === item.href;
            return (
              <li key={item.href}>
                <Link
                  to={item.href}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-colors ${
                    isActive
                      ? 'text-white font-medium'
                      : 'text-[var(--edu-text-secondary)] hover:bg-[var(--edu-surface)] hover:text-[var(--edu-text-primary)]'
                  }`}
                  style={isActive ? { backgroundColor: accentColor } : {}}
                >
                  {item.icon}
                  <span className="text-[15px]">{item.label}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Logout */}
      <div className="px-3 py-4 border-t border-[var(--edu-border)]">
        <button
          onClick={logout}
          className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-[var(--edu-text-secondary)] hover:bg-[var(--edu-surface)] hover:text-[var(--edu-danger)] transition-colors w-full text-left"
        >
          <LogOut className="w-5 h-5" />
          <span className="text-[15px]">Déconnexion</span>
        </button>
      </div>
    </aside>
  );
}
