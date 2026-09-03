"use server"; // Ce fichier ne s'exécute jamais dans le navigateur, uniquement côté serveur

import { signIn, signUp } from "./auth";

export type AuthFormState = { error: string | null };

export async function loginAction(_prevState: AuthFormState, formData: FormData): Promise<AuthFormState> {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  const result = await signIn(email, password);
  return { error: result.error };
}

export async function signupAction(_prevState: AuthFormState, formData: FormData): Promise<AuthFormState> {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const pseudo = formData.get("pseudo") as string;
  const cgu = formData.get("cgu");

  // Case CGU non cochée -> "cgu" est absent du formData (une case non cochée n'envoie rien)
  if (!cgu) {
    return { error: "Tu dois accepter les CGU pour t'inscrire." };
  }

  // Contrôle de confort côté UI seulement ; la vraie règle est imposée par Supabase (dashboard Auth)
  const passwordRules = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/;
  if (!passwordRules.test(password)) {
    return {
      error:
        "Le mot de passe doit faire au moins 8 caractères, avec une majuscule, une minuscule, un chiffre et un caractère spécial.",
    };
  }

  const result = await signUp(email, password, pseudo);
  return { error: result.error };
}