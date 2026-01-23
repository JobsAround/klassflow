
import { prisma } from "@/lib/prisma"
import { notFound, redirect } from "next/navigation"
import { JitsiMeet } from "@/components/sessions/jitsi-meet"
import { generateJaaSJwt } from "@/lib/jaas"
import { getAuthUser } from "@/lib/auth-utils"

const JAAS_APP_ID = process.env.JAAS_APP_ID || ""

export default async function ClassroomLivePage({
    params
}: {
    params: Promise<{ id: string }>
}) {
    const { id } = await params
    const user = await getAuthUser()

    if (!user) {
        redirect("/api/auth/signin")
    }

    // Verify Classroom and Permissions
    const classroom = await prisma.classroom.findUnique({
        where: { id },
    })

    if (!classroom) {
        notFound()
    }

    // Only teachers or admins of the organization should access this moderator view
    if (user.role === "STUDENT") {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <p className="text-red-600">Students should join via the public classroom link.</p>
            </div>
        )
    }

    // Verify Organization
    if (classroom.organizationId !== user.organizationId) {
        notFound()
    }

    // Generate Moderator Token for Classroom Room
    const roomName = `classroom-${classroom.id}`
    const jwt = generateJaaSJwt({
        id: user.id!,
        name: user.name || "Enseignant",
        email: user.email || "",
        avatar: user.image || "",
        isModerator: true
    }, roomName)

    if (!jwt) {
        return (
            <div className="flex items-center justify-center h-screen bg-black text-white">
                <p className="text-red-600">Video conference is not configured. Please contact administrator.</p>
            </div>
        )
    }

    return (
        <div className="flex flex-col h-screen bg-black">
            <header className="flex items-center justify-between px-4 py-2 bg-slate-900 text-white border-b border-slate-800">
                <h1 className="text-lg font-semibold">
                    Live: {classroom.name}
                </h1>
                <span className="text-sm text-slate-400">
                    Modérateur: {user.name}
                </span>
            </header>
            <main className="flex-1 overflow-hidden">
                <JitsiMeet
                    appId={JAAS_APP_ID}
                    roomName={roomName}
                    jwt={jwt}
                    displayName={user.name || "Enseignant"}
                    email={user.email || undefined}
                    avatarUrl={user.image || undefined}
                />
            </main>
        </div>
    )
}
