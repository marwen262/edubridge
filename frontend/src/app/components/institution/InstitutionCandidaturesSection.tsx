import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { toast } from 'sonner';
import { BarChart3, Search, ChevronLeft, ChevronRight, ChevronDown, Phone, MapPin, Globe, IdCard, GraduationCap } from 'lucide-react';
import { Button } from '../ui/button';
import { useInstitutCandidatures } from '@/hooks/useCandidatures';
import { candidatureService } from '@/services/api';
import { trouverLabelNationalite, estTunisien } from '@/app/data/nationalites';
import type { Candidat, Candidature } from '@/types/api';

const STATUT_CFG: Record<string, { label: string; color: string; bg: string }> = {
  soumise: { label: 'Soumise', color: 'var(--edu-blue)', bg: 'rgba(0,113,227,0.1)' },
  en_examen: { label: 'En examen', color: 'var(--edu-warning)', bg: 'rgba(255,159,10,0.1)' },
  acceptee: { label: 'Acceptée', color: 'var(--edu-success)', bg: 'rgba(52,199,89,0.1)' },
  refusee: { label: 'Refusée', color: 'var(--edu-danger)', bg: 'rgba(255,59,48,0.1)' },
  liste_attente: { label: "Liste d'attente", color: '#8B5CF6', bg: 'rgba(139,92,246,0.1)' },
};
const TRANSITIONS: Record<string, string[]> = {
  soumise: ['en_examen', 'acceptee', 'refusee', 'liste_attente'],
  en_examen: ['acceptee', 'refusee', 'liste_attente'],
  liste_attente: ['acceptee', 'refusee'],
};
const TR_LABELS: Record<string, string> = { en_examen: 'En examen', acceptee: 'Accepter', refusee: 'Refuser', liste_attente: 'Attente' };
const TR_COLORS: Record<string, string> = { en_examen: 'var(--edu-warning)', acceptee: 'var(--edu-success)', refusee: 'var(--edu-danger)', liste_attente: '#8B5CF6' };

const PAGE_SIZE = 12;

