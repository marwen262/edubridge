import { useMemo } from 'react';
import { Input } from '@/app/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/app/components/ui/select';
import {
  INDICATIFS,
  INDICATIF_DEFAUT,
  composerTelephone,
  decomposerTelephone,
} from '@/app/data/indicatifs';
import { getFlagEmoji } from '@/app/data/nationalites';

interface Props {
  /** Numéro complet stocké (ex: '+21698765432') */
  value: string | undefined;
  /** Callback avec le numéro complet recomposé */
  onChange: (numeroComplet: string) => void;
  id?: string;
  placeholder?: string;
}

// Radix Select pour l'indicatif (fiable dans une Dialog) + Input texte pour
// le numéro local. Le numéro complet (+216...) est recomposé à chaque change.
export function IndicatifTelephone({
  value,
  onChange,
  id,
  placeholder = '12 345 678',
}: Props) {
  const { indicatif, numero } = useMemo(() => decomposerTelephone(value), [value]);
  const indicatifCourant = indicatif || INDICATIF_DEFAUT;

  // Plusieurs entrées partagent un même `code` (+1 = US/CA). On garde l'iso
  // dans la valeur du Select pour distinguer, puis on extrait le code.
  const valeurSelect = INDICATIFS.find((i) => i.code === indicatifCourant)?.iso ?? 'TN';

  const handleIndicatifChange = (iso: string) => {
    const entree = INDICATIFS.find((i) => i.iso === iso);
    if (!entree) return;
    onChange(composerTelephone(entree.code, numero));
  };

  const handleNumeroChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const sansEspaces = e.target.value.replace(/[^0-9]/g, '');
    onChange(composerTelephone(indicatifCourant, sansEspaces));
  };

  return (
    <div className="flex gap-2">
      <Select value={valeurSelect} onValueChange={handleIndicatifChange}>
        <SelectTrigger className="w-[140px] flex-shrink-0 font-mono text-xs">
          <SelectValue />
        </SelectTrigger>
        <SelectContent className="max-h-[300px]">
          {INDICATIFS.map((i) => (
            <SelectItem key={i.iso} value={i.iso}>
              <span className="flex items-center gap-2">
                <span className="text-sm leading-none">{getFlagEmoji(i.iso)}</span>
                <span className="font-mono text-xs">{i.code}</span>
                <span className="text-xs text-muted-foreground truncate">{i.pays}</span>
              </span>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Input
        id={id}
        type="tel"
        inputMode="numeric"
        autoComplete="tel-national"
        placeholder={placeholder}
        value={numero}
        onChange={handleNumeroChange}
        className="flex-1"
      />
    </div>
  );
}
