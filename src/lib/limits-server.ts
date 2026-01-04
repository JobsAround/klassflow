// import { prisma } from "@/lib/prisma" // Removed internal import
import { checkLimit, type LimitType } from "@/lib/limits"

/**
 * Server-side helper to check limits with database counts
 */
export async function checkOrganizationLimit(
    prisma: any,
    organizationId: string,
    limitType: LimitType
) {
    let currentCount = 0

    switch (limitType) {
        case "admins":
            currentCount = await prisma.user.count({
                where: { organizationId, role: "ADMIN" },
            })
            break
        case "teachers":
            currentCount = await prisma.user.count({
                where: { organizationId, role: "TEACHER" },
            })
            break
        case "students":
            currentCount = await prisma.user.count({
                where: { organizationId, role: "STUDENT" },
            })
            break
        case "classrooms":
            currentCount = await prisma.classroom.count({
                where: { organizationId },
            })
            break
        case "sessionsPerMonth":
            const startOfMonth = new Date()
            startOfMonth.setDate(1)
            startOfMonth.setHours(0, 0, 0, 0)
            currentCount = await prisma.classSession.count({
                where: {
                    classroom: { organizationId },
                    createdAt: { gte: startOfMonth },
                },
            })
            break
    }

    return checkLimit(limitType, currentCount)
}

/**
 * Get all limits usage for an organization (for dashboard display)
 */
export async function getOrganizationLimitsUsage(prisma: any, organizationId: string) {
    const startOfMonth = new Date()
    startOfMonth.setDate(1)
    startOfMonth.setHours(0, 0, 0, 0)

    const [admins, teachers, students, classrooms, sessionsThisMonth] =
        await Promise.all([
            prisma.user.count({ where: { organizationId, role: "ADMIN" } }),
            prisma.user.count({ where: { organizationId, role: "TEACHER" } }),
            prisma.user.count({ where: { organizationId, role: "STUDENT" } }),
            prisma.classroom.count({ where: { organizationId } }),
            prisma.classSession.count({
                where: {
                    classroom: { organizationId },
                    createdAt: { gte: startOfMonth },
                },
            }),
        ])

    return {
        admins: checkLimit("admins", admins),
        teachers: checkLimit("teachers", teachers),
        students: checkLimit("students", students),
        classrooms: checkLimit("classrooms", classrooms),
        sessionsPerMonth: checkLimit("sessionsPerMonth", sessionsThisMonth),
    }
}
