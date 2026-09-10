import { CircleAlert } from "lucide-react";

// Message générique affiché pour toute erreur technique (Groq/Tavily/Supabase injoignable) -
// jamais de détail technique brut affiché à l'utilisateur (cahier des charges 13.1)
export function TechnicalErrorMessage() {
  return (
    <div className="flex items-center gap-2 rounded-lg bg-card p-4 text-sm text-muted-foreground">
      <CircleAlert className="h-4 w-4 shrink-0 text-primary" />
      <p>Un souci technique est survenu, réessaie dans quelques instants.</p>
    </div>
  );
}
