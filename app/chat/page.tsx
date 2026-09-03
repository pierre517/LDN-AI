import { redirect } from "next/navigation";
import { requireUser } from "@/backend/middleware/auth";
import { GameSelector } from "@/features/game-selector";

export default async function NouveauChatPage() {
  // Compte obligatoire partout : pas de session valide -> retour à l'accueil/connexion
  const user = await requireUser();
  if (!user) redirect("/");

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col gap-8 px-4 py-10 text-foreground">
      <h1 className="font-heading text-2xl">Nouveau chat</h1>
      <GameSelector />
    </main>
  );
}
