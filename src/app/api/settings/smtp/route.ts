import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/auth"
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
                user = {
                    id: devUser.id,
                    role: devUser.role,
                    organizationId: devUser.organizationId
                } as any
            }
        }
    }

    return user
}

export async function GET(req: NextRequest) {
    try {
        const user = await getUser()
        if (!user || !user.organizationId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const org = await prisma.organization.findUnique({
            where: { id: user.organizationId },
            select: { smtpConfig: true }
        })

        return NextResponse.json({
            configured: !!org?.smtpConfig
        })
    } catch (error) {
        console.error("Get SMTP config error:", error)
        return NextResponse.json({ error: "Failed to get SMTP config" }, { status: 500 })
    }
}

export async function POST(req: NextRequest) {
    try {
        const user = await getUser()
        if (!user || !user.organizationId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        // Only admins can configure SMTP
        if (user.role !== "ADMIN") {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 })
        }

        const body = await req.json()
        const { host, port, secure, user: smtpUser, pass, from } = body

        if (!host || !port || !smtpUser || !pass || !from) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
        }

        // Update organization SMTP config
        await prisma.organization.update({
            where: { id: user.organizationId },
            data: {
                smtpConfig: {
                    host,
                    port: parseInt(String(port)),
                    secure: !!secure,
                    user: smtpUser,
                    pass,
                    from
                }
            }
        })

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error("Save SMTP config error:", error)
        return NextResponse.json({ error: "Failed to save SMTP config" }, { status: 500 })
    }
}
