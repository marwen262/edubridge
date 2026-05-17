// services/chatbotService.js — Moteur de réponses chatbot EduBridge V3 (bilingue FR/EN)

const INTENTS = [
  // ─── CATÉGORIE 1 — Candidature & Dossier ─────────────────────────────────

  {
    id: 'apply_how',
    keywords: ['comment', 'candidater', 'postuler', 'soumettre', 'étapes', 'candidature', 'apply', 'faire', 'étape', 'procédure', 'démarche', 'begin', 'how', 'débuter', 'start'],
    response: {
      text: "Pour candidater sur EduBridge, suivez ces étapes :\n1. Créez un compte candidat ou connectez-vous\n2. Recherchez un programme via la barre de recherche\n3. Cliquez sur « Candidater » sur la page du programme\n4. Remplissez le dossier multi-étapes (informations, documents, lettre de motivation)\n5. Soumettez — votre dossier passe en statut « Soumise »\n\nL'institut examinera ensuite votre candidature et vous serez notifié à chaque changement de statut.",
      suggestions: ["Documents requis", "Suivre ma candidature", "Trouver un programme"],
      link: { label: "Parcourir les programmes", path: "/search" }
    },
    response_en: {
      text: "To apply on EduBridge, follow these steps:\n1. Create a candidate account or log in\n2. Search for a program using the search bar\n3. Click \"Apply\" on the program page\n4. Fill in the multi-step application form (personal info, documents, cover letter)\n5. Submit — your application moves to \"Submitted\" status\n\nThe institute will review your application and you'll be notified at each status change.",
      suggestions: ["Required documents", "Track my application", "Find a program"],
      link: { label: "Browse programs", path: "/search" }
    }
  },
  {
    id: 'apply_start',
    keywords: ['commencer', 'créer', 'nouveau', 'brouillon', 'démarrer', 'ouvrir', 'dossier', 'débuter', 'initier', 'créez', 'start', 'begin', 'new'],
    response: {
      text: "Pour commencer un dossier de candidature :\n1. Connectez-vous à votre espace candidat\n2. Trouvez le programme souhaité via la recherche ou les favoris\n3. Sur la page du programme, cliquez sur « Candidater »\n4. Un formulaire multi-étapes s'ouvre — sauvegardez en brouillon à tout moment\n5. Complétez et soumettez quand vous êtes prêt\n\nVotre brouillon est accessible depuis votre tableau de bord dans « Mes candidatures ».",
      suggestions: ["Comment candidater ?", "Documents requis", "Mon tableau de bord"],
      link: { label: "Mon tableau de bord", path: "/dashboard/candidate" }
    },
    response_en: {
      text: "To start an application file:\n1. Log in to your candidate space\n2. Find the desired program via search or favorites\n3. On the program page, click \"Apply\"\n4. A multi-step form opens — save as draft at any time\n5. Complete and submit when you're ready\n\nYour draft is accessible from your dashboard under \"My Applications\".",
      suggestions: ["How do I apply?", "Required documents", "My dashboard"],
      link: { label: "My dashboard", path: "/dashboard/candidate" }
    }
  },
  {
    id: 'apply_status',
    keywords: ['statut', 'état', 'brouillon', 'soumise', 'examen', 'status', 'avancement', 'progression', 'situation', 'phase'],
    response: {
      text: "Votre candidature peut avoir les statuts suivants :\n• Brouillon — dossier sauvegardé, pas encore soumis\n• Soumise — dossier envoyé à l'institut\n• En examen — l'institut étudie votre dossier\n• Acceptée — félicitations ! Vous êtes admis\n• Refusée — votre candidature n'a pas été retenue\n• Liste d'attente — en attente d'une place disponible\n\nConsultez votre tableau de bord pour voir le statut en temps réel.",
      suggestions: ["Suivre ma candidature", "Accepté — que faire ?", "Refus — alternatives ?"],
      link: { label: "Mes candidatures", path: "/dashboard/candidatures" }
    },
    response_en: {
      text: "Your application can have the following statuses:\n• Draft — saved but not yet submitted\n• Submitted — application sent to the institute\n• Under review — the institute is reviewing your file\n• Accepted — congratulations! You are admitted\n• Rejected — your application was not retained\n• Waiting list — waiting for an available spot\n\nCheck your dashboard to see the real-time status.",
      suggestions: ["Track my application", "Accepted — what next?", "Rejection — alternatives?"],
      link: { label: "My applications", path: "/dashboard/candidatures" }
    }
  },
  {
    id: 'apply_tracking',
    keywords: ['suivre', 'suivi', 'tracker', 'avancement', 'progression', 'track', 'historique', 'vérifier', 'consulter', 'voir'],
    response: {
      text: "Pour suivre l'avancement de vos candidatures :\n• Rendez-vous sur votre tableau de bord candidat\n• Section « Mes candidatures » — vue kanban de tous vos dossiers\n• Chaque carte affiche le statut actuel et la date de dernière mise à jour\n• Vous recevez automatiquement une notification à chaque changement de statut\n\nVérifiez vos notifications (icône cloche en haut à droite) pour les alertes en temps réel.",
      suggestions: ["Statuts de candidature", "Mes notifications", "Mon tableau de bord"],
      link: { label: "Mes candidatures", path: "/dashboard/candidatures" }
    },
    response_en: {
      text: "To track your applications:\n• Go to your candidate dashboard\n• \"My Applications\" section — kanban view of all your files\n• Each card shows the current status and last update date\n• You automatically receive a notification at each status change\n\nCheck your notifications (bell icon top right) for real-time alerts.",
      suggestions: ["Application statuses", "My notifications", "My dashboard"],
      link: { label: "My applications", path: "/dashboard/candidatures" }
    }
  },
  {
    id: 'apply_deadline',
    keywords: ['date', 'limite', 'délai', 'échéance', 'quand', 'expiration', 'deadline', 'calendrier', 'fermeture', 'clôture'],
    response: {
      text: "Les dates limites de candidature sont propres à chaque programme. Pour les connaître :\n• Consultez la page détail du programme (rubrique « Dates importantes »)\n• Renseignez-vous directement auprès de l'institut via ses coordonnées\n• Certains programmes sont en admission permanente, d'autres ont des sessions spécifiques\n\nNous vous conseillons de postuler au moins 4 à 6 semaines avant la rentrée visée.",
      suggestions: ["Trouver un programme", "Comment candidater ?", "Contacter l'institut"],
      link: { label: "Rechercher des programmes", path: "/search" }
    },
    response_en: {
      text: "Application deadlines are specific to each program. To find them:\n• Check the program detail page (\"Important dates\" section)\n• Contact the institute directly via their contact details\n• Some programs have rolling admissions, others have specific sessions\n\nWe recommend applying at least 4 to 6 weeks before your target start date.",
      suggestions: ["Find a program", "How do I apply?", "Contact the institute"],
      link: { label: "Search programs", path: "/search" }
    }
  },
  {
    id: 'apply_cancel',
    keywords: ['annuler', 'retirer', 'supprimer', 'abandonner', 'cancel', 'enlever', 'effacer', 'renoncer', 'désistement'],
    response: {
      text: "Pour annuler ou retirer une candidature :\n• Un brouillon peut être supprimé depuis votre tableau de bord\n• Une candidature soumise ou en examen — contactez l'institut pour signaler votre désistement\n• Les candidatures terminales (Acceptée / Refusée) ne sont plus modifiables\n\nAgissez rapidement pour libérer la place pour d'autres candidats.",
      suggestions: ["Statuts de candidature", "Mes candidatures"],
      link: { label: "Mes candidatures", path: "/dashboard/candidatures" }
    },
    response_en: {
      text: "To cancel or withdraw an application:\n• A draft can be deleted from your dashboard\n• A submitted or under-review application — contact the institute to notify your withdrawal\n• Terminal applications (Accepted / Rejected) can no longer be modified\n\nAct quickly to free up the spot for other candidates.",
      suggestions: ["Application statuses", "My applications"],
      link: { label: "My applications", path: "/dashboard/candidatures" }
    }
  },
  {
    id: 'apply_duplicate',
    keywords: ['deux', 'plusieurs', 'multiple', 'doublon', 'max', 'limite', 'combien', 'fois', 'programmes', 'simultané'],
    response: {
      text: "Sur EduBridge, vous pouvez candidater à plusieurs programmes différents simultanément, sans limite de nombre.\n\nCependant : vous ne pouvez candidater qu'une seule fois au même programme. Si votre candidature est refusée, vous ne pouvez pas re-postuler immédiatement.\n\nNous vous conseillons de candidater à 3 à 5 programmes pour maximiser vos chances.",
      suggestions: ["Comment candidater ?", "Comparer des programmes"],
      link: { label: "Parcourir les programmes", path: "/search" }
    },
    response_en: {
      text: "On EduBridge, you can apply to multiple different programs simultaneously, with no limit.\n\nHowever: you can only apply once to the same program. If your application is rejected, you cannot immediately reapply to that program.\n\nWe recommend applying to 3 to 5 programs to maximize your chances.",
      suggestions: ["How do I apply?", "Compare programs"],
      link: { label: "Browse programs", path: "/search" }
    }
  },
  {
    id: 'apply_result',
    keywords: ['accepté', 'refusé', 'résultat', 'verdict', 'décision', 'liste', 'attente', 'admis', 'rejeté', 'outcome', 'accepted', 'rejected'],
    response: {
      text: "Lorsque votre candidature est traitée, vous recevez une notification :\n\n• Acceptée — Complétez le formulaire de pré-inscription depuis votre tableau de bord\n• Liste d'attente — Restez disponible, une place peut se libérer\n• Refusée — Analysez les retours et postulez à d'autres programmes\n\nEn cas d'acceptation, vous avez généralement 2 semaines pour confirmer votre place.",
      suggestions: ["Pré-inscription après acceptation", "Chercher d'autres programmes"],
      link: { label: "Mes candidatures", path: "/dashboard/candidatures" }
    },
    response_en: {
      text: "When your application is processed, you receive a notification:\n\n• Accepted — Complete the pre-enrollment form from your dashboard\n• Waiting list — Stay available, a spot may open up\n• Rejected — Review feedback and apply to other programs\n\nIf accepted, you generally have 2 weeks to confirm your spot.",
      suggestions: ["Pre-enrollment after acceptance", "Find other programs"],
      link: { label: "My applications", path: "/dashboard/candidatures" }
    }
  },

  // ─── CATÉGORIE 2 — Documents & Upload ────────────────────────────────────

  {
    id: 'docs_required',
    keywords: ['documents', 'requis', 'pièces', 'dossier', 'complet', 'fournir', 'obligatoires', 'nécessaires', 'besoin', 'préparer', 'liste', 'required', 'docs'],
    response: {
      text: "Les documents généralement requis pour une candidature :\n• Diplôme le plus récent (Baccalauréat ou licence)\n• Relevés de notes des 2-3 dernières années\n• Pièce d'identité (CIN ou passeport)\n• Photo d'identité récente\n• Lettre de motivation\n• CV académique\n\nLes documents exacts varient selon le programme — vérifiez la page détail du programme.",
      suggestions: ["Uploader mes documents", "Vérification diplôme", "Document manquant"],
      link: { label: "Mes documents", path: "/dashboard/documents" }
    },
    response_en: {
      text: "Documents generally required for an application:\n• Most recent diploma (Baccalaureate or bachelor's degree)\n• Transcripts from the last 2-3 years\n• ID (Tunisian CIN or passport)\n• Recent ID photo\n• Cover letter\n• Academic CV\n\nExact documents vary by program — check the program detail page.",
      suggestions: ["Upload my documents", "Diploma verification", "Missing document"],
      link: { label: "My documents", path: "/dashboard/documents" }
    }
  },
  {
    id: 'docs_diploma',
    keywords: ['diplôme', 'baccalauréat', 'bac', 'attestation', 'certificat', 'licence', 'master', 'titre', 'diploma', 'degree'],
    response: {
      text: "Pour le diplôme à soumettre :\n• Format accepté : PDF ou JPEG/PNG (scan haute qualité)\n• Taille maximale : 5 Mo par fichier\n• Le document doit être lisible et non tronqué\n• Les diplômes étrangers peuvent nécessiter une traduction certifiée\n\nEduBridge intègre un Diploma Verifier automatique qui évalue l'authenticité du document.",
      suggestions: ["Vérification diplôme", "Uploader un document", "Documents requis"],
      link: { label: "Mes documents", path: "/dashboard/documents" }
    },
    response_en: {
      text: "For the diploma to submit:\n• Accepted format: PDF or JPEG/PNG (high quality scan)\n• Maximum size: 5 MB per file\n• The document must be legible and not cropped\n• Foreign diplomas may require a certified translation\n\nEduBridge includes an automatic Diploma Verifier that assesses document authenticity.",
      suggestions: ["Diploma verification", "Upload a document", "Required documents"],
      link: { label: "My documents", path: "/dashboard/documents" }
    }
  },
  {
    id: 'docs_upload',
    keywords: ['uploader', 'envoyer', 'fichier', 'format', 'taille', 'pdf', 'jpeg', 'upload', 'télécharger', 'joindre', 'importer', 'numériser'],
    response: {
      text: "Pour uploader vos documents sur EduBridge :\n• Formats acceptés : PDF, JPEG, PNG, JPG\n• Taille maximale : 5 Mo par fichier\n• Depuis le formulaire de candidature, étape « Documents »\n• Ou depuis « Mes documents » dans le tableau de bord\n\nAstuce : Scannez en noir et blanc à 200-300 DPI pour un fichier léger et lisible.",
      suggestions: ["Documents requis", "Vérification diplôme"],
      link: { label: "Mes documents", path: "/dashboard/documents" }
    },
    response_en: {
      text: "To upload your documents on EduBridge:\n• Accepted formats: PDF, JPEG, PNG, JPG\n• Maximum size: 5 MB per file\n• From the application form, step \"Documents\"\n• Or from \"My Documents\" in the dashboard\n\nTip: Scan in black and white at 200-300 DPI for a light and readable file.",
      suggestions: ["Required documents", "Diploma verification"],
      link: { label: "My documents", path: "/dashboard/documents" }
    }
  },
  {
    id: 'docs_verification',
    keywords: ['vérification', 'authentique', 'validé', 'verifier', 'authentification', 'vérifier', 'analyse', 'fraude', 'diploma', 'scanner'],
    response: {
      text: "EduBridge intègre un Diploma Verifier automatique :\n• Votre diplôme est analysé à la soumission de la candidature\n• Le service vérifie : champs critiques (nom, date, institution), signatures, tampons\n• Un score d'authenticité est calculé (0 à 100)\n• Score < 50 : avertissement transmis à l'institut\n\nCe système aide les instituts à traiter les dossiers en confiance. Il n'est pas bloquant.",
      suggestions: ["Uploader un diplôme", "Documents requis"],
      link: null
    },
    response_en: {
      text: "EduBridge includes an automatic Diploma Verifier:\n• Your diploma is analyzed when the application is submitted\n• The service checks: critical fields (name, date, institution), signatures, stamps\n• An authenticity score is calculated (0 to 100)\n• Score < 50: warning sent to the institute\n\nThis system helps institutes process files confidently. It is not blocking.",
      suggestions: ["Upload a diploma", "Required documents"],
      link: null
    }
  },
  {
    id: 'docs_missing',
    keywords: ['manquant', 'incomplet', 'rejeté', 'oublié', 'missing', 'absent', 'manque', 'oubli', 'complément'],
    response: {
      text: "Si un document est signalé manquant :\n• Votre candidature reste en « Brouillon » tant que le dossier est incomplet\n• Rendez-vous dans « Mes documents » pour ajouter les fichiers manquants\n• Contactez l'institut si votre dossier est déjà soumis\n\nUn dossier incomplet au moment de la soumission sera bloqué automatiquement.",
      suggestions: ["Documents requis", "Uploader un document"],
      link: { label: "Mes documents", path: "/dashboard/documents" }
    },
    response_en: {
      text: "If a document is flagged as missing:\n• Your application stays in \"Draft\" while the file is incomplete\n• Go to \"My Documents\" to add the missing files\n• Contact the institute if your application is already submitted\n\nAn incomplete file at submission will be automatically blocked.",
      suggestions: ["Required documents", "Upload a document"],
      link: { label: "My documents", path: "/dashboard/documents" }
    }
  },

  // ─── CATÉGORIE 3 — Programmes & Recherche ────────────────────────────────

  {
    id: 'programs_find',
    keywords: ['trouver', 'chercher', 'programme', 'formation', 'filière', 'search', 'recherche', 'parcourir', 'explorer', 'find', 'découvrir'],
    response: {
      text: "Pour trouver le programme idéal sur EduBridge :\n• Utilisez la barre de recherche sur la page d'accueil ou la page Recherche\n• Filtrez par domaine, niveau et mode (présentiel, alternance, soir)\n• Consultez les fiches détail pour voir le curriculum, les frais et les accréditations\n• Ajoutez à vos favoris les programmes qui vous intéressent\n\nEduBridge référence des dizaines de programmes dans 20 instituts tunisiens.",
      suggestions: ["Filtrer les programmes", "Comparer des programmes", "Mes favoris"],
      link: { label: "Rechercher des programmes", path: "/search" }
    },
    response_en: {
      text: "To find the ideal program on EduBridge:\n• Use the search bar on the home page or the Search page\n• Filter by field, level and mode (in-person, work-study, evening)\n• Check detail pages for curriculum, fees and accreditations\n• Add programs you like to your favorites\n\nEduBridge lists dozens of programs across 20 Tunisian institutes.",
      suggestions: ["Filter programs", "Compare programs", "My favorites"],
      link: { label: "Search programs", path: "/search" }
    }
  },
  {
    id: 'programs_engineering',
    keywords: ['ingénieur', 'informatique', 'génie', 'mécanique', 'électrique', 'engineering', 'tech', 'civil', 'industriel', 'télécoms', 'cycle', 'aéronautique', 'pétrolier', 'biomédical'],
    response: {
      text: "EduBridge référence de nombreuses formations d'ingénierie. Parmi les programmes disponibles :\n\n• Génie Informatique (ESPRIT, MedTech, IPSAS, Iteam, SESAME…)\n• Computer Engineering (MedTech — entièrement anglophone)\n• Génie Civil (ESPRIT, EPSousse, IPSAS, EPI…)\n• Génie Électrique / Électromécanique (ESPRIT, ULT, EPSousse…)\n• Télécommunications (ESPRIT, EPSousse)\n• Génie Aéronautique (ESAT — unique en Tunisie)\n• Génie Pétrolier (IPSAS Sfax — unique dans le privé)\n• Biomedical Engineering (MedTech)",
      suggestions: ["Filtrer par domaine", "Accréditations ABET CTI", "Comparer des programmes"],
      link: { label: "Rechercher des programmes", path: "/search" }
    },
    response_en: {
      text: "EduBridge lists many engineering programs. Available programs include:\n\n• Computer Engineering (ESPRIT, MedTech, IPSAS, Iteam, SESAME…)\n• Computer Engineering in English (MedTech — fully English)\n• Civil Engineering (ESPRIT, EPSousse, IPSAS, EPI…)\n• Electrical / Electromechanical Engineering (ESPRIT, ULT, EPSousse…)\n• Telecommunications (ESPRIT, EPSousse)\n• Aeronautical Engineering (ESAT — unique in Tunisia)\n• Petroleum Engineering (IPSAS Sfax — unique in private sector)\n• Biomedical Engineering (MedTech)",
      suggestions: ["Filter by field", "ABET CTI accreditations", "Compare programs"],
      link: { label: "Search programs", path: "/search" }
    }
  },
  {
    id: 'programs_compare',
    keywords: ['comparer', 'comparaison', 'différence', 'versus', 'choisir', 'compare', 'meilleur', 'lequel', 'entre', 'côte'],
    response: {
      text: "EduBridge propose un outil de comparaison de programmes :\n• Cliquez sur « Comparer » sur une fiche programme\n• Comparez jusqu'à 3 programmes simultanément\n• La vue compare : durée, frais, accréditations, mode, langue, prérequis\n\nCela vous aide à faire un choix éclairé avant de candidater.",
      suggestions: ["Trouver des programmes", "Accréditations", "Candidater"],
      link: { label: "Comparer des programmes", path: "/compare" }
    },
    response_en: {
      text: "EduBridge offers a program comparison tool:\n• Click \"Compare\" on a program page\n• Compare up to 3 programs simultaneously\n• The view compares: duration, fees, accreditations, mode, language, prerequisites\n\nThis helps you make an informed choice before applying.",
      suggestions: ["Find programs", "Accreditations", "Apply"],
      link: { label: "Compare programs", path: "/compare" }
    }
  },
  {
    id: 'programs_filter',
    keywords: ['filtrer', 'domaine', 'niveau', 'mode', 'alternance', 'soir', 'filter', 'trier', 'critères', 'type', 'spécialité'],
    response: {
      text: "Les filtres disponibles sur EduBridge :\n• Domaine : Informatique, Génie civil, Génie électrique, Mécanique, Finance, Management…\n• Niveau : Cycle préparatoire, Licence (Bac+3), Master (Bac+5), Ingénieur (Bac+5)\n• Mode : Cours du jour, Cours du soir, Alternance, Formation continue\n• Accréditations : ABET, CTI, EUR-ACE, AACSB, HCERES…\n\nCombinez plusieurs filtres pour des résultats précis.",
      suggestions: ["Trouver des programmes", "Comparer des programmes"],
      link: { label: "Rechercher des programmes", path: "/search" }
    },
    response_en: {
      text: "Available filters on EduBridge:\n• Field: Computer Science, Civil Engineering, Electrical Engineering, Mechanics, Finance, Management…\n• Level: Preparatory cycle, Bachelor (Bac+3), Master (Bac+5), Engineer (Bac+5)\n• Mode: Day classes, Evening classes, Work-study, Continuing education\n• Accreditations: ABET, CTI, EUR-ACE, AACSB, HCERES…\n\nCombine multiple filters for precise results.",
      suggestions: ["Find programs", "Compare programs"],
      link: { label: "Search programs", path: "/search" }
    }
  },
  {
    id: 'programs_favorites',
    keywords: ['favoris', 'sauvegarder', 'enregistrer', 'bookmark', 'heart', 'coeur', 'liste', 'garder', 'retrouver', 'épingler'],
    response: {
      text: "La fonctionnalité Favoris vous permet de sauvegarder les programmes qui vous intéressent :\n• Cliquez sur l'icône cœur sur une fiche programme\n• Retrouvez tous vos favoris dans « Mes favoris » sur votre tableau de bord\n• Supprimez un favori en recliquant sur l'icône\n\nLes favoris sont synchronisés en temps réel après connexion.",
      suggestions: ["Trouver des programmes", "Mon tableau de bord"],
      link: { label: "Mes favoris", path: "/dashboard/favoris" }
    },
    response_en: {
      text: "The Favorites feature lets you save programs you're interested in:\n• Click the heart icon on a program card\n• Find all your favorites in \"My Favorites\" on your dashboard\n• Remove a favorite by clicking the icon again\n\nFavorites are synced in real time after login.",
      suggestions: ["Find programs", "My dashboard"],
      link: { label: "My favorites", path: "/dashboard/favoris" }
    }
  },
  {
    id: 'programs_detail',
    keywords: ['détail', 'curriculum', 'matières', 'contenu', 'plan', 'syllabus', 'cours', 'modules', 'description', 'fiche'],
    response: {
      text: "Chaque programme sur EduBridge dispose d'une page détail complète :\n• Description générale et objectifs pédagogiques\n• Curriculum : matières et modules par semestre\n• Durée et rythme de la formation\n• Frais de scolarité annuels\n• Accréditations obtenues\n• Prérequis d'admission\n• Contacts et informations de l'institut",
      suggestions: ["Trouver des programmes", "Comparer des programmes"],
      link: { label: "Rechercher des programmes", path: "/search" }
    },
    response_en: {
      text: "Each program on EduBridge has a complete detail page:\n• General description and educational objectives\n• Curriculum: subjects and modules per semester\n• Duration and pace of the program\n• Annual tuition fees\n• Obtained accreditations\n• Admission prerequisites\n• Institute contacts and information",
      suggestions: ["Find programs", "Compare programs"],
      link: { label: "Search programs", path: "/search" }
    }
  },

  // ─── CATÉGORIE 4 — Instituts & Accréditations ────────────────────────────

  {
    id: 'institutes_list',
    keywords: ['liste', 'écoles', 'instituts', 'université', 'établissements', 'toutes', 'tous', 'all', 'institutions', 'parcourir', 'répertoire'],
    response: {
      text: "EduBridge répertorie 20 instituts d'enseignement supérieur privés tunisiens. Parmi les plus reconnus :\n\n• ESPRIT (Ariana) — 8 000 étudiants, accrédité CTI, EUR-ACE, HCERES\n• MedTech (Tunis) — anglophone, accrédité ABET, EUR-ACE, AACSB\n• EPSousse (Sousse) — accrédité CTI, ABET, EUR-ACE\n• ESAT (Tunis) — seule école privée avec Génie Aéronautique\n• IPSAS (Sfax) — unique programme Génie Pétrolier dans le privé\n• ULT, TEK-UP, EPI, Iteam, SESAME et bien d'autres…",
      suggestions: ["Profil d'un institut", "Programmes disponibles", "Accréditations"],
      link: { label: "Voir tous les instituts", path: "/institutions" }
    },
    response_en: {
      text: "EduBridge lists 20 private Tunisian higher education institutes. Among the most recognized:\n\n• ESPRIT (Ariana) — 8,000 students, accredited CTI, EUR-ACE, HCERES\n• MedTech (Tunis) — English-taught, accredited ABET, EUR-ACE, AACSB\n• EPSousse (Sousse) — accredited CTI, ABET, EUR-ACE\n• ESAT (Tunis) — only private school with Aeronautical Engineering\n• IPSAS (Sfax) — unique Petroleum Engineering program in private sector\n• ULT, TEK-UP, EPI, Iteam, SESAME and many others…",
      suggestions: ["Institute profile", "Available programs", "Accreditations"],
      link: { label: "View all institutes", path: "/institutions" }
    }
  },
  {
    id: 'institutes_profile',
    keywords: ['profil', 'présentation', 'propos', 'infos', 'contact', 'école', 'about', 'coordonnées', 'campus', 'présenter'],
    response: {
      text: "Chaque profil d'institut sur EduBridge contient :\n• Présentation : historique, mission, valeurs\n• Accréditations : labels qualité (CTI, ABET, EUR-ACE, AACSB…)\n• Programmes : liste des formations proposées\n• Contact : adresse, téléphone, email, site web\n• Note et taux d'acceptation indicatifs",
      suggestions: ["Liste des instituts", "Accréditations", "Trouver des programmes"],
      link: { label: "Voir les instituts", path: "/institutions" }
    },
    response_en: {
      text: "Each institute profile on EduBridge contains:\n• Presentation: history, mission, values\n• Accreditations: quality labels (CTI, ABET, EUR-ACE, AACSB…)\n• Programs: list of offered training\n• Contact: address, phone, email, website\n• Indicative rating and acceptance rate",
      suggestions: ["Institute list", "Accreditations", "Find programs"],
      link: { label: "View institutes", path: "/institutions" }
    }
  },
  {
    id: 'accreditation_what',
    keywords: ['accréditation', 'signifie', 'définition', 'meaning', 'accreditation', 'certification', 'label', 'reconnaissance', 'qualité'],
    response: {
      text: "Une accréditation est une reconnaissance officielle de la qualité d'un établissement par un organisme indépendant reconnu internationalement.\n\nElle garantit que :\n• Les programmes répondent à des standards pédagogiques rigoureux\n• Les méthodes sont évaluées régulièrement\n• Le diplôme a une valeur reconnue à l'international\n\nEn Tunisie, les accréditations les plus recherchées sont EUR-ACE, CTI, ABET et AACSB.",
      suggestions: ["Types d'accréditations", "Importance des accréditations"],
      link: null
    },
    response_en: {
      text: "An accreditation is an official recognition of an institution's quality by an internationally recognized independent body.\n\nIt guarantees that:\n• Programs meet rigorous educational standards\n• Teaching methods are regularly evaluated\n• The diploma has internationally recognized value\n\nIn Tunisia, the most sought-after accreditations are EUR-ACE, CTI, ABET and AACSB.",
      suggestions: ["Types of accreditations", "Importance of accreditations"],
      link: null
    }
  },
  {
    id: 'accreditation_types',
    keywords: ['abet', 'cti', 'aacsb', 'amba', 'hceres', 'eurace', 'equis', 'label', 'types', 'organismes', 'liste', 'sigles'],
    response: {
      text: "Accréditations présentes sur EduBridge :\n\n• EUR-ACE — standard européen d'ingénierie (tous nos instituts)\n• CTI — Commission des Titres d'Ingénieur (ESPRIT, EPSousse, Polytechnique INTL, ESIET-UAS, IPSAS)\n• ABET — ingénierie anglo-saxonne, référence mondiale (MedTech, EPSousse)\n• AACSB — business schools internationales (MedTech)\n• HCERES — évaluation française (ESPRIT)",
      suggestions: ["Qu'est-ce qu'une accréditation ?", "Importance des accréditations"],
      link: null
    },
    response_en: {
      text: "Accreditations on EduBridge:\n\n• EUR-ACE — European engineering standard (all our institutes)\n• CTI — French Engineering Title Commission (ESPRIT, EPSousse, Polytechnique INTL, ESIET-UAS, IPSAS)\n• ABET — Anglo-Saxon engineering, world reference (MedTech, EPSousse)\n• AACSB — international business schools (MedTech)\n• HCERES — French evaluation body (ESPRIT)",
      suggestions: ["What is an accreditation?", "Importance of accreditations"],
      link: null
    }
  },
  {
    id: 'accreditation_importance',
    keywords: ['pourquoi', 'utile', 'internationale', 'valeur', 'importance', 'reconnu', 'bénéfice', 'avantage', 'emploi', 'carrière'],
    response: {
      text: "Pourquoi les accréditations sont importantes :\n\n• Reconnaissance internationale — diplôme reconnu dans de nombreux pays\n• Qualité garantie — standards évalués régulièrement\n• Employabilité — les recruteurs internationaux valorisent ces labels\n• Poursuite d'études — facilite les équivalences et doctorats à l'étranger\n• Mobilité — opportunités d'échanges et de stages internationaux",
      suggestions: ["Types d'accréditations", "Voir les instituts"],
      link: { label: "Voir les instituts", path: "/institutions" }
    },
    response_en: {
      text: "Why accreditations matter:\n\n• International recognition — diploma recognized in many countries\n• Quality guaranteed — standards regularly evaluated\n• Employability — international recruiters value these labels\n• Further studies — facilitates equivalences and PhDs abroad\n• Mobility — opportunities for international exchanges and internships",
      suggestions: ["Types of accreditations", "View institutes"],
      link: { label: "View institutes", path: "/institutions" }
    }
  },

  // ─── CATÉGORIE 5 — Compte & Authentification ─────────────────────────────

  {
    id: 'auth_register',
    keywords: ['créer', 'compte', 'inscription', 'inscrire', 'signup', 'nouveau', 'register', 'enregistrer', 'rejoindre'],
    response: {
      text: "Pour créer votre compte sur EduBridge :\n1. Cliquez sur « Inscription » en haut à droite\n2. Choisissez votre rôle : Candidat\n3. Remplissez le formulaire : prénom, nom, email, mot de passe\n4. Validez — vous êtes redirigé vers votre tableau de bord\n\nLes comptes Institut ne s'inscrivent pas via ce formulaire — l'admin crée leur compte sur demande.",
      suggestions: ["Connexion", "Demande accès institut"],
      link: { label: "Créer un compte", path: "/signup" }
    },
    response_en: {
      text: "To create your account on EduBridge:\n1. Click \"Sign Up\" in the top right\n2. Choose your role: Candidate\n3. Fill in the form: first name, last name, email, password\n4. Confirm — you're redirected to your dashboard\n\nInstitute accounts don't register via this form — the admin creates their account on request.",
      suggestions: ["Login", "Institute access request"],
      link: { label: "Create an account", path: "/signup" }
    }
  },
  {
    id: 'auth_login',
    keywords: ['connexion', 'connecter', 'login', 'accéder', 'entrer', 'connectez', 'sign', 'identifier', 'session', 'authentifier'],
    response: {
      text: "Pour vous connecter à EduBridge :\n1. Cliquez sur « Connexion » en haut à droite\n2. Entrez votre email et mot de passe\n3. Vous êtes redirigé vers votre tableau de bord selon votre rôle\n\nMot de passe oublié ? Utilisez le lien « Mot de passe oublié » sur la page de connexion.",
      suggestions: ["Mot de passe oublié", "Créer un compte"],
      link: { label: "Se connecter", path: "/login" }
    },
    response_en: {
      text: "To log in to EduBridge:\n1. Click \"Login\" in the top right\n2. Enter your email and password\n3. You're redirected to your dashboard based on your role\n\nForgot your password? Use the \"Forgot password\" link on the login page.",
      suggestions: ["Forgot password", "Create an account"],
      link: { label: "Log in", path: "/login" }
    }
  },
  {
    id: 'auth_forgot',
    keywords: ['oublié', 'réinitialiser', 'reset', 'oublie', 'forgot', 'password', 'retrouver', 'récupérer', 'perdu', 'changer'],
    response: {
      text: "Pour réinitialiser votre mot de passe :\n1. Cliquez sur « Connexion » puis « Mot de passe oublié »\n2. Entrez votre adresse email\n3. Vous recevez un email avec un lien de réinitialisation (valable 1 heure)\n4. Cliquez sur le lien et choisissez un nouveau mot de passe\n\nVérifiez vos spams si vous ne recevez pas l'email sous 2 minutes.",
      suggestions: ["Se connecter", "Créer un compte"],
      link: { label: "Connexion", path: "/login" }
    },
    response_en: {
      text: "To reset your password:\n1. Click \"Login\" then \"Forgot password\"\n2. Enter your email address\n3. You receive an email with a reset link (valid for 1 hour)\n4. Click the link and choose a new password\n\nCheck your spam folder if you don't receive the email within 2 minutes.",
      suggestions: ["Log in", "Create an account"],
      link: { label: "Login", path: "/login" }
    }
  },
  {
    id: 'auth_profile',
    keywords: ['modifier', 'profil', 'paramètres', 'infos', 'mettre', 'jour', 'update', 'settings', 'informations', 'personnel', 'photo'],
    response: {
      text: "Pour modifier votre profil :\n• Rendez-vous dans « Paramètres » de votre tableau de bord\n• Modifiez : nom, prénom, téléphone, nationalité, date de naissance, photo\n• Changez votre mot de passe depuis la même page\n• Les modifications sont enregistrées immédiatement",
      suggestions: ["Mes documents", "Mon tableau de bord"],
      link: { label: "Mes paramètres", path: "/dashboard/parametres" }
    },
    response_en: {
      text: "To edit your profile:\n• Go to \"Settings\" in your dashboard\n• Edit: name, first name, phone, nationality, date of birth, photo\n• Change your password from the same page\n• Changes are saved immediately",
      suggestions: ["My documents", "My dashboard"],
      link: { label: "My settings", path: "/dashboard/parametres" }
    }
  },
  {
    id: 'auth_institute_access',
    keywords: ['accès', 'demande', 'école', 'request', 'rejoindre', 'inscrire', 'institute', 'admin', 'établissement'],
    response: {
      text: "Les instituts souhaitant rejoindre EduBridge suivent ce processus :\n1. Soumettez une demande d'accès via le formulaire dédié\n2. L'équipe EduBridge examine votre demande\n3. En cas d'approbation, un compte est créé et des identifiants vous sont envoyés\n4. Vous finalisez votre profil lors de la première connexion",
      suggestions: ["Créer un compte candidat", "Se connecter"],
      link: { label: "Demande d'accès institut", path: "/institution/request-access" }
    },
    response_en: {
      text: "Institutes wishing to join EduBridge follow this process:\n1. Submit an access request via the dedicated form\n2. The EduBridge team reviews your request\n3. If approved, an account is created and credentials are emailed to you\n4. You complete your profile at first login",
      suggestions: ["Create candidate account", "Log in"],
      link: { label: "Institute access request", path: "/institution/request-access" }
    }
  },

  // ─── CATÉGORIE 6 — Navigation & Aide ─────────────────────────────────────

  {
    id: 'nav_dashboard',
    keywords: ['tableau', 'bord', 'dashboard', 'espace', 'accueil', 'connecté', 'personnel', 'home', 'interface', 'menu'],
    response: {
      text: "Votre tableau de bord EduBridge centralise tout :\n\n• Candidat — Mes candidatures, Mes favoris, Mes documents, Paramètres\n• Institut — Gestion des candidatures (kanban), Programmes, Profil\n• Admin — Utilisateurs, Instituts, Programmes, Candidatures, Demandes d'accès\n\nAccédez-y en cliquant sur votre avatar en haut à droite.",
      suggestions: ["Mes candidatures", "Mes favoris", "Mes documents"],
      link: { label: "Mon tableau de bord", path: "/dashboard/candidate" }
    },
    response_en: {
      text: "Your EduBridge dashboard centralizes everything:\n\n• Candidate — My Applications, My Favorites, My Documents, Settings\n• Institute — Application management (kanban), Programs, Profile\n• Admin — Users, Institutes, Programs, Applications, Access Requests\n\nAccess it by clicking your avatar in the top right.",
      suggestions: ["My applications", "My favorites", "My documents"],
      link: { label: "My dashboard", path: "/dashboard/candidate" }
    }
  },
  {
    id: 'nav_notifications',
    keywords: ['notifications', 'alertes', 'messages', 'badge', 'lues', 'notification', 'alerte', 'cloche', 'bell', 'non'],
    response: {
      text: "Le système de notifications EduBridge vous informe en temps réel :\n• L'icône cloche en haut à droite affiche un badge avec les non lues\n• Cliquez pour afficher le dropdown avec les dernières notifications\n• Notifications automatiques : changements de statut, acceptation, refus\n\nMarquez les notifications comme lues individuellement ou toutes d'un coup.",
      suggestions: ["Mon tableau de bord", "Suivre mes candidatures"],
      link: { label: "Mon espace", path: "/dashboard/candidate" }
    },
    response_en: {
      text: "The EduBridge notification system keeps you informed in real time:\n• The bell icon in the top right shows a badge with unread count\n• Click to display the dropdown with the latest notifications\n• Automatic notifications: status changes, acceptance, rejection\n\nMark notifications as read individually or all at once.",
      suggestions: ["My dashboard", "Track my applications"],
      link: { label: "My space", path: "/dashboard/candidate" }
    }
  },
  {
    id: 'nav_guide',
    keywords: ['guide', 'aide', 'utiliser', 'tutoriel', 'mode', 'emploi', 'help', 'tuto', 'apprendre', 'débutant', 'manual'],
    response: {
      text: "EduBridge met à disposition un guide complet :\n• Page dédiée accessible depuis le menu principal\n• Explique étape par étape le processus de candidature\n• Conseils pour préparer son dossier et optimiser ses chances\n\nN'hésitez pas à me poser des questions spécifiques — je suis là pour vous aider !",
      suggestions: ["Comment candidater ?", "Documents requis"],
      link: { label: "Voir le guide", path: "/guide" }
    },
    response_en: {
      text: "EduBridge provides a comprehensive guide:\n• Dedicated page accessible from the main menu\n• Step-by-step explanation of the application process\n• Tips to prepare your file and maximize your chances\n\nFeel free to ask specific questions — I'm here to help!",
      suggestions: ["How do I apply?", "Required documents"],
      link: { label: "See the guide", path: "/guide" }
    }
  },
  {
    id: 'prerequisites_admission',
    keywords: ['prérequis', 'conditions', 'niveau', 'requis', 'bac', 'math', 'admis', 'critères', 'exigences', 'prerequisites', 'entrée'],
    response: {
      text: "Les prérequis d'admission varient selon le programme :\n\n• Cycle Ingénieur (Bac+5) — Baccalauréat Math ou Sciences\n• Licence (Bac+3) — Baccalauréat toutes séries selon la filière\n• Master (Bac+5) — Licence dans le domaine\n\nConsultez la fiche détail de chaque programme pour les prérequis exacts.",
      suggestions: ["Trouver un programme", "Comment candidater ?"],
      link: { label: "Rechercher des programmes", path: "/search" }
    },
    response_en: {
      text: "Admission prerequisites vary by program:\n\n• Engineering cycle (Bac+5) — Math or Science Baccalaureate\n• Bachelor (Bac+3) — Any Baccalaureate depending on the field\n• Master (Bac+5) — Bachelor's degree in the field\n\nCheck each program's detail page for exact prerequisites.",
      suggestions: ["Find a program", "How do I apply?"],
      link: { label: "Search programs", path: "/search" }
    }
  },
  {
    id: 'platform_about',
    keywords: ['quoi', 'edubridge', 'plateforme', 'présentation', 'objectif', 'mission', 'rôle', 'but', 'application', 'site'],
    response: {
      text: "EduBridge est une plateforme tunisienne de mise en relation entre étudiants et instituts d'enseignement supérieur privés.\n\n• Mission : Simplifier et digitaliser le processus de candidature\n• Pour les candidats : Découvrir, comparer et candidater en quelques clics\n• Pour les instituts : Gérer les candidatures et le workflow d'admission\n\nEduBridge est entièrement gratuit pour les candidats.",
      suggestions: ["Comment candidater ?", "Voir les programmes", "Créer un compte"],
      link: { label: "Explorer la plateforme", path: "/" }
    },
    response_en: {
      text: "EduBridge is a Tunisian platform connecting students with private higher education institutes.\n\n• Mission: Simplify and digitize the application process\n• For candidates: Discover, compare and apply in a few clicks\n• For institutes: Manage applications and the admission workflow\n\nEduBridge is completely free for candidates.",
      suggestions: ["How do I apply?", "See programs", "Create an account"],
      link: { label: "Explore the platform", path: "/" }
    }
  },
  {
    id: 'nav_language',
    keywords: ['langue', 'changer', 'français', 'anglais', 'english', 'language', 'traduction', 'bilingue', 'switch', 'globe'],
    response: {
      text: "EduBridge est disponible en français et en anglais.\n\nPour changer de langue :\n• Trouvez le sélecteur de langue dans la barre de navigation\n• Choisissez FR (Français) ou EN (English)\n• La langue choisie est mémorisée pour vos prochaines visites",
      suggestions: ["Guide d'utilisation", "Connexion"],
      link: null
    },
    response_en: {
      text: "EduBridge is available in French and English.\n\nTo change language:\n• Find the language selector in the navigation bar\n• Choose FR (French) or EN (English)\n• Your chosen language is saved for future visits",
      suggestions: ["User guide", "Login"],
      link: null
    }
  },

  // ─── CATÉGORIE 7 — Guide & FAQ ────────────────────────────────────────────

  {
    id: 'guide_steps',
    keywords: ['étapes', 'processus', 'workflow', 'marche', 'étape', 'steps', 'procedure', 'déroulement', 'résumé', 'global'],
    response: {
      text: "Le processus complet EduBridge en 6 étapes :\n\n1. Création du compte — Inscrivez-vous (gratuit)\n2. Exploration — Parcourez et filtrez les programmes\n3. Comparaison — Comparez jusqu'à 3 programmes côte à côte\n4. Candidature — Soumettez votre dossier avec les documents requis\n5. Suivi — Suivez le statut depuis votre tableau de bord\n6. Admission — En cas d'acceptation, complétez la pré-inscription",
      suggestions: ["Comment candidater ?", "Statuts de candidature"],
      link: { label: "Voir le guide complet", path: "/guide" }
    },
    response_en: {
      text: "The complete EduBridge process in 6 steps:\n\n1. Account creation — Sign up (free)\n2. Exploration — Browse and filter programs\n3. Comparison — Compare up to 3 programs side by side\n4. Application — Submit your file with required documents\n5. Tracking — Follow the status from your dashboard\n6. Admission — If accepted, complete the pre-enrollment",
      suggestions: ["How do I apply?", "Application statuses"],
      link: { label: "See the full guide", path: "/guide" }
    }
  },
  {
    id: 'guide_workflow',
    keywords: ['brouillon', 'soumise', 'examen', 'cycle', 'pipeline', 'statuts', 'machine', 'transitions', 'flux', 'états'],
    response: {
      text: "Le cycle de vie d'une candidature EduBridge :\n\n• Brouillon → Créée, pas encore soumise\n• Soumise → Envoyée, en attente de traitement\n• En examen → L'institut étudie votre dossier\n• Acceptée → Procédez à la pré-inscription\n• Refusée → Non retenu\n• Liste d'attente → En attente d'une place libérée\n\nChaque transition déclenche une notification automatique.",
      suggestions: ["Statuts de candidature", "Pré-inscription après acceptation"],
      link: { label: "Mes candidatures", path: "/dashboard/candidatures" }
    },
    response_en: {
      text: "The EduBridge application lifecycle:\n\n• Draft → Created, not yet submitted\n• Submitted → Sent, awaiting processing\n• Under review → The institute is studying your file\n• Accepted → Proceed to pre-enrollment\n• Rejected → Not retained\n• Waiting list → Awaiting a freed-up spot\n\nEach transition triggers an automatic notification.",
      suggestions: ["Application statuses", "Pre-enrollment after acceptance"],
      link: { label: "My applications", path: "/dashboard/candidatures" }
    }
  },
  {
    id: 'guide_how_platform',
    keywords: ['fonctionnement', 'utiliser', 'démarrer', 'commencer', 'premiers', 'débuter', 'nouveau', 'débutant', 'novice'],
    response: {
      text: "Bienvenue sur EduBridge ! Pour bien démarrer :\n\n• Créez votre compte candidat (gratuit)\n• Explorez les programmes et instituts\n• Sauvegardez vos favoris\n• Comparez vos programmes présélectionnés\n• Candidatez en remplissant le dossier\n• Suivez vos candidatures en temps réel",
      suggestions: ["Créer un compte", "Voir les programmes"],
      link: { label: "Commencer", path: "/signup" }
    },
    response_en: {
      text: "Welcome to EduBridge! To get started:\n\n• Create your candidate account (free)\n• Explore programs and institutes\n• Save your favorites\n• Compare your shortlisted programs\n• Apply by filling in the application form\n• Track your applications in real time",
      suggestions: ["Create an account", "See programs"],
      link: { label: "Get started", path: "/signup" }
    }
  },
  {
    id: 'faq_account',
    keywords: ['problème', 'connexion', 'bloqué', 'erreur', 'bug', 'impossible', 'accéder', 'issue', 'faq', 'technique'],
    response: {
      text: "FAQ — Problèmes de compte :\n\n• Je ne peux pas me connecter → Vérifiez email/mot de passe, utilisez « Mot de passe oublié »\n• Mon compte est bloqué → Contactez le support EduBridge\n• Je n'ai pas reçu l'email → Vérifiez vos spams\n• Je veux changer d'email → Rendez-vous dans Paramètres",
      suggestions: ["Réinitialiser mot de passe", "Modifier mon profil"],
      link: { label: "Se connecter", path: "/login" }
    },
    response_en: {
      text: "FAQ — Account issues:\n\n• I can't log in → Check email/password, use \"Forgot password\"\n• My account is blocked → Contact EduBridge support\n• I didn't receive the email → Check your spam folder\n• I want to change my email → Go to Settings",
      suggestions: ["Reset password", "Edit my profile"],
      link: { label: "Log in", path: "/login" }
    }
  },
  {
    id: 'faq_candidature',
    keywords: ['combien', 'candidatures', 'modifier', 'changer', 'corriger', 'erreur', 'dossier', 'faq', 'règles'],
    response: {
      text: "FAQ — Candidatures :\n\n• Combien de candidatures ? → Illimité, mais 1 seule par programme\n• Puis-je modifier après soumission ? → Non — vérifiez avant de soumettre\n• Puis-je repostuler après un refus ? → Non immédiatement\n• Combien de temps pour une réponse ? → En général 1 à 4 semaines",
      suggestions: ["Statuts de candidature", "Suivre ma candidature"],
      link: { label: "Mes candidatures", path: "/dashboard/candidatures" }
    },
    response_en: {
      text: "FAQ — Applications:\n\n• How many applications? → Unlimited, but only 1 per program\n• Can I edit after submission? → No — check before submitting\n• Can I reapply after rejection? → Not immediately\n• How long for a response? → Generally 1 to 4 weeks",
      suggestions: ["Application statuses", "Track my application"],
      link: { label: "My applications", path: "/dashboard/candidatures" }
    }
  },
  {
    id: 'faq_programs',
    keywords: ['différences', 'critères', 'sélection', 'domaines', 'offres', 'disponibles', 'choix', 'option', 'faq', 'questions'],
    response: {
      text: "FAQ — Programmes :\n\n• Différence Licence / Ingénieur ? → Licence = Bac+3, Ingénieur = Bac+5 avec accréditation\n• Qu'est-ce que l'alternance ? → Formation en entreprise + cours (2j/3j)\n• Langue d'enseignement ? → Souvent français, parfois anglais (MedTech, TEK-UP)\n• Programmes bilingues ? → Oui, certains instituts proposent des parcours franco-anglais",
      suggestions: ["Trouver un programme", "Filtrer les programmes"],
      link: { label: "Rechercher des programmes", path: "/search" }
    },
    response_en: {
      text: "FAQ — Programs:\n\n• Difference Bachelor / Engineer? → Bachelor = Bac+3, Engineer = Bac+5 with accreditation\n• What is work-study? → Company training + classes (2 days/3 days)\n• Teaching language? → Often French, sometimes English (MedTech, TEK-UP)\n• Bilingual programs? → Yes, some institutes offer French-English tracks",
      suggestions: ["Find a program", "Filter programs"],
      link: { label: "Search programs", path: "/search" }
    }
  },
  {
    id: 'faq_contact',
    keywords: ['contacter', 'support', 'aide', 'signaler', 'technique', 'contact', 'joindre', 'équipe', 'email', 'assistance'],
    response: {
      text: "Pour contacter l'équipe EduBridge :\n• Email : support@edubridge.tn\n• Formulaire de contact : disponible sur la page « À propos »\n\nPour contacter un institut spécifique, consultez son profil sur EduBridge — les coordonnées y sont listées.\n\nNous répondons sous 24 à 48 heures ouvrables.",
      suggestions: ["Problème de compte", "Voir les instituts"],
      link: null
    },
    response_en: {
      text: "To contact the EduBridge team:\n• Email: support@edubridge.tn\n• Contact form: available on the \"About\" page\n\nTo contact a specific institute, check its profile on EduBridge — contact details are listed there.\n\nWe respond within 24 to 48 business hours.",
      suggestions: ["Account issue", "View institutes"],
      link: null
    }
  },

  // ─── CATÉGORIE 8 — Vie étudiante en Tunisie ──────────────────────────────

  {
    id: 'life_cost',
    keywords: ['coût', 'budget', 'dépenses', 'combien', 'vivre', 'argent', 'mensuel', 'vie', 'coûte', 'tunisie'],
    response: {
      text: "Budget mensuel moyen d'un étudiant en Tunisie (2025) :\n\n• Loyer (colocation) : 250 à 450 DT/mois\n• Alimentation : 200 à 350 DT/mois\n• Transport : 50 à 100 DT/mois\n• Fournitures : 50 à 80 DT/mois\n• Charges (internet, énergie) : 40 à 80 DT/mois\n\nTotal estimé : 590 à 1 060 DT/mois (environ 175 à 315 €). La vie à Tunis est plus chère que dans les villes de province comme Sousse ou Sfax.",
      suggestions: ["Logement en Tunisie", "Transport à Tunis", "Villes universitaires"],
      link: null
    },
    response_en: {
      text: "Average monthly budget for a student in Tunisia (2025):\n\n• Rent (shared accommodation): 250 to 450 DT/month\n• Food: 200 to 350 DT/month\n• Transport: 50 to 100 DT/month\n• Supplies: 50 to 80 DT/month\n• Bills (internet, energy): 40 to 80 DT/month\n\nEstimated total: 590 to 1,060 DT/month (approx. 175 to 315 €). Life in Tunis is more expensive than in provincial cities like Sousse or Sfax.",
      suggestions: ["Housing in Tunisia", "Transport in Tunis", "University cities"],
      link: null
    }
  },
  {
    id: 'life_housing',
    keywords: ['logement', 'loyer', 'résidence', 'colocation', 'appartement', 'chambre', 'hébergement', 'louer', 'habiter', 'résider', 'studio', 'meublé'],
    response: {
      text: "Options de logement pour étudiants en Tunisie :\n\n• Résidence universitaire : 150 à 250 DT/mois\n• Colocation : 200 à 350 DT/mois par personne\n• Studio meublé indépendant : 450 à 700 DT/mois\n\nQuartiers populaires à Tunis : El Menzah, Manar, Ariana, La Marsa.\nPlateformes : Jumia Deals, Mubawab, groupes Facebook « logement étudiant Tunis ».",
      suggestions: ["Budget étudiant", "Villes universitaires", "Transport"],
      link: null
    },
    response_en: {
      text: "Housing options for students in Tunisia:\n\n• University residence: 150 to 250 DT/month\n• Shared accommodation: 200 to 350 DT/person/month\n• Independent furnished studio: 450 to 700 DT/month\n\nPopular neighborhoods in Tunis: El Menzah, Manar, Ariana, La Marsa.\nPlatforms: Jumia Deals, Mubawab, Facebook groups \"student housing Tunis\".",
      suggestions: ["Student budget", "University cities", "Transport"],
      link: null
    }
  },
  {
    id: 'life_transport',
    keywords: ['transport', 'métro', 'tunis', 'bus', 'louage', 'taxi', 'déplacement', 'mobilité', 'trajet', 'metro', 'bolt'],
    response: {
      text: "Transport étudiant en Tunisie :\n\n• Métro léger (TML) : ticket à 0,70 DT, abonnement mensuel ~35 DT\n• Bus SNT : ticket à 0,50 DT\n• Louage : taxi collectif inter-villes, 5 à 15 DT\n• Taxi Bolt : 3 à 10 DT en ville\n\nAvec la carte de transport étudiant : réductions sur le métro et certains bus.",
      suggestions: ["Budget étudiant", "Villes universitaires", "Logement"],
      link: null
    },
    response_en: {
      text: "Student transport in Tunisia:\n\n• Light metro (TML): ticket at 0.70 DT, monthly pass ~35 DT\n• SNT Bus: ticket at 0.50 DT\n• Louage (shared taxi): inter-city, 5 to 15 DT\n• Bolt taxi: 3 to 10 DT in the city\n\nWith the student transport card: discounts on the metro and some buses.",
      suggestions: ["Student budget", "University cities", "Housing"],
      link: null
    }
  },
  {
    id: 'life_food',
    keywords: ['nourriture', 'manger', 'restaurant', 'épicerie', 'marché', 'repas', 'alimentation', 'cuisine', 'food', 'couscous', 'pain'],
    response: {
      text: "Alimentation étudiant en Tunisie :\n\n• Restaurant universitaire (CROUS) : 1 à 1,50 DT le repas\n• Sandwichs / Fricassé : 2 à 5 DT\n• Restaurant populaire : plat complet 6 à 12 DT\n• Épicerie / Marché : fruits, légumes, pain à prix accessibles\n\nBudget alimentation : 200 à 300 DT/mois en cuisinant soi-même.",
      suggestions: ["Budget étudiant", "Logement", "Culture tunisienne"],
      link: null
    },
    response_en: {
      text: "Student food in Tunisia:\n\n• University restaurant (CROUS): 1 to 1.50 DT per meal\n• Sandwiches / Fricassée: 2 to 5 DT\n• Popular restaurant: full meal 6 to 12 DT\n• Grocery / Market: fruits, vegetables, bread at accessible prices\n\nFood budget: 200 to 300 DT/month cooking at home.",
      suggestions: ["Student budget", "Housing", "Tunisian culture"],
      link: null
    }
  },
  {
    id: 'life_safety',
    keywords: ['sécurité', 'safe', 'danger', 'quartier', 'sûr', 'sécurisé', 'risque', 'crime', 'safety', 'conseils', 'vigilance'],
    response: {
      text: "Sécurité en Tunisie pour les étudiants :\n\n• La Tunisie est globalement sûre — crime violent rare dans les zones universitaires\n• Quartiers recommandés : El Menzah, Ariana, La Marsa, Cité Olympique\n• Précautions standard : évitez d'afficher des objets de valeur la nuit\n• Numéros d'urgence : Police 197, SAMU 190, Pompiers 198",
      suggestions: ["Villes universitaires", "Logement", "Santé en Tunisie"],
      link: null
    },
    response_en: {
      text: "Safety in Tunisia for students:\n\n• Tunisia is generally safe — violent crime is rare in university areas\n• Recommended neighborhoods: El Menzah, Ariana, La Marsa, Cité Olympique\n• Standard precautions: avoid displaying valuables at night\n• Emergency numbers: Police 197, SAMU 190, Fire 198",
      suggestions: ["University cities", "Housing", "Health in Tunisia"],
      link: null
    }
  },
  {
    id: 'life_culture',
    keywords: ['culture', 'langue', 'arabe', 'adaptation', 'intégration', 'coutumes', 'tunisien', 'local', 'société', 'francophone'],
    response: {
      text: "Culture et intégration en Tunisie :\n\n• Langues : Arabe tunisien au quotidien, français très répandu dans l'enseignement et les affaires\n• Religion : Islam majoritaire, pratiqué de façon modérée\n• Hospitalité : Les Tunisiens sont réputés pour leur chaleur et leur accueil\n\nApprendre quelques mots d'arabe tunisien facilite grandement l'intégration.",
      suggestions: ["Villes universitaires", "Sécurité en Tunisie"],
      link: null
    },
    response_en: {
      text: "Culture and integration in Tunisia:\n\n• Languages: Tunisian Arabic in daily life, French widely used in education and business\n• Religion: Islam majority, practiced moderately\n• Hospitality: Tunisians are known for their warmth and welcoming nature\n\nLearning a few words of Tunisian Arabic greatly helps integration.",
      suggestions: ["University cities", "Safety in Tunisia"],
      link: null
    }
  },
  {
    id: 'life_student_city',
    keywords: ['villes', 'tunis', 'sousse', 'sfax', 'manouba', 'ariana', 'campus', 'universitaire', 'région', 'city', 'monastir', 'nabeul', 'gabes'],
    response: {
      text: "Principales villes universitaires en Tunisie :\n\n• Tunis — Capitale, plus grand pôle, plus chère (ESPRIT, MedTech, ULT, ESAT, Iteam…)\n• Sousse — 2ème pôle, bord de mer, moins chère (EPSousse, EPI)\n• Sfax — Pôle industriel (IPSAS, IIT)\n• Monastir — Campus dynamique (Polytech Monastir)\n• Nabeul — Cap Bon (ITBS)\n\nSousse offre souvent le meilleur rapport qualité/vie/prix.",
      suggestions: ["Budget étudiant", "Logement", "Transport"],
      link: null
    },
    response_en: {
      text: "Main university cities in Tunisia:\n\n• Tunis — Capital, largest hub, most expensive (ESPRIT, MedTech, ULT, ESAT, Iteam…)\n• Sousse — 2nd hub, seaside, less expensive (EPSousse, EPI)\n• Sfax — Industrial hub (IPSAS, IIT)\n• Monastir — Dynamic campus (Polytech Monastir)\n• Nabeul — Cap Bon (ITBS)\n\nSousse often offers the best quality/life/price ratio.",
      suggestions: ["Student budget", "Housing", "Transport"],
      link: null
    }
  },
  {
    id: 'life_health',
    keywords: ['santé', 'médecin', 'hôpital', 'assurance', 'pharmacie', 'urgence', 'médical', 'soins', 'health', 'maladie', 'clinique'],
    response: {
      text: "Santé des étudiants en Tunisie :\n\n• Hôpitaux publics : soins accessibles à faible coût\n• Cliniques privées : 30 à 80 DT la consultation\n• Pharmacies : bien approvisionnées, médicaments courants 5 à 20 DT\n• Assurance étudiante CNAM : couverture partielle\n• Urgences SAMU : 190 (gratuit)\n\nÉtudiants étrangers : souscrivez à une assurance internationale avant votre départ.",
      suggestions: ["Budget étudiant", "Sécurité en Tunisie"],
      link: null
    },
    response_en: {
      text: "Student health in Tunisia:\n\n• Public hospitals: affordable care at low cost\n• Private clinics: 30 to 80 DT per consultation\n• Pharmacies: well-stocked, common medications 5 to 20 DT\n• CNAM student insurance: partial coverage\n• Emergency SAMU: 190 (free)\n\nInternational students: take out international insurance before departure.",
      suggestions: ["Student budget", "Safety in Tunisia"],
      link: null
    }
  },

  // ─── CATÉGORIE 9 — Frais & Financement ───────────────────────────────────

  {
    id: 'fees_tuition',
    keywords: ['frais', 'scolarité', 'coût', 'programme', 'prix', 'formation', 'tarif', 'annuel', 'droit', 'inscription', 'cher', 'payer', 'combien'],
    response: {
      text: "Frais de scolarité dans les instituts privés tunisiens (estimation 2025) :\n\n• Licence (Bac+3) : 2 500 à 5 000 DT/an\n• Cycle Ingénieur (Bac+5) : 4 000 à 8 000 DT/an\n• Master (Bac+5) : 3 500 à 7 000 DT/an\n\nLes frais varient selon l'accréditation et la réputation de l'école. Consultez la fiche de chaque programme pour les frais exacts.",
      suggestions: ["Paiement échelonné", "Bourses disponibles", "Comparer les frais"],
      link: { label: "Voir les programmes", path: "/search" }
    },
    response_en: {
      text: "Tuition fees at Tunisian private institutes (2025 estimate):\n\n• Bachelor (Bac+3): 2,500 to 5,000 DT/year\n• Engineering cycle (Bac+5): 4,000 to 8,000 DT/year\n• Master (Bac+5): 3,500 to 7,000 DT/year\n\nFees vary based on accreditation and school reputation. Check each program's page for exact fees.",
      suggestions: ["Installment payment", "Available scholarships", "Compare fees"],
      link: { label: "View programs", path: "/search" }
    }
  },
  {
    id: 'fees_payment',
    keywords: ['paiement', 'échelonnement', 'mensualités', 'modalités', 'payer', 'versements', 'tranches', 'facilités', 'règlement'],
    response: {
      text: "Modalités de paiement des frais de scolarité :\n\n• Paiement en une fois (remise 5-10% parfois)\n• 2 versements : 60% à l'inscription, 40% au 2ème semestre\n• Paiement mensuel : 10 à 12 mensualités\n\nDes frais administratifs d'inscription (200 à 500 DT) s'ajoutent généralement aux frais annuels.",
      suggestions: ["Frais de scolarité", "Bourses et aides"],
      link: null
    },
    response_en: {
      text: "Tuition payment options:\n\n• One-time payment (sometimes 5-10% discount)\n• 2 installments: 60% at enrollment, 40% in 2nd semester\n• Monthly payments: 10 to 12 installments\n\nAdministrative registration fees (200 to 500 DT) are generally added to annual tuition.",
      suggestions: ["Tuition fees", "Scholarships and aid"],
      link: null
    }
  },
  {
    id: 'fees_scholarship',
    keywords: ['bourse', 'aide', 'financière', 'financement', 'subvention', 'scholarship', 'grant', 'gratuit', 'soutien', 'allocation'],
    response: {
      text: "Aides financières disponibles pour les étudiants en Tunisie :\n\n• Bourses d'État (MESRS) : selon critères académiques et sociaux\n• Bourses des instituts privés : selon mérite\n• Bourses internationales : Campus France, DAAD, Erasmus+\n• Prêts étudiants : certaines banques tunisiennes proposent des taux préférentiels",
      suggestions: ["Frais de scolarité", "Paiement échelonné"],
      link: null
    },
    response_en: {
      text: "Financial aid available for students in Tunisia:\n\n• State scholarships (MESRS): based on academic and social criteria\n• Private institute scholarships: based on merit\n• International scholarships: Campus France, DAAD, Erasmus+\n• Student loans: some Tunisian banks offer preferential rates",
      suggestions: ["Tuition fees", "Installment payment"],
      link: null
    }
  },
  {
    id: 'fees_international',
    keywords: ['étranger', 'international', 'tarif', 'frais', 'non-tunisien', 'expatrié', 'foreign', 'overseas', 'extra'],
    response: {
      text: "Frais pour les étudiants étrangers en Tunisie :\n\nDans la majorité des instituts, les frais sont identiques pour les étudiants tunisiens et étrangers. Certains appliquent un tarif 10-20% plus élevé.\n\nBudget supplémentaire à prévoir : visa, assurance internationale, dépôt de garantie logement.\nTotal estimé supplémentaire : 1 500 à 3 000 DT la 1ère année.",
      suggestions: ["Visa étudiant Tunisie", "Frais de scolarité"],
      link: null
    },
    response_en: {
      text: "Fees for international students in Tunisia:\n\nIn most institutes, fees are identical for Tunisian and international students. Some charge 10-20% more for non-residents.\n\nExtra budget needed: visa, international insurance, housing deposit.\nEstimated extra: 1,500 to 3,000 DT in the 1st year.",
      suggestions: ["Student visa Tunisia", "Tuition fees"],
      link: null
    }
  },
  {
    id: 'fees_compare',
    keywords: ['comparer', 'moins', 'cher', 'budget', 'économique', 'accessible', 'abordable', 'économiser', 'rapport', 'meilleur'],
    response: {
      text: "Pour comparer les frais de scolarité :\n\n• Utilisez l'outil de comparaison de programmes (jusqu'à 3 simultanément)\n• La fiche détail de chaque programme affiche les frais annuels\n\nProgrammes les moins chers : Licences en Sciences Humaines (2 500-3 500 DT/an)\nProgrammes les plus chers : Cycle Ingénieur accrédité ABET/CTI (6 000-8 000 DT/an)",
      suggestions: ["Comparer des programmes", "Bourses disponibles"],
      link: { label: "Comparer des programmes", path: "/compare" }
    },
    response_en: {
      text: "To compare tuition fees:\n\n• Use the program comparison tool (up to 3 simultaneously)\n• Each program's detail page shows the annual fees\n\nCheapest programs: Humanities Bachelors (2,500-3,500 DT/year)\nMost expensive: ABET/CTI accredited Engineering cycle (6,000-8,000 DT/year)",
      suggestions: ["Compare programs", "Available scholarships"],
      link: { label: "Compare programs", path: "/compare" }
    }
  },

  // ─── CATÉGORIE 10 — Étudiants Internationaux ─────────────────────────────

  {
    id: 'intl_visa',
    keywords: ['visa', 'étudiant', 'tunisie', 'consulat', 'ambassade', 'démarches', 'visiter', 'entrer', 'frontière', 'étranger', 'entry', 'séjour'],
    response: {
      text: "Visa étudiant pour la Tunisie :\n\nDocuments requis :\n• Passeport valide (+ 6 mois après fin des études)\n• Lettre d'admission de l'institut\n• Justificatif de ressources financières\n• Photos d'identité + assurance santé + casier judiciaire\n\nDéposez votre demande à l'ambassade tunisienne dans votre pays. Délai : 2 à 4 semaines.",
      suggestions: ["Titre de séjour", "Accueil étudiants étrangers"],
      link: null
    },
    response_en: {
      text: "Student visa for Tunisia:\n\nRequired documents:\n• Valid passport (+ 6 months after end of studies)\n• Admission letter from the institute\n• Proof of financial resources\n• ID photos + health insurance + criminal record\n\nSubmit your application at the Tunisian embassy in your country. Processing time: 2 to 4 weeks.",
      suggestions: ["Residence permit", "Welcome for international students"],
      link: null
    }
  },
  {
    id: 'intl_residence',
    keywords: ['titre', 'séjour', 'résident', 'permis', 'régularisation', 'carte', 'autorisation', 'résidence', 'rester', 'prolongation'],
    response: {
      text: "Titre de séjour étudiant en Tunisie :\n\n1. Rendez-vous au District de Police de votre lieu de résidence dans les 3 premiers mois\n2. Documents : passeport, photos, justificatif de domicile, attestation d'inscription, visa\n3. Renouvelable chaque année sur présentation du relevé de notes\n\nCertains instituts ont un bureau d'aide aux démarches pour les étudiants étrangers.",
      suggestions: ["Visa étudiant", "Accueil étudiants étrangers"],
      link: null
    },
    response_en: {
      text: "Student residence permit in Tunisia:\n\n1. Go to the Police District of your place of residence within the first 3 months\n2. Documents: passport, photos, proof of address, enrollment certificate, visa\n3. Renewable each year upon presentation of transcripts\n\nSome institutes have an international student affairs office to help with procedures.",
      suggestions: ["Student visa", "Welcome for international students"],
      link: null
    }
  },
  {
    id: 'intl_recognition',
    keywords: ['équivalence', 'reconnaissance', 'nostrification', 'validation', 'homologation', 'apostille', 'reconnaître'],
    response: {
      text: "Équivalence et reconnaissance de diplôme en Tunisie :\n\n• MESRS (Ministère de l'Enseignement Supérieur) — service des équivalences\n• Documents : diplôme original + traduction certifiée, relevés, apostille\n• Délai : 1 à 3 mois\n\nPour les instituts privés : chaque école fixe ses propres critères — renseignez-vous directement.",
      suggestions: ["Visa étudiant", "Comment candidater ?"],
      link: null
    },
    response_en: {
      text: "Diploma equivalence and recognition in Tunisia:\n\n• MESRS (Ministry of Higher Education) — equivalence department\n• Documents: original diploma + certified translation, transcripts, apostille\n• Processing time: 1 to 3 months\n\nFor private institutes: each school sets its own criteria — inquire directly.",
      suggestions: ["Student visa", "How do I apply?"],
      link: null
    }
  },
  {
    id: 'intl_language',
    keywords: ['langue', 'enseignement', 'niveau', 'français', 'arabophone', 'cours', 'linguistique', 'maîtrise', 'TCF', 'DELF', 'anglophone'],
    response: {
      text: "Langue d'enseignement dans les instituts tunisiens :\n\n• Français : langue principale dans la majorité des grandes écoles privées\n• Anglais : MedTech et TEK-UP proposent des programmes entièrement en anglais\n• Arabe : droit, lettres, sciences humaines\n\nNiveau recommandé : B2 en français (DELF/DALF) pour les filières francophones.",
      suggestions: ["Prérequis d'admission", "Comment candidater ?"],
      link: null
    },
    response_en: {
      text: "Teaching language in Tunisian institutes:\n\n• French: main language in most private engineering schools\n• English: MedTech and TEK-UP offer fully English programs\n• Arabic: law, literature, humanities\n\nRecommended level: B2 in French (DELF/DALF) for French-taught programs.",
      suggestions: ["Admission prerequisites", "How do I apply?"],
      link: null
    }
  },
  {
    id: 'intl_welcome',
    keywords: ['accueil', 'orientation', 'arrivée', 'premier', 'jour', 'welcome', 'bienvenue', 'international', 'nouveau'],
    response: {
      text: "Accueil des étudiants étrangers en Tunisie :\n\nLa plupart des instituts EduBridge proposent :\n• Une journée d'accueil en début d'année\n• Un bureau des affaires internationales\n• Un tuteur ou parrain étudiant\n• Des associations étudiantes actives\n\nContactez l'institut bien avant votre arrivée pour préparer votre installation.",
      suggestions: ["Logement étudiant", "Transport", "Culture tunisienne"],
      link: null
    },
    response_en: {
      text: "Welcome for international students in Tunisia:\n\nMost EduBridge institutes offer:\n• An orientation day at the start of the year\n• An international affairs office\n• A student mentor or buddy\n• Active student associations\n\nContact the institute well before your arrival to prepare your installation.",
      suggestions: ["Student housing", "Transport", "Tunisian culture"],
      link: null
    }
  },

  // ─── CATÉGORIE 11 — Post-Admission ───────────────────────────────────────

  {
    id: 'post_accepted',
    keywords: ['accepté', 'admission', 'suite', 'ensuite', 'inscription', 'rentrée', 'après', 'confirmer', 'maintenant', 'next', 'confirmé'],
    response: {
      text: "Félicitations pour votre admission ! Prochaines étapes :\n\n1. Confirmez votre inscription depuis votre tableau de bord (bouton « Pré-inscription »)\n2. Remplissez le formulaire de pré-inscription administratif en ligne\n3. Payez les frais d'inscription selon les modalités de l'institut\n4. Préparez vos originaux pour la rentrée\n5. Participez à la journée d'accueil de l'institut\n\nVous avez généralement 2 semaines pour confirmer votre place.",
      suggestions: ["Frais de scolarité", "Vie étudiante en Tunisie"],
      link: { label: "Mes candidatures", path: "/dashboard/candidatures" }
    },
    response_en: {
      text: "Congratulations on your admission! Next steps:\n\n1. Confirm your enrollment from your dashboard (\"Pre-enrollment\" button)\n2. Fill in the administrative pre-enrollment form online\n3. Pay the registration fees according to the institute's terms\n4. Prepare your original documents for the start of term\n5. Attend the institute's orientation day\n\nYou generally have 2 weeks to confirm your spot.",
      suggestions: ["Tuition fees", "Student life in Tunisia"],
      link: { label: "My applications", path: "/dashboard/candidatures" }
    }
  },
  {
    id: 'post_interview',
    keywords: ['entretien', 'oral', 'préparer', 'questions', 'admission', 'interview', 'sélection', 'test', 'passage', 'jury'],
    response: {
      text: "Préparer votre entretien d'admission :\n\n• Connaître l'école : histoire, accréditations, valeurs\n• Votre projet professionnel : soyez précis sur votre orientation\n• Questions types : « Pourquoi cet institut ? », « Où vous voyez-vous dans 5 ans ? »\n• Tenue : professionnelle et soignée\n\nCertains programmes organisent aussi des tests de langue ou des épreuves écrites.",
      suggestions: ["Prérequis d'admission", "Comment candidater ?"],
      link: null
    },
    response_en: {
      text: "Preparing for your admission interview:\n\n• Know the school: history, accreditations, values\n• Your career plan: be precise about your direction\n• Typical questions: \"Why this institute?\", \"Where do you see yourself in 5 years?\"\n• Dress code: professional and neat\n\nSome programs also organize language tests or written exams.",
      suggestions: ["Admission prerequisites", "How do I apply?"],
      link: null
    }
  },
  {
    id: 'post_enrollment',
    keywords: ['inscription', 'administrative', 'dossier', 'rentrée', 'formalités', 'paperasse', 'enregistrement', 'officiel', 'administratif'],
    response: {
      text: "Inscription administrative en début d'année :\n\nDocuments généralement demandés à la rentrée :\n• Originaux de tous les diplômes\n• Pièce d'identité originale (CIN ou passeport)\n• Photos d'identité (4-6 photos)\n• Justificatif de domicile\n• Règlement des frais (ou première tranche)\n• Contrat de scolarité signé",
      suggestions: ["Accepté — que faire ?", "Frais de scolarité"],
      link: { label: "Mes candidatures", path: "/dashboard/candidatures" }
    },
    response_en: {
      text: "Administrative enrollment at the start of the year:\n\nDocuments generally required at the start of term:\n• Originals of all diplomas\n• Original ID (CIN or passport)\n• ID photos (4-6 photos)\n• Proof of address\n• Fee payment (or first installment)\n• Signed tuition contract",
      suggestions: ["Accepted — what next?", "Tuition fees"],
      link: { label: "My applications", path: "/dashboard/candidatures" }
    }
  },
  {
    id: 'post_rejected',
    keywords: ['refus', 'rejeté', 'alternative', 'repostuler', 'attente', 'refusé', 'recalé', 'retenu', 'rejected', 'rater'],
    response: {
      text: "Votre candidature a été refusée ? Ne vous découragez pas :\n\n1. Analysez les raisons — certains instituts communiquent les motifs\n2. Candidatez à d'autres programmes sur EduBridge\n3. Améliorez votre dossier : lettre de motivation, certifications\n4. Contactez l'institut pour un retour constructif\n5. Vérifiez votre liste d'attente\n\nNe vous limitez pas à un seul programme — diversifiez vos candidatures !",
      suggestions: ["Trouver d'autres programmes", "Comparer des programmes"],
      link: { label: "Rechercher des programmes", path: "/search" }
    },
    response_en: {
      text: "Your application was rejected? Don't be discouraged:\n\n1. Analyze the reasons — some institutes communicate feedback\n2. Apply to other programs on EduBridge\n3. Improve your file: cover letter, certifications\n4. Contact the institute for constructive feedback\n5. Check your waiting list\n\nDon't limit yourself to one program — diversify your applications!",
      suggestions: ["Find other programs", "Compare programs"],
      link: { label: "Search programs", path: "/search" }
    }
  },
];

