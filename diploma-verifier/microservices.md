# Architecture Microservices - Diploma Verifier

## 0. Changelog V6 (mai 2026)

Refonte importante du pipeline OCR/scoring pour stabiliser la détection sur diplômes Arabic (cas Tunisie typique) et descendre les temps d'analyse sous 30 secondes.

### Bugs critiques corrigés
| Bug | Fichier | Impact |
|---|---|---|
| **Double prétraitement** : `preprocess()` binarisait l'image avant l'OCR (Tesseract LSTM dégradé) | `services/orchestrator.py` | +30 à +50 points sur diplômes valides |
| **`cv2.fitEllipse` NaN crash** : le détecteur de cachet retournait `confidence=0` systématiquement | `services/stamp_detector.py` | stamp_confidence détecté correctement (0.85–0.95) |
| **Convention rotation OSD/fallback opposée** : `ROTATE_90_CW` vs `ROTATE_90_CCW` pour le même angle 270° | `services/ocr_service.py` | Speedup ×2 sur diplômes mal-orientés (plus de fallback inutile) |
| **`_YEAR_PATTERN` `\b` cassé en Unicode** : ratait les années dans les diplômes Arabic | `services/text_analyzer.py` | `has_date=True` sur diplômes Arabic |

### Améliorations de couverture multilingue
- **Mots-clés Arabic ajoutés** dans `classify_document` (`شهادة`, `ليسانس`, `ماستر`, `دكتوراه`, `دبلوم`, `إجازة`, `بكالوريوس`, `ماجستير`) et dans `DIPLOMA_TYPES['ar']` (config.py)
- **`check_coherence` multi-langues** : patterns Arabic (`يشهد .* شهادة`, `جامعة .* ماستر`), Anglais (`this is to certify .* degree`), accents normalisés via NFKD, flag `re.DOTALL`
- **Fallback regex Arabic** pour les noms (`_ARABIC_NAME_PATTERN`) en complément de spaCy
- **5 passes OCR** au lieu de 3 : `ara`, `fra`, `eng`, **`ara+fra`**, **`fra+eng`** (combine-langs pour diplômes bilingues)
- **Fallback 4-rotation** : quand OSD donne un OCR de semantic_score < 5, teste les 4 orientations (0°/90°/180°/270°) sur image à 800px, garde la meilleure

### Recalibrage du scoring
- **`has_institution` retiré** du `structure_count`, du `_compute_semantic_score`, et de `TEXT_WEIGHTS` (poids redistribués). Un diplôme sans institution détectée n'est plus pénalisé.
- **Seuils structure** abaissés : boost `≥2` (était 3), penalty `<1` (était 2). Compense la nouvelle taille `core_fields=3`.
- **Seuil early-reject** abaissé : `diploma_confidence < 0.2` (était 0.3) — moins de faux rejets sur Arabic.
- **Plafond `no-content`** : `structure_count==0` AND `semantic_score<0.1` → score capé à 18 (bloque les logos/images avec features géométriques).

### Performances (sur Windows local, 5 passes parallélisées)
| Fichier | Avant | Après V6 | Speedup |
|---|---|---|---|
| test1.jpg (diplôme arabe straight) | 48 s | 12 s | 4× |
| testrotation.jpg (même diplôme, 90° tourné) | 5 m 35 s | 13 s | **26×** |
| test.jpg (diplôme ingénieur) | 1 m 25 s | 4 s | 21× |
| logoedubridge.png (logo, contrôle anti-fraude) | 49 s | 6 s | 8× |

Optimisations principales :
1. **Parallélisation OCR via `ThreadPoolExecutor`** : les 5 passes Tesseract tournent en parallèle (subprocess libère le GIL) → speedup ~5×.
2. **Un seul appel Tesseract par passe** : `image_to_data` reconstruit texte + confidence en un seul appel (au lieu de `image_to_string` + `image_to_data` séparés) → ~50% par passe.
3. **Quick rotation test downsamplée à 800px** : le fallback 4-rotation tourne sur une image légère pour identifier la bonne orientation, puis re-OCR full-quality une seule fois → ~80% de gain sur le fallback.
4. **Stamp detector downsample à 1200px max** : Hough circles est O(n²), passer de 4000 à 1200px = ~11× plus rapide.

---

## 1. Vue globale de l’architecture

