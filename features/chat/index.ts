// Façade publique de la feature chat : seul point d'entrée utilisable depuis app/ et backend/
export { ChatWindow } from "./ui/ChatWindow";
export { streamChatWithFallback } from "./infrastructure/groqClient";
export { buildSystemPrompt } from "./application/buildSystemPrompt";
export { createSearchGameWikiTool } from "./application/searchTool";
