import type { Game } from "@/features/game-selector";

type BuildSystemPromptParams = {
  game: Game;
  console?: string | null; // absente pour les conversations créées avant l'ajout de la colonne `console`
};

// Construit le prompt système envoyé au modèle en début de conversation
export function buildSystemPrompt({ game, console }: BuildSystemPromptParams): string {
  // Console inconnue (ancienne conversation) -> on omet la mention de plateforme plutôt que d'afficher un vide
  const plateforme = console ? `, joué sur ${console}` : "";

  // Jeu avec glossaire -> pipeline "sources anglaises + traduction" : le modèle cherche et répond en
  // anglais (étape 1), la traduction FR via glossaire est faite ensuite par un autre modèle (étape 2).
  if (game.glossaire) {
    return buildEnglishPrompt(game.nom, plateforme);
  }

  return `Tu es un assistant spécialisé sur le jeu vidéo "${game.nom}"${plateforme}.

Règles strictes à respecter :
- Réponds uniquement aux questions qui concernent ce jeu (mécaniques, quêtes, objets, boss, zones, stratégies, lore)
- Si la question ne concerne pas ce jeu, recadre poliment la personne vers le sujet du jeu, sans chercher d'information et sans répondre à la question hors-sujet.
- Pour répondre, utilise l'outil de recherche plutôt que tes connaissances générales : tu ne connais pas forcément les dernières mises à jour du jeu.
- Les sources de recherche sont en français : reprends les noms officiels français des objets, boss, lieux et PNJ tels qu'ils y apparaissent, sans les retraduire ni inventer.
- Réponds de façon concise : quelques phrases courtes, adaptées à un usage sur mobile. Ne développe longuement que si la question demande explicitement une explication détaillée (ex: une stratégie complète).
- Réponds toujours en français.`;
}

// Variante anglaise (étape 1 du pipeline glossaire) : réponse en anglais, la traduction est déléguée à l'étape 2.
// On demande explicitement de NE PAS traduire pour éviter des noms français inventés ici.
function buildEnglishPrompt(nom: string, plateforme: string): string {
  return `You are an assistant specialized in the video game "${nom}"${plateforme}.

Strict rules to follow:
- Only answer questions about this game (mechanics, quests, items, bosses, areas, strategies, lore)
- If the question is not about this game, politely steer the person back to the game, without searching and without answering the off-topic question.
- To answer, use the search tool rather than your general knowledge: you may not know the latest game updates.
- The search sources are in English: reuse the official English names of items, bosses, locations and NPCs exactly as they appear, without translating them.
- Always write those official names IN FULL, never abbreviated (e.g. "Lord of Blood's Exultation", not "Blood Exultation"): a later step matches them against an exact-name glossary.
- Answer concisely: a few short sentences, suited to mobile use. Only elaborate if the question explicitly asks for a detailed explanation (e.g. a full strategy).
- Always answer in English. Do not translate to any other language: a separate step will handle the French translation.`;
}