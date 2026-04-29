import React from 'react';
import { motion } from 'motion/react';
import { toast } from 'sonner';
import {
  Users,
  Search,
  Shield,
  Building2,
  GraduationCap,
  MoreHorizontal,
  ChevronLeft,
  ChevronRight,
  UserX,
  UserCheck,
  Trash2,
  Mail,
} from 'lucide-react';
import { Button } from '../ui/button';
import { useUtilisateurs } from '@/hooks/useUtilisateurs';
import { utilisateurService } from '@/services/api';
import type { Utilisateur } from '@/types/api';

const ROLES_LABELS: Record<string, { label: string; color: string; icon: React.ComponentType<{ className?: string }> }> = {
  candidat: { label: 'Candidat', color: 'var(--edu-blue)', icon: GraduationCap },
  institut: { label: 'Institut', color: 'var(--edu-indigo)', icon: Building2 },
  admin: { label: 'Admin', color: 'var(--edu-danger)', icon: Shield },
};

const PAGE_SIZE = 12;

export function UsersSection() {
  const { utilisateurs: utilisateursRaw, loading, refetch } = useUtilisateurs();
  const utilisateurs = utilisateursRaw as Utilisateur[];

  const [search, setSearch] = React.useState('');
  const [roleFilter, setRoleFilter] = React.useState<string>('tous');
  const [page, setPage] = React.useState(1);
  const [actionMenu, setActionMenu] = React.useState<string | null>(null);
  const [processing, setProcessing] = React.useState<string | null>(null);

  // Filtrage
  const filtered = React.useMemo(() => {
    let list = utilisateurs;
    if (roleFilter !== 'tous') list = list.filter((u) => u.role === roleFilter);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (u) =>
          u.email.toLowerCase().includes(q) ||
          (u.candidat?.prenom ?? '').toLowerCase().includes(q) ||
          (u.candidat?.nom ?? '').toLowerCase().includes(q) ||
          (u.institut?.nom ?? '').toLowerCase().includes(q)
      );
    }
    return list;
  }, [utilisateurs, roleFilter, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  // Stats rapides
  const stats = [
    { label: 'Total', value: utilisateurs.length, color: 'var(--edu-text-primary)' },
    { label: 'Candidats', value: utilisateurs.filter((u) => u.role === 'candidat').length, color: 'var(--edu-blue)' },
    { label: 'Instituts', value: utilisateurs.filter((u) => u.role === 'institut').length, color: 'var(--edu-indigo)' },
    { label: 'Admins', value: utilisateurs.filter((u) => u.role === 'admin').length, color: 'var(--edu-danger)' },
  ];

  const getNom = (u: Utilisateur): string => {
    if (u.role === 'candidat' && u.candidat) {
      return [u.candidat.prenom, u.candidat.nom].filter(Boolean).join(' ') || u.email;
    }
    if (u.role === 'institut' && u.institut) {
      return u.institut.nom ?? u.email;
    }
    return u.email;
  };

  const handleToggleActif = async (u: Utilisateur) => {
    setProcessing(u.id);
    try {
      await utilisateurService.update(u.id, { est_actif: !u.est_actif });
      toast.success(u.est_actif ? 'Utilisateur désactivé.' : 'Utilisateur réactivé.');
      refetch();
    } catch {
      toast.error('Erreur lors de la modification.');
    } finally {
      setProcessing(null);
      setActionMenu(null);
    }
  };

  const handleSupprimer = async (u: Utilisateur) => {
    if (!window.confirm(`Supprimer définitivement ${getNom(u)} ?`)) return;
    setProcessing(u.id);
    try {
      await utilisateurService.delete(u.id);
      toast.success('Utilisateur supprimé.');
      refetch();
    } catch {
      toast.error('Erreur lors de la suppression.');
    } finally {
      setProcessing(null);
      setActionMenu(null);
    }
  };

  React.useEffect(() => { setPage(1); }, [search, roleFilter]);

  return (
    <div>
      {/* Header */}
      <div className="bg-white dark:bg-[#1D1D1F] border-b border-[var(--edu-border)] px-8 py-6">
        <p className="text-xs font-semibold uppercase tracking-wider text-[var(--edu-text-tertiary)] mb-1">
          Administration
        </p>
        <h1 className="text-3xl font-bold text-[var(--edu-text-primary)]">Utilisateurs</h1>
        <p className="text-sm text-[var(--edu-text-secondary)] mt-1">
          Gestion complète des comptes de la plateforme
        </p>
      </div>

      <div className="p-8 space-y-6 max-w-[1600px]">
        {/* Mini stats */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-4"
        >
          {stats.map((s) => (
            <div
              key={s.label}
              className="bg-white dark:bg-[#1D1D1F] rounded-2xl p-5 border border-[var(--edu-border)]"
            >
              <p className="text-3xl font-bold tracking-tight" style={{ color: s.color }}>
                {loading ? (
                  <span className="inline-block w-10 h-8 bg-[var(--edu-surface)] rounded animate-pulse" />
                ) : (
                  s.value
                )}
              </p>
              <p className="text-xs text-[var(--edu-text-secondary)] mt-1">{s.label}</p>
            </div>
          ))}
        </motion.div>

        {/* Filtres */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.35 }}
          className="bg-white dark:bg-[#1D1D1F] rounded-2xl border border-[var(--edu-border)] p-4 flex flex-col sm:flex-row items-stretch sm:items-center gap-3"
        >
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--edu-text-tertiary)]" />
            <input
              type="text"
              placeholder="Rechercher par nom, email…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[var(--edu-surface)] border border-[var(--edu-border)] text-sm text-[var(--edu-text-primary)] placeholder:text-[var(--edu-text-tertiary)] focus:outline-none focus:ring-2 focus:ring-[var(--edu-blue)] transition-shadow"
            />
          </div>
          <div className="flex gap-2">
            {['tous', 'candidat', 'institut', 'admin'].map((r) => (
              <button
                key={r}
                onClick={() => setRoleFilter(r)}
                className={`px-4 py-2 rounded-xl text-xs font-semibold transition-colors ${
                  roleFilter === r
                    ? 'bg-[var(--edu-indigo)] text-white'
                    : 'bg-[var(--edu-surface)] text-[var(--edu-text-secondary)] hover:bg-[var(--edu-border)]'
                }`}
              >
                {r === 'tous' ? 'Tous' : ROLES_LABELS[r]?.label ?? r}
              </button>
            ))}
          </div>
        </motion.div>

        {/* Tableau */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15, duration: 0.35 }}
          className="bg-white dark:bg-[#1D1D1F] rounded-2xl border border-[var(--edu-border)] overflow-hidden"
        >
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-[var(--edu-surface)]">
                <tr>
                  <th className="text-left px-6 py-4 text-xs font-semibold uppercase tracking-wider text-[var(--edu-text-tertiary)]">Utilisateur</th>
                  <th className="text-left px-6 py-4 text-xs font-semibold uppercase tracking-wider text-[var(--edu-text-tertiary)]">Rôle</th>
                  <th className="text-left px-6 py-4 text-xs font-semibold uppercase tracking-wider text-[var(--edu-text-tertiary)]">Statut</th>
                  <th className="text-left px-6 py-4 text-xs font-semibold uppercase tracking-wider text-[var(--edu-text-tertiary)]">Inscription</th>
                  <th className="text-right px-6 py-4 text-xs font-semibold uppercase tracking-wider text-[var(--edu-text-tertiary)]">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--edu-divider)]">
                {loading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i}>
                      {Array.from({ length: 5 }).map((_, j) => (
                        <td key={j} className="px-6 py-4">
                          <div className="h-4 bg-[var(--edu-surface)] rounded animate-pulse" />
                        </td>
                      ))}
                    </tr>
                  ))
                ) : paginated.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center">
                      <Users className="w-8 h-8 mx-auto mb-2 text-[var(--edu-text-tertiary)]" />
                      <p className="text-sm text-[var(--edu-text-secondary)]">Aucun utilisateur trouvé.</p>
                    </td>
                  </tr>
                ) : (
                  paginated.map((u) => {
                    const nom = getNom(u);
                    const initial = nom.charAt(0).toUpperCase();
                    const roleCfg = ROLES_LABELS[u.role] ?? { label: u.role, color: 'var(--edu-text-secondary)', icon: Users };
                    const RoleIcon = roleCfg.icon;

                    return (
                      <tr key={u.id} className="hover:bg-[var(--edu-surface)] transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div
                              className="w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-semibold shrink-0"
                              style={{ background: `linear-gradient(135deg, ${roleCfg.color}, var(--edu-indigo))` }}
                            >
                              {initial}
                            </div>
                            <div className="min-w-0">
                              <p className="font-medium text-sm text-[var(--edu-text-primary)] truncate">{nom}</p>
                              <p className="text-xs text-[var(--edu-text-tertiary)] truncate flex items-center gap-1">
                                <Mail className="w-3 h-3" />
                                {u.email}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold"
                            style={{ backgroundColor: `${roleCfg.color}15`, color: roleCfg.color }}
                          >
                            <RoleIcon className="w-3 h-3" />
                            {roleCfg.label}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span
                            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${
                              u.est_actif !== false
                                ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300'
                                : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300'
                            }`}
                          >
                            {u.est_actif !== false ? 'Actif' : 'Désactivé'}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-sm text-[var(--edu-text-secondary)]">
                            {u.cree_le ? new Date(u.cree_le).toLocaleDateString('fr-FR') : '—'}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center justify-end relative">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setActionMenu(actionMenu === u.id ? null : u.id)}
                              disabled={processing === u.id}
                            >
                              <MoreHorizontal className="w-4 h-4" />
                            </Button>
                            {actionMenu === u.id && (
                              <div className="absolute right-0 top-full mt-1 z-50 w-48 bg-white dark:bg-[#2D2D2F] rounded-xl shadow-xl border border-[var(--edu-border)] py-1 animate-in fade-in slide-in-from-top-1">
                                <button
                                  onClick={() => handleToggleActif(u)}
                                  className="w-full px-4 py-2.5 text-left text-sm flex items-center gap-2 hover:bg-[var(--edu-surface)] text-[var(--edu-text-primary)]"
                                >
                                  {u.est_actif !== false ? (
                                    <>
                                      <UserX className="w-4 h-4 text-[var(--edu-warning)]" />
                                      Désactiver
                                    </>
                                  ) : (
                                    <>
                                      <UserCheck className="w-4 h-4 text-[var(--edu-success)]" />
                                      Réactiver
                                    </>
                                  )}
                                </button>
                                <button
                                  onClick={() => handleSupprimer(u)}
                                  className="w-full px-4 py-2.5 text-left text-sm flex items-center gap-2 hover:bg-[var(--edu-surface)] text-[var(--edu-danger)]"
                                >
                                  <Trash2 className="w-4 h-4" />
                                  Supprimer
                                </button>
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="px-6 py-4 border-t border-[var(--edu-border)] flex items-center justify-between">
              <p className="text-xs text-[var(--edu-text-tertiary)]">
                {filtered.length} résultat{filtered.length !== 1 ? 's' : ''} — page {page}/{totalPages}
              </p>
              <div className="flex items-center gap-1">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => p - 1)}
                  className="rounded-lg"
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => p + 1)}
                  className="rounded-lg"
                >
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
