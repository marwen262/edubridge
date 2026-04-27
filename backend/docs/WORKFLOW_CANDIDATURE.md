# Workflow de traitement des candidatures — Guide de test

## Architecture

```
services/
├── candidatureWorkflow.js   # Moteur de workflow (transitions, validations, horodatage)
└── notificationService.js   # Notifications automatiques (table + console)

middleware/
├── authMiddleware.js        # JWT + résolution profil (existant)
└── candidatureGuards.js     # Garde-fous : statut terminal + propriété

controllers/
└── candidatureController.js # Endpoints HTTP (couche mince)

routes/
└── candidatureRoutes.js     # Montage des routes /api/candidatures
```

## Endpoints REST

| Méthode | Route | Rôle | Description |
|---------|-------|------|-------------|
| `POST` | `/api/candidatures` | candidat | Créer un brouillon (§2 étape 1) |
| `PUT` | `/api/candidatures/:id` | candidat | Modifier un brouillon |
| `PUT` | `/api/candidatures/:id/soumettre` | candidat | Soumettre le dossier (§2 étape 2) |
| `PUT` | `/api/candidatures/:id/statut` | institut/admin/candidat | Changer le statut (§2 étapes 3-5) |
| `POST` | `/api/candidatures/:id/complement` | candidat | Fournir complément + re-soumettre (§4) |
| `POST` | `/api/candidatures/:id/documents` | candidat | Upload additionnel de documents |
| `PUT` | `/api/candidatures/:id/documents/:docId/verification` | institut/admin | Vérifier/rejeter un document (§4) |
| `GET` | `/api/candidatures/mine` | candidat | Mes candidatures |
| `GET` | `/api/candidatures/institute/list` | institut | Candidatures sur mes programmes |
| `GET` | `/api/candidatures` | admin | Toutes les candidatures (filtres) |
| `GET` | `/api/candidatures/:id` | tous | Détail (contrôle propriété) |
| `GET` | `/api/candidatures/:id/historique` | tous | Historique des transitions (§6) |
| `GET` | `/api/candidatures/:id/audit` | admin | Journal d'audit (§6) |
| `DELETE` | `/api/candidatures/:id` | admin | Suppression (journalisée) |

## Pré-requis pour les tests

```bash
# 1. Démarrer le serveur
cd backend && npm run dev

# 2. Obtenir un token JWT candidat
TOKEN_CANDIDAT=$(curl -s -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"candidat@test.tn","motDePasse":"password"}' | jq -r '.token')

# 3. Obtenir un token JWT institut
TOKEN_INSTITUT=$(curl -s -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"institut@test.tn","motDePasse":"password"}' | jq -r '.token')

# 4. Obtenir un token JWT admin
TOKEN_ADMIN=$(curl -s -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@test.tn","motDePasse":"password"}' | jq -r '.token')
```

> Remplacer les emails/mots de passe par ceux de vos seeders.

## Tests du flux nominal

### Étape 1 — Créer un brouillon

```bash
curl -X POST http://localhost:5000/api/candidatures \
  -H "Authorization: Bearer $TOKEN_CANDIDAT" \
  -H "Content-Type: application/json" \
  -d '{
    "programmeId": "<UUID_PROGRAMME>",
    "lettreMotivation": "Je suis motivé pour rejoindre ce programme."
  }'
# → 201 { message: "Brouillon créé.", candidature: { statut: "brouillon", ... } }
```

### Étape 1b — Modifier le brouillon (upload documents)

```bash
curl -X PUT http://localhost:5000/api/candidatures/<CANDIDATURE_ID> \
  -H "Authorization: Bearer $TOKEN_CANDIDAT" \
  -F "cv=@/chemin/vers/cv.pdf" \
  -F "diplome_bac=@/chemin/vers/diplome.pdf" \
  -F "lettreMotivation=Nouvelle version de ma lettre"
# → 200 { message: "Brouillon mis à jour." }
```

### Étape 2 — Soumettre

