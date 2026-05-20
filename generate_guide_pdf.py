"""
Génère un PDF détaillé de toutes les données de la page Guide.tsx (EduBridge).
Couvre les 9 sections : Visa, Bourses, Vie, Admission, Equivalence, Documents,
Securite, Culture et Contact.
Utilise fpdf2 - encodage ASCII latin-1 robuste.
"""

from fpdf import FPDF

OUTPUT = "guide_edubridge_donnees.pdf"

# ── Palette de couleurs ──────────────────────────────────────────────
BLUE       = (0, 113, 227)
BLUE_DARK  = (0, 60, 140)
GREEN      = (52, 168, 83)
ORANGE     = (255, 152, 0)
RED        = (220, 53, 69)
DARK       = (30, 30, 30)
GRAY       = (110, 110, 110)
LIGHT_GRAY = (240, 240, 240)
WHITE      = (255, 255, 255)
BLUE_BG    = (240, 247, 255)
GREEN_BG   = (240, 252, 244)
ORANGE_BG  = (255, 248, 235)
RED_BG     = (255, 242, 242)

PAGE_W     = 210
PAGE_H     = 297
MARGIN     = 14
CONTENT_W  = PAGE_W - 2 * MARGIN
LINE_H     = 5.2

# ── Table de conversion caractères spéciaux → latin-1 / ASCII ────────
_MAP = {
    "é":"e","è":"e","ê":"e","ë":"e",
    "à":"a","â":"a","ä":"a","á":"a",
    "ù":"u","û":"u","ü":"u","ú":"u",
    "î":"i","ï":"i","í":"i","ì":"i",
    "ô":"o","ö":"o","ó":"o","ò":"o",
    "ç":"c","Ç":"C",
    "É":"E","È":"E","Ê":"E","Ë":"E",
    "À":"A","Â":"A","Á":"A",
    "Ô":"O","Ö":"O","Ù":"U","Û":"U","Ü":"U","Î":"I","Ï":"I",
    "Æ":"AE","æ":"ae","Œ":"OE","œ":"oe",
    "’":"'","‘":"'","“":'"',"”":'"',
    "–":"-","—":"--","…":"...",
    "«":"<<","»":">>",
    " ":" ","°":"deg","×":"x",
    "🇫🇷":"[FR]","🇩🇿":"[DZ]","🇲🇦":"[MA]","🇸🇳":"[SN]",
    "🇨🇲":"[CM]","🇨🇮":"[CI]","🇬🇦":"[GA]","🇱🇧":"[LB]",
}

def s(text: str) -> str:
    """Rend le texte compatible fpdf (latin-1 / ASCII)."""
    result = []
    for ch in str(text):
        if ch in _MAP:
            result.append(_MAP[ch])
        elif ord(ch) < 256:
            result.append(ch)
        else:
            result.append("?")
    return "".join(result)


