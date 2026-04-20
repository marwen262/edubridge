# Projet : EduBridge

## Objectif
Plateforme de mise en relation entre candidats et écoles d'ingénieurs tunisiennes.
Trois rôles métier : `candidate` (étudiants cherchant une formation), `institute`
(écoles qui publient leurs programmes) et `admin`. Le frontend consomme
actuellement des données simulées (`mockData.ts`) — l'intégration avec l'API
backend est la prochaine étape.

## Stack

### Backend (`backend/`)
- Node.js + **Express 4.19**
- **Sequelize 6.37** + **PostgreSQL** (via `pg` 8.12 / `pg-hstore`)
- Migrations : **sequelize-cli** 6.6 (dev)
- Auth : **JWT** (`jsonwebtoken` 9) + **bcryptjs** 2.4
- Upload fichiers : **Multer** 1.4
- HTTP client (seeders externes) : **axios** 1.x
- Dev : **nodemon** 3.1

### Frontend (`frontend/`)
- **React 18.3.1** + **TypeScript**
- **Vite 6** (build + dev server)
- **Tailwind CSS v4** (via `@tailwindcss/vite`)
- **shadcn/ui** + **Radix UI** (composants dans `src/app/components/ui/`)
- **react-router 7** (`createBrowserRouter`)
- **motion** (animations), **lucide-react** (icônes), **sonner** (toasts)
- Scaffold d'origine : **Figma Make** (d'où le `name` `@figma/my-make-file`)

## Commandes utiles

### Backend (`cd backend`)
| Commande | Effet |
|---|---|
| `npm run dev` | Lance le serveur avec nodemon (hot reload) |
| `npm start` | Lance le serveur en prod (`node index.js`) |
| `npm run migrate` | Applique les migrations (`sequelize-cli db:migrate`) |
| `npm run migrate:undo` | Annule la dernière migration |
| `npm run migrate:undo:all` | Annule toutes les migrations |
| `npm run migrate:status` | Liste les migrations et leur état (`up` / `down`) |
| `npm run seed` | Applique tous les seeders CLI (idempotent via `SequelizeData`) |
| `npm run seed:undo:all` | Annule tous les seeders CLI |
| `npm run seed:geo` | Peuple `Governorates` / `Cities` via APIs publiques (≈ 40 min) |
| `npm run db:reset-schema` | ⚠️ DROP CASCADE du schéma `public` puis recréation (dev uniquement) |
| `npm run db:reset` | `migrate:undo:all` + `migrate` + `seed` en une commande |

Le serveur démarre sur `PORT` (défaut `5000`). Requiert un `.env` avec
`DB_NAME`, `DB_USER`, `DB_PASS`, `DB_HOST`, `DB_PORT`, `JWT_SECRET`,
`JWT_EXPIRES`.

### Frontend (`cd frontend`)
| Commande | Effet |
|---|---|
| `npm run dev` | Serveur de dev Vite |
| `npm run build` | Build de production dans `dist/` |
| `npm run preview` | Prévisualise le build |

## Structure

```
edubridge/
├── backend/
│   ├── .sequelizerc              # Chemins config/models/migrations/seeders pour sequelize-cli
│   ├── config/
│   │   ├── database.js           # Connexion Sequelize (runtime app)
│   │   └── config.js             # Config utilisée par sequelize-cli (lit le même .env)
│   ├── controllers/              # Couche HTTP mince (1 fichier / ressource)
│   │   └── applicationController.js  # Endpoints candidatures (délègue au workflow)
│   ├── docs/
│   │   └── WORKFLOW_CANDIDATURE.md   # Guide de test du workflow (exemples curl)
│   ├── lib/
│   │   └── seed-fixtures.js      # Données partagées par les seeders (UUIDs déterministes)
│   ├── middleware/
│   │   ├── authMiddleware.js     # Vérif JWT + résolution profil (candidatId, institutId)
│   │   ├── candidatureGuards.js  # Garde-fous : statut terminal + propriété dossier
│   │   └── upload.js             # Config Multer
│   ├── migrations/               # 12 migrations (ordre FK respecté)
│   ├── models/                   # 38 modèles Sequelize (schéma FR complet)
│   │   └── index.js              # Charge tous les modèles + associations
│   ├── routes/                   # Mount sous /api/<resource>
│   ├── scripts/                  # Scripts utilitaires Node (hors CLI sequelize)
│   │   ├── reset-schema.js       # DROP SCHEMA public CASCADE + CREATE (destructif)
│   │   └── seed-geo-data.js      # Seed géographique via APIs externes (idempotent)
│   ├── seeders/                  # Seeders CLI tracés dans `SequelizeData`
│   ├── services/                 # Logique métier (découplée des controllers)
│   │   ├── candidatureWorkflow.js    # Moteur de workflow : transitions, validations, horodatage
│   │   ├── auditService.js           # Journalisation JournalAudit (actions admin)
│   │   └── notificationService.js    # Notifications automatiques (table + console)
│   ├── uploads/                  # Fichiers uploadés (servi sur /uploads)
│   └── index.js                  # Point d'entrée Express
│
└── frontend/
    ├── index.html
    ├── vite.config.ts            # Alias @ → src/
    ├── src/
    │   ├── main.tsx              # Bootstrap React + import global CSS
    │   ├── app/
    │   │   ├── App.tsx           # RouterProvider + Toaster
    │   │   ├── routes.tsx        # Définition des routes
    │   │   ├── pages/            # Pages de haut niveau (1 fichier / route)
    │   │   ├── components/       # Composants applicatifs (Navbar, ...)
    │   │   │   ├── ui/           # Composants shadcn/ui (NE PAS ÉDITER)
    │   │   │   └── figma/        # Helpers Figma Make (NE PAS ÉDITER)
    │   │   └── data/mockData.ts  # Données simulées (à remplacer par API)
    │   └── styles/
    │       ├── index.css         # Point d'entrée (importe les 4 autres)
    │       ├── tailwind.css
    │       ├── theme.css
    │       ├── fonts.css
    │       └── edubridge.css     # Design system custom (var --edu-*)
    └── package.json
```

