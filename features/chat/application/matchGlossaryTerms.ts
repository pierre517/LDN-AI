import type { Glossary } from "@/features/game-selector";

// Une paire du glossaire retenue parce que son nom anglais apparaît dans le texte
export type GlossaryMatch = { en: string; fr: string };

// Longueur minimale d'un nom anglais pour être cherché : évite le bruit des clés très courtes
// (ex. une clé de 2 lettres matcherait un peu partout), sans vrai risque de rater un nom propre.
const LONGUEUR_MIN = 3;

// Repère les noms du glossaire réellement présents dans la réponse anglaise, pour n'injecter
// que ces paires dans le prompt de traduction (le glossaire complet ferait exploser les tokens).
export function findGlossaryMatches(texteAnglais: string, glossaire: Glossary): GlossaryMatch[] {
  const texte = texteAnglais.toLowerCase();
  const matches: GlossaryMatch[] = [];

  for (const [en, fr] of Object.entries(glossaire)) {
    if (en.length < LONGUEUR_MIN) continue;
    // Matching par sous-chaîne : les clés sont surtout des expressions distinctives (ex. "Erdtree's Favor")
    if (texte.includes(en.toLowerCase())) {
      matches.push({ en, fr });
    }
  }

  return matches;
}
