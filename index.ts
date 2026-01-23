// @openclassroom/core - Main exports
// This file exports components and utilities for use in open-classroom-cloud
// NOTE: Components with Server Actions (layout/header, auth) cannot be exported here

// =============================================================================
// UI Components
// =============================================================================
export * from './src/components/ui/index'

// =============================================================================
// Feature Components (Client-side only)
// =============================================================================
export * from './src/components/sessions/index'
export * from './src/components/classrooms/index'
export * from './src/components/signature/index'
export * from './src/components/resources/index'
// Layout excluded: contains Server Actions (header.tsx logout)
// export * from './src/components/layout/index'

// =============================================================================
// Schedule Components
// =============================================================================
export { CalendarView } from './src/components/schedule/calendar-view'
export { ScheduleCalendar } from './src/components/schedule/schedule-calendar'

// =============================================================================
// User Components
// =============================================================================
export { InviteUserDialog } from './src/components/users/invite-user-dialog'
export { EditUserDialog } from './src/components/users/edit-user-dialog'
export { DeleteUserDialog } from './src/components/users/delete-user-dialog'
export { MembersTable } from './src/components/users/members-table'


// =============================================================================
// Lib Utilities
// =============================================================================
// export { prisma } from './src/lib/prisma' // Excluded: Prisma cannot be used in "use client" bundle
export { LIMITS, isSaaSMode, checkLimit } from './src/lib/limits'
export { generateAttendancePDF } from './src/lib/pdf-export'
export type { AttendanceData } from './src/lib/pdf-export'
export { generateAttendancePDFv2, AttendancePDF } from './src/lib/pdf-attendance'
export type { AttendanceData as AttendanceDataV2, AttendanceSession } from './src/lib/pdf-attendance'
// limits-server excluded: server-only
// export { checkOrganizationLimit, getOrganizationLimitsUsage } from './src/lib/limits-server'

// =============================================================================
// Auth excluded: contains Server Actions
// =============================================================================
// export { auth, handlers } from './src/auth'

