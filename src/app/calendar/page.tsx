import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"
import { CalendarView } from "@/components/schedule/calendar-view"
import { startOfMonth, endOfMonth, startOfWeek, endOfWeek } from "date-fns"
import { getAuthUser } from "@/lib/auth-utils"

export default async function SchedulePage({ searchParams }: { searchParams: Promise<{ [key: string]: string | string[] | undefined }> }) {
    const user = await getAuthUser()
    if (!user) redirect("/")
    const params = await searchParams

    const view = (params.view as string) || "month"
    const dateParam = params.date as string
    const currentDate = dateParam ? new Date(dateParam) : new Date()

    let startDate, endDate

    if (view === "month") {
        const monthStart = startOfMonth(currentDate)
        const monthEnd = endOfMonth(currentDate)
        // Add padding for grid to ensure full weeks are covered
        startDate = startOfWeek(monthStart, { weekStartsOn: 1 })
        endDate = endOfWeek(monthEnd, { weekStartsOn: 1 })
    } else {
        startDate = startOfWeek(currentDate, { weekStartsOn: 1 })
        endDate = endOfWeek(currentDate, { weekStartsOn: 1 })
    }

    const [sessions, classrooms] = await Promise.all([
        prisma.classSession.findMany({
            where: {
                classroom: { organizationId: user.organizationId! },
                startTime: {
                    gte: startDate,
                    lte: endDate
                }
            },
            include: {
                classroom: { select: { name: true } },
                _count: { select: { attendances: true } }
            },
            orderBy: { startTime: "asc" }
        }),
        prisma.classroom.findMany({
            where: { organizationId: user.organizationId! },
            select: { id: true, name: true },
            orderBy: { name: "asc" }
        })
    ])

    const serializedSessions = sessions.map(session => ({
        ...session,
        startTime: session.startTime.toISOString(),
        endTime: session.endTime.toISOString(),
        createdAt: session.createdAt.toISOString(),
        updatedAt: session.updatedAt.toISOString(),
    }))

    return <CalendarView classrooms={classrooms} sessions={serializedSessions} />
}
