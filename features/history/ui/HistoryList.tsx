import Link from "next/link";
import { Card } from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";
import type { ConversationSummary } from "../domain/types";

type Props = { conversations: ConversationSummary[] };

// Formate une date ISO en date française lisible (ex. "7 septembre 2026")
function formaterDate(dateIso: string) {
  return new Date(dateIso).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export function HistoryList({ conversations }: Props) {
  // État vide explicite : un utilisateur sans historique voit un message clair, jamais une erreur (cahier des charges 4.2)
  if (conversations.length === 0) {
    return (
      <div className="flex flex-col items-center gap-4 py-16 text-center">
        <p className="font-heading text-lg">Aucune conversation pour le moment</p>
        <p className="text-sm text-muted-foreground">
          Tes conversations passées apparaîtront ici une fois que tu auras commencé à discuter.
        </p>
        <Link href="/chat" className={buttonVariants()}>
          Démarrer une conversation
        </Link>
      </div>
    );
  }

  return (
    <ul className="flex flex-col gap-3">
      {conversations.map((conversation) => (
        <li key={conversation.id}>
          {/* Non cliquable pour l'instant : rouvrir une conversation existante est un autre chantier (route conversation/[id] + chargement des messages) */}
          <Card size="sm" className="flex flex-row items-center justify-between px-4">
            <p className="font-heading text-base">{conversation.jeuNom}</p>
            <time dateTime={conversation.date} className="font-mono text-xs text-muted-foreground">
              {formaterDate(conversation.date)}
            </time>
          </Card>
        </li>
      ))}
    </ul>
  );
}
