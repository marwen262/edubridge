// Données statiques UI (listes de référence, pas d'entités backend)

export const fields = [
  { name: 'Informatique',     count: 0 },
  { name: 'Génie Civil',      count: 0 },
  { name: 'Génie Électrique', count: 0 },
  { name: 'Génie Mécanique',  count: 0 },
  { name: 'Chimie',           count: 0 },
  { name: 'Agronomie',        count: 0 },
  { name: 'Finance',          count: 0 },
  { name: 'Management',       count: 0 },
];

export const countries = [
  'United States',
  'United Kingdom',
  'Canada',
  'Germany',
  'France',
  'Netherlands',
  'Australia',
  'Switzerland',
  'Sweden',
  'Italy',
];

// ===========================================================================
// Guide étudiants étrangers — Tunisie
// ===========================================================================

export interface StatGuide {
  valeur: string;
  label: string;
}

export interface EtapeVisa {
  numero: number;
  titre: string;
  description: string;
  delai: string;
  documents: string[];
}

export interface Bourse {
  id: string;
  nom: string;
  type: 'gouvernementale' | 'internationale' | 'institutionnelle';
  montant: string;
  eligibilite: string;
  deadline: string;
  description: string;
  lien: string;
}

export interface PosteBudget {
  poste: string;
  coutTND: string;
  coutEUR: string;
}

export interface Logement {
  type: 'cite' | 'residence_privee' | 'colocation';
  titre: string;
  prixMin: number;
  prixMax: number;
  avantages: string[];
  inconvenients: string[];
  conseil: string;
}

export interface BudgetMensuel {
  logementCite: number;
  logementPrive: number;
  restaurationU: number;
  courses: number;
  divers: number;
}

export interface EtapeAdmission {
  numero: number;
  titre: string;
  description: string;
  deadline: string;
  documents: string[];
  lien?: string;
}

export interface EquivalencePays {
  pays: string;
  drapeau: string;
  systeme: string;
  procedure: string;
  organismeContact: string;
  delai: string;
}

export interface ItemChecklist {
  id: string;
  categorie: 'identite' | 'academique' | 'financier' | 'sante' | 'logement';
  label: string;
  obligatoire: boolean;
  conseil?: string;
}

export interface Urgence {
  service: string;
  numero: string;
  disponibilite: string;
}

export interface ConseilSecurite {
  icone: string;
  titre: string;
  description: string;
}

export interface ThemeCulture {
  theme: string;
  introduction: string;
  conseils: string[];
}

export interface Contact {
  email: string;
  emailReponse: string;
  whatsapp: string;
  whatsappReponse: string;
  permanence: {
    jours: string;
    heures: string;
    lieu: string;
  };
  communaute: {
    plateforme: string;
    lien: string;
    description: string;
  };
}

export interface GuideData {
  stats: StatGuide[];
  etapesVisa: EtapeVisa[];
  bourses: Bourse[];
  budgetMensuel: BudgetMensuel;
  coutVie: PosteBudget[];
  logements: Logement[];
  etapesAdmission: EtapeAdmission[];
  equivalencePays: EquivalencePays[];
  checklist: ItemChecklist[];
  urgences: Urgence[];
  conseilsSecurite: ConseilSecurite[];
  culture: ThemeCulture[];
  contact: Contact;
}