```bash
curl -X PUT http://localhost:5000/api/candidatures/<CANDIDATURE_ID>/soumettre \
  -H "Authorization: Bearer $TOKEN_CANDIDAT"
# → 200 { message: "Candidature soumise avec succès." }
# ⚠️ Si documents obligatoires manquants :
# → 400 { message: "Documents obligatoires manquants : Diplôme Baccalauréat, Relevés de notes." }
```

### Étape 3 — Prise en charge (institut → en_examen)

```bash
curl -X PUT http://localhost:5000/api/candidatures/<CANDIDATURE_ID>/statut \
  -H "Authorization: Bearer $TOKEN_INSTITUT" \
  -H "Content-Type: application/json" \
  -d '{"statut": "en_examen", "commentaire": "Dossier pris en charge."}'
# → 200 { candidature: { statut: "en_examen", examineeAt: "...", examinateurId: "..." } }
```

### Étape 4a — Accepter

```bash
curl -X PUT http://localhost:5000/api/candidatures/<CANDIDATURE_ID>/statut \
  -H "Authorization: Bearer $TOKEN_INSTITUT" \
  -H "Content-Type: application/json" \
  -d '{"statut": "acceptee", "motifDecision": "Excellent dossier."}'
# → 200 { candidature: { statut: "acceptee", decideeAt: "..." } }
```

### Étape 4b — Refuser (motifDecision obligatoire)

```bash
curl -X PUT http://localhost:5000/api/candidatures/<CANDIDATURE_ID>/statut \
  -H "Authorization: Bearer $TOKEN_INSTITUT" \
  -H "Content-Type: application/json" \
  -d '{"statut": "refusee", "motifDecision": "Prérequis non remplis."}'
# → 200

# Sans motif :
# → 400 { message: "Le motif de décision est obligatoire pour un refus." }
```

### Étape 6 — Consulter l'historique

```bash
curl http://localhost:5000/api/candidatures/<CANDIDATURE_ID>/historique \
  -H "Authorization: Bearer $TOKEN_CANDIDAT"
# → 200 { historique: [{ ancienStatut: "en_examen", nouveauStatut: "acceptee", ... }, ...] }
```

## Tests des exceptions

### Doublon de candidature (→ 409)

```bash
# Tenter de créer une 2ème candidature pour le même programme + année
curl -X POST http://localhost:5000/api/candidatures \
  -H "Authorization: Bearer $TOKEN_CANDIDAT" \
  -H "Content-Type: application/json" \
  -d '{"programmeId": "<MEME_UUID>"}'
# → 409 { message: "Vous avez déjà une candidature pour ce programme cette année." }
```

### Demande de complément (institut)

```bash
# 1. Institut demande un complément
curl -X PUT http://localhost:5000/api/candidatures/<CANDIDATURE_ID>/statut \
  -H "Authorization: Bearer $TOKEN_INSTITUT" \
  -H "Content-Type: application/json" \
  -d '{"statut": "complement_requis", "commentaire": "Relevés de notes manquants."}'
# → 200

# 2. Candidat fournit le complément et re-soumet
curl -X POST http://localhost:5000/api/candidatures/<CANDIDATURE_ID>/complement \
  -H "Authorization: Bearer $TOKEN_CANDIDAT" \
  -F "releves_notes=@/chemin/vers/releves.pdf"
# → 200 { message: "Complément fourni et candidature re-soumise." }
```

### Rejet de document (→ bascule auto complement_requis)

```bash
curl -X PUT http://localhost:5000/api/candidatures/<CANDIDATURE_ID>/documents/<DOC_ID>/verification \
  -H "Authorization: Bearer $TOKEN_INSTITUT" \
  -H "Content-Type: application/json" \
  -d '{"statutVerification": "rejete", "motifRejet": "Document illisible."}'
# → 200
# Effet : candidature passe automatiquement en "complement_requis"
# Notification envoyée au candidat (type: document_rejete)
```

### Retrait par le candidat

