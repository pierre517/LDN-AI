"use client"; // useActionState est un hook React, donc ce composant tourne côté navigateur

import { useActionState } from "react";
import { loginAction } from "@/features/auth/application/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const initialState = { error: null };

export function LoginForm() {
  // useActionState relie le formulaire à loginAction : gère l'état "en cours d'envoi" (pending)
  // et récupère automatiquement ce que l'action renvoie (state.error), sans code manuel supplémentaire.
  const [state, formAction, pending] = useActionState(loginAction, initialState);

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <Label htmlFor="email">Email</Label>
        <Input id="email" name="email" type="email" required />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="password">Mot de passe</Label>
        <Input id="password" name="password" type="password" required />
      </div>
      {state.error && <p className="text-sm text-destructive">{state.error}</p>}
      <Button type="submit" disabled={pending}>
        {pending ? "Connexion..." : "Se connecter"}
      </Button>
    </form>
  );
}