## API Backend

Routes montées dans `backend/index.js`, toutes préfixées `/api/` :

| Préfixe | Fichier | Description |
|---|---|---|
| `/api/auth` | `authRoutes.js` | `register`, `login`, `me` |
| `/api/users` | `userRoutes.js` | Gestion profils |
| `/api/institutes` | `instituteRoutes.js` | Écoles |
| `/api/programs` | `programRoutes.js` | Formations |
| `/api/applications` | `applicationRoutes.js` | Candidatures |
| `/api/favorites` | `favoriteRoutes.js` | Favoris candidat |
| `/api/countries` | `countryRoutes.js` | Pays |
| `/api/historiques` | `historiqueRoutes.js` | Historiques d'actions |
| `/api/health` | (inline) | Ping de santé |

## Conventions

### Général
- **Identifiants de code** (variables, fonctions, classes, fichiers) : **anglais**
- **Commentaires, messages de commit, documentation** : **français**
- **Strings UI utilisateur** : actuellement anglais côté front (cohérence à garder
  tant qu'une stratégie i18n n'est pas décidée)

### Backend
- Controllers : `exports.methodName = async (req, res) => { ... }`
- Retour d'erreur : `res.status(4xx).json({ message: '...' })` en français
- Modèles Sequelize : UUID en PK, `timestamps: true`, `underscored: false`
  (exceptions : `Country`, `Governorate`, `City` utilisent un `INTEGER` auto-incrémenté)
- Associations centralisées dans `models/index.js`
- Imports CommonJS (`require`), pas d'ESM
- **Schéma BDD géré UNIQUEMENT par migrations** : ne JAMAIS appeler
  `sequelize.sync()` / `sync({ force: true })`. Tout changement de schéma
  passe par une nouvelle migration Sequelize CLI.
- **Seeders au format sequelize-cli** (`queryInterface.bulkInsert`) : tracés
  dans `SequelizeData` (config `seederStorage: 'sequelize'`) donc idempotents.
  UUIDs déterministes (`uuidv5`) via `lib/seed-fixtures.js` pour que les
  références croisées (User ↔ Institute ↔ Program ↔ Application) soient
  reproductibles entre exécutions.
- **Données géographiques** : hiérarchie `Pays` → `Gouvernorat` → `Ville`
  (FK `paysId`, `gouvernoratId`). **Architecture hybride** :
  - Pays : seedés en BDD (6 pays de base + 250 via `seed:geo` optionnel)
  - Gouvernorats / Villes : chargés **à la demande** depuis les APIs
    `restcountries.com` et `countriesnow.space`, puis **cachés en BDD**.
  - Service : `services/geoService.js` — routes : `GET /api/geo/pays`,
    `GET /api/geo/pays/:id/gouvernorats`, `GET /api/geo/gouvernorats/:id/villes`,
    `GET /api/geo/pays/:id/villes` (liste plate).
  - Ne PAS insérer d'`id` explicite : laisser l'auto-increment.


### Frontend
- Import alias `@/` pour `src/` (ex: `import { Button } from '@/app/components/ui/button'`)
- Pages : export nommé (`export function Home()`) — utilisé dans `routes.tsx`
- Composants UI : utiliser `cn()` de `@/app/components/ui/utils.ts` pour fusionner classes Tailwind
- Styles : préférer les vars CSS `--edu-*` (design system) plutôt que des couleurs en dur
- Forms : `react-hook-form`
- Toasts : `sonner`

## À ne pas toucher

| Chemin | Raison |
|---|---|
| `**/node_modules/` | Dépendances installées |
| `**/package-lock.json` | Géré par npm |
| `backend/.env` | Secrets (non versionné) |
| `backend/uploads/` | Contenu uploadé par les utilisateurs |
| `frontend/dist/` | Build généré |
| `frontend/src/app/components/ui/` | Composants shadcn — régénérables, ne pas éditer manuellement |
| `frontend/src/app/components/figma/` | Artefacts Figma Make |
| `frontend/ATTRIBUTIONS.md` | Mentions de licence shadcn/Unsplash |

Également : `vite.config.ts` contient un commentaire explicite indiquant de ne
pas retirer les plugins React/Tailwind et de ne pas ajouter `.ts/.tsx/.css` à
`assetsInclude`.

## Workflow attendu

- Toujours proposer un plan avant un changement non trivial (nouvelle feature,
  refactor, branchement front/back).
- **Setup BDD depuis zéro** (dev) :
  1. `npm run db:reset-schema` (si DB pas vierge)
  2. `npm run migrate`
  3. `npm run seed`
  4. (optionnel, long) `npm run seed:geo`
- Pour toute modification backend : vérifier que `npm run dev` démarre sans
  erreur et que `/api/health` répond.
- Pour toute modification frontend : vérifier que `npm run build` passe
  (pas de suite de tests pour l'instant).
- **Prochaine étape majeure** : remplacer `frontend/src/app/data/mockData.ts`
  par des appels vers l'API backend. Quand on y sera, prévoir un client HTTP
  centralisé (fetch ou axios) + gestion du token JWT (localStorage + header
  `Authorization: Bearer ...`).
- Commits descriptifs en **français**, format court style :
  `feat(auth): ajouter endpoint /me` ou `fix(front): corriger navigation sidebar`.
