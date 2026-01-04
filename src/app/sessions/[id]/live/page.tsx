import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { notFound, redirect } from "next/navigation"
import { JitsiMeet } from "@/components/sessions/jitsi-meet"
import { generateJaaSJwt } from "@/lib/jaas"

// JAAS App ID from env or fallback
const JAAS_APP_ID = process.env.JAAS_APP_ID || "vpaas-magic-cookie-59695fbdd7744384bf399a05acaf12d9"

export default async function LiveSessionPage({
    params
}: {
    params: Promise<{ id: string }>
}) {
    const { id } = await params
    let session = await auth()
    let user = session?.user

    // Dev login support
    if (!user && process.env.NODE_ENV === "development") {
        const { cookies } = await import("next/headers")
        const cookieStore = await cookies()
        const devUserId = cookieStore.get("dev-user-id")?.value
        if (devUserId) {
            const devUser = await prisma.user.findUnique({
                where: { id: devUserId }
            })
            if (devUser) {
                user = {
                    id: devUser.id,
                    name: devUser.name,
                    email: devUser.email,
                    role: devUser.role,
                    image: devUser.image,
                    organizationId: devUser.organizationId
                } as any
            }
        }
    }

    if (!user) {
        redirect("/api/auth/signin")
    }

    // Verify Session and Permissions
    const classSession = await prisma.classSession.findUnique({
        where: { id },
        include: {
            classroom: true
        }
    })

    if (!classSession) {
        notFound()
    }

    // Only teachers or admins of the organization should access this moderator view
    // Students should use the public Guest link or a different view (though this page is for authenticated users)
    // If a student tries to access this page, they should be redirected or shown unauthorized.
    // Assuming for now only Teachers/Admins use this internal route.
    if (user.role === "STUDENT") {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <p className="text-red-600">Students should join via the public classroom link.</p>
            </div>
        )
    }

    // Generate Moderator Token
    const roomName = classSession.id
    const jwt = generateJaaSJwt({
        id: user.id!,
        name: user.name || "Enseignant",
        email: user.email || "",
        avatar: user.image || "",
        isModerator: true
    }, roomName)

    return (
        <div className="flex flex-col h-screen bg-black">
            <header className="flex items-center justify-between px-4 py-2 bg-slate-900 text-white border-b border-slate-800">
                <h1 className="text-lg font-semibold">
                    Live: {classSession.title || classSession.classroom.name}
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
