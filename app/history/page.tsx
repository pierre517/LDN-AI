import { redirect } from "next/navigation";
import { requireUser } from "@/backend/middleware/auth";
import { History } from "@/features/history";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";

export default async function HistoryPage() {
  // Compte obligatoire partout : pas de session valide -> retour à l'accueil/connexion
  const user = await requireUser();
  if (!user) redirect("/");

  return (
    <div className="flex min-h-screen flex-col text-foreground">
      <Header />
      <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-6 px-4 py-10">
        <h1 className="font-heading text-2xl md:text-3xl">Historique</h1>
        <History userId={user.id} />
        {/* mt-auto : pousse le footer tout en bas même quand la liste est courte */}
        <Footer className="mt-auto pt-6" />
      </main>
    </div>
  );
}
