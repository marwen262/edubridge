import { useState, useEffect } from 'react';

const STORAGE_KEY = 'edubridge_comparaison';
const MAX_PROGRAMMES = 3;

export function useComparaison() {
  const [ids, setIds] = useState<string[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(ids));
  }, [ids]);

  const ajouter = (id: string) => {
    setIds(prev => {
      if (prev.includes(id) || prev.length >= MAX_PROGRAMMES) return prev;
      return [...prev, id];
    });
  };

  const retirer = (id: string) => {
    setIds(prev => prev.filter(i => i !== id));
  };

  const toggle = (id: string) => {
    ids.includes(id) ? retirer(id) : ajouter(id);
  };

  const estDansComparaison = (id: string) => ids.includes(id);

  const vider = () => {
    setIds([]);
    localStorage.removeItem(STORAGE_KEY);
  };

  return { ids, ajouter, retirer, toggle, estDansComparaison, vider, total: ids.length };
}
