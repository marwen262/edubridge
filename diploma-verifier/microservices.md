# Architecture - Diploma Verifier

> Outil de vérification documentaire de diplômes par OCR + scoring heuristique pondéré. Ce service n'utilise PAS de machine learning entraîné ni de détection de fraude par IA — il s'agit d'une analyse heuristique déterministe combinant Tesseract OCR, regex multilingues, spaCy (NER pré-entraîné), et détecteurs visuels OpenCV (Hough circles pour les cachets).

## 0. Changelog V6 (mai 2026)

Refonte du pipeline OCR/scoring pour stabiliser la détection sur diplômes Arabic (cas Tunisie typique) et descendre les temps d'analyse sous 30 secondes.

### Bugs critiques corrigés
| Bug | Fichier | Impact |
|---|---|---|
| **Double prétraitement** : `preprocess()` binarisait l'image avant l'OCR (Tesseract LSTM dégradé) | `services/orchestrator.py` | +30 à +50 points sur diplômes valides |
| **`cv2.fitEllipse` NaN crash** : le détecteur de cachet retournait `confidence=0` systématiquement | `services/stamp_detector.py` | stamp_confidence détecté correctement (0.85–0.95) |
| **Convention rotation OSD/fallback opposée** : `ROTATE_90_CW` vs `ROTATE_90_CCW` pour le même angle 270° | `services/ocr_service.py` | Speedup ×2 sur diplômes mal-orientés (plus de fallback inutile) |
| **`_YEAR_PATTERN` `\b` cassé en Unicode** : ratait les années dans les diplômes Arabic | `services/text_analyzer.py` | `has_date=True` sur diplômes Arabic |

### Améliorations de couverture multilingue
- **Mots-clés Arabic ajoutés** dans `DIPLOMA_TYPES['ar']` (`config.py`) : `شهادة`, `ليسانس`, `ماستر`, `دكتوراه`, `دبلوم`, `إجازة`, `بكالوريوس`, `ماجستير`, `ماجستير`, `شهادة التخرج`. La fonction `classify_document()` (text_analyzer.py) consomme cette liste.
- **`check_coherence` multi-langues** (text_analyzer.py) : patterns Arabic, Anglais, accents normalisés via NFKD, flag `re.DOTALL`. Les patterns Arabic exacts sont définis dans `_CERTIFICATION_PHRASES` (`يشهد\s+أن`, `نشهد\s+أن`, `تحصل\s+على`).
- **Fallback regex Arabic** pour les noms (`_ARABIC_NAME_PATTERN`) en complément de spaCy
- **5 passes OCR** au lieu de 3 : `ara`, `fra`, `eng`, **`ara+fra`**, **`fra+eng`** (combine-langs pour diplômes bilingues)
- **Fallback 4-rotation** : quand toutes les passes OSD retournent un `semantic_score == 0`, le service teste les 4 orientations (0°/90°/180°/270°) sur image downsamplée à 800px, garde la meilleure, et ré-exécute le pipeline OCR complet sur la rotation choisie

### Recalibrage du scoring
- **`has_institution` retiré** du `structure_count`, du calcul `_semantic_score()` (ocr_service.py) et de `TEXT_WEIGHTS` (scoring_engine.py — poids redistribués). Un diplôme sans institution détectée n'est plus pénalisé.
- **Seuils structure** abaissés : boost `≥2` (était 3), penalty `<1` (était 2). Compense la nouvelle taille `core_fields=3`.
- **Seuil early-reject** abaissé : `diploma_confidence < 0.2` (était 0.3) — moins de faux rejets sur Arabic.
- **Plafond `no-content`** (scoring_engine.py:462) : `structure_count==0` AND `semantic_score<0.1` → score capé à 18 (bloque les logos/images avec features géométriques).
- **Plafond `hallucination`** (scoring_engine.py:478) : `structure_count <= 1` AND `not has_degree_keyword` AND `not has_date` AND `len(raw_text) < 50` → score capé à 18. Atténue la divergence Tesseract 5.4 (Windows) vs 5.5 (Docker Linux) qui peut halluciner des noms à partir de bruit visuel.

