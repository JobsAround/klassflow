import { NextRequest, NextResponse } from "next/server"
import { Ratelimit } from "@upstash/ratelimit"
import { Redis } from "@upstash/redis"
import { auth } from "@/auth"

// Create a new ratelimiter, that allows 10 requests per 10 seconds
let ratelimit: Ratelimit | undefined

try {
    if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
        ratelimit = new Ratelimit({
            redis: Redis.fromEnv(),
            limiter: Ratelimit.slidingWindow(10, "10 s"),
            analytics: true,
        })
    } else {
        console.warn("[RateLimit] Upstash Redis credentials not found, rate limiting disabled.")
    }
} catch (error) {
    console.warn("[RateLimit] Failed to initialize rate limiter:", error)
}

export async function rateLimit(req: NextRequest) {
    if (process.env.NODE_ENV === "development" || !ratelimit) {
        return { success: true, limit: 0, reset: 0, remaining: 0 }
    }

    // Use user ID if authenticated, otherwise use IP
    const session = await auth()
    const identifier = session?.user?.id || req.headers.get("x-forwarded-for") || "anonymous"

    const { success, limit, reset, remaining } = await ratelimit.limit(identifier)

    return { success, limit, reset, remaining }
}
