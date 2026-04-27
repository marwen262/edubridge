import React, { useState } from 'react';
import {
  Users,
  Building2,
  FileText,
  Clock,
  Plus,
  CheckCircle,
  Trash2,
  ShieldCheck,
  ShieldOff,
  X,
  UserX,
  UserCheck,
} from 'lucide-react';
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { toast } from 'sonner';
import { DashboardSidebar } from '../components/DashboardSidebar';
import { StatCard } from '../components/StatCard';
import { Button } from '../components/ui/button';
import { motion } from 'motion/react';
import { useAuth } from '@/context/AuthContext';
import { useUtilisateurs } from '@/hooks/useUtilisateurs';
import { useAllCandidatures } from '@/hooks/useCandidatures';
import { usePrograms } from '@/hooks/usePrograms';
import { useInstituts } from '@/hooks/useInstituts';
import {
  authService,
  utilisateurService,
  candidatureService,
  institutService,
} from '@/services/api';
import type { Utilisateur, Institut, Candidature } from '@/types/api';

// Couleurs des badges de rôle
const ROLE_COLORS: Record<string, string> = {
  candidat: 'var(--edu-blue)',
  institut: 'var(--edu-indigo)',
  admin:    'var(--edu-warning)',
};

const ROLE_LABELS: Record<string, string> = {
  candidat: 'Candidat',
  institut: 'Institut',
  admin:    'Admin',
};

// Couleurs des badges de statut candidature
const STATUT_COLORS: Record<string, string> = {
  brouillon:     'var(--edu-text-secondary)',
  soumise:       'var(--edu-blue)',
  en_examen:     'var(--edu-warning)',
  acceptee:      'var(--edu-success)',
  refusee:       'var(--edu-danger)',
  liste_attente: '#8B5CF6',
};

const STATUT_LABELS: Record<string, string> = {
  brouillon:     'Brouillon',
  soumise:       'Soumise',
  en_examen:     'En examen',
  acceptee:      'Acceptée',
  refusee:       'Refusée',
  liste_attente: "Liste d'attente",
};

const STATUTS = [
  'brouillon',
  'soumise',
  'en_examen',
  'acceptee',
  'refusee',
  'liste_attente',
] as const;

