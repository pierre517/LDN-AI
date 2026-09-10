"use client";

import { Loader2 } from "lucide-react";
import { useEffect, useState } from "react";

// Délai avant de basculer du libellé "recherche" à "rédaction". Approximatif (basé sur le temps,
// pas sur un vrai signal serveur) : pour un jeu à glossaire, rien n'arrive avant la traduction,
// donc on rassure l'utilisateur en suivant la séquence réelle recherche -> rédaction.
const DELAI_REDACTION_MS = 4000;

// Petit indicateur affiché pendant que l'IA prépare sa réponse (recherche puis rédaction)
export function SearchIndicator() {
  const [enRedaction, setEnRedaction] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setEnRedaction(true), DELAI_REDACTION_MS);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="flex items-center gap-2 text-xs text-muted-foreground">
      <Loader2 className="h-3 w-3 animate-spin" />
      <span>{enRedaction ? "Rédaction de la réponse..." : "Recherche en cours..."}</span>
    </div>
  );
}