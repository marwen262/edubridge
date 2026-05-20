"""
Génère le PDF de soutenance EduBridge depuis le fichier Markdown.
Utilise fpdf2 - version robuste avec gestion d'encodage ASCII strict.
"""

import re
from fpdf import FPDF

MD_FILE = "edubridge_architecture_complete.md"
PDF_FILE = "edubridge_architecture_complete.pdf"

PAGE_W = 210
PAGE_H = 297
MARGIN = 15
CONTENT_W = PAGE_W - 2 * MARGIN
LINE_H = 5

BLUE = (0, 82, 165)
LIGHT_BLUE = (0, 100, 180)
DARK = (30, 30, 30)
GRAY = (120, 120, 120)
WHITE = (255, 255, 255)
LIGHT_BG = (245, 248, 255)
CODE_BG = (245, 245, 245)
TABLE_HDR = (0, 82, 165)


# ── Mapping caractères spéciaux → ASCII ─────────────────────────────
_CHAR_MAP = {
    "é": "e", "è": "e", "ê": "e", "ë": "e",
    "à": "a", "â": "a", "ä": "a", "á": "a",
    "ù": "u", "û": "u", "ü": "u", "ú": "u",
    "î": "i", "ï": "i", "í": "i", "ì": "i",
    "ô": "o", "ö": "o", "ó": "o", "ò": "o",
    "ç": "c", "Ç": "C",
    "É": "E", "È": "E", "Ê": "E", "Ë": "E",
    "À": "A", "Â": "A", "Á": "A",
    "Ô": "O", "Ö": "O",
    "Ù": "U", "Û": "U", "Ü": "U",
    "Î": "I", "Ï": "I",
    "Æ": "AE", "æ": "ae", "Œ": "OE", "œ": "oe",
    "ß": "ss", "ñ": "n", "Ñ": "N",
    "←": "<-", "→": "->", "↑": "^", "↓": "v",
    "↔": "<->", "↕": "^v",
    "►": ">", "◄": "<", "▲": "^", "▼": "v",
    "●": "*", "○": "o", "■": "[x]", "□": "[ ]",
    "─": "-", "│": "|",
    "┌": "+", "┐": "+", "└": "+", "┘": "+",
    "├": "+", "┤": "+", "┬": "+", "┴": "+", "┼": "+",
    "═": "=", "║": "|",
    "╔": "+", "╗": "+", "╚": "+", "╝": "+",
    "╠": "+", "╣": "+", "╦": "+", "╩": "+", "╬": "+",
    "·": ".", "…": "...", "«": "<<", "»": ">>",
    "‘": "'", "’": "'", "“": '"', "”": '"',
    "–": "-", "—": "--", "°": "deg",
    "·": ".", "×": "x", "÷": "/",
    "≤": "<=", "≥": ">=", "≠": "!=",
    "√": "sqrt", "∑": "Sigma",
    "α": "alpha", "β": "beta", "γ": "gamma",
    " ": " ",
}


def ascii_safe(text: str) -> str:
    result = []
    for ch in text:
        if ch in _CHAR_MAP:
            result.append(_CHAR_MAP[ch])
        elif ord(ch) < 128:
            result.append(ch)
        elif 128 <= ord(ch) < 256:
            # Try to keep latin1 chars that fpdf can handle
            try:
                ch.encode("latin-1")
                result.append(ch)
            except (UnicodeEncodeError, ValueError):
                result.append("?")
        else:
            result.append("?")
    return "".join(result)


def clean(text: str) -> str:
    """Retire Markdown inline + rend ASCII-safe."""
    text = re.sub(r"\*\*(.+?)\*\*", r"\1", text)
    text = re.sub(r"__(.+?)__", r"\1", text)
    text = re.sub(r"\*(.+?)\*", r"\1", text)
    text = re.sub(r"`(.+?)`", r"\1", text)
    text = re.sub(r"\[([^\]]+)\]\([^\)]+\)", r"\1", text)
    text = re.sub(r"^#{1,6}\s*", "", text)
    text = ascii_safe(text.strip())
    return text


