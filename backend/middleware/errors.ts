const RETRY_DELAY_MS = 500;

function wait(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Exécute fn(), retente une seule fois après un court délai si ça échoue, puis abandonne :
// ne relance jamais le détail technique brut, seulement un code générique exploitable par l'appelant.
export async function withRetry<T>(fn: () => Promise<T>, label: string): Promise<T> {
  try {
    return await fn();
  } catch (firstError) {
    console.error(`Erreur technique (${label}), nouvelle tentative dans ${RETRY_DELAY_MS}ms :`, firstError);
    await wait(RETRY_DELAY_MS);

    try {
      return await fn();
    } catch (secondError) {
      console.error(`Erreur technique (${label}) persistante après retry :`, secondError);
      throw new Error("technical_error");
    }
  }
}
