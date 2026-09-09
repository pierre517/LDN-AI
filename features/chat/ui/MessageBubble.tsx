import { Streamdown } from "streamdown";
import "streamdown/styles.css";
import type { Message } from "@/features/chat/domain/types";

type Props = { message: Message };

// Affiche un message, avec un style différent selon que c'est l'utilisateur ou l'assistant
export function MessageBubble({ message }: Props) {
  const isUser = message.role === "user";

  return (
    <div className={isUser ? "flex justify-end" : "flex flex-col gap-1"}>
      {!isUser && <span className="font-mono text-xs text-muted-foreground">LDN·AI</span>}
      {isUser ? (
        <div className="max-w-[80%] rounded-full bg-secondary px-4 py-2 text-sm">
          <p>{message.contenu}</p>
        </div>
      ) : (
        // Réponse IA rendue en Markdown ; streamdown gère proprement le Markdown incomplet pendant le streaming
        <div className="rounded-lg bg-card p-4 text-sm">
          <Streamdown>{message.contenu}</Streamdown>
        </div>
      )}
    </div>
  );
}