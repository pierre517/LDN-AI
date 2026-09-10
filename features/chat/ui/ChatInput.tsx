"use client";

import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowRight } from "lucide-react";

type Props = {
  onSend: (message: string) => void;
  gameName: string;
};

// Champ de saisie pour poser une question ; onSend est fourni par le composant parent
export function ChatInput({ onSend, gameName }: Props) {
  const [value, setValue] = useState("");

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!value.trim()) return;
    onSend(value);
    setValue("");
  }

  return (
    <form onSubmit={handleSubmit} className="flex gap-2">
      <Input
        value={value}
        onChange={(event) => setValue(event.target.value)}
        placeholder={`Pose ta question sur ${gameName}...`}
        className="rounded-full"
      />
      <Button type="submit" size="icon" className="rounded-full">
        <ArrowRight className="h-4 w-4" />
      </Button>
    </form>
  );
}