```bash
curl -X PUT http://localhost:5000/api/candidatures/<CANDIDATURE_ID>/statut \
  -H "Authorization: Bearer $TOKEN_CANDIDAT" \
  -H "Content-Type: application/json" \
  -d '{"statut": "retiree", "commentaire": "Je change d orientation."}'
# → 200 (depuis soumise ou en_examen uniquement)
```

### Transition interdite (→ 400)

```bash
# Candidat tente d'accepter sa propre candidature
curl -X PUT http://localhost:5000/api/candidatures/<CANDIDATURE_ID>/statut \
  -H "Authorization: Bearer $TOKEN_CANDIDAT" \
  -H "Content-Type: application/json" \
  -d '{"statut": "acceptee"}'
# → 400 { message: "Transition soumise → acceptee non autorisée pour le rôle candidat." }
```

### Modification après statut terminal (→ 400)

```bash
# Après acceptation, tenter de modifier
curl -X PUT http://localhost:5000/api/candidatures/<CANDIDATURE_ID>/statut \
  -H "Authorization: Bearer $TOKEN_INSTITUT" \
  -H "Content-Type: application/json" \
  -d '{"statut": "en_examen"}'
# → 400 { message: "Statut terminal « acceptee » : aucune transition autorisée." }
```

### Forçage admin (journalisé dans JournalAudit)

```bash
# Admin force une transition
curl -X PUT http://localhost:5000/api/candidatures/<CANDIDATURE_ID>/statut \
  -H "Authorization: Bearer $TOKEN_ADMIN" \
  -H "Content-Type: application/json" \
  -d '{"statut": "en_examen", "commentaire": "Reprise du dossier suite à signalement."}'
# → 200

# Vérifier le journal d'audit
curl http://localhost:5000/api/candidatures/<CANDIDATURE_ID>/audit \
  -H "Authorization: Bearer $TOKEN_ADMIN"
# → 200 { audit: [{ action: "forcage_transition", ... }] }
```

### Programme non publié (→ 400)

```bash
curl -X POST http://localhost:5000/api/candidatures \
  -H "Authorization: Bearer $TOKEN_CANDIDAT" \
  -H "Content-Type: application/json" \
  -d '{"programmeId": "<UUID_PROGRAMME_BROUILLON>"}'
# → 400 { message: "Ce programme n'est pas ouvert aux candidatures (statut actuel : brouillon)." }
```

### Inscriptions fermées (→ 400)

```bash
# Si l'année académique a inscriptionsOuvertes = false
# → 400 { message: "Les inscriptions sont fermées pour l'année 2025/2026." }
```

## Matrice de transitions (référence rapide)

```
                    ┌──────────────────────────────────────────┐
                    │         MATRICE DE TRANSITIONS            │
                    ├──────────┬───────────────────────────────┤
                    │ Rôle     │ Transitions autorisées        │
                    ├──────────┼───────────────────────────────┤
                    │ candidat │ brouillon → soumise           │
                    │          │ complement_requis → soumise   │
                    │          │ soumise → retiree             │
                    │          │ en_examen → retiree           │
                    │          │ complement_requis → retiree   │
                    ├──────────┼───────────────────────────────┤
                    │ institut │ soumise → en_examen           │
                    │          │ soumise → complement_requis   │
                    │          │ soumise → acceptee / refusee  │
                    │          │ en_examen → complement_requis │
                    │          │ en_examen → acceptee / refusee│
                    │          │ complement_requis → en_examen │
                    │          │ complement_requis → acceptee  │
                    │          │ complement_requis → refusee   │
                    ├──────────┼───────────────────────────────┤
                    │ admin    │ Toute transition              │
                    │          │ (journalisée dans JournalAudit│
                    └──────────┴───────────────────────────────┘
```

## Traçabilité

Chaque transition génère :
1. **HistoriqueCandidatures** — ancienStatut, nouveauStatut, modifieParId, commentaire, horodatage
2. **Notifications** — type `statut_candidature_change` envoyée au candidat
3. **JournalAudit** — uniquement pour les actions admin (forçage, suppression)

Les deux tables constituent la piste d'audit opposable (§6).
