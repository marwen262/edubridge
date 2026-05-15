import React from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router';
import { Eye, EyeOff, AlertTriangle, ShieldOff, Loader2, MailCheck } from 'lucide-react';
import logoEduBridge from '@/assets/logo/logoedubridge.png';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useTranslation } from 'react-i18next';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '../components/ui/dialog';
import { toast } from 'sonner';
import { useAuth } from '@/context/AuthContext';
import { authService } from '@/services/api';

const loginSchema = z.object({
  email: z.string().min(1, 'Email requis').email('Email invalide'),
  password: z.string().min(1, 'Mot de passe requis'),
});

type LoginFormData = z.infer<typeof loginSchema>;

const forgotSchema = z.object({
  email: z.string().min(1, 'Email requis').email('Email invalide'),
});

type ForgotFormData = z.infer<typeof forgotSchema>;

const roleToPath: Record<string, string> = {
  candidat: '/dashboard/candidate',
  institut: '/dashboard/institution',
  admin: '/dashboard/admin',
};

export function Login() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const redirectTo = searchParams.get('redirect');
  const { login } = useAuth();
  const [showPassword, setShowPassword] = React.useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  });

  const [loginError, setLoginError] = React.useState<{
    code?: string;
    message?: string;
    reason?: string;
  } | null>(null);

  const [forgotOpen, setForgotOpen] = React.useState(false);
  const [forgotSent, setForgotSent] = React.useState<string | null>(null);

  const forgotForm = useForm<ForgotFormData>({
    resolver: zodResolver(forgotSchema),
    defaultValues: { email: '' },
  });

  const onForgotSubmit = async (data: ForgotFormData) => {
    try {
      await authService.demanderResetPassword(data.email);
      setForgotSent(data.email);
    } catch (err: unknown) {
      const apiErr = err as { response?: { data?: { message?: string } } };
      toast.error(apiErr.response?.data?.message ?? 'Erreur lors de la demande.');
    }
  };

  const closeForgotDialog = () => {
    setForgotOpen(false);
    setTimeout(() => {
      setForgotSent(null);
      forgotForm.reset();
    }, 200);
  };

  const onSubmit = async (data: LoginFormData) => {
    setLoginError(null);
    try {
      await login(data.email, data.password);
      const stored = localStorage.getItem('auth_user');
      const savedUser = stored ? (JSON.parse(stored) as { role: string }) : null;
      const userRole = savedUser?.role;
      if (redirectTo && userRole === 'candidat') {
        navigate(redirectTo);
        return;
      }
      navigate(roleToPath[userRole ?? ''] ?? '/');
    } catch (err: unknown) {
      const axiosError = err as {
        response?: { data?: { message?: string; code?: string; reason?: string } };
      };
      const code = axiosError.response?.data?.code;
      const message = axiosError.response?.data?.message;
      const reason = axiosError.response?.data?.reason;
      if (code === 'FIRST_LOGIN_REQUIRED' || code === 'ACCOUNT_SUSPENDED') {
        setLoginError({ code, message, reason });
      } else {
        toast.error(message ?? t('auth.login.errors.invalidCredentials'));
      }
    }
  };

  return (
    <div className="min-h-screen dotted-bg flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        {/* Logo */}
        <Link to="/" className="flex items-center justify-center mb-8">
          <img src={logoEduBridge} alt="EduBridge" className="h-14 w-auto dark:bg-white dark:rounded-xl dark:px-3 dark:py-1.5" />
        </Link>

        {/* Card */}
        <div className="glass-card rounded-3xl p-8 shadow-2xl">
          <h1 className="text-3xl font-bold text-[var(--edu-text-primary)] mb-2 text-center">
            {t('auth.login.title')}
          </h1>
          <p className="text-[var(--edu-text-secondary)] text-center mb-8">
            {t('auth.login.subtitle')}
          </p>

          {/* First login banner */}
          {loginError?.code === 'FIRST_LOGIN_REQUIRED' && (
            <div className="mb-4 p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 flex gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-amber-800 dark:text-amber-200">{t('auth.login.firstLoginBanner.title')}</p>
                <p className="text-xs text-amber-700 dark:text-amber-300 mt-1">{t('auth.login.firstLoginBanner.message')}</p>
                <p className="text-xs text-amber-600 dark:text-amber-400 mt-2">{t('auth.login.firstLoginBanner.contact')}</p>
              </div>
            </div>
          )}

          {/* Suspended banner */}
          {loginError?.code === 'ACCOUNT_SUSPENDED' && (
            <div className="mb-4 p-4 rounded-2xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 flex gap-3">
              <ShieldOff className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-red-800 dark:text-red-200">{t('auth.login.suspendedBanner.title')}</p>
                <p className="text-xs text-red-700 dark:text-red-300 mt-1">{t('auth.login.suspendedBanner.message')}</p>
                {loginError.reason && (
                  <p className="text-xs text-red-600 dark:text-red-400 mt-1 italic">
                    {t('auth.login.suspendedBanner.reason')} {loginError.reason}
                  </p>
                )}
                <p className="text-xs text-red-500 dark:text-red-400 mt-2">{t('auth.login.suspendedBanner.contact')}</p>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <Label htmlFor="email">{t('auth.login.emailLabel')}</Label>
              <Input id="email" type="email" placeholder={t('auth.login.emailPlaceholder')} {...register('email')} className="rounded-xl mt-1" />
              {errors.email && <p className="text-xs text-[var(--edu-danger)] mt-1">{errors.email.message}</p>}
            </div>

            <div>
              <Label htmlFor="password">{t('auth.login.passwordLabel')}</Label>
              <div className="relative mt-1">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder={t('auth.login.passwordPlaceholder')}
                  {...register('password')}
                  className="rounded-xl pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--edu-text-tertiary)] hover:text-[var(--edu-text-primary)]"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              {errors.password && <p className="text-xs text-[var(--edu-danger)] mt-1">{errors.password.message}</p>}
            </div>

            <div className="flex items-center justify-end">
              <button
                type="button"
                onClick={() => setForgotOpen(true)}
                className="text-sm text-[var(--edu-blue)] hover:underline"
              >
                {t('auth.login.forgotPassword')}
              </button>
            </div>

            <Button
              type="submit"
              disabled={isSubmitting}
              className="w-full rounded-full bg-[var(--edu-blue)] hover:bg-[var(--edu-blue-hover)] text-white h-12 font-medium disabled:opacity-60"
            >
              {isSubmitting ? t('auth.login.submitting') : t('auth.login.submit')}
            </Button>
          </form>

          <p className="text-center text-sm text-[var(--edu-text-secondary)] mt-6">
            {t('auth.login.noAccount')}{' '}
            <Link to="/signup" className="text-[var(--edu-blue)] hover:underline font-medium">
              {t('auth.login.createAccount')}
            </Link>
          </p>
        </div>

        <div className="text-center mt-6">
          <Link to="/" className="text-sm text-[var(--edu-text-secondary)] hover:text-[var(--edu-blue)]">
            {t('auth.login.backHome')}
          </Link>
        </div>
      </div>

      {/* Forgot password dialog */}
      <Dialog open={forgotOpen} onOpenChange={(open) => (open ? setForgotOpen(true) : closeForgotDialog())}>
        <DialogContent className="sm:max-w-md rounded-3xl">
          {forgotSent ? (
            <>
              <DialogHeader>
                <div className="w-14 h-14 rounded-full bg-[var(--edu-success)]/10 flex items-center justify-center mx-auto mb-2">
                  <MailCheck className="w-7 h-7 text-[var(--edu-success)]" />
                </div>
                <DialogTitle className="text-center">{t('auth.login.forgotDialog.sentTitle')}</DialogTitle>
                <DialogDescription className="text-center">
                  {t('auth.login.forgotDialog.sentDescription')}{' '}
                  <span className="font-medium text-[var(--edu-text-primary)]">{forgotSent}</span>
                  {t('auth.login.forgotDialog.sentDescription2')}
                </DialogDescription>
              </DialogHeader>
              <p className="text-xs text-[var(--edu-text-tertiary)] text-center">{t('auth.login.forgotDialog.spamNote')}</p>
              <Button onClick={closeForgotDialog} className="w-full rounded-full bg-[var(--edu-blue)] hover:bg-[var(--edu-blue-hover)] text-white h-11">
                {t('auth.login.forgotDialog.close')}
              </Button>
            </>
          ) : (
            <>
              <DialogHeader>
                <DialogTitle>{t('auth.login.forgotDialog.title')}</DialogTitle>
                <DialogDescription>{t('auth.login.forgotDialog.description')}</DialogDescription>
              </DialogHeader>
              <form onSubmit={forgotForm.handleSubmit(onForgotSubmit)} className="space-y-4">
                <div>
                  <Label htmlFor="forgot-email">{t('auth.login.forgotDialog.emailLabel')}</Label>
                  <Input id="forgot-email" type="email" placeholder={t('auth.login.emailPlaceholder')} {...forgotForm.register('email')} className="rounded-xl mt-1" autoFocus />
                  {forgotForm.formState.errors.email && (
                    <p className="text-xs text-[var(--edu-danger)] mt-1">{forgotForm.formState.errors.email.message}</p>
                  )}
                </div>
                <div className="flex gap-3">
                  <Button type="button" variant="ghost" onClick={closeForgotDialog} className="flex-1 rounded-full h-11">
                    {t('auth.login.forgotDialog.cancel')}
                  </Button>
                  <Button
                    type="submit"
                    disabled={forgotForm.formState.isSubmitting}
                    className="flex-1 rounded-full bg-[var(--edu-blue)] hover:bg-[var(--edu-blue-hover)] text-white h-11 disabled:opacity-60"
                  >
                    {forgotForm.formState.isSubmitting ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        {t('auth.login.forgotDialog.sending')}
                      </>
                    ) : (
                      t('auth.login.forgotDialog.send')
                    )}
                  </Button>
                </div>
              </form>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
