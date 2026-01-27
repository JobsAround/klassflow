import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"
import { sendAdminNotificationEmail } from "@/lib/email"
import { getAuthUser } from "@/lib/auth-utils"

export async function PATCH(
    req: Request,
    { params }: { params: any }
) {
    try {
        const user = await getAuthUser()

        if (!user || user.role === "STUDENT") {
            return new NextResponse("Unauthorized", { status: 401 })
        }

        const { id } = await params
        const { signatureEnabled, isPublic, autoSignatureEmailEnabled } = await req.json()

        const classroom = await prisma.classroom.findUnique({
            where: { id },
            include: { organization: true }
        })

        if (!classroom) {
            return new NextResponse("Classroom not found", { status: 404 })
        }

        // Verify teacher belongs to organization
        if (user.role !== "ADMIN" && user.organizationId !== classroom.organizationId) {
            return new NextResponse("Forbidden", { status: 403 })
        }

        const data: any = {}
        if (typeof signatureEnabled !== 'undefined') data.signatureEnabled = signatureEnabled
        if (typeof isPublic !== 'undefined') data.shareEnabled = isPublic
        if (typeof autoSignatureEmailEnabled !== 'undefined') data.autoSignatureEmailEnabled = autoSignatureEmailEnabled

        // Update settings
        const updatedClassroom = await prisma.classroom.update({
            where: { id },
            data
        })

        // If disabled, notify admins
        if (signatureEnabled === false) {
            // Find admins of the organization
            // Assuming Organization has users, we filter by role ADMIN
            // But User model has organizationId.
            const admins = await prisma.user.findMany({
                where: {
                    organizationId: classroom.organizationId,
                    role: "ADMIN"
                }
            })

            for (const admin of admins) {
                try {
                    await sendAdminNotificationEmail(
                        classroom.organizationId,
                        admin.email,
                        `Signature désactivée pour ${classroom.name}`,
                        `L'enseignant <strong>${user.name}</strong> (${user.email}) a désactivé la signature de présence pour la classe <strong>${classroom.name}</strong>.`
                    )
                } catch (error) {
                    console.error(`Failed to send notification to admin ${admin.email}:`, error)
                }
            }
        }

        return NextResponse.json(updatedClassroom)
    } catch (error) {
        console.error("Error updating classroom settings:", error)
        return new NextResponse("Internal Server Error", { status: 500 })
    }
}
