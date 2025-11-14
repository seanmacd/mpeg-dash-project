const RENDITIONS = [
  {w: 1920, h: 1080, bitrate: '5000k'},
  {w: 1280, h: 720, bitrate: '3000k'},
  {w: 854, h: 480, bitrate: '1500k'}
]

export const ffmpegArgs = (videoPath: string, manifestPath: string) => {
  const args = [
    '-y',
    '-i',
    videoPath,

    // Video codec settings
    '-c:v',
    'libx264',
    '-c:a',
    'aac',
    '-bf',
    '1',
    '-g',
    '60',
    '-keyint_min',
    '60',
    '-sc_threshold',
    '0'
  ]

  RENDITIONS.forEach((r, i) => {
    args.push(
      '-map',
      '0:v',
      `-b:v:${i}`,
      r.bitrate,
      `-vf:v:${i}`,
      `scale=${r.w}:${r.h}:force_original_aspect_ratio=decrease,pad=${r.w}:${r.h}:(ow-iw)/2:(oh-ih)/2`
    )
  })

  // Audio (optional)
  args.push('-map', '0:a?')

  // DASH output settings
  args.push(
    '-use_template',
    '1',
    '-use_timeline',
    '1',
    '-init_seg_name',
    'init_$RepresentationID$.m4s',
    '-media_seg_name',
    'chunk_$RepresentationID$_$Number$.m4s',
    '-adaptation_sets',
    'id=0,streams=v id=1,streams=a',
    '-f',
    'dash',
    manifestPath
  )

  return args
}
