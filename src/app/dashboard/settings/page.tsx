import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import { SettingsForm } from "@/components/settings/settings-form"
import { UsageLimitsCard } from "@/components/settings/usage-limits-card"
import { getOrganizationLimitsUsage } from "@/lib/limits-server"
import { isSaaSMode } from "@/lib/limits"

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
                    name: devUser.name,
                    email: devUser.email,
                    image: devUser.image,
                    role: devUser.role,
                    organizationId: devUser.organizationId
                } as any
            }
        }
    }

    if (!user) redirect("/")
    return user
}

export default async function SettingsPage() {
    const user = await getUser()

    if (user.role !== "ADMIN" && user.role !== "SUPER_ADMIN") {
        redirect("/dashboard")
    }

    const organization = await prisma.organization.findUnique({
        where: { id: user.organizationId! }
    })

    if (!organization) {
        return <div>Organization not found</div>
    }

    // Fetch usage limits
    const usage = await getOrganizationLimitsUsage(prisma, user.organizationId!)

    return (
        <div className="max-w-4xl space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Paramètres</h1>
                <p className="text-slate-500">Gérez les paramètres de votre organisation</p>
            </div>

            <SettingsForm organization={organization} />

            {/* Usage limits card */}
            <UsageLimitsCard
                usage={usage}
                isSaaSMode={isSaaSMode}

            />
        </div>
    )
}
