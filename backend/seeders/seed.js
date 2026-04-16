// seeders/seed.js – Initialisation complète de la base de données EduBridge
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const bcrypt = require('bcryptjs');

const {
  sequelize,
  Country,
  User,
  Institute,
  Program,
  Application,
} = require('../models');

// ── Mapping ville → gouvernorat ───────────────────────────────────────
const cityToGov = {
  'Tunis':        'Tunis',
  'Ariana':       'Ariana',
  'Ben Arous':    'Ben Arous',
  'Manouba':      'Manouba',
  'Hammam Sousse':'Sousse',
  'Sousse':       'Sousse',
  'Monastir':     'Monastir',
  'Sfax':         'Sfax',
  'Nabeul':       'Nabeul',
  'Gafsa':        'Gafsa',
  'Gabès':        'Gabès',
  'Médenine':     'Médenine',
  'Mégrine':      'Ben Arous',
};

// ── Données des 20 écoles (issues de edubridge_seed.sql) ──────────────
const INSTITUTES_DATA = [
  {
    short_name: 'MedTech',
    name: 'Mediterranean Institute of Technology',
    name_ar: 'المدرسة العليا الخاصة المتوسطية للتكنولوجيا',
    founded_year: 2014,
    city: 'Tunis',
    address: 'Campus MSB-MedTech, Les Jardins du Lac II (près de Henkel), Berges du Lac 2, Tunis',
    phone: '+216 70 016 100',
    email: 'admission@smu.tn',
    website: 'https://www.medtech.tn',
    accreditation: 'ABET',
    description: 'Fondé en 2014, MedTech est l\'école d\'ingénieurs de la South Mediterranean University (SMU). Première et seule école d\'ingénieurs en Tunisie accréditée ABET. Programmes entièrement dispensés en anglais.',
    facebook_url: 'https://www.facebook.com/medtech.tn/',
    notes: 'Frais non publics – contacter admission@smu.tn.',
    programs: [
      { name: 'Computer Engineering',         language: 'Anglais', accreditation_valid_until: '2024-08-31', accreditation_status: 'accredited' },
      { name: 'Renewable Energy Engineering', language: 'Anglais', accreditation_valid_until: '2024-08-31', accreditation_status: 'accredited' },
      { name: 'Software Engineering',         language: 'Anglais', accreditation_valid_until: '2024-08-31', accreditation_status: 'accredited' },
    ],
  },
  {
    short_name: 'POLYTECH Sousse',
    name: 'École Polytechnique Privée de Sousse',
    name_ar: 'المدرسة الخاصة للتقنيات بسوسة',
    founded_year: 2009,
    city: 'Hammam Sousse',
    address: 'Rue Khlifa Karoui, Immeuble Zaâtir, 4054 Hammam Sousse',
    phone: '+216 73 277 877',
    email: 'contact@polytecsousse.tn',
    website: 'https://www.polytecsousse.tn',
    accreditation: 'EUR-ACE / CTI',
    description: 'Fondée en 2009, 2e école privée à obtenir un agrément. Portée par le Groupe de Formation et d\'Ingénierie (GFI). Accréditation EUR-ACE/CTI valide jusqu\'au 31/12/2029.',
    notes: 'Frais incluent DELF + 2 certifications + assurance maladie.',
    programs: [
      { name: 'Génie Informatique',               accreditation_valid_until: '2029-12-31', accreditation_status: 'accredited' },
      { name: 'Génie Biotechnologie',             accreditation_valid_until: '2029-12-31', accreditation_status: 'accredited' },
      { name: 'Génie Électrique et Automatique',  accreditation_valid_until: '2029-12-31', accreditation_status: 'accredited' },
      { name: 'Génie Télécom et Réseaux',         accreditation_valid_until: '2029-12-31', accreditation_status: 'accredited' },
      { name: 'Génie Civil',                      accreditation_valid_until: '2029-12-31', accreditation_status: 'accredited' },
      { name: 'Génie Électromécanique',           accreditation_valid_until: '2029-12-31', accreditation_status: 'accredited' },
    ],
  },
  {
    short_name: 'ULT',
    name: 'Institut Supérieur Polytechnique Privé / Université Libre de Tunis',
    name_ar: 'المعهد العالي الخاص للتقنيات المتعددة الجامعة الحرة بتونس',
    city: 'Tunis',
    address: '36 av. Louis Braille, Tunis 1002',
    phone: '+216 71 902 491',
    email: 'contact@ult-tunisie.com',
    website: 'https://www.ult-tunisie.com',
    accreditation: 'EUR-ACE / ASIIN',
    programs: [
      { name: 'Génie Civil',                                   accreditation_valid_until: '2026-09-30', accreditation_status: 'accredited' },
      { name: 'Génie Électromécanique',                        accreditation_valid_until: '2025-01-19', accreditation_status: 'accredited' },
      { name: 'Génie Énergétique',                             accreditation_valid_until: '2025-01-19', accreditation_status: 'accredited' },
      { name: 'Génie Électrique et Informatique Industrielle', accreditation_valid_until: '2025-01-19', accreditation_status: 'accredited' },
      { name: 'Génie Biologique',                              accreditation_valid_until: '2025-01-19', accreditation_status: 'accredited' },
      { name: 'Industries Alimentaires',                       accreditation_valid_until: '2025-01-19', accreditation_status: 'accredited' },
      { name: 'Génie Informatique',                            accreditation_status: 'in_progress' },
      { name: 'Génie Industriel',                              accreditation_status: 'in_progress' },
    ],
  },
  {
    short_name: 'TEK-UP',
    name: 'École Supérieure Privée de Technologies et de l\'Ingénierie',
    name_ar: 'المدرسة العليا الخاصة للتكنولوجيا والهندسة',
    city: 'Ariana',
    address: 'Borj Baccouche, Ariana',
    phone: '+216 88 810 077',
    email: 'contact@tek-up.de',
    website: 'https://www.tek-up.de',
    accreditation: 'EUR-ACE / QUACING',
    programs: [
      { name: 'Computer Science Engineering', language: 'Anglais', accreditation_valid_until: '2025-09-07', accreditation_status: 'accredited' },
    ],
  },
  {
    short_name: 'Polytechnique INTL',
    name: 'Polytechnique INTL',
    name_ar: 'المدرسة الدولية الخاصة للتقنيات',
    city: 'Tunis',
    address: 'Berges du Lac, Tunis 1053',
    phone: '+216 70 026 426',
    email: 'contact@polytech-intl.tn',
    website: 'https://www.polytech-intl.tn',
    accreditation: 'EUR-ACE / CTI',
    programs: [
      { name: 'Informatique, Réseaux et Multimédia', accreditation_valid_until: '2028-08-31', accreditation_status: 'accredited' },
      { name: 'Mécatronique',                        accreditation_valid_until: '2028-08-31', accreditation_status: 'accredited' },
      { name: 'Génie Industriel',                    accreditation_valid_until: '2028-08-31', accreditation_status: 'accredited' },
    ],
  },
  {
    short_name: 'ESPRIT',
    name: 'École Supérieure Privée d\'Ingénierie et de Technologies',
    name_ar: 'المدرسة العليا الخاصة للهندسة والتكنولوجيا',
    founded_year: 2003,
    city: 'Ariana',
    address: 'Parc Technologique El Ghazala, Ariana 2088',
    phone: '+216 81 371 371',
    email: 'contact@esprit.tn',
    website: 'https://www.esprit.tn',
    accreditation: 'EUR-ACE / CTI',
    ranking: 1,
    description: 'Fondée en 2003, ESPRIT est le plus grand établissement privé d\'enseignement supérieur en Tunisie (5000+ étudiants). Première école d\'ingénieurs en Tunisie à obtenir l\'accréditation EUR-ACE. Membre CDIO.',
    notes: 'Réductions familles 25%/30%. Bourses au mérite jusqu\'à 30%.',
    programs: [
      { name: 'Génie Électromécanique', accreditation_valid_until: '2028-12-31', accreditation_status: 'accredited' },
      { name: 'Génie Civil',            accreditation_valid_until: '2028-12-31', accreditation_status: 'accredited' },
      { name: 'Génie Informatique',     accreditation_valid_until: '2028-12-31', accreditation_status: 'accredited' },
      { name: 'Génie Télécommunication',accreditation_valid_until: '2028-12-31', accreditation_status: 'accredited' },
    ],
  },
  {
    short_name: 'EPI Polytechnique Sousse',
    name: 'École Internationale Supérieure Privée Polytechnique de Sousse',
    name_ar: 'المدرسة الدولية العليا الخاصة للتقنيات المتعددة بسوسة',
    city: 'Sousse',
    address: 'Sahloul, Sousse 4021',
    phone: '+216 86 703 131',
    email: 'contact@episousse.com.tn',
    website: 'https://www.episousse.com.tn',
    accreditation: 'EUR-ACE / ASIIN',
    programs: [
      { name: 'Génie Électromécanique', accreditation_valid_until: '2025-09-30', accreditation_status: 'accredited' },
      { name: 'Génie Électrique',       accreditation_valid_until: '2025-09-30', accreditation_status: 'accredited' },
      { name: 'Génie Industriel',       accreditation_valid_until: '2025-09-30', accreditation_status: 'accredited' },
      { name: 'Génie Civil',            accreditation_valid_until: '2025-09-30', accreditation_status: 'accredited' },
      { name: 'Génie Informatique',     accreditation_valid_until: '2025-09-30', accreditation_status: 'accredited' },
    ],
  },
  {
    short_name: 'ESAT',
    name: 'École Supérieure Privée de l\'Aéronautique et des Technologies',
    name_ar: 'المدرسة العليا الخاصة للطيران والتكنولوجيا',
    city: 'Tunis',
    address: 'Charguia II, Tunis 2035',
    phone: '+216 71 940 422',
    email: 'contact@esat.ens.tn',
    website: 'https://www.esat.ens.tn',
    accreditation: 'EUR-ACE / ASIIN',
    notes: 'Spécialité unique en Tunisie : Génie Aéronautique.',
    programs: [
      { name: 'Génie Aéronautique', accreditation_valid_until: '2025-09-30', accreditation_status: 'accredited' },
      { name: 'Géomatique',         accreditation_valid_until: '2029-09-30', accreditation_status: 'accredited' },
    ],
  },
  {
    short_name: 'ESIET-UAS',
    name: 'École Supérieure Privée d\'Ingénieurs et d\'Études Technologiques de Tunis - Université Arabe des Sciences',
    name_ar: 'المدرسة العليا الخاصة للمهندسين والدراسات التكنولوجية بتونس',
    city: 'Tunis',
    address: '18 rue Nelson Mandela, Tunis 1002',
    phone: '+216 71 335 073',
    email: 'contact@uas.ens.tn',
    website: 'https://www.uas.ens.tn',
    accreditation: 'EUR-ACE / CTI',
    programs: [
      { name: 'Génie Industriel',       accreditation_valid_until: '2026-08-31', accreditation_status: 'accredited' },
      { name: 'Génie Civil',            accreditation_valid_until: '2026-08-31', accreditation_status: 'accredited' },
      { name: 'Génie Électrique',       accreditation_valid_until: '2026-08-31', accreditation_status: 'accredited' },
      { name: 'Génie Électromécanique', accreditation_valid_until: '2026-08-31', accreditation_status: 'accredited' },
      { name: 'Génie Mécatronique',     accreditation_valid_until: '2026-08-31', accreditation_status: 'accredited' },
      { name: 'Génie Informatique',     accreditation_valid_until: '2026-08-31', accreditation_status: 'accredited' },
    ],
  },
  {
    short_name: 'IPSAS',
    name: 'Institut Privé Polytechnique des Sciences Avancées de Sfax',
    name_ar: 'المعهد العالي الخاص للتقنيات والعلوم المتقدمة بصفاقس',
    city: 'Sfax',
    address: 'Av. 5 Août, Sfax 3002',
    phone: '+216 74 225 665',
    email: 'contact@ipsas-ens.net',
    website: 'https://www.ipsas-ens.net',
    accreditation: 'EUR-ACE / CTI',
    notes: 'Spécialité rare en Tunisie : Génie Pétrolier.',
    programs: [
      { name: 'Génie Civil',            accreditation_valid_until: '2026-12-31', accreditation_status: 'accredited' },
      { name: 'Génie Électromécanique', accreditation_valid_until: '2026-12-31', accreditation_status: 'accredited' },
      { name: 'Génie Informatique',     accreditation_valid_until: '2026-12-31', accreditation_status: 'accredited' },
      { name: 'Génie Pétrolier',        accreditation_valid_until: '2026-12-31', accreditation_status: 'accredited' },
      { name: 'Génie Industriel',       accreditation_valid_until: '2026-12-31', accreditation_status: 'accredited' },
    ],
  },
  {
    short_name: 'IIT',
    name: 'Institut International Technologie - Université Nord Américaine Privée',
    name_ar: 'المدرسة العليا الدولية الخاصة للتكنولوجيا بصفاقس',
    city: 'Sfax',
    address: 'Route Mharza km 1.5, Sfax 3003',
    phone: '+216 87 738 377',
    email: 'contact@iit-nau.com',
    website: 'https://www.iit-nau.com',
    accreditation: 'EUR-ACE / ASIIN',
    programs: [
      { name: 'Génie Informatique', accreditation_valid_until: '2025-09-30', accreditation_status: 'accredited' },
      { name: 'Génie Industriel',   accreditation_valid_until: '2025-09-30', accreditation_status: 'accredited' },
      { name: 'Génie des Procédés', accreditation_valid_until: '2026-09-30', accreditation_status: 'accredited' },
      { name: 'Génie Mécanique',    accreditation_valid_until: '2026-09-30', accreditation_status: 'accredited' },
    ],
  },
  {
    short_name: 'Iteam',
    name: 'École Supérieure Privée d\'Ingénierie en Informatique et Administration des Affaires (Iteam University)',
    name_ar: 'المدرسة العليا الخاصة للهندسة والاتصال',
    city: 'Tunis',
    address: '85 rue de Palestine, Tunis 1002',
    phone: '+216 88 878 178',
    email: 'contact@iteam-univ.tn',
    website: 'https://www.iteam-univ.tn',
    accreditation: 'EUR-ACE / QUACING',
    programs: [
      { name: 'Génie Informatique', accreditation_valid_until: '2026-09-12', accreditation_status: 'accredited' },
    ],
  },
  {
    short_name: 'SESAME',
    name: 'École Supérieure Privée des Sciences Appliquées et de Management',
    name_ar: 'المدرسة العليا الخاصة للعلوم التطبيقية وإدارة الأعمال',
    city: 'Tunis',
    address: 'Parc Technologique El Ghazala, Tunis 2088',
    phone: '+216 81 373 773',
    email: 'contact@sesame.com.tn',
    website: 'https://www.sesame.com.tn',
    accreditation: 'EUR-ACE / ASIIN',
    notes: 'Validité accréditation Génie Informatique : 14/10/2024 (à renouveler).',
    programs: [
      { name: 'Génie Informatique', accreditation_valid_until: '2024-10-14', accreditation_status: 'expired' },
    ],
  },
  {
    short_name: 'Polytech Monastir',
    name: 'École Supérieure Polytechnique Privée de Monastir',
    name_ar: 'المدرسة العليا الخاصة لتعددة التقنيات بالمنستير',
    city: 'Monastir',
    address: 'Av. Taieb M\'hiri, Monastir 1111',
    phone: '+216 86 771 011',
    email: 'contact@polytechmonastir.tn',
    website: 'https://www.polytechmonastir.tn',
    accreditation: 'EUR-ACE / ASIIN',
    programs: [
      { name: 'Génie Informatique', accreditation_status: 'in_progress' },
      { name: 'Génie Électrique',   accreditation_status: 'in_progress' },
    ],
  },
  {
    short_name: 'ITBS',
    name: 'École Supérieure Privée des Technologies et de l\'Information et de Management de Nabeul (IT Business School)',
    name_ar: 'المدرسة العليا الخاصة لتكنولوجيا المعلومات وإدارة الأعمال بنابل',
    city: 'Nabeul',
    address: 'Route Hammamet, Nabeul 8000',
    phone: '+216 87 766 888',
    email: 'contact@itbs.tn',
    website: 'https://www.itbs.tn',
    accreditation: 'EUR-ACE / ASIIN',
    programs: [
      { name: 'Génie Informatique', accreditation_status: 'in_progress' },
    ],
  },
  {
    short_name: 'SUPTECH',
    name: 'École Supérieure Privée de Technologie et de Management',
    name_ar: 'المدرسة العليا الخاصة للتكنولوجيا وإدارة الأعمال بتونس',
    city: 'Tunis',
    address: '22 av. de Madrid, Tunis 1000',
    phone: '+216 88 663 777',
    email: 'contact@suptech.tn',
    website: 'https://www.suptech.tn',
    accreditation: 'EUR-ACE / QUACING',
    programs: [
      { name: 'Génie Informatique', accreditation_status: 'in_progress' },
    ],
  },
  {
    short_name: 'ESIP',
    name: 'École Supérieure d\'Ingénieurs Privée de Gafsa',
    name_ar: 'المدرسة العليا الخاصة للمهندسين بقفصة',
    city: 'Gafsa',
    address: 'Campus Zarrouk, Gafsa 2112',
    phone: '+216 83 788 061',
    email: 'contact@esip.tn',
    website: 'https://www.esip.tn',
    accreditation: 'EUR-ACE / ASIIN',
    notes: 'Seule école d\'ingénieurs privée du Sud-Ouest tunisien.',
    programs: [
      { name: 'Génie Informatique', accreditation_status: 'in_progress' },
    ],
  },
  {
    short_name: 'MIT POLYTECH',
    name: 'École Polytechnique Méditerranéenne Privée de Tunis',
    name_ar: 'المدرسة المتوسطية العليا الخاصة للتقنيات بتونس',
    city: 'Tunis',
    email: 'contact@mit-polytech.tn',
    website: 'https://mit-polytech.tn',
    accreditation: 'EUR-ACE / ASIIN',
    programs: [
      { name: 'Génie Informatique',             accreditation_status: 'in_progress' },
      { name: 'Génie Mécatronique',             accreditation_status: 'in_progress' },
      { name: 'Génie Industriel et Logistique', accreditation_status: 'in_progress' },
    ],
  },
  {
    short_name: 'ESSAT',
    name: 'École Supérieure des Sciences Appliquées et Technologie Privée de Gabès',
    name_ar: 'المدرسة العليا للعلوم التطبيقية والتكنولوجيا الخاصة بقابس',
    city: 'Gabès',
    address: 'Av. Abou El Kacem Chebbi, Gabès 6011',
    phone: '+216 81 707 331',
    email: 'contact@essat-gabes.com',
    website: 'https://www.essat-gabes.com',
    accreditation: 'EUR-ACE / ASIIN',
    programs: [
      { name: 'Génie Informatique', accreditation_status: 'in_progress' },
      { name: 'Génie Électrique',   accreditation_status: 'in_progress' },
    ],
  },
  {
    short_name: 'UPES',
    name: 'Faculté Privée des Sciences de Gestion et de la Technologie UPES Mégrine',
    name_ar: 'الكلية الخاصة لعلوم التصرف والتكنولوجيا بمورناق',
    city: 'Mégrine',
    address: '122 av. de la République, Mégrine 2033',
    phone: '+216 71 426 354',
    email: 'contact@upes-megrine.com',
    website: 'https://www.upes-megrine.com',
    accreditation: 'EUR-ACE / ASIIN',
    programs: [
      { name: 'Génie Informatique',               accreditation_status: 'in_progress' },
      { name: 'Systèmes et Réseaux Informatiques', accreditation_status: 'in_progress' },
      { name: 'Informatique Industrielle',         accreditation_status: 'in_progress' },
    ],
  },
];

