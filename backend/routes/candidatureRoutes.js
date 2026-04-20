// routes/candidatureRoutes.js — Routes candidatures (workflow)
const router = require('express').Router();
const auth   = require('../middleware/authMiddleware');
const { isAdmin, restrictTo } = require('../middleware/authMiddleware');
const { verifierPropriete } = require('../middleware/candidatureGuards');
const upload = require('../middleware/upload');
const ctrl   = require('../controllers/candidatureController');

// Upload multi-fichiers
const candidatureUpload = upload.fields([
  { name: 'cv',                    maxCount: 1 },
  { name: 'diplome_bac',           maxCount: 1 },
  { name: 'releves_notes',         maxCount: 1 },
  { name: 'lettre_motivation',     maxCount: 1 },
  { name: 'piece_identite',        maxCount: 1 },
  { name: 'photo_identite',        maxCount: 1 },
  { name: 'lettre_recommandation', maxCount: 1 },
  { name: 'attestation_stage',     maxCount: 1 },
]);

// Routes fixes (avant /:id)
router.get('/mine',           auth, restrictTo('candidat'), ctrl.getMesCandidatures);
router.get('/institute/list', auth, restrictTo('institut'), ctrl.getCandidaturesInstitut);
router.get('/',               auth, isAdmin,                ctrl.getAllCandidatures);

// Créer un brouillon (candidat)
router.post('/', auth, restrictTo('candidat'), candidatureUpload, ctrl.creerCandidature);

// Modifier un brouillon (candidat propriétaire)
router.put('/:id', auth, restrictTo('candidat'), verifierPropriete, candidatureUpload, ctrl.mettreAJourCandidature);

// Soumettre le dossier (candidat propriétaire)
router.post('/:id/soumettre', auth, restrictTo('candidat'), verifierPropriete, ctrl.soumettreCandidature);

// Transition de statut (institut ou admin)
router.patch('/:id/statut', auth, restrictTo('admin', 'institut'), ctrl.changerStatut);

// Consultation
router.get('/:id', auth, ctrl.getCandidatureById);

// Suppression (admin)
router.delete('/:id', auth, isAdmin, ctrl.deleteCandidature);

module.exports = router;
