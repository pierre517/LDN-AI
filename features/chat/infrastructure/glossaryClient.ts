import { createClient } from "@/lib/supabase/server";

const DUREE_GLOSSAIRE_JOURS = 60;

// Cherche les traductions déjà connues pour une liste de noms anglais (une seule requête groupée,
// jamais un appel par nom — cf. cahier des charges section sur la traduction)
export async function getKnownTranslations(jeuId: string, termesAnglais: string[]) {
  if (termesAnglais.length === 0) return {};

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("glossaire_termes")
    .select("terme_anglais, terme_francais")
    .eq("jeu_id", jeuId)
    .in("terme_anglais", termesAnglais)
    .gt("expiration", new Date().toISOString());

  if (error) {
    console.error("Erreur lecture glossaire_termes:", error);
    return {};
  }
  if (!data) return {};

  // Transforme le tableau de lignes en dictionnaire { terme anglais -> terme français }
  return Object.fromEntries(data.map((ligne) => [ligne.terme_anglais, ligne.terme_francais]));
}

// Enregistre une nouvelle traduction trouvée, pour que les prochains utilisateurs la réutilisent
export async function saveGlossaryTerm(jeuId: string, termeAnglais: string, termeFrancais: string) {
  const supabase = await createClient();
  const expiration = new Date(Date.now() + DUREE_GLOSSAIRE_JOURS * 24 * 60 * 60 * 1000);

  const { error } = await supabase.from("glossaire_termes").insert({
    jeu_id: jeuId,
    terme_anglais: termeAnglais,
    terme_francais: termeFrancais,
    expiration: expiration.toISOString(),
  });

  if (error) console.error("Erreur écriture glossaire_termes:", error);
  return { error };
}