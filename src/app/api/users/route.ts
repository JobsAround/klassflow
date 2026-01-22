import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getAuthUser } from "@/lib/auth-utils"

export async function GET() {
    try {
        const user = await getAuthUser()
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
