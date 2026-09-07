import Link from "next/link";

// Footer réutilisable avec les deux liens légaux (cahier des charges 4.2).
// Monté pour l'instant uniquement sur la page Historique ; rebranché ailleurs plus tard si besoin.
// className permet à la page appelante d'ajuster le placement (ex. "mt-auto" pour coller en bas).
export function Footer({ className }: { className?: string }) {
  return (
    <footer
      className={`flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-xs text-muted-foreground ${className ?? ""}`}
    >
      <Link href="/conditions-utilisation" className="hover:text-foreground hover:underline">
        Conditions d&apos;utilisation
      </Link>
      <span aria-hidden="true">·</span>
      <Link href="/politique-confidentialite" className="hover:text-foreground hover:underline">
        Politique de confidentialité
      </Link>
    </footer>
  );
}
