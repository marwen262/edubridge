# Projet : EduBridge

## Objectif
Plateforme de mise en relation entre candidats et écoles d'ingénieurs tunisiennes.
Trois rôles métier : `candidat` (étudiants cherchant une formation), `institut`
(écoles qui publient leurs programmes) et `admin`. Le frontend est connecté à
l'API backend via un client axios centralisé et un AuthContext JWT — la phase
d'intégration initiale est complète (auth, programmes, instituts, candidatures,
favoris, notifications, utilisateurs).

Le repo contient trois composants indépendants :
- `backend/` — API REST Node.js / Express / PostgreSQL (cœur métier)
- `frontend/` — SPA React / Vite (interface utilisateur)
- `diploma-verifier/` — microservice Python / FastAPI de vérification
  d'authenticité de diplômes (OCR + analyses spécialisées, stateless)

## Stack

### Backend (`backend/`)
- Node.js + **Express 4.19**
- **Sequelize 6.37** + **PostgreSQL** (via `pg` 8.12 / `pg-hstore`)
- Migrations : **sequelize-cli** 6.6 (dev)
- Auth : **JWT** (`jsonwebtoken` 9) + **bcryptjs** 2.4 (10 rounds)
- Upload fichiers : **Multer** 1.4 (disque local, 5 Mo max, jpeg/png/pdf)
- UUIDs : **uuid** 9 (v4 pour PK, polymorphe pour `Media`)
- Dev : **nodemon** 3.1

### Frontend (`frontend/`)
- **React 18.3.1** + **TypeScript**
- **Vite 6** (build + dev server)
- **Tailwind CSS v4** (via `@tailwindcss/vite`)
- **shadcn/ui** + **Radix UI** (composants dans `src/app/components/ui/`)
- **react-router 7** (`createBrowserRouter`)
- **axios 1.15** (client HTTP centralisé `src/services/api.ts`)
- **motion** (animations), **lucide-react** (icônes), **sonner** (toasts)
- **react-hook-form** 7 + **zod 4** + **@hookform/resolvers 5** (formulaires Login/Signup)
- **AuthContext** (`src/context/AuthContext.tsx`) — JWT + localStorage + intercepteurs
- **ProtectedRoute** (`src/components/ProtectedRoute.tsx`) — garde routes dashboard
- Scaffold d'origine : **Figma Make** (d'où le `name` `@figma/my-make-file`)

### Diploma Verifier (`diploma-verifier/`)
- **Python 3.11** + **FastAPI** (API async)
- **Tesseract OCR** + **spaCy** (modèles `fr_core_news_sm`, `xx_ent_wiki_sm`)
- **OpenCV** / **scikit-image** / **NumPy** (prétraitement + détection signatures/cachets)
- **PyMuPDF** + **python-magic** (analyse PDF / détection falsification)
- **langdetect** (détection langue)
- Conteneurisé (Dockerfile + docker-compose), exposé sur port 8000
- **Stateless** : aucune base de données, pas d'authentification

## Commandes utiles

### Backend (`cd backend`)
| Commande | Effet |
|---|---|
| `npm run dev` | Lance le serveur avec nodemon (hot reload) |
| `npm start` | Lance le serveur en prod (`node index.js`) |
| `npm run db:create` | Crée la base PostgreSQL |
| `npm run db:drop` | Supprime la base PostgreSQL |
| `npm run migrate` | Applique les migrations (`sequelize-cli db:migrate`) |
| `npm run migrate:undo` | Annule la dernière migration |
| `npm run migrate:undo:all` | Annule toutes les migrations |
| `npm run migrate:status` | Liste les migrations et leur état (`up` / `down`) |
| `npm run seed` | Applique tous les seeders CLI |
| `npm run seed:undo:all` | Annule tous les seeders CLI |
| `npm run db:reset-schema` | ⚠️ DROP CASCADE du schéma `public` puis recréation (dev uniquement) |
| `npm run db:reset` | `db:reset-schema` + `migrate` en une commande |

Le serveur démarre sur `PORT` (défaut `5000`). Requiert un `.env` avec
`DB_NAME`, `DB_USER`, `DB_PASS`, `DB_HOST`, `DB_PORT`, `JWT_SECRET`,
`JWT_EXPIRES` (défaut `7d`).

