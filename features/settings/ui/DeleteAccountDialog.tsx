"use client";

import { TriangleAlert, Trash2, ChevronRight } from "lucide-react";
import { deleteAccountAction } from "@/features/auth";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogMedia,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

// Ligne "Supprimer mon compte" + dialog de confirmation explicite (exigence RGPD, cahier des charges 4.3).
// La suppression réelle n'est pas encore branchée ici -> elle sera câblée sur "Supprimer" en LDN-88.
export function DeleteAccountDialog() {
  return (
    <AlertDialog>
      {/* render : la ligne de la zone de danger devient elle-même le déclencheur du dialog */}
      <AlertDialogTrigger
        render={
          <button
            type="button"
            className="flex w-full items-center gap-3 px-4 py-3 text-left text-destructive hover:bg-destructive/10"
          />
        }
      >
        <Trash2 className="size-5" />
        <span className="flex flex-col">
          <span className="text-sm font-medium">Supprimer mon compte</span>
          <span className="text-xs text-destructive/80">Suppression définitive de toutes vos données</span>
        </span>
        <ChevronRight className="ml-auto size-4" />
      </AlertDialogTrigger>

      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogMedia className="bg-destructive/10 text-destructive">
            <TriangleAlert />
          </AlertDialogMedia>
          <AlertDialogTitle>Supprimer le compte ?</AlertDialogTitle>
          <AlertDialogDescription>
            Cette action est irréversible. Toutes vos conversations et données personnelles seront
            définitivement supprimées.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Annuler</AlertDialogCancel>
          {/* form action : la suppression passe par une Server Action (id pris côté serveur, jamais du client) */}
          <form action={deleteAccountAction} className="contents">
            <AlertDialogAction type="submit" variant="destructive">
              Supprimer
            </AlertDialogAction>
          </form>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
