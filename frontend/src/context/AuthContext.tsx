import React, { createContext, useContext, useEffect, useState } from 'react';
import axios from 'axios';
import type { RegisterData } from '@/types/api';
import type { User, AuthContextType } from '@/types/auth';
import type { ValidationStatus } from '@/types/api';
import { authService } from '@/services/api';
import { API_URL } from '@/config';

export const AuthContext = createContext<AuthContextType | null>(null);

function lireUtilisateurStocke(): User | null {
  try {
    const stored = localStorage.getItem('auth_user');
    return stored ? (JSON.parse(stored) as User) : null;
  } catch {
    return null;
  }
}

function construireUser(
  utilisateur: {
    id: string;
    email: string;
    role: string;
    first_login_completed?: boolean;
  },
  profil?: {
    id?: string;
    prenom?: string;
    nom?: string | null;
    validation_status?: ValidationStatus;
  }
): User {
  return {
    id: utilisateur.id,
    email: utilisateur.email,
    role: utilisateur.role as User['role'],
    first_login_completed: utilisateur.first_login_completed ?? true,
    prenom: profil?.prenom,
    nom: profil?.nom ?? undefined,
    candidat_id: utilisateur.role === 'candidat' ? profil?.id : undefined,
    institut_id: utilisateur.role === 'institut' ? profil?.id : undefined,
    validation_status: utilisateur.role === 'institut' ? profil?.validation_status : undefined,
  };
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const persisterAuth = (newToken: string, newUser: User): void => {
    localStorage.setItem('auth_token', newToken);
    localStorage.setItem('auth_user', JSON.stringify(newUser));
    setToken(newToken);
    setUser(newUser);
  };

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

    // Affichage optimiste pendant la validation silencieuse
    setToken(storedToken);
    setUser(storedUser);
    setLoading(false);

    // Validation silencieuse + rafraîchissement du profil (validation_status, etc.)
    axios
      .get(`${API_URL}/auth/me`, {
        headers: { Authorization: `Bearer ${storedToken}` },
        timeout: 10000,
      })
      .then(({ data }) => {
        // Rafraîchir les données utilisateur depuis le backend (peut avoir changé)
        const u = data.utilisateur as {
          id: string; email: string; role: string;
          first_login_completed?: boolean;
          institut?: { id: string; nom: string | null; validation_status: ValidationStatus };
          candidat?: { id: string; prenom?: string; nom?: string };
        };
        const profil = u.role === 'institut' ? u.institut : u.candidat;
        const freshedUser = construireUser(u, profil ?? undefined);
        // Mettre à jour localStorage et state avec les données fraîches
        localStorage.setItem('auth_user', JSON.stringify(freshedUser));
        setUser(freshedUser);
      })
      .catch(() => {
        localStorage.removeItem('auth_token');
        localStorage.removeItem('auth_user');
        setToken(null);
        setUser(null);
      });
  }, []);

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
