import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getAuthUser } from "@/lib/auth-utils"

export async function POST(req: NextRequest) {
    try {
        const user = await getAuthUser()
        if (!user || !user.organizationId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        // Only teachers and admins can generate tokens
        if (user.role !== "ADMIN" && user.role !== "SUPER_ADMIN" && user.role !== "TEACHER") {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 })
        }

        const body = await req.json()
        const { sessionId, studentIds } = body

        if (!sessionId || !studentIds || !Array.isArray(studentIds) || studentIds.length === 0) {
            return NextResponse.json({ error: "Missing sessionId or studentIds" }, { status: 400 })
        }

        // Verify session belongs to user's organization
        const session = await prisma.classSession.findFirst({
            where: {
                id: sessionId,
                classroom: { organizationId: user.organizationId }
            }
        })

        if (!session) {
            return NextResponse.json({ error: "Session not found" }, { status: 404 })
        }

        // Calculate expiration time (session start time + 30 minutes)
        const expiresAt = new Date(session.startTime)
        expiresAt.setMinutes(expiresAt.getMinutes() + 30)

        // Generate tokens for each student
        const tokens = await Promise.all(
            studentIds.map(async (studentId: string) => {
                // Check if token already exists for this student/session
                const existing = await prisma.signatureToken.findFirst({
                    where: {
                        sessionId,
                        studentId,
                        usedAt: null
                    }
                })

                if (existing) {
                    return {
                        studentId,
                        token: existing.token,
                        url: `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/signature/${existing.token}`
                    }
                }

                // Create new token
                const newToken = await prisma.signatureToken.create({
                    data: {
                        sessionId,
                        studentId,
                        expiresAt
                    }
                })

                return {
                    studentId,
                    token: newToken.token,
                    url: `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/signature/${newToken.token}`
                }
            })
        )

        return NextResponse.json({ tokens })
    } catch (error) {
        console.error("Generate tokens error:", error)
        return NextResponse.json({ error: "Failed to generate tokens" }, { status: 500 })
    }
}
