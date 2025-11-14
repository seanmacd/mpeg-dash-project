export const ffmpegArgs = (videoPath: string, manifestPath: string) => [
  '-y',
  '-i',
  videoPath,

  // 1080p
  '-map',
  '0:v',
  '-b:v:0',
  '5000k',
  '-s:v:0',
  '1920x1080',

  // 720p
  '-map',
  '0:v',
  '-b:v:1',
  '3000k',
  '-s:v:1',
  '1280x720',

  // 480p
  '-map',
  '0:v',
  '-b:v:2',
  '1500k',
  '-s:v:2',
  '854x480',

  // Audio (optional)
  '-map',
  '0:a?',

  // Codecs
  '-c:v',
  'libx264',
  '-c:a',
  'aac',

  // Quality / GOP alignment
  '-bf',
  '1',
  '-g',
  '60',
  '-keyint_min',
  '60',
  '-sc_threshold',
  '0',

  // Output configuration
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

  // Output format
  '-f',
  'dash',

  // Manifest path (and output directory)
  manifestPath
]
