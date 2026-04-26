import React, { createContext, useContext, useEffect, useState } from 'react';
import axios from 'axios';
import type { RegisterData } from '@/types/api';
import type { User, AuthContextType } from '@/types/auth';
import { authService } from '@/services/api';
import { API_URL } from '@/config';

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
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  // loading=true au montage : empêche ProtectedRoute de rediriger vers /login
  // avant que la lecture du localStorage soit terminée.
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let storedToken: string | null = null;
    let storedUser: User | null = null;
    try {
      storedToken = localStorage.getItem('auth_token');
      storedUser = lireUtilisateurStocke();
    } catch {
      localStorage.removeItem('auth_token');
      localStorage.removeItem('auth_user');
    }

    if (!storedToken || !storedUser) {
      setLoading(false);
      return;
    }

    // Affichage optimiste : on rend l'UI authentifiée pendant la validation.
    setToken(storedToken);
    setUser(storedUser);
    setLoading(false);

    // Validation silencieuse du token contre le backend.
    // → axios direct (pas l'instance `api`) pour bypasser l'intercepteur 401
    //   qui redirigerait vers /login : sur une page publique on veut juste
    //   purger l'état auth obsolète, pas expulser l'utilisateur.
    axios
      .get(`${API_URL}/auth/me`, {
        headers: { Authorization: `Bearer ${storedToken}` },
        timeout: 10000,
      })
      .catch(() => {
        // Token expiré, révoqué, ou backend reset (ex: db:reset) → purge.
        localStorage.removeItem('auth_token');
        localStorage.removeItem('auth_user');
        setToken(null);
        setUser(null);
      });
  }, []);

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
