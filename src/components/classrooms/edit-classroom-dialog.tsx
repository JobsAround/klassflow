"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Loader2, Pencil } from "lucide-react"
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
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"

import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"

const formSchema = z.object({
    name: z.string().min(1, "Name is required"),
    description: z.string().optional(),
    locationOnSite: z.string().optional(),
    locationOnline: z.string().optional(),
    locationOnline2: z.string().optional(),
})

interface EditClassroomDialogProps {
    classroom: {
        id: string
        name: string
        description: string | null
        locationOnSite: string | null
        locationOnline: string | null
        locationOnline2: string | null
    }
}

export function EditClassroomDialog({ classroom }: EditClassroomDialogProps) {
    const t = useTranslations('classroom')
    const tCommon = useTranslations('common')
    const [open, setOpen] = useState(false)
    const router = useRouter()

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            name: classroom.name,
            description: classroom.description || "",
            locationOnSite: classroom.locationOnSite || "",
            locationOnline: classroom.locationOnline || "",
            locationOnline2: classroom.locationOnline2 || "",
        },
    })

    async function onSubmit(values: z.infer<typeof formSchema>) {
        try {
            const response = await fetch(`/api/classrooms/${classroom.id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(values),
            })

            if (!response.ok) {
                throw new Error("Failed to update classroom")
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
                <Button variant="outline">
                    <Pencil className="w-4 h-4 mr-2" />
                    {t('edit')}
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Edit Classroom</DialogTitle>
                    <DialogDescription>
                        Update classroom details.
                    </DialogDescription>
                </DialogHeader>

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <FormField
                            control={form.control}
                            name="name"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>{tCommon('name')}</FormLabel>
                                    <FormControl>
                                        <Input {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="description"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>{tCommon('description')}</FormLabel>
                                    <FormControl>
                                        <Textarea {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <div className="grid grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="locationOnSite"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>On-site Location</FormLabel>
                                        <FormControl>
                                            <Input {...field} placeholder="e.g. Europipe company" />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="locationOnline"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Online Location</FormLabel>
                                        <FormControl>
                                            <Input {...field} placeholder="e.g. Google Meet link" />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        <FormField
                            control={form.control}
                            name="locationOnline2"
                            render={({ field }) => (
                                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                                    <div className="space-y-0.5">
                                        <FormLabel className="text-base">{t('extraRoom')}</FormLabel>
                                        <DialogDescription>
                                            {t('extraRoomDescription')}
                                        </DialogDescription>
                                    </div>
                                    <FormControl>
                                        <Switch
                                            checked={field.value === "ENABLED"}
                                            onCheckedChange={(checked) =>
                                                field.onChange(checked ? "ENABLED" : "")
                                            }
                                        />
                                    </FormControl>
                                </FormItem>
                            )}
                        />

                        <Button type="submit" className="w-full" disabled={form.formState.isSubmitting}>
                            {form.formState.isSubmitting && (
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            )}
                            {tCommon('save')}
                        </Button>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    )
}
