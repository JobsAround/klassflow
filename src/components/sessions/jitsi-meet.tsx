'use client'

import { JaaSMeeting } from '@jitsi/react-sdk'
import { useRouter } from 'next/navigation'
import { Loader2 } from 'lucide-react'

interface JitsiMeetProps {
    appId: string
    roomName: string
    jwt: string
    displayName: string
    email?: string
    avatarUrl?: string
    onClose?: () => void
}

export function JitsiMeet({
    appId,
    roomName,
    jwt,
    displayName,
    email,
    avatarUrl,
    onClose
}: JitsiMeetProps) {
    const router = useRouter()

    return (
        <div className="h-[calc(100vh-4rem)] w-full">
            <JaaSMeeting
                appId={appId}
                roomName={roomName}
                jwt={jwt}
                configOverwrite={{
                    disableThirdPartyRequests: true,
                    disableLocalVideoFlip: true,
                    backgroundAlpha: 0.5
                }}
                interfaceConfigOverwrite={{
                    VIDEO_LAYOUT_FIT: 'both',
                    MOBILE_APP_PROMO: false,
                    TILE_VIEW_MAX_COLUMNS: 4
                }}
                userInfo={{
                    displayName: displayName,
                    email: email || "",
                }}
                spinner={() => (
                    <div className="flex items-center justify-center h-full">
                        <Loader2 className="w-10 h-10 animate-spin text-blue-600" />
                    </div>
                )}
                onApiReady={(externalApi) => {
                    // Here you can attach custom event listeners to the Jitsi Meet External API
                    // externalApi.addEventListeners({
                    //     videoConferenceLeft: handleVideoConferenceLeft,
                    // });
                }}
                onReadyToClose={() => {
                    if (onClose) {
                        onClose()
                    } else {
                        router.back()
                    }
                }}
                getIFrameRef={(iframeRef) => {
                    iframeRef.style.height = '100%'
                }}
            />
        </div>
    )
}
