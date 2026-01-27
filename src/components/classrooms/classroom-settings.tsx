"use client"

import { useState } from "react"
import { useTranslations } from "next-intl"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export function ClassroomSettings({
    classroomId,
    initialSignatureEnabled,
    initialAutoSignatureEmailEnabled = false
}: {
    classroomId: string
    initialSignatureEnabled: boolean
    initialAutoSignatureEmailEnabled?: boolean
}) {
    const t = useTranslations("ClassroomSettings")
    const [signatureEnabled, setSignatureEnabled] = useState(initialSignatureEnabled)
    const [autoEmailEnabled, setAutoEmailEnabled] = useState(initialAutoSignatureEmailEnabled)
    const [loading, setLoading] = useState(false)

    const handleSignatureToggle = async (checked: boolean) => {
        setLoading(true)
        setSignatureEnabled(checked)

        // If disabling signatures, also disable auto-emails
        if (!checked && autoEmailEnabled) {
            setAutoEmailEnabled(false)
        }

        try {
            const res = await fetch(`/api/classrooms/${classroomId}/settings`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    signatureEnabled: checked,
                    ...((!checked && autoEmailEnabled) && { autoSignatureEmailEnabled: false })
                })
            })

            if (!res.ok) {
                throw new Error("Failed to update settings")
            }
        } catch (error) {
            console.error("Update failed:", error)
            setSignatureEnabled(!checked)
            if (!checked && autoEmailEnabled) {
                setAutoEmailEnabled(true)
            }
            alert("Failed to update settings")
        } finally {
            setLoading(false)
        }
    }

    const handleAutoEmailToggle = async (checked: boolean) => {
        setLoading(true)
        setAutoEmailEnabled(checked)

        try {
            const res = await fetch(`/api/classrooms/${classroomId}/settings`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ autoSignatureEmailEnabled: checked })
            })

            if (!res.ok) {
                throw new Error("Failed to update settings")
            }
        } catch (error) {
            console.error("Update failed:", error)
            setAutoEmailEnabled(!checked)
            alert("Failed to update settings")
        } finally {
            setLoading(false)
        }
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>{t("title")}</CardTitle>
                <CardDescription>{t("description")}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="flex items-center justify-between space-x-2">
                    <div className="space-y-0.5">
                        <Label htmlFor="signature-mode">{t("signatureMode")}</Label>
                        <p className="text-sm text-slate-500">
                            {t("signatureModeDescription")}
                        </p>
                    </div>
                    <Switch
                        id="signature-mode"
                        checked={signatureEnabled}
                        onCheckedChange={handleSignatureToggle}
                        disabled={loading}
                    />
                </div>

                <div className="flex items-center justify-between space-x-2">
                    <div className="space-y-0.5">
                        <Label htmlFor="auto-signature-email">{t("autoSignatureEmail")}</Label>
                        <p className="text-sm text-slate-500">
                            {t("autoSignatureEmailDescription")}
                        </p>
                    </div>
                    <Switch
                        id="auto-signature-email"
                        checked={autoEmailEnabled}
                        onCheckedChange={handleAutoEmailToggle}
                        disabled={loading || !signatureEnabled}
                    />
                </div>
            </CardContent>
        </Card>
    )
}
