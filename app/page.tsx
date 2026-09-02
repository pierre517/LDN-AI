import { AuthTabs } from "@/features/auth/ui/AuthTabs";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-10 bg-background px-4 py-16 text-foreground">
      {/* Vitrine : présentation rapide de l'outil, visible même sans compte */}
      <div className="flex max-w-md flex-col items-center gap-3 text-center">
        <h1 className="font-heading text-4xl">LDN·AI</h1>
        <p className="font-sans text-muted-foreground">
          Pose tes questions sur ton jeux, sans spoil, avec les noms officiels en français.
        </p>
      </div>

      {/* Zone de connexion/inscription */}
      <div className="w-full max-w-sm">
        <AuthTabs />
      </div>
    </main>
  );
}