export const guideData: GuideData = {
  stats: [
    { valeur: '15 000+', label: 'Étudiants étrangers accueillis chaque année' },
    { valeur: '180+',    label: 'Nationalités représentées sur les campus' },
    { valeur: '45+',     label: 'Accords bilatéraux et de coopération actifs' },
  ],

  etapesVisa: [
    {
      numero: 1,
      titre: 'Constitution du dossier (avant le départ)',
      description:
        'Réunissez tous les documents officiels exigés par l\'ambassade de Tunisie de votre pays de résidence. Faites traduire et légaliser ce qui doit l\'être.',
      delai: '1 à 2 semaines',
      documents: [
        'Passeport valide au moins 6 mois après la date d\'entrée',
        'Lettre d\'admission officielle de l\'établissement tunisien',
        'Justificatif de ressources financières (relevés bancaires, attestation de bourse)',
        '4 photos d\'identité récentes aux normes',
        'Formulaire de demande de visa rempli et signé',
        'Justificatif de logement provisoire en Tunisie',
        'Assurance maladie internationale couvrant le séjour',
      ],
    },
    {
      numero: 2,
      titre: 'Dépôt du dossier à l\'ambassade de Tunisie',
      description:
        'Prenez rendez-vous auprès de l\'ambassade ou du consulat le plus proche. Le dépôt se fait en personne. Conservez précieusement le récépissé.',
      delai: 'Le jour du rendez-vous',
      documents: [
        'Dossier complet (étape 1)',
        'Formulaire de demande visa long séjour étudiant (type D)',
        'Reçu de paiement des frais consulaires',
      ],
    },
    {
      numero: 3,
      titre: 'Obtention du visa long séjour (type D)',
      description:
        'L\'ambassade examine votre dossier et délivre, en cas de validation, un visa étudiant longue durée vous autorisant à entrer sur le territoire tunisien.',
      delai: '2 à 4 semaines',
      documents: [
        'Récépissé de dépôt',
        'Pièce d\'identité originale',
      ],
    },
    {
      numero: 4,
      titre: 'Arrivée en Tunisie et déclaration auprès des autorités',
      description:
        'Une fois sur place, vous devez vous présenter au poste de police ou à la garde nationale du lieu de résidence dans les 48 heures qui suivent votre entrée sur le territoire.',
      delai: 'Sous 48 heures après l\'arrivée',
      documents: [
        'Passeport tamponné à l\'entrée',
        'Visa étudiant en cours de validité',
        'Justificatif d\'adresse provisoire (réservation, attestation d\'hébergement)',
      ],
    },
    {
      numero: 5,
      titre: 'Demande de la carte de séjour étudiante',
      description:
        'Indispensable au-delà de 3 mois. Elle se demande à la direction régionale de la sûreté. Cette carte vous permet de circuler librement et d\'effectuer toutes les démarches administratives.',
      delai: '4 à 6 semaines',
      documents: [
        'Passeport et visa',
        'Lettre d\'admission de l\'institut',
        'Justificatif de domicile en Tunisie',
        '4 photos d\'identité',
        'Formulaire administratif local',
        'Timbre fiscal',
      ],
    },
  ],

  bourses: [
    {
      id: 'gov-tn',
      nom: 'Bourse du gouvernement tunisien',
      type: 'gouvernementale',
      montant: '180 - 250 TND/mois',
      eligibilite: 'Étudiants ressortissants des pays liés à la Tunisie par un accord de coopération bilatérale.',
      deadline: '2026-06-30',
      description:
        'Bourse historique de coopération couvrant frais de scolarité, hébergement en cité universitaire et allocation mensuelle.',
      lien: 'https://www.mesrs.tn',
    },
    {
      id: 'erasmus',
      nom: 'Erasmus+ — Mobilité internationale',
      type: 'internationale',
      montant: '700 - 850 €/mois',
      eligibilite: 'Étudiants inscrits dans une université européenne partenaire d\'un institut tunisien.',
      deadline: '2026-07-15',
      description:
        'Programme européen finançant la mobilité entrante vers la Tunisie pour des séjours d\'études d\'un semestre à un an.',
      lien: 'https://erasmus-plus.ec.europa.eu',
    },
    {
      id: 'oif',
      nom: 'Bourse de la Francophonie (OIF)',
      type: 'internationale',
      montant: '600 €/mois',
      eligibilite: 'Étudiants ressortissants des États membres de l\'OIF, niveau master ou doctorat.',
      deadline: '2026-09-30',
      description:
        'Programme de mobilité de l\'Organisation Internationale de la Francophonie pour soutenir la circulation des savoirs en espace francophone.',
      lien: 'https://www.francophonie.org',
    },
    {
      id: 'campus-france',
      nom: 'Campus France — Coopération franco-tunisienne',
      type: 'internationale',
      montant: '767 €/mois',
      eligibilite: 'Étudiants français en mobilité vers la Tunisie, tous niveaux.',
      deadline: '2026-08-31',
      description:
        'Programme bilatéral facilitant l\'accueil des étudiants français dans les établissements tunisiens partenaires.',
      lien: 'https://www.campusfrance.org',
    },
    {
      id: 'ua',
      nom: 'Bourse de l\'Union Africaine',
      type: 'internationale',
      montant: '500 USD/mois',
      eligibilite: 'Étudiants ressortissants d\'un État membre de l\'Union Africaine, hors Tunisie.',
      deadline: '2026-10-15',
      description:
        'Programme panafricain de l\'UA destiné à renforcer la mobilité estudiantine intra-continentale.',
      lien: 'https://au.int/en/scholarships',
    },
    {
      id: 'bid',
      nom: 'Banque Islamique de Développement (BID)',
      type: 'internationale',
      montant: 'Couverture complète',
      eligibilite: 'Étudiants des pays membres de l\'OCI, en filières scientifiques et technologiques.',
      deadline: '2026-07-31',
      description:
        'Bourse complète couvrant frais de scolarité, transport international, hébergement et allocation mensuelle.',
      lien: 'https://www.isdb.org/scholarships',
    },
    {
      id: 'maec-maroc',
      nom: 'Coopération MAEC Maroc-Tunisie',
      type: 'gouvernementale',
      montant: '200 TND/mois + scolarité',
      eligibilite: 'Étudiants marocains, dans le cadre de la réciprocité culturelle.',
      deadline: '2026-06-15',
      description:
        'Programme de réciprocité avec le Maroc accordant la gratuité des études et une allocation mensuelle.',
      lien: 'https://www.diplomatie.ma',
    },
    {
      id: 'edubridge',
      nom: 'Bourses EduBridge — Instituts partenaires',
      type: 'institutionnelle',
      montant: '30 - 100% des frais',
      eligibilite: 'Étudiants étrangers admis dans un institut partenaire EduBridge.',
      deadline: '2026-11-30',
      description:
        'Bourses au mérite financées par les instituts partenaires EduBridge et attribuées selon le dossier académique.',
      lien: 'mailto:support.international@edubridge.tn',
    },
  ],

  budgetMensuel: {
    logementCite: 150,
    logementPrive: 400,
    restaurationU: 80,
    courses: 150,
    divers: 100,
  },

  coutVie: [
    { poste: 'Repas au restaurant universitaire',           coutTND: '0,8 - 1,5 TND', coutEUR: '0,25 - 0,45 €' },
    { poste: 'Café en terrasse',                            coutTND: '2 - 4 TND',     coutEUR: '0,60 - 1,20 €' },
    { poste: 'Courses alimentaires (semaine, 1 personne)',  coutTND: '70 - 120 TND',  coutEUR: '21 - 36 €' },
    { poste: 'Loyer chambre en cité universitaire',         coutTND: '80 - 200 TND',  coutEUR: '24 - 60 €' },
    { poste: 'Studio meublé en ville',                      coutTND: '350 - 600 TND', coutEUR: '105 - 180 €' },
    { poste: 'Abonnement téléphone + données mobiles',      coutTND: '20 - 40 TND',   coutEUR: '6 - 12 €' },
    { poste: 'Coupe de cheveux',                            coutTND: '8 - 20 TND',    coutEUR: '2,40 - 6 €' },
    { poste: 'Place de cinéma',                             coutTND: '8 - 12 TND',    coutEUR: '2,40 - 3,60 €' },
  ],

  logements: [
    {
      type: 'cite',
      titre: 'Cité universitaire publique',
      prixMin: 80,
      prixMax: 200,
      avantages: [
        'Tarifs très accessibles, subventionnés par l\'État',
        'Proximité immédiate des campus',
        'Communauté étudiante internationale présente',
        'Restaurant universitaire à proximité',
      ],
      inconvenients: [
        'Capacité limitée — demande à déposer tôt',
        'Confort sommaire (chambre partagée, mobilier basique)',
        'Règlement intérieur strict (horaires, visites)',
      ],
      conseil:
        'Déposez votre demande dès l\'admission obtenue. Les places sont attribuées en priorité aux boursiers.',
    },
    {
      type: 'residence_privee',
      titre: 'Résidence étudiante privée',
      prixMin: 350,
      prixMax: 600,
      avantages: [
        'Standing élevé : studio meublé, internet, sécurité',
        'Services inclus (ménage, blanchisserie, salle de sport)',
        'Souplesse contractuelle (locations à la rentrée)',
      ],
      inconvenients: [
        'Coût significativement plus élevé qu\'en cité publique',
        'Caution importante à prévoir (souvent 2 mois)',
        'Disponibilité limitée dans les grandes villes',
      ],
      conseil:
        'Visitez systématiquement avant de signer et exigez un état des lieux écrit et signé à l\'entrée.',
    },
    {
      type: 'colocation',
      titre: 'Colocation en appartement',
      prixMin: 200,
      prixMax: 350,
      avantages: [
        'Bon compromis entre coût et confort',
        'Vie sociale stimulante',
        'Espace de vie plus large qu\'en chambre',
      ],
      inconvenients: [
        'Trouver des colocataires fiables prend du temps',
        'Conflits possibles sur les charges et le ménage',
        'Bail commun à négocier avec le propriétaire',
      ],
      conseil:
        'Préférez les colocations proposées par d\'autres étudiants déjà sur place via les groupes communautaires officiels.',
    },
  ],

  etapesAdmission: [
    {
      numero: 1,
      titre: 'Candidature en ligne',
      description:
        'Créez votre compte sur EduBridge ou sur le portail du ministère de l\'Enseignement supérieur. Sélectionnez les programmes qui correspondent à votre projet et constituez votre dossier.',
      deadline: '2026-05-31',
      documents: [
        'Compte EduBridge actif',
        'Choix de programmes argumenté',
        'Lettre de motivation par programme',
      ],
      lien: 'https://www.mesrs.tn',
    },
    {
      numero: 2,
      titre: 'Soumission et validation des documents',
      description:
        'Téléversez les pièces officielles demandées : diplômes, relevés de notes, pièce d\'identité. Les originaux peuvent être vérifiés à un stade ultérieur.',
      deadline: '2026-06-30',
      documents: [
        'Diplôme du baccalauréat ou équivalent',
        'Relevés de notes des trois dernières années',
        'Passeport en cours de validité',
        'Photo d\'identité au format officiel',
      ],
    },
    {
      numero: 3,
      titre: 'Test de niveau ou entretien',
      description:
        'Selon le programme, un test écrit, un entretien visioconférence ou une évaluation linguistique peuvent être organisés. Préparez-vous au format communiqué.',
      deadline: '2026-07-15',
      documents: [
        'Convocation officielle reçue par email',
        'Pièce d\'identité valide le jour J',
        'Justificatifs académiques originaux',
      ],
    },
    {
      numero: 4,
      titre: 'Lettre d\'admission officielle',
      description:
        'Vous recevez par email la lettre d\'admission signée par l\'institut. Ce document est indispensable pour la demande de visa et la carte de séjour.',
      deadline: '2026-08-15',
      documents: [
        'Lettre d\'admission imprimée',
        'Reçu de paiement des frais de réservation (si applicable)',
      ],
    },
    {
      numero: 5,
      titre: 'Inscription administrative sur place',
      description:
        'À votre arrivée en Tunisie, finalisez l\'inscription au sein de l\'institut. Vous recevrez votre carte d\'étudiant et l\'accès aux ressources pédagogiques.',
      deadline: '2026-09-30',
      documents: [
        'Lettre d\'admission originale',
        'Diplômes originaux à présenter',
        'Justificatif de paiement de la scolarité',
        'Carte de séjour ou récépissé',
      ],
    },
  ],

  equivalencePays: [
    {
      pays: 'France',
      drapeau: '🇫🇷',
      systeme:
        'Système LMD (Licence-Master-Doctorat). Le baccalauréat français est reconnu directement pour l\'accès à l\'enseignement supérieur tunisien.',
      procedure:
        'Dépôt du dossier au CNEQ avec diplômes originaux, relevés et traduction officielle si nécessaire. Procédure simplifiée pour les diplômes français.',
      organismeContact: 'CNEQ — Centre National pour l\'Évaluation des Qualifications',
      delai: '4 à 6 semaines',
    },
    {
      pays: 'Algérie',
      drapeau: '🇩🇿',
      systeme:
        'Système LMD aligné sur le modèle européen. Reconnaissance simplifiée dans le cadre de la coopération maghrébine.',
      procedure:
        'Dépôt direct au CNEQ avec apostille de La Haye ou légalisation consulaire. Diplômes scientifiques particulièrement bien reconnus.',
      organismeContact: 'CNEQ + Ambassade d\'Algérie à Tunis',
      delai: '4 à 8 semaines',
    },
    {
      pays: 'Maroc',
      drapeau: '🇲🇦',
      systeme:
        'Système LMD avec spécificités locales. Reconnaissance facilitée dans le cadre de l\'accord de réciprocité.',
      procedure:
        'Procédure CNEQ allégée. Présentation des diplômes traduits et légalisés. Étude au cas par cas pour les filières professionnelles.',
      organismeContact: 'CNEQ + Service culturel marocain',
      delai: '3 à 6 semaines',
    },
    {
      pays: 'Sénégal',
      drapeau: '🇸🇳',
      systeme:
        'Système LMD inspiré du modèle français. Le baccalauréat sénégalais est reconnu sans difficulté.',
      procedure:
        'Dossier CNEQ avec relevés détaillés et programme du diplôme. Apostille obligatoire pour les documents originaux.',
      organismeContact: 'CNEQ + Ambassade du Sénégal',
      delai: '6 à 10 semaines',
    },
    {
      pays: 'Cameroun',
      drapeau: '🇨🇲',
      systeme:
        'Double système anglophone et francophone selon la région. Reconnaissance étudiée selon la filière (BAC/GCE A-Level).',
      procedure:
        'CNEQ exige programme officiel et grille d\'évaluation détaillée. Traduction certifiée des relevés anglophones.',
      organismeContact: 'CNEQ + Ambassade du Cameroun',
      delai: '8 à 12 semaines',
    },
    {
      pays: 'Côte d\'Ivoire',
      drapeau: '🇨🇮',
      systeme:
        'Système LMD aligné sur le modèle français. Bonne reconnaissance des baccalauréats généraux et techniques.',
      procedure:
        'Dossier CNEQ standard avec apostille ou légalisation. Examen détaillé pour les diplômes techniques.',
      organismeContact: 'CNEQ + Ambassade de Côte d\'Ivoire',
      delai: '6 à 10 semaines',
    },
    {
      pays: 'Gabon',
      drapeau: '🇬🇦',
      systeme:
        'Système LMD conforme aux standards de la CEMAC. Le baccalauréat gabonais est admis directement.',
      procedure:
        'Procédure CNEQ classique avec légalisation consulaire. Pas de complication particulière pour les filières scientifiques.',
      organismeContact: 'CNEQ + Ambassade du Gabon',
      delai: '6 à 8 semaines',
    },
    {
      pays: 'Liban',
      drapeau: '🇱🇧',
      systeme:
        'Baccalauréat libanais (général ou technique) reconnu après évaluation. Programmes universitaires LMD.',
      procedure:
        'CNEQ avec traduction certifiée arabe-français. Évaluation matière par matière pour les diplômes universitaires.',
      organismeContact: 'CNEQ + Ambassade du Liban à Tunis',
      delai: '6 à 10 semaines',
    },
  ],

  checklist: [
    // Identité (5)
    { id: 'id-1', categorie: 'identite',   label: 'Passeport valide au moins 6 mois après l\'arrivée', obligatoire: true,  conseil: 'Faites une copie certifiée et conservez-la séparément.' },
    { id: 'id-2', categorie: 'identite',   label: 'Visa long séjour étudiant (type D)',                  obligatoire: true },
    { id: 'id-3', categorie: 'identite',   label: '8 photos d\'identité aux normes',                     obligatoire: true,  conseil: 'Prévoyez large : carte de séjour, inscriptions, dossiers administratifs en demanderont plusieurs.' },
    { id: 'id-4', categorie: 'identite',   label: 'Traductions légalisées des actes d\'état civil',      obligatoire: true },
    { id: 'id-5', categorie: 'identite',   label: 'Copies certifiées conformes de la pièce d\'identité', obligatoire: false, conseil: 'Demandez-les à la mairie ou au notaire avant le départ.' },

    // Académique (6)
    { id: 'ac-1', categorie: 'academique', label: 'Diplômes originaux (baccalauréat, licence, etc.)',    obligatoire: true,  conseil: 'Apostille ou légalisation consulaire indispensable.' },
    { id: 'ac-2', categorie: 'academique', label: 'Relevés de notes officiels',                          obligatoire: true },
    { id: 'ac-3', categorie: 'academique', label: 'Attestations de scolarité',                           obligatoire: true },
    { id: 'ac-4', categorie: 'academique', label: 'Lettre d\'admission de l\'institut tunisien',         obligatoire: true },
    { id: 'ac-5', categorie: 'academique', label: 'Programme détaillé des cours suivis',                 obligatoire: false, conseil: 'Utile pour les demandes d\'équivalence au CNEQ.' },
    { id: 'ac-6', categorie: 'academique', label: 'Lettres de recommandation',                           obligatoire: false },

    // Financier (4)
    { id: 'fi-1', categorie: 'financier',  label: 'Justificatif de ressources financières',              obligatoire: true,  conseil: 'Relevés bancaires des trois derniers mois ou attestation de prise en charge.' },
    { id: 'fi-2', categorie: 'financier',  label: 'Attestation de bourse (si applicable)',               obligatoire: false },
    { id: 'fi-3', categorie: 'financier',  label: 'Assurance maladie internationale',                    obligatoire: true,  conseil: 'Doit couvrir hospitalisation et rapatriement.' },
    { id: 'fi-4', categorie: 'financier',  label: 'Caution pour le logement (équivalent 2 mois)',        obligatoire: false },

    // Santé (3)
    { id: 'sa-1', categorie: 'sante',      label: 'Carnet de vaccinations à jour',                       obligatoire: true,  conseil: 'Vérifiez les recommandations OMS pour la Tunisie avant le départ.' },
    { id: 'sa-2', categorie: 'sante',      label: 'Ordonnances en cours et stock de médicaments',        obligatoire: false, conseil: 'Apportez l\'équivalent de 3 mois et la dénomination internationale.' },
    { id: 'sa-3', categorie: 'sante',      label: 'Carte de mutuelle ou attestation d\'assurance santé', obligatoire: true },

    // Logement (4)
    { id: 'lo-1', categorie: 'logement',   label: 'Contrat ou pré-réservation de logement',              obligatoire: true,  conseil: 'Indispensable pour la demande de visa et la déclaration aux autorités.' },
    { id: 'lo-2', categorie: 'logement',   label: 'Liste des contacts d\'urgence locaux',                obligatoire: true },
    { id: 'lo-3', categorie: 'logement',   label: 'Adresse provisoire écrite avec plan d\'accès',        obligatoire: false },
    { id: 'lo-4', categorie: 'logement',   label: 'Guide pratique de la ville d\'accueil',               obligatoire: false, conseil: 'Téléchargez les cartes hors ligne avant l\'arrivée.' },
  ],

  urgences: [
    { service: 'SAMU (urgences médicales)',         numero: '190',             disponibilite: '24h/24, 7j/7' },
    { service: 'Police secours',                    numero: '197',             disponibilite: '24h/24, 7j/7' },
    { service: 'Protection civile (pompiers)',      numero: '198',             disponibilite: '24h/24, 7j/7' },
    { service: 'Numéro vert étudiant étranger',     numero: '80 100 200',      disponibilite: 'Lun-Ven, 8h-20h' },
    { service: 'Permanence consulaire (à compléter selon votre pays)', numero: '+216 XX XXX XXX', disponibilite: 'Selon ambassade' },
    { service: 'Support EduBridge international',   numero: '+216 70 000 000', disponibilite: 'Lun-Ven, 9h-17h' },
  ],

  conseilsSecurite: [
    {
      icone: 'Shield',
      titre: 'Numérisez tous vos documents',
      description:
        'Scannez passeport, visa, diplômes, contrat de logement. Stockez les copies dans un cloud sécurisé accessible depuis n\'importe où.',
    },
    {
      icone: 'Smartphone',
      titre: 'Partagez votre géolocalisation',
      description:
        'Activez le partage de position avec un proche de confiance. Une simple application permet d\'être rassuré au quotidien sans être intrusif.',
    },
    {
      icone: 'CreditCard',
      titre: 'Protégez vos informations bancaires',
      description:
        'Ne communiquez jamais code PIN, identifiants ni copie de carte. Votre banque ne vous demandera jamais ces informations par téléphone ou message.',
    },
    {
      icone: 'MapPin',
      titre: 'Connaissez les zones et horaires sûrs',
      description:
        'Renseignez-vous auprès des étudiants déjà sur place. Évitez les zones isolées la nuit et privilégiez les transports officiels.',
    },
    {
      icone: 'Phone',
      titre: 'Sauvegardez les numéros d\'urgence hors ligne',
      description:
        'Notez 190, 197, 198, votre ambassade et un proche de confiance dans le répertoire physique de votre téléphone et sur papier.',
    },
    {
      icone: 'Heart',
      titre: 'Souscrivez une assurance rapatriement',
      description:
        'Avant le départ, assurez-vous que votre couverture inclut hospitalisation, rapatriement sanitaire et responsabilité civile.',
    },
    {
      icone: 'AlertTriangle',
      titre: 'Signalez tout incident',
      description:
        'En cas de problème (vol, agression, fraude), déposez plainte au commissariat ET informez votre ambassade. Conservez le récépissé.',
    },
    {
      icone: 'Stethoscope',
      titre: 'Faites un bilan de santé avant le départ',
      description:
        'Visite médicale, dentiste, vaccinations à jour. Un imprévu de santé est plus simple à gérer chez soi qu\'à l\'étranger les premières semaines.',
    },
  ],

  culture: [
    {
      theme: 'Langues parlées au quotidien',
      introduction:
        'La Tunisie est officiellement arabophone, mais le français est largement utilisé dans l\'enseignement supérieur, les administrations et la vie urbaine. La darija (arabe tunisien) est la langue de la rue.',
      conseils: [
        'Vous pouvez suivre vos études en français sans difficulté majeure',
        'Apprenez quelques mots de darija pour les courses et les transports — l\'effort est immédiatement valorisé',
        'L\'anglais progresse rapidement chez les jeunes générations',
        'Des cours d\'arabe gratuits sont parfois proposés par les instituts ou centres culturels',
      ],
    },
    {
      theme: 'Coutumes et hospitalité tunisienne',
      introduction:
        'L\'hospitalité est une valeur centrale en Tunisie. Vous serez probablement invité chez des camarades ou voisins dès les premières semaines.',
      conseils: [
        'Acceptez le café ou le thé proposé : c\'est un geste d\'accueil important',
        'Apportez une petite attention (pâtisseries, fruits) lorsque vous êtes invité chez quelqu\'un',
        'Saluez les personnes âgées en premier, c\'est une marque de respect appréciée',
        'Les conversations sont chaleureuses et peuvent prendre du temps — c\'est normal et apprécié',
      ],
    },
    {
      theme: 'Ramadan et fêtes religieuses',
      introduction:
        'Le mois de Ramadan transforme le rythme de la vie quotidienne. Restaurants, transports et horaires administratifs s\'adaptent.',
      conseils: [
        'Vous n\'êtes pas tenu de jeûner — votre choix est respecté',
        'Évitez par discrétion de manger ou fumer dans la rue durant la journée',
        'Beaucoup de restaurants restent ouverts, particulièrement dans les quartiers étudiants',
        'L\'Aïd est une fête familiale joyeuse : si vous êtes invité, c\'est un beau privilège',
      ],
    },
    {
      theme: 'Alimentation et restauration',
      introduction:
        'La gastronomie tunisienne est riche, méditerranéenne et accessible. Le restaurant universitaire propose des repas équilibrés à très bas prix.',
      conseils: [
        'Le restaurant universitaire (Resto U) sert des repas complets pour 0,80 à 1,50 TND',
        'La majorité des produits vendus est halal par défaut',
        'Goûtez les spécialités locales : couscous, brik, lablabi, makroudh',
        'Les marchés (souks) offrent fruits, légumes et épices à prix très avantageux',
      ],
    },
    {
      theme: 'Code vestimentaire',
      introduction:
        'La Tunisie est l\'un des pays les plus ouverts en matière vestimentaire dans la région. Aucune obligation particulière dans la vie quotidienne ou universitaire.',
      conseils: [
        'À l\'université : tenue décontractée comme partout ailleurs',
        'En centre-ville et dans les zones touristiques : aucune restriction',
        'Sur les plages et dans les hôtels balnéaires : maillot autorisé',
        'Dans les quartiers très traditionnels ou lieux de culte : tenue plus couvrante par respect',
      ],
    },
    {
      theme: 'Fêtes nationales et calendrier académique',
      introduction:
        'Le calendrier tunisien combine fêtes nationales et religieuses. Plusieurs jours fériés sont à connaître pour planifier vos déplacements.',
      conseils: [
        '14 janvier — Fête de la Révolution (jour férié)',
        '20 mars — Fête de l\'Indépendance',
        '9 avril — Fête des Martyrs',
        '25 juillet — Fête de la République',
        'Aïd el-Fitr et Aïd el-Adha — dates variables, plusieurs jours fériés',
        'Les universités publient un calendrier officiel chaque année — consultez-le tôt',
      ],
    },
  ],

  contact: {
    email: 'support.international@edubridge.tn',
    emailReponse: 'Réponse sous 24h ouvrées',
    whatsapp: '+216 70 000 000',
    whatsappReponse: 'Réponse en moins de 2h aux heures ouvrables',
    permanence: {
      jours: 'Du lundi au vendredi',
      heures: '9h00 à 17h00',
      lieu: 'Campus EduBridge — Tunis Centre',
    },
    communaute: {
      plateforme: 'Telegram — Étudiants étrangers en Tunisie',
      lien: 'https://t.me/edubridge-international',
      description:
        'Plus de 3 000 étudiants étrangers échangent quotidiennement conseils, bons plans et entraide.',
    },
  },
};
