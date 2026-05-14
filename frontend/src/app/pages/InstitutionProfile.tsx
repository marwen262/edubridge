import React from 'react';
import { useParams, useNavigate } from 'react-router';
import { useTranslation } from 'react-i18next';
import {
  MapPin,
  Globe,
  Star,
  CheckCircle,
  Mail,
  Phone,
  Users,
  GraduationCap,
  TrendingUp,
  Languages,
  ExternalLink,
} from 'lucide-react';
import { Navbar } from '../components/Navbar';
import { Footer } from '../components/Footer';
import { ProgramCard } from '../components/ProgramCard';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { AccreditationBadge } from '../components/ui/AccreditationBadge';
import { useInstitut } from '@/hooks/useInstitut';
import { usePrograms } from '@/hooks/usePrograms';
import { motion } from 'motion/react';

function getInitials(nom: string): string {
  return nom
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w.charAt(0).toUpperCase())
    .join('');
}

// Carte stat numérique réutilisable — homogène pour les 4 indicateurs
interface StatCardProps {
  icon: React.ReactNode;
  value: React.ReactNode;
  label: string;
}

function StatCard({ icon, value, label }: StatCardProps) {
  return (
    <div
      className="flex flex-col items-center text-center rounded-xl px-4 py-3"
      style={{ background: 'var(--edu-surface)' }}
    >
      <div className="text-[var(--edu-blue)] mb-1">{icon}</div>
      <p style={{ fontSize: '1.35rem', fontWeight: 700, color: 'var(--edu-text-primary)', lineHeight: 1.1 }}>
        {value}
      </p>
      <p style={{ fontSize: '0.75rem', color: 'var(--edu-text-secondary)', marginTop: 4 }}>
        {label}
      </p>
    </div>
  );
}

