import { useState } from 'react';
import { Dialog, DialogContent, DialogTitle } from '@/app/components/ui/dialog';
import type { ScoresDiplome } from '@/types/api';

// ── Couleurs ──────────────────────────────────────────────────────────────────

function scoreColor(s: number) {
  if (s >= 70) return '#16a34a';
  if (s >= 50) return '#d97706';
  return '#dc2626';
}

function scoreGradient(s: number) {
  if (s >= 70) return 'linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)';
  if (s >= 50) return 'linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%)';
  return 'linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%)';
}

function getRisk(s: number) {
  if (s >= 70) return { label: 'Fiable',        icon: '✅', color: '#16a34a', bg: '#f0fdf4', border: '#86efac' };
  if (s >= 55) return { label: 'À vérifier',    icon: '⚠️', color: '#d97706', bg: '#fffbeb', border: '#fcd34d' };
  if (s >= 30) return { label: 'Suspect',        icon: '🔴', color: '#dc2626', bg: '#fef2f2', border: '#fca5a5' };
  return            { label: 'Non conforme',    icon: '❌', color: '#7f1d1d', bg: '#fee2e2', border: '#f87171' };
}

// ── Gauge SVG circulaire ──────────────────────────────────────────────────────

function CircularGauge({ score }: { score: number }) {
  const SIZE = 112, SW = 10, R = (SIZE - SW) / 2;
  const CIRC = 2 * Math.PI * R;
  const offset = CIRC - (score / 100) * CIRC;
  const color  = scoreColor(score);
  return (
    <div className="relative flex items-center justify-center shrink-0" style={{ width: SIZE, height: SIZE }}>
      <svg width={SIZE} height={SIZE} style={{ transform: 'rotate(-90deg)' }}>
        <circle cx={SIZE/2} cy={SIZE/2} r={R} fill="none" stroke="rgba(0,0,0,0.07)" strokeWidth={SW} />
        <circle cx={SIZE/2} cy={SIZE/2} r={R} fill="none" stroke={color} strokeWidth={SW}
          strokeDasharray={CIRC} strokeDashoffset={offset} strokeLinecap="round"
          style={{ transition: 'stroke-dashoffset .7s cubic-bezier(.4,0,.2,1)' }} />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
        <span className="text-[28px] font-extrabold leading-none" style={{ color }}>{score}</span>
        <span className="text-[11px] font-medium text-gray-400 mt-0.5">/100</span>
      </div>
    </div>
  );
}

// ── Carte sous-score ──────────────────────────────────────────────────────────

function SubCard({ icon, label, desc, value }: { icon: string; label: string; desc: string; value: number | null }) {
  if (value === null) return null;
  const color   = scoreColor(value);
  const bgTrack = value >= 70 ? '#dcfce7' : value >= 50 ? '#fef3c7' : '#fee2e2';
  return (
    <div className="rounded-2xl border border-[var(--edu-border)] bg-[var(--edu-surface)] p-4 flex flex-col gap-3">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center text-lg shrink-0"
            style={{ backgroundColor: bgTrack }}>
            {icon}
          </div>
          <div className="min-w-0">
            <p className="text-[13px] font-semibold text-[var(--edu-text-primary)] leading-tight">{label}</p>
            <p className="text-[11px] text-[var(--edu-text-tertiary)] leading-tight mt-0.5">{desc}</p>
          </div>
        </div>
        <span className="text-[15px] font-bold shrink-0 tabular-nums" style={{ color }}>{value}/100</span>
      </div>
      <div className="h-2 rounded-full overflow-hidden" style={{ backgroundColor: bgTrack }}>
        <div className="h-full rounded-full" style={{ width: `${value}%`, backgroundColor: color,
          transition: 'width .7s cubic-bezier(.4,0,.2,1)' }} />
      </div>
    </div>
  );
}

// ── Composant principal — Badge + Dialog ──────────────────────────────────────

