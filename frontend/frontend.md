# EduBridge Frontend Architecture Documentation

**Version:** 0.1.0  
**Framework:** React 18.3.1 + Vite 6.4.2  
**Date:** Mai 2026

---

## Table of Contents

1. [Vue Globale](#vue-globale)
2. [Structure du Projet](#structure-du-projet)
3. [Pages & Routing](#pages--routing)
4. [Composants](#composants)
5. [State Management](#state-management)
6. [Communication Backend](#communication-backend)
7. [Gestion des Formulaires](#gestion-des-formulaires)
8. [Médias & Ressources](#médias--ressources)
9. [Authentification](#authentification)
10. [Design System & UI/UX](#design-system--uiux)
11. [Performance](#performance)
12. [Points Forts & Problèmes](#points-forts--problèmes)
13. [État actuel — résumé factuel](#état-actuel--résumé-factuel)

---

## Vue Globale

### Type d'Application
- **Architecture:** Single Page Application (SPA) cliente
- **Technologie:** React 18.3 + Vite (build tool moderne)
- **Paradigme:** Component-based UI avec React hooks
- **Routing:** React Router 7 (client-side routing)

### Flux Utilisateur Global
```
Utilisateur
    ↓
Interface Vite (HMR en dev)
    ↓
App.tsx (AuthProvider + RouterProvider)
    ↓
routes.tsx (20 routes nommées + wildcard 404, dont plusieurs protégées par rôle)
    ↓
ProtectedRoute (vérification JWT + rôle)
    ↓
Pages + Composants
    ↓
Hooks (usePrograms, useCandidatures, …)
    ↓
services/api.ts (axios, intercepteurs JWT)
    ↓
Backend API (http://localhost:5000/api)
    ↓
Toast Notifications (Sonner)
```

### Cas d'Usage Principaux
1. **Candidats:** Recherche de programmes, comparaison, candidature, dashboard personnel
2. **Institutions:** Gestion des programmes, applicants, décisions
3. **Admins:** Vue globale, gestion des utilisateurs, relay des décisions

---

## Structure du Projet

### Arborescence Complète
```
src/
├── main.tsx                          # Entry point React
├── vite-env.d.ts                     # Types Vite
├── config.ts                         # Constante VITE_API_URL
├── services/
│   └── api.ts                        # Client axios centralisé + tous les services
├── types/
│   ├── api.ts                        # Types TS pour les entités backend (RegisterData, filtres, etc.)
│   └── auth.ts                       # Types User et AuthContextType
├── context/
│   └── AuthContext.tsx               # AuthProvider + hook useAuth
├── components/
│   └── ProtectedRoute.tsx            # Wrapper route protégée (redirect si non auth ou mauvais rôle)
├── hooks/                            # Hooks de fetch (un par ressource)
│   ├── usePrograms.ts                # fetch /programmes avec filtres + refetch
│   ├── useProgramDetail.ts           # fetch /programmes/:id
│   ├── useInstituts.ts               # fetch /instituts avec filtres + refetch
│   ├── useInstitut.ts                # fetch /instituts/:id
│   ├── useCandidatures.ts            # useCandidatures / useInstitutCandidatures / useAllCandidatures
│   ├── useFavoris.ts                 # useFavoris + useToggleFavori
│   ├── useFavoriStatus.ts            # Hook transversal (ProgramCard + ProgramDetail) — état favori synchronisé
│   ├── useNotifications.ts           # useNotifications + unreadCount + markAsRead
│   ├── useUtilisateurs.ts            # useUtilisateurs (admin)
│   └── useComparaison.ts             # localStorage compare list (max 3 programmes)
├── app/
│   ├── App.tsx                       # AuthProvider > RouterProvider > Toaster
│   ├── routes.tsx                    # 20 routes nommées + wildcard 404 (plusieurs routes dashboard protégées par rôle)
│   ├── pages/                        # Pages de niveau routing
│   │   ├── Home.tsx                  # Landing page
│   │   ├── SearchResults.tsx         # Recherche & filtrage
│   │   ├── Institutions.tsx          # Listing public des instituts
│   │   ├── ProgramDetail.tsx         # Détail d'un programme
│   │   ├── InstitutionProfile.tsx    # Profil d'institution (route `/institution/:slug`)
│   │   ├── Compare.tsx               # Comparaison de programmes
│   │   ├── Guide.tsx                 # Page guide utilisateur
│   │   ├── Login.tsx                 # Login réel (useAuth + RHF + zod) + dialog "Forgot password?"
│   │   ├── Signup.tsx                # Inscription réelle (useAuth + RHF + zod)
│   │   ├── FirstLogin.tsx            # Activation premier login institut (token email — invitation admin)
│   │   ├── ResetPassword.tsx         # Réinitialisation mot de passe via lien email (token 1h)
│   │   ├── CandidateDashboard.tsx    # Dashboard candidat (overview)
│   │   ├── MesCandidatures.tsx       # Liste détaillée des candidatures
│   │   ├── MesFavoris.tsx            # Liste détaillée des favoris
│   │   ├── MesDocuments.tsx          # Historique des documents uploadés
│   │   ├── Parametres.tsx            # Modification du profil complet du candidat
│   │   ├── InstitutionDashboard.tsx  # Dashboard institution (+ variante `/dashboard/institution/:section`)
│   │   └── AdminDashboard.tsx        # Dashboard admin (+ variante `/dashboard/admin/:section`)
│   ├── components/                   # Composants réutilisables
│   │   ├── Navbar.tsx                # Barre de navigation sticky (useAuth + dropdown notifications)
│   │   ├── Footer.tsx                # Footer global
│   │   ├── DashboardSidebar.tsx      # Sidebar dashboards (useAuth pour profil)
│   │   ├── NotificationDropdown.tsx  # Badge unreadCount + dropdown + markAsRead
│   │   ├── ProgramCard.tsx           # Card programme (grid/list) — utilise useFavoriStatus
│   │   ├── InstitutionCard.tsx       # Card institution
│   │   ├── InstitutCard.tsx          # Card institut (listing public)
│   │   ├── MultiStepDialog.tsx       # Dialog candidature 5 étapes — connecté candidatureService + Multer
│   │   ├── Stepper.tsx               # Composant stepper
│   │   ├── StatCard.tsx              # Card de statistiques
│   │   ├── StatusBadge.tsx           # Badge de statut
│   │   ├── SkeletonCard.tsx          # Skeleton loading
│   │   ├── EmptyState.tsx            # État vide
│   │   ├── forms/                    # Composants de formulaires (NationaliteSelect, IndicatifTelephone, AdresseFields)
│   │   ├── admin/                    # Sections AdminDashboard (Overview, Users, Institutes, Programs, Candidatures, Notifications)
│   │   ├── institution/              # Sections InstitutionDashboard + CreateProgramDialog
│   │   ├── figma/
│   │   │   └── ImageWithFallback.tsx # Image avec fallback
│   │   └── ui/                       # Design system (Radix UI — NE PAS ÉDITER)
│   │       ├── ~50 composants shadcn/ui (button, card, dialog, …)
│   │       └── utils.ts              # Utilitaire cn()
│   └── data/
│       └── staticData.ts             # Données statiques (référentiels UI — plus aucun mock métier)
└── styles/
    ├── index.css                     # Entry point styles
    ├── tailwind.css                  # Tailwind directives
    ├── theme.css                     # Tokens CSS Radix UI
    ├── edubridge.css                 # Design system custom (Apple-inspired)
    └── fonts.css                     # Imports de fonts

Fichiers racine:
├── .env.local                        # VITE_API_URL=http://localhost:5000/api
├── vite.config.ts                    # Config Vite + plugins (React, Tailwind)
├── tsconfig.json                     # Config TypeScript
└── package.json                      # Dépendances + scripts
```

### Rôle de Chaque Dossier

| Dossier | Responsabilité |
|---------|-----------------|
| `services/` | Client HTTP axios + tous les services API (auth, programmes, instituts, candidatures, favoris, notifications, utilisateurs) |
| `types/` | Types TypeScript pour les entités backend et l'auth |
| `context/` | AuthContext — état global utilisateur + token JWT |
| `components/` | ProtectedRoute — garde les routes privées |
| `hooks/` | Fetch hooks (loading/error/refetch par ressource) |
| `pages/` | Pages complètes du routing (20 routes nommées + wildcard 404) |
| `app/components/` | Composants réutilisables (business logic + présentation) |
| `app/components/forms/` | Composants spécifiques aux formulaires (Nationalité, Téléphone, etc.) |
| `app/components/ui/` | Design system primitif (Radix UI wrappé — NE PAS ÉDITER) |
| `app/components/admin/` | Sections du dashboard admin (Overview, Users, Institutes, Programs, Candidatures, Notifications) |
| `app/components/institution/` | Sections du dashboard institut + `CreateProgramDialog` |
| `app/data/` | `staticData.ts` — référentiels UI statiques (filtres, libellés). Plus de mock métier. |
| `styles/` | CSS global, tokens de design, thème |

---

## Pages & Routing

### Configuration React Router

```tsx
export const router = createBrowserRouter([
  { path: '/',                    Component: Home },
  { path: '/search',              Component: SearchResults },
  { path: '/institutions',        Component: Institutions },
  { path: '/program/:id',         Component: ProgramDetail },
  { path: '/institution/:slug',   Component: InstitutionProfile },
  { path: '/compare',             Component: Compare },
  { path: '/guide',               Component: Guide },
  { path: '/login',               Component: Login },
  { path: '/signup',              Component: Signup },
  { path: '/first-login',         Component: FirstLogin },
  { path: '/reset-password',      Component: ResetPassword },
  // Dashboards protégés par rôle
  { path: '/dashboard/candidate',    element: <ProtectedRoute requiredRole="candidat"><CandidateDashboard /></ProtectedRoute> },
  { path: '/dashboard/candidatures', element: <ProtectedRoute requiredRole="candidat"><MesCandidatures /></ProtectedRoute> },
  { path: '/dashboard/favoris',      element: <ProtectedRoute requiredRole="candidat"><MesFavoris /></ProtectedRoute> },
  { path: '/dashboard/documents',    element: <ProtectedRoute requiredRole="candidat"><MesDocuments /></ProtectedRoute> },
  { path: '/dashboard/parametres',   element: <ProtectedRoute requiredRole="candidat"><Parametres /></ProtectedRoute> },
  { path: '/dashboard/institution',  element: <ProtectedRoute requiredRole="institut"><InstitutionDashboard /></ProtectedRoute> },
  { path: '/dashboard/institution/:section', element: <ProtectedRoute requiredRole="institut"><InstitutionDashboard /></ProtectedRoute> },
  { path: '/dashboard/admin',        element: <ProtectedRoute requiredRole="admin"><AdminDashboard /></ProtectedRoute> },
  { path: '/dashboard/admin/:section',       element: <ProtectedRoute requiredRole="admin"><AdminDashboard /></ProtectedRoute> },
  { path: '*', Component: () => /* JSX 404 inline */ },
]);
```

⚠️ Note : `/institution/:slug` utilise `slug` côté URL, mais le backend (`GET /api/instituts/:id`) attend l'UUID. Le mapping slug→id n'est pas centralisé — vérifier dans `InstitutionProfile.tsx` / `useInstitut.ts` comment la valeur est résolue.

### Pages Principales

#### 1. **Home** (`/`)
- Landing page hero avec search bar
- Affiche programmes & institutions populaires
- Call-to-action vers /search
- Animations d'entrée (Motion)
- Dark mode support

#### 2. **SearchResults** (`/search`)
- Filtrage multi-critères (field, level, tuition) — *le filtre "Pays" a été retiré*
- Grid/List view toggle
- Sort options (relevance, deadline, tuition)
- Affichage des ProgramCards
- State: filtres locaux (useState)

#### 3. **ProgramDetail** (`/program/:id`)
- Vue détaillée du programme
- Hero image + breadcrumb
- Tabs: Description, Requirements, Curriculum
- Accordion pour les requirements
- Save/Apply buttons (MultiStepDialog)
- Similar programs carousel

#### 4. **InstitutionProfile** (`/institution/:slug`)
- Profil complet institution — `GET /api/instituts/:id` via `useInstitut`
- Cover image + logo
- Stats (programmes, students, acceptance rate)
- Programmes publiés par institution
- Localisation & contact

#### 5. **Compare** (`/compare`)
- Tableau comparatif (max 3 programmes)
- Liste persistée en `localStorage` via `useComparaison`
- Hydratation des programmes via `programmeService.getById`
- Critères side-by-side
- View Details link par programme
- Option d'ajouter programmes

#### 6. **Login** (`/login`)
- Form: email + password (react-hook-form + zod)
- Appelle `useAuth().login()` → POST `/api/auth/login`
- Redirection selon `user.role` (candidat/institut/admin)
- Gestion erreurs Axios (toast) + bannières spéciales `FIRST_LOGIN_REQUIRED`,
  `ACCOUNT_SUSPENDED`
- **Dialog « Forgot password? »** (shadcn `Dialog`) :
  saisie email → `authService.demanderResetPassword(email)` →
  POST `/api/auth/mot-de-passe/oublie` → écran de confirmation générique
  (anti-énumération côté backend)

#### 7. **Signup** (`/signup`)
- Form pour candidats (react-hook-form + zod)
- Password strength indicator
- Appelle `useAuth().register()` → POST `/api/auth/register`
- Terms acceptance

#### 8. **FirstLogin** (`/first-login`)
- Activation **premier login institut** via token d'invitation admin
- Lit `?token=…` → `authService.validerTokenPremierLogin(token)`
- Étape 1 : nouveau mot de passe + checklist critères
- Étape 2 : profil minimal (nom, téléphone, description)
- Soumission → `authService.terminerPremierLogin(...)` → connecte automatiquement
  + redirige vers `/dashboard/institution`

#### 8 bis. **ResetPassword** (`/reset-password`)
- Réinitialisation de mot de passe via lien email (token 1h)
- Lit `?token=…` → `authService.validerResetToken(token)` au montage
- Affiche le formulaire RHF + zod (même checklist que FirstLogin) si token valide,
  sinon écran d'erreur (`TOKEN_EXPIRED` / `TOKEN_INVALID`)
- Soumission → `authService.reinitialiserPassword(token, password)` →
  toast succès + redirection `/login`

#### 9. **CandidateDashboard** (`/dashboard/candidate`)
- Vue principale / Overview
- Stats cards (applications, saved, decisions)
- Actions rapides (Explorer, Compléter profil, Uploader documents)
- My applications table (récentes)
- Notifications (badge + liste)
- Recommended programs

#### 9 bis. **Sous-pages Candidat**
- **MesCandidatures** (`/dashboard/candidatures`) : Vue détaillée de l'historique
- **MesFavoris** (`/dashboard/favoris`) : Liste des programmes sauvegardés
- **MesDocuments** (`/dashboard/documents`) : Historique des fichiers déposés dans les candidatures (avec prévisualisation)
- **Parametres** (`/dashboard/parametres`) : Formulaire pour gérer les informations de profil (Identité, Adresse, Parcours académique)


#### 10. **InstitutionDashboard** (`/dashboard/institution`)
- Sidebar navigation (role-based)
- Published programs stats
- Kanban pipeline (New → Under Review → Interview → Decision Sent)
- Programs table
- Line charts (recharts)

#### 11. **AdminDashboard** (`/dashboard/admin`)
- Vue globale (stat cards modernisées)
- Pending decisions relay table
- Users management table
- Charts: registrations, role distribution
- Institutional analytics
- Interface modernisée et unifiée avec le branding officiel EduBridge

### Navigation Globale
- **Navbar** (sticky, z-50)
  - Logo/Home link
  - Links: Programs, Institutions, How it works
  - Dark mode toggle (localStorage)
  - Login/Signup buttons
  
- **DashboardSidebar** (sticky, z-40)
  - Role-specific nav items
  - User profile section
  - Logout button

- **Footer**
  - Links par section (Product, For Candidates, For Institutions)
  - Social media
  - Language selector placeholder

---

## Composants

### Hiérarchie Composants

#### 🎨 **Couche Design System** (`components/ui/`)
Wrappés Radix UI avec Tailwind CSS

- `button.tsx` - Variant support (default, secondary, ghost, outline)
- `input.tsx` - Input text
- `label.tsx` - Label form
- `dialog.tsx` - Modal dialog
- `tabs.tsx` - Tabbed interface
- `select.tsx` - Dropdown select
- `checkbox.tsx` - Checkbox
- `badge.tsx` - Label badge
- `accordion.tsx` - Accordion collapsible
- `avatar.tsx` - User avatar
- `slider.tsx` - Range slider
- `separator.tsx` - Visual divider
- `tooltip.tsx` - Tooltip overlay
- `card.tsx` - Card container
- `carousel.tsx` - Image carousel
- `calendar.tsx` - Date picker
- `chart.tsx` - Chart wrapper (recharts)
- `progress.tsx` - Progress bar
- `scroll-area.tsx` - Scrollable area
- `popover.tsx` - Popover menu
- `drawer.tsx` - Drawer sidebar
- `sonner.tsx` - Toast wrapper
- `utils.ts` - `cn()` utility function
- `use-mobile.ts` - Mobile breakpoint hook

#### 🏗️ **Couche Business Components** (`components/`)

**Navigation & Layout:**
- `Navbar.tsx` - Barre nav sticky avec dark mode toggle
- `Footer.tsx` - Footer global avec liens
- `DashboardSidebar.tsx` - Sidebar dashboards (candidate/institution/admin)

**Cards & Content:**
- `ProgramCard.tsx` - Carte programme (grid/list view)
- `InstitutionCard.tsx` - Carte institution
- `StatCard.tsx` - Stat display card
- `StatusBadge.tsx` - Badge pour application status
- `SkeletonCard.tsx` - Shimmer loading state
- `EmptyState.tsx` - Empty state display

**Forms & Dialogs:**
- `MultiStepDialog.tsx` - 5-step application form, connecté à `candidatureService.create`
  - Step 0: Personal Info
  - Step 1: Academic
  - Step 2: Documents (upload Multer via `FormData`)
  - Step 3: Motivation
  - Step 4: Review
  - À la soumission : `candidatureService.create(formData)` → POST `/api/candidatures`
- `Stepper.tsx` - Stepper UI avec progress bar
- `NotificationDropdown.tsx` - Dropdown Navbar avec badge `unreadCount`, click sur item → `markAsRead`
- `NationaliteSelect.tsx` - Sélecteur de nationalité moderne (shadcn/ui `Select`) avec drapeaux en emojis.
- `IndicatifTelephone.tsx` - Champ téléphone gérant automatiquement l'indicatif en fonction de la nationalité, et préservant les modifications manuelles.
- `AdresseFields.tsx` - Groupe de champs pour gérer une entité Adresse (rue, ville, code_postal, etc.).

**Media:**
- `ImageWithFallback.tsx` - Image avec fallback

### Patterns de Réutilisation

#### 1. **Composants Atomiques (ui/)**
```tsx
// Exemple: Button
<Button
  variant="default" | "secondary" | "ghost" | "outline"
  size="default" | "sm" | "lg"
  className="..."
>
  Content
</Button>
```

#### 2. **Composants Composés (business)**
```tsx
// Exemple: ProgramCard
<ProgramCard program={program} view="list" | "grid" />
// Gère l'état saved, animations, navigation
```

#### 3. **Props Drilling**
```tsx
// DashboardSidebar props
interface DashboardSidebarProps {
  role: 'candidate' | 'institution' | 'admin';
  user: { name: string; avatar?: string; role?: string };
}
```

### Organisation Structurelle

**Atomic Design:** Pas formellement implémenté, mais patterns similaires :
- **Atoms:** `ui/` components (Button, Input, Badge)
- **Molecules:** `StatCard.tsx`, `ProgramCard.tsx`
- **Organisms:** `Navbar.tsx`, `DashboardSidebar.tsx`, `MultiStepDialog.tsx`
- **Pages:** `pages/*.tsx`

**Observation:** Le dossier `src/hooks/` regroupe 10 hooks de fetch (un par ressource métier — voir §Communication Backend pour la liste complète). La logique de fetch est extraite des pages.

---

## State Management

### Méthode Utilisée
**React Context API (AuthContext) + useState local + localStorage**

### Patterns Identifiés

#### 1. **AuthContext (global)**
```tsx
// src/context/AuthContext.tsx
const {
  user, token, isAuthenticated, loading,
  login, logout, register, updateUser,
} = useAuth();

// user: { id, email, role, prenom, nom, candidat_id?, institut_id? }
// Persisté dans localStorage (auth_token + auth_user)
// Intercepteur axios injecte le token sur chaque requête
```

#### 2. **useState Local (UI)**
```tsx
// CandidateDashboard.tsx
const [searchQuery, setSearchQuery] = useState('');

// Navbar.tsx - Dark mode
const [darkMode, setDarkMode] = useState(false);
```

#### 3. **localStorage Persistence**
```tsx
// auth_token — JWT Bearer
// auth_user  — objet User JSON
// darkMode   — toggle dark mode

// Intercepteur 401 : vide localStorage + redirect /login automatique
```

#### 4. **Hooks de fetch (data layer)**
```tsx
// Pattern uniforme pour toutes les ressources :
const { programs, loading, error, refetch } = usePrograms(filters);
const { candidatures, loading, error, refetch } = useCandidatures();
const { favoris, loading, error, refetch } = useFavoris();
const { notifications, unreadCount } = useNotifications();
// Annulation abort via flag `cancelled` pour éviter les race conditions
```

#### 5. **useParams & useNavigate (React Router)**
```tsx
const { id } = useParams();
const navigate = useNavigate();
```

### État actuel
✅ État global auth via AuthContext
✅ Token JWT injecté automatiquement par axios
✅ Gestion 401/403 centralisée (intercepteur)
✅ Hooks de fetch avec loading/error/refetch
⚠️ Pas de caching (chaque navigation re-fetch)

---

## Communication Backend

### Statut Actuel
**✅ Intégration API backend complète** — la couche de communication est en place.

### Architecture client HTTP (`src/services/api.ts`)

Instance axios centralisée avec :
- `baseURL` = `VITE_API_URL` (défaut `http://localhost:5000/api`)
- **Intercepteur requête** : injecte `Authorization: Bearer <token>` depuis localStorage ; supprime `Content-Type` pour les `FormData` (uploads Multer)
- **Intercepteur réponse** : 401 → vide localStorage + redirect `/login` ; 403 → redirect `/`

### ⚠️ Convention critique — wrapping des réponses

Le backend wrappe **toujours** la ressource dans une clé nommée au singulier.
Ne jamais caster `r.data` directement en `Programme` ou autre type métier :

```ts
// ❌ INCORRECT — r.data vaut { programme: {...} }, pas un Programme
const prog = r.data as Programme;
prog.titre.charAt(0);  // TypeError: Cannot read properties of undefined

// ✅ CORRECT — extraire d'abord depuis le wrapper
const payload = r.data as { programme?: Programme };
const prog = payload.programme;
prog?.titre?.charAt(0) ?? '?';
```

Tableau récapitulatif :

| Appel service | `r.data` reçu | À extraire |
|---|---|---|
| `programmeService.getById(id)` | `{ programme: {...} }` | `r.data.programme` |
| `programmeService.getAll()` | `{ programmes: [...] }` | `r.data.programmes` |
| `institutService.getById(id)` | `{ institut: {...} }` | `r.data.institut` |
| `candidatureService.getById(id)` | `{ candidature: {...} }` | `r.data.candidature` |
| `favoriService.getMine()` | `{ favoris: [...] }` | `r.data.favoris` |
| `notificationService.getMine()` | `{ notifications: [...] }` | `r.data.notifications` |

L'alias Sequelize est `as: 'institut'` (minuscule) → la clé imbriquée est `programme.institut`.

### Services disponibles

| Service | Méthodes | Routes backend |
|---------|----------|----------------|
| `authService` | `login`, `register`, `me`, `validerTokenPremierLogin`, `terminerPremierLogin`, `demanderResetPassword`, `validerResetToken`, `reinitialiserPassword` | `/api/auth/*` |
| `programmeService` | `getAll`, `getById`, `create`, `update`, `delete` | `/api/programmes/*` |
| `institutService` | `getAll`, `getById`, `create`, `update`, `delete` | `/api/instituts/*` |
| `candidatureService` | `create`, `update`, `soumettre`, `changerStatut`, `getMine`, `getInstituteList`, `getAll`, `getById`, `delete` | `/api/candidatures/*` |
| `favoriService` | `getMine`, `toggle`, `remove` | `/api/favoris/*` |
| `notificationService` | `getMine`, `markAsRead` | `/api/notifications/*` |
| `utilisateurService` | `getAll`, `getById`, `update`, `delete` | `/api/utilisateurs/*` |

### Hooks de fetch (`src/hooks/`)

Chaque hook encapsule `loading`, `error`, `refetch` et annule les requêtes en vol :

```tsx
const { programs, loading, error, refetch } = usePrograms({ domaine: 'informatique' });
const { program, loading, error } = useProgramDetail(id);
const { instituts, loading, error, refetch } = useInstituts({ est_verifie: true });
const { institut, loading, error } = useInstitut(id);
const { candidatures, loading, error, refetch } = useCandidatures();         // mine
const { candidatures } = useInstitutCandidatures();                           // institut
const { candidatures } = useAllCandidatures({ statut: 'soumise' });          // admin
const { favoris, loading, error, refetch } = useFavoris();
const { toggle, loading } = useToggleFavori();
const { notifications, unreadCount, refetch } = useNotifications();
const { utilisateurs, loading, error, refetch } = useUtilisateurs();          // admin
```

### Configuration

```bash
# frontend/.env.local
VITE_API_URL=http://localhost:5000/api
```

### ✅ Divergence notifications — RÉSOLUE
`notificationService.markAsRead` appelle désormais correctement `PATCH /notifications/:id/lire`
et `notificationService.getMine` appelle `GET /notifications/mine`. Les routes frontend et
backend sont alignées (vérifié dans `src/services/api.ts`).

---

## Gestion des Formulaires

### Librairies
**React Hook Form 7.55.0** + **zod 4.x** + **@hookform/resolvers 5.x**

### Formulaires migrés vers RHF + zod

#### **Login** (`pages/Login.tsx`)
```tsx
const loginSchema = z.object({
  email: z.string().email('Email invalide'),
  password: z.string().min(1, 'Mot de passe requis'),
});

const { register, handleSubmit, formState: { errors, isSubmitting } } =
  useForm<LoginFormData>({ resolver: zodResolver(loginSchema) });

const onSubmit = async (data) => {
  await login(data.email, data.password);   // useAuth
  navigate('/dashboard/<role>');
};
```

#### **Signup** (`pages/Signup.tsx`)
```tsx
const signupSchema = z.object({
  fullName: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(8).regex(/[A-Z]/).regex(/[0-9]/).regex(/[!@#$%^&*]/),
  confirmPassword: z.string(),
  country: z.string().min(1),
  educationLevel: z.string().min(1),
  fieldOfInterest: z.string().min(1),
  termsAccepted: z.boolean().refine(v => v),
}).refine(d => d.password === d.confirmPassword, { path: ['confirmPassword'] });

const onSubmit = async (data) => {
  await registerUser({ email, password, role: 'candidat', prenom, nom });
  navigate('/dashboard/candidate');
};
```

#### **MultiStepDialog** (`components/MultiStepDialog.tsx`)
- Basé sur `useState` (5 étapes) ; migration RHF non priorisée tant que l'UX
  multi-étapes reste stable.
- Connecté à `candidatureService.create(formData)` — construit un `FormData`
  pour permettre l'upload Multer (champs `diplome_bac`, `releves_notes`,
  `lettre_motivation`, `piece_identite`, …) en plus du `programme_id` et de la
  `lettre_motivation` texte.
- L'intercepteur axios supprime le `Content-Type` JSON par défaut quand le body
  est un `FormData` pour laisser le navigateur définir le `multipart/form-data`
  boundary correct.

### Notifications
**Sonner** pour tous les feedbacks :
```tsx
toast.success('Connexion réussie !');
toast.error(axiosError.response?.data?.message ?? 'Erreur réseau');
```

---

## Médias & Ressources

### Images
1. **External URLs (Unsplash, etc.)**
   ```tsx
   // Home.tsx - Hero
   src="https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=1920&h=800&fit=crop"
   
   // ProgramCard.tsx - Institution logo
   src={program.institution.logo}
   ```

2. **Fallback Pattern**
   ```tsx
   // figma/ImageWithFallback.tsx
   // Component pour gérer images cassées (à vérifier implémentation)
   ```

3. **Optimisation**
   - Pas de lazy loading détecté
   - Pas de format WebP/AVIF
   - Pas de responsive images (`srcset`)
   - ⚠️ Performance bottleneck potentiel

### Ressources Statiques
```
assetInclude: ['**/*.svg', '**/*.csv'] // vite.config.ts
```

### Recommandations
1. Ajouter `next/image` equivalent ou `img` natif avec lazy loading
2. Optimiser images (compression, format modern)
3. Ajouter `srcset` pour responsive

---

## Authentification

### Statut Actuel
**✅ Authentification réelle via JWT** — intégration backend complète.

### AuthContext (`src/context/AuthContext.tsx`)

```tsx
interface AuthContextType {
  user: User | null;           // { id, email, role, prenom, nom, candidat_id?, institut_id? }
  token: string | null;        // JWT Bearer
  isAuthenticated: boolean;    // !!token && !!user
  loading: boolean;
  login(email, password): Promise<void>;
  register(data: RegisterData): Promise<void>;
  logout(): void;              // vide localStorage + redirect /login
  updateUser(updates): void;   // mise à jour locale
}
```

Persistance via `localStorage` :
- `auth_token` — JWT
- `auth_user` — objet User sérialisé JSON

### Login réel (`pages/Login.tsx`)

```tsx
const onSubmit = async ({ email, password }) => {
  await login(email, password);  // POST /api/auth/login via authService
  const role = JSON.parse(localStorage.getItem('auth_user')).role;
  navigate(`/dashboard/${roleToPath[role]}`);
};
```

### Protection des routes

`ProtectedRoute` (`src/components/ProtectedRoute.tsx`) :
- Non authentifié → `<Navigate to="/login" replace />`
- Mauvais rôle → `<Navigate to="/" replace />`
- Affiche un spinner pendant `loading`

```tsx
// routes.tsx
{ path: '/dashboard/candidate',
  element: <ProtectedRoute requiredRole="candidat"><CandidateDashboard /></ProtectedRoute> }
```

### Dark Mode
```tsx
// Navbar.tsx — persist dans localStorage, classe .dark sur <html>
const toggleDarkMode = () => {
  localStorage.setItem('darkMode', String(!darkMode));
  document.documentElement.classList.toggle('dark');
};
```

### État de l'auth
✅ Login/Register réel (POST backend)
✅ Token JWT persisté en localStorage
✅ Injection automatique du token (intercepteur axios)
✅ Invalidation 401 → redirect /login automatique
✅ Routes dashboard protégées par rôle
⚠️ Pas de refresh token (token expire après 7j sans reconnexion)

---

## Design System & UI/UX

### Librairies UI

| Librairie | Version | Usage |
|-----------|---------|-------|
| **Radix UI** | Latest | Headless components (30+) |
| **Tailwind CSS** | 4.1.12 | Utility-first CSS |
| **Lucide React** | 0.487 | Icons (Search, Heart, MapPin, etc.) |
| **MUI Icons** | 7.3.5 | Alternative icons |
| **Motion** | 12.23.24 | Animations (Framer Motion) |
| **Recharts** | 2.15.2 | Charts (Line, Pie, Bar) |
| **Sonner** | 2.0.3 | Toast notifications |

### Design System Architecture

#### 1. **CSS Custom Properties (theme.css & edubridge.css)**

**Couleurs EduBridge (Apple-inspired):**
```css
--edu-blue: #0071E3
--edu-blue-hover: #0077ED
--edu-indigo: #5E5CE6
--edu-success: #30D158
--edu-warning: #FF9F0A
--edu-danger: #FF3B30
--edu-info: #64D2FF
--edu-accent: #FF9500

/* Text */
--edu-text-primary: #1D1D1F
--edu-text-secondary: #6E6E73
--edu-text-tertiary: #86868B

/* Surfaces */
--edu-white: #FFFFFF
--edu-surface: #F5F5F7
--edu-elevated: #FBFBFD
```

**Dark Mode:**
```css
.dark {
  --edu-surface: #1C1C1E
  --edu-elevated: #2C2C2E
  --edu-text-primary: #F5F5F7
}
```

#### 2. **Classe Utilitaires Personnalisées**

```css
/* Glass Card Effect */
.glass-card {
  background: var(--glass-bg);
  backdrop-filter: blur(20px);
  border: 1px solid var(--glass-border);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.06);
}

/* Hover Effect */
.hover-lift {
  transition: transform 200ms ease, box-shadow 200ms ease;
}
.hover-lift:hover {
  transform: translateY(-4px);
  box-shadow: 0 12px 48px rgba(0, 0, 0, 0.12);
}

/* Skeleton Loading */
.skeleton-shimmer {
  background: linear-gradient(to right, #f0f0f0 0%, #e0e0e0 20%, #f0f0f0 40%);
  background-size: 2000px 100%;
  animation: shimmer 2s linear infinite;
}
```

#### 3. **Tailwind Configuration**

**Radius personnalisé:**
```tsx
--radius: 0.625rem; // ~10px
```

**Breakpoints (Tailwind defaults):**
- `sm`: 640px
- `md`: 768px
- `lg`: 1024px
- `xl`: 1280px
- `2xl`: 1536px

#### 4. **Animations**

**Animations Custom (edubridge.css):**
```css
@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
```

**Motion/Framer Motion Usage:**
```tsx
<motion.div
  initial={{ opacity: 0, y: 20 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ duration: 0.4 }}
>
  Content
</motion.div>
```

### Layout Patterns

#### 1. **Hero Sections**
```tsx
// Home.tsx
<section className="hero-gradient relative overflow-hidden">
  <div className="absolute inset-0 opacity-20">
    <img src="..." alt="Campus" className="w-full h-full object-cover" />
  </div>
  <motion.div initial={{...}} animate={{...}}>
    {/* Content */}
  </motion.div>
</section>
```

#### 2. **Grid Layout**
```tsx
// SearchResults.tsx - Programs grid
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
  {stats.map((stat, i) => (
    <StatCard key={i} {...stat} />
  ))}
</div>
```

#### 3. **Table Layout**
```tsx
// CandidateDashboard.tsx - Applications
<table className="w-full">
  <thead className="bg-[var(--edu-surface)]">
    <tr>
      <th className="text-left px-6 py-4">Program</th>
      {/* ... */}
    </tr>
  </thead>
  <tbody className="divide-y divide-[var(--edu-divider)]">
    {mockApplications.map((app) => (...))}
  </tbody>
</table>
```

#### 4. **Responsive Design**
```tsx
// Max-width container
<div className="max-w-[1440px] mx-auto px-6">

// Responsive gaps
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">

// Mobile-first styling
className="hidden md:flex" // Hide on mobile, show on md+
```

### Typographie
- **Font sizes:** Tailwind defaults (text-sm, text-base, text-lg, etc.)
- **Font weights:** 400 (normal), 500 (medium), 600 (semibold), 700 (bold)
- **Letter spacing:** Custom tracking (tracking-tight, etc.)

### Color Usage Guidelines
- **Primary actions:** `--edu-blue`
- **Success states:** `--edu-success` (#30D158)
- **Warnings:** `--edu-warning` (#FF9F0A)
- **Danger/Errors:** `--edu-danger` (#FF3B30)
- **Text:** Primary/Secondary/Tertiary hierarchy

---

## Performance

### Optimisations Identifiées

#### 1. **Code Splitting**
- ✅ Vite gère automatiquement le code splitting
- ✅ Routes séparées (lazy loading implicite)

#### 2. **Image Handling**
- ⚠️ **Pas de lazy loading** détecté
- ⚠️ **Pas de responsive images**
- ⚠️ **Pas de format modernes** (WebP, AVIF)
- Images from Unsplash/external sans optimisation

#### 3. **Bundle Size**
**Dépendances lourdes détectées:**
- Radix UI (30+ composants) - ~50KB gzipped
- Recharts - ~35KB gzipped
- Motion (Framer) - ~30KB gzipped
- Tailwind CSS - ~15KB gzipped

**Total estimé:** ~200KB+ gzipped

#### 4. **Rendering Performance**
- ✅ React.StrictMode activé (détecte render issues)
- ✅ Motion animations optimisées (GPU-accelerated)
- ⚠️ `useMemo()` utilisé dans plusieurs hooks (`usePrograms`, `useCandidatures`, `useInstituts`) pour stabiliser les paramètres de fetch. ❌ Pas de `React.memo()` sur les composants de listing (ProgramCard, InstitutionCard).
- ❌ Pas de `React.lazy()` pour code splitting manuel des routes.

#### 5. **State Management Impact**
- ✅ useState optimal (simple state)
- ⚠️ Pas de normalization de données
- ⚠️ Pas de caching stratégique

### Bottlenecks Potentiels

1. **Images non optimisées** → Impact sur LCP/FCP
2. **Pas de infinite scroll** sur SearchResults → Charge DOM complète
3. **Mock data inline** → Pas d'API caching
4. **Recharts sur dashboards** → Re-render potentiel coûteux
5. **localStorage pour dark mode** → Flickering possible en page load

### Recommandations d'Optimisation

```tsx
// 1. Lazy loading images
<img
  src={src}
  alt={alt}
  loading="lazy"
  decoding="async"
/>

// 2. Responsive images
<img
  srcSet={`
    ${src}?w=480 480w,
    ${src}?w=960 960w,
    ${src}?w=1920 1920w
  `}
  sizes="(max-width: 640px) 480px, 960px"
  src={src}
  alt={alt}
/>

// 3. Memoization
const ProgramCard = React.memo(({ program }) => {
  return <div>...</div>;
});

// 4. Dark mode avoid flicker
<script>
  const isDark = localStorage.getItem('darkMode');
  if (isDark) document.documentElement.classList.add('dark');
</script>

// 5. Intersection Observer pour infinite scroll
const observer = new IntersectionObserver(callback);
observer.observe(lastElementRef);
```

---

## Points Forts & Problèmes

### ✅ Points Forts

#### 1. **Architecture Moderne & Maintenable**
- ✅ Composants React bien structurés
- ✅ Séparation pages/components/ui claire
- ✅ TypeScript full avec types backend (`src/types/`)
- ✅ Vite pour dev experience optimale (HMR)

#### 2. **Design System Cohérent**
- ✅ Radix UI + Tailwind bien intégrés
- ✅ Custom CSS variables (Apple-inspired aesthetics)
- ✅ Dark mode support natif
- ✅ Animations fluides (Motion)

#### 3. **Multi-Role Support + Protection**
- ✅ 3 dashboards distincts protégés par rôle
- ✅ ProtectedRoute avec vérification JWT + rôle
- ✅ Redirect auto 401 via intercepteur axios

#### 4. **Intégration API Complète**
- ✅ Client axios centralisé (`src/services/api.ts`)
- ✅ Intercepteur JWT automatique
- ✅ 7 services couvrant toutes les ressources backend
- ✅ 10 hooks de fetch avec loading/error/refetch

#### 5. **Forms Modernisés**
- ✅ Login/Signup migrés vers RHF + zod
- ✅ Password strength validation
- ✅ Toast notifications (Sonner) avec messages d'erreur API

#### 6. **Responsive Design**
- ✅ Mobile-first approach
- ✅ Breakpoints cohérents
- ✅ Flex/Grid layouts adaptatifs

### 🔴 Problèmes Restants

#### 1. **Divergence API notifications** — ✅ RÉSOLUE
- ✅ `markAsRead` appelle désormais `PATCH /notifications/:id/lire`
- ✅ `getMine` appelle désormais `GET /notifications/mine`
- ✅ Frontend et backend alignés (vérifié dans `src/services/api.ts`)

**Statut :** Corrigée — Phase 1.

#### 2. **Mock data résiduelle** — ✅ RÉSOLUE
- ✅ `mockData.ts` supprimé, remplacé par `staticData.ts` (référentiels UI)
- ✅ `Compare.tsx` migré vers `localStorage` + `programmeService.getById`
- ✅ `InstitutionProfile.tsx` migré vers `GET /api/instituts/:id` (`useInstitut`)

**Statut :** Corrigée — Phase 1.

#### 3. **MultiStepDialog non intégré** — ✅ RÉSOLUE
- ✅ Dialog de candidature connecté à `candidatureService.create()`
- ✅ Upload Multer fonctionnel via `FormData`
- ⚠️ Toujours basé sur `useState` (migration RHF non priorisée)

**Statut :** Fonctionnel. Migration RHF reportée hors scope MVP.

#### 4. **Performance**
- ⚠️ Pas de caching (re-fetch à chaque navigation)
- ⚠️ Pas de lazy loading images
- ⚠️ Bundle ~200KB+ gzipped

**Sévérité:** MOYENNE

#### 5. **Testing Absent**
- ❌ Pas de tests unitaires
- ❌ Pas de tests d'intégration

**Sévérité:** MOYENNE

---

## État actuel — résumé factuel

### ✅ Implémenté
- Client axios centralisé (`src/services/api.ts`) avec intercepteurs JWT (request) et redirection 401/403 (response).
- 7 services API (`authService`, `programmeService`, `institutService`, `candidatureService`, `favoriService`, `notificationService`, `utilisateurService`).
- 10 hooks de fetch (`src/hooks/`) avec `loading` / `error` / `refetch` et annulation par flag `cancelled`.
- 5 routes dashboard protégées par `ProtectedRoute` + rôle (candidat / institut / admin).
- 16 routes nommées + wildcard 404 dans `src/app/routes.tsx`.
- AuthContext (`user`, `token`, `isAuthenticated`, `loading`, `login`, `logout`, `register`, `updateUser`) — JWT persisté en `localStorage` (`auth_token`, `auth_user`).
- Formulaires Login / Signup / FirstLogin migrés vers `react-hook-form` + `zod`.
- Reset password : page `/reset-password`, dialog « Forgot password? » dans `Login.tsx`, 3 endpoints back `/api/auth/mot-de-passe/{oublie,valider-token,reinitialiser}`.
- MultiStepDialog candidature → `candidatureService.create()` + upload Multer via `FormData`.
- Notifications Navbar : badge `unreadCount` + dropdown + `markAsRead`.
- `mockData.ts` supprimé — données statiques déplacées dans `staticData.ts` (référentiels UI uniquement).

### ✅ Pagination (complète)
- **Backend** : renvoie `pagination: { total, page, limit, totalPages }` sur `/programmes`, `/instituts`, `/candidatures` (admin).
- **Hooks** : `usePrograms`, `useInstituts`, `useAllCandidatures` acceptent `page` / `limit` via leurs filtres (extends `PaginationFilters`) et exposent `{ data, pagination, loading, error, refetch }`. Limite par défaut 100 quand le caller n'en passe pas (rétrocompatibilité avec les consommateurs qui veulent "tout d'un coup").
- **UI** : composant `Pagination` réutilisable (`src/app/components/Pagination.tsx`) — Précédent/Suivant + numéros (ellipses si > 7 pages) + compteur `"X résultats — page Y/Z"`. Branché sur `SearchResults` (programmes), `Institutions`, admin `CandidaturesSection`.
- **Page state** : `useState(1)` local à chaque page, reset automatique à 1 quand les filtres "métier" changent ; garde-fou si `page > totalPages` après refetch.

### ⚠️ Partiel
- **MultiStepDialog** : fonctionnel via `useState`, pas migré vers `react-hook-form`.
- **Memoization** : `useMemo()` dans certains hooks de fetch ; pas de `React.memo()` sur les composants de listing.
- **Mapping slug → id** pour `/institution/:slug` : à clarifier dans le code (le backend attend l'UUID).

### ❌ Non implémenté
- Refresh token (le JWT expire après 7j, déconnexion forcée à expiration).
- Tests unitaires / d'intégration (pas de RTL, pas de Jest, pas de Playwright).
- Code splitting manuel (`React.lazy()`) — Vite fait du splitting auto par chunk.
- Optimisation images (pas de `loading="lazy"`, pas de `srcSet`, pas de WebP/AVIF).
- Caching côté client (pas de TanStack Query, pas de Zustand) — re-fetch à chaque navigation.
- i18n (UI strings en anglais, code en français — stratégie i18n non décidée).

### Points de contact clés
- **Entry point** : `src/main.tsx` → `src/app/App.tsx`
- **Auth** : `src/context/AuthContext.tsx` + `src/components/ProtectedRoute.tsx`
- **API** : `src/services/api.ts` + `src/types/api.ts`
- **Hooks** : `src/hooks/` (un fichier par ressource)
- **Routing** : `src/app/routes.tsx`
- **Design system** : `src/styles/` (4 fichiers CSS : `tailwind.css`, `theme.css`, `edubridge.css`, `fonts.css`, importés depuis `index.css`)