### Type d’architecture
**Monolithe modulaire** avec séparation logique des responsabilités en services internes. L'application est déployée comme un seul conteneur Docker, mais le code est organisé en modules/services distincts qui pourraient être extraits en microservices indépendants si nécessaire.

### Diagramme logique (texte)
```
[Client HTTP]
    ↓
[FastAPI Application]
    ↓
[API Routes (/api/verify)]
    ↓
[Orchestrator Service]
    ↓
├── [Preprocessing Service] → Image preprocessing (OpenCV)
├── [OCR Service] → Text extraction (Tesseract + spaCy)
├── [Country Detector] → Pays d'origine (regex + langdetect)
├── [Signature Detector] → Détection signatures (OpenCV)
├── [Stamp Detector] → Détection cachets (OpenCV)
├── [Text Analyzer] → Analyse sémantique V5 (cohérence, classification, stuffing)
├── [Tampering Detector] → Détection falsifications (metadata + image analysis)
├── [Diploma Classifier] → Classification document (NLP)
└── [Scoring Engine] → Calcul score final (pondération)
    ↓
[Response Model] → JSON structuré
```

### Vue d’ensemble des services
L'application traite des documents (PDF/images) pour vérifier l'authenticité de diplômes. Le pipeline d'analyse est entièrement synchrone et s'exécute dans un seul processus Python. Les "services" sont des modules Python importés et appelés séquentiellement.

## 2. Liste des microservices

### Orchestrator Service
- **Responsabilité principale** : Coordination du pipeline d'analyse complet V5/V6, sorties anticipées (early exits), intégration des couches d'intelligence V5 (classification, cohérence, pénalités), et agrégation des résultats selon un schéma strict et concis avec des raisons contextuelles enrichies.
- **Technologies utilisées** : Python pur, asyncio pour les appels asynchrones.
- **Dépendances** : Tous les autres services internes.
- **V6 — Correction du double prétraitement** : `preprocess()` n'est plus appelé avant `extract_text()`. L'ancienne pipeline binarisait l'image (adaptive threshold) avant l'OCR, dégradant fortement Tesseract LSTM (qui travaille sur des niveaux de gris). Désormais l'image brute (`cv_image`) est passée directement à l'OCR, qui gère son propre préprocessing optimisé. Gain typique : **+30 à +50 points** sur les diplômes valides.
- **V6 — Suppression du critère `has_institution`** : un diplôme sans institution détectée n'est plus pénalisé. `has_institution` est retiré du `structure_count`, du `_compute_semantic_score()` (poids redistribués) et de `TEXT_WEIGHTS` (poids redistribué sur les autres signaux textuels).
- **V6 — Seuil early-reject baissé à 0.2** : `diploma_confidence < 0.2` au lieu de 0.3 — évite les faux rejets sur diplômes arabes où la regex de nom (Latin) et spaCy peinent à extraire les entités.

