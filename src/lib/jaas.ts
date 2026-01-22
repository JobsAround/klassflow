import jwt from 'jsonwebtoken'

// JaaS configuration - all values must come from environment variables
const JAAS_APP_ID = process.env.JAAS_APP_ID
const JAAS_API_KEY = process.env.JAAS_API_KEY_ID // The 'kid' (Key ID)
const JAAS_PRIVATE_KEY = process.env.JAAS_PRIVATE_KEY // Takes the full PEM content

function isJaaSConfigured(): boolean {
    return !!(JAAS_APP_ID && JAAS_API_KEY && JAAS_PRIVATE_KEY)
}

// Helper to get private key (handle multiline env vars)
const getPrivateKey = () => {
    if (!JAAS_PRIVATE_KEY) {
        console.warn("JAAS_PRIVATE_KEY is not set. JaaS tokens will fail to sign.")
        return ""
    }
    return JAAS_PRIVATE_KEY.replace(/\\n/g, '\n')
}

interface JaaSUser {
    id: string
    name: string
    email: string
    avatar?: string
    isModerator: boolean
}

export function generateJaaSJwt(user: JaaSUser, roomName: string): string | null {
    if (!isJaaSConfigured()) {
        console.warn("JaaS is not configured. Set JAAS_APP_ID, JAAS_API_KEY_ID, and JAAS_PRIVATE_KEY environment variables.")
        return null
    }

    const privateKey = getPrivateKey()
    if (!privateKey) {
        return null
    }

    const now = Math.floor(Date.now() / 1000)
    const exp = now + 7200 // 2 hours validity
    const nbf = now - 10 // 10 seconds leeway

    const payload = {
        aud: "jitsi",
        iss: "chat",
        sub: JAAS_APP_ID,
        room: roomName,
        iat: now,
        exp: exp,
        nbf: nbf,
        context: {
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                avatar: user.avatar,
                moderator: user.isModerator
            },
            features: {
                recording: user.isModerator,
                livestreaming: user.isModerator,
                transcription: user.isModerator,
                "outbound-call": user.isModerator
            }
        }
    }

    // The 'kid' header is crucial for JaaS to identify which key verified the signature
    const token = jwt.sign(payload, privateKey, {
        algorithm: 'RS256',
        header: {
            kid: JAAS_API_KEY,
            alg: 'RS256'
        }
    })

    return token
}

export function getJaaSRoomUrl(roomName: string): string | null {
    if (!JAAS_APP_ID) {
        console.warn("JAAS_APP_ID is not set. Cannot generate JaaS room URL.")
        return null
    }
    return `https://8x8.vc/${JAAS_APP_ID}/${roomName}`
}

export { isJaaSConfigured }
