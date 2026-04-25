import React from 'react';
import { useParams, useNavigate } from 'react-router';
import { MapPin, Globe, Star, CheckCircle } from 'lucide-react';
import { Navbar } from '../components/Navbar';
import { Footer } from '../components/Footer';
import { ProgramCard } from '../components/ProgramCard';
import { Button } from '../components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Badge } from '../components/ui/badge';
import { useInstitut } from '@/hooks/useInstitut';
import { usePrograms } from '@/hooks/usePrograms';
import type { Institut } from '@/types/api';
import { motion } from 'motion/react';

export function InstitutionProfile() {
  // La route est /institution/:slug mais les liens de l'app passent l'UUID de l'institut
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { institut: institutData, loading, error } = useInstitut(slug);
  const institut = institutData as Institut | null;

  // Fallback : charger les programmes via filtre si le backend ne les inclut pas
  const hasEmbeddedPrograms = !!(institut?.programmes && institut.programmes.length > 0);
  const { programs: programsFallback } = usePrograms(
    institut && !hasEmbeddedPrograms ? { institut_id: institut.id } : undefined
  );

  const programmes = hasEmbeddedPrograms
    ? (institut!.programmes ?? [])
    : programsFallback;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-t-2 border-[var(--edu-blue)] animate-spin" />
      </div>
    );
  }

  if (error || !institut) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-[var(--edu-danger)]">{error ?? 'Institution introuvable'}</p>
          <button
            onClick={() => navigate('/')}
            className="mt-4 px-4 py-2 bg-[var(--edu-blue)] text-white rounded-lg"
          >
            Retour à l'accueil
          </button>
        </div>
      </div>
    );
  }

  // Image de couverture : préférer image_couverture, sinon logo
  const coverSrc = institut.image_couverture ?? institut.logo;

  // Localisation
  const localisation = [institut.adresse?.ville, institut.adresse?.pays]
    .filter(Boolean)
    .join(', ');

  // Taux d'acceptation formaté en pourcentage
  const tauxAcceptation =
    institut.taux_acceptation != null
      ? `${(institut.taux_acceptation * 100).toFixed(0)}%`
      : null;

  return (
    <div className="min-h-screen bg-[var(--edu-surface)]">
      <Navbar />

      {/* Couverture */}
      <div className="relative h-[400px] overflow-hidden">
        {coverSrc && (
          <img src={coverSrc} alt={institut.nom} className="w-full h-full object-cover" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
      </div>

      {/* En-tête avec carte en surimpression */}
      <div className="max-w-[1440px] mx-auto px-6 -mt-20 relative">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="glass-card rounded-3xl p-8"
        >
          <div className="flex items-start gap-6">
            {institut.logo && (
              <img
                src={institut.logo}
                alt={institut.nom}
                className="w-32 h-32 rounded-2xl object-cover shadow-lg"
              />
            )}
            <div className="flex-1">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <h1 className="text-4xl font-bold text-[var(--edu-text-primary)]">
                      {institut.nom}
                    </h1>
                    {institut.est_verifie && (
                      <CheckCircle className="w-8 h-8 text-[var(--edu-blue)]" />
                    )}
                  </div>
                  <div className="flex items-center gap-4 text-[var(--edu-text-secondary)]">
                    {localisation && (
                      <div className="flex items-center gap-1">
                        <MapPin className="w-4 h-4" />
                        <span>{localisation}</span>
                      </div>
                    )}
                    {institut.note != null && (
                      <>
                        {localisation && <span>•</span>}
                        <div className="flex items-center gap-1">
                          <Star className="w-4 h-4 text-[var(--edu-accent)]" />
                          <span>{institut.note} rating</span>
                        </div>
                      </>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Button variant="outline" className="rounded-full">Follow</Button>
                  <Button variant="outline" className="rounded-full">Share</Button>
                  {institut.site_web && (
                    <a href={institut.site_web} target="_blank" rel="noopener noreferrer">
                      <Button className="rounded-full bg-[var(--edu-blue)] hover:bg-[var(--edu-blue-hover)] text-white">
                        <Globe className="w-5 h-5 mr-2" />
                        Visit website
                      </Button>
                    </a>
                  )}
                </div>
              </div>

              {/* Statistiques */}
              <div className="grid grid-cols-4 gap-6">
                <div className="text-center">
                  <p className="text-3xl font-bold text-[var(--edu-blue)]">{programmes.length}</p>
                  <p className="text-sm text-[var(--edu-text-secondary)]">Programs</p>
                </div>
                {institut.nombre_etudiants != null && (
                  <div className="text-center">
                    <p className="text-3xl font-bold text-[var(--edu-blue)]">
                      {institut.nombre_etudiants.toLocaleString()}
                    </p>
                    <p className="text-sm text-[var(--edu-text-secondary)]">Students</p>
                  </div>
                )}
                {tauxAcceptation && (
                  <div className="text-center">
                    <p className="text-3xl font-bold text-[var(--edu-blue)]">{tauxAcceptation}</p>
                    <p className="text-sm text-[var(--edu-text-secondary)]">Acceptance Rate</p>
                  </div>
                )}
                {institut.note != null && (
                  <div className="text-center">
                    <p className="text-3xl font-bold text-[var(--edu-blue)]">{institut.note}</p>
                    <p className="text-sm text-[var(--edu-text-secondary)]">Average Rating</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Onglets */}
      <div className="max-w-[1440px] mx-auto px-6 py-8">
        <Tabs defaultValue="programs" className="w-full">
          <TabsList className="glass-card rounded-full p-1 mb-8">
            <TabsTrigger value="about" className="rounded-full">About</TabsTrigger>
            <TabsTrigger value="programs" className="rounded-full">Programs</TabsTrigger>
            <TabsTrigger value="location" className="rounded-full">Location</TabsTrigger>
            <TabsTrigger value="admissions" className="rounded-full">Admissions</TabsTrigger>
          </TabsList>

          {/* Onglet À propos */}
          <TabsContent value="about">
            <div className="glass-card rounded-2xl p-8">
              <h2 className="text-2xl font-bold text-[var(--edu-text-primary)] mb-6">
                About {institut.nom}
              </h2>
              {institut.description && (
                <p className="text-[var(--edu-text-secondary)] leading-relaxed mb-8">
                  {institut.description}
                </p>
              )}
              {institut.accreditations && institut.accreditations.length > 0 && (
                <>
                  <h3 className="text-xl font-bold text-[var(--edu-text-primary)] mb-4">
                    Accreditations
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {institut.accreditations.map((acc) => (
                      <Badge key={acc} variant="secondary" className="rounded-full">
                        {acc}
                      </Badge>
                    ))}
                  </div>
                </>
              )}
            </div>
          </TabsContent>

          {/* Onglet Programmes */}
          <TabsContent value="programs">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-[var(--edu-text-primary)] mb-2">
                {programmes.length} Programs Available
              </h2>
              <p className="text-[var(--edu-text-secondary)]">
                Explore all programs offered by {institut.nom}
              </p>
            </div>
            {programmes.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {programmes.map((programme) => (
                  <ProgramCard key={programme.id} programme={programme} view="grid" />
                ))}
              </div>
            ) : (
              <p className="text-[var(--edu-text-secondary)]">
                Aucun programme disponible pour l'instant.
              </p>
            )}
          </TabsContent>

          {/* Onglet Localisation */}
          <TabsContent value="location">
            <div className="glass-card rounded-2xl p-8">
              <h2 className="text-2xl font-bold text-[var(--edu-text-primary)] mb-6">Location</h2>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Placeholder carte interactive */}
                <div className="h-[400px] rounded-2xl overflow-hidden bg-[var(--edu-surface)] flex items-center justify-center">
                  <div className="text-center">
                    <MapPin className="w-16 h-16 text-[var(--edu-text-tertiary)] mx-auto mb-4" />
                    <p className="text-[var(--edu-text-secondary)]">
                      Interactive map would appear here
                    </p>
                  </div>
                </div>

                {/* Adresse */}
                <div className="space-y-6">
                  {institut.adresse && (
                    <div>
                      <h3 className="font-semibold text-[var(--edu-text-primary)] mb-3">Address</h3>
                      {institut.adresse.rue && (
                        <p className="text-[var(--edu-text-secondary)]">{institut.adresse.rue}</p>
                      )}
                      {(institut.adresse.ville || institut.adresse.code_postal) && (
                        <p className="text-[var(--edu-text-secondary)]">
                          {[institut.adresse.ville, institut.adresse.code_postal]
                            .filter(Boolean)
                            .join(', ')}
                        </p>
                      )}
                      {institut.adresse.gouvernorat && (
                        <p className="text-[var(--edu-text-secondary)]">
                          {institut.adresse.gouvernorat}
                        </p>
                      )}
                      {institut.adresse.pays && (
                        <p className="text-[var(--edu-text-secondary)]">{institut.adresse.pays}</p>
                      )}
                    </div>
                  )}
                  <Button className="rounded-full bg-[var(--edu-blue)] hover:bg-[var(--edu-blue-hover)] text-white">
                    Get directions
                  </Button>
                </div>
              </div>
            </div>
          </TabsContent>

          {/* Onglet Admissions */}
          <TabsContent value="admissions">
            <div className="glass-card rounded-2xl p-8">
              <h2 className="text-2xl font-bold text-[var(--edu-text-primary)] mb-6">
                Admissions Information
              </h2>
              <div className="space-y-6">
                <div>
                  <h3 className="font-semibold text-[var(--edu-text-primary)] mb-3">
                    Application Process
                  </h3>
                  <p className="text-[var(--edu-text-secondary)]">
                    Applications to {institut.nom} are submitted through the EduBridge platform.
                    Select a program to begin your application.
                  </p>
                </div>
                {(institut.contact?.email || institut.contact?.telephone) && (
                  <div>
                    <h3 className="font-semibold text-[var(--edu-text-primary)] mb-3">
                      Contact Admissions
                    </h3>
                    <div className="space-y-1 text-[var(--edu-text-secondary)]">
                      {institut.contact.email && (
                        <p>
                          Email:{' '}
                          <a
                            href={`mailto:${institut.contact.email}`}
                            className="text-[var(--edu-blue)] hover:underline"
                          >
                            {institut.contact.email}
                          </a>
                        </p>
                      )}
                      {institut.contact.telephone && (
                        <p>
                          Phone:{' '}
                          <a
                            href={`tel:${institut.contact.telephone}`}
                            className="text-[var(--edu-blue)] hover:underline"
                          >
                            {institut.contact.telephone}
                          </a>
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      <Footer />
    </div>
  );
}
