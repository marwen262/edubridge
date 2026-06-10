# Projet : EduBridge

## Objectif
Plateforme de mise en relation entre candidats et les instituts privées tunisiennes.
Trois rôles métier : `candidat` (étudiants cherchant une formation), `institut`
(écoles qui publient leurs programmes) et `admin`. Le frontend est connecté à
l'API backend via un client axios centralisé et un AuthContext JWT — la phase
d'intégration initiale est complète (auth, programmes, instituts, candidatures,
favoris, notifications, utilisateurs).

Le repo contient trois composants indépendants :
- `backend/` — API REST Node.js / Express / PostgreSQL (cœur métier)
- `frontend/` — SPA React / Vite (interface utilisateur)
- `diploma-verifier/` — service Python / FastAPI de vérification
  documentaire de diplômes (OCR Tesseract + scoring heuristique pondéré, stateless).
  Pipeline principal déterministe (heuristiques, regex, OpenCV). Composant deep-learning
  optionnel : **MantraNet** (`mantranet_detector.py`, PyTorch) désactivé par défaut
  (`MANTRANET_ENABLED=False`) jusqu'à validation des poids sur corpus.

## Stack

### Backend (`backend/`)
- Node.js + **Express 4.19**
- **Sequelize 6.37** + **PostgreSQL** (via `pg` 8.12 / `pg-hstore`)
- Migrations : **sequelize-cli** 6.6 (dev)
- Auth : **JWT** (`jsonwebtoken` 9) + **bcryptjs** 2.4 (10 rounds)
- Email : **Nodemailer** (SMTP, vars `SMTP_*` dans `.env`) — invitation institut, reset password
- Upload fichiers : **Multer** 1.4 (disque local, 5 Mo max, jpeg/png/pdf)
- UUIDs : **uuid** 9 (v4 pour PK, polymorphe pour `Media`)
- Rate limiting : **express-rate-limit** 8 (global + strict /auth/login)
- Dev : **nodemon** 3.1

### Frontend (`frontend/`)
- **React 18.3.1** + **TypeScript**
- **Vite 6** (build + dev server)
- **Tailwind CSS v4** (via `@tailwindcss/vite`)
- **shadcn/ui** + **Radix UI** (composants dans `src/app/components/ui/`)
- **react-router 7** (`createBrowserRouter`)
- **axios 1.15** (client HTTP centralisé `src/services/api.ts`)
- **motion** (animations), **lucide-react** (icônes), **sonner** (toasts)
- **i18next 26** + **react-i18next 17** + **i18next-browser-languagedetector 8** (i18n FR/EN, clé `i18nextLng` localStorage, fallback `fr`)
- **react-hook-form** 7 + **zod 4** + **@hookform/resolvers 5** (formulaires Login/Signup/Paramètres)
- **AuthContext** (`src/context/AuthContext.tsx`) — JWT + localStorage + intercepteurs
- **ProtectedRoute** (`src/components/ProtectedRoute.tsx`) — garde routes dashboard
- Scaffold d'origine : **Figma Make** (refonte UI, branding uniformisé EduBridge, dashboards modernisés)

