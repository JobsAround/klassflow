import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET(
    req: NextRequest,
    { params }: { params: any }
) {
    try {
        const { token } = await params

        // Find and validate the token
        const signatureToken = await prisma.signatureToken.findUnique({
            where: { token },
            include: {
                student: { select: { id: true, name: true, email: true } },
                session: {
                    include: {
                        classroom: {
                            select: {
                                name: true,
                                id: true,
                                organization: { select: { name: true } }
                            }
                        }
                    }
                }
            }
        })

        if (!signatureToken) {
            return NextResponse.json({ error: "Invalid token" }, { status: 404 })
        }

        const now = new Date()
        const expiresAt = signatureToken.expiresAt
        const isExpired = now > expiresAt

        console.log('[SIGNATURE TOKEN DEBUG]', {
            token,
            now: now.toISOString(),
            expiresAt: expiresAt.toISOString(),
            isExpired,
            timeDiff: expiresAt.getTime() - now.getTime(),
            timeDiffHours: (expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60)
        })

        if (isExpired) {
            return NextResponse.json({ error: "Token expired" }, { status: 410 })
        }

        // Check if already used
        let alreadySigned = false
        if (signatureToken.usedAt) {
            alreadySigned = true
        }

        // Also check actual attendance record to be sure
        const existingAttendance = await prisma.attendance.findUnique({
            where: {
                sessionId_studentId: {
                    sessionId: signatureToken.sessionId,
                    studentId: signatureToken.studentId
                }
            }
        })

        if (existingAttendance && (existingAttendance.status === 'PRESENT' || existingAttendance.signatureUrl)) {
            alreadySigned = true
        }

        // If used/signed but we want to show missed sessions
        let missedSessionsWithTokens: any[] = []

        // Always fetch missed sessions to show them
        const studentId = signatureToken.studentId
        const currentSessionId = signatureToken.sessionId

        // Get enrolled classrooms
        const enrollments = await prisma.classroomEnrollment.findMany({
            where: { studentId },
            select: { classroomId: true }
        })

        const enrolledClassroomIds = enrollments.map(e => e.classroomId)

        // Ensure we also check the current session's classroom, even if not explicitly enrolled
        const targetClassroomIds = Array.from(new Set([...enrolledClassroomIds, signatureToken.session.classroomId]))

        // Find past sessions without attendance
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
        missedSessionsWithTokens = await Promise.all(missedSessions.map(async (session) => {
            // Check if valid token already exists
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
                // Create new token valid for 1 hour
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
                type: session.type,
                token
            }
        }))

        return NextResponse.json({
            student: signatureToken.student,
            session: {
                id: signatureToken.session.id,
                title: signatureToken.session.title,
                startTime: signatureToken.session.startTime,
                endTime: signatureToken.session.endTime,
                classroom: signatureToken.session.classroom
            },
            signed: alreadySigned,
            missedSessions: missedSessionsWithTokens
        })
    } catch (error) {
        console.error("Get signature token error:", error)
        return NextResponse.json({ error: "Failed to validate token" }, { status: 500 })
    }
}

export async function POST(
    req: NextRequest,
    { params }: { params: any }
) {
    try {
        const { token } = await params
        const body = await req.json()
        const { signatureData } = body

        if (!signatureData) {
            return NextResponse.json({ error: "Missing signature" }, { status: 400 })
        }

        // Find the token
        const signatureToken = await prisma.signatureToken.findUnique({
            where: { token },
            include: { student: true, session: true }
        })

        if (!signatureToken) {
            return NextResponse.json({ error: "Invalid token" }, { status: 404 })
        }

        // Validate token
        if (new Date() > signatureToken.expiresAt) {
            return NextResponse.json({ error: "Token expired" }, { status: 410 })
        }

        if (signatureToken.usedAt) {
            return NextResponse.json({ error: "Token already used" }, { status: 410 })
        }

        // Get IP address
        const ipAddress = req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || "unknown"

        // Create or update attendance record
        const attendance = await prisma.attendance.upsert({
            where: {
                sessionId_studentId: {
                    sessionId: signatureToken.sessionId,
                    studentId: signatureToken.studentId
                }
            },
            create: {
                sessionId: signatureToken.sessionId,
                studentId: signatureToken.studentId,
                status: "PRESENT",
                signatureUrl: signatureData,
                signedAt: new Date(),
                ipAddress
            },
            update: {
                status: "PRESENT",
                signatureUrl: signatureData,
                signedAt: new Date(),
                ipAddress
            }
        })

        // Mark token as used
        await prisma.signatureToken.update({
            where: { id: signatureToken.id },
            data: { usedAt: new Date() }
        })

        // Check for missed sessions
        const studentId = signatureToken.studentId
        const currentSessionId = signatureToken.sessionId

        // Get enrolled classrooms
        const enrollments = await prisma.classroomEnrollment.findMany({
            where: { studentId },
            select: { classroomId: true }
        })

        const enrolledClassroomIds = enrollments.map(e => e.classroomId)

        // Ensure we also check the current session's classroom, even if not explicitly enrolled
        // fetch current session to get classroomId
        const currentSession = await prisma.classSession.findUnique({
            where: { id: currentSessionId },
            select: { classroomId: true }
        })

        const targetClassroomIds = Array.from(new Set([...enrolledClassroomIds, currentSession?.classroomId].filter(Boolean) as string[]))

        // Find past sessions without attendance
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
            // Check if valid token already exists
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
                // Create new token valid for 1 hour
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
                type: session.type,
                token
            }
        }))

        return NextResponse.json({
            success: true,
            attendance,
            missedSessions: missedSessionsWithTokens
        })
    } catch (error) {
        console.error("Submit signature error:", error)
        return NextResponse.json({ error: "Failed to submit signature" }, { status: 500 })
    }
}
