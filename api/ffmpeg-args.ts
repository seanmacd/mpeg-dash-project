import {execSync} from 'child_process'

/**
 * Check if a video file has an audio stream
 */
const hasAudio = (videoPath: string): boolean => {
  try {
    const ffprobeOutput = execSync(
      `ffprobe -v error -select_streams a -show_entries stream=index -of csv=p=0 "${videoPath}"`,
      {encoding: 'utf8'}
    )
    return ffprobeOutput.trim().length > 0
  } catch (e) {
    return false
  }
}

type Rendition = {
  w: number
  h: number
  br: string
}

const RENDITIONS: Rendition[] = [
  {w: 320, h: 180, br: '20k'}, //180p low
  {w: 320, h: 180, br: '300k'}, //180p high
  {w: 512, h: 288, br: '480k'}, //240p
  {w: 640, h: 360, br: '750k'}, //360p
  {w: 768, h: 432, br: '1200k'}, //480p
  {w: 1024, h: 576, br: '1850k'}, //576p
  {w: 1280, h: 720, br: '2850k'}, //720p low
  {w: 1280, h: 720, br: '4300k'}, //720p high
  {w: 1920, h: 1080, br: '5300k'} //1080p
]

/**
 * Generate ffmpeg args for dash encoding
 */
export const ffmpegArgs = (videoPath: string, manifestPath: string) => {
  const filterComplexes: string[] = []
  const mapArgs: string[] = []

  RENDITIONS.forEach(({w, h, br}, i) => {
    filterComplexes.push(
      `[0:v]scale=w=${w}:h=${h}:force_original_aspect_ratio=decrease,pad=${w}:${h}:(ow-iw)/2:(oh-ih)/2[v${i}]`
    )
    mapArgs.push('-map', `[v${i}]`, '-b:v:' + i, br, '-c:v:' + i, 'libx264')
  })

  const adaptationSets = [`id=0,streams=${RENDITIONS.map((_, i) => i).join(',')}`]
  if (hasAudio(videoPath)) {
    adaptationSets.push(`id=1,streams=${RENDITIONS.length}`)
  }

  const args: string[] = [
    '-y',
    '-i',
    videoPath,
    '-filter_complex',
    filterComplexes.join(';'),
    ...mapArgs,
    '-map',
    '0:a?',
    '-c:a',
    'aac',
    '-b:a',
    '128k',
    '-f',
    'dash',
    '-seg_duration',
    '4',
    '-use_template',
    '1',
    '-use_timeline',
    '1',
    '-init_seg_name',
    'init_$RepresentationID$.mp4',
    '-media_seg_name',
    'chunk_$RepresentationID$_$Number$.m4s',
    '-adaptation_sets',
    adaptationSets.join(' '),
    manifestPath
  ]

  return args
}
