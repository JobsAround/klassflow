import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { checkOrganizationLimit } from "@/lib/limits-server"
import { getAuthUser } from "@/lib/auth-utils"

export async function POST(req: NextRequest) {
    try {
        const user = await getAuthUser()
        if (!user || !user.organizationId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        // Check classroom limit
        const limitCheck = await checkOrganizationLimit(prisma, user.organizationId, "classrooms")
        if (!limitCheck.allowed) {
            return NextResponse.json({
                error: limitCheck.message,
                limit: limitCheck.limit,
                current: limitCheck.current,
                canUpgrade: limitCheck.canUpgrade,
                upgradeUrl: limitCheck.upgradeUrl,
            }, { status: 403 })
        }

        const body = await req.json()
        const { name, description, locationOnSite, locationOnline } = body

        if (!name) {
            return NextResponse.json({ error: "Name is required" }, { status: 400 })
        }

        const classroom = await prisma.classroom.create({
            data: {
                name,
                description,
                locationOnSite,
                locationOnline,
                organizationId: user.organizationId
            }
        })

        return NextResponse.json(classroom)
    } catch (error) {
        console.error("Create classroom error:", error)
        return NextResponse.json({ error: "Failed to create classroom" }, { status: 500 })
    }
}

export async function GET(req: NextRequest) {
    try {
        const user = await getAuthUser()
        if (!user || !user.organizationId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const classrooms = await prisma.classroom.findMany({
            where: { organizationId: user.organizationId },
            include: {
                teachers: { select: { id: true, name: true, email: true } },
                _count: { select: { sessions: true, resources: true } }
            },
            orderBy: { createdAt: "desc" }
        })

        return NextResponse.json(classrooms)
    } catch (error) {
        console.error("Get classrooms error:", error)
        return NextResponse.json({ error: "Failed to fetch classrooms" }, { status: 500 })
    }
}
