-- =====================================================================
-- EduBridge — Seed PostgreSQL
-- Catalogue des 20 écoles d'ingénieurs privées tunisiennes
-- accréditées par l'Ordre des Ingénieurs Tunisiens (OIT)
-- Source primaire : Liste OIT du 29 août 2024
-- Sources secondaires : PDF coordonnées fourni par l'utilisateur,
--                        sites officiels des écoles, universite.tn, Wikipédia
-- Date de génération : 2026-04-13
--
-- CONVENTION IMPORTANTE :
--   - Tous les champs marqués NULL n'ont PAS été inventés.
--   - Ils correspondent à des données introuvables dans les sources publiques
--     accessibles au moment de la génération.
--   - Les commentaires "-- TODO" indiquent les champs à enrichir manuellement.
--   - Seules ESPRIT (id=6), MedTech (id=1) et POLYTECH Sousse (id=2)
--     ont été enrichies à partir de recherches web ciblées sur leurs
--     sites officiels.
-- =====================================================================

-- ---------------------------------------------------------------------
-- SCHÉMA
-- ---------------------------------------------------------------------

DROP TABLE IF EXISTS programs CASCADE;
DROP TABLE IF EXISTS institutions CASCADE;

CREATE TABLE institutions (
    id                  SERIAL PRIMARY KEY,
    short_name          VARCHAR(50)  NOT NULL,
    full_name_fr        TEXT         NOT NULL,
    full_name_ar        TEXT,
    type                VARCHAR(50)  DEFAULT 'École d''ingénieurs',
    status              VARCHAR(20)  DEFAULT 'privé',
    founded_year        INT,
    city                VARCHAR(100),
    address             TEXT,
    phone               VARCHAR(50),
    email               VARCHAR(255),
    website             VARCHAR(255),
    accreditation_body  VARCHAR(100),  -- ABET / EUR-ACE-CTI / EUR-ACE-ASIIN / EUR-ACE-QUACING
    description         TEXT,
    teaching_language   VARCHAR(50),
    ranking_national    INT,
    tuition_min_tnd     NUMERIC(10,2),
    tuition_max_tnd     NUMERIC(10,2),
    tuition_intl_eur    NUMERIC(10,2),
    logo_url            TEXT,
    facebook_url        TEXT,
    notes               TEXT
);

CREATE TABLE programs (
    id                          SERIAL PRIMARY KEY,
    institution_id              INT REFERENCES institutions(id) ON DELETE CASCADE,
    name                        VARCHAR(255) NOT NULL,
    level                       VARCHAR(50)  DEFAULT 'Ingénieur',
    duration_years              INT          DEFAULT 5,
    language                    VARCHAR(50)  DEFAULT 'Français',
    accreditation_valid_until   DATE,
    accreditation_status        VARCHAR(50)  DEFAULT 'accredited'
);

CREATE INDEX idx_programs_institution ON programs(institution_id);
CREATE INDEX idx_institutions_city    ON institutions(city);

-- ---------------------------------------------------------------------
-- INSTITUTIONS (20 écoles)
-- ---------------------------------------------------------------------

-- 1. MedTech (ENRICHIE)
INSERT INTO institutions (id, short_name, full_name_fr, full_name_ar, founded_year, city, address, phone, email, website, accreditation_body, description, teaching_language, tuition_min_tnd, tuition_max_tnd, tuition_intl_eur, facebook_url, notes) VALUES
(1, 'MedTech', 'Mediterranean Institute of Technology', 'المدرسة العليا الخاصة المتوسطية للتكنولوجيا', 2014, 'Tunis', 'Campus MSB-MedTech, Les Jardins du Lac II (près de Henkel), Berges du Lac 2, Tunis', '+216 70 016 100', 'admission@smu.tn', 'https://www.medtech.tn', 'ABET',
'Fondé en 2014, MedTech est l''école d''ingénieurs de la South Mediterranean University (SMU), créée en 2002 par le Pr. Mahmoud Triki. Première et seule école d''ingénieurs en Tunisie accréditée ABET (référence mondiale en ingénierie). Unique école d''ingénieurs en Tunisie dont les programmes sont entièrement dispensés en anglais. Approche pédagogique hands-on centrée sur projets, innovation et entrepreneuriat. 37% de nationalités représentées, 90% de professeurs PhD.',
'Anglais', NULL, NULL, NULL, 'https://www.facebook.com/medtech.tn/',
'Frais non publics — contacter admission@smu.tn. Partenariats : HEC Montréal, U. Michigan, IE Madrid, IESEG, EM Normandie. Avantage USA : frais réduits Michigan State.');

