import { redirect } from "next/navigation";
import { requireUser } from "@/backend/middleware/auth";
import { GameSelector } from "@/features/game-selector";
import { Header } from "@/components/Header";

export default async function NouveauChatPage() {
  // Compte obligatoire partout : pas de session valide -> retour à l'accueil/connexion
  const user = await requireUser();
  if (!user) redirect("/");

  return (
    <div className="flex min-h-screen flex-col text-foreground">
      <Header />
      <main className="mx-auto flex w-full max-w-md flex-1 flex-col gap-8 px-4 py-10">
        <h1 className="font-heading text-2xl">Nouveau chat</h1>
        <GameSelector />
      </main>
    </div>
  );
}
