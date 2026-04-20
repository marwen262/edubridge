# Architecture Microservices - Diploma Verifier

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
├── [Text Analyzer] → Analyse cohérence texte (spaCy + regex)
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
- **Responsabilité principale** : Coordination du pipeline d'analyse complet, appel séquentiel des services spécialisés, agrégation des résultats.
- **Technologies utilisées** : Python pur, asyncio pour les appels asynchrones.
- **Dépendances** : Tous les autres services internes.

### Preprocessing Service
- **Responsabilité principale** : Prétraitement des images pour optimiser l'OCR (redimensionnement, correction gamma, seuillage).
- **Technologies utilisées** : OpenCV, scikit-image, NumPy.
- **Dépendances** : Aucune (traitement d'image brute).

### OCR Service
- **Responsabilité principale** : Extraction de texte via OCR, détection de langue, extraction de champs clés via regex et NLP.
- **Technologies utilisées** : Tesseract OCR, spaCy (modèles fr_core_news_sm, xx_ent_wiki_sm), langdetect, regex Python.
- **Dépendances** : Modèles spaCy chargés au démarrage.

### Country Detector
- **Responsabilité principale** : Détection automatique du pays d'origine basé sur le texte extrait et patterns regex.
- **Technologies utilisées** : Regex Python, langdetect.
- **Dépendances** : Résultats OCR.

### Signature Detector
- **Responsabilité principale** : Détection de signatures manuscrites dans l'image via analyse de contours et formes.
- **Technologies utilisées** : OpenCV, scikit-image.
- **Dépendances** : Image originale (non prétraitée).

### Stamp Detector
- **Responsabilité principale** : Détection de cachets officiels via analyse de formes circulaires et couleurs.
- **Technologies utilisées** : OpenCV, NumPy.
- **Dépendances** : Image originale.

### Text Analyzer
- **Responsabilité principale** : Analyse de la cohérence du texte (présence de mentions officielles, grammaire, structure).
- **Technologies utilisées** : spaCy, regex, dictionnaires de mots-clés multilingues.
- **Dépendances** : Texte extrait par OCR, langue détectée.

### Tampering Detector
- **Responsabilité principale** : Détection de falsifications via analyse des métadonnées PDF et anomalies visuelles.
- **Technologies utilisées** : PyMuPDF (pour PDF), OpenCV, python-magic.
- **Dépendances** : Fichier original + image convertie.

### Diploma Classifier
- **Responsabilité principale** : Classification binaire (diplôme vs autre document) via NLP et mots-clés.
- **Technologies utilisées** : spaCy, regex, dictionnaires multilingues.
- **Dépendances** : Texte OCR + image.

### Scoring Engine
- **Responsabilité principale** : Calcul du score final d'authenticité basé sur les résultats de tous les services, avec pondération configurable.
- **Technologies utilisées** : Python pur, calculs mathématiques.
- **Dépendances** : Résultats de tous les services.

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
**Non implémenté** - Pas de mécanismes de résilience (l'application plante en cas d'erreur).

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