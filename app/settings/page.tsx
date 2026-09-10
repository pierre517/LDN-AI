import { redirect } from "next/navigation";
import { requireUser } from "@/backend/middleware/auth";
import { Settings } from "@/features/settings";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";

export default async function SettingsPage() {
  // Compte obligatoire partout : pas de session valide -> retour à l'accueil/connexion
  const user = await requireUser();
  if (!user) redirect("/");

  return (
    <div className="flex min-h-screen flex-col text-foreground">
      <Header />
      <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-8 px-4 py-10">
        <div className="flex flex-col gap-1">
          <p className="font-mono text-xs uppercase tracking-wide text-muted-foreground">Compte</p>
          <h1 className="font-heading text-2xl md:text-3xl">Paramètres</h1>
        </div>
        <Settings userId={user.id} email={user.email} />
        {/* mt-auto : colle le footer en bas même quand le contenu est court */}
        <Footer className="mt-auto pt-6" />
      </main>
    </div>
  );
}
