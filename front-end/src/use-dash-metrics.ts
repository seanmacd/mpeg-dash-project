import type {MediaPlayerClass} from 'dashjs'
import {useEffect, useState} from 'react'

type DashMetrics = {
  throughput: number
  latency: number
  droppedFrames: number
  bufferLevel: number
}

export function useDashMetrics(playerRef: React.RefObject<MediaPlayerClass | null>, intervalMs = 1000) {
  const [metrics, setMetrics] = useState<DashMetrics>({
    throughput: 0,
    latency: 0,
    droppedFrames: 0,
    bufferLevel: 0
  })

  useEffect(() => {
    const interval = setInterval(() => {
      const player = playerRef.current
      if (!player) {
        return
      }

      const throughput = player.getAverageThroughput('video')
      const latency = player.getAverageLatency('video')
      const droppedFrames = player.getVideoElement().getVideoPlaybackQuality().droppedVideoFrames
      const bufferLevel = player.getBufferLength('video')

      setMetrics({throughput, latency, droppedFrames, bufferLevel})
    }, intervalMs)

    return () => clearInterval(interval)
  }, [playerRef, intervalMs])

  return metrics
}
