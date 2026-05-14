import axios from 'axios';
import { API_URL } from '@/config';
import type {
  RegisterData,
  ProgrammeFilters,
  InstitutFilters,
  CandidatureFilters,
  CreateProgrammeData,
  CreateInstitutData,
  InviterInstitutData,
  TerminerPremierLoginData,
  UpdateUtilisateurData,
  DemandeAccesFilters,
  PreInscriptionFormData,
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
    // Ne rediriger sur 401 que si un token était présent (session expirée).
    // Un visiteur non connecté qui frappe un endpoint protégé reçoit 401 mais
    // ne doit pas être expulsé de la navigation publique (/, /search, etc.).
    if (status === 401 && localStorage.getItem('auth_token')) {
      localStorage.removeItem('auth_token');
      localStorage.removeItem('auth_user');
      window.location.href = '/login';
    } else if (status === 403 && localStorage.getItem('auth_token')) {
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

  // Workflow first login institut
  validerTokenPremierLogin: (token: string) =>
    api.get('/auth/premier-login/valider', { params: { token } }),

  terminerPremierLogin: (data: TerminerPremierLoginData) =>
    api.post('/auth/premier-login/terminer', data),

  changerMotDePasse: (oldPassword: string, newPassword: string) =>
    api.post('/auth/change-password', { oldPassword, newPassword }),

  // Workflow réinitialisation de mot de passe
  demanderResetPassword: (email: string) =>
    api.post('/auth/mot-de-passe/oublie', { email }),

  validerResetToken: (token: string) =>
    api.get('/auth/mot-de-passe/valider-token', { params: { token } }),

  reinitialiserPassword: (token: string, password: string) =>
    api.post('/auth/mot-de-passe/reinitialiser', { token, password }),
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

  // Nouvelle invitation par email (remplace create avec mot de passe temporaire)
  inviter: (data: InviterInstitutData) =>
    api.post('/instituts', data),

  update: (id: string, data: Partial<CreateInstitutData> | FormData) =>
    api.put(`/instituts/${id}`, data),

  delete: (id: string) =>
    api.delete(`/instituts/${id}`),

  // Workflow validation admin
  listerEnAttente: () =>
    api.get('/instituts/admin/en-attente'),

  approuver: (id: string) =>
    api.post(`/instituts/${id}/approuver`),

  rejeter: (id: string, motif: string) =>
    api.post(`/instituts/${id}/rejeter`, { motif }),

  suspendre: (id: string, motif: string) =>
    api.post(`/instituts/${id}/suspendre`, { motif }),

  reactiver: (id: string) =>
    api.post(`/instituts/${id}/reactiver`),

  resoumettre: (id: string) =>
    api.post(`/instituts/${id}/resoumettre`),
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

  // Soumission avec auto-update du profil Candidat (cf. candidatureWorkflow.soumettre).
  // Le backend met à jour le Candidat depuis `profil` AVANT de valider la complétude.
  soumettreAvecProfil: (id: string, profil: Record<string, unknown>) =>
    api.post(`/candidatures/${id}/soumettre`, { profil }),

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

// --- Service pré-inscriptions ---
export const preInscriptionService = {
  creerOuCompleter: (data: FormData | PreInscriptionFormData) =>
    api.post('/preinscriptions', data),

  getMine: (candidatureId: string) =>
    api.get(`/preinscriptions/mine/${candidatureId}`),

  downloadPdf: async (id: string, nomFichier?: string): Promise<void> => {
    const response = await api.get(`/preinscriptions/${id}/pdf`, { responseType: 'blob' });
    const url = URL.createObjectURL(response.data as Blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = nomFichier ?? `attestation-preinscription-${id.substring(0, 8)}.pdf`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  },
};

// --- Service demandes d'accès ---
export const demandeAccesService = {
  creer: (data: { nom: string; email: string; telephone: string; presentation: string }) =>
    api.post('/demandes-acces', data),

  listerToutes: (params?: DemandeAccesFilters) =>
    api.get('/demandes-acces', { params }),

  approuver: (id: string) =>
    api.post(`/demandes-acces/${id}/approuver`),

  rejeter: (id: string, notes_admin?: string) =>
    api.post(`/demandes-acces/${id}/rejeter`, { notes_admin }),
};

export default api;
