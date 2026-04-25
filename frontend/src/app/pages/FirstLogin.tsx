import React from 'react';
import { useNavigate } from 'react-router';
import { GraduationCap, Eye, EyeOff, Check, X } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { toast } from 'sonner';
import { useAuth } from '@/context/AuthContext';
import { utilisateurService } from '@/services/api';

const firstLoginSchema = z
  .object({
    currentPassword: z.string().min(1, 'Mot de passe actuel requis'),
    newPassword: z
      .string()
      .min(8, '8 caractères minimum')
      .regex(/[A-Z]/, 'Une majuscule requise')
      .regex(/[0-9]/, 'Un chiffre requis')
      .regex(/[!@#$%^&*]/, 'Un caractère spécial requis'),
    confirmPassword: z.string(),
  })
  .refine((d) => d.newPassword === d.confirmPassword, {
    message: 'Les mots de passe ne correspondent pas',
    path: ['confirmPassword'],
  });

type FirstLoginFormData = z.infer<typeof firstLoginSchema>;

export function FirstLogin() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [showCurrent, setShowCurrent] = React.useState(false);
  const [showNew, setShowNew] = React.useState(false);
  const [showConfirm, setShowConfirm] = React.useState(false);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<FirstLoginFormData>({
    resolver: zodResolver(firstLoginSchema),
  });

  const watchedNewPassword = watch('newPassword') ?? '';

  const passwordChecks = [
    { label: '8+ characters', met: watchedNewPassword.length >= 8 },
    { label: 'Uppercase letter', met: /[A-Z]/.test(watchedNewPassword) },
    { label: 'Number', met: /[0-9]/.test(watchedNewPassword) },
    { label: 'Special character', met: /[!@#$%^&*]/.test(watchedNewPassword) },
  ];

  const onSubmit = async (data: FirstLoginFormData) => {
    if (!user) {
      toast.error('Session expirée, veuillez vous reconnecter');
      navigate('/login');
      return;
    }

    try {
      await utilisateurService.update(user.id, { mot_de_passe: data.newPassword });
      toast.success('Mot de passe mis à jour');
      navigate('/dashboard/institution');
    } catch (err: unknown) {
      const axiosError = err as { response?: { data?: { message?: string } } };
      toast.error(axiosError.response?.data?.message ?? 'Erreur');
    }
  };

  return (
    <div className="min-h-screen dotted-bg flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="flex items-center justify-center gap-2 mb-8">
          <GraduationCap className="w-10 h-10 text-[var(--edu-blue)]" />
          <span className="text-2xl font-bold text-[var(--edu-text-primary)]">EduBridge</span>
        </div>

        {/* Card */}
        <div className="glass-card rounded-3xl p-8 shadow-2xl">
          <div className="text-center mb-8">
            <div className="w-16 h-16 rounded-full bg-[var(--edu-warning)]/10 flex items-center justify-center mx-auto mb-4">
              <span className="text-3xl">🔐</span>
            </div>
            <h1 className="text-3xl font-bold text-[var(--edu-text-primary)] mb-2">
              Set your new password
            </h1>
            <p className="text-[var(--edu-text-secondary)]">
              For security reasons, please change the temporary password provided by the
              administrator.
            </p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <div>
              <Label htmlFor="currentPassword">Current (Temporary) Password *</Label>
              <div className="relative mt-1">
                <Input
                  id="currentPassword"
                  type={showCurrent ? 'text' : 'password'}
                  placeholder="Enter temporary password"
                  {...register('currentPassword')}
                  className="rounded-xl pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowCurrent(!showCurrent)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--edu-text-tertiary)] hover:text-[var(--edu-text-primary)]"
                >
                  {showCurrent ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              {errors.currentPassword && (
                <p className="text-xs text-[var(--edu-danger)] mt-1">
                  {errors.currentPassword.message}
                </p>
              )}
            </div>

            <div>
              <Label htmlFor="newPassword">New Password *</Label>
              <div className="relative mt-1">
                <Input
                  id="newPassword"
                  type={showNew ? 'text' : 'password'}
                  placeholder="Create a strong password"
                  {...register('newPassword')}
                  className="rounded-xl pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowNew(!showNew)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--edu-text-tertiary)] hover:text-[var(--edu-text-primary)]"
                >
                  {showNew ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              {errors.newPassword && (
                <p className="text-xs text-[var(--edu-danger)] mt-1">{errors.newPassword.message}</p>
              )}
            </div>

            <div>
              <Label htmlFor="confirmPassword">Confirm New Password *</Label>
              <div className="relative mt-1">
                <Input
                  id="confirmPassword"
                  type={showConfirm ? 'text' : 'password'}
                  placeholder="Confirm your new password"
                  {...register('confirmPassword')}
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
              {errors.confirmPassword && (
                <p className="text-xs text-[var(--edu-danger)] mt-1">
                  {errors.confirmPassword.message}
                </p>
              )}
            </div>

            {/* Checklist des critères */}
            {watchedNewPassword && (
              <div className="bg-[var(--edu-surface)] rounded-xl p-4">
                <p className="text-sm font-medium text-[var(--edu-text-primary)] mb-3">
                  Password Requirements:
                </p>
                <div className="space-y-2">
                  {passwordChecks.map((check, i) => (
                    <div key={i} className="flex items-center gap-2">
                      {check.met ? (
                        <div className="w-5 h-5 rounded-full bg-[var(--edu-success)] flex items-center justify-center">
                          <Check className="w-3 h-3 text-white" />
                        </div>
                      ) : (
                        <div className="w-5 h-5 rounded-full border-2 border-[var(--edu-border)] flex items-center justify-center">
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
              disabled={isSubmitting}
              className="w-full rounded-full bg-[var(--edu-blue)] hover:bg-[var(--edu-blue-hover)] text-white h-12 font-medium disabled:opacity-60"
            >
              {isSubmitting ? 'Updating…' : 'Update password'}
            </Button>
          </form>
        </div>

        <p className="text-center text-xs text-[var(--edu-text-secondary)] mt-6">
          After updating your password, you will be redirected to your dashboard.
        </p>
      </div>
    </div>
  );
}