### Diploma Verifier (`diploma-verifier/`)
- **Python 3.11** + **FastAPI** (la fonction d'analyse est `async` mais le pipeline interne est synchrone — pas de `await` sur les modules internes)
- Pipeline déterministe d'analyse heuristique **V7** (multi-score) — robuste au bruit OCR
- **Tesseract OCR** (5 passes parallélisées via `ThreadPoolExecutor` : ara, fra, eng, ara+fra, fra+eng) + **spaCy** NER pré-entraîné (modèles `fr_core_news_sm`, `xx_ent_wiki_sm`)
- **OpenCV** / **scikit-image** / **NumPy** : auto-rotation, signature_detector (contours), stamp_detector (Hough circles, downsample 1200px)
- `text_analyzer` : classification de document (`classify_document`), cohérence sémantique (`check_coherence`), pénalité de densité de mots-clés (`keyword_density_penalty`), sélection du meilleur texte basé sur score sémantique ou longueur (fallback) — multilingue (fra, eng, ara, spa, deu)
- `critical_fields_validator` (V7 Phase 1) : validation des champs critiques d'un diplôme (nom, prénom, date, institution, spécialisation) — score 0–100 par champ, agrégé pondéré via `CRITICAL_FIELDS_WEIGHTS` ; résout les faux positifs templates officiels sans identité étudiante
- `scoring_engine` (V7 Phase 2) : moteur multi-score — 6 sous-scores indépendants (structure, semantic, critical_fields, signature, stamp, official_mention) + plafonds heuristiques (no-content, hallucination, safety ceiling 10 chars, `V7_FRAUD_HARD_CAP`)
- `tampering_detector` : 5 (défaut) ou 6 (MantraNet activé) composants de détection — ELA×DCT, copier-coller, fond, EXIF, bruit, + MantraNet optionnel
- **MantraNet** (`mantranet_detector.py`) : détecteur deep-learning pixel-level (PyTorch **2.12+cpu**, ResNet-50 fallback) — désactivé (`MANTRANET_ENABLED=False`). Quand désactivé : aucun import PyTorch, aucun téléchargement, retourne `0.0` immédiatement. Poids à placer dans `models/mantranet.pt` avant activation.
- **PyMuPDF** + **python-magic** : utilisés pour l'import PDF (`utils/image_converter`)
- Conteneurisé (Dockerfile + docker-compose), exposé sur port 8000
- **Stateless** : aucune base de données, pas d'authentification, pas de rate limiting
- ⚠️ Modules présents mais non câblés à l'orchestrator : `diploma_classifier`, `country_detector`, `preprocessing`, `mantranet_detector` (câblé dans `tampering_detector` uniquement, pas dans l'orchestrator)

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
│   │   ├── notificationController.js
│   │   ├── demandeAccesController.js  # Demandes d'accès instituts (public + admin)
│   │   └── preInscriptionController.js  # Pré-inscription post-acceptation (candidat)
│   ├── docs/
│   │   └── WORKFLOW_CANDIDATURE.md   # Guide de test du workflow (exemples curl)
│   ├── middleware/
│   │   ├── authMiddleware.js     # Vérif JWT + résolution profil (candidat_id, institut_id)
│   │   ├── candidatureGuards.js  # Garde-fous : statut terminal + propriété dossier
│   │   ├── rateLimiter.js        # Limiteurs express-rate-limit (global + login)
│   │   └── upload.js             # Config Multer (5 Mo, jpeg/png/pdf)
│   ├── utils/
│   │   └── pagination.js         # Helpers lirePagination + construirePaginationMeta
│   ├── migrations/               # Migrations Sequelize CLI
│   │   ├── 20260420120000-creation-tables-edubridge.js
│   │   ├── 20260421000000-add-identite-candidat.js
│   │   ├── 20260422000000-add-champs-manquants-programmes-instituts.js
│   │   ├── 20260430000000-workflow-institut.js  # invitation email + first login
│   │   ├── 20260501000000-reset-password-token.js  # reset_password_token + expires_at
│   │   ├── 20260502000000-create-demandes-acces.js  # table demandes_acces (workflow auto-inscription)
│   │   └── 20260503000000-create-pre-inscriptions.js  # table pre_inscriptions (formulaire post-acceptation)
│   ├── models/                   # 10 modèles Sequelize MVP (schéma FR)
│   │   ├── index.js              # Charge tous les modèles + associations
│   │   ├── Utilisateur.js        # Compte auth (candidat|institut|admin)
│   │   ├── Candidat.js           # Profil étudiant (1:1 Utilisateur)
│   │   ├── Institut.js           # Profil école (1:1 Utilisateur)
│   │   ├── Programme.js          # Formation (1:N Institut)
│   │   ├── Candidature.js        # Dossier (N:N candidat ↔ programme)
│   │   ├── Notification.js
│   │   ├── Media.js              # Fichier uploadé (polymorphique)
│   │   ├── Favori.js             # Junction candidat ↔ programme
│   │   ├── DemandeAcces.js       # Demande d'accès instituts (statut: en_attente|approuvee|rejetee)
│   │   └── PreInscription.js     # Formulaire pré-inscription (1:1 Candidature, déclenché après acceptation)
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
│   │   ├── emailService.js           # SMTP Nodemailer : invitation institut + reset password
│   │   ├── notificationService.js    # Notifications automatiques (table + console)
│   │   └── preInscriptionService.js  # Pré-inscription : creerOuCompleter, obtenirParCandidature, genererPdf
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
│   │   │   └── api.ts            # Client axios + 9 services (auth, programmes, instituts, candidatures, favoris, notifications, utilisateurs, demandeAcces, preInscription)
│   │   ├── types/
│   │   │   ├── api.ts            # Types TS entités backend (RegisterData, filtres…)
│   │   │   └── auth.ts           # User, AuthContextType
│   │   ├── context/
│   │   │   └── AuthContext.tsx   # AuthProvider + useAuth (JWT, localStorage)
│   │   ├── components/
│   │   │   └── ProtectedRoute.tsx # Redirection si non auth ou mauvais rôle
│   │   ├── i18n/
│   │   │   ├── index.ts          # Init i18next (LanguageDetector + react-i18next, fallback fr)
│   │   │   └── locales/
│   │   │       ├── fr/translation.json  # Traductions françaises
│   │   │       └── en/translation.json  # Traductions anglaises
│   │   ├── hooks/                 # Hooks de fetch (loading/error/refetch)
│   │   │   ├── usePrograms.ts
│   │   │   ├── useProgramDetail.ts
│   │   │   ├── useInstituts.ts
│   │   │   ├── useInstitut.ts
│   │   │   ├── useCandidatures.ts
│   │   │   ├── useFavoris.ts
│   │   │   ├── useFavoriStatus.ts  # Hook transversal (ProgramCard + ProgramDetail)
│   │   │   ├── useNotifications.ts
│   │   │   ├── useUtilisateurs.ts
│   │   │   └── useComparaison.ts   # localStorage compare list (max 3 programmes)
│   │   ├── app/
│   │   │   ├── App.tsx           # AuthProvider > RouterProvider > Toaster
│   │   │   ├── routes.tsx        # 23 routes (plusieurs routes dashboard protégées par ProtectedRoute, RootLayout avec ScrollRestoration)
│   │   │   ├── pages/            # Pages de haut niveau (1 fichier / route, inclut Parametres, MesDocuments, DemandeAcces, PreInscription)
│   │   │   ├── components/       # Composants applicatifs (Navbar, MultiStepDialog, …)
│   │   │   │   ├── forms/        # Composants de formulaires (NationaliteSelect, IndicatifTelephone...)
│   │   │   │   ├── NotificationDropdown.tsx  # Badge unreadCount + dropdown Navbar
│   │   │   │   ├── admin/        # Sections du dashboard admin (Overview, Users, Programs, Candidatures, Notifications, Demandes)
│   │   │   │   ├── institution/  # Sections du dashboard institut + CreateProgramDialog
│   │   │   │   ├── ui/           # Composants shadcn/ui (NE PAS ÉDITER) + AccreditationBadge.tsx (custom)
│   │   │   │   └── figma/        # Helpers Figma Make (NE PAS ÉDITER)
│   │   │   └── data/staticData.ts # Données statiques (référentiels UI, plus aucun mock métier)
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
    ├── requirements.txt          # torch>=2.12 + torchvision>=0.27 ajoutés (V7.5)
    ├── microservices.md          # Documentation architecturale détaillée
    ├── README.md
    ├── app/                      # Code FastAPI (routes, services, config)
    │   ├── api/routes/           # /api/verify, /api/health, …
    │   ├── services/             # OCR, signature, stamp, tampering, scoring…
    │   │   └── mantranet_detector.py  # V7.5 — détecteur PyTorch (désactivé par défaut)
    │   ├── utils/logger.py
    │   └── config.py             # Poids scoring, mots-clés, langues OCR, MANTRANET_ENABLED
    ├── models/                   # Poids ML (gitignorés) — y déposer mantranet.pt pour activer
    ├── diplomes/                 # Corpus local pour tests tampering (non versionné)
    ├── sample_docs/              # Exemples (volume monté)
    ├── logs/                     # Logs (volume monté)
    └── tests/