// ── Candidats de test ─────────────────────────────────────────────────
const TEST_CANDIDATES = [
  { email: 'candidat1@test.tn', firstName: 'Ahmed',  lastName: 'Ben Ali',    sex: 'Homme' },
  { email: 'candidat2@test.tn', firstName: 'Fatma',  lastName: 'Trabelsi',   sex: 'Femme' },
  { email: 'candidat3@test.tn', firstName: 'Mohamed',lastName: 'Chaabane',   sex: 'Homme' },
];

// ── Fonction principale ───────────────────────────────────────────────
async function seed() {
  console.log('🌱 Démarrage du seed EduBridge...\n');

  // Synchronise la base (recrée toutes les tables)
  await sequelize.sync({ force: true });
  console.log('✅ Tables recréées.\n');

  // ── 1. Pays : Tunisie ──────────────────────────────────────────────
  const tunisie = await Country.create({ id: 1, name: 'Tunisie', code: '+216', phoneLength: 8 });
  console.log('✅ Pays Tunisie créé.');

  // ── 2. Admin ───────────────────────────────────────────────────────
  const adminPass = await bcrypt.hash('Admin123!', 10);
  await User.create({
    email:     'admin@edubridge.tn',
    password:  adminPass,
    role:      'admin',
    firstName: 'Admin',
    lastName:  'EduBridge',
    countryId: tunisie.id,
  });
  console.log('✅ Admin créé : admin@edubridge.tn / Admin123!\n');

  // ── 3. Écoles + programmes ─────────────────────────────────────────
  const createdInstitutes = [];
  const createdPrograms   = [];

  for (const data of INSTITUTES_DATA) {
    // Génère un mot de passe aléatoire pour l'utilisateur institute
    const rawPass = Math.random().toString(36).slice(-6).toUpperCase() + Math.random().toString(36).slice(-4) + '1!';
    const hashedPass = await bcrypt.hash(rawPass, 10);

    // Crée l'utilisateur institute
    const iUser = await User.create({
      email:     data.email,
      password:  hashedPass,
      role:      'institute',
      firstName: data.name,
      countryId: tunisie.id,
    });

    // Détermine le gouvernorat depuis la ville
    const gov = cityToGov[data.city] || null;

    // Crée l'établissement
    const inst = await Institute.create({
      name:          data.name,
      short_name:    data.short_name,
      name_ar:       data.name_ar   || null,
      email:         data.email,
      type:          'private',
      phone:         data.phone     || null,
      address:       data.address   || null,
      city:          data.city,
      governorate:   gov,
      founded_year:  data.founded_year || null,
      accreditation: data.accreditation || null,
      ranking:       data.ranking   || null,
      website:       data.website   || null,
      facebook_url:  data.facebook_url || null,
      description:   data.description || null,
      notes:         data.notes     || null,
      userId:        iUser.id,
      countryId:     tunisie.id,
    });

    // Lie l'user à l'institut
    await iUser.update({ instituteId: inst.id });

    console.log(`  ✅ ${data.short_name} (${data.city}) — User : ${data.email} / Mot de passe : ${rawPass}`);
    createdInstitutes.push(inst);

    // Crée les programmes
    for (const prog of data.programs) {
      const p = await Program.create({
        name:                    prog.name,
        level:                   'Ingénieur',
        duration_years:          5,
        language:                prog.language || 'Français',
        accreditation_valid_until: prog.accreditation_valid_until || null,
        accreditation_status:    prog.accreditation_status || 'accredited',
        instituteId:             inst.id,
      });
      createdPrograms.push(p);
    }
  }

  console.log(`\n✅ ${createdInstitutes.length} établissements et ${createdPrograms.length} programmes créés.\n`);

  // ── 4. Candidats de test ───────────────────────────────────────────
  const candidatePass = await bcrypt.hash('Test123!', 10);
  const createdCandidates = [];

  for (const cand of TEST_CANDIDATES) {
    const user = await User.create({
      email:     cand.email,
      password:  candidatePass,
      role:      'candidate',
      firstName: cand.firstName,
      lastName:  cand.lastName,
      sex:       cand.sex,
      countryId: tunisie.id,
    });
    createdCandidates.push({ user, ...cand });
    console.log(`  ✅ Candidat : ${cand.email} / Test123!`);
  }

  // ── 5. Candidatures de test ────────────────────────────────────────
  // Cible les programmes ESPRIT (index 5) et MedTech (index 0)
  const espritPrograms   = createdPrograms.filter(p => p.instituteId === createdInstitutes[5].id);
  const medtechPrograms  = createdPrograms.filter(p => p.instituteId === createdInstitutes[0].id);

  const targetPrograms = [
    espritPrograms[0]  || createdPrograms[0],
    medtechPrograms[0] || createdPrograms[1],
    espritPrograms[1]  || createdPrograms[2],
  ];

  for (let i = 0; i < createdCandidates.length; i++) {
    const cand    = createdCandidates[i];
    const prog    = targetPrograms[i % targetPrograms.length];
    const institute = createdInstitutes.find(inst => inst.id === prog.instituteId);

    await Application.create({
      // Workflow
      userId:      cand.user.id,
      programId:   prog.id,
      instituteId: institute.id,
      status:      'pending_admin',

      // Section inscription
      annee_universitaire: '2025/2026',
      niveau_demande:      '1ère année',
      mode_etudes:         'Présentiel',

      // Informations candidat
      firstName:           cand.firstName,
      lastName:            cand.lastName,
      sex:                 cand.sex,
      date_naissance:      '2000-01-15',
      lieu_naissance:      'Tunis',
      situation_familiale: 'Célibataire',
      nationalite:         'Tunisienne',
      email:               cand.email,
      telephone:           '+21620000001',

      // Pièce d'identité
      piece_identite_type:   'CIN',
      piece_identite_numero: `0123456${i}`,

      // Adresse
      adresse_pays_id:      1,
      adresse_gouvernorat:  'Tunis',
      adresse_ville:        'Tunis',
      adresse_rue:          `${i + 1} Rue de la République`,

      // Bac
      bac_pays_id:  1,
      bac_annee:    2018 + i,
      bac_section:  'Mathématiques',

      // Consentement
      consent_accepted: true,
    });

    console.log(`  ✅ Candidature créée : ${cand.email} → ${prog.name} (${institute.short_name})`);
  }

  console.log('\n🎉 Seed terminé avec succès !\n');
  console.log('────────────────────────────────────────────────────');
  console.log('Récapitulatif des comptes :');
  console.log('  Admin   : admin@edubridge.tn        / Admin123!');
  console.log('  Candidat: candidat1@test.tn         / Test123!');
  console.log('  Candidat: candidat2@test.tn         / Test123!');
  console.log('  Candidat: candidat3@test.tn         / Test123!');
  console.log('────────────────────────────────────────────────────\n');

  await sequelize.close();
}

seed().catch((err) => {
  console.error('❌ Erreur lors du seed :', err);
  process.exit(1);
});
