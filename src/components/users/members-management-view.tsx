"use client"

import { InviteUserDialog } from "@/components/users/invite-user-dialog"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { MembersTable, MemberData } from "@/components/users/members-table"

export interface MembersManagementViewProps {
    members: MemberData[]
    organizationId?: string
    currentUser: {
        id: string
        role: string
        organizationId?: string
    }
    translations?: Partial<{
        title: string
        description: string
        totalUsers: string
        teachers: string
        students: string
        inviteMember: string
    }>
}

const defaultTranslations = {
    title: "Users",
    description: "Manage teachers and students in your organization",
    totalUsers: "Total Users",
    teachers: "Teachers",
    students: "Students",
    inviteMember: "Invite Member"
}

export function MembersManagementView({
    members,
    organizationId,
    currentUser,
    translations = {}
}: MembersManagementViewProps) {
    const t = { ...defaultTranslations, ...translations }
    const canManage = currentUser.role === "ADMIN" || currentUser.role === "SUPER_ADMIN"

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">{t.title}</h1>
                    <p className="text-slate-500">{t.description}</p>
                </div>
                {canManage && organizationId && <InviteUserDialog />}
            </div>

            <div className="grid gap-4 md:grid-cols-3">
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium">{t.totalUsers}</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{members.length}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium">{t.teachers}</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {members.filter(u => u.role === "TEACHER" || u.role === "ADMIN").length}
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium">{t.students}</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {members.filter(u => u.role === "STUDENT").length}
                        </div>
                    </CardContent>
                </Card>
            </div>

            <MembersTable
                members={members}
                organizationId={organizationId}
                canInvite={false} // Handled by the header button
                canEdit={canManage}
                canDelete={canManage}
                currentUserId={currentUser.id}
            />
        </div>
    )
}