-- 2. POLYTECH Sousse (ENRICHIE)
INSERT INTO institutions (id, short_name, full_name_fr, full_name_ar, founded_year, city, address, phone, email, website, accreditation_body, description, teaching_language, notes) VALUES
(2, 'POLYTECH Sousse', 'École Polytechnique Privée de Sousse', 'المدرسة الخاصة للتقنيات بسوسة', 2009, 'Hammam Sousse', 'Rue Khlifa Karoui, Immeuble Zaâtir, 4054 Hammam Sousse', '+216 73 277 877', NULL, 'https://www.polytecsousse.tn', 'EUR-ACE / CTI',
'Fondée en 2009, 2e école privée à obtenir un agrément au titre de la nouvelle loi tunisienne sur l''enseignement supérieur privé. Portée par le Groupe de Formation et d''Ingénierie (GFI). Quatre voies : ingénieur, masters pro, formation continue, soutien CPGE. Accréditation EUR-ACE/CTI valide jusqu''au 31/12/2029 (l''une des plus longues du panel OIT 2024).',
'Français',
'Frais incluent DELF + 2 certifications + assurance maladie. Réduction 6% paiement comptant. Banque : BIAT Hammam Sousse, IBAN TN59 08905000091000564241, ordre GFI.');

-- 3. ULT — Université Libre de Tunis
INSERT INTO institutions (id, short_name, full_name_fr, full_name_ar, city, address, phone, website, accreditation_body, notes) VALUES
(3, 'ULT', 'Institut Supérieur Polytechnique Privé / Université Libre de Tunis', 'المعهد العالي الخاص للتقنيات المتعددة الجامعة الحرة بتونس', 'Tunis', '36 av. Louis Braille, Tunis 1002', '+216 71 902 491', 'https://www.ult-tunisie.com', 'EUR-ACE / ASIIN',
'TODO : enrichir description, frais, programmes, vie étudiante.');

-- 4. TEK-UP
INSERT INTO institutions (id, short_name, full_name_fr, full_name_ar, city, address, phone, website, accreditation_body, notes) VALUES
(4, 'TEK-UP', 'École Supérieure Privée de Technologies et de l''Ingénierie', 'المدرسة العليا الخاصة للتكنولوجيا والهندسة', 'Ariana', 'Borj Baccouche, Ariana', '+216 88 810 077', 'https://www.tek-up.de', 'EUR-ACE / QUACING',
'TODO : enrichir.');

-- 5. Polytechnique INTL
INSERT INTO institutions (id, short_name, full_name_fr, full_name_ar, city, address, phone, website, accreditation_body, notes) VALUES
(5, 'Polytechnique INTL', 'Polytechnique INTL', 'المدرسة الدولية الخاصة للتقنيات', 'Tunis', 'Berges du Lac, Tunis 1053', '+216 70 026 426', 'https://www.polytech-intl.tn', 'EUR-ACE / CTI',
'TODO : enrichir.');

