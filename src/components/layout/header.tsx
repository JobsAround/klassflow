import { signOut } from "@/auth"
import { cookies } from "next/headers"
import { Button } from "@/components/ui/button"
import { LogOut } from "lucide-react"
import { LanguageSelector } from "./language-selector"

export function Header({ user }: { user: any }) {
    return (
        <header className="border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950">
            <div className="flex items-center justify-between h-16 px-6">
                <div className="flex items-center gap-4">
                    <h2 className="text-lg font-semibold hidden md:block">
                        Welcome, {user.name}
                    </h2>
                </div>
                <div className="flex items-center gap-3">
                    <LanguageSelector />
                    <form
                        action={async () => {
                            "use server"
                            if (process.env.NODE_ENV === "development") {
                                const cookieStore = await cookies()
                                if (cookieStore.get("dev-user-id")) {
                                    cookieStore.delete("dev-user-id")
                                }
                            }
                            await signOut()
                        }}
                    >
                        <Button variant="outline" size="sm" type="submit">
                            <LogOut className="w-4 h-4 mr-2" />
                            Sign Out
                        </Button>
                    </form>
                </div>
            </div>
        </header>
    )
}
