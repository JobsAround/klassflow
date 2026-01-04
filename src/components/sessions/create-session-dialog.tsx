"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { addMinutes, format } from "date-fns"
import { Loader2, CalendarIcon } from "lucide-react"
import { useRouter } from "next/navigation"
import { useTranslations } from 'next-intl'

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
    FormDescription,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { cn } from "@/lib/utils"
import { TimePicker } from "@/components/ui/time-picker"

const formSchema = z.object({
    classroomId: z.string().min(1, "Classroom is required"),
    type: z.enum(["ONSITE", "ONLINE"]),
    date: z.date(),
    startTime: z.string().min(1, "Start time is required"),
    endTime: z.string().min(1, "End time is required"),
    reminderEnabled: z.boolean().default(false),
    reminderHoursBefore: z.string().default("24"),
    reminderMinutesBefore: z.string().default("0"),
    signatureMinutesBefore: z.string().default("5"),
    recurrence: z.enum(["NONE", "DAILY", "WEEKLY"]).default("NONE"),
    recurrenceCount: z.string().default("1"),
    teacherId: z.string().optional(),
})

type FormValues = z.infer<typeof formSchema>

interface Classroom {
    id: string
    name: string
}

interface Teacher {
    id: string
    name: string | null
    email: string
}

interface CreateSessionDialogProps {
    classrooms: Classroom[]
    teachers: Teacher[]
    organizationId?: string
}

