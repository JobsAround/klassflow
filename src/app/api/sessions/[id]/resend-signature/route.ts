import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { sendSignatureEmail } from "@/lib/email"
import { NextResponse } from "next/server"

export async function POST(
    req: Request,
    { params }: { params: any }
) {
    try {
        const session = await auth()
        if (!session?.user || session.user.role === "STUDENT") {
            return new NextResponse("Unauthorized", { status: 401 })
        }

        const { id } = await params
        const { studentId } = await req.json()

        if (!studentId) {
            return new NextResponse("Student ID is required", { status: 400 })
        }

        const classSession = await prisma.classSession.findUnique({
            where: { id },
            include: {
                classroom: {
                    include: {
                        organization: true
                    }
                }
            }
        })

        if (!classSession) {
            return new NextResponse("Session not found", { status: 404 })
        }

        // Verify teacher belongs to organization
        if (session.user.role !== "ADMIN" && session.user.organizationId !== classSession.classroom.organizationId) {
            return new NextResponse("Forbidden", { status: 403 })
        }

        const student = await prisma.user.findUnique({
            where: { id: studentId }
        })

        if (!student) {
            return new NextResponse("Student not found", { status: 404 })
        }

        // Calculate expiration time (30 minutes after session start or now + 30m if session already started?)
        // If forcing resend, maybe give them fresh 30 mins from now?
        // Or stick to session time?
        // If session was yesterday, resending might be for justification?
        // But signature is for presence.
        // Let's assume 30 mins from NOW for forced resend, or stick to original logic?
        // Original logic: expiresAt = session.startTime + 30m.
        // If session is over, token is expired.
        // If teacher forces resend, maybe they want to allow signing NOW?
        // "Peut forcer le renvoi ... si la fonctionnalité était désactivée".
        // If it was disabled, maybe they enable it now?
        // Let's set expiresAt to Now + 30m to be safe/useful.

        const expiresAt = new Date()
        expiresAt.setMinutes(expiresAt.getMinutes() + 30)

        // Find or create token
        let token = await prisma.signatureToken.findFirst({
            where: {
                sessionId: classSession.id,
                studentId: student.id,
                usedAt: null
            }
        })

        if (token) {
            // Update expiration
            token = await prisma.signatureToken.update({
                where: { id: token.id },
                data: { expiresAt, emailSentAt: new Date() }
            })
        } else {
            token = await prisma.signatureToken.create({
                data: {
                    sessionId: classSession.id,
                    studentId: student.id,
                    expiresAt,
                    emailSentAt: new Date()
                }
            })
        }

        const signatureUrl = `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/signature/${token.token}`

        await sendSignatureEmail(
            classSession.classroom.organizationId,
            student.email,
            student.name || "Étudiant",
            signatureUrl,
            {
                title: classSession.title,
                classroomName: classSession.classroom.name,
                startTime: classSession.startTime,
                endTime: classSession.endTime,
                type: classSession.type
            }
        )

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error("Error resending signature email:", error)
        return new NextResponse("Internal Server Error", { status: 500 })
    }
}
