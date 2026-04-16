import React from 'react';
import { useParams, Link } from 'react-router';
import { MapPin, Globe, Star, CheckCircle, ChevronRight } from 'lucide-react';
import { Navbar } from '../components/Navbar';
import { Footer } from '../components/Footer';
import { ProgramCard } from '../components/ProgramCard';
import { Button } from '../components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Badge } from '../components/ui/badge';
import { mockInstitutions, mockPrograms } from '../data/mockData';
import { motion } from 'motion/react';

export function InstitutionProfile() {
  const { slug } = useParams();
  const institution = mockInstitutions.find((i) => i.slug === slug);

  if (!institution) {
    return (
      <div className="min-h-screen bg-white dark:bg-[#1D1D1F] flex items-center justify-center">
        <p>Institution not found</p>
      </div>
    );
  }

  const institutionPrograms = mockPrograms.filter((p) => p.institution.id === institution.id);

  return (
    <div className="min-h-screen bg-[var(--edu-surface)]">
      <Navbar />

      {/* Cover */}
      <div className="relative h-[400px] overflow-hidden">
        <img src={institution.cover} alt={institution.name} className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
      </div>

      {/* Header */}
      <div className="max-w-[1440px] mx-auto px-6 -mt-20 relative">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="glass-card rounded-3xl p-8"
        >
          <div className="flex items-start gap-6">
            <img
              src={institution.logo}
              alt={institution.name}
              className="w-32 h-32 rounded-2xl object-cover shadow-lg"
            />
            <div className="flex-1">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <h1 className="text-4xl font-bold text-[var(--edu-text-primary)]">{institution.name}</h1>
                    {institution.verified && (
                      <CheckCircle className="w-8 h-8 text-[var(--edu-blue)]" />
                    )}
                  </div>
                  <div className="flex items-center gap-4 text-[var(--edu-text-secondary)]">
                    <div className="flex items-center gap-1">
                      <MapPin className="w-4 h-4" />
                      <span>{institution.city}, {institution.country}</span>
                    </div>
                    <span>•</span>
                    <div className="flex items-center gap-1">
                      <Star className="w-4 h-4 text-[var(--edu-accent)]" />
                      <span>{institution.rating} rating</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Button variant="outline" className="rounded-full">
                    Follow
                  </Button>
                  <Button variant="outline" className="rounded-full">
                    Share
                  </Button>
                  <Button className="rounded-full bg-[var(--edu-blue)] hover:bg-[var(--edu-blue-hover)] text-white">
                    <Globe className="w-5 h-5 mr-2" />
                    Visit website
                  </Button>
                </div>
              </div>

              <div className="grid grid-cols-4 gap-6">
                <div className="text-center">
                  <p className="text-3xl font-bold text-[var(--edu-blue)]">{institution.programsCount}</p>
                  <p className="text-sm text-[var(--edu-text-secondary)]">Programs</p>
                </div>
                <div className="text-center">
                  <p className="text-3xl font-bold text-[var(--edu-blue)]">{institution.studentsCount.toLocaleString()}</p>
                  <p className="text-sm text-[var(--edu-text-secondary)]">Students</p>
                </div>
                <div className="text-center">
                  <p className="text-3xl font-bold text-[var(--edu-blue)]">{institution.acceptanceRate}</p>
                  <p className="text-sm text-[var(--edu-text-secondary)]">Acceptance Rate</p>
                </div>
                <div className="text-center">
                  <p className="text-3xl font-bold text-[var(--edu-blue)]">{institution.rating}</p>
                  <p className="text-sm text-[var(--edu-text-secondary)]">Average Rating</p>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Tabs */}
      <div className="max-w-[1440px] mx-auto px-6 py-8">
        <Tabs defaultValue="programs" className="w-full">
          <TabsList className="glass-card rounded-full p-1 mb-8">
            <TabsTrigger value="about" className="rounded-full">About</TabsTrigger>
            <TabsTrigger value="programs" className="rounded-full">Programs</TabsTrigger>
            <TabsTrigger value="location" className="rounded-full">Location</TabsTrigger>
            <TabsTrigger value="admissions" className="rounded-full">Admissions</TabsTrigger>
          </TabsList>

          <TabsContent value="about">
            <div className="glass-card rounded-2xl p-8">
              <h2 className="text-2xl font-bold text-[var(--edu-text-primary)] mb-6">About {institution.name}</h2>
              <p className="text-[var(--edu-text-secondary)] leading-relaxed mb-8">{institution.description}</p>

              <h3 className="text-xl font-bold text-[var(--edu-text-primary)] mb-4">Accreditations</h3>
              <div className="flex flex-wrap gap-2">
                {institution.accreditations.map((acc) => (
                  <Badge key={acc} variant="secondary" className="rounded-full">
                    {acc}
                  </Badge>
                ))}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="programs">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-[var(--edu-text-primary)] mb-2">
                {institutionPrograms.length} Programs Available
              </h2>
              <p className="text-[var(--edu-text-secondary)]">
                Explore all programs offered by {institution.name}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {institutionPrograms.map((program) => (
                <ProgramCard key={program.id} program={program} view="grid" />
              ))}
            </div>
          </TabsContent>

          <TabsContent value="location">
            <div className="glass-card rounded-2xl p-8">
              <h2 className="text-2xl font-bold text-[var(--edu-text-primary)] mb-6">Location</h2>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Map Placeholder */}
                <div className="h-[400px] rounded-2xl overflow-hidden bg-[var(--edu-surface)] flex items-center justify-center">
                  <div className="text-center">
                    <MapPin className="w-16 h-16 text-[var(--edu-text-tertiary)] mx-auto mb-4" />
                    <p className="text-[var(--edu-text-secondary)]">Interactive map would appear here</p>
                  </div>
                </div>

                {/* Address */}
                <div className="space-y-6">
                  <div>
                    <h3 className="font-semibold text-[var(--edu-text-primary)] mb-3">Address</h3>
                    <p className="text-[var(--edu-text-secondary)]">{institution.location.address}</p>
                    <p className="text-[var(--edu-text-secondary)]">
                      {institution.city}, {institution.location.postalCode}
                    </p>
                    <p className="text-[var(--edu-text-secondary)]">{institution.country}</p>
                  </div>

                  <Button className="rounded-full bg-[var(--edu-blue)] hover:bg-[var(--edu-blue-hover)] text-white">
                    Get directions
                  </Button>

                  <div>
                    <h3 className="font-semibold text-[var(--edu-text-primary)] mb-3">Nearby</h3>
                    <ul className="space-y-2 text-sm text-[var(--edu-text-secondary)]">
                      <li>• City center: 2.5 km</li>
                      <li>• Airport: 15 km</li>
                      <li>• Train station: 1.2 km</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="admissions">
            <div className="glass-card rounded-2xl p-8">
              <h2 className="text-2xl font-bold text-[var(--edu-text-primary)] mb-6">Admissions Information</h2>
              <div className="space-y-6">
                <div>
                  <h3 className="font-semibold text-[var(--edu-text-primary)] mb-3">Application Process</h3>
                  <p className="text-[var(--edu-text-secondary)]">
                    Applications to {institution.name} are submitted through the EduBridge platform.
                    Select a program to begin your application.
                  </p>
                </div>

                <div>
                  <h3 className="font-semibold text-[var(--edu-text-primary)] mb-3">Contact Admissions</h3>
                  <p className="text-[var(--edu-text-secondary)]">
                    Email: admissions@{institution.id}.edu<br />
                    Phone: +1 (555) 123-4567
                  </p>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      <Footer />
    </div>
  );
}
