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
- Auth : **JWT** (`jsonwebtoken` 9) + **bcryptjs** 2.4
- Upload fichiers : **Multer** 1.4
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
| `npm run seed` | Exécute `seeders/seed.js` pour peupler la BDD |

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
│   ├── config/database.js        # Connexion Sequelize / PostgreSQL
│   ├── controllers/              # Logique métier (1 fichier / ressource)
│   ├── middleware/
│   │   ├── authMiddleware.js     # Vérif JWT
│   │   └── upload.js             # Config Multer
│   ├── models/                   # Sequelize (User, Institute, Program,
│   │   │                           Application, Favorite, Country, Historique)
│   │   └── index.js              # Charge tous les modèles + associations
│   ├── routes/                   # Mount sous /api/<resource>
│   ├── seeders/seed.js           # Seed BDD
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
- Associations centralisées dans `models/index.js`
- Imports CommonJS (`require`), pas d'ESM

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
