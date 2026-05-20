# EduBridge — Analyse Architecturale Complète pour Soutenance PFE

> Document généré pour préparer la soutenance de Projet de Fin d'Études.
> Mode READ-ONLY — aucun fichier du projet n'a été modifié.

---

## TABLE DES MATIÈRES

1. [Vue globale du système](#1-vue-globale-du-système)
2. [Architecture générale — Diagrammes](#2-architecture-générale--diagrammes)
3. [Flux détaillés end-to-end](#3-flux-détaillés-end-to-end)
4. [Explication dossier par dossier](#4-explication-dossier-par-dossier)
5. [Explication fichier par fichier](#5-explication-fichier-par-fichier)
6. [Analyse du code ligne par ligne](#6-analyse-du-code-ligne-par-ligne)
7. [Questions probables du jury — avec réponses](#7-questions-probables-du-jury--avec-réponses)
8. [Forces et faiblesses du projet](#8-forces-et-faiblesses-du-projet)
9. [Vocabulaire soutenance](#9-vocabulaire-soutenance)

---

## 1. VUE GLOBALE DU SYSTÈME

### 1.1 Qu'est-ce qu'EduBridge ?

EduBridge est une **plateforme SaaS de mise en relation** entre :
- **Candidats** (étudiants cherchant une formation)
- **Instituts privés tunisiens** (écoles qui publient leurs programmes)
- **Administrateurs** (gestion, validation, supervision)

Le projet est composé de **trois composants indépendants** :

| Composant | Technologie | Rôle |
|---|---|---|
| `backend/` | Node.js / Express / PostgreSQL | API REST — cœur métier |
| `frontend/` | React / Vite / TypeScript | Interface utilisateur SPA |
| `diploma-verifier/` | Python / FastAPI | Microservice OCR de vérification documentaire |

### 1.2 Les trois rôles métier

```
┌─────────────────────────────────────────────────────────┐
│                      EDUBRIDGE                          │
│                                                         │
│   CANDIDAT          INSTITUT          ADMIN             │
│   ────────          ────────          ─────             │
│   S'inscrit         Publie des        Gère tout         │
│   Cherche           programmes        Valide les        │
│   Candidate         Reçoit les        instituts         │
│   Suit son          candidatures      Supervise         │
│   dossier           Les traite        Statistiques      │
└─────────────────────────────────────────────────────────┘
```

---

## 2. ARCHITECTURE GÉNÉRALE — DIAGRAMMES

### 2.1 Diagramme d'architecture système

```
┌──────────────────────────────────────────────────────────────────┐
│                        NAVIGATEUR WEB                            │
│                                                                  │
│   ┌──────────────────────────────────────────────────────────┐  │
│   │              FRONTEND — React SPA (Vite)                 │  │
│   │                                                          │  │
│   │  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌────────┐  │  │
│   │  │AuthContext│  │  Hooks   │  │  Pages   │  │Routes  │  │  │
│   │  │  (JWT)   │  │(fetch)   │  │(UI)      │  │(react- │  │  │
│   │  └────┬─────┘  └────┬─────┘  └────┬─────┘  │router) │  │  │
│   │       │              │              │         └────────┘  │  │
│   │       └──────────────┴──────────────┘                     │  │
│   │                         │                                  │  │
│   │              ┌──────────▼──────────┐                      │  │
│   │              │   api.ts (axios)    │  Client HTTP central  │  │
│   │              │  + intercepteurs    │  JWT auto-inject      │  │
│   │              └──────────┬──────────┘                      │  │
│   └─────────────────────────┼────────────────────────────────┘  │
└─────────────────────────────┼────────────────────────────────────┘
                              │ HTTPS / JSON
                              │
┌─────────────────────────────▼────────────────────────────────────┐
│               BACKEND — Node.js / Express                        │
│                                                                  │
│   ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────────┐   │
│   │Middleware│  │  Routes  │  │Controller│  │  Services    │   │
│   │ (JWT,   │  │  (REST)  │  │  (HTTP)  │  │  (métier)    │   │
│   │ upload) │  │          │  │          │  │              │   │
│   └──────────┘  └──────────┘  └──────────┘  └──────┬───────┘   │
│                                                      │           │
│   ┌──────────────────────────────────────────────────▼────────┐  │
│   │                  Sequelize ORM                            │  │
│   └──────────────────────────────────────────────────┬────────┘  │
│                                                      │           │
│   ┌──────────────────────────────────────────────────▼────────┐  │
│   │              PostgreSQL (10 tables)                       │  │
│   │  utilisateurs, candidats, instituts, programmes,          │  │
│   │  candidatures, notifications, medias, favoris,            │  │
│   │  demandes_acces, pre_inscriptions                         │  │
│   └───────────────────────────────────────────────────────────┘  │
│                                                                  │
│   ┌───────────────────────────────────────────────────────────┐  │
│   │    diplomaVerifierService.js — client HTTP interne        │  │
│   └─────────────────────────────┬─────────────────────────────┘  │
└─────────────────────────────────┼────────────────────────────────┘
                                  │ HTTP POST /api/verify
                                  │
┌─────────────────────────────────▼────────────────────────────────┐
│            DIPLOMA VERIFIER — Python / FastAPI                   │
│                                                                  │
│   ┌──────────────────────────────────────────────────────────┐  │
│   │                    Orchestrator V7                       │  │
│   │                                                          │  │
│   │  ┌─────────┐ ┌──────────┐ ┌────────────┐ ┌──────────┐  │  │
│   │  │  OCR    │ │  Text    │ │  Scoring   │ │Tampering │  │  │
│   │  │Tesseract│ │ Analyzer │ │  Engine    │ │Detector  │  │  │
│   │  │ 5 langs │ │ spaCy   │ │   V7 Multi │ │ ELA+DCT  │  │  │
│   │  └─────────┘ └──────────┘ └────────────┘ └──────────┘  │  │
│   │                                                          │  │
│   │  ┌──────────────┐  ┌──────────────┐                     │  │
│   │  │  Signature   │  │    Stamp     │                     │  │
│   │  │  Detector    │  │   Detector   │                     │  │
│   │  │  (OpenCV)    │  │   (Hough)    │                     │  │
│   │  └──────────────┘  └──────────────┘                     │  │
│   └──────────────────────────────────────────────────────────┘  │
│                                                                  │
│   Réponse : { score: 0-100, confidence_level, reasons, v7{} }   │
└──────────────────────────────────────────────────────────────────┘
```

### 2.2 Diagramme de base de données

```
┌─────────────────┐       ┌─────────────────┐
│   UTILISATEUR   │──1:1──│    CANDIDAT     │
│  (auth + rôle)  │       │   (profil étud) │
│                 │       └────────┬────────┘
│  id (UUID)      │                │ candidat_id
│  email          │       ┌────────▼────────┐     ┌───────────────┐
│  mot_de_passe   │       │  CANDIDATURE   │─────│   PROGRAMME   │
│  role (ENUM)    │       │  (dossier)     │     │  (formation)  │
│  est_actif      │       │                │     │               │
└─────────────────┘       │  statut (ENUM) │     │  titre        │
         │                │  lettre_motiv. │     │  niveau       │
         │1:1             │  docs_soumis   │     │  documents    │
         │                │  (JSONB)       │     │   _requis     │
┌────────▼────────┐        └────────────────┘     │  (JSONB)     │
│    INSTITUT     │                 │              └──────┬───────┘
│  (profil école) │                 │                     │
│                 │                 └──── MEDIA            │
│  nom, sigle     │                       (fichier)       │
│  logo, contact  │                                       │
│  validation_    │─────────────────────────────(1:N)─────┘
│  status (ENUM)  │
└─────────────────┘
         │
         │ ─── NOTIFICATION (1:N Utilisateur)
         │ ─── DEMANDE_ACCES (workflow auto-inscription)
         │ ─── PRE_INSCRIPTION (post-acceptation)
         │ ─── FAVORI (junction Candidat ↔ Programme)
```

---

## 3. FLUX DÉTAILLÉS END-TO-END

### 3.1 Flux d'authentification JWT

```
FRONTEND                    BACKEND                      DB
   │                           │                          │
   │  POST /api/auth/login      │                          │
   │  { email, password }       │                          │
   ├──────────────────────────►│                          │
   │                           │  findOne({ email })       │
   │                           ├─────────────────────────►│
   │                           │◄─────────────────────────┤
   │                           │  bcrypt.compare()         │
   │                           │  jwt.sign({ id, role })   │
   │                           │  ← token (7j)             │
   │◄──────────────────────────┤                          │
   │  { token, utilisateur,    │                          │
   │    profil }               │                          │
   │                           │                          │
   │  localStorage.setItem(    │                          │
   │    'auth_token', token)   │                          │
   │  AuthContext.setUser()    │                          │
   │                           │                          │
   │  Prochaine requête :      │                          │
   │  Authorization: Bearer    │                          │
   │    <token>                │                          │
   ├──────────────────────────►│                          │
   │                           │  authMiddleware :         │
   │                           │  jwt.verify(token)        │
   │                           │  findByPk(decoded.id)     │
   │                           │  → req.user = {           │
   │                           │     id, role,             │
   │                           │     candidat_id,          │
   │                           │     institut_id }         │
```

**Pourquoi JWT ?**
- Stateless : le serveur ne stocke pas de session, parfait pour l'architecture REST
- Scalable : n'importe quel serveur peut valider le token sans base de données partagée
- Payload utile : `{ id, role }` évite une requête DB à chaque route (profil résolu dans authMiddleware)

### 3.2 Flux de candidature complet

```
CANDIDAT                 BACKEND                      DIPLOMA VERIFIER
   │                        │                                │
   │  1. Crée brouillon     │                                │
   │  POST /api/candidatures│                                │
   │  + fichiers (FormData) │                                │
   ├───────────────────────►│                                │
   │                        │  Multer : sauve fichiers       │
   │                        │  Crée Media en DB (ACID tx)    │
   │                        │  Crée Candidature (brouillon)  │
   │◄───────────────────────┤                                │
   │  { candidature_id }    │                                │
   │                        │                                │
   │  2. Soumet candidature │                                │
   │  POST /candidatures/   │                                │
   │    :id/soumettre       │                                │
   ├───────────────────────►│                                │
   │                        │  [Transaction ACID ouverte]    │
   │                        │                                │
   │                        │  A. Mise à jour profil         │
   │                        │     candidat (whitelist)       │
   │                        │                                │
   │                        │  B. Vérifier profil complet    │
   │                        │     (prenom, nom, tel, nat...)  │
   │                        │                                │
   │                        │  C. Vérifier docs obligatoires │
   │                        │     (documents_requis prog)    │
   │                        │                                │
   │                        │  D. Analyse diplôme (async)    │
   │                        ├───────────────────────────────►│
   │                        │    POST /api/verify            │
   │                        │    { file: diplome.pdf }       │
   │                        │◄───────────────────────────────┤
   │                        │  { score: 78,                  │
   │                        │    niveau: "high",             │
   │                        │    subscores: {...} }          │
   │                        │                                │
   │                        │  Stocke dans notes_institut:   │
   │                        │  "[DiplomaVerifier] score=78"  │
   │                        │                                │
   │                        │  E. statut → "soumise"         │
   │                        │  F. Notifications (candidat    │
   │                        │     + institut)                │
   │                        │                                │
   │                        │  [Transaction ACID fermée]     │
   │◄───────────────────────┤                                │
   │  { candidature: {...} }│                                │
```

**Points clés :**
1. La vérification OCR est **non-bloquante** : si elle échoue, la candidature est quand même soumise
2. La transaction ACID garantit que si une étape échoue, rien n'est persisté
3. Les notifications sont envoyées dans la même transaction

### 3.3 Flux de vérification de diplôme (Diploma Verifier)

```
FICHIER PDF/IMAGE
       │
       ▼
┌──────────────────────────────────────────────────────────────┐
│  ÉTAPE 1 — Conversion                                        │
│  image_converter.py : PDF → PIL Image → OpenCV (BGR)        │
└──────────────────────┬───────────────────────────────────────┘
                       │
                       ▼
┌──────────────────────────────────────────────────────────────┐
│  ÉTAPE 2 — OCR (5 passes parallèles)                        │
│  Tesseract 5 : fra, eng, ara, ara+fra, fra+eng              │
│  Auto-rotation (deskew), upscale x2                         │
│  Sélection du meilleur texte (score sémantique ou longueur)  │
└──────────────────────┬───────────────────────────────────────┘
                       │
          ┌────────────┼────────────┐
          │            │            │
          ▼            ▼            ▼
┌─────────────┐ ┌───────────┐ ┌──────────────┐
│ text_       │ │signature_ │ │ stamp_       │
│ analyzer    │ │ detector  │ │ detector     │
│ (spaCy NER) │ │ (contours)│ │ (Hough)      │
│ NOM, DATE,  │ │           │ │              │
│ INSTITUTION │ │ sig_conf  │ │ stamp_conf   │
└──────┬──────┘ └─────┬─────┘ └──────┬───────┘
       │               │              │
       └───────────────┴──────────────┘
                       │
                       ▼
┌──────────────────────────────────────────────────────────────┐
│  ÉTAPE 3 — Critical Fields Validator (V7)                   │
│  Valide : prénom, nom, date, institution, spécialisation    │
│  Score 0-100 par champ, agrégé avec poids (CRITICAL_FIELDS_ │
│  WEIGHTS). Détecte les templates officiels sans identité.   │
└──────────────────────┬───────────────────────────────────────┘
                       │
                       ▼
┌──────────────────────────────────────────────────────────────┐
│  ÉTAPE 4 — Tampering Detector (si diploma_confidence ≥ 0.2) │
│  5 composants : ELA×DCT, copy-paste, fond, EXIF, bruit     │
│  + MantraNet (6e composant, désactivé par défaut)           │
│  → fraud_score (0-100, INVERSÉ dans scoring)                │
└──────────────────────┬───────────────────────────────────────┘
                       │
                       ▼
┌──────────────────────────────────────────────────────────────┐
│  ÉTAPE 5 — Scoring Engine V7 Multi-Score                    │
│                                                             │
│  6 sous-scores (0-100) :                                    │
│  ┌──────────────────┬──────┬──────────────────────────────┐ │
│  │ Sous-score        │ Poids│ Source                       │ │
│  ├──────────────────┼──────┼──────────────────────────────┤ │
│  │ structure         │ 0.14 │ structure_count + phrases    │ │
│  │ semantic          │ 0.10 │ spaCy + coherence_score      │ │
│  │ critical_fields   │ 0.20 │ CF Validator V7              │ │
│  │ visual_auth       │ 0.10 │ sig×0.4 + stamp×0.6          │ │
│  │ fraud_trust       │ 0.36 │ 100 - fraud_score            │ │
│  │ ocr_confidence    │ 0.10 │ Tesseract confidence         │ │
│  └──────────────────┴──────┴──────────────────────────────┘ │
│                                                             │
│  + Caps de sécurité : no-content, hallucination,           │
│    semantic ceiling, template, fraud hard cap               │
└──────────────────────┬───────────────────────────────────────┘
                       │
                       ▼
         { score: 0-100, confidence_level,
           reasons: [...], v7: { subscores, risks } }
```

### 3.4 Flux upload document

```
FRONTEND                        BACKEND (Multer)              DISK
   │                                  │                         │
   │  FormData {                       │                         │
   │    diplome: File,                 │                         │
   │    lettre_motivation: string      │                         │
   │  }                                │                         │
   │  Content-Type: multipart/form-data│                         │
   ├─────────────────────────────────►│                         │
   │                                  │ diskStorage (./uploads/)│
   │                                  ├────────────────────────►│
   │                                  │ nom: timestamp-random   │
   │                                  │ ext: .pdf/.jpg/.png     │
   │                                  │                         │
   │                                  │ Media.create({          │
   │                                  │   chemin: 'uploads/...',│
   │                                  │   type_mime,            │
   │                                  │   taille_octets         │
   │                                  │ })                      │
   │                                  │                         │
   │                                  │ Candidature.update({    │
   │                                  │   documents_soumis: [   │
   │                                  │     { nom, url, media_id│
   │                                  │       telecharge_le }   │
   │                                  │   ]                     │
   │                                  │ }) // JSONB             │
```

### 3.5 Flux workflow Institut (invitation → validation)

```
ADMIN              BACKEND           EMAIL          INSTITUT          CANDIDATS
  │                   │                │               │                 │
  │ Invite institut   │                │               │                 │
  │ POST /instituts   │                │               │                 │
  ├──────────────────►│                │               │                 │
  │                   │ first_login_   │               │                 │
  │                   │ token (UUID)   │               │                 │
  │                   │ Créé en DB     │               │                 │
  │                   ├───────────────►│               │                 │
  │                   │  Email avec    │               │                 │
  │                   │  lien one-use  │               │                 │
  │                   │                ├──────────────►│                 │
  │                   │                │  Clique lien  │                 │
  │                   │                │  /first-login │                 │
  │                   │                │               │                 │
  │                   │◄──────────────────────────────┤                 │
  │                   │ POST /premier- │               │                 │
  │                   │   login/terminer│               │                 │
  │                   │ { token, pwd,  │               │                 │
  │                   │   nom, tel }   │               │                 │
  │                   │                │               │                 │
  │                   │ validation_    │               │                 │
  │                   │ status →       │               │                 │
  │                   │ pending_admin_ │               │                 │
  │                   │ review         │               │                 │
  │                   │                │               │                 │
  │ Valide l'institut │                │               │                 │
  │ POST /instituts/  │                │               │                 │
  │   :id/approuver   │                │               │                 │
  ├──────────────────►│                │               │                 │
  │                   │ validation_    │               │                 │
  │                   │ status →       │               │                 │
  │                   │ approved       │               │                 │
  │                   │                │  Notif email  │                 │
  │                   ├───────────────►│──────────────►│                 │
  │                   │                │               │                 │
  │                   │                │               │ Publie          │
  │                   │                │               │ programmes      │
  │                   │                │               ├────────────────►│
  │                   │                │               │  Visible sur    │
  │                   │                │               │  la plateforme  │
```

---

## 4. EXPLICATION DOSSIER PAR DOSSIER

### 4.1 BACKEND

#### `backend/controllers/`

**Rôle :** Couche HTTP mince — reçoit la requête, délègue au service, renvoie la réponse.

**Pattern architectural :** Thin Controller (contrôleur mince)

**Principe :** Un controller ne doit contenir que :
1. Extraction des paramètres (`req.body`, `req.params`, `req.user`)
2. Appel du service métier
3. Formatage de la réponse HTTP

**Exemple concret :**
```
authController.js → reçoit POST /login → délègue bcrypt + JWT → renvoie token
candidatureController.js → reçoit POST /soumettre → délègue à candidatureWorkflow.js
```

**Communication avec les autres couches :**
- Reçoit depuis : `routes/` (Express router)
- Délègue vers : `services/` (logique métier)
- Lit depuis : `req.user` (peuplé par authMiddleware)

#### `backend/services/`

**Rôle :** Cœur métier — logique découplée des routes HTTP.

**Pattern architectural :** Service Layer (couche service)

**Fichiers clés :**

| Fichier | Rôle |
|---|---|
| `candidatureWorkflow.js` | Machine à états des candidatures |
| `notificationService.js` | Envoi des notifications en DB |
| `emailService.js` | SMTP Nodemailer (invitation + reset) |
| `preInscriptionService.js` | Pré-inscription post-acceptation |
| `diplomaVerifierService.js` | Client HTTP vers le microservice OCR |

**Pourquoi séparer services et controllers ?**
- Testabilité : on peut tester la logique sans lancer le serveur HTTP
- Réutilisabilité : plusieurs routes peuvent appeler le même service
- Lisibilité : chaque fichier a une responsabilité claire

#### `backend/middleware/`

**Rôle :** Intercept les requêtes HTTP AVANT le controller.

**Fichiers :**

| Fichier | Rôle |
|---|---|
| `authMiddleware.js` | Vérifie JWT, résout profil, peuple `req.user` |
| `candidatureGuards.js` | Vérifie propriété du dossier + statut terminal |
| `rateLimiter.js` | Limite le nombre de requêtes par IP |
| `upload.js` | Configure Multer (stockage disque, filtres MIME) |

**Analogie :** Les middleware sont comme les contrôles de sécurité à l'aéroport — vous passez obligatoirement avant d'accéder à la porte d'embarquement (le controller).

#### `backend/models/`

**Rôle :** Définit le schéma de la base de données via Sequelize ORM.

**Pattern architectural :** Active Record via Sequelize

**Structure :**
```
models/index.js    ← charge tous les modèles + déclare les associations
models/Utilisateur.js  ← table utilisateurs
models/Candidat.js     ← profil étudiant
models/Institut.js     ← profil école
models/Programme.js    ← formation
models/Candidature.js  ← dossier (nœud central)
models/Notification.js ← alertes
models/Media.js        ← fichiers uploadés (polymorphique)
models/Favori.js       ← junction candidat ↔ programme
models/DemandeAcces.js ← demandes auto-inscription
models/PreInscription.js ← formulaire post-acceptation
```

**Types remarquables utilisés :**
- `UUID v4` : clés primaires non-devinables, pas de séquence entière exposée
- `JSONB` : stockage flexible (documents_soumis, adresse, contact, parcours_academique)
- `ENUM` : valeurs fermées (rôle: candidat/institut/admin, statut candidature)
- `ARRAY(STRING)` : langues, accréditations

#### `backend/migrations/`

**Rôle :** Historique versionnée du schéma de base de données.

**Principe important :**
> Le schéma BDD est UNIQUEMENT géré par les migrations. `sequelize.sync()` est INTERDIT en production.

**Pourquoi ?**
- `sync()` peut silencieusement modifier ou supprimer des colonnes
- Les migrations permettent de monter ET de descendre (undo) de version
- Traçabilité complète des changements de schéma

#### `backend/routes/`

**Rôle :** Monte les controllers sur les chemins URL et applique les middleware.

```
/api/auth         → authRoutes.js
/api/programmes   → programmeRoutes.js
/api/candidatures → candidatureRoutes.js
...
```

#### `backend/uploads/`

**Rôle :** Stockage local des fichiers uploadés par les candidats.
Servi statiquement via `/uploads` par Express.

### 4.2 FRONTEND

#### `src/context/`

**Rôle :** État global d'authentification partagé dans toute l'application.

**Pattern architectural :** Context API + Provider Pattern (React)

`AuthContext.tsx` expose : `user`, `token`, `isAuthenticated`, `login`, `logout`, `register`, `updateUser`.

#### `src/services/api.ts`

**Rôle :** Client HTTP centralisé — toutes les requêtes API passent par là.

**Pattern :** Service Layer + Singleton Axios

**Ce qu'il fait :**
1. Configure une instance Axios avec `baseURL`, `timeout`, headers
2. Intercepteur requête : injecte automatiquement le JWT depuis localStorage
3. Intercepteur réponse : gère 401 (session expirée → redirect /login) et 403
4. Expose 9 services typés : `authService`, `programmeService`, `candidatureService`...

#### `src/hooks/`

**Rôle :** Data-fetching réutilisable avec états `loading`, `error`, `data`.

**Pattern architectural :** Custom Hooks (React)

Chaque hook encapsule : l'appel API, le state management, le re-fetch.

```
usePrograms.ts    → GET /api/programmes (avec filtres + pagination)
useCandidatures.ts → GET /api/candidatures/mine
useFavoris.ts     → GET /api/favoris/mine
useNotifications.ts → GET /api/notifications/mine
```

#### `src/app/pages/`

**Rôle :** Pages de niveau route (une page = une URL).

**23 routes** incluant : Home, SearchResults, ProgramDetail, InstitutionProfile, Compare, Login, Signup, FirstLogin, ResetPassword, CandidateDashboard, MesCandidatures, MesFavoris, MesDocuments, Parametres, InstitutionDashboard, AdminDashboard, DemandeAcces, PreInscription.

#### `src/app/components/`

**Rôle :** Composants réutilisables organisés par domaine.

```
admin/          → sections du dashboard admin
institution/    → sections du dashboard institut
forms/          → composants de formulaires (NationaliteSelect...)
ui/             → shadcn/ui (NE PAS ÉDITER)
figma/          → artefacts Figma (NE PAS ÉDITER)
NotificationDropdown.tsx → badge + dropdown temps réel
```

#### `src/components/ProtectedRoute.tsx`

**Rôle :** Garde les routes dashboard — redirige si non authentifié ou mauvais rôle.

**Pattern architectural :** Route Guard (Higher-Order Component)

#### `src/i18n/`

**Rôle :** Internationalisation FR/EN via i18next.

**Principe :** Aucune chaîne UI n'est écrite en dur dans les composants — toujours via `t('clé')`.

#### `src/styles/`

**Rôle :** Design system custom.

```
tailwind.css   → classes Tailwind
theme.css      → variables CSS (dark/light mode)
fonts.css      → imports de polices
edubridge.css  → variables --edu-* (--edu-blue, --edu-danger...)
```

### 4.3 DIPLOMA VERIFIER

#### `app/services/orchestrator.py`

**Rôle :** Chef d'orchestre — coordonne tous les services d'analyse dans l'ordre.

**Pattern architectural :** Orchestrator Pattern (monolithe modulaire)

#### `app/services/ocr_service.py`

**Rôle :** Extraction de texte via Tesseract — 5 passes parallèles, sélection du meilleur résultat.

#### `app/services/text_analyzer.py`

**Rôle :** Analyse sémantique du texte extrait — classification, cohérence, NER spaCy.

#### `app/services/signature_detector.py`

**Rôle :** Détecte une signature manuscrite via analyse de contours OpenCV.

#### `app/services/stamp_detector.py`

**Rôle :** Détecte un cachet circulaire via transformée de Hough (cercles).

#### `app/services/critical_fields_validator.py`

**Rôle :** Valide les champs critiques d'un diplôme (nom, prénom, date, institution, spécialisation). Résout les faux positifs sur les templates officiels sans identité étudiante.

#### `app/services/scoring_engine.py`

**Rôle :** Moteur de scoring multi-score — 6 sous-scores indépendants, caps de sécurité, score global 0-100.

#### `app/services/tampering_detector.py`

**Rôle :** Détection de falsification — 5 composants (ELA, copy-paste, fond uniforme, EXIF, bruit) + MantraNet optionnel (6e).

#### `app/config.py`

**Rôle :** Source de vérité unique pour tous les seuils, poids, mots-clés et constantes du microservice.

---

## 5. EXPLICATION FICHIER PAR FICHIER

---

### FICHIER 1 : `backend/services/candidatureWorkflow.js`

**Niveau de criticité : CŒUR MÉTIER**

**Rôle :**
Moteur de workflow — implémente la machine à états des candidatures. C'est le fichier le plus important du backend.

**Pourquoi il est important :**
Toute la logique métier des candidatures (transitions, validations, anti-doublon, OCR, notifications) est ici. C'est le seul endroit où un candidat peut passer de `brouillon` à `soumise`, et où un institut peut accepter ou refuser.

**Fonctions principales :**

| Fonction | Rôle |
|---|---|
| `creerBrouillon()` | Crée une candidature avec statut initial |
| `mettreAJourBrouillon()` | Ajoute des documents ou modifie la lettre |
| `soumettre()` | Pipeline en 5 étapes : profil → docs → OCR → statut → notifs |
| `changerStatut()` | Transition par l'institut ou l'admin |
| `validerTransition()` | Vérifie si la transition est autorisée pour le rôle |
| `verifierCompletude()` | Compare docs soumis vs docs_requis du programme |
| `verifierProfilComplet()` | Vérifie les champs obligatoires du candidat |
| `verifierDoublon()` | Anti-doublon (un candidat = une candidature par programme) |

**Machine à états :**

```
         CANDIDAT               INSTITUT / ADMIN
            │                         │
         brouillon                     │
            │ soumettre()              │
            ▼                         │
         soumise ──────────────────►  │
            │                   en_examen
            │                       │
            │               ┌───────┴───────┐
            │               │               │
            │           acceptee        refusee
            │           (TERMINAL)     (TERMINAL)
            │               │
            │         liste_attente
            │               │
            │          acceptee / refusee
```

**Flux des données dans `soumettre()` :**
```
req.body → whitelist CHAMPS_PROFIL_AUTORISES
         → candidat.update() [transaction]
         → verifierProfilComplet() [sync]
         → verifierCompletude() [async, DB]
         → verifierDiplome() [async, HTTP]
         → candidature.update({ statut: 'soumise' })
         → notif candidat + notif institut
```

**Pattern anti-mass assignment (ligne 9-16) :**
La whitelist `CHAMPS_PROFIL_AUTORISES` empêche qu'un candidat malveillant envoie un champ comme `role: 'admin'` dans le body et qu'il soit persisté.

**Ce que le jury peut demander :**
- "Pourquoi une transaction ACID ici ?"
- "Que se passe-t-il si la vérification OCR échoue ?"
- "Comment gérez-vous les statuts terminaux ?"

**Réponses :**
- Transaction ACID : si la notification échoue après le changement de statut, le rollback remet le statut précédent — cohérence garantie.
- OCR non-bloquant : encapsulé dans try/catch, la soumission réussit même si le microservice est down.
- Statuts terminaux `['acceptee', 'refusee']` : `validerTransition()` lève une exception 400 immédiatement.

---

### FICHIER 2 : `backend/middleware/authMiddleware.js`

**Niveau de criticité : ÉLEVÉ**

**Rôle :**
Vérificateur de JWT — peuple `req.user` avec les informations d'identité pour toutes les routes protégées.

**Ce qu'il fait ligne par ligne :**

```javascript
// 1. Extraire le token du header Authorization
const token = authHeader.split(' ')[1];  // "Bearer <token>"

// 2. Vérifier cryptographiquement la signature JWT
const decoded = jwt.verify(token, process.env.JWT_SECRET);
// → Lance TokenExpiredError ou JsonWebTokenError si invalide

// 3. Charger l'utilisateur depuis la DB (vérifier qu'il existe encore)
const utilisateur = await Utilisateur.findByPk(decoded.id);

// 4. Vérifier que le compte est actif
if (!utilisateur.est_actif) { return 403 }

// 5. Résoudre le profil (institut_id ou candidat_id)
// → Nécessaire pour les guards de propriété (un institut ne peut
//    agir que sur SES programmes et candidatures)
```

**4 fonctions exportées :**

| Fonction | Usage |
|---|---|
| `authMiddleware` | Route protégée standard (candidat, institut, admin) |
| `isAdmin` | Réservé admin — à chaîner après authMiddleware |
| `restrictTo(...roles)` | Restreint à une liste de rôles |
| `optionalAuth` | Route publique avec conscience du rôle (ex: listing instituts) |

**Pourquoi vérifier `est_actif` en DB à chaque requête ?**
Le JWT peut avoir une durée de 7 jours. Si un compte est suspendu, le JWT existant resterait valide pendant 7 jours sans cette vérification DB. Le coût (1 requête DB par requête) est acceptable pour la sécurité.

---

### FICHIER 3 : `backend/controllers/authController.js`

**Niveau de criticité : ÉLEVÉ**

**Rôle :**
Gestion de l'authentification — inscription, connexion, first login, reset password.

**Fonctions principales :**

| Fonction | Route | Description |
|---|---|---|
| `register` | POST /auth/register | Inscription candidat uniquement (transaction) |
| `login` | POST /auth/login | Connexion + vérification suspension |
| `validerTokenPremierLogin` | GET /premier-login/valider | Valide le lien d'invitation |
| `terminerPremierLogin` | POST /premier-login/terminer | Active le compte institut |
| `demanderResetPassword` | POST /mot-de-passe/oublie | Génère token reset (anti-énumération) |
| `validerResetToken` | GET /mot-de-passe/valider-token | Vérifie expiration |
| `reinitialiserPassword` | POST /mot-de-passe/reinitialiser | Applique le nouveau mot de passe |

**Sécurité — points importants :**

1. **Anti-énumération (ligne 317-339)** : La réponse au reset password est identique que l'email existe ou non (`"Si un compte existe..."`) — empêche de deviner les comptes.

2. **Token reset sécurisé (ligne 343)** : `crypto.randomBytes(32).toString('hex')` — 256 bits d'entropie, impossible à brute-forcer.

3. **Bcrypt 10 rounds (ligne 55)** : Hachage lent volontairement — protège contre les attaques par dictionnaire si la DB est compromise.

4. **Validation mot de passe fort (ligne 223)** : Regex `/^(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#$%^&*]).{8,}$/` — majuscule + chiffre + spécial + 8 chars minimum.

5. **Transaction atomique register (ligne 57-73)** : Utilisateur + Candidat créés ensemble — si une opération échoue, rien n'est persisté.

---

### FICHIER 4 : `backend/models/index.js`

**Niveau de criticité : ÉLEVÉ**

**Rôle :**
Point d'entrée des modèles — charge les 10 modèles et déclare toutes les associations Sequelize.

**Pattern :** Factory Function (chaque modèle est une fonction qui reçoit sequelize + DataTypes)

**Associations déclarées :**

```
Utilisateur 1:1 Candidat    (CASCADE delete)
Utilisateur 1:1 Institut    (CASCADE delete)
Institut    1:N Programme   (CASCADE delete)
Candidat    N:N Programme   via Candidature
Candidature 1:N Media       (polymorphique)
Utilisateur 1:N Notification
Candidat    N:N Programme   via Favori
Candidature 1:1 PreInscription
```

**Polymorphisme Media (lignes 47-68) :**
Un Media peut appartenir à un Candidat OU à un Institut. L'association `constraints: false` est nécessaire car Sequelize ne peut pas créer une vraie FK vers deux tables différentes. Le discriminant `type_proprietaire` identifie le type.

---

### FICHIER 5 : `frontend/src/context/AuthContext.tsx`

**Niveau de criticité : ÉLEVÉ**

**Rôle :**
État global d'authentification — persiste le JWT, expose les fonctions login/logout, valide silencieusement la session au démarrage.

**Comportement au démarrage (useEffect ligne 59-106) :**

```
1. Lire token + user depuis localStorage
2. Si absents → loading=false, fin
3. Affichage optimiste : setUser(storedUser) immédiatement (pas d'écran blanc)
4. GET /auth/me en arrière-plan (validation silencieuse)
   → Si OK : rafraîchir le profil (validation_status peut avoir changé)
   → Si KO : logout (token expiré ou révoqué)
```

**Pourquoi l'affichage optimiste ?**
Sans ça, à chaque rechargement de page, l'utilisateur verrait un spinner pendant la validation. L'affichage optimiste évite ce flash d'interface.

**`construireUser()` (lignes 20-45) :**
Normalise la réponse backend en un objet `User` typé côté frontend. Centralise la logique de mapping `profil.id → candidat_id` ou `→ institut_id`.

---

### FICHIER 6 : `frontend/src/services/api.ts`

**Niveau de criticité : ÉLEVÉ**

**Rôle :**
Client HTTP centralisé — toutes les requêtes API passent obligatoirement ici.

**Intercepteur requête (lignes 27-37) :**
```typescript
// Auto-injection du JWT
const token = localStorage.getItem('auth_token');
if (token) config.headers.set('Authorization', `Bearer ${token}`);

// FormData : supprimer Content-Type pour laisser le navigateur
// ajouter le boundary multipart automatiquement
if (config.data instanceof FormData) {
  config.headers.delete('Content-Type');
}
```

**Intercepteur réponse (lignes 40-57) :**
```typescript
// 401 avec token présent = session expirée → logout
if (status === 401 && localStorage.getItem('auth_token')) {
  // → redirect /login
}
// 403 → redirect /
```

**Pourquoi ne pas faire de `fetch()` direct dans les pages ?**
1. Duplication du code d'injection JWT dans chaque composant
2. Gestion d'erreur inconsistante
3. Impossible de changer le baseURL en un seul endroit
4. Testabilité difficile

---

### FICHIER 7 : `frontend/src/components/ProtectedRoute.tsx`

**Niveau de criticité : MOYEN**

**Rôle :**
Garde les routes dashboard — trois niveaux de protection :

```
1. Loading → spinner
2. Non authentifié → redirect /login
3. Mauvais rôle → redirect /
4. Institut suspendu → écran plein blocage
5. OK → rend les enfants
```

**Ce que le jury peut demander :**
"Est-ce suffisant comme sécurité côté frontend ?"

**Réponse :**
Non, et c'est voulu. La vraie sécurité est côté backend (JWT + authMiddleware + restrictTo). Le ProtectedRoute est juste de l'UX — il évite d'afficher une page vide si le backend renvoie 403. Un utilisateur malveillant peut bypasser le frontend, mais pas le backend.

---

### FICHIER 8 : `diploma-verifier/app/services/orchestrator.py`

**Niveau de criticité : CŒUR MÉTIER**

**Rôle :**
Chef d'orchestre du pipeline d'analyse — 12 étapes séquentielles.

**Gestion des cas limites :**

| Cas | Comportement |
|---|---|
| Document vraiment vide (pas de texte, pas de signature, pas de cachet) | Early return score 5-18 (déterministe) |
| Pas un diplôme (diploma_confidence < 0.2) ET pas de signaux visuels | Early return score 5-25 |
| Erreur fatale | Score fallback 5-20 (déterministe, basé sur hash filename) |
| Tampering detector planté | Graceful degradation, fraud_score=0, pipeline continue |

**Déterminisme :**
Même fichier → même score toujours. Utilisation de SHA-256 comme graine de Random pour éviter la variabilité non-maîtrisée.

---

### FICHIER 9 : `diploma-verifier/app/services/scoring_engine.py`

**Niveau de criticité : CŒUR MÉTIER**

**Rôle :**
Moteur de scoring — 6 sous-scores + caps de sécurité + score global.

**Architecture V7 Phase 2 :**

```
compute_subscores()
      │
      ▼ SubscoreBundle {
          structure_score:          0-100
          semantic_score:           0-100
          critical_fields_score:    0-100
          visual_authenticity_score: 0-100
          fraud_score:              0-100 (INVERSÉ)
          ocr_confidence_score:     0-100
        }
      │
      ▼
compute_global_trust_score()
  1. Poids dynamiques (si OCR faible → moins de poids texte, plus visuel)
  2. Somme pondérée (fraud_trust = 100 - fraud_score)
  3. Caps de sécurité (6 caps)
  4. Clamp [3, 98]
  │
  ▼
compute_risk_level() : trusted | review_recommended | suspicious | highly_suspicious
      │
      ▼
risk_level_to_confidence() : high | medium | low | very_low
```

**Pourquoi le score ne va jamais à 0 ni à 100 ?**
- 0 = certitude absolue de faux → impossible en heuristique
- 100 = certitude absolue d'authentique → impossible sans vérification humaine
- Plage [3, 98] : honnêteté épistémique

**Fraud_trust (ligne 970) :**
`fraud_trust = 100 - fraud_score`
Le `fraud_score` est INVERSÉ dans la somme pondérée car plus il est élevé, moins on fait confiance au document. Cette inversion permet de l'intégrer naturellement dans la somme positive.

---

## 6. ANALYSE DU CODE LIGNE PAR LIGNE

### 6.1 candidatureWorkflow.js — soumettre() — Analyse détaillée

```javascript
// ══ ÉTAPE 1 : Vérifier la transition ══════════════════════════
validerTransition('candidat', candidature.statut, 'soumise');
// → Lève une exception si statut est terminal ('acceptee', 'refusee')
// → Vérifie que brouillon → soumise est autorisé pour le rôle 'candidat'
// → Un candidat ne peut PAS aller de 'soumise' à autre chose

// ══ ÉTAPE 2 : Transaction ACID ════════════════════════════════
return sequelize.transaction(async (t) => {
// → Toutes les opérations suivantes sont atomiques
// → Si une échoue → rollback automatique de tout

  // ── A. Auto-update profil avec whitelist ──────────────────
  const maj = {};
  for (const champ of CHAMPS_PROFIL_AUTORISES) {
    if (profil[champ] !== undefined) maj[champ] = profil[champ];
  }
  // → Ignore silencieusement 'role', 'est_actif', 'email'...
  // → Sécurité : mass-assignment impossible

  await candidat.update(maj, { transaction: t });
  // Le hook beforeValidate du modèle Candidat sera déclenché
  // (validation CIN/passeport selon nationalité)

  // ── B. Vérification profil ───────────────────────────────
  const profilCheck = verifierProfilComplet(candidat);
  if (!profilCheck.complet) {
    throw { status: 400, manquants_profil: profilCheck.manquants };
    // → Le frontend peut afficher précisément quels champs manquent
  }

  // ── C. Vérification documentaire ─────────────────────────
  const docCheck = await verifierCompletude(candidature);
  // → Compare documents_soumis (JSONB) vs documents_requis du programme
  // → Lookup O(1) via Set (optimisation)
  if (!docCheck.complet) {
    throw { status: 400, manquants: docCheck.manquants };
  }

  // ── D. OCR non-bloquant ───────────────────────────────────
  const resultatVerif = await verifierDiplome(cheminFichier, docDiplome.nom);
  // → Si le microservice est down → resultatVerif.succes = false
  // → La soumission continue quand même (non-bloquant !)
  // → Le score est stocké dans notes_institut pour l'instituteur

  // ── E. Changement de statut + notifications ───────────────
  await candidature.update({ statut: 'soumise' }, { transaction: t });
  await notif.notifierChangementStatut(candidature, ancien_statut, 'soumise', t);
  await notif.notifierNouvelleCandidate(candidature, t);
  // → Les notifications sont dans la MÊME transaction
  // → Si la notif échoue → rollback + le statut n'est PAS changé
});
```

### 6.2 authMiddleware.js — Analyse complète

```javascript
const authMiddleware = async (req, res, next) => {
  // 1. Extraction du token
  const authHeader = req.headers.authorization;
  // Format attendu : "Bearer eyJhbGci..."
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Token manquant...' });
  }

  const token = authHeader.split(' ')[1];

  // 2. Vérification cryptographique
  const decoded = jwt.verify(token, process.env.JWT_SECRET);
  // → Si la signature est invalide → JsonWebTokenError → catch → 401
  // → Si expiré → TokenExpiredError → catch → 401
  // → Si OK → decoded = { id: 'uuid', role: 'candidat', iat, exp }

  // 3. Vérification DB (compte toujours actif ?)
  const utilisateur = await Utilisateur.findByPk(decoded.id, {
    attributes: ['id', 'role', 'est_actif', 'first_login_completed'],
    // → attributes limités : on ne charge PAS le mot de passe
  });

  // 4. Résolution du profil lié
  if (utilisateur.role === 'institut') {
    const institut = await Institut.findOne({
      where: { utilisateur_id: utilisateur.id },
      attributes: ['id', 'validation_status', 'suspension_reason'],
    });

    if (institut?.validation_status === 'suspended') {
      return res.status(403).json({
        code: 'ACCOUNT_SUSPENDED',
        reason: institut.suspension_reason,
        // → Le frontend affiche l'écran de suspension avec le motif
      });
    }
    user.institut_id = institut.id;
    // → Utilisé dans les guards pour vérifier ownership
  }

  req.user = user;
  next(); // → Passe au middleware ou controller suivant
};
```

### 6.3 scoring_engine.py — compute_global_trust_score() — Analyse

```python
def compute_global_trust_score(subscores, ...):
    # 1. Poids dynamiques selon qualité OCR
    weights = _compute_dynamic_weights_v7(subscores)
    # Si ocr_confidence_score < 50 :
    # → réduit le poids semantic (-40%)
    # → réduit le poids structure (-30%)
    # → augmente le poids visual_authenticity (+5%)
    # Raison : si l'OCR a raté, les signaux textuels sont peu fiables

    # 2. Inversion fraud (INVERSÉ dans la somme)
    fraud_trust = 100 - subscores.fraud_score
    # fraud_score = 80 (très suspect) → fraud_trust = 20 (pénalise fort)
    # fraud_score = 0 (clean) → fraud_trust = 100 (bonus maximum)

    # 3. Somme pondérée
    raw = sum(weights[k] * values[k] for k in weights)
    # Exemple document authentique typique :
    # structure=85 × 0.14 = 11.9
    # semantic=70  × 0.10 = 7.0
    # cf_score=90  × 0.20 = 18.0
    # visual=80    × 0.10 = 8.0
    # fraud_trust=95 × 0.36 = 34.2
    # ocr_conf=80  × 0.10 = 8.0
    # TOTAL = 87.1 → score "trusted"

    # 4. Caps de sécurité
    # → no_content (structure=0 ET sémantique<10) → cap 18
    # → hallucination (texte court + pas de degree/date) → cap 18
    # → semantic_ceiling (sémantique<15 ET score>70) → cap 70
    # → template (visual>80 ET CF<40) → cap 50
    # → fraud_hard_cap (fraud>80) → cap 35

    # 5. Clamp final [3, 98]
    final = int(round(max(V7_SCORE_MIN, min(V7_SCORE_MAX, raw))))
```

### 6.4 AuthContext.tsx — Affichage optimiste + validation silencieuse

```typescript
useEffect(() => {
  // Étape 1 : Lecture du cache localStorage
  const storedToken = localStorage.getItem('auth_token');
  const storedUser = lireUtilisateurStocke();

  if (!storedToken || !storedUser) {
    setLoading(false); // → Pas de session → rendu immédiat
    return;
  }

  // Étape 2 : AFFICHAGE OPTIMISTE
  // On affiche l'UI immédiatement sans attendre la validation réseau
  setToken(storedToken);
  setUser(storedUser);
  setLoading(false); // ← loading=false AVANT la requête réseau !
  // → L'utilisateur voit son dashboard immédiatement

  // Étape 3 : Validation silencieuse en arrière-plan
  axios.get('/auth/me', { headers: { Authorization: `Bearer ${storedToken}` } })
    .then(({ data }) => {
      // Rafraîchir le profil (ex: validation_status peut avoir changé)
      const freshedUser = construireUser(data.utilisateur, profil);
      localStorage.setItem('auth_user', JSON.stringify(freshedUser));
      setUser(freshedUser); // → UI mise à jour silencieusement
    })
    .catch(() => {
      // Token expiré ou révoqué → logout propre
      localStorage.removeItem('auth_token');
      localStorage.removeItem('auth_user');
      setToken(null);
      setUser(null);
      // → ProtectedRoute détecte isAuthenticated=false → redirect /login
    });
}, []);
```

---

## 7. QUESTIONS PROBABLES DU JURY — AVEC RÉPONSES

### 7.1 Questions sur l'architecture

---

**Q : Pourquoi avoir choisi une architecture monolithique avec microservice au lieu d'une architecture microservices complète ?**

**Réponse courte :** Le périmètre fonctionnel du projet ne justifiait pas la complexité opérationnelle des microservices. Le diploma-verifier est naturellement isolé car il est stateless, CPU-intensif, et peut être scalé indépendamment.

**Réponse longue soutenance :**
> "Nous avons adopté une architecture hybride : un backend monolithique pour le cœur métier (où les entités sont fortement couplées — candidature, programme, institution, notification), et un microservice isolé pour la vérification documentaire. Ce choix est justifié par plusieurs raisons : le microservice est stateless (pas de DB, pas d'authentification), il peut être scalé horizontalement indépendamment si la charge OCR augmente, et il utilise un stack technologique différent (Python/FastAPI) plus adapté au traitement d'images. Une architecture microservices complète aurait introduit de la complexité réseau inutile pour des entités qui doivent être cohérentes dans la même transaction ACID."

---

**Q : Comment garantissez-vous la cohérence des données lors d'une soumission de candidature ?**

**Réponse :**
> "Via les transactions ACID de Sequelize sur PostgreSQL. Dans `soumettre()`, la mise à jour du profil candidat, la vérification documentaire, la vérification OCR (stockage du score), le changement de statut et les notifications sont tous dans la même transaction. Si une étape échoue, PostgreSQL fait un rollback automatique. La seule exception est la vérification OCR qui est non-bloquante : si le microservice est indisponible, on log un warning mais la soumission continue — la plateforme ne doit pas dépendre de la disponibilité du microservice pour sa fonction principale."

---

**Q : Pourquoi PostgreSQL et non MongoDB ?**

**Réponse :**
> "PostgreSQL a été choisi pour plusieurs raisons. D'abord, nos données sont fortement relationnelles : candidats, programmes, instituts, candidatures forment un graphe d'entités avec des contraintes d'intégrité importantes (FK, CASCADE). Ensuite, nous utilisons les transactions ACID pour le workflow de candidature — MongoDB en mode standalone n'offrait pas les transactions multi-documents avec la même robustesse. Enfin, PostgreSQL supporte le type JSONB qui nous permet d'avoir des champs flexibles (documents_soumis, adresse, contact) sans sacrifier la performance — les colonnes JSONB sont indexables."

---

**Q : Quelle est la différence entre un middleware et un controller ?**

**Réponse :**
> "Un middleware est une fonction qui s'exécute avant le controller et qui peut modifier la requête, renvoyer une réponse anticipée ou passer la main. Il implémente des préoccupations transversales : authentification (authMiddleware), contrôle d'accès (isAdmin, restrictTo), rate limiting, upload de fichiers. Un controller gère UNE ressource spécifique : il extrait les paramètres, appelle le service métier, et formate la réponse. La règle est que le controller doit être aussi mince que possible — la logique métier est dans les services."

---

### 7.2 Questions sur la sécurité

---

**Q : Comment protégez-vous l'API contre les attaques par force brute ?**

**Réponse :**
> "Deux niveaux de rate limiting via express-rate-limit : un limiteur global de 600 requêtes par 15 minutes par IP sur toutes les routes `/api/*`, et un limiteur strict de 20 requêtes par 15 minutes sur `/api/auth/login` avec `skipSuccessfulRequests: true` (une connexion réussie ne compte pas). Si la limite est dépassée, le serveur répond avec 429 et un message JSON standardisé. Ces limites sont surchargeables via variables d'environnement pour le déploiement."

---

**Q : Comment stockez-vous les mots de passe ?**

**Réponse :**
> "Nous utilisons bcrypt avec 10 rounds de salt. Bcrypt est un algorithme de hachage adaptatif — le coût computationnel peut être augmenté au fil du temps. À 10 rounds, le hachage prend environ 100ms sur un serveur moderne, ce qui rend les attaques par dictionnaire prohibitivement lentes. Le mot de passe n'est jamais retourné dans les réponses API : nous utilisons l'attribut `exclude: ['mot_de_passe']` dans les queries Sequelize. Le token JWT ne contient que `{ id, role }` — jamais le mot de passe ni d'information sensible."

---

**Q : Comment prévenez-vous les attaques par injection SQL ?**

**Réponse :**
> "Sequelize ORM génère des requêtes paramétrées (prepared statements) automatiquement. Toutes nos interactions avec PostgreSQL passent par Sequelize — nous n'écrivons jamais de SQL brut avec concaténation de chaînes. Pour les recherches textuelles comme le filtre `?search=`, nous utilisons `Op.iLike` de Sequelize qui échappe correctement les caractères spéciaux. L'upload de fichiers est géré par Multer avec validation du type MIME et une limite de taille de 5 Mo."

---

**Q : Que se passe-t-il si le JWT est volé ?**

**Réponse :**
> "C'est la limitation classique des JWT stateless. Notre mitigation est la durée de vie courte (7 jours) et la vérification du statut `est_actif` en base de données à chaque requête — si un compte est désactivé par un admin, le JWT devient immédiatement invalide même s'il n'est pas expiré. La colonne `jeton_rafraichissement` existe dans le schéma pour un futur refresh token flow qui permettrait des JWT de courte durée (15 minutes) avec rotation des tokens. Ce n'est pas implémenté dans le MVP par contrainte de temps."

---

**Q : Qu'est-ce que le mass-assignment et comment le prévenez-vous ?**

**Réponse :**
> "Le mass-assignment est une vulnérabilité où un attaquant envoie des champs supplémentaires dans un body JSON et ceux-ci sont persistés sans validation. Par exemple, un candidat pourrait envoyer `{ role: 'admin' }` dans le body de soumission et, sans protection, le serveur le persisterait. Nous l'évitions via la whitelist explicite `CHAMPS_PROFIL_AUTORISES` dans `candidatureWorkflow.js` : seuls les champs déclarés dans cette liste peuvent être mis à jour par un candidat. Tout autre champ est ignoré silencieusement."

---

### 7.3 Questions sur les performances

---

**Q : Quels sont les problèmes de performance potentiels de votre backend ?**

**Réponse honnête :**
> "Nous avons identifié plusieurs points d'amélioration. D'abord, un problème potentiel de N+1 queries dans `GET /api/instituts` : pour chaque institut, une requête séparée charge ses programmes. La solution est d'utiliser `separate: true` ou `include` avec `limit` dans Sequelize. Ensuite, la pagination est appliquée sur les listings principaux (programmes, instituts, candidatures admin) avec un maximum de 100 par page, mais pas encore sur toutes les routes. L'OCR est le goulot d'étranglement majeur : une analyse peut prendre 2-5 secondes en fonction de la taille du fichier — c'est pourquoi la vérification est non-bloquante dans le workflow."

---

**Q : Pourquoi 5 passes OCR en parallèle ?**

**Réponse :**
> "Tesseract a des performances très variables selon la langue du document et la combinaison de langues utilisée. Sur un diplôme tunisien, le français et l'arabe peuvent coexister. Une seule passe avec `fra+eng+ara` peut faire baisser la qualité de reconnaissance de chaque langue individuellement. Nous exécutons 5 configurations en parallèle via `ThreadPoolExecutor` : `ara`, `fra`, `eng`, `ara+fra`, `fra+eng`. Pour chaque résultat, nous calculons un score sémantique (nombre de mots-clés de diplôme reconnus). Le résultat avec le meilleur score sémantique — ou le plus long texte en cas d'égalité — est retenu."

---

### 7.4 Questions sur l'OCR et les heuristiques

---

**Q : Pourquoi des heuristiques et non un modèle de deep learning pour la vérification ?**

**Réponse longue soutenance :**
> "Plusieurs raisons justifient ce choix. Premièrement, un modèle de classification supervisé nécessite un corpus d'entraînement étiqueté de diplômes authentiques et falsifiés tunisiens — nous n'en disposons pas. Les modèles pré-entraînés comme MantraNet sont entraînés sur des datasets comme CASIA, qui contient principalement des images de nature, pas des documents administratifs tunisiens. Deuxièmement, les heuristiques sont explicables : chaque sous-score (structure, semantic, critical_fields, visuel, tampering) a une interprétation métier claire. Un jury académique ou un institut peuvent comprendre pourquoi un document a obtenu un score de 45. Un réseau de neurones serait une boîte noire. Troisièmement, notre pipeline déterministe garantit que le même fichier produit toujours le même score — pas de variance due au non-déterminisme GPU."

---

**Q : Quelles sont les limites de votre système OCR ?**

**Réponse honnête :**
> "Plusieurs limites connues. Premièrement, l'arabe manuscrit : Tesseract gère bien l'arabe imprimé mais mal l'arabe manuscrit ou les calligraphies stylisées. Deuxièmement, la qualité du scan : des diplômes photographiés avec un smartphone en mauvaise lumière ou avec un angle prononcé produisent des résultats OCR dégradés. Nous avons mis en place une auto-rotation pour corriger les légères inclinaisons, mais pas les transformations perspectives complexes. Troisièmement, la divergence Tesseract 5.4 (Windows) vs 5.5 (Docker Linux) : les versions produisent des outputs légèrement différents pour certains caractères arabes. Nous avons des caps anti-hallucination dans le scoring engine pour atténuer ces variations."

---

**Q : Qu'est-ce que l'ELA (Error Level Analysis) et comment l'utilisez-vous ?**

**Réponse :**
> "L'ELA est une technique de détection de manipulation d'images basée sur les artefacts de compression JPEG. Quand une image JPEG est re-compressée, les zones non modifiées montrent un niveau d'erreur uniforme, tandis que les zones qui ont été copiées-collées ou modifiées depuis une source avec un niveau de compression différent montrent des niveaux d'erreur anormalement élevés ou bas. Dans notre `tampering_detector.py`, nous re-compressons l'image à 90% de qualité JPEG et calculons la différence absolue avec l'original. Les régions avec un niveau d'erreur > seuil sont marquées comme suspectes. Combiné avec la transformée DCT, cela constitue notre premier composant de détection de falsification."

---

**Q : Pourquoi le fraud_trust a-t-il le poids le plus élevé (0.36) dans le score global ?**

**Réponse :**
> "C'est un choix délibéré de politique de risque. Sur une plateforme académique, un faux diplôme est plus préjudiciable qu'un vrai diplôme mal scoré. Autrement dit : un faux négatif (accepter un faux) est plus coûteux qu'un faux positif (rejeter un vrai pour re-vérification manuelle). En donnant 36% du score à l'absence de tampering, nous nous assurons que même un document structurellement parfait sera fortement pénalisé s'il présente des signes de manipulation. Le score global ne peut pas dépasser 35 si fraud_score > 80, via le cap `fraud_hard_cap`."

---

### 7.5 Questions sur React / Frontend

---

**Q : Pourquoi Context API et non Redux pour la gestion d'état ?**

**Réponse :**
> "Le Context API est suffisant pour notre besoin : un état global simple (utilisateur authentifié, token) partagé dans toute l'application. Redux introduce de la complexité (actions, reducers, middleware) qui se justifie pour des états complexes avec de nombreuses transformations. Pour une plateforme de notre taille, Context API offre une solution plus légère et nativement supportée par React. Pour des besoins de caching côté client (éviter les re-fetches), TanStack Query serait une évolution naturelle — c'est documenté dans nos TODOs."

---

**Q : Pourquoi Vite plutôt que Create React App ?**

**Réponse :**
> "Vite utilise ES Modules natifs en développement — le serveur de dev ne bundle pas le code, il le sert directement au navigateur. La différence de performance est significative : démarrage en < 500ms contre 10-30s pour CRA sur les gros projets. En production, Vite utilise Rollup pour le bundling optimisé. Tailwind CSS v4 utilise également un plugin Vite natif qui intègre le scanning CSS directement dans le pipeline de build, sans étape PostCSS séparée."

---

**Q : Qu'est-ce qu'un Custom Hook et pourquoi en avez-vous créé autant ?**

**Réponse :**
> "Un Custom Hook est une fonction dont le nom commence par `use` et qui peut appeler d'autres hooks React. Nous en avons créé un par ressource métier : `usePrograms`, `useCandidatures`, `useFavoris`, etc. Chaque hook encapsule le cycle de vie d'une requête API : état initial loading, appel API, mise à jour de l'état, gestion d'erreur, fonction de re-fetch. Sans ces hooks, chaque page devrait ré-implémenter ce pattern — c'est de la duplication. Avec les hooks, une page n'a qu'à appeler `const { programmes, loading, error } = usePrograms(filtres)` et l'UI se met à jour automatiquement."

---

### 7.6 Questions sur Docker et déploiement

---

**Q : Pourquoi Docker uniquement pour le diploma-verifier ?**

**Réponse :**
> "Le diploma-verifier a des dépendances système complexes : Tesseract OCR 5.x, OpenCV, les modèles spaCy (fr_core_news_sm, xx_ent_wiki_sm), et potentiellement PyTorch pour MantraNet. Ces dépendances sont difficiles à installer de manière reproductible sur différentes plateformes (Windows vs Linux). Docker garantit que l'environnement est identique en développement, test et production. Le backend Node.js et le frontend React ont des dépendances purement npm — facilement gérables sans conteneur. C'est un choix pragmatique : on conteneurise ce qui en a besoin."

---

### 7.7 Questions sur les limitations

---

**Q : Quelles seraient vos priorités d'amélioration si vous aviez 3 mois supplémentaires ?**

**Réponse :**
> "Trois priorités. Premièrement, les tests automatisés : zéro tests actuellement — nous ferions Jest + Supertest côté backend pour le workflow de candidature, et React Testing Library côté frontend pour les composants critiques. Deuxièmement, le refresh token flow : les JWT expirent en 7 jours, une colonne `jeton_rafraichissement` existe mais n'est pas utilisée — implémenter la rotation de tokens avec des access tokens de 15 minutes. Troisièmement, calibrer MantraNet : obtenir des poids validés sur un corpus de diplômes tunisiens et activer le 6e composant de tampering detection. Actuellement MantraNet est désactivé (`MANTRANET_ENABLED=False`) car nous n'avons pas de corpus de calibration."

---

**Q : Votre système peut-il détecter un faux diplôme généré par IA ?**

**Réponse honnête :**
> "Partiellement. Le critical_fields_validator V7 a été conçu spécifiquement pour ce cas : un diplôme généré par IA a souvent une structure parfaite (tous les champs présents, cachet, signature) mais manque d'une identité étudiante réelle — pas de nom de candidat spécifique, pas de date précise, pas de spécialisation. Le cap 'template' dans le scoring engine détecte ce pattern (visual_authenticity > 80 ET critical_fields < 40) et plafonne le score à 50. Cependant, un diplôme IA avec une vraie identité injectée serait très difficile à détecter sans un corpus d'entraînement. C'est pourquoi MantraNet (détection pixel-level) est prévu mais pas encore calibré."

---

## 8. FORCES ET FAIBLESSES DU PROJET

### 8.1 Forces

#### Architecture et design

| Force | Explication |
|---|---|
| **Séparation des responsabilités** | Controller mince / Service métier / Modèle — chaque couche a UN rôle |
| **Transactions ACID** | Workflow de candidature atomique — cohérence garantie |
| **Whitelist anti-mass-assignment** | Sécurité défensive sur les mises à jour de profil |
| **Microservice isolé** | OCR stateless, scalable indépendamment, en Python natif |
| **Déterminisme scoring** | Même fichier → même score toujours (hash-based noise) |

#### Sécurité

| Force | Explication |
|---|---|
| **JWT + vérification DB** | Révocation immédiate possible même sans expiration token |
| **Bcrypt 10 rounds** | Protection contre vol de DB + dictionnaires |
| **Rate limiting 2 niveaux** | Anti-brute-force login + protection globale API |
| **Anti-énumération reset** | Réponse identique email connu ou inconnu |
| **ProtectedRoute + authMiddleware** | Double sécurité (UX + API) |
| **optionalAuth** | Routes publiques avec conscience du rôle sans blocage |

#### UX et fonctionnalités

| Force | Explication |
|---|---|
| **Affichage optimiste** | Pas d'écran blanc au rechargement |
| **Bilingue FR/EN** | i18next + détection automatique de langue |
| **Scoring explicable** | 6 sous-scores + raisons humaines (pas de boîte noire) |
| **Non-bloquant OCR** | La soumission réussit même si le verifier est down |
| **Workflow institut complet** | Invitation email → first login → validation admin → suspension |

### 8.2 Faiblesses honnêtes

#### Techniques

| Faiblesse | Degré | Mitigation actuelle / Plan |
|---|---|---|
| **Zéro tests automatisés** | Élevé | Validation manuelle via Swagger + scripts curl |
| **Pas de refresh token** | Moyen | JWT 7j acceptable MVP, colonne présente pour évolution |
| **N+1 queries instituts** | Faible | Pagination limite le volume, `separate: true` prévu |
| **Logs non structurés** | Faible | `console.log` + logger Python — Winston prévu |
| **Pas d'audit trail** | Moyen | `cree_le`/`mis_a_jour_le` présents, table AuditLog non implementée |

#### OCR

| Faiblesse | Explication | Défense |
|---|---|---|
| **Arabe manuscrit** | Tesseract LSTM raté sur calligraphies | Score faible → vérification manuelle déclenchée |
| **Qualité scan** | Smartphone = bruit → OCR dégradé | Caps anti-hallucination dans scoring engine |
| **MantraNet désactivé** | Pas de poids calibrés sur corpus tunisien | Architecture prête, plan de calibration documenté |
| **Tesseract 5.4 vs 5.5** | Légère divergence Windows/Docker | Atténuée par normalisation du texte avant hashing |

### 8.3 Comment défendre ces choix intelligemment

**Pour les tests manquants :**
> "Nous avons priorisé l'implémentation fonctionnelle pour le MVP. L'architecture est conçue pour être testable : les services sont découplés des controllers, le workflow de candidature est une fonction pure testable sans HTTP. Les tests seraient la première priorité d'une phase suivante."

**Pour MantraNet désactivé :**
> "Activer un modèle de deep learning sans corpus de calibration serait pire que de ne pas l'activer — des faux positifs systématiques nuiraient à la confiance des candidats. Le choix de désactiver par défaut (`MANTRANET_ENABLED=False`) est une décision de qualité, pas un abandon."

**Pour l'absence de refresh token :**
> "Un JWT de 7 jours est acceptable pour un MVP où l'utilisateur se reconnecte régulièrement. La suspension de compte via `est_actif=false` offre une révocation immédiate qui compense l'absence de rotation automatique."

---

## 9. VOCABULAIRE SOUTENANCE

### Termes techniques à maîtriser

| Terme | Définition simple | Définition technique |
|---|---|---|
| **JWT** | Badge numérique d'identité | JSON Web Token signé HMAC-SHA256, payload { id, role }, TTL configurable |
| **ACID** | Garantie de cohérence BDD | Atomicité, Cohérence, Isolation, Durabilité — propriétés des transactions PostgreSQL |
| **OCR** | Extraction de texte d'une image | Optical Character Recognition — Tesseract LSTM multi-langue |
| **REST** | Style d'API web standardisé | Representational State Transfer — stateless, resources, HTTP verbs |
| **SPA** | Application web sans rechargement | Single Page Application — React router côté client |
| **ORM** | Abstraction de la base de données | Object-Relational Mapper — Sequelize mappe les classes JS → tables SQL |
| **Middleware** | Filtre de requête HTTP | Fonction Express(req, res, next) — intercepte avant le controller |
| **Heuristique** | Règle empirique approximative | Règle dérivée de l'observation, pas d'entraînement supervisé |
| **ELA** | Détection de retouche image | Error Level Analysis — artefacts JPEG révélant les zones modifiées |
| **NER** | Extraction d'entités nommées | Named Entity Recognition — spaCy identifie personnes, organisations, dates |
| **JSONB** | JSON stocké efficacement | Binary JSON PostgreSQL — indexable, requêtable avec opérateurs GIN |
| **Rate limiting** | Limite de débit réseau | Compteur par IP + fenêtre glissante — protection anti-abus |
| **UUID v4** | Identifiant unique aléatoire | 128 bits d'entropie — non-devinable, pas de séquence exposée |
| **Stateless** | Sans état côté serveur | Chaque requête contient toutes ses informations — pas de session serveur |
| **Whitelist** | Liste blanche autorisée | Inverse de blacklist — seuls les éléments listés sont acceptés |
| **Polymorphisme** | Même interface, types différents | Media appartient à Candidat OU Institut selon `type_proprietaire` |
| **Affichage optimiste** | Réponse UI avant confirmation | UI mise à jour avant validation serveur pour améliorer la réactivité perçue |
| **Hard cap** | Plafond infranchissable | Score ne peut pas dépasser X quelle que soit la somme pondérée |
| **Graceful degradation** | Dégradation propre | Composant non critique en erreur → valeur par défaut, pipeline continue |
| **Shadow run** | Exécution parallèle pour comparaison | V6 et V7 calculent en parallèle pendant la migration, on logue la divergence |

---

## RÉSUMÉ POUR SOUTENANCE — À RETENIR ABSOLUMENT

### Les 5 décisions architecturales clés à expliquer

1. **Transactions ACID dans candidatureWorkflow.js** : Toutes les étapes de soumission (profil, docs, OCR score, statut, notifications) sont dans UNE transaction. Cohérence ou rien.

2. **JWT + vérification DB à chaque requête** : Le middleware ne fait pas confiance au seul JWT — il vérifie que l'utilisateur existe encore et n'est pas suspendu. Coût : 1 requête DB par requête. Bénéfice : révocation immédiate.

3. **OCR non-bloquant** : La vérification du diplôme ne bloque pas la soumission. Si le microservice est down → log warning → soumission réussie. La plateforme de candidature ne doit pas dépendre de la disponibilité du verifier.

4. **Heuristiques explicables vs Deep Learning** : Le scoring V7 produit 6 sous-scores avec interprétation métier claire. Un institut peut comprendre pourquoi un diplôme est suspect. Pas de boîte noire.

5. **Whitelist anti-mass-assignment** : `CHAMPS_PROFIL_AUTORISES` est une liste explicite des champs qu'un candidat peut modifier. Sécurité défensive : ignore silencieusement tout champ non listé.

### Les 3 points forts à valoriser

1. **Workflow complet de bout en bout** : De l'invitation de l'institut jusqu'à la pré-inscription post-acceptation, en passant par la vérification OCR — le cycle de vie complet est implémenté.

2. **Vérification documentaire V7** : Pipeline déterministe multi-score avec détection de templates officiels sans identité, tampering ELA/DCT, et scoring explicable.

3. **i18n bilingue FR/EN** : Toutes les chaînes UI passent par i18next — aucune chaîne en dur dans les composants.

### Les 3 limitations à admettre proactivement

1. Zéro tests automatisés — première priorité d'évolution.
2. MantraNet désactivé — architecture prête, calibration sur corpus réel nécessaire.
3. Refresh token non implémenté — JWT 7j acceptable MVP, colonne présente.

---

*Document généré le 2026-05-18 pour la soutenance PFE EduBridge.*
*Contient : architecture ASCII, flux détaillés, analyse code, 25+ questions jury, forces/faiblesses, vocabulaire.*

---

# 10. CHATBOT EDUBRIDGE ASSISTANT — ANALYSE COMPLÈTE

## 10.1 Vue d'ensemble

Le chatbot EduBridge est un **assistant conversationnel à base de règles (rule-based)**, intégré directement dans la plateforme. Il répond aux questions des candidats en français ET en anglais, sans recours à un LLM (Large Language Model) ni à une API IA externe.

**Composants impliqués :**

```
CANDIDAT (navigateur)
       │
       ▼
ChatbotButton.tsx     ← Bouton FAB flottant (bottom-right)
       │ ouvre
       ▼
ChatbotPanel.tsx      ← Interface chat (panel 380x560px)
       │ POST fetch()
       ▼
/api/chatbot/message  ← Route Express publique (sans authMiddleware)
       │
       ▼
chatbotController.js  ← Thin controller (8 lignes)
       │ appelle
       ▼
chatbotService.js     ← Moteur de matching d'intents (~1000 lignes)
       │
       ▼
{ text, suggestions, link }   ← Réponse structurée JSON
```

**Caractéristiques clés :**
- **Public** : pas d'authentification requise, accessible aux visiteurs non connectés
- **Caché** pour les rôles `admin` et `institut` (inutile pour eux)
- **Bilingue** FR/EN : chaque intent a deux versions de réponse
- **Stateless** : aucune session, aucun historique de conversation conservé en base
- **Non-bloquant** : fetch() direct sans passer par le client axios centralisé

---

## 10.2 Architecture dossier chatbot

### `backend/routes/chatbotRoutes.js`

**Rôle :** Route Express minimale — 1 seule route publique.

```javascript
router.post('/message', chatbotController.sendMessage);
// Montée dans index.js sous /api/chatbot
```

**Pourquoi publique ?**
Un visiteur non connecté doit pouvoir poser des questions sur les programmes et l'inscription avant de créer un compte. L'authMiddleware bloquerait cette UX.

**Risque et mitigation :**
La route publique est couverte par le rate limiter global (600 req/15min/IP). Aucune donnée sensible n'est retournée — uniquement du texte statique.

---

### `backend/controllers/chatbotController.js`

**Rôle :** Controller ultra-mince — 8 lignes de logique.

**Ce qu'il fait :**
1. Extrait `{ message, lang }` du body
2. Valide que le message n'est pas vide
3. Normalise la langue (`lang === 'en' ? 'en' : 'fr'`, fallback FR)
4. Délègue à `chatbotService.processMessage()`
5. Retourne `{ success: true, data: { response } }`

**Pattern appliqué :** Thin Controller — zéro logique métier ici.

---

### `backend/services/chatbotService.js`

**Rôle :** Cœur du chatbot — base de connaissances + moteur de matching.

**Structure du fichier :**

```
chatbotService.js
├── INTENTS[]          ← ~50 intents dans 11 catégories
│   ├── { id, keywords[], response{}, response_en{} }
│   └── ...
├── FALLBACK_FR        ← Réponse par défaut si aucun match
├── FALLBACK_EN        ← Idem en anglais
└── processMessage()   ← Algorithme de scoring et sélection
```

**11 catégories d'intents :**

| # | Catégorie | Exemples d'intents |
|---|---|---|
| 1 | Candidature & Dossier | apply_how, apply_status, apply_tracking, apply_deadline |
| 2 | Documents & Upload | docs_required, docs_diploma, docs_upload, docs_verification |
| 3 | Programmes & Recherche | programs_find, programs_engineering, programs_compare, programs_filter |
| 4 | Instituts & Accréditations | institutes_list, accreditation_what, accreditation_types |
| 5 | Compte & Authentification | auth_register, auth_login, auth_reset_password |
| 6 | Guide plateforme | guide_how_platform, faq_account, faq_candidature |
| 7 | Pré-inscription | post_accepted, post_interview, post_enrollment, post_rejected |
| 8 | Vie étudiante en Tunisie | life_cost, life_housing, life_transport, life_food, life_safety |
| 9 | Frais & Financement | fees_tuition, fees_payment, fees_scholarship, fees_compare |
| 10 | Étudiants Internationaux | intl_visa, intl_residence |
| 11 | Post-Admission | post_accepted, post_rejected |

**Structure d'un intent :**

```javascript
{
  id: 'apply_how',
  keywords: ['comment', 'candidater', 'postuler', 'soumettre', 'apply', ...],
  response: {
    text: "Pour candidater sur EduBridge...",
    suggestions: ["Documents requis", "Trouver un programme"],
    link: { label: "Parcourir les programmes", path: "/search" }
  },
  response_en: {
    text: "To apply on EduBridge...",
    suggestions: ["Required documents", "Find a program"],
    link: { label: "Browse programs", path: "/search" }
  }
}
```

---

## 10.3 Algorithme de matching — Analyse détaillée

```javascript
function processMessage(rawMessage, lang = 'fr') {

  // ── 1. Nettoyage et tokenisation ──────────────────────────────
  const cleaned = rawMessage
    .toLowerCase()           // "Comment CANDIDATER ?" → "comment candidater ?"
    .trim()
    .replace(/[.,!?;:'"()\[\]]/g, ' ')  // retire la ponctuation
    .replace(/\s+/g, ' ');  // normalise les espaces

  const words = cleaned.split(' ').filter(w => w.length > 2);
  // Filtre les mots trop courts ("le", "la", "de") → moins de bruit

  // ── 2. Scoring de chaque intent ───────────────────────────────
  let bestIntent = null;
  let bestScore  = 0;

  for (const intent of INTENTS) {
    let score = 0;

    for (const word of words) {
      for (const keyword of intent.keywords) {

        if (word === keyword) {
          score += 3;   // Match EXACT — signal fort
          break;        // Un seul bonus par mot
        }
        if (word.includes(keyword) || keyword.includes(word)) {
          score += 1;   // Match PARTIEL — signal faible
          // Ex: "candidatures" includes "candidature" → +1
          break;
        }
      }
    }

    if (score > bestScore) {
      bestScore  = score;
      bestIntent = intent;
    }
  }

  // ── 3. Sélection de la réponse ────────────────────────────────
  if (bestScore === 0 || !bestIntent) {
    return lang === 'en' ? FALLBACK_EN : FALLBACK_FR;
    // Aucun mot reconnu → réponse générique avec suggestions
  }

  if (lang === 'en' && bestIntent.response_en) {
    return bestIntent.response_en;  // Version anglaise si demandée
  }
  return bestIntent.response;       // Version française par défaut
}
```

**Exemple concret de scoring :**

Message : `"Comment soumettre mon dossier de candidature ?"`

Tokens : `["comment", "soumettre", "mon", "dossier", "candidature"]`
Tokens filtres > 2 chars : `["comment", "soumettre", "dossier", "candidature"]`

```
Intent apply_how    keywords: ['comment', 'candidater', 'soumettre', ...]
  → "comment" === "comment"     +3
  → "soumettre" === "soumettre" +3
  → "dossier" inclus dans kw?  +1 (partiel avec "dossier")
  → SCORE = 7

Intent docs_required keywords: ['documents', 'dossier', ...]
  → "dossier" === "dossier"     +3
  → SCORE = 3

Meilleur : apply_how (score=7) → réponse "Pour candidater sur EduBridge..."
```

**Limites du matching par mots-clés :**
- Pas de compréhension sémantique : "quelle est la procédure pour envoyer mon dossier ?" peut rater si "procédure" et "envoyer" ne sont pas dans les keywords
- Pas de gestion du contexte conversationnel : chaque message est traité indépendamment
- Pas de correction orthographique : "candidaure" ne matche pas "candidature"

---

## 10.4 Interface utilisateur — ChatbotPanel.tsx et ChatbotButton.tsx

### Structure du panel

```
┌──────────────────────────────────────────┐
│  [Bot] EduBridge Assistant    [X]         │  ← Header bleu #2563EB
│  • En ligne                               │
├──────────────────────────────────────────┤
│                                          │
│  [Assistant] Bonjour ! Je suis...        │  ← Bulle grise (gauche)
│  [Candidater ?] [Documents ?] [Comparer?]│  ← Suggestions chips
│                                          │
│              [Comment candidater?] [User] │  ← Bulle bleue (droite)
│                                   10:32  │
│                                          │
│  [Assistant] Pour candidater...          │
│  [Documents requis] [Suivi] [Programme]  │
│  [→ Parcourir les programmes]            │  ← Link button
│                                          │
│  [●●●]                                   │  ← Typing indicator (animé)
├──────────────────────────────────────────┤
│  [Candidater?] [Docs?] [Comparer?] ...   │  ← Quick actions (1er msg)
├──────────────────────────────────────────┤
│  [ Posez votre question... ]        [→]  │  ← Input + Send button
└──────────────────────────────────────────┘
```

### Fonctionnalités UX remarquables

**1. Message de bienvenue (useEffect ligne 64-69) :**
```typescript
useEffect(() => {
  if (isOpen && !hasWelcomed) {
    setMessages([buildWelcome()]);
    setHasWelcomed(true);
  }
}, [isOpen, hasWelcomed]);
```
→ S'affiche UNE seule fois par session. Si on ferme et rouvre le panel, le message de bienvenue ne réapparait pas.

**2. Reset bilingue (useEffect ligne 71-75) :**
```typescript
useEffect(() => {
  setHasWelcomed(false);
  setMessages([]);
}, [i18n.language]);
```
→ Quand l'utilisateur change de langue (FR↔EN), la conversation est remise à zéro et le message de bienvenue réapparait dans la nouvelle langue.

**3. Auto-scroll (useEffect ligne 78-80) :**
```typescript
useEffect(() => {
  messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
}, [messages, isLoading]);
```
→ Scroll automatique vers le bas à chaque nouveau message ET pendant le chargement (typing indicator).

**4. Placeholder rotatif (useEffect ligne 82-88) :**
Toutes les 3 secondes, le placeholder de l'input change parmi 4 suggestions de questions. Nettoyage du `setInterval` via le return de useEffect (pas de fuite mémoire).

**5. Typing indicator :**
```tsx
{isLoading && (
  <div>
    <span animate-bounce style={{ animationDelay: '0ms' }} />
    <span animate-bounce style={{ animationDelay: '150ms' }} />
    <span animate-bounce style={{ animationDelay: '300ms' }} />
  </div>
)}
```
3 points qui rebondissent en décalé de 150ms — simulation de frappe.

**6. Quick Actions :**
Visibles UNIQUEMENT quand `messages.length <= 1` (seulement le message de bienvenue). Disparaissent dès que le candidat pose sa première question pour libérer l'espace.

**7. Suggestions chips :**
Chaque réponse du chatbot peut inclure des `suggestions[]` cliquables. Un clic sur une suggestion appelle directement `sendMessage(suggestion)` — pas de re-saisie.

**8. Link button :**
Chaque réponse peut inclure un `link: { label, path }`. Le clic ferme le panel ET navigue vers la route React correspondante.

### ChatbotButton.tsx — Bouton FAB

```typescript
// Visible uniquement pour les candidats (et visiteurs)
if (user?.role === 'admin' || user?.role === 'institut') return null;

// Badge unread count (style WhatsApp)
{unreadCount > 0 && (
  <span className="absolute -top-1 -right-1 ... bg-red-500">
    {unreadCount > 9 ? '9+' : unreadCount}
  </span>
)}
```

**Compteur de non-lus :**
`handleNewAssistantMessage()` incrémente `unreadCount` uniquement si le panel est FERMÉ. Quand on ouvre le panel, `unreadCount` est remis à 0.

---

## 10.5 Flux complet message → réponse

```
UTILISATEUR tape "comment candidater" + appuie Entrée
      │
      ▼
handleKeyDown → sendMessage(input)
      │
      ▼
État : setIsLoading(true)
      Ajoute bulle user à messages[]
      Vide l'input
      │
      ▼
fetch(`${API_URL}/chatbot/message`, {
  method: 'POST',
  body: JSON.stringify({ message: "comment candidater", lang: "fr" })
})
      │
      ▼  HTTP POST
chatbotController.sendMessage
  → chatbotService.processMessage("comment candidater", "fr")
    → tokens: ["comment", "candidater"]
    → best: apply_how (score=6)
    → return response.text + suggestions + link
      │
      ▼  JSON
{ success: true, data: { response: { text: "...", suggestions: [...], link: {...} } } }
      │
      ▼
addAssistantMessage({ text, suggestions, link })
setIsLoading(false)
      │
      ▼
UI : bulle assistant apparaît + chips suggestions + bouton lien
     Auto-scroll vers le bas
```

---

## 10.6 Analyse code — chatbotService.processMessage()

### Nettoyage du message (lignes 955-960)

```javascript
const cleaned = rawMessage
  .toLowerCase()
  .trim()
  .replace(/[.,!?;:'"()\[\]]/g, ' ')  // ponctuation → espace
  .replace(/\s+/g, ' ');              // espaces multiples → un seul
```

**Pourquoi supprimer la ponctuation ?**
"Comment candidater ?" → sans nettoyage, "?" resterait collé à "candidater" et "candidater?" ne matcherait pas le keyword "candidater".

### Filtre de longueur (ligne 961)

```javascript
const words = cleaned.split(' ').filter(w => w.length > 2);
```

Filtre les mots de 1-2 caractères : "je", "la", "le", "de", "un", "ma", "à"... Ces mots sont du bruit sans valeur sémantique pour le matching d'intents.

### Scoring dual (lignes 968-978)

```javascript
if (word === keyword) {
  score += 3; break;           // Match exact : très fort signal
}
if (word.includes(keyword) || keyword.includes(word)) {
  score += 1; break;           // Match partiel : signal faible
}
```

**Asymétrie intentionnelle :**
- `word.includes(keyword)` : "candidatures" contient "candidature" → +1
- `keyword.includes(word)` : "cand" est contenu dans "candidater" → +1

Le `break` après chaque match évite de compter plusieurs fois le même mot contre plusieurs keywords du même intent.

### Réponse structurée

```javascript
{
  text: "Pour candidater...",           // Texte principal (multiline)
  suggestions: ["Docs ?", "Statut ?"], // 2-3 boutons suggérés
  link: { label: "...", path: "/..." } // Navigation contextuelle
}
```

La réponse `text` utilise `\n` pour les sauts de ligne — le composant React les affiche avec `whitespace-pre-wrap`.

---

## 10.7 Questions probables du jury sur le chatbot

---

**Q : Pourquoi un chatbot rule-based et non un LLM comme ChatGPT ?**

**Réponse courte :** Contrôle total, déterminisme, coût zéro, zéro dépendance externe.

**Réponse longue soutenance :**
> "Plusieurs raisons justifient ce choix. Premièrement, un LLM nécessite une API payante (OpenAI, Anthropic, Mistral) avec des coûts variables difficiles à budgétiser pour un MVP. Deuxièmement, les réponses d'un LLM sont non-déterministes — la même question peut donner des réponses différentes, certaines potentiellement incorrectes sur les programmes ou les instituts spécifiques à la Tunisie. Troisièmement, la confidentialité : les messages des candidats (nom, situation académique) transiteraient par un serveur externe. Notre approche rule-based garantit que les réponses sont 100% contrôlées, auditables et exactes. Le domaine est suffisamment borné (candidature, programmes, vie étudiante) pour être couvert efficacement par ~50 intents."

---

**Q : Quelles sont les limites de votre algorithme de matching ?**

**Réponse honnête :**
> "Notre algorithme souffre de trois limitations principales. Premièrement, l'absence de correction orthographique : 'candidaure' ne matche pas 'candidature'. Deuxièmement, l'absence de contexte conversationnel : chaque message est analysé indépendamment, donc une question de suivi comme 'et pour les frais ?' sans contexte retourne une réponse générique. Troisièmement, les synonymes non listés : 'postuler à une école' peut rater si 'école' n'est pas dans les keywords. Une amélioration naturelle serait d'utiliser un moteur de NLP léger comme spaCy pour la lemmatisation et l'expansion de synonymes, sans aller jusqu'à un LLM."

---

**Q : Pourquoi la route chatbot est-elle publique ?**

**Réponse :**
> "Le chatbot sert principalement à guider des visiteurs non inscrits : 'Quels programmes y a-t-il ?', 'Comment créer un compte ?', 'Quels sont les frais ?'. Forcer l'authentification avant de pouvoir poser ces questions créerait une friction inutile et découragerait les inscriptions. La sécurité est assurée par le rate limiter global (600 req/15min/IP) — il est impossible de flooder le service depuis une seule IP. Le service ne retourne aucune donnée sensible, uniquement du texte statique pré-écrit."

---

**Q : Pourquoi le chatbot n'utilise pas le client axios centralisé de api.ts ?**

**Réponse :**
> "Le chatbot est une fonctionnalité accessible aux visiteurs non authentifiés. Le client axios centralisé dans api.ts a un intercepteur de réponse qui redirige vers /login sur une erreur 401. Si un visiteur non connecté utilisait ce client, une erreur réseau temporaire pourrait déclencher cette redirection de façon inattendue. En utilisant fetch() natif directement, on évite ce comportement. C'est un choix délibéré pour isoler la logique du chatbot de l'infrastructure d'authentification."

---

**Q : Pourquoi le chatbot est-il masqué pour les rôles admin et institut ?**

**Réponse :**
> "Le chatbot répond aux questions de candidature, programmes et vie étudiante — des informations utiles uniquement pour les candidats. Un admin a le dashboard de gestion, un institut a son dashboard de candidatures. Afficher le chatbot pour ces rôles créerait de la confusion dans l'interface et du bruit inutile. La logique est dans ChatbotButton.tsx : `if (user?.role === 'admin' || user?.role === 'institut') return null;` — le composant n'est tout simplement pas monté."

---

**Q : Comment étendriez-vous le chatbot si vous aviez plus de temps ?**

**Réponse :**
> "Trois axes d'évolution. Premièrement, le contexte conversationnel : conserver l'historique des 3 derniers échanges et l'envoyer avec chaque nouvelle requête pour permettre les questions de suivi ('et pour les frais ?' après 'quels programmes à Sousse ?'). Deuxièmement, la lemmatisation : utiliser compromise.js ou un dictionnaire de synonymes pour 'postuler' = 'candidater' = 'soumettre'. Troisièmement, les analytics : logger les messages sans réponse (score=0) pour identifier les lacunes et enrichir les intents. À terme, si le trafic justifie l'investissement, un LLM fine-tuné sur les données EduBridge remplacerait le matching par mots-clés."

---

## 10.8 Forces et faiblesses du chatbot

### Forces

| Force | Explication |
|---|---|
| **Gratuit et stateless** | Aucune API externe, aucune base de données, aucun coût variable |
| **Déterministe** | Même question = même réponse toujours |
| **Bilingue natif** | Chaque intent a FR et EN, commutation sans ré-apprentissage |
| **Réponse structurée** | text + suggestions + link = UX guidée, pas juste du texte |
| **Non-bloquant** | Si le backend plante, l'erreur est capturée et une suggestion générique est affichée |
| **Scope borné** | ~50 intents couvrent 95% des questions d'un candidat tunisien |
| **Reset bilingue** | Conversation remise à zéro proprement au changement de langue |

### Faiblesses honnêtes

| Faiblesse | Degré | Mitigation |
|---|---|---|
| **Pas de contexte** | Élevé | Chaque message est indépendant |
| **Pas de correction ortho** | Moyen | Suggestions chips guident vers les bonnes formulations |
| **Synonymes non couverts** | Moyen | Keywords étendus manuellement par catégorie |
| **Maintenance manuelle** | Moyen | Ajout d'un intent = modification du code |
| **Pas d'analytics** | Faible | On ne sait pas quelles questions sont non répondues |

### Comment défendre intelligemment

**"Votre chatbot est trop simple, pourquoi pas GPT ?"**
> "Pour un MVP sur un domaine borné, un chatbot rule-based est plus fiable et plus contrôlable qu'un LLM. Nos réponses sont exactes sur les programmes tunisiens parce qu'elles sont écrites manuellement. Un LLM pourrait halluciner des informations sur les frais, les accréditations ou les dates limites — ce qui serait préjudiciable pour des candidats qui prennent des décisions d'orientation sérieuses."

---

## 10.9 Diagramme d'état — Conversation chatbot

```
VISITEUR ARRIVE
      │
      ▼
[ChatbotButton visible]
  (masqué si admin/institut)
      │ clic
      ▼
Panel ouvert → Message bienvenue
  + 6 Quick Actions
      │
      │─── Clic quick action ──────────────────┐
      │                                         │
      │ Saisie texte + Entrée                  │
      ▼                                         ▼
isLoading = true               sendMessage(quickAction)
bulle user ajoutée                    │
input vidé                            │
      │                               │
      ▼                               │
POST /api/chatbot/message ◄───────────┘
      │
      ▼
processMessage() → scoring → bestIntent
      │
      ├── score > 0 → response du bestIntent
      └── score = 0 → FALLBACK (réponse générique)
      │
      ▼
addAssistantMessage({ text, suggestions, link })
isLoading = false
Auto-scroll
      │
      ├── Clic suggestion → sendMessage(suggestion)  [boucle]
      ├── Clic link button → navigate(path) + ferme panel
      └── Saisie nouvelle question                   [boucle]
```

---

## 10.10 Récapitulatif chatbot pour la soutenance

### À retenir absolument

1. **Rule-based, pas LLM** : scoring par mots-clés (`+3` exact, `+1` partiel), ~50 intents, 11 catégories, ~1000 lignes de base de connaissances.

2. **Route publique intentionnelle** : visiteur non connecté → peut poser des questions → réduit la friction à l'inscription.

3. **Bilingue natif** : pas de traduction automatique, deux versions manuelles par intent pour garantir la qualité.

4. **Réponse structurée** : `{ text, suggestions[], link }` → UX guidée avec navigation contextuelle intégrée.

5. **Stateless** : aucune conversation en base, aucun historique — simplifie le déploiement et la scalabilité.

6. **Masqué admin/institut** : ChatbotButton ne se monte pas pour ces rôles — UX propre.

### Chiffres à citer en soutenance

- `~50 intents` dans `11 catégories`
- `2 langues` : FR et EN, 2 versions manuelles par intent
- `1 seule route` : POST /api/chatbot/message
- `0 base de données` : stateless
- `0 API externe` : self-hosted, coût variable = 0
- Score max d'un intent = `nb_mots_communs × 3` (matches exacts)

---

*Section chatbot ajoutée le 2026-05-19.*
