import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"
import { ClassroomsList } from "@/components/classrooms/classrooms-list"
import { getAuthUser } from "@/lib/auth-utils"

export default async function ClassroomsPage() {
    const user = await getAuthUser()
    if (!user) redirect("/")

    const classrooms = await prisma.classroom.findMany({
        where: { organizationId: user.organizationId! },
        include: {
            teachers: { select: { id: true, name: true, email: true } },
            _count: { select: { sessions: true, resources: true } }
        },
        orderBy: { createdAt: "desc" }
    })

    // Fetch pending signatures for student
    let pendingCount = 0
    let firstPendingSessionId: string | undefined

    if (user.role === "STUDENT") {
        const pendingSessions = await prisma.classSession.findMany({
            where: {
                classroom: {
                    enrollments: {
                        some: {
                            studentId: user.id
                        }
                    }
                },
                endTime: { lt: new Date() }, // Session is finished
                attendances: {
                    none: {
                        studentId: user.id,
                        OR: [
                            { status: "PRESENT" },
                            { status: "ABSENT" },
                            { signatureUrl: { not: null } }
                        ]
                    }
                }
            },
            orderBy: { startTime: "desc" },
            take: 1
        })

        // This query finds sessions with NO attendance record.
        // We also need to find sessions WITH an existing (empty) attendance record if that can happen.
        // But for now, let's assume "pending" primarily means "no action taken yet".
        // Actually, let's just do a count.

        const allPastSessions = await prisma.classSession.findMany({
            where: {
                classroom: {
                    enrollments: { some: { studentId: user.id } }
                },
                endTime: { lt: new Date() }
            },
            include: {
                attendances: {
                    where: { studentId: user.id }
                }
            }
        })

        const reallyPending = allPastSessions.filter(session => {
            const attendance = session.attendances[0]
            if (!attendance) return true // No record = pending
            // If record exists, check if signed/present/absent
            return attendance.status !== "PRESENT" && attendance.status !== "ABSENT" && !attendance.signatureUrl
        })

        pendingCount = reallyPending.length
        firstPendingSessionId = reallyPending[0]?.id
    }

    return <ClassroomsList
        classrooms={classrooms}
        pendingCount={pendingCount}
        firstPendingSessionId={firstPendingSessionId}
    />
}
