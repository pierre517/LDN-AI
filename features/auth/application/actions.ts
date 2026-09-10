"use server"; // Ce fichier ne s'exécute jamais dans le navigateur, uniquement côté serveur

import { redirect } from "next/navigation";
import { signIn, signUp, signOut, deleteAccount } from "./auth";
import { isApprovedEmail } from "./access";

export type AuthFormState = { error: string | null };

export async function loginAction(_prevState: AuthFormState, formData: FormData): Promise<AuthFormState> {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  const result = await signIn(email, password);
  if (result.error) return { error: result.error };

  // Phase de test : seuls les emails approuvés accèdent à l'appli, les autres passent par la waitlist
  redirect(isApprovedEmail(email) ? "/chat" : "/waitlist");
}

export async function signupAction(_prevState: AuthFormState, formData: FormData): Promise<AuthFormState> {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const passwordConfirm = formData.get("passwordConfirm") as string;
  const pseudo = formData.get("pseudo") as string;
  const cgu = formData.get("cgu");

  // Case CGU non cochée -> "cgu" est absent du formData (une case non cochée n'envoie rien)
  if (!cgu) {
    return { error: "Tu dois accepter les CGU pour t'inscrire." };
  }

  // Les deux saisies doivent être identiques (vérif de confort, évite une faute de frappe)
  if (password !== passwordConfirm) {
    return { error: "Les deux mots de passe ne correspondent pas." };
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
  if (result.error) return { error: result.error };

  // Confirmation email désactivée sur Supabase -> une session existe déjà.
  // Phase de test : un nouvel inscrit n'est presque jamais dans la liste blanche -> waitlist.
  // ?inscription=1 -> la page waitlist montre le choix garder/supprimer (décision unique à l'inscription).
  redirect(isApprovedEmail(email) ? "/chat" : "/waitlist?inscription=1");
}

export async function logoutAction() {
  // Invalide la session côté serveur (efface les cookies Supabase) — possible depuis une Server Action, pas un Server Component
  await signOut();
  redirect("/");
}

// Bouton vert de la waitlist : l'utilisateur veut garder ses données (on ne supprime rien).
// On le déconnecte simplement et on le renvoie à l'accueil ; son compte reste en base pour un futur contact.
export async function keepAccountAction() {
  await signOut();
  redirect("/");
}

export async function deleteAccountAction() {
  const { error } = await deleteAccount();
  // Échec rare : on logue côté serveur et on reste sur la page (le dialog ne peut pas afficher d'erreur après navigation)
  if (error) {
    console.error("Échec suppression de compte:", error);
    return;
  }
  redirect("/");
}