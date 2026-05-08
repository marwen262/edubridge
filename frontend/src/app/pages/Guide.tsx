import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router';
import { Trans, useTranslation } from 'react-i18next';
import { motion } from 'motion/react';
import { toast } from 'sonner';
import i18n from '@/i18n';
import {
  AlertTriangle,
  CheckCircle,
  ChevronLeft,
  ChevronRight,
  Clock,
  Copy,
  CreditCard,
  ExternalLink,
  FileText,
  Heart,
  Info,
  Mail,
  MapPin,
  MessageCircle,
  Phone,
  Shield,
  Smartphone,
  Stethoscope,
  Users,
  XCircle,
} from 'lucide-react';
import { Navbar } from '../components/Navbar';
import { Footer } from '../components/Footer';
import { Stepper } from '../components/Stepper';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '../components/ui/accordion';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '../components/ui/card';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '../components/ui/tabs';
import { Separator } from '../components/ui/separator';
import { useAuth } from '@/context/AuthContext';
import {
  guideData,
  type Bourse,
  type ConseilSecurite,
  type EquivalencePays,
  type EtapeAdmission,
  type EtapeVisa,
  type ItemChecklist,
  type Logement,
  type StatGuide,
  type ThemeCulture,
  type Urgence,
} from '../data/staticData';

// ===========================================================================
// Configuration des sections (id + label pour la navigation sticky)
// ===========================================================================

const SECTIONS: { id: string }[] = [
  { id: 'visa' },
  { id: 'bourses' },
  { id: 'vie' },
  { id: 'admission' },
  { id: 'equivalence' },
  { id: 'documents' },
  { id: 'securite' },
  { id: 'culture' },
];

const ICONES_SECURITE: Record<string, React.ComponentType<{ className?: string }>> = {
  Shield,
  Smartphone,
  CreditCard,
  MapPin,
  Phone,
  Heart,
  AlertTriangle,
  Stethoscope,
};

const MOTION_FADE_IN_UP = {
  initial: { opacity: 0, y: 30 },
  whileInView: { opacity: 1, y: 0 },
  transition: { duration: 0.5 },
  viewport: { once: true },
};

// Calcule la date courante en jours depuis epoch — utilisé pour les deadlines
function joursRestants(deadlineISO: string): number {
  const cible = new Date(deadlineISO).getTime();
  const maintenant = new Date().getTime();
  return Math.ceil((cible - maintenant) / (1000 * 60 * 60 * 24));
}

function formaterDate(deadlineISO: string): string {
  return new Date(deadlineISO).toLocaleDateString(i18n.language, {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

// ===========================================================================
// Hero
// ===========================================================================

function Hero({ stats }: { stats: StatGuide[] }) {
  const { t } = useTranslation();
  return (
    <section
      id="hero"
      className="relative overflow-hidden"
      style={{
        background:
          'linear-gradient(135deg, color-mix(in srgb, var(--edu-blue) 8%, white) 0%, white 100%)',
      }}
    >
      {/* Motif décoratif inline (grille de points) */}
      <svg
        aria-hidden="true"
        className="absolute inset-0 w-full h-full opacity-30 pointer-events-none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <pattern id="grille-points" x="0" y="0" width="32" height="32" patternUnits="userSpaceOnUse">
            <circle cx="2" cy="2" r="1.5" fill="var(--edu-blue)" fillOpacity="0.15" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#grille-points)" />
      </svg>

      <div className="relative max-w-[1440px] mx-auto px-6 py-20 md:py-28">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="max-w-3xl"
        >
          <Badge
            variant="outline"
            className="mb-6 border-[var(--edu-blue)] text-[var(--edu-blue)] bg-white"
          >
            {t('guide.badge')}
          </Badge>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-[var(--edu-text-primary)] mb-6 leading-tight">
            {t('guide.hero.title')}
          </h1>
          <p className="text-lg md:text-xl text-[var(--edu-text-secondary)] leading-relaxed">
            {t('guide.hero.subtitle')}
          </p>
        </motion.div>

        <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
          {stats.map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.15 }}
              className="rounded-2xl bg-white border border-[var(--edu-divider)] px-6 py-6 shadow-sm"
            >
              <div className="text-3xl md:text-4xl font-bold text-[var(--edu-blue)] mb-2">
                {stat.valeur}
              </div>
              <div className="text-sm text-[var(--edu-text-secondary)] leading-snug">
                {stat.label}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ===========================================================================
// Navigation sticky
// ===========================================================================

function NavigationSticky() {
  const { t } = useTranslation();
  const [visible, setVisible] = useState(false);
  const [actif, setActif] = useState<string>(SECTIONS[0].id);

  // Détection sortie du Hero
  useEffect(() => {
    const hero = document.getElementById('hero');
    if (!hero) return;
    const observer = new IntersectionObserver(
      ([entry]) => setVisible(!entry.isIntersecting),
      { threshold: 0, rootMargin: '-80px 0px 0px 0px' },
    );
    observer.observe(hero);
    return () => observer.disconnect();
  }, []);

  // Section active
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const visibles = entries.filter((e) => e.isIntersecting);
        if (visibles.length === 0) return;
        // Section la plus haute parmi celles visibles
        const top = visibles.reduce((acc, cur) =>
          acc.boundingClientRect.top < cur.boundingClientRect.top ? acc : cur,
        );
        setActif(top.target.id);
      },
      { rootMargin: '-30% 0px -55% 0px', threshold: 0 },
    );
    SECTIONS.forEach(({ id }) => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });
    return () => observer.disconnect();
  }, []);

  const handleClick = useCallback((e: React.MouseEvent, id: string) => {
    e.preventDefault();
    const el = document.getElementById(id);
    if (el) {
      const top = el.getBoundingClientRect().top + window.scrollY - 120;
      window.scrollTo({ top, behavior: 'smooth' });
    }
  }, []);

  return (
    <div
      className={`sticky top-0 z-40 bg-white border-b border-[var(--edu-divider)] transition-opacity duration-300 ${
        visible ? 'opacity-100' : 'opacity-0 pointer-events-none'
      }`}
    >
      <div className="max-w-[1440px] mx-auto px-6">
        <nav
          className="flex items-center gap-2 md:gap-1 overflow-x-auto py-3 [&::-webkit-scrollbar]:hidden"
          style={{ scrollbarWidth: 'none' }}
          aria-label={t('guide.nav.aria')}
        >
          {SECTIONS.map((section) => {
            const estActif = actif === section.id;
            return (
              <a
                key={section.id}
                href={`#${section.id}`}
                onClick={(e) => handleClick(e, section.id)}
                aria-current={estActif ? 'true' : undefined}
                className={`whitespace-nowrap px-4 py-2 text-sm transition-colors border-b-2 ${
                  estActif
                    ? 'text-[var(--edu-blue)] font-semibold border-[var(--edu-blue)]'
                    : 'text-[var(--edu-text-secondary)] font-medium border-transparent hover:text-[var(--edu-text-primary)]'
                }`}
              >
                {t(`guide.sections.${section.id}`)}
              </a>
            );
          })}
        </nav>
      </div>
    </div>
  );
}

