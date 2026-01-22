import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { cookies } from "next/headers"

export interface AuthUser {
    id: string
    name?: string | null
    email?: string | null
    image?: string | null
    role: string
    organizationId?: string | null
}

/**
 * Get the current authenticated user.
 * In development mode, also checks for dev-user-id cookie for easier testing.
 */
export async function getAuthUser(): Promise<AuthUser | null> {
    const session = await auth()
    let user = session?.user as AuthUser | undefined

    // Dev login support - only in development mode
    if (!user && process.env.NODE_ENV === "development") {
        const cookieStore = await cookies()
        const devUserId = cookieStore.get("dev-user-id")?.value
        if (devUserId) {
            const devUser = await prisma.user.findUnique({
                where: { id: devUserId }
            })
            if (devUser) {
                user = {
                    id: devUser.id,
                    name: devUser.name,
                    email: devUser.email,
                    image: devUser.image,
                    role: devUser.role,
                    organizationId: devUser.organizationId
                }
            }
        }
    }

    return user ?? null
}

/**
 * Check if the user has one of the allowed roles.
 */
export function hasRole(user: AuthUser | null, allowedRoles: string[]): boolean {
    if (!user) return false
    return allowedRoles.includes(user.role)
}

/**
 * Check if the user is an admin (ADMIN or SUPER_ADMIN).
 */
export function isAdmin(user: AuthUser | null): boolean {
    return hasRole(user, ["ADMIN", "SUPER_ADMIN"])
}

/**
 * Check if the user is a teacher or admin.
 */
export function isTeacherOrAdmin(user: AuthUser | null): boolean {
    return hasRole(user, ["TEACHER", "ADMIN", "SUPER_ADMIN"])
}
