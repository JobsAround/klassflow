"use client"

import { useState, useEffect } from "react"
import { Globe } from "lucide-react"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { useRouter } from "next/navigation"

const languages = [
    { code: "en", name: "English" },
    { code: "fr", name: "Français" },
    { code: "de", name: "Deutsch" },
    { code: "es", name: "Español" },
    { code: "ru", name: "Русский" },
    { code: "uk", name: "Українська" },
]

export function LanguageSelector() {
    const router = useRouter()
    const [locale, setLocale] = useState("en")

    useEffect(() => {
        // Get current locale from cookie
        const currentLocale = document.cookie
            .split("; ")
            .find(row => row.startsWith("locale="))
            ?.split("=")[1] || "en"
        setLocale(currentLocale)
    }, [])

    const handleLanguageChange = async (newLocale: string) => {
        // Set cookie
        document.cookie = `locale=${newLocale}; path=/; max-age=31536000`
        setLocale(newLocale)

        // Force a hard refresh to reload all server components with new locale
        window.location.reload()
    }

    return (
        <Select value={locale} onValueChange={handleLanguageChange}>
            <SelectTrigger className="w-[140px]">
                <Globe className="w-4 h-4 mr-2" />
                <SelectValue />
            </SelectTrigger>
            <SelectContent>
                {languages.map((lang) => (
                    <SelectItem key={lang.code} value={lang.code}>
                        {lang.name}
                    </SelectItem>
                ))}
            </SelectContent>
        </Select>
    )
}