class PDF(FPDF):
    def __init__(self):
        super().__init__(orientation="P", unit="mm", format="A4")
        self.set_left_margin(MARGIN)
        self.set_right_margin(MARGIN)
        self.set_top_margin(MARGIN)
        self.set_auto_page_break(auto=True, margin=14)

    def header(self):
        if self.page_no() <= 1:
            return
        self.set_font("Helvetica", "I", 7)
        self.set_text_color(*GRAY)
        self.set_x(MARGIN)
        self.cell(CONTENT_W, 5, "EduBridge - Guide Etudiant Etranger en Tunisie - Donnees completes", align="C")
        self.ln(2)
        self.set_draw_color(200, 200, 200)
        self.line(MARGIN, self.get_y(), PAGE_W - MARGIN, self.get_y())
        self.ln(3)
        self.set_text_color(*DARK)

    def footer(self):
        self.set_y(-12)
        self.set_font("Helvetica", "I", 7)
        self.set_text_color(*GRAY)
        self.set_x(MARGIN)
        self.cell(CONTENT_W, 5, f"Page {self.page_no()}", align="C")
        self.set_text_color(*DARK)

    # ── Blocs typographiques ─────────────────────────────────────────

    def section_title(self, num: str, title: str, color=BLUE_DARK):
        """Titre de section avec banderole colorée pleine largeur."""
        self.ln(2)
        self.set_fill_color(*BLUE_BG)
        self.set_draw_color(*BLUE)
        self.set_line_width(0.5)
        self.set_x(MARGIN)
        self.set_font("Helvetica", "B", 13)
        self.set_text_color(*BLUE_DARK)
        self.cell(CONTENT_W, 9, s(f"  {num}  {title}"), border="L", fill=True, ln=True)
        self.ln(3)
        self.set_text_color(*DARK)

    def sub_title(self, title: str, color=BLUE_DARK):
        self.ln(2)
        self.set_font("Helvetica", "B", 11)
        self.set_text_color(*color)
        self.set_x(MARGIN)
        self.multi_cell(CONTENT_W, 7, s(title))
        self.set_draw_color(*color)
        self.set_line_width(0.3)
        self.line(MARGIN, self.get_y(), MARGIN + 70, self.get_y())
        self.ln(3)
        self.set_text_color(*DARK)

    def label_value(self, label: str, value: str, label_w: float = 50):
        self.set_font("Helvetica", "B", 9)
        self.set_text_color(*BLUE_DARK)
        self.set_x(MARGIN + 4)
        self.cell(label_w, LINE_H, s(label + " :"))
        self.set_font("Helvetica", "", 9)
        self.set_text_color(*DARK)
        remaining = CONTENT_W - label_w - 4
        self.multi_cell(remaining, LINE_H, s(value))

    def body(self, text: str):
        self.set_font("Helvetica", "", 9)
        self.set_text_color(*DARK)
        self.set_x(MARGIN)
        self.multi_cell(CONTENT_W, LINE_H, s(text))
        self.ln(1)

    def bullet(self, text: str, color=DARK, indent: int = 6):
        self.set_font("Helvetica", "", 8.5)
        self.set_text_color(*color)
        self.set_x(MARGIN + indent)
        self.cell(4, LINE_H, chr(149))
        remaining = CONTENT_W - indent - 4
        self.multi_cell(remaining, LINE_H, s(text))

    def tag(self, text: str, bg: tuple, fg: tuple):
        """Petit badge/tag inline."""
        self.set_fill_color(*bg)
        self.set_text_color(*fg)
        self.set_font("Helvetica", "B", 8)
        self.set_x(MARGIN + 4)
        self.cell(0, 6, s(f"  {text}  "), fill=True, ln=True)
        self.set_text_color(*DARK)

    def info_box(self, text: str, bg=BLUE_BG, border_color=BLUE):
        self.ln(1)
        self.set_fill_color(*bg)
        self.set_draw_color(*border_color)
        self.set_line_width(0.8)
        self.set_x(MARGIN)
        self.set_font("Helvetica", "I", 8.5)
        self.set_text_color(*DARK)
        # Bordure gauche simulée par un filet
        x = MARGIN
        y = self.get_y()
        self.multi_cell(CONTENT_W, LINE_H, s(text), fill=True)
        self.line(x, y, x, self.get_y())
        self.set_line_width(0.2)
        self.ln(2)

    def step_card(self, num: int, title: str, delay: str, desc: str, docs: list):
        """Carte d'étape (visa / admission)."""
        self.ln(2)
        self.set_fill_color(*BLUE_BG)
        self.set_x(MARGIN)
        # Numéro
        self.set_font("Helvetica", "B", 10)
        self.set_text_color(*WHITE)
        self.set_fill_color(*BLUE)
        self.cell(8, 8, s(str(num)), align="C", fill=True)
        # Titre
        self.set_fill_color(*BLUE_BG)
        self.set_text_color(*BLUE_DARK)
        self.set_font("Helvetica", "B", 10)
        self.cell(CONTENT_W - 8 - 38, 8, s(f"  {title}"), fill=True)
        # Délai
        self.set_fill_color(*ORANGE_BG)
        self.set_text_color(*ORANGE)
        self.set_font("Helvetica", "BI", 8)
        self.cell(38, 8, s(f" Delai : {delay}"), fill=True, ln=True)
        # Description
        self.set_fill_color(250, 252, 255)
        self.set_text_color(*DARK)
        self.set_font("Helvetica", "", 8.5)
        self.set_x(MARGIN)
        self.multi_cell(CONTENT_W, LINE_H, s(desc), fill=True)
        # Documents
        if docs:
            self.set_x(MARGIN + 2)
            self.set_font("Helvetica", "B", 8)
            self.set_text_color(*BLUE_DARK)
            self.cell(0, LINE_H, s("Documents requis :"), ln=True)
            for doc in docs:
                self.bullet(doc, color=(50, 80, 130))
        self.ln(2)

    def scholarship_card(self, nom: str, typ: str, montant: str, eligib: str,
                         deadline: str, desc: str, lien: str):
        """Carte bourse."""
        self.ln(2)
        # Couleur selon type
        type_colors = {
            "gouvernementale": (GREEN_BG, GREEN, "Gouvernementale"),
            "internationale":  (BLUE_BG, BLUE, "Internationale"),
            "institutionnelle":(ORANGE_BG, ORANGE, "Institutionnelle"),
        }
        bg, fg, label = type_colors.get(typ, (LIGHT_GRAY, DARK, typ))

        self.set_fill_color(*bg)
        self.set_x(MARGIN)
        # En-tête
        self.set_font("Helvetica", "B", 10)
        self.set_text_color(*BLUE_DARK)
        name_w = CONTENT_W - 42
        self.cell(name_w, 8, s(nom), fill=True)
        self.set_fill_color(*bg)
        self.set_text_color(*fg)
        self.set_font("Helvetica", "B", 8)
        self.cell(42, 8, s(f" {label}"), fill=True, ln=True)
        # Corps
        self.set_fill_color(252, 253, 255)
        self.set_x(MARGIN)
        # Montant
        self.set_font("Helvetica", "B", 11)
        self.set_text_color(*BLUE)
        self.cell(0, 7, s(montant), fill=True, ln=True)
        # Infos
        self.label_value("Eligibilite", eligib)
        self.label_value("Deadline", deadline)
        self.label_value("Lien", lien)
        self.set_font("Helvetica", "I", 8.5)
        self.set_text_color(80, 80, 80)
        self.set_x(MARGIN + 4)
        self.multi_cell(CONTENT_W - 4, LINE_H, s(desc))
        self.set_text_color(*DARK)
        self.ln(1)

    def table_header(self, cols: list, widths: list):
        self.set_fill_color(*BLUE_DARK)
        self.set_text_color(*WHITE)
        self.set_font("Helvetica", "B", 8)
        self.set_x(MARGIN)
        for col, w in zip(cols, widths):
            self.cell(w, 6, s(col), border=1, fill=True)
        self.ln()

    def table_row(self, cells: list, widths: list, even: bool = False):
        self.set_fill_color(248, 250, 255) if even else self.set_fill_color(255, 255, 255)
        self.set_text_color(*DARK)
        self.set_font("Helvetica", "", 8)
        self.set_x(MARGIN)
        for cell, w in zip(cells, widths):
            self.cell(w, 5.5, s(str(cell)), border=1, fill=True)
        self.ln()

    def divider(self):
        self.set_draw_color(210, 220, 240)
        self.set_line_width(0.2)
        self.line(MARGIN, self.get_y() + 1, PAGE_W - MARGIN, self.get_y() + 1)
        self.ln(4)


# ====================================================================
# Contenu du document
# ====================================================================

def page_titre(pdf: PDF):
    pdf.add_page()
    pdf.set_y(40)

    # Logo texte
    pdf.set_font("Helvetica", "B", 32)
    pdf.set_text_color(*BLUE)
    pdf.set_x(MARGIN)
    pdf.cell(CONTENT_W, 16, "EduBridge", align="C", ln=True)

    pdf.set_font("Helvetica", "B", 16)
    pdf.set_text_color(*DARK)
    pdf.set_x(MARGIN)
    pdf.cell(CONTENT_W, 9, "Guide complet de l'etudiant etranger en Tunisie", align="C", ln=True)

    pdf.set_font("Helvetica", "", 11)
    pdf.set_text_color(*GRAY)
    pdf.set_x(MARGIN)
    pdf.cell(CONTENT_W, 7, "Documentation exhaustive de toutes les donnees affichees dans la page Guide", align="C", ln=True)

    pdf.ln(6)
    pdf.set_draw_color(*BLUE)
    pdf.set_line_width(0.8)
    pdf.line(MARGIN + 15, pdf.get_y(), PAGE_W - MARGIN - 15, pdf.get_y())
    pdf.ln(10)

    # Statistiques clés
    pdf.set_font("Helvetica", "B", 13)
    pdf.set_text_color(*BLUE_DARK)
    pdf.set_x(MARGIN)
    pdf.cell(CONTENT_W, 8, "Chiffres cles de la Tunisie etudiante", align="C", ln=True)
    pdf.ln(4)

    stats = [
        ("15 000+", "Etudiants etrangers accueillis chaque annee"),
        ("180+",    "Nationalites representees sur les campus"),
        ("45+",     "Accords bilateraux et de cooperation actifs"),
    ]
    box_w = (CONTENT_W - 8) / 3
    for i, (val, lbl) in enumerate(stats):
        x = MARGIN + i * (box_w + 4)
        y = pdf.get_y()
        pdf.set_fill_color(*BLUE_BG)
        pdf.rect(x, y, box_w, 20, "F")
        pdf.set_font("Helvetica", "B", 18)
        pdf.set_text_color(*BLUE)
        pdf.set_xy(x, y + 2)
        pdf.cell(box_w, 9, s(val), align="C")
        pdf.set_font("Helvetica", "", 8)
        pdf.set_text_color(*GRAY)
        pdf.set_xy(x, y + 12)
        pdf.cell(box_w, 6, s(lbl), align="C")
    pdf.ln(24)

    # Sections couvertes
    pdf.set_font("Helvetica", "B", 11)
    pdf.set_text_color(*BLUE_DARK)
    pdf.set_x(MARGIN)
    pdf.cell(CONTENT_W, 7, "Sections documentees dans ce rapport", ln=True)
    pdf.ln(2)

    sections = [
        ("1", "Visa & Sejour (5 etapes detaillees)"),
        ("2", "Bourses disponibles (8 programmes)"),
        ("3", "Vie en Tunisie - Budget, Couts, Logements"),
        ("4", "Processus d'Admission (5 etapes)"),
        ("5", "Equivalence par pays (8 pays)"),
        ("6", "Checklist Documents (22 items, 5 categories)"),
        ("7", "Securite - Numeros d'urgence + 8 conseils"),
        ("8", "Vie culturelle et integration (6 themes)"),
        ("9", "Contact EduBridge"),
    ]
    for num, desc in sections:
        pdf.set_fill_color(*BLUE_BG)
        pdf.set_font("Helvetica", "", 9)
        pdf.set_text_color(*DARK)
        pdf.set_x(MARGIN + 10)
        pdf.cell(6, 6, s(num + "."), fill=True)
        pdf.cell(CONTENT_W - 16, 6, s(desc), fill=True, ln=True)
        pdf.ln(0.5)

    pdf.ln(12)
    pdf.set_font("Helvetica", "I", 8)
    pdf.set_text_color(*GRAY)
    pdf.set_x(MARGIN)
    pdf.cell(CONTENT_W, 6, "Document genere automatiquement depuis staticData.ts - EduBridge 2026", align="C")


