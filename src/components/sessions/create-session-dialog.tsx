"use client"

import { useState, useEffect } from "react"
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
    type: z.enum(["ONSITE", "ONLINE", "HOMEWORK"]),
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

interface Teacher {
    id: string
    name: string | null
    email: string
}

interface Classroom {
    id: string
    name: string
    teachers?: Teacher[]
}

interface CreateSessionDialogProps {
    classrooms: Classroom[]
    organizationId?: string
    initialDate?: Date
    open?: boolean
    onOpenChange?: (open: boolean) => void
    trigger?: React.ReactNode
}

export function CreateSessionDialog({
    classrooms,
    organizationId,
    initialDate,
    open: controlledOpen,
    onOpenChange,
    trigger
}: CreateSessionDialogProps) {
    const t = useTranslations('session')
    const [internalOpen, setInternalOpen] = useState(false)
    const router = useRouter()

    // Support both controlled and uncontrolled modes
    const isControlled = controlledOpen !== undefined
    const open = isControlled ? controlledOpen : internalOpen
    const setOpen = isControlled ? (onOpenChange || (() => {})) : setInternalOpen

    const form = useForm({
        resolver: zodResolver(formSchema),
        defaultValues: {
            classroomId: classrooms.length === 1 ? classrooms[0].id : "",
            type: "ONSITE",
            date: initialDate || new Date(),
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

    // Update date when dialog opens with a new initialDate
    useEffect(() => {
        if (open && initialDate) {
            form.setValue('date', initialDate)
        }
    }, [open, initialDate, form])

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
            {trigger !== undefined ? (
                trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>
            ) : (
                <DialogTrigger asChild>
                    <Button>{t('addSession')}</Button>
                </DialogTrigger>
            )}
            <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>{t('schedule')}</DialogTitle>
                    <DialogDescription>
                        {t('createSessionDescription')}
                    </DialogDescription>
                </DialogHeader>

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">

                        <FormField
                            control={form.control}
                            name="classroomId"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>{t('classroomLabel')}</FormLabel>
                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                        <FormControl>
                                            <SelectTrigger>
                                                <SelectValue placeholder={t('selectClassroomPlaceholder')} />
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
                            render={({ field }) => {
                                const selectedClassroomId = form.watch("classroomId")
                                const selectedClassroom = classrooms.find(c => c.id === selectedClassroomId)
                                const teachers = selectedClassroom?.teachers || []

                                return (
                                    <FormItem>
                                        <FormLabel>{t('teacherOptionalLabel')}</FormLabel>
                                        <Select onValueChange={field.onChange} value={field.value}>
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
                                )
                            }}
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
                                                <SelectItem value="HOMEWORK">📚 {t('homework')}</SelectItem>
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
                                    // Construct a Date object from the current form date and selected time
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
                                                        // Calculate current duration
                                                        const currentStartTime = field.value
                                                        const currentEndTime = form.getValues("endTime")
                                                        const [startH, startM] = currentStartTime.split(":").map(Number)
                                                        const [endH, endM] = currentEndTime.split(":").map(Number)
                                                        const durationMinutes = (endH * 60 + endM) - (startH * 60 + startM)

                                                        // Update start time
                                                        const h = newDate.getHours().toString().padStart(2, '0')
                                                        const m = newDate.getMinutes().toString().padStart(2, '0')
                                                        field.onChange(`${h}:${m}`)

                                                        // Update end time to maintain duration
                                                        if (durationMinutes > 0) {
                                                            const newEndDate = addMinutes(newDate, durationMinutes)
                                                            const newEndH = newEndDate.getHours().toString().padStart(2, '0')
                                                            const newEndM = newEndDate.getMinutes().toString().padStart(2, '0')
                                                            form.setValue("endTime", `${newEndH}:${newEndM}`)
                                                        }
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

                        <div className="grid grid-cols-2 gap-4 pt-2 border-t">
                            <FormField
                                control={form.control}
                                name="recurrence"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>{t('recurrenceLabel')}</FormLabel>
                                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                <SelectItem value="NONE">{t('recurrenceNone')}</SelectItem>
                                                <SelectItem value="DAILY">{t('recurrenceDaily')}</SelectItem>
                                                <SelectItem value="WEEKLY">{t('recurrenceWeekly')}</SelectItem>
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
                                                <FormLabel>{t('occurrencesLabel')}</FormLabel>
                                                <FormControl>
                                                    <Input type="number" min={2} max={20} {...field} />
                                                </FormControl>
                                                <FormDescription>
                                                    {t('endsOn', { date: format(endDate, "dd/MM/yyyy") })}
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
                            {t('createButton')}
                        </Button>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    )
}
