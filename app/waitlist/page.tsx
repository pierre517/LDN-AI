import { redirect } from "next/navigation";
import { requireUser } from "@/backend/middleware/auth";
import { WaitlistNotice } from "@/features/waitlist";

type Props = {
  searchParams: Promise<{ inscription?: string }>;
};

export default async function WaitlistPage({ searchParams }: Props) {
  // Session obligatoire : la page ne sert qu'à un compte connecté mais non approuvé (phase de test)
  const user = await requireUser();
  if (!user) redirect("/");

  // ?inscription=1 (posé par le signup) -> vue "choix garder/supprimer" ; sinon vue info reconnexion
  const { inscription } = await searchParams;
  const showChoice = inscription === "1";

  // Pas de Header/burger ici : un compte non approuvé n'a rien à faire dans les pages internes
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-10 bg-background px-4 py-16 text-foreground">
      <WaitlistNotice showChoice={showChoice} />
    </main>
  );
}
