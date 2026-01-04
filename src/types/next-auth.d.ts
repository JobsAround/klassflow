import { DefaultSession } from "next-auth"
import { Role } from "@prisma/client"

declare module "next-auth" {
    interface Session {
        user: {
            role: Role
            organizationId: string | null
            id: string
        } & DefaultSession["user"]
    }

    interface User {
        role: Role
        organizationId: string | null
    }
}
