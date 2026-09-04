"use client";

import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { useState } from "react";
import { MessageBubble } from "./MessageBubble";
import { ChatInput } from "./ChatInput";
import { SearchIndicator } from "./SearchIndicator";

type Props = {
  jeuId: string;
  gameName: string;
  console: string;
};

export function ChatWindow({ jeuId, gameName, console: consoleProp }: Props) {
  // Mémorise l'id de conversation renvoyé par le serveur après le premier message envoyé
  const [conversationId, setConversationId] = useState<string | undefined>(undefined);

  const { messages, sendMessage, status } = useChat({
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
      <ChatInput gameName={gameName} onSend={(text) => sendMessage({ text })} />
    </div>
  );
}
