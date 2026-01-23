import { prisma } from "@/lib/prisma"
import { NextRequest, NextResponse } from "next/server"
import { startOfWeek, endOfWeek, startOfMonth, endOfMonth } from "date-fns"

export async function GET(
    req: NextRequest,
    { params }: { params: any }
) {
    try {
        const { token } = await params
        const url = new URL(req.url)
        const range = url.searchParams.get("range") || "week"
        const dateParam = url.searchParams.get("date")
        const referenceDate = dateParam ? new Date(dateParam) : new Date()

        // Find classroom by share token or ID
        const classroom = await prisma.classroom.findFirst({
            where: {
                OR: [
                    { shareToken: token },
                    { id: token }
                ]
            },
            include: {
                organization: true,
                teachers: true,
                enrollments: {
                    include: { student: true },
                    orderBy: { student: { name: 'asc' } }
                }
            }
        })

        if (!classroom) {
            return NextResponse.json({ error: "Classroom not found" }, { status: 404 })
        }

        let startDate, endDate

        if (range === "month") {
            startDate = startOfMonth(referenceDate)
            endDate = endOfMonth(referenceDate)
        } else {
            startDate = startOfWeek(referenceDate, { weekStartsOn: 1 })
            endDate = endOfWeek(referenceDate, { weekStartsOn: 1 })
        }

        // Fetch sessions in range
        const dbSessions = await prisma.classSession.findMany({
            where: {
                classroomId: classroom.id,
                startTime: {
                    gte: startDate,
                    lte: endDate
                }
            },
            include: {
                attendances: true,
                teacher: true
            },
            orderBy: { startTime: 'asc' }
        })

        const organizationName = classroom.organization.name

        // Calculate hours per teacher from sessions
        const teacherHoursMap = new Map<string, { name: string, hours: number }>()

        dbSessions.forEach(session => {
            const duration = (new Date(session.endTime).getTime() - new Date(session.startTime).getTime()) / (1000 * 60 * 60)
            const tName = session.teacher?.name || classroom.teachers[0]?.name || "Formateur"

            if (teacherHoursMap.has(tName)) {
                teacherHoursMap.get(tName)!.hours += duration
            } else {
                teacherHoursMap.set(tName, { name: tName, hours: duration })
            }
        })

        // Sort teachers by hours (descending) and join names
        const sortedTeachers = Array.from(teacherHoursMap.values())
            .sort((a, b) => b.hours - a.hours)

        const teacherName = sortedTeachers.length > 0
            ? sortedTeachers.map(t => t.name).join(", ")
            : classroom.teachers[0]?.name || "Formateur"

        // Map sessions to include student attendance
        const sessions = dbSessions.map(session => {
            const sessionStudents = classroom.enrollments.map(enrollment => {
                const student = enrollment.student
                const attendance = session.attendances.find(a => a.studentId === student.id)
                return {
                    name: student.name || "Inconnu",
                    status: attendance?.status || "PENDING",
                    signature: attendance?.signatureUrl || null
                }
            })

            let location = "Non spécifié"
            if (session.type === "ONSITE") {
                location = classroom.locationOnSite || "Sur site"
            } else if (session.type === "ONLINE" || session.type === "HOMEWORK") {
                location = classroom.locationOnline || "En ligne"
            }

            return {
                id: session.id,
                startTime: session.startTime,
                endTime: session.endTime,
                type: session.type,
                teacherSignature: session.teacherSignature,
                location,
                teacherName: session.teacher?.name || teacherName,
                students: sessionStudents
            }
        })

        // Calculate totals
        let teacherTotalHours = 0
        let totalStudentHours = 0
        let totalExpectedStudentHours = 0

        const enrolledStudentIds = new Set(classroom.enrollments.map(e => e.studentId))

        dbSessions.forEach(session => {
            const duration = (new Date(session.endTime).getTime() - new Date(session.startTime).getTime()) / (1000 * 60 * 60)
            teacherTotalHours += duration

            const presentCount = session.attendances.filter(a =>
                a.status === "PRESENT" && enrolledStudentIds.has(a.studentId)
            ).length
            totalStudentHours += (duration * presentCount)
            totalExpectedStudentHours += (duration * classroom.enrollments.length)
        })

        return NextResponse.json({
            organizationName,
            classroomName: classroom.name,
            teacherName,
            startDate,
            endDate,
            range,
            sessions,
            teacherTotalHours,
            totalStudentHours,
            totalExpectedStudentHours
        })
    } catch (error) {
        console.error("Error fetching public attendance data:", error)
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
    }
}
