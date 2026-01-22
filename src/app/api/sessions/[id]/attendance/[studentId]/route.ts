import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"
import { getAuthUser } from "@/lib/auth-utils"

export async function DELETE(
    req: Request,
    { params }: { params: any }
) {
    try {
        const user = await getAuthUser()

        if (!user || user.role === "STUDENT") {
            return new NextResponse("Unauthorized", { status: 401 })
        }

        const { id, studentId } = await params

        // Delete attendance record
        await prisma.attendance.deleteMany({
            where: {
                sessionId: id,
                studentId: studentId
            }
        })

        // Also ensure token allows re-signing if needed?
        // Actually if we delete attendance, the student might need a new token or reuse existing?
        // In send-attendance, we check if token exists.
        // If the student tries to sign again, they need a valid token.
        // If the old token was marked as used, we might need to reset it?

        // Reset the token usage if it exists and corresponds to this session/student
        // And extend validity so the link works immediately
        await prisma.signatureToken.updateMany({
            where: {
                sessionId: id,
                studentId: studentId
            },
            data: {
                usedAt: null,
                expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // +7 days
            }
        })

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error("Error removing attendance:", error)
        return new NextResponse("Internal Server Error", { status: 500 })
    }
}
