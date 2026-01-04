import jwt from 'jsonwebtoken'

const JAAS_APP_ID = process.env.JAAS_APP_ID || "vpaas-magic-cookie-59695fbdd7744384bf399a05acaf12d9"
// Default to dev key if not set, though it should be set in .env
// Note: In a real scenario, we should not hardcode these, but user provided them in chat.
// I will use process.env to allow override but fallback to provided keys for convenience in this context if env is missing.
// However, best practice is to require them in env.
// For now, I'll use the provided dev keys as defaults for development if env is missing.
const JAAS_API_KEY = process.env.JAAS_API_KEY_ID || "2a4c18" // The 'kid' (Key ID)
const JAAS_PRIVATE_KEY = process.env.JAAS_PRIVATE_KEY // Takes the full PEM content

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

export function generateJaaSJwt(user: JaaSUser, roomName: string): string {
    const privateKey = getPrivateKey()
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

export function getJaaSRoomUrl(roomName: string): string {
    return `https://8x8.vc/${JAAS_APP_ID}/${roomName}`
}
