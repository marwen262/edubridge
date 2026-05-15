'use strict'

// ============================================================
// SEEDER 2 — Instituts (20 écoles d'ingénieurs tunisiennes)
// ============================================================
// Source : liste OIT 29/08/2024 + edubridge_seed.sql
// Login commun : <email_contact> / Password123!
// ============================================================

// ── Comptes utilisateur ──────────────────────────────────────
const ESPRIT_USER_ID   = '22222222-1111-4111-8111-111111111111'
const MEDTECH_USER_ID  = '22222222-2222-4222-8222-222222222222'
const POLY_USER_ID     = '22222222-3333-4333-8333-333333333333'
// SQL id 3
const ULT_USER_ID      = '22222222-0003-4003-8003-000300030003'
// SQL id 4
const TEKUP_USER_ID    = '22222222-0004-4004-8004-000400040004'
// SQL id 5
const POLYINTL_USER_ID = '22222222-0005-4005-8005-000500050005'
// SQL id 7
const EPI_USER_ID      = '22222222-0007-4007-8007-000700070007'
// SQL id 8
const ESAT_USER_ID     = '22222222-0008-4008-8008-000800080008'
// SQL id 9
const ESIET_USER_ID    = '22222222-0009-4009-8009-000900090009'
// SQL id 10
const IPSAS_USER_ID    = '22222222-000a-400a-800a-000a000a000a'
// SQL id 11
const IIT_USER_ID      = '22222222-000b-400b-800b-000b000b000b'
// SQL id 12
const ITEAM_USER_ID    = '22222222-000c-400c-800c-000c000c000c'
// SQL id 13
const SESAME_USER_ID   = '22222222-000d-400d-800d-000d000d000d'
// SQL id 14
const MONASTIR_USER_ID = '22222222-000e-400e-800e-000e000e000e'
// SQL id 15
const ITBS_USER_ID     = '22222222-000f-400f-800f-000f000f000f'
// SQL id 16
const SUPTECH_USER_ID  = '22222222-0010-4010-8010-001000100010'
// SQL id 17
const ESIP_USER_ID     = '22222222-0011-4011-8011-001100110011'
// SQL id 18
const MITPOLY_USER_ID  = '22222222-0012-4012-8012-001200120012'
// SQL id 19
const ESSAT_USER_ID    = '22222222-0013-4013-8013-001300130013'
// SQL id 20
const UPES_USER_ID     = '22222222-0014-4014-8014-001400140014'

// ── Profils institut ─────────────────────────────────────────
const ESPRIT_INST_ID   = '22222222-1111-4aaa-8aaa-aaaaaaaaaaaa'
const MEDTECH_INST_ID  = '22222222-2222-4bbb-8bbb-bbbbbbbbbbbb'
const POLY_INST_ID     = '22222222-3333-4ccc-8ccc-cccccccccccc'
const ULT_INST_ID      = '22222222-0003-4a03-8a03-a03a03a03a03'
const TEKUP_INST_ID    = '22222222-0004-4a04-8a04-a04a04a04a04'
const POLYINTL_INST_ID = '22222222-0005-4a05-8a05-a05a05a05a05'
const EPI_INST_ID      = '22222222-0007-4a07-8a07-a07a07a07a07'
const ESAT_INST_ID     = '22222222-0008-4a08-8a08-a08a08a08a08'
const ESIET_INST_ID    = '22222222-0009-4a09-8a09-a09a09a09a09'
const IPSAS_INST_ID    = '22222222-000a-4a0a-8a0a-a0aa0aa0aa0a'
const IIT_INST_ID      = '22222222-000b-4a0b-8a0b-a0ba0ba0ba0b'
const ITEAM_INST_ID    = '22222222-000c-4a0c-8a0c-a0ca0ca0ca0c'
const SESAME_INST_ID   = '22222222-000d-4a0d-8a0d-a0da0da0da0d'
const MONASTIR_INST_ID = '22222222-000e-4a0e-8a0e-a0ea0ea0ea0e'
const ITBS_INST_ID     = '22222222-000f-4a0f-8a0f-a0fa0fa0fa0f'
const SUPTECH_INST_ID  = '22222222-0010-4a10-8a10-a10a10a10a10'
const ESIP_INST_ID     = '22222222-0011-4a11-8a11-a11a11a11a11'
const MITPOLY_INST_ID  = '22222222-0012-4a12-8a12-a12a12a12a12'
const ESSAT_INST_ID    = '22222222-0013-4a13-8a13-a13a13a13a13'
const UPES_INST_ID     = '22222222-0014-4a14-8a14-a14a14a14a14'

