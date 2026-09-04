"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import type { GameWithDetails } from "@/features/game-selector/domain/types";

type Props = { games: GameWithDetails[] };

export function GameSelectorForm({ games }: Props) {
  const router = useRouter();

  // Un seul jeu sélectionnable à la fois -> le premier actif par défaut
  const [selectedGameId, setSelectedGameId] = useState(games[0]?.id);
  const selectedGame = games.find((g) => g.id === selectedGameId);

  const [console_, setConsole] = useState(selectedGame?.plateformes[0]);

  // Choix passés par l'URL, jamais mémorisés côté serveur -> une nouvelle conversation repart d'un formulaire vierge
  function handleStart() {
    if (!selectedGame || !console_) return;
    const params = new URLSearchParams({ jeuId: selectedGame.id, console: console_ });
    router.push(`/chat/conversation?${params.toString()}`);
  }

  return (
    <div className="flex flex-col gap-8">
      <section>
        <h2 className="font-heading text-lg">Jeu</h2>
        <div className="mt-3 flex flex-col gap-2">
          {games.map((game) => (
            <Card
              key={game.id}
              onClick={() => setSelectedGameId(game.id)}
              className={`flex cursor-pointer flex-row items-center gap-3 p-3 ${
                selectedGameId === game.id ? "border-primary" : ""
              }`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element -- image externe RAWG, next/image demanderait une config de domaine en plus */}
              {game.image && <img src={game.image} alt={game.nom} className="h-12 w-12 rounded object-cover" />}
              <div>
                <p className="font-sans">{game.nom}</p>
                <p className="text-xs text-muted-foreground">
                  {game.studio} {game.annee ? `· ${game.annee}` : ""}
                </p>
              </div>
            </Card>
          ))}
          {/* Message affiché seulement s'il n'y a qu'un jeu, comme sur la maquette */}
          {games.length === 1 && (
            <p className="text-xs text-muted-foreground">D&apos;autres jeux seront disponibles prochainement.</p>
          )}
        </div>
      </section>

      <section>
        <h2 className="font-heading text-lg">Console</h2>
        <div className="mt-3 flex flex-wrap gap-2">
          {selectedGame?.plateformes.map((plateforme) => (
            <Button
              key={plateforme}
              type="button"
              variant={console_ === plateforme ? "default" : "outline"}
              onClick={() => setConsole(plateforme)}
            >
              {plateforme}
            </Button>
          ))}
        </div>
      </section>

      <Button type="button" className="w-full" disabled={!selectedGame || !console_} onClick={handleStart}>
        Commencer le chat
      </Button>
    </div>
  );
}