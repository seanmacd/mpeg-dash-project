/**
 * Hook to manage a Dash.js player
 */

import {MediaPlayer, type MediaPlayerClass, type Representation} from 'dashjs'
import {useEffect, useRef, useState, type RefObject} from 'react'

type UseDashPlayerOptions = {
  stream?: string | null
}

const toggleAbr = (player: MediaPlayerClass, on: boolean) => {
  player.updateSettings({streaming: {abr: {autoSwitchBitrate: {video: on}}}})
}

const getQualityInfo = (rep: Representation) => ({
  id: rep.id,
  width: rep.width,
  height: rep.height,
  bitrate: rep.bandwidth
})

export type Quality = ReturnType<typeof getQualityInfo>

export const ABR_AUTO_ID = '-1'

export const useDashPlayer = (ref: RefObject<HTMLVideoElement | null>, opts: UseDashPlayerOptions) => {
  const playerRef = useRef<MediaPlayerClass | null>(null)
  const [qualities, setQualities] = useState<Quality[]>([])
  const [currentQuality, setCurrentQuality] = useState<Quality | null>(null)

  const {stream} = opts

  useEffect(() => {
    if (!ref.current || !stream) {
      return
    }

    const player = MediaPlayer().create()
    player.initialize(ref.current, `${window.env.API_URL}/streams/${stream}/manifest.mpd`, true)
    toggleAbr(player, true)

    player.on(MediaPlayer.events.STREAM_INITIALIZED, () => {
      const reps = player.getRepresentationsByType('video')
      setQualities(reps.map(getQualityInfo))

      const rep = player.getCurrentRepresentationForType('video')
      setCurrentQuality(rep ? getQualityInfo(rep) : null)
    })

    player.on(MediaPlayer.events.QUALITY_CHANGE_REQUESTED, e => setCurrentQuality(getQualityInfo(e.newRepresentation)))

    playerRef.current = player

    return () => {
      player.reset()
    }
  }, [ref, stream])

  const changeQuality = (selectedId: string) => {
    if (!playerRef.current) return

    if (selectedId === ABR_AUTO_ID) {
      toggleAbr(playerRef.current, true)
      return
    }

    toggleAbr(playerRef.current, false)
    playerRef.current.setRepresentationForTypeById('video', selectedId, true)
  }

  return {playerRef, qualities, currentQuality, changeQuality}
}
