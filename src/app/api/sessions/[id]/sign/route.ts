import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"
import { getAuthUser } from "@/lib/auth-utils"

export async function POST(
    req: Request,
    { params }: { params: any }
) {
    try {
        const user = await getAuthUser()

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
