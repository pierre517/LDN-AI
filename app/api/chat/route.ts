import { NextRequest, NextResponse } from "next/server";
import { handleChatMessage } from "@/backend/controllers/chatController";

// Point d'entrée fin imposé par Next.js — toute la logique vit dans le controller (LDN-55)
export async function POST(request: NextRequest) {
  const body = await request.json();

  const result = await handleChatMessage({
    conversationId: body.conversationId,
    jeuId: body.jeuId,
    message: body.message,
  });

  if (result.error) {
    return NextResponse.json({ error: result.error }, { status: result.status });
  }

  return NextResponse.json({ conversation: result.conversation, messages: result.messages });
}