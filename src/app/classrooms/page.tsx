import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import { ClassroomsList } from "@/components/classrooms/classrooms-list"

async function getUser() {
    let session = await auth()
    let user = session?.user

    if (!user && process.env.NODE_ENV === "development") {
        const cookieStore = await cookies()
        const devUserId = cookieStore.get("dev-user-id")?.value
        if (devUserId) {
            const devUser = await prisma.user.findUnique({
                where: { id: devUserId },
                include: { organization: true }
            })
            if (devUser) {
                user = {
                    id: devUser.id,
                    name: devUser.name,
                    email: devUser.email,
                    image: devUser.image,
                    role: devUser.role,
                    organizationId: devUser.organizationId
                } as any
            }
        }
    }

    if (!user) redirect("/")
    return user
}

export default async function ClassroomsPage() {
    const user = await getUser()

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
