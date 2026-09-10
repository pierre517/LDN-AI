// Façade publique de la feature chat : seul point d'entrée utilisable depuis app/ et backend/
export { ChatWindow } from "./ui/ChatWindow";
export { ANSWER_MODEL, streamTranslation } from "./infrastructure/groqClient";
export { buildSystemPrompt } from "./application/buildSystemPrompt";
export { buildTranslationPrompt } from "./application/buildTranslationPrompt";
export { findGlossaryMatches } from "./application/matchGlossaryTerms";
export { createSearchGameWikiTool } from "./application/searchTool";
