import { LogOut, ChevronRight } from "lucide-react";
import { Card } from "@/components/ui/card";
import { logoutAction } from "@/features/auth";
import { getAccountInfo } from "../application/getAccountInfo";
import { DeleteAccountDialog } from "./DeleteAccountDialog";

type Props = { userId: string; email: string };

// Composant serveur : récupère les infos de compte puis affiche les 3 sections de la page Paramètres.
export async function Settings({ userId, email }: Props) {
  const account = await getAccountInfo(userId, email);

  return (
    <div className="flex flex-col gap-8">
      {/* PROFIL : juste le pseudo + l'email, pas d'avatar */}
      <section className="flex flex-col gap-3">
        <h2 className="font-mono text-xs uppercase tracking-wide text-muted-foreground">Profil</h2>
        <Card size="sm" className="gap-1 px-4">
          <p className="font-heading text-base">{account.pseudo}</p>
          <p className="text-sm text-muted-foreground">{account.email}</p>
        </Card>
      </section>

      {/* SESSION : déconnexion via Server Action (form action) — invalide la session puis redirige vers l'accueil */}
      <section className="flex flex-col gap-3">
        <h2 className="font-mono text-xs uppercase tracking-wide text-muted-foreground">Session</h2>
        <Card size="sm" className="p-0">
          <form action={logoutAction}>
            <button
              type="submit"
              className="flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-muted"
            >
              <LogOut className="size-5 text-muted-foreground" />
              <span className="flex flex-col">
                <span className="text-sm font-medium">Déconnexion</span>
                <span className="text-xs text-muted-foreground">Invalide la session en cours</span>
              </span>
              <ChevronRight className="ml-auto size-4 text-muted-foreground" />
            </button>
          </form>
        </Card>
      </section>

      {/* ZONE DE DANGER : ligne + dialog de confirmation (LDN-87) ; la suppression réelle sera câblée en LDN-88 */}
      <section className="flex flex-col gap-3">
        <h2 className="font-mono text-xs uppercase tracking-wide text-destructive">Zone de danger</h2>
        <Card size="sm" className="p-0 ring-destructive/30">
          <DeleteAccountDialog />
        </Card>
      </section>
    </div>
  );
}
