import React from 'react';
import { useParams, Link } from 'react-router';
import { Heart, Share2, MapPin, Clock, Globe, Calendar, DollarSign, ChevronRight, Star } from 'lucide-react';
import { Navbar } from '../components/Navbar';
import { Footer } from '../components/Footer';
import { ProgramCard } from '../components/ProgramCard';
import { MultiStepDialog } from '../components/MultiStepDialog';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '../components/ui/accordion';
import { mockPrograms } from '../data/mockData';
import { motion } from 'motion/react';

export function ProgramDetail() {
  const { id } = useParams();
  const program = mockPrograms.find((p) => p.id === id);
  const [saved, setSaved] = React.useState(false);
  const [applyDialogOpen, setApplyDialogOpen] = React.useState(false);

  if (!program) {
    return (
      <div className="min-h-screen bg-white dark:bg-[#1D1D1F] flex items-center justify-center">
        <p>Program not found</p>
      </div>
    );
  }

  const deadline = new Date(program.deadline);
  const today = new Date();
  const daysLeft = Math.ceil((deadline.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

  const similarPrograms = mockPrograms.filter((p) => p.field === program.field && p.id !== program.id).slice(0, 3);

  return (
    <div className="min-h-screen bg-[var(--edu-surface)]">
      <Navbar />

      {/* Breadcrumb */}
      <div className="bg-white dark:bg-[#1D1D1F] border-b border-[var(--edu-border)]">
        <div className="max-w-[1440px] mx-auto px-6 py-4">
          <div className="flex items-center gap-2 text-sm text-[var(--edu-text-secondary)]">
            <Link to="/" className="hover:text-[var(--edu-blue)]">Home</Link>
            <ChevronRight className="w-4 h-4" />
            <Link to="/search" className="hover:text-[var(--edu-blue)]">Search</Link>
            <ChevronRight className="w-4 h-4" />
            <Link to={`/institution/${program.institution.id}`} className="hover:text-[var(--edu-blue)]">
              {program.institution.name}
            </Link>
            <ChevronRight className="w-4 h-4" />
            <span className="text-[var(--edu-text-primary)]">{program.title}</span>
          </div>
        </div>
      </div>

      {/* Hero */}
      <div className="relative h-[400px] overflow-hidden">
        <img
          src={program.cover}
          alt={program.title}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />

        <div className="absolute bottom-0 left-0 right-0">
          <div className="max-w-[1440px] mx-auto px-6 py-8">
            <div className="flex items-start justify-between gap-8">
              <div className="flex items-start gap-6 flex-1">
                <img
                  src={program.institution.logo}
                  alt={program.institution.name}
                  className="w-20 h-20 rounded-2xl object-cover glass-card"
                />
                <div className="flex-1">
                  <h1 className="text-4xl font-bold text-white mb-3">{program.title}</h1>
                  <div className="flex items-center gap-4 text-white/90">
                    <span className="font-medium">{program.institution.name}</span>
                    <span>•</span>
                    <div className="flex items-center gap-1">
                      <MapPin className="w-4 h-4" />
                      <span>{program.institution.city}, {program.institution.country}</span>
                    </div>
                    <span>•</span>
                    <div className="flex items-center gap-1">
                      <Star className="w-4 h-4 fill-[var(--edu-accent)] text-[var(--edu-accent)]" />
                      <span>{program.rating}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={() => setSaved(!saved)}
                  className={`glass-card p-3 rounded-full ${saved ? 'heart-bounce' : ''}`}
                >
                  <Heart
                    className={`w-6 h-6 ${saved ? 'fill-[var(--edu-accent)] text-[var(--edu-accent)]' : 'text-white'}`}
                  />
                </button>
                <button className="glass-card p-3 rounded-full">
                  <Share2 className="w-6 h-6 text-white" />
                </button>
                <Button
                  onClick={() => setApplyDialogOpen(true)}
                  className="rounded-full bg-[var(--edu-blue)] hover:bg-[var(--edu-blue-hover)] text-white px-8 h-12 text-lg"
                >
                  Apply now
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Sticky Tab Bar */}
      <div className="bg-white dark:bg-[#1D1D1F] border-b border-[var(--edu-border)] sticky top-[73px] z-40">
        <div className="max-w-[1440px] mx-auto px-6">
          <Tabs defaultValue="overview" className="w-full">
            <TabsList className="w-full justify-start h-auto p-0 bg-transparent border-none">
              <TabsTrigger
                value="overview"
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-[var(--edu-blue)] data-[state=active]:bg-transparent px-6 py-4"
              >
                Overview
              </TabsTrigger>
              <TabsTrigger
                value="requirements"
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-[var(--edu-blue)] data-[state=active]:bg-transparent px-6 py-4"
              >
                Requirements
              </TabsTrigger>
              <TabsTrigger
                value="curriculum"
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-[var(--edu-blue)] data-[state=active]:bg-transparent px-6 py-4"
              >
                Curriculum
              </TabsTrigger>
              <TabsTrigger
                value="tuition"
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-[var(--edu-blue)] data-[state=active]:bg-transparent px-6 py-4"
              >
                Tuition
              </TabsTrigger>
              <TabsTrigger
                value="institution"
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-[var(--edu-blue)] data-[state=active]:bg-transparent px-6 py-4"
              >
                Institution
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-[1440px] mx-auto px-6 py-8">
        <div className="flex gap-8">
          {/* Main */}
          <div className="flex-1">
            <Tabs defaultValue="overview">
              <TabsContent value="overview" className="space-y-8">
                {/* Key Facts */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4 }}
                >
                  <h2 className="text-2xl font-bold text-[var(--edu-text-primary)] mb-6">Key Facts</h2>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {[
                      { label: 'Level', value: program.level, icon: <Star className="w-5 h-5" /> },
                      { label: 'Duration', value: program.duration, icon: <Clock className="w-5 h-5" /> },
                      { label: 'Start Date', value: program.startDate, icon: <Calendar className="w-5 h-5" /> },
                      { label: 'Deadline', value: new Date(program.deadline).toLocaleDateString(), icon: <Calendar className="w-5 h-5" /> },
                      { label: 'Language', value: program.language, icon: <Globe className="w-5 h-5" /> },
                      { label: 'Mode', value: program.mode, icon: <MapPin className="w-5 h-5" /> },
                    ].map((fact, i) => (
                      <div key={fact.label} className="glass-card rounded-2xl p-6">
                        <div className="text-[var(--edu-blue)] mb-3">{fact.icon}</div>
                        <p className="text-sm text-[var(--edu-text-secondary)] mb-1">{fact.label}</p>
                        <p className="font-semibold text-[var(--edu-text-primary)]">{fact.value}</p>
                      </div>
                    ))}
                  </div>
                </motion.div>

                {/* About */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: 0.1 }}
                >
                  <h2 className="text-2xl font-bold text-[var(--edu-text-primary)] mb-4">About the Program</h2>
                  <div className="glass-card rounded-2xl p-6">
                    <p className="text-[var(--edu-text-secondary)] leading-relaxed">{program.description}</p>
                  </div>
                </motion.div>

                {/* Similar Programs */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: 0.2 }}
                >
                  <h2 className="text-2xl font-bold text-[var(--edu-text-primary)] mb-6">Similar Programs</h2>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {similarPrograms.map((p) => (
                      <ProgramCard key={p.id} program={p} view="grid" />
                    ))}
                  </div>
                </motion.div>
              </TabsContent>

              <TabsContent value="requirements">
                <div className="glass-card rounded-2xl p-8">
                  <h2 className="text-2xl font-bold text-[var(--edu-text-primary)] mb-6">Admission Requirements</h2>
                  <ul className="space-y-3">
                    {program.requirements.map((req, i) => (
                      <li key={i} className="flex items-start gap-3">
                        <div className="w-6 h-6 rounded-full bg-[var(--edu-blue)] flex items-center justify-center flex-shrink-0 mt-0.5">
                          <span className="text-white text-xs">✓</span>
                        </div>
                        <span className="text-[var(--edu-text-secondary)]">{req}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </TabsContent>

              <TabsContent value="curriculum">
                <div className="glass-card rounded-2xl p-8">
                  <h2 className="text-2xl font-bold text-[var(--edu-text-primary)] mb-6">Curriculum</h2>
                  <Accordion type="single" collapsible className="w-full">
                    {program.curriculum.map((module, i) => (
                      <AccordionItem key={i} value={`module-${i}`}>
                        <AccordionTrigger className="text-[var(--edu-text-primary)] font-semibold">
                          {module.module}
                        </AccordionTrigger>
                        <AccordionContent className="text-[var(--edu-text-secondary)]">
                          {module.description}
                        </AccordionContent>
                      </AccordionItem>
                    ))}
                  </Accordion>
                </div>
              </TabsContent>

              <TabsContent value="tuition">
                <div className="glass-card rounded-2xl p-8">
                  <h2 className="text-2xl font-bold text-[var(--edu-text-primary)] mb-6">Tuition & Funding</h2>
                  <div className="space-y-6">
                    <div className="flex items-center justify-between py-4 border-b border-[var(--edu-divider)]">
                      <span className="text-[var(--edu-text-secondary)]">Annual Tuition</span>
                      <span className="text-2xl font-bold text-[var(--edu-blue)]">${program.tuition.toLocaleString()}</span>
                    </div>
                    <div>
                      <h3 className="font-semibold text-[var(--edu-text-primary)] mb-3">Funding Options</h3>
                      <ul className="space-y-2 text-[var(--edu-text-secondary)]">
                        <li>• Merit-based scholarships</li>
                        <li>• Need-based financial aid</li>
                        <li>• Student loans</li>
                        <li>• Work-study programs</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="institution">
                <div className="glass-card rounded-2xl p-8">
                  <div className="flex items-start gap-6 mb-6">
                    <img
                      src={program.institution.logo}
                      alt={program.institution.name}
                      className="w-20 h-20 rounded-2xl object-cover"
                    />
                    <div className="flex-1">
                      <h2 className="text-2xl font-bold text-[var(--edu-text-primary)] mb-2">
                        {program.institution.name}
                      </h2>
                      <div className="flex items-center gap-2 text-[var(--edu-text-secondary)] mb-4">
                        <MapPin className="w-4 h-4" />
                        <span>{program.institution.city}, {program.institution.country}</span>
                      </div>
                      <Link to={`/institution/${program.institution.id}`}>
                        <Button variant="outline" className="rounded-full">
                          View Full Profile
                          <ChevronRight className="w-4 h-4 ml-1" />
                        </Button>
                      </Link>
                    </div>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </div>

          {/* Sidebar */}
          <aside className="w-[360px] flex-shrink-0 sticky top-[145px] self-start space-y-6">
            {/* Apply Card */}
            <div className="glass-card rounded-2xl p-6">
              <div className="text-center mb-6">
                <p className="text-sm text-[var(--edu-text-secondary)] mb-2">Application Deadline</p>
                <p className="text-3xl font-bold text-[var(--edu-text-primary)] mb-1">
                  {daysLeft} days
                </p>
                <p className="text-sm text-[var(--edu-text-secondary)]">
                  {deadline.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                </p>
              </div>

              <Button
                onClick={() => setApplyDialogOpen(true)}
                className="w-full rounded-full bg-[var(--edu-blue)] hover:bg-[var(--edu-blue-hover)] text-white h-12 mb-3"
              >
                Apply now
              </Button>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setSaved(!saved)}
                  className="flex-1 border border-[var(--edu-border)] rounded-full py-2 hover:bg-[var(--edu-surface)] transition-colors"
                >
                  Save
                </button>
                <button className="flex-1 border border-[var(--edu-border)] rounded-full py-2 hover:bg-[var(--edu-surface)] transition-colors">
                  Share
                </button>
              </div>
            </div>

            {/* Institution Mini Card */}
            <div className="glass-card rounded-2xl p-6">
              <h3 className="font-semibold text-[var(--edu-text-primary)] mb-4">Institution</h3>
              <div className="flex items-center gap-3 mb-4">
                <img
                  src={program.institution.logo}
                  alt={program.institution.name}
                  className="w-12 h-12 rounded-lg object-cover"
                />
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-[var(--edu-text-primary)] line-clamp-1">
                    {program.institution.name}
                  </p>
                  <p className="text-sm text-[var(--edu-text-secondary)]">
                    {program.institution.country}
                  </p>
                </div>
              </div>
              <Link to={`/institution/${program.institution.id}`}>
                <Button variant="outline" className="w-full rounded-full">
                  View Profile
                </Button>
              </Link>
            </div>

            {/* Contact Card */}
            <div className="glass-card rounded-2xl p-6">
              <h3 className="font-semibold text-[var(--edu-text-primary)] mb-4">Contact</h3>
              <div className="space-y-3 text-sm">
                <div>
                  <p className="text-[var(--edu-text-secondary)] mb-1">Email</p>
                  <a href="#" className="text-[var(--edu-blue)] hover:underline">
                    admissions@{program.institution.id}.edu
                  </a>
                </div>
                <div>
                  <p className="text-[var(--edu-text-secondary)] mb-1">Phone</p>
                  <a href="#" className="text-[var(--edu-blue)] hover:underline">
                    +1 (555) 123-4567
                  </a>
                </div>
              </div>
            </div>
          </aside>
        </div>
      </div>

      <Footer />

      {/* Application Dialog */}
      <MultiStepDialog
        open={applyDialogOpen}
        onOpenChange={setApplyDialogOpen}
        programTitle={program.title}
      />
    </div>
  );
}
