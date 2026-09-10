import { CircleAlert } from "lucide-react";

// Message dédié quand l'utilisateur a atteint sa limite de questions du jour (distinct d'une erreur technique)
export function QuotaReachedMessage() {
  return (
    <div className="flex items-center gap-2 rounded-lg bg-card p-4 text-sm text-muted-foreground">
      <CircleAlert className="h-4 w-4 shrink-0 text-primary" />
      <p>Tu as atteint ta limite de questions pour aujourd&apos;hui. Reviens demain pour continuer la conversation !</p>
    </div>
  );
}
