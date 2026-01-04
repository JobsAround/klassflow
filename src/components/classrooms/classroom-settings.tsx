"use client"

import { useState } from "react"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export function ClassroomSettings({
    classroomId,
    initialSignatureEnabled
}: {
    classroomId: string
    initialSignatureEnabled: boolean
}) {
    const [enabled, setEnabled] = useState(initialSignatureEnabled)
    const [loading, setLoading] = useState(false)

    const handleToggle = async (checked: boolean) => {
        setLoading(true)
        // Optimistic update
        setEnabled(checked)

        try {
            const res = await fetch(`/api/classrooms/${classroomId}/settings`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ signatureEnabled: checked })
            })

            if (!res.ok) {
                throw new Error("Failed to update settings")
            }
        } catch (error) {
            console.error("Update failed:", error)
            // Revert
            setEnabled(!checked)
            alert("Failed to update settings")
        } finally {
            setLoading(false)
        }
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>Settings</CardTitle>
                <CardDescription>Manage classroom configuration</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="flex items-center justify-between space-x-2">
                    <div className="space-y-0.5">
                        <Label htmlFor="signature-mode">Signature Mode</Label>
                        <p className="text-sm text-slate-500">
                            Enable or disable digital signatures for this classroom.
                            Disabling will notify administrators.
                        </p>
                    </div>
                    <Switch
                        id="signature-mode"
                        checked={enabled}
                        onCheckedChange={handleToggle}
                        disabled={loading}
                    />
                </div>
            </CardContent>
        </Card>
    )
}
