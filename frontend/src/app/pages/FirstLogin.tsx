import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router';
import { Eye, EyeOff, Check, X, Building2, AlertCircle, Loader2 } from 'lucide-react';
import logoedubridge from '@/assets/logo/logoedubridge.png';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { toast } from 'sonner';
import { useAuth } from '@/context/AuthContext';
import { authService } from '@/services/api';

// ── Schémas Zod ──────────────────────────────────────────────────────────

const passwordSchema = z
  .object({
    password: z
      .string()
      .min(8, '8 caractères minimum')
      .regex(/[A-Z]/, 'Une majuscule requise')
      .regex(/[0-9]/, 'Un chiffre requis')
      .regex(/[!@#$%^&*]/, 'Un caractère spécial requis (!@#$%^&*)'),
    confirmPassword: z.string(),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: 'Les mots de passe ne correspondent pas',
    path: ['confirmPassword'],
  });

const profileSchema = z.object({
  nom: z.string().min(2, 'Nom de l\'établissement requis (min. 2 caractères)'),
  telephone: z.string().optional(),
  description: z.string().optional(),
});

type PasswordFormData = z.infer<typeof passwordSchema>;
type ProfileFormData = z.infer<typeof profileSchema>;

// ── État de validation du token ──────────────────────────────────────────

type TokenState =
  | { status: 'loading' }
  | { status: 'valid'; email: string; nom: string | null }
  | { status: 'invalid'; code: string; message: string };

// ── Composant principal ───────────────────────────────────────────────────

export function FirstLogin() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { updateUser, login } = useAuth();
  const token = searchParams.get('token') ?? '';

  const [tokenState, setTokenState] = useState<TokenState>({ status: 'loading' });
  const [step, setStep] = useState<1 | 2>(1);
  const [passwordData, setPasswordData] = useState<PasswordFormData | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Visibilité mots de passe
  const [showPwd, setShowPwd] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  // ── Validation du token au montage ────────────────────────────────────
  useEffect(() => {
    if (!token) {
      setTokenState({ status: 'invalid', code: 'TOKEN_MISSING', message: 'Lien d\'invitation manquant.' });
      return;
    }

    authService
      .validerTokenPremierLogin(token)
      .then(({ data }) => {
        setTokenState({ status: 'valid', email: data.email, nom: data.nom });
      })
      .catch((err) => {
        const code: string = err.response?.data?.code ?? 'TOKEN_INVALID';
        const message: string = err.response?.data?.message ?? 'Lien d\'invitation invalide.';
        setTokenState({ status: 'invalid', code, message });
      });
  }, [token]);

  // ── Formulaire étape 1 : mot de passe ────────────────────────────────
  const pwdForm = useForm<PasswordFormData>({
    resolver: zodResolver(passwordSchema),
    defaultValues: { password: '', confirmPassword: '' },
  });
  const watchedPwd = pwdForm.watch('password') ?? '';

  const passwordChecks = [
    { label: '8 caractères minimum', met: watchedPwd.length >= 8 },
    { label: 'Une majuscule', met: /[A-Z]/.test(watchedPwd) },
    { label: 'Un chiffre', met: /[0-9]/.test(watchedPwd) },
    { label: 'Un caractère spécial (!@#$%^&*)', met: /[!@#$%^&*]/.test(watchedPwd) },
  ];

  const onPasswordSubmit = (data: PasswordFormData) => {
    setPasswordData(data);
    setStep(2);
  };

  // ── Formulaire étape 2 : profil minimal ──────────────────────────────
  const profileForm = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      nom: tokenState.status === 'valid' ? (tokenState.nom ?? '') : '',
      telephone: '',
      description: '',
    },
  });

  // Pré-remplir le nom si disponible après chargement du token
  useEffect(() => {
    if (tokenState.status === 'valid' && tokenState.nom) {
      profileForm.setValue('nom', tokenState.nom);
    }
  }, [tokenState, profileForm]);

  const onProfileSubmit = async (data: ProfileFormData) => {
    if (!passwordData) return;
    setSubmitting(true);
    try {
      const { data: result } = await authService.terminerPremierLogin({
        token,
        password: passwordData.password,
        nom: data.nom,
        telephone: data.telephone || undefined,
        description: data.description || undefined,
      });

      // Persister la session reçue depuis le backend
      localStorage.setItem('auth_token', result.token);
      localStorage.setItem('auth_user', JSON.stringify({
        id: result.utilisateur.id,
        email: result.utilisateur.email,
        role: result.utilisateur.role,
        first_login_completed: true,
        nom: result.profil?.nom,
        institut_id: result.profil?.id,
        validation_status: result.profil?.validation_status,
      }));

      toast.success('Compte activé ! Bienvenue sur EduBridge.');
      navigate('/dashboard/institution');
    } catch (err: unknown) {
      const apiErr = err as { response?: { data?: { message?: string } } };
      toast.error(apiErr.response?.data?.message ?? 'Erreur lors de l\'activation du compte.');
    } finally {
      setSubmitting(false);
    }
  };

  // ── Rendu : état de chargement ────────────────────────────────────────
  if (tokenState.status === 'loading') {
    return (
      <div className="min-h-screen dotted-bg flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-10 h-10 text-[var(--edu-blue)] animate-spin" />
          <p className="text-[var(--edu-text-secondary)]">Validation du lien d'invitation…</p>
        </div>
      </div>
    );
  }

  // ── Rendu : token invalide / expiré / utilisé ─────────────────────────
  if (tokenState.status === 'invalid') {
    const isExpired = tokenState.code === 'TOKEN_EXPIRED';
    const isUsed    = tokenState.code === 'TOKEN_USED';

    return (
      <div className="min-h-screen dotted-bg flex items-center justify-center p-6">
        <div className="w-full max-w-md">
          <div className="flex items-center justify-center mb-8">
            <img src={logoedubridge} alt="EduBridge" className="h-14 w-auto dark:bg-white dark:rounded-lg dark:p-1.5" />
          </div>
          <div className="glass-card rounded-3xl p-8 shadow-2xl text-center">
            <div className="w-16 h-16 rounded-full bg-[var(--edu-danger)]/10 flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="w-8 h-8 text-[var(--edu-danger)]" />
            </div>
            <h1 className="text-2xl font-bold text-[var(--edu-text-primary)] mb-3">
              {isExpired ? 'Lien expiré' : isUsed ? 'Lien déjà utilisé' : 'Lien invalide'}
            </h1>
            <p className="text-[var(--edu-text-secondary)] mb-6">{tokenState.message}</p>
            {(isExpired || tokenState.code === 'TOKEN_INVALID') && (
              <p className="text-sm text-[var(--edu-text-tertiary)]">
                Contactez l'administrateur EduBridge pour recevoir un nouveau lien d'invitation.
              </p>
            )}
            {isUsed && (
              <Button
                onClick={() => navigate('/login')}
                className="mt-4 rounded-full bg-[var(--edu-blue)] hover:bg-[var(--edu-blue-hover)] text-white"
              >
                Se connecter
              </Button>
            )}
          </div>
        </div>
      </div>
    );
  }

  // ── Données contextuelles ─────────────────────────────────────────────
  const { email, nom: nomInstitut } = tokenState;

  return (
    <div className="min-h-screen dotted-bg flex items-center justify-center p-6">
      <div className="w-full max-w-lg">
        {/* Logo */}
        <div className="flex items-center justify-center mb-8">
          <img src={logoedubridge} alt="EduBridge" className="h-14 w-auto dark:bg-white dark:rounded-lg dark:p-1.5" />
        </div>

        {/* Indicateur d'étapes */}
        <div className="flex items-center gap-3 mb-6 justify-center">
          {([1, 2] as const).map((s) => (
            <div key={s} className="flex items-center gap-3">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all ${
                step === s
                  ? 'bg-[var(--edu-blue)] text-white'
                  : step > s
                    ? 'bg-[var(--edu-success)] text-white'
                    : 'bg-[var(--edu-border)] text-[var(--edu-text-tertiary)]'
              }`}>
                {step > s ? <Check className="w-4 h-4" /> : s}
              </div>
              {s < 2 && <div className={`h-0.5 w-16 transition-all ${step > s ? 'bg-[var(--edu-success)]' : 'bg-[var(--edu-border)]'}`} />}
            </div>
          ))}
        </div>

        {/* Card */}
        <div className="glass-card rounded-3xl p-8 shadow-2xl">

          {/* Email de destination */}
          <div className="flex items-center gap-3 p-3 bg-[var(--edu-surface)] rounded-xl mb-6">
            <Building2 className="w-5 h-5 text-[var(--edu-blue)] shrink-0" />
            <div>
              <p className="text-xs text-[var(--edu-text-tertiary)]">Invitation pour</p>
              <p className="text-sm font-medium text-[var(--edu-text-primary)]">
                {nomInstitut ? `${nomInstitut} — ` : ''}{email}
              </p>
            </div>
          </div>

          {/* ── ÉTAPE 1 : Mot de passe ─────────────────────────────── */}
          {step === 1 && (
            <>
              <div className="text-center mb-6">
                <h1 className="text-2xl font-bold text-[var(--edu-text-primary)] mb-2">
                  Définir votre mot de passe
                </h1>
                <p className="text-sm text-[var(--edu-text-secondary)]">
                  Étape 1 sur 2 — Sécurisez votre accès
                </p>
              </div>

              <form onSubmit={pwdForm.handleSubmit(onPasswordSubmit)} className="space-y-5">
                <div>
                  <Label htmlFor="password">Mot de passe *</Label>
                  <div className="relative mt-1">
                    <Input
                      id="password"
                      type={showPwd ? 'text' : 'password'}
                      placeholder="Créez un mot de passe fort"
                      {...pwdForm.register('password')}
                      className="rounded-xl pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPwd(!showPwd)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--edu-text-tertiary)] hover:text-[var(--edu-text-primary)]"
                    >
                      {showPwd ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                  {pwdForm.formState.errors.password && (
                    <p className="text-xs text-[var(--edu-danger)] mt-1">{pwdForm.formState.errors.password.message}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="confirmPassword">Confirmer le mot de passe *</Label>
                  <div className="relative mt-1">
                    <Input
                      id="confirmPassword"
                      type={showConfirm ? 'text' : 'password'}
                      placeholder="Répétez le mot de passe"
                      {...pwdForm.register('confirmPassword')}
                      className="rounded-xl pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirm(!showConfirm)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--edu-text-tertiary)] hover:text-[var(--edu-text-primary)]"
                    >
                      {showConfirm ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                  {pwdForm.formState.errors.confirmPassword && (
                    <p className="text-xs text-[var(--edu-danger)] mt-1">{pwdForm.formState.errors.confirmPassword.message}</p>
                  )}
                </div>

                {/* Checklist critères */}
                {watchedPwd && (
                  <div className="bg-[var(--edu-surface)] rounded-xl p-4">
                    <p className="text-xs font-semibold text-[var(--edu-text-secondary)] mb-3 uppercase tracking-wide">
                      Critères de sécurité
                    </p>
                    <div className="space-y-2">
                      {passwordChecks.map((check, i) => (
                        <div key={i} className="flex items-center gap-2">
                          {check.met ? (
                            <div className="w-5 h-5 rounded-full bg-[var(--edu-success)] flex items-center justify-center shrink-0">
                              <Check className="w-3 h-3 text-white" />
                            </div>
                          ) : (
                            <div className="w-5 h-5 rounded-full border-2 border-[var(--edu-border)] flex items-center justify-center shrink-0">
                              <X className="w-3 h-3 text-[var(--edu-text-tertiary)]" />
                            </div>
                          )}
                          <span className={`text-sm ${check.met ? 'text-[var(--edu-success)]' : 'text-[var(--edu-text-secondary)]'}`}>
                            {check.label}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <Button
                  type="submit"
                  className="w-full rounded-full bg-[var(--edu-blue)] hover:bg-[var(--edu-blue-hover)] text-white h-12 font-medium"
                >
                  Continuer →
                </Button>
              </form>
            </>
          )}

          {/* ── ÉTAPE 2 : Profil minimal ───────────────────────────── */}
          {step === 2 && (
            <>
              <div className="text-center mb-6">
                <h1 className="text-2xl font-bold text-[var(--edu-text-primary)] mb-2">
                  Profil de l'établissement
                </h1>
                <p className="text-sm text-[var(--edu-text-secondary)]">
                  Étape 2 sur 2 — Informations minimales requises
                </p>
              </div>

              <form onSubmit={profileForm.handleSubmit(onProfileSubmit)} className="space-y-5">
                <div>
                  <Label htmlFor="nom">Nom de l'établissement *</Label>
                  <Input
                    id="nom"
                    type="text"
                    placeholder="Ex : École Nationale d'Ingénieurs de Tunis"
                    {...profileForm.register('nom')}
                    className="rounded-xl mt-1"
                  />
                  {profileForm.formState.errors.nom && (
                    <p className="text-xs text-[var(--edu-danger)] mt-1">{profileForm.formState.errors.nom.message}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="telephone">Téléphone</Label>
                  <Input
                    id="telephone"
                    type="tel"
                    placeholder="Ex : +216 71 234 567"
                    {...profileForm.register('telephone')}
                    className="rounded-xl mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="description">Description courte</Label>
                  <textarea
                    id="description"
                    placeholder="Présentez brièvement votre établissement…"
                    {...profileForm.register('description')}
                    rows={3}
                    className="w-full mt-1 px-3 py-2 rounded-xl border border-[var(--edu-border)] bg-white dark:bg-[#1D1D1F] text-[var(--edu-text-primary)] text-sm resize-none focus:outline-none focus:ring-2 focus:ring-[var(--edu-blue)]"
                  />
                </div>

                <div className="flex items-start gap-3 p-3 bg-blue-50 dark:bg-blue-950/30 rounded-xl border border-blue-100 dark:border-blue-900">
                  <span className="text-blue-500 mt-0.5 shrink-0">ℹ️</span>
                  <p className="text-xs text-blue-700 dark:text-blue-300 leading-relaxed">
                    Après activation, vous pourrez compléter votre profil (logo, accréditations, adresse,
                    programmes) depuis votre tableau de bord. Un administrateur validera votre établissement
                    avant sa publication dans le catalogue.
                  </p>
                </div>

                <div className="flex gap-3">
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => setStep(1)}
                    className="flex-1 rounded-full h-12"
                  >
                    ← Retour
                  </Button>
                  <Button
                    type="submit"
                    disabled={submitting}
                    className="flex-1 rounded-full bg-[var(--edu-blue)] hover:bg-[var(--edu-blue-hover)] text-white h-12 font-medium disabled:opacity-60"
                  >
                    {submitting ? (
                      <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Activation…</>
                    ) : (
                      'Activer mon compte'
                    )}
                  </Button>
                </div>
              </form>
            </>
          )}
        </div>

        <p className="text-center text-xs text-[var(--edu-text-tertiary)] mt-6">
          EduBridge · Plateforme des instituts d'ingénieurs tunisiens
        </p>
      </div>
    </div>
  );
}
