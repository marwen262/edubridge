'use strict'

// ============================================================
// SEEDER 3 — Programmes (70 formations sur 20 instituts)
// ============================================================
// ENUMs métier :
//   domaine : informatique | genie_civil | electrique | mecanique | chimie | agronomie | finance | management
//   niveau  : cycle_preparatoire | licence | master | ingenieur
//   mode    : cours_du_jour | cours_du_soir | alternance | formation_continue
// ============================================================

// FK instituts (cohérents avec seeder 2)
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

// ── UUIDs STABLES — référencés par seeders 5 et 6 ────────────
const PROG_ESPRIT_INFO_ID    = '33333333-1111-4111-8111-000000000001'
const PROG_ESPRIT_CIVIL_ID   = '33333333-1111-4111-8111-000000000002'
const PROG_ESPRIT_TELECOM_ID = '33333333-1111-4111-8111-000000000003'
const PROG_ESPRIT_PREP_ID    = '33333333-1111-4111-8111-000000000004'
const PROG_ESPRIT_ELECMEC_ID = '33333333-1111-4111-8111-000000000005'
const PROG_ESPRIT_MECA_ID    = '33333333-1111-4111-8111-000000000006'

const PROG_MEDTECH_CE_ID     = '33333333-2222-4222-8222-000000000001'
const PROG_MEDTECH_SE_ID     = '33333333-2222-4222-8222-000000000002'
const PROG_MEDTECH_RENEW_ID  = '33333333-2222-4222-8222-000000000003'
const PROG_MEDTECH_EE_ID     = '33333333-2222-4222-8222-000000000004'
const PROG_MEDTECH_BME_ID    = '33333333-2222-4222-8222-000000000005'

const PROG_POLY_PREP_ID      = '33333333-3333-4333-8333-000000000001'
const PROG_POLY_CIVIL_ID     = '33333333-3333-4333-8333-000000000002'
const PROG_POLY_TELECOM_ID   = '33333333-3333-4333-8333-000000000003'
const PROG_POLY_ELEC_ID      = '33333333-3333-4333-8333-000000000004'
const PROG_POLY_INFO_IND_ID  = '33333333-3333-4333-8333-000000000005'

// ── UUIDs nouveaux programmes (44444444 prefix) ──────────────
// ULT (sql 3) — 7 programmes
const PROG_ULT_PREP_ID       = '44444444-0003-4003-8001-000300000001'
const PROG_ULT_CIVIL_ID      = '44444444-0003-4003-8002-000300000002'
const PROG_ULT_ELECMEC_ID    = '44444444-0003-4003-8003-000300000003'
const PROG_ULT_ENERG_ID      = '44444444-0003-4003-8004-000300000004'
const PROG_ULT_ELECINFO_ID   = '44444444-0003-4003-8005-000300000005'
const PROG_ULT_BIO_ID        = '44444444-0003-4003-8006-000300000006'
const PROG_ULT_ALIM_ID       = '44444444-0003-4003-8007-000300000007'

// TEK-UP (sql 4) — 1 programme
const PROG_TEKUP_CSE_ID      = '44444444-0004-4004-8001-000400000001'

// Polytechnique INTL (sql 5) — 4 programmes
const PROG_POLYINTL_PREP_ID  = '44444444-0005-4005-8001-000500000001'
const PROG_POLYINTL_IRM_ID   = '44444444-0005-4005-8002-000500000002'
const PROG_POLYINTL_MECA_ID  = '44444444-0005-4005-8003-000500000003'
const PROG_POLYINTL_IND_ID   = '44444444-0005-4005-8004-000500000004'

// EPI Sousse (sql 7) — 6 programmes
const PROG_EPI_PREP_ID       = '44444444-0007-4007-8001-000700000001'
const PROG_EPI_ELECMEC_ID    = '44444444-0007-4007-8002-000700000002'
const PROG_EPI_ELEC_ID       = '44444444-0007-4007-8003-000700000003'
const PROG_EPI_IND_ID        = '44444444-0007-4007-8004-000700000004'
const PROG_EPI_CIVIL_ID      = '44444444-0007-4007-8005-000700000005'
const PROG_EPI_INFO_ID       = '44444444-0007-4007-8006-000700000006'

// ESAT (sql 8) — 2 programmes
const PROG_ESAT_AERO_ID      = '44444444-0008-4008-8001-000800000001'
const PROG_ESAT_GEO_ID       = '44444444-0008-4008-8002-000800000002'

// ESIET-UAS (sql 9) — 7 programmes
const PROG_ESIET_PREP_ID     = '44444444-0009-4009-8001-000900000001'
const PROG_ESIET_IND_ID      = '44444444-0009-4009-8002-000900000002'
const PROG_ESIET_CIVIL_ID    = '44444444-0009-4009-8003-000900000003'
const PROG_ESIET_ELEC_ID     = '44444444-0009-4009-8004-000900000004'
const PROG_ESIET_ELECMEC_ID  = '44444444-0009-4009-8005-000900000005'
const PROG_ESIET_MECA_ID     = '44444444-0009-4009-8006-000900000006'
const PROG_ESIET_INFO_ID     = '44444444-0009-4009-8007-000900000007'

// IPSAS (sql 10) — 6 programmes
const PROG_IPSAS_PREP_ID     = '44444444-000a-400a-8001-000a00000001'
const PROG_IPSAS_CIVIL_ID    = '44444444-000a-400a-8002-000a00000002'
const PROG_IPSAS_ELECMEC_ID  = '44444444-000a-400a-8003-000a00000003'
const PROG_IPSAS_INFO_ID     = '44444444-000a-400a-8004-000a00000004'
const PROG_IPSAS_PETRO_ID    = '44444444-000a-400a-8005-000a00000005'
const PROG_IPSAS_IND_ID      = '44444444-000a-400a-8006-000a00000006'

// IIT (sql 11) — 5 programmes
const PROG_IIT_PREP_ID       = '44444444-000b-400b-8001-000b00000001'
const PROG_IIT_INFO_ID       = '44444444-000b-400b-8002-000b00000002'
const PROG_IIT_IND_ID        = '44444444-000b-400b-8003-000b00000003'
const PROG_IIT_PROC_ID       = '44444444-000b-400b-8004-000b00000004'
const PROG_IIT_MECA_ID       = '44444444-000b-400b-8005-000b00000005'

// Iteam (sql 12) — 1 programme
const PROG_ITEAM_INFO_ID     = '44444444-000c-400c-8001-000c00000001'

// SESAME (sql 13) — 1 programme
const PROG_SESAME_INFO_ID    = '44444444-000d-400d-8001-000d00000001'

// Polytech Monastir (sql 14) — 2 programmes
const PROG_MONASTIR_INFO_ID  = '44444444-000e-400e-8001-000e00000001'
const PROG_MONASTIR_ELEC_ID  = '44444444-000e-400e-8002-000e00000002'

// ITBS (sql 15) — 1 programme
const PROG_ITBS_INFO_ID      = '44444444-000f-400f-8001-000f00000001'

// SUPTECH (sql 16) — 1 programme
const PROG_SUPTECH_INFO_ID   = '44444444-0010-4010-8001-001000000001'

// ESIP (sql 17) — 1 programme
const PROG_ESIP_INFO_ID      = '44444444-0011-4011-8001-001100000001'

// MIT POLYTECH (sql 18) — 4 programmes
const PROG_MITPOLY_PREP_ID   = '44444444-0012-4012-8001-001200000001'
const PROG_MITPOLY_INFO_ID   = '44444444-0012-4012-8002-001200000002'
const PROG_MITPOLY_MECA_ID   = '44444444-0012-4012-8003-001200000003'
const PROG_MITPOLY_INDLOG_ID = '44444444-0012-4012-8004-001200000004'

// ESSAT (sql 19) — 2 programmes
const PROG_ESSAT_INFO_ID     = '44444444-0013-4013-8001-001300000001'
const PROG_ESSAT_ELEC_ID     = '44444444-0013-4013-8002-001300000002'

// UPES (sql 20) — 3 programmes
const PROG_UPES_INFO_ID      = '44444444-0014-4014-8001-001400000001'
const PROG_UPES_RESEAUX_ID   = '44444444-0014-4014-8002-001400000002'
const PROG_UPES_INDINFO_ID   = '44444444-0014-4014-8003-001400000003'

// ── Nouveaux programmes Finance (55555555 prefix) ────────────
const PROG_ESPRIT_FINTECH_ID  = '55555555-0001-4001-8001-000100000001'
const PROG_MEDTECH_FINANCE_ID = '55555555-0002-4002-8001-000200000001'
const PROG_ITEAM_FINANCE_ID   = '55555555-0003-4003-8001-000300000001'

// ── Nouveaux programmes Management (55555555 prefix) ─────────
const PROG_MEDTECH_MBA_ID     = '55555555-0004-4004-8001-000400000001'
const PROG_SUPTECH_MGMT_ID    = '55555555-0005-4005-8001-000500000001'
const PROG_ITEAM_MGMT_ID      = '55555555-0006-4006-8001-000600000001'

const dateLimite = '2026-08-31'

// ── Documents requis ─────────────────────────────────────────
// bulkInsert est bas niveau (pas de model type processing) : JSON.stringify passe
// la valeur comme string que PostgreSQL caste en JSONB. Le frontend parseJsonbArray()
// gère les deux formats (array natif ou string JSON).
const documentsRequisPreparatoire = JSON.stringify([
  { nom: 'diplome_bac',   obligatoire: true,  label: 'Diplôme / Attestation Baccalauréat' },
  { nom: 'releves_notes', obligatoire: true,  label: 'Relevés de notes lycée (2e et 3e années)' },
])
const documentsRequisLicence = JSON.stringify([
  { nom: 'diplome_bac',   obligatoire: true, label: 'Diplôme Baccalauréat' },
  { nom: 'releves_notes', obligatoire: true, label: 'Relevés de notes' },
])
const documentsRequisIngenieur = JSON.stringify([
  { nom: 'diplome_bac',           obligatoire: true,  label: 'Diplôme Baccalauréat' },
  { nom: 'attestation_prepa',     obligatoire: false, label: 'Attestation validation Cycle Préparatoire (ou résultat concours)' },
  { nom: 'releves_notes',         obligatoire: true,  label: 'Relevés de notes Cycle Préparatoire' },
  { nom: 'lettre_recommandation', obligatoire: false, label: 'Lettre de recommandation' },
])
const documentsRequisMaster = JSON.stringify([
  { nom: 'diplome_licence',       obligatoire: true,  label: 'Diplôme Licence (ou Diplôme Ingénieur équivalent)' },
  { nom: 'releves_notes',         obligatoire: true,  label: 'Relevés de notes Licence' },
  { nom: 'lettre_recommandation', obligatoire: false, label: 'Lettre de recommandation' },
  { nom: 'attestation_stage',     obligatoire: false, label: 'Attestation de stage' },
])

// ── Prérequis ────────────────────────────────────────────────
const prerequisBac = JSON.stringify({
  conditions: ['Baccalauréat (Mathématiques, Sciences Techniques ou Sciences Expérimentales)'],
  moyenne_bac_min: 12.0,
  types_bac: ['mathematiques', 'sciences', 'technique'],
})
const prerequisBacInfo = JSON.stringify({
  conditions: ['Baccalauréat (Mathématiques ou Sciences Techniques)'],
  moyenne_bac_min: 13.0,
  types_bac: ['mathematiques', 'sciences', 'technique'],
})
const prerequisIngenieur = JSON.stringify({
  conditions: [
    'Cycle Préparatoire Intégré validé (2 ans)',
    "OU réussite au concours national d'entrée ingénieur",
  ],
  moyenne_prepa_min: 12.0,
  types_bac: ['mathematiques', 'sciences', 'technique'],
})
const prerequisIngenieurInfo = JSON.stringify({
  conditions: [
    'Cycle Préparatoire Intégré validé (2 ans)',
    "OU réussite au concours national d'entrée ingénieur",
  ],
  moyenne_prepa_min: 13.0,
  types_bac: ['mathematiques', 'sciences', 'technique'],
})
const prerequisMasterTelecom = JSON.stringify({
  conditions: [
    'Licence appliquée ou fondamentale en électronique, réseaux ou télécommunications',
    "OU Diplôme d'ingénieur en électrique, télécom ou informatique",
  ],
  moyenne_min: 12.0,
  specialites_compatibles: ['electrique', 'informatique'],
})
const prerequisMasterSoftware = JSON.stringify({
  conditions: [
    'Licence appliquée ou fondamentale en informatique ou génie logiciel',
    "OU Diplôme d'ingénieur en informatique ou systèmes embarqués",
  ],
  moyenne_min: 13.0,
  specialites_compatibles: ['informatique'],
})
const prerequisBacEco = JSON.stringify({
  conditions: ['Baccalauréat (toutes séries — Économie, Mathématiques ou Sciences recommandées)'],
  moyenne_bac_min: 12.0,
  types_bac: ['mathematiques', 'sciences', 'economie', 'lettres'],
})
const prerequisMasterGestion = JSON.stringify({
  conditions: [
    'Licence en Sciences de Gestion, Économie, Comptabilité ou Finance',
    "OU Diplôme d'ingénieur avec orientation management ou finance",
  ],
  moyenne_min: 12.0,
})

