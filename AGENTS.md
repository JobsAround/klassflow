# Instructions pour les Agents IA

## Architecture - RÈGLE FONDAMENTALE

Ce projet (`open-classroom` / `@openclassroom/core`) est la **bibliothèque Core open-source**.

### ⚠️ Ce projet est une DÉPENDANCE de `open-classroom-cloud`

Quand vous modifiez des composants ici :
1. Les changements affectent AUSSI `open-classroom-cloud`
2. Après modification, il faut rebuilder : `npm run build:lib`
3. Cloud utilise la version buildée (pas le code source directement)

### Ce qui doit être dans Core (ici)

- ✅ Composants UI génériques (Button, Card, Dialog, etc.)
- ✅ Composants Feature réutilisables (ClassroomsList, SessionManager, etc.)
- ✅ Utilitaires partagés (limits, helpers)
- ✅ Traductions de base (messages/*.json)
- ✅ L'application standalone self-hosted

### Ce qui NE doit PAS être dans Core

- ❌ Logique multi-tenant (organizations)
- ❌ Billing/Stripe
- ❌ Fonctionnalités SaaS-only

### Après chaque modification

```bash
# Toujours rebuilder après modification de composants exportés
npm run build:lib

# Vérifier les exports
cat index.ts
cat src/server/index.ts
```

### Structure des exports

- `index.ts` → Composants client (`"use client"`)
- `src/server/index.ts` → Utilitaires serveur (pas de "use client")
- `src/messages/*.json` → Traductions

### Nouveaux composants

Si vous créez un nouveau composant qui doit être utilisable par Cloud :

1. Créer le composant dans `src/components/...`
2. L'exporter dans le barrel approprié (`src/components/ui/index.ts` ou `index.ts`)
3. Rebuilder : `npm run build:lib`
4. Dans Cloud, importer : `import { Component } from '@openclassroom/core'`

---

Pour plus de détails, voir `.agent/workflows/architecture.md`
