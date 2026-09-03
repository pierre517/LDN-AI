import type { NextRequest } from "next/server";
import { handleChatMessage } from "@/backend/controllers/chatController";

// Point d'entrée fin imposé par Next.js — toute la logique vit dans le controller (LDN-55)
export async function POST(request: NextRequest) {
  return handleChatMessage(request);
}