class PDF(FPDF):
    def __init__(self):
        super().__init__(orientation="P", unit="mm", format="A4")
        self.set_left_margin(MARGIN)
        self.set_right_margin(MARGIN)
        self.set_top_margin(MARGIN)
        self.set_auto_page_break(auto=True, margin=15)

    def header(self):
        if self.page_no() <= 1:
            return
        self.set_font("Helvetica", "I", 7)
        self.set_text_color(*GRAY)
        self.set_x(MARGIN)
        self.cell(CONTENT_W, 5,
                  "EduBridge - Analyse Architecturale Complete - PFE 2026",
                  align="C")
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

    def put_text(self, text: str, size: float = 9, bold: bool = False,
                 italic: bool = False, color=DARK, align: str = "L",
                 line_h: float = LINE_H, fill: bool = False):
        style = ("B" if bold else "") + ("I" if italic else "")
        self.set_font("Helvetica", style, size)
        self.set_text_color(*color)
        self.set_x(MARGIN)
        self.multi_cell(CONTENT_W, line_h, text, align=align, fill=fill)

    def h1(self, text: str):
        self.add_page()
        self.set_x(MARGIN)
        self.set_fill_color(230, 240, 255)
        self.set_font("Helvetica", "B", 16)
        self.set_text_color(*BLUE)
        self.multi_cell(CONTENT_W, 10, text, fill=True)
        self.ln(1)
        self.set_draw_color(*BLUE)
        self.set_line_width(0.5)
        self.line(MARGIN, self.get_y(), PAGE_W - MARGIN, self.get_y())
        self.ln(4)
        self.set_text_color(*DARK)

    def h2(self, text: str):
        self.ln(3)
        self.set_x(MARGIN)
        self.set_font("Helvetica", "B", 13)
        self.set_text_color(*LIGHT_BLUE)
        self.multi_cell(CONTENT_W, 8, text)
        self.set_draw_color(150, 190, 230)
        self.set_line_width(0.3)
        self.line(MARGIN, self.get_y(), MARGIN + 80, self.get_y())
        self.ln(3)
        self.set_text_color(*DARK)

    def h3(self, text: str):
        self.ln(2)
        self.set_x(MARGIN)
        self.set_font("Helvetica", "B", 11)
        self.set_text_color(30, 70, 140)
        self.multi_cell(CONTENT_W, 7, text)
        self.ln(1)
        self.set_text_color(*DARK)

    def h4(self, text: str):
        self.ln(1)
        self.set_x(MARGIN)
        self.set_font("Helvetica", "BI", 9)
        self.set_text_color(60, 60, 100)
        self.multi_cell(CONTENT_W, 6, text)
        self.set_text_color(*DARK)

    def code_line(self, text: str):
        self.set_fill_color(*CODE_BG)
        self.set_font("Courier", "", 7)
        self.set_text_color(40, 40, 40)
        self.set_x(MARGIN)
        safe = text[:120]
        self.cell(CONTENT_W, 4, safe, fill=True, ln=True)

    def table_row(self, cells: list, is_header: bool = False, col_widths=None):
        n = len(cells)
        if n == 0:
            return
        if col_widths is None:
            col_widths = [CONTENT_W / n] * n

        if is_header:
            self.set_fill_color(*TABLE_HDR)
            self.set_text_color(*WHITE)
            self.set_font("Helvetica", "B", 8)
        else:
            self.set_fill_color(240, 245, 255)
            self.set_text_color(*DARK)
            self.set_font("Helvetica", "", 8)

        self.set_x(MARGIN)
        for j, cell in enumerate(cells):
            txt = clean(str(cell))[:55]
            self.cell(col_widths[j], LINE_H, txt, border=1, fill=True)
        self.ln()
        self.set_text_color(*DARK)

    def bullet(self, text: str):
        self.set_font("Helvetica", "", 9)
        self.set_x(MARGIN + 4)
        self.cell(4, LINE_H, chr(149))
        remaining = PAGE_W - MARGIN - MARGIN - 8
        self.multi_cell(remaining, LINE_H, text[:200])

    def numbered(self, num: str, text: str):
        self.set_font("Helvetica", "", 9)
        self.set_x(MARGIN + 4)
        self.cell(6, LINE_H, f"{num}.")
        remaining = PAGE_W - MARGIN - MARGIN - 10
        self.multi_cell(remaining, LINE_H, text[:200])

    def quote(self, text: str):
        self.set_fill_color(240, 248, 255)
        self.set_font("Helvetica", "I", 9)
        self.set_text_color(60, 80, 130)
        self.set_left_margin(MARGIN + 8)
        self.set_x(MARGIN + 8)
        w = CONTENT_W - 8
        self.multi_cell(w, LINE_H, text, fill=True)
        self.set_left_margin(MARGIN)
        self.set_text_color(*DARK)

    def divider(self):
        self.set_draw_color(200, 200, 200)
        self.set_line_width(0.2)
        self.line(MARGIN, self.get_y() + 2, PAGE_W - MARGIN, self.get_y() + 2)
        self.ln(4)