### Performances (sur Windows local, 5 passes parallélisées)
| Fichier | Avant | Après V6 | Speedup |
|---|---|---|---|
| test1.jpg (diplôme arabe straight) | 48 s | 12 s | 4× |
| testrotation.jpg (même diplôme, 90° tourné) | 5 m 35 s | 13 s | **26×** |
| test.jpg (diplôme ingénieur) | 1 m 25 s | 4 s | 21× |
| logoedubridge.png (logo, cas de contrôle non-diplôme) | 49 s | 6 s | 8× |

Optimisations principales :
1. **Parallélisation OCR via `ThreadPoolExecutor`** : les 5 passes Tesseract tournent en parallèle (subprocess libère le GIL) → speedup ~5×.
2. **Un seul appel Tesseract par passe** : `image_to_data` reconstruit texte + confidence en un seul appel (au lieu de `image_to_string` + `image_to_data` séparés) → ~50% par passe.
3. **Quick rotation test downsamplée à 800px** : le fallback 4-rotation tourne sur une image légère pour identifier la bonne orientation, puis re-OCR full-quality une seule fois → ~80% de gain sur le fallback.
4. **Stamp detector downsample à 1200px max** : Hough circles est O(n²), passer de 4000 à 1200px = ~11× plus rapide.

### Divergence Tesseract 5.4 (Windows) vs 5.5 (Docker Linux) — comportement connu et atténué

Tesseract 5.4 (Windows / uvicorn local) et Tesseract 5.5 (Docker Linux) produisent des sorties OCR différentes sur les mêmes images :

- **5.5 hallucine plus** sur images quasi-vides (logos, icônes, fragments) : peut produire un nom plausible (ex: "Tom") à partir de bruit, ce qui faisait monter artificiellement le score.
- **5.5 segmente différemment** les mentions Arabic (espacement variable autour de وزارة, التعليم).

**Atténuation appliquée** (déterministe, pas un bug ouvert) :
- `OFFICIAL_PATTERNS` (config.py) : ajout de variantes permissives `وزارة\s+\w+` et `الجمهورية\s+\w+` pour matcher les segmentations 5.5.
- Plafond `hallucination` (scoring_engine.py:478) : `structure_count <= 1` sans keyword diplôme ni date sur texte < 50 caractères → score capé à 18. La constante `50` est inline dans la condition (pas exposée en config).
- Plafond `no-content` (scoring_engine.py:462) : `structure_count == 0` AND `semantic_score < 0.1` → cap 18.

Les scores absolus peuvent encore différer légèrement entre les deux environnements, mais les rejets/acceptations restent cohérents.

---

## 1. Vue globale de l’architecture

### Type d’architecture
**Monolithe modulaire** avec séparation logique des responsabilités en modules Python. L'application est déployée comme un seul conteneur Docker. Les "services" sont des modules importés et appelés en séquence — pas de communication inter-process.

### Diagramme logique du pipeline réel
Le pipeline réellement exécuté (orchestrator.py) :

```
[Client HTTP]
    ↓
[FastAPI Application]
    ↓
[API Routes (/api/verify)]
    ↓
[Orchestrator (analyze_document)]
    ↓
├── convert_file()          → utils/image_converter.py (PIL + OpenCV)
├── extract_text()          → ocr_service.py (Tesseract 5 passes parallèles + OSD + fallback rotation, spaCy NER)
├── detect_signature()      → signature_detector.py (OpenCV contours)
├── detect_stamp()          → stamp_detector.py (Hough circles, downsample 1200px)
├── analyze_text()          → text_analyzer.py (regex multilingues, classify_document, check_coherence, keyword_density_penalty)
└── compute_score()         → scoring_engine.py (TEXT_WEIGHTS pondéré + plafonds heuristiques)
    ↓
[VerifyResponse Pydantic] → JSON {score, confidence_level, reasons[]}
```

