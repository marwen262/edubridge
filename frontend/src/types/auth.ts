import type { RegisterData, ValidationStatus } from '@/types/api';

export interface User {
  id: string;
  email: string;
  role: 'candidat' | 'institut' | 'admin';
  prenom?: string;
  nom?: string;
  candidat_id?: string;
  institut_id?: string;
  first_login_completed?: boolean;
  /** Statut de validation dans le pipeline SaaS (instituts uniquement) */
  validation_status?: ValidationStatus;
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
