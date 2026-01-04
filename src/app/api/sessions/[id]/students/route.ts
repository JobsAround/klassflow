import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"

export async function GET(
    req: Request,
    { params }: { params: any }
) {
    try {
        const session = await auth()
        if (!session?.user || session.user.role === "STUDENT") {
            return new NextResponse("Unauthorized", { status: 401 })
        }

        const { id } = await params

        const classSession = await prisma.classSession.findUnique({
            where: { id },
            include: {
                classroom: {
                    include: {
                        enrollments: {
                            include: { student: true }
                        }
                    }
                },
                attendances: true
            }
        })

        if (!classSession) {
            return new NextResponse("Session not found", { status: 404 })
        }

        const students = classSession.classroom.enrollments.map(e => {
            const attendance = classSession.attendances.find(a =>
                a.studentId === e.student.id
            )

            let status = "NONE"
            if (attendance) {
                if (attendance.status === "PRESENT" || attendance.signatureUrl) {
                    status = "SIGNED"
                } else if (attendance.status === "ABSENT") {
                    status = "ABSENT"
                }
            }

            return {
                id: e.student.id,
                name: e.student.name,
                email: e.student.email,
                signed: status === "SIGNED",
                status
            }
        })

        return NextResponse.json({
            title: classSession.title || classSession.classroom.name,
            students
        })
    } catch (error) {
        console.error("Error fetching session students:", error)
        return new NextResponse("Internal Server Error", { status: 500 })
    }
}
