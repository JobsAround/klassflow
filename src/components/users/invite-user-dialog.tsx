"use client"

import { useState, useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Loader2, UserPlus } from "lucide-react"
import { useRouter } from "next/navigation"

import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
    FormDescription,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"

const formSchema = z.object({
    name: z.string().min(1, "Name is required"),
    email: z.string().email("Invalid email address"),
    role: z.enum(["ADMIN", "TEACHER", "STUDENT"]),
    classroomIds: z.array(z.string()).optional(),
}).refine((data) => {
    // Students must have at least one classroom
    if (data.role === "STUDENT") {
        return data.classroomIds && data.classroomIds.length > 0
    }
    return true
}, {
    message: "Students must be enrolled in at least one classroom",
    path: ["classroomIds"],
})

interface Classroom {
    id: string
    name: string
}

export function InviteUserDialog() {
    const [open, setOpen] = useState(false)
    const [classrooms, setClassrooms] = useState<Classroom[]>([])
    const router = useRouter()

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            name: "",
            email: "",
            role: "STUDENT",
            classroomIds: [],
        },
    })

    const selectedRole = form.watch("role")
    const selectedClassroomIds = form.watch("classroomIds") || []

    useEffect(() => {
        if (open) {
            fetchClassrooms()
        }
    }, [open])

    async function fetchClassrooms() {
        try {
            const response = await fetch("/api/classrooms")
            if (response.ok) {
                const data = await response.json()
                setClassrooms(data)
            }
        } catch (error) {
            console.error("Failed to fetch classrooms:", error)
        }
    }

    function toggleClassroom(classroomId: string) {
        const current = selectedClassroomIds
        const updated = current.includes(classroomId)
            ? current.filter(id => id !== classroomId)
            : [...current, classroomId]
        form.setValue("classroomIds", updated)
    }

    async function onSubmit(values: z.infer<typeof formSchema>) {
        try {
            const response = await fetch("/api/users/invite", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(values),
            })

            if (!response.ok) {
                const data = await response.json()
                throw new Error(data.error || "Failed to invite user")
            }

            setOpen(false)
            form.reset()
            router.refresh()
        } catch (error) {
            console.error(error)
            alert(error instanceof Error ? error.message : "Failed to invite user")
        }
    }

    const showClassroomSelection = selectedRole === "STUDENT" || selectedRole === "TEACHER"

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button>
                    <UserPlus className="w-4 h-4 mr-2" />
                    Invite User
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Invite User</DialogTitle>
                    <DialogDescription>
                        Pre-create an account. The user will be able to sign in with Google using this email.
                    </DialogDescription>
                </DialogHeader>

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <FormField
                            control={form.control}
                            name="name"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Name</FormLabel>
                                    <FormControl>
                                        <Input placeholder="John Doe" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="email"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Email</FormLabel>
                                    <FormControl>
                                        <Input placeholder="john@example.com" type="email" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="role"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Role</FormLabel>
                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                        <FormControl>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select a role" />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            <SelectItem value="STUDENT">Student</SelectItem>
                                            <SelectItem value="TEACHER">Teacher</SelectItem>
                                            <SelectItem value="ADMIN">Admin</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        {showClassroomSelection && (
                            <FormField
                                control={form.control}
                                name="classroomIds"
                                render={() => (
                                    <FormItem>
                                        <FormLabel>
                                            Classrooms {selectedRole === "STUDENT" && <span className="text-red-500">*</span>}
                                        </FormLabel>
                                        <FormDescription>
                                            {selectedRole === "STUDENT"
                                                ? "Select at least one classroom for this student"
                                                : "Optionally assign classrooms for this teacher"}
                                        </FormDescription>
                                        <div className="space-y-2 max-h-[200px] overflow-y-auto border rounded-md p-3">
                                            {classrooms.length === 0 ? (
                                                <p className="text-sm text-slate-500">No classrooms available</p>
                                            ) : (
                                                classrooms.map((classroom) => (
                                                    <div key={classroom.id} className="flex items-center space-x-2">
                                                        <Checkbox
                                                            id={classroom.id}
                                                            checked={selectedClassroomIds.includes(classroom.id)}
                                                            onCheckedChange={() => toggleClassroom(classroom.id)}
                                                        />
                                                        <label
                                                            htmlFor={classroom.id}
                                                            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                                                        >
                                                            {classroom.name}
                                                        </label>
                                                    </div>
                                                ))
                                            )}
                                        </div>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        )}

                        <Button type="submit" className="w-full" disabled={form.formState.isSubmitting}>
                            {form.formState.isSubmitting && (
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            )}
                            Invite User
                        </Button>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    )
}
