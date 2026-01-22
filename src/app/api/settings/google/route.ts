import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getAuthUser } from "@/lib/auth-utils"

export async function GET(req: NextRequest) {
    try {
        const user = await getAuthUser()
        if (!user || !user.organizationId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const org = await prisma.organization.findUnique({
            where: { id: user.organizationId },
            select: { googleServiceAccountJson: true }
        })

        return NextResponse.json({
            configured: !!org?.googleServiceAccountJson
        })
    } catch (error) {
        console.error("Get Google config error:", error)
        return NextResponse.json({ error: "Failed to get Google config" }, { status: 500 })
    }
}

export async function POST(req: NextRequest) {
    try {
        const user = await getAuthUser()
        if (!user || !user.organizationId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        // Only admins can configure Google service account
        if (user.role !== "ADMIN") {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 })
        }

        const body = await req.json()
        const { serviceAccountJson } = body

        if (!serviceAccountJson) {
            return NextResponse.json({ error: "Missing service account JSON" }, { status: 400 })
        }

        // Validate JSON format
        try {
            const parsed = JSON.parse(serviceAccountJson)
            if (!parsed.type || !parsed.project_id || !parsed.private_key || !parsed.client_email) {
                throw new Error("Invalid service account JSON format")
            }
        } catch (error) {
            return NextResponse.json({ error: "Invalid service account JSON" }, { status: 400 })
        }

        // Update organization Google service account
        await prisma.organization.update({
            where: { id: user.organizationId },
            data: {
                googleServiceAccountJson: serviceAccountJson
            }
        })

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error("Save Google config error:", error)
        return NextResponse.json({ error: "Failed to save Google config" }, { status: 500 })
    }
}
