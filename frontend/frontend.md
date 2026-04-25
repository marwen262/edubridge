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
13. [Suggestions d'Amélioration](#suggestions-damélioration)

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
routes.tsx (12 routes dont 3 protégées)
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
│   ├── useNotifications.ts           # useNotifications + unreadCount
│   └── useUtilisateurs.ts            # useUtilisateurs (admin)
├── app/
│   ├── App.tsx                       # AuthProvider > RouterProvider > Toaster
│   ├── routes.tsx                    # 12 routes (3 dashboards wrappés dans ProtectedRoute)
│   ├── pages/                        # Pages de niveau routing
│   │   ├── Home.tsx                  # Landing page
│   │   ├── SearchResults.tsx         # Recherche & filtrage
│   │   ├── ProgramDetail.tsx         # Détail d'un programme
│   │   ├── InstitutionProfile.tsx    # Profil d'institution
│   │   ├── Compare.tsx               # Comparaison de programmes
│   │   ├── Login.tsx                 # Login réel (useAuth + RHF + zod)
│   │   ├── Signup.tsx                # Inscription réelle (useAuth + RHF + zod)
│   │   ├── FirstLogin.tsx            # Réinitialisation mot de passe institution
│   │   ├── CandidateDashboard.tsx    # Dashboard candidat
│   │   ├── InstitutionDashboard.tsx  # Dashboard institution
│   │   └── AdminDashboard.tsx        # Dashboard admin
│   ├── components/                   # Composants réutilisables
│   │   ├── Navbar.tsx                # Barre de navigation sticky (useAuth pour état)
│   │   ├── Footer.tsx                # Footer global
│   │   ├── DashboardSidebar.tsx      # Sidebar dashboards (useAuth pour profil)
│   │   ├── ProgramCard.tsx           # Card programme (grid/list)
│   │   ├── InstitutionCard.tsx       # Card institution
│   │   ├── MultiStepDialog.tsx       # Dialog d'application multi-étapes
│   │   ├── Stepper.tsx               # Composant stepper
│   │   ├── StatCard.tsx              # Card de statistiques
│   │   ├── StatusBadge.tsx           # Badge de statut
│   │   ├── SkeletonCard.tsx          # Skeleton loading
│   │   ├── EmptyState.tsx            # État vide
│   │   ├── figma/
│   │   │   └── ImageWithFallback.tsx # Image avec fallback
│   │   └── ui/                       # Design system (Radix UI — NE PAS ÉDITER)
│   │       ├── [30+ composants shadcn/ui]
│   │       └── utils.ts              # Utilitaire cn()
│   └── data/
│       └── mockData.ts               # Données mock (conservées pour Compare/InstitutionProfile)
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
| `pages/` | Pages complètes du routing (12 routes) |
| `app/components/` | Composants réutilisables (business logic + présentation) |
| `app/components/ui/` | Design system primitif (Radix UI wrappé — NE PAS ÉDITER) |
| `app/data/` | Mock data résiduelle (comparaison, institution profile) |
| `styles/` | CSS global, tokens de design, thème |

---

## Pages & Routing

### Configuration React Router

```tsx
export const router = createBrowserRouter([
  { path: '/',                    Component: Home },
  { path: '/search',              Component: SearchResults },
  { path: '/program/:id',         Component: ProgramDetail },
  { path: '/institution/:slug',   Component: InstitutionProfile },
  { path: '/compare',             Component: Compare },
  { path: '/login',               Component: Login },
  { path: '/signup',              Component: Signup },
  { path: '/first-login',         Component: FirstLogin },
  // Dashboards protégés par rôle
  { path: '/dashboard/candidate',
    element: <ProtectedRoute requiredRole="candidat"><CandidateDashboard /></ProtectedRoute> },
  { path: '/dashboard/institution',
    element: <ProtectedRoute requiredRole="institut"><InstitutionDashboard /></ProtectedRoute> },
  { path: '/dashboard/admin',
    element: <ProtectedRoute requiredRole="admin"><AdminDashboard /></ProtectedRoute> },
  { path: '*', Component: Page404 },
]);
```

### Pages Principales

#### 1. **Home** (`/`)
- Landing page hero avec search bar
- Affiche programmes & institutions populaires
- Call-to-action vers /search
- Animations d'entrée (Motion)
- Dark mode support

#### 2. **SearchResults** (`/search`)
- Filtrage multi-critères (field, level, pays, tuition)
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
- Profil complet institution
- Cover image + logo
- Stats (programmes, students, acceptance rate)
- Programmes publiés par institution
- Localisation & contact

#### 5. **Compare** (`/compare`)
- Tableau comparatif (max 3 programmes)
- Critères side-by-side
- View Details link par programme
- Option d'ajouter programmes

#### 6. **Login** (`/login`)
- Form: email + password (react-hook-form + zod)
- Appelle `useAuth().login()` → POST `/api/auth/login`
- Redirection selon `user.role` (candidat/institut/admin)
- Gestion erreurs Axios (toast)

#### 7. **Signup** (`/signup`)
- Form pour candidats (react-hook-form + zod)
- Password strength indicator
- Appelle `useAuth().register()` → POST `/api/auth/register`
- Terms acceptance

#### 8. **FirstLogin** (`/first-login`)
- Réinitialisation password pour institutions
- Current (temporaire) + new password
- Password requirements checklist
- Validation avant soumission

#### 9. **CandidateDashboard** (`/dashboard/candidate`)
- Sidebar navigation
- Stats cards (applications, saved, decisions)
- Upcoming deadlines
- My applications table
- Recent messages
- Recommended programs

#### 10. **InstitutionDashboard** (`/dashboard/institution`)
- Sidebar navigation (role-based)
- Published programs stats
- Kanban pipeline (New → Under Review → Interview → Decision Sent)
- Programs table
- Line charts (recharts)

#### 11. **AdminDashboard** (`/dashboard/admin`)
- Vue globale (5 stat cards)
- Pending decisions relay table
- Users management table
- Charts: registrations, role distribution
- Institutional analytics

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
- `MultiStepDialog.tsx` - 5-step application form
  - Step 0: Personal Info
  - Step 1: Academic
  - Step 2: Documents
  - Step 3: Motivation
  - Step 4: Review
- `Stepper.tsx` - Stepper UI avec progress bar

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

**Observation:** Absence de custom hooks réutilisables (pas de `hooks/` folder) - logique métier inline dans les pages.

---

## State Management

### Méthode Utilisée
**React Context API (AuthContext) + useState local + localStorage**

### Patterns Identifiés

#### 1. **AuthContext (global)**
```tsx
// src/context/AuthContext.tsx
const { user, token, isAuthenticated, login, logout, register, updateUser } = useAuth();

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

### Services disponibles

| Service | Méthodes | Routes backend |
|---------|----------|----------------|
| `authService` | `login`, `register`, `me` | `/api/auth/*` |
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

### ⚠️ Divergence connue
`notificationService.markAsRead` appelle `PATCH /notifications/:id/lue` mais le backend attend `PATCH /notifications/:id/lire`. À corriger dans `src/services/api.ts`.

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
- Toujours basé sur `useState` (migration RHF non faite)

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
- ⚠️ Pas de memo() ou useMemo() détecté
- ⚠️ Pas de React.lazy() pour code splitting manuel

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

#### 1. **Divergence API notifications**
- ❌ `markAsRead` appelle `/notifications/:id/lue` (frontend) mais backend attend `/lire`
- ❌ `getMine` appelle `/notifications` sans suffixe alors que la route est `/notifications/mine`

**Sévérité:** HAUTE (fonctionnalité cassée)

#### 2. **Mock data résiduelle**
- ⚠️ `Compare.tsx` et `InstitutionProfile.tsx` utilisent encore `mockData.ts`
- ⚠️ Migration vers vraies données à compléter

**Sévérité:** MOYENNE

#### 3. **MultiStepDialog non intégré**
- ❌ Le dialog de candidature utilise encore `useState` (pas RHF)
- ❌ Pas connecté à `candidatureService.create()`

**Sévérité:** HAUTE

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

## Suggestions d'Amélioration

### 🚀 Court Terme (Priority 1 - Critique)

#### 1. **Implémentation Backend API**
```tsx
// src/services/api.ts
import axios from 'axios';

const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:3000/api';

export const api = axios.create({ baseURL: API_BASE });

// Interceptors pour tokens
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('auth_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Services
export const authService = {
  login: (email: string, password: string) =>
    api.post('/auth/login', { email, password }),
  signup: (data: SignupData) =>
    api.post('/auth/signup', data),
};

export const programService = {
  getAll: (filters?: FilterParams) =>
    api.get('/programs', { params: filters }),
  getById: (id: string) =>
    api.get(`/programs/${id}`),
  apply: (id: string, data: ApplicationData) =>
    api.post(`/programs/${id}/apply`, data),
};
```

#### 2. **Context API pour Authentication**
```tsx
// src/context/AuthContext.tsx
interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (email, password) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
}

export const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider: React.FC<{children}> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(
    localStorage.getItem('auth_token')
  );
  const [loading, setLoading] = useState(false);

  const login = async (email: string, password: string) => {
    setLoading(true);
    const { data } = await authService.login(email, password);
    setUser(data.user);
    setToken(data.token);
    localStorage.setItem('auth_token', data.token);
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('auth_token');
  };

  return (
    <AuthContext.Provider value={{
      user, token, loading, login, logout,
      isAuthenticated: !!token,
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be inside AuthProvider');
  return context;
};
```

#### 3. **Protected Routes**
```tsx
// src/components/ProtectedRoute.tsx
const ProtectedRoute: React.FC<{
  children: React.ReactNode;
  requiredRole?: 'candidate' | 'institution' | 'admin';
}> = ({ children, requiredRole }) => {
  const { isAuthenticated, user } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }

  if (requiredRole && user?.role !== requiredRole) {
    return <Navigate to="/" />;
  }

  return <>{children}</>;
};

// Usage dans routes.tsx
{
  path: '/dashboard/candidate',
  Component: () => (
    <ProtectedRoute requiredRole="candidate">
      <CandidateDashboard />
    </ProtectedRoute>
  ),
}
```

### 📈 Moyen Terme (Priority 2 - Important)

#### 4. **Migration vers React Hook Form + Zod**
```tsx
// pages/Signup.tsx
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';

const signupSchema = z.object({
  fullName: z.string().min(2, 'Name required'),
  email: z.string().email('Invalid email'),
  password: z.string()
    .min(8, '8+ characters required')
    .regex(/[A-Z]/, 'Uppercase required')
    .regex(/[0-9]/, 'Number required')
    .regex(/[!@#$%^&*]/, 'Special char required'),
  confirmPassword: z.string(),
  termsAccepted: z.boolean().refine(v => v, 'Accept terms'),
}).refine(d => d.password === d.confirmPassword, {
  message: 'Passwords must match',
  path: ['confirmPassword'],
});

type SignupFormData = z.infer<typeof signupSchema>;

export function Signup() {
  const { register, handleSubmit, formState: { errors } } = useForm<SignupFormData>({
    resolver: zodResolver(signupSchema),
  });

  const onSubmit = async (data: SignupFormData) => {
    try {
      await authService.signup(data);
      navigate('/dashboard/candidate');
    } catch (error) {
      toast.error(error.message);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <label>Full Name</label>
        <input {...register('fullName')} />
        {errors.fullName && <span>{errors.fullName.message}</span>}
      </div>
      {/* ... */}
    </form>
  );
}
```

#### 5. **Service Layer & Custom Hooks**
```tsx
// src/hooks/usePrograms.ts
export const usePrograms = (filters?: FilterParams) => {
  const [programs, setPrograms] = useState<Program[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPrograms = async () => {
      setLoading(true);
      try {
        const { data } = await programService.getAll(filters);
        setPrograms(data);
      } catch (err) {
        setError(err.message);
        toast.error('Failed to load programs');
      } finally {
        setLoading(false);
      }
    };

    fetchPrograms();
  }, [filters]);

  return { programs, loading, error };
};

