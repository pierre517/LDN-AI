import { Loader2 } from "lucide-react";

// Petit indicateur affiché pendant que l'IA effectue une recherche
export function SearchIndicator() {
  return (
    <div className="flex items-center gap-2 text-xs text-muted-foreground">
      <Loader2 className="h-3 w-3 animate-spin" />
      Recherche en cours...
    </div>
  );
}