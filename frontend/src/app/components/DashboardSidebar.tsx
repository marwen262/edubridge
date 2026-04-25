import React from 'react';
import { Link, useLocation } from 'react-router';
import { useAuth } from '@/context/AuthContext';
import {
  GraduationCap,
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
  Shield,
  LogOut,
} from 'lucide-react';

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
    { label: 'Home', icon: <Home className="w-5 h-5" />, href: '/dashboard/institution' },
    { label: 'Programs', icon: <FileText className="w-5 h-5" />, href: '/dashboard/institution/programs' },
    { label: 'Admission Requests', icon: <Users className="w-5 h-5" />, href: '/dashboard/institution/requests' },
    { label: 'Candidates', icon: <User className="w-5 h-5" />, href: '/dashboard/institution/candidates' },
    { label: 'Messages', icon: <MessageSquare className="w-5 h-5" />, href: '/dashboard/institution/messages' },
    { label: 'Reports', icon: <BarChart3 className="w-5 h-5" />, href: '/dashboard/institution/reports' },
    { label: 'Institution Profile', icon: <Building2 className="w-5 h-5" />, href: '/dashboard/institution/profile' },
    { label: 'Settings', icon: <Settings className="w-5 h-5" />, href: '/dashboard/institution/settings' },
  ];

  const adminNav: NavItem[] = [
    { label: 'Overview', icon: <Home className="w-5 h-5" />, href: '/dashboard/admin' },
    { label: 'Users', icon: <Users className="w-5 h-5" />, href: '/dashboard/admin/users' },
    { label: 'Institutions', icon: <Building2 className="w-5 h-5" />, href: '/dashboard/admin/institutions' },
    { label: 'Programs', icon: <FileText className="w-5 h-5" />, href: '/dashboard/admin/programs' },
    { label: 'All Applications', icon: <FileText className="w-5 h-5" />, href: '/dashboard/admin/applications' },
    { label: 'Decisions Relay', icon: <MessageSquare className="w-5 h-5" />, href: '/dashboard/admin/decisions' },
    { label: 'Analytics', icon: <BarChart3 className="w-5 h-5" />, href: '/dashboard/admin/analytics' },
    { label: 'System', icon: <Shield className="w-5 h-5" />, href: '/dashboard/admin/system' },
    { label: 'Settings', icon: <Settings className="w-5 h-5" />, href: '/dashboard/admin/settings' },
  ];

  const navItems = role === 'candidate' ? candidateNav : role === 'institution' ? institutionNav : adminNav;

  const accentColor = role === 'admin' ? 'var(--edu-indigo)' : 'var(--edu-blue)';

  return (
    <aside className="w-64 bg-white dark:bg-[#1D1D1F] border-r border-[var(--edu-border)] flex flex-col h-screen sticky top-0">
      {/* Logo */}
      <Link to="/" className="flex items-center gap-2 px-6 py-6 border-b border-[var(--edu-border)]">
        <GraduationCap className="w-8 h-8" style={{ color: accentColor }} />
        <span className="text-xl font-bold text-[var(--edu-text-primary)]">EduBridge</span>
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
          <span className="text-[15px]">Log out</span>
        </button>
      </div>
    </aside>
  );
}