export function CreateSessionDialog({ classrooms, teachers, organizationId }: CreateSessionDialogProps) {
    const t = useTranslations('session')
    const [open, setOpen] = useState(false)
    const router = useRouter()

    const form = useForm({
        resolver: zodResolver(formSchema),
        defaultValues: {
            classroomId: classrooms.length === 1 ? classrooms[0].id : "",
            type: "ONSITE",
            date: new Date(),
            startTime: "09:00",
            endTime: "10:00",
            reminderEnabled: false,
            reminderHoursBefore: "24",
            reminderMinutesBefore: "0",
            signatureMinutesBefore: "5",
            recurrence: "NONE",
            recurrenceCount: "1",
            teacherId: "none",
        },
    })

    async function onSubmit(values: FormValues) {
        try {
            const dateStr = format(values.date, "yyyy-MM-dd")
            const startDateTime = new Date(`${dateStr}T${values.startTime}`)
            const endDateTime = new Date(`${dateStr}T${values.endTime}`)

            // Basic validation for end time > start time
            if (endDateTime <= startDateTime) {
                form.setError("endTime", {
                    message: "End time must be after start time"
                })
                return
            }

            const duration = (endDateTime.getTime() - startDateTime.getTime()) / (1000 * 60)

            const response = await fetch("/api/sessions", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    ...values,
                    title: null,
                    date: dateStr, // Send as string to API
                    duration,
                    reminderHoursBefore: parseInt(values.reminderHoursBefore),
                    reminderMinutesBefore: parseInt(values.reminderMinutesBefore),
                    signatureMinutesBefore: parseInt(values.signatureMinutesBefore),
                    startTime: startDateTime.toISOString(),
                    endTime: endDateTime.toISOString(),
                    recurrence: values.recurrence,
                    recurrenceCount: parseInt(values.recurrenceCount),
                    isOnline: values.type === "ONLINE",
                    teacherId: values.teacherId === "none" ? undefined : values.teacherId,
                    organizationId: organizationId,
                }),
            })

            if (!response.ok) {
                throw new Error("Failed to create session")
            }

            setOpen(false)
            form.reset()
            router.refresh()
        } catch (error) {
            console.error(error)
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button>Ajouter une séance</Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>{t('schedule')}</DialogTitle>
                    <DialogDescription>
                        Create a new class session. Students will be notified automatically.
                    </DialogDescription>
                </DialogHeader>

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">

                        <FormField
                            control={form.control}
                            name="classroomId"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Classroom</FormLabel>
                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                        <FormControl>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select a classroom" />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            {classrooms.map((classroom) => (
                                                <SelectItem key={classroom.id} value={classroom.id}>
                                                    {classroom.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="teacherId"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Teacher (Optional)</FormLabel>
                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                        <FormControl>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select a teacher" />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            <SelectItem value="none">None</SelectItem>
                                            {teachers.map((teacher) => (
                                                <SelectItem key={teacher.id} value={teacher.id}>
                                                    {teacher.name || teacher.email}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <div className="grid grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="type"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Type</FormLabel>
                                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                <SelectItem value="ONSITE">🏫 On-site</SelectItem>
                                                <SelectItem value="ONLINE">🌐 Online</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="date"
                                render={({ field }) => (
                                    <FormItem className="flex flex-col">
                                        <FormLabel>Date</FormLabel>
                                        <Popover>
                                            <PopoverTrigger asChild>
                                                <FormControl>
                                                    <Button
                                                        variant={"outline"}
                                                        className={cn(
                                                            "w-full pl-3 text-left font-normal",
                                                            !field.value && "text-muted-foreground"
                                                        )}
                                                    >
                                                        {field.value ? (
                                                            format(field.value, "dd/MM/yyyy")
                                                        ) : (
                                                            <span>Pick a date</span>
                                                        )}
                                                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                                    </Button>
                                                </FormControl>
                                            </PopoverTrigger>
                                            <PopoverContent className="w-auto p-0" align="start">
                                                <Calendar
                                                    mode="single"
                                                    selected={field.value}
                                                    onSelect={field.onChange}
                                                    initialFocus
                                                />
                                            </PopoverContent>
                                        </Popover>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="startTime"
                                render={({ field }) => {
                                    // Construct a Date object from the current form date and selected time
                                    const currentDate = form.watch("date") || new Date()
                                    const [hours, minutes] = field.value.split(":").map(Number)
                                    const timeDate = new Date(currentDate)
                                    timeDate.setHours(hours || 0)
                                    timeDate.setMinutes(minutes || 0)

                                    return (
                                        <FormItem>
                                            <FormLabel>Start Time</FormLabel>
                                            <FormControl>
                                                <TimePicker
                                                    date={timeDate}
                                                    setDate={(newDate) => {
                                                        const h = newDate.getHours().toString().padStart(2, '0')
                                                        const m = newDate.getMinutes().toString().padStart(2, '0')
                                                        field.onChange(`${h}:${m}`)
                                                    }}
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )
                                }}
                            />

                            <FormField
                                control={form.control}
                                name="endTime"
                                render={({ field }) => {
                                    // Construct a Date object from the current form date and selected time
                                    const currentDate = form.watch("date") || new Date()
                                    const [hours, minutes] = field.value.split(":").map(Number)
                                    const timeDate = new Date(currentDate)
                                    timeDate.setHours(hours || 0)
                                    timeDate.setMinutes(minutes || 0)

                                    return (
                                        <FormItem>
                                            <FormLabel>End Time</FormLabel>
                                            <FormControl>
                                                <TimePicker
                                                    date={timeDate}
                                                    setDate={(newDate) => {
                                                        const h = newDate.getHours().toString().padStart(2, '0')
                                                        const m = newDate.getMinutes().toString().padStart(2, '0')
                                                        field.onChange(`${h}:${m}`)
                                                    }}
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )
                                }}
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4 pt-2 border-t">
                            <FormField
                                control={form.control}
                                name="recurrence"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Recurrence</FormLabel>
                                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                <SelectItem value="NONE">Does not repeat</SelectItem>
                                                <SelectItem value="DAILY">Daily</SelectItem>
                                                <SelectItem value="WEEKLY">Weekly</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            {form.watch("recurrence") !== "NONE" && (
                                <FormField
                                    control={form.control}
                                    name="recurrenceCount"
                                    render={({ field }) => {
                                        const recurrence = form.watch("recurrence")
                                        const count = parseInt(field.value || "") || 1
                                        const startDate = form.watch("date")

                                        // Safety check: if no date is selected, use today for calculation to prevent crashes
                                        const safeStartDate = startDate || new Date()
                                        let endDate = new Date(safeStartDate)

                                        if (recurrence === "DAILY") {
                                            endDate.setDate(endDate.getDate() + (count - 1))
                                        } else if (recurrence === "WEEKLY") {
                                            endDate.setDate(endDate.getDate() + (count - 1) * 7)
                                        }

                                        return (
                                            <FormItem>
                                                <FormLabel>Occurrences</FormLabel>
                                                <FormControl>
                                                    <Input type="number" min={2} max={20} {...field} />
                                                </FormControl>
                                                <FormDescription>
                                                    Ends on {format(endDate, "dd/MM/yyyy")}
                                                </FormDescription>
                                                <FormMessage />
                                            </FormItem>
                                        )
                                    }}
                                />
                            )}
                        </div>

                        {/* Notifications section removed */}

                        <Button type="submit" className="w-full" disabled={form.formState.isSubmitting}>
                            {form.formState.isSubmitting && (
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            )}
                            Create Session
                        </Button>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    )
}
