"use client"

import { User, Mail, UserPlus } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { InviteUserDialog } from "@/components/users/invite-user-dialog"
import { EditUserDialog } from "@/components/users/edit-user-dialog"
import { DeleteUserDialog } from "@/components/users/delete-user-dialog"

export interface MemberData {
    id: string
    name: string | null
    email: string
    role: string
    image?: string | null
    createdAt?: string | Date
}

export interface MembersTableProps {
    members: MemberData[]
    organizationId?: string
    canInvite?: boolean
    canEdit?: boolean
    canDelete?: boolean
    currentUserId?: string
    translations?: Partial<{
        title: string
        description: string
        inviteMember: string
        name: string
        email: string
        role: string
        actions: string
        noMembers: string
    }>
    roleLabels?: Record<string, string>
}

const defaultTranslations = {
    title: "Members",
    description: "Manage organization members",
    inviteMember: "Invite Member",
    name: "Name",
    email: "Email",
    role: "Role",
    actions: "Actions",
    noMembers: "No members found"
}

const defaultRoleLabels: Record<string, string> = {
    ADMIN: "Admin",
    TEACHER: "Teacher",
    STUDENT: "Student",
    SUPER_ADMIN: "Super Admin"
}

export function MembersTable({
    members,
    organizationId,
    canInvite = true,
    canEdit = true,
    canDelete = true,
    currentUserId,
    translations = {},
    roleLabels = {}
}: MembersTableProps) {
    const t = { ...defaultTranslations, ...translations }
    const roles = { ...defaultRoleLabels, ...roleLabels }

    const getRoleBadgeVariant = (role: string) => {
        switch (role) {
            case "ADMIN":
            case "SUPER_ADMIN":
                return "default"
            case "TEACHER":
                return "secondary"
            default:
                return "outline"
        }
    }

    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
                <div>
                    <CardTitle>{t.title}</CardTitle>
                    <CardDescription>{t.description}</CardDescription>
                </div>
                {canInvite && organizationId && (
                    <InviteUserDialog />
                )}
            </CardHeader>
            <CardContent>
                {members.length === 0 ? (
                    <div className="text-center py-8 text-slate-500">
                        {t.noMembers}
                    </div>
                ) : (
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>{t.name}</TableHead>
                                <TableHead>{t.email}</TableHead>
                                <TableHead>{t.role}</TableHead>
                                {(canEdit || canDelete) && <TableHead className="w-[100px]">{t.actions}</TableHead>}
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {members.map((member) => (
                                <TableRow key={member.id}>
                                    <TableCell>
                                        <div className="flex items-center gap-3">
                                            {member.image ? (
                                                <img
                                                    src={member.image}
                                                    alt=""
                                                    className="w-8 h-8 rounded-full object-cover"
                                                />
                                            ) : (
                                                <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                                                    <User className="w-4 h-4 text-slate-500" />
                                                </div>
                                            )}
                                            <span className="font-medium">{member.name || "-"}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-2 text-slate-500">
                                            <Mail className="w-4 h-4" />
                                            {member.email}
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant={getRoleBadgeVariant(member.role)}>
                                            {roles[member.role] || member.role}
                                        </Badge>
                                    </TableCell>
                                    {(canEdit || canDelete) && (
                                        <TableCell>
                                            {member.id !== currentUserId && (
                                                <div className="flex items-center gap-1">
                                                    {canEdit && (
                                                        <EditUserDialog user={member} />
                                                    )}
                                                    {canDelete && (
                                                        <DeleteUserDialog user={member} />
                                                    )}
                                                </div>
                                            )}
                                        </TableCell>
                                    )}
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                )}
            </CardContent>
        </Card>
    )
}