export function ScoreBadgeInline({ scores }: { scores: ScoresDiplome | null | undefined }) {
  const [open, setOpen] = useState(false);

  if (!scores) return <span className="text-xs text-[var(--edu-text-tertiary)]">—</span>;

  const color     = scoreColor(scores.global);
  const gradient  = scoreGradient(scores.global);
  const risk      = getRisk(scores.global);
  const integrity = scores.fraud !== null ? 100 - scores.fraud : null;

  const cards = [
    { icon: '👤', label: 'Contenu identitaire',    desc: 'Nom, date, institution, spécialisation',  value: scores.cf     },
    { icon: '📄', label: 'Forme documentaire',      desc: 'Mise en page et structure officielle',    value: scores.struct },
    { icon: '🔏', label: 'Éléments officiels',      desc: 'Signature manuscrite et cachet officiel', value: scores.vis    },
    { icon: '🛡️', label: 'Intégrité documentaire', desc: 'Analyse des modifications numériques',    value: integrity     },
  ].filter(c => c.value !== null);

  return (
    <>
      {/* ── Badge déclencheur ── */}
      <button
        onClick={(e) => { e.stopPropagation(); setOpen(true); }}
        className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all duration-150 hover:opacity-80 active:scale-95"
        style={{ color, backgroundColor: `${color}15`, border: `1px solid ${color}40` }}
        aria-label={`Analyse documentaire : ${scores.global}/100`}
      >
        {/* Icône shield */}
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
          <path d="M6 1L10.5 2.5v3.5C10.5 8.5 8.5 10.5 6 11 3.5 10.5 1.5 8.5 1.5 6V2.5L6 1z"
            stroke="currentColor" strokeWidth="1.3" fill="none" strokeLinejoin="round" />
        </svg>
        {scores.global}/100
        <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
          <path d="M2 3.5 5 6.5 8 3.5" stroke="currentColor" strokeWidth="1.5"
            strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      {/* ── Dialog modal ── */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent
          className="p-0 overflow-hidden rounded-2xl border-0 shadow-2xl gap-0"
          style={{ maxWidth: 560, fontFamily: 'inherit' }}
        >
          <DialogTitle className="sr-only">Analyse documentaire — {scores.global}/100</DialogTitle>

          {/* Bannière header */}
          <div className="relative px-7 pt-7 pb-6" style={{ background: gradient }}>
            <p className="text-[10px] font-bold uppercase tracking-[0.15em] mb-5" style={{ color }}>
              Rapport d'analyse documentaire
            </p>
            <div className="flex items-center gap-6">
              <CircularGauge score={scores.global} />
              <div className="flex-1 min-w-0">
                <div className="flex items-baseline gap-1.5 mb-3">
                  <span className="text-5xl font-extrabold leading-none tracking-tight" style={{ color }}>
                    {scores.global}
                  </span>
                  <span className="text-xl font-semibold text-gray-400">/100</span>
                </div>
                <span
                  className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-[13px] font-bold border"
                  style={{ color: risk.color, backgroundColor: risk.bg, borderColor: risk.border }}
                >
                  <span className="text-sm leading-none">{risk.icon}</span>
                  {risk.label}
                </span>
              </div>
            </div>
          </div>

          {/* Grille 2×2 sous-scores */}
          {cards.length > 0 && (
            <div className="px-7 py-5 bg-white dark:bg-[#1D1D1F]">
              <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-[var(--edu-text-tertiary)] mb-3">
                Détail de l'analyse
              </p>
              <div className="grid grid-cols-2 gap-3">
                {cards.map(c => (
                  <SubCard key={c.label} icon={c.icon} label={c.label} desc={c.desc} value={c.value} />
                ))}
              </div>
            </div>
          )}

          {/* Footer disclaimer */}
          <div className="mx-7 mb-6 rounded-xl bg-[var(--edu-surface)] border border-[var(--edu-border)] px-4 py-3 flex items-start gap-2.5">
            <span className="text-sm leading-none mt-0.5 shrink-0">ℹ️</span>
            <p className="text-[11px] text-[var(--edu-text-secondary)] leading-relaxed">
              Analyse automatique — outil d'aide à la décision uniquement.
              Ne remplace pas une vérification manuelle du document original.
            </p>
          </div>

        </DialogContent>
      </Dialog>
    </>
  );
}
