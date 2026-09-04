import { createClient } from "@/lib/supabase/server";
import type { TavilySearchResult } from "./tavilyClient";

const DUREE_CACHE_JOURS = 30;

// Même question posée avec une casse ou des espaces différents -> même entrée de cache
function normaliserQuestion(question: string) {
  return question.trim().toLowerCase();
}

// Cherche une recherche déjà en cache pour ce jeu et cette question, si elle n'a pas expiré
export async function getCachedResults(jeuId: string, question: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("cache_recherches")
    .select("resultats")
    .eq("jeu_id", jeuId)
    .eq("question_normalisee", normaliserQuestion(question))
    .gt("expiration", new Date().toISOString())
    .maybeSingle(); // pas d'erreur si 0 résultat (cache miss) contrairement à .single()

  if (error || !data) return null;
  return data.resultats as TavilySearchResult[];
}

// Enregistre une nouvelle recherche en cache, pour que la prochaine personne posant
// la même question sur ce jeu ne refasse pas d'appel Tavily
export async function saveCachedResults(jeuId: string, question: string, resultats: TavilySearchResult[]) {
  const supabase = await createClient();
  const expiration = new Date(Date.now() + DUREE_CACHE_JOURS * 24 * 60 * 60 * 1000);

  const { error } = await supabase.from("cache_recherches").insert({
    jeu_id: jeuId,
    question_normalisee: normaliserQuestion(question),
    resultats,
    expiration: expiration.toISOString(),
  });

  return { error };
}