import { getPseudo } from "../infrastructure/profileClient";
import type { AccountInfo } from "../domain/types";

// Assemble les infos de compte à afficher : pseudo (table profiles) + email (déjà connu via la session).
export async function getAccountInfo(userId: string, email: string): Promise<AccountInfo> {
  const pseudo = await getPseudo(userId);

  return {
    pseudo: pseudo ?? "—", // fallback improbable : un profil est créé à l'inscription, mais on n'affiche jamais "null"
    email,
  };
}
