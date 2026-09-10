import { createAdminClient } from "@/lib/supabase/admin";
import type { TavilySearchResult } from "./tavilyClient";

const DUREE_CACHE_JOURS = 30;

// Même question posée avec une casse, une ponctuation ou des espaces différents -> même entrée de cache
function normaliserQuestion(question: string) {
  return question
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, "") // retire la ponctuation, garde lettres (accents inclus) et chiffres
    .replace(/\s+/g, " ")
    .trim();
}

// Cherche une recherche déjà en cache pour ce jeu et cette question, si elle n'a pas expiré
export async function getCachedResults(jeuId: string, question: string) {
  // Client admin (service_role) : cache partagé côté backend, jamais écrit depuis le navigateur d'un utilisateur
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("cache_recherches")
    .select("resultats")
    .eq("jeu_id", jeuId)
    .eq("question_normalisee", normaliserQuestion(question))
    .gt("expiration", new Date().toISOString())
    .maybeSingle(); // pas d'erreur si 0 résultat (cache miss) contrairement à .single()

  if (error) {
    console.error("Erreur lecture cache_recherches:", error);
    return null;
  }
  if (!data) return null; // cache miss normal, rien à logger

  const resultats = data.resultats as TavilySearchResult[];
  // Une vieille entrée vide (recherche ratée cachée par erreur) ne doit pas bloquer la question 30 jours
  if (resultats.length === 0) return null;

  return resultats;
}

// Enregistre une nouvelle recherche en cache, pour que la prochaine personne posant
// la même question sur ce jeu ne refasse pas d'appel Tavily
export async function saveCachedResults(jeuId: string, question: string, resultats: TavilySearchResult[]) {
  // Jamais de résultat vide en cache : ça resservirait "rien" pendant 30 jours pour cette question
  if (resultats.length === 0) return { error: null };

  const supabase = createAdminClient();
  const expiration = new Date(Date.now() + DUREE_CACHE_JOURS * 24 * 60 * 60 * 1000);

  const { error } = await supabase.from("cache_recherches").insert({
    jeu_id: jeuId,
    question_normalisee: normaliserQuestion(question),
    resultats,
    expiration: expiration.toISOString(),
  });

  if (error) console.error("Erreur écriture cache_recherches:", error);
  return { error };
}