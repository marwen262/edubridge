import React, { createContext, useContext, useState } from 'react';
import type { RegisterData } from '@/types/api';
import type { User, AuthContextType } from '@/types/auth';
import { authService } from '@/services/api';

export const AuthContext = createContext<AuthContextType | null>(null);

// Lecture sécurisée du profil stocké en localStorage
function lireUtilisateurStocke(): User | null {
  try {
    const stored = localStorage.getItem('auth_user');
    return stored ? (JSON.parse(stored) as User) : null;
  } catch {
    return null;
  }
}

// Fusion utilisateur + profil backend en objet User local
function construireUser(
  utilisateur: { id: string; email: string; role: string },
  profil?: { id?: string; prenom?: string; nom?: string }
): User {
  return {
    id: utilisateur.id,
    email: utilisateur.email,
    role: utilisateur.role as User['role'],
    prenom: profil?.prenom,
    nom: profil?.nom,
    candidat_id: utilisateur.role === 'candidat' ? profil?.id : undefined,
    institut_id: utilisateur.role === 'institut' ? profil?.id : undefined,
  };
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('auth_token'));
  const [user, setUser] = useState<User | null>(lireUtilisateurStocke);
  // loading toujours false — les pages gèrent leur propre état de chargement
  const [loading] = useState(false);

  // Persiste token + user dans localStorage et met à jour les states
  const persisterAuth = (newToken: string, newUser: User): void => {
    localStorage.setItem('auth_token', newToken);
    localStorage.setItem('auth_user', JSON.stringify(newUser));
    setToken(newToken);
    setUser(newUser);
  };

  const login = async (email: string, password: string): Promise<void> => {
    const { data } = await authService.login(email, password);
    const newUser = construireUser(data.utilisateur, data.profil);
    persisterAuth(data.token, newUser);
  };

  const register = async (data: RegisterData): Promise<void> => {
    const { data: responseData } = await authService.register(data);
    const newUser = construireUser(responseData.utilisateur, responseData.profil);
    persisterAuth(responseData.token, newUser);
  };

  const logout = (): void => {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('auth_user');
    setUser(null);
    setToken(null);
    window.location.href = '/login';
  };

  const updateUser = (updates: Partial<User>): void => {
    if (!user) return;
    const updatedUser = { ...user, ...updates };
    localStorage.setItem('auth_user', JSON.stringify(updatedUser));
    setUser(updatedUser);
  };

  const isAuthenticated = !!token && !!user;

  return (
    <AuthContext.Provider
      value={{ user, token, isAuthenticated, loading, login, register, logout, updateUser }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth doit être utilisé dans AuthProvider');
  }
  return context;
}
