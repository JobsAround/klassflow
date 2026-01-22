
import { prisma } from "@/lib/prisma"
import { generateJaaSJwt, getJaaSRoomUrl } from "@/lib/jaas"
import { NextResponse } from "next/server"
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

        const classroom = await prisma.classroom.findUnique({
            where: { id },
        })

        if (!classroom) {
            return new NextResponse("Classroom not found", { status: 404 })
        }

        const roomName = `classroom-${classroom.id}`
        const token = generateJaaSJwt({
            id: user.id!,
            name: user.name || "Enseignant",
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
