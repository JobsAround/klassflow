"use client"

import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"
import { useState } from "react"

export function DevLogin() {
    const router = useRouter()
    const [loading, setLoading] = useState(false)

    if (process.env.NODE_ENV !== "development") {
        return null
    }

    const handleDevLogin = async () => {
        setLoading(true)
        try {
            const res = await fetch("/api/auth/dev-login", { method: "POST" })
            if (res.ok) {
                router.push("/dashboard")
                router.refresh()
            }
        } catch (error) {
            console.error("Dev login failed:", error)
        } finally {
            setLoading(false)
        }
    }

    return (
        <Button
            onClick={handleDevLogin}
            disabled={loading}
            variant="outline"
            className="border-orange-500 text-orange-600 hover:bg-orange-50"
        >
            {loading ? "Loading..." : "🔧 Dev Login"}
        </Button>
    )
}
