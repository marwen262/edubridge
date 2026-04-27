import type { RegisterData } from '@/types/api';

export interface User {
  id: string;
  email: string;
  role: 'candidat' | 'institut' | 'admin';
  prenom?: string;
  nom?: string;
  candidat_id?: string; // id du profil Candidat si role=candidat
  institut_id?: string; // id du profil Institut si role=institut
}

export interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  loading: boolean;
  login(email: string, password: string): Promise<void>;
  register(data: RegisterData): Promise<void>;
  logout(): void;
  updateUser(updates: Partial<User>): void;
}