# ── SECTION 1 : VISA ─────────────────────────────────────────────────
def section_visa(pdf: PDF):
    pdf.add_page()
    pdf.section_title("SECTION 1", "Visa & Sejour - Procedure complete")

    pdf.info_box(
        "Delai global estime : 6 a 10 semaines avant le depart. "
        "EduBridge peut fournir une attestation d'admission officielle "
        "pour accelerer le traitement consulaire."
    )

    etapes = [
        {
            "numero": 1,
            "titre": "Constitution du dossier (avant le depart)",
            "delai": "1 a 2 semaines",
            "description": (
                "Reunissez tous les documents officiels exiges par l'ambassade de Tunisie "
                "de votre pays de residence. Faites traduire et legaliser ce qui doit l'etre."
            ),
            "documents": [
                "Passeport valide au moins 6 mois apres la date d'entree",
                "Lettre d'admission officielle de l'etablissement tunisien",
                "Justificatif de ressources financieres (releves bancaires, attestation de bourse)",
                "4 photos d'identite recentes aux normes",
                "Formulaire de demande de visa rempli et signe",
                "Justificatif de logement provisoire en Tunisie",
                "Assurance maladie internationale couvrant le sejour",
            ],
        },
        {
            "numero": 2,
            "titre": "Depot du dossier a l'ambassade de Tunisie",
            "delai": "Le jour du rendez-vous",
            "description": (
                "Prenez rendez-vous aupres de l'ambassade ou du consulat le plus proche. "
                "Le depot se fait en personne. Conservez precieusement le recepisse."
            ),
            "documents": [
                "Dossier complet (etape 1)",
                "Formulaire de demande visa long sejour etudiant (type D)",
                "Recu de paiement des frais consulaires",
            ],
        },
        {
            "numero": 3,
            "titre": "Obtention du visa long sejour (type D)",
            "delai": "2 a 4 semaines",
            "description": (
                "L'ambassade examine votre dossier et delivre, en cas de validation, "
                "un visa etudiant longue duree vous autorisant a entrer sur le territoire tunisien."
            ),
            "documents": [
                "Recepisse de depot",
                "Piece d'identite originale",
            ],
        },
        {
            "numero": 4,
            "titre": "Arrivee en Tunisie et declaration aupres des autorites",
            "delai": "Sous 48 heures apres l'arrivee",
            "description": (
                "Une fois sur place, vous devez vous presenter au poste de police ou "
                "a la garde nationale du lieu de residence dans les 48 heures suivant votre entree."
            ),
            "documents": [
                "Passeport tamponne a l'entree",
                "Visa etudiant en cours de validite",
                "Justificatif d'adresse provisoire (reservation, attestation d'hebergement)",
            ],
        },
        {
            "numero": 5,
            "titre": "Demande de la carte de sejour etudiante",
            "delai": "4 a 6 semaines",
            "description": (
                "Indispensable au-dela de 3 mois. Elle se demande a la direction regionale "
                "de la surete. Cette carte vous permet de circuler librement et d'effectuer "
                "toutes les demarches administratives."
            ),
            "documents": [
                "Passeport et visa",
                "Lettre d'admission de l'institut",
                "Justificatif de domicile en Tunisie",
                "4 photos d'identite",
                "Formulaire administratif local",
                "Timbre fiscal",
            ],
        },
    ]

    for e in etapes:
        pdf.step_card(e["numero"], e["titre"], e["delai"], e["description"], e["documents"])


