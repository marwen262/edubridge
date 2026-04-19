"""
Détection automatique du pays d'origine du diplôme
à partir du texte extrait, de la langue et des mentions officielles.
"""

from __future__ import annotations

import re
from dataclasses import dataclass, field

from app.utils.logger import logger

# --- Dictionnaire de patterns par pays ---

COUNTRY_PATTERNS: dict[str, dict[str, list[str] | list[str]]] = {
    "Tunisia": {
        "patterns": [
            r"r[ée]publique\s+tunisienne",
            r"الجمهورية\s+التونسية",
            r"universit[ée]\s+.*tunis",
            r"universit[ée]\s+de\s+sfax",
            r"universit[ée]\s+de\s+sousse",
            r"universit[ée]\s+de\s+monastir",
            r"universit[ée]\s+de\s+carthage",
            r"minist[èe]re\s+de\s+l.enseignement\s+sup[ée]rieur.*tunisi",
        ],
        "languages": ["fr", "ar"],
    },
    "Algeria": {
        "patterns": [
            r"r[ée]publique\s+alg[ée]rienne",
            r"الجمهورية\s+الجزائرية",
            r"d[ée]mocratique\s+et\s+populaire",
            r"universit[ée]\s+.*alger",
            r"universit[ée]\s+.*oran",
            r"universit[ée]\s+.*constantine",
        ],
        "languages": ["fr", "ar"],
    },
    "Morocco": {
        "patterns": [
            r"royaume\s+du\s+maroc",
            r"المملكة\s+المغربية",
            r"universit[ée]\s+.*rabat",
            r"universit[ée]\s+.*casablanca",
            r"universit[ée]\s+.*marrakech",
            r"universit[ée]\s+mohammed",
        ],
        "languages": ["fr", "ar"],
    },
    "France": {
        "patterns": [
            r"r[ée]publique\s+fran[çc]aise",
            r"minist[èe]re\s+.*enseignement\s+sup[ée]rieur",
            r"acad[ée]mie\s+de",
            r"universit[ée]\s+.*paris",
            r"universit[ée]\s+.*lyon",
            r"universit[ée]\s+.*marseille",
            r"universit[ée]\s+.*toulouse",
            r"grande\s+[ée]cole",
        ],
        "languages": ["fr"],
    },
    "USA": {
        "patterns": [
            r"united\s+states",
            r"state\s+of\s+\w+",
            r"board\s+of\s+(trustees|regents)",
            r"university\s+of\s+(california|texas|michigan|florida|illinois)",
            r"massachusetts\s+institute",
            r"stanford\s+university",
            r"harvard\s+university",
            r"columbia\s+university",
        ],
        "languages": ["en"],
    },
    "UK": {
        "patterns": [
            r"united\s+kingdom",
            r"university\s+of\s+(oxford|cambridge|london|edinburgh|manchester)",
            r"imperial\s+college",
            r"king.s\s+college",
            r"queen.s\s+university",
        ],
        "languages": ["en"],
    },
    "Germany": {
        "patterns": [
            r"bundesrepublik\s+deutschland",
            r"federal\s+republic\s+of\s+germany",
            r"universit[äa]t\s+",
            r"technische\s+universit[äa]t",
            r"fachhochschule",
            r"hochschule\s+",
        ],
        "languages": ["de", "en"],
    },
    "Spain": {
        "patterns": [
            r"reino\s+de\s+espa[ñn]a",
            r"ministerio\s+de\s+educaci[oó]n",
            r"universidad\s+de\s+",
            r"universidad\s+polit[ée]cnica",
            r"universidad\s+complutense",
            r"universidad\s+aut[oó]noma",
        ],
        "languages": ["es"],
    },
    "Egypt": {
        "patterns": [
            r"جمهورية\s+مصر\s+العربية",
            r"arab\s+republic\s+of\s+egypt",
            r"cairo\s+university",
            r"ain\s+shams\s+university",
            r"جامعة\s+القاهرة",
            r"جامعة\s+عين\s+شمس",
        ],
        "languages": ["ar", "en"],
    },
    "Saudi Arabia": {
        "patterns": [
            r"المملكة\s+العربية\s+السعودية",
            r"kingdom\s+of\s+saudi\s+arabia",
            r"king\s+(saud|abdulaziz|fahd)\s+university",
            r"جامعة\s+الملك",
        ],
        "languages": ["ar", "en"],
    },
    "Lebanon": {
        "patterns": [
            r"r[ée]publique\s+libanaise",
            r"الجمهورية\s+اللبنانية",
            r"universit[ée]\s+libanaise",
            r"universit[ée]\s+.*beyrouth",
            r"american\s+university\s+of\s+beirut",
        ],
        "languages": ["fr", "ar", "en"],
    },
    "Canada": {
        "patterns": [
            r"university\s+of\s+(toronto|british\s+columbia|mcgill|montreal)",
            r"universit[ée]\s+de\s+(montr[ée]al|laval|sherbrooke|qu[ée]bec)",
            r"province\s+of\s+(ontario|quebec|british\s+columbia|alberta)",
        ],
        "languages": ["en", "fr"],
    },
    "Italy": {
        "patterns": [
            r"repubblica\s+italiana",
            r"universit[àa]\s+degli\s+studi",
            r"politecnico\s+di\s+",
            r"ministero\s+.*istruzione",
        ],
        "languages": ["it"],
    },
    "China": {
        "patterns": [
            r"people.s\s+republic\s+of\s+china",
            r"中华人民共和国",
            r"(peking|tsinghua|fudan|zhejiang)\s+university",
        ],
        "languages": ["zh-cn", "en"],
    },
    "Japan": {
        "patterns": [
            r"(tokyo|kyoto|osaka)\s+university",
            r"大学",
            r"学位",
        ],
        "languages": ["ja", "en"],
    },
    "India": {
        "patterns": [
            r"republic\s+of\s+india",
            r"university\s+grants\s+commission",
            r"indian\s+institute\s+of\s+technology",
            r"(delhi|mumbai|calcutta|madras)\s+university",
            r"all\s+india\s+council",
        ],
        "languages": ["en", "hi"],
    },
    "Brazil": {
        "patterns": [
            r"rep[úu]blica\s+federativa\s+do\s+brasil",
            r"universidade\s+(federal|estadual|de\s+s[ãa]o\s+paulo)",
            r"minist[ée]rio\s+da\s+educa[çc][ãa]o",
        ],
        "languages": ["pt"],
    },
    "Turkey": {
        "patterns": [
            r"t[üu]rkiye\s+cumhuriyeti",
            r"republic\s+of\s+t[üu]rk",
            r"[üu]niversitesi",
        ],
        "languages": ["tr", "en"],
    },
    "Libya": {
        "patterns": [
            r"دولة\s+ليبيا",
            r"state\s+of\s+libya",
            r"جامعة\s+طرابلس",
            r"جامعة\s+بنغازي",
        ],
        "languages": ["ar", "en"],
    },
    "Jordan": {
        "patterns": [
            r"المملكة\s+الأردنية\s+الهاشمية",
            r"hashemite\s+kingdom\s+of\s+jordan",
            r"university\s+of\s+jordan",
            r"الجامعة\s+الأردنية",
        ],
        "languages": ["ar", "en"],
    },
    "Iraq": {
        "patterns": [
            r"جمهورية\s+العراق",
            r"republic\s+of\s+iraq",
            r"جامعة\s+بغداد",
            r"university\s+of\s+baghdad",
        ],
        "languages": ["ar", "en"],
    },
    "UAE": {
        "patterns": [
            r"الإمارات\s+العربية\s+المتحدة",
            r"united\s+arab\s+emirates",
        ],
        "languages": ["ar", "en"],
    },
    "Senegal": {
        "patterns": [
            r"r[ée]publique\s+du\s+s[ée]n[ée]gal",
            r"universit[ée]\s+cheikh\s+anta\s+diop",
        ],
        "languages": ["fr"],
    },
    "Ivory Coast": {
        "patterns": [
            r"r[ée]publique\s+de\s+c[ôo]te\s+d.ivoire",
            r"universit[ée]\s+.*abidjan",
        ],
        "languages": ["fr"],
    },
    "Cameroon": {
        "patterns": [
            r"r[ée]publique\s+du\s+cameroun",
            r"republic\s+of\s+cameroon",
            r"universit[ée]\s+de\s+yaound[ée]",
        ],
        "languages": ["fr", "en"],
    },
}


