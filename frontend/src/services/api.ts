import axios from 'axios';
import { API_URL } from '@/config';
import type {
  RegisterData,
  ProgrammeFilters,
  InstitutFilters,
  CandidatureFilters,
  CreateProgrammeData,
  CreateInstitutData,
  UpdateUtilisateurData,
} from '@/types/api';

// Instance axios centralisée
const api = axios.create({
  baseURL: API_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Intercepteur requête : injecter le token JWT + gérer Content-Type pour FormData
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('auth_token');
  if (token) {
    config.headers.set('Authorization', `Bearer ${token}`);
  }
  // Pour les uploads FormData, retirer Content-Type — le navigateur ajoute le boundary automatiquement
  if (config.data instanceof FormData) {
    config.headers.delete('Content-Type');
  }
  return config;
});

// Intercepteur réponse : gestion globale des erreurs 401 et 403
api.interceptors.response.use(
  (response) => response,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (error: any) => {
    const status: number | undefined = error.response?.status;
    if (status === 401) {
      localStorage.removeItem('auth_token');
      localStorage.removeItem('auth_user');
      window.location.href = '/login';
    } else if (status === 403) {
      window.location.href = '/';
    }
    return Promise.reject(error);
  }
);

// --- Service authentification ---
export const authService = {
  login: (email: string, password: string) =>
    api.post('/auth/login', { email, password }),

  register: (data: RegisterData) =>
    api.post('/auth/register', data),

  me: () =>
    api.get('/auth/me'),
};

// --- Service programmes ---
export const programmeService = {
  getAll: (filters?: ProgrammeFilters) =>
    api.get('/programmes', { params: filters }),

  getById: (id: string) =>
    api.get(`/programmes/${id}`),

  create: (data: CreateProgrammeData) =>
    api.post('/programmes', data),

  update: (id: string, data: Partial<CreateProgrammeData>) =>
    api.put(`/programmes/${id}`, data),

  delete: (id: string) =>
    api.delete(`/programmes/${id}`),
};

// --- Service instituts ---
export const institutService = {
  getAll: (filters?: InstitutFilters) =>
    api.get('/instituts', { params: filters }),

  getById: (id: string) =>
    api.get(`/instituts/${id}`),

  create: (data: CreateInstitutData) =>
    api.post('/instituts', data),

  update: (id: string, data: Partial<CreateInstitutData>) =>
    api.put(`/instituts/${id}`, data),

  delete: (id: string) =>
    api.delete(`/instituts/${id}`),
};

// --- Service candidatures (uploads multipart/form-data) ---
export const candidatureService = {
  // POST et PUT avec FormData — Content-Type géré par l'intercepteur request
  create: (data: FormData) =>
    api.post('/candidatures', data),

  update: (id: string, data: FormData) =>
    api.put(`/candidatures/${id}`, data),

  soumettre: (id: string) =>
    api.post(`/candidatures/${id}/soumettre`),

  changerStatut: (id: string, statut: string, notes?: string) =>
    api.patch(`/candidatures/${id}/statut`, {
      statut,
      ...(notes !== undefined ? { notes_institut: notes } : {}),
    }),

  getMine: () =>
    api.get('/candidatures/mine'),

  getInstituteList: () =>
    api.get('/candidatures/institute/list'),

  getAll: (filters?: CandidatureFilters) =>
    api.get('/candidatures', { params: filters }),

  getById: (id: string) =>
    api.get(`/candidatures/${id}`),

  delete: (id: string) =>
    api.delete(`/candidatures/${id}`),
};

// --- Service favoris ---
export const favoriService = {
  getMine: () =>
    api.get('/favoris/mine'),

  toggle: (programme_id: string) =>
    api.post('/favoris', { programme_id }),

  remove: (programme_id: string) =>
    api.delete(`/favoris/${programme_id}`),
};

// --- Service notifications ---
export const notificationService = {
  getMine: () =>
    api.get('/notifications/mine'),

  markAsRead: (id: string) =>
    api.patch(`/notifications/${id}/lire`),
};

// --- Service utilisateurs ---
export const utilisateurService = {
  getAll: () =>
    api.get('/utilisateurs'),

  getById: (id: string) =>
    api.get(`/utilisateurs/${id}`),

  update: (id: string, data: Partial<UpdateUtilisateurData>) =>
    api.put(`/utilisateurs/${id}`, data),

  delete: (id: string) =>
    api.delete(`/utilisateurs/${id}`),
};

export default api;
