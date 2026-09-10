"use client"; // useState = hook React, donc composant navigateur

import { useState } from "react";
import { LoginForm } from "./LoginForm";
import { SignupForm } from "./SignupForm";
import { Button } from "@/components/ui/button";

export function AuthTabs() {
  // Bascule simple entre les deux formulaires, sans changer d'URL ni recharger la page
  const [mode, setMode] = useState<"login" | "signup">("login");

  return (
    <div className="flex flex-col gap-6">
      <div className="flex gap-2">
        <Button
          type="button"
          variant={mode === "login" ? "default" : "outline"}
          className="flex-1"
          onClick={() => setMode("login")}
        >
          Se connecter
        </Button>
        <Button
          type="button"
          variant={mode === "signup" ? "default" : "outline"}
          className="flex-1"
          onClick={() => setMode("signup")}
        >
          S&apos;inscrire
        </Button>
      </div>
      {/* Affiche l'un ou l'autre formulaire selon le bouton actif */}
      {mode === "login" ? <LoginForm /> : <SignupForm />}
    </div>
  );
}