import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { Sidebar } from "@/components/layout/sidebar"
import { Header } from "@/components/layout/header"
import { cookies } from "next/headers"
import { prisma } from "@/lib/prisma"

export default async function ScheduleLayout({
    children,
}: {
    children: React.ReactNode
}) {
    let session = await auth()
    let user = session?.user

    // Dev mode fallback
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

    if (!user) {
        redirect("/")
    }

    return (
        <div className="flex min-h-screen flex-col md:flex-row">
            <Sidebar user={user} />
            <div className="flex-1 flex flex-col">
                <Header user={user} />
                <main className="flex-1 p-6 bg-slate-50 dark:bg-slate-900">
                    {children}
                </main>
            </div>
        </div>
    )
}
