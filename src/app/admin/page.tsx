import { prisma } from "@/lib/prisma"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { format } from "date-fns"

export default async function AdminPage() {
    const [orgCount, userCount, sessionCount, organizations] = await Promise.all([
        prisma.organization.count(),
        prisma.user.count(),
        prisma.classSession.count(),
        prisma.organization.findMany({
            include: {
                _count: {
                    select: { classrooms: true }
                },
                classrooms: {
                    select: {
                        _count: { select: { sessions: true } },
                        sessions: {
                            where: { isOnline: true },
                            select: { id: true }
                        }
                    }
                },
                users: {
                    select: {
                        role: true,
                        updatedAt: true
                    }
                }
            },
            orderBy: { createdAt: 'desc' }
        })
    ])

    const enrichedOrgs = organizations.map(org => {
        const totalSessions = org.classrooms.reduce((acc, c) => acc + c._count.sessions, 0)
        const onlineSessions = org.classrooms.reduce((acc, c) => acc + c.sessions.length, 0)

        const teacherCount = org.users.filter(u => u.role === "TEACHER").length
        const adminCount = org.users.filter(u => u.role === "ADMIN" || u.role === "SUPER_ADMIN").length
        const totalUsers = org.users.length

        const lastActive = org.users.reduce((latest, user) => {
            return user.updatedAt > latest ? user.updatedAt : latest
        }, new Date(0))

        return {
            ...org,
            totalSessions,
            onlineSessions,
            teacherCount,
            adminCount,
            totalUsers,
            lastActive
        }
    })

    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold tracking-tight">Global Administration</h1>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Organizations</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{orgCount}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Users</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{userCount}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Sessions</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{sessionCount}</div>
                    </CardContent>
                </Card>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Organizations Activity</CardTitle>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Name</TableHead>
                                <TableHead>Users</TableHead>
                                <TableHead>Teachers</TableHead>
                                <TableHead>Admins</TableHead>
                                <TableHead>Classrooms</TableHead>
                                <TableHead>Sessions</TableHead>
                                <TableHead>Jitsi Usage</TableHead>
                                <TableHead>Last Active</TableHead>
                                <TableHead>Created At</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {enrichedOrgs.map((org) => (
                                <TableRow key={org.id}>
                                    <TableCell className="font-medium">{org.name}</TableCell>
                                    <TableCell>{org.totalUsers}</TableCell>
                                    <TableCell>{org.teacherCount}</TableCell>
                                    <TableCell>{org.adminCount}</TableCell>
                                    <TableCell>{org._count.classrooms}</TableCell>
                                    <TableCell>{org.totalSessions}</TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-2">
                                            <span className="font-medium">{org.onlineSessions}</span>
                                            <span className="text-xs text-muted-foreground">
                                                ({org.totalSessions > 0 ? Math.round((org.onlineSessions / org.totalSessions) * 100) : 0}%)
                                            </span>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        {org.lastActive.getTime() > 0 ? format(org.lastActive, "PPp") : "Never"}
                                    </TableCell>
                                    <TableCell>{format(org.createdAt, "PPp")}</TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    )
}