export function InstitutionProfile() {
  const { t, i18n } = useTranslation();
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { institut, loading, error } = useInstitut(slug);

  const { programs: programmes } = usePrograms(
    institut ? { institut_id: institut.id } : undefined,
  );

  const [logoError, setLogoError] = React.useState(false);

  // Agrégation : domaines uniques couverts par les programmes de l'institut
  const domainesUniques = React.useMemo(() => {
    const set = new Set<string>();
    programmes.forEach((p) => {
      if (p.domaine) set.add(p.domaine);
    });
    return Array.from(set);
  }, [programmes]);

  // Agrégation : langues d'enseignement uniques
  const languesUniques = React.useMemo(() => {
    const set = new Set<string>();
    programmes.forEach((p) => {
      if (p.langue) set.add(p.langue);
    });
    return Array.from(set);
  }, [programmes]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-t-2 border-[var(--edu-blue)] animate-spin" />
      </div>
    );
  }

  if (error || !institut) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-[var(--edu-danger)]">{error ?? t('institutionProfile.notFound')}</p>
          <button
            onClick={() => navigate('/')}
            className="mt-4 px-4 py-2 bg-[var(--edu-blue)] text-white rounded-lg"
          >
            {t('institutionProfile.backHome')}
          </button>
        </div>
      </div>
    );
  }

  const coverSrc = institut.image_couverture ?? institut.logo;
  const localisation = [institut.adresse?.ville, institut.adresse?.gouvernorat]
    .filter(Boolean)
    .join(', ');
  const adresseComplete = [
    institut.adresse?.rue,
    institut.adresse?.ville,
    institut.adresse?.gouvernorat,
    institut.adresse?.pays,
  ]
    .filter(Boolean)
    .join(', ');
  const mapsUrl = institut.adresse?.lien_maps
    || (adresseComplete ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(adresseComplete)}` : null);

  // Domaine de site web "propre" pour affichage (sans http(s)://)
  const siteAffiche = institut.site_web
    ? institut.site_web.replace(/^https?:\/\//, '').replace(/\/$/, '')
    : null;

  // Locale courante pour le formatage des nombres (3500 → "3 500" en FR, "3,500" en EN)
  const numberLocale = i18n.language.startsWith('en') ? 'en-US' : 'fr-FR';

  // Highlights "Pourquoi choisir" — construits depuis les vraies données
  const highlights: string[] = [];
  if (institut.accreditations && institut.accreditations.length > 0) {
    highlights.push(
      t('institutionProfile.whyChoose.accreditations', {
        count: institut.accreditations.length,
        list: institut.accreditations.join(', '),
      }),
    );
  }
  if (institut.nombre_etudiants && institut.nombre_etudiants > 0) {
    highlights.push(
      t('institutionProfile.whyChoose.studentsFormed', {
        value: institut.nombre_etudiants.toLocaleString(numberLocale),
      }),
    );
  }
  if (programmes.length > 0) {
    highlights.push(
      t('institutionProfile.whyChoose.programsOffered', { count: programmes.length }),
    );
  }
  if (institut.est_verifie) {
    highlights.push(t('institutionProfile.whyChoose.verifiedByTeam'));
  }

  return (
    <div className="min-h-screen bg-[var(--edu-surface)]">
      <Navbar transparent />

      {/* Bannière — remonte derrière la navbar grâce au -mt */}
      <div className="relative h-[340px] sm:h-[460px] overflow-hidden -mt-[88px] sm:-mt-[100px]">
        {coverSrc ? (
          <img
            src={coverSrc}
            alt={institut.nom}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full hero-gradient" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-black/15 to-transparent" />
      </div>

      {/* ===== HERO CARD — refondu (4 stats + accréd dédiée + 2 CTAs) ===== */}
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 -mt-20 sm:-mt-28 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="glass-card rounded-3xl p-5 sm:p-8"
        >
          {/* Ligne 1 : logo + identité */}
          <div className="flex items-start gap-5 mb-6">
            {institut.logo && !logoError ? (
              <img
                src={institut.logo}
                alt={institut.nom}
                className="w-24 h-24 rounded-xl object-contain bg-white p-1.5 shadow-md flex-shrink-0"
                onError={() => setLogoError(true)}
              />
            ) : (
              <div
                className="w-24 h-24 rounded-xl shadow-md flex items-center justify-center flex-shrink-0 font-bold text-white text-2xl"
                style={{ backgroundColor: 'var(--edu-blue)' }}
              >
                {getInitials(institut.nom)}
              </div>
            )}

            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2 mb-1">
                <h1 className="text-2xl sm:text-3xl font-bold text-[var(--edu-text-primary)] leading-tight">
                  {institut.nom}
                </h1>
                {institut.sigle && (
                  <span className="text-base font-medium text-[var(--edu-text-secondary)]">
                    ({institut.sigle})
                  </span>
                )}
                {institut.est_verifie && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[var(--edu-blue)] text-white">
                    <CheckCircle className="w-3 h-3" />
                    {t('institutionProfile.verified')}
                  </span>
                )}
              </div>
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[var(--edu-text-secondary)] text-sm">
                {localisation && (
                  <span className="inline-flex items-center gap-1.5">
                    <MapPin className="w-4 h-4 flex-shrink-0" />
                    {mapsUrl ? (
                      <a href={mapsUrl} target="_blank" rel="noopener noreferrer" className="hover:text-[var(--edu-blue)] transition-colors">
                        {localisation}
                      </a>
                    ) : localisation}
                  </span>
                )}
                {siteAffiche && (
                  <>
                    {localisation && <span aria-hidden="true">•</span>}
                    <a
                      href={institut.site_web ?? '#'}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 hover:text-[var(--edu-blue)] transition-colors"
                    >
                      <Globe className="w-4 h-4 flex-shrink-0" />
                      {siteAffiche}
                    </a>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Ligne 2 : 4 stats numériques homogènes */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
            {institut.note != null && (
              <StatCard
                icon={<Star className="w-5 h-5 fill-[var(--edu-accent)] text-[var(--edu-accent)]" />}
                value={institut.note}
                label={t('institutionProfile.stats.rating')}
              />
            )}
            <StatCard
              icon={<GraduationCap className="w-5 h-5" />}
              value={programmes.length}
              label={t('institutionProfile.stats.programs', { count: programmes.length })}
            />
            {institut.nombre_etudiants != null && (
              <StatCard
                icon={<Users className="w-5 h-5" />}
                value={institut.nombre_etudiants.toLocaleString(numberLocale)}
                label={t('institutionProfile.stats.students')}
              />
            )}
            {institut.taux_acceptation != null && (
              <StatCard
                icon={<TrendingUp className="w-5 h-5" />}
                value={`${Math.round(institut.taux_acceptation * 100)} %`}
                label={t('institutionProfile.stats.accepted')}
              />
            )}
          </div>

          {/* Ligne 3 : Accréditations sur ligne dédiée */}
          {institut.accreditations && institut.accreditations.length > 0 && (
            <div className="mb-6 pt-6 border-t border-[var(--edu-divider)]">
              <h3 className="text-xs font-semibold text-[var(--edu-text-secondary)] uppercase tracking-wider mb-3">
                {t('institutionProfile.stats.accreditationsLabel')}
              </h3>
              <div className="flex flex-wrap items-center gap-3">
                {institut.accreditations.map((acc) => (
                  <AccreditationBadge key={acc} name={acc} />
                ))}
              </div>
            </div>
          )}

          {/* Ligne 4 : CTAs principaux */}
          <div className="flex flex-wrap gap-3">
            {institut.site_web && (
              <a href={institut.site_web} target="_blank" rel="noopener noreferrer">
                <Button className="rounded-full bg-[var(--edu-blue)] hover:bg-[var(--edu-blue-hover)] text-white">
                  <Globe className="w-4 h-4 mr-2" />
                  {t('institutionProfile.cta.visitWebsite')}
                </Button>
              </a>
            )}
            {institut.contact?.email && (
              <a href={`mailto:${institut.contact.email}`}>
                <Button
                  variant="outline"
                  className="rounded-full border-[var(--edu-border)] text-[var(--edu-text-primary)] hover:bg-[var(--edu-surface)]"
                >
                  <Mail className="w-4 h-4 mr-2" />
                  {t('institutionProfile.cta.contact')}
                </Button>
              </a>
            )}
          </div>
        </motion.div>
      </div>

      {/* ===== CORPS — layout 2 colonnes (contenu principal + sidebar) ===== */}
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Colonne principale (2/3) */}
          <div className="lg:col-span-2 space-y-6">
            {/* À propos */}
            {institut.description && (
              <motion.section
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35, delay: 0.08 }}
                className="glass-card rounded-2xl p-6 sm:p-8"
              >
                <h2 className="text-xl font-bold text-[var(--edu-text-primary)] mb-4">
                  {t('institutionProfile.about')}
                </h2>
                <p className="text-[var(--edu-text-secondary)] leading-relaxed">
                  {institut.description}
                </p>
              </motion.section>
            )}

            {/* Domaines couverts — agrégés depuis les programmes */}
            {domainesUniques.length > 0 && (
              <motion.section
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35, delay: 0.13 }}
                className="glass-card rounded-2xl p-6 sm:p-8"
              >
                <h2 className="text-xl font-bold text-[var(--edu-text-primary)] mb-2">
                  {t('institutionProfile.domains.title')}
                </h2>
                <p className="text-sm text-[var(--edu-text-secondary)] mb-4">
                  {t('institutionProfile.domains.description')}
                </p>
                <div className="flex flex-wrap gap-2">
                  {domainesUniques.map((d) => (
                    <Badge
                      key={d}
                      variant="outline"
                      className="px-3 py-1.5 text-sm font-medium border-[var(--edu-blue)]/30 text-[var(--edu-blue)] bg-[var(--edu-blue)]/5 hover:bg-[var(--edu-blue)]/10 transition-colors"
                    >
                      {t(`program.domains.${d}`, { defaultValue: d })}
                    </Badge>
                  ))}
                </div>
              </motion.section>
            )}

            {/* Pourquoi choisir cet institut — highlights dérivés des données */}
            {highlights.length > 0 && (
              <motion.section
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35, delay: 0.18 }}
                className="glass-card rounded-2xl p-6 sm:p-8"
              >
                <h2 className="text-xl font-bold text-[var(--edu-text-primary)] mb-4">
                  {t('institutionProfile.whyChoose.title')}
                </h2>
                <ul className="space-y-3">
                  {highlights.map((h) => (
                    <li key={h} className="flex items-start gap-3">
                      <CheckCircle className="w-5 h-5 text-[var(--edu-success)] flex-shrink-0 mt-0.5" />
                      <span className="text-[var(--edu-text-secondary)] leading-relaxed">{h}</span>
                    </li>
                  ))}
                </ul>
              </motion.section>
            )}
          </div>

          {/* Sidebar (1/3) — Infos rapides, sticky */}
          <aside className="space-y-6">
            <motion.section
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, delay: 0.1 }}
              className="glass-card rounded-2xl p-6 lg:sticky lg:top-24"
            >
              <h3 className="text-base font-bold text-[var(--edu-text-primary)] mb-5">
                {t('institutionProfile.quickInfo.title')}
              </h3>
              <dl className="space-y-4">
                {adresseComplete && (
                  <div className="flex items-start gap-3">
                    <MapPin className="w-4 h-4 flex-shrink-0 mt-0.5 text-[var(--edu-blue)]" />
                    <div className="min-w-0 flex-1">
                      <dt className="text-xs font-semibold text-[var(--edu-text-secondary)] uppercase tracking-wider mb-0.5">
                        {t('institutionProfile.quickInfo.address')}
                      </dt>
                      <dd className="text-sm text-[var(--edu-text-primary)] leading-snug break-words">
                        {mapsUrl ? (
                          <a
                            href={mapsUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="hover:text-[var(--edu-blue)] transition-colors inline-flex items-start gap-1"
                          >
                            <span>{adresseComplete}</span>
                            <ExternalLink className="w-3 h-3 flex-shrink-0 mt-0.5 opacity-60" />
                          </a>
                        ) : adresseComplete}
                      </dd>
                    </div>
                  </div>
                )}

                {institut.contact?.email && (
                  <div className="flex items-start gap-3">
                    <Mail className="w-4 h-4 flex-shrink-0 mt-0.5 text-[var(--edu-blue)]" />
                    <div className="min-w-0 flex-1">
                      <dt className="text-xs font-semibold text-[var(--edu-text-secondary)] uppercase tracking-wider mb-0.5">
                        {t('institutionProfile.quickInfo.email')}
                      </dt>
                      <dd className="text-sm">
                        <a
                          href={`mailto:${institut.contact.email}`}
                          className="text-[var(--edu-text-primary)] hover:text-[var(--edu-blue)] transition-colors break-all"
                        >
                          {institut.contact.email}
                        </a>
                      </dd>
                    </div>
                  </div>
                )}

                {institut.contact?.telephone && (
                  <div className="flex items-start gap-3">
                    <Phone className="w-4 h-4 flex-shrink-0 mt-0.5 text-[var(--edu-blue)]" />
                    <div className="min-w-0 flex-1">
                      <dt className="text-xs font-semibold text-[var(--edu-text-secondary)] uppercase tracking-wider mb-0.5">
                        {t('institutionProfile.quickInfo.phone')}
                      </dt>
                      <dd className="text-sm">
                        <a
                          href={`tel:${institut.contact.telephone}`}
                          className="text-[var(--edu-text-primary)] hover:text-[var(--edu-blue)] transition-colors"
                        >
                          {institut.contact.telephone}
                        </a>
                      </dd>
                    </div>
                  </div>
                )}

                {institut.site_web && (
                  <div className="flex items-start gap-3">
                    <Globe className="w-4 h-4 flex-shrink-0 mt-0.5 text-[var(--edu-blue)]" />
                    <div className="min-w-0 flex-1">
                      <dt className="text-xs font-semibold text-[var(--edu-text-secondary)] uppercase tracking-wider mb-0.5">
                        {t('institutionProfile.quickInfo.website')}
                      </dt>
                      <dd className="text-sm">
                        <a
                          href={institut.site_web}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-[var(--edu-text-primary)] hover:text-[var(--edu-blue)] transition-colors break-all"
                        >
                          {siteAffiche}
                          <ExternalLink className="w-3 h-3 flex-shrink-0" />
                        </a>
                      </dd>
                    </div>
                  </div>
                )}

                {languesUniques.length > 0 && (
                  <div className="flex items-start gap-3">
                    <Languages className="w-4 h-4 flex-shrink-0 mt-0.5 text-[var(--edu-blue)]" />
                    <div className="min-w-0 flex-1">
                      <dt className="text-xs font-semibold text-[var(--edu-text-secondary)] uppercase tracking-wider mb-0.5">
                        {t('institutionProfile.quickInfo.languages')}
                      </dt>
                      <dd className="text-sm text-[var(--edu-text-primary)] capitalize">
                        {languesUniques.join(' · ')}
                      </dd>
                    </div>
                  </div>
                )}
              </dl>
            </motion.section>
          </aside>
        </div>
      </div>

      {/* ===== PROGRAMMES — pleine largeur sous le layout 2 colonnes ===== */}
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 pb-12">
        <section>
          <h2 className="text-xl font-bold text-[var(--edu-text-primary)] mb-5">
            {programmes.length > 0
              ? t('institutionProfile.programsList.title', { count: programmes.length })
              : t('institutionProfile.programsList.titleFallback')}
          </h2>
          {programmes.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {programmes.map((programme) => (
                <ProgramCard key={programme.id} programme={programme} view="grid" />
              ))}
            </div>
          ) : (
            <div className="glass-card rounded-2xl p-8 text-center">
              <p className="text-[var(--edu-text-secondary)]">
                {t('institutionProfile.programsList.empty')}
              </p>
            </div>
          )}
        </section>
      </div>

      <Footer />
    </div>
  );
}
