import { Button } from "@/components/ui/button";
import { deleteAccountAction, keepAccountAction, logoutAction } from "@/features/auth";

// Page affichée aux comptes NON approuvés (phase de test, quotas limités). Deux vues :
// - showChoice = true (juste après inscription) : décision unique garder/supprimer les données.
// - showChoice = false (reconnexion d'un compte déjà en attente) : simple info + déconnexion.
type Props = { showChoice: boolean };

export function WaitlistNotice({ showChoice }: Props) {
  if (showChoice) {
    return (
      <div className="flex w-full max-w-md flex-col gap-6 text-center">
        <h1 className="font-heading text-2xl md:text-3xl">L&apos;appli est en test</h1>

        <p className="font-sans text-sm text-muted-foreground">
          Pour des raisons de quota, on est obligés de limiter le nombre d&apos;utilisateurs pour
          l&apos;instant. Si le projet t&apos;intéresse et que tu serais d&apos;accord pour payer un
          petit abonnement, clique sur le bouton vert : on garde tes données et, quand on aura assez
          d&apos;utilisateurs potentiels, on t&apos;enverra un mail pour te prévenir que tu peux
          t&apos;inscrire. Sinon, clique sur le bouton rouge et tes données ne seront pas conservées.
        </p>

        <div className="flex flex-col gap-3">
          {/* Vert : on garde le compte (aucune suppression), simple déconnexion + retour accueil */}
          <form action={keepAccountAction}>
            <Button type="submit" className="w-full bg-green-600 text-white hover:bg-green-700">
              Ça m&apos;intéresse, gardez mes données
            </Button>
          </form>

          {/* Rouge : suppression réelle du compte (cascade FK) via l'action existante, puis accueil */}
          <form action={deleteAccountAction}>
            <Button type="submit" variant="destructive" className="w-full">
              Non merci, supprimez mes données
            </Button>
          </form>
        </div>
      </div>
    );
  }

  // Vue reconnexion : le compte existe déjà et est en liste d'attente -> on informe, sans reproposer le choix
  return (
    <div className="flex w-full max-w-md flex-col gap-6 text-center">
      <h1 className="font-heading text-2xl md:text-3xl">Compte en liste d&apos;attente</h1>

      <p className="font-sans text-sm text-muted-foreground">
        L&apos;appli est encore en test et l&apos;accès est limité pour l&apos;instant. Ton compte
        est bien enregistré : on t&apos;enverra un mail dès qu&apos;une place se libère.
      </p>

      <div className="flex flex-col gap-3">
        <form action={logoutAction}>
          <Button type="submit" className="w-full">
            Se déconnecter
          </Button>
        </form>

        {/* Option discrète pour partir définitivement (supprime réellement le compte) */}
        <form action={deleteAccountAction}>
          <Button type="submit" variant="link" className="w-full text-destructive">
            Supprimer mes données
          </Button>
        </form>
      </div>
    </div>
  );
}
