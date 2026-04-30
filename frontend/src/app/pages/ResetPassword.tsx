import { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router';
import { Eye, EyeOff, Check, X, AlertCircle, Loader2, KeyRound } from 'lucide-react';
import logoedubridge from '@/assets/logo/logoedubridge.png';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { toast } from 'sonner';
import { authService } from '@/services/api';

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

type PasswordFormData = z.infer<typeof passwordSchema>;

type TokenState =
  | { status: 'loading' }
  | { status: 'valid'; email: string }
  | { status: 'invalid'; code: string; message: string };

export function ResetPassword() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') ?? '';

  const [tokenState, setTokenState] = useState<TokenState>({ status: 'loading' });
  const [submitting, setSubmitting] = useState(false);
  const [showPwd, setShowPwd] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  useEffect(() => {
    if (!token) {
      setTokenState({
        status: 'invalid',
        code: 'TOKEN_MISSING',
        message: 'Lien de réinitialisation manquant.',
      });
      return;
    }

    authService
      .validerResetToken(token)
      .then(({ data }) => {
        setTokenState({ status: 'valid', email: data.email });
      })
      .catch((err) => {
        const code: string = err.response?.data?.code ?? 'TOKEN_INVALID';
        const message: string =
          err.response?.data?.message ?? 'Lien de réinitialisation invalide.';
        setTokenState({ status: 'invalid', code, message });
      });
  }, [token]);

  const form = useForm<PasswordFormData>({
    resolver: zodResolver(passwordSchema),
    defaultValues: { password: '', confirmPassword: '' },
  });

  const watchedPwd = form.watch('password') ?? '';

  const passwordChecks = [
    { label: '8 caractères minimum', met: watchedPwd.length >= 8 },
    { label: 'Une majuscule', met: /[A-Z]/.test(watchedPwd) },
    { label: 'Un chiffre', met: /[0-9]/.test(watchedPwd) },
    { label: 'Un caractère spécial (!@#$%^&*)', met: /[!@#$%^&*]/.test(watchedPwd) },
  ];

  const onSubmit = async (data: PasswordFormData) => {
    setSubmitting(true);
    try {
      await authService.reinitialiserPassword(token, data.password);
      toast.success('Mot de passe réinitialisé. Vous pouvez maintenant vous connecter.');
      navigate('/login');
    } catch (err: unknown) {
      const apiErr = err as { response?: { data?: { message?: string; code?: string } } };
      const code = apiErr.response?.data?.code;
      const message = apiErr.response?.data?.message ?? 'Erreur lors de la réinitialisation.';

      if (code === 'TOKEN_EXPIRED' || code === 'TOKEN_INVALID') {
        setTokenState({ status: 'invalid', code, message });
      } else {
        toast.error(message);
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (tokenState.status === 'loading') {
    return (
      <div className="min-h-screen dotted-bg flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-10 h-10 text-[var(--edu-blue)] animate-spin" />
          <p className="text-[var(--edu-text-secondary)]">Validation du lien…</p>
        </div>
      </div>
    );
  }

  if (tokenState.status === 'invalid') {
    const isExpired = tokenState.code === 'TOKEN_EXPIRED';

    return (
      <div className="min-h-screen dotted-bg flex items-center justify-center p-6">
        <div className="w-full max-w-md">
          <Link to="/" className="flex items-center justify-center mb-8">
            <img
              src={logoedubridge}
              alt="EduBridge"
              className="h-14 w-auto dark:bg-white dark:rounded-lg dark:p-1.5"
            />
          </Link>
          <div className="glass-card rounded-3xl p-8 shadow-2xl text-center">
            <div className="w-16 h-16 rounded-full bg-[var(--edu-danger)]/10 flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="w-8 h-8 text-[var(--edu-danger)]" />
            </div>
            <h1 className="text-2xl font-bold text-[var(--edu-text-primary)] mb-3">
              {isExpired ? 'Lien expiré' : 'Lien invalide'}
            </h1>
            <p className="text-[var(--edu-text-secondary)] mb-6">{tokenState.message}</p>
            <Button
              onClick={() => navigate('/login')}
              className="rounded-full bg-[var(--edu-blue)] hover:bg-[var(--edu-blue-hover)] text-white"
            >
              Retour à la connexion
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const { email } = tokenState;

  return (
    <div className="min-h-screen dotted-bg flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        <Link to="/" className="flex items-center justify-center mb-8">
          <img
            src={logoedubridge}
            alt="EduBridge"
            className="h-14 w-auto dark:bg-white dark:rounded-lg dark:p-1.5"
          />
        </Link>

        <div className="glass-card rounded-3xl p-8 shadow-2xl">
          <div className="flex items-center gap-3 p-3 bg-[var(--edu-surface)] rounded-xl mb-6">
            <KeyRound className="w-5 h-5 text-[var(--edu-blue)] shrink-0" />
            <div>
              <p className="text-xs text-[var(--edu-text-tertiary)]">Réinitialisation pour</p>
              <p className="text-sm font-medium text-[var(--edu-text-primary)]">{email}</p>
            </div>
          </div>

          <div className="text-center mb-6">
            <h1 className="text-2xl font-bold text-[var(--edu-text-primary)] mb-2">
              Nouveau mot de passe
            </h1>
            <p className="text-sm text-[var(--edu-text-secondary)]">
              Choisissez un mot de passe sécurisé pour votre compte
            </p>
          </div>

          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
            <div>
              <Label htmlFor="password">Mot de passe *</Label>
              <div className="relative mt-1">
                <Input
                  id="password"
                  type={showPwd ? 'text' : 'password'}
                  placeholder="Créez un mot de passe fort"
                  {...form.register('password')}
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
              {form.formState.errors.password && (
                <p className="text-xs text-[var(--edu-danger)] mt-1">
                  {form.formState.errors.password.message}
                </p>
              )}
            </div>

            <div>
              <Label htmlFor="confirmPassword">Confirmer le mot de passe *</Label>
              <div className="relative mt-1">
                <Input
                  id="confirmPassword"
                  type={showConfirm ? 'text' : 'password'}
                  placeholder="Répétez le mot de passe"
                  {...form.register('confirmPassword')}
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
              {form.formState.errors.confirmPassword && (
                <p className="text-xs text-[var(--edu-danger)] mt-1">
                  {form.formState.errors.confirmPassword.message}
                </p>
              )}
            </div>

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
                      <span
                        className={`text-sm ${
                          check.met
                            ? 'text-[var(--edu-success)]'
                            : 'text-[var(--edu-text-secondary)]'
                        }`}
                      >
                        {check.label}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <Button
              type="submit"
              disabled={submitting}
              className="w-full rounded-full bg-[var(--edu-blue)] hover:bg-[var(--edu-blue-hover)] text-white h-12 font-medium disabled:opacity-60"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Réinitialisation…
                </>
              ) : (
                'Réinitialiser le mot de passe'
              )}
            </Button>
          </form>

          <p className="text-center text-sm text-[var(--edu-text-secondary)] mt-6">
            <Link to="/login" className="text-[var(--edu-blue)] hover:underline font-medium">
              ← Retour à la connexion
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
