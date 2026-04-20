# EduBridge Frontend Architecture Documentation

**Version:** 0.0.1  
**Framework:** React 18.3.1 + Vite 6.4.2  
**Date:** April 2026

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
App.tsx (RouterProvider)
    ↓
routes.tsx (11 pages principales)
    ↓
Pages + Composants
    ↓
Design System (Radix UI + Tailwind)
    ↓
Mock Data (mockData.ts) [pas d'API backend actuellement]
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
├── app/
│   ├── App.tsx                       # Root component (RouterProvider)
│   ├── routes.tsx                    # Configuration React Router
│   ├── pages/                        # Pages de niveau routing
│   │   ├── Home.tsx                  # Landing page
│   │   ├── SearchResults.tsx         # Recherche & filtrage
│   │   ├── ProgramDetail.tsx         # Détail d'un programme
│   │   ├── InstitutionProfile.tsx    # Profil d'institution
│   │   ├── Compare.tsx               # Comparaison de programmes
│   │   ├── Login.tsx                 # Page de login (3 rôles)
│   │   ├── Signup.tsx                # Page d'inscription
│   │   ├── FirstLogin.tsx            # First login / password reset
│   │   ├── CandidateDashboard.tsx    # Dashboard candidat
│   │   ├── InstitutionDashboard.tsx  # Dashboard institution
│   │   └── AdminDashboard.tsx        # Dashboard admin
│   ├── components/                   # Composants réutilisables
│   │   ├── Navbar.tsx                # Barre de navigation sticky
│   │   ├── Footer.tsx                # Footer global
│   │   ├── DashboardSidebar.tsx      # Sidebar des dashboards
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
│   │   └── ui/                       # Design system (Radix UI)
│   │       ├── accordion.tsx
│   │       ├── alert-dialog.tsx
│   │       ├── badge.tsx
│   │       ├── button.tsx
│   │       ├── dialog.tsx
│   │       ├── input.tsx
│   │       ├── label.tsx
│   │       ├── select.tsx
│   │       ├── tabs.tsx
│   │       ├── textarea.tsx
│   │       ├── [15+ autres composants UI]
│   │       └── utils.ts              # Utilités (cn, clsx)
│   └── data/
│       └── mockData.ts               # Données mock (programs, institutions)
└── styles/
    ├── index.css                     # Entry point styles
    ├── tailwind.css                  # Tailwind directives
    ├── theme.css                     # Tokens CSS Radix UI
    ├── edubridge.css                 # Design system custom (Apple-inspired)
    └── fonts.css                     # Imports de fonts

Configuration:
├── vite.config.ts                    # Config Vite + plugins (React, Tailwind)
├── tsconfig.json                     # Config TypeScript
├── package.json                      # Dépendances + scripts
├── postcss.config.mjs                # Config PostCSS (Tailwind)
└── tailwind.config.mjs               # Config Tailwind CSS
```

### Rôle de Chaque Dossier

| Dossier | Responsabilité |
|---------|-----------------|
| `pages/` | Pages complètes du routing (11 routes) |
| `components/` | Composants réutilisables (business logic + présentation) |
| `components/ui/` | Design system primitif (Radix UI wrappé) |
| `data/` | Mock data, interfaces TypeScript |
| `styles/` | CSS global, tokens de design, thème |

---

## Pages & Routing

### Configuration React Router

**Route:** `/` → `Home`
```tsx
export const router = createBrowserRouter([
  { path: '/', Component: Home },
  { path: '/search', Component: SearchResults },
  { path: '/program/:id', Component: ProgramDetail },
  { path: '/institution/:slug', Component: InstitutionProfile },
  { path: '/compare', Component: Compare },
  { path: '/login', Component: Login },
  { path: '/signup', Component: Signup },
  { path: '/first-login', Component: FirstLogin },
  { path: '/dashboard/candidate', Component: CandidateDashboard },
  { path: '/dashboard/institution', Component: InstitutionDashboard },
  { path: '/dashboard/admin', Component: AdminDashboard },
  { path: '*', Component: 404Page }, // Fallback
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
- 3 tabs: Candidate / Institution / Admin
- Form: email + password
- Validation locale
- Mock authentication (redirects)
- Google Sign-In placeholder

#### 7. **Signup** (`/signup`)
- Form pour candidats
- Password strength indicator
- Validation: 8+ chars, uppercase, number, special char
- Terms acceptance
- Field selection: pays, niveau études, domaine

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
**React Hooks (useState) + localStorage** - Pas de Context API, Redux, ou Zustand détecté.

### Patterns Identifiés

#### 1. **useState Local**
```tsx
// CandidateDashboard.tsx
const [searchQuery, setSearchQuery] = useState('');
const [selectedFields, setSelectedFields] = useState<string[]>([]);

// ProgramCard.tsx
const [saved, setSaved] = useState(false);

// Navbar.tsx - Dark mode
const [darkMode, setDarkMode] = useState(false);
```

#### 2. **localStorage Persistence**
```tsx
// Navbar.tsx - Dark mode toggle
React.useEffect(() => {
  const isDark = localStorage.getItem('darkMode') === 'true';
  setDarkMode(isDark);
  if (isDark) {
    document.documentElement.classList.add('dark');
  }
}, []);

const toggleDarkMode = () => {
  const newMode = !darkMode;
  localStorage.setItem('darkMode', String(newMode));
};
```

#### 3. **useParams & useNavigate (React Router)**
```tsx
// ProgramDetail.tsx
const { id } = useParams();
const navigate = useNavigate();
```

#### 4. **useLocation (Route awareness)**
```tsx
// DashboardSidebar.tsx
const location = useLocation();
```

### Limitations Actuelles
⚠️ **Pas de state management pour:**
- Données utilisateur (user session)
- Authentication tokens
- Données persistantes
- État global partagé entre pages
- Gestion d'erreurs centralisée

### Recommandation
État local simple suffisant pour MVP, mais envisager Context API ou Zustand pour scalabilité.

---

## Communication Backend

### Statut Actuel
**🚨 Aucun appel API détecté** - Application utilise mock data statique.

### Mock Data Structure
```tsx
// mockData.ts
export interface Program {
  id: string;
  title: string;
  institution: { id, name, logo, country, city };
  level: 'Bachelor' | 'Master' | 'PhD' | 'Certificate';
  duration: string;
  language: string;
  mode: 'On-campus' | 'Online' | 'Hybrid';
  tuition: number;
  deadline: string;
  description: string;
  requirements: string[];
  rating: number;
  field: string;
  cover: string;
  startDate: string;
  curriculum: { module, description }[];
}

export interface Institution { ... }
export interface Application { ... }

export const mockPrograms: Program[] = [
  { id: '1', title: 'MSc Computer Science', institution: {...}, ... },
  // ... 20+ programmes mockées
];
```

### Intégrations à Implémenter
1. **Authentication API**
   - POST /auth/login
   - POST /auth/signup
   - POST /auth/refresh-token

2. **Programs API**
   - GET /programs (avec filtres)
   - GET /programs/:id
   - POST /programs/:id/apply

3. **Institutions API**
   - GET /institutions
   - GET /institutions/:slug
   - PUT /institutions/:id (admin)

4. **Applications API**
   - GET /applications
   - POST /applications
   - PATCH /applications/:id/status

### Stratégie Recommandée
- Utiliser `fetch` ou `axios` pour API calls
- Créer `/services/api.ts` centralisé
- Implémenter error handling avec toast notifications (Sonner)
- Gérer tokens dans localStorage/sessionStorage

---

## Gestion des Formulaires

### Librairie Utilisée
**React Hook Form 7.55.0** - Intégration détectée dans imports

### Cas d'Usage Actuels

#### 1. **Login Form** (`pages/Login.tsx`)
```tsx
// Form logique (non RHF)
const [email, setEmail] = useState('');
const [password, setPassword] = useState('');

const handleLogin = (e: React.FormEvent) => {
  e.preventDefault();
  if (!email || !password) {
    toast.error('Please fill in all fields');
    return;
  }
  // Mock validation & redirect
};
```

#### 2. **Signup Form** (`pages/Signup.tsx`)
```tsx
const [formData, setFormData] = useState({
  fullName: '',
  email: '',
  password: '',
  confirmPassword: '',
  country: '',
  educationLevel: '',
  fieldOfInterest: '',
});

// Validation password strength
const passwordChecks = [
  { label: 'At least 8 characters', met: formData.password.length >= 8 },
  { label: 'Uppercase letter', met: /[A-Z]/.test(formData.password) },
  { label: 'Number', met: /[0-9]/.test(formData.password) },
  { label: 'Special character', met: /[!@#$%^&*]/.test(formData.password) },
];
```

#### 3. **MultiStep Dialog** (`components/MultiStepDialog.tsx`)
```tsx
const [currentStep, setCurrentStep] = useState(0);
const [formData, setFormData] = useState({
  fullName: '',
  dateOfBirth: '',
  nationality: '',
  // ... 12+ fields
});

const updateFormData = (field: string, value: string) => {
  setFormData((prev) => ({ ...prev, [field]: value }));
};
```

### Validation
```tsx
// Pattern: Validation inline avant soumission
if (!email || !password) {
  toast.error('Please fill in all fields');
  return;
}

if (password !== confirmPassword) {
  toast.error('Passwords do not match');
  return;
}

if (passwordStrength < 3) {
  toast.error('Please choose a stronger password');
  return;
}
```

### Notifications
Utilise **Sonner** toast pour feedback utilisateur :
```tsx
toast.success('Account created successfully!');
toast.error('Please fill in all fields');
toast.info('Google Sign-In would be configured here');
```

### ⚠️ Observations
- RHF importé mais non utilisé activement (useState preferred)
- Validation basique regex et string length
- Pas de validation asynchrone
- Pas de yup/zod schema validation

### Recommandation
Migrer vers RHF + zod pour:
- Code moins verbeux
- Validation centralisée
- Error messages mieux gérées
- Performance form améliorée

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
**Mock authentication** - Pas d'intégration backend réelle

### Flow Actuel

#### 1. **Login Mock** (`pages/Login.tsx`)
```tsx
const handleLogin = (e: React.FormEvent) => {
  e.preventDefault();
  
  // Validation locale
  if (!email || !password) {
    toast.error('Please fill in all fields');
    return;
  }
  
  toast.success('Login successful!');
  
  // Role-based redirect
  if (role === 'candidate') {
    navigate('/dashboard/candidate');
  } else if (role === 'institution') {
    const isFirstLogin = password === 'temp123'; // Mock check
    if (isFirstLogin) {
      navigate('/first-login');
    } else {
      navigate('/dashboard/institution');
    }
  } else if (role === 'admin') {
    navigate('/dashboard/admin');
  }
};
```

#### 2. **Signup Mock** (`pages/Signup.tsx`)
```tsx
const handleSubmit = (e: React.FormEvent) => {
  e.preventDefault();
  // Validation...
  toast.success('Account created successfully!');
  navigate('/dashboard/candidate');
};
```

#### 3. **FirstLogin** (`pages/FirstLogin.tsx`)
```tsx
// Password reset flow for institutions
const handleSubmit = (e: React.FormEvent) => {
  e.preventDefault();
  // Validation...
  toast.success('Password updated successfully!');
  navigate('/dashboard/institution');
};
```

### Dark Mode Toggle
```tsx
// Navbar.tsx
const toggleDarkMode = () => {
  const newMode = !darkMode;
  setDarkMode(newMode);
  localStorage.setItem('darkMode', String(newMode));
  if (newMode) {
    document.documentElement.classList.add('dark');
  } else {
    document.documentElement.classList.remove('dark');
  }
};
```

### ⚠️ Absence de Protection
- ❌ Pas de Protected Routes
- ❌ Pas de token storage/validation
- ❌ Pas de session persistence
- ❌ Pas de logout endpoint
- ❌ Pas de refresh token logic

### À Implémenter
```tsx
// Example: ProtectedRoute wrapper
const ProtectedRoute = ({ role, children }) => {
  const token = localStorage.getItem('auth_token');
  const userRole = localStorage.getItem('user_role');
  
  if (!token || userRole !== role) {
    return <Navigate to="/login" />;
  }
  return children;
};

// Usage
<Route
  path="/dashboard/candidate"
  element={
    <ProtectedRoute role="candidate">
      <CandidateDashboard />
    </ProtectedRoute>
  }
/>
```

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
- ✅ TypeScript full (strict mode)
- ✅ Vite pour dev experience optimale (HMR)

#### 2. **Design System Cohérent**
- ✅ Radix UI + Tailwind bien intégrés
- ✅ Custom CSS variables (Apple-inspired aesthetics)
- ✅ Dark mode support natif
- ✅ Animations fluides (Motion)

#### 3. **Multi-Role Support**
- ✅ 3 dashboards distincts (Candidate/Institution/Admin)
- ✅ Role-based navigation (DashboardSidebar)
- ✅ Role-specific logic dans pages

#### 4. **Forms & UX Complète**
- ✅ Multi-step form avec progress (MultiStepDialog)
- ✅ Password strength validation
- ✅ Toast notifications (Sonner)
- ✅ Form feedback utilisateur

#### 5. **TypeScript Coverage**
- ✅ Types pour interfaces (Program, Institution, Application)
- ✅ Props typing complets
- ✅ Type safety sur routing (params)

#### 6. **Responsive Design**
- ✅ Mobile-first approach
- ✅ Breakpoints cohérents
- ✅ Flex/Grid layouts adaptatifs

### 🔴 Problèmes Détectés

#### 1. **Pas d'Intégration Backend**
- ❌ Mock data uniquement (pas d'API calls)
- ❌ Pas de gestion de tokens
- ❌ Pas de session persistence
- ❌ Pas d'error handling pour API

**Sévérité:** CRITIQUE

#### 2. **State Management Minimal**
- ❌ Pas de gestion état utilisateur
- ❌ Pas de authentication context
- ❌ Pas de caching données
- ❌ Props drilling possible à grande échelle

**Sévérité:** HAUTE

#### 3. **Protection Routes Absente**
- ❌ Pas de ProtectedRoute wrapper
- ❌ Anyone peut naviguer /dashboard/*
- ❌ Pas de role validation
- ❌ Pas de logout endpoint

**Sévérité:** CRITIQUE (sécurité)

#### 4. **Performance Issues**
- ❌ Pas de lazy loading images
- ❌ Pas d'infinite scroll SearchResults
- ❌ Bundle size important (~200KB+)
- ❌ Pas d'optimisation images responsive

**Sévérité:** MOYENNE

#### 5. **Validation & Error Handling**
- ❌ Validation regex simple (pas yup/zod)
- ❌ Pas d'async validation
- ❌ Pas d'error recovery strategy
- ❌ Pas de logging/monitoring

**Sévérité:** MOYENNE

#### 6. **Code Reusability**
- ❌ Pas de custom hooks (`hooks/` folder)
- ❌ Logique métier inline dans pages
- ❌ Duplication potentielle de code
- ❌ Pas de service layer

**Sévérité:** BASSE

#### 7. **Testing Absent**
- ❌ Pas de tests unitaires
- ❌ Pas de tests d'intégration
- ❌ Pas de coverage

**Sévérité:** MOYENNE

#### 8. **Accessibility**
- ⚠️ ARIA labels basiques
- ⚠️ Pas de keyboard navigation validation
- ⚠️ Pas de axe-core testing

**Sévérité:** BASSE

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
Architecture:   ✅ Moderne & Maintenable (React + Vite)
Design System:  ✅ Cohérent (Radix UI + Tailwind)
Composants:     ✅ Bien structurés
Backend Integration: ❌ Pas implémenté (mock data only)
State Management:   ⚠️ Minimal (useState + localStorage)
Authentication:     ❌ Mock only, pas sécurisé
Forms:              ⚠️ Basique, pas React Hook Form
Testing:            ❌ Absent
```

### Roadmap Recommandé
1. **Sprint 1:** Backend API + Authentication Context (CRITIQUE)
2. **Sprint 2:** Protected Routes + API Integration (CRITIQUE)
3. **Sprint 3:** React Hook Form + Validation (IMPORTANTE)
4. **Sprint 4:** Image Optimization + Performance (IMPORTANTE)
5. **Sprint 5:** Testing Suite + Monitoring (ENHANCEMENT)

### Points de Contact Clés
- **Entry Point:** `src/main.tsx` → `src/app/App.tsx`
- **Routing:** `src/app/routes.tsx`
- **Mock Data:** `src/app/data/mockData.ts`
- **Design System:** `src/styles/` (4 fichiers CSS)
- **Dashboards:** Role-specific en `src/app/pages/`

---

**Document généré:** April 20, 2026  
**Type:** Analyse d'architecture frontend (SPA React)  
**Scope:** EduBridge Platform - Système Multi-rôles
