import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"
import { generateJaaSJwt, getJaaSRoomUrl } from "@/lib/jaas"

// This route allows public guests to join a session if they have the correct classroom token
export async function POST(
    req: Request,
    { params }: { params: Promise<{ token: string }> }
) {
    try {
        const { token } = await params
        const { guestName, roomSuffix } = await req.json()

        const classroom = await prisma.classroom.findFirst({
            where: {
                OR: [
                    { shareToken: token },
                    { id: token }
                ]
            }
        })

        if (!classroom) {
            return new NextResponse("Classroom not found or sharing disabled", { status: 404 })
        }

        // Validate room suffix (only allow empty or "-2")
        const validSuffix = roomSuffix === "-2" ? "-2" : ""

        // Generate JaaS Token for Guest (using consistent classroom room name)
        const roomName = `classroom-${classroom.id}${validSuffix}`
        const jaasToken = generateJaaSJwt({
            id: `guest-${Math.random().toString(36).substr(2, 9)}`,
            name: guestName || "Invité",
            email: "",
            avatar: "",
            isModerator: false // GUEST IS NOT MODERATOR
        }, roomName)

        const url = getJaaSRoomUrl(roomName)

        return NextResponse.json({
            token: jaasToken,
            url,
            roomName
        })

    } catch (error) {
        console.error("Error generating Guest token:", error)
        return new NextResponse("Internal Server Error", { status: 500 })
    }
}
