import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"
import { SettingsForm } from "@/components/settings/settings-form"
import { UsageLimitsCard } from "@/components/settings/usage-limits-card"
import { getOrganizationLimitsUsage } from "@/lib/limits-server"
import { isSaaSMode } from "@/lib/limits"
import { getAuthUser } from "@/lib/auth-utils"

export default async function SettingsPage() {
    const user = await getAuthUser()
    if (!user) redirect("/")

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
