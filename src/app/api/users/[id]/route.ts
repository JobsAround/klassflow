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
                user = { id: devUser.id, organizationId: devUser.organizationId, role: devUser.role } as any
            }
        }
    }
    return user
}

export async function PATCH(req: NextRequest, { params }: { params: any }) {
    try {
        const user = await getUser()
        if (!user || !user.organizationId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        if (user.role !== "ADMIN" && user.role !== "SUPER_ADMIN") {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 })
        }

        const { id } = await params
        const body = await req.json()
        const { name, email, role } = body

        // Verify the user belongs to the same organization
        const targetUser = await prisma.user.findFirst({
            where: {
                id,
                organizationId: user.organizationId
            }
        })

        if (!targetUser) {
            return NextResponse.json({ error: "User not found" }, { status: 404 })
        }

        // Prevent ADMIN from modifying SUPER_ADMIN
        if (user.role === "ADMIN" && targetUser.role === "SUPER_ADMIN") {
            return NextResponse.json({ error: "Admins cannot modify Super Admins" }, { status: 403 })
        }

        // Prevent changing your own role
        if (targetUser.id === user.id && role && role !== targetUser.role) {
            return NextResponse.json({ error: "Cannot change your own role" }, { status: 400 })
        }

        // Update user
        const updatedUser = await prisma.user.update({
            where: { id },
            data: {
                ...(name && { name }),
                ...(email && { email }),
                ...(role && { role })
            }
        })

        return NextResponse.json(updatedUser)
    } catch (error) {
        console.error("Update user error:", error)
        return NextResponse.json({ error: "Failed to update user" }, { status: 500 })
    }
}

export async function DELETE(req: NextRequest, { params }: { params: any }) {
    try {
        const user = await getUser()
        if (!user || !user.organizationId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        if (user.role !== "ADMIN" && user.role !== "SUPER_ADMIN") {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 })
        }

        const { id } = await params

        // Verify the user belongs to the same organization
        const targetUser = await prisma.user.findFirst({
            where: {
                id,
                organizationId: user.organizationId
            }
        })

        if (!targetUser) {
            return NextResponse.json({ error: "User not found" }, { status: 404 })
        }

        // Prevent ADMIN from deleting SUPER_ADMIN
        if (user.role === "ADMIN" && targetUser.role === "SUPER_ADMIN") {
            return NextResponse.json({ error: "Admins cannot delete Super Admins" }, { status: 403 })
        }

        // Prevent deleting yourself
        if (targetUser.id === user.id) {
            return NextResponse.json({ error: "Cannot delete your own account" }, { status: 400 })
        }

        // Delete user
        await prisma.user.delete({
            where: { id }
        })

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error("Delete user error:", error)
        return NextResponse.json({ error: error instanceof Error ? error.message : "Failed to delete user" }, { status: 500 })
    }
}
