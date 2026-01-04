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

export async function PATCH(req: NextRequest) {
    try {
        const user = await getUser()
        if (!user || !user.organizationId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        if (user.role !== "ADMIN") {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 })
        }

        const body = await req.json()
        const { name, domain, googleServiceAccountJson, smtpConfig } = body

        if (!name) {
            return NextResponse.json({ error: "Name is required" }, { status: 400 })
        }

        const updatedOrg = await prisma.organization.update({
            where: { id: user.organizationId },
            data: {
                name,
                domain: domain || null,
                googleServiceAccountJson: googleServiceAccountJson || null,
                smtpConfig: smtpConfig || null,
            }
        })

        return NextResponse.json(updatedOrg)
    } catch (error) {
        console.error("Update organization error:", error)
        return NextResponse.json({ error: "Failed to update organization" }, { status: 500 })
    }
}
