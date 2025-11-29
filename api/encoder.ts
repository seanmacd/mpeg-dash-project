import {spawn} from 'child_process'

import {EventEmitter} from 'events'
import {ffmpegArgs} from './ffmpeg-args'

export const encoderEvents = new EventEmitter()

export const encodeFile = (jobId: string, manifestPath: string, videoPath: string) => {
  return new Promise<void>((resolve, reject) => {
    console.log('Running FFmpeg')
    const proc = spawn('ffmpeg', ffmpegArgs(videoPath, manifestPath))

    const logger = (data: string) => console.log(`[FFmpeg]: ${data}`)
    proc.stdout.on('data', logger)
    proc.stderr.on('data', logger)

    proc.on('close', code => {
      if (code === 0) {
        console.log('[FFmpeg] Process completed successfully')
        encoderEvents.emit('complete', jobId)
        resolve()
      } else {
        console.error(`[FFmpeg] Process exited with error code ${code}`)
        encoderEvents.emit('failed', jobId)
        reject()
      }
    })

    proc.on('error', reject)
  })
}
