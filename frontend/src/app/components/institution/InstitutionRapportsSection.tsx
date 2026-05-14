import React from 'react';
import { motion } from 'motion/react';
import { useTranslation } from 'react-i18next';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, Legend,
} from 'recharts';
import { FileText, TrendingUp, CheckCircle, Clock, XCircle, Download, BarChart3, Loader2, FileDown } from 'lucide-react';
import { buttonVariants } from '../ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu';
import { cn } from '../ui/utils';
import { toast } from 'sonner';
import { useAuth } from '@/context/AuthContext';
import { useInstitutCandidatures } from '@/hooks/useCandidatures';
import { usePrograms } from '@/hooks/usePrograms';
import i18n from '@/i18n';
import type { Candidature, Programme } from '@/types/api';

const PIE_COLORS = [
  'var(--edu-blue)',
  'var(--edu-warning)',
  'var(--edu-success)',
  'var(--edu-danger)',
  '#8B5CF6',
];

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

export function InstitutionRapportsSection() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [pdfLoading, setPdfLoading] = React.useState(false);

  const { programs: programmesRaw, loading: loadingProgs } = usePrograms({ institut_id: user?.institut_id });
  const programmes = programmesRaw as Programme[];
  const { candidatures, loading: loadingCands } = useInstitutCandidatures();

  const loading = loadingProgs || loadingCands;

  // KPIs
  const totalProgrammes = programmes.length;
  const totalCandidatures = candidatures.length;
  const acceptees = candidatures.filter((c) => c.statut === 'acceptee').length;
  const refusees = candidatures.filter((c) => c.statut === 'refusee').length;
  const enAttente = candidatures.filter((c) => c.statut === 'soumise' || c.statut === 'en_examen').length;
  const taux = totalCandidatures > 0 ? Math.round((acceptees / totalCandidatures) * 100) : 0;

  const kpis = [
    { label: t('institution.reports.kpis.programs'), value: totalProgrammes, icon: FileText, color: 'var(--edu-blue)', loading: loadingProgs },
    { label: t('institution.reports.kpis.total'), value: totalCandidatures, icon: BarChart3, color: 'var(--edu-indigo)', loading: loadingCands },
    { label: t('institution.reports.kpis.pending'), value: enAttente, icon: Clock, color: 'var(--edu-warning)', loading: loadingCands },
    { label: t('institution.reports.kpis.accepted'), value: acceptees, icon: CheckCircle, color: 'var(--edu-success)', loading: loadingCands },
    { label: t('institution.reports.kpis.rejected'), value: refusees, icon: XCircle, color: 'var(--edu-danger)', loading: loadingCands },
    { label: t('institution.reports.kpis.rate'), value: `${taux}%`, icon: TrendingUp, color: 'var(--edu-success)', loading: loadingCands },
  ];

  // Chart: candidatures par mois (12 mois)
  const dataMois = React.useMemo(() => {
    const now = new Date();
    const months: { key: string; label: string; count: number }[] = [];
    for (let i = 11; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const label = d.toLocaleDateString(i18n.language, { month: 'short' });
      months.push({ key, label, count: 0 });
    }
    candidatures
      .filter((c) => c.cree_le)
      .forEach((c) => {
        const d = new Date(c.cree_le!);
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
        const m = months.find((x) => x.key === key);
        if (m) m.count += 1;
      });
    return months;
  }, [candidatures]);

  // Chart: répartition par statut (donut)
  const dataStatuts = [
    { name: t('status.soumise'), value: candidatures.filter((c) => c.statut === 'soumise').length },
    { name: t('status.en_examen'), value: candidatures.filter((c) => c.statut === 'en_examen').length },
    { name: t('status.acceptee'), value: candidatures.filter((c) => c.statut === 'acceptee').length },
    { name: t('status.refusee'), value: candidatures.filter((c) => c.statut === 'refusee').length },
    { name: t('status.liste_attente'), value: candidatures.filter((c) => c.statut === 'liste_attente').length },
  ].filter((d) => d.value > 0);

  // Chart: top programmes par candidatures
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

  // Tableau récapitulatif par programme
  const summaryData = React.useMemo(() => {
    const map: Record<string, { titre: string; total: number; acceptees: number; refusees: number; attente: number }> = {};
    programmes.forEach((p) => {
      map[p.id] = { titre: p.titre, total: 0, acceptees: 0, refusees: 0, attente: 0 };
    });
    candidatures.forEach((c: Candidature) => {
      const id = c.programme_id;
      if (!map[id]) map[id] = { titre: c.programme?.titre ?? '—', total: 0, acceptees: 0, refusees: 0, attente: 0 };
      map[id].total += 1;
      if (c.statut === 'acceptee') map[id].acceptees += 1;
      else if (c.statut === 'refusee') map[id].refusees += 1;
      else map[id].attente += 1;
    });
    return Object.values(map).sort((a, b) => b.total - a.total);
  }, [programmes, candidatures]);

  const tooltipStyle = {
    backgroundColor: 'var(--edu-elevated)',
    border: '1px solid var(--edu-border)',
    borderRadius: '12px',
    fontSize: '12px',
  };

  const handleExportPdf = async () => {
    setPdfLoading(true);
    try {
      const { jsPDF } = await import('jspdf');
      const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
      const W = pdf.internal.pageSize.getWidth();
      const M = 16;
      let y = 0;

      // Header band
      pdf.setFillColor(0, 122, 255);
      pdf.rect(0, 0, W, 38, 'F');
      pdf.setTextColor(255, 255, 255);
      pdf.setFontSize(18);
      pdf.setFont('helvetica', 'bold');
      pdf.text('EduBridge — Rapports', M, 17);
      pdf.setFontSize(9);
      pdf.setFont('helvetica', 'normal');
      pdf.text(`Établissement  •  Généré le ${new Date().toLocaleDateString('fr-FR')}`, M, 28);
      y = 50;

      // KPIs
      pdf.setTextColor(30, 30, 30);
      pdf.setFontSize(12);
      pdf.setFont('helvetica', 'bold');
      pdf.text('Indicateurs clés', M, y);
      y += 7;

      const kpiItems = [
        { label: 'Programmes', value: String(totalProgrammes) },
        { label: 'Total candidatures', value: String(totalCandidatures) },
        { label: 'En attente', value: String(enAttente) },
        { label: 'Acceptées', value: String(acceptees) },
        { label: 'Refusées', value: String(refusees) },
        { label: "Taux d'acceptation", value: `${taux}%` },
      ];
      const cellW = (W - M * 2 - 10) / 3;
      const cellH = 20;
      kpiItems.forEach((item, i) => {
        const col = i % 3;
        const row = Math.floor(i / 3);
        const cx = M + col * (cellW + 5);
        const cy = y + row * (cellH + 4);
        pdf.setFillColor(240, 247, 255);
        pdf.rect(cx, cy, cellW, cellH, 'F');
        pdf.setDrawColor(180, 210, 240);
        pdf.setLineWidth(0.3);
        pdf.rect(cx, cy, cellW, cellH, 'S');
        pdf.setTextColor(0, 100, 220);
        pdf.setFontSize(15);
        pdf.setFont('helvetica', 'bold');
        pdf.text(item.value, cx + 4, cy + 11);
        pdf.setTextColor(80, 100, 130);
        pdf.setFontSize(7.5);
        pdf.setFont('helvetica', 'normal');
        pdf.text(item.label, cx + 4, cy + 17);
      });
      y += 2 * (cellH + 4) + 12;

      // Summary table
      pdf.setTextColor(30, 30, 30);
      pdf.setFontSize(12);
      pdf.setFont('helvetica', 'bold');
      pdf.text('Récapitulatif par programme', M, y);
      y += 7;

      const headers = ['Programme', 'Total', 'Acceptées', 'Refusées', 'En attente', 'Taux'];
      const colW = [62, 18, 24, 22, 26, 22];
      pdf.setFillColor(0, 122, 255);
      pdf.rect(M, y, W - M * 2, 8, 'F');
      pdf.setTextColor(255, 255, 255);
      pdf.setFontSize(8);
      pdf.setFont('helvetica', 'bold');
      let xPos = M + 3;
      headers.forEach((h, i) => { pdf.text(h, xPos, y + 5.5); xPos += colW[i]; });
      y += 8;

      summaryData.forEach((row, idx) => {
        if (y > 272) { pdf.addPage(); y = 16; }
        const rate = row.total > 0 ? Math.round((row.acceptees / row.total) * 100) : 0;
        if (idx % 2 === 0) { pdf.setFillColor(240, 247, 255); pdf.rect(M, y, W - M * 2, 7.5, 'F'); }
        pdf.setTextColor(50, 50, 60);
        pdf.setFontSize(8);
        pdf.setFont('helvetica', 'normal');
        xPos = M + 3;
        [row.titre, String(row.total), String(row.acceptees), String(row.refusees), String(row.attente), `${rate}%`].forEach((v, i) => {
          pdf.text(v, xPos, y + 5.2);
          xPos += colW[i];
        });
        y += 7.5;
      });

      pdf.save(`rapports_etablissement_${new Date().toISOString().slice(0, 10)}.pdf`);
      toast.success(t('institution.reports.pdfSuccess'));
    } catch (err) {
      console.error(err);
      toast.error(t('institution.reports.pdfError'));
    } finally {
      setPdfLoading(false);
    }
  };

  const handleExport = () => {
    const headers = ['Candidat', 'Programme', 'Statut', 'Soumise le'];
    const rows = candidatures.map((c) => [
      [c.candidat?.prenom, c.candidat?.nom].filter(Boolean).join(' ') || '—',
      c.programme?.titre ?? '—',
      c.statut,
      c.soumise_le ? new Date(c.soumise_le).toLocaleDateString() : '—',
    ]);
    exportCsv([headers, ...rows], `candidatures_${new Date().toISOString().slice(0, 10)}.csv`);
  };

  return (
    <div>
      {/* Header */}
      <div className="bg-white dark:bg-[#1D1D1F] border-b border-[var(--edu-border)] px-8 py-6">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-[var(--edu-text-tertiary)] mb-1">
              {t('common.institution')}
            </p>
            <h1 className="text-3xl font-bold text-[var(--edu-text-primary)]">
              {t('institution.reports.title')}
            </h1>
            <p className="text-sm text-[var(--edu-text-secondary)] mt-1">
              {t('institution.reports.subtitle')}
            </p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <DropdownMenu>
              <DropdownMenuTrigger
                className={cn(buttonVariants(), 'rounded-full text-white')}
                style={{ backgroundColor: 'var(--edu-blue)' }}
              >
                <Download className="w-4 h-4 mr-2" />
                {t('institution.reports.exportCandidatures')}
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={handleExportPdf} disabled={pdfLoading}>
                  {pdfLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <FileDown className="w-4 h-4 mr-2" />}
                  PDF
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleExport}>
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

        {/* Candidatures par mois + donut statut */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          <div className="bg-white dark:bg-[#1D1D1F] rounded-2xl p-6 border border-[var(--edu-border)] lg:col-span-2">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-[var(--edu-text-primary)]">
                {t('institution.reports.charts.monthlyChart')}
              </h3>
              <span className="text-xs text-[var(--edu-text-tertiary)]">12 derniers mois</span>
            </div>
            <ResponsiveContainer width="100%" height={260}>
              <LineChart data={dataMois} margin={{ top: 8, right: 8, bottom: 0, left: -16 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--edu-divider)" vertical={false} />
                <XAxis dataKey="label" stroke="var(--edu-text-tertiary)" style={{ fontSize: '11px' }} tickLine={false} axisLine={false} />
                <YAxis stroke="var(--edu-text-tertiary)" style={{ fontSize: '11px' }} tickLine={false} axisLine={false} allowDecimals={false} />
                <Tooltip contentStyle={tooltipStyle} />
                <Line
                  type="monotone"
                  dataKey="count"
                  stroke="var(--edu-blue)"
                  strokeWidth={2.5}
                  dot={{ r: 3, fill: 'var(--edu-blue)' }}
                  activeDot={{ r: 5 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-white dark:bg-[#1D1D1F] rounded-2xl p-6 border border-[var(--edu-border)]">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-[var(--edu-text-primary)]">
                {t('institution.reports.charts.statusChart')}
              </h3>
              <span className="text-xs text-[var(--edu-text-tertiary)]">{totalCandidatures} au total</span>
            </div>
            {dataStatuts.length === 0 ? (
              <div className="h-[260px] flex items-center justify-center text-sm text-[var(--edu-text-secondary)]">
                {t('common.noData')}
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={260}>
                <PieChart>
                  <Pie
                    data={dataStatuts}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={95}
                    paddingAngle={4}
                    dataKey="value"
                    stroke="none"
                  >
                    {dataStatuts.map((_, idx) => (
                      <Cell key={idx} fill={PIE_COLORS[idx % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={tooltipStyle} />
                  <Legend verticalAlign="bottom" iconType="circle" wrapperStyle={{ fontSize: '12px', paddingTop: '8px' }} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Top programmes */}
        {dataTopProgrammes.length > 0 && (
          <div className="bg-white dark:bg-[#1D1D1F] rounded-2xl p-6 border border-[var(--edu-border)]">
            <h3 className="font-semibold text-[var(--edu-text-primary)] mb-4">
              {t('institution.reports.charts.topPrograms')}
            </h3>
            <ResponsiveContainer width="100%" height={220}>
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

        {/* Tableau récapitulatif par programme */}
        <div className="bg-white dark:bg-[#1D1D1F] rounded-2xl border border-[var(--edu-border)] overflow-hidden">
          <div className="px-6 py-5 border-b border-[var(--edu-border)]">
            <h3 className="font-semibold text-[var(--edu-text-primary)]">
              {t('institution.reports.table.title')}
            </h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[var(--edu-divider)]">
                  {['name', 'total', 'accepted', 'rejected', 'pending', 'rate'].map((col) => (
                    <th
                      key={col}
                      className={`px-6 py-3 text-xs font-semibold uppercase tracking-wider text-[var(--edu-text-tertiary)] ${col === 'name' ? 'text-left' : 'text-right'}`}
                    >
                      {t(`institution.reports.table.${col}`)}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--edu-divider)]">
                {summaryData.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-10 text-center text-sm text-[var(--edu-text-secondary)]">
                      {t('common.noData')}
                    </td>
                  </tr>
                ) : (
                  summaryData.map((row, i) => {
                    const rate = row.total > 0 ? Math.round((row.acceptees / row.total) * 100) : 0;
                    const rateColor = rate >= 50 ? 'var(--edu-success)' : rate >= 25 ? 'var(--edu-warning)' : 'var(--edu-danger)';
                    const rateBg = rate >= 50 ? 'rgba(52,199,89,0.1)' : rate >= 25 ? 'rgba(255,159,10,0.1)' : 'rgba(255,59,48,0.1)';
                    return (
                      <tr key={i} className="hover:bg-[var(--edu-surface)] transition-colors">
                        <td className="px-6 py-4 text-sm font-medium text-[var(--edu-text-primary)]">{row.titre}</td>
                        <td className="px-6 py-4 text-sm text-right text-[var(--edu-text-secondary)]">{row.total}</td>
                        <td className="px-6 py-4 text-sm text-right font-medium" style={{ color: 'var(--edu-success)' }}>{row.acceptees}</td>
                        <td className="px-6 py-4 text-sm text-right font-medium" style={{ color: 'var(--edu-danger)' }}>{row.refusees}</td>
                        <td className="px-6 py-4 text-sm text-right font-medium" style={{ color: 'var(--edu-warning)' }}>{row.attente}</td>
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
