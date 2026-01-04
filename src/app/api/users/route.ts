import { NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { cookies } from "next/headers"

async function getUser() {
    let session = await auth()
    let user = session?.user

    // Dev login support
    if (!user && process.env.NODE_ENV === "development") {
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
    return user
}

export async function GET() {
    try {
        const user = await getUser()
        if (!user || !user.organizationId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        // Fetch users from the same organization
        const users = await prisma.user.findMany({
            where: {
                organizationId: user.organizationId
            },
            select: {
                id: true,
                name: true,
                email: true,
                role: true,
                image: true
            },
            orderBy: {
                name: "asc"
            }
        })

        return NextResponse.json(users)
    } catch (error) {
        console.error("Fetch users error:", error)
        return NextResponse.json({ error: "Failed to fetch users" }, { status: 500 })
    }
}