### Frontend (`cd frontend`)
| Commande | Effet |
|---|---|
| `npm run dev` | Serveur de dev Vite |
| `npm run build` | Build de production dans `dist/` |
| `npm run preview` | Prévisualise le build |

### Diploma Verifier (`cd diploma-verifier`)
| Commande | Effet |
|---|---|
| `docker compose up --build` | Build + démarrage du service sur `:8000` |
| `docker compose down` | Arrêt du service |

Endpoints principaux (voir `diploma-verifier/microservices.md`) :
- `POST /api/verify` — analyse d'un document (PDF/image)
- `GET /api/health` — ping de santé
- `GET /api/info` — infos service
- `GET /api/supported-countries` — pays supportés

## Structure

```
edubridge/
├── backend/
│   ├── .sequelizerc              # Chemins config/models/migrations/seeders pour sequelize-cli
│   ├── backend.md                # Documentation architecturale détaillée
│   ├── config/
│   │   ├── database.js           # Connexion Sequelize (runtime app)
│   │   └── config.js             # Config utilisée par sequelize-cli (lit le même .env)
│   ├── controllers/              # Couche HTTP mince (1 fichier / ressource)
│   │   ├── authController.js
│   │   ├── utilisateurController.js
│   │   ├── candidatureController.js  # Délègue au workflow
│   │   ├── programmeController.js
│   │   ├── institutController.js
│   │   ├── favoriController.js
│   │   └── notificationController.js
│   ├── docs/
│   │   └── WORKFLOW_CANDIDATURE.md   # Guide de test du workflow (exemples curl)
│   ├── middleware/
│   │   ├── authMiddleware.js     # Vérif JWT + résolution profil (candidat_id, institut_id)
│   │   ├── candidatureGuards.js  # Garde-fous : statut terminal + propriété dossier
│   │   └── upload.js             # Config Multer (5 Mo, jpeg/png/pdf)
│   ├── migrations/               # Migrations Sequelize CLI
│   │   ├── 20260420120000-creation-tables-edubridge.js
│   │   └── 20260421000000-add-identite-candidat.js
│   ├── models/                   # 8 modèles Sequelize MVP (schéma FR)
│   │   ├── index.js              # Charge tous les modèles + associations
│   │   ├── Utilisateur.js        # Compte auth (candidat|institut|admin)
│   │   ├── Candidat.js           # Profil étudiant (1:1 Utilisateur)
│   │   ├── Institut.js           # Profil école (1:1 Utilisateur)
│   │   ├── Programme.js          # Formation (1:N Institut)
│   │   ├── Candidature.js        # Dossier (N:N candidat ↔ programme)
│   │   ├── Notification.js
│   │   ├── Media.js              # Fichier uploadé (polymorphique)
│   │   └── Favori.js             # Junction candidat ↔ programme
│   ├── routes/                   # Mount sous /api/<resource>
│   ├── scripts/
│   │   ├── reset-schema.js       # DROP SCHEMA public CASCADE + CREATE (destructif)
│   │   └── test-api.js           # Script de test API
│   ├── seeders/                  # Seeders CLI pour données initiales
│   │   ├── 20260001000000-admin.js
│   │   ├── 20260002000000-instituts.js
│   │   ├── 20260003000000-programmes.js
│   │   ├── 20260004000000-candidats.js
│   │   ├── 20260005000000-candidatures.js
│   │   ├── 20260006000000-favoris.js
│   │   └── 20260007000000-notifications.js
│   ├── services/                 # Logique métier (découplée des controllers)
│   │   ├── candidatureWorkflow.js    # Moteur de workflow : transitions, validations, horodatage
│   │   └── notificationService.js    # Notifications automatiques (table + console)
│   ├── uploads/                  # Fichiers uploadés (servi sur /uploads)
│   └── index.js                  # Point d'entrée Express
│
├── frontend/
│   ├── frontend.md               # Documentation architecturale détaillée
│   ├── .env.local                # VITE_API_URL=http://localhost:5000/api
│   ├── index.html
│   ├── vite.config.ts            # Alias @ → src/
│   ├── src/
│   │   ├── main.tsx              # Bootstrap React + import global CSS
│   │   ├── config.ts             # Constante VITE_API_URL
│   │   ├── services/
│   │   │   └── api.ts            # Client axios + 7 services (auth, programmes, instituts…)
│   │   ├── types/
│   │   │   ├── api.ts            # Types TS entités backend (RegisterData, filtres…)
│   │   │   └── auth.ts           # User, AuthContextType
│   │   ├── context/
│   │   │   └── AuthContext.tsx   # AuthProvider + useAuth (JWT, localStorage)
│   │   ├── components/
│   │   │   └── ProtectedRoute.tsx # Redirection si non auth ou mauvais rôle
│   │   ├── hooks/                 # Hooks de fetch (loading/error/refetch)
│   │   │   ├── usePrograms.ts
│   │   │   ├── useProgramDetail.ts
│   │   │   ├── useInstituts.ts
│   │   │   ├── useInstitut.ts
│   │   │   ├── useCandidatures.ts
│   │   │   ├── useFavoris.ts
│   │   │   ├── useNotifications.ts
│   │   │   └── useUtilisateurs.ts
│   │   ├── app/
│   │   │   ├── App.tsx           # AuthProvider > RouterProvider > Toaster
│   │   │   ├── routes.tsx        # 12 routes (3 dashboards protégés par ProtectedRoute)
│   │   │   ├── pages/            # Pages de haut niveau (1 fichier / route)
│   │   │   ├── components/       # Composants applicatifs (Navbar, MultiStepDialog, …)
│   │   │   │   ├── ui/           # Composants shadcn/ui (NE PAS ÉDITER)
│   │   │   │   └── figma/        # Helpers Figma Make (NE PAS ÉDITER)
│   │   │   └── data/mockData.ts  # Données mock résiduelles (Compare, InstitutionProfile)
│   │   └── styles/
│   │       ├── index.css         # Point d'entrée (importe les 4 autres)
│   │       ├── tailwind.css
│   │       ├── theme.css
│   │       ├── fonts.css
│   │       └── edubridge.css     # Design system custom (var --edu-*)
│   └── package.json
│
└── diploma-verifier/
    ├── Dockerfile
    ├── docker-compose.yml        # Service exposé sur :8000
    ├── requirements.txt
    ├── microservices.md          # Documentation architecturale détaillée
    ├── README.md
    ├── app/                      # Code FastAPI (routes, services, config)
    │   ├── api/routes/           # /api/verify, /api/health, …
    │   ├── services/             # OCR, signature, stamp, tampering, scoring…
    │   ├── utils/logger.py
    │   └── config.py             # Poids scoring, mots-clés, langues OCR
    ├── sample_docs/              # Exemples (volume monté)
    ├── logs/                     # Logs (volume monté)
    └── tests/
```