-- 6. ESPRIT (ENRICHIE)
INSERT INTO institutions (id, short_name, full_name_fr, full_name_ar, founded_year, city, address, phone, email, website, accreditation_body, description, teaching_language, ranking_national, tuition_min_tnd, tuition_intl_eur, notes) VALUES
(6, 'ESPRIT', 'École Supérieure Privée d''Ingénierie et de Technologies', 'المدرسة العليا الخاصة للهندسة والتكنولوجيا', 2003, 'Ariana', 'Parc Technologique El Ghazala, Ariana 2088', '+216 81 371 371', 'contact@esprit.tn', 'https://www.esprit.tn', 'EUR-ACE / CTI',
'Fondée en 2003, ESPRIT est le plus grand établissement privé d''enseignement supérieur en Tunisie (5000+ étudiants, 240 enseignants permanents). Première école d''ingénieurs en Tunisie à obtenir l''accréditation EUR-ACE. Membre CDIO, affiliée Conférence des Grandes Écoles (CGE). Appartient depuis 2020 au groupe panafricain Honoris United Universities. Pédagogie par projets et par problèmes (PBL). Taux d''employabilité 86% à 6 mois. Classée 1ère école d''ingénieurs privée par Entreprises Magazine 2021.',
'Français', 1, 8400, 3000,
'Réductions familles 25%/30% (2e/3e enfant). Bourses au mérite jusqu''à 30%. Financement Fondation ESPRIT + Amen Bank, Zitouna, UBCI. Foyer I : 1050€ + 100€ caution. Admission : sami.sifi@esprit.tn / +216 98 709 816.');

-- 7. EPI Polytechnique Sousse
INSERT INTO institutions (id, short_name, full_name_fr, full_name_ar, city, address, phone, website, accreditation_body, notes) VALUES
(7, 'EPI Polytechnique Sousse', 'École Internationale Supérieure Privée Polytechnique de Sousse', 'المدرسة الدولية العليا الخاصة للتقنيات المتعددة بسوسة', 'Sousse', 'Sahloul, Sousse 4021', '+216 86 703 131', 'https://www.episousse.com.tn', 'EUR-ACE / ASIIN',
'TODO. Frais Groupe EPI : remise 6% paiement intégral, augmentation annuelle 5%, TVA 7% incluse. IBAN GFT : TN59 08905000091000645236.');

-- 8. ESAT
INSERT INTO institutions (id, short_name, full_name_fr, full_name_ar, city, address, phone, website, accreditation_body, notes) VALUES
(8, 'ESAT', 'École Supérieure Privée de l''Aéronautique et des Technologies', 'المدرسة العليا الخاصة للطيران والتكنولوجيا', 'Tunis', 'Charguia II, Tunis 2035', '+216 71 940 422', 'https://www.esat.ens.tn', 'EUR-ACE / ASIIN',
'TODO. Spécialité unique en Tunisie : Génie Aéronautique.');

-- 9. ESIET — UAS
INSERT INTO institutions (id, short_name, full_name_fr, full_name_ar, city, address, phone, website, accreditation_body, notes) VALUES
(9, 'ESIET-UAS', 'École Supérieure Privée d''Ingénieurs et d''Études Technologiques de Tunis - Université Arabe des Sciences', 'المدرسة العليا الخاصة للمهندسين والدراسات التكنولوجيا بتونس - الجامعة العربية للعلوم', 'Tunis', '18 rue Nelson Mandela, Tunis 1002', '+216 71 335 073', 'https://www.uas.ens.tn', 'EUR-ACE / CTI',
'TODO.');

-- 10. IPSAS
INSERT INTO institutions (id, short_name, full_name_fr, full_name_ar, city, address, phone, website, accreditation_body, notes) VALUES
(10, 'IPSAS', 'Institut Privé Polytechnique des Sciences Avancées de Sfax', 'المعهد العالي الخاص للتقنيات والعلوم المتقدمة بصفاقس', 'Sfax', 'Av. 5 Août, Sfax 3002', '+216 74 225 665', 'https://www.ipsas-ens.net', 'EUR-ACE / CTI',
'TODO. Spécialité rare en Tunisie : Génie Pétrolier.');

-- 11. IIT
INSERT INTO institutions (id, short_name, full_name_fr, full_name_ar, city, address, phone, website, accreditation_body, notes) VALUES
(11, 'IIT', 'Institut International Technologie - Université Nord Américaine Privée', 'المدرسة العليا الدولية الخاصة للتكنولوجيا بصفاقس', 'Sfax', 'Route Mharza km 1.5, Sfax 3003', '+216 87 738 377', 'https://www.iit-nau.com', 'EUR-ACE / ASIIN',
'TODO.');