def title_page(pdf: PDF):
    pdf.set_y(45)

    # Titre principal
    pdf.set_font("Helvetica", "B", 28)
    pdf.set_text_color(*BLUE)
    pdf.set_x(MARGIN)
    pdf.cell(CONTENT_W, 14, "EduBridge", align="C", ln=True)

    pdf.set_font("Helvetica", "B", 18)
    pdf.set_text_color(*DARK)
    pdf.set_x(MARGIN)
    pdf.cell(CONTENT_W, 10, "Analyse Architecturale Complete", align="C", ln=True)
    pdf.set_x(MARGIN)
    pdf.cell(CONTENT_W, 10, "pour Soutenance PFE", align="C", ln=True)

    pdf.ln(8)
    pdf.set_draw_color(*BLUE)
    pdf.set_line_width(0.8)
    pdf.line(MARGIN + 20, pdf.get_y(), PAGE_W - MARGIN - 20, pdf.get_y())
    pdf.ln(10)

    pdf.set_font("Helvetica", "", 12)
    pdf.set_text_color(80, 80, 80)
    pdf.set_x(MARGIN)
    pdf.cell(CONTENT_W, 8, "Plateforme candidats <-> instituts prives tunisiens", align="C", ln=True)
    pdf.set_x(MARGIN)
    pdf.cell(CONTENT_W, 8, "Frontend React / Backend Node.js / Microservice FastAPI OCR", align="C", ln=True)

    pdf.ln(15)

    # Boite info
    pdf.set_fill_color(240, 248, 255)
    box_x = MARGIN + 20
    box_w = CONTENT_W - 40
    pdf.set_x(box_x)
    pdf.set_font("Helvetica", "", 10)
    pdf.set_text_color(60, 80, 130)
    items = [
        "Architecture complete : frontend / backend / microservice",
        "Flux detailles : auth JWT, candidature, upload, OCR",
        "Analyse fichier par fichier des composants critiques",
        "25+ questions jury avec reponses pour la soutenance",
        "Forces, faiblesses et vocabulaire technique",
    ]
    for item in items:
        pdf.set_x(box_x)
        pdf.cell(4, 7, chr(149))
        pdf.cell(box_w - 4, 7, item, ln=True)

    pdf.ln(15)
    pdf.set_font("Helvetica", "I", 9)
    pdf.set_text_color(*GRAY)
    pdf.set_x(MARGIN)
    pdf.cell(CONTENT_W, 6, "Document de preparation - Mode READ-ONLY - Mai 2026", align="C", ln=True)


def parse_table_row(line: str):
    parts = [p.strip() for p in line.split("|")]
    return [p for p in parts if p]


def is_separator_row(row: list) -> bool:
    return all(re.match(r"^[-:]+$", p.strip()) for p in row if p.strip())


def process_markdown(pdf: PDF, lines: list):
    in_code = False
    i = 0
    table_buffer: list = []

    def flush_table():
        if not table_buffer:
            return
        # Find header row (first) and separator (second)
        rows = table_buffer[:]
        if len(rows) == 0:
            table_buffer.clear()
            return

        # Compute column widths
        max_cols = max(len(r) for r in rows)
        col_w = CONTENT_W / max(max_cols, 1)
        col_widths = [col_w] * max_cols

        header_done = False
        for idx, row in enumerate(rows):
            if is_separator_row(row):
                continue
            if not header_done:
                pdf.table_row(row, is_header=True, col_widths=col_widths)
                header_done = True
            else:
                pdf.table_row(row, is_header=False, col_widths=col_widths)
        pdf.ln(2)
        table_buffer.clear()

    while i < len(lines):
        raw = lines[i]
        line = ascii_safe(raw.rstrip("\n"))

        # Code block toggle
        if line.startswith("```"):
            if in_code:
                in_code = False
                pdf.set_text_color(*DARK)
                pdf.set_font("Helvetica", "", 9)
                pdf.ln(1)
            else:
                flush_table()
                in_code = True
            i += 1
            continue

        if in_code:
            pdf.code_line(line)
            i += 1
            continue

        # Table rows
        if line.startswith("|"):
            flush_table()
            parts = parse_table_row(line)
            if parts:
                table_buffer.append(parts)
            i += 1
            continue
        else:
            if table_buffer:
                flush_table()

        # Headings
        if re.match(r"^# ", line):
            title = clean(line[2:])
            if "TABLE DES MATIERES" in title.upper() or "TABLE OF CONTENTS" in title.upper():
                i += 1
                continue
            pdf.h1(title)

        elif re.match(r"^## ", line):
            pdf.h2(clean(line[3:]))

        elif re.match(r"^### ", line):
            pdf.h3(clean(line[4:]))

        elif re.match(r"^#### ", line):
            pdf.h4(clean(line[5:]))

        elif line.strip().startswith("---") and len(line.strip()) >= 3 and set(line.strip()) == {"-"}:
            pdf.divider()

        elif line.startswith("> "):
            pdf.quote(clean(line[2:]))

        elif re.match(r"^[-*] ", line):
            pdf.bullet(clean(line[2:]))

        elif re.match(r"^\d+\. ", line):
            m = re.match(r"^(\d+)\. (.+)$", line)
            if m:
                pdf.numbered(m.group(1), clean(m.group(2)))

        elif line.strip() == "" or line.strip() == "---":
            pdf.ln(2)

        else:
            t = clean(line)
            if t and not t.startswith("[") and len(t) > 1:
                pdf.set_font("Helvetica", "", 9)
                pdf.set_text_color(*DARK)
                pdf.set_x(MARGIN)
                pdf.multi_cell(CONTENT_W, LINE_H, t[:300])

        i += 1

    flush_table()


def main():
    with open(MD_FILE, encoding="utf-8", errors="replace") as f:
        lines = f.readlines()

    pdf = PDF()

    # Page de titre
    pdf.add_page()
    title_page(pdf)

    # Corps du document
    pdf.add_page()
    process_markdown(pdf, lines)

    pdf.output(PDF_FILE)
    print(f"PDF genere : {PDF_FILE}")
    print(f"Pages : {pdf.page_no()}")


if __name__ == "__main__":
    main()
