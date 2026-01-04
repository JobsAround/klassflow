"use client"

import { useRef, useState, useEffect, useImperativeHandle, forwardRef } from "react"
import { Button } from "@/components/ui/button"

export interface SignatureCanvasHandle {
    getData: () => string | null
    clear: () => void
    isEmpty: boolean
}

interface SignatureCanvasProps {
    onSave?: (data: string) => void
}

const SignatureCanvas = forwardRef<SignatureCanvasHandle, SignatureCanvasProps>((props, ref) => {
    const canvasRef = useRef<HTMLCanvasElement>(null)
    const [isDrawing, setIsDrawing] = useState(false)
    const [isEmpty, setIsEmpty] = useState(true)

    useImperativeHandle(ref, () => ({
        getData: () => {
            const canvas = canvasRef.current
            if (!canvas || isEmpty) return null
            return canvas.toDataURL("image/png")
        },
        clear: () => {
            const canvas = canvasRef.current
            if (!canvas) return
            const ctx = canvas.getContext("2d")
            if (!ctx) return
            ctx.clearRect(0, 0, canvas.width, canvas.height)
            setIsEmpty(true)
        },
        isEmpty
    }))

    useEffect(() => {
        const canvas = canvasRef.current
        if (!canvas) return

        const ctx = canvas.getContext("2d")
        if (!ctx) return

        // Set canvas size
        canvas.width = canvas.offsetWidth
        canvas.height = canvas.offsetHeight

        // Configure drawing style
        ctx.strokeStyle = "#000"
        ctx.lineWidth = 2
        ctx.lineCap = "round"
        ctx.lineJoin = "round"
    }, [])

    const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
        const canvas = canvasRef.current
        if (!canvas) return

        const ctx = canvas.getContext("2d")
        if (!ctx) return

        setIsDrawing(true)
        setIsEmpty(false)

        const rect = canvas.getBoundingClientRect()
        const x = "touches" in e ? e.touches[0].clientX - rect.left : e.clientX - rect.left
        const y = "touches" in e ? e.touches[0].clientY - rect.top : e.clientY - rect.top

        ctx.beginPath()
        ctx.moveTo(x, y)
    }

    const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
        if (!isDrawing) return

        const canvas = canvasRef.current
        if (!canvas) return

        const ctx = canvas.getContext("2d")
        if (!ctx) return

        const rect = canvas.getBoundingClientRect()
        const x = "touches" in e ? e.touches[0].clientX - rect.left : e.clientX - rect.left
        const y = "touches" in e ? e.touches[0].clientY - rect.top : e.clientY - rect.top

        ctx.lineTo(x, y)
        ctx.stroke()
    }

    const stopDrawing = () => {
        setIsDrawing(false)
        if (props.onSave && canvasRef.current) {
            props.onSave(canvasRef.current.toDataURL("image/png"))
        }
    }

    return (
        <div className="space-y-4">
            <div className="border-2 border-dashed border-gray-300 rounded-lg overflow-hidden bg-white">
                <canvas
                    ref={canvasRef}
                    className="w-full h-64 touch-none cursor-crosshair"
                    onMouseDown={startDrawing}
                    onMouseMove={draw}
                    onMouseUp={stopDrawing}
                    onMouseLeave={stopDrawing}
                    onTouchStart={startDrawing}
                    onTouchMove={draw}
                    onTouchEnd={stopDrawing}
                />
            </div>
            <p className="text-sm text-gray-500 text-center">
                Signez avec votre doigt ou votre souris dans la zone ci-dessus
            </p>
        </div>
    )
})

SignatureCanvas.displayName = "SignatureCanvas"

export default SignatureCanvas
