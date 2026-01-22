import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"
import { generateJaaSJwt, getJaaSRoomUrl } from "@/lib/jaas"
import { getAuthUser } from "@/lib/auth-utils"

export async function POST(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const user = await getAuthUser()

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

        if (!token || !url) {
            return new NextResponse("Video conferencing is not configured", { status: 503 })
        }

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
