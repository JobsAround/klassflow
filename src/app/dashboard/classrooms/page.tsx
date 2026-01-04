import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import Link from "next/link"

async function getUser() {
    let session = await auth()
    let user = session?.user

    if (!user && process.env.NODE_ENV === "development") {
        const cookieStore = await cookies()
        const devUserId = cookieStore.get("dev-user-id")?.value
        if (devUserId) {
            const devUser = await prisma.user.findUnique({
                where: { id: devUserId },
                include: { organization: true }
            })
            if (devUser) {
                user = {
                    id: devUser.id,
                    name: devUser.name,
                    email: devUser.email,
                    image: devUser.image,
                    role: devUser.role,
                    organizationId: devUser.organizationId
                } as any
            }
        }
    }

    if (!user) redirect("/")
    return user
}

export default async function ClassroomsPage() {
    const user = await getUser()

    const classrooms = await prisma.classroom.findMany({
        where: { organizationId: user.organizationId! },
        include: {
            teachers: { select: { id: true, name: true, email: true } },
            _count: { select: { sessions: true, resources: true } }
        },
        orderBy: { createdAt: "desc" }
    })

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Classrooms</h1>
                    <p className="text-slate-500">Manage your training classrooms and groups</p>
                </div>
                <Link href="/dashboard/classrooms/new">
                    <Button>
                        <Plus className="w-4 h-4 mr-2" />
                        New Classroom
                    </Button>
                </Link>
            </div>

            {classrooms.length === 0 ? (
                <Card>
                    <CardContent className="pt-6 text-center py-12">
                        <p className="text-slate-500 mb-4">No classrooms yet. Create your first one!</p>
                        <Link href="/dashboard/classrooms/new">
                            <Button>
                                <Plus className="w-4 h-4 mr-2" />
                                Create Classroom
                            </Button>
                        </Link>
                    </CardContent>
                </Card>
            ) : (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {classrooms.map((classroom) => (
                        <Card key={classroom.id} className="hover:shadow-md transition-shadow">
                            <CardHeader>
                                <CardTitle>{classroom.name}</CardTitle>
                                <CardDescription className="line-clamp-2">
                                    {classroom.description || "No description"}
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-2 text-sm">
                                    <div className="flex justify-between">
                                        <span className="text-slate-500">Teachers:</span>
                                        <span className="font-medium">{classroom.teachers.length}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-slate-500">Sessions:</span>
                                        <span className="font-medium">{classroom._count.sessions}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-slate-500">Resources:</span>
                                        <span className="font-medium">{classroom._count.resources}</span>
                                    </div>
                                </div>
                                <div className="mt-4">
                                    <Link href={`/dashboard/classrooms/${classroom.id}`} className="block">
                                        <Button variant="outline" className="w-full">View Details</Button>
                                    </Link>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    )
}
