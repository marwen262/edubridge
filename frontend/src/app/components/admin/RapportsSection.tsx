import React from 'react';
import { motion } from 'motion/react';
import { useTranslation } from 'react-i18next';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from 'recharts';
import {
  Building2, FileText, TrendingUp, CheckCircle, Download, GraduationCap, BarChart3, Loader2, FileDown,
} from 'lucide-react';
import { buttonVariants } from '../ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu';
import { cn } from '../ui/utils';
import { toast } from 'sonner';
import { useUtilisateurs } from '@/hooks/useUtilisateurs';
import { useAllCandidatures } from '@/hooks/useCandidatures';
import { usePrograms } from '@/hooks/usePrograms';
import { useInstituts } from '@/hooks/useInstituts';
import type { Utilisateur, Institut, Candidature, Programme } from '@/types/api';

const DOMAIN_COLORS = [
  'var(--edu-blue)',
  'var(--edu-indigo)',
  'var(--edu-warning)',
  'var(--edu-success)',
  'var(--edu-danger)',
  '#8B5CF6',
  '#06B6D4',
  '#F97316',
];

const LEVEL_COLORS = ['var(--edu-blue)', 'var(--edu-indigo)', 'var(--edu-success)', 'var(--edu-warning)'];

function exportCsv(rows: string[][], filename: string) {
  const content = rows
    .map((r) => r.map((v) => `"${String(v ?? '').replace(/"/g, '""')}"`).join(','))
    .join('\n');
  const blob = new Blob(['﻿' + content], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

const DOMAIN_LABELS: Record<string, string> = {
  informatique: 'Informatique',
  genie_civil: 'Génie civil',
  electrique: 'Électrique',
  mecanique: 'Mécanique',
  chimie: 'Chimie',
  agronomie: 'Agronomie',
  finance: 'Finance',
  management: 'Management',
};

const LEVEL_LABELS: Record<string, string> = {
  cycle_preparatoire: 'Prépa',
  licence: 'Licence',
  master: 'Master',
  ingenieur: 'Ingénieur',
};

const tooltipStyle = {
  backgroundColor: 'var(--edu-elevated)',
  border: '1px solid var(--edu-border)',
  borderRadius: '12px',
  fontSize: '12px',
};

export function RapportsSection() {
  const { t } = useTranslation();
  const [pdfLoading, setPdfLoading] = React.useState(false);

  const { utilisateurs: utilisateursRaw, loading: loadingUsers } = useUtilisateurs();
  const utilisateurs = utilisateursRaw as Utilisateur[];

  const { candidatures, loading: loadingCands } = useAllCandidatures();
  const { programs: programmesRaw, loading: loadingProgs } = usePrograms();
  const programmes = programmesRaw as Programme[];
  const { instituts: institutsRaw, loading: loadingInsts } = useInstituts({ admin_view: true });
  const instituts = institutsRaw as Institut[];

  const loading = loadingUsers || loadingCands || loadingProgs || loadingInsts;

  // ── KPIs ──────────────────────────────────────────────────────
  const totalCandidats = utilisateurs.filter((u) => u.role === 'candidat').length;
  const institutsApprouves = instituts.filter((i) => i.validation_status === 'approved').length;
  const programmesActifs = programmes.filter((p) => p.est_actif !== false).length;
  const totalCandidatures = candidatures.length;
  const acceptees = candidatures.filter((c) => c.statut === 'acceptee').length;
  const taux = totalCandidatures > 0 ? Math.round((acceptees / totalCandidatures) * 100) : 0;

  const kpis = [
    { label: t('admin.reports.kpis.candidats'), value: totalCandidats, icon: GraduationCap, color: 'var(--edu-indigo)', loading: loadingUsers },
    { label: t('admin.reports.kpis.approvedInstituts'), value: institutsApprouves, icon: Building2, color: 'var(--edu-blue)', loading: loadingInsts },
    { label: t('admin.reports.kpis.activePrograms'), value: programmesActifs, icon: FileText, color: 'var(--edu-info)', loading: loadingProgs },
    { label: t('admin.reports.kpis.totalCandidatures'), value: totalCandidatures, icon: BarChart3, color: 'var(--edu-warning)', loading: loadingCands },
    { label: t('admin.reports.kpis.accepted'), value: acceptees, icon: CheckCircle, color: 'var(--edu-success)', loading: loadingCands },
    { label: t('admin.reports.kpis.acceptanceRate'), value: `${taux}%`, icon: TrendingUp, color: 'var(--edu-success)', loading: loadingCands },
  ];

  // ── Candidatures par domaine ───────────────────────────────────
  const dataCandidaturesParDomaine = React.useMemo(() => {
    const counter: Record<string, number> = {};
    candidatures.forEach((c: Candidature) => {
      const domaine = c.programme?.domaine;
      if (domaine) counter[domaine] = (counter[domaine] ?? 0) + 1;
    });
    return Object.entries(counter)
      .map(([domaine, count]) => ({ domaine: DOMAIN_LABELS[domaine] ?? domaine, count }))
      .sort((a, b) => b.count - a.count);
  }, [candidatures]);

  // ── Répartition programmes par niveau ─────────────────────────
  const dataProgrammesParNiveau = React.useMemo(() => {
    const counter: Record<string, number> = {};
    programmes.forEach((p) => {
      const niveau = p.niveau;
      if (niveau) counter[niveau] = (counter[niveau] ?? 0) + 1;
    });
    return Object.entries(counter)
      .map(([niveau, value]) => ({ name: LEVEL_LABELS[niveau] ?? niveau, value }));
  }, [programmes]);

  // ── Taux d'acceptation par domaine ────────────────────────────
  const dataTauxParDomaine = React.useMemo(() => {
    const map: Record<string, { total: number; accepted: number }> = {};
    candidatures.forEach((c: Candidature) => {
      const domaine = c.programme?.domaine;
      if (!domaine) return;
      if (!map[domaine]) map[domaine] = { total: 0, accepted: 0 };
      map[domaine].total += 1;
      if (c.statut === 'acceptee') map[domaine].accepted += 1;
    });
    return Object.entries(map)
      .map(([domaine, data]) => ({
        domaine: DOMAIN_LABELS[domaine] ?? domaine,
        taux: data.total > 0 ? Math.round((data.accepted / data.total) * 100) : 0,
        total: data.total,
      }))
      .sort((a, b) => b.total - a.total);
  }, [candidatures]);

  // ── Top programmes par candidatures ───────────────────────────
  const dataTopProgrammes = React.useMemo(() => {
    const counter: Record<string, number> = {};
    candidatures.forEach((c: Candidature) => {
      const titre = c.programme?.titre;
      if (titre) counter[titre] = (counter[titre] ?? 0) + 1;
    });
    return Object.entries(counter)
      .map(([titre, count]) => ({ titre, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 8);
  }, [candidatures]);

  // ── Tableau récapitulatif par institut ────────────────────────
  const summaryData = React.useMemo(() => {
    const map: Record<string, { nom: string; programmes: number; candidatures: number; acceptees: number }> = {};
    programmes.forEach((p) => {
      const id = p.institut_id;
      const nom = p.institut?.nom ?? 'Inconnu';
      if (!map[id]) map[id] = { nom, programmes: 0, candidatures: 0, acceptees: 0 };
      map[id].programmes += 1;
    });
    candidatures.forEach((c: Candidature) => {
      const id = c.programme?.institut_id ?? (c.programme?.institut as { id?: string } | undefined)?.id ?? '';
      if (!id) return;
      if (!map[id]) map[id] = { nom: c.programme?.institut?.nom ?? 'Inconnu', programmes: 0, candidatures: 0, acceptees: 0 };
      map[id].candidatures += 1;
      if (c.statut === 'acceptee') map[id].acceptees += 1;
    });
    return Object.values(map).sort((a, b) => b.candidatures - a.candidatures);
  }, [programmes, candidatures]);

  // ── Export PDF ────────────────────────────────────────────────
  const handleExportPdf = async () => {
    setPdfLoading(true);
    try {
      const { jsPDF } = await import('jspdf');
      const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
      const W = pdf.internal.pageSize.getWidth();
      const M = 16;
      let y = 0;

      // Header band
      pdf.setFillColor(79, 70, 229);
      pdf.rect(0, 0, W, 38, 'F');
      pdf.setTextColor(255, 255, 255);
      pdf.setFontSize(18);
      pdf.setFont('helvetica', 'bold');
      pdf.text('EduBridge — Rapports', M, 17);
      pdf.setFontSize(9);
      pdf.setFont('helvetica', 'normal');
      pdf.text(`Administration  •  Généré le ${new Date().toLocaleDateString('fr-FR')}`, M, 28);
      y = 50;

      // KPIs
      pdf.setTextColor(30, 30, 30);
      pdf.setFontSize(12);
      pdf.setFont('helvetica', 'bold');
      pdf.text('Indicateurs clés', M, y);
      y += 7;

      const kpiItems = [
        { label: 'Candidats', value: String(totalCandidats) },
        { label: 'Instituts approuvés', value: String(institutsApprouves) },
        { label: 'Programmes actifs', value: String(programmesActifs) },
        { label: 'Total candidatures', value: String(totalCandidatures) },
        { label: 'Acceptées', value: String(acceptees) },
        { label: "Taux d'acceptation", value: `${taux}%` },
      ];
      const cellW = (W - M * 2 - 10) / 3;
      const cellH = 20;
      kpiItems.forEach((item, i) => {
        const col = i % 3;
        const row = Math.floor(i / 3);
        const cx = M + col * (cellW + 5);
        const cy = y + row * (cellH + 4);
        pdf.setFillColor(245, 245, 252);
        pdf.rect(cx, cy, cellW, cellH, 'F');
        pdf.setDrawColor(210, 210, 230);
        pdf.setLineWidth(0.3);
        pdf.rect(cx, cy, cellW, cellH, 'S');
        pdf.setTextColor(79, 70, 229);
        pdf.setFontSize(15);
        pdf.setFont('helvetica', 'bold');
        pdf.text(item.value, cx + 4, cy + 11);
        pdf.setTextColor(100, 100, 120);
        pdf.setFontSize(7.5);
        pdf.setFont('helvetica', 'normal');
        pdf.text(item.label, cx + 4, cy + 17);
      });
      y += 2 * (cellH + 4) + 12;

      // Summary table
      pdf.setTextColor(30, 30, 30);
      pdf.setFontSize(12);
      pdf.setFont('helvetica', 'bold');
      pdf.text('Récapitulatif par institut', M, y);
      y += 7;

      const headers = ['Institut', 'Programmes', 'Candidatures', 'Acceptées', 'Taux'];
      const colW = [68, 26, 30, 28, 22];
      pdf.setFillColor(79, 70, 229);
      pdf.rect(M, y, W - M * 2, 8, 'F');
      pdf.setTextColor(255, 255, 255);
      pdf.setFontSize(8);
      pdf.setFont('helvetica', 'bold');
      let xPos = M + 3;
      headers.forEach((h, i) => { pdf.text(h, xPos, y + 5.5); xPos += colW[i]; });
      y += 8;

      summaryData.forEach((row, idx) => {
        if (y > 272) { pdf.addPage(); y = 16; }
        const rate = row.candidatures > 0 ? Math.round((row.acceptees / row.candidatures) * 100) : 0;
        if (idx % 2 === 0) { pdf.setFillColor(245, 245, 252); pdf.rect(M, y, W - M * 2, 7.5, 'F'); }
        pdf.setTextColor(50, 50, 60);
        pdf.setFontSize(8);
        pdf.setFont('helvetica', 'normal');
        xPos = M + 3;
        [row.nom, String(row.programmes), String(row.candidatures), String(row.acceptees), `${rate}%`].forEach((v, i) => {
          pdf.text(v, xPos, y + 5.2);
          xPos += colW[i];
        });
        y += 7.5;
      });

      pdf.save(`rapports_admin_${new Date().toISOString().slice(0, 10)}.pdf`);
      toast.success(t('admin.reports.pdfSuccess'));
    } catch (err) {
      console.error(err);
      toast.error(t('admin.reports.pdfError'));
    } finally {
      setPdfLoading(false);
    }
  };

  // ── Exports CSV ───────────────────────────────────────────────
  const handleExportCandidatures = () => {
    const headers = ['ID', 'Candidat', 'Programme', 'Domaine', 'Niveau', 'Institut', 'Statut', 'Soumise le'];
    const rows = candidatures.map((c) => [
      c.id,
      [c.candidat?.prenom, c.candidat?.nom].filter(Boolean).join(' ') || '—',
      c.programme?.titre ?? '—',
      DOMAIN_LABELS[c.programme?.domaine ?? ''] ?? c.programme?.domaine ?? '—',
      LEVEL_LABELS[c.programme?.niveau ?? ''] ?? c.programme?.niveau ?? '—',
      c.programme?.institut?.nom ?? '—',
      c.statut,
      c.soumise_le ? new Date(c.soumise_le).toLocaleDateString() : '—',
    ]);
    exportCsv([headers, ...rows], `candidatures_${new Date().toISOString().slice(0, 10)}.csv`);
  };

  const handleExportInstituts = () => {
    const headers = ['ID', 'Nom', 'Sigle', 'Statut', 'Vérifié', 'Programmes', 'Candidatures', 'Email'];
    const rows = instituts.map((i) => {
      const nbProgs = programmes.filter((p) => p.institut_id === i.id).length;
      const nbCands = candidatures.filter((c) => (c.programme?.institut_id ?? '') === i.id).length;
      return [i.id, i.nom ?? '—', i.sigle ?? '—', i.validation_status ?? '—', i.est_verifie ? 'Oui' : 'Non', String(nbProgs), String(nbCands), i.utilisateur?.email ?? '—'];
    });
    exportCsv([headers, ...rows], `instituts_${new Date().toISOString().slice(0, 10)}.csv`);
  };

  return (
    <div>
      {/* Header */}
      <div className="bg-white dark:bg-[#1D1D1F] border-b border-[var(--edu-border)] px-8 py-6">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-[var(--edu-text-tertiary)] mb-1">
              Administration
            </p>
            <h1 className="text-3xl font-bold text-[var(--edu-text-primary)]">
              {t('admin.reports.title')}
            </h1>
            <p className="text-sm text-[var(--edu-text-secondary)] mt-1">
              {t('admin.reports.subtitle')}
            </p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <DropdownMenu>
              <DropdownMenuTrigger className={cn(buttonVariants({ variant: 'outline' }), 'rounded-full')}>
                <Download className="w-4 h-4 mr-2" />
                {t('admin.reports.exportInstituts')}
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={handleExportPdf} disabled={pdfLoading}>
                  {pdfLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <FileDown className="w-4 h-4 mr-2" />}
                  PDF
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleExportInstituts}>
                  <Download className="w-4 h-4 mr-2" />
                  CSV
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <DropdownMenu>
              <DropdownMenuTrigger
                className={cn(buttonVariants(), 'rounded-full text-white')}
                style={{ backgroundColor: 'var(--edu-indigo)' }}
              >
                <Download className="w-4 h-4 mr-2" />
                {t('admin.reports.exportCandidatures')}
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={handleExportPdf} disabled={pdfLoading}>
                  {pdfLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <FileDown className="w-4 h-4 mr-2" />}
                  PDF
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleExportCandidatures}>
                  <Download className="w-4 h-4 mr-2" />
                  CSV
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>

      <div className="p-8 space-y-8 max-w-[1600px]">
        {/* KPIs */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4"
        >
          {kpis.map((kpi, i) => (
            <motion.div
              key={kpi.label}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05, duration: 0.35 }}
            >
              <div className="bg-white dark:bg-[#1D1D1F] rounded-2xl p-5 border border-[var(--edu-border)]">
                <div className="p-2.5 rounded-xl w-fit mb-4" style={{ backgroundColor: `${kpi.color}15` }}>
                  <kpi.icon className="w-5 h-5" style={{ color: kpi.color }} />
                </div>
                <p className="text-3xl font-bold text-[var(--edu-text-primary)] tracking-tight">
                  {kpi.loading ? (
                    <span className="inline-block w-12 h-8 bg-[var(--edu-surface)] rounded animate-pulse" />
                  ) : (
                    kpi.value
                  )}
                </p>
                <p className="text-xs text-[var(--edu-text-secondary)] mt-1 leading-snug">{kpi.label}</p>
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* Candidatures par domaine + Programmes par niveau */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          <div className="bg-white dark:bg-[#1D1D1F] rounded-2xl p-6 border border-[var(--edu-border)] lg:col-span-2">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-[var(--edu-text-primary)]">
                {t('admin.reports.charts.candidaturesByDomain')}
              </h3>
              <span className="text-xs text-[var(--edu-text-tertiary)]">{totalCandidatures} au total</span>
            </div>
            {dataCandidaturesParDomaine.length === 0 ? (
              <div className="h-[260px] flex items-center justify-center text-sm text-[var(--edu-text-secondary)]">
                {t('common.noData')}
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={dataCandidaturesParDomaine} margin={{ top: 8, right: 8, bottom: 0, left: -16 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--edu-divider)" vertical={false} />
                  <XAxis dataKey="domaine" stroke="var(--edu-text-tertiary)" style={{ fontSize: '11px' }} tickLine={false} axisLine={false} />
                  <YAxis stroke="var(--edu-text-tertiary)" style={{ fontSize: '11px' }} tickLine={false} axisLine={false} allowDecimals={false} />
                  <Tooltip cursor={{ fill: 'var(--edu-surface)' }} contentStyle={tooltipStyle} />
                  <Bar dataKey="count" radius={[8, 8, 0, 0]}>
                    {dataCandidaturesParDomaine.map((_, i) => (
                      <Cell key={i} fill={DOMAIN_COLORS[i % DOMAIN_COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>

          <div className="bg-white dark:bg-[#1D1D1F] rounded-2xl p-6 border border-[var(--edu-border)]">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-[var(--edu-text-primary)]">
                {t('admin.reports.charts.programsByLevel')}
              </h3>
              <span className="text-xs text-[var(--edu-text-tertiary)]">{programmesActifs} programmes</span>
            </div>
            {dataProgrammesParNiveau.length === 0 ? (
              <div className="h-[260px] flex items-center justify-center text-sm text-[var(--edu-text-secondary)]">
                {t('common.noData')}
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={260}>
                <PieChart>
                  <Pie
                    data={dataProgrammesParNiveau}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={95}
                    paddingAngle={4}
                    dataKey="value"
                    stroke="none"
                  >
                    {dataProgrammesParNiveau.map((_, idx) => (
                      <Cell key={idx} fill={LEVEL_COLORS[idx % LEVEL_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={tooltipStyle} />
                  <Legend verticalAlign="bottom" iconType="circle" wrapperStyle={{ fontSize: '12px', paddingTop: '8px' }} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Taux d'acceptation par domaine */}
        {dataTauxParDomaine.length > 0 && (
          <div className="bg-white dark:bg-[#1D1D1F] rounded-2xl p-6 border border-[var(--edu-border)]">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-[var(--edu-text-primary)]">
                {t('admin.reports.charts.acceptanceByDomain')}
              </h3>
              <span className="text-xs text-[var(--edu-text-tertiary)]">en %</span>
            </div>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={dataTauxParDomaine} margin={{ top: 8, right: 16, bottom: 0, left: -16 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--edu-divider)" vertical={false} />
                <XAxis dataKey="domaine" stroke="var(--edu-text-tertiary)" style={{ fontSize: '11px' }} tickLine={false} axisLine={false} />
                <YAxis
                  domain={[0, 100]}
                  tickFormatter={(v) => `${v}%`}
                  stroke="var(--edu-text-tertiary)"
                  style={{ fontSize: '11px' }}
                  tickLine={false}
                  axisLine={false}
                />
                <Tooltip
                  cursor={{ fill: 'var(--edu-surface)' }}
                  contentStyle={tooltipStyle}
                  formatter={(value: number) => [`${value}%`, t('admin.reports.kpis.acceptanceRate')]}
                />
                <Bar dataKey="taux" radius={[8, 8, 0, 0]}>
                  {dataTauxParDomaine.map((entry, i) => (
                    <Cell
                      key={i}
                      fill={entry.taux >= 50 ? 'var(--edu-success)' : entry.taux >= 25 ? 'var(--edu-warning)' : 'var(--edu-danger)'}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Top programmes */}
        {dataTopProgrammes.length > 0 && (
          <div className="bg-white dark:bg-[#1D1D1F] rounded-2xl p-6 border border-[var(--edu-border)]">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-[var(--edu-text-primary)]">
                {t('admin.reports.charts.topPrograms')}
              </h3>
              <span className="text-xs text-[var(--edu-text-tertiary)]">par nombre de candidatures</span>
            </div>
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={dataTopProgrammes} layout="vertical" margin={{ top: 4, right: 16, bottom: 0, left: 8 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--edu-divider)" horizontal={false} />
                <XAxis type="number" stroke="var(--edu-text-tertiary)" style={{ fontSize: '11px' }} tickLine={false} axisLine={false} allowDecimals={false} />
                <YAxis dataKey="titre" type="category" stroke="var(--edu-text-tertiary)" style={{ fontSize: '11px' }} tickLine={false} axisLine={false} width={200} />
                <Tooltip cursor={{ fill: 'var(--edu-surface)' }} contentStyle={tooltipStyle} />
                <Bar dataKey="count" fill="var(--edu-blue)" radius={[0, 8, 8, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Tableau récapitulatif par institut */}
        <div className="bg-white dark:bg-[#1D1D1F] rounded-2xl border border-[var(--edu-border)] overflow-hidden">
          <div className="px-6 py-5 border-b border-[var(--edu-border)]">
            <h3 className="font-semibold text-[var(--edu-text-primary)]">{t('admin.reports.table.title')}</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[var(--edu-divider)]">
                  {['name', 'programs', 'candidatures', 'accepted', 'rate'].map((col) => (
                    <th
                      key={col}
                      className={`px-6 py-3 text-xs font-semibold uppercase tracking-wider text-[var(--edu-text-tertiary)] ${col === 'name' ? 'text-left' : 'text-right'}`}
                    >
                      {t(`admin.reports.table.${col}`)}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--edu-divider)]">
                {summaryData.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-10 text-center text-sm text-[var(--edu-text-secondary)]">
                      {t('common.noData')}
                    </td>
                  </tr>
                ) : (
                  summaryData.map((row, i) => {
                    const rate = row.candidatures > 0 ? Math.round((row.acceptees / row.candidatures) * 100) : 0;
                    const rateColor = rate >= 50 ? 'var(--edu-success)' : rate >= 25 ? 'var(--edu-warning)' : 'var(--edu-danger)';
                    const rateBg = rate >= 50 ? 'rgba(52,199,89,0.1)' : rate >= 25 ? 'rgba(255,159,10,0.1)' : 'rgba(255,59,48,0.1)';
                    return (
                      <tr key={i} className="hover:bg-[var(--edu-surface)] transition-colors">
                        <td className="px-6 py-4 text-sm font-medium text-[var(--edu-text-primary)]">{row.nom}</td>
                        <td className="px-6 py-4 text-sm text-right text-[var(--edu-text-secondary)]">{row.programmes}</td>
                        <td className="px-6 py-4 text-sm text-right text-[var(--edu-text-secondary)]">{row.candidatures}</td>
                        <td className="px-6 py-4 text-sm text-right text-[var(--edu-text-secondary)]">{row.acceptees}</td>
                        <td className="px-6 py-4 text-right">
                          <span
                            className="text-xs font-semibold px-2 py-1 rounded-full"
                            style={{ color: rateColor, backgroundColor: rateBg }}
                          >
                            {rate}%
                          </span>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