# ── SECTION 2 : BOURSES ──────────────────────────────────────────────
def section_bourses(pdf: PDF):
    pdf.add_page()
    pdf.section_title("SECTION 2", "Bourses disponibles - 8 programmes de financement")

    pdf.body(
        "Le tableau ci-dessous recapitule les 8 bourses referencees dans le guide, "
        "avec leurs montants, conditions d'eligibilite et deadlines de candidature."
    )

    bourses = [
        {
            "nom": "Bourse du gouvernement tunisien",
            "type": "gouvernementale",
            "montant": "180 - 250 TND/mois",
            "eligibilite": "Etudiants ressortissants des pays lies a la Tunisie par un accord bilateral.",
            "deadline": "30 juin 2026",
            "description": (
                "Bourse historique de cooperation couvrant frais de scolarite, "
                "hebergement en cite universitaire et allocation mensuelle."
            ),
            "lien": "www.mesrs.tn",
        },
        {
            "nom": "Erasmus+ - Mobilite internationale",
            "type": "internationale",
            "montant": "700 - 850 EUR/mois",
            "eligibilite": "Etudiants inscrits dans une universite europeenne partenaire d'un institut tunisien.",
            "deadline": "15 juillet 2026",
            "description": (
                "Programme europeen financant la mobilite entrante vers la Tunisie "
                "pour des sejours d'etudes d'un semestre a un an."
            ),
            "lien": "erasmus-plus.ec.europa.eu",
        },
        {
            "nom": "Bourse de la Francophonie (OIF)",
            "type": "internationale",
            "montant": "600 EUR/mois",
            "eligibilite": "Etudiants ressortissants des Etats membres de l'OIF, niveau master ou doctorat.",
            "deadline": "30 septembre 2026",
            "description": (
                "Programme de mobilite de l'Organisation Internationale de la Francophonie "
                "pour soutenir la circulation des savoirs en espace francophone."
            ),
            "lien": "www.francophonie.org",
        },
        {
            "nom": "Campus France - Cooperation franco-tunisienne",
            "type": "internationale",
            "montant": "767 EUR/mois",
            "eligibilite": "Etudiants francais en mobilite vers la Tunisie, tous niveaux.",
            "deadline": "31 aout 2026",
            "description": (
                "Programme bilateral facilitant l'accueil des etudiants francais "
                "dans les etablissements tunisiens partenaires."
            ),
            "lien": "www.campusfrance.org",
        },
        {
            "nom": "Bourse de l'Union Africaine",
            "type": "internationale",
            "montant": "500 USD/mois",
            "eligibilite": "Etudiants ressortissants d'un Etat membre de l'Union Africaine, hors Tunisie.",
            "deadline": "15 octobre 2026",
            "description": (
                "Programme panafricain de l'UA destine a renforcer "
                "la mobilite estudiantine intra-continentale."
            ),
            "lien": "au.int/en/scholarships",
        },
        {
            "nom": "Banque Islamique de Developpement (BID)",
            "type": "internationale",
            "montant": "Couverture complete",
            "eligibilite": "Etudiants des pays membres de l'OCI, en filieres scientifiques.",
            "deadline": "31 juillet 2026",
            "description": (
                "Bourse complete couvrant frais de scolarite, transport international, "
                "hebergement et allocation mensuelle."
            ),
            "lien": "www.isdb.org/scholarships",
        },
        {
            "nom": "Cooperation MAEC Maroc-Tunisie",
            "type": "gouvernementale",
            "montant": "200 TND/mois + scolarite",
            "eligibilite": "Etudiants marocains, dans le cadre de la reciprocite culturelle.",
            "deadline": "15 juin 2026",
            "description": (
                "Programme de reciprocite avec le Maroc accordant la gratuite "
                "des etudes et une allocation mensuelle."
            ),
            "lien": "www.diplomatie.ma",
        },
        {
            "nom": "Bourses EduBridge - Instituts partenaires",
            "type": "institutionnelle",
            "montant": "30 - 100% des frais",
            "eligibilite": "Etudiants etrangers admis dans un institut partenaire EduBridge.",
            "deadline": "30 novembre 2026",
            "description": (
                "Bourses au merite financees par les instituts partenaires EduBridge "
                "et attribuees selon le dossier academique."
            ),
            "lien": "support.international@edubridge.tn",
        },
    ]

    for b in bourses:
        pdf.scholarship_card(
            b["nom"], b["type"], b["montant"],
            b["eligibilite"], b["deadline"], b["description"], b["lien"]
        )


# ── SECTION 3 : VIE EN TUNISIE ───────────────────────────────────────
def section_vie(pdf: PDF):
    pdf.add_page()
    pdf.section_title("SECTION 3", "Vie en Tunisie - Budget, Couts et Logements")

    # 3a - Budget mensuel
    pdf.sub_title("3.1  Budget mensuel compare (TND)")

    pdf.body("Comparaison entre un etudiant en cite universitaire et un etudiant en logement prive.")

    headers = ["Poste de depense", "Cite univ. (TND)", "Logement prive (TND)"]
    widths  = [80, 52, 52]
    pdf.table_header(headers, widths)
    rows = [
        ("Logement",          "150",  "400"),
        ("Restauration univ.","80",   "80"),
        ("Courses alimentaires","150","150"),
        ("Divers / loisirs",  "100",  "100"),
    ]
    for i, row in enumerate(rows):
        pdf.table_row(list(row), widths, even=(i % 2 == 0))
    # Totaux
    pdf.set_fill_color(*BLUE_DARK)
    pdf.set_text_color(*WHITE)
    pdf.set_font("Helvetica", "B", 9)
    pdf.set_x(MARGIN)
    pdf.cell(80, 6, "TOTAL MENSUEL ESTIME", border=1, fill=True)
    pdf.cell(52, 6, "480 TND", border=1, fill=True, align="C")
    pdf.cell(52, 6, "730 TND", border=1, fill=True, align="C")
    pdf.ln(6)

    # 3b - Tableau cout de la vie
    pdf.sub_title("3.2  Tableau du cout de la vie quotidienne")
    headers2 = ["Poste", "Cout en TND", "Cout en EUR"]
    widths2  = [90, 42, 42]
    pdf.table_header(headers2, widths2)
    couts = [
        ("Repas restaurant universitaire",     "0,8 - 1,5 TND",   "0,25 - 0,45 EUR"),
        ("Cafe en terrasse",                    "2 - 4 TND",        "0,60 - 1,20 EUR"),
        ("Courses alimentaires (semaine, 1p)",  "70 - 120 TND",     "21 - 36 EUR"),
        ("Loyer chambre cite universitaire",    "80 - 200 TND",     "24 - 60 EUR"),
        ("Studio meuble en ville",              "350 - 600 TND",    "105 - 180 EUR"),
        ("Abonnement telephone + data",         "20 - 40 TND",      "6 - 12 EUR"),
        ("Coupe de cheveux",                    "8 - 20 TND",       "2,40 - 6 EUR"),
        ("Place de cinema",                     "8 - 12 TND",       "2,40 - 3,60 EUR"),
    ]
    for i, row in enumerate(couts):
        pdf.table_row(list(row), widths2, even=(i % 2 == 0))
    pdf.ln(4)

    # 3c - Options de logement
    pdf.sub_title("3.3  Options de logement disponibles")
    logements = [
        {
            "titre": "Cite universitaire publique",
            "prix": "80 - 200 TND / mois",
            "avantages": [
                "Tarifs tres accessibles, subventionnes par l'Etat",
                "Proximite immediate des campus",
                "Communaute etudiante internationale presente",
                "Restaurant universitaire a proximite",
            ],
            "inconvenients": [
                "Capacite limitee - demande a deposer tot",
                "Confort sommaire (chambre partagee, mobilier basique)",
                "Reglement interieur strict (horaires, visites)",
            ],
            "conseil": (
                "Deposez votre demande des l'admission obtenue. "
                "Les places sont attribuees en priorite aux boursiers."
            ),
        },
        {
            "titre": "Residence etudiante privee",
            "prix": "350 - 600 TND / mois",
            "avantages": [
                "Standing eleve : studio meuble, internet, securite",
                "Services inclus (menage, blanchisserie, salle de sport)",
                "Souplesse contractuelle (locations a la rentree)",
            ],
            "inconvenients": [
                "Cout significativement plus eleve qu'en cite publique",
                "Caution importante a prevoir (souvent 2 mois)",
                "Disponibilite limitee dans les grandes villes",
            ],
            "conseil": (
                "Visitez systematiquement avant de signer et exigez "
                "un etat des lieux ecrit et signe a l'entree."
            ),
        },
        {
            "titre": "Colocation en appartement",
            "prix": "200 - 350 TND / mois",
            "avantages": [
                "Bon compromis entre cout et confort",
                "Vie sociale stimulante",
                "Espace de vie plus large qu'en chambre",
            ],
            "inconvenients": [
                "Trouver des colocataires fiables prend du temps",
                "Conflits possibles sur les charges et le menage",
                "Bail commun a negocier avec le proprietaire",
            ],
            "conseil": (
                "Preferez les colocations proposees par d'autres etudiants "
                "deja sur place via les groupes communautaires officiels."
            ),
        },
    ]

    for lg in logements:
        pdf.ln(2)
        pdf.set_fill_color(*BLUE_BG)
        pdf.set_font("Helvetica", "B", 10)
        pdf.set_text_color(*BLUE_DARK)
        pdf.set_x(MARGIN)
        pdf.cell(CONTENT_W - 50, 7, s(lg["titre"]), fill=True)
        pdf.set_fill_color(*ORANGE_BG)
        pdf.set_text_color(*ORANGE)
        pdf.cell(50, 7, s(lg["prix"]), fill=True, align="C", ln=True)

        pdf.set_font("Helvetica", "B", 8)
        pdf.set_text_color(GREEN[0], GREEN[1], GREEN[2])
        pdf.set_x(MARGIN + 3)
        pdf.cell(0, 5, "Avantages :", ln=True)
        for av in lg["avantages"]:
            pdf.bullet(av, color=GREEN)

        pdf.set_font("Helvetica", "B", 8)
        pdf.set_text_color(*RED)
        pdf.set_x(MARGIN + 3)
        pdf.cell(0, 5, "Inconvenients :", ln=True)
        for inc in lg["inconvenients"]:
            pdf.bullet(inc, color=RED)

        pdf.set_font("Helvetica", "BI", 8.5)
        pdf.set_text_color(60, 80, 130)
        pdf.set_x(MARGIN + 5)
        pdf.set_draw_color(*BLUE)
        pdf.set_line_width(0.5)
        x0 = MARGIN + 4
        y0 = pdf.get_y()
        pdf.multi_cell(CONTENT_W - 5, LINE_H, s("Conseil : " + lg["conseil"]))
        pdf.line(x0, y0, x0, pdf.get_y())
        pdf.set_text_color(*DARK)
        pdf.ln(2)

    # 3d - Assurance maladie
    pdf.ln(2)
    pdf.set_fill_color(*BLUE_BG)
    pdf.set_draw_color(*BLUE)
    pdf.set_line_width(0.8)
    pdf.set_x(MARGIN)
    pdf.set_font("Helvetica", "B", 10)
    pdf.set_text_color(*BLUE_DARK)
    pdf.cell(CONTENT_W, 7, "  Assurance maladie", border="L", fill=True, ln=True)
    pdf.set_line_width(0.2)

    health_items = [
        "CNAM : les etudiants etrangers peuvent adherer a la Caisse Nationale d'Assurance Maladie tunisienne moyennant cotisation.",
        "Mutuelle complementaire : recommandee pour couvrir ce que la CNAM ne prend pas en charge.",
        "Important : verifiez que votre assurance internationale couvre le rapatriement sanitaire avant le depart.",
    ]
    for item in health_items:
        pdf.bullet(item, color=(30, 60, 130))


