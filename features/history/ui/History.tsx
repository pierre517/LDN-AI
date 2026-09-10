import { getHistory } from "../application/getHistory";
import { HistoryList } from "./HistoryList";

type Props = { userId: string };

// Composant serveur : va chercher l'historique de l'utilisateur puis le passe à l'affichage.
// Même schéma que GameSelector (récupération côté serveur -> composant de présentation).
export async function History({ userId }: Props) {
  const conversations = await getHistory(userId);

  return <HistoryList conversations={conversations} />;
}
