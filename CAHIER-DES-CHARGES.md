# Cahier des charges — Assistant IA jeux vidéo (V1)

Ce document sert de référence pour la documentation du projet et pour tout assistant IA utilisé pendant le développement (voir section 16).

## 1. Contexte et besoin

Les soluces et informations précises sur un jeu vidéo sont dispersées entre wikis communautaires, forums et vidéos, ce qui rend la recherche d'une information précise longue et parfois infructueuse. Les assistants IA généralistes existants peuvent répondre à ce type de question, mais approfondissent peu leurs recherches (lecture de résumés plutôt que du contenu complet des pages) et peuvent halluciner des réponses plausibles mais fausses sur des détails précis. S'ajoute à ça un problème de langue : la majorité des sources communautaires sont en anglais, alors que le jeu est souvent joué dans une version localisée (français ici) — or les noms d'objets, de boss, de lieux ou de PNJ ne sont pas toujours de simples traductions littérales entre les deux langues. Une réponse qui reprend le nom anglais, ou une traduction approximative, peut ne correspondre à rien dans ce que le joueur voit réellement à l'écran.

## 2. Objectif

Une plateforme web qui répond aux questions sur un jeu vidéo précis en s'appuyant sur une recherche ciblée dans les sources communautaires de ce jeu, avec des noms propres fiables dans la langue du joueur, pensée mobile-first.

## 3. Périmètre V1

