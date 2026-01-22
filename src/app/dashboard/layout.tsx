import { redirect } from "next/navigation"
import { Sidebar } from "@/components/layout/sidebar"
import { Header } from "@/components/layout/header"
import { getAuthUser } from "@/lib/auth-utils"

export default async function DashboardLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const user = await getAuthUser()

    if (!user) {
        redirect("/")
    }

    // Redirect teachers to /classrooms if they try to access /dashboard
    if (user.role === "TEACHER" || user.role === "STUDENT") {
        // We need to check if we are already in /classrooms to avoid loops if this layout was shared
        // But this is dashboard layout, so it's fine.
        redirect("/classrooms")
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
