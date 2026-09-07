import { redirect } from "next/navigation";
import { requireUser } from "@/backend/middleware/auth";
import { validateGameId } from "@/features/game-selector";
import { getConversation } from "@/backend/models/conversations";
import { getMessages } from "@/backend/models/messages";
import { ChatWindow } from "@/features/chat";

type Props = {
  params: Promise<{ id: string }>;
};

export default async function ExistingConversationPage({ params }: Props) {
  const user = await requireUser();
  if (!user) redirect("/");

  const { id } = await params;

  // Vérifie que la conversation existe ET appartient bien à l'utilisateur (jamais confiance au seul id de l'URL)
  const { data: conversation } = await getConversation(id, user.id);
  if (!conversation) redirect("/history");

  const game = validateGameId(conversation.jeu_id);
  if (!game) redirect("/history");

  // Recharge les messages passés pour réinjecter le contexte dans le chat
  const { data: messagesData } = await getMessages(id);
  const initialMessages = (messagesData ?? []).map((message) => ({
    id: message.id,
    role: message.role as "user" | "assistant",
    contenu: message.contenu,
  }));

  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col gap-6 px-4 py-10 text-foreground">
      <h1 className="font-heading text-2xl">{game.nom}</h1>
      <ChatWindow
        jeuId={game.id}
        gameName={game.nom}
        // console peut être null pour une ancienne conversation -> "" (buildSystemPrompt omettra la plateforme)
        console={conversation.console ?? ""}
        initialMessages={initialMessages}
        initialConversationId={conversation.id}
      />
    </main>
  );
}
