import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getAuthUser } from "@/lib/auth-utils"

export async function POST(req: NextRequest) {
    try {
        const user = await getAuthUser()
        if (!user || !user.organizationId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        if (user.role !== "ADMIN") {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 })
        }

        const body = await req.json()
        const { email, name, role, classroomIds } = body

        if (!email || !name || !role) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
        }

        // Validate classroom requirement for students
        if (role === "STUDENT" && (!classroomIds || classroomIds.length === 0)) {
            return NextResponse.json({ error: "Students must be assigned to at least one classroom" }, { status: 400 })
        }

        // Check if user already exists
        const existingUser = await prisma.user.findUnique({
            where: { email }
        })

        if (existingUser) {
            return NextResponse.json({ error: "User already exists" }, { status: 409 })
        }

        // Create user and handle classroom assignments in a transaction
        const newUser = await prisma.$transaction(async (tx) => {
            // Create user
            const createdUser = await tx.user.create({
                data: {
                    email,
                    name,
                    role,
                    organizationId: user.organizationId
                }
            })

            // Handle classroom assignments if provided
            if (classroomIds && classroomIds.length > 0) {
                // Verify all classrooms belong to the organization
                const classrooms = await tx.classroom.findMany({
                    where: {
                        id: { in: classroomIds },
                        organizationId: user.organizationId!
                    }
                })

                if (classrooms.length !== classroomIds.length) {
                    throw new Error("Invalid classroom IDs")
                }

                if (role === "STUDENT") {
                    // Create enrollments for students
                    await tx.classroomEnrollment.createMany({
                        data: classroomIds.map((classroomId: string) => ({
                            studentId: createdUser.id,
                            classroomId
                        }))
                    })
                } else if (role === "TEACHER") {
                    // Assign teacher to classrooms
                    for (const classroomId of classroomIds) {
                        await tx.classroom.update({
                            where: { id: classroomId },
                            data: {
                                teachers: {
                                    connect: { id: createdUser.id }
                                }
                            }
                        })
                    }
                }
            }

            return createdUser
        })

        // Send invitation email
        try {
            const { sendInvitationEmail } = await import("@/lib/email")

            // Get classroom names if classrooms were assigned
            let classroomNames: string[] | undefined
            if (classroomIds && classroomIds.length > 0) {
                const classrooms = await prisma.classroom.findMany({
                    where: { id: { in: classroomIds } },
                    select: { name: true }
                })
                classroomNames = classrooms.map(c => c.name)
            }

            await sendInvitationEmail(
                user.organizationId!,
                email,
                name,
                role,
                classroomNames
            )
            console.log(`Invitation email sent to ${email}`)
        } catch (emailError) {
            // Log error but don't fail the request
            console.error("Failed to send invitation email:", emailError)
        }

        return NextResponse.json(newUser)
    } catch (error) {
        console.error("Invite user error:", error)
        return NextResponse.json({ error: "Failed to invite user" }, { status: 500 })
    }
}
