import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"

export async function PATCH(
    request: NextRequest,
    { params }: { params: Promise<{ id: string; resourceId: string }> }
) {
    try {
        const session = await auth()
        let user = session?.user

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
                        name: devUser.name,
                        email: devUser.email,
                        image: devUser.image,
                        role: devUser.role,
                        organizationId: devUser.organizationId
                    } as any
                }
            }
        }

        if (!user || (user.role !== "ADMIN" && user.role !== "TEACHER" && user.role !== "SUPER_ADMIN")) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const { id, resourceId } = await params
        const body = await request.json()
        const { pinned } = body

        // Verify resource belongs to a classroom in user's organization
        const resource = await prisma.resource.findFirst({
            where: {
                id: resourceId,
                classroomId: id,
                classroom: {
                    organizationId: user.organizationId!
                }
            }
        })

        if (!resource) {
            return NextResponse.json({ error: "Resource not found" }, { status: 404 })
        }

        const updatedResource = await prisma.resource.update({
            where: { id: resourceId },
            data: { pinned }
        })

        return NextResponse.json(updatedResource)
    } catch (error) {
        console.error("Error updating resource pin status:", error)
        return NextResponse.json({ error: "Internal server error" }, { status: 500 })
    }
}
