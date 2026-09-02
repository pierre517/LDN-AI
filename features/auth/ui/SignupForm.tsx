"use client";

import { useActionState } from "react";
import { signupAction } from "@/features/auth/application/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";

const initialState = { error: null };

export function SignupForm() {
  const [state, formAction, pending] = useActionState(signupAction, initialState);

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <Label htmlFor="pseudo">Pseudo</Label>
        <Input id="pseudo" name="pseudo" required />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="email">Email</Label>
        <Input id="email" name="email" type="email" required />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="password">Mot de passe</Label>
        <Input id="password" name="password" type="password" required />
        <p className="text-xs text-muted-foreground">
          8 caractères min., avec une majuscule, une minuscule, un chiffre et un caractère spécial.
        </p>
      </div>
      <div className="flex items-start gap-2">
        <Checkbox id="cgu" name="cgu" required />
        <Label htmlFor="cgu" className="font-normal">
          J&apos;accepte les{" "}
          {/* target="_blank" = nouvel onglet, donc ce formulaire n'est jamais rechargé ni quitté :
              la saisie reste intacte, sans code de sauvegarde d'état (exigence section 4.1) */}
          <a href="/cgu" target="_blank" rel="noopener noreferrer" className="underline">
            Conditions d&apos;utilisation
          </a>{" "}
          et la{" "}
          <a href="/confidentialite" target="_blank" rel="noopener noreferrer" className="underline">
            Politique de confidentialité
          </a>
        </Label>
      </div>
      {state.error && <p className="text-sm text-destructive">{state.error}</p>}
      <Button type="submit" disabled={pending}>
        {pending ? "Inscription..." : "S'inscrire"}
      </Button>
    </form>
  );
}