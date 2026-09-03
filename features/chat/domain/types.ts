export type Message = {
  id: string;
  conversationId: string;
  role: "user" | "assistant";
  contenu: string;
  date: string;
};

export type Conversation = {
  id: string;
  userId: string;
  jeuId: string;
  date: string;
};