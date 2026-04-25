import { useFavoris, useToggleFavori } from '@/hooks/useFavoris';
import { useAuth } from '@/context/AuthContext';
import { toast } from 'sonner';

// Hook utilitaire : indique si un programme est en favori pour l'utilisateur connecté.
// Combine la lecture (useFavoris) et la mutation (useToggleFavori).
// Si non authentifié, redirige vers /login avec un toast explicatif.
export function useFavoriStatus(programmeId: string) {
  const { favoris, loading, refetch } = useFavoris();
  const { toggle, loading: toggleLoading } = useToggleFavori();
  const { isAuthenticated } = useAuth();

  const isFavori = favoris.some((f) => f.programme_id === programmeId);

  const handleToggle = async () => {
    if (!isAuthenticated) {
      toast.error('Connectez-vous pour ajouter aux favoris');
      window.location.href = '/login';
      return;
    }
    if (!programmeId) return;
    try {
      const added = await toggle(programmeId);
      toast.success(added ? 'Ajouté aux favoris' : 'Retiré des favoris');
      refetch();
    } catch {
      toast.error('Erreur lors de la mise à jour des favoris');
    }
  };

  return {
    isFavori,
    loading: loading || toggleLoading,
    handleToggle,
  };
}
