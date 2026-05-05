import React, { useEffect, useRef, useState } from 'react';
import { motion } from 'motion/react';
import { toast } from 'sonner';
import {
  Building2, Globe, Phone, Mail, MapPin, Award, Pencil, X, Check, Plus, Loader2, Camera,
} from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { useAuth } from '@/context/AuthContext';
import { institutService } from '@/services/api';
import { API_URL } from '@/config';
import type { Institut, Adresse, Contact, CreateInstitutData } from '@/types/api';

// Base URL pour afficher les assets uploadés (ex: /uploads/logo.jpg → http://localhost:5000/uploads/logo.jpg)
const BASE_URL = API_URL.replace(/\/api\/?$/, '');

function buildSrc(path?: string | null): string | null {
  if (!path) return null;
  if (path.startsWith('http')) return path;
  return `${BASE_URL}${path}`;
}

interface Draft {
  nom: string;
  sigle: string;
  description: string;
  site_web: string;
  contact: Contact;
  adresse: Adresse;
  accreditations: string[];
}

function buildDraft(i: Institut | null): Draft {
  return {
    nom: i?.nom ?? '',
    sigle: i?.sigle ?? '',
    description: i?.description ?? '',
    site_web: i?.site_web ?? '',
    contact: { telephone: i?.contact?.telephone ?? '', email: i?.contact?.email ?? '', fax: i?.contact?.fax ?? '' },
    adresse: { rue: i?.adresse?.rue ?? '', ville: i?.adresse?.ville ?? '', gouvernorat: i?.adresse?.gouvernorat ?? '', code_postal: i?.adresse?.code_postal ?? '', pays: i?.adresse?.pays ?? '' },
    accreditations: i?.accreditations ? [...i.accreditations] : [],
  };
}

