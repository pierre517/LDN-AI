"use client";

import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { useState } from "react";
import { MessageBubble } from "./MessageBubble";
import { ChatInput } from "./ChatInput";
import { SearchIndicator } from "./SearchIndicator";
import { QuotaReachedMessage } from "./QuotaReachedMessage";
import { TechnicalErrorMessage } from "./TechnicalErrorMessage";

type Props = {
  jeuId: string;
  gameName: string;
  console: string;
};

export function ChatWindow({ jeuId, gameName, console: consoleProp }: Props) {
  // Mémorise l'id de conversation renvoyé par le serveur après le premier message envoyé
  const [conversationId, setConversationId] = useState<string | undefined>(undefined);

  const { messages, sendMessage, status, error, clearError } = useChat({
    transport: new DefaultChatTransport({
      api: "/api/chat",
      body: { jeuId, console: consoleProp, conversationId },
    }),
    onFinish: ({ message }) => {
      const metadata = message.metadata as { conversationId?: string } | undefined;
      if (metadata?.conversationId) {
        setConversationId(metadata.conversationId);
      }
    },
  });

  // Le serveur renvoie le corps { error: "..." } (429 ou 503) tel quel dans error.message -> on le détecte ainsi
  const isQuotaReached = error?.message.includes("quota_reached") ?? false;
  const isTechnicalError = error?.message.includes("technical_error") ?? false;

  return (
    <div className="flex flex-col gap-4">
      {messages.map((message) => (
        <MessageBubble
          key={message.id}
          message={{
            id: message.id,
            conversationId: conversationId ?? "",
            role: message.role === "user" ? "user" : "assistant",
            contenu: message.parts.find((part) => part.type === "text")?.text ?? "",
            date: new Date().toISOString(),
          }}
        />
      ))}
      {/* "streaming" démarre dès le premier appel d'outil, pas seulement au premier mot du texte —
          donc tant qu'aucun texte n'est encore visible, on considère qu'une recherche est en cours */}
      {(status === "submitted" ||
        (status === "streaming" &&
          !messages[messages.length - 1]?.parts.some((part) => part.type === "text" && part.text.length > 0))) && (
        <SearchIndicator />
      )}
      {isQuotaReached ? (
        <QuotaReachedMessage />
      ) : (
        <>
          {/* Erreur technique (avant ou en plein streaming) : le message reste visible mais n'empêche pas
              de retaper une question tout de suite après, contrairement au quota qui bloque pour la journée */}
          {isTechnicalError && <TechnicalErrorMessage />}
          <ChatInput
            gameName={gameName}
            onSend={(text) => {
              if (error) clearError();
              sendMessage({ text });
            }}
          />
        </>
      )}
    </div>
  );
}