@dataclass
class CountryResult:
    """Résultat de la détection de pays."""
    country_detected: str = "Unknown"
    confidence: float = 0.0
    language_detected: str = "unknown"
    matching_patterns: list[str] = field(default_factory=list)


def detect_country(
    text: str,
    language: str = "unknown",
    country_hint: str | None = None,
) -> CountryResult:
    """Détecte le pays d'origine du diplôme.

    Combine l'analyse du texte (patterns), la langue détectée et
    un éventuel indice fourni par l'utilisateur.
    """
    result = CountryResult(language_detected=language)

    try:
        if not text or len(text.strip()) < 10:
            result.matching_patterns.append("Texte insuffisant pour la détection")
            return result

        text_lower = text.lower()
        scores: dict[str, float] = {}
        matches: dict[str, list[str]] = {}

        for country, info in COUNTRY_PATTERNS.items():
            country_score: float = 0.0
            country_matches: list[str] = []

            # Vérifier les patterns regex
            for pattern in info["patterns"]:
                try:
                    if re.search(pattern, text_lower, re.IGNORECASE | re.UNICODE):
                        country_score += 1.0
                        country_matches.append(pattern)
                except re.error:
                    continue

            # Bonus si la langue détectée correspond
            if language in info["languages"]:
                country_score += 0.5

            # Bonus si country_hint correspond
            if country_hint and country_hint.lower() == country.lower():
                country_score += 2.0

            if country_score > 0:
                scores[country] = country_score
                matches[country] = country_matches

        if not scores:
            logger.info("Aucun pays détecté dans le texte")
            return result

        # Sélectionner le pays avec le meilleur score
        best_country: str = max(scores, key=scores.get)  # type: ignore[arg-type]
        best_score: float = scores[best_country]

        # Calculer la confiance (normalisée entre 0 et 1)
        # Score max théorique = nombre de patterns + 0.5 (langue) + 2 (hint)
        max_possible: float = len(COUNTRY_PATTERNS[best_country]["patterns"]) + 2.5
        confidence: float = min(1.0, best_score / max(max_possible * 0.4, 1.0))

        result.country_detected = best_country
        result.confidence = round(confidence, 2)
        result.matching_patterns = matches.get(best_country, [])

        logger.info(
            "Pays détecté : %s (confiance=%.2f, patterns=%d)",
            best_country,
            confidence,
            len(result.matching_patterns),
        )

    except Exception as e:
        logger.error("Erreur lors de la détection du pays : %s", e)

    return result
