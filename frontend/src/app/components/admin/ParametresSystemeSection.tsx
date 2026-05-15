import React from 'react';
import { motion } from 'motion/react';
import { toast } from 'sonner';
import { Save, Globe, Shield, Bell, Users } from 'lucide-react';
import { Button } from '../ui/button';

const STORAGE_KEY = 'edubridge_admin_settings';

interface Parametres {
  nomPlateforme: string;
  inscriptionsOuvertes: boolean;
  maintenanceMode: boolean;
  notificationsEmail: boolean;
  demandesAutorisees: boolean;
}

const defaults: Parametres = {
  nomPlateforme: 'EduBridge',
  inscriptionsOuvertes: true,
  maintenanceMode: false,
  notificationsEmail: true,
  demandesAutorisees: true,
};

function charger(): Parametres {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? { ...defaults, ...JSON.parse(raw) } : defaults;
  } catch {
    return defaults;
  }
}

interface ToggleProps {
  checked: boolean;
  onChange: (v: boolean) => void;
}

function Toggle({ checked, onChange }: ToggleProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className="relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none"
      style={{ backgroundColor: checked ? 'var(--edu-blue)' : 'var(--edu-border)' }}
    >
      <span
        className="inline-block h-4 w-4 rounded-full bg-white shadow transition-transform"
        style={{ transform: checked ? 'translateX(22px)' : 'translateX(4px)' }}
      />
    </button>
  );
}

export function ParametresSystemeSection() {
  const [params, setParams] = React.useState<Parametres>(charger);
  const [saving, setSaving] = React.useState(false);

  const set = <K extends keyof Parametres>(key: K, value: Parametres[K]) =>
    setParams((p) => ({ ...p, [key]: value }));

  const handleSave = () => {
    setSaving(true);
    setTimeout(() => {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(params));
      setSaving(false);
      toast.success('Paramètres sauvegardés');
    }, 400);
  };

  const sections = [
    {
      icon: <Globe className="w-5 h-5" />,
      title: 'Plateforme',
      color: 'var(--edu-blue)',
      bg: 'rgba(0,113,227,0.1)',
      rows: [
        {
          label: 'Nom de la plateforme',
          description: 'Affiché dans les emails et les notifications',
          control: (
            <input
              type="text"
              value={params.nomPlateforme}
              onChange={(e) => set('nomPlateforme', e.target.value)}
              className="w-48 px-3 py-1.5 rounded-xl border border-[var(--edu-border)] bg-[var(--edu-surface)] text-sm text-[var(--edu-text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--edu-blue)]"
            />
          ),
        },
      ],
    },
    {
      icon: <Users className="w-5 h-5" />,
      title: 'Accès',
      color: 'var(--edu-indigo)',
      bg: 'rgba(99,102,241,0.1)',
      rows: [
        {
          label: 'Inscriptions ouvertes',
          description: 'Autoriser les nouveaux candidats à créer un compte',
          control: (
            <Toggle
              checked={params.inscriptionsOuvertes}
              onChange={(v) => set('inscriptionsOuvertes', v)}
            />
          ),
        },
        {
          label: 'Demandes d\'accès instituts',
          description: 'Permettre aux établissements de soumettre une demande d\'accès',
          control: (
            <Toggle
              checked={params.demandesAutorisees}
              onChange={(v) => set('demandesAutorisees', v)}
            />
          ),
        },
      ],
    },
    {
      icon: <Shield className="w-5 h-5" />,
      title: 'Maintenance',
      color: 'var(--edu-warning)',
      bg: 'rgba(255,159,10,0.1)',
      rows: [
        {
          label: 'Mode maintenance',
          description: 'Affiche une page de maintenance aux visiteurs non-admin',
          control: (
            <Toggle
              checked={params.maintenanceMode}
              onChange={(v) => set('maintenanceMode', v)}
            />
          ),
        },
      ],
    },
    {
      icon: <Bell className="w-5 h-5" />,
      title: 'Notifications',
      color: 'var(--edu-success)',
      bg: 'rgba(52,199,89,0.1)',
      rows: [
        {
          label: 'Notifications par email',
          description: 'Envoyer des emails automatiques lors des événements clés',
          control: (
            <Toggle
              checked={params.notificationsEmail}
              onChange={(v) => set('notificationsEmail', v)}
            />
          ),
        },
      ],
    },
  ];

  return (
    <div>
      {/* Header */}
      <div className="bg-white dark:bg-[#1D1D1F] border-b border-[var(--edu-border)] px-8 py-6">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-[var(--edu-text-tertiary)] mb-1">
              ADMINISTRATION
            </p>
            <h1 className="text-3xl font-bold text-[var(--edu-text-primary)]">Paramètres système</h1>
            <p className="text-sm text-[var(--edu-text-secondary)] mt-1">
              Configuration globale de la plateforme
            </p>
          </div>
          <Button
            onClick={handleSave}
            disabled={saving}
            className="rounded-full text-white"
            style={{ backgroundColor: 'var(--edu-indigo)' }}
          >
            <Save className="w-4 h-4 mr-2" />
            {saving ? 'Sauvegarde…' : 'Sauvegarder'}
          </Button>
        </div>
      </div>

      <div className="p-8 space-y-5 max-w-3xl">
        {sections.map((sec, si) => (
          <motion.div
            key={sec.title}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: si * 0.07, duration: 0.3 }}
            className="bg-white dark:bg-[#1D1D1F] rounded-2xl border border-[var(--edu-border)] overflow-hidden"
          >
            {/* Section header */}
            <div className="px-6 py-4 border-b border-[var(--edu-border)] flex items-center gap-3">
              <div className="p-2 rounded-xl" style={{ backgroundColor: sec.bg }}>
                <span style={{ color: sec.color }}>{sec.icon}</span>
              </div>
              <span className="text-sm font-semibold text-[var(--edu-text-primary)]">{sec.title}</span>
            </div>

            {/* Rows */}
            <div className="divide-y divide-[var(--edu-divider)]">
              {sec.rows.map((row) => (
                <div key={row.label} className="px-6 py-4 flex items-center justify-between gap-6">
                  <div>
                    <p className="text-sm font-medium text-[var(--edu-text-primary)]">{row.label}</p>
                    <p className="text-xs text-[var(--edu-text-secondary)] mt-0.5">{row.description}</p>
                  </div>
                  {row.control}
                </div>
              ))}
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
