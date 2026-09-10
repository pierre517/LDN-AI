"use client";

import { useState } from "react";
import Link from "next/link";
import { Menu, X } from "lucide-react";

// Liens du menu burger (pages internes) — cf. cahier des charges
const links = [
  { href: "/chat", label: "Nouveau chat" },
  { href: "/history", label: "Historique" },
  { href: "/settings", label: "Paramètres" },
];

// En-tête réutilisable des pages internes : logo + menu burger. Client component car le menu s'ouvre/se ferme.
export function Header() {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between border-b border-border/50 bg-background/95 px-4 py-3 backdrop-blur">
      <Link href="/chat" className="font-heading text-lg">
        LDN·AI
      </Link>

      {/* Desktop (>= md) : liens de navigation affichés directement en ligne, plus besoin du burger */}
      <nav className="hidden md:flex md:items-center md:gap-6">
        {links.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className="text-sm text-muted-foreground hover:text-foreground"
          >
            {link.label}
          </Link>
        ))}
      </nav>

      {/* Mobile (< md) : bouton burger qui ouvre/ferme le menu déroulant */}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label="Menu"
        aria-expanded={open}
        className="flex size-9 items-center justify-center rounded-full hover:bg-muted md:hidden"
      >
        {open ? <X className="size-5" /> : <Menu className="size-5" />}
      </button>

      {open && (
        <>
          {/* Fond invisible plein écran : un clic à côté ferme le menu */}
          <div className="fixed inset-0 z-40 md:hidden" onClick={() => setOpen(false)} />
          <nav className="absolute right-4 top-full z-50 mt-1 flex w-48 flex-col overflow-hidden rounded-2xl bg-card shadow-md ring-1 ring-foreground/10 md:hidden">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setOpen(false)}
                className="px-4 py-3 text-sm hover:bg-muted"
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </>
      )}
    </header>
  );
}