# ── SECTION 4 : ADMISSION ────────────────────────────────────────────
def section_admission(pdf: PDF):
    pdf.add_page()
    pdf.section_title("SECTION 4", "Processus d'Admission - 5 etapes officielles")

    etapes_adm = [
        {
            "numero": 1,
            "titre": "Candidature en ligne",
            "deadline": "31 mai 2026",
            "description": (
                "Creez votre compte sur EduBridge ou sur le portail du ministere de l'Enseignement superieur. "
                "Selectionnez les programmes qui correspondent a votre projet et constituez votre dossier."
            ),
            "documents": [
                "Compte EduBridge actif",
                "Selection du ou des programmes souhaites",
                "Lettre de motivation redigee dans le formulaire de candidature",
                "Informations personnelles et academiques completees",
            ],
        },
        {
            "numero": 2,
            "titre": "Soumission et validation des documents",
            "deadline": "30 juin 2026",
            "description": (
                "Televersez les pieces officielles demandees : diplomes, releves de notes, "
                "piece d'identite. Les originaux peuvent etre verifies a un stade ulterieur."
            ),
            "documents": [
                "Diplome du baccalaureat ou equivalent (scan PDF ou image)",
                "Releves de notes des trois dernieres annees",
                "Passeport en cours de validite (numero saisi dans le profil)",
                "Lettre de recommandation (si demandee par le programme)",
            ],
        },
        {
            "numero": 3,
            "titre": "Test de niveau ou entretien",
            "deadline": "15 juillet 2026",
            "description": (
                "Selon le programme, un test ecrit, un entretien visioconference ou une evaluation "
                "linguistique peuvent etre organises. Preparez-vous au format communique."
            ),
            "documents": [
                "Convocation officielle recue par email",
                "Piece d'identite valide le jour J",
                "Justificatifs academiques originaux",
            ],
        },
        {
            "numero": 4,
            "titre": "Lettre d'admission officielle",
            "deadline": "15 aout 2026",
            "description": (
                "Vous recevez par email la lettre d'admission signee par l'institut. "
                "Ce document est indispensable pour la demande de visa et la carte de sejour."
            ),
            "documents": [
                "Lettre d'admission imprimee",
                "Recu de paiement des frais de reservation (si applicable)",
            ],
        },
        {
            "numero": 5,
            "titre": "Inscription administrative sur place",
            "deadline": "30 septembre 2026",
            "description": (
                "A votre arrivee en Tunisie, finalisez l'inscription au sein de l'institut. "
                "Vous recevrez votre carte d'etudiant et l'acces aux ressources pedagogiques."
            ),
            "documents": [
                "Lettre d'admission originale",
                "Diplomes originaux a presenter",
                "Justificatif de paiement de la scolarite",
                "Carte de sejour ou recepisse",
            ],
        },
    ]

    for e in etapes_adm:
        pdf.step_card(e["numero"], e["titre"], e["deadline"], e["description"], e["documents"])


