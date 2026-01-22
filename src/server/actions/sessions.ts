// import { prisma } from "@/lib/prisma" // Removed internal import
import { checkOrganizationLimit } from "@/lib/limits-server"
import { addDays, addWeeks } from "date-fns"

export interface CreateSessionInput {
    // ... input fields
    title?: string | null
    classroomId: string
    organizationId: string
    startTime: string | Date
    endTime: string | Date
    type?: "ONSITE" | "ONLINE" | "HOMEWORK"
    isOnline?: boolean
    reminderEnabled?: boolean
    reminderHoursBefore?: number | string
    reminderMinutesBefore?: number | string
    signatureMinutesBefore?: number | string
    recurrence?: "NONE" | "DAILY" | "WEEKLY"
    recurrenceCount?: number | string
    teacherId?: string
}

export async function createSession(prisma: any, data: CreateSessionInput) {
    const {
        title,
        classroomId,
        organizationId,
        startTime,
        endTime,
        type,
        isOnline,
        reminderEnabled,
        reminderHoursBefore,
        reminderMinutesBefore,
        signatureMinutesBefore,
        recurrence,
        recurrenceCount,
        teacherId
    } = data

    if (!classroomId || !startTime || !endTime || !organizationId) {
        throw new Error("Missing required fields: classroomId, organizationId, startTime, or endTime")
    }

    // Verify classroom belongs to organization
    const classroom = await prisma.classroom.findFirst({
        where: {
            id: classroomId,
            organizationId: organizationId
        }
    })

    if (!classroom) {
        throw new Error("Classroom not found or does not belong to organization")
    }

    const count = recurrence && recurrence !== "NONE" ? (parseInt(String(recurrenceCount)) || 1) : 1

    // Check organization limits
    const limitCheck = await checkOrganizationLimit(prisma, organizationId, "sessionsPerMonth")
    if (!limitCheck.allowed || (limitCheck.limit > 0 && limitCheck.current + count > limitCheck.limit)) {
        return {
            error: limitCheck.message || `Limite de sessions atteinte (${limitCheck.current}/${limitCheck.limit})`,
            limit: limitCheck.limit,
            current: limitCheck.current,
            canUpgrade: limitCheck.canUpgrade,
            upgradeUrl: limitCheck.upgradeUrl,
        }
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
            isOnline: isOnline || (type === "ONLINE"),
            reminderEnabled: reminderEnabled !== undefined ? reminderEnabled : true,
            reminderHoursBefore: reminderHoursBefore ? parseInt(String(reminderHoursBefore)) : 24,
            reminderMinutesBefore: reminderMinutesBefore ? parseInt(String(reminderMinutesBefore)) : 0,
            signatureMinutesBefore: signatureMinutesBefore ? parseInt(String(signatureMinutesBefore)) : 5,
            teacherId: teacherId === "none" ? undefined : teacherId,
        }

        const session = await prisma.classSession.create({
            data: sessionData
        })
        createdSessions.push(session)
    }

    return { sessions: createdSessions }
}
