import { ShieldCheck, ShieldAlert, ShieldX, ChevronDown } from 'lucide-react';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/app/components/ui/popover';
import type { ScoresDiplome } from '@/types/api';

// ─── Helpers couleurs ────────────────────────────────────────────────────────

function scoreColor(s: number): string {
  if (s >= 75) return 'var(--edu-success)';
  if (s >= 50) return '#f59e0b';
  return 'var(--edu-danger)';
}

function scoreLabel(s: number): string {
  if (s >= 75) return 'Fiable';
  if (s >= 50) return 'Acceptable';
  return 'Faible';
}

function ScoreIcon({ score, size = 14 }: { score: number; size?: number }) {
  if (score >= 75) return <ShieldCheck size={size} />;
  if (score >= 50) return <ShieldAlert size={size} />;
  return <ShieldX size={size} />;
}

// ─── Barre de progression mini ───────────────────────────────────────────────

function MiniBar({ value, color }: { value: number; color: string }) {
  return (
    <div className="h-1.5 w-full rounded-full bg-[var(--edu-surface)] overflow-hidden">
      <div
        className="h-full rounded-full transition-all duration-500"
        style={{ width: `${value}%`, backgroundColor: color }}
      />
    </div>
  );
}

// ─── Ligne d'un sous-score ───────────────────────────────────────────────────

interface SubScoreRowProps {
  label: string;
  description: string;
  value: number | null;
}

function SubScoreRow({ label, description, value }: SubScoreRowProps) {
  if (value === null) return null;
  const color = scoreColor(value);
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between">
        <div className="min-w-0">
          <p className="text-xs font-medium text-[var(--edu-text-primary)] leading-tight">{label}</p>
          <p className="text-[10px] text-[var(--edu-text-tertiary)] leading-tight">{description}</p>
        </div>
        <span
          className="text-xs font-bold ml-3 shrink-0"
          style={{ color }}
        >
          {value}/100
        </span>
      </div>
      <MiniBar value={value} color={color} />
    </div>
  );
}

// ─── Composant principal ─────────────────────────────────────────────────────

interface ScoreDiplomeProps {
  scores: ScoresDiplome;
}

export function ScoreDiplome({ scores }: ScoreDiplomeProps) {
  const color = scoreColor(scores.global);
  const label = scoreLabel(scores.global);
  const hasSubScores = scores.cf !== null || scores.struct !== null || scores.vis !== null;

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-[11px] font-semibold cursor-pointer hover:opacity-80 transition-opacity"
          style={{ color, backgroundColor: `${color}1A`, border: `1px solid ${color}33` }}
          aria-label={`Score diplôme : ${scores.global}/100 — cliquer pour les détails`}
        >
          <ScoreIcon score={scores.global} size={11} />
          {scores.global}/100
          <ChevronDown size={10} className="opacity-60" />
        </button>
      </PopoverTrigger>

      <PopoverContent
        align="start"
        sideOffset={6}
        className="w-64 p-0 rounded-xl shadow-xl border border-[var(--edu-border)] bg-white dark:bg-[#1D1D1F] overflow-hidden"
      >
        {/* Header */}
        <div
          className="px-4 py-3 flex items-center gap-2.5"
          style={{ backgroundColor: `${color}12` }}
        >
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
            style={{ backgroundColor: `${color}25`, color }}
          >
            <ScoreIcon score={scores.global} size={16} />
          </div>
          <div>
            <p className="text-xs text-[var(--edu-text-secondary)]">Score DiplomaVerifier</p>
            <div className="flex items-baseline gap-1.5">
              <span className="text-xl font-bold leading-none" style={{ color }}>
                {scores.global}
              </span>
              <span className="text-xs text-[var(--edu-text-tertiary)]">/100</span>
              <span
                className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full ml-1"
                style={{ color, backgroundColor: `${color}20` }}
              >
                {label}
              </span>
            </div>
          </div>
        </div>

        {/* Sous-scores */}
        {hasSubScores && (
          <div className="px-4 py-3 space-y-3">
            <p className="text-[10px] font-semibold text-[var(--edu-text-tertiary)] uppercase tracking-wide">
              Détail de l'analyse
            </p>
            <SubScoreRow
              label="Champs critiques"
              description="Identité, date, institution, spécialisation"
              value={scores.cf}
            />
            <SubScoreRow
              label="Structure"
              description="Mise en page et forme officielle"
              value={scores.struct}
            />
            <SubScoreRow
              label="Authenticité visuelle"
              description="Signature manuscrite et cachet officiel"
              value={scores.vis}
            />
          </div>
        )}

        {/* Footer */}
        <div className="px-4 py-2.5 border-t border-[var(--edu-divider)] bg-[var(--edu-surface)]">
          <p className="text-[10px] text-[var(--edu-text-tertiary)] leading-snug">
            Analyse automatique par heuristiques — non substituable à une vérification manuelle.
          </p>
        </div>
      </PopoverContent>
    </Popover>
  );
}

// Badge "Non vérifié" pour les dossiers sans score
export function ScoreDiplomeAbsent() {
  return (
    <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-[11px] font-medium text-[var(--edu-text-tertiary)] bg-[var(--edu-surface)] border border-[var(--edu-border)]">
      <ShieldX size={11} className="opacity-50" />
      Non vérifié
    </span>
  );
}
