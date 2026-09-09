// Liste blanche temporaire (phase de test) : tant qu'on limite les utilisateurs pour tenir
// dans les quotas gratuits (Groq/Tavily), seuls les emails listés dans APPROVED_EMAILS
// peuvent réellement utiliser l'appli ; les autres sont envoyés vers la page /waitlist.

// Variable obligatoire (même logique que DAILY_QUOTA) : si elle n'est pas définie, c'est une
// erreur de config, pas un cas normal. Une valeur vide reste valide (= personne d'approuvé).
export function isApprovedEmail(email: string): boolean {
  if (process.env.APPROVED_EMAILS === undefined) {
    throw new Error("APPROVED_EMAILS manquante dans les variables d'environnement");
  }

  const approved = process.env.APPROVED_EMAILS.split(",")
    .map((entry) => entry.trim().toLowerCase())
    .filter((entry) => entry.length > 0);

  return approved.includes(email.trim().toLowerCase());
}