export function InstitutionProfilSection() {
  const { user } = useAuth();
  const [institut, setInstitut] = useState<Institut | null>(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [draft, setDraft] = useState<Draft>(() => buildDraft(null));
  const [newAccred, setNewAccred] = useState('');

  // Fichiers image en attente d'upload
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [coverFile, setCoverFile] = useState<File | null>(null);
  // Prévisualisations locales (object URLs)
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [coverPreview, setCoverPreview] = useState<string | null>(null);

  const logoInputRef = useRef<HTMLInputElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!user?.institut_id) { setLoading(false); return; }
    let cancelled = false;
    setLoading(true);
    institutService.getById(user.institut_id)
      .then(({ data }) => {
        if (cancelled) return;
        const payload = data as { institut?: Institut };
        const inst = payload.institut ?? null;
        setInstitut(inst);
        setDraft(buildDraft(inst));
      })
      .catch(() => { if (!cancelled) setInstitut(null); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [user?.institut_id]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleEdit = () => { setDraft(buildDraft(institut)); setIsEditing(true); };

  const handleCancel = () => {
    setIsEditing(false);
    setDraft(buildDraft(institut));
    setLogoFile(null);
    setCoverFile(null);
    setLogoPreview(null);
    setCoverPreview(null);
  };

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setLogoFile(file);
    setLogoPreview(URL.createObjectURL(file));
  };

  const handleCoverChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setCoverFile(file);
    setCoverPreview(URL.createObjectURL(file));
  };

  const handleSave = async () => {
    if (!user?.institut_id) return;
    setSaving(true);
    try {
      const formData = new FormData();
      if (draft.nom) formData.append('nom', draft.nom);
      if (draft.sigle) formData.append('sigle', draft.sigle);
      if (draft.description) formData.append('description', draft.description);
      if (draft.site_web) formData.append('site_web', draft.site_web);
      formData.append('contact', JSON.stringify(draft.contact));
      formData.append('adresse', JSON.stringify(draft.adresse));
      formData.append('accreditations', JSON.stringify(draft.accreditations));
      if (logoFile) formData.append('logo', logoFile);
      if (coverFile) formData.append('image_couverture', coverFile);

      await institutService.update(user.institut_id, formData);

      const res = await institutService.getById(user.institut_id);
      const updated = (res.data as { institut?: Institut }).institut ?? null;
      setInstitut(updated);
      setDraft(buildDraft(updated));
      setLogoFile(null);
      setCoverFile(null);
      setLogoPreview(null);
      setCoverPreview(null);
      setIsEditing(false);
      toast.success('Profil mis à jour avec succès');
    } catch { toast.error('Erreur lors de la mise à jour'); }
    finally { setSaving(false); }
  };

  const logoSrc = logoPreview || buildSrc(institut?.logo);
  const coverSrc = coverPreview || buildSrc(institut?.image_couverture);
  const initiale = institut?.sigle?.[0] || institut?.nom?.[0] || '?';

  const inputCls = 'w-full rounded-md border border-[var(--edu-border)] bg-white dark:bg-[#1D1D1F] px-3 py-2 text-sm text-[var(--edu-text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--edu-blue)] focus:border-[var(--edu-blue)]';

  return (
    <div>
      {/* Page header */}
      <div className="bg-white dark:bg-[#1D1D1F] border-b border-[var(--edu-border)] px-8 py-6 flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-[var(--edu-text-tertiary)] mb-1">Établissement</p>
          <h1 className="text-3xl font-bold text-[var(--edu-text-primary)]">Profil établissement</h1>
          <p className="text-sm text-[var(--edu-text-secondary)] mt-1">Gérez les informations de votre établissement</p>
        </div>
        {!loading && !isEditing && (
          <Button onClick={handleEdit} variant="outline" className="flex items-center gap-2 rounded-full">
            <Pencil className="w-4 h-4" /> Modifier
          </Button>
        )}
        {isEditing && (
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={handleCancel} disabled={saving} className="rounded-full flex items-center gap-2">
              <X className="w-4 h-4" /> Annuler
            </Button>
            <Button onClick={handleSave} disabled={saving} className="rounded-full bg-[var(--edu-blue)] hover:bg-[var(--edu-blue-hover)] text-white flex items-center gap-2 disabled:opacity-50">
              {saving ? <><Loader2 className="w-4 h-4 animate-spin" /> Enregistrement…</> : <><Check className="w-4 h-4" /> Enregistrer</>}
            </Button>
          </div>
        )}
      </div>

      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }} className="p-8 max-w-3xl space-y-6">
        {loading ? (
          <div className="glass-card rounded-2xl p-8 space-y-4 animate-pulse">
            <div className="h-48 bg-[var(--edu-surface)] rounded-xl" />
            <div className="flex items-center gap-4">
              <div className="w-20 h-20 rounded-full bg-[var(--edu-surface)]" />
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-[var(--edu-surface)] rounded w-1/3" />
                <div className="h-3 bg-[var(--edu-surface)] rounded w-1/4" />
              </div>
            </div>
          </div>
        ) : (
          <>
            {/* ── Hero : Cover + Logo ─────────────────────────────────── */}
            <section className="glass-card rounded-2xl overflow-visible">
              {/* Cover image */}
              <div
                className="h-48 rounded-t-2xl relative overflow-hidden"
                style={
                  coverSrc
                    ? { backgroundImage: `url(${coverSrc})`, backgroundSize: 'cover', backgroundPosition: 'center' }
                    : { background: 'linear-gradient(135deg, var(--edu-blue) 0%, #0044aa 100%)' }
                }
              >
                {isEditing && (
                  <label className="absolute inset-0 flex flex-col items-center justify-center cursor-pointer hover:bg-black/20 transition-colors group">
                    <div className="flex flex-col items-center gap-2 text-white opacity-0 group-hover:opacity-100 transition-opacity">
                      <Camera className="w-7 h-7 drop-shadow" />
                      <span className="text-sm font-medium drop-shadow">Changer la couverture</span>
                    </div>
                    <input
                      ref={coverInputRef}
                      type="file"
                      accept="image/jpeg,image/jpg,image/png"
                      className="hidden"
                      onChange={handleCoverChange}
                    />
                  </label>
                )}
              </div>

              {/* Logo + nom — logo chevauche la cover, texte en dessous */}
              <div className="px-6 pb-5">
                {/* Logo */}
                <div className="relative -mt-10 mb-3 w-fit">
                  <div className="w-20 h-20 rounded-full border-4 border-white dark:border-[#1D1D1F] shadow-md overflow-hidden bg-[var(--edu-blue)] flex items-center justify-center">
                    {logoSrc ? (
                      <img src={logoSrc} alt="Logo" className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-white text-2xl font-bold select-none">{initiale.toUpperCase()}</span>
                    )}
                  </div>
                  {isEditing && (
                    <label className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-[var(--edu-blue)] flex items-center justify-center cursor-pointer shadow-sm hover:bg-[var(--edu-blue-hover)] transition-colors">
                      <Camera className="w-3.5 h-3.5 text-white" />
                      <input
                        ref={logoInputRef}
                        type="file"
                        accept="image/jpeg,image/jpg,image/png"
                        className="hidden"
                        onChange={handleLogoChange}
                      />
                    </label>
                  )}
                </div>
                {/* Nom et sigle sous le logo */}
                <div>
                  <h3 className="text-lg font-bold text-[var(--edu-text-primary)]">
                    {institut?.nom || 'Nom non renseigné'}
                  </h3>
                  {institut?.sigle && (
                    <p className="text-sm text-[var(--edu-text-secondary)]">{institut.sigle}</p>
                  )}
                </div>
              </div>
            </section>

            {/* ── Identité ─────────────────────────────────────────────── */}
            <section className="glass-card rounded-2xl overflow-hidden">
              <div className="px-6 py-5 border-b border-[var(--edu-divider)]">
                <h2 className="text-base font-semibold text-[var(--edu-text-primary)]">Identité</h2>
                <p className="text-xs text-[var(--edu-text-secondary)] mt-0.5">Nom, sigle et description publique</p>
              </div>
              {isEditing ? (
                <div className="px-6 py-5 space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Nom de l'établissement</Label>
                      <Input value={draft.nom} onChange={(e) => setDraft((d) => ({ ...d, nom: e.target.value }))} placeholder="Ex : École Supérieure de Technologie" />
                    </div>
                    <div className="space-y-2">
                      <Label>Sigle</Label>
                      <Input value={draft.sigle} onChange={(e) => setDraft((d) => ({ ...d, sigle: e.target.value }))} placeholder="Ex : EST" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Site web</Label>
                    <Input value={draft.site_web} onChange={(e) => setDraft((d) => ({ ...d, site_web: e.target.value }))} placeholder="https://www.exemple.tn" />
                  </div>
                  <div className="space-y-2">
                    <Label>Description</Label>
                    <textarea
                      value={draft.description}
                      onChange={(e) => setDraft((d) => ({ ...d, description: e.target.value }))}
                      rows={4}
                      placeholder="Présentez votre établissement…"
                      className="w-full rounded-md border border-[var(--edu-border)] bg-white dark:bg-[#1D1D1F] px-3 py-2 text-sm text-[var(--edu-text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--edu-blue)] focus:border-[var(--edu-blue)]"
                    />
                  </div>
                </div>
              ) : (
                <div className="divide-y divide-[var(--edu-divider)]">
                  <InfoRow Icon={Building2} label="Nom" value={institut?.nom} />
                  <InfoRow Icon={Building2} label="Sigle" value={institut?.sigle} />
                  <InfoRow Icon={Globe} label="Site web" value={institut?.site_web} />
                  {institut?.description && (
                    <div className="flex items-start gap-4 px-6 py-4">
                      <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5" style={{ backgroundColor: 'var(--edu-blue)15' }}>
                        <Building2 className="w-4 h-4" style={{ color: 'var(--edu-blue)' }} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-[var(--edu-text-tertiary)] uppercase tracking-wide font-semibold">Description</p>
                        <p className="text-sm mt-0.5 text-[var(--edu-text-primary)] leading-relaxed">{institut.description}</p>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </section>

            {/* ── Contact ──────────────────────────────────────────────── */}
            <section className="glass-card rounded-2xl overflow-hidden">
              <div className="px-6 py-5 border-b border-[var(--edu-divider)]">
                <h2 className="text-base font-semibold text-[var(--edu-text-primary)]">Contact</h2>
              </div>
              {isEditing ? (
                <div className="px-6 py-5 space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Téléphone</Label>
                      <Input value={draft.contact.telephone ?? ''} onChange={(e) => setDraft((d) => ({ ...d, contact: { ...d.contact, telephone: e.target.value } }))} placeholder="+216 XX XXX XXX" />
                    </div>
                    <div className="space-y-2">
                      <Label>Email de contact</Label>
                      <Input type="email" value={draft.contact.email ?? ''} onChange={(e) => setDraft((d) => ({ ...d, contact: { ...d.contact, email: e.target.value } }))} placeholder="contact@etablissement.tn" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Fax</Label>
                    <Input value={draft.contact.fax ?? ''} onChange={(e) => setDraft((d) => ({ ...d, contact: { ...d.contact, fax: e.target.value } }))} placeholder="+216 XX XXX XXX" />
                  </div>
                </div>
              ) : (
                <div className="divide-y divide-[var(--edu-divider)]">
                  <InfoRow Icon={Phone} label="Téléphone" value={institut?.contact?.telephone} />
                  <InfoRow Icon={Mail} label="Email" value={institut?.contact?.email} />
                  <InfoRow Icon={Phone} label="Fax" value={institut?.contact?.fax} />
                </div>
              )}
            </section>

            {/* ── Adresse ──────────────────────────────────────────────── */}
            <section className="glass-card rounded-2xl overflow-hidden">
              <div className="px-6 py-5 border-b border-[var(--edu-divider)]">
                <h2 className="text-base font-semibold text-[var(--edu-text-primary)]">Adresse</h2>
              </div>
              {isEditing ? (
                <div className="px-6 py-5 space-y-4">
                  <div className="space-y-2">
                    <Label>Rue</Label>
                    <Input value={draft.adresse.rue ?? ''} onChange={(e) => setDraft((d) => ({ ...d, adresse: { ...d.adresse, rue: e.target.value } }))} placeholder="Ex : 12, Rue des Ingénieurs" />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label>Ville</Label>
                      <Input value={draft.adresse.ville ?? ''} onChange={(e) => setDraft((d) => ({ ...d, adresse: { ...d.adresse, ville: e.target.value } }))} placeholder="Tunis" />
                    </div>
                    <div className="space-y-2">
                      <Label>Gouvernorat</Label>
                      <Input value={draft.adresse.gouvernorat ?? ''} onChange={(e) => setDraft((d) => ({ ...d, adresse: { ...d.adresse, gouvernorat: e.target.value } }))} placeholder="Tunis" />
                    </div>
                    <div className="space-y-2">
                      <Label>Code postal</Label>
                      <Input value={draft.adresse.code_postal ?? ''} onChange={(e) => setDraft((d) => ({ ...d, adresse: { ...d.adresse, code_postal: e.target.value } }))} placeholder="1000" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Pays</Label>
                    <input value={draft.adresse.pays ?? ''} onChange={(e) => setDraft((d) => ({ ...d, adresse: { ...d.adresse, pays: e.target.value } }))} placeholder="Tunisie" className={inputCls} />
                  </div>
                </div>
              ) : (
                <div className="px-6 py-4">
                  {[institut?.adresse?.rue, institut?.adresse?.code_postal, institut?.adresse?.ville, institut?.adresse?.gouvernorat, institut?.adresse?.pays].filter(Boolean).length > 0 ? (
                    <div className="flex items-start gap-4">
                      <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5" style={{ backgroundColor: 'var(--edu-blue)15' }}>
                        <MapPin className="w-4 h-4" style={{ color: 'var(--edu-blue)' }} />
                      </div>
                      <p className="text-sm text-[var(--edu-text-primary)] mt-1.5 leading-relaxed">
                        {[institut?.adresse?.rue, institut?.adresse?.code_postal, institut?.adresse?.ville, institut?.adresse?.gouvernorat, institut?.adresse?.pays].filter(Boolean).join(', ')}
                      </p>
                    </div>
                  ) : (
                    <p className="text-sm text-[var(--edu-text-tertiary)] italic">Adresse non renseignée</p>
                  )}
                </div>
              )}
            </section>

            {/* ── Accréditations ───────────────────────────────────────── */}
            <section className="glass-card rounded-2xl overflow-hidden">
              <div className="px-6 py-5 border-b border-[var(--edu-divider)]">
                <h2 className="text-base font-semibold text-[var(--edu-text-primary)]">Accréditations</h2>
                <p className="text-xs text-[var(--edu-text-secondary)] mt-0.5">Certifications et labels de qualité</p>
              </div>
              {isEditing ? (
                <div className="px-6 py-5 space-y-3">
                  <div className="flex flex-wrap gap-2">
                    {draft.accreditations.map((a, i) => (
                      <span key={i} className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-[var(--edu-blue)]/10 text-[var(--edu-blue)] border border-[var(--edu-blue)]/20">
                        {a}
                        <button type="button" onClick={() => setDraft((d) => ({ ...d, accreditations: d.accreditations.filter((_, j) => j !== i) }))} className="hover:opacity-70">
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <Input
                      value={newAccred}
                      onChange={(e) => setNewAccred(e.target.value)}
                      placeholder="Ex : CTI, ABET, ENAEE"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && newAccred.trim()) {
                          e.preventDefault();
                          setDraft((d) => ({ ...d, accreditations: [...d.accreditations, newAccred.trim()] }));
                          setNewAccred('');
                        }
                      }}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      disabled={!newAccred.trim()}
                      onClick={() => {
                        if (newAccred.trim()) {
                          setDraft((d) => ({ ...d, accreditations: [...d.accreditations, newAccred.trim()] }));
                          setNewAccred('');
                        }
                      }}
                    >
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="px-6 py-4">
                  {(institut?.accreditations ?? []).length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {(institut?.accreditations ?? []).map((a) => (
                        <span key={a} className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-[var(--edu-blue)]/10 text-[var(--edu-blue)] border border-[var(--edu-blue)]/20">
                          <Award className="w-3 h-3" /> {a}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-[var(--edu-text-tertiary)] italic">Aucune accréditation renseignée</p>
                  )}
                </div>
              )}
            </section>
          </>
        )}
      </motion.div>
    </div>
  );
}

function InfoRow({ Icon, label, value }: { Icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>; label: string; value?: string | null }) {
  return (
    <div className="flex items-center gap-4 px-6 py-4">
      <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: 'var(--edu-blue)15' }}>
        <Icon className="w-4 h-4" style={{ color: 'var(--edu-blue)' }} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs text-[var(--edu-text-tertiary)] uppercase tracking-wide font-semibold">{label}</p>
        <p className={`text-sm mt-0.5 truncate font-medium ${value ? 'text-[var(--edu-text-primary)]' : 'italic text-[var(--edu-text-tertiary)]'}`}>
          {value || 'Non renseigné'}
        </p>
      </div>
    </div>
  );
}
