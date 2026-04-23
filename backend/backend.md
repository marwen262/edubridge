# Documentation Architecturale - Backend EduBridge

**Version:** 1.0.0  
**Date:** Avril 2026  
**Stack:** Node.js + Express + PostgreSQL + Sequelize ORM  
**Environnement:** Production / Développement

---

## Table des matières

1. [Vue globale de l'architecture](#1-vue-globale-de-larchitecture)
2. [Structure du projet](#2-structure-du-projet)
3. [Modules et services](#3-modules-et-services)
4. [Base de données](#4-base-de-données)
5. [Modèles de données](#5-modèles-de-données)
6. [API existante](#6-api-existante)
7. [Authentification et autorisation](#7-authentification-et-autorisation)
8. [Gestion des fichiers et médias](#8-gestion-des-fichiers-et-médias)
9. [Logique métier principale](#9-logique-métier-principale)
10. [Points forts et problèmes](#10-points-forts-et-problèmes)
11. [Suggestions d'amélioration](#11-suggestions-damélioration)
12. [Gestion des pièces d'identité](#12-gestion-des-pièces-didentité)
13. [Seeders (données de démonstration)](#13-seeders-données-de-démonstration)

---

## 1. Vue globale de l'architecture

### Description générale

EduBridge est un **backend monolithique** (Node.js/Express) qui facilite la mise en relation entre **candidats (étudiants)** et **instituts (écoles d'ingénieurs) tunisiennes**. Le système gère un **workflow de candidature complet** : création de dossiers, soumission, examen et notification des résultats.

**Type d'architecture :** Monolithique avec séparation en couches (MVC-like)

### Diagramme logique

```
┌─────────────────────────────────────────────────────────────┐
│                      FRONTEND (React)                       │
└───────────────────┬─────────────────────────────────────────┘
                    │
                    ▼ (HTTP REST)
┌─────────────────────────────────────────────────────────────┐
│                   EXPRESS GATEWAY                           │
│  • CORS middleware                                          │
│  • Body parser (JSON/urlencoded)                            │
│  • Static file server (/uploads)                            │
└───────────────────┬─────────────────────────────────────────┘
                    │
        ┌───────────┼───────────┐
        ▼           ▼           ▼
    ┌────────┐  ┌────────┐  ┌──────────┐
    │ Routes │  │Auth    │  │ Error    │
    │        │  │Handler │  │ Handler  │
    └────┬───┘  └────┬───┘  └──────────┘
         │           │
         └─────┬─────┘
              ▼
    ┌──────────────────────────────────┐
    │     CONTROLLERS (Controllers/)    │
    │  • authController                │
    │  • utilisateurController                │
    │  • candidatureController         │
    │  • programmeController             │
    │  • institutController           │
    │  • favoriController            │
    └──────────────┬───────────────────┘
                   │
                   ▼
    ┌──────────────────────────────────┐
    │  BUSINESS LOGIC (Services/)      │
    │  • candidatureWorkflow.js        │
    │  • notificationService.js        │
    └──────────────┬───────────────────┘
                   │
                   ▼
    ┌──────────────────────────────────┐
    │     MODELS (ORM - Sequelize)     │
    │  • Utilisateur ├─────┐           │
    │  • Candidat    │     ├─► Roles   │
    │  • Institut    ├─────┘           │
    │  • Programme                     │
    │  • Candidature                   │
    │  • Notification                  │
    │  • Media                         │
    │  • Favori                        │
    └──────────────┬───────────────────┘
                   │
                   ▼
    ┌──────────────────────────────────┐
    │    PostgreSQL Database           │
    │    (8 tables relationnelles)     │
    └──────────────────────────────────┘
```

### Flux général (Request → Response)

```
1. CLIENT REQUEST
   └─ HTTP POST/GET/PUT/DELETE + JWT Bearer Token

2. MIDDLEWARE CHAIN
   ├─ CORS check
   ├─ Body parsing
   ├─ JWT verification (authMiddleware)
   ├─ Role/permission checks (restrictTo, isAdmin)
   └─ Business rule guards (verifierPropriete, interdireStatutTerminal)

3. CONTROLLER
   └─ Parse request → Call service → Format response

4. SERVICE (Business Logic)
   └─ Validations métier
   └─ Transactions ACID
   └─ Side effects (notifications, file uploads)
   └─ Return result or throw error

5. ORM (Sequelize)
   └─ SQL queries to PostgreSQL

6. DATABASE
   └─ CRUD operations with constraints

7. RESPONSE
   └─ JSON with status code + data/error message
```

---

## 2. Structure du projet

```
backend/
├── index.js                    # Point d'entrée, serveur Express principal
├── package.json               # Dépendances (Express, Sequelize, JWT, Multer, etc.)
├── .env                       # Variables d'environnement (DB credentials, JWT_SECRET)
├── .sequelizerc               # Configuration CLI Sequelize
│
├── config/
│   ├── config.js              # Configuration Sequelize pour migrations
│   └── database.js            # Connexion Sequelize/PostgreSQL
│
├── models/                    # Modèles de données (8 entités MVP)
│   ├── index.js               # Chargement et associations
│   ├── Utilisateur.js         # Compte d'authentification (candid, institut, admin)
│   ├── Candidat.js            # Profil étudiant (1:1 avec Utilisateur)
│   ├── Institut.js            # Profil école (1:1 avec Utilisateur)
│   ├── Programme.js           # Formation (1:N avec Institut)
│   ├── Candidature.js         # Dossier de candidature (N:N candidats ↔ programmes)
│   ├── Notification.js        # Message applicatif
│   ├── Media.js               # Fichier uploadé (polymorphique)
│   └── Favori.js              # Lien candidat ↔ programme (N:N)
│
├── controllers/               # Endpoints HTTP (couche mince)
│   ├── authController.js      # POST /register, /login, GET /me
│   ├── utilisateurController.js # CRUD Utilisateur + profils Candidat/Institut
│   ├── candidatureController.js # Workflow candidatures (brouillon, soumis, statut)
│   ├── programmeController.js # CRUD Programmes
│   ├── institutController.js  # CRUD Instituts
│   └── favoriController.js    # Toggle/GET favoris
│
├── routes/                    # Montage des routes (factory pattern)
│   ├── authRoutes.js          # /api/auth
│   ├── utilisateurRoutes.js   # /api/utilisateurs
│   ├── candidatureRoutes.js   # /api/candidatures (le plus complexe)
│   ├── programmeRoutes.js     # /api/programmes
│   ├── institutRoutes.js      # /api/instituts
│   └── favoriRoutes.js        # /api/favoris
│
├── middleware/                # Middlewares Express
│   ├── authMiddleware.js      # Vérification JWT + résolution profil
│   ├── upload.js              # Configuration Multer (stockage disque, filtres)
│   └── candidatureGuards.js   # Garde-fous métier (propriété, statut terminal)
│
├── services/                  # Logique métier (épaisse)
│   ├── candidatureWorkflow.js # Moteur de workflow complet (transitions, validations)
│   └── notificationService.js # Création de notifications automatiques
│
├── migrations/                # Migrations Sequelize (schéma BD)
│   ├── 20260420120000-creation-tables-edubridge.js  # 8 tables MVP
│   └── 20260421000000-add-identite-candidat.js      # CIN/Passeport candidat
│
├── seeders/                   # Seeders (données de démonstration)
│   ├── 20260001000000-admin.js          # 1 admin
│   ├── 20260002000000-instituts.js      # 3 instituts (ESPRIT, MedTech, Polytechnique)
│   ├── 20260003000000-programmes.js     # 11 programmes
│   ├── 20260004000000-candidats.js      # 3 candidats (2 tunisiens, 1 international)
│   ├── 20260005000000-candidatures.js   # 6 dossiers (couvre les 6 statuts)
│   ├── 20260006000000-favoris.js        # 5 favoris
│   └── 20260007000000-notifications.js  # 6 notifications
│
├── scripts/
│   └── reset-schema.js        # Utilitaire de reset BD
│
├── uploads/                   # Dossier physique des fichiers uploadés
│   └── (fichiers user generated)
│
└── docs/
    └── WORKFLOW_CANDIDATURE.md # Guide du workflow (tests, endpoints)
```

### Rôle de chaque dossier

| Dossier | Responsabilité | Exemple |
|---------|----------------|---------|
| `config/` | Configuration BD (Sequelize CLI) | Lectu env vars, dialecte PostgreSQL |
| `models/` | Schéma BD + relations ORM | Définition tables, FK, validations |
| `controllers/` | Endpoints HTTP (couche API) | Parse req, appelle service, répond JSON |
| `routes/` | Montage des routes Express | Groupe endpoints par module (`/api/auth`, `/api/utilisateurs`) |
| `middleware/` | Middlewares (filtrage, auth, validations) | JWT, permissions, guards métier |
| `services/` | Logique métier (épaisse) | Workflow, notifications, transactions |
| `migrations/` | Historique schéma BD | Version de table, migrations DDL |
| `uploads/` | Stockage disque fichiers | Documents candidats (CV, diplômes, etc.) |
| `docs/` | Documentation projet | Guides, exemples, tests |

---

## 3. Modules et services

### 3.1 Module d'authentification (Auth)

**Rôle :** Gestion des comptes utilisateurs, inscription, connexion, tokens JWT

**Endpoints principaux :**
- `POST /api/auth/register` — Inscription (candidat ou institut)
- `POST /api/auth/login` — Connexion par email + mot de passe
- `GET /api/auth/me` — Profil courant + profil lié (candidat ou institut)

**Responsabilités :**
- Validation emails et mots de passe
- Hash bcryptjs (10 rounds)
- Génération JWT (7j par défaut)
- Transactions atomiques (Utilisateur + profil liés)
- Excluir mots de passe en réponse

**Hypothèse détectée :** Refresh tokens (`jeton_rafraichissement`) sont sauvegardés en BD mais **pas utilisés** actuellement.

---

### 3.2 Module utilisateurs (Utilisateurs)

**Rôle :** Gestion des comptes et profils (Candidat ou Institut)

**Endpoints :**
- `GET /api/utilisateurs` — Tous les utilisateurs (admin)
- `GET /api/utilisateurs/:id` — Profil d'un utilisateur
- `PUT /api/utilisateurs/:id` — Mise à jour compte + profil
- `DELETE /api/utilisateurs/:id` — Suppression (admin)

**Responsabilités :**
- CRUD Utilisateur + profil Candidat ou Institut
- Whitelist de champs éditables par rôle
- Auto-édition + admin override

---

### 3.3 Module instituts (Instituts)

**Rôle :** Gestion des écoles d'ingénieurs, profils publics, listings

**Endpoints :**
- `GET /api/instituts` — Listing publique (filtres : nom, vérifié)
- `GET /api/instituts/:id` — Détail avec programmes
- `POST /api/instituts` — Créer (admin)
- `PUT /api/instituts/:id` — Modifier (admin ou institut propriétaire)
- `DELETE /api/instituts/:id` — Supprimer (admin)

**Responsabilités :**
- Profils écoles (nom, sigle, description, logo, accréditations)
- Support JSONB (adresse, contact)
- Recherche case-insensitive sur nom

**Données clés :**
- Statut `est_verifie` (pour filtres frontend)
- Notations (champ `note`)
- Accréditations (CTI, ABET, ENAEE, etc.)

---

### 3.4 Module programmes (Programs)

**Rôle :** Gestion des formations proposées par les instituts

**Endpoints :**
- `GET /api/programmes` — Listing publique (filtres : domaine, niveau, mode, institut)
- `GET /api/programmes/:id` — Détail avec institut associé
- `POST /api/programmes` — Créer (admin ou institut propriétaire)
- `PUT /api/programmes/:id` — Modifier (admin ou institut propriétaire)
- `DELETE /api/programmes/:id` — Supprimer (admin ou institut propriétaire)

**Responsabilités :**
- CRUD formations (nom, domaine, niveau, durée)
- Documents requis et prérequis (JSONB)
- Calcul capacité et date limite candidature
- Isolation institut (un institut ne peut éditer que ses programmes)

**Énumérés :**
- **Domaine :** informatique, génie civil, électrique, mécanique, chimie, agronomie, finance, management
- **Niveau :** cycle préparatoire, licence, master, ingénieur
- **Mode :** cours du jour, cours du soir, alternance, formation continue

---

### 3.5 Module candidatures (Applications) — **CŒUR MÉTIER**

**Rôle :** Workflow complet de candidature (brouillon → soumis → examen → résultat)

**Endpoints :**
- `POST /api/candidatures` — Créer brouillon (candidat)
- `PUT /api/candidatures/:id` — Modifier brouillon (candidat, + upload docs)
- `POST /api/candidatures/:id/soumettre` — Soumettre dossier complet (candidat)
- `PATCH /api/candidatures/:id/statut` — Transition de statut (institut/admin)
- `GET /api/candidatures/mine` — Mes candidatures (candidat)
- `GET /api/candidatures/institute/list` — Candidatures reçues (institut)
- `GET /api/candidatures` — Toutes (filtres, admin)
- `GET /api/candidatures/:id` — Détail
- `DELETE /api/candidatures/:id` — Suppression (admin)

**Responsabilités (via `candidatureWorkflow.js`) :**
- Gestion d'état fini : `brouillon` → `soumise` → `en_examen` → (`acceptee` | `refusee` | `liste_attente`)
- Transitions autorisées par rôle
- Validation complétude documents avant soumission
- Empêche doublons candidat ↔ programme
- Upload Multer (CV, diplôme, lettre, etc.)
- Notifications automatiques
- Transactions ACID

**Statuts :**

| Statut | Transitions autorisées | Sens |
|--------|------------------------|------|
| `brouillon` | → `soumise` | Candidat soumet quand docs complets |
| `soumise` | → `en_examen` (inst/adm) | Institut commence examen |
| `en_examen` | → `acceptee` / `refusee` / `liste_attente` | Verdict |
| `acceptee` | Aucune | Terminal |
| `refusee` | Aucune | Terminal |
| `liste_attente` | → `acceptee` / `refusee` | Peut évoluer |

---

### 3.6 Module favoris (Favorites)

**Rôle :** Gestion des programmes favoris des candidats (N:N)

**Endpoints :**
- `GET /api/favoris/mine` — Mes favoris (candidat)
- `POST /api/favoris` — Toggle favori (crée ou supprime)
- `DELETE /api/favoris/:programme_id` — Retirer des favoris

**Responsabilités :**
- Relationship N:N candidats ↔ programmes
- Unicité garantie par index unique (candidat_id, programme_id)
- Simple toggle (POST crée ou détruit)

---

### 3.7 Services utilitaires

#### **candidatureWorkflow.js** — Moteur de workflow

Gère la **logique métier complète** des candidatures :

```javascript
Exports:
├── creerBrouillon()         # Crée + uploade fichiers initiaux
├── mettreAJourBrouillon()   # Ajoute docs, modifie lettre
├── soumettre()              # Valide complétude + passe en soumise
└── changerStatut()          # Transition d'état (inst/adm)

Helpers internes (privés):
├── _creerMedia()            # Crée entrée Media BD
├── _fichiersEnDocuments()   # Transforme Multer → JSONB
├── validerTransition()      # Vérifie matrice transitions
├── verifierCompletude()     # Vérifie docs obligatoires
├── verifierDoublon()        # Empêche doublons
└── verifierProgrammeActif() # Vérifie programme ouvert

Constantes:
├── STATUTS_TERMINAUX        # ['acceptee', 'refusee']
└── TRANSITIONS              # Matrice rôle → statut → statuts permis
```

Chaque opération est dans une **transaction Sequelize** pour garantir consistance.

#### **notificationService.js** — Notifications automatiques

Crée des **notifications applicatives** lors d'événements :

```javascript
Exports:
├── notifierChangementStatut() # Notifie candidat quand statut change
├── notifierNouvelleCandidate()# Notifie institut d'une soumission
└── creerNotification()        # Helper interne

Types de notifications:
├── statut_candidature    # Changements de statut
├── nouveau_programme     # (réservé, pas encore implémenté)
├── document_manquant     # (réservé)
├── rappel_echeance       # (réservé)
└── systeme               # Génériques
```

Notifications stockées en BD + loggées console.

---

## 4. Base de données

### 4.1 Vue d'ensemble

**SGBD :** PostgreSQL 12+  
**ORM :** Sequelize 6.37.3  
**Mode :** Migrations (Sequelize CLI)  
**Timestamp :** UTC (CURRENT_TIMESTAMP)  
**UUID :** v4 (gestion native PostgreSQL)

**Nombre de tables :** 8 (MVP complet)

### 4.2 Schéma relationnel

```
┌────────────────────────────────────────────────────────────┐
│                   UTILISATEURS (racine)                    │
│  id(PK), email(UNIQUE), mot_de_passe, role(ENUM),         │
│  jeton_rafraichissement, est_actif, cree_le, mis_a_jour   │
│  Rôles: candidat, institut, admin                          │
└────────┬──────────────────────────────┬────────────────────┘
         │                              │
    1:1  │                              │  1:1
         ▼                              ▼
    ┌─────────────┐              ┌──────────────┐
    │ CANDIDATS   │              │  INSTITUTS   │
    │ (profil)    │              │  (profil)    │
    │ id(PK)      │              │  id(PK)      │
    │ util_id(FK) │              │  util_id(FK) │
    │ ...champs   │              │  ...champs   │
    │ profil      │              │  (verifié)   │
    └──────┬──────┘              └──────┬───────┘
           │                             │
           │ 1:N                         │ 1:N
           │                             ▼
           │                       ┌──────────────┐
           │                       │  PROGRAMMES  │
           │                       │  id(PK)      │
           │                       │  inst_id(FK) │
           │                       │  ...détails  │
           │                       │  est_actif   │
           │                       └──────┬───────┘
           │                             │
           │        ┌────────────────────┘
           │        │ (FK)
           │ N:N    │
           │      ┌─┴──────────────┐
           │      │                │
           └──────┤ CANDIDATURES   │
                  │ (dossier)      │
                  │ id(PK)         │
                  │ candidat_id(FK)├─────┐
                  │ programme_id(FK)     │
                  │ statut(ENUM)         │
                  │ documents_soumis(JS) │
                  │ lettre_motivation    │
                  │ soumise_le           │
                  └────────┬─────────────┘
                           │
                    1:N    │
                           ▼
            ┌──────────────────────────┐
            │ NOTIFICATIONS            │
            │ id(PK)                   │
            │ utilisateur_id(FK)       │
            │ type, titre, contenu     │
            │ ref_id, ref_type         │
            │ (polymorphe)             │
            └──────────────────────────┘

┌──────────────────────────────────────────────┐
│ N:N (sans entrée sep.):                      │
├──────────────────────────────────────────────┤
│ FAVORIS (junction table):                    │
│ id(PK), candidat_id(FK), programme_id(FK)   │
│ (candidat_id, programme_id) UNIQUE          │
└──────────────────────────────────────────────┘

┌──────────────────────────────────────────────┐
│ MEDIAS (polymorphique):                      │
├──────────────────────────────────────────────┤
│ id(PK)                                       │
│ proprietaire_id(UUID), type_proprietaire    │
│ nom_fichier, chemin, type_mime, taille      │
│ telecharge_le                                │
│ (lié via candidature.documents_soumis[]     │
│  media_id)                                   │
└──────────────────────────────────────────────┘
```

### 4.3 Relations (FK)

| De | Vers | Type | Cascade |
|---|---|---|---|
| `candidats.utilisateur_id` | `utilisateurs.id` | 1:1 | DELETE CASCADE |
| `instituts.utilisateur_id` | `utilisateurs.id` | 1:1 | DELETE CASCADE |
| `programmes.institut_id` | `instituts.id` | 1:N | DELETE CASCADE |
| `candidatures.candidat_id` | `candidats.id` | N:1 | DELETE CASCADE |
| `candidatures.programme_id` | `programmes.id` | N:1 | DELETE CASCADE |
| `notifications.utilisateur_id` | `utilisateurs.id` | N:1 | DELETE CASCADE |
| `favoris.candidat_id` | `candidats.id` | N:1 | DELETE CASCADE |
| `favoris.programme_id` | `programmes.id` | N:1 | DELETE CASCADE |
| `medias.proprietaire_id` | (polymorphe) | - | Manuel |

Toutes les relations utilisent **DELETE CASCADE** → suppression automatique des enregistrements dépendants.

### 4.4 Types de données remarquables

**JSONB** (JSON avec indexation) — Pour champs semi-structurés :

```javascript
// Candidat.adresse
{
  rue: string,
  ville: string,
  gouvernorat: string,
  code_postal: string,
  pays: string
}

// Programme.documents_requis
[
  { nom: string, obligatoire: boolean },
  ...
]

// Programme.prerequis
{
  moyenne_min: number,
  matieres: [string],
  types_bac: [string]
}

// Candidature.documents_soumis
[
  {
    nom: string,
    url: string,
    media_id: UUID,
    telecharge_le: ISO8601
  },
  ...
]

// Institut.contact
{
  telephone: string,
  email: string,
  fax?: string
}
```

**ARRAY(STRING)** — Pour énumérés simples :

```javascript
// Candidat.langues
['français', 'anglais', 'arabe']

// Institut.accreditations
['CTI', 'ABET', 'ENAEE']
```

**ENUM** — Types fermés :

- `utilisateurs.role` : `candidat`, `institut`, `admin`
- `candidats.genre` : `homme`, `femme`
- `candidats.situation_familiale` : `celibataire`, `marie`, `divorce`, `veuf`
- `candidats.type_bac` : `mathematiques`, `sciences`, `technique`, `economie`, `lettres`, `sport`
- `candidats.niveau_actuel` : `terminale`, `bac`, `licence`, `master`
- `programmes.domaine` : `informatique`, `genie_civil`, `electrique`, `mecanique`, `chimie`, `agronomie`, `finance`, `management`
- `programmes.niveau` : `cycle_preparatoire`, `licence`, `master`, `ingenieur`
- `programmes.mode` : `cours_du_jour`, `cours_du_soir`, `alternance`, `formation_continue`
- `candidatures.statut` : `brouillon`, `soumise`, `en_examen`, `acceptee`, `refusee`, `liste_attente`
- `notifications.type` : `statut_candidature`, `nouveau_programme`, `document_manquant`, `rappel_echeance`, `systeme`

### 4.5 Indexes

- `utilisateurs.email` : UNIQUE
- `candidats.utilisateur_id` : UNIQUE
- `instituts.utilisateur_id` : UNIQUE
- `favoris (candidat_id, programme_id)` : UNIQUE (composite)
- Timestamps automatiques (`cree_le`, `mis_a_jour_le`) indexés par défaut

---

## 5. Modèles de données

### 5.1 Modèle Utilisateur

**Table :** `utilisateurs`  
**Rôle :** Compte d'authentification (racine)

| Champ | Type | Nullable | Unique | Note |
|-------|------|----------|--------|------|
| `id` | UUID | ✗ | ✓ | PK, v4 auto |
| `email` | STRING | ✗ | ✓ | Validé regex |
| `mot_de_passe` | STRING | ✗ | | Hash bcrypt |
| `role` | ENUM | ✗ | | candidat\|institut\|admin |
| `jeton_rafraichissement` | STRING | ✓ | | Non utilisé actuellement |
| `est_actif` | BOOLEAN | ✗ | | Default=true |
| `cree_le` | DATE | ✗ | | CURRENT_TIMESTAMP |
| `mis_a_jour_le` | DATE | ✗ | | Auto-update |

**Associations :**
- `hasOne(Candidat)` — Un utilisateur candidat a un profil Candidat
- `hasOne(Institut)` — Un utilisateur institut a un profil Institut
- `hasMany(Notification)` — Notions adressées à l'utilisateur

---

### 5.2 Modèle Candidat

**Table :** `candidats`  
**Rôle :** Profil étudiant (1:1 avec Utilisateur)

| Champ | Type | Nullable | Note |
|-------|------|----------|------|
| `id` | UUID | ✗ | PK |
| `utilisateur_id` | UUID | ✗ | FK UNIQUE → utilisateurs |
| `prenom` | STRING | ✓ | |
| `nom` | STRING | ✓ | |
| `date_naissance` | DATEONLY | ✓ | |
| `genre` | ENUM | ✓ | homme\|femme |
| `telephone` | STRING | ✓ | |
| `adresse` | JSONB | ✓ | {rue, ville, gouvernorat, code_postal, pays} |
| `situation_familiale` | ENUM | ✓ | celibataire\|marie\|divorce\|veuf |
| `type_bac` | ENUM | ✓ | math\|sciences\|technique\|economie\|lettres\|sport |
| `moyenne_bac` | FLOAT | ✓ | |
| `annee_bac` | INTEGER | ✓ | |
| `langues` | ARRAY(STRING) | ✓ | ['français', 'anglais', ...] |
| `parcours_academique` | JSONB | ✓ | [{diplome, etablissement, annee, mention}] |
| `niveau_actuel` | ENUM | ✓ | terminale\|bac\|licence\|master |
| `photo_profil` | STRING | ✓ | URL ou chemin fichier |
| `nationalite` | STRING | ✗ | default `'tunisienne'` — voir §12 |
| `cin` | STRING | ✓ | UNIQUE, 8 chiffres — requis si tunisien |
| `numero_passeport` | STRING | ✓ | UNIQUE, 6-20 alphanum — requis si international |
| `type_piece_identite` | ENUM | ✓ | `cin`\|`passeport` — **forcé par hook**, jamais via API |
| `cree_le` | DATE | ✗ | |
| `mis_a_jour_le` | DATE | ✗ | |

**Associations :**
- `belongsTo(Utilisateur)` — Son utilisateur
- `hasMany(Candidature)` — Ses dossiers de candidature
- `hasMany(Favori)` — Ses favoris

---

### 5.3 Modèle Institut

**Table :** `instituts`  
**Rôle :** Profil école d'ingénieurs (1:1 avec Utilisateur)

| Champ | Type | Nullable | Note |
|-------|------|----------|------|
| `id` | UUID | ✗ | PK |
| `utilisateur_id` | UUID | ✗ | FK UNIQUE → utilisateurs |
| `nom` | STRING | ✗ | Nom officiel |
| `sigle` | STRING | ✓ | Sigle/abréviation |
| `description` | TEXT | ✓ | Présentation |
| `site_web` | STRING | ✓ | URL |
| `logo` | STRING | ✓ | URL ou chemin |
| `adresse` | JSONB | ✓ | {rue, ville, gouvernorat, code_postal, pays} |
| `accreditations` | ARRAY(STRING) | ✓ | ['CTI', 'ABET', ...] |
| `contact` | JSONB | ✓ | {telephone, email, fax} |
| `est_verifie` | BOOLEAN | ✗ | Default=false, pour filtres frontend |
| `note` | FLOAT | ✓ | Note/rating |
| `cree_le` | DATE | ✗ | |
| `mis_a_jour_le` | DATE | ✗ | |

**Associations :**
- `belongsTo(Utilisateur)` — Son utilisateur
- `hasMany(Programme)` — Ses formations

---

### 5.4 Modèle Programme

**Table :** `programmes`  
**Rôle :** Formation proposée par un Institut

| Champ | Type | Nullable | Note |
|-------|------|----------|------|
| `id` | UUID | ✗ | PK |
| `institut_id` | UUID | ✗ | FK → instituts |
| `titre` | STRING | ✗ | Nom du programme |
| `domaine` | ENUM | ✓ | informatique\|genie_civil\|... |
| `niveau` | ENUM | ✓ | cycle_preparatoire\|licence\|master\|ingenieur |
| `mode` | ENUM | ✓ | cours_du_jour\|cours_du_soir\|alternance\|formation_continue |
| `duree_annees` | INTEGER | ✓ | |
| `description` | TEXT | ✓ | |
| `documents_requis` | JSONB | ✓ | [{nom, obligatoire}] |
| `prerequis` | JSONB | ✓ | {moyenne_min, matieres, types_bac} |
| `frais_inscription` | FLOAT | ✓ | Montant TND |
| `date_limite_candidature` | DATEONLY | ✓ | Deadline soumission |
| `capacite` | INTEGER | ✓ | Nb places |
| `est_actif` | BOOLEAN | ✗ | Default=true, pour filtres |
| `cree_le` | DATE | ✗ | |
| `mis_a_jour_le` | DATE | ✗ | |

**Associations :**
- `belongsTo(Institut)` — L'institut qui l'offre
- `hasMany(Candidature)` — Candidatures reçues
- `hasMany(Favori)` — Mis en favori par

---

### 5.5 Modèle Candidature

**Table :** `candidatures`  
**Rôle :** Dossier de candidature (N:N candidats ↔ programmes)

| Champ | Type | Nullable | Note |
|-------|------|----------|------|
| `id` | UUID | ✗ | PK |
| `candidat_id` | UUID | ✗ | FK → candidats |
| `programme_id` | UUID | ✗ | FK → programmes |
| `statut` | ENUM | ✗ | brouillon\|soumise\|en_examen\|acceptee\|refusee\|liste_attente |
| `documents_soumis` | JSONB | ✓ | [{nom, url, media_id, telecharge_le}] |
| `lettre_motivation` | TEXT | ✓ | |
| `notes_institut` | TEXT | ✓ | Commentaires examinateur |
| `soumise_le` | DATE | ✓ | Timestamp soumission |
| `cree_le` | DATE | ✗ | |
| `mis_a_jour_le` | DATE | ✗ | |

**Statuts :**

```
brouillon → soumise → en_examen → {acceptee | refusee | liste_attente}
                      ↓
                 Statuts terminaux : acceptee, refusee
                 Liste d'attente peut évoluer vers acceptee/refusee
```

**Associations :**
- `belongsTo(Candidat)` — Candidat qui a soumis
- `belongsTo(Programme)` — Programme visé

---

### 5.6 Modèle Notification

**Table :** `notifications`  
**Rôle :** Message applicatif

| Champ | Type | Nullable | Note |
|-------|------|----------|------|
| `id` | UUID | ✗ | PK |
| `utilisateur_id` | UUID | ✗ | FK → utilisateurs |
| `type` | ENUM | ✗ | statut_candidature\|nouveau_programme\|document_manquant\|rappel_echeance\|systeme |
| `titre` | STRING | ✓ | Titre court |
| `contenu` | TEXT | ✓ | Détail |
| `est_lue` | BOOLEAN | ✗ | Default=false |
| `ref_id` | UUID | ✓ | ID entité référencée |
| `ref_type` | STRING | ✓ | Type polymorphe (Candidature, Programme, ...) |
| `cree_le` | DATE | ✗ | |

**Associations :**
- `belongsTo(Utilisateur)` — Destinataire

---

### 5.7 Modèle Media

**Table :** `medias`  
**Rôle :** Fichier uploadé (polymorphique)

| Champ | Type | Nullable | Note |
|-------|------|----------|------|
| `id` | UUID | ✗ | PK |
| `proprietaire_id` | UUID | ✗ | ID du propriétaire (Candidat ou Institut) |
| `type_proprietaire` | STRING | ✓ | 'Candidat' \| 'Institut' |
| `nom_fichier` | STRING | ✓ | Nom original |
| `chemin` | STRING | ✓ | `uploads/` + filename unique |
| `type_mime` | STRING | ✓ | application/pdf, image/jpeg, ... |
| `taille_octets` | INTEGER | ✓ | |
| `telecharge_le` | DATE | ✗ | Upload timestamp |

**Polymorphe :** Référencé depuis `candidature.documents_soumis[].media_id`

---

### 5.8 Modèle Favori

**Table :** `favoris`  
**Rôle :** Lien N:N candidat ↔ programme

| Champ | Type | Nullable | Unique | Note |
|-------|------|----------|--------|------|
| `id` | UUID | ✗ | | PK |
| `candidat_id` | UUID | ✗ | | FK → candidats |
| `programme_id` | UUID | ✗ | | FK → programmes |
| `cree_le` | DATE | ✗ | | |

**Index unique :** `(candidat_id, programme_id)` — Empêche doublons

**Associations :**
- `belongsTo(Candidat)` — Candidat qui aime
- `belongsTo(Programme)` — Programme aimé

---

## 6. API existante

### 6.1 Organisation générale

**Base URL :** `http://localhost:5000/api`  
**Format :** JSON  
**Authentification :** JWT Bearer Token (header `Authorization: Bearer <token>`)  
**Erreurs :** Codes HTTP standard + messages JSON

```json
{
  "message": "Description erreur",
  "error": "Détail technique (optionnel)"
}
```

### 6.2 Routes par module

#### **Module Auth** : `GET|POST /api/auth`

| Méthode | Route | Auth | Réponse |
|---------|-------|------|---------|
| POST | `/register` | Non | `{ token, utilisateur, profil }` (201) |
| POST | `/login` | Non | `{ token, utilisateur }` (200) |
| GET | `/me` | JWT | `{ utilisateur: {..., candidat/institut} }` (200) |

**Exemple POST /register (candidat) :**

```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "ali@test.tn",
    "password": "SecurePass123!",
    "role": "candidat",
    "prenom": "Ali",
    "nom": "Bouali"
  }'
```

**Réponse :**

```json
{
  "message": "Inscription réussie.",
  "token": "eyJhbGc...",
  "utilisateur": {
    "id": "uuid-1",
    "email": "ali@test.tn",
    "role": "candidat"
  },
  "profil": {
    "id": "uuid-2",
    "utilisateur_id": "uuid-1",
    "prenom": "Ali",
    "nom": "Bouali"
  }
}
```

---

#### **Module Users** : `GET|PUT|DELETE /api/utilisateurs`

| Méthode | Route | Auth | Rôle | Réponse |
|---------|-------|------|------|---------|
| GET | `/` | JWT | admin | `{ utilisateurs: [...] }` (200) |
| GET | `/:id` | JWT | - | `{ utilisateur: {...} }` (200) |
| PUT | `/:id` | JWT | auto\|admin | `{ utilisateur: {...} }` (200) |
| DELETE | `/:id` | JWT | admin | `{ message: "..." }` (200) |

---

#### **Module Institutes** : `GET|POST|PUT|DELETE /api/instituts`

| Méthode | Route | Auth | Rôle | Réponse |
|---------|-------|------|------|---------|
| GET | `/` | Non | - | `{ instituts: [...] }` avec programmes (200) |
| GET | `/:id` | Non | - | `{ institut: {...} }` (200) |
| POST | `/` | JWT | admin | `{ message, institut, utilisateur_id }` (201) |
| PUT | `/:id` | JWT | admin\|institut | `{ message, institut }` (200) |
| DELETE | `/:id` | JWT | admin | `{ message }` (200) |

**Filtres GET / :**
- `nom=<string>` — Recherche case-insensitive
- `est_verifie=true|false`

**Exemple GET / :**

```bash
curl "http://localhost:5000/api/instituts?nom=ENIS&est_verifie=true"
```

---

#### **Module Programs** : `GET|POST|PUT|DELETE /api/programmes`

| Méthode | Route | Auth | Rôle | Réponse |
|---------|-------|------|------|---------|
| GET | `/` | Non | - | `{ programmes: [...] }` (200) |
| GET | `/:id` | Non | - | `{ programme: {...} }` (200) |
| POST | `/` | JWT | admin\|institut | `{ message, programme }` (201) |
| PUT | `/:id` | JWT | admin\|institut | `{ message, programme }` (200) |
| DELETE | `/:id` | JWT | admin\|institut | `{ message }` (200) |

**Filtres GET / :**
- `domaine=informatique|genie_civil|...`
- `niveau=cycle_preparatoire|licence|master|ingenieur`
- `mode=cours_du_jour|cours_du_soir|alternance|formation_continue`
- `institut_id=<uuid>`
- `est_actif=true|false`
- `titre=<string>` — Recherche case-insensitive

---

#### **Module Applications** : `POST|PUT|PATCH|GET|DELETE /api/candidatures`

**⚠️ Le plus complexe — Workflow complet avec uploads**

| Méthode | Route | Auth | Rôle | Réponse |
|---------|-------|------|------|---------|
| POST | `/` | JWT | candidat | `{ message, candidature }` (201) |
| PUT | `/:id` | JWT | candidat | `{ message, candidature }` (200) |
| POST | `/:id/soumettre` | JWT | candidat | `{ message, candidature }` (200) |
| PATCH | `/:id/statut` | JWT | admin\|institut | `{ message, candidature }` (200) |
| GET | `/mine` | JWT | candidat | `{ candidatures: [...] }` (200) |
| GET | `/institute/list` | JWT | institut | `{ candidatures: [...] }` (200) |
| GET | `/` | JWT | admin | `{ candidatures: [...] }` (200) avec filtres |
| GET | `/:id` | JWT | - | `{ candidature: {...} }` (200) |
| DELETE | `/:id` | JWT | admin | `{ message }` (200) |

**Uploads :** Multer `fields()` (max 5 Mo, formats : jpeg, jpg, png, pdf)

```javascript
Champs Multer acceptés:
- cv
- diplome_bac
- releves_notes
- lettre_motivation
- piece_identite
- photo_identite
- lettre_recommandation
- attestation_stage
```

**Exemple POST / (créer brouillon) :**

```bash
curl -X POST http://localhost:5000/api/candidatures \
  -H "Authorization: Bearer <TOKEN_CANDIDAT>" \
  -F "programme_id=<UUID>" \
  -F "lettre_motivation=Je suis motivé..." \
  -F "cv=@/path/to/cv.pdf"
```

**Réponse :**

```json
{
  "message": "Brouillon créé.",
  "candidature": {
    "id": "uuid-3",
    "candidat_id": "uuid-2",
    "programme_id": "uuid-1",
    "statut": "brouillon",
    "documents_soumis": [
      {
        "nom": "cv",
        "url": "/uploads/1714123456-123456.pdf",
        "media_id": "uuid-4",
        "telecharge_le": "2026-04-20T14:30:00.000Z"
      }
    ],
    "lettre_motivation": "Je suis motivé...",
    "cree_le": "2026-04-20T14:30:00.000Z"
  }
}
```

**Filtres GET / (admin) :**
- `statut=brouillon|soumise|en_examen|acceptee|refusee|liste_attente`
- `programme_id=<uuid>`

---

#### **Module Favorites** : `GET|POST|DELETE /api/favoris`

| Méthode | Route | Auth | Rôle | Réponse |
|---------|-------|------|------|---------|
| GET | `/mine` | JWT | candidat | `{ favoris: [...] }` (200) |
| POST | `/` | JWT | candidat | `{ message, favori? }` (201\|200) |
| DELETE | `/:programme_id` | JWT | candidat | `{ message }` (200) |

**Exemple POST / (toggle) :**

```bash
curl -X POST http://localhost:5000/api/favoris \
  -H "Authorization: Bearer <TOKEN_CANDIDAT>" \
  -H "Content-Type: application/json" \
  -d '{ "programme_id": "<UUID>" }'
```

---

### 6.3 Gestion des erreurs

**Codes HTTP utilisés :**

| Code | Cas | Exemple |
|------|-----|---------|
| 200 | Succès GET/PUT/DELETE | Récupération utilisateur |
| 201 | Création réussie | POST /register |
| 400 | Validation échouée | Email manquant |
| 401 | Authentification échouée | Token invalide |
| 403 | Autorisation refusée | Role insuffisant |
| 404 | Ressource introuvable | User ID invalide |
| 409 | Conflit (doublon, etc.) | Email déjà utilisé |
| 500 | Erreur serveur | Exception BD |

**Format d'erreur standardisé :**

```json
{
  "message": "Description lisible",
  "error": "stack trace technique (optionnel)",
  "manquants": ["field1", "field2"]  // pour validations
}
```

---

## 7. Authentification et autorisation

### 7.1 Méthode d'authentification

**Type :** JWT (JSON Web Tokens) Bearer  
**Libraire :** `jsonwebtoken` v9.0.2  
**Durée par défaut :** 7 jours (`process.env.JWT_EXPIRES` = '7d')  
**Secret :** `process.env.JWT_SECRET` (à définir en .env)

**Payload JWT :**

```javascript
{
  id: "UUID utilisateur",
  role: "candidat|institut|admin",
  iat: 1713618600,
  exp: 1714223400
}
```

**Header HTTP requis :**

```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### 7.2 Gestion des rôles

**3 rôles existants :**

| Rôle | Type | Permissions typiques |
|------|------|----------------------|
| `candidat` | Étudiant | Créer candidatures, ajouter favoris, modifier son profil |
| `institut` | École | Créer/modifier ses programmes, examiner candidatures, modifier son profil |
| `admin` | Système | Accès complet : CRUD toutes entités, transitions d'état, désactivation comptes |

### 7.3 Middlewares d'authentification

**`authMiddleware.js` :**

```javascript
// 1. Vérifie présence et validité JWT
// 2. Résout l'utilisateur depuis BD
// 3. Résout profil lié (Candidat ou Institut)
// 4. Injecte req.user = { id, role, candidat_id?, institut_id? }

const authMiddleware = async (req, res, next) => { ... }

// Guards de rôle
const isAdmin = (req, res, next) => {
  if (req.user?.role !== 'admin') return 403
}

const restrictTo = (...roles) => (req, res, next) => {
  if (!roles.includes(req.user?.role)) return 403
}

// Usage en routes:
router.get('/', auth, isAdmin, ctrl.getAll)
router.post('/', auth, restrictTo('admin', 'institut'), ctrl.create)
```

### 7.4 Middlewares de propriété

**`candidatureGuards.js` :**

```javascript
// verifierPropriete() — Garantit que l'utilisateur
// accède uniquement à ses propres ressources

// Règles :
// - Admin : accès à tout
// - Candidat : accès uniquement ses candidatures
// - Institut : accès uniquement candidatures ses programmes

const verifierPropriete = async (req, res, next) => {
  const { role, candidat_id, institut_id } = req.user
  const candidature = await Candidature.findByPk(req.params.id)
  
  if (role === 'admin') return next()
  if (role === 'candidat' && candidature.candidat_id !== candidat_id) return 403
  if (role === 'institut') {
    const prog = await Programme.findByPk(candidature.programme_id)
    if (prog.institut_id !== institut_id) return 403
  }
  next()
}
```

### 7.5 Sécurité des mots de passe

**Hachage :** bcryptjs v2.4.3, **10 rounds**

```javascript
// Register
const hashed = await bcrypt.hash(password, 10)

// Login
const valid = await bcrypt.compare(password, utilisateur.mot_de_passe)
```

**Jamais de mots de passe en réponse HTTP :**

```javascript
attributes: { exclude: ['mot_de_passe', 'jeton_rafraichissement'] }
```

---

## 8. Gestion des fichiers et médias

### 8.1 Multer (Upload de fichiers)

**Libraire :** `multer` v1.4.5-lts.1  
**Stockage :** Disque local (`./uploads/`)  
**Limite de taille :** 5 Mo par fichier  
**Formats autorisés :** `.jpeg`, `.jpg`, `.png`, `.pdf`

**Configuration :** `/middleware/upload.js`

```javascript
// Stockage disque
storage = multer.diskStorage({
  destination: './uploads',
  filename: '${Date.now()}-${random()}.ext'  // Unicité
})

// Filtre types mime
fileFilter = (req, file, cb) => {
  if (/jpeg|jpg|png|pdf/.test(file.originalname)) {
    cb(null, true)
  } else {
    cb(new Error('Seuls JPEG, PNG, PDF autorisés'))
  }
}

// Montage
const upload = multer({ storage, fileFilter, limits: { fileSize: 5MB } })
```

### 8.2 Champs Multer autorisés

**Routes d'upload :** `/api/candidatures`, `/api/candidatures/:id` (PUT)

**Champs acceptés :**

```javascript
[
  'cv',
  'diplome_bac',
  'releves_notes',
  'lettre_motivation',
  'piece_identite',
  'photo_identite',
  'lettre_recommandation',
  'attestation_stage'
]
```

### 8.3 Modèle Media

**Relation :** Polymorphe (1 Media → N Candidature ou Institut)

```javascript
Media:
├── proprietaire_id (UUID)       // Qui a uploadé
├── type_proprietaire ('Candidat'|'Institut')
├── nom_fichier (original)
├── chemin (/uploads/unique-name.pdf)
├── type_mime (application/pdf)
├── taille_octets
└── telecharge_le (timestamp)

// Intégration dans Candidature:
candidature.documents_soumis = [
  {
    nom: 'cv',
    url: '/uploads/file.pdf',
    media_id: 'UUID Media',
    telecharge_le: '2026-04-20T14:30:00Z'
  }
]
```

### 8.4 Workflow upload

```
1. Client POST /api/candidatures
   └─ Multer intercepte + sauvegarde fichiers

2. candidatureWorkflow.creerBrouillon()
   └─ Pour chaque fichier:
      ├─ Crée entrée Media en BD
      └─ Ajoute reference dans documents_soumis JSONB

3. Candidature sauvegardée
   └─ documents_soumis = [
       { nom: 'cv', media_id: '...', url: '/uploads/...' }
     ]

4. GET /api/candidatures/:id
   └─ Retourne documents_soumis avec URLs
   └─ Client peut télécharger via /uploads/...
```

### 8.5 Sécurité fichiers

⚠️ **Points actuels :**

- ✅ Filtrage types MIME
- ✅ Limite taille 5 Mo
- ✅ Noms unique (timestamp + random)
- ❌ **Pas de scan antivirus**
- ❌ **Pas d'authentification sur /uploads static** (public)
- ❌ **Pas de gestion quota disque**

---

## 9. Logique métier principale

### 9.1 Workflow de candidature (Core Business)

**Fichier :** `services/candidatureWorkflow.js`

**Statuts et transitions :**

```
┌──────────────┐
│  BROUILLON   │ (défaut création)
│              │
│ Candidat:    │
│ - Crée       │
│ - Modifie    │
│ - Upload     │
│ - Soumet → ┐ │
└──────┬───────┘ │
       │         │
       └────────┬┘
                ▼
          ┌──────────┐
          │ SOUMISE  │
          │          │
          │ Validée  │
          │ Complète │
          └────┬─────┘
               │ (Institut examine)
               ▼
          ┌──────────────┐
          │  EN_EXAMEN   │
          │              │
          │ Institut:    │
          │ Évalue       │
          └┬────┬────┬───┘
           │    │    │
           ▼    ▼    ▼
     ┌─────────┬──────────┬──────────┐
     │         │          │          │
     ▼         ▼          ▼          ▼
  ACCEPTEE  REFUSEE  LISTE_ATTENTE  ?
  [TERM.]   [TERM.]      [EVOL.]
     ✓ Final  ✗ Final    ⏳ Peut évoluer
```

**Étapes détaillées :**

#### 1. **Créer un brouillon** (`creerBrouillon`)

```
POST /api/candidatures
{
  programme_id: UUID,
  lettre_motivation?: string,
  [cv, diplome_bac, ...]: File[]
}

Validations:
├─ Programme existe et est actif
├─ Pas de doublon (même candidat + programme)
└─ Multer: fichiers valides

Effet:
├─ Crée Candidature (statut='brouillon')
├─ Crée Medias pour chaque fichier
├─ documents_soumis = [{nom, url, media_id, telecharge_le}]
└─ Transaction ACID
```

#### 2. **Modifier le brouillon** (`mettreAJourBrouillon`)

```
PUT /api/candidatures/:id
{
  lettre_motivation?: string (remplace),
  [cv, ...]: File[]  (ajoute)
}

Validations:
├─ Candidature existe
├─ Candidat propriétaire
└─ Statut = 'brouillon' (sinon 400)

Effet:
├─ Modifie lettre_motivation
├─ Ajoute nouveaux docs (non destructif)
└─ Recharge depuis BD
```

#### 3. **Soumettre** (`soumettre`)

```
POST /api/candidatures/:id/soumettre
{}

Validations:
├─ Candidature existe
├─ Candidat propriétaire
├─ Statut = 'brouillon'
└─ Documents obligatoires présents
   (comparaison documents_soumis vs programme.documents_requis)

Effet:
├─ statut = 'soumise'
├─ soumise_le = NOW()
├─ Crée Notification candidat
├─ Crée Notification institut
└─ Transaction ACID
```

#### 4. **Transition de statut** (`changerStatut`)

```
PATCH /api/candidatures/:id/statut
{
  statut: 'en_examen' | 'acceptee' | 'refusee' | 'liste_attente',
  notes_institut?: string
}

Autorisation:
├─ Admin: toutes transitions
└─ Institut: de soumise/en_examen/liste_attente vers résultats

Validations:
├─ Candidature existe
├─ Statut courant → cible autorisé
├─ Pas déjà en statut terminal
├─ Institut propriétaire programme

Effet:
├─ Mise à jour statut
├─ Sauve notes_institut
├─ Crée Notification candidat (changement statut)
└─ Transaction ACID
```

**Matrice de transitions (par rôle) :**

```javascript
TRANSITIONS = {
  candidat: {
    brouillon: ['soumise'],
  },
  institut: {
    soumise:       ['en_examen', 'acceptee', 'refusee', 'liste_attente'],
    en_examen:     ['acceptee', 'refusee', 'liste_attente'],
    liste_attente: ['acceptee', 'refusee'],
  },
  // admin: all allowed (via admin check)
}

// Statuts terminaux (aucune sortie)
STATUTS_TERMINAUX = ['acceptee', 'refusee']
```

### 9.2 Notifications automatiques

**Fichier :** `services/notificationService.js`

**Événements qui créent des notifications :**

| Événement | Quand | Destinataire | Type | Message |
|-----------|-------|--------------|------|---------|
| Soumission candidature | `soumettre()` | Candidat | statut_candidature | "Candidature soumise" |
| Soumission candidature | `soumettre()` | Institut | statut_candidature | "Nouvelle candidature reçue" |
| Changement statut | `changerStatut()` | Candidat | statut_candidature | "Statut mis à jour : X → Y" |

**Structure Notification :**

```javascript
{
  utilisateur_id,
  type: 'statut_candidature' | 'nouveau_programme' | ...,
  titre: "Candidature acceptée",
  contenu: "Votre candidature #abc123... est acceptée",
  est_lue: false,
  ref_id: "candidature UUID",
  ref_type: "Candidature",
  cree_le: NOW()
}
```

**Affichage :** Les notifications sont stockées en BD et loggées console. **Pas d'intégration email/SMS actuellement.**

### 9.3 Gestion des documents

**Documents requis par Programme :**

```javascript
Programme.documents_requis = [
  { nom: 'cv', obligatoire: true },
  { nom: 'diplome_bac', obligatoire: true },
  { nom: 'lettre_motivation', obligatoire: true },
  { nom: 'lettre_recommandation', obligatoire: false },
  ...
]
```

**Validation complétude :**

```javascript
async function verifierCompletude(candidature) {
  const programme = await Programme.findByPk(candidature.programme_id)
  const requis = programme.documents_requis.filter(d => d.obligatoire)
  const fournis = candidature.documents_soumis.map(d => d.nom)
  
  const manquants = requis.filter(r => !fournis.includes(r.nom))
  
  return {
    complet: manquants.length === 0,
    manquants: manquants.map(m => m.nom)
  }
}

// Utilisé dans soumettre():
// si (!complet) throw 400 "Documents obligatoires manquants : CV, ..."
```

### 9.4 Empêcher les doublons

```javascript
async function verifierDoublon(candidat_id, programme_id, exclude_id) {
  const existing = await Candidature.findOne({
    where: {
      candidat_id,
      programme_id,
      // Optionnel: exclure candidature en cours d'édition
      id: exclude_id ? { [Op.ne]: exclude_id } : undefined
    }
  })
  
  if (existing) throw { status: 409, message: "Doublon détecté" }
}

// Appelé à la création et modification
```

---

## 10. Points forts et problèmes

### 10.1 Points forts (Bonnes pratiques)

✅ **Architecture bien organisée**
- Séparation claire controllers → services → models
- Routes modulaires par domaine
- Middlewares réutilisables

✅ **Transactions ACID**
- Toutes opérations critiques dans `sequelize.transaction()`
- Garantit consistance (utilisateur + profil créés atomiquement, etc.)

✅ **Workflow métier clair**
- Matrice transitions explicite
- Validations riches (complétude docs, doublons, programme actif)
- Statuts terminaux bien définis

✅ **Sécurité authentification**
- JWT avec expiration
- bcryptjs 10 rounds
- Mots de passe jamais retournés en réponse
- Comptes désactivables

✅ **Contrôle d'accès granulaire**
- 3 rôles avec permissions distinctes
- Guards propriété (candidat/institut n'accèdent qu'à leurs ressources)
- Admin override

✅ **Upload fichiers sécurisé**
- Filtrage types MIME
- Limite taille 5 Mo
- Noms uniques (timestamp + random)

✅ **Modèles JSONB flexibles**
- Support semi-structuré (adresse, contact, documents_requis)
- Pas fragmentation tables

✅ **API RESTful cohérente**
- Codes HTTP corrects
- Messages d'erreur clairs
- Filtres de recherche standards

---

### 10.2 Problèmes et limitations détectés

⚠️ **Pas de pagination**
- `findAll()` sans `limit/offset` → Épuisement mémoire si N > 10k
- **Impact :** Lent sur listing instituts/programmes avec beaucoup de data

⚠️ **Pas de validation schemas**
- Pas de Joi, Yup, ou zod
- Validations parcellaires (regex email, types Sequelize)
- **Impact :** Risques injection, garbage data

⚠️ **Pas de gestion erreurs centralisée**
- Try/catch dispersés dans controllers
- Pas de middleware erreur global
- **Impact :** Inconsistences codes HTTP, duplication logs

⚠️ **Pas de logging structuré**
- Notifications loggées `console.log` (env production!)
- Pas de niveaux (debug, info, warn, error)
- Pas de correlation IDs
- **Impact :** Debugging production difficile

⚠️ **N+1 queries potentiels**
- `.include()` sur `hasMany` sans `separate: true`
- Exemple : `GET /api/instituts` charge tous programmes de tous instituts

⚠️ **Pas de rate limiting**
- Aucune protection DoS/brute-force
- `/api/auth/login` pas limité
- **Impact :** Vulnerability connue (OWASP)

⚠️ **Upload fichiers non sécurisé en production**
- Pas de scan antivirus
- `/uploads` static public (confidentialité?)
- Pas de gestion quota disque
- Pas de compression/optimisation images

⚠️ **Endpoints non utilisés**
- `jeton_rafraichissement` sauvegardé mais jamais utilisé
- Types notification `nouveau_programme`, `document_manquant` réservés mais non implémentés

⚠️ **Pas de versioning API**
- Pas de `/v1/`, `/v2/` paths
- Difficile migration future

⚠️ **Pas d'audit trail formalisé**
- Notifications ≠ audit (plus métier que système)
- Pas de journal modifications (`created_by`, `updated_by`, `deleted_at`)

⚠️ **Test pas visible**
- Pas de dossier `tests/` ou `__tests__`
- Pas de test unitaires/intégration
- **Impact :** Fragilité à refactorisation

---

## 11. Suggestions d'amélioration

### 11.1 Court terme (Quick wins)

1. **Ajouter pagination**
   ```javascript
   // routes/programmeRoutes.js
   const { limit = 20, offset = 0 } = req.query
   const { count, rows } = await Programme.findAndCountAll({
     limit: Math.min(limit, 100),
     offset
   })
   res.json({ total: count, programmes: rows, limit, offset })
   ```

2. **Validation schemas (Joi)**
   ```javascript
   // middleware/validateSchema.js
   const schema = Joi.object({
     email: Joi.string().email().required(),
     password: Joi.string().min(8).required()
   })
   const { error, value } = schema.validate(req.body)
   if (error) return res.status(400).json({ error: error.details })
   ```

3. **Middleware erreur global**
   ```javascript
   // middleware/errorHandler.js
   app.use((err, req, res, next) => {
     const status = err.status || 500
     const message = err.message || 'Erreur serveur'
     res.status(status).json({ message, error: process.env.NODE_ENV === 'dev' ? err.stack : undefined })
   })
   ```

4. **Logger structuré (Winston)**
   ```javascript
   // config/logger.js
   const winston = require('winston')
   const logger = winston.createLogger({
     level: process.env.LOG_LEVEL || 'info',
     format: winston.format.json(),
     transports: [
       new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
       new winston.transports.File({ filename: 'logs/combined.log' })
     ]
   })
   ```

5. **Rate limiting (express-rate-limit)**
   ```javascript
   // middleware/rateLimiter.js
   const rateLimit = require('express-rate-limit')
   const limiter = rateLimit({
     windowMs: 15 * 60 * 1000,  // 15 min
     max: 100,                   // max 100 reqs
     message: 'Trop de requêtes, réessayez plus tard'
   })
   app.use('/api/auth/login', limiter)
   ```

### 11.2 Moyen terme

1. **Audit trail formalisé**
   - Ajouter colonne `created_by`, `updated_by` sur tables clés
   - Table `AuditLog` séparée (qui, quoi, quand, avant/après)

2. **Optimisation N+1**
   ```javascript
   // Utiliser `separate: true` pour hasMany
   Institut.findAll({
     include: [{
       model: Programme,
       as: 'programmes',
       separate: true  // Requête SQL séparée
     }]
   })
   ```

3. **Gestion fichiers production**
   - S3 ou stockage cloud (vs disque local)
   - CDN pour compression/caching
   - Scan antivirus (ClamAV)

4. **API versioning**
   ```
   /api/v1/auth/register
   /api/v1/users
   /api/v2/applications (futur)
   ```

5. **Documentation API (OpenAPI/Swagger)**
   ```javascript
   // npm install swagger-jsdoc swagger-ui-express
   // Lister tous endpoints avec schémas
   ```

### 11.3 Long terme (Architectural)

1. **Microservices** (si scalabilité forte)
   - Auth service
   - Programs service
   - Applications service
   - Notifications service (asynchrone)

2. **Queues asynchrones** (Bull + Redis)
   - Uploads fichiers lourds
   - Envoi notifications (email, SMS)
   - Reporting

3. **Caching** (Redis)
   - `GET /api/programmes` (données rarement mises à jour)
   - Sessions JWT long terme
   - Compteurs (nb candidatures par programme)

4. **GraphQL** (complémentaire REST)
   - Queries complexes (candidat + tous favoris + instituts)
   - Réduire transfert données

5. **Tests automatisés**
   - Jest + Supertest pour routes
   - 80%+ coverage
   - CI/CD (GitHub Actions, GitLab CI)

6. **Monitoring & APM**
   - Sentry ou DataDog (erreurs)
   - New Relic (performance)
   - Logs centralisés (ELK stack)

---

## Annexe : Commandes utiles

### Démarrage

```bash
cd backend
npm install
npm run dev          # Nodemon mode développement
npm start            # Production
```

### Base de données

```bash
npm run db:create                  # Créer BD
npm run migrate                    # Appliquer migrations
npm run migrate:undo              # Rollback dernière
npm run migrate:undo:all          # Rollback tout
npm run migrate:status            # État migrations
npm run db:reset                  # Reset BD (migrations + schema)
npm run seed                      # Appliquer seeders
npm run seed:undo:all             # Annuler seeders
```

### Tests API (curl)

```bash
# Register candidat
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "candidat@test.tn",
    "password": "SecurePass123!",
    "role": "candidat",
    "prenom": "Ali",
    "nom": "Bouali"
  }'

# Login
TOKEN=$(curl -s -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"candidat@test.tn","password":"SecurePass123!"}' | jq -r '.token')

# Profil courant
curl -H "Authorization: Bearer $TOKEN" http://localhost:5000/api/auth/me

# Listing instituts
curl http://localhost:5000/api/instituts

# Listing programmes filtrés
curl "http://localhost:5000/api/programmes?domaine=informatique&niveau=master"
```

---

## 12. Gestion des pièces d'identité

### Règle métier

| Nationalité    | Pièce requise | Champ              |
|----------------|---------------|--------------------|
| `tunisienne`   | CIN           | `cin`              |
| (autre)        | Passeport     | `numero_passeport` |

### Implémentation

Champs ajoutés à la table `candidats` (migration `20260421000000-add-identite-candidat`) :

| Champ                 | Type    | Note                                              |
|-----------------------|---------|---------------------------------------------------|
| `nationalite`         | STRING  | NOT NULL, default `'tunisienne'`. Une API pays externe est prévue en future. |
| `cin`                 | STRING  | UNIQUE. Validation : exactement 8 chiffres (`/^[0-9]{8}$/`). |
| `numero_passeport`    | STRING  | UNIQUE. Validation : 6-20 caractères alphanumériques. |
| `type_piece_identite` | ENUM    | `'cin'` ou `'passeport'`. **Forcé backend**, jamais modifiable via API. |

### Règles importantes

- **`type_piece_identite` n'est JAMAIS dans la whitelist d'update** du
  controller — il est forcé automatiquement par le hook `beforeValidate`
  du modèle `Candidat` selon la nationalité.
- La comparaison de la nationalité utilise `.toLowerCase().trim()` pour
  absorber les variations futures de l'API pays externe
  (`'Tunisienne'`, `'TUNISIENNE'`, `' tunisienne '` → match correct).
- Le hook ne se déclenche **que si** un des trois champs `nationalite`,
  `cin` ou `numero_passeport` est modifié — les updates partiels sans
  rapport (ex: changer le prénom) ne sont pas bloqués.
- **CIN et passeport ne sont JAMAIS dupliqués dans `candidatures`** ;
  le dossier candidature accède à ces données via `candidat_id`.
- **Le hook `beforeValidate` mute `options.fields`** pour y ré-injecter
  `cin`, `numero_passeport` et `type_piece_identite`. Sans cela, Sequelize
  fige `options.fields` depuis `this.changed()` *avant* `beforeValidate`
  (cf. `model.js:2370-2377` et `model.js:2592-2596`), ce qui exclurait
  silencieusement du `UPDATE SQL` les champs mutés par le hook.
  ⚠️ Si tu déplaces cette logique dans un autre hook (`beforeUpdate` /
  `beforeSave`), supprime cette ré-injection — elle est spécifique au cas
  `beforeValidate`.

### Codes HTTP renvoyés (controller `updateUser`)

| Cas | Code | Message |
|-----|------|---------|
| CIN/passeport manquant pour la nationalité | 400 | message du hook (`CIN obligatoire ...` / `Numéro de passeport obligatoire ...`) |
| Format CIN ou passeport invalide | 400 | `Données invalides.` + détails |
| CIN ou passeport déjà utilisé | 409 | `Ce numéro de CIN ou passeport est déjà utilisé.` |
| Erreur serveur | 500 | `Erreur serveur.` |

---

## 13. Seeders (données de démonstration)

Sept seeders ordonnés par préfixe numérique pour respecter les FK
(parents avant enfants). Tous utilisent **des UUID v4 fixes** déclarés en
constantes en tête de fichier — la reproductibilité est garantie : chaque
exécution produit le même jeu de données.

| Seeder | Insère |
|--------|--------|
| `20260001000000-admin.js`         | 1 utilisateur admin (`admin@edubridge.tn`) |
| `20260002000000-instituts.js`     | 3 utilisateurs (role=`institut`) + 3 instituts (ESPRIT, MedTech, Polytechnique Sousse) |
| `20260003000000-programmes.js`    | 11 programmes (couvre les 4 valeurs ENUM `mode`) |
| `20260004000000-candidats.js`     | 3 utilisateurs (role=`candidat`) + 3 candidats (Ali/Sarra tunisiens, Yassine français) |
| `20260005000000-candidatures.js`  | 6 candidatures (couvre les 6 valeurs ENUM `statut`) |
| `20260006000000-favoris.js`       | 5 favoris |
| `20260007000000-notifications.js` | 6 notifications (5 candidat + 1 institut) |

**Mot de passe commun :** `Password123!` (hashé bcrypt 10 rounds).

### Conventions appliquées

- UUIDs hardcodés en haut du fichier — partagés entre seeders pour les FK.
- JSONB → `JSON.stringify(...)` ; ARRAY(STRING) → array JS natif.
- Dates → `new Date()` ou string `'YYYY-MM-DD'` (DATEONLY).
- `down()` supprime via `bulkDelete('table', { id: [...] }, {})` dans
  l'ordre **inverse** des FK (table fille → table parente).
- ⚠️ `bulkInsert` **ne déclenche pas** les hooks Sequelize. Les valeurs
  cohérentes pour les champs identité (`type_piece_identite`, nullification
  croisée CIN ↔ passeport) sont fournies directement dans le seeder.

### Démarrage depuis zéro

```bash
cd backend
npm run db:reset       # drop schéma + recrée + applique les 2 migrations
npm run seed           # applique les 7 seeders
```

Vérification rapide :

```sql
SELECT
  (SELECT COUNT(*) FROM utilisateurs) AS u,   -- 7
  (SELECT COUNT(*) FROM instituts)    AS i,   -- 3
  (SELECT COUNT(*) FROM programmes)   AS p,   -- 11
  (SELECT COUNT(*) FROM candidats)    AS c,   -- 3
  (SELECT COUNT(*) FROM candidatures) AS d,   -- 6
  (SELECT COUNT(*) FROM favoris)      AS f,   -- 5
  (SELECT COUNT(*) FROM notifications) AS n;  -- 6
```

---

**Fin de document**

Version 1.0.0 — Architecture MVP EduBridge complète et opérationnelle.  
Pour questions ou mises à jour, consulter les maintainers du projet.