### Preprocessing Service
- **Responsabilité principale** : Prétraitement des images pour optimiser l'OCR (redimensionnement, correction gamma, seuillage).
- **Technologies utilisées** : OpenCV, scikit-image, NumPy.
- **Dépendances** : Aucune (traitement d'image brute).
- **V6 — N'est plus utilisé dans le pipeline d'OCR** : `preprocess()` reste disponible mais n'est plus appelé par l'orchestrateur (le binarize détruisait l'OCR). L'OCR Service fait son propre préprocessing minimal (grayscale + upscale x2).

### OCR Service
- **Responsabilité principale** : Extraction de texte via pipeline OCR V6 incluant l'auto-rotation (OSD), un prétraitement optimisé (grayscale/upscale x2), une exécution **parallélisée** en 5 passes (ara, fra, eng, ara+fra, fra+eng), et un fallback de rotation 4-orientations quand OSD échoue. La sélection du meilleur texte repose sur un score sémantique strict (avec fallback sur la longueur si score nul), suivie d'un filtrage de sécurité tolérant et d'une extraction des champs clés via regex/NLP.
- **Technologies utilisées** : Tesseract OCR (OSD, 5-pass parallèle), spaCy (modèles fr_core_news_sm, xx_ent_wiki_sm), langdetect, regex Python, OpenCV (preprocessing), `concurrent.futures.ThreadPoolExecutor`.
- **Dépendances** : Tesseract OCR, Poppler, OpenCV, modèles spaCy chargés au démarrage.
- **V6 — Parallélisation OCR via `ThreadPoolExecutor`** : les 5 passes Tesseract tournent en parallèle (Tesseract est invoqué en subprocess → libère le GIL). Speedup typique **~5×** sur le coût OCR.
- **V6 — Un seul appel Tesseract par passe** : `image_to_data` reconstruit le texte ET la confidence en un seul appel (au lieu de `image_to_string` + `image_to_data` séparés). Économie ~50% par passe.
- **V6 — Fallback 4-rotation** : quand OSD donne un OCR de semantic_score < 5, le service teste les 4 orientations (0°/90°/180°/270°) sur image downsamplée à 800px (1 passe combinée `ara+fra+eng` chacune), garde la meilleure, et ré-exécute le pipeline OCR complet sur la rotation choisie.
- **V6 — Bug rotation OSD/fallback corrigé** : `_correct_rotation` (chemin OSD) et `_rotate_image` (chemin fallback) utilisaient des conventions opposées pour les angles 90° et 270° (ROTATE_90_CW vs ROTATE_90_CCW). Désormais cohérents avec la convention OSD (rotate=N° = N° clockwise pour redresser).
- **V6 — Mots-clés Arabic ajoutés** : `_DEGREE_KEYWORDS` étendu via `DIPLOMA_TYPES['ar']` qui inclut maintenant `شهادة`, `إجازة` (en plus de `ليسانس`, `ماستر`, `دكتوراه`, `دبلوم`).
- **V6 — Combine-langs ajoutés** : passes `ara+fra` et `fra+eng` pour les diplômes bilingues (typique tunisien fr/ar).

### Country Detector
- **Responsabilité principale** : Détection automatique du pays d'origine basé sur le texte extrait et patterns regex.
- **Technologies utilisées** : Regex Python, langdetect.
- **Dépendances** : Résultats OCR.

### Signature Detector
- **Responsabilité principale** : Détection de signatures manuscrites dans l'image via analyse de contours et formes.
- **Technologies utilisées** : OpenCV, scikit-image.
- **Dépendances** : Image originale (non prétraitée).

### Stamp Detector
- **Responsabilité principale** : Détection de cachets officiels via analyse de formes circulaires (Transformée de Hough) et analyse morphologique (scans N&B), avec scores de confiance continus.
- **Technologies utilisées** : OpenCV, NumPy.
- **Dépendances** : Image originale.
- **V6 — Bug NaN corrigé** : `cv2.fitEllipse()` peut retourner `NaN` sur certains contours dégénérés ; le cast `int()` plus bas crashait le détecteur (`stamp_confidence=0` systématique). Garde `np.isfinite()` ajoutée. Gain : **stamp_confidence détecté correctement** sur les diplômes (typiquement 0.85–0.95 sur cachets noirs/bleus).
- **V6 — Downsample à 1200px max** : Hough circles est O(n²) — passer de 4000px à 1200px = ~11× plus rapide. Un cachet (~150-300px de diamètre) reste très détectable à cette résolution.

### Text Analyzer
- **Responsabilité principale** : Analyse sémantique avancée V5/V6. Détecte les entités (noms, institutions, dates, diplômes), classifie le type de document (diplôme vs certificat), vérifie la cohérence sémantique, et détecte le keyword stuffing (bourrage de mots-clés).
- **Technologies utilisées** : spaCy, regex, dictionnaires de mots-clés multilingues, heuristiques déterministes.
- **Dépendances** : Texte extrait par OCR, langue détectée.
- **V6 — Mots-clés Arabic + accents normalisés** : `classify_document` accepte désormais `شهادة`, `ليسانس`, `ماستر`, `دكتوراه`, `دبلوم`, `إجازة`, `بكالوريوس`, `ماجستير` (et accents français normalisés via NFKD). Seuil abaissé de `>= 2` à `>= 1` (un vrai diplôme ne contient souvent qu'un seul type).
- **V6 — `check_coherence` multi-langues** : patterns Arabic (`يشهد .* شهادة`, `جامعة .* ماستر`, etc.) et Anglais ajoutés ; flag `re.DOTALL` pour multi-lignes ; accents normalisés.
- **V6 — `keyword_density_penalty` étendu** : liste de mots-clés enrichie (français accentué, anglais, arabe).
- **V6 — Fallback regex Arabic pour les noms** : `_ARABIC_NAME_PATTERN` ajouté en complément de spaCy/regex Latin (`السيد`, `السيدة`, `الطالب`, `يشهد بأن` + suite Arabic).
- **V6 — `_YEAR_PATTERN` plus tolérant** : utilise lookbehind/lookahead `(?<!\d)...(?!\d)` au lieu de `\b` qui échoue dans les contextes Unicode (Arabic, accents).
- **V6 — `has_institution` retiré du scoring** : `structure_count` réduit de 4 à 3 champs (name, degree, date) ; seuils boost/penalty abaissés à 2/1 ; poids redistribués dans `_compute_semantic_score`.

### Tampering Detector
- **Responsabilité principale** : Détection de falsifications via analyse des métadonnées PDF et anomalies visuelles.
- **Technologies utilisées** : PyMuPDF (pour PDF), OpenCV, python-magic.
- **Dépendances** : Fichier original + image convertie.

### Diploma Classifier
- **Responsabilité principale** : Classification binaire (diplôme vs autre document) via NLP et mots-clés.
- **Technologies utilisées** : spaCy, regex, dictionnaires multilingues.
- **Dépendances** : Texte OCR + image.

### Scoring Engine
- **Responsabilité principale** : Calcul déterministe du score final d'authenticité V6 (borné entre 3 et 98 avec variabilité seedée) basé sur une évaluation probabiliste. Intègre les heuristiques anti-fraude V5/V6 : pondération dynamique, boost de cohérence, pénalités (keyword stuffing, doc type, incohérence visuelle), un **boost visuel V6 (sauvetage des documents à OCR faible mais signaux visuels forts)**, un **plafond de sécurité strict V6 (blocage des images sans sémantique)**, et un **plafond no-content V6** (`structure_count==0` AND `semantic_score<0.1` → score plafonné à 18 — bloque les logos/images aléatoires avec features géométriques type cercle).
- **Technologies utilisées** : Python pur, calculs mathématiques et heuristiques pondérées.
- **Dépendances** : Résultats de tous les services (analyse textuelle et visuelle).
- **V6 — `TEXT_WEIGHTS` redistribués** (poids `has_institution=0.15` retiré) : `has_person_name=0.20`, `has_degree_keyword=0.16`, `has_date=0.10`, `official_mention=0.10`, `certification_phrase=0.09`. Total text+visual reste à 1.0.
- **V6 — Seuils de structure abaissés** : `_STRUCTURE_BOOST_THRESHOLD=2` (était 3), `_STRUCTURE_PENALTY_THRESHOLD=1` (était 2). Compense la suppression d'`has_institution` (max struct=3 désormais).

## 3. API Gateway
**Absente** - L'application utilise directement FastAPI comme framework web sans couche de gateway intermédiaire.

- **Rôle** : Non applicable (FastAPI gère directement les routes).
- **Routing** : Routes définies dans `app/api/routes/verify.py` :
  - `POST /api/verify` : Endpoint principal d'analyse
  - `GET /api/health` : Health check
  - `GET /api/info` : Informations service
  - `GET /api/supported-countries` : Pays supportés
- **Gestion auth/rate limiting** : Non implémentée (pas d'authentification visible).

## 4. Communication inter-services
### Type de communication
**Synchrone, appels de fonctions directes** - Tous les services sont des modules Python dans le même processus, appelés séquentiellement via imports et appels de fonctions.

- **REST/gRPC/events/queues** : Aucun - communication interne via appels Python.
- **Synchrone vs asynchrone** : Mixte - l'API FastAPI est asynchrone, mais le pipeline interne est synchrone (await sur des fonctions sync).
- **Exemple de flow (request complète)** :
  ```
  1. Client POST /api/verify avec fichier
  2. Validation fichier (taille, type)
  3. Conversion fichier → PIL + OpenCV images
  4. Preprocessing (correction image)
  5. OCR extraction texte
  6. Parallèle : Country detection + analyses spécialisées (signature, stamp, text, tampering, classification)
  7. Scoring avec pondération
  8. Construction réponse JSON
  9. Cleanup fichiers temporaires
  ```

## 5. Base de données
**Aucune base de données persistante** - L'application est stateless et ne stocke aucune donnée.

- **Une DB par service ou DB partagée** : Non applicable.
- **Tables principales** : Aucune.
- **Relations entre services** : Non applicable (pas de DB).

## 6. Gestion des données
- **Cohérence** : Non applicable (pas de données persistantes).
- **Transactions distribuées** : Non applicable.

## 7. Authentification & autorisation
**Non implémentée** - L'API est publique sans authentification.

- **Où gérée** : Nulle part.
- **JWT/OAuth** : Aucun.

## 8. Configuration & environnement
### Variables d’environnement
- `ENV=production` (dans docker-compose, mais non utilisé dans le code visible).
- Pas d'autres variables d'environnement utilisées.

### Gestion des configs
- **Fichier central** : `app/config.py` avec toutes les constantes :
  - Limites fichiers (10 Mo, types autorisés)
  - Poids scoring (dictionnaire WEIGHTS)
  - Mots-clés diplômes multilingues (DIPLOMA_KEYWORDS)
  - Langues OCR supportées (OCR_LANGUAGES)
  - Types diplômes (DIPLOMA_TYPES)
- **Chargement** : Import direct du module config.

## 9. Déploiement
### Docker / Docker Compose / Kubernetes
- **Docker** : Application conteneurisée avec `Dockerfile` (Python 3.11-slim + Tesseract + spaCy).
- **Docker Compose** : Un seul service `diploma-verifier` exposé sur port 8000.
- **Kubernetes** : Non utilisé.

### Organisation des services
- Tout dans un seul conteneur.
- Volumes montés : `./sample_docs` et `./logs` pour persister exemples et logs.

## 10. Observabilité
### Logs
- **Framework** : Logger Python standard configuré dans `app/utils/logger.py`.
- **Niveaux** : INFO, WARNING, ERROR.
- **Sortie** : Console + fichiers dans `./logs/`.
- **Événements** : Démarrage service, analyses, erreurs.

### Monitoring
**Non implémenté** - Pas de métriques, dashboards ou alerting.

### Tracing
**Non implémenté** - Pas de tracing distribué (pas nécessaire pour monolithe).

## 11. Résilience & scalabilité
### Retry / circuit breaker
**Partiellement implémenté** - Mécanismes de "graceful failure" pour les dépendances externes comme Tesseract OCR (le système peut continuer avec des capacités réduites). Pas de retry automatique complexe global.

### Load balancing
**Non applicable** - Un seul conteneur, scaling horizontal possible via multiple instances derrière un load balancer externe.

## 12. Points forts & problèmes
### Bonnes pratiques
- **Séparation des responsabilités** : Services modulaires bien isolés.
- **Configuration centralisée** : Toutes les constantes dans un fichier.
- **Validation stricte** : Pydantic pour les modèles, validation fichiers.
- **Tests unitaires** : Structure de tests présente (`tests/`).
- **Async/Await** : API non-bloquante.
- **Multilingue** : Support OCR et analyse pour 5 langues.
- **Cleanup automatique** : Fichiers temporaires nettoyés.

### Problèmes d’architecture
- **Monolithe bottleneck** : Tout dans un processus - scaling limité, risque de cascade failures.
- **Pas de cache** : Modèles spaCy rechargés à chaque restart (mais chargés une fois en mémoire).
- **Pas d'authentification** : API publique vulnérable.
- **Pas de monitoring** : Difficile de diagnostiquer en production.
- **Synchrone interne** : Pipeline bloquant, pas de parallélisation optimale.
- **Pas de DB** : Pas de persistance des résultats ou apprentissage.

## 13. Suggestions d’amélioration (optionnel)
### Communication
- Extraire services en microservices indépendants (OCR, Analyse) avec API REST/gRPC.
- Ajouter message queue (RabbitMQ) pour analyses asynchrones.

### DB
- Ajouter PostgreSQL pour stocker résultats, métriques, modèles ML.
- Event sourcing pour audit des analyses.

### Scaling
- Kubernetes pour orchestration, HPA pour scaling automatique.
- CDN pour fichiers statiques, cache Redis pour résultats fréquents.
- Circuit breakers (Hystrix) et retry policies.

### Sécurité
- Authentification JWT/OAuth.
- Rate limiting (nginx ou middleware).
- Chiffrement des données sensibles.

### Observabilité
- Prometheus + Grafana pour métriques.
- Jaeger/OpenTelemetry pour tracing.
- Alerting sur erreurs/ latences.