import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import crypto from "crypto"
import { getAuthUser } from "@/lib/auth-utils"

function generateShareToken(): string {
    return crypto.randomBytes(32).toString('hex')
}

export async function POST(req: NextRequest, { params }: { params: any }) {
    try {
        const user = await getAuthUser()
        if (!user || !user.organizationId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const { id: classroomId } = await params
        const body = await req.json()
        const { action } = body

        // Verify classroom belongs to organization
        const classroom = await prisma.classroom.findFirst({
            where: {
                id: classroomId,
                organizationId: user.organizationId
            },
            include: {
                teachers: { select: { id: true } }
            }
        })

        if (!classroom) {
            return NextResponse.json({ error: "Classroom not found" }, { status: 404 })
        }

        // Check authorization: Admin or assigned teacher
        const isTeacher = classroom.teachers.some(t => t.id === user.id)
        if (user.role !== "ADMIN" && !isTeacher) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 })
        }

        // Handle different actions
        switch (action) {
            case "enable": {
                // Generate token if not exists
                const shareToken = classroom.shareToken || generateShareToken()
                const updated = await prisma.classroom.update({
                    where: { id: classroomId },
                    data: {
                        shareEnabled: true,
                        shareToken
                    }
                })
                return NextResponse.json({
                    shareEnabled: updated.shareEnabled,
                    shareToken: updated.shareToken
                })
            }

            case "disable": {
                const updated = await prisma.classroom.update({
                    where: { id: classroomId },
                    data: { shareEnabled: false }
                })
                return NextResponse.json({
                    shareEnabled: updated.shareEnabled
                })
            }

            case "regenerate": {
                const newToken = generateShareToken()
                const updated = await prisma.classroom.update({
                    where: { id: classroomId },
                    data: {
                        shareToken: newToken,
                        shareEnabled: true
                    }
                })
                return NextResponse.json({
                    shareEnabled: updated.shareEnabled,
                    shareToken: updated.shareToken
                })
            }

            default:
                return NextResponse.json({ error: "Invalid action" }, { status: 400 })
        }
    } catch (error) {
        console.error("Share management error:", error)
        return NextResponse.json({ error: "Failed to manage sharing" }, { status: 500 })
    }
}