### Modules présents mais non intégrés au pipeline
Trois modules existent dans `app/services/` mais ne sont **pas** importés par `orchestrator.py` :

- ❌ `preprocessing.py` — `preprocess()` n'est plus appelé (V6 : binarisait l'image, dégradait Tesseract LSTM). Le module reste pour référence.
- ❌ `tampering_detector.py` — implémenté mais non câblé au pipeline.
- ❌ `diploma_classifier.py` — implémenté mais non câblé. La classification effective est faite par `text_analyzer.classify_document()`.
- ❌ `country_detector.py` — implémenté mais non câblé. `country` est forcé à `"unknown"` dans les logs.

### Vue d’ensemble des services
L'application traite des documents (PDF/images) pour produire un score d'authenticité heuristique. Le pipeline est synchrone (un seul `await` au niveau FastAPI), exécuté dans un seul processus Python. La parallélisation est limitée aux 5 passes Tesseract via `ThreadPoolExecutor` à l'intérieur de `extract_text()`.

## 2. Liste des modules

### Orchestrator
- **Responsabilité principale** : Coordination du pipeline d'analyse, sorties anticipées (early exits), agrégation des résultats selon le schéma `VerifyResponse` (score, confidence_level, reasons).
- **Technologies utilisées** : Python pur. Fonction `async def analyze_document()` exposée à FastAPI, mais tous les appels internes sont **synchrones** (pas de `await` sur les modules internes).
- **Dépendances réelles** (imports directs) : `ocr_service`, `scoring_engine`, `signature_detector`, `stamp_detector`, `text_analyzer`, `utils.image_converter`, `utils.logger`. ⚠️ N'importe **pas** `tampering_detector`, `diploma_classifier`, `preprocessing`, `country_detector`.
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
- **V6 — Fallback 4-rotation** : quand toutes les passes OSD retournent un `semantic_score == 0`, le service teste les 4 orientations (0°/90°/180°/270°) sur image downsamplée à 800px (1 passe combinée `ara+fra` chacune), garde la meilleure, et ré-exécute le pipeline OCR complet sur la rotation choisie.
- **V6 — Bug rotation OSD/fallback corrigé** : `_correct_rotation` (chemin OSD) et `_rotate_image` (chemin fallback) utilisaient des conventions opposées pour les angles 90° et 270° (ROTATE_90_CW vs ROTATE_90_CCW). Désormais cohérents avec la convention OSD (rotate=N° = N° clockwise pour redresser).
- **V6 — Mots-clés Arabic ajoutés** : `_DEGREE_KEYWORDS` étendu via `DIPLOMA_TYPES['ar']` qui inclut maintenant `شهادة`, `إجازة` (en plus de `ليسانس`, `ماستر`, `دكتوراه`, `دبلوم`).
- **V6 — Combine-langs ajoutés** : passes `ara+fra` et `fra+eng` pour les diplômes bilingues (typique tunisien fr/ar).

### Country Detector ❌ non intégré
- **Responsabilité prévue** : Détection automatique du pays d'origine basé sur le texte extrait et patterns regex.
- **État** : module présent (`services/country_detector.py`) mais **jamais importé** par l'orchestrator. Le champ `country` est forcé à `"unknown"` dans les logs.

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

### Tampering Detector ❌ non intégré
- **Responsabilité prévue** : Détection de falsifications via analyse des métadonnées PDF et anomalies visuelles.
- **État** : module présent (`services/tampering_detector.py`) mais **jamais importé** par l'orchestrator. Aucun signal de tampering ne remonte au scoring.

### Diploma Classifier ❌ non intégré
- **État** : module présent (`services/diploma_classifier.py`) mais **jamais importé** par l'orchestrator. La classification effective (diplôme vs autre document) est réalisée par `text_analyzer.classify_document()`, qui consomme `DIPLOMA_TYPES` de `config.py` et applique un seuil ≥ 1 occurrence pour déclencher `doc_type="diploma"`.