export function InstitutionCandidaturesSection() {
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
    try { await candidatureService.changerStatut(id, statut); toast.success('Statut mis à jour'); refetch(); }
    catch (err: unknown) { const a = err as { response?: { data?: { message?: string } } }; toast.error(a?.response?.data?.message ?? 'Erreur'); }
    finally { setProcessing(null); }
  };

  return (
    <div>
      <div className="bg-white dark:bg-[#1D1D1F] border-b border-[var(--edu-border)] px-8 py-6">
        <p className="text-xs font-semibold uppercase tracking-wider text-[var(--edu-text-tertiary)] mb-1">Établissement</p>
        <h1 className="text-3xl font-bold text-[var(--edu-text-primary)]">Candidatures</h1>
        <p className="text-sm text-[var(--edu-text-secondary)] mt-1">Gérez les demandes d'admission</p>
      </div>
      <div className="p-8 space-y-6 max-w-[1600px]">
        {/* Filters */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}
          className="bg-white dark:bg-[#1D1D1F] rounded-2xl border border-[var(--edu-border)] p-4 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--edu-text-tertiary)]" />
            <input type="text" placeholder="Rechercher par candidat, programme…" value={search} onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[var(--edu-surface)] border border-[var(--edu-border)] text-sm text-[var(--edu-text-primary)] placeholder:text-[var(--edu-text-tertiary)] focus:outline-none focus:ring-2 focus:ring-[var(--edu-blue)]" />
          </div>
          <div className="flex gap-2 flex-wrap">
            {['tous', 'soumise', 'en_examen', 'acceptee', 'refusee', 'liste_attente'].map((s) => (
              <button key={s} onClick={() => setStatutFilter(s)}
                className={`px-3 py-2 rounded-xl text-xs font-semibold transition-colors ${statutFilter === s ? 'bg-[var(--edu-indigo)] text-white' : 'bg-[var(--edu-surface)] text-[var(--edu-text-secondary)] hover:bg-[var(--edu-border)]'}`}>
                {s === 'tous' ? 'Toutes' : STATUT_CFG[s]?.label ?? s}
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
                  <th className="text-left px-6 py-4 text-xs font-semibold uppercase tracking-wider text-[var(--edu-text-tertiary)]">Candidat</th>
                  <th className="text-left px-6 py-4 text-xs font-semibold uppercase tracking-wider text-[var(--edu-text-tertiary)]">Programme</th>
                  <th className="text-left px-6 py-4 text-xs font-semibold uppercase tracking-wider text-[var(--edu-text-tertiary)]">Statut</th>
                  <th className="text-left px-6 py-4 text-xs font-semibold uppercase tracking-wider text-[var(--edu-text-tertiary)]">Score</th>
                  <th className="text-left px-6 py-4 text-xs font-semibold uppercase tracking-wider text-[var(--edu-text-tertiary)]">Date</th>
                  <th className="text-right px-6 py-4 text-xs font-semibold uppercase tracking-wider text-[var(--edu-text-tertiary)]">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--edu-divider)]">
                {loading ? Array.from({ length: 4 }).map((_, i) => (
                  <tr key={i}>{Array.from({ length: 6 }).map((_, j) => <td key={j} className="px-6 py-4"><div className="h-4 bg-[var(--edu-surface)] rounded animate-pulse" /></td>)}</tr>
                )) : paginated.length === 0 ? (
                  <tr><td colSpan={6} className="px-6 py-12 text-center"><BarChart3 className="w-8 h-8 mx-auto mb-2 text-[var(--edu-text-tertiary)]" /><p className="text-sm text-[var(--edu-text-secondary)]">Aucune candidature.</p></td></tr>
                ) : paginated.map((c) => {
                  const nom = getNom(c);
                  const st = STATUT_CFG[c.statut] ?? STATUT_CFG.soumise;
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
                            aria-label={isExpanded ? 'Masquer le détail candidat' : 'Voir le détail candidat'}
                          >
                            <ChevronDown
                              className={`w-4 h-4 text-[var(--edu-text-tertiary)] flex-shrink-0 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                            />
                            <div className="w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-semibold shrink-0" style={{ background: 'linear-gradient(135deg, var(--edu-blue), #6366F1)' }}>{nom.charAt(0).toUpperCase()}</div>
                            <span className="text-sm font-medium text-[var(--edu-text-primary)] truncate">{nom}</span>
                          </button>
                        </td>
                        <td className="px-6 py-4 text-sm text-[var(--edu-text-secondary)] truncate max-w-[180px]">{c.programme?.titre ?? '—'}</td>
                        <td className="px-6 py-4"><span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold" style={{ backgroundColor: st.bg, color: st.color }}>{st.label}</span></td>
                        <td className="px-6 py-4"><ScoreBadge score={c.score_diplome} /></td>
                        <td className="px-6 py-4 text-sm text-[var(--edu-text-secondary)]">{(c.soumise_le ?? c.cree_le) ? new Date((c.soumise_le ?? c.cree_le)!).toLocaleDateString('fr-FR') : '—'}</td>
                        <td className="px-6 py-4">
                          {transitions.length > 0 && (
                            <div className="flex items-center justify-end gap-1 flex-wrap">
                              {transitions.map((t) => (
                                <button key={t} onClick={() => handleStatut(c.id, t)} disabled={processing === c.id}
                                  className="text-xs px-2 py-0.5 rounded-full font-semibold text-white disabled:opacity-50" style={{ backgroundColor: TR_COLORS[t] }}>{TR_LABELS[t]}</button>
                              ))}
                            </div>
                          )}
                        </td>
                      </tr>
                      <AnimatePresence>
                        {isExpanded && c.candidat && (
                          <tr key={`${c.id}-detail`} className="bg-[var(--edu-surface)]/40">
                            <td colSpan={6} className="px-6 py-0">
                              <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                transition={{ duration: 0.2 }}
                                className="overflow-hidden"
                              >
                                <CandidatIdentitePanel candidat={c.candidat} />
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
              <p className="text-xs text-[var(--edu-text-tertiary)]">{filtered.length} candidature{filtered.length !== 1 ? 's' : ''} — page {page}/{totalPages}</p>
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
// Badge score DiplomaVerifier
// ─────────────────────────────────────────────────────────────

function ScoreBadge({ score }: { score?: number | null }) {
  if (score == null) return <span className="text-sm text-[var(--edu-text-tertiary)]">—</span>;
  const color = score >= 70 ? 'var(--edu-success)' : score >= 50 ? 'var(--edu-warning)' : 'var(--edu-danger)';
  const bg    = score >= 70 ? 'rgba(52,199,89,0.1)' : score >= 50 ? 'rgba(255,159,10,0.1)' : 'rgba(255,59,48,0.1)';
  return (
    <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold" style={{ color, backgroundColor: bg }}>
      {score}/100
    </span>
  );
}

// ─────────────────────────────────────────────────────────────
// Panneau identité candidat (sous-ligne expandable)
// Source de vérité : le profil Candidat — l'identité ne vit JAMAIS dans
// candidature.documents_soumis (refactor identité, cf. backend.md).
// ─────────────────────────────────────────────────────────────

function CandidatIdentitePanel({ candidat }: { candidat: Candidat }) {
  const tunisien = estTunisien(candidat.nationalite);
  const adresseFormatee = [
    candidat.adresse?.rue,
    candidat.adresse?.code_postal,
    candidat.adresse?.ville,
    candidat.adresse?.gouvernorat,
    candidat.adresse?.pays,
  ]
    .filter(Boolean)
    .join(', ');

  const items: Array<{ label: string; value?: string | null; Icon: typeof Phone }> = [
    {
      label: 'Nationalité',
      value: candidat.nationalite ? trouverLabelNationalite(candidat.nationalite) : null,
      Icon: Globe,
    },
    {
      label: tunisien ? 'CIN' : 'Passeport',
      value: tunisien ? candidat.cin : candidat.numero_passeport,
      Icon: IdCard,
    },
    { label: 'Téléphone', value: candidat.telephone, Icon: Phone },
    { label: 'Adresse', value: adresseFormatee || null, Icon: MapPin },
  ];

  const dernierDiplome = Array.isArray(candidat.parcours_academique)
    ? candidat.parcours_academique[0]
    : null;

  return (
    <div className="py-5 grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-3">
      {items.map(({ label, value, Icon }) => (
        <div key={label} className="flex items-start gap-3 min-w-0">
          <div
            className="w-7 h-7 rounded-md flex items-center justify-center flex-shrink-0"
            style={{ backgroundColor: 'var(--edu-blue)15' }}
          >
            <Icon className="w-3.5 h-3.5" style={{ color: 'var(--edu-blue)' }} />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[10px] uppercase tracking-wider font-semibold text-[var(--edu-text-tertiary)]">
              {label}
            </p>
            <p className="text-sm text-[var(--edu-text-primary)] truncate">
              {value || <span className="italic text-[var(--edu-text-tertiary)]">Non renseigné</span>}
            </p>
          </div>
        </div>
      ))}

      {dernierDiplome && (
        <div className="md:col-span-2 flex items-start gap-3 pt-2 border-t border-[var(--edu-divider)]">
          <div
            className="w-7 h-7 rounded-md flex items-center justify-center flex-shrink-0 mt-0.5"
            style={{ backgroundColor: 'var(--edu-success)15' }}
          >
            <GraduationCap className="w-3.5 h-3.5" style={{ color: 'var(--edu-success)' }} />
          </div>
          <div className="min-w-0">
            <p className="text-[10px] uppercase tracking-wider font-semibold text-[var(--edu-text-tertiary)]">
              Dernier diplôme
            </p>
            <p className="text-sm text-[var(--edu-text-primary)]">
              {dernierDiplome.diplome} — {dernierDiplome.etablissement} ({dernierDiplome.annee})
              {dernierDiplome.mention && (
                <span className="text-xs text-[var(--edu-text-secondary)] ml-2">
                  Mention : {dernierDiplome.mention}
                </span>
              )}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
