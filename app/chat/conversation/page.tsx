import { redirect } from "next/navigation";
import { requireUser } from "@/backend/middleware/auth";
import { validateGameId } from "@/features/game-selector/application/validateGameId";
import { ChatWindow } from "@/features/chat";

type Props = {
  searchParams: Promise<{ jeuId?: string; console?: string; antiSpoil?: string }>;
};

export default async function ConversationPage({ searchParams }: Props) {
  const user = await requireUser();
  if (!user) redirect("/");

  const { jeuId, console: consoleName, antiSpoil } = await searchParams;
  const game = jeuId ? validateGameId(jeuId) : null;

  // Le formulaire "Nouveau chat" n'est jamais mémorisé -> sans jeu/console valides, on y renvoie l'utilisateur
  if (!game || !consoleName) redirect("/chat");

  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col gap-6 px-4 py-10 text-foreground">
      <h1 className="font-heading text-2xl">{game.nom}</h1>
      <ChatWindow jeuId={game.id} gameName={game.nom} console={consoleName} antiSpoil={antiSpoil === "true"} />
    </main>
  );
}
