import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getAuthUser } from "@/lib/auth-utils"

export async function POST(req: NextRequest, { params }: { params: any }) {
    try {
        const user = await getAuthUser()
        if (!user || !user.organizationId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        if (user.role !== "ADMIN" && user.role !== "SUPER_ADMIN" && user.role !== "TEACHER") {
            return NextResponse.json({ error: "Admin or Teacher access required" }, { status: 403 })
        }

        const { id: classroomId } = await params
        const body = await req.json()
        const { teacherIds } = body

        if (!teacherIds || !Array.isArray(teacherIds) || teacherIds.length === 0) {
            return NextResponse.json({ error: "Teacher IDs required" }, { status: 400 })
        }

        // Verify classroom belongs to organization
        const classroom = await prisma.classroom.findFirst({
            where: {
                id: classroomId,
                organizationId: user.organizationId
            },
            include: {
                teachers: { select: { id: true } }
            }
        })

        if (!classroom) {
            return NextResponse.json({ error: "Classroom not found" }, { status: 404 })
        }

        // Verify all teachers belong to organization and are teachers/admins
        const teachers = await prisma.user.findMany({
            where: {
                id: { in: teacherIds },
                organizationId: user.organizationId,
                role: { in: ["TEACHER", "ADMIN"] }
            }
        })

        if (teachers.length !== teacherIds.length) {
            return NextResponse.json({ error: "Invalid teacher IDs" }, { status: 400 })
        }

        // Get current teacher IDs
        const currentTeacherIds = classroom.teachers.map(t => t.id)

        // Combine with new teacher IDs (avoid duplicates)
        const allTeacherIds = Array.from(new Set([...currentTeacherIds, ...teacherIds]))

        // Update classroom with all teachers
        await prisma.classroom.update({
            where: { id: classroomId },
            data: {
                teachers: {
                    set: allTeacherIds.map(id => ({ id }))
                }
            }
        })

        return NextResponse.json({
            success: true,
            assigned: teacherIds.length
        })
    } catch (error) {
        console.error("Assign teachers error:", error)
        return NextResponse.json({ error: "Failed to assign teachers" }, { status: 500 })
    }
}

export async function DELETE(req: NextRequest, { params }: { params: any }) {
    try {
        const user = await getAuthUser()
        if (!user || !user.organizationId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        if (user.role !== "ADMIN" && user.role !== "SUPER_ADMIN" && user.role !== "TEACHER") {
            return NextResponse.json({ error: "Admin or Teacher access required" }, { status: 403 })
        }

        const { id: classroomId } = await params
        const { searchParams } = new URL(req.url)
        const teacherId = searchParams.get("teacherId")

        if (!teacherId) {
            return NextResponse.json({ error: "Teacher ID required" }, { status: 400 })
        }

        // Verify classroom belongs to organization
        const classroom = await prisma.classroom.findFirst({
            where: {
                id: classroomId,
                organizationId: user.organizationId
            },
            include: {
                teachers: { select: { id: true } }
            }
        })

        if (!classroom) {
            return NextResponse.json({ error: "Classroom not found" }, { status: 404 })
        }

        // Remove teacher from classroom
        const remainingTeacherIds = classroom.teachers
            .map(t => t.id)
            .filter(id => id !== teacherId)

        await prisma.classroom.update({
            where: { id: classroomId },
            data: {
                teachers: {
                    set: remainingTeacherIds.map(id => ({ id }))
                }
            }
        })

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error("Remove teacher error:", error)
        return NextResponse.json({ error: "Failed to remove teacher" }, { status: 500 })
    }
}
