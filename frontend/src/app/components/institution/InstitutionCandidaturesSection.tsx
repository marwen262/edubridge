import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'motion/react';
import { toast } from 'sonner';
import { BarChart3, Search, ChevronLeft, ChevronRight, ChevronDown, Phone, MapPin, Globe, IdCard, GraduationCap, Calendar, User, BookOpen, FileText, Download, File } from 'lucide-react';
import { Button } from '../ui/button';
import { ScoreBadgeInline } from './DiplomaScorePanel';
import { useInstitutCandidatures } from '@/hooks/useCandidatures';
import { candidatureService } from '@/services/api';
import { trouverLabelNationalite, estTunisien } from '@/app/data/nationalites';
import { API_URL } from '@/config';
import i18n from '@/i18n';
import type { Candidat, Candidature } from '@/types/api';

const STATUT_STYLE: Record<string, { color: string; bg: string }> = {
  soumise:       { color: 'var(--edu-blue)',    bg: 'rgba(0,113,227,0.1)' },
  en_examen:     { color: 'var(--edu-warning)', bg: 'rgba(255,159,10,0.1)' },
  acceptee:      { color: 'var(--edu-success)', bg: 'rgba(52,199,89,0.1)' },
  refusee:       { color: 'var(--edu-danger)',  bg: 'rgba(255,59,48,0.1)' },
  liste_attente: { color: '#8B5CF6',            bg: 'rgba(139,92,246,0.1)' },
};
const TRANSITIONS: Record<string, string[]> = {
  soumise: ['en_examen', 'acceptee', 'refusee', 'liste_attente'],
  en_examen: ['acceptee', 'refusee', 'liste_attente'],
  liste_attente: ['acceptee', 'refusee'],
};
const TR_COLORS: Record<string, string> = { en_examen: 'var(--edu-warning)', acceptee: 'var(--edu-success)', refusee: 'var(--edu-danger)', liste_attente: '#8B5CF6' };

const PAGE_SIZE = 12;

