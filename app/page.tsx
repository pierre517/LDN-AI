import { createClient } from "@/lib/supabase/server";

export default async function Home() {
  const supabase = await createClient();
  const { error } = await supabase.from("profiles").select("id").limit(1);

  const connected = !error || error.code === "42501"; // 42501 = permission denied, preuve que la connexion marche

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background text-foreground">
      <h1 className="font-heading text-4xl">LDN·IA</h1>
      <p className="font-mono text-sm text-muted-foreground">
        {connected
          ? "Connexion Supabase OK (accès à profiles bien refusé pour un visiteur non connecté, comme attendu)"
          : `Erreur inattendue : ${error?.message}`}
      </p>
    </main>
  );
}
