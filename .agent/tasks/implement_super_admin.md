# Task: Implement Super Admin Dashboard

## User Objective
Add an "Admin" menu element for the "admin of the webapp" (Super Admin) to view statistics about different organizations.

## Analysis
Currently, the `Role` enum supports `ADMIN`, `TEACHER`, and `STUDENT`. `ADMIN` is scoped to a specific `Organization`. To support a global administrator who can view cross-organization statistics, we need a distinct role or permission level.

## Proposed Solution
1.  **New Role:** Add `SUPER_ADMIN` to the `Role` enum in `schema.prisma`.
2.  **New Route:** Create a dedicated `/admin` route for global administration.
3.  **Navigation:** Add an "Admin" link to the Sidebar, visible *only* to `SUPER_ADMIN` users.
4.  **Content:** The `/admin` dashboard will show:
    *   Total Organizations count.
    *   Total Users count.
    *   List of Organizations with their specific user/classroom counts.

## Implementation Steps

### 1. Database Schema
- [ ] Update `priv/schema.prisma`: Add `SUPER_ADMIN` to `Role` enum.
- [ ] Run `npx prisma migrate dev --name add_super_admin_role`.

### 2. Frontend / Routing
- [ ] Create `src/app/admin/layout.tsx` (using the same Sidebar but maybe a distinct context or just reusing dashboard layout if compatible).
- [ ] Create `src/app/admin/page.tsx`:
    *   Check for `SUPER_ADMIN` role. Redirect if not authorized.
    *   Fetch global stats using Prisma (`count` queries).
    *   Render stats cards and an Organization list table.

### 3. Navigation
- [ ] Update `src/components/layout/sidebar.tsx`:
    *   Add condition: `if (user.role === 'SUPER_ADMIN')` render "Global Admin" link to `/admin`.

### 4. Seed / Setup
- [ ] (Optional) Create a script or instruction to promote a user to `SUPER_ADMIN`.
