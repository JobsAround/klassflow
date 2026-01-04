"use client"

import Link from "next/link"
import { Home, Users, Calendar, Settings, BookOpen, ShieldCheck } from "lucide-react"
import { useTranslations } from 'next-intl'

export function Sidebar({ user }: { user: any }) {
    const t = useTranslations('nav')

    return (
        <aside className="w-full md:w-64 bg-white dark:bg-slate-950 border-r border-slate-200 dark:border-slate-800 flex-col hidden md:flex">
            <div className="p-6 border-b border-slate-200 dark:border-slate-800">
                <h2 className="text-xl font-bold">Klass Flow</h2>
            </div>
            <nav className="flex-1 p-4 space-y-2">
                <Link href="/classrooms" className="flex items-center gap-3 px-4 py-2 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-md">
                    <BookOpen className="w-5 h-5" />
                    {t('classrooms')}
                </Link>
                <Link href="/calendar" className="flex items-center gap-3 px-4 py-2 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-md">
                    <Calendar className="w-5 h-5" />
                    {t('calendar')}
                </Link>
                {(user.role === "ADMIN" || user.role === "SUPER_ADMIN") && (
                    <>
                        <Link href="/dashboard/users" className="flex items-center gap-3 px-4 py-2 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-md">
                            <Users className="w-5 h-5" />
                            {t('users')}
                        </Link>
                        <Link href="/dashboard/settings" className="flex items-center gap-3 px-4 py-2 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-md">
                            <Settings className="w-5 h-5" />
                            {t('settings')}
                        </Link>
                    </>
                )}
                {user.role === "SUPER_ADMIN" && (
                    <Link href="/admin" className="flex items-center gap-3 px-4 py-2 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-md">
                        <ShieldCheck className="w-5 h-5" />
                        Global Admin
                    </Link>
                )}
            </nav>
            <div className="p-4 border-t border-slate-200 dark:border-slate-800">
                <div className="flex items-center gap-3">
                    {user.image && (
                        <img src={user.image} alt={user.name} className="w-8 h-8 rounded-full" />
                    )}
                    <div className="flex-1 overflow-hidden">
                        <p className="text-sm font-medium truncate">{user.name}</p>
                        <p className="text-xs text-slate-500 truncate">{user.email}</p>
                    </div>
                </div>
            </div>
        </aside>
    )
}