# ── SECTION 5 : EQUIVALENCES ─────────────────────────────────────────
def section_equivalences(pdf: PDF):
    pdf.add_page()
    pdf.section_title("SECTION 5", "Equivalences par pays - 8 pays references")

    pdf.info_box(
        "Le CNEQ (Centre National pour l'Evaluation des Qualifications) est l'organisme "
        "officiel tunisien charge de la reconnaissance des diplomes etrangers. "
        "Site : www.mesrs.tn. Delai moyen : 4 a 12 semaines selon le pays."
    )

    pays_list = [
        {
            "pays": "France [FR]",
            "systeme": "Systeme LMD (Licence-Master-Doctorat). Le baccalaureat francais est reconnu directement.",
            "procedure": "Depot au CNEQ avec diplomes originaux, releves et traduction officielle. Procedure simplifiee.",
            "organisme": "CNEQ - Centre National pour l'Evaluation des Qualifications",
            "delai": "4 a 6 semaines",
        },
        {
            "pays": "Algerie [DZ]",
            "systeme": "Systeme LMD aligne sur le modele europeen. Reconnaissance simplifiee dans le cadre maghrebin.",
            "procedure": "Depot direct au CNEQ avec apostille de La Haye ou legalisation consulaire.",
            "organisme": "CNEQ + Ambassade d'Algerie a Tunis",
            "delai": "4 a 8 semaines",
        },
        {
            "pays": "Maroc [MA]",
            "systeme": "Systeme LMD avec specificites locales. Reconnaissance facilitee par l'accord de reciprocite.",
            "procedure": "Procedure CNEQ allegee. Diplomes traduits et legalises. Etude au cas par cas pour les filieres pro.",
            "organisme": "CNEQ + Service culturel marocain",
            "delai": "3 a 6 semaines",
        },
        {
            "pays": "Senegal [SN]",
            "systeme": "Systeme LMD inspire du modele francais. Baccalaureat senegalais reconnu sans difficulte.",
            "procedure": "Dossier CNEQ avec releves detailles et programme du diplome. Apostille obligatoire.",
            "organisme": "CNEQ + Ambassade du Senegal",
            "delai": "6 a 10 semaines",
        },
        {
            "pays": "Cameroun [CM]",
            "systeme": "Double systeme anglophone et francophone. Reconnaissance selon la filiere (BAC/GCE A-Level).",
            "procedure": "CNEQ exige programme officiel et grille d'evaluation detaillee. Traduction certifiee des releves.",
            "organisme": "CNEQ + Ambassade du Cameroun",
            "delai": "8 a 12 semaines",
        },
        {
            "pays": "Cote d'Ivoire [CI]",
            "systeme": "Systeme LMD aligne sur le modele francais. Bonne reconnaissance des bacs generaux et techniques.",
            "procedure": "Dossier CNEQ standard avec apostille ou legalisation. Examen detaille pour les diplomes techniques.",
            "organisme": "CNEQ + Ambassade de Cote d'Ivoire",
            "delai": "6 a 10 semaines",
        },
        {
            "pays": "Gabon [GA]",
            "systeme": "Systeme LMD conforme aux standards CEMAC. Le baccalaureat gabonais est admis directement.",
            "procedure": "Procedure CNEQ classique avec legalisation consulaire. Pas de complication pour les sciences.",
            "organisme": "CNEQ + Ambassade du Gabon",
            "delai": "6 a 8 semaines",
        },
        {
            "pays": "Liban [LB]",
            "systeme": "Baccalaureat libanais (general ou technique) reconnu apres evaluation. Programmes universitaires LMD.",
            "procedure": "CNEQ avec traduction certifiee arabe-francais. Evaluation matiere par matiere pour les diplomes univ.",
            "organisme": "CNEQ + Ambassade du Liban a Tunis",
            "delai": "6 a 10 semaines",
        },
    ]

    for p in pays_list:
        pdf.ln(2)
        pdf.set_fill_color(*BLUE_BG)
        pdf.set_font("Helvetica", "B", 10)
        pdf.set_text_color(*BLUE_DARK)
        pdf.set_x(MARGIN)
        pdf.cell(CONTENT_W - 36, 7, s(p["pays"]), fill=True)
        pdf.set_fill_color(*ORANGE_BG)
        pdf.set_text_color(*ORANGE)
        pdf.cell(36, 7, s(p["delai"]), fill=True, align="C", ln=True)

        pdf.label_value("Systeme educatif", p["systeme"])
        pdf.label_value("Procedure CNEQ",   p["procedure"])
        pdf.label_value("Organisme contact", p["organisme"])
        pdf.ln(1)


# ── SECTION 6 : CHECKLIST ────────────────────────────────────────────
def section_checklist(pdf: PDF):
    pdf.add_page()
    pdf.section_title("SECTION 6", "Checklist Documents - 22 items en 5 categories")

    categories = {
        "Identite (5 items)": [
            ("id-1", True,  "Passeport valide au moins 6 mois apres l'arrivee",
             "Faites une copie certifiee et conservez-la separement."),
            ("id-2", True,  "Visa long sejour etudiant (type D)", ""),
            ("id-3", True,  "8 photos d'identite aux normes",
             "Prevoyez large : carte de sejour, inscriptions en demanderont plusieurs."),
            ("id-4", True,  "Traductions legalisees des actes d'etat civil", ""),
            ("id-5", False, "Copies certifiees conformes de la piece d'identite",
             "Demandez-les a la mairie ou au notaire avant le depart."),
        ],
        "Academique (6 items)": [
            ("ac-1", True,  "Diplomes originaux (baccalaureat, licence, etc.)",
             "Apostille ou legalisation consulaire indispensable."),
            ("ac-2", True,  "Releves de notes officiels", ""),
            ("ac-3", True,  "Attestations de scolarite", ""),
            ("ac-4", True,  "Lettre d'admission de l'institut tunisien", ""),
            ("ac-5", False, "Programme detaille des cours suivis",
             "Utile pour les demandes d'equivalence au CNEQ."),
            ("ac-6", False, "Lettres de recommandation", ""),
        ],
        "Financier (4 items)": [
            ("fi-1", True,  "Justificatif de ressources financieres",
             "Releves bancaires des trois derniers mois ou attestation de prise en charge."),
            ("fi-2", False, "Attestation de bourse (si applicable)", ""),
            ("fi-3", True,  "Assurance maladie internationale",
             "Doit couvrir hospitalisation et rapatriement."),
            ("fi-4", False, "Caution pour le logement (equivalent 2 mois)", ""),
        ],
        "Sante (3 items)": [
            ("sa-1", True,  "Carnet de vaccinations a jour",
             "Verifiez les recommandations OMS pour la Tunisie avant le depart."),
            ("sa-2", False, "Ordonnances en cours et stock de medicaments",
             "Apportez l'equivalent de 3 mois et la denomination internationale."),
            ("sa-3", True,  "Carte de mutuelle ou attestation d'assurance sante", ""),
        ],
        "Logement (4 items)": [
            ("lo-1", True,  "Contrat ou pre-reservation de logement",
             "Indispensable pour la demande de visa et la declaration aux autorites."),
            ("lo-2", True,  "Liste des contacts d'urgence locaux", ""),
            ("lo-3", False, "Adresse provisoire ecrite avec plan d'acces", ""),
            ("lo-4", False, "Guide pratique de la ville d'accueil",
             "Telechargez les cartes hors ligne avant l'arrivee."),
        ],
    }

    for cat_name, items in categories.items():
        pdf.sub_title(cat_name)
        for item_id, obligatoire, label, conseil in items:
            # Ligne item
            pdf.set_x(MARGIN + 4)
            if obligatoire:
                pdf.set_fill_color(*RED_BG)
                pdf.set_text_color(*RED)
                pdf.set_font("Helvetica", "B", 8)
                pdf.cell(22, 5, "OBLIGATOIRE", fill=True, align="C")
            else:
                pdf.set_fill_color(245, 245, 245)
                pdf.set_text_color(*GRAY)
                pdf.set_font("Helvetica", "", 8)
                pdf.cell(22, 5, "Optionnel", fill=True, align="C")
            pdf.set_text_color(*DARK)
            pdf.set_font("Helvetica", "", 9)
            pdf.cell(CONTENT_W - 26, 5, s(f"  {label}")  )
            pdf.ln()
            if conseil:
                pdf.set_font("Helvetica", "I", 7.5)
                pdf.set_text_color(*GRAY)
                pdf.set_x(MARGIN + 28)
                pdf.cell(0, 4, s(f"Conseil : {conseil}"), ln=True)
                pdf.set_text_color(*DARK)
        pdf.ln(2)


