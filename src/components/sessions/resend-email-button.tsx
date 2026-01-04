"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Mail } from "lucide-react"

export function ResendEmailButton({ sessionId, studentId }: { sessionId: string, studentId: string }) {
    const [loading, setLoading] = useState(false)

    const handleResend = async () => {
        if (!confirm("Renvoyer l'email de signature à cet étudiant ?")) return

        setLoading(true)
        try {
            const res = await fetch(`/api/sessions/${sessionId}/resend-signature`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ studentId })
            })

            if (!res.ok) throw new Error("Failed to resend")
            alert("Email renvoyé avec succès")
        } catch (error) {
            console.error(error)
            alert("Erreur lors de l'envoi")
        } finally {
            setLoading(false)
        }
    }

    return (
        <Button variant="ghost" size="icon" onClick={handleResend} disabled={loading} title="Renvoyer l'email de signature">
            <Mail className="w-4 h-4" />
        </Button>
    )
}
