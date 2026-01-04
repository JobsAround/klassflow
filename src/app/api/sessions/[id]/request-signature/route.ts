import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { NextResponse, NextRequest } from "next/server"
import { sendTeacherSignatureRequestEmail } from "@/lib/email"
import { rateLimit } from "@/lib/ratelimit"

export async function POST(
    req: Request,
    { params }: { params: any }
) {
    try {
        const { success } = await rateLimit(req as NextRequest)
        if (!success) {
            return new NextResponse("Too Many Requests", { status: 429 })
        }

        let session = await auth()
        let user = session?.user

        // Dev login support
        if (!user && process.env.NODE_ENV === "development") {
            const { cookies } = await import("next/headers")
            const cookieStore = await cookies()
            const devUserId = cookieStore.get("dev-user-id")?.value
            if (devUserId) {
                const devUser = await prisma.user.findUnique({
                    where: { id: devUserId }
                })
                if (devUser) {
                    user = {
                        id: devUser.id,
                        role: devUser.role,
                        organizationId: devUser.organizationId
                    } as any
                }
            }
        }

        if (!user || user.role === "STUDENT") {
            return new NextResponse("Unauthorized", { status: 401 })
        }

        const { id } = await params
        const { teacherId } = await req.json()

        const sessionData = await prisma.classSession.findUnique({
            where: { id },
            include: {
                classroom: true
            }
        })

        if (!sessionData) {
            return new NextResponse("Session not found", { status: 404 })
        }

        const teacher = await prisma.user.findUnique({
            where: { id: teacherId }
        })

        if (!teacher) {
            return new NextResponse("Teacher not found", { status: 404 })
        }

        // Check for other pending (unsigned) sessions for this teacher
        // Only past sessions (endTime < now) where they are the teacher and haven't signed
        const pendingSessions = await prisma.classSession.findMany({
            where: {
                teacherId: teacher.id,
                endTime: { lt: new Date() },
                teacherSignature: null,
                id: { not: sessionData.id } // Exclude current session
            },
            include: {
                classroom: { select: { name: true } }
            },
            orderBy: { startTime: 'desc' },
            take: 5 // Limit to 5 most recent to avoid massive emails
        })

        // Generate or find existing signature token for the teacher
        // reusing SignatureToken model where studentId = teacherId
        let signatureToken = await prisma.signatureToken.findFirst({
            where: {
                sessionId: sessionData.id,
                studentId: teacher.id,
                expiresAt: { gt: new Date() }
            }
        })

        if (!signatureToken) {
            signatureToken = await prisma.signatureToken.create({
                data: {
                    sessionId: sessionData.id,
                    studentId: teacher.id,
                    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days validity
                }
            })
        }

        const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
        const link = `${appUrl}/teacher-signature/${signatureToken.token}`

        await sendTeacherSignatureRequestEmail(
            user.organizationId!,
            teacher.email,
            teacher.name || "Formateur",
            {
                id: sessionData.id,
                title: sessionData.title,
                classroomId: sessionData.classroomId,
                classroomName: sessionData.classroom.name,
                startTime: sessionData.startTime,
                endTime: sessionData.endTime
            },
            pendingSessions.map(s => ({
                id: s.id,
                classroomName: s.classroom.name,
                startTime: s.startTime,
                endTime: s.endTime
            })),
            link
        )

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error("Error sending signature request:", error)
        return new NextResponse("Internal Server Error", { status: 500 })
    }
}
