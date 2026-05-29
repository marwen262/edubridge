import { useState, useEffect } from 'react';

const STORAGE_KEY = 'edubridge_comparaison';
const MAX_PROGRAMMES = 3;
const SYNC_EVENT = 'edubridge-comparaison-changed';

function lireStorage(): string[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

function ecrireStorage(ids: string[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(ids));
  window.dispatchEvent(new Event(SYNC_EVENT));
}

export function useComparaison() {
  const [ids, setIds] = useState<string[]>(lireStorage);

  useEffect(() => {
    const handler = () => setIds(lireStorage());
    window.addEventListener(SYNC_EVENT, handler);
    return () => window.removeEventListener(SYNC_EVENT, handler);
  }, []);

  const ajouter = (id: string) => {
    const current = lireStorage();
    if (current.includes(id) || current.length >= MAX_PROGRAMMES) return;
    const next = [...current, id];
    ecrireStorage(next);
    setIds(next);
  };

  const retirer = (id: string) => {
    const next = lireStorage().filter(i => i !== id);
    ecrireStorage(next);
    setIds(next);
  };

  const toggle = (id: string) => {
    lireStorage().includes(id) ? retirer(id) : ajouter(id);
  };

  const estDansComparaison = (id: string) => ids.includes(id);

  const vider = () => {
    localStorage.removeItem(STORAGE_KEY);
    window.dispatchEvent(new Event(SYNC_EVENT));
    setIds([]);
  };

  return { ids, ajouter, retirer, toggle, estDansComparaison, vider, total: ids.length };
}