module.exports = {

  up: async (queryInterface, Sequelize) => {
    const bcrypt = require('bcryptjs')
    const motDePasseHash = await bcrypt.hash('Password123!', 10)
    const maintenant = new Date()

    // ── utilisateurs ────────────────────────────────────────
    await queryInterface.bulkInsert('utilisateurs', [
      // ── Existants (3) ──
      {
        id: ESPRIT_USER_ID, email: 'contact@esprit.tn',
        mot_de_passe: motDePasseHash, role: 'institut',
        jeton_rafraichissement: null, est_actif: true,
        first_login_token: null, first_login_expires_at: null, first_login_completed: true,
        cree_le: maintenant, mis_a_jour_le: maintenant,
      },
      {
        id: MEDTECH_USER_ID, email: 'contact@medtech.tn',
        mot_de_passe: motDePasseHash, role: 'institut',
        jeton_rafraichissement: null, est_actif: true,
        first_login_token: null, first_login_expires_at: null, first_login_completed: true,
        cree_le: maintenant, mis_a_jour_le: maintenant,
      },
      {
        id: POLY_USER_ID, email: 'contact@polytechsousse.tn',
        mot_de_passe: motDePasseHash, role: 'institut',
        jeton_rafraichissement: null, est_actif: true,
        first_login_token: null, first_login_expires_at: null, first_login_completed: true,
        cree_le: maintenant, mis_a_jour_le: maintenant,
      },
      // ── Nouveaux (17) ──
      {
        id: ULT_USER_ID, email: 'contact@ult.tn',
        mot_de_passe: motDePasseHash, role: 'institut',
        jeton_rafraichissement: null, est_actif: true,
        first_login_token: null, first_login_expires_at: null, first_login_completed: true,
        cree_le: maintenant, mis_a_jour_le: maintenant,
      },
      {
        id: TEKUP_USER_ID, email: 'contact@tek-up.tn',
        mot_de_passe: motDePasseHash, role: 'institut',
        jeton_rafraichissement: null, est_actif: true,
        first_login_token: null, first_login_expires_at: null, first_login_completed: true,
        cree_le: maintenant, mis_a_jour_le: maintenant,
      },
      {
        id: POLYINTL_USER_ID, email: 'contact@polytech-intl.tn',
        mot_de_passe: motDePasseHash, role: 'institut',
        jeton_rafraichissement: null, est_actif: true,
        first_login_token: null, first_login_expires_at: null, first_login_completed: true,
        cree_le: maintenant, mis_a_jour_le: maintenant,
      },
      {
        id: EPI_USER_ID, email: 'contact@episousse.tn',
        mot_de_passe: motDePasseHash, role: 'institut',
        jeton_rafraichissement: null, est_actif: true,
        first_login_token: null, first_login_expires_at: null, first_login_completed: true,
        cree_le: maintenant, mis_a_jour_le: maintenant,
      },
      {
        id: ESAT_USER_ID, email: 'contact@esat.tn',
        mot_de_passe: motDePasseHash, role: 'institut',
        jeton_rafraichissement: null, est_actif: true,
        first_login_token: null, first_login_expires_at: null, first_login_completed: true,
        cree_le: maintenant, mis_a_jour_le: maintenant,
      },
      {
        id: ESIET_USER_ID, email: 'contact@uas.tn',
        mot_de_passe: motDePasseHash, role: 'institut',
        jeton_rafraichissement: null, est_actif: true,
        first_login_token: null, first_login_expires_at: null, first_login_completed: true,
        cree_le: maintenant, mis_a_jour_le: maintenant,
      },
      {
        id: IPSAS_USER_ID, email: 'contact@ipsas.tn',
        mot_de_passe: motDePasseHash, role: 'institut',
        jeton_rafraichissement: null, est_actif: true,
        first_login_token: null, first_login_expires_at: null, first_login_completed: true,
        cree_le: maintenant, mis_a_jour_le: maintenant,
      },
      {
        id: IIT_USER_ID, email: 'contact@iit-nau.tn',
        mot_de_passe: motDePasseHash, role: 'institut',
        jeton_rafraichissement: null, est_actif: true,
        first_login_token: null, first_login_expires_at: null, first_login_completed: true,
        cree_le: maintenant, mis_a_jour_le: maintenant,
      },
      {
        id: ITEAM_USER_ID, email: 'contact@iteam-univ.tn',
        mot_de_passe: motDePasseHash, role: 'institut',
        jeton_rafraichissement: null, est_actif: true,
        first_login_token: null, first_login_expires_at: null, first_login_completed: true,
        cree_le: maintenant, mis_a_jour_le: maintenant,
      },
      {
        id: SESAME_USER_ID, email: 'contact@sesame.tn',
        mot_de_passe: motDePasseHash, role: 'institut',
        jeton_rafraichissement: null, est_actif: true,
        first_login_token: null, first_login_expires_at: null, first_login_completed: true,
        cree_le: maintenant, mis_a_jour_le: maintenant,
      },
      {
        id: MONASTIR_USER_ID, email: 'contact@polytechmonastir.tn',
        mot_de_passe: motDePasseHash, role: 'institut',
        jeton_rafraichissement: null, est_actif: true,
        first_login_token: null, first_login_expires_at: null, first_login_completed: true,
        cree_le: maintenant, mis_a_jour_le: maintenant,
      },
      {
        id: ITBS_USER_ID, email: 'contact@itbs.tn',
        mot_de_passe: motDePasseHash, role: 'institut',
        jeton_rafraichissement: null, est_actif: true,
        first_login_token: null, first_login_expires_at: null, first_login_completed: true,
        cree_le: maintenant, mis_a_jour_le: maintenant,
      },
      {
        id: SUPTECH_USER_ID, email: 'contact@suptech.tn',
        mot_de_passe: motDePasseHash, role: 'institut',
        jeton_rafraichissement: null, est_actif: true,
        first_login_token: null, first_login_expires_at: null, first_login_completed: true,
        cree_le: maintenant, mis_a_jour_le: maintenant,
      },
      {
        id: ESIP_USER_ID, email: 'contact@esip.tn',
        mot_de_passe: motDePasseHash, role: 'institut',
        jeton_rafraichissement: null, est_actif: true,
        first_login_token: null, first_login_expires_at: null, first_login_completed: true,
        cree_le: maintenant, mis_a_jour_le: maintenant,
      },
      {
        id: MITPOLY_USER_ID, email: 'contact@mit-polytech.tn',
        mot_de_passe: motDePasseHash, role: 'institut',
        jeton_rafraichissement: null, est_actif: true,
        first_login_token: null, first_login_expires_at: null, first_login_completed: true,
        cree_le: maintenant, mis_a_jour_le: maintenant,
      },
      {
        id: ESSAT_USER_ID, email: 'contact@essat-gabes.tn',
        mot_de_passe: motDePasseHash, role: 'institut',
        jeton_rafraichissement: null, est_actif: true,
        first_login_token: null, first_login_expires_at: null, first_login_completed: true,
        cree_le: maintenant, mis_a_jour_le: maintenant,
      },
      {
        id: UPES_USER_ID, email: 'contact@upes-megrine.tn',
        mot_de_passe: motDePasseHash, role: 'institut',
        jeton_rafraichissement: null, est_actif: true,
        first_login_token: null, first_login_expires_at: null, first_login_completed: true,
        cree_le: maintenant, mis_a_jour_le: maintenant,
      },
    ], {})

    // ── instituts ────────────────────────────────────────────
    await queryInterface.bulkInsert('instituts', [

      // ── 1. ESPRIT ─────────────────────────────────────────
      {
        id: ESPRIT_INST_ID,
        utilisateur_id: ESPRIT_USER_ID,
        nom: "École Supérieure Privée d'Ingénierie et de Technologies",
        sigle: 'ESPRIT',
        description:
          "Fondée en 2003 à Ariana, ESPRIT est l'une des premières grandes écoles d'ingénieurs privées tunisiennes " +
          "et le plus grand établissement privé d'enseignement supérieur du pays avec plus de 8 000 étudiants. " +
          "Elle délivre des diplômes nationaux d'ingénieur bac+5 dans les domaines des technologies de l'information, " +
          "du génie civil, de l'électromécanique et de la mécatronique, visés par le Ministère de l'Enseignement " +
          "Supérieur tunisien et reconnus par la Commission des Titres d'Ingénieur (CTI) et HCERES. " +
          "Avec un réseau de 350 entreprises partenaires et un taux d'insertion professionnelle supérieur à 92 %, " +
          "ESPRIT est classée 1ère école d'ingénieurs privée par Entreprises Magazine.",
        site_web: 'https://esprit.tn',
        logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/f/ff/Logo_ESPRIT_Ariana.jpg/250px-Logo_ESPRIT_Ariana.jpg',
        adresse: JSON.stringify({
          rue: '2 Rue André Ampère, Cité Ghazela',
          ville: 'Ariana', gouvernorat: 'Ariana', code_postal: '2083', pays: 'Tunisie',
        }),
        accreditations: ['CTI', 'EUR-ACE', 'HCERES'],
        contact: JSON.stringify({
          telephone: '+216 70 250 000', fax: '+216 70 685 685', email: 'contact@esprit.tn',
        }),
        est_verifie: true, validation_status: 'approved',
        note: 4.5, image_couverture: 'https://www.esprit.tn/wp-content/uploads/2025/03/Entree-campus-scaled.jpg',
        taux_acceptation: 0.45, nombre_etudiants: 8000,
        suspension_reason: null, suspended_at: null, suspended_by: null,
        cree_le: maintenant, mis_a_jour_le: maintenant,
      },

      // ── 2. MedTech ────────────────────────────────────────
      {
        id: MEDTECH_INST_ID,
        utilisateur_id: MEDTECH_USER_ID,
        nom: 'Mediterranean Institute of Technology',
        sigle: 'MedTech',
        description:
          "Le Mediterranean Institute of Technology (MedTech), membre du réseau de l'Université Centrale, " +
          "est une école d'ingénieurs entièrement anglophone fondée selon le modèle pédagogique américain. " +
          "Implantée à Tunis, elle dispense des formations en génie informatique, génie électrique, génie " +
          "industriel et génie biomédical. Ses programmes sont doublement accrédités ABET (États-Unis) et " +
          "EUR-ACE, offrant à ses diplômés une reconnaissance internationale immédiate. MedTech entretient " +
          "des partenariats actifs avec des universités nord-américaines et européennes pour des échanges " +
          "académiques et des doubles diplômes.",
        site_web: 'https://medtech.tn',
        logo: 'https://www.smu.tn/storage/app/media/logos/medtech_logo-f.png',
        adresse: JSON.stringify({
          rue: 'Avenue du Roi Abdelaziz Al Saoud, Centre Urbain Nord',
          ville: 'Tunis', gouvernorat: 'Tunis', code_postal: '1082', pays: 'Tunisie',
        }),
        accreditations: ['ABET', 'EUR-ACE', 'AACSB'],
        contact: JSON.stringify({
          telephone: '+216 71 234 567', fax: '+216 71 234 568', email: 'contact@medtech.tn',
        }),
        est_verifie: true, validation_status: 'approved',
        note: 4.3, image_couverture: 'https://www.smu.tn/storage/app/uploads/public/afc/455/765/thumb__700_400_0_0_auto.png',
        taux_acceptation: 0.30, nombre_etudiants: 3500,
        suspension_reason: null, suspended_at: null, suspended_by: null,
        cree_le: maintenant, mis_a_jour_le: maintenant,
      },

      // ── 3. EPSousse ───────────────────────────────────────
      {
        id: POLY_INST_ID,
        utilisateur_id: POLY_USER_ID,
        nom: 'École Polytechnique de Sousse',
        sigle: 'EPSousse',
        description:
          "L'École Polytechnique de Sousse (EPSousse) est un établissement d'enseignement supérieur privé " +
          "situé à Sahloul, au cœur du pôle technologique de Sousse. Elle forme des ingénieurs dans les " +
          "spécialités du génie civil, du génie électrique, des télécommunications et de l'informatique " +
          "industrielle, dans le cadre d'un cursus bac+5 reconnu par le Ministère et accrédité CTI et ABET. " +
          "Son ancrage régional fort et ses partenariats avec les entreprises du bassin Centre lui confèrent " +
          "un taux d'employabilité de 89 % pour ses promotions.",
        site_web: 'https://polytechsousse.tn',
        logo: 'https://www.polytecsousse.tn/wp-content/uploads/2020/09/cropped-logo-polytech.png',
        adresse: JSON.stringify({
          rue: 'Route de Ceinture, Sahloul 3',
          ville: 'Sousse', gouvernorat: 'Sousse', code_postal: '4054', pays: 'Tunisie',
        }),
        accreditations: ['CTI', 'ABET', 'EUR-ACE'],
        contact: JSON.stringify({
          telephone: '+216 73 100 200', fax: '+216 73 100 201', email: 'contact@polytechsousse.tn',
        }),
        est_verifie: true, validation_status: 'approved',
        note: 4.1, image_couverture: 'https://africa-school-bucket3.s3.amazonaws.com/static/img/school/2022/05/25/epdtn.png',
        taux_acceptation: 0.35, nombre_etudiants: 5000,
        suspension_reason: null, suspended_at: null, suspended_by: null,
        cree_le: maintenant, mis_a_jour_le: maintenant,
      },

      // ── 4. ULT ────────────────────────────────────────────
      {
        id: ULT_INST_ID,
        utilisateur_id: ULT_USER_ID,
        nom: "Institut Supérieur Polytechnique Privé / Université Libre de Tunis",
        sigle: 'ULT',
        description:
          "L'Université Libre de Tunis (ULT) est l'une des pionnières de l'enseignement supérieur privé " +
          "en Tunisie. Son Institut Supérieur Polytechnique propose six spécialités d'ingénieur accréditées " +
          "EUR-ACE/ASIIN, couvrant le génie civil, l'électromécanique, l'énergétique, l'informatique " +
          "industrielle, le génie biologique et les industries alimentaires. Implantée avenue Louis Braille " +
          "au cœur de Tunis, ULT forme des ingénieurs polyvalents appréciés dans les secteurs de l'énergie, " +
          "de l'agroalimentaire et du numérique, avec un taux d'employabilité supérieur à 85 %.",
        site_web: 'https://www.ult-tunisie.com',
        logo: 'https://bouebdelli-university.com/wp-content/uploads/2025/06/Logo-ULT-2-1-120x168.webp',
        adresse: JSON.stringify({
          rue: '36 av. Louis Braille',
          ville: 'Tunis', gouvernorat: 'Tunis', code_postal: '1002', pays: 'Tunisie',
        }),
        accreditations: ['EUR-ACE'],
        contact: JSON.stringify({ telephone: '+216 71 902 491', email: 'contact@ult.tn' }),
        est_verifie: true, validation_status: 'approved',
        note: 3.8, image_couverture: 'https://bouebdelli-university.com/wp-content/uploads/elementor/thumbs/518380440_1178276081004373_9084695002549201544_n-r8jmbj9qczbjtidd6h80v5c2d7fi10ypzomyye6rpo.jpg',
        taux_acceptation: 0.55, nombre_etudiants: 4000,
        suspension_reason: null, suspended_at: null, suspended_by: null,
        cree_le: maintenant, mis_a_jour_le: maintenant,
      },

      // ── 5. TEK-UP ─────────────────────────────────────────
      {
        id: TEKUP_INST_ID,
        utilisateur_id: TEKUP_USER_ID,
        nom: "École Supérieure Privée de Technologies et de l'Ingénierie",
        sigle: 'TEK-UP',
        description:
          "TEK-UP est une école d'ingénieurs privée implantée à Borj Baccouche (Ariana), unique en Tunisie " +
          "à détenir l'accréditation EUR-ACE/QUACING issue d'un partenariat pédagogique franco-allemand. " +
          "Elle dispense un programme de Computer Science Engineering entièrement en anglais, conçu selon " +
          "les standards européens les plus exigeants en matière d'ingénierie logicielle, cybersécurité " +
          "et développement numérique. Ses diplômés bénéficient d'une reconnaissance internationale et " +
          "d'un réseau d'entreprises partenaires dans la Tech tunisienne et européenne.",
        site_web: 'https://www.tek-up.de',
        logo: 'https://www.ecoles.com.tn/sites/default/files/universite/logo/tek_up_logo.jpg',
        adresse: JSON.stringify({
          rue: 'Borj Baccouche',
          ville: 'Ariana', gouvernorat: 'Ariana', code_postal: '2036', pays: 'Tunisie',
        }),
        accreditations: ['EUR-ACE'],
        contact: JSON.stringify({ telephone: '+216 88 810 077', email: 'contact@tek-up.tn' }),
        est_verifie: true, validation_status: 'approved',
        note: 4.0, image_couverture: 'https://rami.tn/wp-content/uploads/2023/07/TEK-UP.webp',
        taux_acceptation: 0.40, nombre_etudiants: 2800,
        suspension_reason: null, suspended_at: null, suspended_by: null,
        cree_le: maintenant, mis_a_jour_le: maintenant,
      },

      // ── 6. Polytechnique INTL ─────────────────────────────
      {
        id: POLYINTL_INST_ID,
        utilisateur_id: POLYINTL_USER_ID,
        nom: 'Polytechnique INTL',
        sigle: 'Polytechnique INTL',
        description:
          "Polytechnique INTL est une école d'ingénieurs privée accréditée EUR-ACE/CTI, implantée aux " +
          "Berges du Lac à Tunis. Elle propose trois spécialités ingénieur orientées numérique, mécatronique " +
          "et génie industriel, avec des programmes dispensés en français et en anglais. Ses laboratoires " +
          "de pointe et ses partenariats avec des entreprises multinationales installées en Tunisie garantissent " +
          "à ses diplômés une insertion rapide dans les secteurs de la Tech, de l'industrie manufacturière " +
          "et des systèmes automatisés, avec un taux d'employabilité de 87 %.",
        site_web: 'https://www.polytech-intl.tn',
        logo: null,
        adresse: JSON.stringify({
          rue: 'Berges du Lac',
          ville: 'Tunis', gouvernorat: 'Tunis', code_postal: '1053', pays: 'Tunisie',
        }),
        accreditations: ['EUR-ACE', 'CTI'],
        contact: JSON.stringify({ telephone: '+216 70 026 426', email: 'contact@polytech-intl.tn' }),
        est_verifie: true, validation_status: 'approved',
        note: 4.0, image_couverture: 'https://images.unsplash.com/photo-1523240795612-9a054b0db644?w=1400&h=500&fit=crop&q=80',
        taux_acceptation: 0.42, nombre_etudiants: 2200,
        suspension_reason: null, suspended_at: null, suspended_by: null,
        cree_le: maintenant, mis_a_jour_le: maintenant,
      },

      // ── 7. EPI Polytechnique Sousse ───────────────────────
      {
        id: EPI_INST_ID,
        utilisateur_id: EPI_USER_ID,
        nom: "École Internationale Supérieure Privée Polytechnique de Sousse",
        sigle: 'EPI',
        description:
          "L'École Internationale Supérieure Privée Polytechnique de Sousse (EPI) est un établissement " +
          "d'enseignement supérieur privé accrédité EUR-ACE/ASIIN, membre du Groupe de Formation et " +
          "d'Ingénierie (GFI). Implantée à Sahloul (Sousse 4021), elle propose cinq filières ingénieur " +
          "bac+5 couvrant l'informatique, l'électrique, l'électromécanique, le génie industriel et le " +
          "génie civil. Ses diplômés s'insèrent dans les industries de la région Centre et au-delà, " +
          "soutenus par un solide réseau d'entreprises partenaires.",
        site_web: 'https://www.episousse.com.tn',
        logo: 'https://www.epieducationalgroup.com/themes/custom/epi-groupe/assets/images/logo.svg',
        adresse: JSON.stringify({
          rue: 'Sahloul',
          ville: 'Sousse', gouvernorat: 'Sousse', code_postal: '4021', pays: 'Tunisie',
        }),
        accreditations: ['EUR-ACE'],
        contact: JSON.stringify({ telephone: '+216 86 703 131', email: 'contact@episousse.tn' }),
        est_verifie: true, validation_status: 'approved',
        note: 3.9, image_couverture: 'https://www.epieducationalgroup.com/sites/default/files/2022-08/epi-polytechnique_2.jpg',
        taux_acceptation: 0.48, nombre_etudiants: 3000,
        suspension_reason: null, suspended_at: null, suspended_by: null,
        cree_le: maintenant, mis_a_jour_le: maintenant,
      },

      // ── 8. ESAT ───────────────────────────────────────────
      {
        id: ESAT_INST_ID,
        utilisateur_id: ESAT_USER_ID,
        nom: "École Supérieure Privée de l'Aéronautique et des Technologies",
        sigle: 'ESAT',
        description:
          "Seule école d'ingénieurs privée en Tunisie à proposer une spécialité Génie Aéronautique, " +
          "l'ESAT est accréditée EUR-ACE/ASIIN et implantée à Charguia II (Tunis 2035), à proximité " +
          "immédiate de l'aéroport international Tunis-Carthage. Elle forme des ingénieurs spécialisés " +
          "en avionique, maintenance aéronautique et géomatique, en partenariat avec des organismes de " +
          "certification et des compagnies aériennes de la région MENA. Ses diplômés accèdent à des " +
          "débouchés internationaux dans l'aérospatial, le transport aérien et les systèmes géospatiaux.",
        site_web: 'https://www.esat.ens.tn',
        logo: 'https://orientini.com/uploads/logo_esat.png',
        adresse: JSON.stringify({
          rue: 'Charguia II',
          ville: 'Tunis', gouvernorat: 'Tunis', code_postal: '2035', pays: 'Tunisie',
        }),
        accreditations: ['EUR-ACE'],
        contact: JSON.stringify({ telephone: '+216 71 940 422', email: 'contact@esat.tn' }),
        est_verifie: true, validation_status: 'approved',
        note: 4.2, image_couverture: 'https://orientini.com/uploads/esat_ecole.jpg',
        taux_acceptation: 0.25, nombre_etudiants: 1200,
        suspension_reason: null, suspended_at: null, suspended_by: null,
        cree_le: maintenant, mis_a_jour_le: maintenant,
      },

      // ── 9. ESIET-UAS ──────────────────────────────────────
      {
        id: ESIET_INST_ID,
        utilisateur_id: ESIET_USER_ID,
        nom: "École Supérieure Privée d'Ingénieurs et d'Études Technologiques de Tunis - Université Arabe des Sciences",
        sigle: 'ESIET-UAS',
        description:
          "L'ESIET-UAS est l'école d'ingénieurs de l'Université Arabe des Sciences (UAS), accréditée " +
          "EUR-ACE/CTI et implantée au 18 rue Nelson Mandela, Tunis 1002. Elle propose six spécialités " +
          "ingénieur bac+5 couvrant le génie industriel, civil, électrique, électromécanique, " +
          "mécatronique et informatique, avec des laboratoires de prototypage et d'automatisation. " +
          "Ses diplômés rejoignent les grandes entreprises tunisiennes et les multinationales " +
          "installées en Tunisie dans les secteurs de l'industrie et du numérique.",
        site_web: 'https://www.uas.ens.tn',
        logo: 'https://uas.ens.tn/wp-content/themes/uas/assets/images/UAS-lOGO-1.png',
        adresse: JSON.stringify({
          rue: '18 rue Nelson Mandela',
          ville: 'Tunis', gouvernorat: 'Tunis', code_postal: '1002', pays: 'Tunisie',
        }),
        accreditations: ['EUR-ACE', 'CTI'],
        contact: JSON.stringify({ telephone: '+216 71 335 073', email: 'contact@uas.tn' }),
        est_verifie: true, validation_status: 'approved',
        note: 3.9, image_couverture: 'https://uas.ens.tn/wp-content/themes/uas/assets/images/home/hom1.jpg',
        taux_acceptation: 0.50, nombre_etudiants: 3500,
        suspension_reason: null, suspended_at: null, suspended_by: null,
        cree_le: maintenant, mis_a_jour_le: maintenant,
      },

      // ── 10. IPSAS ─────────────────────────────────────────
      {
        id: IPSAS_INST_ID,
        utilisateur_id: IPSAS_USER_ID,
        nom: "Institut Privé Polytechnique des Sciences Avancées de Sfax",
        sigle: 'IPSAS',
        description:
          "Première grande école d'ingénieurs privée du gouvernorat de Sfax, l'IPSAS est accréditée " +
          "EUR-ACE/CTI et propose cinq filières ingénieur dont le Génie Pétrolier, unique dans le " +
          "secteur privé tunisien. Ancrée dans le tissu industriel sfaxien (chimie, mécanique, " +
          "numérique, pétrochimie), elle entretient des partenariats avec des entreprises pétrolières " +
          "et de génie industriel actives en Tunisie et dans le bassin méditerranéen. Avec 3 200 " +
          "étudiants, IPSAS assure la principale offre de formation ingénieur privée du bassin Sud-Est.",
        site_web: 'https://www.ipsas-ens.net',
        logo: 'https://www.ipsas-ens.net/logos/1746317975_1746314083_1746270353_LOGO%20PNG%20POUR%20SIGNATURE%20EMAIL.png',
        adresse: JSON.stringify({
          rue: 'Av. 5 Août',
          ville: 'Sfax', gouvernorat: 'Sfax', code_postal: '3002', pays: 'Tunisie',
        }),
        accreditations: ['EUR-ACE', 'CTI'],
        contact: JSON.stringify({ telephone: '+216 74 225 665', email: 'contact@ipsas.tn' }),
        est_verifie: true, validation_status: 'approved',
        note: 3.9, image_couverture: 'https://www.ipsas-ens.net/theme-front/assets/images/banner/ouverture.jpg',
        taux_acceptation: 0.50, nombre_etudiants: 3200,
        suspension_reason: null, suspended_at: null, suspended_by: null,
        cree_le: maintenant, mis_a_jour_le: maintenant,
      },

      // ── 11. IIT ───────────────────────────────────────────
      {
        id: IIT_INST_ID,
        utilisateur_id: IIT_USER_ID,
        nom: "Institut International Technologie - Université Nord Américaine Privée",
        sigle: 'IIT',
        description:
          "L'IIT est une école d'ingénieurs privée accréditée EUR-ACE/ASIIN, adossée à l'Université " +
          "Nord Américaine Privée (NAU), implantée Route Mharza km 1.5 à Sfax. Elle forme des ingénieurs " +
          "en informatique, génie industriel, génie des procédés et génie mécanique, avec une approche " +
          "pédagogique inspirée du modèle nord-américain intégrant projets, stages et travaux pratiques " +
          "intensifs. Ses diplômés s'insèrent dans les industries sfaxiennes et régionales avec un " +
          "taux d'employabilité de 85 %.",
        site_web: 'https://www.iit-nau.com',
        logo: null,
        adresse: JSON.stringify({
          rue: 'Route Mharza km 1.5',
          ville: 'Sfax', gouvernorat: 'Sfax', code_postal: '3003', pays: 'Tunisie',
        }),
        accreditations: ['EUR-ACE'],
        contact: JSON.stringify({ telephone: '+216 87 738 377', email: 'contact@iit-nau.tn' }),
        est_verifie: true, validation_status: 'approved',
        note: 3.8, image_couverture: 'https://images.unsplash.com/photo-1541339907198-e08756dedf3f?w=1400&h=500&fit=crop&q=80',
        taux_acceptation: 0.52, nombre_etudiants: 2800,
        suspension_reason: null, suspended_at: null, suspended_by: null,
        cree_le: maintenant, mis_a_jour_le: maintenant,
      },

      // ── 12. Iteam University ──────────────────────────────
      {
        id: ITEAM_INST_ID,
        utilisateur_id: ITEAM_USER_ID,
        nom: "École Supérieure Privée d'Ingénierie en Informatique et Administration des Affaires (Iteam University)",
        sigle: 'Iteam',
        description:
          "Iteam University est une école d'ingénieurs et de management privée accréditée EUR-ACE/QUACING, " +
          "implantée au 85 rue de Palestine à Tunis. Elle forme des ingénieurs en génie informatique avec " +
          "une double compétence en informatique avancée et management des systèmes d'information, " +
          "préparant ses diplômés aux postes d'ingénieur-chef de projet, architecte logiciel ou " +
          "consultant IT dans des environnements à haute valeur ajoutée numérique.",
        site_web: 'https://www.iteam-univ.tn',
        logo: 'https://www.iteam-univ.tn/assets/design/logos/logo%20iteams%20uni%20vecto.png',
        adresse: JSON.stringify({
          rue: '85 rue de Palestine',
          ville: 'Tunis', gouvernorat: 'Tunis', code_postal: '1002', pays: 'Tunisie',
        }),
        accreditations: ['EUR-ACE'],
        contact: JSON.stringify({ telephone: '+216 88 878 178', email: 'contact@iteam-univ.tn' }),
        est_verifie: true, validation_status: 'approved',
        note: 3.7, image_couverture: 'https://www.iteam-univ.tn/assets/design/photos/qui-sommes-nous-team.jpg',
        taux_acceptation: 0.45, nombre_etudiants: 1800,
        suspension_reason: null, suspended_at: null, suspended_by: null,
        cree_le: maintenant, mis_a_jour_le: maintenant,
      },

      // ── 13. SESAME ────────────────────────────────────────
      {
        id: SESAME_INST_ID,
        utilisateur_id: SESAME_USER_ID,
        nom: "École Supérieure Privée des Sciences Appliquées et de Management",
        sigle: 'SESAME',
        description:
          "SESAME est une école d'ingénieurs privée accréditée EUR-ACE/ASIIN, implantée au Parc " +
          "Technologique El Ghazala à Tunis 2088, au cœur du Silicon Valley tunisien. Elle propose " +
          "une formation en génie informatique orientée sciences appliquées et management, alliant " +
          "développement logiciel, systèmes d'information et compétences managériales. Sa localisation " +
          "dans la technopole d'El Ghazala facilite les connexions avec les entreprises IT et les " +
          "start-ups installées dans ce pôle d'innovation.",
        site_web: 'https://www.sesame.com.tn',
        logo: 'https://www.ecoles.com.tn/sites/default/files/universite/logo/sesame_logo.jpg',
        adresse: JSON.stringify({
          rue: 'Parc Technologique El Ghazala',
          ville: 'Tunis', gouvernorat: 'Ariana', code_postal: '2088', pays: 'Tunisie',
        }),
        accreditations: ['EUR-ACE'],
        contact: JSON.stringify({ telephone: '+216 81 373 773', email: 'contact@sesame.tn' }),
        est_verifie: true, validation_status: 'approved',
        note: 3.7, image_couverture: 'https://images.unsplash.com/photo-1519452635265-7b1fbfd1e4e0?w=1400&h=500&fit=crop&q=80',
        taux_acceptation: 0.50, nombre_etudiants: 1500,
        suspension_reason: null, suspended_at: null, suspended_by: null,
        cree_le: maintenant, mis_a_jour_le: maintenant,
      },

      // ── 14. Polytech Monastir ─────────────────────────────
      {
        id: MONASTIR_INST_ID,
        utilisateur_id: MONASTIR_USER_ID,
        nom: "École Supérieure Polytechnique Privée de Monastir",
        sigle: 'Polytech Monastir',
        description:
          "L'École Supérieure Polytechnique Privée de Monastir est un établissement d'enseignement " +
          "supérieur privé en cours d'accréditation EUR-ACE/ASIIN, implanté avenue Taieb M'hiri à " +
          "Monastir. Elle propose des formations en génie informatique et génie électrique adaptées " +
          "aux besoins des entreprises industrielles et numériques du bassin Centre-Est (Monastir, " +
          "Mahdia, Sfax). Ses étudiants bénéficient d'un environnement universitaire dynamique " +
          "et d'un accompagnement personnalisé vers l'emploi dans la région.",
        site_web: 'https://www.polytechmonastir.tn',
        logo: 'https://polytechmonastir.com/wp-content/uploads/2024/08/logo-removebg-preview.png',
        adresse: JSON.stringify({
          rue: "Av. Taieb M'hiri",
          ville: 'Monastir', gouvernorat: 'Monastir', code_postal: '5000', pays: 'Tunisie',
        }),
        accreditations: ['EUR-ACE'],
        contact: JSON.stringify({ telephone: '+216 86 771 011', email: 'contact@polytechmonastir.tn' }),
        est_verifie: true, validation_status: 'approved',
        note: 3.6, image_couverture: 'https://polytechmonastir.com/wp-content/uploads/2024/08/local.jpg',
        taux_acceptation: 0.60, nombre_etudiants: 1200,
        suspension_reason: null, suspended_at: null, suspended_by: null,
        cree_le: maintenant, mis_a_jour_le: maintenant,
      },

      // ── 15. ITBS ──────────────────────────────────────────
      {
        id: ITBS_INST_ID,
        utilisateur_id: ITBS_USER_ID,
        nom: "École Supérieure Privée des Technologies et de l'Information et de Management de Nabeul (IT Business School)",
        sigle: 'ITBS',
        description:
          "IT Business School (ITBS) est une école d'ingénieurs privée en cours d'accréditation " +
          "EUR-ACE/ASIIN, implantée Route Hammamet à Nabeul. Elle propose une formation en génie " +
          "informatique alliant compétences techniques en développement logiciel, réseaux et " +
          "intelligence artificielle avec une sensibilisation au management des systèmes " +
          "d'information. Sa localisation dans le cap Bon, région touristique et industrielle, " +
          "lui permet de tisser des liens avec les entreprises du secteur des services numériques.",
        site_web: 'https://www.itbs.tn',
        logo: 'https://itbs.tn/hojoseq/2020/04/logo_itbs_186x70.png',
        adresse: JSON.stringify({
          rue: 'Route Hammamet',
          ville: 'Nabeul', gouvernorat: 'Nabeul', code_postal: '8000', pays: 'Tunisie',
        }),
        accreditations: ['EUR-ACE'],
        contact: JSON.stringify({ telephone: '+216 87 766 888', email: 'contact@itbs.tn' }),
        est_verifie: true, validation_status: 'approved',
        note: 3.6, image_couverture: 'https://i1.wp.com/itbs.tn/hojoseq/2020/06/itbs-intro-pic.png?fit=1920%2C1080&ssl=1',
        taux_acceptation: 0.65, nombre_etudiants: 900,
        suspension_reason: null, suspended_at: null, suspended_by: null,
        cree_le: maintenant, mis_a_jour_le: maintenant,
      },

      // ── 16. SUPTECH ───────────────────────────────────────
      {
        id: SUPTECH_INST_ID,
        utilisateur_id: SUPTECH_USER_ID,
        nom: "École Supérieure Privée de Technologie et de Management",
        sigle: 'SUPTECH',
        description:
          "SUPTECH est une école supérieure privée en cours d'accréditation EUR-ACE/QUACING, " +
          "implantée au 22 avenue de Madrid à Tunis 1000. Elle forme des ingénieurs en génie " +
          "informatique avec une double orientation technologie et management, adaptée aux " +
          "exigences des entreprises digitales et des PME tunisiennes. Sa localisation en " +
          "centre-ville de Tunis en fait une école accessible aux étudiants de la grande " +
          "métropole, avec des liens étroits avec les entreprises locales du secteur IT.",
        site_web: 'https://www.suptech.tn',
        logo: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSidMJs7ykwWTPmVF6Lq0RZ_0GU3TQYJVfwtw&s',
        adresse: JSON.stringify({
          rue: '22 av. de Madrid',
          ville: 'Tunis', gouvernorat: 'Tunis', code_postal: '1000', pays: 'Tunisie',
        }),
        accreditations: ['EUR-ACE'],
        contact: JSON.stringify({ telephone: '+216 88 663 777', email: 'contact@suptech.tn' }),
        est_verifie: true, validation_status: 'approved',
        note: 3.5, image_couverture: 'https://images.unsplash.com/photo-1523240795612-9a054b0db644?w=1400&h=500&fit=crop&q=80',
        taux_acceptation: 0.65, nombre_etudiants: 800,
        suspension_reason: null, suspended_at: null, suspended_by: null,
        cree_le: maintenant, mis_a_jour_le: maintenant,
      },

      // ── 17. ESIP Gafsa ────────────────────────────────────
      {
        id: ESIP_INST_ID,
        utilisateur_id: ESIP_USER_ID,
        nom: "École Supérieure d'Ingénieurs Privée de Gafsa",
        sigle: 'ESIP',
        description:
          "L'École Supérieure d'Ingénieurs Privée de Gafsa (ESIP) est la seule école d'ingénieurs " +
          "privée du Sud-Ouest tunisien, en cours d'accréditation EUR-ACE/ASIIN, implantée au Campus " +
          "Zarrouk à Gafsa 2112. Elle répond aux besoins en ingénieurs informaticiens des industries " +
          "minières, pharmaceutiques et énergétiques actives dans le bassin minier gafsoui. Ses " +
          "étudiants bénéficient d'un accompagnement de proximité et de débouchés dans les secteurs " +
          "stratégiques du Grand Sud tunisien.",
        site_web: 'https://www.esip.tn',
        logo: 'https://esip.tn/wp-content/uploads/2021/09/iconLogo160.png',
        adresse: JSON.stringify({
          rue: 'Campus Zarrouk',
          ville: 'Gafsa', gouvernorat: 'Gafsa', code_postal: '2112', pays: 'Tunisie',
        }),
        accreditations: ['EUR-ACE'],
        contact: JSON.stringify({ telephone: '+216 83 788 061', email: 'contact@esip.tn' }),
        est_verifie: true, validation_status: 'approved',
        note: 3.5, image_couverture: 'https://esip.tn/wp-content/uploads/2021/10/SlideEsip01.jpg',
        taux_acceptation: 0.70, nombre_etudiants: 700,
        suspension_reason: null, suspended_at: null, suspended_by: null,
        cree_le: maintenant, mis_a_jour_le: maintenant,
      },

      // ── 18. MIT POLYTECH ──────────────────────────────────
      {
        id: MITPOLY_INST_ID,
        utilisateur_id: MITPOLY_USER_ID,
        nom: "École Polytechnique Méditerranéenne Privée de Tunis",
        sigle: 'MIT Polytech',
        description:
          "L'École Polytechnique Méditerranéenne Privée de Tunis (MIT Polytech) est un établissement " +
          "d'enseignement supérieur privé en cours d'accréditation EUR-ACE/ASIIN, implanté à Tunis. " +
          "Elle propose trois spécialités ingénieur — informatique, mécatronique et génie industriel " +
          "et logistique — adaptées aux enjeux de la transformation numérique et de la chaîne " +
          "logistique des entreprises tunisiennes. Ses programmes allient théorie, projets " +
          "industriels et stages pour former des ingénieurs immédiatement opérationnels.",
        site_web: 'https://mit-polytech.tn',
        logo: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRrLGrfeJRjX9iOJZWGYwbnYsWuXZ7fT4CvAg&s',
        adresse: JSON.stringify({
          rue: null,
          ville: 'Tunis', gouvernorat: 'Tunis', code_postal: null, pays: 'Tunisie',
        }),
        accreditations: ['EUR-ACE'],
        contact: JSON.stringify({ email: 'contact@mit-polytech.tn' }),
        est_verifie: true, validation_status: 'approved',
        note: 3.6, image_couverture: 'https://rami.tn/wp-content/uploads/2023/07/MIT-Polytech.webp',
        taux_acceptation: 0.60, nombre_etudiants: 1000,
        suspension_reason: null, suspended_at: null, suspended_by: null,
        cree_le: maintenant, mis_a_jour_le: maintenant,
      },

      // ── 19. ESSAT Gabès ───────────────────────────────────
      {
        id: ESSAT_INST_ID,
        utilisateur_id: ESSAT_USER_ID,
        nom: "École Supérieure des Sciences Appliquées et Technologie Privée de Gabès",
        sigle: 'ESSAT',
        description:
          "L'ESSAT est une école d'ingénieurs privée en cours d'accréditation EUR-ACE/ASIIN, " +
          "implantée avenue Abou El Kacem Chebbi à Gabès. Elle propose des formations en génie " +
          "informatique et génie électrique répondant aux besoins des industries chimiques, " +
          "pétrolières et énergétiques du gouvernorat de Gabès. Ses étudiants bénéficient de " +
          "partenariats avec les entreprises du pôle industriel gabesien, l'un des plus importants " +
          "de Tunisie, avec des débouchés dans l'énergie, la pétrochimie et le numérique.",
        site_web: 'https://www.essat-gabes.com',
        logo: 'https://www.essat-gabes.com/wp-content/uploads/2018/10/logoessatgabes.png',
        adresse: JSON.stringify({
          rue: 'Av. Abou El Kacem Chebbi',
          ville: 'Gabès', gouvernorat: 'Gabès', code_postal: '6011', pays: 'Tunisie',
        }),
        accreditations: ['EUR-ACE'],
        contact: JSON.stringify({ telephone: '+216 81 707 331', email: 'contact@essat-gabes.tn' }),
        est_verifie: true, validation_status: 'approved',
        note: 3.5, image_couverture: 'https://www.essat-gabes.com/wp-content/uploads/2016/01/value-engineering.jpg',
        taux_acceptation: 0.68, nombre_etudiants: 750,
        suspension_reason: null, suspended_at: null, suspended_by: null,
        cree_le: maintenant, mis_a_jour_le: maintenant,
      },

      // ── 20. UPES Mégrine ──────────────────────────────────
      {
        id: UPES_INST_ID,
        utilisateur_id: UPES_USER_ID,
        nom: "Faculté Privée des Sciences de Gestion et de la Technologie UPES Mégrine",
        sigle: 'UPES',
        description:
          "L'UPES est une faculté privée en cours d'accréditation EUR-ACE/ASIIN, implantée au " +
          "122 avenue de la République à Mégrine (banlieue sud de Tunis). Elle forme des ingénieurs " +
          "informaticiens à travers trois filières — génie informatique, systèmes et réseaux, " +
          "et informatique industrielle — avec une approche pratique et professionnalisante. " +
          "Sa localisation dans la banlieue sud de Tunis lui permet de servir les bassins " +
          "d'emploi de Mégrine, Ben Arous et du grand sud tunisois.",
        site_web: 'https://www.upes-megrine.com',
        logo: 'https://upes-megrine.com/wp-content/uploads/2025/11/Fichier-1@2x-1.png',
        adresse: JSON.stringify({
          rue: '122 av. de la République',
          ville: 'Mégrine', gouvernorat: 'Ben Arous', code_postal: '2033', pays: 'Tunisie',
        }),
        accreditations: ['EUR-ACE'],
        contact: JSON.stringify({ telephone: '+216 71 426 354', email: 'contact@upes-megrine.tn' }),
        est_verifie: true, validation_status: 'approved',
        note: 3.5, image_couverture: 'https://upes-megrine.com/wp-content/uploads/2025/12/01-scaled.jpg',
        taux_acceptation: 0.70, nombre_etudiants: 900,
        suspension_reason: null, suspended_at: null, suspended_by: null,
        cree_le: maintenant, mis_a_jour_le: maintenant,
      },

    ], {})
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.bulkDelete('instituts', {
      id: [
        ESPRIT_INST_ID, MEDTECH_INST_ID, POLY_INST_ID,
        ULT_INST_ID, TEKUP_INST_ID, POLYINTL_INST_ID, EPI_INST_ID,
        ESAT_INST_ID, ESIET_INST_ID, IPSAS_INST_ID, IIT_INST_ID,
        ITEAM_INST_ID, SESAME_INST_ID, MONASTIR_INST_ID, ITBS_INST_ID,
        SUPTECH_INST_ID, ESIP_INST_ID, MITPOLY_INST_ID, ESSAT_INST_ID, UPES_INST_ID,
      ],
    }, {})

    await queryInterface.bulkDelete('utilisateurs', {
      id: [
        ESPRIT_USER_ID, MEDTECH_USER_ID, POLY_USER_ID,
        ULT_USER_ID, TEKUP_USER_ID, POLYINTL_USER_ID, EPI_USER_ID,
        ESAT_USER_ID, ESIET_USER_ID, IPSAS_USER_ID, IIT_USER_ID,
        ITEAM_USER_ID, SESAME_USER_ID, MONASTIR_USER_ID, ITBS_USER_ID,
        SUPTECH_USER_ID, ESIP_USER_ID, MITPOLY_USER_ID, ESSAT_USER_ID, UPES_USER_ID,
      ],
    }, {})
  },

}