export function AdminDashboard() {
  const { user } = useAuth();

  // Filtres locaux
  const [filterRole, setFilterRole] = useState<
    'all' | 'candidat' | 'institut' | 'admin'
  >('all');
  const [filtreStatut, setFiltreStatut] = useState<string>('');

  // Création institut (formulaire inline)
  const [showCreateInstitut, setShowCreateInstitut] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newInstitut, setNewInstitut] = useState({
    nom: '',
    email: '',
    password: '',
  });

  // Hooks API — les hooks renvoient unknown[], on cast vers les types attendus
  const {
    utilisateurs: utilisateursRaw,
    loading: loadingUtilisateurs,
    refetch: refetchUtilisateurs,
  } = useUtilisateurs();
  const utilisateurs = utilisateursRaw as Utilisateur[];

  const {
    candidatures,
    loading: loadingCandidatures,
    refetch: refetchCandidatures,
  } = useAllCandidatures();

  const { programs: programmes, loading: loadingProgrammes } = usePrograms();

  const {
    instituts: institutsRaw,
    loading: loadingInstituts,
    refetch: refetchInstituts,
  } = useInstituts();
  const instituts = institutsRaw as Institut[];

  // Stats globales
  const totalCandidats = utilisateurs.filter((u) => u.role === 'candidat').length;
  const totalInstituts = utilisateurs.filter((u) => u.role === 'institut').length;
  const totalAdmins = utilisateurs.filter((u) => u.role === 'admin').length;

  const candidaturesEnAttente = candidatures.filter(
    (c) => c.statut === 'soumise' || c.statut === 'en_examen'
  ).length;

  const tauxAcceptation =
    candidatures.length > 0
      ? Math.round(
          (candidatures.filter((c) => c.statut === 'acceptee').length /
            candidatures.length) *
            100
        )
      : 0;

  const stats = [
    {
      label: 'Utilisateurs',
      value: String(utilisateurs.length),
      icon: Users,
      color: 'var(--edu-indigo)',
    },
    {
      label: 'Instituts',
      value: String(totalInstituts),
      icon: Building2,
      color: 'var(--edu-blue)',
    },
    {
      label: 'Programmes',
      value: String(programmes.length),
      icon: FileText,
      color: 'var(--edu-info)',
    },
    {
      label: 'En attente',
      value: String(candidaturesEnAttente),
      icon: Clock,
      color: 'var(--edu-warning)',
    },
    {
      label: 'Taux d\'acceptation',
      value: `${tauxAcceptation}%`,
      icon: CheckCircle,
      color: 'var(--edu-success)',
    },
  ];

  // Données graphiques
  const dataRoles = [
    { name: 'Candidats', value: totalCandidats, color: 'var(--edu-blue)' },
    { name: 'Instituts', value: totalInstituts, color: 'var(--edu-indigo)' },
    { name: 'Admins', value: totalAdmins, color: 'var(--edu-warning)' },
  ].filter((d) => d.value > 0);

  const dataStatuts = [
    { statut: 'Soumises',  count: candidatures.filter((c) => c.statut === 'soumise').length },
    { statut: 'En examen', count: candidatures.filter((c) => c.statut === 'en_examen').length },
    { statut: 'Acceptées', count: candidatures.filter((c) => c.statut === 'acceptee').length },
    { statut: 'Refusées',  count: candidatures.filter((c) => c.statut === 'refusee').length },
    { statut: 'Attente',   count: candidatures.filter((c) => c.statut === 'liste_attente').length },
  ];

  // Listes filtrées
  const utilisateursFiltres =
    filterRole === 'all'
      ? utilisateurs
      : utilisateurs.filter((u) => u.role === filterRole);

  const candidaturesFiltrees = filtreStatut
    ? candidatures.filter((c) => c.statut === filtreStatut)
    : candidatures;

  // --- Actions ---

  const handleCreerInstitut = async () => {
    if (!newInstitut.email || !newInstitut.password || !newInstitut.nom) {
      toast.error('Tous les champs sont requis');
      return;
    }
    setCreating(true);
    try {
      await authService.register({
        email: newInstitut.email,
        password: newInstitut.password,
        role: 'institut',
        nom: newInstitut.nom,
      });
      toast.success('Compte institut créé');
      setShowCreateInstitut(false);
      setNewInstitut({ nom: '', email: '', password: '' });
      refetchUtilisateurs();
      refetchInstituts();
    } catch (err: unknown) {
      const apiErr = err as { response?: { data?: { message?: string } } };
      toast.error(
        apiErr?.response?.data?.message ?? 'Erreur lors de la création'
      );
    } finally {
      setCreating(false);
    }
  };

  const handleToggleActif = async (id: string, estActif: boolean) => {
    try {
      await utilisateurService.update(id, { est_actif: !estActif });
      toast.success(estActif ? 'Compte désactivé' : 'Compte réactivé');
      refetchUtilisateurs();
    } catch (err: unknown) {
      const apiErr = err as { response?: { data?: { message?: string } } };
      toast.error(apiErr?.response?.data?.message ?? 'Erreur');
    }
  };

  const handleSupprimerUtilisateur = async (id: string) => {
    if (!window.confirm('Supprimer cet utilisateur définitivement ?')) return;
    try {
      await utilisateurService.delete(id);
      toast.success('Utilisateur supprimé');
      refetchUtilisateurs();
    } catch (err: unknown) {
      const apiErr = err as { response?: { data?: { message?: string } } };
      toast.error(apiErr?.response?.data?.message ?? 'Erreur');
    }
  };

  const handleChangerStatutCandidature = async (id: string, statut: string) => {
    try {
      await candidatureService.changerStatut(id, statut);
      toast.success('Statut mis à jour');
      refetchCandidatures();
    } catch (err: unknown) {
      const apiErr = err as { response?: { data?: { message?: string } } };
      toast.error(apiErr?.response?.data?.message ?? 'Erreur');
    }
  };

  const handleToggleVerifie = async (id: string, estVerifie: boolean) => {
    try {
      await institutService.update(id, { est_verifie: !estVerifie });
      toast.success(estVerifie ? 'Institut non vérifié' : 'Institut vérifié');
      refetchInstituts();
    } catch (err: unknown) {
      const apiErr = err as { response?: { data?: { message?: string } } };
      toast.error(apiErr?.response?.data?.message ?? 'Erreur');
    }
  };

  const nomAdmin = user?.prenom ?? user?.email ?? 'Administrateur';

  return (
    <div className="flex h-screen bg-[var(--edu-surface)]">
      <DashboardSidebar
        role="admin"
        user={{ name: nomAdmin, role: 'Platform Administrator' }}
      />

      <main className="flex-1 overflow-y-auto">
        {/* Header */}
        <div className="bg-white dark:bg-[#1D1D1F] border-b border-[var(--edu-border)] px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-[var(--edu-text-primary)] mb-1">
                Admin Control Panel
              </h1>
              <p className="text-[var(--edu-text-secondary)]">
                Bienvenue, {nomAdmin}
              </p>
            </div>
            <Button
              className="rounded-full text-white"
              style={{ backgroundColor: 'var(--edu-indigo)' }}
              onClick={() => setShowCreateInstitut((v) => !v)}
            >
              <Plus className="w-5 h-5 mr-2" />
              Créer un institut
            </Button>
          </div>
        </div>

        <div className="p-8 space-y-8">
          {/* Formulaire création institut (inline) */}
          {showCreateInstitut && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="glass-card rounded-2xl p-6"
            >
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-[var(--edu-text-primary)]">
                  Nouveau compte institut
                </h2>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowCreateInstitut(false)}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-[var(--edu-text-secondary)] mb-1">
                    Nom de l'école
                  </label>
                  <input
                    type="text"
                    value={newInstitut.nom}
                    onChange={(e) =>
                      setNewInstitut((s) => ({ ...s, nom: e.target.value }))
                    }
                    className="w-full px-3 py-2 rounded-lg border border-[var(--edu-border)] bg-white dark:bg-[#1D1D1F] text-[var(--edu-text-primary)]"
                    placeholder="Ex: ENIT"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[var(--edu-text-secondary)] mb-1">
                    Email
                  </label>
                  <input
                    type="email"
                    value={newInstitut.email}
                    onChange={(e) =>
                      setNewInstitut((s) => ({ ...s, email: e.target.value }))
                    }
                    className="w-full px-3 py-2 rounded-lg border border-[var(--edu-border)] bg-white dark:bg-[#1D1D1F] text-[var(--edu-text-primary)]"
                    placeholder="contact@ecole.tn"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[var(--edu-text-secondary)] mb-1">
                    Mot de passe temporaire
                  </label>
                  <input
                    type="password"
                    value={newInstitut.password}
                    onChange={(e) =>
                      setNewInstitut((s) => ({ ...s, password: e.target.value }))
                    }
                    className="w-full px-3 py-2 rounded-lg border border-[var(--edu-border)] bg-white dark:bg-[#1D1D1F] text-[var(--edu-text-primary)]"
                    placeholder="Min. 8 caractères"
                  />
                </div>
              </div>
              <div className="mt-4 flex justify-end gap-2">
                <Button
                  variant="ghost"
                  onClick={() => setShowCreateInstitut(false)}
                  disabled={creating}
                >
                  Annuler
                </Button>
                <Button
                  className="rounded-full text-white"
                  style={{ backgroundColor: 'var(--edu-indigo)' }}
                  onClick={handleCreerInstitut}
                  disabled={creating}
                >
                  {creating ? 'Création…' : 'Créer le compte'}
                </Button>
              </div>
            </motion.div>
          )}

          {/* Stats */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
              {stats.map((stat, i) => (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1, duration: 0.4 }}
                >
                  <StatCard {...stat} />
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Charts */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.4 }}
          >
            <h2 className="text-2xl font-bold text-[var(--edu-text-primary)] mb-6">
              Analytics
            </h2>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Pie : répartition par rôle */}
              <div className="glass-card rounded-2xl p-6">
                <h3 className="font-semibold text-[var(--edu-text-primary)] mb-4">
                  Répartition par rôle
                </h3>
                {dataRoles.length === 0 ? (
                  <div className="h-[260px] flex items-center justify-center text-sm text-[var(--edu-text-secondary)]">
                    Pas de données
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height={260}>
                    <PieChart>
                      <Pie
                        data={dataRoles}
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={90}
                        paddingAngle={3}
                        dataKey="value"
                      >
                        {dataRoles.map((entry, idx) => (
                          <Cell key={`cell-${idx}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{
                          backgroundColor: 'white',
                          border: '1px solid var(--edu-border)',
                          borderRadius: '12px',
                        }}
                      />
                      <Legend
                        verticalAlign="bottom"
                        iconType="circle"
                        wrapperStyle={{ fontSize: '12px' }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </div>

              {/* Bar : candidatures par statut */}
              <div className="glass-card rounded-2xl p-6 lg:col-span-2">
                <h3 className="font-semibold text-[var(--edu-text-primary)] mb-4">
                  Candidatures par statut
                </h3>
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart data={dataStatuts}>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke="var(--edu-divider)"
                    />
                    <XAxis
                      dataKey="statut"
                      stroke="var(--edu-text-tertiary)"
                      style={{ fontSize: '12px' }}
                    />
                    <YAxis
                      stroke="var(--edu-text-tertiary)"
                      style={{ fontSize: '12px' }}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'white',
                        border: '1px solid var(--edu-border)',
                        borderRadius: '12px',
                      }}
                    />
                    <Bar
                      dataKey="count"
                      fill="var(--edu-indigo)"
                      radius={[8, 8, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </motion.div>

          {/* Gestion des utilisateurs */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.4 }}
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-[var(--edu-text-primary)]">
                Gestion des utilisateurs
              </h2>
            </div>

            {/* Tabs filtres */}
            <div className="flex items-center gap-2 mb-4 flex-wrap">
              {(
                [
                  { value: 'all', label: 'Tous' },
                  { value: 'candidat', label: 'Candidats' },
                  { value: 'institut', label: 'Instituts' },
                  { value: 'admin', label: 'Admins' },
                ] as const
              ).map((tab) => (
                <button
                  key={tab.value}
                  onClick={() => setFilterRole(tab.value)}
                  className="px-4 py-2 rounded-full text-sm font-medium transition-all"
                  style={
                    filterRole === tab.value
                      ? { backgroundColor: 'var(--edu-indigo)', color: 'white' }
                      : {
                          backgroundColor: 'var(--edu-surface)',
                          color: 'var(--edu-text-secondary)',
                        }
                  }
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <div className="glass-card rounded-2xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-[var(--edu-surface)]">
                    <tr>
                      <th className="text-left px-6 py-4 text-sm font-semibold text-[var(--edu-text-primary)]">
                        Email
                      </th>
                      <th className="text-left px-6 py-4 text-sm font-semibold text-[var(--edu-text-primary)]">
                        Rôle
                      </th>
                      <th className="text-left px-6 py-4 text-sm font-semibold text-[var(--edu-text-primary)]">
                        Statut
                      </th>
                      <th className="text-left px-6 py-4 text-sm font-semibold text-[var(--edu-text-primary)]">
                        Inscrit le
                      </th>
                      <th className="text-right px-6 py-4 text-sm font-semibold text-[var(--edu-text-primary)]">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--edu-divider)]">
                    {loadingUtilisateurs ? (
                      Array.from({ length: 3 }).map((_, i) => (
                        <tr key={i}>
                          {Array.from({ length: 5 }).map((_, j) => (
                            <td key={j} className="px-6 py-4">
                              <div className="h-4 bg-[var(--edu-surface)] rounded animate-pulse" />
                            </td>
                          ))}
                        </tr>
                      ))
                    ) : utilisateursFiltres.length === 0 ? (
                      <tr>
                        <td
                          colSpan={5}
                          className="px-6 py-8 text-center text-[var(--edu-text-secondary)]"
                        >
                          Aucun utilisateur.
                        </td>
                      </tr>
                    ) : (
                      utilisateursFiltres.map((u) => (
                        <tr
                          key={u.id}
                          className="hover:bg-[var(--edu-surface)] transition-colors"
                        >
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[var(--edu-blue)] to-[var(--edu-indigo)] flex items-center justify-center text-white text-sm font-semibold">
                                {u.email.charAt(0).toUpperCase()}
                              </div>
                              <p className="font-medium text-[var(--edu-text-primary)]">
                                {u.email}
                              </p>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <span
                              className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold"
                              style={{
                                color: ROLE_COLORS[u.role],
                                backgroundColor: `${ROLE_COLORS[u.role]}1A`,
                              }}
                            >
                              {ROLE_LABELS[u.role] ?? u.role}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <span
                              className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold"
                              style={{
                                color: u.est_actif
                                  ? 'var(--edu-success)'
                                  : 'var(--edu-text-secondary)',
                                backgroundColor: u.est_actif
                                  ? 'var(--edu-success)1A'
                                  : 'var(--edu-surface)',
                              }}
                            >
                              {u.est_actif ? 'Actif' : 'Inactif'}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <span className="text-sm text-[var(--edu-text-secondary)]">
                              {u.cree_le
                                ? new Date(u.cree_le).toLocaleDateString()
                                : '—'}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <div className="flex items-center justify-end gap-1">
                              <Button
                                variant="ghost"
                                size="sm"
                                title={
                                  u.est_actif
                                    ? 'Désactiver'
                                    : 'Réactiver'
                                }
                                onClick={() =>
                                  handleToggleActif(u.id, !!u.est_actif)
                                }
                              >
                                {u.est_actif ? (
                                  <UserX className="w-4 h-4" />
                                ) : (
                                  <UserCheck className="w-4 h-4" />
                                )}
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                title="Supprimer"
                                onClick={() => handleSupprimerUtilisateur(u.id)}
                              >
                                <Trash2 className="w-4 h-4 text-[var(--edu-danger)]" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </motion.div>

          {/* Toutes les candidatures */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.4 }}
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-[var(--edu-text-primary)]">
                Toutes les candidatures
              </h2>
              <select
                value={filtreStatut}
                onChange={(e) => setFiltreStatut(e.target.value)}
                className="px-3 py-2 rounded-lg border border-[var(--edu-border)] bg-white dark:bg-[#1D1D1F] text-sm text-[var(--edu-text-primary)]"
              >
                <option value="">Tous les statuts</option>
                {STATUTS.map((s) => (
                  <option key={s} value={s}>
                    {STATUT_LABELS[s]}
                  </option>
                ))}
              </select>
            </div>

            <div className="glass-card rounded-2xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-[var(--edu-surface)]">
                    <tr>
                      <th className="text-left px-6 py-4 text-sm font-semibold text-[var(--edu-text-primary)]">
                        Candidat
                      </th>
                      <th className="text-left px-6 py-4 text-sm font-semibold text-[var(--edu-text-primary)]">
                        Programme
                      </th>
                      <th className="text-left px-6 py-4 text-sm font-semibold text-[var(--edu-text-primary)]">
                        Institut
                      </th>
                      <th className="text-left px-6 py-4 text-sm font-semibold text-[var(--edu-text-primary)]">
                        Statut
                      </th>
                      <th className="text-left px-6 py-4 text-sm font-semibold text-[var(--edu-text-primary)]">
                        Date
                      </th>
                      <th className="text-right px-6 py-4 text-sm font-semibold text-[var(--edu-text-primary)]">
                        Changer statut
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--edu-divider)]">
                    {loadingCandidatures ? (
                      Array.from({ length: 3 }).map((_, i) => (
                        <tr key={i}>
                          {Array.from({ length: 6 }).map((_, j) => (
                            <td key={j} className="px-6 py-4">
                              <div className="h-4 bg-[var(--edu-surface)] rounded animate-pulse" />
                            </td>
                          ))}
                        </tr>
                      ))
                    ) : candidaturesFiltrees.length === 0 ? (
                      <tr>
                        <td
                          colSpan={6}
                          className="px-6 py-8 text-center text-[var(--edu-text-secondary)]"
                        >
                          Aucune candidature.
                        </td>
                      </tr>
                    ) : (
                      candidaturesFiltrees.map((c: Candidature) => {
                        const nomCandidat =
                          [c.candidat?.prenom, c.candidat?.nom]
                            .filter(Boolean)
                            .join(' ') || '—';
                        const dateAffichee = c.soumise_le ?? c.cree_le;

                        return (
                          <tr
                            key={c.id}
                            className="hover:bg-[var(--edu-surface)] transition-colors"
                          >
                            <td className="px-6 py-4">
                              <p className="font-medium text-[var(--edu-text-primary)]">
                                {nomCandidat}
                              </p>
                            </td>
                            <td className="px-6 py-4">
                              <p className="text-sm text-[var(--edu-text-secondary)]">
                                {c.programme?.titre ?? '—'}
                              </p>
                            </td>
                            <td className="px-6 py-4">
                              <p className="text-sm text-[var(--edu-text-secondary)]">
                                {c.programme?.institut?.nom ?? '—'}
                              </p>
                            </td>
                            <td className="px-6 py-4">
                              <span
                                className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold"
                                style={{
                                  color: STATUT_COLORS[c.statut],
                                  backgroundColor: `${STATUT_COLORS[c.statut]}1A`,
                                }}
                              >
                                {STATUT_LABELS[c.statut]}
                              </span>
                            </td>
                            <td className="px-6 py-4">
                              <span className="text-sm text-[var(--edu-text-secondary)]">
                                {dateAffichee
                                  ? new Date(dateAffichee).toLocaleDateString()
                                  : '—'}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-right">
                              <select
                                value={c.statut}
                                onChange={(e) =>
                                  handleChangerStatutCandidature(
                                    c.id,
                                    e.target.value
                                  )
                                }
                                className="px-2 py-1 rounded-lg border border-[var(--edu-border)] bg-white dark:bg-[#1D1D1F] text-xs text-[var(--edu-text-primary)]"
                              >
                                {STATUTS.map((s) => (
                                  <option key={s} value={s}>
                                    {STATUT_LABELS[s]}
                                  </option>
                                ))}
                              </select>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </motion.div>

          {/* Instituts */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.4 }}
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-[var(--edu-text-primary)]">
                Instituts
              </h2>
            </div>

            <div className="glass-card rounded-2xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-[var(--edu-surface)]">
                    <tr>
                      <th className="text-left px-6 py-4 text-sm font-semibold text-[var(--edu-text-primary)]">
                        Nom
                      </th>
                      <th className="text-left px-6 py-4 text-sm font-semibold text-[var(--edu-text-primary)]">
                        Sigle
                      </th>
                      <th className="text-left px-6 py-4 text-sm font-semibold text-[var(--edu-text-primary)]">
                        Vérifié
                      </th>
                      <th className="text-left px-6 py-4 text-sm font-semibold text-[var(--edu-text-primary)]">
                        Note
                      </th>
                      <th className="text-left px-6 py-4 text-sm font-semibold text-[var(--edu-text-primary)]">
                        Étudiants
                      </th>
                      <th className="text-right px-6 py-4 text-sm font-semibold text-[var(--edu-text-primary)]">
                        Action
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--edu-divider)]">
                    {loadingInstituts ? (
                      Array.from({ length: 3 }).map((_, i) => (
                        <tr key={i}>
                          {Array.from({ length: 6 }).map((_, j) => (
                            <td key={j} className="px-6 py-4">
                              <div className="h-4 bg-[var(--edu-surface)] rounded animate-pulse" />
                            </td>
                          ))}
                        </tr>
                      ))
                    ) : instituts.length === 0 ? (
                      <tr>
                        <td
                          colSpan={6}
                          className="px-6 py-8 text-center text-[var(--edu-text-secondary)]"
                        >
                          Aucun institut.
                        </td>
                      </tr>
                    ) : (
                      instituts.map((inst) => (
                        <tr
                          key={inst.id}
                          className="hover:bg-[var(--edu-surface)] transition-colors"
                        >
                          <td className="px-6 py-4">
                            <p className="font-medium text-[var(--edu-text-primary)]">
                              {inst.nom}
                            </p>
                          </td>
                          <td className="px-6 py-4">
                            <span className="text-sm text-[var(--edu-text-secondary)]">
                              {inst.sigle ?? '—'}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <span
                              className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold"
                              style={{
                                color: inst.est_verifie
                                  ? 'var(--edu-success)'
                                  : 'var(--edu-text-secondary)',
                                backgroundColor: inst.est_verifie
                                  ? 'var(--edu-success)1A'
                                  : 'var(--edu-surface)',
                              }}
                            >
                              {inst.est_verifie ? 'Vérifié' : 'Non vérifié'}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <span className="text-sm text-[var(--edu-text-secondary)]">
                              {inst.note != null ? inst.note.toFixed(1) : '—'}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <span className="text-sm text-[var(--edu-text-secondary)]">
                              {inst.nombre_etudiants ?? '—'}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() =>
                                handleToggleVerifie(
                                  inst.id,
                                  !!inst.est_verifie
                                )
                              }
                            >
                              {inst.est_verifie ? (
                                <ShieldOff className="w-4 h-4 text-[var(--edu-text-secondary)]" />
                              ) : (
                                <ShieldCheck className="w-4 h-4 text-[var(--edu-success)]" />
                              )}
                            </Button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </motion.div>
        </div>
      </main>
    </div>
  );
}