```

## API Backend

Routes montées dans `backend/index.js`, toutes préfixées `/api/` :

| Préfixe | Fichier | Description |
|---|---|---|
| `/api/auth` | `authRoutes.js` | `register`, `login`, `me`, premier-login (institut), `mot-de-passe/oublie`, `mot-de-passe/valider-token`, `mot-de-passe/reinitialiser` |
| `/api/utilisateurs` | `utilisateurRoutes.js` | Comptes + profils (Candidat/Institut) |
| `/api/instituts` | `institutRoutes.js` | Écoles d'ingénieurs |
| `/api/programmes` | `programmeRoutes.js` | Formations |
| `/api/candidatures` | `candidatureRoutes.js` | Workflow candidatures (cœur métier) |
| `/api/favoris` | `favoriRoutes.js` | Favoris candidat |
| `/api/notifications` | `notificationRoutes.js` | Notifications (mine, count, lire, lire-tout) |
| `/api/demandes-acces` | `demandeAccesRoutes.js` | Demandes d'accès instituts (POST public ; GET/approuver/rejeter admin) |
| `/api/preinscriptions` | `preInscriptionRoutes.js` | Pré-inscription post-acceptation (candidat) : créer/compléter, consulter, télécharger PDF |
| `/api/health` | (inline) | Ping de santé |

**Rate limiting** (`middleware/rateLimiter.js`) : limiteur global appliqué à tout
`/api/*` (600 req / 15 min / IP par défaut) ; limiteur strict sur
`/api/auth/login` (20 req / 15 min / IP, `skipSuccessfulRequests: true`).
Surchargeable via `.env` (`RATE_LIMIT_DISABLED`, `RATE_LIMIT_GLOBAL_MAX`,
`RATE_LIMIT_LOGIN_MAX`, `RATE_LIMIT_WINDOW_MIN`). Réponse JSON standard
`{ message: 'Trop de requêtes, réessayez plus tard.' }` + log `[RATE LIMIT]`.

**Pagination** (`utils/pagination.js`) : appliquée sur les listings
`GET /api/programmes`, `GET /api/instituts`, `GET /api/candidatures` (admin)
via query params `page` (défaut 1) et `limit` (défaut 10, max 100). Réponse
**additive** : la clé ressource est conservée et `pagination: { total, page,
limit, totalPages }` est ajoutée à côté — les hooks frontend continuent à
fonctionner sans modification.

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
- **Identifiants de code** (variables, fonctions, classes, fichiers, tables,
  routes, hooks, composants) : **français aussi bien backend que frontend** —
  cohérence avec le domaine métier (`utilisateur`, `candidat`, `institut`,
  `programme`, `candidature`, `favori`).
  Exemples côté frontend : `useProgrammes`, `useCandidatures`, `useInstituts`,
  `TableauDeBordCandidat`, `BarreDeNavigation`, `CarteProgramme`.
- **Commentaires, messages de commit, documentation** : **français**
- **Strings UI utilisateur** : bilingue FR/EN via `i18next` — utiliser `useTranslation()` de `react-i18next` et la clé de traduction correspondante dans `src/i18n/locales/{fr,en}/translation.json`. Ne jamais écrire de chaîne UI en dur dans les composants.

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
- **Convention réponses API** : toutes les réponses wrappent la ressource dans
  une clé nommée au singulier du nom de la ressource. Exemples :
  `GET /api/programmes/:id` → `{ programme: {...} }`,
  `GET /api/instituts/:id` → `{ institut: {...} }`,
  `GET /api/candidatures/:id` → `{ candidature: {...} }`.
  Les listes utilisent le pluriel : `{ programmes: [...] }`, `{ instituts: [...] }`.
  L'alias Sequelize pour l'association Institut dans Programme est `as: 'institut'`
  (minuscule) — la clé dans le JSON est donc `institut` et non `Institut`.

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
- **Extraction réponse API** : le backend wrappe toujours la ressource dans une
  clé (ex: `{ programme: {...} }`). Ne jamais caster `r.data` directement en
  `Programme` — extraire `r.data.programme`. Exemple correct :
  ```ts
  const payload = r.data as { programme?: Programme };
  const programme = payload.programme;
  ```
  Caster `r.data as Programme` sans extraction provoque des `TypeError` au
  runtime (ex: `.charAt()` sur `undefined`).
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
  2. `npm run db:reset` (drop schéma + recrée + applique les 7 migrations)
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
  - [x] CandidatDashboard → sous-pages (MesCandidatures, MesFavoris, MesDocuments, Parametres)
  - [x] InstitutionDashboard → pipeline kanban, transitions statut
  - [x] AdminDashboard → utilisateurs, candidatures, création instituts
  - [x] Compare → localStorage + programmeService.getById
  - [x] Favoris synchronisés (useFavoriStatus transversal)
  - [x] MultiStepDialog → POST /api/candidatures + upload Multer
  - [x] Notifications Navbar → badge + dropdown temps réel
  - [x] Profil Candidat → Modifiable via `/dashboard/parametres`
  - [x] Sélecteurs UI modernes → Nationalité avec emojis et indicatif téléphonique dynamique
  - [x] mockData.ts supprimé (staticData.ts pour données statiques)
- **Stabilisation (mai 2026)** :
  - [x] Reset password complet : email SMTP + page `/reset-password` + dialog
        « Forgot password » dans Login
  - [x] Rate limiting backend (`express-rate-limit`) : global `/api/*` +
        strict `/api/auth/login`
  - [x] Pagination backend (`page` / `limit` + meta `pagination`) sur
        `GET /api/programmes`, `/api/instituts`, `/api/candidatures` (admin)
  - [x] Pagination frontend : hooks `usePrograms` / `useInstituts` /
        `useAllCandidatures` consomment `r.data.pagination` et acceptent
        `page` / `limit` ; UI `Pagination` (Précédent/Suivant + numéros)
        branchée sur `SearchResults`, `Institutions`, admin
        `CandidaturesSection` (reset page à 1 sur changement de filtres)
  - [x] Intégration diploma-verifier : vérification non-bloquante des diplômes
        uploadés lors de la soumission d'une candidature (`services/diplomaVerifierService.js`)
        — score et niveau stockés dans `notes_institut`, warning console si score < 50
  - [x] i18n bilingue FR/EN : `i18next` + `react-i18next` + `i18next-browser-languagedetector` ;
        fichiers de traduction `src/i18n/locales/{fr,en}/translation.json` ;
        détection automatique (localStorage `i18nextLng` → navigator) ; fallback `fr` ;
        tous les composants et pages migré vers `useTranslation()`
- **Nouvelles features (mai 2026)** :
  - [x] Demandes d'accès instituts (`/institution/request-access`) : formulaire public
        → backend `POST /api/demandes-acces` → notification admin automatique ;
        admin approuve (crée compte + envoie invitation) ou rejette via `DemandesSection`
        dans le dashboard admin ; model `DemandeAcces`, migration `20260502`
  - [x] Badges accréditations : composant `AccreditationBadge.tsx` + logos SVG/PNG
        dans `public/logos/accreditations/` (ABET, AMBA, CTI, EQUIS, HCERES, AACSB,
        EURACE, default) — utilisés dans `InstitutionProfile`, `ProgramDetail`, `AccreditationBadge`
  - [x] Diploma Verifier V7 :
        - Phase 1 — `critical_fields_validator.py` : validation champs critiques diplôme
          (nom/prénom, date, institution, spécialisation) → score agrégé pondéré, résout
          faux positifs templates officiels sans identité étudiante
        - Phase 2 — moteur multi-score `scoring_engine.py` : 6 sous-scores indépendants,
          plafonds V7 (`V7_FRAUD_HARD_CAP`, `critical_fields_low_cap`, tampering penalty)
  - [x] Diploma Verifier V7.5 — MantraNet :
        - `mantranet_detector.py` : détecteur pixel-level de manipulation (PyTorch 2.12+cpu,
          ResNet-50 fallback ImageNet) ; interface `detect_mantranet(image_path) → float` ;
          timeout 15 s ; dégradation gracieuse
        - `tampering_detector.py` mis à jour : 6ème composant MantraNet (×0.15) dans la formule
          quand `MANTRANET_ENABLED=True` ; formule originale 5-composants préservée par défaut
        - `MANTRANET_ENABLED=False` dans `config.py` — aucun modèle HuggingFace disponible
          localement ; zéro overhead à l'import ; à activer uniquement après dépôt de poids
          calibrés dans `models/mantranet.pt`
        - Corrections suites de tests pre-existing : assertion template-cap (score 50 → "suspicious"),
          unpacking 3-tuple `_error_level_analysis`, champ `metadata_info` sur `TamperingResult`
  - [x] Pré-inscriptions post-acceptation :
        - Backend : modèle `PreInscription` (1:1 Candidature), migration `20260503`,
          route `/api/preinscriptions`, service `preInscriptionService.js`
          (creerOuCompleter, obtenirParCandidature, genererPdf) ;
          upload photo d'identité via Multer ; génération PDF attestation
        - Frontend : page `PreInscription.tsx` (route protégée candidat
          `/dashboard/preinscription/:candidatureId`) ; bouton « Pré-inscription »
          dans `CandidateDashboard` sur les candidatures acceptées ;
          `preInscriptionService` dans `api.ts` + types `PreInscription`/`PreInscriptionFormData`
  - [x] Améliorations UX admin/institution :
        - `InstitutesSection` : `DetailDialog` (vue complète logo, description, contact,
          adresse, accréditations, programmes) + filtre `?search=` (nom OU sigle)
        - `DemandesSection` : clic sur la ligne ouvre le détail (stopPropagation sur les actions)
        - `InstitutionCandidaturesSection` : `CandidatureDetailPanel` (remplace
          `CandidatIdentitePanel`) — affiche identité complète, parcours académique,
          lettre de motivation, documents soumis avec liens de téléchargement
  - [x] Notifications systèmes enrichies (backend) :
        - `terminerPremierLogin` notifie les admins qu'un institut attend validation
        - `rejeterInstitut` notifie l'institut avec le motif de rejet
        - `resoumettre` notifie les admins du profil corrigé
        - `suspendreInstitut` notifie l'institut avec le motif de suspension
  - [x] `institutController` : filtre `?search=` (Op.iLike sur nom + sigle) ;
        `approuver` recopie `description` + `contact.email` depuis la demande d'accès
  - [x] `routes.tsx` : `RootLayout` avec `ScrollRestoration` (react-router 7)
        enveloppant toutes les routes
- **TODOs / Améliorations futures (hors scope MVP)** :

  **Backend**
  - Étendre la pagination aux listings restants : `/utilisateurs`, `/favoris/mine`, `/notifications/mine` (limite fixe 50 actuellement), `/candidatures/mine`, `/candidatures/institute/list`.
  - Validation schemas : Joi/Yup/zod côté serveur (actuellement seulement regex email + contraintes Sequelize).
  - Middleware d'erreur centralisé (try/catch dispersés dans chaque controller).
  - Logging structuré (Winston/Pino + niveaux + correlation IDs).
  - Optimiser N+1 (`separate: true` sur `hasMany` dans `GET /api/instituts`).
  - Hardening upload : validation MIME réelle (pas que l'extension) + magic bytes + scan antivirus + restreindre `/uploads` static.
  - Refresh token flow (colonne `jeton_rafraichissement` présente, jamais utilisée).
  - Audit trail (`created_by`, `updated_by`, `deleted_at`, table `AuditLog`).
  - Versioning API (`/api/v1/`).
  - Tests automatisés (Jest + Supertest).

  **Frontend**
  - Migrer `MultiStepDialog` vers `react-hook-form`.
  - Mémoïsation des composants de listing (`React.memo` sur `ProgramCard`, `InstitutionCard`).
  - Optimisation images (lazy loading, `srcSet`, WebP/AVIF).
  - Caching côté client (TanStack Query ou Zustand) pour éviter le re-fetch à chaque navigation.
  - Tests RTL + Jest.
  - Étendre les fichiers de traduction i18n au fur et à mesure des nouvelles features (base bilingue FR/EN en place).
  - Clarifier le mapping slug → id pour la route `/institution/:slug`.

  **Diploma Verifier**
  - Intégrer `diploma_classifier`, `country_detector` au pipeline orchestrator (modules présents mais non câblés).
  - Authentification + rate limiting (API publique actuellement).
  - Monitoring (Prometheus / métriques exportées) et tracing.
  - Calibrer les nouveaux seuils V7 (`CRITICAL_FIELDS_LOW_THRESHOLD`, poids multi-score) sur corpus réel.
  - Suivre la divergence Tesseract 5.4 (Windows local) vs 5.5 (Docker) — atténuée par les plafonds anti-hallucination dans `scoring_engine.py` (cf. `microservices.md`).
  - **MantraNet** : obtenir et valider les poids officiels UTSA-ICS (ou fine-tune ResNet-50 sur CASIA) ; les placer dans `diploma-verifier/models/mantranet.pt` ; passer `MANTRANET_ENABLED=True` dans `config.py` ; vérifier les 6 cibles corpus (`diplomehbib.jpg` 75-85, `diplomemar.jpg` ≥80, `diplomevide.png` ≤35, `gbtdiplome.png` ≤55, `logoedubridge.png` ≤20, `maroc.jpg` ≥65).
- **Priorité immédiate** : stabilisation, corrections de bugs.
- Commits descriptifs en **français**, format court style :
  `feat(auth): ajouter endpoint /me` ou `fix(front): corriger navigation sidebar`.
