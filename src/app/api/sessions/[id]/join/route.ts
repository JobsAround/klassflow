import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"
import { generateJaaSJwt, getJaaSRoomUrl } from "@/lib/jaas"

export async function POST(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
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
                        name: devUser.name,
                        email: devUser.email,
                        role: devUser.role,
                        image: devUser.image,
                        organizationId: devUser.organizationId
                    } as any
                }
            }
        }

        if (!user || user.role === "STUDENT") {
            return new NextResponse("Unauthorized", { status: 401 })
        }

        const { id } = await params

        const classSession = await prisma.classSession.findUnique({
            where: { id },
        })

        if (!classSession) {
            return new NextResponse("Session not found", { status: 404 })
        }

        // Generate JaaS Token
        // Using session ID as room name ensures uniqueness
        const roomName = classSession.id
        const token = generateJaaSJwt({
            id: user.id!,
            name: user.name || "Teacher",
            email: user.email || "",
            avatar: user.image || "",
            isModerator: true // Authorize as moderator
        }, roomName)

        const url = getJaaSRoomUrl(roomName)

        return NextResponse.json({
            token,
            url,
            roomName
        })

    } catch (error) {
        console.error("Error generating JaaS token:", error)
        return new NextResponse("Internal Server Error", { status: 500 })
    }
}
