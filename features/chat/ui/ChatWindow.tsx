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
  antiSpoil: boolean;
};

export function ChatWindow({ jeuId, gameName, console: consoleProp, antiSpoil }: Props) {
  // Mémorise l'id de conversation renvoyé par le serveur après le premier message envoyé
  const [conversationId, setConversationId] = useState<string | undefined>(undefined);

  const { messages, sendMessage, status } = useChat({
    transport: new DefaultChatTransport({
      api: "/api/chat",
      body: { jeuId, console: consoleProp, antiSpoil, conversationId },
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
      {status === "submitted" && <SearchIndicator />}
      <ChatInput gameName={gameName} onSend={(text) => sendMessage({ text })} />
    </div>
  );
}