// ===========================================================================
// En-tête de section
// ===========================================================================

interface SectionHeaderProps {
  surtitre: string;
  titre: string;
  description?: string;
}

function SectionHeader({ surtitre, titre, description }: SectionHeaderProps) {
  return (
    <motion.div {...MOTION_FADE_IN_UP} className="max-w-3xl mb-10">
      <div className="text-sm font-semibold text-[var(--edu-blue)] uppercase tracking-wider mb-2">
        {surtitre}
      </div>
      <h2 className="text-3xl md:text-4xl font-bold text-[var(--edu-text-primary)] mb-4 leading-tight">
        {titre}
      </h2>
      {description && (
        <p className="text-lg text-[var(--edu-text-secondary)] leading-relaxed">
          {description}
        </p>
      )}
    </motion.div>
  );
}

// ===========================================================================
// Section 3 — Visa & séjour
// ===========================================================================

function SectionVisa({ etapes }: { etapes: EtapeVisa[] }) {
  const { t } = useTranslation();
  return (
    <section id="visa" className="py-20 scroll-mt-24">
      <div className="max-w-[1440px] mx-auto px-6">
        <SectionHeader
          surtitre={t('guide.visa.step')}
          titre={t('guide.visa.title')}
          description={t('guide.visa.description')}
        />

        {/* Encart délai global */}
        <motion.div
          {...MOTION_FADE_IN_UP}
          className="flex items-start gap-3 rounded-xl bg-[var(--edu-surface)] border-l-4 border-[var(--edu-blue)] p-5 mb-12"
        >
          <Info className="w-5 h-5 text-[var(--edu-blue)] shrink-0 mt-0.5" aria-hidden="true" />
          <div>
            <div className="font-semibold text-[var(--edu-text-primary)] mb-1">
              {t('guide.visa.estimatedDelay')}
            </div>
            <div className="text-sm text-[var(--edu-text-secondary)]">
              <Trans i18nKey="guide.visa.delayDescription" components={{ strong: <strong /> }} />
            </div>
          </div>
        </motion.div>

        {/* Timeline verticale */}
        <ol className="relative" role="list">
          <div
            className="absolute left-5 top-0 bottom-0 w-0.5 bg-[var(--edu-divider)]"
            aria-hidden="true"
          />
          {etapes.map((etape, index) => (
            <motion.li
              key={etape.numero}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              viewport={{ once: true }}
              className="relative pl-16 pb-10 last:pb-0"
            >
              <div className="absolute left-0 top-0 w-10 h-10 rounded-full bg-[var(--edu-blue)] text-white font-bold flex items-center justify-center shadow-md">
                {etape.numero}
              </div>
              <div className="rounded-2xl bg-white border border-[var(--edu-divider)] p-6 shadow-sm">
                <div className="flex flex-wrap items-start justify-between gap-3 mb-3">
                  <h3 className="text-xl font-semibold text-[var(--edu-text-primary)]">
                    {etape.titre}
                  </h3>
                  <Badge
                    className="bg-[color-mix(in_srgb,var(--edu-warning)_15%,transparent)] text-[var(--edu-warning)] border border-[color-mix(in_srgb,var(--edu-warning)_25%,transparent)]"
                  >
                    <Clock className="w-3 h-3" aria-hidden="true" />
                    {etape.delai}
                  </Badge>
                </div>
                <p className="text-[var(--edu-text-secondary)] leading-relaxed mb-4">
                  {etape.description}
                </p>
                <Accordion type="single" collapsible>
                  <AccordionItem value="docs" className="border-0">
                    <AccordionTrigger className="text-sm text-[var(--edu-blue)] py-2 hover:no-underline">
                      {t('guide.visa.documentsCount', { count: etape.documents.length })}
                    </AccordionTrigger>
                    <AccordionContent>
                      <ul className="space-y-2 pt-2" role="list">
                        {etape.documents.map((doc) => (
                          <li
                            key={doc}
                            className="flex items-start gap-2 text-sm text-[var(--edu-text-secondary)]"
                          >
                            <FileText
                              className="w-4 h-4 text-[var(--edu-blue)] shrink-0 mt-0.5"
                              aria-hidden="true"
                            />
                            <span>{doc}</span>
                          </li>
                        ))}
                      </ul>
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              </div>
            </motion.li>
          ))}
        </ol>

        {/* Encart bon à savoir */}
        <motion.div
          {...MOTION_FADE_IN_UP}
          className="mt-12 flex items-start gap-3 rounded-xl bg-[color-mix(in_srgb,var(--edu-success)_8%,white)] border-l-4 border-[var(--edu-success)] p-5"
        >
          <CheckCircle className="w-5 h-5 text-[var(--edu-success)] shrink-0 mt-0.5" aria-hidden="true" />
          <div>
            <div className="font-semibold text-[var(--edu-text-primary)] mb-1">
              {t('guide.visa.goodToKnow')}
            </div>
            <div className="text-sm text-[var(--edu-text-secondary)]">
              {t('guide.visa.eduBridgeAttestation')}
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

// ===========================================================================
// Section 4 — Bourses
// ===========================================================================

const TYPES_BOURSE: { value: 'all' | Bourse['type'] }[] = [
  { value: 'all' },
  { value: 'gouvernementale' },
  { value: 'internationale' },
  { value: 'institutionnelle' },
];

function CarteBourse({ bourse, index }: { bourse: Bourse; index: number }) {
  const { t } = useTranslation();
  const jours = joursRestants(bourse.deadline);
  const urgent = jours <= 30 && jours >= 0;
  const couleurType: Record<Bourse['type'], string> = {
    gouvernementale:
      'bg-[color-mix(in_srgb,var(--edu-success)_15%,transparent)] text-[var(--edu-success)] border-[color-mix(in_srgb,var(--edu-success)_30%,transparent)]',
    internationale:
      'bg-[color-mix(in_srgb,var(--edu-blue)_15%,transparent)] text-[var(--edu-blue)] border-[color-mix(in_srgb,var(--edu-blue)_30%,transparent)]',
    institutionnelle:
      'bg-[color-mix(in_srgb,var(--edu-warning)_15%,transparent)] text-[var(--edu-warning)] border-[color-mix(in_srgb,var(--edu-warning)_30%,transparent)]',
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
      viewport={{ once: true }}
    >
      <Card className="h-full bg-[var(--edu-elevated)] border-[var(--edu-divider)]">
        <CardHeader>
          <div className="flex items-start justify-between gap-3 mb-2">
            <CardTitle className="text-lg font-semibold text-[var(--edu-text-primary)] leading-snug">
              {bourse.nom}
            </CardTitle>
            <Badge className={`shrink-0 border ${couleurType[bourse.type]}`}>
              {t(`guide.scholarships.type.${bourse.type}`)}
            </Badge>
          </div>
          <div className="text-2xl font-bold text-[var(--edu-blue)]">{bourse.montant}</div>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <p className="text-sm text-[var(--edu-text-secondary)] leading-relaxed">
            {bourse.description}
          </p>
          <div className="flex items-start gap-2 text-sm text-[var(--edu-text-secondary)]">
            <Users className="w-4 h-4 text-[var(--edu-blue)] shrink-0 mt-0.5" aria-hidden="true" />
            <span>{bourse.eligibilite}</span>
          </div>
          {urgent ? (
            <Badge className="bg-[color-mix(in_srgb,var(--edu-danger)_15%,transparent)] text-[var(--edu-danger)] border border-[color-mix(in_srgb,var(--edu-danger)_30%,transparent)]">
              <AlertTriangle className="w-3 h-3" aria-hidden="true" />
              {jours > 1 ? t('guide.scholarships.urgentPlural', { count: jours }) : t('guide.scholarships.urgent', { count: jours })}
            </Badge>
          ) : (
            <Badge className="bg-[color-mix(in_srgb,var(--edu-warning)_15%,transparent)] text-[var(--edu-warning)] border border-[color-mix(in_srgb,var(--edu-warning)_30%,transparent)]">
              <Clock className="w-3 h-3" aria-hidden="true" />
              {t('guide.scholarships.deadline', { date: formaterDate(bourse.deadline) })}
            </Badge>
          )}
          <a
            href={bourse.lien}
            target="_blank"
            rel="noopener noreferrer"
            title={`Postuler à ${bourse.nom}`}
            className="inline-flex"
          >
            <Button
              variant="outline"
              className="w-full border-[var(--edu-blue)] text-[var(--edu-blue)] hover:bg-[var(--edu-blue)] hover:text-white"
            >
              {t('guide.scholarships.apply')}
              <ExternalLink className="w-4 h-4" aria-hidden="true" />
            </Button>
          </a>
        </CardContent>
      </Card>
    </motion.div>
  );
}

function SectionBourses({ bourses }: { bourses: Bourse[] }) {
  const { t } = useTranslation();
  const [filtre, setFiltre] = useState<'all' | Bourse['type']>('all');
  const visibles = useMemo(
    () => (filtre === 'all' ? bourses : bourses.filter((b) => b.type === filtre)),
    [bourses, filtre],
  );

  return (
    <section id="bourses" className="py-20 bg-[var(--edu-surface)] scroll-mt-24">
      <div className="max-w-[1440px] mx-auto px-6">
        <SectionHeader
          surtitre={t('guide.financing.step')}
          titre={t('guide.financing.title')}
          description={t('guide.financing.description')}
        />

        <Tabs value={filtre} onValueChange={(v) => setFiltre(v as 'all' | Bourse['type'])} className="mb-8">
          <TabsList className="bg-white border border-[var(--edu-divider)] h-auto p-1 flex-wrap">
            {TYPES_BOURSE.map((type) => (
              <TabsTrigger key={type.value} value={type.value} className="px-4 py-2">
                {type.value === 'all' ? t('guide.scholarships.filter.all') : t(`guide.scholarships.filter.${type.value}`)}
              </TabsTrigger>
            ))}
          </TabsList>
          {TYPES_BOURSE.map((type) => (
            <TabsContent key={type.value} value={type.value} className="mt-8">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" role="list">
                {visibles.map((bourse, index) => (
                  <CarteBourse key={bourse.id} bourse={bourse} index={index} />
                ))}
              </div>
            </TabsContent>
          ))}
        </Tabs>
      </div>
    </section>
  );
}

// ===========================================================================
// Section 5 — Vie en Tunisie
// ===========================================================================

interface BarreBudgetProps {
  label: string;
  valeur: number;
  max: number;
}

function BarreBudget({ label, valeur, max }: BarreBudgetProps) {
  const pct = Math.round((valeur / max) * 100);
  return (
    <div>
      <div className="flex items-baseline justify-between mb-1.5">
        <span className="text-sm text-[var(--edu-text-primary)]">{label}</span>
        <span className="text-sm font-semibold text-[var(--edu-text-primary)]">
          {valeur} TND
        </span>
      </div>
      <div className="h-2.5 rounded-full bg-[var(--edu-divider)] overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          whileInView={{ width: `${pct}%` }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
          viewport={{ once: true }}
          className="h-full bg-[var(--edu-blue)] rounded-full"
        />
      </div>
    </div>
  );
}

function CarteLogement({ logement, index }: { logement: Logement; index: number }) {
  const { t } = useTranslation();
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
      viewport={{ once: true }}
    >
      <Card className="h-full bg-white border-[var(--edu-divider)]">
        <CardHeader>
          <Badge variant="outline" className="w-fit mb-2 border-[var(--edu-blue)] text-[var(--edu-blue)]">
            {t(`guide.housing.type.${logement.type}`)}
          </Badge>
          <CardTitle className="text-lg font-semibold text-[var(--edu-text-primary)]">
            {logement.titre}
          </CardTitle>
          <div className="text-xl font-bold text-[var(--edu-text-primary)]">
            {logement.prixMin} - {logement.prixMax}{' '}
            <span className="text-sm font-normal text-[var(--edu-text-secondary)]">TND/mois</span>
          </div>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <ul className="space-y-2" role="list">
            {logement.avantages.map((a) => (
              <li key={a} className="flex items-start gap-2 text-sm text-[var(--edu-text-secondary)]">
                <CheckCircle
                  className="w-4 h-4 text-[var(--edu-success)] shrink-0 mt-0.5"
                  aria-hidden="true"
                />
                <span>{a}</span>
              </li>
            ))}
          </ul>
          <Separator />
          <ul className="space-y-2" role="list">
            {logement.inconvenients.map((i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-[var(--edu-text-secondary)]">
                <XCircle
                  className="w-4 h-4 text-[var(--edu-danger)] shrink-0 mt-0.5"
                  aria-hidden="true"
                />
                <span>{i}</span>
              </li>
            ))}
          </ul>
          <p className="text-sm italic text-[var(--edu-text-secondary)] border-l-2 border-[var(--edu-blue)] pl-3">
            {logement.conseil}
          </p>
        </CardContent>
      </Card>
    </motion.div>
  );
}

function SectionVie() {
  const { t } = useTranslation();
  const { budgetMensuel, coutVie, logements } = guideData;
  const totalCite =
    budgetMensuel.logementCite + budgetMensuel.restaurationU + budgetMensuel.courses + budgetMensuel.divers;
  const totalPrive =
    budgetMensuel.logementPrive + budgetMensuel.restaurationU + budgetMensuel.courses + budgetMensuel.divers;
  const max = Math.max(totalCite, totalPrive);

  return (
    <section id="vie" className="py-20 scroll-mt-24">
      <div className="max-w-[1440px] mx-auto px-6">
        <SectionHeader
          surtitre={t('guide.life.step')}
          titre={t('guide.life.title')}
          description={t('guide.life.description')}
        />

        {/* Budget mensuel — 2 colonnes */}
        <motion.div {...MOTION_FADE_IN_UP} className="mb-12">
          <h3 className="text-xl font-semibold text-[var(--edu-text-primary)] mb-6">
            {t('guide.life.monthlyBudget')}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="bg-white border-[var(--edu-divider)]">
              <CardHeader>
                <CardTitle className="text-base font-semibold text-[var(--edu-text-primary)]">
                  {t('guide.life.dormStudent')}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <BarreBudget label={t('guide.life.housingDorm')} valeur={budgetMensuel.logementCite} max={max} />
                <BarreBudget label={t('guide.life.universityRestaurant')} valeur={budgetMensuel.restaurationU} max={max} />
                <BarreBudget label={t('guide.life.groceries')} valeur={budgetMensuel.courses} max={max} />
                <BarreBudget label={t('guide.life.entertainment')} valeur={budgetMensuel.divers} max={max} />
                <Separator />
                <div className="flex items-baseline justify-between">
                  <span className="font-semibold text-[var(--edu-text-primary)]">{t('guide.life.monthlyTotal')}</span>
                  <span className="text-2xl font-bold text-[var(--edu-blue)]">{totalCite} TND</span>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white border-[var(--edu-divider)]">
              <CardHeader>
                <CardTitle className="text-base font-semibold text-[var(--edu-text-primary)]">
                  {t('guide.life.privateStudent')}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <BarreBudget label={t('guide.life.housingPrivate')} valeur={budgetMensuel.logementPrive} max={max} />
                <BarreBudget label={t('guide.life.universityRestaurant')} valeur={budgetMensuel.restaurationU} max={max} />
                <BarreBudget label={t('guide.life.groceries')} valeur={budgetMensuel.courses} max={max} />
                <BarreBudget label={t('guide.life.entertainment')} valeur={budgetMensuel.divers} max={max} />
                <Separator />
                <div className="flex items-baseline justify-between">
                  <span className="font-semibold text-[var(--edu-text-primary)]">{t('guide.life.monthlyTotal')}</span>
                  <span className="text-2xl font-bold text-[var(--edu-blue)]">{totalPrive} TND</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </motion.div>

        {/* Tableau coût de la vie */}
        <motion.div {...MOTION_FADE_IN_UP} className="mb-12">
          <h3 className="text-xl font-semibold text-[var(--edu-text-primary)] mb-6">
            {t('guide.life.dailyCosts')}
          </h3>
          <div className="overflow-x-auto rounded-xl border border-[var(--edu-divider)]">
            <table className="w-full text-sm">
              <thead className="bg-[var(--edu-surface)]">
                <tr>
                  <th className="text-left px-4 py-3 font-semibold text-[var(--edu-text-primary)]">{t('guide.life.costCategory')}</th>
                  <th className="text-left px-4 py-3 font-semibold text-[var(--edu-text-primary)]">{t('guide.life.costTND')}</th>
                  <th className="text-left px-4 py-3 font-semibold text-[var(--edu-text-primary)]">{t('guide.life.costEUR')}</th>
                </tr>
              </thead>
              <tbody>
                {coutVie.map((poste, index) => (
                  <tr
                    key={poste.poste}
                    className={index % 2 === 1 ? 'bg-[var(--edu-surface)]' : 'bg-white'}
                  >
                    <td className="px-4 py-3 text-[var(--edu-text-primary)]">{poste.poste}</td>
                    <td className="px-4 py-3 text-[var(--edu-text-secondary)]">{poste.coutTND}</td>
                    <td className="px-4 py-3 text-[var(--edu-text-secondary)]">{poste.coutEUR}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>

        {/* Logements */}
        <motion.div {...MOTION_FADE_IN_UP} className="mb-12">
          <h3 className="text-xl font-semibold text-[var(--edu-text-primary)] mb-6">
            {t('guide.life.housingOptions')}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6" role="list">
            {logements.map((l, index) => (
              <CarteLogement key={l.type} logement={l} index={index} />
            ))}
          </div>
        </motion.div>

        {/* Assurance maladie */}
        <motion.div
          {...MOTION_FADE_IN_UP}
          className="rounded-xl bg-[var(--edu-surface)] border-l-4 border-[var(--edu-blue)] p-6"
        >
          <div className="flex items-start gap-3 mb-3">
            <Stethoscope
              className="w-5 h-5 text-[var(--edu-blue)] shrink-0 mt-0.5"
              aria-hidden="true"
            />
            <h3 className="text-lg font-semibold text-[var(--edu-text-primary)]">{t('guide.life.healthInsurance')}</h3>
          </div>
          <ul className="space-y-2 text-sm text-[var(--edu-text-secondary)] pl-8" role="list">
            <li>
              <Trans i18nKey="guide.life.healthCnam" components={{ strong: <strong className="text-[var(--edu-text-primary)]" /> }} />
            </li>
            <li>
              <Trans i18nKey="guide.life.healthMutual" components={{ strong: <strong className="text-[var(--edu-text-primary)]" /> }} />
            </li>
            <li>
              <Trans i18nKey="guide.life.healthWarning" components={{ strong: <strong className="text-[var(--edu-text-primary)]" /> }} />
            </li>
          </ul>
        </motion.div>
      </div>
    </section>
  );
}

// ===========================================================================
// Section 6 — Admission
// ===========================================================================

function SectionAdmission({ etapes }: { etapes: EtapeAdmission[] }) {
  const { t } = useTranslation();
  const [step, setStep] = useState(0);
  const courante = etapes[step];

  const stepperItems = useMemo(
    () => etapes.map((e) => ({ label: e.titre })),
    [etapes],
  );

  const jours = joursRestants(courante.deadline);
  const couleurDeadline =
    jours < 30
      ? 'bg-[color-mix(in_srgb,var(--edu-danger)_15%,transparent)] text-[var(--edu-danger)] border-[color-mix(in_srgb,var(--edu-danger)_30%,transparent)]'
      : jours < 60
        ? 'bg-[color-mix(in_srgb,var(--edu-warning)_15%,transparent)] text-[var(--edu-warning)] border-[color-mix(in_srgb,var(--edu-warning)_30%,transparent)]'
        : 'bg-[var(--edu-surface)] text-[var(--edu-text-secondary)] border-[var(--edu-divider)]';

  return (
    <section id="admission" className="py-20 bg-[var(--edu-surface)] scroll-mt-24">
      <div className="max-w-[1440px] mx-auto px-6">
        <SectionHeader
          surtitre={t('guide.admissionProcess.step')}
          titre={t('guide.admissionProcess.title')}
          description={t('guide.admissionProcess.description')}
        />

        <div className="rounded-2xl bg-white border border-[var(--edu-divider)] p-6 md:p-8">
          <Stepper steps={stepperItems} currentStep={step} />

          <motion.div
            key={step}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="mt-10"
          >
            <h3 className="text-xl font-semibold text-[var(--edu-text-primary)] mb-3">
              {courante.titre}
            </h3>
            <p className="text-[var(--edu-text-secondary)] leading-relaxed mb-4">
              {courante.description}
            </p>
            <div className="flex flex-wrap items-center gap-3 mb-6">
              <Badge className={`border ${couleurDeadline}`}>
                <Clock className="w-3 h-3" aria-hidden="true" />
                {t('guide.scholarships.deadline', { date: formaterDate(courante.deadline) })}
              </Badge>
              {courante.lien && (
                <a
                  href={courante.lien}
                  target="_blank"
                  rel="noopener noreferrer"
                  title={`Plus d'informations sur ${courante.titre}`}
                  className="inline-flex items-center gap-1.5 text-sm text-[var(--edu-blue)] hover:underline"
                >
                  {t('guide.admission.moreInfo')}
                  <ExternalLink className="w-3.5 h-3.5" aria-hidden="true" />
                </a>
              )}
            </div>

            <div className="rounded-xl bg-[var(--edu-surface)] p-5">
              <div className="text-sm font-semibold text-[var(--edu-text-primary)] mb-3">
                {t('guide.admission.documentsRequired')}
              </div>
              <ul className="space-y-2" role="list">
                {courante.documents.map((doc) => (
                  <li
                    key={doc}
                    className="flex items-start gap-2 text-sm text-[var(--edu-text-secondary)]"
                  >
                    <FileText
                      className="w-4 h-4 text-[var(--edu-blue)] shrink-0 mt-0.5"
                      aria-hidden="true"
                    />
                    <span>{doc}</span>
                  </li>
                ))}
              </ul>
            </div>
          </motion.div>

          <div className="mt-8 flex items-center justify-between gap-4">
            <Button
              variant="outline"
              onClick={() => setStep((s) => Math.max(0, s - 1))}
              disabled={step === 0}
              aria-label={t('guide.admission.previous')}
            >
              <ChevronLeft className="w-4 h-4" aria-hidden="true" />
              {t('guide.admission.previous')}
            </Button>
            <span className="text-sm text-[var(--edu-text-secondary)]">
              {t('guide.admission.stepOf', { current: step + 1, total: etapes.length })}
            </span>
            <Button
              onClick={() => setStep((s) => Math.min(etapes.length - 1, s + 1))}
              disabled={step === etapes.length - 1}
              className="bg-[var(--edu-blue)] hover:bg-[var(--edu-blue-hover)] text-white"
              aria-label={t('guide.admission.next')}
            >
              {t('guide.admission.next')}
              <ChevronRight className="w-4 h-4" aria-hidden="true" />
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}

// ===========================================================================
// Section 7 — Équivalence
// ===========================================================================

function SectionEquivalence({ pays }: { pays: EquivalencePays[] }) {
  const { t } = useTranslation();
  return (
    <section id="equivalence" className="py-20 scroll-mt-24">
      <div className="max-w-[1440px] mx-auto px-6">
        <SectionHeader
          surtitre={t('guide.equivalenceSection.step')}
          titre={t('guide.equivalenceSection.title')}
          description={t('guide.equivalenceSection.description')}
        />

        <motion.div
          {...MOTION_FADE_IN_UP}
          className="mb-10 rounded-xl bg-[var(--edu-elevated)] border border-[var(--edu-divider)] p-6"
        >
          <h3 className="text-lg font-semibold text-[var(--edu-text-primary)] mb-3">
            {t('guide.equivalenceSection.cneqRole')}
          </h3>
          <p className="text-sm text-[var(--edu-text-secondary)] leading-relaxed mb-4">
            <Trans i18nKey="guide.equivalenceSection.cneqDescription" components={{ strong: <strong className="text-[var(--edu-text-primary)]" /> }} />
          </p>
          <div className="flex flex-wrap items-center gap-3">
            <Badge className="bg-[color-mix(in_srgb,var(--edu-warning)_15%,transparent)] text-[var(--edu-warning)] border border-[color-mix(in_srgb,var(--edu-warning)_30%,transparent)]">
              <Clock className="w-3 h-3" aria-hidden="true" />
              {t('guide.equivalenceSection.cneqDelay')}
            </Badge>
            <a
              href="https://www.mesrs.tn"
              target="_blank"
              rel="noopener noreferrer"
              title={t('guide.equivalenceSection.cneqSite')}
              className="inline-flex items-center gap-1.5 text-sm text-[var(--edu-blue)] hover:underline"
            >
              {t('guide.equivalenceSection.cneqSite')}
              <ExternalLink className="w-3.5 h-3.5" aria-hidden="true" />
            </a>
          </div>
        </motion.div>

        <motion.div {...MOTION_FADE_IN_UP}>
          <Accordion type="single" collapsible className="space-y-3">
            {pays.map((p) => (
              <AccordionItem
                key={p.pays}
                value={p.pays}
                className="rounded-xl border border-[var(--edu-divider)] bg-white px-5"
              >
                <AccordionTrigger className="hover:no-underline py-4">
                  <span className="flex items-center gap-3 text-base font-semibold text-[var(--edu-text-primary)]">
                    <span className="text-2xl" aria-hidden="true">{p.drapeau}</span>
                    {p.pays}
                  </span>
                </AccordionTrigger>
                <AccordionContent className="pt-2">
                  <div className="space-y-4 text-sm text-[var(--edu-text-secondary)]">
                    <div>
                      <div className="font-semibold text-[var(--edu-text-primary)] mb-1">{t('guide.equivalenceSection.educationalSystem')}</div>
                      <p className="leading-relaxed">{p.systeme}</p>
                    </div>
                    <div>
                      <div className="font-semibold text-[var(--edu-text-primary)] mb-1">{t('guide.equivalenceSection.procedure')}</div>
                      <p className="leading-relaxed">{p.procedure}</p>
                    </div>
                    <div>
                      <div className="font-semibold text-[var(--edu-text-primary)] mb-1">{t('guide.equivalenceSection.contactOrganization')}</div>
                      <p>{p.organismeContact}</p>
                    </div>
                    <Badge className="bg-[color-mix(in_srgb,var(--edu-warning)_15%,transparent)] text-[var(--edu-warning)] border border-[color-mix(in_srgb,var(--edu-warning)_30%,transparent)]">
                      <Clock className="w-3 h-3" aria-hidden="true" />
                      {p.delai}
                    </Badge>
                  </div>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </motion.div>
      </div>
    </section>
  );
}

// ===========================================================================
// Section 8 — Documents (checklist)
// ===========================================================================

const CATEGORIES_CHECKLIST: { value: ItemChecklist['categorie'] }[] = [
  { value: 'identite' },
  { value: 'academique' },
  { value: 'financier' },
  { value: 'sante' },
  { value: 'logement' },
];

function SectionDocuments({ items }: { items: ItemChecklist[] }) {
  const { t } = useTranslation();
  const [coches, setCoches] = useState<string[]>([]);

  const toggle = useCallback((id: string) => {
    setCoches((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  }, []);

  const total = items.length;
  const fait = coches.length;
  const pct = total === 0 ? 0 : Math.round((fait / total) * 100);
  const couleurProgress =
    pct >= 100 ? 'bg-[var(--edu-success)]' : pct < 50 ? 'bg-[var(--edu-warning)]' : 'bg-[var(--edu-blue)]';

  const handleCopier = useCallback(async () => {
    const lignes: string[] = ['📋 Ma checklist EduBridge — Étudier en Tunisie\n'];
    CATEGORIES_CHECKLIST.forEach((cat) => {
      const itemsCat = items.filter((i) => i.categorie === cat.value && coches.includes(i.id));
      if (itemsCat.length === 0) return;
      lignes.push(`\n## ${i18n.t(`guide.checklist.categories.${cat.value}`)}`);
      itemsCat.forEach((i) => lignes.push(`✓ ${i.label}${i.obligatoire ? ` (${i18n.t('guide.documents.obligatoire')})` : ''}`));
    });
    if (lignes.length === 1) {
      lignes.push(`\n${i18n.t('guide.documents.noneChecked')}`);
    }
    const texte = lignes.join('\n');
    try {
      await navigator.clipboard.writeText(texte);
      toast.success(i18n.t('guide.documents.checklistCopied'));
    } catch {
      toast.error(i18n.t('guide.documents.copyError'));
    }
  }, [coches, items]);

  return (
    <section id="documents" className="py-20 bg-[var(--edu-surface)] scroll-mt-24">
      <div className="max-w-[1440px] mx-auto px-6">
        <SectionHeader
          surtitre={t('guide.documentChecklist.step')}
          titre={t('guide.documentChecklist.title')}
          description={t('guide.documentChecklist.description')}
        />

        {/* Compteur global */}
        <motion.div {...MOTION_FADE_IN_UP} className="mb-8 rounded-xl bg-white border border-[var(--edu-divider)] p-6">
          <div className="flex flex-wrap items-baseline justify-between gap-3 mb-3">
            <div>
              <div className="text-2xl font-bold text-[var(--edu-text-primary)]">
                {fait} / {total} <span className="text-base font-normal text-[var(--edu-text-secondary)]">{t('guide.documents.prepared')}</span>
              </div>
            </div>
            <Button
              onClick={handleCopier}
              className="bg-[var(--edu-blue)] hover:bg-[var(--edu-blue-hover)] text-white"
              aria-label={t('guide.documents.copyChecklist')}
            >
              <Copy className="w-4 h-4" aria-hidden="true" />
              {t('guide.documents.copyChecklist')}
            </Button>
          </div>
          <div className="h-2.5 rounded-full bg-[var(--edu-divider)] overflow-hidden">
            <motion.div
              animate={{ width: `${pct}%` }}
              transition={{ duration: 0.4, ease: 'easeOut' }}
              className={`h-full rounded-full ${couleurProgress}`}
            />
          </div>
        </motion.div>

        <Tabs defaultValue="identite">
          <TabsList className="bg-white border border-[var(--edu-divider)] h-auto p-1 flex-wrap">
            {CATEGORIES_CHECKLIST.map((cat) => (
              <TabsTrigger key={cat.value} value={cat.value} className="px-4 py-2">
                {t(`guide.checklist.categories.${cat.value}`)}
              </TabsTrigger>
            ))}
          </TabsList>

          {CATEGORIES_CHECKLIST.map((cat) => {
            const itemsCat = items.filter((i) => i.categorie === cat.value);
            return (
              <TabsContent key={cat.value} value={cat.value} className="mt-6">
                <ul className="space-y-3" role="list">
                  {itemsCat.map((item) => {
                    const coche = coches.includes(item.id);
                    return (
                      <li
                        key={item.id}
                        className="rounded-xl bg-white border border-[var(--edu-divider)] p-4"
                      >
                        <label className="flex items-start gap-3 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={coche}
                            onChange={() => toggle(item.id)}
                            className="mt-1 w-5 h-5 rounded border-[var(--edu-divider)] text-[var(--edu-blue)] focus:ring-[var(--edu-blue)] cursor-pointer"
                            aria-label={`Marquer "${item.label}" comme préparé`}
                          />
                          <div className="flex-1">
                            <div className="flex flex-wrap items-center gap-2 mb-1">
                              <span
                                className={`text-sm ${
                                  coche
                                    ? 'line-through text-[var(--edu-text-secondary)]'
                                    : 'text-[var(--edu-text-primary)]'
                                }`}
                              >
                                {item.label}
                              </span>
                              {item.obligatoire && (
                                <Badge className="bg-[color-mix(in_srgb,var(--edu-danger)_15%,transparent)] text-[var(--edu-danger)] border border-[color-mix(in_srgb,var(--edu-danger)_30%,transparent)] text-xs">
                                  {t('guide.documents.obligatoire')}
                                </Badge>
                              )}
                            </div>
                            {item.conseil && (
                              <div className="flex items-start gap-1.5 text-xs text-[var(--edu-text-secondary)] italic">
                                <Info className="w-3.5 h-3.5 shrink-0 mt-0.5" aria-hidden="true" />
                                <span>{item.conseil}</span>
                              </div>
                            )}
                          </div>
                        </label>
                      </li>
                    );
                  })}
                </ul>
              </TabsContent>
            );
          })}
        </Tabs>
      </div>
    </section>
  );
}

// ===========================================================================
// Section 9 — Sécurité
// ===========================================================================

function SectionSecurite({
  urgences,
  conseils,
}: {
  urgences: Urgence[];
  conseils: ConseilSecurite[];
}) {
  const { t } = useTranslation();
  return (
    <section id="securite" className="py-20 scroll-mt-24">
      <div className="max-w-[1440px] mx-auto px-6">
        <SectionHeader
          surtitre={t('guide.safety.step')}
          titre={t('guide.safety.title')}
          description={t('guide.safety.description')}
        />

        {/* Bloc urgences en premier */}
        <motion.div
          {...MOTION_FADE_IN_UP}
          className="mb-12 rounded-2xl border-2 p-6 md:p-8"
          style={{
            background: 'color-mix(in srgb, var(--edu-danger) 5%, white)',
            borderColor: 'color-mix(in srgb, var(--edu-danger) 30%, transparent)',
          }}
        >
          <div className="flex items-center gap-3 mb-6">
            <Phone className="w-6 h-6 text-[var(--edu-danger)]" aria-hidden="true" />
            <h3 className="text-xl font-semibold text-[var(--edu-text-primary)]">
              {t('guide.safety.emergencyNumbers')}
            </h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4" role="list">
            {urgences.map((u) => (
              <div
                key={u.service}
                className="rounded-xl bg-white border border-[var(--edu-divider)] p-4"
              >
                <div className="text-xs font-semibold text-[var(--edu-text-secondary)] uppercase tracking-wide mb-1">
                  {u.service}
                </div>
                <div className="text-xl font-bold text-[var(--edu-danger)] mb-1 tabular-nums">
                  {u.numero}
                </div>
                <div className="text-xs text-[var(--edu-text-secondary)]">{u.disponibilite}</div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Conseils */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6" role="list">
          {conseils.map((c, index) => {
            const Icone = ICONES_SECURITE[c.icone] ?? Shield;
            return (
              <motion.div
                key={c.titre}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                viewport={{ once: true }}
                className="flex items-start gap-4 rounded-xl bg-[var(--edu-surface)] p-5"
              >
                <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center shrink-0">
                  <Icone className="w-5 h-5 text-[var(--edu-blue)]" aria-hidden="true" />
                </div>
                <div>
                  <h4 className="font-semibold text-[var(--edu-text-primary)] mb-1">{c.titre}</h4>
                  <p className="text-sm text-[var(--edu-text-secondary)] leading-relaxed">
                    {c.description}
                  </p>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

// ===========================================================================
// Section 10 — Culture
// ===========================================================================

function SectionCulture({ themes }: { themes: ThemeCulture[] }) {
  const { t } = useTranslation();
  return (
    <section id="culture" className="py-20 bg-[var(--edu-surface)] scroll-mt-24">
      <div className="max-w-[1440px] mx-auto px-6">
        <SectionHeader
          surtitre={t('guide.cultureIntegration.step')}
          titre={t('guide.cultureIntegration.title')}
          description={t('guide.cultureIntegration.description')}
        />

        <motion.div {...MOTION_FADE_IN_UP}>
          <Accordion type="single" collapsible className="space-y-3">
            {themes.map((t) => (
              <AccordionItem
                key={t.theme}
                value={t.theme}
                className="rounded-xl border border-[var(--edu-divider)] bg-white px-5"
              >
                <AccordionTrigger className="hover:no-underline py-4 text-base font-semibold text-[var(--edu-text-primary)]">
                  {t.theme}
                </AccordionTrigger>
                <AccordionContent className="pt-2">
                  <p className="text-sm text-[var(--edu-text-secondary)] leading-relaxed mb-4">
                    {t.introduction}
                  </p>
                  <ul className="space-y-2" role="list">
                    {t.conseils.map((conseil) => (
                      <li
                        key={conseil}
                        className="flex items-start gap-2 text-sm text-[var(--edu-text-secondary)]"
                      >
                        <CheckCircle
                          className="w-4 h-4 text-[var(--edu-success)] shrink-0 mt-0.5"
                          aria-hidden="true"
                        />
                        <span>{conseil}</span>
                      </li>
                    ))}
                  </ul>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </motion.div>

        <motion.div
          {...MOTION_FADE_IN_UP}
          className="mt-10 rounded-xl bg-white border-l-4 border-[var(--edu-blue)] p-6"
        >
          <p className="text-[var(--edu-text-primary)] leading-relaxed">
            {t('guide.cultureIntegration.closingMessage')}
          </p>
        </motion.div>
      </div>
    </section>
  );
}

// ===========================================================================
// Section 11 — Contact
// ===========================================================================

function SectionContact() {
  const { t } = useTranslation();
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const { contact } = guideData;

  const handleQuestion = useCallback(() => {
    if (isAuthenticated) {
      window.location.href = `mailto:${contact.email}?subject=Question%20guide%20%C3%A9tudiants%20%C3%A9trangers`;
    } else {
      toast.info(t('guide.contact.loginForAssistance'));
      navigate('/login');
    }
  }, [isAuthenticated, navigate, contact.email]);

  return (
    <section id="contact" className="py-20 scroll-mt-24">
      <div className="max-w-[1440px] mx-auto px-6">
        <SectionHeader
          surtitre={t('guide.contactSection.step')}
          titre={t('guide.contactSection.title')}
          description={t('guide.contactSection.description')}
        />

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10" role="list">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0 }}
            viewport={{ once: true }}
          >
            <Card className="h-full bg-white border-[var(--edu-divider)]">
              <CardContent className="pt-6 flex flex-col items-start gap-3">
                <div className="w-12 h-12 rounded-full bg-[color-mix(in_srgb,var(--edu-blue)_15%,white)] flex items-center justify-center">
                  <Mail className="w-6 h-6 text-[var(--edu-blue)]" aria-hidden="true" />
                </div>
                <div className="text-sm font-semibold text-[var(--edu-text-secondary)] uppercase tracking-wide">
                  Email
                </div>
                <a
                  href={`mailto:${contact.email}`}
                  className="text-base font-semibold text-[var(--edu-text-primary)] hover:text-[var(--edu-blue)] break-all"
                >
                  {contact.email}
                </a>
                <Badge className="bg-[color-mix(in_srgb,var(--edu-blue)_15%,transparent)] text-[var(--edu-blue)] border border-[color-mix(in_srgb,var(--edu-blue)_30%,transparent)]">
                  {contact.emailReponse}
                </Badge>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            viewport={{ once: true }}
          >
            <Card className="h-full bg-white border-[var(--edu-divider)]">
              <CardContent className="pt-6 flex flex-col items-start gap-3">
                <div className="w-12 h-12 rounded-full bg-[color-mix(in_srgb,var(--edu-success)_15%,white)] flex items-center justify-center">
                  <MessageCircle className="w-6 h-6 text-[var(--edu-success)]" aria-hidden="true" />
                </div>
                <div className="text-sm font-semibold text-[var(--edu-text-secondary)] uppercase tracking-wide">
                  WhatsApp
                </div>
                <span className="text-base font-semibold text-[var(--edu-text-primary)]">
                  {contact.whatsapp}
                </span>
                <Badge className="bg-[color-mix(in_srgb,var(--edu-success)_15%,transparent)] text-[var(--edu-success)] border border-[color-mix(in_srgb,var(--edu-success)_30%,transparent)]">
                  {contact.whatsappReponse}
                </Badge>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            viewport={{ once: true }}
          >
            <Card className="h-full bg-white border-[var(--edu-divider)]">
              <CardContent className="pt-6 flex flex-col items-start gap-3">
                <div className="w-12 h-12 rounded-full bg-[color-mix(in_srgb,var(--edu-warning)_15%,white)] flex items-center justify-center">
                  <MapPin className="w-6 h-6 text-[var(--edu-warning)]" aria-hidden="true" />
                </div>
                <div className="text-sm font-semibold text-[var(--edu-text-secondary)] uppercase tracking-wide">
                  {t('guide.contact.permanence')}
                </div>
                <div>
                  <div className="text-base font-semibold text-[var(--edu-text-primary)]">
                    {contact.permanence.jours}
                  </div>
                  <div className="text-sm text-[var(--edu-text-secondary)]">
                    {contact.permanence.heures}
                  </div>
                </div>
                <div className="text-sm text-[var(--edu-text-secondary)]">
                  {contact.permanence.lieu}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Communauté */}
        <motion.div
          {...MOTION_FADE_IN_UP}
          className="rounded-2xl p-6 md:p-8 mb-8"
          style={{
            background: 'color-mix(in srgb, var(--edu-blue) 8%, white)',
          }}
        >
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <div className="text-sm font-semibold text-[var(--edu-blue)] uppercase tracking-wide mb-1">
                {t('guide.contact.community')}
              </div>
              <h3 className="text-xl font-semibold text-[var(--edu-text-primary)] mb-1">
                {contact.communaute.plateforme}
              </h3>
              <p className="text-sm text-[var(--edu-text-secondary)] max-w-xl">
                {contact.communaute.description}
              </p>
            </div>
            <a
              href={contact.communaute.lien}
              target="_blank"
              rel="noopener noreferrer"
              title={`Rejoindre ${contact.communaute.plateforme}`}
            >
              <Button className="bg-[var(--edu-blue)] hover:bg-[var(--edu-blue-hover)] text-white">
                {t('guide.contact.joinCommunity')}
                <ExternalLink className="w-4 h-4" aria-hidden="true" />
              </Button>
            </a>
          </div>
        </motion.div>

        {/* CTA principal */}
        <motion.div {...MOTION_FADE_IN_UP} className="flex justify-center">
          <Button
            onClick={handleQuestion}
            size="lg"
            className="bg-[var(--edu-blue)] hover:bg-[var(--edu-blue-hover)] text-white px-8"
          >
            {t('guide.contact.askQuestion')}
          </Button>
        </motion.div>
      </div>
    </section>
  );
}

// ===========================================================================
// Composant principal
// ===========================================================================

export function Guide() {
  // Garde-fou : impossible de monter la page en mode sombre.
  // Cette page n'a pas été designée pour le dark mode (cf. cahier des charges).
  const themeRef = useRef<boolean | null>(null);
  useEffect(() => {
    const root = document.documentElement;
    themeRef.current = root.classList.contains('dark');
    if (themeRef.current) {
      root.classList.remove('dark');
    }
    return () => {
      if (themeRef.current) {
        root.classList.add('dark');
      }
    };
  }, []);

  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      <Hero stats={guideData.stats} />
      <NavigationSticky />
      <SectionVisa etapes={guideData.etapesVisa} />
      <SectionBourses bourses={guideData.bourses} />
      <SectionVie />
      <SectionAdmission etapes={guideData.etapesAdmission} />
      <SectionEquivalence pays={guideData.equivalencePays} />
      <SectionDocuments items={guideData.checklist} />
      <SectionSecurite urgences={guideData.urgences} conseils={guideData.conseilsSecurite} />
      <SectionCulture themes={guideData.culture} />
      <SectionContact />
      <Footer />
    </div>
  );
}
