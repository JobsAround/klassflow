"use client"

import { useState, useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { format } from "date-fns"
import { Loader2, CalendarIcon, Pencil } from "lucide-react"
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
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { cn } from "@/lib/utils"
import { TimePicker } from "@/components/ui/time-picker"

const formSchema = z.object({
    type: z.enum(["ONSITE", "ONLINE"]),
    date: z.date(),
    startTime: z.string().min(1, "Start time is required"),
    endTime: z.string().min(1, "End time is required"),
    teacherId: z.string().optional(),
})

type FormValues = z.infer<typeof formSchema>

interface EditSessionDialogProps {
    session: {
        id: string
        title: string | null
        startTime: Date
        endTime: Date
        type: "ONSITE" | "ONLINE"
        teacherId?: string | null
    }
    teachers?: { id: string; name: string | null; email: string }[]
    classroomName?: string
}

export function EditSessionDialog({ session, teachers = [], classroomName = "Classroom" }: EditSessionDialogProps) {
    const t = useTranslations('session')
    const [open, setOpen] = useState(false)
    const router = useRouter()

    const form = useForm<FormValues>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            type: session.type,
            date: new Date(session.startTime),
            startTime: format(new Date(session.startTime), "HH:mm"),
            endTime: format(new Date(session.endTime), "HH:mm"),
            teacherId: session.teacherId || "none",
        },
    })

    // Reset form when session changes or dialog opens
    useEffect(() => {
        if (open) {
            form.reset({
                type: session.type,
                date: new Date(session.startTime),
                startTime: format(new Date(session.startTime), "HH:mm"),
                endTime: format(new Date(session.endTime), "HH:mm"),
                teacherId: session.teacherId || "none",
            })
        }
    }, [open, session, form])

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

            const response = await fetch(`/api/sessions/${session.id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    startTime: startDateTime.toISOString(),
                    endTime: endDateTime.toISOString(),
                    type: values.type,
                    isOnline: values.type === "ONLINE",
                    teacherId: values.teacherId === "none" ? null : values.teacherId,
                }),
            })

            if (!response.ok) {
                throw new Error("Failed to update session")
            }

            setOpen(false)
            router.refresh()
        } catch (error) {
            console.error(error)
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="ghost" size="icon" title={t('editSessionTitle')}>
                    <Pencil className="h-4 w-4" />
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>{t('editSessionTitle')}</DialogTitle>
                    <DialogDescription>
                        {t('editSessionDescription')}
                    </DialogDescription>
                </DialogHeader>

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">

                        <div className="space-y-2">
                            <FormLabel>{t('classroomLabel')}</FormLabel>
                            <Input disabled value={classroomName} />
                        </div>

                        <FormField
                            control={form.control}
                            name="teacherId"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>{t('teacherAssignedLabel')}</FormLabel>
                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                        <FormControl>
                                            <SelectTrigger>
                                                <SelectValue placeholder={t('selectTeacherPlaceholder')} />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            <SelectItem value="none">{t('none')}</SelectItem>
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
                                        <FormLabel>{t('typeLabel')}</FormLabel>
                                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                <SelectItem value="ONSITE">🏫 {t('onsite')}</SelectItem>
                                                <SelectItem value="ONLINE">🌐 {t('online')}</SelectItem>
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
                                        <FormLabel>{t('dateLabel')}</FormLabel>
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
                                                            <span>{t('pickDate')}</span>
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
                                    const currentDate = form.watch("date") || new Date()
                                    const [hours, minutes] = field.value.split(":").map(Number)
                                    const timeDate = new Date(currentDate)
                                    timeDate.setHours(hours || 0)
                                    timeDate.setMinutes(minutes || 0)

                                    return (
                                        <FormItem>
                                            <FormLabel>{t('startTimeLabel')}</FormLabel>
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
                                    const currentDate = form.watch("date") || new Date()
                                    const [hours, minutes] = field.value.split(":").map(Number)
                                    const timeDate = new Date(currentDate)
                                    timeDate.setHours(hours || 0)
                                    timeDate.setMinutes(minutes || 0)

                                    return (
                                        <FormItem>
                                            <FormLabel>{t('endTimeLabel')}</FormLabel>
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

                        <Button type="submit" className="w-full" disabled={form.formState.isSubmitting}>
                            {form.formState.isSubmitting && (
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            )}
                            {t('saveButton')}
                        </Button>
                    </form>
                </Form>
            </DialogContent>
        </Dialog >
    )
}
