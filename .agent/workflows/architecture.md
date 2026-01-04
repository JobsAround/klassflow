---
description: Architecture du projet KlassFlow Core
---

# KlassFlow Core (@openclassroom/core)

## Vue d'ensemble

Core est une bibliothèque open-source qui fournit :
1. **Composants UI** réutilisables (basés sur Shadcn/UI)
2. **Composants Feature** (ClassroomsList, SessionManager, etc.)
3. **Traductions i18n** de base
4. **Utilitaires serveur** (limits, session creation)

## Structure des exports

### Client (index.ts → dist/index.mjs)

```typescript
// UI Components
export * from './src/components/ui/index'

// Feature Components
export * from './src/components/sessions/index'
export * from './src/components/classrooms/index'
export * from './src/components/signature/index'
export * from './src/components/resources/index'

// Schedule Components
export { CalendarView } from './src/components/schedule/calendar-view'
export { ScheduleCalendar } from './src/components/schedule/schedule-calendar'

// User Components
export { InviteUserDialog } from './src/components/users/invite-user-dialog'
export { EditUserDialog } from './src/components/users/edit-user-dialog'
export { DeleteUserDialog } from './src/components/users/delete-user-dialog'

// Utilities
export { LIMITS, BILLING_URL, isSaaSMode, checkLimit } from './src/lib/limits'
```

### Server (src/server/index.ts → dist/server.mjs)

```typescript
export { checkOrganizationLimit, getOrganizationLimitsUsage } from '../lib/limits-server'
export * from './actions/sessions'
```

### Messages i18n

Exportés via `package.json` exports :
- `@openclassroom/core/messages/en.json`
- `@openclassroom/core/messages/fr.json`
- etc.

## Build

```bash
npm run build:lib
```

Ceci exécute :
1. `npm run build:client` → tsup avec `tsup.config.ts`
2. `npm run build:server` → tsup avec `tsup.server.config.ts`

## Consommateurs

- **open-classroom-cloud** : SaaS multi-tenant (utilise Core comme dépendance)
- **open-classroom** lui-même : Application standalone self-hosted

## Bonnes pratiques

1. **Tous les composants UI** doivent être exportés dans `src/components/ui/index.ts`
2. **Composants client** doivent avoir `"use client"` en haut
3. **Ne pas importer prisma** dans les fichiers exportés (passé en paramètre)
4. **Utiliser des imports relatifs** dans les composants (pas `@/` dans les exports)