## API Backend

Routes montées dans `backend/index.js`, toutes préfixées `/api/` :

| Préfixe | Fichier | Description |
|---|---|---|
| `/api/auth` | `authRoutes.js` | `register`, `login`, `me` |
| `/api/utilisateurs` | `utilisateurRoutes.js` | Comptes + profils (Candidat/Institut) |
| `/api/instituts` | `institutRoutes.js` | Écoles d'ingénieurs |
| `/api/programmes` | `programmeRoutes.js` | Formations |
| `/api/candidatures` | `candidatureRoutes.js` | Workflow candidatures (cœur métier) |
| `/api/favoris` | `favoriRoutes.js` | Favoris candidat |
| `/api/notifications` | `notificationRoutes.js` | Notifications (mine, count, lire, lire-tout) |
| `/api/health` | (inline) | Ping de santé |

**Workflow candidature** (`services/candidatureWorkflow.js`) — machine à états :

```
brouillon → soumise → en_examen → { acceptee | refusee | liste_attente }
                                      (acceptee/refusee sont terminaux)
```

Transitions autorisées selon le rôle, validation complétude des documents
obligatoires avant soumission, anti-doublon (un candidat ne peut candidater
qu'une fois à un même programme), transactions Sequelize ACID, notifications
automatiques (candidat + institut) à chaque événement.

## Conventions

### Général
- **Identifiants de code backend** (variables, fonctions, classes, fichiers,
  tables, routes) : **français** — cohérence avec le domaine métier
  (`utilisateur`, `candidat`, `institut`, `programme`, `candidature`, `favori`).
- **Identifiants de code frontend** : **anglais** (habitude React/TS)
- **Commentaires, messages de commit, documentation** : **français**
- **Strings UI utilisateur** : actuellement anglais côté front (cohérence à garder
  tant qu'une stratégie i18n n'est pas décidée)

### Backend
- Controllers : `exports.methodName = async (req, res) => { ... }` — couche
  HTTP mince, délègue la logique métier aux services.
- Retour d'erreur : `res.status(4xx).json({ message: '...' })` en français.
  Codes HTTP standards (400 validation, 401 auth, 403 autorisation, 404
  introuvable, 409 conflit/doublon, 500 serveur).
- Modèles Sequelize : **UUID v4 en PK**, `timestamps: true` avec
  `cree_le` / `mis_a_jour_le` (noms FR).
- Relations : DELETE CASCADE systématique (supprimer utilisateur → purge
  profil, candidatures, favoris). Voir `backend.md` §4.3 pour la matrice FK.
- Types remarquables : **JSONB** (adresse, contact, documents_requis,
  documents_soumis, parcours_academique), **ARRAY(STRING)** (langues,
  accreditations), **ENUM** pour les champs fermés (rôle, statut
  candidature, domaine programme, niveau, etc.).
- Associations centralisées dans `models/index.js`.
- Imports CommonJS (`require`), pas d'ESM.
- **Schéma BDD géré UNIQUEMENT par migrations** : ne JAMAIS appeler
  `sequelize.sync()` / `sync({ force: true })`. Tout changement de schéma
  passe par une nouvelle migration Sequelize CLI.
- **Seeders** : 7 fichiers CLI (`queryInterface.bulkInsert`) avec UUIDs v4
  hardcodés pour la reproductibilité ; tracés dans `SequelizeData` (config
  `seederStorage: 'sequelize'`). ⚠️ `bulkInsert` ne déclenche **pas** les
  hooks Sequelize — fournir des valeurs cohérentes directement (cf. champs
  identité `type_piece_identite` / `cin` / `numero_passeport`). Voir
  `backend/backend.md` §13.
- **Hooks Sequelize sur identité Candidat** : le hook `beforeValidate`
  ré-injecte ses champs mutés dans `options.fields` car Sequelize fige cette
  liste *avant* le hook (`save()` n'écrirait sinon que les champs envoyés
  par le contrôleur). Voir `backend/backend.md` §12.
- **Transactions ACID** obligatoires pour toute opération multi-tables
  (création compte + profil, workflow candidature, upload avec création
  Media).
- **Mots de passe** : bcrypt 10 rounds, jamais retournés en réponse
  (`attributes: { exclude: ['mot_de_passe', 'jeton_rafraichissement'] }`).
- **Uploads Multer** : stockage disque (`./uploads/`), noms uniques
  (timestamp + random), filtre MIME (jpeg/jpg/png/pdf), limite 5 Mo.
  Référencés dans `Candidature.documents_soumis` (JSONB) via `media_id`.

### Frontend
- Import alias `@/` pour `src/` (ex: `import { Button } from '@/app/components/ui/button'`)
- Pages : export nommé (`export function Home()`) — utilisé dans `routes.tsx`
- Composants UI : utiliser `cn()` de `@/app/components/ui/utils.ts` pour fusionner classes Tailwind
- Styles : préférer les vars CSS `--edu-*` (design system Apple-inspired :
  `--edu-blue`, `--edu-success`, `--edu-danger`, `--edu-text-primary`…)
  plutôt que des couleurs en dur.
- Forms : `react-hook-form` + `zod` pour les nouveaux formulaires ; migrer
  progressivement les formulaires `useState` existants (MultiStepDialog en attente).
- Toasts : `sonner`
- Dark mode : toggle via `Navbar`, persisté en `localStorage`, classe `.dark`
  sur `<html>`.
- **Auth** : `useAuth()` depuis `@/context/AuthContext` pour accéder à
  `user`, `token`, `login`, `logout`, `register`, `updateUser`.
- **Routes protégées** : utiliser `<ProtectedRoute requiredRole="...">` dans
  `routes.tsx` — la redirection et la vérification de rôle sont gérées
  automatiquement.
- **Appels API** : toujours passer par les services de `@/services/api.ts` ou
  les hooks `@/hooks/` — ne jamais faire d'appels axios directs dans les pages.
- **Variables d'env** : `VITE_API_URL` dans `.env.local` (jamais `.env`
  versionné pour les secrets).

