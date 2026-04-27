'use strict'

// ============================================================
// SEEDER 4 — Candidats (3 étudiants test)
// ============================================================
// Crée pour chaque candidat :
//   - 1 ligne dans `utilisateurs` (role='candidat')
//   - 1 ligne dans `candidats` liée via utilisateur_id
// Mot de passe commun : Password123!
//
// ATTENTION schéma :
//   - candidats.langues             → ARRAY(STRING) (pas JSONB)
//   - candidats.parcours_academique → JSONB [{diplome, etablissement, annee, mention}]
//   - candidats.adresse             → JSONB {rue, ville, ...}
//
// IDENTITÉ LÉGALE (depuis migration 20260421000000) :
//   - Ali, Sarra      → tunisiens   (cin renseigné, passeport=null)
//   - Yassine         → international (passeport renseigné, cin=null)
//   - Le hook beforeValidate ne se déclenche PAS sur bulkInsert ;
//     les valeurs cohérentes sont fournies directement.
//   - cin et numero_passeport sont uniques.
// ============================================================

// Comptes utilisateur (FK vers candidats.utilisateur_id)
const ALI_USER_ID     = '44444444-1111-4111-8111-111111111111'
const SARRA_USER_ID   = '44444444-2222-4222-8222-222222222222'
const YASSINE_USER_ID = '44444444-3333-4333-8333-333333333333'

// Profils candidat
const ALI_CAND_ID     = '44444444-1111-4aaa-8aaa-aaaaaaaaaaaa'
const SARRA_CAND_ID   = '44444444-2222-4bbb-8bbb-bbbbbbbbbbbb'
const YASSINE_CAND_ID = '44444444-3333-4ccc-8ccc-cccccccccccc'

module.exports = {

  up: async (queryInterface, Sequelize) => {
    const bcrypt = require('bcryptjs')
    const motDePasseHash = await bcrypt.hash('Password123!', 10)
    const maintenant = new Date()

    // ── utilisateurs (3 comptes candidat) ───────────────────
    await queryInterface.bulkInsert('utilisateurs', [
      {
        id: ALI_USER_ID,
        email: 'ali@test.tn',
        mot_de_passe: motDePasseHash,
        role: 'candidat',
        jeton_rafraichissement: null,
        est_actif: true,
        cree_le: maintenant,
        mis_a_jour_le: maintenant,
      },
      {
        id: SARRA_USER_ID,
        email: 'sarra@test.tn',
        mot_de_passe: motDePasseHash,
        role: 'candidat',
        jeton_rafraichissement: null,
        est_actif: true,
        cree_le: maintenant,
        mis_a_jour_le: maintenant,
      },
      {
        id: YASSINE_USER_ID,
        email: 'yassine@test.tn',
        mot_de_passe: motDePasseHash,
        role: 'candidat',
        jeton_rafraichissement: null,
        est_actif: true,
        cree_le: maintenant,
        mis_a_jour_le: maintenant,
      },
    ], {})

    // ── candidats (3 profils) ───────────────────────────────
    await queryInterface.bulkInsert('candidats', [
      {
        id: ALI_CAND_ID,
        utilisateur_id: ALI_USER_ID,
        prenom: 'Ali',
        nom: 'Bouali',
        date_naissance: '2005-03-12',
        genre: 'homme',
        telephone: '+216 22 123 456',
        adresse: JSON.stringify({
          rue: '14 Rue Habib Bourguiba',
          ville: 'Tunis',
          gouvernorat: 'Tunis',
          code_postal: '1000',
          pays: 'Tunisie',
        }),
        situation_familiale: 'celibataire',
        type_bac: 'mathematiques',
        moyenne_bac: 15.42,
        annee_bac: 2024,
        // ARRAY(STRING) — array JS natif (pas de JSON.stringify)
        langues: ['arabe', 'français', 'anglais'],
        parcours_academique: JSON.stringify([
          {
            diplome: 'Baccalauréat',
            etablissement: 'Lycée Pilote de Tunis',
            annee: 2024,
            mention: 'Bien',
          },
        ]),
        niveau_actuel: 'bac',
        photo_profil: '/uploads/seed-photo-ali.jpg',
        // ── Identité légale (tunisien) ─────────────────────
        nationalite: 'tunisienne',
        cin: '11223344',
        numero_passeport: null,
        type_piece_identite: 'cin',
        cree_le: maintenant,
        mis_a_jour_le: maintenant,
      },
      {
        id: SARRA_CAND_ID,
        utilisateur_id: SARRA_USER_ID,
        prenom: 'Sarra',
        nom: 'Ben Salah',
        date_naissance: '2004-07-25',
        genre: 'femme',
        telephone: '+216 25 987 654',
        adresse: JSON.stringify({
          rue: '8 Avenue de la République',
          ville: 'Sfax',
          gouvernorat: 'Sfax',
          code_postal: '3000',
          pays: 'Tunisie',
        }),
        situation_familiale: 'celibataire',
        type_bac: 'sciences',
        moyenne_bac: 16.85,
        annee_bac: 2023,
        langues: ['arabe', 'français', 'anglais', 'allemand'],
        parcours_academique: JSON.stringify([
          {
            diplome: 'Baccalauréat',
            etablissement: 'Lycée Pilote de Sfax',
            annee: 2023,
            mention: 'Très Bien',
          },
          {
            diplome: 'Cycle préparatoire (1ère année)',
            etablissement: 'IPEIS Sfax',
            annee: 2024,
            mention: 'Assez Bien',
          },
        ]),
        niveau_actuel: 'licence',
        photo_profil: '/uploads/seed-photo-sarra.jpg',
        // ── Identité légale (tunisienne) ───────────────────
        nationalite: 'tunisienne',
        cin: '22334455',
        numero_passeport: null,
        type_piece_identite: 'cin',
        cree_le: maintenant,
        mis_a_jour_le: maintenant,
      },
      {
        id: YASSINE_CAND_ID,
        utilisateur_id: YASSINE_USER_ID,
        prenom: 'Yassine',
        nom: 'Trabelsi',
        date_naissance: '2005-11-04',
        genre: 'homme',
        telephone: '+216 50 246 810',
        adresse: JSON.stringify({
          rue: '32 Rue Ibn Khaldoun',
          ville: 'Sousse',
          gouvernorat: 'Sousse',
          code_postal: '4000',
          pays: 'Tunisie',
        }),
        situation_familiale: 'celibataire',
        type_bac: 'technique',
        moyenne_bac: 12.10,
        annee_bac: 2024,
        langues: ['arabe', 'français'],
        parcours_academique: JSON.stringify([
          {
            diplome: 'Baccalauréat',
            etablissement: 'Lycée Technique de Sousse',
            annee: 2024,
            mention: 'Passable',
          },
        ]),
        niveau_actuel: 'bac',
        photo_profil: '/uploads/seed-photo-yassine.jpg',
        // ── Identité légale (international — français) ─────
        nationalite: 'française',
        cin: null,
        numero_passeport: 'FR1234567',
        type_piece_identite: 'passeport',
        cree_le: maintenant,
        mis_a_jour_le: maintenant,
      },
    ], {})
  },

  down: async (queryInterface, Sequelize) => {
    // Ordre inverse des FK (candidats → utilisateurs)
    await queryInterface.bulkDelete('candidats', {
      id: [ALI_CAND_ID, SARRA_CAND_ID, YASSINE_CAND_ID],
    }, {})

    await queryInterface.bulkDelete('utilisateurs', {
      id: [ALI_USER_ID, SARRA_USER_ID, YASSINE_USER_ID],
    }, {})
  },

}