### Scoring Engine
- **Responsabilité principale** : Calcul déterministe du score final d'authenticité V6 (borné entre 3 et 98) par scoring pondéré heuristique. Intègre les couches V5/V6 : pondération dynamique, boost de cohérence, pénalités (keyword stuffing, doc type non-diplôme, incohérence visuelle), boost visuel (sauvetage des documents à OCR faible mais signaux visuels forts), plafond de sécurité (`semantic_score < 0.15` AND `score > 70` → cap 70), plafond no-content (`structure_count==0` AND `semantic_score<0.1` → cap 18), plafond hallucination (`structure_count<=1` sans diplôme/date sur texte<50 chars → cap 18).
- **Technologies utilisées** : Python pur, calculs heuristiques pondérés. Aucun modèle entraîné.
- **Dépendances** : sortie de `text_analyzer.analyze_text()`, `signature_detector`, `stamp_detector`, `ocr_service`.
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

## 4. Communication inter-modules
### Type de communication
**Synchrone, appels de fonctions directes** — tous les modules sont importés dans le même processus Python.

- **REST/gRPC/events/queues** : Aucun.
- **Synchrone vs asynchrone** : `analyze_document()` est `async` pour FastAPI, mais aucun `await` sur les modules internes — le pipeline est entièrement synchrone. Seule la parallélisation interne se trouve dans `ocr_service.extract_text()` (5 passes Tesseract via `ThreadPoolExecutor`).
- **Flow réel d'une requête `POST /api/verify`** :
  ```
  1. FastAPI reçoit le fichier (validation taille + MIME via routes/verify.py)
  2. Sauvegarde temporaire sur disque
  3. orchestrator.analyze_document(file_path, mime_type, ...)
     a. convert_file()      → PIL + OpenCV
     b. extract_text()      → OCR 5 passes parallèles (ThreadPoolExecutor) + OSD + fallback rotation
     c. detect_signature()  → séquentiel
     d. detect_stamp()      → séquentiel
     e. early-return si document vide (no text + no visual)
     f. analyze_text()      → entités, classification, cohérence, density penalty
     g. early-return si diploma_confidence < 0.2 ET visual_signal < 0.3
     h. compute_score()     → TEXT_WEIGHTS pondéré + plafonds
  4. Construction VerifyResponse {score, confidence_level, reasons}
  5. Cleanup fichier temporaire
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

## 12. Constats sur l'état actuel

### Implémenté
- Pipeline OCR + scoring déterministe fonctionnel sur 5 langues (fra, eng, ara, spa, deu).
- Validation stricte d'entrée : Pydantic + filtre MIME (`ALLOWED_MIME_TYPES` config.py).
- Configuration centralisée (`app/config.py`).
- Cleanup des fichiers temporaires après chaque requête.
- Tests présents dans `tests/` (vérifier le contenu pour le périmètre exact).
- Multilingue : `OCR_LANGUAGES = "fra+eng+ara+spa+deu"`.

### Partiel ⚠️
- Parallélisation : limitée aux 5 passes Tesseract dans `extract_text()`. Les autres modules (signature, stamp, text_analyzer, scoring) tournent en séquentiel.
- Cache : modèles spaCy chargés une fois en mémoire au démarrage du processus, mais rechargés à chaque redémarrage du conteneur (pas de cache externe).
- Résilience : pas de retry automatique. Tesseract peut produire des sorties différentes entre versions (cf. section 0 — divergence 5.4/5.5 atténuée par les plafonds anti-hallucination).

### Non implémenté ❌
- Authentification / autorisation (API publique).
- Rate limiting.
- Monitoring (pas de Prometheus, pas de métriques exportées).
- Tracing distribué.
- Persistance des résultats (stateless par design).
- Modules `tampering_detector`, `diploma_classifier`, `country_detector`, `preprocessing` : présents en code mais non câblés au pipeline orchestrator.