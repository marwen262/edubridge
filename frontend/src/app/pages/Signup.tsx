import React from 'react';
import { Link, useNavigate } from 'react-router';
import { Eye, EyeOff, Check, X } from 'lucide-react';
import logoEduBridge from '@/assets/logo/logoedubridge.png';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Checkbox } from '../components/ui/checkbox';
import { toast } from 'sonner';
import { useAuth } from '@/context/AuthContext';
import { NationaliteSelect } from '../components/forms/NationaliteSelect';

const signupSchema = z
  .object({
    prenom: z.string().min(2, 'Prénom requis'),
    nom: z.string().min(2, 'Nom requis'),
    email: z.string().email('Email invalide'),
    nationalite: z.string().min(1, 'Nationalité requise'),
    password: z
      .string()
      .min(8, '8 caractères minimum')
      .regex(/[A-Z]/, 'Une majuscule requise')
      .regex(/[0-9]/, 'Un chiffre requis')
      .regex(/[!@#$%^&*]/, 'Un caractère spécial requis'),
    confirmPassword: z.string(),
    termsAccepted: z.boolean().refine((v) => v === true, 'Accepter les conditions'),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: 'Les mots de passe ne correspondent pas',
    path: ['confirmPassword'],
  });

type SignupFormData = z.infer<typeof signupSchema>;

export function Signup() {
  const navigate = useNavigate();
  const { register: registerUser } = useAuth();
  const [showPassword, setShowPassword] = React.useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = React.useState(false);

  const {
    register,
    handleSubmit,
    watch,
    control,
    formState: { errors, isSubmitting },
  } = useForm<SignupFormData>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      prenom: '',
      nom: '',
      email: '',
      nationalite: '',
      password: '',
      confirmPassword: '',
      termsAccepted: false,
    },
  });

  const watchedPassword = watch('password') ?? '';

  const getPasswordStrength = () => {
    if (watchedPassword.length === 0) return 0;
    if (watchedPassword.length < 8) return 1;
    if (!/[A-Z]/.test(watchedPassword) || !/[0-9]/.test(watchedPassword)) return 2;
    if (!/[!@#$%^&*]/.test(watchedPassword)) return 3;
    return 4;
  };

  const passwordStrength = getPasswordStrength();
  const strengthLabels = ['', 'Faible', 'Moyen', 'Bon', 'Fort'];
  const strengthColors = ['', '#FF3B30', '#FF9F0A', '#64D2FF', '#30D158'];

  const passwordChecks = [
    { label: '8 caractères minimum', met: watchedPassword.length >= 8 },
    { label: 'Une lettre majuscule', met: /[A-Z]/.test(watchedPassword) },
    { label: 'Un chiffre', met: /[0-9]/.test(watchedPassword) },
    { label: 'Un caractère spécial', met: /[!@#$%^&*]/.test(watchedPassword) },
  ];

  const onSubmit = async (data: SignupFormData) => {
    try {
      await registerUser({
        email: data.email,
        password: data.password,
        role: 'candidat',
        prenom: data.prenom,
        nom: data.nom,
        nationalite: data.nationalite,
      });
      navigate('/dashboard/candidate');
    } catch (err: unknown) {
      const axiosError = err as { response?: { data?: { message?: string } } };
      toast.error(axiosError.response?.data?.message ?? 'Erreur inscription');
    }
  };

  return (
    <div className="min-h-screen dotted-bg flex items-center justify-center p-6">
      <div className="w-full max-w-2xl">
        {/* Logo */}
        <Link to="/" className="flex items-center justify-center mb-8">
          <img
            src={logoEduBridge}
            alt="EduBridge"
            className="h-14 w-auto dark:bg-white dark:rounded-xl dark:px-3 dark:py-1.5"
          />
        </Link>

        {/* Card */}
        <div className="glass-card rounded-3xl p-8 shadow-2xl">
          <h1 className="text-3xl font-bold text-[var(--edu-text-primary)] mb-2 text-center">
            Créer votre compte candidat
          </h1>
          <p className="text-[var(--edu-text-secondary)] text-center mb-8">
            Commencez votre parcours vers le programme idéal
          </p>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="prenom">Prénom *</Label>
                <Input
                  id="prenom"
                  type="text"
                  placeholder="Votre prénom"
                  {...register('prenom')}
                  className="rounded-xl mt-1"
                />
                {errors.prenom && (
                  <p className="text-xs text-[var(--edu-danger)] mt-1">{errors.prenom.message}</p>
                )}
              </div>

              <div>
                <Label htmlFor="nom">Nom *</Label>
                <Input
                  id="nom"
                  type="text"
                  placeholder="Votre nom"
                  {...register('nom')}
                  className="rounded-xl mt-1"
                />
                {errors.nom && (
                  <p className="text-xs text-[var(--edu-danger)] mt-1">{errors.nom.message}</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4">
              <div>
                <Label htmlFor="email">Adresse e-mail *</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="votre@email.com"
                  {...register('email')}
                  className="rounded-xl mt-1"
                />
                {errors.email && (
                  <p className="text-xs text-[var(--edu-danger)] mt-1">{errors.email.message}</p>
                )}
              </div>
            </div>

            <div>
              <Label htmlFor="nationalite">Nationalité *</Label>
              <div className="mt-1">
                <Controller
                  control={control}
                  name="nationalite"
                  render={({ field }) => (
                    <NationaliteSelect
                      id="nationalite"
                      value={field.value}
                      onChange={field.onChange}
                      placeholder="Sélectionnez votre nationalité"
                    />
                  )}
                />
              </div>
              {errors.nationalite && (
                <p className="text-xs text-[var(--edu-danger)] mt-1">{errors.nationalite.message}</p>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="password">Mot de passe *</Label>
                <div className="relative mt-1">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Créez un mot de passe fort"
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

                {watchedPassword && (
                  <div className="mt-2">
                    <div className="h-1.5 bg-[var(--edu-surface)] rounded-full overflow-hidden">
                      <div
                        className="h-full transition-all duration-300"
                        style={{
                          width: `${(passwordStrength / 4) * 100}%`,
                          backgroundColor: strengthColors[passwordStrength],
                        }}
                      />
                    </div>
                    <p className="text-xs mt-1" style={{ color: strengthColors[passwordStrength] }}>
                      {strengthLabels[passwordStrength]}
                    </p>
                  </div>
                )}
                {errors.password && (
                  <p className="text-xs text-[var(--edu-danger)] mt-1">{errors.password.message}</p>
                )}
              </div>

              <div>
                <Label htmlFor="confirmPassword">Confirmer le mot de passe *</Label>
                <div className="relative mt-1">
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? 'text' : 'password'}
                    placeholder="Répétez le mot de passe"
                    {...register('confirmPassword')}
                    className="rounded-xl pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--edu-text-tertiary)] hover:text-[var(--edu-text-primary)]"
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="w-5 h-5" />
                    ) : (
                      <Eye className="w-5 h-5" />
                    )}
                  </button>
                </div>
                {errors.confirmPassword && (
                  <p className="text-xs text-[var(--edu-danger)] mt-1">
                    {errors.confirmPassword.message}
                  </p>
                )}
              </div>
            </div>

            {watchedPassword && (
              <div className="bg-[var(--edu-surface)] rounded-xl p-4">
                <p className="text-sm font-medium text-[var(--edu-text-primary)] mb-2">
                  Critères du mot de passe :
                </p>
                <div className="grid grid-cols-2 gap-2">
                  {passwordChecks.map((check, i) => (
                    <div key={i} className="flex items-center gap-2 text-xs">
                      {check.met ? (
                        <Check className="w-4 h-4 text-[var(--edu-success)]" />
                      ) : (
                        <X className="w-4 h-4 text-[var(--edu-text-tertiary)]" />
                      )}
                      <span
                        className={
                          check.met ? 'text-[var(--edu-success)]' : 'text-[var(--edu-text-secondary)]'
                        }
                      >
                        {check.label}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex items-start gap-2">
              <Controller
                control={control}
                name="termsAccepted"
                render={({ field }) => (
                  <Checkbox
                    id="terms"
                    checked={field.value}
                    onCheckedChange={(checked) => field.onChange(checked === true)}
                    className="mt-1"
                  />
                )}
              />
              <label htmlFor="terms" className="text-sm text-[var(--edu-text-secondary)] cursor-pointer">
                J'accepte les{' '}
                <a href="#" className="text-[var(--edu-blue)] hover:underline">
                  Conditions d'utilisation
                </a>{' '}
                et la{' '}
                <a href="#" className="text-[var(--edu-blue)] hover:underline">
                  Politique de confidentialité
                </a>
              </label>
            </div>
            {errors.termsAccepted && (
              <p className="text-xs text-[var(--edu-danger)] -mt-3">
                {errors.termsAccepted.message}
              </p>
            )}

            <Button
              type="submit"
              disabled={isSubmitting}
              className="w-full rounded-full bg-[var(--edu-blue)] hover:bg-[var(--edu-blue-hover)] text-white h-12 font-medium disabled:opacity-60"
            >
              {isSubmitting ? 'Création en cours…' : 'Créer mon compte'}
            </Button>
          </form>

          <p className="text-center text-sm text-[var(--edu-text-secondary)] mt-6">
            Vous avez déjà un compte ?{' '}
            <Link to="/login" className="text-[var(--edu-blue)] hover:underline font-medium">
              Se connecter
            </Link>
          </p>
        </div>

        <div className="text-center mt-6">
          <Link to="/" className="text-sm text-[var(--edu-text-secondary)] hover:text-[var(--edu-blue)]">
            ← Retour à l'accueil
          </Link>
        </div>
      </div>
    </div>
  );
}