# ── SECTION 7 : SECURITE ─────────────────────────────────────────────
def section_securite(pdf: PDF):
    pdf.add_page()
    pdf.section_title("SECTION 7", "Securite - Numeros d'urgence et conseils")

    pdf.sub_title("7.1  Numeros d'urgence en Tunisie")

    urgences = [
        ("SAMU (urgences medicales)",                    "190",             "24h/24, 7j/7"),
        ("Police secours",                               "197",             "24h/24, 7j/7"),
        ("Protection civile (pompiers)",                 "198",             "24h/24, 7j/7"),
        ("Numero vert etudiant etranger",                "80 100 200",      "Lun-Ven, 8h-20h"),
        ("Permanence consulaire (selon votre pays)",     "+216 XX XXX XXX", "Selon ambassade"),
        ("Support EduBridge international",              "+216 70 000 000", "Lun-Ven, 9h-17h"),
    ]

    headers_u = ["Service", "Numero", "Disponibilite"]
    widths_u  = [90, 44, 50]
    pdf.table_header(headers_u, widths_u)
    for i, (svc, num, dispo) in enumerate(urgences):
        pdf.set_fill_color(*RED_BG) if i < 3 else pdf.set_fill_color(255, 255, 255)
        pdf.set_text_color(*DARK)
        pdf.set_font("Helvetica", "B" if i < 3 else "", 8)
        pdf.set_x(MARGIN)
        pdf.cell(90, 6, s(svc), border=1, fill=True)
        pdf.set_text_color(*RED if i < 3 else DARK)
        pdf.set_font("Helvetica", "B", 9)
        pdf.cell(44, 6, s(num), border=1, fill=True, align="C")
        pdf.set_text_color(*DARK)
        pdf.set_font("Helvetica", "", 8)
        pdf.cell(50, 6, s(dispo), border=1, fill=True, ln=True)
    pdf.ln(6)

    pdf.sub_title("7.2  8 conseils de securite essentiels")

    conseils = [
        ("Shield",        "Numerisez tous vos documents",
         "Scannez passeport, visa, diplomes, contrat de logement. Stockez les copies dans un cloud securise accessible depuis n'importe ou."),
        ("Smartphone",    "Partagez votre geolocalisation",
         "Activez le partage de position avec un proche de confiance. Une simple application permet d'etre rassure au quotidien."),
        ("CreditCard",    "Protegez vos informations bancaires",
         "Ne communiquez jamais code PIN, identifiants ni copie de carte. Votre banque ne demandera jamais ces infos par telephone."),
        ("MapPin",        "Connaissez les zones et horaires surs",
         "Renseignez-vous aupres des etudiants deja sur place. Evitez les zones isolees la nuit et privilegiez les transports officiels."),
        ("Phone",         "Sauvegardez les numeros d'urgence hors ligne",
         "Notez 190, 197, 198, votre ambassade et un proche de confiance dans le repertoire physique ET sur papier."),
        ("Heart",         "Souscrivez une assurance rapatriement",
         "Avant le depart, assurez-vous que votre couverture inclut hospitalisation, rapatriement sanitaire et responsabilite civile."),
        ("AlertTriangle", "Signalez tout incident",
         "En cas de probleme (vol, agression, fraude), deposez plainte au commissariat ET informez votre ambassade."),
        ("Stethoscope",   "Faites un bilan de sante avant le depart",
         "Visite medicale, dentiste, vaccinations a jour. Un imprevu de sante est plus simple a gerer chez soi qu'a l'etranger."),
    ]

    for i, (icone, titre, desc) in enumerate(conseils):
        pdf.ln(1)
        pdf.set_fill_color(246, 250, 255)
        pdf.set_x(MARGIN)
        pdf.set_font("Helvetica", "B", 9)
        pdf.set_text_color(*BLUE_DARK)
        pdf.cell(6, 6, s(str(i + 1) + "."))
        pdf.cell(CONTENT_W - 6, 6, s(titre), fill=True, ln=True)
        pdf.set_font("Helvetica", "", 8.5)
        pdf.set_text_color(*DARK)
        pdf.set_x(MARGIN + 8)
        pdf.multi_cell(CONTENT_W - 8, LINE_H, s(desc))


