import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getAuthUser } from "@/lib/auth-utils"

export async function PATCH(
    req: NextRequest,
    { params }: { params: any }
) {
    try {
        const user = await getAuthUser()
        if (!user || !user.organizationId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        if (user.role !== "ADMIN" && user.role !== "SUPER_ADMIN" && user.role !== "TEACHER") {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 })
        }

        const { id } = await params
        const body = await req.json()
        const { name, description, locationOnSite, locationOnline, locationOnline2, videoEnabled } = body

        if (!name) {
            return NextResponse.json({ error: "Name is required" }, { status: 400 })
        }

        // Verify ownership
        const classroom = await prisma.classroom.findFirst({
            where: {
                id,
                organizationId: user.organizationId
            }
        })

        if (!classroom) {
            return NextResponse.json({ error: "Classroom not found" }, { status: 404 })
        }

        const updatedClassroom = await prisma.classroom.update({
            where: { id },
            data: {
                name,
                description,
                locationOnSite,
                locationOnline,
                locationOnline2,
                ...(videoEnabled !== undefined && { videoEnabled })
            }
        })

        return NextResponse.json(updatedClassroom)
    } catch (error) {
        console.error("Update classroom error:", error)
        return NextResponse.json({ error: "Failed to update classroom" }, { status: 500 })
    }
}
