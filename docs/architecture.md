# Architecture Overview

## Core Principles

The project `klassflow` (formerly `open-classroom`) serves as the foundation for KlassFlow.

### 1. Monorepo Compatibility
- This project is designed to be effectively a library that can be consumed by other applications (like the Cloud version).
- **Core Components**: UI components, generic features, and utilities live here.
- **Separation of Concerns**: Multi-tenant logic, billing, and SaaS-specific features are excluded from Core.

### 2. Tech Stack
- **Frontend**: Next.js 14 (App Router), TypeScript, TailwindCSS, Shadcn/ui.
- **Backend**: Next.js API Routes, Server Actions (evolving), Prisma ORM.
- **Database**: PostgreSQL.
- **Auth**: Auth.js (NextAuth v5).

### 3. Key Modules

#### Authentication
Managed via Auth.js with support for Credentials (for development) and other providers.

#### Database Access
All database access is mediated through Prisma. The schema is defined in `prisma/schema.prisma`.

#### Email Service
A unified email service (`src/lib/email.ts`) handles sending transactional emails (invitations, reminders, signatures). It supports:
- **Resend** (Production default)
- **SMTP** (Customizable per organization)
- **MailPit** (Development)

#### Signature System
A core feature allowing students and teachers to sign for sessions.
- **Token-based**: Secure, time-limited tokens are generated for signature requests.
- **Public access**: Signature pages are public but protected by these tokens (`/signature/[token]`).

## Directory Structure

- `src/components/ui`: Reusable UI atoms (Buttons, Inputs).
- `src/components`: Feature-specific components.
- `src/lib`: Shared logic and singletons (Prisma client, Logger).
- `src/app`: Routes and Pages.
