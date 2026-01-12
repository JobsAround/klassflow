import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { cookies } from "next/headers"
import { checkOrganizationLimit } from "@/lib/limits-server"

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

export async function POST(req: NextRequest, { params }: { params: any }) {
    try {
        const user = await getUser()
        if (!user || !user.organizationId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const { id: classroomId } = await params
        const body = await req.json()
        const { studentIds = [], emails = [] } = body

        if ((!studentIds || studentIds.length === 0) && (!emails || emails.length === 0)) {
            return NextResponse.json({ error: "Student IDs or Emails required" }, { status: 400 })
        }

        // Verify classroom belongs to organization
        const classroom = await prisma.classroom.findFirst({
            where: {
                id: classroomId,
                organizationId: user.organizationId
            }
        })

        if (!classroom) {
            return NextResponse.json({ error: "Classroom not found" }, { status: 404 })
        }

        // Check student limit before proceeding
        const newStudentsCount = emails.length // Worst case: all emails are new students
        const limitCheck = await checkOrganizationLimit(prisma, user.organizationId, "students")
        if (!limitCheck.allowed || (limitCheck.limit > 0 && limitCheck.current + newStudentsCount > limitCheck.limit)) {
            return NextResponse.json({
                error: limitCheck.message || `Limite de stagiaires atteinte (${limitCheck.current}/${limitCheck.limit})`,
                limit: limitCheck.limit,
                current: limitCheck.current,
                canUpgrade: limitCheck.canUpgrade,
                upgradeUrl: limitCheck.upgradeUrl,
            }, { status: 403 })
        }

        const finalStudentIds = [...studentIds]

        // Process emails
        if (emails.length > 0) {
            for (const item of emails) {
                // Handle both string (legacy) and object format
                const email = typeof item === 'string' ? item : item.email
                const name = typeof item === 'string' ? email.split("@")[0] : item.name

                // Find or create user
                let student = await prisma.user.findUnique({
                    where: { email }
                })

                if (!student) {
                    // Create new student user
                    student = await prisma.user.create({
                        data: {
                            email,
                            role: "STUDENT",
                            organizationId: user.organizationId,
                            name: name || email.split("@")[0]
                        }
                    })
                } else {
                    // Verify existing user belongs to organization
                    if (student.organizationId !== user.organizationId) {
                        continue // Skip users from other orgs
                    }
                }

                if (!finalStudentIds.includes(student.id)) {
                    finalStudentIds.push(student.id)
                }
            }
        }

        // Create enrollments (skip duplicates)
        const enrollments = await Promise.all(
            finalStudentIds.map(studentId =>
                prisma.classroomEnrollment.upsert({
                    where: {
                        studentId_classroomId: {
                            studentId,
                            classroomId
                        }
                    },
                    create: {
                        studentId,
                        classroomId
                    },
                    update: {} // No update needed if already exists
                })
            )
        )

        return NextResponse.json({
            success: true,
            enrolled: enrollments.length
        })
    } catch (error) {
        console.error("Enroll students error:", error)
        return NextResponse.json({ error: "Failed to enroll students" }, { status: 500 })
    }
}

export async function DELETE(req: NextRequest, { params }: { params: any }) {
    try {
        const user = await getUser()
        if (!user || !user.organizationId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const { id: classroomId } = await params
        const { searchParams } = new URL(req.url)
        const studentId = searchParams.get("studentId")

        if (!studentId) {
            return NextResponse.json({ error: "Student ID required" }, { status: 400 })
        }

        // Verify classroom belongs to organization
        const classroom = await prisma.classroom.findFirst({
            where: {
                id: classroomId,
                organizationId: user.organizationId
            }
        })

        if (!classroom) {
            return NextResponse.json({ error: "Classroom not found" }, { status: 404 })
        }

        // Delete enrollment
        await prisma.classroomEnrollment.deleteMany({
            where: {
                studentId,
                classroomId
            }
        })

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error("Remove student error:", error)
        return NextResponse.json({ error: "Failed to remove student" }, { status: 500 })
    }
}
