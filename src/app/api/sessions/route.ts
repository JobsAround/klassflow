import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/auth"
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
                user = {
                    id: devUser.id,
                    role: devUser.role,
                    organizationId: devUser.organizationId
                } as any
            }
        }
    }

    return user
}

import { addDays, addWeeks } from "date-fns"

// ... imports

export async function POST(req: NextRequest) {
    try {
        const user = await getUser()
        if (!user || !user.organizationId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const body = await req.json()
        const {
            title,
            classroomId,
            startTime,
            endTime,
            type,
            isOnline,
            reminderEnabled,
            reminderHoursBefore,
            reminderMinutesBefore,
            signatureMinutesBefore,
            recurrence,
            recurrenceCount
        } = body

        if (!classroomId || !startTime || !endTime) {
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

        const count = recurrence && recurrence !== "NONE" ? (parseInt(String(recurrenceCount)) || 1) : 1

        // Check session limit (accounting for recurrence)
        const limitCheck = await checkOrganizationLimit(user.organizationId, "sessionsPerMonth")
        if (!limitCheck.allowed || (limitCheck.limit > 0 && limitCheck.current + count > limitCheck.limit)) {
            return NextResponse.json({
                error: limitCheck.message || `Limite de sessions atteinte (${limitCheck.current}/${limitCheck.limit})`,
                limit: limitCheck.limit,
                current: limitCheck.current,
                canUpgrade: limitCheck.canUpgrade,
                upgradeUrl: limitCheck.upgradeUrl,
            }, { status: 403 })
        }

        const createdSessions = []

        for (let i = 0; i < count; i++) {
            let currentStartTime = new Date(startTime)
            let currentEndTime = new Date(endTime)

            if (recurrence === "DAILY") {
                currentStartTime = addDays(currentStartTime, i)
                currentEndTime = addDays(currentEndTime, i)
            } else if (recurrence === "WEEKLY") {
                currentStartTime = addWeeks(currentStartTime, i)
                currentEndTime = addWeeks(currentEndTime, i)
            }

            const sessionData: any = {
                title: title || null,
                type: type || "ONSITE",
                classroomId,
                startTime: currentStartTime,
                endTime: currentEndTime,
                isOnline: isOnline || (type === "ONLINE"), // Fallback to type check
                reminderEnabled: reminderEnabled !== undefined ? reminderEnabled : true,
                reminderHoursBefore: reminderHoursBefore ? parseInt(String(reminderHoursBefore)) : 24,
                reminderMinutesBefore: reminderMinutesBefore ? parseInt(String(reminderMinutesBefore)) : 0,
                signatureMinutesBefore: signatureMinutesBefore ? parseInt(String(signatureMinutesBefore)) : 5
            }

            console.log("Creating session with data:", JSON.stringify(sessionData, null, 2))

            const session = await prisma.classSession.create({
                data: sessionData
            })
            console.log("Session created successfully:", session.id)
            createdSessions.push(session)
        }

        return NextResponse.json(createdSessions[0]) // Return first session for compatibility
    } catch (error) {
        console.error("Create session error:", error)
        return NextResponse.json({ error: "Failed to create session" }, { status: 500 })
    }
}

export async function GET(req: NextRequest) {
    try {
        const user = await getUser()
        if (!user || !user.organizationId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const sessions = await prisma.classSession.findMany({
            where: {
                classroom: { organizationId: user.organizationId }
            },
            include: {
                classroom: { select: { name: true } },
                _count: { select: { attendances: true } }
            },
            orderBy: { startTime: "desc" }
        })

        return NextResponse.json(sessions)
    } catch (error) {
        console.error("Get sessions error:", error)
        return NextResponse.json({ error: "Failed to fetch sessions" }, { status: 500 })
    }
}