-- 12. Iteam University
INSERT INTO institutions (id, short_name, full_name_fr, full_name_ar, city, address, phone, website, accreditation_body, notes) VALUES
(12, 'Iteam', 'École Supérieure Privée d''Ingénierie en Informatique et Administration des Affaires (Iteam University)', 'المدرسة العليا الخاصة للهندسة والاتصال', 'Tunis', '85 rue de Palestine, Tunis 1002', '+216 88 878 178', 'https://www.iteam-univ.tn', 'EUR-ACE / QUACING',
'TODO.');

-- 13. SESAME
INSERT INTO institutions (id, short_name, full_name_fr, full_name_ar, city, address, phone, website, accreditation_body, notes) VALUES
(13, 'SESAME', 'École Supérieure Privée des Sciences Appliquées et de Management', 'المدرسة العليا الخاصة للعلوم التطبيقية وإدارة الأعمال', 'Tunis', 'Parc Technologique El Ghazala, Tunis 2088', '+216 81 373 773', 'https://www.sesame.com.tn', 'EUR-ACE / ASIIN',
'TODO. Validité accréditation Génie Informatique : 14/10/2024 (à renouveler).');

-- 14. Polytech Monastir
INSERT INTO institutions (id, short_name, full_name_fr, full_name_ar, city, address, phone, website, accreditation_body, notes) VALUES
(14, 'Polytech Monastir', 'École Supérieure Polytechnique Privée de Monastir', 'المدرسة العليا الخاصة متعددة التقنيات بالمستير', 'Monastir', 'Av. Taieb M''hiri, Monastir 1111', '+216 86 771 011', 'https://www.polytechmonastir.tn', 'EUR-ACE / ASIIN',
'TODO. Statut accréditation : EN COURS.');

-- 15. IT Business School
INSERT INTO institutions (id, short_name, full_name_fr, full_name_ar, city, address, phone, website, accreditation_body, notes) VALUES
(15, 'ITBS', 'École Supérieure Privée des Technologies et de l''Information et de Management de Nabeul (IT Business School)', 'المدرسة العليا الخاصة لتكنولوجيا المعلومات وإدارة الأعمال بنابل', 'Nabeul', 'Route Hammamet, Nabeul 8000', '+216 87 766 888', 'https://www.itbs.tn', 'EUR-ACE / ASIIN',
'TODO. Statut accréditation : EN COURS.');

-- 16. SUPTECH
INSERT INTO institutions (id, short_name, full_name_fr, full_name_ar, city, address, phone, website, accreditation_body, notes) VALUES
(16, 'SUPTECH', 'École Supérieure Privée de Technologie et de Management', 'المدرسة العليا الخاصة للتكنولوجيا وإدارة الأعمال بتونس', 'Tunis', '22 av. de Madrid, Tunis 1000', '+216 88 663 777', 'https://www.suptech.tn', 'EUR-ACE / QUACING',
'TODO. Statut accréditation : EN COURS.');

-- 17. ESIP Gafsa
INSERT INTO institutions (id, short_name, full_name_fr, full_name_ar, city, address, phone, website, accreditation_body, notes) VALUES
(17, 'ESIP', 'École Supérieure d''Ingénieurs Privée de Gafsa', 'المدرسة العليا الخاصة للمهندسين بقفصة', 'Gafsa', 'Campus Zarrouk, Gafsa 2112', '+216 83 788 061', 'https://www.esip.tn', 'EUR-ACE / ASIIN',
'TODO. Statut accréditation : EN COURS. Seule école d''ingénieurs privée du Sud-Ouest tunisien.');

-- 18. MIT POLYTECH
INSERT INTO institutions (id, short_name, full_name_fr, full_name_ar, city, phone, website, accreditation_body, notes) VALUES
(18, 'MIT POLYTECH', 'École Polytechnique Méditerranéenne Privée de Tunis', 'المدرسة المتوسطية العليا الخاصة للتقنيات بتونس', 'Tunis', NULL, 'https://mit-polytech.tn', 'EUR-ACE / ASIIN',
'TODO. Statut accréditation : EN COURS. Coordonnées non listées dans le PDF Ministère 2024-2025 — à vérifier.');

