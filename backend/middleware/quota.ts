import { getTodayUsageCount, incrementTodayUsage } from "@/backend/models/usage";

// Variable obligatoire (voir .env.example) — on échoue bruyamment plutôt que de deviner une valeur
if (!process.env.DAILY_QUOTA) {
  throw new Error("La variable d'environnement DAILY_QUOTA est manquante (voir .env.example)");
}
const DAILY_QUOTA = Number(process.env.DAILY_QUOTA);

// Vérifie le quota du jour puis l'incrémente si la question est acceptée.
// Renvoie false si la limite est déjà atteinte : la requête ne doit pas être traitée.
export async function enforceQuota(userId: string): Promise<boolean> {
  const today = new Date().toISOString().slice(0, 10); // format YYYY-MM-DD attendu par la colonne `date`

  const { count, error: readError } = await getTodayUsageCount(userId, today);
  if (readError) {
    console.error("Erreur lecture quota :", readError);
    return true; // souci technique de notre côté -> on ne pénalise pas l'utilisateur (§13.1 cahier des charges)
  }

  if (count >= DAILY_QUOTA) return false;

  const { error: writeError } = await incrementTodayUsage(userId, today, count);
  if (writeError) console.error("Erreur écriture quota :", writeError);

  return true;
}