### Diploma Verifier
- Code Python en anglais (convention Python standard).
- Configuration centralisée dans `app/config.py` (poids scoring, mots-clés
  multilingues, langues OCR, types de diplômes).
- Services Python modulaires mais **mêmes processus** (monolithe modulaire) —
  appels de fonctions directs, pas de communication inter-services réseau.
- **Stateless** : aucune persistance, fichiers temporaires nettoyés après
  analyse.
- Logs via logger Python standard (`app/utils/logger.py`) : console + fichiers
  dans `./logs/`.

## À ne pas toucher

| Chemin | Raison |
|---|---|
| `**/node_modules/` | Dépendances installées |
| `**/package-lock.json` | Géré par npm |
| `backend/.env` | Secrets (non versionné) |
| `frontend/.env.local` | Config locale (non versionné) |
| `backend/uploads/` | Contenu uploadé par les utilisateurs |
| `frontend/dist/` | Build généré |
| `frontend/src/app/components/ui/` | Composants shadcn — régénérables, ne pas éditer manuellement |
| `frontend/src/app/components/figma/` | Artefacts Figma Make |
| `frontend/ATTRIBUTIONS.md` | Mentions de licence shadcn/Unsplash |
| `diploma-verifier/logs/` | Logs runtime (volume Docker) |
| `diploma-verifier/sample_docs/` | Exemples de documents (volume Docker) |

