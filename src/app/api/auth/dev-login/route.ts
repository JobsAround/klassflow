import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"
import { cookies } from "next/headers"

export async function POST() {
    if (process.env.NODE_ENV !== "development") {
        return NextResponse.json({ error: "Only available in development" }, { status: 403 })
    }

    try {
        // Create or get dev user
        let devUser = await prisma.user.findUnique({
            where: { email: "dev@openclassroom.local" }
        })

        if (!devUser) {
            // Create dev organization
            const devOrg = await prisma.organization.create({
                data: {
                    name: "Dev Organization",
                    domain: "openclassroom.local"
                }
            })

            // Create dev user
            devUser = await prisma.user.create({
                data: {
                    email: "dev@openclassroom.local",
                    name: "Dev Admin",
                    role: "ADMIN",
                    organizationId: devOrg.id,
                    emailVerified: new Date()
                }
            })
        }

        // Set a dev session cookie
        const cookieStore = await cookies()
        cookieStore.set("dev-user-id", devUser.id, {
            httpOnly: true,
            secure: false,
            sameSite: "lax",
            maxAge: 60 * 60 * 24 // 24 hours
        })

        return NextResponse.json({ success: true, userId: devUser.id })
    } catch (error) {
        console.error("Dev login error:", error)
        return NextResponse.json({ error: "Failed to create dev user" }, { status: 500 })
    }
}
