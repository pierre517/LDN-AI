import { redirect } from "next/navigation";
import { requireUser } from "@/backend/middleware/auth";
import { validateGameId } from "@/features/game-selector";
import { ChatWindow } from "@/features/chat";
import { Header } from "@/components/Header";

type Props = {
  searchParams: Promise<{ jeuId?: string; console?: string }>;
};

export default async function ConversationPage({ searchParams }: Props) {
  const user = await requireUser();
  if (!user) redirect("/");

  const { jeuId, console: consoleName } = await searchParams;
  const game = jeuId ? validateGameId(jeuId) : null;

  // Le formulaire "Nouveau chat" n'est jamais mémorisé -> sans jeu/console valides, on y renvoie l'utilisateur
  if (!game || !consoleName) redirect("/chat");

  return (
    <div className="flex min-h-screen flex-col text-foreground">
      <Header />
      <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-6 px-4 py-10">
        <h1 className="font-heading text-2xl md:text-3xl">{game.nom}</h1>
        <ChatWindow jeuId={game.id} gameName={game.nom} console={consoleName} />
      </main>
    </div>
  );
}