// ─────────────────────────────────────────────────────────────────────────────

const FALLBACK_FR = {
  text: "Je n'ai pas bien compris votre question. Je peux vous aider sur les candidatures, programmes, instituts, accréditations, frais de scolarité, logement et vie étudiante en Tunisie.",
  suggestions: ["Comment candidater ?", "Trouver des programmes", "Vie étudiante en Tunisie"],
  link: { label: "Voir le guide complet", path: "/guide" }
};

const FALLBACK_EN = {
  text: "I didn't quite understand your question. I can help you with applications, programs, institutes, accreditations, tuition fees, housing and student life in Tunisia.",
  suggestions: ["How do I apply?", "Find programs", "Student life in Tunisia"],
  link: { label: "See the full guide", path: "/guide" }
};

/**
 * Traite un message et retourne la réponse dans la langue demandée.
 * Score : +3 match exact, +1 match partiel bidirectionnel.
 * @param {string} rawMessage
 * @param {'fr'|'en'} lang
 */
function processMessage(rawMessage, lang = 'fr') {
  const cleaned = rawMessage
    .toLowerCase()
    .trim()
    .replace(/[.,!?;:'"()\[\]]/g, ' ')
    .replace(/\s+/g, ' ');

  const words = cleaned.split(' ').filter(w => w.length > 2);

  let bestIntent = null;
  let bestScore = 0;

  for (const intent of INTENTS) {
    let score = 0;
    for (const word of words) {
      for (const keyword of intent.keywords) {
        if (word === keyword) {
          score += 3;
          break;
        }
        if (word.includes(keyword) || keyword.includes(word)) {
          score += 1;
          break;
        }
      }
    }
    if (score > bestScore) {
      bestScore = score;
      bestIntent = intent;
    }
  }

  if (bestScore === 0 || !bestIntent) {
    return lang === 'en' ? FALLBACK_EN : FALLBACK_FR;
  }

  if (lang === 'en' && bestIntent.response_en) {
    return bestIntent.response_en;
  }

  return bestIntent.response;
}

module.exports = { processMessage };
