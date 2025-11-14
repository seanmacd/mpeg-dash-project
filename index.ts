import {spawn} from 'child_process'
import express from 'express'
import fs from 'fs'
import path from 'path'
import {ffmpegArgs} from './ffmpeg'

const STREAM_DIR = './streams'

function main() {
  const app = express()

  app.set('view engine', 'pug')

  if (!fs.existsSync(STREAM_DIR)) {
    fs.mkdirSync(STREAM_DIR, {recursive: true})
  }

  app.use('/streams', express.static(STREAM_DIR))

  app.get('/', (_, res) => {
    return res.render('index')
  })

  app.post('/upload', express.raw({type: 'video/*', limit: '5gb'}), async (req, res) => {
    if (!req.body || req.body.length === 0) {
      return res.status(400).send('No file uploaded')
    }

    const fileName = req.headers['x-filename']
    if (!fileName || Array.isArray(fileName)) {
      return res.status(400).send('No filename provided')
    }

    await processFile(fileName, req.body as Buffer)

    return res.send('File processed successfully')
  })

  app.listen(3000, () => {
    console.log('Server is running on http://localhost:3000')
  })
}

main()

function fixAspectRatio(videoBuffer: Buffer): Promise<Buffer> {
  const tempInputPath = path.join(STREAM_DIR, `temp_in_${Date.now()}.mp4`)
  const tempOutputPath = path.join(STREAM_DIR, `temp_out_${Date.now()}.mp4`)

  fs.writeFileSync(tempInputPath, videoBuffer)

  return new Promise((resolve, reject) => {
    console.log('Adding black borders to make video 16:9')
    const proc = spawn('ffmpeg', [
      '-i',
      tempInputPath,
      '-vf',
      'pad=ceil(iw/2)*2:ceil(ih/2)*2:color=black,scale=1920:1080:force_original_aspect_ratio=decrease,pad=1920:1080:(ow-iw)/2:(oh-ih)/2',
      '-c:a',
      'copy',
      tempOutputPath
    ])

    proc.stderr.on('data', data => {
      console.error(`[FFmpeg ERROR]: ${data}`)
    })

    proc.on('close', code => {
      if (code === 0) {
        console.log('Black borders added successfully')
        const outputBuffer = fs.readFileSync(tempOutputPath)
        fs.unlinkSync(tempInputPath)
        fs.unlinkSync(tempOutputPath)
        resolve(outputBuffer)
      } else {
        console.error(`FFmpeg process exited with code ${code}`)
        fs.unlinkSync(tempInputPath)
        if (fs.existsSync(tempOutputPath)) {
          fs.unlinkSync(tempOutputPath)
        }
        reject(new Error('Failed to add black borders'))
      }
    })
  })
}

async function processFile(fileName: string, data: Buffer) {
  const outputDir = path.join(STREAM_DIR, fileName)

  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, {recursive: true})
  }

  const videoPath = path.join(outputDir, fileName)
  fs.writeFileSync(videoPath, await fixAspectRatio(data))

  // manifest file lists all the vidoe segements for a DASH
  const manifestPath = path.join(outputDir, 'manifest.mpd')

  return new Promise<void>((resolve, reject) => {
    console.log('Running FFmpeg')
    const proc = spawn('ffmpeg', ffmpegArgs(videoPath, manifestPath))

    proc.stdout.on('data', data => {
      console.log(`[FFmpeg INFO]: ${data}`)
    })

    proc.stderr.on('data', data => {
      console.error(`[FFmpeg ERROR]: ${data}`)
    })

    proc.on('close', code => {
      if (code === 0) {
        console.log('FFmpeg process completed')
        resolve()
      } else {
        console.error(`FFmpeg process exited with code ${code}`)
        reject()
      }
    })
  })
}
