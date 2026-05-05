import { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import {
  Mail, User as UserIcon, Shield, Phone, MapPin,
  Globe, IdCard, GraduationCap, AlertCircle, Pencil, X, Check,
} from 'lucide-react';
import { DashboardSidebar } from '../components/DashboardSidebar';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { AdresseFields } from '../components/forms/AdresseFields';
import { useAuth } from '@/context/AuthContext';
import { authService, utilisateurService } from '@/services/api';
import { trouverLabelNationalite, estTunisien, NATIONALITES } from '@/app/data/nationalites';
import { toast } from 'sonner';
import type { Candidat, Adresse, UpdateUtilisateurData } from '@/types/api';

interface FieldRow {
  label: string;
  value: string | null | undefined;
  Icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>;
  manquant?: boolean;
}

interface ProfilDraft {
  prenom: string; nom: string; telephone: string;
  nationalite: string; cin: string; numero_passeport: string; adresse: Adresse;
}

function buildDraft(c: Candidat | null, u: { prenom?: string; nom?: string } | null): ProfilDraft {
  return {
    prenom: c?.prenom ?? u?.prenom ?? '',
    nom: c?.nom ?? u?.nom ?? '',
    telephone: c?.telephone ?? '',
    nationalite: c?.nationalite ?? 'tunisienne',
    cin: c?.cin ?? '',
    numero_passeport: c?.numero_passeport ?? '',
    adresse: c?.adresse ? { ...c.adresse } : { rue: '', ville: '', gouvernorat: '', code_postal: '', pays: '' },
  };
}

function formatAdresse(c: Candidat | null): string {
  if (!c?.adresse) return '';
  return [c.adresse.rue, c.adresse.code_postal, c.adresse.ville, c.adresse.gouvernorat, c.adresse.pays]
    .filter(Boolean).join(', ');
}

function getIndicatifPlaceholder(nationalite: string): string {
  const map: Record<string, string> = {
    tunisienne: '+216',
    marocaine: '+212',
    française: '+33',
    algerienne: '+213',
  };
  return map[nationalite?.toLowerCase()] || '+XXX';
}

export function Parametres() {
  const { user, updateUser } = useAuth();
  const [candidat, setCandidat] = useState<Candidat | null>(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [draft, setDraft] = useState<ProfilDraft>(() => buildDraft(null, null));
  const prenom = user?.prenom ?? user?.email?.split('@')[0] ?? 'Candidat';

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    authService.me()
      .then((res) => {
        if (cancelled) return;
        const c = res.data?.utilisateur?.candidat ?? null;
        setCandidat(c);
        setDraft(buildDraft(c, user));
      })
      .catch(() => { if (!cancelled) setCandidat(null); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const draftTunisien = estTunisien(draft.nationalite);
  const tunisien = estTunisien(candidat?.nationalite);
  const nomComplet = [candidat?.prenom ?? user?.prenom, candidat?.nom ?? user?.nom].filter(Boolean).join(' ');
  const champsManquants = [
    !candidat?.nationalite, tunisien ? !candidat?.cin : !candidat?.numero_passeport,
    !candidat?.telephone, !candidat?.adresse?.ville,
  ].filter(Boolean).length;

  const compteFields: FieldRow[] = [
    { label: 'Nom complet',   value: nomComplet || null, Icon: UserIcon, manquant: !nomComplet },
    { label: 'Adresse email', value: user?.email, Icon: Mail },
    { label: 'Rôle', value: user?.role === 'candidat' ? 'Candidat' : user?.role, Icon: Shield },
  ];

  const identiteFields: FieldRow[] = [
    { label: 'Nationalité', value: candidat?.nationalite ? trouverLabelNationalite(candidat.nationalite) : null, Icon: Globe, manquant: !candidat?.nationalite },
    { label: tunisien ? 'CIN' : 'Passeport', value: tunisien ? candidat?.cin : candidat?.numero_passeport, Icon: IdCard, manquant: tunisien ? !candidat?.cin : !candidat?.numero_passeport },
    { label: 'Téléphone', value: candidat?.telephone, Icon: Phone, manquant: !candidat?.telephone },
    { label: 'Adresse', value: formatAdresse(candidat) || null, Icon: MapPin, manquant: !candidat?.adresse?.ville },
  ];

  const handleEdit = () => { setDraft(buildDraft(candidat, user)); setIsEditing(true); };
  const handleCancel = () => { setIsEditing(false); setDraft(buildDraft(candidat, user)); };

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    try {
      const payload: Partial<UpdateUtilisateurData> = {
        prenom: draft.prenom || undefined, nom: draft.nom || undefined,
        telephone: draft.telephone || undefined, nationalite: draft.nationalite || undefined,
        cin: draftTunisien ? (draft.cin || undefined) : undefined,
        numero_passeport: !draftTunisien ? (draft.numero_passeport || undefined) : undefined,
        adresse: draft.adresse,
      };
      await utilisateurService.update(user.id, payload);
      const res = await authService.me();
      const c: Candidat | null = res.data?.utilisateur?.candidat ?? null;
      setCandidat(c);
      if (draft.prenom || draft.nom) updateUser({ prenom: draft.prenom || undefined, nom: draft.nom || undefined });
      setIsEditing(false);
      toast.success('Profil mis à jour avec succès');
    } catch { toast.error('Erreur lors de la mise à jour'); }
    finally { setSaving(false); }
  };

  return (
    <div className="flex h-screen bg-[var(--edu-surface)]">
      <DashboardSidebar role="candidate" user={{ name: prenom, role: user?.role ?? 'candidat' }} />
      <main className="flex-1 overflow-y-auto">
        <div className="bg-white dark:bg-[#1D1D1F] border-b border-[var(--edu-border)] px-8 py-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-[var(--edu-text-primary)]">Paramètres</h1>
            <p className="text-sm text-[var(--edu-text-secondary)] mt-0.5">Gérez votre compte et vos informations personnelles</p>
          </div>
          {!loading && !isEditing && (
            <Button onClick={handleEdit} variant="outline" className="flex items-center gap-2 rounded-full">
              <Pencil className="w-4 h-4" /> Modifier le profil
            </Button>
          )}
          {isEditing && (
            <div className="flex items-center gap-2">
              <Button variant="outline" onClick={handleCancel} disabled={saving} className="rounded-full flex items-center gap-2">
                <X className="w-4 h-4" /> Annuler
              </Button>
              <Button onClick={handleSave} disabled={saving} className="rounded-full bg-[var(--edu-blue)] hover:bg-[var(--edu-blue-hover)] text-white flex items-center gap-2 disabled:opacity-50">
                <Check className="w-4 h-4" /> {saving ? 'Enregistrement…' : 'Enregistrer'}
              </Button>
            </div>
          )}
        </div>

        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }} className="p-8 max-w-3xl space-y-6">
          {!loading && !isEditing && champsManquants > 0 && (
            <div className="rounded-xl bg-[var(--edu-warning)]/10 border border-[var(--edu-warning)]/30 px-4 py-3 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-[var(--edu-warning)] flex-shrink-0 mt-0.5" />
              <div className="text-sm">
                <p className="font-medium text-[var(--edu-text-primary)]">
                  Profil incomplet — {champsManquants} champ{champsManquants > 1 ? 's' : ''} manquant{champsManquants > 1 ? 's' : ''}
                </p>
                <p className="text-xs text-[var(--edu-text-secondary)] mt-0.5">Cliquez sur « Modifier le profil » pour compléter vos informations.</p>
              </div>
            </div>
          )}

          <SectionCard title="Compte" subtitle="Informations de connexion">
            {loading ? <Skeleton rows={3} /> : <FieldList fields={compteFields} />}
          </SectionCard>

          <SectionCard title="Identité" subtitle={isEditing ? 'Modifiez vos informations personnelles' : 'Source de vérité de votre dossier'}>
            {loading ? <Skeleton rows={4} /> : isEditing ? (
              <div className="px-6 py-5 space-y-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="edit-prenom">Prénom</Label>
                    <Input id="edit-prenom" value={draft.prenom} onChange={(e) => setDraft((d) => ({ ...d, prenom: e.target.value }))} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-nom">Nom</Label>
                    <Input id="edit-nom" value={draft.nom} onChange={(e) => setDraft((d) => ({ ...d, nom: e.target.value }))} />
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="edit-nationalite">Nationalité</Label>
                    <select
                      id="edit-nationalite"
                      value={draft.nationalite}
                      onChange={(e) => setDraft((d) => ({ ...d, nationalite: e.target.value }))}
                      className="w-full rounded-md border border-[var(--edu-border)] bg-white dark:bg-[#1D1D1F] px-3 py-2 text-sm text-[var(--edu-text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--edu-blue)] focus:border-[var(--edu-blue)]"
                    >
                      {NATIONALITES.map((n) => (
                        <option key={n.valeur} value={n.valeur}>{n.label}</option>
                      ))}
                    </select>
                  </div>
                  {draftTunisien ? (
                    <div className="space-y-2">
                      <Label htmlFor="edit-cin">CIN <span className="text-[var(--edu-danger)]">*</span></Label>
                      <Input id="edit-cin" inputMode="numeric" maxLength={8} placeholder="12345678" value={draft.cin} onChange={(e) => setDraft((d) => ({ ...d, cin: e.target.value }))} />
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <Label htmlFor="edit-passeport">Passeport <span className="text-[var(--edu-danger)]">*</span></Label>
                      <Input id="edit-passeport" maxLength={20} placeholder="AB123456" value={draft.numero_passeport} onChange={(e) => setDraft((d) => ({ ...d, numero_passeport: e.target.value }))} />
                    </div>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-telephone">Téléphone</Label>
                  <Input
                    id="edit-telephone"
                    type="tel"
                    placeholder={`${getIndicatifPlaceholder(draft.nationalite)} XX XXX XXX`}
                    value={draft.telephone}
                    onChange={(e) => setDraft((d) => ({ ...d, telephone: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Adresse</Label>
                  <AdresseFields idPrefix="edit-adresse" value={draft.adresse} onChange={(adresse) => setDraft((d) => ({ ...d, adresse }))} />
                </div>
              </div>
            ) : (
              <FieldList fields={identiteFields} />
            )}
          </SectionCard>

          <SectionCard title="Parcours académique" subtitle={`${(candidat?.parcours_academique ?? []).length} entrée(s) — mis à jour à la soumission d'une candidature`}>
            {loading ? <Skeleton rows={2} /> : (candidat?.parcours_academique ?? []).length === 0 ? (
              <div className="px-6 py-6 text-center">
                <GraduationCap className="w-8 h-8 text-[var(--edu-text-tertiary)] mx-auto mb-2" />
                <p className="text-sm text-[var(--edu-text-secondary)]">Aucun diplôme renseigné. Vous pourrez les ajouter lors de votre prochaine candidature.</p>
              </div>
            ) : (
              <ul className="divide-y divide-[var(--edu-divider)]">
                {(candidat?.parcours_academique ?? []).map((p, i) => (
                  <li key={i} className="px-6 py-4 flex items-center gap-4">
                    <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: 'var(--edu-blue)15' }}>
                      <GraduationCap className="w-4 h-4" style={{ color: 'var(--edu-blue)' }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-[var(--edu-text-primary)]">
                        {p.diplome}{p.mention && <span className="text-xs text-[var(--edu-text-secondary)] ml-2">({p.mention})</span>}
                      </p>
                      <p className="text-xs text-[var(--edu-text-secondary)] mt-0.5">{p.etablissement} · {p.annee}</p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </SectionCard>
        </motion.div>
      </main>
    </div>
  );
}

function SectionCard({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <section className="glass-card rounded-2xl overflow-hidden">
      <div className="px-6 py-5 border-b border-[var(--edu-divider)]">
        <h2 className="text-base font-semibold text-[var(--edu-text-primary)]">{title}</h2>
        {subtitle && <p className="text-xs text-[var(--edu-text-secondary)] mt-0.5">{subtitle}</p>}
      </div>
      {children}
    </section>
  );
}

function FieldList({ fields }: { fields: FieldRow[] }) {
  return (
    <div className="divide-y divide-[var(--edu-divider)]">
      {fields.map(({ label, value, Icon, manquant }) => (
        <div key={label} className="flex items-center gap-4 px-6 py-4">
          <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: manquant ? 'var(--edu-warning)15' : 'var(--edu-blue)15' }}>
            <Icon className="w-4 h-4" style={{ color: manquant ? 'var(--edu-warning)' : 'var(--edu-blue)' }} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs text-[var(--edu-text-tertiary)] uppercase tracking-wide font-semibold">{label}</p>
            <p className={`text-sm mt-0.5 truncate ${manquant ? 'text-[var(--edu-warning)] italic font-medium' : 'text-[var(--edu-text-primary)] font-medium'}`}>
              {value || 'Non renseigné'}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}

function Skeleton({ rows }: { rows: number }) {
  return (
    <div className="px-6 py-4 space-y-3">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center gap-4 animate-pulse">
          <div className="w-9 h-9 bg-[var(--edu-surface)] rounded-lg" />
          <div className="flex-1 space-y-1.5">
            <div className="h-3 bg-[var(--edu-surface)] rounded w-1/4" />
            <div className="h-4 bg-[var(--edu-surface)] rounded w-1/2" />
          </div>
        </div>
      ))}
    </div>
  );
}