Également : `vite.config.ts` contient un commentaire explicite indiquant de ne
pas retirer les plugins React/Tailwind et de ne pas ajouter `.ts/.tsx/.css` à
`assetsInclude`.

## Workflow attendu

- Toujours proposer un plan avant un changement non trivial (nouvelle feature,
  refactor, branchement front/back, modification de schéma BDD).
- **Setup BDD depuis zéro** (dev) :
  1. `npm run db:create` (si la base n'existe pas)
  2. `npm run db:reset` (drop schéma + recrée + applique les 2 migrations)
  3. `npm run seed` (applique les 7 seeders : 1 admin, 3 instituts,
     11 programmes, 3 candidats, 6 candidatures, 5 favoris, 6 notifs).
     Mot de passe commun : `Password123!`
- Pour toute modification backend : vérifier que `npm run dev` démarre sans
  erreur et que `/api/health` répond `{ status: 'ok' }`.
- Pour toute modification frontend : vérifier que `npm run build` passe
  (pas de suite de tests pour l'instant).
- Pour toute modification du diploma-verifier : vérifier que
  `docker compose up --build` démarre sans erreur et que `/api/health`
  répond. Tests Python dans `diploma-verifier/tests/`.
- **Documentations détaillées** par composant (à lire avant gros changements) :
  - `backend/backend.md` — architecture, modèles, API, workflow, sécurité
  - `frontend/frontend.md` — pages, composants, design system, intégration API
  - `diploma-verifier/microservices.md` — pipeline d'analyse, services, déploiement
- **Intégration API frontend — Phase 1 complète (mai 2026)** :
  - [x] Client HTTP centralisé (`src/services/api.ts`)
  - [x] AuthContext + JWT (login / register / logout)
  - [x] ProtectedRoute par rôle
  - [x] Hooks métier (usePrograms, useCandidatures, useFavoris,
        useNotifications, useInstituts, useUtilisateurs)
  - [x] Formulaires RHF + Zod (Login, Signup, FirstLogin)
  - [x] SearchResults → GET /api/programmes
  - [x] ProgramDetail → GET /api/programmes/:id
  - [x] InstitutionProfile → GET /api/instituts/:id
  - [x] CandidatDashboard → candidatures, favoris, notifications
  - [x] InstitutionDashboard → pipeline kanban, transitions statut
  - [x] AdminDashboard → utilisateurs, candidatures, création instituts
  - [x] Compare → localStorage + programmeService.getById
  - [x] Favoris synchronisés (useFavoriStatus transversal)
  - [x] MultiStepDialog → POST /api/candidatures + upload Multer
  - [x] Notifications Navbar → badge + dropdown temps réel
  - [x] mockData.ts supprimé (staticData.ts pour données statiques)
- **Améliorations futures (hors scope MVP)** :
  - Pagination sur SearchResults (infinite scroll ou pages)
  - Refresh token (actuellement expire après 7j sans reconnexion)
  - Tests unitaires (RTL + Jest)
  - Optimisation images (lazy loading, WebP)
  - i18n (stratégie à décider)
  - Scan antivirus fichiers uploadés
  - Rate limiting frontend
- Commits descriptifs en **français**, format court style :
  `feat(auth): ajouter endpoint /me` ou `fix(front): corriger navigation sidebar`.
