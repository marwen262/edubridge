import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/app/components/ui/select';
import { NATIONALITES, getFlagEmoji } from '@/app/data/nationalites';

interface Props {
  value: string | undefined;
  onChange: (valeur: string) => void;
  id?: string;
  placeholder?: string;
}

// Radix Select — fonctionne nativement à l'intérieur d'une Dialog (gère
// correctement le focus trap et les pointer-events, contrairement à Popover).
// Typeahead natif : taper la première lettre saute aux options correspondantes.
export function NationaliteSelect({
  value,
  onChange,
  id,
  placeholder = 'Sélectionner une nationalité',
}: Props) {
  return (
    <Select value={value || undefined} onValueChange={onChange}>
      <SelectTrigger id={id} className="w-full">
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent className="max-h-[300px]">
        {NATIONALITES.map((n) => (
          <SelectItem key={n.valeur} value={n.valeur}>
            <span className="flex items-center gap-2">
              <span className="text-base leading-none">{getFlagEmoji(n.code)}</span>
              <span>{n.label}</span>
            </span>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
