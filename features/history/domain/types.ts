// Une conversation telle qu'affichée dans la liste de l'historique (déjà prête pour l'UI)
export type ConversationSummary = {
  id: string;
  jeuNom: string; // nom lisible du jeu (ex. "Elden Ring"), pas le slug jeu_id stocké en base
  date: string; // date de création (ISO), formatée au moment de l'affichage
};
