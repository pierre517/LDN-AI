import { redirect } from "next/navigation";
import { requireUser } from "@/backend/middleware/auth";
import { History } from "@/features/history";
import { Footer } from "@/components/Footer";

export default async function HistoryPage() {
  // Compte obligatoire partout : pas de session valide -> retour à l'accueil/connexion
  const user = await requireUser();
  if (!user) redirect("/");

  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col gap-6 px-4 py-10 text-foreground">
      <h1 className="font-heading text-2xl">Historique</h1>
      <History userId={user.id} />
      {/* mt-auto : pousse le footer tout en bas même quand la liste est courte */}
      <Footer className="mt-auto pt-6" />
    </main>
  );
}
