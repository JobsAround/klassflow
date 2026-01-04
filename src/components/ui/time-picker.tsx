"use client"

import * as React from "react"
import { Clock } from "lucide-react"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"
import { cn } from "@/lib/utils"

interface TimePickerProps {
    date?: Date
    setDate: (date: Date) => void
    className?: string
}

export function TimePicker({ date, setDate, className }: TimePickerProps) {
    const [selectedDate, setSelectedDate] = React.useState<Date>(date || new Date())

    // Update local state when prop changes
    React.useEffect(() => {
        if (date) {
            setSelectedDate(date)
        }
    }, [date])

    const hours = Array.from({ length: 24 }, (_, i) => i)
    const minutes = [0, 15, 30, 45]

    const handleTimeChange = (type: "hour" | "minute", value: number) => {
        const newDate = new Date(selectedDate)
        if (type === "hour") {
            newDate.setHours(value)
        } else {
            newDate.setMinutes(value)
        }
        setSelectedDate(newDate)
        setDate(newDate)
    }

    return (
        <Popover>
            <PopoverTrigger asChild>
                <Button
                    variant={"outline"}
                    className={cn(
                        "w-full justify-start text-left font-normal",
                        !date && "text-muted-foreground",
                        className
                    )}
                >
                    <Clock className="mr-2 h-4 w-4" />
                    {selectedDate ? (
                        selectedDate.toLocaleTimeString("fr-FR", {
                            hour: "2-digit",
                            minute: "2-digit",
                            hour12: false,
                        })
                    ) : (
                        <span>HH:MM</span>
                    )}
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-4" align="start">
                <div className="flex flex-col gap-4">
                    <div className="flex flex-col gap-2">
                        <Label className="text-xs">Heures</Label>
                        <div className="grid grid-cols-6 gap-2">
                            {hours.map((hour) => (
                                <Button
                                    key={hour}
                                    size="sm"
                                    variant={selectedDate.getHours() === hour ? "default" : "outline"}
                                    className="h-8 w-8 p-0"
                                    onClick={() => handleTimeChange("hour", hour)}
                                >
                                    {hour.toString().padStart(2, "0")}
                                </Button>
                            ))}
                        </div>
                    </div>
                    <div className="flex flex-col gap-2">
                        <Label className="text-xs">Minutes</Label>
                        <div className="flex flex-wrap gap-2">
                            {minutes.map((minute) => (
                                <Button
                                    key={minute}
                                    size="sm"
                                    variant={selectedDate.getMinutes() === minute ? "default" : "outline"}
                                    className="h-8 w-12 p-0"
                                    onClick={() => handleTimeChange("minute", minute)}
                                >
                                    {minute.toString().padStart(2, "0")}
                                </Button>
                            ))}
                        </div>
                    </div>
                </div>
            </PopoverContent>
        </Popover>
    )
}