module.exports = {

  up: async (queryInterface, Sequelize) => {
    const maintenant = new Date()

    await queryInterface.bulkInsert('programmes', [

      // ══════════════════════════════════════════════════════
      // ESPRIT (6) — instituts existant
      // ══════════════════════════════════════════════════════
      {
        id: PROG_ESPRIT_INFO_ID, institut_id: ESPRIT_INST_ID,
        titre: 'Génie Informatique', domaine: 'informatique', niveau: 'ingenieur',
        mode: 'cours_du_jour', duree_annees: 3,
        description:
          "Cycle ingénieur bac+5 accrédité CTI et reconnu HCERES : développement logiciel " +
          "avancé, intelligence artificielle, cybersécurité, cloud computing et DevOps. " +
          "Accessible après validation du Cycle Préparatoire Intégré ESPRIT (2 ans) ou " +
          "réussite au concours national d'entrée ingénieur, avec une capacité de 120 places. " +
          "Les diplômés affichent un taux d'insertion professionnelle supérieur à 92 % dans les 6 mois.",
        documents_requis: documentsRequisIngenieur, prerequis: prerequisIngenieurInfo,
        frais_inscription: 8500.0, date_limite_candidature: dateLimite, capacite: 120,
        est_actif: true, langue: 'Français', date_debut: '2026-09-15',
        cree_le: maintenant, mis_a_jour_le: maintenant,
      },
      {
        id: PROG_ESPRIT_CIVIL_ID, institut_id: ESPRIT_INST_ID,
        titre: 'Licence Génie Civil', domaine: 'genie_civil', niveau: 'licence',
        mode: 'cours_du_soir', duree_annees: 3,
        description:
          "Licence appliquée en génie civil (bac+3) dispensée en cours du soir pour les " +
          "bacheliers en activité professionnelle : béton armé et précontraint, BIM, " +
          "hydraulique urbaine, topographie et gestion de chantier. " +
          "Formation reconnue par le Ministère de l'Enseignement Supérieur tunisien. " +
          "Les diplômés accèdent aux postes de technicien supérieur en bureau d'études ou en entreprise de construction.",
        documents_requis: documentsRequisLicence, prerequis: prerequisBac,
        frais_inscription: 5200.0, date_limite_candidature: dateLimite, capacite: 60,
        est_actif: true, langue: 'Français', date_debut: '2026-09-15',
        cree_le: maintenant, mis_a_jour_le: maintenant,
      },
      {
        id: PROG_ESPRIT_TELECOM_ID, institut_id: ESPRIT_INST_ID,
        titre: 'Master Télécommunications et Réseaux', domaine: 'electrique', niveau: 'master',
        mode: 'cours_du_jour', duree_annees: 2,
        description:
          "Master professionnel en télécommunications et réseaux (bac+5) accrédité CTI : " +
          "réseaux mobiles 5G/6G, SDN/NFV, protocoles IoT, transmission optique et cybersécurité. " +
          "Projets de fin d'études en partenariat avec Orange Tunisie et Ooredoo. " +
          "Les diplômés s'insèrent dans les opérateurs télécoms, les intégrateurs réseaux et les départements IT des grands groupes.",
        documents_requis: documentsRequisMaster, prerequis: prerequisMasterTelecom,
        frais_inscription: 8200.0, date_limite_candidature: dateLimite, capacite: 50,
        est_actif: true, langue: 'Français/Anglais', date_debut: '2026-09-15',
        cree_le: maintenant, mis_a_jour_le: maintenant,
      },
      {
        id: PROG_ESPRIT_PREP_ID, institut_id: ESPRIT_INST_ID,
        titre: 'Cycle Préparatoire Intégré', domaine: 'mecanique', niveau: 'cycle_preparatoire',
        mode: 'cours_du_jour', duree_annees: 2,
        description:
          "Cycle préparatoire intégré de 2 ans commun à l'ensemble des spécialisations ingénieur ESPRIT : " +
          "mathématiques avancées, physique générale, algorithmique et programmation, sciences de l'ingénieur et électronique. " +
          "La spécialisation (Génie Informatique, Civil, Électromécanique ou Mécatronique) " +
          "est choisie en fin de cycle selon le classement général et les vœux de l'étudiant.",
        documents_requis: documentsRequisPreparatoire, prerequis: prerequisBac,
        frais_inscription: 5500.0, date_limite_candidature: dateLimite, capacite: 80,
        est_actif: true, langue: 'Français', date_debut: '2026-09-15',
        cree_le: maintenant, mis_a_jour_le: maintenant,
      },
      {
        id: PROG_ESPRIT_ELECMEC_ID, institut_id: ESPRIT_INST_ID,
        titre: 'Génie Électromécanique', domaine: 'mecanique', niveau: 'ingenieur',
        mode: 'cours_du_jour', duree_annees: 3,
        description:
          "Cycle ingénieur bac+5 en génie électromécanique accrédité CTI : machines tournantes, " +
          "électronique de puissance, automatisation des systèmes de production et maintenance industrielle préventive. " +
          "Accessible après validation du Cycle Préparatoire Intégré ESPRIT ou concours national. " +
          "Les diplômés s'insèrent dans l'industrie manufacturière, la maintenance et l'énergie avec un taux d'emploi supérieur à 90 %.",
        documents_requis: documentsRequisIngenieur, prerequis: prerequisIngenieur,
        frais_inscription: 8500.0, date_limite_candidature: dateLimite, capacite: 80,
        est_actif: true, langue: 'Français', date_debut: '2026-09-15',
        cree_le: maintenant, mis_a_jour_le: maintenant,
      },
      {
        id: PROG_ESPRIT_MECA_ID, institut_id: ESPRIT_INST_ID,
        titre: 'Génie Mécatronique', domaine: 'mecanique', niveau: 'ingenieur',
        mode: 'cours_du_jour', duree_annees: 3,
        description:
          "Cycle ingénieur bac+5 alliant mécanique, électronique et informatique embarquée, accrédité CTI : " +
          "conception de systèmes mécatroniques, robotique collaborative, véhicules autonomes et impression 3D industrielle. " +
          "Dispensé en français et en anglais, avec des laboratoires de prototypage équipés dernière génération. " +
          "Les diplômés rejoignent les secteurs automobile, aérospatial et robotique industrielle en Tunisie et à l'international.",
        documents_requis: documentsRequisIngenieur, prerequis: prerequisIngenieurInfo,
        frais_inscription: 9000.0, date_limite_candidature: dateLimite, capacite: 60,
        est_actif: true, langue: 'Français/Anglais', date_debut: '2026-09-15',
        cree_le: maintenant, mis_a_jour_le: maintenant,
      },

      // ══════════════════════════════════════════════════════
      // MedTech (5)
      // ══════════════════════════════════════════════════════
      {
        id: PROG_MEDTECH_CE_ID, institut_id: MEDTECH_INST_ID,
        titre: 'Computer Engineering', domaine: 'informatique', niveau: 'ingenieur',
        mode: 'cours_du_jour', duree_annees: 3,
        description:
          "Cycle ingénieur bac+5 en génie informatique dispensé intégralement en anglais selon le modèle " +
          "pédagogique américain, doublement accrédité ABET (USA) et EUR-ACE : architecture matérielle et " +
          "logicielle, systèmes embarqués, intelligence artificielle, cybersécurité et développement full-stack. " +
          "Les diplômés bénéficient d'opportunités de doubles diplômes avec des universités nord-américaines " +
          "et d'une reconnaissance internationale immédiate dans le secteur du numérique.",
        documents_requis: documentsRequisIngenieur, prerequis: prerequisIngenieurInfo,
        frais_inscription: 12000.0, date_limite_candidature: dateLimite, capacite: 50,
        est_actif: true, langue: 'Anglais', date_debut: '2026-09-15',
        cree_le: maintenant, mis_a_jour_le: maintenant,
      },
      {
        id: PROG_MEDTECH_SE_ID, institut_id: MEDTECH_INST_ID,
        titre: 'Master Software Engineering', domaine: 'informatique', niveau: 'master',
        mode: 'alternance', duree_annees: 2,
        description:
          "Master en génie logiciel (bac+5) dispensé en anglais et en alternance : 3 jours par semaine " +
          "en entreprise partenaire, 2 jours de cours — microservices, CI/CD, cloud-native et MLOps. " +
          "Accrédité ABET (USA), ce programme forme des ingénieurs logiciels opérationnels dès la fin " +
          "de leur formation grâce à l'immersion professionnelle progressive. " +
          "Accessible aux titulaires d'une licence ou d'un diplôme d'ingénieur en informatique.",
        documents_requis: documentsRequisMaster, prerequis: prerequisMasterSoftware,
        frais_inscription: 12500.0, date_limite_candidature: dateLimite, capacite: 40,
        est_actif: true, langue: 'Anglais', date_debut: '2026-09-15',
        cree_le: maintenant, mis_a_jour_le: maintenant,
      },
      {
        id: PROG_MEDTECH_RENEW_ID, institut_id: MEDTECH_INST_ID,
        titre: 'Licence Renewable Energy', domaine: 'electrique', niveau: 'licence',
        mode: 'formation_continue', duree_annees: 3,
        description:
          "Licence en systèmes d'énergie renouvelable (bac+3) dispensée en mode formation continue " +
          "(sessions soir et week-end) : photovoltaïque solaire, éolien, réseaux intelligents, " +
          "stockage d'énergie et audit énergétique. Conçue pour les techniciens souhaitant se " +
          "reconvertir dans les énergies vertes, en cohérence avec la stratégie tunisienne de transition énergétique. " +
          "Les diplômés accèdent aux sociétés de production d'énergie renouvelable et aux bureaux d'études.",
        documents_requis: documentsRequisLicence, prerequis: prerequisBac,
        frais_inscription: 9000.0, date_limite_candidature: dateLimite, capacite: 40,
        est_actif: true, langue: 'Français/Anglais', date_debut: '2027-02-01',
        cree_le: maintenant, mis_a_jour_le: maintenant,
      },
      {
        id: PROG_MEDTECH_EE_ID, institut_id: MEDTECH_INST_ID,
        titre: 'Electrical Engineering', domaine: 'electrique', niveau: 'ingenieur',
        mode: 'cours_du_jour', duree_annees: 3,
        description:
          "Cycle ingénieur bac+5 en génie électrique, accrédité ABET (USA) et dispensé en anglais : " +
          "électronique de puissance, traitement du signal numérique, réseaux intelligents et systèmes de contrôle-commande. " +
          "Les étudiants réalisent des projets industriels réels avec les entreprises multinationales partenaires de MedTech. " +
          "Les diplômés s'insèrent dans les secteurs de l'énergie, des télécommunications et de l'automatisation industrielle.",
        documents_requis: documentsRequisIngenieur, prerequis: prerequisIngenieurInfo,
        frais_inscription: 12000.0, date_limite_candidature: dateLimite, capacite: 40,
        est_actif: true, langue: 'Anglais', date_debut: '2026-09-15',
        cree_le: maintenant, mis_a_jour_le: maintenant,
      },
      {
        id: PROG_MEDTECH_BME_ID, institut_id: MEDTECH_INST_ID,
        titre: 'Biomedical Engineering', domaine: 'electrique', niveau: 'ingenieur',
        mode: 'cours_du_jour', duree_annees: 3,
        description:
          "Cycle ingénieur bac+5 en génie biomédical, accrédité ABET (USA) et dispensé en anglais : " +
          "imagerie médicale, bioinstrumentation, biomécanique et réglementation des dispositifs médicaux. " +
          "Les étudiants bénéficient de partenariats avec des établissements de santé tunisiens et internationaux " +
          "pour des stages cliniques et des projets de fin d'études à fort impact. " +
          "Les diplômés rejoignent les secteurs des technologies médicales et du génie hospitalier.",
        documents_requis: documentsRequisIngenieur, prerequis: prerequisIngenieurInfo,
        frais_inscription: 13500.0, date_limite_candidature: dateLimite, capacite: 30,
        est_actif: true, langue: 'Anglais', date_debut: '2026-09-15',
        cree_le: maintenant, mis_a_jour_le: maintenant,
      },

      // ══════════════════════════════════════════════════════
      // Polytechnique Sousse / EPSousse (5)
      // ══════════════════════════════════════════════════════
      {
        id: PROG_POLY_PREP_ID, institut_id: POLY_INST_ID,
        titre: 'Cycle Préparatoire Intégré', domaine: 'informatique', niveau: 'cycle_preparatoire',
        mode: 'cours_du_jour', duree_annees: 2,
        description:
          "Cycle préparatoire intégré de 2 ans commun aux filières ingénieur d'EPSousse : " +
          "mathématiques avancées, physique, algorithmique, électronique et sciences de l'ingénieur. " +
          "L'orientation vers une spécialité ingénieur (Génie Civil, Télécommunications, Électrique, " +
          "Informatique Industrielle) s'effectue en fin de première année selon le classement et les vœux.",
        documents_requis: documentsRequisPreparatoire, prerequis: prerequisBacInfo,
        frais_inscription: 4200.0, date_limite_candidature: dateLimite, capacite: 90,
        est_actif: true, langue: 'Français', date_debut: '2026-09-15',
        cree_le: maintenant, mis_a_jour_le: maintenant,
      },
      {
        id: PROG_POLY_CIVIL_ID, institut_id: POLY_INST_ID,
        titre: 'Génie Civil', domaine: 'genie_civil', niveau: 'ingenieur',
        mode: 'cours_du_jour', duree_annees: 3,
        description:
          "Cycle ingénieur bac+5 en génie civil, accrédité CTI et ABET : ouvrages d'art, géotechnique, " +
          "BIM, hydraulique, matériaux et gestion de projets BTP. " +
          "Projets de fin d'études en partenariat avec les entreprises de construction du Centre tunisien. " +
          "Les diplômés affichent un taux d'employabilité de 89 % dans les 6 mois, dans les secteurs BTP et infrastructure.",
        documents_requis: documentsRequisIngenieur, prerequis: prerequisIngenieur,
        frais_inscription: 5500.0, date_limite_candidature: dateLimite, capacite: 60,
        est_actif: true, langue: 'Français', date_debut: '2026-09-15',
        cree_le: maintenant, mis_a_jour_le: maintenant,
      },
      {
        id: PROG_POLY_TELECOM_ID, institut_id: POLY_INST_ID,
        titre: 'Génie des Télécommunications et Réseaux', domaine: 'electrique', niveau: 'ingenieur',
        mode: 'cours_du_jour', duree_annees: 3,
        description:
          "Cycle ingénieur bac+5 en télécommunications et réseaux, accrédité CTI et dispensé en " +
          "français et en anglais : réseaux IP, 5G/LTE, SDN, cybersécurité des infrastructures et IoT industriels. " +
          "Collaborations avec Orange Tunisie et les opérateurs régionaux pour les stages et PFE. " +
          "Les diplômés s'insèrent dans les opérateurs télécoms, les intégrateurs systèmes et les grands groupes industriels.",
        documents_requis: documentsRequisIngenieur, prerequis: prerequisIngenieur,
        frais_inscription: 5800.0, date_limite_candidature: dateLimite, capacite: 60,
        est_actif: true, langue: 'Français/Anglais', date_debut: '2026-09-15',
        cree_le: maintenant, mis_a_jour_le: maintenant,
      },
      {
        id: PROG_POLY_ELEC_ID, institut_id: POLY_INST_ID,
        titre: 'Génie Électrique et Automatique', domaine: 'electrique', niveau: 'ingenieur',
        mode: 'cours_du_jour', duree_annees: 3,
        description:
          "Cycle ingénieur bac+5 en génie électrique et automatique, accrédité CTI et ABET : " +
          "électronique de puissance, automates programmables (PLC), robotique industrielle et énergies renouvelables. " +
          "Laboratoires spécialisés en automatisme et partenariats avec les industries du bassin Centre. " +
          "Les diplômés s'insèrent dans l'industrie manufacturière, l'énergie et l'automatisation avec un taux d'employabilité de 89 %.",
        documents_requis: documentsRequisIngenieur, prerequis: prerequisIngenieur,
        frais_inscription: 6400.0, date_limite_candidature: dateLimite, capacite: 60,
        est_actif: true, langue: 'Français', date_debut: '2026-09-15',
        cree_le: maintenant, mis_a_jour_le: maintenant,
      },
      {
        id: PROG_POLY_INFO_IND_ID, institut_id: POLY_INST_ID,
        titre: 'Génie Informatique Industrielle', domaine: 'informatique', niveau: 'ingenieur',
        mode: 'cours_du_jour', duree_annees: 3,
        description:
          "Cycle ingénieur bac+5 en informatique industrielle, accrédité CTI et ABET : " +
          "systèmes embarqués, automates programmables, supervision SCADA, intelligence artificielle appliquée et réseaux industriels. " +
          "Formation en partenariat avec les entreprises manufacturières du bassin Centre (Sousse, Monastir, Mahdia). " +
          "Les diplômés s'insèrent dans l'industrie manufacturière, l'énergie et l'automatisation avec 89 % d'employabilité.",
        documents_requis: documentsRequisIngenieur, prerequis: prerequisIngenieur,
        frais_inscription: 5800.0, date_limite_candidature: dateLimite, capacite: 60,
        est_actif: true, langue: 'Français', date_debut: '2026-09-15',
        cree_le: maintenant, mis_a_jour_le: maintenant,
      },

      // ══════════════════════════════════════════════════════
      // ULT (7)
      // ══════════════════════════════════════════════════════
      {
        id: PROG_ULT_PREP_ID, institut_id: ULT_INST_ID,
        titre: 'Cycle Préparatoire Intégré', domaine: 'mecanique', niveau: 'cycle_preparatoire',
        mode: 'cours_du_jour', duree_annees: 2,
        description:
          "Cycle préparatoire intégré de 2 ans commun aux filières ingénieur de l'ULT, accrédité EUR-ACE/ASIIN : " +
          "mathématiques, physique appliquée, algorithmique, électronique et sciences de l'ingénieur. " +
          "L'orientation vers une des six spécialités ingénieur (Civil, Électromécanique, Énergétique, " +
          "Informatique Industrielle, Biologique, Industries Alimentaires) s'effectue selon le classement.",
        documents_requis: documentsRequisPreparatoire, prerequis: prerequisBac,
        frais_inscription: 4800.0, date_limite_candidature: dateLimite, capacite: 100,
        est_actif: true, langue: 'Français', date_debut: '2026-09-15',
        cree_le: maintenant, mis_a_jour_le: maintenant,
      },
      {
        id: PROG_ULT_CIVIL_ID, institut_id: ULT_INST_ID,
        titre: 'Génie Civil', domaine: 'genie_civil', niveau: 'ingenieur',
        mode: 'cours_du_jour', duree_annees: 3,
        description:
          "Cycle ingénieur bac+5 en génie civil, accrédité EUR-ACE/ASIIN : structures en béton armé, " +
          "géotechnique, BIM (Building Information Modeling), hydraulique urbaine et gestion de chantier. " +
          "Partenariats avec des bureaux d'études et des entreprises de construction actives à Tunis et en région. " +
          "Les diplômés rejoignent les secteurs BTP, infrastructure et promotion immobilière avec un taux d'insertion de 85 %.",
        documents_requis: documentsRequisIngenieur, prerequis: prerequisIngenieur,
        frais_inscription: 7200.0, date_limite_candidature: dateLimite, capacite: 70,
        est_actif: true, langue: 'Français', date_debut: '2026-09-15',
        cree_le: maintenant, mis_a_jour_le: maintenant,
      },
      {
        id: PROG_ULT_ELECMEC_ID, institut_id: ULT_INST_ID,
        titre: 'Génie Électromécanique', domaine: 'mecanique', niveau: 'ingenieur',
        mode: 'cours_du_jour', duree_annees: 3,
        description:
          "Cycle ingénieur bac+5 en génie électromécanique, accrédité EUR-ACE/ASIIN : machines électriques, " +
          "électronique de puissance, automatisation industrielle, hydraulique et pneumatique. " +
          "Accessible après Cycle Préparatoire validé ou concours national, avec des projets industriels en entreprise. " +
          "Les diplômés s'insèrent dans l'industrie manufacturière, la maintenance industrielle et les sociétés de services énergétiques.",
        documents_requis: documentsRequisIngenieur, prerequis: prerequisIngenieur,
        frais_inscription: 7200.0, date_limite_candidature: dateLimite, capacite: 60,
        est_actif: true, langue: 'Français', date_debut: '2026-09-15',
        cree_le: maintenant, mis_a_jour_le: maintenant,
      },
      {
        id: PROG_ULT_ENERG_ID, institut_id: ULT_INST_ID,
        titre: 'Génie Énergétique', domaine: 'electrique', niveau: 'ingenieur',
        mode: 'cours_du_jour', duree_annees: 3,
        description:
          "Cycle ingénieur bac+5 en génie énergétique, accrédité EUR-ACE/ASIIN : thermodynamique appliquée, " +
          "énergies renouvelables (solaire, éolien), efficacité énergétique des bâtiments et audit énergétique. " +
          "Programme aligné avec les objectifs de la stratégie énergétique nationale PROSOL et les projets STEG. " +
          "Les diplômés accèdent aux postes d'ingénieur énergie dans les collectivités, les sociétés de services énergétiques et l'industrie.",
        documents_requis: documentsRequisIngenieur, prerequis: prerequisIngenieur,
        frais_inscription: 7500.0, date_limite_candidature: dateLimite, capacite: 50,
        est_actif: true, langue: 'Français', date_debut: '2026-09-15',
        cree_le: maintenant, mis_a_jour_le: maintenant,
      },
      {
        id: PROG_ULT_ELECINFO_ID, institut_id: ULT_INST_ID,
        titre: 'Génie Électrique et Informatique Industrielle', domaine: 'electrique', niveau: 'ingenieur',
        mode: 'cours_du_jour', duree_annees: 3,
        description:
          "Cycle ingénieur bac+5 à double compétence électrique et informatique, accrédité EUR-ACE/ASIIN : " +
          "systèmes de contrôle-commande, automates PLC, SCADA, réseaux industriels et maintenance prédictive. " +
          "Formation appréciée des entreprises industrielles cherchant des profils capables d'intégrer " +
          "les systèmes électriques et informatiques dans les environnements de production. Taux d'insertion de 85 %.",
        documents_requis: documentsRequisIngenieur, prerequis: prerequisIngenieur,
        frais_inscription: 7500.0, date_limite_candidature: dateLimite, capacite: 50,
        est_actif: true, langue: 'Français', date_debut: '2026-09-15',
        cree_le: maintenant, mis_a_jour_le: maintenant,
      },
      {
        id: PROG_ULT_BIO_ID, institut_id: ULT_INST_ID,
        titre: 'Génie Biologique', domaine: 'agronomie', niveau: 'ingenieur',
        mode: 'cours_du_jour', duree_annees: 3,
        description:
          "Cycle ingénieur bac+5 en génie biologique, accrédité EUR-ACE/ASIIN : biotechnologies, " +
          "microbiologie industrielle, génie des procédés biologiques et contrôle qualité en agroalimentaire. " +
          "Partenariats avec des laboratoires pharmaceutiques et des industries agroalimentaires tunisiennes " +
          "pour les stages et projets de recherche appliquée. " +
          "Les diplômés s'insèrent dans les secteurs de la santé, de l'agroalimentaire et de la recherche.",
        documents_requis: documentsRequisIngenieur, prerequis: prerequisIngenieur,
        frais_inscription: 7200.0, date_limite_candidature: dateLimite, capacite: 40,
        est_actif: true, langue: 'Français', date_debut: '2026-09-15',
        cree_le: maintenant, mis_a_jour_le: maintenant,
      },
      {
        id: PROG_ULT_ALIM_ID, institut_id: ULT_INST_ID,
        titre: 'Industries Alimentaires', domaine: 'agronomie', niveau: 'ingenieur',
        mode: 'cours_du_jour', duree_annees: 3,
        description:
          "Cycle ingénieur bac+5 en industries alimentaires, accrédité EUR-ACE/ASIIN : " +
          "technologie des aliments, hygiène et sécurité alimentaire (HACCP), procédés de transformation " +
          "et management de la qualité en industrie agroalimentaire. " +
          "Formation en partenariat avec des groupes agroalimentaires tunisiens (huile d'olive, conserves, laiteries). " +
          "Les diplômés rejoignent les industries de transformation, les organismes de certification et la grande distribution.",
        documents_requis: documentsRequisIngenieur, prerequis: prerequisIngenieur,
        frais_inscription: 7000.0, date_limite_candidature: dateLimite, capacite: 40,
        est_actif: true, langue: 'Français', date_debut: '2026-09-15',
        cree_le: maintenant, mis_a_jour_le: maintenant,
      },

      // ══════════════════════════════════════════════════════
      // TEK-UP (1)
      // ══════════════════════════════════════════════════════
      {
        id: PROG_TEKUP_CSE_ID, institut_id: TEKUP_INST_ID,
        titre: 'Computer Science Engineering', domaine: 'informatique', niveau: 'ingenieur',
        mode: 'cours_du_jour', duree_annees: 5,
        description:
          "Cycle ingénieur bac+5 en génie informatique, dispensé en anglais et accrédité EUR-ACE/QUACING " +
          "selon le référentiel franco-allemand : développement logiciel avancé, sécurité des systèmes, " +
          "intelligence artificielle, cloud computing et entrepreneuriat numérique. " +
          "Accès direct après baccalauréat scientifique (cycle intégré 5 ans) avec un fort accent sur " +
          "l'autonomie, l'innovation et l'insertion dans l'écosystème Tech tunisien et européen.",
        documents_requis: documentsRequisPreparatoire, prerequis: prerequisBacInfo,
        frais_inscription: 12500.0, date_limite_candidature: dateLimite, capacite: 50,
        est_actif: true, langue: 'Anglais', date_debut: '2026-09-15',
        cree_le: maintenant, mis_a_jour_le: maintenant,
      },

      // ══════════════════════════════════════════════════════
      // Polytechnique INTL (4)
      // ══════════════════════════════════════════════════════
      {
        id: PROG_POLYINTL_PREP_ID, institut_id: POLYINTL_INST_ID,
        titre: 'Cycle Préparatoire Intégré', domaine: 'mecanique', niveau: 'cycle_preparatoire',
        mode: 'cours_du_jour', duree_annees: 2,
        description:
          "Cycle préparatoire intégré de 2 ans commun aux filières ingénieur de Polytechnique INTL, " +
          "accrédité EUR-ACE/CTI : mathématiques, physique, algorithmique, électronique et mécanique générale. " +
          "L'orientation vers l'une des trois spécialités (Informatique-Réseaux, Mécatronique, Génie Industriel) " +
          "intervient en fin de première année selon les résultats académiques et les vœux de l'étudiant.",
        documents_requis: documentsRequisPreparatoire, prerequis: prerequisBac,
        frais_inscription: 4500.0, date_limite_candidature: dateLimite, capacite: 80,
        est_actif: true, langue: 'Français', date_debut: '2026-09-15',
        cree_le: maintenant, mis_a_jour_le: maintenant,
      },
      {
        id: PROG_POLYINTL_IRM_ID, institut_id: POLYINTL_INST_ID,
        titre: 'Informatique, Réseaux et Multimédia', domaine: 'informatique', niveau: 'ingenieur',
        mode: 'cours_du_jour', duree_annees: 3,
        description:
          "Cycle ingénieur bac+5 en informatique, réseaux et multimédia, accrédité EUR-ACE/CTI et dispensé " +
          "en français et en anglais : développement web et mobile, cybersécurité, réseaux IP, cloud, " +
          "traitement multimédia et intelligence artificielle appliquée. " +
          "Partenariats avec des entreprises IT des Berges du Lac pour les stages et projets de fin d'études. " +
          "Les diplômés s'insèrent dans le développement logiciel, l'intégration systèmes et la sécurité informatique.",
        documents_requis: documentsRequisIngenieur, prerequis: prerequisIngenieurInfo,
        frais_inscription: 9500.0, date_limite_candidature: dateLimite, capacite: 60,
        est_actif: true, langue: 'Français/Anglais', date_debut: '2026-09-15',
        cree_le: maintenant, mis_a_jour_le: maintenant,
      },
      {
        id: PROG_POLYINTL_MECA_ID, institut_id: POLYINTL_INST_ID,
        titre: 'Génie Mécatronique', domaine: 'mecanique', niveau: 'ingenieur',
        mode: 'cours_du_jour', duree_annees: 3,
        description:
          "Cycle ingénieur bac+5 en mécatronique, accrédité EUR-ACE/CTI : conception de systèmes " +
          "mécatroniques, robotique, commande embarquée, impression 3D industrielle et véhicules autonomes. " +
          "Dispensé en français et en anglais, avec des laboratoires de prototypage rapide. " +
          "Les diplômés s'insèrent dans les industries automobile, aérospatiale et la robotique industrielle, en Tunisie et à l'international.",
        documents_requis: documentsRequisIngenieur, prerequis: prerequisIngenieurInfo,
        frais_inscription: 9500.0, date_limite_candidature: dateLimite, capacite: 50,
        est_actif: true, langue: 'Français/Anglais', date_debut: '2026-09-15',
        cree_le: maintenant, mis_a_jour_le: maintenant,
      },
      {
        id: PROG_POLYINTL_IND_ID, institut_id: POLYINTL_INST_ID,
        titre: 'Génie Industriel', domaine: 'mecanique', niveau: 'ingenieur',
        mode: 'cours_du_jour', duree_annees: 3,
        description:
          "Cycle ingénieur bac+5 en génie industriel, accrédité EUR-ACE/CTI : organisation industrielle, " +
          "lean manufacturing, gestion de la chaîne logistique, qualité et amélioration continue. " +
          "Formation orientée vers les problématiques des entreprises manufacturières tunisiennes et multinationales. " +
          "Les diplômés accèdent aux fonctions d'ingénieur méthodes, responsable de production ou consultant industrie 4.0.",
        documents_requis: documentsRequisIngenieur, prerequis: prerequisIngenieur,
        frais_inscription: 9000.0, date_limite_candidature: dateLimite, capacite: 60,
        est_actif: true, langue: 'Français', date_debut: '2026-09-15',
        cree_le: maintenant, mis_a_jour_le: maintenant,
      },

      // ══════════════════════════════════════════════════════
      // EPI Polytechnique Sousse (6)
      // ══════════════════════════════════════════════════════
      {
        id: PROG_EPI_PREP_ID, institut_id: EPI_INST_ID,
        titre: 'Cycle Préparatoire Intégré', domaine: 'mecanique', niveau: 'cycle_preparatoire',
        mode: 'cours_du_jour', duree_annees: 2,
        description:
          "Cycle préparatoire intégré de 2 ans commun aux filières ingénieur de l'EPI Sousse, " +
          "accrédité EUR-ACE/ASIIN : mathématiques, physique, algorithmique, électronique et mécanique. " +
          "L'orientation vers l'une des cinq spécialités (Électromécanique, Électrique, Industriel, Civil, Informatique) " +
          "intervient en fin de première année selon classement et vœux.",
        documents_requis: documentsRequisPreparatoire, prerequis: prerequisBac,
        frais_inscription: 4500.0, date_limite_candidature: dateLimite, capacite: 90,
        est_actif: true, langue: 'Français', date_debut: '2026-09-15',
        cree_le: maintenant, mis_a_jour_le: maintenant,
      },
      {
        id: PROG_EPI_ELECMEC_ID, institut_id: EPI_INST_ID,
        titre: 'Génie Électromécanique', domaine: 'mecanique', niveau: 'ingenieur',
        mode: 'cours_du_jour', duree_annees: 3,
        description:
          "Cycle ingénieur bac+5 en génie électromécanique, accrédité EUR-ACE/ASIIN : machines tournantes, " +
          "électronique de puissance, automatisation et maintenance industrielle. " +
          "Partenariats avec les industries de Sousse, Monastir et Sfax pour les stages et projets de fin d'études. " +
          "Les diplômés s'insèrent dans l'industrie manufacturière, la maintenance et les services énergétiques de la région Centre.",
        documents_requis: documentsRequisIngenieur, prerequis: prerequisIngenieur,
        frais_inscription: 5800.0, date_limite_candidature: dateLimite, capacite: 60,
        est_actif: true, langue: 'Français', date_debut: '2026-09-15',
        cree_le: maintenant, mis_a_jour_le: maintenant,
      },
      {
        id: PROG_EPI_ELEC_ID, institut_id: EPI_INST_ID,
        titre: 'Génie Électrique', domaine: 'electrique', niveau: 'ingenieur',
        mode: 'cours_du_jour', duree_annees: 3,
        description:
          "Cycle ingénieur bac+5 en génie électrique, accrédité EUR-ACE/ASIIN : électronique de puissance, " +
          "systèmes de contrôle-commande, réseaux électriques et intégration des énergies renouvelables. " +
          "Formation dispensée en collaboration avec les entreprises du tissu industriel du bassin Sousse-Monastir. " +
          "Les diplômés accèdent aux secteurs de l'énergie, de l'automatisation et des industries offshore.",
        documents_requis: documentsRequisIngenieur, prerequis: prerequisIngenieur,
        frais_inscription: 5800.0, date_limite_candidature: dateLimite, capacite: 60,
        est_actif: true, langue: 'Français', date_debut: '2026-09-15',
        cree_le: maintenant, mis_a_jour_le: maintenant,
      },
      {
        id: PROG_EPI_IND_ID, institut_id: EPI_INST_ID,
        titre: 'Génie Industriel', domaine: 'mecanique', niveau: 'ingenieur',
        mode: 'cours_du_jour', duree_annees: 3,
        description:
          "Cycle ingénieur bac+5 en génie industriel, accrédité EUR-ACE/ASIIN : lean manufacturing, " +
          "gestion de production, logistique, qualité totale et systèmes d'information industriels. " +
          "Axé sur les besoins des industries du bassin Centre tunisien avec des projets d'amélioration continue en entreprise. " +
          "Les diplômés accèdent aux fonctions d'ingénieur méthodes, responsable qualité ou chef de production.",
        documents_requis: documentsRequisIngenieur, prerequis: prerequisIngenieur,
        frais_inscription: 5500.0, date_limite_candidature: dateLimite, capacite: 60,
        est_actif: true, langue: 'Français', date_debut: '2026-09-15',
        cree_le: maintenant, mis_a_jour_le: maintenant,
      },
      {
        id: PROG_EPI_CIVIL_ID, institut_id: EPI_INST_ID,
        titre: 'Génie Civil', domaine: 'genie_civil', niveau: 'ingenieur',
        mode: 'cours_du_jour', duree_annees: 3,
        description:
          "Cycle ingénieur bac+5 en génie civil, accrédité EUR-ACE/ASIIN : structures, géotechnique, " +
          "BIM, routes et ouvrages d'art, gestion de projets BTP. " +
          "Formation renforcée par des visites de chantiers et des stages dans les entreprises de construction de la région Centre. " +
          "Les diplômés s'insèrent dans les bureaux d'études, les entreprises de construction et la maîtrise d'œuvre.",
        documents_requis: documentsRequisIngenieur, prerequis: prerequisIngenieur,
        frais_inscription: 5500.0, date_limite_candidature: dateLimite, capacite: 60,
        est_actif: true, langue: 'Français', date_debut: '2026-09-15',
        cree_le: maintenant, mis_a_jour_le: maintenant,
      },
      {
        id: PROG_EPI_INFO_ID, institut_id: EPI_INST_ID,
        titre: 'Génie Informatique', domaine: 'informatique', niveau: 'ingenieur',
        mode: 'cours_du_jour', duree_annees: 3,
        description:
          "Cycle ingénieur bac+5 en génie informatique, accrédité EUR-ACE/ASIIN : développement logiciel, " +
          "réseaux, cybersécurité, intelligence artificielle et systèmes d'information d'entreprise. " +
          "Partenariats avec les sociétés IT de Sousse et de la région pour les stages et les projets de fin d'études. " +
          "Les diplômés accèdent aux postes de développeur, architecte logiciel ou chef de projet IT dans les entreprises tunisiennes et internationales.",
        documents_requis: documentsRequisIngenieur, prerequis: prerequisIngenieur,
        frais_inscription: 6000.0, date_limite_candidature: dateLimite, capacite: 80,
        est_actif: true, langue: 'Français', date_debut: '2026-09-15',
        cree_le: maintenant, mis_a_jour_le: maintenant,
      },

      // ══════════════════════════════════════════════════════
      // ESAT (2)
      // ══════════════════════════════════════════════════════
      {
        id: PROG_ESAT_AERO_ID, institut_id: ESAT_INST_ID,
        titre: 'Génie Aéronautique', domaine: 'mecanique', niveau: 'ingenieur',
        mode: 'cours_du_jour', duree_annees: 3,
        description:
          "Cycle ingénieur bac+5 en génie aéronautique, accrédité EUR-ACE/ASIIN, unique dans le secteur " +
          "privé tunisien : aérodynamique, structures aéronefs, avionique, maintenance MRO et certification " +
          "aéronautique (EASA, ICAO). Dispensé en français et en anglais, avec des partenariats avec " +
          "Tunisair Technics, des compagnies de la région MENA et des organismes de formation agréés DGAC. " +
          "Les diplômés accèdent aux métiers de la maintenance aéronautique, de l'ingénierie de navigabilité et de l'aviation civile.",
        documents_requis: documentsRequisIngenieur, prerequis: prerequisIngenieurInfo,
        frais_inscription: 14000.0, date_limite_candidature: dateLimite, capacite: 40,
        est_actif: true, langue: 'Français/Anglais', date_debut: '2026-09-15',
        cree_le: maintenant, mis_a_jour_le: maintenant,
      },
      {
        id: PROG_ESAT_GEO_ID, institut_id: ESAT_INST_ID,
        titre: 'Géomatique', domaine: 'informatique', niveau: 'ingenieur',
        mode: 'cours_du_jour', duree_annees: 3,
        description:
          "Cycle ingénieur bac+5 en géomatique, accrédité EUR-ACE/ASIIN : systèmes d'information " +
          "géographique (SIG), télédétection par satellite, photogrammétrie par drone, cartographie " +
          "numérique et bases de données spatiales. " +
          "Formation s'appuyant sur des logiciels SIG professionnels (QGIS, ArcGIS) et des plateformes " +
          "d'observation satellitaire. Les diplômés s'insèrent dans les domaines de l'urbanisme, du cadastre, " +
          "de l'environnement et de la gestion des ressources naturelles.",
        documents_requis: documentsRequisIngenieur, prerequis: prerequisIngenieur,
        frais_inscription: 11000.0, date_limite_candidature: dateLimite, capacite: 35,
        est_actif: true, langue: 'Français', date_debut: '2026-09-15',
        cree_le: maintenant, mis_a_jour_le: maintenant,
      },

      // ══════════════════════════════════════════════════════
      // ESIET-UAS (7)
      // ══════════════════════════════════════════════════════
      {
        id: PROG_ESIET_PREP_ID, institut_id: ESIET_INST_ID,
        titre: 'Cycle Préparatoire Intégré', domaine: 'mecanique', niveau: 'cycle_preparatoire',
        mode: 'cours_du_jour', duree_annees: 2,
        description:
          "Cycle préparatoire intégré de 2 ans commun aux filières ingénieur de l'ESIET-UAS, " +
          "accrédité EUR-ACE/CTI : mathématiques, physique, algorithmique, électronique et mécanique générale. " +
          "L'orientation vers l'une des six spécialités ingénieur intervient en fin de première année " +
          "selon le classement académique et les vœux de l'étudiant.",
        documents_requis: documentsRequisPreparatoire, prerequis: prerequisBac,
        frais_inscription: 4200.0, date_limite_candidature: dateLimite, capacite: 100,
        est_actif: true, langue: 'Français', date_debut: '2026-09-15',
        cree_le: maintenant, mis_a_jour_le: maintenant,
      },
      {
        id: PROG_ESIET_IND_ID, institut_id: ESIET_INST_ID,
        titre: 'Génie Industriel', domaine: 'mecanique', niveau: 'ingenieur',
        mode: 'cours_du_jour', duree_annees: 3,
        description:
          "Cycle ingénieur bac+5 en génie industriel, accrédité EUR-ACE/CTI : organisation et gestion " +
          "de production, lean manufacturing, logistique, qualité et systèmes d'information industriels. " +
          "Partenariats avec les entreprises industrielles implantées à Tunis et en région pour les stages. " +
          "Les diplômés accèdent aux fonctions de responsable production, ingénieur méthodes ou chef de projet industriel.",
        documents_requis: documentsRequisIngenieur, prerequis: prerequisIngenieur,
        frais_inscription: 6000.0, date_limite_candidature: dateLimite, capacite: 70,
        est_actif: true, langue: 'Français', date_debut: '2026-09-15',
        cree_le: maintenant, mis_a_jour_le: maintenant,
      },
      {
        id: PROG_ESIET_CIVIL_ID, institut_id: ESIET_INST_ID,
        titre: 'Génie Civil', domaine: 'genie_civil', niveau: 'ingenieur',
        mode: 'cours_du_jour', duree_annees: 3,
        description:
          "Cycle ingénieur bac+5 en génie civil, accrédité EUR-ACE/CTI : structures, géotechnique, " +
          "hydraulique, routes et ouvrages d'art, BIM et gestion de projets BTP. " +
          "Formation en collaboration avec des bureaux d'études et des entreprises de BTP tunisiennes. " +
          "Les diplômés s'insèrent dans les secteurs BTP, infrastructure publique et promotion immobilière.",
        documents_requis: documentsRequisIngenieur, prerequis: prerequisIngenieur,
        frais_inscription: 6000.0, date_limite_candidature: dateLimite, capacite: 60,
        est_actif: true, langue: 'Français', date_debut: '2026-09-15',
        cree_le: maintenant, mis_a_jour_le: maintenant,
      },
      {
        id: PROG_ESIET_ELEC_ID, institut_id: ESIET_INST_ID,
        titre: 'Génie Électrique', domaine: 'electrique', niveau: 'ingenieur',
        mode: 'cours_du_jour', duree_annees: 3,
        description:
          "Cycle ingénieur bac+5 en génie électrique, accrédité EUR-ACE/CTI : électronique de puissance, " +
          "machines électriques, réseaux électriques intelligents et intégration des énergies renouvelables. " +
          "Partenariats avec STEG et des entreprises du secteur énergétique pour les projets de fin d'études. " +
          "Les diplômés rejoignent les sociétés de distribution d'énergie, les industries électriques et les bureaux d'études.",
        documents_requis: documentsRequisIngenieur, prerequis: prerequisIngenieur,
        frais_inscription: 6200.0, date_limite_candidature: dateLimite, capacite: 60,
        est_actif: true, langue: 'Français', date_debut: '2026-09-15',
        cree_le: maintenant, mis_a_jour_le: maintenant,
      },
      {
        id: PROG_ESIET_ELECMEC_ID, institut_id: ESIET_INST_ID,
        titre: 'Génie Électromécanique', domaine: 'mecanique', niveau: 'ingenieur',
        mode: 'cours_du_jour', duree_annees: 3,
        description:
          "Cycle ingénieur bac+5 en génie électromécanique, accrédité EUR-ACE/CTI : machines tournantes, " +
          "convertisseurs électroniques, systèmes d'automatisation et maintenance industrielle. " +
          "Accessible après cycle préparatoire validé ou concours national, avec des travaux pratiques " +
          "intensifs sur des équipements industriels réels. " +
          "Les diplômés s'insèrent dans l'industrie manufacturière, la maintenance et la production d'énergie.",
        documents_requis: documentsRequisIngenieur, prerequis: prerequisIngenieur,
        frais_inscription: 6200.0, date_limite_candidature: dateLimite, capacite: 60,
        est_actif: true, langue: 'Français', date_debut: '2026-09-15',
        cree_le: maintenant, mis_a_jour_le: maintenant,
      },
      {
        id: PROG_ESIET_MECA_ID, institut_id: ESIET_INST_ID,
        titre: 'Génie Mécatronique', domaine: 'mecanique', niveau: 'ingenieur',
        mode: 'cours_du_jour', duree_annees: 3,
        description:
          "Cycle ingénieur bac+5 en mécatronique, accrédité EUR-ACE/CTI et dispensé en français et anglais : " +
          "systèmes mécatroniques, robotique, informatique embarquée, impression 3D et véhicules intelligents. " +
          "Laboratoires équipés de bras robotiques et de plateformes embarquées pour des projets industriels ambitieux. " +
          "Les diplômés accèdent aux secteurs automobile, robotique industrielle et systèmes intelligents.",
        documents_requis: documentsRequisIngenieur, prerequis: prerequisIngenieurInfo,
        frais_inscription: 6500.0, date_limite_candidature: dateLimite, capacite: 40,
        est_actif: true, langue: 'Français/Anglais', date_debut: '2026-09-15',
        cree_le: maintenant, mis_a_jour_le: maintenant,
      },
      {
        id: PROG_ESIET_INFO_ID, institut_id: ESIET_INST_ID,
        titre: 'Génie Informatique', domaine: 'informatique', niveau: 'ingenieur',
        mode: 'cours_du_jour', duree_annees: 3,
        description:
          "Cycle ingénieur bac+5 en génie informatique, accrédité EUR-ACE/CTI : développement logiciel, " +
          "réseaux, sécurité informatique, intelligence artificielle et ingénierie des données. " +
          "Projets de fin d'études en partenariat avec des entreprises IT tunisiennes et des start-ups numériques. " +
          "Les diplômés s'insèrent dans le développement, l'intégration, le conseil IT et les entreprises du numérique à Tunis.",
        documents_requis: documentsRequisIngenieur, prerequis: prerequisIngenieur,
        frais_inscription: 6500.0, date_limite_candidature: dateLimite, capacite: 80,
        est_actif: true, langue: 'Français', date_debut: '2026-09-15',
        cree_le: maintenant, mis_a_jour_le: maintenant,
      },

      // ══════════════════════════════════════════════════════
      // IPSAS (6)
      // ══════════════════════════════════════════════════════
      {
        id: PROG_IPSAS_PREP_ID, institut_id: IPSAS_INST_ID,
        titre: 'Cycle Préparatoire Intégré', domaine: 'mecanique', niveau: 'cycle_preparatoire',
        mode: 'cours_du_jour', duree_annees: 2,
        description:
          "Cycle préparatoire intégré de 2 ans commun aux cinq filières ingénieur de l'IPSAS, " +
          "accrédité EUR-ACE/CTI : mathématiques, physique, algorithmique, chimie industrielle et mécanique. " +
          "L'orientation vers la spécialité ingénieur (Civil, Électromécanique, Informatique, Pétrolier ou Industriel) " +
          "s'effectue en fin de première année selon le classement et les vœux.",
        documents_requis: documentsRequisPreparatoire, prerequis: prerequisBac,
        frais_inscription: 3800.0, date_limite_candidature: dateLimite, capacite: 90,
        est_actif: true, langue: 'Français', date_debut: '2026-09-15',
        cree_le: maintenant, mis_a_jour_le: maintenant,
      },
      {
        id: PROG_IPSAS_CIVIL_ID, institut_id: IPSAS_INST_ID,
        titre: 'Génie Civil', domaine: 'genie_civil', niveau: 'ingenieur',
        mode: 'cours_du_jour', duree_annees: 3,
        description:
          "Cycle ingénieur bac+5 en génie civil, accrédité EUR-ACE/CTI : structures, géotechnique, " +
          "hydraulique, routes, BIM et gestion de projets BTP, adapté aux besoins du marché sfaxien et régional. " +
          "Partenariats avec des bureaux d'études et des entreprises de construction du Sud-Est tunisien. " +
          "Les diplômés s'insèrent dans les secteurs BTP, infrastructure et aménagement urbain de la région.",
        documents_requis: documentsRequisIngenieur, prerequis: prerequisIngenieur,
        frais_inscription: 6500.0, date_limite_candidature: dateLimite, capacite: 70,
        est_actif: true, langue: 'Français', date_debut: '2026-09-15',
        cree_le: maintenant, mis_a_jour_le: maintenant,
      },
      {
        id: PROG_IPSAS_ELECMEC_ID, institut_id: IPSAS_INST_ID,
        titre: 'Génie Électromécanique', domaine: 'mecanique', niveau: 'ingenieur',
        mode: 'cours_du_jour', duree_annees: 3,
        description:
          "Cycle ingénieur bac+5 en génie électromécanique, accrédité EUR-ACE/CTI : machines électriques, " +
          "automatisation, convertisseurs et maintenance des installations industrielles de la région sfaxienne. " +
          "Formation en collaboration avec les industries mécaniques et électriques actives dans le bassin Sud-Est. " +
          "Les diplômés s'insèrent dans l'industrie manufacturière, la maintenance et les services énergétiques.",
        documents_requis: documentsRequisIngenieur, prerequis: prerequisIngenieur,
        frais_inscription: 6800.0, date_limite_candidature: dateLimite, capacite: 60,
        est_actif: true, langue: 'Français', date_debut: '2026-09-15',
        cree_le: maintenant, mis_a_jour_le: maintenant,
      },
      {
        id: PROG_IPSAS_INFO_ID, institut_id: IPSAS_INST_ID,
        titre: 'Génie Informatique', domaine: 'informatique', niveau: 'ingenieur',
        mode: 'cours_du_jour', duree_annees: 3,
        description:
          "Cycle ingénieur bac+5 en génie informatique, accrédité EUR-ACE/CTI : développement logiciel, " +
          "réseaux, sécurité, intelligence artificielle et systèmes d'information d'entreprise. " +
          "Formation répondant aux besoins numériques des entreprises sfaxiennes et des PME du Centre-Sud. " +
          "Les diplômés accèdent aux postes de développeur, chef de projet IT et consultant systèmes en Tunisie et à l'export.",
        documents_requis: documentsRequisIngenieur, prerequis: prerequisIngenieur,
        frais_inscription: 7000.0, date_limite_candidature: dateLimite, capacite: 80,
        est_actif: true, langue: 'Français', date_debut: '2026-09-15',
        cree_le: maintenant, mis_a_jour_le: maintenant,
      },
      {
        id: PROG_IPSAS_PETRO_ID, institut_id: IPSAS_INST_ID,
        titre: 'Génie Pétrolier', domaine: 'chimie', niveau: 'ingenieur',
        mode: 'cours_du_jour', duree_annees: 3,
        description:
          "Cycle ingénieur bac+5 en génie pétrolier, accrédité EUR-ACE/CTI, unique dans le secteur " +
          "privé tunisien : forage et complétion de puits, ingénierie de réservoir, production pétrolière, " +
          "pétrochimie et HSE (Hygiène, Sécurité, Environnement). " +
          "Dispensé en français et en anglais, avec des partenariats avec des compagnies pétrolières opérant en Tunisie et en Afrique du Nord. " +
          "Les diplômés s'insèrent dans les secteurs pétrolier, gazier et pétrochimique régional et international.",
        documents_requis: documentsRequisIngenieur, prerequis: prerequisIngenieurInfo,
        frais_inscription: 9500.0, date_limite_candidature: dateLimite, capacite: 30,
        est_actif: true, langue: 'Français/Anglais', date_debut: '2026-09-15',
        cree_le: maintenant, mis_a_jour_le: maintenant,
      },
      {
        id: PROG_IPSAS_IND_ID, institut_id: IPSAS_INST_ID,
        titre: 'Génie Industriel', domaine: 'mecanique', niveau: 'ingenieur',
        mode: 'cours_du_jour', duree_annees: 3,
        description:
          "Cycle ingénieur bac+5 en génie industriel, accrédité EUR-ACE/CTI : organisation industrielle, " +
          "lean manufacturing, gestion de la qualité, logistique et systèmes d'information industriels. " +
          "Formation ancrée dans les réalités industrielles du bassin sfaxien (industrie chimique, mécanique, textile). " +
          "Les diplômés accèdent aux fonctions d'ingénieur méthodes, responsable production ou consultant industrie 4.0.",
        documents_requis: documentsRequisIngenieur, prerequis: prerequisIngenieur,
        frais_inscription: 6500.0, date_limite_candidature: dateLimite, capacite: 60,
        est_actif: true, langue: 'Français', date_debut: '2026-09-15',
        cree_le: maintenant, mis_a_jour_le: maintenant,
      },

      // ══════════════════════════════════════════════════════
      // IIT (5)
      // ══════════════════════════════════════════════════════
      {
        id: PROG_IIT_PREP_ID, institut_id: IIT_INST_ID,
        titre: 'Cycle Préparatoire Intégré', domaine: 'mecanique', niveau: 'cycle_preparatoire',
        mode: 'cours_du_jour', duree_annees: 2,
        description:
          "Cycle préparatoire intégré de 2 ans inspiré du modèle nord-américain, accrédité EUR-ACE/ASIIN : " +
          "mathématiques, physique, algorithmique, chimie et sciences de l'ingénieur. " +
          "L'approche pédagogique met l'accent sur les travaux pratiques et les projets dès la première année. " +
          "L'orientation vers les quatre spécialités ingénieur (Informatique, Industriel, Procédés, Mécanique) intervient selon le classement.",
        documents_requis: documentsRequisPreparatoire, prerequis: prerequisBac,
        frais_inscription: 3800.0, date_limite_candidature: dateLimite, capacite: 80,
        est_actif: true, langue: 'Français/Anglais', date_debut: '2026-09-15',
        cree_le: maintenant, mis_a_jour_le: maintenant,
      },
      {
        id: PROG_IIT_INFO_ID, institut_id: IIT_INST_ID,
        titre: 'Génie Informatique', domaine: 'informatique', niveau: 'ingenieur',
        mode: 'cours_du_jour', duree_annees: 3,
        description:
          "Cycle ingénieur bac+5 en génie informatique, accrédité EUR-ACE/ASIIN et dispensé en français et anglais : " +
          "développement logiciel, réseaux, intelligence artificielle, cybersécurité et cloud computing. " +
          "Partenariats avec des entreprises IT sfaxiennes et des multinationales pour les stages et PFE. " +
          "Les diplômés s'insèrent dans les secteurs du numérique, des services informatiques et des startups tunisiennes et à l'export.",
        documents_requis: documentsRequisIngenieur, prerequis: prerequisIngenieur,
        frais_inscription: 7000.0, date_limite_candidature: dateLimite, capacite: 70,
        est_actif: true, langue: 'Français/Anglais', date_debut: '2026-09-15',
        cree_le: maintenant, mis_a_jour_le: maintenant,
      },
      {
        id: PROG_IIT_IND_ID, institut_id: IIT_INST_ID,
        titre: 'Génie Industriel', domaine: 'mecanique', niveau: 'ingenieur',
        mode: 'cours_du_jour', duree_annees: 3,
        description:
          "Cycle ingénieur bac+5 en génie industriel, accrédité EUR-ACE/ASIIN : " +
          "organisation de la production, lean, qualité, logistique et amélioration continue. " +
          "Formation répondant aux besoins des industries sfaxiennes (mécanique, textile, chimique). " +
          "Les diplômés accèdent aux fonctions d'ingénieur méthodes, responsable production ou consultant industriel.",
        documents_requis: documentsRequisIngenieur, prerequis: prerequisIngenieur,
        frais_inscription: 6500.0, date_limite_candidature: dateLimite, capacite: 60,
        est_actif: true, langue: 'Français', date_debut: '2026-09-15',
        cree_le: maintenant, mis_a_jour_le: maintenant,
      },
      {
        id: PROG_IIT_PROC_ID, institut_id: IIT_INST_ID,
        titre: 'Génie des Procédés', domaine: 'chimie', niveau: 'ingenieur',
        mode: 'cours_du_jour', duree_annees: 3,
        description:
          "Cycle ingénieur bac+5 en génie des procédés, accrédité EUR-ACE/ASIIN : " +
          "procédés chimiques et biochimiques, génie de la réaction, thermodynamique appliquée, " +
          "traitement de l'eau et gestion environnementale. " +
          "Partenariats avec les industries chimiques et pharmaceutiques de Sfax pour les stages. " +
          "Les diplômés s'insèrent dans les industries chimiques, pétrolières, pharmaceutiques et agro-industrielles.",
        documents_requis: documentsRequisIngenieur, prerequis: prerequisIngenieur,
        frais_inscription: 6800.0, date_limite_candidature: dateLimite, capacite: 40,
        est_actif: true, langue: 'Français', date_debut: '2026-09-15',
        cree_le: maintenant, mis_a_jour_le: maintenant,
      },
      {
        id: PROG_IIT_MECA_ID, institut_id: IIT_INST_ID,
        titre: 'Génie Mécanique', domaine: 'mecanique', niveau: 'ingenieur',
        mode: 'cours_du_jour', duree_annees: 3,
        description:
          "Cycle ingénieur bac+5 en génie mécanique, accrédité EUR-ACE/ASIIN : " +
          "conception mécanique (CAO/DAO), mécanique des fluides, résistance des matériaux, " +
          "fabrication assistée par ordinateur et maintenance des équipements industriels. " +
          "Formation appliquée, centrée sur les besoins de l'industrie mécanique et du BTP sfaxiens. " +
          "Les diplômés rejoignent les secteurs de la fabrication, du BTP et de la maintenance industrielle.",
        documents_requis: documentsRequisIngenieur, prerequis: prerequisIngenieur,
        frais_inscription: 6500.0, date_limite_candidature: dateLimite, capacite: 60,
        est_actif: true, langue: 'Français', date_debut: '2026-09-15',
        cree_le: maintenant, mis_a_jour_le: maintenant,
      },

      // ══════════════════════════════════════════════════════
      // Iteam University (1)
      // ══════════════════════════════════════════════════════
      {
        id: PROG_ITEAM_INFO_ID, institut_id: ITEAM_INST_ID,
        titre: 'Génie Informatique', domaine: 'informatique', niveau: 'ingenieur',
        mode: 'cours_du_jour', duree_annees: 5,
        description:
          "Cycle ingénieur bac+5 intégré en génie informatique, accrédité EUR-ACE/QUACING : " +
          "développement logiciel avancé, architecture des systèmes d'information, intelligence artificielle, " +
          "cybersécurité et double compétence en administration des affaires. " +
          "Dispensé en français et en anglais, avec des projets en collaboration avec des entreprises IT et des incubateurs tunisiens. " +
          "Les diplômés accèdent aux postes d'ingénieur-chef de projet, architecte logiciel ou entrepreneur numérique.",
        documents_requis: documentsRequisPreparatoire, prerequis: prerequisBacInfo,
        frais_inscription: 8500.0, date_limite_candidature: dateLimite, capacite: 80,
        est_actif: true, langue: 'Français/Anglais', date_debut: '2026-09-15',
        cree_le: maintenant, mis_a_jour_le: maintenant,
      },

      // ══════════════════════════════════════════════════════
      // SESAME (1)
      // ══════════════════════════════════════════════════════
      {
        id: PROG_SESAME_INFO_ID, institut_id: SESAME_INST_ID,
        titre: 'Génie Informatique', domaine: 'informatique', niveau: 'ingenieur',
        mode: 'cours_du_jour', duree_annees: 5,
        description:
          "Cycle ingénieur bac+5 intégré en génie informatique, accrédité EUR-ACE/ASIIN, implanté " +
          "dans la technopole El Ghazala : développement logiciel, réseaux, sciences des données, " +
          "intelligence artificielle et management des systèmes d'information. " +
          "La localisation au cœur du Silicon Valley tunisien favorise des connexions directes avec les " +
          "entreprises Tech et les start-ups d'El Ghazala. " +
          "Les diplômés s'insèrent dans le numérique, l'intégration de systèmes et les services IT.",
        documents_requis: documentsRequisPreparatoire, prerequis: prerequisBacInfo,
        frais_inscription: 7800.0, date_limite_candidature: dateLimite, capacite: 60,
        est_actif: true, langue: 'Français', date_debut: '2026-09-15',
        cree_le: maintenant, mis_a_jour_le: maintenant,
      },

      // ══════════════════════════════════════════════════════
      // Polytech Monastir (2)
      // ══════════════════════════════════════════════════════
      {
        id: PROG_MONASTIR_INFO_ID, institut_id: MONASTIR_INST_ID,
        titre: 'Génie Informatique', domaine: 'informatique', niveau: 'ingenieur',
        mode: 'cours_du_jour', duree_annees: 5,
        description:
          "Cycle ingénieur bac+5 intégré en génie informatique, en cours d'accréditation EUR-ACE/ASIIN : " +
          "développement logiciel, réseaux, cybersécurité, intelligence artificielle et systèmes embarqués. " +
          "Formation répondant aux besoins numériques des entreprises du bassin Centre-Est (Monastir, Mahdia, Sfax). " +
          "Les diplômés s'insèrent dans le développement logiciel, les services IT et les industries numériques de la région.",
        documents_requis: documentsRequisPreparatoire, prerequis: prerequisBacInfo,
        frais_inscription: 6500.0, date_limite_candidature: dateLimite, capacite: 60,
        est_actif: true, langue: 'Français', date_debut: '2026-09-15',
        cree_le: maintenant, mis_a_jour_le: maintenant,
      },
      {
        id: PROG_MONASTIR_ELEC_ID, institut_id: MONASTIR_INST_ID,
        titre: 'Génie Électrique', domaine: 'electrique', niveau: 'ingenieur',
        mode: 'cours_du_jour', duree_annees: 5,
        description:
          "Cycle ingénieur bac+5 intégré en génie électrique, en cours d'accréditation EUR-ACE/ASIIN : " +
          "électronique de puissance, machines électriques, automatismes industriels et énergies renouvelables. " +
          "Formation adaptée aux besoins électriques et énergétiques des industries du Centre-Est tunisien. " +
          "Les diplômés rejoignent les secteurs de l'énergie, de l'industrie manufacturière et des services techniques.",
        documents_requis: documentsRequisPreparatoire, prerequis: prerequisBac,
        frais_inscription: 6500.0, date_limite_candidature: dateLimite, capacite: 50,
        est_actif: true, langue: 'Français', date_debut: '2026-09-15',
        cree_le: maintenant, mis_a_jour_le: maintenant,
      },

      // ══════════════════════════════════════════════════════
      // ITBS (1)
      // ══════════════════════════════════════════════════════
      {
        id: PROG_ITBS_INFO_ID, institut_id: ITBS_INST_ID,
        titre: 'Génie Informatique', domaine: 'informatique', niveau: 'ingenieur',
        mode: 'cours_du_jour', duree_annees: 5,
        description:
          "Cycle ingénieur bac+5 intégré en génie informatique, en cours d'accréditation EUR-ACE/ASIIN : " +
          "développement logiciel, réseaux, sécurité informatique et management des systèmes d'information. " +
          "Localisée à Nabeul dans le cap Bon, ITBS forme des ingénieurs pour les services numériques, " +
          "le tourisme digital et les entreprises IT de la région nord-est tunisienne. " +
          "Les diplômés s'insèrent dans le développement web, les réseaux et les services IT.",
        documents_requis: documentsRequisPreparatoire, prerequis: prerequisBac,
        frais_inscription: 6000.0, date_limite_candidature: dateLimite, capacite: 60,
        est_actif: true, langue: 'Français', date_debut: '2026-09-15',
        cree_le: maintenant, mis_a_jour_le: maintenant,
      },

      // ══════════════════════════════════════════════════════
      // SUPTECH (1)
      // ══════════════════════════════════════════════════════
      {
        id: PROG_SUPTECH_INFO_ID, institut_id: SUPTECH_INST_ID,
        titre: 'Génie Informatique', domaine: 'informatique', niveau: 'ingenieur',
        mode: 'cours_du_jour', duree_annees: 5,
        description:
          "Cycle ingénieur bac+5 intégré en génie informatique, en cours d'accréditation EUR-ACE/QUACING : " +
          "développement logiciel, cybersécurité, intelligence artificielle et management IT. " +
          "Localisée en centre-ville de Tunis, SUPTECH bénéficie d'une proximité avec les entreprises " +
          "du secteur numérique et offre un enseignement orienté vers les besoins réels des PME tunisiennes. " +
          "Les diplômés s'insèrent dans le développement, la sécurité informatique et le conseil IT.",
        documents_requis: documentsRequisPreparatoire, prerequis: prerequisBac,
        frais_inscription: 5800.0, date_limite_candidature: dateLimite, capacite: 60,
        est_actif: true, langue: 'Français', date_debut: '2026-09-15',
        cree_le: maintenant, mis_a_jour_le: maintenant,
      },

      // ══════════════════════════════════════════════════════
      // ESIP Gafsa (1)
      // ══════════════════════════════════════════════════════
      {
        id: PROG_ESIP_INFO_ID, institut_id: ESIP_INST_ID,
        titre: 'Génie Informatique', domaine: 'informatique', niveau: 'ingenieur',
        mode: 'cours_du_jour', duree_annees: 5,
        description:
          "Cycle ingénieur bac+5 intégré en génie informatique, en cours d'accréditation EUR-ACE/ASIIN, " +
          "unique dans la région de Gafsa : développement logiciel, réseaux, systèmes d'information et intelligence artificielle. " +
          "Formation répondant aux besoins numériques des industries minières, pharmaceutiques et administratives du bassin gafsoui. " +
          "Les diplômés s'insèrent dans les entreprises du secteur public et privé du Grand Sud tunisien.",
        documents_requis: documentsRequisPreparatoire, prerequis: prerequisBac,
        frais_inscription: 5000.0, date_limite_candidature: dateLimite, capacite: 50,
        est_actif: true, langue: 'Français', date_debut: '2026-09-15',
        cree_le: maintenant, mis_a_jour_le: maintenant,
      },

      // ══════════════════════════════════════════════════════
      // MIT POLYTECH (4)
      // ══════════════════════════════════════════════════════
      {
        id: PROG_MITPOLY_PREP_ID, institut_id: MITPOLY_INST_ID,
        titre: 'Cycle Préparatoire Intégré', domaine: 'mecanique', niveau: 'cycle_preparatoire',
        mode: 'cours_du_jour', duree_annees: 2,
        description:
          "Cycle préparatoire intégré de 2 ans commun aux filières ingénieur de MIT Polytech, " +
          "en cours d'accréditation EUR-ACE/ASIIN : mathématiques, physique, algorithmique, " +
          "électronique et mécanique générale. " +
          "L'orientation vers l'une des trois spécialités ingénieur (Informatique, Mécatronique, Industriel et Logistique) " +
          "intervient en fin de première année selon classement et vœux.",
        documents_requis: documentsRequisPreparatoire, prerequis: prerequisBac,
        frais_inscription: 4000.0, date_limite_candidature: dateLimite, capacite: 80,
        est_actif: true, langue: 'Français', date_debut: '2026-09-15',
        cree_le: maintenant, mis_a_jour_le: maintenant,
      },
      {
        id: PROG_MITPOLY_INFO_ID, institut_id: MITPOLY_INST_ID,
        titre: 'Génie Informatique', domaine: 'informatique', niveau: 'ingenieur',
        mode: 'cours_du_jour', duree_annees: 3,
        description:
          "Cycle ingénieur bac+5 en génie informatique, en cours d'accréditation EUR-ACE/ASIIN : " +
          "développement logiciel, réseaux, intelligence artificielle et transformation numérique des entreprises. " +
          "Partenariats avec des entreprises IT tunisiennes pour les stages et projets de fin d'études. " +
          "Les diplômés s'insèrent dans le développement, les services IT et la digitalisation des entreprises.",
        documents_requis: documentsRequisIngenieur, prerequis: prerequisIngenieur,
        frais_inscription: 7000.0, date_limite_candidature: dateLimite, capacite: 60,
        est_actif: true, langue: 'Français', date_debut: '2026-09-15',
        cree_le: maintenant, mis_a_jour_le: maintenant,
      },
      {
        id: PROG_MITPOLY_MECA_ID, institut_id: MITPOLY_INST_ID,
        titre: 'Génie Mécatronique', domaine: 'mecanique', niveau: 'ingenieur',
        mode: 'cours_du_jour', duree_annees: 3,
        description:
          "Cycle ingénieur bac+5 en mécatronique, en cours d'accréditation EUR-ACE/ASIIN : " +
          "systèmes mécatroniques, robotique, commande numérique et informatique embarquée. " +
          "Dispensé en français et en anglais, avec des laboratoires de prototypage et des projets industriels. " +
          "Les diplômés accèdent aux secteurs de la robotique industrielle, de l'automobile et des systèmes intelligents.",
        documents_requis: documentsRequisIngenieur, prerequis: prerequisIngenieurInfo,
        frais_inscription: 7500.0, date_limite_candidature: dateLimite, capacite: 40,
        est_actif: true, langue: 'Français/Anglais', date_debut: '2026-09-15',
        cree_le: maintenant, mis_a_jour_le: maintenant,
      },
      {
        id: PROG_MITPOLY_INDLOG_ID, institut_id: MITPOLY_INST_ID,
        titre: 'Génie Industriel et Logistique', domaine: 'mecanique', niveau: 'ingenieur',
        mode: 'cours_du_jour', duree_annees: 3,
        description:
          "Cycle ingénieur bac+5 en génie industriel et logistique, en cours d'accréditation EUR-ACE/ASIIN : " +
          "gestion de la chaîne logistique (supply chain), lean manufacturing, entrepôts et transport, " +
          "ERP et digitalisation des flux industriels. " +
          "Formation répondant aux enjeux de la compétitivité industrielle et logistique des entreprises tunisiennes. " +
          "Les diplômés accèdent aux fonctions de responsable logistique, supply chain manager ou directeur industriel.",
        documents_requis: documentsRequisIngenieur, prerequis: prerequisIngenieur,
        frais_inscription: 7000.0, date_limite_candidature: dateLimite, capacite: 50,
        est_actif: true, langue: 'Français', date_debut: '2026-09-15',
        cree_le: maintenant, mis_a_jour_le: maintenant,
      },

      // ══════════════════════════════════════════════════════
      // ESSAT Gabès (2)
      // ══════════════════════════════════════════════════════
      {
        id: PROG_ESSAT_INFO_ID, institut_id: ESSAT_INST_ID,
        titre: 'Génie Informatique', domaine: 'informatique', niveau: 'ingenieur',
        mode: 'cours_du_jour', duree_annees: 5,
        description:
          "Cycle ingénieur bac+5 intégré en génie informatique, en cours d'accréditation EUR-ACE/ASIIN : " +
          "développement logiciel, réseaux, intelligence artificielle et systèmes d'information industriels. " +
          "Formation adaptée aux besoins numériques des industries chimiques, pétrolières et énergétiques de Gabès. " +
          "Les diplômés s'insèrent dans le secteur IT, les services numériques et les entreprises industrielles du Grand Sud.",
        documents_requis: documentsRequisPreparatoire, prerequis: prerequisBac,
        frais_inscription: 5500.0, date_limite_candidature: dateLimite, capacite: 50,
        est_actif: true, langue: 'Français', date_debut: '2026-09-15',
        cree_le: maintenant, mis_a_jour_le: maintenant,
      },
      {
        id: PROG_ESSAT_ELEC_ID, institut_id: ESSAT_INST_ID,
        titre: 'Génie Électrique', domaine: 'electrique', niveau: 'ingenieur',
        mode: 'cours_du_jour', duree_annees: 5,
        description:
          "Cycle ingénieur bac+5 intégré en génie électrique, en cours d'accréditation EUR-ACE/ASIIN : " +
          "électronique de puissance, automatismes, réseaux électriques et intégration des énergies renouvelables. " +
          "Formation répondant aux besoins électriques et énergétiques du pôle industriel gabesien. " +
          "Les diplômés rejoignent les industries chimiques, pétrolières et les services énergétiques de la région.",
        documents_requis: documentsRequisPreparatoire, prerequis: prerequisBac,
        frais_inscription: 5500.0, date_limite_candidature: dateLimite, capacite: 50,
        est_actif: true, langue: 'Français', date_debut: '2026-09-15',
        cree_le: maintenant, mis_a_jour_le: maintenant,
      },

      // ══════════════════════════════════════════════════════
      // UPES Mégrine (3)
      // ══════════════════════════════════════════════════════
      {
        id: PROG_UPES_INFO_ID, institut_id: UPES_INST_ID,
        titre: 'Génie Informatique', domaine: 'informatique', niveau: 'ingenieur',
        mode: 'cours_du_jour', duree_annees: 5,
        description:
          "Cycle ingénieur bac+5 intégré en génie informatique, en cours d'accréditation EUR-ACE/ASIIN : " +
          "développement logiciel, architecture des systèmes, intelligence artificielle et sécurité des données. " +
          "Formation implantée dans la banlieue sud de Tunis, proche des zones industrielles de Ben Arous. " +
          "Les diplômés s'insèrent dans les entreprises numériques et les PME du Grand Tunis et de sa périphérie.",
        documents_requis: documentsRequisPreparatoire, prerequis: prerequisBac,
        frais_inscription: 5500.0, date_limite_candidature: dateLimite, capacite: 60,
        est_actif: true, langue: 'Français', date_debut: '2026-09-15',
        cree_le: maintenant, mis_a_jour_le: maintenant,
      },
      {
        id: PROG_UPES_RESEAUX_ID, institut_id: UPES_INST_ID,
        titre: 'Systèmes et Réseaux Informatiques', domaine: 'informatique', niveau: 'ingenieur',
        mode: 'cours_du_jour', duree_annees: 5,
        description:
          "Cycle ingénieur bac+5 intégré en systèmes et réseaux informatiques, en cours d'accréditation EUR-ACE/ASIIN : " +
          "administration des systèmes, réseaux IP, cybersécurité, virtualisation et infrastructure cloud. " +
          "Partenariats avec des opérateurs télécoms et des sociétés d'intégration de la région tunisoise. " +
          "Les diplômés accèdent aux postes d'administrateur systèmes, ingénieur réseau ou consultant cybersécurité.",
        documents_requis: documentsRequisPreparatoire, prerequis: prerequisBac,
        frais_inscription: 5500.0, date_limite_candidature: dateLimite, capacite: 50,
        est_actif: true, langue: 'Français', date_debut: '2026-09-15',
        cree_le: maintenant, mis_a_jour_le: maintenant,
      },
      {
        id: PROG_UPES_INDINFO_ID, institut_id: UPES_INST_ID,
        titre: 'Informatique Industrielle', domaine: 'informatique', niveau: 'ingenieur',
        mode: 'cours_du_jour', duree_annees: 5,
        description:
          "Cycle ingénieur bac+5 intégré en informatique industrielle, en cours d'accréditation EUR-ACE/ASIIN : " +
          "systèmes embarqués, automates programmables, supervision SCADA et réseaux industriels. " +
          "Formation répondant aux besoins de digitalisation des industries manufacturières de Ben Arous et du Grand Tunis. " +
          "Les diplômés s'insèrent dans l'automatisation industrielle, l'intégration de systèmes et la maintenance informatique.",
        documents_requis: documentsRequisPreparatoire, prerequis: prerequisBac,
        frais_inscription: 5500.0, date_limite_candidature: dateLimite, capacite: 40,
        est_actif: true, langue: 'Français', date_debut: '2026-09-15',
        cree_le: maintenant, mis_a_jour_le: maintenant,
      },

      // ══════════════════════════════════════════════════════
      // FINANCE (3) — ESPRIT · MedTech · Iteam
      // ══════════════════════════════════════════════════════
      {
        id: PROG_ESPRIT_FINTECH_ID, institut_id: ESPRIT_INST_ID,
        titre: 'Master Finance et Technologies Financières (FinTech)',
        domaine: 'finance', niveau: 'master',
        mode: 'cours_du_jour', duree_annees: 2,
        description:
          "Master professionnel bac+5 en finance et technologies financières, accrédité CTI/HCERES : " +
          "marchés financiers, gestion de portefeuille, comptabilité analytique, blockchain appliquée à la finance, " +
          "paiements numériques et réglementation prudentielle internationale. " +
          "Dispensé en français et en anglais, avec des études de cas réels en partenariat avec des banques et " +
          "des sociétés fintech tunisiennes. Les diplômés accèdent aux fonctions d'analyste financier, " +
          "contrôleur de gestion ou consultant FinTech en Tunisie et à l'international.",
        documents_requis: documentsRequisMaster, prerequis: prerequisMasterGestion,
        frais_inscription: 10000.0, date_limite_candidature: dateLimite, capacite: 40,
        est_actif: true, langue: 'Français/Anglais', date_debut: '2026-09-15',
        cree_le: maintenant, mis_a_jour_le: maintenant,
      },
      {
        id: PROG_MEDTECH_FINANCE_ID, institut_id: MEDTECH_INST_ID,
        titre: 'Bachelor of Science in Finance',
        domaine: 'finance', niveau: 'licence',
        mode: 'cours_du_jour', duree_annees: 3,
        description:
          "Licence en finance (bac+3) dispensée intégralement en anglais selon le modèle américain, " +
          "accréditée AACSB : finance d'entreprise, analyse financière, marchés de capitaux, " +
          "gestion des risques et introduction aux instruments dérivés. " +
          "Partenariats avec des cabinets d'audit internationaux (Big Four) et des banques tunisiennes. " +
          "Les diplômés peuvent poursuivre en MBA ou Master Finance, ou s'insérer directement dans les " +
          "départements financiers des multinationales et des institutions bancaires.",
        documents_requis: documentsRequisLicence, prerequis: prerequisBacEco,
        frais_inscription: 11000.0, date_limite_candidature: dateLimite, capacite: 35,
        est_actif: true, langue: 'Anglais', date_debut: '2026-09-15',
        cree_le: maintenant, mis_a_jour_le: maintenant,
      },
      {
        id: PROG_ITEAM_FINANCE_ID, institut_id: ITEAM_INST_ID,
        titre: 'Licence Sciences de Gestion — Finance d\'Entreprise',
        domaine: 'finance', niveau: 'licence',
        mode: 'cours_du_soir', duree_annees: 3,
        description:
          "Licence appliquée en sciences de gestion — option finance d'entreprise (bac+3), en cours " +
          "d'accréditation EUR-ACE/QUACING, dispensée en cours du soir pour les professionnels en activité : " +
          "comptabilité générale et analytique, gestion financière, contrôle de gestion, droit des affaires " +
          "et fiscalité tunisienne. " +
          "Formation accessible à tous les bacheliers et adaptée aux contraintes des étudiants salariés. " +
          "Les diplômés accèdent aux postes de comptable, assistant financier ou contrôleur de gestion.",
        documents_requis: documentsRequisLicence, prerequis: prerequisBacEco,
        frais_inscription: 6500.0, date_limite_candidature: dateLimite, capacite: 50,
        est_actif: true, langue: 'Français', date_debut: '2026-09-15',
        cree_le: maintenant, mis_a_jour_le: maintenant,
      },

      // ══════════════════════════════════════════════════════
      // MANAGEMENT (3) — MedTech · SUPTECH · Iteam
      // ══════════════════════════════════════════════════════
      {
        id: PROG_MEDTECH_MBA_ID, institut_id: MEDTECH_INST_ID,
        titre: 'Master of Business Administration (MBA)',
        domaine: 'management', niveau: 'master',
        mode: 'cours_du_jour', duree_annees: 2,
        description:
          "MBA accrédité AACSB, dispensé en anglais selon le modèle américain : stratégie d'entreprise, " +
          "leadership et management des équipes, marketing digital, supply chain management, " +
          "entrepreneuriat et innovation. " +
          "Programme intensif comprenant des études de cas Harvard, des simulations de gestion et " +
          "un projet de conseil réel avec une entreprise partenaire. " +
          "Les diplômés accèdent aux postes de manager, chef de projet ou entrepreneur, " +
          "avec une reconnaissance internationale immédiate grâce à l'accréditation AACSB.",
        documents_requis: documentsRequisMaster, prerequis: prerequisMasterGestion,
        frais_inscription: 14000.0, date_limite_candidature: dateLimite, capacite: 30,
        est_actif: true, langue: 'Anglais', date_debut: '2026-09-15',
        cree_le: maintenant, mis_a_jour_le: maintenant,
      },
      {
        id: PROG_SUPTECH_MGMT_ID, institut_id: SUPTECH_INST_ID,
        titre: 'Licence Management des Organisations',
        domaine: 'management', niveau: 'licence',
        mode: 'cours_du_soir', duree_annees: 3,
        description:
          "Licence appliquée en management des organisations (bac+3), en cours d'accréditation " +
          "EUR-ACE/QUACING, dispensée en cours du soir : principes de management, organisation des " +
          "entreprises, gestion des ressources humaines, marketing stratégique, conduite du changement " +
          "et management de projet. " +
          "Formation accessible à tous les bacheliers, conçue pour les professionnels souhaitant " +
          "acquérir des compétences managériales reconnues. " +
          "Les diplômés accèdent aux postes de responsable d'équipe, chef de projet ou assistant manager.",
        documents_requis: documentsRequisLicence, prerequis: prerequisBacEco,
        frais_inscription: 5500.0, date_limite_candidature: dateLimite, capacite: 55,
        est_actif: true, langue: 'Français', date_debut: '2026-09-15',
        cree_le: maintenant, mis_a_jour_le: maintenant,
      },
      {
        id: PROG_ITEAM_MGMT_ID, institut_id: ITEAM_INST_ID,
        titre: 'Ingénieur en Management des Systèmes d\'Information',
        domaine: 'management', niveau: 'ingenieur',
        mode: 'cours_du_jour', duree_annees: 5,
        description:
          "Cycle ingénieur bac+5 en management des systèmes d'information, accrédité EUR-ACE/QUACING : " +
          "double compétence ingénierie logicielle et management d'entreprise — architecture des SI, " +
          "conduite de projets informatiques, gouvernance IT, business intelligence et transformation digitale. " +
          "Formation unique alliant les compétences techniques d'un ingénieur informaticien " +
          "et les outils de gestion d'un manager, répondant aux besoins des DSI tunisiennes et internationales. " +
          "Les diplômés accèdent aux postes de chef de projet IT, directeur des systèmes d'information ou consultant SI.",
        documents_requis: documentsRequisIngenieur, prerequis: prerequisIngenieurInfo,
        frais_inscription: 8500.0, date_limite_candidature: dateLimite, capacite: 45,
        est_actif: true, langue: 'Français', date_debut: '2026-09-15',
        cree_le: maintenant, mis_a_jour_le: maintenant,
      },

    ], {})
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.bulkDelete('programmes', {
      id: [
        // ESPRIT (6)
        PROG_ESPRIT_INFO_ID, PROG_ESPRIT_CIVIL_ID, PROG_ESPRIT_TELECOM_ID,
        PROG_ESPRIT_PREP_ID, PROG_ESPRIT_ELECMEC_ID, PROG_ESPRIT_MECA_ID,
        // MedTech (5)
        PROG_MEDTECH_CE_ID, PROG_MEDTECH_SE_ID, PROG_MEDTECH_RENEW_ID,
        PROG_MEDTECH_EE_ID, PROG_MEDTECH_BME_ID,
        // EPSousse (5)
        PROG_POLY_PREP_ID, PROG_POLY_CIVIL_ID, PROG_POLY_TELECOM_ID,
        PROG_POLY_ELEC_ID, PROG_POLY_INFO_IND_ID,
        // ULT (7)
        PROG_ULT_PREP_ID, PROG_ULT_CIVIL_ID, PROG_ULT_ELECMEC_ID,
        PROG_ULT_ENERG_ID, PROG_ULT_ELECINFO_ID, PROG_ULT_BIO_ID, PROG_ULT_ALIM_ID,
        // TEK-UP (1)
        PROG_TEKUP_CSE_ID,
        // Polytechnique INTL (4)
        PROG_POLYINTL_PREP_ID, PROG_POLYINTL_IRM_ID, PROG_POLYINTL_MECA_ID, PROG_POLYINTL_IND_ID,
        // EPI Sousse (6)
        PROG_EPI_PREP_ID, PROG_EPI_ELECMEC_ID, PROG_EPI_ELEC_ID,
        PROG_EPI_IND_ID, PROG_EPI_CIVIL_ID, PROG_EPI_INFO_ID,
        // ESAT (2)
        PROG_ESAT_AERO_ID, PROG_ESAT_GEO_ID,
        // ESIET-UAS (7)
        PROG_ESIET_PREP_ID, PROG_ESIET_IND_ID, PROG_ESIET_CIVIL_ID,
        PROG_ESIET_ELEC_ID, PROG_ESIET_ELECMEC_ID, PROG_ESIET_MECA_ID, PROG_ESIET_INFO_ID,
        // IPSAS (6)
        PROG_IPSAS_PREP_ID, PROG_IPSAS_CIVIL_ID, PROG_IPSAS_ELECMEC_ID,
        PROG_IPSAS_INFO_ID, PROG_IPSAS_PETRO_ID, PROG_IPSAS_IND_ID,
        // IIT (5)
        PROG_IIT_PREP_ID, PROG_IIT_INFO_ID, PROG_IIT_IND_ID, PROG_IIT_PROC_ID, PROG_IIT_MECA_ID,
        // Iteam (1)
        PROG_ITEAM_INFO_ID,
        // SESAME (1)
        PROG_SESAME_INFO_ID,
        // Polytech Monastir (2)
        PROG_MONASTIR_INFO_ID, PROG_MONASTIR_ELEC_ID,
        // ITBS (1)
        PROG_ITBS_INFO_ID,
        // SUPTECH (1)
        PROG_SUPTECH_INFO_ID,
        // ESIP (1)
        PROG_ESIP_INFO_ID,
        // MIT POLYTECH (4)
        PROG_MITPOLY_PREP_ID, PROG_MITPOLY_INFO_ID, PROG_MITPOLY_MECA_ID, PROG_MITPOLY_INDLOG_ID,
        // ESSAT (2)
        PROG_ESSAT_INFO_ID, PROG_ESSAT_ELEC_ID,
        // UPES (3)
        PROG_UPES_INFO_ID, PROG_UPES_RESEAUX_ID, PROG_UPES_INDINFO_ID,
        // Finance (3)
        PROG_ESPRIT_FINTECH_ID, PROG_MEDTECH_FINANCE_ID, PROG_ITEAM_FINANCE_ID,
        // Management (3)
        PROG_MEDTECH_MBA_ID, PROG_SUPTECH_MGMT_ID, PROG_ITEAM_MGMT_ID,
      ],
    }, {})
  },

}
