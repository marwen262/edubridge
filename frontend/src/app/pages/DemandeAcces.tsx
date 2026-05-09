import React from 'react';
import { Link } from 'react-router';
import { Building2, Mail, Phone, CheckCircle2, Loader2 } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { Navbar } from '../components/Navbar';
import { Footer } from '../components/Footer';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { demandeAccesService } from '@/services/api';
import { motion } from 'motion/react';
import logoEduBridge from '@/assets/logo/logoedubridge.png';

const schema = z.object({
  nom: z
    .string()
    .min(2, "Nom de l'établissement requis (2 caractères minimum)"),
  email: z
    .string()
    .email('Adresse e-mail invalide'),
  telephone: z
    .string()
    .min(8, 'Numéro de téléphone invalide'),
  presentation: z
    .string()
    .min(20, 'Présentation trop courte (20 caractères minimum)')
    .max(500, 'Présentation trop longue (500 caractères maximum)'),
});

type FormData = z.infer<typeof schema>;

export function DemandeAcces() {
  const [success, setSuccess] = React.useState(false);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { nom: '', email: '', telephone: '', presentation: '' },
  });

  const presentation = watch('presentation') ?? '';

  const onSubmit = async (data: FormData) => {
    try {
      await demandeAccesService.creer(data);
      setSuccess(true);
    } catch (err: unknown) {
      const apiErr = err as { response?: { data?: { message?: string } } };
      toast.error(apiErr.response?.data?.message ?? 'Une erreur est survenue. Veuillez réessayer.');
    }
  };

  return (
    <div className="min-h-screen bg-[var(--edu-surface)]">
      <Navbar />

      <div className="min-h-[calc(100vh-73px)] dotted-bg flex items-center justify-center p-6">
        <div className="w-full max-w-lg">

          <Link to="/" className="flex items-center justify-center mb-8">
            <img
              src={logoEduBridge}
              alt="EduBridge"
              className="h-14 w-auto dark:bg-white dark:rounded-xl dark:px-3 dark:py-1.5"
            />
          </Link>

          {success ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3 }}
              className="glass-card rounded-3xl p-8 shadow-2xl text-center"
            >
              <div className="w-16 h-16 rounded-full bg-[var(--edu-success)]/10 flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 className="w-8 h-8 text-[var(--edu-success)]" />
              </div>
              <h1 className="text-2xl font-bold text-[var(--edu-text-primary)] mb-3">
                Demande envoyée !
              </h1>
              <p className="text-[var(--edu-text-secondary)] mb-2">
                Votre demande a bien été reçue.
              </p>
              <p className="text-sm text-[var(--edu-text-secondary)] mb-8">
                Notre équipe vous contactera à l'adresse indiquée sous{' '}
                <span className="font-semibold text-[var(--edu-text-primary)]">
                  48 heures ouvrées
                </span>.
              </p>
              <Link to="/">
                <Button className="w-full rounded-full bg-[var(--edu-blue)] hover:bg-[var(--edu-blue-hover)] text-white h-11">
                  Retour à l'accueil
                </Button>
              </Link>
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              className="glass-card rounded-3xl p-8 shadow-2xl"
            >
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 rounded-2xl bg-[var(--edu-blue)]/10 flex items-center justify-center flex-shrink-0">
                  <Building2 className="w-6 h-6 text-[var(--edu-blue)]" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-[var(--edu-text-primary)]">
                    Rejoindre EduBridge
                  </h1>
                  <p className="text-sm text-[var(--edu-text-secondary)]">
                    Demande d'accès établissement
                  </p>
                </div>
              </div>

              <p className="text-sm text-[var(--edu-text-secondary)] mb-6 leading-relaxed">
                Renseignez les informations ci-dessous. Notre équipe examinera
                votre demande et vous enverra une invitation pour finaliser
                votre inscription.
              </p>

              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">

                <div>
                  <Label htmlFor="nom">Nom de l'établissement *</Label>
                  <Input
                    id="nom"
                    type="text"
                    placeholder="Ex : ESPRIT School of Engineering"
                    {...register('nom')}
                    className="rounded-xl mt-1"
                    autoFocus
                  />
                  {errors.nom && (
                    <p className="text-xs text-[var(--edu-danger)] mt-1">{errors.nom.message}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="email">Adresse e-mail de contact *</Label>
                  <div className="relative mt-1">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--edu-text-tertiary)] pointer-events-none" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="contact@etablissement.tn"
                      {...register('email')}
                      className="rounded-xl pl-9"
                    />
                  </div>
                  {errors.email && (
                    <p className="text-xs text-[var(--edu-danger)] mt-1">{errors.email.message}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="telephone">Téléphone *</Label>
                  <div className="relative mt-1">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--edu-text-tertiary)] pointer-events-none" />
                    <Input
                      id="telephone"
                      type="tel"
                      placeholder="+216 XX XXX XXX"
                      {...register('telephone')}
                      className="rounded-xl pl-9"
                    />
                  </div>
                  {errors.telephone && (
                    <p className="text-xs text-[var(--edu-danger)] mt-1">{errors.telephone.message}</p>
                  )}
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <Label htmlFor="presentation">
                      Présentez brièvement votre établissement *
                    </Label>
                    <span
                      className="text-xs"
                      style={{
                        color: presentation.length > 500
                          ? 'var(--edu-danger)'
                          : 'var(--edu-text-tertiary)',
                      }}
                    >
                      {presentation.length}/500
                    </span>
                  </div>
                  <textarea
                    id="presentation"
                    rows={4}
                    placeholder="Ex : École d'ingénieurs privée basée à Sousse, spécialisée en informatique et télécommunications, fondée en 2010. Nous proposons des cycles préparatoires intégrés et des cycles ingénieurs..."
                    {...register('presentation')}
                    className="w-full rounded-xl border border-[var(--edu-border)] bg-white dark:bg-[#1D1D1F] text-[var(--edu-text-primary)] text-sm px-3 py-2.5 outline-none focus:ring-2 focus:ring-[var(--edu-blue)] resize-none placeholder:text-[var(--edu-text-tertiary)]"
                  />
                  {errors.presentation && (
                    <p className="text-xs text-[var(--edu-danger)] mt-1">{errors.presentation.message}</p>
                  )}
                </div>

                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full rounded-full bg-[var(--edu-blue)] hover:bg-[var(--edu-blue-hover)] text-white h-12 font-medium disabled:opacity-60 mt-2"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Envoi en cours…
                    </>
                  ) : (
                    'Envoyer la demande'
                  )}
                </Button>
              </form>

              <p className="text-center text-sm text-[var(--edu-text-secondary)] mt-6">
                Vous avez déjà un compte ?{' '}
                <Link to="/login" className="text-[var(--edu-blue)] hover:underline font-medium">
                  Se connecter
                </Link>
              </p>
            </motion.div>
          )}

          <div className="text-center mt-6">
            <Link to="/" className="text-sm text-[var(--edu-text-secondary)] hover:text-[var(--edu-blue)]">
              ← Retour à l'accueil
            </Link>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
