import { createClient } from "@/lib/supabase/server";

// Renvoie le nombre de requêtes déjà comptabilisées aujourd'hui pour un utilisateur (0 si aucune ligne pour ce jour)
export async function getTodayUsageCount(userId: string, today: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("usage")
    .select("nb_requetes")
    .eq("user_id", userId)
    .eq("date", today)
    .maybeSingle(); // pas d'erreur renvoyée si aucune ligne n'existe encore pour aujourd'hui

  return { count: data?.nb_requetes ?? 0, error };
}

// Crée la ligne du jour (1re question) ou incrémente le compteur existant
export async function incrementTodayUsage(userId: string, today: string, currentCount: number) {
  const supabase = await createClient();

  if (currentCount === 0) {
    const { error } = await supabase.from("usage").insert({ user_id: userId, date: today, nb_requetes: 1 });
    return { error };
  }

  const { error } = await supabase
    .from("usage")
    .update({ nb_requetes: currentCount + 1 })
    .eq("user_id", userId)
    .eq("date", today);

  return { error };
}
