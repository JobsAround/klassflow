import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"

// GET: Validate token and return session data for Teacher
export async function GET(
    req: Request,
    { params }: { params: any }
) {
    try {
        const { token } = await params

        const signatureToken = await prisma.signatureToken.findUnique({
            where: { token },
            include: {
                student: true, // This is actually the Teacher (User)
                session: {
                    include: {
                        classroom: {
                            include: {
                                organization: true
                            }
                        }
                    }
                }
            }
        })

        if (!signatureToken) {
            return NextResponse.json({ error: "Invalid token" }, { status: 404 })
        }

        if (new Date() > signatureToken.expiresAt) {
            return NextResponse.json({ error: "Token expired" }, { status: 400 })
        }

        // Check if teacher has already signed the session
        // Note: Signatures are stored in ClassSession.teacherSignature
        const isSigned = !!signatureToken.session.teacherSignature

        // Fetch missed sessions (other past sessions for this teacher without signature)
        const missedSessionsRaw = await prisma.classSession.findMany({
            where: {
                teacherId: signatureToken.studentId, // The teacher
                endTime: { lt: new Date() },
                teacherSignature: null,
                id: { not: signatureToken.sessionId }
            },
            include: {
                classroom: {
                    select: { name: true }
                }
            },
            orderBy: { startTime: 'desc' },
            take: 5
        })

        // Generate/Fetch tokens for missed sessions
        const missedSessions = await Promise.all(missedSessionsRaw.map(async (s) => {
            let token = await prisma.signatureToken.findFirst({
                where: {
                    sessionId: s.id,
                    studentId: signatureToken.studentId,
                    expiresAt: { gt: new Date() }
                }
            })

            if (!token) {
                token = await prisma.signatureToken.create({
                    data: {
                        sessionId: s.id,
                        studentId: signatureToken.studentId,
                        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
                    }
                })
            }

            return {
                id: s.id,
                title: s.title,
                classroomName: s.classroom.name,
                startTime: s.startTime,
                endTime: s.endTime,
                token: token.token,
                signed: false
            }
        }))

        return NextResponse.json({
            teacher: {
                id: signatureToken.student.id,
                name: signatureToken.student.name,
                email: signatureToken.student.email
            },
            session: {
                id: signatureToken.session.id,
                title: signatureToken.session.title,
                startTime: signatureToken.session.startTime,
                endTime: signatureToken.session.endTime,
                classroom: {
                    name: signatureToken.session.classroom.name,
                    organization: {
                        name: signatureToken.session.classroom.organization.name
                    }
                }
            },
            signed: isSigned,
            missedSessions
        })

    } catch (error) {
        console.error("Error fetching teacher signature token:", error)
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
    }
}

// POST: Save teacher signature
export async function POST(
    req: Request,
    { params }: { params: any }
) {
    try {
        const { token } = await params
        const { signatureData } = await req.json()

        if (!signatureData) {
            return NextResponse.json({ error: "Signature data is required" }, { status: 400 })
        }

        const signatureToken = await prisma.signatureToken.findUnique({
            where: { token },
            include: {
                session: true
            }
        })

        if (!signatureToken) {
            return NextResponse.json({ error: "Invalid token" }, { status: 404 })
        }

        if (new Date() > signatureToken.expiresAt) {
            return NextResponse.json({ error: "Token expired" }, { status: 400 })
        }

        // Update the ClassSession with the teacher's signature and ID
        await prisma.classSession.update({
            where: { id: signatureToken.sessionId },
            data: {
                teacherSignature: signatureData,
                teacherId: signatureToken.studentId // Ensure the signing teacher is assigned
            }
        })

        // Mark token as used
        await prisma.signatureToken.update({
            where: { id: signatureToken.id },
            data: { usedAt: new Date() }
        })

        return NextResponse.json({ success: true })

    } catch (error) {
        console.error("Error saving teacher signature:", error)
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
    }
}