// src/hooks/useApplication.ts
export const useApplication = (programId: string) => {
  const [loading, setLoading] = useState(false);

  const apply = async (data: ApplicationData) => {
    setLoading(true);
    try {
      await programService.apply(programId, data);
      toast.success('Application submitted!');
      return true;
    } catch (error) {
      toast.error(error.message);
      return false;
    } finally {
      setLoading(false);
    }
  };

  return { apply, loading };
};
```

#### 6. **Image Optimization**
```tsx
// src/components/OptimizedImage.tsx
interface OptimizedImageProps {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  className?: string;
}

export const OptimizedImage: React.FC<OptimizedImageProps> = ({
  src, alt, width = 400, height = 300, className = '',
}) => {
  const webpSrc = src.replace(/\.\w+$/, '.webp');

  return (
    <picture>
      <source srcSet={webpSrc} type="image/webp" />
      <img
        src={src}
        alt={alt}
        width={width}
        height={height}
        loading="lazy"
        decoding="async"
        className={className}
      />
    </picture>
  );
};
```

### 🎯 Long Terme (Priority 3 - Enhancement)

#### 7. **Data Caching & State Management (Zustand/TanStack Query)**
```tsx
// Option A: Zustand
import { create } from 'zustand';

interface ProgramStore {
  programs: Program[];
  filter: FilterParams;
  setPrograms: (programs: Program[]) => void;
  setFilter: (filter: FilterParams) => void;
}