- Un seul jeu disponible au lancement (Elden Ring) — l'architecture doit permettre d'en ajouter d'autres sans réécriture de code
- Compte utilisateur obligatoire (pas d'usage anonyme)
- Formulaire de sélection : jeu, console
- Chat avec recherche automatique dans les sources du jeu
- Historique des conversations sauvegardé par compte

## 4. Fonctionnalités et navigation

Pages principales de l'application :

- **Accueil / Connexion** : page publique, accessible sans compte — sert à la fois de vitrine de l'outil et de point d'entrée pour se connecter ou s'inscrire (voir maquette)
- **Nouveau chat** : formulaire de sélection (jeu, console) puis conversation avec l'assistant — le formulaire est présenté à chaque nouvelle conversation, sans mémoriser les choix précédents
- **Conversation** : chat en cours avec l'IA
- **Historique** : liste des conversations passées de l'utilisateur
- **Paramètres** : déconnexion, suppression de compte

Menu burger (accessible depuis les pages internes de l'application) :
- Nouveau chat
- Historique
- Paramètres

Le menu Paramètres contient :
- **Déconnexion** : invalide la session côté Supabase Auth et redirige vers la page de connexion
- **Supprimer mon compte** : voir 4.3

### 4.1 Inscription (signup)

La case à cocher d'acceptation des conditions contient deux liens : Conditions d'utilisation et Politique de confidentialité (voir section 14). Ouvrir l'un de ces liens doit permettre à l'utilisateur de consulter la page légale correspondante, puis de revenir automatiquement sur la page d'inscription — sans perdre ce qu'il avait déjà saisi dans le formulaire.

### 4.2 Historique

Liste des conversations passées de l'utilisateur. Cas limite explicitement tranché : un utilisateur sans historique voit un état vide plutôt qu'une erreur ou une liste cassée — pas d'historique pour le moment.

Le footer de cette page affiche les liens Conditions d'utilisation et Politique de confidentialité.

### 4.3 Suppression de compte

Fonctionnalité officielle de l'application, accessible depuis Paramètres. Comportement attendu :

1. **Confirmation explicite** demandée à l'utilisateur avant toute suppression (empêcher un clic accidentel de supprimer définitivement un compte)
2. **Suppression complète des données personnelles** associées au compte — `auth.users`, `profiles`, `conversations`, `messages` — conformément au droit à l'effacement RGPD (section 14)
3. **Déconnexion immédiate** et redirection vers la page d'accueil

Ce qui n'est **pas** supprimé : `cache_recherches` et `glossaire_termes` restent intacts — ces tables ne contiennent aucune donnée personnelle (indexées par jeu et par question/terme, jamais par utilisateur), donc rien à effacer côté RGPD, et ça évite de perdre un cache utile à tous les autres utilisateurs pour une suppression qui ne les concerne pas.

Implication technique : pour que la suppression soit complète et fiable, les clés étrangères `conversations.user_id` et `messages.conversation_id` doivent être configurées en cascade (`ON DELETE CASCADE`) au niveau de la base — la suppression du compte entraîne alors automatiquement celle des conversations et messages associés, sans étape manuelle oubliable côté code.

## 5. Direction artistique et UI

Ces choix constituent la direction visuelle de référence du projet et doivent être appliqués de manière cohérente à toute l'application :

- **Composants** : shadcn/ui utilisés autant que possible, plutôt que des composants faits maison
- **Fidélité à la maquette** : l'interface doit suivre au plus près la maquette de référence (document externe à ce cahier des charges)
- **Mobile-first** : conception pensée d'abord pour mobile, adaptée ensuite au desktop
- **Fond** : quasi-noir
- **Couleur d'accent** : `#c4955a`
- **Typographies** :
  - Fraunces — titres
  - Inter — corps de texte
  - JetBrains Mono — labels et sources

## 6. Stack technique

| Brique | Choix |
|---|---|
| Front + Back | Next.js (monolithe), TypeScript, shadcn/ui (Tailwind CSS en support) |
| Modèle IA | Groq (principal), OpenRouter (backup) — via Vercel AI SDK |
| Recherche web | Tavily, restreinte aux sites gaming du jeu actif |
| Metadata jeux | RAWG (autocomplete jeu/console) |
| Base de données + Auth | Supabase (1 seule base) |
| Hébergement | Vercel |

## 7. Architecture générale

Un seul projet Next.js (monolithe), déployé en un bloc sur Vercel. Front et back vivent dans le même repo :

- **Front** : `app/` (routing, pages, layouts) + `features/` (logique métier organisée par fonctionnalité)
- **Back** : `app/api/` (routing fin, imposé par Next.js) + `backend/` (logique : controllers, middleware, models — voir section 9)
- **Une seule base de données** : Supabase (Postgres + Auth), y compris pour une éventuelle extension vectorielle future (`pgvector`)

## 8. Architecture frontend — organisation par feature

Chaque feature suit une structure en couches inspirée de la Clean Architecture :

```
features/
  chat/
    domain/         → types (Message, Conversation, SearchResult...)
    infrastructure/ → appels externes (groqClient, tavilyClient, cacheClient)
    application/    → logique métier (construction du prompt, orchestration, décision de recherche)
    ui/             → composants (bulles de message, input, indicateur de recherche)
    index.ts        → façade publique, appelée depuis app/

  game-selector/
    domain/, infrastructure/ (RAWG), application/, ui/, index.ts

  auth/
    domain/, infrastructure/ (Supabase Auth), application/, ui/, index.ts
```

`app/` ne contient que le routing (`page.tsx`, `layout.tsx`), qui importe uniquement le `index.ts` de chaque feature. Le code métier ne vit jamais dans `app/`.

## 9. Architecture backend

Next.js impose le routing par fichiers : chaque route API doit avoir un fichier `app/api/.../route.ts` pour exister (contrainte du framework, incontournable). Ce fichier reste cependant un point d'entrée fin — la logique elle-même vit dans un dossier `backend/` séparé, testable indépendamment du framework :

```
app/
  api/
    chat/route.ts          → point d'entrée fin, appelle backend/controllers/chatController.ts
    games/search/route.ts  → appelle backend/controllers/gameController.ts
    auth/.../route.ts      → appelle backend/controllers/authController.ts

backend/
  controllers/ → validation des requêtes, appel de la logique métier
  middleware/  → authentification, vérification du quota utilisateur, gestion des erreurs
  models/      → accès aux tables Supabase
```

Pas de dossier `routes/` séparé dans `backend/` : l'arborescence de `app/api/` joue déjà ce rôle, un `routes/` par-dessus serait redondant.

Cette séparation apporte de la testabilité (tester `chatController.ts` par un simple appel de fonction, sans requête HTTP réelle) et de la cohérence avec le front, qui suit déjà le même principe (`app/` fin, logique dans `features/`).

### 9.1 Deux choses différentes portent le nom "middleware"

- **`middleware.ts`** (fichier spécial Next.js, à la racine du projet) : usage unique et étroit — rafraîchir automatiquement le token de session Supabase, nécessaire car les Server Components ne peuvent pas écrire de cookies eux-mêmes. C'est le pattern officiellement recommandé par Supabase pour Next.js, avec une gestion des cookies et un environnement d'exécution (Edge Runtime) qui lui sont propres.
- **`backend/middleware/`** (fonctions normales, sans lien avec le fichier ci-dessus) : vérifie l'identité de l'utilisateur sur chaque route API sensible en rappelant Supabase côté serveur (`getUser()`, jamais en faisant confiance à la session côté client, qui peut être falsifiée), applique le quota, gère les erreurs. Du code TypeScript classique, appelé depuis les controllers, sans contrainte Edge Runtime.

## 10. Fonctionnement du moteur IA

### 10.1 Qui décide, qui exécute

Le modèle IA n'a jamais accès à internet — il ne fait que lire du texte et en générer. Toute recherche réelle est exécutée par le code backend (`infrastructure/tavilyClient.ts`), jamais par le modèle.

Le modèle participe quand même à la recherche via le tool calling : il reformule la question en requête de recherche optimisée (une reformulation vaut toujours mieux que la question brute de l'utilisateur). Mais le prompt système lui impose de rechercher pour toute question portant sur le contenu du jeu (mécaniques, quêtes, objets, boss, zones, stratégies) — il ne peut sauter la recherche que pour des questions triviales ou hors-sujet (salutations, questions sur le fonctionnement de l'app). On ne laisse donc pas un jugement libre au modèle, mais une décision fortement cadrée par une règle explicite.

Séquence :
1. L'utilisateur pose une question
2. Vérification en amont : le prompt système vérifie que la question porte sur le jeu sélectionné ; si elle est hors sujet, le modèle redirige poliment sans chercher (voir section 13, recadrage)
3. Pour une question sur le jeu, le modèle formule la requête de recherche optimale et la demande (tool calling de l'AI SDK)
4. Le backend exécute réellement la recherche demandée, restreinte aux sources du jeu actif
5. Le modèle identifie les noms propres présents dans les résultats et vérifie/complète leur traduction française (voir 10.4)
6. Le modèle rédige la réponse finale, en français, avec les noms officiels du jeu
7. La réponse est streamée à l'utilisateur

### 10.2 Trois mémoires distinctes

| | Connaissances du modèle | Recherche Tavily | Base Supabase |
|---|---|---|---|
| Où ça vit | Poids du modèle, chez Groq | Récupéré à la volée | Chez nous |
| Statique ou live | Figé à la date d'entraînement | Temps réel | Mise à jour en continu |
| Contrôle | Aucun accès | Contrôle uniquement sur *où* chercher (config sources) | Total |

### 10.3 Cache des recherches

Pour économiser le quota Tavily (partagé entre tous les utilisateurs), les résultats de recherche bruts sont mis en cache dans Supabase (table `cache_recherches`), indexés par jeu + question normalisée, avec une expiration de 30 jours. On cache les résultats de recherche, jamais la réponse finale du modèle, qui reste propre à chaque conversation.

### 10.4 Traduction des noms propres (objets, boss, lieux, PNJ)

Problème : les sources (en anglais) et le jeu en version française n'utilisent pas toujours les mêmes noms — pas une simple traduction littérale, parfois un nom complètement différent (ex : "Radahn's Greatsword" pourrait devenir "l'épée du général" en français, sans lien évident avec le nom anglais). Un glossaire pré-rempli à la main n'est pas réaliste : trop de termes par jeu, et ça ne passe pas à l'échelle pour le multi-jeu.

Solution retenue : traduction systématique, avec mise en cache automatique dans une table dédiée.

1. Après la recherche principale, le modèle identifie les noms propres présents dans les résultats
2. Pour chaque nom, vérification dans `glossaire_termes` (voir section 12) — si déjà connu pour ce jeu, réutilisation immédiate, aucune nouvelle recherche
3. Pour les noms encore inconnus, une seule recherche Tavily groupée (tous les noms de la réponse en cours, pas un appel par nom) pour trouver leurs équivalents français
4. Les nouvelles correspondances trouvées sont ajoutées à `glossaire_termes`, réutilisables pour tous les utilisateurs suivants
5. Si aucune source française fiable n'est trouvée, le modèle utilise le nom anglais dans sa réponse plutôt que d'inventer une traduction

Le coût réel (recherche + tokens) n'est payé qu'une fois par terme et par jeu tant que l'entrée reste valide — la première personne qui pose une question sur un boss "paie" la traduction, tout le monde après en profite gratuitement via le cache. Les noms officiels peuvent toutefois changer avec le temps (un patch peut renommer un objet ou un lieu) : `glossaire_termes` expire donc aussi, avec une durée plus longue que `cache_recherches` (60 jours plutôt que 30), un renommage restant nettement plus rare qu'une mise à jour de stratégie ou d'équilibrage.

## 11. Gestion multi-jeux

V1 : un seul jeu (Elden Ring). Toute la configuration vit dans un seul fichier — décision confirmée : **pas de table `jeux` en base**, un identifiant unique (slug) suffit :

```yaml
games:
  - id: elden-ring
    rawg_id: 326243
    nom: "Elden Ring"
    plateformes: [PS5, PS4, Xbox Series, Xbox One, PC]
    sources: [fextralife.com/eldenring, reddit.com/r/Eldenring, gamefaqs.gamespot.com/...]
    statut: actif
```

`id` (le slug, ex : `elden-ring`) est l'identifiant utilisé partout dans l'application et dans les tables (`jeu_id`, voir section 12) — stable une fois choisi, jamais modifié, y compris si le champ `nom` change plus tard.

### 11.1 Un fichier, deux lecteurs

Ce fichier n'est pas réservé à l'IA : c'est une configuration partagée, lue par deux features différentes, chacune n'en utilisant que les champs qui la concernent :

| Lecteur | Champs utilisés | Usage |
|---|---|---|
| `features/game-selector/` | `id`, `nom`, `rawg_id`, `plateformes` | Sélecteur jeu/console dans le formulaire, appel à l'API RAWG pour la jaquette |
| `features/chat/` | `id`, `nom`, `sources` | Construction du prompt système, restriction de la recherche Tavily |

Aucune des deux features ne "possède" ce fichier : il vit dans un dossier neutre à la racine (`config/games.yaml`), importé indépendamment par la couche `infrastructure/` de chacune.

`rawg_id` sert uniquement à interroger l'API RAWG sans ambiguïté (récupérer la bonne fiche même si plusieurs éditions du jeu existent sur RAWG) — il n'est utilisé nulle part ailleurs, ni dans nos tables, ni dans la recherche Tavily.

**Sans table dédiée, la validation du slug reste la responsabilité de l'application** : contrairement à une contrainte de clé étrangère en base, rien n'empêche nativement une faute de frappe sur `jeu_id` d'être écrite en base. Cas limite à gérer explicitement au moment du développement : toute route qui reçoit un `jeu_id`/slug doit le valider contre la liste des jeux connus dans le fichier de config, et rejeter la requête (erreur claire) si le slug n'existe pas, plutôt que de laisser passer une donnée invalide silencieusement.

RAWG fournit les métadonnées du jeu (nom, plateformes, jaquette) pour l'autocomplete ; il ne connaît pas les sources communautaires, qui restent maintenues manuellement et reliées par `rawg_id`.

La traduction des noms propres (section 10.4) ne demande aucune configuration supplémentaire par jeu : le glossaire `glossaire_termes` se construit automatiquement à l'usage, pour n'importe quel jeu ajouté.

## 12. Base de données (Supabase)

| Table | Contenu | Géré par |
|---|---|---|
| `auth.users` | id, email, mot de passe (hashé bcrypt, jamais en clair) | Supabase Auth (natif, schéma `auth`, jamais créée ni modifiée par nous) |
| `profiles` | id (= auth.users.id), pseudo, date de création | `application/auth` |
| `conversations` | id, user_id (FK auth.users.id), jeu_id (slug, texte libre, pas de FK), date | `application/chat` |
| `messages` | id, conversation_id (FK), rôle (user/assistant), contenu, date | `application/chat` |
| `usage` | user_id (FK), date, nombre de requêtes | middleware quota |
| `cache_recherches` | jeu_id (slug, texte libre), question normalisée, résultats Tavily, date, expiration (30 jours) | `infrastructure/cacheClient` |
| `glossaire_termes` | jeu_id (slug, texte libre), terme_anglais, terme_français, date_ajout, expiration (60 jours) | `infrastructure/glossaryClient` |

**`auth.users` vs `profiles`** : Supabase gère nativement une table `auth.users` avec l'email et le mot de passe hashé — on ne la crée pas et on n'y touche jamais directement dans le code. Pour stocker des champs propres à l'appli (pseudo...), on crée notre propre table `profiles` dans le schéma public, reliée à `auth.users` par une clé étrangère sur son id.

**Suppression en cascade** : `conversations.user_id` et `messages.conversation_id` doivent être configurées en `ON DELETE CASCADE`, pour que la suppression d'un compte (section 4.3) entraîne automatiquement celle de ses conversations et messages, sans étape manuelle oubliable.

**`jeu_id`** : cette valeur correspond au slug défini dans le fichier de config des jeux (section 11, ex : `elden-ring`) — pas à l'id numérique RAWG (`rawg_id`), qui sert uniquement à interroger l'API RAWG. Décision confirmée : pas de table `jeux` en base, donc pas de contrainte de clé étrangère native sur `jeu_id` — sa validité est vérifiée côté application (voir section 11.1) plutôt que par Postgres.

**Pourquoi des tables Postgres plutôt qu'un outil de cache dédié (Redis...)** : à l'échelle de ce projet, un vrai cache mémoire n'apporterait pas de gain perceptible, et ajouterait un service de plus à gérer — Supabase, déjà en place, suffit largement.

Ce qui n'est jamais stocké en base : le contenu complet des wikis (récupéré à la volée, mis en cache temporairement uniquement), les connaissances internes du modèle (inaccessibles).

## 13. Sécurité et quotas

- Compte obligatoire, aucune fonctionnalité en anonyme
- **Autorisation** : un utilisateur ne peut lire ou modifier que ses propres conversations et messages — toute route qui retourne une conversation doit vérifier que `conversation.user_id` correspond à l'utilisateur authentifié de la requête, jamais se fier uniquement à un id transmis par le client
- Quota de requêtes/jour par utilisateur (table `usage`), pour protéger le quota gratuit partagé Groq/Tavily — une question peut déclencher jusqu'à deux appels Tavily (recherche principale + traduction si nécessaire), atténué dans la durée par les caches `cache_recherches` et `glossaire_termes`
- Clés API (Groq, Tavily, RAWG, Supabase service role) jamais exposées côté client, uniquement en variables d'environnement backend
- Recadrage automatique : le prompt système impose au modèle de rediriger poliment toute question hors du contexte du jeu sélectionné plutôt que d'y répondre (voir 10.1) — protège l'expérience et le quota partagé contre un usage détourné en chatbot généraliste
- Mots de passe : hashage bcrypt + salage aléatoire géré nativement par Supabase Auth, aucune implémentation custom ; règles configurées dans Supabase : minimum 8 caractères, au moins une majuscule, une minuscule, un chiffre et un caractère spécial
- Sessions : tokens JWT signés, émis et vérifiés nativement par Supabase Auth ; durée du token d'accès configurée à 1h avec rafraîchissement automatique côté client (valeur par défaut Supabase)

### 13.1 Gestion des erreurs

- **Erreur technique** (Groq, Tavily ou Supabase injoignable) : une nouvelle tentative automatique après un court délai, puis un message générique si ça persiste ("un souci technique est survenu, réessaie dans quelques instants") — jamais de détail technique brut affiché à l'utilisateur
- **Quota atteint** : ce n'est pas un bug, message explicite et différent ("tu as atteint ta limite de questions pour aujourd'hui")
- **Échec partiel** (la recherche de traduction du 10.4 échoue, mais la recherche principale a réussi) : la réponse part quand même, avec les noms anglais bruts plutôt que d'annuler toute la réponse pour un problème secondaire
- **Erreur en plein streaming** : le flux s'arrête, un message d'erreur s'ajoute à la suite de ce qui a déjà été généré — pas de perte du texte déjà affiché
- **Journalisation** : les erreurs sont loguées côté serveur (logs Vercel, suffisant pour un V1) pour pouvoir déboguer après coup

## 14. Conformité et mentions légales

Le projet collecte des données personnelles (email via Supabase Auth, historique des conversations) et utilise des services tiers qui traitent ces données ou les requêtes (Groq, OpenRouter, Tavily, RAWG, Supabase, Vercel). Deux pages sont nécessaires avant une mise en production réelle :

- **Politique de confidentialité** : quelles données sont collectées, dans quel but, combien de temps elles sont conservées, quels tiers y ont accès, comment exercer ses droits RGPD (accès, suppression, portabilité)
- **Conditions d'utilisation** : usage non commercial et à but de portfolio, absence de garantie sur l'exactitude des réponses (contenu issu de sources communautaires, pas de sources officielles), limitation de responsabilité

Acceptation obligatoire des CGU à la création de compte (case à cocher, voir 4.1 pour le comportement des liens).

*Ceci n'est pas un avis juridique — pour un projet qui dépasserait le cadre d'un portfolio, une relecture par un professionnel du droit reste recommandée.*

## 15. SEO et référencement

- **Rendu serveur natif** : Next.js App Router rend les pages en HTML côté serveur par défaut (Server Components) — contrairement à une SPA React classique, indexable nativement par les moteurs de recherche sans travail supplémentaire
- **Metadata API** : utiliser l'API Metadata de Next.js (`generateMetadata`) pour le titre, la description et les balises Open Graph de chaque page publique
- **`sitemap.xml` et `robots.txt`** : générés via les conventions Next.js (`sitemap.ts`, `robots.ts`)
- **Contenu indexable vs. privé** : le chat lui-même (derrière compte) n'est pas indexable — logique, comme pour n'importe quel assistant IA. La page d'accueil reste publique et optimisée pour la découverte du site, pas pour exposer le contenu généré
- **Mobile-first = déjà un avantage SEO** : Google indexe en priorité la version mobile, ce qui est déjà l'axe central du projet

## 16. Instructions pour l'assistant IA (développement)

Ces règles s'appliquent à tout assistant IA travaillant sur ce projet pendant le développement. Contexte général à garder en tête tout au long : je suis développeur junior — le code produit doit rester compréhensible pour moi, pas seulement fonctionnel. Répartition des rôles : c'est moi qui développe et qui exécute les commandes Git (créer une branche, committer, pousser) — l'IA organise et propose le découpage du travail, mais n'exécute jamais Git elle-même.

1. **Toujours demander avant de modifier ou de contourner quelque chose** qui n'est pas explicitement demandé dans la tâche en cours — aucune décision silencieuse sur un choix structurant.
2. **Se référer à la documentation officielle** des libs utilisées (Next.js, Vercel AI SDK, Supabase, Tavily, RAWG...) avant d'implémenter. Si la doc n'est pas trouvée ou accessible, demander un lien plutôt que d'improviser depuis la mémoire du modèle.
3. **Découper toute tâche en sous-tâches** avant de commencer à coder.
4. **Respecter la convention une sous-tâche = un commit, une tâche = une branche** (format Conventional Commits) en proposant le découpage — l'exécution des commandes Git reste toujours manuelle, de mon côté.
5. **Ne jamais ajouter une nouvelle dépendance** sans la proposer et attendre confirmation — évite de se retrouver avec des libs non prévues dans ce cahier des charges.
6. **Respecter strictement les couches de l'architecture** (`domain/`, `infrastructure/`, `application/`, `ui/`) — signaler si une demande pousse à mélanger les responsabilités, plutôt que de le faire silencieusement.
7. **Ne jamais committer de secret** (clé API, token) — vérifier que `.env*` est bien dans `.gitignore` avant tout commit sensible.
8. **Expliquer le "pourquoi"** quand plusieurs approches sont possibles, plutôt que d'en choisir une en silence.
9. **Signaler en avance si une tâche s'avère plus complexe que prévu**, plutôt que d'improviser une solution différente de ce qui était découpé au départ.
10. **Pour tout code touchant à la sécurité** (auth, clés API, quotas), être explicite sur les risques plutôt que de les passer sous silence.
11. **Toujours respecter les bonnes pratiques** du langage et du framework utilisés.
12. **Code simple et lisible avant tout** : ni sur-optimisé (astuces obscures, abstractions inutiles), ni sous-optimisé (copier-coller, solutions bancales) — un juste milieu adapté à un niveau junior.
13. **Expliquer chaque tâche réalisée** : quoi, pourquoi, comment — pas juste livrer du code sans contexte.
14. **Respecter la direction artistique définie en section 5** (shadcn/ui, mobile-first, maquette de référence, couleurs, typographies) pour tout composant ou toute page créée.
