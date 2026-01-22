import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import fs from "fs/promises"
import path from "path"
import { getAuthUser } from "@/lib/auth-utils"

export async function GET(
    req: NextRequest,
    { params }: { params: any }
) {
    try {
        const user = await getAuthUser()
        if (!user || !user.organizationId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const { id: classroomId } = await params

        // Verify classroom belongs to user's organization
        const classroom = await prisma.classroom.findFirst({
            where: {
                id: classroomId,
                organizationId: user.organizationId
            },
            include: {
                resources: {
                    orderBy: { createdAt: "desc" }
                }
            }
        })

        if (!classroom) {
            return NextResponse.json({ error: "Classroom not found" }, { status: 404 })
        }

        return NextResponse.json(classroom.resources)
    } catch (error) {
        console.error("Get resources error:", error)
        return NextResponse.json({ error: "Failed to get resources" }, { status: 500 })
    }
}

export async function POST(
    req: NextRequest,
    { params }: { params: any }
) {
    try {
        const user = await getAuthUser()
        if (!user || !user.organizationId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        // Only teachers and admins can add resources
        if (user.role !== "ADMIN" && user.role !== "SUPER_ADMIN" && user.role !== "TEACHER") {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 })
        }

        const { id: classroomId } = await params
        const body = await req.json()
        const { title, description, url, type } = body

        if (!title || !url || !type) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
        }

        // Verify classroom belongs to user's organization
        const classroom = await prisma.classroom.findFirst({
            where: {
                id: classroomId,
                organizationId: user.organizationId
            }
        })

        if (!classroom) {
            return NextResponse.json({ error: "Classroom not found" }, { status: 404 })
        }

        const resource = await prisma.resource.create({
            data: {
                title,
                description: description || null,
                url,
                type,
                classroomId
            }
        })

        return NextResponse.json(resource)
    } catch (error) {
        console.error("Create resource error:", error)
        return NextResponse.json({ error: "Failed to create resource" }, { status: 500 })
    }
}

export async function DELETE(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const user = await getAuthUser()
        if (!user || !user.organizationId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        // Only teachers and admins can delete resources
        if (user.role !== "ADMIN" && user.role !== "SUPER_ADMIN" && user.role !== "TEACHER") {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 })
        }

        const { searchParams } = new URL(req.url)
        const resourceId = searchParams.get("resourceId")

        if (!resourceId) {
            return NextResponse.json({ error: "Missing resourceId" }, { status: 400 })
        }

        // Get resource to verify ownership and get file path
        const resource = await prisma.resource.findFirst({
            where: {
                id: resourceId,
                classroom: {
                    organizationId: user.organizationId
                }
            }
        })

        if (!resource) {
            return NextResponse.json({ error: "Resource not found" }, { status: 404 })
        }

        // Delete file if it's a FILE type
        if (resource.type === "FILE" && resource.url.startsWith("/uploads/")) {
            try {
                const filePath = path.join(process.cwd(), "public", resource.url)
                await fs.unlink(filePath)

                // Try to delete the resource directory if empty
                const resourceDir = path.dirname(filePath)
                try {
                    await fs.rmdir(resourceDir)
                } catch {
                    // Directory not empty or doesn't exist, ignore
                }
            } catch (error) {
                console.error("Failed to delete file:", error)
                // Continue with database deletion even if file deletion fails
            }
        }

        // Delete database record
        await prisma.resource.delete({
            where: { id: resourceId }
        })

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error("Delete resource error:", error)
        return NextResponse.json({ error: "Failed to delete resource" }, { status: 500 })
    }
}
