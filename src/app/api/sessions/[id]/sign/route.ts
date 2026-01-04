import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"

export async function POST(
    req: Request,
    { params }: { params: any }
) {
    try {
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
                        role: devUser.role
                    } as any
                }
            }
        }

        if (!user || user.role === "STUDENT") {
            return new NextResponse("Unauthorized", { status: 401 })
        }

        const { id } = await params
        const { studentId, signatureData } = await req.json()

        // Create or update attendance
        // Note: In device sharing mode, we trust the teacher's device.
        // We might want to store that it was signed via device sharing?
        // `ipAddress` could be teacher's IP.

        if (studentId === user.id) {
            // Teacher signing themselves
            await prisma.classSession.update({
                where: { id },
                data: {
                    teacherSignature: signatureData
                }
            })
        } else {
            // Teacher signing for a student
            await prisma.attendance.upsert({
                where: {
                    sessionId_studentId: {
                        sessionId: id,
                        studentId
                    }
                },
                update: {
                    status: "PRESENT",
                    signatureUrl: signatureData,
                    signedAt: new Date()
                },
                create: {
                    sessionId: id,
                    studentId,
                    status: "PRESENT",
                    signatureUrl: signatureData,
                    signedAt: new Date()
                }
            })
        }

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error("Error submitting signature:", error)
        return new NextResponse("Internal Server Error", { status: 500 })
    }
}