export function InstitutionCandidaturesSection() {
  const { t } = useTranslation();
  const { candidatures, loading, refetch } = useInstitutCandidatures();
  const [search, setSearch] = React.useState('');
  const [statutFilter, setStatutFilter] = React.useState<string>('tous');
  const [page, setPage] = React.useState(1);
  const [processing, setProcessing] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const toggleExpand = (id: string) => setExpandedId((prev) => (prev === id ? null : id));

  const filtered = React.useMemo(() => {
    let list = candidatures;
    if (statutFilter !== 'tous') list = list.filter((c) => c.statut === statutFilter);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((c) => (c.candidat?.prenom ?? '').toLowerCase().includes(q) || (c.candidat?.nom ?? '').toLowerCase().includes(q) || (c.programme?.titre ?? '').toLowerCase().includes(q));
    }
    return list;
  }, [candidatures, statutFilter, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  React.useEffect(() => { setPage(1); }, [search, statutFilter]);

  const getNom = (c: Candidature) => [c.candidat?.prenom, c.candidat?.nom].filter(Boolean).join(' ') || 'Candidat';

  const handleStatut = async (id: string, statut: string) => {
    setProcessing(id);
    try {
      await candidatureService.changerStatut(id, statut);
      toast.success(t('institution.candidatures.toasts.statusUpdated'));
      refetch();
    } catch (err: unknown) {
      const a = err as { response?: { data?: { message?: string } } };
      toast.error(a?.response?.data?.message ?? t('institution.candidatures.toasts.error'));
    }
    finally { setProcessing(null); }
  };

  return (
    <div>
      <div className="bg-white dark:bg-[#1D1D1F] border-b border-[var(--edu-border)] px-8 py-6">
        <p className="text-xs font-semibold uppercase tracking-wider text-[var(--edu-text-tertiary)] mb-1">{t('institution.candidatures.sectionLabel')}</p>
        <h1 className="text-3xl font-bold text-[var(--edu-text-primary)]">{t('institution.candidatures.title')}</h1>
        <p className="text-sm text-[var(--edu-text-secondary)] mt-1">{t('institution.candidatures.subtitle')}</p>
      </div>
      <div className="p-8 space-y-6 max-w-[1600px]">
        {/* Filters */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}
          className="bg-white dark:bg-[#1D1D1F] rounded-2xl border border-[var(--edu-border)] p-4 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--edu-text-tertiary)]" />
            <input type="text" placeholder={t('institution.candidatures.searchPlaceholder')} value={search} onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[var(--edu-surface)] border border-[var(--edu-border)] text-sm text-[var(--edu-text-primary)] placeholder:text-[var(--edu-text-tertiary)] focus:outline-none focus:ring-2 focus:ring-[var(--edu-blue)]" />
          </div>
          <div className="flex gap-2 flex-wrap">
            {(['tous', 'soumise', 'en_examen', 'acceptee', 'refusee', 'liste_attente'] as const).map((s) => (
              <button key={s} onClick={() => setStatutFilter(s)}
                className={`px-3 py-2 rounded-xl text-xs font-semibold transition-colors ${statutFilter === s ? 'bg-[var(--edu-indigo)] text-white' : 'bg-[var(--edu-surface)] text-[var(--edu-text-secondary)] hover:bg-[var(--edu-border)]'}`}>
                {t(`status.${s}`)}
              </button>
            ))}
          </div>
        </motion.div>

        {/* Table */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1, duration: 0.35 }}
          className="bg-white dark:bg-[#1D1D1F] rounded-2xl border border-[var(--edu-border)] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-[var(--edu-surface)]">
                <tr>
                  <th className="text-left px-6 py-4 text-xs font-semibold uppercase tracking-wider text-[var(--edu-text-tertiary)]">{t('institution.candidatures.columns.candidate')}</th>
                  <th className="text-left px-6 py-4 text-xs font-semibold uppercase tracking-wider text-[var(--edu-text-tertiary)]">{t('institution.candidatures.columns.program')}</th>
                  <th className="text-left px-6 py-4 text-xs font-semibold uppercase tracking-wider text-[var(--edu-text-tertiary)]">{t('institution.candidatures.columns.status')}</th>
                  <th className="text-left px-6 py-4 text-xs font-semibold uppercase tracking-wider text-[var(--edu-text-tertiary)]">{t('institution.candidatures.columns.score')}</th>
                  <th className="text-left px-6 py-4 text-xs font-semibold uppercase tracking-wider text-[var(--edu-text-tertiary)]">{t('institution.candidatures.columns.date')}</th>
                  <th className="text-right px-6 py-4 text-xs font-semibold uppercase tracking-wider text-[var(--edu-text-tertiary)]">{t('institution.candidatures.columns.actions')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--edu-divider)]">
                {loading ? Array.from({ length: 4 }).map((_, i) => (
                  <tr key={i}>{Array.from({ length: 6 }).map((_, j) => <td key={j} className="px-6 py-4"><div className="h-4 bg-[var(--edu-surface)] rounded animate-pulse" /></td>)}</tr>
                )) : paginated.length === 0 ? (
                  <tr><td colSpan={6} className="px-6 py-12 text-center"><BarChart3 className="w-8 h-8 mx-auto mb-2 text-[var(--edu-text-tertiary)]" /><p className="text-sm text-[var(--edu-text-secondary)]">{t('institution.candidatures.empty')}</p></td></tr>
                ) : paginated.map((c) => {
                  const nom = getNom(c);
                  const st = STATUT_STYLE[c.statut] ?? STATUT_STYLE.soumise;
                  const transitions = TRANSITIONS[c.statut] ?? [];
                  const isExpanded = expandedId === c.id;
                  return (
                    <React.Fragment key={c.id}>
                      <tr className="hover:bg-[var(--edu-surface)] transition-colors">
                        <td className="px-6 py-4">
                          <button
                            onClick={() => toggleExpand(c.id)}
                            className="flex items-center gap-3 text-left w-full"
                            aria-expanded={isExpanded}
                            aria-label={isExpanded ? t('institution.candidatures.ariaCollapse') : t('institution.candidatures.ariaExpand')}
                          >
                            <ChevronDown
                              className={`w-4 h-4 text-[var(--edu-text-tertiary)] flex-shrink-0 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                            />
                            <div className="w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-semibold shrink-0" style={{ background: 'linear-gradient(135deg, var(--edu-blue), #6366F1)' }}>{nom.charAt(0).toUpperCase()}</div>
                            <span className="text-sm font-medium text-[var(--edu-text-primary)] truncate">{nom}</span>
                          </button>
                        </td>
                        <td className="px-6 py-4 text-sm text-[var(--edu-text-secondary)] truncate max-w-[180px]">{c.programme?.titre ?? '—'}</td>
                        <td className="px-6 py-4">
                          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold" style={{ backgroundColor: st.bg, color: st.color }}>
                            {t(`status.${c.statut}`)}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <ScoreBadgeInline scores={c.scores_diplome} />
                        </td>
                        <td className="px-6 py-4 text-sm text-[var(--edu-text-secondary)]">{(c.soumise_le ?? c.cree_le) ? new Date((c.soumise_le ?? c.cree_le)!).toLocaleDateString(i18n.language) : '—'}</td>
                        <td className="px-6 py-4">
                          {transitions.length > 0 && (
                            <div className="flex items-center justify-end gap-1 flex-wrap">
                              {transitions.map((tr) => (
                                <button key={tr} onClick={() => handleStatut(c.id, tr)} disabled={processing === c.id}
                                  className="text-xs px-2 py-0.5 rounded-full font-semibold text-white disabled:opacity-50" style={{ backgroundColor: TR_COLORS[tr] }}>
                                  {t(`institution.candidatures.transitions.${tr}`)}
                                </button>
                              ))}
                            </div>
                          )}
                        </td>
                      </tr>
                      {/* Panneau détail candidature */}
                      <AnimatePresence>
                        {isExpanded && (
                          <tr key={`${c.id}-detail`} className="bg-[var(--edu-surface)]/40">
                            <td colSpan={6} className="px-6 py-0">
                              <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                transition={{ duration: 0.2 }}
                                className="overflow-hidden"
                              >
                                <CandidatureDetailPanel candidature={c} />
                              </motion.div>
                            </td>
                          </tr>
                        )}
                      </AnimatePresence>
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
          {totalPages > 1 && (
            <div className="px-6 py-4 border-t border-[var(--edu-border)] flex items-center justify-between">
              <p className="text-xs text-[var(--edu-text-tertiary)]">
                {filtered.length} {filtered.length !== 1 ? t('institution.candidatures.paginationPlural') : t('institution.candidatures.pagination')} — {t('common.page')} {page}/{totalPages}
              </p>
              <div className="flex items-center gap-1">
                <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)} className="rounded-lg"><ChevronLeft className="w-4 h-4" /></Button>
                <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)} className="rounded-lg"><ChevronRight className="w-4 h-4" /></Button>
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Panneau détail candidature (sous-ligne expandable)
// Affiche : identité, profil académique, lettre de motivation, documents soumis.
// ─────────────────────────────────────────────────────────────

const BASE_URL = API_URL.replace(/\/api\/?$/, '');

function InfoField({ label, value, Icon, color = 'var(--edu-blue)' }: {
  label: string;
  value?: string | null;
  Icon: React.ElementType;
  color?: string;
}) {
  const { t } = useTranslation();
  return (
    <div className="flex items-start gap-3 min-w-0">
      <div className="w-7 h-7 rounded-md flex items-center justify-center flex-shrink-0" style={{ backgroundColor: `${color}18` }}>
        <Icon className="w-3.5 h-3.5" style={{ color }} />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-[10px] uppercase tracking-wider font-semibold text-[var(--edu-text-tertiary)]">{label}</p>
        <p className="text-sm text-[var(--edu-text-primary)] break-words">
          {value || <span className="italic text-[var(--edu-text-tertiary)]">{t('institution.candidatures.candidatePanel.notFilled')}</span>}
        </p>
      </div>
    </div>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[10px] uppercase tracking-wider font-bold text-[var(--edu-text-tertiary)] mb-3 mt-1">{children}</p>
  );
}

function CandidatureDetailPanel({ candidature }: { candidature: Candidature }) {
  const { t } = useTranslation();
  const candidat: Candidat | undefined = candidature.candidat;

  const adresseFormatee = candidat ? [
    candidat.adresse?.rue,
    candidat.adresse?.code_postal,
    candidat.adresse?.ville,
    candidat.adresse?.gouvernorat,
    candidat.adresse?.pays,
  ].filter(Boolean).join(', ') : '';

  const tunisien = estTunisien(candidat?.nationalite);

  const genreLabel = candidat?.genre === 'homme'
    ? t('institution.candidatures.candidatePanel.genreHomme')
    : candidat?.genre === 'femme'
      ? t('institution.candidatures.candidatePanel.genreFemme')
      : null;

  const dateNaissanceFormatee = candidat?.date_naissance
    ? new Date(candidat.date_naissance).toLocaleDateString(i18n.language)
    : null;

  const parcours = Array.isArray(candidat?.parcours_academique) ? candidat!.parcours_academique : [];
  const documents = Array.isArray(candidature.documents_soumis) ? candidature.documents_soumis : [];

  return (
    <div className="py-5 space-y-5">

      {/* Identité & Contact */}
      <div>
        <SectionTitle>{t('institution.candidatures.candidatePanel.sectionIdentite')}</SectionTitle>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-3">
          <InfoField
            label={t('institution.candidatures.candidatePanel.nationality')}
            value={candidat?.nationalite ? trouverLabelNationalite(candidat.nationalite) : null}
            Icon={Globe}
          />
          <InfoField
            label={tunisien ? t('institution.candidatures.candidatePanel.cin') : t('institution.candidatures.candidatePanel.passport')}
            value={tunisien ? candidat?.cin : candidat?.numero_passeport}
            Icon={IdCard}
          />
          <InfoField label={t('institution.candidatures.candidatePanel.phone')} value={candidat?.telephone} Icon={Phone} />
          <InfoField label={t('institution.candidatures.candidatePanel.dateNaissance')} value={dateNaissanceFormatee} Icon={Calendar} />
          <InfoField label={t('institution.candidatures.candidatePanel.genre')} value={genreLabel} Icon={User} />
          <InfoField label={t('institution.candidatures.candidatePanel.address')} value={adresseFormatee || null} Icon={MapPin} />
        </div>
      </div>

      {/* Profil académique */}
      <div className="border-t border-[var(--edu-divider)] pt-4">
        <SectionTitle>{t('institution.candidatures.candidatePanel.sectionProfil')}</SectionTitle>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-3 mb-4">
          <InfoField label={t('institution.candidatures.candidatePanel.niveauActuel')} value={candidat?.niveau_actuel ?? null} Icon={BookOpen} color="var(--edu-indigo)" />
          <InfoField label={t('institution.candidatures.candidatePanel.typeBac')} value={candidat?.type_bac ?? null} Icon={GraduationCap} color="var(--edu-indigo)" />
          <InfoField
            label={t('institution.candidatures.candidatePanel.moyenneBac')}
            value={candidat?.moyenne_bac != null ? String(candidat.moyenne_bac) : null}
            Icon={BookOpen}
            color="var(--edu-indigo)"
          />
          <InfoField
            label={t('institution.candidatures.candidatePanel.anneeBac')}
            value={candidat?.annee_bac != null ? String(candidat.annee_bac) : null}
            Icon={Calendar}
            color="var(--edu-indigo)"
          />
        </div>

        {parcours.length > 0 && (
          <div>
            <p className="text-[10px] uppercase tracking-wider font-semibold text-[var(--edu-text-tertiary)] mb-2">
              {t('institution.candidatures.candidatePanel.parcoursTitle')}
            </p>
            <div className="space-y-2">
              {parcours.map((p, i) => (
                <div key={i} className="flex items-start gap-3">
                  <div className="w-7 h-7 rounded-md flex items-center justify-center flex-shrink-0 mt-0.5" style={{ backgroundColor: 'var(--edu-success)18' }}>
                    <GraduationCap className="w-3.5 h-3.5" style={{ color: 'var(--edu-success)' }} />
                  </div>
                  <div>
                    <p className="text-sm text-[var(--edu-text-primary)]">
                      {p.diplome} — {p.etablissement} ({p.annee})
                      {p.mention && (
                        <span className="text-xs text-[var(--edu-text-secondary)] ml-2">
                          {t('institution.candidatures.candidatePanel.mention')} {p.mention}
                        </span>
                      )}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Lettre de motivation */}
      <div className="border-t border-[var(--edu-divider)] pt-4">
        <div className="flex items-center gap-2 mb-2">
          <FileText className="w-4 h-4" style={{ color: 'var(--edu-blue)' }} />
          <p className="text-[10px] uppercase tracking-wider font-bold text-[var(--edu-text-tertiary)]">
            {t('institution.candidatures.candidatePanel.motivationTitle')}
          </p>
        </div>
        {candidature.lettre_motivation ? (
          <p className="text-sm text-[var(--edu-text-primary)] whitespace-pre-wrap leading-relaxed bg-[var(--edu-surface)] rounded-xl p-4 border border-[var(--edu-border)]">
            {candidature.lettre_motivation}
          </p>
        ) : (
          <p className="text-sm italic text-[var(--edu-text-tertiary)]">
            {t('institution.candidatures.candidatePanel.motivationEmpty')}
          </p>
        )}
      </div>

      {/* Documents soumis */}
      <div className="border-t border-[var(--edu-divider)] pt-4">
        <div className="flex items-center gap-2 mb-3">
          <Download className="w-4 h-4" style={{ color: 'var(--edu-blue)' }} />
          <p className="text-[10px] uppercase tracking-wider font-bold text-[var(--edu-text-tertiary)]">
            {t('institution.candidatures.candidatePanel.documentsTitle')}
          </p>
        </div>
        {documents.length === 0 ? (
          <p className="text-sm italic text-[var(--edu-text-tertiary)]">
            {t('institution.candidatures.candidatePanel.documentsEmpty')}
          </p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
            {documents.map((doc, i) => (
              <a
                key={doc.media_id ?? i}
                href={`${BASE_URL}${doc.url}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 px-4 py-3 rounded-xl border border-[var(--edu-border)] bg-[var(--edu-surface)] hover:border-[var(--edu-blue)] hover:bg-[var(--edu-blue)]/5 transition-colors group"
              >
                <File className="w-4 h-4 flex-shrink-0 text-[var(--edu-text-tertiary)] group-hover:text-[var(--edu-blue)]" />
                <span className="text-sm text-[var(--edu-text-primary)] truncate flex-1">{doc.nom}</span>
                <Download className="w-3.5 h-3.5 flex-shrink-0 text-[var(--edu-text-tertiary)] group-hover:text-[var(--edu-blue)]" />
              </a>
            ))}
          </div>
        )}
      </div>

    </div>
  );
}
