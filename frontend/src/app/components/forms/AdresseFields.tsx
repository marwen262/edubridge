import { Input } from '@/app/components/ui/input';
import { Label } from '@/app/components/ui/label';
import type { Adresse } from '@/types/api';

interface Props {
  value: Adresse | undefined;
  onChange: (adresse: Adresse) => void;
  /** Champs à mettre en évidence comme manquants (rouge). */
  manquants?: ReadonlyArray<keyof Adresse>;
  disabled?: boolean;
  /** Préfixe pour `id` afin d'éviter les collisions si plusieurs instances. */
  idPrefix?: string;
}

const CHAMPS: Array<{
  cle: keyof Adresse;
  label: string;
  placeholder: string;
  full?: boolean;
  required?: boolean;
}> = [
  { cle: 'rue',          label: 'Rue / Avenue',  placeholder: '12 avenue Habib Bourguiba', full: true },
  { cle: 'ville',        label: 'Ville',         placeholder: 'Tunis', required: true },
  { cle: 'gouvernorat',  label: 'Gouvernorat',   placeholder: 'Tunis' },
  { cle: 'code_postal',  label: 'Code postal',   placeholder: '1000' },
  { cle: 'pays',         label: 'Pays',          placeholder: 'Tunisie' },
];

export function AdresseFields({
  value,
  onChange,
  manquants = [],
  disabled,
  idPrefix = 'adresse',
}: Props) {
  const handleChange = (cle: keyof Adresse) => (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange({ ...(value ?? {}), [cle]: e.target.value });
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      {CHAMPS.map(({ cle, label, placeholder, full, required }) => {
        const id = `${idPrefix}-${cle}`;
        const estManquant = manquants.includes(cle);
        return (
          <div key={cle} className={full ? 'sm:col-span-2 space-y-2' : 'space-y-2'}>
            <Label htmlFor={id}>
              {label}
              {required && <span className="text-[var(--edu-danger)] ml-0.5">*</span>}
            </Label>
            <Input
              id={id}
              type="text"
              placeholder={placeholder}
              value={value?.[cle] ?? ''}
              onChange={handleChange(cle)}
              disabled={disabled}
              aria-invalid={estManquant || undefined}
              className={
                estManquant
                  ? 'border-[var(--edu-danger)] focus-visible:ring-[var(--edu-danger)]'
                  : ''
              }
            />
          </div>
        );
      })}
    </div>
  );
}
