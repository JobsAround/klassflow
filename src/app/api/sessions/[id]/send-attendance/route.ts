import { prisma } from "@/lib/prisma"
import { sendSignatureEmail } from "@/lib/email"
import { NextResponse, NextRequest } from "next/server"
import { rateLimit } from "@/lib/ratelimit"
import { getAuthUser } from "@/lib/auth-utils"

export async function POST(
    req: Request,
    { params }: { params: any }
) {
    try {
        const { success } = await rateLimit(req as NextRequest)
        if (!success) {
            return new NextResponse("Too Many Requests", { status: 429 })
        }

        const user = await getAuthUser()

        if (!user || user.role === "STUDENT") {
            return new NextResponse("Unauthorized", { status: 401 })
        }

        const { id } = await params
        const { studentIds } = await req.json() // Array of student IDs, or undefined for all

        const classSession = await prisma.classSession.findUnique({
            where: { id },
            include: {
                classroom: {
                    include: {
                        enrollments: {
                            include: {
                                student: true
                            }
                        }
                    }
                }
            }
        })

        if (!classSession) {
            return new NextResponse("Session not found", { status: 404 })
        }

        // Filter students if specific IDs provided
        let studentsToEmail = classSession.classroom.enrollments
            .map(enrollment => enrollment.student)
            .filter(student => student.email) // Ensure student has email

        if (studentIds && Array.isArray(studentIds) && studentIds.length > 0) {
            studentsToEmail = studentsToEmail.filter(s => studentIds.includes(s.id))
        }

        // Always set expiration to 7 days from NOW
        const expiresAt = new Date()
        expiresAt.setDate(expiresAt.getDate() + 7)

        let sentCount = 0

        console.log(`Found ${studentsToEmail.length} students to email for session ${classSession.id}`)

        const emailPromises = studentsToEmail.map(async (student) => {
            try {
                // Delete ALL existing tokens for this session/student to avoid confusion
                await prisma.signatureToken.deleteMany({
                    where: {
                        sessionId: classSession.id,
                        studentId: student.id
                    }
                })

                // Always create a fresh token with correct expiration
                const token = await prisma.signatureToken.create({
                    data: {
                        sessionId: classSession.id,
                        studentId: student.id,
                        expiresAt
                    }
                })

                const signatureUrl = `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/signature/${token.token}`

                await sendSignatureEmail(
                    classSession.classroom.organizationId,
                    student.email,
                    student.name || "Étudiant",
                    signatureUrl,
                    {
                        title: classSession.title,
                        classroomName: classSession.classroom.name,
                        startTime: classSession.startTime,
                        endTime: classSession.endTime
                    }
                )

                // Mark email as sent
                await prisma.signatureToken.update({
                    where: { id: token.id },
                    data: { emailSentAt: new Date() }
                })

                return true
            } catch (error) {
                console.error(`Failed to send email to ${student.email}:`, error)
                return false
            }
        })

        const results = await Promise.allSettled(emailPromises)
        sentCount = results.filter(r => r.status === 'fulfilled' && r.value === true).length

        return NextResponse.json({
            message: `Sent attendance request to ${sentCount} students (Classroom: ${classSession.classroom.name}, Enrollments: ${classSession.classroom.enrollments.length})`,
            count: sentCount
        })
    } catch (error) {
        console.error("Error sending attendance emails:", error)
        return new NextResponse("Internal Server Error", { status: 500 })
    }
}
