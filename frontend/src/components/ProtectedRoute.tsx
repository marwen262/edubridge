import React from 'react';
import { Navigate } from 'react-router';
import { ShieldOff } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import type { User } from '@/types/auth';
import { Button } from '@/app/components/ui/button';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: User['role'];
}

export function ProtectedRoute({ children, requiredRole }: ProtectedRouteProps) {
  const { user, isAuthenticated, loading, logout } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 rounded-full border-t-2 border-[var(--edu-blue)] animate-spin" />
          <p className="text-[var(--edu-text-secondary)]">Chargement...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (requiredRole && user?.role !== requiredRole) {
    return <Navigate to="/" replace />;
  }

  // Blocage écran plein pour les instituts suspendus
  if (user?.role === 'institut' && user?.validation_status === 'suspended') {
    return (
      <div className="min-h-screen bg-[var(--edu-surface)] flex items-center justify-center p-6">
        <div className="w-full max-w-md text-center">
          <div className="glass-card rounded-3xl p-10 shadow-2xl">
            <div className="w-20 h-20 rounded-full bg-[var(--edu-danger)]/10 flex items-center justify-center mx-auto mb-6">
              <ShieldOff className="w-10 h-10 text-[var(--edu-danger)]" />
            </div>
            <h1 className="text-2xl font-bold text-[var(--edu-text-primary)] mb-3">
              Compte suspendu
            </h1>
            <p className="text-[var(--edu-text-secondary)] mb-6">
              Votre établissement a été suspendu par l'administration EduBridge
              et retiré du catalogue candidat.
            </p>
            <p className="text-sm text-[var(--edu-text-tertiary)] mb-8">
              Contactez l'équipe EduBridge pour obtenir des informations sur la procédure
              de réactivation de votre compte.
            </p>
            <Button
              onClick={logout}
              variant="outline"
              className="rounded-full"
            >
              Se déconnecter
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
