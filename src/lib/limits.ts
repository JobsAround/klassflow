/**
 * Limits Configuration
 * 
 * Reads limits from environment variables.
 * If not configured (self-hosted), all limits are 0 = unlimited.
 * If configured (SaaS mode), limits are enforced.
 */

// Parse limit from env var, 0 = unlimited
function parseLimit(envVar: string | undefined): number {
    if (!envVar) return 0
    const parsed = parseInt(envVar, 10)
    return isNaN(parsed) ? 0 : parsed
}

export const LIMITS = {
    maxAdmins: parseLimit(process.env.MAX_ADMINS),
    maxTeachers: parseLimit(process.env.MAX_TEACHERS),
    maxStudents: parseLimit(process.env.MAX_STUDENTS),
    maxClassrooms: parseLimit(process.env.MAX_CLASSROOMS),
    maxSessionsPerMonth: parseLimit(process.env.MAX_SESSIONS_PER_MONTH),
} as const



// Check if we're in SaaS mode (any limit configured)
export const isSaaSMode = Object.values(LIMITS).some(v => v > 0)

export type LimitType = 'admins' | 'teachers' | 'students' | 'classrooms' | 'sessionsPerMonth'

const LIMIT_KEYS: Record<LimitType, keyof typeof LIMITS> = {
    admins: 'maxAdmins',
    teachers: 'maxTeachers',
    students: 'maxStudents',
    classrooms: 'maxClassrooms',
    sessionsPerMonth: 'maxSessionsPerMonth',
}

const LIMIT_LABELS: Record<LimitType, string> = {
    admins: 'administrateurs',
    teachers: 'formateurs',
    students: 'stagiaires',
    classrooms: 'classes',
    sessionsPerMonth: 'sessions ce mois',
}

export interface LimitCheckResult {
    allowed: boolean
    current: number
    limit: number

    message: string | null
}

/**
 * Check if an action is allowed based on current usage and limits
 */
export function checkLimit(
    limitType: LimitType,
    currentCount: number
): LimitCheckResult {
    const limitKey = LIMIT_KEYS[limitType]
    const limit = LIMITS[limitKey]

    // No limit configured = always allowed
    if (limit === 0) {
        return {
            allowed: true,
            current: currentCount,
            limit: 0,

            message: null,
        }
    }

    const allowed = currentCount < limit
    const label = LIMIT_LABELS[limitType]

    return {
        allowed,
        current: currentCount,
        limit,

        message: allowed
            ? null
            : `Limite atteinte : ${currentCount}/${limit} ${label}`,
    }
}

/**
 * Get usage percentage for display (progress bars, etc.)
 */
export function getUsagePercentage(limitType: LimitType, currentCount: number): number | null {
    const limitKey = LIMIT_KEYS[limitType]
    const limit = LIMITS[limitKey]

    if (limit === 0) return null // Unlimited

    return Math.min(100, Math.round((currentCount / limit) * 100))
}
