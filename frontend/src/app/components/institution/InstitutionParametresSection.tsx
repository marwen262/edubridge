import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion } from 'motion/react';
import { toast } from 'sonner';
import { Mail, Shield, KeyRound, Eye, EyeOff, Loader2 } from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { useAuth } from '@/context/AuthContext';
import { authService } from '@/services/api';

const schemaMotDePasse = z
  .object({
    ancienMotDePasse: z.string().min(1, 'Ce champ est requis'),
    nouveauMotDePasse: z
      .string()
      .min(8, 'Minimum 8 caractères')
      .regex(/[A-Z]/, 'Au moins une lettre majuscule')
      .regex(/\d/, 'Au moins un chiffre'),
    confirmerMotDePasse: z.string().min(1, 'Ce champ est requis'),
  })
  .refine((d) => d.nouveauMotDePasse === d.confirmerMotDePasse, {
    message: 'Les mots de passe ne correspondent pas',
    path: ['confirmerMotDePasse'],
  });

type FormValues = z.infer<typeof schemaMotDePasse>;

export function InstitutionParametresSection() {
  const { user } = useAuth();
  const [showOld, setShowOld] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schemaMotDePasse) });

  const onSubmit = async (values: FormValues) => {
    try {
      await authService.changerMotDePasse(values.ancienMotDePasse, values.nouveauMotDePasse);
      toast.success('Mot de passe modifié avec succès');
      reset();
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        'Erreur lors de la modification du mot de passe';
      toast.error(msg);
    }
  };

  return (
    <div>
      <div className="bg-white dark:bg-[#1D1D1F] border-b border-[var(--edu-border)] px-8 py-6">
        <p className="text-xs font-semibold uppercase tracking-wider text-[var(--edu-text-tertiary)] mb-1">Établissement</p>
        <h1 className="text-3xl font-bold text-[var(--edu-text-primary)]">Paramètres</h1>
        <p className="text-sm text-[var(--edu-text-secondary)] mt-1">Configuration de votre compte</p>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="p-8 max-w-3xl space-y-6"
      >
        {/* Compte */}
        <section className="glass-card rounded-2xl overflow-hidden">
          <div className="px-6 py-5 border-b border-[var(--edu-divider)]">
            <h2 className="text-base font-semibold text-[var(--edu-text-primary)]">Compte</h2>
            <p className="text-xs text-[var(--edu-text-secondary)] mt-0.5">Informations de connexion</p>
          </div>
          <div className="divide-y divide-[var(--edu-divider)]">
            <InfoRow Icon={Mail} label="Adresse email" value={user?.email} />
            <InfoRow Icon={Shield} label="Rôle" value="Institut" />
          </div>
        </section>

        {/* Sécurité — formulaire changement de mot de passe */}
        <section className="glass-card rounded-2xl overflow-hidden">
          <div className="px-6 py-5 border-b border-[var(--edu-divider)]">
            <div className="flex items-center gap-3">
              <div
                className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
                style={{ backgroundColor: 'var(--edu-blue)15' }}
              >
                <KeyRound className="w-4 h-4" style={{ color: 'var(--edu-blue)' }} />
              </div>
              <div>
                <h2 className="text-base font-semibold text-[var(--edu-text-primary)]">Changer le mot de passe</h2>
                <p className="text-xs text-[var(--edu-text-secondary)] mt-0.5">
                  Minimum 8 caractères, une majuscule et un chiffre
                </p>
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="px-6 py-5 space-y-4">
            {/* Ancien mot de passe */}
            <div className="space-y-1.5">
              <Label htmlFor="ancienMotDePasse">Mot de passe actuel</Label>
              <div className="relative">
                <Input
                  id="ancienMotDePasse"
                  type={showOld ? 'text' : 'password'}
                  placeholder="Votre mot de passe actuel"
                  className="pr-10"
                  {...register('ancienMotDePasse')}
                />
                <button
                  type="button"
                  onClick={() => setShowOld((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--edu-text-tertiary)] hover:text-[var(--edu-text-secondary)] transition-colors"
                  tabIndex={-1}
                >
                  {showOld ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {errors.ancienMotDePasse && (
                <p className="text-xs text-[var(--edu-danger)]">{errors.ancienMotDePasse.message}</p>
              )}
            </div>

            {/* Nouveau mot de passe */}
            <div className="space-y-1.5">
              <Label htmlFor="nouveauMotDePasse">Nouveau mot de passe</Label>
              <div className="relative">
                <Input
                  id="nouveauMotDePasse"
                  type={showNew ? 'text' : 'password'}
                  placeholder="Nouveau mot de passe"
                  className="pr-10"
                  {...register('nouveauMotDePasse')}
                />
                <button
                  type="button"
                  onClick={() => setShowNew((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--edu-text-tertiary)] hover:text-[var(--edu-text-secondary)] transition-colors"
                  tabIndex={-1}
                >
                  {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {errors.nouveauMotDePasse && (
                <p className="text-xs text-[var(--edu-danger)]">{errors.nouveauMotDePasse.message}</p>
              )}
            </div>

            {/* Confirmer mot de passe */}
            <div className="space-y-1.5">
              <Label htmlFor="confirmerMotDePasse">Confirmer le nouveau mot de passe</Label>
              <div className="relative">
                <Input
                  id="confirmerMotDePasse"
                  type={showConfirm ? 'text' : 'password'}
                  placeholder="Répéter le nouveau mot de passe"
                  className="pr-10"
                  {...register('confirmerMotDePasse')}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--edu-text-tertiary)] hover:text-[var(--edu-text-secondary)] transition-colors"
                  tabIndex={-1}
                >
                  {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {errors.confirmerMotDePasse && (
                <p className="text-xs text-[var(--edu-danger)]">{errors.confirmerMotDePasse.message}</p>
              )}
            </div>

            <div className="pt-2 flex justify-end">
              <Button
                type="submit"
                disabled={isSubmitting}
                className="rounded-xl bg-[var(--edu-blue)] hover:bg-[var(--edu-blue-hover)] text-white disabled:opacity-50"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Enregistrement…
                  </>
                ) : (
                  'Changer le mot de passe'
                )}
              </Button>
            </div>
          </form>
        </section>
      </motion.div>
    </div>
  );
}

function InfoRow({
  Icon,
  label,
  value,
}: {
  Icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>;
  label: string;
  value?: string | null;
}) {
  return (
    <div className="flex items-center gap-4 px-6 py-4">
      <div
        className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
        style={{ backgroundColor: 'var(--edu-blue)15' }}
      >
        <Icon className="w-4 h-4" style={{ color: 'var(--edu-blue)' }} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs text-[var(--edu-text-tertiary)] uppercase tracking-wide font-semibold">{label}</p>
        <p className="text-sm mt-0.5 font-medium text-[var(--edu-text-primary)] truncate">{value || '—'}</p>
      </div>
    </div>
  );
}