-- 19. ESSAT Gabès
INSERT INTO institutions (id, short_name, full_name_fr, full_name_ar, city, address, phone, website, accreditation_body, notes) VALUES
(19, 'ESSAT', 'École Supérieure des Sciences Appliquées et Technologie Privée de Gabès', 'المدرسة العليا للعلوم التطبيقية والتكنولوجيا الخاصة بقابس', 'Gabès', 'Av. Abou El Kacem Chebbi, Gabès 6011', '+216 81 707 331', 'https://www.essat-gabes.com', 'EUR-ACE / ASIIN',
'TODO. Statut accréditation : EN COURS.');

-- 20. UPES Mégrine
INSERT INTO institutions (id, short_name, full_name_fr, full_name_ar, city, address, phone, website, accreditation_body, notes) VALUES
(20, 'UPES', 'Faculté Privée des Sciences de Gestion et de la Technologie UPES Mégrine', 'الكلية الخاصة لعلوم التصرف والتكنولوجيا بمقرين', 'Mégrine', '122 av. de la République, Mégrine 2033', '+216 71 426 354', 'https://www.upes-megrine.com', 'EUR-ACE / ASIIN',
'TODO. Statut accréditation : EN COURS.');

-- ---------------------------------------------------------------------
-- PROGRAMS (60+ programmes accrédités OIT au 29 août 2024)
-- ---------------------------------------------------------------------

-- MedTech (id=1)
INSERT INTO programs (institution_id, name, language, accreditation_valid_until) VALUES
(1, 'Computer Engineering',         'Anglais', '2024-08-31'),
(1, 'Renewable Energy Engineering', 'Anglais', '2024-08-31'),
(1, 'Software Engineering',         'Anglais', '2024-08-31');

-- POLYTECH Sousse (id=2)
INSERT INTO programs (institution_id, name, accreditation_valid_until) VALUES
(2, 'Génie Informatique',                '2029-12-31'),
(2, 'Génie Biotechnologie',              '2029-12-31'),
(2, 'Génie Électrique et Automatique',   '2029-12-31'),
(2, 'Génie Télécom et Réseaux',          '2029-12-31'),
(2, 'Génie Civil',                       '2029-12-31'),
(2, 'Génie Électromécanique',            '2029-12-31');

-- ULT (id=3)
INSERT INTO programs (institution_id, name, accreditation_valid_until, accreditation_status) VALUES
(3, 'Génie Civil',                              '2026-09-30', 'accredited'),
(3, 'Génie Électromécanique',                   '2025-01-19', 'accredited'),
(3, 'Génie Énergétique',                        '2025-01-19', 'accredited'),
(3, 'Génie Électrique et Informatique Industrielle', '2025-01-19', 'accredited'),
(3, 'Génie Biologique',                         '2025-01-19', 'accredited'),
(3, 'Industries Alimentaires',                  '2025-01-19', 'accredited'),
(3, 'Génie Informatique',                       NULL,         'in_progress'),
(3, 'Génie Industriel',                         NULL,         'in_progress');

-- TEK-UP (id=4)
INSERT INTO programs (institution_id, name, language, accreditation_valid_until) VALUES
(4, 'Computer Science Engineering', 'Anglais', '2025-09-07');

-- Polytechnique INTL (id=5)
INSERT INTO programs (institution_id, name, accreditation_valid_until) VALUES
(5, 'Informatique, Réseaux et Multimédia', '2028-08-31'),
(5, 'Mécatronique',                        '2028-08-31'),
(5, 'Génie Industriel',                    '2028-08-31');

-- ESPRIT (id=6)
INSERT INTO programs (institution_id, name, accreditation_valid_until) VALUES
(6, 'Génie Électromécanique',  '2028-12-31'),
(6, 'Génie Civil',              '2028-12-31'),
(6, 'Génie Informatique',       '2028-12-31'),
(6, 'Génie Télécommunication',  '2028-12-31');

