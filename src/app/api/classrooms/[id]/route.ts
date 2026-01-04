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

export async function PATCH(
    req: NextRequest,
    { params }: { params: any }
) {
    try {
        const user = await getUser()
        if (!user || !user.organizationId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        if (user.role !== "ADMIN" && user.role !== "SUPER_ADMIN" && user.role !== "TEACHER") {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 })
        }

        const { id } = await params
        const body = await req.json()
        const { name, description, locationOnSite, locationOnline, locationOnline2 } = body

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
                locationOnline2
            }
        })

        return NextResponse.json(updatedClassroom)
    } catch (error) {
        console.error("Update classroom error:", error)
        return NextResponse.json({ error: "Failed to update classroom" }, { status: 500 })
    }
}