export const useProgramStore = create<ProgramStore>((set) => ({
  programs: [],
  filter: {},
  setPrograms: (programs) => set({ programs }),
  setFilter: (filter) => set({ filter }),
}));

// Option B: TanStack Query (React Query)
const { data: programs, isLoading } = useQuery({
  queryKey: ['programs', filters],
  queryFn: () => programService.getAll(filters),
  staleTime: 5 * 60 * 1000, // 5 minutes
});
```

#### 8. **Testing Suite**
```tsx
// src/__tests__/pages/Login.test.tsx
import { render, screen, userEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router';
import { Login } from '@/app/pages/Login';

describe('Login Page', () => {
  it('should display login form', () => {
    render(
      <BrowserRouter>
        <Login />
      </BrowserRouter>
    );
    expect(screen.getByPlaceholderText(/email/i)).toBeInTheDocument();
  });

  it('should show error on missing fields', async () => {
    render(
      <BrowserRouter>
        <Login />
      </BrowserRouter>
    );
    const submitBtn = screen.getByRole('button', { name: /sign in/i });
    await userEvent.click(submitBtn);
    expect(screen.getByText(/please fill/i)).toBeInTheDocument();
  });
});
```

#### 9. **Monitoring & Analytics**
```tsx
// src/services/analytics.ts
import { useEffect } from 'react';
import { useLocation } from 'react-router';

export const usePageTracking = () => {
  const location = useLocation();

  useEffect(() => {
    // Google Analytics example
    if (window.gtag) {
      window.gtag('config', 'GA_MEASUREMENT_ID', {
        page_path: location.pathname,
      });
    }
  }, [location]);
};
```

#### 10. **Environment Configuration**
```tsx
// .env.example
VITE_API_URL=http://localhost:3000/api
VITE_APP_NAME=EduBridge
VITE_GOOGLE_CLIENT_ID=xxxxx

// src/config.ts
export const config = {
  apiUrl: import.meta.env.VITE_API_URL,
  appName: import.meta.env.VITE_APP_NAME,
  googleClientId: import.meta.env.VITE_GOOGLE_CLIENT_ID,
} as const;
```

---

## Summary & Recommendations

### État Actuel du Frontend
```
Architecture:        ✅ Moderne & Maintenable (React + Vite)
Design System:       ✅ Cohérent (Radix UI + Tailwind)
Composants:          ✅ Bien structurés
Backend Integration: ✅ Complet — 7 services + 11 hooks + FormData
State Management:    ✅ AuthContext + useState local
Authentication:      ✅ JWT réel, routes protégées par rôle
Forms:               ✅ Login/Signup migrés vers RHF + zod
MultiStepDialog:     ✅ Connecté à candidatureService + upload Multer
Notifications API:   ✅ Routes corrigées (/lire, /mine)
Mock data:           ✅ Supprimé (staticData.ts pour données statiques)
Favoris:             ✅ useFavoriStatus transversal (ProgramCard + ProgramDetail)
Notifications Navbar:✅ Badge unreadCount + dropdown + markAsRead
Testing:             ❌ Absent
```

### Prochaines étapes prioritaires
1. Pagination SearchResults (infinite scroll)
2. Refresh token automatique
3. Tests RTL + Jest
4. Optimisation images (lazy loading, WebP)

### Points de Contact Clés
- **Entry Point:** `src/main.tsx` → `src/app/App.tsx`
- **Auth:** `src/context/AuthContext.tsx` + `src/components/ProtectedRoute.tsx`
- **API:** `src/services/api.ts` + `src/types/api.ts`
- **Hooks:** `src/hooks/` (un fichier par ressource)
- **Routing:** `src/app/routes.tsx`
- **Design System:** `src/styles/` (4 fichiers CSS)

---

**Document mis à jour:** Avril 2026  
**Type:** Architecture frontend (SPA React) — Intégration API Phase 1 complète  
**Scope:** EduBridge Platform - Système Multi-rôles