-- EPI Polytechnique Sousse (id=7)
INSERT INTO programs (institution_id, name, accreditation_valid_until) VALUES
(7, 'Génie Électromécanique', '2025-09-30'),
(7, 'Génie Électrique',       '2025-09-30'),
(7, 'Génie Industriel',       '2025-09-30'),
(7, 'Génie Civil',            '2025-09-30'),
(7, 'Génie Informatique',     '2025-09-30');

-- ESAT (id=8)
INSERT INTO programs (institution_id, name, accreditation_valid_until) VALUES
(8, 'Génie Aéronautique', '2025-09-30'),
(8, 'Géomatique',         '2029-09-30');

-- ESIET-UAS (id=9)
INSERT INTO programs (institution_id, name, accreditation_valid_until) VALUES
(9, 'Génie Industriel',       '2026-08-31'),
(9, 'Génie Civil',            '2026-08-31'),
(9, 'Génie Électrique',       '2026-08-31'),
(9, 'Génie Électromécanique', '2026-08-31'),
(9, 'Génie Mécatronique',     '2026-08-31'),
(9, 'Génie Informatique',     '2026-08-31');

-- IPSAS (id=10)
INSERT INTO programs (institution_id, name, accreditation_valid_until) VALUES
(10, 'Génie Civil',           '2026-12-31'),
(10, 'Génie Électromécanique','2026-12-31'),
(10, 'Génie Informatique',    '2026-12-31'),
(10, 'Génie Pétrolier',       '2026-12-31'),
(10, 'Génie Industriel',      '2026-12-31');

-- IIT (id=11)
INSERT INTO programs (institution_id, name, accreditation_valid_until) VALUES
(11, 'Génie Informatique',  '2025-09-30'),
(11, 'Génie Industriel',    '2025-09-30'),
(11, 'Génie des Procédés',  '2026-09-30'),
(11, 'Génie Mécanique',     '2026-09-30');

-- Iteam (id=12)
INSERT INTO programs (institution_id, name, accreditation_valid_until) VALUES
(12, 'Génie Informatique', '2026-09-12');

-- SESAME (id=13)
INSERT INTO programs (institution_id, name, accreditation_valid_until) VALUES
(13, 'Génie Informatique', '2024-10-14');

-- Polytech Monastir (id=14)
INSERT INTO programs (institution_id, name, accreditation_status) VALUES
(14, 'Génie Informatique', 'in_progress'),
(14, 'Génie Électrique',   'in_progress');

-- IT Business School Nabeul (id=15)
INSERT INTO programs (institution_id, name, accreditation_status) VALUES
(15, 'Génie Informatique', 'in_progress');

-- SUPTECH (id=16)
INSERT INTO programs (institution_id, name, accreditation_status) VALUES
(16, 'Génie Informatique', 'in_progress');

-- ESIP Gafsa (id=17)
INSERT INTO programs (institution_id, name, accreditation_status) VALUES
(17, 'Génie Informatique', 'in_progress');

-- MIT POLYTECH (id=18)
INSERT INTO programs (institution_id, name, accreditation_status) VALUES
(18, 'Génie Informatique',                'in_progress'),
(18, 'Génie Mécatronique',                'in_progress'),
(18, 'Génie Industriel et Logistique',    'in_progress');

-- ESSAT Gabès (id=19)
INSERT INTO programs (institution_id, name, accreditation_status) VALUES
(19, 'Génie Informatique', 'in_progress'),
(19, 'Génie Électrique',   'in_progress');

-- UPES Mégrine (id=20)
INSERT INTO programs (institution_id, name, accreditation_status) VALUES
(20, 'Génie Informatique',                'in_progress'),
(20, 'Systèmes et Réseaux Informatiques', 'in_progress'),
(20, 'Informatique Industrielle',         'in_progress');

-- ---------------------------------------------------------------------
-- VÉRIFICATION
-- ---------------------------------------------------------------------
-- SELECT i.short_name, i.city, i.accreditation_body, COUNT(p.id) AS nb_programmes
-- FROM institutions i LEFT JOIN programs p ON p.institution_id = i.id
-- GROUP BY i.id ORDER BY i.id;

-- Fin du seed.
