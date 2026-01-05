import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET(req: NextRequest, { params }: { params: any }) {
    try {
        const { token } = await params

        // Find classroom by share token or ID
        const classroom = await prisma.classroom.findFirst({
            where: {
                OR: [
                    { shareToken: token },
                    { id: token }
                ]
            },
            select: {
                id: true,
                name: true,
                description: true,
                locationOnline: true,
                locationOnline2: true,
                videoEnabled: true,
                organization: {
                    select: {
                        name: true
                    }
                },
                teachers: {
                    select: {
                        name: true,
                        email: true
                    }
                },
                enrollments: {
                    where: {
                        student: { role: "STUDENT" }
                    },
                    select: {
                        student: {
                            select: {
                                name: true,
                                email: true,
                                image: true
                            }
                        }
                    }
                },
                sessions: {
                    // Fetch all sessions for calendar history
                    orderBy: {
                        startTime: 'asc'
                    },
                    select: {
                        id: true,
                        title: true,
                        type: true,
                        startTime: true,
                        endTime: true,
                        meetingLink: true,
                        isOnline: true
                    }
                },
                resources: {
                    orderBy: {
                        createdAt: 'desc'
                    },
                    select: {
                        id: true,
                        title: true,
                        url: true,
                        type: true,
                        description: true,
                        pinned: true,
                        createdAt: true
                    }
                }
            }
        })

        if (!classroom) {
            return NextResponse.json({ error: "Classroom not found or sharing disabled" }, { status: 404 })
        }

        return NextResponse.json(classroom)
    } catch (error) {
        console.error("Public classroom fetch error:", error)
        return NextResponse.json({ error: "Failed to fetch classroom" }, { status: 500 })
    }
}
