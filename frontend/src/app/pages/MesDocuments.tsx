import { useState } from 'react';
import { Link } from 'react-router';
import { motion } from 'motion/react';
import { FolderOpen, FileText, Download, ExternalLink, Eye, X } from 'lucide-react';
import { DashboardSidebar } from '../components/DashboardSidebar';
import { Button } from '../components/ui/button';
import { useAuth } from '@/context/AuthContext';
import { useCandidatures } from '@/hooks/useCandidatures';
import { API_URL } from '@/config';
import type { Candidature, DocumentSoumis } from '@/types/api';

interface DocumentRow {
  doc: DocumentSoumis;
  candidature: Candidature;
}

// Le backend stocke les fichiers sous `/uploads/...` ; API_URL contient `/api`
// donc on retire ce suffixe pour reconstruire l'origine du serveur statique.
function buildFileUrl(url: string): string {
  if (/^https?:\/\//i.test(url)) return url;
  const origin = API_URL.replace(/\/api\/?$/, '');
  return `${origin}${url.startsWith('/') ? '' : '/'}${url}`;
}

function isImage(url: string): boolean {
  return /\.(jpg|jpeg|png|gif|webp)$/i.test(url);
}

// ─────────────────────────────────────────────────────────────
// Modale de prévisualisation
// ─────────────────────────────────────────────────────────────

function PreviewModal({ doc, onClose }: { doc: DocumentSoumis; onClose: () => void }) {
  const fileUrl = buildFileUrl(doc.url);
  const image = isImage(doc.url);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-label={`Prévisualisation : ${doc.nom}`}
    >
      {/* Overlay */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Panel */}
      <div className="relative z-10 bg-white dark:bg-[#1D1D1F] rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--edu-border)] flex-shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: 'var(--edu-blue)15' }}>
              <FileText className="w-4 h-4" style={{ color: 'var(--edu-blue)' }} />
            </div>
            <p className="text-sm font-semibold text-[var(--edu-text-primary)] truncate">{doc.nom}</p>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0 ml-4">
            <a
              href={fileUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-[var(--edu-blue)] hover:bg-[var(--edu-blue)]/10 transition-colors"
            >
              <ExternalLink className="w-3.5 h-3.5" /> Ouvrir
            </a>
            <a
              href={fileUrl}
              download={doc.nom}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-[var(--edu-text-secondary)] hover:bg-[var(--edu-surface)] transition-colors"
            >
              <Download className="w-3.5 h-3.5" /> Télécharger
            </a>
            <button
              onClick={onClose}
              className="p-2 rounded-full hover:bg-[var(--edu-surface)] text-[var(--edu-text-tertiary)] hover:text-[var(--edu-text-primary)] transition-colors"
              aria-label="Fermer la prévisualisation"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto bg-[var(--edu-surface)] min-h-0">
          {image ? (
            <div className="flex items-center justify-center p-6 min-h-[400px]">
              <img
                src={fileUrl}
                alt={doc.nom}
                className="max-w-full max-h-[70vh] rounded-lg shadow-lg object-contain"
              />
            </div>
          ) : (
            <iframe
              src={fileUrl}
              title={doc.nom}
              className="w-full h-[70vh] border-0"
            />
          )}
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Page principale
// ─────────────────────────────────────────────────────────────

export function MesDocuments() {
  const { user } = useAuth();
  const { candidatures, loading, error } = useCandidatures();
  const prenom = user?.prenom ?? user?.email?.split('@')[0] ?? 'Candidat';
  const [previewing, setPreviewing] = useState<DocumentSoumis | null>(null);

  const rows: DocumentRow[] = candidatures.flatMap((c) =>
    (c.documents_soumis ?? []).map((doc) => ({ doc, candidature: c }))
  );

  return (
    <div className="flex h-screen bg-[var(--edu-surface)]">
      <DashboardSidebar role="candidate" user={{ name: prenom, role: user?.role ?? 'candidat' }} />

      <main className="flex-1 overflow-y-auto">
        <div className="bg-white dark:bg-[#1D1D1F] border-b border-[var(--edu-border)] px-8 py-6">
          <h1 className="text-2xl font-bold text-[var(--edu-text-primary)]">Mes documents</h1>
          <p className="text-sm text-[var(--edu-text-secondary)] mt-0.5">
            {rows.length > 0
              ? `${rows.length} document${rows.length > 1 ? 's' : ''} déposé${rows.length > 1 ? 's' : ''} dans vos candidatures`
              : 'Historique des fichiers déposés dans vos candidatures'}
          </p>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
          className="p-8"
        >
          {error ? (
            <div className="glass-card rounded-2xl py-10 text-center px-6">
              <p className="text-sm text-[var(--edu-danger)]">{error}</p>
            </div>
          ) : loading ? (
            <div className="glass-card rounded-2xl overflow-hidden">
              <div className="p-6 space-y-4">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="flex gap-4 animate-pulse">
                    <div className="w-10 h-10 bg-[var(--edu-surface)] rounded-lg" />
                    <div className="flex-1 space-y-2">
                      <div className="h-4 bg-[var(--edu-surface)] rounded w-1/3" />
                      <div className="h-3 bg-[var(--edu-surface)] rounded w-1/2" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : rows.length === 0 ? (
            <div className="glass-card rounded-2xl py-16 flex flex-col items-center gap-4 text-center px-6">
              <FolderOpen className="w-12 h-12 text-[var(--edu-text-tertiary)]" />
              <div>
                <p className="text-base font-semibold text-[var(--edu-text-primary)]">Aucun document pour le moment</p>
                <p className="text-sm text-[var(--edu-text-secondary)] mt-1">Les fichiers que vous joindrez à une candidature apparaîtront ici.</p>
              </div>
              <Link to="/search">
                <Button className="bg-[var(--edu-blue)] hover:bg-[var(--edu-blue-hover)] text-white mt-1">Explorer les programmes</Button>
              </Link>
            </div>
          ) : (
            <div className="glass-card rounded-2xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-[var(--edu-surface)]">
                    <tr>
                      <th className="text-left px-6 py-4 text-xs font-semibold text-[var(--edu-text-secondary)] uppercase tracking-wide">Document</th>
                      <th className="text-left px-6 py-4 text-xs font-semibold text-[var(--edu-text-secondary)] uppercase tracking-wide hidden md:table-cell">Programme</th>
                      <th className="text-left px-6 py-4 text-xs font-semibold text-[var(--edu-text-secondary)] uppercase tracking-wide hidden lg:table-cell">Déposé le</th>
                      <th className="text-right px-6 py-4 text-xs font-semibold text-[var(--edu-text-secondary)] uppercase tracking-wide">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--edu-divider)]">
                    {rows.map(({ doc, candidature }, i) => (
                      <tr
                        key={`${candidature.id}-${doc.media_id}-${i}`}
                        className="hover:bg-[var(--edu-surface)] transition-colors"
                      >
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: 'var(--edu-blue)15' }}>
                              <FileText className="w-4 h-4" style={{ color: 'var(--edu-blue)' }} />
                            </div>
                            <p className="text-sm font-medium text-[var(--edu-text-primary)] truncate max-w-[260px]">{doc.nom}</p>
                          </div>
                        </td>
                        <td className="px-6 py-4 hidden md:table-cell">
                          <Link to={`/program/${candidature.programme_id}`} className="text-sm text-[var(--edu-text-secondary)] hover:text-[var(--edu-blue)] truncate max-w-[220px] inline-block">
                            {candidature.programme?.titre ?? '—'}
                          </Link>
                        </td>
                        <td className="px-6 py-4 hidden lg:table-cell">
                          <p className="text-sm text-[var(--edu-text-secondary)]">
                            {doc.telecharge_le ? new Date(doc.telecharge_le).toLocaleDateString('fr-FR') : '—'}
                          </p>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="inline-flex items-center gap-1">
                            <button
                              onClick={() => setPreviewing(doc)}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-[var(--edu-text-secondary)] hover:bg-[var(--edu-surface)] hover:text-[var(--edu-text-primary)] transition-colors"
                              aria-label={`Prévisualiser ${doc.nom}`}
                            >
                              <Eye className="w-3.5 h-3.5" />
                              <span className="hidden sm:inline">Aperçu</span>
                            </button>
                            <a
                              href={buildFileUrl(doc.url)}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-[var(--edu-blue)] hover:bg-[var(--edu-blue)]/10 transition-colors"
                            >
                              <ExternalLink className="w-3.5 h-3.5" /> Ouvrir
                            </a>
                            <a
                              href={buildFileUrl(doc.url)}
                              download={doc.nom}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-[var(--edu-text-secondary)] hover:bg-[var(--edu-surface)] hover:text-[var(--edu-text-primary)] transition-colors"
                            >
                              <Download className="w-3.5 h-3.5" />
                              <span className="hidden sm:inline">Télécharger</span>
                            </a>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </motion.div>
      </main>

      {/* Modale de prévisualisation */}
      {previewing && (
        <PreviewModal doc={previewing} onClose={() => setPreviewing(null)} />
      )}
    </div>
  );
}
