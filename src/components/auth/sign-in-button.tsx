import { signIn } from "@/auth"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { AuthError } from "next-auth"
import { redirect } from "next/navigation"

export function SignIn() {
    return (
        <form
            action={async (formData) => {
                "use server"
                try {
                    const provider = process.env.RESEND_API_KEY ? "resend" : "nodemailer"
                    await signIn(provider, { email: formData.get("email"), redirectTo: "/dashboard" })
                } catch (error) {
                    if (error instanceof AuthError) {
                        switch (error.type) {
                            case "AccessDenied":
                            case "CallbackRouteError":
                                redirect("/?error=Unregistered")
                            default:
                                redirect(`/?error=${error.type}`)
                        }
                    }
                    throw error
                }
            }}
            className="flex w-full max-w-sm items-center space-x-2"
        >
            <Input type="email" name="email" placeholder="Email" required />
            <Button type="submit">Connect</Button>
        </form>
    )
}
