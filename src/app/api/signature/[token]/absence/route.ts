import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"

export async function POST(
    req: Request,
    { params }: { params: any }
) {
    try {
        const { token } = await params
        const { reason } = await req.json()

        const signatureToken = await prisma.signatureToken.findUnique({
            where: { token },
            include: {
                session: {
                    include: {
                        classroom: {
                            include: {
                                organization: { select: { name: true } }
                            }
                        }
                    }
                },
                student: true
            }
        })

        if (!signatureToken) {
            return new NextResponse("Invalid token", { status: 404 })
        }

        if (signatureToken.usedAt) {
            return new NextResponse("Token already used", { status: 400 })
        }

        // Create attendance record as ABSENT (or EXCUSED if we had that logic, but let's say ABSENT with proof)
        // Schema has `proofUrl`. We are sending text `reason`. 
        // Maybe we should store reason in `proofUrl` for now or add a `comment` field?
        // Schema: `proofUrl String?`. Let's put the reason there or assume it's a URL.
        // If it's just text, we can store "Reason: ..."

        await prisma.attendance.upsert({
            where: {
                sessionId_studentId: {
                    sessionId: signatureToken.sessionId,
                    studentId: signatureToken.studentId
                }
            },
            update: {
                status: "ABSENT",
                proofUrl: `Reason: ${reason}`,
                signedAt: new Date() // Mark as handled
            },
            create: {
                sessionId: signatureToken.sessionId,
                studentId: signatureToken.studentId,
                status: "ABSENT",
                proofUrl: `Reason: ${reason}`,
                signedAt: new Date()
            }
        })

        // Mark token as used
        await prisma.signatureToken.update({
            where: { id: signatureToken.id },
            data: { usedAt: new Date() }
        })

        // Fetch missed sessions (same logic as signature endpoint)
        const studentId = signatureToken.studentId
        const currentSessionId = signatureToken.sessionId

        const enrollments = await prisma.classroomEnrollment.findMany({
            where: { studentId },
            select: { classroomId: true }
        })

        const enrolledClassroomIds = enrollments.map(e => e.classroomId)

        // Ensure we also check the current session's classroom, even if not explicitly enrolled
        const targetClassroomIds = Array.from(new Set([...enrolledClassroomIds, signatureToken.session.classroomId]))

        const missedSessions = await prisma.classSession.findMany({
            where: {
                classroomId: { in: targetClassroomIds },
                endTime: { lt: new Date() },
                id: { not: currentSessionId },
                attendances: {
                    none: {
                        studentId: studentId,
                        status: { in: ['PRESENT', 'EXCUSED', 'ABSENT'] }
                    }
                }
            },
            orderBy: { startTime: 'desc' },
            take: 5,
            include: {
                classroom: {
                    select: { name: true }
                }
            }
        })

        // Generate tokens for missed sessions
        const missedSessionsWithTokens = await Promise.all(missedSessions.map(async (session) => {
            const existingToken = await prisma.signatureToken.findFirst({
                where: {
                    sessionId: session.id,
                    studentId: studentId,
                    expiresAt: { gt: new Date() },
                    usedAt: null
                }
            })

            let token = existingToken?.token

            if (!token) {
                const expiresAt = new Date()
                expiresAt.setHours(expiresAt.getHours() + 1)

                const newToken = await prisma.signatureToken.create({
                    data: {
                        studentId,
                        sessionId: session.id,
                        expiresAt
                    }
                })
                token = newToken.token
            }

            return {
                id: session.id,
                title: session.title,
                classroomName: session.classroom.name,
                startTime: session.startTime,
                endTime: session.endTime,
                token
            }
        }))

        return NextResponse.json({
            success: true,
            missedSessions: missedSessionsWithTokens,
            organizationName: signatureToken.session.classroom.organization.name
        })
    } catch (error) {
        console.error("Error submitting absence:", error)
        return new NextResponse("Internal Server Error", { status: 500 })
    }
}