# ── SECTION 8 : CULTURE ──────────────────────────────────────────────
def section_culture(pdf: PDF):
    pdf.add_page()
    pdf.section_title("SECTION 8", "Integration culturelle - 6 themes essentiels")

    themes = [
        {
            "theme": "Langues parlees au quotidien",
            "intro": (
                "La Tunisie est officiellement arabophone, mais le francais est largement utilise "
                "dans l'enseignement superieur, les administrations et la vie urbaine. "
                "La darija (arabe tunisien) est la langue de la rue."
            ),
            "conseils": [
                "Vous pouvez suivre vos etudes en francais sans difficulte majeure",
                "Apprenez quelques mots de darija pour les courses et les transports",
                "L'anglais progresse rapidement chez les jeunes generations",
                "Des cours d'arabe gratuits sont parfois proposes par les instituts",
            ],
        },
        {
            "theme": "Coutumes et hospitalite tunisienne",
            "intro": (
                "L'hospitalite est une valeur centrale en Tunisie. Vous serez probablement "
                "invite chez des camarades ou voisins des les premieres semaines."
            ),
            "conseils": [
                "Acceptez le cafe ou le the propose : c'est un geste d'accueil important",
                "Apportez une petite attention (patisseries, fruits) lorsque vous etes invite",
                "Saluez les personnes agees en premier, c'est une marque de respect appreciee",
                "Les conversations sont chaleureuses et peuvent prendre du temps",
            ],
        },
        {
            "theme": "Ramadan et fetes religieuses",
            "intro": (
                "Le mois de Ramadan transforme le rythme de la vie quotidienne. "
                "Restaurants, transports et horaires administratifs s'adaptent."
            ),
            "conseils": [
                "Vous n'etes pas tenu de jeaner - votre choix est respecte",
                "Evitez par discretion de manger ou fumer dans la rue durant la journee",
                "Beaucoup de restaurants restent ouverts, en particulier dans les quartiers etudiants",
                "L'Aid est une fete familiale joyeuse : si vous etes invite, c'est un beau privilege",
            ],
        },
        {
            "theme": "Alimentation et restauration",
            "intro": (
                "La gastronomie tunisienne est riche, mediterraneenne et accessible. "
                "Le restaurant universitaire propose des repas equilibres a tres bas prix."
            ),
            "conseils": [
                "Le Resto U sert des repas complets pour 0,80 a 1,50 TND",
                "La majorite des produits vendus est halal par defaut",
                "Goutez les specialites locales : couscous, brik, lablabi, makroudh",
                "Les marches (souks) offrent fruits, legumes et epices a prix tres avantageux",
            ],
        },
        {
            "theme": "Code vestimentaire",
            "intro": (
                "La Tunisie est l'un des pays les plus ouverts en matiere vestimentaire dans la region. "
                "Aucune obligation particuliere dans la vie quotidienne ou universitaire."
            ),
            "conseils": [
                "A l'universite : tenue decontractee comme partout ailleurs",
                "En centre-ville et dans les zones touristiques : aucune restriction",
                "Sur les plages et dans les hotels balneaires : maillot autorise",
                "Dans les quartiers tres traditionnels ou lieux de culte : tenue plus couvrante par respect",
            ],
        },
        {
            "theme": "Fetes nationales et calendrier academique",
            "intro": (
                "Le calendrier tunisien combine fetes nationales et religieuses. "
                "Plusieurs jours feries sont a connaitre pour planifier vos deplacements."
            ),
            "conseils": [
                "14 janvier - Fete de la Revolution (jour ferie)",
                "20 mars - Fete de l'Independance",
                "9 avril - Fete des Martyrs",
                "25 juillet - Fete de la Republique",
                "Aid el-Fitr et Aid el-Adha - dates variables, plusieurs jours feries",
                "Les universites publient un calendrier officiel chaque annee - consultez-le tot",
            ],
        },
    ]

    for t in themes:
        pdf.ln(2)
        pdf.set_fill_color(*BLUE_BG)
        pdf.set_font("Helvetica", "B", 10)
        pdf.set_text_color(*BLUE_DARK)
        pdf.set_x(MARGIN)
        pdf.cell(CONTENT_W, 7, s("  " + t["theme"]), fill=True, ln=True)

        pdf.set_font("Helvetica", "I", 8.5)
        pdf.set_text_color(60, 60, 80)
        pdf.set_x(MARGIN + 4)
        pdf.multi_cell(CONTENT_W - 4, LINE_H, s(t["intro"]))
        pdf.set_text_color(*DARK)

        for c in t["conseils"]:
            pdf.bullet(c, color=(30, 70, 140))
        pdf.ln(2)

    pdf.ln(3)
    pdf.info_box(
        "Message EduBridge : Etudier en Tunisie, c'est decouvrir un pays a l'histoire millenaire, "
        "chaleureux et ouvert sur le monde. Chaque defi administratif est surmontable, "
        "et notre equipe est la pour vous accompagner a chaque etape.",
        bg=GREEN_BG, border_color=GREEN
    )


# ── SECTION 9 : CONTACT ──────────────────────────────────────────────
def section_contact(pdf: PDF):
    pdf.add_page()
    pdf.section_title("SECTION 9", "Contact EduBridge - Informations et communaute")

    contact_data = {
        "email":            "Edubridge.admin@gmail.com",
        "email_reponse":    "Reponse sous 24h ouvrees",
        "whatsapp":         "+216 70 000 000",
        "whatsapp_reponse": "Reponse en moins de 2h aux heures ouvrables",
        "permanence_jours": "Du lundi au vendredi",
        "permanence_heures":"9h00 a 17h00",
        "permanence_lieu":  "Campus EduBridge - Tunis Centre",
        "communaute":       "Telegram - Etudiants etrangers en Tunisie",
        "telegram_lien":    "t.me/edubridge-international",
        "telegram_desc":    "Plus de 3 000 etudiants etrangers echangent quotidiennement conseils, bons plans et entraide.",
    }

    # Email
    pdf.sub_title("9.1  Email", color=BLUE_DARK)
    pdf.label_value("Adresse",  contact_data["email"])
    pdf.label_value("Delai",    contact_data["email_reponse"])
    pdf.ln(2)

    # WhatsApp
    pdf.sub_title("9.2  WhatsApp", color=GREEN)
    pdf.label_value("Numero",   contact_data["whatsapp"])
    pdf.label_value("Delai",    contact_data["whatsapp_reponse"])
    pdf.ln(2)

    # Permanence
    pdf.sub_title("9.3  Permanence physique", color=(200, 120, 0))
    pdf.label_value("Jours",    contact_data["permanence_jours"])
    pdf.label_value("Horaires", contact_data["permanence_heures"])
    pdf.label_value("Lieu",     contact_data["permanence_lieu"])
    pdf.ln(2)

    # Communauté
    pdf.sub_title("9.4  Communaute etudiante", color=BLUE_DARK)
    pdf.label_value("Plateforme",   contact_data["communaute"])
    pdf.label_value("Lien",         contact_data["telegram_lien"])
    pdf.label_value("Description",  contact_data["telegram_desc"])
    pdf.ln(4)

    # Résumé final
    pdf.set_fill_color(*BLUE_BG)
    pdf.set_draw_color(*BLUE)
    pdf.set_line_width(0.8)
    pdf.set_x(MARGIN)
    pdf.set_font("Helvetica", "B", 10)
    pdf.set_text_color(*BLUE_DARK)
    pdf.cell(CONTENT_W, 8, "  Recapitulatif des voies de contact", border="L", fill=True, ln=True)
    pdf.set_line_width(0.2)

    resume_rows = [
        ("Email",               "Edubridge.admin@gmail.com",    "24h ouvrees"),
        ("WhatsApp",            "+216 70 000 000",              "< 2h (heures ouvrables)"),
        ("Permanence physique", "Campus EduBridge, Tunis",      "Lun-Ven 9h-17h"),
        ("Telegram",            "t.me/edubridge-international", "Communaute 3 000+ membres"),
    ]
    widths_r = [46, 86, 50]
    pdf.table_header(["Canal", "Coordonnees", "Disponibilite"], widths_r)
    for i, row in enumerate(resume_rows):
        pdf.table_row(list(row), widths_r, even=(i % 2 == 0))


# ====================================================================
# Point d'entrée
# ====================================================================

def main():
    pdf = PDF()

    page_titre(pdf)
    section_visa(pdf)
    section_bourses(pdf)
    section_vie(pdf)
    section_admission(pdf)
    section_equivalences(pdf)
    section_checklist(pdf)
    section_securite(pdf)
    section_culture(pdf)
    section_contact(pdf)

    pdf.output(OUTPUT)
    print(f"PDF genere : {OUTPUT}  ({pdf.page_no()} pages)")


if __name__ == "__main__":
    main()
