import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { cookies } from "next/headers"

async function getUser() {
    let session = await auth()
    let user = session?.user

    if (!user && process.env.NODE_ENV === "development") {
        const cookieStore = await cookies()
        const devUserId = cookieStore.get("dev-user-id")?.value
        if (devUserId) {
            const devUser = await prisma.user.findUnique({
                where: { id: devUserId }
            })
            if (devUser) {
                user = { id: devUser.id, organizationId: devUser.organizationId, role: devUser.role } as any
            }
        }
    }
    return user
}

export async function DELETE(req: NextRequest, { params }: { params: any }) {
    try {
        const user = await getUser()
        if (!user || !user.organizationId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const { id: sessionId } = await params

        // Verify session belongs to organization
        const session = await prisma.classSession.findFirst({
            where: {
                id: sessionId,
                classroom: {
                    organizationId: user.organizationId
                }
            }
        })

        if (!session) {
            return NextResponse.json({ error: "Session not found" }, { status: 404 })
        }

        // Delete related records first (foreign key constraints)
        await prisma.attendance.deleteMany({
            where: { sessionId }
        })

        await prisma.signatureToken.deleteMany({
            where: { sessionId }
        })

        // Now delete the session
        await prisma.classSession.delete({
            where: { id: sessionId }
        })

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error("Delete session error:", error)
        return NextResponse.json({ error: "Failed to delete session" }, { status: 500 })
    }
}

export async function PATCH(req: NextRequest, { params }: { params: any }) {
    try {
        const user = await getUser()
        if (!user || !user.organizationId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const { id: sessionId } = await params
        const body = await req.json()
        const { title, startTime, endTime, type, teacherId, isOnline } = body

        // Verify session belongs to organization
        const session = await prisma.classSession.findFirst({
            where: {
                id: sessionId,
                classroom: {
                    organizationId: user.organizationId
                }
            }
        })

        if (!session) {
            return NextResponse.json({ error: "Session not found" }, { status: 404 })
        }

        const updatedSession = await prisma.classSession.update({
            where: { id: sessionId },
            data: {
                title,
                startTime: startTime ? new Date(startTime) : undefined,
                endTime: endTime ? new Date(endTime) : undefined,
                type,
                isOnline,
                teacherId
            }
        })

        return NextResponse.json(updatedSession)
    } catch (error) {
        console.error("Update session error:", error)
        return NextResponse.json({ error: "Failed to update session" }, { status: 500 })
    }
}
